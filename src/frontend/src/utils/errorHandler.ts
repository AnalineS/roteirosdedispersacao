import { AxiosError } from 'axios'

export interface AppError {
  id: string
  type: 'network' | 'api' | 'validation' | 'permission' | 'unknown'
  message: string
  originalError?: any
  context?: string
  timestamp: Date
  retryable: boolean
  userFriendly: boolean
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: AppError[] = []
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1 second

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Process and categorize different error types
   */
  processError(error: any, context?: string): AppError {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, errorId, context)
    }
    
    // Handle React Query errors
    if (error?.response || error?.request) {
      return this.handleAPIError(error, errorId, context)
    }
    
    // Handle validation errors
    if (error?.name === 'ValidationError') {
      return this.handleValidationError(error, errorId, context)
    }
    
    // Handle generic errors
    return this.handleGenericError(error, errorId, context)
  }

  private isAxiosError(error: any): error is AxiosError {
    return error?.isAxiosError === true
  }

  private handleAxiosError(error: AxiosError, errorId: string, context?: string): AppError {
    const response = error.response
    
    // Network error (no response)
    if (!response) {
      return {
        id: errorId,
        type: 'network',
        message: 'Sem conexão com o servidor. Verifique sua internet.',
        originalError: error,
        context,
        timestamp: new Date(),
        retryable: true,
        userFriendly: true
      }
    }

    // Server errors (5xx)
    if (response.status >= 500) {
      return {
        id: errorId,
        type: 'api',
        message: 'Erro interno do servidor. Tente novamente em alguns minutos.',
        originalError: error,
        context,
        timestamp: new Date(),
        retryable: true,
        userFriendly: true
      }
    }

    // Rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers['x-ratelimit-reset'] || '60'
      return {
        id: errorId,
        type: 'api',
        message: `Muitas requisições. Tente novamente em ${retryAfter} segundos.`,
        originalError: error,
        context,
        timestamp: new Date(),
        retryable: true,
        userFriendly: true
      }
    }

    // Permission errors (401, 403)
    if ([401, 403].includes(response.status)) {
      return {
        id: errorId,
        type: 'permission',
        message: 'Acesso negado. Verifique suas permissões.',
        originalError: error,
        context,
        timestamp: new Date(),
        retryable: false,
        userFriendly: true
      }
    }

    // Client errors (4xx)
    if (response.status >= 400) {
      const apiMessage = (response.data as any)?.error || (response.data as any)?.message
      return {
        id: errorId,
        type: 'validation',
        message: apiMessage || 'Dados inválidos enviados.',
        originalError: error,
        context,
        timestamp: new Date(),
        retryable: false,
        userFriendly: true
      }
    }

    return this.handleGenericError(error, errorId, context)
  }

  private handleAPIError(error: any, errorId: string, context?: string): AppError {
    const apiMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message
    
    return {
      id: errorId,
      type: 'api',
      message: apiMessage || 'Erro na comunicação com o servidor.',
      originalError: error,
      context,
      timestamp: new Date(),
      retryable: true,
      userFriendly: true
    }
  }

  private handleValidationError(error: any, errorId: string, context?: string): AppError {
    return {
      id: errorId,
      type: 'validation',
      message: error.message || 'Dados fornecidos são inválidos.',
      originalError: error,
      context,
      timestamp: new Date(),
      retryable: false,
      userFriendly: true
    }
  }

  private handleGenericError(error: any, errorId: string, context?: string): AppError {
    return {
      id: errorId,
      type: 'unknown',
      message: error?.message || 'Erro inesperado.',
      originalError: error,
      context,
      timestamp: new Date(),
      retryable: false,
      userFriendly: false
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: AppError): string {
    if (error.userFriendly) {
      return error.message
    }

    // Fallback messages for non-user-friendly errors
    switch (error.type) {
      case 'network':
        return 'Problema de conexão. Verifique sua internet e tente novamente.'
      case 'api':
        return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
      case 'validation':
        return 'Informações fornecidas são inválidas. Verifique os dados e tente novamente.'
      case 'permission':
        return 'Você não tem permissão para realizar esta ação.'
      default:
        return 'Erro inesperado. Se o problema persistir, entre em contato com o suporte.'
    }
  }

  /**
   * Retry mechanism for retryable errors
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: AppError | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.processError(error, context)
        
        // Don't retry if not retryable or last attempt
        if (!lastError.retryable || attempt === maxRetries) {
          break
        }
        
        // Wait before retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt)
        await this.sleep(delay)
        
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} for ${context}:`, lastError.message)
      }
    }
    
    // All retries failed
    if (lastError) {
      this.logError(lastError)
      throw lastError
    }
    
    throw new Error('Unexpected error in retry mechanism')
  }

  /**
   * Log error for debugging and monitoring
   */
  logError(error: AppError): void {
    console.group(`🚨 Error Handler [${error.id}]`)
    console.error('Type:', error.type)
    console.error('Message:', error.message)
    console.error('Context:', error.context)
    console.error('Retryable:', error.retryable)
    console.error('User Friendly:', error.userFriendly)
    console.error('Timestamp:', error.timestamp.toISOString())
    if (error.originalError) {
      console.error('Original Error:', error.originalError)
    }
    console.groupEnd()

    // Add to error queue for potential batching/reporting
    this.errorQueue.push(error)
    
    // Keep only recent errors (max 50)
    if (this.errorQueue.length > 50) {
      this.errorQueue = this.errorQueue.slice(-50)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToMonitoring(error)
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportToMonitoring(error: AppError): void {
    // In a real app, this would send to Sentry, LogRocket, etc.
    console.log('📊 Reporting error to monitoring service:', error.id)
    
    // Example: Send to external service
    // if (window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: error.message,
    //     fatal: error.type === 'unknown'
    //   })
    // }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(): AppError[] {
    return [...this.errorQueue]
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = []
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if error should trigger offline mode
   */
  isOfflineError(error: AppError): boolean {
    return error.type === 'network' && 
           (error.originalError?.code === 'NETWORK_ERROR' ||
            error.originalError?.message?.includes('Network Error'))
  }

  /**
   * Create a recovery suggestion based on error type
   */
  getRecoverySuggestion(error: AppError): string[] {
    switch (error.type) {
      case 'network':
        return [
          'Verifique sua conexão com a internet',
          'Tente recarregar a página',
          'Aguarde alguns minutos e tente novamente'
        ]
      case 'api':
        return [
          'Aguarde alguns minutos e tente novamente',
          'Recarregue a página',
          'Entre em contato com o suporte se persistir'
        ]
      case 'validation':
        return [
          'Verifique os dados fornecidos',
          'Corrija os campos marcados como inválidos',
          'Consulte a documentação para formatos aceitos'
        ]
      case 'permission':
        return [
          'Faça login novamente',
          'Verifique se tem as permissões necessárias',
          'Entre em contato com o administrador'
        ]
      default:
        return [
          'Recarregue a página',
          'Limpe o cache do navegador',
          'Entre em contato com o suporte técnico'
        ]
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Hook for React components
export const useErrorHandler = () => {
  const handler = ErrorHandler.getInstance()
  
  return {
    processError: handler.processError.bind(handler),
    getUserMessage: handler.getUserMessage.bind(handler),
    withRetry: handler.withRetry.bind(handler),
    logError: handler.logError.bind(handler),
    getRecoverySuggestion: handler.getRecoverySuggestion.bind(handler),
    isOfflineError: handler.isOfflineError.bind(handler)
  }
}