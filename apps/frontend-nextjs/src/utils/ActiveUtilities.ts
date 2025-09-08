'use client';

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useGlobalContext } from '@/contexts/GlobalContextHub';
import type { 
  Func, 
  AsyncFunc, 
  Transform, 
  LogLevel, 
  LogEntry 
} from '@/types/utils';
import type { ValidationRule } from '@/types/forms';

// ============================================
// ACTIVE UTILITIES SYSTEM
// ============================================

export interface UtilityConfig {
  enableLogging?: boolean;
  enableCaching?: boolean;
  enableValidation?: boolean;
  enableTransforms?: boolean;
  cacheSize?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  maxAge?: number;
}

export interface ValidationRuleConfig<T> {
  name: string;
  validate: (value: T) => boolean | string;
  severity: 'error' | 'warning' | 'info';
}

export interface TransformPipeline<T, U> {
  name: string;
  transform: (value: T) => U;
  reverse?: (value: U) => T;
}

// ============================================
// CACHE UTILITIES
// ============================================

export class ActiveCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, maxAge?: number): void {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
      maxAge
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check if expired
    if (entry.maxAge && Date.now() - entry.timestamp > entry.maxAge) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }

    entry.hits++;
    this.hitCount++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.maxAge && Date.now() - entry.timestamp > entry.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  getEntries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }
}

// ============================================
// VALIDATION UTILITIES
// ============================================

interface ValidationResult {
  rule: string;
  result: boolean | string;
  severity: 'error' | 'warning' | 'info';
}

export class ActiveValidator<T> {
  private rules: ValidationRuleConfig<T>[] = [];
  private validationHistory: Array<{ value: T; results: ValidationResult[]; timestamp: number }> = [];

  addRule(rule: ValidationRuleConfig<T>): this {
    this.rules.push(rule);
    return this;
  }

  removeRule(name: string): this {
    this.rules = this.rules.filter(rule => rule.name !== name);
    return this;
  }

