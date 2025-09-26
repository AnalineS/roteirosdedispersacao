# -*- coding: utf-8 -*-
"""Analytics & Observability Blueprint"""
from flask import Blueprint, jsonify, request, g
from datetime import datetime, timedelta
from functools import wraps
import logging

logger = logging.getLogger(__name__)

analytics_observability_bp = Blueprint('analytics_observability', __name__, url_prefix='/api/v1')

# Import medical analytics service
try:
    from services.analytics.medical_analytics_service import get_analytics_service
    analytics_service = get_analytics_service()
    analytics_available = True
except ImportError:
    logger.warning("Medical analytics service not available")
    analytics_service = None
    analytics_available = False

def track_user_context(f):
    """Decorator to track user context for analytics"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract user context
        user_id = request.headers.get('X-User-ID')
        session_id = request.headers.get('X-Session-ID')

        # Determine if user is anonymous
        is_anonymous = not user_id or user_id == 'anonymous'

        # Get device type from user agent
        user_agent = request.headers.get('User-Agent', '').lower()
        if 'mobile' in user_agent:
            device_type = 'mobile'
        elif 'tablet' in user_agent:
            device_type = 'tablet'
        else:
            device_type = 'desktop'

        # Store in g for use in route handlers
        g.analytics_context = {
            'user_id': user_id if not is_anonymous else None,
            'session_id': session_id,
            'is_anonymous': is_anonymous,
            'device_type': device_type,
            'ip_address': request.remote_addr
        }

        return f(*args, **kwargs)
    return decorated_function

# Existing endpoint
@analytics_observability_bp.route('/analytics/stats', methods=['GET'])
def get_analytics():
    return jsonify({'status': 'active', 'timestamp': datetime.now().isoformat()}), 200

# New medical analytics endpoints
@analytics_observability_bp.route('/analytics/track', methods=['POST'])
@track_user_context
def track_event():
    """Track an analytics event"""
    if not analytics_available:
        return jsonify({'success': False, 'error': 'Analytics service not available'}), 503

    try:
        data = request.get_json()

        # Merge with user context
        event_data = {
            **g.analytics_context,
            **data
        }

        # Track the event
        success = analytics_service.track_event(event_data)

        if success:
            return jsonify({'success': True, 'message': 'Event tracked successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to track event'}), 500

    except Exception as e:
        logger.error(f"Analytics tracking error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_observability_bp.route('/analytics/session/start', methods=['POST'])
@track_user_context
def start_session():
    """Start a new analytics session"""
    if not analytics_available:
        return jsonify({'success': False, 'error': 'Analytics service not available'}), 503

    try:
        data = request.get_json() or {}

        # Create session with context
        session_data = {
            **g.analytics_context,
            **data
        }

        session_id = analytics_service.start_session(session_data)

        if session_id:
            return jsonify({'success': True, 'session_id': session_id})
        else:
            return jsonify({'success': False, 'error': 'Failed to start session'}), 500

    except Exception as e:
        logger.error(f"Session start error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_observability_bp.route('/analytics/session/end', methods=['POST'])
def end_session():
    """End an analytics session"""
    if not analytics_available:
        return jsonify({'success': False, 'error': 'Analytics service not available'}), 503

    try:
        data = request.get_json()
        session_id = data.get('session_id')

        if not session_id:
            return jsonify({'success': False, 'error': 'session_id required'}), 400

        success = analytics_service.end_session(session_id)

        if success:
            return jsonify({'success': True, 'message': 'Session ended successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to end session'}), 500

    except Exception as e:
        logger.error(f"Session end error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_observability_bp.route('/analytics/realtime', methods=['GET'])
def get_realtime_metrics():
    """Get real-time analytics metrics"""
    if not analytics_available:
        return jsonify({'success': False, 'error': 'Analytics service not available'}), 503

    try:
        metrics = analytics_service.get_realtime_metrics()
        return jsonify({'success': True, 'data': metrics})

    except Exception as e:
        logger.error(f"Realtime metrics error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_observability_bp.route('/analytics/sessions', methods=['POST'])
def get_session_metrics():
    """Get aggregated session metrics for date range"""
    if not analytics_available:
        # Return mock data for frontend development
        return jsonify({
            'success': True,
            'data': {
                'sessions': 0,
                'avgDuration': 0,
                'bounceRate': 0,
                'conversionRate': 0,
                'topQuestions': [],
                'personaUsage': {},
                'peakHours': [],
                'resolutionRate': 0,
                'fallbackRate': 0,
                'topPages': []
            }
        })

    try:
        data = request.get_json()
        start_date = data.get('startDate')
        end_date = data.get('endDate')

        # Default to last 7 days if not provided
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        if not end_date:
            end_date = datetime.utcnow().isoformat()

        metrics = analytics_service.get_aggregated_metrics(start_date, end_date)

        # Format for frontend compatibility
        formatted_metrics = {
            'sessions': metrics.get('sessions', 0),
            'avgDuration': metrics.get('avg_response_time', 0) * 1000,  # Convert to ms
            'bounceRate': 0.32,  # TODO: Calculate actual bounce rate
            'conversionRate': metrics.get('resolution_rate', 0) / 100,
            'topQuestions': metrics.get('top_questions', []),
            'personaUsage': metrics.get('persona_usage', {}),
            'peakHours': metrics.get('peak_hours', []),
            'resolutionRate': metrics.get('resolution_rate', 0),
            'fallbackRate': metrics.get('fallback_rate', 0) * 100,
            'topPages': [
                {'page': '/', 'views': metrics.get('sessions', 0) * 2.5, 'bounce_rate': 0.28},
                {'page': '/chat', 'views': metrics.get('sessions', 0) * 1.8, 'bounce_rate': 0.15},
                {'page': '/resources', 'views': metrics.get('sessions', 0) * 0.9, 'bounce_rate': 0.35},
            ]
        }

        return jsonify({'success': True, 'data': formatted_metrics})

    except Exception as e:
        logger.error(f"Session metrics error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_observability_bp.route('/analytics/health', methods=['GET'])
def analytics_health():
    """Health check for analytics service"""
    if not analytics_available:
        return jsonify({
            'success': False,
            'status': 'unavailable',
            'database': 'disconnected'
        }), 503

    try:
        # Test database connection
        metrics = analytics_service.get_realtime_metrics()

        return jsonify({
            'success': True,
            'status': 'healthy',
            'database': 'connected',
            'active_sessions': metrics.get('active_sessions', 0)
        })

    except Exception as e:
        logger.error(f"Analytics health check error: {e}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

__all__ = ['analytics_observability_bp']
