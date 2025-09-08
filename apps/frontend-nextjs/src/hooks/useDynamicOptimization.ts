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
import { useGlobalContext } from '@/contexts/GlobalContextHub';

// ============================================
// HOOK DE OTIMIZAÇÃO DINÂMICA
// ============================================

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

  const debouncedValue = useCallback(<T>(value: T, delay: number = debounceMs): T => {
    const [debouncedVal, setDebouncedVal] = useState(value);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedVal(value);
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [value, delay]);

    return debouncedVal;
  }, [debounceMs]);

  const throttledCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T, 
    delay: number = throttleMs
  ): T => {
    const lastCallRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    return useCallback((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        return callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
          timeoutRef.current = undefined;
        }, delay - (now - lastCallRef.current));
      }
    }, [callback, delay]) as T;
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
  
  const handleError = useCallback((error: Error, errorInfo?: any) => {
    if (!enableErrorBoundary) return;

    errorBoundaryRef.current = error;
    lifecycleRef.current.errors += 1;
    
    console.error('Component Error Caught:', error, errorInfo);
    
    setMetrics(prev => ({
      ...prev,
      componentLifecycle: { ...lifecycleRef.current }
    }));
  }, [enableErrorBoundary]);

  // ============================================
  // CUSTOM HOOKS INTERNOS
  // ============================================

  const useIntersectionObserver = useCallback((
    elementRef: React.RefObject<Element>,
    options: IntersectionObserverInit = {}
  ) => {
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
  }, []);

  const useResizeObserver = useCallback((
    elementRef: React.RefObject<Element>
  ) => {
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
  }, []);

  const usePrevious = useCallback(<T>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    
    useEffect(() => {
      ref.current = value;
    });
    
    return ref.current;
  }, []);

  const useLocalStorage = useCallback(<T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
  }, []);

  // ============================================
  // EXTERNAL STORE SYNC
  // ============================================

  const useExternalStoreSync = useCallback(<T>(
    store: { 
      subscribe: (callback: () => void) => () => void;
      getSnapshot: () => T;
    }
  ) => {
    return useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot // server snapshot (same as client for SSR)
    );
  }, []);

  // ============================================
  // IMPERATIVE HANDLE
  // ============================================

  const useImperativeHandleWrapper = useCallback(<T>(
    ref: React.Ref<T>,
    createHandle: () => T,
    deps?: React.DependencyList
  ) => {
    useImperativeHandle(ref, createHandle, deps);
  }, []);

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
    debouncedValue,
    throttledCallback,
    
    // Accessibility
    announceToScreenReader,
    announceRef,
    
    // Error handling
    handleError,
    lastError: errorBoundaryRef.current,
    
    // Custom hooks
    useIntersectionObserver,
    useResizeObserver,
    usePrevious,
    useLocalStorage,
    useExternalStoreSync,
    useImperativeHandleWrapper,
    
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