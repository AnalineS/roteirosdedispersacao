# -*- coding: utf-8 -*-
"""
Logging Module with Warning Suppression
Sistema integrado de logging com supressão inteligente de warnings
"""

from .warning_suppressor import (
    WarningSuppressionManager,
    configure_warning_suppression,
    get_warning_manager,
    suppress_known_warnings
)

from .environment_logger import (
    EnvironmentLogger,
    StartupLogger,
    setup_environment_logging,
    get_environment_logger,
    get_startup_logger
)

from .warning_config import (
    WarningConfigManager,
    DevelopmentWarningConfig,
    ProductionWarningConfig,
    configure_warnings_for_environment,
    integrate_with_warning_suppressor
)


def initialize_clean_logging(environment: str = None, enable_clean_startup: bool = None):
    """
    Função principal para inicializar logging limpo

    Returns:
        tuple: (main_logger, startup_logger, warning_manager)
    """

    # 1. Configurar warnings por ambiente
    warning_config = configure_warnings_for_environment(environment)

    # 2. Configurar logging ambiente-aware
    main_logger, startup_logger = setup_environment_logging(
        environment=environment,
        enable_clean_startup=enable_clean_startup
    )

    # 3. Integrar sistemas de warning
    warning_manager = get_warning_manager()
    integrate_with_warning_suppressor(warning_config, warning_manager)

    return main_logger, startup_logger, warning_manager


__all__ = [
    'WarningSuppressionManager',
    'EnvironmentLogger',
    'StartupLogger',
    'WarningConfigManager',
    'DevelopmentWarningConfig',
    'ProductionWarningConfig',
    'initialize_clean_logging',
    'configure_warning_suppression',
    'setup_environment_logging',
    'get_warning_manager',
    'get_environment_logger',
    'get_startup_logger'
]