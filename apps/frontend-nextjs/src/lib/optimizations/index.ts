/**
 * FUNÇÕES DE OTIMIZAÇÃO PARA TODO O REPOSITÓRIO
 * Sistema abrangente de otimização de performance, cache e recursos
 * Aplicável a todos os componentes e serviços da aplicação
 */

// ============================================
// CACHE E MEMOIZAÇÃO
// ============================================

/**
 * Cache universal com TTL e invalidação por padrão
 */
export class UniversalCache<T = any> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private static instances = new Map<string, UniversalCache>();

  constructor(private namespace: string = 'default') {}

  /**
   * Obter instância singleton do cache por namespace
   */
  static getInstance<T = any>(namespace: string = 'default'): UniversalCache<T> {
    if (!this.instances.has(namespace)) {
      this.instances.set(namespace, new UniversalCache<T>(namespace));
    }
    return this.instances.get(namespace) as UniversalCache<T>;
  }

  /**
   * Armazenar item no cache
   */
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * Obter item do cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Verificar se item existe no cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidar cache por padrão
   */
  invalidatePattern(pattern: string): number {
    let deleted = 0;
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): { size: number; namespace: string; hitRate?: number } {
    return {
      namespace: this.namespace,
      size: this.cache.size
    };
  }
}

/**
 * Memoização de funções com cache inteligente
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    ttl?: number;
    cacheKey?: (...args: Parameters<T>) => string;
    namespace?: string;
  } = {}
): T {
  const cache = UniversalCache.getInstance(options.namespace || 'memoized');
  const ttl = options.ttl || 5 * 60 * 1000;
  const keyFn = options.cacheKey || ((...args) => JSON.stringify(args));

  return ((...args: Parameters<T>) => {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result, ttl);
    return result;
  }) as T;
}

// ============================================
// DEBOUNCE E THROTTLE AVANÇADOS
// ============================================

/**
 * Debounce com cancelamento e execução imediata opcional
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: { immediate?: boolean; maxWait?: number } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } {
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T>;
  let result: ReturnType<T>;

  const invokeFunc = () => {
    result = fn(...lastArgs);
    return result;
  };

  const leadingEdge = () => {
    lastCallTime = Date.now();
    if (options.immediate) {
      return invokeFunc();
    }
  };

  const trailingEdge = () => {
    timeoutId = null;
    if (!options.immediate) {
      return invokeFunc();
    }
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    lastCallTime = 0;
  };

  const flush = () => {
    if (timeoutId) {
      cancel();
      return invokeFunc();
    }
    return result;
  };

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const isInvoking = !timeoutId;

    if (isInvoking) {
      if (options.maxWait && !maxTimeoutId) {
        maxTimeoutId = setTimeout(() => {
          maxTimeoutId = null;
          if (timeoutId) {
            cancel();
            return invokeFunc();
          }
        }, options.maxWait);
      }
      return leadingEdge();
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(trailingEdge, delay);
  }) as T & { cancel: () => void; flush: () => ReturnType<T> | undefined };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}

/**
 * Throttle com controle de frequência
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): T & { cancel: () => void } {
  let inThrottle = false;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  let lastArgs: Parameters<T>;

  const cancel = () => {
    if (lastFunc) {
      clearTimeout(lastFunc);
    }
    inThrottle = false;
  };

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (!inThrottle) {
      if (options.leading !== false) {
        fn(...args);
      }
      lastRan = Date.now();
      inThrottle = true;
    } else {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          if (options.trailing !== false) {
            fn(...lastArgs);
          }
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }) as T & { cancel: () => void };

  throttled.cancel = cancel;
  return throttled;
}

// ============================================
// OTIMIZAÇÃO DE RECURSOS E ASSETS
// ============================================

/**
 * Lazy loading de imagens com IntersectionObserver
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private static instance: LazyImageLoader;

  static getInstance(): LazyImageLoader {
    if (!this.instance) {
      this.instance = new LazyImageLoader();
    }
    return this.instance;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );
    }
  }

  observe(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback para navegadores sem IntersectionObserver
      this.loadImage(img);
    }
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Preload crítico de recursos
 */
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();

  /**
   * Preload de recursos críticos
   */
  static preloadCritical(resources: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font';
    type?: string;
    crossorigin?: string;
  }>): void {
    if (typeof document === 'undefined') return;

    resources.forEach(({ href, as, type, crossorigin }) => {
      if (this.preloadedResources.has(href)) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (type) link.type = type;
      if (crossorigin) link.crossOrigin = crossorigin;

      document.head.appendChild(link);
      this.preloadedResources.add(href);
    });
  }

  /**
   * Prefetch de recursos não críticos
   */
  static prefetchResources(urls: string[]): void {
    if (typeof document === 'undefined') return;

    urls.forEach((url) => {
      if (this.preloadedResources.has(url)) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;

      document.head.appendChild(link);
      this.preloadedResources.add(url);
    });
  }
}

