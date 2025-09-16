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
}

export interface GamificationHook {
  progress: UserProgress | null;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;

  // Actions
  addPoints: (points: number, category: string, metadata?: any) => Promise<boolean>;
  unlockAchievement: (achievementId: string) => Promise<boolean>;
  updateStreak: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  getAvailableAchievements: () => Promise<Achievement[]>;
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
      console.error('Erro ao carregar progresso:', err);
      setError('Erro ao carregar dados de gamificação');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, calculateLevel]);

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
      console.error('Erro ao carregar conquistas:', error);
      // Usar conquistas padrão em caso de erro
      setAchievements(getDefaultAchievements());
    }
  }, [user, isAuthenticated]);

  /**
   * Carregar leaderboard
   */
  const loadLeaderboard = useCallback(async () => {
    try {
      const leaderboardData = await leaderboardService.getLeaderboard('points', 'monthly', 10);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
    }
  }, []);

  /**
   * Adicionar pontos ao usuário
   */
  const addPoints = useCallback(async (points: number, category: string, metadata?: any): Promise<boolean> => {
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

        // Verificar se desbloqueou novas conquistas
        await checkForNewAchievements(points, category);
      }

      return success;
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
      return false;
    }
  }, [user, isAuthenticated, calculateLevel]);

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
      console.error('Erro ao desbloquear conquista:', error);
      return false;
    }
  }, [user, isAuthenticated]);

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
      console.error('Erro ao atualizar sequência:', error);
      return false;
    }
  }, [user, isAuthenticated]);

  /**
   * Verificar novas conquistas
   */
  const checkForNewAchievements = useCallback(async (points: number, category: string) => {
    // Lógica para verificar se o usuário desbloqueou novas conquistas
    const availableAchievements = await getAvailableAchievements();

    for (const achievement of availableAchievements) {
      if (!achievement.unlockedAt && shouldUnlockAchievement(achievement, points, category)) {
        await unlockAchievement(achievement.id);
      }
    }
  }, [unlockAchievement]);

  /**
   * Verificar se deve desbloquear conquista
   */
  const shouldUnlockAchievement = (achievement: Achievement, points: number, category: string): boolean => {
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
  };

  /**
   * Obter conquistas disponíveis
   */
  const getAvailableAchievements = useCallback(async (): Promise<Achievement[]> => {
    try {
      const available = await apiClient.get<Achievement[]>('/gamification/achievements');
      return available;
    } catch (error) {
      console.error('Erro ao carregar conquistas disponíveis:', error);
      return getDefaultAchievements();
    }
  }, []);

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
    getAvailableAchievements
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
      description: 'Inicie sua primeira conversa com Dr. Gasnelio ou Gá',
      icon: '💬',
      points: 10,
      category: 'conversation'
    },
    {
      id: 'point_collector',
      title: 'Colecionador',
      description: 'Acumule 100 pontos',
      icon: '⭐',
      points: 50,
      category: 'milestone'
    },
    {
      id: 'streak_week',
      title: 'Sequência Semanal',
      description: 'Mantenha uma sequência de 7 dias',
      icon: '🔥',
      points: 30,
      category: 'streak'
    },
    {
      id: 'social_sharer',
      title: 'Compartilhador',
      description: 'Compartilhe seu primeiro certificado',
      icon: '📢',
      points: 20,
      category: 'social'
    }
  ];
}