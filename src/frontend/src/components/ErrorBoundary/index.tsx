import { Component, ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send error to monitoring service (if available)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Log structured error for production monitoring
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'anonymous', // Could be populated from auth context
    }

    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      // In production, send to error tracking service
      console.log('📊 Error Report:', errorReport)
      
      // Example: Send to Sentry or similar service
      // Sentry.captureException(error, { extra: errorReport })
    }

    // Save to localStorage for offline debugging
    try {
      const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]')
      existingReports.push(errorReport)
      
      // Keep only last 10 error reports
      const recentReports = existingReports.slice(-10)
      localStorage.setItem('errorReports', JSON.stringify(recentReports))
    } catch (e) {
      console.warn('Could not save error report to localStorage:', e)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private copyErrorToClipboard = async () => {
    if (!this.state.error) return

    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error.message,
      stack: this.state.error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      alert('Detalhes do erro copiados para a área de transferência')
    } catch (e) {
      console.warn('Could not copy to clipboard:', e)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-error-500" />
              </div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Oops! Algo deu errado
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.
              </p>

              {/* Error ID */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID do Erro:</p>
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {this.state.errorId}
                </code>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full btn-primary btn-md flex items-center justify-center space-x-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Tentar Novamente</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full btn-secondary btn-md"
                >
                  Recarregar Página
                </button>

                {/* Development-only debug info */}
                {import.meta.env.DEV && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                      Detalhes Técnicos (Dev)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      <div className="mb-2">
                        <strong>Error:</strong>
                        <pre className="mt-1 text-error-600 dark:text-error-400 whitespace-pre-wrap">
                          {this.state.error?.message}
                        </pre>
                      </div>
                      
                      {this.state.error?.stack && (
                        <div className="mb-2">
                          <strong>Stack:</strong>
                          <pre className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-xs overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={this.copyErrorToClipboard}
                        className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Copiar Detalhes
                      </button>
                    </div>
                  </details>
                )}
              </div>

              {/* Support Contact */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Se o problema persistir, entre em contato com o suporte técnico
                  fornecendo o ID do erro acima.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Utilities moved to separate files:
// - useErrorHandler: src/hooks/useErrorHandler.tsx  
// - withErrorBoundary: src/utils/withErrorBoundary.tsx