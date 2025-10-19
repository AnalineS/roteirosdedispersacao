/**
 * Simple Cache - Sistema de cache local baseado em localStorage
 * Substitui completamente Firebase/Firestore (removido da arquitetura)
 */

import LRUCache from '@/utils/apiCache';

// Interfaces específicas para Analytics
interface AnalyticsEvent {
  id?: string;
  type: string;
  event?: string; // Alias for type for backward compatibility
  data?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  category?: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, unknown>;
  medicalContext?: Record<string, unknown>;
}

interface AnalyticsSession {
  id?: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'ended';
  events: AnalyticsEvent[];
  metadata: Record<string, unknown>;
}

interface MedicalMetric {
  id?: string;
  type: 'dosage' | 'interaction' | 'adverse_effect' | 'treatment_outcome' | 'task_completion' | 'critical_action';
  value: number;
  unit?: string;
  timestamp?: string;
  patientContext?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

interface AggregatedAnalytics {
  totalSessions: number;
  totalEvents: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  timeRange: string;
}

interface RealtimeAnalytics {
  activeSessions: number;
  currentUsers: number;
  liveEvents: AnalyticsEvent[];
  timestamp: string;
}

// Cache simples para substituir Firestore Cache
export class FirestoreCache<T> {
  private cache: LRUCache;
  private collection: string;

  constructor(collection: string, ttl?: number) {
    this.cache = new LRUCache(1000, ttl || 5 * 60 * 1000);
    this.collection = collection;
  }

  async get(key: string): Promise<T | null> {
    return this.cache.get<T>(`${this.collection}:${key}`);
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    this.cache.set(`${this.collection}:${key}`, data, undefined, ttl);
  }

  async clear(key?: string): Promise<void> {
    if (key) {
      this.cache.delete(`${this.collection}:${key}`);
    } else {
      this.cache.clear();
    }
  }

  // Métodos compatíveis com o Firebase Cache anterior
  async getCached(docId: string): Promise<T | null> {
    return this.get(docId);
  }

  async setCached(docId: string, data: T, ttl?: number): Promise<void> {
    return this.set(docId, data, ttl);
  }

  async invalidate(docId?: string): Promise<void> {
    return this.clear(docId);
  }

  async batchGet(docIds: string[]): Promise<{ [key: string]: T }> {
    const results: { [key: string]: T } = {};

    for (const docId of docIds) {
      const data = await this.get(docId);
      if (data) {
        results[docId] = data;
      }
    }

    return results;
  }

  async batchSet(items: { [key: string]: T }, ttl?: number): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value, ttl);
    }
  }

  // Métodos específicos para Analytics
  async saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    const eventId = event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.set(eventId, event as T);
  }

  async startAnalyticsSession(sessionData: AnalyticsSession): Promise<void> {
    const sessionId = sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.set(sessionId, sessionData as T);
  }

  async endAnalyticsSession(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        endTime: new Date().toISOString(),
        status: 'ended'
      };
      await this.set(sessionId, updatedSession);
    }
  }

  async getAnalyticsSession(sessionId: string): Promise<AnalyticsSession | null> {
    return await this.get(sessionId) as AnalyticsSession | null;
  }

  async trackMedicalMetric(metric: MedicalMetric): Promise<void> {
    const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.set(metricId, metric as T);
  }

  async getAggregatedAnalytics(timeRange: string): Promise<AggregatedAnalytics> {
    // Implementação simplificada para localStorage
    const cached = await this.get(`aggregated_${timeRange}`);
    return cached as AggregatedAnalytics || {
      totalSessions: 0,
      totalEvents: 0,
      averageSessionDuration: 0,
      topPages: [],
      timeRange
    };
  }

  async getRealtimeAnalytics(): Promise<RealtimeAnalytics> {
    const cached = await this.get('realtime_analytics');
    return cached as RealtimeAnalytics || {
      activeSessions: 0,
      currentUsers: 0,
      liveEvents: [],
      timestamp: new Date().toISOString()
    };
  }

  async cleanupOldAnalytics(olderThan: Date): Promise<void> {
    // Implementação simplificada - localStorage não suporta cleanup automático
    // Cleanup silencioso - dados serão limpos automaticamente por TTL
  }
}

// Instâncias específicas
export const conversationCache = new FirestoreCache('conversations', 15 * 60 * 1000);
export const analyticsCache = new FirestoreCache('analytics', 5 * 60 * 1000);
export const ragCache = new FirestoreCache('rag', 10 * 60 * 1000);
export const knowledgeCache = new FirestoreCache('knowledge', 30 * 60 * 1000);

// Export principal para analytics
export const analyticsSimpleCache = analyticsCache;

export default FirestoreCache;