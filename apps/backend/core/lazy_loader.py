# -*- coding: utf-8 -*-
"""
Lazy Loader - Sistema de carregamento sob demanda
Carrega dependências pesadas apenas quando necessário baseado em feature flags
"""

import os
import logging
from typing import Optional, Any
from functools import lru_cache

logger = logging.getLogger(__name__)

class LazyLoader:
    """
    Sistema de carregamento lazy para dependências pesadas.
    Carrega apenas quando necessário baseado em environment variables.
    """
    
    def __init__(self):
        self._loaded_modules = {}
        self._feature_flags = {
            'EMBEDDINGS_ENABLED': os.getenv('EMBEDDINGS_ENABLED', 'false').lower() == 'true',
            'ADVANCED_FEATURES': os.getenv('ADVANCED_FEATURES', 'false').lower() == 'true',
            'RAG_AVAILABLE': os.getenv('RAG_AVAILABLE', 'false').lower() == 'true',
            'ADVANCED_CACHE': os.getenv('ADVANCED_CACHE', 'false').lower() == 'true',
        }
        logger.info(f"LazyLoader inicializado com flags: {self._feature_flags}")
    
    def is_feature_enabled(self, feature: str) -> bool:
        """Verifica se uma feature está habilitada"""
        return self._feature_flags.get(feature, False)
    
    @lru_cache(maxsize=32)
    def load_sentence_transformers(self) -> Optional[Any]:
        """
        Carrega sentence-transformers apenas se EMBEDDINGS_ENABLED=true
        """
        if not self.is_feature_enabled('EMBEDDINGS_ENABLED'):
            logger.info("🔒 sentence-transformers desabilitado (EMBEDDINGS_ENABLED=false)")
            return None
            
        if 'sentence_transformers' in self._loaded_modules:
            return self._loaded_modules['sentence_transformers']
            
        try:
            logger.info("📦 Carregando sentence-transformers...")
            import sentence_transformers
            self._loaded_modules['sentence_transformers'] = sentence_transformers
            logger.info("[OK] sentence-transformers carregado com sucesso")
            return sentence_transformers
        except ImportError as e:
            logger.warning(f"[WARNING]  sentence-transformers não disponível: {e}")
            return None
    
    @lru_cache(maxsize=32)
    def load_chromadb(self) -> Optional[Any]:
        """
        Carrega ChromaDB apenas se RAG_AVAILABLE=true
        """
        if not self.is_feature_enabled('RAG_AVAILABLE'):
            logger.info("🔒 ChromaDB desabilitado (RAG_AVAILABLE=false)")
            return None
            
        if 'chromadb' in self._loaded_modules:
            return self._loaded_modules['chromadb']
            
        try:
            logger.info("📦 Carregando ChromaDB...")
            import chromadb
            self._loaded_modules['chromadb'] = chromadb
            logger.info("[OK] ChromaDB carregado com sucesso")
            return chromadb
        except ImportError as e:
            logger.warning(f"[WARNING]  ChromaDB não disponível: {e}")
            return None
    
    @lru_cache(maxsize=32)
    def load_faiss(self) -> Optional[Any]:
        """
        Carrega FAISS apenas se RAG_AVAILABLE=true
        """
        if not self.is_feature_enabled('RAG_AVAILABLE'):
            logger.info("🔒 FAISS desabilitado (RAG_AVAILABLE=false)")
            return None
            
        if 'faiss' in self._loaded_modules:
            return self._loaded_modules['faiss']
            
        try:
            logger.info("📦 Carregando FAISS...")
            import faiss
            self._loaded_modules['faiss'] = faiss
            logger.info("[OK] FAISS carregado com sucesso")
            return faiss
        except ImportError as e:
            logger.warning(f"[WARNING]  FAISS não disponível: {e}")
            return None
    
    @lru_cache(maxsize=32)
    def load_opencv(self) -> Optional[Any]:
        """
        Carrega OpenCV apenas se ADVANCED_FEATURES=true
        """
        if not self.is_feature_enabled('ADVANCED_FEATURES'):
            logger.info("🔒 OpenCV desabilitado (ADVANCED_FEATURES=false)")
            return None
            
        if 'cv2' in self._loaded_modules:
            return self._loaded_modules['cv2']
            
        try:
            logger.info("📦 Carregando OpenCV...")
            import cv2
            self._loaded_modules['cv2'] = cv2
            logger.info("[OK] OpenCV carregado com sucesso")
            return cv2
        except ImportError as e:
            logger.warning(f"[WARNING]  OpenCV não disponível: {e}")
            return None
    
    @lru_cache(maxsize=32)  
    def load_redis(self) -> Optional[Any]:
        """
        Carrega Redis apenas se ADVANCED_CACHE=true
        """
        if not self.is_feature_enabled('ADVANCED_CACHE'):
            logger.info("🔒 Redis desabilitado (ADVANCED_CACHE=false)")
            return None
            
        if 'redis' in self._loaded_modules:
            return self._loaded_modules['redis']
            
        try:
            logger.info("📦 Carregando Redis...")
            import redis
            self._loaded_modules['redis'] = redis
            logger.info("[OK] Redis carregado com sucesso")
            return redis
        except ImportError as e:
            logger.warning(f"[WARNING]  Redis não disponível: {e}")
            return None
    
    def get_feature_status(self) -> dict:
        """
        Retorna status atual de todas as features e módulos carregados
        """
        return {
            'feature_flags': self._feature_flags,
            'loaded_modules': list(self._loaded_modules.keys()),
            'memory_usage': len(self._loaded_modules),
            'environment': os.getenv('ENVIRONMENT', 'development')
        }
    
    def unload_module(self, module_name: str) -> bool:
        """
        Descarrega um módulo da memória (para economizar recursos)
        """
        if module_name in self._loaded_modules:
            del self._loaded_modules[module_name]
            # Limpar cache LRU para o método específico
            if hasattr(self, f'load_{module_name}'):
                getattr(self, f'load_{module_name}').cache_clear()
            logger.info(f"🗑️  Módulo {module_name} removido da memória")
            return True
        return False
    
    def clear_all_cache(self):
        """
        Limpa todos os caches e módulos carregados
        """
        self._loaded_modules.clear()
        
        # Limpar todos os caches LRU
        for attr_name in dir(self):
            attr = getattr(self, attr_name)
            if hasattr(attr, 'cache_clear'):
                attr.cache_clear()
                
        logger.info("🧹 Todos os caches e módulos foram limpos")


