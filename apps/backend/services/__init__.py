# -*- coding: utf-8 -*-
"""
Services Module - 100% REAL CLOUD INTEGRATIONS
NO MOCKS - All services use real cloud backends
"""

# Import REAL services - NO MOCKS
try:
    from .rag.real_rag_system import get_real_rag_system, RealRAGSystem
    from .rag.real_vector_store import get_real_vector_store, RealVectorStore
    from .cache.real_cloud_cache import get_real_cloud_cache, RealCloudCache
    RAG_SERVICES_AVAILABLE = True
except ImportError as e:
    RAG_SERVICES_AVAILABLE = False
    get_real_rag_system = None
    RealRAGSystem = None
    get_real_vector_store = None
    RealVectorStore = None
    get_real_cloud_cache = None
    RealCloudCache = None

# Backward compatibility aliases (all point to REAL services)
get_rag_system = get_real_rag_system
SupabaseRAGSystem = RealRAGSystem
get_vector_store = get_real_vector_store
SupabaseVectorStore = RealVectorStore
get_cloud_cache = get_real_cloud_cache
CloudNativeCache = RealCloudCache

__all__ = [
    # Real services
    'get_real_rag_system',
    'RealRAGSystem',
    'get_real_vector_store',
    'RealVectorStore',
    'get_real_cloud_cache',
    'RealCloudCache',
    # Backward compatibility (all real)
    'get_rag_system',
    'SupabaseRAGSystem',
    'get_vector_store',
    'SupabaseVectorStore',
    'get_cloud_cache',
    'CloudNativeCache',
    # Status
    'RAG_SERVICES_AVAILABLE'
]