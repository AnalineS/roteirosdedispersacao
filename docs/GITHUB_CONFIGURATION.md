# Configuração GitHub-Only - Plataforma Médica

**Substituição completa dos arquivos `.env` por GitHub Secrets e Variables**

## 📋 Visão Geral

Este projeto utiliza configuração **100% GitHub-native**, eliminando a necessidade de arquivos `.env` em produção. Todas as configurações são gerenciadas via GitHub Secrets (dados sensíveis) e GitHub Variables (dados públicos).

## 🔐 Tipos de Configuração

### **GitHub Secrets** (Dados Sensíveis)
```bash
# Google Cloud Platform
GCP_SERVICE_ACCOUNT_KEY      # JSON da service account
GCP_PROJECT_ID              # ID do projeto GCP
GCP_REGION                  # Região (us-central1)

# Supabase (Vector Database)
SUPABASE_PROJECT_URL        # URL do projeto Supabase
SUPABASE_PUBLISHABLE_KEY    # Chave pública Supabase
SUPABASE_SERVICE_KEY        # Chave de serviço (backend)

# AI/ML Services
OPENROUTER_API_KEY          # Chave API OpenRouter (Llama 3.2)
HUGGINGFACE_API_KEY         # Chave para embeddings

# Context7 MCP
CONTEXT7_API_KEY            # Chave API do Context7

# Notificações Telegram (Opcional)
TELEGRAM_BOT_TOKEN          # Token do bot Telegram
TELEGRAM_CHAT_ID            # ID do chat para notificações

# Segurança (Opcional)
SNYK_TOKEN                  # Token para scanning de segurança

# Analytics (Opcional)
NEXT_PUBLIC_GA_MEASUREMENT_ID  # ID do Google Analytics 4
```

### **GitHub Variables** (Dados Públicos)
```bash
# URLs da API por Ambiente
NEXT_PUBLIC_API_URL_STAGING            # URL da API de staging
NEXT_PUBLIC_API_URL_PRODUCTION         # URL da API de produção

# Configurações de Ambiente
NEXT_PUBLIC_ENVIRONMENT                # development | staging | production
```

## 🚀 Configuração Inicial

### **1. Configuração Automática**
```bash
# Execute o script de configuração
./scripts/setup-github-config.sh
```

O script configurará automaticamente:
- ✅ Todos os secrets necessários
- ✅ Todas as variables públicas
- ✅ Ambiente de desenvolvimento local
- ✅ Validação da configuração

### **2. Configuração Manual via GitHub CLI**

#### **Instalar GitHub CLI**
```bash
# Windows
winget install GitHub.cli

# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

#### **Autenticar**
```bash
gh auth login
```

#### **Configurar Secrets**
```bash
# Google Cloud Platform (Obrigatório)
gh secret set GCP_SERVICE_ACCOUNT_KEY --body-file path/to/service-account.json
gh secret set GCP_PROJECT_ID --body "red-truck-468923-s4"
gh secret set GCP_REGION --body "us-central1"

# Context7 MCP (Obrigatório)
gh secret set CONTEXT7_API_KEY --body "your_context7_api_key"

# Telegram (Opcional)
gh secret set TELEGRAM_BOT_TOKEN --body "your_telegram_bot_token"
gh secret set TELEGRAM_CHAT_ID --body "your_chat_id"

# Segurança (Opcional)
gh secret set SNYK_TOKEN --body "your_snyk_token"

# Analytics (Opcional)
gh secret set GOOGLE_ANALYTICS_ID --body "your_ga_id"
gh secret set GA4_API_SECRET --body "your_ga4_secret"
```

#### **Configurar Variables**
```bash
# API URLs
gh variable set NEXT_PUBLIC_API_URL_STAGING --body "https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app"
gh variable set NEXT_PUBLIC_API_URL_PRODUCTION --body "https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app"

# Environment Configuration
gh variable set NEXT_PUBLIC_ENVIRONMENT --body "production"
```

## 💻 Desenvolvimento Local

### **Configuração Rápida**
```bash
# Configure ambiente local
source scripts/setup-local-env.sh

