# -*- coding: utf-8 -*-
"""
Feedback Repository - SQLite-based persistent feedback storage
Replaces volatile in-memory cache storage with durable SQLite persistence.
"""

import sqlite3
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).parent.parent
_DB_DIR = _BACKEND_ROOT / 'data'


class FeedbackRepository:
    """SQLite-based feedback storage with aggregation queries."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path:
            self._db_path = db_path
        else:
            _DB_DIR.mkdir(exist_ok=True)
            self._db_path = str(_DB_DIR / 'feedback.db')
        self._ensure_table()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _ensure_table(self):
        conn = self._get_conn()
        try:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS feedback (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    persona_id TEXT,
                    question TEXT,
                    response TEXT,
                    rating INTEGER NOT NULL,
                    comments TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed INTEGER DEFAULT 0
                )
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_feedback_persona
                ON feedback(persona_id)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_feedback_created
                ON feedback(created_at DESC)
            ''')
            conn.commit()
        except Exception as e:
            logger.error("Failed to create feedback table: %s", e)
        finally:
            conn.close()

    def save_feedback(self, data: Dict[str, Any]) -> str:
        """Save feedback to SQLite. Returns feedback_id."""
        feedback_id = str(uuid.uuid4())
        conn = self._get_conn()
        try:
            conn.execute(
                '''INSERT INTO feedback (id, user_id, persona_id, question, response, rating, comments)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (
                    feedback_id,
                    data.get('user_id'),
                    data.get('persona_id'),
                    data.get('question'),
                    data.get('response'),
                    int(data.get('rating', 0)),
                    data.get('comments'),
                )
            )
            conn.commit()
            return feedback_id
        except Exception as e:
            logger.error("Failed to save feedback: %s", e)
            raise
        finally:
            conn.close()

    def get_feedback_stats(self) -> Dict[str, Any]:
        """Get aggregated feedback statistics from real SQL queries."""
        conn = self._get_conn()
        try:
            row = conn.execute(
                'SELECT COUNT(*) as total, COALESCE(AVG(rating), 0) as avg_rating, '
                'COALESCE(SUM(rating), 0) as total_rating FROM feedback'
            ).fetchone()

            total_count = row['total']
            avg_rating = round(row['avg_rating'], 2)

            # Rating distribution
            dist_rows = conn.execute(
                'SELECT rating, COUNT(*) as cnt FROM feedback GROUP BY rating'
            ).fetchall()
            distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for r in dist_rows:
                distribution[r['rating']] = r['cnt']

            return {
                'total_count': total_count,
                'total_rating': row['total_rating'],
                'average_rating': avg_rating,
                'rating_distribution': distribution,
            }
        finally:
            conn.close()

    def get_persona_stats(self, persona_id: str) -> Dict[str, Any]:
        """Get stats filtered by persona."""
        conn = self._get_conn()
        try:
            row = conn.execute(
                'SELECT COUNT(*) as total, COALESCE(AVG(rating), 0) as avg_rating '
                'FROM feedback WHERE persona_id = ?',
                (persona_id,)
            ).fetchone()

            dist_rows = conn.execute(
                'SELECT rating, COUNT(*) as cnt FROM feedback WHERE persona_id = ? GROUP BY rating',
                (persona_id,)
            ).fetchall()
            distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for r in dist_rows:
                distribution[r['rating']] = r['cnt']

            return {
                'total_count': row['total'],
                'average_rating': round(row['avg_rating'], 2),
                'rating_distribution': distribution,
            }
        finally:
            conn.close()

    def get_feedback_by_id(self, feedback_id: str) -> Optional[Dict[str, Any]]:
        """Get single feedback by ID."""
        conn = self._get_conn()
        try:
            row = conn.execute(
                'SELECT * FROM feedback WHERE id = ?', (feedback_id,)
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def get_recent_feedbacks(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recent feedbacks."""
        conn = self._get_conn()
        try:
            rows = conn.execute(
                'SELECT id, rating, persona_id, created_at FROM feedback '
                'ORDER BY created_at DESC LIMIT ?',
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


# Singleton
_repository: Optional[FeedbackRepository] = None


def get_feedback_repository() -> FeedbackRepository:
    """Get singleton FeedbackRepository instance."""
    global _repository
    if _repository is None:
        _repository = FeedbackRepository()
    return _repository
