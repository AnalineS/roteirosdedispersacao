# -*- coding: utf-8 -*-
"""
Configuração Centralizada do Sistema
Todas as configurações globais e variáveis de ambiente
IMPORTANTE: Todas as variáveis devem ser configuradas no Google Cloud ou GitHub Secrets
"""

import os
from dotenv import load_dotenv
from dataclasses import dataclass
from typing import Optional
import logging

# Carregar variáveis de ambiente
load_dotenv()

@dataclass
class AppConfig:
    """Configurações da aplicação - TODAS vindas de variáveis de ambiente"""
    
    # Flask Config
    SECRET_KEY: str = os.getenv('SECRET_KEY')  # OBRIGATÓRIO em produção
    DEBUG: bool = os.getenv('FLASK_ENV') == 'development'
    TESTING: bool = os.getenv('TESTING', '').lower() == 'true'
    
    # Server Config
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', 5000))
    
    # CORS Config
    @property
    def CORS_ORIGINS(self) -> list:
        """Retorna lista de origens permitidas do env"""
        origins = os.getenv('CORS_ORIGINS', '')
        return origins.split(',') if origins else []
    
    # API Keys - OBRIGATÓRIAS
    OPENROUTER_API_KEY: Optional[str] = os.getenv('OPENROUTER_API_KEY')
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv('HUGGINGFACE_API_KEY')
    
    # Feature Flags
    ADVANCED_FEATURES: bool = os.getenv('ADVANCED_FEATURES', '').lower() != 'false'
    RAG_AVAILABLE: bool = os.getenv('RAG_AVAILABLE', '').lower() != 'false'
    OPENAI_TEST_AVAILABLE: bool = os.getenv('OPENAI_TEST_AVAILABLE', '').lower() != 'false'
    ADVANCED_CACHE: bool = os.getenv('ADVANCED_CACHE', '').lower() != 'false'
    
    # Cache Config
    CACHE_MAX_SIZE: int = int(os.getenv('CACHE_MAX_SIZE', 1000))
    CACHE_TTL_MINUTES: int = int(os.getenv('CACHE_TTL_MINUTES', 60))
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv('RATE_LIMIT_ENABLED', '').lower() != 'false'
    RATE_LIMIT_DEFAULT: str = os.getenv('RATE_LIMIT_DEFAULT', '200/hour')
    RATE_LIMIT_CHAT: str = os.getenv('RATE_LIMIT_CHAT', '50/hour')
    
    # Logging Config
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Advanced Logging Config
    LOG_ROTATION_MAX_BYTES: int = int(os.getenv('LOG_ROTATION_MAX_BYTES', 50*1024*1024))  # 50MB
    LOG_ROTATION_BACKUP_COUNT: int = int(os.getenv('LOG_ROTATION_BACKUP_COUNT', 10))
    LOG_RETENTION_DAYS: int = int(os.getenv('LOG_RETENTION_DAYS', 7))
    LOG_COMPRESSION_DELAY: int = int(os.getenv('LOG_COMPRESSION_DELAY', 1))
    LOG_STRUCTURED_FORMAT: bool = os.getenv('LOG_STRUCTURED_FORMAT', '').lower() != 'false'
    LOG_SENSITIVE_DATA_REDACTION: bool = os.getenv('LOG_SENSITIVE_DATA_REDACTION', '').lower() != 'false'
    
    # Security
    MAX_CONTENT_LENGTH: int = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB
    SESSION_COOKIE_SECURE: bool = os.getenv('SESSION_COOKIE_SECURE', '').lower() == 'true'
    SESSION_COOKIE_HTTPONLY: bool = os.getenv('SESSION_COOKIE_HTTPONLY', '').lower() != 'false'
    SESSION_COOKIE_SAMESITE: str = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    
    # QA Framework Config
    QA_ENABLED: bool = os.getenv('QA_ENABLED', '').lower() != 'false'
    QA_MIN_SCORE: float = float(os.getenv('QA_MIN_SCORE', 0.90))  # 90% threshold
    QA_SYNC_VALIDATION: bool = os.getenv('QA_SYNC_VALIDATION', '').lower() != 'false'
    QA_MAX_RETRIES: int = int(os.getenv('QA_MAX_RETRIES', 3))
    
    # Medical Chunking Config
    CHUNK_SIZE_DEFAULT: int = int(os.getenv('CHUNK_SIZE_DEFAULT', 500))
    CHUNK_SIZE_DOSAGE: int = int(os.getenv('CHUNK_SIZE_DOSAGE', 800))
    CHUNK_OVERLAP_RATIO: float = float(os.getenv('CHUNK_OVERLAP_RATIO', 0.2))
    
    # Priority Weights for Medical Content
    CONTENT_WEIGHTS = {
        'dosage': float(os.getenv('WEIGHT_DOSAGE', 1.0)),
        'contraindication': float(os.getenv('WEIGHT_CONTRAINDICATION', 1.0)),
        'interaction': float(os.getenv('WEIGHT_INTERACTION', 1.0)),
        'protocol': float(os.getenv('WEIGHT_PROTOCOL', 0.8)),
        'guideline': float(os.getenv('WEIGHT_GUIDELINE', 0.8)),
        'mechanism': float(os.getenv('WEIGHT_MECHANISM', 0.5)),
        'pharmacokinetics': float(os.getenv('WEIGHT_PHARMACOKINETICS', 0.5)),
        'general': float(os.getenv('WEIGHT_GENERAL', 0.2))
    }
    
    # Database Config (AstraDB)
    ASTRA_DB_ENABLED: bool = os.getenv('ASTRA_DB_ENABLED', '').lower() == 'true'
    ASTRA_DB_URL: Optional[str] = os.getenv('ASTRA_DB_URL')
    ASTRA_DB_TOKEN: Optional[str] = os.getenv('ASTRA_DB_TOKEN')
    ASTRA_DB_KEYSPACE: Optional[str] = os.getenv('ASTRA_DB_KEYSPACE')
    
    # Redis Config (Google Cloud Memorystore)
    REDIS_ENABLED: bool = os.getenv('REDIS_ENABLED', '').lower() == 'true'
    REDIS_URL: Optional[str] = os.getenv('REDIS_URL')
    REDIS_PASSWORD: Optional[str] = os.getenv('REDIS_PASSWORD')
    
    # Google Cloud Config
    GCP_PROJECT_ID: Optional[str] = os.getenv('GCP_PROJECT_ID')
    GCP_REGION: Optional[str] = os.getenv('GCP_REGION')
    
    # Monitoring Config
    METRICS_ENABLED: bool = os.getenv('METRICS_ENABLED', '').lower() != 'false'
    PROMETHEUS_PORT: int = int(os.getenv('PROMETHEUS_PORT', 9090))
    
    # Embeddings Config (SPRINT 1.2)
    EMBEDDINGS_ENABLED: bool = os.getenv('EMBEDDINGS_ENABLED', '').lower() == 'true'
    EMBEDDING_MODEL: str = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    EMBEDDING_DEVICE: str = os.getenv('EMBEDDING_DEVICE', 'cpu')  # cpu/cuda
    VECTOR_DB_PATH: str = os.getenv('VECTOR_DB_PATH', './data/embeddings/')
    EMBEDDING_CACHE_SIZE: int = int(os.getenv('EMBEDDING_CACHE_SIZE', 1000))
    SEMANTIC_SIMILARITY_THRESHOLD: float = float(os.getenv('SEMANTIC_SIMILARITY_THRESHOLD', 0.7))
    EMBEDDING_BATCH_SIZE: int = int(os.getenv('EMBEDDING_BATCH_SIZE', 32))
    EMBEDDINGS_MAX_LENGTH: int = int(os.getenv('EMBEDDINGS_MAX_LENGTH', 512))
    
    # Data Redaction for Logs
    REDACT_PATTERNS = [
        'cpf', 'rg', 'email', 'telefone', 'celular',
        'nome_completo', 'data_nascimento', 'endereco'
    ]

    def validate(self) -> bool:
        """Valida configurações críticas"""
        errors = []
        
        # Validações críticas para produção
        if os.getenv('ENVIRONMENT') == 'production':
            if not self.SECRET_KEY:
                errors.append("SECRET_KEY não configurada para produção")
            if not self.OPENROUTER_API_KEY and not self.HUGGINGFACE_API_KEY:
                errors.append("Nenhuma API key de IA configurada")
            if not self.SESSION_COOKIE_SECURE:
                errors.append("SESSION_COOKIE_SECURE deve ser True em produção")
        
        if errors:
            for error in errors:
                logging.error(f"Config Error: {error}")
            return False
        
        return True

    def get_required_env_vars(self) -> list:
        """Retorna lista de variáveis de ambiente obrigatórias"""
        required = [
            'SECRET_KEY',
            'OPENROUTER_API_KEY',
            'CORS_ORIGINS'
        ]
        
        if self.ASTRA_DB_ENABLED:
            required.extend(['ASTRA_DB_URL', 'ASTRA_DB_TOKEN', 'ASTRA_DB_KEYSPACE'])
        
        if self.REDIS_ENABLED:
            required.extend(['REDIS_URL', 'REDIS_PASSWORD'])
            
        if os.getenv('ENVIRONMENT') == 'production':
            required.extend(['GCP_PROJECT_ID', 'GCP_REGION'])
            
        return required

