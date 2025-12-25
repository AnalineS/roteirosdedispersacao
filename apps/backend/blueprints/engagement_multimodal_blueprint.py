# -*- coding: utf-8 -*-
"""Engagement & Multimodal Blueprint"""
from flask import Blueprint, jsonify, request
from markupsafe import escape
from datetime import datetime
import logging

from core.logging.sanitizer import sanitize_error

logger = logging.getLogger(__name__)
engagement_multimodal_bp = Blueprint('engagement_multimodal', __name__, url_prefix='/api/v1')

@engagement_multimodal_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit user feedback with validation"""
    try:
        data = request.get_json() or {}

        # Validate required fields
        rating = data.get('rating')
        if rating is None:
            return jsonify({
                'error': 'Rating is required',
                'error_code': 'MISSING_RATING',
                'timestamp': datetime.now().isoformat()
            }), 400

        # Validate rating range
        if not isinstance(rating, (int, float)) or not (1 <= rating <= 5):
            return jsonify({
                'error': 'Rating must be a number between 1 and 5',
                'error_code': 'INVALID_RATING',
                'timestamp': datetime.now().isoformat()
            }), 422

        # Additional required fields validation - accept both field names for compatibility
        feedback_text = data.get('feedback', '') or data.get('feedback_text', '')
        message_id = data.get('message_id', '')

        if not feedback_text and not message_id:
            return jsonify({
                'error': 'Either feedback text or message_id is required',
                'error_code': 'MISSING_REQUIRED_FIELDS',
                'timestamp': datetime.now().isoformat()
            }), 400

        user_id = data.get('user_id', '')

        # Sanitize user inputs to prevent XSS and injection attacks
        # Flask best practice: use markupsafe.escape() for all user-provided data
        feedback_sanitized = str(escape(feedback_text)) if feedback_text else ''
        message_id_sanitized = str(escape(message_id)) if message_id else ''
        user_id_sanitized = str(escape(user_id)) if user_id else ''

        # Process feedback (in real system would save to database)
        # Security fix: Never echo user input back in response to prevent XSS/SQL injection
        response_data = {
            'status': 'received',
            'rating': rating,
            'feedback_length': len(feedback_sanitized),
            'timestamp': datetime.now().isoformat(),
            'message': 'Feedback received successfully'
        }

        # Security: Log sanitized data to prevent log injection attacks
        logger.info("Feedback received: rating=%s, feedback_length=%s, message_id=%s, user_id=%s",
                   rating, len(feedback_sanitized),
                   message_id_sanitized[:20] if message_id_sanitized else 'none',
                   user_id_sanitized[:20] if user_id_sanitized else 'none')

        return jsonify(response_data), 200

    except Exception as e:
        logger.error("Feedback submission error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Internal server error',
            'error_code': 'FEEDBACK_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500

@engagement_multimodal_bp.route('/monitoring/stats', methods=['GET'])
def monitoring_stats():
    """System monitoring and statistics endpoint"""
    try:
        # Calculate uptime
        import time
        uptime_seconds = int(time.time() - 1727211000)  # Approximate startup time

        stats_data = {
            "status": "operational",
            "uptime_seconds": uptime_seconds,
            "mode": "testing",
            "environment": "homologacao",
            "api_version": "v1",
            "medical_system": "active",
            "persona_system": "available",
            "validation_system": "operational",
            "stats": {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "average_response_time": 0.25
            },
            "feature_flags": {
                "rag_available": True,
                "embeddings_enabled": True,
                "advanced_features": True,
                "medical_validation": True
            },
            "timestamp": datetime.now().isoformat()
        }

        logger.info("Monitoring stats requested")
        return jsonify(stats_data), 200

    except Exception as e:
        logger.error("Monitoring stats error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Internal server error',
            'error_code': 'MONITORING_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500

__all__ = ['engagement_multimodal_bp']
