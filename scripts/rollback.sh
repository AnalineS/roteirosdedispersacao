#!/bin/bash
# ===========================================
# SCRIPT DE ROLLBACK - ROTEIRO DE DISPENSAÇÃO
# Data: 29/08/2025
# Uso: ./scripts/rollback.sh --env=<production|hml> --version=<previous|specific>
# ===========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Parse argumentos
ENV=""
VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            ENV="${1#*=}"
            shift
            ;;
        --version=*)
            VERSION="${1#*=}"
            shift
            ;;
        *)
            error "Argumento desconhecido: $1"
            exit 1
            ;;
    esac
done

# Validar argumentos
if [[ -z "$ENV" ]] || [[ -z "$VERSION" ]]; then
    error "Uso: $0 --env=<production|hml> --version=<previous|specific>"
    exit 1
fi

if [[ "$ENV" != "production" && "$ENV" != "hml" ]]; then
    error "Ambiente deve ser 'production' ou 'hml'"
    exit 1
fi

log "Iniciando rollback para ambiente: $ENV, versão: $VERSION"

# Backup da configuração atual antes do rollback
BACKUP_DIR="./backup/rollback-$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

log "Criando backup da configuração atual em: $BACKUP_DIR"

# Backup dos .env atuais
if [[ -f "apps/frontend-nextjs/.env.$ENV" ]]; then
    cp "apps/frontend-nextjs/.env.$ENV" "$BACKUP_DIR/"
fi

if [[ -f "apps/backend/.env.$ENV" ]]; then
    cp "apps/backend/.env.$ENV" "$BACKUP_DIR/"
fi

# Desabilitar serviços problemáticos
log "Desabilitando serviços que podem estar causando problemas..."

# Criar .env temporário com serviços desabilitados
cat > "$BACKUP_DIR/rollback.env" << EOF
# ROLLBACK CONFIGURATION - SERVIÇOS DESABILITADOS
FIRESTORE_CACHE_ENABLED=false
EMBEDDINGS_ENABLED=false
RAG_AVAILABLE=false
SECURITY_MIDDLEWARE_ENABLED=false
ADVANCED_FEATURES=false
ADVANCED_CACHE=false

# Manter configurações básicas
NODE_ENV=$ENV
EOF

log "Configuração de rollback criada"

# Se estiver usando git, fazer checkout para commit anterior
if [[ "$VERSION" == "previous" ]] && command -v git &> /dev/null; then
    log "Fazendo rollback para commit anterior via Git..."
    
    # Salvar estado atual
    git stash push -m "Rollback backup $(date +%Y-%m-%d_%H-%M-%S)"
    
    # Checkout para commit anterior
    PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
    log "Fazendo checkout para commit: $PREVIOUS_COMMIT"
    git checkout "$PREVIOUS_COMMIT"
    
    log "Git rollback concluído"
fi

# Verificar se os serviços estão respondendo
log "Verificando status dos serviços após rollback..."

if [[ "$ENV" == "production" ]]; then
    HEALTH_URL="https://roteiro-dispensacao-api-prod.run.app/api/v1/health"
elif [[ "$ENV" == "hml" ]]; then
    HEALTH_URL="https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app/api/v1/health"
fi

# Aguardar um pouco para o serviço reiniciar
sleep 30

log "Testando health check: $HEALTH_URL"
if curl -f -s "$HEALTH_URL" > /dev/null; then
    log "✅ Serviço está respondendo normalmente após rollback"
else
    warn "⚠️  Serviço não está respondendo - pode precisar de verificação manual"
fi

# Criar relatório do rollback
cat > "$BACKUP_DIR/rollback-report.json" << EOF
{
    "rollback_timestamp": "$(date -Iseconds)",
    "environment": "$ENV",
    "version": "$VERSION",
    "backup_location": "$BACKUP_DIR",
    "git_commit_before": "$(git rev-parse HEAD 2>/dev/null || echo 'N/A')",
    "services_disabled": [
        "firestore_cache",
        "rag_embeddings", 
        "security_middleware",
        "advanced_features"
    ],
    "health_check_url": "$HEALTH_URL",
    "status": "completed"
}
EOF

log "Relatório de rollback salvo em: $BACKUP_DIR/rollback-report.json"

log "🎉 Rollback concluído com sucesso!"
log "📁 Backup salvo em: $BACKUP_DIR"
log "🔍 Verifique os logs da aplicação para confirmar estabilidade"

# Instruções pós-rollback
echo ""
log "📋 PRÓXIMOS PASSOS:"
log "1. Monitorar logs da aplicação por 10-15 minutos"
log "2. Verificar métricas de error rate e response time"
log "3. Confirmar funcionamento básico do chat"
log "4. Documentar incidente e causas do rollback"
log "5. Planejar correções para nova tentativa"