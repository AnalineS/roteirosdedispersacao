#!/bin/bash
# ============================================================================
# Script para configurar mapeamento de domínio personalizado no Google Cloud Run
# Domínio: roteirosdispensacao.com.br
# ============================================================================

set -e

PROJECT_ID="red-truck-468923-s4"
REGION="us-central1"
DOMAIN="roteirosdispensacao.com.br"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verificar se está logado no gcloud
print_step "Verificando autenticação Google Cloud..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "Não está logado no Google Cloud"
    echo "Execute: gcloud auth login"
    exit 1
fi

# Configurar projeto
print_step "Configurando projeto..."
gcloud config set project $PROJECT_ID
print_success "Projeto configurado: $PROJECT_ID"

# ============================================================================
# 1. CONFIGURAR DOMÍNIO PRINCIPAL - PRODUÇÃO
# ============================================================================

print_step "Configurando domínio de produção..."

# Frontend Produção
print_step "Mapeando frontend produção: $DOMAIN"
gcloud run domain-mappings create \
    --service=roteiro-dispensacao-frontend \
    --domain=$DOMAIN \
    --region=$REGION \
    --platform=managed || print_warning "Mapeamento pode já existir"

# API Produção
print_step "Mapeando API produção: api.$DOMAIN"
gcloud run domain-mappings create \
    --service=roteiro-dispensacao-api \
    --domain=api.$DOMAIN \
    --region=$REGION \
    --platform=managed || print_warning "Mapeamento pode já existir"

# ============================================================================
# 2. CONFIGURAR SUBDOMÍNIO - HOMOLOGAÇÃO
# ============================================================================

print_step "Configurando subdomínio de homologação..."

# Frontend HML
print_step "Mapeando frontend HML: hml.$DOMAIN"
gcloud run domain-mappings create \
    --service=hml-roteiro-dispensacao-frontend \
    --domain=hml.$DOMAIN \
    --region=$REGION \
    --platform=managed || print_warning "Mapeamento pode já existir"

# API HML
print_step "Mapeando API HML: hml-api.$DOMAIN"
gcloud run domain-mappings create \
    --service=hml-roteiro-dispensacao-api \
    --domain=hml-api.$DOMAIN \
    --region=$REGION \
    --platform=managed || print_warning "Mapeamento pode já existir"

# ============================================================================
# 3. VERIFICAR STATUS DOS MAPEAMENTOS
# ============================================================================

print_step "Verificando status dos mapeamentos..."

echo ""
echo "📋 STATUS DOS MAPEAMENTOS:"
echo "=========================="

# Listar todos os mapeamentos
gcloud run domain-mappings list --region=$REGION --platform=managed

echo ""
print_step "Verificando registros DNS necessários..."

# Obter registros DNS para cada domínio
echo ""
echo "📝 REGISTROS DNS NECESSÁRIOS:"
echo "============================"

domains=("$DOMAIN" "api.$DOMAIN" "hml.$DOMAIN" "hml-api.$DOMAIN")

for domain in "${domains[@]}"; do
    echo ""
    echo "🌐 Domínio: $domain"
    echo "-------------------"

    # Tentar obter o registro DNS
    DNS_RECORD=$(gcloud run domain-mappings describe $domain \
        --region=$REGION \
        --platform=managed \
        --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null || echo "Não configurado")

    if [ "$DNS_RECORD" != "Não configurado" ]; then
        echo "Tipo: CNAME"
        echo "Nome: $domain"
        echo "Valor: $DNS_RECORD"
    else
        print_warning "Mapeamento não encontrado para $domain"
    fi
done

# ============================================================================
# 4. VERIFICAR SSL
# ============================================================================

print_step "Verificando certificados SSL..."

echo ""
echo "🔒 STATUS SSL:"
echo "=============="

for domain in "${domains[@]}"; do
    SSL_STATUS=$(gcloud run domain-mappings describe $domain \
        --region=$REGION \
        --platform=managed \
        --format="value(status.conditions[0].status)" 2>/dev/null || echo "Desconhecido")

    if [ "$SSL_STATUS" = "True" ]; then
        print_success "SSL ativo para $domain"
    else
        print_warning "SSL pendente para $domain (pode levar até 24h)"
    fi
done

# ============================================================================
# 5. RESUMO FINAL
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
echo "⚠️  PRÓXIMOS PASSOS:"
echo "1. Configure os registros DNS no seu provedor"
echo "2. Aguarde propagação DNS (pode levar até 48h)"
echo "3. SSL será provisionado automaticamente"
echo "4. Atualize variáveis de ambiente nos workflows"
echo ""

print_success "Configuração de domínio concluída!"