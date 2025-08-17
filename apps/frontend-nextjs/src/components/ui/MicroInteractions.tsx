/**
 * Micro-interactions e Feedback Visual - ETAPA 6 UX TRANSFORMATION
 * Sistema completo de micro-interactions para contexto médico
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Feedback apropriado para profissionais de saúde
 * - User Engagement: Micro-interactions que aumentam engagement +20%
 * - Accessibility: Respeita preferências de movimento reduzido
 * - Performance: Animações otimizadas e não obstrusivas
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUnbColors } from '@/config/modernTheme';

// Interfaces para micro-interactions
interface FeedbackState {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends FeedbackState {
  id: string;
  onDismiss: (id: string) => void;
}

interface ButtonInteractionProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'medical';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  ripple?: boolean;
  feedback?: boolean;
}

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  medical?: boolean;
}

// Hook para gerenciar toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: FeedbackState) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      duration: toast.duration || 4000,
      onDismiss: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }
    };

    setToasts(prev => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return { toasts, addToast, removeToast, clearToasts };
};

// Componente Toast Individual
export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  action,
  id,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animação de entrada
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#f0fdf4',
          border: '#22c55e',
          text: '#166534',
          icon: '✅',
          title: 'Sucesso!'
        };
      case 'error':
        return {
          bg: '#fee2e2',
          border: '#dc2626',
          text: '#991b1b',
          icon: '❌',
          title: 'Erro!'
        };
      case 'warning':
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e',
          icon: '⚠️',
          title: 'Atenção!'
        };
      case 'info':
        return {
          bg: '#dbeafe',
          border: '#3b82f6',
          text: '#1d4ed8',
          icon: 'ℹ️',
          title: 'Informação'
        };
      case 'loading':
        return {
          bg: '#f1f5f9',
          border: '#64748b',
          text: '#475569',
          icon: '⏳',
          title: 'Processando...'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div
      style={{
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: '12px',
        padding: '16px',
        margin: '8px 0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isExiting ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '400px',
        position: 'relative',
        overflow: 'hidden'
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Barra de progresso para auto-dismiss */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: config.border,
          animation: type !== 'loading' ? 'toast-progress 4s linear forwards' : undefined,
          width: type === 'loading' ? '100%' : '0%'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
          {config.icon}
        </span>
        
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: config.text,
            marginBottom: '4px'
          }}>
            {config.title}
          </div>
          
          <div style={{
            fontSize: '0.875rem',
            color: config.text,
            lineHeight: '1.4'
          }}>
            {message}
          </div>
          
          {action && (
            <button
              onClick={action.onClick}
              style={{
                marginTop: '8px',
                background: config.border,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              {action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: config.text,
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '4px',
            borderRadius: '4px',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Container de Toasts
export const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxHeight: '80vh',
      overflow: 'hidden'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

// Botão com Micro-interactions
export const InteractiveButton: React.FC<ButtonInteractionProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ripple = true,
  feedback = true
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const unbColors = getUnbColors();

  const getSizeConfig = () => {
    switch (size) {
      case 'small': return { padding: '8px 16px', fontSize: '0.875rem', minHeight: '36px' };
      case 'large': return { padding: '16px 32px', fontSize: '1.125rem', minHeight: '52px' };
      default: return { padding: '12px 24px', fontSize: '1rem', minHeight: '44px' };
    }
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: unbColors.primary,
          color: 'white',
          border: unbColors.primary,
          hoverBg: '#1d4ed8'
        };
      case 'secondary':
        return {
          bg: 'transparent',
          color: unbColors.primary,
          border: unbColors.primary,
          hoverBg: unbColors.alpha.primary
        };
      case 'success':
        return {
          bg: '#22c55e',
          color: 'white',
          border: '#22c55e',
          hoverBg: '#16a34a'
        };
      case 'warning':
        return {
          bg: '#f59e0b',
          color: 'white',
          border: '#f59e0b',
          hoverBg: '#d97706'
        };
      case 'error':
        return {
          bg: '#dc2626',
          color: 'white',
          border: '#dc2626',
          hoverBg: '#b91c1c'
        };
      case 'medical':
        return {
          bg: '#0ea5e9',
          color: 'white',
          border: '#0ea5e9',
          hoverBg: '#0284c7'
        };
      default:
        return {
          bg: '#64748b',
          color: 'white',
          border: '#64748b',
          hoverBg: '#475569'
        };
    }
  };

  const sizeConfig = getSizeConfig();
  const variantConfig = getVariantConfig();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Ripple effect
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { x, y, id: Date.now() };

      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Feedback visual
    if (feedback) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
    }

    onClick?.();
  };

  return (
    <button
      className={`interactive-button ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        position: 'relative',
        background: disabled ? '#e2e8f0' : variantConfig.bg,
        color: disabled ? '#94a3b8' : variantConfig.color,
        border: `2px solid ${disabled ? '#e2e8f0' : variantConfig.border}`,
        borderRadius: '8px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isPressed ? 'scale(0.98) translateY(1px)' : 'scale(1)',
        boxShadow: isPressed ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...sizeConfig
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantConfig.hoverBg;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantConfig.bg;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      
      {children}

      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '0',
            height: '0',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out forwards'
          }}
        />
      ))}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes ripple {
          to {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .interactive-button {
            transition: none !important;
            transform: none !important;
          }
          
          .interactive-button span {
            animation: none !important;
          }
        }
      `}</style>
    </button>
  );
};

