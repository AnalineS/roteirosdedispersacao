# PROMPT PARA CLAUDE CODE - DEPLOY FULLSTACK NO GOOGLE CLOUD + FIREBASE

## CONTEXTO CRÍTICO
Existe uma aplicação fullstack completa no repositório (Backend Python Flask + Frontend React) que precisa ser deployada corretamente no Google Cloud + Firebase. O site atual em produção está servindo arquivos estáticos incorretos.

## ARQUITETURA DE DEPLOY NO GOOGLE CLOUD

### Stack do Repositório:
- **Backend**: Python Flask com IA (src/backend/)
- **Frontend**: React TypeScript (src/frontend/)
- **Requisitos**: Backend precisa rodar Python, Frontend pode ser estático após build

### Arquitetura Recomendada Google Cloud + Firebase:
```
┌─────────────────────┐     ┌──────────────────┐
│  Firebase Hosting   │────▶│  Cloud Run       │
│  (Frontend React)   │     │  (Backend Flask) │
└─────────────────────┘     └──────────────────┘
         │                           │
         ▼                           ▼
   [App React Build]          [API Python Flask]
   roteiros-de-*.web.app      api.roteiros-de-*.com
```

## PASSO A PASSO COMPLETO

### FASE 1: PREPARAR O BACKEND PARA CLOUD RUN

#### 1.1 Criar Dockerfile para o Backend
```dockerfile
# src/backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Variáveis de ambiente
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Expor porta
EXPOSE 8080

# Comando para iniciar
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
```

#### 1.2 Criar .dockerignore
```bash
# src/backend/.dockerignore
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.gitignore
.mypy_cache
.pytest_cache
.hypothesis
```

#### 1.3 Atualizar requirements.txt
```txt
# Adicionar ao requirements.txt existente
gunicorn==21.2.0
```

#### 1.4 Configurar CORS para o Frontend
```python
# src/backend/main.py
# Adicionar após imports
from flask_cors import CORS

# Após criar app
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
    "https://roteiros-de-dispensacao.web.app",
    "https://roteiros-de-dispensacao.firebaseapp.com"
])
```

### FASE 2: DEPLOY DO BACKEND NO CLOUD RUN

```bash
# 1. Instalar e configurar gcloud CLI
gcloud auth login
gcloud config set project seu-projeto-id

# 2. Habilitar APIs necessárias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 3. Navegar para o diretório do backend
cd src/backend

# 4. Build e deploy no Cloud Run
gcloud run deploy roteiro-dispensacao-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "FLASK_ENV=production" \
  --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10

# 5. Anotar a URL do serviço (será algo como)
# https://roteiro-dispensacao-api-xxxxx-uc.a.run.app
```

### FASE 3: PREPARAR O FRONTEND PARA FIREBASE HOSTING

#### 3.1 Configurar variáveis de ambiente
```bash
# src/frontend/.env.production
REACT_APP_API_URL=https://roteiro-dispensacao-api-xxxxx-uc.a.run.app
REACT_APP_ENVIRONMENT=production
```

#### 3.2 Atualizar configuração da API no Frontend
```typescript
// src/frontend/src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = {
  baseURL: API_BASE_URL,
  // ... resto da configuração
};
```

#### 3.3 Build do Frontend
```bash
cd src/frontend
npm install
npm run build
```

### FASE 4: CONFIGURAR FIREBASE PARA O FRONTEND

#### 4.1 Inicializar Firebase no projeto
```bash
# Na raiz do projeto
firebase init hosting

# Respostas para as perguntas:
# ? What do you want to use as your public directory? src/frontend/build
# ? Configure as a single-page app? Yes
# ? Set up automatic builds with GitHub? No (por enquanto)
```

#### 4.2 Configurar firebase.json
```json
{
  "hosting": {
    "public": "src/frontend/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  }
}
```

#### 4.3 Deploy do Frontend
```bash
# Fazer deploy
firebase deploy --only hosting

# Para preview antes do deploy final
firebase hosting:channel:deploy preview
```

### FASE 5: CONFIGURAR DOMÍNIO PERSONALIZADO - roteirosdedispensacao.com

#### 5.1 Estrutura de Domínios
```
Frontend (Firebase Hosting): roteirosdedispensacao.com (e www.roteirosdedispensacao.com)
Backend (Cloud Run): api.roteirosdedispensacao.com
```

#### 5.2 Configurar DNS no seu provedor de domínio
```
# Registros DNS necessários:

# Para o Frontend (Firebase Hosting)
Tipo: A
Nome: @
Valor: 151.101.1.195
TTL: 3600

Tipo: A  
Nome: @
Valor: 151.101.65.195
TTL: 3600

Tipo: CNAME
Nome: www
Valor: roteirosdedispensacao.com
TTL: 3600

# Para o Backend (Cloud Run)
Tipo: CNAME
Nome: api
Valor: ghs.googlehosted.com
TTL: 3600
```

#### 5.3 Configurar Frontend no Firebase
```bash
# No console Firebase ou via CLI
firebase hosting:sites:create roteirosdedispensacao

# Adicionar domínio personalizado
firebase hosting:channel:deploy live --site roteirosdedispensacao

# No console Firebase:
# 1. Vá para Hosting
# 2. Clique em "Adicionar domínio personalizado"
# 3. Digite: roteirosdedispensacao.com
# 4. Verifique a propriedade do domínio
# 5. Aguarde provisão do SSL (pode levar até 24h)
```

#### 5.4 Configurar Backend no Cloud Run
```bash
# Mapear domínio para o serviço Cloud Run
gcloud run domain-mappings create \
  --service=roteiro-dispensacao-api \
  --domain=api.roteirosdedispensacao.com \
  --region=us-central1

# Verificar status do mapeamento
gcloud run domain-mappings list \
  --region=us-central1
```

