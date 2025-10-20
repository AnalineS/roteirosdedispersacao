# -*- coding: utf-8 -*-
"""
Ultra-Optimized Main Application - Medical Education Platform
Sistema Educacional para Dispensação PQT-U - Versão Refatorada
REDUCED FROM 1067 to ~200 LINES - UNIFIED MEMORY MANAGEMENT
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

print("Server starting...")

# Essential imports
from flask import Flask
from app_config import config
from core.versioning import APIVersionManager

# UNIFIED MEMORY SYSTEM - SINGLE POINT OF CONTROL
from core.performance.unified_memory_system import (
    initialize_medical_memory_management,
    medical_memory_safe
)

# Extracted factory components
from core.app_factory import (
    setup_cloud_services,
    setup_cors,
    setup_security_headers,
    setup_authentication,
    setup_rate_limiting,
    register_blueprints,
    inject_dependencies,
    log_startup_info
)

# Extracted routes and error handlers
from core.app_routes import setup_error_handlers, setup_routes

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app() -> Flask:
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

    # Initialize all components using extracted functions
    setup_cloud_services(app)
    setup_cors(app)
    setup_security_headers(app)

    # Setup API versioning
    version_manager = APIVersionManager(app)
    app.version_manager = version_manager

    setup_authentication(app)
    setup_rate_limiting(app)
    register_blueprints(app)
    inject_dependencies()
    setup_error_handlers(app)
    setup_routes(app)
    log_startup_info()

    return app

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