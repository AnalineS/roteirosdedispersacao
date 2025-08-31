# [AUTH] Configuração de GitHub Secrets

## [LIST] Secrets Configurados no GitHub (MAPEAMENTO REAL)

### [OK] **Secrets Atualmente Disponíveis:**

#### **🔑 Astra Database (Cassandra/DataStax)**
```
[OK] ASTRA_BD_API_KEY
[OK] ASTRA_BD_APLICATION_TOKEN  
[OK] ASTRA_BD_CLIENTID
[OK] ASTRA_BD_SECRET
[OK] ASTRA_BD_TOKEN
```
- **Status:** Configurados no GitHub (BD ao invés de DB)
- **Mapeamento:** Código agora suporta ambos `ASTRA_BD_*` e `ASTRA_DB_*`

#### **🔥 Firebase Configuration**
```
[OK] FIREBASE_API_KEY
[OK] FIREBASE_APP_ID  
[OK] FIREBASE_AUTH_DOMAIN
[OK] FIREBASE_MESSAGING_SENDER_ID
[OK] FIREBASE_PROJECT_ID
[OK] FIREBASE_STORAGE_BUCKET
[OK] FIREBASE_TOKEN
```
- **Status:** Configurados no GitHub
- **Mapeamento:** Código suporta `FIREBASE_*` e `NEXT_PUBLIC_FIREBASE_*`

#### **[REPORT] Google Analytics & GCP**
```
[OK] GA_MEASUREMENT_ID
[OK] GCP_PROJECT_ID
[OK] GCP_REGION
[OK] GCP_SERVICE_ACCOUNT_KEY
```
- **Status:** Configurados no GitHub
- **Mapeamento:** Código suporta `GA_*` e `NEXT_PUBLIC_GA_*`

#### **🤖 AI APIs**
```
[OK] OPENROUTER_API_KEY
[OK] HUGGINGFACE_API_KEY
```
- **Status:** Configurados no GitHub
- **Uso:** Modelos Llama 3.2 e Kimie K2

#### **[AUTH] Security & Application**
```
[OK] SECRET_KEY
```
- **Status:** Configurado no GitHub
- **Uso:** Criptografia Flask

#### **💬 Telegram Bot (Notificações)**
```
[OK] TELEGRAM_BOT_TOKEN
[OK] TELEGRAM_CHAT_ID
```
- **Status:** Configurados no GitHub
- **Uso:** Sistema de notificações

### [ERROR] **Secrets Faltantes:**

#### **[ALERT] CRÍTICO: Backend API URL**
```
[ERROR] NEXT_PUBLIC_API_URL
```
- **Status:** **NECESSÁRIO PARA RESOLVER "Modo offline ativo"**
- **Urgência:** [RED] **ALTA** - Sistema em modo offline sem este secret
- **Valor sugerido:** URL do backend em produção
- **Exemplo:** `https://backend-dot-hansenase-webapp.rj.r.appspot.com`

#### **🔄 Environment Toggles (Opcionais)**
```
[WARNING] NEXT_PUBLIC_ENVIRONMENT (padrão: production detectado automaticamente)
[WARNING] NEXT_PUBLIC_AUTH_ENABLED (padrão: true) 
[WARNING] NEXT_PUBLIC_FIRESTORE_ENABLED (padrão: true)
[WARNING] NEXT_PUBLIC_OFFLINE_MODE (padrão: false)
[WARNING] NEXT_PUBLIC_ANALYTICS_ENABLED (padrão: true)
```
- **Status:** Opcionais - código usa defaults inteligentes
- **Prioridade:** [YELLOW] **BAIXA** - Sistema funciona sem eles

---

## [START] **Como Configurar no GitHub**

### 1. **Acessar Repository Settings**
```
GitHub Repository -> Settings -> Secrets and variables -> Actions
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

## [SEARCH] **Validação**

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

## [SECURITY] **Segurança**

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