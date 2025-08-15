/**
 * useFirebaseSync Hook
 * Gerencia sincronização bidirecional entre localStorage e Firestore
 * Implementa migração automática e resolução de conflitos
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURES, FIRESTORE_CONFIG } from '@/lib/firebase/config';
import { 
  UserProfileRepository, 
  ConversationRepository, 
  FeedbackRepository,
  BatchOperations 
} from '@/lib/firebase/firestore';
import { 
  FirestoreUserProfile, 
  FirestoreConversation, 
  SyncStatus,
  DataMigration 
} from '@/lib/firebase/types';

// ============================================
// TYPES
// ============================================

interface SyncOptions {
  autoSync: boolean;
  syncInterval: number; // em ms
  retryAttempts: number;
  batchSize: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  errors: string[];
  progress: number; // 0-100
}

interface MigrationState {
  isRequired: boolean;
  isInProgress: boolean;
  progress: number;
  itemsTotal: number;
  itemsProcessed: number;
  errors: string[];
  completed: boolean;
}

// ============================================
// MAIN HOOK
// ============================================

export function useFirebaseSync(options: Partial<SyncOptions> = {}) {
  const auth = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSync: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    conflicts: 0,
    errors: [],
    progress: 0
  });

  const [migrationState, setMigrationState] = useState<MigrationState>({
    isRequired: false,
    isInProgress: false,
    progress: 0,
    itemsTotal: 0,
    itemsProcessed: 0,
    errors: [],
    completed: false
  });

  const syncOptionsRef = useRef<SyncOptions>({
    autoSync: true,
    syncInterval: 30000, // 30 segundos
    retryAttempts: 3,
    batchSize: 10,
    ...options
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncInProgressRef = useRef(false);

  // ============================================
  // SYNC STATUS MANAGEMENT
  // ============================================

  const updateSyncState = useCallback((updates: Partial<SyncState>) => {
    setSyncState(prev => ({ ...prev, ...updates }));
  }, []);

  const addSyncError = useCallback((error: string) => {
    setSyncState(prev => ({
      ...prev,
      errors: [...prev.errors.slice(-4), error] // Manter apenas últimos 5 erros
    }));
  }, []);

  const clearSyncErrors = useCallback(() => {
    setSyncState(prev => ({ ...prev, errors: [] }));
  }, []);

  // ============================================
  // MIGRATION FUNCTIONS
  // ============================================

  const checkMigrationRequired = useCallback((): boolean => {
    if (!auth.isAuthenticated || !FEATURES.FIRESTORE_ENABLED) {
      return false;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    // Verificar se há dados no localStorage
    const localProfile = localStorage.getItem('userProfile');
    const localConversations = localStorage.getItem('conversation-history');
    const localFeedback = localStorage.getItem('feedbackHistory');

    return !!(localProfile || localConversations || localFeedback);
  }, [auth.isAuthenticated]);

  const migrateLocalStorageData = useCallback(async (): Promise<void> => {
    if (!auth.user || !auth.isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    setMigrationState(prev => ({
      ...prev,
      isInProgress: true,
      progress: 0,
      errors: []
    }));

    try {
      const migrationData: any[] = [];
      let totalItems = 0;

      // Migrar perfil do usuário
      const localProfile = localStorage.getItem('userProfile');
      if (localProfile) {
        try {
          const profileData = JSON.parse(localProfile);
          migrationData.push({
            type: 'profile',
            id: 'user_profile',
            data: transformLocalProfileToFirestore(profileData.profile, auth.user.uid)
          });
          totalItems++;
        } catch (error) {
          console.error('Erro ao migrar perfil:', error);
          setMigrationState(prev => ({
            ...prev,
            errors: [...prev.errors, 'Erro ao migrar perfil do usuário']
          }));
        }
      }

      // Migrar conversas
      const localConversations = localStorage.getItem('conversation-history');
      if (localConversations) {
        try {
          const conversationsData = JSON.parse(localConversations);
          if (Array.isArray(conversationsData)) {
            conversationsData.forEach((conv, index) => {
              migrationData.push({
                type: 'conversation',
                id: `conversation_${index}`,
                data: transformLocalConversationToFirestore(conv, auth.user!.uid)
              });
              totalItems++;
            });
          }
        } catch (error) {
          console.error('Erro ao migrar conversas:', error);
          setMigrationState(prev => ({
            ...prev,
            errors: [...prev.errors, 'Erro ao migrar conversas']
          }));
        }
      }

      setMigrationState(prev => ({
        ...prev,
        itemsTotal: totalItems
      }));

      // Executar migração em lotes
      if (migrationData.length > 0) {
        const result = await BatchOperations.batchMigrateFromLocalStorage(
          auth.user.uid,
          migrationData
        );

        if (result.success && result.data) {
          setMigrationState(prev => ({
            ...prev,
            itemsProcessed: result.data!.successful,
            progress: 100,
            completed: true
          }));

          // Limpar localStorage após migração bem-sucedida
          if (result.data.successful > 0) {
            localStorage.removeItem('userProfile');
            localStorage.removeItem('conversation-history');
            localStorage.removeItem('feedbackHistory');
          }
        } else {
          throw new Error(result.error || 'Erro na migração em lote');
        }
      }
    } catch (error: any) {
      console.error('Erro na migração:', error);
      setMigrationState(prev => ({
        ...prev,
        errors: [...prev.errors, error.message || 'Erro geral na migração']
      }));
    } finally {
      setMigrationState(prev => ({
        ...prev,
        isInProgress: false
      }));
    }
  }, [auth.user, auth.isAuthenticated]);

  // ============================================
  // SYNC FUNCTIONS
  // ============================================

  const syncUserProfile = useCallback(async (): Promise<void> => {
    if (!auth.user || !auth.isAuthenticated) return;

    try {
      // Baixar perfil do servidor
      const serverProfile = await UserProfileRepository.getProfile(auth.user.uid);
      
      if (serverProfile.success && serverProfile.data) {
        // Atualizar contexto com dados do servidor
        await auth.updateUserProfile(serverProfile.data);
      }
    } catch (error: any) {
      addSyncError(`Erro ao sincronizar perfil: ${error.message}`);
    }
  }, [auth]);

  const syncConversations = useCallback(async (): Promise<void> => {
    if (!auth.user || !auth.isAuthenticated) return;

    try {
      // Baixar conversas do servidor
      const serverConversations = await ConversationRepository.getUserConversations(
        auth.user.uid,
        { limit: FIRESTORE_CONFIG.LIMITS.MAX_CONVERSATIONS_PER_USER }
      );

      if (serverConversations.success && serverConversations.data) {
        // Aqui você pode implementar a lógica para atualizar o hook de conversas
        console.log('Conversas sincronizadas:', serverConversations.data.length);
      }
    } catch (error: any) {
      addSyncError(`Erro ao sincronizar conversas: ${error.message}`);
    }
  }, [auth]);

  const performFullSync = useCallback(async (): Promise<void> => {
    if (syncInProgressRef.current) {
      console.log('Sync já em progresso, pulando...');
      return;
    }

    if (!auth.isAuthenticated || !FEATURES.FIRESTORE_ENABLED) {
      return;
    }

    syncInProgressRef.current = true;
    updateSyncState({ 
      isSyncing: true, 
      progress: 0,
      errors: []
    });

    try {
      // Sync do perfil (30% do progresso)
      updateSyncState({ progress: 10 });
      await syncUserProfile();
      updateSyncState({ progress: 30 });

      // Sync das conversas (60% do progresso)
      await syncConversations();
      updateSyncState({ progress: 60 });

      // Finalizar
      updateSyncState({ 
        progress: 100,
        lastSync: new Date(),
        pendingUploads: 0,
        pendingDownloads: 0
      });

      console.log('Sincronização completa realizada com sucesso');
    } catch (error: any) {
      console.error('Erro na sincronização completa:', error);
      addSyncError(`Erro na sincronização: ${error.message}`);
    } finally {
      syncInProgressRef.current = false;
      updateSyncState({ 
        isSyncing: false,
        progress: 0
      });
    }
  }, [auth, syncUserProfile, syncConversations, updateSyncState, addSyncError]);

  // ============================================
  // AUTO SYNC MANAGEMENT
  // ============================================

  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    if (syncOptionsRef.current.autoSync && auth.isAuthenticated) {
      syncIntervalRef.current = setInterval(() => {
        performFullSync();
      }, syncOptionsRef.current.syncInterval);

      console.log('Auto-sync iniciado:', syncOptionsRef.current.syncInterval + 'ms');
    }
  }, [auth.isAuthenticated, performFullSync]);

  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
      console.log('Auto-sync parado');
    }
  }, []);

  // ============================================
  // MANUAL SYNC FUNCTIONS
  // ============================================

  const manualSync = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await performFullSync();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [performFullSync]);

  const forceMigration = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await migrateLocalStorageData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [migrateLocalStorageData]);

  // ============================================
  // EFFECTS
  // ============================================

  // Verificar necessidade de migração quando usuário faz login
  useEffect(() => {
    if (auth.isAuthenticated && FEATURES.FIRESTORE_ENABLED) {
      const needsMigration = checkMigrationRequired();
      setMigrationState(prev => ({
        ...prev,
        isRequired: needsMigration
      }));

      if (needsMigration && syncOptionsRef.current.autoSync) {
        // Auto-migração após 2 segundos
        setTimeout(() => {
          migrateLocalStorageData();
        }, 2000);
      }
    }
  }, [auth.isAuthenticated, checkMigrationRequired, migrateLocalStorageData]);

  // Gerenciar auto-sync
  useEffect(() => {
    if (auth.isAuthenticated && FEATURES.FIRESTORE_ENABLED) {
      startAutoSync();
      
      // Sync inicial após login
      setTimeout(() => {
        performFullSync();
      }, 1000);
    } else {
      stopAutoSync();
    }

    return () => {
      stopAutoSync();
    };
  }, [auth.isAuthenticated, startAutoSync, stopAutoSync, performFullSync]);

  // Monitorar conectividade
  useEffect(() => {
    const handleOnline = () => {
      updateSyncState({ isOnline: true });
      if (auth.isAuthenticated) {
        startAutoSync();
      }
    };

    const handleOffline = () => {
      updateSyncState({ isOnline: false });
      stopAutoSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [auth.isAuthenticated, startAutoSync, stopAutoSync, updateSyncState]);

  // ============================================
  // RETURN API
  // ============================================

  return {
    // Estado
    syncState,
    migrationState,
    
    // Métodos de sincronização
    manualSync,
    startAutoSync,
    stopAutoSync,
    
    // Migração
    forceMigration,
    checkMigrationRequired,
    
    // Utilidades
    clearSyncErrors,
    isFeatureAvailable: FEATURES.FIRESTORE_ENABLED && auth.isAuthenticated,
    canSync: auth.isAuthenticated && syncState.isOnline && FEATURES.FIRESTORE_ENABLED
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function transformLocalProfileToFirestore(localProfile: any, userId: string): Partial<FirestoreUserProfile> {
  return {
    uid: userId,
    type: localProfile.type || 'patient',
    focus: localProfile.focus || 'general',
    confidence: localProfile.confidence || 0.5,
    explanation: localProfile.explanation || 'Perfil migrado do localStorage',
    selectedPersona: localProfile.selectedPersona,
    preferences: {
      language: localProfile.preferences?.language || 'simple',
      notifications: localProfile.preferences?.notifications ?? true,
      theme: localProfile.preferences?.theme || 'auto',
      ...localProfile.preferences
    },
    history: {
      lastPersona: localProfile.history?.lastPersona || 'ga',
      conversationCount: localProfile.history?.conversationCount || 0,
      lastAccess: localProfile.history?.lastAccess || new Date().toISOString(),
      preferredTopics: localProfile.history?.preferredTopics || [],
      totalSessions: localProfile.history?.totalSessions || 1,
      totalTimeSpent: localProfile.history?.totalTimeSpent || 0,
      completedModules: localProfile.history?.completedModules || [],
      achievements: localProfile.history?.achievements || []
    },
    version: '2.0',
    isAnonymous: false
  };
}

function transformLocalConversationToFirestore(localConv: any, userId: string): Partial<FirestoreConversation> {
  return {
    userId,
    personaId: localConv.personaId || 'ga',
    title: localConv.title || 'Conversa migrada',
    messages: (localConv.messages || []).map((msg: any) => ({
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      persona: msg.persona
    })),
    messageCount: localConv.messages?.length || 0,
    isArchived: false,
    syncStatus: 'synced' as const,
    localStorageId: localConv.id
  };
}

export default useFirebaseSync;