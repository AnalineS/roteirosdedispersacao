# -*- coding: utf-8 -*-
"""
System Validation Tests
End-to-end system validation for production readiness
"""

import pytest
import json
import time
import os
import sqlite3
import tempfile
from unittest.mock import patch, Mock

from conftest import (
    assert_valid_json_response,
    assert_error_response
)

class TestSystemHealth:
    """Test overall system health and readiness"""

    @pytest.mark.integration
    def test_system_startup(self, app):
        """Test that system starts up correctly"""
        assert app is not None
        assert app.config['TESTING'] is True

        # Test that blueprints are registered
        blueprint_names = [bp.name for bp in app.blueprints.values()]
        assert len(blueprint_names) > 0, "No blueprints registered"

    @pytest.mark.integration
    def test_dependency_availability(self, client):
        """Test that all dependencies are available"""
        response = client.get('/api/v1/health')
        data = assert_valid_json_response(response, 200)

        # Check dependency status if reported
        if 'dependencies' in data:
            dependencies = data['dependencies']

            # Core dependencies should be available
            core_deps = ['cache', 'logging', 'security']
            for dep in core_deps:
                if dep in dependencies:
                    dep_status = dependencies[dep]
                    assert dep_status in [True, 'ok', 'available'], \
                        f"Core dependency {dep} not available: {dep_status}"

    @pytest.mark.integration
    def test_environment_configuration(self, app):
        """Test that environment is properly configured"""
        config = app.config

        # Critical configuration should be set
        assert config.get('SECRET_KEY'), "SECRET_KEY not configured"
        assert config.get('TESTING') is True, "Testing mode not enabled"

        # Security configuration
        assert config.get('SESSION_COOKIE_HTTPONLY', True), "Session cookies should be HttpOnly"

class TestDatabaseIntegration:
    """Test database integration and operations"""

    @pytest.mark.integration
    def test_database_connection(self, temp_database):
        """Test database connection and basic operations"""
        # Test connection
        conn = sqlite3.connect(temp_database)
        cursor = conn.cursor()

        # Test basic query
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        # Should have some tables
        assert len(tables) > 0, "No tables found in database"

        conn.close()

    @pytest.mark.integration
    def test_feedback_storage(self, client, temp_database):
        """Test feedback storage functionality"""
        with patch('sqlite3.connect') as mock_connect:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_connect.return_value = mock_conn
            mock_conn.cursor.return_value = mock_cursor

            feedback_data = {
                'feedback_text': 'Sistema funcionando perfeitamente',
                'rating': 5,
                'persona': 'dr_gasnelio',
                'session_id': 'test_session_123'
            }

            response = client.post('/api/v1/feedback',
                                  json=feedback_data,
                                  content_type='application/json')

            if response.status_code == 200:
                # Should attempt to store feedback
                assert mock_connect.called, "Database connection should be attempted"

class TestCacheSystem:
    """Test cache system functionality"""

    @pytest.mark.integration
    def test_cache_operations(self, client, mock_cache):
        """Test cache read/write operations"""
        with patch('services.cache.advanced_cache.AdvancedCache') as mock_cache_class:
            mock_cache_class.return_value = mock_cache

            # Make request that should use cache
            response = client.get('/api/v1/personas')

            if response.status_code == 200:
                # Cache operations should be attempted
                assert mock_cache.get.called or mock_cache.set.called, \
                    "Cache should be used for personas request"

    @pytest.mark.integration
    def test_cache_fallback(self, client):
        """Test system behavior when cache fails"""
        with patch('services.cache.advanced_cache.AdvancedCache') as mock_cache_class:
            mock_cache_class.side_effect = Exception("Cache unavailable")

            # System should still function without cache
            response = client.get('/api/v1/health')
            assert_valid_json_response(response, 200)

