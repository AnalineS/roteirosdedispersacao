# -*- coding: utf-8 -*-
"""
Medical Analytics Service
Real-time analytics collection for hanseníase medical application
Integrates with SQLite for local storage and Google Storage for aggregation
"""

import sqlite3
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from pathlib import Path
import logging
from dataclasses import dataclass
from google.cloud import storage
import os

logger = logging.getLogger(__name__)

@dataclass
class MedicalEvent:
    """Medical event data structure"""
    event_id: str
    session_id: str
    user_id: Optional[str]  # None for anonymous users
    is_anonymous: bool
    timestamp: str
    event_type: str
    persona_id: Optional[str]
    question: Optional[str]
    response_time: Optional[float]
    fallback_used: bool = False
    error_occurred: bool = False
    urgency_level: Optional[str] = None
    device_type: str = 'desktop'
    ip_hash: Optional[str] = None

@dataclass
class SessionMetrics:
    """Session metrics aggregation"""
    session_id: str
    start_time: str
    end_time: Optional[str]
    user_id: Optional[str]
    is_anonymous: bool
    total_messages: int
    persona_usage: Dict[str, int]
    avg_response_time: float
    fallback_rate: float
    questions_resolved: int
    device_type: str
    ip_hash: str

class MedicalAnalyticsService:
    """Real-time analytics service for medical application"""

    def __init__(self):
        """Initialize analytics service with SQLite and Google Storage"""
        # SQLite configuration
        self.db_path = Path("data/analytics/medical_analytics.db")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()

        # Google Storage configuration
        self.storage_client = None
        self.bucket_name = os.getenv('GOOGLE_STORAGE_BUCKET', 'roteiros-dispensacao-analytics')
        self._init_storage()

        # Session management
        self.active_sessions = {}

    def _init_database(self):
        """Initialize SQLite database with analytics tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Events table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS medical_events (
                    event_id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    user_id TEXT,
                    is_anonymous BOOLEAN,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    persona_id TEXT,
                    question TEXT,
                    response_time REAL,
                    fallback_used BOOLEAN,
                    error_occurred BOOLEAN,
                    urgency_level TEXT,
                    device_type TEXT,
                    ip_hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    is_anonymous BOOLEAN,
                    start_time TEXT NOT NULL,
                    end_time TEXT,
                    total_messages INTEGER DEFAULT 0,
                    persona_usage TEXT,
                    avg_response_time REAL DEFAULT 0,
                    fallback_rate REAL DEFAULT 0,
                    questions_resolved INTEGER DEFAULT 0,
                    device_type TEXT,
                    ip_hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Daily aggregations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS daily_metrics (
                    date TEXT PRIMARY KEY,
                    total_sessions INTEGER,
                    unique_users INTEGER,
                    anonymous_users INTEGER,
                    total_messages INTEGER,
                    avg_session_duration REAL,
                    persona_usage TEXT,
                    top_questions TEXT,
                    peak_hours TEXT,
                    resolution_rate REAL,
                    fallback_rate REAL,
                    device_breakdown TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Create indexes for performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_session ON medical_events(session_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_timestamp ON medical_events(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(start_time)')

            conn.commit()

    def _init_storage(self):
        """Initialize Google Storage client"""
        try:
            if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
                self.storage_client = storage.Client()
                # Ensure bucket exists
                try:
                    bucket = self.storage_client.bucket(self.bucket_name)
                    if not bucket.exists():
                        bucket = self.storage_client.create_bucket(self.bucket_name)
                        logger.info(f"Created analytics bucket: {self.bucket_name}")
                except Exception as e:
                    logger.warning(f"Could not verify/create bucket: {e}")
            else:
                logger.info("Google Storage credentials not configured, using local storage only")
        except Exception as e:
            logger.warning(f"Google Storage initialization failed: {e}")
            self.storage_client = None

    def track_event(self, event_data: Dict[str, Any]) -> bool:
        """Track a medical analytics event"""
        try:
            # Create event object
            event = MedicalEvent(
                event_id=self._generate_event_id(),
                session_id=event_data.get('session_id', 'unknown'),
                user_id=event_data.get('user_id'),
                is_anonymous=event_data.get('is_anonymous', True),
                timestamp=datetime.now(timezone.utc).isoformat(),
                event_type=event_data.get('event_type', 'unknown'),
                persona_id=event_data.get('persona_id'),
                question=event_data.get('question'),
                response_time=event_data.get('response_time'),
                fallback_used=event_data.get('fallback_used', False),
                error_occurred=event_data.get('error_occurred', False),
                urgency_level=event_data.get('urgency_level'),
                device_type=event_data.get('device_type', 'desktop'),
                ip_hash=self._hash_ip(event_data.get('ip_address'))
            )

            # Store in SQLite
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO medical_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (
                    event.event_id, event.session_id, event.user_id, event.is_anonymous,
                    event.timestamp, event.event_type, event.persona_id, event.question,
                    event.response_time, event.fallback_used, event.error_occurred,
                    event.urgency_level, event.device_type, event.ip_hash
                ))
                conn.commit()

            # Update session metrics
            self._update_session_metrics(event)

            return True

        except Exception as e:
            logger.error(f"Failed to track event: {e}")
            return False

    def start_session(self, session_data: Dict[str, Any]) -> str:
        """Start a new analytics session"""
        try:
            session_id = session_data.get('session_id', self._generate_session_id())

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO sessions
                    (session_id, user_id, is_anonymous, start_time, device_type, ip_hash)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    session_id,
                    session_data.get('user_id'),
                    session_data.get('is_anonymous', True),
                    datetime.now(timezone.utc).isoformat(),
                    session_data.get('device_type', 'desktop'),
                    self._hash_ip(session_data.get('ip_address'))
                ))
                conn.commit()

            self.active_sessions[session_id] = {
                'start_time': datetime.now(timezone.utc),
                'events': []
            }

            return session_id

        except Exception as e:
            logger.error(f"Failed to start session: {e}")
            return None

    def end_session(self, session_id: str) -> bool:
        """End an analytics session and calculate metrics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Get session events
                cursor.execute('''
                    SELECT persona_id, response_time, fallback_used, question
                    FROM medical_events
                    WHERE session_id = ?
                ''', (session_id,))

                events = cursor.fetchall()
                if not events:
                    return False

                # Calculate metrics
                persona_usage = {}
                total_response_time = 0
                fallback_count = 0
                questions_resolved = 0

                for persona_id, response_time, fallback_used, question in events:
                    if persona_id:
                        persona_usage[persona_id] = persona_usage.get(persona_id, 0) + 1
                    if response_time:
                        total_response_time += response_time
                    if fallback_used:
                        fallback_count += 1
                    if question:
                        questions_resolved += 1

                avg_response_time = total_response_time / len(events) if events else 0
                fallback_rate = fallback_count / len(events) if events else 0

                # Update session record
                cursor.execute('''
                    UPDATE sessions
                    SET end_time = ?, total_messages = ?, persona_usage = ?,
                        avg_response_time = ?, fallback_rate = ?, questions_resolved = ?
                    WHERE session_id = ?
                ''', (
                    datetime.now(timezone.utc).isoformat(),
                    len(events),
                    json.dumps(persona_usage),
                    avg_response_time,
                    fallback_rate,
                    questions_resolved,
                    session_id
                ))
                conn.commit()

            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

            return True

        except Exception as e:
            logger.error(f"Failed to end session: {e}")
            return False

    def get_realtime_metrics(self) -> Dict[str, Any]:
        """Get real-time metrics from active sessions and recent events"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Get active users in last 5 minutes
                five_minutes_ago = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
                cursor.execute('''
                    SELECT COUNT(DISTINCT session_id), COUNT(DISTINCT user_id)
                    FROM medical_events
                    WHERE timestamp > ?
                ''', (five_minutes_ago,))

                active_sessions, unique_users = cursor.fetchone()

                # Get recent events
                cursor.execute('''
                    SELECT event_type, persona_id, response_time, fallback_used
                    FROM medical_events
                    WHERE timestamp > ?
                    ORDER BY timestamp DESC
                    LIMIT 100
                ''', (five_minutes_ago,))

                recent_events = cursor.fetchall()

                # Calculate real-time metrics
                persona_usage = {}
                avg_response_time = []
                fallback_count = 0

                for event_type, persona_id, response_time, fallback_used in recent_events:
                    if persona_id:
                        persona_usage[persona_id] = persona_usage.get(persona_id, 0) + 1
                    if response_time:
                        avg_response_time.append(response_time)
                    if fallback_used:
                        fallback_count += 1

                return {
                    'active_sessions': active_sessions,
                    'unique_users': unique_users,
                    'total_events': len(recent_events),
                    'persona_usage': persona_usage,
                    'avg_response_time': sum(avg_response_time) / len(avg_response_time) if avg_response_time else 0,
                    'fallback_rate': fallback_count / len(recent_events) if recent_events else 0,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }

        except Exception as e:
            logger.error(f"Failed to get realtime metrics: {e}")
            return {}

    def get_aggregated_metrics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get aggregated metrics for a date range"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Get session metrics including bounce rate
                cursor.execute('''
                    SELECT
                        COUNT(DISTINCT session_id) as total_sessions,
                        COUNT(DISTINCT user_id) as unique_users,
                        COUNT(DISTINCT CASE WHEN is_anonymous = 1 THEN session_id END) as anonymous_sessions,
                        AVG(total_messages) as avg_messages,
                        AVG(avg_response_time) as avg_response_time,
                        AVG(fallback_rate) as avg_fallback_rate,
                        AVG(questions_resolved) as avg_questions_resolved,
                        CAST(SUM(CASE WHEN total_messages <= 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(session_id) as bounce_rate
                    FROM sessions
                    WHERE start_time BETWEEN ? AND ?
                ''', (start_date, end_date))

                metrics = cursor.fetchone()

                # Get top questions
                cursor.execute('''
                    SELECT question, COUNT(*) as count
                    FROM medical_events
                    WHERE question IS NOT NULL
                    AND timestamp BETWEEN ? AND ?
                    GROUP BY question
                    ORDER BY count DESC
                    LIMIT 10
                ''', (start_date, end_date))

                top_questions = [q[0] for q in cursor.fetchall()]

                # Get persona usage
                cursor.execute('''
                    SELECT persona_id, COUNT(*) as count
                    FROM medical_events
                    WHERE persona_id IS NOT NULL
                    AND timestamp BETWEEN ? AND ?
                    GROUP BY persona_id
                ''', (start_date, end_date))

                persona_usage = dict(cursor.fetchall())

                # Get peak hours
                cursor.execute('''
                    SELECT strftime('%H', timestamp) as hour, COUNT(*) as count
                    FROM medical_events
                    WHERE timestamp BETWEEN ? AND ?
                    GROUP BY hour
                    ORDER BY count DESC
                    LIMIT 5
                ''', (start_date, end_date))

                peak_hours = [int(h[0]) for h in cursor.fetchall()]

                return {
                    'sessions': metrics[0] or 0,
                    'unique_users': metrics[1] or 0,
                    'anonymous_sessions': metrics[2] or 0,
                    'avg_messages': metrics[3] or 0,
                    'avg_response_time': metrics[4] or 0,
                    'fallback_rate': metrics[5] or 0,
                    'resolution_rate': (metrics[6] / metrics[3] * 100) if metrics[3] else 0,
                    'bounce_rate': metrics[7] or 0,  # Real bounce rate calculation
                    'top_questions': top_questions,
                    'persona_usage': persona_usage,
                    'peak_hours': peak_hours,
                    'date_range': {
                        'start': start_date,
                        'end': end_date
                    }
                }

        except Exception as e:
            logger.error(f"Failed to get aggregated metrics: {e}")
            return {}

    def export_to_storage(self, date: Optional[str] = None) -> bool:
        """Export daily metrics to Google Storage"""
        if not self.storage_client:
            logger.warning("Google Storage not configured")
            return False

        try:
            if not date:
                date = datetime.now(timezone.utc).date().isoformat()

            # Get metrics for the day
            start_date = f"{date}T00:00:00"
            end_date = f"{date}T23:59:59"
            metrics = self.get_aggregated_metrics(start_date, end_date)

            # Add metadata
            metrics['export_timestamp'] = datetime.now(timezone.utc).isoformat()
            metrics['export_date'] = date

            # Upload to Google Storage
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(f"daily_metrics/{date}.json")
            blob.upload_from_string(
                json.dumps(metrics, indent=2),
                content_type='application/json'
            )

            logger.info(f"Exported metrics for {date} to Google Storage")
            return True

        except Exception as e:
            logger.error(f"Failed to export to storage: {e}")
            return False

    def cleanup_old_data(self, days_to_keep: int = 90) -> bool:
        """Clean up old analytics data"""
        try:
            cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days_to_keep)).isoformat()

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()

                # Delete old events
                cursor.execute('DELETE FROM medical_events WHERE timestamp < ?', (cutoff_date,))
                deleted_events = cursor.rowcount

                # Delete old sessions
                cursor.execute('DELETE FROM sessions WHERE start_time < ?', (cutoff_date,))
                deleted_sessions = cursor.rowcount

                conn.commit()

            logger.info(f"Cleaned up {deleted_events} events and {deleted_sessions} sessions")
            return True

        except Exception as e:
            logger.error(f"Failed to cleanup old data: {e}")
            return False

    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        return f"evt_{datetime.now(timezone.utc).timestamp()}_{hashlib.md5(os.urandom(16)).hexdigest()[:8]}"

    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"ses_{datetime.now(timezone.utc).timestamp()}_{hashlib.md5(os.urandom(16)).hexdigest()[:8]}"

    def _hash_ip(self, ip_address: Optional[str]) -> Optional[str]:
        """Hash IP address for privacy compliance (LGPD)"""
        if not ip_address:
            return None
        return hashlib.sha256(ip_address.encode()).hexdigest()[:16]

    def _update_session_metrics(self, event: MedicalEvent):
        """Update session metrics in real-time"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE sessions
                    SET total_messages = total_messages + 1
                    WHERE session_id = ?
                ''', (event.session_id,))
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to update session metrics: {e}")

# Singleton instance
_analytics_service = None

def get_analytics_service() -> MedicalAnalyticsService:
    """Get singleton analytics service instance"""
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = MedicalAnalyticsService()
    return _analytics_service