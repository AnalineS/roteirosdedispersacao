# -*- coding: utf-8 -*-
"""
Backend Test Version - Minimal Flask App for Testing
Uses medical_core_blueprint without cloud dependencies
"""

import os
import sys
from flask import Flask
from flask_cors import CORS
from datetime import datetime

# Minimal Flask app for testing
def create_test_app():
    """Create minimal Flask app for testing purposes"""
    app = Flask(__name__)

    # Basic configuration
    app.config['SECRET_KEY'] = 'test-secret-key-for-testing-only'
    app.config['DEBUG'] = True
    app.config['TESTING'] = True

    # Enable CORS for testing
    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

    # Import and register medical core blueprint
    try:
        from blueprints.medical_core_blueprint import medical_core_bp
        app.register_blueprint(medical_core_bp)
        print("Medical core blueprint registered successfully")
    except ImportError as e:
        print(f"Failed to import medical_core_blueprint: {e}")
        return None

    # Basic health endpoint that doesn't require cloud services
    @app.route('/api/health', methods=['GET'])
    def basic_health():
        """Basic health check for testing"""
        return {
            'status': 'healthy',
            'mode': 'testing',
            'medical_system': 'operational',
            'timestamp': datetime.now().isoformat(),
            'version': 'test-1.0.0'
        }

    @app.route('/api/health/live', methods=['GET'])
    def liveness():
        """Kubernetes liveness probe for testing"""
        return {
            'status': 'alive',
            'timestamp': datetime.now().isoformat()
        }

    @app.route('/api/health/ready', methods=['GET'])
    def readiness():
        """Kubernetes readiness probe for testing"""
        return {
            'status': 'ready',
            'medical_core': 'ready',
            'timestamp': datetime.now().isoformat()
        }

    # Additional health endpoints that tests expect
    @app.route('/api/v1/health', methods=['GET'])
    def v1_health():
        """API v1 health check for testing"""
        return {
            'status': 'healthy',
            'mode': 'testing',
            'medical_system': 'operational',
            'timestamp': datetime.now().isoformat(),
            'version': 'test-1.0.0'
        }

    @app.route('/api/v1/health/live', methods=['GET'])
    def v1_liveness():
        """API v1 liveness probe for testing"""
        return {
            'status': 'alive',
            'timestamp': datetime.now().isoformat()
        }

    @app.route('/api/v1/health/ready', methods=['GET'])
    def v1_readiness():
        """API v1 readiness probe for testing"""
        return {
            'status': 'ready',
            'medical_core': 'ready',
            'timestamp': datetime.now().isoformat()
        }

    @app.route('/_ah/health', methods=['GET'])
    def app_engine_health():
        """Google App Engine health check for testing"""
        return {
            'status': 'ok',
            'timestamp': datetime.now().isoformat()
        }

    return app

if __name__ == '__main__':
    print("Starting test backend server...")

    app = create_test_app()
    if app is None:
        print("Failed to create test app")
        sys.exit(1)

    print("Test backend starting on port 5000")
    app.run(host='0.0.0.0', port=5000, debug=True)