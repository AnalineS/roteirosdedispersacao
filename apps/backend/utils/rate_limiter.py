"""
Rate limiting utilities for blueprints
Fallback implementation for missing rate limiter module
"""

from functools import wraps
from typing import Dict, Any
from flask import request
import time
import logging
from core.logging.sanitizer import sanitize_log_input, sanitize_ip

logger = logging.getLogger(__name__)

# Simple in-memory rate limiting (not suitable for production)
_rate_limit_store: Dict[str, Dict[str, Any]] = {}

def rate_limit(max_requests: int = 100, window_seconds: int = 3600):
    """
    Rate limiting decorator
    Fallback implementation using in-memory storage
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client identifier
            client_ip = request.remote_addr or 'unknown'
            endpoint = request.endpoint or 'unknown'
            key = f"{client_ip}:{endpoint}"

            current_time = time.time()

            # Clean old entries
            if key in _rate_limit_store:
                requests = _rate_limit_store[key]['requests']
                _rate_limit_store[key]['requests'] = [
                    req_time for req_time in requests
                    if current_time - req_time < window_seconds
                ]

            # Initialize if not exists
            if key not in _rate_limit_store:
                _rate_limit_store[key] = {
                    'requests': [],
                    'first_request': current_time
                }

            # Check rate limit
            requests = _rate_limit_store[key]['requests']
            if len(requests) >= max_requests:
                logger.warning("Rate limit exceeded for %s on %s", sanitize_ip(client_ip), sanitize_log_input(endpoint))
                from flask import jsonify
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'max_requests': max_requests,
                    'window_seconds': window_seconds
                }), 429

            # Add current request
            _rate_limit_store[key]['requests'].append(current_time)

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_rate_limit_status(client_ip: str, endpoint: str) -> Dict[str, Any]:
    """
    Get current rate limit status for a client
    """
    key = f"{client_ip}:{endpoint}"

    if key not in _rate_limit_store:
        return {
            'requests_made': 0,
            'requests_remaining': 100,  # Default limit
            'reset_time': time.time() + 3600
        }

    current_time = time.time()
    requests = _rate_limit_store[key]['requests']

    # Clean old requests
    valid_requests = [
        req_time for req_time in requests
        if current_time - req_time < 3600  # Default window
    ]

    return {
        'requests_made': len(valid_requests),
        'requests_remaining': max(0, 100 - len(valid_requests)),
        'reset_time': current_time + 3600
    }

def clear_rate_limit_for_client(client_ip: str, endpoint: str = None):
    """
    Clear rate limit for a specific client
    """
    if endpoint:
        key = f"{client_ip}:{endpoint}"
        if key in _rate_limit_store:
            del _rate_limit_store[key]
    else:
        # Clear all entries for this IP
        keys_to_remove = [key for key in _rate_limit_store.keys() if key.startswith(f"{client_ip}:")]
        for key in keys_to_remove:
            del _rate_limit_store[key]