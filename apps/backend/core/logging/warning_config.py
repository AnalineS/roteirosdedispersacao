# -*- coding: utf-8 -*-
"""
Warning Configuration Strategies
Estratégias específicas para diferentes ambientes e tipos de warnings
"""

import os
import logging
import warnings
from typing import Dict, List, Set, Any, Optional
from dataclasses import dataclass
from enum import Enum

from .warning_suppressor import WarningSuppressionManager
from .environment_logger import EnvironmentLogger


class WarningLevel(Enum):
    """Níveis de warning baseados na criticidade"""
    SILENT = "silent"          # Suprimir completamente
    MINIMAL = "minimal"        # Mostrar apenas em debug
    NORMAL = "normal"          # Mostrar normalmente
    VERBOSE = "verbose"        # Mostrar com detalhes
    CRITICAL = "critical"      # Sempre mostrar


@dataclass
class WarningStrategy:
    """Estratégia de handling para um tipo específico de warning"""
    pattern: str
    level: WarningLevel
    environments: Set[str]
    description: str
    suppress_in_production: bool = False
    show_once: bool = False


class WarningConfigManager:
    """Gerenciador de configurações de warning por ambiente"""

    def __init__(self, environment: str = None):
        self.environment = environment or os.environ.get('ENVIRONMENT', 'development')
        self.strategies: List[WarningStrategy] = []
        self.setup_default_strategies()

    def setup_default_strategies(self):
        """Define estratégias padrão para diferentes tipos de warnings"""

        # === DESENVOLVIMENTO ===
        development_strategies = [
            # Módulos opcionais - silenciar em dev
            WarningStrategy(
                pattern="No module named 'services.vector_store'",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Vector store é opcional em desenvolvimento",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="No module named 'services.embedding_service'",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Embedding service é opcional em desenvolvimento",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="No module named 'services.enhanced_rag_system'",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Enhanced RAG é opcional em desenvolvimento",
                suppress_in_production=False
            ),

            # API Keys - silenciar em dev
            WarningStrategy(
                pattern="Nenhuma API key configurada - apenas fallbacks disponíveis",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="API keys opcionais em desenvolvimento",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="[WARNING] Nenhuma API key configurada",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="API keys opcionais em desenvolvimento",
                suppress_in_production=False
            ),

            # Cloud services - silenciar em dev
            WarningStrategy(
                pattern="Erro ao inicializar clientes cloud",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Cloud services opcionais em desenvolvimento",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="Your default credentials were not found",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Credenciais cloud opcionais em desenvolvimento",
                suppress_in_production=False
            ),

            # Deprecated warnings - mostrar uma vez
            WarningStrategy(
                pattern="DEPRECATED",
                level=WarningLevel.MINIMAL,
                environments={'development', 'testing'},
                description="Warnings de deprecação",
                show_once=True
            ),

            # Development server warnings
            WarningStrategy(
                pattern="Development server",
                level=WarningLevel.SILENT,
                environments={'development'},
                description="Warnings do servidor de desenvolvimento",
                suppress_in_production=True
            ),
            WarningStrategy(
                pattern="Do not use it in a production deployment",
                level=WarningLevel.SILENT,
                environments={'development'},
                description="Avisos sobre deployment em produção",
                suppress_in_production=True
            ),

            # Memory and performance warnings in development
            WarningStrategy(
                pattern="[MEMORY] Uso alto detectado",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Warnings de memória em desenvolvimento",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="WARNING - [MEMORY]",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Warnings de memória em desenvolvimento",
                suppress_in_production=False
            ),

            # Celery and dependency warnings
            WarningStrategy(
                pattern="Dependências não disponíveis para Celery tasks",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Dependências Celery opcionais em desenvolvimento",
                suppress_in_production=False
            ),

            # Fallback and initialization warnings
            WarningStrategy(
                pattern="Usando Fallback Logger",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Fallback systems em desenvolvimento",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="Google Cloud indisponivel",
                level=WarningLevel.SILENT,
                environments={'development', 'testing'},
                description="Google Cloud opcional em desenvolvimento",
                suppress_in_production=False
            ),
        ]

        # === PRODUÇÃO ===
        production_strategies = [
            # Em produção, módulos faltando são críticos
            WarningStrategy(
                pattern="No module named",
                level=WarningLevel.CRITICAL,
                environments={'production', 'staging'},
                description="Módulos faltando são críticos em produção",
                suppress_in_production=False
            ),

            # API keys faltando são críticas
            WarningStrategy(
                pattern="API key não configurada",
                level=WarningLevel.CRITICAL,
                environments={'production', 'staging'},
                description="API keys são críticas em produção",
                suppress_in_production=False
            ),

            # Cloud services são críticos
            WarningStrategy(
                pattern="Cloud",
                level=WarningLevel.CRITICAL,
                environments={'production', 'staging'},
                description="Serviços cloud são críticos em produção",
                suppress_in_production=False
            ),
        ]

        # === UNIVERSAIS ===
        universal_strategies = [
            # Sempre críticos
            WarningStrategy(
                pattern="Security",
                level=WarningLevel.CRITICAL,
                environments={'development', 'testing', 'staging', 'production'},
                description="Warnings de segurança sempre críticos",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="Authentication",
                level=WarningLevel.CRITICAL,
                environments={'development', 'testing', 'staging', 'production'},
                description="Warnings de autenticação sempre críticos",
                suppress_in_production=False
            ),
            WarningStrategy(
                pattern="Database connection failed",
                level=WarningLevel.CRITICAL,
                environments={'development', 'testing', 'staging', 'production'},
                description="Falhas de conexão sempre críticas",
                suppress_in_production=False
            ),
        ]

        self.strategies.extend(development_strategies)
        self.strategies.extend(production_strategies)
        self.strategies.extend(universal_strategies)

    def get_applicable_strategies(self) -> List[WarningStrategy]:
        """Retorna estratégias aplicáveis ao ambiente atual"""
        return [
            strategy for strategy in self.strategies
            if self.environment in strategy.environments
        ]

    def get_suppression_patterns(self) -> Set[str]:
        """Obtém padrões que devem ser suprimidos no ambiente atual"""
        suppressed = set()

        for strategy in self.get_applicable_strategies():
            if strategy.level == WarningLevel.SILENT:
                suppressed.add(strategy.pattern)

        return suppressed

    def get_critical_patterns(self) -> Set[str]:
        """Obtém padrões que são sempre críticos"""
        critical = set()

        for strategy in self.get_applicable_strategies():
            if strategy.level == WarningLevel.CRITICAL:
                critical.add(strategy.pattern)

        return critical

    def configure_python_warnings(self):
        """Configura warnings do módulo warnings do Python"""

        for strategy in self.get_applicable_strategies():
            if strategy.level == WarningLevel.SILENT:
                warnings.filterwarnings("ignore", message=f".*{strategy.pattern}.*")
            elif strategy.show_once:
                warnings.filterwarnings("once", message=f".*{strategy.pattern}.*")

    def create_environment_config(self) -> Dict[str, Any]:
        """Cria configuração completa para o ambiente"""

        applicable_strategies = self.get_applicable_strategies()

        config = {
            'environment': self.environment,
            'suppressed_patterns': self.get_suppression_patterns(),
            'critical_patterns': self.get_critical_patterns(),
            'total_strategies': len(applicable_strategies),
            'strategies_by_level': {}
        }

        # Agrupar por nível
        for level in WarningLevel:
            config['strategies_by_level'][level.value] = [
                s.pattern for s in applicable_strategies if s.level == level
            ]

        return config

    def apply_configuration(self, warning_manager: WarningSuppressionManager):
        """Aplica configuração ao warning manager"""

        # Adicionar padrões de supressão
        for pattern in self.get_suppression_patterns():
            warning_manager.add_suppression_pattern(pattern)

        # Adicionar padrões críticos
        for pattern in self.get_critical_patterns():
            warning_manager.add_critical_pattern(pattern)

        # Configurar warnings do Python
        self.configure_python_warnings()


