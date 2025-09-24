# -*- coding: utf-8 -*-
"""
Comprehensive tests for AI Provider Manager
Tests circuit breakers, failover, async operations, and real API integrations
"""

import pytest
import asyncio
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock, MagicMock

# Import modules under test
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from services.ai.ai_provider_manager import (
    ProviderStatus, CircuitBreakerState, CircuitBreaker, ModelConfig,
    AIProviderManager, generate_ai_response, get_ai_health_status, test_ai_providers
)

class TestCircuitBreaker:
    """Test CircuitBreaker functionality"""

    def test_circuit_breaker_creation(self):
        """Test creating a CircuitBreaker"""
        breaker = CircuitBreaker(
            failure_threshold=3,
            timeout_seconds=30,
            half_open_max_calls=2
        )

        assert breaker.failure_threshold == 3
        assert breaker.timeout_seconds == 30
        assert breaker.half_open_max_calls == 2
        assert breaker.state == CircuitBreakerState.CLOSED
        assert breaker.failure_count == 0
        assert breaker.last_failure_time is None

class TestModelConfig:
    """Test ModelConfig data class"""

    def test_model_config_creation(self):
        """Test creating a ModelConfig"""
        config = ModelConfig(
            name="test-model",
            provider="openrouter",
            endpoint_url="https://api.test.com",
            is_free=True,
            max_tokens=2000,
            timeout_seconds=30,
            priority=1
        )

        assert config.name == "test-model"
        assert config.provider == "openrouter"
        assert config.endpoint_url == "https://api.test.com"
        assert config.is_free is True
        assert config.max_tokens == 2000
        assert config.timeout_seconds == 30
        assert config.priority == 1

