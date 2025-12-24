'use client';

import React, { useState } from 'react';
import { type ChatMessage } from '@/types/api';
import { modernChatTheme } from '@/config/modernTheme';

interface MessageActionsProps {
  message: ChatMessage;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

export default function MessageActions({
  message,
  isFavorite,
  onToggleFavorite,
  onCopy,
  onRegenerate,
  canRegenerate = false
}: MessageActionsProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    onCopy();
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div
      className="message-actions"
      role="group"
      aria-label="Ações da mensagem"
      style={{
        display: 'flex',
        gap: modernChatTheme.spacing.xs,
        marginTop: modernChatTheme.spacing.xs,
        opacity: 0,
        transition: 'opacity 0.2s ease'
      }}
    >
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        aria-label="Copiar resposta"
        title="Copiar resposta (Ctrl+Shift+C)"
        style={{
          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
          backgroundColor: showCopied ? 'var(--color-success, #10b981)' : 'var(--color-gray-100, #f3f4f6)',
          color: showCopied ? 'white' : 'var(--color-gray-700, #374151)',
          border: '1px solid var(--color-gray-300, #d1d5db)',
          borderRadius: modernChatTheme.borderRadius.sm,
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.xs,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!showCopied) {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-200, #e5e7eb)';
          }
        }}
        onMouseLeave={(e) => {
          if (!showCopied) {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-100, #f3f4f6)';
          }
        }}
      >
        <span aria-hidden="true">{showCopied ? '✓' : '📋'}</span>
        {showCopied ? 'Copiado!' : 'Copiar'}
      </button>

      {/* Favorite Button */}
      <button
        onClick={onToggleFavorite}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos (Ctrl+Shift+F)'}
        style={{
          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
          backgroundColor: isFavorite ? 'var(--color-warning-light, #fef3c7)' : 'var(--color-gray-100, #f3f4f6)',
          color: isFavorite ? 'var(--color-warning-dark, #92400e)' : 'var(--color-gray-700, #374151)',
          border: `1px solid ${isFavorite ? 'var(--color-warning, #f59e0b)' : 'var(--color-gray-300, #d1d5db)'}`,
          borderRadius: modernChatTheme.borderRadius.sm,
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.xs,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span aria-hidden="true">{isFavorite ? '⭐' : '☆'}</span>
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </button>

      {/* Regenerate Button (only for assistant messages) */}
      {canRegenerate && onRegenerate && (
        <button
          onClick={onRegenerate}
          aria-label="Explicar novamente"
          title="Gerar nova resposta (Ctrl+Shift+E)"
          style={{
            padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
            backgroundColor: 'var(--color-gray-100, #f3f4f6)',
            color: 'var(--color-gray-700, #374151)',
            border: '1px solid var(--color-gray-300, #d1d5db)',
            borderRadius: modernChatTheme.borderRadius.sm,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.xs,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-200, #e5e7eb)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-gray-100, #f3f4f6)';
          }}
        >
          <span aria-hidden="true">🔄</span>
          Explicar novamente
        </button>
      )}

      <style jsx>{`
        /* Show actions on hover */
        .message-actions {
          opacity: 0;
        }

        :global(.message-bubble:hover) .message-actions,
        :global(.message-bubble:focus-within) .message-actions {
          opacity: 1;
        }

        /* Always show on touch devices */
        @media (hover: none) {
          .message-actions {
            opacity: 1;
          }
        }

        /* Keyboard focus styles */
        button:focus-visible {
          outline: 2px solid var(--color-primary, #0066cc);
          outline-offset: 2px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          button {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
