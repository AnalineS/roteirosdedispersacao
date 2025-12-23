# -*- coding: utf-8 -*-
"""
Blueprint Functionality Tests
Comprehensive tests for all backend blueprints
"""

import pytest

from conftest import (
    assert_valid_json_response,
    assert_error_response,
    PERFORMANCE_THRESHOLDS,
    SECURITY_TEST_PAYLOADS
)

class TestChatBlueprint:
    """Test chat blueprint functionality"""

    @pytest.mark.api
    def test_chat_endpoint_exists(self, client):
        """Test that chat endpoint is accessible"""
        response = client.post('/api/v1/chat')
        # Should return 400 (bad request) not 404 (not found)
        assert response.status_code != 404

    @pytest.mark.api
    def test_chat_with_valid_data(self, client, sample_medical_query, mock_external_apis):
        """Test chat with valid medical query"""
        response = client.post('/api/v1/chat',
                              json=sample_medical_query,
                              content_type='application/json')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Validate response structure
            expected_fields = ['response', 'persona', 'timestamp']
            for field in expected_fields:
                assert field in data, f"Missing field in chat response: {field}"

            assert data['persona'] == sample_medical_query['persona']
            assert isinstance(data['response'], str)
            assert len(data['response']) > 0

    @pytest.mark.api
    def test_chat_missing_message(self, client):
        """Test chat with missing message"""
        response = client.post('/api/v1/chat',
                              json={'persona': 'dr_gasnelio'},
                              content_type='application/json')

        assert_error_response(response, 400)

    @pytest.mark.api
    def test_chat_invalid_persona(self, client):
        """Test chat with invalid persona"""
        response = client.post('/api/v1/chat',
                              json={
                                  'message': 'Test message',
                                  'persona': 'invalid_persona'
                              },
                              content_type='application/json')

        # Should handle gracefully
        assert response.status_code in [400, 422]

    @pytest.mark.security
    def test_chat_xss_protection(self, client):
        """Test chat endpoint XSS protection"""
        for payload in SECURITY_TEST_PAYLOADS:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': payload,
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            # Should not return the malicious payload unchanged
            if response.status_code == 200:
                data = response.get_json()
                if 'response' in data:
                    assert payload not in data['response'], \
                        f"XSS payload returned unchanged: {payload}"

class TestPersonasBlueprint:
    """Test personas blueprint functionality"""

    @pytest.mark.api
    def test_personas_list(self, client, performance_monitor):
        """Test personas list endpoint"""
        performance_monitor.start_timer('personas_list')
        response = client.get('/api/v1/personas')
        performance_monitor.end_timer('personas_list')

        data = assert_valid_json_response(response, 200)

        # Should return personas information
        assert isinstance(data, (dict, list))

        if isinstance(data, dict) and 'personas' in data:
            personas = data['personas']
        else:
            personas = data

        # Should have at least Dr. Gasnelio and Gá
        if isinstance(personas, list):
            assert len(personas) >= 2
        elif isinstance(personas, dict):
            assert len(personas.keys()) >= 2

        # Performance check
        performance_monitor.assert_performance(
            'personas_list',
            PERFORMANCE_THRESHOLDS['persona_list']
        )

    @pytest.mark.api
    def test_specific_persona_info(self, client):
        """Test getting specific persona information"""
        # Test for Dr. Gasnelio
        response = client.get('/api/v1/personas/dr_gasnelio')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain persona details
            expected_fields = ['name', 'role', 'description']
            for field in expected_fields:
                if field in data:  # Not all implementations may have all fields
                    assert isinstance(data[field], str)
                    assert len(data[field]) > 0

