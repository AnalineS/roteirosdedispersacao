# -*- coding: utf-8 -*-
"""
SQLite Rate Limiter - Sistema de rate limiting baseado em SQLite
Substitui Redis para rate limiting distribuído
"""

import sqlite3
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from pathlib import Path
from threading import Lock
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class SQLiteRateLimiter:
    """
    Sistema de rate limiting usando SQLite como backend

    Features:
    - Rate limiting por IP, usuário e endpoint
    - Janelas deslizantes para contagem precisa
    - Limpeza automática de registros antigos
    - Thread-safe com locks
    - Fallback gracioso em caso de erro
    """

    def __init__(self, db_path: str = './data/rate_limits.db'):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self._lock = Lock()

        # Configurações padrão
        self.default_limits = {
            'chat': {'requests': 30, 'window': 60},      # 30 req/min para chat
            'feedback': {'requests': 10, 'window': 300},  # 10 req/5min para feedback
            'auth': {'requests': 5, 'window': 300},       # 5 req/5min para auth
            'general': {'requests': 100, 'window': 60}    # 100 req/min geral
        }

        self._init_database()
        logger.info("SQLite Rate Limiter inicializado")

    def _init_database(self):
        """Inicializar tabelas do banco"""
        try:
            with self._get_connection() as conn:
                # Tabela principal de rate limiting
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS rate_limits (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        identifier TEXT NOT NULL,
                        endpoint TEXT NOT NULL,
                        timestamp INTEGER NOT NULL,
                        window_seconds INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                # Índices para performance
                conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier
                    ON rate_limits(identifier, endpoint, timestamp)
                ''')

                # Tabela de configurações personalizadas
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS rate_limit_configs (
                        endpoint TEXT PRIMARY KEY,
                        max_requests INTEGER NOT NULL,
                        window_seconds INTEGER NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                # Tabela de estatísticas
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS rate_limit_stats (
                        date TEXT PRIMARY KEY,
                        total_requests INTEGER DEFAULT 0,
                        blocked_requests INTEGER DEFAULT 0,
                        unique_ips INTEGER DEFAULT 0,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                conn.commit()

        except Exception as e:
            logger.error(f"Erro ao inicializar banco de rate limiting: {e}")

    @contextmanager
    def _get_connection(self):
        """Context manager para conexões SQLite thread-safe"""
        conn = sqlite3.connect(
            self.db_path,
            timeout=10.0,
            check_same_thread=False
        )
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _get_identifier(self, ip: str, user_id: Optional[str] = None) -> str:
        """Gerar identificador único para rate limiting"""
        if user_id:
            # Rate limiting por usuário (mais específico)
            return f"user:{user_id}"
        else:
            # Rate limiting por IP
            return f"ip:{ip}"

    def _clean_old_records(self, conn, identifier: str, endpoint: str, window_seconds: int) -> None:
        """Limpar registros antigos da janela"""
        cutoff_time = int(time.time()) - window_seconds

        conn.execute('''
            DELETE FROM rate_limits
            WHERE identifier = ? AND endpoint = ? AND timestamp < ?
        ''', (identifier, endpoint, cutoff_time))

    def check_rate_limit(
        self,
        ip: str,
        endpoint: str,
        user_id: Optional[str] = None,
        custom_limit: Optional[Dict] = None
    ) -> Tuple[bool, Dict]:
        """
        Verificar se requisição está dentro do rate limit

        Args:
            ip: IP do cliente
            endpoint: Endpoint sendo acessado
            user_id: ID do usuário (opcional)
            custom_limit: Limite customizado (opcional)

        Returns:
            Tuple[permitido, info_detalhada]
        """
        try:
            with self._lock:
                # Determinar limites
                if custom_limit:
                    max_requests = custom_limit['requests']
                    window_seconds = custom_limit['window']
                else:
                    config = self._get_endpoint_config(endpoint)
                    max_requests = config['requests']
                    window_seconds = config['window']

                identifier = self._get_identifier(ip, user_id)
                current_time = int(time.time())

                with self._get_connection() as conn:
                    # Limpar registros antigos
                    self._clean_old_records(conn, identifier, endpoint, window_seconds)

                    # Contar requisições na janela atual
                    result = conn.execute('''
                        SELECT COUNT(*) as count
                        FROM rate_limits
                        WHERE identifier = ? AND endpoint = ? AND timestamp >= ?
                    ''', (identifier, endpoint, current_time - window_seconds)).fetchone()

                    current_count = result['count'] if result else 0

                    # Verificar se está dentro do limite
                    if current_count >= max_requests:
                        # Rate limit excedido
                        self._update_stats(conn, blocked=True)

                        return False, {
                            'allowed': False,
                            'limit': max_requests,
                            'remaining': 0,
                            'reset_time': current_time + window_seconds,
                            'window_seconds': window_seconds,
                            'current_count': current_count
                        }

                    # Registrar nova requisição
                    conn.execute('''
                        INSERT INTO rate_limits (identifier, endpoint, timestamp, window_seconds)
                        VALUES (?, ?, ?, ?)
                    ''', (identifier, endpoint, current_time, window_seconds))

                    conn.commit()

                    # Atualizar estatísticas
                    self._update_stats(conn, blocked=False)

                    return True, {
                        'allowed': True,
                        'limit': max_requests,
                        'remaining': max_requests - current_count - 1,
                        'reset_time': current_time + window_seconds,
                        'window_seconds': window_seconds,
                        'current_count': current_count + 1
                    }

        except Exception as e:
            logger.error(f"Erro no rate limiting: {e}")
            # Em caso de erro, permitir a requisição (fail-open)
            return True, {
                'allowed': True,
                'error': 'rate_limiter_error',
                'message': 'Rate limiter com falha, permitindo requisição'
            }

    def _get_endpoint_config(self, endpoint: str) -> Dict:
        """Obter configuração de rate limit para endpoint"""
        try:
            with self._get_connection() as conn:
                result = conn.execute('''
                    SELECT max_requests, window_seconds
                    FROM rate_limit_configs
                    WHERE endpoint = ?
                ''', (endpoint,)).fetchone()

                if result:
                    return {
                        'requests': result['max_requests'],
                        'window': result['window_seconds']
                    }
        except Exception as e:
            logger.error(f"Erro ao obter config do endpoint: {e}")

        # Fallback para configuração padrão
        for pattern, config in self.default_limits.items():
            if pattern in endpoint.lower():
                return config

        return self.default_limits['general']

    def _update_stats(self, conn, blocked: bool = False):
        """Atualizar estatísticas diárias"""
        try:
            today = datetime.now().strftime('%Y-%m-%d')

            # Inserir ou atualizar estatísticas
            if blocked:
                conn.execute('''
                    INSERT INTO rate_limit_stats (date, blocked_requests)
                    VALUES (?, 1)
                    ON CONFLICT(date) DO UPDATE SET
                        blocked_requests = blocked_requests + 1,
                        updated_at = CURRENT_TIMESTAMP
                ''', (today,))
            else:
                conn.execute('''
                    INSERT INTO rate_limit_stats (date, total_requests)
                    VALUES (?, 1)
                    ON CONFLICT(date) DO UPDATE SET
                        total_requests = total_requests + 1,
                        updated_at = CURRENT_TIMESTAMP
                ''', (today,))

        except Exception as e:
            logger.error(f"Erro ao atualizar stats: {e}")

    def set_endpoint_config(self, endpoint: str, max_requests: int, window_seconds: int) -> bool:
        """Configurar rate limit personalizado para endpoint"""
        try:
            with self._get_connection() as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO rate_limit_configs
                    (endpoint, max_requests, window_seconds)
                    VALUES (?, ?, ?)
                ''', (endpoint, max_requests, window_seconds))
                conn.commit()

                logger.info(f"Rate limit configurado: {endpoint} = {max_requests}/{window_seconds}s")
                return True

        except Exception as e:
            logger.error(f"Erro ao configurar rate limit: {e}")
            return False

    def get_stats(self, days: int = 7) -> Dict:
        """Obter estatísticas de rate limiting"""
        try:
            with self._get_connection() as conn:
                # Stats dos últimos N dias
                start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

                result = conn.execute('''
                    SELECT
                        SUM(total_requests) as total,
                        SUM(blocked_requests) as blocked,
                        AVG(unique_ips) as avg_unique_ips
                    FROM rate_limit_stats
                    WHERE date >= ?
                ''', (start_date,)).fetchone()

                # Top endpoints mais limitados
                top_limited = conn.execute('''
                    SELECT endpoint, COUNT(*) as blocks
                    FROM rate_limits
                    WHERE timestamp >= ?
                    GROUP BY endpoint
                    ORDER BY blocks DESC
                    LIMIT 10
                ''', (int(time.time()) - (days * 86400),)).fetchall()

                return {
                    'period_days': days,
                    'total_requests': result['total'] or 0,
                    'blocked_requests': result['blocked'] or 0,
                    'block_rate': (result['blocked'] or 0) / max(result['total'] or 1, 1) * 100,
                    'avg_unique_ips': result['avg_unique_ips'] or 0,
                    'top_limited_endpoints': [
                        {'endpoint': row['endpoint'], 'blocks': row['blocks']}
                        for row in top_limited
                    ]
                }
        except Exception as e:
            logger.error(f"Erro ao obter stats: {e}")
            return {}

    def cleanup_old_data(self, days_to_keep: int = 30) -> int:
        """Limpar dados antigos do banco"""
        try:
            cutoff_time = int(time.time()) - (days_to_keep * 86400)

            with self._get_connection() as conn:
                # Limpar rate limits antigos
                cursor = conn.execute('''
                    DELETE FROM rate_limits WHERE timestamp < ?
                ''', (cutoff_time,))

                deleted_count = cursor.rowcount

                # Limpar stats antigas
                cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).strftime('%Y-%m-%d')
                conn.execute('''
                    DELETE FROM rate_limit_stats WHERE date < ?
                ''', (cutoff_date,))

                conn.commit()

                logger.info(f"Limpeza concluída: {deleted_count} registros removidos")
                return deleted_count

        except Exception as e:
            logger.error(f"Erro na limpeza: {e}")
            return 0

