"""
Blueprint para sistema de alertas LGPD
Endpoints para gerenciar e testar o sistema de notificações
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import asyncio
import json
from typing import Dict, Any

from core.alerts.notification_system import alert_manager, AlertType, AlertSeverity
from core.auth.jwt_validator import require_auth, require_admin
from core.security.enhanced_security import require_rate_limit

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('/send', methods=['POST'])
@require_rate_limit('admin')
@require_admin
def send_alert():
    """Endpoint para enviar alerta manual (admin apenas)"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Dados JSON necessários'}), 400

        required_fields = ['alert_type', 'severity', 'title', 'message']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                'error': f'Campos obrigatórios ausentes: {", ".join(missing_fields)}'
            }), 400

        # Validar tipos
        valid_types = ['lgpd_violation', 'data_breach', 'retention_expired', 'system_error', 'security_alert']
        valid_severities = ['low', 'medium', 'high', 'critical']

        if data['alert_type'] not in valid_types:
            return jsonify({'error': f'Tipo inválido. Use: {", ".join(valid_types)}'}), 400

        if data['severity'] not in valid_severities:
            return jsonify({'error': f'Severidade inválida. Use: {", ".join(valid_severities)}'}), 400

        # Enviar alerta (criar loop de evento para async)
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            results = loop.run_until_complete(
                alert_manager.send_alert(
                    alert_type=data['alert_type'],
                    severity=data['severity'],
                    title=data['title'],
                    message=data['message'],
                    details=data.get('details', {}),
                    user_id=data.get('user_id'),
                    requires_immediate_action=data.get('requires_immediate_action', False)
                )
            )

            loop.close()

            return jsonify({
                'status': 'success',
                'message': 'Alerta enviado com sucesso',
                'results': results,
                'timestamp': datetime.utcnow().isoformat()
            }), 200

        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erro ao enviar alerta: {str(e)}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro interno: {str(e)}'
        }), 500

@alerts_bp.route('/test', methods=['POST'])
@require_rate_limit('admin')
@require_admin
def test_alerts():
    """Endpoint para testar sistema de alertas"""
    try:
        # Criar loop de evento para chamadas async
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        test_results = {}

        # Teste 1: Alerta de baixa severidade
        test_results['test_low_severity'] = loop.run_until_complete(
            alert_manager.send_alert(
                alert_type='system_error',
                severity='low',
                title='Teste de Alerta - Baixa Severidade',
                message='Este é um teste do sistema de alertas com severidade baixa.',
                details={'test_type': 'automated', 'environment': 'development'}
            )
        )

        # Teste 2: Alerta crítico LGPD
        test_results['test_lgpd_critical'] = loop.run_until_complete(
            alert_manager.lgpd_violation(
                violation_type='Acesso não autorizado a dados pessoais',
                details={
                    'affected_records': 15,
                    'data_type': 'CPF e nomes de pacientes',
                    'source_ip': '192.168.1.100',
                    'timestamp': datetime.utcnow().isoformat()
                },
                user_id='test_user_123'
            )
        )

        # Teste 3: Alerta de retenção expirada
        test_results['test_retention_expired'] = loop.run_until_complete(
            alert_manager.data_retention_expired(
                data_category='personal_data',
                count=42
            )
        )

        loop.close()

        # Obter estatísticas
        stats = alert_manager.get_alert_stats()

        return jsonify({
            'status': 'success',
            'message': 'Testes de alerta concluídos',
            'test_results': test_results,
            'alert_statistics': stats,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro nos testes: {str(e)}'
        }), 500

@alerts_bp.route('/stats', methods=['GET'])
@require_rate_limit('default')
@require_auth
def get_alert_stats():
    """Obter estatísticas dos alertas"""
    try:
        stats = alert_manager.get_alert_stats()

        # Adicionar informações sobre canais
        channel_status = {}
        for channel in alert_manager.channels:
            channel_status[channel.name] = {
                'enabled': channel.enabled,
                'rate_limited': channel.is_rate_limited(),
                'recent_alerts': len(channel.last_alerts)
            }

        return jsonify({
            'status': 'success',
            'statistics': stats,
            'channels': channel_status,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro ao obter estatísticas: {str(e)}'
        }), 500

@alerts_bp.route('/channels', methods=['GET'])
@require_rate_limit('default')
@require_auth
def get_channel_status():
    """Obter status detalhado dos canais de notificação"""
    try:
        channels_info = []

        for channel in alert_manager.channels:
            channel_info = {
                'name': channel.name,
                'enabled': channel.enabled,
                'rate_limit': channel.rate_limit,
                'rate_limited': channel.is_rate_limited(),
                'recent_alerts_count': len(channel.last_alerts),
                'last_alerts': [alert.isoformat() for alert in channel.last_alerts[-5:]]  # últimos 5
            }

            # Informações específicas por tipo de canal
            if hasattr(channel, 'demo_mode'):
                channel_info['demo_mode'] = channel.demo_mode

            if channel.name == 'email' and hasattr(channel, 'smtp_host'):
                channel_info['smtp_configured'] = bool(channel.smtp_user and channel.smtp_pass)

            if channel.name == 'telegram' and hasattr(channel, 'bot_token'):
                channel_info['bot_configured'] = bool(channel.bot_token and channel.chat_id)

            channels_info.append(channel_info)

        return jsonify({
            'status': 'success',
            'channels': channels_info,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro ao obter status dos canais: {str(e)}'
        }), 500

@alerts_bp.route('/history', methods=['GET'])
@require_rate_limit('default')
@require_auth
def get_alert_history():
    """Obter histórico de alertas (últimos 50)"""
    try:
        # Obter últimos alertas
        recent_alerts = alert_manager.alert_history[-50:]

        history = []
        for alert in recent_alerts:
            history.append({
                'alert_id': alert.alert_id,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'title': alert.title,
                'message': alert.message[:200] + '...' if len(alert.message) > 200 else alert.message,
                'timestamp': alert.timestamp.isoformat(),
                'user_id': alert.user_id[:8] + '***' if alert.user_id else None,
                'requires_immediate_action': alert.requires_immediate_action,
                'details_count': len(alert.details)
            })

        return jsonify({
            'status': 'success',
            'history': history,
            'total_count': len(alert_manager.alert_history),
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro ao obter histórico: {str(e)}'
        }), 500

@alerts_bp.route('/health', methods=['GET'])
@require_rate_limit('default')
def alert_system_health():
    """Health check do sistema de alertas"""
    try:
        health_status = {
            'system': 'alerts',
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'channels': {},
            'manager': {
                'initialized': bool(alert_manager),
                'channels_count': len(alert_manager.channels),
                'history_count': len(alert_manager.alert_history)
            }
        }

        # Status de cada canal
        for channel in alert_manager.channels:
            health_status['channels'][channel.name] = {
                'enabled': channel.enabled,
                'rate_limited': channel.is_rate_limited(),
                'recent_alerts': len(channel.last_alerts)
            }

        return jsonify(health_status), 200

    except Exception as e:
        return jsonify({
            'system': 'alerts',
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Registrar blueprint
def register_alerts_blueprint(app):
    """Registra o blueprint de alertas na aplicação Flask"""
    app.register_blueprint(alerts_bp)
    print("✅ Blueprint de alertas registrado")