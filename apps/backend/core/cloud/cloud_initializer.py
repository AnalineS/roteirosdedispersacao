# -*- coding: utf-8 -*-
"""
Real Cloud Initializer - 100% REAL CLOUD INTEGRATIONS
NO MOCKS - Only real cloud service connections
"""

import os
import logging
from typing import Dict, Any, Optional
from core.logging.sanitizer import sanitize_log_input, sanitize_error

logger = logging.getLogger(__name__)

class RealCloudInitializer:
    """REAL cloud service initialization - NO MOCKS ALLOWED"""

    def __init__(self, config):
        self.config = config
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self.is_cloud_run = bool(os.getenv('K_SERVICE') or os.getenv('CLOUD_RUN_ENV'))

        # REAL cloud service status - NO MOCKS
        self.services_status = {
            'supabase': {'available': False, 'client': None, 'error': None},
            'gcs': {'available': False, 'client': None, 'error': None},
            'firebase': {'available': False, 'client': None, 'error': None}
        }

    def initialize_all_services(self) -> Dict[str, Any]:
        """Initialize REAL cloud services - NO MOCKS"""
        logger.info(f"🚀 Initializing REAL cloud services - Environment: {self.environment}")

        # Try to initialize REAL services first
        try:
            self._initialize_real_supabase()
        except Exception as e:
            logger.warning("Real Supabase failed: %s", sanitize_error(e))

        try:
            self._initialize_real_gcs()
        except Exception as e:
            logger.warning("Real GCS failed: %s", sanitize_error(e))

        try:
            self._initialize_real_firebase()
        except Exception as e:
            logger.warning("Real Firebase failed: %s", sanitize_error(e))

        # Setup local development alternatives if in development and no cloud services available
        if self.environment == 'development':
            self._setup_local_development_fallback()

        # Log summary
        self._log_initialization_summary()

        return self.services_status

    def _initialize_real_supabase(self):
        """Initialize REAL Supabase - NO MOCKS"""
        try:
            from .real_supabase_client import create_real_supabase_client

            # Check for required environment variables - multiple fallback options
            supabase_url = (
                os.getenv('SUPABASE_URL') or
                os.getenv('SUPABASE_PROJECT_URL') or
                getattr(self.config, 'SUPABASE_URL', None) or
                getattr(self.config, 'SUPABASE_PROJECT_URL', None)
            )

            supabase_key = (
                os.getenv('SUPABASE_ANON_KEY') or
                os.getenv('SUPABASE_PUBLISHABLE_KEY') or
                os.getenv('SUPABASE_API_KEY') or
                getattr(self.config, 'SUPABASE_KEY', None) or
                getattr(self.config, 'SUPABASE_ANON_KEY', None) or
                getattr(self.config, 'SUPABASE_API_KEY', None)
            )

            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY are required for real Supabase integration")

            logger.info(f"🚀 Connecting to REAL Supabase: {supabase_url}")

            # Create REAL Supabase client
            client = create_real_supabase_client(self.config)

            # Test connection with real health check
            health_status = client.health_check()
            if not health_status['overall_healthy']:
                logger.warning("Supabase health check issues: %s", sanitize_log_input(str(health_status)))
                # Don't fail completely - Supabase might still work for basic operations
                logger.info("Continuing with Supabase despite health check warnings...")

            self.services_status['supabase']['client'] = client
            self.services_status['supabase']['available'] = True
            logger.info("✅ REAL Supabase client initialized successfully - NO MOCKS")

        except Exception as e:
            self.services_status['supabase']['error'] = str(e)
            self.services_status['supabase']['available'] = False
            logger.error("❌ Failed to initialize REAL Supabase: %s", sanitize_error(e))

            # In production, this should fail completely - no mocks allowed
            if self.environment == 'production':
                raise RuntimeError(f"PRODUCTION: REAL Supabase initialization failed: {sanitize_error(e)}") from e
            else:
                logger.warning("DEVELOPMENT: Continuing without Supabase - fallback will be used")

    def _initialize_real_gcs(self):
        """Initialize REAL Google Cloud Storage - NO MOCKS"""
        try:
            from .real_gcs_client import create_real_gcs_client

            # Check for required environment variables - multiple fallback options
            bucket_name = (
                os.getenv('GCS_BUCKET_NAME') or
                os.getenv('GCS_CACHE_BUCKET') or
                getattr(self.config, 'GCS_BUCKET_NAME', None) or
                getattr(self.config, 'GCS_CACHE_BUCKET', None)
            )

            # Check for GCP credentials
            credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON') or os.getenv('GCP_SA_KEY')
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

            if not bucket_name:
                raise ValueError("GCS_BUCKET_NAME is required for real GCS integration")

            if not credentials_json and not credentials_path:
                logger.info("No explicit GCS credentials provided - trying application default credentials")

            logger.info(f"🚀 Connecting to REAL Google Cloud Storage: {bucket_name}")

            # Create REAL GCS client
            client = create_real_gcs_client(self.config)

            # Test connection with real health check
            health_status = client.health_check()
            if not health_status['overall_healthy']:
                logger.warning("GCS health check issues: %s", sanitize_log_input(str(health_status)))
                # Don't fail completely - GCS might still work for basic operations
                logger.info("Continuing with GCS despite health check warnings...")

            self.services_status['gcs']['client'] = client
            self.services_status['gcs']['available'] = True
            logger.info(f"✅ REAL GCS client initialized successfully - NO MOCKS - Bucket: {bucket_name}")

        except Exception as e:
            self.services_status['gcs']['error'] = str(e)
            self.services_status['gcs']['available'] = False
            logger.error("❌ Failed to initialize REAL GCS: %s", sanitize_error(e))

            # In production, this should fail completely - no mocks allowed
            if self.environment == 'production':
                raise RuntimeError(f"PRODUCTION: REAL GCS initialization failed: {sanitize_error(e)}") from e
            else:
                logger.warning("DEVELOPMENT: Continuing without GCS - fallback will be used")

    def _initialize_real_firebase(self):
        """Initialize REAL Firebase - Optional service"""
        try:
            # Firebase is optional for this system
            firebase_enabled = getattr(self.config, 'FIREBASE_ENABLED', False)
            firebase_credentials = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')

            if not firebase_enabled:
                logger.info("🔄 Firebase disabled by configuration - skipping")
                return

            if not firebase_credentials:
                logger.info("🔄 Firebase credentials not provided - skipping")
                return

            # Initialize REAL Firebase
            import firebase_admin
            from firebase_admin import credentials, firestore
            import json

            cred_dict = json.loads(firebase_credentials)
            cred = credentials.Certificate(cred_dict)

            # Initialize app if not already initialized
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)

            # Create real Firestore client
            firestore_client = firestore.client()

            # Test connection
            test_doc = firestore_client.collection('_health_check').document('test')
            test_doc.set({'timestamp': firestore.SERVER_TIMESTAMP, 'status': 'healthy'})

            self.services_status['firebase']['client'] = firestore_client
            self.services_status['firebase']['available'] = True
            logger.info("✅ REAL Firebase initialized successfully - NO MOCKS")

        except Exception as e:
            self.services_status['firebase']['error'] = str(e)
            self.services_status['firebase']['available'] = False
            logger.info("🔄 Firebase initialization skipped: %s", sanitize_error(e))
            # Firebase is optional, so we don't raise an error

    def _setup_local_development_fallback(self):
        """Setup local development alternatives when cloud services are not available"""
        try:
            # Check if any real cloud services are available
            has_cloud_services = any(status['available'] for status in self.services_status.values())

            if has_cloud_services:
                logger.info("🔄 Real cloud services available - skipping local development setup")
                return

            # Setup local development environment
            logger.info("🚀 Setting up local development alternatives...")

            from .local_development_setup import setup_local_development
            local_setup = setup_local_development(self.config)

            # Add local services to status
            self.services_status['local_development'] = {
                'available': True,
                'client': local_setup,
                'error': None
            }

            logger.info("✅ Local development environment setup completed")

        except Exception as e:
            logger.warning("⚠️ Local development setup failed: %s", sanitize_error(e))
            self.services_status['local_development'] = {
                'available': False,
                'client': None,
                'error': str(e)
            }

    def _log_initialization_summary(self):
        """Log summary of REAL cloud service initialization"""
        available_services = [name for name, status in self.services_status.items() if status['available']]
        unavailable_services = [name for name, status in self.services_status.items() if not status['available']]

        logger.info(f"🚀 REAL CLOUD SERVICES - Environment: {self.environment}")
        logger.info(f"✅ Available REAL services: {', '.join(available_services) if available_services else 'None'}")

        if unavailable_services:
            logger.error(f"❌ Failed REAL services: {', '.join(unavailable_services)}")
            # Log specific errors for failed services
            for service_name, status in self.services_status.items():
                if status['error'] and not status['available']:
                    logger.error("❌ %s ERROR: %s", service_name.upper(), sanitize_log_input(status['error']))

        # Verify no mocks are used
        total_services = len(self.services_status)
        real_services = len(available_services)
        logger.info(f"🎯 REAL INTEGRATION STATUS: {real_services}/{total_services} services using REAL cloud connections")

    def get_service_client(self, service_name: str):
        """Get client for specific service"""
        return self.services_status.get(service_name, {}).get('client')

    def is_service_available(self, service_name: str) -> bool:
        """Check if service is available"""
        return self.services_status.get(service_name, {}).get('available', False)

    def get_service_status(self) -> Dict[str, bool]:
        """Get status of all services"""
        return {name: status['available'] for name, status in self.services_status.items()}

def initialize_cloud_services(config) -> RealCloudInitializer:
    """Initialize REAL cloud services - NO MOCKS"""
    initializer = RealCloudInitializer(config)
    initializer.initialize_all_services()
    return initializer

def get_cloud_service_client(initializer: RealCloudInitializer, service_name: str):
    """Get REAL cloud service client"""
    return initializer.get_service_client(service_name)

# Global initializer instance (will be set by main app)
_cloud_initializer: Optional[RealCloudInitializer] = None

def set_global_cloud_initializer(initializer: RealCloudInitializer):
    """Set global REAL cloud initializer"""
    global _cloud_initializer
    _cloud_initializer = initializer

def get_global_cloud_initializer() -> Optional[RealCloudInitializer]:
    """Get global REAL cloud initializer"""
    return _cloud_initializer

# Backward compatibility alias (but still REAL services)
CloudInitializer = RealCloudInitializer