/**
 * useGamification - Hook para sistema completo de gamificação
 * Integra tracking educacional, achievements e progresso
 * Sincronização automática dependente de autenticação Firebase
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  LearningProgress, 
  Achievement, 
  GamificationNotification,
  QuizAttempt,
  ModuleProgress,
  ExtendedUserProfile,
  LeaderboardEntry
} from '@/types/gamification';
import { UserLevel } from '@/types/disclosure';
import { achievementSystem } from '@/lib/gamification/achievementSystem';
import { hanseniaseQuizzes } from '@/data/quiz/hanseniaseQuestions';
import { gamificationAPI } from '@/services/gamificationAPI';
import { firebaseLeaderboard } from '@/services/firebaseLeaderboard';
import { useNotifications } from '@/components/gamification/NotificationSystem';

interface GamificationHook {
  // State
  progress: LearningProgress | null;
  notifications: GamificationNotification[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  
  // Actions
  recordChatInteraction: (personaUsed: 'ga' | 'dr-gasnelio') => Promise<void>;
  recordQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  recordModuleCompletion: (moduleId: string, timeSpent: number) => Promise<void>;
  recordDailyActivity: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Getters
  getAvailableQuizzes: () => Array<{ quiz: any; isUnlocked: boolean }>;
  getNextAchievements: (limit?: number) => Achievement[];
  getUserRank: () => number;
  canTakeQuiz: (quizId: string) => boolean;
  
  // Management
  forceSync: () => Promise<void>;
  resetProgress: () => Promise<void>;
  subscribeToRealTimeLeaderboard: () => (() => void) | null;
}

const STORAGE_KEY = 'gamificationProgress';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useGamification(): GamificationHook {
  const auth = useAuth();
  
  // Uso opcional do sistema de notificações
  // Note: Hook must be called unconditionally - the provider will handle errors
  const notificationSystem = useNotifications();
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<number>(0);

  // Flags de configuração baseados em autenticação
  const useFirebaseSync = auth.isAuthenticated;
  const useLocalStorage = !useFirebaseSync;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const initializeDefaultProgress = useCallback(() => {
    const defaultProgress: LearningProgress = {
      userId: auth.user?.uid || 'anonymous',
      currentLevel: 'paciente',
      experiencePoints: {
        total: 0,
        byCategory: {
          chat_interactions: 0,
          quiz_completion: 0,
          module_completion: 0,
          streak_bonus: 0,
          achievement_bonus: 0
        },
        level: 0,
        nextLevelXP: 100
      },
      achievements: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString(),
        isActiveToday: false,
        streakBreakGrace: 24
      },
      moduleProgress: initializeModules(),
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
      lastActivity: new Date().toISOString(),
      totalTimeSpent: 0,
      preferredPersona: 'ga'
    };

    setProgress(defaultProgress);
    saveToStorage(defaultProgress, []);
  }, [auth.user]);

  const initializeGamification = useCallback(async () => {
    try {
      setIsLoading(true);
      setSyncStatus('syncing');

      if (useFirebaseSync && auth.user) {
        await loadFromFirebase();
      } else if (useLocalStorage) {
        loadFromLocalStorage();
      }

      // Load leaderboard (sempre público)
      await loadLeaderboard();

    } catch (error) {
      console.error('Erro ao inicializar gamificação:', error);
      setSyncStatus('error');
      
      // Fallback para localStorage se Firebase falhar
      if (useFirebaseSync) {
        loadFromLocalStorage();
      }
    } finally {
      setIsLoading(false);
      setSyncStatus('idle');
    }
  }, [auth.user, initializeDefaultProgress]);

  useEffect(() => {
    initializeGamification();
  }, [auth.isAuthenticated, auth.user, initializeGamification]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.progress) {
          setProgress(data.progress);
        }
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        setLastSync(data.lastSync || 0);
      } else {
        // Initialize with default progress
        initializeDefaultProgress();
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      initializeDefaultProgress();
    }
  }, [initializeDefaultProgress]);

  const loadFromFirebase = async () => {
    if (!auth.user) return;

    try {
      setSyncStatus('syncing');
      
      // Verificar se backend está disponível
      const isBackendOnline = await gamificationAPI.healthCheck();
      
      if (isBackendOnline) {
        // Carregar do backend Flask
        const result = await gamificationAPI.getProgress(auth.user.uid);
        
        if (result.success && result.data) {
          setProgress(result.data);
          
          // Também salvar no localStorage como backup
          if (useLocalStorage) {
            saveToLocalStorageOnly(result.data, notifications);
          }
          
          setSyncStatus('idle');
          return;
        }
      }
      
      // Fallback para localStorage se backend indisponível
      console.warn('Backend indisponível, usando localStorage');
      loadFromLocalStorage();
      
    } catch (error) {
      console.error('Erro ao carregar do Firebase:', error);
      setSyncStatus('error');
      loadFromLocalStorage();
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Prioridade 1: Firebase Leaderboard (real-time)
      if (useFirebaseSync && auth.user) {
        const firebaseResult = await firebaseLeaderboard.getLeaderboard('all_time', 10);
        
        if (firebaseResult.success && firebaseResult.data) {
          // Converter dados do Firebase para formato do componente
          const convertedData: LeaderboardEntry[] = firebaseResult.data.map((entry, index) => ({
            userId: entry.userId,
            displayName: entry.displayName,
            totalXP: entry.totalXP,
            level: entry.level,
            achievementCount: entry.achievementCount,
            currentStreak: entry.currentStreak,
            rank: index + 1,
            badgeHighlight: entry.badgeHighlight || achievementSystem.getAllAchievements()[0]
          }));
          
          setLeaderboard(convertedData);
          return;
        }
      }
      
      // Prioridade 2: Backend Flask
      const isBackendOnline = await gamificationAPI.healthCheck();
      
      if (isBackendOnline) {
        const result = await gamificationAPI.getLeaderboard('all_time', 10);
        
        if (result.success && result.data) {
          setLeaderboard(result.data);
          return;
        }
      }
      
      // Fallback para dados mock se nada estiver disponível
      console.warn('Usando dados mock do leaderboard');
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          userId: 'user1',
          displayName: 'Dr. Silva',
          totalXP: 2500,
          level: 8,
          achievementCount: 15,
          currentStreak: 12,
          rank: 1,
          badgeHighlight: achievementSystem.getAllAchievements()[0]
        },
        {
          userId: 'user2', 
          displayName: 'Enfermeira Ana',
          totalXP: 2200,
          level: 7,
          achievementCount: 12,
          currentStreak: 8,
          rank: 2,
          badgeHighlight: achievementSystem.getAllAchievements()[1]
        },
        {
          userId: 'user3',
          displayName: 'Estudante João',
          totalXP: 1800,
          level: 6,
          achievementCount: 10,
          currentStreak: 5,
          rank: 3,
          badgeHighlight: achievementSystem.getAllAchievements()[2]
        }
      ];

      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
    }
  };

  const initializeModules = (): ModuleProgress[] => {
    return [
      {
        moduleId: 'hanseniase_fundamentals',
        title: 'Fundamentos da Hanseníase',
        userLevel: ['paciente', 'estudante', 'profissional', 'especialista'],
        status: 'available',
        progress: 0,
        timeSpent: 0,
        xpEarned: 0,
        quizScores: [],
        estimatedTimeMinutes: 30,
        prerequisites: []
      },
      {
        moduleId: 'pqtu_protocols',
        title: 'Protocolos PQT-U',
        userLevel: ['estudante', 'profissional', 'especialista'],
        status: 'locked',
        progress: 0,
        timeSpent: 0,
        xpEarned: 0,
        quizScores: [],
        estimatedTimeMinutes: 45,
        prerequisites: ['hanseniase_fundamentals']
      },
      {
        moduleId: 'adverse_effects',
        title: 'Manejo de Efeitos Adversos',
        userLevel: ['profissional', 'especialista'],
        status: 'locked',
        progress: 0,
        timeSpent: 0,
        xpEarned: 0,
        quizScores: [],
        estimatedTimeMinutes: 60,
        prerequisites: ['pqtu_protocols']
      },
      {
        moduleId: 'clinical_cases',
        title: 'Casos Clínicos Complexos',
        userLevel: ['especialista'],
        status: 'locked',
        progress: 0,
        timeSpent: 0,
        xpEarned: 0,
        quizScores: [],
        estimatedTimeMinutes: 90,
        prerequisites: ['adverse_effects']
      }
    ];
  };

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  const saveToLocalStorageOnly = (
    newProgress: LearningProgress, 
    newNotifications: GamificationNotification[]
  ) => {
    try {
      const dataToSave = {
        progress: newProgress,
        notifications: newNotifications,
        lastSync: Date.now(),
        version: '1.0'
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSync(Date.now());
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  const saveToStorage = async (
    newProgress: LearningProgress, 
    newNotifications: GamificationNotification[]
  ) => {
    try {
      setSyncStatus('syncing');

      // Sempre salvar no localStorage primeiro (backup)
      saveToLocalStorageOnly(newProgress, newNotifications);

      // Sincronizar com Firebase Leaderboard se autenticado
      if (useFirebaseSync && auth.user) {
        const displayName = auth.user.displayName || auth.user.email || 'Usuário Anônimo';
        
        const syncResult = await firebaseLeaderboard.syncUserProgress(
          auth.user.uid,
          newProgress,
          displayName
        );
        
        if (syncResult.success) {
          console.log('Leaderboard sincronizado com Firebase');
        } else {
          console.warn('Erro ao sincronizar leaderboard:', syncResult.error);
        }
      }

      // Tentar salvar no backend se online
      if (useFirebaseSync && auth.user) {
        const isBackendOnline = await gamificationAPI.healthCheck();
        
        if (isBackendOnline) {
          const result = await gamificationAPI.saveProgress(auth.user.uid, newProgress);
          
          if (result.success) {
            console.log('Progresso sincronizado com backend');
          } else {
            console.warn('Erro ao sincronizar com backend:', result.error);
          }
        } else {
          console.warn('Backend indisponível - dados salvos localmente');
        }
      }

      setSyncStatus('idle');
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      setSyncStatus('error');
    }
  };

  // ============================================================================
  // ACTIVITY RECORDING
  // ============================================================================

  const recordChatInteraction = async (personaUsed: 'ga' | 'dr-gasnelio') => {
    if (!progress) return;

    try {
      setSyncStatus('syncing');

      const updatedProgress = { ...progress };
      updatedProgress.preferredPersona = personaUsed;
      updatedProgress.lastActivity = new Date().toISOString();

      // Update streak
      const newStreakData = achievementSystem.updateStreakData(
        updatedProgress.streakData,
        true
      );
      updatedProgress.streakData = newStreakData;

      // Recalculate XP and check achievements
      const chatMessages = (updatedProgress.experiencePoints.byCategory.chat_interactions / 5) + 1;
      const { updatedProgress: finalProgress, newAchievements, notifications: newNotifications } = 
        achievementSystem.calculateCompleteProgress(
          updatedProgress.userId,
          { gamification: updatedProgress } as ExtendedUserProfile,
          chatMessages,
          updatedProgress.quizStats,
          updatedProgress.moduleProgress,
          true
        );

      setProgress(finalProgress);
      setNotifications(prev => [...prev, ...newNotifications]);
      
      // Mostrar notificações push para novas conquistas
      if (notificationSystem) {
        newAchievements.forEach(achievement => {
          notificationSystem.showAchievementCelebration(achievement);
        });
      }
      
      // Atualizar leaderboard em tempo real se há conquistas
      if (newAchievements.length > 0 && useFirebaseSync && auth.user) {
        const displayName = auth.user.displayName || auth.user.email || 'Usuário Anônimo';
        
        await firebaseLeaderboard.updateUserEntry(auth.user.uid, {
          userId: auth.user.uid,
          displayName,
          totalXP: finalProgress.experiencePoints.total,
          level: finalProgress.experiencePoints.level,
          achievementCount: finalProgress.achievements.length,
          currentStreak: finalProgress.streakData.currentStreak,
          xpGained: 5, // XP ganho por interação
          badgeHighlight: newAchievements[0] // Highlight do último achievement
        });
      }
      
      await saveToStorage(finalProgress, [...notifications, ...newNotifications]);
      setSyncStatus('idle');

    } catch (error) {
      console.error('Erro ao registrar interação do chat:', error);
      setSyncStatus('error');
    }
  };

  const recordQuizAttempt = async (attempt: QuizAttempt) => {
    if (!progress) return;

    try {
      setSyncStatus('syncing');

      const updatedProgress = { ...progress };
      updatedProgress.lastActivity = new Date().toISOString();

      // Update quiz stats
      const newQuizStats = { ...updatedProgress.quizStats };
      newQuizStats.totalQuizzes += 1;
      if (attempt.isPassed) {
        newQuizStats.completedQuizzes += 1;
      }
      newQuizStats.averageScore = ((newQuizStats.averageScore * (newQuizStats.totalQuizzes - 1)) + attempt.score) / newQuizStats.totalQuizzes;
      newQuizStats.totalXPFromQuizzes += attempt.xpEarned;
      newQuizStats.timeSpentQuizzes += Math.round(attempt.timeSpent / 60); // Convert to minutes
      newQuizStats.lastQuizDate = attempt.completedAt;

      updatedProgress.quizStats = newQuizStats;
      updatedProgress.totalTimeSpent += Math.round(attempt.timeSpent / 60);

      // Update module progress if quiz is related to a module
      const relatedModule = updatedProgress.moduleProgress.find(m => 
        hanseniaseQuizzes.some(q => q.id === attempt.quizId && q.moduleId === m.moduleId)
      );
      
      if (relatedModule && attempt.isPassed) {
        relatedModule.quizScores.push(attempt.score);
        relatedModule.progress = Math.min(100, relatedModule.progress + 25); // 25% per passed quiz
        if (relatedModule.progress === 100) {
          relatedModule.status = 'completed';
          relatedModule.completedAt = new Date().toISOString();
        }
      }

      // Recalculate XP and achievements
      const { updatedProgress: finalProgress, newAchievements, notifications: newNotifications } = 
        achievementSystem.calculateCompleteProgress(
          updatedProgress.userId,
          { gamification: updatedProgress } as ExtendedUserProfile,
          updatedProgress.experiencePoints.byCategory.chat_interactions / 5,
          newQuizStats,
          updatedProgress.moduleProgress,
          true
        );

      setProgress(finalProgress);
      setNotifications(prev => [...prev, ...newNotifications]);
      
      // Atualizar leaderboard em tempo real para quiz bem-sucedido
      if (attempt.isPassed && useFirebaseSync && auth.user) {
        const displayName = auth.user.displayName || auth.user.email || 'Usuário Anônimo';
        
        await firebaseLeaderboard.updateUserEntry(auth.user.uid, {
          userId: auth.user.uid,
          displayName,
          totalXP: finalProgress.experiencePoints.total,
          level: finalProgress.experiencePoints.level,
          achievementCount: finalProgress.achievements.length,
          currentStreak: finalProgress.streakData.currentStreak,
          xpGained: attempt.xpEarned,
          badgeHighlight: newAchievements.length > 0 ? newAchievements[0] : undefined
        });
      }
      
      await saveToStorage(finalProgress, [...notifications, ...newNotifications]);
      setSyncStatus('idle');

    } catch (error) {
      console.error('Erro ao registrar tentativa de quiz:', error);
      setSyncStatus('error');
    }
  };

  const recordModuleCompletion = async (moduleId: string, timeSpent: number) => {
    if (!progress) return;

    try {
      setSyncStatus('syncing');

      const updatedProgress = { ...progress };
      updatedProgress.lastActivity = new Date().toISOString();
      updatedProgress.totalTimeSpent += timeSpent;

      // Update specific module
      const moduleIndex = updatedProgress.moduleProgress.findIndex(m => m.moduleId === moduleId);
      if (moduleIndex !== -1) {
        updatedProgress.moduleProgress[moduleIndex].status = 'completed';
        updatedProgress.moduleProgress[moduleIndex].progress = 100;
        updatedProgress.moduleProgress[moduleIndex].completedAt = new Date().toISOString();
        updatedProgress.moduleProgress[moduleIndex].timeSpent += timeSpent;
        updatedProgress.moduleProgress[moduleIndex].xpEarned += 100; // Base module XP
      }

      // Unlock next modules
      unlockNextModules(updatedProgress.moduleProgress);

      // Recalculate XP and achievements
      const completedModules = updatedProgress.moduleProgress.filter(m => m.status === 'completed').length;
      const { updatedProgress: finalProgress, newAchievements, notifications: newNotifications } = 
        achievementSystem.calculateCompleteProgress(
          updatedProgress.userId,
          { gamification: updatedProgress } as ExtendedUserProfile,
          updatedProgress.experiencePoints.byCategory.chat_interactions / 5,
          updatedProgress.quizStats,
          updatedProgress.moduleProgress,
          true
        );

      setProgress(finalProgress);
      setNotifications(prev => [...prev, ...newNotifications]);
      
      await saveToStorage(finalProgress, [...notifications, ...newNotifications]);
      setSyncStatus('idle');

    } catch (error) {
      console.error('Erro ao registrar conclusão de módulo:', error);
      setSyncStatus('error');
    }
  };

  const recordDailyActivity = async () => {
    if (!progress) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = new Date(progress.lastActivity).toISOString().split('T')[0];
      
      if (today === lastActivity) return; // Already recorded today

      setSyncStatus('syncing');

      const updatedProgress = { ...progress };
      updatedProgress.lastActivity = new Date().toISOString();

      // Update streak
      const newStreakData = achievementSystem.updateStreakData(
        updatedProgress.streakData,
        true
      );
      updatedProgress.streakData = newStreakData;

      // Check for streak achievements
      const { updatedProgress: finalProgress, newAchievements, notifications: newNotifications } = 
        achievementSystem.calculateCompleteProgress(
          updatedProgress.userId,
          { gamification: updatedProgress } as ExtendedUserProfile,
          updatedProgress.experiencePoints.byCategory.chat_interactions / 5,
          updatedProgress.quizStats,
          updatedProgress.moduleProgress,
          true
        );

      setProgress(finalProgress);
      setNotifications(prev => [...prev, ...newNotifications]);
      
      await saveToStorage(finalProgress, [...notifications, ...newNotifications]);
      setSyncStatus('idle');

    } catch (error) {
      console.error('Erro ao registrar atividade diária:', error);
      setSyncStatus('error');
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const unlockNextModules = (modules: ModuleProgress[]) => {
    modules.forEach(module => {
      if (module.status === 'locked') {
        const prerequisitesMet = module.prerequisites.every(prereqId =>
          modules.find(m => m.moduleId === prereqId && m.status === 'completed')
        );
        
        if (prerequisitesMet) {
          module.status = 'available';
        }
      }
    });
  };

  // ============================================================================
  // NOTIFICATION MANAGEMENT
  // ============================================================================

  const markNotificationRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map((n: GamificationNotification) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    setNotifications(updatedNotifications);
    
    if (progress) {
      await saveToStorage(progress, updatedNotifications);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    
    if (progress) {
      await saveToStorage(progress, []);
    }
  };

  // ============================================================================
  // GETTERS
  // ============================================================================

  const getAvailableQuizzes = () => {
    if (!progress) return [];

    return hanseniaseQuizzes.map(quiz => ({
      quiz,
      isUnlocked: quiz.difficulty === progress.currentLevel ||
                  (quiz.difficulty === 'estudante' && ['estudante', 'profissional', 'especialista'].includes(progress.currentLevel)) ||
                  (quiz.difficulty === 'profissional' && ['profissional', 'especialista'].includes(progress.currentLevel)) ||
                  (quiz.difficulty === 'especialista' && progress.currentLevel === 'especialista')
    }));
  };

  const getNextAchievements = (limit: number = 3): Achievement[] => {
    if (!progress) return [];

    const allAchievements = achievementSystem.getAllAchievements();
    const unlockedIds = progress.achievements.map(a => a.id);
    
    return allAchievements
      .filter(achievement => !unlockedIds.includes(achievement.id))
      .slice(0, limit);
  };

  const getUserRank = (): number => {
    if (!progress) return 0;
    
    // Se há dados do leaderboard, usar para calcular rank
    if (leaderboard.length > 0) {
      const userRank = leaderboard.findIndex(entry => entry.userId === progress.userId) + 1;
      return userRank || 0;
    }
    
    return 0;
  };

  const canTakeQuiz = (quizId: string): boolean => {
    if (!progress) return false;

    const quiz = hanseniaseQuizzes.find(q => q.id === quizId);
    if (!quiz) return false;

    // Check if user level allows this quiz
    const levelOrder: UserLevel[] = ['paciente', 'estudante', 'profissional', 'especialista'];
    const userLevelIndex = levelOrder.indexOf(progress.currentLevel);
    const quizLevelIndex = levelOrder.indexOf(quiz.difficulty);

    return userLevelIndex >= quizLevelIndex;
  };

  // ============================================================================
  // MANAGEMENT
  // ============================================================================

  const forceSync = async () => {
    if (useFirebaseSync && auth.user) {
      await loadFromFirebase();
    }
    await loadLeaderboard();
  };

  const resetProgress = async () => {
    if (useLocalStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // Firebase reset would go here
    
    initializeDefaultProgress();
    setNotifications([]);
  };

  const subscribeToRealTimeLeaderboard = (): (() => void) | null => {
    if (!useFirebaseSync || !auth.user) {
      return null;
    }

    try {
      const unsubscribe = firebaseLeaderboard.subscribeToLeaderboard(
        (entries) => {
          // Converter dados do Firebase para formato do componente
          const convertedData: LeaderboardEntry[] = entries.map((entry, index) => ({
            userId: entry.userId,
            displayName: entry.displayName,
            totalXP: entry.totalXP,
            level: entry.level,
            achievementCount: entry.achievementCount,
            currentStreak: entry.currentStreak,
            rank: index + 1,
            badgeHighlight: entry.badgeHighlight || achievementSystem.getAllAchievements()[0]
          }));
          
          setLeaderboard(convertedData);
        },
        'all_time',
        10
      );

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao subscrever leaderboard:', error);
      return null;
    }
  };

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // State
    progress,
    notifications,
    leaderboard,
    isLoading,
    syncStatus,
    
    // Actions
    recordChatInteraction,
    recordQuizAttempt,
    recordModuleCompletion,
    recordDailyActivity,
    markNotificationRead,
    clearAllNotifications,
    
    // Getters
    getAvailableQuizzes,
    getNextAchievements,
    getUserRank,
    canTakeQuiz,
    
    // Management
    forceSync,
    resetProgress,
    subscribeToRealTimeLeaderboard
  };
}