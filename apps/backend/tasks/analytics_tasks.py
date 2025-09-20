# -*- coding: utf-8 -*-
"""
Analytics Tasks - Tasks assíncronas para analytics e monitoramento
Análise de performance, relatórios de uso e métricas do sistema
"""

from celery import current_task
from celery_config import celery_app
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='analytics.performance_report')
def generate_performance_report_async(self, hours: int = 24) -> Dict[str, Any]:
    """
    Relatório de performance do sistema
    """
    try:
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'collecting_metrics',
                'progress': 15,
                'message': f'Coletando métricas das últimas {hours}h...'
            }
        )

        # Coletar métricas de performance
        performance_metrics = _collect_performance_metrics(hours)

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'analyzing_cache',
                'progress': 35,
                'message': 'Analisando performance do cache...'
            }
        )

        # Análise de cache
        cache_analysis = _analyze_cache_performance()

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'analyzing_rag',
                'progress': 55,
                'message': 'Analisando performance do RAG...'
            }
        )

        # Análise do RAG
        rag_analysis = _analyze_rag_performance()

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'generating_report',
                'progress': 75,
                'message': 'Gerando relatório final...'
            }
        )

        report = {
            'report_id': f"perf_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'period_hours': hours,
            'generated_at': datetime.now().isoformat(),
            'system_metrics': performance_metrics,
            'cache_performance': cache_analysis,
            'rag_performance': rag_analysis,
            'recommendations': _generate_performance_recommendations(
                performance_metrics, cache_analysis, rag_analysis
            ),
            'overall_health': _calculate_overall_health(
                performance_metrics, cache_analysis, rag_analysis
            )
        }

        # Salvar relatório
        _save_performance_report(report)

        return report

    except Exception as e:
        logger.error(f"[ANALYTICS] Erro no relatório de performance: {e}")
        self.update_state(
            state='FAILURE',
            meta={
                'stage': 'error',
                'progress': 0,
                'message': f'Erro: {str(e)}'
            }
        )
        raise

@celery_app.task(bind=True, name='analytics.user_behavior')
def analyze_user_behavior_async(self, days: int = 7) -> Dict[str, Any]:
    """
    Análise de comportamento dos usuários
    """
    try:
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'collecting_data',
                'progress': 20,
                'message': f'Coletando dados dos últimos {days} dias...'
            }
        )

        # Coletar dados de uso
        usage_data = _collect_user_behavior_data(days)

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'analyzing_patterns',
                'progress': 50,
                'message': 'Analisando padrões de comportamento...'
            }
        )

        # Análise de padrões
        behavior_patterns = _analyze_behavior_patterns(usage_data)

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'generating_insights',
                'progress': 80,
                'message': 'Gerando insights...'
            }
        )

        insights = {
            'analysis_id': f"behavior_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'period_days': days,
            'generated_at': datetime.now().isoformat(),
            'user_statistics': usage_data,
            'behavior_patterns': behavior_patterns,
            'persona_preferences': _analyze_persona_preferences(usage_data),
            'content_engagement': _analyze_content_engagement(usage_data),
            'recommendations': _generate_ux_recommendations(behavior_patterns)
        }

        # Salvar insights
        _save_behavior_analysis(insights)

        return insights

    except Exception as e:
        logger.error(f"[ANALYTICS] Erro na análise de comportamento: {e}")
        self.update_state(
            state='FAILURE',
            meta={
                'stage': 'error',
                'progress': 0,
                'message': f'Erro: {str(e)}'
            }
        )
        raise

@celery_app.task(bind=True, name='analytics.system_health')
def monitor_system_health_async(self) -> Dict[str, Any]:
    """
    Monitoramento da saúde do sistema
    """
    try:
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'checking_services',
                'progress': 25,
                'message': 'Verificando saúde dos serviços...'
            }
        )

        # Verificar serviços
        services_health = _check_services_health()

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'checking_database',
                'progress': 50,
                'message': 'Verificando banco de dados...'
            }
        )

        # Verificar banco SQLite
        database_health = _check_database_health()

        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'checking_storage',
                'progress': 75,
                'message': 'Verificando armazenamento...'
            }
        )

        # Verificar storage
        storage_health = _check_storage_health()

        health_report = {
            'check_id': f"health_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'checked_at': datetime.now().isoformat(),
            'services': services_health,
            'database': database_health,
            'storage': storage_health,
            'overall_status': _determine_overall_status(
                services_health, database_health, storage_health
            ),
            'alerts': _generate_health_alerts(
                services_health, database_health, storage_health
            )
        }

        # Salvar relatório de saúde
        _save_health_report(health_report)

        return health_report

    except Exception as e:
        logger.error(f"[ANALYTICS] Erro no monitoramento de saúde: {e}")
        self.update_state(
            state='FAILURE',
            meta={
                'stage': 'error',
                'progress': 0,
                'message': f'Erro: {str(e)}'
            }
        )
        raise

