# -*- coding: utf-8 -*-
"""Communication Blueprint - Notifications management with SQLite persistence"""
from flask import Blueprint, jsonify, request
from datetime import datetime
import logging
import sqlite3
import uuid
from pathlib import Path

from core.logging.sanitizer import sanitize_error

logger = logging.getLogger(__name__)

communication_bp = Blueprint('communication', __name__, url_prefix='/api/v1')

_BACKEND_ROOT = Path(__file__).parent.parent
_DB_DIR = _BACKEND_ROOT / 'data'


def _get_db_path() -> str:
    _DB_DIR.mkdir(exist_ok=True)
    return str(_DB_DIR / 'notifications.db')


def _ensure_table():
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    try:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    finally:
        conn.close()


try:
    _ensure_table()
except Exception as e:
    logger.warning("Failed to create notifications table: %s", sanitize_error(e))


@communication_bp.route('/notifications', methods=['GET'])
def get_notifications():
    """Get notifications for user"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        limit = min(int(request.args.get('limit', 20)), 100)

        db_path = _get_db_path()
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute(
                'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL '
                'ORDER BY created_at DESC LIMIT ?',
                (user_id, limit)
            ).fetchall()

            notifications = [dict(row) for row in rows]
            unread_count = conn.execute(
                'SELECT COUNT(*) FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND read = 0',
                (user_id,)
            ).fetchone()[0]

            return jsonify({
                'notifications': notifications,
                'count': len(notifications),
                'unread_count': unread_count,
                'timestamp': datetime.now().isoformat()
            }), 200
        finally:
            conn.close()

    except Exception as e:
        logger.error("Get notifications error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Failed to get notifications',
            'count': 0,
            'timestamp': datetime.now().isoformat()
        }), 500


@communication_bp.route('/notifications/read', methods=['POST'])
def mark_notification_read():
    """Mark notification as read"""
    try:
        data = request.get_json() or {}
        notification_id = data.get('notification_id')

        if not notification_id:
            return jsonify({'error': 'notification_id is required'}), 400

        db_path = _get_db_path()
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                'UPDATE notifications SET read = 1 WHERE id = ?',
                (notification_id,)
            )
            conn.commit()
            return jsonify({'success': True}), 200
        finally:
            conn.close()

    except Exception as e:
        logger.error("Mark notification read error: %s", sanitize_error(e))
        return jsonify({'error': 'Failed to mark notification as read'}), 500


@communication_bp.route('/notifications/count', methods=['GET'])
def get_notification_count():
    """Get unread notification count"""
    try:
        user_id = request.args.get('user_id', 'anonymous')

        db_path = _get_db_path()
        conn = sqlite3.connect(db_path)
        try:
            count = conn.execute(
                'SELECT COUNT(*) FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND read = 0',
                (user_id,)
            ).fetchone()[0]

            return jsonify({
                'count': count,
                'timestamp': datetime.now().isoformat()
            }), 200
        finally:
            conn.close()

    except Exception as e:
        logger.error("Get notification count error: %s", sanitize_error(e))
        return jsonify({'count': 0, 'timestamp': datetime.now().isoformat()}), 500


def create_notification(user_id: str, notification_type: str, title: str, message: str):
    """Create a new notification (callable from other modules)."""
    try:
        notification_id = str(uuid.uuid4())
        db_path = _get_db_path()
        conn = sqlite3.connect(db_path)
        try:
            conn.execute(
                'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
                (notification_id, user_id, notification_type, title, message)
            )
            conn.commit()
            return notification_id
        finally:
            conn.close()
    except Exception as e:
        logger.error("Create notification error: %s", sanitize_error(e))
        return None


__all__ = ['communication_bp', 'create_notification']
