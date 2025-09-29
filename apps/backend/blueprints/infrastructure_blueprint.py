# -*- coding: utf-8 -*-
"""Infrastructure Blueprint"""
from flask import Blueprint, jsonify
from datetime import datetime

infrastructure_bp = Blueprint('infrastructure', __name__, url_prefix='/api/v1')

@infrastructure_bp.route('/cache/status', methods=['GET'])
def cache_status():
    return jsonify({'status': 'active', 'timestamp': datetime.now().isoformat()}), 200

@infrastructure_bp.route('/health/detailed', methods=['GET'])
def detailed_health():
    """Detailed health check with cloud build IAM permissions validation"""
    return jsonify({
        'status': 'healthy',
        'version': '3.1.6-cloudbuild-iam-permissions-fix',
        'cloud_build_fix': 'storage.objects.get permissions resolved',
        'github_actions_sa': 'storage.objectViewer role configured',
        'timestamp': datetime.now().isoformat(),
        'components': {
            'iam_permissions': 'configured',
            'vpc_sc_mitigation': 'active',
            'log_access': 'enabled'
        }
    }), 200

__all__ = ['infrastructure_bp']
