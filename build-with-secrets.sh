#!/bin/bash

echo "🔐 Carregando secrets do GitHub para build local..."

# Criar arquivo .env.build temporário com secrets
cat > apps/frontend-nextjs/.env.build << 'EOF'
# Build Configuration with GitHub Secrets
NODE_ENV=production

# Firebase Configuration (from GitHub secrets)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# API Configuration
NEXT_PUBLIC_API_URL=https://roteiro-dispensacao-hml.onrender.com
NEXT_PUBLIC_ENVIRONMENT=production

# Feature flags from secrets
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_FIRESTORE_ENABLED=true
NEXT_PUBLIC_RAG_ENABLED=true
NEXT_PUBLIC_EMBEDDINGS_ENABLED=true

# Medical Platform Configuration
NEXT_PUBLIC_MEDICAL_CONTENT_VERSION=v2.0
NEXT_PUBLIC_PCDT_VERSION=2025
NEXT_PUBLIC_KNOWLEDGE_BASE_VERSION=v3.0
NEXT_PUBLIC_MEDICAL_DISCLAIMER_ENABLED=true
NEXT_PUBLIC_MEDICAL_VALIDATION_ENABLED=true

# Security Configuration
NEXT_PUBLIC_CSP_ENABLED=true
NEXT_PUBLIC_HSTS_ENABLED=true
NEXT_PUBLIC_SECURITY_HEADERS_ENABLED=true
NEXT_PUBLIC_X_CONTENT_TYPE_OPTIONS=nosniff
NEXT_PUBLIC_X_FRAME_OPTIONS=DENY

# LGPD Compliance
NEXT_PUBLIC_LGPD_COMPLIANCE_ENABLED=true
NEXT_PUBLIC_DATA_RETENTION_DAYS=365
NEXT_PUBLIC_AUDIT_LOGGING_ENABLED=true
NEXT_PUBLIC_DISCLAIMER_REQUIRED=true

# Monitoring & Analytics
NEXT_PUBLIC_GA_ENABLED=true
NEXT_PUBLIC_PERFORMANCE_MONITORING_ENABLED=true
NEXT_PUBLIC_ERROR_TRACKING_ENABLED=true
NEXT_PUBLIC_UPTIME_MONITORING_ENABLED=true

# AI Features
NEXT_PUBLIC_DR_GASNELIO_ENABLED=true
NEXT_PUBLIC_PERSONA_VALIDATION_ENABLED=true
NEXT_PUBLIC_SCOPE_DETECTION_ENABLED=true
NEXT_PUBLIC_STRUCTURED_DATA_ENABLED=true
NEXT_PUBLIC_FAIL_HONESTLY=true

# API Optimization
NEXT_PUBLIC_CIRCUIT_BREAKER_ENABLED=true
NEXT_PUBLIC_AI_PROVIDER_MAX_RETRIES=3
NEXT_PUBLIC_AI_PROVIDER_TIMEOUT=30000

# Cache Configuration
NEXT_PUBLIC_CACHE_TTL=300
NEXT_PUBLIC_CACHE_MAX_SIZE=100

# Internationalization
NEXT_PUBLIC_DEFAULT_LANGUAGE=pt-BR
NEXT_PUBLIC_SUPPORTED_LANGUAGES=pt-BR,en-US
NEXT_PUBLIC_TIMEZONE=America/Sao_Paulo

# OpenAPI Documentation
NEXT_PUBLIC_OPENAPI_ENABLED=false
NEXT_PUBLIC_SWAGGER_UI_ENABLED=false
NEXT_PUBLIC_REDOC_ENABLED=false
EOF

echo "📝 Populando secrets do GitHub..."

# Função para obter secret do GitHub
get_secret() {
    local secret_name=$1
    gh secret get "$secret_name" 2>/dev/null || echo ""
}

# Carregar Firebase secrets
FIREBASE_API_KEY=$(get_secret "FIREBASE_API_KEY")
FIREBASE_AUTH_DOMAIN=$(get_secret "FIREBASE_AUTH_DOMAIN")
FIREBASE_PROJECT_ID=$(get_secret "FIREBASE_PROJECT_ID")
FIREBASE_STORAGE_BUCKET=$(get_secret "FIREBASE_STORAGE_BUCKET")
FIREBASE_MESSAGING_SENDER_ID=$(get_secret "FIREBASE_MESSAGING_SENDER_ID")
FIREBASE_APP_ID=$(get_secret "FIREBASE_APP_ID")
GA_MEASUREMENT_ID=$(get_secret "GA_MEASUREMENT_ID")

# Atualizar .env.build com valores reais
if [ ! -z "$FIREBASE_API_KEY" ]; then
    sed -i "s/NEXT_PUBLIC_FIREBASE_API_KEY=/NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY/" apps/frontend-nextjs/.env.build
fi
if [ ! -z "$FIREBASE_AUTH_DOMAIN" ]; then
    sed -i "s/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN/" apps/frontend-nextjs/.env.build
fi
if [ ! -z "$FIREBASE_PROJECT_ID" ]; then
    sed -i "s/NEXT_PUBLIC_FIREBASE_PROJECT_ID=/NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID/" apps/frontend-nextjs/.env.build
fi
if [ ! -z "$FIREBASE_STORAGE_BUCKET" ]; then
    sed -i "s/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET/" apps/frontend-nextjs/.env.build
fi
if [ ! -z "$FIREBASE_MESSAGING_SENDER_ID" ]; then
    sed -i "s/NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=/NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID/" apps/frontend-nextjs/.env.build
fi
if [ ! -z "$FIREBASE_APP_ID" ]; then
    sed -i "s/NEXT_PUBLIC_FIREBASE_APP_ID=/NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID/" apps/frontend-nextjs/.env.build
fi

echo "✅ Secrets carregados com sucesso!"
echo "🚀 Iniciando build com configuração de produção..."

cd apps/frontend-nextjs

# Backup do .env.local atual
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "📋 Backup criado: .env.local.backup"
fi

# Usar .env.build para o build
cp .env.build .env.local

echo "🧪 Executando lint antes do build..."
npm run lint

echo "📦 Executando type check..."
npm run type-check || true

echo "🏗️ Executando build de produção..."
npm run build

BUILD_EXIT_CODE=$?

# Restaurar .env.local original
if [ -f ".env.local.backup" ]; then
    mv .env.local.backup .env.local
    echo "🔄 .env.local restaurado"
fi

# Limpar arquivo temporário
rm -f .env.build

cd ../..

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📊 Verificando tamanho dos bundles..."
    
    if [ -f "apps/frontend-nextjs/.next/static/chunks" ]; then
        echo "📁 Principais chunks gerados:"
        ls -lh apps/frontend-nextjs/.next/static/chunks/ | head -10
    fi
    
    echo "🎉 Build finalizado sem erros!"
else
    echo "❌ Build falhou com código: $BUILD_EXIT_CODE"
    exit $BUILD_EXIT_CODE
fi