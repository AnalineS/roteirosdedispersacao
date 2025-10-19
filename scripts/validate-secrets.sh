#!/bin/bash
# ============================================================================
# SCRIPT DE VALIDAÇÃO DE SECRETS - PR #175
# Valida se todos os GitHub Secrets necessários estão configurados
# ============================================================================

echo "🔐 Validando GitHub Secrets para PRs 171-176..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL=0
EXISTS=0
MISSING=0

# Função para verificar secret
check_secret() {
    local secret_name=$1
    local description=$2
    local required=${3:-true}
    
    TOTAL=$((TOTAL + 1))
    
    if gh secret list | grep -q "^$secret_name"; then
        echo -e "${GREEN}✓${NC} $secret_name - $description"
        EXISTS=$((EXISTS + 1))
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗${NC} $secret_name - $description ${RED}(OBRIGATÓRIO)${NC}"
            MISSING=$((MISSING + 1))
        else
            echo -e "${YELLOW}⚠${NC} $secret_name - $description ${YELLOW}(OPCIONAL)${NC}"
        fi
    fi
}

echo -e "${BLUE}=== SECRETS ESSENCIAIS (CORE) ===${NC}"
check_secret "SECRET_KEY" "Flask secret key"
check_secret "GCP_SERVICE_ACCOUNT_KEY" "Google Cloud Platform credentials"

echo ""
echo -e "${BLUE}=== FIREBASE CONFIGURATION ===${NC}"
check_secret "FIREBASE_API_KEY" "Firebase API Key"
check_secret "FIREBASE_AUTH_DOMAIN" "Firebase Auth Domain"
check_secret "FIREBASE_PROJECT_ID" "Firebase Project ID"
check_secret "FIREBASE_STORAGE_BUCKET" "Firebase Storage Bucket"
check_secret "FIREBASE_MESSAGING_SENDER_ID" "Firebase Messaging Sender ID"
check_secret "FIREBASE_APP_ID" "Firebase App ID"

echo ""
echo -e "${BLUE}=== ANALYTICS (PR #176) ===${NC}"
check_secret "GA_MEASUREMENT_ID" "Google Analytics 4 Measurement ID"
check_secret "GA_ENABLED" "Google Analytics habilitado"

echo ""
echo -e "${BLUE}=== EMAIL SERVICES (PR #175) ===${NC}"
check_secret "SENDGRID_API_KEY" "SendGrid API Key para notificações" "false"
check_secret "EMAIL_FROM" "Email remetente padrão" "false"
check_secret "EMAIL_FROM_NAME" "Nome do remetente" "false"
check_secret "SMTP_HOST" "SMTP Host (fallback)" "false"
check_secret "SMTP_USERNAME" "SMTP Username (fallback)" "false"
check_secret "SMTP_PASSWORD" "SMTP Password (fallback)" "false"

echo ""
echo -e "${BLUE}=== DATABASE CONFIGURATION ===${NC}"
check_secret "DATABASE_URL" "Database connection URL" "false"
check_secret "DB_PASSWORD" "Database password" "false"

echo ""
echo -e "${BLUE}=== API KEYS ===${NC}"
check_secret "OPENROUTER_API_KEY" "OpenRouter AI API"
check_secret "HUGGINGFACE_API_KEY" "HuggingFace API"

echo ""
echo -e "${BLUE}=== DEPLOYMENT ===${NC}"
check_secret "NEXT_PUBLIC_API_URL" "Frontend API URL"
check_secret "GH_TOKEN" "GitHub Token para actions"

echo ""
echo -e "${BLUE}=== MONITORING & SECURITY ===${NC}"
check_secret "SNYK_TOKEN" "Snyk security scanning" "false"
check_secret "ERROR_TRACKING_ENABLED" "Error tracking habilitado" "false"
check_secret "PERFORMANCE_MONITORING_ENABLED" "Performance monitoring" "false"

echo ""
echo -e "${BLUE}=== FEATURE FLAGS ===${NC}"
check_secret "DR_GASNELIO_ENABLED" "Dr. Gasnelio AI habilitado"
check_secret "EMBEDDINGS_ENABLED" "Embeddings/RAG habilitados"
check_secret "RAG_ENABLED" "RAG system habilitado"

echo ""
echo -e "${BLUE}=== COMPLIANCE ===${NC}"
check_secret "LGPD_COMPLIANCE_ENABLED" "LGPD compliance"
check_secret "MEDICAL_DISCLAIMER_ENABLED" "Medical disclaimer"

echo ""
echo "============================================================================"
echo -e "${BLUE}📊 RESUMO DA VALIDAÇÃO${NC}"
echo "============================================================================"
echo -e "Total de secrets verificados: ${BLUE}$TOTAL${NC}"
echo -e "Secrets configurados: ${GREEN}$EXISTS${NC}"
echo -e "Secrets faltando: ${RED}$MISSING${NC}"
echo ""

# Verificar status geral
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS SECRETS OBRIGATÓRIOS ESTÃO CONFIGURADOS!${NC}"
    echo ""
    echo -e "${GREEN}✅ Sistema pronto para deploy em produção${NC}"
    echo -e "${GREEN}✅ PRs 171-176 podem ser executados com segurança${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ALGUNS SECRETS OBRIGATÓRIOS ESTÃO FALTANDO${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para configurar um secret:${NC}"
    echo "   gh secret set SECRET_NAME --body \"secret_value\""
    echo ""
    echo -e "${YELLOW}💡 Para secrets de arquivo:${NC}"
    echo "   gh secret set SECRET_NAME < arquivo.txt"
    echo ""
    echo -e "${YELLOW}💡 Para ver todos os secrets:${NC}"
    echo "   gh secret list"
    echo ""
    exit 1
fi