# Instância global do lazy loader
lazy_loader = LazyLoader()


# Funções de conveniência para uso em outros módulos
def load_sentence_transformers():
    """Função de conveniência para carregar sentence-transformers"""
    return lazy_loader.load_sentence_transformers()

def load_chromadb():
    """Função de conveniência para carregar ChromaDB"""
    return lazy_loader.load_chromadb()

def load_faiss():
    """Função de conveniência para carregar FAISS"""
    return lazy_loader.load_faiss()

def load_opencv():
    """Função de conveniência para carregar OpenCV"""
    return lazy_loader.load_opencv()

def load_redis():
    """Função de conveniência para carregar Redis"""
    return lazy_loader.load_redis()

def is_feature_enabled(feature: str) -> bool:
    """Função de conveniência para verificar feature flags"""
    return lazy_loader.is_feature_enabled(feature)

def get_feature_status() -> dict:
    """Função de conveniência para obter status das features"""
    return lazy_loader.get_feature_status()


# ============================================================================
# USAGE EXAMPLES:
#
# 1. Carregar sentence-transformers apenas se necessário:
#    st = load_sentence_transformers()
#    if st:
#        model = st.SentenceTransformer('model-name')
#    else:
#        # Fallback sem ML
#        pass
#
# 2. Verificar feature flag:
#    if is_feature_enabled('EMBEDDINGS_ENABLED'):
#        # Código que usa embeddings
#    else:
#        # Código alternativo sem embeddings
#
# 3. Status das features:
#    status = get_feature_status()
#    print(f"Features ativas: {status['loaded_modules']}")
#
# VANTAGENS:
# - Reduz uso de memória significativamente
# - Acelera inicialização da aplicação
# - Permite degradação graceful de funcionalidades
# - Facilita deployment em ambientes com recursos limitados
# - Cache LRU evita recarregamentos desnecessários
# ============================================================================