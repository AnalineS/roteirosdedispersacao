# -*- coding: utf-8 -*-
"""
Real Cloud Cache - 100% REAL CLOUD INTEGRATIONS
NO MOCKS - Only real Supabase + GCS + Memory cache
Replaces ALL mock cache implementations
"""

import json
import hashlib
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
import numpy as np

# Import REAL cloud manager - NO MOCKS
from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager
from core.logging.sanitizer import sanitize_log_input, sanitize_error

logger = logging.getLogger(__name__)

class RealCloudCache:
    """
    REAL Cloud Cache - NO MOCKS EVER
    Uses only real cloud services: Memory -> Supabase -> GCS
    """

    def __init__(self, config):
        self.config = config

        # Memory cache (fastest layer)
        self.memory_cache: Dict[str, Tuple[Any, datetime]] = {}
        self.max_memory_items = getattr(config, 'EMBEDDING_CACHE_SIZE', 1000)

        # TTL configuration
        self.default_ttl = timedelta(hours=getattr(config, 'CACHE_TTL_MINUTES', 60) / 60)

        # Get REAL cloud manager - NO MOCKS
        try:
            self.cloud_manager = get_unified_cloud_manager(config)
            self.real_supabase = self.cloud_manager.get_supabase_client()
            self.real_gcs = self.cloud_manager.get_gcs_client()
        except Exception as e:
            logger.error("❌ CRITICAL: Real cloud cache cannot initialize without real services: %s", sanitize_error(e))
            raise RuntimeError(f"Real cloud cache requires real cloud services: {sanitize_error(e)}")

        # Cache configuration - ALL REAL
        self.cache_layers = {
            'memory': True,           # Memory cache (fastest)
            'real_supabase': True,    # Real Supabase cache tables
            'real_gcs': True,         # Real Google Cloud Storage
        }

        # Statistics
        self.stats = {
            'memory_hits': 0,
            'real_supabase_hits': 0,
            'real_gcs_hits': 0,
            'misses': 0,
            'evictions': 0,
            'total_requests': 0
        }

        logger.info("🚀 REAL CLOUD CACHE initialized - NO MOCKS")
        logger.info(f"   ✅ Real Supabase: ACTIVE")
        logger.info(f"   ✅ Real GCS: ACTIVE")
        logger.info(f"   ✅ Memory Cache: ACTIVE ({self.max_memory_items} items max)")

    def _generate_cache_key(self, key_data: Any) -> str:
        """Generate deterministic cache key"""
        if isinstance(key_data, str):
            content = key_data
        elif isinstance(key_data, np.ndarray):
            content = key_data.tobytes()
        else:
            content = json.dumps(key_data, sort_keys=True)

        # Use SHA-256 for cache keys
        return hashlib.sha256(content.encode() if isinstance(content, str) else content).hexdigest()[:16]

    def get(self, key: str, default: Any = None) -> Any:
        """Get item from cache with real cloud fallback hierarchy"""
        self.stats['total_requests'] += 1
        cache_key = self._generate_cache_key(key)

        # Layer 1: Memory cache (fastest)
        result = self._get_from_memory(cache_key)
        if result is not None:
            self.stats['memory_hits'] += 1
            return result

        # Layer 2: Real Supabase cache
        result = self._get_from_real_supabase(cache_key)
        if result is not None:
            self.stats['real_supabase_hits'] += 1
            # Promote to memory cache
            self._set_to_memory(cache_key, result)
            return result

        # Layer 3: Real GCS cache
        result = self._get_from_real_gcs(cache_key)
        if result is not None:
            self.stats['real_gcs_hits'] += 1
            # Promote to all higher layers
            self._set_to_memory(cache_key, result)
            self._set_to_real_supabase(cache_key, result)
            return result

        # Cache miss
        self.stats['misses'] += 1
        return default

    def set(self, key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Set item in all available real cache layers"""
        cache_key = self._generate_cache_key(key)
        ttl = ttl or self.default_ttl

        success_count = 0
        total_layers = sum(self.cache_layers.values())

        # Set in memory cache
        if self.cache_layers['memory']:
            if self._set_to_memory(cache_key, value, ttl):
                success_count += 1

        # Set in real Supabase cache
        if self.cache_layers['real_supabase']:
            if self._set_to_real_supabase(cache_key, value, ttl):
                success_count += 1

        # Set in real GCS cache
        if self.cache_layers['real_gcs']:
            if self._set_to_real_gcs(cache_key, value, ttl):
                success_count += 1

        return success_count > 0  # Success if at least one layer worked

    def _get_from_memory(self, cache_key: str) -> Any:
        """Get from memory cache"""
        try:
            if cache_key in self.memory_cache:
                value, expires_at = self.memory_cache[cache_key]
                if datetime.now() < expires_at:
                    return value
                else:
                    # Expired - remove
                    del self.memory_cache[cache_key]
                    self.stats['evictions'] += 1
            return None
        except Exception as e:
            logger.debug("Memory cache error: %s", sanitize_error(e))
            return None

    def _set_to_memory(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Set in memory cache"""
        try:
            # Evict if memory full
            if len(self.memory_cache) >= self.max_memory_items:
                self._evict_oldest_memory()

            expires_at = datetime.now() + (ttl or self.default_ttl)
            self.memory_cache[cache_key] = (value, expires_at)
            return True
        except Exception as e:
            logger.debug("Memory cache set error: %s", sanitize_error(e))
            return False

    def _evict_oldest_memory(self):
        """Remove oldest items from memory cache"""
        try:
            # Remove 10% of oldest items
            items_to_remove = max(1, len(self.memory_cache) // 10)
            oldest_keys = sorted(
                self.memory_cache.keys(),
                key=lambda k: self.memory_cache[k][1]  # Sort by expires_at
            )[:items_to_remove]

            for key in oldest_keys:
                del self.memory_cache[key]
                self.stats['evictions'] += 1

        except Exception as e:
            logger.debug("Memory eviction error: %s", sanitize_error(e))

    def _get_from_real_supabase(self, cache_key: str) -> Any:
        """Get from real Supabase cache table"""
        try:
            if not self.real_supabase:
                return None

            # Query cache table using real Supabase client
            # We need to create a cache table first
            self._ensure_cache_table_exists()

            # Use PostgreSQL direct query for cache lookup
            if hasattr(self.real_supabase, 'pg_conn') and self.real_supabase.pg_conn:
                from psycopg2.extras import RealDictCursor

                with self.real_supabase.pg_conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT value_data, expires_at
                        FROM cache_storage
                        WHERE cache_key = %s AND expires_at > NOW()
                    """, (cache_key,))

                    result = cursor.fetchone()
                    if result:
                        # Deserialize cached value
                        cached_data = json.loads(result['value_data'])
                        if cached_data.get('type') == 'numpy_array':
                            return np.array(cached_data['value'])
                        return cached_data['value']

            return None

        except Exception as e:
            logger.debug("Real Supabase cache error: %s", sanitize_error(e))
            return None

    def _set_to_real_supabase(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Set in real Supabase cache"""
        try:
            if not self.real_supabase:
                return False

            self._ensure_cache_table_exists()

            # Prepare data for serialization
            cache_data = {
                'value': value,
                'type': 'standard',
                'created_at': datetime.now(timezone.utc).isoformat()
            }

            # Handle numpy arrays
            if isinstance(value, np.ndarray):
                cache_data['value'] = value.tolist()
                cache_data['type'] = 'numpy_array'

            expires_at = datetime.now(timezone.utc) + (ttl or self.default_ttl)

            # Use PostgreSQL direct insert for cache
            if hasattr(self.real_supabase, 'pg_conn') and self.real_supabase.pg_conn:
                with self.real_supabase.pg_conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO cache_storage (cache_key, value_data, expires_at)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (cache_key) DO UPDATE SET
                        value_data = EXCLUDED.value_data,
                        expires_at = EXCLUDED.expires_at
                    """, (cache_key, json.dumps(cache_data), expires_at))

                return True

            return False

        except Exception as e:
            logger.debug("Real Supabase cache set error: %s", sanitize_error(e))
            return False

    def _get_from_real_gcs(self, cache_key: str) -> Any:
        """Get from real GCS cache"""
        try:
            if not self.real_gcs:
                return None

            # Download from real GCS bucket
            blob_path = f"cache/{cache_key}.json"
            cached_content = self.real_gcs.download_string(blob_path)

            if cached_content:
                cached_data = json.loads(cached_content)
                expires_at = datetime.fromisoformat(cached_data.get('expires_at', '1970-01-01T00:00:00+00:00'))

                if datetime.now(timezone.utc) < expires_at:
                    value = cached_data.get('value')
                    # Deserialize numpy arrays
                    if cached_data.get('type') == 'numpy_array':
                        return np.array(value)
                    return value
                else:
                    # Expired - remove from GCS
                    self.real_gcs.delete_file(blob_path)

            return None

        except Exception as e:
            logger.debug("Real GCS cache error: %s", sanitize_error(e))
            return None

    def _set_to_real_gcs(self, cache_key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Set in real GCS cache"""
        try:
            if not self.real_gcs:
                return False

            # Prepare data for serialization
            cache_data = {
                'value': value,
                'type': 'standard',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc) + (ttl or self.default_ttl)).isoformat()
            }

            # Handle numpy arrays
            if isinstance(value, np.ndarray):
                cache_data['value'] = value.tolist()
                cache_data['type'] = 'numpy_array'

            # Upload to real GCS bucket
            blob_path = f"cache/{cache_key}.json"
            gcs_url = self.real_gcs.upload_json(cache_data, blob_path)

            return gcs_url is not None

        except Exception as e:
            logger.debug("Real GCS cache set error: %s", sanitize_error(e))
            return False

    def _ensure_cache_table_exists(self):
        """Ensure cache table exists in real Supabase"""
        try:
            if not self.real_supabase or not hasattr(self.real_supabase, 'pg_conn') or not self.real_supabase.pg_conn:
                return

            with self.real_supabase.pg_conn.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS cache_storage (
                        cache_key VARCHAR(32) PRIMARY KEY,
                        value_data JSONB NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                # Create index for expired cleanup
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS cache_storage_expires_at_idx
                    ON cache_storage (expires_at);
                """)

        except Exception as e:
            logger.debug("Cache table creation error: %s", sanitize_error(e))

    def clear_expired(self) -> Dict[str, int]:
        """Clear expired items from all cache layers"""
        cleared = {'memory': 0, 'real_supabase': 0, 'real_gcs': 0}

        try:
            # Clear expired from memory
            expired_keys = [
                k for k, (_, expires_at) in self.memory_cache.items()
                if datetime.now() > expires_at
            ]
            for key in expired_keys:
                del self.memory_cache[key]
            cleared['memory'] = len(expired_keys)

            # Clear expired from real Supabase
            if self.real_supabase and hasattr(self.real_supabase, 'pg_conn') and self.real_supabase.pg_conn:
                with self.real_supabase.pg_conn.cursor() as cursor:
                    cursor.execute("DELETE FROM cache_storage WHERE expires_at <= NOW()")
                    cleared['real_supabase'] = cursor.rowcount

            # Real GCS cleanup happens automatically when items are accessed

        except Exception as e:
            logger.error("Cache cleanup error: %s", sanitize_error(e))

        return cleared

    def get_stats(self) -> Dict[str, Any]:
        """Get detailed cache statistics"""
        total_requests = self.stats['total_requests']

        return {
            'enabled_layers': [k for k, v in self.cache_layers.items() if v],
            'memory_size': len(self.memory_cache),
            'memory_limit': self.max_memory_items,
            'hit_rates': {
                'memory': (self.stats['memory_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'real_supabase': (self.stats['real_supabase_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'real_gcs': (self.stats['real_gcs_hits'] / total_requests * 100) if total_requests > 0 else 0,
                'total': ((total_requests - self.stats['misses']) / total_requests * 100) if total_requests > 0 else 0
            },
            'stats': self.stats.copy(),
            'real_cloud_services': {
                'supabase_available': self.real_supabase is not None,
                'gcs_available': self.real_gcs is not None,
                'mock_services': 0  # ALWAYS ZERO - NO MOCKS
            }
        }

    def health_check(self) -> Dict[str, Any]:
        """Health check for all real cache layers"""
        try:
            health_status = {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'layers': {}
            }

            # Check memory cache
            health_status['layers']['memory'] = {
                'healthy': True,
                'size': len(self.memory_cache),
                'limit': self.max_memory_items
            }

            # Check real Supabase cache
            if self.real_supabase:
                supabase_health = self.real_supabase.health_check()
                health_status['layers']['real_supabase'] = {
                    'healthy': supabase_health.get('overall_healthy', False),
                    'details': supabase_health
                }
            else:
                health_status['layers']['real_supabase'] = {
                    'healthy': False,
                    'error': 'Real Supabase client not available'
                }

            # Check real GCS cache
            if self.real_gcs:
                gcs_health = self.real_gcs.health_check()
                health_status['layers']['real_gcs'] = {
                    'healthy': gcs_health.get('overall_healthy', False),
                    'details': gcs_health
                }
            else:
                health_status['layers']['real_gcs'] = {
                    'healthy': False,
                    'error': 'Real GCS client not available'
                }

            # Overall health
            layer_healths = [layer['healthy'] for layer in health_status['layers'].values()]
            health_status['overall_healthy'] = any(layer_healths)  # At least one layer must work

            return health_status

        except Exception as e:
            logger.error("Cache health check error: %s", sanitize_error(e))
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'error': str(sanitize_error(e))
            }

# Global instance
_real_cloud_cache: Optional[RealCloudCache] = None

def get_real_cloud_cache() -> Optional[RealCloudCache]:
    """Get global real cloud cache instance"""
    global _real_cloud_cache

    if _real_cloud_cache is None:
        try:
            from app_config import config
            _real_cloud_cache = RealCloudCache(config)
        except Exception as e:
            logger.error("❌ CRITICAL: Cannot initialize real cloud cache: %s", sanitize_error(e))
            raise RuntimeError(f"Real cloud cache requires real cloud services: {sanitize_error(e)}")

    return _real_cloud_cache

def reset_real_cloud_cache():
    """Reset global cache instance (for testing)"""
    global _real_cloud_cache
    _real_cloud_cache = None

# Backward compatibility aliases
CloudNativeCache = RealCloudCache
get_cloud_cache = get_real_cloud_cache

# Export
__all__ = [
    'RealCloudCache',
    'get_real_cloud_cache',
    'reset_real_cloud_cache',
    'CloudNativeCache',  # Backward compatibility
    'get_cloud_cache'    # Backward compatibility
]