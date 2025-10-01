/**
 * Gamification API Service - Integração com Backend Flask
 * Conecta sistema de gamificação frontend com APIs do backend
 * Suporte a fallback para localStorage quando backend indisponível
 */

import type {
  LearningProgress,
  Achievement,
  GamificationNotification,
  QuizAttempt,
  LeaderboardEntry,
  ModuleProgress
} from '../types/gamification';

interface ActivityMetadata {
  module_id?: string;
  quiz_id?: string;
  question_count?: number;
  completion_time?: number;
  streak_day?: number;
  [key: string]: unknown;
}

interface SyncConflict {
  field: string;
  localValue: unknown;
  serverValue: unknown;
  resolvedValue: unknown;
  resolution: 'local' | 'server' | 'merged';
  timestamp: string;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface GamificationEndpoints {
  progress: string;
  achievements: string;
  leaderboard: string;
  quiz: string;
  notifications: string;
  sync: string;
}

class GamificationAPI {
  private baseURL: string;
  private endpoints: GamificationEndpoints;
  private timeout: number;

  constructor() {
    // URLs do backend Flask com fallback
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    this.baseURL = (envUrl && envUrl.trim() !== '') ? envUrl.trim() : '';
    
    // Endpoints versionados conforme backend Flask
    this.endpoints = {
      progress: '/api/v1/gamification/progress',
      achievements: '/api/v1/gamification/achievements', 
      leaderboard: '/api/v1/gamification/leaderboard',
      quiz: '/api/v1/gamification/quiz',
      notifications: '/api/v1/gamification/notifications',
      sync: '/api/v1/gamification/sync'
    };
    this.timeout = 8000; // 8 seconds
  }

  // ============================================================================
  // PROGRESS MANAGEMENT
  // ============================================================================

  /**
   * Buscar progresso do usuário
   */
  async getProgress(userId: string): Promise<APIResponse<LearningProgress>> {
    // Se backend indisponível, retornar erro para usar fallback
    if (!this.baseURL || this.baseURL.trim() === '') {
      console.info('[Gamification] Backend offline - usando localStorage');
      return {
        success: false,
        error: 'Backend temporariamente indisponível - modo offline ativo'
      };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.progress}/${userId}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse<LearningProgress>(response);
    } catch (error) {
      console.error('[Gamification] Erro ao buscar progresso:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Salvar progresso do usuário
   */
  async saveProgress(userId: string, progress: LearningProgress): Promise<APIResponse<LearningProgress>> {
    // Se backend indisponível, simular sucesso para usar localStorage
    if (!this.baseURL || this.baseURL.trim() === '') {
      console.info('[Gamification] Salvando apenas no localStorage - backend offline');
      return {
        success: true,
        data: progress,
        message: 'Dados salvos localmente - sincronização pendente'
      };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.progress}/${userId}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ progress })
        }
      );

