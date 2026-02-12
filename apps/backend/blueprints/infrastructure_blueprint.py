# -*- coding: utf-8 -*-
"""Infrastructure Blueprint - Real system status checks"""
from flask import Blueprint, jsonify
from datetime import datetime
import logging
import time
import os

from core.logging.sanitizer import sanitize_error

logger = logging.getLogger(__name__)

infrastructure_bp = Blueprint('infrastructure', __name__, url_prefix='/api/v1')

_MODULE_START_TIME = time.time()


@infrastructure_bp.route('/cache/status', methods=['GET'])
def cache_status():
    """Real cache status check"""
    try:
        from core.dependencies import get_cache
        cache = get_cache()

        if not cache:
            return jsonify({
                'status': 'unavailable',
                'timestamp': datetime.now().isoformat()
            }), 503

        cache_info = {
            'status': 'active',
            'type': type(cache).__name__,
            'timestamp': datetime.now().isoformat()
        }

        if hasattr(cache, 'get_stats'):
            stats = cache.get_stats()
            cache_info['hit_rate'] = stats.get('hit_rate', 0)
            cache_info['size'] = stats.get('size', 0)
            cache_info['max_size'] = stats.get('max_size', 0)

        return jsonify(cache_info), 200

    except Exception as e:
        logger.error("Cache status error: %s", sanitize_error(e))
        return jsonify({
            'status': 'error',
            'error': 'Failed to check cache status',
            'timestamp': datetime.now().isoformat()
        }), 500


@infrastructure_bp.route('/health/detailed', methods=['GET'])
def detailed_health():
    """Detailed health check with real component status"""
    try:
        from core.dependencies import get_cache, get_rag

        components = {}

        cache = get_cache()
        components['cache'] = 'available' if cache else 'unavailable'

        try:
            rag = get_rag()
            components['rag'] = 'available' if rag else 'unavailable'
        except Exception:
            components['rag'] = 'unavailable'

        email_configured = bool(os.getenv('SMTP_USERNAME') or os.getenv('SENDGRID_API_KEY'))
        components['email'] = 'configured' if email_configured else 'not_configured'

        try:
            from services.storage.sqlite_manager import get_sqlite_manager
            db = get_sqlite_manager()
            components['database'] = 'available' if db else 'unavailable'
        except ImportError:
            components['database'] = 'unavailable'

        uptime_seconds = int(time.time() - _MODULE_START_TIME)

        return jsonify({
            'status': 'healthy',
            'version': '3.2.2-rag-threshold-fix',
            'uptime_seconds': uptime_seconds,
            'timestamp': datetime.now().isoformat(),
            'components': components
        }), 200

    except Exception as e:
        logger.error("Detailed health error: %s", sanitize_error(e))
        return jsonify({
            'status': 'error',
            'error': 'Health check failed',
            'timestamp': datetime.now().isoformat()
        }), 500


__all__ = ['infrastructure_bp']
