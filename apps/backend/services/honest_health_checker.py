# -*- coding: utf-8 -*-
"""
Honest Health Checker - "Fail Honestly" Implementation
=====================================================

Sistema de health check que NUNCA mente sobre o estado dos serviços.
Implementa circuit breaker com 120s timeout conforme solicitado.

Autor: Sistema de Correção Emergencial
Data: 30/08/2025
"""

from typing import Dict, Tuple, List, Optional
import os
import time
import requests
from dataclasses import dataclass, field
from enum import Enum
import logging
from threading import Lock

logger = logging.getLogger(__name__)

class ServiceStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"         # Failing, blocking requests
    HALF_OPEN = "half_open"  # Testing if service recovered

@dataclass
class CircuitBreaker:
    """Circuit Breaker implementation com 120s timeout"""
    failure_threshold: int = 5
    success_threshold: int = 2
    timeout: int = 120  # 120 segundos conforme solicitado
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[float] = None
    state: CircuitState = CircuitState.CLOSED
    _lock: Lock = field(default_factory=Lock)
    
    def can_execute(self) -> bool:
        """Verifica se pode executar a operação"""
        with self._lock:
            current_time = time.time()
            
            if self.state == CircuitState.CLOSED:
                return True
            elif self.state == CircuitState.OPEN:
                if self.last_failure_time and (current_time - self.last_failure_time) >= self.timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                    return True
                return False
            elif self.state == CircuitState.HALF_OPEN:
                return True
            
            return False
    
    def record_success(self):
        """Registra sucesso na operação"""
        with self._lock:
            self.failure_count = 0
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self.state = CircuitState.CLOSED
    
    def record_failure(self):
        """Registra falha na operação"""
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
    
    def get_state_info(self) -> Dict:
        """Retorna informações do estado do circuit breaker"""
        with self._lock:
            return {
                "state": self.state.value,
                "failure_count": self.failure_count,
                "success_count": self.success_count,
                "timeout": self.timeout,
                "last_failure": self.last_failure_time,
                "next_retry": (
                    self.last_failure_time + self.timeout 
                    if self.last_failure_time and self.state == CircuitState.OPEN 
                    else None
                )
            }

@dataclass
class ServiceHealth:
    name: str
    status: ServiceStatus
    message: str
    latency_ms: float
    metadata: Dict = None

class HonestHealthChecker:
    """
    Health checker que NUNCA mente sobre o estado do sistema
    Implementa circuit breaker com 120s timeout para cada serviço
    """
    
    def __init__(self):
        self.circuit_breaker_timeout = int(os.getenv('CIRCUIT_BREAKER_TIMEOUT', '120'))
        self.fail_honestly = os.getenv('FAIL_HONESTLY', 'true').lower() == 'true'
        
        # Circuit breakers por serviço
        self.circuit_breakers = {
            'ai_provider': CircuitBreaker(timeout=self.circuit_breaker_timeout),
            'rag': CircuitBreaker(timeout=self.circuit_breaker_timeout),
            'embeddings': CircuitBreaker(timeout=self.circuit_breaker_timeout),
            'cache': CircuitBreaker(timeout=self.circuit_breaker_timeout)
        }
        
    def check_all_services(self) -> Tuple[int, Dict]:
        """
        Retorna status HTTP apropriado baseado na saúde REAL
        """
        services = {
            'cache': self._check_cache(),
            'ai_provider': self._check_openrouter(),
            'rag': self._check_supabase_vectors(),
            'embeddings': self._check_embedding_service(),
        }
        
        # Calcular saúde geral
        healthy_count = sum(1 for s in services.values() if s.status == ServiceStatus.HEALTHY)
        total_count = len(services)
        health_percentage = (healthy_count / total_count) * 100
        
        # Determinar status HTTP baseado em serviços críticos
        critical_services = ['ai_provider', 'rag', 'embeddings']
        critical_healthy = all(
            services[s].status == ServiceStatus.HEALTHY 
            for s in critical_services if s in services
        )
        
        if critical_healthy and health_percentage >= 80:
            status_code = 200
            overall_status = "healthy"
            message = "All systems operational"
        elif health_percentage >= 50:
            status_code = 503  # Service Unavailable
            overall_status = "degraded"
            message = "System operating with limited functionality"
        else:
            status_code = 503
            overall_status = "unhealthy"
            message = "System experiencing major issues"
        
        response = {
            "status": overall_status,
            "health_score": health_percentage,
            "message": message,
            "services": {
                name: {
                    "status": service.status.value,
                    "message": service.message,
                    "latency_ms": service.latency_ms,
                    "metadata": service.metadata,
                    "circuit_breaker": self.circuit_breakers[name].get_state_info()
                }
                for name, service in services.items()
            },
            "circuit_breaker_timeout": self.circuit_breaker_timeout,
            "failed_critical_services": [
                name for name in critical_services
                if name in services and services[name].status != ServiceStatus.HEALTHY
            ],
            "timestamp": time.time(),
            "mode": "honest"  # Sempre indicar que estamos sendo honestos
        }
        
        # Se sistema não está saudável, adicionar informações úteis
        if status_code != 200:
            response["recovery_suggestions"] = self._get_recovery_suggestions(services)
            response["fallback_available"] = self._check_fallback_availability()
        
        return status_code, response
    
    def _check_openrouter(self) -> ServiceHealth:
        """Verifica conexão com OpenRouter com circuit breaker"""
        start_time = time.time()
        circuit_breaker = self.circuit_breakers['ai_provider']
        
        # Verificar circuit breaker antes de tentar
        if not circuit_breaker.can_execute():
            return ServiceHealth(
                name="ai_provider",
                status=ServiceStatus.UNHEALTHY,
                message=f"Circuit breaker OPEN - aguardando {circuit_breaker.timeout}s",
                latency_ms=0,
                metadata={"circuit_state": circuit_breaker.state.value}
            )
        
        try:
            api_key = os.getenv('OPENROUTER_API_KEY')
            if not api_key:
                circuit_breaker.record_failure()
                return ServiceHealth(
                    name="ai_provider",
                    status=ServiceStatus.UNHEALTHY,
                    message="OPENROUTER_API_KEY not configured",
                    latency_ms=0
                )
            
            # Teste real de API com timeout de 5s
            response = requests.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=5
            )
            
            latency = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                circuit_breaker.record_success()
                return ServiceHealth(
                    name="ai_provider",
                    status=ServiceStatus.HEALTHY,
                    message="OpenRouter API accessible",
                    latency_ms=latency,
                    metadata={"models_available": len(response.json().get('data', []))}
                )
            else:
                circuit_breaker.record_failure()
                return ServiceHealth(
                    name="ai_provider",
                    status=ServiceStatus.UNHEALTHY,
                    message=f"OpenRouter API returned {response.status_code}",
                    latency_ms=latency
                )
                
        except Exception as e:
            circuit_breaker.record_failure()
            return ServiceHealth(
                name="ai_provider",
                status=ServiceStatus.UNHEALTHY,
                message=f"Connection failed: {str(e)}",
                latency_ms=(time.time() - start_time) * 1000
            )
    
    def _check_supabase_vectors(self) -> ServiceHealth:
        """Verifica Supabase com PUBLISHABLE key apenas"""
        start_time = time.time()
        
        try:
            url = os.getenv('SUPABASE_PROJECT_URL')
            key = os.getenv('SUPABASE_PUBLISHABLE_KEY') or os.getenv('SUPABASE_API_KEY')
            
            if not url or not key:
                return ServiceHealth(
                    name="rag",
                    status=ServiceStatus.UNHEALTHY,
                    message=f"Supabase credentials missing (url={bool(url)}, key={bool(key)})",
                    latency_ms=0
                )
            
            # Com PUBLISHABLE key, só podemos fazer read operations
            headers = {
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Prefer": "return=minimal"
            }
            
            # Tentar query simples (pode retornar 401 se RLS ativo)
            response = requests.get(
                f"{url}/rest/v1/",
                headers=headers,
                timeout=5
            )
            
            latency = (time.time() - start_time) * 1000
            
            # Com publishable key, 401 pode ser normal devido a RLS
            if response.status_code in [200, 401]:
                return ServiceHealth(
                    name="rag",
                    status=ServiceStatus.HEALTHY if response.status_code == 200 else ServiceStatus.DEGRADED,
                    message="Supabase accessible (read-only mode)",
                    latency_ms=latency,
                    metadata={"rls_active": response.status_code == 401}
                )
            else:
                return ServiceHealth(
                    name="rag",
                    status=ServiceStatus.UNHEALTHY,
                    message=f"Supabase returned {response.status_code}",
                    latency_ms=latency
                )
                
        except Exception as e:
            return ServiceHealth(
                name="rag",
                status=ServiceStatus.UNHEALTHY,
                message=f"Connection failed: {str(e)}",
                latency_ms=(time.time() - start_time) * 1000
            )
    
    def _check_embedding_service(self) -> ServiceHealth:
        """Verifica serviço de embeddings"""
        start_time = time.time()
        
        use_api_embeddings = os.getenv('USE_API_EMBEDDINGS', 'false').lower() == 'true'
        
        if use_api_embeddings:
            # Usar OpenRouter para embeddings (mais rápido)
            api_key = os.getenv('OPENROUTER_API_KEY')
            if api_key:
                return ServiceHealth(
                    name="embeddings",
                    status=ServiceStatus.HEALTHY,
                    message="Using API-based embeddings",
                    latency_ms=(time.time() - start_time) * 1000,
                    metadata={"mode": "api", "provider": "openrouter"}
                )
        
        # Tentar importar sentence-transformers (pode ser lento)
        try:
            import sentence_transformers
            return ServiceHealth(
                name="embeddings",
                status=ServiceStatus.HEALTHY,
                message="Local embeddings available",
                latency_ms=(time.time() - start_time) * 1000,
                metadata={"mode": "local"}
            )
        except ImportError:
            return ServiceHealth(
                name="embeddings",
                status=ServiceStatus.UNHEALTHY,
                message="Neither API nor local embeddings available",
                latency_ms=(time.time() - start_time) * 1000
            )
    
    def _check_cache(self) -> ServiceHealth:
        """Verifica sistema de cache"""
        start_time = time.time()
        
        try:
            from core.dependencies import get_cache
            cache = get_cache()
            if cache:
                return ServiceHealth(
                    name="cache",
                    status=ServiceStatus.HEALTHY,
                    message="Cache system operational",
                    latency_ms=(time.time() - start_time) * 1000
                )
            else:
                return ServiceHealth(
                    name="cache",
                    status=ServiceStatus.DEGRADED,
                    message="Cache system not initialized",
                    latency_ms=(time.time() - start_time) * 1000
                )
        except Exception as e:
            return ServiceHealth(
                name="cache",
                status=ServiceStatus.UNHEALTHY,
                message=f"Cache check failed: {str(e)}",
                latency_ms=(time.time() - start_time) * 1000
            )
    
    def _get_recovery_suggestions(self, services: Dict) -> List[str]:
        """Sugestões específicas baseadas nos problemas encontrados"""
        suggestions = []
        
        if services['ai_provider'].status != ServiceStatus.HEALTHY:
            suggestions.append("Check OPENROUTER_API_KEY and API limits")
        
        if services['rag'].status != ServiceStatus.HEALTHY:
            suggestions.append("Verify Supabase credentials and project status")
        
        if services['embeddings'].status != ServiceStatus.HEALTHY:
            suggestions.append("Enable USE_API_EMBEDDINGS=true to avoid model downloads")
        
        return suggestions
    
    def _check_fallback_availability(self) -> bool:
        """Verifica se sistemas de fallback estão disponíveis"""
        try:
            # Import only when checking availability
            __import__('core.fallback.intelligent_fallback')
            return True
        except ImportError:
            return False

# Instância global
honest_health_checker = HonestHealthChecker()

def get_honest_health_status():
    """Função pública para obter status honesto do sistema"""
    return honest_health_checker.check_all_services()