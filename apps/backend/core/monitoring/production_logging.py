"""
Sistema de Logging para Produção Enterprise
Objetivo: Observabilidade e troubleshooting em produção

Data: 27 de Janeiro de 2025
DevOps Engineer: Configuração de logging enterprise
"""

import os
import json
import logging
import logging.handlers
from datetime import datetime
from typing import Dict, Any, Optional
import traceback

class ProductionLogger:
    """Sistema de logging enterprise para produção"""
    
    def __init__(self):
        self.setup_loggers()
        
    def setup_loggers(self):
        """Configura loggers estruturados para produção"""
        
        # Configuração do nível de log
        log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
        
        # Formatter estruturado JSON
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Logger principal da aplicação
        app_logger = logging.getLogger('app')
        app_logger.setLevel(getattr(logging, log_level))
        
        # Logger de segurança
        security_logger = logging.getLogger('security')
        security_logger.setLevel(logging.WARNING)
        
        # Logger de performance
        performance_logger = logging.getLogger('performance')
        performance_logger.setLevel(logging.INFO)
        
        # Logger de erros
        error_logger = logging.getLogger('errors')
        error_logger.setLevel(logging.ERROR)
        
        # Handler para console (Render logs)
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        
        # Adicionar handlers
        for logger in [app_logger, security_logger, performance_logger, error_logger]:
            logger.addHandler(console_handler)
            logger.propagate = False
    
    def log_request(self, method: str, path: str, status_code: int, 
                   response_time_ms: float, client_ip: str, user_agent: str = None):
        """Log estruturado de requisições"""
        
        log_data = {
            "event_type": "http_request",
            "method": method,
            "path": path,
            "status_code": status_code,
            "response_time_ms": response_time_ms,
            "client_ip": client_ip,
            "user_agent": user_agent or "unknown",
            "timestamp": datetime.now().isoformat()
        }
        
        logger = logging.getLogger('app')
        
        if status_code >= 500:
            logger.error(f"HTTP {status_code} - {method} {path} - {response_time_ms:.2f}ms")
        elif status_code >= 400:
            logger.warning(f"HTTP {status_code} - {method} {path} - {response_time_ms:.2f}ms")
        else:
            logger.info(f"HTTP {status_code} - {method} {path} - {response_time_ms:.2f}ms")
    
    def log_security_event(self, event_type: str, client_ip: str, details: Dict[str, Any]):
        """Log de eventos de segurança"""
        
        log_data = {
            "event_type": "security_event",
            "security_event_type": event_type,
            "client_ip": client_ip,
            "details": details,
            "severity": self._get_security_severity(event_type),
            "timestamp": datetime.now().isoformat()
        }
        
        security_logger = logging.getLogger('security')
        security_logger.warning(f"SECURITY [{event_type}] from {client_ip}: {json.dumps(details)}")
    
    def log_performance_metric(self, metric_name: str, value: float, 
                             context: Optional[Dict[str, Any]] = None):
        """Log de métricas de performance"""
        
        log_data = {
            "event_type": "performance_metric",
            "metric_name": metric_name,
            "value": value,
            "context": context or {},
            "timestamp": datetime.now().isoformat()
        }
        
        performance_logger = logging.getLogger('performance')
        performance_logger.info(f"PERF [{metric_name}] = {value}")
    
    def log_error(self, error: Exception, context: Optional[Dict[str, Any]] = None,
                  request_id: Optional[str] = None):
        """Log estruturado de erros"""
        
        log_data = {
            "event_type": "application_error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            "traceback": traceback.format_exc(),
            "context": context or {},
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
        error_logger = logging.getLogger('errors')
        error_logger.error(f"ERROR [{type(error).__name__}]: {str(error)}")
        
        # Log completo apenas em debug
        if logging.getLogger('errors').isEnabledFor(logging.DEBUG):
            error_logger.debug(f"FULL ERROR: {json.dumps(log_data, indent=2)}")
    
    def log_startup(self, config: Dict[str, Any]):
        """Log de inicialização da aplicação"""
        
        # Filtrar informações sensíveis
        safe_config = {
            key: value for key, value in config.items()
            if not any(sensitive in key.lower() for sensitive in ['key', 'token', 'secret', 'password'])
        }
        
        log_data = {
            "event_type": "application_startup",
            "environment": os.environ.get('FLASK_ENV', 'unknown'),
            "debug_mode": os.environ.get('FLASK_DEBUG', 'false'),
            "monitoring_enabled": os.environ.get('MONITORING_ENABLED', 'false'),
            "cache_enabled": os.environ.get('CACHE_ENABLED', 'false'),
            "config": safe_config,
            "timestamp": datetime.now().isoformat()
        }
        
        app_logger = logging.getLogger('app')
        app_logger.info("🚀 APPLICATION STARTUP COMPLETED")
        app_logger.info(f"Environment: {log_data['environment']}")
        app_logger.info(f"Debug Mode: {log_data['debug_mode']}")
        app_logger.info(f"Monitoring: {log_data['monitoring_enabled']}")
    
    def log_cache_operation(self, operation: str, key: str, hit: bool = None,
                           size: int = None):
        """Log de operações de cache"""
        
        log_data = {
            "event_type": "cache_operation",
            "operation": operation,
            "cache_key": key,
            "cache_hit": hit,
            "cache_size": size,
            "timestamp": datetime.now().isoformat()
        }
        
        performance_logger = logging.getLogger('performance')
        
        if operation == "get":
            status = "HIT" if hit else "MISS"
            performance_logger.debug(f"CACHE {status}: {key}")
        else:
            performance_logger.debug(f"CACHE {operation.upper()}: {key}")
    
    def _get_security_severity(self, event_type: str) -> str:
        """Determina severidade do evento de segurança"""
        high_severity = ['brute_force', 'sql_injection', 'xss_attempt', 'unauthorized_access']
        medium_severity = ['rate_limit_exceeded', 'suspicious_request', 'invalid_input']
        
        if event_type in high_severity:
            return "HIGH"
        elif event_type in medium_severity:
            return "MEDIUM"
        else:
            return "LOW"

# Instância global
production_logger = ProductionLogger()

# Funções de conveniência
def log_request(method: str, path: str, status_code: int, response_time_ms: float, 
               client_ip: str, user_agent: str = None):
    """Log de requisição HTTP"""
    production_logger.log_request(method, path, status_code, response_time_ms, 
                                 client_ip, user_agent)

def log_security_event(event_type: str, client_ip: str, details: Dict[str, Any]):
    """Log de evento de segurança"""
    production_logger.log_security_event(event_type, client_ip, details)

def log_performance_metric(metric_name: str, value: float, context: Dict[str, Any] = None):
    """Log de métrica de performance"""
    production_logger.log_performance_metric(metric_name, value, context)

def log_error(error: Exception, context: Dict[str, Any] = None, request_id: str = None):
    """Log de erro da aplicação"""
    production_logger.log_error(error, context, request_id)

def log_startup(config: Dict[str, Any]):
    """Log de inicialização"""
    production_logger.log_startup(config)

def log_cache_operation(operation: str, key: str, hit: bool = None, size: int = None):
    """Log de operação de cache"""
    production_logger.log_cache_operation(operation, key, hit, size)