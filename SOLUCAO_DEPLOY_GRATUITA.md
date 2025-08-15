# 🚀 SOLUÇÃO DEFINITIVA - DEPLOY GRATUITO PARA PESQUISA ACADÊMICA

## 🎯 Diagnóstico do Problema

O erro "Failed to fetch" ocorre porque:
1. Frontend está buscando API em `http://127.0.0.1:5000` (localhost)
2. Backend está no Cloud Run mas não está acessível
3. CORS pode estar bloqueando requisições
4. Variáveis de ambiente não estão configuradas corretamente

## 💡 SOLUÇÕES GRATUITAS/BAIXO CUSTO

### **OPÇÃO 1: Render.com (RECOMENDADO - 100% GRATUITO)**

#### Por que Render?
- ✅ **GRÁTIS** para projetos acadêmicos
- ✅ Suporta Python Flask backend
- ✅ Deploy automático do GitHub
- ✅ HTTPS gratuito
- ✅ Sem cartão de crédito necessário
- ✅ 750 horas/mês grátis

#### Implementação Imediata:

##### 1. Backend no Render (GRATUITO)

**a) Criar arquivo `render.yaml` na raiz:**
```yaml
services:
  - type: web
    name: roteiro-dispensacao-api
    env: python
    buildCommand: "cd apps/backend && pip install -r requirements_production.txt"
    startCommand: "cd apps/backend && gunicorn main:app --bind 0.0.0.0:$PORT"
    envVars:
      - key: FLASK_ENV
        value: production
      - key: OPENROUTER_API_KEY
        sync: false  # Adicionar manualmente
      - key: HUGGINGFACE_API_KEY
        sync: false  # Adicionar manualmente
    plan: free  # PLANO GRATUITO!
```

**b) Deploy:**
1. Acesse [render.com](https://render.com)
2. Conecte seu GitHub
3. Selecione o repositório
4. Render detecta automaticamente o `render.yaml`
5. Adicione as API keys nas configurações
6. Deploy automático!

##### 2. Frontend no Vercel (GRATUITO)

**a) Criar `vercel.json`:**
```json
{
  "buildCommand": "cd apps/frontend-nextjs && npm install && npm run build",
  "outputDirectory": "apps/frontend-nextjs/out",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@backend_url"
  }
}
```

**b) Deploy:**
1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel --prod`
3. Configure a variável com URL do Render

---

### **OPÇÃO 2: Railway.app (GRATUITO COM LIMITES)**

#### Por que Railway?
- ✅ $5 créditos grátis/mês
- ✅ Deploy com um clique
- ✅ Suporta Docker
- ✅ PostgreSQL gratuito incluído

#### Arquivo `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd apps/backend && python main.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### **OPÇÃO 3: Fly.io (GRATUITO - MAIS TÉCNICO)**

#### Por que Fly.io?
- ✅ 3 VMs grátis (256MB RAM cada)
- ✅ Deploy global (baixa latência)
- ✅ Ideal para APIs Python

#### Arquivo `fly.toml`:
```toml
app = "roteiro-dispensacao"
primary_region = "gru"  # São Paulo

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  FLASK_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

---

### **OPÇÃO 4: Solução Kubernetes GRATUITA (MicroK8s Local)**

Para desenvolvimento/teste local sem custos:

#### Arquivo `k8s-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: roteiro-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: roteiro-api
  template:
    metadata:
      labels:
        app: roteiro-api
    spec:
      containers:
      - name: api
        image: roteiro-dispensacao:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: "256Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: roteiro-api-service
spec:
  type: NodePort
  ports:
  - port: 8080
    targetPort: 8080
    nodePort: 30080
  selector:
    app: roteiro-api
