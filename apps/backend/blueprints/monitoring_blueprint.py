# -*- coding: utf-8 -*-
"""
Monitoring Blueprint - Gerencia métricas, estatísticas e monitoramento
Migrado do main.py para modularização
"""

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import logging
import os
from typing import Dict, List, Any, Optional

# Import dependências
from core.dependencies import get_cache, get_rag, get_qa, get_config

# Import secure logging
from core.security.secure_logging import (
    sanitize_for_logging,
    log_error_safely,
    get_safe_error_message
)

# Import UX Monitoring Manager
try:
    from services.monitoring.ux_monitoring_manager import get_ux_monitoring_manager, get_ux_dashboard_data
    UX_MONITORING_AVAILABLE = True
except ImportError:
    UX_MONITORING_AVAILABLE = False

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
monitoring_bp = Blueprint('monitoring', __name__, url_prefix='/api/v1')

class UsabilityMonitor:
    """Monitor de usabilidade temporário (será substituído por sistema real)"""
    
    def get_comprehensive_report(self) -> Dict[str, Any]:
        """Retorna relatório básico de usabilidade"""
        cache = get_cache()
        
        # Obter estatísticas de feedback se disponível
        feedback_stats = None
        if cache:
            feedback_stats = cache.get("feedback:stats")
        
        return {
            "status": "operational",
            "response_time_avg": "500ms",  # Será calculado dinamicamente
            "user_satisfaction": self._calculate_satisfaction(feedback_stats),
            "system_health": "good",
            "performance_metrics": {
                "api_latency": "450ms",
                "cache_hit_rate": "75%",
                "error_rate": "2%"
            },
            "user_engagement": {
                "active_sessions": 0,  # Será implementado
                "questions_per_session": 3.2,
                "bounce_rate": "15%"
            }
        }
    
    def _calculate_satisfaction(self, feedback_stats: Optional[Dict]) -> str:
        """Calcula satisfação baseada em feedback"""
        if not feedback_stats or feedback_stats.get('total_count', 0) == 0:
            return "N/A"
        
        avg_rating = feedback_stats.get('average_rating', 0)
        if avg_rating >= 4.0:
            return "Excelente"
        elif avg_rating >= 3.5:
            return "Boa"
        elif avg_rating >= 3.0:
            return "Regular"
        else:
            return "Baixa"

# Instância global do monitor
usability_monitor = UsabilityMonitor()

def get_cache_stats() -> Dict[str, Any]:
    """Obter estatísticas do cache"""
    cache = get_cache()
    if not cache:
        return {"status": "unavailable"}
    
    stats = cache.get_stats() if hasattr(cache, 'get_stats') else {}
    
    return {
        "status": "available",
        "type": "advanced" if hasattr(cache, 'get_stats') else "simple",
        **stats
    }

def get_system_metrics() -> Dict[str, Any]:
    """Coleta métricas do sistema"""
    try:
        import psutil
        
        metrics = {
            "cpu": {
                "usage_percent": psutil.cpu_percent(interval=1),
                "cores": psutil.cpu_count(),
                "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None
            },
            "memory": {
                "total_mb": round(psutil.virtual_memory().total / 1024 / 1024),
                "available_mb": round(psutil.virtual_memory().available / 1024 / 1024),
                "usage_percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total_gb": round(psutil.disk_usage('/').total / 1024 / 1024 / 1024),
                "free_gb": round(psutil.disk_usage('/').free / 1024 / 1024 / 1024),
                "usage_percent": psutil.disk_usage('/').percent
            } if os.path.exists('/') else None
        }
        
        return metrics
        
    except ImportError:
        return {"error": "psutil não disponível"}
    except Exception as e:
        log_error_safely(logger, "Erro ao coletar métricas do sistema", exception=e)
        return {"error": "Erro ao coletar métricas"}

def get_application_metrics() -> Dict[str, Any]:
    """Métricas específicas da aplicação"""
    cache = get_cache()
    config = get_config()
    
    # Estatísticas de feedback
    feedback_stats = cache.get("feedback:stats") if cache else None
    
    # Métricas simuladas (serão reais com persistence layer)
    metrics = {
        "requests": {
            "total_today": 0,  # Será implementado
            "chat_requests": 0,
            "persona_requests": 0,
            "feedback_submissions": feedback_stats.get('total_count', 0) if feedback_stats else 0
        },
        "performance": {
            "average_response_time_ms": 450,  # Será calculado
            "p95_response_time_ms": 800,
            "error_rate_percent": 2.1
        },
        "usage": {
            "most_used_persona": "dr_gasnelio",  # Será calculado
            "peak_hour": "14:00-15:00",
            "average_question_length": 85
        },
        "quality": {
            "average_qa_score": 0.92 if config and config.QA_ENABLED else None,
            "questions_retried_percent": 5.2,
            "fallback_responses_percent": 8.1
        }
    }
    
    return metrics

