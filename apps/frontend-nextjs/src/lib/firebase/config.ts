/**
 * Firebase Configuration
 * Configuração completa do Firebase Authentication e Firestore
 * Implementa o sistema "Soft Authentication" - login opcional
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Feature flags
export const FEATURES = {
  AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  FIRESTORE_ENABLED: process.env.NEXT_PUBLIC_FIRESTORE_ENABLED === 'true',
  OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true',
  ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Inicializar Firebase apenas uma vez
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (apenas em produção e se suportado)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && FEATURES.ANALYTICS_ENABLED) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Configuração para desenvolvimento (emulators)
if (FEATURES.IS_DEVELOPMENT && typeof window !== 'undefined') {
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
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Firebase configuração incompleta:', missing);
    return false;
  }

  return true;
}

// Controle de estado da rede
export const networkControl = {
  async enableOffline() {
    if (FEATURES.FIRESTORE_ENABLED && FEATURES.OFFLINE_MODE) {
      try {
        await disableNetwork(db);
        console.log('📴 Firestore: Modo offline ativado');
      } catch (error) {
        console.error('Erro ao ativar modo offline:', error);
      }
    }
  },

  async enableOnline() {
    if (FEATURES.FIRESTORE_ENABLED) {
      try {
        await enableNetwork(db);
        console.log('🌐 Firestore: Modo online ativado');
      } catch (error) {
        console.error('Erro ao ativar modo online:', error);
      }
    }
  }
};

// Verificar configuração na inicialização
if (FEATURES.AUTH_ENABLED || FEATURES.FIRESTORE_ENABLED) {
  const isValid = validateFirebaseConfig();
  if (!isValid && process.env.NODE_ENV === 'production') {
    console.error('❌ Firebase mal configurado em produção');
  }
}

export default app;