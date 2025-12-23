# -*- coding: utf-8 -*-
"""
Unified Cloud Manager - Environment-Aware Service Initialization
Intelligent cloud integrations with environment-based fallback strategies
Respects development, staging, and production environment requirements
"""

import os
import logging
from typing import Dict, Any, Optional, Union
from datetime import datetime

# Real cloud imports
from .real_supabase_client import RealSupabaseClient, create_real_supabase_client
from .real_gcs_client import RealGCSClient, create_real_gcs_client

# Environment configuration import
try:
    from config.environment_config import get_environment_config
    ENVIRONMENT_CONFIG_AVAILABLE = True
except ImportError:
    ENVIRONMENT_CONFIG_AVAILABLE = False

logger = logging.getLogger(__name__)

class UnifiedCloudManager:
    """
    UNIFIED CLOUD MANAGER - Environment-Aware Service Initialization
    Development: Allows mocks/fallbacks for easier local development
    Staging/Production: Requires real cloud services only - NO MOCKS
    """

    def __init__(self, config):
        self.config = config
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self.is_cloud_run = bool(os.getenv('K_SERVICE') or os.getenv('CLOUD_RUN_ENV'))

        # Get environment configuration for cloud strategy
        self.env_config = None
        if ENVIRONMENT_CONFIG_AVAILABLE:
            try:
                self.env_config = get_environment_config()
                self.cloud_strategy = getattr(self.env_config, 'CLOUD_STRATEGY', 'strict')
                self.require_real_cloud = getattr(self.env_config, 'REQUIRE_REAL_CLOUD', True)
                self.allow_development_mocks = getattr(self.env_config, 'ALLOW_DEVELOPMENT_MOCKS', False)
            except Exception as e:
                logger.warning(f"Failed to load environment config: {e}")
                self.cloud_strategy = 'strict'
                self.require_real_cloud = True
                self.allow_development_mocks = False
        else:
            # Fallback to strict mode if no environment config
            self.cloud_strategy = 'strict'
            self.require_real_cloud = True
            self.allow_development_mocks = False

        # Service clients
        self.real_supabase: Optional[RealSupabaseClient] = None
        self.real_gcs: Optional[RealGCSClient] = None

        # Mock/fallback clients (only for development)
        self.mock_supabase: Optional[Any] = None
        self.mock_gcs: Optional[Any] = None

        # Service status tracking
        self.services_status = {
            'supabase': {'available': False, 'client': None, 'error': None, 'type': 'unknown'},
            'gcs': {'available': False, 'client': None, 'error': None, 'type': 'unknown'},
            'unified_ready': False
        }

        # Integration statistics
        self.stats = {
            'initialization_time': None,
            'real_services_count': 0,
            'mock_services_count': 0,
            'total_operations': 0,
            'failed_operations': 0,
            'cloud_strategy': self.cloud_strategy,
            'environment': self.environment
        }

        logger.info(f"🚀 Initializing UNIFIED CLOUD MANAGER")
        logger.info(f"   Environment: {self.environment}")
        logger.info(f"   Cloud Strategy: {self.cloud_strategy}")
        logger.info(f"   Require Real Cloud: {self.require_real_cloud}")
        logger.info(f"   Allow Dev Mocks: {self.allow_development_mocks}")

        # Initialize services based on strategy
        self._initialize_services_by_strategy()

        # Mark initialization time
        self.stats['initialization_time'] = datetime.now().isoformat()

        # Log final status
        self._log_unified_status()

    def _initialize_services_by_strategy(self):
        """Initialize services based on environment strategy"""
        try:
            if self.cloud_strategy == 'development' and self.allow_development_mocks:
                # Development: Try real services first, fallback to mocks if needed
                logger.info("🔧 Development mode: Real services preferred, mocks allowed as fallback")
                self._initialize_with_fallbacks()
            elif self.cloud_strategy == 'fallback':
                # Staging: Identical to production - real services only
                logger.info("🔒 Staging mode: Real services only (identical to production)")
                self._initialize_real_services_strict()
            else:
                # Production: Strict mode - real services only
                logger.info("🔒 Production mode: Real services only - NO MOCKS")
                self._initialize_real_services_strict()

            # Validate system readiness
            self._validate_system_by_strategy()

        except Exception as e:
            if self.cloud_strategy == 'strict':
                logger.error(f"❌ CRITICAL: Production cloud initialization failed: {e}")
                raise RuntimeError(f"Production requires all real cloud services: {e}")
            else:
                logger.warning(f"⚠️ Cloud initialization partially failed: {e}")
                # Continue with available services in non-production

    def _initialize_with_fallbacks(self):
        """Development: Try real services first, fallback to mocks"""
        logger.info("🔧 Initializing services with development fallbacks...")

        # Try Supabase (real first, mock fallback)
        try:
            self._initialize_real_supabase()
        except Exception as e:
            logger.warning(f"⚠️ Real Supabase failed, using mock fallback: {e}")
            self._initialize_mock_supabase()

        # Try GCS (real first, mock fallback)
        try:
            self._initialize_real_gcs()
        except Exception as e:
            logger.warning(f"⚠️ Real GCS failed, using mock fallback: {e}")
            self._initialize_mock_gcs()

    def _initialize_with_limited_fallbacks(self):
        """DEPRECATED: Staging now uses strict mode like production"""
        logger.warning("⚠️ DEPRECATED: Staging fallbacks removed - using strict mode")
        self._initialize_real_services_strict()

    def _initialize_real_services_strict(self):
        """Production: Real services only - NO MOCKS"""
        logger.info("🔒 Initializing real services (production mode)...")

        # All services must be real in production
        self._initialize_real_supabase()
        self._initialize_real_gcs()

    def _initialize_real_supabase(self):
        """Initialize REAL Supabase client"""
        try:
            supabase_url = os.getenv('SUPABASE_URL') or getattr(self.config, 'SUPABASE_URL', None)
            supabase_key = os.getenv('SUPABASE_ANON_KEY') or getattr(self.config, 'SUPABASE_KEY', None)

            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY are required for REAL integration")

            # Create REAL Supabase client
            self.real_supabase = create_real_supabase_client(self.config)

            # Test REAL connection
            health_check = self.real_supabase.health_check()
            if not health_check['overall_healthy']:
                raise RuntimeError(f"REAL Supabase health check failed: {health_check}")

            # Mark as available
            self.services_status['supabase'] = {
                'available': True,
                'client': self.real_supabase,
                'error': None,
                'type': 'real'
            }
            self.stats['real_services_count'] += 1

            logger.info("✅ REAL Supabase initialized successfully")

        except Exception as e:
            error_msg = f"REAL Supabase initialization failed: {e}"
            logger.error(f"❌ {error_msg}")
            self.services_status['supabase'] = {
                'available': False,
                'client': None,
                'error': error_msg,
                'type': 'failed'
            }
            raise RuntimeError(error_msg)

    def _initialize_mock_supabase(self):
        """Initialize mock Supabase for development only"""
        try:
            # Simple mock implementation for development
            class MockSupabaseClient:
                def __init__(self):
                    self.connected = True

                def health_check(self):
                    return {
                        'overall_healthy': True,
                        'database': True,
                        'storage': True,
                        'type': 'mock'
                    }

                def store_chat_message(self, session_id, user_message, assistant_response, persona, metadata=None):
                    return f"mock_chat_id_{session_id}"

                def get_system_stats(self):
                    return {'type': 'mock', 'connections': 1}

                def close(self):
                    pass

            self.mock_supabase = MockSupabaseClient()

            self.services_status['supabase'] = {
                'available': True,
                'client': self.mock_supabase,
                'error': None,
                'type': 'mock'
            }
            self.stats['mock_services_count'] += 1

            logger.info("✅ Mock Supabase initialized for development")

        except Exception as e:
            error_msg = f"Mock Supabase initialization failed: {e}"
            logger.error(f"❌ {error_msg}")
            self.services_status['supabase'] = {
                'available': False,
                'client': None,
                'error': error_msg,
                'type': 'failed'
            }
            raise RuntimeError(error_msg)

    def _initialize_real_gcs(self):
        """Initialize REAL Google Cloud Storage client"""
        try:
            bucket_name = os.getenv('GCS_BUCKET_NAME') or getattr(self.config, 'GCS_BUCKET_NAME', None)

            if not bucket_name:
                raise ValueError("GCS_BUCKET_NAME is required for REAL GCS integration")

            # Create REAL GCS client
            self.real_gcs = create_real_gcs_client(self.config)

            # Test REAL connection
            health_check = self.real_gcs.health_check()
            if not health_check['overall_healthy']:
                raise RuntimeError(f"REAL GCS health check failed: {health_check}")

            # Mark as available
            self.services_status['gcs'] = {
                'available': True,
                'client': self.real_gcs,
                'error': None,
                'type': 'real'
            }
            self.stats['real_services_count'] += 1

            logger.info(f"✅ REAL GCS initialized successfully - Bucket: {bucket_name}")

        except Exception as e:
            error_msg = f"REAL GCS initialization failed: {e}"
            logger.error(f"❌ {error_msg}")
            self.services_status['gcs'] = {
                'available': False,
                'client': None,
                'error': error_msg,
                'type': 'failed'
            }
            raise RuntimeError(error_msg)

    def _initialize_mock_gcs(self):
        """Initialize mock GCS for development only"""
        try:
            # Simple mock implementation for development
            class MockGCSClient:
                def __init__(self):
                    self.bucket_name = "dev-mock-bucket"
                    self.connected = True

                def health_check(self):
                    return {
                        'overall_healthy': True,
                        'bucket_accessible': True,
                        'type': 'mock'
                    }

                def upload_string(self, content, destination_path, content_type="text/plain"):
                    return f"mock://storage/{destination_path}"

                def delete_file(self, file_path):
                    return True

                def get_bucket_info(self):
                    return {'type': 'mock', 'bucket': self.bucket_name}

            self.mock_gcs = MockGCSClient()

            self.services_status['gcs'] = {
                'available': True,
                'client': self.mock_gcs,
                'error': None,
                'type': 'mock'
            }
            self.stats['mock_services_count'] += 1

            logger.info("✅ Mock GCS initialized for development")

        except Exception as e:
            error_msg = f"Mock GCS initialization failed: {e}"
            logger.error(f"❌ {error_msg}")
            self.services_status['gcs'] = {
                'available': False,
                'client': None,
                'error': error_msg,
                'type': 'failed'
            }
            raise RuntimeError(error_msg)


    def _validate_system_by_strategy(self):
        """Validate system readiness based on environment strategy"""
        try:
            # Count available services by type
            available_services = [status for status in self.services_status.values()
                                if isinstance(status, dict) and status.get('available', False)]

            real_services = [s for s in available_services if s.get('type') == 'real']
            mock_services = [s for s in available_services if s.get('type') == 'mock']
            fallback_services = [s for s in available_services if s.get('type') == 'limited_fallback']

            total_available = len(available_services)

            if self.cloud_strategy == 'strict':
                # Production: Only real services allowed
                if len(real_services) < 2:
                    raise RuntimeError(f"Production requires 2 real services, got {len(real_services)}")
                if mock_services or fallback_services:
                    raise RuntimeError("Production cannot use mock or fallback services")

                # Test cross-service integration for production
                self._test_cross_service_integration()

            elif self.cloud_strategy == 'fallback':
                # Staging: Identical to production - only real services allowed
                if len(real_services) < 2:
                    raise RuntimeError(f"Staging requires 2 real services (identical to production), got {len(real_services)}")
                if mock_services or fallback_services:
                    raise RuntimeError("Staging cannot use mock or fallback services (identical to production)")

                # Test cross-service integration for staging (like production)
                self._test_cross_service_integration()

            else:
                # Development: Any services allowed
                if total_available < 1:
                    raise RuntimeError("Development requires at least 1 service (real or mock)")

            # Mark system as ready
            self.services_status['unified_ready'] = True

            logger.info(f"✅ SYSTEM VALIDATED ({self.cloud_strategy} mode)")
            logger.info(f"   Real services: {len(real_services)}")
            logger.info(f"   Mock services: {len(mock_services)}")
            logger.info(f"   Fallback services: {len(fallback_services)}")

        except Exception as e:
            logger.error(f"❌ System validation failed: {e}")
            if self.cloud_strategy in ['strict', 'fallback']:
                raise RuntimeError(f"Production/Staging validation failed: {e}")
            else:
                logger.warning(f"⚠️ Development validation failed, continuing: {e}")
                self.services_status['unified_ready'] = False

    def _test_cross_service_integration(self):
        """Test integration between real services (production only)"""
        try:
            # Only test real services integration
            supabase_status = self.services_status.get('supabase', {})
            gcs_status = self.services_status.get('gcs', {})

            if (supabase_status.get('type') == 'real' and
                gcs_status.get('type') == 'real' and
                self.real_supabase and self.real_gcs):

                # Store test data in Supabase
                test_session_id = f"integration_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

                chat_id = self.real_supabase.store_chat_message(
                    session_id=test_session_id,
                    user_message="Integration test message",
                    assistant_response="Integration test successful",
                    persona="integration_test",
                    metadata={"test": True, "timestamp": datetime.now().isoformat()}
                )

                # Store test file in GCS
                test_content = f"Integration test data: {datetime.now().isoformat()}"
                gcs_url = self.real_gcs.upload_string(
                    content=test_content,
                    destination_path=f"integration_tests/{test_session_id}.txt",
                    content_type="text/plain"
                )

                # Verify both operations
                if chat_id and gcs_url:
                    logger.info("✅ Cross-service integration test passed")

                    # Clean up test data
                    self.real_gcs.delete_file(f"integration_tests/{test_session_id}.txt")

                else:
                    raise RuntimeError("Cross-service integration test failed - missing results")
            else:
                logger.info("⚠️ Skipping integration test - not all real services available")

        except Exception as e:
            logger.error(f"❌ Cross-service integration test failed: {e}")
            raise

    def _log_unified_status(self):
        """Log unified system status"""
        services_by_type = {}
        failed_services = []

        for name, status in self.services_status.items():
            if isinstance(status, dict):
                if status.get('available', False):
                    service_type = status.get('type', 'unknown')
                    if service_type not in services_by_type:
                        services_by_type[service_type] = []
                    services_by_type[service_type].append(name)
                elif status.get('error'):
                    failed_services.append(name)

        logger.info("🚀 UNIFIED CLOUD SYSTEM STATUS:")
        logger.info(f"   Environment: {self.environment}")
        logger.info(f"   Cloud Strategy: {self.cloud_strategy}")
        logger.info(f"   Cloud Run: {'YES' if self.is_cloud_run else 'NO'}")

        # Log services by type
        for service_type, services in services_by_type.items():
            emoji = "✅" if service_type == "real" else "🔧" if service_type == "mock" else "⚖️"
            logger.info(f"   {emoji} {service_type.upper()} services: {', '.join(services)}")

        if failed_services:
            logger.error(f"   ❌ Failed services: {', '.join(failed_services)}")
            for service_name, status in self.services_status.items():
                if isinstance(status, dict) and status.get('error'):
                    logger.error(f"      ❌ {service_name.upper()}: {status['error']}")

        unified_status = self.services_status.get('unified_ready', False)
        logger.info(f"   🎯 SYSTEM STATUS: {'READY' if unified_status else 'NOT READY'}")
        logger.info(f"   📊 Real: {self.stats['real_services_count']} | Mock: {self.stats['mock_services_count']}")

        # Environment-specific warnings
        if self.cloud_strategy == 'development' and self.stats['mock_services_count'] > 0:
            logger.info(f"   🔧 Development mode: Mocks active for easier local development")
        elif self.cloud_strategy == 'fallback':
            logger.info(f"   🔒 STAGING mode: Real services only (identical to production)")
        elif self.cloud_strategy == 'strict':
            logger.info(f"   🔒 PRODUCTION mode: Real services only")

    # Service Access Methods - Environment-Aware

    def get_supabase_client(self) -> Union[RealSupabaseClient, Any]:
        """Get Supabase client (real or mock based on environment)"""
        if not self.services_status['supabase']['available']:
            raise RuntimeError("Supabase service not available")

        client = self.services_status['supabase']['client']
        client_type = self.services_status['supabase']['type']

        logger.debug(f"Returning {client_type} Supabase client")
        return client

    def get_gcs_client(self) -> Union[RealGCSClient, Any]:
        """Get GCS client (real, mock, or fallback based on environment)"""
        if not self.services_status['gcs']['available']:
            raise RuntimeError("GCS service not available")

        client = self.services_status['gcs']['client']
        client_type = self.services_status['gcs']['type']

        logger.debug(f"Returning {client_type} GCS client")
        return client

    def get_unified_storage(self) -> Dict[str, Any]:
        """Get unified storage interface with available services"""
        supabase_client = self.get_supabase_client() if self.services_status['supabase']['available'] else None
        gcs_client = self.get_gcs_client() if self.services_status['gcs']['available'] else None

        return {
            'supabase': supabase_client,
            'gcs': gcs_client,
            'vector_store': supabase_client,  # pgvector through Supabase
            'file_storage': gcs_client,       # File storage through GCS
            'cache_storage': gcs_client       # Cache storage through GCS
        }

    def get_unified_vector_store(self) -> Union[RealSupabaseClient, Any]:
        """Get unified vector store (Supabase pgvector)"""
        return self.get_supabase_client()

    def get_unified_cache_storage(self) -> Union[RealGCSClient, Any]:
        """Get unified cache storage (GCS)"""
        return self.get_gcs_client()

    # Health and Status Methods

    def unified_health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for all REAL services"""
        try:
            health_status = {
                'timestamp': datetime.now().isoformat(),
                'environment': self.environment,
                'unified_ready': self.services_status.get('unified_ready', False),
                'services': {},
                'overall_healthy': False
            }

            # Check Supabase
            if self.real_supabase:
                health_status['services']['supabase'] = self.real_supabase.health_check()
            else:
                health_status['services']['supabase'] = {
                    'healthy': False,
                    'error': 'Service not initialized'
                }

            # Check GCS
            if self.real_gcs:
                health_status['services']['gcs'] = self.real_gcs.health_check()
            else:
                health_status['services']['gcs'] = {
                    'healthy': False,
                    'error': 'Service not initialized'
                }

            # Calculate overall health
            all_healthy = all(
                service_health.get('overall_healthy', service_health.get('healthy', False))
                for service_health in health_status['services'].values()
            )

            health_status['overall_healthy'] = all_healthy and health_status['unified_ready']

            if health_status['overall_healthy']:
                logger.info("✅ Unified health check PASSED - All REAL services healthy")
            else:
                logger.error("❌ Unified health check FAILED - System not fully operational")

            return health_status

        except Exception as e:
            logger.error(f"❌ Unified health check error: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'error': str(e)
            }

    def get_unified_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics for unified system"""
        base_stats = dict(self.stats)

        # Add service-specific stats
        if self.real_supabase:
            try:
                base_stats['supabase'] = self.real_supabase.get_system_stats()
            except Exception as e:
                logger.debug(f"Failed to get Supabase stats: {e}")

        if self.real_gcs:
            try:
                base_stats['gcs'] = self.real_gcs.get_bucket_info()
            except Exception as e:
                logger.debug(f"Failed to get GCS stats: {e}")

        # Add unified metrics
        base_stats['service_availability'] = {
            name: {
                'available': status.get('available', False),
                'type': status.get('type', 'unknown')
            }
            for name, status in self.services_status.items()
            if isinstance(status, dict)
        }

        total_services = self.stats['real_services_count'] + self.stats['mock_services_count']
        base_stats['real_services_percentage'] = (
            (self.stats['real_services_count'] / total_services * 100.0)
            if total_services > 0 else 0.0
        )

        return base_stats

    def close_all_connections(self):
        """Close all service connections"""
        try:
            if self.real_supabase:
                self.real_supabase.close()
                logger.info("✅ Real Supabase connection closed")

            if self.real_gcs:
                # GCS client doesn't need explicit closing
                logger.info("✅ Real GCS client cleaned up")

            # Mock clients don't need explicit closing
            if self.mock_supabase:
                logger.info("✅ Mock Supabase cleaned up")

            if self.mock_gcs:
                logger.info("✅ Mock GCS cleaned up")

            logger.info("✅ All cloud connections closed")

        except Exception as e:
            logger.error(f"❌ Error closing connections: {e}")

