# -*- coding: utf-8 -*-
"""
Configuração Centralizada do Sistema
Todas as configurações globais e variáveis de ambiente
IMPORTANTE: Todas as variáveis devem ser configuradas no Google Cloud ou GitHub Secrets
Build Version: 3.1.3 - DNS alignment + service name consistency fix
"""

import os
from dataclasses import dataclass
from typing import Optional
import logging

# Load .env file for development if available
try:
    from dotenv import load_dotenv
    # Try to load .env file for development
    env_file = '.env'
    if os.path.exists(env_file):
        load_dotenv(env_file)
        print(f"Loaded environment from {env_file}")
except ImportError:
    # dotenv not available, use environment variables directly
    pass

@dataclass
class AppConfig:
    """Configurações da aplicação - TODAS vindas de variáveis de ambiente"""
    
    # Flask Config - with secure defaults
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production-min-32-chars')  # OBRIGATÓRIO em produção
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true' or os.getenv('FLASK_ENV') == 'development'
    TESTING: bool = os.getenv('TESTING', 'false').lower() == 'true'
    
    # Server Config - Cloud Run compatible
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', 8080))  # Cloud Run default port
    
    # CORS Config
    @property
    def CORS_ORIGINS(self) -> list:
        """Retorna lista de origens permitidas do env com fallbacks por ambiente"""
        # Check environment-specific CORS first
        env = os.getenv('ENVIRONMENT', 'development')

        if env == 'production':
            origins = os.getenv('CORS_ORIGINS_PROD', os.getenv('CORS_ORIGINS', ''))
        elif env == 'staging':
            origins = os.getenv('CORS_ORIGINS_HML', os.getenv('CORS_ORIGINS', ''))
        else:
            origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')

        # Handle both comma and semicolon delimiters (semicolon used to avoid gcloud parsing issues)
        if origins:
            # Try semicolon first (used in production to avoid gcloud issues)
            if ';' in origins:
                return origins.split(';')
            else:
                return origins.split(',')
        else:
            return ['http://localhost:3000']
    
    # API Keys - with fallback handling
    OPENROUTER_API_KEY: Optional[str] = os.getenv('OPENROUTER_API_KEY', '')
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv('HUGGINGFACE_API_KEY', '')
    OPENAI_API_KEY: Optional[str] = os.getenv('OPENAI_API_KEY', '')
    
    # Supabase Config - RAG COMPLETO ATIVADO - REAL INTEGRATION
    SUPABASE_URL: Optional[str] = os.getenv('SUPABASE_URL') or os.getenv('SUPABASE_PROJECT_URL')
    SUPABASE_ANON_KEY: Optional[str] = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
    SUPABASE_KEY: Optional[str] = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
    SUPABASE_SERVICE_KEY: Optional[str] = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_API_KEY')
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv('SUPABASE_JWT_SECRET') or os.getenv('SUPABASE_JWT_SIGNING_KEY')
    SUPABASE_DB_URL: Optional[str] = os.getenv('SUPABASE_DB_URL')  # Direct PostgreSQL connection for pgvector
    
    # Feature Flags - TODAS AS FUNCIONALIDADES ATIVADAS
    EMBEDDINGS_ENABLED: bool = os.getenv('EMBEDDINGS_ENABLED', 'true').lower() == 'true'
    ADVANCED_FEATURES: bool = os.getenv('ADVANCED_FEATURES', 'true').lower() == 'true'
    RAG_ENABLED: bool = os.getenv('RAG_ENABLED', 'true').lower() == 'true'
    OPENAI_TEST_AVAILABLE: bool = os.getenv('OPENAI_TEST_AVAILABLE', 'true').lower() == 'true'
    ADVANCED_CACHE: bool = os.getenv('ADVANCED_CACHE', 'true').lower() == 'true'
    
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
    
    # Cloud Storage Config - CACHE CLOUD ATIVADO
    EMBEDDINGS_CLOUD_CACHE: bool = os.getenv('EMBEDDINGS_CLOUD_CACHE', 'true').lower() == 'true'
    GCS_BUCKET_NAME: Optional[str] = os.getenv('GCS_BUCKET_NAME')
    EMBEDDINGS_LAZY_LOAD: bool = os.getenv('EMBEDDINGS_LAZY_LOAD', 'true').lower() == 'true'
    MIN_INSTANCES: int = int(os.getenv('MIN_INSTANCES', '0'))  # Cloud Run min instances
    
    # Cache Config
    CACHE_MAX_SIZE: int = int(os.getenv('CACHE_MAX_SIZE', 1000))
    CACHE_TTL_MINUTES: int = int(os.getenv('CACHE_TTL_MINUTES', 60))
    
    # Security Middleware - ATIVADO POR PADRÃO
    SECURITY_MIDDLEWARE_ENABLED: bool = os.getenv('SECURITY_MIDDLEWARE_ENABLED', 'true').lower() == 'true'
    
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
    
    # Cloud Storage Config - Google Cloud Storage - REAL INTEGRATION
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    GOOGLE_APPLICATION_CREDENTIALS_JSON: Optional[str] = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    GOOGLE_CLOUD_PROJECT: Optional[str] = os.getenv('GOOGLE_CLOUD_PROJECT') or os.getenv('GCP_PROJECT_ID')
    GCP_REGION: Optional[str] = os.getenv('GCP_REGION', 'us-central1')

    # Specialized GCS buckets
    GCS_CACHE_BUCKET: Optional[str] = os.getenv('GCS_CACHE_BUCKET')
    GCS_BACKUP_BUCKET: Optional[str] = os.getenv('GCS_BACKUP_BUCKET')
    GCS_MEDICAL_DOCUMENTS_BUCKET: Optional[str] = os.getenv('GCS_MEDICAL_DOCUMENTS_BUCKET')

    # Development environment detection
    IS_DEVELOPMENT: bool = os.getenv('ENVIRONMENT', 'development') == 'development'
    IS_CLOUD_RUN: bool = bool(os.getenv('K_SERVICE') or os.getenv('CLOUD_RUN_ENV'))

    # Local Development Alternatives - for development without cloud services
    LOCALSTACK_ENABLED: bool = os.getenv('LOCALSTACK_ENABLED', 'false').lower() == 'true'
    LOCALSTACK_ENDPOINT: str = os.getenv('LOCALSTACK_ENDPOINT', 'http://localhost:4566')
    LOCAL_POSTGRES_URL: Optional[str] = os.getenv('LOCAL_POSTGRES_URL')
    LOCAL_POSTGRES_ENABLED: bool = os.getenv('LOCAL_POSTGRES_ENABLED', 'false').lower() == 'true'
    
    # Vector Store Config (Supabase + pgvector)
    SUPABASE_VECTOR_DIMENSION: int = int(os.getenv('SUPABASE_VECTOR_DIMENSION', 1536))
    SUPABASE_VECTOR_SIMILARITY_THRESHOLD: float = float(os.getenv('SUPABASE_VECTOR_SIMILARITY_THRESHOLD', 0.8))
    
    
    # Cache Config - Now using Firestore hybrid system
    FIRESTORE_CACHE_ENABLED: bool = os.getenv('FIRESTORE_CACHE_ENABLED', 'true').lower() == 'true'
    HYBRID_CACHE_STRATEGY: str = os.getenv('HYBRID_CACHE_STRATEGY', 'memory_first')
    
    # Email Config - GMAIL CONFIGURADO with defaults
    EMAIL_ENABLED: bool = os.getenv('EMAIL_ENABLED', 'true').lower() == 'true'
    EMAIL_FROM: str = os.getenv('EMAIL_FROM', 'noreply@roteirosdedispensacao.com')
    EMAIL_FROM_NAME: str = os.getenv('EMAIL_FROM_NAME', 'Roteiro de Dispensação PQT-U')
    EMAIL_REPLY_TO: str = os.getenv('EMAIL_REPLY_TO', 'suporte@roteirosdedispensacao.com')
    EMAIL_SMTP_HOST: str = os.getenv('EMAIL_SMTP_HOST', 'smtp.gmail.com')
    EMAIL_SMTP_PORT: int = int(os.getenv('EMAIL_SMTP_PORT', 587))
    EMAIL_SMTP_USE_TLS: bool = os.getenv('EMAIL_SMTP_USE_TLS', 'true').lower() == 'true'
    EMAIL_PASSWORD: Optional[str] = os.getenv('EMAIL_PASSWORD', '')  # Gmail App password with fallback
    
    # Google Cloud Config
    GCP_PROJECT_ID: Optional[str] = os.getenv('GCP_PROJECT_ID')
    GCP_REGION: Optional[str] = os.getenv('GCP_REGION')
    
    # Monitoring Config (Google Cloud Monitoring)
    METRICS_ENABLED: bool = os.getenv('METRICS_ENABLED', '').lower() != 'false'
    METRICS_COLLECT_INTERVAL: int = int(os.getenv('METRICS_COLLECT_INTERVAL', '15'))
    METRICS_RETENTION_DAYS: int = int(os.getenv('METRICS_RETENTION_DAYS', '30'))
    MEDICAL_METRICS_NAMESPACE: str = os.getenv('MEDICAL_METRICS_NAMESPACE', 'medical_platform')
    GOOGLE_CLOUD_MONITORING_ENABLED: bool = os.getenv('GOOGLE_CLOUD_MONITORING_ENABLED', 'true').lower() == 'true'

    # Advanced Systems Config - ATIVADOS POR PADRÃO
    UX_MONITORING_ENABLED: bool = os.getenv('UX_MONITORING_ENABLED', 'true').lower() == 'true'
    PREDICTIVE_ANALYTICS_ENABLED: bool = os.getenv('PREDICTIVE_ANALYTICS_ENABLED', 'true').lower() == 'true'
    ADVANCED_ANALYTICS_ENABLED: bool = os.getenv('ADVANCED_ANALYTICS_ENABLED', 'true').lower() == 'true'
    PERSONA_ANALYTICS_ENABLED: bool = os.getenv('PERSONA_ANALYTICS_ENABLED', 'true').lower() == 'true'
    BEHAVIOR_TRACKING_ENABLED: bool = os.getenv('BEHAVIOR_TRACKING_ENABLED', 'true').lower() == 'true'
    LEARNING_ANALYTICS_ENABLED: bool = os.getenv('LEARNING_ANALYTICS_ENABLED', 'true').lower() == 'true'
    PERFORMANCE_MONITORING_ENABLED: bool = os.getenv('PERFORMANCE_MONITORING_ENABLED', 'true').lower() == 'true'
    AI_SUGGESTIONS_ENABLED: bool = os.getenv('AI_SUGGESTIONS_ENABLED', 'true').lower() == 'true'
    
    
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
        """Retorna lista de variáveis de ambiente obrigatórias para prodção"""
        # Only require these in production environment
        if os.getenv('ENVIRONMENT') == 'production':
            required = [
                'SECRET_KEY',
                'OPENROUTER_API_KEY',
                'CORS_ORIGINS',
                'EMAIL_FROM',
                'EMAIL_PASSWORD'
            ]

            # Validar Supabase se habilitado
            if self.SUPABASE_URL:
                required.extend(['SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'])

            required.extend(['GCP_PROJECT_ID', 'GCP_REGION'])
            return required

        # In development, no variables are strictly required due to defaults
        return []

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

