# Firebase Authentication Integration Guide

## 📋 Guia de Integração do Sistema "Soft Authentication"

Este documento explica como integrar o sistema de autenticação Firebase na aplicação Next.js existente, mantendo total compatibilidade com o sistema atual.

## 🏗️ Estrutura dos Componentes Criados

### 1. Contexto e Hooks Base
- `src/contexts/AuthContext.tsx` - Context principal de autenticação
- `src/hooks/useAuth.ts` - Hook estendido com utilitários específicos
- `src/hooks/useFirebaseSync.ts` - Sincronização bidirecional
- `src/hooks/useConversationHistory.ts` - Atualizado para Firebase
- `src/hooks/useUserProfile.ts` - Atualizado para Firebase

### 2. Configuração Firebase
- `src/lib/firebase/config.ts` - Configuração e feature flags
- `src/lib/firebase/types.ts` - Tipos TypeScript completos
- `src/lib/firebase/firestore.ts` - Repository pattern para dados
- `firestore.rules` - Regras de segurança
- `firestore.indexes.json` - Índices otimizados

### 3. Componentes de Interface
- `src/components/auth/SoftAuthModal.tsx` - Modal de login/registro
- `src/components/auth/SoftAuthPrompt.tsx` - Prompts suaves
- `src/components/auth/UserProfileWidget.tsx` - Widget de status do usuário
- `src/components/auth/AuthProviderWrapper.tsx` - Provider global

## 🚀 Passos de Integração

### Passo 1: Configurar Variáveis de Ambiente

```bash
# Copiar template de environment
cp apps/frontend-nextjs/.env.example apps/frontend-nextjs/.env.local
```

Preencher as variáveis do Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Feature flags (ajuste conforme necessário)
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_FIRESTORE_ENABLED=true
NEXT_PUBLIC_OFFLINE_MODE=true
```

### Passo 2: Instalar Dependências

```bash
cd apps/frontend-nextjs
npm install firebase@^10.17.0
```

### Passo 3: Configurar Firebase Project

1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Ativar Authentication (Email/Password)
3. Ativar Firestore Database
4. Configurar regras de segurança (usar `firestore.rules`)
5. Deployar índices (usar `firestore.indexes.json`)

### Passo 4: Atualizar App Layout

```tsx
// apps/frontend-nextjs/src/app/layout.tsx
import { AuthProviderWrapper } from '@/components/auth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
```

### Passo 5: Integrar Widget de Usuário

```tsx
// Exemplo de uso em header/navigation
import { UserProfileWidget } from '@/components/auth';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="flex justify-between items-center p-4">
        <h1>Plataforma Educacional</h1>
        <UserProfileWidget variant="header" />
      </div>
    </header>
  );
}
```

### Passo 6: Adicionar Prompts Suaves

```tsx
// Exemplo em páginas de funcionalidades
import { SoftAuthPrompt } from '@/components/auth';

export function AdvancedCalculator() {
  const auth = useAuth();
  
  return (
    <div>
      <h2>Calculadora Avançada</h2>
      
      {!auth.canAccessAdvancedCalculator() && (
        <SoftAuthPrompt 
          trigger="feature_access"
          feature="advanced_calculator"
          context="Para acessar a calculadora completa com histórico"
        />
      )}
      
      {/* Conteúdo da calculadora */}
    </div>
  );
}
```

## 🔄 Compatibilidade com Sistema Atual

### Sistema Híbrido
O sistema funciona em 3 modos:

1. **Modo Offline** (`AUTH_ENABLED=false`)
   - Funciona exatamente como antes
   - Apenas localStorage
   - Todas as funcionalidades básicas disponíveis

2. **Modo Soft Auth** (`AUTH_ENABLED=true`)
   - Sistema atual + funcionalidades extras para autenticados
   - localStorage como fallback
   - Migração automática de dados

3. **Modo Full Cloud** (usuário autenticado)
   - Sincronização automática com Firestore
   - Backup local mantido
   - Funcionalidades premium disponíveis

### Migração Automática
- Dados existentes no localStorage são preservados
- Migração automática para Firestore quando usuário faz login
- Sistema de fallback robusto

## 📱 Exemplos de Uso dos Hooks

### Hook de Autenticação Estendido
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const auth = useAuth();
  
  // Status do usuário
  const sessionType = auth.getSessionType(); // 'guest' | 'temporary' | 'registered' | 'premium'
  const displayName = auth.getUserDisplayName();
  const welcomeMessage = auth.getWelcomeMessage();
  
  // Controle de funcionalidades
  const canExport = auth.canExportData();
  const canAccessAnalytics = auth.canAccessAnalytics();
  
  // Prompts inteligentes
  if (auth.shouldShowUpgradePrompt('generate_certificate')) {
    auth.promptAuthForFeature('generate_certificate');
  }
  
  return (
    <div>
      <h1>{welcomeMessage}</h1>
      {canExport && <ExportButton />}
      {canAccessAnalytics && <AnalyticsPanel />}
    </div>
  );
}
```

