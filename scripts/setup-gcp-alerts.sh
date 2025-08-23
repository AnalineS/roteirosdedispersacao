#!/bin/bash

# Script para configurar alertas do Google Cloud Monitoring com integração Telegram
# Execução: bash scripts/setup-gcp-alerts.sh [PROJECT_ID] [TELEGRAM_WEBHOOK_URL]

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"
TELEGRAM_WEBHOOK_URL="${2:-}"

echo "🚨 Configurando alertas do Google Cloud Monitoring"
echo "Projeto: $PROJECT_ID"
echo "=================================================="

# Verificar se gcloud está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Erro: gcloud não está autenticado"
    echo "Execute: gcloud auth login"
    exit 1
fi

# Configurar projeto
gcloud config set project $PROJECT_ID

# Verificar webhook do Telegram
if [ -z "$TELEGRAM_WEBHOOK_URL" ]; then
    echo "⚠️  Aviso: URL do webhook Telegram não fornecida"
    echo "   Para configurar integração com Telegram, execute:"
    echo "   bash $0 $PROJECT_ID https://api.telegram.org/bot[TOKEN]/sendMessage"
    echo ""
    echo "   Continuando com alertas de email apenas..."
    TELEGRAM_ENABLED=false
else
    echo "📱 Telegram webhook configurado: $TELEGRAM_WEBHOOK_URL"
    TELEGRAM_ENABLED=true
fi

echo ""
echo "1/6 - Criando canal de notificação por email..."

# Canal de Notificação por Email (padrão do GCP)
gcloud alpha monitoring channels create \
    --display-name="Email Principal - Roteiro Dispensação" \
    --type=email \
    --channel-labels=email_address=admin@roteirosdedispensacao.com \
    --description="Canal principal para alertas críticos do sistema"

EMAIL_CHANNEL_ID=$(gcloud alpha monitoring channels list --filter="displayName:'Email Principal - Roteiro Dispensação'" --format="value(name)" | head -1)
echo "✅ Canal de email criado: $EMAIL_CHANNEL_ID"

# Criar canal webhook para Telegram se configurado
if [ "$TELEGRAM_ENABLED" = true ]; then
    echo ""
    echo "2/6 - Criando canal de notificação Telegram..."
    
    gcloud alpha monitoring channels create \
        --display-name="Telegram - Roteiro Dispensação" \
        --type=webhook_tokenauth \
        --channel-labels=url="$TELEGRAM_WEBHOOK_URL" \
        --description="Canal Telegram para alertas do sistema"
    
    TELEGRAM_CHANNEL_ID=$(gcloud alpha monitoring channels list --filter="displayName:'Telegram - Roteiro Dispensação'" --format="value(name)" | head -1)
    echo "✅ Canal Telegram criado: $TELEGRAM_CHANNEL_ID"
    NOTIFICATION_CHANNELS="$EMAIL_CHANNEL_ID,$TELEGRAM_CHANNEL_ID"
else
    echo "2/6 - Pulando configuração Telegram..."
    NOTIFICATION_CHANNELS="$EMAIL_CHANNEL_ID"
fi

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
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_latencies"'
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_DELTA
          crossSeriesReducer: REDUCE_PERCENTILE_95
          groupByFields:
            - "resource.label.service_name"
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 5000
      duration: 600s
      trigger:
        count: 1
notificationChannels:
$(echo "$NOTIFICATION_CHANNELS" | sed 's/,/\n/g' | sed 's/^/  - /')
alertStrategy:
  autoClose: 86400s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-high-latency.yaml

echo ""
echo "4/6 - Criando alerta de alta taxa de erro..."

# Alerta 2: Taxa de Erro Alta (> 5% em 5min)
cat > /tmp/alert-error-rate.yaml << EOF
displayName: "🚨 Taxa de Erro Alta - >5% em 5min"
documentation:
  content: "A taxa de erro (status 4xx e 5xx) está acima de 5% por mais de 5 minutos. Indica problemas críticos no sistema."
  mimeType: "text/markdown"