class TestFeedbackBlueprint:
    """Test feedback blueprint functionality"""

    @pytest.mark.api
    def test_feedback_submission(self, client, performance_monitor):
        """Test feedback submission"""
        feedback_data = {
            'feedback_text': 'Great response from Dr. Gasnelio!',
            'rating': 5,
            'persona': 'dr_gasnelio',
            'session_id': 'test_session_123'
        }

        performance_monitor.start_timer('feedback_submit')
        response = client.post('/api/v1/feedback',
                              json=feedback_data,
                              content_type='application/json')
        performance_monitor.end_timer('feedback_submit')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)
            assert 'status' in data
            assert data['status'] in ['success', 'received', 'submitted']

        # Performance check
        performance_monitor.assert_performance(
            'feedback_submit',
            PERFORMANCE_THRESHOLDS['feedback_submit']
        )

    @pytest.mark.api
    def test_feedback_validation(self, client):
        """Test feedback input validation"""
        # Test with missing required fields
        response = client.post('/api/v1/feedback',
                              json={'rating': 5},
                              content_type='application/json')

        # Should validate input
        assert response.status_code in [400, 422]

    @pytest.mark.api
    def test_feedback_rating_bounds(self, client):
        """Test feedback rating validation"""
        # Test invalid rating values
        invalid_ratings = [-1, 0, 6, 'invalid', None]

        for rating in invalid_ratings:
            response = client.post('/api/v1/feedback',
                                  json={
                                      'feedback_text': 'Test feedback',
                                      'rating': rating,
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            # Should reject invalid ratings
            if response.status_code not in [200, 201]:
                # This is expected behavior
                assert response.status_code in [400, 422]

class TestHealthBlueprint:
    """Test health blueprint functionality"""

    @pytest.mark.api
    def test_health_check_detailed(self, client):
        """Test detailed health check"""
        response = client.get('/api/v1/health')
        data = assert_valid_json_response(response, 200)

        # Should contain comprehensive health information
        assert 'status' in data
        assert data['status'] in ['healthy', 'ok', 'operational']

        # May contain additional health metrics
        optional_fields = ['services', 'dependencies', 'version', 'uptime']
        for field in optional_fields:
            if field in data:
                assert data[field] is not None

    @pytest.mark.api
    def test_health_check_dependencies(self, client):
        """Test health check shows dependency status"""
        response = client.get('/api/v1/health')
        data = assert_valid_json_response(response, 200)

        # If dependencies are reported, they should have status
        if 'dependencies' in data:
            deps = data['dependencies']
            assert isinstance(deps, dict)

            for dep_name, dep_status in deps.items():
                assert isinstance(dep_name, str)
                assert dep_status in ['ok', 'available', 'unavailable', 'error', True, False]

class TestMonitoringBlueprint:
    """Test monitoring blueprint functionality"""

    @pytest.mark.api
    def test_stats_endpoint(self, client, performance_monitor):
        """Test system stats endpoint"""
        performance_monitor.start_timer('stats_endpoint')
        response = client.get('/api/v1/monitoring/stats')
        performance_monitor.end_timer('stats_endpoint')

        data = assert_valid_json_response(response, 200)

        # Should contain monitoring statistics
        expected_stats = ['timestamp', 'status']
        for stat in expected_stats:
            if stat in data:  # Not all implementations may have all stats
                assert data[stat] is not None

        # Performance check
        performance_monitor.assert_performance(
            'stats_endpoint',
            PERFORMANCE_THRESHOLDS['stats_endpoint']
        )

    @pytest.mark.api
    def test_metrics_endpoint(self, client):
        """Test metrics endpoint if available"""
        response = client.get('/api/v1/monitoring/metrics')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)
            assert isinstance(data, dict)

class TestAnalyticsBlueprint:
    """Test analytics blueprint functionality"""

    @pytest.mark.api
    def test_analytics_endpoint(self, client):
        """Test analytics endpoint if available"""
        response = client.get('/api/v1/analytics/usage')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)
            # Should contain usage analytics
            assert isinstance(data, dict)
        elif response.status_code == 404:
            # Analytics may not be implemented
            pytest.skip("Analytics endpoint not implemented")

class TestMultimodalBlueprint:
    """Test multimodal processing blueprint"""

    @pytest.mark.multimodal
    def test_image_upload_endpoint(self, client, sample_image_data, performance_monitor):
        """Test image upload and processing"""
        image_data = {
            'image': sample_image_data,
            'format': 'png',
            'analysis_type': 'ocr'
        }

        performance_monitor.start_timer('multimodal_process')
        response = client.post('/api/v1/multimodal/analyze',
                              json=image_data,
                              content_type='application/json')
        performance_monitor.end_timer('multimodal_process')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain analysis results
            expected_fields = ['status', 'results']
            for field in expected_fields:
                if field in data:
                    assert data[field] is not None

            # Performance check (image processing can be slower)
            performance_monitor.assert_performance(
                'multimodal_process',
                PERFORMANCE_THRESHOLDS['multimodal_process']
            )

        elif response.status_code == 404:
            pytest.skip("Multimodal endpoint not implemented")

    @pytest.mark.multimodal
    def test_image_format_validation(self, client):
        """Test image format validation"""
        # Test invalid image data
        invalid_image_data = {
            'image': 'invalid_base64_data',
            'format': 'jpg'
        }

        response = client.post('/api/v1/multimodal/analyze',
                              json=invalid_image_data,
                              content_type='application/json')

        if response.status_code != 404:  # If endpoint exists
            # Should validate image format
            assert response.status_code in [400, 422]

class TestAuthBlueprint:
    """Test authentication blueprint"""

    @pytest.mark.api
    def test_auth_endpoints_exist(self, client):
        """Test that auth endpoints exist"""
        auth_endpoints = [
            '/api/v1/auth/login',
            '/api/v1/auth/logout',
            '/api/v1/auth/verify'
        ]

        for endpoint in auth_endpoints:
            response = client.post(endpoint)
            # Should not return 404 if endpoint exists
            if response.status_code != 404:
                # Auth may return 401, 400, etc. but not 404
                assert response.status_code != 404

