"""
Middleware de Segurança Avançado
===============================

Sistema completo de middleware de segurança com:
- Rate limiting avançado e inteligente
- Validação de entrada robusta
- Headers de segurança otimizados
- Logging de segurança detalhado
- Detecção de ataques e anomalias
- Bloqueio automático de IPs maliciosos

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
"""

import re
import json
import time
import hashlib
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify, g
from functools import wraps
import ipaddress
import user_agents
from urllib.parse import urlparse, parse_qs

# Import do Redis Rate Limiter
try:
    from core.performance.redis_rate_limiter import distributed_rate_limiter, get_distributed_rate_limiter_stats
    REDIS_RATE_LIMITER_AVAILABLE = True
except ImportError:
    REDIS_RATE_LIMITER_AVAILABLE = False


# Logger específico para segurança
security_logger = logging.getLogger('security.middleware')


@dataclass
class SecurityEvent:
    """Evento de segurança detectado"""
    timestamp: datetime
    event_type: str
    severity: str  # low, medium, high, critical
    client_ip: str
    user_agent: str
    endpoint: str
    method: str
    details: Dict[str, Any]
    blocked: bool = False


@dataclass
class ClientProfile:
    """Perfil comportamental de um cliente"""
    ip: str
    first_seen: datetime
    last_seen: datetime
    request_count: int
    blocked_count: int
    security_score: float  # 0-100, menor = mais suspeito
    user_agents: Set[str]
    endpoints_accessed: Set[str]
    request_patterns: List[Dict]
    geographic_info: Dict[str, Any]
    is_whitelisted: bool = False
    is_blacklisted: bool = False


class AttackPatternDetector:
    """Detector de padrões de ataque"""
    
    def __init__(self):
        # Padrões de SQL Injection
        self.sql_injection_patterns = [
            r"('|\"|;|\||`)",
            r"(union|select|insert|update|delete|drop|create|alter|exec|execute)\s",
            r"(information_schema|sysobjects|pg_class)",
            r"(@@version|version\(\))",
            r"(load_file|into\s+outfile)",
            r"(benchmark\s*\(|sleep\s*\()",
        ]
        
        # Padrões de XSS
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
            r"data:.*base64",
            r"expression\s*\(",
        ]
        
        # Padrões de Path Traversal
        self.path_traversal_patterns = [
            r"\.\./",
            r"\.\.\\"",
            r"%2e%2e%2f",
            r"%2e%2e%5c",
            r"\.\.%2f",
            r"\.\.%5c",
        ]
        
        # Padrões de Command Injection
        self.command_injection_patterns = [
            r"[;&|`]",
            r"\$\([^)]*\)",
            r"`[^`]*`",
            r"(wget|curl|nc|netcat|ping|nslookup)\s",
            r"(cat|ls|ps|kill|rm|chmod)\s",
        ]
        
        # User-Agents suspeitos
        self.suspicious_user_agents = [
            r"scanner",
            r"bot",
            r"crawl",
            r"spider",
            r"python-requests",
            r"curl/",
            r"wget/",
        ]
    
    def detect_sql_injection(self, text: str) -> Tuple[bool, List[str]]:
        """Detecta tentativas de SQL injection"""
        matches = []
        text_lower = text.lower()
        
        for pattern in self.sql_injection_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                matches.append(pattern)
        
        return len(matches) > 0, matches
    
    def detect_xss(self, text: str) -> Tuple[bool, List[str]]:
        """Detecta tentativas de XSS"""
        matches = []
        
        for pattern in self.xss_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                matches.append(pattern)
        
        return len(matches) > 0, matches
    
    def detect_path_traversal(self, text: str) -> Tuple[bool, List[str]]:
        """Detecta tentativas de path traversal"""
        matches = []
        
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                matches.append(pattern)
        
        return len(matches) > 0, matches
    
    def detect_command_injection(self, text: str) -> Tuple[bool, List[str]]:
        """Detecta tentativas de command injection"""
        matches = []
        
        for pattern in self.command_injection_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                matches.append(pattern)
        
        return len(matches) > 0, matches
    
    def analyze_user_agent(self, user_agent: str) -> Tuple[bool, str]:
        """Analisa se user-agent é suspeito"""
        if not user_agent:
            return True, "empty_user_agent"
        
        user_agent_lower = user_agent.lower()
        
        for pattern in self.suspicious_user_agents:
            if re.search(pattern, user_agent_lower):
                return True, pattern
        
        # Verificar se é um user-agent muito genérico
        if len(user_agent) < 10 or user_agent in ["test", "curl", "wget"]:
            return True, "generic_user_agent"
        
        return False, ""
    
    def comprehensive_analysis(self, text: str, user_agent: str = "") -> Dict[str, Any]:
        """Análise abrangente de segurança"""
        results = {
            'is_malicious': False,
            'risk_score': 0,
            'detected_attacks': [],
            'details': {}
        }
        
        # Análise de SQL Injection
        sql_detected, sql_patterns = self.detect_sql_injection(text)
        if sql_detected:
            results['detected_attacks'].append('sql_injection')
            results['risk_score'] += 40
            results['details']['sql_patterns'] = sql_patterns
        
        # Análise de XSS
        xss_detected, xss_patterns = self.detect_xss(text)
        if xss_detected:
            results['detected_attacks'].append('xss')
            results['risk_score'] += 30
            results['details']['xss_patterns'] = xss_patterns
        
        # Análise de Path Traversal
        path_detected, path_patterns = self.detect_path_traversal(text)
        if path_detected:
            results['detected_attacks'].append('path_traversal')
            results['risk_score'] += 35
            results['details']['path_patterns'] = path_patterns
        
        # Análise de Command Injection
        cmd_detected, cmd_patterns = self.detect_command_injection(text)
        if cmd_detected:
            results['detected_attacks'].append('command_injection')
            results['risk_score'] += 45
            results['details']['cmd_patterns'] = cmd_patterns
        
        # Análise de User-Agent
        if user_agent:
            ua_suspicious, ua_reason = self.analyze_user_agent(user_agent)
            if ua_suspicious:
                results['detected_attacks'].append('suspicious_user_agent')
                results['risk_score'] += 20
                results['details']['user_agent_reason'] = ua_reason
        
        results['is_malicious'] = results['risk_score'] > 30
        return results


