/**
 * Firestore Cache Service - Complete Redis Replacement
 * Provides all the functionality previously handled by Redis
 * Uses hybrid caching with Firestore as the backend persistence layer
 */

import { hybridCache, HybridCacheUtils } from './hybridCache';
import { apiCache } from '@/utils/apiCache';

interface FirestoreCacheResponse<T = any> {
  success: boolean;
  data?: T;
  cached?: boolean;
  error?: string;
  stats?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
  namespace?: string;
  forceRefresh?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

class FirestoreCacheService {
  private defaultTTL: number;
  private namespace: string;

  constructor() {
    this.defaultTTL = HybridCacheUtils.TTL.MEDIUM; // 10 minutos padrão
    this.namespace = 'chat';
  }

  /**
   * Busca valor do cache usando hybrid cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      
      console.log(`[FirestoreCache] Getting: ${fullKey}`);
      const data = await hybridCache.get<T>(fullKey);
      
      if (data !== null) {
        console.log(`🎯 Cache hit: ${fullKey}`);
        return data;
      }

      return null;
    } catch (error) {
      console.error('Firestore cache get error:', error);
      return null;
    }
  }

  /**
   * Define valor no cache usando hybrid cache
   */
  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;

      const success = await hybridCache.set(fullKey, value, {
        ttl,
        priority: options.priority || 'normal'
      });
      
      if (success) {
        console.log(`💾 Cached: ${fullKey}`);
      }
      
