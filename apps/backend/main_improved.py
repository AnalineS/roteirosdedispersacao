# -*- coding: utf-8 -*-
"""
Main Application - Improved Clean Architecture
Hanseníase Medication Dispensing Educational Platform

IMPROVEMENTS:
- Reduced from 1,068 lines to ~150 lines (85% reduction)
- Separated concerns into specialized modules
- Eliminated code duplication
- Improved error handling consistency
- Better configuration management
- Cleaner startup sequence
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

# Add current directory to Python path for imports
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from core.config.config_manager import initialize_configuration
from core.app_factory.flask_app_factory import create_flask_app
from core.optimization.memory_manager import initialize_memory_management


def setup_logging():
    """Configure application logging"""
    try:
        from core.logging import initialize_clean_logging
        main_logger, startup_logger, warning_manager = initialize_clean_logging()
        return main_logger, startup_logger
    except ImportError:
        # Fallback to basic logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__), None


def initialize_application():
    """
    Initialize application with all required components

    Returns:
        Tuple of (Flask app, configuration, logger)
    """
    # Set up logging
    logger, startup_logger = setup_logging()

    if startup_logger:
        startup_logger.log_startup_begin()

    try:
        # Initialize configuration
        config = initialize_configuration()
        logger.info("Configuration initialized successfully")

        # Create Flask application
        app = create_flask_app()
        logger.info("Flask application created successfully")

        # Initialize memory management
        memory_manager = initialize_memory_management(app)
        logger.info("Memory management initialized")

        # Initialize JWT authentication if available
        initialize_jwt_authentication(app, logger)

        # Initialize rate limiting if available
        initialize_rate_limiting(app, logger)

        # Log startup completion
        log_startup_summary(config, logger)

        if startup_logger:
            startup_logger.log_startup_complete(config.server.host, config.server.port)

        return app, config, logger

    except Exception as e:
        logger.error(f"Application initialization failed: {e}")
        raise


def initialize_jwt_authentication(app, logger):
    """Initialize JWT authentication if available"""
    try:
        from core.auth.jwt_validator import configure_jwt_from_env, create_auth_middleware

        configure_jwt_from_env()
        auth_middleware = create_auth_middleware()
        app.before_request(auth_middleware)
        logger.info("JWT authentication configured")

    except ImportError:
        logger.info("JWT authentication not available - continuing without auth")
    except Exception as e:
        logger.warning(f"JWT authentication setup failed: {type(e).__name__}")


def initialize_rate_limiting(app, logger):
    """Initialize rate limiting if available"""
    try:
        from core.security.production_rate_limiter import init_production_rate_limiter

        rate_limiter = init_production_rate_limiter(app)
        logger.info(f"Production rate limiter initialized with {len(rate_limiter.medical_limits)} medical endpoints")

    except ImportError:
        logger.warning("Rate limiter not available - security risk in production")
    except Exception as e:
        logger.error(f"Rate limiter initialization failed: {type(e).__name__}")


def log_startup_summary(config, logger):
    """Log application startup summary"""
    logger.info("=" * 60)
    logger.info("HANSENÍASE DISPENSING EDUCATIONAL PLATFORM - BACKEND")
    logger.info("=" * 60)
    logger.info(f"Version: v1.0.0")
    logger.info(f"Environment: {config.environment.value}")
    logger.info(f"Python: {sys.version.split()[0]}")
    logger.info(f"Debug Mode: {config.server.debug}")
    logger.info(f"RAG System: {'Enabled' if config.ai.rag_available else 'Disabled'}")
    logger.info(f"Cache System: {'Advanced' if config.cache.advanced_cache else 'Basic'}")
    logger.info(f"Security: {'Production' if config.security.rate_limit_enabled else 'Development'}")
    logger.info("=" * 60)


def run_application():
    """Run the Flask application"""
    try:
        # Initialize application
        app, config, logger = initialize_application()

        # Get server configuration
        host = config.server.host
        port = config.server.port
        debug = config.server.debug

        # Cloud Run optimization
        is_cloud_run = os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_ENV')
        if is_cloud_run:
            debug = False  # Always disable debug in Cloud Run
            logger.info("Cloud Run environment detected - optimized settings applied")

        # Start server
        logger.info(f"Starting server on {host}:{port}")

        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True,
            use_reloader=False  # Prevent double initialization
        )

    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server startup failed: {type(e).__name__}")
        sys.exit(1)


if __name__ == '__main__':
    run_application()