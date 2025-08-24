'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'var(--color-primary-500)',
  message,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: '16px',
    md: '24px', 
    lg: '32px',
    xl: '48px'
  };

  const spinnerSize = sizeClasses[size];

  return (
    <div className={`loading-spinner-container ${className}`}>
      <div 
        className="loading-spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderColor: `${color}20`,
          borderTopColor: color
        }}
        aria-label="Carregando..."
        role="status"
      />
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

        .loading-spinner {
          border: 2px solid;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
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

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
            border: 2px solid;
            border-color: ${color};
          }
          
          .loading-spinner::before {
            content: '⏳';
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            font-size: calc(${spinnerSize} * 0.6);
          }
        }
      `}</style>
    </div>
  );
}