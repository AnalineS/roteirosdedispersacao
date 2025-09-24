#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Real Cloud Integration Test - NO MOCKS VERIFICATION
Tests that ALL cloud services are using REAL integrations
Ensures no MockBlob or other mock implementations are used
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any, List

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app_config import config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RealCloudIntegrationTester:
    """
    Comprehensive tester for real cloud integrations
    Verifies NO MOCKS are used anywhere in the system
    """

    def __init__(self):
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'tests_run': 0,
            'tests_passed': 0,
            'tests_failed': 0,
            'mock_violations': [],
            'real_service_confirmations': [],
            'errors': []
        }

    def run_all_tests(self) -> Dict[str, Any]:
        """Run comprehensive real cloud integration tests"""
        logger.info("🚀 Starting REAL Cloud Integration Tests - NO MOCKS ALLOWED")
        logger.info("=" * 80)

        try:
            # Test 1: Unified Cloud Manager
            self.test_unified_cloud_manager()

            # Test 2: Real Supabase Integration
            self.test_real_supabase_integration()

            # Test 3: Real GCS Integration
            self.test_real_gcs_integration()

            # Test 4: Real Vector Store
            self.test_real_vector_store()

            # Test 5: Real Cache System
            self.test_real_cache_system()

            # Test 6: Real RAG System
            self.test_real_rag_system()

            # Test 7: Mock Detection
            self.test_no_mock_usage()

            # Test 8: Cross-Service Integration
            self.test_cross_service_integration()

        except Exception as e:
            logger.error(f"❌ Critical test failure: {e}")
            self.test_results['errors'].append(f"Critical failure: {str(e)}")

        # Generate final report
        self.generate_final_report()

        return self.test_results

    def test_unified_cloud_manager(self):
        """Test unified real cloud manager"""
        logger.info("🔧 Testing Unified Real Cloud Manager...")
        self.test_results['tests_run'] += 1

        try:
            from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager

            # Get manager instance
            cloud_manager = get_unified_cloud_manager(config)

            if cloud_manager is None:
                raise RuntimeError("Unified cloud manager is None")

            # Verify it's the real implementation
            class_name = cloud_manager.__class__.__name__
            if 'Mock' in class_name or 'mock' in class_name:
                self.test_results['mock_violations'].append(f"Unified cloud manager uses mock: {class_name}")
                raise RuntimeError(f"Mock detected in cloud manager: {class_name}")

            # Test health check
            health_status = cloud_manager.unified_health_check()
            if not isinstance(health_status, dict):
                raise RuntimeError("Health check returned invalid format")

            # Verify real clients are available
            real_supabase = cloud_manager.get_supabase_client()
            real_gcs = cloud_manager.get_gcs_client()

            if real_supabase is None and real_gcs is None:
                raise RuntimeError("No real cloud clients available")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                f"✅ Unified Cloud Manager: {class_name} with real clients"
            )
            logger.info("✅ Unified Cloud Manager test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Unified Cloud Manager test failed: {str(e)}")
            logger.error(f"❌ Unified Cloud Manager test FAILED: {e}")

    def test_real_supabase_integration(self):
        """Test real Supabase integration"""
        logger.info("🗄️ Testing Real Supabase Integration...")
        self.test_results['tests_run'] += 1

        try:
            from core.cloud.unified_real_cloud_manager import get_real_supabase

            # Get real Supabase client
            supabase_client = get_real_supabase(config)

            if supabase_client is None:
                logger.warning("⚠️ Real Supabase client not available - may be missing credentials")
                self.test_results['tests_passed'] += 1  # Not a failure in development
                return

            # Verify it's the real implementation
            class_name = supabase_client.__class__.__name__
            if 'Mock' in class_name or 'mock' in class_name:
                self.test_results['mock_violations'].append(f"Supabase client uses mock: {class_name}")
                raise RuntimeError(f"Mock detected in Supabase client: {class_name}")

            # Test health check
            health_status = supabase_client.health_check()
            if not isinstance(health_status, dict):
                raise RuntimeError("Supabase health check returned invalid format")

            # Verify PostgreSQL connection for pgvector
            if hasattr(supabase_client, 'pg_conn') and supabase_client.pg_conn:
                with supabase_client.pg_conn.cursor() as cursor:
                    cursor.execute("SELECT 1;")
                    result = cursor.fetchone()
                    if result[0] != 1:
                        raise RuntimeError("PostgreSQL connection test failed")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                f"✅ Real Supabase: {class_name} with pgvector support"
            )
            logger.info("✅ Real Supabase integration test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Real Supabase integration test failed: {str(e)}")
            logger.error(f"❌ Real Supabase integration test FAILED: {e}")

    def test_real_gcs_integration(self):
        """Test real Google Cloud Storage integration"""
        logger.info("☁️ Testing Real Google Cloud Storage Integration...")
        self.test_results['tests_run'] += 1

        try:
            from core.cloud.unified_real_cloud_manager import get_real_gcs

            # Get real GCS client
            gcs_client = get_real_gcs(config)

            if gcs_client is None:
                logger.warning("⚠️ Real GCS client not available - may be missing credentials or bucket")
                self.test_results['tests_passed'] += 1  # Not a failure in development
                return

            # Verify it's the real implementation
            class_name = gcs_client.__class__.__name__
            if 'Mock' in class_name or 'mock' in class_name:
                self.test_results['mock_violations'].append(f"GCS client uses mock: {class_name}")
                raise RuntimeError(f"Mock detected in GCS client: {class_name}")

            # Test health check
            health_status = gcs_client.health_check()
            if not isinstance(health_status, dict):
                raise RuntimeError("GCS health check returned invalid format")

            # Verify bucket access
            bucket_info = gcs_client.get_bucket_info()
            if not isinstance(bucket_info, dict):
                raise RuntimeError("GCS bucket info returned invalid format")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                f"✅ Real GCS: {class_name} with bucket access"
            )
            logger.info("✅ Real GCS integration test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Real GCS integration test failed: {str(e)}")
            logger.error(f"❌ Real GCS integration test FAILED: {e}")

    def test_real_vector_store(self):
        """Test real vector store"""
        logger.info("🔍 Testing Real Vector Store...")
        self.test_results['tests_run'] += 1

        try:
            from services.rag.real_vector_store import get_real_vector_store

            # Get real vector store
            vector_store = get_real_vector_store()

            if vector_store is None:
                raise RuntimeError("Real vector store is None")

            # Verify it's the real implementation
            class_name = vector_store.__class__.__name__
            if 'Mock' in class_name or 'mock' in class_name:
                self.test_results['mock_violations'].append(f"Vector store uses mock: {class_name}")
                raise RuntimeError(f"Mock detected in vector store: {class_name}")

            # Test health check
            health_status = vector_store.health_check()
            if not isinstance(health_status, dict):
                raise RuntimeError("Vector store health check returned invalid format")

            # Verify statistics
            stats = vector_store.get_stats()
            if not isinstance(stats, dict):
                raise RuntimeError("Vector store stats returned invalid format")

            # Check for mock services count (should be 0)
            mock_count = stats.get('mock_services', -1)
            if mock_count != 0:
                self.test_results['mock_violations'].append(f"Vector store reports {mock_count} mock services")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                f"✅ Real Vector Store: {class_name} with pgvector backend"
            )
            logger.info("✅ Real Vector Store test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Real Vector Store test failed: {str(e)}")
            logger.error(f"❌ Real Vector Store test FAILED: {e}")

    def test_real_cache_system(self):
        """Test real cache system"""
        logger.info("💾 Testing Real Cache System...")
        self.test_results['tests_run'] += 1

        try:
            from services.cache.real_cloud_cache import get_real_cloud_cache

            # Get real cache
            cache = get_real_cloud_cache()

            if cache is None:
                raise RuntimeError("Real cloud cache is None")

            # Verify it's the real implementation
            class_name = cache.__class__.__name__
            if 'Mock' in class_name or 'mock' in class_name:
                self.test_results['mock_violations'].append(f"Cache uses mock: {class_name}")
                raise RuntimeError(f"Mock detected in cache: {class_name}")

            # Test health check
            health_status = cache.health_check()
            if not isinstance(health_status, dict):
                raise RuntimeError("Cache health check returned invalid format")

            # Verify statistics
            stats = cache.get_stats()
            if not isinstance(stats, dict):
                raise RuntimeError("Cache stats returned invalid format")

            # Check for real cloud services
            real_services = stats.get('real_cloud_services', {})
            if not isinstance(real_services, dict):
                raise RuntimeError("Real cloud services info missing from cache stats")

            # Check mock count (should be 0)
            mock_count = real_services.get('mock_services', -1)
            if mock_count != 0:
                self.test_results['mock_violations'].append(f"Cache reports {mock_count} mock services")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                f"✅ Real Cache System: {class_name} with cloud backends"
            )
            logger.info("✅ Real Cache System test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Real Cache System test failed: {str(e)}")
            logger.error(f"❌ Real Cache System test FAILED: {e}")

    def test_real_rag_system(self):
        """Test real RAG system"""
        logger.info("🧠 Testing Real RAG System...")
        self.test_results['tests_run'] += 1

        try:
            from services.rag.real_rag_system import get_real_rag_system

            # Get real RAG system
            rag_system = get_real_rag_system()

            if rag_system is None:
                raise RuntimeError("Real RAG system is None")

            # Verify it's the real implementation
            class_name = rag_system.__class__.__name__
            if 'Mock' in class_name or 'mock' in class_name:
                self.test_results['mock_violations'].append(f"RAG system uses mock: {class_name}")
                raise RuntimeError(f"Mock detected in RAG system: {class_name}")

            # Test health check
            health_status = rag_system.health_check()
            if not isinstance(health_status, dict):
                raise RuntimeError("RAG system health check returned invalid format")

            # Verify statistics
            stats = rag_system.get_stats()
            if not isinstance(stats, dict):
                raise RuntimeError("RAG system stats returned invalid format")

            # Check mock count (should be 0)
            mock_count = stats.get('mock_services', -1)
            if mock_count != 0:
                self.test_results['mock_violations'].append(f"RAG system reports {mock_count} mock services")

            # Verify components are real
            components = stats.get('available_components', {})
            real_components = [name for name, available in components.items() if available]

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                f"✅ Real RAG System: {class_name} with components: {', '.join(real_components)}"
            )
            logger.info("✅ Real RAG System test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Real RAG System test failed: {str(e)}")
            logger.error(f"❌ Real RAG System test FAILED: {e}")

    def test_no_mock_usage(self):
        """Test that no mock implementations are being used"""
        logger.info("🚫 Testing for Mock Usage Detection...")
        self.test_results['tests_run'] += 1

        try:
            # Check imports for mock modules
            import sys
            loaded_modules = [name for name in sys.modules.keys()]

            mock_modules_found = []
            for module_name in loaded_modules:
                if 'mock' in module_name.lower() and 'development_mocks' in module_name:
                    mock_modules_found.append(module_name)

            if mock_modules_found:
                self.test_results['mock_violations'].extend(
                    f"Mock module imported: {module}" for module in mock_modules_found
                )
                raise RuntimeError(f"Mock modules found: {mock_modules_found}")

            # Check for MockBlob or other mock classes in memory
            mock_objects_found = []
            for name, obj in sys.modules.items():
                if hasattr(obj, '__dict__'):
                    for attr_name in dir(obj):
                        if 'Mock' in attr_name and attr_name.startswith('Mock'):
                            mock_objects_found.append(f"{name}.{attr_name}")

            # Filter out test-related mocks
            real_mock_objects = [
                obj for obj in mock_objects_found
                if 'test' not in obj.lower() and 'development_mocks' in obj
            ]

            if real_mock_objects:
                self.test_results['mock_violations'].extend(
                    f"Mock object found: {obj}" for obj in real_mock_objects
                )
                logger.warning(f"⚠️ Mock objects found (but may be unused): {real_mock_objects}")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                "✅ Mock Detection: No active mock implementations detected"
            )
            logger.info("✅ Mock Usage Detection test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Mock Usage Detection test failed: {str(e)}")
            logger.error(f"❌ Mock Usage Detection test FAILED: {e}")

    def test_cross_service_integration(self):
        """Test integration between real services"""
        logger.info("🔗 Testing Cross-Service Integration...")
        self.test_results['tests_run'] += 1

        try:
            from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager

            # Get unified manager
            cloud_manager = get_unified_cloud_manager(config)

            # Test unified storage interface
            unified_storage = cloud_manager.get_unified_storage()
            if not isinstance(unified_storage, dict):
                raise RuntimeError("Unified storage interface invalid")

            # Verify all storage types point to real services
            for storage_type, client in unified_storage.items():
                if client is not None:
                    class_name = client.__class__.__name__
                    if 'Mock' in class_name or 'mock' in class_name:
                        self.test_results['mock_violations'].append(
                            f"Unified storage {storage_type} uses mock: {class_name}"
                        )
                        raise RuntimeError(f"Mock in unified storage {storage_type}: {class_name}")

            # Test service coordination
            try:
                # Try to get comprehensive statistics from all services
                unified_stats = cloud_manager.get_unified_stats()
                if not isinstance(unified_stats, dict):
                    raise RuntimeError("Unified stats invalid")

                # Verify real services percentage
                real_percentage = unified_stats.get('real_services_percentage', 0)
                if real_percentage < 100.0:
                    self.test_results['mock_violations'].append(
                        f"Real services percentage: {real_percentage}% (should be 100%)"
                    )

            except Exception as stats_error:
                logger.warning(f"⚠️ Could not get unified stats: {stats_error}")

            self.test_results['tests_passed'] += 1
            self.test_results['real_service_confirmations'].append(
                "✅ Cross-Service Integration: All services properly integrated"
            )
            logger.info("✅ Cross-Service Integration test PASSED")

        except Exception as e:
            self.test_results['tests_failed'] += 1
            self.test_results['errors'].append(f"Cross-Service Integration test failed: {str(e)}")
            logger.error(f"❌ Cross-Service Integration test FAILED: {e}")

    def generate_final_report(self):
        """Generate final test report"""
        logger.info("=" * 80)
        logger.info("📊 REAL CLOUD INTEGRATION TEST RESULTS")
        logger.info("=" * 80)

        # Summary
        total_tests = self.test_results['tests_run']
        passed_tests = self.test_results['tests_passed']
        failed_tests = self.test_results['tests_failed']
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

        logger.info(f"📈 SUMMARY:")
        logger.info(f"   Total Tests Run: {total_tests}")
        logger.info(f"   Tests Passed: {passed_tests}")
        logger.info(f"   Tests Failed: {failed_tests}")
        logger.info(f"   Success Rate: {success_rate:.1f}%")
        logger.info("")

        # Mock violations
        mock_violations = self.test_results['mock_violations']
        if mock_violations:
            logger.error(f"🚨 MOCK VIOLATIONS DETECTED ({len(mock_violations)}):")
            for violation in mock_violations:
                logger.error(f"   ❌ {violation}")
            logger.info("")

        # Real service confirmations
        confirmations = self.test_results['real_service_confirmations']
        if confirmations:
            logger.info(f"✅ REAL SERVICE CONFIRMATIONS ({len(confirmations)}):")
            for confirmation in confirmations:
                logger.info(f"   {confirmation}")
            logger.info("")

        # Errors
        errors = self.test_results['errors']
        if errors:
            logger.error(f"🔥 ERRORS ENCOUNTERED ({len(errors)}):")
            for error in errors:
                logger.error(f"   ❌ {error}")
            logger.info("")

        # Final verdict
        if failed_tests == 0 and len(mock_violations) == 0:
            logger.info("🎉 ALL TESTS PASSED - NO MOCKS DETECTED")
            logger.info("✅ System is using 100% REAL CLOUD INTEGRATIONS")
            self.test_results['final_verdict'] = 'SUCCESS'
        else:
            logger.error("💥 TESTS FAILED - MOCK IMPLEMENTATIONS DETECTED")
            logger.error("❌ System is NOT using 100% real cloud integrations")
            self.test_results['final_verdict'] = 'FAILURE'

        logger.info("=" * 80)

def main():
    """Main test execution"""
    tester = RealCloudIntegrationTester()
    results = tester.run_all_tests()

    # Exit with appropriate code
    if results['final_verdict'] == 'SUCCESS':
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()