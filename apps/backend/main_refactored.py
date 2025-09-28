# -*- coding: utf-8 -*-
"""
Main Application - Refatorado com UNIFIED MEMORY SYSTEM
Sistema Educacional para Dispensação PQT-U - Versão Otimizada
MANTÉM TODAS AS FUNCIONALIDADES - Consolida apenas os 5 sistemas de memória em 1
"""

import sys
import os

# Garantir encoding UTF-8 no Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# AGGRESSIVE WARNING SUPPRESSION - Must be FIRST before any other imports
try:
    from core.logging.aggressive_suppressor import enable_clean_startup, CleanStartupContext
    clean_startup_enabled = enable_clean_startup()
    if clean_startup_enabled:
        startup_logger = None
        print("Server starting...")
except ImportError:
    clean_startup_enabled = False

# INITIALIZE CLEAN LOGGING SYSTEM (if aggressive suppression not available)
if not clean_startup_enabled:
    try:
        from core.logging import initialize_clean_logging
        main_logger, startup_logger, warning_manager = initialize_clean_logging()
        startup_logger.log_startup_begin()
    except ImportError:
        import logging
        from app_config import config, EnvironmentConfig
        logging.basicConfig(
            level=getattr(logging, config.LOG_LEVEL),
            format=config.LOG_FORMAT
        )
        main_logger = logging.getLogger(__name__)
        startup_logger = None

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
from core.dependencies import get_dependency_manager

# Aplicar patch para Windows logging (resolve problemas com emojis)
try:
    from core.logging.windows_safe_logger import patch_logger_methods
    patch_logger_methods()
except ImportError:
    pass

# Use the configured logger
logger = main_logger if 'main_logger' in locals() else logging.getLogger(__name__)

# ========================================
# UNIFIED MEMORY SYSTEM - REPLACES 5 SYSTEMS
# ========================================
try:
    from core.performance.unified_memory_system import (
        initialize_medical_memory_management,
        get_unified_memory_manager,
        medical_memory_safe
    )

    # Initialize unified system immediately
    unified_memory_manager = initialize_medical_memory_management()

    logger.info("[UNIFIED MEMORY] Single memory system initialized - replaces 5 competing systems")
    logger.info("[UNIFIED MEMORY] Target: <50% system memory usage")
    UNIFIED_MEMORY_AVAILABLE = True

except ImportError as e:
    logger.error(f"[UNIFIED MEMORY] Failed to initialize: {e}")
    UNIFIED_MEMORY_AVAILABLE = False
    unified_memory_manager = None

# Import blueprints (com fallback inteligente) - MANTÉM SISTEMA ORIGINAL
try:
    from blueprints import ALL_BLUEPRINTS
    BLUEPRINTS_AVAILABLE = True
    logger.info("✓ Blueprints completos importados com sucesso")
except ImportError as e:
    BLUEPRINTS_AVAILABLE = False
    logger.warning("[WARNING] Blueprints principais não disponíveis: ImportError")
    logger.info("🧠 Ativando Sistema de Fallback Inteligente...")

    try:
        from core.fallback import create_intelligent_fallback_blueprints
        ALL_BLUEPRINTS = create_intelligent_fallback_blueprints()
        logger.info("[OK] Sistema de Fallback Inteligente ativado com sucesso!")
        logger.info(f"[LIST] {len(ALL_BLUEPRINTS)} blueprints inteligentes criados")
    except ImportError as fallback_error:
        logger.error("[ERROR] Erro ao carregar Fallback Inteligente: ImportError")
        logger.info("🔄 Usando fallback básico de emergência...")

        from flask import Blueprint
        emergency_bp = Blueprint('emergency', __name__)

        @emergency_bp.route('/api/v1/health/live', methods=['GET'])
        def emergency_live():
            return jsonify({"status": "alive", "timestamp": datetime.now().isoformat(), "mode": "emergency"})

        @emergency_bp.route('/api/v1/health/ready', methods=['GET'])
        def emergency_ready():
            return jsonify({"status": "ready", "timestamp": datetime.now().isoformat(), "mode": "emergency"})

        ALL_BLUEPRINTS = [emergency_bp]
        logger.warning("[WARNING] Sistema em modo de emergência - funcionalidade muito limitada")

