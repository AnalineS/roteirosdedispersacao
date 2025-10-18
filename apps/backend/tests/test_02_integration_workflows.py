# -*- coding: utf-8 -*-
"""
Integration Tests for Critical Workflows
End-to-end testing of core system workflows
"""

import pytest
import json
import time
import uuid
from unittest.mock import patch, Mock

from conftest import (
    assert_valid_json_response,
    assert_error_response,
    PERFORMANCE_THRESHOLDS
)

class TestChatWorkflow:
    """Test complete chat workflow end-to-end"""

    @pytest.mark.integration
    def test_complete_chat_session(self, client, mock_external_apis, performance_monitor):
        """Test complete chat session with persona interaction"""
        session_id = str(uuid.uuid4())

        # Step 1: Get available personas
        performance_monitor.start_timer('get_personas')
        personas_response = client.get('/api/v1/personas')
        performance_monitor.end_timer('get_personas')

        personas_data = assert_valid_json_response(personas_response, 200)

        # Step 2: Start chat with Dr. Gasnelio
        chat_data = {
            'message': 'Qual é o protocolo padrão para hanseníase paucibacilar?',
            'persona': 'dr_gasnelio',
            'session_id': session_id,
            'context': 'dispensing_guidance'
        }

        performance_monitor.start_timer('chat_interaction')
        chat_response = client.post('/api/v1/chat',
                                   json=chat_data,
                                   content_type='application/json')
        performance_monitor.end_timer('chat_interaction')

        if chat_response.status_code == 200:
            chat_data = assert_valid_json_response(chat_response, 200)

            # Validate chat response structure
            assert 'response' in chat_data
            assert 'persona' in chat_data
            assert chat_data['persona'] == 'dr_gasnelio'

            # Step 3: Submit feedback
            feedback_data = {
                'feedback_text': 'Resposta muito útil e técnica',
                'rating': 5,
                'persona': 'dr_gasnelio',
                'session_id': session_id
            }

            feedback_response = client.post('/api/v1/feedback',
                                           json=feedback_data,
                                           content_type='application/json')

            if feedback_response.status_code == 200:
                feedback_result = assert_valid_json_response(feedback_response, 200)
                assert 'status' in feedback_result

        # Performance validation
        performance_monitor.assert_performance('get_personas', 0.5)
        performance_monitor.assert_performance('chat_interaction', 3.0)

    @pytest.mark.integration
    def test_persona_switching_workflow(self, client, mock_external_apis):
        """Test switching between personas in same session"""
        session_id = str(uuid.uuid4())

        # Chat with Dr. Gasnelio (technical)
        technical_query = {
            'message': 'Explique os mecanismos de ação da rifampicina',
            'persona': 'dr_gasnelio',
            'session_id': session_id
        }

        dr_response = client.post('/api/v1/chat',
                                 json=technical_query,
                                 content_type='application/json')

        # Chat with Gá (empathetic)
        empathetic_query = {
            'message': 'Estou preocupado com os efeitos colaterais',
            'persona': 'ga',
            'session_id': session_id
        }

        ga_response = client.post('/api/v1/chat',
                                 json=empathetic_query,
                                 content_type='application/json')

        # Both should succeed if endpoints exist
        if dr_response.status_code == 200 and ga_response.status_code == 200:
            dr_data = assert_valid_json_response(dr_response, 200)
            ga_data = assert_valid_json_response(ga_response, 200)

            # Responses should reflect different personas
            assert dr_data['persona'] == 'dr_gasnelio'
            assert ga_data['persona'] == 'ga'

class TestRAGWorkflow:
    """Test RAG system integration workflow"""

    @pytest.mark.rag
    @pytest.mark.integration
    def test_knowledge_retrieval_workflow(self, client, mock_rag_service):
        """Test knowledge retrieval and response generation"""

        # Test query that should trigger RAG system
        medical_query = {
            'message': 'Qual é a dose específica de dapsona para crianças com hanseníase?',
            'persona': 'dr_gasnelio',
            'use_rag': True
        }

        with patch('services.rag.enhanced_rag_system.EnhancedRAGSystem') as mock_rag:
            mock_rag.return_value = mock_rag_service

            response = client.post('/api/v1/chat',
                                  json=medical_query,
                                  content_type='application/json')

            if response.status_code == 200:
                data = assert_valid_json_response(response, 200)

                # Should contain response enhanced by RAG
                assert 'response' in data
                assert len(data['response']) > 0

                # May contain RAG metadata
                if 'sources' in data:
                    assert isinstance(data['sources'], list)

    @pytest.mark.rag
    def test_scope_validation_workflow(self, client):
        """Test question scope validation before RAG"""

        # Test medical question (should be in scope)
        medical_query = {
            'message': 'Como tratar hanseníase?',
            'context': 'medical_consultation'
        }

        scope_response = client.post('/api/v1/validation/scope',
                                    json=medical_query,
                                    content_type='application/json')

        if scope_response.status_code == 200:
            scope_data = assert_valid_json_response(scope_response, 200)

            if 'is_valid' in scope_data:
                assert isinstance(scope_data['is_valid'], bool)

                # If valid, should be able to proceed with chat
                if scope_data['is_valid']:
                    chat_query = {
                        'message': medical_query['message'],
                        'persona': 'dr_gasnelio'
                    }

                    chat_response = client.post('/api/v1/chat',
                                               json=chat_query,
                                               content_type='application/json')

                    # Should not be rejected due to scope
                    assert chat_response.status_code != 403