class DevelopmentWarningConfig:
    """Configuração específica para desenvolvimento"""

    @staticmethod
    def setup_clean_development():
        """Configuração para desenvolvimento limpo (zero warnings)"""

        # Suprimir warnings conhecidos de desenvolvimento
        dev_suppressions = [
            "No module named 'services.vector_store'",
            "No module named 'services.embedding_service'",
            "No module named 'services.enhanced_rag_system'",
            "Nenhuma API key configurada",
            "Erro ao inicializar clientes cloud",
            "Your default credentials were not found",
            "Dependências não disponíveis para Celery tasks",
            "DEPRECATED",
            "Development server",
            "Do not use it in a production deployment",
            "[MEMORY] Uso alto detectado",
            "WARNING - [MEMORY]",
            "Usando Fallback Logger",
            "Google Cloud indisponivel",
        ]

        for pattern in dev_suppressions:
            warnings.filterwarnings("ignore", message=f".*{pattern}.*")

        # Suprimir DeprecationWarnings específicos
        warnings.filterwarnings("ignore", category=DeprecationWarning,
                              message=".*datetime.datetime.utcnow.*")
        warnings.filterwarnings("ignore", category=DeprecationWarning)
        warnings.filterwarnings("ignore", category=PendingDeprecationWarning)

        # Configurar logging para mostrar apenas erros críticos
        logging.getLogger('werkzeug').setLevel(logging.ERROR)
        logging.getLogger('urllib3').setLevel(logging.ERROR)
        logging.getLogger('requests').setLevel(logging.ERROR)

        # Suprimir loggers específicos que geram warnings
        logging.getLogger('services.ai.ai_provider_manager').setLevel(logging.ERROR)
        logging.getLogger('core.performance.memory_optimizer').setLevel(logging.ERROR)
        logging.getLogger('celery_config').setLevel(logging.ERROR)

    @staticmethod
    def setup_verbose_development():
        """Configuração para desenvolvimento verboso (mostrar tudo)"""

        # Não suprimir nada, mostrar todos os warnings
        warnings.resetwarnings()

        # Configurar logging verboso
        logging.getLogger().setLevel(logging.INFO)


