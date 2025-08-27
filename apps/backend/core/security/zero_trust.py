"""
Arquitetura Zero-Trust
======================

Sistema completo de segurança zero-trust implementando:
- Princípio de menor privilégio
- Verificação contínua de identidade
- Microsegmentação de serviços
- Controle de acesso baseado em atributos (ABAC)
- Monitoramento contínuo de sessões

Princípios Zero-Trust implementados:
1. "Never trust, always verify"
2. "Least privilege access"
3. "Assume breach"
4. "Verify explicitly"
5. "Use analytics to get visibility"

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
"""

import json
import time
import hashlib
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any, Tuple, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from functools import wraps
from flask import request, g, jsonify
import jwt
import secrets
from collections import defaultdict


# Logger específico para zero-trust
zt_logger = logging.getLogger('security.zero_trust')


class AccessLevel(Enum):
    """Níveis de acesso no sistema"""
    NONE = 0
    READ_BASIC = 10
    READ_EXTENDED = 20
    API_BASIC = 30
    API_EXTENDED = 40
    ADMIN_READ = 50
    ADMIN_WRITE = 60
    SYSTEM_ADMIN = 70
    ROOT = 100


class ResourceType(Enum):
    """Tipos de recursos protegidos"""
    PUBLIC_API = "public_api"
    CHAT_API = "chat_api"
    ADMIN_API = "admin_api"
    HEALTH_CHECK = "health_check"
    METRICS = "metrics"
    CONFIGURATION = "configuration"
    LOGS = "logs"
    SECRETS = "secrets"


class ThreatLevel(Enum):
    """Níveis de ameaça detectados"""
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class SecurityContext:
    """Contexto de segurança da sessão/request"""
    session_id: str
    client_ip: str
    user_agent: str
    timestamp: datetime
    trust_score: float  # 0-100
    threat_level: ThreatLevel
    access_level: AccessLevel
    permitted_resources: Set[ResourceType]
    session_duration: timedelta
    last_verification: datetime
    attributes: Dict[str, Any]
    anomaly_score: float = 0.0
    failed_verifications: int = 0


@dataclass
class AccessPolicy:
    """Política de acesso para recursos"""
    resource_type: ResourceType
    minimum_access_level: AccessLevel
    minimum_trust_score: float
    maximum_threat_level: ThreatLevel
    required_attributes: Dict[str, Any]
    time_restrictions: Dict[str, Any]
    rate_limits: Dict[str, int]
    continuous_verification_interval: int  # segundos


@dataclass
class VerificationEvent:
    """Evento de verificação de identidade"""
    timestamp: datetime
    session_id: str
    verification_type: str
    success: bool
    trust_score_before: float
    trust_score_after: float
    details: Dict[str, Any]