// Hover Card com informações contextuais
export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  content,
  delay = 500,
  position = 'top',
  medical = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showCard = useCallback(() => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  }, [delay]);

  const hideCard = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  }, [timeoutId]);

  const getPositionStyles = () => {
    const base = {
      position: 'absolute' as const,
      zIndex: 1000,
      background: medical ? '#f0f9ff' : 'white',
      border: `1px solid ${medical ? '#0ea5e9' : '#e2e8f0'}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontSize: '0.875rem',
      maxWidth: '300px',
      transform: 'translateX(-50%)',
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' as const : 'hidden' as const,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    switch (position) {
      case 'top':
        return { ...base, bottom: '100%', left: '50%', marginBottom: '8px' };
      case 'bottom':
        return { ...base, top: '100%', left: '50%', marginTop: '8px' };
      case 'left':
        return { ...base, right: '100%', top: '50%', marginRight: '8px', transform: 'translateY(-50%)' };
      case 'right':
        return { ...base, left: '100%', top: '50%', marginLeft: '8px', transform: 'translateY(-50%)' };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={showCard}
      onMouseLeave={hideCard}
      onFocus={showCard}
      onBlur={hideCard}
    >
      {children}
      
      <div style={getPositionStyles()}>
        {medical && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#0ea5e9'
          }}>
            ⚕️ Informação Médica
          </div>
        )}
        {content}
      </div>
    </div>
  );
};

// Success Celebration Animation
export const SuccessCelebration: React.FC<{
  trigger: boolean;
  message?: string;
  onComplete?: () => void;
}> = ({ trigger, message = 'Sucesso!', onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isAnimating) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 2000,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '32px',
      borderRadius: '16px',
      textAlign: 'center',
      animation: 'celebrate 2s ease-in-out forwards'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'bounce 1s ease-in-out infinite' }}>
        🎉
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
        {message}
      </div>

      <style jsx>{`
        @keyframes celebrate {
          0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.5); 
          }
          20% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.1); 
          }
          100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(1); 
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { 
            transform: translateY(0); 
          }
          40% { 
            transform: translateY(-10px); 
          }
          60% { 
            transform: translateY(-5px); 
          }
        }
      `}</style>
    </div>
  );
};

// Focus Ring Enhanced
export const FocusRing: React.FC<{
  children: React.ReactNode;
  medical?: boolean;
}> = ({ children, medical = false }) => {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px'
      }}
      className="focus-ring-container"
    >
      {children}
      
      <style jsx>{`
        .focus-ring-container:focus-within {
          outline: 2px solid ${medical ? '#0ea5e9' : '#3b82f6'};
          outline-offset: 2px;
          box-shadow: 0 0 0 4px ${medical ? 'rgba(14, 165, 233, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
          transition: box-shadow 0.2s ease;
        }
      `}</style>
    </div>
  );
};