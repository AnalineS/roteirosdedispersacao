#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuração Celery - Sistema Hanseníase Chat
Configuração usando SQLite + Google Cloud Storage (Redis removido)
"""

from celery import Celery
import os

# Configuração Celery OTIMIZADA - SQLite + Cloud Storage
# Redis completamente removido - usa apenas SQLite para persistência

# Configuração SQLite + filesystem (compatível com Cloud Run)
CELERY_BROKER_URL = 'sqlalchemy+sqlite:///./data/celery_broker.db'
CELERY_RESULT_BACKEND = 'db+sqlite:///./data/celery_results.db'
BROKER_TYPE = "sqlite"

# Criar instância Celery OTIMIZADA
celery_app = Celery(
    'roteiro_dispensacao_medical',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=['tasks.chat_tasks', 'tasks.medical_tasks', 'tasks.analytics_tasks']  # Múltiplas tasks
)

# Log da configuração escolhida
import logging
logger = logging.getLogger(__name__)
logger.info(f"[CELERY] Broker configurado: {BROKER_TYPE}")
logger.info(f"[CELERY] Tasks disponíveis: chat, medical, analytics")

# Configurações otimizadas para sistema médico
celery_app.conf.update(
    # Serialização segura
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
    
    # Timeouts para sistema médico OTIMIZADOS
    task_time_limit=45,  # 45s máximo por task (RAG + AI pode demorar)
    task_soft_time_limit=35,  # Warning em 35s
    
    # Retry policy para confiabilidade
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Performance
    worker_prefetch_multiplier=1,  # Um task por worker por vez
    task_compression='gzip',
    
    # Logging estruturado
    worker_log_format='[%(asctime)s: %(levelname)s/%(processName)s] %(message)s',
    worker_task_log_format='[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s',
    
    # Cleanup automático
    result_expires=3600,  # Resultados expiram em 1h
    
    # Routing EXPANDIDO para múltiplas funcionalidades
    task_routes={
        'tasks.chat_tasks.*': {'queue': 'medical_chat'},
        'tasks.medical_tasks.*': {'queue': 'medical_processing'},
        'tasks.analytics_tasks.*': {'queue': 'analytics'},
        'tasks.email_tasks.*': {'queue': 'notifications'},
    },
    
    # Monitoring
    task_send_sent_event=True,
    worker_send_task_events=True,
)

# Configurações específicas por ambiente
environment = os.getenv('ENVIRONMENT', 'development')
if environment == 'production':
    # Produção: mais workers, mais tempo
    celery_app.conf.update(
        worker_concurrency=4,
        task_time_limit=45,
    )
else:
    # Dev: menos recursos, mais logs
    celery_app.conf.update(
        worker_concurrency=2,
        task_time_limit=20,
        worker_log_level='INFO',
    )

# Health check task para monitoramento
@celery_app.task(name='celery.ping')
def celery_health_check():
    """Task simples para verificar saúde do Celery"""
    return {
        'status': 'healthy',
        'timestamp': str(__import__('datetime').datetime.now()),
        'worker': celery_app.control.inspect().active(),
    }

if __name__ == '__main__':
    celery_app.start()