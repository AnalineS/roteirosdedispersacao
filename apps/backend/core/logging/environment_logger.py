# -*- coding: utf-8 -*-
"""
Environment-Aware Logging Configuration
Sistema de logging adaptável ao ambiente com supressão inteligente de warnings
"""

import logging
import logging.config
import os
import sys
from typing import Dict, Any, Optional
from datetime import datetime

from .warning_suppressor import configure_warning_suppression, WarningSuppressionManager


class EnvironmentLogger:
    """Configurador de logging baseado em ambiente"""

    def __init__(self, environment: str = None):
        self.environment = environment or os.environ.get('ENVIRONMENT', 'development')
        self.log_level = self._get_log_level()
        self.warning_manager: Optional[WarningSuppressionManager] = None

    def _get_log_level(self) -> str:
        """Determina nível de log baseado no ambiente"""

        # Verificar variável de ambiente específica primeiro
        env_level = os.environ.get('LOG_LEVEL', '').upper()
        if env_level in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']:
            return env_level

        # Níveis padrão por ambiente
        level_map = {
            'development': 'INFO',
            'testing': 'WARNING',
            'staging': 'WARNING',
            'production': 'ERROR'
        }

        return level_map.get(self.environment, 'INFO')

    def _get_log_format(self) -> str:
        """
        Formato de log baseado no ambiente.

        Formatos distintos por ambiente:
        - Production: Estruturado com timestamp completo para análise
        - Development: Minimalista para debug rápido
        - Testing: Conciso para logs de teste
        - Staging: Balanceado entre debug e produção
        """

        format_templates = {
            'production': '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
            'development': '%(levelname)s: %(message)s',
            'testing': '%(levelname)s | %(name)s | %(message)s',
            'staging': '%(asctime)s - %(levelname)-8s - %(name)s - %(message)s',
            'hml': '%(asctime)s - %(levelname)-8s - %(name)s - %(message)s',
            'homologacao': '%(asctime)s - %(levelname)-8s - %(name)s - %(message)s'
        }

        return format_templates.get(self.environment, '%(asctime)s - %(levelname)s - %(name)s - %(message)s')

    def _should_use_clean_startup(self) -> bool:
        """Determina se deve usar startup limpo (sem warnings)"""

        # Clean startup em development e testing
        clean_environments = ['development', 'testing']

        # Verificar flag explícita
        clean_startup = os.environ.get('CLEAN_STARTUP', '').lower() == 'true'

        return self.environment in clean_environments or clean_startup

    def configure_logging(self, enable_warning_suppression: bool = True) -> logging.Logger:
        """
        Configura logging principal do sistema.

        Args:
            enable_warning_suppression: Habilita supressão de warnings em ambientes limpos

        Returns:
            Logger raiz configurado
        """

        # Selecionar formatter baseado no ambiente
        formatter_name = 'development' if self.environment == 'development' else 'standard'

        # Configuração base
        logging_config = {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': {
                'standard': {
                    'format': self._get_log_format(),
                    'datefmt': '%Y-%m-%d %H:%M:%S'
                },
                'development': {
                    'format': '%(levelname)s: %(message)s'
                },
                'production': {
                    'format': self._get_log_format(),
                    'datefmt': '%Y-%m-%d %H:%M:%S.%f'
                }
            },
            'handlers': {
                'console': {
                    'class': 'logging.StreamHandler',
                    'level': self.log_level,
                    'formatter': formatter_name,
                    'stream': sys.stdout
                }
            },
            'loggers': {
                '': {  # Root logger
                    'handlers': ['console'],
                    'level': self.log_level,
                    'propagate': False
                }
            }
        }

        # Aplicar configuração
        logging.config.dictConfig(logging_config)

        # Configurar supressão de warnings se habilitada
        if enable_warning_suppression and self._should_use_clean_startup():
            self.warning_manager = configure_warning_suppression(
                environment=self.environment,
                enable_debug=False
            )

        # Retornar logger raiz configurado
        return logging.getLogger()

    def get_clean_logger(self, name: str) -> logging.Logger:
        """Obtém logger configurado para startup limpo"""

        logger = logging.getLogger(name)

        # Se temos warning manager, aplicar filtros
        if self.warning_manager:
            from .warning_suppressor import WarningFilter
            warning_filter = WarningFilter(
                self.warning_manager.suppressed_patterns,
                self.environment
            )

            for handler in logger.handlers:
                handler.addFilter(warning_filter)

        return logger

    def create_startup_logger(self) -> logging.Logger:
        """Cria logger específico para startup com supressão máxima"""

        startup_logger = logging.getLogger('startup')
        startup_logger.setLevel(logging.ERROR if self._should_use_clean_startup() else logging.INFO)

        # Handler específico para startup
        if not startup_logger.handlers:
            handler = logging.StreamHandler(sys.stdout)

            if self._should_use_clean_startup():
                # Formato mínimo para startup limpo
                formatter = logging.Formatter('%(message)s')
            else:
                # Formato padrão
                formatter = logging.Formatter(self._get_log_format())

            handler.setFormatter(formatter)
            startup_logger.addHandler(handler)
            startup_logger.propagate = False

        return startup_logger

    def suppress_third_party_warnings(self):
        """Suprime warnings de bibliotecas third-party"""

        # Bibliotecas conhecidas que geram warnings desnecessários
        noisy_loggers = [
            'urllib3.connectionpool',
            'requests.packages.urllib3',
            'google.auth',
            'google.cloud',
            'supabase',
            'openai',
            'werkzeug',
            'flask.app'
        ]

        for logger_name in noisy_loggers:
            logger = logging.getLogger(logger_name)
            if self._should_use_clean_startup():
                logger.setLevel(logging.ERROR)
            else:
                logger.setLevel(logging.WARNING)

    def configure_development_logging(self) -> Dict[str, Any]:
        """Configuração específica para desenvolvimento"""

        config = {
            'clean_startup': True,
            'suppress_third_party': True,
            'minimal_format': True,
            'filter_known_warnings': True,
            'show_only_errors': self.environment == 'development'
        }

        return config

    def configure_production_logging(self) -> Dict[str, Any]:
        """Configuração específica para produção"""

        config = {
            'clean_startup': False,
            'suppress_third_party': False,
            'structured_format': True,
            'preserve_all_warnings': True,
            'detailed_errors': True
        }

        return config

    def log_environment_info(self, logger: logging.Logger):
        """Log informações do ambiente (só se necessário)"""

        if not self._should_use_clean_startup():
            logger.info(f"Environment: {self.environment}")
            logger.info(f"Log Level: {self.log_level}")
            logger.info(f"Clean Startup: {self._should_use_clean_startup()}")