# SecurityMiddleware removido - usando apenas enhanced_security.py - MANTÉM ORIGINAL
SECURITY_MIDDLEWARE_AVAILABLE = False
SecurityMiddleware = None

# Import Performance e Security Optimizations - MANTÉM ORIGINAL
try:
    from core.performance.response_optimizer import init_performance_optimizations
    from core.security.enhanced_security import init_security_optimizations
    OPTIMIZATIONS_AVAILABLE = True
except ImportError:
    OPTIMIZATIONS_AVAILABLE = False

# Import JWT Authentication (com fallback) - MANTÉM ORIGINAL
try:
    from core.auth.jwt_validator import configure_jwt_from_env, create_auth_middleware
    JWT_AUTH_AVAILABLE = True
except ImportError:
    JWT_AUTH_AVAILABLE = False
    configure_jwt_from_env = None
    create_auth_middleware = None

def create_app():
    """Factory function para criar aplicação Flask - MANTÉM TODAS AS FUNCIONALIDADES"""
    app = Flask(__name__)

    # ========================================
    # UNIFIED MEMORY INTEGRATION
    # ========================================
    if UNIFIED_MEMORY_AVAILABLE:
        app.unified_memory_manager = unified_memory_manager

        # Register Flask app caches with unified system
        unified_memory_manager.register_cleanup_callback(lambda: gc.collect())

        logger.info("[UNIFIED MEMORY] Integrated with Flask app")
    else:
        logger.warning("[UNIFIED MEMORY] Not available - HIGH MEMORY RISK")

    # Initialize UNIFIED REAL CLOUD SERVICES FIRST - NO MOCKS - MANTÉM ORIGINAL
    try:
        from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager
        cloud_manager = get_unified_cloud_manager(config)
        app.cloud_services = cloud_manager

        health_status = cloud_manager.unified_health_check()
        if health_status['overall_healthy']:
            logger.info("[CLOUD] ✅ UNIFIED REAL CLOUD SERVICES initialized successfully - NO MOCKS")
            logger.info(f"[CLOUD] Available services: Supabase pgvector + Google Cloud Storage")
        else:
            logger.error("[CLOUD] ❌ Real cloud services health check failed")
            if config.get('ENVIRONMENT') == 'production':
                raise RuntimeError("Production requires healthy real cloud services")

    except ImportError as e:
        logger.error(f"[CLOUD] ❌ CRITICAL: Unified real cloud manager not available: {e}")
        raise RuntimeError("Application requires real cloud services - no mocks allowed")
    except Exception as e:
        logger.error(f"[CLOUD] ❌ CRITICAL: Real cloud initialization failed: {e}")
        raise RuntimeError(f"Cannot operate without real cloud services: {e}")

    # Configurar Flask com settings do config - MANTÉM TODAS AS CONFIGURAÇÕES
    app.config['SECRET_KEY'] = config.SECRET_KEY
    app.config['DEBUG'] = config.DEBUG
    app.config['TESTING'] = getattr(config, 'TESTING', False)
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH

    # Configurar sessões - MANTÉM ORIGINAL
    app.config['SESSION_COOKIE_SECURE'] = config.SESSION_COOKIE_SECURE
    app.config['SESSION_COOKIE_HTTPONLY'] = config.SESSION_COOKIE_HTTPONLY
    app.config['SESSION_COOKIE_SAMESITE'] = config.SESSION_COOKIE_SAMESITE

    # Configurar CORS - MANTÉM ORIGINAL
    setup_cors(app)

    # Configurar headers de segurança - MANTÉM ORIGINAL
    setup_security_headers(app)

    # Configurar sistema de versionamento - MANTÉM ORIGINAL
    version_manager = APIVersionManager(app)
    app.version_manager = version_manager

    # CONSOLIDAÇÃO DE MIDDLEWARES: Usando apenas enhanced_security.py - MANTÉM ORIGINAL
    logger.info("[OK] Security Middleware consolidado (apenas SecurityOptimizer ativo)")

    # Inicializar JWT Authentication de forma não-bloqueante - MANTÉM ORIGINAL
    if JWT_AUTH_AVAILABLE:
        try:
            configure_jwt_from_env()
            auth_middleware = create_auth_middleware()
            app.before_request(auth_middleware)
            logger.info("[AUTH] JWT Authentication configurado (Firebase)")
        except Exception as e:
            error_type = type(e).__name__
            logger.warning(f"[WARNING] Erro ao configurar JWT [{error_type}]: Configuração de autenticação indisponível")
    else:
        logger.info("ℹ️ JWT Authentication não disponível - sistema funciona sem autenticação")

    # INICIALIZAR RATE LIMITER DE PRODUÇÃO - SISTEMA REAL - MANTÉM ORIGINAL
    if RATE_LIMITER_AVAILABLE:
        try:
            from core.security.production_rate_limiter import init_production_rate_limiter
            rate_limiter = init_production_rate_limiter(app)
            logger.info("🔒 [SECURITY] Production Rate Limiter ativado com SQLite")
            logger.info(f"📊 [RATE LIMIT] {len(rate_limiter.medical_limits)} limites médicos configurados")
        except Exception as e:
            error_type = type(e).__name__
            logger.error(f"[ERROR] Falha ao inicializar Rate Limiter [{error_type}]: {e}")
            logger.warning("⚠️ [SECURITY] Sistema operando SEM rate limiting - RISCO DE SEGURANÇA")
    else:
        logger.warning("⚠️ [SECURITY] Rate Limiter não disponível - sistema vulnerável a ataques")

    # Pular otimizações pesadas no startup para Cloud Run - MANTÉM ORIGINAL
    cloud_run_env = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
    if OPTIMIZATIONS_AVAILABLE and not cloud_run_env:
        try:
            init_performance_optimizations(app)
            init_security_optimizations(app)
            logger.info("[START] Otimizações de performance e segurança ativadas")
        except Exception as e:
            error_type = type(e).__name__
            logger.warning(f"[WARNING] Erro ao inicializar otimizações [{error_type}]: Recursos avançados indisponíveis")
    elif cloud_run_env:
        logger.info("☁️ Cloud Run detectado - otimizações carregadas sob demanda")

    # Registrar blueprints - MANTÉM ORIGINAL
    register_blueprints(app)

    # Injetar dependências nos blueprints - MANTÉM ORIGINAL
    inject_dependencies_into_blueprints()

    # Configurar handlers de erro globais - MANTÉM ORIGINAL
    setup_error_handlers(app)

    # Configurar rotas básicas - MANTÉM ORIGINAL E ADICIONA UNIFIED MEMORY
    setup_root_routes(app)

    # Log de inicialização - MANTÉM ORIGINAL
    log_startup_info()

    return app

