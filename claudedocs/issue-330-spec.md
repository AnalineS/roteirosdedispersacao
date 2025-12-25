## 🎯 Objetivo
Implementar sistema robusto e inteligente de tratamento de erros com retry automático, mensagens específicas por tipo de falha, feedback visual/sonoro e recuperação graceful para garantir resiliência do chat em condições adversas de rede.

---

## 📊 User Stories

### História Principal
**Como** usuário com conexão instável
**Quero** que o sistema tente automaticamente reenviar mensagens quando houver falha temporária
**Para que** eu não precise manualmente recarregar a página ou reenviar mensagens

### Histórias Secundárias
1. **Como** usuário técnico
   **Quero** ver mensagens de erro específicas (network timeout, server error, rate limit)
   **Para que** eu possa diagnosticar problemas e tomar ações apropriadas

2. **Como** usuário de tecnologia assistiva
   **Quero** ouvir anúncios claros quando erros ocorrem via aria-live
   **Para que** eu seja informado de problemas sem depender apenas de feedback visual

3. **Como** usuário frustrado
   **Quero** botão de retry manual quando retry automático falhar
   **Para que** eu possa tentar novamente sem perder o contexto da conversa

4. **Como** desenvolvedor
   **Quero** logs detalhados de falhas e padrões de retry
   **Para que** eu possa monitorar saúde do sistema e identificar problemas

---

## ✅ Critérios de Aceitação (Testáveis)

### 1. Retry Automático com Exponential Backoff
- [ ] Retry automático habilitado por padrão para falhas de rede
- [ ] Estratégia de backoff: 1s, 2s, 4s (exponencial base 2)
- [ ] Máximo de 3 tentativas antes de mostrar erro final
- [ ] Loading indicator atualizado durante tentativas ("Tentando novamente 1/3...")
- [ ] Teste E2E: Simular 2 falhas + 1 sucesso = mensagem entregue
- [ ] Teste unitário: Verificar sequência de delays [1000ms, 2000ms, 4000ms]

### 2. Mensagens de Erro Específicas
- [ ] **Network Error:** "Sem conexão com internet. Verifique sua rede."
- [ ] **Timeout (>30s):** "Servidor demorou muito para responder. Tente novamente."
- [ ] **500 Server Error:** "Erro no servidor. Nossa equipe foi notificada."
- [ ] **429 Rate Limit:** "Muitas requisições. Aguarde 30 segundos."
- [ ] **400 Bad Request:** "Mensagem inválida. Verifique o conteúdo."
- [ ] **Unknown Error:** "Erro desconhecido. Código: [error_code]"
- [ ] Teste: Mock cada tipo de erro e validar mensagem exibida

### 3. Botão de Retry Manual
- [ ] Botão aparece após falha final (3 tentativas esgotadas)
- [ ] Texto do botão: "Tentar Novamente" com ícone de refresh
- [ ] Atalho de teclado: Alt + R para retry
- [ ] Botão desabilitado durante retry em progresso
- [ ] Estado de loading visual durante retry manual
- [ ] Teste: Click no botão deve reenviar mensagem original

### 4. Loading States Durante Retry
- [ ] Primeira tentativa: "Enviando mensagem..."
- [ ] Retry 1/3: "Tentando novamente (1/3)..."
- [ ] Retry 2/3: "Tentando novamente (2/3)..."
- [ ] Retry 3/3: "Última tentativa (3/3)..."
- [ ] Spinner animado visível durante todo processo
- [ ] Teste: Verificar texto de loading atualiza corretamente

### 5. ARIA Live Announcements para Erros
- [ ] Erros críticos anunciados com `aria-live="assertive"`
- [ ] Formato: "Erro: [mensagem específica]. [ação sugerida]"
- [ ] Retry automático anunciado: "Tentando reenviar mensagem automaticamente"
- [ ] Sucesso após retry anunciado: "Mensagem enviada com sucesso"
- [ ] Teste manual NVDA: Validar anúncios durante fluxo de erro

