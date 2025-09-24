# -*- coding: utf-8 -*-
"""
Application Routes and Error Handlers - Medical Platform
Extracted routes and error handling to reduce main.py complexity
"""

import logging
from datetime import datetime
from flask import Flask, jsonify
from app_config import EnvironmentConfig
from core.performance.unified_memory_system import medical_memory_safe

logger = logging.getLogger(__name__)

def setup_error_handlers(app: Flask) -> None:
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
def setup_routes(app: Flask) -> None:
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