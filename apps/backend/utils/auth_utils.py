"""
Authentication utilities for blueprints
Integração real com JWT Auth Manager
"""

from functools import wraps
from typing import Optional, Dict, Any
from flask import request, jsonify, g
import logging

logger = logging.getLogger(__name__)

def require_auth(f):
    """
    Decorator to require authentication
    Implementação real com JWT tokens
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Extrair token do header Authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                logger.warning("Token de autorização ausente ou inválido")
                return jsonify({
                    'error': 'Token de autorização obrigatório',
                    'code': 'MISSING_TOKEN'
                }), 401

            token = auth_header.split(' ')[1]

            # Verificar token usando JWT Auth Manager
            from services.auth.jwt_auth_manager import get_auth_manager
            auth_manager = get_auth_manager()

            payload = auth_manager.verify_token(token, 'access')
            if not payload:
                logger.warning("Token inválido ou expirado")
                return jsonify({
                    'error': 'Token inválido ou expirado',
                    'code': 'INVALID_TOKEN'
                }), 401

            # Adicionar dados do usuário ao contexto Flask
            g.current_user = {
                'id': payload['user_id'],
                'email': payload.get('email'),
                'name': payload.get('name'),
                'session_id': payload.get('session_id')
            }

            logger.debug(f"Usuário autenticado: {payload.get('email')}")
            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"Erro na autenticação: {e}")
            return jsonify({
                'error': 'Erro interno de autenticação',
                'code': 'AUTH_ERROR'
            }), 500

    return decorated_function

def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Get current user from request context
    Implementação real usando Flask.g
    """
    try:
        # Tentar obter do contexto Flask
        if hasattr(g, 'current_user'):
            return g.current_user

        # Fallback: extrair do token se não estiver no contexto
        user = extract_user_from_request()
        if user:
            g.current_user = user
            return user

        return None

    except Exception as e:
        logger.error(f"Erro ao obter usuário atual: {e}")
        return None

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify authentication token
    Implementação real com JWT Auth Manager
    """
    try:
        from services.auth.jwt_auth_manager import get_auth_manager
        auth_manager = get_auth_manager()

        payload = auth_manager.verify_token(token, 'access')
        if not payload:
            return None

        # Retornar dados do usuário em formato compatível
        return {
            'id': payload['user_id'],
            'email': payload.get('email'),
            'name': payload.get('name'),
            'session_id': payload.get('session_id'),
            'roles': ['user']  # Role padrão, pode ser expandido
        }

    except Exception as e:
        logger.error(f"Erro na verificação de token: {e}")
        return None

def extract_user_from_request() -> Optional[Dict[str, Any]]:
    """
    Extract user from current request
    Implementação real extraindo token do header
    """
    try:
        # Extrair token do header Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        return verify_token(token)

    except Exception as e:
        logger.error(f"Erro ao extrair usuário da requisição: {e}")
        return None

def require_auth_optional(f):
    """
    Decorator for optional authentication
    Se autenticado, adiciona user ao contexto; se não, continua sem user
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user = extract_user_from_request()
            if user:
                g.current_user = user
                logger.debug(f"Usuário opcional autenticado: {user.get('email')}")
            else:
                g.current_user = None
                logger.debug("Requisição sem autenticação (opcional)")

            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f"Erro na autenticação opcional: {e}")
            g.current_user = None
            return f(*args, **kwargs)

    return decorated_function