class StartupLogger:
    """Logger especializado para startup limpo"""

    def __init__(self, environment: str = None):
        self.environment = environment or os.environ.get('ENVIRONMENT', 'development')
        self.show_startup_info = not self._is_clean_environment()

    def _is_clean_environment(self) -> bool:
        """Verifica se ambiente deve ter startup limpo"""
        clean_envs = ['development', 'testing']
        clean_startup = os.environ.get('CLEAN_STARTUP', '').lower() == 'true'
        return self.environment in clean_envs or clean_startup

    def log_startup_begin(self):
        """Log início do startup (só se necessário)"""
        if self.show_startup_info:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting application...")

    def log_startup_complete(self, host: str, port: int):
        """Log conclusão do startup"""
        if self.show_startup_info:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Server running on {host}:{port}")
        else:
            # Apenas informação essencial
            print(f"Server ready on {host}:{port}")

    def log_component_status(self, component: str, status: str, show_details: bool = False):
        """Log status de componente (condicional)"""
        if self.show_startup_info or (status == "ERROR"):
            if show_details:
                print(f"  {component}: {status}")

    def log_error(self, message: str):
        """Log erro (sempre mostrar)"""
        print(f"ERROR: {message}")

    def log_warning(self, message: str):
        """Log warning (só se necessário)"""
        if self.show_startup_info:
            print(f"WARNING: {message}")


def setup_environment_logging(environment: str = None,
                            enable_clean_startup: bool = None) -> tuple[logging.Logger, StartupLogger]:
    """Função principal para configurar logging do ambiente"""

    env = environment or os.environ.get('ENVIRONMENT', 'development')

    # Configurar environment logger
    env_logger = EnvironmentLogger(env)
    main_logger = env_logger.configure_logging(
        enable_warning_suppression=enable_clean_startup if enable_clean_startup is not None
                                  else env_logger._should_use_clean_startup()
    )

    # Suprimir third-party warnings se necessário
    if env_logger._should_use_clean_startup():
        env_logger.suppress_third_party_warnings()

    # Criar startup logger
    startup_logger = StartupLogger(env)

    return main_logger, startup_logger


# Instâncias globais para reutilização
_main_logger: Optional[logging.Logger] = None
_startup_logger: Optional[StartupLogger] = None


def get_environment_logger() -> logging.Logger:
    """Obtém logger principal configurado"""
    global _main_logger
    if _main_logger is None:
        _main_logger, _ = setup_environment_logging()
    return _main_logger


def get_startup_logger() -> StartupLogger:
    """Obtém startup logger configurado"""
    global _startup_logger
    if _startup_logger is None:
        _, _startup_logger = setup_environment_logging()
    return _startup_logger