# -*- coding: utf-8 -*-
"""
Flask Application Factory - Clean Architecture
Separated from main.py to follow Single Responsibility Principle
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from flask import Flask, request, jsonify

from app_config import config, EnvironmentConfig
from core.logging import initialize_clean_logging
from core.security.custom_cors import CustomCORSMiddleware
from core.versioning import APIVersionManager
from core.dependencies import dependency_injector


logger = logging.getLogger(__name__)


class FlaskAppFactory:
    """Factory class for creating and configuring Flask applications"""

    def __init__(self):
        self.app: Optional[Flask] = None
        self._blueprints_registered = False
        self._security_configured = False
        self._optimizations_initialized = False

    def create_app(self) -> Flask:
        """
        Create and configure Flask application

        Returns:
            Configured Flask application instance
        """
        if self.app is not None:
            logger.warning("App already created, returning existing instance")
            return self.app

        self.app = Flask(__name__)

        # Configure Flask settings
        self._configure_flask_settings()

        # Initialize cloud services
        self._initialize_cloud_services()

        # Configure security and middleware
        self._configure_security()

        # Configure CORS
        self._configure_cors()

        # Set up versioning
        self._configure_versioning()

        # Register blueprints
        self._register_blueprints()

        # Set up error handlers
        self._configure_error_handlers()

        # Configure root routes
        self._configure_root_routes()

        return self.app

    def _configure_flask_settings(self) -> None:
        """Configure basic Flask settings"""
        self.app.config.update({
            'SECRET_KEY': config.SECRET_KEY,
            'DEBUG': config.DEBUG,
            'TESTING': getattr(config, 'TESTING', False),
            'MAX_CONTENT_LENGTH': config.MAX_CONTENT_LENGTH,
            'SESSION_COOKIE_SECURE': config.SESSION_COOKIE_SECURE,
            'SESSION_COOKIE_HTTPONLY': config.SESSION_COOKIE_HTTPONLY,
            'SESSION_COOKIE_SAMESITE': config.SESSION_COOKIE_SAMESITE,
        })
        logger.info("Flask basic configuration completed")

    def _initialize_cloud_services(self) -> None:
        """Initialize unified cloud services"""
        try:
            from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager
            cloud_manager = get_unified_cloud_manager(config)
            self.app.cloud_services = cloud_manager

            health_status = cloud_manager.unified_health_check()
            if health_status['overall_healthy']:
                logger.info("✅ Unified cloud services initialized successfully")
            else:
                logger.error("❌ Cloud services health check failed")
                if config.get('ENVIRONMENT') == 'production':
                    raise RuntimeError("Production requires healthy cloud services")

        except ImportError as e:
            logger.error(f"❌ Cloud manager not available: {e}")
            raise RuntimeError("Application requires cloud services")
        except Exception as e:
            logger.error(f"❌ Cloud initialization failed: {e}")
            raise RuntimeError(f"Cannot operate without cloud services: {e}")

    def _configure_security(self) -> None:
        """Configure security headers and middleware"""
        if self._security_configured:
            return

        try:
            from core.security.security_patches import apply_security_patches
            self.app = apply_security_patches(self.app)
            logger.info("Advanced security patches applied")
        except ImportError:
            logger.info("Using basic security configuration")

        @self.app.after_request
        def add_security_headers(response):
            """Add security headers to all responses"""
            if hasattr(response, 'headers'):
                response.headers.update({
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                })

                # HSTS for HTTPS
                if request.is_secure:
                    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

                # CSP Policy
                csp_policy = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai; "
                    "frame-ancestors 'none'"
                )
                response.headers['Content-Security-Policy'] = csp_policy

                # Remove revealing headers
                response.headers.pop('Server', None)
                response.headers.pop('X-Powered-By', None)

            return response

        self._security_configured = True
        logger.info("Security configuration completed")

    def _configure_cors(self) -> None:
        """Configure CORS based on environment"""
        allowed_origins = self._get_cors_origins()

        CustomCORSMiddleware(
            self.app,
            origins=allowed_origins,
            methods=['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'DELETE'],
            headers=[
                'Content-Type', 'Authorization', 'X-Requested-With',
                'Accept', 'Origin', 'Access-Control-Request-Method',
                'Access-Control-Request-Headers'
            ],
            expose_headers=['Content-Length', 'X-Request-Id'],
            max_age=86400
        )

        logger.info(f"CORS configured for environment: {EnvironmentConfig.get_current()}")

    def _get_cors_origins(self) -> list:
        """Get CORS origins based on environment"""
        environment = EnvironmentConfig.get_current()

        if environment == 'development':
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ]
        elif environment in ['staging', 'homologacao', 'hml']:
            return [
                "https://hml-roteiros-de-dispensacao.web.app",
                "https://hml-roteiros-de-dispensacao.firebaseapp.com",
                "http://localhost:3000"
            ]
        else:  # production
            return [
                "https://roteiros-de-dispensacao.web.app",
                "https://roteirosdedispensacao.com",
                "https://www.roteirosdedispensacao.com"
            ]

    def _configure_versioning(self) -> None:
        """Configure API versioning"""
        version_manager = APIVersionManager(self.app)
        self.app.version_manager = version_manager
        logger.info("API versioning configured")

    def _register_blueprints(self) -> None:
        """Register all blueprints"""
        if self._blueprints_registered:
            return

        try:
            from blueprints import ALL_BLUEPRINTS
            blueprints_available = True
        except ImportError:
            logger.warning("Main blueprints not available, using fallback")
            blueprints_available = False

        if blueprints_available:
            for blueprint in ALL_BLUEPRINTS:
                self.app.register_blueprint(blueprint)
                logger.info(f"✓ Blueprint registered: {blueprint.name}")

            # Inject dependencies
            for blueprint in ALL_BLUEPRINTS:
                dependency_injector.inject_into_blueprint(blueprint)
        else:
            self._register_fallback_blueprints()

        self._blueprints_registered = True

    def _register_fallback_blueprints(self) -> None:
        """Register fallback blueprints when main ones are not available"""
        try:
            from core.fallback import create_intelligent_fallback_blueprints
            fallback_blueprints = create_intelligent_fallback_blueprints()

            for blueprint in fallback_blueprints:
                self.app.register_blueprint(blueprint)
                logger.info(f"✓ Fallback blueprint registered: {blueprint.name}")

        except ImportError:
            logger.error("Fallback blueprints also not available")
            # Create emergency blueprint
            self._create_emergency_blueprint()

    def _create_emergency_blueprint(self) -> None:
        """Create minimal emergency blueprint"""
        from flask import Blueprint

        emergency_bp = Blueprint('emergency', __name__)

        @emergency_bp.route('/api/v1/health/live', methods=['GET'])
        def emergency_live():
            return jsonify({
                "status": "alive",
                "timestamp": datetime.now().isoformat(),
                "mode": "emergency"
            })

        self.app.register_blueprint(emergency_bp)
        logger.warning("Emergency blueprint created - limited functionality")

    def _configure_error_handlers(self) -> None:
        """Configure global error handlers"""

        @self.app.errorhandler(404)
        def not_found(error):
            return jsonify({
                "error": "Endpoint not found",
                "error_code": "NOT_FOUND",
                "available_endpoints": self._get_available_endpoints(),
                "timestamp": datetime.now().isoformat()
            }), 404

        @self.app.errorhandler(405)
        def method_not_allowed(error):
            return jsonify({
                "error": "HTTP method not allowed",
                "error_code": "METHOD_NOT_ALLOWED",
                "allowed_methods": ["GET", "POST", "OPTIONS"],
                "timestamp": datetime.now().isoformat()
            }), 405

        @self.app.errorhandler(500)
        def internal_error(error):
            error_type = type(error).__name__
            logger.error(f"Internal error [{error_type}]: Request processing failed")

            return jsonify({
                "error": "Internal server error",
                "error_code": "INTERNAL_ERROR",
                "message": "Please try again later",
                "timestamp": datetime.now().isoformat()
            }), 500

        @self.app.errorhandler(413)
        def request_entity_too_large(error):
            return jsonify({
                "error": "Payload too large",
                "error_code": "PAYLOAD_TOO_LARGE",
                "max_size": "16MB",
                "timestamp": datetime.now().isoformat()
            }), 413

    def _get_available_endpoints(self) -> list:
        """Get list of available API endpoints"""
        return [
            "/api/v1/health",
            "/api/v1/health/live",
            "/api/v1/health/ready",
            "/api/v1/chat",
            "/api/v1/personas",
            "/api/v1/feedback",
            "/api/v1/monitoring/stats",
            "/api/v1/docs"
        ]

    def _configure_root_routes(self) -> None:
        """Configure basic root routes"""

        @self.app.route('/')
        def root():
            """API information endpoint"""
            return jsonify({
                "api_name": "Roteiros de Dispensação PQT-U",
                "version": "v1.0.0",
                "api_version": "v1",
                "description": "Educational system for pharmaceutical dispensing",
                "author": "Doutorando Nélio Gomes de Moura Júnior - UnB",
                "environment": EnvironmentConfig.get_current(),
                "status": "operational",
                "documentation": {
                    "openapi_url": "/api/v1/docs",
                    "endpoints": self._get_available_endpoints()
                },
                "timestamp": datetime.now().isoformat()
            }), 200

        @self.app.route('/_ah/health')
        def app_engine_health():
            """Health check for Google App Engine"""
            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now().isoformat()
            }), 200


def create_flask_app() -> Flask:
    """
    Factory function to create Flask application

    Returns:
        Configured Flask application
    """
    factory = FlaskAppFactory()
    return factory.create_app()