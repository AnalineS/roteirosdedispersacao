# -*- coding: utf-8 -*-
"""Communication Blueprint"""
from flask import Blueprint, jsonify
from datetime import datetime

communication_bp = Blueprint('communication', __name__, url_prefix='/api/v1')

@communication_bp.route('/notifications', methods=['GET'])
def get_notifications():
    return jsonify({'count': 0, 'timestamp': datetime.now().isoformat()}), 200

__all__ = ['communication_bp']
