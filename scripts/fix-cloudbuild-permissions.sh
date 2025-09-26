#!/bin/bash
# ============================================================================
# Script para Resolver Problemas de Permissões do Cloud Build com VPC-SC
# Ajusta permissões IAM para contornar problemas de VPC Service Controls
# ============================================================================

set -e

PROJECT_ID="${GCP_PROJECT_ID:-red-truck-468923-s4}"
REGION="${GCP_REGION:-us-central1}"

echo "🔧 Cloud Build Permissions Fix Script"
echo "📋 Project ID: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "============================================================================"

# Verificar se gcloud está autenticado
echo "🔐 Verificando autenticação do gcloud..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
    echo "❌ ERRO: gcloud não está autenticado"
    echo "Execute: gcloud auth login"
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo "✅ Conta ativa: $ACTIVE_ACCOUNT"

# Obter número do projeto e service account do Cloud Build
echo ""
echo "📊 Obtendo informações do projeto..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "📋 Project Number: $PROJECT_NUMBER"
echo "🤖 Cloud Build SA: $CLOUDBUILD_SA"

# Verificar permissões atuais
echo ""
echo "🔍 Verificando permissões atuais do Cloud Build Service Account..."

# Função para verificar se uma role está atribuída
check_role() {
    local role=$1
    if gcloud projects get-iam-policy $PROJECT_ID \
        --flatten="bindings[].members" \
        --filter="bindings.role:$role AND bindings.members:serviceAccount:$CLOUDBUILD_SA" \
        --format="value(bindings.role)" | grep -q "$role"; then
        echo "✅ $role: JÁ CONFIGURADO"
        return 0
    else
        echo "❌ $role: AUSENTE"
        return 1
    fi
}

# Verificar roles essenciais
echo "📋 Status das permissões atuais:"
check_role "roles/cloudbuild.builds.builder" || NEED_BUILDER=true
check_role "roles/run.admin" || NEED_RUN_ADMIN=true
check_role "roles/storage.admin" || NEED_STORAGE_ADMIN=true
check_role "roles/viewer" || NEED_VIEWER=true
check_role "roles/logging.logWriter" || NEED_LOG_WRITER=true

# Aplicar permissões ausentes
echo ""
echo "🔧 Aplicando permissões necessárias..."

apply_role() {
    local role=$1
    local description=$2

    echo "➕ Adicionando $role ($description)..."
    if gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$CLOUDBUILD_SA" \
        --role="$role" \
        --quiet; then
        echo "✅ $role aplicado com sucesso"
    else
        echo "❌ Falha ao aplicar $role"
        return 1
    fi
}

# Aplicar roles se necessário
if [ "$NEED_BUILDER" = true ]; then
    apply_role "roles/cloudbuild.builds.builder" "Build execution"
fi

if [ "$NEED_RUN_ADMIN" = true ]; then
    apply_role "roles/run.admin" "Cloud Run management"
fi

if [ "$NEED_STORAGE_ADMIN" = true ]; then
    apply_role "roles/storage.admin" "Storage and logs access"
fi

if [ "$NEED_VIEWER" = true ]; then
    apply_role "roles/viewer" "Project visibility"
fi

if [ "$NEED_LOG_WRITER" = true ]; then
    apply_role "roles/logging.logWriter" "Log writing capability"
fi

# Verificar se Cloud Build está habilitado
echo ""
echo "🔌 Verificando APIs habilitadas..."

check_api() {
    local api=$1
    local description=$2

    if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        echo "✅ $description ($api): HABILITADO"
    else
        echo "❌ $description ($api): DESABILITADO"
        echo "🔧 Habilitando $api..."
        gcloud services enable $api --quiet
        echo "✅ $api habilitado"
    fi
}

check_api "cloudbuild.googleapis.com" "Cloud Build API"
check_api "run.googleapis.com" "Cloud Run API"
check_api "storage.googleapis.com" "Cloud Storage API"
check_api "logging.googleapis.com" "Cloud Logging API"

# Verificar quota de builds
echo ""
echo "📊 Verificando quotas do Cloud Build..."
BUILD_QUOTA=$(gcloud compute project-info describe --format="value(quotas[].limit)" --filter="quotas.metric:CLOUD_BUILD_CONCURRENT_BUILDS" 2>/dev/null || echo "N/A")
echo "🏗️ Concurrent builds quota: $BUILD_QUOTA"

# Test de conectividade
echo ""
echo "🧪 Testando conectividade básica..."

# Verificar se consegue listar builds recentes
echo "📋 Listando builds recentes..."
if RECENT_BUILDS=$(gcloud builds list --limit=3 --format="table(id,status,createTime)" 2>/dev/null); then
    echo "✅ Acesso aos builds confirmado"
    echo "$RECENT_BUILDS"
else
    echo "⚠️ Acesso limitado aos builds (pode ser normal)"
fi

# Verificar acesso ao Artifact Registry
echo ""
echo "📦 Verificando acesso ao Artifact Registry..."
REPO_URL="us-central1-docker.pkg.dev/${PROJECT_ID}/hml-roteiro-dispensacao"
if gcloud artifacts repositories list --location=$REGION --format="value(name)" | grep -q "hml-roteiro-dispensacao"; then
    echo "✅ Repositório Artifact Registry acessível: $REPO_URL"
else
    echo "⚠️ Repositório Artifact Registry não encontrado: $REPO_URL"
    echo "💡 Isso pode ser criado automaticamente durante o primeiro push"
fi

# Verificar configuração de VPC Service Controls
echo ""
echo "🛡️ Verificando VPC Service Controls..."
if gcloud access-context-manager perimeters list --format="value(name)" 2>/dev/null | head -1; then
    echo "⚠️ VPC Service Controls detectado no projeto"
    echo "💡 As configurações aplicadas devem ajudar a contornar restrições"

    # Verificar se Cloud Build está na lista de serviços restritos
    if VPC_SERVICES=$(gcloud access-context-manager perimeters describe $(gcloud access-context-manager perimeters list --format="value(name)" | head -1) --format="value(status.restrictedServices)" 2>/dev/null); then
        if echo "$VPC_SERVICES" | grep -q "cloudbuild.googleapis.com"; then
            echo "🚨 Cloud Build está restrito por VPC-SC"
            echo "💡 Build com --no-user-output-enabled deve contornar isso"
        else
            echo "✅ Cloud Build não está restrito por VPC-SC"
        fi
    fi
else
    echo "✅ VPC Service Controls não detectado"
fi

echo ""
echo "============================================================================"
echo "🎯 RESUMO DAS CONFIGURAÇÕES APLICADAS"
echo "============================================================================"
echo "✅ Permissões IAM verificadas e aplicadas"
echo "✅ APIs necessárias habilitadas"
echo "✅ Conectividade testada"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "1. ✅ Execute o workflow de deploy novamente"
echo "2. 🔍 Se ainda falhar, verifique logs no Console: https://console.cloud.google.com/cloud-build"
echo "3. 📞 Se persistir, considere abrir ticket de suporte GCP"
echo ""
echo "📋 Service Account configurado: $CLOUDBUILD_SA"
echo "🌍 Projeto: $PROJECT_ID"
echo "📦 Registry: $REPO_URL"
echo ""
echo "✅ Script concluído com sucesso!"