# -*- coding: utf-8 -*-
"""
RAG Services Module
===================
Retrieval-Augmented Generation e embeddings
"""

# Exports are defined in the parent services/__init__.py
# These classes should be imported from the real implementations
try:
    from .real_rag_system import RealRAGSystem as RAGSystem
    from .real_vector_store import RealVectorStore as VectorStore
    # EmbeddingService and SemanticSearch may not exist as separate classes
    EmbeddingService = None
    SemanticSearch = None
except ImportError:
    RAGSystem = None
    VectorStore = None
    EmbeddingService = None
    SemanticSearch = None

__all__ = [
    'RAGSystem',
    'VectorStore',
]