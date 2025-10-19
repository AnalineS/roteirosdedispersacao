# -*- coding: utf-8 -*-
"""
Warning Suppression System
Sistema de supressão inteligente de warnings para desenvolvimento limpo
"""

import logging
import warnings
import os
import functools
from typing import Dict, List, Set, Optional, Callable
from contextlib import contextmanager


class WarningFilter(logging.Filter):
    """Filtro inteligente de warnings baseado em contexto"""

    def __init__(self, suppressed_patterns: Set[str], environment: str = "development"):
        super().__init__()
        self.suppressed_patterns = suppressed_patterns
        self.environment = environment
        self.debug_mode = os.environ.get('DEBUG', 'false').lower() == 'true'

    def filter(self, record: logging.LogRecord) -> bool:
        """Filtra warnings baseado em padrões e contexto"""

        # Sempre permitir logs de ERROR e CRITICAL
        if record.levelno >= logging.ERROR:
            return True

        # Em produção, ser mais restritivo
        if self.environment == "production":
            if record.levelno == logging.WARNING:
                message = getattr(record, 'getMessage', lambda: str(record.msg))()
                # Só suprimir warnings conhecidos e seguros
                for pattern in self.suppressed_patterns:
                    if pattern in message:
                        return False
                return True

        # Em desenvolvimento, suprimir warnings conhecidos
        if record.levelno == logging.WARNING:
            message = getattr(record, 'getMessage', lambda: str(record.msg))()
            for pattern in self.suppressed_patterns:
                if pattern in message:
                    return False

        return True


class WarningSuppressionManager:
    """Gerenciador central de supressão de warnings"""

    def __init__(self, environment: str = None):
        self.environment = environment or os.environ.get('ENVIRONMENT', 'development')
        self.suppressed_patterns: Set[str] = set()
        self.critical_patterns: Set[str] = set()
        self.setup_default_patterns()

    def setup_default_patterns(self):
        """Define padrões padrão de supressão"""

        # Warnings seguros para suprimir em desenvolvimento
        dev_safe_patterns = {
            # Módulos opcionais/fallback
            "No module named 'services.vector_store'",
            "No module named 'services.embedding_service'",
            "No module named 'services.enhanced_rag_system'",

            # API keys em desenvolvimento
            "Nenhuma API key configurada - apenas fallbacks disponíveis",
            "API key não configurada",

            # Cloud services em desenvolvimento
            "Erro ao inicializar clientes cloud",
            "Your default credentials were not found",
            "Cloud Storage não disponível",
            "Supabase não configurado",

            # Serviços opcionais
            "Embedding service não disponível",
            "Vector store não disponível",
            "Dependências não disponíveis para Celery tasks",

            # Deprecated warnings conhecidos
            "check_rate_limit() DEPRECATED",

            # Development server warnings
            "Development server",
            "Do not use it in a production deployment",
        }

        # Patterns que NUNCA devem ser suprimidos
        critical_patterns = {
            "Security",
            "Authentication failed",
            "Database connection failed",
            "Critical system error",
            "Memory limit exceeded",
            "Permission denied",
        }

        if self.environment == "development":
            self.suppressed_patterns.update(dev_safe_patterns)

        self.critical_patterns.update(critical_patterns)

    def add_suppression_pattern(self, pattern: str):
        """Adiciona padrão de supressão"""
        self.suppressed_patterns.add(pattern)

    def remove_suppression_pattern(self, pattern: str):
        """Remove padrão de supressão"""
        self.suppressed_patterns.discard(pattern)

    def add_critical_pattern(self, pattern: str):
        """Adiciona padrão crítico (nunca suprimir)"""
        self.critical_patterns.add(pattern)

    def is_critical_warning(self, message: str) -> bool:
        """Verifica se warning é crítico"""
        return any(pattern in message for pattern in self.critical_patterns)

    def should_suppress(self, message: str, level: int) -> bool:
        """Determina se warning deve ser suprimido"""

        # Nunca suprimir críticos
        if self.is_critical_warning(message):
            return False

        # Nunca suprimir ERROR e acima
        if level >= logging.ERROR:
            return False

        # Verificar padrões de supressão
        if level == logging.WARNING:
            return any(pattern in message for pattern in self.suppressed_patterns)

        return False

    def setup_filters(self):
        """Configura filtros no sistema de logging"""

        # Configurar filtro para root logger
        root_logger = logging.getLogger()
        warning_filter = WarningFilter(self.suppressed_patterns, self.environment)

        # Remover filtros existentes do mesmo tipo
        for handler in root_logger.handlers:
            handler.filters = [f for f in handler.filters if not isinstance(f, WarningFilter)]
            handler.addFilter(warning_filter)

    @contextmanager
    def suppress_warnings(self, additional_patterns: Optional[List[str]] = None):
        """Context manager para supressão temporária"""

        original_patterns = self.suppressed_patterns.copy()

        if additional_patterns:
            self.suppressed_patterns.update(additional_patterns)

        try:
            self.setup_filters()
            yield
        finally:
            self.suppressed_patterns = original_patterns
            self.setup_filters()


def suppress_known_warnings(func: Callable) -> Callable:
    """Decorator para suprimir warnings conhecidos em função"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        manager = WarningSuppressionManager()
        with manager.suppress_warnings():
            return func(*args, **kwargs)

    return wrapper


class PythonWarningManager:
    """Gerenciador de warnings do Python warnings module"""

    @staticmethod
    def suppress_deprecation_warnings():
        """Suprime warnings de deprecação conhecidos"""
        warnings.filterwarnings("ignore", category=DeprecationWarning)
        warnings.filterwarnings("ignore", category=PendingDeprecationWarning)

    @staticmethod
    def suppress_import_warnings():
        """Suprime warnings de import conhecidos"""
        warnings.filterwarnings("ignore", message=".*No module named.*")
        warnings.filterwarnings("ignore", message=".*Failed to import.*")

    @staticmethod
    def setup_development_suppressions():
        """Configura supressões para desenvolvimento"""
        PythonWarningManager.suppress_deprecation_warnings()
        PythonWarningManager.suppress_import_warnings()

        # Suprimir warnings específicos de dependências
        warnings.filterwarnings("ignore", message=".*google.cloud.*")
        warnings.filterwarnings("ignore", message=".*supabase.*")
        warnings.filterwarnings("ignore", message=".*openai.*")


def configure_warning_suppression(environment: str = None, enable_debug: bool = False):
    """Função principal para configurar supressão de warnings"""

    environment = environment or os.environ.get('ENVIRONMENT', 'development')

    # Configurar gerenciador de warnings
    manager = WarningSuppressionManager(environment)
    manager.setup_filters()

    # Configurar warnings do Python
    if environment == "development":
        PythonWarningManager.setup_development_suppressions()

    # Log de inicialização (só em debug)
    if enable_debug:
        logger = logging.getLogger(__name__)
        logger.info(f"Warning suppression configured for {environment} environment")
        logger.debug(f"Suppressed patterns: {len(manager.suppressed_patterns)}")

    return manager


# Instância global para reutilização
_global_manager: Optional[WarningSuppressionManager] = None


def get_warning_manager() -> WarningSuppressionManager:
    """Obtém instância global do gerenciador"""
    global _global_manager
    if _global_manager is None:
        _global_manager = configure_warning_suppression()
    return _global_manager