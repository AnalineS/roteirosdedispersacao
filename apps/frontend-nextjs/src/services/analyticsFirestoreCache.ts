/**
 * Analytics Firestore Cache Service
 * Sistema de analytics integrado com Firestore para persistência
 * Substitui funcionalidades Redis no sistema de analytics
 */

import { HybridCacheUtils } from './hybridCache';
import { firestoreCache } from './firestoreCache';

export interface AnalyticsData {
  id: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  event: string;
  category: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, any>;
  medicalContext?: {
    urgencyLevel?: 'critical' | 'important' | 'standard';
    clinicalContext?: 'emergency' | 'routine' | 'educational';
    userRole?: 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'unknown';
  };
}

export interface AnalyticsSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  events: AnalyticsData[];
  performance: {
    loadTime: number;
    interactionTime: number;
    errorCount: number;
    featureFlags: string[];
  };
  medical: {
    criticalActionsCount: number;
    taskCompletions: number;
    emergencyAccess: boolean;
    saftyAlerts: number;
  };
}

export interface AnalyticsAggregated {
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  timestamp: number;
  metrics: {
    totalSessions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    topEvents: Array<{ event: string; count: number }>;
    errorRate: number;
    performanceMetrics: {
      avgLoadTime: number;
      avgInteractionTime: number;
      coreWebVitals: Record<string, number>;
    };
    medicalMetrics: {
      criticalActions: number;
      emergencyAccess: number;
      taskCompletionRate: number;
      safetyAlertsTriggered: number;
    };
  };
}

export class AnalyticsFirestoreCache {
  private static readonly CACHE_PREFIX = 'analytics';
  private static readonly SESSION_PREFIX = 'session';
  private static readonly AGGREGATED_PREFIX = 'aggregated';
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas
  private static readonly SESSION_TTL = 2 * 60 * 60 * 1000; // 2 horas
  private static readonly AGGREGATED_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

