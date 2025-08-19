/**
 * Firebase Configuration
 * Configuração completa do Firebase Authentication e Firestore
 * Implementa o sistema "Soft Authentication" - login opcional
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Configuração do Firebase - Usando secrets com fallback para NEXT_PUBLIC_
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

// Verificar se as configurações do Firebase estão válidas
function hasValidConfig(): boolean {
  return !!(
    firebaseConfig.apiKey && 
    firebaseConfig.authDomain && 
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== '' &&
    firebaseConfig.authDomain !== '' &&
    firebaseConfig.projectId !== ''
  );
}

// Feature flags
export const FEATURES = {
  AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  FIRESTORE_ENABLED: process.env.NEXT_PUBLIC_FIRESTORE_ENABLED === 'true',
  OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' || false,
  ANALYTICS_ENABLED: true, // GA sempre ativo 
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  CONFIG_VALID: hasValidConfig(),
} as const;

// Inicializar Firebase apenas se configuração estiver válida
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

if (hasValidConfig()) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  // Serviços do Firebase
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Só mostrar warning em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Firebase] Não inicializado - configuração incompleta');
  }
}

export { auth, db };

// Analytics (apenas em produção e se suportado)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && FEATURES.ANALYTICS_ENABLED && app) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Configuração para desenvolvimento (emulators)
if (FEATURES.IS_DEVELOPMENT && typeof window !== 'undefined' && auth && db) {
  // Auth emulator
  if (!auth.app.options.authDomain?.includes('localhost')) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    } catch (error) {
      console.log('Auth emulator já conectado');
    }
  }

  // Firestore emulator
  if (!db.app.options.projectId?.includes('demo-')) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      console.log('Firestore emulator já conectado');
    }
  }
}

// Configurações de Firestore
export const FIRESTORE_CONFIG = {
  // Coleções principais
  COLLECTIONS: {
    USERS: 'users',
    CONVERSATIONS: 'conversations',
    USER_PROFILES: 'user_profiles',
    FEEDBACK: 'feedback',
    ANALYTICS: 'analytics',
    SESSIONS: 'sessions',
  },
  
  // Limites de dados
  LIMITS: {
    MAX_CONVERSATIONS_PER_USER: 100,
    MAX_MESSAGES_PER_CONVERSATION: 200,
    MAX_FEEDBACK_ENTRIES: 50,
    MAX_PROFILE_HISTORY_DAYS: 90,
  },
  
  // Cache settings
  CACHE: {
    ENABLE_PERSISTENCE: FEATURES.OFFLINE_MODE,
    SYNC_DEBOUNCE_MS: 2000,
    OFFLINE_TIMEOUT_MS: 10000,
  }
} as const;

// Verificação de configuração
export function validateFirebaseConfig(): boolean {
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    // Só mostrar warning em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Firebase] Configuração incompleta:', missing);
    }
    return false;
  }

  return true;
}

// Controle de estado da rede
export const networkControl = {
  async enableOffline() {
    if (FEATURES.FIRESTORE_ENABLED && FEATURES.OFFLINE_MODE && db) {
      try {
        await disableNetwork(db);
        if (process.env.NODE_ENV === 'development') {
          console.log('[Firestore] Modo offline ativado');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao ativar modo offline:', error);
        }
      }
    }
  },

  async enableOnline() {
    if (FEATURES.FIRESTORE_ENABLED && db) {
      try {
        await enableNetwork(db);
        if (process.env.NODE_ENV === 'development') {
          console.log('[Firestore] Modo online ativado');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao ativar modo online:', error);
        }
      }
    }
  }
};

// Verificar configuração na inicialização
if (FEATURES.AUTH_ENABLED || FEATURES.FIRESTORE_ENABLED) {
  const isValid = validateFirebaseConfig();
  // Remover log de erro em produção
  if (!isValid && process.env.NODE_ENV === 'development') {
    console.error('[Firebase] Configuração inválida');
  }
}

// ============================================
// SOCIAL AUTH PROVIDERS
// ============================================

// Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Facebook Provider (REMOVIDO - não será usado)
// Apple Provider (REMOVIDO - não será usado)

// Helper para obter provider por ID
export function getAuthProvider(providerId: string) {
  switch (providerId) {
    case 'google.com':
      return googleProvider;
    default:
      throw new Error(`Provider não suportado: ${providerId}`);
  }
}

// Lista de provedores disponíveis (apenas Google)
export const AVAILABLE_PROVIDERS = [
  {
    id: 'google.com',
    name: 'Google',
    icon: '🔍',
    color: '#4285f4',
    enabled: true
  }
] as const;

export default app;