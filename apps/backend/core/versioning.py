# -*- coding: utf-8 -*-
"""
Sistema de Versionamento de API
Implementa estratégia de versioning com headers e URL paths
"""

from functools import wraps
from flask import request, jsonify, current_app
import logging

logger = logging.getLogger(__name__)

# Configuração de versões
API_VERSIONS = {
    'v1': {
        'version': '1.0.0',
        'status': 'stable',
        'released': '2025-01-14',
        'description': 'API inicial com suporte completo para hanseníase PQT-U'
    }
}

CURRENT_VERSION = 'v1'
DEFAULT_VERSION = 'v1'

def add_version_headers(response):
    """
    Adiciona headers de versionamento em todas as respostas
    """
    # Verificar se response tem headers (não é uma tupla de erro)
    if hasattr(response, 'headers'):
        response.headers['X-API-Version'] = API_VERSIONS[CURRENT_VERSION]['version']
        response.headers['X-API-Status'] = API_VERSIONS[CURRENT_VERSION]['status']
        response.headers['X-Supported-Versions'] = ','.join(API_VERSIONS.keys())
    return response

def version_required(min_version='v1'):
    """
    Decorator para validar versão mínima da API
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Extrair versão do path ou header
            requested_version = None
            
            # Tentar pegar do path primeiro
            if '/api/v' in request.path:
                try:
                    version_part = request.path.split('/api/')[1].split('/')[0]
                    if version_part.startswith('v'):
                        requested_version = version_part
                except:
                    pass
            
            # Se não encontrou no path, tentar header
            if not requested_version:
                requested_version = request.headers.get('X-API-Version', DEFAULT_VERSION)
                if not requested_version.startswith('v'):
                    requested_version = f'v{requested_version.split(".")[0]}'
            
            # Validar versão
            if requested_version not in API_VERSIONS:
                return jsonify({
                    'error': 'Versão de API não suportada',
                    'requested_version': requested_version,
                    'supported_versions': list(API_VERSIONS.keys()),
                    'current_version': CURRENT_VERSION
                }), 400
            
            # Adicionar versão ao contexto
            request.api_version = requested_version
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_version_info():
    """
    Retorna informações sobre as versões disponíveis da API
    """
    return {
        'current': CURRENT_VERSION,
        'default': DEFAULT_VERSION,
        'versions': API_VERSIONS,
        'deprecated': []  # Futuras versões deprecated
    }

class APIVersionManager:
    """
    Gerenciador centralizado de versões da API
    """
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """
        Inicializa o gerenciador com a aplicação Flask
        """
        app.before_request(self._before_request)
        app.after_request(self._after_request)
        
        # Registrar informações de versão no app
        app.config['API_VERSION'] = CURRENT_VERSION
        app.config['API_VERSIONS'] = API_VERSIONS
        
        logger.info(f"[OK] API Version Manager inicializado - Versão atual: {CURRENT_VERSION}")
    
    def _before_request(self):
        """
        Processa versão antes de cada request
        """
        # Log da versão requisitada
        if '/api/' in request.path:
            version = self._extract_version()
            logger.debug(f"API Request - Version: {version}, Path: {request.path}")
    
    def _after_request(self, response):
        """
        Adiciona headers de versão após cada request
        """
        if request.path.startswith('/api/'):
            response = add_version_headers(response)
        return response
    
    def _extract_version(self):
        """
        Extrai versão do request atual
        """
        if '/api/v' in request.path:
            try:
                return request.path.split('/api/')[1].split('/')[0]
            except:
                pass
        return DEFAULT_VERSION
    
    def get_endpoints_for_version(self, version='v1'):
        """
        Retorna todos os endpoints disponíveis para uma versão
        """
        endpoints = []
        for rule in self.app.url_map.iter_rules():
            if f'/api/{version}' in rule.rule:
                endpoints.append({
                    'path': rule.rule,
                    'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
                    'endpoint': rule.endpoint
                })
        return endpoints