// ============================================
// OTIMIZAÇÃO DE PERFORMANCE
// ============================================

/**
 * Monitor de performance em tempo real
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    lastExecution: number;
  }>();

  /**
   * Medir performance de função
   */
  static async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    options: { threshold?: number; logSlow?: boolean } = {}
  ): Promise<T> {
    const start = performance.now();
    const threshold = options.threshold || 100;

    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration);

      if (options.logSlow && duration > threshold) {
        console.warn(`🐌 Operação lenta: ${name} (${duration.toFixed(2)}ms)`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, true);
      throw error;
    }
  }

  private static recordMetric(name: string, duration: number, isError = false): void {
    const existing = this.metrics.get(name) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      lastExecution: 0
    };

    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);
    existing.lastExecution = Date.now();

    this.metrics.set(name, existing);

    if (isError) {
      console.error(`❌ Erro na operação: ${name} (${duration.toFixed(2)}ms)`);
    }
  }

  /**
   * Obter relatório de métricas
   */
  static getReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((metrics, name) => {
      report[name] = {
        executions: metrics.count,
        averageTime: `${metrics.avgTime.toFixed(2)}ms`,
        minTime: `${metrics.minTime.toFixed(2)}ms`,
        maxTime: `${metrics.maxTime.toFixed(2)}ms`,
        totalTime: `${metrics.totalTime.toFixed(2)}ms`,
        lastExecution: new Date(metrics.lastExecution).toISOString()
      };
    });

    return report;
  }

  /**
   * Resetar métricas
   */
  static reset(): void {
    this.metrics.clear();
  }
}

// ============================================
// OTIMIZAÇÃO DE COMPONENTES REACT
// ============================================

/**
 * Hook para debounce de valores
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de valores
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);

  useEffect(() => {
    let lastRan = Date.now();
    
    const handler = setTimeout(() => {
      if (Date.now() - lastRan >= limit) {
        setThrottledValue(value);
        lastRan = Date.now();
      }
    }, limit - (Date.now() - lastRan));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook para cache local com TTL
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = UniversalCache.getInstance<T>('react-hooks');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar cache primeiro
      const cached = cache.get(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Buscar dados
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

// ============================================
// UTILITÁRIOS DE OTIMIZAÇÃO
// ============================================

/**
 * Agrupador de requisições para reduzir chamadas à API
 */
export class RequestBatcher<T = any> {
  private batch: Array<{
    key: string;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchProcessor: (keys: string[]) => Promise<Record<string, T>>,
    private delay: number = 10
  ) {}

  add(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ key, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => this.processBatch(), this.delay);
      }
    });
  }

  private async processBatch(): Promise<void> {
    const currentBatch = [...this.batch];
    this.batch = [];
    this.timer = null;

    if (currentBatch.length === 0) return;

    try {
      const keys = currentBatch.map(item => item.key);
      const results = await this.batchProcessor(keys);

      currentBatch.forEach(({ key, resolve, reject }) => {
        if (key in results) {
          resolve(results[key]);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      currentBatch.forEach(({ reject }) => {
        reject(error as Error);
      });
    }
  }
}

/**
 * Compressão de dados em localStorage
 */
export class OptimizedStorage {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  /**
   * Salvar dados comprimidos
   */
  static async setCompressed(key: string, data: any): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const jsonString = JSON.stringify(data);
      
      // Para dados pequenos, não comprimir
      if (jsonString.length < 1000) {
        localStorage.setItem(key, jsonString);
        return;
      }

      // Comprimir dados grandes
      const compressed = await this.compress(jsonString);
      localStorage.setItem(key, compressed);
      localStorage.setItem(`${key}_compressed`, 'true');
    } catch (error) {
      console.error('Erro ao salvar dados comprimidos:', error);
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  /**
   * Carregar dados descomprimidos
   */
  static async getCompressed<T = any>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const isCompressed = localStorage.getItem(`${key}_compressed`) === 'true';
      
      if (isCompressed) {
        const decompressed = await this.decompress(stored);
        return JSON.parse(decompressed);
      } else {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar dados comprimidos:', error);
      return null;
    }
  }

  private static async compress(data: string): Promise<string> {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(this.encoder.encode(data));
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }

    const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.length;
    }

    return btoa(String.fromCharCode(...compressed));
  }

  private static async decompress(compressedData: string): Promise<string> {
    const compressed = new Uint8Array(
      atob(compressedData).split('').map(char => char.charCodeAt(0))
    );

    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(compressed);
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }

    const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }

    return this.decoder.decode(decompressed);
  }
}

// ============================================
// EXPORTS
// ============================================

// Classes and functions are already exported inline above

// Instância global para uso fácil
export const globalCache = UniversalCache.getInstance('global');
export const performanceMonitor = PerformanceMonitor;
export const lazyLoader = LazyImageLoader.getInstance();