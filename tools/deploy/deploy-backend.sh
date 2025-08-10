#!/bin/bash

# Deploy do Backend Unificado - Cloud Run
# Roteiros de Dispensação

echo "🚀 Deploy do Backend Unificado para Google Cloud Run"
echo "================================================="

# Configurações
PROJECT_ID="roteiro-dispensacao-hanseniase"
SERVICE_NAME="roteiro-dispensacao-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "📋 Configurações:"
echo "   Projeto: $PROJECT_ID"
echo "   Serviço: $SERVICE_NAME"
echo "   Região: $REGION"
echo "   Imagem: $IMAGE_NAME"
echo ""

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI não encontrado"
    echo "📥 Instale: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ Google Cloud CLI detectado"

# Configurar projeto
echo "🔧 Configurando projeto..."
gcloud config set project $PROJECT_ID

# Habilitar APIs necessárias
echo "📡 Habilitando APIs necessárias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build da imagem
echo "🔨 Fazendo build da imagem Docker..."
gcloud builds submit --tag $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Erro no build da imagem"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Deploy no Cloud Run
echo "🚀 Fazendo deploy no Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 100 \
  --max-instances 10 \
  --timeout 300 \
  --port 5000

if [ $? -ne 0 ]; then
    echo "❌ Erro no deploy"
    exit 1
fi

echo "✅ Deploy concluído com sucesso!"

# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "==================="
echo "🌐 URL: $SERVICE_URL"
echo "📊 Health Check: $SERVICE_URL/api/health"
echo ""

# Testar health check
echo "🔍 Testando health check..."
curl -s "$SERVICE_URL/api/health" | python3 -m json.tool

echo ""
echo "💡 Próximos passos:"
echo "   1. Verificar se todas as 4 verificações passaram"
echo "   2. Testar o frontend integrado"
echo "   3. Verificar se knowledge base carregou"