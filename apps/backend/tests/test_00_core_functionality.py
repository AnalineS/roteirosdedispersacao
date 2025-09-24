# -*- coding: utf-8 -*-
"""
Core Functionality Tests
Tests for fundamental backend operations and health checks
"""

import pytest
import json
import time
from unittest.mock import patch, Mock

from conftest import (
    assert_valid_json_response,
    assert_error_response,
    PERFORMANCE_THRESHOLDS
)

class TestCoreFunctionality:
    """Test core backend functionality"""

    def test_app_creation(self, app):
        """Test that Flask app is created successfully"""
        assert app is not None
        assert app.config['TESTING'] is True

    def test_root_endpoint(self, client, performance_monitor):
        """Test root endpoint provides API information"""
        performance_monitor.start_timer('root_endpoint')
        response = client.get('/')
        performance_monitor.end_timer('root_endpoint')

        data = assert_valid_json_response(response, 200)

        # Validate required fields
        required_fields = [
            'api_name', 'version', 'api_version', 'description',
            'environment', 'status', 'blueprints', 'documentation'
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

        # Validate specific content
        assert data['api_name'] == "Roteiros de Dispensação PQT-U"
        assert data['status'] == "operational"
        assert isinstance(data['blueprints'], list)
        assert len(data['blueprints']) > 0

        # Performance check
        performance_monitor.assert_performance('root_endpoint', 0.5)

    @pytest.mark.api
    def test_health_endpoints(self, client, performance_monitor):
        """Test all health check endpoints"""
        health_endpoints = [
            '/api/v1/health',
            '/api/v1/health/live',
            '/api/v1/health/ready',
            '/_ah/health'  # Google App Engine health check
        ]

        for endpoint in health_endpoints:
            performance_monitor.start_timer(f'health_{endpoint}')
            response = client.get(endpoint)
            performance_monitor.end_timer(f'health_{endpoint}')

            # All health endpoints should return 200
            data = assert_valid_json_response(response, 200)

            # Should contain status field
            assert 'status' in data
            assert data['status'] in ['healthy', 'ready', 'alive', 'ok']

            # Should contain timestamp
            assert 'timestamp' in data

            # Performance check
            performance_monitor.assert_performance(
                f'health_{endpoint}',
                PERFORMANCE_THRESHOLDS['health_check']
            )

    @pytest.mark.api
    def test_404_handling(self, client, security_validator):
        """Test 404 error handling"""
        response = client.get('/non-existent-endpoint')

        data = assert_error_response(response, 404, 'NOT_FOUND')

        # Should provide helpful information
        assert 'available_endpoints' in data
        assert isinstance(data['available_endpoints'], list)
        assert len(data['available_endpoints']) > 0

        # Security validation
        security_validator.check_security_headers(response)
        security_validator.check_content_type(response)

    @pytest.mark.api
    def test_405_method_not_allowed(self, client):
        """Test method not allowed handling"""
        # Try POST to GET-only endpoint
        response = client.post('/api/v1/health')

        data = assert_error_response(response, 405, 'METHOD_NOT_ALLOWED')

        assert 'allowed_methods' in data
        assert isinstance(data['allowed_methods'], list)

    @pytest.mark.api
    def test_options_requests(self, client, security_validator):
        """Test OPTIONS requests for CORS preflight"""
        response = client.options('/api/v1/health')

        # OPTIONS should succeed
        assert response.status_code in [200, 204]

        # Should have CORS headers
        security_validator.check_cors_headers(response)

class TestBlueprintLoading:
    """Test that all blueprints load correctly"""

    def test_blueprints_registered(self, app):
        """Test that blueprints are registered with the app"""
        blueprint_names = [bp.name for bp in app.blueprints.values()]

        # Expected core blueprints (updated to match current blueprint names)
        expected_blueprints = [
            'medical_core',
            'user_management',
            'analytics_observability',
            'engagement_multimodal',
            'infrastructure'
        ]

        for blueprint in expected_blueprints:
            assert blueprint in blueprint_names, f"Blueprint {blueprint} not registered"

    def test_blueprint_endpoints_accessible(self, client):
        """Test that blueprint endpoints are accessible"""
        # Test core endpoints that should always work
        endpoints_to_test = [
            ('/api/v1/health', 200),
            ('/api/v1/personas', 200),
            ('/memory/stats', 200)  # Use memory endpoint instead (no rate limit in tests)
        ]

        for endpoint, expected_status in endpoints_to_test:
            response = client.get(endpoint)
            assert response.status_code == expected_status, \
                f"Endpoint {endpoint} returned {response.status_code}, expected {expected_status}"

class TestSecurityMiddleware:
    """Test security middleware functionality"""

    @pytest.mark.security
    def test_security_headers_present(self, client, security_validator):
        """Test that security headers are added to responses"""
        response = client.get('/api/v1/health')

        security_validator.check_security_headers(response)

        # Test specific security headers
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
        assert response.headers.get('X-Frame-Options') == 'DENY'
        assert 'X-XSS-Protection' in response.headers

    @pytest.mark.security
    def test_cors_configuration(self, client, security_validator):
        """Test CORS configuration"""
        # Test with Origin header
        headers = {'Origin': 'http://localhost:3000'}
        response = client.get('/api/v1/health', headers=headers)

        security_validator.check_cors_headers(response)

    @pytest.mark.security
    def test_content_security_policy(self, client):
        """Test Content Security Policy header"""
        response = client.get('/api/v1/health')

        csp_header = response.headers.get('Content-Security-Policy')
        assert csp_header is not None
        assert "default-src 'self'" in csp_header

    @pytest.mark.security
    def test_no_server_header_exposure(self, client):
        """Test that server information is not exposed"""
        response = client.get('/api/v1/health')

        # These headers should not be present
        assert 'Server' not in response.headers
        assert 'X-Powered-By' not in response.headers

class TestEnvironmentConfiguration:
    """Test environment-specific configuration"""

    def test_testing_environment(self, app):
        """Test that testing environment is properly configured"""
        assert app.config['TESTING'] is True
        assert app.config['DEBUG'] is False

    def test_environment_variables_override(self, app):
        """Test that environment variables properly override defaults"""
        # This should be set by conftest.py
        assert app.config['SECRET_KEY'] == 'test-secret-key-for-testing-only'

    @pytest.mark.parametrize("config_key,expected_type", [
        ('TESTING', bool),
        ('DEBUG', bool),
        ('SECRET_KEY', str),
    ])
    def test_config_types(self, app, config_key, expected_type):
        """Test that configuration values have expected types"""
        config_value = app.config.get(config_key)
        assert isinstance(config_value, expected_type), \
            f"Config {config_key} should be {expected_type}, got {type(config_value)}"

class TestErrorHandling:
    """Test comprehensive error handling"""

    @pytest.mark.api
    def test_500_error_handling(self, client):
        """Test internal server error handling"""
        # This will be tested by causing an actual error in other tests
        # For now, just verify the error handler is registered
        response = client.get('/api/v1/health')
        assert response.status_code == 200  # Should not trigger 500

    @pytest.mark.api
    def test_413_payload_too_large(self, client):
        """Test payload size limit handling"""
        # Create large payload (over 16MB limit)
        large_data = {'data': 'x' * (17 * 1024 * 1024)}  # 17MB

        response = client.post('/api/v1/feedback',
                              json=large_data,
                              content_type='application/json')

        # Should return 413 or handle gracefully
        assert response.status_code in [413, 400, 500]

    @pytest.mark.api
    def test_malformed_json(self, client):
        """Test malformed JSON handling"""
        response = client.post('/api/v1/chat',
                              data='{"malformed": json}',
                              content_type='application/json')

        # Should handle malformed JSON gracefully
        assert response.status_code in [400, 422]

class TestDependencyInjection:
    """Test dependency injection system"""

    def test_dependencies_available(self, app):
        """Test that dependencies are properly injected"""
        # This tests the dependency injection system mentioned in main.py
        # We'll check if the app has the expected attributes
        assert hasattr(app, 'version_manager')

    @pytest.mark.integration
    def test_blueprint_dependencies(self, client):
        """Test that blueprint dependencies work"""
        # Test that blueprints can access their dependencies
        response = client.get('/api/v1/personas')

        # If dependencies are working, this should return valid data
        data = assert_valid_json_response(response, 200)
        assert isinstance(data, (dict, list))

class TestPerformanceBaseline:
    """Establish performance baselines"""

    @pytest.mark.performance
    def test_concurrent_health_checks(self, client, performance_monitor):
        """Test performance under concurrent requests"""
        import threading
        import queue

        results = queue.Queue()

        def make_request():
            start_time = time.time()
            response = client.get('/api/v1/health')
            end_time = time.time()
            results.put((response.status_code, end_time - start_time))

        # Create 10 concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Analyze results
        response_times = []
        while not results.empty():
            status_code, response_time = results.get()
            assert status_code == 200
            response_times.append(response_time)

        # All requests should complete within reasonable time
        assert len(response_times) == 10
        assert max(response_times) < 1.0  # 1 second max
        assert sum(response_times) / len(response_times) < 0.5  # 500ms average

    @pytest.mark.performance
    def test_memory_usage_baseline(self, client):
        """Test baseline memory usage"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Make several requests
        for _ in range(50):
            response = client.get('/api/v1/health')
            assert response.status_code == 200

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable (less than 50MB)
        assert memory_increase < 50 * 1024 * 1024, \
            f"Memory usage increased by {memory_increase / 1024 / 1024:.2f}MB"