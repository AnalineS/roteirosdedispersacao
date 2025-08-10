# -*- coding: utf-8 -*-
"""
Main Application - Refatorado com Flask Blueprints
Sistema Educacional para Dispensação PQT-U - Versão Modular
"""

import sys
import os

# Garantir encoding UTF-8 no Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

# Import configuração centralizada
from app_config import config, EnvironmentConfig

# Import sistema de dependências
from core.dependencies import dependency_injector

# Import blueprints
from blueprints import ALL_BLUEPRINTS

# Configurar logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)
logger = logging.getLogger(__name__)

def create_app():
    """Factory function para criar aplicação Flask"""
    app = Flask(__name__)
    
    # Configurar Flask com settings do config
    app.config['SECRET_KEY'] = config.SECRET_KEY
    app.config['DEBUG'] = config.DEBUG
    app.config['TESTING'] = config.TESTING
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH
    
    # Configurar sessões
    app.config['SESSION_COOKIE_SECURE'] = config.SESSION_COOKIE_SECURE
    app.config['SESSION_COOKIE_HTTPONLY'] = config.SESSION_COOKIE_HTTPONLY
    app.config['SESSION_COOKIE_SAMESITE'] = config.SESSION_COOKIE_SAMESITE
    
    # Configurar CORS
    setup_cors(app)
    
    # Configurar headers de segurança
    setup_security_headers(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Injetar dependências nos blueprints
    inject_dependencies_into_blueprints()
    
    # Configurar handlers de erro globais
    setup_error_handlers(app)
    
    # Configurar rotas básicas
    setup_root_routes(app)
    
    # Log de inicialização
    log_startup_info()
    
    return app

def setup_cors(app):
    """Configurar CORS baseado no ambiente"""
    # Usar origins do config
    allowed_origins = config.CORS_ORIGINS.copy()
    
    # Adicionar origins específicos do ambiente
    environment = EnvironmentConfig.get_current()
    
    if environment == 'development':
        allowed_origins.extend([
            "http://localhost:3000",
            "http://127.0.0.1:3000", 
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ])
        logger.info("CORS configurado para desenvolvimento")
    elif environment == 'production':
        # Apenas origens específicas em produção
        allowed_origins = [
            "https://roteiros-de-dispensacao.web.app",
            "https://roteiros-de-dispensacao.firebaseapp.com",
            "https://roteirosdedispensacao.com",
            "https://www.roteirosdedispensacao.com"
        ]
        logger.info("CORS configurado para produção")
    
    CORS(app, 
         origins=allowed_origins,
         methods=['GET', 'POST', 'OPTIONS', 'HEAD'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
         supports_credentials=False,
         max_age=86400)  # Cache preflight por 24h
    
    logger.info(f"🔗 CORS configurado para: {allowed_origins}")

def setup_security_headers(app):
    """Configurar headers de segurança"""
    @app.after_request
    def add_security_headers(response):
        # Prevenir XSS
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # HSTS para HTTPS
        if request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # CSP básico
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai"
        )
        response.headers['Content-Security-Policy'] = csp_policy
        
        # Remover headers que revelam informações
        response.headers.pop('Server', None)
        
        return response

def register_blueprints(app):
    """Registrar todos os blueprints"""
    for blueprint in ALL_BLUEPRINTS:
        app.register_blueprint(blueprint)
        logger.info(f"✓ Blueprint registrado: {blueprint.name}")

def inject_dependencies_into_blueprints():
    """Injetar dependências em todos os blueprints"""
    for blueprint in ALL_BLUEPRINTS:
        dependency_injector.inject_into_blueprint(blueprint)
        logger.info(f"✓ Dependências injetadas: {blueprint.name}")

def setup_error_handlers(app):
    """Configurar handlers de erro globais"""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Endpoint não encontrado",
            "error_code": "NOT_FOUND",
            "available_endpoints": [
                "/api/health",
                "/api/test", 
                "/api/chat",
                "/api/personas",
                "/api/feedback",
                "/api/stats"
            ],
            "timestamp": datetime.now().isoformat()
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Método HTTP não permitido",
            "error_code": "METHOD_NOT_ALLOWED",
            "allowed_methods": ["GET", "POST", "OPTIONS"],
            "timestamp": datetime.now().isoformat()
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Erro interno: {error}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "message": "Tente novamente em alguns instantes",
            "timestamp": datetime.now().isoformat()
        }), 500
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "error": "Payload muito grande",
            "error_code": "PAYLOAD_TOO_LARGE",
            "max_size": "16MB",
            "timestamp": datetime.now().isoformat()
        }), 413

