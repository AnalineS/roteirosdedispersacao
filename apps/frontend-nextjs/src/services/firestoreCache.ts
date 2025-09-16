/**
 * Firestore Cache Stub - Substitui Firebase Cache
 * Implementação simples baseada em localStorage
 */

import SimpleCache from '@/utils/apiCache';

// Cache simples para substituir Firestore Cache
export class FirestoreCache<T> extends SimpleCache<T> {
  constructor(collection: string, ttl?: number) {
    super(`firestore:${collection}`, ttl);
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
  async saveAnalyticsEvent(event: any): Promise<void> {
    const eventId = event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.set(eventId, event);
  }

  async startAnalyticsSession(sessionData: any): Promise<void> {
    const sessionId = sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.set(sessionId, sessionData);
  }
}

// Instâncias específicas
export const conversationCache = new FirestoreCache('conversations', 15 * 60 * 1000);
export const analyticsCache = new FirestoreCache('analytics', 5 * 60 * 1000);
export const ragCache = new FirestoreCache('rag', 10 * 60 * 1000);
export const knowledgeCache = new FirestoreCache('knowledge', 30 * 60 * 1000);

// Alias para compatibilidade
export const firestoreCache = analyticsCache;

export default FirestoreCache;