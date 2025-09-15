# -*- coding: utf-8 -*-
"""
Configuração Centralizada do Sistema
Todas as configurações globais e variáveis de ambiente
IMPORTANTE: Todas as variáveis devem ser configuradas no Google Cloud ou GitHub Secrets
"""

import os
from dataclasses import dataclass
from typing import Optional
import logging

# NÃO usar dotenv - apenas variáveis de ambiente do GitHub Secrets/Cloud Run

@dataclass
class AppConfig:
    """Configurações da aplicação - TODAS vindas de variáveis de ambiente"""
    
    # Flask Config
    SECRET_KEY: str = os.getenv('SECRET_KEY')  # OBRIGATÓRIO em produção
    DEBUG: bool = os.getenv('FLASK_ENV') == 'development'
    TESTING: bool = os.getenv('TESTING', '').lower() == 'true'
    
    # Server Config - Cloud Run compatible
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', 8080))  # Cloud Run default port
    
    # CORS Config
    @property
    def CORS_ORIGINS(self) -> list:
        """Retorna lista de origens permitidas do env"""
        origins = os.getenv('CORS_ORIGINS', '')
        return origins.split(',') if origins else []
    
    # API Keys - OBRIGATÓRIAS
    OPENROUTER_API_KEY: Optional[str] = os.getenv('OPENROUTER_API_KEY')
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv('HUGGINGFACE_API_KEY')
    
    # Supabase Config - FASE 3 RAG Integration
    SUPABASE_URL: Optional[str] = os.getenv('SUPABASE_PROJECT_URL')
    SUPABASE_KEY: Optional[str] = os.getenv('SUPABASE_PUBLISHABLE_KEY')
    SUPABASE_SERVICE_KEY: Optional[str] = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv('SUPABASE_JWT_SIGNING_KEY')
    
    # Feature Flags - Padrão conservador para evitar timeout Cloud Run
    EMBEDDINGS_ENABLED: bool = os.getenv('EMBEDDINGS_ENABLED', 'false').lower() == 'true'
    ADVANCED_FEATURES: bool = os.getenv('ADVANCED_FEATURES', 'false').lower() == 'true'
    RAG_AVAILABLE: bool = os.getenv('RAG_AVAILABLE', 'false').lower() == 'true'
    OPENAI_TEST_AVAILABLE: bool = os.getenv('OPENAI_TEST_AVAILABLE', 'false').lower() == 'true'
    ADVANCED_CACHE: bool = os.getenv('ADVANCED_CACHE', 'false').lower() == 'true'
    
    # Unified Cache Config - Sistema Integrado
    UNIFIED_CACHE_ENABLED: bool = os.getenv('UNIFIED_CACHE_ENABLED', 'true').lower() == 'true'
    MEMORY_CACHE_SIZE: int = int(os.getenv('MEMORY_CACHE_SIZE', 2000))
    MEMORY_CACHE_TTL: int = int(os.getenv('MEMORY_CACHE_TTL', 120))
    CLOUD_CACHE_ENABLED: bool = os.getenv('CLOUD_CACHE_ENABLED', 'true').lower() == 'true'
    API_CACHE_ENABLED: bool = os.getenv('API_CACHE_ENABLED', 'true').lower() == 'true'
    
    # Embeddings Config - Configuração unificada para ML features + sentence-transformers v5.1+
    EMBEDDING_MODEL: str = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    EMBEDDING_DEVICE: str = os.getenv('EMBEDDING_DEVICE', 'cpu')  # cpu/cuda
    EMBEDDINGS_MAX_LENGTH: int = int(os.getenv('EMBEDDINGS_MAX_LENGTH', 512))
    EMBEDDING_BATCH_SIZE: int = int(os.getenv('EMBEDDING_BATCH_SIZE', 32))
    EMBEDDING_CACHE_SIZE: int = int(os.getenv('EMBEDDING_CACHE_SIZE', 1000))
    
    # Sentence-transformers v5.1+ otimizações
    EMBEDDING_CHUNK_SIZE: int = int(os.getenv('EMBEDDING_CHUNK_SIZE', 32))  # Para textos longos
    EMBEDDING_PARALLEL_PROCESSING: bool = os.getenv('EMBEDDING_PARALLEL_PROCESSING', 'false').lower() == 'true'
    EMBEDDING_CONTEXT_TYPE: str = os.getenv('EMBEDDING_CONTEXT_TYPE', 'auto')  # auto/query/document
    EMBEDDING_USE_SPECIALIZED_METHODS: bool = os.getenv('EMBEDDING_USE_SPECIALIZED_METHODS', 'true').lower() == 'true'
    
    # Vector DB Config - Supabase pgvector
    VECTOR_DB_TYPE: str = os.getenv('VECTOR_DB_TYPE', 'supabase')  # 'supabase' or 'local'
    VECTOR_DB_PATH: str = os.getenv('VECTOR_DB_PATH', './cache/embeddings')  # Fallback local
    SEMANTIC_SIMILARITY_THRESHOLD: float = float(os.getenv('SEMANTIC_SIMILARITY_THRESHOLD', '0.7'))
    PGVECTOR_DIMENSIONS: int = int(os.getenv('PGVECTOR_DIMENSIONS', '384'))  # MiniLM dimensions
    
    # Cloud Storage Config - FASE 3 Cache Cloud-Native
    EMBEDDINGS_CLOUD_CACHE: bool = os.getenv('EMBEDDINGS_CLOUD_CACHE', 'false').lower() == 'true'
    CLOUD_STORAGE_BUCKET: Optional[str] = os.getenv('CLOUD_STORAGE_BUCKET')
    EMBEDDINGS_LAZY_LOAD: bool = os.getenv('EMBEDDINGS_LAZY_LOAD', 'true').lower() == 'true'
    MIN_INSTANCES: int = int(os.getenv('MIN_INSTANCES', '0'))  # Cloud Run min instances
    
    # Cache Config
    CACHE_MAX_SIZE: int = int(os.getenv('CACHE_MAX_SIZE', 1000))
    CACHE_TTL_MINUTES: int = int(os.getenv('CACHE_TTL_MINUTES', 60))
    
    # Security Middleware - FASE 4 HABILITADO
    SECURITY_MIDDLEWARE_ENABLED: bool = os.getenv('SECURITY_MIDDLEWARE_ENABLED', 'false').lower() == 'true'
    
    # Rate Limiting - Configurações moderadas
    RATE_LIMIT_ENABLED: bool = os.getenv('RATE_LIMIT_ENABLED', '').lower() != 'false'
    RATE_LIMIT_DEFAULT: str = os.getenv('RATE_LIMIT_DEFAULT', '200/hour')
    RATE_LIMIT_CHAT: str = os.getenv('RATE_LIMIT_CHAT', '50/hour')
    
    # Security Settings - Bloqueio automático após ataques
    SECURITY_AUTO_BLOCK_ENABLED: bool = os.getenv('SECURITY_AUTO_BLOCK_ENABLED', 'true').lower() == 'true'
    SECURITY_BLOCK_DURATION_MINUTES: int = int(os.getenv('SECURITY_BLOCK_DURATION_MINUTES', '15'))
    SECURITY_MAX_VIOLATIONS: int = int(os.getenv('SECURITY_MAX_VIOLATIONS', '5'))
    
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
    
    # Database Config (Supabase) - Mapeamento para GitHub Secrets
    SUPABASE_URL: Optional[str] = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY: Optional[str] = os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_KEY: Optional[str] = os.getenv('SUPABASE_SERVICE_KEY')
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv('SUPABASE_JWT_SECRET')
    
    # Vector Store Config (Supabase + pgvector)
    SUPABASE_VECTOR_DIMENSION: int = int(os.getenv('SUPABASE_VECTOR_DIMENSION', 1536))
    SUPABASE_VECTOR_SIMILARITY_THRESHOLD: float = float(os.getenv('SUPABASE_VECTOR_SIMILARITY_THRESHOLD', 0.8))
    
    # Redis Config - REMOVED (Replaced by Firestore hybrid cache in Phases 2-4)
    # REDIS_ENABLED: bool = os.getenv('REDIS_ENABLED', '').lower() == 'true'  # REMOVED
    # REDIS_URL: Optional[str] = os.getenv('REDIS_URL')  # REMOVED
    # REDIS_PASSWORD: Optional[str] = os.getenv('REDIS_PASSWORD')  # REMOVED
    # REDIS_USERNAME: str = os.getenv('REDIS_USERNAME', 'default')  # REMOVED
    # REDIS_MAX_CONNECTIONS: int = int(os.getenv('REDIS_MAX_CONNECTIONS', 20))  # REMOVED
    # REDIS_SOCKET_TIMEOUT: int = int(os.getenv('REDIS_SOCKET_TIMEOUT', 3))  # REMOVED
    # REDIS_HEALTH_CHECK_INTERVAL: int = int(os.getenv('REDIS_HEALTH_CHECK_INTERVAL', 30))  # REMOVED
    
    # Cache Config - Now using Firestore hybrid system
    FIRESTORE_CACHE_ENABLED: bool = os.getenv('FIRESTORE_CACHE_ENABLED', 'true').lower() == 'true'
    HYBRID_CACHE_STRATEGY: str = os.getenv('HYBRID_CACHE_STRATEGY', 'memory_first')
    
    # Email Config (para alertas)
    EMAIL_ENABLED: bool = os.getenv('EMAIL_ENABLED', '').lower() == 'true'
    EMAIL_FROM: Optional[str] = os.getenv('EMAIL_FROM')
    EMAIL_SMTP_HOST: str = os.getenv('EMAIL_SMTP_HOST', 'smtp.gmail.com')
    EMAIL_SMTP_PORT: int = int(os.getenv('EMAIL_SMTP_PORT', 587))
    EMAIL_PASSWORD: Optional[str] = os.getenv('EMAIL_PASSWORD')  # App password
    
    # Google Cloud Config
    GCP_PROJECT_ID: Optional[str] = os.getenv('GCP_PROJECT_ID')
    GCP_REGION: Optional[str] = os.getenv('GCP_REGION')
    
    # Monitoring Config (Google Cloud Monitoring)
    METRICS_ENABLED: bool = os.getenv('METRICS_ENABLED', '').lower() != 'false'
    METRICS_COLLECT_INTERVAL: int = int(os.getenv('METRICS_COLLECT_INTERVAL', '15'))
    METRICS_RETENTION_DAYS: int = int(os.getenv('METRICS_RETENTION_DAYS', '30'))
    MEDICAL_METRICS_NAMESPACE: str = os.getenv('MEDICAL_METRICS_NAMESPACE', 'medical_platform')
    GOOGLE_CLOUD_MONITORING_ENABLED: bool = os.getenv('GOOGLE_CLOUD_MONITORING_ENABLED', 'true').lower() == 'true'
    
    
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
        
        # Validar Supabase se habilitado
        if self.SUPABASE_URL:
            required.extend(['SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'])
        
        # Redis removido - usando apenas Firestore cache
        
        if self.EMAIL_ENABLED:
            required.extend(['EMAIL_FROM', 'EMAIL_PASSWORD'])
            
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

# Validar configuração na inicialização (não-fatal para Cloud Run)
try:
    if not config.validate():
        if EnvironmentConfig.is_production():
            # Log crítico mas não falha para permitir graceful degradation
            logging.error("Configuração inválida em produção - modo degradação ativado!")
        else:
            logging.warning("Configuração incompleta - modo desenvolvimento")
except Exception as e:
    # Fallback total se validação falhar
    logging.error(f"Erro na validação de config: {e} - continuando em modo seguro")

# Logging será configurado no main.py para evitar duplicação

# Listar variáveis obrigatórias não configuradas
missing_vars = [var for var in config.get_required_env_vars() if not os.getenv(var)]
if missing_vars:
    logging.warning(f"Variáveis de ambiente faltando: {', '.join(missing_vars)}")

# Export configurations
__all__ = ['config', 'AppConfig', 'EnvironmentConfig']