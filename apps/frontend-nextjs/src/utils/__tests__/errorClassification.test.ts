/**
 * Tests for Error Classification Utility - Issue #330
 * Coverage: Error type detection, user messages, retry eligibility, error icons
 */

import { classifyError, getErrorIcon, type ErrorType } from '../errorClassification';

describe('classifyError - Issue #330', () => {
  describe('Network Errors', () => {
    it('should classify "Failed to fetch" as network error', () => {
      const error = new TypeError('Failed to fetch');
      const result = classifyError(error);

      expect(result.type).toBe('network');
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(2000);
      expect(result.userMessage).toContain('Sem conexão');
    });

    it('should provide appropriate user message for network errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = classifyError(error);

      expect(result.userMessage).toBe('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
    });
  });

  describe('Timeout Errors', () => {
    it('should classify AbortError as timeout', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      const result = classifyError(error);

      expect(result.type).toBe('timeout');
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(3000);
    });

    it('should provide appropriate user message for timeout errors', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      const result = classifyError(error);

      expect(result.userMessage).toBe('O servidor demorou muito para responder. Tente novamente.');
    });
  });

  describe('HTTP 429 - Rate Limit', () => {
    it('should classify 429 status as rate_limit error', () => {
      const error = new Error('Rate limit exceeded') as Error & { response?: { status?: number } };
      error.response = { status: 429 };

      const result = classifyError(error);

      expect(result.type).toBe('rate_limit');
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(5000);
    });

    it('should provide appropriate user message for rate limit', () => {
      const error = new Error('Rate limit') as Error & { response?: { status?: number } };
      error.response = { status: 429 };

      const result = classifyError(error);

      expect(result.userMessage).toBe('Muitas requisições. Aguarde um momento antes de tentar novamente.');
    });
  });

  describe('Server Errors (5xx)', () => {
    it('should classify 500 as server_error', () => {
      const error = new Error('Internal Server Error') as Error & { response?: { status?: number } };
      error.response = { status: 500 };

      const result = classifyError(error);

      expect(result.type).toBe('server_error');
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(4000);
    });

    it('should classify 502 as server_error', () => {
      const error = new Error('Bad Gateway') as Error & { response?: { status?: number } };
      error.response = { status: 502 };

      const result = classifyError(error);

      expect(result.type).toBe('server_error');
    });

    it('should classify 503 as server_error', () => {
      const error = new Error('Service Unavailable') as Error & { response?: { status?: number } };
      error.response = { status: 503 };

      const result = classifyError(error);

      expect(result.type).toBe('server_error');
    });

    it('should classify 504 as server_error', () => {
      const error = new Error('Gateway Timeout') as Error & { response?: { status?: number } };
      error.response = { status: 504 };

      const result = classifyError(error);

      expect(result.type).toBe('server_error');
    });

    it('should provide appropriate user message for server errors', () => {
      const error = new Error('Server error') as Error & { response?: { status?: number } };
      error.response = { status: 500 };

      const result = classifyError(error);

      expect(result.userMessage).toBe('Erro no servidor. Estamos trabalhando para resolver. Tente novamente em instantes.');
    });
  });

  describe('HTTP 400 - Validation Error', () => {
    it('should classify 400 as validation error', () => {
      const error = new Error('Bad Request') as Error & { response?: { status?: number } };
      error.response = { status: 400 };

      const result = classifyError(error);

      expect(result.type).toBe('validation');
      expect(result.canRetry).toBe(false);
      expect(result.retryDelay).toBe(0);
    });

    it('should provide appropriate user message for validation errors', () => {
      const error = new Error('Validation failed') as Error & { response?: { status?: number } };
      error.response = { status: 400 };

      const result = classifyError(error);

      expect(result.userMessage).toBe('Mensagem inválida. Verifique o conteúdo e tente novamente.');
    });
  });

  describe('Authentication Errors (401/403)', () => {
    it('should classify 401 as auth error', () => {
      const error = new Error('Unauthorized') as Error & { response?: { status?: number } };
      error.response = { status: 401 };

      const result = classifyError(error);

      expect(result.type).toBe('auth');
      expect(result.canRetry).toBe(false);
      expect(result.retryDelay).toBe(0);
    });

    it('should classify 403 as auth error', () => {
      const error = new Error('Forbidden') as Error & { response?: { status?: number } };
      error.response = { status: 403 };

      const result = classifyError(error);

      expect(result.type).toBe('auth');
    });

    it('should provide appropriate user message for auth errors', () => {
      const error = new Error('Unauthorized') as Error & { response?: { status?: number } };
      error.response = { status: 401 };

      const result = classifyError(error);

      expect(result.userMessage).toBe('Erro de autenticação. Faça login novamente.');
    });
  });

  describe('Unknown Errors', () => {
    it('should classify unrecognized HTTP status as unknown', () => {
      const error = new Error('Unknown error') as Error & { response?: { status?: number } };
      error.response = { status: 418 }; // I'm a teapot

      const result = classifyError(error);

      expect(result.type).toBe('unknown');
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(3000);
    });

    it('should classify generic errors as unknown', () => {
      const error = new Error('Something went wrong');

      const result = classifyError(error);

      expect(result.type).toBe('unknown');
      expect(result.canRetry).toBe(true);
    });

    it('should handle non-Error objects', () => {
      const error = 'String error message';

      const result = classifyError(error);

      expect(result.type).toBe('unknown');
      expect(result.message).toBe('String error message');
    });

    it('should handle null/undefined errors', () => {
      const result1 = classifyError(null);
      const result2 = classifyError(undefined);

      expect(result1.type).toBe('unknown');
      expect(result2.type).toBe('unknown');
    });
  });

  describe('Retry Eligibility', () => {
    it('should allow retry for network errors', () => {
      const error = new TypeError('Failed to fetch');
      const result = classifyError(error);

      expect(result.canRetry).toBe(true);
    });

    it('should allow retry for timeout errors', () => {
      const error = new DOMException('Timeout', 'AbortError');
      const result = classifyError(error);

      expect(result.canRetry).toBe(true);
    });

    it('should allow retry for rate limit errors', () => {
      const error = new Error('Rate limit') as Error & { response?: { status?: number } };
      error.response = { status: 429 };

      const result = classifyError(error);

      expect(result.canRetry).toBe(true);
    });

    it('should allow retry for server errors', () => {
      const error = new Error('Server error') as Error & { response?: { status?: number } };
      error.response = { status: 500 };

      const result = classifyError(error);

      expect(result.canRetry).toBe(true);
    });

    it('should NOT allow retry for validation errors', () => {
      const error = new Error('Bad request') as Error & { response?: { status?: number } };
      error.response = { status: 400 };

      const result = classifyError(error);

      expect(result.canRetry).toBe(false);
    });

    it('should NOT allow retry for auth errors', () => {
      const error401 = new Error('Unauthorized') as Error & { response?: { status?: number } };
      error401.response = { status: 401 };

      const error403 = new Error('Forbidden') as Error & { response?: { status?: number } };
      error403.response = { status: 403 };

      expect(classifyError(error401).canRetry).toBe(false);
      expect(classifyError(error403).canRetry).toBe(false);
    });
  });

  describe('Retry Delays', () => {
    it('should set correct delay for network errors (2s)', () => {
      const error = new TypeError('Failed to fetch');
      expect(classifyError(error).retryDelay).toBe(2000);
    });

    it('should set correct delay for timeout errors (3s)', () => {
      const error = new DOMException('Timeout', 'AbortError');
      expect(classifyError(error).retryDelay).toBe(3000);
    });

    it('should set correct delay for rate limit (5s)', () => {
      const error = new Error('Rate limit') as Error & { response?: { status?: number } };
      error.response = { status: 429 };
      expect(classifyError(error).retryDelay).toBe(5000);
    });

    it('should set correct delay for server errors (4s)', () => {
      const error = new Error('Server error') as Error & { response?: { status?: number } };
      error.response = { status: 500 };
      expect(classifyError(error).retryDelay).toBe(4000);
    });

    it('should set zero delay for non-retryable errors', () => {
      const error = new Error('Bad request') as Error & { response?: { status?: number } };
      error.response = { status: 400 };
      expect(classifyError(error).retryDelay).toBe(0);
    });
  });

  describe('Error Message Generation', () => {
    it('should include error type in message', () => {
      const error = new TypeError('Failed to fetch');
      const result = classifyError(error);

      expect(result.message).toContain('Network error');
    });

    it('should include HTTP status in server error messages', () => {
      const error = new Error('Server error') as Error & { response?: { status?: number } };
      error.response = { status: 500 };

      const result = classifyError(error);

      expect(result.message).toBe('Server error: 500');
    });

    it('should use error message for unknown errors', () => {
      const error = new Error('Custom error message');
      const result = classifyError(error);

      expect(result.message).toBe('Custom error message');
    });
  });
});

