# 🔐 Configuração do Firebase Authentication

## Secrets já configurados ✅

Você já possui TODOS os secrets necessários configurados no GitHub:
- ✅ `FIREBASE_API_KEY`
- ✅ `FIREBASE_AUTH_DOMAIN` 
- ✅ `FIREBASE_PROJECT_ID`
- ✅ `FIREBASE_STORAGE_BUCKET`
- ✅ `FIREBASE_MESSAGING_SENDER_ID`
- ✅ `FIREBASE_APP_ID`
- ✅ `FIREBASE_TOKEN` (para deploy via CLI)

## Status de Ativação ✅

### Recursos já ativados:
- ✅ **NEXT_PUBLIC_AUTH_ENABLED=true** - Autenticação Firebase ativa
- ✅ **NEXT_PUBLIC_FIRESTORE_ENABLED=true** - Banco de dados ativo

### Analytics configurado:
- ✅ **Google Analytics (GA)** já implementado no frontend
- ✅ Configurado via `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- ✅ Componente `GoogleAnalytics` integrado no layout

### Recursos opcionais:
```bash
# Modo offline (fallback quando Firebase não disponível)
NEXT_PUBLIC_OFFLINE_MODE=false  # Padrão: false
```

## Configuração dos provedores sociais

### 1. Google OAuth
No [Google Cloud Console](https://console.cloud.google.com/):
1. Vá para "APIs & Services" → "Credentials"
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
1. Vá para Authentication → Sign-in method
2. Habilite os provedores:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Facebook  
   - ✅ Apple
   - ✅ Anonymous (para usuários convidados)

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

### ✅ **Com autenticação habilitada:**
- Login com email/senha
- Login social (Google, Facebook, Apple)
- Perfis de usuário personalizados
- Histórico de conversas
- Sincronização entre dispositivos
- Preferências salvas na nuvem

### ⚠️ **Modo degradado (auth desabilitada):**
- Acesso como convidado
- Perfis apenas locais
- Sem sincronização
- Experiência básica completa

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
- Adicione o domínio no Firebase Console → Authentication → Settings → Authorized domains

### Erro social login: "Popup blocked"
- O sistema automaticamente faz fallback para redirect
- Usuários devem permitir popups para melhor experiência

### Erro: "Firestore rules deny"
- Verifique as regras de segurança do Firestore
- Certifique-se de que usuário está autenticado

## Monitoramento

### Firebase Console
- **Authentication → Users**: Usuários registrados e provedores vinculados
- **Firestore → Data**: Dados dos perfis de usuário salvos
- **Usage**: Métricas de uso do Firebase

### Google Analytics (GA) ✅
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