# Adicionar configurações extras no AppConfig após line 189
def _add_multimodal_and_celery_config():
    """Adiciona configurações de multimodal e Celery ao AppConfig"""

    # Multimodal Processing - ATIVADO
    AppConfig.MULTIMODAL_PROCESSING = os.getenv('MULTIMODAL_PROCESSING', 'true').lower() == 'true'
    AppConfig.OCR_ENABLED = os.getenv('OCR_ENABLED', 'true').lower() == 'true'
    AppConfig.COMPUTER_VISION = os.getenv('COMPUTER_VISION', 'true').lower() == 'true'
    AppConfig.DOCUMENT_ANALYSIS = os.getenv('DOCUMENT_ANALYSIS', 'true').lower() == 'true'
    AppConfig.IMAGE_UPLOAD_MAX_SIZE = int(os.getenv('IMAGE_UPLOAD_MAX_SIZE', 10485760))  # 10MB
    AppConfig.ALLOWED_IMAGE_FORMATS = os.getenv('ALLOWED_IMAGE_FORMATS', 'jpg,jpeg,png,pdf,tiff').split(',')

    # Tesseract Config
    AppConfig.TESSDATA_PREFIX = os.getenv('TESSDATA_PREFIX', '/usr/share/tesseract-ocr/5/tessdata/')
    AppConfig.OCR_LANGUAGE = os.getenv('OCR_LANGUAGE', 'por+eng')
    AppConfig.OCR_PSM = int(os.getenv('OCR_PSM', 6))  # Page segmentation mode

    # Background Jobs (Celery) - ATIVADO
    AppConfig.CELERY_ENABLED = os.getenv('CELERY_ENABLED', 'true').lower() == 'true'
    AppConfig.BACKGROUND_ANALYTICS = os.getenv('BACKGROUND_ANALYTICS', 'true').lower() == 'true'
    AppConfig.AUTO_BACKUP_ENABLED = os.getenv('AUTO_BACKUP_ENABLED', 'true').lower() == 'true'
    AppConfig.BACKGROUND_REPORTS = os.getenv('BACKGROUND_REPORTS', 'true').lower() == 'true'

    # SQLite specific configs
    AppConfig.SQLITE_DB_PATH = os.getenv('SQLITE_DB_PATH', './data/roteiros.db')
    AppConfig.SQLITE_BACKUP_INTERVAL = int(os.getenv('SQLITE_BACKUP_INTERVAL', 3600))  # 1 hora
    AppConfig.SQLITE_AUTO_VACUUM = os.getenv('SQLITE_AUTO_VACUUM', 'true').lower() == 'true'

    # Add runtime environment detection
    AppConfig.ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    AppConfig.IS_CLOUD_RUN = bool(os.getenv('K_SERVICE') or os.getenv('CLOUD_RUN_ENV'))

# Executar adição de configurações
_add_multimodal_and_celery_config()

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

# Listar variáveis obrigatórias não configuradas (apenas em produção)
current_env = os.getenv('ENVIRONMENT', 'development')
missing_vars = [var for var in config.get_required_env_vars() if not os.getenv(var)]

if missing_vars and current_env == 'production':
    logging.error(f"CRITICAL: Variáveis de ambiente obrigatórias faltando em produção: {', '.join(missing_vars)}")
elif missing_vars and current_env != 'development':
    logging.warning(f"Variáveis de ambiente recomendadas faltando: {', '.join(missing_vars)}")
else:
    # In development, show info about optional configuration
    optional_vars = ['OPENROUTER_API_KEY', 'EMAIL_PASSWORD', 'SUPABASE_URL']
    missing_optional = [var for var in optional_vars if not os.getenv(var)]
    if missing_optional:
        logging.info(f"Para funcionalidade completa, configure: {', '.join(missing_optional)}")

# Export configurations
__all__ = ['config', 'AppConfig', 'EnvironmentConfig']