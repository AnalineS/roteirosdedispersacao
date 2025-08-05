/**
 * Sistema de Cache Inteligente para API Calls
 * Reduz requisições desnecessárias e melhora performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em ms
  key: string;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 50; // Máximo de entradas no cache
  private defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

  /**
   * Gera chave única para o cache baseada na URL e parâmetros
   */
  private generateKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  /**
   * Verifica se uma entrada está expirada
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Remove entradas expiradas
   */
  private cleanup(): void {
    const entriesToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Remove a entrada mais antiga se o cache estiver cheio
   */
  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      this.cache.forEach((entry, key) => {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Obtém dados do cache
   */
  get<T>(url: string, params?: any): T | null {
    this.cleanup();
    
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }
    
    // Atualizar timestamp para LRU
    entry.timestamp = Date.now();
    return entry.data;
  }

  /**
   * Armazena dados no cache
   */
  set<T>(url: string, data: T, params?: any, customTTL?: number): void {
    this.evictOldest();
    
    const key = this.generateKey(url, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTTL || this.defaultTTL,
      key
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Remove entrada específica do cache
   */
  delete(url: string, params?: any): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
    hitRate: number;
  } {
    const keys: string[] = [];
    this.cache.forEach((_, key) => keys.push(key));
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys,
      hitRate: 0 // Seria necessário tracking adicional
    };
  }

  /**
   * Pré-carrega dados no cache
   */
  preload<T>(url: string, data: T, params?: any, customTTL?: number): void {
    this.set(url, data, params, customTTL);
  }
}

// Instância global do cache
export const apiCache = new APICache();

/**
 * Hook para usar cache com React
 */
export function useCachedAPI<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  params?: any,
  ttl?: number
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    // Verificar cache primeiro
    const cachedData = apiCache.get<T>(cacheKey, params);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      apiCache.set(cacheKey, result, params, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, params, ttl, fetcher]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

/**
 * Wrapper para fetch com cache automático
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheOptions?: {
    ttl?: number;
    forceRefresh?: boolean;
    params?: any;
  }
): Promise<T> {
  const { ttl, forceRefresh = false, params } = cacheOptions || {};

  // Verificar cache se não forçar refresh
  if (!forceRefresh) {
    const cached = apiCache.get<T>(url, params);
    if (cached) {
      return cached;
    }
  }

  // Fazer requisição
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Armazenar no cache
  apiCache.set(url, data, params, ttl);
  
  return data;
}

/**
 * Cache específico para personas (mais longo TTL)
 */
export const PersonasCache = {
  get: (): any => apiCache.get('personas', undefined),
  set: (data: any) => apiCache.set('personas', data, undefined, 30 * 60 * 1000), // 30 min
  clear: () => apiCache.delete('personas')
};

/**
 * Cache específico para respostas de chat
 */
export const ChatCache = {
  get: (message: string, persona: string) => 
    apiCache.get('chat', { message, persona }),
  set: (message: string, persona: string, response: any) => 
    apiCache.set('chat', response, { message, persona }, 2 * 60 * 1000), // 2 min
  clear: () => apiCache.clear()
};

// Import React for the hook
import React from 'react';