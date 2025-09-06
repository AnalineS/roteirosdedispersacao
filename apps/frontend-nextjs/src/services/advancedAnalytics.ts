/**
 * Serviço de Analytics Avançado
 * Integra múltiplas fontes de dados para insights médicos educacionais
 */

import { logEvent } from './analytics';
import { PersonaRAGIntegration } from './personaRAGIntegration';
import { ChatService } from './chatService';
import { RAGIntegrationService } from './ragIntegrationService';
import { firestoreCache } from './firestoreCache';

export interface UserLearningProfile {
  userId: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredPersona: 'dr_gasnelio' | 'ga';
  specializations: string[];
  completedModules: string[];
  weakAreas: string[];
  strongAreas: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  averageSessionDuration: number;
  totalTimeSpent: number;
  lastActivity: number;
  progressScore: number;
}

export interface LearningMetrics {
  totalUsers: number;
  activeUsers: number;
  completionRate: number;
  averageProgressScore: number;
  popularTopics: Array<{ topic: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  personaPreferences: Record<'dr_gasnelio' | 'ga', number>;
  userEngagement: {
    dailyActive: number;
    weeklyActive: number;
    monthlyActive: number;
    sessionDuration: number;
    bounceRate: number;
  };
  knowledgeGaps: Array<{ topic: string; severity: number; affectedUsers: number }>;
}

export interface PersonaEffectiveness {
  persona: 'dr_gasnelio' | 'ga';
  totalInteractions: number;
  averageConfidence: number;
  userSatisfaction: number;
  topicExpertise: Record<string, number>;
  commonQuestions: Array<{ question: string; count: number; avgConfidence: number }>;
  improvementAreas: string[];
  successRate: number;
}

export interface SystemHealthMetrics {
  ragPerformance: {
    avgResponseTime: number;
    successRate: number;
    knowledgeBaseSize: number;
    embeddingAccuracy: number;
  };
  chatPerformance: {
    avgResponseTime: number;
    successRate: number;
    fallbackRate: number;
    userSatisfaction: number;
  };
  systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
  errorRates: {
    total: number;
    byComponent: Record<string, number>;
    critical: number;
  };
}

export interface EducationalInsights {
  effectiveContent: Array<{ topic: string; engagementScore: number; completionRate: number }>;
  difficultTopics: Array<{ topic: string; difficultyScore: number; dropoutRate: number }>;
  learningPaths: Array<{ path: string; successRate: number; averageTime: number }>;
  userProgression: {
    beginnerToIntermediate: number; // days
    intermediateToAdvanced: number;
    advancedToExpert: number;
  };
  contentRecommendations: Array<{ 
    topic: string; 
    priority: 'high' | 'medium' | 'low';
    reason: string;
    estimatedImpact: number;
  }>;
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private cache = firestoreCache;
  private personaRAG: PersonaRAGIntegration;
  private chatService: ChatService;
  private ragService: RAGIntegrationService;

  private constructor() {
    this.personaRAG = PersonaRAGIntegration.getInstance();
    this.chatService = ChatService.getInstance();
    this.ragService = RAGIntegrationService.getInstance();
  }