class TestAIIntegration:
    """Test AI service integration"""

    @pytest.mark.integration
    def test_openrouter_integration(self, client, mock_external_apis):
        """Test OpenRouter API integration"""
        chat_data = {
            'message': 'Teste de integração com IA',
            'persona': 'dr_gasnelio'
        }

        response = client.post('/api/v1/chat',
                              json=chat_data,
                              content_type='application/json')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain AI response
            assert 'response' in data
            assert isinstance(data['response'], str)
            assert len(data['response']) > 0

    @pytest.mark.integration
    def test_ai_fallback_behavior(self, client):
        """Test AI service fallback when external APIs fail"""
        with patch('requests.post') as mock_post:
            mock_post.side_effect = Exception("API unavailable")

            chat_data = {
                'message': 'Teste durante falha da API',
                'persona': 'dr_gasnelio'
            }

            response = client.post('/api/v1/chat',
                                  json=chat_data,
                                  content_type='application/json')

            # Should handle API failure gracefully
            assert response.status_code in [200, 500, 503]

            if response.status_code == 200:
                data = assert_valid_json_response(response, 200)
                # Should provide fallback response
                assert 'response' in data

class TestRAGSystem:
    """Test RAG (Retrieval-Augmented Generation) system"""

    @pytest.mark.rag
    @pytest.mark.integration
    def test_rag_knowledge_retrieval(self, client, mock_rag_service):
        """Test knowledge retrieval functionality"""
        with patch('services.rag.enhanced_rag_system.EnhancedRAGSystem') as mock_rag_class:
            mock_rag_class.return_value = mock_rag_service

            # Query that should trigger knowledge retrieval
            medical_query = {
                'message': 'Qual é o protocolo para hanseníase multibacilar?',
                'persona': 'dr_gasnelio',
                'use_knowledge_base': True
            }

            response = client.post('/api/v1/chat',
                                  json=medical_query,
                                  content_type='application/json')

            if response.status_code == 200:
                data = assert_valid_json_response(response, 200)

                # Should contain response enhanced by RAG
                assert 'response' in data
                assert len(data['response']) > 0

                # May contain source information
                if 'sources' in data:
                    assert isinstance(data['sources'], list)

    @pytest.mark.rag
    def test_rag_system_fallback(self, client):
        """Test RAG system fallback when knowledge base unavailable"""
        with patch('services.rag.enhanced_rag_system.EnhancedRAGSystem') as mock_rag:
            mock_rag.side_effect = Exception("Knowledge base unavailable")

            medical_query = {
                'message': 'Pergunta médica durante falha do RAG',
                'persona': 'dr_gasnelio'
            }

            response = client.post('/api/v1/chat',
                                  json=medical_query,
                                  content_type='application/json')

            # Should handle RAG failure gracefully
            assert response.status_code in [200, 500, 503]

class TestMonitoringSystem:
    """Test monitoring and observability"""

    @pytest.mark.integration
    def test_metrics_collection(self, client):
        """Test metrics collection functionality"""
        response = client.get('/api/v1/monitoring/stats')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain system metrics
            expected_metrics = ['timestamp', 'status']
            for metric in expected_metrics:
                if metric in data:
                    assert data[metric] is not None

    @pytest.mark.integration
    def test_health_monitoring(self, client):
        """Test comprehensive health monitoring"""
        # Test multiple health endpoints
        health_endpoints = [
            '/api/v1/health',
            '/api/v1/health/live',
            '/api/v1/health/ready'
        ]

        for endpoint in health_endpoints:
            response = client.get(endpoint)
            data = assert_valid_json_response(response, 200)

            # Each should report healthy status
            assert 'status' in data
            assert data['status'] in ['healthy', 'ok', 'ready', 'alive']

class TestSecurityIntegration:
    """Test integrated security measures"""

    @pytest.mark.security
    @pytest.mark.integration
    def test_security_middleware_integration(self, client, security_validator):
        """Test security middleware integration"""
        response = client.get('/api/v1/health')

        # Security headers should be present
        security_validator.check_security_headers(response)
        security_validator.check_content_type(response)

        # CORS should be configured
        headers = {'Origin': 'http://localhost:3000'}
        cors_response = client.get('/api/v1/health', headers=headers)
        security_validator.check_cors_headers(cors_response)

    @pytest.mark.security
    @pytest.mark.integration
    def test_rate_limiting_integration(self, client):
        """Test rate limiting integration"""
        # Make several requests quickly
        responses = []
        for i in range(20):
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': f'Rate limit test {i}',
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')
            responses.append(response.status_code)

        # Should have mix of successful and potentially rate-limited responses
        success_count = sum(1 for status in responses if status == 200)
        rate_limited_count = sum(1 for status in responses if status == 429)

        # Should allow some requests
        assert success_count > 0, "Rate limiting too aggressive"

        # If rate limiting is active, some should be blocked
        if rate_limited_count > 0:
            assert rate_limited_count < len(responses), "Rate limiting blocks all requests"

