"""
Sistema de Monitoramento de Saúde para Produção
Objetivo: Observabilidade enterprise-grade em produção

Data: 27 de Janeiro de 2025
DevOps Engineer: Configuração de produção avançada
"""

import os
import time
import psutil
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
import json
from collections import defaultdict

logger = logging.getLogger(__name__)

class ProductionHealthMonitor:
    """Monitor de saúde enterprise para produção"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.health_checks = []
        self.error_count = defaultdict(int)
        self.performance_metrics = []
        self.enabled = os.environ.get('HEALTH_CHECK_ENABLED', 'true').lower() == 'true'
        
    def get_system_health(self) -> Dict[str, Any]:
        """Coleta métricas completas do sistema"""
        if not self.enabled:
            return {"status": "monitoring_disabled"}
            
        try:
            # Métricas do Sistema
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Métricas da Aplicação
            uptime = datetime.now() - self.start_time
            
            health_data = {
                "timestamp": datetime.now().isoformat(),
                "status": self._calculate_overall_status(cpu_percent, memory.percent),
                "system": {
                    "cpu_usage_percent": cpu_percent,
                    "memory_usage_percent": memory.percent,
                    "memory_available_mb": memory.available // (1024 * 1024),
                    "disk_usage_percent": disk.percent,
                    "disk_free_gb": disk.free // (1024 * 1024 * 1024)
                },
                "application": {
                    "uptime_seconds": int(uptime.total_seconds()),
                    "uptime_human": str(uptime),
                    "environment": os.environ.get('FLASK_ENV', 'unknown'),
                    "python_version": os.sys.version.split()[0],
                    "process_id": os.getpid()
                },
                "performance": {
                    "avg_response_time_ms": self._get_avg_response_time(),
                    "error_rate_percent": self._get_error_rate(),
                    "requests_last_hour": len(self.performance_metrics),
                    "cache_enabled": os.environ.get('CACHE_ENABLED', 'false')
                },
                "security": {
                    "debug_mode": os.environ.get('FLASK_DEBUG', 'false'),
                    "security_headers": os.environ.get('SECURITY_HEADERS_ENABLED', 'false'),
                    "rate_limiting": os.environ.get('RATE_LIMITING_ENABLED', 'false'),
                    "cors_configured": os.environ.get('CORS_ORIGINS', 'not_set') != 'not_set'
                }
            }
            
            # Log health check
            if logger.isEnabledFor(logging.INFO):
                logger.info(f"Health check completed - Status: {health_data['status']}")
                
            return health_data
            
        except Exception as e:
            logger.error(f"Error collecting health metrics: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _calculate_overall_status(self, cpu_percent: float, memory_percent: float) -> str:
        """Calcula status geral baseado em métricas"""
        if cpu_percent > 80 or memory_percent > 80:
            return "critical"
        elif cpu_percent > 60 or memory_percent > 60:
            return "warning"
        else:
            return "healthy"
    
    def track_request(self, response_time_ms: float, status_code: int):
        """Rastreia requisição para métricas"""
        if not self.enabled:
            return
            
        now = datetime.now()
        
        # Adicionar métrica de performance
        self.performance_metrics.append({
            "timestamp": now,
            "response_time_ms": response_time_ms,
            "status_code": status_code
        })
        
        # Manter apenas últimas 1000 requisições
        if len(self.performance_metrics) > 1000:
            self.performance_metrics = self.performance_metrics[-1000:]
        
        # Contar erros
        if status_code >= 400:
            self.error_count[status_code] += 1
    
    def _get_avg_response_time(self) -> float:
        """Calcula tempo médio de resposta"""
        if not self.performance_metrics:
            return 0.0
            
        recent_metrics = [
            m for m in self.performance_metrics 
            if datetime.now() - m["timestamp"] < timedelta(minutes=5)
        ]
        
        if not recent_metrics:
            return 0.0
            
        return sum(m["response_time_ms"] for m in recent_metrics) / len(recent_metrics)
    
    def _get_error_rate(self) -> float:
        """Calcula taxa de erro"""
        if not self.performance_metrics:
            return 0.0
            
        recent_metrics = [
            m for m in self.performance_metrics 
            if datetime.now() - m["timestamp"] < timedelta(minutes=5)
        ]
        
        if not recent_metrics:
            return 0.0
            
        error_count = sum(1 for m in recent_metrics if m["status_code"] >= 400)
        return (error_count / len(recent_metrics)) * 100
    
    def get_detailed_report(self) -> Dict[str, Any]:
        """Relatório detalhado para debugging"""
        health = self.get_system_health()
        
        return {
            **health,
            "detailed_metrics": {
                "error_breakdown": dict(self.error_count),
                "recent_requests": self.performance_metrics[-10:] if self.performance_metrics else [],
                "environment_vars": {
                    key: value for key, value in os.environ.items() 
                    if key.startswith(('FLASK_', 'LOG_', 'MONITORING_', 'CACHE_'))
                    and 'SECRET' not in key and 'TOKEN' not in key and 'KEY' not in key
                }
            }
        }
    
    def check_dependencies(self) -> Dict[str, str]:
        """Verifica saúde das dependências externas"""
        checks = {}
        
        # Verificar configurações obrigatórias
        required_vars = [
            'OPENROUTER_API_KEY',
            'ASTRA_DB_TOKEN', 
            'ASTRA_DB_ENDPOINT'
        ]
        
        for var in required_vars:
            if os.environ.get(var):
                checks[var] = "configured"
            else:
                checks[var] = "missing"
        
        return checks

# Instância global
production_health = ProductionHealthMonitor()

def track_request_middleware(response_time_ms: float, status_code: int):
    """Middleware para rastrear requisições"""
    production_health.track_request(response_time_ms, status_code)

def get_health_status() -> Dict[str, Any]:
    """Endpoint de health check"""
    return production_health.get_system_health()

def get_detailed_health() -> Dict[str, Any]:
    """Endpoint de health check detalhado"""
    return production_health.get_detailed_report()