class ContinuousVerification:
    """Sistema de verificação contínua de identidade"""
    
    def __init__(self):
        self.verification_history: Dict[str, List[VerificationEvent]] = defaultdict(list)
        self.baseline_behaviors: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.RLock()
    
    def verify_behavioral_patterns(self, context: SecurityContext) -> Tuple[bool, float, Dict[str, Any]]:
        """Verifica padrões comportamentais da sessão"""
        session_id = context.session_id
        
        # Obter histórico comportamental
        if session_id not in self.baseline_behaviors:
            # Primeira verificação - estabelecer baseline
            self.baseline_behaviors[session_id] = {
                'request_intervals': [],
                'endpoint_patterns': [],
                'user_agent_consistency': True,
                'geographic_consistency': True,
                'request_size_patterns': []
            }
            return True, context.trust_score, {'reason': 'baseline_establishment'}
        
        baseline = self.baseline_behaviors[session_id]
        anomalies = []
        anomaly_score = 0.0
        
        # Verificar consistência de User-Agent
        if hasattr(g, 'security_info'):
            current_ua = g.security_info.get('user_agent', '')
            if baseline.get('last_user_agent') and baseline['last_user_agent'] != current_ua:
                anomalies.append('user_agent_change')
                anomaly_score += 30
            baseline['last_user_agent'] = current_ua
        
        # Verificar padrões de tempo entre requests
        now = datetime.now()
        if baseline.get('last_request_time'):
            interval = (now - baseline['last_request_time']).total_seconds()
            baseline['request_intervals'].append(interval)
            
            # Manter apenas últimos 20 intervalos
            baseline['request_intervals'] = baseline['request_intervals'][-20:]
            
            if len(baseline['request_intervals']) >= 5:
                avg_interval = sum(baseline['request_intervals']) / len(baseline['request_intervals'])
                if interval < avg_interval * 0.1:  # Muito rápido
                    anomalies.append('unusual_speed')
                    anomaly_score += 20
                elif interval > avg_interval * 10:  # Muito lento
                    anomalies.append('unusual_delay')
                    anomaly_score += 10
        
        baseline['last_request_time'] = now
        
        # Calcular novo trust score
        trust_adjustment = min(anomaly_score, 40)
        new_trust_score = max(0, context.trust_score - trust_adjustment)
        
        verification_success = anomaly_score < 50
        
        # Registrar evento de verificação
        event = VerificationEvent(
            timestamp=now,
            session_id=session_id,
            verification_type='behavioral_analysis',
            success=verification_success,
            trust_score_before=context.trust_score,
            trust_score_after=new_trust_score,
            details={
                'anomalies': anomalies,
                'anomaly_score': anomaly_score,
                'baseline_size': len(baseline['request_intervals'])
            }
        )
        
        with self.lock:
            self.verification_history[session_id].append(event)
            # Manter apenas últimos 100 eventos por sessão
            self.verification_history[session_id] = self.verification_history[session_id][-100:]
        
        return verification_success, new_trust_score, {
            'anomalies': anomalies,
            'anomaly_score': anomaly_score
        }
    
    def verify_request_integrity(self, context: SecurityContext) -> Tuple[bool, float, Dict[str, Any]]:
        """Verifica integridade da request atual"""
        integrity_score = 100.0
        issues = []
        
        # Verificar headers esperados
        required_headers = ['User-Agent', 'Accept']
        missing_headers = [h for h in required_headers if not request.headers.get(h)]
        if missing_headers:
            issues.append(f'missing_headers: {missing_headers}')
            integrity_score -= 20
        
        # Verificar formato da request
        if request.is_json:
            try:
                data = request.get_json()
                if not data:
                    issues.append('empty_json_payload')
                    integrity_score -= 15
            except:
                issues.append('invalid_json_format')
                integrity_score -= 30
        
        # Verificar tamanho da request
        content_length = request.content_length or 0
        if content_length > 10 * 1024 * 1024:  # 10MB
            issues.append('excessive_payload_size')
            integrity_score -= 25
        
        # Calcular impacto no trust score
        trust_adjustment = (100 - integrity_score) * 0.3
        new_trust_score = max(0, context.trust_score - trust_adjustment)
        
        verification_success = integrity_score >= 70
        
        return verification_success, new_trust_score, {
            'integrity_score': integrity_score,
            'issues': issues
        }
    
    def verify_session_validity(self, context: SecurityContext) -> Tuple[bool, float, Dict[str, Any]]:
        """Verifica validade da sessão"""
        now = datetime.now()
        issues = []
        
        # Verificar tempo desde última verificação
        time_since_verification = (now - context.last_verification).total_seconds()
        if time_since_verification > 300:  # 5 minutos
            issues.append('verification_timeout')
        
        # Verificar duração total da sessão
        session_age = (now - context.timestamp).total_seconds()
        max_session_duration = 3600  # 1 hora
        if session_age > max_session_duration:
            issues.append('session_expired')
        
        # Verificar falhas de verificação
        if context.failed_verifications >= 3:
            issues.append('multiple_verification_failures')
        
        verification_success = len(issues) == 0
        trust_adjustment = len(issues) * 15
        new_trust_score = max(0, context.trust_score - trust_adjustment)
        
        return verification_success, new_trust_score, {
            'issues': issues,
            'session_age_seconds': session_age,
            'time_since_verification': time_since_verification
        }


