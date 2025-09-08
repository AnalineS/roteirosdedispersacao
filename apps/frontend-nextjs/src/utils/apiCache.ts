/**
 * Sistema de Cache Inteligente para API Calls
 * Reduz requisições desnecessárias e melhora performance
 * Agora integrado com sistema de cache híbrido
 */

import { hybridCache, HybridCacheUtils } from '../services/hybridCache';

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
  private useHybridCache = true; // Flag para usar cache híbrido

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
   * Obtém dados do cache (agora com suporte híbrido)
   */
  get<T>(url: string, params?: any): T | null {
    const key = this.generateKey(url, params);
    
    // Usar cache híbrido se disponível
    if (this.useHybridCache) {
      // Usar Promise.resolve para compatibilidade com código síncrono existente
      // O resultado será null se não estiver em memory cache
      try {
        const hybridKey = HybridCacheUtils.Keys.api(url, params ? JSON.stringify(params) : undefined);
        // Para manter compatibilidade, apenas verificar memory cache do híbrido
        // O cache completo será usado na versão async
        return this.getFromMemoryOnly(key);
      } catch (error) {
        console.warn('[APICache] Erro ao acessar cache híbrido:', error);
        // Fallback para cache local
      }
    }
    
    // Cache local original
    this.cleanup();
    
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
   * Obtém dados do cache híbrido (versão async)
   */
  async getAsync<T>(url: string, params?: any): Promise<T | null> {
    const key = this.generateKey(url, params);
    
    if (this.useHybridCache) {
      try {
        const hybridKey = HybridCacheUtils.Keys.api(url, params ? JSON.stringify(params) : undefined);
        const result = await hybridCache.get<T>(hybridKey);
        if (result !== null) {
          return result;
        }
      } catch (error) {
        console.warn('[APICache] Erro ao acessar cache híbrido:', error);
      }
    }
    
    // Fallback para cache local
    return this.get<T>(url, params);
  }

  /**
   * Armazena dados no cache (agora com suporte híbrido)
   */
  set<T>(url: string, data: T, params?: any, customTTL?: number): void {
    const key = this.generateKey(url, params);
    const ttl = customTTL || this.defaultTTL;
    
    // Usar cache híbrido se disponível
    if (this.useHybridCache) {
      try {
        const hybridKey = HybridCacheUtils.Keys.api(url, params ? JSON.stringify(params) : undefined);
        hybridCache.set(hybridKey, data, { 
          ttl,
          priority: 'normal'
        }).catch(error => {
          console.warn('[APICache] Erro ao armazenar no cache híbrido:', error);
        });
      } catch (error) {
        console.warn('[APICache] Erro ao acessar cache híbrido:', error);
      }
    }
    
    // Manter cache local para compatibilidade
    this.evictOldest();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Armazena dados no cache híbrido (versão async)
   */
  async setAsync<T>(url: string, data: T, params?: any, customTTL?: number): Promise<boolean> {
    const key = this.generateKey(url, params);
    const ttl = customTTL || this.defaultTTL;
    
    let success = false;
    
    if (this.useHybridCache) {
      try {
        const hybridKey = HybridCacheUtils.Keys.api(url, params ? JSON.stringify(params) : undefined);
        success = await hybridCache.set(hybridKey, data, { 
          ttl,
          priority: 'normal'
        });
      } catch (error) {
        console.warn('[APICache] Erro ao armazenar no cache híbrido:', error);
      }
    }
    
    // Sempre manter cache local
    this.set(url, data, params, customTTL);
    return success;
  }

  /**
   * Método auxiliar para verificar apenas memory cache
   */
  private getFromMemoryOnly<T>(key: string): T | null {
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
   * Remove entrada específica do cache (agora com suporte híbrido)
   */
  delete(url: string, params?: any): void {
    const key = this.generateKey(url, params);
    
    // Remover do cache híbrido se disponível
    if (this.useHybridCache) {
      try {
        const hybridKey = HybridCacheUtils.Keys.api(url, params ? JSON.stringify(params) : undefined);
        hybridCache.delete(hybridKey).catch(error => {
          console.warn('[APICache] Erro ao deletar do cache híbrido:', error);
        });
      } catch (error) {
        console.warn('[APICache] Erro ao acessar cache híbrido:', error);
      }
    }
    
    // Remover do cache local
    this.cache.delete(key);
  }

  /**
   * Remove entrada específica do cache (versão async)
   */
  async deleteAsync(url: string, params?: any): Promise<boolean> {
    const key = this.generateKey(url, params);
    let success = false;
    
    // Remover do cache híbrido se disponível
    if (this.useHybridCache) {
      try {
        const hybridKey = HybridCacheUtils.Keys.api(url, params ? JSON.stringify(params) : undefined);
        success = await hybridCache.delete(hybridKey);
      } catch (error) {
        console.warn('[APICache] Erro ao deletar do cache híbrido:', error);
      }
    }
    
    // Sempre remover do cache local
    this.cache.delete(key);
    return success;
  }

  /**
   * Limpa todo o cache (agora com suporte híbrido)
   */
  clear(): void {
    // Limpar cache híbrido se disponível
    if (this.useHybridCache) {
      try {
        hybridCache.clear().catch(error => {
          console.warn('[APICache] Erro ao limpar cache híbrido:', error);
        });
      } catch (error) {
        console.warn('[APICache] Erro ao acessar cache híbrido:', error);
      }
    }
    
    // Limpar cache local
    this.cache.clear();
  }

  /**
   * Limpa todo o cache (versão async)
   */
  async clearAsync(): Promise<boolean> {
    let success = false;
    
    // Limpar cache híbrido se disponível
    if (this.useHybridCache) {
      try {
        success = await hybridCache.clear();
      } catch (error) {
        console.warn('[APICache] Erro ao limpar cache híbrido:', error);
      }
    }
    
    // Sempre limpar cache local
    this.cache.clear();
    return success;
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
 * Configuração para habilitar/desabilitar cache híbrido
 */
export const CacheConfig = {
  setHybridCache: (enabled: boolean) => {
    // @ts-ignore
    apiCache.useHybridCache = enabled;
  },
  isHybridCacheEnabled: () => {
    // @ts-ignore
    return apiCache.useHybridCache;
  }
};

/**
 * Cache específico para personas (mais longo TTL)
 * Agora com suporte híbrido
 */
export const PersonasCache = {
  get: (): any => apiCache.get('personas', undefined),
  getAsync: (): Promise<any> => apiCache.getAsync('personas', undefined),
  set: (data: any) => apiCache.set('personas', data, undefined, 30 * 60 * 1000), // 30 min
  setAsync: (data: any) => apiCache.setAsync('personas', data, undefined, 30 * 60 * 1000),
  clear: () => apiCache.delete('personas'),
  clearAsync: () => apiCache.deleteAsync('personas')
};

/**
 * Cache específico para respostas de chat
 * Agora com suporte híbrido
 */
export const ChatCache = {
  get: (message: string, persona: string) => 
    apiCache.get('chat', { message, persona }),
  getAsync: (message: string, persona: string) => 
    apiCache.getAsync('chat', { message, persona }),
  set: (message: string, persona: string, response: ChatResponse) => 
    apiCache.set('chat', response, { message, persona }, 2 * 60 * 1000), // 2 min
  setAsync: (message: string, persona: string, response: ChatResponse) => 
    apiCache.setAsync('chat', response, { message, persona }, 2 * 60 * 1000),
  clear: () => apiCache.clear(),
  clearAsync: () => apiCache.clearAsync()
};

// Import React for the hook
import React from 'react';
import type { ChatResponse } from '@/types/api';