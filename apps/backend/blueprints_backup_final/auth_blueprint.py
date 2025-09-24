# -*- coding: utf-8 -*-
"""
Auth Blueprint - Endpoints de Autenticação JWT
Substitui completamente o Firebase Auth
"""

from flask import Blueprint, request, jsonify, redirect, url_for
from functools import wraps
import logging
from typing import Dict, Optional

from services.auth.jwt_auth_manager import get_auth_manager
from core.security.input_validator import InputValidator

logger = logging.getLogger(__name__)

# Criar blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

# Instâncias
auth_manager = get_auth_manager()
validator = InputValidator()

# === DECORADORES ===

def jwt_required(f):
    """Decorator para endpoints que requerem autenticação"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Obter token do header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Token de acesso requerido'}), 401

            token = auth_header.split(' ')[1]

            # Verificar token
            payload = auth_manager.verify_token(token, 'access')
            if not payload:
                return jsonify({'error': 'Token inválido ou expirado'}), 401

            # Adicionar dados do usuário ao request
            request.current_user = payload
            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"Erro na verificação JWT: {e}")
            return jsonify({'error': 'Erro interno de autenticação'}), 500

    return decorated

def optional_auth(f):
    """Decorator para endpoints com autenticação opcional"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                payload = auth_manager.verify_token(token, 'access')
                request.current_user = payload
            else:
                request.current_user = None

            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"Erro na verificação opcional: {e}")
            request.current_user = None
            return f(*args, **kwargs)

    return decorated

# === ENDPOINTS GOOGLE OAUTH ===