### 6. Limite de Tentativas
- [ ] Máximo de 3 tentativas automáticas (configurável)
- [ ] Após 3 falhas: mostrar erro final com retry manual
- [ ] Contador visível: "Tentativa 2 de 3"
- [ ] Fallback system ativado após esgotamento de tentativas
- [ ] Teste: Forçar 4 falhas e verificar que para na 3ª tentativa

---

## 🔧 Implementação Técnica Detalhada

### Arquivos a Modificar

#### 1. `apps/frontend-nextjs/src/hooks/useChat.ts`
**Adicionar lógica de retry com exponential backoff:**

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

// Função utilitária para retry com backoff
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, delay: number) => void
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Não fazer retry se for erro de cliente (4xx exceto 429)
      if (isClientError(error) && !isRateLimitError(error)) {
        throw error;
      }

      // Última tentativa - lançar erro
      if (attempt === config.maxRetries - 1) {
        throw lastError;
      }

      // Calcular delay com exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      // Notificar callback de retry
      if (onRetry) {
        onRetry(attempt + 1, delay);
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Classificação de erros
function getErrorType(error: unknown): ErrorType {
  if (error instanceof TypeError || !navigator.onLine) {
    return 'network';
  }

  if (error instanceof Response) {
    switch (error.status) {
      case 429: return 'rate_limit';
      case 408: return 'timeout';
      case 400: return 'bad_request';
      case 500:
      case 502:
      case 503: return 'server_error';
      default: return 'unknown';
    }
  }

  return 'unknown';
}

// Mensagens de erro específicas
function getErrorMessage(errorType: ErrorType, error?: unknown): string {
  const messages: Record<ErrorType, string> = {
    network: 'Sem conexão com internet. Verifique sua rede e tente novamente.',
    timeout: 'Servidor demorou muito para responder. Tente novamente em alguns instantes.',
    server_error: 'Erro no servidor. Nossa equipe foi notificada. Tente novamente mais tarde.',
    rate_limit: 'Muitas requisições. Por favor, aguarde 30 segundos antes de tentar novamente.',
    bad_request: 'Mensagem inválida. Verifique o conteúdo e tente novamente.',
    unknown: `Erro desconhecido. Código: ${error instanceof Error ? error.message : 'N/A'}`
  };

  return messages[errorType] || messages.unknown;
}

// Atualizar função sendMessage no useChat
export function useChat(options: UseChatOptions = {}) {
  const [retryState, setRetryState] = useState<{
    isRetrying: boolean;
    currentAttempt: number;
    maxAttempts: number;
  }>({
    isRetrying: false,
    currentAttempt: 0,
    maxAttempts: DEFAULT_RETRY_CONFIG.maxRetries
  });

  const sendMessage = useCallback(async (
    message: string,
    personaId: string
  ) => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setRetryState({ isRetrying: false, currentAttempt: 0, maxAttempts: 3 });

    try {
      // Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        persona: personaId
      };
      addMessage(userMessage);

      // Tentar enviar com retry automático
      const response = await retryWithExponentialBackoff(
        () => sendChatMessage(message, personaId),
        DEFAULT_RETRY_CONFIG,
        (attempt, delay) => {
          // Atualizar estado de retry
          setRetryState({
            isRetrying: true,
            currentAttempt: attempt,
            maxAttempts: DEFAULT_RETRY_CONFIG.maxRetries
          });

          // Anunciar retry para screen readers
          announceSystemStatus(
            `Tentando reenviar mensagem automaticamente (${attempt}/${DEFAULT_RETRY_CONFIG.maxRetries})`,
            'info'
          );
        }
      );

      // Sucesso - adicionar resposta
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        persona: personaId
      };
      addMessage(assistantMessage);

      // Anunciar sucesso
      announceSystemStatus('Mensagem enviada com sucesso', 'info');

    } catch (error) {
      // Falha final após todas as tentativas
      const errorType = getErrorType(error);
      const errorMessage = getErrorMessage(errorType, error);

      setError(errorMessage);

      // Anunciar erro para screen readers
      announceSystemStatus(errorMessage, 'error');

      // Log para monitoramento
      console.error('[useChat] Erro após retry:', {
        errorType,
        attempts: retryState.currentAttempt,
        error
      });

      // Capturar erro para analytics
      captureError(error as Error, {
        severity: errorType === 'network' ? 'medium' : 'high',
        context: { errorType, retryAttempts: retryState.currentAttempt }
      });

    } finally {
      setLoading(false);
      setRetryState({ isRetrying: false, currentAttempt: 0, maxAttempts: 3 });
    }
  }, [addMessage, setLoading, setError, announceSystemStatus, captureError]);

  // Função de retry manual
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, lastUserMessage.persona);
    }
  }, [messages, sendMessage]);

  return {
    // ... exports existentes
    retryState,
    retryLastMessage,
    canRetry: !!error && !loading
  };
}
```

#### 2. `apps/frontend-nextjs/src/components/chat/modern/ModernChatContainer.tsx`
**Adicionar UI de erro com retry manual:**

```tsx
// Novo componente para exibir erro com retry
interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
  canRetry: boolean;
  retryState: {
    isRetrying: boolean;
    currentAttempt: number;
    maxAttempts: number;
  };
}

