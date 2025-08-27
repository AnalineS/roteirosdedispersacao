#!/bin/bash

# Script para ativar APIs do Google Cloud Operations Suite
# Execução: bash scripts/enable-gcp-observability.sh

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"

echo "🚀 Ativando Google Cloud Operations Suite para o projeto: $PROJECT_ID"
echo "=================================================="

# Configurar projeto
gcloud config set project $PROJECT_ID

echo "📊 Ativando APIs necessárias..."

# Cloud Monitoring (Stackdriver)
echo "1/6 - Cloud Monitoring API..."
gcloud services enable monitoring.googleapis.com

# Cloud Logging
echo "2/6 - Cloud Logging API..."
gcloud services enable logging.googleapis.com

# Cloud Trace
echo "3/6 - Cloud Trace API..."
gcloud services enable cloudtrace.googleapis.com

# Cloud Profiler
echo "4/6 - Cloud Profiler API..."
gcloud services enable cloudprofiler.googleapis.com

# Error Reporting
echo "5/6 - Error Reporting API..."
gcloud services enable clouderrorreporting.googleapis.com

# Cloud Debugger (opcional mas útil)
echo "6/6 - Cloud Debugger API..."
gcloud services enable clouddebugger.googleapis.com

echo ""
echo "✅ Todas as APIs foram ativadas com sucesso!"
echo ""
echo "📋 APIs ativadas:"
echo "  • Cloud Monitoring (métricas e dashboards)"
echo "  • Cloud Logging (logs centralizados)"
echo "  • Cloud Trace (rastreamento de requisições)"
echo "  • Cloud Profiler (análise de performance)"
echo "  • Error Reporting (tracking de erros)"
echo "  • Cloud Debugger (debug em produção)"
echo ""
echo "🔗 Console do Operations Suite:"
echo "   https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo ""
echo "📊 Dashboards do Cloud Run (automáticos):"
echo "   https://console.cloud.google.com/run?project=$PROJECT_ID"
echo ""
echo "⚡ Próximos passos:"
echo "   1. Configurar Service Account com permissões"
echo "   2. Instrumentar código com client libraries"
echo "   3. Criar dashboards customizados"
echo "   4. Configurar políticas de alerta"