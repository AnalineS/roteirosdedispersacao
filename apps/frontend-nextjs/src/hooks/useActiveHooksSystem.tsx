'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDynamicOptimization } from './useDynamicOptimization';
import { EffectUtils } from './useEffectOptimizer';
import { useGlobalContext } from '@/contexts/GlobalContextHub';
import { useSimpleTrack } from '@/components/tracking/IntegratedTrackingProvider';

// ============================================
// SISTEMA DE HOOKS ATIVOS
// ============================================

export interface ActiveHooksConfig {
  enableOptimization?: boolean;
  enableTracking?: boolean;
  enableErrorHandling?: boolean;
  enableAccessibility?: boolean;
  enablePerformanceMonitoring?: boolean;
  componentName?: string;
  autoActivate?: boolean;
}

export const useActiveHooksSystem = (config: ActiveHooksConfig = {}) => {
  const {
    enableOptimization = true,
    enableTracking = true,
    enableErrorHandling = true,
    enableAccessibility = true,
    enablePerformanceMonitoring = true,
    componentName = 'Unknown',
    autoActivate = true
  } = config;

  // ============================================
  // INTEGRAÇÃO DE SISTEMAS
  // ============================================

  // Sistema de otimização
  const optimization = useDynamicOptimization({
    enablePerformanceTracking: enablePerformanceMonitoring,
    enableMemoryOptimization: enableOptimization,
    enableAccessibilitySupport: enableAccessibility,
    enableErrorBoundary: enableErrorHandling
  });

  // Contexto global
  const globalContext = useGlobalContext();

  // Tracking
  const tracking = useSimpleTrack();

  // ============================================
  // REFS PARA OTIMIZAÇÃO
  // ============================================

  const componentRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  const interactionCountRef = useRef(0);
  const errorCountRef = useRef(0);

  // ============================================
  // HOOKS DINÂMICOS ATIVADOS
  // ============================================

  // Auto cleanup effect
  const { addCleanup } = EffectUtils.useAutoCleanup();

  // Intersection observer para performance
  const { isIntersecting, intersectionRatio } = optimization.useIntersectionObserver(
    componentRef as React.RefObject<HTMLDivElement>,
    {
      threshold: [0, 0.25, 0.5, 0.75, 1]
    }
  );

  // Resize observer para responsividade
  const dimensions = optimization.useResizeObserver(
    componentRef as React.RefObject<HTMLDivElement>
  );

  // Previous state tracking
  const previousDimensions = optimization.usePrevious(dimensions);
  const previousIntersection = optimization.usePrevious(intersectionRatio);

  // Local storage para preferências do componente
  const [componentPrefs, setComponentPrefs] = optimization.useLocalStorage(
    `component-prefs-${componentName}`,
    { initialized: false, lastUsed: Date.now() }
  );

  // ============================================
  // SMART INTERVAL PARA MÉTRICAS
  // ============================================

  const { isActive: metricsActive, pause: pauseMetrics, resume: resumeMetrics } = EffectUtils.useSmartInterval(
    useCallback(() => {
      if (!enablePerformanceMonitoring) return;

      const metrics = {
        renderCount: renderCountRef.current,
        interactionCount: interactionCountRef.current,
        errorCount: errorCountRef.current,
        intersectionRatio,
        dimensions,
        memoryUsage: optimization.memoryUsage
      };

      globalContext.updatePerformance({
        renderTime: optimization.metrics.averageRenderTime,
        interactionLatency: optimization.metrics.lastRenderTime,
        memoryUsage: optimization.memoryUsage
      });

      if (enableTracking) {
        tracking.track('scroll', 'performance_metrics', {
          component: componentName,
          ...metrics
        });
      }
    }, [
      enablePerformanceMonitoring, 
      intersectionRatio, 
      dimensions, 
      optimization, 
      globalContext, 
      enableTracking, 
      tracking, 
      componentName
    ]),
    5000, // 5 seconds
    {
      pauseOnBlur: true,
      pauseOnHidden: true
    }
  );

  // ============================================
  // ASYNC EFFECTS PARA INICIALIZAÇÃO
  // ============================================

  EffectUtils.useAsyncEffect(
    async () => {
      if (!autoActivate) return;

      // Simular inicialização assíncrona
      await new Promise(resolve => setTimeout(resolve, 100));

      // Marcar componente como inicializado
      setComponentPrefs(prev => ({
        ...prev,
        initialized: true,
        lastUsed: Date.now()
      }));

      // Track component mount
      if (enableTracking) {
        tracking.track('click', 'component_mounted', {
          component: componentName,
          optimization_enabled: enableOptimization,
          accessibility_enabled: enableAccessibility
        });
      }

      // Cleanup function
      return () => {
        if (enableTracking) {
          tracking.track('click', 'component_unmounted', {
            component: componentName,
            lifetime: Date.now() - componentPrefs.lastUsed
          });
        }
      };
    },
    [autoActivate, componentName, enableTracking, tracking, setComponentPrefs, componentPrefs.lastUsed],
    (error) => {
      errorCountRef.current += 1;
      optimization.handleError(error);
      
      if (enableTracking) {
        tracking.trackError('initialization_error', error.message, componentName);
      }
    }
  );

  // ============================================
  // CONDITIONAL EFFECTS
  // ============================================

  // Effect que roda apenas quando visível
  EffectUtils.useConditionalEffect(
    useCallback(() => {
      if (!enablePerformanceMonitoring) return;

      // Otimizações quando componente está visível
      if (isIntersecting) {
        resumeMetrics();
        
        // Prefetch ou lazy load de recursos
        if (intersectionRatio > 0.5) {
          // Component is significantly visible
          renderCountRef.current += 1;
        }
      } else {
        pauseMetrics();
      }
    }, [isIntersecting, intersectionRatio, enablePerformanceMonitoring, resumeMetrics, pauseMetrics]),
    isIntersecting,
    [isIntersecting, intersectionRatio]
  );

  // Effect para mudanças de dimensão
  EffectUtils.useConditionalEffect(
    useCallback(() => {
      if (!previousDimensions || !enableOptimization) return;

      const dimensionChanged = 
        dimensions.width !== previousDimensions.width || 
        dimensions.height !== previousDimensions.height;

      if (dimensionChanged) {
        // Handle responsive changes
        globalContext.updateContext('component_dimensions', {
          [componentName]: dimensions
        });

        if (enableTracking) {
          tracking.track('scroll', 'dimension_change', {
            component: componentName,
            from: previousDimensions,
            to: dimensions
          });
        }
      }
    }, [dimensions, previousDimensions, enableOptimization, globalContext, componentName, enableTracking, tracking]),
    Boolean(previousDimensions && (
      dimensions.width !== previousDimensions.width || 
      dimensions.height !== previousDimensions.height
    )),
    [dimensions, previousDimensions]
  );

  // ============================================
  // RETRY EFFECT PARA OPERAÇÕES CRÍTICAS
  // ============================================

  const { retryCount, isRetrying } = EffectUtils.useRetryEffect(
    async () => {
      if (!enableOptimization) return;

      // Simulação de operação que pode falhar
      if (Math.random() < 0.1) {
        throw new Error('Random failure simulation');
      }

      // Operação de otimização bem-sucedida
      optimization.trackRender();
    },
    3, // max retries
    1000, // delay
    [enableOptimization],
    (error, attempt) => {
      errorCountRef.current += 1;
      
      if (enableTracking) {
        tracking.trackError('optimization_retry', `${error.message} (attempt ${attempt})`, componentName);
      }
    }
  );

  // ============================================
  // EVENT HANDLERS OTIMIZADOS
  // ============================================

  const handleInteraction = optimization.throttledCallback(
    useCallback((event: React.SyntheticEvent, interactionType: string) => {
      interactionCountRef.current += 1;

      if (enableAccessibility) {
        optimization.announceToScreenReader(
          `${componentName} ${interactionType}`,
          'polite'
        );
      }

      if (enableTracking) {
        tracking.track('click', `${componentName}_${interactionType}`, {
          target: (event.target as HTMLElement)?.tagName,
          timestamp: Date.now()
        });
      }
    }, [componentName, enableAccessibility, optimization, enableTracking, tracking]),
    100
  );

  const handleFocus = useCallback((event: React.FocusEvent) => {
    handleInteraction(event, 'focus');
    
    if (enableAccessibility) {
      // Update focus management
      globalContext.updateAccessibility({
        focusVisible: true
      });
    }
  }, [handleInteraction, enableAccessibility, globalContext]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    handleInteraction(event, 'click');
  }, [handleInteraction]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleInteraction(event, 'keyboard_activate');
    }
  }, [handleInteraction]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================

  const componentStatus = useMemo(() => ({
    isVisible: isIntersecting,
    isOptimized: optimization.isOptimized,
    hasErrors: errorCountRef.current > 0,
    isRetrying,
    metrics: {
      renders: renderCountRef.current,
      interactions: interactionCountRef.current,
      errors: errorCountRef.current,
      retries: retryCount,
      visibility: intersectionRatio,
      dimensions
    }
  }), [isIntersecting, optimization.isOptimized, isRetrying, retryCount, intersectionRatio, dimensions]);

  const accessibility = useMemo(() => ({
    announceRef: optimization.announceRef,
    announce: optimization.announceToScreenReader,
    componentRef
  }), [optimization.announceRef, optimization.announceToScreenReader]);

  const performance = useMemo(() => ({
    metrics: optimization.metrics,
    clearMemory: optimization.clearMemory,
    isActive: metricsActive
  }), [optimization.metrics, optimization.clearMemory, metricsActive]);

  // ============================================
  // CLEANUP REGISTRATION
  // ============================================

  useEffect(() => {
    addCleanup(() => {
      // Final cleanup when component unmounts
      if (enableTracking) {
        tracking.track('click', 'component_cleanup', {
          component: componentName,
          finalMetrics: componentStatus.metrics
        });
      }
    });
  }, [addCleanup, enableTracking, tracking, componentName, componentStatus.metrics]);

  // ============================================
  // RETURN INTERFACE
  // ============================================

  return {
    // Status
    status: componentStatus,
    
    // Refs
    componentRef,
    announceRef: optimization.announceRef,
    
    // Event handlers
    handleClick,
    handleFocus,
    handleKeyDown,
    handleInteraction,
    
    // Accessibility
    accessibility,
    
    // Performance
    performance,
    
    // Utilities
    isVisible: isIntersecting,
    dimensions,
    
    // Optimization
    optimization: {
      isOptimized: optimization.isOptimized,
      clearMemory: optimization.clearMemory,
      debouncedValue: optimization.debouncedValue,
      throttledCallback: optimization.throttledCallback
    },
    
    // Hooks utilities (for custom usage)
    hooks: {
      useIntersectionObserver: optimization.useIntersectionObserver,
      useResizeObserver: optimization.useResizeObserver,
      usePrevious: optimization.usePrevious,
      useLocalStorage: optimization.useLocalStorage,
      effectUtils: EffectUtils
    }
  };
};

// ============================================
// HOC PARA AUTO-ATIVAÇÃO
// ============================================

export const withActiveHooks = <P extends object>(
  Component: React.ComponentType<P>,
  config: ActiveHooksConfig = {}
) => {
  const WrappedComponent = React.forwardRef<HTMLDivElement, P>((props, ref) => {
    const hooks = useActiveHooksSystem({
      ...config,
      componentName: Component.displayName || Component.name || 'Component'
    });

    return (
      <div ref={hooks.componentRef} style={{ display: 'contents' }}>
        <div ref={hooks.announceRef} className="sr-only" aria-live="polite" />
        <Component
          {...props}
          {...(ref && { ref })}
          {...(config.autoActivate && {
            onClick: hooks.handleClick,
            onFocus: hooks.handleFocus,
            onKeyDown: hooks.handleKeyDown
          })}
        />
      </div>
    );
  });

  WrappedComponent.displayName = `withActiveHooks(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};