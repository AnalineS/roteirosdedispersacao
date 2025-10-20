# -*- coding: utf-8 -*-
"""
Real Cloud Infrastructure Tests
Tests REAL cloud services integration - NO MOCKS
Validates complete cloud infrastructure functionality
"""

import os
import sys
import pytest
import json
import time
import logging
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app_config import config
from core.cloud.cloud_initializer import initialize_cloud_services
from services.cache.cloud_native_cache import get_cloud_cache
from services.rag.supabase_rag_system import get_rag_system

logger = logging.getLogger(__name__)

@pytest.fixture(scope="session")
def cloud_initializer():
    """Initialize real cloud services for testing"""
    try:
        initializer = initialize_cloud_services(config)
        return initializer
    except Exception as e:
        pytest.skip(f"Cloud services not available: {e}")

@pytest.fixture(scope="session")
def cloud_cache():
    """Get cloud cache instance"""
    cache = get_cloud_cache()
    if not cache:
        pytest.skip("Cloud cache not available")
    return cache

@pytest.fixture(scope="session")
def rag_system():
    """Get RAG system instance"""
    rag = get_rag_system()
    if not rag:
        pytest.skip("RAG system not available")
    return rag

class TestRealCloudInfrastructure:
    """Test suite for real cloud infrastructure"""

    def test_environment_variables_configured(self):
        """Test that required environment variables are set"""
        # Required for real cloud integrations
        required_vars = [
            'SECRET_KEY',
            'ENVIRONMENT'
        ]

        # Supabase variables (if Supabase is enabled)
        if hasattr(config, 'SUPABASE_URL') and config.SUPABASE_URL:
            required_vars.extend([
                'SUPABASE_URL',
                'SUPABASE_ANON_KEY'
            ])

        # GCS variables (if GCS is enabled)
        if hasattr(config, 'GCS_BUCKET_NAME') and config.GCS_BUCKET_NAME:
            required_vars.extend([
                'GOOGLE_CLOUD_PROJECT',
                'GCS_BUCKET_NAME'
            ])

        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        assert not missing_vars, f"Missing required environment variables: {missing_vars}"

    def test_cloud_initializer_status(self, cloud_initializer):
        """Test that cloud initializer reports service status correctly"""
        status = cloud_initializer.get_service_status()

        # At least one service should be available (including local development)
        available_services = [name for name, available in status.items() if available]
        assert len(available_services) > 0, "No cloud services available"

        logger.info(f"Available services: {available_services}")

    def test_supabase_integration(self, cloud_initializer):
        """Test real Supabase integration"""
        supabase_client = cloud_initializer.get_service_client('supabase')

        if not supabase_client:
            pytest.skip("Supabase not available - testing local alternatives")

        # Test health check
        health = supabase_client.health_check()
        assert health['overall_healthy'], f"Supabase health check failed: {health}"

        # Test vector storage (if PostgreSQL connection available)
        if hasattr(supabase_client, 'pg_conn') and supabase_client.pg_conn:
            test_embedding = [0.1] * 1536  # Mock embedding vector

            vector_id = supabase_client.store_vector(
                content="Test medical knowledge",
                embedding=test_embedding,
                metadata={"source": "test", "category": "test"},
                source="test_suite"
            )
            assert vector_id > 0, "Failed to store vector"

            # Test vector search
            search_results = supabase_client.search_vectors(
                query_embedding=test_embedding,
                limit=1,
                similarity_threshold=0.5
            )
            assert len(search_results) > 0, "No vectors found in search"
            assert search_results[0]['content'] == "Test medical knowledge"

            logger.info(f"✅ Supabase vector operations successful - Vector ID: {vector_id}")

    def test_gcs_integration(self, cloud_initializer):
        """Test real Google Cloud Storage integration"""
        gcs_client = cloud_initializer.get_service_client('gcs')

        if not gcs_client:
            pytest.skip("GCS not available - testing local alternatives")

        # Test health check
        health = gcs_client.health_check()
        assert health['overall_healthy'], f"GCS health check failed: {health}"

        # Test file operations
        test_content = f"Test medical document - {datetime.now().isoformat()}"
        test_file_path = f"test/medical_test_{int(time.time())}.txt"

        # Upload test file
        upload_url = gcs_client.upload_string(test_content, test_file_path)
        assert upload_url is not None, "Failed to upload file to GCS"

        # Download test file
        downloaded_content = gcs_client.download_string(test_file_path)
        assert downloaded_content == test_content, "Downloaded content doesn't match uploaded content"

        # Test file metadata
        file_info = gcs_client.get_file_info(test_file_path)
        assert file_info is not None, "Failed to get file info"
        assert file_info['name'] == test_file_path

        # Cleanup test file
        deleted = gcs_client.delete_file(test_file_path)
        assert deleted, "Failed to delete test file"

        logger.info(f"✅ GCS operations successful - Upload URL: {upload_url}")

    def test_cloud_cache_functionality(self, cloud_cache):
        """Test cloud cache with real backends"""
        # Test basic cache operations
        test_key = f"test_medical_cache_{int(time.time())}"
        test_data = {
            "medical_info": "Hanseníase treatment protocol",
            "dosage": "Rifampicina 600mg",
            "timestamp": datetime.now().isoformat()
        }

        # Set cache item
        success = cloud_cache.set(test_key, test_data)
        assert success, "Failed to set cache item"

        # Get cache item
        retrieved_data = cloud_cache.get(test_key)
        assert retrieved_data is not None, "Failed to retrieve cache item"
        assert retrieved_data['medical_info'] == test_data['medical_info']

        # Test cache statistics
        stats = cloud_cache.get_stats()
        assert 'enabled_levels' in stats
        assert 'hit_rates' in stats

        logger.info(f"✅ Cloud cache functional - Active levels: {stats['enabled_levels']}")

    def test_rag_system_integration(self, rag_system):
        """Test RAG system with real cloud backends"""
        # Test query scope validation
        medical_query = "Qual a dose da rifampicina para hanseníase?"
        in_scope, category, confidence = rag_system.is_query_in_scope(medical_query)

        assert in_scope, "Medical query should be in scope"
        assert category in ['hanseniase', 'farmacologia', 'dispensacao']
        assert confidence > 0.0

        # Test context retrieval
        context = rag_system.retrieve_context(
            query=medical_query,
            max_chunks=3,
            use_cache=True
        )

        assert context is not None
        assert hasattr(context, 'confidence_level')
        assert context.confidence_level in ['high', 'medium', 'low']

        # Test out-of-scope query
        out_of_scope_query = "Como fazer bolo de chocolate?"
        out_in_scope, _, _ = rag_system.is_query_in_scope(out_of_scope_query)
        assert not out_in_scope, "Non-medical query should be out of scope"

        logger.info(f"✅ RAG system functional - Context confidence: {context.confidence_level}")

    def test_medical_data_operations(self, cloud_initializer, cloud_cache, rag_system):
        """Test end-to-end medical data operations"""
        # Test storing medical knowledge
        medical_knowledge = {
            "medication": "Rifampicina",
            "dosage": "600mg daily",
            "condition": "Hanseníase",
            "instructions": "Take with food to reduce stomach upset",
            "contraindications": ["severe liver disease", "pregnancy concerns"]
        }

        cache_key = f"medical_knowledge_{int(time.time())}"

        # Store in cache
        cache_stored = cloud_cache.set(cache_key, medical_knowledge)
        assert cache_stored, "Failed to store medical knowledge in cache"

        # Retrieve from cache
        retrieved_knowledge = cloud_cache.get(cache_key)
        assert retrieved_knowledge is not None
        assert retrieved_knowledge['medication'] == medical_knowledge['medication']

        # Test medical query processing
        medical_query = "Qual é a dose da rifampicina?"

        # Get context from RAG system
        context = rag_system.retrieve_context(medical_query, max_chunks=2)

        # Generate response
        response = rag_system.generate_answer(
            query=medical_query,
            context=context,
            persona='dr_gasnelio',
            enhance_with_openrouter=False  # Skip OpenRouter for test
        )

        assert response is not None
        assert response.answer is not None
        assert len(response.answer) > 0
        assert response.persona == 'dr_gasnelio'
        assert response.quality_score >= 0.0

        logger.info(f"✅ Medical data operations successful - Quality score: {response.quality_score}")

    def test_local_development_fallback(self, cloud_initializer):
        """Test local development fallback when cloud services are unavailable"""
        # Check if local development setup is available
        local_dev_client = cloud_initializer.get_service_client('local_development')

        if local_dev_client:
            # Test local development health
            health = local_dev_client.health_check()
            assert 'overall_healthy' in health

            logger.info("✅ Local development fallback available")
        else:
            logger.info("ℹ️ Local development fallback not configured")

    def test_performance_benchmarks(self, cloud_cache, rag_system):
        """Test performance of cloud operations"""
        # Cache performance test
        start_time = time.time()

        for i in range(10):
            test_key = f"perf_test_{i}"
            test_data = {"index": i, "timestamp": datetime.now().isoformat()}
            cloud_cache.set(test_key, test_data)
            retrieved = cloud_cache.get(test_key)
            assert retrieved['index'] == i

        cache_time = time.time() - start_time

        # RAG system performance test
        start_time = time.time()

        test_queries = [
            "Dose da rifampicina",
            "Efeitos colaterais da dapsona",
            "Contraindicações do tratamento"
        ]

        for query in test_queries:
            context = rag_system.retrieve_context(query, max_chunks=1)
            assert context is not None

        rag_time = time.time() - start_time

        # Performance assertions (reasonable benchmarks)
        assert cache_time < 5.0, f"Cache operations too slow: {cache_time:.2f}s"
        assert rag_time < 10.0, f"RAG operations too slow: {rag_time:.2f}s"

        logger.info(f"✅ Performance benchmarks passed - Cache: {cache_time:.2f}s, RAG: {rag_time:.2f}s")

    def test_error_handling_and_recovery(self, cloud_cache, rag_system):
        """Test error handling and graceful degradation"""
        # Test cache with invalid key
        invalid_result = cloud_cache.get("nonexistent_key_12345")
        assert invalid_result is None, "Should return None for non-existent keys"

        # Test RAG system with edge cases
        empty_context = rag_system.retrieve_context("", max_chunks=1)
        assert empty_context is not None, "Should handle empty queries gracefully"

        # Test very long query
        long_query = "dose rifampicina " * 100
        long_context = rag_system.retrieve_context(long_query, max_chunks=1)
        assert long_context is not None, "Should handle long queries gracefully"

        logger.info("✅ Error handling and recovery tests passed")

    def test_security_and_validation(self, cloud_initializer):
        """Test security measures and input validation"""
        # Test that sensitive information is not logged
        services_status = cloud_initializer.get_service_status()

        # Verify no sensitive data in status
        status_str = str(services_status)
        sensitive_patterns = ['password', 'secret', 'key', 'token']

        for pattern in sensitive_patterns:
            assert pattern.lower() not in status_str.lower(), f"Sensitive data '{pattern}' found in status"

        # Test configuration validation
        assert hasattr(config, 'validate'), "Config should have validation method"

        logger.info("✅ Security and validation tests passed")

def run_infrastructure_tests():
    """Run all infrastructure tests and generate report"""
    print("🚀 Running REAL Cloud Infrastructure Tests")
    print("=" * 50)

    # Configure logging
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

    # Run tests
    exit_code = pytest.main([
        __file__,
        '-v',
        '--tb=short',
        '--durations=10',
        f'--junitxml=test_results_cloud_infrastructure.xml'
    ])

    if exit_code == 0:
        print("\n✅ ALL CLOUD INFRASTRUCTURE TESTS PASSED!")
        print("🎉 Real cloud services are functional and properly configured")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("🔍 Check the test output above for details")

    return exit_code

if __name__ == "__main__":
    exit_code = run_infrastructure_tests()
    sys.exit(exit_code)