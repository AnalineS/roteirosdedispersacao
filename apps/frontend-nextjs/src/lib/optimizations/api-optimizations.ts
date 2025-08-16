/**
 * OTIMIZAÇÕES ESPECÍFICAS PARA APIs E REQUISIÇÕES
 * Sistema avançado de cache, retry, batching e circuit breaker
 */

import { UniversalCache, PerformanceMonitor } from './index';

// ============================================
// CIRCUIT BREAKER PATTERN
// ============================================

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitorWindow: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// ============================================
// SISTEMA DE RETRY INTELIGENTE
// ============================================

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

export class SmartRetry {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => error.status >= 500 || error.code === 'NETWORK_ERROR'
  };

  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === config.maxAttempts) {
          break;
        }

        if (config.retryCondition && !config.retryCondition(error)) {
          break;
        }

        const delay = this.calculateDelay(attempt, config);
        console.warn(`Retry attempt ${attempt}/${config.maxAttempts} in ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private static calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, options.maxDelay);

    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// CACHE DE REQUISIÇÕES COM INVALIDAÇÃO
// ============================================

interface CacheableRequestOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  namespace?: string;
  invalidatePattern?: string;
  forceRefresh?: boolean;
}

export class RequestCache {
  private static cache = UniversalCache.getInstance('api-requests');
  private static pendingRequests = new Map<string, Promise<any>>();

  /**
   * Executar requisição com cache inteligente
   */
  static async execute<T>(
    key: string,
    operation: () => Promise<T>,
    options: CacheableRequestOptions = {}
  ): Promise<T> {
    const {
      ttl = 5 * 60 * 1000,
      staleWhileRevalidate = false,
      forceRefresh = false
    } = options;

    // Verificar se há requisição pendente para a mesma chave
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Verificar cache se não for refresh forçado
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached) {
        // Se stale-while-revalidate, retornar cache e atualizar em background
        if (staleWhileRevalidate) {
          this.revalidateInBackground(key, operation, ttl);
        }
        return cached;
      }
    }

    // Executar operação
    const promise = PerformanceMonitor.measure(`api-${key}`, operation);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.cache.set(key, result, ttl);
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private static async revalidateInBackground<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const result = await operation();
      this.cache.set(key, result, ttl);
    } catch (error) {
      console.warn(`Background revalidation failed for ${key}:`, error);
    }
  }

  /**
   * Invalidar cache por padrão
   */
  static invalidate(pattern: string): number {
    return this.cache.invalidatePattern(pattern);
  }

  /**
   * Pré-carregar dados no cache
   */
  static async preload<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = 10 * 60 * 1000
  ): Promise<void> {
    if (!this.cache.has(key)) {
      try {
        const result = await operation();
        this.cache.set(key, result, ttl);
      } catch (error) {
        console.warn(`Preload failed for ${key}:`, error);
      }
    }
  }
}

// ============================================
// OTIMIZADOR DE FETCH
// ============================================

interface OptimizedFetchOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTtl?: number;
  circuitBreaker?: boolean;
  compression?: boolean;
}

export class OptimizedFetch {
  private static circuitBreakers = new Map<string, CircuitBreaker>();

  static async request<T = any>(
    url: string,
    options: OptimizedFetchOptions = {}
  ): Promise<T> {
    const {
      timeout = 10000,
      retries = 0,
      cache: useCache = false,
      cacheTtl = 5 * 60 * 1000,
      circuitBreaker: useCircuitBreaker = false,
      compression = false,
      ...fetchOptions
    } = options;

    // Preparar headers
    const headers = new Headers(fetchOptions.headers);
    
    if (compression && !headers.has('Accept-Encoding')) {
      headers.set('Accept-Encoding', 'gzip, deflate, br');
    }

    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    const cacheKey = useCache ? `fetch-${url}-${JSON.stringify(fetchOptions)}` : '';

    const operation = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as unknown as T;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Aplicar circuit breaker se solicitado
    const finalOperation = useCircuitBreaker
      ? this.withCircuitBreaker(url, operation)
      : operation;

    // Aplicar retry se solicitado
    const retriedOperation = retries > 0
      ? () => SmartRetry.execute(finalOperation, { maxAttempts: retries + 1 })
      : finalOperation;

    // Aplicar cache se solicitado
    if (useCache && fetchOptions.method !== 'POST') {
      return RequestCache.execute(cacheKey, retriedOperation, { ttl: cacheTtl });
    }

    return retriedOperation();
  }

  private static withCircuitBreaker<T>(
    url: string,
    operation: () => Promise<T>
  ): () => Promise<T> {
    const host = new URL(url).host;
    
    if (!this.circuitBreakers.has(host)) {
      this.circuitBreakers.set(host, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000,
        monitorWindow: 300000
      }));
    }

    const breaker = this.circuitBreakers.get(host)!;
    return () => breaker.execute(operation);
  }

  /**
   * Requisições em paralelo com controle de concorrência
   */
  static async parallel<T>(
    requests: Array<() => Promise<T>>,
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Pré-conectar a hosts para melhorar latência
   */
  static preconnect(hosts: string[]): void {
    if (typeof document === 'undefined') return;

    hosts.forEach(host => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = host;
      document.head.appendChild(link);
    });
  }
}

// ============================================
// BATCH DE REQUISIÇÕES GRAPHQL-LIKE
// ============================================

interface BatchableRequest {
  id: string;
  operation: string;
  variables?: Record<string, any>;
}

export class APIBatcher {
  private pending: Array<{
    request: BatchableRequest;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchEndpoint: string,
    private options: {
      maxBatchSize?: number;
      maxWaitTime?: number;
    } = {}
  ) {}

  async request<T = any>(request: BatchableRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pending.push({ request, resolve, reject });

      const maxSize = this.options.maxBatchSize || 10;
      const maxWait = this.options.maxWaitTime || 50;

      if (this.pending.length >= maxSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), maxWait);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.length === 0) return;

    const batch = [...this.pending];
    this.pending = [];

    try {
      const response = await OptimizedFetch.request(this.batchEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          operations: batch.map(item => item.request)
        })
      });

      // Processar respostas
      response.results.forEach((result: any, index: number) => {
        const { resolve, reject } = batch[index];
        
        if (result.error) {
          reject(new Error(result.error.message));
        } else {
          resolve(result.data);
        }
      });
    } catch (error) {
      // Rejeitar todas as requisições em caso de erro
      batch.forEach(({ reject }) => {
        reject(error as Error);
      });
    }
  }
}

// ============================================
// EXPORTS
// ============================================

// Classes are already exported inline above

// Instâncias globais
export const apiCache = RequestCache;
export const optimizedFetch = OptimizedFetch;