  validate(value: T): { isValid: boolean; errors: string[]; warnings: string[]; info: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    const results = this.rules.map(rule => {
      const result = rule.validate(value);
      return {
        rule: rule.name,
        result,
        severity: rule.severity
      };
    });

    results.forEach(({ result, severity }) => {
      if (result !== true) {
        const message = typeof result === 'string' ? result : 'Validation failed';
        switch (severity) {
          case 'error':
            errors.push(message);
            break;
          case 'warning':
            warnings.push(message);
            break;
          case 'info':
            info.push(message);
            break;
        }
      }
    });

    this.validationHistory.push({
      value,
      results,
      timestamp: Date.now()
    });

    // Keep only last 100 validations
    if (this.validationHistory.length > 100) {
      this.validationHistory = this.validationHistory.slice(-100);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  getValidationHistory() {
    return [...this.validationHistory];
  }

  clearHistory(): void {
    this.validationHistory = [];
  }
}

// ============================================
// TRANSFORM UTILITIES
// ============================================

export class ActiveTransformer<T, U> {
  private pipelines: TransformPipeline<unknown, unknown>[] = [];
  private transformHistory: Array<{ input: unknown; output: unknown; pipeline: string; timestamp: number }> = [];

  addPipeline<V, W>(pipeline: TransformPipeline<V, W>): this {
    this.pipelines.push(pipeline as TransformPipeline<unknown, unknown>);
    return this;
  }

  removePipeline(name: string): this {
    this.pipelines = this.pipelines.filter(p => p.name !== name);
    return this;
  }

  transform<V>(value: V, pipelineName: string): unknown {
    const pipeline = this.pipelines.find(p => p.name === pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline '${pipelineName}' not found`);
    }

    const result = (pipeline as TransformPipeline<V, unknown>).transform(value);
    
    this.transformHistory.push({
      input: value,
      output: result,
      pipeline: pipelineName,
      timestamp: Date.now()
    });

    // Keep only last 100 transforms
    if (this.transformHistory.length > 100) {
      this.transformHistory = this.transformHistory.slice(-100);
    }

    return result;
  }

  reverse<V>(value: V, pipelineName: string): unknown {
    const pipeline = this.pipelines.find(p => p.name === pipelineName);
    if (!pipeline || !pipeline.reverse) {
      throw new Error(`Reverse pipeline '${pipelineName}' not found or not reversible`);
    }

    return (pipeline as TransformPipeline<unknown, V>).reverse!(value);
  }

  chain<V>(value: V, pipelineNames: string[]): unknown {
    return pipelineNames.reduce((acc, pipelineName) => {
      return this.transform(acc, pipelineName);
    }, value as unknown);
  }

  getTransformHistory() {
    return [...this.transformHistory];
  }

  clearHistory(): void {
    this.transformHistory = [];
  }
}

// ============================================
// LOGGER UTILITY
// ============================================

export class ActiveLogger {
  private logs: LogEntry[] = [];
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  private addLog(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    this.logs.push({
      level,
      message,
      timestamp: Date.now(),
      metadata
    });

    // Keep only last 500 logs
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }

    // Console logging
    const consoleMethod = level === 'debug' ? 'log' : level;
    (console as any)[consoleMethod](`[${level.toUpperCase()}] ${message}`, metadata || '');
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('error', message, metadata);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// ============================================
// HOOK DE UTILITIES ATIVAS
// ============================================

export const useActiveUtilities = (config: UtilityConfig = {}) => {
  const {
    enableLogging = true,
    enableCaching = true,
    enableValidation = true,
    enableTransforms = true,
    cacheSize = 100,
    logLevel = 'info'
  } = config;

  const globalContext = useGlobalContext();

  // Create utility instances
  const [cache] = useState(() => new ActiveCache(cacheSize));
  const [validator] = useState(() => new ActiveValidator());
  const [transformer] = useState(() => new ActiveTransformer());
  const [logger] = useState(() => new ActiveLogger(logLevel));

  // ============================================
  // MEMOIZED UTILITIES
  // ============================================

  const memoizedFunction = useCallback(<T extends Func>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    maxAge?: number
  ): T => {
    return ((...args: Parameters<T>) => {
      if (!enableCaching) return fn(...args);

      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        const cached = cache.get(key);
        if (enableLogging) {
          logger.debug('Cache hit', { key, function: fn.name });
        }
        return cached;
      }

      const result = fn(...args);
      cache.set(key, result, maxAge);
      
      if (enableLogging) {
        logger.debug('Cache miss - computed and stored', { key, function: fn.name });
      }
      
      return result;
    }) as T;
  }, [cache, enableCaching, enableLogging, logger]);

  const validatedFunction = useCallback(<T, R>(
    fn: (value: T) => R,
    rules: ValidationRuleConfig<T>[]
  ) => {
    return (value: T): R => {
      if (!enableValidation) return fn(value);

      // Setup validator
      rules.forEach(rule => validator.addRule(rule as ValidationRuleConfig<unknown>));
      
      const validation = validator.validate(value);
      
      if (!validation.isValid) {
        const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
        if (enableLogging) {
          logger.error('Validation failed', { value, errors: validation.errors });
        }
        throw error;
      }

      if (validation.warnings.length > 0 && enableLogging) {
        logger.warn('Validation warnings', { value, warnings: validation.warnings });
      }

      return fn(value);
    };
  }, [validator, enableValidation, enableLogging, logger]);

  const transformedFunction = useCallback(<T, U, R>(
    fn: (value: U) => R,
    inputPipeline: string,
    outputPipeline?: string
  ) => {
    return (value: T): R => {
      if (!enableTransforms) return fn(value as unknown as U);

      const transformedInput = transformer.transform(value, inputPipeline) as U;
      const result = fn(transformedInput);
      
      if (outputPipeline) {
        return transformer.transform(result, outputPipeline) as R;
      }
      
      return result;
    };
  }, [transformer, enableTransforms]);

  // ============================================
  // ASYNC UTILITIES
  // ============================================

  const asyncQueue = useMemo(() => {
    const queue: Array<() => Promise<unknown>> = [];
    let isProcessing = false;

    const add = async <T>(task: () => Promise<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        
        processQueue();
      });
    };

    const processQueue = async () => {
      if (isProcessing || queue.length === 0) return;
      
      isProcessing = true;
      
      while (queue.length > 0) {
        const task = queue.shift();
        if (task) {
          try {
            await task();
          } catch (error) {
            if (enableLogging) {
              logger.error('Queue task failed', { error: String(error) });
            }
          }
        }
      }
      
      isProcessing = false;
    };

    return { add, size: () => queue.length, isProcessing: () => isProcessing };
  }, [enableLogging, logger]);

  const retryFunction = useCallback(async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (enableLogging && attempt > 0) {
          logger.info(`Retry attempt ${attempt}/${maxRetries}`);
        }
        
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (enableLogging) {
          logger.warn(`Attempt ${attempt + 1} failed`, { error: error instanceof Error ? error.message : String(error) });
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  }, [enableLogging, logger]);

  // ============================================
  // ANALYTICS UTILITIES
  // ============================================

  const performanceMonitor = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      
      try {
        const result = fn(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (enableLogging) {
          logger.debug('Performance measurement', {
            function: name || fn.name,
            duration,
            args: args.length
          });
        }

        globalContext.updatePerformance({
          interactionLatency: duration
        });
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (enableLogging) {
          logger.error('Performance measurement (with error)', {
            function: name || fn.name,
            duration,
            error: (error as Error).message
          });
        }
        
        throw error;
      }
    }) as T;
  }, [enableLogging, logger, globalContext]);

  // ============================================
  // UTILITY MANAGEMENT
  // ============================================

  const getUtilityStats = useCallback(() => ({
    cache: enableCaching ? cache.getStats() : null,
    validation: enableValidation ? {
      rulesCount: validator['rules'].length,
      historySize: validator.getValidationHistory().length
    } : null,
    transforms: enableTransforms ? {
      pipelinesCount: transformer['pipelines'].length,
      historySize: transformer.getTransformHistory().length
    } : null,
    logs: enableLogging ? {
      totalLogs: logger.getLogs().length,
      errorCount: logger.getLogs('error').length,
      warnCount: logger.getLogs('warn').length
    } : null,
    queue: {
      size: asyncQueue.size(),
      isProcessing: asyncQueue.isProcessing()
    }
  }), [cache, validator, transformer, logger, asyncQueue, enableCaching, enableValidation, enableTransforms, enableLogging]);

  const clearAllUtilities = useCallback(() => {
    if (enableCaching) cache.clear();
    if (enableValidation) validator.clearHistory();
    if (enableTransforms) transformer.clearHistory();
    if (enableLogging) logger.clearLogs();
  }, [cache, validator, transformer, logger, enableCaching, enableValidation, enableTransforms, enableLogging]);

  return {
    // Core utilities
    cache: enableCaching ? cache : null,
    validator: enableValidation ? validator : null,
    transformer: enableTransforms ? transformer : null,
    logger: enableLogging ? logger : null,
    
    // Enhanced functions
    memoizedFunction,
    validatedFunction,
    transformedFunction,
    performanceMonitor,
    
    // Async utilities
    asyncQueue,
    retryFunction,
    
    // Management
    getUtilityStats,
    clearAllUtilities
  };
};