### Hook de Sincronização
```tsx
import { useFirebaseSync } from '@/hooks/useFirebaseSync';

function DataSyncStatus() {
  const sync = useFirebaseSync();
  
  return (
    <div>
      {sync.syncState.isSyncing && <span>Sincronizando...</span>}
      {sync.migrationState.isRequired && (
        <button onClick={sync.forceMigration}>
          Migrar dados para a nuvem
        </button>
      )}
      <button onClick={sync.manualSync}>Sincronizar agora</button>
    </div>
  );
}
```

### Hooks de Dados Atualizados
```tsx
import { useConversationHistory } from '@/hooks/useConversationHistory';

function ConversationPanel() {
  const {
    conversations,
    syncStatus,
    isUsingFirestore,
    forceSync,
    addMessageToConversation
  } = useConversationHistory();
  
  return (
    <div>
      {isUsingFirestore && (
        <div>
          Status: {syncStatus}
          <button onClick={forceSync}>Sincronizar</button>
        </div>
      )}
      {/* Interface de conversas */}
    </div>
  );
}
```

## 🛡️ Configurações de Segurança

### Firestore Rules
As regras implementadas garantem:
- Usuários só acessam seus próprios dados
- Validação de estrutura de dados
- Proteção contra ataques de injeção
- Limites de tamanho para prevenir spam

### CSP Headers
Headers de segurança atualizados no `firebase.json`:
- Permissões para domínios Firebase
- Proteção XSS mantida
- CORS configurado adequadamente

## 📊 Monitoramento e Debug

### Feature Flags
```tsx
import { FEATURES } from '@/lib/firebase/config';

// Verificar status das funcionalidades
console.log('Auth enabled:', FEATURES.AUTH_ENABLED);
console.log('Firestore enabled:', FEATURES.FIRESTORE_ENABLED);
console.log('Offline mode:', FEATURES.OFFLINE_MODE);
```

### Status do Sistema
```tsx
import { FeatureStatus } from '@/components/auth';

function AdminPanel() {
  return (
    <div>
      <FeatureStatus className="mb-4" />
      {/* Painel admin */}
    </div>
  );
}
```

## 🎯 Estratégia de Rollout

### Fase 1: Deploy Silencioso
- Deploy com `AUTH_ENABLED=false`
- Sistema funciona exatamente como antes
- Testes de compatibilidade

### Fase 2: Soft Launch
- Ativar `AUTH_ENABLED=true`
- Prompts suaves apenas
- Monitorar adoção

### Fase 3: Full Launch
- Ativar todas as funcionalidades
- Campanhas de migração
- Analytics completos

## 🐛 Solução de Problemas

### Erro de Inicialização Firebase
```tsx
// Verificar configuração
import { validateFirebaseConfig } from '@/lib/firebase/config';

if (!validateFirebaseConfig()) {
  console.error('Firebase mal configurado');
}
```

### Dados não Sincronizando
```tsx
// Forçar sincronização manual
const sync = useFirebaseSync();
await sync.manualSync();
```

### Fallback para localStorage
```tsx
// Sistema automaticamente faz fallback em caso de erro
// Logs no console mostrarão o motivo
```

## 📚 Documentação Adicional

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Next.js Firebase Integration](https://nextjs.org/learn/dashboard-app/setting-up-your-database)

## 🤝 Suporte

Para dúvidas ou problemas com a integração:
1. Verificar logs do console do navegador
2. Verificar Firebase Console para erros
3. Consultar esta documentação
4. Contatar equipe de desenvolvimento