# GitHub Secrets Configuration for HML Environment

Este documento lista todos os secrets necessários para configurar o ambiente de homologação (HML) no GitHub Actions.

## [AUTH] Secrets Obrigatórios

### Google Cloud Platform (GCP)
```bash
# Service Account Key para deploy no Cloud Run
GOOGLE_CLOUD_PROJECT="roteiros-de-dispensacao"
GCP_SA_KEY='{"type": "service_account", "project_id": "roteiros-de-dispensacao", ...}'
```

### Firebase
```bash
# Token de autenticação do Firebase CLI
FIREBASE_TOKEN="1//firebase-cli-token-aqui"

# Project ID do Firebase (mesmo do GCP)
FIREBASE_PROJECT_ID="roteiros-de-dispensacao"
```

### Snyk Security
```bash
# Token de API do Snyk para scanning de segurança
SNYK_TOKEN="snyk-api-token-aqui"

# Webhook URL para notificações do Snyk (opcional)
SNYK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

### Notificações
```bash
# Token do bot do Telegram para notificações
TELEGRAM_BOT_TOKEN="bot-token-do-telegram"

# Chat ID do Telegram para receber notificações
TELEGRAM_CHAT_ID="-chat-id-do-grupo"
```

### HML Specific
```bash
# Token para seed de dados em HML
HML_SEED_TOKEN="token-seguro-para-seed-hml-2024"

# URL base do serviço HML (será preenchida automaticamente)
HML_SERVICE_URL="https://hml-roteiro-dispensacao-api-run-url"
```

## 🛠️ Como Configurar os Secrets

### 1. Acessar GitHub Secrets
1. Vá para o repositório no GitHub
2. Clique em **Settings**
3. No menu lateral, clique em **Secrets and variables** > **Actions**
4. Clique em **New repository secret**

### 2. Google Cloud Platform

#### Criar Service Account
```bash
# Criar service account
gcloud iam service-accounts create github-actions-hml \
    --description="Service account for GitHub Actions HML deploys" \
    --display-name="GitHub Actions HML"

# Obter email da service account
SA_EMAIL="github-actions-hml@roteiros-de-dispensacao.iam.gserviceaccount.com"

# Adicionar roles necessárias
gcloud projects add-iam-policy-binding roteiros-de-dispensacao \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding roteiros-de-dispensacao \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding roteiros-de-dispensacao \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Criar chave JSON
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SA_EMAIL

# O conteúdo deste arquivo vai no secret GCP_SA_KEY
```

### 3. Firebase Token

```bash
# Fazer login no Firebase
firebase login:ci

# O token retornado vai no secret FIREBASE_TOKEN
```

### 4. Snyk Token

1. Acesse [Snyk Account Settings](https://app.snyk.io/account)
2. Copie o **API Token**
3. Adicione como secret `SNYK_TOKEN`

### 5. Telegram Bot

#### Criar Bot
1. Abra o Telegram e procure por **@BotFather**
2. Digite `/newbot` e siga as instruções
3. Copie o **token** fornecido
4. Adicione como secret `TELEGRAM_BOT_TOKEN`

#### Obter Chat ID
```bash
# Adicione o bot ao grupo/canal
# Envie uma mensagem no grupo
# Acesse esta URL substituindo BOT_TOKEN:
curl "https://api.telegram.org/bot<BOT_TOKEN>/getUpdates"

# Procure pelo "chat": {"id": -XXXXXXXX}
# Adicione o ID como secret TELEGRAM_CHAT_ID
```

## [LIST] Lista de Verificação

### Secrets GCP/Firebase
- [ ] `GOOGLE_CLOUD_PROJECT`
- [ ] `GCP_SA_KEY`
- [ ] `FIREBASE_TOKEN`
- [ ] `FIREBASE_PROJECT_ID`

### Secrets Segurança
- [ ] `SNYK_TOKEN`
- [ ] `SNYK_WEBHOOK_URL` (opcional)

### Secrets Notificações
- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_CHAT_ID`

### Secrets HML
- [ ] `HML_SEED_TOKEN`

## [FIX] Teste de Configuração

### Verificar GCP Service Account
```bash
# Testar autenticação
gcloud auth activate-service-account --key-file=github-actions-key.json
gcloud run services list --region=us-central1
```

### Verificar Firebase
```bash
# Testar Firebase CLI
firebase projects:list
firebase use roteiros-de-dispensacao
```

### Verificar Snyk
```bash
# Testar Snyk CLI
snyk auth $SNYK_TOKEN
snyk test
```

### Verificar Telegram
```bash
# Testar envio de mensagem
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d chat_id="$TELEGRAM_CHAT_ID" \
  -d text="[TEST] Teste de configuração GitHub Actions HML"
```

## [ALERT] Segurança

### Boas Práticas
1. **Rotação de Secrets**: Renove tokens periodicamente
2. **Princípio do Menor Privilégio**: Service accounts com permissões mínimas
3. **Monitoramento**: Configure alertas para uso indevido
4. **Backup**: Mantenha backup seguro dos tokens críticos

### Rotação Programada
```yaml
# Agendar rotação trimestral
- GCP Service Account Keys: A cada 90 dias
- Firebase Tokens: A cada 6 meses
- Snyk Tokens: A cada 1 ano
- Telegram Bots: Conforme necessário
```

## 🔗 Links Úteis

- [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam)
- [Firebase Console](https://console.firebase.google.com/)
- [Snyk Account Settings](https://app.snyk.io/account)
- [Telegram BotFather](https://t.me/BotFather)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do GitHub Actions
2. Testar secrets individualmente
3. Consultar documentação específica de cada serviço
4. Contatar equipe de DevOps se necessário