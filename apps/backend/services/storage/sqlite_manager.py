# -*- coding: utf-8 -*-
"""
SQLite Manager com Cloud Storage Sync
Sistema de persistência híbrida: SQLite local + backup Cloud Storage automático
"""

import sqlite3
import threading
import os
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from pathlib import Path
import hashlib

from google.cloud import storage
import logging

logger = logging.getLogger(__name__)

class SQLiteCloudManager:
    """
    Gerenciador SQLite com sincronização automática Cloud Storage

    Features:
    - SQLite local para performance
    - Backup automático para Cloud Storage
    - Restore automático no startup
    - Thread background para sync
    - Controle de versioning
    """

    def __init__(
        self,
        db_path: str = "app_database.db",
        bucket_name: Optional[str] = None,
        backup_interval: int = 300,  # 5 minutos
        enable_cloud_sync: bool = True
    ):
        self.db_path = db_path
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME", "roteiro-dispensacao-storage")
        self.backup_interval = backup_interval
        self.enable_cloud_sync = enable_cloud_sync

        self._local_db_path = Path(db_path)
        self._backup_key = f"database/{db_path}"
        self._metadata_key = f"database/{db_path}.metadata"

        self._client = None
        self._bucket = None
        self._last_backup = None
        self._sync_thread = None
        self._stop_sync = threading.Event()
        self._db_lock = threading.RLock()

        # Inicializar
        self._init_storage()
        self._init_database()
        if self.enable_cloud_sync:
            self._start_background_sync()

    def _init_storage(self):
        """Inicializar cliente Cloud Storage"""
        if not self.enable_cloud_sync:
            return

        try:
            # Verificar se estamos em desenvolvimento
            from app_config import config

            # SEMPRE usar cliente real - NO MOCKS (user requirement)
            # Try real cloud first, fallback to local-only if unavailable
            self._client = storage.Client()
            self._bucket = self._client.bucket(self.bucket_name)
            logger.info(f"[PROD] Cloud Storage inicializado: {self.bucket_name}")

        except Exception as e:
            logger.info(f"Cloud Storage não disponível - usando apenas SQLite local: {e}")
            self.enable_cloud_sync = False

    def _init_database(self):
        """Inicializar banco SQLite"""
        # Tentar restaurar backup primeiro
        if self.enable_cloud_sync:
            self._restore_from_cloud()

        # Criar/verificar estrutura do banco
        self._create_tables()

        logger.info(f"SQLite inicializado: {self.db_path}")

    def _create_tables(self):
        """Criar tabelas básicas do sistema"""
        with self._get_connection() as conn:
            conn.executescript("""
                -- Usuários
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE,
                    name TEXT,
                    profile_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Conversas
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    persona TEXT,
                    title TEXT,
                    messages TEXT,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );

                -- Analytics
                CREATE TABLE IF NOT EXISTS analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    event_type TEXT,
                    event_data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );

                -- Cache
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Sessões
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    token_hash TEXT,
                    expires_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );

                -- Índices para performance
                CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
                CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
                CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
                CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
                CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
            """)
            conn.commit()

    def _get_connection(self) -> sqlite3.Connection:
        """Obter conexão SQLite com configurações otimizadas"""
        conn = sqlite3.connect(
            self.db_path,
            timeout=30.0,
            check_same_thread=False
        )
        conn.row_factory = sqlite3.Row

        # Configurações de performance
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=10000")
        conn.execute("PRAGMA temp_store=MEMORY")

        return conn

    # === OPERAÇÕES CRUD ===

    def insert_user(self, user_id: str, email: str, name: str, profile_data: Dict = None) -> bool:
        """Inserir/atualizar usuário"""
        with self._db_lock:
            try:
                with self._get_connection() as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO users
                        (id, email, name, profile_data, updated_at)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (user_id, email, name, json.dumps(profile_data or {})))
                    conn.commit()
                    logger.debug(f"Usuário inserido: {email}")
                    return True
            except Exception as e:
                logger.error(f"Erro ao inserir usuário: {e}")
                return False

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Obter usuário por ID"""
        try:
            with self._get_connection() as conn:
                result = conn.execute(
                    "SELECT * FROM users WHERE id = ?", (user_id,)
                ).fetchone()

                if result:
                    user = dict(result)
                    user['profile_data'] = json.loads(user['profile_data'] or '{}')
                    return user
                return None
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {e}")
            return None

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Obter usuário por email"""
        try:
            with self._get_connection() as conn:
                result = conn.execute(
                    "SELECT * FROM users WHERE email = ?", (email,)
                ).fetchone()

                if result:
                    user = dict(result)
                    user['profile_data'] = json.loads(user['profile_data'] or '{}')
                    return user
                return None
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por email: {e}")
            return None

    def insert_conversation(self, conv_id: str, user_id: str, persona: str,
                          title: str, messages: List, metadata: Dict = None) -> bool:
        """Inserir/atualizar conversa"""
        with self._db_lock:
            try:
                with self._get_connection() as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO conversations
                        (id, user_id, persona, title, messages, metadata, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (conv_id, user_id, persona, title,
                         json.dumps(messages), json.dumps(metadata or {})))
                    conn.commit()
                    logger.debug(f"Conversa inserida: {conv_id}")
                    return True
            except Exception as e:
                logger.error(f"Erro ao inserir conversa: {e}")
                return False

    def get_user_conversations(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Obter conversas do usuário"""
        try:
            with self._get_connection() as conn:
                results = conn.execute("""
                    SELECT * FROM conversations
                    WHERE user_id = ?
                    ORDER BY updated_at DESC
                    LIMIT ?
                """, (user_id, limit)).fetchall()

                conversations = []
                for row in results:
                    conv = dict(row)
                    conv['messages'] = json.loads(conv['messages'] or '[]')
                    conv['metadata'] = json.loads(conv['metadata'] or '{}')
                    conversations.append(conv)

                return conversations
        except Exception as e:
            logger.error(f"Erro ao buscar conversas: {e}")
            return []

    def log_analytics(self, user_id: Optional[str], event_type: str, event_data: Dict) -> bool:
        """Log de evento de analytics"""
        with self._db_lock:
            try:
                with self._get_connection() as conn:
                    conn.execute("""
                        INSERT INTO analytics (user_id, event_type, event_data)
                        VALUES (?, ?, ?)
                    """, (user_id, event_type, json.dumps(event_data)))
                    conn.commit()
                    return True
            except Exception as e:
                logger.error(f"Erro ao log analytics: {e}")
                return False

    # === CACHE ===

    def cache_set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Definir cache com TTL"""
        with self._db_lock:
            try:
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
                with self._get_connection() as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO cache (key, value, expires_at)
                        VALUES (?, ?, ?)
                    """, (key, json.dumps(value), expires_at))
                    conn.commit()
                    return True
            except Exception as e:
                logger.error(f"Erro ao definir cache: {e}")
                return False

    def cache_get(self, key: str) -> Optional[Any]:
        """Obter valor do cache"""
        try:
            with self._get_connection() as conn:
                result = conn.execute("""
                    SELECT value FROM cache
                    WHERE key = ? AND expires_at > CURRENT_TIMESTAMP
                """, (key,)).fetchone()

                if result:
                    return json.loads(result['value'])
                return None
        except Exception as e:
            logger.error(f"Erro ao obter cache: {e}")
            return None

    def cache_clear_expired(self) -> int:
        """Limpar cache expirado"""
        with self._db_lock:
            try:
                with self._get_connection() as conn:
                    cursor = conn.execute("""
                        DELETE FROM cache WHERE expires_at <= CURRENT_TIMESTAMP
                    """)
                    conn.commit()
                    return cursor.rowcount
            except Exception as e:
                logger.error(f"Erro ao limpar cache: {e}")
                return 0

    # === SESSÕES ===

    def create_session(self, session_id: str, user_id: str, token_hash: str,
                      expires_at: datetime) -> bool:
        """Criar sessão"""
        with self._db_lock:
            try:
                with self._get_connection() as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO sessions
                        (id, user_id, token_hash, expires_at)
                        VALUES (?, ?, ?, ?)
                    """, (session_id, user_id, token_hash, expires_at))
                    conn.commit()
                    return True
            except Exception as e:
                logger.error(f"Erro ao criar sessão: {e}")
                return False

    def get_session(self, session_id: str) -> Optional[Dict]:
        """Obter sessão"""
        try:
            with self._get_connection() as conn:
                result = conn.execute("""
                    SELECT * FROM sessions
                    WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
                """, (session_id,)).fetchone()

                if result:
                    return dict(result)
                return None
        except Exception as e:
            logger.error(f"Erro ao obter sessão: {e}")
            return None

    def delete_session(self, session_id: str) -> bool:
        """Deletar sessão"""
        with self._db_lock:
            try:
                with self._get_connection() as conn:
                    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
                    conn.commit()
                    return True
            except Exception as e:
                logger.error(f"Erro ao deletar sessão: {e}")
                return False

    # === CLOUD SYNC ===

    def _backup_to_cloud(self) -> bool:
        """Fazer backup do banco para Cloud Storage"""
        if not self.enable_cloud_sync or not self._bucket:
            return False

        try:
            # Criar metadata
            metadata = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'size': os.path.getsize(self.db_path),
                'hash': self._get_file_hash(self.db_path)
            }

            # Upload do arquivo
            blob = self._bucket.blob(self._backup_key)
            blob.upload_from_filename(self.db_path)

            # Upload da metadata
            metadata_blob = self._bucket.blob(self._metadata_key)
            metadata_blob.upload_from_string(json.dumps(metadata))

            self._last_backup = datetime.now(timezone.utc)
            logger.info("Backup realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro no backup: {e}")
            return False

    def _restore_from_cloud(self) -> bool:
        """Restaurar banco do Cloud Storage"""
        if not self.enable_cloud_sync or not self._bucket:
            return False

        try:
            # Verificar se existe backup
            blob = self._bucket.blob(self._backup_key)
            if not blob.exists():
                logger.info("Nenhum backup encontrado")
                return False

            # Download do arquivo
            blob.download_to_filename(self.db_path)
            logger.info("Banco restaurado do backup")
            return True

        except Exception as e:
            logger.error(f"Erro no restore: {e}")
            return False

    def _get_file_hash(self, filepath: str) -> str:
        """Calcular hash MD5 do arquivo"""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def _start_background_sync(self):
        """Iniciar thread de sync automático"""
        def sync_worker():
            while not self._stop_sync.wait(self.backup_interval):
                if self.enable_cloud_sync:
                    self._backup_to_cloud()
                    self.cache_clear_expired()

        self._sync_thread = threading.Thread(target=sync_worker, daemon=True)
        self._sync_thread.start()
        logger.info("Background sync iniciado")

    def force_backup(self) -> bool:
        """Forçar backup imediato"""
        return self._backup_to_cloud()

    def get_stats(self) -> Dict:
        """Obter estatísticas do banco"""
        try:
            with self._get_connection() as conn:
                stats = {}

                # Contar registros
                for table in ['users', 'conversations', 'analytics', 'cache', 'sessions']:
                    result = conn.execute(f"SELECT COUNT(*) as count FROM {table}").fetchone()
                    stats[f'{table}_count'] = result['count']

                # Tamanho do arquivo
                stats['db_size_mb'] = os.path.getsize(self.db_path) / (1024 * 1024)
                stats['last_backup'] = self._last_backup.isoformat() if self._last_backup else None
                stats['cloud_sync_enabled'] = self.enable_cloud_sync

                return stats
        except Exception as e:
            logger.error(f"Erro ao obter stats: {e}")
            return {}

    def close(self):
        """Fechar manager e realizar backup final"""
        logger.info("Fechando SQLite Manager...")

        # Parar thread de sync
        if self._sync_thread:
            self._stop_sync.set()
            self._sync_thread.join(timeout=10)

        # Backup final
        if self.enable_cloud_sync:
            self._backup_to_cloud()

        logger.info("SQLite Manager fechado")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# Instância global
db_manager = None

def get_db_manager() -> SQLiteCloudManager:
    """Obter instância global do DB manager"""
    global db_manager
    if db_manager is None:
        db_manager = SQLiteCloudManager()
    return db_manager

def init_database(app=None):
    """Inicializar database para Flask app"""
    global db_manager
    if db_manager is None:
        # Configurações do ambiente
        bucket_name = os.getenv("GCS_BUCKET_NAME", "roteiro-dispensacao-storage")
        backup_interval = int(os.getenv("DB_BACKUP_INTERVAL", "300"))  # 5 min
        enable_sync = os.getenv("ENABLE_CLOUD_SYNC", "true").lower() == "true"

        db_manager = SQLiteCloudManager(
            bucket_name=bucket_name,
            backup_interval=backup_interval,
            enable_cloud_sync=enable_sync
        )

        if app:
            app.teardown_appcontext(lambda exc: None)

    return db_manager