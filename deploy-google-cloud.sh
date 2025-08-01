#!/bin/bash

# Deploy Roteiros de Dispensação - Google Cloud
# Domínio: roteirosdedispensacao.com

echo "🚀 Iniciando deploy para Google Cloud..."
echo "📍 Domínio: roteirosdedispensacao.com"

# Configurações
PROJECT_ID="roteiro-dispensacao-hanseniase"
BUCKET_NAME="roteirosdedispensacao-com"
DOMAIN="roteirosdedispensacao.com"
SOURCE_DIR="./src/frontend/dist"

echo ""
echo "📦 PASSO 1: Configurando projeto Google Cloud"
echo "============================================="

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI não encontrado"
    echo "📥 Instale: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Configurar projeto
echo "🔧 Configurando projeto: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo ""
echo "🪣 PASSO 2: Criando bucket do Google Cloud Storage"
echo "================================================="

# Criar bucket
echo "📦 Criando bucket: $BUCKET_NAME"
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME

# Configurar bucket para website estático
echo "🌐 Configurando website estático"
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Tornar bucket público
echo "🔓 Tornando bucket público"
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

echo ""
echo "📤 PASSO 3: Upload dos arquivos"
echo "==============================="

# Upload dos arquivos
echo "⬆️  Fazendo upload da pasta dist/"
gsutil -m rsync -r -d $SOURCE_DIR gs://$BUCKET_NAME

# Configurar cache para assets
echo "⚡ Configurando cache para assets"
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/assets/**

# Configurar headers de segurança
echo "🔒 Configurando headers de segurança"
gsutil -m setmeta -h "X-Frame-Options:DENY" -h "X-Content-Type-Options:nosniff" gs://$BUCKET_NAME/**

echo ""
echo "🌍 PASSO 4: Configurando domínio personalizado"
echo "=============================================="

# Verificar domínio
echo "📍 Verificando propriedade do domínio"
echo "⚠️  AÇÃO MANUAL NECESSÁRIA:"
echo "   1. Acesse: https://search.google.com/search-console"
echo "   2. Adicione a propriedade: $DOMAIN"
echo "   3. Verifique a propriedade usando DNS TXT record"

echo ""
echo "🔗 PASSO 5: Configurando Load Balancer e SSL"
echo "============================================"

# Reservar IP estático
echo "🌐 Reservando IP estático global"
gcloud compute addresses create $DOMAIN-ip --global

# Criar backend bucket
echo "🪣 Criando backend bucket"
gcloud compute backend-buckets create $DOMAIN-backend \
    --gcs-bucket-name=$BUCKET_NAME

# Criar URL map
echo "🗺️  Criando URL map"
gcloud compute url-maps create $DOMAIN-map \
    --default-backend-bucket=$DOMAIN-backend

# Criar certificado SSL gerenciado
echo "🔒 Criando certificado SSL gerenciado"
gcloud compute ssl-certificates create $DOMAIN-ssl \
    --domains=$DOMAIN \
    --global

# Criar HTTPS proxy
echo "🔐 Criando HTTPS proxy"
gcloud compute target-https-proxies create $DOMAIN-https-proxy \
    --url-map=$DOMAIN-map \
    --ssl-certificates=$DOMAIN-ssl

# Criar regra de forwarding
echo "📡 Criando regra de forwarding"
gcloud compute forwarding-rules create $DOMAIN-https-rule \
    --address=$DOMAIN-ip \
    --global \
    --target-https-proxy=$DOMAIN-https-proxy \
    --ports=443

# Obter IP para configuração DNS
IP=$(gcloud compute addresses describe $DOMAIN-ip --global --format="value(address)")

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "==============================="
echo ""
echo "📍 Domínio: https://$DOMAIN"
echo "🌐 IP do Load Balancer: $IP"
echo "📦 Bucket: gs://$BUCKET_NAME"
echo "🔒 SSL: Certificado gerenciado automático"
echo ""
echo "🔧 CONFIGURAÇÃO DNS NECESSÁRIA:"
echo "==============================="
echo "Adicione este registro A no seu provedor de DNS:"
echo ""
echo "Tipo: A"
echo "Nome: @"
echo "Valor: $IP"
echo "TTL: 300"
echo ""
echo "Para www.$DOMAIN:"
echo "Tipo: CNAME"
echo "Nome: www"
echo "Valor: $DOMAIN"
echo "TTL: 300"
echo ""
echo "⏱️  Aguarde 10-60 minutos para propagação completa"
echo "🎉 Seu site estará disponível em: https://$DOMAIN"

echo ""
echo "📊 INFORMAÇÕES DO DEPLOY:"
echo "========================"
echo "• Frontend: Google Cloud Storage"
echo "• Backend: Google Apps Script"
echo "• CDN: Google Cloud CDN automático"
echo "• SSL: Let's Encrypt automático"
echo "• Custo estimado: ~R$ 5-15/mês"