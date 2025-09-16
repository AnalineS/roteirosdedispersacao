"""
JWT Validator - Decorators e middleware para autenticação
Sistema completo de validação com role-based access control
"""

from functools import wraps
from typing import List, Optional, Callable, Any
from flask import request, jsonify, g
import logging

logger = logging.getLogger(__name__)

def extract_token_from_request() -> Optional[str]:
    """
    Extrai token JWT do header Authorization
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    # Formato: "Bearer <token>"
    try:
        scheme, token = auth_header.split(' ', 1)
        if scheme.lower() != 'bearer':
            return None
        return token
    except ValueError:
        return None

def require_auth(f: Callable) -> Callable:
    """
    Decorator que requer autenticação válida
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Importar aqui para evitar imports circulares
        from .jwt_manager import get_jwt_manager, TokenType

        # Extrair token
        token = extract_token_from_request()
        if not token:
            return jsonify({
                'error': 'Authentication required',
                'message': 'Missing or invalid Authorization header'
            }), 401

        # Verificar token
        jwt_manager = get_jwt_manager()
        user_claims = jwt_manager.verify_token(token, TokenType.ACCESS)

        if not user_claims:
            return jsonify({
                'error': 'Invalid token',
                'message': 'Token is expired, invalid, or session not found'
            }), 401

        # Armazenar claims no contexto da request
        g.current_user = user_claims
        g.user_id = user_claims.user_id
        g.user_email = user_claims.email
        g.user_roles = user_claims.roles
        g.session_id = user_claims.session_id

        return f(*args, **kwargs)

    return decorated_function

def require_roles(*required_roles: str):
    """
    Decorator que requer roles específicas
    Uso: @require_roles('admin', 'educator')
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            from .jwt_manager import get_jwt_manager

            user_claims = g.current_user
            jwt_manager = get_jwt_manager()

            # Verificar se usuário tem alguma das roles necessárias
            if not jwt_manager.has_any_role(user_claims, list(required_roles)):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': f'Required roles: {", ".join(required_roles)}',
                    'user_roles': user_claims.roles
                }), 403

            return f(*args, **kwargs)

        return decorated_function
    return decorator

def require_admin(f: Callable) -> Callable:
    """
    Decorator que requer role de admin
    """
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        from .jwt_manager import get_jwt_manager

        user_claims = g.current_user
        jwt_manager = get_jwt_manager()

        if not jwt_manager.is_admin(user_claims):
            return jsonify({
                'error': 'Admin access required',
                'message': 'This endpoint requires administrator privileges'
            }), 403

        return f(*args, **kwargs)

    return decorated_function

def optional_auth(f: Callable) -> Callable:
    """
    Decorator que tenta autenticar mas não falha se não houver token
    Útil para endpoints que funcionam com ou sem autenticação
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from .jwt_manager import get_jwt_manager, TokenType

        # Tentar extrair e verificar token
        token = extract_token_from_request()
        if token:
            jwt_manager = get_jwt_manager()
            user_claims = jwt_manager.verify_token(token, TokenType.ACCESS)

            if user_claims:
                # Armazenar claims no contexto se válido
                g.current_user = user_claims
                g.user_id = user_claims.user_id
                g.user_email = user_claims.email
                g.user_roles = user_claims.roles
                g.session_id = user_claims.session_id
            else:
                # Token inválido, mas não falhar
                g.current_user = None
        else:
            # Sem token, usuário anônimo
            g.current_user = None

        return f(*args, **kwargs)

    return decorated_function

def get_current_user():
    """
    Obtém usuário atual do contexto da request
    """
    return getattr(g, 'current_user', None)