conditions:
  - displayName: "Error Rate > 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class!="2xx"'
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
      duration: 300s
      trigger:
        count: 1
notificationChannels:
$(echo "$NOTIFICATION_CHANNELS" | sed 's/,/\n/g' | sed 's/^/  - /')
alertStrategy:
  autoClose: 7200s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-error-rate.yaml

echo ""
echo "5/6 - Criando alerta de indisponibilidade..."

# Alerta 3: Serviço Indisponível (health check failures)
cat > /tmp/alert-service-down.yaml << EOF
displayName: "💀 Serviço Indisponível - Health Check Failed"
documentation:
  content: "O serviço não está respondendo aos health checks. Sistema pode estar completamente indisponível."
  mimeType: "text/markdown"
conditions:
  - displayName: "Health Check Failures"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code!="200" AND resource.label.service_name=~".*roteiro.*"'
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 3
      duration: 180s
      trigger:
        count: 1
notificationChannels:
$(echo "$NOTIFICATION_CHANNELS" | sed 's/,/\n/g' | sed 's/^/  - /')
alertStrategy:
  autoClose: 3600s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-service-down.yaml

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
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/container/memory/utilizations"'
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_MEAN
          crossSeriesReducer: REDUCE_MEAN
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.8
      duration: 600s
      trigger:
        count: 1
notificationChannels:
$(echo "$NOTIFICATION_CHANNELS" | sed 's/,/\n/g' | sed 's/^/  - /')
alertStrategy:
  autoClose: 7200s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-memory-usage.yaml

echo ""
echo "🎯 Criando alertas específicos de negócio..."

# Alerta 5: Falhas nas Personas (específico do negócio)
cat > /tmp/alert-persona-failures.yaml << EOF
displayName: "🤖 Falhas nas Personas - Taxa Alta"
documentation:
  content: "As personas (Gasnelio/Gá) estão apresentando alta taxa de falhas. Funcionalidade principal do sistema comprometida."
  mimeType: "text/markdown"
conditions:
  - displayName: "Persona Failure Rate > 10%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND jsonPayload.metric_type="persona_usage" AND jsonPayload.success=false'
      aggregations:
        - alignmentPeriod: 600s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.1
      duration: 300s
      trigger:
        count: 1
notificationChannels:
$(echo "$NOTIFICATION_CHANNELS" | sed 's/,/\n/g' | sed 's/^/  - /')
alertStrategy:
  autoClose: 3600s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-persona-failures.yaml

# Limpar arquivos temporários
rm -f /tmp/alert-*.yaml

echo ""
echo "✅ Todos os alertas foram configurados com sucesso!"
echo ""
echo "🚨 Alertas criados:"
echo "  • 🐌 Alta Latência (P95 > 5s)"
echo "  • 🚨 Taxa de Erro Alta (>5% em 5min)"
echo "  • 💀 Serviço Indisponível (Health Check)"
echo "  • 💾 Alto Uso de Memória (>80%)"
echo "  • 🤖 Falhas nas Personas (Taxa Alta)"
echo ""
echo "📧 Canais de notificação:"
echo "  • Email: admin@roteirosdedispensacao.com"
if [ "$TELEGRAM_ENABLED" = true ]; then
echo "  • Telegram: Configurado"
else
echo "  • Telegram: Não configurado"
fi
echo ""
echo "🔗 Gerenciar alertas:"
echo "   https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo ""
echo "📋 Próximos passos:"
echo "   1. Testar alertas forçando condições de erro"
echo "   2. Ajustar thresholds conforme necessário"
echo "   3. Configurar escalation policies se necessário"
echo "   4. Verificar se as notificações estão chegando"
echo ""
echo "🧪 Teste os alertas:"
echo "   # Forçar alta latência"
echo "   curl -X POST [BACKEND_URL]/api/v1/observability/test"
echo ""
echo "   # Verificar logs de alertas"
echo "   gcloud logging read 'resource.type=\"gce_instance\" AND jsonPayload.alertPolicy' --limit=10"