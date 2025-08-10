# -*- coding: utf-8 -*-
"""
Sistema Avançado de Monitoramento de Performance
Coleta métricas detalhadas de performance do sistema educacional médico
"""

import time
import threading
import psutil
import os
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from contextlib import contextmanager
import logging
import json

# Import configurações
from app_config import config

logger = logging.getLogger(__name__)

@dataclass
class EndpointMetrics:
    """Métricas por endpoint"""
    request_count: int = 0
    total_response_time_ms: float = 0.0
    avg_response_time_ms: float = 0.0
    min_response_time_ms: float = float('inf')
    max_response_time_ms: float = 0.0
    error_count: int = 0
    success_rate: float = 100.0
    last_request: Optional[str] = None

@dataclass  
class SystemMetrics:
    """Métricas do sistema"""
    cpu_usage_percent: float = 0.0
    memory_usage_percent: float = 0.0
    memory_usage_mb: float = 0.0
    disk_usage_percent: float = 0.0
    active_connections: int = 0
    uptime_seconds: int = 0

@dataclass
class AIMetrics:
    """Métricas específicas do sistema de IA"""
    rag_queries_count: int = 0
    rag_avg_response_time_ms: float = 0.0
    qa_validations_count: int = 0
    qa_avg_score: float = 0.0
    persona_dr_gasnelio_requests: int = 0
    persona_ga_requests: int = 0
    cache_hit_rate: float = 0.0
    medical_chunks_accessed: int = 0

@dataclass
class PerformanceSnapshot:
    """Snapshot completo de performance"""
    timestamp: str
    endpoints: Dict[str, EndpointMetrics]
    system: SystemMetrics
    ai_metrics: AIMetrics
    custom_metrics: Dict[str, Any]

class CircularBuffer:
    """Buffer circular para histórico de métricas"""
    
    def __init__(self, maxsize: int = 1000):
        self.maxsize = maxsize
        self.data = deque(maxlen=maxsize)
        self.lock = threading.Lock()
    
    def add(self, item: Any):
        with self.lock:
            self.data.append(item)
    
    def get_recent(self, count: int = None) -> List[Any]:
        with self.lock:
            if count is None:
                return list(self.data)
            return list(self.data)[-count:]
    
    def get_size(self) -> int:
        with self.lock:
            return len(self.data)

