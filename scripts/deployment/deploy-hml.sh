#!/bin/bash

# Script de Deploy para Ambiente de Homologação (HML)
# ====================================================

set -e  # Exit on any error

# Configurações
PROJECT_ID=${GOOGLE_CLOUD_PROJECT}
SERVICE_NAME="hml-roteiro-dispensacao-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
FRONTEND_PROJECT="hml-roteiros-de-dispensacao"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    log_info "Verificando dependências..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI não encontrado. Instale o Google Cloud SDK."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado. Instale o Docker."
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI não encontrado. Execute: npm install -g firebase-tools"
        exit 1
    fi
    
    log_success "Todas as dependências encontradas"
}

# Configurar autenticação
setup_auth() {
    log_info "Configurando autenticação..."
    
    # Verificar se está logado no gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_warning "Não está logado no gcloud. Executando login..."
        gcloud auth login
    fi
    
    # Configurar projeto
    gcloud config set project ${PROJECT_ID}
    
    # Configurar Docker para usar gcloud
    gcloud auth configure-docker --quiet
    
    log_success "Autenticação configurada"
}

# Build da aplicação backend
build_backend() {
    log_info "Fazendo build do backend..."
    
    cd apps/backend
    
    # Build da imagem Docker para HML
    docker build -f Dockerfile.hml -t ${IMAGE_NAME}:latest .
    docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:$(git rev-parse --short HEAD)
    
    # Push para Container Registry
    docker push ${IMAGE_NAME}:latest
    docker push ${IMAGE_NAME}:$(git rev-parse --short HEAD)
    
    cd ../..
    
    log_success "Build do backend concluído"
}

# Deploy do Cloud Run
deploy_cloud_run() {
    log_info "Fazendo deploy do Cloud Run..."
    
    # Carregar variáveis de ambiente
    ENV_VARS=$(cat environments/shared.env environments/hml.env | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')
    
    gcloud run deploy ${SERVICE_NAME} \
        --image=${IMAGE_NAME}:latest \
        --platform=managed \
        --region=${REGION} \
        --allow-unauthenticated \
        --port=8080 \
        --memory=1Gi \
        --cpu=1 \
        --concurrency=100 \
        --max-instances=10 \
        --min-instances=0 \
        --timeout=300 \
        --set-env-vars="${ENV_VARS}" \
        --tag=latest \
        --quiet
    
    # Obter URL do serviço
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
    
    log_success "Cloud Run deploy concluído: ${SERVICE_URL}"
    echo "SERVICE_URL=${SERVICE_URL}" >> $GITHUB_ENV
}

# Build e deploy do frontend
deploy_frontend() {
    log_info "Fazendo deploy do frontend..."
    
    cd apps/frontend-nextjs
    
    # Instalar dependências
    npm ci
    
    # Configurar variável de ambiente para API
    echo "NEXT_PUBLIC_API_URL=${SERVICE_URL}" > .env.production.local
    echo "NEXT_PUBLIC_ENVIRONMENT=homologacao" >> .env.production.local
    echo "NEXT_PUBLIC_SITE_NAME=hml-roteiros-de-dispensacao" >> .env.production.local
    
    # Build do projeto
    npm run build
    
    # Deploy no Firebase Hosting
    firebase use ${PROJECT_ID}
    firebase target:apply hosting hml ${FRONTEND_PROJECT}
    firebase deploy --only hosting:hml --force
    
    cd ../..
    
    FRONTEND_URL="https://${FRONTEND_PROJECT}.web.app"
    log_success "Frontend deploy concluído: ${FRONTEND_URL}"
    echo "FRONTEND_URL=${FRONTEND_URL}" >> $GITHUB_ENV
}

# Reset dos dados HML
reset_hml_data() {
    log_info "Resetando dados do ambiente HML..."
    
    # Executar script de seed de dados sintéticos
    if [ -f scripts/seed-hml-data.sh ]; then
        bash scripts/seed-hml-data.sh
        log_success "Dados HML resetados com sucesso"
    else
        log_warning "Script de seed não encontrado, pulando reset de dados"
    fi
}

# Executar smoke tests
run_smoke_tests() {
    log_info "Executando smoke tests..."
    
    # Health check
    if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
        log_success "Health check passou"
    else
        log_error "Health check falhou"
        exit 1
    fi
    
    # Teste de personas
    if curl -f "${SERVICE_URL}/api/v1/personas" > /dev/null 2>&1; then
        log_success "Teste de personas passou"
    else
        log_error "Teste de personas falhou"
        exit 1
    fi
    
    # Teste do frontend
    if curl -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        log_success "Teste do frontend passou"
    else
        log_error "Teste do frontend falhou"
        exit 1
    fi
    
    log_success "Todos os smoke tests passaram"
}

# Enviar notificação
send_notification() {
    log_info "Enviando notificação..."
    
    local commit_sha=$(git rev-parse --short HEAD)
    local commit_msg=$(git log -1 --pretty=%B)
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    # Mensagem para Telegram (admins)
    local message="🚀 *Deploy HML Concluído*

📦 *Commit:* \`${commit_sha}\`
📝 *Mensagem:* ${commit_msg}
🕐 *Timestamp:* ${timestamp}

🔗 *URLs:*
• Backend: ${SERVICE_URL}
• Frontend: ${FRONTEND_URL}

✅ *Smoke Tests:* Todos passaram
🔄 *Dados:* Resetados automaticamente

👥 *Pronto para testes manuais*"

    # Enviar para Telegram (se configurado)
    if [ ! -z "${TELEGRAM_BOT_TOKEN}" ] && [ ! -z "${TELEGRAM_CHAT_ID}" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${message}" \
            -d parse_mode="Markdown"
        log_success "Notificação Telegram enviada"
    else
        log_warning "Telegram não configurado, pulando notificação"
    fi
}

# Função principal
main() {
    log_info "🚀 Iniciando deploy do ambiente HML..."
    log_info "Projeto: ${PROJECT_ID}"
    log_info "Serviço: ${SERVICE_NAME}"
    log_info "Região: ${REGION}"
    
    check_dependencies
    setup_auth
    build_backend
    deploy_cloud_run
    deploy_frontend
    reset_hml_data
    run_smoke_tests
    send_notification
    
    log_success "🎉 Deploy HML concluído com sucesso!"
    log_info "Backend: ${SERVICE_URL}"
    log_info "Frontend: ${FRONTEND_URL}"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi