# -*- coding: utf-8 -*-
"""
Sistema de Métricas Prometheus para Plataforma Médico-Educacional
================================================================

Integra o sistema de performance monitor com Prometheus para observabilidade
em produção, com foco em métricas críticas para plataforma médica.

Características:
- Métricas específicas para sistema educacional médico
- Integração com performance monitor existente
- Métricas customizadas para personas IA
- Monitoramento de RAG e QA systems
- Alertas específicos para dados médicos
- Conformidade com padrões de observabilidade médica

Autor: Sistema de Métricas Roteiro de Dispensação
Data: 2025-08-12
Baseado: Performance Monitor + Prometheus Client
"""

import time
import logging
from typing import Dict, Any, Optional, List
from contextlib import contextmanager
from dataclasses import dataclass
from threading import Lock

# Importar cliente Prometheus (instalação opcional)
try:
    from prometheus_client import (
        Counter, Histogram, Gauge, Info, CollectorRegistry,
        generate_latest, CONTENT_TYPE_LATEST, REGISTRY,
        start_http_server, multiprocess, values
    )
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

# Import sistema existente
from app_config import config
try:
    from core.metrics.performance_monitor import performance_monitor
    PERFORMANCE_MONITOR_AVAILABLE = True
except ImportError:
    PERFORMANCE_MONITOR_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class PrometheusConfig:
    """Configuração do sistema Prometheus"""
    enabled: bool = True
    metrics_port: int = 9090
    metrics_path: str = '/metrics'
    push_gateway_url: Optional[str] = None
    job_name: str = 'roteiro-dispensacao-backend'
    medical_namespace: str = 'medical_platform'
    collect_interval_seconds: int = 15
    
