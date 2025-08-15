# Configuração do Domínio roteirosdispensacao.com.br

## 📋 Visão Geral

Este guia detalha a configuração completa do domínio `roteirosdispensacao.com.br` para os ambientes de produção e homologação.

### Arquitetura dos Ambientes

| Ambiente | URL | Frontend | Backend |
|----------|-----|----------|---------|
| **Produção** | https://roteirosdispensacao.com.br | Firebase Hosting | Cloud Run |
| **Homologação** | https://homolog.roteirosdispensacao.com.br | Firebase Hosting (staging) | Cloud Run (staging) |

## 🔧 Passo 1: Configuração DNS no Registro.br

### 1.1. Acesse o Painel do Registro.br
1. Acesse https://registro.br
2. Faça login com suas credenciais
3. Navegue até "Meus Domínios"
4. Selecione `roteirosdispensacao.com.br`

### 1.2. Configure os Registros DNS

#### Para o Domínio Principal (Produção)

```dns
# Registros A para o domínio raiz
@    A    151.101.1.195
@    A    151.101.65.195

# CNAME para www
www  CNAME  3

# Registro TXT para verificação do Firebase
@    TXT    "firebase=roteirosdispensacao"
```

#### Para o Subdomínio de Homologação

```dns
# CNAME para homologação
homolog  CNAME  roteirosdispensacao-staging.web.app.
```

#### Para o Backend API

```dns
# CNAME para API de produção
api      CNAME  roteiro-dispensacao-api-<ID>.a.run.app.

# CNAME para API de homologação  
api-homolog  CNAME  roteiro-dispensacao-api-staging-<ID>.a.run.app.
```

### 1.3. Configuração de Email (Opcional)

```dns
# Registros MX para email
@    MX  10  mx1.zoho.com.
@    MX  20  mx2.zoho.com.
@    MX  30  mx3.zoho.com.

# SPF Record
@    TXT  "v=spf1 include:zoho.com ~all"
```

## 🚀 Passo 2: Configuração no Firebase Hosting

### 2.1. Instale o Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2.2. Configure o Domínio Customizado

```bash
# Entre no diretório do projeto
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

# Adicione o domínio customizado
firebase hosting:channel:deploy production --project roteiros-de-dispensacao
firebase hosting:sites:create roteirosdispensacao --project roteiros-de-dispensacao
```

### 2.3. Conecte o Domínio pelo Console

1. Acesse https://console.firebase.google.com
2. Selecione o projeto `roteiros-de-dispensacao`
3. Vá para **Hosting** → **Domínios personalizados**
4. Clique em **Adicionar domínio personalizado**
5. Digite `roteirosdispensacao.com.br`
6. Siga as instruções de verificação
7. Aguarde a emissão do certificado SSL (até 24h)

### 2.4. Configure o Ambiente de Homologação

```bash
# Crie um canal de preview para homologação
firebase hosting:channel:create homolog --expires 30d

# Deploy para homologação
firebase hosting:channel:deploy homolog --project roteiros-de-dispensacao
```

## ☁️ Passo 3: Configuração do Cloud Run (Backend)

### 3.1. Configure as Variáveis de Ambiente

```bash
# Para produção
gcloud run deploy roteiro-dispensacao-api \
  --image gcr.io/roteiros-de-dispensacao/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="ENVIRONMENT=production,ALLOWED_ORIGINS=https://roteirosdispensacao.com.br"

# Para homologação
gcloud run deploy roteiro-dispensacao-api-staging \
  --image gcr.io/roteiros-de-dispensacao/backend:staging \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="ENVIRONMENT=staging,ALLOWED_ORIGINS=https://homolog.roteirosdispensacao.com.br"
```

### 3.2. Configure o Mapeamento de Domínio

```bash
# Mapeie o domínio para produção
gcloud run domain-mappings create \
  --service roteiro-dispensacao-api \
  --domain api.roteirosdispensacao.com.br \
  --region us-central1

# Mapeie o domínio para homologação
gcloud run domain-mappings create \
  --service roteiro-dispensacao-api-staging \
  --domain api-homolog.roteirosdispensacao.com.br \
  --region us-central1
```

