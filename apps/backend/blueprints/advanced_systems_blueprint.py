# -*- coding: utf-8 -*-
"""
Advanced Systems Blueprint - Gerenciamento de Sistemas Avançados
Endpoints para ativação, monitoramento e status dos sistemas avançados
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
import logging
from typing import Dict, Any

# Importar ativador de sistemas
try:
    from services.activation.advanced_systems_activator import (
        get_advanced_systems_activator,
        activate_advanced_systems,
        get_advanced_systems_status
    )
    ADVANCED_SYSTEMS_AVAILABLE = True
except ImportError:
    ADVANCED_SYSTEMS_AVAILABLE = False

# Importar ativador de monitoramento empresarial
try:
    from services.activation.enterprise_monitoring_activator import (
        get_enterprise_monitoring_activator,
        activate_enterprise_monitoring,
        get_enterprise_monitoring_status
    )
    ENTERPRISE_MONITORING_AVAILABLE = True
except ImportError:
    ENTERPRISE_MONITORING_AVAILABLE = False

# Importar rate limiting
try:
    from services.security.sqlite_rate_limiter import rate_limit
except ImportError:
    def rate_limit(endpoint, max_requests, window_seconds):
        def decorator(f):
            return f
        return decorator

logger = logging.getLogger(__name__)

# Criar blueprint
advanced_systems_bp = Blueprint('advanced_systems', __name__, url_prefix='/api/v1/advanced')

@advanced_systems_bp.route('/status', methods=['GET'])
@rate_limit('advanced_status', 30, 60)  # 30 req/min
def get_systems_status():
    """
    Obter status atual de todos os sistemas avançados

    Returns:
        JSON com status detalhado de cada sistema
    """
    try:
        if not ADVANCED_SYSTEMS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Advanced systems not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        status = get_advanced_systems_status()

        return jsonify({
            'success': True,
            'data': status,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao obter status dos sistemas: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/activate', methods=['POST'])
@rate_limit('advanced_activate', 5, 300)  # 5 req/5min (operação pesada)
def activate_systems():
    """
    Ativar/reativar todos os sistemas avançados

    Body (opcional):
    {
        "systems": ["ux_monitoring", "predictive_analytics", ...],
        "force_restart": false
    }

    Returns:
        JSON com resultado da ativação
    """
    try:
        if not ADVANCED_SYSTEMS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Advanced systems not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        data = request.get_json() or {}
        systems_to_activate = data.get('systems', 'all')
        force_restart = data.get('force_restart', False)

        logger.info(f"Ativando sistemas avançados: {systems_to_activate}")

        if force_restart:
            # Parar monitoramento atual
            activator = get_advanced_systems_activator()
            activator.stop_monitoring_systems()

        # Ativar sistemas
        activation_result = activate_advanced_systems()

        # Resumo da ativação
        total_systems = len(activation_result)
        initialized_systems = sum(1 for s in activation_result.values() if s.initialized)
        success_rate = (initialized_systems / total_systems * 100) if total_systems > 0 else 0

        return jsonify({
            'success': True,
            'data': {
                'activation_result': {
                    name: {
                        'name': status.name,
                        'initialized': status.initialized,
                        'available': status.available,
                        'performance_score': status.performance_score,
                        'error_message': status.error_message
                    }
                    for name, status in activation_result.items()
                },
                'summary': {
                    'total_systems': total_systems,
                    'initialized_systems': initialized_systems,
                    'success_rate_percent': round(success_rate, 2)
                }
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao ativar sistemas: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/monitoring/start', methods=['POST'])
@rate_limit('advanced_monitoring', 3, 300)  # 3 req/5min
def start_monitoring():
    """
    Iniciar monitoramento contínuo dos sistemas

    Body (opcional):
    {
        "interval_seconds": 300
    }

    Returns:
        JSON confirmando início do monitoramento
    """
    try:
        if not ADVANCED_SYSTEMS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Advanced systems not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        data = request.get_json() or {}
        interval_seconds = data.get('interval_seconds', 300)  # 5 minutos padrão

        # Validar intervalo
        if not isinstance(interval_seconds, int) or interval_seconds < 30:
            return jsonify({
                'success': False,
                'error': 'interval_seconds must be an integer >= 30',
                'timestamp': datetime.now().isoformat()
            }), 400

        activator = get_advanced_systems_activator()
        activator.start_monitoring(interval_seconds)

        return jsonify({
            'success': True,
            'data': {
                'monitoring_started': True,
                'interval_seconds': interval_seconds,
                'message': f'Monitoramento iniciado com intervalo de {interval_seconds} segundos'
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao iniciar monitoramento: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/monitoring/stop', methods=['POST'])
@rate_limit('advanced_monitoring', 3, 300)  # 3 req/5min
def stop_monitoring():
    """
    Parar monitoramento contínuo dos sistemas

    Returns:
        JSON confirmando parada do monitoramento
    """
    try:
        if not ADVANCED_SYSTEMS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Advanced systems not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        activator = get_advanced_systems_activator()
        activator.stop_monitoring_systems()

        return jsonify({
            'success': True,
            'data': {
                'monitoring_stopped': True,
                'message': 'Monitoramento parado com sucesso'
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao parar monitoramento: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/health', methods=['GET'])
@rate_limit('advanced_health', 60, 60)  # 60 req/min
def health_check():
    """
    Health check rápido dos sistemas avançados

    Returns:
        JSON com status de saúde simplificado
    """
    try:
        if not ADVANCED_SYSTEMS_AVAILABLE:
            return jsonify({
                'success': False,
                'healthy': False,
                'error': 'Advanced systems not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        status = get_advanced_systems_status()
        summary = status.get('summary', {})

        total_systems = summary.get('total_systems', 0)
        initialized_systems = summary.get('initialized_systems', 0)
        avg_performance = summary.get('avg_performance_score', 0)

        # Critérios de saúde
        health_score = 0
        if total_systems > 0:
            initialization_rate = initialized_systems / total_systems
            health_score = (initialization_rate * 70) + (avg_performance * 0.3)

        is_healthy = health_score >= 80  # 80% threshold

        return jsonify({
            'success': True,
            'healthy': is_healthy,
            'data': {
                'health_score': round(health_score, 2),
                'total_systems': total_systems,
                'initialized_systems': initialized_systems,
                'initialization_rate_percent': round((initialized_systems / total_systems * 100) if total_systems > 0 else 0, 2),
                'avg_performance_score': round(avg_performance, 2)
            },
            'timestamp': datetime.now().isoformat()
        }), 200 if is_healthy else 206  # 206 = Partial Content (warning)

    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return jsonify({
            'success': False,
            'healthy': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/config', methods=['GET'])
@rate_limit('advanced_config', 20, 60)  # 20 req/min
def get_config():
    """
    Obter configuração atual dos sistemas avançados

    Returns:
        JSON com configurações de feature flags
    """
    try:
        from app_config import config

        config_data = {
            'feature_flags': {
                'ux_monitoring_enabled': getattr(config, 'UX_MONITORING_ENABLED', False),
                'predictive_analytics_enabled': getattr(config, 'PREDICTIVE_ANALYTICS_ENABLED', False),
                'advanced_analytics_enabled': getattr(config, 'ADVANCED_ANALYTICS_ENABLED', False),
                'persona_analytics_enabled': getattr(config, 'PERSONA_ANALYTICS_ENABLED', False),
                'behavior_tracking_enabled': getattr(config, 'BEHAVIOR_TRACKING_ENABLED', False),
                'learning_analytics_enabled': getattr(config, 'LEARNING_ANALYTICS_ENABLED', False),
                'performance_monitoring_enabled': getattr(config, 'PERFORMANCE_MONITORING_ENABLED', False),
                'ai_suggestions_enabled': getattr(config, 'AI_SUGGESTIONS_ENABLED', False)
            },
            'general_flags': {
                'advanced_features': getattr(config, 'ADVANCED_FEATURES', False),
                'rag_available': getattr(config, 'RAG_AVAILABLE', False),
                'embeddings_enabled': getattr(config, 'EMBEDDINGS_ENABLED', False),
                'multimodal_processing': getattr(config, 'MULTIMODAL_PROCESSING', False)
            }
        }

        return jsonify({
            'success': True,
            'data': config_data,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao obter configuração: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

# ============================================
# ENTERPRISE MONITORING ENDPOINTS
# ============================================

@advanced_systems_bp.route('/enterprise/monitoring/activate', methods=['POST'])
@rate_limit('enterprise_activate', 3, 300)  # 3 req/5min (operação pesada)
def activate_enterprise_monitoring():
    """
    Ativar sistema completo de monitoramento empresarial

    Returns:
        JSON com resultado da ativação enterprise
    """
    try:
        if not ENTERPRISE_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Enterprise monitoring not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        logger.info("Iniciando ativação de monitoramento empresarial...")

        # Ativar sistemas de monitoramento empresarial
        activation_result = activate_enterprise_monitoring()

        # Calcular resumo da ativação
        total_systems = len(activation_result)
        initialized_systems = sum(1 for s in activation_result.values() if s.initialized)
        available_systems = sum(1 for s in activation_result.values() if s.available)
        success_rate = (initialized_systems / total_systems * 100) if total_systems > 0 else 0

        return jsonify({
            'success': True,
            'data': {
                'enterprise_activation_result': {
                    name: {
                        'name': status.name,
                        'enabled': status.enabled,
                        'available': status.available,
                        'initialized': status.initialized,
                        'health_score': status.health_score,
                        'error_message': status.error_message
                    }
                    for name, status in activation_result.items()
                },
                'summary': {
                    'total_systems': total_systems,
                    'available_systems': available_systems,
                    'initialized_systems': initialized_systems,
                    'success_rate_percent': round(success_rate, 2),
                    'enterprise_grade': success_rate >= 80
                }
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao ativar monitoramento empresarial: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/enterprise/monitoring/status', methods=['GET'])
@rate_limit('enterprise_status', 60, 60)  # 60 req/min
def get_enterprise_monitoring_status():
    """
    Obter status do monitoramento empresarial

    Returns:
        JSON com status detalhado do monitoramento enterprise
    """
    try:
        if not ENTERPRISE_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Enterprise monitoring not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        status = get_enterprise_monitoring_status()

        return jsonify({
            'success': True,
            'data': status,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao obter status do monitoramento empresarial: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/enterprise/monitoring/health', methods=['GET'])
@rate_limit('enterprise_health', 120, 60)  # 120 req/min
def get_enterprise_health():
    """
    Health check rápido do monitoramento empresarial

    Returns:
        JSON com status de saúde enterprise
    """
    try:
        if not ENTERPRISE_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'healthy': False,
                'error': 'Enterprise monitoring not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        status = get_enterprise_monitoring_status()
        summary = status.get('summary', {})

        total_systems = summary.get('total_systems', 0)
        initialized_systems = summary.get('initialized_systems', 0)
        avg_health = summary.get('avg_health_score', 0)

        # Critérios de saúde enterprise (mais rigorosos)
        enterprise_health_score = 0
        if total_systems > 0:
            initialization_rate = initialized_systems / total_systems
            enterprise_health_score = (initialization_rate * 60) + (avg_health * 0.4)

        is_enterprise_healthy = enterprise_health_score >= 85  # 85% threshold para enterprise

        health_grade = (
            'excellent' if enterprise_health_score >= 95 else
            'good' if enterprise_health_score >= 85 else
            'fair' if enterprise_health_score >= 70 else
            'poor'
        )

        return jsonify({
            'success': True,
            'healthy': is_enterprise_healthy,
            'data': {
                'enterprise_health_score': round(enterprise_health_score, 2),
                'health_grade': health_grade,
                'total_systems': total_systems,
                'initialized_systems': initialized_systems,
                'initialization_rate_percent': round((initialized_systems / total_systems * 100) if total_systems > 0 else 0, 2),
                'avg_health_score': round(avg_health, 2),
                'health_monitoring_active': summary.get('health_monitoring_active', False),
                'enterprise_ready': is_enterprise_healthy and total_systems >= 5
            },
            'timestamp': datetime.now().isoformat()
        }), 200 if is_enterprise_healthy else 206  # 206 = Partial Content (warning)

    except Exception as e:
        logger.error(f"Erro no enterprise health check: {e}")
        return jsonify({
            'success': False,
            'healthy': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

@advanced_systems_bp.route('/enterprise/monitoring/start-health-monitoring', methods=['POST'])
@rate_limit('enterprise_health_monitor', 2, 300)  # 2 req/5min
def start_enterprise_health_monitoring():
    """
    Iniciar monitoramento contínuo de saúde enterprise

    Body (opcional):
    {
        "interval_seconds": 300
    }

    Returns:
        JSON confirmando início do monitoramento enterprise
    """
    try:
        if not ENTERPRISE_MONITORING_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Enterprise monitoring not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        data = request.get_json() or {}
        interval_seconds = data.get('interval_seconds', 300)  # 5 minutos padrão

        # Validar intervalo
        if not isinstance(interval_seconds, int) or interval_seconds < 60:
            return jsonify({
                'success': False,
                'error': 'interval_seconds must be an integer >= 60',
                'timestamp': datetime.now().isoformat()
            }), 400

        activator = get_enterprise_monitoring_activator()
        activator.start_continuous_health_monitoring(interval_seconds)

        return jsonify({
            'success': True,
            'data': {
                'health_monitoring_started': True,
                'interval_seconds': interval_seconds,
                'message': f'Monitoramento enterprise iniciado com intervalo de {interval_seconds} segundos',
                'enterprise_grade': True
            },
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Erro ao iniciar monitoramento enterprise: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'timestamp': datetime.now().isoformat()
        }), 500

# Error handlers
@advanced_systems_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'timestamp': datetime.now().isoformat()
    }), 400

@advanced_systems_bp.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded',
        'timestamp': datetime.now().isoformat()
    }), 429

@advanced_systems_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'timestamp': datetime.now().isoformat()
    }), 500