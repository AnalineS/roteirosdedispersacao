#!/bin/bash

# GitHub Variables Configuration Script - Roteiro de Dispensação
# Configures all necessary variables for HML and Production environments
# Usage: ./configure-github-variables.sh

set -e

echo "🔧 Configurando variáveis GitHub para Roteiro de Dispensação..."

# Function to set GitHub variable
set_variable() {
    local name=$1
    local value=$2
    echo "Setting variable: $name"
    gh variable set "$name" --body "$value"
}

# Function to set GitHub secret
set_secret() {
    local name=$1
    local value=$2
    echo "Setting secret: $name"
    gh secret set "$name" --body "$value"
}

# Core Project Configuration
echo "📋 Setting core project variables..."
set_variable "GCP_PROJECT_ID" "red-truck-468923-s4"
set_variable "GCP_REGION" "us-central1"
set_variable "NODE_VERSION" "20"

# Environment Specific Configuration
echo "🏗️ Setting environment variables..."
set_variable "ENVIRONMENT_STAGING" "staging"
set_variable "ENVIRONMENT_PRODUCTION" "production"

# Service Names
echo "🐳 Setting service names..."
set_variable "BACKEND_SERVICE_HML" "hml-roteiro-dispensacao-api"
set_variable "BACKEND_SERVICE_PROD" "roteiro-dispensacao-api"
set_variable "FRONTEND_SERVICE_HML" "hml-roteiro-dispensacao-frontend"
set_variable "FRONTEND_SERVICE_PROD" "roteiro-dispensacao-frontend"

# Firebase Hosting Sites
echo "🔥 Setting Firebase hosting sites..."
set_variable "FRONTEND_SITE_HML" "hml-roteiros-de-dispensacao"
set_variable "FRONTEND_SITE_PROD" "roteiros-de-dispensacao"

# API URLs with versioning
echo "🌐 Setting API URLs..."
set_variable "NEXT_PUBLIC_API_URL_STAGING" "https://hml-roteiro-dispensacao-api-93670097797.us-central1.run.app/api/v1"
set_variable "NEXT_PUBLIC_API_URL_PRODUCTION" "https://roteiro-dispensacao-api-93670097797.us-central1.run.app/api/v1"

# Firebase Configuration (Public)
echo "🔥 Setting Firebase public configuration..."
set_variable "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "red-truck-468923-s4"
set_variable "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "red-truck-468923-s4.firebaseapp.com"
set_variable "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "red-truck-468923-s4.appspot.com"
set_variable "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "93670097797"
set_variable "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyAMQn7rF8xGtKJ2L9_3HwP4mE5nB8kD7qC"
set_variable "NEXT_PUBLIC_FIREBASE_APP_ID" "1:468923718037:web:a8b9c1d2e3f4g5h6i7j8k9l"

# Rate Limiting Configuration
echo "⚡ Setting rate limiting configuration..."
set_variable "RATE_LIMIT_ENABLED" "true"
set_variable "RATE_LIMIT_DEFAULT" "200/hour"
set_variable "RATE_LIMIT_CHAT" "50/hour"

# Security Configuration
echo "🔒 Setting security configuration..."
set_variable "SECURITY_MIDDLEWARE_ENABLED" "true"
set_variable "SESSION_COOKIE_SECURE" "true"
set_variable "SESSION_COOKIE_HTTPONLY" "true"

# Health Check Configuration
echo "❤️ Setting health check configuration..."
set_variable "HEALTH_CHECK_TIMEOUT" "30"

# Application Limits
echo "📏 Setting application limits..."
set_variable "MAX_CONTENT_LENGTH" "16777216"

# Critical Services for Monitoring
echo "🎯 Setting critical services..."
set_variable "CRITICAL_SERVICES" "ai_provider,rag,embeddings"

# External API Configuration
echo "🔌 Setting external API configuration..."
set_variable "API_URL_CONTEXT7" "https://context7.com/api/v1"
set_variable "MCP_URL" "https://mcp.context7.com/mcp"

