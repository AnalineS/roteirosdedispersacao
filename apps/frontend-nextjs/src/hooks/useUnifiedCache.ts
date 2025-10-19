/**
 * Hook para Cache Híbrido Frontend - integração com sistema unificado
 * Combina memory cache + localStorage + API cache
 * Otimizado para performance e fallback offline
 *
 * Data: 09 de Janeiro de 2025
 * Fase: Integração Frontend
 */

import { useCallback, useRef, useEffect } from "react";
import { safeLocalStorage } from "@/hooks/useClientStorage";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  source: "memory" | "localStorage" | "api";
}

interface CacheStats {
  memorySize: number;
  localStorageSize: number;
  hitRate: number;
  totalRequests: number;
  memoryHits: number;
  localStorageHits: number;
  apiHits: number;
  misses: number;
}

interface UnifiedCacheConfig {
  memoryMaxSize?: number;
  defaultTTL?: number;
  enableLocalStorage?: boolean;
  enableAPICache?: boolean;
  apiCacheEndpoint?: string;
}

const DEFAULT_CONFIG: UnifiedCacheConfig = {
  memoryMaxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  enableLocalStorage: true,
  enableAPICache: true,
  apiCacheEndpoint: "/api/cache",
};

export const useUnifiedCache = <T = any>(config: UnifiedCacheConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Memory cache (mais rápido)
  const memoryCache = useRef<Map<string, CacheEntry<T>>>(new Map());

  // Estatísticas
  const stats = useRef<CacheStats>({
    memorySize: 0,
    localStorageSize: 0,
    hitRate: 0,
    totalRequests: 0,
    memoryHits: 0,
    localStorageHits: 0,
    apiHits: 0,
    misses: 0,
  });

  /**
   * Gera chave de cache determinística
   */
  const generateKey = useCallback((key: string, namespace?: string): string => {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    // Simple hash para manter consistência
    let hash = 0;
    for (let i = 0; i < fullKey.length; i++) {
      const char = fullKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `unified_cache_${Math.abs(hash)}`;
  }, []);

  /**
   * Busca no memory cache
   */
  const getFromMemory = useCallback((cacheKey: string): T | null => {
    const entry = memoryCache.current.get(cacheKey);
    if (!entry) return null;

    // Verificar TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      memoryCache.current.delete(cacheKey);
      return null;
    }

    entry.hits++;
    stats.current.memoryHits++;
    return entry.data;
  }, []);

  /**
   * Salva no memory cache
   */
  const setToMemory = useCallback(
    (cacheKey: string, data: T, ttl: number): void => {
      // Limitar tamanho do cache
      if (memoryCache.current.size >= finalConfig.memoryMaxSize!) {
        // Remover entrada mais antiga
        const oldestKey = Array.from(memoryCache.current.entries()).sort(
          ([, a], [, b]) => a.timestamp - b.timestamp,
        )[0][0];
        memoryCache.current.delete(oldestKey);
      }

      memoryCache.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        source: "memory",
      });

      stats.current.memorySize = memoryCache.current.size;
    },
    [finalConfig.memoryMaxSize],
  );

  /**
   * Busca no localStorage
   */
  const getFromLocalStorage = useCallback(
    (cacheKey: string): T | null => {
      if (!finalConfig.enableLocalStorage || typeof window === "undefined") {
        return null;
      }

      try {
        const stored = safeLocalStorage()?.getItem(cacheKey);
        if (!stored) return null;

        const entry: CacheEntry<T> = JSON.parse(stored);

        // Verificar TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
          safeLocalStorage()?.removeItem(cacheKey);
          return null;
        }

        entry.hits++;
        safeLocalStorage()?.setItem(cacheKey, JSON.stringify(entry));
        stats.current.localStorageHits++;
        return entry.data;
      } catch (error) {
        return null;
      }
    },
    [finalConfig.enableLocalStorage],
  );

  /**
   * Salva no localStorage
   */
  const setToLocalStorage = useCallback(
    (cacheKey: string, data: T, ttl: number): void => {
      if (!finalConfig.enableLocalStorage || typeof window === "undefined") {
        return;
      }

      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl,
          hits: 0,
          source: "localStorage",
        };

        safeLocalStorage()?.setItem(cacheKey, JSON.stringify(entry));

        // Atualizar estatísticas
        stats.current.localStorageSize = localStorage.length;
      } catch (error) {
        // Silent fail for localStorage
      }
    },
    [finalConfig.enableLocalStorage],
  );

  /**
   * Busca no API cache
   */
  const getFromAPI = useCallback(
    async (cacheKey: string): Promise<T | null> => {
      if (!finalConfig.enableAPICache) return null;

      try {
        const response = await fetch(`${finalConfig.apiCacheEndpoint}/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: cacheKey }),
        });

        if (!response.ok) return null;

        const result = await response.json();
        if (result.success && result.data) {
          stats.current.apiHits++;

          // Promover para caches superiores
          setToMemory(cacheKey, result.data, finalConfig.defaultTTL!);
          setToLocalStorage(cacheKey, result.data, finalConfig.defaultTTL!);

          return result.data;
        }

        return null;
      } catch (error) {
        return null;
      }
    },
    [
      finalConfig.enableAPICache,
      finalConfig.apiCacheEndpoint,
      finalConfig.defaultTTL,
      setToMemory,
      setToLocalStorage,
    ],
  );

  /**
   * Salva no API cache
   */
  const setToAPI = useCallback(
    async (cacheKey: string, data: T, ttl: number): Promise<void> => {
      if (!finalConfig.enableAPICache) return;

      try {
        await fetch(`${finalConfig.apiCacheEndpoint}/set`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: cacheKey,
            value: data,
            ttl: Math.floor(ttl / 1000), // API espera segundos
          }),
        });
      } catch (error) {
        // Silent fail for API cache
      }
    },
    [finalConfig.enableAPICache, finalConfig.apiCacheEndpoint],
  );

  /**
   * Busca com fallback hierárquico
   */
  const get = useCallback(
    async (key: string, namespace?: string): Promise<T | null> => {
      const cacheKey = generateKey(key, namespace);
      stats.current.totalRequests++;

      // Level 1: Memory cache
      const memoryResult = getFromMemory(cacheKey);
      if (memoryResult !== null) {
        return memoryResult;
      }

      // Level 2: localStorage
      const localResult = getFromLocalStorage(cacheKey);
      if (localResult !== null) {
        // Promover para memory
        setToMemory(cacheKey, localResult, finalConfig.defaultTTL!);
        return localResult;
      }

      // Level 3: API cache
      const apiResult = await getFromAPI(cacheKey);
      if (apiResult !== null) {
        return apiResult;
      }

      // Miss completo
      stats.current.misses++;
      return null;
    },
    [
      generateKey,
      getFromMemory,
      getFromLocalStorage,
      getFromAPI,
      setToMemory,
      finalConfig.defaultTTL,
    ],
  );

  /**
   * Define valor em todos os caches
   */
  const set = useCallback(
    async (
      key: string,
      data: T,
      ttl?: number,
      namespace?: string,
    ): Promise<void> => {
      const cacheKey = generateKey(key, namespace);
      const cacheTTL = ttl || finalConfig.defaultTTL!;

      // Salvar em todos os níveis
      setToMemory(cacheKey, data, cacheTTL);
      setToLocalStorage(cacheKey, data, cacheTTL);
      await setToAPI(cacheKey, data, cacheTTL);
    },
    [
      generateKey,
      setToMemory,
      setToLocalStorage,
      setToAPI,
      finalConfig.defaultTTL,
    ],
  );

  /**
   * Remove valor de todos os caches
   */
  const remove = useCallback(
    async (key: string, namespace?: string): Promise<void> => {
      const cacheKey = generateKey(key, namespace);

      // Remover de todos os níveis
      memoryCache.current.delete(cacheKey);

      if (finalConfig.enableLocalStorage && typeof window !== "undefined") {
        safeLocalStorage()?.removeItem(cacheKey);
      }

      if (finalConfig.enableAPICache) {
        try {
          await fetch(`${finalConfig.apiCacheEndpoint}/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: cacheKey }),
          });
        } catch (error) {
          // Silent fail for API cache delete
        }
      }
    },
    [
      generateKey,
      finalConfig.enableLocalStorage,
      finalConfig.enableAPICache,
      finalConfig.apiCacheEndpoint,
    ],
  );

  /**
   * Limpa todos os caches
   */
  const clear = useCallback(async (): Promise<void> => {
    // Limpar memory cache
    memoryCache.current.clear();

    // Limpar localStorage (apenas itens do cache)
    if (finalConfig.enableLocalStorage && typeof window !== "undefined") {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("unified_cache_")) {
          safeLocalStorage()?.removeItem(key);
        }
      });
    }

    // Limpar API cache
    if (finalConfig.enableAPICache) {
      try {
        await fetch(`${finalConfig.apiCacheEndpoint}/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namespace: "frontend" }),
        });
      } catch (error) {
        // Silent fail for API cache clear
      }
    }

    // Reset stats
    stats.current = {
      memorySize: 0,
      localStorageSize: 0,
      hitRate: 0,
      totalRequests: 0,
      memoryHits: 0,
      localStorageHits: 0,
      apiHits: 0,
      misses: 0,
    };
  }, [
    finalConfig.enableLocalStorage,
    finalConfig.enableAPICache,
    finalConfig.apiCacheEndpoint,
  ]);

  /**
   * Obtém estatísticas do cache
   */
  const getStats = useCallback((): CacheStats => {
    const totalHits =
      stats.current.memoryHits +
      stats.current.localStorageHits +
      stats.current.apiHits;
    const hitRate =
      stats.current.totalRequests > 0
        ? (totalHits / stats.current.totalRequests) * 100
        : 0;

    return {
      ...stats.current,
      memorySize: memoryCache.current.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }, []);

  /**
   * Cache específico para personas (compatibilidade)
   */
  const cachePersonaResponse = useCallback(
    async (
      persona: string,
      query: string,
      response: { answer?: string; context?: unknown; sources?: unknown[]; qualityScore?: number; [key: string]: unknown },
      confidence: number = 0.85,
    ): Promise<void> => {
      const key = `persona:${persona}:${query.slice(0, 50)}`;
      const ttl = confidence > 0.9 ? 4 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 4h vs 2h

      await set(
        key,
        { response, confidence, timestamp: Date.now() } as T,
        ttl,
        "personas",
      );
    },
    [set],
  );

  /**
   * Busca resposta cacheada de persona
   */
  const getCachedPersonaResponse = useCallback(
    async (persona: string, query: string): Promise<any | null> => {
      const key = `persona:${persona}:${query.slice(0, 50)}`;
      return await get(key, "personas");
    },
    [get],
  );

  // Cleanup no unmount
  useEffect(() => {
    const cache = memoryCache.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    get,
    set,
    remove,
    clear,
    getStats,
    cachePersonaResponse,
    getCachedPersonaResponse,
  };
};
