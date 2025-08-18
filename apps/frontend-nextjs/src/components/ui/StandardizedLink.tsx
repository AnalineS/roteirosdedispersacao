'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';

interface StandardizedLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'muted' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  underline?: 'none' | 'hover' | 'always';
  external?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  'aria-label'?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function StandardizedLink({
  href,
  children,
  variant = 'default',
  size = 'md',
  underline = 'hover',
  external = false,
  className = '',
  style = {},
  icon,
  iconPosition = 'right',
  'aria-label': ariaLabel,
  title,
  onClick
}: StandardizedLinkProps) {
  const unbColors = getUnbColors();
  const [isHovered, setIsHovered] = useState(false);

  // Estilos padronizados para cada variante
  const getVariantStyles = () => {
    const baseStyles = {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      outline: 'none',
      borderRadius: '4px',
      padding: '0.125rem 0.25rem',
      margin: '-0.125rem -0.25rem',
      textDecoration: 'none'
    };

    const sizeStyles = {
      sm: { fontSize: '0.8rem', gap: '0.25rem' },
      md: { fontSize: '0.9rem', gap: '0.375rem' },
      lg: { fontSize: '1rem', gap: '0.5rem' }
    };

    const variantStyles = {
      default: {
        color: isHovered ? unbColors.secondary : unbColors.primary,
        textDecoration: underline === 'always' ? 'underline' : 
                       underline === 'hover' && isHovered ? 'underline' : 'none'
      },
      primary: {
        color: isHovered ? unbColors.secondary : unbColors.primary,
        fontWeight: '600',
        textDecoration: underline === 'always' ? 'underline' : 
                       underline === 'hover' && isHovered ? 'underline' : 'none'
      },
      secondary: {
        color: isHovered ? '#4b5563' : '#6b7280',
        textDecoration: underline === 'always' ? 'underline' : 
                       underline === 'hover' && isHovered ? 'underline' : 'none'
      },
      muted: {
        color: isHovered ? '#6b7280' : '#9ca3af',
        textDecoration: underline === 'always' ? 'underline' : 
                       underline === 'hover' && isHovered ? 'underline' : 'none'
      },
      danger: {
        color: isHovered ? '#dc2626' : '#ef4444',
        textDecoration: underline === 'always' ? 'underline' : 
                       underline === 'hover' && isHovered ? 'underline' : 'none'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  const linkStyles = getVariantStyles();

  const LinkContent = () => (
    <>
      {/* Icon Left */}
      {icon && iconPosition === 'left' && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'translateX(-1px)' : 'translateX(0)'
        }}>
          {icon}
        </span>
      )}

      {/* Content */}
      <span>{children}</span>

      {/* Icon Right */}
      {icon && iconPosition === 'right' && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'translateX(1px)' : 'translateX(0)'
        }}>
          {icon}
        </span>
      )}

      {/* External Link Icon */}
      {external && !icon && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: '0.7em',
          opacity: 0.7,
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'translateX(1px) translateY(-1px)' : 'translateX(0)'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </span>
      )}
    </>
  );

  const commonProps = {
    className: `standardized-link ${className}`,
    style: { ...linkStyles, ...style },
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onFocus: () => setIsHovered(true),
    onBlur: () => setIsHovered(false),
    'aria-label': ariaLabel,
    title: title,
    onClick: onClick
  };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...commonProps}
      >
        <LinkContent />
        
        {/* CSS para focus visible */}
        <style jsx>{`
          .standardized-link:focus-visible {
            outline: 2px solid ${unbColors.primary};
            outline-offset: 2px;
            border-radius: 4px;
          }
        `}</style>
      </a>
    );
  }

  return (
    <Link href={href} {...commonProps}>
      <LinkContent />
      
      {/* CSS para focus visible */}
      <style jsx>{`
        .standardized-link:focus-visible {
          outline: 2px solid ${unbColors.primary};
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </Link>
  );
}

// Componente para links de navegação com estados ativos
interface NavigationLinkProps extends Omit<StandardizedLinkProps, 'variant'> {
  active?: boolean;
  variant?: 'tab' | 'sidebar' | 'breadcrumb';
}

export function NavigationLink({
  active = false,
  variant = 'tab',
  ...props
}: NavigationLinkProps) {
  const unbColors = getUnbColors();
  
  const variantStyles = {
    tab: {
      padding: '0.75rem 1rem',
      borderBottom: active ? `2px solid ${unbColors.primary}` : '2px solid transparent',
      background: active ? unbColors.alpha.primary : 'transparent',
      color: active ? unbColors.primary : '#6b7280',
      fontWeight: active ? '600' : '500'
    },
    sidebar: {
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      background: active ? unbColors.alpha.primary : 'transparent',
      color: active ? unbColors.primary : '#374151',
      fontWeight: active ? '600' : '500'
    },
    breadcrumb: {
      padding: '0.25rem 0.5rem',
      color: active ? unbColors.primary : '#6b7280',
      fontWeight: active ? '600' : '400'
    }
  };

  return (
    <StandardizedLink
      {...props}
      variant="default"
      style={{
        ...variantStyles[variant],
        ...props.style
      }}
    />
  );
}