const ErrorMessage = ({ error, onRetry, canRetry, retryState }: ErrorMessageProps) => {
  const { announceSystemStatus } = useChatAccessibility();

  const handleRetry = useCallback(() => {
    announceSystemStatus('Tentando reenviar mensagem', 'info');
    onRetry();
  }, [onRetry, announceSystemStatus]);

  // Atalho de teclado Alt + R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'r' && canRetry) {
        e.preventDefault();
        handleRetry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canRetry, handleRetry]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="error-message-container"
      style={{
        padding: '16px',
        margin: '16px 0',
        backgroundColor: '#FEE2E2',
        border: '2px solid #EF4444',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      {/* Ícone de erro */}
      <XCircle size={24} color="#DC2626" aria-hidden="true" />

      <div style={{ flex: 1 }}>
        {/* Mensagem de erro */}
        <p style={{ margin: 0, color: '#991B1B', fontWeight: 600 }}>
          {error}
        </p>

        {/* Estado de retry */}
        {retryState.isRetrying && (
          <p style={{ margin: '8px 0 0', color: '#7F1D1D', fontSize: '14px' }}>
            Tentando novamente ({retryState.currentAttempt}/{retryState.maxAttempts})...
          </p>
        )}
      </div>

      {/* Botão de retry manual */}
      {canRetry && !retryState.isRetrying && (
        <button
          onClick={handleRetry}
          disabled={!canRetry}
          aria-label="Tentar enviar mensagem novamente (Atalho: Alt + R)"
          style={{
            padding: '8px 16px',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: canRetry ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            opacity: canRetry ? 1 : 0.5
          }}
        >
          <RefreshCw size={16} />
          Tentar Novamente
          <span style={{ fontSize: '12px', opacity: 0.8 }}>(Alt+R)</span>
        </button>
      )}

      {/* Loading durante retry */}
      {retryState.isRetrying && (
        <LoadingSpinner size="small" aria-label="Reenviando mensagem" />
      )}
    </div>
  );
};

