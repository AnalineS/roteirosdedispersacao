# 🚀 Instruções de Deploy no Vercel - Passo a Passo

## ✅ **PASSO 1: Conectar Repositório GitHub ao Vercel**

### 1.1 Preparar Repositório GitHub
```bash
# Garantir que todos os arquivos estão commitados
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"
git add .
git commit -m "Migração completa para Vercel - arquitetura serverless"
git push origin main
```

### 1.2 Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**
4. Selecione o repositório: **siteroteirodedispersacao**
5. Clique em **"Import"**

### 1.3 Configurações de Build
```json
Framework Preset: Other
Build Command: echo "Build completed"
Output Directory: public
Install Command: pip install -r requirements.txt
Root Directory: ./
```

---

## ⚙️ **PASSO 2: Configurar Variáveis de Ambiente**

### 2.1 Acessar Settings
1. No dashboard do projeto → **Settings** → **Environment Variables**

### 2.2 Adicionar Variáveis OBRIGATÓRIAS
```bash
# APIs Essenciais
OPENROUTER_API_KEY=your_openrouter_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here

# Sistema
MONITORING_ENABLED=true
CACHE_ENABLED=true
RATE_LIMITING_ENABLED=true
VERCEL_ENV=production

# CORS
CORS_ORIGINS=https://your-project.vercel.app
```

### 2.3 Variáveis Opcionais (Astra DB)
```bash
ASTRA_DB_TOKEN=your_token
ASTRA_DB_ENDPOINT=your_endpoint
ASTRA_DB_KEYSPACE=roteiro_dispensacao_bot
ASTRA_DB_COLLECTION_NAME=hanseniase_knowledge_base
```

### 2.4 Configurar por Ambiente
- **Production**: Apenas variáveis de produção
- **Preview**: Mesmas variáveis para testes
- **Development**: Variáveis de desenvolvimento local

---

## 🚀 **PASSO 3: Deploy Inicial**

### 3.1 Trigger Deploy
1. No dashboard → **Deployments**
2. Clique **"Redeploy"** ou faça novo commit
3. Aguardar build e deploy (2-5 minutos)

### 3.2 Verificar Build Logs
```bash
# Logs esperados:
✅ Installing dependencies...
✅ pip install -r requirements.txt
✅ Build completed
✅ Serverless Function created: api/main.py
✅ Static files deployed to Edge Network
```

### 3.3 Obter URL de Produção
- URL será: `https://your-project-name.vercel.app`
- Configure CORS_ORIGINS com esta URL

---

## 🧪 **PASSO 4: Testar Funcionalidades em Produção**

### 4.1 Health Check
```bash
curl https://your-project.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "platform": "vercel",
  "version": "9.0.0",
  "knowledge_base_loaded": true,
  "personas": ["dr_gasnelio", "ga"]
}
```

### 4.2 Test Chat API
```bash
curl -X POST https://your-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é hanseníase?",
    "personality_id": "dr_gasnelio"
  }'
```

### 4.3 Test Personas
```bash
curl https://your-project.vercel.app/api/personas
```

### 4.4 Verificar Landing Page
- Acessar: `https://your-project.vercel.app`
- Verificar health check automático
- Testar links para APIs

---

## 📊 **PASSO 5: Validar Analytics e Monitoramento**

### 5.1 Vercel Analytics
1. Dashboard → **Analytics**
2. Verificar métricas:
   - **Page Views**
   - **Unique Visitors** 
   - **Top Pages**
   - **Top Referrers**

### 5.2 Function Metrics
1. Dashboard → **Functions**
2. Verificar:
   - **Invocations**
   - **Duration** (meta: <1000ms)
   - **Errors** (meta: <1%)
   - **Cold Starts**

### 5.3 Web Vitals
1. Dashboard → **Speed Insights**
2. Verificar:
   - **LCP** (Largest Contentful Paint)
   - **FID** (First Input Delay)
   - **CLS** (Cumulative Layout Shift)

---

## 🚨 **Troubleshooting Comum**

### Build Errors
```bash
# Error: requirements.txt not found
# Solução: Verificar arquivo na raiz do projeto

# Error: Python version mismatch  
# Solução: runtime: python3.11 no vercel.json

# Error: Module not found
# Solução: Verificar imports relativos em api/main.py
```

### Runtime Errors
```bash
# Error: 500 Internal Server Error
# Solução: Verificar logs da Function no dashboard

# Error: Environment variables not found
# Solução: Configurar variáveis no painel Vercel

# Error: CORS blocked
# Solução: Atualizar CORS_ORIGINS com URL correta
```

### Performance Issues
```bash
# Cold Start > 5s
# Solução: Reduzir imports em api/main.py

# Memory limit exceeded
# Solução: Aumentar memory limit no vercel.json

# Timeout
# Solução: Aumentar maxDuration no vercel.json
```

---

## ✅ **Checklist de Validação**

### Funcionalidades Básicas
- [ ] Health check responde 200
- [ ] Chat API aceita requisições
- [ ] Personas carregam corretamente
- [ ] Landing page exibe sem erros
- [ ] Rate limiting funciona

### Performance
- [ ] Response time < 1000ms (cold start)
- [ ] Response time < 100ms (warm)
- [ ] Bundle size otimizado
- [ ] Cache headers configurados

### Segurança
- [ ] HTTPS automático ativo
- [ ] Headers de segurança presentes
- [ ] CORS configurado corretamente
- [ ] Environment variables seguras

### Monitoramento
- [ ] Analytics coletando dados
- [ ] Function metrics disponíveis
- [ ] Error tracking ativo
- [ ] Web Vitals sendo medidos

---

## 🎯 **Métricas de Sucesso**

### Performance
- **Cold Start**: < 1000ms
- **Warm Start**: < 100ms
- **Memory Usage**: < 256MB
- **Bundle Size**: < 50MB

### Reliability
- **Uptime**: > 99.9%
- **Error Rate**: < 1%
- **Success Rate**: > 99%

### User Experience
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

---

## 📞 **Suporte**

- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Status**: [vercel-status.com](https://vercel-status.com)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)