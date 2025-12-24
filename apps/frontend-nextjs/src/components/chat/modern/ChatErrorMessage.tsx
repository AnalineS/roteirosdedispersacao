'use client';

import React, { useEffect } from 'react';
import { ClassifiedError, getErrorIcon } from '@/utils/errorClassification';
import { modernChatTheme } from '@/config/modernTheme';
import { useChatAccessibility } from '../accessibility/ChatAccessibilityProvider';

interface ChatErrorMessageProps {
  error: ClassifiedError;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isRetrying?: boolean;
}

export default function ChatErrorMessage({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false
}: ChatErrorMessageProps) {
  const { announceSystemStatus } = useChatAccessibility();
  const canShowRetryButton = error.canRetry && onRetry && retryCount < maxRetries;

  // Issue #330: Announce error via screen reader
  useEffect(() => {
    announceSystemStatus(`Erro: ${error.userMessage}`, 'error');
  }, [error.userMessage, announceSystemStatus]);

  // Issue #330: Announce retry status
  useEffect(() => {
    if (isRetrying) {
      announceSystemStatus(`Tentando novamente (tentativa ${retryCount + 1} de ${maxRetries})`, 'info');
    }
  }, [isRetrying, retryCount, maxRetries, announceSystemStatus]);

  // Issue #330: Keyboard shortcut Alt+R for retry
  useEffect(() => {
    if (!canShowRetryButton || isRetrying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRetry?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canShowRetryButton, isRetrying, onRetry]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        backgroundColor: 'var(--color-error-light, #fee)',
        border: '2px solid var(--color-error, #dc2626)',
        borderRadius: modernChatTheme.borderRadius.md,
        padding: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: modernChatTheme.spacing.sm
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm
        }}
      >
        <span
          style={{
            fontSize: '1.5rem',
            flexShrink: 0
          }}
          aria-hidden="true"
        >
          {getErrorIcon(error.type)}
        </span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              color: 'var(--color-error, #dc2626)'
            }}
          >
            {error.userMessage}
          </p>
          {retryCount > 0 && (
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.875rem',
                color: 'var(--color-gray-600, #666)'
              }}
            >
              Tentativa {retryCount} de {maxRetries}
            </p>
          )}
        </div>
      </div>

      {canShowRetryButton && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          aria-label="Tentar novamente (Alt+R)"
          title="Tentar novamente (Alt+R)"
          style={{
            alignSelf: 'flex-start',
            padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
            backgroundColor: isRetrying
              ? 'var(--color-gray-300, #ccc)'
              : 'var(--color-primary, #0066cc)',
            color: 'white',
            border: 'none',
            borderRadius: modernChatTheme.borderRadius.sm,
            fontWeight: 600,
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.xs,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isRetrying) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark, #0052a3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRetrying) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary, #0066cc)';
            }
          }}
        >
          {isRetrying ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
                aria-hidden="true"
              />
              Tentando novamente...
            </>
          ) : (
            <>
              🔄 Tentar novamente
            </>
          )}
        </button>
      )}

      {!canShowRetryButton && retryCount >= maxRetries && (
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--color-gray-600, #666)',
            fontStyle: 'italic'
          }}
        >
          Falha após {maxRetries} tentativas. Verifique sua conexão e recarregue a página.
        </p>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Keyboard focus styles */
        button:focus-visible {
          outline: 2px solid var(--color-primary, #0066cc);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
