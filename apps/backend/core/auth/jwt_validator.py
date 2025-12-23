"""
JWT Validator - Decorators e middleware para autenticação
Sistema completo de validação com role-based access control
"""

from functools import wraps
from typing import Optional, Callable
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

def configure_jwt_from_env():
    """
    Configura JWT Manager a partir de variáveis de ambiente

    Inicializa o sistema JWT global usando SECRET_KEY ou JWT_SECRET_KEY do config
    Esta função é chamada no startup do Flask em main.py
    """
    from .jwt_manager import initialize_jwt_system
    from app_config import config

    # Usar JWT_SECRET_KEY se disponível, senão SECRET_KEY
    secret_key = getattr(config, 'JWT_SECRET_KEY', None) or getattr(config, 'SECRET_KEY', None)

    if secret_key:
        initialize_jwt_system(secret_key)
        logger.info("JWT system configured from app_config")
    else:
        logger.warning("No JWT secret key found in configuration")

def create_auth_middleware():
    """
    Cria middleware de autenticação para app.before_request

    DESIGN: Middleware passthrough que não requer autenticação globalmente

    Comportamento:
    - Permite acesso anônimo a todos os endpoints por padrão
    - Endpoints protegidos usam @require_auth decorator explicitamente
    - Exemplos de endpoints públicos: /health, /chat, /personas
    - Exemplos de endpoints protegidos: /admin/*, /profile (usam @require_auth)

    Este design é apropriado para aplicações com endpoints mistos (públicos + privados)
    """
    def auth_middleware():
        # Passthrough middleware - não bloqueia requests
        # Autenticação é enforçada por @require_auth nos endpoints individuais
        pass

    return auth_middleware
