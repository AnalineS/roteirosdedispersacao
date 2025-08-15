# 🔧 CORREÇÃO: Failed to Fetch no Google Cloud Run

## 🎯 Problema Identificado

O frontend não consegue conectar ao backend no Cloud Run porque:
1. A URL do backend não está configurada corretamente
2. O frontend está tentando conectar em `localhost:5000`
3. As variáveis de ambiente no GitHub Actions não estão passando a URL correta

## ✅ SOLUÇÃO DEFINITIVA PARA CLOUD RUN

### 1️⃣ Verificar URL do Backend no Cloud Run

Execute este comando para obter a URL atual:

```bash
gcloud run services describe roteiro-dispensacao-api \
  --region=us-central1 \
  --format="value(status.url)"
```

A URL deve ser algo como:
```
https://roteiro-dispensacao-api-xxxxx-uc.a.run.app
```

### 2️⃣ Atualizar GitHub Actions

Edite `.github/workflows/deploy.yml` para passar a URL do backend para o frontend:

```yaml
# Na seção de deploy do backend, capture a URL:
- name: Build and deploy backend to Cloud Run
  id: deploy-backend
  run: |
    # ... código existente ...
    URL=$(gcloud run deploy roteiro-dispensacao-api \
      --format="value(status.url)")
    echo "backend-url=$URL" >> $GITHUB_OUTPUT

# Na seção de build do frontend, use a URL:
- name: Build frontend
  env:
    NEXT_PUBLIC_API_URL: ${{ steps.deploy-backend.outputs.backend-url }}
  run: |
    cd apps/frontend-nextjs
    npm run build
```

### 3️⃣ Corrigir Configuração CORS no Backend

Edite `apps/backend/main.py`:

```python
def setup_cors(app):
    """Configurar CORS para Cloud Run"""
    
    # Obter a URL do Cloud Run dinamicamente
    import os
    
    allowed_origins = [
        "https://roteiros-de-dispensacao.web.app",
        "https://roteiros-de-dispensacao.firebaseapp.com",
        "https://roteirosdedispensacao.com",
        "https://www.roteirosdedispensacao.com",
        "http://localhost:3000",  # Dev
        "http://127.0.0.1:3000"   # Dev
    ]
    
    # Se estiver no Cloud Run, adicionar origem dinâmica
    if os.environ.get('K_SERVICE'):
        cloud_run_url = os.environ.get('CLOUD_RUN_SERVICE_URL')
        if cloud_run_url:
            allowed_origins.append(cloud_run_url)
    
    CORS(app, 
         origins=allowed_origins,
         methods=['GET', 'POST', 'OPTIONS', 'HEAD'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         supports_credentials=False,
         max_age=86400)
```

### 4️⃣ Configurar Frontend para Cloud Run

Crie `apps/frontend-nextjs/.env.production`:

```env
# URL do Backend no Cloud Run (será substituída no build)
NEXT_PUBLIC_API_URL=https://roteiro-dispensacao-api-xxxxx-uc.a.run.app

# Outras configs
NEXT_PUBLIC_ENVIRONMENT=production
```

Atualize `apps/frontend-nextjs/src/services/api.ts`:

```typescript
// Use a variável de ambiente ou fallback inteligente
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (() => {
  if (typeof window !== 'undefined') {
    // Em produção, sempre usar HTTPS
    if (window.location.protocol === 'https:') {
      // URL do Cloud Run - ATUALIZE COM SUA URL REAL
      return 'https://roteiro-dispensacao-api-xxxxx-uc.a.run.app';
    }
  }
  return 'http://localhost:8080';
})();
```

### 5️⃣ Configurar Firebase Hosting

Atualize `firebase.json` para proxy requests ao Cloud Run:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "roteiro-dispensacao-api",
          "region": "us-central1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 6️⃣ Teste Local com Cloud Run

Para testar localmente com o backend no Cloud Run:

```bash
# 1. Obter a URL do Cloud Run
BACKEND_URL=$(gcloud run services describe roteiro-dispensacao-api \
  --region=us-central1 \
  --format="value(status.url)")

# 2. Exportar para o frontend
export NEXT_PUBLIC_API_URL=$BACKEND_URL

# 3. Rodar o frontend
cd apps/frontend-nextjs
npm run dev

# 4. Testar
curl $BACKEND_URL/api/v1/health
```

## 🚀 DEPLOY CORRETO

### Comando Completo para Deploy:

```bash
# 1. Deploy Backend primeiro
gcloud run deploy roteiro-dispensacao-api \
  --source apps/backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FLASK_ENV=production,OPENROUTER_API_KEY=$OPENROUTER_API_KEY,HUGGINGFACE_API_KEY=$HUGGINGFACE_API_KEY"

# 2. Capturar URL do backend
BACKEND_URL=$(gcloud run services describe roteiro-dispensacao-api \
  --region=us-central1 \
  --format="value(status.url)")

# 3. Build Frontend com a URL correta
cd apps/frontend-nextjs
NEXT_PUBLIC_API_URL=$BACKEND_URL npm run build

# 4. Deploy Frontend
firebase deploy --only hosting
```

## 🔍 DEBUGGING

### Verificar se o Backend está funcionando:

```bash
# Teste direto
curl https://roteiro-dispensacao-api-xxxxx-uc.a.run.app/api/v1/health

# Ver logs
gcloud run logs read roteiro-dispensacao-api --limit=50
```

### Verificar CORS no Browser:

Abra o Console do navegador (F12) e execute:
```javascript
fetch('https://roteiro-dispensacao-api-xxxxx-uc.a.run.app/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Verificar Variáveis de Ambiente:

```bash
# No Cloud Run
gcloud run services describe roteiro-dispensacao-api \
  --region=us-central1 \
  --format="export" | grep -E "(FLASK_ENV|CORS)"
```

## ⚡ SOLUÇÃO RÁPIDA

Se quiser resolver AGORA, execute estes comandos:

```bash
# 1. Obter URL atual do Cloud Run
BACKEND_URL=$(gcloud run services describe roteiro-dispensacao-api \
  --region=us-central1 \
  --format="value(status.url)")

echo "Backend URL: $BACKEND_URL"

# 2. Atualizar frontend com a URL correta
cd apps/frontend-nextjs
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.production.local

# 3. Rebuild e deploy
npm run build
firebase deploy --only hosting

# 4. Testar
echo "Teste: $BACKEND_URL/api/v1/health"
curl "$BACKEND_URL/api/v1/health"
```

## 🎯 RESULTADO ESPERADO

Após essas correções:
1. ✅ Backend responde em: `https://roteiro-dispensacao-api-xxxxx-uc.a.run.app`
2. ✅ Frontend conecta corretamente ao backend
3. ✅ CORS permite requisições do seu domínio
4. ✅ "Failed to fetch" resolvido

## 💡 DICA IMPORTANTE

O Cloud Run gera URLs dinâmicas. Sempre use variáveis de ambiente para configurar a URL do backend, nunca hardcode!

No GitHub Actions, adicione o secret:
```
CLOUD_RUN_SERVICE_URL=https://roteiro-dispensacao-api-xxxxx-uc.a.run.app
```

Então use no workflow:
```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.CLOUD_RUN_SERVICE_URL }}
```