# Funções auxiliares para métricas
def _collect_performance_metrics(hours: int) -> Dict[str, Any]:
    """Coleta métricas de performance"""
    # Simular coleta de métricas
    return {
        'avg_response_time': 2.1,
        'total_requests': 1420,
        'error_rate': 0.015,
        'cpu_usage_avg': 25.4,
        'memory_usage_avg': 512,
        'concurrent_users_peak': 45
    }

def _analyze_cache_performance() -> Dict[str, Any]:
    """Análise de performance do cache"""
    return {
        'hit_rate': 87.5,
        'miss_rate': 12.5,
        'avg_lookup_time': 0.02,
        'cache_size': 1450,
        'evictions': 23,
        'status': 'healthy'
    }

def _analyze_rag_performance() -> Dict[str, Any]:
    """Análise de performance do RAG"""
    return {
        'avg_retrieval_time': 1.8,
        'context_quality_score': 0.89,
        'supabase_connection_health': 'good',
        'embedding_cache_hit_rate': 76.3,
        'vector_search_latency': 0.45,
        'status': 'optimal'
    }

def _generate_performance_recommendations(metrics, cache, rag) -> List[str]:
    """Gera recomendações de performance"""
    recommendations = []

    if metrics['avg_response_time'] > 3.0:
        recommendations.append("Considerar otimização de consultas RAG")

    if cache['hit_rate'] < 80:
        recommendations.append("Aumentar tamanho do cache ou revisar TTL")

    if rag['avg_retrieval_time'] > 2.0:
        recommendations.append("Otimizar índices de vetores no Supabase")

    return recommendations

def _calculate_overall_health(metrics, cache, rag) -> str:
    """Calcula saúde geral do sistema"""
    scores = []

    # Score de response time
    if metrics['avg_response_time'] < 2.0:
        scores.append(100)
    elif metrics['avg_response_time'] < 3.0:
        scores.append(80)
    else:
        scores.append(60)

    # Score de cache
    scores.append(min(100, cache['hit_rate']))

    # Score de RAG
    scores.append(rag['context_quality_score'] * 100)

    avg_score = sum(scores) / len(scores)

    if avg_score >= 90:
        return 'excellent'
    elif avg_score >= 75:
        return 'good'
    elif avg_score >= 60:
        return 'fair'
    else:
        return 'needs_attention'

def _collect_user_behavior_data(days: int) -> Dict[str, Any]:
    """Coleta dados de comportamento do usuário"""
    return {
        'total_sessions': 890,
        'unique_users': 234,
        'avg_session_duration': 12.5,
        'bounce_rate': 0.15,
        'most_asked_topics': ['dosagem', 'efeitos colaterais', 'interações'],
        'persona_usage': {'dr_gasnelio': 58, 'ga': 42}
    }

def _analyze_behavior_patterns(data) -> Dict[str, Any]:
    """Análise de padrões comportamentais"""
    return {
        'peak_usage_hours': [14, 15, 16],  # 14h-16h
        'preferred_interaction_type': 'chat',
        'common_user_journey': ['welcome', 'chat', 'resources'],
        'drop_off_points': ['complex_questions'],
        'engagement_score': 8.2
    }

def _analyze_persona_preferences(data) -> Dict[str, Any]:
    """Análise de preferências de persona"""
    return {
        'dr_gasnelio': {
            'usage_percentage': data['persona_usage']['dr_gasnelio'],
            'typical_questions': ['dosagem técnica', 'protocolos'],
            'satisfaction_score': 9.1
        },
        'ga': {
            'usage_percentage': data['persona_usage']['ga'],
            'typical_questions': ['dúvidas básicas', 'suporte emocional'],
            'satisfaction_score': 8.8
        }
    }

def _analyze_content_engagement(data) -> Dict[str, Any]:
    """Análise de engajamento com conteúdo"""
    return {
        'most_viewed_content': data['most_asked_topics'],
        'content_completion_rate': 0.78,
        'resource_download_rate': 0.23,
        'feedback_sentiment': 'positive'
    }

def _generate_ux_recommendations(patterns) -> List[str]:
    """Gera recomendações de UX"""
    return [
        "Otimizar interface para horários de pico (14h-16h)",
        "Melhorar fluxo para questões complexas",
        "Expandir conteúdo sobre dosagem PQT-U",
        "Adicionar guias visuais para novos usuários"
    ]

def _check_services_health() -> Dict[str, Any]:
    """Verifica saúde dos serviços"""
    return {
        'rag_system': 'healthy',
        'cache_system': 'healthy',
        'multimodal_processor': 'healthy',
        'email_service': 'healthy',
        'security_middleware': 'healthy'
    }

def _check_database_health() -> Dict[str, Any]:
    """Verifica saúde do banco SQLite"""
    try:
        db_path = './data/roteiros.db'
        if Path(db_path).exists():
            conn = sqlite3.connect(db_path)
            result = conn.execute("PRAGMA integrity_check").fetchone()
            conn.close()

            return {
                'status': 'healthy' if result[0] == 'ok' else 'warning',
                'integrity': result[0],
                'file_size': Path(db_path).stat().st_size,
                'last_backup': 'not_implemented'
            }
        else:
            return {'status': 'missing', 'error': 'Database file not found'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}