class MedicalMetricsCollector:
    """Coletor de métricas específicas para plataforma médica"""
    
    def __init__(self, registry: Optional[CollectorRegistry] = None):
        self.registry = registry or REGISTRY
        self.enabled = PROMETHEUS_AVAILABLE and config.METRICS_ENABLED
        self.lock = Lock()
        
        if not self.enabled:
            logger.warning("❌ Prometheus metrics disabled or not available")
            return
            
        self.namespace = 'medical_platform'
        
        # ===== MÉTRICAS DE REQUESTS HTTP =====
        self.http_requests_total = Counter(
            name='http_requests_total',
            documentation='Total number of HTTP requests by method, endpoint and status',
            labelnames=['method', 'endpoint', 'status_code', 'persona'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.http_request_duration = Histogram(
            name='http_request_duration_seconds',
            documentation='HTTP request duration in seconds',
            labelnames=['method', 'endpoint', 'status_code', 'persona'],
            namespace=self.namespace,
            registry=self.registry,
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
        )
        
        self.http_requests_in_progress = Gauge(
            name='http_requests_in_progress',
            documentation='Number of HTTP requests currently being processed',
            namespace=self.namespace,
            registry=self.registry
        )
        
        # ===== MÉTRICAS DE SISTEMA =====
        self.system_cpu_usage = Gauge(
            name='system_cpu_usage_percent',
            documentation='Current CPU usage percentage',
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.system_memory_usage = Gauge(
            name='system_memory_usage_percent',
            documentation='Current memory usage percentage',
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.system_disk_usage = Gauge(
            name='system_disk_usage_percent',
            documentation='Current disk usage percentage',
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.system_uptime = Gauge(
            name='system_uptime_seconds',
            documentation='System uptime in seconds',
            namespace=self.namespace,
            registry=self.registry
        )
        
        # ===== MÉTRICAS ESPECÍFICAS DE IA MÉDICA =====
        self.ai_rag_queries_total = Counter(
            name='ai_rag_queries_total',
            documentation='Total number of RAG system queries for medical knowledge',
            labelnames=['knowledge_type', 'success'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.ai_rag_query_duration = Histogram(
            name='ai_rag_query_duration_seconds',
            documentation='RAG query processing time in seconds',
            labelnames=['knowledge_type'],
            namespace=self.namespace,
            registry=self.registry,
            buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
        )
        
        self.ai_qa_validations_total = Counter(
            name='ai_qa_validations_total',
            documentation='Total number of QA validations performed',
            labelnames=['persona', 'validation_result'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.ai_qa_score = Histogram(
            name='ai_qa_score',
            documentation='QA validation scores for medical responses',
            labelnames=['persona', 'validation_type'],
            namespace=self.namespace,
            registry=self.registry,
            buckets=[0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 1.0]
        )
        
        # ===== MÉTRICAS DE PERSONAS MÉDICAS =====
        self.persona_requests_total = Counter(
            name='persona_requests_total',
            documentation='Total requests by medical AI persona',
            labelnames=['persona', 'request_type', 'success'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.persona_response_time = Histogram(
            name='persona_response_time_seconds',
            documentation='Response time for medical AI personas',
            labelnames=['persona', 'complexity'],
            namespace=self.namespace,
            registry=self.registry,
            buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 15.0, 30.0]
        )
        
        # ===== MÉTRICAS DE CACHE MÉDICO =====
        self.cache_requests_total = Counter(
            name='cache_requests_total',
            documentation='Total cache requests for medical data',
            labelnames=['cache_type', 'hit_miss'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.cache_size = Gauge(
            name='cache_size_bytes',
            documentation='Current cache size in bytes',
            labelnames=['cache_type'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        # ===== MÉTRICAS DE SEGURANÇA MÉDICA =====
        self.security_events_total = Counter(
            name='security_events_total',
            documentation='Total security events detected',
            labelnames=['event_type', 'severity', 'source'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.input_validation_failures_total = Counter(
            name='input_validation_failures_total',
            documentation='Total input validation failures for medical data',
            labelnames=['input_type', 'validation_rule'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        # ===== MÉTRICAS DE CONFORMIDADE MÉDICA =====
        self.lgpd_compliance_events = Counter(
            name='lgpd_compliance_events_total',
            documentation='LGPD compliance events for medical data',
            labelnames=['event_type', 'data_category'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.medical_disclaimer_views = Counter(
            name='medical_disclaimer_views_total',
            documentation='Medical disclaimer views and acknowledgments',
            labelnames=['disclaimer_type', 'action'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        # ===== MÉTRICAS DE CONHECIMENTO MÉDICO =====
        self.medical_knowledge_access = Counter(
            name='medical_knowledge_access_total',
            documentation='Access to medical knowledge base sections',
            labelnames=['knowledge_category', 'access_type'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        self.dosage_calculations_total = Counter(
            name='dosage_calculations_total',
            documentation='Total medication dosage calculations performed',
            labelnames=['medication_type', 'calculation_type', 'success'],
            namespace=self.namespace,
            registry=self.registry
        )
        
        # ===== INFO METRICS =====
        self.application_info = Info(
            name='application',
            documentation='Application information for medical platform',
            namespace=self.namespace,
            registry=self.registry
        )
        
        # Definir informações da aplicação
        self.application_info.info({
            'version': 'v1.0-medical',
            'platform': 'roteiro-dispensacao-pqt',
            'environment': config.ENVIRONMENT,
            'medical_compliance': 'LGPD,CFM-2314-2022,ANVISA-RDC-4-2009'
        })
        
        logger.info(f"✅ Prometheus metrics collector initialized with {len(self.registry._collector_to_names)} metrics")
        
    def record_http_request(self, method: str, endpoint: str, status_code: int, 
                           duration_seconds: float, persona: str = 'none'):
        """Registra métrica de request HTTP"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                # Counter de requests
                self.http_requests_total.labels(
                    method=method,
                    endpoint=endpoint, 
                    status_code=str(status_code),
                    persona=persona
                ).inc()
                
                # Histogram de duração
                self.http_request_duration.labels(
                    method=method,
                    endpoint=endpoint,
                    status_code=str(status_code), 
                    persona=persona
                ).observe(duration_seconds)
                
            except Exception as e:
                logger.warning(f"Failed to record HTTP metrics: {e}")
    
    def record_rag_query(self, knowledge_type: str, duration_seconds: float, success: bool):
        """Registra métrica de query RAG"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.ai_rag_queries_total.labels(
                    knowledge_type=knowledge_type,
                    success=str(success).lower()
                ).inc()
                
                self.ai_rag_query_duration.labels(
                    knowledge_type=knowledge_type
                ).observe(duration_seconds)
                
            except Exception as e:
                logger.warning(f"Failed to record RAG metrics: {e}")
    
    def record_qa_validation(self, persona: str, validation_type: str, 
                           score: float, result: str):
        """Registra métrica de validação QA"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.ai_qa_validations_total.labels(
                    persona=persona,
                    validation_result=result
                ).inc()
                
                self.ai_qa_score.labels(
                    persona=persona,
                    validation_type=validation_type
                ).observe(score)
                
            except Exception as e:
                logger.warning(f"Failed to record QA metrics: {e}")
    
    def record_persona_request(self, persona: str, request_type: str, 
                             duration_seconds: float, success: bool, complexity: str = 'medium'):
        """Registra métrica de request de persona"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.persona_requests_total.labels(
                    persona=persona,
                    request_type=request_type,
                    success=str(success).lower()
                ).inc()
                
                self.persona_response_time.labels(
                    persona=persona,
                    complexity=complexity
                ).observe(duration_seconds)
                
            except Exception as e:
                logger.warning(f"Failed to record persona metrics: {e}")
    
    def record_cache_access(self, cache_type: str, hit: bool, size_bytes: Optional[int] = None):
        """Registra métrica de acesso ao cache"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.cache_requests_total.labels(
                    cache_type=cache_type,
                    hit_miss='hit' if hit else 'miss'
                ).inc()
                
                if size_bytes is not None:
                    self.cache_size.labels(cache_type=cache_type).set(size_bytes)
                    
            except Exception as e:
                logger.warning(f"Failed to record cache metrics: {e}")
    
    def record_security_event(self, event_type: str, severity: str, source: str):
        """Registra evento de segurança"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.security_events_total.labels(
                    event_type=event_type,
                    severity=severity,
                    source=source
                ).inc()
                
            except Exception as e:
                logger.warning(f"Failed to record security metrics: {e}")
    
    def record_input_validation_failure(self, input_type: str, validation_rule: str):
        """Registra falha de validação de entrada"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.input_validation_failures_total.labels(
                    input_type=input_type,
                    validation_rule=validation_rule
                ).inc()
                
            except Exception as e:
                logger.warning(f"Failed to record validation metrics: {e}")
    
    def record_dosage_calculation(self, medication_type: str, calculation_type: str, success: bool):
        """Registra cálculo de dosagem"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.dosage_calculations_total.labels(
                    medication_type=medication_type,
                    calculation_type=calculation_type,
                    success=str(success).lower()
                ).inc()
                
            except Exception as e:
                logger.warning(f"Failed to record dosage metrics: {e}")
    
    def record_medical_disclaimer(self, disclaimer_type: str, action: str):
        """Registra visualização/aceitação de disclaimer médico"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.medical_disclaimer_views.labels(
                    disclaimer_type=disclaimer_type,
                    action=action
                ).inc()
                
            except Exception as e:
                logger.warning(f"Failed to record disclaimer metrics: {e}")
    
    def update_system_metrics(self, cpu_percent: float, memory_percent: float, 
                            disk_percent: float, uptime_seconds: int):
        """Atualiza métricas do sistema"""
        if not self.enabled:
            return
            
        with self.lock:
            try:
                self.system_cpu_usage.set(cpu_percent)
                self.system_memory_usage.set(memory_percent) 
                self.system_disk_usage.set(disk_percent)
                self.system_uptime.set(uptime_seconds)
                
            except Exception as e:
                logger.warning(f"Failed to update system metrics: {e}")
    
    @contextmanager
    def track_http_request_in_progress(self):
        """Context manager para rastrear requests em progresso"""
        if not self.enabled:
            yield
            return
            
        self.http_requests_in_progress.inc()
        try:
            yield
        finally:
            self.http_requests_in_progress.dec()
    
    def get_metrics_output(self) -> bytes:
        """Retorna métricas formatadas para Prometheus"""
        if not self.enabled:
            return b"# Prometheus metrics not available"
            
        return generate_latest(self.registry)

class PrometheusIntegration:
    """Integração principal com Prometheus"""
    
    def __init__(self, config: PrometheusConfig = None):
        self.config = config or PrometheusConfig()
        self.enabled = PROMETHEUS_AVAILABLE and self.config.enabled and config.METRICS_ENABLED
        
        if not self.enabled:
            logger.warning("❌ Prometheus integration disabled")
            return
            
        # Criar registry personalizado para evitar conflitos
        self.registry = CollectorRegistry()
        self.metrics_collector = MedicalMetricsCollector(self.registry)
        
        # Integrar com performance monitor existente
        if PERFORMANCE_MONITOR_AVAILABLE:
            self._setup_performance_monitor_integration()
            
        logger.info("✅ Prometheus integration initialized")
    
    def _setup_performance_monitor_integration(self):
        """Configura integração com o performance monitor existente"""
        def prometheus_callback(alert_type: str, details: Dict[str, Any]):
            """Callback para receber alertas do performance monitor"""
            self.metrics_collector.record_security_event(
                event_type=f"performance_alert_{alert_type}",
                severity='warning',
                source='performance_monitor'
            )
        
        # Registrar callback
        performance_monitor.add_alert_callback(prometheus_callback)
        logger.info("🔗 Performance monitor integrated with Prometheus")
    
    def start_metrics_server(self, port: int = None):
        """Inicia servidor de métricas HTTP"""
        if not self.enabled:
            logger.warning("Cannot start metrics server - Prometheus disabled")
            return False
            
        port = port or self.config.metrics_port
        
        try:
            # Usar registry personalizado
            start_http_server(port, registry=self.registry)
            logger.info(f"📊 Prometheus metrics server started on port {port}")
            logger.info(f"📊 Metrics available at: http://localhost:{port}/metrics")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start metrics server: {e}")
            return False
    
    def collect_and_export_system_metrics(self):
        """Coleta métricas do sistema e exporta para Prometheus"""
        if not self.enabled or not PERFORMANCE_MONITOR_AVAILABLE:
            return
            
        try:
            current_metrics = performance_monitor.get_current_metrics()
            
            # Atualizar métricas do sistema
            system_metrics = current_metrics.get('system', {})
            self.metrics_collector.update_system_metrics(
                cpu_percent=system_metrics.get('cpu_usage_percent', 0),
                memory_percent=system_metrics.get('memory_usage_percent', 0),
                disk_percent=system_metrics.get('disk_usage_percent', 0),
                uptime_seconds=current_metrics.get('uptime_seconds', 0)
            )
            
            # Exportar métricas de IA
            ai_metrics = current_metrics.get('ai_metrics', {})
            
            # Simular métricas baseadas nos dados atuais
            if ai_metrics.get('rag_queries_count', 0) > 0:
                avg_time_ms = ai_metrics.get('rag_avg_response_time_ms', 0)
                self.metrics_collector.record_rag_query(
                    knowledge_type='medical_hanseniase',
                    duration_seconds=avg_time_ms / 1000.0,
                    success=True
                )
            
        except Exception as e:
            logger.warning(f"Failed to collect system metrics: {e}")
    
    def get_metrics_for_endpoint(self) -> tuple:
        """Retorna métricas para endpoint HTTP"""
        if not self.enabled:
            return b"# Prometheus metrics not available", 'text/plain'
            
        return self.metrics_collector.get_metrics_output(), CONTENT_TYPE_LATEST
    
    def record_request_metrics(self, method: str, endpoint: str, status_code: int,
                             duration_seconds: float, persona: str = 'none'):
        """Registra métricas de request (interface simplificada)"""
        if self.enabled:
            self.metrics_collector.record_http_request(
                method, endpoint, status_code, duration_seconds, persona
            )
    
    def shutdown(self):
        """Finaliza integração Prometheus"""
        if self.enabled:
            logger.info("🔄 Shutting down Prometheus integration")

# Instância global
prometheus_integration = PrometheusIntegration()

# Decorador para medir requests automaticamente
def prometheus_track_request(endpoint_name: str = None):
    """Decorador para rastrear requests com Prometheus"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            if not prometheus_integration.enabled:
                return func(*args, **kwargs)
                
            start_time = time.time()
            status_code = 200
            error_occurred = False
            
            with prometheus_integration.metrics_collector.track_http_request_in_progress():
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    error_occurred = True
                    status_code = 500
                    raise
                finally:
                    duration = time.time() - start_time
                    endpoint = endpoint_name or func.__name__
                    
                    prometheus_integration.record_request_metrics(
                        method='POST',  # Default para API calls
                        endpoint=endpoint,
                        status_code=status_code,
                        duration_seconds=duration
                    )
        
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper
    
    return decorator

# Funções de conveniência
def record_medical_event(event_type: str, **kwargs):
    """Registra evento médico específico"""
    if prometheus_integration.enabled:
        if event_type == 'dosage_calculation':
            prometheus_integration.metrics_collector.record_dosage_calculation(
                medication_type=kwargs.get('medication', 'unknown'),
                calculation_type=kwargs.get('calc_type', 'basic'),
                success=kwargs.get('success', True)
            )
        elif event_type == 'disclaimer_view':
            prometheus_integration.metrics_collector.record_medical_disclaimer(
                disclaimer_type=kwargs.get('disclaimer_type', 'general'),
                action=kwargs.get('action', 'view')
            )
        elif event_type == 'security_violation':
            prometheus_integration.metrics_collector.record_security_event(
                event_type=kwargs.get('violation_type', 'unknown'),
                severity=kwargs.get('severity', 'medium'),
                source=kwargs.get('source', 'application')
            )

def get_prometheus_metrics() -> tuple:
    """Retorna métricas Prometheus formatadas"""
    return prometheus_integration.get_metrics_for_endpoint()

def is_prometheus_enabled() -> bool:
    """Verifica se Prometheus está habilitado"""
    return prometheus_integration.enabled

__all__ = [
    'PrometheusIntegration',
    'MedicalMetricsCollector', 
    'prometheus_integration',
    'prometheus_track_request',
    'record_medical_event',
    'get_prometheus_metrics',
    'is_prometheus_enabled'
]