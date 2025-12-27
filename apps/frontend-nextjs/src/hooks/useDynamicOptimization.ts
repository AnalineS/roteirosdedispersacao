'use client';

import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo, 
  useLayoutEffect,
  useImperativeHandle,
  useId,
  useSyncExternalStore,
  forwardRef
} from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { useGlobalContext } from '@/contexts/GlobalContextHub';

// ============================================
// CUSTOM HOOKS UTILITÁRIOS (Exportados separadamente)
// ============================================

// Hook para Intersection Observer
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setIntersectionRatio(entry.intersectionRatio);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], ...options }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [elementRef, options]);

  return { isIntersecting, intersectionRatio };
}

// Hook para Resize Observer
export function useResizeObserver(elementRef: React.RefObject<Element>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [elementRef]);

  return dimensions;
}

// Hook para rastrear valor anterior
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Hook para localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = safeLocalStorage()?.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      safeLocalStorage()?.setItem(key, JSON.stringify(valueToStore));
    } catch {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'optimization_storage_error', {
          event_category: 'optimization',
          event_label: 'localstorage_save_failed'
        });
      }
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// ============================================
// HOOK DE OTIMIZAÇÃO DINÂMICA
// ============================================

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
  [key: string]: unknown;
}

export interface OptimizationConfig {
  enablePerformanceTracking?: boolean;
  enableMemoryOptimization?: boolean;
  enableAccessibilitySupport?: boolean;
  enableErrorBoundary?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  componentLifecycle: ComponentLifecycle;
}

export interface ComponentLifecycle {
  mounted: boolean;
  updated: number;
  rendered: number;
  errors: number;
}

// ============================================
// HOOK PRINCIPAL DE OTIMIZAÇÃO
// ============================================

