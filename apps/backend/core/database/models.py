"""
Database Models - Sistema completo com SQLite
Schema estruturado para sistema educacional de hanseníase
"""

import os
import sqlite3
import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Helper function for UTC datetime (timezone-aware)
# Replaces deprecated datetime.now(timezone.utc) with datetime.now(timezone.utc)
def utcnow() -> datetime:
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)

class UserRole(Enum):
    ADMIN = "admin"
    EDUCATOR = "educator"
    STUDENT = "student"
    GUEST = "guest"

class DataCategory(Enum):
    PERSONAL_DATA = "personal_data"    # 7 dias retenção
    ANALYTICS = "analytics"            # 30 dias
    SYSTEM = "system"                  # 90 dias
    AUDIT = "audit"                    # 365 dias

@dataclass
class User:
    id: str
    email: str
    password_hash: str
    roles: List[str]
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True
    profile_data: Optional[Dict[str, Any]] = None

@dataclass
class Session:
    id: str
    user_id: str
    jwt_token: str
    refresh_token: str
    created_at: datetime
    expires_at: datetime
    is_active: bool = True
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

@dataclass
class AuditLog:
    id: str
    user_id: Optional[str]
    action: str
    resource: str
    data_hash: str  # Hash dos dados sensíveis, não os dados em si
    ip_address: str
    user_agent: str
    timestamp: datetime
    data_category: str
    expires_at: datetime

@dataclass
class AnalyticsEvent:
    id: str
    event_type: str
    user_id: Optional[str]
    session_id: Optional[str]
    properties: Dict[str, Any]
    timestamp: datetime
    page_url: str
    referrer: Optional[str] = None

class DatabaseSchema:
    """Schema e migrations do banco de dados"""

    @staticmethod
    def get_schema_version() -> str:
        return "1.0.0"

    @staticmethod
    def create_tables_sql() -> List[str]:
        """SQL para criação de todas as tabelas"""
        return [
            # Tabela de usuários
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                roles TEXT NOT NULL,  -- JSON array
                created_at TIMESTAMP NOT NULL,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                profile_data TEXT,  -- JSON
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,

            # Tabela de sessões
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                jwt_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """,

            # Tabela de logs de auditoria
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                resource TEXT NOT NULL,
                data_hash TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                user_agent TEXT,
                timestamp TIMESTAMP NOT NULL,
                data_category TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
            )
            """,

            # Tabela de eventos de analytics
            """
            CREATE TABLE IF NOT EXISTS analytics_events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                user_id TEXT,
                session_id TEXT,
                properties TEXT NOT NULL,  -- JSON
                timestamp TIMESTAMP NOT NULL,
                page_url TEXT NOT NULL,
                referrer TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
            )
            """,

            # Tabela de configurações do sistema
            """
            CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,

            # Tabela de rate limiting
            """
            CREATE TABLE IF NOT EXISTS rate_limits (
                id TEXT PRIMARY KEY,
                identifier TEXT NOT NULL,  -- IP ou user_id
                endpoint TEXT NOT NULL,
                requests_count INTEGER DEFAULT 0,
                window_start TIMESTAMP NOT NULL,
                window_end TIMESTAMP NOT NULL,
                is_blocked BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,

            # Tabela de progresso educacional
            """
            CREATE TABLE IF NOT EXISTS learning_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                module_id TEXT NOT NULL,
                lesson_id TEXT,
                progress_percentage REAL DEFAULT 0,
                completed_at TIMESTAMP,
                quiz_scores TEXT,  -- JSON array de scores
                time_spent INTEGER DEFAULT 0,  -- em segundos
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """,

            # Tabela de certificações
            """
            CREATE TABLE IF NOT EXISTS certifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                certificate_data TEXT NOT NULL,  -- JSON com dados do certificado
                issued_at TIMESTAMP NOT NULL,
                expires_at TIMESTAMP,
                verification_code TEXT UNIQUE NOT NULL,
                is_valid BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """
        ]

    @staticmethod
    def create_indexes_sql() -> List[str]:
        """Indexes para performance"""
        return [
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_expires ON audit_logs(expires_at)",
            "CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type)",
            "CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier)",
            "CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint)",
            "CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_certifications_user ON certifications(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_certifications_verification ON certifications(verification_code)"
        ]

    @staticmethod
    def get_default_data_sql() -> List[str]:
        """Dados iniciais do sistema"""
        admin_id = str(uuid.uuid4())
        # SECURITY FIX: Use os.urandom() for cryptographically secure salt (CWE-329)
        # Context7 best practice: cryptography library recommends os.urandom(16) for salt generation
        salt = os.urandom(16)
        admin_password = hashlib.pbkdf2_hmac('sha256', b'admin123', salt, 100000).hex()

        return [
            f"""
            INSERT OR IGNORE INTO users (id, email, password_hash, roles, created_at, is_active)
            VALUES ('{admin_id}', 'admin@roteiros.com', '{admin_password}',
                    '["admin", "educator"]', '{utcnow().isoformat()}', 1)
            """,

            """
            INSERT OR IGNORE INTO system_config (key, value, description)
            VALUES
                ('app_version', '1.0.0', 'Versão atual da aplicação'),
                ('maintenance_mode', 'false', 'Modo de manutenção'),
                ('max_login_attempts', '5', 'Máximo de tentativas de login'),
                ('session_timeout_hours', '24', 'Timeout de sessão em horas'),
                ('data_retention_days', '30', 'Retenção padrão de dados'),
                ('lgpd_compliance_enabled', 'true', 'LGPD compliance ativo')
            """
        ]

def hash_sensitive_data(data: str) -> str:
    """Hash para dados sensíveis em audit logs"""
    return hashlib.sha256(data.encode()).hexdigest()[:16]

def generate_verification_code() -> str:
    """Gera código de verificação único"""
    return hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()[:8].upper()

def calculate_expiry_date(data_category: DataCategory) -> datetime:
    """Calcula data de expiração baseada na categoria LGPD"""
    retention_days = {
        DataCategory.PERSONAL_DATA: 7,
        DataCategory.ANALYTICS: 30,
        DataCategory.SYSTEM: 90,
        DataCategory.AUDIT: 365
    }

    days = retention_days.get(data_category, 30)
    return utcnow() + timedelta(days=days)