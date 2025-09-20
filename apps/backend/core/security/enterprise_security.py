"""
Enterprise Security Framework
Sistema completo de segurança com rate limiting avançado e proteção em tempo real
"""

import time
import hashlib
import re
import threading
import ipaddress
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from collections import defaultdict, deque
from dataclasses import dataclass
from enum import Enum
from functools import wraps
from flask import Flask, request, jsonify, g
import logging

from core.database import get_db_connection

logger = logging.getLogger(__name__)

class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AttackType(Enum):
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    CSRF = "csrf"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    BRUTE_FORCE = "brute_force"
    SUSPICIOUS_USER_AGENT = "suspicious_user_agent"
    IP_SCANNING = "ip_scanning"

@dataclass
class SecurityIncident:
    incident_id: str
    ip_address: str
    attack_type: AttackType
    threat_level: ThreatLevel
    timestamp: datetime
    details: Dict[str, Any]
    blocked: bool = False

@dataclass
class RateLimitRule:
    endpoint_pattern: str
    max_requests: int
    window_seconds: int
    burst_tolerance: int = 0  # Permite rajadas curtas

class EnterpriseSecurityFramework:
    """
    Framework de segurança empresarial com proteção em tempo real
    """

    def __init__(self, app: Optional[Flask] = None):
        self.app = app
        self.db = get_db_connection()

        # Rate limiting storage (thread-safe)
        self._rate_limit_lock = threading.RLock()
        self._request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))

        # Security monitoring
        self._blocked_ips: Set[str] = set()
        self._suspicious_ips: Dict[str, int] = defaultdict(int)
        self._security_incidents: List[SecurityIncident] = []

        # Attack patterns
        self._sql_injection_patterns = [
            r"(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)",
            r"(\bor\b\s+\d+\s*=\s*\d+|\band\b\s+\d+\s*=\s*\d+)",
            r"(--|/\*|\*/|;)",
            r"(\bxp_cmdshell\b|\bsp_executesql\b)",
            r"(\'\s*or\s*\'|\"\s*or\s*\")",
        ]

        self._xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
        ]

        # Rate limiting rules por tipo de endpoint
        self._rate_limit_rules = {
            'auth': RateLimitRule('/api/auth', 5, 300, 2),  # 5 req/5min, burst 2
            'chat': RateLimitRule('/api/chat', 30, 60, 5),   # 30 req/min, burst 5
            'upload': RateLimitRule('/api/upload', 3, 60, 1), # 3 req/min, burst 1
            'admin': RateLimitRule('/api/admin', 10, 60, 2),  # 10 req/min, burst 2
            'global': RateLimitRule('.*', 100, 60, 10),       # 100 req/min global
        }

        if app:
            self.init_app(app)

    def init_app(self, app: Flask):
        """Inicializa middleware de segurança"""
        self.app = app

        @app.before_request
        def security_check():
            return self._security_check()

        @app.after_request
        def add_security_headers(response):
            return self._add_security_headers(response)

        logger.info("Enterprise Security Framework initialized")

    def _security_check(self) -> Optional[Tuple[Dict, int]]:
        """
        Verificação de segurança antes de cada request
        """
        client_ip = self._get_client_ip()
        user_agent = request.headers.get('User-Agent', '')

        # 1. Verificar se IP está bloqueado
        if self._is_ip_blocked(client_ip):
            incident = self._create_incident(
                client_ip, AttackType.RATE_LIMIT_EXCEEDED, ThreatLevel.HIGH,
                {'reason': 'IP blocked', 'endpoint': request.endpoint}
            )
            self._log_security_incident(incident)
            return jsonify({'error': 'Access denied'}), 403

        # 2. Rate limiting
        rate_limit_result = self._check_rate_limit(client_ip, request.path)
        if not rate_limit_result['allowed']:
            self._add_suspicious_ip(client_ip)
            incident = self._create_incident(
                client_ip, AttackType.RATE_LIMIT_EXCEEDED, ThreatLevel.MEDIUM,
                rate_limit_result
            )
            self._log_security_incident(incident)
            return jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': rate_limit_result.get('retry_after', 60)
            }), 429

        # 3. Detectar ataques em parâmetros
        attack_detected = self._detect_attacks()
        if attack_detected:
            self._add_suspicious_ip(client_ip)
            incident = self._create_incident(
                client_ip, attack_detected['type'], ThreatLevel.HIGH,
                attack_detected
            )
            self._log_security_incident(incident)
            return jsonify({'error': 'Security violation detected'}), 400

        # 4. User agent suspeito
        if self._is_suspicious_user_agent(user_agent):
            self._add_suspicious_ip(client_ip)
            incident = self._create_incident(
                client_ip, AttackType.SUSPICIOUS_USER_AGENT, ThreatLevel.LOW,
                {'user_agent': user_agent}
            )
            self._log_security_incident(incident)

        return None

    def _check_rate_limit(self, client_ip: str, endpoint: str) -> Dict[str, Any]:
        """
        Rate limiting avançado com sliding window
        """
        current_time = time.time()

        # Determinar regra aplicável
        rule = self._get_applicable_rule(endpoint)
        key = f"{client_ip}:{rule.endpoint_pattern}"

        with self._rate_limit_lock:
            # Obter histórico de requests
            history = self._request_history[key]

            # Remover requests fora da janela
            while history and history[0] <= current_time - rule.window_seconds:
                history.popleft()

            # Verificar limite
            current_count = len(history)

            if current_count >= rule.max_requests + rule.burst_tolerance:
                # Verificar se precisa bloquear IP
                violations = self._suspicious_ips.get(client_ip, 0)
                if violations > 5:  # 5 violações = bloqueio temporário
                    self._block_ip_temporarily(client_ip)

                return {
                    'allowed': False,
                    'current_count': current_count,
                    'limit': rule.max_requests,
                    'retry_after': rule.window_seconds,
                    'rule': rule.endpoint_pattern
                }

            # Adicionar request atual
            history.append(current_time)

            return {
                'allowed': True,
                'current_count': current_count + 1,
                'limit': rule.max_requests,
                'remaining': rule.max_requests - current_count - 1
            }

    def _get_applicable_rule(self, endpoint: str) -> RateLimitRule:
        """Determina regra de rate limiting aplicável"""
        for rule_name, rule in self._rate_limit_rules.items():
            if rule_name == 'global':
                continue
            if re.match(rule.endpoint_pattern, endpoint):
                return rule
        return self._rate_limit_rules['global']

    def _detect_attacks(self) -> Optional[Dict[str, Any]]:
        """
        Detecta ataques SQL injection, XSS, etc.
        """
        # Verificar todos os parâmetros da request
        all_params = {}

        # Query parameters
        all_params.update(request.args.to_dict())

        # Form data
        try:
            if request.form:
                all_params.update(request.form.to_dict())
        except:
            pass

        # JSON data
        try:
            if request.is_json and request.json:
                all_params.update(request.json)
        except:
            pass

        # Verificar SQL injection
        for key, value in all_params.items():
            if isinstance(value, str):
                for pattern in self._sql_injection_patterns:
                    if re.search(pattern, value, re.IGNORECASE):
                        return {
                            'type': AttackType.SQL_INJECTION,
                            'parameter': key,
                            'value': value[:100],  # Limitar tamanho
                            'pattern': pattern
                        }

                # Verificar XSS
                for pattern in self._xss_patterns:
                    if re.search(pattern, value, re.IGNORECASE):
                        return {
                            'type': AttackType.XSS,
                            'parameter': key,
                            'value': value[:100],
                            'pattern': pattern
                        }

        return None

    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Detecta user agents suspeitos"""
        if not user_agent:
            return True

        suspicious_patterns = [
            r'^curl/',
            r'^wget/',
            r'bot\b(?!.*google|.*bing|.*yahoo)',
            r'scanner',
            r'nikto',
            r'sqlmap',
            r'nmap',
            r'burp',
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, user_agent, re.IGNORECASE):
                return True

        return False

    def _add_security_headers(self, response):
        """Adiciona headers de segurança enterprise"""
        # Content Security Policy otimizado
        csp = self._get_optimized_csp()
        response.headers['Content-Security-Policy'] = csp

        # Outros headers de segurança
        response.headers.update({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'X-Request-ID': self._generate_request_id()
        })

        return response

    def _get_optimized_csp(self) -> str:
        """CSP otimizado para aplicação educacional"""
        return (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://www.google-analytics.com; "
            "connect-src 'self' https://www.google-analytics.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )

    def _get_client_ip(self) -> str:
        """Obtém IP real do cliente considerando proxies"""
        # Verificar headers de proxy
        forwarded_ips = request.headers.get('X-Forwarded-For')
        if forwarded_ips:
            # Pegar o primeiro IP (cliente original)
            client_ip = forwarded_ips.split(',')[0].strip()
        else:
            client_ip = request.headers.get('X-Real-IP', request.remote_addr)

        return client_ip or '127.0.0.1'

    def _is_ip_blocked(self, ip: str) -> bool:
        """Verifica se IP está bloqueado"""
        return ip in self._blocked_ips

    def _block_ip_temporarily(self, ip: str, duration_minutes: int = 60):
        """Bloqueia IP temporariamente"""
        self._blocked_ips.add(ip)

        # Log do bloqueio no banco
        self.db.log_audit_event(
            user_id=None,
            action='ip_blocked',
            resource='security',
            data={'ip': ip, 'duration_minutes': duration_minutes},
            ip_address=ip
        )

        # Agendar desbloqueio (simplificado - em produção usar scheduler)
        def unblock_later():
            time.sleep(duration_minutes * 60)
            self._blocked_ips.discard(ip)
            logger.info(f"IP {ip} unblocked after {duration_minutes} minutes")

        threading.Thread(target=unblock_later, daemon=True).start()
        logger.warning(f"IP {ip} blocked for {duration_minutes} minutes")

    def _add_suspicious_ip(self, ip: str):
        """Adiciona IP à lista de suspeitos"""
        self._suspicious_ips[ip] += 1

        # Auto-bloqueio após muitas violações
        if self._suspicious_ips[ip] >= 10:
            self._block_ip_temporarily(ip, 120)  # 2 horas

    def _create_incident(self, ip: str, attack_type: AttackType,
                        threat_level: ThreatLevel, details: Dict[str, Any]) -> SecurityIncident:
        """Cria incidente de segurança"""
        incident_id = hashlib.md5(f"{ip}{attack_type.value}{time.time()}".encode()).hexdigest()[:8]

        return SecurityIncident(
            incident_id=incident_id,
            ip_address=ip,
            attack_type=attack_type,
            threat_level=threat_level,
            timestamp=datetime.utcnow(),
            details=details,
            blocked=ip in self._blocked_ips
        )

    def _log_security_incident(self, incident: SecurityIncident):
        """Log do incidente no banco de dados"""
        self._security_incidents.append(incident)

        # Manter apenas últimos 1000 incidentes em memória
        if len(self._security_incidents) > 1000:
            self._security_incidents = self._security_incidents[-1000:]

        # Log no banco
        self.db.log_audit_event(
            user_id=None,
            action='security_incident',
            resource='security',
            data={
                'incident_id': incident.incident_id,
                'attack_type': incident.attack_type.value,
                'threat_level': incident.threat_level.value,
                'details': incident.details,
                'blocked': incident.blocked
            },
            ip_address=incident.ip_address
        )

        # Log crítico para alertas
        if incident.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
            logger.critical(
                f"Security incident {incident.incident_id}: "
                f"{incident.attack_type.value} from {incident.ip_address}"
            )

    def _generate_request_id(self) -> str:
        """Gera ID único para request (tracking)"""
        return hashlib.md5(f"{time.time()}{request.remote_addr}".encode()).hexdigest()[:8]

    # Métodos públicos para estatísticas e monitoramento

    def get_security_stats(self) -> Dict[str, Any]:
        """Estatísticas de segurança"""
        current_time = datetime.utcnow()
        last_hour = current_time - timedelta(hours=1)
        last_day = current_time - timedelta(days=1)

        recent_incidents = [
            i for i in self._security_incidents
            if i.timestamp > last_hour
        ]

        daily_incidents = [
            i for i in self._security_incidents
            if i.timestamp > last_day
        ]

        return {
            'blocked_ips_count': len(self._blocked_ips),
            'suspicious_ips_count': len(self._suspicious_ips),
            'incidents_last_hour': len(recent_incidents),
            'incidents_last_24h': len(daily_incidents),
            'total_incidents': len(self._security_incidents),
            'threat_levels': {
                level.value: len([i for i in daily_incidents if i.threat_level == level])
                for level in ThreatLevel
            },
            'attack_types': {
                attack.value: len([i for i in daily_incidents if i.attack_type == attack])
                for attack in AttackType
            }
        }

    def get_rate_limit_stats(self) -> Dict[str, Any]:
        """Estatísticas de rate limiting"""
        with self._rate_limit_lock:
            active_limits = {}
            for key, history in self._request_history.items():
                if history:
                    active_limits[key] = {
                        'requests_in_window': len(history),
                        'last_request': max(history),
                        'oldest_request': min(history)
                    }

            return {
                'active_rate_limits': len(active_limits),
                'total_tracked_clients': len(self._request_history),
                'rules': {name: {
                    'pattern': rule.endpoint_pattern,
                    'limit': rule.max_requests,
                    'window': rule.window_seconds
                } for name, rule in self._rate_limit_rules.items()}
            }

    def unblock_ip(self, ip: str) -> bool:
        """Desbloqueia IP manualmente"""
        if ip in self._blocked_ips:
            self._blocked_ips.remove(ip)
            self._suspicious_ips.pop(ip, None)

            # Log do desbloqueio
            self.db.log_audit_event(
                user_id=None,
                action='ip_unblocked',
                resource='security',
                data={'ip': ip, 'manual': True},
                ip_address=ip
            )

            logger.info(f"IP {ip} manually unblocked")
            return True
        return False

# Instância global
_security_framework = None

def get_security_framework() -> EnterpriseSecurityFramework:
    """Obtém instância global do framework de segurança"""
    global _security_framework
    if _security_framework is None:
        _security_framework = EnterpriseSecurityFramework()
    return _security_framework

def initialize_security_framework(app: Flask):
    """Inicializa framework de segurança"""
    global _security_framework
    _security_framework = EnterpriseSecurityFramework(app)
    logger.info("Enterprise Security Framework initialized")

# Alias para compatibilidade
SecurityOptimizer = EnterpriseSecurityFramework