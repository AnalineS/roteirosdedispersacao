#!/bin/bash

# ============================================================================
# GitHub Repository Configuration Script
# Configura automaticamente Secrets e Variables para deploy médico
# Substitui completamente arquivos .env - Configuração GitHub-Only
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="AnalineS/roteirosdedispersacao"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 GitHub Repository Configuration - Medical Platform${NC}"
echo "=================================================================="
echo "Repository: $REPO_NAME"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found. Please install: https://cli.github.com/${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not authenticated with GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# ============================================================================
# SECRETS CONFIGURATION (Sensitive Data)
# ============================================================================

configure_secrets() {
    echo -e "${BLUE}🔐 Configuring Repository Secrets${NC}"
    echo "----------------------------------"

    # Google Cloud Platform
    echo -e "${YELLOW}🏭 GCP Configuration${NC}"
    read -s -p "GCP_SERVICE_ACCOUNT_KEY (JSON): " GCP_SERVICE_ACCOUNT_KEY
    echo ""
    read -p "GCP_PROJECT_ID: " GCP_PROJECT_ID
    read -p "GCP_REGION (default: us-central1): " GCP_REGION
    GCP_REGION=${GCP_REGION:-"us-central1"}

    # Context7 MCP
    echo -e "${YELLOW}🤖 Context7 MCP Configuration${NC}"
    read -s -p "CONTEXT7_API_KEY: " CONTEXT7_API_KEY
    echo ""

    # Telegram Notifications
    echo -e "${YELLOW}📱 Telegram Configuration (Optional)${NC}"
    read -s -p "TELEGRAM_BOT_TOKEN (leave empty to skip): " TELEGRAM_BOT_TOKEN
    echo ""
    if [ ! -z "$TELEGRAM_BOT_TOKEN" ]; then
        read -p "TELEGRAM_CHAT_ID: " TELEGRAM_CHAT_ID
    fi

    # Security Tools
    echo -e "${YELLOW}🛡️ Security Tools (Optional)${NC}"
    read -s -p "SNYK_TOKEN (leave empty to skip): " SNYK_TOKEN
    echo ""

    # Google Analytics
    echo -e "${YELLOW}📊 Analytics Configuration (Optional)${NC}"
    read -p "GOOGLE_ANALYTICS_ID (leave empty to skip): " GOOGLE_ANALYTICS_ID
    read -s -p "GA4_API_SECRET (leave empty to skip): " GA4_API_SECRET
    echo ""

    echo -e "${BLUE}📝 Setting secrets...${NC}"

    # Set required secrets
    echo "$GCP_SERVICE_ACCOUNT_KEY" | gh secret set GCP_SERVICE_ACCOUNT_KEY --repo="$REPO_NAME"
    echo "$GCP_PROJECT_ID" | gh secret set GCP_PROJECT_ID --repo="$REPO_NAME"
    echo "$GCP_REGION" | gh secret set GCP_REGION --repo="$REPO_NAME"
    echo "$CONTEXT7_API_KEY" | gh secret set CONTEXT7_API_KEY --repo="$REPO_NAME"

    # Set optional secrets
    if [ ! -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "$TELEGRAM_BOT_TOKEN" | gh secret set TELEGRAM_BOT_TOKEN --repo="$REPO_NAME"
        echo "$TELEGRAM_CHAT_ID" | gh secret set TELEGRAM_CHAT_ID --repo="$REPO_NAME"
    fi

    if [ ! -z "$SNYK_TOKEN" ]; then
        echo "$SNYK_TOKEN" | gh secret set SNYK_TOKEN --repo="$REPO_NAME"
    fi

    if [ ! -z "$GOOGLE_ANALYTICS_ID" ]; then
        echo "$GOOGLE_ANALYTICS_ID" | gh secret set GOOGLE_ANALYTICS_ID --repo="$REPO_NAME"
    fi

    if [ ! -z "$GA4_API_SECRET" ]; then
        echo "$GA4_API_SECRET" | gh secret set GA4_API_SECRET --repo="$REPO_NAME"
    fi

    echo -e "${GREEN}✅ Secrets configured successfully${NC}"
    echo ""
}

# ============================================================================
# VARIABLES CONFIGURATION (Public Data)
# ============================================================================

configure_variables() {
    echo -e "${BLUE}🌐 Configuring Repository Variables${NC}"
    echo "------------------------------------"

    # Firebase Configuration
    echo -e "${YELLOW}🔥 Firebase Configuration${NC}"
    read -p "NEXT_PUBLIC_FIREBASE_API_KEY: " FIREBASE_API_KEY
    read -p "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: " FIREBASE_AUTH_DOMAIN
    read -p "NEXT_PUBLIC_FIREBASE_PROJECT_ID: " FIREBASE_PROJECT_ID
    read -p "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: " FIREBASE_STORAGE_BUCKET
    read -p "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: " FIREBASE_MESSAGING_SENDER_ID
    read -p "NEXT_PUBLIC_FIREBASE_APP_ID: " FIREBASE_APP_ID

    # API URLs by Environment
    echo -e "${YELLOW}🔗 API URLs Configuration${NC}"
    read -p "NEXT_PUBLIC_API_URL_STAGING (default: https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app): " API_URL_STAGING
    API_URL_STAGING=${API_URL_STAGING:-"https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app"}

    read -p "NEXT_PUBLIC_API_URL_PRODUCTION (default: https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app): " API_URL_PRODUCTION
    API_URL_PRODUCTION=${API_URL_PRODUCTION:-"https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app"}

    echo -e "${BLUE}📝 Setting variables...${NC}"

    # Set Firebase variables
    echo "$FIREBASE_API_KEY" | gh variable set NEXT_PUBLIC_FIREBASE_API_KEY --repo="$REPO_NAME"
    echo "$FIREBASE_AUTH_DOMAIN" | gh variable set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --repo="$REPO_NAME"
    echo "$FIREBASE_PROJECT_ID" | gh variable set NEXT_PUBLIC_FIREBASE_PROJECT_ID --repo="$REPO_NAME"
    echo "$FIREBASE_STORAGE_BUCKET" | gh variable set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --repo="$REPO_NAME"
    echo "$FIREBASE_MESSAGING_SENDER_ID" | gh variable set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --repo="$REPO_NAME"
    echo "$FIREBASE_APP_ID" | gh variable set NEXT_PUBLIC_FIREBASE_APP_ID --repo="$REPO_NAME"

    # Set API URL variables
    echo "$API_URL_STAGING" | gh variable set NEXT_PUBLIC_API_URL_STAGING --repo="$REPO_NAME"
    echo "$API_URL_PRODUCTION" | gh variable set NEXT_PUBLIC_API_URL_PRODUCTION --repo="$REPO_NAME"

    echo -e "${GREEN}✅ Variables configured successfully${NC}"
    echo ""
}

# ============================================================================
# LOCAL DEVELOPMENT CONFIGURATION
# ============================================================================

configure_local_env() {
    echo -e "${BLUE}💻 Local Development Configuration${NC}"
    echo "-----------------------------------"

    cat > "$PROJECT_ROOT/scripts/setup-local-env.sh" << 'EOF'
#!/bin/bash

# ============================================================================
# Local Development Environment Setup
# Configures environment variables for local development
# Run: source scripts/setup-local-env.sh
# ============================================================================

# Firebase Configuration (Public - same as GitHub Variables)
export NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
export NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# Local API Configuration
export NEXT_PUBLIC_API_URL="http://localhost:5000"
export NEXT_PUBLIC_ENVIRONMENT="development"

# Development Features
export NEXT_PUBLIC_AUTH_ENABLED="true"
export NEXT_PUBLIC_FIRESTORE_ENABLED="true"
export NEXT_PUBLIC_OFFLINE_MODE="true"
export NEXT_PUBLIC_DEBUG="true"

# Cache Configuration
export NEXT_PUBLIC_FIRESTORE_CACHE_ENABLED="true"
export NEXT_PUBLIC_CACHE_TTL_MINUTES="60"

echo "✅ Local environment variables configured"
echo "🚀 Run: npm run dev (in apps/frontend-nextjs)"
echo "🔧 Backend: python main.py (in apps/backend)"
EOF

    chmod +x "$PROJECT_ROOT/scripts/setup-local-env.sh"

    echo -e "${GREEN}✅ Local development script created: scripts/setup-local-env.sh${NC}"
    echo -e "${BLUE}📝 To use locally:${NC}"
    echo "   source scripts/setup-local-env.sh"
    echo "   cd apps/frontend-nextjs && npm run dev"
    echo ""
}

# ============================================================================
# VALIDATION AND SUMMARY
# ============================================================================

validate_configuration() {
    echo -e "${BLUE}🔍 Validating Configuration${NC}"
    echo "----------------------------"

    # Check secrets
    echo -e "${YELLOW}🔐 Checking secrets...${NC}"
    if gh secret list --repo="$REPO_NAME" | grep -q "GCP_SERVICE_ACCOUNT_KEY"; then
        echo -e "${GREEN}✅ GCP_SERVICE_ACCOUNT_KEY${NC}"
    else
        echo -e "${RED}❌ GCP_SERVICE_ACCOUNT_KEY${NC}"
    fi

    if gh secret list --repo="$REPO_NAME" | grep -q "CONTEXT7_API_KEY"; then
        echo -e "${GREEN}✅ CONTEXT7_API_KEY${NC}"
    else
        echo -e "${RED}❌ CONTEXT7_API_KEY${NC}"
    fi

    # Check variables
    echo -e "${YELLOW}🌐 Checking variables...${NC}"
    if gh variable list --repo="$REPO_NAME" | grep -q "NEXT_PUBLIC_FIREBASE_API_KEY"; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_FIREBASE_API_KEY${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_FIREBASE_API_KEY${NC}"
    fi

    if gh variable list --repo="$REPO_NAME" | grep -q "NEXT_PUBLIC_API_URL_STAGING"; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL_STAGING${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_API_URL_STAGING${NC}"
    fi

    if gh variable list --repo="$REPO_NAME" | grep -q "NEXT_PUBLIC_API_URL_PRODUCTION"; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL_PRODUCTION${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_API_URL_PRODUCTION${NC}"
    fi

    echo ""
}

generate_summary() {
    echo -e "${GREEN}🎉 Configuration Complete!${NC}"
    echo "=================================================================="
    echo ""
    echo -e "${BLUE}📋 Configuration Summary:${NC}"
    echo ""
    echo -e "${YELLOW}🔐 Secrets Configured:${NC}"
    echo "  • GCP_SERVICE_ACCOUNT_KEY (Google Cloud deployment)"
    echo "  • GCP_PROJECT_ID & GCP_REGION (Cloud configuration)"
    echo "  • CONTEXT7_API_KEY (MCP server authentication)"
    echo "  • TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID (notifications)"
    echo "  • SNYK_TOKEN (security scanning - optional)"
    echo "  • GOOGLE_ANALYTICS_ID & GA4_API_SECRET (analytics - optional)"
    echo ""
    echo -e "${YELLOW}🌐 Variables Configured:${NC}"
    echo "  • NEXT_PUBLIC_FIREBASE_* (Firebase configuration)"
    echo "  • NEXT_PUBLIC_API_URL_STAGING (staging API endpoint)"
    echo "  • NEXT_PUBLIC_API_URL_PRODUCTION (production API endpoint)"
    echo ""
    echo -e "${YELLOW}💻 Local Development:${NC}"
    echo "  • Created: scripts/setup-local-env.sh"
    echo "  • Usage: source scripts/setup-local-env.sh"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "  1. Push changes to trigger GitHub Actions"
    echo "  2. For local development: source scripts/setup-local-env.sh"
    echo "  3. Remove old .env files (they're no longer needed)"
    echo ""
    echo -e "${GREEN}✅ Your medical platform is now configured with GitHub-only secrets!${NC}"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo -e "${BLUE}🏥 Starting Medical Platform GitHub Configuration...${NC}"
    echo ""

    # Configuration steps
    configure_secrets
    configure_variables
    configure_local_env

    # Validation and summary
    validate_configuration
    generate_summary

    echo -e "${GREEN}🎯 Configuration completed successfully!${NC}"
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "GitHub Repository Configuration Script"
    echo ""
    echo "USAGE:"
    echo "  $0                 # Run interactive configuration"
    echo "  $0 --help         # Show this help"
    echo ""
    echo "DESCRIPTION:"
    echo "  Configures GitHub Secrets and Variables for the medical platform"
    echo "  Replaces .env files with GitHub-only configuration"
    echo ""
    echo "REQUIREMENTS:"
    echo "  • GitHub CLI (gh) installed and authenticated"
    echo "  • Repository access permissions"
    echo "  • Firebase project credentials"
    echo "  • Google Cloud Platform setup"
    exit 0
fi

# Run main function
main "$@"