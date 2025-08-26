'use client';

import React from 'react';
import { FileX, Search, MessageSquare, BookOpen, AlertCircle, Frown } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'chat' | 'educational' | 'generic' | 'error' | 'offline';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

const defaultIcons = {
  search: <Search className="empty-icon" />,
  chat: <MessageSquare className="empty-icon" />,
  educational: <BookOpen className="empty-icon" />,
  error: <AlertCircle className="empty-icon" />,
  offline: <Frown className="empty-icon" />,
  generic: <FileX className="empty-icon" />
};

const defaultContent = {
  search: {
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar sua pesquisa ou usar palavras-chave diferentes'
  },
  chat: {
    title: 'Iniciar conversa',
    description: 'Faça uma pergunta sobre medicamentos para hanseníase'
  },
  educational: {
    title: 'Conteúdo não disponível',
    description: 'Este módulo educativo ainda não foi carregado'
  },
  error: {
    title: 'Algo deu errado',
    description: 'Ocorreu um erro inesperado. Tente novamente'
  },
  offline: {
    title: 'Sem conexão',
    description: 'Verifique sua conexão com a internet'
  },
  generic: {
    title: 'Nada para mostrar',
    description: 'Não há itens para exibir no momento'
  }
};

export default function EmptyState({
  type = 'generic',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
  size = 'md',
  'aria-label': ariaLabel,
  ...props
}: EmptyStateProps) {
  const content = defaultContent[type];
  const finalTitle = title || content.title;
  const finalDescription = description || content.description;
  const finalIcon = icon || defaultIcons[type];

  return (
    <div
      className={`empty-state empty-state-${size} ${className}`}
      role="status"
      aria-label={ariaLabel || `Estado vazio: ${finalTitle}`}
      {...props}
    >
      <div className="empty-state-content">
        {finalIcon}
        
        <h3 className="empty-state-title">
          {finalTitle}
        </h3>
        
        <p className="empty-state-description">
          {finalDescription}
        </p>
        
        {actionLabel && onAction && (
          <button
            className="empty-state-action"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <style jsx>{`
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: var(--spacing-xl);
          text-align: center;
        }

        .empty-state-sm {
          min-height: 120px;
          padding: var(--spacing-lg);
        }

        .empty-state-lg {
          min-height: 300px;
          padding: var(--spacing-2xl);
        }

        .empty-state-content {
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }

        .empty-state :global(.empty-icon) {
          width: 48px;
          height: 48px;
          color: var(--color-gray-400);
          stroke-width: 1.5;
        }

        .empty-state-sm :global(.empty-icon) {
          width: 32px;
          height: 32px;
        }

        .empty-state-lg :global(.empty-icon) {
          width: 64px;
          height: 64px;
        }

        .empty-state-title {
          margin: 0;
          font-family: var(--font-family-secondary);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          line-height: var(--line-height-tight);
        }

        .empty-state-sm .empty-state-title {
          font-size: var(--font-size-base);
        }

        .empty-state-lg .empty-state-title {
          font-size: var(--font-size-xl);
        }

        .empty-state-description {
          margin: 0;
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .empty-state-sm .empty-state-description {
          font-size: var(--font-size-sm);
        }

        .empty-state-lg .empty-state-description {
          font-size: var(--font-size-lg);
        }

        .empty-state-action {
          margin-top: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .empty-state-action:hover {
          background: var(--color-primary-600);
          transform: translateY(-1px);
        }

        .empty-state-action:focus {
          outline: 2px solid var(--color-primary-400);
          outline-offset: 2px;
        }

        .empty-state-action:active {
          transform: translateY(0);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .empty-state :global(.empty-icon) {
            color: var(--color-gray-600);
          }

          .empty-state-title {
            color: var(--color-gray-900);
          }

          .empty-state-description {
            color: var(--color-gray-700);
          }

          .empty-state-action {
            border: 2px solid var(--color-primary-700);
          }
        }

        /* Dark theme */
        [data-theme="dark"] .empty-state-title {
          color: var(--color-gray-100);
        }

        [data-theme="dark"] .empty-state-description {
          color: var(--color-gray-300);
        }

        [data-theme="dark"] .empty-state :global(.empty-icon) {
          color: var(--color-gray-500);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .empty-state-action {
            transition: none;
          }

          .empty-state-action:hover {
            transform: none;
          }

          .empty-state-action:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}