class IntelligentRateLimiter:
    """Rate limiter inteligente com análise comportamental"""
    
    def __init__(self):
        self.client_profiles: Dict[str, ClientProfile] = {}
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.blocked_ips: Dict[str, datetime] = {}
        self.whitelisted_ips: Set[str] = set()
        self.lock = threading.RLock()
        
        # Configurações de rate limiting adaptativo
        self.base_limits = {
            'normal': {'requests_per_minute': 60, 'burst': 10},
            'suspicious': {'requests_per_minute': 20, 'burst': 3},
            'high_risk': {'requests_per_minute': 5, 'burst': 1},
            'whitelisted': {'requests_per_minute': 300, 'burst': 50}
        }
        
        # Configurações de bloqueio
        self.block_durations = {
            'temporary': timedelta(minutes=15),
            'moderate': timedelta(hours=1),
            'severe': timedelta(hours=24),
            'permanent': timedelta(days=365)
        }
    
    def _get_client_profile(self, ip: str) -> ClientProfile:
        """Obtém ou cria perfil do cliente"""
        if ip not in self.client_profiles:
            self.client_profiles[ip] = ClientProfile(
                ip=ip,
                first_seen=datetime.now(),
                last_seen=datetime.now(),
                request_count=0,
                blocked_count=0,
                security_score=100.0,
                user_agents=set(),
                endpoints_accessed=set(),
                request_patterns=[],
                geographic_info={}
            )
        return self.client_profiles[ip]
    
    def _calculate_security_score(self, profile: ClientProfile, request_data: Dict) -> float:
        """Calcula score de segurança baseado no comportamento"""
        score = profile.security_score
        
        # Penalizar por múltiplos user-agents
        if len(profile.user_agents) > 5:
            score -= 10
        
        # Penalizar por muitos endpoints diferentes
        if len(profile.endpoints_accessed) > 20:
            score -= 15
        
        # Penalizar por frequência alta
        if profile.request_count > 1000:
            score -= 20
        
        # Penalizar por histórico de bloqueios
        score -= profile.blocked_count * 5
        
        # Analisar padrões de request
        recent_requests = profile.request_patterns[-10:]
        if len(recent_requests) > 5:
            # Verificar se há padrão de burst
            times = [r['timestamp'] for r in recent_requests]
            if len(times) > 1:
                intervals = [(times[i] - times[i-1]).total_seconds() for i in range(1, len(times))]
                avg_interval = sum(intervals) / len(intervals)
                if avg_interval < 1:  # Menos de 1 segundo entre requests
                    score -= 25
        
        return max(0, min(100, score))
    
    def _get_rate_limit_category(self, security_score: float, is_whitelisted: bool) -> str:
        """Determina categoria de rate limiting"""
        if is_whitelisted:
            return 'whitelisted'
        elif security_score >= 80:
            return 'normal'
        elif security_score >= 50:
            return 'suspicious'
        else:
            return 'high_risk'
    
    def check_rate_limit(self, ip: str, endpoint: str, method: str, user_agent: str) -> Tuple[bool, Dict[str, Any]]:
        """Verifica rate limit com análise inteligente"""
        with self.lock:
            now = datetime.now()
            
            # Verificar se IP está bloqueado
            if ip in self.blocked_ips:
                if now < self.blocked_ips[ip]:
                    return False, {
                        'reason': 'ip_blocked',
                        'blocked_until': self.blocked_ips[ip].isoformat(),
                        'category': 'blocked'
                    }
                else:
                    # Remover bloqueio expirado
                    del self.blocked_ips[ip]
            
            # Obter perfil do cliente
            profile = self._get_client_profile(ip)
            profile.last_seen = now
            profile.request_count += 1
            profile.user_agents.add(user_agent)
            profile.endpoints_accessed.add(endpoint)
            
            # Adicionar request ao histórico
            request_data = {
                'timestamp': now,
                'endpoint': endpoint,
                'method': method,
                'user_agent': user_agent
            }
            profile.request_patterns.append(request_data)
            
            # Calcular score de segurança
            profile.security_score = self._calculate_security_score(profile, request_data)
            
            # Determinar categoria de rate limiting
            category = self._get_rate_limit_category(profile.security_score, profile.is_whitelisted)
            limits = self.base_limits[category]
            
            # Verificar rate limit
            minute_ago = now - timedelta(minutes=1)
            recent_requests = [r for r in profile.request_patterns if r['timestamp'] > minute_ago]
            
            current_rate = len(recent_requests)
            allowed = current_rate < limits['requests_per_minute']
            
            # Verificar burst
            last_10_seconds = now - timedelta(seconds=10)
            burst_requests = [r for r in profile.request_patterns if r['timestamp'] > last_10_seconds]
            burst_allowed = len(burst_requests) < limits['burst']
            
            is_allowed = allowed and burst_allowed
            
            if not is_allowed:
                profile.blocked_count += 1
                
                # Determinar duração do bloqueio baseado na gravidade
                if profile.security_score < 20:
                    block_duration = self.block_durations['severe']
                elif profile.security_score < 50:
                    block_duration = self.block_durations['moderate']
                else:
                    block_duration = self.block_durations['temporary']
                
                self.blocked_ips[ip] = now + block_duration
                
                security_logger.warning(f"IP {ip} bloqueado por rate limit - Score: {profile.security_score:.1f}")
            
            return is_allowed, {
                'category': category,
                'security_score': profile.security_score,
                'current_rate': current_rate,
                'limit': limits['requests_per_minute'],
                'burst_count': len(burst_requests),
                'burst_limit': limits['burst'],
                'blocked_count': profile.blocked_count
            }


