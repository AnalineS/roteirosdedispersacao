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

# Import services (conditional imports for flexibility)
try:
    from services.advanced_cache import PerformanceCache
    ADVANCED_CACHE_AVAILABLE = True
except ImportError:
    ADVANCED_CACHE_AVAILABLE = False

# Import unified cache system
try:
    from services.cache.unified_cache_manager import get_unified_cache
    UNIFIED_CACHE_AVAILABLE = True
except ImportError:
    UNIFIED_CACHE_AVAILABLE = False
    
try:
    from services.simple_rag import generate_context_from_rag
    from services.enhanced_rag_system import get_enhanced_context
    from services.medical_rag_integration import get_medical_context, medical_rag_system
    RAG_SERVICES_AVAILABLE = True
    MEDICAL_RAG_AVAILABLE = True
except ImportError:
    RAG_SERVICES_AVAILABLE = False
    MEDICAL_RAG_AVAILABLE = False

# Import Supabase RAG System (PRIORIDADE MÁXIMA)
try:
    from services.rag.supabase_rag_system import SupabaseRAGSystem
    SUPABASE_RAG_AVAILABLE = True
except ImportError:
    SUPABASE_RAG_AVAILABLE = False

# Import novo sistema de embeddings (SPRINT 1.2)
try:
    from services.embedding_rag_system import get_embedding_rag, get_rag_context
    EMBEDDING_RAG_AVAILABLE = True
except ImportError:
    EMBEDDING_RAG_AVAILABLE = False

try:
    from core.validation.educational_qa_framework import EducationalQAFramework
    QA_FRAMEWORK_AVAILABLE = True
except ImportError:
    QA_FRAMEWORK_AVAILABLE = False

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
        """Inicializa todas as dependências do sistema"""
        deps = Dependencies()
        
        # Config é sempre disponível
        deps.config = config
        deps.logger = logger
        
        # Cache Service - Unified Cache Manager
        if UNIFIED_CACHE_AVAILABLE and getattr(config, 'UNIFIED_CACHE_ENABLED', True):
            try:
                deps.cache = get_unified_cache()
                if deps.cache:
                    logger.info("[OK] Cache unificado inicializado")
                else:
                    logger.warning("[WARNING] Cache unificado não disponível, usando fallback")
                    deps.cache = self._create_fallback_cache()
            except Exception as e:
                logger.error(f"[ERROR] Erro ao inicializar cache unificado: {e}")
                deps.cache = self._create_fallback_cache()
        elif ADVANCED_CACHE_AVAILABLE and config.ADVANCED_CACHE:
            try:
                deps.cache = PerformanceCache(
                    max_size=getattr(config, 'CACHE_MAX_SIZE', 2000),
                    ttl_minutes=getattr(config, 'CACHE_TTL_MINUTES', 120)
                )
                logger.info("[OK] Cache avançado inicializado")
            except Exception as e:
                logger.error(f"[ERROR] Erro ao inicializar cache: {e}")
                deps.cache = self._create_fallback_cache()
        else:
            deps.cache = self._create_fallback_cache()
        
        # RAG Service
        if RAG_SERVICES_AVAILABLE and config.RAG_AVAILABLE:
            try:
                # Wrapper para unificar interface
                deps.rag_service = self._create_rag_service()
                logger.info("[OK] RAG service inicializado")
            except Exception as e:
                logger.error(f"[ERROR] Erro ao inicializar RAG: {e}")
                deps.rag_service = None
        
        # QA Framework
        if QA_FRAMEWORK_AVAILABLE and config.QA_ENABLED:
            try:
                # Inicializar QA Framework sem parâmetros (usar configuração padrão)
                deps.qa_framework = EducationalQAFramework()
                logger.info("[OK] QA Framework inicializado")
            except Exception as e:
                logger.error(f"[ERROR] Erro ao inicializar QA: {e}")
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
    
    def _create_rag_service(self) -> Any:
        """Cria serviço RAG unificado com chunking médico e embeddings"""
        class UnifiedRAGService:
            def __init__(self):
                # PRIORIDADE 1: Supabase RAG System (Vector + pgvector)
                self.use_supabase_rag = SUPABASE_RAG_AVAILABLE and config.RAG_AVAILABLE
                # PRIORIDADE 2: Embeddings RAG
                self.use_embedding_rag = EMBEDDING_RAG_AVAILABLE and config.EMBEDDINGS_ENABLED
                # PRIORIDADE 3: Medical RAG
                self.use_medical_rag = MEDICAL_RAG_AVAILABLE and config.ADVANCED_FEATURES
                # FALLBACK: Enhanced RAG
                self.use_enhanced = config.ADVANCED_FEATURES

                # Inicializar Supabase RAG se disponível (MÁXIMA PRIORIDADE)
                self.supabase_rag = None
                if self.use_supabase_rag:
                    try:
                        self.supabase_rag = SupabaseRAGSystem(config)
                        logger.info("[OK] Supabase RAG System inicializado com sucesso")
                    except Exception as e:
                        logger.error(f"[ERROR] Falha ao inicializar Supabase RAG: {e}")
                        self.use_supabase_rag = False

                # Inicializar embedding RAG como fallback
                self.embedding_rag = None
                if self.use_embedding_rag and not self.use_supabase_rag:
                    self.embedding_rag = get_embedding_rag()
            
            def get_context(self, query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
                """Interface unificada RAG com PRIORIDADE SUPABASE"""
                try:
                    # PRIORIDADE 1: Supabase RAG System (Vector + pgvector)
                    if self.use_supabase_rag and self.supabase_rag:
                        response = self.supabase_rag.generate_response(query, persona or 'dr_gasnelio')
                        if response and response.context and response.context.chunks:
                            # Extrair contexto dos chunks
                            context_text = "\n\n".join([chunk.content for chunk in response.context.chunks[:max_chunks]])
                            logger.info(f"[SUPABASE RAG] Contexto gerado: {len(context_text)} chars, {len(response.context.chunks)} chunks")
                            return context_text
                        else:
                            logger.warning("[SUPABASE RAG] Resposta vazia, usando fallback")

                    # FALLBACK 1: Embeddings semânticos
                    if self.use_embedding_rag and self.embedding_rag:
                        return self.embedding_rag.get_context(query, max_chunks, persona)
                    # FALLBACK 2: RAG médico
                    elif self.use_medical_rag:
                        return get_medical_context(query, max_chunks)
                    # FALLBACK 3: RAG enhanced
                    elif self.use_enhanced:
                        return get_enhanced_context(query, max_chunks)
                    # FALLBACK FINAL: RAG básico
                    else:
                        return generate_context_from_rag(query, max_chunks)
                except Exception as e:
                    logger.error(f"[ERROR] Erro no sistema RAG: {e}")
                    return ""
            
            def get_stats(self) -> dict:
                """Retorna estatísticas do RAG"""
                # SPRINT 1.2: Incluir estatísticas de embeddings
                if self.use_embedding_rag and self.embedding_rag:
                    return self.embedding_rag.get_statistics()
                elif self.use_medical_rag and MEDICAL_RAG_AVAILABLE:
                    return medical_rag_system.get_stats()
                return {"type": "basic", "medical_chunking": False, "embeddings": False}
        
        return UnifiedRAGService()
    
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