class TestAIProviderManager:
    """Test AIProviderManager implementation"""

    def setup_method(self):
        """Setup test environment"""
        # Clear environment variables
        for key in ['OPENROUTER_API_KEY', 'HUGGINGFACE_API_KEY']:
            if key in os.environ:
                del os.environ[key]

    def test_initialization_no_keys(self):
        """Test initialization without API keys"""
        manager = AIProviderManager()

        assert manager.openrouter_key is None
        assert manager.huggingface_key is None
        assert len(manager.models) == 0
        assert len(manager.circuit_breakers) == 0

    def test_initialization_with_openrouter_key(self):
        """Test initialization with OpenRouter API key"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key_or'}):
            manager = AIProviderManager()

            assert manager.openrouter_key == 'test_key_or'
            assert 'llama-3.2-3b' in manager.models
            assert 'kimie-k2' in manager.models
            assert 'openrouter' in manager.circuit_breakers
            assert manager.health_status['openrouter'] == ProviderStatus.UNAVAILABLE

    def test_initialization_with_huggingface_key(self):
        """Test initialization with HuggingFace API key"""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test_key_hf'}):
            manager = AIProviderManager()

            assert manager.huggingface_key == 'test_key_hf'
            assert 'hf-medical' in manager.models
            assert 'huggingface' in manager.circuit_breakers
            assert manager.health_status['huggingface'] == ProviderStatus.UNAVAILABLE

    def test_circuit_breaker_open_logic(self):
        """Test circuit breaker opening logic"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Initially closed
            assert not manager._is_circuit_breaker_open('openrouter')

            # Record failures to trigger opening
            for i in range(5):  # Default threshold is 5
                manager._record_failure('openrouter', 'Test error')

            # Should be open now
            assert manager._is_circuit_breaker_open('openrouter')
            assert manager.circuit_breakers['openrouter'].state == CircuitBreakerState.OPEN

    def test_circuit_breaker_half_open_recovery(self):
        """Test circuit breaker half-open recovery"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Force circuit breaker to open
            breaker = manager.circuit_breakers['openrouter']
            breaker.state = CircuitBreakerState.OPEN
            breaker.last_failure_time = datetime.now() - timedelta(seconds=61)  # Past timeout

            # Should transition to half-open
            is_open = manager._is_circuit_breaker_open('openrouter')
            assert not is_open
            assert breaker.state == CircuitBreakerState.HALF_OPEN

    def test_record_success(self):
        """Test recording successful API calls"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            manager._record_success('openrouter', 1.5)

            assert manager.performance_metrics['openrouter']['successful_calls'] == 1
            assert manager.performance_metrics['openrouter']['total_calls'] == 1
            assert manager.performance_metrics['openrouter']['avg_response_time'] == 1.5
            assert manager.health_status['openrouter'] == ProviderStatus.HEALTHY

    def test_record_failure(self):
        """Test recording failed API calls"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            manager._record_failure('openrouter', 'API Error')

            assert manager.performance_metrics['openrouter']['failed_calls'] == 1
            assert manager.performance_metrics['openrouter']['total_calls'] == 1
            assert manager.circuit_breakers['openrouter'].failure_count == 1

    @pytest.mark.asyncio
    async def test_generate_response_no_models(self):
        """Test response generation with no available models"""
        manager = AIProviderManager()

        messages = [{"role": "user", "content": "Test message"}]
        response, metadata = await manager.generate_response(messages)

        assert "Sistema em modo fallback" in response
        assert metadata['model_used'] == 'fallback'
        assert metadata['success'] is False

    @pytest.mark.asyncio
    @patch('services.ai.ai_provider_manager.aiohttp.ClientSession')
    async def test_call_openrouter_api_success(self, mock_session):
        """Test successful OpenRouter API call"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Mock aiohttp response
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={
                "choices": [{"message": {"content": "Test response"}}]
            })

            mock_session_instance = AsyncMock()
            mock_session_instance.post.return_value.__aenter__.return_value = mock_response
            mock_session.return_value.__aenter__.return_value = mock_session_instance

            model_config = manager.models['llama-3.2-3b']
            messages = [{"role": "user", "content": "Test"}]

            result = await manager._call_openrouter_api(model_config, messages, 0.7, 100)

            assert result == "Test response"
            mock_session_instance.post.assert_called_once()

    @pytest.mark.asyncio
    @patch('services.ai.ai_provider_manager.aiohttp.ClientSession')
    async def test_call_openrouter_api_error(self, mock_session):
        """Test OpenRouter API call with error response"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Mock aiohttp error response
            mock_response = AsyncMock()
            mock_response.status = 400
            mock_response.text = AsyncMock(return_value="Bad Request")

            mock_session_instance = AsyncMock()
            mock_session_instance.post.return_value.__aenter__.return_value = mock_response
            mock_session.return_value.__aenter__.return_value = mock_session_instance

            model_config = manager.models['llama-3.2-3b']
            messages = [{"role": "user", "content": "Test"}]

            with pytest.raises(Exception) as exc_info:
                await manager._call_openrouter_api(model_config, messages, 0.7, 100)

            assert "OpenRouter API error: 400" in str(exc_info.value)

    @pytest.mark.asyncio
    @patch('services.ai.ai_provider_manager.aiohttp.ClientSession')
    async def test_call_openrouter_api_timeout(self, mock_session):
        """Test OpenRouter API call timeout"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Mock timeout
            mock_session_instance = AsyncMock()
            mock_session_instance.post.side_effect = asyncio.TimeoutError()
            mock_session.return_value.__aenter__.return_value = mock_session_instance

            model_config = manager.models['llama-3.2-3b']
            messages = [{"role": "user", "content": "Test"}]

            with pytest.raises(Exception) as exc_info:
                await manager._call_openrouter_api(model_config, messages, 0.7, 100)

            assert "timeout" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    @patch('services.ai.ai_provider_manager.aiohttp.ClientSession')
    async def test_call_huggingface_api_success(self, mock_session):
        """Test successful HuggingFace API call"""
        with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Mock aiohttp response
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value=[
                {"generated_text": "Generated response"}
            ])

            mock_session_instance = AsyncMock()
            mock_session_instance.post.return_value.__aenter__.return_value = mock_response
            mock_session.return_value.__aenter__.return_value = mock_session_instance

            model_config = manager.models['hf-medical']
            messages = [{"role": "user", "content": "Test"}]

            result = await manager._call_huggingface_api(model_config, messages, 0.7, 100)

            assert result == "Generated response"

    @pytest.mark.asyncio
    async def test_generate_response_with_fallback(self):
        """Test response generation falling back to internal responses"""
        manager = AIProviderManager()

        messages = [{"role": "user", "content": "What is the dose of rifampicina?"}]
        response, metadata = await manager.generate_response(messages)

        assert "rifampicina" in response.lower()
        assert metadata['model_used'] == 'fallback'
        assert metadata['fallback_reason'] == 'no_models_available'

    def test_generate_fallback_response_medical(self):
        """Test fallback response generation for medical queries"""
        manager = AIProviderManager()

        # Test dosage query
        messages = [{"role": "user", "content": "What is the dose?"}]
        response = manager._generate_fallback_response(messages)
        assert "dosagem" in response

        # Test medication query
        messages = [{"role": "user", "content": "Tell me about medicamento"}]
        response = manager._generate_fallback_response(messages)
        assert "medicamento" in response

        # Test general query
        messages = [{"role": "user", "content": "Hello there"}]
        response = manager._generate_fallback_response(messages)
        assert "Sistema temporariamente em modo fallback" in response

    def test_get_health_status(self):
        """Test health status reporting"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            health = manager.get_health_status()

            assert 'timestamp' in health
            assert 'overall_status' in health
            assert 'providers' in health
            assert 'configuration' in health
            assert 'openrouter' in health['providers']
            assert health['providers']['openrouter']['has_api_key'] is True

    def test_calculate_overall_status(self):
        """Test overall status calculation"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Initially all unavailable
            assert manager._calculate_overall_status() == 'unhealthy'

            # Set one healthy
            manager.health_status['openrouter'] = ProviderStatus.HEALTHY
            assert manager._calculate_overall_status() == 'healthy'

            # Add degraded provider
            with patch.dict(os.environ, {'HUGGINGFACE_API_KEY': 'test_key2'}):
                manager._initialize_models()
                manager.health_status['huggingface'] = ProviderStatus.DEGRADED
                assert manager._calculate_overall_status() == 'degraded'

    @pytest.mark.asyncio
    @patch('services.ai.ai_provider_manager.aiohttp.ClientSession')
    async def test_test_all_providers(self, mock_session):
        """Test testing all providers"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Mock successful response
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={
                "choices": [{"message": {"content": "Test successful"}}]
            })

            mock_session_instance = AsyncMock()
            mock_session_instance.post.return_value.__aenter__.return_value = mock_response
            mock_session.return_value.__aenter__.return_value = mock_session_instance

            results = await manager.test_all_providers()

            assert 'timestamp' in results
            assert 'test_results' in results
            assert 'overall_test_status' in results
            assert len(results['test_results']) > 0

    def test_has_api_key(self):
        """Test API key checking"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            assert manager._has_api_key('openrouter') is True
            assert manager._has_api_key('huggingface') is False
            assert manager._has_api_key('unknown') is False

