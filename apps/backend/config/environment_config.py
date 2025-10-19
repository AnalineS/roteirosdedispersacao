# -*- coding: utf-8 -*-
"""
Environment Configuration - Flask Best Practices
Implementa configuração hierárquica por ambiente conforme documentação oficial Flask

ESTRATÉGIA DE CONFIGURAÇÃO POR AMBIENTE:

🏠 DEVELOPMENT (Local):
   - Usa arquivos .env locais
   - Permite fallbacks e mocks
   - Conexões cloud opcionais
   - Debugging habilitado

🏗️ STAGING/HML (GitHub → Cloud Run):
   - USA GITHUB SECRETS/VARIABLES (não .env)
   - Exige algumas conexões reais
   - Permite fallbacks controlados
   - Validações moderadas

🏭 PRODUCTION (GitHub → Cloud Run):
   - USA GITHUB SECRETS/VARIABLES (não .env)
   - Exige TODAS as conexões reais
   - Zero tolerância a falhas
   - Validações rigorosas

GitHub Secrets/Variables são automaticamente injetados como
environment variables pelo GitHub Actions e Cloud Run.
"""

import os
from typing import Dict, Any, Optional


class BaseConfig:
    """
    Configuração base - valores padrão seguros
    Todos os ambientes herdam desta classe
    """
    # Configurações básicas Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-not-for-production')
    DEBUG = False
    TESTING = False

    # Configurações do sistema médico
    RAG_ENABLED = True
    QA_ENABLED = True
    ADVANCED_CACHE = True
    METRICS_ENABLED = True

    # Configurações de segurança
    SECURITY_ENABLED = True
    RATE_LIMIT_ENABLED = True
    SECURITY_HEADERS_ENABLED = True
    CSRF_PROTECTION_ENABLED = True

    # Configurações de performance
    MAX_REQUEST_SIZE_MB = 10
    RATE_LIMIT_PER_MINUTE = 60
    SESSION_TIMEOUT_MINUTES = 60

    # Configurações de cache
    CACHE_MAX_SIZE = int(os.getenv('CACHE_MAX_SIZE', 2000))
    CACHE_TTL_MINUTES = int(os.getenv('CACHE_TTL_MINUTES', 120))

    # AI Provider
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

    # Cloud Strategy - FUNDAMENTAL
    CLOUD_STRATEGY = 'strict'  # 'strict', 'fallback', 'development'
    REQUIRE_REAL_CLOUD = True
    ALLOW_DEVELOPMENT_MOCKS = False


class DevelopmentConfig(BaseConfig):
    """
    Configuração para desenvolvimento local
    Permite fallbacks e mocks para facilitar desenvolvimento
    """
    DEBUG = True
    TESTING = False

    # Cloud Strategy - PERMISSIVA para desenvolvimento
    CLOUD_STRATEGY = 'development'
    REQUIRE_REAL_CLOUD = False
    ALLOW_DEVELOPMENT_MOCKS = True

    # Rate limiting mais permissivo
    RATE_LIMIT_PER_MINUTE = 120

    # Configurações Supabase (opcional em dev)
    SUPABASE_URL = os.getenv('SUPABASE_URL', os.getenv('SUPABASE_PROJECT_URL'))
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', os.getenv('SUPABASE_ANON_KEY', os.getenv('SUPABASE_PUBLISHABLE_KEY')))
    SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')  # Opcional em dev

    # Google Cloud (opcional em dev)
    GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'dev-mock-bucket')
    GOOGLE_CLOUD_PROJECT = os.getenv('GCP_PROJECT_ID', 'dev-project')
    GCP_REGION = os.getenv('GCP_REGION', 'us-central1')

    @property
    def ENVIRONMENT_NAME(self):
        return "development"

    @property
    def REQUIRES_CLOUD_VALIDATION(self):
        return False


