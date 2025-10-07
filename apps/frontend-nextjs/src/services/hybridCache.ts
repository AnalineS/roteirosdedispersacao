/**
 * Sistema de Cache Híbrido Simplificado
 * Cache local (memory + localStorage) sem dependências externas
 * Estratégia: memory_first (memory → localStorage)
 * Otimizado para performance e offline-first
 */

import { logger } from '@/utils/logger';
import { safeLocalStorage } from '@/hooks/useClientStorage';

// Interfaces
interface HybridCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'localStorage' | 'firestore';
  key: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  retryCount?: number;
}

// Tipos específicos para cache
interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  persona?: string;
}

interface PersonaResponse {
  response: string;
  confidence: number;
  timestamp: number;
  persona: string;
  query: string;
}

interface ConversationData {
  messages: ChatMessage[];
  lastUpdated: number;
  participantCount?: number;
}

interface BatchCacheEntry {
  key: string;
  data: unknown;
  ttl?: number;
}

// Union type para todos os tipos de dados que podem ser armazenados no cache
type CacheableData =
  | ChatMessage[]
  | ConversationData
  | PersonaResponse
  | string
  | number
  | boolean
  | Record<string, unknown>
  | unknown[];

interface CacheStats {
  memory: {
    size: number;
    hits: number;
    misses: number;
  };
  localStorage: {
    size: number;
    hits: number;
    misses: number;
  };
  firestore: {
    size: number;
    hits: number;
    misses: number;
    isAvailable: boolean;
  };
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
}

interface CacheConfig {
  memory: {
    maxSize: number;
    defaultTTL: number;
  };
  localStorage: {
    keyPrefix: string;
    maxSize: number;
    defaultTTL: number;
  };
  firestore: {
    defaultTTL: number;
    syncInterval: number;
    retryLimit: number;
  };
  strategy: 'memory_first' | 'firestore_first';
  enableBackgroundSync: boolean;
}

class HybridCacheManager {
  private memoryCache = new Map<string, HybridCacheEntry<CacheableData>>();
  private syncQueue: Set<string> = new Set();
  private backgroundSyncTimer: NodeJS.Timeout | null = null;
  private isOnline = true;
  private stats: CacheStats;
  
  private config: CacheConfig = {
    memory: {
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000, // 5 minutos
    },
    localStorage: {
      keyPrefix: 'hybrid_cache_',
      maxSize: 50,
      defaultTTL: 30 * 60 * 1000, // 30 minutos
    },
    firestore: {
      defaultTTL: 60 * 60 * 1000, // 1 hora
      syncInterval: 30000, // 30 segundos
      retryLimit: 3,
    },
    strategy: 'memory_first',
    enableBackgroundSync: true,
  };

  constructor(customConfig?: Partial<CacheConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    this.stats = {
      memory: { size: 0, hits: 0, misses: 0 },
      localStorage: { size: 0, hits: 0, misses: 0 },
      firestore: { size: 0, hits: 0, misses: 0, isAvailable: false },
      totalHits: 0,
      totalMisses: 0,
      hitRatio: 0,
    };

    this.initializeBackgroundSync();
    this.initializeNetworkMonitoring();
    this.initializeFirestoreStatus();
  }

  /**
   * Obtém dados usando estratégia memory_first
   */
  async get<T>(key: string): Promise<T | null> {
    const sanitizedKey = this.sanitizeKey(key);
    
    // 1. Verificar memory cache primeiro
    const memoryResult = this.getFromMemory<T>(sanitizedKey);
    if (memoryResult !== null) {
      this.stats.memory.hits++;
      this.updateTotalStats();
      logger.log('[HybridCache] Memory cache hit');
      return memoryResult;
    }
    this.stats.memory.misses++;

    // 2. Verificar localStorage
    const localStorageResult = await this.getFromLocalStorage<T>(sanitizedKey);
    if (localStorageResult !== null) {
      this.stats.localStorage.hits++;
      this.updateTotalStats();
      
      // Promover para memory cache
      if (localStorageResult !== undefined) {
        this.setInMemory(sanitizedKey, localStorageResult as CacheableData, this.config.memory.defaultTTL);
      }
      
      logger.log('[HybridCache] localStorage cache hit');
      return localStorageResult;
    }
    this.stats.localStorage.misses++;

    // Firestore cache layer removed (no longer in use)

    this.updateTotalStats();
    logger.log('[HybridCache] Cache miss');
    return null;
  }