# Inicie o desenvolvimento
cd apps/frontend-nextjs
npm run dev

# Backend (terminal separado)
cd apps/backend
python main.py
```

### **Configuração Manual Local**
```bash
# Supabase (para desenvolvimento local)
export SUPABASE_PROJECT_URL="your_supabase_url"
export SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"

# AI/ML Services (para desenvolvimento local)
export OPENROUTER_API_KEY="your_openrouter_key"
export HUGGINGFACE_API_KEY="your_huggingface_key"

# Local Development
export NEXT_PUBLIC_API_URL="http://localhost:5000"
export NEXT_PUBLIC_ENVIRONMENT="development"
export NEXT_PUBLIC_DEBUG="true"

# Features
export NEXT_PUBLIC_AUTH_ENABLED="true"
export NEXT_PUBLIC_OFFLINE_MODE="true"
```

## 🔍 Validação da Configuração

### **Verificar Secrets**
```bash
gh secret list
```

### **Verificar Variables**
```bash
gh variable list
```

### **Testar Workflows**
```bash
# Trigger manual dos workflows
gh workflow run "staging-deploy.yml"
gh workflow run "production-deploy.yml"
```

## 🏥 Configurações Específicas da Plataforma Médica

### **Ambientes Configurados**

#### **Staging (HML)**
- **URL**: `https://hml-roteiros-de-dispensacao.web.app`
- **API**: `https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app`
- **Database**: Supabase PostgreSQL + pgvector
- **Monitoramento**: Google Cloud Monitoring integrado
- **MCP**: Context7 + Test Master AI configurados

#### **Production**
- **URL**: `https://roteirosdispensacao.com.br`
- **API**: `https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app`
- **Database**: Supabase PostgreSQL + pgvector (produção)
- **Monitoramento**: Google Cloud Monitoring + alertas críticos
- **MCP**: Context7 + Test Master AI com validação estrita

### **Recursos Médicos Configurados**
- ✅ **LGPD Compliance**: Conformidade estrita ativa
- ✅ **Personas Médicas**: Dr. Gasnelio e GA configurados
- ✅ **Calculadoras**: Sistema de dosagem PQT-U
- ✅ **Monitoramento**: SLA 99.9% para produção
- ✅ **Context7 MCP**: Documentação médica em tempo real
- ✅ **Test Master AI**: Automação de testes médicos

## 🚨 Troubleshooting

### **Erro: "Variable not found"**
```bash
# Verificar se a variable está configurada
gh variable list | grep NEXT_PUBLIC_API_URL

# Configurar se ausente
gh variable set NEXT_PUBLIC_API_URL_PRODUCTION --body "https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app"
```

### **Erro: "Secret not found"**
```bash
# Verificar se o secret está configurado
gh secret list | grep SUPABASE_PROJECT_URL

# Configurar se ausente
gh secret set SUPABASE_PROJECT_URL --body "your_supabase_url"
```

### **Erro: "Supabase connection failed"**
1. Verificar se `SUPABASE_PROJECT_URL` e `SUPABASE_SERVICE_KEY` estão configurados
2. Validar se o projeto Supabase está ativo e acessível
3. Confirmar se a extensão pgvector está habilitada no banco

### **Erro: "Context7 authentication failed"**
1. Verificar se `CONTEXT7_API_KEY` está configurado como secret
2. Testar a chave API manualmente
3. Confirmar se o Context7 está disponível na região configurada

## 📚 Referências

- **GitHub CLI**: https://cli.github.com/
- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **GitHub Variables**: https://docs.github.com/en/actions/learn-github-actions/variables
- **Firebase Configuration**: https://firebase.google.com/docs/web/setup
- **Context7 MCP**: Configuração interna de documentação
- **Google Cloud Monitoring**: Integração configurada nos workflows

---

**📋 Nota**: Este documento substitui todas as configurações de `.env`. Arquivos `.env` não são mais necessários para este projeto.