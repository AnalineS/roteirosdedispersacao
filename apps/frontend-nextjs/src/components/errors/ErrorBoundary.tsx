/**
 * ErrorBoundary Component - Sistema de Tratamento de Erros
 * 
 * Componente de captura global de erros para aplicação médica de hanseníase.
 * Garante que erros não quebrem toda a aplicação e fornece feedback apropriado.
 * 
 * @module components/errors/ErrorBoundary
 * @version 1.0.0
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { secureLogger } from '@/utils/secureLogger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  errorId: string;
}

/**
 * ErrorBoundary para capturar e tratar erros em componentes React
 * 
 * Features implementadas:
 * - ✅ Captura erros em toda árvore de componentes filhos
 * - ✅ UI de fallback amigável ao usuário
 * - ✅ Registro estruturado para análise posterior
 * - ✅ Recuperação via refresh/reset
 * - ✅ Prevenção de loops de erro
 * - ✅ Logging diferenciado por ambiente
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeouts: number[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      errorId: this.generateErrorId()
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: new Date().getTime().toString(36)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, level = 'component' } = this.props;
    const { errorCount } = this.state;

    // Dados estruturados do erro
    const errorData = {
      id: this.state.errorId,
      timestamp: new Date().toISOString(),
      level,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
        viewport: typeof window !== 'undefined' ? 
          `${window.innerWidth}x${window.innerHeight}` : 'unknown',
        timestamp: Date.now()
      },
      count: errorCount + 1,
      severity: this.calculateSeverity(error, errorCount)
    };

    // Log estruturado e seguro para debugging
    secureLogger.error(
      `ErrorBoundary [${level}] - ${errorData.id}`,
      error,
      {
        errorId: errorData.id,
        severity: errorData.severity,
        timestamp: errorData.timestamp,
        errorCount
      }
    );

    // Atualizar contador
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Callback customizado
    if (onError) {
      onError(error, errorInfo);
    }

    // Logging para produção (simulado - integração futura)
    this.logErrorToService(errorData);

    // Prevenção de loops infinitos
    if (errorCount > 5) {
      console.error('🔥 Loop de erro detectado! Desabilitando auto-reset.');
      this.clearResetTimeouts();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Auto-reset baseado em props
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.handleReset();
    }

    // Auto-reset baseado em keys
    if (hasError && resetKeys && resetKeys !== prevProps.resetKeys) {
      const keysChanged = resetKeys.some((key, idx) => 
        key !== prevProps.resetKeys?.[idx]
      );
      if (keysChanged) {
        this.handleReset();
      }
    }
  }

  componentWillUnmount(): void {
    this.clearResetTimeouts();
  }

  private generateErrorId = (): string => {
    return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  };

  private calculateSeverity(error: Error, count: number): 'low' | 'medium' | 'high' | 'critical' {
    if (count > 3) return 'critical';
    if (error.name === 'ChunkLoadError') return 'medium';
    if (error.message.includes('Network')) return 'medium';
    if (error.stack?.includes('medical') || error.stack?.includes('dose')) return 'high';
    return count > 1 ? 'high' : 'medium';
  }

  private logErrorToService = (errorData: any): void => {
    // Simulação de envio para serviço de logging
    // TODO: Integrar com Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) })
      console.log('📤 Error enviado para logging service:', errorData.id);
    }
  };

  private clearResetTimeouts = (): void => {
    this.resetTimeouts.forEach(clearTimeout);
    this.resetTimeouts = [];
  };

  private handleReset = (): void => {
    console.log('🔄 Resetando ErrorBoundary...');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      errorId: this.generateErrorId()
    });
  };

  private handleGoHome = (): void => {
    console.log('🏠 Redirecionando para home...');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleReload = (): void => {
    console.log('🔄 Recarregando página...');
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorCount, errorId } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError && error) {
      // Fallback customizado
      if (fallback) {
        return <div data-error-boundary={errorId}>{fallback}</div>;
      }

      // UI padrão baseada no nível
      const isPageLevel = level === 'page';
      const containerClass = isPageLevel 
        ? "min-h-screen flex items-center justify-center bg-gray-50 px-4"
        : "flex items-center justify-center p-6 bg-gray-50 rounded-lg";

      return (
        <div className={containerClass} data-error-boundary={errorId}>
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className={`mt-4 ${isPageLevel ? 'text-xl' : 'text-lg'} font-semibold text-center text-gray-900`}>
              {isPageLevel ? 'Ops! Algo deu errado' : 'Erro no componente'}
            </h1>
            
            <p className="mt-2 text-sm text-center text-gray-600">
              {isPageLevel 
                ? 'Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.'
                : 'Este componente encontrou um problema, mas o resto da página funciona normalmente.'
              }
            </p>

            {/* Detalhes técnicos em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  🔧 Detalhes técnicos (dev only)
                </summary>
                <div className="mt-2 space-y-2">
                  <div><strong>ID:</strong> {errorId}</div>
                  <div><strong>Level:</strong> {level}</div>
                  <div><strong>Count:</strong> {errorCount}</div>
                  <pre className="whitespace-pre-wrap break-words text-red-700">
                    {error.toString()}
                  </pre>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap break-words text-gray-600 text-xs max-h-32 overflow-y-auto">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Alert para múltiplos erros */}
            {errorCount > 3 && (
              <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                ⚠️ Múltiplos erros detectados ({errorCount}x). 
                {isPageLevel && ' Considere recarregar completamente.'}
              </div>
            )}

            {/* Ações de recuperação */}
            <div className={`mt-6 flex ${isPageLevel ? 'flex-col sm:flex-row' : 'flex-col'} gap-3`}>
              <button
                onClick={this.handleReset}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={errorCount > 5}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
              
              {isPageLevel && (
                <>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ir para Início
                  </button>
                  
                  {errorCount > 2 && (
                    <button
                      onClick={this.handleReload}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recarregar Página
                    </button>
                  )}
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-center text-gray-500">
              ID do erro: {errorId.slice(-8).toUpperCase()}
              {isPageLevel && ' • Se persistir, entre em contato com o suporte'}
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC para adicionar ErrorBoundary a qualquer componente
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Preserve component name for debugging
  WrappedComponent.displayName = 
    `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Hook para uso fácil do ErrorBoundary em componentes funcionais
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { captureError, resetError };
};

export default ErrorBoundary;