# Build Configuration
echo "🏗️ Setting build configuration..."
set_variable "DOCKER_BUILDKIT" "1"
set_variable "COMPOSE_DOCKER_CLI_BUILD" "1"
set_variable "BUILD_TIMEOUT" "3000"
set_variable "BUILD_MACHINE_TYPE" "e2-highcpu-8"
set_variable "BUILD_DISK_SIZE" "100GB"

# Deployment Configuration
echo "🚀 Setting deployment configuration..."
set_variable "DEPLOYMENT_TIMEOUT" "600"
set_variable "HEALTH_CHECK_RETRIES" "5"
set_variable "HEALTH_CHECK_INTERVAL" "30"

# Cache Configuration
echo "💾 Setting cache configuration..."
set_variable "CACHE_STRATEGY" "aggressive"
set_variable "BUILD_CACHE_ENABLED" "true"
set_variable "DEPENDENCY_CACHE_ENABLED" "true"

# AI and Features Configuration (Secrets)
echo "🤖 Setting AI and features secrets..."

# Note: These secrets need to be set manually as they contain sensitive data
echo "⚠️  The following secrets need to be configured manually with actual values:"
echo "   - OPENROUTER_API_KEY"
echo "   - CONTEXT7_API_KEY"
echo "   - SECRET_KEY"
echo "   - GCP_SA_KEY (Service Account JSON)"
echo "   - FIREBASE_TOKEN"
echo ""
echo "✅ GCP_PROJECT_ID and GCP_REGION configured as VARIABLES (not secrets)"

# Environment-specific secrets that can be set
echo "🔐 Setting environment-specific secrets..."

# HML Environment Secrets
set_secret "HML_ENVIRONMENT" "staging"
set_secret "HML_DEBUG" "true"
set_secret "HML_FLASK_ENV" "development"
set_secret "HML_HOST" "0.0.0.0"
set_secret "HML_PORT" "8080"
set_secret "HML_LOG_LEVEL" "INFO"
set_secret "HML_LOG_FORMAT" "json"
set_secret "HML_STRUCTURED_LOGGING" "true"
set_secret "HML_RATE_LIMIT_ENABLED" "true"
set_secret "HML_RATE_LIMIT_PER_MINUTE" "60"
set_secret "HML_CACHE_TTL" "300"
set_secret "HML_CACHE_MAX_SIZE" "1000"
set_secret "HML_FIRESTORE_COLLECTION_PREFIX" "hml_"
set_secret "HML_CORS_ORIGINS" "https://hml-roteiros-de-dispensacao.web.app,https://hml-roteiro-dispensacao-frontend-93670097797.us-central1.run.app"
set_secret "HML_API_TITLE" "Roteiro de Dispensação API - HML"
set_secret "HML_API_DESCRIPTION" "API educacional para dispensação de medicamentos - Ambiente de Homologação"
set_secret "HML_API_VERSION" "1.0.0-hml"
set_secret "HML_HEALTH_CHECK_ENDPOINT" "/api/v1/health"
set_secret "HML_HEALTH_CHECK_TIMEOUT" "15"
set_secret "HML_ENABLE_TEST_ENDPOINTS" "true"
set_secret "HML_RESET_DATA_ON_DEPLOY" "false"
set_secret "HML_SYNTHETIC_DATA_ENABLED" "true"

# Feature Flags
echo "🎛️ Setting feature flags..."
set_secret "EMBEDDINGS_ENABLED" "true"
set_secret "RAG_ENABLED" "true"
set_secret "STRUCTURED_DATA_ENABLED" "true"
set_secret "PERSONA_VALIDATION_ENABLED" "true"
set_secret "DR_GASNELIO_ENABLED" "true"
set_secret "SCOPE_DETECTION_ENABLED" "true"
set_secret "MEDICAL_VALIDATION_ENABLED" "true"
set_secret "MEDICAL_DISCLAIMER_ENABLED" "true"

