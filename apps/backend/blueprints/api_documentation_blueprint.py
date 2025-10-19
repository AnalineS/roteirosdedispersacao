# -*- coding: utf-8 -*-
"""API Documentation Blueprint"""
from flask import Blueprint, jsonify
from datetime import datetime

api_documentation_bp = Blueprint('api_documentation', __name__, url_prefix='/api/v1')

@api_documentation_bp.route('/docs', methods=['GET'])
def get_docs():
    return jsonify({'status': 'available', 'timestamp': datetime.now().isoformat()}), 200

__all__ = ['api_documentation_bp']
