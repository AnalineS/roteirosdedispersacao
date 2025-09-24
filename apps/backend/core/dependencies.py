# -*- coding: utf-8 -*-
"""
Sistema de Injeção de Dependências
Centraliza a criação e gerenciamento de dependências
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
import logging

# Import configs
from app_config import config

# All service imports moved to dependency factory to eliminate circular dependencies

logger = logging.getLogger(__name__)

@dataclass
class Dependencies:
    """Container para todas as dependências do sistema"""
    cache: Optional[Any] = None
    rag_service: Optional[Any] = None
    qa_framework: Optional[Any] = None
    config: Any = None
    logger: Any = None
    
class DependencyInjector:
    """Gerenciador de injeção de dependências"""
    
    _instance: Optional['DependencyInjector'] = None
    _dependencies: Optional[Dependencies] = None
    
    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Inicializa dependências uma vez"""
        if self._dependencies is None:
            self._dependencies = self._initialize_dependencies()
    
    def _initialize_dependencies(self) -> Dependencies:
        """Inicializa todas as dependências do sistema usando factory pattern"""
        deps = Dependencies()

        # Config é sempre disponível
        deps.config = config
        deps.logger = logger

        # Usar factory para criar serviços (evita circular imports)
        try:
            # Import lazy para evitar circular dependency
            def _get_factory():
                from core.dependency_factory import get_dependency_factory
                return get_dependency_factory()

            factory = _get_factory()

            # Cache Service
            deps.cache = factory.create_cache_service()

            # RAG Service
            if getattr(config, 'RAG_AVAILABLE', True):
                deps.rag_service = factory.create_rag_service()

            # QA Framework
            if getattr(config, 'QA_ENABLED', True):
                deps.qa_framework = factory.create_qa_framework()

            logger.info("[DEPENDENCIES] Todas as dependências inicializadas via factory")

        except Exception as e:
            logger.error(f"[ERROR] Erro ao usar factory: {e}")
            # Fallback para método antigo
            deps.cache = self._create_fallback_cache()
            deps.rag_service = None
            deps.qa_framework = None
        
        return deps
    
    def _create_fallback_cache(self) -> Any:
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
                    "total_entries": len(self.cache)
                }
        
        logger.warning("[WARNING] Usando cache simples (fallback)")
        return SimpleCache()
    
    # Old RAG service creation method removed - now using factory pattern
    
    def get_dependencies(self) -> Dependencies:
        """Retorna container de dependências"""
        return self._dependencies
    
    def get_cache(self) -> Any:
        """Retorna serviço de cache"""
        return self._dependencies.cache
    
    def get_rag(self) -> Optional[Any]:
        """Retorna serviço RAG"""
        return self._dependencies.rag_service
    
    def get_qa(self) -> Optional[Any]:
        """Retorna QA framework"""
        return self._dependencies.qa_framework
    
    def get_config(self) -> Any:
        """Retorna configuração"""
        return self._dependencies.config
    
    def inject_into_blueprint(self, blueprint) -> None:
        """Injeta dependências em um blueprint"""
        # Adiciona dependências ao contexto do blueprint
        blueprint.dependencies = self._dependencies
        blueprint.cache = self._dependencies.cache
        blueprint.rag_service = self._dependencies.rag_service
        blueprint.qa_framework = self._dependencies.qa_framework
        blueprint.config = self._dependencies.config

# Singleton global
dependency_injector = DependencyInjector()

# Funções de conveniência
def get_cache():
    """Atalho para obter cache"""
    return dependency_injector.get_cache()

def get_rag():
    """Atalho para obter RAG"""
    return dependency_injector.get_rag()

def get_qa():
    """Atalho para obter QA"""
    return dependency_injector.get_qa()

def get_config():
    """Atalho para obter config"""
    return dependency_injector.get_config()

def inject_dependencies(blueprint):
    """Atalho para injetar dependências em blueprint"""
    dependency_injector.inject_into_blueprint(blueprint)

__all__ = [
    'Dependencies',
    'DependencyInjector',
    'dependency_injector',
    'get_cache',
    'get_rag',
    'get_qa',
    'get_config',
    'inject_dependencies'
]