class ProductionWarningConfig:
    """Configuração específica para produção"""

    @staticmethod
    def setup_production_warnings():
        """Configuração para produção (preservar warnings críticos)"""

        # Suprimir apenas warnings não críticos
        non_critical_suppressions = [
            "Development server",
            "Do not use it in a production deployment",
        ]

        for pattern in non_critical_suppressions:
            warnings.filterwarnings("ignore", message=f".*{pattern}.*")

        # Manter todos os outros warnings visíveis
        # Configurar logging para capturar problemas
        logging.getLogger().setLevel(logging.WARNING)


def configure_warnings_for_environment(environment: str = None) -> WarningConfigManager:
    """Função principal para configurar warnings baseado no ambiente"""

    env = environment or os.environ.get('ENVIRONMENT', 'development')

    # Criar manager de configuração
    config_manager = WarningConfigManager(env)

    # Aplicar configurações específicas do ambiente
    if env == 'development':
        clean_startup = os.environ.get('CLEAN_STARTUP', 'true').lower() == 'true'
        if clean_startup:
            DevelopmentWarningConfig.setup_clean_development()
        else:
            DevelopmentWarningConfig.setup_verbose_development()

    elif env in ['production', 'staging']:
        ProductionWarningConfig.setup_production_warnings()

    return config_manager


def integrate_with_warning_suppressor(config_manager: WarningConfigManager,
                                   warning_manager: WarningSuppressionManager):
    """Integra configuração com o sistema de supressão"""

    config_manager.apply_configuration(warning_manager)

    # Log configuração aplicada (só em debug)
    if os.environ.get('DEBUG', '').lower() == 'true':
        config = config_manager.create_environment_config()
        logger = logging.getLogger(__name__)
        logger.debug(f"Warning configuration applied: {config['environment']}")
        logger.debug(f"Suppressed patterns: {len(config['suppressed_patterns'])}")
        logger.debug(f"Critical patterns: {len(config['critical_patterns'])}")