class SecurityMiddleware:
    """Middleware principal de segurança"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.attack_detector = AttackPatternDetector()
        
        # Use Redis rate limiter se disponível, senão fallback para local
        if REDIS_RATE_LIMITER_AVAILABLE:
            self.rate_limiter = distributed_rate_limiter
            self.use_redis_rate_limiter = True
            security_logger.info("🔥 Redis Rate Limiter ativado")
        else:
            self.rate_limiter = IntelligentRateLimiter()
            self.use_redis_rate_limiter = False
            security_logger.info("⚠️ Usando Rate Limiter local (Redis indisponível)")
        
        self.security_events: List[SecurityEvent] = []
        self.blocked_requests_count = 0
        self.total_requests_count = 0
        
        # Headers de segurança padrão
        self.security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'X-Robots-Tag': 'noindex, nofollow',
        }
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Inicializa middleware com a aplicação Flask"""
        self.app = app
        
        # Registrar handlers
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        app.errorhandler(429)(self.handle_rate_limit_exceeded)
        app.errorhandler(403)(self.handle_forbidden)
        
        security_logger.info("SecurityMiddleware inicializado")
    
    def before_request(self):
        """Processamento antes de cada request"""
        start_time = time.time()
        g.security_start_time = start_time
        
        self.total_requests_count += 1
        
        # Obter informações da request
        client_ip = self._get_client_ip()
        user_agent = request.headers.get('User-Agent', '')
        endpoint = request.endpoint or request.path
        method = request.method
        
        # Análise de segurança da URL
        url_analysis = self.attack_detector.comprehensive_analysis(
            request.url + str(request.args), user_agent
        )
        
        # Análise do payload se existir
        payload_analysis = {'is_malicious': False, 'risk_score': 0}
        if request.is_json:
            try:
                json_data = request.get_json()
                if json_data:
                    payload_text = json.dumps(json_data)
                    payload_analysis = self.attack_detector.comprehensive_analysis(payload_text, user_agent)
            except:
                payload_analysis = {'is_malicious': True, 'risk_score': 50, 'detected_attacks': ['invalid_json']}
        
        # Verificar rate limiting
        rate_limit_allowed, rate_limit_info = self.rate_limiter.check_rate_limit(
            client_ip, endpoint, method, user_agent
        )
        
        # Determinar se deve bloquear
        should_block = False
        block_reason = None
        
        if not rate_limit_allowed:
            should_block = True
            block_reason = 'rate_limit_exceeded'
        elif url_analysis['is_malicious'] or payload_analysis['is_malicious']:
            should_block = True
            block_reason = 'malicious_request'
        
        # Registrar evento de segurança
        if should_block or url_analysis['risk_score'] > 0 or payload_analysis['risk_score'] > 0:
            severity = self._calculate_severity(url_analysis, payload_analysis, rate_limit_info)
            
            event = SecurityEvent(
                timestamp=datetime.now(),
                event_type=block_reason or 'suspicious_activity',
                severity=severity,
                client_ip=client_ip,
                user_agent=user_agent,
                endpoint=endpoint,
                method=method,
                details={
                    'url_analysis': url_analysis,
                    'payload_analysis': payload_analysis,
                    'rate_limit_info': rate_limit_info
                },
                blocked=should_block
            )
            
            self._log_security_event(event)
        
        # Bloquear se necessário
        if should_block:
            self.blocked_requests_count += 1
            
            if block_reason == 'rate_limit_exceeded':
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'error_code': 'RATE_LIMIT_EXCEEDED',
                    'retry_after_seconds': 60,
                    'timestamp': datetime.now().isoformat()
                }), 429
            else:
                return jsonify({
                    'error': 'Request blocked by security filters',
                    'error_code': 'SECURITY_VIOLATION',
                    'timestamp': datetime.now().isoformat()
                }), 403
        
        # Armazenar informações para uso posterior
        g.security_info = {
            'client_ip': client_ip,
            'user_agent': user_agent,
            'url_analysis': url_analysis,
            'payload_analysis': payload_analysis,
            'rate_limit_info': rate_limit_info
        }
    
    def after_request(self, response):
        """Processamento após cada response"""
        # Adicionar headers de segurança
        for header, value in self.security_headers.items():
            response.headers[header] = value
        
        # Header HSTS apenas para HTTPS
        if request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # CSP personalizado baseado no endpoint
        csp = self._get_content_security_policy()
        response.headers['Content-Security-Policy'] = csp
        
        # Headers de rate limiting
        if hasattr(g, 'security_info'):
            rate_info = g.security_info.get('rate_limit_info', {})
            if rate_info:
                response.headers['X-RateLimit-Category'] = rate_info.get('category', 'unknown')
                response.headers['X-RateLimit-Limit'] = str(rate_info.get('limit', 0))
                response.headers['X-RateLimit-Remaining'] = str(max(0, rate_info.get('limit', 0) - rate_info.get('current_rate', 0)))
        
        # Calcular tempo de processamento
        if hasattr(g, 'security_start_time'):
            processing_time = (time.time() - g.security_start_time) * 1000
            response.headers['X-Processing-Time'] = f"{processing_time:.2f}ms"
        
        # Remover headers que revelam informação do servidor
        response.headers.pop('Server', None)
        response.headers.pop('X-Powered-By', None)
        
        return response
    
    def _get_client_ip(self) -> str:
        """Obtém IP real do cliente considerando proxies"""
        # Verificar headers de proxy em ordem de prioridade
        headers_to_check = [
            'X-Forwarded-For',
            'X-Real-IP',
            'CF-Connecting-IP',  # Cloudflare
            'X-Client-IP',
            'X-Cluster-Client-IP'
        ]
        
        for header in headers_to_check:
            ip = request.headers.get(header)
            if ip:
                # Pegar primeiro IP se houver múltiplos
                ip = ip.split(',')[0].strip()
                if self._is_valid_ip(ip):
                    return ip
        
        return request.remote_addr or 'unknown'
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Valida se string é um IP válido"""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    def _get_content_security_policy(self) -> str:
        """Gera CSP baseado no contexto"""
        if request.endpoint and 'api' in request.endpoint:
            # CSP restritivo para APIs
            return ("default-src 'none'; "
                   "connect-src 'self'; "
                   "frame-ancestors 'none'; "
                   "base-uri 'none'")
        else:
            # CSP para frontend
            return ("default-src 'self'; "
                   "script-src 'self' 'unsafe-inline'; "
                   "style-src 'self' 'unsafe-inline'; "
                   "img-src 'self' data: https:; "
                   "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai; "
                   "frame-ancestors 'none'; "
                   "base-uri 'self'")
    
    def _calculate_severity(self, url_analysis: Dict, payload_analysis: Dict, rate_limit_info: Dict) -> str:
        """Calcula severidade do evento"""
        total_risk = url_analysis.get('risk_score', 0) + payload_analysis.get('risk_score', 0)
        security_score = rate_limit_info.get('security_score', 100)
        
        if total_risk >= 70 or security_score <= 20:
            return 'critical'
        elif total_risk >= 40 or security_score <= 50:
            return 'high'
        elif total_risk >= 20 or security_score <= 80:
            return 'medium'
        else:
            return 'low'
    
    def _log_security_event(self, event: SecurityEvent):
        """Registra evento de segurança"""
        self.security_events.append(event)
        
        # Manter apenas últimos 10000 eventos
        if len(self.security_events) > 10000:
            self.security_events = self.security_events[-10000:]
        
        # Log estruturado
        log_data = {
            'timestamp': event.timestamp.isoformat(),
            'event_type': event.event_type,
            'severity': event.severity,
            'client_ip': event.client_ip,
            'endpoint': event.endpoint,
            'method': event.method,
            'blocked': event.blocked,
            'details': event.details
        }
        
        log_level = {
            'critical': logging.CRITICAL,
            'high': logging.ERROR,
            'medium': logging.WARNING,
            'low': logging.INFO
        }.get(event.severity, logging.INFO)
        
        security_logger.log(log_level, f"SECURITY_EVENT: {json.dumps(log_data)}")
    
    def handle_rate_limit_exceeded(self, error):
        """Handler para erro 429"""
        return jsonify({
            'error': 'Too Many Requests',
            'error_code': 'RATE_LIMIT_EXCEEDED',
            'message': 'Rate limit exceeded. Please slow down your requests.',
            'retry_after_seconds': 60,
            'timestamp': datetime.now().isoformat()
        }), 429
    
    def handle_forbidden(self, error):
        """Handler para erro 403"""
        return jsonify({
            'error': 'Forbidden',
            'error_code': 'SECURITY_VIOLATION',
            'message': 'Request blocked by security filters.',
            'timestamp': datetime.now().isoformat()
        }), 403
    
    def get_security_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de segurança"""
        now = datetime.now()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)
        
        recent_events = [e for e in self.security_events if e.timestamp > last_hour]
        daily_events = [e for e in self.security_events if e.timestamp > last_24h]
        
        base_stats = {
            'total_requests': self.total_requests_count,
            'blocked_requests': self.blocked_requests_count,
            'block_rate': (self.blocked_requests_count / max(1, self.total_requests_count)) * 100,
            'events_last_hour': len(recent_events),
            'events_last_24h': len(daily_events),
            'top_attack_types': self._get_top_attack_types(daily_events),
            'severity_distribution': self._get_severity_distribution(daily_events),
            'rate_limiter_type': 'redis_distributed' if self.use_redis_rate_limiter else 'local'
        }
        
        # Adicionar estatísticas específicas do rate limiter
        if self.use_redis_rate_limiter and hasattr(self.rate_limiter, 'get_stats'):
            rate_limiter_stats = self.rate_limiter.get_stats()
            base_stats['rate_limiter_stats'] = rate_limiter_stats
        else:
            # Stats do rate limiter local
            if hasattr(self.rate_limiter, 'client_profiles') and hasattr(self.rate_limiter, 'blocked_ips'):
                base_stats.update({
                    'active_clients': len(self.rate_limiter.client_profiles),
                    'blocked_ips': len(self.rate_limiter.blocked_ips)
                })
        
        return base_stats
    
    def _get_top_attack_types(self, events: List[SecurityEvent]) -> Dict[str, int]:
        """Obtém tipos de ataque mais comuns"""
        attack_counts = defaultdict(int)
        for event in events:
            attack_counts[event.event_type] += 1
        return dict(sorted(attack_counts.items(), key=lambda x: x[1], reverse=True)[:10])
    
    def _get_severity_distribution(self, events: List[SecurityEvent]) -> Dict[str, int]:
        """Obtém distribuição de severidade"""
        severity_counts = defaultdict(int)
        for event in events:
            severity_counts[event.severity] += 1
        return dict(severity_counts)


# Função para criar middleware facilmente
def create_security_middleware(app: Flask) -> SecurityMiddleware:
    """Cria e configura middleware de segurança"""
    return SecurityMiddleware(app)