  /**
   * Salva evento de analytics individual
   */
  static async saveAnalyticsEvent(event: AnalyticsData): Promise<boolean> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}:event:${event.id}`;
      
      // 1. Salvar no cache híbrido imediatamente
      const cacheSuccess = await firestoreCache.set(
        cacheKey,
        event,
        { ttl: this.DEFAULT_TTL }
      );

      // 2. Adicionar à sessão atual
      await this.addEventToSession(event);

      // 3. Salvar no Firestore
      const firestoreSuccess = await firestoreCache.set(
        `firestore_${cacheKey}`,
        event,
        { ttl: this.DEFAULT_TTL }
      );

      console.log(`📊 Analytics event saved: ${event.event} (${event.category})`);
      return cacheSuccess && firestoreSuccess;

    } catch (error) {
      console.error('Error saving analytics event:', error);
      return false;
    }
  }

  /**
   * Inicia nova sessão de analytics
   */
  static async startAnalyticsSession(session: Partial<AnalyticsSession>): Promise<string> {
    try {
      const sessionId = session.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullSession: AnalyticsSession = {
        id: sessionId,
        userId: session.userId,
        startTime: Date.now(),
        deviceType: session.deviceType || 'desktop',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        events: [],
        performance: {
          loadTime: 0,
          interactionTime: 0,
          errorCount: 0,
          featureFlags: []
        },
        medical: {
          criticalActionsCount: 0,
          taskCompletions: 0,
          emergencyAccess: false,
          saftyAlerts: 0
        }
      };

      const cacheKey = `${this.SESSION_PREFIX}:${sessionId}`;
      
      // Salvar no cache híbrido
      await firestoreCache.set(cacheKey, fullSession, { ttl: this.SESSION_TTL });
      
      // Salvar no Firestore
      await firestoreCache.set(
        `firestore_${cacheKey}`,
        fullSession,
        { ttl: this.SESSION_TTL }
      );

      console.log(`🚀 Analytics session started: ${sessionId}`);
      return sessionId;

    } catch (error) {
      console.error('Error starting analytics session:', error);
      return 'fallback_session';
    }
  }

  /**
   * Finaliza sessão de analytics
   */
  static async endAnalyticsSession(sessionId: string): Promise<boolean> {
    try {
      const cacheKey = `${this.SESSION_PREFIX}:${sessionId}`;
      
      // Buscar sessão atual
      let session = await firestoreCache.get<AnalyticsSession>(cacheKey);
      
      if (!session) {
        // Fallback para Firestore
        session = await firestoreCache.get<AnalyticsSession>(`firestore_${cacheKey}`);
      }

      if (session) {
        session.endTime = Date.now();
        
        // Calcular métricas finais
        const sessionDuration = session.endTime - session.startTime;
        session.performance.interactionTime = sessionDuration;
        
        // Salvar sessão finalizada
        await firestoreCache.set(cacheKey, session, { ttl: this.SESSION_TTL });
        await firestoreCache.set(
          `firestore_${cacheKey}`,
          session,
          { ttl: this.SESSION_TTL }
        );

        // Agregar dados para relatórios
        await this.aggregateSessionData(session);

        console.log(`🏁 Analytics session ended: ${sessionId} (${sessionDuration}ms)`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error ending analytics session:', error);
      return false;
    }
  }

  /**
   * Busca eventos de analytics por filtros
   */
  static async getAnalyticsEvents(filters: {
    userId?: string;
    sessionId?: string;
    event?: string;
    category?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<AnalyticsData[]> {
    try {
      // Implementar busca inteligente
      const searchKeys = [];
      
      if (filters.sessionId) {
        searchKeys.push(`${this.CACHE_PREFIX}:event:*`);
      }
      
      if (filters.userId) {
        searchKeys.push(`${this.CACHE_PREFIX}:user:${filters.userId}:*`);
      }

      // Por enquanto, implementação simplificada
      // Em produção, usar indexação adequada no Firestore
      const events: AnalyticsData[] = [];
      
      console.log(`🔍 Searching analytics events with filters:`, filters);
      return events;

    } catch (error) {
      console.error('Error getting analytics events:', error);
      return [];
    }
  }

  /**
   * Busca sessão de analytics
   */
  static async getAnalyticsSession(sessionId: string): Promise<AnalyticsSession | null> {
    try {
      const cacheKey = `${this.SESSION_PREFIX}:${sessionId}`;
      
      // Tentar cache híbrido primeiro
      let session = await firestoreCache.get<AnalyticsSession>(cacheKey);
      
      if (!session) {
        // Fallback para Firestore
        session = await firestoreCache.get<AnalyticsSession>(`firestore_${cacheKey}`);
        
        if (session) {
          // Re-cachear para próximas consultas
          await firestoreCache.set(cacheKey, session, { ttl: this.SESSION_TTL });
        }
      }

      return session || null;

    } catch (error) {
      console.error('Error getting analytics session:', error);
      return null;
    }
  }

  /**
   * Busca dados agregados
   */
  static async getAggregatedAnalytics(
    timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startTime: number,
    endTime: number
  ): Promise<AnalyticsAggregated[]> {
    try {
      const cacheKey = `${this.AGGREGATED_PREFIX}:${timeframe}:${startTime}:${endTime}`;
      
      // Verificar cache primeiro
      let aggregated = await firestoreCache.get<AnalyticsAggregated[]>(cacheKey);
      
      if (!aggregated) {
        // Calcular dados agregados
        aggregated = await this.calculateAggregatedMetrics(timeframe, startTime, endTime);
        
        // Cachear resultado
        await firestoreCache.set(cacheKey, aggregated, { ttl: this.AGGREGATED_TTL });
        await firestoreCache.set(
          `firestore_${cacheKey}`,
          aggregated,
          { ttl: this.AGGREGATED_TTL }
        );
      }

      return aggregated || [];

    } catch (error) {
      console.error('Error getting aggregated analytics:', error);
      return [];
    }
  }

  /**
   * Limpa dados de analytics antigos
   */
  static async cleanupOldAnalytics(olderThanMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffTime = Date.now() - olderThanMs;
      
      // Implementar limpeza em lotes para não sobrecarregar o sistema
      console.log(`🧹 Cleaning analytics data older than ${new Date(cutoffTime).toISOString()}`);
      
      // Em produção, implementar limpeza real no Firestore
      
    } catch (error) {
      console.error('Error cleaning old analytics:', error);
    }
  }

  /**
   * Tracking de métricas médicas específicas
   */
  static async trackMedicalMetric(
    sessionId: string,
    metric: {
      type: 'critical_action' | 'emergency_access' | 'task_completion' | 'safety_alert';
      value?: number;
      context?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const session = await this.getAnalyticsSession(sessionId);
      
      if (session) {
        // Atualizar métricas médicas
        switch (metric.type) {
          case 'critical_action':
            session.medical.criticalActionsCount++;
            break;
          case 'emergency_access':
            session.medical.emergencyAccess = true;
            break;
          case 'task_completion':
            session.medical.taskCompletions++;
            break;
          case 'safety_alert':
            session.medical.saftyAlerts++;
            break;
        }

        // Salvar sessão atualizada
        const cacheKey = `${this.SESSION_PREFIX}:${sessionId}`;
        await firestoreCache.set(cacheKey, session, { ttl: this.SESSION_TTL });
        await firestoreCache.set(
          `firestore_${cacheKey}`,
          session,
          { ttl: this.SESSION_TTL }
        );

        console.log(`⚕️ Medical metric tracked: ${metric.type} for session ${sessionId}`);
      }

    } catch (error) {
      console.error('Error tracking medical metric:', error);
    }
  }

  /**
   * Relatório de analytics em tempo real
   */
  static async getRealtimeAnalytics(): Promise<{
    activeSessions: number;
    eventsLastHour: number;
    criticalActionsLastHour: number;
    systemHealth: 'good' | 'degraded' | 'critical';
  }> {
    try {
      // Implementar métricas em tempo real
      return {
        activeSessions: 0,
        eventsLastHour: 0,
        criticalActionsLastHour: 0,
        systemHealth: 'good'
      };

    } catch (error) {
      console.error('Error getting realtime analytics:', error);
      return {
        activeSessions: 0,
        eventsLastHour: 0,
        criticalActionsLastHour: 0,
        systemHealth: 'critical'
      };
    }
  }

  // MÉTODOS PRIVADOS

  private static async addEventToSession(event: AnalyticsData): Promise<void> {
    try {
      const session = await this.getAnalyticsSession(event.sessionId);
      
      if (session) {
        session.events.push(event);
        
        // Atualizar métricas de performance
        if (event.event === 'error') {
          session.performance.errorCount++;
        }

        // Salvar sessão atualizada
        const cacheKey = `${this.SESSION_PREFIX}:${event.sessionId}`;
        await firestoreCache.set(cacheKey, session, { ttl: this.SESSION_TTL });
      }

    } catch (error) {
      console.error('Error adding event to session:', error);
    }
  }

  private static async aggregateSessionData(session: AnalyticsSession): Promise<void> {
    try {
      // Implementar agregação de dados para relatórios
      console.log(`📈 Aggregating data for session: ${session.id}`);
      
      // Em produção, implementar agregação real
      
    } catch (error) {
      console.error('Error aggregating session data:', error);
    }
  }

  private static async calculateAggregatedMetrics(
    timeframe: string,
    startTime: number,
    endTime: number
  ): Promise<AnalyticsAggregated[]> {
    try {
      // Implementar cálculo de métricas agregadas
      const aggregated: AnalyticsAggregated[] = [{
        timeframe: timeframe as any,
        timestamp: Date.now(),
        metrics: {
          totalSessions: 0,
          uniqueUsers: 0,
          averageSessionDuration: 0,
          topEvents: [],
          errorRate: 0,
          performanceMetrics: {
            avgLoadTime: 0,
            avgInteractionTime: 0,
            coreWebVitals: {}
          },
          medicalMetrics: {
            criticalActions: 0,
            emergencyAccess: 0,
            taskCompletionRate: 0,
            safetyAlertsTriggered: 0
          }
        }
      }];

      return aggregated;

    } catch (error) {
      console.error('Error calculating aggregated metrics:', error);
      return [];
    }
  }
}

export default AnalyticsFirestoreCache;