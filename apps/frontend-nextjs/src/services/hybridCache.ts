/**
 * Sistema de Cache Híbrido Completo
 * Integra cache local (memory + localStorage) com persistência no Firestore
 * Estratégia: memory_first (memory → localStorage → Firestore)
 * Inclui sincronização em background e fallback offline
 */

import { firestoreCache, FirestoreCacheUtils } from '../lib/firebase/firestoreCache';

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
  private memoryCache = new Map<string, HybridCacheEntry<any>>();
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
      console.log(`[HybridCache] Memory hit: ${key}`);
      return memoryResult;
    }
    this.stats.memory.misses++;

    // 2. Verificar localStorage
    const localStorageResult = await this.getFromLocalStorage<T>(sanitizedKey);
    if (localStorageResult !== null) {
      this.stats.localStorage.hits++;
      this.updateTotalStats();
      
      // Promover para memory cache
      this.setInMemory(sanitizedKey, localStorageResult, this.config.memory.defaultTTL);
      
      console.log(`[HybridCache] localStorage hit: ${key}`);
      return localStorageResult;
    }
    this.stats.localStorage.misses++;

    // 3. Verificar Firestore (se online)
    if (this.isOnline) {
      const firestoreResult = await this.getFromFirestore<T>(sanitizedKey);
      if (firestoreResult !== null) {
        this.stats.firestore.hits++;
        this.updateTotalStats();
        
        // Promover para memory e localStorage
        this.setInMemory(sanitizedKey, firestoreResult, this.config.memory.defaultTTL);
        this.setInLocalStorage(sanitizedKey, firestoreResult, this.config.localStorage.defaultTTL);
        
        console.log(`[HybridCache] Firestore hit: ${key}`);
        return firestoreResult;
      }
      this.stats.firestore.misses++;
    }

    this.updateTotalStats();
    console.log(`[HybridCache] Cache miss: ${key}`);
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
      this.setInMemory(sanitizedKey, data, ttl);
      
      // Armazenar em localStorage apenas se TTL for maior que um valor mínimo
      if (ttl >= 30000) { // 30 segundos mínimo para localStorage
        this.setInLocalStorage(sanitizedKey, data, Math.max(ttl, this.config.localStorage.defaultTTL));
      }
      
      // Armazenar em Firestore (se não for skipado e estivermos online)
      if (!options?.skipFirestore && this.isOnline) {
        const firestoreTTL = Math.max(ttl, this.config.firestore.defaultTTL);
        
        // Adicionar à queue de sincronização para background processing
        this.syncQueue.add(sanitizedKey);
        
        // Para prioridade alta, fazer sync imediato
        if (options?.priority === 'high') {
          try {
            await this.syncToFirestore(sanitizedKey, data, firestoreTTL);
          } catch (syncError) {
            console.warn(`[HybridCache] Erro no sync prioritário ${key}:`, syncError);
            // Não falhar a operação se sync falhou - dados ainda estão localmente
          }
        }
      }
      
      console.log(`[HybridCache] Data cached: ${key}`);
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
      
      // Remover do Firestore (se online)
      if (this.isOnline) {
        const firestoreSuccess = await firestoreCache.delete(sanitizedKey);
        if (!firestoreSuccess) {
          success = false;
        }
      }
      
      // Remover da queue de sync
      this.syncQueue.delete(sanitizedKey);
      
      console.log(`[HybridCache] Data deleted: ${key}`);
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
        await firestoreCache.clear();
      }
      
      // Limpar queue de sync
      this.syncQueue.clear();
      
      // Reset stats
      this.resetStats();
      
      console.log('[HybridCache] Cache limpo completamente');
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
      console.warn('[HybridCache] Não é possível sincronizar offline');
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    
    const keysToSync = Array.from(this.syncQueue);
    
    for (const key of keysToSync) {
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry) && memoryEntry.syncStatus !== 'synced') {
        try {
          await this.syncToFirestore(key, memoryEntry.data, memoryEntry.ttl);
          synced++;
          this.syncQueue.delete(key);
        } catch (error) {
          console.error(`[HybridCache] Falha ao sincronizar ${key}:`, error);
          failed++;
        }
      } else {
        // Remover da queue se não existir, expirou ou já está sincronizado
        this.syncQueue.delete(key);
      }
    }
    
    console.log(`[HybridCache] Sincronização manual: ${synced} ok, ${failed} falhas`);
    return { synced, failed };
  }

  /**
   * Obtém estatísticas detalhadas do cache
   */
  async getDetailedStats(): Promise<CacheStats> {
    // Atualizar stats do Firestore
    if (this.isOnline) {
      try {
        const firestoreStats = await firestoreCache.getStats();
        this.stats.firestore.size = firestoreStats.totalEntries;
        this.stats.firestore.isAvailable = firestoreStats.isAvailable;
      } catch (error) {
        console.warn('[HybridCache] Erro ao obter stats do Firestore:', error);
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
    return entry.data;
  }

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    this.evictOldestMemory();
    
    const entry: HybridCacheEntry<T> = {
      data,
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
      const item = localStorage.getItem(storageKey);
      
      if (!item) {
        return null;
      }
      
      const entry: HybridCacheEntry<T> = JSON.parse(item);
      
      if (this.isExpired(entry)) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return entry.data;
      
    } catch (error) {
      console.warn(`[HybridCache] Erro ao ler localStorage ${key}:`, error);
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
      localStorage.setItem(storageKey, JSON.stringify(entry));
      
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[HybridCache] localStorage cheio, limpando entradas antigas');
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
          localStorage.setItem(storageKey, JSON.stringify(entry));
        } catch (retryError) {
          console.error('[HybridCache] Falha ao armazenar no localStorage:', retryError);
        }
      } else {
        console.error(`[HybridCache] Erro ao armazenar ${key} no localStorage:`, error);
      }
    }
  }

  private async getFromFirestore<T>(key: string): Promise<T | null> {
    try {
      return await firestoreCache.get<T>(key);
    } catch (error) {
      console.warn(`[HybridCache] Erro ao buscar ${key} no Firestore:`, error);
      return null;
    }
  }

  private async syncToFirestore<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await firestoreCache.set(key, data, ttl, {
        source: 'system',
        tags: ['hybrid-cache']
      });
      
      // Atualizar status de sync no memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        memoryEntry.syncStatus = 'synced';
      }
      
    } catch (error) {
      // Atualizar status de falha
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        memoryEntry.syncStatus = 'failed';
        memoryEntry.retryCount = (memoryEntry.retryCount || 0) + 1;
      }
      throw error;
    }
  }

  private removeFromLocalStorage(key: string): void {
    try {
      const storageKey = this.config.localStorage.keyPrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`[HybridCache] Erro ao remover ${key} do localStorage:`, error);
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
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('[HybridCache] Erro ao limpar localStorage:', error);
    }
  }

  private clearOldLocalStorage(): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.localStorage.keyPrefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              entries.push({ key, timestamp: entry.timestamp || 0 });
            }
          } catch (parseError) {
            // Remove entries que não conseguimos fazer parse
            localStorage.removeItem(key);
          }
        }
      }
      
      // Ordenar por timestamp e remover 25% mais antigos
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(entries.length * 0.25);
      
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
      
    } catch (error) {
      console.error('[HybridCache] Erro ao limpar entradas antigas:', error);
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
            console.log(`[HybridCache] Background sync: ${result.synced} items`);
          }
        } catch (error) {
          console.warn('[HybridCache] Background sync error:', error);
        }
      }
    }, this.config.firestore.syncInterval);
  }

  private initializeNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('[HybridCache] Voltou online - iniciando sync');
        this.forceSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('[HybridCache] Modo offline ativado');
      });
    }
  }

  private async initializeFirestoreStatus(): Promise<void> {
    try {
      const isReady = await firestoreCache.isReady();
      this.stats.firestore.isAvailable = isReady;
    } catch (error) {
      console.warn('[HybridCache] Erro ao verificar status do Firestore:', error);
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
  }
};

export default hybridCache;