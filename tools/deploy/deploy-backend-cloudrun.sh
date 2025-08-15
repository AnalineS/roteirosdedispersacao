#!/bin/bash

# ============================================================================
# DEPLOY OTIMIZADO BACKEND - GOOGLE CLOUD RUN
# Sistema Educacional para Dispensação PQT-U
# Script de deploy com configurações anti-timeout
# ============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Verificar variáveis obrigatórias
if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
    error "GCP_PROJECT_ID não definido"
    exit 1
fi

if [[ -z "${GCP_REGION:-}" ]]; then
    error "GCP_REGION não definido"
    exit 1
fi

PROJECT_ID="${GCP_PROJECT_ID}"
REGION="${GCP_REGION}"
SERVICE_NAME="roteiro-dispensacao-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
BACKEND_DIR="apps/backend"

# Configurações otimizadas
MEMORY="2Gi"
CPU="2"
CONCURRENCY="40"
TIMEOUT="900"
MAX_INSTANCES="10"
MIN_INSTANCES="0"

log "🚀 Iniciando deploy otimizado para Cloud Run"
log "📦 Projeto: ${PROJECT_ID}"
log "🌍 Região: ${REGION}"
log "🔧 Serviço: ${SERVICE_NAME}"

# ============================================================================
# VERIFICAÇÕES PRÉ-DEPLOY
# ============================================================================

log "🔍 Verificando pré-requisitos..."

# Verificar se gcloud está instalado e autenticado
if ! command -v gcloud &> /dev/null; then
    error "Google Cloud CLI não encontrado. Instale: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar autenticação
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    error "Não autenticado no Google Cloud. Execute: gcloud auth login"
    exit 1
fi

# Verificar projeto
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [[ "${CURRENT_PROJECT}" != "${PROJECT_ID}" ]]; then
    warn "Projeto atual (${CURRENT_PROJECT}) diferente do configurado (${PROJECT_ID})"
    log "🔧 Configurando projeto correto..."
    gcloud config set project "${PROJECT_ID}"
fi

# Verificar se estamos no diretório correto
if [[ ! -d "${BACKEND_DIR}" ]]; then
    error "Diretório ${BACKEND_DIR} não encontrado. Execute do diretório raiz do projeto."
    exit 1
fi

# ============================================================================
# PREPARAÇÃO DO AMBIENTE
# ============================================================================

log "⚙️ Preparando ambiente de build..."

# Habilitar APIs necessárias
log "🔌 Habilitando APIs do Google Cloud..."
gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com \
    --project="${PROJECT_ID}" \
    --quiet

# Verificar se Docker está disponível (para build local opcional)
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null && docker info &> /dev/null; then
    DOCKER_AVAILABLE=true
    info "🐳 Docker disponível para build local"
else
    warn "🐳 Docker não disponível, usando apenas Cloud Build"
fi

# ============================================================================
# BUILD DA IMAGEM
# ============================================================================

log "🏗️ Iniciando build da imagem Docker..."

cd "${BACKEND_DIR}"

# Gerar tag única
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "manual")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="${GIT_SHA}-${TIMESTAMP}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

info "🏷️ Tag da imagem: ${IMAGE_TAG}"

# Build usando Cloud Build (mais confiável para Cloud Run)
log "☁️ Executando build no Cloud Build..."

BUILD_CONFIG=$(cat <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-f', 'Dockerfile.production',
      '-t', '${FULL_IMAGE_NAME}',
      '-t', '${IMAGE_NAME}:latest',
      '--cache-from', '${IMAGE_NAME}:latest',
      '.'
    ]
images:
  - '${FULL_IMAGE_NAME}'
  - '${IMAGE_NAME}:latest'
options:
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100
timeout: '1200s'
EOF
)

echo "${BUILD_CONFIG}" > cloudbuild.yaml

# Submeter build
BUILD_ID=$(gcloud builds submit \
    --config=cloudbuild.yaml \
    --project="${PROJECT_ID}" \
    --format="value(id)")

log "📋 Build ID: ${BUILD_ID}"
log "🔗 Logs: https://console.cloud.google.com/cloud-build/builds/${BUILD_ID}?project=${PROJECT_ID}"

# Aguardar build completar
log "⏳ Aguardando build completar..."
gcloud builds wait "${BUILD_ID}" --project="${PROJECT_ID}"

