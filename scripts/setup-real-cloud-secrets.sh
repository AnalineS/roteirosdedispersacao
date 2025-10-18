#!/bin/bash
# -*- coding: utf-8 -*-
# Setup Real Cloud Secrets - NO MOCKS
# Configure GitHub secrets and environment variables for 100% real cloud integrations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script info
SCRIPT_NAME="🚀 Real Cloud Secrets Setup"
SCRIPT_VERSION="1.0.0"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}${SCRIPT_NAME} v${SCRIPT_VERSION}${NC}"
echo -e "${BLUE}100% REAL CLOUD INTEGRATIONS - NO MOCKS${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) not found. Please install it first:"
        echo "  - Ubuntu/Debian: sudo apt install gh"
        echo "  - macOS: brew install gh"
        echo "  - Windows: winget install GitHub.cli"
        exit 1
    fi

    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI not authenticated. Run: gh auth login"
        exit 1
    fi

    print_success "GitHub CLI authenticated and ready"
}

# Function to set GitHub secret
set_github_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local description="$3"

    if [ -z "$secret_value" ]; then
        print_warning "Skipping $secret_name - value not provided"
        return 0
    fi

    print_status "Setting GitHub secret: $secret_name"
    echo "$secret_value" | gh secret set "$secret_name" --app actions

    if [ $? -eq 0 ]; then
        print_success "$secret_name configured successfully"
    else
        print_error "Failed to set $secret_name"
        return 1
    fi
}

# Function to set GitHub variable
set_github_variable() {
    local var_name="$1"
    local var_value="$2"
    local description="$3"

    if [ -z "$var_value" ]; then
        print_warning "Skipping $var_name - value not provided"
        return 0
    fi

    print_status "Setting GitHub variable: $var_name"
    gh variable set "$var_name" --body "$var_value"

    if [ $? -eq 0 ]; then
        print_success "$var_name configured successfully"
    else
        print_error "Failed to set $var_name"
        return 1
    fi
}

