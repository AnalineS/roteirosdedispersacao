"""
JWT Validator - Validação de Tokens Firebase no Backend
Sistema robusto de validação de tokens JWT do Firebase Authentication
Integra com o sistema existente de forma não-intrusiva
"""

import jwt
import requests
import time
from typing import Dict, Optional, Any, Tuple
from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta
import logging
import os

# Configuração de logging
logger = logging.getLogger(__name__)

class FirebaseJWTValidator:
    """
    Validador de tokens JWT do Firebase Authentication
    """
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.public_keys: Dict[str, Any] = {}
        self.keys_expiry: datetime = datetime.min
        self.cache_duration = timedelta(hours=1)  # Cache das chaves por 1 hora
        self.issuer = f"https://securetoken.google.com/{project_id}"
        self.audience = project_id
        
    def _fetch_public_keys(self) -> Dict[str, Any]:
        """
        Busca as chaves públicas do Firebase
        """
        try:
            url = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Extrair tempo de cache dos headers
            cache_control = response.headers.get('cache-control', '')
            max_age = 3600  # Default 1 hora
            
            if 'max-age=' in cache_control:
                try:
                    max_age = int(cache_control.split('max-age=')[1].split(',')[0])
                except (ValueError, IndexError, AttributeError):
                    # Falha ao parsear max-age do cache-control header
                    # Usar valor padrão de max_age já definido (3600 segundos)
                    logger.debug("Não foi possível extrair max-age do cache-control, usando padrão")
            
            self.keys_expiry = datetime.now() + timedelta(seconds=max_age)
            return response.json()
            
        except Exception as e:
            logger.error(f"Erro ao buscar chaves públicas do Firebase: {e}")
            return {}
    
    def _get_public_keys(self) -> Dict[str, Any]:
        """
        Obter chaves públicas com cache
        """
        if datetime.now() >= self.keys_expiry or not self.public_keys:
            self.public_keys = self._fetch_public_keys()
        
        return self.public_keys
    
    def validate_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Valida um token JWT do Firebase
        
        Returns:
            Tuple[bool, Optional[Dict], Optional[str]]: (is_valid, payload, error_message)
        """
        if not token:
            return False, None, "Token não fornecido"
        
        try:
            # Remover prefixo Bearer se presente
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decodificar header sem verificação para obter kid
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid:
                return False, None, "Token inválido: kid não encontrado"
            
            # Obter chaves públicas
            public_keys = self._get_public_keys()
            
            if kid not in public_keys:
                return False, None, f"Chave pública não encontrada para kid: {kid}"
            
            # Validar token
            payload = jwt.decode(
                token,
                public_keys[kid],
                algorithms=['RS256'],
                audience=self.audience,
                issuer=self.issuer,
                options={
                    'verify_exp': True,
                    'verify_aud': True,
                    'verify_iss': True,
                    'verify_sub': True
                }
            )
            
            # Validações adicionais
            current_time = time.time()
            
            # Verificar expiração (adicional)
            if payload.get('exp', 0) < current_time:
                return False, None, "Token expirado"
            
            # Verificar se token foi emitido no futuro
            if payload.get('iat', 0) > current_time + 300:  # 5 minutos de tolerância
                return False, None, "Token emitido no futuro"
            
            # Verificar auth_time se presente
            auth_time = payload.get('auth_time')
            if auth_time and auth_time > current_time + 300:
                return False, None, "auth_time inválido"
            
            return True, payload, None
            
        except jwt.ExpiredSignatureError:
            return False, None, "Token expirado"
        except jwt.InvalidAudienceError:
            return False, None, "Audience inválida"
        except jwt.InvalidIssuerError:
            return False, None, "Issuer inválido"
        except jwt.InvalidSignatureError:
            return False, None, "Assinatura inválida"
        except jwt.InvalidTokenError as e:
            return False, None, f"Token inválido: {str(e)}"
        except Exception as e:
            logger.error(f"Erro na validação do token: {e}")
            return False, None, "Erro interno na validação"

# Instância global do validador
jwt_validator: Optional[FirebaseJWTValidator] = None

def init_jwt_validator(project_id: str) -> None:
    """
    Inicializa o validador JWT
    """
    global jwt_validator
    if project_id:
        jwt_validator = FirebaseJWTValidator(project_id)
        logger.info(f"JWT Validator inicializado para projeto: {project_id}")
    else:
        logger.warning("Projeto Firebase não configurado - validação JWT desabilitada")

def require_auth(optional: bool = False):
    """
    Decorator para endpoints que requerem autenticação
    
    Args:
        optional: Se True, a autenticação é opcional e o usuário pode ser None
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar se JWT está habilitado
            if not jwt_validator:
                if optional:
                    g.user = None
                    g.user_id = None
                    g.is_authenticated = False
                    return f(*args, **kwargs)
                else:
                    # Se não opcional e JWT não configurado, permitir acesso
                    # (compatibilidade com sistema atual)
                    g.user = None
                    g.user_id = None
                    g.is_authenticated = False
                    return f(*args, **kwargs)
            
            # Extrair token do header
            auth_header = request.headers.get('Authorization')
            token = None
            
            if auth_header:
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:]
                else:
                    token = auth_header
            
            # Se não há token e é opcional, continuar sem autenticação
            if not token and optional:
                g.user = None
                g.user_id = None
                g.is_authenticated = False
                return f(*args, **kwargs)
            
            # Se não há token e é obrigatório, retornar erro
            if not token and not optional:
                return jsonify({
                    'success': False,
                    'error': 'Token de autenticação necessário',
                    'error_code': 'AUTH_REQUIRED'
                }), 401
            
            # Validar token
            is_valid, payload, error_message = jwt_validator.validate_token(token)
            
            if not is_valid:
                if optional:
                    # Se autenticação é opcional e token é inválido, continuar sem auth
                    g.user = None
                    g.user_id = None
                    g.is_authenticated = False
                    return f(*args, **kwargs)
                else:
                    return jsonify({
                        'success': False,
                        'error': error_message or 'Token inválido',
                        'error_code': 'INVALID_TOKEN'
                    }), 401
            
            # Armazenar informações do usuário no contexto Flask
            g.user = payload
            g.user_id = payload.get('sub')  # Firebase UID
            g.is_authenticated = True
            g.user_email = payload.get('email')
            g.user_name = payload.get('name')
            g.email_verified = payload.get('email_verified', False)
            
            # Informações adicionais do Firebase
            firebase_claims = payload.get('firebase', {})
            g.auth_time = payload.get('auth_time')
            g.sign_in_provider = firebase_claims.get('sign_in_provider')
            g.custom_claims = firebase_claims.get('custom_claims', {})
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Obter usuário atual do contexto Flask
    """
    return getattr(g, 'user', None)

def get_current_user_id() -> Optional[str]:
    """
    Obter ID do usuário atual
    """
    return getattr(g, 'user_id', None)

def is_authenticated() -> bool:
    """
    Verificar se usuário está autenticado
    """
    return getattr(g, 'is_authenticated', False)

def require_admin():
    """
    Decorator para endpoints que requerem privilégios de admin
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_authenticated():
                return jsonify({
                    'success': False,
                    'error': 'Autenticação necessária',
                    'error_code': 'AUTH_REQUIRED'
                }), 401
            
            # Verificar claims customizados para admin
            custom_claims = getattr(g, 'custom_claims', {})
            if not custom_claims.get('admin', False):
                return jsonify({
                    'success': False,
                    'error': 'Privilégios de administrador necessários',
                    'error_code': 'ADMIN_REQUIRED'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(required_role: str):
    """
    Decorator para verificar role específico
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_authenticated():
                return jsonify({
                    'success': False,
                    'error': 'Autenticação necessária',
                    'error_code': 'AUTH_REQUIRED'
                }), 401
            
            custom_claims = getattr(g, 'custom_claims', {})
            user_roles = custom_claims.get('roles', [])
            
            if required_role not in user_roles:
                return jsonify({
                    'success': False,
                    'error': f'Role {required_role} necessário',
                    'error_code': 'INSUFFICIENT_ROLE'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def create_auth_middleware():
    """
    Middleware para adicionar informações de autenticação a todas as requisições
    """
    def middleware():
        # Inicializar variáveis de contexto
        g.user = None
        g.user_id = None
        g.is_authenticated = False
        
        # Se JWT não está configurado, pular validação
        if not jwt_validator:
            return
        
        # Tentar extrair e validar token se presente
        auth_header = request.headers.get('Authorization')
        if auth_header:
            token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else auth_header
            
            is_valid, payload, _ = jwt_validator.validate_token(token)
            if is_valid and payload:
                g.user = payload
                g.user_id = payload.get('sub')
                g.is_authenticated = True
                g.user_email = payload.get('email')
                g.user_name = payload.get('name')
                g.email_verified = payload.get('email_verified', False)
                
                firebase_claims = payload.get('firebase', {})
                g.auth_time = payload.get('auth_time')
                g.sign_in_provider = firebase_claims.get('sign_in_provider')
                g.custom_claims = firebase_claims.get('custom_claims', {})
    
    return middleware

# Utilitários para verificação de permissões
class PermissionChecker:
    """
    Utilitário para verificação de permissões complexas
    """
    
    @staticmethod
    def can_access_user_data(target_user_id: str) -> bool:
        """
        Verificar se o usuário atual pode acessar dados de outro usuário
        """
        if not is_authenticated():
            return False
        
        current_user_id = get_current_user_id()
        
        # Usuário pode sempre acessar seus próprios dados
        if current_user_id == target_user_id:
            return True
        
        # Admins podem acessar dados de qualquer usuário
        custom_claims = getattr(g, 'custom_claims', {})
        if custom_claims.get('admin', False):
            return True
        
        # Verificar roles específicos
        user_roles = custom_claims.get('roles', [])
        if 'moderator' in user_roles or 'support' in user_roles:
            return True
        
        return False
    
    @staticmethod
    def can_modify_user_data(target_user_id: str) -> bool:
        """
        Verificar se o usuário atual pode modificar dados de outro usuário
        """
        if not is_authenticated():
            return False
        
        current_user_id = get_current_user_id()
        
        # Usuário pode sempre modificar seus próprios dados
        if current_user_id == target_user_id:
            return True
        
        # Apenas admins podem modificar dados de outros usuários
        custom_claims = getattr(g, 'custom_claims', {})
        return custom_claims.get('admin', False)
    
    @staticmethod
    def can_access_analytics() -> bool:
        """
        Verificar se o usuário pode acessar analytics
        """
        if not is_authenticated():
            return False
        
        custom_claims = getattr(g, 'custom_claims', {})
        user_roles = custom_claims.get('roles', [])
        
        return (custom_claims.get('admin', False) or 
                'analytics' in user_roles or 
                'moderator' in user_roles)

# Configuração de ambiente
def get_firebase_project_id() -> Optional[str]:
    """
    Obter project ID do Firebase das variáveis de ambiente
    """
    return os.getenv('FIREBASE_PROJECT_ID') or os.getenv('GOOGLE_CLOUD_PROJECT')

def configure_jwt_from_env() -> None:
    """
    Configurar validação JWT a partir das variáveis de ambiente
    """
    project_id = get_firebase_project_id()
    if project_id:
        init_jwt_validator(project_id)
    else:
        logger.info("Firebase project ID não configurado - JWT validation desabilitada")