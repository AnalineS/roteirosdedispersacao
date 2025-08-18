'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getUnbColors } from '@/config/modernTheme';

interface StandardizedButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
  preventDoubleClick?: boolean;
  showRipple?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  'aria-label'?: string;
  title?: string;
}

export default function StandardizedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  style = {},
  preventDoubleClick = true,
  showRipple = true,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  'aria-label': ariaLabel,
  title
}: StandardizedButtonProps) {
  const unbColors = getUnbColors();
  const [isClicked, setIsClicked] = useState(false);
  const [ripples, setRipples] = useState<Array<{id: number; x: number; y: number}>>([]);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();

  // Prevenir double-click
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (preventDoubleClick && isClicked) {
      e.preventDefault();
      return;
    }

    if (preventDoubleClick) {
      setIsClicked(true);
      clickTimeoutRef.current = setTimeout(() => {
        setIsClicked(false);
      }, 1000);
    }

    // Ripple effect
    if (showRipple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    if (onClick) {
      try {
        await onClick(e);
      } catch (error) {
        console.error('Erro ao executar ação do botão:', error);
      } finally {
        if (preventDoubleClick) {
          setIsClicked(false);
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
          }
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Estilos padronizados para cada variante
  const getVariantStyles = () => {
    const baseStyles = {
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      textDecoration: 'none',
      userSelect: 'none' as const,
      opacity: disabled ? 0.6 : 1
    };

    const sizeStyles = {
      sm: { padding: '0.5rem 1rem', fontSize: '0.8rem', minHeight: '32px' },
      md: { padding: '0.75rem 1.5rem', fontSize: '0.9rem', minHeight: '40px' },
      lg: { padding: '1rem 2rem', fontSize: '1rem', minHeight: '48px' }
    };

    const variantStyles = {
      primary: {
        background: loading ? '#94a3b8' : (isHovered ? unbColors.secondary : unbColors.primary),
        color: 'white',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${loading ? '#94a3b8' : (isHovered ? unbColors.secondary : unbColors.primary)}`
      },
      secondary: {
        background: loading ? '#f1f5f9' : (isHovered ? '#f1f5f9' : '#f8fafc'),
        color: loading ? '#94a3b8' : unbColors.primary,
        border: `2px solid ${loading ? '#cbd5e1' : (isHovered ? unbColors.alpha.primary : '#e2e8f0')}`,
        boxShadow: isHovered ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
      },
      outline: {
        background: isHovered ? unbColors.alpha.primary : 'transparent',
        color: loading ? '#94a3b8' : unbColors.primary,
        border: `2px solid ${loading ? '#cbd5e1' : unbColors.primary}`,
        boxShadow: isHovered ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
      },
      ghost: {
        background: isHovered ? '#f3f4f6' : 'transparent',
        color: loading ? '#94a3b8' : '#374151',
        border: '2px solid transparent',
        boxShadow: 'none'
      },
      danger: {
        background: loading ? '#fca5a5' : (isHovered ? '#dc2626' : '#ef4444'),
        color: 'white',
        border: `2px solid ${loading ? '#fca5a5' : (isHovered ? '#dc2626' : '#ef4444')}`,
        boxShadow: isHovered ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(239, 68, 68, 0.2)'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? '100%' : 'auto'
    };
  };

  const buttonStyles = getVariantStyles();

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      className={`standardized-button ${className}`}
      style={{ ...buttonStyles, ...style }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={ariaLabel}
      title={title}
    >
      {/* Loading Spinner */}
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid transparent',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '0.5rem'
          }}
        />
      )}

      {/* Icon Left */}
      {icon && iconPosition === 'left' && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}

      {/* Content */}
      <span style={{ 
        opacity: loading ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {children}
      </span>

      {/* Icon Right */}
      {icon && iconPosition === 'right' && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}

      {/* Ripple Effects */}
      {showRipple && ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '4px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s linear',
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(40);
            opacity: 0;
          }
        }
        
        .standardized-button:focus-visible {
          outline: 2px solid ${unbColors.primary};
          outline-offset: 2px;
        }
        
        .standardized-button:active {
          transform: scale(0.98);
        }
      `}</style>
    </button>
  );
}

// Hook para gerenciar estado de loading de botões
export function useButtonLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (buttonId: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [buttonId]: isLoading
    }));
  };

  const isLoading = (buttonId: string) => {
    return loadingStates[buttonId] || false;
  };

  const withLoading = async (buttonId: string, action: () => Promise<void>) => {
    try {
      setLoading(buttonId, true);
      await action();
    } catch (error) {
      console.error(`Erro na ação do botão ${buttonId}:`, error);
      throw error;
    } finally {
      setLoading(buttonId, false);
    }
  };

  return {
    setLoading,
    isLoading,
    withLoading
  };
}