@monitoring_bp.route('/stats', methods=['GET'])
def get_system_stats():
    """Endpoint para estatísticas completas do sistema"""
    try:
        request_id = f"stats_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de estatísticas do sistema")
        
        # Coletar todas as estatísticas
        cache_stats = get_cache_stats()
        system_metrics = get_system_metrics()
        app_metrics = get_application_metrics()
        
        # Obter informações dos serviços
        rag_service = get_rag()
        qa_framework = get_qa()
        config = get_config()
        
        response = {
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id,
            "system": system_metrics,
            "cache": cache_stats,
            "application": app_metrics,
            "services": {
                "rag": {
                    "status": "available" if rag_service else "unavailable",
                    "type": "enhanced" if rag_service and hasattr(rag_service, 'use_enhanced') else "basic"
                },
                "qa_framework": {
                    "status": "available" if qa_framework else "unavailable",
                    "enabled": config.QA_ENABLED if config else False,
                    "min_score": config.QA_MIN_SCORE if config else None
                },
                "personas": {
                    "available": ["dr_gasnelio", "ga"],
                    "total": 2
                }
            },
            "environment": {
                "name": os.getenv('ENVIRONMENT', 'development'),
                "debug": config.DEBUG if config else False,
                "version": "blueprint_v1.0"
            }
        }
        
        logger.info(f"[{request_id}] Estatísticas retornadas com sucesso")
        return jsonify(response), 200
        
    except Exception as e:
        log_error_safely(logger, "Erro ao obter estatísticas", exception=e, request_id=request_id)
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "STATS_ERROR",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@monitoring_bp.route('/usability/monitor', methods=['GET'])
def usability_monitoring():
    """Endpoint para monitoramento de usabilidade - INTEGRADO COM UX MONITORING"""
    try:
        request_id = f"usability_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Relatório de usabilidade solicitado")
        
        # Usar UX Monitoring Manager se disponível
        if UX_MONITORING_AVAILABLE:
            ux_manager = get_ux_monitoring_manager()
            if ux_manager:
                dashboard_data = ux_manager.get_dashboard_data()
                
                response = {
                    "usability_report": dashboard_data,
                    "metadata": {
                        "request_id": request_id,
                        "timestamp": datetime.now().isoformat(),
                        "source": "ux_monitoring_manager",
                        "version": "2.0_integrated"
                    },
                    "report_version": "1.0",
                    "data_collection_period": "last_24_hours",
                    "recommendations": [
                        "Monitor response times to keep under 500ms",
                        "Maintain user satisfaction above 80%",
                        "Keep error rate below 5%",
                        "Monitor cache hit rate for performance"
                    ]
                }
        
        logger.info(f"[{request_id}] Relatório de usabilidade gerado")
        return jsonify(response), 200
        
    except Exception as e:
        log_error_safely(logger, "Erro no monitoramento de usabilidade", exception=e, request_id=request_id)
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "USABILITY_ERROR",
            "request_id": request_id
        }), 500

@monitoring_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Endpoint para métricas em formato compatível com Google Cloud Monitoring"""
    try:
        request_id = f"metrics_{int(datetime.now().timestamp() * 1000)}"
        
        # Retornamos JSON compatível com Google Cloud Monitoring
        cache = get_cache()
        config = get_config()
        
        # Métricas no formato Cloud Monitoring
        cache_hit_rate = 0
        if cache and hasattr(cache, 'get_stats'):
            cache_hit_rate = cache.get_stats().get('hit_rate', 0)
        
        metrics = {
            "medical_platform/http_requests_total": {
                "method_GET_endpoint_api_chat": 0,
                "method_POST_endpoint_api_chat": 0
            },
            "medical_platform/cache_hit_rate": cache_hit_rate,
            "medical_platform/response_time_ms": {
                "sum": 0,
                "count": 0
            }
        }
        
        response = {
            "format": "google_cloud_monitoring",
            "metrics": metrics,
            "resource_type": "cloud_run_revision",
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        log_error_safely(logger, "Erro ao obter métricas", exception=e, request_id=request_id)
        return jsonify({
            "error": "Erro interno do servidor",
            "request_id": request_id
        }), 500

@monitoring_bp.route('/debug', methods=['GET'])
def debug_info():
    """Endpoint para informações de debug (apenas em desenvolvimento)"""
    try:
        config = get_config()
        
        # Verificar se é ambiente de desenvolvimento
        if not config or not config.DEBUG:
            return jsonify({
                "error": "Endpoint de debug não disponível em produção",
                "environment": os.getenv('ENVIRONMENT', 'production')
            }), 403
        
        request_id = f"debug_{int(datetime.now().timestamp() * 1000)}"
        
        # Informações de debug
        debug_info = {
            "environment": os.getenv('ENVIRONMENT'),
            "python_version": os.sys.version,
            "working_directory": os.getcwd(),
            "environment_variables": {
                key: "***" if "key" in key.lower() or "secret" in key.lower() else value
                for key, value in os.environ.items()
                if not any(sensitive in key.lower() for sensitive in ['key', 'secret', 'password', 'token'])
            },
            "loaded_modules": list(os.sys.modules.keys())[:20],  # Primeiros 20
            "request_headers": dict(request.headers),
            "cache_available": bool(get_cache()),
            "rag_available": bool(get_rag()),
            "qa_available": bool(get_qa()),
            "config_loaded": bool(config)
        }
        
        response = {
            "debug_info": debug_info,
            "warning": "Este endpoint só deve ser usado em desenvolvimento",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        log_error_safely(logger, "Erro no endpoint de debug", exception=e)
        return jsonify({
            "error": "Erro interno do servidor"
        }), 500

@monitoring_bp.route('/monitoring/health', methods=['GET'])
def monitoring_health():
    """Health check específico do serviço de monitoring"""
    cache = get_cache()
    
    status = {
        "service": "monitoring",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "cache": "available" if cache else "unavailable",
            "system_metrics": "available",
            "usability_monitor": "available"
        },
        "endpoints": [
            "/api/stats",
            "/api/usability/monitor", 
            "/api/metrics",
            "/api/debug"
        ]
    }
    
    return jsonify(status), 200