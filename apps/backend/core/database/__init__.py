"""
Enterprise Database System - SQLite Implementation
Sistema completo de banco de dados para aplicação educacional
"""

import sqlite3
import threading
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple, Union
from contextlib import contextmanager
from datetime import datetime, timedelta
import uuid

from .models import DatabaseSchema, DataCategory, calculate_expiry_date

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    Gerenciador enterprise do banco de dados SQLite
    Thread-safe com connection pooling e transaction management
    """

    def __init__(self, db_path: str = None):
        self.db_path = db_path or self._get_default_db_path()
        self._local = threading.local()
        self._ensure_database_exists()
        self._initialize_schema()
        self.connected = True
        logger.info(f"Database manager initialized: {self.db_path}")

    def _get_default_db_path(self) -> str:
        """Caminho padrão do banco de dados"""
        base_dir = Path(__file__).parent.parent.parent
        db_dir = base_dir / "data" / "database"
        db_dir.mkdir(parents=True, exist_ok=True)
        return str(db_dir / "roteiros_dispensacao.db")

    def _ensure_database_exists(self):
        """Garante que o arquivo do banco existe"""
        db_dir = Path(self.db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        """Obtém conexão thread-local"""
        if not hasattr(self._local, 'connection'):
            self._local.connection = sqlite3.connect(
                self.db_path,
                check_same_thread=False,
                timeout=30.0
            )
            # Configurações de performance e integridade
            self._local.connection.execute("PRAGMA foreign_keys = ON")
            self._local.connection.execute("PRAGMA journal_mode = WAL")
            self._local.connection.execute("PRAGMA synchronous = NORMAL")
            self._local.connection.execute("PRAGMA cache_size = 10000")
            self._local.connection.execute("PRAGMA temp_store = memory")

            # Row factory para retornar dicts
            self._local.connection.row_factory = sqlite3.Row

        return self._local.connection

    @contextmanager
    def transaction(self):
        """Context manager para transações"""
        conn = self._get_connection()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Transaction rollback: {e}")
            raise

    def _initialize_schema(self):
        """Inicializa schema do banco de dados"""
        try:
            with self.transaction() as conn:
                # Criar todas as tabelas
                for sql in DatabaseSchema.create_tables_sql():
                    conn.execute(sql)

                # Criar indexes
                for sql in DatabaseSchema.create_indexes_sql():
                    conn.execute(sql)

                # Inserir dados padrão
                for sql in DatabaseSchema.get_default_data_sql():
                    conn.execute(sql)

                logger.info("Database schema initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database schema: {e}")
            raise

    def execute(self, query: str, params: Optional[Union[Dict, Tuple]] = None) -> Dict[str, Any]:
        """
        Executa query e retorna resultado estruturado
        """
        try:
            with self.transaction() as conn:
                cursor = conn.execute(query, params or ())

                if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
                    return {
                        "affected_rows": cursor.rowcount,
                        "lastrowid": cursor.lastrowid
                    }
                else:
                    rows = cursor.fetchall()
                    return {
                        "rows": [dict(row) for row in rows],
                        "count": len(rows)
                    }

        except Exception as e:
            logger.error(f"Database execute error: {e} | Query: {query}")
            raise

    def fetch_all(self, query: str, params: Optional[Union[Dict, Tuple]] = None) -> List[Dict[str, Any]]:
        """Fetch all rows as list of dicts"""
        result = self.execute(query, params)
        return result.get("rows", [])

    def fetch_one(self, query: str, params: Optional[Union[Dict, Tuple]] = None) -> Optional[Dict[str, Any]]:
        """Fetch single row as dict"""
        rows = self.fetch_all(query, params)
        return rows[0] if rows else None

    def insert(self, table: str, data: Dict[str, Any]) -> str:
        """
        Insert com auto-geração de ID e timestamps
        """
        # Auto-gerar ID se não fornecido
        if 'id' not in data:
            data['id'] = str(uuid.uuid4())

        # Auto-adicionar timestamps
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()

        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        values = list(data.values())

        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        result = self.execute(query, values)

        logger.debug(f"Inserted into {table}: {data['id']}")
        return data['id']

    def update(self, table: str, data: Dict[str, Any], where_clause: str, where_params: Optional[Tuple] = None) -> int:
        """
        Update com timestamp automático
        """
        # Auto-adicionar updated_at
        data['updated_at'] = datetime.utcnow().isoformat()

        set_clause = ', '.join([f"{key} = ?" for key in data.keys()])
        values = list(data.values()) + list(where_params or ())

        query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
        result = self.execute(query, values)

        return result.get("affected_rows", 0)

    def delete(self, table: str, where_clause: str, where_params: Optional[Tuple] = None) -> int:
        """Delete rows"""
        query = f"DELETE FROM {table} WHERE {where_clause}"
        result = self.execute(query, where_params)
        return result.get("affected_rows", 0)

    # Métodos específicos para audit e compliance

    def log_audit_event(self, user_id: Optional[str], action: str, resource: str,
                       data: Dict[str, Any], ip_address: str, user_agent: str = None,
                       data_category: DataCategory = DataCategory.SYSTEM):
        """Log de auditoria com compliance LGPD"""
        audit_data = {
            'user_id': user_id,
            'action': action,
            'resource': resource,
            'data_hash': self._hash_sensitive_data(json.dumps(data, sort_keys=True)),
            'ip_address': ip_address,
            'user_agent': user_agent or 'Unknown',
            'timestamp': datetime.utcnow().isoformat(),
            'data_category': data_category.value,
            'expires_at': calculate_expiry_date(data_category).isoformat()
        }

        return self.insert('audit_logs', audit_data)

    def log_analytics_event(self, event_type: str, properties: Dict[str, Any],
                           user_id: Optional[str] = None, session_id: Optional[str] = None,
                           page_url: str = '', referrer: str = None):
        """Log de analytics anônimo"""
        analytics_data = {
            'event_type': event_type,
            'user_id': user_id,
            'session_id': session_id,
            'properties': json.dumps(properties),
            'timestamp': datetime.utcnow().isoformat(),
            'page_url': page_url,
            'referrer': referrer
        }

        return self.insert('analytics_events', analytics_data)

    def cleanup_expired_data(self) -> Dict[str, int]:
        """Limpeza automática de dados expirados (LGPD compliance)"""
        current_time = datetime.utcnow().isoformat()
        cleanup_results = {}

        tables_with_expiry = [
            'audit_logs',
            'sessions'
        ]

        try:
            with self.transaction():
                for table in tables_with_expiry:
                    if table == 'sessions':
                        count = self.delete(table, "expires_at < ?", (current_time,))
                    else:
                        count = self.delete(table, "expires_at < ?", (current_time,))

                    cleanup_results[table] = count
                    if count > 0:
                        logger.info(f"Cleaned up {count} expired records from {table}")

        except Exception as e:
            logger.error(f"Error during data cleanup: {e}")

        return cleanup_results

    def get_database_stats(self) -> Dict[str, Any]:
        """Estatísticas do banco de dados"""
        stats = {}

        tables = [
            'users', 'sessions', 'audit_logs', 'analytics_events',
            'learning_progress', 'certifications', 'rate_limits'
        ]

        for table in tables:
            try:
                result = self.fetch_one(f"SELECT COUNT(*) as count FROM {table}")
                stats[table] = result['count'] if result else 0
            except:
                stats[table] = 0

        # Estatísticas adicionais
        try:
            db_size = os.path.getsize(self.db_path) / (1024 * 1024)  # MB
            stats['database_size_mb'] = round(db_size, 2)
        except:
            stats['database_size_mb'] = 0

        return stats

    def _hash_sensitive_data(self, data: str) -> str:
        """Hash para dados sensíveis"""
        import hashlib
        return hashlib.sha256(data.encode()).hexdigest()[:16]

    def commit(self):
        """Commit manual (geralmente desnecessário com context manager)"""
        conn = self._get_connection()
        conn.commit()

    def rollback(self):
        """Rollback manual"""
        conn = self._get_connection()
        conn.rollback()

    def close(self):
        """Fechar conexão"""
        if hasattr(self._local, 'connection'):
            self._local.connection.close()
            delattr(self._local, 'connection')

# Instância global do database manager
_db_manager = None

def get_db_connection() -> DatabaseManager:
    """Obtém instância global do database manager"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager

def initialize_database(config: Optional[Dict[str, Any]] = None):
    """Inicializa database com configuração"""
    global _db_manager
    db_path = None
    if config and 'database_path' in config:
        db_path = config['database_path']

    _db_manager = DatabaseManager(db_path)
    logger.info("Database system initialized successfully")

# Compatibility aliases
db_connection = get_db_connection()
DatabaseConnection = DatabaseManager