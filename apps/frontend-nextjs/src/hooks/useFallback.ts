'use client';

import { useState, useCallback, useRef } from 'react';
import { fallbackSystem, executeSmartFallback, FallbackResult } from '@/services/fallbackSystem';
import { SentimentResult } from '@/services/sentimentAnalysis';

export interface FallbackState {
  isActive: boolean;
  result: FallbackResult | null;
  attempts: number;
  lastFailureType: string | null;
  systemHealth: string;
  hasFailures?: boolean;
  failureCount?: number;
}

export interface UseFallbackOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoReset?: boolean;
}

export function useFallback(options: UseFallbackOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoReset = true
  } = options;

  const [state, setState] = useState<FallbackState>({
    isActive: false,
    result: null,
    attempts: 0,
    lastFailureType: null,
    systemHealth: 'good'
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Executa fallback para uma query que falhou
   */
  const executeFallback = useCallback(async (
    query: string,
    error: Error,
    sentiment?: SentimentResult
  ): Promise<FallbackResult> => {
    setState(prev => ({
      ...prev,
      isActive: true,
      attempts: prev.attempts + 1
    }));

    try {
      const result = await executeSmartFallback(query, error, sentiment);
      
      setState(prev => ({
        ...prev,
        result,
        lastFailureType: error.message,
        systemHealth: fallbackSystem.getFailureStats().systemHealth
      }));

      // Auto reset após sucesso
      if (autoReset) {
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isActive: false,
            result: null
          }));
        }, 5000);
      }

      return result;
    } catch (fallbackError) {
      console.error('Fallback também falhou:', fallbackError);
      
      const emergencyResult: FallbackResult = {
        success: false,
        response: 'Sistema temporariamente indisponível. Tente novamente em alguns minutos ou consulte um profissional de saúde.',
        source: 'emergency',
        confidence: 0.1,
        emergency_contact: 'Disque Saúde: 136'
      };

      setState(prev => ({
        ...prev,
        result: emergencyResult,
        systemHealth: 'critical'
      }));

      return emergencyResult;
    }
  }, [autoReset]);

  /**
   * Tenta executar uma operação com fallback automático
   */
  const withFallback = useCallback(async <T>(
    operation: () => Promise<T>,
    query: string,
    sentiment?: SentimentResult
  ): Promise<T | FallbackResult> => {
    try {
      const result = await operation();
      
      // Sucesso - resetar contador de falhas se necessário
      if (state.attempts > 0 && autoReset) {
        setState(prev => ({
          ...prev,
          attempts: 0,
          isActive: false,
          result: null
        }));
      }
      
      return result;
    } catch (error) {
      console.warn('Operação falhou, executando fallback:', error);
      return await executeFallback(query, error as Error, sentiment);
    }
  }, [executeFallback, state.attempts, autoReset]);

  /**
   * Verifica se deve usar fallback baseado no estado do sistema
   */
  const shouldUseFallback = useCallback((error?: Error): boolean => {
    const stats = fallbackSystem.getFailureStats();
    
    // Usar fallback se sistema está degradado
    if (stats.systemHealth === 'degraded' || stats.systemHealth === 'critical') {
      return true;
    }
    
    // Usar fallback para erros específicos
    if (error) {
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('500') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503')
      );
    }
    
    return false;
  }, []);

  /**
   * Obtém sugestão de ação baseada no tipo de falha
   */
  const getFailureSuggestion = useCallback((error: Error): string => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network')) {
      return 'Verifique sua conexão com a internet';
    } else if (errorMessage.includes('timeout')) {
      return 'Tente novamente - o servidor pode estar ocupado';
    } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return 'Sistema em manutenção - tente novamente em alguns minutos';
    } else if (errorMessage.includes('404')) {
      return 'Recurso não encontrado - pode ser um problema temporário';
    }
    
    return 'Erro inesperado - tente novamente ou consulte suporte';
  }, []);

  /**
   * Retry com delay exponencial
   */
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      
      const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      
      return new Promise((resolve, reject) => {
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            const result = await retryWithBackoff(operation, attempt + 1);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        }, delay);
      });
    }
  }, [maxRetries, retryDelay]);

  /**
   * Reset manual do estado
   */
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setState({
      isActive: false,
      result: null,
      attempts: 0,
      lastFailureType: null,
      systemHealth: fallbackSystem.getFailureStats().systemHealth
    });
  }, []);

  /**
   * Obtém estatísticas do sistema
   */
  const getSystemStats = useCallback(() => {
    return fallbackSystem.getFailureStats();
  }, []);

  /**
   * Reset do contador de falhas do sistema
   */
  const resetSystemFailures = useCallback(() => {
    fallbackSystem.resetFailureCount();
    setState(prev => ({
      ...prev,
      systemHealth: 'good'
    }));
  }, []);

  return {
    // Estado
    state,
    isActive: state.isActive,
    result: state.result,
    attempts: state.attempts,
    systemHealth: state.systemHealth,
    
    // Ações
    executeFallback,
    withFallback,
    shouldUseFallback,
    getFailureSuggestion,
    retryWithBackoff,
    reset,
    
    // Utilitários
    getSystemStats,
    resetSystemFailures
  };
}

// Hook simples para casos básicos
export function useSimpleFallback() {
  const [isActive, setIsActive] = useState(false);
  const [lastResult, setLastResult] = useState<FallbackResult | null>(null);

  const execute = useCallback(async (
    query: string,
    error: Error,
    sentiment?: SentimentResult
  ): Promise<FallbackResult> => {
    setIsActive(true);
    
    try {
      const result = await executeSmartFallback(query, error, sentiment);
      setLastResult(result);
      return result;
    } finally {
      setIsActive(false);
    }
  }, []);

  return {
    isActive,
    lastResult,
    execute
  };
}