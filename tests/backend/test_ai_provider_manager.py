# -*- coding: utf-8 -*-
"""
Testes para AI Provider Manager
"""

import pytest
import asyncio
import os
from unittest.mock import patch, Mock
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'apps', 'backend'))

from services.ai_provider_manager import AIProviderManager, generate_ai_response, get_ai_health_status

class TestAIProviderManager:
    
    def setup_method(self):
        """Setup para cada teste"""
        self.manager = AIProviderManager()
    
    def test_initialization_without_keys(self):
        """Testa inicialização sem API keys"""
        assert len(self.manager.models) == 0
        assert self.manager.openrouter_key is None
        assert self.manager.huggingface_key is None
        assert self.manager.get_health_status()["overall_status"] == "no_providers"
    
    @patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"})
    def test_initialization_with_openrouter(self):
        """Testa inicialização com chave OpenRouter"""
        manager = AIProviderManager()
        assert len(manager.models) > 0
        assert manager.openrouter_key == "test-key"
        assert "llama-3.2-3b" in manager.models
        assert "kimie-k2" in manager.models
    
    @patch.dict(os.environ, {"HUGGINGFACE_API_KEY": "test-hf-key"})
    def test_initialization_with_huggingface(self):
        """Testa inicialização com chave HuggingFace"""
        manager = AIProviderManager()
        assert manager.huggingface_key == "test-hf-key"
        assert "hf-medical" in manager.models
    
    def test_circuit_breaker_open_close(self):
        """Testa funcionamento do circuit breaker"""
        provider = "test-provider"
        self.manager.circuit_breakers[provider] = self.manager.CircuitBreaker()
        
        # Inicialmente fechado
        assert not self.manager._is_circuit_breaker_open(provider)
        
        # Registrar falhas até abrir
        for _ in range(6):  # Acima do threshold (5)
            self.manager._record_failure(provider, "test error")
        
        # Circuit breaker deve estar aberto
        assert self.manager._is_circuit_breaker_open(provider)
    
    @pytest.mark.asyncio
    async def test_fallback_response_without_providers(self):
        """Testa resposta fallback quando não há provedores"""
        messages = [{"role": "user", "content": "teste"}]
        
        response, metadata = await self.manager.generate_response(messages)
        
        assert response is not None
        assert "fallback" in metadata["model_used"]
        assert metadata["success"] is False
    
    def test_health_status_structure(self):
        """Testa estrutura do status de health"""
        health = self.manager.get_health_status()
        
        required_keys = ["timestamp", "overall_status", "providers", "configuration"]
        for key in required_keys:
            assert key in health
        
        assert "models_available" in health["configuration"]
        assert "circuit_breaker_enabled" in health["configuration"]
    
    @pytest.mark.asyncio
    @patch('requests.post')
    @patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"})
    async def test_openrouter_api_call_success(self, mock_post):
        """Testa chamada bem-sucedida para OpenRouter API"""
        # Mock da resposta bem-sucedida
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Resposta de teste"}}]
        }
        mock_post.return_value = mock_response
        
        manager = AIProviderManager()
        messages = [{"role": "user", "content": "teste"}]
        
        response, metadata = await manager.generate_response(messages)
        
        assert response == "Resposta de teste"
        assert metadata["success"] is True
        assert "llama" in metadata["model_used"] or "kimie" in metadata["model_used"]
    
    @pytest.mark.asyncio
    @patch('requests.post')
    @patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"})
    async def test_openrouter_api_call_failure_with_fallback(self, mock_post):
        """Testa falha da API com fallback para resposta interna"""
        # Mock de falha na API
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response
        
        manager = AIProviderManager()
        messages = [{"role": "user", "content": "teste de falha"}]
        
        response, metadata = await manager.generate_response(messages)
        
        assert response is not None
        assert "fallback" in metadata["model_used"]
        assert metadata["success"] is False
        assert "all_models_failed" in metadata["fallback_reason"]

def test_global_functions():
    """Testa funções globais de conveniência"""
    
    # Test health status function
    health = get_ai_health_status()
    assert "overall_status" in health
    
    # Test async response function
    async def test_generate():
        messages = [{"role": "user", "content": "test"}]
        response, metadata = await generate_ai_response(messages)
        assert response is not None
        return True
    
    # Run async test
    result = asyncio.run(test_generate())
    assert result is True

if __name__ == "__main__":
    # Executar testes básicos
    print("Executando testes do AI Provider Manager...")
    
    # Teste 1: Inicialização
    print("Teste 1: Inicialização sem API keys")
    manager = AIProviderManager()
    assert manager.get_health_status()["overall_status"] == "no_providers"
    print("✓ Passou")
    
    # Teste 2: Health status
    print("Teste 2: Health status")
    health = get_ai_health_status()
    assert "overall_status" in health
    print("✓ Passou")
    
    # Teste 3: Fallback response
    print("Teste 3: Fallback response")
    async def test_fallback():
        messages = [{"role": "user", "content": "teste fallback"}]
        response, metadata = await generate_ai_response(messages)
        assert response is not None
        assert metadata["success"] is False
        return True
    
    result = asyncio.run(test_fallback())
    assert result is True
    print("✓ Passou")
    
    print("\n✅ Todos os testes passaram!")
    print(f"📊 Status do sistema: {get_ai_health_status()['overall_status']}")