class StagingConfig(BaseConfig):
    """
    Configuração para homologação (HML)
    USA GITHUB SECRETS/VARIABLES - não arquivos .env
    Exige algumas conexões reais mas permite fallbacks controlados
    """
    DEBUG = False
    TESTING = False

    # Cloud Strategy - HÍBRIDA
    CLOUD_STRATEGY = 'fallback'
    REQUIRE_REAL_CLOUD = True
    ALLOW_DEVELOPMENT_MOCKS = False

    # Configurações do GitHub Secrets/Variables para HML
    SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('SUPABASE_PROJECT_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
    SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')  # GitHub Secret obrigatório

    # Google Cloud do GitHub Variables
    GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME')  # GitHub Variable
    GOOGLE_CLOUD_PROJECT = os.getenv('GCP_PROJECT_ID')  # GitHub Variable
    GCP_REGION = os.getenv('GCP_REGION', 'us-central1')  # GitHub Variable

    @property
    def ENVIRONMENT_NAME(self):
        return "staging"

    @property
    def REQUIRES_CLOUD_VALIDATION(self):
        return True

    def validate_required_vars(self) -> Dict[str, bool]:
        """Valida variáveis obrigatórias para staging"""
        return {
            'SUPABASE_URL': bool(self.SUPABASE_URL),
            'SUPABASE_KEY': bool(self.SUPABASE_KEY),
            'SUPABASE_DB_URL': bool(self.SUPABASE_DB_URL),
            'GCS_BUCKET_NAME': bool(self.GCS_BUCKET_NAME),
            'OPENROUTER_API_KEY': bool(self.OPENROUTER_API_KEY)
        }


class ProductionConfig(BaseConfig):
    """
    Configuração para produção
    USA GITHUB SECRETS/VARIABLES - não arquivos .env
    Exige todas as conexões reais e validações rigorosas
    """
    DEBUG = False
    TESTING = False

    # Cloud Strategy - RIGOROSA
    CLOUD_STRATEGY = 'strict'
    REQUIRE_REAL_CLOUD = True
    ALLOW_DEVELOPMENT_MOCKS = False

    # Rate limiting mais restritivo
    RATE_LIMIT_PER_MINUTE = 30

    # GitHub Secrets/Variables OBRIGATÓRIOS para produção
    SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('SUPABASE_PROJECT_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
    SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')  # GitHub Secret OBRIGATÓRIO

    # Google Cloud do GitHub Variables - OBRIGATÓRIOS
    GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME')  # GitHub Variable OBRIGATÓRIO
    GOOGLE_CLOUD_PROJECT = os.getenv('GCP_PROJECT_ID')  # GitHub Variable OBRIGATÓRIO
    GCP_REGION = os.getenv('GCP_REGION', 'us-central1')  # GitHub Variable

    @property
    def ENVIRONMENT_NAME(self):
        return "production"

    @property
    def REQUIRES_CLOUD_VALIDATION(self):
        return True

    def validate_required_vars(self) -> Dict[str, bool]:
        """Valida TODAS as variáveis obrigatórias para produção"""
        validations = {
            'SECRET_KEY': bool(os.getenv('SECRET_KEY')),
            'SUPABASE_URL': bool(self.SUPABASE_URL),
            'SUPABASE_KEY': bool(self.SUPABASE_KEY),
            'SUPABASE_DB_URL': bool(self.SUPABASE_DB_URL),
            'GCS_BUCKET_NAME': bool(self.GCS_BUCKET_NAME),
            'GOOGLE_CLOUD_PROJECT': bool(self.GOOGLE_CLOUD_PROJECT),
            'OPENROUTER_API_KEY': bool(self.OPENROUTER_API_KEY)
        }

        missing = [key for key, valid in validations.items() if not valid]
        if missing:
            raise RuntimeError(f"Production requires these environment variables: {missing}")

        return validations


# Mapeamento de ambientes
ENVIRONMENT_CONFIGS = {
    'development': DevelopmentConfig,
    'dev': DevelopmentConfig,
    'staging': StagingConfig,
    'hml': StagingConfig,
    'homolog': StagingConfig,
    'production': ProductionConfig,
    'prod': ProductionConfig,
}


def get_environment_config() -> BaseConfig:
    """
    Detecta e retorna a configuração correta baseada no ambiente
    Segue padrão Flask oficial de configuração hierárquica
    """
    # 1. Detectar ambiente (ordem de prioridade)
    environment = (
        os.getenv('FLASK_ENV') or
        os.getenv('ENVIRONMENT') or
        os.getenv('ENV') or
        'development'  # Padrão seguro
    )

    # 2. Normalizar nome do ambiente
    environment = environment.lower().strip()

    # 3. Buscar configuração correspondente
    config_class = ENVIRONMENT_CONFIGS.get(environment, DevelopmentConfig)

    # 4. Instanciar e carregar variáveis de ambiente
    config = config_class()

    # 5. Carregar variáveis com prefixo Flask (método oficial)
    if hasattr(config, 'from_prefixed_env'):
        config.from_prefixed_env('FLASK_')

    return config


def validate_environment_config(config: BaseConfig) -> bool:
    """
    Valida se a configuração do ambiente está correta
    Retorna True se tudo estiver válido
    """
    try:
        # Validações básicas para todos os ambientes
        if not config.SECRET_KEY or config.SECRET_KEY == 'dev-key-not-for-production':
            if isinstance(config, ProductionConfig):
                raise ValueError("Production requires a real SECRET_KEY")

        # Validações específicas do ambiente
        if hasattr(config, 'validate_required_vars'):
            validations = config.validate_required_vars()
            failed = [key for key, valid in validations.items() if not valid]
            if failed and isinstance(config, ProductionConfig):
                raise ValueError(f"Production validation failed for: {failed}")

        return True

    except Exception as e:
        if isinstance(config, ProductionConfig):
            raise  # Produção deve falhar se configuração incorreta
        else:
            # Development/Staging podem continuar com warnings
            print(f"WARNING: Configuration validation failed: {e}")
            return False


# Para compatibilidade com sistema existente
def create_flask_config() -> BaseConfig:
    """
    Cria configuração Flask seguindo padrões oficiais
    Interface compatível com app_config.py existente
    """
    config = get_environment_config()
    validate_environment_config(config)
    return config


if __name__ == "__main__":
    # Teste das configurações
    config = get_environment_config()
    print(f"Environment: {config.ENVIRONMENT_NAME}")
    print(f"Cloud Strategy: {config.CLOUD_STRATEGY}")
    print(f"Requires Cloud: {config.REQUIRE_REAL_CLOUD}")
    print(f"Allows Mocks: {config.ALLOW_DEVELOPMENT_MOCKS}")