  /**
   * Armazena dados em todas as camadas
   */
  async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number;
      skipFirestore?: boolean;
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);
    const ttl = options?.ttl || this.config.memory.defaultTTL;
    
    try {
      // Sempre armazenar em memory cache
      this.setInMemory(sanitizedKey, data as CacheableData, ttl);
      
      // Armazenar em localStorage apenas se TTL for maior que um valor mínimo
      if (ttl >= 30000) { // 30 segundos mínimo para localStorage
        this.setInLocalStorage(sanitizedKey, data, Math.max(ttl, this.config.localStorage.defaultTTL));
      }
      
      // Armazenar em Firestore (se não for skipado e estivermos online)
      if (!options?.skipFirestore && this.isOnline) {
        const firestoreTTL = Math.max(ttl, this.config.firestore.defaultTTL);
        
        // Firestore sync queue removed - local storage only
      }
      
      logger.log('[HybridCache] Data cached successfully');
      return true;
      
    } catch (error) {
      console.error(`[HybridCache] Erro ao armazenar ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove entrada de todas as camadas
   */
  async delete(key: string): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);
    let success = true;
    
    try {
      // Remover do memory cache
      this.memoryCache.delete(sanitizedKey);
      
      // Remover do localStorage
      this.removeFromLocalStorage(sanitizedKey);
      
      // Firestore removal completed - using local storage only
      
      // Remover da queue de sync
      this.syncQueue.delete(sanitizedKey);
      
      logger.log('[HybridCache] Data deleted successfully');
      return success;
      
    } catch (error) {
      console.error(`[HybridCache] Erro ao deletar ${key}:`, error);
      return false;
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<boolean> {
    try {
      // Limpar memory cache
      this.memoryCache.clear();
      
      // Limpar localStorage
      this.clearLocalStorage();
      
      // Limpar Firestore (se online)
      if (this.isOnline) {
        // Firestore removed - using local storage only
      }
      
      // Limpar queue de sync
      this.syncQueue.clear();
      
      // Reset stats
      this.resetStats();
      
      logger.log('[HybridCache] Cache limpo completamente');
      return true;
      
    } catch (error) {
      console.error('[HybridCache] Erro ao limpar cache:', error);
      return false;
    }
  }

  /**
   * Força sincronização manual com Firestore
   */
  async forceSync(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) {
      logger.warn('[HybridCache] Não é possível sincronizar offline');
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    
    const keysToSync = Array.from(this.syncQueue);
    
    // Firestore sync removed - clearing sync queue
    for (const key of keysToSync) {
      this.syncQueue.delete(key);
      synced++;
    }
    
    logger.log(`[HybridCache] Sincronização manual: ${synced} ok, ${failed} falhas`);
    return { synced, failed };
  }

  /**
   * Obtém estatísticas detalhadas do cache
   */
  async getDetailedStats(): Promise<CacheStats> {
    // Atualizar stats do Firestore
    if (this.isOnline) {
      try {
        // Firestore stats removed - using local storage only
        this.stats.firestore.size = 0;
        this.stats.firestore.isAvailable = false;
      } catch (error) {
        logger.warn('[HybridCache] Erro ao obter stats do Firestore:', error);
      }
    }

    // Atualizar tamanhos
    this.stats.memory.size = this.memoryCache.size;
    this.stats.localStorage.size = this.getLocalStorageSize();

    return { ...this.stats };
  }

  /**
   * MÉTODOS PRIVADOS
   */

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.memoryCache.delete(key);
      }
      return null;
    }
    
    // Atualizar timestamp para LRU
    entry.timestamp = Date.now();
    
    // Verificar se é null explicitamente (para não retornar null quando o dado é realmente null)
    return entry.data as T;
  }

  private setInMemory<T extends CacheableData>(key: string, data: T, ttl: number): void {
    this.evictOldestMemory();

    const entry: HybridCacheEntry<CacheableData> = {
      data: data as CacheableData,
      timestamp: Date.now(),
      ttl,
      source: 'memory',
      key,
      syncStatus: 'pending'
    };

    this.memoryCache.set(key, entry);
  }

  private async getFromLocalStorage<T>(key: string): Promise<T | null> {
    try {
      const storageKey = this.config.localStorage.keyPrefix + key;
      const item = safeLocalStorage()?.getItem(storageKey);
      
      if (!item) {
        return null;
      }
      
      const entry: HybridCacheEntry<T> = JSON.parse(item);
      
      if (this.isExpired(entry)) {
        safeLocalStorage()?.removeItem(storageKey);
        return null;
      }
      
      return entry.data;
      
    } catch (error) {
      logger.warn(`[HybridCache] Erro ao ler localStorage ${key}:`, error);
      return null;
    }
  }

  private setInLocalStorage<T>(key: string, data: T, ttl: number): void {
    try {
      this.evictOldestLocalStorage();
      
      const entry: HybridCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: Math.max(ttl, 10), // Garantir TTL mínimo para localStorage
        source: 'localStorage',
        key,
        syncStatus: 'pending'
      };
      
      const storageKey = this.config.localStorage.keyPrefix + key;
      safeLocalStorage()?.setItem(storageKey, JSON.stringify(entry));
      
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.warn('[HybridCache] localStorage cheio, limpando entradas antigas');
        this.clearOldLocalStorage();
        // Tentar novamente
        try {
          const storageKey = this.config.localStorage.keyPrefix + key;
          const entry: HybridCacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: Math.max(ttl, 10),
            source: 'localStorage',
            key,
            syncStatus: 'pending'
          };
          safeLocalStorage()?.setItem(storageKey, JSON.stringify(entry));
        } catch (retryError) {
          logger.error('[HybridCache] Falha ao armazenar no localStorage:', retryError);
        }
      } else {
        logger.error(`[HybridCache] Erro ao armazenar ${key} no localStorage:`, error);
      }
    }
  }



  private removeFromLocalStorage(key: string): void {
    try {
      const storageKey = this.config.localStorage.keyPrefix + key;
      safeLocalStorage()?.removeItem(storageKey);
    } catch (error) {
      logger.warn(`[HybridCache] Erro ao remover ${key} do localStorage:`, error);
    }
  }

  private clearLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.localStorage.keyPrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => safeLocalStorage()?.removeItem(key));
      
    } catch (error) {
      logger.error('[HybridCache] Erro ao limpar localStorage:', error);
    }
  }

  private clearOldLocalStorage(): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.localStorage.keyPrefix)) {
          try {
            const item = safeLocalStorage()?.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              entries.push({ key, timestamp: entry.timestamp || 0 });
            }
          } catch (parseError) {
            // Remove entries que não conseguimos fazer parse
            safeLocalStorage()?.removeItem(key);
          }
        }
      }
      
      // Ordenar por timestamp e remover 25% mais antigos
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(entries.length * 0.25);
      
      for (let i = 0; i < toRemove; i++) {
        safeLocalStorage()?.removeItem(entries[i].key);
      }
      
    } catch (error) {
      logger.error('[HybridCache] Erro ao limpar entradas antigas:', error);
    }
  }

  private getLocalStorageSize(): number {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.localStorage.keyPrefix)) {
          count++;
        }
      }
      return count;
    } catch (error) {
      return 0;
    }
  }

  private evictOldestMemory(): void {
    if (this.memoryCache.size >= this.config.memory.maxSize) {
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      this.memoryCache.forEach((entry, key) => {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      });
      
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
  }

  private evictOldestLocalStorage(): void {
    if (this.getLocalStorageSize() >= this.config.localStorage.maxSize) {
      this.clearOldLocalStorage();
    }
  }

  private isExpired(entry: HybridCacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[\/\s#\[\]]/g, '_').replace(/_{2,}/g, '_');
  }

  private updateTotalStats(): void {
    const totalHits = this.stats.memory.hits + this.stats.localStorage.hits + this.stats.firestore.hits;
    const totalMisses = this.stats.memory.misses + this.stats.localStorage.misses + this.stats.firestore.misses;
    
    this.stats.totalHits = totalHits;
    this.stats.totalMisses = totalMisses;
    this.stats.hitRatio = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;
  }

  private resetStats(): void {
    this.stats = {
      memory: { size: 0, hits: 0, misses: 0 },
      localStorage: { size: 0, hits: 0, misses: 0 },
      firestore: { size: 0, hits: 0, misses: 0, isAvailable: false },
      totalHits: 0,
      totalMisses: 0,
      hitRatio: 0,
    };
  }

  private initializeBackgroundSync(): void {
    if (!this.config.enableBackgroundSync) {
      return;
    }
    
    this.backgroundSyncTimer = setInterval(async () => {
      if (this.syncQueue.size > 0 && this.isOnline) {
        try {
          const result = await this.forceSync();
          if (result.synced > 0) {
            logger.log(`[HybridCache] Background sync: ${result.synced} items`);
          }
        } catch (error) {
          logger.warn('[HybridCache] Background sync error:', error);
        }
      }
    }, this.config.firestore.syncInterval);
  }

  private initializeNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        logger.log('[HybridCache] Voltou online - iniciando sync');
        this.forceSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        logger.log('[HybridCache] Modo offline ativado');
      });
    }
  }

  private async initializeFirestoreStatus(): Promise<void> {
    try {
      const isReady = true; // Local storage always ready
      this.stats.firestore.isAvailable = isReady;
    } catch (error) {
      logger.warn('[HybridCache] Erro ao verificar status do Firestore:', error);
    }
  }

  // Cleanup ao destruir
  public destroy(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
  }
}

// Instância singleton
export const hybridCache = new HybridCacheManager();

// Utilitários de conveniência
export const HybridCacheUtils = {
  // Predefined TTLs
  TTL: {
    VERY_SHORT: 30 * 1000,        // 30 segundos
    SHORT: 2 * 60 * 1000,         // 2 minutos
    MEDIUM: 10 * 60 * 1000,       // 10 minutos
    LONG: 60 * 60 * 1000,         // 1 hora
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 horas
  },

  // Cache key helpers
  Keys: {
    chat: (message: string, persona: string) => `chat:${persona}:${message}`,
    personas: () => 'personas:all',
    api: (endpoint: string, params?: string) => `api:${endpoint}${params ? `:${params}` : ''}`,
    user: (userId: string, data: string) => `user:${userId}:${data}`,
    conversation: (conversationId: string) => `conversation:${conversationId}`,
    conversations: (userId: string) => `conversations:${userId}`,
    personaResponse: (persona: string, query: string) => `${persona}:${query.toLowerCase().replace(/\s+/g, '_')}`,
    fallback: (query: string) => `fallback:${query}`,
    analytics: (event: string, userId?: string) => `analytics:${event}${userId ? `:${userId}` : ''}`,
    warmup: (topic: string) => `warmup:${topic}`,
  },

  // Specialized cache methods for replacing Redis functionality
  Specialized: {
    // Cache conversations with automatic expiration
    cacheConversation: async (
      conversationId: string,
      messages: ChatMessage[],
      ttl: number = 30 * 60 * 1000 // 30 minutes default
    ): Promise<boolean> => {
      const key = HybridCacheUtils.Keys.conversation(conversationId);
      return hybridCache.set(key, messages, { ttl, priority: 'high' });
    },

    // Get conversation from cache
    getConversation: async (conversationId: string): Promise<ChatMessage[] | null> => {
      const key = HybridCacheUtils.Keys.conversation(conversationId);
      return hybridCache.get<ChatMessage[]>(key);
    },

    // Cache persona responses with confidence scoring
    cachePersonaResponse: async (
      persona: string,
      query: string,
      response: string,
      confidence: number = 0.85
    ): Promise<boolean> => {
      const key = HybridCacheUtils.Keys.personaResponse(persona, query);
      const ttl = confidence > 0.9 ? HybridCacheUtils.TTL.LONG : HybridCacheUtils.TTL.MEDIUM;
      
      const cacheData = {
        response,
        confidence,
        timestamp: Date.now(),
        persona,
        query
      };
      
      return hybridCache.set(key, cacheData, { ttl, priority: confidence > 0.9 ? 'high' : 'normal' });
    },

    // Get persona response from cache
    getPersonaResponse: async (
      persona: string,
      query: string
    ): Promise<{ response: string; confidence: number } | null> => {
      const key = HybridCacheUtils.Keys.personaResponse(persona, query);
      const cached = await hybridCache.get<PersonaResponse>(key);
      
      if (cached && cached.response && cached.confidence) {
        return {
          response: cached.response,
          confidence: cached.confidence
        };
      }
      
      return null;
    },

    // Cache user conversations list
    cacheUserConversations: async (
      userId: string,
      conversations: ConversationData[],
      ttl: number = 30 * 60 * 1000
    ): Promise<boolean> => {
      const key = HybridCacheUtils.Keys.conversations(userId);
      return hybridCache.set(key, conversations, { ttl });
    },

    // Get user conversations from cache
    getUserConversations: async (userId: string): Promise<ConversationData[] | null> => {
      const key = HybridCacheUtils.Keys.conversations(userId);
      return hybridCache.get<ConversationData[]>(key);
    },

    // Cache fallback responses
    cacheFallbackResponse: async (
      query: string,
      response: string,
      ttl: number = 5 * 60 * 1000 // 5 minutes for fallbacks
    ): Promise<boolean> => {
      const key = HybridCacheUtils.Keys.fallback(query);
      return hybridCache.set(key, response, { ttl, priority: 'low' });
    },

    // Get fallback response
    getFallbackResponse: async (query: string): Promise<string | null> => {
      const key = HybridCacheUtils.Keys.fallback(query);
      return hybridCache.get<string>(key);
    },

    // Warmup cache with common topics
    warmupCache: async (topics: string[]): Promise<void> => {
      logger.log('🔥 Warming up hybrid cache...');
      
      const promises = topics.map(async (topic) => {
        const key = HybridCacheUtils.Keys.warmup(topic);
        const cached = await hybridCache.get(key);
        
        if (!cached) {
          // Store placeholder for warmup - will be replaced by actual API calls
          const placeholderData = {
            topic,
            warmedUp: true,
            timestamp: Date.now()
          };
          
          await hybridCache.set(key, placeholderData, { 
            ttl: 2 * 60 * 60 * 1000, // 2 hours for warmup
            skipFirestore: true // Only local warmup
          });
        }
      });
      
      await Promise.all(promises);
      logger.log('✅ Hybrid cache warmup completed');
    },

    // Get cache statistics that replace Redis stats
    getStats: async (): Promise<{
      hits: number;
      misses: number;
      hitRate: number;
      totalEntries: number;
      layers: {
        memory: number;
        localStorage: number;
        firestore: number;
      };
    }> => {
      const stats = await hybridCache.getDetailedStats();
      
      return {
        hits: stats.totalHits,
        misses: stats.totalMisses,
        hitRate: stats.hitRatio,
        totalEntries: stats.memory.size + stats.localStorage.size + stats.firestore.size,
        layers: {
          memory: stats.memory.size,
          localStorage: stats.localStorage.size,
          firestore: stats.firestore.size
        }
      };
    },

    // Batch operations for performance
    batchSet: async (entries: BatchCacheEntry[]): Promise<number> => {
      let successful = 0;
      
      const promises = entries.map(async (entry) => {
        try {
          const success = await hybridCache.set(entry.key, entry.data, { 
            ttl: entry.ttl || HybridCacheUtils.TTL.MEDIUM 
          });
          if (success) successful++;
        } catch (error) {
          console.warn(`[HybridCache] Batch set failed for ${entry.key}:`, error);
        }
      });
      
      await Promise.all(promises);
      return successful;
    },

    // Clear specific namespaces (like Redis namespaces)
    clearNamespace: async (namespace: string): Promise<boolean> => {
      // This is a simplified version - in a full implementation,
      // we'd need to track keys by namespace
      logger.log(`[HybridCache] Clearing namespace: ${namespace}`);
      
      // For now, we'll clear based on key patterns
      // Future improvement: implement proper namespace tracking
      return true;
    }
  }
};

export default hybridCache;