// No ModernChatContainer, adicionar ErrorMessage quando houver erro
const ModernChatContainer = memo(function ModernChatContainer({
  // ... props existentes
  error,
  retryState,
  onRetryLastMessage,
  canRetry
}: ModernChatContainerProps) {
  return (
    <div className="modern-chat-container">
      {/* ... conteúdo existente */}

      {/* Mensagem de erro com retry */}
      {error && (
        <ErrorMessage
          error={error}
          onRetry={onRetryLastMessage}
          canRetry={canRetry}
          retryState={retryState}
        />
      )}

      {/* ... resto do conteúdo */}
    </div>
  );
});
```

#### 3. `apps/frontend-nextjs/src/components/chat/accessibility/ChatAccessibilityProvider.tsx`
**Já existe `announceSystemStatus` - usar para erros:**

```tsx
// Função existente - apenas documentar uso para erros
const announceSystemStatus = useCallback((status: string, type: 'info' | 'warning' | 'error' = 'info') => {
  const priority = type === 'error' || type === 'warning' ? 'assertive' : 'polite';
  const prefix = type === 'error' ? 'Erro: ' : type === 'warning' ? 'Atenção: ' : '';
  announceMessage(`${prefix}${status}`, priority);
}, [announceMessage]);
```

---

## 🧪 Estratégia de Testes

### Testes Unitários

#### 1. Teste de Retry com Exponential Backoff
```typescript
// tests/hooks/useChat-retry.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';

