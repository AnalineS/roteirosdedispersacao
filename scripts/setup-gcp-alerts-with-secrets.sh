#!/bin/bash

# Script para configurar alertas GCP com Telegram usando GitHub Secrets
# Execução: bash scripts/setup-gcp-alerts-with-secrets.sh [PROJECT_ID] [TELEGRAM_BOT_TOKEN] [TELEGRAM_CHAT_ID]

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"
TELEGRAM_BOT_TOKEN="$2"
TELEGRAM_CHAT_ID="$3"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ Erro: Parâmetros do Telegram obrigatórios"
    echo "Uso: $0 [PROJECT_ID] [TELEGRAM_BOT_TOKEN] [TELEGRAM_CHAT_ID]"
    echo ""
    echo "Para uso em GitHub Actions:"
    echo '$0 red-truck-468923-s4 "${{ secrets.TELEGRAM_BOT_TOKEN }}" "${{ secrets.TELEGRAM_CHAT_ID }}"'
    exit 1
fi

# Construir webhook URL
TELEGRAM_WEBHOOK_URL="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

echo "🚨 Configurando alertas do Google Cloud Monitoring com Telegram"
echo "Projeto: $PROJECT_ID"
echo "Telegram Chat ID: $TELEGRAM_CHAT_ID"
echo "=================================================="

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Erro: gcloud não está autenticado"
    exit 1
fi

# Configurar projeto
gcloud config set project $PROJECT_ID

echo ""
echo "1/6 - Criando canal de notificação por email..."

# Instalar componente alpha se necessário (modo quiet)
gcloud components install alpha --quiet || echo "Alpha component already installed"

# Canal de Email (padrão)
EMAIL_CHANNEL_NAME="Email-Roteiro-Dispensacao-$(date +%s)"
gcloud alpha monitoring channels create \
    --display-name="$EMAIL_CHANNEL_NAME" \
    --type=email \
    --channel-labels=email_address=admin@roteirosdedispensacao.com \
    --description="Canal principal para alertas críticos do sistema" \
    --quiet

EMAIL_CHANNEL_ID=$(gcloud alpha monitoring channels list --filter="displayName=\"$EMAIL_CHANNEL_NAME\"" --format="value(name)" | head -1)
echo "✅ Canal de email criado: $EMAIL_CHANNEL_ID"

# Se não encontrar pelo nome, pegar o último criado
if [ -z "$EMAIL_CHANNEL_ID" ]; then
    EMAIL_CHANNEL_ID=$(gcloud alpha monitoring channels list --filter="type=email" --format="value(name)" --sort-by="~createTime" --limit=1)
    echo "📧 Usando canal de email mais recente: $EMAIL_CHANNEL_ID"
fi

echo ""
echo "2/6 - Criando canal de notificação Telegram via webhook..."

# Criar payload JSON para webhook Telegram
TELEGRAM_PAYLOAD=$(cat << EOF
{
  "chat_id": "$TELEGRAM_CHAT_ID",
  "text": "🚨 **ALERTA GCP**\n\nCondição: \${condition.displayName}\nStatus: \${incident.state}\nPolítica: \${policy.displayName}\nTime: \${incident.started_at}",
  "parse_mode": "Markdown"
}
EOF
)

# Canal Webhook para Telegram
WEBHOOK_CHANNEL_NAME="Telegram-Roteiro-Dispensacao-$(date +%s)"
gcloud alpha monitoring channels create \
    --display-name="$WEBHOOK_CHANNEL_NAME" \
    --type=webhook_tokenauth \
    --channel-labels=url="$TELEGRAM_WEBHOOK_URL" \
    --description="Canal Telegram para alertas do sistema via webhook" \
    --quiet

TELEGRAM_CHANNEL_ID=$(gcloud alpha monitoring channels list --filter="displayName=\"$WEBHOOK_CHANNEL_NAME\"" --format="value(name)" | head -1)
echo "✅ Canal Telegram criado: $TELEGRAM_CHANNEL_ID"

# Se não encontrar pelo nome, pegar o último webhook criado
if [ -z "$TELEGRAM_CHANNEL_ID" ]; then
    TELEGRAM_CHANNEL_ID=$(gcloud alpha monitoring channels list --filter="type=webhook_tokenauth" --format="value(name)" --sort-by="~createTime" --limit=1)
    echo "📱 Usando canal Telegram mais recente: $TELEGRAM_CHANNEL_ID"
fi

# Verificar se temos canais válidos
if [ -z "$EMAIL_CHANNEL_ID" ] || [ -z "$TELEGRAM_CHANNEL_ID" ]; then
    echo "❌ Erro: Não foi possível obter IDs dos canais de notificação"
    echo "Email Channel: $EMAIL_CHANNEL_ID"
    echo "Telegram Channel: $TELEGRAM_CHANNEL_ID"
    exit 1
fi

# Lista de canais para notificação
NOTIFICATION_CHANNELS="$EMAIL_CHANNEL_ID,$TELEGRAM_CHANNEL_ID"
echo "📋 Canais configurados: $NOTIFICATION_CHANNELS"