# Global instance
_unified_cloud_manager: Optional[UnifiedCloudManager] = None

def get_unified_cloud_manager(config=None) -> UnifiedCloudManager:
    """Get global unified cloud manager instance"""
    global _unified_cloud_manager

    if _unified_cloud_manager is None:
        if config is None:
            from app_config import config as app_config
            config = app_config

        try:
            _unified_cloud_manager = UnifiedCloudManager(config)
        except Exception as e:
            logger.error(f"❌ CRITICAL: Cannot initialize unified cloud manager: {e}")
            if ENVIRONMENT_CONFIG_AVAILABLE:
                try:
                    env_config = get_environment_config()
                    cloud_strategy = getattr(env_config, 'CLOUD_STRATEGY', 'strict')
                    if cloud_strategy in ['strict', 'fallback']:
                        raise RuntimeError(f"Production/Staging requires all cloud services: {e}")
                    else:
                        logger.warning(f"⚠️ Development mode, continuing with limited functionality: {e}")
                except Exception:
                    pass
            raise RuntimeError(f"System cannot initialize cloud services: {e}")

    return _unified_cloud_manager

def reset_unified_cloud_manager():
    """Reset global instance (for testing)"""
    global _unified_cloud_manager
    if _unified_cloud_manager:
        _unified_cloud_manager.close_all_connections()
    _unified_cloud_manager = None

