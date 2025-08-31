#!/bin/bash
# Script para migrar secrets hardcoded para GitHub Secrets de forma segura

set -e

echo "🔐 SCRIPT DE MIGRAÇÃO SEGURA DE SECRETS"
echo "======================================="

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não encontrado!"
    echo "📥 Instale: https://cli.github.com/"
    exit 1
fi

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    echo "🔑 Fazendo login no GitHub..."
    gh auth login
fi

echo "✅ GitHub CLI configurado"
echo ""

# Função para adicionar secret de forma segura
add_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo "🔐 Configurando secret: $secret_name"
    echo "📝 Descrição: $secret_description"
    echo ""
    
    read -s -p "🔑 Digite o valor para $secret_name: " secret_value
    echo ""
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | gh secret set "$secret_name"
        echo "✅ Secret $secret_name configurado com sucesso!"
    else
        echo "⚠️ Secret $secret_name pulado (valor vazio)"
    fi
    echo ""
}

# Lista de secrets comuns que podem estar expostos
echo "🔍 SECRETS COMUNS A SEREM MIGRADOS:"
echo ""

# Telegram
if grep -r "bot[0-9]" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null | head -1; then
    add_secret "TELEGRAM_TOKEN" "Token do bot Telegram para notificações"
fi

if grep -r "\-[0-9]\{9,\}" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null | head -1; then
    add_secret "TELEGRAM_CHAT_ID" "ID do chat Telegram para notificações"
fi

# Snyk
if grep -r "snyk_" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null | head -1; then
    add_secret "SNYK_TOKEN" "Token de API do Snyk para análise de vulnerabilidades"
fi

# Firebase
if grep -r "firebase" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null | head -1; then
    add_secret "FIREBASE_SERVICE_ACCOUNT" "Service Account JSON do Firebase"
    add_secret "FIREBASE_PROJECT_ID" "ID do projeto Firebase"
    add_secret "FIREBASE_TOKEN" "Token de deploy do Firebase"
fi

# Google Cloud
if grep -r "gcp\|google" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null | head -1; then
    echo "🌍 === GOOGLE CLOUD SECRETS ==="
    add_secret "GCP_PROJECT_ID" "ID do projeto GCP compartilhado (HML/PROD)"
    add_secret "GCP_PROJECT_ID_PROD" "ID do projeto GCP para produção"
    add_secret "GCP_PROJECT_ID_STAGING" "ID do projeto GCP para staging/HML" 
    add_secret "GCP_SA_KEY" "Service Account Key GCP compartilhado"
    add_secret "GCP_SA_KEY_PROD" "Service Account Key GCP (produção)"
    add_secret "GCP_SA_KEY_STAGING" "Service Account Key GCP (staging/HML)"
    add_secret "GCP_REGION" "Região do GCP (ex: us-central1)"
fi

# OpenAI/OpenRouter
if grep -r "openai\|sk-" . --exclude-dir=.git --exclude="*.sh" 2>/dev/null | head -1; then
    add_secret "OPENROUTER_API_KEY" "API Key do OpenRouter/OpenAI"
fi

# URLs de ambiente
add_secret "PROD_API_URL" "URL da API de produção"
add_secret "PROD_FRONTEND_URL" "URL do frontend de produção"
add_secret "HML_API_URL" "URL da API de homologação"
add_secret "HML_FRONTEND_URL" "URL do frontend de homologação"

# Secret Key genérico
add_secret "SECRET_KEY" "Chave secreta da aplicação (Flask/Django)"

echo ""
echo "🎉 MIGRAÇÃO CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. ✅ Secrets configurados no GitHub"
echo "2. 🔍 Localizar secrets hardcoded no código"
echo "3. 🔄 Substituir por \${{ secrets.NOME_DO_SECRET }}"
echo "4. 🗑️ Remover valores hardcoded"
echo "5. ✅ Testar pipeline"
echo ""
echo "📖 Exemplo de substituição:"
echo "  ❌ Antes: TELEGRAM_TOKEN=\"123456789:ABC...\""
echo "  ✅ Depois: TELEGRAM_TOKEN=\"\${{ secrets.TELEGRAM_TOKEN }}\""
echo ""