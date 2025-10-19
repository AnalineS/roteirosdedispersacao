# -*- coding: utf-8 -*-
"""
Cloud Integration Module - 100% REAL CLOUD SERVICES
NO MOCKS - Only real Supabase + GCS integrations
"""

# Import REAL cloud services - NO MOCKS
from .unified_real_cloud_manager import (
    UnifiedRealCloudManager,
    get_unified_cloud_manager,
    get_real_supabase,
    get_real_gcs,
    get_real_vector_store,
    get_real_cache_storage,
    unified_health_check,
    reset_unified_cloud_manager
)

# Backward compatibility aliases (but all point to REAL services)
get_cloud_manager = get_unified_cloud_manager
CloudManager = UnifiedRealCloudManager

__all__ = [
    'UnifiedRealCloudManager',
    'get_unified_cloud_manager',
    'get_real_supabase',
    'get_real_gcs',
    'get_real_vector_store',
    'get_real_cache_storage',
    'unified_health_check',
    'reset_unified_cloud_manager',
    # Backward compatibility
    'get_cloud_manager',
    'CloudManager'
]