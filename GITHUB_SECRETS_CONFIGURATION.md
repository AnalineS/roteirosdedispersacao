# 🔐 Configuração de GitHub Secrets

## 📋 Secrets Necessários para Deploy

### 🔧 **Frontend (Next.js)**

#### **Backend API Configuration**
```
NEXT_PUBLIC_API_URL
```
- **Valor:** URL do backend em produção (ex: `https://backend-api-url.com`)
- **Descrição:** URL base para todas as chamadas da API do frontend

#### **Environment Configuration**
```
NEXT_PUBLIC_ENVIRONMENT
```
- **Valor:** `production`
- **Descrição:** Define o ambiente de execução

#### **Feature Toggles**
```
NEXT_PUBLIC_AUTH_ENABLED
NEXT_PUBLIC_FIRESTORE_ENABLED
NEXT_PUBLIC_OFFLINE_MODE
NEXT_PUBLIC_ANALYTICS_ENABLED
NEXT_PUBLIC_COOKIES_ENABLED
```
- **Valores:** `true` ou `false`
- **Descrição:** Controla quais funcionalidades estão ativas em produção

#### **Firebase Configuration**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```
- **Valores:** Configurações específicas do projeto Firebase
- **Descrição:** Autenticação e banco de dados Firestore

#### **Google Analytics**
```
NEXT_PUBLIC_GA_MEASUREMENT_ID
```
- **Valor:** ID do Google Analytics (ex: `G-XXXXXXXXXX`)
- **Descrição:** Tracking de UX e analytics

---

### 🐍 **Backend (Flask)**

#### **Database Configuration**
```
ASTRA_DB_URL
ASTRA_DB_TOKEN
ASTRA_DB_KEYSPACE
```
- **Valores:** Configurações do Astra DB (Cassandra)
- **Descrição:** Banco vetorial para sistema RAG

#### **Application Security**
```
SECRET_KEY
```
- **Valor:** Chave secreta forte de 32+ caracteres
- **Descrição:** Criptografia de sessões Flask

#### **AI API Keys**
```
OPENROUTER_API_KEY
HUGGINGFACE_API_KEY
```
- **Valores:** Chaves de API dos provedores de IA
- **Descrição:** Acesso aos modelos Llama 3.2 e Kimie K2

#### **CORS Configuration**
```
CORS_ORIGINS
```
- **Valor:** URLs autorizadas (ex: `https://roteirosdispensacao.com,https://roteiros-de-dispensacao.web.app`)
- **Descrição:** Segurança cross-origin

#### **Environment**
```
ENVIRONMENT
FLASK_ENV
```
- **Valores:** `production`, `production`
- **Descrição:** Configuração do ambiente Flask

---

## 🚀 **Como Configurar no GitHub**

### 1. **Acessar Repository Settings**
```
GitHub Repository → Settings → Secrets and variables → Actions
```

### 2. **Adicionar Repository Secrets**
- Clique em **"New repository secret"**
- Adicione cada secret da lista acima
- Use exatamente os nomes especificados

### 3. **Verificar nos Workflows**
Os secrets são automaticamente injetados nos workflows via:
```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
  NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
  # ... outros secrets
```

---

## 🔍 **Validação**

### **Checklist Frontend**
- [ ] `NEXT_PUBLIC_API_URL` - URL do backend válida
- [ ] `NEXT_PUBLIC_FIREBASE_*` - Configuração Firebase completa
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics ID
- [ ] `NEXT_PUBLIC_ENVIRONMENT=production`

### **Checklist Backend**
- [ ] `ASTRA_DB_*` - Configuração banco vetorial
- [ ] `SECRET_KEY` - Chave segura gerada
- [ ] `OPENROUTER_API_KEY` - API key válida
- [ ] `CORS_ORIGINS` - URLs frontend autorizadas

---

## 🛡️ **Segurança**

### **Boas Práticas**
1. **Nunca commitar secrets** no código
2. **Usar secrets específicos** por ambiente
3. **Rotacionar keys** periodicamente
4. **Validar permissões** mínimas necessárias

### **Teste de Configuração**
Após configurar os secrets, execute:
```bash
# Frontend build test
npm run build

# Backend health check
curl https://backend-url/api/v1/health
```

---

## 📞 **Suporte**

Se algum secret não estiver funcionando:
1. Verifique se o nome está exato (case-sensitive)
2. Confirme se o valor não tem espaços extras
3. Teste a conectividade do endpoint
4. Consulte os logs do GitHub Actions

> **Nota:** Este documento deve ser mantido atualizado conforme novos secrets forem adicionados ao sistema.