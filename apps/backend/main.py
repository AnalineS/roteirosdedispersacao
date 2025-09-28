# -*- coding: utf-8 -*-
"""
Main Application - Hanseníase Educational Platform
Optimized Flask Application with Medical AI Personas
"""

import sys
import os
import logging
from pathlib import Path

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from flask import Flask
from app_config import config, EnvironmentConfig
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config)

    # CORS Configuration
    try:
        from core.security.custom_cors import CustomCORSMiddleware
        cors_middleware = CustomCORSMiddleware(app)
        logger.info("Custom CORS middleware initialized")
    except ImportError:
        from flask_cors import CORS
        CORS(app, origins=config.CORS_ORIGINS)
        logger.info("Standard CORS initialized")

    # Register blueprints
    try:
        from blueprints.medical_core_blueprint import medical_core_bp
        from blueprints.user_management_blueprint import user_management_bp
        from blueprints.communication_blueprint import communication_bp
        from blueprints.engagement_multimodal_blueprint import engagement_multimodal_bp
        from blueprints.analytics_observability_blueprint import analytics_observability_bp
        from blueprints.infrastructure_blueprint import infrastructure_bp
        from blueprints.authentication_blueprint import authentication_bp
        from blueprints.api_documentation_blueprint import api_documentation_bp

        # Register all blueprints without additional prefix since they already define /api/v1
        app.register_blueprint(medical_core_bp)
        app.register_blueprint(user_management_bp)
        app.register_blueprint(communication_bp)
        app.register_blueprint(engagement_multimodal_bp)
        app.register_blueprint(analytics_observability_bp)
        app.register_blueprint(infrastructure_bp)
        app.register_blueprint(authentication_bp)
        app.register_blueprint(api_documentation_bp)

        logger.info("All blueprints registered successfully")

    except ImportError as e:
        logger.error(f"Failed to import blueprints: {e}")
        # Continue without some blueprints if they're not available

    # Initialize JWT if available
    try:
        from core.auth.jwt_validator import configure_jwt_from_env, create_auth_middleware
        configure_jwt_from_env()
        auth_middleware = create_auth_middleware()
        app.before_request(auth_middleware)
        logger.info("JWT authentication configured")
    except ImportError:
        logger.info("JWT authentication not available")
    except Exception as e:
        logger.warning(f"JWT authentication setup failed: {e}")

    # Initialize rate limiting if available
    try:
        from core.security.production_rate_limiter import init_production_rate_limiter
        init_production_rate_limiter(app)
        logger.info("Production rate limiter initialized")
    except ImportError:
        logger.warning("Rate limiter not available")
    except Exception as e:
        logger.error(f"Rate limiter initialization failed: {e}")

    # Health check endpoints - Cloud Run optimized
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    @app.route('/_ah/health', methods=['GET'])
    def health_check():
        """Fast health check endpoint for Cloud Run"""
        return {
            "status": "healthy",
            "service": "hansenase-education-platform",
            "version": "1.0.0",
            "environment": getattr(config, 'ENVIRONMENT', 'unknown'),
            "timestamp": datetime.now().isoformat()
        }, 200

    # Root endpoint to confirm app is working
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint with basic API information"""
        return {
            "message": "Roteiro de Dispensação API",
            "version": "1.0.1",
            "status": "operational",
            "endpoints": {
                "health": "/health",
                "api_health": "/api/health",
                "medical": "/api/v1/",
                "chat": "/api/v1/chat"
            },
            "timestamp": datetime.now().isoformat()
        }, 200

    return app

def run_application():
    """Initialize and run the Flask application"""
    try:
        # Use global app instance or create new one for direct execution
        global app
        if app is None:
            app = create_app()

        # Get server configuration
        host = getattr(config, 'HOST', '0.0.0.0')
        port = int(getattr(config, 'PORT', 5000))
        debug = getattr(config, 'DEBUG', False)

        # Cloud Run optimization
        is_cloud_run = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
        if is_cloud_run:
            debug = False
            logger.info("Cloud Run environment detected - debug disabled")

        logger.info("=" * 60)
        logger.info("HANSENÍASE EDUCATIONAL PLATFORM - BACKEND")
        logger.info("=" * 60)
        logger.info(f"Environment: {getattr(config, 'ENVIRONMENT', 'unknown')}")
        logger.info(f"Host: {host}:{port}")
        logger.info(f"Debug: {debug}")
        logger.info("=" * 60)

        # Start server
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True,
            use_reloader=False
        )

    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        sys.exit(1)

# WSGI application instance for Gunicorn
# Create app instance outside of main to make it accessible to WSGI servers
app = None
try:
    app = create_app()
    logger.info("Flask app created successfully for WSGI")
except Exception as e:
    logger.error(f"Failed to create Flask app for WSGI: {e}")
    # Create minimal app for error handling
    from flask import Flask
    app = Flask(__name__)

    @app.route('/health')
    @app.route('/api/health')
    def emergency_health():
        return {"status": "error", "message": "Application failed to initialize"}, 503

if __name__ == '__main__':
    run_application()