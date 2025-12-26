/**
 * useBackendSync Hook
 * Gerencia sincronização entre localStorage e backend API
 * Implementa migração automática e gamificação
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
import { backendLeaderboard } from '@/services/backendLeaderboard';
import { generateSecureId } from '@/utils/cryptoUtils';
import type { LearningProgress } from '@/types/gamification';
import type { UserLevel } from '@/types/disclosure';
import type { BackendUserProfile } from '@/types/auth';

// ============================================
// TYPES
// ============================================

interface BackendConversation {
  userId: string;
  personaId: string;
  title: string;
  lastMessage: string;
  lastInteraction: string;
  messageCount: number;
  status: string;
  metadata?: {
    source?: string;
    version?: string;
  };
  messages?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

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

export function useBackendSync(options: Partial<SyncOptions> = {}) {
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
    if (!auth.isAuthenticated) {
      return false;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    // Verificar se há dados no localStorage
    const localProfile = safeLocalStorage()?.getItem('userProfile');
    const localConversations = safeLocalStorage()?.getItem('conversation-history');
    const localFeedback = safeLocalStorage()?.getItem('feedbackHistory');

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
      const localProfile = safeLocalStorage()?.getItem('userProfile');
      if (localProfile) {
        try {
          const profileData = JSON.parse(localProfile);
          migrationData.push({
            type: 'profile',
            id: 'user_profile',
            data: transformLocalProfileToBackend(profileData.profile, auth.user.uid)
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
      const localConversations = safeLocalStorage()?.getItem('conversation-history');
      if (localConversations) {
        try {
          const conversationsData = JSON.parse(localConversations);
          if (Array.isArray(conversationsData)) {
            conversationsData.forEach((conv, index) => {
              migrationData.push({
                type: 'conversation',
                id: `conversation_${index}`,
                data: transformLocalConversationToBackend(conv, auth.user!.uid)
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

      // Migração para gamificação no backend
      if (migrationData.length > 0) {
        let successful = 0;

        for (const item of migrationData) {
          try {
            if (item.type === 'profile' && item.data) {
              // Sincronizar progresso com gamificação
              const progress: LearningProgress = {
                userId: auth.user.uid,
                currentLevel: 'basic' as UserLevel,
                experiencePoints: {
                  total: item.data.history?.totalTimeSpent || 0,
                  byCategory: {
                    chat_interactions: 0,
                    quiz_completion: 0,
                    module_completion: 0,
                    case_completion: 0,
                    streak_bonus: 0,
                    achievement_bonus: 0
                  },
                  level: 1,
                  nextLevelXP: 100
                },
                achievements: [],
                streakData: {
                  currentStreak: 0,
                  longestStreak: 0,
                  lastActivityDate: new Date().toISOString(),
                  isActiveToday: false,
                  streakBreakGrace: 0
                },
                moduleProgress: [],
                quizStats: {
                  totalQuizzes: 0,
                  completedQuizzes: 0,
                  averageScore: 0,
                  totalXPFromQuizzes: 0,
                  bestStreak: 0,
                  currentStreak: 0,
                  favoriteTopics: [],
                  weakestTopics: [],
                  timeSpentQuizzes: 0
                },
                caseStats: {
                  totalCases: 0,
                  completedCases: 0,
                  averageScore: 0,
                  totalXPFromCases: 0,
                  casesPassedFirstAttempt: 0,
                  bestDiagnosticStreak: 0,
                  currentDiagnosticStreak: 0,
                  categoriesCompleted: {
                    pediatrico: 0,
                    adulto: 0,
                    gravidez: 0,
                    complicacoes: 0,
                    interacoes: 0
                  },
                  difficultyCompleted: {
                    basico: 0,
                    intermediario: 0,
                    avancado: 0,
                    complexo: 0
                  },
                  averageTimePerCase: 0,
                  fastestCompletion: 0,
                  timeSpentCases: 0,
                  favoriteCategories: [],
                  strongestSkills: [],
                  areasForImprovement: []
                },
                lastActivity: new Date().toISOString(),
                totalTimeSpent: item.data.history?.totalTimeSpent || 0,
                preferredPersona: 'ga',
                totalXP: item.data.history?.totalTimeSpent || 0,
                completedCases: [],
                unlockedAchievements: [],
                streakDays: 0,
                progressPercentage: 0,
                nextLevelXP: 100
              };

              const displayName = item.data.displayName || auth.user.displayName || 'Usuário';
              await backendLeaderboard.syncUserProgress(auth.user.uid, progress, displayName);
              successful++;
            }

            setMigrationState(prev => ({
              ...prev,
              itemsProcessed: successful,
              progress: Math.round((successful / totalItems) * 100)
            }));
          } catch (error) {
            console.error('Erro ao migrar item:', error);
          }
        }

        if (successful > 0) {
          setMigrationState(prev => ({
            ...prev,
            itemsProcessed: successful,
            progress: 100,
            completed: true
          }));

          // Limpar localStorage após migração bem-sucedida
          safeLocalStorage()?.removeItem('userProfile');
          safeLocalStorage()?.removeItem('conversation-history');
          safeLocalStorage()?.removeItem('feedbackHistory');
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
      // Obter progresso do usuário via backend API
      const userProgress = await backendLeaderboard.getUserProgress(auth.user.uid);

      if (userProgress.success && userProgress.data) {
        // Atualizar contexto com dados de progresso
        console.log('Progresso do usuário sincronizado:', userProgress.data);
      }
    } catch (error: any) {
      addSyncError(`Erro ao sincronizar perfil: ${error.message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const syncConversations = useCallback(async (): Promise<void> => {
    if (!auth.user || !auth.isAuthenticated) return;

    try {
      // Registrar atividade de conversa se houver dados locais
      const localConversations = safeLocalStorage()?.getItem('conversation-history');
      if (localConversations) {
        const conversations = JSON.parse(localConversations);
        if (Array.isArray(conversations) && conversations.length > 0) {
          // Registrar atividade de uso
          await backendLeaderboard.recordActivity(
            auth.user.uid,
            auth.user.displayName || 'Usuário',
            'chat_completion',
            { conversations_count: conversations.length }
          );
        }
      }

      console.log('Sincronização de conversas realizada');
    } catch (error: any) {
      addSyncError(`Erro ao sincronizar conversas: ${error.message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const performFullSync = useCallback(async (): Promise<void> => {
    if (syncInProgressRef.current) {
      console.log('Sync já em progresso, pulando...');
      return;
    }

    if (!auth.isAuthenticated) {
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
    if (auth.isAuthenticated) {
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
    if (auth.isAuthenticated) {
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
    isFeatureAvailable: auth.isAuthenticated,
    canSync: auth.isAuthenticated && syncState.isOnline
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function transformLocalProfileToBackend(localProfile: any, userId: string): Partial<BackendUserProfile> {
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
    version: '2.0'
  };
}

function transformLocalConversationToBackend(localConv: any, userId: string): Partial<BackendConversation> {
  return {
    userId,
    personaId: localConv.personaId || 'ga',
    title: localConv.title || 'Conversa migrada',
    messages: (localConv.messages || []).map((msg: any) => ({
      id: msg.id || generateSecureId('msg_', 12),
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      persona: msg.persona
    })),
    messageCount: localConv.messages?.length || 0
  };
}

export default useBackendSync;