#### 5.5 Atualizar variáveis de ambiente
```bash
# src/frontend/.env.production
REACT_APP_API_URL=https://api.roteirosdedispensacao.com
REACT_APP_ENVIRONMENT=production

# Rebuild do frontend com nova URL
cd src/frontend
npm run build

# Redeploy no Firebase
firebase deploy --only hosting
```

#### 5.6 Atualizar CORS no Backend
```python
# src/backend/main.py
CORS(app, origins=[
    "http://localhost:3000",
    "https://roteirosdedispensacao.com",
    "https://www.roteirosdedispensacao.com",
    "https://roteiros-de-dispensacao.web.app",  # manter para fallback
    "https://roteiros-de-dispensacao.firebaseapp.com"
])

# Redeploy no Cloud Run após mudança
cd src/backend
gcloud run deploy roteiro-dispensacao-api --source .

### FASE 6: MONITORAMENTO E LOGS

#### 6.1 Cloud Run (Backend)
```bash
# Ver logs do backend
gcloud run services logs read roteiro-dispensacao-api

# Monitorar métricas
# Acessar: https://console.cloud.google.com/run
```

#### 6.2 Firebase (Frontend)
```bash
# Ver uso do hosting
firebase hosting:usage

# Analytics no console Firebase
```

### FASE 7: CI/CD AUTOMATIZADO

#### 7.1 GitHub Actions para Deploy Automático
```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Cloud

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      - name: 'Deploy to Cloud Run'
        run: |
          cd src/backend
          gcloud run deploy roteiro-dispensacao-api \
            --source . \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build Frontend
        run: |
          cd src/frontend
          npm ci
          npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: seu-projeto-id
```

### FASE 8: TESTES PÓS-DEPLOY

#### 8.1 Verificar Backend
```bash
# Testar health check com domínio customizado
curl https://api.roteirosdedispensacao.com/api/health

# Deve retornar:
{
  "status": "healthy",
  "personas": ["Dr. Gasnelio", "Gá"],
  "version": "1.0.0"
}
```

#### 8.2 Verificar Frontend
```bash
# Acessar https://roteirosdedispensacao.com
# Deve mostrar:
# - Interface React moderna
# - Chat com IA funcionando
# - Duas personas disponíveis

# Verificar também www
# https://www.roteirosdedispensacao.com deve redirecionar corretamente
```

#### 8.3 Verificar SSL/HTTPS
```bash
# Testar certificado SSL
openssl s_client -connect roteirosdedispensacao.com:443 -servername roteirosdedispensacao.com

# Verificar redirecionamento HTTP -> HTTPS
curl -I http://roteirosdedispensacao.com
# Deve retornar 301 ou 302 para https://
```

### FASE 9: TROUBLESHOOTING

#### Problemas Comuns:

1. **CORS Error**
   - Verificar origens permitidas no backend
   - Confirmar URL do frontend nas configurações CORS

2. **502 Bad Gateway**
   - Verificar logs do Cloud Run
   - Aumentar memória/CPU se necessário

3. **Build Failed**
   - Verificar requirements.txt
   - Confirmar versão do Python

4. **API não conecta**
   - Verificar variável REACT_APP_API_URL
   - Confirmar que o backend está rodando

### FASE 10: OTIMIZAÇÕES FINAIS

```bash
# 1. Configurar CDN para assets estáticos
firebase hosting:channel:deploy cdn --expires 1y

# 2. Ativar cache no Cloud Run
gcloud run services update roteiro-dispensacao-api \
  --add-cloudsql-instances=INSTANCE_CONNECTION_NAME \
  --cpu-throttling \
  --min-instances=1

# 3. Configurar alertas
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="API Error Rate"
```

## CONFIGURAÇÃO ADICIONAL: REDIRECIONAMENTOS E SEO

### Configurar redirects no Firebase
```json
// firebase.json - adicionar na seção hosting
{
  "hosting": {
    "public": "src/frontend/build",
    "redirects": [
      {
        "source": "/",
        "destination": "https://roteirosdedispensacao.com",
        "type": 301
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Robots-Tag",
            "value": "index, follow"
          }
        ]
      }
    ]
  }
}
```

### Atualizar meta tags para SEO
```html
<!-- src/frontend/public/index.html -->
<meta property="og:url" content="https://roteirosdedispensacao.com" />
<link rel="canonical" href="https://roteirosdedispensacao.com" />
```

### Criar robots.txt
```txt
# src/frontend/public/robots.txt
User-agent: *
Allow: /
Sitemap: https://roteirosdedispensacao.com/sitemap.xml

# API should not be crawled
User-agent: *
Disallow: https://api.roteirosdedispensacao.com/
```

Após completar todos os passos:

1. **Backend Flask** rodando no Cloud Run com:
   - API REST funcional
   - Processamento com IA
   - Escalabilidade automática

2. **Frontend React** no Firebase Hosting com:
   - Interface moderna e responsiva
   - PWA funcional
   - Chat com duas personas

3. **Integração** completa:
   - Frontend se comunica com backend
   - Zero erros no console
   - Performance otimizada

## COMANDOS RÁPIDOS DE VERIFICAÇÃO

```bash
# Status do backend
gcloud run services describe roteiro-dispensacao-api

# Status do frontend  
firebase hosting:sites:list

# Logs em tempo real
gcloud run services logs tail roteiro-dispensacao-api

# Métricas
gcloud monitoring dashboards list
```

---

**IMPORTANTE**: Este processo mantém a aplicação fullstack completa, apenas mudando a infraestrutura de Render para Google Cloud + Firebase, aproveitando o melhor de cada plataforma.