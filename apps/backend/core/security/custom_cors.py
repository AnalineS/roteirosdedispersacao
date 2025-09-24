# -*- coding: utf-8 -*-
"""
Custom CORS Middleware - Compatível com Error Handling
=======================================================

Implementação própria de CORS que resolve problemas de compatibilidade
com error handlers que retornam tuplas.

Autor: Sistema Backend Roteiro de Dispensação
Data: 30/08/2025
Seguindo princípios ITSM de rastreabilidade e manutenibilidade
"""

from flask import request, make_response
from typing import List, Union
import re

class CustomCORSMiddleware:
    """Middleware CORS customizado compatível com todos os tipos de response"""
    
    def __init__(self, app=None, origins: Union[str, List[str]] = "*", 
                 methods: List[str] = None, headers: List[str] = None,
                 expose_headers: List[str] = None, max_age: int = 86400):
        """
        Inicializa o middleware CORS
        
        Args:
            app: Instância Flask
            origins: Origens permitidas
            methods: Métodos HTTP permitidos
            headers: Headers permitidos
            expose_headers: Headers expostos
            max_age: Tempo de cache preflight
        """
        self.origins = origins if isinstance(origins, list) else [origins]
        self.methods = methods or ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
        self.headers = headers or [
            'Content-Type', 'Authorization', 'X-Requested-With', 
            'Accept', 'Origin', 'Access-Control-Request-Method', 
            'Access-Control-Request-Headers'
        ]
        self.expose_headers = expose_headers or ['Content-Length', 'X-Request-Id']
        self.max_age = max_age
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Configura o middleware na aplicação Flask"""
        app.after_request(self.after_request)
        app.before_request(self.before_request)
    
    def is_origin_allowed(self, origin: str) -> bool:
        """Verifica se a origem é permitida"""
        if '*' in self.origins:
            return True
        
        for allowed_origin in self.origins:
            # Suporte a wildcards simples
            if allowed_origin.endswith('*'):
                pattern = allowed_origin.replace('*', '.*')
                if re.match(pattern, origin):
                    return True
            elif origin == allowed_origin:
                return True
        
        return False
    
    def before_request(self):
        """Handler para requisições OPTIONS (preflight)"""
        if request.method == 'OPTIONS':
            # Criar resposta vazia para preflight
            response = make_response('', 200)
            return self.add_cors_headers(response)
        return None
    
    def after_request(self, response):
        """Adiciona headers CORS após cada request"""
        # Verificar se response é válido (não é uma tupla de erro)
        if not hasattr(response, 'headers'):
            # Se é uma tupla de erro, criar response adequado
            if isinstance(response, tuple) and len(response) >= 2:
                status_code = response[1] if len(response) > 1 else 500
                response_data = response[0] if response[0] else "Internal Server Error"
                response = make_response(response_data, status_code)
            else:
                # Fallback para erro genérico
                response = make_response("Internal Server Error", 500)
        
        return self.add_cors_headers(response)
    
    def add_cors_headers(self, response):
        """Adiciona todos os headers CORS necessários"""
        origin = request.headers.get('Origin')
        
        # Access-Control-Allow-Origin - SEMPRE adicionar o header
        if origin and self.is_origin_allowed(origin):
            response.headers['Access-Control-Allow-Origin'] = origin
        elif '*' in self.origins:
            response.headers['Access-Control-Allow-Origin'] = '*'
        else:
            # Fallback: sempre adicionar um header CORS válido
            if self.origins and self.origins[0] != '*':
                response.headers['Access-Control-Allow-Origin'] = self.origins[0]
            else:
                response.headers['Access-Control-Allow-Origin'] = '*'
        
        # Outros headers CORS
        response.headers['Access-Control-Allow-Methods'] = ', '.join(self.methods)
        response.headers['Access-Control-Allow-Headers'] = ', '.join(self.headers)
        
        if self.expose_headers:
            response.headers['Access-Control-Expose-Headers'] = ', '.join(self.expose_headers)
        
        response.headers['Access-Control-Max-Age'] = str(self.max_age)
        
        # Vary header para cache adequado
        vary_header = response.headers.get('Vary', '')
        if 'Origin' not in vary_header:
            response.headers['Vary'] = f"{vary_header}, Origin".lstrip(', ')
        
        return response