# -*- coding: utf-8 -*-
"""Authentication Blueprint"""
from flask import Blueprint, jsonify
from datetime import datetime

authentication_bp = Blueprint('authentication', __name__, url_prefix='/api/v1/auth')

@authentication_bp.route('/verify', methods=['POST'])
def verify_token():
    return jsonify({'valid': True, 'timestamp': datetime.now().isoformat()}), 200

__all__ = ['authentication_bp']
