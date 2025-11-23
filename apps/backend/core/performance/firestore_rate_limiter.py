# -*- coding: utf-8 -*-
"""
Firestore Rate Limiter - Substituição do Redis Rate Limiter
==========================================================

Implementa rate limiting distribuído usando Firestore com fallback
para sistema local. Substitui completamente o redis_rate_limiter.py.

Características:
- Rate limiting distribuído via Firestore
- Fallback automático para sistema local (em memória)
- Performance otimizada com batch operations
- Integração transparente com middleware existente
- Cache local para reduzir calls ao Firestore

Autor: Sistema de Segurança Roteiro de Dispensação  
Data: 30/08/2025
Substitui: redis_rate_limiter.py (FASE 5)
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, Set
from collections import defaultdict, deque
import logging
import threading
import time
import json

# Firestore imports (com fallback)
try:
    import firebase_admin
    from firebase_admin import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False

logger = logging.getLogger(__name__)

class FirestoreRateLimiter:
    """
    Rate limiter distribuído usando Firestore como backend
    Com fallback completo para sistema em memória
    """
    
    def __init__(self, collection_name: str = "rate_limits"):
        self.collection_name = collection_name
        self.local_cache = defaultdict(lambda: {"count": 0, "reset_time": None})
        self.cache_lock = threading.RLock()
        
        # Configurações
        self.cache_ttl = 60  # Cache local por 1 minuto
        self.batch_size = 50  # Batch operations
        self.fallback_mode = False
        
        # Stats
        self.stats = {
            "firestore_operations": 0,
            "firestore_failures": 0,
            "local_cache_hits": 0,
            "rate_limits_applied": 0
        }
        
        # Inicializar Firestore
        self._init_firestore()
    
    def _init_firestore(self):
        """Inicializa conexão com Firestore"""
        try:
            if FIRESTORE_AVAILABLE:
                self.db = firestore.client()
                self.collection_ref = self.db.collection(self.collection_name)
                logger.info("✓ Firestore Rate Limiter inicializado")
            else:
                logger.warning("⚠ Firestore não disponível, usando fallback local")
                self.fallback_mode = True
        except Exception as e:
            logger.error(f"❌ Falha ao inicializar Firestore: {e}")
            self.fallback_mode = True
    
    def check_rate_limit(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, Dict[str, Any]]:
        """
        Verifica se uma chave está dentro do rate limit
        
        Args:
            key: Identificador único (IP, user_id, etc.)
            limit: Número máximo de requests
            window_seconds: Janela de tempo em segundos
            
        Returns:
            (allowed: bool, info: dict)
        """
        current_time = datetime.now(timezone.utc)
        window_start = current_time - timedelta(seconds=window_seconds)
        
        # 1. Verificar cache local primeiro (performance)
        cached_info = self._check_local_cache(key, limit, window_seconds, current_time)
        if cached_info:
            self.stats["local_cache_hits"] += 1
            return cached_info
        
        # 2. Verificar Firestore (se disponível)
        if not self.fallback_mode:
            try:
                allowed, info = self._check_firestore_rate_limit(key, limit, window_seconds, current_time)
                
                # Atualizar cache local
                self._update_local_cache(key, info, current_time)
                
                return allowed, info
                
            except Exception as e:
                logger.warning(f"⚠ Firestore rate limit falhou para {key}: {e}")
                self.stats["firestore_failures"] += 1
                # Fallback para sistema local
        
        # 3. Fallback para sistema local
        return self._check_local_rate_limit(key, limit, window_seconds, current_time)
    
    def _check_local_cache(self, key: str, limit: int, window_seconds: int, current_time: datetime) -> Optional[Tuple[bool, Dict[str, Any]]]:
        """Verifica cache local rápido"""
        with self.cache_lock:
            if key not in self.local_cache:
                return None
                
            cached = self.local_cache[key]
            
            # Cache expirado?
            if cached["reset_time"] and current_time > cached["reset_time"]:
                del self.local_cache[key]
                return None
            
            # Cache válido - retornar info
            remaining = max(0, limit - cached["count"])
            allowed = cached["count"] < limit
            
            if allowed:
                cached["count"] += 1
            
            return allowed, {
                "remaining": remaining - 1 if allowed else remaining,
                "reset_time": cached["reset_time"],
                "total_hits": cached["count"],
                "source": "local_cache"
            }
    
    def _check_firestore_rate_limit(self, key: str, limit: int, window_seconds: int, current_time: datetime) -> Tuple[bool, Dict[str, Any]]:
        """Verifica rate limit no Firestore"""
        self.stats["firestore_operations"] += 1
        
        # Documento do rate limit
        doc_ref = self.collection_ref.document(f"rl_{key}")
        
        # Transação atômica
        @firestore.transactional
        def update_rate_limit(transaction):
            doc = doc_ref.get(transaction=transaction)
            
            reset_time = current_time + timedelta(seconds=window_seconds)
            
            if not doc.exists:
                # Primeiro acesso - criar documento
                data = {
                    "count": 1,
                    "reset_time": reset_time,
                    "window_seconds": window_seconds,
                    "last_updated": current_time
                }
                transaction.set(doc_ref, data)
                
                return True, {
                    "remaining": limit - 1,
                    "reset_time": reset_time,
                    "total_hits": 1,
                    "source": "firestore_new"
                }
            
            # Documento existe - verificar janela
            doc_data = doc.to_dict()
            doc_reset_time = doc_data.get("reset_time")
            
            # Janela expirada? Resetar contador
            if current_time > doc_reset_time:
                data = {
                    "count": 1,
                    "reset_time": reset_time,
                    "window_seconds": window_seconds,
                    "last_updated": current_time
                }
                transaction.update(doc_ref, data)
                
                return True, {
                    "remaining": limit - 1,
                    "reset_time": reset_time,
                    "total_hits": 1,
                    "source": "firestore_reset"
                }
            
            # Dentro da janela - verificar limite
            current_count = doc_data.get("count", 0)
            
            if current_count >= limit:
                # Rate limit excedido
                return False, {
                    "remaining": 0,
                    "reset_time": doc_reset_time,
                    "total_hits": current_count,
                    "source": "firestore_blocked"
                }
            
            # Permitir e incrementar
            new_count = current_count + 1
            transaction.update(doc_ref, {
                "count": new_count,
                "last_updated": current_time
            })
            
            return True, {
                "remaining": limit - new_count,
                "reset_time": doc_reset_time,
                "total_hits": new_count,
                "source": "firestore_allowed"
            }
        
        # Executar transação
        transaction = self.db.transaction()
        return update_rate_limit(transaction)
    
    def _check_local_rate_limit(self, key: str, limit: int, window_seconds: int, current_time: datetime) -> Tuple[bool, Dict[str, Any]]:
        """Fallback: rate limit em memória local"""
        with self.cache_lock:
            if key not in self.local_cache:
                # Primeiro acesso
                reset_time = current_time + timedelta(seconds=window_seconds)
                self.local_cache[key] = {
                    "count": 1,
                    "reset_time": reset_time
                }
                return True, {
                    "remaining": limit - 1,
                    "reset_time": reset_time,
                    "total_hits": 1,
                    "source": "local_fallback_new"
                }
            
            cached = self.local_cache[key]
            
            # Janela expirada?
            if current_time > cached["reset_time"]:
                reset_time = current_time + timedelta(seconds=window_seconds)
                cached["count"] = 1
                cached["reset_time"] = reset_time
                return True, {
                    "remaining": limit - 1,
                    "reset_time": reset_time,
                    "total_hits": 1,
                    "source": "local_fallback_reset"
                }
            
            # Verificar limite
            if cached["count"] >= limit:
                return False, {
                    "remaining": 0,
                    "reset_time": cached["reset_time"],
                    "total_hits": cached["count"],
                    "source": "local_fallback_blocked"
                }
            
            # Permitir e incrementar
            cached["count"] += 1
            return True, {
                "remaining": limit - cached["count"],
                "reset_time": cached["reset_time"],
                "total_hits": cached["count"],
                "source": "local_fallback_allowed"
            }
    
    def _update_local_cache(self, key: str, info: Dict[str, Any], current_time: datetime):
        """Atualiza cache local com info do Firestore"""
        with self.cache_lock:
            self.local_cache[key] = {
                "count": info["total_hits"],
                "reset_time": info["reset_time"]
            }
    
    def cleanup_expired(self):
        """Remove entradas expiradas do cache local"""
        current_time = datetime.now(timezone.utc)
        
        with self.cache_lock:
            expired_keys = []
            for key, cached in self.local_cache.items():
                if cached["reset_time"] and current_time > cached["reset_time"]:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.local_cache[key]
            
            logger.debug(f"🧹 Cleanup: removidas {len(expired_keys)} entradas expiradas")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do rate limiter"""
        with self.cache_lock:
            return {
                **self.stats,
                "local_cache_size": len(self.local_cache),
                "fallback_mode": self.fallback_mode,
                "firestore_available": FIRESTORE_AVAILABLE
            }
    
    def clear_rate_limit(self, key: str) -> bool:
        """
        Remove rate limit para uma chave específica
        Útil para testes e casos especiais
        """
        try:
            # Limpar cache local
            with self.cache_lock:
                if key in self.local_cache:
                    del self.local_cache[key]
            
            # Limpar Firestore
            if not self.fallback_mode:
                doc_ref = self.collection_ref.document(f"rl_{key}")
                doc_ref.delete()
            
            logger.info(f"✓ Rate limit removido para chave: {key}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao limpar rate limit para {key}: {e}")
            return False

# Instância global (singleton)
_firestore_rate_limiter = None

def get_firestore_rate_limiter() -> FirestoreRateLimiter:
    """Retorna instância singleton do rate limiter"""
    global _firestore_rate_limiter
    if _firestore_rate_limiter is None:
        _firestore_rate_limiter = FirestoreRateLimiter()
    return _firestore_rate_limiter

# Funções compatíveis com middleware existente
def check_rate_limit(key: str, limit: int, window_seconds: int = 3600) -> Tuple[bool, Dict[str, Any]]:
    """Função de conveniência compatível com middleware existente"""
    limiter = get_firestore_rate_limiter()
    return limiter.check_rate_limit(key, limit, window_seconds)

def clear_rate_limit(key: str) -> bool:
    """Função de conveniência para limpar rate limit"""
    limiter = get_firestore_rate_limiter()
    return limiter.clear_rate_limit(key)