echo ""
echo "3/6 - Criando alerta de alta latência..."

# Alerta 1: Alta Latência (P95 > 5 segundos)
cat > /tmp/alert-high-latency.yaml << EOF
displayName: "🐌 Alta Latência - P95 > 5s"
documentation:
  content: "A latência P95 das requisições está acima de 5 segundos. Isso indica problemas de performance que afetam a experiência do usuário."
  mimeType: "text/markdown"
conditions:
  - displayName: "Latência P95 > 5000ms"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" metric.type="run.googleapis.com/request_latencies"'
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_DELTA
          crossSeriesReducer: REDUCE_PERCENTILE_95
          groupByFields:
            - "resource.label.service_name"
      comparison: COMPARISON_GT
      thresholdValue: 5000
      duration: 600s
      trigger:
        count: 1
notificationChannels:
  - $EMAIL_CHANNEL_ID
  - $TELEGRAM_CHANNEL_ID
alertStrategy:
  autoClose: 86400s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-high-latency.yaml --quiet

echo ""
echo "4/6 - Criando alerta de alta taxa de erro..."

# Alerta 2: Taxa de Erro Alta (> 10 erros/min por 5min)
cat > /tmp/alert-error-rate.yaml << EOF
displayName: "🚨 Taxa de Erro Alta - >10 erros/min"
documentation:
  content: "A taxa de erro (status 4xx e 5xx) está acima de 10 por minuto por mais de 5 minutos. Indica problemas críticos no sistema."
  mimeType: "text/markdown"
conditions:
  - displayName: "Error Count > 10/min"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" metric.type="run.googleapis.com/request_count" metric.label.response_code_class!="2xx"'
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
      comparison: COMPARISON_GT
      thresholdValue: 10
      duration: 300s
      trigger:
        count: 1
notificationChannels:
  - $EMAIL_CHANNEL_ID
  - $TELEGRAM_CHANNEL_ID
alertStrategy:
  autoClose: 7200s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-error-rate.yaml --quiet

echo ""
echo "5/6 - Criando alerta de indisponibilidade..."

# Alerta 3: Serviço Indisponível (sem requisições por 10min)
cat > /tmp/alert-service-down.yaml << EOF
displayName: "💀 Serviço Indisponível - Sem Requisições"
documentation:
  content: "O serviço não está recebendo requisições há mais de 10 minutos. Sistema pode estar completamente indisponível."
  mimeType: "text/markdown"
conditions:
  - displayName: "No Requests for 10min"
    conditionAbsent:
      filter: 'resource.type="cloud_run_revision" metric.type="run.googleapis.com/request_count" resource.label.service_name=~".*roteiro.*"'
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
      duration: 600s
      trigger:
        count: 1
notificationChannels:
  - $EMAIL_CHANNEL_ID
  - $TELEGRAM_CHANNEL_ID
alertStrategy:
  autoClose: 3600s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-service-down.yaml --quiet

echo ""
echo "6/6 - Criando alerta de uso de recursos..."

# Alerta 4: Alto Uso de Memória (> 80%)
cat > /tmp/alert-memory-usage.yaml << EOF
displayName: "💾 Alto Uso de Memória - >80%"
documentation:
  content: "O uso de memória do container está acima de 80%. Sistema pode começar a apresentar instabilidade."
  mimeType: "text/markdown"
conditions:
  - displayName: "Memory Usage > 80%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" metric.type="run.googleapis.com/container/memory/utilizations"'
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_MEAN
          crossSeriesReducer: REDUCE_MEAN
      comparison: COMPARISON_GT
      thresholdValue: 0.8
      duration: 600s
      trigger:
        count: 1
notificationChannels:
  - $EMAIL_CHANNEL_ID
  - $TELEGRAM_CHANNEL_ID
alertStrategy:
  autoClose: 7200s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-memory-usage.yaml --quiet

# Limpar arquivos temporários
rm -f /tmp/alert-*.yaml

echo ""
echo "✅ Todos os alertas foram configurados com sucesso!"
echo ""
echo "🚨 Alertas criados:"
echo "  • 🐌 Alta Latência (P95 > 5s)"
echo "  • 🚨 Taxa de Erro Alta (>10 erros/min)"
echo "  • 💀 Serviço Indisponível (sem requests 10min)"
echo "  • 💾 Alto Uso de Memória (>80%)"
echo ""
echo "📧 Canais de notificação:"
echo "  • Email: admin@roteirosdedispensacao.com"
echo "  • Telegram: Chat ID $TELEGRAM_CHAT_ID"
echo ""
echo "🔗 Gerenciar alertas:"
echo "   https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo ""
echo "🧪 Para testar alertas:"
echo "   1. Gerar carga alta no sistema"
echo "   2. Simular erros 5xx"
echo "   3. Parar o serviço temporariamente"
echo "   4. Verificar notificações no Telegram e email"