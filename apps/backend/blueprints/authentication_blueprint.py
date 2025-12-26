# -*- coding: utf-8 -*-
"""
Authentication Blueprint - JWT-based authentication endpoints

Endpoints:
- POST /login - Email/password login
- POST /register - User registration
- POST /refresh - Token refresh
- POST /logout - Session revocation
- GET /me - Current user info
- PATCH /profile - Profile updates
- POST /google/initiate - Google OAuth start
- POST /google/callback - Google OAuth callback
- POST /verify - Token verification
"""
from flask import Blueprint, jsonify, request, g
from datetime import datetime
import logging
from functools import wraps

from services.auth.jwt_auth_manager import get_auth_manager
from core.logging.sanitizer import sanitize_log_input, sanitize_error

logger = logging.getLogger(__name__)

# Error message constants
ERR_REQUEST_BODY_REQUIRED = 'Request body required'
ERR_INVALID_CREDENTIALS = 'Invalid credentials'
ERR_MISSING_AUTH_HEADER = 'Missing or invalid authorization header'

authentication_bp = Blueprint('authentication', __name__, url_prefix='/api/v1/auth')


def require_auth(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({'error': ERR_MISSING_AUTH_HEADER}), 401

        token = auth_header[7:]  # Remove 'Bearer ' prefix
        auth_manager = get_auth_manager()
        payload = auth_manager.verify_token(token, 'access')

        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        g.current_user = payload
        return f(*args, **kwargs)

    return decorated_function


@authentication_bp.route('/verify', methods=['POST'])
def verify_token():
    """Verify if a token is valid"""
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        return jsonify({'valid': False, 'error': 'Missing token'}), 200

    token = auth_header[7:]
    auth_manager = get_auth_manager()
    payload = auth_manager.verify_token(token, 'access')

    return jsonify({
        'valid': payload is not None,
        'timestamp': datetime.now().isoformat(),
        'user_id': payload.get('user_id') if payload else None
    }), 200


@authentication_bp.route('/register', methods=['POST'])
def register():
    """Register new user with email/password"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': ERR_REQUEST_BODY_REQUIRED}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400

        if not name:
            name = email.split('@')[0]

        auth_manager = get_auth_manager()
        result = auth_manager.register_user(email, password, name)

        if not result:
            return jsonify({'error': 'Registration failed. Email may already be in use.'}), 400

        logger.info("User registered: %s", sanitize_log_input(email))

        return jsonify({
            'success': True,
            'user': {
                'id': result['user']['sub'],
                'email': result['user']['email'],
                'name': result['user']['name']
            },
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'session_id': result['session_id']
        }), 201

    except Exception as e:
        logger.error("Registration error: %s", sanitize_error(e))
        return jsonify({'error': 'Registration failed'}), 500


@authentication_bp.route('/login', methods=['POST'])
def login():
    """Login with email/password"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': ERR_REQUEST_BODY_REQUIRED}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        auth_manager = get_auth_manager()
        result = auth_manager.login_user(email, password)

        if not result:
            return jsonify({'error': ERR_INVALID_CREDENTIALS}), 401

        logger.info("User logged in: %s", sanitize_log_input(email))

        return jsonify({
            'success': True,
            'user': {
                'id': result['user']['sub'],
                'email': result['user']['email'],
                'name': result['user']['name']
            },
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'session_id': result['session_id']
        }), 200

    except Exception as e:
        logger.error("Login error: %s", sanitize_error(e))
        return jsonify({'error': 'Login failed'}), 500


@authentication_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': ERR_REQUEST_BODY_REQUIRED}), 400

        refresh_token = data.get('refresh_token', '')

        if not refresh_token:
            return jsonify({'error': 'Refresh token required'}), 400

        auth_manager = get_auth_manager()
        new_access_token = auth_manager.refresh_access_token(refresh_token)

        if not new_access_token:
            return jsonify({'error': 'Invalid or expired refresh token'}), 401

        return jsonify({
            'success': True,
            'access_token': new_access_token
        }), 200

    except Exception as e:
        logger.error("Token refresh error: %s", sanitize_error(e))
        return jsonify({'error': 'Token refresh failed'}), 500


@authentication_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout and revoke session"""
    try:
        session_id = g.current_user.get('session_id')

        if not session_id:
            return jsonify({'error': 'No active session'}), 400

        auth_manager = get_auth_manager()
        success = auth_manager.revoke_session(session_id)

        if success:
            logger.info("User logged out: %s", sanitize_log_input(g.current_user.get('email', 'unknown')))
            return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

        return jsonify({'error': 'Logout failed'}), 500

    except Exception as e:
        logger.error("Logout error: %s", sanitize_error(e))
        return jsonify({'error': 'Logout failed'}), 500


@authentication_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user profile"""
    try:
        user_id = g.current_user.get('user_id')

        auth_manager = get_auth_manager()
        profile = auth_manager.get_user_profile(user_id)

        if not profile:
            return jsonify({'error': 'User not found'}), 404

        # Remove sensitive data
        safe_profile = {
            'id': profile.get('id'),
            'email': profile.get('email'),
            'name': profile.get('name'),
            'created_at': profile.get('created_at')
        }

        # Add non-sensitive profile data
        profile_data = profile.get('profile_data', {})
        if profile_data:
            safe_profile['picture'] = profile_data.get('picture')
            safe_profile['locale'] = profile_data.get('locale')
            safe_profile['auth_provider'] = profile_data.get('auth_provider')

        return jsonify(safe_profile), 200

    except Exception as e:
        logger.error("Get profile error: %s", sanitize_error(e))
        return jsonify({'error': 'Failed to get profile'}), 500


@authentication_bp.route('/profile', methods=['PATCH'])
@require_auth
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': ERR_REQUEST_BODY_REQUIRED}), 400

        user_id = g.current_user.get('user_id')

        # Only allow updating specific fields
        allowed_fields = {'name', 'picture', 'locale'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400

        auth_manager = get_auth_manager()
        success = auth_manager.update_user_profile(user_id, update_data)

        if success:
            logger.info("Profile updated for user: %s", sanitize_log_input(g.current_user.get('email', 'unknown')))
            return jsonify({'success': True, 'message': 'Profile updated'}), 200

        return jsonify({'error': 'Update failed'}), 500

    except Exception as e:
        logger.error("Update profile error: %s", sanitize_error(e))
        return jsonify({'error': 'Failed to update profile'}), 500


@authentication_bp.route('/google/initiate', methods=['POST'])
def google_initiate():
    """Initiate Google OAuth flow"""
    try:
        data = request.get_json() or {}
        state = data.get('state')

        auth_manager = get_auth_manager()

        try:
            auth_url = auth_manager.get_google_auth_url(state)
            return jsonify({
                'success': True,
                'auth_url': auth_url
            }), 200
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    except Exception as e:
        logger.error("Google OAuth initiate error: %s", sanitize_error(e))
        return jsonify({'error': 'Failed to initiate Google OAuth'}), 500


@authentication_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': ERR_REQUEST_BODY_REQUIRED}), 400

        code = data.get('code', '')
        state = data.get('state')

        if not code:
            return jsonify({'error': 'Authorization code required'}), 400

        auth_manager = get_auth_manager()

        try:
            result = auth_manager.handle_google_callback(code, state)

            if not result:
                return jsonify({'error': 'Google authentication failed'}), 401

            logger.info("Google login successful: %s", sanitize_log_input(result['user'].get('email', 'unknown')))

            return jsonify({
                'success': True,
                'user': {
                    'id': result['user'].get('sub'),
                    'email': result['user'].get('email'),
                    'name': result['user'].get('name'),
                    'picture': result['user'].get('picture')
                },
                'access_token': result['access_token'],
                'refresh_token': result['refresh_token'],
                'session_id': result['session_id']
            }), 200

        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    except Exception as e:
        logger.error("Google OAuth callback error: %s", sanitize_error(e))
        return jsonify({'error': 'Google authentication failed'}), 500


__all__ = ['authentication_bp']