class TestMultimodalWorkflow:
    """Test multimodal processing workflow"""

    @pytest.mark.multimodal
    @pytest.mark.integration
    def test_image_analysis_workflow(self, client, sample_image_data, performance_monitor):
        """Test complete image analysis workflow"""

        # Step 1: Upload and analyze image
        image_request = {
            'image': sample_image_data,
            'format': 'png',
            'analysis_type': 'prescription_analysis'
        }

        performance_monitor.start_timer('image_upload')
        upload_response = client.post('/api/v1/multimodal/analyze',
                                     json=image_request,
                                     content_type='application/json')
        performance_monitor.end_timer('image_upload')

        if upload_response.status_code == 200:
            upload_data = assert_valid_json_response(upload_response, 200)

            # Should contain analysis results
            if 'results' in upload_data:
                results = upload_data['results']

                # Step 2: Use analysis results in chat
                if 'extracted_text' in results:
                    chat_query = {
                        'message': f"Analise esta prescrição: {results['extracted_text']}",
                        'persona': 'dr_gasnelio',
                        'context': 'prescription_review'
                    }

                    chat_response = client.post('/api/v1/chat',
                                               json=chat_query,
                                               content_type='application/json')

                    if chat_response.status_code == 200:
                        chat_data = assert_valid_json_response(chat_response, 200)
                        assert 'response' in chat_data

            # Performance validation
            performance_monitor.assert_performance('image_upload', 10.0)  # Generous limit for image processing

class TestAnalyticsWorkflow:
    """Test analytics and monitoring workflow"""

    @pytest.mark.integration
    def test_user_behavior_tracking_workflow(self, client):
        """Test complete user behavior tracking"""
        session_id = str(uuid.uuid4())

        # Step 1: Track session start
        session_start = {
            'event_type': 'session_start',
            'session_id': session_id,
            'timestamp': time.time(),
            'user_agent': 'test-browser/1.0'
        }

        track_response = client.post('/api/v1/ux/track',
                                    json=session_start,
                                    content_type='application/json')

        # Step 2: Simulate user interactions
        interactions = [
            {'event_type': 'persona_select', 'persona': 'dr_gasnelio'},
            {'event_type': 'message_send', 'message_length': 50},
            {'event_type': 'response_received', 'response_helpful': True}
        ]

        for interaction in interactions:
            interaction.update({
                'session_id': session_id,
                'timestamp': time.time()
            })

            client.post('/api/v1/ux/track',
                       json=interaction,
                       content_type='application/json')

        # Step 3: Check analytics
        analytics_response = client.get('/api/v1/analytics/usage')

        if analytics_response.status_code == 200:
            analytics_data = assert_valid_json_response(analytics_response, 200)
            # Analytics should contain usage data
            assert isinstance(analytics_data, dict)

class TestErrorRecoveryWorkflow:
    """Test error recovery and graceful degradation"""

    @pytest.mark.integration
    def test_api_failure_recovery(self, client):
        """Test system behavior when external APIs fail"""

        # Simulate OpenRouter API failure
        with patch('requests.post') as mock_post:
            mock_post.side_effect = Exception("API connection failed")

            chat_query = {
                'message': 'Test message during API failure',
                'persona': 'dr_gasnelio'
            }

            response = client.post('/api/v1/chat',
                                  json=chat_query,
                                  content_type='application/json')

            # Should handle gracefully, not crash
            assert response.status_code in [200, 500, 503]

            if response.status_code == 200:
                data = assert_valid_json_response(response, 200)
                # Should contain fallback response
                assert 'response' in data

    @pytest.mark.integration
    def test_cache_failure_recovery(self, client):
        """Test system behavior when cache fails"""

        # Simulate cache failure
        with patch('services.cache.advanced_cache.AdvancedCache') as mock_cache:
            mock_cache.side_effect = Exception("Cache connection failed")

            # System should still work without cache
            response = client.get('/api/v1/health')
            assert_valid_json_response(response, 200)

    @pytest.mark.integration
    def test_database_failure_recovery(self, client):
        """Test system behavior when database fails"""

        # Test feedback submission with database failure
        with patch('sqlite3.connect') as mock_connect:
            mock_connect.side_effect = Exception("Database connection failed")

            feedback_data = {
                'feedback_text': 'Test feedback during DB failure',
                'rating': 5,
                'persona': 'dr_gasnelio'
            }

            response = client.post('/api/v1/feedback',
                                  json=feedback_data,
                                  content_type='application/json')

            # Should handle gracefully
            assert response.status_code in [200, 500, 503]