class AccessController:
    """Controlador de acesso baseado em atributos (ABAC)"""
    
    def __init__(self):
        self.policies: Dict[ResourceType, AccessPolicy] = {}
        self.active_sessions: Dict[str, SecurityContext] = {}
        self.verification_system = ContinuousVerification()
        self.lock = threading.RLock()
        
        # Inicializar políticas padrão
        self._initialize_default_policies()
    
    def _initialize_default_policies(self):
        """Inicializa políticas de acesso padrão"""
        self.policies = {
            ResourceType.PUBLIC_API: AccessPolicy(
                resource_type=ResourceType.PUBLIC_API,
                minimum_access_level=AccessLevel.NONE,
                minimum_trust_score=30.0,
                maximum_threat_level=ThreatLevel.MEDIUM,
                required_attributes={},
                time_restrictions={},
                rate_limits={'requests_per_minute': 60},
                continuous_verification_interval=300
            ),
            ResourceType.CHAT_API: AccessPolicy(
                resource_type=ResourceType.CHAT_API,
                minimum_access_level=AccessLevel.API_BASIC,
                minimum_trust_score=50.0,
                maximum_threat_level=ThreatLevel.MEDIUM,
                required_attributes={},
                time_restrictions={},
                rate_limits={'requests_per_minute': 30},
                continuous_verification_interval=180
            ),
            ResourceType.ADMIN_API: AccessPolicy(
                resource_type=ResourceType.ADMIN_API,
                minimum_access_level=AccessLevel.ADMIN_READ,
                minimum_trust_score=80.0,
                maximum_threat_level=ThreatLevel.LOW,
                required_attributes={'authenticated': True},
                time_restrictions={'business_hours_only': True},
                rate_limits={'requests_per_minute': 10},
                continuous_verification_interval=60
            ),
            ResourceType.METRICS: AccessPolicy(
                resource_type=ResourceType.METRICS,
                minimum_access_level=AccessLevel.READ_EXTENDED,
                minimum_trust_score=60.0,
                maximum_threat_level=ThreatLevel.LOW,
                required_attributes={},
                time_restrictions={},
                rate_limits={'requests_per_minute': 20},
                continuous_verification_interval=240
            ),
            ResourceType.SECRETS: AccessPolicy(
                resource_type=ResourceType.SECRETS,
                minimum_access_level=AccessLevel.SYSTEM_ADMIN,
                minimum_trust_score=95.0,
                maximum_threat_level=ThreatLevel.NONE,
                required_attributes={'authenticated': True, 'mfa_verified': True},
                time_restrictions={'business_hours_only': True},
                rate_limits={'requests_per_minute': 5},
                continuous_verification_interval=30
            )
        }
    
    def create_security_context(self, client_ip: str, user_agent: str) -> SecurityContext:
        """Cria contexto de segurança inicial"""
        session_id = self._generate_session_id()
        now = datetime.now()
        
        # Calcular trust score inicial baseado em fatores conhecidos
        initial_trust_score = self._calculate_initial_trust_score(client_ip, user_agent)
        
        # Determinar nível de ameaça inicial
        threat_level = self._assess_initial_threat_level(client_ip, user_agent)
        
        # Determinar nível de acesso inicial
        access_level = self._determine_initial_access_level(initial_trust_score, threat_level)
        
        # Recursos permitidos baseados no access level
        permitted_resources = self._get_permitted_resources(access_level)
        
        context = SecurityContext(
            session_id=session_id,
            client_ip=client_ip,
            user_agent=user_agent,
            timestamp=now,
            trust_score=initial_trust_score,
            threat_level=threat_level,
            access_level=access_level,
            permitted_resources=permitted_resources,
            session_duration=timedelta(hours=1),
            last_verification=now,
            attributes={'initial_assessment': True}
        )
        
        with self.lock:
            self.active_sessions[session_id] = context
        
        zt_logger.info(f"SecurityContext criado - Session: {session_id}, Trust: {initial_trust_score:.1f}")
        return context
    
    def verify_access(self, context: SecurityContext, resource_type: ResourceType) -> Tuple[bool, Dict[str, Any]]:
        """Verifica acesso a recurso específico"""
        policy = self.policies.get(resource_type)
        if not policy:
            zt_logger.warning(f"Política não encontrada para recurso: {resource_type}")
            return False, {'reason': 'no_policy_found'}
        
        # Verificações contínuas
        verification_results = self._perform_continuous_verification(context)
        
        # Atualizar contexto com resultados da verificação
        context.trust_score = verification_results['new_trust_score']
        context.anomaly_score = verification_results.get('anomaly_score', 0)
        context.last_verification = datetime.now()
        
        if not verification_results['success']:
            context.failed_verifications += 1
            return False, {
                'reason': 'verification_failed',
                'details': verification_results
            }
        
        # Verificar nível de acesso
        if context.access_level.value < policy.minimum_access_level.value:
            return False, {
                'reason': 'insufficient_access_level',
                'required': policy.minimum_access_level.name,
                'current': context.access_level.name
            }
        
        # Verificar trust score
        if context.trust_score < policy.minimum_trust_score:
            return False, {
                'reason': 'insufficient_trust_score',
                'required': policy.minimum_trust_score,
                'current': context.trust_score
            }
        
        # Verificar nível de ameaça
        if context.threat_level.value > policy.maximum_threat_level.value:
            return False, {
                'reason': 'threat_level_too_high',
                'maximum_allowed': policy.maximum_threat_level.name,
                'current': context.threat_level.name
            }
        
        # Verificar atributos obrigatórios
        for attr, required_value in policy.required_attributes.items():
            if context.attributes.get(attr) != required_value:
                return False, {
                    'reason': 'missing_required_attribute',
                    'attribute': attr,
                    'required_value': required_value
                }
        
        # Verificar restrições de tempo
        if not self._check_time_restrictions(policy.time_restrictions):
            return False, {
                'reason': 'time_restriction_violation',
                'restrictions': policy.time_restrictions
            }
        
        # Verificar se recurso está nos permitidos
        if resource_type not in context.permitted_resources:
            return False, {
                'reason': 'resource_not_permitted',
                'resource': resource_type.value
            }
        
        zt_logger.info(f"Acesso autorizado - Session: {context.session_id}, Resource: {resource_type.value}")
        return True, {
            'authorized': True,
            'trust_score': context.trust_score,
            'access_level': context.access_level.name,
            'verification_results': verification_results
        }
    
    def _perform_continuous_verification(self, context: SecurityContext) -> Dict[str, Any]:
        """Executa verificações contínuas"""
        results = {
            'success': True,
            'new_trust_score': context.trust_score,
            'verifications': {}
        }
        
        # Verificação comportamental
        behavioral_success, behavioral_trust, behavioral_details = \
            self.verification_system.verify_behavioral_patterns(context)
        
        results['verifications']['behavioral'] = {
            'success': behavioral_success,
            'trust_score': behavioral_trust,
            'details': behavioral_details
        }
        
        # Verificação de integridade da request
        integrity_success, integrity_trust, integrity_details = \
            self.verification_system.verify_request_integrity(context)
        
        results['verifications']['integrity'] = {
            'success': integrity_success,
            'trust_score': integrity_trust,
            'details': integrity_details
        }
        
        # Verificação de validade da sessão
        session_success, session_trust, session_details = \
            self.verification_system.verify_session_validity(context)
        
        results['verifications']['session'] = {
            'success': session_success,
            'trust_score': session_trust,
            'details': session_details
        }
        
        # Calcular trust score final (usar o menor)
        trust_scores = [behavioral_trust, integrity_trust, session_trust]
        results['new_trust_score'] = min(trust_scores)
        
        # Verificação geral falhou se qualquer verificação específica falhou
        results['success'] = all([behavioral_success, integrity_success, session_success])
        
        # Atualizar anomaly score
        anomaly_scores = [
            behavioral_details.get('anomaly_score', 0),
            100 - integrity_details.get('integrity_score', 100)
        ]
        results['anomaly_score'] = sum(anomaly_scores) / len(anomaly_scores)
        
        return results
    
    def _generate_session_id(self) -> str:
        """Gera ID único de sessão"""
        return f"zt_{int(time.time())}_{secrets.token_hex(16)}"
    
    def _calculate_initial_trust_score(self, client_ip: str, user_agent: str) -> float:
        """Calcula trust score inicial"""
        score = 70.0  # Score base
        
        # Penalizar IPs suspeitos (implementar lista negra/geolocalização)
        if self._is_suspicious_ip(client_ip):
            score -= 30
        
        # Penalizar user-agents suspeitos
        if self._is_suspicious_user_agent(user_agent):
            score -= 20
        
        # Bonus para user-agents conhecidos
        if any(browser in user_agent.lower() for browser in ['chrome', 'firefox', 'safari', 'edge']):
            score += 10
        
        return max(0, min(100, score))
    
    def _assess_initial_threat_level(self, client_ip: str, user_agent: str) -> ThreatLevel:
        """Avalia nível de ameaça inicial"""
        if self._is_known_malicious_ip(client_ip):
            return ThreatLevel.CRITICAL
        elif self._is_suspicious_ip(client_ip):
            return ThreatLevel.HIGH
        elif self._is_suspicious_user_agent(user_agent):
            return ThreatLevel.MEDIUM
        else:
            return ThreatLevel.LOW
    
    def _determine_initial_access_level(self, trust_score: float, threat_level: ThreatLevel) -> AccessLevel:
        """Determina nível de acesso inicial"""
        if threat_level == ThreatLevel.CRITICAL:
            return AccessLevel.NONE
        elif threat_level == ThreatLevel.HIGH or trust_score < 30:
            return AccessLevel.READ_BASIC
        elif threat_level == ThreatLevel.MEDIUM or trust_score < 50:
            return AccessLevel.READ_EXTENDED
        elif trust_score >= 70:
            return AccessLevel.API_EXTENDED
        else:
            return AccessLevel.API_BASIC
    
    def _get_permitted_resources(self, access_level: AccessLevel) -> Set[ResourceType]:
        """Determina recursos permitidos baseado no nível de acesso"""
        resource_map = {
            AccessLevel.NONE: set(),
            AccessLevel.READ_BASIC: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK},
            AccessLevel.READ_EXTENDED: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK, ResourceType.METRICS},
            AccessLevel.API_BASIC: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK, ResourceType.CHAT_API},
            AccessLevel.API_EXTENDED: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK, ResourceType.CHAT_API, ResourceType.METRICS},
            AccessLevel.ADMIN_READ: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK, ResourceType.CHAT_API, ResourceType.METRICS, ResourceType.ADMIN_API},
            AccessLevel.ADMIN_WRITE: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK, ResourceType.CHAT_API, ResourceType.METRICS, ResourceType.ADMIN_API, ResourceType.CONFIGURATION},
            AccessLevel.SYSTEM_ADMIN: {ResourceType.PUBLIC_API, ResourceType.HEALTH_CHECK, ResourceType.CHAT_API, ResourceType.METRICS, ResourceType.ADMIN_API, ResourceType.CONFIGURATION, ResourceType.LOGS},
            AccessLevel.ROOT: set(ResourceType)  # Todos os recursos
        }
        return resource_map.get(access_level, set())
    
    def _check_time_restrictions(self, restrictions: Dict[str, Any]) -> bool:
        """Verifica restrições de tempo"""
        if not restrictions:
            return True
        
        now = datetime.now()
        
        # Verificar horário comercial
        if restrictions.get('business_hours_only'):
            if now.hour < 8 or now.hour > 18:  # 8:00 - 18:00
                return False
            if now.weekday() >= 5:  # Fim de semana
                return False
        
        return True
    
    def _is_suspicious_ip(self, ip: str) -> bool:
        """Verifica se IP é suspeito"""
        # Implementar verificações mais sofisticadas
        suspicious_ranges = [
            '10.0.0.0/8',     # RFC1918
            '172.16.0.0/12',  # RFC1918
            '192.168.0.0/16', # RFC1918
        ]
        # Por enquanto, retornar False (implementar lógica real)
        return False
    
    def _is_known_malicious_ip(self, ip: str) -> bool:
        """Verifica se IP é conhecido como malicioso"""
        # Implementar verificação contra threat intelligence feeds
        return False
    
    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Verifica se user-agent é suspeito"""
        if not user_agent:
            return True
        
        suspicious_patterns = [
            'scanner', 'bot', 'crawl', 'spider', 'python-requests', 'curl/', 'wget/'
        ]
        
        user_agent_lower = user_agent.lower()
        return any(pattern in user_agent_lower for pattern in suspicious_patterns)
    
    def get_session_context(self, session_id: str) -> Optional[SecurityContext]:
        """Obtém contexto de segurança da sessão"""
        return self.active_sessions.get(session_id)
    
    def cleanup_expired_sessions(self):
        """Remove sessões expiradas"""
        now = datetime.now()
        expired_sessions = []
        
        with self.lock:
            for session_id, context in self.active_sessions.items():
                if (now - context.timestamp) > context.session_duration:
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                del self.active_sessions[session_id]
                zt_logger.info(f"Sessão expirada removida: {session_id}")
    
    def get_security_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de segurança zero-trust"""
        with self.lock:
            active_sessions_count = len(self.active_sessions)
            
            # Distribuição de trust scores
            trust_scores = [ctx.trust_score for ctx in self.active_sessions.values()]
            avg_trust_score = sum(trust_scores) / len(trust_scores) if trust_scores else 0
            
            # Distribuição de níveis de acesso
            access_levels = [ctx.access_level.name for ctx in self.active_sessions.values()]
            access_distribution = {level: access_levels.count(level) for level in set(access_levels)}
            
            # Distribuição de níveis de ameaça
            threat_levels = [ctx.threat_level.name for ctx in self.active_sessions.values()]
            threat_distribution = {level: threat_levels.count(level) for level in set(threat_levels)}
            
            return {
                'active_sessions': active_sessions_count,
                'average_trust_score': avg_trust_score,
                'access_level_distribution': access_distribution,
                'threat_level_distribution': threat_distribution,
                'policies_count': len(self.policies),
                'verification_events_count': sum(len(events) for events in self.verification_system.verification_history.values())
            }


