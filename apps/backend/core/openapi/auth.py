# -*- coding: utf-8 -*-
"""
Autenticação para Swagger/Documentação
"""

from functools import wraps
from flask import request, jsonify, current_app
import hashlib
import hmac
import os

def swagger_auth_required(f):
    """
    Decorator para proteger endpoints de documentação
    Usa autenticação básica simples ou token
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Em desenvolvimento, permitir acesso sem auth
        if os.environ.get('ENVIRONMENT', 'development') == 'development':
            return f(*args, **kwargs)
        
        # Verificar token de API
        auth_header = request.headers.get('Authorization')
        api_key = request.headers.get('X-API-Key')
        
        # Token secreto para documentação - deve ser configurado via env var
        # Sem fallback hardcoded por segurança
        doc_token = os.environ.get('DOC_API_KEY')
        
        # Verificar Authorization header
        if auth_header:
            try:
                scheme, token = auth_header.split(' ')
                if scheme.lower() == 'bearer' and token == doc_token:
                    return f(*args, **kwargs)
            except:
                pass
        
        # Verificar X-API-Key
        if api_key and api_key == doc_token:
            return f(*args, **kwargs)
        
        # Verificar query parameter (facilita acesso via browser)
        if request.args.get('api_key') == doc_token:
            return f(*args, **kwargs)
        
        return jsonify({
            'error': 'Autenticação necessária para acessar a documentação',
            'message': 'Forneça o token de API via header Authorization ou X-API-Key',
            'hint': 'Em desenvolvimento, a autenticação é desabilitada'
        }), 401
    
    return decorated_function