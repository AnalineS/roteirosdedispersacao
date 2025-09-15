# -*- coding: utf-8 -*-
"""
Unified Cache Manager - Sistema Unificado de Cache
Combina PerformanceCache + CloudNativeCache + Cache API
Objetivo: Sistema de cache inteligente com fallback multinível

Data: 09 de Janeiro de 2025
Fase: Integração de Sistemas Avançados
"""

import json
import hashlib
import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, Tuple, Union
from collections import OrderedDict

logger = logging.getLogger(__name__)

class UnifiedCacheManager:
    """
    Sistema unificado de cache com múltiplas camadas:
    1. Memory Cache (mais rápido) - PerformanceCache
    2. Cloud Cache (distribuído) - CloudNativeCache  
    3. API Cache (persistente) - FirestoreCache
    """
    
    def __init__(self, config):
        self.config = config
        
        # Configuração de layers
        self.cache_layers = {
            'memory': True,
            'cloud': getattr(config, 'CLOUD_CACHE_ENABLED', True),
            'api': getattr(config, 'API_CACHE_ENABLED', True)
        }
        
        # Inicializar componentes de cache
        self._init_memory_cache()
        self._init_cloud_cache()
        self._init_api_cache()
        
        # Estatísticas unificadas
        self.stats = {
            'total_requests': 0,
            'memory_hits': 0,
            'cloud_hits': 0,
            'api_hits': 0,
            'misses': 0,
            'sets': 0,
            'evictions': 0,
            'errors': 0
        }
        
        # Thread para limpeza e otimização
        self.optimization_thread = threading.Thread(target=self._optimization_loop, daemon=True)
        self.optimization_thread.start()
        
        logger.info("[UNIFIED CACHE] Sistema unificado inicializado com sucesso")
    
    def _init_memory_cache(self):
        """Inicializa cache em memória (PerformanceCache)"""
        try:
            from core.performance.cache_manager import PerformanceCache
            self.memory_cache = PerformanceCache(
                max_size=getattr(self.config, 'MEMORY_CACHE_SIZE', 2000),
                ttl_minutes=getattr(self.config, 'MEMORY_CACHE_TTL', 120)
            )
            logger.info("[OK] Memory Cache inicializado")
        except Exception as e:
            logger.error(f"[ERROR] Falha no Memory Cache: {e}")
            self.memory_cache = None
            self.cache_layers['memory'] = False
    
    def _init_cloud_cache(self):
        """Inicializa cache distribuído (CloudNativeCache)"""
        try:
            if self.cache_layers['cloud']:
                from services.cache.cloud_native_cache import get_cloud_cache
                self.cloud_cache = get_cloud_cache()
                if self.cloud_cache:
                    logger.info("[OK] Cloud Cache inicializado")
                else:
                    logger.warning("[WARNING] Cloud Cache não disponível")
                    self.cache_layers['cloud'] = False
            else:
                self.cloud_cache = None
        except Exception as e:
            logger.error(f"[ERROR] Falha no Cloud Cache: {e}")
            self.cloud_cache = None
            self.cache_layers['cloud'] = False
    
    def _init_api_cache(self):
        """Inicializa cache via API (Firestore)"""
        try:
            if self.cache_layers['api']:
                from blueprints.cache_blueprint import init_firestore_client
                self.api_cache_client = init_firestore_client()
                if self.api_cache_client:
                    logger.info("[OK] API Cache inicializado")
                else:
                    logger.warning("[WARNING] API Cache não disponível")
                    self.cache_layers['api'] = False
            else:
                self.api_cache_client = None
        except Exception as e:
            logger.error(f"[ERROR] Falha no API Cache: {e}")
            self.api_cache_client = None
            self.cache_layers['api'] = False
    
    def get(self, key: str, default: Any = None, cache_type: str = 'auto') -> Any:
        """
        Busca valor no cache com fallback inteligente
        
        Args:
            key: Chave do cache
            default: Valor padrão se não encontrado
            cache_type: Tipo específico ('memory', 'cloud', 'api', 'auto')
        """
        self.stats['total_requests'] += 1
        
        try:
            # Cache específico solicitado
            if cache_type != 'auto':
                return self._get_from_specific_cache(key, cache_type, default)
            
            # Fallback automático (memory → cloud → api)
            
            # Layer 1: Memory Cache
            if self.cache_layers['memory'] and self.memory_cache:
                result = self._get_from_memory(key)
                if result is not None:
                    self.stats['memory_hits'] += 1
                    return result
            
            # Layer 2: Cloud Cache
            if self.cache_layers['cloud'] and self.cloud_cache:
                result = self._get_from_cloud(key)
                if result is not None:
                    self.stats['cloud_hits'] += 1
                    # Promover para memory cache
                    self._set_to_memory(key, result)
                    return result
            
            # Layer 3: API Cache
            if self.cache_layers['api'] and self.api_cache_client:
                result = self._get_from_api(key)
                if result is not None:
                    self.stats['api_hits'] += 1
                    # Promover para caches superiores
                    self._set_to_memory(key, result)
                    if self.cloud_cache:
                        self._set_to_cloud(key, result)
                    return result
            
            # Miss completo
            self.stats['misses'] += 1
            return default
            
        except Exception as e:
            logger.error(f"Erro na busca de cache: {e}")
            self.stats['errors'] += 1
            return default
    
    def set(self, key: str, value: Any, ttl: Optional[Union[int, timedelta]] = None, 
            cache_type: str = 'auto') -> bool:
        """
        Define valor no cache
        
        Args:
            key: Chave do cache
            value: Valor a ser armazenado
            ttl: Time-to-live (segundos ou timedelta)
            cache_type: Onde armazenar ('memory', 'cloud', 'api', 'auto')
        """
        self.stats['sets'] += 1
        
        try:
            success_count = 0
            
            # Normalizar TTL
            if isinstance(ttl, int):
                ttl = timedelta(seconds=ttl)
            elif ttl is None:
                ttl = timedelta(hours=2)  # TTL padrão
            
            # Cache específico
            if cache_type == 'memory':
                return self._set_to_memory(key, value, ttl)
            elif cache_type == 'cloud':
                return self._set_to_cloud(key, value, ttl)
            elif cache_type == 'api':
                return self._set_to_api(key, value, ttl)
            
            # Auto: salvar em todos os layers disponíveis
            if self.cache_layers['memory']:
                if self._set_to_memory(key, value, ttl):
                    success_count += 1
            
            if self.cache_layers['cloud']:
                if self._set_to_cloud(key, value, ttl):
                    success_count += 1
            
            if self.cache_layers['api']:
                if self._set_to_api(key, value, ttl):
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Erro ao definir cache: {e}")
            self.stats['errors'] += 1
            return False
    
    def _get_from_memory(self, key: str) -> Any:
        """Busca no memory cache"""
        try:
            if not self.memory_cache:
                return None
            
            # Adaptar para interface PerformanceCache
            if hasattr(self.memory_cache, 'cache'):
                cache_key = self._generate_key(key)
                if cache_key in self.memory_cache.cache:
                    entry = self.memory_cache.cache[cache_key]
                    if datetime.now() - entry.get('timestamp', datetime.min) < self.memory_cache.ttl:
                        return entry.get('response')
            
            return None
        except Exception as e:
            logger.debug(f"Erro no memory cache: {e}")
            return None
    
    def _set_to_memory(self, key: str, value: Any, ttl: timedelta = None) -> bool:
        """Define valor no memory cache"""
        try:
            if not self.memory_cache:
                return False
            
            # Adaptar para interface PerformanceCache
            if hasattr(self.memory_cache, 'set'):
                # Para personas usar interface existente
                if isinstance(value, dict) and 'persona' in str(key).lower():
                    persona = 'dr_gasnelio'  # Default
                    question = key.replace('persona:', '').replace('dr_gasnelio:', '').replace('ga:', '')
                    self.memory_cache.set(question, persona, value)
                else:
                    # Para outros dados, adaptar interface
                    cache_key = self._generate_key(key)
                    if len(self.memory_cache.cache) >= self.memory_cache.max_size:
                        self.memory_cache.cache.popitem(last=False)
                    
                    self.memory_cache.cache[cache_key] = {
                        'response': value,
                        'timestamp': datetime.now(),
                        'key': key
                    }
            
            return True
        except Exception as e:
            logger.debug(f"Erro ao salvar no memory cache: {e}")
            return False
    
    def _get_from_cloud(self, key: str) -> Any:
        """Busca no cloud cache"""
        try:
            if not self.cloud_cache:
                return None
            
            return self.cloud_cache.get(key)
        except Exception as e:
            logger.debug(f"Erro no cloud cache: {e}")
            return None
    
    def _set_to_cloud(self, key: str, value: Any, ttl: timedelta = None) -> bool:
        """Define valor no cloud cache"""
        try:
            if not self.cloud_cache:
                return False
            
            return self.cloud_cache.set(key, value, ttl)
        except Exception as e:
            logger.debug(f"Erro ao salvar no cloud cache: {e}")
            return False
    
    def _get_from_api(self, key: str) -> Any:
        """Busca no API cache (Firestore)"""
        try:
            if not self.api_cache_client:
                return None
            
            from blueprints.cache_blueprint import get_cache_document
            doc = get_cache_document(key)
            if doc and 'value' in doc:
                return doc['value']
            
            return None
        except Exception as e:
            logger.debug(f"Erro no API cache: {e}")
            return None
    
    def _set_to_api(self, key: str, value: Any, ttl: timedelta = None) -> bool:
        """Define valor no API cache"""
        try:
            if not self.api_cache_client:
                return False
            
            from blueprints.cache_blueprint import set_cache_document
            ttl_seconds = int(ttl.total_seconds()) if ttl else 7200  # 2 horas default
            
            return set_cache_document(key, value, ttl_seconds)
        except Exception as e:
            logger.debug(f"Erro ao salvar no API cache: {e}")
            return False
    
    def _get_from_specific_cache(self, key: str, cache_type: str, default: Any) -> Any:
        """Busca em cache específico"""
        if cache_type == 'memory':
            result = self._get_from_memory(key)
            if result is not None:
                self.stats['memory_hits'] += 1
                return result
        elif cache_type == 'cloud':
            result = self._get_from_cloud(key)
            if result is not None:
                self.stats['cloud_hits'] += 1
                return result
        elif cache_type == 'api':
            result = self._get_from_api(key)
            if result is not None:
                self.stats['api_hits'] += 1
                return result
        
        self.stats['misses'] += 1
        return default
    
    def _generate_key(self, key: str) -> str:
        """Gera chave consistente para cache"""
        return hashlib.sha256(key.encode()).hexdigest()[:16]
    
    def clear(self, cache_type: str = 'all') -> Dict[str, bool]:
        """Limpa cache específico ou todos"""
        results = {}
        
        try:
            if cache_type in ['all', 'memory'] and self.memory_cache:
                if hasattr(self.memory_cache, 'cache'):
                    self.memory_cache.cache.clear()
                results['memory'] = True
            
            if cache_type in ['all', 'cloud'] and self.cloud_cache:
                # Cloud cache não tem método clear direto
                results['cloud'] = False
            
            if cache_type in ['all', 'api'] and self.api_cache_client:
                # API cache clear via blueprint
                results['api'] = False
            
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
        
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas consolidadas do sistema"""
        total_requests = self.stats['total_requests']
        total_hits = self.stats['memory_hits'] + self.stats['cloud_hits'] + self.stats['api_hits']
        
        return {
            'enabled_layers': [k for k, v in self.cache_layers.items() if v],
            'total_requests': total_requests,
            'total_hits': total_hits,
            'total_misses': self.stats['misses'],
            'hit_rate': round((total_hits / total_requests * 100), 2) if total_requests > 0 else 0,
            'layer_stats': {
                'memory': {
                    'hits': self.stats['memory_hits'],
                    'hit_rate': round((self.stats['memory_hits'] / total_requests * 100), 2) if total_requests > 0 else 0,
                    'size': len(self.memory_cache.cache) if self.memory_cache and hasattr(self.memory_cache, 'cache') else 0
                },
                'cloud': {
                    'hits': self.stats['cloud_hits'],
                    'hit_rate': round((self.stats['cloud_hits'] / total_requests * 100), 2) if total_requests > 0 else 0,
                    'enabled': self.cache_layers['cloud']
                },
                'api': {
                    'hits': self.stats['api_hits'],
                    'hit_rate': round((self.stats['api_hits'] / total_requests * 100), 2) if total_requests > 0 else 0,
                    'enabled': self.cache_layers['api']
                }
            },
            'sets': self.stats['sets'],
            'evictions': self.stats['evictions'],
            'errors': self.stats['errors']
        }
    
    def _optimization_loop(self):
        """Loop de otimização automática"""
        import time
        
        while True:
            try:
                time.sleep(300)  # 5 minutos
                
                # Limpeza automática de expirados
                if self.memory_cache and hasattr(self.memory_cache, '_periodic_cleanup'):
                    # Cleanup já roda em thread separada no PerformanceCache
                    pass
                
                # Log de estatísticas
                if self.stats['total_requests'] > 0:
                    stats = self.get_stats()
                    logger.info(f"[CACHE STATS] Hit Rate: {stats['hit_rate']}% | "
                              f"Memory: {stats['layer_stats']['memory']['hits']} | "
                              f"Cloud: {stats['layer_stats']['cloud']['hits']} | "
                              f"API: {stats['layer_stats']['api']['hits']}")
                
            except Exception as e:
                logger.error(f"Erro no loop de otimização: {e}")
    
    # Interface para personas (compatibilidade)
    def cache_persona_response(self, persona_id: str, query: str, response: Any, confidence: float = 0.85) -> bool:
        """Cache específico para respostas de personas"""
        try:
            cache_key = f"persona:{persona_id}:{hashlib.md5(query.lower().encode()).hexdigest()[:16]}"
            
            cache_data = {
                'response': response,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat(),
                'persona_id': persona_id,
                'query_preview': query[:100]
            }
            
            # TTL baseado na confiança
            ttl_hours = 4 if confidence > 0.9 else 2
            ttl = timedelta(hours=ttl_hours)
            
            return self.set(cache_key, cache_data, ttl)
        except Exception as e:
            logger.error(f"Erro ao cachear resposta de persona: {e}")
            return False
    
    def get_cached_persona_response(self, persona_id: str, query: str) -> Optional[Dict[str, Any]]:
        """Busca resposta cacheada de persona"""
        try:
            cache_key = f"persona:{persona_id}:{hashlib.md5(query.lower().encode()).hexdigest()[:16]}"
            
            result = self.get(cache_key)
            if result and isinstance(result, dict):
                return result
            
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar cache de persona: {e}")
            return None
    
    # Interface para RAG (compatibilidade)
    def cache_rag_result(self, query: str, result: Any, source: str = 'rag') -> bool:
        """Cache específico para resultados RAG"""
        try:
            cache_key = f"rag:{source}:{hashlib.sha256(query.lower().encode()).hexdigest()[:16]}"
            
            cache_data = {
                'result': result,
                'query': query[:200],  # Preview da query
                'source': source,
                'timestamp': datetime.now().isoformat()
            }
            
            # TTL maior para resultados RAG (informação médica é estável)
            ttl = timedelta(hours=6)
            
            return self.set(cache_key, cache_data, ttl)
        except Exception as e:
            logger.error(f"Erro ao cachear resultado RAG: {e}")
            return False
    
    def get_cached_rag_result(self, query: str, source: str = 'rag') -> Any:
        """Busca resultado RAG cacheado"""
        try:
            cache_key = f"rag:{source}:{hashlib.sha256(query.lower().encode()).hexdigest()[:16]}"
            
            result = self.get(cache_key)
            if result and isinstance(result, dict) and 'result' in result:
                return result['result']
            
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar cache RAG: {e}")
            return None

# Instância global
_unified_cache: Optional[UnifiedCacheManager] = None

def get_unified_cache() -> Optional[UnifiedCacheManager]:
    """Obtém instância global do cache unificado"""
    global _unified_cache
    
    if _unified_cache is None:
        try:
            from app_config import config
            _unified_cache = UnifiedCacheManager(config)
            logger.info("[UNIFIED CACHE] Sistema global inicializado")
        except Exception as e:
            logger.error(f"Erro ao inicializar cache unificado: {e}")
            return None
    
    return _unified_cache

# Funções de conveniência para compatibilidade
def cache_get(key: str, default: Any = None, cache_type: str = 'auto') -> Any:
    """Função global para buscar no cache"""
    cache = get_unified_cache()
    return cache.get(key, default, cache_type) if cache else default

def cache_set(key: str, value: Any, ttl: Optional[Union[int, timedelta]] = None, 
              cache_type: str = 'auto') -> bool:
    """Função global para definir no cache"""
    cache = get_unified_cache()
    return cache.set(key, value, ttl, cache_type) if cache else False

def cache_stats() -> Dict[str, Any]:
    """Função global para estatísticas do cache"""
    cache = get_unified_cache()
    return cache.get_stats() if cache else {}