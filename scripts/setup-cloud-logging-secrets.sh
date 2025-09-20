#!/bin/bash

# =============================================================================
# Script de Configuração de Secrets para Google Cloud Logging + Alertas
# Configura todas as variáveis necessárias no GitHub via CLI
# =============================================================================

set -e

echo "🔐 Configurando Secrets GitHub para Cloud Logging e Alertas..."
echo "==============================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI não encontrado. Instale primeiro:${NC}"
    echo "   Windows: winget install --id GitHub.cli"
    echo "   macOS: brew install gh"
    echo "   Linux: apt install gh"
    exit 1
fi

# Verificar autenticação GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️ Faça login no GitHub CLI primeiro:${NC}"
    echo "   gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI configurado corretamente${NC}"
echo

# =============================================================================
# GOOGLE CLOUD CONFIGURATION
# =============================================================================

echo -e "${BLUE}📋 GOOGLE CLOUD CONFIGURATION${NC}"
echo "Vamos configurar as credenciais do Google Cloud..."
echo

read -p "🔹 Digite o PROJECT_ID do Google Cloud: " GOOGLE_CLOUD_PROJECT_ID
if [[ -z "$GOOGLE_CLOUD_PROJECT_ID" ]]; then
    echo -e "${RED}❌ PROJECT_ID é obrigatório${NC}"
    exit 1
fi

echo "🔹 Cole o conteúdo completo do arquivo JSON de credenciais do Google Cloud:"
echo "   (Ctrl+V no Windows, Cmd+V no macOS)"
echo "   Pressione Enter duas vezes quando terminar:"
echo
GOOGLE_APPLICATION_CREDENTIALS_JSON=""
while IFS= read -r line; do
    if [[ -z "$line" ]]; then
        break
    fi
    GOOGLE_APPLICATION_CREDENTIALS_JSON+="$line"$'\n'
done

if [[ -z "$GOOGLE_APPLICATION_CREDENTIALS_JSON" ]]; then
    echo -e "${RED}❌ Credenciais JSON são obrigatórias${NC}"
    exit 1
fi

# Validar JSON
if ! echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" | python -m json.tool &> /dev/null; then
    echo -e "${RED}❌ JSON inválido. Verifique o formato${NC}"
    exit 1
fi

# =============================================================================
# TELEGRAM CONFIGURATION
# =============================================================================

echo
echo -e "${BLUE}📋 TELEGRAM CONFIGURATION${NC}"
echo "Configure o bot do Telegram para alertas..."
echo

read -p "🔹 Digite o TOKEN do Bot Telegram (ex: 123456:ABC-DEF...): " TELEGRAM_BOT_TOKEN
if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
    echo -e "${RED}❌ Token do Telegram é obrigatório${NC}"
    exit 1
fi

read -p "🔹 Digite o CHAT_ID do Telegram (ex: -1001234567890): " TELEGRAM_CHAT_ID
if [[ -z "$TELEGRAM_CHAT_ID" ]]; then
    echo -e "${RED}❌ Chat ID do Telegram é obrigatório${NC}"
    exit 1
fi

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

echo
echo -e "${BLUE}📋 EMAIL CONFIGURATION${NC}"
echo "Configure SMTP para alertas por email..."
echo

read -p "🔹 Servidor SMTP (ex: smtp.gmail.com): " ALERT_EMAIL_SMTP_HOST
if [[ -z "$ALERT_EMAIL_SMTP_HOST" ]]; then
    ALERT_EMAIL_SMTP_HOST="smtp.gmail.com"
fi

read -p "🔹 Porta SMTP (padrão 587): " ALERT_EMAIL_SMTP_PORT
if [[ -z "$ALERT_EMAIL_SMTP_PORT" ]]; then
    ALERT_EMAIL_SMTP_PORT="587"
fi

read -p "🔹 Email do remetente: " ALERT_EMAIL_SMTP_USER
if [[ -z "$ALERT_EMAIL_SMTP_USER" ]]; then
    echo -e "${RED}❌ Email do remetente é obrigatório${NC}"
    exit 1
fi

read -s -p "🔹 Senha/App Password do email: " ALERT_EMAIL_SMTP_PASS
echo
if [[ -z "$ALERT_EMAIL_SMTP_PASS" ]]; then
    echo -e "${RED}❌ Senha do email é obrigatória${NC}"
    exit 1
fi

read -p "🔹 Email de destino para alertas: " ALERT_EMAIL_TO
if [[ -z "$ALERT_EMAIL_TO" ]]; then
    echo -e "${RED}❌ Email de destino é obrigatório${NC}"
    exit 1
fi

# =============================================================================
# ADDITIONAL CONFIGURATION
# =============================================================================

echo
echo -e "${BLUE}📋 CONFIGURAÇÕES ADICIONAIS${NC}"

read -p "🔹 Ambiente (production/staging) [production]: " ENVIRONMENT
if [[ -z "$ENVIRONMENT" ]]; then
    ENVIRONMENT="production"
fi

read -p "🔹 Região do Google Cloud [us-central1]: " GOOGLE_CLOUD_REGION
if [[ -z "$GOOGLE_CLOUD_REGION" ]]; then
    GOOGLE_CLOUD_REGION="us-central1"
