"""
Blueprint de Notificações - PR #175
Endpoints para gerenciar notificações por email e funcionalidades sociais
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from flask import Blueprint, request, jsonify, g
from functools import wraps
import logging

from services.email.email_service import (
    email_service, 
    EmailAddress,
    send_achievement_email,
    send_progress_email,
    send_welcome_user_email
)
from utils.auth_utils import require_auth, get_current_user
from utils.validation_utils import validate_email, validate_required_fields
from utils.rate_limiter import rate_limit
from core.database import get_db_connection
from core.cache import cache_service

logger = logging.getLogger(__name__)

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# Decorador para executar funções async
def async_route(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(f(*args, **kwargs))
        finally:
            loop.close()
    return wrapper

@notifications_bp.route('/preferences', methods=['GET'])
@require_auth
def get_email_preferences():
    """Obtém preferências de email do usuário"""
    try:
        user = get_current_user()
        user_id = user.get('uid')
        
        # Buscar preferências do banco
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT email_notifications, achievement_emails, progress_emails, 
                   social_emails, marketing_emails, frequency
            FROM user_email_preferences 
            WHERE user_id = %s
        """, (user_id,))
        
        preferences = cursor.fetchone()
        
        if not preferences:
            # Criar preferências padrão
            default_prefs = {
                'email_notifications': True,
                'achievement_emails': True,
                'progress_emails': True,
                'social_emails': True,
                'marketing_emails': False,
                'frequency': 'immediate'
            }
            
            cursor.execute("""
                INSERT INTO user_email_preferences 
                (user_id, email_notifications, achievement_emails, progress_emails,
                 social_emails, marketing_emails, frequency, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, 
                default_prefs['email_notifications'],
                default_prefs['achievement_emails'],
                default_prefs['progress_emails'],
                default_prefs['social_emails'], 
                default_prefs['marketing_emails'],
                default_prefs['frequency'],
                datetime.now(timezone.utc)
            ))
            db.commit()
            
            return jsonify({
                'success': True,
                'preferences': default_prefs
            })
        
        cursor.close()
        
        return jsonify({
            'success': True,
            'preferences': {
                'email_notifications': bool(preferences[0]),
                'achievement_emails': bool(preferences[1]),
                'progress_emails': bool(preferences[2]),
                'social_emails': bool(preferences[3]),
                'marketing_emails': bool(preferences[4]),
                'frequency': preferences[5]
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar preferências de email: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@notifications_bp.route('/preferences', methods=['PUT'])
@require_auth
@rate_limit(requests_per_minute=10)
def update_email_preferences():
    """Atualiza preferências de email do usuário"""
    try:
        user = get_current_user()
        user_id = user.get('uid')
        data = request.get_json()
        
        # Validar campos obrigatórios
        required_fields = ['email_notifications']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify(validation_error), 400
        
        # Extrair e validar preferências
        email_notifications = bool(data.get('email_notifications', True))
        achievement_emails = bool(data.get('achievement_emails', True))
        progress_emails = bool(data.get('progress_emails', True))
        social_emails = bool(data.get('social_emails', True))
        marketing_emails = bool(data.get('marketing_emails', False))
        frequency = data.get('frequency', 'immediate')
        
        if frequency not in ['immediate', 'daily', 'weekly', 'never']:
            return jsonify({
                'success': False,
                'error': 'Frequência inválida'
            }), 400
        
        # Atualizar no banco
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO user_email_preferences 
            (user_id, email_notifications, achievement_emails, progress_emails,
             social_emails, marketing_emails, frequency, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                email_notifications = VALUES(email_notifications),
                achievement_emails = VALUES(achievement_emails),
                progress_emails = VALUES(progress_emails),
                social_emails = VALUES(social_emails),
                marketing_emails = VALUES(marketing_emails),
                frequency = VALUES(frequency),
                updated_at = VALUES(updated_at)
        """, (
            user_id, email_notifications, achievement_emails, progress_emails,
            social_emails, marketing_emails, frequency, 
            datetime.now(timezone.utc), datetime.now(timezone.utc)
        ))
        
        db.commit()
        cursor.close()
        
        # Invalidar cache se existir
        cache_key = f"email_preferences:{user_id}"
        cache_service.delete(cache_key)
        
        return jsonify({
            'success': True,
            'message': 'Preferências atualizadas com sucesso',
            'preferences': {
                'email_notifications': email_notifications,
                'achievement_emails': achievement_emails,
                'progress_emails': progress_emails,
                'social_emails': social_emails,
                'marketing_emails': marketing_emails,
                'frequency': frequency
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao atualizar preferências de email: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@notifications_bp.route('/send-achievement', methods=['POST'])
@require_auth
@rate_limit(requests_per_minute=20)
@async_route
async def send_achievement_notification():
    """Envia notificação de conquista por email"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Validar campos
        required_fields = ['achievement_name', 'achievement_description']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify(validation_error), 400
        
        user_email = user.get('email')
        user_name = user.get('displayName', user_email.split('@')[0])
        achievement_name = data['achievement_name']
        achievement_description = data['achievement_description']
        badge_url = data.get('badge_url')
        
        # Verificar se usuário tem notificações de conquista ativadas
        if not await _check_user_email_preference(user.get('uid'), 'achievement_emails'):
            return jsonify({
                'success': True,
                'message': 'Usuário não tem notificações de conquista ativadas',
                'skipped': True
            })
        
        # Enviar email
        result = await send_achievement_email(
            user_email, user_name, achievement_name, 
            achievement_description, badge_url
        )
        
        # Registrar envio no banco
        if result.get('success'):
            await _log_notification_sent(
                user.get('uid'), 'achievement', 
                achievement_name, user_email
            )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro ao enviar notificação de conquista: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@notifications_bp.route('/send-progress', methods=['POST']) 
@require_auth
@rate_limit(requests_per_minute=10)
@async_route
async def send_progress_notification():
    """Envia notificação de progresso por email"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Validar campos
        required_fields = ['progress_percentage', 'completed_modules']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify(validation_error), 400
        
        user_email = user.get('email')
        user_name = user.get('displayName', user_email.split('@')[0])
        progress_percentage = int(data['progress_percentage'])
        completed_modules = data['completed_modules']
        next_recommendations = data.get('next_recommendations', [])
        
        # Verificar se usuário tem notificações de progresso ativadas
        if not await _check_user_email_preference(user.get('uid'), 'progress_emails'):
            return jsonify({
                'success': True,
                'message': 'Usuário não tem notificações de progresso ativadas',
                'skipped': True
            })
        
        # Enviar email
        result = await send_progress_email(
            user_email, user_name, progress_percentage,
            completed_modules, next_recommendations
        )
        
        # Registrar envio no banco
        if result.get('success'):
            await _log_notification_sent(
                user.get('uid'), 'progress',
                f"{progress_percentage}% completo", user_email
            )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro ao enviar notificação de progresso: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@notifications_bp.route('/send-welcome', methods=['POST'])
@require_auth
@rate_limit(requests_per_minute=5)
@async_route
async def send_welcome_notification():
    """Envia email de boas-vindas"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        user_email = user.get('email')
        user_name = user.get('displayName', user_email.split('@')[0])
        profile_type = data.get('profile_type', 'user')
        
        # Enviar email de boas-vindas
        result = await send_welcome_user_email(user_email, user_name, profile_type)
        
        # Registrar envio no banco
        if result.get('success'):
            await _log_notification_sent(
                user.get('uid'), 'welcome',
                'Email de boas-vindas', user_email
            )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro ao enviar email de boas-vindas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@notifications_bp.route('/history', methods=['GET'])
@require_auth
def get_notification_history():
    """Obtém histórico de notificações do usuário"""
    try:
        user = get_current_user()
        user_id = user.get('uid')
        
        # Parâmetros de paginação
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        # Buscar histórico do banco
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT notification_type, subject, recipient_email, sent_at, success
            FROM notification_log 
            WHERE user_id = %s 
            ORDER BY sent_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, offset))
        
        notifications = cursor.fetchall()
        
        # Contar total
        cursor.execute("""
            SELECT COUNT(*) FROM notification_log WHERE user_id = %s
        """, (user_id,))
        total = cursor.fetchone()[0]
        
        cursor.close()
        
        return jsonify({
            'success': True,
            'notifications': [
                {
                    'type': notif[0],
                    'subject': notif[1],
                    'email': notif[2],
                    'sent_at': notif[3].isoformat(),
                    'success': bool(notif[4])
                }
                for notif in notifications
            ],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico de notificações: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@notifications_bp.route('/test', methods=['POST'])
@require_auth
@rate_limit(requests_per_minute=3)
@async_route
async def send_test_notification():
    """Envia notificação de teste"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        user_email = user.get('email')
        user_name = user.get('displayName', user_email.split('@')[0])
        notification_type = data.get('type', 'achievement')
        
        if notification_type == 'achievement':
            result = await send_achievement_email(
                user_email, user_name, 
                "Conquista de Teste 🧪", 
                "Esta é uma notificação de teste para verificar se o sistema de emails está funcionando corretamente.",
                None
            )
        elif notification_type == 'progress':
            result = await send_progress_email(
                user_email, user_name, 75,
                ["Módulo 1", "Módulo 2"],
                ["Módulo 3", "Módulo 4"]
            )
        elif notification_type == 'welcome':
            result = await send_welcome_user_email(user_email, user_name, "professional")
        else:
            return jsonify({
                'success': False,
                'error': 'Tipo de notificação inválido'
            }), 400
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Erro ao enviar notificação de teste: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

# Funções auxiliares

async def _check_user_email_preference(user_id: str, preference_type: str) -> bool:
    """Verifica se usuário tem determinada preferência de email ativada"""
    try:
        # Tentar buscar do cache primeiro
        cache_key = f"email_preferences:{user_id}"
        cached_prefs = cache_service.get(cache_key)
        
        if cached_prefs:
            return cached_prefs.get(preference_type, True)
        
        # Buscar do banco
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute(f"""
            SELECT email_notifications, {preference_type}
            FROM user_email_preferences 
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            return True  # Padrão é ativado
        
        # Cache por 1 hora
        prefs = {
            'email_notifications': bool(result[0]),
            preference_type: bool(result[1])
        }
        cache_service.set(cache_key, prefs, expire=3600)
        
        return prefs['email_notifications'] and prefs[preference_type]
        
    except Exception as e:
        logger.error(f"Erro ao verificar preferência de email: {e}")
        return True  # Em caso de erro, permitir envio

async def _log_notification_sent(user_id: str, notification_type: str, 
                                subject: str, recipient_email: str, 
                                success: bool = True):
    """Registra notificação enviada no banco"""
    try:
        db = get_db_connection()
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO notification_log 
            (user_id, notification_type, subject, recipient_email, sent_at, success)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            user_id, notification_type, subject, recipient_email,
            datetime.now(timezone.utc), success
        ))
        
        db.commit()
        cursor.close()
        
    except Exception as e:
        logger.error(f"Erro ao registrar log de notificação: {e}")

# Health check do serviço de email
@notifications_bp.route('/health', methods=['GET'])
def email_service_health():
    """Health check do serviço de notificações"""
    try:
        # Verificar configuração
        config_valid = email_service.provider.validate_config()
        
        return jsonify({
            'success': True,
            'service': 'notifications',
            'provider': email_service.config.provider,
            'config_valid': config_valid,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro no health check de notificações: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers específicos
@notifications_bp.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({
        'success': False,
        'error': 'Rate limit excedido. Tente novamente mais tarde.',
        'retry_after': 60
    }), 429