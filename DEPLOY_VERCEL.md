# 🚀 Guia de Deploy no Vercel

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **Vercel CLI** (opcional): `npm install -g vercel`
3. **Variáveis de ambiente** configuradas

## 🔧 Configuração das Variáveis de Ambiente

No painel do Vercel, configure as seguintes variáveis:

### Obrigatórias:
```
OPENROUTER_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
```

### Opcionais (Astra DB):
```
ASTRA_DB_TOKEN=your_token
ASTRA_DB_ENDPOINT=your_endpoint
ASTRA_DB_KEYSPACE=roteiro_dispensacao_bot
```

### Sistema:
```
MONITORING_ENABLED=true
CACHE_ENABLED=true
RATE_LIMITING_ENABLED=true
VERCEL_ENV=production
```

## 🚀 Deploy via GitHub

1. **Conectar repositório** ao Vercel
2. **Build Settings**:
   - Framework Preset: `Other`
   - Build Command: `echo "Build completed"`
   - Output Directory: `public`
   - Install Command: `pip install -r requirements.txt`

3. **Deploy**: Push para branch main

## 🚀 Deploy via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"
vercel

# Deploy para produção
vercel --prod
```

## 🔍 Verificação Pós-Deploy

### 1. Health Check
```
GET https://your-app.vercel.app/api/health
```

### 2. Test Chat
```
POST https://your-app.vercel.app/api/chat
{
  "question": "O que é hanseníase?",
  "personality_id": "dr_gasnelio"
}
```

### 3. Personas
```
GET https://your-app.vercel.app/api/personas
```

## 📊 Monitoramento

### Analytics Nativo do Vercel:
- **Dashboard**: Vercel > Project > Analytics
- **Web Vitals**: Performance automático
- **Logs**: Real-time logs
- **Usage**: Bandwidth e function invocations

### Métricas Importantes:
- Response time < 1000ms
- Success rate > 99%
- Cold start time
- Error rate

## 🔧 Configurações Avançadas

### vercel.json principais configs:
```json
{
  "functions": {
    "api/main.py": {
      "maxDuration": 30,
      "memory": 512
    }
  },
  "regions": ["iad1"]
}
```

### Headers de Performance:
- Cache-Control configurado
- Security headers automáticos
- CORS otimizado

## 🐛 Troubleshooting

### Erro de Build:
1. Verificar `requirements.txt`
2. Logs no Vercel Dashboard
3. Testar localmente: `vercel dev`

### Erro de Runtime:
1. Verificar variáveis de ambiente
2. Logs da function
3. Health check endpoint

### Performance Issues:
1. Verificar cold starts
2. Otimizar imports
3. Ajustar memory/duration

## 📈 Otimizações

### 1. Cold Start:
- Imports lazy
- Cache global
- Menor footprint

### 2. Memory:
- Configurar memory adequada
- Monitorar usage

### 3. Regions:
- Usar region mais próxima
- Multi-region para global

## 🔄 CI/CD

### GitHub Actions (opcional):
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🎯 Próximos Passos

1. ✅ Deploy inicial
2. ✅ Configurar domínio customizado
3. ✅ Monitoring setup
4. ✅ Performance optimization
5. ✅ Error tracking

## 📞 Suporte

- **Documentação**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [GitHub Discussions](https://github.com/vercel/vercel/discussions)
- **Status**: [vercel-status.com](https://vercel-status.com)