@dataclass
class EnvironmentConfig:
    """Configurações por ambiente"""
    DEVELOPMENT = 'development'
    STAGING = 'staging'
    PRODUCTION = 'production'
    
    @staticmethod
    def get_current() -> str:
        """Retorna ambiente atual"""
        return os.getenv('ENVIRONMENT', 'development')
    
    @staticmethod
    def is_production() -> bool:
        """Verifica se está em produção"""
        return EnvironmentConfig.get_current() == 'production'
    
    @staticmethod
    def is_development() -> bool:
        """Verifica se está em desenvolvimento"""
        return EnvironmentConfig.get_current() == 'development'
    
    @staticmethod
    def is_staging() -> bool:
        """Verifica se está em staging"""
        return EnvironmentConfig.get_current() == 'staging'

# Instância global de configuração
config = AppConfig()

# Validar configuração na inicialização
if not config.validate():
    if EnvironmentConfig.is_production():
        raise RuntimeError("Configuração inválida em produção!")
    else:
        logging.warning("Configuração incompleta - modo desenvolvimento")

# Configurar logging global
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)

# Listar variáveis obrigatórias não configuradas
missing_vars = [var for var in config.get_required_env_vars() if not os.getenv(var)]
if missing_vars:
    logging.warning(f"Variáveis de ambiente faltando: {', '.join(missing_vars)}")

# Export configurations
__all__ = ['config', 'AppConfig', 'EnvironmentConfig']