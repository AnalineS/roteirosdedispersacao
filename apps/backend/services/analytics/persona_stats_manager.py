# -*- coding: utf-8 -*-
"""
Persona Stats Manager - Sistema de persistência para estatísticas das personas
Substitui dados mockados por persistência real no SQLite
"""

import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from pathlib import Path
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class PersonaStatsManager:
    """
    Gerenciador de estatísticas das personas usando SQLite

    Features:
    - Persistência de interações por persona
    - Cálculo de ratings médios
    - Taxa de sucesso baseada em feedback
    - Histórico temporal de uso
    - Estatísticas agregadas e individuais
    """

    def __init__(self, db_path: str = './data/persona_stats.db'):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self._init_database()
        logger.info("Persona Stats Manager inicializado")

    def _init_database(self):
        """Inicializar tabelas do banco"""
        try:
            with self._get_connection() as conn:
                # Tabela de interações
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS persona_interactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        persona_id TEXT NOT NULL,
                        user_id TEXT,
                        session_id TEXT,
                        question_type TEXT,
                        response_time_ms INTEGER,
                        success BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                # Tabela de ratings/feedback
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS persona_ratings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        persona_id TEXT NOT NULL,
                        user_id TEXT,
                        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                        feedback_text TEXT,
                        interaction_id INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (interaction_id) REFERENCES persona_interactions(id)
                    )
                ''')

                # Tabela de estatísticas agregadas (cache)
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS persona_stats_cache (
                        persona_id TEXT PRIMARY KEY,
                        total_interactions INTEGER DEFAULT 0,
                        total_ratings INTEGER DEFAULT 0,
                        total_rating_sum INTEGER DEFAULT 0,
                        average_rating REAL DEFAULT 0.0,
                        success_count INTEGER DEFAULT 0,
                        success_rate REAL DEFAULT 0.0,
                        avg_response_time_ms REAL DEFAULT 0.0,
                        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                # Índices para performance
                conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_interactions_persona_date
                    ON persona_interactions(persona_id, created_at)
                ''')

                conn.execute('''
                    CREATE INDEX IF NOT EXISTS idx_ratings_persona
                    ON persona_ratings(persona_id, created_at)
                ''')

                conn.commit()

        except Exception as e:
            logger.error(f"Erro ao inicializar banco de stats: {e}")

    @contextmanager
    def _get_connection(self):
        """Context manager para conexões SQLite"""
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def record_interaction(
        self,
        persona_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        question_type: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        success: bool = True
    ) -> int:
        """
        Registrar nova interação com persona

        Returns:
            interaction_id para referência futura
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.execute('''
                    INSERT INTO persona_interactions
                    (persona_id, user_id, session_id, question_type, response_time_ms, success)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (persona_id, user_id, session_id, question_type, response_time_ms, success))

                interaction_id = cursor.lastrowid
                conn.commit()

                # Atualizar cache de estatísticas
                self._update_stats_cache(conn, persona_id)

                logger.debug(f"Interação registrada: {persona_id} (ID: {interaction_id})")
                return interaction_id

        except Exception as e:
            logger.error(f"Erro ao registrar interação: {e}")
            return 0

    def record_rating(
        self,
        persona_id: str,
        rating: int,
        user_id: Optional[str] = None,
        feedback_text: Optional[str] = None,
        interaction_id: Optional[int] = None
    ) -> bool:
        """Registrar rating/feedback para persona"""
        try:
            if not (1 <= rating <= 5):
                logger.warning(f"Rating inválido: {rating}")
                return False

            with self._get_connection() as conn:
                conn.execute('''
                    INSERT INTO persona_ratings
                    (persona_id, user_id, rating, feedback_text, interaction_id)
                    VALUES (?, ?, ?, ?, ?)
                ''', (persona_id, user_id, rating, feedback_text, interaction_id))

                conn.commit()

                # Atualizar cache de estatísticas
                self._update_stats_cache(conn, persona_id)

                logger.debug(f"Rating registrado: {persona_id} = {rating}")
                return True

        except Exception as e:
            logger.error(f"Erro ao registrar rating: {e}")
            return False

    def _update_stats_cache(self, conn, persona_id: str):
        """Atualizar cache de estatísticas para persona"""
        try:
            # Calcular estatísticas das interações
            interaction_stats = conn.execute('''
                SELECT
                    COUNT(*) as total_interactions,
                    COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
                    AVG(response_time_ms) as avg_response_time
                FROM persona_interactions
                WHERE persona_id = ?
            ''', (persona_id,)).fetchone()

            # Calcular estatísticas de ratings
            rating_stats = conn.execute('''
                SELECT
                    COUNT(*) as total_ratings,
                    SUM(rating) as total_rating_sum,
                    AVG(rating) as average_rating
                FROM persona_ratings
                WHERE persona_id = ?
            ''', (persona_id,)).fetchone()

            # Calcular taxa de sucesso
            total_interactions = interaction_stats['total_interactions'] or 0
            success_count = interaction_stats['success_count'] or 0
            success_rate = (success_count / total_interactions * 100) if total_interactions > 0 else 0.0

            # Atualizar cache
            conn.execute('''
                INSERT OR REPLACE INTO persona_stats_cache
                (persona_id, total_interactions, total_ratings, total_rating_sum,
                 average_rating, success_count, success_rate, avg_response_time_ms, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                persona_id,
                total_interactions,
                rating_stats['total_ratings'] or 0,
                rating_stats['total_rating_sum'] or 0,
                rating_stats['average_rating'] or 0.0,
                success_count,
                success_rate,
                interaction_stats['avg_response_time'] or 0.0
            ))

        except Exception as e:
            logger.error(f"Erro ao atualizar cache de stats: {e}")

    def get_persona_stats(self, persona_id: str) -> Dict:
        """Obter estatísticas completas de uma persona"""
        try:
            with self._get_connection() as conn:
                # Buscar do cache primeiro
                cached_stats = conn.execute('''
                    SELECT * FROM persona_stats_cache WHERE persona_id = ?
                ''', (persona_id,)).fetchone()

                if cached_stats:
                    return {
                        'total_interactions': cached_stats['total_interactions'],
                        'average_rating': round(cached_stats['average_rating'], 2),
                        'success_rate': round(cached_stats['success_rate'], 2),
                        'total_ratings': cached_stats['total_ratings'],
                        'avg_response_time_ms': round(cached_stats['avg_response_time_ms'] or 0, 0),
                        'last_updated': cached_stats['last_updated']
                    }

                # Se não existe cache, criar entrada inicial
                self._update_stats_cache(conn, persona_id)
                conn.commit()

                return {
                    'total_interactions': 0,
                    'average_rating': 0.0,
                    'success_rate': 0.0,
                    'total_ratings': 0,
                    'avg_response_time_ms': 0.0,
                    'last_updated': datetime.now().isoformat()
                }

        except Exception as e:
            logger.error(f"Erro ao obter stats da persona: {e}")
            return {
                'total_interactions': 0,
                'average_rating': 0.0,
                'success_rate': 0.0,
                'error': 'stats_unavailable'
            }

    def get_all_personas_stats(self) -> Dict[str, Dict]:
        """Obter estatísticas de todas as personas"""
        try:
            with self._get_connection() as conn:
                stats = conn.execute('''
                    SELECT * FROM persona_stats_cache ORDER BY total_interactions DESC
                ''').fetchall()

                result = {}
                for stat in stats:
                    result[stat['persona_id']] = {
                        'total_interactions': stat['total_interactions'],
                        'average_rating': round(stat['average_rating'], 2),
                        'success_rate': round(stat['success_rate'], 2),
                        'total_ratings': stat['total_ratings'],
                        'avg_response_time_ms': round(stat['avg_response_time_ms'] or 0, 0),
                        'last_updated': stat['last_updated']
                    }

                return result

        except Exception as e:
            logger.error(f"Erro ao obter stats de todas personas: {e}")
            return {}

    def get_usage_trends(self, persona_id: str, days: int = 30) -> Dict:
        """Obter tendências de uso da persona"""
        try:
            with self._get_connection() as conn:
                # Dados dos últimos N dias
                start_date = (datetime.now() - timedelta(days=days)).isoformat()

                daily_stats = conn.execute('''
                    SELECT
                        DATE(created_at) as date,
                        COUNT(*) as interactions,
                        AVG(response_time_ms) as avg_response_time,
                        COUNT(CASE WHEN success = 1 THEN 1 END) as successes
                    FROM persona_interactions
                    WHERE persona_id = ? AND created_at >= ?
                    GROUP BY DATE(created_at)
                    ORDER BY date
                ''', (persona_id, start_date)).fetchall()

                # Ratings no período
                rating_trends = conn.execute('''
                    SELECT
                        DATE(created_at) as date,
                        AVG(rating) as avg_rating,
                        COUNT(*) as rating_count
                    FROM persona_ratings
                    WHERE persona_id = ? AND created_at >= ?
                    GROUP BY DATE(created_at)
                    ORDER BY date
                ''', (persona_id, start_date)).fetchall()

                return {
                    'period_days': days,
                    'daily_interactions': [
                        {
                            'date': row['date'],
                            'interactions': row['interactions'],
                            'avg_response_time': row['avg_response_time'],
                            'success_rate': (row['successes'] / row['interactions'] * 100) if row['interactions'] > 0 else 0
                        }
                        for row in daily_stats
                    ],
                    'daily_ratings': [
                        {
                            'date': row['date'],
                            'avg_rating': round(row['avg_rating'], 2),
                            'rating_count': row['rating_count']
                        }
                        for row in rating_trends
                    ]
                }

        except Exception as e:
            logger.error(f"Erro ao obter tendências: {e}")
            return {'period_days': days, 'daily_interactions': [], 'daily_ratings': []}

    def cleanup_old_data(self, days_to_keep: int = 90) -> int:
        """Limpar dados antigos do banco"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).isoformat()

            with self._get_connection() as conn:
                # Limpar interações antigas
                cursor = conn.execute('''
                    DELETE FROM persona_interactions WHERE created_at < ?
                ''', (cutoff_date,))

                deleted_interactions = cursor.rowcount

                # Limpar ratings antigos
                conn.execute('''
                    DELETE FROM persona_ratings WHERE created_at < ?
                ''', (cutoff_date,))

                # Recalcular cache após limpeza
                personas = conn.execute('''
                    SELECT DISTINCT persona_id FROM persona_stats_cache
                ''').fetchall()

                for persona in personas:
                    self._update_stats_cache(conn, persona['persona_id'])

                conn.commit()

                logger.info(f"Limpeza concluída: {deleted_interactions} interações removidas")
                return deleted_interactions

        except Exception as e:
            logger.error(f"Erro na limpeza: {e}")
            return 0

# Instância global
_stats_manager = None

def get_persona_stats_manager() -> PersonaStatsManager:
    """Obter instância singleton do stats manager"""
    global _stats_manager
    if _stats_manager is None:
        _stats_manager = PersonaStatsManager()
    return _stats_manager

# Funções de conveniência para usar nos blueprints
def record_persona_interaction(persona_id: str, **kwargs) -> int:
    """Registrar interação com persona"""
    manager = get_persona_stats_manager()
    return manager.record_interaction(persona_id, **kwargs)

def record_persona_rating(persona_id: str, rating: int, **kwargs) -> bool:
    """Registrar rating para persona"""
    manager = get_persona_stats_manager()
    return manager.record_rating(persona_id, rating, **kwargs)

def get_persona_statistics(persona_id: str) -> Dict:
    """Obter estatísticas de uma persona"""
    manager = get_persona_stats_manager()
    return manager.get_persona_stats(persona_id)

def get_all_persona_statistics() -> Dict[str, Dict]:
    """Obter estatísticas de todas as personas"""
    manager = get_persona_stats_manager()
    return manager.get_all_personas_stats()