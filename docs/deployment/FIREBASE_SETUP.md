# [DEPRECATED] Configuração do Firebase Authentication

**IMPORTANTE**: Este documento está OBSOLETO. O projeto atual usa:
- **JWT Authentication próprio** (sem Firebase Auth)
- **Google Cloud Storage** (ao invés de Firestore)
- **SQLite + Supabase** (ao invés de Firebase Database)

---

# ARQUITETURA ATUAL

O sistema agora utiliza:

## Autenticação
- **JWT próprio** via `apps/backend/services/auth/jwt_auth_manager.py`
- **Sem dependência** do Firebase Authentication
- **Rate limiting** via SQLite

## Banco de Dados
- **SQLite local** com backup automático no Google Cloud Storage
- **Supabase PostgreSQL** com pgvector para embeddings
- **ChromaDB** para vector store local

## Storage
- **Google Cloud Storage** para assets estáticos e backups
- **Cache híbrido** (memória + cloud)

---

# [LEGACY] Configuração do Firebase Authentication (OBSOLETA)

## Secrets já configurados [OK]

Você já possui TODOS os secrets necessários configurados no GitHub:
- [OK] `FIREBASE_API_KEY`
- [OK] `FIREBASE_AUTH_DOMAIN` 
- [OK] `FIREBASE_PROJECT_ID`
- [OK] `FIREBASE_STORAGE_BUCKET`
- [OK] `FIREBASE_MESSAGING_SENDER_ID`
- [OK] `FIREBASE_APP_ID`
- [OK] `FIREBASE_TOKEN` (para deploy via CLI)

## Status de Ativação [OK]

### Recursos já ativados:
- [OK] **NEXT_PUBLIC_AUTH_ENABLED=true** - Autenticação Firebase ativa
- [OK] **NEXT_PUBLIC_FIRESTORE_ENABLED=true** - Banco de dados ativo

### Analytics configurado:
- [OK] **Google Analytics (GA)** já implementado no frontend
- [OK] Configurado via `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [OK] Componente `GoogleAnalytics` integrado no layout

### Recursos opcionais:
```bash
# Modo offline (fallback quando Firebase não disponível)
NEXT_PUBLIC_OFFLINE_MODE=false  # Padrão: false
```

## Configuração dos provedores sociais

### 1. Google OAuth
No [Google Cloud Console](https://console.cloud.google.com/):
1. Vá para "APIs & Services" -> "Credentials"
2. Configure OAuth 2.0 Client IDs
3. Adicione domínios autorizados:
   - `localhost:3000` (desenvolvimento)
   - `roteirosdedispensacao.com` (produção)

### 2. Facebook Login
No [Facebook for Developers](https://developers.facebook.com/):
1. Crie um app Facebook
2. Configure Facebook Login
3. Adicione domínios válidos na configuração

### 3. Apple Sign In
No [Apple Developer](https://developer.apple.com/):
1. Configure Sign in with Apple
2. Adicione domínios e redirect URLs

## Firebase Console - Configuração

No [Firebase Console](https://console.firebase.google.com/):

### Authentication
1. Vá para Authentication -> Sign-in method
2. Habilite os provedores:
   - [OK] Email/Password
   - [OK] Google
   - [OK] Facebook  
   - [OK] Apple
   - [OK] Anonymous (para usuários convidados)

### Firestore Database
1. Crie o banco Firestore
2. Configure regras de segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Dados públicos (opcional)
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Hosting (se usar Firebase Hosting)
```bash
firebase init hosting
firebase deploy
```

## Estrutura de dados do usuário

```typescript
interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  type: 'professional' | 'student' | 'patient' | 'caregiver';
  focus: 'general' | 'advanced' | 'research';
  preferences: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    emailUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Funcionalidades disponíveis

### [ATUAL] **Com JWT Authentication:**
- Login com email/senha via API própria
- Perfis de usuário em SQLite
- Histórico de conversas em Supabase
- Cache híbrido (local + cloud)
- Rate limiting automático
- Sem dependências Firebase

### [ATUAL] **Modo convidado:**
- Acesso sem cadastro
- Sessões temporárias
- Funcionalidade completa de chat
- Experiência educacional completa

## Testando a configuração

1. **Desenvolvimento local:**
```bash
npm run dev
```

2. **Verificar status:**
- Acesse `/profile` (deve redirecionar para login se não autenticado)
- Teste login social
- Verifique perfil do usuário

3. **Debug no console:**
```javascript
// No console do navegador
console.log('Auth enabled:', window.FEATURES?.AUTH_ENABLED);
console.log('Firestore enabled:', window.FEATURES?.FIRESTORE_ENABLED);
```

## Solução de problemas

### Erro: "Firebase configuration missing"
- Verifique se os secrets estão configurados corretamente
- Rebuilde a aplicação após adicionar secrets

### Erro: "Auth domain not authorized"
- Adicione o domínio no Firebase Console -> Authentication -> Settings -> Authorized domains

### Erro social login: "Popup blocked"
- O sistema automaticamente faz fallback para redirect
- Usuários devem permitir popups para melhor experiência

### Erro: "Firestore rules deny"
- Verifique as regras de segurança do Firestore
- Certifique-se de que usuário está autenticado

## Monitoramento

### Firebase Console
- **Authentication -> Users**: Usuários registrados e provedores vinculados
- **Firestore -> Data**: Dados dos perfis de usuário salvos
- **Usage**: Métricas de uso do Firebase

### Google Analytics (GA) [OK]
- **Implementação**: Já integrado via `GoogleAnalytics` component
- **Configuração**: Via `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Eventos rastreados**: 
  - Page views automáticos
  - Login events
  - User interactions
  - Custom events do chat e navegação

### Logs da aplicação
```bash
# Em desenvolvimento
npm run dev

# Console do navegador mostra:
# - Status de autenticação
# - Eventos do Firebase
# - Errors de configuração (se houver)
```

---

**Nota:** O sistema foi projetado para funcionar de forma **graceful** - se a autenticação falhar, a aplicação ainda funcionará em modo básico para usuários não autenticados.