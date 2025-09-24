#!/bin/bash
# -*- coding: utf-8 -*-
"""
Cloud Environment Setup Script
Sets up real cloud environment variables and GitHub secrets
NO MOCKS - Only real cloud service configuration
"""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="your-github-username"
REPO_NAME="roteiro-dispensacao"
ENVIRONMENT="production"

echo -e "${BLUE}🚀 Setting up REAL cloud environment configuration${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed. Please install it first.${NC}"
    echo "Visit: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️ Please authenticate with GitHub CLI first${NC}"
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI is authenticated${NC}"

# Function to set GitHub secret
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3

    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⚠️ Skipping empty secret: $secret_name${NC}"
        return
    fi

    echo -e "${BLUE}Setting secret: $secret_name${NC}"
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO_OWNER/$REPO_NAME"
    echo -e "${GREEN}✅ Set: $secret_name - $description${NC}"
}

# Function to prompt for secret value
prompt_for_secret() {
    local var_name=$1
    local description=$2
    local is_required=$3

    echo -e "${YELLOW}Enter $description:${NC}"
    if [[ "$is_required" == "required" ]]; then
        echo -e "${RED}(REQUIRED for cloud functionality)${NC}"
    else
        echo -e "${BLUE}(Optional - press Enter to skip)${NC}"
    fi

    read -s secret_value

    if [[ -n "$secret_value" ]]; then
        eval "$var_name='$secret_value'"
        echo -e "${GREEN}✅ $description set${NC}"
    elif [[ "$is_required" == "required" ]]; then
        echo -e "${RED}❌ $description is required${NC}"
        exit 1
    else
        echo -e "${YELLOW}⚠️ Skipping optional $description${NC}"
    fi
}

echo -e "${BLUE}📋 REAL CLOUD SERVICES CONFIGURATION${NC}"
echo "This script will set up GitHub secrets for:"
echo "  - Real Supabase PostgreSQL + pgvector"
echo "  - Real Google Cloud Storage"
echo "  - Real OpenRouter AI integration"
echo "  - Production environment variables"
echo ""

# Supabase Configuration (REQUIRED)
echo -e "${GREEN}🔧 SUPABASE CONFIGURATION (REQUIRED)${NC}"
echo "Get these from your Supabase project dashboard:"
echo ""

prompt_for_secret "SUPABASE_URL" "Supabase Project URL (https://xxx.supabase.co)" "required"
prompt_for_secret "SUPABASE_ANON_KEY" "Supabase Anon/Public Key" "required"
prompt_for_secret "SUPABASE_SERVICE_KEY" "Supabase Service/Secret Key" "required"
prompt_for_secret "SUPABASE_JWT_SECRET" "Supabase JWT Secret" "optional"
prompt_for_secret "SUPABASE_DB_URL" "Supabase PostgreSQL Connection URL" "optional"

# Google Cloud Configuration (REQUIRED)
echo -e "${GREEN}🔧 GOOGLE CLOUD CONFIGURATION (REQUIRED)${NC}"
echo "Get these from Google Cloud Console:"
echo ""

prompt_for_secret "GOOGLE_CLOUD_PROJECT" "Google Cloud Project ID" "required"
prompt_for_secret "CLOUD_STORAGE_BUCKET" "Primary GCS Bucket Name" "required"
prompt_for_secret "GCS_CACHE_BUCKET" "GCS Cache Bucket Name" "optional"
prompt_for_secret "GCS_BACKUP_BUCKET" "GCS Backup Bucket Name" "optional"

echo -e "${YELLOW}Service Account JSON:${NC}"
echo "Paste your Google Cloud Service Account JSON (entire JSON object):"
read -r GOOGLE_APPLICATION_CREDENTIALS_JSON

# OpenRouter Configuration (REQUIRED)
echo -e "${GREEN}🔧 OPENROUTER CONFIGURATION (REQUIRED)${NC}"
echo "Get API key from: https://openrouter.ai/"
echo ""

prompt_for_secret "OPENROUTER_API_KEY" "OpenRouter API Key" "required"

# Optional Services
echo -e "${GREEN}🔧 OPTIONAL SERVICES${NC}"
echo ""

prompt_for_secret "HUGGINGFACE_API_KEY" "HuggingFace API Key" "optional"
prompt_for_secret "OPENAI_API_KEY" "OpenAI API Key" "optional"

# Email Configuration
echo -e "${GREEN}🔧 EMAIL CONFIGURATION${NC}"
echo ""

prompt_for_secret "EMAIL_PASSWORD" "Gmail App Password for notifications" "optional"

# Security Configuration
echo -e "${GREEN}🔧 SECURITY CONFIGURATION${NC}"
echo ""

# Generate secure secret key if not provided
if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    echo -e "${GREEN}✅ Generated secure SECRET_KEY${NC}"
fi

# Set all GitHub secrets
echo -e "${BLUE}📤 Setting GitHub Secrets...${NC}"

# Core Flask Configuration
set_github_secret "SECRET_KEY" "$SECRET_KEY" "Flask secret key"
set_github_secret "ENVIRONMENT" "production" "Environment"

# CORS Configuration
set_github_secret "CORS_ORIGINS" "https://roteirosdedispensacao.com,https://your-frontend-domain.com" "CORS origins"

# Supabase Secrets
set_github_secret "SUPABASE_URL" "$SUPABASE_URL" "Supabase project URL"
set_github_secret "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "Supabase anon key"
set_github_secret "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY" "Supabase service key"
set_github_secret "SUPABASE_JWT_SECRET" "$SUPABASE_JWT_SECRET" "Supabase JWT secret"
set_github_secret "SUPABASE_DB_URL" "$SUPABASE_DB_URL" "Supabase PostgreSQL URL"

