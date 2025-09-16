/**
 * API Cache Utility - Simple Local Storage Cache
 * Substitui o sistema Firebase Cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache<T> {
  private keyPrefix: string;
  private defaultTTL: number;

  constructor(keyPrefix: string, defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.keyPrefix = keyPrefix;
    this.defaultTTL = defaultTTL;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();

      if (now > entry.timestamp + entry.ttl) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async clear(key?: string): Promise<void> {
    try {
      if (key) {
        localStorage.removeItem(this.getKey(key));
      } else {
        // Clear all keys with this prefix
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith(this.keyPrefix + ':')) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

// Instâncias pré-configuradas
export const PersonasCache = new SimpleCache('personas', 10 * 60 * 1000); // 10 minutes
export const AnalyticsCache = new SimpleCache('analytics', 5 * 60 * 1000); // 5 minutes
export const RAGCache = new SimpleCache('rag', 15 * 60 * 1000); // 15 minutes
export const KnowledgeCache = new SimpleCache('knowledge', 30 * 60 * 1000); // 30 minutes

export default SimpleCache;