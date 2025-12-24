# -*- coding: utf-8 -*-
"""
ENHANCED SECURITY OPTIMIZATIONS - SOLUÇÃO DEFINITIVA
Otimizações finais de segurança para produção
"""

import re
import time
import logging
from datetime import datetime
from typing import Dict, Any, List
from functools import wraps
from flask import Flask, request, jsonify
import threading
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

class SecurityOptimizer:
    """Otimizador de segurança para produção"""
    
    def __init__(self, app: Optional[Flask] = None):
        self.app = app
        
        # Rate limiting otimizado para SISTEMA MÉDICO
        self.rate_limits = {
            'chat': {'requests': 30, 'window': 3600},      # 30 req/hora para chat médico
            'personas': {'requests': 60, 'window': 3600},   # 60 req/hora para personas (Dr. Gasnelio/Gá)
            'health': {'requests': 300, 'window': 3600},    # 300 req/hora para health checks
            'scope': {'requests': 100, 'window': 3600},     # 100 req/hora para scope médico
            'multimodal': {'requests': 20, 'window': 3600}, # 20 req/hora para OCR/upload documentos
            'email': {'requests': 10, 'window': 3600},      # 10 req/hora para emails
            'medical_data': {'requests': 50, 'window': 3600}, # 50 req/hora para dados médicos
            'default': {'requests': 200, 'window': 3600}    # 200 req/hora default
        }
        
        # Tracking de requests por IP
        self.ip_tracking = defaultdict(lambda: defaultdict(deque))
        self.blocked_ips = {}  # IP -> timestamp de desbloqueio
        self.suspicious_ips = set()
        self.stats_lock = threading.Lock()
        
        # Padrões de ataque otimizados
        self.attack_patterns = {
            'sql_injection': [
                r"('|\"|;|\||`|--)",
                r"\b(union|select|insert|update|delete|drop|create|alter)\s",
                r"\b(information_schema|sysobjects|pg_class)\b",
                r"(@@version|version\(\))",
                r"(load_file|into\s+outfile)",
                r"(benchmark\s*\(|sleep\s*\()",
            ],
            'xss': [
                r"<script[^>]*>.*?</script>",
                r"javascript:",
                r"on\w+\s*=",
                r"<iframe[^>]*>",
                r"<object[^>]*>",
                r"<embed[^>]*>",
                r"data:.*base64",
                r"expression\s*\(",
            ],
            'path_traversal': [
                r"\.\./",
                r"\.\.\\",
                r"%2e%2e%2f",
                r"%2e%2e%5c",
                r"\.\.%2f",
                r"\.\.%5c",
            ],
            'medical_data_exposure': [
                r"\b(cpf|rg|cns|cid|crm)\s*[:=]\s*[0-9]+",
                r"\b[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2}\b",  # CPF pattern
                r"\b[0-9]{15}\b",  # CNS pattern
                r"password|senha|secret|token",
                r"api[_-]?key|access[_-]?token",
            ]
        }
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Inicializa otimizações de segurança"""
        self.app = app
        
        # Configurar middleware de segurança
        app.before_request(self._security_check)
        app.after_request(self._add_security_headers)
        
        # Configurar handlers de erro de segurança
        app.errorhandler(429)(self._handle_rate_limit)
        app.errorhandler(403)(self._handle_forbidden)
        
        logger.info("🔒 SecurityOptimizer inicializado")
    
    def _security_check(self):
        """Verificação de segurança antes da request"""
        client_ip = self._get_client_ip()
        user_agent = request.headers.get('User-Agent', '')
        path = request.path
        
        # Verificar IP bloqueado
        if self._is_ip_blocked(client_ip):
            return jsonify({
                "error": "IP temporariamente bloqueado",
                "error_code": "IP_BLOCKED",
                "retry_after": 3600
            }), 403
        
        # Rate limiting
        endpoint_type = self._get_endpoint_type(path)
        if not self._check_rate_limit(client_ip, endpoint_type):
            self._record_violation(client_ip, 'rate_limit_exceeded')
            return jsonify({
                "error": "Muitas requisições",
                "error_code": "RATE_LIMIT_EXCEEDED",
                "retry_after": 3600
            }), 429
        
        # Verificar padrões de ataque na URL
        attack_detected = self._detect_attacks(request.url + str(request.args))
        if attack_detected:
            self._record_violation(client_ip, f'attack_detected_{attack_detected}')
            self._add_suspicious_ip(client_ip)
            return jsonify({
                "error": "Request bloqueada por filtros de segurança",
                "error_code": "SECURITY_VIOLATION",
                "timestamp": datetime.now().isoformat()
            }), 403
        
        # Verificar payload JSON se existir
        if request.is_json:
            try:
                json_data = request.get_json()
                if json_data:
                    payload_text = str(json_data)
                    attack_detected = self._detect_attacks(payload_text)
                    if attack_detected:
                        self._record_violation(client_ip, f'payload_attack_{attack_detected}')
                        self._add_suspicious_ip(client_ip)
                        return jsonify({
                            "error": "Payload bloqueado por filtros de segurança",
                            "error_code": "PAYLOAD_VIOLATION"
                        }), 403
            except:
                # JSON malformado
                self._record_violation(client_ip, 'malformed_json')
                return jsonify({
                    "error": "JSON malformado",
                    "error_code": "INVALID_JSON"
                }), 400
        
        # Verificar User-Agent suspeito
        if self._is_suspicious_user_agent(user_agent):
            self._add_suspicious_ip(client_ip)
            logger.warning(f"User-Agent suspeito de {client_ip}: {user_agent[:100]}")
    
    def _add_security_headers(self, response):
        """Adiciona headers de segurança otimizados"""
        # Headers básicos de segurança
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # HSTS para HTTPS (apenas quando request é seguro)
        if request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # HTTPS enforcement para produção (não bloqueia localhost para QA)
        if not request.is_secure and request.environ.get('HTTP_X_FORWARDED_PROTO') != 'https':
            # Permite HTTP para development e QA (localhost, 127.0.0.1)
            local_hosts = ['localhost', '127.0.0.1', '0.0.0.0']
            is_local = (request.host in local_hosts or 
                       request.host.startswith('192.168.') or
                       request.host.startswith('10.') or
                       request.host.startswith('172.'))
            
            # Apenas avisar sobre HTTP em produção, não bloquear
            if not is_local:
                logger.warning(f"HTTP request em produção (não bloqueado): {request.url}")
                # Adicionar header sugerindo HTTPS mas não bloqueando
                response.headers['Upgrade'] = 'TLS/1.2, HTTP/1.1'
        
        # CSP otimizado por contexto
        csp = self._get_optimized_csp()
        response.headers['Content-Security-Policy'] = csp
        
        # Rate limit headers
        client_ip = self._get_client_ip()
        endpoint_type = self._get_endpoint_type(request.path)
        remaining = self._get_remaining_requests(client_ip, endpoint_type)
        response.headers['X-RateLimit-Limit'] = str(self.rate_limits[endpoint_type]['requests'])
        response.headers['X-RateLimit-Remaining'] = str(max(0, remaining))
        response.headers['X-RateLimit-Reset'] = str(int(time.time()) + 3600)
        
        # Remover headers que vazam informação
        response.headers.pop('Server', None)
        response.headers.pop('X-Powered-By', None)
        
        return response
    
    def _get_client_ip(self) -> str:
        """Obtém IP real do cliente considerando proxies"""
        headers_to_check = [
            'X-Forwarded-For',
            'X-Real-IP', 
            'CF-Connecting-IP',
            'X-Client-IP'
        ]
        
        for header in headers_to_check:
            ip = request.headers.get(header)
            if ip:
                # Pegar primeiro IP válido
                ip = ip.split(',')[0].strip()
                if self._is_valid_ip(ip):
                    return ip
        
        return request.remote_addr or 'unknown'
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Valida se string é um IP válido"""
        try:
            import ipaddress
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    def _get_endpoint_type(self, path: str) -> str:
        """Determina tipo de endpoint para rate limiting"""
        if '/chat' in path:
            return 'chat'
        elif '/personas' in path:
            return 'personas'
        elif '/health' in path:
            return 'health'
        elif '/scope' in path:
            return 'scope'
        else:
            return 'default'
    
    def _check_rate_limit(self, ip: str, endpoint_type: str) -> bool:
        """Verifica rate limit para IP e endpoint"""
        now = time.time()
        limit_config = self.rate_limits[endpoint_type]
        window_start = now - limit_config['window']
        
        with self.stats_lock:
            # Limpar requests antigas
            ip_requests = self.ip_tracking[ip][endpoint_type]
            while ip_requests and ip_requests[0] < window_start:
                ip_requests.popleft()
            
            # Verificar limite
            if len(ip_requests) >= limit_config['requests']:
                return False
            
            # Registrar nova request
            ip_requests.append(now)
            return True
    
    def _get_remaining_requests(self, ip: str, endpoint_type: str) -> int:
        """Retorna número de requests restantes"""
        now = time.time()
        limit_config = self.rate_limits[endpoint_type]
        window_start = now - limit_config['window']
        
        with self.stats_lock:
            ip_requests = self.ip_tracking[ip][endpoint_type]
            # Contar requests válidas
            recent_requests = sum(1 for req_time in ip_requests if req_time > window_start)
            return max(0, limit_config['requests'] - recent_requests)
    
    def _is_ip_blocked(self, ip: str) -> bool:
        """Verifica se IP está bloqueado"""
        if ip in self.blocked_ips:
            unblock_time = self.blocked_ips[ip]
            if time.time() < unblock_time:
                return True
            else:
                # IP desbloqueado
                self.blocked_ips.pop(ip, None)
        return False
    
    def _add_suspicious_ip(self, ip: str):
        """Adiciona IP à lista de suspeitos"""
        self.suspicious_ips.add(ip)
        
        # Bloquear IP se muitas violações
        violations = self._count_violations(ip)
        if violations >= 5:  # 5 violações = bloqueio
            block_until = time.time() + 3600  # 1 hora
            self.blocked_ips[ip] = block_until
            logger.warning(f"IP {ip} bloqueado por violações múltiplas ({violations})")
    
    def _count_violations(self, ip: str) -> int:
        """Conta violações de um IP (implementação simplificada)"""
        # Na versão completa, isso seria persistido em Redis/DB
        return len([1 for endpoint in self.ip_tracking[ip].values() for _ in endpoint])
    
    def _detect_attacks(self, text: str) -> Optional[str]:
        """Detecta padrões de ataque no texto"""
        text_lower = text.lower()
        
        for attack_type, patterns in self.attack_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    return attack_type
        
        return None
    
    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Verifica se User-Agent é suspeito"""
        if not user_agent or len(user_agent) < 10:
            return True
        
        # Exceções para QA e health checks legítimos
        legitimate_patterns = [
            r'QA-Automation-Health-Check',
            r'Health-Check',
            r'Monitoring'
        ]
        
        user_agent_lower = user_agent.lower()
        if any(re.search(pattern, user_agent_lower, re.IGNORECASE) for pattern in legitimate_patterns):
            return False
        
        suspicious_patterns = [
            r'scanner', r'bot', r'crawl', r'spider',
            r'python-requests', r'curl/', r'wget/',
            r'test', r'hack', r'exploit'
        ]
        
        return any(re.search(pattern, user_agent_lower) for pattern in suspicious_patterns)
    
    def _get_optimized_csp(self) -> str:
        """Gera CSP otimizado por contexto"""
        path = request.path
        
        if '/api/' in path:
            # CSP restritivo para APIs
            return ("default-src 'none'; "
                   "connect-src 'self'; "
                   "frame-ancestors 'none'; "
                   "base-uri 'none'")
        else:
            # CSP para outros recursos
            return ("default-src 'self'; "
                   "script-src 'self' 'unsafe-inline'; "
                   "style-src 'self' 'unsafe-inline'; "
                   "img-src 'self' data: https:; "
                   "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai; "
                   "frame-ancestors 'none'; "
                   "base-uri 'self'")
    
    def _record_violation(self, ip: str, violation_type: str):
        """Registra violação de segurança"""
        logger.warning(f"SECURITY_VIOLATION: {violation_type} from {ip}")
        
        # Na versão completa, isso seria enviado para sistema de monitoring
        # como Prometheus, Datadog, etc.
    
    def _handle_rate_limit(self, error):
        """Handler para erro 429"""
        return jsonify({
            "error": "Muitas requisições",
            "error_code": "RATE_LIMIT_EXCEEDED",
            "message": "Aguarde antes de fazer nova requisição",
            "retry_after": 3600
        }), 429
    
    def _handle_forbidden(self, error):
        """Handler para erro 403"""
        return jsonify({
            "error": "Acesso negado",
            "error_code": "FORBIDDEN",
            "message": "Request bloqueada por filtros de segurança"
        }), 403
    
    def get_security_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de segurança"""
        with self.stats_lock:
            total_ips = len(self.ip_tracking)
            blocked_ips = len(self.blocked_ips)
            suspicious_ips = len(self.suspicious_ips)
            
            # Contar requests por endpoint
            endpoint_stats = {}
            for endpoint_type in self.rate_limits.keys():
                total_requests = sum(
                    len(self.ip_tracking[ip][endpoint_type])
                    for ip in self.ip_tracking
                )
                endpoint_stats[endpoint_type] = total_requests
            
            return {
                "tracking": {
                    "total_ips": total_ips,
                    "blocked_ips": blocked_ips,
                    "suspicious_ips": suspicious_ips
                },
                "rate_limiting": {
                    "limits": self.rate_limits,
                    "endpoint_stats": endpoint_stats
                },
                "security_score": self._calculate_security_score(),
                "recommendations": self._get_security_recommendations()
            }
    
    def _calculate_security_score(self) -> float:
        """Calcula score de segurança (0-100)"""
        base_score = 85  # Score base
        
        # Penalizar por IPs bloqueados
        if self.blocked_ips:
            base_score -= min(len(self.blocked_ips) * 2, 20)
        
        # Penalizar por IPs suspeitos
        if self.suspicious_ips:
            base_score -= min(len(self.suspicious_ips) * 1, 15)
        
        return max(0, min(100, base_score))
    
    def _get_security_recommendations(self) -> List[str]:
        """Gera recomendações de segurança"""
        recommendations = []
        
        if len(self.blocked_ips) > 10:
            recommendations.append("Muitos IPs bloqueados - considere revisar rate limits")
        
        if len(self.suspicious_ips) > 50:
            recommendations.append("Muitos IPs suspeitos - possível ataque coordenado")
        
        security_score = self._calculate_security_score()
        if security_score < 70:
            recommendations.append("Score de segurança baixo - revisar configurações")
        
        return recommendations

# Instância global
security_optimizer = SecurityOptimizer()

def init_security_optimizations(app: Flask):
    """Inicializa otimizações de segurança"""
    global security_optimizer
    security_optimizer = SecurityOptimizer(app)
    logger.info("🔒 Otimizações de segurança inicializadas")

def get_security_summary() -> Dict[str, Any]:
    """Retorna resumo de segurança"""
    global security_optimizer
    return security_optimizer.get_security_stats()

# Security decorators
def require_rate_limit(endpoint_type: str = 'default'):
    """Decorator para aplicar rate limiting específico"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            global security_optimizer
            client_ip = security_optimizer._get_client_ip()
            
            if not security_optimizer._check_rate_limit(client_ip, endpoint_type):
                return jsonify({
                    "error": "Rate limit excedido",
                    "error_code": "RATE_LIMIT_EXCEEDED"
                }), 429
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

__all__ = [
    'SecurityOptimizer', 'security_optimizer',
    'init_security_optimizations', 'get_security_summary',
    'require_rate_limit'
]