# Security Features
echo "🛡️ Setting security features..."
set_secret "SECURITY_HEADERS_ENABLED" "true"
set_secret "CSP_ENABLED" "true"
set_secret "HSTS_ENABLED" "true"
set_secret "X_FRAME_OPTIONS" "DENY"
set_secret "X_CONTENT_TYPE_OPTIONS" "nosniff"

# API Features
echo "📚 Setting API documentation features..."
set_secret "OPENAPI_ENABLED" "true"
set_secret "SWAGGER_UI_ENABLED" "true"
set_secret "REDOC_ENABLED" "true"

# Monitoring and Analytics
echo "📊 Setting monitoring configuration..."
set_secret "GA_ENABLED" "true"
set_secret "PERFORMANCE_MONITORING_ENABLED" "true"
set_secret "ERROR_TRACKING_ENABLED" "true"
set_secret "AUDIT_LOGGING_ENABLED" "true"
set_secret "UPTIME_MONITORING_ENABLED" "true"

# Content and Compliance
echo "📋 Setting content and compliance..."
set_secret "KNOWLEDGE_BASE_VERSION" "2024.1"
set_secret "MEDICAL_CONTENT_VERSION" "PCDT-2022"
set_secret "PCDT_VERSION" "2022"
set_secret "LGPD_COMPLIANCE_ENABLED" "true"
set_secret "DISCLAIMER_REQUIRED" "true"

# Circuit Breaker and Resilience
echo "🔄 Setting resilience configuration..."
set_secret "AI_CIRCUIT_BREAKER_ENABLED" "true"
set_secret "AI_PROVIDER_TIMEOUT" "30"
set_secret "AI_PROVIDER_MAX_RETRIES" "3"
set_secret "CIRCUIT_BREAKER_TIMEOUT" "60"
set_secret "FAIL_HONESTLY" "true"

# Localization
echo "🌐 Setting localization..."
set_secret "DEFAULT_LANGUAGE" "pt-BR"
set_secret "SUPPORTED_LANGUAGES" "pt-BR,en-US"
set_secret "TIMEZONE" "America/Sao_Paulo"

# Data Management
echo "🗄️ Setting data management..."
set_secret "DATA_RETENTION_DAYS" "365"
set_secret "USE_API_EMBEDDINGS" "true"

# Notification Configuration
echo "📧 Setting notification configuration..."
set_secret "TELEGRAM_ENABLED" "true"
set_secret "TELEGRAM_PARSE_MODE" "HTML"
set_secret "EMAIL_SENDER_NAME" "Roteiro de Dispensação"
set_secret "EMAIL_TEMPLATE_VERSION" "v1.0"

echo "✅ Configuração de variáveis GitHub concluída!"
echo ""
echo "📝 Próximos passos manuais:"
echo "1. Configure as seguintes secrets com valores reais:"
echo "   gh secret set OPENROUTER_API_KEY --body 'sua_chave_openrouter'"
echo "   gh secret set CONTEXT7_API_KEY --body 'sua_chave_context7'"
echo "   gh secret set SECRET_KEY --body 'sua_chave_secreta_flask'"
echo "   gh secret set GCP_SA_KEY --body 'conteudo_do_service_account_json'"
echo "   gh secret set FIREBASE_TOKEN --body 'seu_token_firebase'"
echo "   gh secret set GA_MEASUREMENT_ID --body 'seu_google_analytics_id'"
echo ""
echo "2. Verifique a configuração:"
echo "   gh variable list"
echo "   gh secret list"
echo ""
echo "🎯 Todas as variáveis estão configuradas para suportar:"
echo "   ✓ Deploy híbrido (Firebase + Cloud Run)"
echo "   ✓ Ambientes HML e Produção"
echo "   ✓ API versionada (/api/v1/)"
echo "   ✓ Firestore (não Redis)"
echo "   ✓ Validações honestas"
echo "   ✓ Todas as 60+ dependências ativas"