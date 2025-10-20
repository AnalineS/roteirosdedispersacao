/**
 * Google Analytics A/B Testing Hook
 * Implementação integrada com GA4 Experiments
 */

import { useState, useEffect, useCallback } from 'react';

export interface ABTestVariant {
  name: string;
  isActive: boolean;
  config?: Record<string, unknown>;
  experimentId?: string;
}

export interface ABTestResult {
  variant: string;
  isActive: boolean;
  config: Record<string, unknown>;
  experimentId?: string;
}

// Cache local para variantes do Google Analytics
const variantCache = new Map<string, ABTestResult>();

// Google Analytics gtag interface declarada em types/analytics.ts

/**
 * Hook para A/B Testing com Google Analytics
 * @param experimentId ID do experimento no GA4
 * @returns Variante, configuração e funções de tracking
 */
export function useABTest(experimentId: string) {
  const [result, setResult] = useState<ABTestResult>({
    variant: 'control',
    isActive: false,
    config: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar variante do Google Analytics
  const fetchVariant = useCallback(async () => {
    if (!experimentId || typeof window === 'undefined') {
      setResult({ variant: 'control', isActive: false, config: {} });
      setLoading(false);
      return;
    }

    // Verificar cache primeiro
    const cached = variantCache.get(experimentId);
    if (cached) {
      setResult(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar se Google Analytics está disponível
      if (!window.gtag) {
        throw new Error('Google Analytics não disponível');
      }

      // Configurações de experimentos predefinidas
      const experimentConfigs: Record<string, ABTestResult> = {
        'calculadora_layout': {
          variant: Math.random() < 0.5 ? 'control' : 'variant_a',
          isActive: true,
          config: {
            showAdvancedOptions: Math.random() < 0.5,
            layoutType: Math.random() < 0.5 ? 'compact' : 'expanded'
          },
          experimentId: 'calculadora_layout'
        },
        'chat_persona_selection': {
          variant: Math.random() < 0.33 ? 'control' : Math.random() < 0.5 ? 'variant_a' : 'variant_b',
          isActive: true,
          config: {
            showPersonaPreview: Math.random() < 0.5,
            defaultPersona: Math.random() < 0.5 ? 'ga' : 'dr_gasnelio'
          },
          experimentId: 'chat_persona_selection'
        },
        'onboarding_flow': {
          variant: Math.random() < 0.5 ? 'control' : 'variant_a',
          isActive: true,
          config: {
            skipIntroVideo: Math.random() < 0.5,
            stepCount: Math.random() < 0.5 ? 3 : 5
          },
          experimentId: 'onboarding_flow'
        },
        'dashboard_layout': {
          variant: Math.random() < 0.5 ? 'control' : 'variant_a',
          isActive: true,
          config: {
            showQuickActions: Math.random() < 0.5,
            cardLayout: Math.random() < 0.5 ? 'grid' : 'list'
          },
          experimentId: 'dashboard_layout'
        }
      };

      // Buscar configuração do experimento
      const experimentResult = experimentConfigs[experimentId] || {
        variant: 'control',
        isActive: false,
        config: {},
        experimentId
      };

      // Enviar evento para Google Analytics
      window.gtag('event', 'experiment_impression', {
        experiment_id: experimentId,
        variant_id: experimentResult.variant,
        send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
      });

      // Cache resultado
      variantCache.set(experimentId, experimentResult);
      setResult(experimentResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[A/B Test] Failed to initialize experiment ${experimentId}:`, errorMessage);
      setError(errorMessage);

      // Fallback para control em caso de erro
      const fallback = { variant: 'control', isActive: false, config: {} };
      setResult(fallback);
      variantCache.set(experimentId, fallback);
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  // Função para tracking de conversões via Google Analytics
  const trackConversion = useCallback(async (
    metricName: string,
    metricValue: number = 1.0,
    properties?: Record<string, unknown>
  ) => {
    if (!result.experimentId || !result.isActive) {
      console.warn('[A/B Test] Cannot track conversion: experiment not active');
      return false;
    }

    try {
      // Enviar conversão para Google Analytics
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          experiment_id: result.experimentId,
          variant_id: result.variant,
          metric_name: metricName,
          value: metricValue,
          custom_parameters: properties || {},
          send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
        });

        // Também enviar como evento customizado
        window.gtag('event', metricName, {
          experiment_id: result.experimentId,
          variant_id: result.variant,
          event_category: 'AB_Test_Conversion',
          value: metricValue,
          ...properties
        });

        return true;
      }

      return false;

    } catch (err) {
      console.error('[A/B Test] Failed to track conversion:', err);
      return false;
    }
  }, [result.experimentId, result.variant, result.isActive]);

  // Função para verificar se está em uma variante específica
  const isVariant = useCallback((variantName: string) => {
    return result.variant === variantName && result.isActive;
  }, [result.variant, result.isActive]);

  // Buscar variante na inicialização
  useEffect(() => {
    fetchVariant();
  }, [fetchVariant]);

  return {
    variant: result.variant,
    isActive: result.isActive,
    config: result.config,
    loading,
    error,
    trackConversion,
    isVariant,
    refetch: fetchVariant
  };
}

/**
 * Hook para experimentos múltiplos com Google Analytics
 */
export function useMultipleABTests(experimentIds: string[]) {
  const [results, setResults] = useState<Record<string, ABTestResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || experimentIds.length === 0) {
      setLoading(false);
      return;
    }

    const initializeExperiments = () => {
      const newResults: Record<string, ABTestResult> = {};

      experimentIds.forEach(id => {
        // Verificar cache primeiro
        const cached = variantCache.get(id);
        if (cached) {
          newResults[id] = cached;
          return;
        }

        // Configurações de experimentos predefinidas
        const configs: Record<string, ABTestResult> = {
          'calculadora_layout': {
            variant: Math.random() < 0.5 ? 'control' : 'variant_a',
            isActive: true,
            config: { showAdvancedOptions: Math.random() < 0.5 },
            experimentId: 'calculadora_layout'
          },
          'chat_persona_selection': {
            variant: Math.random() < 0.5 ? 'control' : 'variant_a',
            isActive: true,
            config: { showPersonaPreview: Math.random() < 0.5 },
            experimentId: 'chat_persona_selection'
          },
          'dashboard_layout': {
            variant: Math.random() < 0.5 ? 'control' : 'variant_a',
            isActive: true,
            config: { cardLayout: Math.random() < 0.5 ? 'grid' : 'list' },
            experimentId: 'dashboard_layout'
          }
        };

        const result = configs[id] || {
          variant: 'control',
          isActive: false,
          config: {},
          experimentId: id
        };

        // Enviar impression para GA
        if (window.gtag) {
          window.gtag('event', 'experiment_impression', {
            experiment_id: id,
            variant_id: result.variant
          });
        }

        variantCache.set(id, result);
        newResults[id] = result;
      });

      setResults(newResults);
      setLoading(false);
    };

    initializeExperiments();
  }, [experimentIds]);

  return { results, loading };
}

/**
 * Utilitários para A/B Testing com Google Analytics
 */
export const ABTestUtils = {
  /**
   * Limpar cache de variantes
   */
  clearCache: () => {
    variantCache.clear();
  },

  /**
   * Rastrear evento personalizado via Google Analytics
   */
  trackEvent: (
    experimentId: string,
    variantId: string,
    eventName: string,
    properties?: Record<string, unknown>
  ) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
          experiment_id: experimentId,
          variant_id: variantId,
          event_category: 'AB_Test_Event',
          ...properties
        });
      }
    } catch (err) {
      console.error('[A/B Test] Failed to track event:', err);
    }
  },

  /**
   * Rastrear conversão específica
   */
  trackGoal: (
    experimentId: string,
    variantId: string,
    goalName: string,
    value?: number
  ) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          experiment_id: experimentId,
          variant_id: variantId,
          goal_name: goalName,
          value: value || 1,
          send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
        });
      }
    } catch (err) {
      console.error('[A/B Test] Failed to track goal:', err);
    }
  }
};

export default useABTest;