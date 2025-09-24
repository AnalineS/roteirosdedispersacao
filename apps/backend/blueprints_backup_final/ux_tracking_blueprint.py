# -*- coding: utf-8 -*-
"""
UX Tracking Blueprint - Endpoints para coleta de dados UX
Conecta frontend com UXMonitoringManager
Processa tracking de interações, erros e Web Vitals

Data: 09 de Janeiro de 2025
Fase: Ativação de Monitoramento UX
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from typing import Dict, Any

# Import UX Monitoring Manager
try:
    from services.monitoring.ux_monitoring_manager import (
        get_ux_monitoring_manager, 
        track_page_view, 
        track_chat_interaction,
        track_error
    )
    UX_MONITORING_AVAILABLE = True
except ImportError:
    UX_MONITORING_AVAILABLE = False

logger = logging.getLogger(__name__)

# Criar blueprint
ux_tracking_bp = Blueprint('ux_tracking', __name__, url_prefix='/api/v1/ux')

@ux_tracking_bp.route('/track', methods=['POST'])
def track_ux_event():
    """Endpoint principal para tracking de eventos UX"""
    try:
        if not UX_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'UX monitoring não disponível'
            }), 503

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados são obrigatórios'
            }), 400

        event_type = data.get('type')
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        event_data = data.get('data', {})

        if not all([event_type, user_id, session_id]):
            return jsonify({
                'success': False,
                'error': 'type, user_id e session_id são obrigatórios'
            }), 400

        ux_manager = get_ux_monitoring_manager()
        if not ux_manager:
            return jsonify({
                'success': False,
                'error': 'UX manager não inicializado'
            }), 503

        # Processar diferentes tipos de eventos
        if event_type == 'page_view':
            page = event_data.get('page', 'unknown')
            duration_ms = event_data.get('duration_ms')
            referrer = event_data.get('referrer')
            
            ux_manager.track_page_view(
                user_id=user_id,
                session_id=session_id,
                page=page,
                duration_ms=duration_ms,
                referrer=referrer
            )
            
        elif event_type == 'interaction':
            action = event_data.get('action', 'unknown')
            element = event_data.get('element', 'unknown')
            metadata = event_data.get('metadata', {})
            
            ux_manager.track_user_interaction(
                user_id=user_id,
                session_id=session_id,
                action=action,
                element=element,
                metadata=metadata
            )
            
        elif event_type == 'error':
            error_type = event_data.get('error_type', 'unknown')
            error_message = event_data.get('error_message', '')
            component = event_data.get('component')
            severity = event_data.get('severity', 'medium')
            
            ux_manager.track_error(
                user_id=user_id,
                session_id=session_id,
                error_type=error_type,
                error_message=error_message,
                component=component,
                severity=severity
            )
            
        elif event_type == 'web_vitals':
            lcp = event_data.get('lcp', 0)
            fid = event_data.get('fid', 0)
            cls = event_data.get('cls', 0)
            additional_metrics = {
                'fcp': event_data.get('fcp', 0),
                'ttfb': event_data.get('ttfb', 0),
                'page': event_data.get('page', 'unknown')
            }
            
            ux_manager.track_web_vitals(
                user_id=user_id,
                lcp=lcp,
                fid=fid,
                cls=cls,
                additional_metrics=additional_metrics
            )
            
        elif event_type == 'chat_interaction':
            persona = event_data.get('persona', 'unknown')
            query = event_data.get('query', '')
            response_time_ms = event_data.get('response_time_ms', 0)
            satisfaction = event_data.get('satisfaction')
            
            ux_manager.track_chat_interaction(
                user_id=user_id,
                session_id=session_id,
                persona=persona,
                query=query,
                response_time_ms=response_time_ms,
                satisfaction=satisfaction
            )
            
        elif event_type == 'accessibility':
            event_subtype = event_data.get('event_type', 'unknown')
            details = event_data.get('details', {})
            
            ux_manager.track_accessibility_event(
                user_id=user_id,
                event_type=event_subtype,
                details=details
            )
            
        else:
            return jsonify({
                'success': False,
                'error': f'Tipo de evento não suportado: {event_type}'
            }), 400

        return jsonify({
            'success': True,
            'event_type': event_type,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro no tracking UX: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno no tracking'
        }), 500

@ux_tracking_bp.route('/dashboard', methods=['GET'])
def get_ux_dashboard():
    """Endpoint para dados do dashboard UX"""
    try:
        if not UX_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'UX monitoring não disponível'
            }), 503

        ux_manager = get_ux_monitoring_manager()
        if not ux_manager:
            return jsonify({
                'success': False,
                'error': 'UX manager não inicializado'
            }), 503

        dashboard_data = ux_manager.get_dashboard_data()
        
        return jsonify({
            'success': True,
            'data': dashboard_data,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar dashboard UX: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao buscar dashboard'
        }), 500

@ux_tracking_bp.route('/metrics', methods=['GET'])
def get_ux_metrics():
    """Endpoint para métricas UX atuais"""
    try:
        if not UX_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'UX monitoring não disponível'
            }), 503

        ux_manager = get_ux_monitoring_manager()
        if not ux_manager:
            return jsonify({
                'success': False,
                'error': 'UX manager não inicializado'
            }), 503

        current_metrics = ux_manager.get_current_metrics()
        
        return jsonify({
            'success': True,
            'metrics': current_metrics.__dict__,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar métricas UX: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao buscar métricas'
        }), 500

@ux_tracking_bp.route('/alerts', methods=['GET'])
def get_ux_alerts():
    """Endpoint para alertas UX ativos"""
    try:
        if not UX_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'UX monitoring não disponível'
            }), 503

        ux_manager = get_ux_monitoring_manager()
        if not ux_manager:
            return jsonify({
                'success': False,
                'error': 'UX manager não inicializado'
            }), 503

        severity_filter = request.args.get('severity')
        alerts = ux_manager.get_active_alerts(severity_filter)
        
        return jsonify({
            'success': True,
            'alerts': [alert.__dict__ for alert in alerts],
            'count': len(alerts),
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar alertas UX: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao buscar alertas'
        }), 500

@ux_tracking_bp.route('/user-journey/<user_id>', methods=['GET'])
def get_user_journey(user_id: str):
    """Endpoint para jornada do usuário"""
    try:
        if not UX_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'UX monitoring não disponível'
            }), 503

        ux_manager = get_ux_monitoring_manager()
        if not ux_manager:
            return jsonify({
                'success': False,
                'error': 'UX manager não inicializado'
            }), 503

        limit = request.args.get('limit', type=int)
        journey = ux_manager.get_user_journey(user_id, limit)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'journey': [step.__dict__ for step in journey],
            'count': len(journey),
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar jornada do usuário: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao buscar jornada'
        }), 500

@ux_tracking_bp.route('/health', methods=['GET'])
def ux_health_check():
    """Health check do sistema de UX monitoring"""
    try:
        if not UX_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'status': 'unavailable',
                'error': 'UX monitoring não disponível'
            }), 503

        ux_manager = get_ux_monitoring_manager()
        if not ux_manager:
            return jsonify({
                'success': False,
                'status': 'not_initialized',
                'error': 'UX manager não inicializado'
            }), 503

        # Verificar componentes integrados
        components_status = {
            'ux_manager': True,
            'performance_monitor': hasattr(ux_manager, 'performance_monitor') and ux_manager.performance_monitor is not None,
            'usability_monitor': hasattr(ux_manager, 'usability_monitor') and ux_manager.usability_monitor is not None,
            'unified_cache': hasattr(ux_manager, 'unified_cache') and ux_manager.unified_cache is not None,
            'monitoring_thread': ux_manager.monitoring_active
        }
        
        # Estatísticas básicas
        current_metrics = ux_manager.get_current_metrics()
        active_alerts = ux_manager.get_active_alerts()
        
        health_info = {
            'success': True,
            'status': 'healthy',
            'components': components_status,
            'stats': {
                'total_sessions': current_metrics.total_sessions,
                'avg_response_time_ms': current_metrics.avg_response_time_ms,
                'error_rate': current_metrics.error_rate,
                'active_alerts': len(active_alerts),
                'web_vitals_score': current_metrics.web_vitals_score
            },
            'uptime_info': {
                'monitoring_active': ux_manager.monitoring_active,
                'realtime_stats': ux_manager.realtime_stats
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(health_info), 200

    except Exception as e:
        logger.error(f"Erro no health check UX: {e}")
        return jsonify({
            'success': False,
            'status': 'error',
            'error': str(e)
        }), 500

# Endpoint de conveniência para integração com chat
@ux_tracking_bp.route('/track-chat', methods=['POST'])
def track_chat_quick():
    """Endpoint rápido para tracking de chat"""
    try:
        data = request.get_json()
        
        user_id = data.get('user_id', 'anonymous')
        session_id = data.get('session_id', 'unknown')
        persona = data.get('persona', 'unknown')
        query = data.get('query', '')
        response_time_ms = data.get('response_time_ms', 0)
        satisfaction = data.get('satisfaction')
        
        # Usar função global de conveniência
        track_chat_interaction(
            user_id=user_id,
            session_id=session_id,
            persona=persona,
            query=query,
            response_time_ms=response_time_ms,
            satisfaction=satisfaction
        )
        
        return jsonify({
            'success': True,
            'tracked': 'chat_interaction'
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no tracking rápido de chat: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Middleware para tracking automático de requests
@ux_tracking_bp.before_request
def before_ux_request():
    """Log requests para UX tracking endpoints"""
    if request.method != 'OPTIONS':  # Ignore preflight requests
        logger.debug(f"UX Tracking request: {request.method} {request.path}")

@ux_tracking_bp.after_request
def after_ux_request(response):
    """Log response para UX tracking endpoints"""
    logger.debug(f"UX Tracking response: {response.status_code}")
    
    # Adicionar headers CORS se necessário
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    
    return response