# Instância global
_rate_limiter = None
_rate_limiter_lock = Lock()

def get_rate_limiter() -> SQLiteRateLimiter:
    """Obter instância singleton do rate limiter"""
    global _rate_limiter

    if _rate_limiter is None:
        with _rate_limiter_lock:
            if _rate_limiter is None:
                _rate_limiter = SQLiteRateLimiter()

    return _rate_limiter

# Decorator para Flask endpoints
def rate_limit(
    endpoint: str,
    max_requests: Optional[int] = None,
    window_seconds: Optional[int] = None
):
    """
    Decorator para aplicar rate limiting em endpoints Flask

    Args:
        endpoint: Nome do endpoint
        max_requests: Máximo de requisições (opcional)
        window_seconds: Janela em segundos (opcional)
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            from flask import request, jsonify

            try:
                limiter = get_rate_limiter()

                # Obter IP do cliente
                client_ip = request.environ.get('HTTP_X_FORWARDED_FOR') or request.remote_addr

                # Tentar obter user_id do contexto (se autenticado)
                user_id = None
                try:
                    from flask import g
                    if hasattr(g, 'current_user') and g.current_user:
                        user_id = g.current_user.get('id')
                except:
                    pass

                # Configurar limite customizado se fornecido
                custom_limit = None
                if max_requests and window_seconds:
                    custom_limit = {
                        'requests': max_requests,
                        'window': window_seconds
                    }

                # Verificar rate limit
                allowed, info = limiter.check_rate_limit(
                    client_ip, endpoint, user_id, custom_limit
                )

                if not allowed:
                    return jsonify({
                        'error': 'Rate limit excedido',
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'details': {
                            'limit': info.get('limit'),
                            'window_seconds': info.get('window_seconds'),
                            'reset_time': info.get('reset_time'),
                            'message': f"Máximo de {info.get('limit')} requisições por {info.get('window_seconds')} segundos"
                        }
                    }), 429

                # Adicionar headers informativos
                response = f(*args, **kwargs)
                if hasattr(response, 'headers'):
                    response.headers['X-RateLimit-Limit'] = str(info.get('limit', ''))
                    response.headers['X-RateLimit-Remaining'] = str(info.get('remaining', ''))
                    response.headers['X-RateLimit-Reset'] = str(info.get('reset_time', ''))

                return response

            except Exception as e:
                logger.error(f"Erro no rate limiting decorator: {e}")
                # Em caso de erro, permitir a requisição
                return f(*args, **kwargs)

        wrapper.__name__ = f.__name__
        return wrapper
    return decorator