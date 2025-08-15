# Firebase Project Setup - Roteiros de Dispensação

## 🔧 Configuração do Projeto Firebase

### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Add project" / "Adicionar projeto"
3. Nome do projeto: `roteiro-dispensacao`
4. **IMPORTANTE**: Use o mesmo ID do projeto que está no GitHub Actions: `roteiro-dispensacao`
5. Configure Google Analytics (opcional)
6. Clique em "Create project"

### 2. Configurar Authentication

1. No console Firebase, vá para **Authentication**
2. Clique em "Get started"
3. Na aba **Sign-in method**, habilite:
   - ✅ **Email/Password** (Primary)
   - ✅ **Anonymous** (Para usuários não registrados)
   - ✅ **Google** (Opcional, para social login)

### 3. Configurar Firestore Database

1. Vá para **Firestore Database**
2. Clique em "Create database"
3. Escolha **Production mode**
4. Selecione localização: `us-central1` (mesma região do Cloud Run)
5. Aplicar as regras de segurança do arquivo `firestore.rules`

### 4. Registrar Aplicação Web

1. No Project Overview, clique no ícone **Web** `</>`
2. App nickname: `roteiro-dispensacao-web`
3. **✅ MARQUE**: "Also set up Firebase Hosting for this app"
4. Clique em "Register app"

### 5. Obter Configurações

Após o registro, você receberá a configuração Firebase:

```javascript
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "roteiro-dispensacao.firebaseapp.com", 
  projectId: "roteiro-dispensacao",
  storageBucket: "roteiro-dispensacao.appspot.com",
  messagingSenderId: "MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID"
};
```

### 6. Configurar Firebase Hosting

1. No console, vá para **Hosting**
2. Verifique se o domínio está configurado:
   - Default: `roteiro-dispensacao.web.app`
   - Custom: `roteirosdedispensacao.com`

### 7. Configurar GitHub Secrets

No repositório GitHub, vá para **Settings → Secrets and variables → Actions** e adicione:

#### Firebase Secrets
```
FIREBASE_PROJECT_ID=roteiro-dispensacao
FIREBASE_API_KEY=[Obter do Firebase Console]
FIREBASE_AUTH_DOMAIN=roteiro-dispensacao.firebaseapp.com
FIREBASE_STORAGE_BUCKET=roteiro-dispensacao.appspot.com
FIREBASE_MESSAGING_SENDER_ID=[Obter do Firebase Console]
FIREBASE_APP_ID=[Obter do Firebase Console]
```

#### Google Cloud Secrets
```
GCP_PROJECT_ID=roteiro-dispensacao
GCP_REGION=us-central1
GCP_SERVICE_ACCOUNT_KEY=[JSON da Service Account]
```

#### Backend Secrets
```
SECRET_KEY=[Gerar chave aleatória segura]
OPENROUTER_API_KEY=[Chave da API OpenRouter]
HUGGINGFACE_API_KEY=[Chave da API Hugging Face]
```

### 8. Configurar Service Account

1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto `roteiro-dispensacao`
3. Vá para **IAM & Admin → Service Accounts**
4. Clique em "Create Service Account"
5. Nome: `github-actions-deploy`
6. Adicione as roles:
   - `Cloud Run Admin`
   - `Cloud Build Editor`
   - `Storage Admin`
   - `Firebase Admin`
7. Baixe a chave JSON e adicione como `GCP_SERVICE_ACCOUNT_KEY`

### 9. Configurar Feature Flags

No frontend (arquivo `.env.local`):
```
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_FIRESTORE_ENABLED=true
NEXT_PUBLIC_SOFT_AUTH_ENABLED=true
```

### 10. Validar Configuração

Execute os comandos de teste:

```bash
# Testar Firebase Authentication
curl -X GET "https://roteiro-dispensacao.web.app"

# Testar Backend API
curl -X GET "https://roteiro-dispensacao-api-xxxxx-uc.a.run.app/api/v1/health"

# Testar integração JWT
curl -X GET "https://roteiro-dispensacao-api-xxxxx-uc.a.run.app/api/v1/user/auth/status"
```

## ✅ Checklist de Verificação

- [ ] ✅ Projeto Firebase criado com ID correto
- [ ] ✅ Authentication configurado (Email + Anonymous)
- [ ] ✅ Firestore Database criado em produção
- [ ] ✅ Aplicação Web registrada com Hosting
- [ ] ✅ Configurações Firebase obtidas
- [ ] ✅ GitHub Secrets configurados
- [ ] ✅ Service Account criada com permissões
- [ ] ✅ Feature flags habilitados
- [ ] ✅ Testes de conectividade realizados

## 🔒 Considerações de Segurança

1. **Firestore Rules**: Aplicar regras restritivas
2. **Auth Domain**: Verificar domínios autorizados
3. **API Keys**: Restringir por domínio em produção
4. **Service Account**: Princípio do menor privilégio
5. **CORS**: Configurar origins específicos

## 📞 Próximos Passos

Após completar esta configuração:
1. ✅ Deploy do frontend com AuthProvider
2. ✅ Deploy do backend com JWT validation
3. ✅ Testes end-to-end
4. ✅ Monitoramento de métricas