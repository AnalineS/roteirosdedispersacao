'use client';

import React from 'react';
import { type Toast, type ToastType } from '@/hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function getToastStyles(type: ToastType) {
  const baseStyles = {
    backgroundColor: '#fff',
    color: '#1f2937',
    borderLeft: '4px solid'
  };

  switch (type) {
    case 'success':
      return {
        ...baseStyles,
        borderLeftColor: '#10b981',
        icon: '✓'
      };
    case 'error':
      return {
        ...baseStyles,
        borderLeftColor: '#ef4444',
        icon: '✕'
      };
    case 'warning':
      return {
        ...baseStyles,
        borderLeftColor: '#f59e0b',
        icon: '⚠'
      };
    case 'info':
    default:
      return {
        ...baseStyles,
        borderLeftColor: '#3b82f6',
        icon: 'ℹ'
      };
  }
}

function getAriaLive(type: ToastType): 'polite' | 'assertive' {
  return type === 'error' || type === 'warning' ? 'assertive' : 'polite';
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      role="region"
      aria-label="Notificações"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        const ariaLive = getAriaLive(toast.type);

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={ariaLive}
            aria-atomic="true"
            style={{
              ...styles,
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              pointerEvents: 'auto',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}
                aria-hidden="true"
              >
                {styles.icon}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Fechar notificação"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>×</span>
            </button>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .toast-container {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
            max-width: none;
          }
        }

        /* Keyboard focus */
        button:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        }
      `}</style>
    </div>
  );
}
