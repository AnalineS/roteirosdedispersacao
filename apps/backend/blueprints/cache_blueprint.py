# -*- coding: utf-8 -*-
"""
DEPRECATED: This blueprint has been replaced by UnifiedCacheManager

The old Firestore-based cache system has been completely replaced with:
- Primary: cachetools (in-memory OrderedDict)
- Secondary: Google Cloud Storage (persistence + overflow)
- Fallback: SQLite (local database)

Current implementation: services/cache/unified_cache_manager.py

This file is kept for backward compatibility only and returns HTTP 410 Gone.
All cache operations should use UnifiedCacheManager directly.
"""

from flask import Blueprint, jsonify

# Create blueprint for backward compatibility
cache_blueprint = Blueprint('cache', __name__, url_prefix='/api/cache')

@cache_blueprint.route('/get', methods=['POST'])
@cache_blueprint.route('/set', methods=['POST'])
@cache_blueprint.route('/delete', methods=['POST'])
@cache_blueprint.route('/clear', methods=['POST'])
@cache_blueprint.route('/stats', methods=['GET'])
@cache_blueprint.route('/health', methods=['GET'])
@cache_blueprint.route('/cleanup', methods=['POST'])
def deprecated_endpoint():
    """All cache blueprint endpoints are deprecated"""
    return jsonify({
        'success': False,
        'error': 'This endpoint has been deprecated',
        'message': 'Cache system migrated from Firestore to UnifiedCacheManager (cachetools + Google Cloud Storage + SQLite)',
        'migration': 'Use services/cache/unified_cache_manager.py directly',
        'alternatives': {
            'get': 'cache_get(key)',
            'set': 'cache_set(key, value, ttl)',
            'stats': 'cache_stats()',
            'clear': 'get_unified_cache().clear()'
        }
    }), 410  # 410 Gone - Resource permanently removed
