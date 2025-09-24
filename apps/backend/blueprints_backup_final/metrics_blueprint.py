# -*- coding: utf-8 -*-
"""
Metrics Blueprint - Endpoints para métricas e monitoramento de performance
Integrado com sistema avançado de logging e alertas
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
import logging
from typing import Dict, Any

# Import sistemas de métricas e logging
try:
    from core.metrics.performance_monitor import performance_monitor, get_current_metrics
    from core.logging.advanced_logger import get_logging_metrics, log_security_event
    METRICS_AVAILABLE = True
except ImportError:
    METRICS_AVAILABLE = False

# Import dependências existentes
from core.dependencies import get_config

# Google Cloud Monitoring integration
try:
    from google.cloud import monitoring_v3
    from google.cloud import logging as cloud_logging
    GOOGLE_CLOUD_AVAILABLE = True
except ImportError:
    GOOGLE_CLOUD_AVAILABLE = False

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
metrics_bp = Blueprint('metrics', __name__, url_prefix='/api/v1')

@metrics_bp.route('/metrics', methods=['GET'])
def get_system_metrics():
    """Endpoint principal para métricas do sistema"""
    try:
        request_id = f"metrics_{int(datetime.now().timestamp() * 1000)}"
        
        if not METRICS_AVAILABLE:
            return jsonify({
                "error": "Sistema de métricas não disponível",
                "request_id": request_id,
                "timestamp": datetime.now().isoformat()
            }), 503
        
        # Coletar métricas
        current_metrics = get_current_metrics()
        logging_metrics = get_logging_metrics()
        
        # Combinar métricas
        combined_metrics = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "performance": current_metrics,
            "logging": logging_metrics,
            "service_status": {
                "healthy": True,
                "version": "blueprint_v1.0",
                "environment": get_config().DEBUG if get_config() else "unknown"
            }
        }
        
        logger.info(f"[{request_id}] Métricas do sistema solicitadas")
        return jsonify(combined_metrics), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter métricas: {e}")
        return jsonify({
            "error": "Erro interno ao obter métricas",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@metrics_bp.route('/metrics/performance', methods=['GET'])
def get_performance_metrics():
    """Métricas específicas de performance"""
    try:
        request_id = f"perf_metrics_{int(datetime.now().timestamp() * 1000)}"
        
        if not METRICS_AVAILABLE:
            return jsonify({"error": "Métricas não disponíveis"}), 503
        
        # Parâmetros de consulta
        hours = int(request.args.get('hours', 1))
        include_history = request.args.get('history', 'false').lower() == 'true'
        include_rankings = request.args.get('rankings', 'false').lower() == 'true'
        
        response_data = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "current": performance_monitor.get_current_metrics()
        }
        
        if include_history:
            response_data["history"] = performance_monitor.get_performance_history(hours)
        
        if include_rankings:
            response_data["rankings"] = performance_monitor.get_endpoint_rankings()
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas de performance: {e}")
        return jsonify({"error": "Erro interno"}), 500

@metrics_bp.route('/metrics/endpoints', methods=['GET'])
def get_endpoint_metrics():
    """Métricas específicas por endpoint"""
    try:
        request_id = f"endpoint_metrics_{int(datetime.now().timestamp() * 1000)}"
        
        if not METRICS_AVAILABLE:
            return jsonify({"error": "Métricas não disponíveis"}), 503
        
        current_metrics = performance_monitor.get_current_metrics()
        rankings = performance_monitor.get_endpoint_rankings()
        
        response_data = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "endpoints": current_metrics.get("endpoints", {}),
            "summary": {
                "total_endpoints": len(current_metrics.get("endpoints", {})),
                "total_requests": sum(
                    ep.get("request_count", 0) 
                    for ep in current_metrics.get("endpoints", {}).values()
                ),
                "average_response_time": sum(
                    ep.get("avg_response_time_ms", 0) 
                    for ep in current_metrics.get("endpoints", {}).values()
                ) / max(len(current_metrics.get("endpoints", {})), 1)
            },
            "rankings": rankings
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas de endpoints: {e}")
        return jsonify({"error": "Erro interno"}), 500

@metrics_bp.route('/metrics/ai', methods=['GET'])  
def get_ai_metrics():
    """Métricas específicas do sistema de IA"""
    try:
        request_id = f"ai_metrics_{int(datetime.now().timestamp() * 1000)}"
        
        if not METRICS_AVAILABLE:
            return jsonify({"error": "Métricas não disponíveis"}), 503
        
        current_metrics = performance_monitor.get_current_metrics()
        ai_metrics = current_metrics.get("ai_metrics", {})
        
        # Adicionar métricas derivadas
        total_persona_requests = (
            ai_metrics.get("persona_dr_gasnelio_requests", 0) + 
            ai_metrics.get("persona_ga_requests", 0)
        )
        
        persona_distribution = {}
        if total_persona_requests > 0:
            persona_distribution = {
                "dr_gasnelio": (
                    ai_metrics.get("persona_dr_gasnelio_requests", 0) / total_persona_requests
                ) * 100,
                "ga": (
                    ai_metrics.get("persona_ga_requests", 0) / total_persona_requests  
                ) * 100
            }
        
        response_data = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "ai_metrics": ai_metrics,
            "analysis": {
                "total_persona_requests": total_persona_requests,
                "persona_distribution_percent": persona_distribution,
                "qa_efficiency": {
                    "avg_score": ai_metrics.get("qa_avg_score", 0),
                    "total_validations": ai_metrics.get("qa_validations_count", 0)
                },
                "rag_performance": {
                    "total_queries": ai_metrics.get("rag_queries_count", 0),
                    "avg_response_time_ms": ai_metrics.get("rag_avg_response_time_ms", 0),
                    "cache_hit_rate_percent": ai_metrics.get("cache_hit_rate", 0)
                }
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas de IA: {e}")
        return jsonify({"error": "Erro interno"}), 500

@metrics_bp.route('/metrics/export', methods=['POST'])
def export_metrics():
    """Exporta métricas completas para análise"""
    try:
        request_id = f"export_{int(datetime.now().timestamp() * 1000)}"
        
        if not METRICS_AVAILABLE:
            return jsonify({"error": "Sistema de exportação não disponível"}), 503
        
        # Log de segurança para exportação
        log_security_event(
            event_type="metrics_export_requested",
            details={
                "client_ip": request.remote_addr,
                "user_agent": request.headers.get('User-Agent', 'unknown'),
                "request_id": request_id
            },
            severity="INFO",
            request_id=request_id
        )
        
        # Gerar nome do arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"logs/metrics_export_{timestamp}.json"
        
        # Exportar métricas
        performance_monitor.export_metrics_json(filename)
        
        return jsonify({
            "success": True,
            "message": "Métricas exportadas com sucesso",
            "filename": filename,
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao exportar métricas: {e}")
        return jsonify({
            "error": "Erro interno na exportação",
            "request_id": request_id
        }), 500

@metrics_bp.route('/metrics/alerts', methods=['GET', 'POST'])
def manage_alerts():
    """Gerenciamento de alertas do sistema"""
    try:
        request_id = f"alerts_{int(datetime.now().timestamp() * 1000)}"
        
        if request.method == 'GET':
            # Retornar configuração atual de alertas
            if not METRICS_AVAILABLE:
                return jsonify({"error": "Sistema de alertas não disponível"}), 503
            
            alert_config = {
                "thresholds": performance_monitor.alert_thresholds,
                "callbacks_registered": len(performance_monitor.alert_callbacks),
                "monitoring_active": True
            }
            
            return jsonify({
                "request_id": request_id,
                "timestamp": datetime.now().isoformat(),
                "alert_configuration": alert_config
            }), 200
        
        # POST - Configurar alertas
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json()
        action = data.get('action', '')
        
        if action == 'test_alert':
            # Disparar alerta de teste
            performance_monitor._trigger_alert('test_alert', {
                "message": "Este é um alerta de teste",
                "triggered_by": request.remote_addr,
                "request_id": request_id
            })
            
            return jsonify({
                "success": True,
                "message": "Alerta de teste disparado",
                "request_id": request_id
            }), 200
        
        elif action == 'update_thresholds':
            # Atualizar thresholds de alerta
            new_thresholds = data.get('thresholds', {})
            
            for key, value in new_thresholds.items():
                if key in performance_monitor.alert_thresholds:
                    performance_monitor.alert_thresholds[key] = float(value)
            
            # Log de segurança para mudança de configuração
            log_security_event(
                event_type="alert_thresholds_updated",
                details={
                    "updated_thresholds": new_thresholds,
                    "client_ip": request.remote_addr,
                    "request_id": request_id
                },
                severity="INFO",
                request_id=request_id
            )
            
            return jsonify({
                "success": True,
                "message": "Thresholds de alerta atualizados",
                "current_thresholds": performance_monitor.alert_thresholds,
                "request_id": request_id
            }), 200
        
        else:
            return jsonify({
                "error": "Ação não reconhecida",
                "valid_actions": ["test_alert", "update_thresholds"],
                "request_id": request_id
            }), 400
        
    except Exception as e:
        logger.error(f"Erro no gerenciamento de alertas: {e}")
        return jsonify({
            "error": "Erro interno no sistema de alertas",
            "request_id": request_id
        }), 500

@metrics_bp.route('/metrics/health', methods=['GET'])
def metrics_health_check():
    """Health check específico do sistema de métricas"""
    try:
        request_id = f"metrics_health_{int(datetime.now().timestamp() * 1000)}"
        
        health_status = {
            "metrics_system": METRICS_AVAILABLE,
            "performance_monitor": False,
            "logging_system": False,
            "alert_system": False
        }
        
        # Verificar sistemas
        if METRICS_AVAILABLE:
            try:
                # Testar performance monitor
                current_metrics = performance_monitor.get_current_metrics()
                health_status["performance_monitor"] = bool(current_metrics)
                
                # Testar sistema de logging  
                logging_metrics = get_logging_metrics()
                health_status["logging_system"] = bool(logging_metrics)
                
                # Testar sistema de alertas
                health_status["alert_system"] = len(performance_monitor.alert_callbacks) > 0
                
            except Exception as e:
                logger.warning(f"Erro na verificação de saúde das métricas: {e}")
        
        overall_health = all(health_status.values())
        
        return jsonify({
            "healthy": overall_health,
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "components": health_status,
            "message": "Todos os sistemas operacionais" if overall_health else "Alguns sistemas com problemas"
        }), 200 if overall_health else 503
        
    except Exception as e:
        logger.error(f"Erro no health check de métricas: {e}")
        return jsonify({
            "healthy": False,
            "error": "Erro interno no health check",
            "request_id": request_id
        }), 500

# Integração com sistema de métricas existente
if METRICS_AVAILABLE:
    # Registrar callback para logs de alertas médicos
    def medical_alert_callback(alert_type: str, details: Dict[str, Any]):
        """Callback especializado para alertas médicos"""
        # Log específico para alertas do sistema médico
        logger.warning(f"[ALERT] ALERTA MÉDICO [{alert_type}]: {details}")
        
        # Log de segurança para alertas críticos
        if alert_type in ['high_error_rate', 'slow_endpoint', 'high_cpu_usage']:
            log_security_event(
                event_type=f"critical_system_alert_{alert_type}",
                details=details,
                severity="WARNING"
            )
    
    # Registrar o callback
    performance_monitor.add_alert_callback(medical_alert_callback)

@metrics_bp.route('/metrics/cloud', methods=['GET'])
def cloud_metrics():
    """Endpoint para métricas compatíveis com Google Cloud Monitoring"""
    try:
        if not GOOGLE_CLOUD_AVAILABLE:
            return jsonify({
                "error": "Google Cloud Monitoring not available",
                "message": "Install google-cloud-monitoring package"
            }), 503
        
        # Obter métricas no formato compatível com Cloud Monitoring
        current_metrics = get_current_metrics()
        
        # Transformar para formato Cloud Monitoring
        cloud_metrics_data = {
            "metrics": {
                "medical_platform/requests_total": current_metrics.get("endpoints", {}),
                "medical_platform/response_time_ms": current_metrics.get("system", {}).get("uptime_seconds", 0),
                "medical_platform/cpu_usage": current_metrics.get("system", {}).get("cpu_usage_percent", 0),
                "medical_platform/memory_usage": current_metrics.get("system", {}).get("memory_usage_percent", 0),
                "medical_platform/ai_requests": current_metrics.get("ai_metrics", {})
            },
            "timestamp": datetime.now().isoformat(),
            "format": "google_cloud_monitoring"
        }
        
        return jsonify(cloud_metrics_data), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas Cloud: {e}")
        return jsonify({
            "error": "Error retrieving Cloud metrics",
            "details": str(e)
        }), 500