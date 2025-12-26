/**
 * API Cache Utility - LRU Cache with TTL Support
 * Sistema de cache em memória com LRU eviction
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  keys: string[];
  hitRate: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number = 1000;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  private generateKey(key: string, params?: Record<string, any>): string {
    if (!params) return key;
    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${key}?${paramString}`;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    if (this.cache.size >= this.maxSize) {
      // Find least recently used item
      let oldestKey = '';
      let oldestTime = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccess < oldestTime) {
          oldestTime = entry.lastAccess;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  get<T>(key: string, params?: Record<string, any>): T | null {
    this.evictExpired();

    const cacheKey = this.generateKey(key, params);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(cacheKey);
      this.misses++;
      return null;
    }

    // Update access info for LRU
    entry.accessCount++;
    entry.lastAccess = now;
    this.hits++;

    return entry.data;
  }

  set<T>(key: string, data: T, params?: Record<string, any>, ttl?: number): void {
    this.evictExpired();
    this.evictLRU();

    const cacheKey = this.generateKey(key, params);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccess: now
    };

    this.cache.set(cacheKey, entry);
  }

  delete(key: string, params?: Record<string, any>): void {
    const cacheKey = this.generateKey(key, params);
    this.cache.delete(cacheKey);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  preload<T>(key: string, data: T, params?: Record<string, any>, ttl?: number): void {
    this.set(key, data, params, ttl);
  }

  getStats(): CacheStats {
    this.evictExpired();
    const totalRequests = this.hits + this.misses;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0
    };
  }
}

// Main API Cache instance
export const apiCache = new LRUCache(2000, 5 * 60 * 1000);

// Specialized cache utilities
export const PersonasCache = {
  get: (): any => apiCache.get('/personas'),
  set: (data: any): void => apiCache.set('/personas', data, undefined, 10 * 60 * 1000),
  clear: (): void => apiCache.delete('/personas')
};

export const ChatCache = {
  get: (message: string, persona: string): any =>
    apiCache.get('/chat', { message, persona }),
  set: (message: string, persona: string, response: any): void =>
    apiCache.set('/chat', response, { message, persona }, 15 * 60 * 1000),
  clear: (): void => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith('/chat')) {
        apiCache.delete(key);
      }
    });
  }
};

export const AnalyticsCache = new LRUCache(500, 5 * 60 * 1000);
export const RAGCache = new LRUCache(1000, 15 * 60 * 1000);
export const KnowledgeCache = new LRUCache(500, 30 * 60 * 1000);

export default LRUCache;