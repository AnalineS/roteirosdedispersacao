# -*- coding: utf-8 -*-
"""
Redis Rate Limiter - Distribuído e Inteligente
==============================================

Implementa rate limiting distribuído usando Redis Cloud com fallback
para sistema local. Integra perfeitamente com o IntelligentRateLimiter existente.

Características:
- Rate limiting distribuído via Redis
- Fallback automático para sistema local
- Profiles comportamentais mantidos
- Performance otimizada com pipelines Redis
- Integração transparente com middleware existente

Autor: Sistema de Segurança Roteiro de Dispensação  
Data: 2025-08-12
"""

import redis
import json
import time
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, Set
from dataclasses import asdict
from collections import defaultdict, deque

# Import configurações e sistema existente
from app_config import config
from core.security.middleware import IntelligentRateLimiter, ClientProfile

logger = logging.getLogger(__name__)

class RedisConnectionManager:
    """Gerenciador de conexão Redis com fallback robusto"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.connected = False
        self.connection_attempts = 0
        self.max_attempts = 3
        self.retry_delay = 5  # segundos
        self._lock = threading.Lock()
        
        # Configurações de conexão (via environment variables)
        self.redis_config = {
            'host': config.REDIS_URL.split(':')[0] if config.REDIS_URL else None,
            'port': int(config.REDIS_URL.split(':')[1]) if config.REDIS_URL and ':' in config.REDIS_URL else 6379,
            'username': 'default',
            'password': config.REDIS_PASSWORD,
            'decode_responses': True,
            'socket_connect_timeout': 5,
            'socket_timeout': 3,
            'retry_on_timeout': True,
            'health_check_interval': 30
        }
        
        self._connect()
    
    def _connect(self):
        """Conecta ao Redis com retry automático"""
        if not config.REDIS_ENABLED or not config.REDIS_URL:
            logger.info("Redis não configurado - usando fallback local")
            return
        
        try:
            with self._lock:
                self.client = redis.Redis(**self.redis_config)
                
                # Teste de conectividade
                self.client.ping()
                self.connected = True
                self.connection_attempts = 0
                
                logger.info(f"[OK] Conectado ao Redis Cloud: {self.redis_config['host']}:{self.redis_config['port']}")
                
        except Exception as e:
            self.connected = False
            self.connection_attempts += 1
            
            logger.warning(f"[ERROR] Falha conexão Redis (tentativa {self.connection_attempts}): {e}")
            
            if self.connection_attempts < self.max_attempts:
                # Reagendar reconexão
                timer = threading.Timer(self.retry_delay, self._connect)
                timer.daemon = True
                timer.start()
            else:
                logger.error("[ALERT] Redis indisponível - usando fallback local permanentemente")
    
    def execute(self, func_name: str, *args, **kwargs) -> Any:
        """Executa comando Redis com fallback"""
        if not self.connected or not self.client:
            raise redis.ConnectionError("Redis não disponível")
        
        try:
            func = getattr(self.client, func_name)
            return func(*args, **kwargs)
        except (redis.ConnectionError, redis.TimeoutError) as e:
            self.connected = False
            logger.warning(f"Redis desconectado durante operação {func_name}: {e}")
            self._connect()  # Tentar reconectar
            raise e
    
    def is_available(self) -> bool:
        """Verifica se Redis está disponível"""
        return self.connected and self.client is not None

class DistributedRateLimiter:
    """Rate limiter distribuído com Redis + fallback local"""
    
    def __init__(self):
        self.redis_manager = RedisConnectionManager()
        self.local_fallback = IntelligentRateLimiter()  # Sistema local como fallback
        self.stats = {
            'redis_operations': 0,
            'fallback_operations': 0,
            'redis_failures': 0
        }
        
        # Prefixos Redis para organização
        self.key_prefixes = {
            'profile': 'roteiros:profile:',
            'requests': 'roteiros:requests:',
            'blocks': 'roteiros:blocks:',
            'stats': 'roteiros:stats:'
        }
        
        # TTL para chaves Redis (auto-cleanup)
        self.key_ttls = {
            'profile': 86400 * 7,      # 7 dias
            'requests': 3600,           # 1 hora  
            'blocks': 86400,            # 1 dia
            'stats': 86400 * 30         # 30 dias
        }
    
    def _get_profile_key(self, ip: str) -> str:
        """Gera chave Redis para perfil do cliente"""
        return f"{self.key_prefixes['profile']}{ip}"
    
    def _get_requests_key(self, ip: str) -> str:
        """Gera chave Redis para histórico de requests"""
        return f"{self.key_prefixes['requests']}{ip}"
    
    def _get_block_key(self, ip: str) -> str:
        """Gera chave Redis para bloqueios"""
        return f"{self.key_prefixes['blocks']}{ip}"
    
    def _serialize_profile(self, profile: ClientProfile) -> str:
        """Serializa perfil para Redis"""
        profile_dict = asdict(profile)
        # Converter sets para lists para JSON
        profile_dict['user_agents'] = list(profile_dict['user_agents'])
        profile_dict['endpoints_accessed'] = list(profile_dict['endpoints_accessed'])
        # Converter datetimes para ISO strings
        profile_dict['first_seen'] = profile.first_seen.isoformat()
        profile_dict['last_seen'] = profile.last_seen.isoformat()
        return json.dumps(profile_dict, default=str)
    
    def _deserialize_profile(self, data: str) -> ClientProfile:
        """Deserializa perfil do Redis"""
        profile_dict = json.loads(data)
        # Converter lists de volta para sets
        profile_dict['user_agents'] = set(profile_dict['user_agents'])
        profile_dict['endpoints_accessed'] = set(profile_dict['endpoints_accessed'])
        # Converter ISO strings para datetime
        profile_dict['first_seen'] = datetime.fromisoformat(profile_dict['first_seen'])
        profile_dict['last_seen'] = datetime.fromisoformat(profile_dict['last_seen'])
        return ClientProfile(**profile_dict)
    
    def _get_client_profile_redis(self, ip: str) -> Optional[ClientProfile]:
        """Obtém perfil do cliente do Redis"""
        try:
            profile_data = self.redis_manager.execute('get', self._get_profile_key(ip))
            if profile_data:
                return self._deserialize_profile(profile_data)
            return None
        except Exception as e:
            logger.debug(f"Erro ao obter perfil do Redis para {ip}: {e}")
            return None
    
    def _save_client_profile_redis(self, profile: ClientProfile):
        """Salva perfil do cliente no Redis"""
        try:
            key = self._get_profile_key(profile.ip)
            data = self._serialize_profile(profile)
            self.redis_manager.execute('setex', key, self.key_ttls['profile'], data)
        except Exception as e:
            logger.debug(f"Erro ao salvar perfil no Redis para {profile.ip}: {e}")
    
    def _check_redis_rate_limit(self, ip: str, endpoint: str, method: str, user_agent: str) -> Tuple[bool, Dict[str, Any]]:
        """Rate limiting usando Redis com sliding window"""
        try:
            now = time.time()
            pipeline = self.redis_manager.client.pipeline()
            
            # Chaves Redis
            requests_key = self._get_requests_key(ip)
            block_key = self._get_block_key(ip)
            profile_key = self._get_profile_key(ip)
            
            # Verificar se está bloqueado
            block_until = pipeline.get(block_key)
            
            # Sliding window para requests (últimos 60 segundos)
            minute_ago = now - 60
            pipeline.zremrangebyscore(requests_key, 0, minute_ago)  # Remove requests antigos
            pipeline.zcard(requests_key)  # Conta requests atuais
            pipeline.zadd(requests_key, {f"{now}:{endpoint}:{method}": now})  # Adiciona request atual
            pipeline.expire(requests_key, self.key_ttls['requests'])
            
            # Executar pipeline
            results = pipeline.execute()
            self.stats['redis_operations'] += 1
            
            # Analisar resultados
            block_data = results[0]
            current_requests = results[1]
            
            if block_data:
                block_until_time = float(block_data)
                if now < block_until_time:
                    return False, {
                        'reason': 'ip_blocked_redis',
                        'blocked_until': datetime.fromtimestamp(block_until_time).isoformat(),
                        'category': 'blocked',
                        'source': 'redis'
                    }
            
            # Obter perfil para determinar limites
            profile = self._get_client_profile_redis(ip)
            if not profile:
                # Criar perfil se não existir
                profile = ClientProfile(
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
            
            # Atualizar perfil
            profile.last_seen = datetime.now()
            profile.request_count += 1
            profile.user_agents.add(user_agent)
            profile.endpoints_accessed.add(endpoint)
            
            # Determinar limites baseado no security score
            if profile.security_score >= 80:
                rate_limit = 60  # requests/minuto
                burst_limit = 10
            elif profile.security_score >= 50:
                rate_limit = 20
                burst_limit = 3
            else:
                rate_limit = 5
                burst_limit = 1
            
            # Verificar rate limit
            is_allowed = current_requests < rate_limit
            
            if not is_allowed:
                # Bloquear IP temporariamente
                block_duration = 15 * 60  # 15 minutos
                if profile.security_score < 50:
                    block_duration = 60 * 60  # 1 hora
                
                block_until_timestamp = now + block_duration
                self.redis_manager.execute('setex', block_key, int(block_duration), str(block_until_timestamp))
                
                profile.blocked_count += 1
                profile.security_score = max(0, profile.security_score - 10)
            
            # Salvar perfil atualizado
            self._save_client_profile_redis(profile)
            
            return is_allowed, {
                'category': 'redis_distributed',
                'security_score': profile.security_score,
                'current_rate': current_requests,
                'limit': rate_limit,
                'burst_limit': burst_limit,
                'blocked_count': profile.blocked_count,
                'source': 'redis'
            }
            
        except Exception as e:
            logger.warning(f"Erro no rate limiting Redis: {e}")
            self.stats['redis_failures'] += 1
            raise e
    
    def check_rate_limit(self, ip: str, endpoint: str, method: str, user_agent: str) -> Tuple[bool, Dict[str, Any]]:
        """Rate limiting principal com fallback automático"""
        
        # Tentar usar Redis primeiro
        if self.redis_manager.is_available():
            try:
                return self._check_redis_rate_limit(ip, endpoint, method, user_agent)
            except Exception as e:
                logger.warning(f"Redis falhou, usando fallback local: {e}")
                self.stats['fallback_operations'] += 1
        
        # Fallback para sistema local
        self.stats['fallback_operations'] += 1
        result = self.local_fallback.check_rate_limit(ip, endpoint, method, user_agent)
        
        # Adicionar informação de source
        if len(result) > 1 and isinstance(result[1], dict):
            result[1]['source'] = 'local_fallback'
        
        return result
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do rate limiter distribuído"""
        stats = dict(self.stats)
        stats.update({
            'redis_available': self.redis_manager.is_available(),
            'redis_connection_attempts': self.redis_manager.connection_attempts,
            'total_operations': stats['redis_operations'] + stats['fallback_operations'],
            'redis_success_rate': (stats['redis_operations'] / max(1, stats['redis_operations'] + stats['redis_failures'])) * 100,
            'local_fallback_usage': stats['fallback_operations'] / max(1, stats['redis_operations'] + stats['fallback_operations']) * 100
        })
        return stats
    
    def cleanup_expired_data(self):
        """Limpa dados expirados do Redis (executado periodicamente)"""
        if not self.redis_manager.is_available():
            return
        
        try:
            # Redis TTL cuida da limpeza automaticamente
            # Esta função pode ser usada para limpeza manual se necessário
            logger.info("🧹 Limpeza automática do Redis executada")
        except Exception as e:
            logger.error(f"Erro na limpeza Redis: {e}")

# Instância global
distributed_rate_limiter = DistributedRateLimiter()

# Função de conveniência
def check_distributed_rate_limit(ip: str, endpoint: str, method: str, user_agent: str) -> Tuple[bool, Dict[str, Any]]:
    """Função de conveniência para rate limiting distribuído"""
    return distributed_rate_limiter.check_rate_limit(ip, endpoint, method, user_agent)

def get_distributed_rate_limiter_stats() -> Dict[str, Any]:
    """Retorna estatísticas do rate limiter distribuído"""
    return distributed_rate_limiter.get_stats()

__all__ = [
    'DistributedRateLimiter',
    'distributed_rate_limiter',
    'check_distributed_rate_limit',
    'get_distributed_rate_limiter_stats'
]