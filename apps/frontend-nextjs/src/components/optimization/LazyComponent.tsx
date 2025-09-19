'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LazyComponentProps<T = {}> extends T {
  componentImport: () => Promise<{ default: ComponentType<T> }>;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  children?: React.ReactNode;
}

interface LazyWrapperState {
  hasError: boolean;
  retryCount: number;
}

class ErrorBoundary extends React.Component<
  { 
    onError?: (error: Error) => void;
    retryAttempts?: number;
    fallback?: React.ReactNode;
    children: React.ReactNode;
    componentName: string;
  },
  LazyWrapperState
> {
  constructor(props: { onError?: (error: Error) => void; retryAttempts?: number; fallback?: React.ReactNode; children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): LazyWrapperState {
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'lazy_component_error', {
        event_category: 'medical_system_performance',
        event_label: 'lazy_component_load_failed',
        custom_parameters: {
          medical_context: 'lazy_component_loading',
          component_name: this.props.componentName,
          error_type: 'component_load_failure',
          error_message: error instanceof Error ? error.message : String(error)
        }
      });
    }
    this.props.onError?.(error);
  }

  handleRetry = () => {
    const maxRetries = this.props.retryAttempts || 3;
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = this.props.retryAttempts || 3;
      const canRetry = this.state.retryCount < maxRetries;

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="lazy-error-fallback">
          <div className="error-content">
            <h3>Erro ao carregar componente</h3>
            <p>Não foi possível carregar o componente {this.props.componentName}.</p>
            {canRetry && (
              <button 
                onClick={this.handleRetry}
                className="retry-button"
                type="button"
              >
                Tentar novamente ({this.state.retryCount + 1}/{maxRetries})
              </button>
            )}
          </div>
          
          <style jsx>{`
            .lazy-error-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 200px;
              padding: var(--spacing-xl);
              background-color: var(--color-error-background);
              border: 1px solid var(--color-error-border);
              border-radius: var(--radius-md);
              margin: var(--spacing-md) 0;
            }
            
            .error-content {
              text-align: center;
              max-width: 400px;
            }
            
            .error-content h3 {
              color: var(--color-error-primary);
              font-size: var(--font-size-lg);
              font-weight: var(--font-weight-semibold);
              margin-bottom: var(--spacing-md);
            }
            
            .error-content p {
              color: var(--color-text-muted);
              font-size: var(--font-size-base);
              line-height: var(--line-height-relaxed);
              margin-bottom: var(--spacing-lg);
            }
            
            .retry-button {
              background-color: var(--color-error-primary);
              color: white;
              border: none;
              border-radius: var(--radius-sm);
              padding: var(--spacing-sm) var(--spacing-lg);
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
              cursor: pointer;
              transition: all var(--transition-fast);
            }
            
            .retry-button:hover {
              background-color: var(--color-error-500);
              transform: translateY(-1px);
            }
            
            .retry-button:focus {
              outline: 2px solid var(--focus-outline-color);
              outline-offset: var(--focus-outline-offset);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function LazyComponent<T = {}>(
  {
    componentImport,
    fallback,
    onError,
    retryAttempts = 3,
    ...props
  }: LazyComponentProps<T>
) {
  // Create lazy component with retry logic
  const LazyLoadedComponent = React.useMemo(() => {
    return lazy(() => 
      componentImport().catch(error => {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'lazy_component_import_error', {
            event_category: 'medical_system_performance',
            event_label: 'component_import_failed',
            custom_parameters: {
              medical_context: 'lazy_component_import',
              error_type: 'import_failure',
              error_message: error instanceof Error ? error.message : String(error)
            }
          });
        }
        throw error;
      })
    );
  }, [componentImport]);

  const defaultFallback = (
    <div className="lazy-loading-fallback">
      <LoadingSpinner size="lg" />
      <p>Carregando componente...</p>
      
      <style jsx>{`
        .lazy-loading-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: var(--spacing-xl);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          margin: var(--spacing-md) 0;
        }
        
        .lazy-loading-fallback p {
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          margin-top: var(--spacing-md);
          text-align: center;
        }
      `}</style>
    </div>
  );

  const componentName = componentImport.toString().match(/from ['"](.+)['"]/) || 'Unknown';

  return (
    <ErrorBoundary
      onError={onError}
      retryAttempts={retryAttempts}
      fallback={fallback}
      componentName={String(componentName)}
    >
      <Suspense fallback={fallback || defaultFallback}>
        <LazyLoadedComponent {...(props as T)} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Hook para lazy loading com Intersection Observer
export function useLazyLoad(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasLoaded, options]);

  return { ref, isIntersecting, hasLoaded };
}

// Componente para lazy loading baseado em scroll
export function LazyOnScroll({ 
  children, 
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '50px'
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}) {
  const { ref, isIntersecting } = useLazyLoad({ threshold, rootMargin });

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? children : (fallback || <div style={{ minHeight: '100px' }} />)}
    </div>
  );
}

// HOC para lazy loading de componentes
export function withLazyLoading<T extends Record<string, any>>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  options: {
    fallback?: React.ReactNode;
    onError?: (error: Error) => void;
    retryAttempts?: number;
  } = {}
) {
  return function LazyWrappedComponent(props: T) {
    return (
      <LazyComponent
        componentImport={componentImport}
        fallback={options.fallback}
        onError={options.onError}
        retryAttempts={options.retryAttempts}
        {...props}
      />
    );
  };
}