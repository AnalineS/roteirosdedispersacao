# -*- coding: utf-8 -*-
"""
AI Provider Manager - Sistema robusto de gerenciamento de provedores de IA
Configuração via GitHub Secrets/Environment Variables
"""

import os
import time
import logging
import asyncio
from typing import Dict, List, Optional, Union, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import requests
import aiohttp
import json

logger = logging.getLogger(__name__)

class ProviderStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"
    UNAVAILABLE = "unavailable"

class CircuitBreakerState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, blocking requests
    HALF_OPEN = "half_open"  # Testing recovery

@dataclass
class CircuitBreaker:
    """Circuit Breaker para provedores de IA"""
    failure_threshold: int = 5
    timeout_seconds: int = 60
    half_open_max_calls: int = 3
    
    # State tracking
    state: CircuitBreakerState = CircuitBreakerState.CLOSED
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    half_open_calls: int = 0

@dataclass 
class ModelConfig:
    """Configuração de modelo de IA"""
    name: str
    provider: str
    endpoint_url: str
    is_free: bool = True
    max_tokens: int = 1000
    timeout_seconds: int = 15
    priority: int = 1

class AIProviderManager:
    """
    Gerenciador robusto de provedores de IA com configuração via GitHub
    """
    
    def __init__(self):
        self.models: Dict[str, ModelConfig] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.health_status: Dict[str, ProviderStatus] = {}
        self.performance_metrics: Dict[str, Dict] = {}
        
        # Configurações do GitHub Secrets/Environment
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')
        self.huggingface_key = os.getenv('HUGGINGFACE_API_KEY')
        
        # Configurações de timeout e retry
        self.max_retries = int(os.getenv('AI_MAX_RETRIES', 3))
        self.base_timeout = int(os.getenv('AI_TIMEOUT_SECONDS', 15))
        self.circuit_breaker_enabled = os.getenv('AI_CIRCUIT_BREAKER_ENABLED', 'true').lower() == 'true'
        
        self._initialize_models()
        
        logger.info("AI Provider Manager inicializado com GitHub config")
    
    def _initialize_models(self):
        """Inicializa modelos baseado nas chaves disponíveis"""
        
        # OpenRouter Models (se chave disponível)
        if self.openrouter_key:
            self.models.update({
                'llama-3.2-3b': ModelConfig(
                    name="x-ai/grok-4-fast:free",  # Grok 4 Fast Free para Dr. Gasnelio
                    provider='openrouter',
                    endpoint_url="https://openrouter.ai/api/v1/chat/completions",
                    priority=1
                ),
                'kimie-k2': ModelConfig(
                    name="moonshotai/kimi-k2:free",  # Kimi K2 Free correto para Gá
                    provider='openrouter',
                    endpoint_url="https://openrouter.ai/api/v1/chat/completions",
                    priority=2
                )
            })
            self.circuit_breakers['openrouter'] = CircuitBreaker()
            self.health_status['openrouter'] = ProviderStatus.UNAVAILABLE
        
        # HuggingFace Models (se chave disponível)
        if self.huggingface_key:
            self.models.update({
                'hf-medical': ModelConfig(
                    name="microsoft/DialoGPT-medium",
                    provider='huggingface',
                    endpoint_url="https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
                    priority=3
                )
            })
            self.circuit_breakers['huggingface'] = CircuitBreaker()
            self.health_status['huggingface'] = ProviderStatus.UNAVAILABLE
            
        if not self.models:
            logger.warning("[WARNING] Nenhuma API key configurada - apenas fallbacks disponíveis")
        else:
            logger.info(f"[TARGET] {len(self.models)} modelos configurados")
    
    def _is_circuit_breaker_open(self, provider: str) -> bool:
        """Verifica se circuit breaker está aberto"""
        if not self.circuit_breaker_enabled or provider not in self.circuit_breakers:
            return False
            
        breaker = self.circuit_breakers[provider]
        
        if breaker.state == CircuitBreakerState.OPEN:
            # Tentar half-open após timeout
            if (breaker.last_failure_time and 
                datetime.now() - breaker.last_failure_time > timedelta(seconds=breaker.timeout_seconds)):
                breaker.state = CircuitBreakerState.HALF_OPEN
                breaker.half_open_calls = 0
                logger.info(f"🔄 Circuit breaker {provider}: OPEN -> HALF_OPEN")
                return False
            return True
            
        return False
    
    def _record_success(self, provider: str, response_time: float):
        """Registra sucesso de chamada"""
        
        # Circuit breaker recovery
        if provider in self.circuit_breakers:
            breaker = self.circuit_breakers[provider]
            if breaker.state == CircuitBreakerState.HALF_OPEN:
                breaker.half_open_calls += 1
                if breaker.half_open_calls >= breaker.half_open_max_calls:
                    breaker.state = CircuitBreakerState.CLOSED
                    breaker.failure_count = 0
                    logger.info(f"[OK] Circuit breaker {provider}: HALF_OPEN -> CLOSED")
            elif breaker.state == CircuitBreakerState.CLOSED:
                # Gradual recovery
                breaker.failure_count = max(0, breaker.failure_count - 1)
                
        # Métricas
        if provider not in self.performance_metrics:
            self.performance_metrics[provider] = {
                'total_calls': 0,
                'successful_calls': 0,
                'failed_calls': 0,
                'total_response_time': 0.0,
                'last_success': None,
                'avg_response_time': 0.0
            }
            
        metrics = self.performance_metrics[provider]
        metrics['total_calls'] += 1
        metrics['successful_calls'] += 1
        metrics['total_response_time'] += response_time
        metrics['avg_response_time'] = metrics['total_response_time'] / metrics['successful_calls']
        metrics['last_success'] = datetime.now()
        
        # Health status
        self.health_status[provider] = ProviderStatus.HEALTHY
        
        logger.debug(f"[OK] {provider} success - {response_time:.2f}s")
    
    def _record_failure(self, provider: str, error: str):
        """Registra falha de chamada"""
        
        # Circuit breaker
        if provider in self.circuit_breakers:
            breaker = self.circuit_breakers[provider]
            breaker.failure_count += 1
            breaker.last_failure_time = datetime.now()
            
            if breaker.failure_count >= breaker.failure_threshold:
                if breaker.state != CircuitBreakerState.OPEN:
                    breaker.state = CircuitBreakerState.OPEN
                    logger.warning(f"[WARNING] Circuit breaker {provider}: -> OPEN")
                    
        # Métricas
        if provider not in self.performance_metrics:
            self.performance_metrics[provider] = {
                'total_calls': 0,
                'successful_calls': 0,
                'failed_calls': 0,
                'total_response_time': 0.0,
                'last_failure': None
            }
            
        metrics = self.performance_metrics[provider]
        metrics['total_calls'] += 1
        metrics['failed_calls'] += 1
        metrics['last_failure'] = datetime.now()
        
        # Health status baseado em taxa de falhas
        failure_rate = metrics['failed_calls'] / metrics['total_calls']
        if failure_rate > 0.8:
            self.health_status[provider] = ProviderStatus.UNHEALTHY
        elif failure_rate > 0.4:
            self.health_status[provider] = ProviderStatus.DEGRADED
        else:
            self.health_status[provider] = ProviderStatus.HEALTHY
            
        logger.warning(f"[ERROR] {provider} failure: {error}")
    
    async def generate_response(
        self, 
        messages: List[Dict],
        model_preference: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Tuple[Optional[str], Dict]:
        """
        Gera resposta usando melhor provedor disponível
        
        Returns:
            (response_text, metadata)
        """
        
        # Verificar modelos disponíveis
        available_models = [
            (name, config) for name, config in self.models.items()
            if not self._is_circuit_breaker_open(config.provider)
        ]
        
        if not available_models:
            logger.warning("[WARNING] Nenhum modelo disponível - usando fallback")
            return self._generate_fallback_response(messages), {
                'model_used': 'fallback',
                'provider': 'internal',
                'success': False,
                'fallback_reason': 'no_models_available'
            }
        
        # Ordenar por prioridade (preferir modelo especificado)
        if model_preference and model_preference in self.models:
            available_models.sort(key=lambda x: 0 if x[0] == model_preference else x[1].priority)
        else:
            available_models.sort(key=lambda x: x[1].priority)
        
        # Tentar cada modelo
        for model_name, model_config in available_models:
            try:
                start_time = time.time()
                
                response_text = await self._call_model_api(
                    model_config, messages, temperature, max_tokens
                )
                
                response_time = time.time() - start_time
                
                if response_text:
                    self._record_success(model_config.provider, response_time)
                    
                    return response_text, {
                        'model_used': model_name,
                        'provider': model_config.provider,
                        'response_time': response_time,
                        'success': True
                    }
                    
            except Exception as e:
                self._record_failure(model_config.provider, str(e))
                logger.warning(f"[WARNING] {model_name} falhou: {e}")
                continue
        
        # Fallback se todos falharam
        logger.warning("[WARNING] Todos os modelos falharam - usando fallback")
        return self._generate_fallback_response(messages), {
            'model_used': 'fallback',
            'provider': 'internal',
            'success': False,
            'fallback_reason': 'all_models_failed'
        }
    
    async def _call_model_api(
        self,
        model_config: ModelConfig,
        messages: List[Dict],
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[str]:
        """Chama API específica do modelo"""
        
        if model_config.provider == 'openrouter':
            return await self._call_openrouter_api(model_config, messages, temperature, max_tokens)
        elif model_config.provider == 'huggingface':
            return await self._call_huggingface_api(model_config, messages, temperature, max_tokens)
        else:
            raise ValueError(f"Provedor não suportado: {model_config.provider}")
    
    async def _call_openrouter_api(
        self,
        model_config: ModelConfig,
        messages: List[Dict],
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[str]:
        """Chama OpenRouter API usando aiohttp para async real"""

        if not self.openrouter_key:
            raise ValueError("OpenRouter API key não configurada no GitHub")

        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/roteiro-dispensacao",
            "X-Title": "Roteiro de Dispensação PQT-U"
        }

        data = {
            "model": model_config.name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens or model_config.max_tokens
        }

        timeout = aiohttp.ClientTimeout(total=model_config.timeout_seconds)

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    model_config.endpoint_url,
                    headers=headers,
                    json=data
                ) as response:

                    if response.status == 200:
                        result = await response.json()
                        return result["choices"][0]["message"]["content"]
                    else:
                        error_text = await response.text()
                        raise Exception(f"OpenRouter API error: {response.status} - {error_text}")

        except asyncio.TimeoutError:
            raise Exception(f"OpenRouter API timeout after {model_config.timeout_seconds}s")
        except aiohttp.ClientError as e:
            raise Exception(f"OpenRouter API connection error: {e}")
    
    async def _call_huggingface_api(
        self,
        model_config: ModelConfig,
        messages: List[Dict],
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[str]:
        """Chama HuggingFace API usando aiohttp para async real"""

        if not self.huggingface_key:
            raise ValueError("HuggingFace API key não configurada no GitHub")

        headers = {
            "Authorization": f"Bearer {self.huggingface_key}",
            "Content-Type": "application/json"
        }

        # Converter mensagens para texto
        text_input = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])

        data = {
            "inputs": text_input,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens or model_config.max_tokens
            }
        }

        timeout = aiohttp.ClientTimeout(total=model_config.timeout_seconds)

        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    model_config.endpoint_url,
                    headers=headers,
                    json=data
                ) as response:

                    if response.status == 200:
                        result = await response.json()
                        if isinstance(result, list) and result:
                            return result[0].get("generated_text", "")
                        return str(result)
                    else:
                        error_text = await response.text()
                        raise Exception(f"HuggingFace API error: {response.status} - {error_text}")

        except asyncio.TimeoutError:
            raise Exception(f"HuggingFace API timeout after {model_config.timeout_seconds}s")
        except aiohttp.ClientError as e:
            raise Exception(f"HuggingFace API connection error: {e}")
    
    def _generate_fallback_response(self, messages: List[Dict]) -> str:
        """Gera resposta fallback quando APIs falham"""
        
        if not messages:
            return "Olá! Como posso ajudá-lo com informações sobre hanseníase?"
        
        last_message = messages[-1]["content"].lower()
        
        # Respostas baseadas em keywords médicas
        medical_responses = {
            "dose": "Para informações sobre dosagem de medicamentos, consulte sempre um profissional de saúde ou a prescrição médica.",
            "medicamento": "Consulte um farmacêutico ou médico para orientações específicas sobre medicamentos.",
            "tratamento": "O tratamento da hanseníase deve seguir o protocolo PQT-U conforme orientação médica.",
            "efeito": "Para informações sobre efeitos colaterais, consulte a bula do medicamento ou um profissional de saúde.",
            "rifampicina": "A rifampicina é parte do esquema PQT-U. A dosagem deve seguir prescrição médica.",
            "dapsona": "A dapsona é um dos medicamentos do PQT-U. Consulte orientação médica para uso correto.",
            "clofazimina": "A clofazimina é componente do PQT-U. Siga sempre a prescrição médica."
        }
        
        for keyword, response in medical_responses.items():
            if keyword in last_message:
                return f"🔄 Sistema em modo fallback: {response}\n\nPara respostas mais detalhadas, aguarde a normalização do sistema."
        
        return "🔄 Sistema temporariamente em modo fallback. Para informações médicas confiáveis, consulte sempre um profissional de saúde qualificado."
    
    def get_health_status(self) -> Dict:
        """Retorna status de health completo"""
        
        return {
            'timestamp': datetime.now().isoformat(),
            'overall_status': self._calculate_overall_status(),
            'providers': {
                provider: {
                    'status': status.value,
                    'circuit_breaker': self.circuit_breakers.get(provider, CircuitBreaker()).state.value,
                    'has_api_key': self._has_api_key(provider),
                    'metrics': self.performance_metrics.get(provider, {})
                }
                for provider, status in self.health_status.items()
            },
            'configuration': {
                'models_available': len(self.models),
                'circuit_breaker_enabled': self.circuit_breaker_enabled,
                'max_retries': self.max_retries,
                'timeout_seconds': self.base_timeout
            }
        }
    
    def _has_api_key(self, provider: str) -> bool:
        """Verifica se tem API key para o provedor"""
        if provider == 'openrouter':
            return bool(self.openrouter_key)
        elif provider == 'huggingface':
            return bool(self.huggingface_key)
        return False
    
    def _calculate_overall_status(self) -> str:
        """Calcula status geral do sistema"""
        if not self.health_status:
            return 'no_providers'
        
        healthy = sum(1 for status in self.health_status.values() if status == ProviderStatus.HEALTHY)
        total = len(self.health_status)
        
        if healthy == 0:
            return 'unhealthy'
        elif healthy == total:
            return 'healthy'
        else:
            return 'degraded'
    
    async def test_all_providers(self) -> Dict:
        """Testa conectividade com todos os provedores"""
        
        test_messages = [
            {"role": "system", "content": "Responda brevemente."},
            {"role": "user", "content": "Teste"}
        ]
        
        results = {}
        
        for model_name, model_config in self.models.items():
            try:
                start_time = time.time()
                response = await self._call_model_api(model_config, test_messages, 0.1, 50)
                test_time = time.time() - start_time
                
                results[model_name] = {
                    'status': 'success',
                    'response_time': test_time,
                    'response_preview': response[:100] if response else 'empty'
                }
                
                self._record_success(model_config.provider, test_time)
                
            except Exception as e:
                results[model_name] = {
                    'status': 'failed',
                    'error': str(e)
                }
                
                self._record_failure(model_config.provider, str(e))
        
        return {
            'timestamp': datetime.now().isoformat(),
            'test_results': results,
            'overall_test_status': 'passed' if any(r.get('status') == 'success' for r in results.values()) else 'failed'
        }

# Instância global
ai_provider_manager = AIProviderManager()

# Funções de conveniência - TODAS ASSÍNCRONAS

async def generate_ai_response(
    messages: List[Dict],
    model_preference: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None
) -> Tuple[Optional[str], Dict]:
    """Função principal para gerar resposta de IA (assíncrona)"""
    return await ai_provider_manager.generate_response(
        messages, model_preference, temperature, max_tokens
    )

def get_ai_health_status() -> Dict:
    """Função síncrona para obter status de health dos provedores"""
    return ai_provider_manager.get_health_status()

async def test_ai_providers() -> Dict:
    """Função assíncrona para testar todos os provedores"""
    return await ai_provider_manager.test_all_providers()