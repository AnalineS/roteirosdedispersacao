#!/bin/bash
# ============================================================================
# Script para configurar GitHub Variables e Secrets via CLI
# Configuração de domínios personalizados sem hardcoding
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI não está instalado"
    echo "Instale: https://cli.github.com/"
    exit 1
fi

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    print_error "Não está autenticado no GitHub"
    echo "Execute: gh auth login"
    exit 1
fi

print_step "Configurando GitHub Variables para Cloud Run + Domínio Personalizado"

# ============================================================================
# COLETA DE INFORMAÇÕES INTERATIVA
# ============================================================================

echo ""
echo "📋 INFORMAÇÕES NECESSÁRIAS:"
echo "=========================="

# Domínio principal
read -p "🌐 Domínio principal (ex: roteirosdispensacao.com.br): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    print_error "Domínio é obrigatório"
    exit 1
fi

# GCP Project ID
read -p "☁️ GCP Project ID: " GCP_PROJECT_ID
if [[ -z "$GCP_PROJECT_ID" ]]; then
    print_error "GCP Project ID é obrigatório"
    exit 1
fi

# GCP Region
read -p "🌍 GCP Region (padrão: us-central1): " GCP_REGION
GCP_REGION=${GCP_REGION:-"us-central1"}

# Port
read -p "🚪 Port do frontend (padrão: 3000): " PORT
PORT=${PORT:-"3000"}

# ============================================================================
# CONFIGURAR VARIABLES
# ============================================================================

print_step "Configurando GitHub Variables..."

echo ""
echo "🏭 PRODUÇÃO:"
echo "============"

# Variables de Produção
gh variable set GCP_PROJECT_ID --body "$GCP_PROJECT_ID"
print_success "GCP_PROJECT_ID configurado"

gh variable set GCP_REGION --body "$GCP_REGION"
print_success "GCP_REGION configurado"

gh variable set PORT --body "$PORT"
print_success "PORT configurado"

gh variable set PRODUCTION_FRONTEND_DOMAIN --body "$DOMAIN"
print_success "PRODUCTION_FRONTEND_DOMAIN configurado"

gh variable set PRODUCTION_API_DOMAIN --body "api.$DOMAIN"
print_success "PRODUCTION_API_DOMAIN configurado"

gh variable set NEXT_PUBLIC_API_URL_PRODUCTION --body "https://api.$DOMAIN"
print_success "NEXT_PUBLIC_API_URL_PRODUCTION configurado"

echo ""
echo "🧪 HOMOLOGAÇÃO:"
echo "==============="

gh variable set HML_FRONTEND_DOMAIN --body "hml.$DOMAIN"
print_success "HML_FRONTEND_DOMAIN configurado"

gh variable set HML_API_DOMAIN --body "hml-api.$DOMAIN"
print_success "HML_API_DOMAIN configurado"

gh variable set NEXT_PUBLIC_API_URL_STAGING --body "https://hml-api.$DOMAIN"
print_success "NEXT_PUBLIC_API_URL_STAGING configurado"

# ============================================================================
# CONFIGURAR SERVICES NAMES
# ============================================================================

echo ""
echo "🛠️ SERVIÇOS CLOUD RUN:"
echo "======================"

gh variable set PRODUCTION_FRONTEND_SERVICE --body "roteiro-dispensacao-frontend"
gh variable set PRODUCTION_BACKEND_SERVICE --body "roteiro-dispensacao-api"
gh variable set HML_FRONTEND_SERVICE --body "hml-roteiro-dispensacao-frontend"
gh variable set HML_BACKEND_SERVICE --body "hml-roteiro-dispensacao-api"

print_success "Nomes dos serviços configurados"

# ============================================================================
# CONFIGURAR BUCKETS E STORAGE
# ============================================================================

echo ""
echo "💾 STORAGE:"
echo "==========="

gh variable set GCS_CACHE_BUCKET --body "${GCP_PROJECT_ID}-cache-bucket"
gh variable set GCS_BACKUP_BUCKET --body "${GCP_PROJECT_ID}-backup-bucket"

print_success "Buckets de storage configurados"

# ============================================================================
# LISTAR VARIABLES CONFIGURADAS
# ============================================================================

print_step "Verificando variables configuradas..."

echo ""
echo "📋 VARIABLES CONFIGURADAS:"
echo "=========================="

gh variable list

# ============================================================================
# CONFIGURAR SECRETS (OPCIONAL)
# ============================================================================

echo ""
print_warning "SECRETS devem ser configurados manualmente por segurança:"
echo ""
echo "🔑 SECRETS NECESSÁRIOS:"
echo "======================"
echo "gh secret set GCP_SERVICE_ACCOUNT_KEY --body=\"\$(cat path/to/service-account.json)\""
echo "gh secret set OPENROUTER_API_KEY --body=\"sua-api-key\""
echo "gh secret set SUPABASE_PROJECT_URL --body=\"https://xxx.supabase.co\""
echo "gh secret set SUPABASE_PUBLISHABLE_KEY --body=\"sua-key\""
echo "gh secret set TELEGRAM_BOT_TOKEN --body=\"seu-token\" # Opcional"
echo "gh secret set TELEGRAM_CHAT_ID --body=\"seu-chat-id\" # Opcional"

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo ""
echo "📊 RESUMO DA CONFIGURAÇÃO"
echo "========================="
echo ""
echo "🏭 PRODUÇÃO:"
echo "  Frontend: https://$DOMAIN"
echo "  API:      https://api.$DOMAIN"
echo ""
echo "🧪 HOMOLOGAÇÃO:"
echo "  Frontend: https://hml.$DOMAIN"
echo "  API:      https://hml-api.$DOMAIN"
echo ""
echo "☁️ GOOGLE CLOUD:"
echo "  Project:  $GCP_PROJECT_ID"
echo "  Region:   $GCP_REGION"
echo "  Port:     $PORT"
echo ""

print_success "GitHub Variables configuradas com sucesso!"

echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "1. Configure os secrets manualmente (GCP_SERVICE_ACCOUNT_KEY, etc.)"
echo "2. Execute o script de mapeamento de domínio: ./scripts/setup-domain-mapping.sh"
echo "3. Configure registros DNS no seu provedor"
echo "4. Teste os workflows de deploy"
echo ""