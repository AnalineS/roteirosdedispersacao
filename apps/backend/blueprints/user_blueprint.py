"""
User Blueprint - API de Usuários com Autenticação JWT
Demonstra integração completa com Firebase Authentication
"""

from flask import Blueprint, jsonify, request, g
from datetime import datetime
import logging

# Import JWT decorators (com fallback)
try:
    from core.auth.jwt_validator import (
        require_auth, 
        require_admin,
        get_current_user,
        get_current_user_id,
        is_authenticated,
        PermissionChecker
    )
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    # Fallback decorators que não fazem nada
    def require_auth(optional=False):
        def decorator(f):
            return f
        return decorator
    
    def require_admin():
        def decorator(f):
            return f
        return decorator
    
    def get_current_user():
        return None
    
    def get_current_user_id():
        return None
    
    def is_authenticated():
        return False
    
    class PermissionChecker:
        @staticmethod
        def can_access_user_data(user_id):
            return True
        
        @staticmethod
        def can_modify_user_data(user_id):
            return True

logger = logging.getLogger(__name__)

# Criar blueprint
user_bp = Blueprint('user', __name__, url_prefix='/api/v1/user')

# ============================================
# ROTAS DE PERFIL DO USUÁRIO
# ============================================

@user_bp.route('/profile', methods=['GET'])
@require_auth(optional=False)  # Autenticação obrigatória
def get_user_profile():
    """
    Obter perfil do usuário autenticado
    """
    try:
        user_id = get_current_user_id()
        user_data = get_current_user()
        
        if not user_id or not user_data:
            return jsonify({
                'success': False,
                'error': 'Usuário não autenticado',
                'error_code': 'NOT_AUTHENTICATED'
            }), 401
        
        # Construir resposta com dados do Firebase
        profile_data = {
            'uid': user_id,
            'email': user_data.get('email'),
            'name': user_data.get('name'),
            'email_verified': user_data.get('email_verified', False),
            'auth_time': user_data.get('auth_time'),
            'sign_in_provider': getattr(g, 'sign_in_provider', None),
            'custom_claims': getattr(g, 'custom_claims', {}),
            'created_at': datetime.fromtimestamp(user_data.get('iat', 0)).isoformat(),
        }
        
        # Remover campos None
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        
        return jsonify({
            'success': True,
            'data': profile_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter perfil do usuário: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

@user_bp.route('/profile/<user_id>', methods=['GET'])
@require_auth(optional=False)
def get_user_profile_by_id(user_id):
    """
    Obter perfil de usuário específico (admin ou próprio usuário)
    """
    try:
        # Verificar permissões
        if not PermissionChecker.can_access_user_data(user_id):
            return jsonify({
                'success': False,
                'error': 'Sem permissão para acessar dados deste usuário',
                'error_code': 'PERMISSION_DENIED'
            }), 403
        
        current_user_id = get_current_user_id()
        is_own_profile = current_user_id == user_id
        
        # Em uma implementação real, você buscaria os dados do Firestore
        # Por enquanto, retornar dados básicos
        if is_own_profile:
            # Retornar dados completos do próprio usuário
            user_data = get_current_user()
            profile_data = {
                'uid': user_id,
                'email': user_data.get('email'),
                'name': user_data.get('name'),
                'email_verified': user_data.get('email_verified', False),
                'is_own_profile': True
            }
        else:
            # Retornar dados limitados de outros usuários
            profile_data = {
                'uid': user_id,
                'name': 'Usuário',  # Nome genérico
                'is_own_profile': False,
                'access_level': 'limited'
            }
        
        return jsonify({
            'success': True,
            'data': profile_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter perfil do usuário {user_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

@user_bp.route('/preferences', methods=['GET', 'POST'])
@require_auth(optional=False)
def user_preferences():
    """
    Gerenciar preferências do usuário
    """
    try:
        user_id = get_current_user_id()
        
        if request.method == 'GET':
            # Retornar preferências do usuário
            # Em uma implementação real, isso viria do Firestore
            default_preferences = {
                'language': 'pt-BR',
                'theme': 'auto',
                'notifications': True,
                'persona_preference': 'ga',
                'email_updates': False
            }
            
            return jsonify({
                'success': True,
                'data': {
                    'user_id': user_id,
                    'preferences': default_preferences
                },
                'timestamp': datetime.now().isoformat()
            })
        
        elif request.method == 'POST':
            # Atualizar preferências
            data = request.get_json() or {}
            preferences = data.get('preferences', {})
            
            # Validar preferências
            allowed_preferences = [
                'language', 'theme', 'notifications', 
                'persona_preference', 'email_updates'
            ]
            
            filtered_preferences = {
                k: v for k, v in preferences.items() 
                if k in allowed_preferences
            }
            
            # Em uma implementação real, salvaria no Firestore
            logger.info(f"Atualizando preferências do usuário {user_id}: {filtered_preferences}")
            
            return jsonify({
                'success': True,
                'data': {
                    'user_id': user_id,
                    'updated_preferences': filtered_preferences,
                    'message': 'Preferências atualizadas com sucesso'
                },
                'timestamp': datetime.now().isoformat()
            })
    
    except Exception as e:
        logger.error(f"Erro ao gerenciar preferências: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

# ============================================
# ROTAS ADMINISTRATIVAS
# ============================================

@user_bp.route('/admin/users', methods=['GET'])
@require_admin()
def list_users():
    """
    Listar usuários (apenas admins)
    """
    try:
        # Em uma implementação real, isso buscaria do Firestore
        mock_users = [
            {
                'uid': 'user1',
                'email': 'user1@example.com',
                'name': 'Usuário 1',
                'created_at': '2024-01-01T00:00:00Z',
                'last_login': '2024-01-15T10:30:00Z',
                'status': 'active'
            },
            {
                'uid': 'user2', 
                'email': 'user2@example.com',
                'name': 'Usuário 2',
                'created_at': '2024-01-02T00:00:00Z',
                'last_login': '2024-01-14T15:45:00Z',
                'status': 'active'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'users': mock_users,
                'total': len(mock_users),
                'page': 1,
                'per_page': 50
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar usuários: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

@user_bp.route('/admin/stats', methods=['GET'])
@require_admin()
def user_stats():
    """
    Estatísticas de usuários (apenas admins)
    """
    try:
        # Mock de estatísticas
        stats = {
            'total_users': 150,
            'active_users_last_30_days': 120,
            'new_users_this_month': 25,
            'verified_emails': 100,
            'by_provider': {
                'email': 140,
                'google': 8,
                'anonymous': 2
            },
            'by_plan': {
                'free': 145,
                'premium': 5
            }
        }
        
        return jsonify({
            'success': True,
            'data': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

# ============================================
# ROTAS DE SESSÃO E ANALYTICS
# ============================================

@user_bp.route('/session', methods=['GET'])
@require_auth(optional=True)  # Opcional para permitir sessões anônimas
def get_session_info():
    """
    Informações da sessão atual
    """
    try:
        is_auth = is_authenticated()
        user_id = get_current_user_id()
        
        session_info = {
            'is_authenticated': is_auth,
            'session_type': 'authenticated' if is_auth else 'anonymous',
            'timestamp': datetime.now().isoformat()
        }
        
        if is_auth:
            user_data = get_current_user()
            session_info.update({
                'user_id': user_id,
                'email': user_data.get('email') if user_data else None,
                'auth_time': user_data.get('auth_time') if user_data else None,
                'sign_in_provider': getattr(g, 'sign_in_provider', None)
            })
        else:
            session_info.update({
                'message': 'Sessão anônima - funcionalidades básicas disponíveis',
                'upgrade_available': True
            })
        
        return jsonify({
            'success': True,
            'data': session_info
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter informações da sessão: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

@user_bp.route('/activity', methods=['POST'])
@require_auth(optional=True)
def log_user_activity():
    """
    Registrar atividade do usuário (para analytics)
    """
    try:
        user_id = get_current_user_id() if is_authenticated() else 'anonymous'
        data = request.get_json() or {}
        
        activity = {
            'user_id': user_id,
            'action': data.get('action', 'unknown'),
            'page': data.get('page', '/'),
            'timestamp': datetime.now().isoformat(),
            'user_agent': request.headers.get('User-Agent', ''),
            'ip_address': request.remote_addr
        }
        
        # Em uma implementação real, isso seria salvo no Firestore ou analytics
        logger.info(f"Atividade registrada: {activity}")
        
        return jsonify({
            'success': True,
            'data': {
                'message': 'Atividade registrada com sucesso',
                'activity_id': f"activity_{int(datetime.now().timestamp())}"
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao registrar atividade: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR'
        }), 500

# ============================================
# ROTAS DE STATUS E HEALTH
# ============================================

@user_bp.route('/auth/status', methods=['GET'])
def auth_status():
    """
    Status do sistema de autenticação (público)
    """
    try:
        auth_info = {
            'jwt_validation_available': JWT_AVAILABLE,
            'authentication_required': False,  # Sistema funciona sem auth
            'features': {
                'anonymous_access': True,
                'authenticated_features': JWT_AVAILABLE,
                'admin_features': JWT_AVAILABLE,
                'user_profiles': JWT_AVAILABLE
            },
            'endpoints': {
                'login_required': [
                    '/api/v1/user/profile',
                    '/api/v1/user/preferences'
                ],
                'admin_required': [
                    '/api/v1/user/admin/users',
                    '/api/v1/user/admin/stats'
                ],
                'optional_auth': [
                    '/api/v1/user/session',
                    '/api/v1/user/activity'
                ]
            }
        }
        
        return jsonify({
            'success': True,
            'data': auth_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter status de auth: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

# ============================================
# ERROR HANDLERS
# ============================================

@user_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Não autorizado',
        'error_code': 'UNAUTHORIZED',
        'message': 'Token de autenticação necessário ou inválido'
    }), 401

@user_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Acesso negado',
        'error_code': 'FORBIDDEN',
        'message': 'Privilégios insuficientes para esta operação'
    }), 403

@user_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Recurso não encontrado',
        'error_code': 'NOT_FOUND'
    }), 404

# Log de inicialização
logger.info(f"🔐 User Blueprint carregado {'com' if JWT_AVAILABLE else 'sem'} autenticação JWT")