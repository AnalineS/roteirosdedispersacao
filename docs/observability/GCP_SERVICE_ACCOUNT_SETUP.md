# 🔧 Configuração Service Account GCP - Observabilidade

## 📋 Guia Passo-a-Passo

### 1️⃣ **Habilitar APIs no Google Cloud**

```bash
# 1. Login no gcloud CLI
gcloud auth login

# 2. Selecionar projeto (substitua pelo seu PROJECT_ID)
gcloud config set project roteiro-dispensacao-api

# 3. Habilitar APIs necessárias
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudtrace.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# 4. Verificar APIs habilitadas
gcloud services list --enabled
```

### 2️⃣ **Criar Service Account**

```bash
# 1. Criar service account
gcloud iam service-accounts create observability-free \
  --display-name="Observability Free Tier" \
  --description="Service account para monitoramento gratuito"

# 2. Verificar criação
gcloud iam service-accounts list
```

### 3️⃣ **Configurar Permissões (Mínimas)**

```bash
# Definir variáveis
export PROJECT_ID=$(gcloud config get-value project)
export SA_EMAIL="observability-free@${PROJECT_ID}.iam.gserviceaccount.com"

# Permissões necessárias (apenas escrita - write é grátis)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/monitoring.metricWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudtrace.agent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/logging.logWriter"

# Verificar permissões
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:${SA_EMAIL}"
```

### 4️⃣ **Criar e Baixar Chave JSON**

```bash
# 1. Criar chave JSON
gcloud iam service-accounts keys create observability-key.json \
  --iam-account=$SA_EMAIL

# 2. Verificar arquivo criado
ls -la observability-key.json

# 3. Ver conteúdo (para configurar no GitHub Secrets)
cat observability-key.json
```

### 5️⃣ **Configurar Secrets no GitHub**

1. **Acesse seu repositório no GitHub**
2. **Vá em Settings → Secrets and variables → Actions**
3. **Adicione os seguintes secrets:**

```yaml
# Secret: GCP_PROJECT_ID
Value: roteiro-dispensacao-api

# Secret: GCP_SERVICE_ACCOUNT_KEY
Value: [Cole todo o conteúdo do observability-key.json aqui]

# Secret: GA_MEASUREMENT_ID (se ainda não existir)
Value: G-XXXXXXXXXX

# Secret: GA_API_SECRET (para enviar métricas)
Value: [Obter no Google Analytics → Admin → Data Streams → Measurement Protocol API secrets]
```

### 6️⃣ **Testar Configuração**

```bash
# 1. Configurar credenciais localmente
export GOOGLE_APPLICATION_CREDENTIALS="./observability-key.json"

# 2. Testar com gcloud
gcloud auth activate-service-account --key-file=observability-key.json

# 3. Testar escrita de métrica simples
gcloud logging write test-log "Test message from observability setup" \
  --severity=INFO

# 4. Verificar se apareceu nos logs
gcloud logging read "test-log" --limit=1
```

---

## 🔒 **Segurança e Boas Práticas**

### **Princípio do Menor Privilégio**
✅ **Só permissões de escrita** (write é gratuito)  
✅ **Sem permissões de leitura** (read tem limite)  
✅ **Sem permissões administrativas**  

### **Rotação de Chaves**
```bash
# Criar nova chave (mensalmente)
gcloud iam service-accounts keys create observability-key-$(date +%Y%m).json \
  --iam-account=$SA_EMAIL

# Deletar chave antiga
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=$SA_EMAIL
```

### **Monitoramento de Uso**
```bash
# Verificar métricas de uso
gcloud logging metrics list
gcloud monitoring metrics list --filter="metric.type=monitoring.googleapis.com/billing*"
```

---

## 📊 **Configuração de Métricas**

### **Arquivo de Configuração Environment**

```bash
# .env.local (desenvolvimento)
GOOGLE_APPLICATION_CREDENTIALS="./observability-key.json"
NEXT_PUBLIC_GCP_PROJECT_ID="roteiro-dispensacao-api"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# .env.production (GitHub Actions)
# Será configurado automaticamente via secrets
```

### **Inicialização da Library**

```typescript
// apps/frontend-nextjs/src/lib/observability/config.ts
import { getObservability } from './gcpMetrics';

export function initializeObservability() {
  if (typeof window !== 'undefined') {
    const obs = getObservability();
    
    // Track initial page load
    obs.track('api_health', 200, {
      endpoint: 'initial_load',
      status: '200'
    });
    
    console.log('📊 Observability inicializada');
  }
}
```

---

## 🧪 **Validação da Configuração**

### **Checklist de Verificação**

- [ ] **APIs habilitadas**: `gcloud services list --enabled | grep monitoring`
- [ ] **Service Account criado**: `gcloud iam service-accounts list`
- [ ] **Permissões corretas**: Apenas writer roles
- [ ] **Chave JSON baixada**: Arquivo local criado
- [ ] **Secrets configurados**: GitHub Secrets adicionados
- [ ] **Teste local**: Métrica enviada com sucesso
- [ ] **GitHub Actions**: Workflow executando sem erros

### **Comando de Teste Completo**

```bash
#!/bin/bash
# test-observability-setup.sh

echo "🔍 Testando configuração de Observabilidade..."

# 1. Verificar APIs
echo "📋 Verificando APIs..."
gcloud services list --enabled | grep -E "(monitoring|logging|trace)" || echo "❌ APIs não habilitadas"

# 2. Verificar Service Account
echo "👤 Verificando Service Account..."
gcloud iam service-accounts list | grep "observability-free" || echo "❌ Service Account não encontrado"

# 3. Testar autenticação
echo "🔐 Testando autenticação..."
gcloud auth activate-service-account --key-file=observability-key.json && echo "✅ Autenticação OK" || echo "❌ Falha na autenticação"

# 4. Enviar métrica de teste
echo "📊 Enviando métrica de teste..."
gcloud logging write test-observability "Setup test successful" --severity=INFO && echo "✅ Métrica enviada" || echo "❌ Falha no envio"

echo "✅ Teste concluído!"
```

---

## 📚 **Recursos Úteis**

- [GCP Monitoring Pricing](https://cloud.google.com/stackdriver/pricing)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [Monitoring API Reference](https://cloud.google.com/monitoring/api/ref_v3/rest)
- [Free Tier Limits](https://cloud.google.com/free/docs/gcp-free-tier#always-free)

---

*Guia criado para configuração de observabilidade gratuita no Sistema Educacional de Hanseníase*