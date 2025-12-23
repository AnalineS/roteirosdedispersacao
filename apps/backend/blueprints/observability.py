# -*- coding: utf-8 -*-
"""
Observability Blueprint - GCP Operations Suite Integration
Endpoints para receber logs e métricas do frontend e forward para GCP
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import logging
import os

# Import GCP observability
try:
    from core.observability.gcp_operations import CloudObservability
    GCP_OBSERVABILITY_AVAILABLE = True
except ImportError:
    GCP_OBSERVABILITY_AVAILABLE = False
    CloudObservability = None

logger = logging.getLogger(__name__)

observability_bp = Blueprint('observability', __name__, url_prefix='/api/v1/observability')

@observability_bp.route('/logs', methods=['POST'])
def receive_frontend_logs():
    """
    Recebe logs do frontend e forwards para GCP Cloud Logging
    """
    try:
        data = request.get_json()
        
        if not data or 'logs' not in data:
            return jsonify({
                "error": "Invalid payload - 'logs' field required",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 400
        
        logs = data['logs']
        if not isinstance(logs, list):
            return jsonify({
                "error": "Logs must be an array",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 400
        
        processed_count = 0
        
        for log_entry in logs:
            try:
                # Validar campos obrigatórios
                if not all(key in log_entry for key in ['severity', 'message', 'timestamp', 'component']):
                    logger.warning(f"Invalid log entry: {log_entry}")
                    continue
                
                # Forward para GCP se disponível
                if GCP_OBSERVABILITY_AVAILABLE and CloudObservability:
                    CloudObservability.log_structured(
                        log_entry['severity'],
                        log_entry['message'],
                        component=log_entry['component'],
                        user_id=log_entry.get('userId'),
                        frontend_timestamp=log_entry['timestamp'],
                        metadata=log_entry.get('metadata', {})
                    )
                else:
                    # Fallback para log local
                    logger.info(f"[{log_entry['severity']}] {log_entry['message']} - {log_entry.get('metadata', {})}")
                
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing log entry: {e}")
                continue
        
        return jsonify({
            "status": "success",
            "processed": processed_count,
            "total": len(logs),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing frontend logs: {e}")
        return jsonify({
            "error": "Internal server error",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@observability_bp.route('/metrics', methods=['POST'])
def receive_frontend_metrics():
    """
    Recebe métricas do frontend e forwards para GCP Cloud Monitoring
    """
    try:
        data = request.get_json()
        
        if not data or 'metrics' not in data:
            return jsonify({
                "error": "Invalid payload - 'metrics' field required",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 400
        
        metrics = data['metrics']
        if not isinstance(metrics, list):
            return jsonify({
                "error": "Metrics must be an array",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 400
        
        processed_count = 0
        
        for metric in metrics:
            try:
                # Validar campos obrigatórios
                if not all(key in metric for key in ['name', 'value', 'labels', 'timestamp']):
                    logger.warning(f"Invalid metric: {metric}")
                    continue
                
                # Forward métricas específicas para GCP
                metric_name = metric['name']
                metric_value = float(metric['value'])
                labels = metric['labels']
                
                if GCP_OBSERVABILITY_AVAILABLE and CloudObservability:
                    # Mapear métricas do frontend para handlers específicos
                    if metric_name == 'persona_interaction':
                        CloudObservability.track_persona_usage(
                            persona=labels.get('persona', 'unknown'),
                            response_time=metric_value / 1000,  # Convert ms to seconds
                            tokens_used=labels.get('tokens', 0),
                            success=labels.get('success', 'true') == 'true'
                        )
                    elif metric_name == 'educational_progress':
                        CloudObservability.track_educational_progress(
                            user_id=labels.get('user_id', 'anonymous'),
                            module=labels.get('module', 'unknown'),
                            progress=metric_value,
                            completed=labels.get('completed', 'false') == 'true'
                        )
                    elif metric_name in ['page_load_time', 'dom_ready_time', 'first_paint_time']:
                        # Log performance metrics
                        CloudObservability.log_structured(
                            "INFO",
                            f"Frontend performance: {metric_name}",
                            metric_name=metric_name,
                            value_ms=metric_value,
                            page=labels.get('page', 'unknown'),
                            metric_type="performance"
                        )
                    else:
                        # Generic metric logging
                        CloudObservability.log_structured(
                            "INFO",
                            f"Frontend metric: {metric_name}",
                            metric_name=metric_name,
                            value=metric_value,
                            labels=labels,
                            metric_type="frontend_metric"
                        )
                else:
                    # Fallback para log local
                    logger.info(f"Metric: {metric_name}={metric_value} {labels}")
                
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing metric: {e}")
                continue
        
        return jsonify({
            "status": "success",
            "processed": processed_count,
            "total": len(metrics),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing frontend metrics: {e}")
        return jsonify({
            "error": "Internal server error",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@observability_bp.route('/health', methods=['GET'])
def observability_health():
    """
    Health check para o sistema de observabilidade
    """
    status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "gcp_operations": GCP_OBSERVABILITY_AVAILABLE,
            "logging": True,
            "metrics_collection": True
        }
    }
    
    if GCP_OBSERVABILITY_AVAILABLE:
        status["gcp_project"] = "configured"
        status["cloud_run"] = "detected" if os.environ.get('K_SERVICE') else "local"
    else:
        status["fallback_mode"] = "local_logging"
    
    return jsonify(status), 200

@observability_bp.route('/test', methods=['POST'])
def test_observability():
    """
    Endpoint para testar a integração de observabilidade
    Usado apenas em desenvolvimento
    """
    try:
        # Testar log
        if GCP_OBSERVABILITY_AVAILABLE and CloudObservability:
            CloudObservability.log_structured(
                "INFO",
                "Test log from observability endpoint",
                test=True,
                component="backend_test"
            )
            
            # Testar métrica de persona
            CloudObservability.track_persona_usage(
                persona="gasnelio",
                response_time=1.5,
                tokens_used=100,
                success=True
            )
            
            return jsonify({
                "status": "success",
                "message": "Test logs and metrics sent to GCP",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 200
        else:
            return jsonify({
                "status": "fallback",
                "message": "GCP not available - using local logging",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }), 200
            
    except Exception as e:
        logger.error(f"Error in observability test: {e}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500