@auth_bp.route('/google/url', methods=['GET'])
def google_auth_url():
    """
    Gerar URL de autenticação Google

    Returns:
        JSON com auth_url
    """
    try:
        # Estado personalizado para CSRF
        state = request.args.get('state', '')

        auth_url = auth_manager.get_google_auth_url(state)

        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'state': state
        }), 200

    except ValueError as e:
        logger.error(f"Erro de configuração Google: {e}")
        return jsonify({
            'error': 'Configuração Google OAuth incompleta'
        }), 500

    except Exception as e:
        logger.error(f"Erro ao gerar URL Google: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """
    Processar callback do Google OAuth

    Body:
        - code: Authorization code
        - state: Estado CSRF (opcional)

    Returns:
        JSON com tokens e dados do usuário
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400

        # Validar entrada
        if not validator.validate_required_fields(data, ['code']):
            return jsonify({'error': 'Code é obrigatório'}), 400

        code = data['code']
        state = data.get('state')

        # Processar callback
        result = auth_manager.handle_google_callback(code, state)
        if not result:
            return jsonify({'error': 'Falha na autenticação Google'}), 401

        # Retornar dados
        return jsonify({
            'success': True,
            'user': {
                'id': result['user']['sub'],
                'email': result['user']['email'],
                'name': result['user']['name'],
                'picture': result['user'].get('picture')
            },
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'session_id': result['session_id']
        }), 200

    except ValueError as e:
        logger.error(f"Erro de configuração no callback: {e}")
        return jsonify({
            'error': 'Configuração OAuth incompleta'
        }), 500

    except Exception as e:
        logger.error(f"Erro no callback Google: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

# === ENDPOINTS EMAIL/PASSWORD ===

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registrar usuário com email/senha

    Body:
        - email: Email válido
        - password: Senha (min 8 chars)
        - name: Nome do usuário

    Returns:
        JSON com tokens e dados do usuário
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400

        # Validar entrada
        required_fields = ['email', 'password', 'name']
        if not validator.validate_required_fields(data, required_fields):
            return jsonify({'error': 'Campos obrigatórios: email, password, name'}), 400

        email = data['email'].strip().lower()
        password = data['password']
        name = data['name'].strip()

        # Validar email
        if not validator.validate_email(email):
            return jsonify({'error': 'Email inválido'}), 400

        # Validar senha
        if len(password) < 8:
            return jsonify({'error': 'Senha deve ter pelo menos 8 caracteres'}), 400

        # Validar nome
        if len(name) < 2:
            return jsonify({'error': 'Nome deve ter pelo menos 2 caracteres'}), 400

        # Registrar usuário
        result = auth_manager.register_user(email, password, name)
        if not result:
            return jsonify({'error': 'Email já está em uso ou erro interno'}), 409

        # Retornar dados
        return jsonify({
            'success': True,
            'user': {
                'id': result['user']['sub'],
                'email': result['user']['email'],
                'name': result['user']['name']
            },
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'session_id': result['session_id']
        }), 201

    except Exception as e:
        logger.error(f"Erro no registro: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login com email/senha

    Body:
        - email: Email do usuário
        - password: Senha

    Returns:
        JSON com tokens e dados do usuário
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400

        # Validar entrada
        required_fields = ['email', 'password']
        if not validator.validate_required_fields(data, required_fields):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400

        email = data['email'].strip().lower()
        password = data['password']

        # Login
        result = auth_manager.login_user(email, password)
        if not result:
            return jsonify({'error': 'Email ou senha incorretos'}), 401

        # Retornar dados
        return jsonify({
            'success': True,
            'user': {
                'id': result['user']['sub'],
                'email': result['user']['email'],
                'name': result['user']['name']
            },
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'session_id': result['session_id']
        }), 200

    except Exception as e:
        logger.error(f"Erro no login: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

# === ENDPOINTS TOKEN MANAGEMENT ===

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Renovar access token usando refresh token

    Body:
        - refresh_token: Token de refresh válido

    Returns:
        JSON com novo access token
    """
    try:
        data = request.get_json()
        if not data or 'refresh_token' not in data:
            return jsonify({'error': 'Refresh token é obrigatório'}), 400

        refresh_token = data['refresh_token']

        # Renovar token
        new_access_token = auth_manager.refresh_access_token(refresh_token)
        if not new_access_token:
            return jsonify({'error': 'Refresh token inválido ou expirado'}), 401

        return jsonify({
            'success': True,
            'access_token': new_access_token
        }), 200

    except Exception as e:
        logger.error(f"Erro no refresh: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout():
    """
    Logout (revogar sessão atual)

    Headers:
        - Authorization: Bearer <access_token>

    Returns:
        JSON confirmando logout
    """
    try:
        session_id = request.current_user.get('session_id')
        if session_id:
            auth_manager.revoke_session(session_id)

        return jsonify({
            'success': True,
            'message': 'Logout realizado com sucesso'
        }), 200

    except Exception as e:
        logger.error(f"Erro no logout: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/logout-all', methods=['POST'])
@jwt_required
def logout_all():
    """
    Logout de todas as sessões do usuário

    Headers:
        - Authorization: Bearer <access_token>

    Returns:
        JSON confirmando logout
    """
    try:
        user_id = request.current_user.get('user_id')
        if user_id:
            auth_manager.revoke_all_sessions(user_id)

        return jsonify({
            'success': True,
            'message': 'Logout de todas as sessões realizado'
        }), 200

    except Exception as e:
        logger.error(f"Erro no logout all: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

# === ENDPOINTS USER PROFILE ===

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_profile():
    """
    Obter perfil do usuário atual

    Headers:
        - Authorization: Bearer <access_token>

    Returns:
        JSON com dados do perfil
    """
    try:
        user_id = request.current_user.get('user_id')
        user = auth_manager.get_user_profile(user_id)

        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Remover dados sensíveis
        profile_data = user.get('profile_data', {})
        if 'password_hash' in profile_data:
            del profile_data['password_hash']

        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'profile_data': profile_data,
                'created_at': user['created_at'],
                'updated_at': user['updated_at']
            }
        }), 200

    except Exception as e:
        logger.error(f"Erro ao obter perfil: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/me', methods=['PUT'])
@jwt_required
def update_profile():
    """
    Atualizar perfil do usuário

    Headers:
        - Authorization: Bearer <access_token>

    Body:
        - name: Novo nome (opcional)
        - profile_data: Dados adicionais (opcional)

    Returns:
        JSON confirmando atualização
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400

        user_id = request.current_user.get('user_id')

        # Atualizar perfil
        success = auth_manager.update_user_profile(user_id, data)
        if not success:
            return jsonify({'error': 'Falha ao atualizar perfil'}), 500

        return jsonify({
            'success': True,
            'message': 'Perfil atualizado com sucesso'
        }), 200

    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

# === ENDPOINTS UTILITIES ===

@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """
    Verificar se token é válido

    Body:
        - token: JWT token para verificar

    Returns:
        JSON com status da verificação
    """
    try:
        data = request.get_json()
        if not data or 'token' not in data:
            return jsonify({'error': 'Token é obrigatório'}), 400

        token = data['token']
        payload = auth_manager.verify_token(token, 'access')

        if payload:
            return jsonify({
                'success': True,
                'valid': True,
                'user_id': payload.get('user_id'),
                'email': payload.get('email'),
                'exp': payload.get('exp')
            }), 200
        else:
            return jsonify({
                'success': True,
                'valid': False
            }), 200

    except Exception as e:
        logger.error(f"Erro na verificação: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """
    Status do sistema de autenticação

    Returns:
        JSON com estatísticas do sistema
    """
    try:
        # Limpar sessões expiradas
        expired_count = auth_manager.cleanup_expired_sessions()

        # Obter estatísticas do banco
        db_stats = auth_manager.db.get_stats()

        return jsonify({
            'success': True,
            'system_status': 'operational',
            'expired_sessions_cleaned': expired_count,
            'database_stats': db_stats,
            'auth_providers': ['google', 'email'],
            'features': {
                'jwt_auth': True,
                'google_oauth': bool(auth_manager.google_client_id),
                'email_auth': True,
                'session_management': True
            }
        }), 200

    except Exception as e:
        logger.error(f"Erro no status: {e}")
        return jsonify({
            'error': 'Erro interno do servidor'
        }), 500

# === ERROR HANDLERS ===

@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Requisição inválida'}), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Não autorizado'}), 401

@auth_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Acesso negado'}), 403

@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso não encontrado'}), 404

@auth_bp.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({'error': 'Muitas tentativas. Tente novamente mais tarde'}), 429

@auth_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

# Exportar decoradores para uso em outros blueprints
__all__ = ['auth_bp', 'jwt_required', 'optional_auth']