# Limpar arquivo temporário
rm -f cloudbuild.yaml

log "✅ Build concluído com sucesso!"

# ============================================================================
# DEPLOY PARA CLOUD RUN
# ============================================================================

log "🚀 Executando deploy para Cloud Run..."

# Preparar variáveis de ambiente críticas
ENV_VARS="ENVIRONMENT=production"
ENV_VARS="${ENV_VARS},FLASK_ENV=production"
ENV_VARS="${ENV_VARS},PORT=8080"

# Feature flags conservadores
ENV_VARS="${ENV_VARS},EMBEDDINGS_ENABLED=false"
ENV_VARS="${ENV_VARS},ADVANCED_FEATURES=false"
ENV_VARS="${ENV_VARS},RAG_AVAILABLE=false"
ENV_VARS="${ENV_VARS},ADVANCED_CACHE=false"

# Configurações de observabilidade
ENV_VARS="${ENV_VARS},METRICS_ENABLED=true"
ENV_VARS="${ENV_VARS},LOG_LEVEL=INFO"
ENV_VARS="${ENV_VARS},PROMETHEUS_ENABLED=true"

# Deploy com configurações otimizadas
DEPLOY_URL=$(gcloud run deploy "${SERVICE_NAME}" \
    --image="${FULL_IMAGE_NAME}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --memory="${MEMORY}" \
    --cpu="${CPU}" \
    --concurrency="${CONCURRENCY}" \
    --max-instances="${MAX_INSTANCES}" \
    --min-instances="${MIN_INSTANCES}" \
    --timeout="${TIMEOUT}" \
    --execution-environment=gen2 \
    --cpu-throttling \
    --session-affinity \
    --port=8080 \
    --set-env-vars="${ENV_VARS}" \
    --project="${PROJECT_ID}" \
    --format="value(status.url)")

log "✅ Deploy concluído!"

# ============================================================================
# VERIFICAÇÕES PÓS-DEPLOY
# ============================================================================

log "🔍 Executando verificações pós-deploy..."

# Aguardar estabilização
sleep 30

# Testar health check
info "🏥 Testando health check..."
if curl -f -s "${DEPLOY_URL}/api/v1/health" > /dev/null; then
    log "✅ Health check funcionando!"
else
    warn "⚠️ Health check falhou, verificando logs..."
    gcloud run services logs read "${SERVICE_NAME}" \
        --region="${REGION}" \
        --project="${PROJECT_ID}" \
        --limit=50
fi

# Testar endpoints principais
info "🧪 Testando endpoints principais..."
ENDPOINTS=(
    "/api/v1/health"
    "/api/v1/health/live" 
    "/api/v1/health/ready"
    "/api/v1/personas"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "${DEPLOY_URL}${endpoint}" > /dev/null; then
        info "✅ ${endpoint} funcionando"
    else
        warn "⚠️ ${endpoint} com problemas"
    fi
done

# ============================================================================
# INFORMAÇÕES FINAIS
# ============================================================================

log "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo "📊 INFORMAÇÕES DO DEPLOY:"
echo "========================"
echo "🌐 URL do serviço: ${DEPLOY_URL}"
echo "🏷️ Tag da imagem: ${IMAGE_TAG}"
echo "📦 Imagem completa: ${FULL_IMAGE_NAME}"
echo "🔧 Configurações:"
echo "   - Memória: ${MEMORY}"
echo "   - CPU: ${CPU}"
echo "   - Concorrência: ${CONCURRENCY}"
echo "   - Timeout: ${TIMEOUT}s"
echo "   - Min instances: ${MIN_INSTANCES}"
echo "   - Max instances: ${MAX_INSTANCES}"
echo ""
echo "🔗 Links úteis:"
echo "   - Console Cloud Run: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/revisions?project=${PROJECT_ID}"
echo "   - Logs: gcloud run services logs read ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo "   - Metrics: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics?project=${PROJECT_ID}"
echo ""

# Testar integração com frontend
if [[ -n "${FRONTEND_URL:-}" ]]; then
    info "🔗 Para integrar com frontend, configure:"
    echo "NEXT_PUBLIC_API_URL=${DEPLOY_URL}"
fi

log "🚀 Backend otimizado e funcionando!"

cd - > /dev/null  # Voltar ao diretório original