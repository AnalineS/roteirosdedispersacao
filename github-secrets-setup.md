# GitHub Secrets Setup - Configuração Completa

## 🔐 Configuração de Secrets no GitHub Actions

### Como Configurar os Secrets

1. Vá para o repositório no GitHub
2. Clique em **Settings**
3. No menu lateral, clique em **Secrets and variables → Actions**
4. Clique em **New repository secret** para cada secret abaixo

## 📋 Lista Completa de Secrets Necessários

### 🔥 Firebase Configuration
```
FIREBASE_PROJECT_ID=roteiro-dispensacao
FIREBASE_API_KEY=[Obter do Firebase Console - Web app config]
FIREBASE_AUTH_DOMAIN=roteiro-dispensacao.firebaseapp.com
FIREBASE_STORAGE_BUCKET=roteiro-dispensacao.appspot.com
FIREBASE_MESSAGING_SENDER_ID=[Obter do Firebase Console - Web app config]
FIREBASE_APP_ID=[Obter do Firebase Console - Web app config]
```

### ☁️ Google Cloud Platform
```
GCP_PROJECT_ID=roteiro-dispensacao
GCP_REGION=us-central1
GCP_SERVICE_ACCOUNT_KEY=[JSON completo da Service Account]
```

### 🚀 Backend API Configuration
```
SECRET_KEY=[Gerar uma chave aleatória segura de 50+ caracteres]
OPENROUTER_API_KEY=[Chave da API OpenRouter para AI]
HUGGINGFACE_API_KEY=[Chave da API Hugging Face para embeddings]
```

### 📊 Analytics (Opcional)
```
GA_MEASUREMENT_ID=[Google Analytics ID - opcional]
```

## 🔑 Como Obter Cada Secret

### 1. Firebase Secrets

#### Obter no Firebase Console:
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `roteiro-dispensacao`
3. Vá para **Project Settings** (ícone de engrenagem)
4. Na aba **General**, role para baixo até **Your apps**
5. Clique em **Config** na aplicação web
6. Copie os valores do objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...", // ← FIREBASE_API_KEY
  authDomain: "roteiro-dispensacao.firebaseapp.com", // ← FIREBASE_AUTH_DOMAIN
  projectId: "roteiro-dispensacao", // ← FIREBASE_PROJECT_ID
  storageBucket: "roteiro-dispensacao.appspot.com", // ← FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789", // ← FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc..." // ← FIREBASE_APP_ID
};
```

### 2. Google Cloud Service Account

#### Criar Service Account:
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto `roteiro-dispensacao`
3. Vá para **IAM & Admin → Service Accounts**
4. Clique em **Create Service Account**
5. Nome: `github-actions-deploy`
6. Descrição: `Service Account para deploy via GitHub Actions`
7. Clique em **Create and Continue**

#### Adicionar Roles:
Adicione estas roles exatas:
- ✅ `Cloud Run Admin`
- ✅ `Cloud Build Editor`
- ✅ `Container Registry Service Agent`
- ✅ `Storage Admin`
- ✅ `Firebase Admin SDK Administrator Service Agent`
- ✅ `Service Account User`

#### Baixar Chave JSON:
1. Clique na Service Account criada
2. Vá para a aba **Keys**
3. Clique em **Add Key → Create new key**
4. Selecione **JSON**
5. Baixe o arquivo JSON
6. **IMPORTANTE**: Copie TODO o conteúdo JSON (incluindo as chaves `{}`) para o secret `GCP_SERVICE_ACCOUNT_KEY`

### 3. Backend API Keys

#### SECRET_KEY:
Gere uma chave aleatória segura:
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(50))"

# OpenSSL
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

#### OPENROUTER_API_KEY:
1. Acesse [OpenRouter](https://openrouter.ai/)
2. Crie uma conta ou faça login
3. Vá para **API Keys**
4. Gere uma nova chave
5. Copie a chave (começa com `sk-or-v1-...`)

#### HUGGINGFACE_API_KEY:
1. Acesse [Hugging Face](https://huggingface.co/)
2. Crie uma conta ou faça login
3. Vá para **Settings → Access Tokens**
4. Clique em **New token**
5. Nome: `roteiro-dispensacao-api`
6. Role: **Read** (suficiente para embeddings)
7. Copie o token gerado

### 4. Google Analytics (Opcional)

#### GA_MEASUREMENT_ID:
1. Acesse [Google Analytics](https://analytics.google.com/)
2. Configure uma propriedade para o site
3. Obtenha o Measurement ID (formato: `G-XXXXXXXXXX`)

## ✅ Verificação dos Secrets

### Checklist de Configuração:
- [ ] ✅ `FIREBASE_PROJECT_ID` configurado
- [ ] ✅ `FIREBASE_API_KEY` configurado
- [ ] ✅ `FIREBASE_AUTH_DOMAIN` configurado  
- [ ] ✅ `FIREBASE_STORAGE_BUCKET` configurado
- [ ] ✅ `FIREBASE_MESSAGING_SENDER_ID` configurado
- [ ] ✅ `FIREBASE_APP_ID` configurado
- [ ] ✅ `GCP_PROJECT_ID` configurado
- [ ] ✅ `GCP_REGION` configurado
- [ ] ✅ `GCP_SERVICE_ACCOUNT_KEY` configurado (JSON completo)
- [ ] ✅ `SECRET_KEY` configurado (50+ caracteres)
- [ ] ✅ `OPENROUTER_API_KEY` configurado
- [ ] ✅ `HUGGINGFACE_API_KEY` configurado
- [ ] ⚪ `GA_MEASUREMENT_ID` configurado (opcional)

### Teste dos Secrets:
Execute um workflow manual para verificar:
1. Vá para **Actions** no GitHub
2. Selecione o workflow **Deploy Frontend & Backend**
3. Clique em **Run workflow**
4. Verifique se não há erros relacionados a secrets ausentes

## 🔒 Segurança dos Secrets

### ⚠️ Importante:
- ✅ **NUNCA** commite secrets no código
- ✅ **SEMPRE** use GitHub Secrets para produção
- ✅ **VERIFIQUE** se os secrets estão marcados como "Secret" (não "Variable")
- ✅ **ROTACIONE** periodicamente as chaves API
- ✅ **MONITORE** o uso das chaves no Google Cloud Console

### 🛡️ Princípios de Segurança:
1. **Least Privilege**: Service Account com permissões mínimas necessárias
2. **Rotation**: Renovar chaves regularmente
3. **Monitoring**: Monitorar uso anômalo
4. **Separation**: Secrets diferentes para dev/staging/prod

## 🚀 Próximos Passos

Após configurar todos os secrets:
1. ✅ Executar workflow de deploy manual
2. ✅ Verificar logs do GitHub Actions
3. ✅ Testar endpoints do backend
4. ✅ Verificar funcionamento do frontend
5. ✅ Validar integração Firebase Authentication

## 📞 Troubleshooting

### Erro: "Secret not found"
- Verifique se o nome do secret está exato (case-sensitive)
- Confirme que o secret foi salvo como "Secret" não "Variable"

### Erro: "Invalid JSON" (GCP_SERVICE_ACCOUNT_KEY)
- Certifique-se de copiar o JSON completo, incluindo `{` e `}`
- Verifique se não há quebras de linha ou caracteres extras

### Erro: "Authentication failed"
- Confirme que a Service Account tem todas as roles necessárias
- Verifique se o projeto GCP está correto

### Erro: "Firebase initialization failed"
- Confirme que todos os secrets Firebase estão corretos
- Verifique se o projeto Firebase existe e está ativo