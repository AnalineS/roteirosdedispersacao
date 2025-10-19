# -*- coding: utf-8 -*-
"""
Configuration Manager - Clean Architecture
Replaces complex app_config.py with better separation of concerns
"""

import os
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod


logger = logging.getLogger(__name__)


class Environment(Enum):
    """Environment enumeration"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    HOMOLOGACAO = "homologacao"  # Portuguese staging equivalent
    HML = "hml"  # Common staging abbreviation
    PRODUCTION = "production"


class ConfigurationError(Exception):
    """Custom exception for configuration errors"""
    pass


@dataclass
class SecurityConfig:
    """Security-related configuration"""
    secret_key: str
    session_cookie_secure: bool
    session_cookie_httponly: bool
    session_cookie_samesite: str
    max_content_length: int
    rate_limit_enabled: bool
    security_auto_block_enabled: bool
    security_block_duration_minutes: int
    security_max_violations: int

    def validate(self) -> List[str]:
        """Validate security configuration"""
        errors = []

        if not self.secret_key or len(self.secret_key) < 32:
            errors.append("SECRET_KEY must be at least 32 characters long")

        if self.max_content_length > 100 * 1024 * 1024:  # 100MB
            errors.append("MAX_CONTENT_LENGTH should not exceed 100MB")

        return errors


@dataclass
class DatabaseConfig:
    """Database-related configuration"""
    supabase_url: Optional[str]
    supabase_anon_key: Optional[str]
    supabase_service_key: Optional[str]
    supabase_jwt_secret: Optional[str]
    sqlite_db_path: str
    vector_db_type: str
    pgvector_dimensions: int

    def validate(self) -> List[str]:
        """Validate database configuration"""
        errors = []

        if self.vector_db_type == 'supabase' and not self.supabase_url:
            errors.append("SUPABASE_URL required when using Supabase vector DB")

        if self.pgvector_dimensions not in [384, 512, 768, 1536]:
            errors.append("PGVECTOR_DIMENSIONS must be a valid embedding dimension")

        return errors


@dataclass
class AIConfig:
    """AI and ML-related configuration"""
    openrouter_api_key: Optional[str]
    huggingface_api_key: Optional[str]
    openai_api_key: Optional[str]
    embedding_model: str
    embedding_device: str
    embeddings_max_length: int
    embedding_batch_size: int
    rag_available: bool
    qa_enabled: bool
    qa_min_score: float

    def validate(self) -> List[str]:
        """Validate AI configuration"""
        errors = []

        if not any([self.openrouter_api_key, self.huggingface_api_key, self.openai_api_key]):
            errors.append("At least one AI API key must be configured")

        if self.qa_min_score < 0.0 or self.qa_min_score > 1.0:
            errors.append("QA_MIN_SCORE must be between 0.0 and 1.0")

        if self.embedding_batch_size < 1 or self.embedding_batch_size > 128:
            errors.append("EMBEDDING_BATCH_SIZE must be between 1 and 128")

        return errors


@dataclass
class CacheConfig:
    """Cache-related configuration"""
    unified_cache_enabled: bool
    memory_cache_size: int
    memory_cache_ttl: int
    cloud_cache_enabled: bool
    advanced_cache: bool
    cache_max_size: int
    cache_ttl_minutes: int

    def validate(self) -> List[str]:
        """Validate cache configuration"""
        errors = []

        if self.memory_cache_size < 100:
            errors.append("MEMORY_CACHE_SIZE should be at least 100")

        if self.memory_cache_ttl < 10:
            errors.append("MEMORY_CACHE_TTL should be at least 10 seconds")

        return errors


@dataclass
class ServerConfig:
    """Server-related configuration"""
    host: str
    port: int
    debug: bool
    testing: bool
    cors_origins: List[str] = field(default_factory=list)

    def validate(self) -> List[str]:
        """Validate server configuration"""
        errors = []

        if self.port < 1 or self.port > 65535:
            errors.append("PORT must be between 1 and 65535")

        environment = os.environ.get('ENVIRONMENT', '').lower()
        if self.debug and environment in ['production']:
            errors.append("DEBUG should not be enabled in production")

        return errors


class ConfigValidator:
    """Configuration validation utility"""

    @staticmethod
    def validate_environment_specific(config: 'AppConfig', environment: Environment) -> List[str]:
        """Validate configuration for specific environment"""
        errors = []

        if environment in [Environment.PRODUCTION]:
            if config.server.debug:
                errors.append("Debug mode should be disabled in production")

            if not config.security.session_cookie_secure:
                errors.append("Secure cookies should be enabled in production")

            if len(config.security.secret_key) < 64:
                errors.append("Production secret key should be at least 64 characters")

        elif environment in [Environment.STAGING, Environment.HOMOLOGACAO, Environment.HML]:
            # Staging environments should be similar to production but with relaxed requirements
            if len(config.security.secret_key) < 32:
                errors.append("Staging secret key should be at least 32 characters")

        return errors


class EnvironmentConfigLoader:
    """Load configuration from environment variables"""

    @staticmethod
    def load_security_config() -> SecurityConfig:
        """Load security configuration from environment"""
        return SecurityConfig(
            secret_key=os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production-min-32-chars'),
            session_cookie_secure=os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true',
            session_cookie_httponly=os.getenv('SESSION_COOKIE_HTTPONLY', 'true').lower() == 'true',
            session_cookie_samesite=os.getenv('SESSION_COOKIE_SAMESITE', 'Lax'),
            max_content_length=int(os.getenv('MAX_CONTENT_LENGTH', 16777216)),  # 16MB
            rate_limit_enabled=os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true',
            security_auto_block_enabled=os.getenv('SECURITY_AUTO_BLOCK_ENABLED', 'true').lower() == 'true',
            security_block_duration_minutes=int(os.getenv('SECURITY_BLOCK_DURATION_MINUTES', 15)),
            security_max_violations=int(os.getenv('SECURITY_MAX_VIOLATIONS', 5))
        )

    @staticmethod
    def load_database_config() -> DatabaseConfig:
        """Load database configuration from environment"""
        return DatabaseConfig(
            supabase_url=os.getenv('SUPABASE_URL'),
            supabase_anon_key=os.getenv('SUPABASE_ANON_KEY'),
            supabase_service_key=os.getenv('SUPABASE_SERVICE_KEY'),
            supabase_jwt_secret=os.getenv('SUPABASE_JWT_SECRET'),
            sqlite_db_path=os.getenv('SQLITE_DB_PATH', './data/roteiros.db'),
            vector_db_type=os.getenv('VECTOR_DB_TYPE', 'supabase'),
            pgvector_dimensions=int(os.getenv('PGVECTOR_DIMENSIONS', 384))
        )

    @staticmethod
    def load_ai_config() -> AIConfig:
        """Load AI configuration from environment"""
        return AIConfig(
            openrouter_api_key=os.getenv('OPENROUTER_API_KEY'),
            huggingface_api_key=os.getenv('HUGGINGFACE_API_KEY'),
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            embedding_model=os.getenv('EMBEDDING_MODEL', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'),
            embedding_device=os.getenv('EMBEDDING_DEVICE', 'cpu'),
            embeddings_max_length=int(os.getenv('EMBEDDINGS_MAX_LENGTH', 512)),
            embedding_batch_size=int(os.getenv('EMBEDDING_BATCH_SIZE', 32)),
            rag_enabled=os.getenv('RAG_ENABLED', 'true').lower() == 'true',
            qa_enabled=os.getenv('QA_ENABLED', 'true').lower() == 'true',
            qa_min_score=float(os.getenv('QA_MIN_SCORE', 0.90))
        )

    @staticmethod
    def load_cache_config() -> CacheConfig:
        """Load cache configuration from environment"""
        return CacheConfig(
            unified_cache_enabled=os.getenv('UNIFIED_CACHE_ENABLED', 'true').lower() == 'true',
            memory_cache_size=int(os.getenv('MEMORY_CACHE_SIZE', 2000)),
            memory_cache_ttl=int(os.getenv('MEMORY_CACHE_TTL', 120)),
            cloud_cache_enabled=os.getenv('CLOUD_CACHE_ENABLED', 'true').lower() == 'true',
            advanced_cache=os.getenv('ADVANCED_CACHE', 'true').lower() == 'true',
            cache_max_size=int(os.getenv('CACHE_MAX_SIZE', 1000)),
            cache_ttl_minutes=int(os.getenv('CACHE_TTL_MINUTES', 60))
        )

    @staticmethod
    def load_server_config() -> ServerConfig:
        """Load server configuration from environment"""
        return ServerConfig(
            host=os.getenv('HOST', '0.0.0.0'),
            port=int(os.getenv('PORT', 8080)),
            debug=os.getenv('DEBUG', 'false').lower() == 'true',
            testing=os.getenv('TESTING', 'false').lower() == 'true',
            cors_origins=EnvironmentConfigLoader._load_cors_origins()
        )

    @staticmethod
    def _load_cors_origins() -> List[str]:
        """Load CORS origins based on environment"""
        environment = os.getenv('ENVIRONMENT', 'development')

        if environment == 'production':
            origins_str = os.getenv('CORS_ORIGINS_PROD', '')
            default_origins = [
                'https://roteiros-de-dispensacao.web.app',
                'https://roteirosdedispensacao.com',
                'https://www.roteirosdedispensacao.com'
            ]
        elif environment in ['staging', 'homologacao', 'hml']:
            origins_str = os.getenv('CORS_ORIGINS_HML', '')
            default_origins = [
                'https://hml-roteiros-de-dispensacao.web.app',
                'https://hml-roteiros-de-dispensacao.firebaseapp.com',
                'http://localhost:3000'
            ]
        else:  # development
            origins_str = os.getenv('CORS_ORIGINS', '')
            default_origins = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'http://localhost:5173'
            ]

        if origins_str:
            return [origin.strip() for origin in origins_str.split(',')]
        return default_origins


class AppConfig:
    """Main application configuration manager"""

    def __init__(self):
        self.security = EnvironmentConfigLoader.load_security_config()
        self.database = EnvironmentConfigLoader.load_database_config()
        self.ai = EnvironmentConfigLoader.load_ai_config()
        self.cache = EnvironmentConfigLoader.load_cache_config()
        self.server = EnvironmentConfigLoader.load_server_config()
        self.environment = Environment(os.getenv('ENVIRONMENT', 'development'))

    def validate(self) -> bool:
        """
        Validate complete configuration

        Returns:
            True if configuration is valid, False otherwise
        """
        all_errors = []

        # Validate individual components
        all_errors.extend(self.security.validate())
        all_errors.extend(self.database.validate())
        all_errors.extend(self.ai.validate())
        all_errors.extend(self.cache.validate())
        all_errors.extend(self.server.validate())

        # Validate environment-specific rules
        environment_errors = ConfigValidator.validate_environment_specific(self, self.environment)
        all_errors.extend(environment_errors)

        if all_errors:
            for error in all_errors:
                logger.error(f"Configuration Error: {error}")
            return False

        return True

    def get_missing_required_vars(self) -> List[str]:
        """Get list of missing required environment variables"""
        missing = []

        if self.environment == Environment.PRODUCTION:
            required_vars = {
                'SECRET_KEY': self.security.secret_key,
                'SUPABASE_URL': self.database.supabase_url,
                'SUPABASE_SERVICE_KEY': self.database.supabase_service_key
            }

            # Verify all production required vars
            for var_name, var_value in required_vars.items():
                if not var_value:
                    missing.append(var_name)

        elif self.environment in [Environment.STAGING, Environment.HOMOLOGACAO, Environment.HML]:
            # Staging environments have relaxed requirements
            required_vars = {
                'SECRET_KEY': self.security.secret_key
            }

            # At least one AI API key is required
            if not any([self.ai.openrouter_api_key, self.ai.huggingface_api_key, self.ai.openai_api_key]):
                missing.append('AI_API_KEY (OPENROUTER_API_KEY, HUGGINGFACE_API_KEY, or OPENAI_API_KEY)')

            for var_name, var_value in required_vars.items():
                if not var_value:
                    missing.append(var_name)
        else:
            # Development and other environments have minimal requirements
            required_vars = {
                'SECRET_KEY': self.security.secret_key
            }

            for var_name, var_value in required_vars.items():
                if not var_value:
                    missing.append(var_name)

        return missing

    def get_config_summary(self) -> Dict[str, Any]:
        """Get configuration summary for logging"""
        return {
            "environment": self.environment.value,
            "debug": self.server.debug,
            "rag_available": self.ai.rag_available,
            "cache_enabled": self.cache.unified_cache_enabled,
            "security_enabled": self.security.rate_limit_enabled,
            "cors_origins_count": len(self.server.cors_origins)
        }


# Global configuration instance
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """Get global configuration instance"""
    global _config
    if _config is None:
        _config = AppConfig()

        # Validate configuration on first load
        if not _config.validate():
            if _config.environment == Environment.PRODUCTION:
                raise ConfigurationError("Invalid configuration in production environment")
            else:
                logger.warning("Configuration validation failed - continuing in development mode")

    return _config


def initialize_configuration() -> AppConfig:
    """Initialize and validate configuration"""
    config = get_config()

    # Log missing variables
    missing_vars = config.get_missing_required_vars()
    if missing_vars:
        if config.environment == Environment.PRODUCTION:
            logger.error(f"Missing required variables in production: {', '.join(missing_vars)}")
        else:
            logger.info(f"Optional variables not configured: {', '.join(missing_vars)}")

    # Log configuration summary
    summary = config.get_config_summary()
    logger.info(f"Configuration initialized: {summary}")

    return config