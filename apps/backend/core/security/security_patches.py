"""
Security Patches - Correções de vulnerabilidades
Implementa correções para vulnerabilidades de alta severidade
"""

import re
import html
import json
import logging
from typing import Any, Dict, Optional, Union
from functools import wraps
from flask import request, jsonify, abort
from werkzeug.security import generate_password_hash
from markupsafe import Markup, escape
import bleach

logger = logging.getLogger(__name__)

# ================== INPUT SANITIZATION ==================

class EnhancedInputSanitizer:
    """Sanitização avançada de inputs contra XSS, SQL Injection e Command Injection"""
    
    # Padrões perigosos para detecção
    DANGEROUS_PATTERNS = [
        # SQL Injection
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)",
        # Command Injection
        r"(\||;|&|`|\$\(|\))",
        # Path Traversal
        r"(\.\.\/|\.\.\\)",
        # XSS básico
        r"(<script|<iframe|javascript:|onerror=|onclick=)",
        # LDAP Injection
        r"(\*|\(|\)|\\)",
    ]
    
    # Tags HTML permitidas (para conteúdo rich text)
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre'
    ]
    
    ALLOWED_ATTRIBUTES = {
        'a': ['href', 'title', 'target'],
        'code': ['class'],
    }
    
    @classmethod
    def sanitize_text(cls, text: str, allow_html: bool = False) -> str:
        """
        Sanitiza texto removendo conteúdo perigoso
        
        Args:
            text: Texto a ser sanitizado
            allow_html: Se True, permite HTML seguro
            
        Returns:
            Texto sanitizado
        """
        if not text:
            return ""
            
        # Remover caracteres null
        text = text.replace('\x00', '')
        
        # Limitar tamanho para prevenir DoS
        MAX_LENGTH = 50000
        if len(text) > MAX_LENGTH:
            text = text[:MAX_LENGTH]
        
        if allow_html:
            # Usar bleach para sanitizar HTML
            text = bleach.clean(
                text,
                tags=cls.ALLOWED_TAGS,
                attributes=cls.ALLOWED_ATTRIBUTES,
                strip=True
            )
        else:
            # Escapar HTML
            text = html.escape(text)
        
        # Verificar padrões perigosos
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Padrão perigoso detectado: {pattern[:20]}...")
                # Remover o padrão perigoso
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text
    
    @classmethod
    def sanitize_json(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitiza objeto JSON recursivamente
        
        Args:
            data: Dicionário a ser sanitizado
            
        Returns:
            Dicionário sanitizado
        """
        if not isinstance(data, dict):
            return {}
        
        sanitized = {}
        for key, value in data.items():
            # Sanitizar chave
            safe_key = cls.sanitize_text(str(key), allow_html=False)
            
            # Sanitizar valor baseado no tipo
            if isinstance(value, str):
                sanitized[safe_key] = cls.sanitize_text(value, allow_html=False)
            elif isinstance(value, dict):
                sanitized[safe_key] = cls.sanitize_json(value)
            elif isinstance(value, list):
                sanitized[safe_key] = [
                    cls.sanitize_text(str(item), allow_html=False) 
                    if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[safe_key] = value
        
        return sanitized

# ================== RATE LIMITING ==================

class EnhancedRateLimiter:
    """Rate limiting avançado para prevenir ataques de força bruta e DoS"""
    
    # Armazenamento em memória (em produção, usar Redis)
    _attempts = {}
    
    @classmethod
    def check_rate_limit(cls, identifier: str, max_attempts: int = 10, window: int = 60) -> bool:
        """
        Verifica se o rate limit foi excedido
        
        Args:
            identifier: IP ou ID do usuário
            max_attempts: Máximo de tentativas permitidas
            window: Janela de tempo em segundos
            
        Returns:
            True se dentro do limite, False se excedido
        """
        import time
        current_time = time.time()
        
        if identifier not in cls._attempts:
            cls._attempts[identifier] = []
        
        # Limpar tentativas antigas
        cls._attempts[identifier] = [
            timestamp for timestamp in cls._attempts[identifier]
            if current_time - timestamp < window
        ]
        
        # Verificar limite
        if len(cls._attempts[identifier]) >= max_attempts:
            return False
        
        # Registrar nova tentativa
        cls._attempts[identifier].append(current_time)
        return True

# ================== CORS SECURITY ==================

def secure_cors_headers(response):
    """
    Adiciona headers de segurança CORS apropriados
    
    Args:
        response: Objeto de resposta Flask
        
    Returns:
        Response com headers seguros
    """
    # Definir origens permitidas (em produção, ser mais restritivo)
    allowed_origins = [
        'https://roteirosdedispensacao.com',
        'https://www.roteirosdedispensacao.com',
        'https://roteiros-de-dispensacao.web.app',
        'https://roteiros-de-dispensacao.firebaseapp.com'
    ]
    
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    
    # Headers de segurança adicionais
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Content Security Policy
    csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline';"
    response.headers['Content-Security-Policy'] = csp
    
    return response

# ================== SQL INJECTION PREVENTION ==================

class SQLInjectionPrevention:
    """Prevenção contra SQL Injection"""
    
    @staticmethod
    def validate_parameter(param: str, param_type: str = 'string') -> Union[str, int, None]:
        """
        Valida e sanitiza parâmetros SQL
        
        Args:
            param: Parâmetro a validar
            param_type: Tipo esperado ('string', 'integer', 'uuid')
            
        Returns:
            Parâmetro validado ou None se inválido
        """
        if not param:
            return None
        
        if param_type == 'integer':
            try:
                return int(param)
            except (ValueError, TypeError):
                logger.warning(f"Parâmetro integer inválido: {param}")
                return None
        
        elif param_type == 'uuid':
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            if re.match(uuid_pattern, param, re.IGNORECASE):
                return param
            logger.warning(f"UUID inválido: {param}")
            return None
        
        else:  # string
            # Remover caracteres perigosos
            safe_param = re.sub(r'[^\w\s\-\.]', '', param)
            return safe_param[:255]  # Limitar tamanho

# ================== AUTHENTICATION SECURITY ==================

class AuthenticationSecurity:
    """Segurança de autenticação"""
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Valida força da senha
        
        Args:
            password: Senha a validar
            
        Returns:
            (válido, mensagem de erro)
        """
        if len(password) < 8:
            return False, "Senha deve ter no mínimo 8 caracteres"
        
        if not re.search(r'[A-Z]', password):
            return False, "Senha deve conter letra maiúscula"
        
        if not re.search(r'[a-z]', password):
            return False, "Senha deve conter letra minúscula"
        
        if not re.search(r'[0-9]', password):
            return False, "Senha deve conter número"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Senha deve conter caractere especial"
        
        # Verificar senhas comuns
        common_passwords = ['password', '12345678', 'qwerty', 'abc123']
        if password.lower() in common_passwords:
            return False, "Senha muito comum"
        
        return True, "Senha válida"
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Gera hash seguro da senha
        
        Args:
            password: Senha em texto plano
            
        Returns:
            Hash da senha
        """
        return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)

# ================== DECORATORS ==================

def sanitize_inputs(f):
    """Decorator para sanitizar inputs automaticamente"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Sanitizar dados do request
        if request.method in ['POST', 'PUT', 'PATCH']:
            if request.is_json:
                sanitized_data = EnhancedInputSanitizer.sanitize_json(request.get_json())
                request._cached_json = sanitized_data
            elif request.form:
                sanitized_form = {}
                for key, value in request.form.items():
                    sanitized_form[key] = EnhancedInputSanitizer.sanitize_text(value)
                request.form = sanitized_form
        
        # Sanitizar query parameters
        if request.args:
            sanitized_args = {}
            for key, value in request.args.items():
                sanitized_args[key] = EnhancedInputSanitizer.sanitize_text(value)
            request.args = sanitized_args
        
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(max_attempts: int = 10, window: int = 60):
    """Decorator para aplicar rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Usar IP como identificador
            identifier = request.remote_addr
            
            if not EnhancedRateLimiter.check_rate_limit(identifier, max_attempts, window):
                abort(429, description="Too many requests")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ================== FILE UPLOAD SECURITY ==================

class FileUploadSecurity:
    """Segurança para upload de arquivos"""
    
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'doc', 'docx'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @classmethod
    def validate_file(cls, file) -> tuple[bool, str]:
        """
        Valida arquivo para upload
        
        Args:
            file: Arquivo do request
            
        Returns:
            (válido, mensagem de erro)
        """
        if not file:
            return False, "Nenhum arquivo enviado"
        
        # Verificar nome do arquivo
        filename = file.filename
        if not filename:
            return False, "Nome de arquivo inválido"
        
        # Sanitizar nome do arquivo
        filename = re.sub(r'[^\w\s\-\.]', '', filename)
        
        # Verificar extensão
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        if ext not in cls.ALLOWED_EXTENSIONS:
            return False, f"Extensão {ext} não permitida"
        
        # Verificar tamanho
        file.seek(0, 2)  # Move para o final
        file_size = file.tell()
        file.seek(0)  # Volta para o início
        
        if file_size > cls.MAX_FILE_SIZE:
            return False, "Arquivo muito grande (máx 10MB)"
        
        # Verificar conteúdo (magic numbers)
        header = file.read(512)
        file.seek(0)
        
        # Verificar se não é executável
        if header.startswith(b'MZ'):  # Windows executable
            return False, "Arquivos executáveis não são permitidos"
        
        return True, "Arquivo válido"

# ================== EXPORT FUNCTIONS ==================

def apply_security_patches(app):
    """
    Aplica todos os patches de segurança na aplicação Flask
    
    Args:
        app: Instância da aplicação Flask
    """
    # Adicionar headers de segurança em todas as respostas
    @app.after_request
    def add_security_headers(response):
        return secure_cors_headers(response)
    
    # Configurar logging de segurança
    @app.before_request
    def log_security_info():
        logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    
    logger.info("Patches de segurança aplicados com sucesso")
    
    return app

__all__ = [
    'EnhancedInputSanitizer',
    'EnhancedRateLimiter',
    'SQLInjectionPrevention',
    'AuthenticationSecurity',
    'FileUploadSecurity',
    'sanitize_inputs',
    'rate_limit',
    'secure_cors_headers',
    'apply_security_patches'
]