fi

# Salt para hashing (gerar automaticamente)
HASH_SALT=$(openssl rand -hex 32)

# =============================================================================
# CONFIGURAR SECRETS NO GITHUB
# =============================================================================

echo
echo -e "${YELLOW}🔧 Configurando secrets no GitHub...${NC}"
echo

# Google Cloud
echo "📤 Configurando Google Cloud secrets..."
gh secret set GOOGLE_CLOUD_PROJECT_ID --body "$GOOGLE_CLOUD_PROJECT_ID"
gh secret set GOOGLE_APPLICATION_CREDENTIALS_JSON --body "$GOOGLE_APPLICATION_CREDENTIALS_JSON"
gh secret set GOOGLE_CLOUD_REGION --body "$GOOGLE_CLOUD_REGION"

# Telegram
echo "📤 Configurando Telegram secrets..."
gh secret set TELEGRAM_BOT_TOKEN --body "$TELEGRAM_BOT_TOKEN"
gh secret set TELEGRAM_CHAT_ID --body "$TELEGRAM_CHAT_ID"

# Email
echo "📤 Configurando Email secrets..."
gh secret set ALERT_EMAIL_SMTP_HOST --body "$ALERT_EMAIL_SMTP_HOST"
gh secret set ALERT_EMAIL_SMTP_PORT --body "$ALERT_EMAIL_SMTP_PORT"
gh secret set ALERT_EMAIL_SMTP_USER --body "$ALERT_EMAIL_SMTP_USER"
gh secret set ALERT_EMAIL_SMTP_PASS --body "$ALERT_EMAIL_SMTP_PASS"
gh secret set ALERT_EMAIL_TO --body "$ALERT_EMAIL_TO"

# Configurações gerais
echo "📤 Configurando secrets gerais..."
gh secret set ENVIRONMENT --body "$ENVIRONMENT"
gh secret set HASH_SALT --body "$HASH_SALT"

# DLP API (opcional)
gh secret set ENABLE_DLP_API --body "true"

echo -e "${GREEN}✅ Todos os secrets configurados com sucesso!${NC}"
echo

# =============================================================================
# CRIAR ARQUIVO DE CONFIGURAÇÃO LOCAL PARA DESENVOLVIMENTO
# =============================================================================

echo -e "${BLUE}📁 Criando arquivo .env.local para desenvolvimento...${NC}"

cat > .env.local << EOF
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID
GOOGLE_CLOUD_REGION=$GOOGLE_CLOUD_REGION
ENABLE_DLP_API=true

# Telegram Configuration
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID

# Email Configuration
ALERT_EMAIL_SMTP_HOST=$ALERT_EMAIL_SMTP_HOST
ALERT_EMAIL_SMTP_PORT=$ALERT_EMAIL_SMTP_PORT
ALERT_EMAIL_SMTP_USER=$ALERT_EMAIL_SMTP_USER
ALERT_EMAIL_SMTP_PASS=$ALERT_EMAIL_SMTP_PASS
ALERT_EMAIL_TO=$ALERT_EMAIL_TO

# General Configuration
ENVIRONMENT=development
HASH_SALT=$HASH_SALT

# Instance Configuration (para desenvolvimento local)
INSTANCE_ID=local-dev
ZONE=us-central1-a
EOF

echo -e "${GREEN}✅ Arquivo .env.local criado para desenvolvimento${NC}"
echo

# =============================================================================
# INSTRUÇÕES FINAIS
# =============================================================================

echo -e "${BLUE}📋 PRÓXIMOS PASSOS:${NC}"
echo
echo "1. 📁 Para desenvolvimento local:"
echo "   - Copie o arquivo de credenciais JSON para: apps/backend/credentials/"
echo "   - Configure GOOGLE_APPLICATION_CREDENTIALS no .env.local"
echo
echo "2. 🚀 Para produção:"
echo "   - Os secrets já estão configurados no GitHub"
echo "   - O deploy automático usará essas configurações"
echo
echo "3. 🧪 Testar configuração:"
echo "   cd apps/backend"
echo "   python -c \"from core.logging.cloud_logger import cloud_logger; cloud_logger.info('Test log')\""
echo
echo "4. 📱 Verificar bot Telegram:"
echo "   - Envie /start para o bot"
echo "   - Adicione o bot ao grupo de alertas"
echo
echo "5. 📧 Testar email:"
echo "   - Verifique se o email/senha estão corretos"
echo "   - Para Gmail, use App Password, não a senha normal"
echo

echo -e "${GREEN}🎉 Configuração completa!${NC}"
echo -e "${YELLOW}⚠️ IMPORTANTE: Mantenha o arquivo .env.local seguro e nunca o commite no Git${NC}"
echo

# Adicionar .env.local ao .gitignore se não estiver
if ! grep -q ".env.local" .gitignore 2>/dev/null; then
    echo ".env.local" >> .gitignore
    echo -e "${GREEN}✅ Adicionado .env.local ao .gitignore${NC}"
fi

echo -e "${BLUE}🔐 Secrets configurados no GitHub:${NC}"
gh secret list | grep -E "(GOOGLE|TELEGRAM|ALERT|ENVIRONMENT|HASH)" || echo "Nenhum secret encontrado"