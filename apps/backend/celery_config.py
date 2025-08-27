#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuração Celery - Sistema Hanseníase Chat
Configuração segura usando Redis existente em DBs separadas
"""

from celery import Celery
import os
from app_config import config

# Configuração Redis para Celery (DBs separadas do cache)
# Usar os secrets do GitHub Actions
REDIS_PUBLIC_ENDPOINT = os.getenv('REDIS_PUBLIC_ENDPOINT', 'localhost:6379')
REDIS_ACCOUNT_KEY = os.getenv('REDIS_ACCOUNT_KEY', '')
REDIS_DATABASE_NAME = os.getenv('REDIS_DATABASE_NAME', '0')

# Construir URL do Redis baseado nos secrets disponíveis
if REDIS_ACCOUNT_KEY:
    # Formato para Redis Cloud/Azure com auth
    REDIS_URL = f"redis://:{REDIS_ACCOUNT_KEY}@{REDIS_PUBLIC_ENDPOINT}"
else:
    # Formato local sem auth
    REDIS_URL = f"redis://{REDIS_PUBLIC_ENDPOINT}"

# DBs separadas para não conflitar com cache
CELERY_BROKER_URL = f"{REDIS_URL}/2"  # DB 2 para filas
CELERY_RESULT_BACKEND = f"{REDIS_URL}/3"  # DB 3 para resultados

# Criar instância Celery
celery_app = Celery(
    'hanseniase_chat',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=['tasks.chat_tasks']  # Tasks serão criadas aqui
)

# Configurações otimizadas para sistema médico
celery_app.conf.update(
    # Serialização segura
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
    
    # Timeouts para sistema médico
    task_time_limit=30,  # 30s máximo por task
    task_soft_time_limit=25,  # Warning em 25s
    
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
    
    # Routing simples
    task_routes={
        'tasks.chat_tasks.*': {'queue': 'medical_chat'},
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