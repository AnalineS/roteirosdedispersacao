#!/bin/bash
# Script para testar notificações do Telegram

echo "🔔 TESTE DE NOTIFICAÇÕES DO TELEGRAM"
echo "====================================="
echo ""

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

echo "📱 Testando notificações do Telegram..."
echo ""

# Obter valores dos secrets
echo "🔐 Obtendo secrets do GitHub..."
TELEGRAM_TOKEN=$(gh secret get TELEGRAM_BOT_TOKEN --json 2>/dev/null | jq -r .value 2>/dev/null || echo "")
TELEGRAM_CHAT_ID=$(gh secret get TELEGRAM_CHAT_ID --json 2>/dev/null | jq -r .value 2>/dev/null || echo "")

if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ Não foi possível obter os secrets do Telegram!"
    echo ""
    echo "📋 Secrets configurados:"
    gh secret list | grep TELEGRAM
    echo ""
    echo "💡 Para configurar manualmente:"
    echo "   gh secret set TELEGRAM_BOT_TOKEN"
    echo "   gh secret set TELEGRAM_CHAT_ID"
    exit 1
fi

echo "✅ Secrets obtidos com sucesso!"
echo ""

# Enviar mensagem de teste
MESSAGE="🧪 [TESTE] Notificação de teste dos workflows GitHub Actions"
MESSAGE="$MESSAGE%0A📅 Data: $(date)"
MESSAGE="$MESSAGE%0A📍 Branch: $(git branch --show-current)"
MESSAGE="$MESSAGE%0A✅ Se você recebeu esta mensagem, as notificações estão funcionando!"

echo "📤 Enviando mensagem de teste..."
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="$MESSAGE" \
    -d parse_mode="HTML")

# Verificar resposta
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Mensagem enviada com sucesso!"
    echo ""
    echo "📱 Verifique seu Telegram!"
else
    echo "❌ Erro ao enviar mensagem:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "🔍 Possíveis problemas:"
    echo "   1. Token do bot inválido"
    echo "   2. Chat ID incorreto"
    echo "   3. Bot não tem permissão no chat"
    exit 1
fi

echo ""
echo "🎉 Teste concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. ✅ Secrets configurados corretamente"
echo "2. ✅ Notificações funcionando"
echo "3. 🚀 Fazer push para testar workflows"