class ZeroTrustDecorator:
    """Decorator para aplicar verificações zero-trust"""
    
    def __init__(self, access_controller: AccessController):
        self.access_controller = access_controller
    
    def require_access(self, resource_type: ResourceType):
        """Decorator que requer nível específico de acesso"""
        def decorator(f):
            @wraps(f)
            def wrapper(*args, **kwargs):
                # Obter ou criar contexto de segurança
                session_id = request.headers.get('X-Session-ID')
                if session_id:
                    context = self.access_controller.get_session_context(session_id)
                else:
                    context = None
                
                if not context:
                    # Criar novo contexto
                    client_ip = request.remote_addr or 'unknown'
                    user_agent = request.headers.get('User-Agent', '')
                    context = self.access_controller.create_security_context(client_ip, user_agent)
                
                # Verificar acesso
                access_granted, access_details = self.access_controller.verify_access(context, resource_type)
                
                if not access_granted:
                    zt_logger.warning(f"Acesso negado - Session: {context.session_id}, Resource: {resource_type.value}, Reason: {access_details.get('reason')}")
                    return jsonify({
                        'error': 'Access denied by zero-trust policy',
                        'error_code': 'ZERO_TRUST_DENIED',
                        'reason': access_details.get('reason'),
                        'required_access_level': access_details.get('required'),
                        'current_access_level': access_details.get('current'),
                        'session_id': context.session_id,
                        'timestamp': datetime.now().isoformat()
                    }), 403
                
                # Adicionar contexto ao g para uso na função
                g.security_context = context
                g.access_details = access_details
                
                return f(*args, **kwargs)
            return wrapper
        return decorator


