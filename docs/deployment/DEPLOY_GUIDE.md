# [ATUALIZADO] Guia de Deploy - Google Cloud Run Full Stack

## [LIST] **Arquitetura Atual 2025**

Este documento descreve como fazer o deploy completo da aplicação **Roteiro de Dispensação** usando Google Cloud Run para AMBOS frontend (Next.js) e backend (Flask).

**IMPORTANTE**: Não usamos mais Firebase Hosting. Toda a aplicação roda em Google Cloud Run.

## 🏗️ **Arquitetura Implementada**

```
┌───────────────────────┐     ┌───────────────────────┐
│   Cloud Run Frontend   │────▶│   Cloud Run Backend   │
│   (Next.js 14)        │     │   (Flask 3.1)        │
└───────────────────────┘     └───────────────────────┘
         │                                 │
         ▼                                 ▼
frontend-url.run.app              backend-url.run.app
         │                                 │
         └─────────┌──────────────────────┘
                   │ roteirosdedispensacao.com │
                   └───────────────────────┘
```

## [OK] **Status Atual**

### **Concluído:**
- [OK] Backend Flask 3.1 no Cloud Run
- [OK] Frontend Next.js 14 no Cloud Run
- [OK] SQLite + Google Cloud Storage
- [OK] Supabase PostgreSQL com pgvector
- [OK] JWT Authentication próprio
- [OK] Sistema de cache híbrido
- [OK] 15 tipos de testes funcionando
- [OK] CI/CD via GitHub Actions

### **Pendente:**
- ⏳ Configuração de domínio personalizado
- ⏳ Testes de integração completa

## [FIX] **Arquivos Criados/Modificados**

### **Backend (apps/backend/)**
- `Dockerfile.production` - Container otimizado para Cloud Run
- `requirements.txt` - Dependências com security updates
- `app_config.py` - Configuração centralizada via env vars
- `services/storage/sqlite_manager.py` - Storage híbrido
- `services/integrations/supabase_vector_store.py` - RAG system

### **Frontend (apps/frontend-nextjs/)**
- `next.config.js` - Output standalone para Cloud Run
- `Dockerfile` - Container Next.js otimizado
- `src/services/api.ts` - API client com retry logic
- `tests/` - 15 tipos de testes implementados

### **Scripts de Automação**
- `scripts/install-gcloud.ps1` - Instalação do Google Cloud CLI
- `scripts/setup-gcloud.bat` - Configuração e comandos de deploy

## [START] **Como Fazer Deploy**

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

### **Deploy do Backend (Flask):**

1. **Navegar para o diretório do backend**
   ```bash
   cd apps/backend
   ```

2. **Deploy no Cloud Run**
   ```bash
   gcloud run deploy roteiro-dispensacao-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080 \
     --set-env-vars "SECRET_KEY=sua-secret-key" \
     --set-env-vars "OPENROUTER_API_KEY=sua-chave" \
     --set-env-vars "SUPABASE_URL=https://seu-projeto.supabase.co" \
     --set-env-vars "SUPABASE_SERVICE_KEY=sua-service-key" \
     --set-env-vars "CLOUD_STORAGE_BUCKET=seu-bucket" \
     --memory 1Gi \
     --cpu 1 \
     --timeout 300 \
     --max-instances 50
   ```

### **Deploy do Frontend (Next.js):**

1. **Navegar para o diretório do frontend**
   ```bash
   cd apps/frontend-nextjs
   ```

2. **Deploy no Cloud Run**
   ```bash
   gcloud run deploy roteiro-dispensacao-frontend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars "NEXT_PUBLIC_API_URL=https://backend-url.run.app" \
     --memory 512Mi \
     --cpu 1 \
     --timeout 300 \
     --max-instances 100
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

## [SEARCH] **Testes Pós-Deploy**

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

## [REPORT] **Monitoramento**

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
**Status:** [OK] Deploy completo - Frontend + Backend funcionando