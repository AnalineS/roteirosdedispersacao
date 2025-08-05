'use client';

import React, { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

interface BaseProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
}

interface ButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button';
  href?: never;
}

interface LinkProps extends BaseProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  as: 'a';
  href: string;
}

type AccessibleButtonProps = ButtonProps | LinkProps;

/**
 * Botão acessível que garante navegação por teclado e padrões WCAG
 */
export const AccessibleButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, AccessibleButtonProps>(
  (props, ref) => {
    const {
      children,
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      loadingText = 'Carregando...',
      iconLeft,
      iconRight,
      className = '',
      disabled,
      ...rest
    } = props;

    // Estilo base
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      border: 'none',
      borderRadius: '8px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      fontWeight: '500',
      outline: 'none',
      position: 'relative' as const,
      minHeight: '44px', // Touch target mínimo
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto'
    };

    // Variantes de cor
    const variants = {
      primary: {
        backgroundColor: '#2563eb',
        color: 'white',
        border: '2px solid #2563eb',
        ':hover': {
          backgroundColor: '#1d4ed8'
        },
        ':focus': {
          outline: '2px solid #60a5fa',
          outlineOffset: '2px'
        }
      },
      secondary: {
        backgroundColor: 'white',
        color: '#2563eb',
        border: '2px solid #2563eb',
        ':focus': {
          outline: '2px solid #60a5fa',
          outlineOffset: '2px'
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#374151',
        border: '2px solid transparent',
        ':focus': {
          outline: '2px solid #9ca3af',
          outlineOffset: '2px'
        }
      },
      danger: {
        backgroundColor: '#dc2626',
        color: 'white',
        border: '2px solid #dc2626',
        ':focus': {
          outline: '2px solid #f87171',
          outlineOffset: '2px'
        }
      }
    };

    // Tamanhos
    const sizes = {
      small: {
        padding: '6px 12px',
        fontSize: '14px'
      },
      medium: {
        padding: '10px 16px',
        fontSize: '16px'
      },
      large: {
        padding: '12px 20px',
        fontSize: '18px'
      }
    };

    const buttonStyle = {
      ...baseStyles,
      ...variants[variant],
      ...sizes[size]
    };

    const buttonClassName = `accessible-button ${className}`.trim();

    // Handlers para acessibilidade
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Enter e Space ativam o botão
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled && !loading) {
          const target = e.currentTarget as HTMLElement;
          target.click();
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
    };

    // Renderizar conteúdo
    const content = (
      <>
        {loading && (
          <span 
            role="status" 
            aria-label={loadingText}
            style={{ 
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        )}
        {!loading && iconLeft && <span aria-hidden="true">{iconLeft}</span>}
        <span>{loading ? loadingText : children}</span>
        {!loading && iconRight && <span aria-hidden="true">{iconRight}</span>}
        
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .accessible-button:focus {
            outline: 2px solid #60a5fa !important;
            outline-offset: 2px !important;
          }
          .accessible-button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </>
    );

    if (props.as === 'a' && props.href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={disabled || loading ? undefined : props.href}
          className={buttonClassName}
          style={buttonStyle}
          aria-disabled={disabled || loading}
          role="button"
          tabIndex={disabled || loading ? -1 : 0}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={buttonClassName}
        style={buttonStyle}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;