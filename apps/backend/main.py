# -*- coding: utf-8 -*-
"""
Main Application - Refatorado com Flask Blueprints
Sistema Educacional para Dispensação PQT-U - Versão Modular
[FORCE REDEPLOY] - Reativação do backend - 17/08/2025
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

# Imports opcionais com fallback
try:
    from core.versioning import APIVersionManager
    VERSIONING_AVAILABLE = True
except ImportError:
    VERSIONING_AVAILABLE = False
    APIVersionManager = None

# Import configuração centralizada (com fallback)
try:
    from app_config import config, EnvironmentConfig
    CONFIG_AVAILABLE = True
except ImportError:
    CONFIG_AVAILABLE = False
    # Fallback config simples
    class SimpleConfig:
        SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
        DEBUG = os.environ.get('FLASK_ENV') == 'development'
        TESTING = False
        MAX_CONTENT_LENGTH = 16 * 1024 * 1024
        SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
        SESSION_COOKIE_HTTPONLY = True
        SESSION_COOKIE_SAMESITE = 'Lax'
        HOST = os.environ.get('HOST', '0.0.0.0')
        PORT = int(os.environ.get('PORT', 8080))
        LOG_LEVEL = 'INFO'
        LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else []
    
    class SimpleEnvironmentConfig:
        @staticmethod
        def get_current():
            return os.environ.get('ENVIRONMENT', 'development')
    
    config = SimpleConfig()
    EnvironmentConfig = SimpleEnvironmentConfig()

# Import sistema de dependências (com fallback)
try:
    from core.dependencies import dependency_injector
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False
    # Fallback simples
    class SimpleDependencyInjector:
        def inject_into_blueprint(self, blueprint):
            pass
        def get_dependencies(self):
            return type('obj', (object,), {'cache': None, 'rag_service': None, 'qa_framework': None})()
    dependency_injector = SimpleDependencyInjector()

# Configurar logging ANTES de usar logger
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL if CONFIG_AVAILABLE else 'INFO'),
    format=config.LOG_FORMAT if CONFIG_AVAILABLE else '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import blueprints (com fallback inteligente)
try:
    from blueprints import ALL_BLUEPRINTS
    BLUEPRINTS_AVAILABLE = True
    logger.info("✓ Blueprints completos importados com sucesso")
except ImportError as e:
    BLUEPRINTS_AVAILABLE = False
    logger.warning(f"⚠️  Blueprints principais não disponíveis: {e}")
    logger.info("🧠 Ativando Sistema de Fallback Inteligente...")
    
    # Usar sistema de fallback inteligente
    try:
        from core.fallback import create_intelligent_fallback_blueprints
        ALL_BLUEPRINTS = create_intelligent_fallback_blueprints()
        logger.info("✅ Sistema de Fallback Inteligente ativado com sucesso!")
        logger.info(f"📋 {len(ALL_BLUEPRINTS)} blueprints inteligentes criados")
    except ImportError as fallback_error:
        logger.error(f"❌ Erro ao carregar Fallback Inteligente: {fallback_error}")
        logger.info("🔄 Usando fallback básico de emergência...")
        
        # Fallback de emergência ultra-básico
        from flask import Blueprint
        
        emergency_bp = Blueprint('emergency', __name__)
        
        @emergency_bp.route('/api/v1/health', methods=['GET'])
        @emergency_bp.route('/api/health', methods=['GET'])
        def emergency_health():
            return jsonify({
                "status": "emergency_mode",
                "timestamp": datetime.now().isoformat(),
                "version": "emergency_v1.0.0",
                "api_version": "v1",
                "environment": EnvironmentConfig.get_current() if CONFIG_AVAILABLE else 'development',
                "port": int(os.environ.get('PORT', 8080)),
                "mode": "emergency_fallback",
                "message": "Sistema em modo de emergência - funcionalidade limitada"
            })
        
        @emergency_bp.route('/api/v1/health/live', methods=['GET'])
        def emergency_live():
            return jsonify({"status": "alive", "timestamp": datetime.now().isoformat(), "mode": "emergency"})
        
        @emergency_bp.route('/api/v1/health/ready', methods=['GET'])
        def emergency_ready():
            return jsonify({"status": "ready", "timestamp": datetime.now().isoformat(), "mode": "emergency"})
        
        ALL_BLUEPRINTS = [emergency_bp]
        logger.warning("⚠️  Sistema em modo de emergência - funcionalidade muito limitada")

# Import Security Middleware (com fallback)
try:
    from core.security.middleware import SecurityMiddleware
    SECURITY_MIDDLEWARE_AVAILABLE = True
except ImportError:
    SECURITY_MIDDLEWARE_AVAILABLE = False
    SecurityMiddleware = None

# Import Performance e Security Optimizations
try:
    from core.performance.response_optimizer import init_performance_optimizations
    from core.security.enhanced_security import init_security_optimizations
    OPTIMIZATIONS_AVAILABLE = True
except ImportError:
    OPTIMIZATIONS_AVAILABLE = False

# Import JWT Authentication (com fallback)
try:
    from core.auth.jwt_validator import configure_jwt_from_env, create_auth_middleware
    JWT_AUTH_AVAILABLE = True
except ImportError:
    JWT_AUTH_AVAILABLE = False
    configure_jwt_from_env = None
    create_auth_middleware = None

# Logger já configurado acima

def create_app():
    """Factory function para criar aplicação Flask"""
    app = Flask(__name__)
    
    # Configurar Flask com settings do config
    app.config['SECRET_KEY'] = config.SECRET_KEY
    app.config['DEBUG'] = config.DEBUG
    app.config['TESTING'] = getattr(config, 'TESTING', False)
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH
    
    # Configurar sessões
    app.config['SESSION_COOKIE_SECURE'] = config.SESSION_COOKIE_SECURE
    app.config['SESSION_COOKIE_HTTPONLY'] = config.SESSION_COOKIE_HTTPONLY
    app.config['SESSION_COOKIE_SAMESITE'] = config.SESSION_COOKIE_SAMESITE
    
    # Configurar CORS
    setup_cors(app)
    
    # Configurar headers de segurança
    setup_security_headers(app)
    
    # Configurar sistema de versionamento
    version_manager = APIVersionManager(app)
    app.version_manager = version_manager
    
    # Inicializar Security Middleware
    if SECURITY_MIDDLEWARE_AVAILABLE and SecurityMiddleware:
        security_middleware = SecurityMiddleware(app)
        logger.info("✅ Security Middleware avançado inicializado")
    
    # Inicializar JWT Authentication
    if JWT_AUTH_AVAILABLE:
        try:
            configure_jwt_from_env()
            auth_middleware = create_auth_middleware()
            app.before_request(auth_middleware)
            logger.info("🔐 JWT Authentication configurado (Firebase)")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao configurar JWT: {e}")
    else:
        logger.info("ℹ️ JWT Authentication não disponível - sistema funciona sem autenticação")
    
    # Inicializar otimizações de performance e segurança
    if OPTIMIZATIONS_AVAILABLE:
        try:
            init_performance_optimizations(app)
            init_security_optimizations(app)
            logger.info("🚀 Otimizações de performance e segurança ativadas")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao inicializar otimizações: {e}")
    
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
    if CONFIG_AVAILABLE and hasattr(config, 'CORS_ORIGINS'):
        allowed_origins = config.CORS_ORIGINS.copy()
    else:
        allowed_origins = []
    
    # Adicionar origins específicos do ambiente
    environment = EnvironmentConfig.get_current()
    
    if environment == 'development':
        allowed_origins.extend([
            "http://localhost:3000",
            "http://127.0.0.1:3000", 
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8080",
            "http://127.0.0.1:8080"
        ])
        logger.info("CORS configurado para desenvolvimento")
    elif environment == 'production':
        # Origens de produção
        allowed_origins = [
            "https://roteiros-de-dispensacao.web.app",
            "https://roteiros-de-dispensacao.firebaseapp.com",
            "https://roteirosdedispensacao.com",
            "https://www.roteirosdedispensacao.com",
            "http://roteirosdedispensacao.com",  # Adicionar HTTP também
            "http://www.roteirosdedispensacao.com"
        ]
        
        # Se estiver rodando no Cloud Run, adicionar origens dinâmicas
        if os.environ.get('K_SERVICE'):
            # Cloud Run service URL se disponível
            cloud_run_url = os.environ.get('CLOUD_RUN_SERVICE_URL')
            if cloud_run_url:
                allowed_origins.append(cloud_run_url)
                logger.info(f"Cloud Run URL adicionada ao CORS: {cloud_run_url}")
        
        logger.info("CORS configurado para produção")
    
    # Se não tiver origins, permitir todos em desenvolvimento
    if not allowed_origins:
        if environment == 'development':
            allowed_origins = ["*"]
        else:
            allowed_origins = [
                "https://roteiros-de-dispensacao.web.app",
                "https://roteirosdedispensacao.com"
            ]
    
    CORS(app, 
         origins=allowed_origins,
         methods=['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'DELETE'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
         expose_headers=['Content-Length', 'X-Request-Id'],
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
    if DEPENDENCIES_AVAILABLE:
        for blueprint in ALL_BLUEPRINTS:
            dependency_injector.inject_into_blueprint(blueprint)
            logger.info(f"✓ Dependências injetadas: {blueprint.name}")
    else:
        logger.info("✓ Dependências simplificadas - modo mínimo")

def setup_error_handlers(app):
    """Configurar handlers de erro globais"""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Endpoint não encontrado",
            "error_code": "NOT_FOUND",
            "available_endpoints": [
                "/api/v1/health",
                "/api/v1/health/live",
                "/api/v1/health/ready", 
                "/api/v1/chat",
                "/api/v1/personas",
                "/api/v1/feedback",
                "/api/v1/monitoring/stats",
                "/api/v1/docs"
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
    logger.info(f"📦 Versão: {'blueprint_v1.0' if CONFIG_AVAILABLE else 'minimal_v1.0'}")
    logger.info(f"🌍 Ambiente: {environment}")
    logger.info(f"🐍 Python: {sys.version.split()[0]}")
    logger.info(f"⚙️  Debug: {config.DEBUG}")
    
    if CONFIG_AVAILABLE:
        logger.info(f"🔐 QA Enabled: {getattr(config, 'QA_ENABLED', False)}")
        logger.info(f"💾 Cache: {'Advanced' if getattr(config, 'ADVANCED_CACHE', False) else 'Simple'}")
        logger.info(f"🧠 RAG: {'Available' if getattr(config, 'RAG_AVAILABLE', False) else 'Unavailable'}")
        logger.info(f"📊 Metrics: {'Enabled' if getattr(config, 'METRICS_ENABLED', False) else 'Disabled'}")
    else:
        logger.info("🔐 QA Enabled: Minimal Mode")
        logger.info("💾 Cache: Simple")
        logger.info("🧠 RAG: Unavailable")
        logger.info("📊 Metrics: Disabled")
    
    # Status das dependências
    if DEPENDENCIES_AVAILABLE:
        deps = dependency_injector.get_dependencies()
        logger.info(f"✓ Cache: {'OK' if deps.cache else 'FAIL'}")
        logger.info(f"✓ RAG: {'OK' if deps.rag_service else 'FAIL'}")  
        logger.info(f"✓ QA: {'OK' if deps.qa_framework else 'FAIL'}")
    else:
        logger.info("✓ Cache: SIMPLE")
        logger.info("✓ RAG: DISABLED")
        logger.info("✓ QA: DISABLED")
    
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
            "version": "v1.0.0", 
            "api_version": "v1",
            "description": "Sistema educacional para dispensação farmacêutica - API Enterprise Grade",
            "author": "Doutorando Nélio Gomes de Moura Júnior - UnB",
            "environment": EnvironmentConfig.get_current(),
            "status": "operational",
            "blueprints": [bp.name for bp in ALL_BLUEPRINTS],
            "documentation": {
                "openapi_url": "/api/v1/docs",
                "swagger_ui": "/api/v1/docs/swagger",
                "endpoints": [
                    {"path": "/api/v1/health", "description": "Health check básico"},
                    {"path": "/api/v1/health/live", "description": "Kubernetes liveness probe"},
                    {"path": "/api/v1/health/ready", "description": "Kubernetes readiness probe"},
                    {"path": "/api/v1/chat", "description": "Chat com personas especializadas"},
                    {"path": "/api/v1/personas", "description": "Informações de personas disponíveis"},
                    {"path": "/api/v1/feedback", "description": "Sistema de feedback e avaliação"},
                    {"path": "/api/v1/monitoring/stats", "description": "Estatísticas e métricas do sistema"},
                    {"path": "/api/v1/docs", "description": "Documentação médica especializada"}
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