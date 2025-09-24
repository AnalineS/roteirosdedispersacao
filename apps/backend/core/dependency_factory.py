# -*- coding: utf-8 -*-
"""
Dependency Factory - Factory pattern para criação de dependências
Elimina circular imports através de lazy loading e factory methods
"""

import logging
from typing import Optional, Any, Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ServiceConfig:
    """Configuração para serviços"""
    cache_enabled: bool = True
    rag_enabled: bool = True
    qa_enabled: bool = True
    max_cache_size: int = 2000
    cache_ttl_minutes: int = 120

class DependencyFactory:
    """Factory para criação de dependências sem circular imports"""

    def __init__(self, config):
        self.config = config
        self.service_config = ServiceConfig(
            cache_enabled=getattr(config, 'ADVANCED_CACHE', True),
            rag_enabled=getattr(config, 'RAG_AVAILABLE', True),
            qa_enabled=getattr(config, 'QA_ENABLED', True),
            max_cache_size=getattr(config, 'CACHE_MAX_SIZE', 2000),
            cache_ttl_minutes=getattr(config, 'CACHE_TTL_MINUTES', 120)
        )

        # Cache de instâncias para evitar recriação
        self._cache_instance = None
        self._rag_instance = None
        self._qa_instance = None

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
            logger.info("[FACTORY] Unified cache criado com sucesso")
            return cache
        except ImportError:
            logger.debug("[FACTORY] Unified cache não disponível")
        except Exception as e:
            logger.error(f"[FACTORY] Erro ao criar unified cache: {e}")
        return None

    def _try_create_performance_cache(self) -> Optional[Any]:
        """Tenta criar performance cache"""
        try:
            from services.advanced_cache import PerformanceCache
            cache = PerformanceCache(
                max_size=self.service_config.max_cache_size,
                ttl_minutes=self.service_config.cache_ttl_minutes
            )
            logger.info("[FACTORY] Performance cache criado com sucesso")
            return cache
        except ImportError:
            logger.debug("[FACTORY] Performance cache não disponível")
        except Exception as e:
            logger.error(f"[FACTORY] Erro ao criar performance cache: {e}")
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

        logger.info("[FACTORY] Simple cache criado como fallback")
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
            logger.info("[FACTORY] Supabase RAG criado com sucesso")
            return rag
        except ImportError:
            logger.debug("[FACTORY] Supabase RAG não disponível")
        except Exception as e:
            logger.error(f"[FACTORY] Erro ao criar Supabase RAG: {e}")
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

            logger.info("[FACTORY] Enhanced RAG criado com sucesso")
            return EnhancedRAGWrapper()
        except ImportError:
            logger.debug("[FACTORY] Enhanced RAG não disponível")
        except Exception as e:
            logger.error(f"[FACTORY] Erro ao criar Enhanced RAG: {e}")
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

            logger.info("[FACTORY] Simple RAG criado com sucesso")
            return SimpleRAGWrapper()
        except ImportError:
            logger.debug("[FACTORY] Simple RAG não disponível")
        except Exception as e:
            logger.error(f"[FACTORY] Erro ao criar Simple RAG: {e}")
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
            logger.info("[FACTORY] QA Framework criado com sucesso")
            return qa
        except ImportError:
            logger.debug("[FACTORY] QA Framework não disponível")
        except Exception as e:
            logger.error(f"[FACTORY] Erro ao criar QA Framework: {e}")

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

# Instância global da factory
_factory_instance: Optional[DependencyFactory] = None

def get_dependency_factory() -> DependencyFactory:
    """Obtém instância global da factory"""
    global _factory_instance

    if _factory_instance is None:
        from app_config import config
        _factory_instance = DependencyFactory(config)
        logger.info("[FACTORY] Dependency factory inicializada")

    return _factory_instance

def create_cache() -> Optional[Any]:
    """Factory function para cache"""
    factory = get_dependency_factory()
    return factory.create_cache_service()

def create_rag() -> Optional[Any]:
    """Factory function para RAG"""
    factory = get_dependency_factory()
    return factory.create_rag_service()

def create_qa() -> Optional[Any]:
    """Factory function para QA"""
    factory = get_dependency_factory()
    return factory.create_qa_framework()