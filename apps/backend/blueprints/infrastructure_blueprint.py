# -*- coding: utf-8 -*-
"""Infrastructure Blueprint"""
from flask import Blueprint, jsonify
from datetime import datetime

infrastructure_bp = Blueprint('infrastructure', __name__, url_prefix='/api/v1')

@infrastructure_bp.route('/cache/status', methods=['GET'])
def cache_status():
    return jsonify({'status': 'active', 'timestamp': datetime.now().isoformat()}), 200

__all__ = ['infrastructure_bp']
