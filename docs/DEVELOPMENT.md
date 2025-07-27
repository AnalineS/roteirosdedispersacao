# 🔧 Configuração de Ambiente - Roteiro de Dispensação

## 📋 Variáveis de Ambiente Obrigatórias

### 🔑 OpenRouter + Kimie K2 (CRÍTICAS)

```bash
# OpenRouter API Key - OBRIGATÓRIO para funcionar
OPENROUTER_API_KEY=your-actual-openrouter-api-key-here

# Modelo Kimie K2 Free (20 req/min, 1000/dia)
KIMIE_K2_MODEL=moonshotai/kimi-k2:free

# Fallback para modelo pago (se necessário)
KIMIE_K2_MODEL_FALLBACK=moonshotai/kimi-k2
```

### 🗄️ Astra DB (Para Vetorização)

```bash
# Token de acesso do Astra DB
ASTRA_DB_TOKEN=your-actual-astra-db-token-here

# Endpoint da instância
ASTRA_DB_ENDPOINT=https://xxxxx-xxxxx.apps.astra.datastax.com

# Keyspace (nome do banco)
ASTRA_DB_KEYSPACE=roteiro_dispensacao_bot
```

### 🤗 Hugging Face (Para Embeddings)

```bash
# API Key para modelos de embedding
HUGGINGFACE_API_KEY=your-actual-huggingface-token-here
```

## 🚀 Como Obter as Chaves

### 1. OpenRouter API Key
1. Acesse [openrouter.ai](https://openrouter.ai)
2. Faça login/cadastro
3. Vá para "API Keys" no dashboard
4. Crie uma nova chave
5. **IMPORTANTE**: Kimie K2 é GRATUITO via OpenRouter

### 2. Astra DB
1. Acesse [astra.datastax.com](https://astra.datastax.com)
2. Crie uma conta gratuita
3. Crie um novo database (tier gratuito)
4. Gere um token de aplicação
5. Copie o endpoint da instância

### 3. Hugging Face
1. Acesse [huggingface.co](https://huggingface.co)
2. Faça login/cadastro
3. Vá para Settings → Access Tokens
4. Crie um token de "Read"

## ⚡ Rate Limits Configurados

| Serviço | Limite | Configuração |
|---------|--------|--------------|
| OpenRouter Free | 20/min, 1000/dia | `RATE_LIMIT_PER_MINUTE=20` |
| Astra DB Free | 1M reads/mês | Sem limite de código |
| Hugging Face Free | 1000/hora | Sem limite de código |

## 🔒 Segurança

- **NUNCA** comite arquivos `.env` no Git
- Use `sync: false` no Render para variáveis sensíveis
- Rotacione chaves periodicamente
- Monitore uso das APIs

## 🐛 Troubleshooting

### Erro: "OpenRouter API Key não configurada"
- Verifique se `OPENROUTER_API_KEY` está definida
- Confirme que a chave é válida no dashboard OpenRouter

### Erro: "Rate limit exceeded"
- Aguarde reset do limite (1 minuto)
- Considere upgrade para tier pago se necessário

### Erro: "Astra DB connection failed"
- Verifique endpoint e token
- Confirme que o keyspace existe