"""
Blueprint para endpoints de logging Cloud
Recebe logs do frontend e processa com compliance LGPD
"""

from flask import Blueprint, request, jsonify, current_app
import asyncio
from datetime import datetime, timezone
import hashlib
import json

from core.logging.cloud_logger import cloud_logger
from core.alerts.notification_system import alert_manager
from utils.auth_utils import require_auth

logging_bp = Blueprint('logging', __name__, url_prefix='/api/logging')

@logging_bp.route('/cloud', methods=['POST'])
def receive_frontend_log():
    """
    Recebe logs do frontend e processa com Cloud Logging
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validar campos obrigatórios
        required_fields = ['level', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Extrair dados
        level = data['level'].upper()
        message = data['message']
        context = data.get('context', {})
        category = data.get('category', 'system')
        user_id = data.get('userId')
        session_id = data.get('sessionId')

        # Adicionar metadados do frontend
        frontend_context = {
            **context,
            'source': 'frontend',
            'session_id': session_id,
            'user_agent': data.get('userAgent'),
            'timestamp_frontend': data.get('timestamp'),
            'frontend_url': request.referrer,
            'ip_address': request.remote_addr  # Será mascarado pelo CloudLogger
        }

        # Enviar para CloudLogger baseado no nível
        if level == 'DEBUG':
            cloud_logger.debug(message, frontend_context, user_id)
        elif level == 'INFO':
            cloud_logger.info(message, frontend_context, user_id)
        elif level == 'WARNING':
            cloud_logger.warning(message, frontend_context, user_id)
        elif level == 'ERROR':
            cloud_logger.error(message, frontend_context, user_id)
        elif level == 'CRITICAL':
            cloud_logger.critical(message, frontend_context, user_id)

            # Alertar para logs críticos
            asyncio.create_task(alert_manager.send_alert(
                alert_type='system_error',
                severity='high',
                title='Critical Frontend Error',
                message=f'Critical error in frontend: {message}',
                details=frontend_context,
                user_id=user_id
            ))

        # Gerar ID único para o log
        log_id = f"frontend_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{hash(message) % 10000:04d}"

        return jsonify({
            "success": True,
            "logId": log_id,
            "message": "Log processed successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Error processing frontend log: {e}")
        return jsonify({"error": "Internal server error"}), 500

@logging_bp.route('/lgpd-event', methods=['POST'])
def log_lgpd_event():
    """
    Endpoint específico para eventos LGPD
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        action = data.get('action')
        user_id = data.get('userId')
        details = data.get('details', {})

        if not action or not user_id:
            return jsonify({"error": "Missing action or userId"}), 400

        # Log do evento LGPD
        cloud_logger.lgpd_event(action, user_id, {
            **details,
            'source': 'frontend',
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '').substring(0, 100)
        })

        # Verificar se é violação
        violation_actions = [
            'unauthorized_access',
            'data_breach',
            'consent_violation',
            'retention_violation'
        ]

        if action in violation_actions:
            asyncio.create_task(alert_manager.lgpd_violation(
                action,
                details,
                user_id
            ))

        return jsonify({
            "success": True,
            "message": f"LGPD event '{action}' logged successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Error logging LGPD event: {e}")
        return jsonify({"error": "Internal server error"}), 500

@logging_bp.route('/medical-interaction', methods=['POST'])
def log_medical_interaction():
    """
    Log específico para interações médicas (dados sensíveis)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        persona = data.get('persona')
        query_hash = data.get('queryHash')  # Hash da query, não o conteúdo
        response_time = data.get('responseTime', 0)
        user_id = data.get('userId')

        if not all([persona, query_hash, user_id]):
            return jsonify({"error": "Missing required fields"}), 400

        # Log da interação médica
        cloud_logger.medical_interaction(
            persona,
            query_hash,
            user_id,
            response_time
        )

        return jsonify({
            "success": True,
            "message": "Medical interaction logged successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Error logging medical interaction: {e}")
        return jsonify({"error": "Internal server error"}), 500

@logging_bp.route('/analytics', methods=['POST'])
def log_analytics_event():
    """
    Log para eventos de analytics (dados anônimos)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_type = data.get('eventType')
        properties = data.get('properties', {})

        if not event_type:
            return jsonify({"error": "Missing eventType"}), 400

        # Adicionar contexto do request
        analytics_properties = {
            **properties,
            'source': 'frontend',
            'ip_hash': hashlib.md5(request.remote_addr.encode()).hexdigest()[:8],
            'user_agent_hash': hashlib.md5(
                request.headers.get('User-Agent', '').encode()
            ).hexdigest()[:8],
            'referrer': request.referrer
        }

        # Log do evento analytics
        cloud_logger.analytics_event(event_type, analytics_properties)

        return jsonify({
            "success": True,
            "message": f"Analytics event '{event_type}' logged successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Error logging analytics event: {e}")
        return jsonify({"error": "Internal server error"}), 500

@logging_bp.route('/health', methods=['GET'])
def logging_health_check():
    """
    Health check para sistema de logging
    """
    try:
        # Verificar componentes
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "components": {
                "cloud_logger": "healthy",
                "alert_manager": "healthy"
            }
        }

        # Testar CloudLogger
        try:
            cloud_logger.info("Health check test", {"test": True})
            health_status["components"]["cloud_logger"] = "healthy"
        except Exception as e:
            health_status["components"]["cloud_logger"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"

        # Testar AlertManager
        try:
            stats = alert_manager.get_alert_stats()
            health_status["components"]["alert_manager"] = "healthy"
            health_status["alert_stats"] = stats
        except Exception as e:
            health_status["components"]["alert_manager"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"

        return jsonify(health_status)

    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 500

@logging_bp.route('/lgpd/delete-user-data', methods=['POST'])
def delete_user_data():
    """
    Endpoint para exercer direito LGPD (esquecimento)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user_id = data.get('userId')
        reason = data.get('reason', 'User request')
        request_id = data.get('requestId')

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        # Log da solicitação de deleção
        cloud_logger.lgpd_event('data_deletion_initiated', user_id, {
            'reason': reason,
            'request_id': request_id,
            'ip_address': request.remote_addr
        })

        # DEVELOPMENT MODE: Mock deletion for testing
        # Production implementation would:
        # - Delete user data from database
        # - Delete personal logs from Cloud Logging
        # - Notify integrated systems
        # - Queue async processing if needed
        deletion_result = {
            "deleted_records": {
                "database": 0,  # Production: actual deletion count
                "cloud_logs": 0,  # Production: logs deletion count
                "local_storage": 0  # Not applicable
            },
            "processing_time": "immediate",
            "status": "mock_completed"  # Indicates development mode
        }

        # Log do resultado
        cloud_logger.lgpd_event('data_deletion_completed', user_id, {
            'deletion_result': deletion_result,
            'request_id': request_id
        })

        # Alertar sobre deleção
        asyncio.create_task(alert_manager.send_alert(
            alert_type='lgpd_violation',  # Não é violação, mas usar o canal
            severity='medium',
            title='LGPD Data Deletion Completed',
            message=f'User data deletion completed for user {user_id[:8]}***',
            details={
                'user_id_hash': hashlib.sha256(user_id.encode()).hexdigest()[:16],
                'deletion_result': deletion_result,
                'reason': reason
            }
        ))

        return jsonify({
            "success": True,
            "message": "Data deletion request processed",
            "deletion_id": f"del_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            "result": deletion_result
        })

    except Exception as e:
        current_app.logger.error(f"Error processing data deletion: {e}")

        # Log do erro
        cloud_logger.error("Data deletion failed", e, {
            'user_id': data.get('userId') if 'data' in locals() else None
        })

        return jsonify({"error": "Internal server error"}), 500

@logging_bp.route('/lgpd/compliance-report', methods=['GET'])
@require_auth
def generate_compliance_report():
    """
    Gera relatório de compliance LGPD
    Requer autenticação via JWT token
    """
    try:
        # Autenticação verificada pelo decorator @require_auth
        # Role de admin seria verificada aqui se implementado sistema de roles

        # Gerar relatório
        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "compliance_status": "compliant",
            "data_categories": {
                "personal_data": {
                    "retention_days": 7,
                    "auto_cleanup": True,
                    "last_cleanup": "2024-01-01T00:00:00Z"  # Implementar
                },
                "analytics": {
                    "retention_days": 30,
                    "auto_cleanup": True,
                    "last_cleanup": "2024-01-01T00:00:00Z"  # Implementar
                },
                "audit": {
                    "retention_days": 365,
                    "auto_cleanup": False,
                    "last_cleanup": None
                }
            },
            "alert_stats": alert_manager.get_alert_stats(),
            "violations_last_30_days": 0,  # Implementar
            "data_requests_last_30_days": 0,  # Implementar
        }

        # Log do acesso ao relatório
        cloud_logger.lgpd_event('compliance_report_accessed', 'admin', {
            'ip_address': request.remote_addr,
            'report_timestamp': report["timestamp"]
        })

        return jsonify(report)

    except Exception as e:
        current_app.logger.error(f"Error generating compliance report: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Registrar blueprint em main.py
def register_logging_blueprint(app):
    """Registra o blueprint de logging"""
    app.register_blueprint(logging_bp)

__all__ = ['logging_bp', 'register_logging_blueprint']