# Instância global do controlador
global_access_controller = AccessController()

# Função helper para criar decorator
def require_access(resource_type: ResourceType):
    """Função helper para criar decorator de acesso"""
    decorator = ZeroTrustDecorator(global_access_controller)
    return decorator.require_access(resource_type)

# Funções de conveniência
def require_public_api():
    return require_access(ResourceType.PUBLIC_API)

def require_chat_api():
    return require_access(ResourceType.CHAT_API)

def require_admin_api():
    return require_access(ResourceType.ADMIN_API)

def require_metrics_access():
    return require_access(ResourceType.METRICS)


class ThreatDetector:
    """
    Sistema de Detecção de Ameaças para Arquitetura Zero-Trust
    
    Analisa comportamentos suspeitos e padrões de ameaças em tempo real:
    - Detecção de anomalias comportamentais
    - Análise de padrões de acesso
    - Identificação de tentativas de ataque
    - Scoring de risco dinâmico
    """
    
    def __init__(self):
        """Inicializa o detector de ameaças"""
        self.threat_patterns = self._initialize_threat_patterns()
        self.behavior_baseline = {}
        self.anomaly_threshold = 0.8
        self.logger = logging.getLogger('security.threat_detector')
        
        # Contadores de ameaças por sessão
        self.session_threat_scores = defaultdict(float)
        self.session_activities = defaultdict(list)
        
        # Cache de IPs maliciosos conhecidos
        self.malicious_ips = set()
        self.suspicious_patterns = self._load_suspicious_patterns()
    
    def _initialize_threat_patterns(self) -> Dict[str, Dict]:
        """Inicializa padrões de ameaças conhecidos"""
        return {
            'sql_injection': {
                'patterns': [r"'.*OR.*'", r"UNION.*SELECT", r"DROP.*TABLE", r"INSERT.*INTO"],
                'severity': 'critical',
                'score_impact': 50.0
            },
            'xss_attempt': {
                'patterns': [r"<script.*>", r"javascript:", r"onload=", r"onerror="],
                'severity': 'high', 
                'score_impact': 30.0
            },
            'path_traversal': {
                'patterns': [r"\.\./", r"\.\.\\", r"%2e%2e", r"..%2f"],
                'severity': 'high',
                'score_impact': 35.0
            },
            'command_injection': {
                'patterns': [r";\s*(cat|ls|pwd|whoami)", r"\|\s*(nc|netcat)", r"&&\s*(rm|del)"],
                'severity': 'critical',
                'score_impact': 45.0
            },
            'brute_force': {
                'indicators': ['rapid_requests', 'failed_auth_attempts'],
                'severity': 'medium',
                'score_impact': 25.0
            }
        }
    
    def _load_suspicious_patterns(self) -> List[str]:
        """Carrega padrões suspeitos específicos para aplicação médica"""
        return [
            # Tentativas de acesso a dados médicos não autorizados
            r"patient.*data", r"medical.*record", r"prescription.*info",
            r"hanseniase.*data", r"dispensing.*log", r"medication.*list",
            
            # Padrões de exploit comuns
            r"eval\(", r"exec\(", r"system\(", r"shell_exec",
            r"passthru", r"base64_decode", r"file_get_contents",
            
            # Headers maliciosos
            r"x-forwarded-for.*[,;]", r"x-real-ip.*[,;]"
        ]
    
    def analyze_request_threat_level(self, request_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Analisa o nível de ameaça de uma requisição
        
        Returns:
            Tuple[float, List[str]]: (threat_score, detected_threats)
        """
        threat_score = 0.0
        detected_threats = []
        
        try:
            # Análise de payload/parâmetros
            payload_threats = self._analyze_payload(request_data.get('payload', ''))
            threat_score += payload_threats['score']
            detected_threats.extend(payload_threats['threats'])
            
            # Análise de headers
            header_threats = self._analyze_headers(request_data.get('headers', {}))
            threat_score += header_threats['score']
            detected_threats.extend(header_threats['threats'])
            
            # Análise de padrão comportamental
            behavior_score = self._analyze_behavioral_pattern(request_data)
            threat_score += behavior_score
            
            # Análise de origem (IP, User-Agent)
            origin_threats = self._analyze_request_origin(request_data)
            threat_score += origin_threats['score']
            detected_threats.extend(origin_threats['threats'])
            
            # Normalizar score (0-100)
            normalized_score = min(100.0, threat_score)
            
            if normalized_score > 50:
                self.logger.warning(f"High threat level detected: {normalized_score:.2f}, Threats: {detected_threats}")
            
            return normalized_score, detected_threats
            
        except Exception as e:
            self.logger.error(f"Error analyzing threat level: {e}")
            return 0.0, []
    
    def _analyze_payload(self, payload: str) -> Dict[str, Any]:
        """Analisa payload por padrões maliciosos"""
        score = 0.0
        threats = []
        
        if not payload:
            return {'score': 0.0, 'threats': []}
        
        # Verificar padrões de ameaças conhecidos
        for threat_name, threat_data in self.threat_patterns.items():
            if 'patterns' in threat_data:
                import re
                for pattern in threat_data['patterns']:
                    if re.search(pattern, payload, re.IGNORECASE):
                        threats.append(f"{threat_name}:{pattern}")
                        score += threat_data['score_impact']
        
        # Verificar padrões suspeitos específicos
        import re
        for pattern in self.suspicious_patterns:
            if re.search(pattern, payload, re.IGNORECASE):
                threats.append(f"suspicious_pattern:{pattern}")
                score += 15.0
        
        return {'score': score, 'threats': threats}
    
    def _analyze_headers(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Analisa headers HTTP por indicadores maliciosos"""
        score = 0.0
        threats = []
        
        # Headers suspeitos ou faltantes
        suspicious_headers = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip']
        for header in suspicious_headers:
            if header in headers:
                value = headers[header]
                # Verificar múltiplos IPs (possível proxy chain malicioso)
                if ',' in value or ';' in value:
                    threats.append(f"suspicious_header:{header}")
                    score += 10.0
        
        # User-Agent analysis
        user_agent = headers.get('user-agent', '').lower()
        if not user_agent:
            threats.append("missing_user_agent")
            score += 5.0
        elif any(bot in user_agent for bot in ['bot', 'crawler', 'scanner', 'curl', 'wget']):
            threats.append("automated_client")
            score += 8.0
        
        return {'score': score, 'threats': threats}
    
    def _analyze_behavioral_pattern(self, request_data: Dict[str, Any]) -> float:
        """Analisa padrões comportamentais anômalos"""
        session_id = request_data.get('session_id')
        if not session_id:
            return 5.0  # Sem sessão é suspeito
        
        # Registrar atividade
        timestamp = datetime.now()
        self.session_activities[session_id].append({
            'timestamp': timestamp,
            'endpoint': request_data.get('endpoint', ''),
            'method': request_data.get('method', ''),
            'ip': request_data.get('client_ip', '')
        })
        
        # Analisar frequência de requests
        recent_activities = [
            act for act in self.session_activities[session_id]
            if (timestamp - act['timestamp']).seconds < 60  # Último minuto
        ]
        
        if len(recent_activities) > 20:  # Mais de 20 requests por minuto
            return 25.0
        elif len(recent_activities) > 10:
            return 15.0
        
        return 0.0
    
    def _analyze_request_origin(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa origem da requisição"""
        score = 0.0
        threats = []
        
        client_ip = request_data.get('client_ip', '')
        if client_ip in self.malicious_ips:
            threats.append(f"malicious_ip:{client_ip}")
            score += 40.0
        
        # Verificar IPs privados sendo mascarados
        if client_ip.startswith(('10.', '172.', '192.168.')):
            if 'x-forwarded-for' in request_data.get('headers', {}):
                threats.append("private_ip_with_forwarding")
                score += 15.0
        
        return {'score': score, 'threats': threats}
    
    def update_session_threat_score(self, session_id: str, threat_score: float, threats: List[str]):
        """Atualiza score de ameaça da sessão"""
        # Usar média ponderada para suavizar flutuações
        current_score = self.session_threat_scores[session_id]
        self.session_threat_scores[session_id] = (current_score * 0.7) + (threat_score * 0.3)
        
        # Log de ameaças significativas
        if threat_score > 30:
            self.logger.warning(f"Session {session_id} threat score: {threat_score:.2f}, Threats: {threats}")
    
    def get_session_threat_score(self, session_id: str) -> float:
        """Retorna score atual de ameaça da sessão"""
        return self.session_threat_scores.get(session_id, 0.0)
    
    def is_session_compromised(self, session_id: str) -> bool:
        """Verifica se sessão está comprometida"""
        return self.session_threat_scores.get(session_id, 0.0) > 70.0
    
    def add_malicious_ip(self, ip: str):
        """Adiciona IP à lista de IPs maliciosos"""
        self.malicious_ips.add(ip)
        self.logger.warning(f"IP {ip} added to malicious IPs list")
    
    def cleanup_old_activities(self):
        """Remove atividades antigas para economizar memória"""
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        for session_id in list(self.session_activities.keys()):
            activities = self.session_activities[session_id]
            recent_activities = [
                act for act in activities 
                if act['timestamp'] > cutoff_time
            ]
            
            if recent_activities:
                self.session_activities[session_id] = recent_activities
            else:
                del self.session_activities[session_id]
                
                # Remove também o threat score se não há atividade recente
                if session_id in self.session_threat_scores:
                    del self.session_threat_scores[session_id]
    
    def get_threat_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas de ameaças detectadas"""
        total_sessions = len(self.session_threat_scores)
        high_risk_sessions = sum(1 for score in self.session_threat_scores.values() if score > 50)
        
        threat_scores = list(self.session_threat_scores.values()) if self.session_threat_scores else [0]
        avg_threat_score = sum(threat_scores) / len(threat_scores)
        
        return {
            'total_monitored_sessions': total_sessions,
            'high_risk_sessions': high_risk_sessions,
            'average_threat_score': avg_threat_score,
            'malicious_ips_count': len(self.malicious_ips),
            'total_activities_tracked': sum(len(acts) for acts in self.session_activities.values()),
            'compromise_rate': (high_risk_sessions / total_sessions * 100) if total_sessions > 0 else 0
        }


class ZeroTrustManager:
    """
    Manager principal do sistema Zero-Trust
    
    Coordena todos os componentes de segurança zero-trust:
    - AccessController para controle de acesso
    - ContinuousVerification para verificação contínua
    - Políticas de segurança dinâmicas
    - Monitoramento de ameaças
    """
    
    def __init__(self, access_controller=None):
        """Inicializa o ZeroTrustManager"""
        self.access_controller = access_controller or global_access_controller
        self.continuous_verification = ContinuousVerification()
        self.threat_detector = ThreatDetector()
        self.logger = logging.getLogger(__name__)
        
        # Políticas padrão para sistema médico
        self._initialize_medical_policies()
    
    def _initialize_medical_policies(self):
        """Inicializa políticas específicas para sistema médico"""
        # Política para chat médico (crítico)
        self.access_controller.policies[ResourceType.CHAT_API] = AccessPolicy(
            resource_type=ResourceType.CHAT_API,
            minimum_access_level=AccessLevel.API_BASIC,
            minimum_trust_score=60.0,
            maximum_threat_level=ThreatLevel.MEDIUM,
            required_attributes={},
            time_restrictions={},
            rate_limits={'requests_per_minute': 30},
            continuous_verification_interval=300  # 5 minutos
        )
        
        # Política para APIs administrativas
        self.access_controller.policies[ResourceType.ADMIN_API] = AccessPolicy(
            resource_type=ResourceType.ADMIN_API,
            minimum_access_level=AccessLevel.ADMIN_READ,
            minimum_trust_score=85.0,
            maximum_threat_level=ThreatLevel.LOW,
            required_attributes={'verified': True},
            time_restrictions={},
            rate_limits={'requests_per_minute': 10},
            continuous_verification_interval=120  # 2 minutos
        )
        
        # Política para métricas e monitoramento
        self.access_controller.policies[ResourceType.METRICS] = AccessPolicy(
            resource_type=ResourceType.METRICS,
            minimum_access_level=AccessLevel.READ_EXTENDED,
            minimum_trust_score=75.0,
            maximum_threat_level=ThreatLevel.MEDIUM,
            required_attributes={},
            time_restrictions={},
            rate_limits={'requests_per_minute': 60},
            continuous_verification_interval=600  # 10 minutos
        )
    
    def verify_request(self, request, resource_type: ResourceType) -> Tuple[bool, SecurityContext, Dict[str, Any]]:
        """
        Verifica se uma requisição deve ser permitida
        
        Returns:
            Tuple[bool, SecurityContext, Dict]: (permitido, contexto, detalhes)
        """
        try:
            # Construir contexto de segurança
            context = self._build_security_context(request)
            
            # Verificar políticas de acesso
            access_granted, access_details = self.access_controller.check_access(context, resource_type)
            
            # Verificação contínua se acesso foi concedido
            if access_granted:
                behavioral_ok, new_trust_score, behavioral_details = self.continuous_verification.verify_behavioral_patterns(context)
                context.trust_score = new_trust_score
                
                if not behavioral_ok:
                    access_granted = False
                    access_details.update(behavioral_details)
                    self.logger.warning(f"Access denied due to behavioral anomalies: {behavioral_details}")
            
            return access_granted, context, access_details
            
        except Exception as e:
            self.logger.error(f"Error in zero-trust verification: {e}")
            # Fail secure - negar acesso em caso de erro
            return False, None, {'error': 'verification_failed', 'details': str(e)}
    
    def _build_security_context(self, request) -> SecurityContext:
        """Constrói contexto de segurança a partir da requisição"""
        from flask import session
        import uuid
        
        # Gerar ou obter session ID
        session_id = session.get('security_session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            session['security_session_id'] = session_id
        
        # Construir contexto
        context = SecurityContext(
            session_id=session_id,
            client_ip=request.remote_addr or 'unknown',
            user_agent=request.headers.get('User-Agent', 'unknown'),
            timestamp=datetime.now(),
            trust_score=70.0,  # Score inicial moderado
            threat_level=ThreatLevel.LOW,
            access_level=AccessLevel.USER,  # Nível inicial
            permitted_resources=set(),
            session_duration=timedelta(hours=1),
            last_verification=datetime.now(),
            attributes={}
        )
        
        return context
    
    def create_access_decorator(self, resource_type: ResourceType):
        """Cria decorator para controle de acesso"""
        def decorator(f):
            @wraps(f)
            def wrapper(*args, **kwargs):
                from flask import request, jsonify, g
                
                # Verificar acesso
                access_granted, context, details = self.verify_request(request, resource_type)
                
                if not access_granted:
                    self.logger.warning(f"Zero-Trust access denied: {details}")
                    return jsonify({
                        'error': 'Access denied',
                        'error_code': 'ZERO_TRUST_DENIED',
                        'details': details.get('reason', 'insufficient_trust')
                    }), 403
                
                # Adicionar contexto ao request
                g.security_context = context
                g.zero_trust_verified = True
                
                return f(*args, **kwargs)
            
            wrapper.__name__ = f.__name__
            return wrapper
        return decorator
    
    def get_trust_score(self, session_id: str) -> float:
        """Obtém score de confiança atual da sessão"""
        # Implementação simplificada - em produção seria mais complexa
        return 70.0
    
    def update_threat_level(self, session_id: str, new_level: ThreatLevel):
        """Atualiza nível de ameaça da sessão"""
        self.logger.info(f"Threat level updated for session {session_id}: {new_level}")


# Instância global do ZeroTrustManager
global_zero_trust_manager = ZeroTrustManager()


def require_authenticated_access(resource_type: ResourceType = ResourceType.PUBLIC_API):
    """
    Decorator para exigir acesso autenticado com Zero-Trust
    
    Args:
        resource_type: Tipo do recurso sendo protegido
    
    Returns:
        Decorator function
    """
    return global_zero_trust_manager.create_access_decorator(resource_type)