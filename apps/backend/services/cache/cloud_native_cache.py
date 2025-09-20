# -*- coding: utf-8 -*-
"""
Cloud Native Cache - Sistema de cache para embeddings e RAG
Integra Supabase + Cloud Storage + Firestore para cache distribuído
FASE 3 - Cache otimizado para Cloud Run stateless
"""

import os
import json
import hashlib
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone, timedelta
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)

# Imports com fallback seguro
FIREBASE_AVAILABLE = False
try:
    import firebase_admin
    from firebase_admin import firestore, storage
    FIREBASE_AVAILABLE = True
    logger.info("[OK] Firebase disponível para cloud cache")
except ImportError:
    logger.warning("[WARNING] Firebase não disponível - cache apenas local")
    FIREBASE_AVAILABLE = False

SUPABASE_CACHE_AVAILABLE = False
try:
    from services.supabase_vector_store import SUPABASE_AVAILABLE
    SUPABASE_CACHE_AVAILABLE = SUPABASE_AVAILABLE
except ImportError:
    SUPABASE_CACHE_AVAILABLE = False

class CloudNativeCache:
    """
    Cache distribuído Cloud-Native para embeddings e RAG
    Hierarquia: Memory -> Firestore -> Supabase -> Cloud Storage (fallback)
    """
    
    def __init__(self, config):
        self.config = config
        
        # Cache em memória (rápido mas volátil)
        self.memory_cache: Dict[str, Tuple[Any, datetime]] = {}
        self.max_memory_items = getattr(config, 'EMBEDDING_CACHE_SIZE', 1000)
        
        # TTL configurável
        self.default_ttl = timedelta(hours=getattr(config, 'CACHE_TTL_MINUTES', 60) / 60)
        
        # Clientes cloud
        self.firestore_client = None
        self.storage_client = None
        self.supabase_client = None
        
        # Configuração de cache levels - CLOUD STORAGE PRIORIZADO
        self.cache_enabled = {
            'memory': True,
            'firestore': False,  # Removido - usando apenas Cloud Storage + SQLite
            'supabase': getattr(config, 'EMBEDDINGS_CLOUD_CACHE', True),  # Para embeddings
            'cloud_storage': bool(getattr(config, 'CLOUD_STORAGE_BUCKET', None)) or True  # Ativado por padrão
        }
        
        self._init_cloud_clients()
        
        # Estatísticas de cache
        self.stats = {
            'memory_hits': 0,
            'firestore_hits': 0,
            'supabase_hits': 0,
            'cloud_storage_hits': 0,
            'misses': 0,
            'evictions': 0,
            'total_requests': 0
        }
        
        logger.info(f"[START] CloudNativeCache OTIMIZADO inicializado")
        logger.info(f"   - Levels ativos: {[k for k, v in self.cache_enabled.items() if v]}")
        logger.info(f"   - Cloud Storage: {'✅ ATIVO' if self.storage_client else '⚠️ FALLBACK LOCAL'}")
        logger.info(f"   - Supabase Cache: {'✅ ATIVO' if self.cache_enabled['supabase'] else '❌ INATIVO'}")
        logger.info(f"   - Memory Cache: ✅ ATIVO ({self.max_memory_items} items max)")
    
    def _init_cloud_clients(self):
        """Inicializa clientes cloud com fallback gracioso"""
        try:
            # Google Cloud Storage (PRIORIDADE MÁXIMA)
            if self.cache_enabled['cloud_storage']:
                bucket_name = getattr(self.config, 'CLOUD_STORAGE_BUCKET', None)
                if bucket_name and FIREBASE_AVAILABLE:
                    try:
                        self.storage_client = storage.bucket(bucket_name)
                        logger.info(f"[OK] Cloud Storage cache conectado: {bucket_name}")
                    except Exception as e:
                        logger.warning(f"[WARNING] Cloud Storage conexão falhou: {e}")
                        # Fallback para cache local
                        self._setup_local_storage_fallback()
                else:
                    logger.info("[INFO] Cloud Storage bucket não configurado, usando fallback local")
                    self._setup_local_storage_fallback()
            
            # Supabase (para cache de metadados)
            if self.cache_enabled['supabase'] and SUPABASE_CACHE_AVAILABLE:
                from services.supabase_vector_store import SupabaseVectorStore
                dummy_config = type('Config', (), {'SUPABASE_URL': self.config.SUPABASE_URL, 
                                                  'SUPABASE_KEY': self.config.SUPABASE_KEY})()
                supabase_store = SupabaseVectorStore(dummy_config)
                self.supabase_client = supabase_store.client
                logger.info("[OK] Supabase cache client conectado")
                
        except Exception as e:
            logger.warning(f"[WARNING] Erro ao inicializar clientes cloud: {e}")

    def _setup_local_storage_fallback(self):
        """Configura fallback local para Cloud Storage"""
        self.local_cache_dir = Path('./cache/cloud_storage_fallback')
        self.local_cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"[OK] Fallback local configurado: {self.local_cache_dir}")

    def _generate_cache_key(self, key_data: Any) -> str:
        """Gera chave de cache determinística"""
        if isinstance(key_data, str):
            content = key_data
        elif isinstance(key_data, np.ndarray):
            content = key_data.tobytes()
        else:
            content = json.dumps(key_data, sort_keys=True)
        
        # SHA-256 para chaves de cache (não dados sensíveis)
        return hashlib.sha256(content.encode() if isinstance(content, str) else content).hexdigest()[:16]
    
    def get(self, key: str, default: Any = None) -> Any:
        """Busca item no cache com hierarquia de fallback"""
        self.stats['total_requests'] += 1
        cache_key = self._generate_cache_key(key)
        
        # Level 1: Memory cache (mais rápido)
        result = self._get_from_memory(cache_key)
        if result is not None:
            self.stats['memory_hits'] += 1
            return result

        # Level 2: Cloud Storage cache (NOVO PRIORIZADO)
        if self.cache_enabled['cloud_storage']:
            result = self._get_from_cloud_storage(cache_key)
            if result is not None:
                self.stats['cloud_storage_hits'] += 1
                # Promover para memory cache
                self._set_to_memory(cache_key, result)
                return result

        # Level 3: Supabase cache (para dados estruturados)
        if self.cache_enabled['supabase']:
            result = self._get_from_supabase(cache_key)
            if result is not None:
                self.stats['supabase_hits'] += 1
                # Promover para caches superiores
                self._set_to_memory(cache_key, result)
                if self.cache_enabled['firestore']:
                    self._set_to_firestore(cache_key, result)
                return result
        
        # Level 4: Cloud Storage (fallback final)
        if self.cache_enabled['cloud_storage']:
            result = self._get_from_cloud_storage(cache_key)
            if result is not None:
                self.stats['cloud_storage_hits'] += 1
                # Promover para todos os caches
                self._set_to_memory(cache_key, result)
                if self.cache_enabled['firestore']:
                    self._set_to_firestore(cache_key, result)
                if self.cache_enabled['supabase']:
                    self._set_to_supabase(cache_key, result)
                return result
        
        # Miss completo
        self.stats['misses'] += 1
        return default
    
    def set(self, key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Salva item em todos os cache levels habilitados"""
        cache_key = self._generate_cache_key(key)
        ttl = ttl or self.default_ttl
        
        success_count = 0
        total_levels = sum(self.cache_enabled.values())
        
        # Salvar em todos os levels simultaneamente
        if self.cache_enabled['memory']:
            if self._set_to_memory(cache_key, value, ttl):
                success_count += 1
        
        if self.cache_enabled['firestore']:
            if self._set_to_firestore(cache_key, value, ttl):
                success_count += 1
        
        if self.cache_enabled['supabase']:
            if self._set_to_supabase(cache_key, value, ttl):
                success_count += 1
        
        if self.cache_enabled['cloud_storage']:
            if self._set_to_cloud_storage(cache_key, value, ttl):
                success_count += 1
        
        return success_count > 0  # Sucesso se pelo menos um level funcionou
    
    def _get_from_memory(self, cache_key: str) -> Any:
        """Busca no cache de memória"""
        try:
            if cache_key in self.memory_cache:
                value, expires_at = self.memory_cache[cache_key]
                if datetime.now() < expires_at:
                    return value
                else:
                    # Expirado - remover
                    del self.memory_cache[cache_key]
                    self.stats['evictions'] += 1
            return None
        except Exception as e:
            logger.debug(f"Erro no memory cache: {e}")
            return None
    
    def _set_to_memory(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Salva no cache de memória"""
        try:
            # Limpar cache se muito cheio
            if len(self.memory_cache) >= self.max_memory_items:
                self._evict_oldest_memory()
            
            expires_at = datetime.now() + (ttl or self.default_ttl)
            self.memory_cache[cache_key] = (value, expires_at)
            return True
        except Exception as e:
            logger.debug(f"Erro ao salvar no memory cache: {e}")
            return False
    
    def _evict_oldest_memory(self):
        """Remove itens mais antigos do memory cache"""
        try:
            # Remover 10% dos itens mais antigos
            items_to_remove = max(1, len(self.memory_cache) // 10)
            oldest_keys = sorted(
                self.memory_cache.keys(),
                key=lambda k: self.memory_cache[k][1]  # Ordenar por expires_at
            )[:items_to_remove]
            
            for key in oldest_keys:
                del self.memory_cache[key]
                self.stats['evictions'] += 1
                
        except Exception as e:
            logger.debug(f"Erro na eviction: {e}")
    
    def _get_from_firestore(self, cache_key: str) -> Any:
        """Busca no Firestore"""
        try:
            if not self.firestore_client:
                return None
            
            doc_ref = self.firestore_client.collection('embeddings_cache').document(cache_key)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                expires_at = data.get('expires_at')
                
                if expires_at and datetime.now(timezone.utc) < expires_at:
                    # Deserializar numpy arrays se necessário
                    value = data.get('value')
                    if data.get('type') == 'numpy_array' and isinstance(value, list):
                        return np.array(value)
                    return value
                else:
                    # Expirado - remover async
                    doc_ref.delete()
            
            return None
            
        except Exception as e:
            logger.debug(f"Erro no Firestore cache: {e}")
            return None
    
    def _set_to_firestore(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Salva no Firestore"""
        try:
            if not self.firestore_client:
                return False
            
            # Preparar dados para serialização
            cache_data = {
                'value': value,
                'type': 'standard',
                'created_at': datetime.now(timezone.utc),
                'expires_at': datetime.now(timezone.utc) + (ttl or self.default_ttl)
            }
            
            # Serializar numpy arrays
            if isinstance(value, np.ndarray):
                cache_data['value'] = value.tolist()
                cache_data['type'] = 'numpy_array'
            
            doc_ref = self.firestore_client.collection('embeddings_cache').document(cache_key)
            doc_ref.set(cache_data)
            
            return True
            
        except Exception as e:
            logger.debug(f"Erro ao salvar no Firestore: {e}")
            return False
    
    def _get_from_supabase(self, cache_key: str) -> Any:
        """Busca no Supabase cache table"""
        try:
            if not self.supabase_client:
                return None
            
            result = self.supabase_client.table('search_cache').select('*').eq('query_hash', cache_key).execute()
            
            if result.data and len(result.data) > 0:
                cache_entry = result.data[0]
                expires_at = datetime.fromisoformat(cache_entry['expires_at'])
                
                if datetime.now(timezone.utc) < expires_at:
                    return cache_entry['results']
                else:
                    # Expirado - remover
                    self.supabase_client.table('search_cache').delete().eq('query_hash', cache_key).execute()
            
            return None
            
        except Exception as e:
            logger.debug(f"Erro no Supabase cache: {e}")
            return None
    
    def _set_to_supabase(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Salva no Supabase cache"""
        try:
            if not self.supabase_client:
                return False
            
            expires_at = datetime.now(timezone.utc) + (ttl or self.default_ttl)
            
            cache_data = {
                'query_hash': cache_key,
                'query': f'Cached at {datetime.now().isoformat()}',
                'results': value if not isinstance(value, np.ndarray) else value.tolist(),
                'similarity_threshold': 0.0,
                'result_count': 1 if not isinstance(value, list) else len(value),
                'expires_at': expires_at.isoformat()
            }
            
            self.supabase_client.table('search_cache').upsert(cache_data).execute()
            return True
            
        except Exception as e:
            logger.debug(f"Erro ao salvar no Supabase cache: {e}")
            return False
    
    def _get_from_cloud_storage(self, cache_key: str) -> Any:
        """Busca no Cloud Storage com fallback local"""
        try:
            # Prioridade 1: Cloud Storage
            if self.storage_client:
                return self._get_from_gcs_bucket(cache_key)
            # Fallback: Storage local
            else:
                return self._get_from_local_storage(cache_key)
        except Exception as e:
            logger.debug(f"Erro no Cloud Storage cache: {e}")
            return None

    def _get_from_gcs_bucket(self, cache_key: str) -> Any:
        """Busca no Google Cloud Storage bucket"""
        try:
            
            blob_name = f"embeddings_cache/{cache_key}.json"
            blob = self.storage_client.blob(blob_name)
            
            if blob.exists():
                data = json.loads(blob.download_as_text())
                expires_at = datetime.fromisoformat(data.get('expires_at', '1970-01-01T00:00:00'))
                
                if datetime.now(timezone.utc) < expires_at:
                    value = data.get('value')
                    # Deserializar numpy arrays
                    if data.get('type') == 'numpy_array':
                        return np.array(value)
                    return value
                else:
                    # Expirado - remover
                    blob.delete()
            
            return None
            
        except Exception as e:
            logger.debug(f"Erro no Cloud Storage cache: {e}")
            return None
    
    def _set_to_cloud_storage(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Salva no Cloud Storage com fallback local"""
        try:
            # Prioridade 1: Cloud Storage
            if self.storage_client:
                return self._set_to_gcs_bucket(cache_key, value, ttl)
            # Fallback: Storage local
            else:
                return self._set_to_local_storage(cache_key, value, ttl)
        except Exception as e:
            logger.debug(f"Erro ao salvar no Cloud Storage: {e}")
            return False

    def _set_to_gcs_bucket(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Salva no Google Cloud Storage bucket"""
        try:
            
            # Preparar dados
            cache_data = {
                'value': value,
                'type': 'standard',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc) + (ttl or self.default_ttl)).isoformat()
            }
            
            # Serializar numpy arrays
            if isinstance(value, np.ndarray):
                cache_data['value'] = value.tolist()
                cache_data['type'] = 'numpy_array'
            
            blob_name = f"embeddings_cache/{cache_key}.json"
            blob = self.storage_client.blob(blob_name)
            blob.upload_from_string(
                json.dumps(cache_data),
                content_type='application/json'
            )
            
            return True
            
        except Exception as e:
            logger.debug(f"Erro ao salvar no Cloud Storage: {e}")
            return False
    
    def clear_expired(self) -> Dict[str, int]:
        """Limpa itens expirados de todos os caches"""
        cleared = {'memory': 0, 'firestore': 0, 'supabase': 0, 'cloud_storage': 0}
        
        try:
            # Memory cache
            expired_keys = [
                k for k, (_, expires_at) in self.memory_cache.items() 
                if datetime.now() > expires_at
            ]
            for key in expired_keys:
                del self.memory_cache[key]
            cleared['memory'] = len(expired_keys)
            
            # Cloud services - cleanup automático via TTL ou scheduled functions
            
        except Exception as e:
            logger.error(f"Erro na limpeza de cache: {e}")
        
        return cleared
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas detalhadas do cache"""
        total_requests = self.stats['total_requests']
        
        return {
            'enabled_levels': [k for k, v in self.cache_enabled.items() if v],
            'memory_size': len(self.memory_cache),
            'memory_limit': self.max_memory_items,
            'hit_rates': {
                'memory': (self.stats['memory_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'firestore': (self.stats['firestore_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'supabase': (self.stats['supabase_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'cloud_storage': (self.stats['cloud_storage_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'total': ((total_requests - self.stats['misses']) / total_requests * 100) if total_requests > 0 else 0
            },
            'stats': self.stats.copy()
        }

    def _get_from_local_storage(self, cache_key: str) -> Any:
        """Fallback local para Cloud Storage"""
        try:
            if not hasattr(self, 'local_cache_dir'):
                return None

            cache_file = self.local_cache_dir / f"{cache_key}.json"
            if cache_file.exists():
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                expires_at = datetime.fromisoformat(data.get('expires_at', '1970-01-01T00:00:00'))
                if datetime.now() < expires_at:
                    value = data.get('value')
                    # Deserializar numpy arrays
                    if data.get('type') == 'numpy_array':
                        return np.array(value)
                    return value
                else:
                    # Expirado - remover
                    cache_file.unlink()
            return None
        except Exception as e:
            logger.debug(f"Erro no local storage cache: {e}")
            return None

    def _set_to_local_storage(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Fallback local para Cloud Storage"""
        try:
            if not hasattr(self, 'local_cache_dir'):
                self._setup_local_storage_fallback()

            # Preparar dados
            cache_data = {
                'value': value,
                'type': 'standard',
                'created_at': datetime.now().isoformat(),
                'expires_at': (datetime.now() + (ttl or self.default_ttl)).isoformat()
            }

            # Serializar numpy arrays
            if isinstance(value, np.ndarray):
                cache_data['value'] = value.tolist()
                cache_data['type'] = 'numpy_array'

            cache_file = self.local_cache_dir / f"{cache_key}.json"
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)

            return True
        except Exception as e:
            logger.debug(f"Erro ao salvar no local storage: {e}")
            return False

# Instância global
_cloud_cache: Optional[CloudNativeCache] = None

def get_cloud_cache() -> Optional[CloudNativeCache]:
    """Obtém instância global do cloud cache"""
    global _cloud_cache
    
    if _cloud_cache is None:
        try:
            from app_config import config
            _cloud_cache = CloudNativeCache(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar cloud cache: {e}")
            return None
    
    return _cloud_cache