  static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  /**
   * Gerar perfil de aprendizado do usuário
   */
  async generateUserLearningProfile(userId: string): Promise<UserLearningProfile> {
    try {
      const cacheKey = `learning_profile:${userId}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.lastUpdated < 24 * 60 * 60 * 1000) {
        return cached.profile;
      }

      // Coletar dados de diferentes fontes
      const chatAnalytics = this.chatService.getAnalytics();
      const personaAnalytics = this.personaRAG.getPersonaStats();

      // Simular análise baseada nos dados disponíveis
      const profile: UserLearningProfile = {
        userId,
        level: this.calculateUserLevel(userId),
        preferredPersona: await this.getPreferredPersona(userId),
        specializations: await this.getUserSpecializations(userId),
        completedModules: await this.getCompletedModules(userId),
        weakAreas: await this.identifyWeakAreas(userId),
        strongAreas: await this.identifyStrongAreas(userId),
        learningStyle: await this.detectLearningStyle(userId),
        averageSessionDuration: this.calculateAverageSessionDuration(userId),
        totalTimeSpent: await this.getTotalTimeSpent(userId),
        lastActivity: Date.now(),
        progressScore: this.calculateProgressScore(userId)
      };

      // Cache por 24 horas
      await this.cache.set(cacheKey, { 
        profile, 
        lastUpdated: Date.now() 
      }, { ttl: 24 * 60 * 60 * 1000 });

      return profile;
    } catch (error) {
      console.error('Erro ao gerar perfil de aprendizado:', error);
      
      // Retorna perfil padrão em caso de erro
      return {
        userId,
        level: 'beginner',
        preferredPersona: 'dr_gasnelio',
        specializations: [],
        completedModules: [],
        weakAreas: [],
        strongAreas: [],
        learningStyle: 'mixed',
        averageSessionDuration: 0,
        totalTimeSpent: 0,
        lastActivity: Date.now(),
        progressScore: 0
      };
    }
  }

  /**
   * Obter métricas gerais de aprendizado
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const cacheKey = 'learning_metrics_global';
      const cached = await this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.lastUpdated < 60 * 60 * 1000) { // 1 hora
        return cached.metrics;
      }

      // Coletar dados agregados
      const chatAnalytics = this.chatService.getAnalytics();
      const activeSessions = this.chatService.getActiveSessions();

      const metrics: LearningMetrics = {
        totalUsers: await this.getTotalUsers(),
        activeUsers: activeSessions.length,
        completionRate: 0.75, // 75% - simulado
        averageProgressScore: 0.68, // 68% - simulado
        popularTopics: await this.getPopularTopics(),
        personaPreferences: {
          dr_gasnelio: chatAnalytics.personaUsage.dr_gasnelio,
          ga: chatAnalytics.personaUsage.ga
        },
        userEngagement: {
          dailyActive: await this.getDailyActiveUsers(),
          weeklyActive: await this.getWeeklyActiveUsers(),
          monthlyActive: await this.getMonthlyActiveUsers(),
          sessionDuration: chatAnalytics.averageResponseTime,
          bounceRate: 0.25 // 25% - simulado
        },
        knowledgeGaps: await this.identifyKnowledgeGaps()
      };

      // Cache por 1 hora
      await this.cache.set(cacheKey, { 
        metrics, 
        lastUpdated: Date.now() 
      }, { ttl: 60 * 60 * 1000 });

      return metrics;
    } catch (error) {
      console.error('Erro ao obter métricas de aprendizado:', error);
      
      return {
        totalUsers: 0,
        activeUsers: 0,
        completionRate: 0,
        averageProgressScore: 0,
        popularTopics: [],
        personaPreferences: { dr_gasnelio: 0, ga: 0 },
        userEngagement: {
          dailyActive: 0,
          weeklyActive: 0,
          monthlyActive: 0,
          sessionDuration: 0,
          bounceRate: 0
        },
        knowledgeGaps: []
      };
    }
  }

  /**
   * Analisar efetividade das personas
   */
  async analyzePersonaEffectiveness(): Promise<PersonaEffectiveness[]> {
    try {
      const personaAnalytics = this.personaRAG.getPersonaStats();
      
      const drGasnelioEffectiveness: PersonaEffectiveness = {
        persona: 'dr_gasnelio',
        totalInteractions: personaAnalytics.personaUsage['dr_gasnelio'] || 0,
        averageConfidence: personaAnalytics.avgPersonalizationScore || 0,
        userSatisfaction: 0.85, // Simulado - 85%
        topicExpertise: await this.getPersonaTopicExpertise('dr_gasnelio'),
        commonQuestions: await this.getCommonQuestions('dr_gasnelio'),
        improvementAreas: ['Linguagem mais acessível', 'Mais exemplos práticos'],
        successRate: 0.92 // 92% - simulado
      };

      const gaEffectiveness: PersonaEffectiveness = {
        persona: 'ga',
        totalInteractions: personaAnalytics.personaUsage['ga'] || 0,
        averageConfidence: personaAnalytics.contextRelevanceScore || 0,
        userSatisfaction: 0.91, // Simulado - 91%
        topicExpertise: await this.getPersonaTopicExpertise('ga'),
        commonQuestions: await this.getCommonQuestions('ga'),
        improvementAreas: ['Mais detalhamento técnico', 'Referências científicas'],
        successRate: 0.88 // 88% - simulado
      };

      return [drGasnelioEffectiveness, gaEffectiveness];
    } catch (error) {
      console.error('Erro ao analisar efetividade das personas:', error);
      return [];
    }
  }

  /**
   * Obter métricas de saúde do sistema
   */
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    try {
      const chatHealth = await this.chatService.checkSystemHealth();
      const ragStats = this.ragService.getStats();

      return {
        ragPerformance: {
          avgResponseTime: ragStats?.avgResponseTime || 0,
          successRate: ragStats?.successRate || 0,
          knowledgeBaseSize: ragStats?.totalQueries || 0,
          embeddingAccuracy: 0.85 // Valor fixo baseado em performance média
        },
        chatPerformance: {
          avgResponseTime: chatHealth.metrics.averageResponseTime || 0,
          successRate: 0.95, // 95% - simulado
          fallbackRate: 0.08, // 8% - simulado
          userSatisfaction: 0.87 // 87% - simulado
        },
        systemLoad: {
          cpuUsage: Math.random() * 40 + 20, // 20-60% - simulado
          memoryUsage: Math.random() * 30 + 40, // 40-70% - simulado
          activeConnections: chatHealth.metrics.activeSessions || 0,
          requestsPerMinute: Math.random() * 100 + 50 // 50-150 RPM - simulado
        },
        errorRates: {
          total: 0.05, // 5% - simulado
          byComponent: {
            'persona-rag': 0.02,
            'chat-service': 0.01,
            'rag-integration': 0.015,
            'analytics': 0.005
          },
          critical: 0.001 // 0.1% - simulado
        }
      };
    } catch (error) {
      console.error('Erro ao obter métricas de saúde:', error);
      
      return {
        ragPerformance: { avgResponseTime: 0, successRate: 0, knowledgeBaseSize: 0, embeddingAccuracy: 0 },
        chatPerformance: { avgResponseTime: 0, successRate: 0, fallbackRate: 0, userSatisfaction: 0 },
        systemLoad: { cpuUsage: 0, memoryUsage: 0, activeConnections: 0, requestsPerMinute: 0 },
        errorRates: { total: 0, byComponent: {}, critical: 0 }
      };
    }
  }

  /**
   * Gerar insights educacionais
   */
  async generateEducationalInsights(): Promise<EducationalInsights> {
    try {
      return {
        effectiveContent: await this.getEffectiveContent(),
        difficultTopics: await this.getDifficultTopics(),
        learningPaths: await this.analyzeLearningPaths(),
        userProgression: {
          beginnerToIntermediate: 30, // 30 dias - simulado
          intermediateToAdvanced: 90, // 90 dias - simulado
          advancedToExpert: 180 // 180 dias - simulado
        },
        contentRecommendations: await this.generateContentRecommendations()
      };
    } catch (error) {
      console.error('Erro ao gerar insights educacionais:', error);
      
      return {
        effectiveContent: [],
        difficultTopics: [],
        learningPaths: [],
        userProgression: { beginnerToIntermediate: 0, intermediateToAdvanced: 0, advancedToExpert: 0 },
        contentRecommendations: []
      };
    }
  }

  /**
   * Registrar evento de aprendizado
   */
  async recordLearningEvent(userId: string, event: {
    type: 'module_start' | 'module_complete' | 'quiz_attempt' | 'resource_access' | 'persona_interaction';
    moduleId?: string;
    topic?: string;
    score?: number;
    timeSpent?: number;
    persona?: 'dr_gasnelio' | 'ga';
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const eventData = {
        userId,
        timestamp: Date.now(),
        ...event
      };

      // Registrar no analytics global
      logEvent('EDUCATION', 'learning_event', JSON.stringify(eventData));

      // Armazenar para análises futuras
      const userEventsKey = `learning_events:${userId}`;
      const userEvents = await this.cache.get(userEventsKey) || [];
      userEvents.push(eventData);
      
      // Manter apenas os últimos 1000 eventos por usuário
      if (userEvents.length > 1000) {
        userEvents.splice(0, userEvents.length - 1000);
      }
      
      await this.cache.set(userEventsKey, userEvents, { ttl: 30 * 24 * 60 * 60 * 1000 }); // 30 dias

      console.log(`📊 Evento de aprendizado registrado: ${event.type} para usuário ${userId}`);
    } catch (error) {
      console.error('Erro ao registrar evento de aprendizado:', error);
    }
  }

  // Métodos privados auxiliares
  private calculateUserLevel(userId: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    // Implementação simplificada
    return 'intermediate';
  }

  private async getPreferredPersona(userId: string): Promise<'dr_gasnelio' | 'ga'> {
    try {
      const prefsKey = `preferences:${userId}`;
      const prefs = await this.cache.get(prefsKey);
      return prefs?.preferredPersona || 'dr_gasnelio';
    } catch {
      return 'dr_gasnelio';
    }
  }

  private async getUserSpecializations(userId: string): Promise<string[]> {
    return ['Hanseníase', 'Farmacologia']; // Simulado
  }

  private async getCompletedModules(userId: string): Promise<string[]> {
    return ['Módulo 1', 'Módulo 2']; // Simulado
  }

  private async identifyWeakAreas(userId: string): Promise<string[]> {
    return ['Efeitos colaterais', 'Interações medicamentosas']; // Simulado
  }

  private async identifyStrongAreas(userId: string): Promise<string[]> {
    return ['Diagnóstico', 'Classificação']; // Simulado
  }

  private async detectLearningStyle(userId: string): Promise<'visual' | 'auditory' | 'kinesthetic' | 'mixed'> {
    return 'mixed'; // Simulado
  }

  private calculateAverageSessionDuration(userId: string): number {
    return 1800; // 30 minutos - simulado
  }

  private async getTotalTimeSpent(userId: string): Promise<number> {
    return 36000; // 10 horas - simulado
  }

  private calculateProgressScore(userId: string): number {
    return 0.65; // 65% - simulado
  }

  private async getTotalUsers(): Promise<number> {
    return 150; // Simulado
  }

  private async getPopularTopics(): Promise<Array<{ topic: string; count: number; trend: 'up' | 'down' | 'stable' }>> {
    return [
      { topic: 'Dose de rifampicina', count: 45, trend: 'up' },
      { topic: 'Efeitos clofazimina', count: 32, trend: 'stable' },
      { topic: 'PQT-U vs PQT-MB', count: 28, trend: 'up' }
    ];
  }

  private async getDailyActiveUsers(): Promise<number> {
    return 25; // Simulado
  }

  private async getWeeklyActiveUsers(): Promise<number> {
    return 80; // Simulado
  }

  private async getMonthlyActiveUsers(): Promise<number> {
    return 120; // Simulado
  }

  private async identifyKnowledgeGaps(): Promise<Array<{ topic: string; severity: number; affectedUsers: number }>> {
    return [
      { topic: 'Reações adversas graves', severity: 0.8, affectedUsers: 35 },
      { topic: 'Monitoramento laboratorial', severity: 0.6, affectedUsers: 28 }
    ];
  }

  private async getPersonaTopicExpertise(persona: 'dr_gasnelio' | 'ga'): Promise<Record<string, number>> {
    return {
      'Diagnóstico': 0.95,
      'Tratamento': 0.92,
      'Efeitos adversos': 0.88,
      'Monitoramento': 0.90
    };
  }

  private async getCommonQuestions(persona: 'dr_gasnelio' | 'ga'): Promise<Array<{ question: string; count: number; avgConfidence: number }>> {
    return [
      { question: 'Qual a dose de rifampicina?', count: 15, avgConfidence: 0.95 },
      { question: 'Como monitorar efeitos colaterais?', count: 12, avgConfidence: 0.88 }
    ];
  }

  private async getEffectiveContent(): Promise<Array<{ topic: string; engagementScore: number; completionRate: number }>> {
    return [
      { topic: 'Calculadora de doses', engagementScore: 0.92, completionRate: 0.85 },
      { topic: 'Checklist de dispensação', engagementScore: 0.88, completionRate: 0.82 }
    ];
  }

  private async getDifficultTopics(): Promise<Array<{ topic: string; difficultyScore: number; dropoutRate: number }>> {
    return [
      { topic: 'Interações medicamentosas', difficultyScore: 0.85, dropoutRate: 0.35 },
      { topic: 'Reações adversas raras', difficultyScore: 0.78, dropoutRate: 0.28 }
    ];
  }

  private async analyzeLearningPaths(): Promise<Array<{ path: string; successRate: number; averageTime: number }>> {
    return [
      { path: 'Básico → Intermediário', successRate: 0.78, averageTime: 30 },
      { path: 'Intermediário → Avançado', successRate: 0.65, averageTime: 90 }
    ];
  }

  private async generateContentRecommendations(): Promise<Array<{ topic: string; priority: 'high' | 'medium' | 'low'; reason: string; estimatedImpact: number }>> {
    return [
      { 
        topic: 'Casos clínicos interativos', 
        priority: 'high', 
        reason: 'Alta demanda e baixa disponibilidade', 
        estimatedImpact: 0.85 
      },
      { 
        topic: 'Simulador de reações adversas', 
        priority: 'medium', 
        reason: 'Melhoria na identificação de gaps', 
        estimatedImpact: 0.65 
      }
    ];
  }
}

export default AdvancedAnalyticsService;