# -*- coding: utf-8 -*-
"""
Simplified Main Application - Medical Education Platform
Sistema Educacional para Dispensação PQT-U - Versão Otimizada
UNIFIED MEMORY MANAGEMENT - Single system replacing 5 competing systems
"""

import sys
import os
import logging
from datetime import datetime

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Initialize clean logging
print("Server starting...")

# Essential imports
from flask import Flask, request, jsonify
from app_config import config, EnvironmentConfig
from core.dependencies import dependency_injector
from core.security.custom_cors import CustomCORSMiddleware
from core.versioning import APIVersionManager

# UNIFIED MEMORY SYSTEM - SINGLE POINT OF CONTROL
from core.performance.unified_memory_system import (
    initialize_medical_memory_management,
    get_unified_memory_manager,
    medical_memory_safe
)

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create optimized Flask application for medical platform"""
    app = Flask(__name__)

    # Initialize UNIFIED MEMORY MANAGEMENT (replaces 5 systems)
    memory_manager = initialize_medical_memory_management()
    app.memory_manager = memory_manager
    logger.info("[MEMORY] Unified memory management initialized - Target: <50% usage")

    # Basic Flask configuration
    app.config.update({
        'SECRET_KEY': config.SECRET_KEY,
        'DEBUG': config.DEBUG,
        'TESTING': getattr(config, 'TESTING', False),
        'MAX_CONTENT_LENGTH': config.MAX_CONTENT_LENGTH,
        'SESSION_COOKIE_SECURE': config.SESSION_COOKIE_SECURE,
        'SESSION_COOKIE_HTTPONLY': config.SESSION_COOKIE_HTTPONLY,
        'SESSION_COOKIE_SAMESITE': config.SESSION_COOKIE_SAMESITE,
    })

    # Initialize real cloud services
    setup_cloud_services(app)

    # Configure CORS for medical platform
    setup_cors(app)

    # Configure security headers
    setup_security_headers(app)

    # Setup API versioning
    version_manager = APIVersionManager(app)
    app.version_manager = version_manager

    # Initialize authentication (non-blocking)
    setup_authentication(app)

    # Initialize rate limiting for medical endpoints
    setup_rate_limiting(app)

    # Register blueprints
    register_blueprints(app)

    # Inject dependencies
    inject_dependencies()

    # Setup error handlers
    setup_error_handlers(app)

    # Setup root routes
    setup_routes(app)

    # Log startup info
    log_startup_info()

    return app

def setup_cloud_services(app):
    """Initialize real cloud services (Supabase + Google Cloud)"""
    try:
        from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager
        cloud_manager = get_unified_cloud_manager(config)
        app.cloud_services = cloud_manager

        health_status = cloud_manager.unified_health_check()
        if health_status['overall_healthy']:
            logger.info("[CLOUD] ✅ Real cloud services initialized (Supabase + GCS)")
        else:
            logger.warning("[CLOUD] ⚠️ Some cloud services unavailable - using fallbacks")

    except Exception as e:
        logger.error(f"[CLOUD] Failed to initialize cloud services: {e}")
        if config.get('ENVIRONMENT') == 'production':
            raise RuntimeError("Production requires healthy cloud services")

def setup_cors(app):
    """Configure CORS for medical platform"""
    environment = EnvironmentConfig.get_current()

    allowed_origins = {
        'development': [
            "http://localhost:3000", "http://127.0.0.1:3000",
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:8080", "http://127.0.0.1:8080"
        ],
        'homologacao': [
            "https://hml-roteiros-de-dispensacao.web.app",
            "https://hml-roteiros-de-dispensacao.firebaseapp.com",
            "http://localhost:3000", "http://127.0.0.1:3000"
        ],
        'production': [
            "https://roteiros-de-dispensacao.web.app",
            "https://roteiros-de-dispensacao.firebaseapp.com",
            "https://roteirosdedispensacao.com",
            "https://www.roteirosdedispensacao.com"
        ]
    }.get(environment, ["*" if environment == 'development' else "https://roteirosdedispensacao.com"])

    CustomCORSMiddleware(
        app,
        origins=allowed_origins,
        methods=['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'DELETE'],
        headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        expose_headers=['Content-Length', 'X-Request-Id'],
        max_age=86400
    )

    logger.info(f"[CORS] Configured for {environment}")

def setup_security_headers(app):
    """Configure security headers for medical platform"""
    try:
        from core.security.security_patches import apply_security_patches
        app = apply_security_patches(app)
        logger.info("[SECURITY] Advanced security patches applied")
    except ImportError:
        logger.info("[SECURITY] Using basic security configuration")

    @app.after_request
    def add_security_headers(response):
        if hasattr(response, 'headers'):
            response.headers.update({
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Content-Security-Policy': (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' https://openrouter.ai; "
                    "frame-ancestors 'none'"
                )
            })

            if request.is_secure:
                response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        return response

def setup_authentication(app):
    """Setup JWT authentication (non-blocking)"""
    try:
        from core.auth.jwt_validator import configure_jwt_from_env, create_auth_middleware
        configure_jwt_from_env()
        auth_middleware = create_auth_middleware()
        app.before_request(auth_middleware)
        logger.info("[AUTH] JWT authentication configured")
    except Exception as e:
        logger.info(f"[AUTH] Authentication unavailable: {type(e).__name__}")

def setup_rate_limiting(app):
    """Setup production rate limiting for medical endpoints"""
    try:
        from core.security.production_rate_limiter import init_production_rate_limiter
        rate_limiter = init_production_rate_limiter(app)
        logger.info("[SECURITY] Medical rate limiting enabled")
    except Exception as e:
        logger.warning(f"[SECURITY] Rate limiting unavailable: {type(e).__name__}")

def register_blueprints(app):
    """Register all blueprints"""
    try:
        from blueprints import ALL_BLUEPRINTS
        for blueprint in ALL_BLUEPRINTS:
            app.register_blueprint(blueprint)
            logger.info(f"[BLUEPRINT] Registered: {blueprint.name}")
    except ImportError:
        logger.warning("[BLUEPRINT] Using fallback blueprints")
        setup_fallback_blueprints(app)

def setup_fallback_blueprints(app):
    """Setup basic fallback blueprints for medical platform"""
    from flask import Blueprint

    emergency_bp = Blueprint('emergency', __name__)

    @emergency_bp.route('/api/v1/health', methods=['GET'])
    def health():
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "mode": "emergency_fallback"
        })

    app.register_blueprint(emergency_bp)
    logger.info("[BLUEPRINT] Emergency fallback blueprint registered")

def inject_dependencies():
    """Inject dependencies into blueprints"""
    try:
        from blueprints import ALL_BLUEPRINTS
        for blueprint in ALL_BLUEPRINTS:
            dependency_injector.inject_into_blueprint(blueprint)
    except ImportError:
        logger.info("[DEPENDENCIES] Using fallback dependency injection")

def setup_error_handlers(app):
    """Setup global error handlers"""
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Endpoint não encontrado",
            "error_code": "NOT_FOUND",
            "timestamp": datetime.now().isoformat()
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

@medical_memory_safe
def setup_routes(app):
    """Setup root routes for medical platform"""
    @app.route('/')
    def root():
        return jsonify({
            "api_name": "Roteiros de Dispensação PQT-U",
            "version": "v1.0.0",
            "description": "Sistema educacional para dispensação farmacêutica",
            "environment": EnvironmentConfig.get_current(),
            "status": "operational",
            "memory_management": "unified_system",
            "timestamp": datetime.now().isoformat()
        })

    @app.route('/_ah/health')
    def cloud_health():
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        })

    # Unified Memory Management Endpoints
    @app.route('/memory/stats', methods=['GET'])
    def memory_stats():
        """Get unified memory system statistics"""
        try:
            manager = app.memory_manager
            report = manager.get_comprehensive_report()
            return jsonify(report), 200
        except Exception as e:
            return jsonify({
                "error": f"Failed to get memory stats: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 500

    @app.route('/memory/optimize', methods=['POST'])
    def optimize_memory():
        """Force memory optimization"""
        try:
            manager = app.memory_manager
            result = manager.optimize_memory(force=True)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({
                "error": f"Memory optimization failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 500

    @app.route('/memory/emergency', methods=['POST'])
    def emergency_cleanup():
        """Execute emergency memory cleanup"""
        try:
            manager = app.memory_manager
            result = manager.execute_emergency_cleanup()
            return jsonify(result), 200
        except Exception as e:
            return jsonify({
                "error": f"Emergency cleanup failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }), 500

def log_startup_info():
    """Log startup information"""
    environment = EnvironmentConfig.get_current()

    logger.info("=" * 60)
    logger.info("[START] ROTEIROS DE DISPENSAÇÃO PQT-U - OPTIMIZED VERSION")
    logger.info("=" * 60)
    logger.info(f"Version: simplified_v1.0")
    logger.info(f"Environment: {environment}")
    logger.info(f"Python: {sys.version.split()[0]}")
    logger.info(f"Debug: {config.DEBUG}")
    logger.info(f"Memory Management: UNIFIED (single system)")
    logger.info("=" * 60)

# Create application
app = create_app()

# Run application
if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', config.PORT))
        host = config.HOST

        # Cloud Run optimization
        cloud_run_env = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
        debug_mode = False if cloud_run_env else config.DEBUG

        logger.info(f"Starting server on {host}:{port}")

        app.run(
            host=host,
            port=port,
            debug=debug_mode,
            threaded=True,
            use_reloader=False
        )

    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server startup failed: {type(e).__name__}")
        sys.exit(1)