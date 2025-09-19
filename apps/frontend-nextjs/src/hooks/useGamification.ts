/**
 * Gamification Hook - Sistema de Gamificação Baseado em API
 * Substitui Firebase com sistema de pontuação e conquistas via API
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { leaderboardService, type LeaderboardEntry } from '@/services/leaderboardService';
import { apiClient } from '@/services/api';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  category: 'conversation' | 'learning' | 'streak' | 'social' | 'milestone';
  // Compatibility properties for ShareProgress.tsx
  name: string;  // Same as title
  earnedAt?: string;  // Same as unlockedAt
}

export interface PointsMetadata {
  source?: string;
  activityId?: string;
  sessionId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeSpent?: number;
  accuracy?: number;
  [key: string]: unknown;
}

export interface UserProgress {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  currentLevelPoints: number;
  maxLevelPoints: number;
  streak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: string[];
  rank?: number;
  totalUsers?: number;
  // Additional properties for ProgressData compatibility
  completedModules?: number;
  certificates?: Array<{
    id: string;
    name: string;
    earnedAt: string;
    description?: string;
  }>;
  recentActivity?: Array<{
    type: 'conversation' | 'module' | 'certificate';
    title: string;
    completedAt: string;
  }>;
}

export interface GamificationHook {
  progress: UserProgress | null;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;

  // Actions
  addPoints: (points: number, category: string, metadata?: PointsMetadata) => Promise<boolean>;
  unlockAchievement: (achievementId: string) => Promise<boolean>;
  updateStreak: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  getAvailableAchievements: () => Promise<Achievement[]>;
  checkForNewAchievements: (points: number, category: string) => Promise<void>;
}

export function useGamification(): GamificationHook {
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcular nível baseado na pontuação
   */
  const calculateLevel = useCallback((totalPoints: number) => {
    // Fórmula: level = floor(sqrt(points / 100))
    const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1;
    const currentLevelPoints = totalPoints - (Math.pow(level - 1, 2) * 100);
    const maxLevelPoints = (Math.pow(level, 2) * 100) - (Math.pow(level - 1, 2) * 100);
    const pointsToNextLevel = maxLevelPoints - currentLevelPoints;

    return {
      level,
      currentLevelPoints,
      maxLevelPoints,
      pointsToNextLevel
    };
  }, []);

  /**
   * Carregar conquistas do usuário
   */
  const loadUserAchievements = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const userAchievements = await apiClient.get<Achievement[]>(`/gamification/user/${user.uid}/achievements`);
      setAchievements(userAchievements);

      // Atualizar progresso com conquistas
      setProgress(prev => prev ? { ...prev, achievements: userAchievements } : null);
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_achievements_error', {
          event_category: 'medical_gamification',
          event_label: 'achievements_load_failed',
          custom_parameters: {
            medical_context: 'achievements_system',
            error_type: 'achievements_loading'
          }
        });
      }
      // Usar conquistas padrão em caso de erro
      setAchievements(getDefaultAchievements());
    }
  }, [user, isAuthenticated]);

  /**
   * Carregar dados de progresso do usuário
   */
  const loadUserProgress = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProgress(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Carregar estatísticas do usuário
      const userStats = await leaderboardService.getUserStats(user.uid);

      if (userStats) {
        const levelInfo = calculateLevel(userStats.stats.totalPoints);

        setProgress({
          ...levelInfo,
          totalPoints: userStats.stats.totalPoints,
          streak: userStats.stats.streakDays,
          longestStreak: userStats.stats.streakDays, // TODO: Implementar no backend
          achievements: [], // Será carregado separadamente
          badges: userStats.badges,
          rank: userStats.rank,
          totalUsers: undefined // TODO: Implementar no backend
        });
      }

      // Carregar conquistas do usuário
      await loadUserAchievements();

    } catch (err) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_load_error', {
          event_category: 'medical_gamification',
          event_label: 'user_progress_load_failed',
          custom_parameters: {
            medical_context: 'gamification_system',
            error_type: 'progress_loading'
          }
        });
      }
      setError('Erro ao carregar dados de gamificação');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, calculateLevel, loadUserAchievements]);

  /**
   * Carregar leaderboard
   */
  const loadLeaderboard = useCallback(async () => {
    try {
      const leaderboardData = await leaderboardService.getLeaderboard('points', 'monthly', 10);
      setLeaderboard(leaderboardData);
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_leaderboard_error', {
          event_category: 'medical_gamification',
          event_label: 'leaderboard_load_failed',
          custom_parameters: {
            medical_context: 'leaderboard_system',
            error_type: 'leaderboard_loading'
          }
        });
      }
    }
  }, []);

  /**
   * Verificar se deve desbloquear conquista
   */
  const shouldUnlockAchievement = useCallback((achievement: Achievement, points: number, category: string): boolean => {
    // Implementar lógica de desbloqueio baseada nos critérios da conquista
    switch (achievement.id) {
      case 'first_conversation':
        return category === 'conversation' && points > 0;
      case 'point_collector':
        return Boolean(progress && progress.totalPoints >= 100);
      case 'streak_week':
        return Boolean(progress && progress.streak >= 7);
      default:
        return false;
    }
  }, [progress]);

  /**
   * Desbloquear conquista
   */
  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const success = await leaderboardService.recordAchievement(user.uid, {
        type: 'achievement_unlock',
        value: 1,
        metadata: { achievementId }
      });

      if (success) {
        // Atualizar conquistas locais
        setAchievements(prev => prev.map(achievement =>
          achievement.id === achievementId
            ? { ...achievement, unlockedAt: new Date().toISOString() }
            : achievement
        ));
      }

      return success;
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_unlock_error', {
          event_category: 'medical_gamification',
          event_label: 'achievement_unlock_failed',
          custom_parameters: {
            medical_context: 'achievement_unlock',
            error_type: 'achievement_operation'
          }
        });
      }
      return false;
    }
  }, [user, isAuthenticated]);

  /**
   * Obter conquistas disponíveis
   */
  const getAvailableAchievements = useCallback(async (): Promise<Achievement[]> => {
    try {
      const available = await apiClient.get<Achievement[]>('/gamification/achievements');
      return available;
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_available_error', {
          event_category: 'medical_gamification',
          event_label: 'available_achievements_load_failed',
          custom_parameters: {
            medical_context: 'available_achievements',
            error_type: 'available_loading'
          }
        });
      }
      return getDefaultAchievements();
    }
  }, []);

  /**
   * Adicionar pontos ao usuário
   */
  const addPoints = useCallback(async (points: number, category: string, metadata?: PointsMetadata): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const success = await leaderboardService.updateUserScore(user.uid, {
        category,
        points,
        metadata
      });

      if (success) {
        // Atualizar progresso local
        setProgress(prev => {
          if (!prev) return null;

          const newTotalPoints = prev.totalPoints + points;
          const levelInfo = calculateLevel(newTotalPoints);

          return {
            ...prev,
            ...levelInfo,
            totalPoints: newTotalPoints
          };
        });

        // Verificar se desbloqueou novas conquistas (inline)
        const availableAchievements = await getAvailableAchievements();
        for (const achievement of availableAchievements) {
          if (!achievement.unlockedAt && shouldUnlockAchievement(achievement, points, category)) {
            await unlockAchievement(achievement.id);
          }
        }
      }

      return success;
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_points_error', {
          event_category: 'medical_gamification',
          event_label: 'points_addition_failed',
          custom_parameters: {
            medical_context: 'points_system',
            error_type: 'points_operation'
          }
        });
      }
      return false;
    }
  }, [user, isAuthenticated, calculateLevel, getAvailableAchievements, shouldUnlockAchievement, unlockAchievement]);

  /**
   * Atualizar sequência de dias
   */
  const updateStreak = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const success = await leaderboardService.recordAchievement(user.uid, {
        type: 'daily_streak',
        value: 1
      });

      if (success) {
        setProgress(prev => prev ? { ...prev, streak: prev.streak + 1 } : null);
      }

      return success;
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'gamification_streak_error', {
          event_category: 'medical_gamification',
          event_label: 'streak_update_failed',
          custom_parameters: {
            medical_context: 'streak_system',
            error_type: 'streak_operation'
          }
        });
      }
      return false;
    }
  }, [user, isAuthenticated]);

  /**
   * Verificar novas conquistas (função exportada)
   */
  const checkForNewAchievements = useCallback(async (points: number, category: string) => {
    const availableAchievements = await getAvailableAchievements();
    for (const achievement of availableAchievements) {
      if (!achievement.unlockedAt && shouldUnlockAchievement(achievement, points, category)) {
        await unlockAchievement(achievement.id);
      }
    }
  }, [getAvailableAchievements, shouldUnlockAchievement, unlockAchievement]);

  /**
   * Atualizar todos os dados
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadUserProgress(),
      loadLeaderboard()
    ]);
  }, [loadUserProgress, loadLeaderboard]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setProgress(null);
      setAchievements([]);
      setLeaderboard([]);
      setLoading(false);
    }
  }, [isAuthenticated, refreshData]);

  return {
    progress,
    achievements,
    leaderboard,
    loading,
    error,
    addPoints,
    unlockAchievement,
    updateStreak,
    refreshData,
    getAvailableAchievements,
    checkForNewAchievements
  };
}

/**
 * Conquistas padrão/fallback
 */
function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: 'first_conversation',
      title: 'Primeira Conversa',
      name: 'Primeira Conversa',
      description: 'Inicie sua primeira conversa com Dr. Gasnelio ou Gá',
      icon: '💬',
      points: 10,
      category: 'conversation'
    },
    {
      id: 'point_collector',
      title: 'Colecionador',
      name: 'Colecionador',
      description: 'Acumule 100 pontos',
      icon: '⭐',
      points: 50,
      category: 'milestone'
    },
    {
      id: 'streak_week',
      title: 'Sequência Semanal',
      name: 'Sequência Semanal',
      description: 'Mantenha uma sequência de 7 dias',
      icon: '🔥',
      points: 30,
      category: 'streak'
    },
    {
      id: 'social_sharer',
      title: 'Compartilhador',
      name: 'Compartilhador',
      description: 'Compartilhe seu primeiro certificado',
      icon: '📢',
      points: 20,
      category: 'social'
    }
  ];
}