# Function to validate environment file
validate_env_file() {
    local env_file="$1"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        return 1
    fi

    print_success "Environment file found: $env_file"

    # Check for required variables
    local required_vars=(
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_DB_URL"
        "CLOUD_STORAGE_BUCKET"
        "OPENROUTER_API_KEY"
        "SECRET_KEY"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi

    print_success "All required environment variables present"
    return 0
}

# Function to load environment file
load_env_file() {
    local env_file="$1"

    print_status "Loading environment variables from $env_file"

    # Source the file but capture only the variables we need
    set -a
    source "$env_file"
    set +a

    print_success "Environment variables loaded"
}

# Main setup function
setup_real_cloud_secrets() {
    local env_file="${1:-}"

    print_status "Starting REAL cloud secrets setup..."
    print_status "This will configure GitHub secrets for 100% real cloud integrations"
    echo

    # Check prerequisites
    check_gh_cli

    # Environment file handling
    if [ -z "$env_file" ]; then
        # Try to find .env file
        if [ -f ".env.production" ]; then
            env_file=".env.production"
        elif [ -f ".env" ]; then
            env_file=".env"
        else
            print_error "No environment file specified and no .env or .env.production found"
            echo "Usage: $0 [environment_file]"
            echo "Or create .env.production with required variables"
            exit 1
        fi
    fi

    # Validate and load environment file
    if ! validate_env_file "$env_file"; then
        exit 1
    fi

    load_env_file "$env_file"

    echo
    print_status "Setting up REAL cloud service secrets..."
    echo

    # === REAL SUPABASE CONFIGURATION ===
    print_status "📊 Configuring REAL Supabase integration..."
    set_github_secret "SUPABASE_URL" "${SUPABASE_URL:-}" "Real Supabase project URL"
    set_github_secret "SUPABASE_ANON_KEY" "${SUPABASE_ANON_KEY:-}" "Real Supabase anonymous key"
    set_github_secret "SUPABASE_DB_URL" "${SUPABASE_DB_URL:-}" "Real Supabase PostgreSQL connection string"

    # === REAL GOOGLE CLOUD STORAGE CONFIGURATION ===
    print_status "☁️ Configuring REAL Google Cloud Storage..."
    set_github_variable "CLOUD_STORAGE_BUCKET" "${CLOUD_STORAGE_BUCKET:-}" "Real GCS bucket name"

    # GCP Service Account (if provided)
    if [ -n "${GCP_SERVICE_ACCOUNT_KEY:-}" ]; then
        set_github_secret "GOOGLE_APPLICATION_CREDENTIALS_JSON" "${GCP_SERVICE_ACCOUNT_KEY}" "Real GCP service account credentials"
    elif [ -f "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
        local gcp_key_content
        gcp_key_content=$(cat "${GOOGLE_APPLICATION_CREDENTIALS}")
        set_github_secret "GOOGLE_APPLICATION_CREDENTIALS_JSON" "$gcp_key_content" "Real GCP service account credentials from file"
    else
        print_warning "GCP service account credentials not found. Set GCP_SERVICE_ACCOUNT_KEY env var or GOOGLE_APPLICATION_CREDENTIALS file path"
    fi

    # === REAL API CONFIGURATIONS ===
    print_status "🔑 Configuring REAL API keys..."
    set_github_secret "OPENROUTER_API_KEY" "${OPENROUTER_API_KEY:-}" "Real OpenRouter API key for AI models"
    set_github_secret "SECRET_KEY" "${SECRET_KEY:-}" "Application secret key"

    # === REAL ENVIRONMENT VARIABLES ===
    print_status "🌐 Configuring REAL environment variables..."
    set_github_variable "SUPABASE_URL_PRODUCTION" "${SUPABASE_URL:-}" "Production Supabase URL"
    set_github_variable "CLOUD_STORAGE_BUCKET_PRODUCTION" "${CLOUD_STORAGE_BUCKET:-}" "Production GCS bucket"

    # Optional: Firebase (if provided)
    if [ -n "${FIREBASE_SERVICE_ACCOUNT_KEY:-}" ]; then
        set_github_secret "FIREBASE_SERVICE_ACCOUNT_KEY" "${FIREBASE_SERVICE_ACCOUNT_KEY}" "Real Firebase service account"
        set_github_variable "FIREBASE_ENABLED" "true" "Enable Firebase integration"
    else
        print_warning "Firebase service account not provided - Firebase integration will be disabled"
        set_github_variable "FIREBASE_ENABLED" "false" "Disable Firebase integration"
    fi

    echo
    print_success "✅ REAL cloud secrets setup completed!"
    echo
    print_status "🔍 Verifying configuration..."

    # Verify secrets were set
    if gh secret list | grep -q "SUPABASE_URL" && \
       gh secret list | grep -q "CLOUD_STORAGE_BUCKET" && \
       gh secret list | grep -q "OPENROUTER_API_KEY"; then
        print_success "✅ Core secrets verified"
    else
        print_error "❌ Some core secrets missing"
        exit 1
    fi

    echo
    print_success "🚀 REAL CLOUD INTEGRATION SETUP COMPLETE!"
    print_status "Next steps:"
    echo "  1. Run GitHub Actions workflow to test real cloud connections"
    echo "  2. Monitor deployment logs for real cloud service initialization"
    echo "  3. Verify health checks show real cloud services (not mocks)"
    echo
    print_warning "⚠️ IMPORTANT: All cloud services will now use REAL connections"
    print_warning "   Ensure your cloud accounts have sufficient quotas and billing"
    print_warning "   Monitor usage and costs in your cloud provider consoles"
}

# Create environment template function
create_env_template() {
    local template_file=".env.real-cloud-template"

    print_status "Creating environment template: $template_file"

    cat > "$template_file" << 'EOF'
# ===================================================================
# REAL CLOUD INTEGRATIONS ENVIRONMENT VARIABLES
# NO MOCKS - Only real cloud service credentials
# ===================================================================

# === REAL SUPABASE CONFIGURATION ===
# Get these from your Supabase project dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres

# === REAL GOOGLE CLOUD STORAGE ===
# Create a bucket in Google Cloud Console
CLOUD_STORAGE_BUCKET=your-production-bucket-name

# GCP Service Account (JSON content or file path)
# Option 1: JSON content as environment variable
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}
# Option 2: Path to service account JSON file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# === REAL API KEYS ===
# Get from OpenRouter.ai dashboard
OPENROUTER_API_KEY=sk-or-v1-...

# Application secret (generate a secure random string)
SECRET_KEY=your-super-secure-secret-key

# === OPTIONAL: REAL FIREBASE ===
# Only if you want Firebase integration
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"firebase-project"...}

# === PRODUCTION CONFIGURATION ===
ENVIRONMENT=production
DEBUG=false
LGPD_MODE=strict
EOF

    print_success "Environment template created: $template_file"
    print_status "Copy this file to .env.production and fill in your real credentials"
}

# Help function
show_help() {
    echo "Usage: $0 [environment_file]"
    echo
    echo "Setup GitHub secrets and variables for real cloud integrations."
    echo
    echo "Arguments:"
    echo "  environment_file    Path to environment file (default: .env.production or .env)"
    echo
    echo "Options:"
    echo "  --help             Show this help message"
    echo "  --template         Create environment template file"
    echo
    echo "Examples:"
    echo "  $0                           # Use .env.production or .env"
    echo "  $0 .env.production          # Use specific file"
    echo "  $0 --template               # Create template file"
    echo
    echo "Required environment variables:"
    echo "  SUPABASE_URL               Real Supabase project URL"
    echo "  SUPABASE_ANON_KEY          Real Supabase anonymous key"
    echo "  SUPABASE_DB_URL            Real PostgreSQL connection string"
    echo "  CLOUD_STORAGE_BUCKET       Real GCS bucket name"
    echo "  OPENROUTER_API_KEY         Real OpenRouter API key"
    echo "  SECRET_KEY                 Application secret key"
    echo
    echo "Optional:"
    echo "  GCP_SERVICE_ACCOUNT_KEY    GCP service account JSON"
    echo "  FIREBASE_SERVICE_ACCOUNT_KEY  Firebase service account JSON"
}

# Main script logic
main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --template)
            create_env_template
            exit 0
            ;;
        *)
            setup_real_cloud_secrets "$@"
            ;;
    esac
}

# Run main function
main "$@"