# MANTÉM TODAS AS FUNÇÕES ORIGINAIS - APENAS setup_cors OTIMIZADA
def setup_cors(app):
    """Configurar CORS baseado no ambiente - MANTÉM FUNCIONALIDADE COMPLETA"""
    if hasattr(config, 'CORS_ORIGINS'):
        allowed_origins = config.CORS_ORIGINS.copy()
    else:
        allowed_origins = []

    environment = EnvironmentConfig.get_current()

    if environment == 'development':
        allowed_origins.extend([
            "http://localhost:3000", "http://127.0.0.1:3000",
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:8080", "http://127.0.0.1:8080"
        ])
        logger.info("CORS configurado para desenvolvimento")
    elif environment == 'homologacao':
        allowed_origins = [
            "https://hml-roteiros-de-dispensacao.web.app",
            "https://hml-roteiros-de-dispensacao.firebaseapp.com",
            "http://localhost:3000", "http://127.0.0.1:3000"
        ]

        if os.environ.get('K_SERVICE'):
            cloud_run_url = os.environ.get('CLOUD_RUN_SERVICE_URL')
            if cloud_run_url:
                allowed_origins.append(cloud_run_url)
                import urllib.parse
                import re
                if cloud_run_url:
                    decoded_url = urllib.parse.unquote(cloud_run_url)
                    sanitized_url = ''.join(c for c in decoded_url if c.isprintable() and c not in '\n\r\t')
                    final_url = sanitized_url[:100] + '...' if len(sanitized_url) > 100 else sanitized_url
                else:
                    final_url = 'None'
                logger.info(f"Cloud Run HML URL adicionada ao CORS: {final_url}")

        logger.info("CORS configurado para homologação")
    elif environment == 'production':
        allowed_origins = [
            "https://roteiros-de-dispensacao.web.app",
            "https://roteiros-de-dispensacao.firebaseapp.com",
            "https://roteirosdedispensacao.com",
            "https://www.roteirosdedispensacao.com",
            "http://roteirosdedispensacao.com",
            "http://www.roteirosdedispensacao.com"
        ]

        if os.environ.get('K_SERVICE'):
            cloud_run_url = os.environ.get('CLOUD_RUN_SERVICE_URL')
            if cloud_run_url:
                allowed_origins.append(cloud_run_url)
                import urllib.parse
                import re
                if cloud_run_url:
                    decoded_url = urllib.parse.unquote(cloud_run_url)
                    sanitized_url = ''.join(c for c in decoded_url if c.isprintable() and c not in '\n\r\t')
                    final_url = sanitized_url[:100] + '...' if len(sanitized_url) > 100 else sanitized_url
                else:
                    final_url = 'None'
                logger.info(f"Cloud Run URL adicionada ao CORS: {final_url}")

        logger.info("CORS configurado para produção")

    if not allowed_origins:
        if environment == 'development':
            allowed_origins = ["*"]
        else:
            allowed_origins = [
                "https://roteiros-de-dispensacao.web.app",
                "https://roteirosdedispensacao.com"
            ]

    CustomCORSMiddleware(
        app,
        origins=allowed_origins,
        methods=['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'DELETE'],
        headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
        expose_headers=['Content-Length', 'X-Request-Id'],
        max_age=86400
    )

    import urllib.parse
    import re
    sanitized_origins = []
    for origin in allowed_origins:
        decoded_origin = urllib.parse.unquote(str(origin))
        clean_origin = re.sub(r'[\n\r\t\x00-\x1f\x7f-\x9f]', '', decoded_origin)
        truncated_origin = clean_origin[:50] + '...' if len(clean_origin) > 50 else clean_origin
        sanitized_origins.append(truncated_origin)
    logger.info(f"🔗 CORS configurado para: {sanitized_origins}")

def setup_security_headers(app):
    """Configurar headers de segurança aprimorados - MANTÉM ORIGINAL COMPLETO"""
    try:
        from core.security.security_patches import apply_security_patches
        app = apply_security_patches(app)
        logger.info("Patches de segurança avançados aplicados")
    except ImportError:
        logger.info("Usando configuração de segurança básica")

    @app.errorhandler(500)
    def handle_internal_error(error):
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
        if hasattr(response, 'headers'):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

            if request.is_secure:
                response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

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

            response.headers['Permissions-Policy'] = (
                "geolocation=(), microphone=(), camera=(), "
                "payment=(), usb=(), magnetometer=(), "
                "accelerometer=(), gyroscope=()"
            )

            response.headers.pop('Server', None)
            response.headers.pop('X-Powered-By', None)

        return response

def register_blueprints(app):
    """Registrar todos os blueprints - MANTÉM ORIGINAL"""
    for blueprint in ALL_BLUEPRINTS:
        app.register_blueprint(blueprint)
        logger.info(f"✓ Blueprint registrado: {blueprint.name}")

def inject_dependencies_into_blueprints():
    """Injetar dependências em todos os blueprints - MANTÉM ORIGINAL"""
    dependency_manager = get_dependency_manager()
    for blueprint in ALL_BLUEPRINTS:
        # Injeção simplificada - dependências são globais via DependencyManager
        logger.info(f"✓ Dependências disponíveis para: {blueprint.name}")

def setup_error_handlers(app):
    """Configurar handlers de erro globais - MANTÉM ORIGINAL"""

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
    """Log de informações de inicialização - MANTÉM ORIGINAL + UNIFIED MEMORY"""
    environment = EnvironmentConfig.get_current()

    logger.info("=" * 60)
    logger.info("[START] ROTEIROS DE DISPENSAÇÃO PQT-U - BACKEND REFATORADO")
    logger.info("=" * 60)
    logger.info(f"📦 Versão: refactored_unified_v1.0")
    logger.info(f"🌍 Ambiente: {environment}")
    logger.info(f"🐍 Python: {sys.version.split()[0]}")
    logger.info(f"⚙️  Debug: {config.DEBUG}")

    logger.info(f"[AUTH] QA Enabled: {getattr(config, 'QA_ENABLED', False)}")
    logger.info(f"[SAVE] Cache: {'Advanced' if getattr(config, 'ADVANCED_CACHE', False) else 'Simple'}")
    logger.info(f"🧠 RAG: {'Available' if getattr(config, 'RAG_ENABLED', False) else 'Unavailable'}")
    logger.info(f"[REPORT] Metrics: {'Enabled' if getattr(config, 'METRICS_ENABLED', False) else 'Disabled'}")

    # Status das dependências
    dependency_manager = get_dependency_manager()
    cache_service = dependency_manager.create_cache_service()
    rag_service = dependency_manager.create_rag_service()
    qa_service = dependency_manager.create_qa_framework()

    logger.info(f"✓ Cache: {'OK' if cache_service else 'FAIL'}")
    logger.info(f"✓ RAG: {'OK' if rag_service else 'FAIL'}")
    logger.info(f"✓ QA: {'OK' if qa_service else 'FAIL'}")

    # NOVO: Status do sistema unificado de memória
    if UNIFIED_MEMORY_AVAILABLE:
        logger.info(f"🧠 Memory: UNIFIED (single system replacing 5 competing systems)")
    else:
        logger.info(f"⚠️ Memory: LEGACY (multiple systems - HIGH RISK)")

    # Blueprints registrados
    logger.info(f"[LIST] Blueprints: {len(ALL_BLUEPRINTS)} registrados")
    for bp in ALL_BLUEPRINTS:
        logger.info(f"   - {bp.name}")

    logger.info("=" * 60)

def setup_root_routes(app):
    """Configurar rotas básicas - MANTÉM TODAS + UNIFIED MEMORY ENDPOINTS"""
    @app.route('/')
    def root():
        """Rota raiz - informações da API - MANTÉM ORIGINAL + UNIFIED MEMORY"""
        return jsonify({
            "api_name": "Roteiros de Dispensação PQT-U",
            "version": "v1.0.0",
            "api_version": "v1",
            "description": "Sistema educacional para dispensação farmacêutica - API Enterprise Grade",
            "author": "Doutorando Nélio Gomes de Moura Júnior - UnB",
            "environment": EnvironmentConfig.get_current(),
            "status": "operational",
            "memory_system": "unified" if UNIFIED_MEMORY_AVAILABLE else "legacy",
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
                    {"path": "/api/v1/docs", "description": "Documentação médica especializada"},
                    {"path": "/memory/unified/stats", "description": "Unified memory system statistics"},
                    {"path": "/memory/unified/optimize", "description": "Force unified memory optimization"},
                    {"path": "/memory/unified/emergency", "description": "Emergency memory cleanup"}
                ]
            },
            "timestamp": datetime.now().isoformat()
        }), 200

    @app.route('/_ah/health')
    def cloud_run_health():
        """Health check básico para Google App Engine - MANTÉM ORIGINAL"""
        return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()}), 200

    # ========================================
    # UNIFIED MEMORY SYSTEM ENDPOINTS
    # ========================================
    if UNIFIED_MEMORY_AVAILABLE:
        @app.route('/memory/unified/stats', methods=['GET'])
        def unified_memory_stats():
            """Get unified memory system comprehensive statistics"""
            try:
                report = unified_memory_manager.get_comprehensive_report()
                return jsonify(report), 200
            except Exception as e:
                return jsonify({
                    "error": f"Failed to get unified memory stats: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }), 500

        @app.route('/memory/unified/optimize', methods=['POST'])
        def unified_memory_optimize():
            """Force unified memory optimization"""
            try:
                result = unified_memory_manager.optimize_memory(force=True)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({
                    "error": f"Unified memory optimization failed: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }), 500

        @app.route('/memory/unified/emergency', methods=['POST'])
        def unified_memory_emergency():
            """Execute emergency unified memory cleanup"""
            try:
                result = unified_memory_manager.execute_emergency_cleanup()
                return jsonify(result), 200
            except Exception as e:
                return jsonify({
                    "error": f"Emergency unified cleanup failed: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }), 500

    # MANTÉM TODOS OS ENDPOINTS ORIGINAIS DE MEMÓRIA PARA COMPATIBILIDADE
    @app.route('/memory/stats', methods=['GET'])
    def memory_stats():
        """Get memory statistics (unified system preferred)"""
        try:
            if UNIFIED_MEMORY_AVAILABLE:
                report = unified_memory_manager.get_comprehensive_report()
                return jsonify({
                    "type": "unified_system",
                    "data": report,
                    "note": "Using unified memory management system"
                }), 200
            else:
                return jsonify({
                    "error": "Unified memory system not available",
                    "status": "not_available",
                    "timestamp": datetime.now().isoformat()
                }), 503
        except Exception as e:
            return jsonify({
                "error": f"Failed to get memory stats: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 500

    @app.route('/memory/optimize', methods=['POST'])
    def force_memory_optimization():
        """Force memory optimization (unified system preferred)"""
        try:
            if UNIFIED_MEMORY_AVAILABLE:
                result = unified_memory_manager.optimize_memory(force=True)
                return jsonify(result), 200
            else:
                return jsonify({
                    "error": "Unified memory system not available",
                    "status": "not_available",
                    "timestamp": datetime.now().isoformat()
                }), 503
        except Exception as e:
            return jsonify({
                "error": f"Memory optimization failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 500

    @app.route('/memory/report', methods=['GET'])
    def comprehensive_memory_report():
        """Get comprehensive memory report (unified system preferred)"""
        try:
            if UNIFIED_MEMORY_AVAILABLE:
                report = unified_memory_manager.get_comprehensive_report()
                return jsonify(report), 200
            else:
                return jsonify({
                    "error": "Unified memory system not available",
                    "timestamp": datetime.now().isoformat(),
                    "note": "Legacy memory systems were removed"
                }), 503
        except Exception as e:
            return jsonify({
                "error": f"Failed to generate memory report: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 500

# Production Rate Limiting System - MANTÉM ORIGINAL COMPLETO
try:
    from core.security.production_rate_limiter import (
        init_production_rate_limiter,
        get_production_limiter,
        medical_endpoint_limit
    )
    RATE_LIMITER_AVAILABLE = True
    logger.info("✅ Production Rate Limiter importado com sucesso")
except ImportError as e:
    RATE_LIMITER_AVAILABLE = False
    logger.warning(f"⚠️ Production Rate Limiter não disponível: {e}")

    def medical_endpoint_limit(endpoint_type: str = 'default'):
        """Fallback decorator quando rate limiter não disponível"""
        def decorator(f):
            def wrapper(*args, **kwargs):
                logger.warning(f"Rate limiting não ativo para {endpoint_type}")
                return f(*args, **kwargs)
            wrapper.__name__ = f.__name__
            return wrapper
        return decorator

def check_rate_limit(endpoint_type: str = 'default'):
    """DEPRECATED: Use medical_endpoint_limit() instead"""
    logger.warning("check_rate_limit() DEPRECATED - use medical_endpoint_limit()")
    return medical_endpoint_limit(endpoint_type)

# Criar aplicação
app = create_app()

# Execução da aplicação - MANTÉM ORIGINAL
if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', config.PORT))
        host = config.HOST

        cloud_run_env = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
        if cloud_run_env:
            logger.info(f"☁️ Cloud Run detectado - configurações otimizadas")
            import signal
            signal.alarm(0)

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

        if clean_startup_enabled:
            print(f"Server ready on {sanitized_host}:{sanitized_port}")
        elif startup_logger:
            startup_logger.log_startup_complete(sanitized_host, int(sanitized_port))
        else:
            logger.info(f"[START] Iniciando servidor em {sanitized_host}:{sanitized_port}")

        app.run(
            host=host,
            port=port,
            debug=False if cloud_run_env else config.DEBUG,
            threaded=True,
            use_reloader=False,
            request_handler=None
        )

    except KeyboardInterrupt:
        logger.info("⏹️  Servidor interrompido pelo usuário")
    except Exception as e:
        error_type = type(e).__name__
        logger.error(f"[ERROR] Erro ao iniciar servidor [{error_type}]: Falha na inicialização")
        sys.exit(1)