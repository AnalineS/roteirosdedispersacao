# -*- coding: utf-8 -*-
"""
Google Cloud Operations Suite Integration
Centraliza logging, monitoring e error reporting
"""

import os
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime
from functools import wraps
import time

# Verificar se estamos no GCP
IS_CLOUD_RUN = os.getenv('K_SERVICE') is not None
PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'red-truck-468923-s4')
SERVICE_NAME = os.getenv('K_SERVICE', 'roteiro-dispensacao-api')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')

# Configurar logging estruturado para Cloud Logging
if IS_CLOUD_RUN:
    # No Cloud Run, logs JSON são automaticamente parseados
    import google.cloud.logging
    from google.cloud import monitoring_v3
    from google.cloud import error_reporting
    
    # Cliente de logging
    logging_client = google.cloud.logging.Client(project=PROJECT_ID)
    logging_client.setup_logging()
    
    # Cliente de monitoring
    monitoring_client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{PROJECT_ID}"
    
    # Cliente de error reporting
    error_client = error_reporting.Client(project=PROJECT_ID, service=SERVICE_NAME)
else:
    # Desenvolvimento local
    logging_client = None
    monitoring_client = None
    error_client = None

# Logger principal
logger = logging.getLogger(__name__)

class CloudObservability:
    """Classe principal para observabilidade com GCP Operations Suite"""
    
    @staticmethod
    def log_structured(level: str, message: str, **kwargs):
        """
        Log estruturado para Cloud Logging
        
        Args:
            level: Nível do log (INFO, WARNING, ERROR, CRITICAL)
            message: Mensagem do log
            **kwargs: Campos adicionais para o log estruturado
        """
        log_entry = {
            "message": message,
            "severity": level,
            "timestamp": datetime.utcnow().isoformat(),
            "service": SERVICE_NAME,
            "environment": ENVIRONMENT,
            **kwargs
        }
        
        if IS_CLOUD_RUN:
            # No Cloud Run, apenas imprimir JSON
            print(json.dumps(log_entry))
        else:
            # Desenvolvimento local
            getattr(logger, level.lower(), logger.info)(f"{message} | {kwargs}")
    
    @staticmethod
    def track_request(endpoint: str, method: str, status: int, duration_ms: float, **metadata):
        """
        Rastreia métricas de requisição
        
        Args:
            endpoint: Endpoint da API
            method: Método HTTP
            status: Status code da resposta
            duration_ms: Duração em millisegundos
            **metadata: Metadados adicionais
        """
        CloudObservability.log_structured(
            "INFO",
            f"Request completed: {method} {endpoint}",
            endpoint=endpoint,
            method=method,
            status=status,
            duration_ms=duration_ms,
            **metadata
        )
        
        # Enviar métrica customizada se no Cloud Run
        if IS_CLOUD_RUN and monitoring_client:
            try:
                # Criar série temporal
                series = monitoring_v3.TimeSeries()
                series.metric.type = f"custom.googleapis.com/{SERVICE_NAME}/request_latency"
                series.metric.labels["endpoint"] = endpoint
                series.metric.labels["method"] = method
                series.metric.labels["status"] = str(status)
                
                # Adicionar ponto de dados
                now = time.time()
                point = series.points.add()
                point.value.double_value = duration_ms
                point.interval.end_time.seconds = int(now)
                point.interval.end_time.nanos = int((now - int(now)) * 10**9)
                
                # Enviar métrica
                monitoring_client.create_time_series(
                    name=project_name,
                    time_series=[series]
                )
            except Exception as e:
                logger.warning(f"Failed to send metric: {e}")
    
    @staticmethod
    def report_error(exception: Exception, context: Optional[Dict[str, Any]] = None):
        """
        Reporta erro para Error Reporting
        
        Args:
            exception: Exceção capturada
            context: Contexto adicional do erro
        """
        error_message = str(exception)
        error_type = type(exception).__name__
        
        CloudObservability.log_structured(
            "ERROR",
            f"Error occurred: {error_type}",
            error_message=error_message,
            error_type=error_type,
            context=context or {}
        )
        
        if IS_CLOUD_RUN and error_client:
            try:
                error_client.report_exception()
            except Exception as e:
                logger.warning(f"Failed to report error: {e}")
    
    @staticmethod
    def track_persona_usage(persona: str, response_time: float, tokens_used: int, success: bool):
        """
        Rastreia uso das personas (métrica de negócio)
        
        Args:
            persona: Nome da persona (gasnelio/ga)
            response_time: Tempo de resposta em segundos
            tokens_used: Tokens utilizados
            success: Se a resposta foi bem sucedida
        """
        CloudObservability.log_structured(
            "INFO",
            f"Persona usage: {persona}",
            persona=persona,
            response_time_ms=response_time * 1000,
            tokens_used=tokens_used,
            success=success,
            metric_type="persona_usage"
        )
    
    @staticmethod
    def track_educational_progress(user_id: str, module: str, progress: float, completed: bool):
        """
        Rastreia progresso educacional (métrica de negócio)
        
        Args:
            user_id: ID do usuário
            module: Módulo educacional
            progress: Progresso (0-100)
            completed: Se o módulo foi completado
        """
        CloudObservability.log_structured(
            "INFO",
            f"Educational progress: {module}",
            user_id=user_id,
            module=module,
            progress=progress,
            completed=completed,
            metric_type="educational_progress"
        )

def monitor_endpoint(func):
    """
    Decorator para monitorar endpoints automaticamente
    
    Uso:
        @monitor_endpoint
        def minha_funcao():
            return response
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        endpoint = func.__name__
        
        try:
            result = func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            
            # Extrair status code se possível
            status = getattr(result, 'status_code', 200) if hasattr(result, 'status_code') else 200
            
            CloudObservability.track_request(
                endpoint=endpoint,
                method=kwargs.get('method', 'GET'),
                status=status,
                duration_ms=duration_ms
            )
            
            return result
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            CloudObservability.track_request(
                endpoint=endpoint,
                method=kwargs.get('method', 'GET'),
                status=500,
                duration_ms=duration_ms,
                error=str(e)
            )
            
            CloudObservability.report_error(e, {
                'endpoint': endpoint,
                'args': str(args),
                'kwargs': str(kwargs)
            })
            
            raise
    
    return wrapper

# Configurar handlers customizados para logging
class GCPLogHandler(logging.Handler):
    """Handler customizado para enviar logs estruturados ao GCP"""
    
    def emit(self, record):
        try:
            CloudObservability.log_structured(
                record.levelname,
                record.getMessage(),
                logger_name=record.name,
                filename=record.filename,
                line_number=record.lineno,
                function_name=record.funcName
            )
        except Exception:
            self.handleError(record)

# Adicionar handler ao root logger se no Cloud Run
if IS_CLOUD_RUN:
    root_logger = logging.getLogger()
    root_logger.addHandler(GCPLogHandler())
    root_logger.setLevel(logging.INFO)