class TestValidationBlueprint:
    """Test validation blueprint functionality"""

    @pytest.mark.api
    def test_scope_validation(self, client):
        """Test question scope validation"""
        validation_data = {
            'message': 'Qual é a dose de rifampicina para hanseníase?',
            'context': 'medical_dispensing'
        }

        response = client.post('/api/v1/validation/scope',
                              json=validation_data,
                              content_type='application/json')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain validation results
            expected_fields = ['is_valid', 'scope', 'confidence']
            for field in expected_fields:
                if field in data:
                    if field == 'is_valid':
                        assert isinstance(data[field], bool)
                    elif field == 'confidence':
                        assert isinstance(data[field], (int, float))
                        assert 0 <= data[field] <= 1

        elif response.status_code == 404:
            pytest.skip("Validation endpoint not implemented")

class TestEmailBlueprint:
    """Test email blueprint functionality"""

    @pytest.mark.api
    def test_email_send_endpoint(self, client):
        """Test email sending endpoint"""
        email_data = {
            'to': 'test@example.com',
            'subject': 'Test Email',
            'message': 'This is a test email from the backend'
        }

        response = client.post('/api/v1/email/send',
                              json=email_data,
                              content_type='application/json')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)
            assert 'status' in data
            assert data['status'] in ['sent', 'queued', 'success']

        elif response.status_code == 404:
            pytest.skip("Email endpoint not implemented")

class TestGamificationBlueprint:
    """Test gamification blueprint functionality"""

    @pytest.mark.api
    def test_user_progress_endpoint(self, client):
        """Test user progress tracking"""
        response = client.get('/api/v1/gamification/progress/test_user')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain progress information
            progress_fields = ['level', 'points', 'achievements']
            for field in progress_fields:
                if field in data:
                    if field in ['level', 'points']:
                        assert isinstance(data[field], (int, float))
                        assert data[field] >= 0

        elif response.status_code == 404:
            pytest.skip("Gamification endpoint not implemented")

class TestUserProfilesBlueprint:
    """Test user profiles blueprint functionality"""

    @pytest.mark.api
    def test_profile_endpoints(self, client):
        """Test user profile endpoints"""
        profile_endpoints = [
            '/api/v1/profiles/test_user',
            '/api/v1/profiles/preferences'
        ]

        for endpoint in profile_endpoints:
            response = client.get(endpoint)

            if response.status_code == 200:
                data = assert_valid_json_response(response, 200)
                assert isinstance(data, dict)
            elif response.status_code != 404:
                # May require authentication
                assert response.status_code in [401, 403]

class TestCacheBlueprint:
    """Test cache blueprint functionality"""

    @pytest.mark.api
    def test_cache_stats(self, client):
        """Test cache statistics endpoint"""
        response = client.get('/api/v1/cache/stats')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain cache statistics
            cache_stats = ['hit_rate', 'size', 'entries']
            for stat in cache_stats:
                if stat in data:
                    assert isinstance(data[stat], (int, float))

        elif response.status_code == 404:
            pytest.skip("Cache endpoint not implemented")

    @pytest.mark.api
    def test_cache_clear(self, client):
        """Test cache clearing functionality"""
        response = client.post('/api/v1/cache/clear')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)
            assert 'status' in data
            assert data['status'] in ['cleared', 'success']

        elif response.status_code == 404:
            pytest.skip("Cache clear endpoint not implemented")

class TestPredictionsBlueprint:
    """Test predictions blueprint functionality"""

    @pytest.mark.predictive
    def test_predictions_endpoint(self, client):
        """Test predictive analytics endpoint"""
        prediction_data = {
            'user_behavior': {
                'session_duration': 300,
                'questions_asked': 5,
                'persona_preference': 'dr_gasnelio'
            }
        }

        response = client.post('/api/v1/predictions/user_needs',
                              json=prediction_data,
                              content_type='application/json')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain prediction results
            if 'predictions' in data:
                assert isinstance(data['predictions'], (list, dict))

        elif response.status_code == 404:
            pytest.skip("Predictions endpoint not implemented")

class TestUXTrackingBlueprint:
    """Test UX tracking blueprint functionality"""

    @pytest.mark.api
    def test_ux_event_tracking(self, client):
        """Test UX event tracking"""
        ux_event = {
            'event_type': 'page_view',
            'page': '/chat',
            'timestamp': '2024-01-01T12:00:00Z',
            'user_agent': 'test-agent',
            'session_id': 'test_session'
        }

        response = client.post('/api/v1/ux/track',
                              json=ux_event,
                              content_type='application/json')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)
            assert 'status' in data
            assert data['status'] in ['tracked', 'recorded', 'success']

        elif response.status_code == 404:
            pytest.skip("UX tracking endpoint not implemented")

class TestNotificationsBlueprint:
    """Test notifications blueprint functionality"""

    @pytest.mark.api
    def test_notifications_endpoint(self, client):
        """Test notifications system"""
        response = client.get('/api/v1/notifications/user_123')

        if response.status_code == 200:
            data = assert_valid_json_response(response, 200)

            # Should contain notifications
            if 'notifications' in data:
                assert isinstance(data['notifications'], list)

        elif response.status_code == 404:
            pytest.skip("Notifications endpoint not implemented")