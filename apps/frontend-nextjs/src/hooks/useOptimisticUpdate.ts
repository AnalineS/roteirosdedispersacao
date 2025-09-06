/**
 * Hook para Optimistic Updates - PR #174
 * 
 * Implementa atualizações otimistas para melhorar a percepção
 * de performance em ações médicas críticas
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useHapticFeedback } from '@/utils/hapticFeedback';

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  isPending: boolean;
  error: string | null;
}

interface OptimisticUpdateOptions {
  enableHapticFeedback?: boolean;
  revertOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions = {}
) {
  const {
    enableHapticFeedback = true,
    revertOnError = true,
    maxRetries = 2,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    isPending: false,
    error: null
  });

  const { success, error: hapticError, info } = useHapticFeedback();
  const originalDataRef = useRef<T>(initialData);
  const retryCountRef = useRef(0);

  // Aplicar update otimista imediatamente
  const applyOptimisticUpdate = useCallback((optimisticData: T) => {
    if (enableHapticFeedback) {
      info(); // Feedback sutil para ação iniciada
    }

    // Salvar estado original
    originalDataRef.current = state.data;

    setState(prev => ({
      ...prev,
      data: optimisticData,
      isOptimistic: true,
      isPending: true,
      error: null
    }));
  }, [state.data, enableHapticFeedback, info]);

  // Confirmar update (quando API retorna sucesso)
  const confirmUpdate = useCallback((confirmedData?: T) => {
    if (enableHapticFeedback) {
      success(); // Feedback de sucesso
    }

    setState(prev => ({
      ...prev,
      data: confirmedData || prev.data,
      isOptimistic: false,
      isPending: false,
      error: null
    }));

    retryCountRef.current = 0;
  }, [enableHapticFeedback, success]);

  // Reverter update (quando API retorna erro)
  const revertUpdate = useCallback((errorMessage: string) => {
    if (enableHapticFeedback) {
      hapticError(); // Feedback de erro
    }

    if (revertOnError) {
      setState(prev => ({
        ...prev,
        data: originalDataRef.current,
        isOptimistic: false,
        isPending: false,
        error: errorMessage
      }));
    } else {
      setState(prev => ({
        ...prev,
        isOptimistic: false,
        isPending: false,
        error: errorMessage
      }));
    }
  }, [enableHapticFeedback, hapticError, revertOnError]);

  // Função principal para executar update otimista
  const performOptimisticUpdate = useCallback(async <R>(
    optimisticData: T,
    asyncOperation: () => Promise<R>,
    options?: {
      onSuccess?: (result: R) => T | void;
      onError?: (error: Error) => void;
      skipOptimistic?: boolean;
    }
  ): Promise<R | null> => {
    const { onSuccess, onError, skipOptimistic = false } = options || {};

    try {
      // Aplicar update otimista se não for skippado
      if (!skipOptimistic) {
        applyOptimisticUpdate(optimisticData);
      } else {
        setState(prev => ({ ...prev, isPending: true, error: null }));
      }

      // Executar operação assíncrona
      const result = await asyncOperation();

      // Processar resultado de sucesso
      if (onSuccess) {
        const updatedData = onSuccess(result);
        if (updatedData !== undefined) {
          confirmUpdate(updatedData);
        } else {
          confirmUpdate();
        }
      } else {
        confirmUpdate();
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      // Verificar se deve tentar novamente
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        
        // Retry após delay
        setTimeout(() => {
          performOptimisticUpdate(optimisticData, asyncOperation, options);
        }, retryDelay);
        
        return null;
      }

      // Processar erro final
      revertUpdate(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }

      return null;
    }
  }, [applyOptimisticUpdate, confirmUpdate, revertUpdate, maxRetries, retryDelay]);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Reset completo
  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      isPending: false,
      error: null
    });
    retryCountRef.current = 0;
  }, [initialData]);

  return {
    // Estado
    data: state.data,
    isOptimistic: state.isOptimistic,
    isPending: state.isPending,
    error: state.error,
    hasError: state.error !== null,
    
    // Ações
    performOptimisticUpdate,
    applyOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    clearError,
    reset,
    
    // Metadata
    retryCount: retryCountRef.current,
    canRetry: retryCountRef.current < maxRetries
  };
}

// Hook especializado para operações médicas
export function useMedicalOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions & {
    medicalValidation?: (data: T) => boolean;
    criticalOperation?: boolean;
  } = {}
) {
  const {
    medicalValidation,
    criticalOperation = false,
    ...baseOptions
  } = options;

  const optimisticHook = useOptimisticUpdate(initialData, {
    ...baseOptions,
    enableHapticFeedback: true,
    maxRetries: criticalOperation ? 5 : 2,
    retryDelay: criticalOperation ? 2000 : 1000
  });

  const performMedicalUpdate = useCallback(async <R>(
    optimisticData: T,
    asyncOperation: () => Promise<R>,
    updateOptions?: Parameters<typeof optimisticHook.performOptimisticUpdate>[2]
  ) => {
    // Validação médica antes de aplicar update
    if (medicalValidation && !medicalValidation(optimisticData)) {
      throw new Error('Dados médicos inválidos - operação cancelada por segurança');
    }

    return optimisticHook.performOptimisticUpdate(
      optimisticData,
      asyncOperation,
      updateOptions
    );
  }, [optimisticHook.performOptimisticUpdate, medicalValidation]);

  return {
    ...optimisticHook,
    performMedicalUpdate
  };
}