describe('getErrorIcon - Issue #330', () => {
  const testCases: Array<[ErrorType, string]> = [
    ['network', '📡'],
    ['timeout', '⏱️'],
    ['server_error', '🔧'],
    ['rate_limit', '⏳'],
    ['validation', '⚠️'],
    ['auth', '🔒'],
    ['unknown', '❌'],
  ];

  testCases.forEach(([errorType, expectedIcon]) => {
    it(`should return ${expectedIcon} for ${errorType} errors`, () => {
      expect(getErrorIcon(errorType)).toBe(expectedIcon);
    });
  });

  it('should have icons for all error types', () => {
    const errorTypes: ErrorType[] = ['network', 'timeout', 'server_error', 'rate_limit', 'validation', 'auth', 'unknown'];

    errorTypes.forEach(type => {
      const icon = getErrorIcon(type);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });
});

describe('Error Classification Integration', () => {
  it('should provide all required fields for error display', () => {
    const error = new TypeError('Failed to fetch');
    const result = classifyError(error);

    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('userMessage');
    expect(result).toHaveProperty('canRetry');
    expect(result).toHaveProperty('retryDelay');
  });

  it('should have user messages in Portuguese', () => {
    const testErrors = [
      new TypeError('Failed to fetch'),
      new DOMException('Timeout', 'AbortError'),
      new Error('Rate limit') as Error & { response?: { status?: number } },
    ];

    testErrors.forEach(error => {
      if ('response' in error) {
        error.response = { status: 429 };
      }
      const result = classifyError(error);
      // Check for Portuguese words
      const portugueseWords = ['sem', 'verifique', 'tente', 'novamente', 'servidor', 'aguarde', 'conexão'];
      const hasPortuguese = portugueseWords.some(word =>
        result.userMessage.toLowerCase().includes(word)
      );
      expect(hasPortuguese).toBe(true);
    });
  });

  it('should classify all common error scenarios correctly', () => {
    const scenarios = [
      { error: new TypeError('Failed to fetch'), expectedType: 'network' },
      { error: new DOMException('Timeout', 'AbortError'), expectedType: 'timeout' },
      { error: { response: { status: 429 } }, expectedType: 'rate_limit' },
      { error: { response: { status: 500 } }, expectedType: 'server_error' },
      { error: { response: { status: 400 } }, expectedType: 'validation' },
      { error: { response: { status: 401 } }, expectedType: 'auth' },
      { error: new Error('Unknown'), expectedType: 'unknown' },
    ];

    scenarios.forEach(({ error, expectedType }) => {
      const result = classifyError(error);
      expect(result.type).toBe(expectedType);
    });
  });
});