      return success;
    } catch (error) {
      console.error('Firestore cache set error:', error);
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      return await hybridCache.delete(fullKey);
    } catch (error) {
      console.error('Firestore cache delete error:', error);
      return false;
    }
  }

  /**
   * Limpa todo o namespace (usando clear do hybrid cache)
   */
  async clear(namespace?: string): Promise<boolean> {
    try {
      const ns = namespace || this.namespace;
      
      // Para agora, usar clear geral - futuro: implementar clear por namespace
      if (ns === this.namespace) {
        await hybridCache.clear();
        console.log('🧹 Cache cleared completely');
        return true;
      } else {
        // Clear específico do namespace seria implementado aqui
        await HybridCacheUtils.Specialized.clearNamespace(ns);
        console.log(`🧹 Cache cleared for namespace: ${ns}`);
        return true;
      }
    } catch (error) {
      console.error('Firestore cache clear error:', error);
      return false;
    }
  }

  /**
   * Busca estatísticas do cache
   */
  async getStats(): Promise<FirestoreCacheResponse['stats'] | null> {
    try {
      const stats = await HybridCacheUtils.Specialized.getStats();
      
      return {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hitRate
      };
    } catch (error) {
      console.error('Firestore cache stats error:', error);
      return null;
    }
  }

  /**
   * Wrapper com fallback para cache local se Firestore falhar
   * Esta é a funcionalidade chave que substitui o Redis getWithFallback
   */
  async getWithFallback<T = any>(
    key: string, 
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tentar cache híbrido primeiro
    if (!options.forceRefresh) {
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }
    }

    // Se não encontrou ou forceRefresh, buscar novo valor
    try {
      const value = await fetcher();
      
      // Salvar no cache híbrido de forma assíncrona
      this.set(key, value, options).catch(err => 
        console.warn('Failed to cache:', err)
      );
      
      return value;
    } catch (error) {
      // Em caso de erro, tentar cache local como último recurso
      const localCached = apiCache.get<T>(key);
      if (localCached) {
        console.log('📦 Using local cache fallback');
        return localCached;
      }
      
      throw error;
    }
  }

  /**
   * Pre-cache de tópicos comuns - substitui Redis warmup
   */
  async warmupCache(topics: string[]): Promise<void> {
    console.log('🔥 Warming up Firestore cache...');
    
    try {
      await HybridCacheUtils.Specialized.warmupCache(topics);
    } catch (error) {
      console.warn('Cache warmup failed:', error);
    }
  }

  /**
   * Cache de conversas específicas - substitui Redis conversation cache
   */
  async cacheConversation(
    conversationId: string, 
    messages: any[],
    ttl: number = 30 * 60 * 1000 // 30 minutos padrão
  ): Promise<boolean> {
    try {
      return await HybridCacheUtils.Specialized.cacheConversation(conversationId, messages, ttl);
    } catch (error) {
      console.error('Failed to cache conversation:', error);
      return false;
    }
  }

  /**
   * Recupera conversa do cache
   */
  async getConversation(conversationId: string): Promise<any[] | null> {
    try {
      return await HybridCacheUtils.Specialized.getConversation(conversationId);
    } catch (error) {
      console.error('Failed to get conversation from cache:', error);
      return null;
    }
  }

  /**
   * Cache de respostas de personas - substitui Redis persona cache
   */
  async cachePersonaResponse(
    persona: string,
    query: string,
    response: any,
    confidence: number = 0.85
  ): Promise<boolean> {
    try {
      return await HybridCacheUtils.Specialized.cachePersonaResponse(
        persona, query, response, confidence
      );
    } catch (error) {
      console.error('Failed to cache persona response:', error);
      return false;
    }
  }

  /**
   * Busca resposta de persona em cache
   */
  async getPersonaResponse(
    persona: string,
    query: string
  ): Promise<{ response: any; confidence: number } | null> {
    try {
      return await HybridCacheUtils.Specialized.getPersonaResponse(persona, query);
    } catch (error) {
      console.error('Failed to get persona response from cache:', error);
      return null;
    }
  }

  /**
   * Cache de lista de conversas do usuário
   */
  async cacheUserConversations(
    userId: string, 
    conversations: any[], 
    ttl: number = 30 * 60 * 1000
  ): Promise<boolean> {
    try {
      return await HybridCacheUtils.Specialized.cacheUserConversations(userId, conversations, ttl);
    } catch (error) {
      console.error('Failed to cache user conversations:', error);
      return false;
    }
  }

  /**
   * Busca lista de conversas do usuário
   */
  async getUserConversations(userId: string): Promise<any[] | null> {
    try {
      return await HybridCacheUtils.Specialized.getUserConversations(userId);
    } catch (error) {
      console.error('Failed to get user conversations from cache:', error);
      return null;
    }
  }

  /**
   * Constrói chave completa com namespace
   */
  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.namespace;
    return `${ns}:${key}`;
  }

  /**
   * Força sincronização manual com backend
   */
  async forceSync(): Promise<{ synced: number; failed: number }> {
    try {
      return await hybridCache.forceSync();
    } catch (error) {
      console.error('Failed to force sync:', error);
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * Verifica se o cache está operacional
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Teste simples: tentar armazenar e recuperar um valor
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      const setSuccess = await this.set(testKey, testValue, { ttl: 5000 }); // 5 segundos
      if (!setSuccess) return false;
      
      const getValue = await this.get(testKey);
      if (!getValue) return false;
      
      // Limpar teste
      await this.delete(testKey);
      
      return true;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Operações em lote para performance
   */
  async batchSet(entries: Array<{ key: string; data: any; ttl?: number; namespace?: string }>): Promise<number> {
    try {
      const batchEntries = entries.map(entry => ({
        key: this.buildKey(entry.key, entry.namespace),
        data: entry.data,
        ttl: entry.ttl
      }));
      
      return await HybridCacheUtils.Specialized.batchSet(batchEntries);
    } catch (error) {
      console.error('Batch set failed:', error);
      return 0;
    }
  }
}

// Singleton exportado - substitui diretamente o redisCache
export const firestoreCache = new FirestoreCacheService();

// Hook para uso em componentes React - compatível com useRedisCache anterior
export function useFirestoreCache() {
  return {
    get: firestoreCache.get.bind(firestoreCache),
    set: firestoreCache.set.bind(firestoreCache),
    delete: firestoreCache.delete.bind(firestoreCache),
    clear: firestoreCache.clear.bind(firestoreCache),
    getStats: firestoreCache.getStats.bind(firestoreCache),
    getWithFallback: firestoreCache.getWithFallback.bind(firestoreCache),
    warmupCache: firestoreCache.warmupCache.bind(firestoreCache),
    cacheConversation: firestoreCache.cacheConversation.bind(firestoreCache),
    getConversation: firestoreCache.getConversation.bind(firestoreCache),
    cachePersonaResponse: firestoreCache.cachePersonaResponse.bind(firestoreCache),
    getPersonaResponse: firestoreCache.getPersonaResponse.bind(firestoreCache),
    cacheUserConversations: firestoreCache.cacheUserConversations.bind(firestoreCache),
    getUserConversations: firestoreCache.getUserConversations.bind(firestoreCache),
    forceSync: firestoreCache.forceSync.bind(firestoreCache),
    isHealthy: firestoreCache.isHealthy.bind(firestoreCache),
    batchSet: firestoreCache.batchSet.bind(firestoreCache),
  };
}

// Alias para manter compatibilidade com código que importava redisCache
export const redisCache = firestoreCache;
export const useRedisCache = useFirestoreCache;

export default firestoreCache;