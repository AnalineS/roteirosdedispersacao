# -*- coding: utf-8 -*-
"""
Main Application - Refatorado com Flask Blueprints
Sistema Educacional para Dispensação PQT-U - Versão Modular
[FORCE REDEPLOY] - Flask-CORS 6.0.0 Security Update - 24/08/2025
"""

import sys
import os

# Garantir encoding UTF-8 no Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, request, jsonify
import logging
from datetime import datetime

# Import do middleware CORS customizado para compatibilidade total com error handling
from core.security.custom_cors import CustomCORSMiddleware

# Import obrigatório do versionamento
from core.versioning import APIVersionManager

# Import obrigatório da configuração centralizada
from app_config import config, EnvironmentConfig

# Import obrigatório do sistema de dependências
from core.dependencies import dependency_injector

# Configurar logging ANTES de usar logger
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)

# Aplicar patch para Windows logging (resolve problemas com emojis)
try:
    from core.logging.windows_safe_logger import patch_logger_methods
    patch_logger_methods()
except ImportError:
    pass  # Patch não disponível, continuar sem ele

logger = logging.getLogger(__name__)

# Import blueprints (com fallback inteligente)
try:
    from blueprints import ALL_BLUEPRINTS
    BLUEPRINTS_AVAILABLE = True
    logger.info("✓ Blueprints completos importados com sucesso")
except ImportError as e:
    BLUEPRINTS_AVAILABLE = False
    # SECURITY FIX: Log import error without exposing module details
    logger.warning("[WARNING]  Blueprints principais não disponíveis: ImportError")
    logger.info("🧠 Ativando Sistema de Fallback Inteligente...")
    
    # Usar sistema de fallback inteligente
    try:
        from core.fallback import create_intelligent_fallback_blueprints
        ALL_BLUEPRINTS = create_intelligent_fallback_blueprints()
        logger.info("[OK] Sistema de Fallback Inteligente ativado com sucesso!")
        logger.info(f"[LIST] {len(ALL_BLUEPRINTS)} blueprints inteligentes criados")
    except ImportError as fallback_error:
        # SECURITY FIX: Log error without exposing internal details
        logger.error("[ERROR] Erro ao carregar Fallback Inteligente: ImportError")
        logger.info("🔄 Usando fallback básico de emergência...")
        
        # Fallback de emergência ultra-básico
        from flask import Blueprint
        
        emergency_bp = Blueprint('emergency', __name__)
        
        # Health check removido do emergency - usando apenas intelligent_fallback
        
        @emergency_bp.route('/api/v1/health/live', methods=['GET'])
        def emergency_live():
            return jsonify({"status": "alive", "timestamp": datetime.now().isoformat(), "mode": "emergency"})
        
        @emergency_bp.route('/api/v1/health/ready', methods=['GET'])
        def emergency_ready():
            return jsonify({"status": "ready", "timestamp": datetime.now().isoformat(), "mode": "emergency"})
        
        ALL_BLUEPRINTS = [emergency_bp]
        logger.warning("[WARNING]  Sistema em modo de emergência - funcionalidade muito limitada")