      return await this.handleResponse<LearningProgress>(response);
    } catch (error) {
      console.error('[Gamification] Erro ao salvar progresso:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Atualizar XP do usuário
   */
  async updateExperience(
    userId: string, 
    activity: 'chat' | 'quiz' | 'module' | 'streak',
    points: number,
    metadata?: ActivityMetadata
  ): Promise<APIResponse<{ newXP: number; newLevel: number; achievements: Achievement[] }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.progress}/${userId}/xp`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ activity, points, metadata })
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao atualizar XP:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================================================
  // ACHIEVEMENTS MANAGEMENT
  // ============================================================================

  /**
   * Buscar conquistas disponíveis
   */
  async getAchievements(userId: string): Promise<APIResponse<Achievement[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.achievements}/${userId}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse<Achievement[]>(response);
    } catch (error) {
      console.error('Erro ao buscar achievements:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Verificar e desbloquear novas conquistas
   */
  async checkAchievements(
    userId: string, 
    progress: LearningProgress
  ): Promise<APIResponse<{ newAchievements: Achievement[]; notifications: GamificationNotification[] }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.achievements}/${userId}/check`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ progress })
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao verificar achievements:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================================================
  // QUIZ MANAGEMENT
  // ============================================================================

  /**
   * Submeter tentativa de quiz
   */
  async submitQuizAttempt(attempt: QuizAttempt): Promise<APIResponse<{ 
    isValid: boolean; 
    score: number; 
    xpEarned: number;
    achievements: Achievement[];
  }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.quiz}/attempt`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ attempt })
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Buscar estatísticas de quiz do usuário
   */
  async getQuizStats(userId: string): Promise<APIResponse<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    completedQuizzes: string[];
    weakTopics: string[];
  }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.quiz}/stats/${userId}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao buscar stats de quiz:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================================================
  // LEADERBOARD MANAGEMENT
  // ============================================================================

  /**
   * Buscar leaderboard geral
   */
  async getLeaderboard(
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 50
  ): Promise<APIResponse<LeaderboardEntry[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.leaderboard}?type=${type}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse<LeaderboardEntry[]>(response);
    } catch (error) {
      console.error('Erro ao buscar leaderboard:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Buscar posição do usuário no ranking
   */
  async getUserRank(userId: string): Promise<APIResponse<{ 
    rank: number; 
    totalUsers: number;
    percentile: number;
  }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.leaderboard}/rank/${userId}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao buscar rank do usuário:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================================================
  // NOTIFICATIONS MANAGEMENT
  // ============================================================================

  /**
   * Buscar notificações do usuário
   */
  async getNotifications(userId: string): Promise<APIResponse<GamificationNotification[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.notifications}/${userId}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse<GamificationNotification[]>(response);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markNotificationRead(
    userId: string, 
    notificationId: string
  ): Promise<APIResponse<boolean>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.notifications}/${userId}/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: this.getHeaders()
        }
      );

      return await this.handleResponse<boolean>(response);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================================================
  // SYNC MANAGEMENT
  // ============================================================================

  /**
   * Sincronizar dados offline com servidor
   */
  async syncOfflineData(
    userId: string,
    offlineData: {
      progress: LearningProgress;
      notifications: GamificationNotification[];
      timestamp: string;
    }
  ): Promise<APIResponse<{
    conflicts: SyncConflict[];
    mergedProgress: LearningProgress;
    mergedNotifications: GamificationNotification[];
  }>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${this.endpoints.sync}/${userId}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(offlineData)
        }
      );

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao sincronizar dados offline:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Headers padrão para requisições
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Adicionar token de autenticação se disponível
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Buscar token de autenticação
   */
  private getAuthToken(): string | null {
    // Integrar com sistema de auth quando disponível
    return safeLocalStorage()?.getItem('authToken') || null;
  }

  /**
   * Fetch com timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Processar resposta da API
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao processar resposta do servidor'
      };
    }
  }

  /**
   * Extrair mensagem de erro
   */
  private getErrorMessage(error: Error | unknown): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'Timeout: Servidor não respondeu em tempo hábil';
      }
      return error.message;
    }
    return 'Erro desconhecido';
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Verificar se o backend está disponível
   */
  async healthCheck(): Promise<boolean> {
    // Se baseURL vazia, backend está desabilitado
    if (!this.baseURL || this.baseURL.trim() === '') {
      console.warn('[Gamification] Backend desabilitado - modo offline ativo');
      return false;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/v1/health`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      return response.ok;
    } catch (error) {
      console.warn('[Gamification] Backend indisponível:', error);
      return false;
    }
  }

  /**
   * Verificar conectividade e latência
   */
  async checkConnectivity(): Promise<{
    isOnline: boolean;
    latency: number;
    backendAvailable: boolean;
  }> {
    const startTime = Date.now();
    const isOnline = navigator.onLine;
    
    let backendAvailable = false;
    let latency = 0;

    if (isOnline) {
      try {
        backendAvailable = await this.healthCheck();
        latency = Date.now() - startTime;
      } catch {
        latency = -1;
      }
    }

    return {
      isOnline,
      latency,
      backendAvailable
    };
  }
}

// Export singleton instance
export const gamificationAPI = new GamificationAPI();
export default gamificationAPI;