# Google Cloud Secrets
set_github_secret "GOOGLE_CLOUD_PROJECT" "$GOOGLE_CLOUD_PROJECT" "Google Cloud project ID"
set_github_secret "CLOUD_STORAGE_BUCKET" "$CLOUD_STORAGE_BUCKET" "Primary GCS bucket"
set_github_secret "GCS_CACHE_BUCKET" "$GCS_CACHE_BUCKET" "GCS cache bucket"
set_github_secret "GCS_BACKUP_BUCKET" "$GCS_BACKUP_BUCKET" "GCS backup bucket"
set_github_secret "GOOGLE_APPLICATION_CREDENTIALS_JSON" "$GOOGLE_APPLICATION_CREDENTIALS_JSON" "GCS service account JSON"
set_github_secret "GCP_REGION" "us-central1" "GCP region"

# AI API Secrets
set_github_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "OpenRouter API key"
set_github_secret "HUGGINGFACE_API_KEY" "$HUGGINGFACE_API_KEY" "HuggingFace API key"
set_github_secret "OPENAI_API_KEY" "$OPENAI_API_KEY" "OpenAI API key"

# Email Configuration
set_github_secret "EMAIL_FROM" "noreply@roteirosdedispensacao.com" "Email sender"
set_github_secret "EMAIL_PASSWORD" "$EMAIL_PASSWORD" "Email password"

# Production Feature Flags
set_github_secret "EMBEDDINGS_ENABLED" "true" "Enable embeddings"
set_github_secret "RAG_AVAILABLE" "true" "Enable RAG system"
set_github_secret "ADVANCED_FEATURES" "true" "Enable advanced features"
set_github_secret "CLOUD_CACHE_ENABLED" "true" "Enable cloud cache"
set_github_secret "SECURITY_MIDDLEWARE_ENABLED" "true" "Enable security middleware"

# Create local .env file for development
echo -e "${BLUE}📝 Creating local .env.local file...${NC}"

cat > apps/backend/.env.local << EOF
# Local Development Environment - REAL CLOUD SERVICES
# Copy of production secrets for local testing with real cloud services
# DO NOT COMMIT THIS FILE

# Environment
ENVIRONMENT=development
DEBUG=true

# Flask Configuration
SECRET_KEY=$SECRET_KEY

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Supabase Configuration - REAL
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET
SUPABASE_DB_URL=$SUPABASE_DB_URL

# Google Cloud Configuration - REAL
GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
CLOUD_STORAGE_BUCKET=$CLOUD_STORAGE_BUCKET
GCS_CACHE_BUCKET=$GCS_CACHE_BUCKET
GCS_BACKUP_BUCKET=$GCS_BACKUP_BUCKET
GCP_REGION=us-central1

# AI APIs - REAL
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
HUGGINGFACE_API_KEY=$HUGGINGFACE_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY

# Email Configuration
EMAIL_FROM=noreply@roteirosdedispensacao.com
EMAIL_PASSWORD=$EMAIL_PASSWORD

# Feature Flags - All Enabled
EMBEDDINGS_ENABLED=true
RAG_AVAILABLE=true
ADVANCED_FEATURES=true
CLOUD_CACHE_ENABLED=true
SECURITY_MIDDLEWARE_ENABLED=true

# Local Development Alternatives (disabled by default - enable if needed)
LOCAL_POSTGRES_ENABLED=false
LOCAL_POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/medical_platform
LOCAL_REDIS_ENABLED=false
LOCAL_REDIS_URL=redis://localhost:6379/0
LOCALSTACK_ENABLED=false
LOCALSTACK_ENDPOINT=http://localhost:4566
EOF

# Create Google Cloud Service Account JSON file
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS_JSON" ]; then
    echo -e "${BLUE}📝 Creating service account JSON file...${NC}"
    echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > apps/backend/service-account.json
    echo "GOOGLE_APPLICATION_CREDENTIALS=./service-account.json" >> apps/backend/.env.local
    echo -e "${GREEN}✅ Service account JSON file created${NC}"
    echo -e "${RED}⚠️ Remember to add service-account.json to .gitignore${NC}"
fi

# Update .gitignore
echo -e "${BLUE}📝 Updating .gitignore...${NC}"

cat >> .gitignore << EOF

# Local environment files - DO NOT COMMIT
apps/backend/.env.local
apps/backend/service-account.json
apps/backend/google-cloud-credentials.json

# Local development data
apps/backend/data/*.db
apps/backend/cache/
EOF

echo -e "${GREEN}✅ .gitignore updated${NC}"

echo -e "${GREEN}🎉 REAL CLOUD ENVIRONMENT SETUP COMPLETED!${NC}"
echo ""
echo -e "${BLUE}📋 SUMMARY:${NC}"
echo "✅ GitHub secrets configured for production deployment"
echo "✅ Local .env.local file created for development"
echo "✅ Service account JSON file created (if provided)"
echo "✅ .gitignore updated to protect sensitive files"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Test local development: cd apps/backend && python main.py"
echo "2. Deploy to production: git push origin main (triggers GitHub Actions)"
echo "3. Monitor logs for any missing configuration"
echo ""
echo -e "${RED}SECURITY NOTES:${NC}"
echo "🔒 Never commit .env.local or service-account.json files"
echo "🔒 Rotate secrets regularly"
echo "🔒 Use least-privilege access for service accounts"
echo "🔒 Monitor cloud resource usage and costs"
echo ""
echo -e "${GREEN}✨ All cloud integrations are REAL - NO MOCKS! ✨${NC}"