```

---

## 🔧 CORREÇÃO IMEDIATA DO PROBLEMA ATUAL

### 1. Atualizar Frontend (`api.ts`):
```typescript
// Detectar ambiente automaticamente
const getApiUrl = () => {
  // Produção
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://roteiro-dispensacao-api.onrender.com'; // URL do Render
  }
  // Desenvolvimento
  return 'http://localhost:8080';
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getApiUrl();
```

### 2. Configurar CORS no Backend (`main.py`):
```python
from flask_cors import CORS

# Configuração específica para produção
CORS(app, 
     origins=[
         "https://roteirosdedispensacao.com",
         "https://roteiros-de-dispensacao.web.app",
         "https://roteiro-dispensacao.vercel.app",
         "http://localhost:3000"  # Desenvolvimento
     ],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])
```

### 3. Arquivo `.env.production` para Next.js:
```env
# URL do backend no Render.com (GRATUITO)
NEXT_PUBLIC_API_URL=https://roteiro-dispensacao-api.onrender.com

# Firebase (opcional)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=roteiro-dispensacao
```

---

## 📊 COMPARAÇÃO DE CUSTOS

| Plataforma | Backend | Frontend | BD | Total/mês |
|------------|---------|----------|-----|-----------|
| **Render + Vercel** | GRÁTIS | GRÁTIS | - | **$0** |
| **Railway** | $5 crédito | GRÁTIS | GRÁTIS | **$0-5** |
| **Fly.io** | GRÁTIS (3 VMs) | - | - | **$0** |
| **MicroK8s** | Local | Local | Local | **$0** |
| Google Cloud Run | ~$10-20 | - | - | $10-20 |

---

## 🚀 IMPLEMENTAÇÃO RÁPIDA (15 MINUTOS)

### Passo 1: Deploy Backend no Render
```bash
# 1. Criar conta em render.com
# 2. Conectar GitHub
# 3. Criar Web Service
# 4. Escolher repositório
# 5. Configurar:
#    - Build: cd apps/backend && pip install -r requirements_production.txt
#    - Start: cd apps/backend && gunicorn main:app
#    - Adicionar environment variables
```

### Passo 2: Deploy Frontend no Vercel
```bash
# Instalar CLI
npm i -g vercel

# Deploy
cd apps/frontend-nextjs
vercel --prod

# Configurar variável NEXT_PUBLIC_API_URL no dashboard
```

### Passo 3: Testar
```bash
# Backend
curl https://seu-app.onrender.com/api/v1/health

# Frontend
# Acessar: https://seu-app.vercel.app
```

---

## 🎓 BENEFÍCIOS PARA PESQUISA ACADÊMICA

1. **Custo Zero**: Ideal para teses e dissertações
2. **Escalabilidade**: Cresce conforme necessidade
3. **Profissional**: URLs customizadas disponíveis
4. **Confiável**: 99.9% uptime garantido
5. **Educacional**: Muitas plataformas têm descontos acadêmicos

---

## 🆘 SUPORTE EMERGENCIAL

Se nada funcionar, solução ULTRA-SIMPLES:

### Backend em Python Anywhere (GRATUITO):
```python
# pythonanywhere.com
# 1. Criar conta gratuita
# 2. Upload do código
# 3. Configurar Flask app
# URL: usuario.pythonanywhere.com
```

### Frontend em GitHub Pages (GRATUITO):
```bash
# Build estático
npm run build
npm run export

# Deploy
gh-pages -d out
# URL: usuario.github.io/projeto
```

---

## ✅ PRÓXIMOS PASSOS

1. **Escolha uma opção** (Recomendo Render + Vercel)
2. **Crie as contas** (gratuitas, sem cartão)
3. **Configure as variáveis** de ambiente
4. **Deploy** (15 minutos)
5. **Teste** e comemore! 🎉

---

## 📞 PRECISA DE AJUDA?

Esta solução é 100% gratuita e adequada para:
- Pesquisa acadêmica
- Projetos de doutorado
- Aplicações educacionais
- ONGs e projetos sociais

**Lembre-se**: O fundo social da sua pesquisa sobre hanseníase merece uma infraestrutura confiável e acessível!