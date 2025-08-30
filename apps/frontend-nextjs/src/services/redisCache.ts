/**
 * Serviço de Cache Redis para o Frontend
 * Conecta ao backend que gerencia o Redis usando secrets do GitHub
 */

import { apiCache } from '@/utils/apiCache';

interface RedisCacheResponse<T = any> {
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
  ttl?: number; // Time to live em segundos
  namespace?: string;
  forceRefresh?: boolean;
}

class RedisCache {
  private apiEndpoint: string;
  private defaultTTL: number;
  private namespace: string;

  constructor() {
    // O backend já está configurado com REDIS_URL do GitHub Secrets
    this.apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app';
    this.defaultTTL = 3600; // 1 hora padrão
    this.namespace = 'chat';
  }

  /**
   * Busca valor do cache via API backend
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      
      const response = await fetch(`${this.apiEndpoint}/api/cache/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: fullKey }),
      });

      if (!response.ok) {
        console.warn('Cache miss:', fullKey);
        return null;
      }

      const result: RedisCacheResponse<T> = await response.json();
      
      if (result.success && result.data) {
        console.log('🎯 Cache hit:', fullKey);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Define valor no cache via API backend
   */
  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;

      const response = await fetch(`${this.apiEndpoint}/api/cache/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          key: fullKey, 
          value, 
          ttl 
        }),
      });

      const result: RedisCacheResponse = await response.json();
      
      if (result.success) {
        console.log('💾 Cached:', fullKey);
      }
      
      return result.success || false;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.namespace);

      const response = await fetch(`${this.apiEndpoint}/api/cache/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: fullKey }),
      });

      const result: RedisCacheResponse = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Limpa todo o namespace
   */
  async clear(namespace?: string): Promise<boolean> {
    try {
      const ns = namespace || this.namespace;

      const response = await fetch(`${this.apiEndpoint}/api/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ namespace: ns }),
      });

      const result: RedisCacheResponse = await response.json();
      
      if (result.success) {
        console.log('🧹 Cache cleared:', ns);
      }
      
      return result.success || false;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  }

  /**
   * Busca estatísticas do cache
   */
  async getStats(): Promise<RedisCacheResponse['stats'] | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}/api/cache/stats`);
      const result: RedisCacheResponse = await response.json();
      
      return result.stats || null;
    } catch (error) {
      console.error('Redis stats error:', error);
      return null;
    }
  }

  /**
   * Wrapper com fallback para cache local se Redis falhar
   */
  async getWithFallback<T = any>(
    key: string, 
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Tentar Redis primeiro
    if (!options.forceRefresh) {
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }
    }

    // Se não encontrou ou forceRefresh, buscar novo valor
    try {
      const value = await fetcher();
      
      // Salvar no Redis de forma assíncrona (não bloquear)
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
   * Pre-cache de tópicos comuns
   */
  async warmupCache(topics: string[]): Promise<void> {
    console.log('🔥 Warming up Redis cache...');
    
    const promises = topics.map(async (topic) => {
      const key = this.buildKey(topic, 'warmup');
      const cached = await this.get(key);
      
      if (!cached) {
        // Fazer pre-fetch via API
        try {
          const response = await fetch(`${this.apiEndpoint}/api/knowledge/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              question: topic,
              prefetch: true 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            await this.set(key, data, { ttl: 7200 }); // 2 horas para warmup
          }
        } catch (error) {
          console.warn(`Failed to warmup topic "${topic}":`, error);
        }
      }
    });
    
    await Promise.all(promises);
    console.log('✅ Cache warmup completed');
  }

  /**
   * Constrói chave completa com namespace
   */
  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.namespace;
    return `${ns}:${key}`;
  }

  /**
   * Cache de conversas específicas
   */
  async cacheConversation(
    conversationId: string, 
    messages: any[],
    ttl: number = 1800 // 30 minutos padrão
  ): Promise<boolean> {
    const key = `conversation:${conversationId}`;
    return this.set(key, messages, { ttl, namespace: 'conversations' });
  }

  /**
   * Recupera conversa do cache
   */
  async getConversation(conversationId: string): Promise<any[] | null> {
    const key = `conversation:${conversationId}`;
    return this.get(key, { namespace: 'conversations' });
  }

  /**
   * Cache de respostas de personas
   */
  async cachePersonaResponse(
    persona: string,
    query: string,
    response: any,
    confidence: number = 0.85
  ): Promise<boolean> {
    const key = `${persona}:${query.toLowerCase().replace(/\s+/g, '_')}`;
    
    return this.set(
      key, 
      { response, confidence, timestamp: Date.now() },
      { ttl: confidence > 0.9 ? 7200 : 3600, namespace: 'personas' }
    );
  }

  /**
   * Busca resposta de persona em cache
   */
  async getPersonaResponse(
    persona: string,
    query: string
  ): Promise<{ response: any; confidence: number } | null> {
    const key = `${persona}:${query.toLowerCase().replace(/\s+/g, '_')}`;
    return this.get(key, { namespace: 'personas' });
  }
}

// Singleton
export const redisCache = new RedisCache();

// Hook para uso em componentes React
export function useRedisCache() {
  return {
    get: redisCache.get.bind(redisCache),
    set: redisCache.set.bind(redisCache),
    delete: redisCache.delete.bind(redisCache),
    clear: redisCache.clear.bind(redisCache),
    getStats: redisCache.getStats.bind(redisCache),
    getWithFallback: redisCache.getWithFallback.bind(redisCache),
    warmupCache: redisCache.warmupCache.bind(redisCache),
    cacheConversation: redisCache.cacheConversation.bind(redisCache),
    getConversation: redisCache.getConversation.bind(redisCache),
    cachePersonaResponse: redisCache.cachePersonaResponse.bind(redisCache),
    getPersonaResponse: redisCache.getPersonaResponse.bind(redisCache),
  };
}