# Service shortcuts - Environment-Aware
def get_supabase_client(config=None) -> Union[RealSupabaseClient, Any]:
    """Get Supabase client (real or mock based on environment)"""
    return get_unified_cloud_manager(config).get_supabase_client()

def get_gcs_client(config=None) -> Union[RealGCSClient, Any]:
    """Get GCS client (real, mock, or fallback based on environment)"""
    return get_unified_cloud_manager(config).get_gcs_client()

def get_vector_store(config=None) -> Union[RealSupabaseClient, Any]:
    """Get vector store (Supabase pgvector)"""
    return get_unified_cloud_manager(config).get_unified_vector_store()

def get_cache_storage(config=None) -> Union[RealGCSClient, Any]:
    """Get cache storage (GCS)"""
    return get_unified_cloud_manager(config).get_unified_cache_storage()

# Legacy shortcuts for backward compatibility
def get_real_supabase(config=None) -> Union[RealSupabaseClient, Any]:
    """Legacy: Get Supabase client (real preferred)"""
    return get_supabase_client(config)

def get_real_gcs(config=None) -> Union[RealGCSClient, Any]:
    """Legacy: Get GCS client (real preferred)"""
    return get_gcs_client(config)

def get_real_vector_store(config=None) -> Union[RealSupabaseClient, Any]:
    """Legacy: Get vector store"""
    return get_vector_store(config)

def get_real_cache_storage(config=None) -> Union[RealGCSClient, Any]:
    """Legacy: Get cache storage"""
    return get_cache_storage(config)

# Health check shortcut
def unified_health_check(config=None) -> Dict[str, Any]:
    """Unified health check for all services"""
    return get_unified_cloud_manager(config).unified_health_check()

# Export
__all__ = [
    'UnifiedCloudManager',
    'get_unified_cloud_manager',
    'get_supabase_client',
    'get_gcs_client',
    'get_vector_store',
    'get_cache_storage',
    'get_real_supabase',  # Legacy
    'get_real_gcs',       # Legacy
    'get_real_vector_store',  # Legacy
    'get_real_cache_storage', # Legacy
    'unified_health_check',
    'reset_unified_cloud_manager'
]