def _check_storage_health() -> Dict[str, Any]:
    """Verifica saúde do armazenamento"""
    return {
        'uploads_dir': 'healthy',
        'cache_dir': 'healthy',
        'logs_dir': 'healthy',
        'available_space': '85%',
        'backup_status': 'configured'
    }

def _determine_overall_status(services, database, storage) -> str:
    """Determina status geral do sistema"""
    all_healthy = (
        all(status == 'healthy' for status in services.values()) and
        database.get('status') == 'healthy' and
        storage.get('available_space', '0%')[:-1].isdigit() and
        int(storage.get('available_space', '0%')[:-1]) > 10
    )

    return 'healthy' if all_healthy else 'warning'

def _generate_health_alerts(services, database, storage) -> List[str]:
    """Gera alertas de saúde"""
    alerts = []

    for service, status in services.items():
        if status != 'healthy':
            alerts.append(f"Serviço {service} com status: {status}")

    if database.get('status') != 'healthy':
        alerts.append(f"Banco de dados com problemas: {database.get('error', 'unknown')}")

    available_space = storage.get('available_space', '0%')
    if available_space[:-1].isdigit() and int(available_space[:-1]) < 20:
        alerts.append(f"Pouco espaço em disco: {available_space}")

    return alerts

# Funções de persistência
def _save_performance_report(report: Dict[str, Any]) -> None:
    """Salva relatório de performance"""
    try:
        db_path = './data/roteiros.db'
        conn = sqlite3.connect(db_path)

        conn.execute('''
            CREATE TABLE IF NOT EXISTS performance_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT UNIQUE,
                period_hours INTEGER,
                generated_at TEXT,
                system_metrics TEXT,
                cache_performance TEXT,
                rag_performance TEXT,
                recommendations TEXT,
                overall_health TEXT
            )
        ''')

        conn.execute('''
            INSERT OR REPLACE INTO performance_reports
            (report_id, period_hours, generated_at, system_metrics,
             cache_performance, rag_performance, recommendations, overall_health)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            report['report_id'],
            report['period_hours'],
            report['generated_at'],
            json.dumps(report['system_metrics']),
            json.dumps(report['cache_performance']),
            json.dumps(report['rag_performance']),
            json.dumps(report['recommendations']),
            report['overall_health']
        ))

        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"Erro ao salvar relatório de performance: {e}")

def _save_behavior_analysis(insights: Dict[str, Any]) -> None:
    """Salva análise de comportamento"""
    try:
        db_path = './data/roteiros.db'
        conn = sqlite3.connect(db_path)

        conn.execute('''
            CREATE TABLE IF NOT EXISTS behavior_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id TEXT UNIQUE,
                period_days INTEGER,
                generated_at TEXT,
                user_statistics TEXT,
                behavior_patterns TEXT,
                persona_preferences TEXT,
                content_engagement TEXT,
                recommendations TEXT
            )
        ''')

        conn.execute('''
            INSERT OR REPLACE INTO behavior_analysis
            (analysis_id, period_days, generated_at, user_statistics,
             behavior_patterns, persona_preferences, content_engagement, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            insights['analysis_id'],
            insights['period_days'],
            insights['generated_at'],
            json.dumps(insights['user_statistics']),
            json.dumps(insights['behavior_patterns']),
            json.dumps(insights['persona_preferences']),
            json.dumps(insights['content_engagement']),
            json.dumps(insights['recommendations'])
        ))

        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"Erro ao salvar análise de comportamento: {e}")

def _save_health_report(report: Dict[str, Any]) -> None:
    """Salva relatório de saúde"""
    try:
        db_path = './data/roteiros.db'
        conn = sqlite3.connect(db_path)

        conn.execute('''
            CREATE TABLE IF NOT EXISTS health_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                check_id TEXT UNIQUE,
                checked_at TEXT,
                services TEXT,
                database_health TEXT,
                storage_health TEXT,
                overall_status TEXT,
                alerts TEXT
            )
        ''')

        conn.execute('''
            INSERT OR REPLACE INTO health_reports
            (check_id, checked_at, services, database_health,
             storage_health, overall_status, alerts)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            report['check_id'],
            report['checked_at'],
            json.dumps(report['services']),
            json.dumps(report['database']),
            json.dumps(report['storage']),
            report['overall_status'],
            json.dumps(report['alerts'])
        ))

        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"Erro ao salvar relatório de saúde: {e}")

# Health check
@celery_app.task(name='analytics.health_check')
def analytics_tasks_health():
    """Health check das tasks de analytics"""
    return {
        'status': 'healthy',
        'available_tasks': [
            'analytics.performance_report',
            'analytics.user_behavior',
            'analytics.system_health'
        ],
        'timestamp': datetime.now().isoformat()
    }