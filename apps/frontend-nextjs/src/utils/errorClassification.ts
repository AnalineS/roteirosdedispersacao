/**
 * Error Classification Utility - Issue #330
 *
 * Classifies errors into specific types for better user feedback
 */

export type ErrorType =
  | 'network'
  | 'timeout'
  | 'server_error'
  | 'rate_limit'
  | 'validation'
  | 'auth'
  | 'unknown';

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  retryDelay: number;
}

/**
 * Classifies an error into a specific type with user-friendly message
 */
export function classifyError(error: unknown): ClassifiedError {
  // Network errors (no connection)
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'network',
      message: 'Network error: Failed to fetch',
      userMessage: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
      canRetry: true,
      retryDelay: 2000
    };
  }

  // Timeout errors
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Request timeout',
      userMessage: 'O servidor demorou muito para responder. Tente novamente.',
      canRetry: true,
      retryDelay: 3000
    };
  }

  // HTTP errors
  if (error instanceof Error && 'response' in error) {
    const httpError = error as any;
    const status = httpError.response?.status;

    switch (status) {
      case 429:
        return {
          type: 'rate_limit',
          message: 'Rate limit exceeded',
          userMessage: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
          canRetry: true,
          retryDelay: 5000
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server_error',
          message: `Server error: ${status}`,
          userMessage: 'Erro no servidor. Estamos trabalhando para resolver. Tente novamente em instantes.',
          canRetry: true,
          retryDelay: 4000
        };

      case 400:
        return {
          type: 'validation',
          message: 'Validation error',
          userMessage: 'Mensagem inválida. Verifique o conteúdo e tente novamente.',
          canRetry: false,
          retryDelay: 0
        };

      case 401:
      case 403:
        return {
          type: 'auth',
          message: 'Authentication error',
          userMessage: 'Erro de autenticação. Faça login novamente.',
          canRetry: false,
          retryDelay: 0
        };

      default:
        return {
          type: 'unknown',
          message: `HTTP error: ${status}`,
          userMessage: `Erro desconhecido (código ${status}). Tente novamente.`,
          canRetry: true,
          retryDelay: 3000
        };
    }
  }

  // Generic error
  const message = error instanceof Error ? error.message : String(error);
  return {
    type: 'unknown',
    message,
    userMessage: 'Algo deu errado. Tente novamente.',
    canRetry: true,
    retryDelay: 3000
  };
}

/**
 * Get error icon for visual feedback
 */
export function getErrorIcon(type: ErrorType): string {
  switch (type) {
    case 'network':
      return '📡';
    case 'timeout':
      return '⏱️';
    case 'server_error':
      return '🔧';
    case 'rate_limit':
      return '⏳';
    case 'validation':
      return '⚠️';
    case 'auth':
      return '🔒';
    default:
      return '❌';
  }
}
