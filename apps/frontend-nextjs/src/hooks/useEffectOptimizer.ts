'use client';

import { useEffect, useLayoutEffect, useRef, useCallback, useMemo, useState } from 'react';

// ============================================
// HOOK DE OTIMIZAÇÃO DE USEEFFECT
// ============================================

export interface EffectConfig {
  skipOnMount?: boolean;
  skipOnUnmount?: boolean;
  debounce?: number;
  throttle?: number;
  condition?: () => boolean;
  onError?: (error: Error) => void;
}

// UseEffect otimizado com controle granular
export const useOptimizedEffect = (
  effect: React.EffectCallback,
  deps?: React.DependencyList,
  config: EffectConfig = {}
) => {
  const {
    skipOnMount = false,
    skipOnUnmount = false,
    debounce,
    throttle,
    condition,
    onError
  } = config;

  const isMountedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastRunRef = useRef<number>(0);

  const wrappedEffect = useCallback(() => {
    try {
      // Skip on mount if configured
      if (skipOnMount && !isMountedRef.current) {
        isMountedRef.current = true;
        return;
      }

      // Check condition
      if (condition && !condition()) {
        return;
      }

      // Throttle
      if (throttle) {
        const now = Date.now();
        if (now - lastRunRef.current < throttle) {
          return;
        }
        lastRunRef.current = now;
      }

      // Execute effect
      return effect();
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'effect_optimizer_error', {
            event_category: 'medical_hooks',
            event_label: 'optimized_effect_failed',
            custom_parameters: {
              medical_context: 'effect_optimization',
              error_type: 'effect_execution'
            }
          });
        }
      }
    }
  }, [effect, skipOnMount, condition, throttle, onError]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }

    if (debounce) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(wrappedEffect, debounce);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      return wrappedEffect();
    }
  }, [deps, debounce, wrappedEffect].concat(deps || []));

  useEffect(() => {
    return () => {
      if (!skipOnUnmount && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [skipOnUnmount]);
};

// ============================================
// HOOK DE CLEANUP AUTOMÁTICO
// ============================================

export const useAutoCleanup = () => {
  const cleanupFnsRef = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFnsRef.current.push(cleanupFn);
  }, []);

  const removeCleanup = useCallback((cleanupFn: () => void) => {
    const index = cleanupFnsRef.current.indexOf(cleanupFn);
    if (index > -1) {
      cleanupFnsRef.current.splice(index, 1);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupFnsRef.current.forEach(fn => {
        try {
          fn();
        } catch {
          if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'effect_cleanup_error', {
            event_category: 'medical_hooks',
            event_label: 'cleanup_effect_failed',
            custom_parameters: {
              medical_context: 'effect_cleanup',
              error_type: 'cleanup_execution'
            }
          });
        }
        }
      });
      cleanupFnsRef.current = [];
    };
  }, []);

  return { addCleanup, removeCleanup };
};

// ============================================
// HOOK DE INTERVALO INTELIGENTE
// ============================================

export const useSmartInterval = (
  callback: () => void,
  delay: number | null,
  options: {
    immediate?: boolean;
    pauseOnBlur?: boolean;
    pauseOnHidden?: boolean;
  } = {}
) => {
  const { immediate = false, pauseOnBlur = true, pauseOnHidden = true } = options;
  
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isPausedRef = useRef(false);

  // Update callback ref
  useLayoutEffect(() => {
    savedCallback.current = callback;
  });

  const startInterval = useCallback(() => {
    if (delay === null || isPausedRef.current) return;
    
    if (immediate) {
      savedCallback.current();
    }
    
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        savedCallback.current();
      }
    }, delay);
  }, [delay, immediate]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const pauseInterval = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeInterval = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  // Setup interval
  useEffect(() => {
    if (delay !== null) {
      startInterval();
    } else {
      stopInterval();
    }

    return stopInterval;
  }, [delay, startInterval, stopInterval]);

  // Handle visibility changes
  useEffect(() => {
    if (!pauseOnHidden && !pauseOnBlur) return;

    const handleVisibilityChange = () => {
      if (document.hidden && pauseOnHidden) {
        pauseInterval();
      } else if (!document.hidden && pauseOnHidden) {
        resumeInterval();
      }
    };

    const handleBlur = () => {
      if (pauseOnBlur) pauseInterval();
    };

    const handleFocus = () => {
      if (pauseOnBlur) resumeInterval();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pauseOnBlur, pauseOnHidden, pauseInterval, resumeInterval]);

  return {
    start: startInterval,
    stop: stopInterval,
    pause: pauseInterval,
    resume: resumeInterval,
    isActive: intervalRef.current !== undefined,
    isPaused: isPausedRef.current
  };
};