## 📝 Passo 4: Atualização das Configurações do Frontend

### 4.1. Atualize o arquivo `.env.production`

```env
# apps/frontend-nextjs/.env.production
NEXT_PUBLIC_API_URL=https://api.roteirosdispensacao.com.br
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SITE_URL=https://roteirosdispensacao.com.br
```

### 4.2. Atualize o arquivo `.env.staging`

```env
# apps/frontend-nextjs/.env.staging
NEXT_PUBLIC_API_URL=https://api-homolog.roteirosdispensacao.com.br
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SITE_URL=https://homolog.roteirosdispensacao.com.br
```

## 🔄 Passo 5: Deploy Automatizado

### 5.1. Script de Deploy para Produção

```bash
#!/bin/bash
# deploy-production.sh

echo "🚀 Iniciando deploy para PRODUÇÃO..."

# Build do frontend
cd apps/frontend-nextjs
npm run build

# Deploy no Firebase
cd ../..
firebase deploy --only hosting:roteirosdispensacao --project roteiros-de-dispensacao

# Deploy do backend
gcloud builds submit --tag gcr.io/roteiros-de-dispensacao/backend:latest apps/backend
gcloud run deploy roteiro-dispensacao-api --image gcr.io/roteiros-de-dispensacao/backend:latest

echo "✅ Deploy para produção concluído!"
```

### 5.2. Script de Deploy para Homologação

```bash
#!/bin/bash
# deploy-staging.sh

echo "🔄 Iniciando deploy para HOMOLOGAÇÃO..."

# Build do frontend com env staging
cd apps/frontend-nextjs
npm run build:staging

# Deploy no canal de homologação
cd ../..
firebase hosting:channel:deploy homolog --project roteiros-de-dispensacao

# Deploy do backend staging
gcloud builds submit --tag gcr.io/roteiros-de-dispensacao/backend:staging apps/backend
gcloud run deploy roteiro-dispensacao-api-staging --image gcr.io/roteiros-de-dispensacao/backend:staging

echo "✅ Deploy para homologação concluído!"
```

## ✅ Passo 6: Verificação e Testes

### 6.1. Teste de DNS

```bash
# Verifique a propagação do DNS
nslookup roteirosdispensacao.com.br
nslookup www.roteirosdispensacao.com.br
nslookup api.roteirosdispensacao.com.br
```

### 6.2. Teste de SSL

```bash
# Verifique o certificado SSL
openssl s_client -connect roteirosdispensacao.com.br:443 -servername roteirosdispensacao.com.br
```

### 6.3. Teste de Endpoints

```bash
# Teste o frontend
curl -I https://roteirosdispensacao.com.br

# Teste a API
curl https://api.roteirosdispensacao.com.br/api/health
```

## 🔒 Configurações de Segurança

### Headers de Segurança (já configurados no firebase.json)
- ✅ Strict-Transport-Security (HSTS)
- ✅ Content-Security-Policy (CSP)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy

### Monitoramento
- Configure alertas no Google Cloud Monitoring
- Ative o Cloud Logging para auditoria
- Configure backups automáticos

## 📊 Tempo Estimado de Propagação

| Etapa | Tempo |
|-------|-------|
| Propagação DNS | 0-48 horas |
| Verificação Firebase | 5-30 minutos |
| Emissão SSL | 0-24 horas |
| Cloud Run mapping | 5-15 minutos |

## 🆘 Resolução de Problemas

### DNS não propaga
- Verifique os TTL dos registros
- Limpe o cache DNS local: `ipconfig /flushdns`
- Use ferramentas como https://dnschecker.org

### Certificado SSL não emitido
- Verifique se os registros A estão corretos
- Confirme a verificação TXT do Firebase
- Aguarde até 24 horas

### API não responde
- Verifique logs no Cloud Run
- Confirme as variáveis de ambiente
- Teste com `gcloud run services describe`

## 📞 Suporte

- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Support**: https://cloud.google.com/support
- **Registro.br**: https://registro.br/ajuda/

---

**Última atualização**: 2025-08-14