'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Loader2,
  X,
  ArrowRight,
  Zap,
  Heart,
  Brain
} from 'lucide-react';

// Types
type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'thinking' | 'typing';
type FeedbackPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
type FeedbackVariant = 'toast' | 'banner' | 'inline' | 'floating';

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  duration?: number;
  position?: FeedbackPosition;
  variant?: FeedbackVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  showProgress?: boolean;
  persistent?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

interface FeedbackContextType {
  showFeedback: (feedback: Omit<FeedbackItem, 'id'>) => string;
  hideFeedback: (id: string) => void;
  showSuccess: (message: string, options?: Partial<FeedbackItem>) => string;
  showError: (message: string, options?: Partial<FeedbackItem>) => string;
  showWarning: (message: string, options?: Partial<FeedbackItem>) => string;
  showInfo: (message: string, options?: Partial<FeedbackItem>) => string;
  showLoading: (message: string, options?: Partial<FeedbackItem>) => string;
  showThinking: (message: string, options?: Partial<FeedbackItem>) => string;
  showTyping: (message: string, options?: Partial<FeedbackItem>) => string;
  clearAll: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

// Hook for using feedback
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// Individual feedback component
interface FeedbackComponentProps {
  feedback: FeedbackItem;
  onDismiss: (id: string) => void;
}

const FeedbackComponent: React.FC<FeedbackComponentProps> = ({ feedback, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);

    // Auto dismiss if duration is set
    if (feedback.duration && !feedback.persistent) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(progressInterval);
            handleDismiss();
            return 0;
          }
          return prev - (100 / (feedback.duration! / 50));
        });
      }, 50);

      return () => clearInterval(progressInterval);
    }
  }, [feedback.duration, feedback.persistent]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(feedback.id), 300);
  };

  const getIcon = () => {
    if (feedback.icon) return feedback.icon;
    
    switch (feedback.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      case 'loading':
        return <Loader2 size={20} className="animate-spin" />;
      case 'thinking':
        return <Brain size={20} className="thinking-animation" />;
      case 'typing':
        return <Zap size={20} className="typing-animation" />;
      default:
        return <Info size={20} />;
    }
  };

  const getColorScheme = () => {
    switch (feedback.type) {
      case 'success':
        return {
          background: 'var(--color-success-background)',
          border: 'var(--color-success-border)',
          text: 'var(--color-success-primary)',
          icon: 'var(--color-success-500)'
        };
      case 'error':
        return {
          background: 'var(--color-error-background)',
          border: 'var(--color-error-border)',
          text: 'var(--color-error-primary)',
          icon: 'var(--color-error-500)'
        };
      case 'warning':
        return {
          background: 'var(--color-warning-background)',
          border: 'var(--color-warning-border)',
          text: 'var(--color-warning-primary)',
          icon: 'var(--color-warning-500)'
        };
      case 'thinking':
        return {
          background: 'var(--gasnelio-background)',
          border: 'var(--gasnelio-primary)',
          text: 'var(--gasnelio-text)',
          icon: 'var(--gasnelio-primary)'
        };
      case 'typing':
        return {
          background: 'var(--ga-background)',
          border: 'var(--ga-primary)',
          text: 'var(--ga-text)',
          icon: 'var(--ga-primary)'
        };
      default:
        return {
          background: 'var(--color-info-background)',
          border: 'var(--color-info-border)',
          text: 'var(--color-info-primary)',
          icon: 'var(--color-info-500)'
        };
    }
  };

  const colors = getColorScheme();
  const variant = feedback.variant || 'toast';

  return (
    <div 
      className={`feedback-item feedback-${variant} feedback-${feedback.type} ${isVisible ? 'visible' : ''} ${feedback.className || ''}`}
      style={{
        '--feedback-bg': colors.background,
        '--feedback-border': colors.border,
        '--feedback-text': colors.text,
        '--feedback-icon': colors.icon
      } as React.CSSProperties}
      role={feedback.type === 'error' ? 'alert' : 'status'}
      aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Progress bar */}
      {feedback.showProgress && feedback.duration && (
        <div className="feedback-progress">
          <div 
            className="feedback-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="feedback-content">
        {/* Icon */}
        <div className="feedback-icon">
          {getIcon()}
        </div>

        {/* Text content */}
        <div className="feedback-text">
          {feedback.title && (
            <div className="feedback-title">{feedback.title}</div>
          )}
          <div className="feedback-message">{feedback.message}</div>
        </div>

        {/* Action button */}
        {feedback.action && (
          <button
            className="feedback-action"
            onClick={feedback.action.onClick}
            type="button"
          >
            {feedback.action.label}
            <ArrowRight size={16} />
          </button>
        )}

        {/* Dismiss button */}
        {feedback.dismissible !== false && (
          <button
            className="feedback-dismiss"
            onClick={handleDismiss}
            aria-label="Fechar notificação"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <style jsx>{`
        .feedback-item {
          display: flex;
          flex-direction: column;
          background: var(--feedback-bg);
          border: 1px solid var(--feedback-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          margin-bottom: var(--spacing-sm);
          opacity: 0;
          transform: translateX(100%);
          transition: all var(--transition-base);
          overflow: hidden;
          min-width: 320px;
          max-width: 500px;
          position: relative;
        }

        .feedback-item.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .feedback-toast {
          /* Toast specific styles */
        }

        .feedback-banner {
          width: 100%;
          border-radius: 0;
          margin-bottom: 0;
          transform: translateY(-100%);
        }

        .feedback-banner.visible {
          transform: translateY(0);
        }

        .feedback-inline {
          box-shadow: none;
          border-radius: var(--radius-md);
          transform: none;
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transition: all var(--transition-base);
        }

        .feedback-inline.visible {
          opacity: 1;
          max-height: 200px;
        }

        .feedback-floating {
          position: fixed;
          z-index: var(--z-tooltip);
        }

        .feedback-progress {
          height: 3px;
          background: var(--color-bg-tertiary);
          width: 100%;
        }

        .feedback-progress-bar {
          height: 100%;
          background: var(--feedback-icon);
          transition: width 50ms linear;
        }

        .feedback-content {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
        }

        .feedback-icon {
          color: var(--feedback-icon);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .feedback-text {
          flex: 1;
          min-width: 0;
        }

        .feedback-title {
          font-weight: var(--font-weight-semibold);
          color: var(--feedback-text);
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-xs);
          line-height: var(--line-height-tight);
        }

        .feedback-message {
          color: var(--feedback-text);
          font-size: var(--font-size-sm);
          line-height: var(--line-height-normal);
        }

        .feedback-action {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: var(--feedback-icon);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .feedback-action:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .feedback-dismiss {
          background: none;
          border: none;
          color: var(--color-text-light);
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .feedback-dismiss:hover {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        /* Animations */
        .thinking-animation {
          animation: thinking 2s ease-in-out infinite;
        }

        .typing-animation {
          animation: typing 1s ease-in-out infinite;
        }

        @keyframes thinking {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .feedback-item {
            min-width: 280px;
            max-width: calc(100vw - 2rem);
          }

          .feedback-content {
            padding: var(--spacing-sm);
          }

          .feedback-message {
            font-size: var(--font-size-xs);
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .feedback-item {
            transition: opacity var(--transition-fast);
            transform: none;
          }

          .thinking-animation,
          .typing-animation {
            animation: none;
          }

          .animate-spin {
            animation: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .feedback-item {
            border-width: 2px;
          }
        }
      `}</style>
    </div>
  );
};

// Feedback container component
interface FeedbackContainerProps {
  position?: FeedbackPosition;
  maxItems?: number;
}

const FeedbackContainer: React.FC<FeedbackContainerProps> = ({ 
  position = 'top-right',
  maxItems = 5
}) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  const showFeedback = useCallback((feedback: Omit<FeedbackItem, 'id'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newFeedback: FeedbackItem = {
      ...feedback,
      id,
      position: feedback.position || position,
      duration: feedback.duration || 5000,
      dismissible: feedback.dismissible ?? true,
      showProgress: feedback.showProgress ?? true,
      variant: feedback.variant || 'toast'
    };

    setFeedbacks(prev => {
      const updated = [newFeedback, ...prev];
      return updated.slice(0, maxItems); // Keep only the latest items
    });

    return id;
  }, [position, maxItems]);

  const hideFeedback = useCallback((id: string) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFeedbacks([]);
  }, []);

  // Helper methods
  const showSuccess = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ type: 'success', message, ...options });
  }, [showFeedback]);

  const showError = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ type: 'error', message, ...options });
  }, [showFeedback]);

  const showWarning = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ type: 'warning', message, ...options });
  }, [showFeedback]);

  const showInfo = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ type: 'info', message, ...options });
  }, [showFeedback]);

  const showLoading = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ 
      type: 'loading', 
      message, 
      persistent: true, 
      dismissible: false, 
      showProgress: false,
      ...options 
    });
  }, [showFeedback]);

  const showThinking = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ 
      type: 'thinking', 
      message, 
      persistent: true, 
      dismissible: false,
      showProgress: false,
      ...options 
    });
  }, [showFeedback]);

  const showTyping = useCallback((message: string, options?: Partial<FeedbackItem>) => {
    return showFeedback({ 
      type: 'typing', 
      message, 
      persistent: true, 
      dismissible: false,
      showProgress: false,
      ...options 
    });
  }, [showFeedback]);

  const contextValue: FeedbackContextType = {
    showFeedback,
    hideFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showThinking,
    showTyping,
    clearAll
  };

  const getPositionStyles = (pos: FeedbackPosition) => {
    switch (pos) {
      case 'top-right':
        return { top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' };
      case 'top-left':
        return { top: 'var(--spacing-lg)', left: 'var(--spacing-lg)' };
      case 'bottom-right':
        return { bottom: 'var(--spacing-lg)', right: 'var(--spacing-lg)' };
      case 'bottom-left':
        return { bottom: 'var(--spacing-lg)', left: 'var(--spacing-lg)' };
      case 'center':
        return { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        };
      default:
        return { top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' };
    }
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {/* Feedback container */}
      <div 
        className="feedback-container"
        style={{
          position: 'fixed',
          zIndex: 'var(--z-tooltip)',
          pointerEvents: 'none',
          ...getPositionStyles(position)
        }}
        aria-live="polite"
        aria-label="Notificações do sistema"
      >
        {feedbacks.map(feedback => (
          <div key={feedback.id} style={{ pointerEvents: 'auto' }}>
            <FeedbackComponent
              feedback={feedback}
              onDismiss={hideFeedback}
            />
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

// Main provider component
export const FeedbackProvider: React.FC<{ 
  children: React.ReactNode;
  position?: FeedbackPosition;
  maxItems?: number;
}> = ({ children, position = 'top-right', maxItems = 5 }) => {
  return (
    <>
      {children}
      <FeedbackContainer position={position} maxItems={maxItems} />
    </>
  );
};

export default FeedbackProvider;