# SecurityMiddleware removido - usando apenas enhanced_security.py
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
    
    # CONSOLIDAÇÃO DE MIDDLEWARES: Usando apenas enhanced_security.py
    # SecurityMiddleware desabilitado para evitar conflito HTTP 426
    # Todas as funcionalidades de segurança estão no SecurityOptimizer
    logger.info("[OK] Security Middleware consolidado (apenas SecurityOptimizer ativo)")
    
    # Inicializar JWT Authentication de forma não-bloqueante
    if JWT_AUTH_AVAILABLE:
        try:
            configure_jwt_from_env()
            auth_middleware = create_auth_middleware()
            app.before_request(auth_middleware)
            logger.info("[AUTH] JWT Authentication configurado (Firebase)")
        except Exception as e:
            # SECURITY FIX: Log JWT error without exposing configuration details
            error_type = type(e).__name__
            logger.warning(f"[WARNING] Erro ao configurar JWT [{error_type}]: Configuração de autenticação indisponível")
    else:
        logger.info("ℹ️ JWT Authentication não disponível - sistema funciona sem autenticação")
    
    # Pular otimizações pesadas no startup para Cloud Run
    cloud_run_env = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
    if OPTIMIZATIONS_AVAILABLE and not cloud_run_env:
        try:
            init_performance_optimizations(app)
            init_security_optimizations(app)
            logger.info("[START] Otimizações de performance e segurança ativadas")
        except Exception as e:
            # SECURITY FIX: Log optimization error without exposing details
            error_type = type(e).__name__
            logger.warning(f"[WARNING] Erro ao inicializar otimizações [{error_type}]: Recursos avançados indisponíveis")
    elif cloud_run_env:
        logger.info("☁️ Cloud Run detectado - otimizações carregadas sob demanda")
    
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
    if hasattr(config, 'CORS_ORIGINS'):
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
    elif environment == 'homologacao':
        # Origens específicas para homologação
        allowed_origins = [
            "https://hml-roteiros-de-dispensacao.web.app",
            "https://hml-roteiros-de-dispensacao.firebaseapp.com",
            "http://localhost:3000",  # Para testes locais
            "http://127.0.0.1:3000"
        ]
        
        # Adicionar URL do Cloud Run HML se disponível
        if os.environ.get('K_SERVICE'):
            cloud_run_url = os.environ.get('CLOUD_RUN_SERVICE_URL')
            if cloud_run_url:
                allowed_origins.append(cloud_run_url)
                # SECURITY FIX: Comprehensive URL sanitization to prevent log injection
                import urllib.parse
                import re
                if cloud_run_url:
                    # Decode URL encoding first, then sanitize
                    decoded_url = urllib.parse.unquote(cloud_run_url)
                    # Remove all control characters and newlines (safe approach)
                    sanitized_url = ''.join(c for c in decoded_url if c.isprintable() and c not in '\n\r\t')
                    # Truncate if too long
                    final_url = sanitized_url[:100] + '...' if len(sanitized_url) > 100 else sanitized_url
                else:
                    final_url = 'None'
                logger.info(f"Cloud Run HML URL adicionada ao CORS: {final_url}")
        
        logger.info("CORS configurado para homologação")
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
                # SECURITY FIX: Comprehensive URL sanitization to prevent log injection
                import urllib.parse
                import re
                if cloud_run_url:
                    # Decode URL encoding first, then sanitize
                    decoded_url = urllib.parse.unquote(cloud_run_url)
                    # Remove all control characters and newlines (safe approach)
                    sanitized_url = ''.join(c for c in decoded_url if c.isprintable() and c not in '\n\r\t')
                    # Truncate if too long
                    final_url = sanitized_url[:100] + '...' if len(sanitized_url) > 100 else sanitized_url
                else:
                    final_url = 'None'
                logger.info(f"Cloud Run URL adicionada ao CORS: {final_url}")
        
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
    
    # Configurar CORS customizado compatível com error handling
    CustomCORSMiddleware(
        app,
        origins=allowed_origins,
        methods=['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'DELETE'],
        headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
        expose_headers=['Content-Length', 'X-Request-Id'],
        max_age=86400  # Cache preflight por 24h
    )
    
    # SECURITY FIX: Comprehensive origins sanitization to prevent log injection
    import urllib.parse
    import re
    sanitized_origins = []
    for origin in allowed_origins:
        # Decode URL encoding, then remove control characters
        decoded_origin = urllib.parse.unquote(str(origin))
        clean_origin = re.sub(r'[\n\r\t\x00-\x1f\x7f-\x9f]', '', decoded_origin)
        # Truncate if too long
        truncated_origin = clean_origin[:50] + '...' if len(clean_origin) > 50 else clean_origin
        sanitized_origins.append(truncated_origin)
    logger.info(f"🔗 CORS configurado para: {sanitized_origins}")

def setup_security_headers(app):
    """Configurar headers de segurança aprimorados"""
    try:
        # Tentar importar patches de segurança
        from core.security.security_patches import apply_security_patches
        app = apply_security_patches(app)
        logger.info("Patches de segurança avançados aplicados")
    except ImportError:
        logger.info("Usando configuração de segurança básica")
    
    # Error handlers personalizados para garantir compatibilidade com middlewares
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handler personalizado para erro 500"""
        from flask import Response, jsonify
        response = jsonify({
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR',
            'message': 'Tente novamente em alguns instantes',
            'timestamp': datetime.now().isoformat()
        })
        response.status_code = 500
        return response
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handler personalizado para erro 404"""
        from flask import Response, jsonify
        response = jsonify({
            'error': 'Endpoint não encontrado',
            'error_code': 'NOT_FOUND',
            'message': 'O endpoint solicitado não existe',
            'timestamp': datetime.now().isoformat()
        })
        response.status_code = 404
        return response
    
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handler genérico para qualquer exceção"""
        from flask import Response, jsonify
        response = jsonify({
            'error': 'Erro interno do servidor',
            'error_code': 'INTERNAL_ERROR',
            'message': 'Tente novamente em alguns instantes',
            'timestamp': datetime.now().isoformat()
        })
        response.status_code = 500
        return response
    
    @app.after_request
    def add_security_headers(response):
        # Verificar se response tem headers (não é uma tupla de erro)
        if hasattr(response, 'headers'):
            # Prevenir XSS
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            
            # HSTS para HTTPS
            if request.is_secure:
                response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
            
            # CSP mais restritivo
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
            response.headers['Content-Security-Policy'] = csp_policy
            
            # Permissions Policy
            response.headers['Permissions-Policy'] = (
                "geolocation=(), microphone=(), camera=(), "
                "payment=(), usb=(), magnetometer=(), "
                "accelerometer=(), gyroscope=()"
            )
            
            # Remover headers que revelam informações
            response.headers.pop('Server', None)
            response.headers.pop('X-Powered-By', None)
        
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
        # SECURITY FIX: Log error without exposing stack trace details
        # Only log error type and a sanitized message for security
        error_type = type(error).__name__
        logger.error(f"Erro interno [{error_type}]: Erro processamento request")
        
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
    logger.info("[START] ROTEIROS DE DISPENSAÇÃO PQT-U - BACKEND REFATORADO")
    logger.info("=" * 60)
    logger.info(f"📦 Versão: blueprint_v1.0")
    logger.info(f"🌍 Ambiente: {environment}")
    logger.info(f"🐍 Python: {sys.version.split()[0]}")
    logger.info(f"⚙️  Debug: {config.DEBUG}")
    
    logger.info(f"[AUTH] QA Enabled: {getattr(config, 'QA_ENABLED', False)}")
    logger.info(f"[SAVE] Cache: {'Advanced' if getattr(config, 'ADVANCED_CACHE', False) else 'Simple'}")
    logger.info(f"🧠 RAG: {'Available' if getattr(config, 'RAG_AVAILABLE', False) else 'Unavailable'}")
    logger.info(f"[REPORT] Metrics: {'Enabled' if getattr(config, 'METRICS_ENABLED', False) else 'Disabled'}")
    
    # Status das dependências
    deps = dependency_injector.get_dependencies()
    logger.info(f"✓ Cache: {'OK' if deps.cache else 'FAIL'}")
    logger.info(f"✓ RAG: {'OK' if deps.rag_service else 'FAIL'}")  
    logger.info(f"✓ QA: {'OK' if deps.qa_framework else 'FAIL'}")
    
    # Blueprints registrados
    logger.info(f"[LIST] Blueprints: {len(ALL_BLUEPRINTS)} registrados")
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
    
    # Health checks consolidados no intelligent_fallback blueprint
    # Mantém apenas o _ah/health para Google App Engine
    @app.route('/_ah/health')  # Google App Engine health check
    def cloud_run_health():
        """Health check básico para Google App Engine"""
        return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()}), 200

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
        
        # Configurações otimizadas para Cloud Run
        cloud_run_env = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
        if cloud_run_env:
            logger.info(f"☁️ Cloud Run detectado - configurações otimizadas")
            # Reduzir timeout de request para startup mais rápido
            import signal
            signal.alarm(0)  # Desabilitar alarmes que podem atrasar startup
        
        # SECURITY FIX: Comprehensive host/port sanitization to prevent log injection
        import re
        if host:
            clean_host = re.sub(r'[\n\r\t\x00-\x1f\x7f-\x9f]', '', str(host))
            sanitized_host = clean_host[:50]
        else:
            sanitized_host = 'localhost'
            
        if port:
            clean_port = re.sub(r'[\n\r\t\x00-\x1f\x7f-\x9f]', '', str(port))
            sanitized_port = clean_port[:10]
        else:
            sanitized_port = '5000'
            
        logger.info(f"[START] Iniciando servidor em {sanitized_host}:{sanitized_port}")
        
        # Executar aplicação
        app.run(
            host=host,
            port=port,
            debug=False if cloud_run_env else config.DEBUG,  # Sempre False no Cloud Run
            threaded=True,
            use_reloader=False,  # Evitar dupla inicialização
            request_handler=None  # Usar handler padrão otimizado
        )
        
    except KeyboardInterrupt:
        logger.info("⏹️  Servidor interrompido pelo usuário")
    except Exception as e:
        # SECURITY FIX: Log startup error without exposing stack trace
        error_type = type(e).__name__
        logger.error(f"[ERROR] Erro ao iniciar servidor [{error_type}]: Falha na inicialização")
        sys.exit(1)