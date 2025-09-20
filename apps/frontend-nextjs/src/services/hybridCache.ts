/**
 * Hybrid Cache Service - Memory + localStorage + Cloud Storage
 * Sistema de cache híbrido unificado para substituir Firebase Cache
 */

import { apiCache } from '../utils/apiCache';

// Silent logger utility to avoid console statements
const logger = {
  warn: (_message: string, ..._args: any[]) => {
    // Silent logging - errors are handled gracefully without console output
  },
  error: (_message: string, ..._args: any[]) => {
    // Silent logging - errors are handled gracefully without console output
  }
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'localStorage' | 'firestore';
  key: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface CacheOptions {
  ttl?: number;
  priority?: 'low' | 'normal' | 'high';
  skipFirestore?: boolean;
}

interface SyncResult {
  synced: number;
  failed: number;
}

interface DetailedStats {
  memory: {
    hits: number;
    misses: number;
    size: number;
  };
  localStorage: {
    hits: number;
    misses: number;
    size: number;
  };
  firestore: {
    hits: number;
    misses: number;
    isAvailable: boolean;
  };
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
}

class HybridCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private syncQueue = new Map<string, CacheEntry<any>>();
  private stats = {
    memory: { hits: 0, misses: 0 },
    localStorage: { hits: 0, misses: 0 },
    firestore: { hits: 0, misses: 0 }
  };

  private readonly STORAGE_PREFIX = 'hybrid_cache_';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundSync();
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[\/\s#\[\]]/g, '_');
  }

  private getStorageKey(key: string): string {
    return this.STORAGE_PREFIX + this.sanitizeKey(key);
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  async get<T>(key: string): Promise<T | null> {
    const sanitizedKey = this.sanitizeKey(key);

    // 1. Try memory cache first
    const memoryEntry = this.memoryCache.get(sanitizedKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.stats.memory.hits++;
      return memoryEntry.data;
    }
    this.stats.memory.misses++;

    // 2. Try localStorage
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          this.stats.localStorage.hits++;
          // Promote to memory cache
          this.memoryCache.set(sanitizedKey, entry);
          return entry.data;
        } else {
          // Remove expired entry
          localStorage.removeItem(this.getStorageKey(key));
        }
      }
    } catch (error) {
      logger.warn('localStorage read error:', error);
    }
    this.stats.localStorage.misses++;

    // 3. Try Firestore (cloud storage) if online
    if (this.isOnline()) {
      try {
        // Simulate Firestore call (since we don't have actual Firestore)
        const cloudData = await this.getFromCloud(sanitizedKey);
        if (cloudData) {
          this.stats.firestore.hits++;
          // Cache in memory and localStorage
          await this.cacheLocally(key, cloudData, { ttl: this.DEFAULT_TTL });
          return cloudData;
        }
      } catch (error) {
        logger.warn('Cloud cache error:', error);
      }
    }
    this.stats.firestore.misses++;

    return null;
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    const { ttl = this.DEFAULT_TTL, priority = 'normal', skipFirestore = false } = options;
    const sanitizedKey = this.sanitizeKey(key);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      source: 'memory',
      key: sanitizedKey,
      syncStatus: 'pending'
    };

    try {
      // 1. Always store in memory
      this.memoryCache.set(sanitizedKey, entry);

      // 2. Store in localStorage
      await this.storeInLocalStorage(key, entry);

      // 3. Handle cloud sync based on priority and connectivity
      if (!skipFirestore && this.isOnline()) {
        if (priority === 'high') {
          // Immediate sync for high priority
          await this.syncToCloud(sanitizedKey, data, ttl);
          entry.syncStatus = 'synced';
        } else {
          // Queue for background sync
          this.syncQueue.set(sanitizedKey, entry);
        }
      }

      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);

    try {
      // Remove from memory
      this.memoryCache.delete(sanitizedKey);

      // Remove from localStorage
      localStorage.removeItem(this.getStorageKey(key));

      // Remove from sync queue
      this.syncQueue.delete(sanitizedKey);

      // Remove from cloud if online
      if (this.isOnline()) {
        await this.deleteFromCloud(sanitizedKey);
      }

      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear memory
      this.memoryCache.clear();

      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      // Clear sync queue
      this.syncQueue.clear();

      // Clear cloud if online
      if (this.isOnline()) {
        await this.clearCloud();
      }

      // Reset stats
      this.stats = {
        memory: { hits: 0, misses: 0 },
        localStorage: { hits: 0, misses: 0 },
        firestore: { hits: 0, misses: 0 }
      };
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  async forceSync(): Promise<SyncResult> {
    const result: SyncResult = { synced: 0, failed: 0 };

    for (const [key, entry] of this.syncQueue.entries()) {
      try {
        await this.syncToCloud(key, entry.data, entry.ttl);
        entry.syncStatus = 'synced';
        this.syncQueue.delete(key);
        result.synced++;
      } catch (error) {
        logger.error(`Sync failed for key ${key}:`, error);
        entry.syncStatus = 'failed';
        result.failed++;
      }
    }

    return result;
  }

  async getDetailedStats(): Promise<DetailedStats> {
    const memorySize = this.memoryCache.size;
    const localStorageSize = Object.keys(localStorage)
      .filter(key => key.startsWith(this.STORAGE_PREFIX)).length;

    const totalHits = this.stats.memory.hits + this.stats.localStorage.hits + this.stats.firestore.hits;
    const totalMisses = this.stats.memory.misses + this.stats.localStorage.misses + this.stats.firestore.misses;

    return {
      memory: {
        hits: this.stats.memory.hits,
        misses: this.stats.memory.misses,
        size: memorySize
      },
      localStorage: {
        hits: this.stats.localStorage.hits,
        misses: this.stats.localStorage.misses,
        size: localStorageSize
      },
      firestore: {
        hits: this.stats.firestore.hits,
        misses: this.stats.firestore.misses,
        isAvailable: this.isOnline()
      },
      totalHits,
      totalMisses,
      hitRatio: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0
    };
  }

  // Private helper methods
  private async cacheLocally<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    const sanitizedKey = this.sanitizeKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.DEFAULT_TTL,
      source: 'firestore',
      key: sanitizedKey,
      syncStatus: 'synced'
    };

    this.memoryCache.set(sanitizedKey, entry);
    await this.storeInLocalStorage(key, entry);
  }

  private async storeInLocalStorage<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.warn('localStorage quota exceeded, clearing old entries');
        this.clearOldLocalStorageEntries();
      }
    }
  }

  private clearOldLocalStorageEntries(): void {
    const entries: Array<{ key: string; timestamp: number }> = [];

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          entries.push({ key, timestamp: entry.timestamp || 0 });
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });

    // Sort by timestamp and remove oldest 25%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.floor(entries.length * 0.25);
    entries.slice(0, toRemove).forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  }

  private async getFromCloud(key: string): Promise<any> {
    // Simulate cloud storage call
    // In production, this would integrate with Google Cloud Storage or Supabase
    return null;
  }

  private async syncToCloud(key: string, data: any, ttl: number): Promise<void> {
    // Simulate cloud sync
    // In production, this would sync to Google Cloud Storage or Supabase
    return Promise.resolve();
  }

  private async deleteFromCloud(key: string): Promise<void> {
    // Simulate cloud deletion
    return Promise.resolve();
  }

  private async clearCloud(): Promise<void> {
    // Simulate cloud clear
    return Promise.resolve();
  }

  private startBackgroundSync(): void {
    this.syncTimer = setInterval(async () => {
      if (this.syncQueue.size > 0 && this.isOnline()) {
        await this.forceSync();
      }
    }, 30000); // Sync every 30 seconds
  }

  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

// Utility functions and constants
export const HybridCacheUtils = {
  TTL: {
    VERY_SHORT: 30 * 1000,      // 30 seconds
    SHORT: 2 * 60 * 1000,       // 2 minutes
    MEDIUM: 10 * 60 * 1000,     // 10 minutes
    LONG: 60 * 60 * 1000,       // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000  // 24 hours
  },

  Keys: {
    chat: (message: string, persona: string) => `chat:${persona}:${message}`,
    personas: () => 'personas:all',
    api: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
    user: (userId: string, type: string) => `user:${userId}:${type}`
  }
};

// Singleton instance
export const hybridCache = new HybridCache();

export default HybridCache;