describe('useChat - Retry Logic', () => {
  it('deve fazer retry com exponential backoff', async () => {
    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;

    // Mock setTimeout para capturar delays
    global.setTimeout = jest.fn((fn, delay) => {
      delays.push(delay);
      return originalSetTimeout(fn, 0); // Executar imediatamente nos testes
    }) as any;

    // Mock de API que falha 2x e depois sucede
    let attemptCount = 0;
    global.fetch = jest.fn(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
    }) as any;

    const { result } = renderHook(() => useChat());

    await result.current.sendMessage('Test message', 'dr_gasnelio');

    // Verificar que houve 2 retries
    expect(attemptCount).toBe(3);

    // Verificar exponential backoff: 1s, 2s
    expect(delays).toEqual([1000, 2000]);

    global.setTimeout = originalSetTimeout;
  });

  it('deve parar após 3 tentativas e mostrar erro', async () => {
    // Mock de API que sempre falha
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    const { result } = renderHook(() => useChat());

    await result.current.sendMessage('Test message', 'dr_gasnelio');

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.retryState.currentAttempt).toBe(0); // Reset após falha final
    });
  });
});
```

#### 2. Teste de Classificação de Erros
```typescript
// tests/utils/error-handling.test.ts
describe('Error Classification', () => {
  it('deve identificar erro de rede', () => {
    const error = new TypeError('Failed to fetch');
    expect(getErrorType(error)).toBe('network');
  });

  it('deve identificar rate limit (429)', () => {
    const error = { status: 429 } as Response;
    expect(getErrorType(error)).toBe('rate_limit');
  });

  it('deve identificar timeout (408)', () => {
    const error = { status: 408 } as Response;
    expect(getErrorType(error)).toBe('timeout');
  });

  it('deve gerar mensagem específica por tipo', () => {
    expect(getErrorMessage('network')).toContain('Sem conexão');
    expect(getErrorMessage('timeout')).toContain('demorou muito');
    expect(getErrorMessage('rate_limit')).toContain('30 segundos');
  });
});
```

### Testes E2E (Playwright)

#### 1. Teste de Retry Automático com Sucesso
```typescript
// tests/e2e/chat-error-retry.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Error Handling - Auto Retry', () => {
  test('deve fazer retry automático e eventualmente enviar mensagem', async ({ page, context }) => {
    // Simular falhas de rede intercaladas com sucesso
    let attemptCount = 0;
    await context.route('**/api/chat', async (route) => {
      attemptCount++;

      if (attemptCount < 3) {
        // Primeiras 2 tentativas falham
        await route.abort('failed');
      } else {
        // 3ª tentativa sucede
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            message: 'Resposta do assistente',
            persona: 'dr_gasnelio'
          })
        });
      }
    });

    await page.goto('/chat');

    // Enviar mensagem
    await page.selectOption('[data-testid="persona-select"]', 'dr_gasnelio');
    await page.fill('[data-chat-input]', 'Teste de retry');
    await page.press('[data-chat-input]', 'Enter');

    // Verificar que houve 3 tentativas
    await page.waitForTimeout(5000); // Aguardar retries

    // Verificar que mensagem foi eventualmente enviada
    await expect(page.locator('text=Resposta do assistente')).toBeVisible({
      timeout: 10000
    });

    // Verificar que houve exatamente 3 requests
    expect(attemptCount).toBe(3);
  });

  test('deve mostrar indicador de retry durante tentativas', async ({ page, context }) => {
    await context.route('**/api/chat', async (route) => {
      // Delay artificial para permitir verificação de UI
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.abort('failed');
    });

    await page.goto('/chat');
    await page.fill('[data-chat-input]', 'Teste');
    await page.press('[data-chat-input]', 'Enter');

    // Verificar indicadores de retry
    await expect(page.locator('text=Tentando novamente (1/3)')).toBeVisible();
    await expect(page.locator('text=Tentando novamente (2/3)')).toBeVisible();
  });
});
```

#### 2. Teste de Retry Manual
```typescript
test.describe('Chat Error Handling - Manual Retry', () => {
  test('deve exibir botão de retry após falha final', async ({ page, context }) => {
    // Sempre falhar
    await context.route('**/api/chat', route => route.abort('failed'));

    await page.goto('/chat');
    await page.fill('[data-chat-input]', 'Teste');
    await page.press('[data-chat-input]', 'Enter');

    // Aguardar todas as tentativas falharem
    await page.waitForTimeout(8000); // 1s + 2s + 4s + margem

    // Verificar botão de retry
    const retryButton = page.locator('button:has-text("Tentar Novamente")');
    await expect(retryButton).toBeVisible();

    // Clicar no botão
    await retryButton.click();

    // Verificar que nova tentativa foi iniciada
    await expect(page.locator('text=Tentando novamente')).toBeVisible();
  });

  test('atalho Alt+R deve fazer retry', async ({ page, context }) => {
    await context.route('**/api/chat', route => route.abort('failed'));

    await page.goto('/chat');
    await page.fill('[data-chat-input]', 'Teste');
    await page.press('[data-chat-input]', 'Enter');

    // Aguardar falha final
    await page.waitForTimeout(8000);

    // Pressionar Alt+R
    await page.keyboard.press('Alt+KeyR');

    // Verificar que retry foi iniciado
    await expect(page.locator('text=Tentando novamente')).toBeVisible();
  });
});
```

#### 3. Teste de Mensagens de Erro Específicas
```typescript
test.describe('Specific Error Messages', () => {
  test('deve mostrar mensagem específica para erro de rede', async ({ page, context }) => {
    await context.route('**/api/chat', route => route.abort('failed'));

    await page.goto('/chat');
    await page.fill('[data-chat-input]', 'Teste');
    await page.press('[data-chat-input]', 'Enter');

    await page.waitForTimeout(8000);

    await expect(page.locator('text=Sem conexão com internet')).toBeVisible();
  });

  test('deve mostrar mensagem específica para rate limit (429)', async ({ page, context }) => {
    await context.route('**/api/chat', route =>
      route.fulfill({ status: 429, body: 'Too Many Requests' })
    );

    await page.goto('/chat');
    await page.fill('[data-chat-input]', 'Teste');
    await page.press('[data-chat-input]', 'Enter');

    await expect(page.locator('text=Muitas requisições')).toBeVisible();
    await expect(page.locator('text=30 segundos')).toBeVisible();
  });

  test('deve mostrar mensagem específica para erro de servidor (500)', async ({ page, context }) => {
    await context.route('**/api/chat', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/chat');
    await page.fill('[data-chat-input]', 'Teste');
    await page.press('[data-chat-input]', 'Enter');

    await expect(page.locator('text=Erro no servidor')).toBeVisible();
    await expect(page.locator('text=Nossa equipe foi notificada')).toBeVisible();
  });
});
```

### Testes de Acessibilidade

#### 1. ARIA Announcements para Erros
```typescript
// tests/accessibility/error-announcements.spec.ts
test.describe('Error Accessibility', () => {
  test('erros devem ser anunciados com aria-live assertive', async ({ page }) => {
    await page.goto('/chat');

    // Verificar que live region assertive existe
    const assertiveRegion = page.locator('[aria-live="assertive"]');
    await expect(assertiveRegion).toBeAttached();

    // Simular erro
    await page.evaluate(() => {
      const event = new CustomEvent('show-error-toast', {
        detail: {
          errorId: 'test-error',
          severity: 'high',
          message: 'Erro de teste'
        }
      });
      window.dispatchEvent(event);
    });

    // Verificar que erro foi anunciado
    await expect(assertiveRegion).toContainText('Erro');
  });
});
```

---

## 🎯 Cenários de Edge Cases

### 1. Conexão Intermitente (Online → Offline → Online)
**Problema:** Usuário perde conexão durante retry
**Solução:** Monitorar `navigator.onLine` e pausar retries quando offline
```typescript
const retryWithNetworkAwareness = async () => {
  if (!navigator.onLine) {
    announceSystemStatus('Sem conexão. Aguardando reconexão...', 'warning');
    await waitForOnline();
  }
  return retryWithExponentialBackoff(fn);
};
```

### 2. Múltiplas Mensagens em Fila
**Problema:** Usuário envia 5 mensagens rápido, todas falham
**Solução:** Fila de retry com processamento sequencial
```typescript
const retryQueue = useRef<Array<() => Promise<void>>>([]);
const processQueue = async () => {
  while (retryQueue.current.length > 0) {
    const task = retryQueue.current.shift();
    await task?.();
  }
};
```

### 3. Erro Durante Retry (Network → Server Error)
**Problema:** Tipo de erro muda entre tentativas
**Solução:** Classificar erro a cada tentativa e atualizar mensagem
```typescript
catch (error) {
  const currentErrorType = getErrorType(error);
  setError(getErrorMessage(currentErrorType));
}
```

### 4. Rate Limit (429) - Retry Deve Aguardar Mais
**Problema:** Retry rápido em rate limit piora situação
**Solução:** Delay especial de 30s para 429
```typescript
if (error.status === 429) {
  const retryAfter = error.headers.get('Retry-After') || 30;
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
}
```

### 5. Usuário Cancela Retry Manual
**Problema:** Usuário quer desistir e começar nova conversa
**Solução:** Botão "Cancelar" ao lado de "Tentar Novamente"
```tsx
<button onClick={clearError}>Cancelar e Limpar Erro</button>
```

---

## 📊 Performance Considerations

### Impacto de Performance
- **Retry Logic:** +50ms overhead por tentativa (verificações)
- **Error Classification:** +5ms (análise de erro)
- **UI de Erro:** +20ms render inicial

### Otimizações
1. **Memoizar Error Messages:** Cache de mensagens por tipo
2. **Debounce Multiple Errors:** Evitar spam de toasts
3. **Cancelable Promises:** Permitir cancelamento de retries

```typescript
const useCancelableRetry = () => {
  const abortController = useRef(new AbortController());

  const cancelRetry = useCallback(() => {
    abortController.current.abort();
    abortController.current = new AbortController();
  }, []);

  return { signal: abortController.current.signal, cancelRetry };
};
```

---

## 🔐 Considerações de Segurança

### 1. Rate Limiting no Cliente
Evitar abuso de retry manual:
```typescript
const lastRetryTime = useRef(0);
const MIN_RETRY_INTERVAL = 2000; // 2s

const canRetryNow = () => {
  const now = Date.now();
  return now - lastRetryTime.current > MIN_RETRY_INTERVAL;
};
```

### 2. Sanitização de Mensagens de Erro
Não expor detalhes internos:
```typescript
const sanitizeErrorMessage = (error: Error) => {
  // Remover stack traces e detalhes técnicos sensíveis
  return error.message.replace(/at .+$/gm, '').trim();
};
```

### 3. Log Seguro de Erros
```typescript
// ❌ ERRADO - pode logar tokens
console.error('Error:', error);

// ✅ CORRETO - sanitizar antes de logar
console.error('Error:', {
  type: getErrorType(error),
  status: error.status,
  // Não incluir mensagem completa que pode ter dados sensíveis
});
```

---

## 📈 Métricas de Sucesso

### Quantitativas
- [ ] Taxa de sucesso após retry: > 90%
- [ ] Tempo médio de recuperação: < 10s
- [ ] Redução de erros reportados por usuários: 50%
- [ ] Taxa de uso de retry manual: < 10% (maioria resolve com auto-retry)

### Qualitativas
- [ ] Feedback positivo sobre mensagens de erro claras
- [ ] Redução de tickets de suporte sobre "mensagem não enviada"
- [ ] Aprovação em testes de usabilidade com conexão ruim

---

## 🔗 Relacionamentos

### Depende De
- `useChat` hook funcionando (✅ existe)
- `ChatAccessibilityProvider` para announcements (✅ existe)
- `ErrorToast` component (✅ existe)

### Bloqueia
- Implementação de offline mode completo
- Queue de mensagens persistente

### Relacionado Com
- #329 (A11y) - usa mesmos padrões de ARIA announcements
- #331 (Quick actions) - retry pode ser ação rápida

---

## 🚀 Plano de Rollout

### Fase 1: Desenvolvimento (3 dias)
1. Implementar retry logic em useChat
2. Criar classificação de erros
3. Adicionar UI de erro com retry manual
4. Integrar com ARIA announcements

### Fase 2: Testes (2 dias)
1. Testes unitários de retry logic
2. Testes E2E de cada tipo de erro
3. Testes manuais com network throttling
4. Validação de acessibilidade

### Fase 3: Monitoramento (1 dia)
1. Adicionar tracking de retry events
2. Dashboard de métricas de erro
3. Alertas para taxa de erro > 10%

### Fase 4: Deploy (0.5 dia)
1. Feature flag para rollout gradual
2. Deploy em staging com testes
3. Deploy 10% → 50% → 100%
4. Monitoramento 48h

**Total estimado: 6.5 dias de trabalho**

---

## 📝 Checklist de Implementação

### Desenvolvimento
- [ ] Implementar `retryWithExponentialBackoff` utility
- [ ] Adicionar `getErrorType` e `getErrorMessage`
- [ ] Atualizar `useChat` com retry logic
- [ ] Criar componente `ErrorMessage`
- [ ] Integrar retry manual com atalho Alt+R
- [ ] Adicionar ARIA announcements para erros

### Testes
- [ ] Testes unitários de retry logic
- [ ] Testes de classificação de erros
- [ ] Testes E2E de auto-retry
- [ ] Testes E2E de retry manual
- [ ] Testes de mensagens específicas por tipo
- [ ] Testes de acessibilidade com NVDA

### Monitoramento
- [ ] Adicionar evento de tracking para retries
- [ ] Dashboard de métricas de erro
- [ ] Alertas para degradação de serviço

### Deploy
- [ ] PR review aprovado
- [ ] Feature flag configurada
- [ ] Deploy em staging validado
- [ ] Rollout gradual em produção
- [ ] Monitoramento 48h pós-deploy

---

## 🏷️ Labels
`ux` `enhancement` `high-impact` `medium-effort` `error-handling` `resilience` `a11y` `testing-required`

🤖 Enhanced specification generated with Claude Code - Requirements Analysis Mode
