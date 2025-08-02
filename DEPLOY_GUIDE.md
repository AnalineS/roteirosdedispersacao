# 🚀 Guia de Deploy - Google Cloud + Firebase

## 📋 **Resumo da Migração**

Este documento descreve como fazer o deploy completo da aplicação **Roteiro de Dispensação** usando Google Cloud Run para o backend e Firebase Hosting para o frontend.

## 🏗️ **Arquitetura Implementada**

```
┌─────────────────────┐     ┌──────────────────┐
│  Firebase Hosting   │────▶│  Cloud Run       │
│  (Frontend React)   │     │  (Backend Flask) │
└─────────────────────┘     └──────────────────┘
         │                           │
         ▼                           ▼
roteiros-de-dispensacao.web.app  [URL_DO_CLOUD_RUN]
```

## ✅ **Status Atual**

### **Concluído:**
- ✅ Backend preparado para Cloud Run
- ✅ Frontend configurado para múltiplos backends
- ✅ Firebase Hosting atualizado
- ✅ CORS configurado
- ✅ Build otimizado
- ✅ Deploy do backend no Cloud Run
- ✅ Frontend atualizado com URL do Cloud Run

### **Pendente:**
- ⏳ Configuração de domínio personalizado
- ⏳ Testes de integração completa

## 🔧 **Arquivos Criados/Modificados**

### **Backend (src/backend/)**
- `Dockerfile` - Container otimizado para Cloud Run
- `.dockerignore` - Exclusões para build eficiente
- `main.py` - CORS configurado para Firebase + Cloud Run
- `requirements.txt` - Adicionado gunicorn para produção

### **Frontend (src/frontend/)**
- `.env.production` - Variáveis de ambiente para produção
- `src/services/api.ts` - API configurada para múltiplos backends
- `firebase.json` - Headers e CSP atualizados

### **Scripts de Automação**
- `scripts/install-gcloud.ps1` - Instalação do Google Cloud CLI
- `scripts/setup-gcloud.bat` - Configuração e comandos de deploy

## 🚀 **Como Fazer Deploy**

### **Pré-requisitos:**
1. **Google Cloud CLI instalado**
   ```bash
   # Windows
   .\scripts\install-gcloud.ps1
   
   # Ou baixar de: https://cloud.google.com/sdk/docs/install
   ```

2. **Projeto Google Cloud configurado**
   ```bash
   gcloud auth login
   gcloud config set project SEU_PROJECT_ID
   ```

3. **APIs habilitadas**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

### **Deploy do Backend:**

1. **Navegar para o diretório do backend**
   ```bash
   cd src/backend
   ```

2. **Deploy no Cloud Run**
   ```bash
   gcloud run deploy roteiro-dispensacao-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "FLASK_ENV=production" \
     --set-env-vars "OPENROUTER_API_KEY=SUA_CHAVE" \
     --set-env-vars "HUGGINGFACE_API_KEY=SUA_CHAVE" \
     --memory 512Mi \
     --cpu 1 \
     --timeout 300 \
     --max-instances 10
   ```

3. **Anotar a URL do serviço**
   ```
   https://roteiro-dispensacao-api-xxxxx-uc.a.run.app
   ```

### **Atualizar Frontend:**

1. **Editar variáveis de ambiente**
   ```bash
   # src/frontend/.env.production
   VITE_API_URL=https://roteiro-dispensacao-api-xxxxx-uc.a.run.app
   ```

2. **Rebuild e redeploy**
   ```bash
   cd src/frontend
   npm run build
   firebase deploy --only hosting
   ```

## 🌐 **Configuração de Domínio Personalizado**

### **DNS (no seu provedor de domínio):**
```
# Frontend (Firebase Hosting)
Tipo: A
Nome: @
Valor: 151.101.1.195

Tipo: CNAME
Nome: www
Valor: roteirosdedispensacao.com

# Backend (Cloud Run)
Tipo: CNAME
Nome: api
Valor: ghs.googlehosted.com
```

### **Firebase Hosting:**
```bash
firebase hosting:sites:create roteirosdedispensacao
# Adicionar domínio no console Firebase
```

### **Cloud Run:**
```bash
gcloud run domain-mappings create \
  --service=roteiro-dispensacao-api \
  --domain=api.roteirosdedispensacao.com \
  --region=us-central1
```

## 🔍 **Testes Pós-Deploy**

### **Backend:**
```bash
# Health check
curl https://roteiro-dispensacao-api-xxxxx-uc.a.run.app/api/health

# Deve retornar:
{
  "status": "healthy",
  "personas": ["Dr. Gasnelio", "Gá"],
  "version": "9.0.0"
}
```

### **Frontend:**
- Acessar: https://roteiros-de-dispensacao.web.app
- Verificar chat funcionando
- Testar seleção de personas
- Confirmar componentes educacionais

## 📊 **Monitoramento**

### **Cloud Run (Backend):**
```bash
# Logs
gcloud run services logs read roteiro-dispensacao-api

# Métricas
# Acessar: https://console.cloud.google.com/run
```

### **Firebase (Frontend):**
```bash
# Uso
firebase hosting:usage

# Analytics no console Firebase
```

## 🛠️ **Troubleshooting**

### **Problemas Comuns:**

1. **CORS Error**
   - Verificar `allowed_origins` em `main.py`
   - Confirmar URL do frontend nas configurações

2. **502 Bad Gateway**
   - Verificar logs do Cloud Run
   - Aumentar memória/CPU se necessário

3. **Build Failed**
   - Verificar `requirements.txt`
   - Confirmar versão do Python

4. **API não conecta**
   - Verificar `VITE_API_URL` em `.env.production`
   - Confirmar backend está rodando

## 🔄 **CI/CD Futuro**

Para automação completa, implementar GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Cloud

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    # Deploy Cloud Run
  
  deploy-frontend:
    # Deploy Firebase
```

## 💡 **Otimizações**

1. **CDN para assets estáticos**
2. **Cache no Cloud Run**
3. **Alertas de monitoramento**
4. **Backup automático**

## 📞 **Suporte**

Em caso de problemas:
1. Verificar logs nos respectivos serviços
2. Consultar documentação oficial do Google Cloud
3. Revisar configurações de CORS e CSP

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Deploy completo - Frontend + Backend funcionando