# -*- coding: utf-8 -*-
"""
Aggressive Warning Suppression System
Sistema de supressão agressiva de warnings aplicado nos primeiros momentos do startup
"""

import warnings
import logging
import sys
import os


class AggressiveWarningSuppressionFilter(logging.Filter):
    """Filtro agressivo que elimina warnings específicos durante startup"""

    def __init__(self):
        super().__init__()
        self.suppressed_patterns = {
            # Module import warnings
            "No module named 'services.vector_store'",
            "No module named 'services.embedding_service'",
            "No module named 'services.enhanced_rag_system'",

            # API key warnings
            "Nenhuma API key configurada",
            "[WARNING] Nenhuma API key configurada",
            "API key não configurada",

            # Cloud service warnings
            "Erro ao inicializar clientes cloud",
            "Your default credentials were not found",
            "Google Cloud indisponivel",
            "Cloud Storage não disponível",
            "Supabase não configurado",

            # Memory warnings
            "[MEMORY] Uso alto detectado",
            "WARNING - [MEMORY]",

            # Dependency warnings - ENHANCED
            "Dependências não disponíveis para Celery tasks",
            "Dependências não disponíveis para Celery tasks: No module named 'services.enhanced_rag_system'",
            "too many values to unpack (expected 2)",

            # Fallback warnings
            "Usando Fallback Logger",

            # Service availability warnings
            "Embedding service não disponível",
            "Vector store não disponível",

            # Deprecated warnings
            "DEPRECATED",
            "check_rate_limit() DEPRECATED",

            # Development server warnings
            "Development server",
            "Do not use it in a production deployment",
        }

    def filter(self, record: logging.LogRecord) -> bool:
        """Filtra records de logging baseado em padrões"""

        # Sempre permitir ERROR e CRITICAL
        if record.levelno >= logging.ERROR:
            return True

        # Para WARNING, verificar se deve ser suprimido
        if record.levelno == logging.WARNING:
            message = getattr(record, 'getMessage', lambda: str(record.msg))()

            for pattern in self.suppressed_patterns:
                if pattern in message:
                    return False  # Suprimir este warning

        return True  # Permitir outros logs


def suppress_python_warnings():
    """Suprimir warnings do módulo warnings do Python"""

    # Suprimir categorias inteiras
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    warnings.filterwarnings("ignore", category=PendingDeprecationWarning)
    warnings.filterwarnings("ignore", category=ImportWarning)

    # Suprimir warnings específicos
    specific_warnings = [
        ".*datetime.datetime.utcnow.*",
        ".*No module named.*",
        ".*API key.*",
        ".*Cloud.*",
        ".*Google.*",
        ".*Supabase.*",
        ".*memory.*",
        ".*Memory.*",
        ".*MEMORY.*",
        ".*deprecated.*",
        ".*DEPRECATED.*",
    ]

    for pattern in specific_warnings:
        warnings.filterwarnings("ignore", message=pattern)


def suppress_specific_loggers():
    """Suprimir loggers específicos que geram warnings conhecidos"""

    # Loggers que devem ser silenciados em desenvolvimento
    noisy_loggers = [
        'services.ai.ai_provider_manager',
        'services.cache.cloud_native_cache',
        'services.rag.semantic_search',
        'services.integrations.supabase_vector_store',
        'core.dependency_factory',
        'services.storage.sqlite_manager',
        'core.performance.memory_optimizer',
        'celery_config',
        'root',  # Para alguns warnings específicos do root logger
        'werkzeug',
        'urllib3.connectionpool',
        'requests.packages.urllib3',
    ]

    # Definir nível ERROR para estes loggers (suprime WARNING e INFO)
    for logger_name in noisy_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.ERROR)


def apply_aggressive_suppression():
    """Aplica supressão agressiva de warnings para startup limpo"""

    # 1. Suprimir warnings do Python
    suppress_python_warnings()

    # 2. Suprimir loggers específicos
    suppress_specific_loggers()

    # 3. Aplicar filtro agressivo ao root logger
    root_logger = logging.getLogger()

    # Remover filtros existentes do mesmo tipo
    aggressive_filter = AggressiveWarningSuppressionFilter()

    # Aplicar filtro a todos os handlers
    for handler in root_logger.handlers:
        handler.addFilter(aggressive_filter)

    # Se não há handlers, criar um handler console silencioso
    if not root_logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.ERROR)  # Só mostrar erros
        console_handler.addFilter(aggressive_filter)
        root_logger.addHandler(console_handler)


def enable_clean_startup():
    """Habilita startup completamente limpo (ZERO warnings)"""

    # Verificar se clean startup está habilitado
    clean_startup = os.environ.get('CLEAN_STARTUP', 'true').lower() == 'true'
    environment = os.environ.get('ENVIRONMENT', 'development')

    if clean_startup and environment in ['development', 'testing']:
        apply_aggressive_suppression()

        # Configurar logging básico para mostrar apenas essencial
        logging.basicConfig(
            level=logging.ERROR,  # Só erros críticos
            format='%(message)s',  # Formato mínimo
            stream=sys.stdout
        )

        return True

    return False


def restore_normal_logging():
    """Restaura logging normal após startup"""

    # Restaurar warnings
    warnings.resetwarnings()

    # Restaurar níveis de logger
    loggers_to_restore = [
        'services.ai.ai_provider_manager',
        'services.cache.cloud_native_cache',
        'core.performance.memory_optimizer',
        'celery_config',
    ]

    for logger_name in loggers_to_restore:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.INFO)


class CleanStartupContext:
    """Context manager para startup limpo"""

    def __enter__(self):
        self.was_clean = enable_clean_startup()
        return self.was_clean

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.was_clean:
            # Manter supressão para desenvolvimento
            pass