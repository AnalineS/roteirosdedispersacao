#!/bin/bash

# Script para conceder permissões de monitoramento ao Service Account
# Execução: bash scripts/grant-monitoring-permissions.sh [PROJECT_ID] [SERVICE_ACCOUNT_EMAIL]

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"
SERVICE_ACCOUNT_EMAIL="${2:-github-actions-hml@red-truck-468923-s4.iam.gserviceaccount.com}"

echo "🔐 Concedendo permissões de Google Cloud Operations Suite"
echo "Projeto: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "=================================================="

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Erro: gcloud não está autenticado"
    echo "Execute: gcloud auth login"
    exit 1
fi

# Configurar projeto
gcloud config set project $PROJECT_ID

echo ""
echo "1/8 - Concedendo permissões de Cloud Monitoring..."

# Cloud Monitoring - Editor completo
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/monitoring.editor" \
    --quiet

echo "✅ Monitoring Editor concedido"

echo ""
echo "2/8 - Concedendo permissões de Cloud Logging..."

# Cloud Logging - Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/logging.logWriter" \
    --quiet

# Cloud Logging - Viewer
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/logging.viewer" \
    --quiet

echo "✅ Logging Writer e Viewer concedidos"

echo ""
echo "3/8 - Concedendo permissões de Error Reporting..."

# Error Reporting - Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/errorreporting.writer" \
    --quiet

echo "✅ Error Reporting Writer concedido"

echo ""
echo "4/8 - Concedendo permissões de Cloud Trace..."

# Cloud Trace - Agent
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudtrace.agent" \
    --quiet

echo "✅ Cloud Trace Agent concedido"

echo ""
echo "5/8 - Concedendo permissões de Cloud Profiler..."

# Cloud Profiler - Agent
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudprofiler.agent" \
    --quiet

echo "✅ Cloud Profiler Agent concedido"

echo ""
echo "6/8 - Concedendo permissões de Metrics Writer..."

# Monitoring Metric Writer (para métricas customizadas)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/monitoring.metricWriter" \
    --quiet

echo "✅ Monitoring Metric Writer concedido"

echo ""
echo "7/8 - Concedendo permissões de Dashboard Admin..."

# Monitoring Dashboard Admin (para criar dashboards)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/monitoring.dashboardEditor" \
    --quiet

echo "✅ Monitoring Dashboard Editor concedido"

echo ""
echo "8/8 - Concedendo permissões de Alert Policy Admin..."

# Monitoring Alert Policy Admin (para criar alertas)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/monitoring.alertPolicyEditor" \
    --quiet

echo "✅ Monitoring Alert Policy Editor concedido"

echo ""
echo "🔍 Verificando permissões aplicadas..."

# Listar todas as permissões do Service Account
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format='table(bindings.role)' \
    --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL"

echo ""
echo "✅ Todas as permissões foram concedidas com sucesso!"
echo ""
echo "📊 Permissões concedidas ao Service Account:"
echo "  • roles/monitoring.editor - Controle completo do Cloud Monitoring"
echo "  • roles/logging.logWriter - Escrever logs no Cloud Logging"  
echo "  • roles/logging.viewer - Visualizar logs do Cloud Logging"
echo "  • roles/errorreporting.writer - Reportar erros ao Error Reporting"
echo "  • roles/cloudtrace.agent - Enviar dados de trace"
echo "  • roles/cloudprofiler.agent - Enviar dados de profiling"
echo "  • roles/monitoring.metricWriter - Escrever métricas customizadas"
echo "  • roles/monitoring.dashboardEditor - Criar e editar dashboards"
echo "  • roles/monitoring.alertPolicyEditor - Criar e editar políticas de alerta"
echo ""
echo "🚀 O Service Account agora tem todas as permissões necessárias para:"
echo "   ✅ Criar e gerenciar dashboards"
echo "   ✅ Configurar alertas e canais de notificação"
echo "   ✅ Enviar logs estruturados"
echo "   ✅ Criar métricas customizadas"
echo "   ✅ Reportar erros automaticamente"
echo ""
echo "📋 Próximos passos:"
echo "   1. Re-executar o workflow HML para aplicar as novas permissões"
echo "   2. Verificar se os alertas são criados com sucesso"
echo "   3. Confirmar notificações chegando no Telegram"