# -*- coding: utf-8 -*-
"""
Sistema Unificado de Dependências
Centraliza a criação e gerenciamento de dependências sem imports circulares
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
import logging

# Import configs
from app_config import config

logger = logging.getLogger(__name__)

@dataclass
class ServiceConfig:
    """Configuração para serviços"""
    cache_enabled: bool = True
    rag_enabled: bool = True
    qa_enabled: bool = True
    max_cache_size: int = 2000
    cache_ttl_minutes: int = 120

@dataclass
class Dependencies:
    """Container para todas as dependências do sistema"""
    cache: Optional[Any] = None
    rag_service: Optional[Any] = None
    qa_framework: Optional[Any] = None
    config: Any = None
    logger: Any = None
    
class DependencyManager:
    """Gerenciador unificado de dependências com factory pattern"""

    _instance: Optional['DependencyManager'] = None

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Inicializa gerenciador uma vez"""
        if not hasattr(self, '_initialized'):
            self.config = config
            self.service_config = ServiceConfig(
                cache_enabled=getattr(config, 'ADVANCED_CACHE', True),
                rag_enabled=getattr(config, 'RAG_ENABLED', True),
                qa_enabled=getattr(config, 'QA_ENABLED', True),
                max_cache_size=getattr(config, 'CACHE_MAX_SIZE', 2000),
                cache_ttl_minutes=getattr(config, 'CACHE_TTL_MINUTES', 120)
            )

            # Cache de instâncias para evitar recriação
            self._cache_instance = None
            self._rag_instance = None
            self._qa_instance = None
            self._initialized = True

    def create_cache_service(self) -> Optional[Any]:
        """Cria serviço de cache com fallback hierarchy"""
        if self._cache_instance is not None:
            return self._cache_instance

        if not self.service_config.cache_enabled:
            return self._create_simple_cache()

        # Tentar unified cache
        cache = self._try_create_unified_cache()
        if cache:
            self._cache_instance = cache
            return cache

        # Tentar performance cache
        cache = self._try_create_performance_cache()
        if cache:
            self._cache_instance = cache
            return cache

        # Fallback simples
        cache = self._create_simple_cache()
        self._cache_instance = cache
        return cache

    def _try_create_unified_cache(self) -> Optional[Any]:
        """Tenta criar unified cache"""
        try:
            from services.cache.unified_cache_manager import UnifiedCacheManager
            cache = UnifiedCacheManager(self.config)
            logger.info("[DEPENDENCIES] Unified cache criado com sucesso")
            return cache
        except ImportError:
            logger.debug("[DEPENDENCIES] Unified cache não disponível")
        except Exception as e:
            logger.error(f"[DEPENDENCIES] Erro ao criar unified cache: {e}")
        return None

    def _try_create_performance_cache(self) -> Optional[Any]:
        """Tenta criar performance cache"""
        try:
            from services.advanced_cache import PerformanceCache
            cache = PerformanceCache(
                max_size=self.service_config.max_cache_size,
                ttl_minutes=self.service_config.cache_ttl_minutes
            )
            logger.info("[DEPENDENCIES] Performance cache criado com sucesso")
            return cache
        except ImportError:
            logger.debug("[DEPENDENCIES] Performance cache não disponível")
        except Exception as e:
            logger.error(f"[DEPENDENCIES] Erro ao criar performance cache: {e}")
        return None

    def _create_simple_cache(self) -> Any:
        """Cria cache simples como fallback"""
        class SimpleCache:
            def __init__(self):
                self.cache = {}
                self.hits = 0
                self.misses = 0

            def get(self, key: str) -> Optional[Any]:
                if key in self.cache:
                    self.hits += 1
                    return self.cache[key]
                self.misses += 1
                return None

            def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
                self.cache[key] = value

            def get_stats(self) -> Dict[str, Any]:
                total = self.hits + self.misses
                hit_rate = (self.hits / total * 100) if total > 0 else 0
                return {
                    "hits": self.hits,
                    "misses": self.misses,
                    "hit_rate": hit_rate,
                    "total_entries": len(self.cache),
                    "type": "simple_fallback"
                }

        logger.info("[DEPENDENCIES] Simple cache criado como fallback")
        return SimpleCache()

    def create_rag_service(self) -> Optional[Any]:
        """Cria serviço RAG com fallback hierarchy"""
        if self._rag_instance is not None:
            return self._rag_instance

        if not self.service_config.rag_enabled:
            return None

        # Tentar Supabase RAG primeiro
        rag = self._try_create_supabase_rag()
        if rag:
            self._rag_instance = rag
            return rag

        # Tentar enhanced RAG
        rag = self._try_create_enhanced_rag()
        if rag:
            self._rag_instance = rag
            return rag

        # Tentar simple RAG
        rag = self._try_create_simple_rag()
        if rag:
            self._rag_instance = rag
            return rag

        return None

    def _try_create_supabase_rag(self) -> Optional[Any]:
        """Tenta criar Supabase RAG system"""
        try:
            from services.rag.supabase_rag_system import SupabaseRAGSystem
            rag = SupabaseRAGSystem(self.config)
            logger.info("[DEPENDENCIES] Supabase RAG criado com sucesso")
            return rag
        except ImportError:
            logger.debug("[DEPENDENCIES] Supabase RAG não disponível")
        except Exception as e:
            logger.error(f"[DEPENDENCIES] Erro ao criar Supabase RAG: {e}")
        return None

    def _try_create_enhanced_rag(self) -> Optional[Any]:
        """Tenta criar enhanced RAG"""
        try:
            from services.enhanced_rag_system import get_enhanced_context
            # Wrapper para interface consistente
            class EnhancedRAGWrapper:
                def get_context(self, query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
                    return get_enhanced_context(query, max_chunks)

                def get_stats(self) -> dict:
                    return {"type": "enhanced", "available": True}

            logger.info("[DEPENDENCIES] Enhanced RAG criado com sucesso")
            return EnhancedRAGWrapper()
        except ImportError:
            logger.debug("[DEPENDENCIES] Enhanced RAG não disponível")
        except Exception as e:
            logger.error(f"[DEPENDENCIES] Erro ao criar Enhanced RAG: {e}")
        return None

    def _try_create_simple_rag(self) -> Optional[Any]:
        """Tenta criar simple RAG"""
        try:
            from services.simple_rag import generate_context_from_rag
            # Wrapper para interface consistente
            class SimpleRAGWrapper:
                def get_context(self, query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
                    return generate_context_from_rag(query, max_chunks)

                def get_stats(self) -> dict:
                    return {"type": "simple", "available": True}

            logger.info("[DEPENDENCIES] Simple RAG criado com sucesso")
            return SimpleRAGWrapper()
        except ImportError:
            logger.debug("[DEPENDENCIES] Simple RAG não disponível")
        except Exception as e:
            logger.error(f"[DEPENDENCIES] Erro ao criar Simple RAG: {e}")
        return None

    def create_qa_framework(self) -> Optional[Any]:
        """Cria QA framework"""
        if self._qa_instance is not None:
            return self._qa_instance

        if not self.service_config.qa_enabled:
            return None

        try:
            from core.validation.educational_qa_framework import EducationalQAFramework
            qa = EducationalQAFramework()
            self._qa_instance = qa
            logger.info("[DEPENDENCIES] QA Framework criado com sucesso")
            return qa
        except ImportError:
            logger.debug("[DEPENDENCIES] QA Framework não disponível")
        except Exception as e:
            logger.error(f"[DEPENDENCIES] Erro ao criar QA Framework: {e}")

        return None

    def get_service_status(self) -> Dict[str, bool]:
        """Retorna status de todos os serviços"""
        return {
            "cache": self._cache_instance is not None,
            "rag": self._rag_instance is not None,
            "qa": self._qa_instance is not None,
            "cache_enabled": self.service_config.cache_enabled,
            "rag_enabled": self.service_config.rag_enabled,
            "qa_enabled": self.service_config.qa_enabled
        }


# Instância global do gerenciador
_dependency_manager: Optional[DependencyManager] = None

def get_dependency_manager() -> DependencyManager:
    """Obtém instância global do gerenciador"""
    global _dependency_manager

    if _dependency_manager is None:
        _dependency_manager = DependencyManager()
        logger.info("[DEPENDENCIES] Dependency manager inicializado")

    return _dependency_manager

# Funções de conveniência para compatibilidade
def get_cache() -> Optional[Any]:
    """Obtém serviço de cache"""
    manager = get_dependency_manager()
    return manager.create_cache_service()

def get_rag() -> Optional[Any]:
    """Obtém serviço RAG"""
    manager = get_dependency_manager()
    return manager.create_rag_service()

def get_qa() -> Optional[Any]:
    """Obtém QA framework"""
    manager = get_dependency_manager()
    return manager.create_qa_framework()

def get_config() -> Any:
    """Obtém configuração"""
    return config