// ============================================
// HOOK DE ASYNC EFFECT
// ============================================

export const useAsyncEffect = (
  asyncEffect: () => Promise<void | (() => void)>,
  deps?: React.DependencyList,
  onError?: (error: Error) => void
) => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    let cleanup: (() => void) | void;

    const runAsyncEffect = async () => {
      try {
        cleanup = await asyncEffect();
      } catch (error) {
        if (isMountedRef.current) {
          if (onError) {
            onError(error as Error);
          } else {
            if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'async_effect_error', {
            event_category: 'medical_hooks',
            event_label: 'async_effect_failed',
            custom_parameters: {
              medical_context: 'async_effect_execution',
              error_type: 'async_operation'
            }
          });
        }
          }
        }
      }
    };

    runAsyncEffect();

    return () => {
      isMountedRef.current = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [asyncEffect, onError, ...(deps || [])]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
};

// ============================================
// HOOK DE EFFECT QUEUE
// ============================================

export const useEffectQueue = () => {
  const queueRef = useRef<Array<{ 
    effect: () => void | (() => void); 
    deps: React.DependencyList;
    priority: number;
  }>>([]);
  const isProcessingRef = useRef(false);

  const addEffect = useCallback((
    effect: () => void | (() => void),
    deps: React.DependencyList = [],
    priority: number = 0
  ) => {
    queueRef.current.push({ effect, deps, priority });
    queueRef.current.sort((a, b) => b.priority - a.priority);
  }, []);

  const processQueue = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const cleanupFunctions: (() => void)[] = [];

    queueRef.current.forEach(({ effect }) => {
      try {
        const cleanup = effect();
        if (typeof cleanup === 'function') {
          cleanupFunctions.push(cleanup);
        }
      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'queue_effect_error', {
            event_category: 'medical_hooks',
            event_label: 'queue_effect_failed',
            custom_parameters: {
              medical_context: 'effect_queue_management',
              error_type: 'queue_execution'
            }
          });
        }
      }
    });

    queueRef.current = [];
    isProcessingRef.current = false;

    return () => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'queue_cleanup_error', {
            event_category: 'medical_hooks',
            event_label: 'queue_cleanup_failed',
            custom_parameters: {
              medical_context: 'effect_queue_cleanup',
              error_type: 'queue_cleanup'
            }
          });
        }
        }
      });
    };
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    isProcessingRef.current = false;
  }, []);

  return {
    addEffect,
    processQueue,
    clearQueue,
    queueLength: queueRef.current.length
  };
};

// ============================================
// HOOK DE CONDITIONAL EFFECT
// ============================================

export const useConditionalEffect = (
  effect: React.EffectCallback,
  condition: boolean | (() => boolean),
  deps?: React.DependencyList
) => {
  const lastConditionRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const currentCondition = typeof condition === 'function' ? condition() : condition;
    
    if (currentCondition && currentCondition !== lastConditionRef.current) {
      const cleanup = effect();
      lastConditionRef.current = currentCondition;
      return cleanup;
    }

    lastConditionRef.current = currentCondition;
  }, [condition, effect, ...(deps || [])]);
};

// ============================================
// HOOK DE EFFECT COM RETRY
// ============================================

export const useRetryEffect = (
  effect: () => Promise<void>,
  maxRetries: number = 3,
  delay: number = 1000,
  deps?: React.DependencyList,
  onError?: (error: Error, attempt: number) => void
) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useAsyncEffect(async () => {
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        setIsRetrying(attempt > 0);
        await effect();
        setRetryCount(0);
        setIsRetrying(false);
        break;
      } catch (error) {
        attempt++;
        setRetryCount(attempt);
        
        if (onError) {
          onError(error as Error, attempt);
        }
        
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        } else {
          setIsRetrying(false);
          throw error;
        }
      }
    }
  }, deps);

  return { retryCount, isRetrying };
};

// ============================================
// EXPORT DE UTILIDADES
// ============================================

export const EffectUtils = {
  useOptimizedEffect,
  useAutoCleanup,
  useSmartInterval,
  useAsyncEffect,
  useEffectQueue,
  useConditionalEffect,
  useRetryEffect
} as const;