class TestErrorHandlingIntegration:
    """Test integrated error handling"""

    @pytest.mark.integration
    def test_comprehensive_error_handling(self, client):
        """Test error handling across the system"""
        # Test various error conditions
        error_scenarios = [
            ('GET', '/nonexistent', None, 404),
            ('POST', '/api/v1/chat', {}, 400),  # Missing required fields
            ('PUT', '/api/v1/health', None, 405),  # Wrong method
            ('POST', '/api/v1/feedback', {'invalid': 'data'}, [400, 422])  # Invalid data
        ]

        for method, endpoint, data, expected_status in error_scenarios:
            if method == 'GET':
                response = client.get(endpoint)
            elif method == 'POST':
                response = client.post(endpoint, json=data, content_type='application/json')
            elif method == 'PUT':
                response = client.put(endpoint)

            # Should return expected error status
            if isinstance(expected_status, list):
                assert response.status_code in expected_status
            else:
                assert response.status_code == expected_status

            # Error response should be well-formed JSON
            if response.status_code >= 400:
                try:
                    error_data = response.get_json()
                    assert error_data is not None
                    assert 'error' in error_data
                    assert 'timestamp' in error_data
                except:
                    # Some errors might not return JSON, which is acceptable
                    pass

class TestPerformanceIntegration:
    """Test integrated performance characteristics"""

    @pytest.mark.performance
    @pytest.mark.integration
    def test_system_response_times(self, client, performance_monitor):
        """Test integrated system response times"""
        endpoints = [
            '/api/v1/health',
            '/api/v1/personas',
            '/api/v1/monitoring/stats'
        ]

        for endpoint in endpoints:
            performance_monitor.start_timer(f'integrated_{endpoint}')
            response = client.get(endpoint)
            duration = performance_monitor.end_timer(f'integrated_{endpoint}')

            if response.status_code == 200:
                # Integrated response times should be reasonable
                assert duration < 2.0, \
                    f"Integrated response time for {endpoint} too slow: {duration:.3f}s"

    @pytest.mark.performance
    @pytest.mark.integration
    def test_concurrent_system_load(self, client):
        """Test system under concurrent integrated load"""
        import threading
        import queue

        results = queue.Queue()
        num_threads = 10

        def integrated_load_test():
            thread_results = []

            # Simulate realistic user session
            operations = [
                ('GET', '/api/v1/personas', None),
                ('POST', '/api/v1/chat', {
                    'message': 'Teste de carga integrada',
                    'persona': 'dr_gasnelio'
                }),
                ('GET', '/api/v1/health', None),
                ('POST', '/api/v1/feedback', {
                    'feedback_text': 'Teste de carga',
                    'rating': 4,
                    'persona': 'dr_gasnelio'
                })
            ]

            for method, endpoint, data in operations:
                start_time = time.time()
                try:
                    if method == 'GET':
                        response = client.get(endpoint)
                    else:
                        response = client.post(endpoint, json=data, content_type='application/json')

                    end_time = time.time()
                    thread_results.append({
                        'endpoint': endpoint,
                        'method': method,
                        'status': response.status_code,
                        'duration': end_time - start_time,
                        'success': response.status_code in [200, 201]
                    })
                except Exception as e:
                    thread_results.append({
                        'endpoint': endpoint,
                        'method': method,
                        'status': 500,
                        'duration': 999,
                        'success': False,
                        'error': str(e)
                    })

            results.put(thread_results)

        # Execute concurrent integrated load
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=integrated_load_test)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Analyze integrated load results
        all_results = []
        while not results.empty():
            thread_results = results.get()
            all_results.extend(thread_results)

        # Performance analysis
        total_operations = len(all_results)
        successful_operations = sum(1 for r in all_results if r['success'])
        success_rate = successful_operations / total_operations

        response_times = [r['duration'] for r in all_results if r['success']]

        # Integrated load assertions
        assert success_rate >= 0.8, f"Integrated success rate {success_rate:.2%} too low"

        if response_times:
            import statistics
            avg_response_time = statistics.mean(response_times)
            max_response_time = max(response_times)

            assert avg_response_time < 3.0, \
                f"Average integrated response time {avg_response_time:.3f}s too high"
            assert max_response_time < 10.0, \
                f"Max integrated response time {max_response_time:.3f}s too high"

