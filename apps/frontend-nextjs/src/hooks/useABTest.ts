/**
 * React Hook for A/B Testing - ETAPA 5.1
 * Hook simplificado para usar A/B testing nos componentes React
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import ABTestingFramework, { useABTest as useABTestCore } from '@/utils/abTesting';

// ===== HOOK PRINCIPAL =====

/**
 * Hook para usar A/B testing em componentes React
 * 
 * @param experimentId ID do experimento
 * @param userId ID do usuário (opcional, será gerado se não fornecido)
 * @param sessionId ID da sessão (opcional, será gerado se não fornecido)
 * @returns Variant ativo e funções de tracking
 */
export function useABTest(experimentId: string, userId?: string, sessionId?: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const framework = ABTestingFramework.getInstance();
  
  useEffect(() => {
    const loadVariant = async () => {
      try {
        const userVariant = framework.getVariantForUser(
          experimentId, 
          userId || generateClientUserId(), 
          sessionId || generateClientSessionId()
        );
        setVariant(userVariant);
      } catch (error) {
        console.error('Error loading A/B test variant:', error);
        setVariant(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVariant();
  }, [experimentId, userId, sessionId, framework]);
  
  const trackConversion = useCallback((data: any = {}) => {
    if (variant) {
      framework.trackEvent(
        'conversion',
        experimentId,
        variant,
        userId || generateClientUserId(),
        sessionId || generateClientSessionId(),
        data
      );
    }
  }, [variant, experimentId, userId, sessionId, framework]);
  
  const trackInteraction = useCallback((data: any = {}) => {
    if (variant) {
      framework.trackEvent(
        'interaction',
        experimentId,
        variant,
        userId || generateClientUserId(),
        sessionId || generateClientSessionId(),
        data
      );
    }
  }, [variant, experimentId, userId, sessionId, framework]);
  
  return {
    variant,
    isLoading,
    isActive: variant !== null,
    trackConversion,
    trackInteraction
  };
}

// ===== HOOK PARA COMPONENTE VARIANT =====

/**
 * Hook para renderizar diferentes variants de um componente
 */
export function useABVariant<T = any>(
  experimentId: string,
  variants: Record<string, T>,
  defaultVariant?: T
): T | null {
  const { variant, isLoading } = useABTest(experimentId);
  
  if (isLoading) return null;
  if (!variant) return defaultVariant || null;
  
  return variants[variant] || defaultVariant || null;
}

// ===== HOOK PARA CONFIGURAÇÃO CONDICIONAL =====

/**
 * Hook para aplicar configurações baseadas no variant
 */
export function useABConfig<T = any>(
  experimentId: string,
  configMap: Record<string, T>,
  defaultConfig?: T
): T | null {
  const { variant, isLoading } = useABTest(experimentId);
  
  if (isLoading) return null;
  if (!variant) return defaultConfig || null;
  
  return configMap[variant] || defaultConfig || null;
}

// ===== UTILITY FUNCTIONS =====

function generateClientUserId(): string {
  // Tentar obter ID persistente do localStorage
  const existingId = localStorage.getItem('user_id');
  if (existingId) return existingId;
  
  // Gerar novo ID e salvar
  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('user_id', newId);
  return newId;
}

function generateClientSessionId(): string {
  // Usar ID de sessão baseado no sessionStorage
  const existingId = sessionStorage.getItem('session_id');
  if (existingId) return existingId;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('session_id', newId);
  return newId;
}

// ===== HOOK PARA ANALYTICS =====

/**
 * Hook para obter analytics dos experimentos ativos
 */
export function useABAnalytics(experimentId?: string) {
  const [analytics, setAnalytics] = useState<any>(null);
  const framework = ABTestingFramework.getInstance();
  
  useEffect(() => {
    if (experimentId) {
      const experiment = framework.getExperimentResults(experimentId);
      setAnalytics(experiment);
    } else {
      const activeExperiments = framework.getAllActiveExperiments();
      setAnalytics(activeExperiments);
    }
  }, [experimentId, framework]);
  
  return analytics;
}

export default useABTest;