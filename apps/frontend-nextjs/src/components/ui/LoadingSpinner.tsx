'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray' | string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  message?: string;
  className?: string;
  'aria-label'?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  message,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
    xl: '48px'
  };

  const colorMap = {
    primary: 'var(--color-primary-500, #22c55e)',
    secondary: 'var(--color-secondary-500, #f59e0b)', 
    white: '#ffffff',
    gray: 'var(--color-gray-500, #6b7280)'
  };

  const spinnerSize = sizeClasses[size];
  const spinnerColor = colorMap[color as keyof typeof colorMap] || color;

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="loading-dots">
            <div className="dot dot-1" />
            <div className="dot dot-2" />
            <div className="dot dot-3" />
          </div>
        );
      
      case 'pulse':
        return <div className="loading-pulse" />;
      
      case 'bars':
        return (
          <div className="loading-bars">
            <div className="bar bar-1" />
            <div className="bar bar-2" />
            <div className="bar bar-3" />
            <div className="bar bar-4" />
          </div>
        );
      
      default: // spinner
        return (
          <div 
            className="loading-spinner"
            style={{
              width: spinnerSize,
              height: spinnerSize,
              borderColor: `${spinnerColor}20`,
              borderTopColor: spinnerColor
            }}
          />
        );
    }
  };

  return (
    <div className={`loading-spinner-container loading-${size} ${className}`} {...props}>
      <div
        className="spinner-wrapper"
        aria-label={ariaLabel || message || "Carregando..."}
        role="status"
        style={{ color: spinnerColor }}
      >
        {renderSpinner()}
      </div>
      
      {message && (
        <span className="loading-message" aria-live="polite">
          {message}
        </span>
      )}

      <style jsx>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .spinner-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          border: 2px solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }

        /* Dots variant */
        .loading-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dot {
          border-radius: 50%;
          background: currentColor;
          animation: bounce 1.4s ease-in-out infinite both;
        }

        .loading-xs .dot {
          width: 3px;
          height: 3px;
        }

        .loading-sm .dot {
          width: 4px;
          height: 4px;
        }

        .loading-md .dot {
          width: 6px;
          height: 6px;
        }

        .loading-lg .dot {
          width: 8px;
          height: 8px;
        }

        .loading-xl .dot {
          width: 12px;
          height: 12px;
        }

        .dot-1 {
          animation-delay: -0.32s;
        }

        .dot-2 {
          animation-delay: -0.16s;
        }

        .dot-3 {
          animation-delay: 0s;
        }

        /* Pulse variant */
        .loading-pulse {
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s ease-in-out infinite;
        }

        .loading-xs .loading-pulse {
          width: 16px;
          height: 16px;
        }

        .loading-sm .loading-pulse {
          width: 20px;
          height: 20px;
        }

        .loading-md .loading-pulse {
          width: 24px;
          height: 24px;
        }

        .loading-lg .loading-pulse {
          width: 32px;
          height: 32px;
        }

        .loading-xl .loading-pulse {
          width: 48px;
          height: 48px;
        }

        /* Bars variant */
        .loading-bars {
          display: flex;
          align-items: end;
          gap: 2px;
        }

        .bar {
          background: currentColor;
          border-radius: 1px;
          animation: bars 1.2s ease-in-out infinite;
        }

        .loading-xs .bar {
          width: 2px;
          height: 12px;
        }

        .loading-sm .bar {
          width: 3px;
          height: 16px;
        }

        .loading-md .bar {
          width: 3px;
          height: 20px;
        }

        .loading-lg .bar {
          width: 4px;
          height: 28px;
        }

        .loading-xl .bar {
          width: 6px;
          height: 40px;
        }

        .bar-1 {
          animation-delay: -0.4s;
        }

        .bar-2 {
          animation-delay: -0.3s;
        }

        .bar-3 {
          animation-delay: -0.2s;
        }

        .bar-4 {
          animation-delay: -0.1s;
        }

        .loading-message {
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          text-align: center;
          font-weight: var(--font-weight-medium);
        }

        @keyframes spin {
          0% { 
            transform: rotate(0deg); 
          }
          100% { 
            transform: rotate(360deg); 
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }

        @keyframes bars {
          0%, 40%, 100% {
            transform: scaleY(0.4);
            opacity: 0.5;
          }
          20% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner,
          .dot,
          .loading-pulse,
          .bar {
            animation: none;
          }
          
          .loading-spinner {
            border-color: currentColor;
            opacity: 0.8;
          }
          
          .dot,
          .loading-pulse,
          .bar {
            opacity: 0.8;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .spinner-wrapper {
            filter: contrast(1.2);
          }
        }

        /* Dark theme */
        [data-theme="dark"] .loading-message {
          color: var(--color-gray-300);
        }
      `}</style>
    </div>
  );
}