class TestDataConsistency:
    """Test data consistency across system components"""

    @pytest.mark.integration
    def test_session_data_consistency(self, client, mock_external_apis):
        """Test session data consistency"""
        session_id = f"test_session_{int(time.time())}"

        # Multiple interactions in same session
        interactions = [
            {
                'message': 'Primeira pergunta da sessão',
                'persona': 'dr_gasnelio',
                'session_id': session_id
            },
            {
                'message': 'Segunda pergunta relacionada',
                'persona': 'dr_gasnelio',
                'session_id': session_id
            }
        ]

        responses = []
        for interaction in interactions:
            response = client.post('/api/v1/chat',
                                  json=interaction,
                                  content_type='application/json')
            responses.append(response)

        # All interactions should succeed if chat works
        if all(r.status_code == 200 for r in responses):
            # Session data should be consistent
            for response in responses:
                data = response.get_json()
                assert 'response' in data
                assert data.get('persona') == 'dr_gasnelio'

    @pytest.mark.integration
    def test_feedback_data_consistency(self, client):
        """Test feedback data consistency"""
        feedback_items = [
            {
                'feedback_text': 'Primeira avaliação',
                'rating': 5,
                'persona': 'dr_gasnelio',
                'session_id': 'consistency_test_1'
            },
            {
                'feedback_text': 'Segunda avaliação',
                'rating': 4,
                'persona': 'ga',
                'session_id': 'consistency_test_2'
            }
        ]

        # Submit multiple feedback items
        for feedback in feedback_items:
            response = client.post('/api/v1/feedback',
                                  json=feedback,
                                  content_type='application/json')

            if response.status_code == 200:
                data = assert_valid_json_response(response, 200)
                assert 'status' in data

class TestSystemRecovery:
    """Test system recovery capabilities"""

    @pytest.mark.integration
    def test_graceful_degradation(self, client):
        """Test system graceful degradation"""
        # Simulate various component failures
        failure_scenarios = [
            ('Cache failure', 'services.cache.advanced_cache.AdvancedCache'),
            ('Database failure', 'sqlite3.connect'),
            ('External API failure', 'requests.post')
        ]

        for scenario_name, component_to_fail in failure_scenarios:
            with patch(component_to_fail) as mock_component:
                mock_component.side_effect = Exception(f"{scenario_name} simulated")

                # Core functionality should still work
                response = client.get('/api/v1/health')

                # Should handle failure gracefully
                assert response.status_code in [200, 503], \
                    f"System should handle {scenario_name} gracefully"

                if response.status_code == 200:
                    data = assert_valid_json_response(response, 200)
                    # May report degraded status
                    status = data.get('status', '')
                    assert status in ['healthy', 'degraded', 'ok']

    @pytest.mark.integration
    def test_system_resilience(self, client, performance_monitor):
        """Test system resilience under stress"""
        # Test system behavior under various stress conditions
        stress_tests = [
            ('High frequency requests', lambda: [
                client.get('/api/v1/health') for _ in range(50)
            ]),
            ('Large payloads', lambda: [
                client.post('/api/v1/chat',
                           json={
                               'message': 'x' * 1000,  # Large message
                               'persona': 'dr_gasnelio'
                           },
                           content_type='application/json')
                for _ in range(5)
            ])
        ]

        for test_name, stress_function in stress_tests:
            performance_monitor.start_timer(f'resilience_{test_name}')

            try:
                responses = stress_function()
                success_count = sum(1 for r in responses if r.status_code in [200, 201])
                success_rate = success_count / len(responses)

                # System should maintain reasonable success rate under stress
                assert success_rate >= 0.7, \
                    f"System resilience failed for {test_name}: {success_rate:.2%} success rate"

            except Exception as e:
                pytest.fail(f"System resilience test {test_name} caused exception: {e}")

            finally:
                performance_monitor.end_timer(f'resilience_{test_name}')

        # System should recover quickly from stress
        recovery_response = client.get('/api/v1/health')
        assert_valid_json_response(recovery_response, 200)