class TestConvenienceFunctions:
    """Test convenience functions"""

    @pytest.mark.asyncio
    async def test_generate_ai_response(self):
        """Test convenience function for generating AI response"""
        with patch('services.ai.ai_provider_manager.ai_provider_manager') as mock_manager:
            mock_manager.generate_response = AsyncMock(return_value=("Test response", {"success": True}))

            messages = [{"role": "user", "content": "Test"}]
            response, metadata = await generate_ai_response(messages)

            assert response == "Test response"
            assert metadata["success"] is True
            mock_manager.generate_response.assert_called_once_with(messages, None, 0.7, None)

    def test_get_ai_health_status(self):
        """Test convenience function for getting health status"""
        with patch('services.ai.ai_provider_manager.ai_provider_manager') as mock_manager:
            mock_manager.get_health_status.return_value = {"status": "healthy"}

            health = get_ai_health_status()

            assert health["status"] == "healthy"
            mock_manager.get_health_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_test_ai_providers(self):
        """Test convenience function for testing providers"""
        with patch('services.ai.ai_provider_manager.ai_provider_manager') as mock_manager:
            mock_manager.test_all_providers = AsyncMock(return_value={"test": "results"})

            results = await test_ai_providers()

            assert results["test"] == "results"
            mock_manager.test_all_providers.assert_called_once()

