# -*- coding: utf-8 -*-
"""
Application Factory Components - Medical Platform
Extracted setup functions to reduce main.py complexity
"""

import logging
from datetime import datetime
from flask import Flask, jsonify, request
from app_config import config, EnvironmentConfig
from core.security.custom_cors import CustomCORSMiddleware
from core.versioning import APIVersionManager
from core.dependencies import dependency_injector

logger = logging.getLogger(__name__)

def setup_cloud_services(app: Flask) -> None:
    """Initialize cloud services with environment-specific behavior"""
    environment = getattr(config, 'ENVIRONMENT', 'development')

    # Simple mock object for development only
    class SimpleCloudMock:
        def unified_health_check(self):
            return {'overall_healthy': True}

    # Development: use fallback (no real cloud services needed)
    if environment == 'development':
        logger.info("[CLOUD] ✅ Development mode - using minimal cloud setup")
        app.cloud_services = SimpleCloudMock()
        return

    # Staging/Homologação and Production: REQUIRE real Supabase
    try:
        from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager
        cloud_manager = get_unified_cloud_manager(config)
        app.cloud_services = cloud_manager

        health_status = cloud_manager.unified_health_check()
        if health_status['overall_healthy']:
            logger.info(f"[CLOUD] ✅ Real cloud services initialized for {environment} (Supabase + GCS)")
        else:
            logger.error(f"[CLOUD] ❌ Real cloud services health check failed in {environment}")
            raise RuntimeError(f"{environment.capitalize()} requires healthy real cloud services")

    except Exception as e:
        logger.error(f"[CLOUD] Failed to initialize cloud services in {environment}: {e}")
        raise RuntimeError(f"{environment.capitalize()} requires healthy cloud services with real credentials")

def setup_cors(app: Flask) -> None:
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

def setup_security_headers(app: Flask) -> None:
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

def setup_authentication(app: Flask) -> None:
    """Setup JWT authentication (non-blocking)"""
    try:
        from core.auth.jwt_validator import configure_jwt_from_env, create_auth_middleware
        configure_jwt_from_env()
        auth_middleware = create_auth_middleware()
        app.before_request(auth_middleware)
        logger.info("[AUTH] JWT authentication configured")
    except Exception as e:
        logger.info(f"[AUTH] Authentication unavailable: {type(e).__name__}")

def setup_rate_limiting(app: Flask) -> None:
    """Setup production rate limiting for medical endpoints"""
    try:
        from core.security.production_rate_limiter import init_production_rate_limiter
        rate_limiter = init_production_rate_limiter(app)
        logger.info("[SECURITY] Medical rate limiting enabled")
    except Exception as e:
        logger.warning(f"[SECURITY] Rate limiting unavailable: {type(e).__name__}")

def register_blueprints(app: Flask) -> None:
    """Register all blueprints"""
    try:
        from blueprints import ALL_BLUEPRINTS
        for blueprint in ALL_BLUEPRINTS:
            app.register_blueprint(blueprint)
            logger.info(f"[BLUEPRINT] Registered: {blueprint.name}")
    except ImportError:
        logger.warning("[BLUEPRINT] Using fallback blueprints")
        setup_fallback_blueprints(app)

def setup_fallback_blueprints(app: Flask) -> None:
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

def inject_dependencies() -> None:
    """Inject dependencies into blueprints"""
    try:
        from blueprints import ALL_BLUEPRINTS
        for blueprint in ALL_BLUEPRINTS:
            dependency_injector.inject_into_blueprint(blueprint)
    except ImportError:
        logger.info("[DEPENDENCIES] Using fallback dependency injection")

def log_startup_info() -> None:
    """Log startup information"""
    import sys
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