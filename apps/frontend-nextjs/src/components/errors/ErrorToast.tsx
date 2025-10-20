/**
 * ErrorToast Component - Sistema de Notificação de Erros
 * 
 * Componente de toast para notificações automáticas de erros com diferentes severidades.
 * Integra com o sistema de error handling e fornece feedback visual ao usuário.
 * 
 * @module components/errors/ErrorToast
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, AlertTriangle, XCircle, X, RefreshCw } from 'lucide-react';
// Define ErrorSeverity type locally since it's not exported from useErrorHandler
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface Toast {
  id: string;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
}

interface ErrorToastProps {
  maxToasts?: number;
  autoCloseDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Sistema de Toast para notificações de erro
 * 
 * Features:
 * - ✅ Auto-dismiss após 5 segundos (configurável)
 * - ✅ Diferentes estilos por severidade
 * - ✅ Stacking de múltiplos toasts
 * - ✅ Accessibility compliant (ARIA)
 * - ✅ Animações suaves
 * - ✅ Ações de retry/dismiss manual
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
  maxToasts = 5,
  autoCloseDuration = 5000,
  position = 'top-right'
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  }, []);

  const addToast = useCallback((detail: { errorId: string; severity: ErrorSeverity; message: string }) => {
    const newToast: Toast = {
      id: detail.errorId,
      severity: detail.severity,
      message: detail.message,
      timestamp: Date.now()
    };

    setToasts(prevToasts => {
      const updated = [newToast, ...prevToasts];
      return updated.slice(0, maxToasts); // Limitar número de toasts
    });

    // Auto-dismiss
    setTimeout(() => {
      removeToast(detail.errorId);
    }, autoCloseDuration);
  }, [maxToasts, autoCloseDuration, removeToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Event listeners para integração com useErrorHandler
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      addToast(event.detail);
    };

    const handleClearToast = (event: CustomEvent) => {
      removeToast(event.detail.errorId);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('show-error-toast', handleShowToast as EventListener);
      window.addEventListener('clear-error-toast', handleClearToast as EventListener);

      return () => {
        window.removeEventListener('show-error-toast', handleShowToast as EventListener);
        window.removeEventListener('clear-error-toast', handleClearToast as EventListener);
      };
    }
  }, [addToast, removeToast]);

  const getToastStyles = (severity: ErrorSeverity) => {
    const baseStyles = "relative mb-3 p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm max-w-md animate-slide-in";
    
    switch (severity) {
      case 'critical':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'high':
        return `${baseStyles} bg-orange-50 border-orange-500 text-orange-800`;
      case 'medium':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'low':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-800`;
    }
  };

  const getToastIcon = (severity: ErrorSeverity) => {
    const iconProps = { size: 20, className: "flex-shrink-0" };
    
    switch (severity) {
      case 'critical':
        return <XCircle {...iconProps} className="text-red-600" />;
      case 'high':
        return <AlertTriangle {...iconProps} className="text-orange-600" />;
      case 'medium':
        return <AlertCircle {...iconProps} className="text-yellow-600" />;
      case 'low':
        return <AlertCircle {...iconProps} className="text-blue-600" />;
      default:
        return <AlertCircle {...iconProps} className="text-gray-600" />;
    }
  };

  const getToastTitle = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return 'Erro Crítico';
      case 'high':
        return 'Erro Importante';
      case 'medium':
        return 'Atenção';
      case 'low':
        return 'Informação';
      default:
        return 'Erro';
    }
  };

  const getPositionStyles = () => {
    const basePosition = "fixed z-50 flex flex-col";
    
    switch (position) {
      case 'top-right':
        return `${basePosition} top-4 right-4`;
      case 'top-left':
        return `${basePosition} top-4 left-4`;
      case 'bottom-right':
        return `${basePosition} bottom-4 right-4`;
      case 'bottom-left':
        return `${basePosition} bottom-4 left-4`;
      default:
        return `${basePosition} top-4 right-4`;
    }
  };

  const handleRetry = useCallback((toastId: string) => {
    // Trigger retry event para integração futura
    const event = new CustomEvent('retry-error-action', {
      detail: { errorId: toastId }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
    
    removeToast(toastId);
  }, [removeToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Container */}
      <div 
        className={getPositionStyles()}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={getToastStyles(toast.severity)}
            role="alert"
            aria-labelledby={`toast-title-${toast.id}`}
            aria-describedby={`toast-message-${toast.id}`}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getToastIcon(toast.severity)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div 
                  id={`toast-title-${toast.id}`}
                  className="text-sm font-semibold"
                >
                  {getToastTitle(toast.severity)}
                </div>
                <div 
                  id={`toast-message-${toast.id}`}
                  className="mt-1 text-sm opacity-90 break-words"
                >
                  {toast.message}
                </div>
                
                {/* Actions para erros críticos/altos */}
                {['critical', 'high'].includes(toast.severity) && (
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleRetry(toast.id)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-current hover:bg-current hover:text-white transition-colors"
                      aria-label={`Tentar novamente para erro ${toast.id}`}
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-3 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                aria-label={`Fechar notificação de erro ${toast.id}`}
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Progress Bar (visual do auto-dismiss) */}
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-bl-lg animate-progress" 
                 style={{ 
                   animationDuration: `${autoCloseDuration}ms`,
                   animationTimingFunction: 'linear',
                   animationFillMode: 'forwards'
                 }} 
            />
          </div>
        ))}
        
        {/* Clear All Button (quando há muitos toasts) */}
        {toasts.length > 2 && (
          <button
            onClick={clearAllToasts}
            className="mt-2 self-end px-3 py-1 text-xs font-medium text-gray-600 bg-white rounded border hover:bg-gray-50 transition-colors"
            aria-label="Limpar todas as notificações"
          >
            Limpar Todas ({toasts.length})
          </button>
        )}
      </div>

      {/* CSS personalizado para animações */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-progress {
          animation: progress linear;
        }
        
        /* Melhorias de acessibilidade */
        @media (prefers-reduced-motion: reduce) {
          .animate-slide-in,
          .animate-progress {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

/**
 * Hook para controle imperativo do sistema de toast
 * Útil para componentes que precisam mostrar toasts programaticamente
 */
export const useErrorToast = () => {
  const showToast = useCallback((severity: ErrorSeverity, message: string) => {
    const errorId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event = new CustomEvent('show-error-toast', {
      detail: { errorId, severity, message }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
    
    return errorId;
  }, []);

  const clearToast = useCallback((errorId: string) => {
    const event = new CustomEvent('clear-error-toast', {
      detail: { errorId }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }, []);

  return { showToast, clearToast };
};

export default ErrorToast;