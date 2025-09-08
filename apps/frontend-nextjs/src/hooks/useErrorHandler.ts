import { useCallback, useEffect } from 'react';
import { ErrorMonitorService } from '@/components/monitoring/ErrorMonitor';

interface UseErrorHandlerOptions {
  component?: string;
  userId?: string;
  context?: Record<string, any>;
}

export const useErrorHandler = (options?: UseErrorHandlerOptions) => {
  const errorService = ErrorMonitorService.getInstance();
  
  // Handler para erros síncronos
  const handleError = useCallback((error: Error | string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    errorService.logError(error, {
      component: options?.component,
      userId: options?.userId,
      context: options?.context,
      severity
    });
  }, [errorService, options]);
  
  // Handler para promises
  const handleAsyncError = useCallback(async <T,>(
    promise: Promise<T>,
    errorMessage?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(
        errorMessage || (error instanceof Error ? error : String(error)),
        severity
      );
      return null;
    }
  }, [handleError]);
  
  // Auto-captura de erros no componente
  useEffect(() => {
    const componentErrorHandler = (error: Error) => {
      handleError(error, 'high');
    };
    
    // Adicionar error boundary local se possível
    if (typeof window !== 'undefined' && options?.component) {
      // Marcar o componente para tracking
      const componentElement = document.querySelector(`[data-component="${options.component}"]`);
      if (componentElement) {
        componentElement.addEventListener('error', componentErrorHandler as any);
        return () => {
          componentElement.removeEventListener('error', componentErrorHandler as any);
        };
      }
    }
  }, [handleError, options?.component]);
  
  return {
    handleError,
    handleAsyncError,
    logError: (message: string, severity?: 'low' | 'medium' | 'high' | 'critical') => 
      handleError(message, severity),
    logWarning: (message: string) => handleError(message, 'low'),
    logCritical: (message: string) => handleError(message, 'critical')
  };
};