class TestIntegrationScenarios:
    """Integration test scenarios"""

    @pytest.mark.asyncio
    async def test_circuit_breaker_recovery_flow(self):
        """Test complete circuit breaker recovery flow"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Force circuit breaker open
            for i in range(5):
                manager._record_failure('openrouter', 'Connection error')

            assert manager.circuit_breakers['openrouter'].state == CircuitBreakerState.OPEN

            # Simulate time passing
            manager.circuit_breakers['openrouter'].last_failure_time = datetime.now() - timedelta(seconds=61)

            # Should transition to half-open
            is_open = manager._is_circuit_breaker_open('openrouter')
            assert not is_open
            assert manager.circuit_breakers['openrouter'].state == CircuitBreakerState.HALF_OPEN

            # Record successful calls to close circuit breaker
            for i in range(3):  # half_open_max_calls
                manager._record_success('openrouter', 1.0)

            assert manager.circuit_breakers['openrouter'].state == CircuitBreakerState.CLOSED

    @pytest.mark.asyncio
    async def test_failover_between_providers(self):
        """Test failover between multiple providers"""
        with patch.dict(os.environ, {
            'OPENROUTER_API_KEY': 'test_key_or',
            'HUGGINGFACE_API_KEY': 'test_key_hf'
        }):
            manager = AIProviderManager()

            # Make OpenRouter circuit breaker open
            manager.circuit_breakers['openrouter'].state = CircuitBreakerState.OPEN

            with patch.object(manager, '_call_model_api') as mock_call:
                mock_call.side_effect = [
                    Exception("OpenRouter failed"),  # First provider fails
                    "HuggingFace response"  # Second provider succeeds
                ]

                messages = [{"role": "user", "content": "Test"}]
                response, metadata = await manager.generate_response(messages)

                assert response == "HuggingFace response"
                assert metadata['success'] is True

    def test_performance_metrics_tracking(self):
        """Test performance metrics are properly tracked"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Record various operations
            manager._record_success('openrouter', 1.5)
            manager._record_success('openrouter', 2.0)
            manager._record_failure('openrouter', 'Timeout')

            metrics = manager.performance_metrics['openrouter']

            assert metrics['total_calls'] == 3
            assert metrics['successful_calls'] == 2
            assert metrics['failed_calls'] == 1
            assert metrics['avg_response_time'] == 1.75  # (1.5 + 2.0) / 2

    def test_health_status_updates(self):
        """Test health status updates based on performance"""
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test_key'}):
            manager = AIProviderManager()

            # Initially unavailable
            assert manager.health_status['openrouter'] == ProviderStatus.UNAVAILABLE

            # Record success -> healthy
            manager._record_success('openrouter', 1.0)
            assert manager.health_status['openrouter'] == ProviderStatus.HEALTHY

            # Record many failures -> degraded/unhealthy
            for i in range(8):  # 8 failures out of 9 total = 88% failure rate
                manager._record_failure('openrouter', 'Error')

            assert manager.health_status['openrouter'] == ProviderStatus.UNHEALTHY

if __name__ == "__main__":
    pytest.main([__file__, "-v"])