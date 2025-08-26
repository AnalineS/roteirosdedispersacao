'use client';

import React, { useState, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description?: string;
  dismissible?: boolean;
  retryable?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  autoClose?: number; // milliseconds
  'aria-label'?: string;
}

const icons = {
  error: <AlertCircle className="banner-icon" />,
  warning: <AlertTriangle className="banner-icon" />,
  info: <Info className="banner-icon" />,
  success: <CheckCircle className="banner-icon" />
};

export default function ErrorBanner({
  type = 'error',
  title,
  description,
  dismissible = true,
  retryable = false,
  onDismiss,
  onRetry,
  className = '',
  autoClose,
  'aria-label': ariaLabel,
  ...props
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  React.useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, handleDismiss]);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isVisible) return null;

  const roleMap = {
    error: 'alert',
    warning: 'alert', 
    info: 'status',
    success: 'status'
  };

  return (
    <div
      className={`error-banner error-banner-${type} ${className}`}
      role={roleMap[type]}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      aria-label={ariaLabel || `${type}: ${title}`}
      {...props}
    >
      <div className="banner-content">
        {icons[type]}
        
        <div className="banner-text">
          <h4 className="banner-title">
            {title}
          </h4>
          {description && (
            <p className="banner-description">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="banner-actions">
        {retryable && onRetry && (
          <button
            className="banner-action banner-retry"
            onClick={handleRetry}
            disabled={isRetrying}
            aria-label={isRetrying ? 'Tentando novamente...' : 'Tentar novamente'}
          >
            <RefreshCw className={`retry-icon ${isRetrying ? 'spinning' : ''}`} />
            {isRetrying ? 'Tentando...' : 'Tentar novamente'}
          </button>
        )}
        
        {dismissible && (
          <button
            className="banner-action banner-dismiss"
            onClick={handleDismiss}
            aria-label="Fechar notificação"
          >
            <X className="dismiss-icon" />
          </button>
        )}
      </div>

      <style jsx>{`
        .error-banner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border-left: 4px solid;
          margin-bottom: var(--spacing-md);
          animation: slideIn 0.3s ease-out;
        }

        .error-banner-error {
          background: var(--color-red-50, #fef2f2);
          border-left-color: var(--color-red-500, #ef4444);
          color: var(--color-red-800, #991b1b);
        }

        .error-banner-warning {
          background: var(--color-yellow-50, #fefce8);
          border-left-color: var(--color-yellow-500, #eab308);
          color: var(--color-yellow-800, #854d0e);
        }

        .error-banner-info {
          background: var(--color-blue-50, #eff6ff);
          border-left-color: var(--color-blue-500, #3b82f6);
          color: var(--color-blue-800, #1e40af);
        }

        .error-banner-success {
          background: var(--color-green-50, #f0fdf4);
          border-left-color: var(--color-green-500, #22c55e);
          color: var(--color-green-800, #166534);
        }

        .banner-content {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          flex: 1;
        }

        .banner-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .banner-text {
          flex: 1;
          min-width: 0;
        }

        .banner-title {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          line-height: var(--line-height-tight);
        }

        .banner-description {
          margin: 0;
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
          opacity: 0.9;
        }

        .banner-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-left: var(--spacing-md);
        }

        .banner-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .banner-retry {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
        }

        .banner-dismiss {
          padding: var(--spacing-xs);
        }

        .banner-action:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .banner-action:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        .banner-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .retry-icon,
        .dismiss-icon {
          width: 16px;
          height: 16px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark theme */
        [data-theme="dark"] .error-banner-error {
          background: var(--color-red-900, #7f1d1d);
          color: var(--color-red-100, #fecaca);
        }

        [data-theme="dark"] .error-banner-warning {
          background: var(--color-yellow-900, #78350f);
          color: var(--color-yellow-100, #fef3c7);
        }

        [data-theme="dark"] .error-banner-info {
          background: var(--color-blue-900, #1e3a8a);
          color: var(--color-blue-100, #dbeafe);
        }

        [data-theme="dark"] .error-banner-success {
          background: var(--color-green-900, #14532d);
          color: var(--color-green-100, #dcfce7);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .error-banner {
            border-width: 2px;
          }

          .banner-action:hover {
            background: rgba(0, 0, 0, 0.2);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .error-banner {
            animation: none;
          }

          .spinning {
            animation: none;
          }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .error-banner {
            flex-direction: column;
            align-items: stretch;
          }

          .banner-actions {
            margin-left: 0;
            margin-top: var(--spacing-md);
            justify-content: flex-end;
          }

          .banner-retry {
            order: 1;
          }

          .banner-dismiss {
            order: 2;
          }
        }
      `}</style>
    </div>
  );
}