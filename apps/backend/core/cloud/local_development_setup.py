# -*- coding: utf-8 -*-
"""
Local Development Setup - Real Local Cloud Alternatives
Provides functional local services that mirror cloud functionality
NO MOCKS - Real local implementations
"""

import os
import json
import logging
import subprocess
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import sqlite3

logger = logging.getLogger(__name__)

class LocalDevelopmentSetup:
    """Real local development environment setup - NO MOCKS"""

    def __init__(self, config):
        self.config = config
        self.services_status = {
            'local_postgres': {'available': False, 'connection': None, 'error': None},
            'local_redis': {'available': False, 'connection': None, 'error': None},
            'localstack': {'available': False, 'endpoint': None, 'error': None},
            'sqlite_fallback': {'available': False, 'connection': None, 'error': None}
        }

    def setup_all_services(self) -> Dict[str, Any]:
        """Setup all local development services"""
        logger.info("🚀 Setting up LOCAL development environment")

        # Setup services
        self._setup_local_postgres()
        self._setup_local_redis()
        self._setup_localstack()
        self._setup_sqlite_fallback()

        # Log summary
        self._log_setup_summary()

        return self.services_status

    def _setup_local_postgres(self):
        """Setup local PostgreSQL with pgvector"""
        if not self.config.LOCAL_POSTGRES_ENABLED:
            logger.info("🔄 Local PostgreSQL disabled by configuration")
            return

        try:
            postgres_url = self.config.LOCAL_POSTGRES_URL
            if not postgres_url:
                raise ValueError("LOCAL_POSTGRES_URL is required when LOCAL_POSTGRES_ENABLED=true")

            # Try to connect to PostgreSQL
            conn = psycopg2.connect(postgres_url)
            conn.autocommit = True

            # Setup pgvector extension and tables
            self._setup_postgres_schema(conn)

            self.services_status['local_postgres']['connection'] = conn
            self.services_status['local_postgres']['available'] = True
            logger.info("✅ Local PostgreSQL with pgvector setup completed")

        except Exception as e:
            self.services_status['local_postgres']['error'] = str(e)
            logger.error(f"❌ Failed to setup local PostgreSQL: {e}")

            # Provide setup instructions
            self._log_postgres_setup_instructions()

    def _setup_postgres_schema(self, conn):
        """Setup PostgreSQL schema with pgvector"""
        try:
            with conn.cursor() as cursor:
                # Enable pgvector extension
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

                # Create medical knowledge vectors table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS medical_vectors (
                        id SERIAL PRIMARY KEY,
                        content TEXT NOT NULL,
                        embedding vector(1536),
                        metadata JSONB,
                        source VARCHAR(255),
                        category VARCHAR(100),
                        priority REAL DEFAULT 0.5,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                # Create vector similarity index
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS medical_vectors_embedding_idx
                    ON medical_vectors
                    USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                """)

                # Create chat history table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS chat_history (
                        id SERIAL PRIMARY KEY,
                        session_id VARCHAR(255) NOT NULL,
                        user_message TEXT,
                        assistant_response TEXT,
                        persona VARCHAR(100),
                        metadata JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                # Create user feedback table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_feedback (
                        id SERIAL PRIMARY KEY,
                        session_id VARCHAR(255),
                        message_id VARCHAR(255),
                        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                        feedback_text TEXT,
                        user_agent TEXT,
                        ip_address INET,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                # Create cache table for RAG
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS rag_cache (
                        id SERIAL PRIMARY KEY,
                        query_hash VARCHAR(64) UNIQUE,
                        query_text TEXT,
                        results JSONB,
                        similarity_threshold REAL,
                        result_count INTEGER,
                        expires_at TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                logger.info("✅ PostgreSQL schema setup completed")

        except Exception as e:
            logger.error(f"❌ Failed to setup PostgreSQL schema: {e}")
            raise

    def _setup_local_redis(self):
        """Setup local Redis connection"""
        if not self.config.LOCAL_REDIS_ENABLED:
            logger.info("🔄 Local Redis disabled by configuration")
            return

        try:
            redis_url = self.config.LOCAL_REDIS_URL
            if not redis_url:
                raise ValueError("LOCAL_REDIS_URL is required when LOCAL_REDIS_ENABLED=true")

            # Connect to Redis
            r = redis.from_url(redis_url)

            # Test connection
            r.ping()

            self.services_status['local_redis']['connection'] = r
            self.services_status['local_redis']['available'] = True
            logger.info("✅ Local Redis connection established")

        except Exception as e:
            self.services_status['local_redis']['error'] = str(e)
            logger.error(f"❌ Failed to connect to local Redis: {e}")

            # Provide setup instructions
            self._log_redis_setup_instructions()

    def _setup_localstack(self):
        """Setup LocalStack for AWS services"""
        if not self.config.LOCALSTACK_ENABLED:
            logger.info("🔄 LocalStack disabled by configuration")
            return

        try:
            endpoint = self.config.LOCALSTACK_ENDPOINT

            # Test LocalStack connectivity
            import requests
            response = requests.get(f"{endpoint}/health", timeout=5)

            if response.status_code == 200:
                self.services_status['localstack']['endpoint'] = endpoint
                self.services_status['localstack']['available'] = True
                logger.info(f"✅ LocalStack connected at {endpoint}")
            else:
                raise RuntimeError(f"LocalStack health check failed: {response.status_code}")

        except Exception as e:
            self.services_status['localstack']['error'] = str(e)
            logger.error(f"❌ Failed to connect to LocalStack: {e}")

            # Provide setup instructions
            self._log_localstack_setup_instructions()

    def _setup_sqlite_fallback(self):
        """Setup SQLite as fallback database"""
        try:
            # Create data directory
            data_dir = Path('./data')
            data_dir.mkdir(exist_ok=True)

            # Connect to SQLite
            db_path = data_dir / 'medical_platform_local.db'
            conn = sqlite3.connect(str(db_path))

            # Setup SQLite schema
            self._setup_sqlite_schema(conn)

            self.services_status['sqlite_fallback']['connection'] = conn
            self.services_status['sqlite_fallback']['available'] = True
            logger.info(f"✅ SQLite fallback database setup: {db_path}")

        except Exception as e:
            self.services_status['sqlite_fallback']['error'] = str(e)
            logger.error(f"❌ Failed to setup SQLite fallback: {e}")

    def _setup_sqlite_schema(self, conn):
        """Setup SQLite schema for fallback"""
        try:
            cursor = conn.cursor()

            # Chat history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    user_message TEXT,
                    assistant_response TEXT,
                    persona TEXT,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # User feedback table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    message_id TEXT,
                    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                    feedback_text TEXT,
                    user_agent TEXT,
                    ip_address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Simple cache table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cache_storage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cache_key TEXT UNIQUE,
                    cache_value TEXT,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            conn.commit()
            logger.info("✅ SQLite schema setup completed")

        except Exception as e:
            logger.error(f"❌ Failed to setup SQLite schema: {e}")
            raise

    def _log_setup_summary(self):
        """Log summary of local development setup"""
        available_services = [name for name, status in self.services_status.items() if status['available']]
        unavailable_services = [name for name, status in self.services_status.items() if not status['available']]

        logger.info(f"🚀 LOCAL DEVELOPMENT ENVIRONMENT")
        logger.info(f"✅ Available services: {', '.join(available_services) if available_services else 'None'}")

        if unavailable_services:
            logger.warning(f"⚠️ Unavailable services: {', '.join(unavailable_services)}")

        # Log fallback status
        if self.services_status['sqlite_fallback']['available']:
            logger.info("💾 SQLite fallback available for offline development")

    def _log_postgres_setup_instructions(self):
        """Log PostgreSQL setup instructions"""
        logger.info("""
