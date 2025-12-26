/**
 * Leaderboard Service - API-based Ranking System
 * Sistema de ranking via backend API
 */

import { apiClient } from '@/services/api';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  rank: number;
  stats: {
    totalConversations: number;
    certificatesEarned: number;
    streakDays: number;
    averageRating: number;
    totalPoints: number;
  };
  badges: string[];
  lastActive: string;
}

export interface LeaderboardCategory {
  id: string;
  name: string;
  description: string;
  scoreType: 'conversations' | 'certificates' | 'streak' | 'points' | 'rating';
  period: 'all-time' | 'monthly' | 'weekly' | 'daily';
}

export interface UserRankResponse {
  rank: number;
  score: number;
  total: number;
}

export interface ScoreMetadata {
  source?: string;
  activity_type?: string;
  module_id?: string;
  quiz_score?: number;
  completion_time?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  [key: string]: unknown;
}

class LeaderboardService {
  private cache: { [key: string]: { data: LeaderboardEntry[]; timestamp: number } } = {};
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Obter ranking geral
   */
  async getLeaderboard(
    category: string = 'points',
    period: string = 'monthly',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `${category}-${period}-${limit}`;

    // Verificar cache
    if (this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey].data;
    }

    try {
      const response = await apiClient.get<LeaderboardEntry[]>(
        `/leaderboard/${category}?period=${period}&limit=${limit}`
      );

      // Atualizar cache
      this.cache[cacheKey] = {
        data: response,
        timestamp: Date.now()
      };

      return response;
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
      return this.getFallbackLeaderboard();
    }
  }

  /**
   * Obter posição do usuário no ranking
   */
  async getUserRank(uid: string, category: string = 'points'): Promise<{
    rank: number;
    score: number;
    total: number;
  } | null> {
    try {
      const response = await apiClient.get<UserRankResponse>(`/leaderboard/user/${uid}/rank?category=${category}`);
      return response;
    } catch (error) {
      console.error('Erro ao carregar rank do usuário:', error);
      return null;
    }
  }

  /**
   * Obter categorias disponíveis
   */
  async getCategories(): Promise<LeaderboardCategory[]> {
    try {
      const response = await apiClient.get<LeaderboardCategory[]>('/leaderboard/categories');
      return response;
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Atualizar pontuação do usuário
   */
  async updateUserScore(uid: string, scoreUpdate: {
    category: string;
    points: number;
    metadata?: ScoreMetadata;
  }): Promise<boolean> {
    try {
      await apiClient.post(`/leaderboard/user/${uid}/score`, scoreUpdate);

      // Invalidar cache relevante
      Object.keys(this.cache).forEach(key => {
        if (key.includes(scoreUpdate.category)) {
          delete this.cache[key];
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar pontuação:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(uid: string): Promise<LeaderboardEntry | null> {
    try {
      const response = await apiClient.get<LeaderboardEntry>(`/leaderboard/user/${uid}/stats`);
      return response;
    } catch (error) {
      console.error('Erro ao carregar estatísticas do usuário:', error);
      return null;
    }
  }

  /**
   * Registrar conquista
   */
  async recordAchievement(uid: string, achievement: {
    type: string;
    value: number;
    metadata?: ScoreMetadata;
  }): Promise<boolean> {
    try {
      await apiClient.post(`/leaderboard/user/${uid}/achievement`, achievement);
      return true;
    } catch (error) {
      console.error('Erro ao registrar conquista:', error);
      return false;
    }
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Leaderboard fallback em caso de erro
   */
  private getFallbackLeaderboard(): LeaderboardEntry[] {
    return [
      {
        uid: 'demo-1',
        displayName: 'Usuário Exemplo',
        score: 1000,
        rank: 1,
        stats: {
          totalConversations: 50,
          certificatesEarned: 5,
          streakDays: 30,
          averageRating: 4.8,
          totalPoints: 1000
        },
        badges: ['early-adopter', 'conversation-master'],
        lastActive: new Date().toISOString()
      }
    ];
  }

  /**
   * Categorias padrão
   */
  private getDefaultCategories(): LeaderboardCategory[] {
    return [
      {
        id: 'points',
        name: 'Pontuação Geral',
        description: 'Ranking baseado na pontuação total acumulada',
        scoreType: 'points',
        period: 'all-time'
      },
      {
        id: 'conversations',
        name: 'Conversas Realizadas',
        description: 'Ranking baseado no número de conversas com IA',
        scoreType: 'conversations',
        period: 'monthly'
      },
      {
        id: 'certificates',
        name: 'Certificados Obtidos',
        description: 'Ranking baseado no número de certificados conquistados',
        scoreType: 'certificates',
        period: 'all-time'
      },
      {
        id: 'streak',
        name: 'Sequência de Dias',
        description: 'Ranking baseado na sequência de dias ativos',
        scoreType: 'streak',
        period: 'all-time'
      }
    ];
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache = {};
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;