export const useDynamicOptimization = (config: OptimizationConfig = {}) => {
  const {
    enablePerformanceTracking = true,
    enableMemoryOptimization = true,
    enableAccessibilitySupport = true,
    enableErrorBoundary = true,
    debounceMs = 300,
    throttleMs = 100
  } = config;

  // Refs para tracking de performance
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderRef = useRef(Date.now());
  const componentMountedRef = useRef(false);
  const lifecycleRef = useRef<ComponentLifecycle>({
    mounted: false,
    updated: 0,
    rendered: 0,
    errors: 0
  });

  // Estado para métricas
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    componentLifecycle: lifecycleRef.current
  });

  // Contexto global
  const { updatePerformance } = useGlobalContext();

  // ID único do componente
  const componentId = useId();

  // ============================================
  // OTIMIZAÇÃO DE PERFORMANCE
  // ============================================

  const trackRender = useCallback(() => {
    if (!enablePerformanceTracking) return;

    const now = Date.now();
    const renderTime = now - lastRenderRef.current;
    
    renderCountRef.current += 1;
    lifecycleRef.current.rendered += 1;
    renderTimesRef.current.push(renderTime);
    
    // Manter apenas as últimas 50 medições
    if (renderTimesRef.current.length > 50) {
      renderTimesRef.current = renderTimesRef.current.slice(-50);
    }

    const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;

    setMetrics(prev => ({
      ...prev,
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
      averageRenderTime,
      componentLifecycle: { ...lifecycleRef.current }
    }));

    lastRenderRef.current = now;
  }, [enablePerformanceTracking]);

  // UseLayoutEffect para tracking preciso de renders
  useLayoutEffect(() => {
    trackRender();
  });

  // Lifecycle tracking
  useEffect(() => {
    if (!componentMountedRef.current) {
      componentMountedRef.current = true;
      lifecycleRef.current.mounted = true;
    } else {
      lifecycleRef.current.updated += 1;
    }

    return () => {
      lifecycleRef.current.mounted = false;
      if (enablePerformanceTracking) {
        updatePerformance({
          renderTime: metrics.averageRenderTime,
          interactionLatency: metrics.lastRenderTime
        });
      }
    };
  }, [enablePerformanceTracking, metrics.averageRenderTime, metrics.lastRenderTime, updatePerformance]);

  // ============================================
  // OTIMIZAÇÃO DE MEMÓRIA
  // ============================================

  const memoryTracker = useCallback(() => {
    if (!enableMemoryOptimization || typeof window === 'undefined') return 0;

    // Simular tracking de memória (em ambiente real usaria performance.memory)
    const estimatedMemory = renderCountRef.current * 0.1 + Math.random() * 0.5;
    return estimatedMemory;
  }, [enableMemoryOptimization]);

  const updateMemoryMetrics = useCallback(() => {
    if (enableMemoryOptimization) {
      const memoryUsage = memoryTracker();
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, [enableMemoryOptimization, memoryTracker]);

  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const interval = setInterval(updateMemoryMetrics, 5000);
    return () => clearInterval(interval);
  }, [enableMemoryOptimization, updateMemoryMetrics]);

  // ============================================
  // DEBOUNCE E THROTTLE HOOKS
  // ============================================

  // Helper para criar debounced functions
  const createDebouncedFunction = useCallback(<T extends (...args: never[]) => unknown>(
    fn: T,
    delay: number = debounceMs
  ): ((...args: Parameters<T>) => void) => {
    let timeoutRef: NodeJS.Timeout | undefined;

    return (...args: Parameters<T>) => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
      timeoutRef = setTimeout(() => fn(...args), delay);
    };
  }, [debounceMs]);

  const createThrottledFunction = useCallback(<T extends (...args: [React.SyntheticEvent, string]) => void>(
    callback: T,
    delay: number = throttleMs
  ): T => {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | undefined;

    const throttledFn = (...args: [React.SyntheticEvent, string]): void => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        return callback(...args);
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          callback(...args);
          timeoutId = undefined;
        }, delay - (now - lastCall));
      }
    };

    return throttledFn as T;
  }, [throttleMs]);

  // ============================================
  // ACESSIBILIDADE DINÂMICA
  // ============================================

  const announceRef = useRef<HTMLDivElement>(null);
  
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!enableAccessibilitySupport) return;

    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Limpar após 1 segundo
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [enableAccessibilitySupport]);

  // ============================================
  // ERROR BOUNDARY SIMULATION
  // ============================================

  const errorBoundaryRef = useRef<Error | null>(null);
  
  const handleError = useCallback((error: Error, errorInfo?: ErrorInfo) => {
    if (!enableErrorBoundary) return;

    errorBoundaryRef.current = error;
    lifecycleRef.current.errors += 1;
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'component_error_caught', {
        event_category: 'optimization',
        event_label: 'error_boundary_triggered'
      });
    }
    
    setMetrics(prev => ({
      ...prev,
      componentLifecycle: { ...lifecycleRef.current }
    }));
  }, [enableErrorBoundary]);

  // ============================================
  // UTILITY FUNCTIONS (não são hooks, então sem problema estar aqui)
  // ============================================
  // NOTA: Removidos os "custom hooks" que estavam dentro de useCallback
  // pois violavam as regras dos Hooks do React. Esses podem ser extraídos
  // para hooks separados exportados se necessário no futuro.

  // ============================================
  // EXTERNAL STORE SYNC
  // ============================================

  const createExternalStoreSync = <T>(
    store: {
      subscribe: (callback: () => void) => () => void;
      getSnapshot: () => T;
    }
  ) => {
    return {
      subscribe: store.subscribe,
      getSnapshot: store.getSnapshot,
      getServerSnapshot: store.getSnapshot // server snapshot (same as client for SSR)
    };
  };

  // ============================================
  // IMPERATIVE HANDLE
  // ============================================

  const createImperativeHandle = <T>(
    ref: React.Ref<T>,
    createHandle: () => T,
    deps?: React.DependencyList
  ) => {
    return { ref, createHandle, deps };
  };

  // ============================================
  // RETORNO DO HOOK
  // ============================================

  return {
    // Métricas e status
    metrics,
    componentId,
    isOptimized: metrics.averageRenderTime < 16, // 60fps target
    
    // Performance tracking
    trackRender,
    
    // Optimization utilities
    createDebouncedFunction,
    createThrottledFunction,
    
    // Accessibility
    announceToScreenReader,
    announceRef,
    
    // Error handling
    handleError,
    lastError: errorBoundaryRef.current,

    // Utility functions
    createExternalStoreSync,
    createImperativeHandle,
    
    // Memory management
    memoryUsage: metrics.memoryUsage,
    clearMemory: useCallback(() => {
      renderTimesRef.current = [];
      renderCountRef.current = 0;
      lifecycleRef.current = {
        mounted: false,
        updated: 0,
        rendered: 0,
        errors: 0
      };
    }, [])
  };
};