def log_startup_info():
    """Log de informações de inicialização"""
    environment = EnvironmentConfig.get_current()
    
    logger.info("=" * 60)
    logger.info("🚀 ROTEIROS DE DISPENSAÇÃO PQT-U - BACKEND REFATORADO")
    logger.info("=" * 60)
    logger.info(f"📦 Versão: blueprint_v1.0")
    logger.info(f"🌍 Ambiente: {environment}")
    logger.info(f"🐍 Python: {sys.version.split()[0]}")
    logger.info(f"⚙️  Debug: {config.DEBUG}")
    logger.info(f"🔐 QA Enabled: {config.QA_ENABLED}")
    logger.info(f"💾 Cache: {'Advanced' if config.ADVANCED_CACHE else 'Simple'}")
    logger.info(f"🧠 RAG: {'Available' if config.RAG_AVAILABLE else 'Unavailable'}")
    logger.info(f"📊 Metrics: {'Enabled' if config.METRICS_ENABLED else 'Disabled'}")
    
    # Status das dependências
    deps = dependency_injector.get_dependencies()
    logger.info(f"✓ Cache: {'OK' if deps.cache else 'FAIL'}")
    logger.info(f"✓ RAG: {'OK' if deps.rag_service else 'FAIL'}")  
    logger.info(f"✓ QA: {'OK' if deps.qa_framework else 'FAIL'}")
    
    # Blueprints registrados
    logger.info(f"📋 Blueprints: {len(ALL_BLUEPRINTS)} registrados")
    for bp in ALL_BLUEPRINTS:
        logger.info(f"   - {bp.name}")
    
    logger.info("=" * 60)

def setup_root_routes(app):
    """Configurar rotas básicas que ficam no main"""
    @app.route('/')
    def root():
        """Rota raiz - informações da API"""
        return jsonify({
            "api_name": "Roteiros de Dispensação PQT-U",
            "version": "blueprint_v1.0", 
            "description": "Sistema educacional para dispensação farmacêutica",
            "author": "Doutorando Nélio Gomes de Moura Júnior - UnB",
            "environment": EnvironmentConfig.get_current(),
            "status": "operational",
            "blueprints": [bp.name for bp in ALL_BLUEPRINTS],
            "documentation": {
                "endpoints": [
                    {"path": "/api/health", "description": "Health check"},
                    {"path": "/api/test", "description": "Teste de conectividade"},
                    {"path": "/api/chat", "description": "Chat com personas"},
                    {"path": "/api/personas", "description": "Informações de personas"},
                    {"path": "/api/feedback", "description": "Sistema de feedback"},
                    {"path": "/api/stats", "description": "Estatísticas do sistema"}
                ]
            },
            "timestamp": datetime.now().isoformat()
        }), 200

# Rate limiting placeholder (será implementado com Redis)
def check_rate_limit(endpoint_type: str = 'default'):
    """Decorator temporário para rate limiting"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            # TODO: Implementar rate limiting real com Redis
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Criar aplicação
app = create_app()

# Execução da aplicação
if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', config.PORT))
        host = config.HOST
        
        logger.info(f"🚀 Iniciando servidor em {host}:{port}")
        
        # Executar aplicação
        app.run(
            host=host,
            port=port,
            debug=config.DEBUG,
            threaded=True,
            use_reloader=False  # Evitar dupla inicialização em desenvolvimento
        )
        
    except KeyboardInterrupt:
        logger.info("⏹️  Servidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)