class PerformanceMonitor:
    """Sistema central de monitoramento de performance"""
    
    def __init__(self):
        self.start_time = time.time()
        self.endpoint_metrics = defaultdict(EndpointMetrics)
        self.system_metrics = SystemMetrics()
        self.ai_metrics = AIMetrics()
        self.custom_metrics = {}
        
        # Histórico circular
        self.performance_history = CircularBuffer(maxsize=1440)  # 24h de dados (1 por minuto)
        self.request_times = CircularBuffer(maxsize=10000)  # Últimas 10k requests
        
        # Locks para thread safety
        self.metrics_lock = threading.Lock()
        self.ai_metrics_lock = threading.Lock()
        
        # Alertas
        self.alert_thresholds = {
            'response_time_ms': 5000,  # 5 segundos
            'error_rate_percent': 5.0,  # 5%
            'cpu_usage_percent': 80.0,  # 80%
            'memory_usage_percent': 85.0,  # 85%
            'disk_usage_percent': 90.0,  # 90%
        }
        
        self.alert_callbacks: List[Callable] = []
        
        # Iniciar coleta automática
        self._start_system_monitoring()
    
    def add_alert_callback(self, callback: Callable[[str, Dict[str, Any]], None]):
        """Adiciona callback para alertas"""
        self.alert_callbacks.append(callback)
    
    def _trigger_alert(self, alert_type: str, details: Dict[str, Any]):
        """Dispara alertas registrados"""
        for callback in self.alert_callbacks:
            try:
                callback(alert_type, details)
            except Exception as e:
                logger.error(f"Erro ao executar callback de alerta: {e}")
    
    def _start_system_monitoring(self):
        """Inicia monitoramento automático do sistema"""
        def monitor_system():
            while True:
                try:
                    self._collect_system_metrics()
                    self._save_performance_snapshot()
                    self._check_alerts()
                except Exception as e:
                    logger.error(f"Erro no monitoramento do sistema: {e}")
                time.sleep(60)  # A cada minuto
        
        monitor_thread = threading.Thread(target=monitor_system, daemon=True)
        monitor_thread.start()
        logger.info("✅ Sistema de monitoramento de performance iniciado")
    
    def _collect_system_metrics(self):
        """Coleta métricas do sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memória
            memory = psutil.virtual_memory()
            memory_mb = memory.used / (1024 * 1024)
            
            # Disco
            disk = psutil.disk_usage('/')
            
            # Conexões de rede
            connections = len(psutil.net_connections(kind='inet'))
            
            # Uptime
            uptime = int(time.time() - self.start_time)
            
            with self.metrics_lock:
                self.system_metrics = SystemMetrics(
                    cpu_usage_percent=cpu_percent,
                    memory_usage_percent=memory.percent,
                    memory_usage_mb=memory_mb,
                    disk_usage_percent=disk.percent,
                    active_connections=connections,
                    uptime_seconds=uptime
                )
                
        except Exception as e:
            logger.warning(f"Erro ao coletar métricas do sistema: {e}")
    
    def _save_performance_snapshot(self):
        """Salva snapshot atual de performance"""
        with self.metrics_lock, self.ai_metrics_lock:
            snapshot = PerformanceSnapshot(
                timestamp=datetime.now().isoformat(),
                endpoints={k: v for k, v in self.endpoint_metrics.items()},
                system=self.system_metrics,
                ai_metrics=self.ai_metrics,
                custom_metrics=dict(self.custom_metrics)
            )
            self.performance_history.add(snapshot)
    
    def _check_alerts(self):
        """Verifica condições de alerta"""
        # Alerta de CPU alto
        if self.system_metrics.cpu_usage_percent > self.alert_thresholds['cpu_usage_percent']:
            self._trigger_alert('high_cpu_usage', {
                'current_usage': self.system_metrics.cpu_usage_percent,
                'threshold': self.alert_thresholds['cpu_usage_percent']
            })
        
        # Alerta de memória alta
        if self.system_metrics.memory_usage_percent > self.alert_thresholds['memory_usage_percent']:
            self._trigger_alert('high_memory_usage', {
                'current_usage': self.system_metrics.memory_usage_percent,
                'threshold': self.alert_thresholds['memory_usage_percent']
            })
        
        # Alerta de disco cheio
        if self.system_metrics.disk_usage_percent > self.alert_thresholds['disk_usage_percent']:
            self._trigger_alert('high_disk_usage', {
                'current_usage': self.system_metrics.disk_usage_percent,
                'threshold': self.alert_thresholds['disk_usage_percent']
            })
        
        # Alertas por endpoint
        with self.metrics_lock:
            for endpoint, metrics in self.endpoint_metrics.items():
                # Tempo de resposta alto
                if metrics.avg_response_time_ms > self.alert_thresholds['response_time_ms']:
                    self._trigger_alert('slow_endpoint', {
                        'endpoint': endpoint,
                        'avg_response_time': metrics.avg_response_time_ms,
                        'threshold': self.alert_thresholds['response_time_ms']
                    })
                
                # Taxa de erro alta
                error_rate = (100.0 - metrics.success_rate) if metrics.request_count > 0 else 0
                if error_rate > self.alert_thresholds['error_rate_percent']:
                    self._trigger_alert('high_error_rate', {
                        'endpoint': endpoint,
                        'error_rate': error_rate,
                        'threshold': self.alert_thresholds['error_rate_percent']
                    })
    
    @contextmanager
    def measure_request(self, endpoint: str, request_id: str = None):
        """Context manager para medir tempo de request"""
        start_time = time.time()
        error_occurred = False
        
        try:
            yield
        except Exception as e:
            error_occurred = True
            raise
        finally:
            duration_ms = (time.time() - start_time) * 1000
            self.record_request(endpoint, duration_ms, error_occurred, request_id)
    
    def record_request(self, endpoint: str, duration_ms: float, 
                      error_occurred: bool = False, request_id: str = None):
        """Registra métricas de uma request"""
        with self.metrics_lock:
            metrics = self.endpoint_metrics[endpoint]
            
            # Atualizar contadores
            metrics.request_count += 1
            metrics.total_response_time_ms += duration_ms
            
            if error_occurred:
                metrics.error_count += 1
            
            # Calcular estatísticas
            metrics.avg_response_time_ms = metrics.total_response_time_ms / metrics.request_count
            metrics.min_response_time_ms = min(metrics.min_response_time_ms, duration_ms)
            metrics.max_response_time_ms = max(metrics.max_response_time_ms, duration_ms)
            
            # Taxa de sucesso
            success_count = metrics.request_count - metrics.error_count
            metrics.success_rate = (success_count / metrics.request_count) * 100.0
            
            # Último request
            metrics.last_request = datetime.now().isoformat()
            
            # Adicionar ao histórico
            self.request_times.add({
                'endpoint': endpoint,
                'duration_ms': duration_ms,
                'timestamp': metrics.last_request,
                'error': error_occurred,
                'request_id': request_id
            })
    
    def record_ai_metrics(self, metric_type: str, value: Any, **kwargs):
        """Registra métricas específicas de IA"""
        with self.ai_metrics_lock:
            if metric_type == 'rag_query':
                self.ai_metrics.rag_queries_count += 1
                if 'response_time_ms' in kwargs:
                    # Média móvel do tempo de resposta
                    current_avg = self.ai_metrics.rag_avg_response_time_ms
                    current_count = self.ai_metrics.rag_queries_count
                    new_time = kwargs['response_time_ms']
                    self.ai_metrics.rag_avg_response_time_ms = (
                        (current_avg * (current_count - 1)) + new_time
                    ) / current_count
            
            elif metric_type == 'qa_validation':
                self.ai_metrics.qa_validations_count += 1
                if 'score' in kwargs:
                    # Média móvel do score QA
                    current_avg = self.ai_metrics.qa_avg_score
                    current_count = self.ai_metrics.qa_validations_count
                    new_score = kwargs['score']
                    self.ai_metrics.qa_avg_score = (
                        (current_avg * (current_count - 1)) + new_score
                    ) / current_count
            
            elif metric_type == 'persona_request':
                persona = kwargs.get('persona', '')
                if persona == 'dr_gasnelio':
                    self.ai_metrics.persona_dr_gasnelio_requests += 1
                elif persona == 'ga':
                    self.ai_metrics.persona_ga_requests += 1
            
            elif metric_type == 'cache_access':
                hit = kwargs.get('hit', False)
                total_requests = self.ai_metrics.rag_queries_count
                if total_requests > 0:
                    # Recalcular taxa de hit do cache (simplificado)
                    if hit:
                        # Incrementar ligeiramente
                        self.ai_metrics.cache_hit_rate = min(
                            self.ai_metrics.cache_hit_rate + (1.0 / total_requests), 
                            100.0
                        )
            
            elif metric_type == 'medical_chunk_access':
                self.ai_metrics.medical_chunks_accessed += value
    
    def set_custom_metric(self, name: str, value: Any):
        """Define métrica customizada"""
        self.custom_metrics[name] = value
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Retorna métricas atuais"""
        with self.metrics_lock, self.ai_metrics_lock:
            return {
                'timestamp': datetime.now().isoformat(),
                'uptime_seconds': int(time.time() - self.start_time),
                'system': asdict(self.system_metrics),
                'endpoints': {k: asdict(v) for k, v in self.endpoint_metrics.items()},
                'ai_metrics': asdict(self.ai_metrics),
                'custom_metrics': dict(self.custom_metrics),
                'request_history_size': self.request_times.get_size(),
                'performance_history_size': self.performance_history.get_size()
            }
    
    def get_performance_history(self, hours: int = 1) -> List[Dict[str, Any]]:
        """Retorna histórico de performance"""
        snapshots = self.performance_history.get_recent()
        
        # Filtrar por tempo se necessário
        if hours < 24:  # Se menos de 24h, filtrar
            cutoff_time = datetime.now() - timedelta(hours=hours)
            snapshots = [
                s for s in snapshots 
                if datetime.fromisoformat(s.timestamp) >= cutoff_time
            ]
        
        return [asdict(snapshot) for snapshot in snapshots]
    
    def get_recent_requests(self, count: int = 100) -> List[Dict[str, Any]]:
        """Retorna requests recentes"""
        return self.request_times.get_recent(count)
    
    def get_endpoint_rankings(self) -> Dict[str, Any]:
        """Retorna ranking de endpoints por várias métricas"""
        with self.metrics_lock:
            endpoints = list(self.endpoint_metrics.items())
            
            return {
                'most_requested': sorted(
                    endpoints, 
                    key=lambda x: x[1].request_count, 
                    reverse=True
                )[:10],
                'slowest': sorted(
                    endpoints, 
                    key=lambda x: x[1].avg_response_time_ms, 
                    reverse=True
                )[:10],
                'highest_error_rate': sorted(
                    endpoints, 
                    key=lambda x: 100.0 - x[1].success_rate, 
                    reverse=True
                )[:10]
            }
    
    def export_metrics_json(self, filepath: str):
        """Exporta métricas para arquivo JSON"""
        metrics_data = {
            'export_timestamp': datetime.now().isoformat(),
            'current_metrics': self.get_current_metrics(),
            'performance_history': self.get_performance_history(24),  # 24h
            'recent_requests': self.get_recent_requests(1000),
            'endpoint_rankings': self.get_endpoint_rankings()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(metrics_data, f, ensure_ascii=False, indent=2, default=str)
        
        logger.info(f"📊 Métricas exportadas para: {filepath}")

# Instância global
performance_monitor = PerformanceMonitor()

# Decorador para medir performance de funções
def measure_performance(operation_name: str = None):
    """Decorador para medir performance de funções"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            with performance_monitor.measure_request(op_name):
                result = func(*args, **kwargs)
            
            return result
        
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper
    
    return decorator

# Callback de alerta padrão para logging
def default_alert_callback(alert_type: str, details: Dict[str, Any]):
    """Callback padrão para registrar alertas em log"""
    from core.logging.advanced_logger import log_security_event
    
    log_security_event(
        event_type=f"performance_alert_{alert_type}",
        details=details,
        severity='WARNING'
    )

# Registrar callback padrão
performance_monitor.add_alert_callback(default_alert_callback)

# Funções de conveniência
def get_current_metrics() -> Dict[str, Any]:
    """Retorna métricas atuais"""
    return performance_monitor.get_current_metrics()

def record_ai_metric(metric_type: str, value: Any, **kwargs):
    """Registra métrica de IA"""
    performance_monitor.record_ai_metrics(metric_type, value, **kwargs)

def set_custom_metric(name: str, value: Any):
    """Define métrica customizada"""
    performance_monitor.set_custom_metric(name, value)

__all__ = [
    'PerformanceMonitor',
    'performance_monitor', 
    'measure_performance',
    'get_current_metrics',
    'record_ai_metric',
    'set_custom_metric'
]