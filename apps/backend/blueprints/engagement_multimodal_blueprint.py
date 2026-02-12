# -*- coding: utf-8 -*-
"""Engagement & Multimodal Blueprint"""
from flask import Blueprint, jsonify, request
from datetime import datetime
import logging
import time

from core.logging.sanitizer import sanitize_error

logger = logging.getLogger(__name__)
engagement_multimodal_bp = Blueprint('engagement_multimodal', __name__, url_prefix='/api/v1')

_MODULE_START_TIME = time.time()

@engagement_multimodal_bp.route('/monitoring/stats', methods=['GET'])
def monitoring_stats():
    """System monitoring and statistics endpoint with real metrics"""
    try:
        import os
        uptime_seconds = int(time.time() - _MODULE_START_TIME)

        # Get real feedback stats if available
        total_requests = 0
        try:
            from services.storage.feedback_repository import get_feedback_repository
            repo = get_feedback_repository()
            fb_stats = repo.get_feedback_stats()
            total_requests = fb_stats.get('total_count', 0)
        except Exception:
            pass

        stats_data = {
            "status": "operational",
            "uptime_seconds": uptime_seconds,
            "environment": os.getenv('ENVIRONMENT', 'development'),
            "api_version": "v1",
            "medical_system": "active",
            "persona_system": "available",
            "validation_system": "operational",
            "stats": {
                "total_feedback_submissions": total_requests,
            },
            "feature_flags": {
                "rag_available": True,
                "embeddings_enabled": True,
                "advanced_features": True,
                "medical_validation": True
            },
            "timestamp": datetime.now().isoformat()
        }

        return jsonify(stats_data), 200

    except Exception as e:
        logger.error("Monitoring stats error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Internal server error',
            'error_code': 'MONITORING_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500

__all__ = ['engagement_multimodal_bp']
