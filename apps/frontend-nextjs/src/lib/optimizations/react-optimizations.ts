/**
 * OTIMIZAÇÕES ESPECÍFICAS PARA COMPONENTES REACT
 * Hooks avançados, HOCs, e utilitários de performance
 */

'use client';

import { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef, 
  useLayoutEffect,
  ComponentType,
  ReactElement,
  MutableRefObject
} from 'react';
import { UniversalCache, debounce, throttle } from './index';

// ============================================
// HOOKS DE PERFORMANCE
// ============================================

/**
 * Hook para lazy loading de componentes com suspense
 */
export function useLazyComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ReactElement
): {
  Component: ComponentType<T> | null;
  loading: boolean;
  error: Error | null;
} {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    importFn()
      .then((module) => {
        if (mounted) {
          setComponent(() => module.default);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { Component, loading, error };
}

/**
 * Hook para intersection observer otimizado
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [MutableRefObject<any>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, []);

  return [targetRef, isIntersecting];
}

/**
 * Hook para resize observer
 */
export function useResizeObserver(): [
  MutableRefObject<any>,
  { width: number; height: number }
] {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const targetRef = useRef();

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(target);

    return () => {
      resizeObserver.unobserve(target);
    };
  }, []);

  return [targetRef, dimensions];
}

/**
 * Hook para estado com localStorage otimizado
 */
export function useOptimizedLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    compress?: boolean;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    compress = false
  } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        const serialized = serialize(valueToStore);
        localStorage.setItem(key, serialized);
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  return [storedValue, setValue];
}

/**
 * Hook para estado com debounce
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useMemo(
    () => debounce((value: T) => setDebouncedValue(value), delay),
    [delay]
  );

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    debouncedSetValue(value);
  }, [debouncedSetValue]);

  return [immediateValue, debouncedValue, setValue];
}

/**
 * Hook para estado com throttle
 */
export function useThrottledState<T>(
  initialValue: T,
  limit: number
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [throttledValue, setThrottledValue] = useState(initialValue);

  const throttledSetValue = useMemo(
    () => throttle((value: T) => setThrottledValue(value), limit),
    [limit]
  );

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    throttledSetValue(value);
  }, [throttledSetValue]);

  return [immediateValue, throttledValue, setValue];
}

/**
 * Hook para estado assíncrono com cache
 */
export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: any[] = [],
  cacheKey?: string
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = cacheKey ? UniversalCache.getInstance('async-state') : null;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar cache se disponível
      if (cache && cacheKey) {
        const cached = cache.get(cacheKey);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      const result = await asyncFn();
      setData(result);

      // Salvar no cache se disponível
      if (cache && cacheKey) {
        cache.set(cacheKey, result);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, deps);

  return {
    data,
    loading,
    error,
    refetch: execute
  };
}

/**
 * Hook para paginação otimizada
 */
export function usePagination<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: {
    initialPage?: number;
    limit?: number;
    cachePages?: boolean;
  } = {}
) {
  const { initialPage = 1, limit = 20, cachePages = true } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = cachePages ? UniversalCache.getInstance('pagination') : null;

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = `page-${page}-${limit}`;
      
      // Verificar cache
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) {
          setData(cached.data);
          setTotal(cached.total);
          setLoading(false);
          return;
        }
      }

      const result = await fetchFn(page, limit);
      setData(result.data);
      setTotal(result.total);

      // Salvar no cache
      if (cache) {
        cache.set(cacheKey, result);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, limit, cache]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    loadPage(page);
  }, [loadPage]);

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(total / limit);
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, total, limit, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  useEffect(() => {
    loadPage(currentPage);
  }, []);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages: Math.ceil(total / limit),
    total,
    goToPage,
    nextPage,
    prevPage,
    refetch: () => loadPage(currentPage)
  };
}

// ============================================
// HIGHER-ORDER COMPONENTS (HOCs)
// ============================================

/**
 * HOC para lazy loading de componentes
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent?: ComponentType,
  ErrorComponent?: ComponentType<{ error: Error; retry: () => void }>
) {
  return function LazyComponent(props: P) {
    const { Component, loading, error } = useLazyComponent(importFn);

    if (loading) {
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>;
    }

    if (error) {
      return ErrorComponent ? (
        <ErrorComponent error={error} retry={() => window.location.reload()} />
      ) : (
        <div>Error loading component</div>
      );
    }

    if (!Component) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * HOC para memoização inteligente
 */
export function withSmartMemo<P extends object>(
  Component: ComponentType<P>,
  isEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, isEqual);
  MemoizedComponent.displayName = `SmartMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * HOC para intersection observer
 */
export function withIntersectionObserver<P extends object>(
  Component: ComponentType<P & { isIntersecting: boolean }>,
  options?: IntersectionObserverInit
) {
  return function IntersectionObserverComponent(props: P) {
    const [ref, isIntersecting] = useIntersectionObserver(options);
    
    return (
      <div ref={ref}>
        <Component {...props} isIntersecting={isIntersecting} />
      </div>
    );
  };
}

// ============================================
// UTILITÁRIOS DE RENDERIZAÇÃO
// ============================================

/**
 * Componente para renderização condicional otimizada
 */
interface ConditionalRenderProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  keepMounted?: boolean;
}

export function ConditionalRender({
  condition,
  children,
  fallback = null,
  keepMounted = false
}: ConditionalRenderProps) {
  if (keepMounted) {
    return (
      <div style={{ display: condition ? 'block' : 'none' }}>
        {children}
      </div>
    );
  }

  return condition ? <>{children}</> : <>{fallback}</>;
}

/**
 * Componente para lazy loading de imagens
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  src,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=',
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, isIntersecting] = useIntersectionObserver({
    threshold,
    rootMargin
  });

  useEffect(() => {
    if (isIntersecting && imageSrc === placeholder) {
      setImageSrc(src);
    }
  }, [isIntersecting, src, placeholder, imageSrc]);

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      {...props}
      style={{
        transition: 'opacity 0.3s ease',
        ...props.style
      }}
    />
  );
}

/**
 * Componente para virtual scrolling simples
 */
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto'
      }}
      onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

import React from 'react';

export {
  useLazyComponent,
  useIntersectionObserver,
  useResizeObserver,
  useOptimizedLocalStorage,
  useDebouncedState,
  useThrottledState,
  useAsyncState,
  usePagination,
  withLazyLoading,
  withSmartMemo,
  withIntersectionObserver,
  ConditionalRender,
  LazyImage,
  VirtualList
};