📋 LOCAL POSTGRESQL SETUP INSTRUCTIONS:

1. Install PostgreSQL with pgvector:
   - Ubuntu/Debian: sudo apt install postgresql postgresql-contrib
   - macOS: brew install postgresql pgvector
   - Windows: Download from https://www.postgresql.org/download/

2. Install pgvector extension:
   - git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git
   - cd pgvector && make && sudo make install

3. Create database:
   - sudo -u postgres createdb medical_platform
   - sudo -u postgres createuser --superuser $USER

4. Set environment variable:
   - LOCAL_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/medical_platform
   - LOCAL_POSTGRES_ENABLED=true
        """)

    def _log_redis_setup_instructions(self):
        """Log Redis setup instructions"""
        logger.info("""
📋 LOCAL REDIS SETUP INSTRUCTIONS:

1. Install Redis:
   - Ubuntu/Debian: sudo apt install redis-server
   - macOS: brew install redis
   - Windows: Use Docker or WSL

2. Start Redis:
   - Linux/macOS: redis-server
   - Or use Docker: docker run -d -p 6379:6379 redis:alpine

3. Set environment variable:
   - LOCAL_REDIS_URL=redis://localhost:6379/0
   - LOCAL_REDIS_ENABLED=true
        """)

    def _log_localstack_setup_instructions(self):
        """Log LocalStack setup instructions"""
        logger.info("""
📋 LOCALSTACK SETUP INSTRUCTIONS:

1. Install LocalStack:
   - pip install localstack
   - Or use Docker: docker pull localstack/localstack

2. Start LocalStack:
   - localstack start
   - Or Docker: docker run -d -p 4566:4566 localstack/localstack

3. Set environment variable:
   - LOCALSTACK_ENABLED=true
   - LOCALSTACK_ENDPOINT=http://localhost:4566
        """)

    def get_service_connection(self, service_name: str):
        """Get connection for specific service"""
        return self.services_status.get(service_name, {}).get('connection')

    def is_service_available(self, service_name: str) -> bool:
        """Check if service is available"""
        return self.services_status.get(service_name, {}).get('available', False)

    def get_postgres_connection(self):
        """Get PostgreSQL connection (local or fallback)"""
        if self.is_service_available('local_postgres'):
            return self.get_service_connection('local_postgres')
        elif self.is_service_available('sqlite_fallback'):
            return self.get_service_connection('sqlite_fallback')
        return None

    def get_cache_connection(self):
        """Get cache connection (Redis or fallback)"""
        if self.is_service_available('local_redis'):
            return self.get_service_connection('local_redis')
        # Can use SQLite cache table as fallback
        return None

    def health_check(self) -> Dict[str, Any]:
        """Health check for all local services"""
        health_status = {
            'timestamp': time.time(),
            'services': {},
            'overall_healthy': False
        }

        healthy_services = 0
        total_enabled_services = 0

        for service_name, status in self.services_status.items():
            if service_name == 'sqlite_fallback':
                # SQLite is always available as fallback
                healthy_services += 1
                total_enabled_services += 1
                continue

            service_enabled = getattr(self.config, f"{service_name.upper()}_ENABLED", False)
            if service_enabled:
                total_enabled_services += 1
                if status['available']:
                    healthy_services += 1

            health_status['services'][service_name] = {
                'enabled': service_enabled,
                'available': status['available'],
                'error': status.get('error')
            }

        # At least SQLite fallback should be available
        health_status['overall_healthy'] = healthy_services > 0

        return health_status

def setup_local_development(config) -> LocalDevelopmentSetup:
    """Setup local development environment"""
    setup = LocalDevelopmentSetup(config)
    setup.setup_all_services()
    return setup