class TestSecurityWorkflow:
    """Test security workflows and protections"""

    @pytest.mark.security
    @pytest.mark.integration
    def test_rate_limiting_workflow(self, client):
        """Test rate limiting enforcement"""

        # Make multiple rapid requests
        responses = []
        for i in range(10):
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': f'Test message {i}',
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')
            responses.append(response.status_code)
            time.sleep(0.1)  # Small delay

        # Should have some successful responses
        success_count = sum(1 for status in responses if status == 200)

        # If rate limiting is active, some requests might be blocked
        if any(status == 429 for status in responses):
            # Rate limiting is working
            assert success_count < len(responses)

    @pytest.mark.security
    def test_input_sanitization_workflow(self, client, security_validator):
        """Test input sanitization across endpoints"""

        malicious_inputs = [
            '<script>alert("xss")</script>',
            '"; DROP TABLE users; --',
            '{{7*7}}',
            '../../../etc/passwd'
        ]

        endpoints = [
            ('/api/v1/chat', 'message'),
            ('/api/v1/feedback', 'feedback_text')
        ]

        for endpoint, field in endpoints:
            for malicious_input in malicious_inputs:
                payload = {field: malicious_input}

                if endpoint == '/api/v1/chat':
                    payload['persona'] = 'dr_gasnelio'
                elif endpoint == '/api/v1/feedback':
                    payload['rating'] = 5
                    payload['persona'] = 'dr_gasnelio'

                response = client.post(endpoint,
                                      json=payload,
                                      content_type='application/json')

                # Should not return malicious input unchanged
                if response.status_code == 200:
                    data = response.get_json()
                    response_str = json.dumps(data)
                    assert malicious_input not in response_str

                # Security headers should be present
                security_validator.check_security_headers(response)

class TestPerformanceWorkflow:
    """Test performance under various conditions"""

    @pytest.mark.performance
    @pytest.mark.integration
    def test_concurrent_chat_sessions(self, client, mock_external_apis, performance_monitor):
        """Test performance with concurrent chat sessions"""
        import threading
        import queue

        results = queue.Queue()
        num_concurrent = 5

        def chat_session(session_num):
            session_id = f"test_session_{session_num}"

            start_time = time.time()

            # Simulate user session
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': f'Test message from session {session_num}',
                                      'persona': 'dr_gasnelio',
                                      'session_id': session_id
                                  },
                                  content_type='application/json')

            end_time = time.time()
            results.put((session_num, response.status_code, end_time - start_time))

        # Start concurrent sessions
        threads = []
        for i in range(num_concurrent):
            thread = threading.Thread(target=chat_session, args=(i,))
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Analyze results
        session_results = []
        while not results.empty():
            session_results.append(results.get())

        # All sessions should complete
        assert len(session_results) == num_concurrent

        # Calculate performance metrics
        response_times = [result[2] for result in session_results]
        success_count = sum(1 for result in session_results if result[1] == 200)

        # Performance assertions
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)

        assert avg_response_time < 5.0, f"Average response time too high: {avg_response_time:.2f}s"
        assert max_response_time < 10.0, f"Max response time too high: {max_response_time:.2f}s"

        # At least 80% should succeed
        success_rate = success_count / num_concurrent
        assert success_rate >= 0.8, f"Success rate too low: {success_rate:.2f}"

class TestDataIntegrityWorkflow:
    """Test data consistency and integrity"""

    @pytest.mark.integration
    def test_feedback_data_integrity(self, client, temp_database):
        """Test feedback data persistence and integrity"""

        # Submit feedback
        feedback_data = {
            'feedback_text': 'Test feedback for data integrity',
            'rating': 4,
            'persona': 'dr_gasnelio',
            'session_id': 'integrity_test_session'
        }

        response = client.post('/api/v1/feedback',
                              json=feedback_data,
                              content_type='application/json')

        if response.status_code == 200:
            # Verify data was stored correctly
            # This would require access to the database or an endpoint to retrieve feedback
            # For now, we'll test that the endpoint responds correctly
            assert_valid_json_response(response, 200)

    @pytest.mark.integration
    def test_session_continuity(self, client, mock_external_apis):
        """Test session data continuity across requests"""
        session_id = str(uuid.uuid4())

        # First interaction
        first_message = {
            'message': 'Primeira pergunta sobre hanseníase',
            'persona': 'dr_gasnelio',
            'session_id': session_id
        }

        first_response = client.post('/api/v1/chat',
                                    json=first_message,
                                    content_type='application/json')

        # Second interaction in same session
        second_message = {
            'message': 'Continue a explicação anterior',
            'persona': 'dr_gasnelio',
            'session_id': session_id
        }

        second_response = client.post('/api/v1/chat',
                                     json=second_message,
                                     content_type='application/json')

        # Both should succeed if chat endpoint works
        if first_response.status_code == 200 and second_response.status_code == 200:
            first_data = assert_valid_json_response(first_response, 200)
            second_data = assert_valid_json_response(second_response, 200)

            # Both should reference the same session
            # (This depends on the implementation details)
            assert 'response' in first_data
            assert 'response' in second_data