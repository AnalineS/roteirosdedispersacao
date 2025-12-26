# -*- coding: utf-8 -*-
"""
PostgreSQL Rate Limiter - Distributed rate limiting with PostgreSQL
===================================================================

Implements distributed rate limiting using PostgreSQL with fallback
to local in-memory system.

Features:
- Distributed rate limiting via PostgreSQL
- Automatic fallback to local system (in-memory)
- Performance optimized with local caching
- Transparent integration with existing middleware
- Connection pooling for efficiency
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, Optional
from collections import defaultdict
import logging
import threading
import os

logger = logging.getLogger(__name__)

# PostgreSQL imports (with fallback)
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2 import pool
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False


class PostgresRateLimiter:
    """
    Distributed rate limiter using PostgreSQL as backend
    With complete fallback to in-memory system
    """

    def __init__(self, table_name: str = "rate_limits"):
        self.table_name = table_name
        self.local_cache = defaultdict(lambda: {"count": 0, "reset_time": None})
        self.cache_lock = threading.RLock()

        # Configuration
        self.cache_ttl = 60  # Local cache for 1 minute
        self.fallback_mode = False

        # Stats
        self.stats = {
            "postgres_operations": 0,
            "postgres_failures": 0,
            "local_cache_hits": 0,
            "rate_limits_applied": 0
        }

        # Connection pool
        self.connection_pool = None

        # Initialize PostgreSQL
        self._init_postgres()

    def _init_postgres(self):
        """Initialize PostgreSQL connection pool"""
        if not POSTGRES_AVAILABLE:
            logger.warning("psycopg2 not available, using local fallback")
            self.fallback_mode = True
            return

        try:
            # Get database URL from environment
            db_url = os.getenv('SUPABASE_DB_URL') or os.getenv('DATABASE_URL')

            if not db_url:
                logger.warning("No database URL configured, using local fallback")
                self.fallback_mode = True
                return

            # Create connection pool
            self.connection_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=5,
                dsn=db_url
            )

            # Setup table
            self._setup_table()

            logger.info("PostgreSQL Rate Limiter initialized")

        except Exception as e:
            logger.error("Failed to initialize PostgreSQL: %s", str(e))
            self.fallback_mode = True

    def _setup_table(self):
        """Create rate_limits table if not exists"""
        if not self.connection_pool:
            return

        conn = None
        try:
            conn = self.connection_pool.getconn()
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} (
                        id TEXT PRIMARY KEY,
                        identifier TEXT NOT NULL,
                        requests_count INTEGER DEFAULT 0,
                        window_start TIMESTAMP WITH TIME ZONE NOT NULL,
                        window_end TIMESTAMP WITH TIME ZONE NOT NULL,
                        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_{self.table_name}_identifier
                    ON {self.table_name}(identifier);
                """)

                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_{self.table_name}_window_end
                    ON {self.table_name}(window_end);
                """)

                conn.commit()
                logger.info("Rate limits table created/verified")

        except Exception as e:
            logger.error("Failed to setup rate limits table: %s", str(e))
            if conn:
                conn.rollback()
        finally:
            if conn:
                self.connection_pool.putconn(conn)

    def check_rate_limit(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if a key is within rate limit

        Args:
            key: Unique identifier (IP, user_id, etc.)
            limit: Maximum number of requests
            window_seconds: Time window in seconds

        Returns:
            (allowed: bool, info: dict)
        """
        current_time = datetime.now(timezone.utc)

        # 1. Check local cache first (performance)
        cached_info = self._check_local_cache(key, limit, window_seconds, current_time)
        if cached_info:
            self.stats["local_cache_hits"] += 1
            return cached_info

        # 2. Check PostgreSQL (if available)
        if not self.fallback_mode and self.connection_pool:
            try:
                allowed, info = self._check_postgres_rate_limit(key, limit, window_seconds, current_time)

                # Update local cache
                self._update_local_cache(key, info, current_time)

                return allowed, info

            except Exception as e:
                logger.warning("PostgreSQL rate limit failed for %s: %s", key, str(e))
                self.stats["postgres_failures"] += 1
                # Fallback to local system

        # 3. Fallback to local system
        return self._check_local_rate_limit(key, limit, window_seconds, current_time)

    def _check_local_cache(self, key: str, limit: int, window_seconds: int, current_time: datetime) -> Optional[Tuple[bool, Dict[str, Any]]]:
        """Check fast local cache"""
        with self.cache_lock:
            if key not in self.local_cache:
                return None

            cached = self.local_cache[key]

            # Cache expired?
            if cached["reset_time"] and current_time > cached["reset_time"]:
                del self.local_cache[key]
                return None

            # Cache valid - return info
            remaining = max(0, limit - cached["count"])
            allowed = cached["count"] < limit

            if allowed:
                cached["count"] += 1

            return allowed, {
                "remaining": remaining - 1 if allowed else remaining,
                "reset_time": cached["reset_time"],
                "total_hits": cached["count"],
                "source": "local_cache"
            }

    def _check_postgres_rate_limit(self, key: str, limit: int, window_seconds: int, current_time: datetime) -> Tuple[bool, Dict[str, Any]]:
        """Check rate limit in PostgreSQL"""
        self.stats["postgres_operations"] += 1

        conn = None
        try:
            conn = self.connection_pool.getconn()
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                doc_id = f"rl_{key}"
                reset_time = current_time + timedelta(seconds=window_seconds)

                # Use PostgreSQL advisory lock for atomicity
                cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (doc_id,))

                # Get existing record
                cursor.execute(f"""
                    SELECT requests_count, window_end
                    FROM {self.table_name}
                    WHERE id = %s
                """, (doc_id,))

                record = cursor.fetchone()

                if not record:
                    # First access - create record
                    cursor.execute(f"""
                        INSERT INTO {self.table_name} (id, identifier, requests_count, window_start, window_end)
                        VALUES (%s, %s, 1, %s, %s)
                    """, (doc_id, key, current_time, reset_time))

                    conn.commit()

                    return True, {
                        "remaining": limit - 1,
                        "reset_time": reset_time,
                        "total_hits": 1,
                        "source": "postgres_new"
                    }

                # Record exists - check window
                doc_reset_time = record['window_end']

                # Window expired? Reset counter
                if current_time > doc_reset_time:
                    cursor.execute(f"""
                        UPDATE {self.table_name}
                        SET requests_count = 1,
                            window_start = %s,
                            window_end = %s,
                            last_updated = NOW()
                        WHERE id = %s
                    """, (current_time, reset_time, doc_id))

                    conn.commit()

                    return True, {
                        "remaining": limit - 1,
                        "reset_time": reset_time,
                        "total_hits": 1,
                        "source": "postgres_reset"
                    }

                # Within window - check limit
                current_count = record['requests_count']

                if current_count >= limit:
                    # Rate limit exceeded
                    conn.commit()
                    return False, {
                        "remaining": 0,
                        "reset_time": doc_reset_time,
                        "total_hits": current_count,
                        "source": "postgres_blocked"
                    }

                # Allow and increment
                new_count = current_count + 1
                cursor.execute(f"""
                    UPDATE {self.table_name}
                    SET requests_count = %s, last_updated = NOW()
                    WHERE id = %s
                """, (new_count, doc_id))

                conn.commit()

                return True, {
                    "remaining": limit - new_count,
                    "reset_time": doc_reset_time,
                    "total_hits": new_count,
                    "source": "postgres_allowed"
                }

        except Exception as e:
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                self.connection_pool.putconn(conn)

    def _check_local_rate_limit(self, key: str, limit: int, window_seconds: int, current_time: datetime) -> Tuple[bool, Dict[str, Any]]:
        """Fallback: in-memory local rate limit"""
        with self.cache_lock:
            if key not in self.local_cache:
                # First access
                reset_time = current_time + timedelta(seconds=window_seconds)
                self.local_cache[key] = {
                    "count": 1,
                    "reset_time": reset_time
                }
                return True, {
                    "remaining": limit - 1,
                    "reset_time": reset_time,
                    "total_hits": 1,
                    "source": "local_fallback_new"
                }

            cached = self.local_cache[key]

            # Window expired?
            if current_time > cached["reset_time"]:
                reset_time = current_time + timedelta(seconds=window_seconds)
                cached["count"] = 1
                cached["reset_time"] = reset_time
                return True, {
                    "remaining": limit - 1,
                    "reset_time": reset_time,
                    "total_hits": 1,
                    "source": "local_fallback_reset"
                }

            # Check limit
            if cached["count"] >= limit:
                return False, {
                    "remaining": 0,
                    "reset_time": cached["reset_time"],
                    "total_hits": cached["count"],
                    "source": "local_fallback_blocked"
                }

            # Allow and increment
            cached["count"] += 1
            return True, {
                "remaining": limit - cached["count"],
                "reset_time": cached["reset_time"],
                "total_hits": cached["count"],
                "source": "local_fallback_allowed"
            }

    def _update_local_cache(self, key: str, info: Dict[str, Any], current_time: datetime):
        """Update local cache with PostgreSQL info"""
        with self.cache_lock:
            self.local_cache[key] = {
                "count": info["total_hits"],
                "reset_time": info["reset_time"]
            }

    def cleanup_expired(self):
        """Remove expired entries from local cache and database"""
        current_time = datetime.now(timezone.utc)

        # Clean local cache
        with self.cache_lock:
            expired_keys = []
            for key, cached in self.local_cache.items():
                if cached["reset_time"] and current_time > cached["reset_time"]:
                    expired_keys.append(key)

            for key in expired_keys:
                del self.local_cache[key]

            logger.debug("Cleanup: removed %d expired local entries", len(expired_keys))

        # Clean PostgreSQL
        if not self.fallback_mode and self.connection_pool:
            conn = None
            try:
                conn = self.connection_pool.getconn()
                with conn.cursor() as cursor:
                    cursor.execute(f"""
                        DELETE FROM {self.table_name}
                        WHERE window_end < %s
                    """, (current_time,))
                    deleted = cursor.rowcount
                    conn.commit()
                    logger.debug("Cleanup: removed %d expired PostgreSQL entries", deleted)
            except Exception as e:
                logger.error("Failed to cleanup PostgreSQL: %s", str(e))
                if conn:
                    conn.rollback()
            finally:
                if conn:
                    self.connection_pool.putconn(conn)

    def get_stats(self) -> Dict[str, Any]:
        """Return rate limiter statistics"""
        with self.cache_lock:
            return {
                **self.stats,
                "local_cache_size": len(self.local_cache),
                "fallback_mode": self.fallback_mode,
                "postgres_available": POSTGRES_AVAILABLE and self.connection_pool is not None
            }

    def clear_rate_limit(self, key: str) -> bool:
        """
        Remove rate limit for a specific key
        Useful for tests and special cases
        """
        try:
            # Clear local cache
            with self.cache_lock:
                if key in self.local_cache:
                    del self.local_cache[key]

            # Clear PostgreSQL
            if not self.fallback_mode and self.connection_pool:
                conn = None
                try:
                    conn = self.connection_pool.getconn()
                    with conn.cursor() as cursor:
                        cursor.execute(f"""
                            DELETE FROM {self.table_name} WHERE id = %s
                        """, (f"rl_{key}",))
                        conn.commit()
                finally:
                    if conn:
                        self.connection_pool.putconn(conn)

            logger.info("Rate limit removed for key: %s", key)
            return True

        except Exception as e:
            logger.error("Error clearing rate limit for %s: %s", key, str(e))
            return False

    def close(self):
        """Close connection pool"""
        if self.connection_pool:
            self.connection_pool.closeall()
            logger.info("PostgreSQL connection pool closed")


# Global instance (singleton)
_postgres_rate_limiter = None


def get_rate_limiter() -> PostgresRateLimiter:
    """Return singleton instance of rate limiter"""
    global _postgres_rate_limiter
    if _postgres_rate_limiter is None:
        _postgres_rate_limiter = PostgresRateLimiter()
    return _postgres_rate_limiter


# Convenience functions compatible with existing middleware
def check_rate_limit(key: str, limit: int, window_seconds: int = 3600) -> Tuple[bool, Dict[str, Any]]:
    """Convenience function compatible with existing middleware"""
    limiter = get_rate_limiter()
    return limiter.check_rate_limit(key, limit, window_seconds)


def clear_rate_limit(key: str) -> bool:
    """Convenience function to clear rate limit"""
    limiter = get_rate_limiter()
    return limiter.clear_rate_limit(key)
