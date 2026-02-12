# -*- coding: utf-8 -*-
"""Analytics & Observability Blueprint"""
from flask import Blueprint, jsonify, request, g
from datetime import datetime, timedelta
from functools import wraps
import logging

from core.logging.sanitizer import sanitize_error

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
        logger.error("Analytics tracking error: %s", sanitize_error(e))
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
        logger.error("Session start error: %s", sanitize_error(e))
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
        logger.error("Session end error: %s", sanitize_error(e))
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
        logger.error("Realtime metrics error: %s", sanitize_error(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@analytics_observability_bp.route('/analytics/admin/stats', methods=['GET'])
def get_admin_stats():
    """Real admin dashboard stats from SQLite"""
    import os
    import sqlite3
    from pathlib import Path

    # Verify admin role via JWT
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    token = auth_header.split(' ', 1)[1]
    try:
        from services.auth.jwt_auth_manager import get_auth_manager
        auth_mgr = get_auth_manager()
        payload = auth_mgr.verify_token(token)
        if not payload:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        admin_emails = [e.strip().lower() for e in os.getenv('ADMIN_EMAILS', '').split(',') if e.strip()]
        user_email = payload.get('email', '').lower()
        if admin_emails and user_email not in admin_emails:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
    except Exception as e:
        logger.error("Admin auth error: %s", sanitize_error(e))
        return jsonify({'success': False, 'error': 'Authentication failed'}), 401

    try:
        backend_root = Path(__file__).parent.parent
        db_path = backend_root / 'data' / 'auth.db'

        stats = {
            'totalUsers': 0,
            'activeToday': 0,
            'totalConversations': 0,
            'avgResponseTime': 0,
            'systemHealth': 'operational',
        }

        if db_path.exists():
            conn = sqlite3.connect(str(db_path))
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM users")
                stats['totalUsers'] = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                pass
            finally:
                conn.close()

        # Check feedback db for conversation count
        feedback_db = backend_root / 'data' / 'feedback.db'
        if feedback_db.exists():
            conn = sqlite3.connect(str(feedback_db))
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM feedback")
                stats['totalConversations'] = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                pass
            finally:
                conn.close()

        # System health from real health check
        try:
            from core.dependencies import get_cache
            cache = get_cache()
            if not cache:
                stats['systemHealth'] = 'degraded'
        except Exception:
            stats['systemHealth'] = 'degraded'

        return jsonify({'success': True, **stats})

    except Exception as e:
        logger.error("Admin stats error: %s", sanitize_error(e))
        return jsonify({'success': False, 'error': 'Failed to load admin stats'}), 500


@analytics_observability_bp.route('/analytics/sessions', methods=['POST'])
def get_session_metrics():
    """Get aggregated session metrics for date range"""
    if not analytics_available:
        return jsonify({
            'success': False,
            'error': 'Analytics service not available'
        }), 503

    try:
        data = request.get_json()
        start_date = data.get('startDate')
        end_date = data.get('endDate')

        # Default to last 7 days if not provided
        if not start_date:
            start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        if not end_date:
            end_date = datetime.now(timezone.utc).isoformat()

        metrics = analytics_service.get_aggregated_metrics(start_date, end_date)

        # Format for frontend compatibility
        formatted_metrics = {
            'sessions': metrics.get('sessions', 0),
            'avgDuration': metrics.get('avg_response_time', 0) * 1000,  # Convert to ms
            'bounceRate': metrics.get('bounce_rate', 0),  # Real bounce rate from analytics service
            'conversionRate': metrics.get('resolution_rate', 0) / 100,
            'topQuestions': metrics.get('top_questions', []),
            'personaUsage': metrics.get('persona_usage', {}),
            'peakHours': metrics.get('peak_hours', []),
            'resolutionRate': metrics.get('resolution_rate', 0),
            'fallbackRate': metrics.get('fallback_rate', 0) * 100,
            'topPages': metrics.get('top_pages', [])
        }

        return jsonify({'success': True, 'data': formatted_metrics})

    except Exception as e:
        logger.error("Session metrics error: %s", sanitize_error(e))
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
        logger.error("Analytics health check error: %s", sanitize_error(e))
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

def _verify_admin_token() -> tuple:
    """Verify admin JWT token. Returns (payload, None) on success or (None, error_response) on failure."""
    import os
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, (jsonify({'success': False, 'error': 'Authentication required'}), 401)

    token = auth_header.split(' ', 1)[1]
    try:
        from services.auth.jwt_auth_manager import get_auth_manager
        auth_mgr = get_auth_manager()
        payload = auth_mgr.verify_token(token)
        if not payload:
            return None, (jsonify({'success': False, 'error': 'Invalid token'}), 401)

        admin_emails = [e.strip().lower() for e in os.getenv('ADMIN_EMAILS', '').split(',') if e.strip()]
        user_email = payload.get('email', '').lower()
        if admin_emails and user_email not in admin_emails:
            return None, (jsonify({'success': False, 'error': 'Admin access required'}), 403)

        return payload, None
    except Exception as e:
        logger.error("Admin auth error: %s", sanitize_error(e))
        return None, (jsonify({'success': False, 'error': 'Authentication failed'}), 401)


def _query_sqlite(db_path, query: str, row_factory: bool = False) -> list:
    """Run a read-only SQLite query, returning list of Row or tuple."""
    import sqlite3
    if not db_path.exists():
        return []
    conn = sqlite3.connect(str(db_path))
    if row_factory:
        conn.row_factory = sqlite3.Row
    try:
        return conn.cursor().execute(query).fetchall()
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()


def _extract_display_name(email_str: str, profile_data_str: str) -> str:
    """Extract display name from profile JSON or email."""
    import json
    if profile_data_str:
        try:
            profile = json.loads(profile_data_str)
            name = profile.get('name')
            if name:
                return str(name)
        except (ValueError, TypeError):
            pass
    return email_str.split('@')[0] if email_str else 'Usuario'


@analytics_observability_bp.route('/analytics/admin/recent-activity', methods=['GET'])
def get_admin_recent_activity():
    """Real recent activity from analytics_events and audit_logs tables."""
    _, error_resp = _verify_admin_token()
    if error_resp is not None:
        return error_resp

    try:
        from pathlib import Path
        backend_root = Path(__file__).parent.parent
        db_path = backend_root / 'data' / 'database' / 'roteiros_dispensacao.db'

        rows = _query_sqlite(db_path, """
            SELECT ae.event_type, ae.user_id, ae.timestamp,
                   u.email, u.profile_data
            FROM analytics_events ae
            LEFT JOIN users u ON ae.user_id = u.id
            ORDER BY ae.timestamp DESC LIMIT 10
        """, row_factory=True)

        activities = [{
            'userId': row['user_id'] or '',
            'userName': _extract_display_name(row['email'] or '', row['profile_data'] or ''),
            'action': _event_type_to_action(row['event_type']),
            'timestamp': row['timestamp'] or '',
        } for row in rows]

        # Fallback to audit_logs if no analytics_events
        if not activities:
            audit_rows = _query_sqlite(db_path, """
                SELECT user_id, action, resource, timestamp
                FROM audit_logs ORDER BY timestamp DESC LIMIT 10
            """, row_factory=True)
            activities = [{
                'userId': row['user_id'] or '',
                'userName': 'Usuario',
                'action': f"{row['action']} - {row['resource']}",
                'timestamp': row['timestamp'] or '',
            } for row in audit_rows]

        return jsonify({'success': True, 'data': activities})

    except Exception as e:
        logger.error("Admin recent activity error: %s", sanitize_error(e))
        return jsonify({'success': False, 'error': 'Failed to load recent activity'}), 500


def _event_type_to_action(event_type: str) -> str:
    """Map analytics event_type to human-readable action in Portuguese."""
    mapping = {
        'chat_message': 'Enviou mensagem no chat',
        'chat_response': 'Recebeu resposta do assistente',
        'page_view': 'Acessou pagina',
        'login': 'Realizou login',
        'register': 'Criou nova conta',
        'quiz_completed': 'Completou quiz',
        'module_completed': 'Completou modulo',
        'feedback_submitted': 'Enviou feedback',
        'case_completed': 'Completou caso clinico',
        'file_download': 'Baixou material',
    }
    return mapping.get(event_type, event_type.replace('_', ' ').capitalize())


@analytics_observability_bp.route('/analytics/admin/realtime-users', methods=['GET'])
def get_admin_realtime_users():
    """Count users with active sessions in the last 5 minutes."""
    _, error_resp = _verify_admin_token()
    if error_resp is not None:
        return error_resp

    try:
        from pathlib import Path
        backend_root = Path(__file__).parent.parent

        active_sessions_query = """
            SELECT COUNT(DISTINCT user_id) as cnt
            FROM sessions
            WHERE is_active = 1 AND created_at > datetime('now', '-5 minutes')
        """

        db_paths = [
            backend_root / 'data' / 'database' / 'roteiros_dispensacao.db',
            backend_root / 'data' / 'auth.db',
        ]

        count = 0
        for db_path in db_paths:
            rows = _query_sqlite(db_path, active_sessions_query)
            if rows and rows[0][0]:
                count = rows[0][0]
            if count > 0:
                break

        return jsonify({'success': True, 'data': {'count': count}})

    except Exception as e:
        logger.error("Admin realtime users error: %s", sanitize_error(e))
        return jsonify({'success': False, 'error': 'Failed to count realtime users'}), 500


__all__ = ['analytics_observability_bp']
