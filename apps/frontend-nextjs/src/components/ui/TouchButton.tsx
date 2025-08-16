/**
 * Touch Button Component
 * Botão otimizado para touch com pelo menos 44px de área clicável
 * Inclui feedback visual e acessibilidade
 */

'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  
  const baseClasses = `
    relative
    inline-flex
    items-center
    justify-center
    font-medium
    text-center
    no-underline
    border
    border-transparent
    cursor-pointer
    select-none
    transition-all
    duration-200
    ease-in-out
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:cursor-not-allowed
    disabled:opacity-50
    active:transform
    active:scale-95
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-blue-600
      text-white
      border-blue-600
      hover:bg-blue-700
      hover:border-blue-700
      focus:ring-blue-500
      active:bg-blue-800
    `,
    secondary: `
      bg-gray-600
      text-white
      border-gray-600
      hover:bg-gray-700
      hover:border-gray-700
      focus:ring-gray-500
      active:bg-gray-800
    `,
    outline: `
      bg-white
      text-gray-700
      border-gray-300
      hover:bg-gray-50
      hover:border-gray-400
      focus:ring-gray-500
      active:bg-gray-100
    `,
    ghost: `
      bg-transparent
      text-gray-700
      border-transparent
      hover:bg-gray-100
      hover:border-gray-200
      focus:ring-gray-500
      active:bg-gray-200
    `,
    danger: `
      bg-red-600
      text-white
      border-red-600
      hover:bg-red-700
      hover:border-red-700
      focus:ring-red-500
      active:bg-red-800
    `
  };

  const sizeClasses = {
    sm: 'min-h-[44px] px-3 py-2 text-sm rounded-md',
    md: 'min-h-[48px] px-4 py-3 text-base rounded-lg',
    lg: 'min-h-[52px] px-6 py-4 text-lg rounded-xl'
  };

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      ref={ref}
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="animate-spin h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Button content */}
      <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {leftIcon && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        <span className="truncate">
          {children}
        </span>
        
        {rightIcon && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </span>
    </button>
  );
});

TouchButton.displayName = 'TouchButton';

// Icon Button variant - circular button optimized for single icons
interface IconButtonProps extends Omit<TouchButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const TouchIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  
  const sizeClasses = {
    sm: 'min-w-[44px] min-h-[44px] p-2',
    md: 'min-w-[48px] min-h-[48px] p-3', 
    lg: 'min-w-[52px] min-h-[52px] p-4'
  };

  return (
    <TouchButton
      ref={ref}
      variant={variant}
      size={size}
      className={`rounded-full ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
    </TouchButton>
  );
});

TouchIconButton.displayName = 'TouchIconButton';

// Button Group para ações relacionadas
interface TouchButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export function TouchButtonGroup({ 
  children, 
  orientation = 'horizontal',
  spacing = 'normal',
  className = ''
}: TouchButtonGroupProps) {
  
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  const spacingClasses = {
    tight: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
    normal: orientation === 'horizontal' ? 'gap-2' : 'gap-2', 
    loose: orientation === 'horizontal' ? 'gap-4' : 'gap-3'
  };

  return (
    <div className={`
      inline-flex
      ${orientationClasses[orientation]}
      ${spacingClasses[spacing]}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Floating Action Button para ações primárias
interface TouchFABProps extends Omit<TouchButtonProps, 'size' | 'children'> {
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  'aria-label': string;
}

export function TouchFAB({
  icon,
  position = 'bottom-right',
  className = '',
  ...props
}: TouchFABProps) {
  
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <TouchButton
      variant="primary"
      className={`
        min-w-[56px]
        min-h-[56px]
        rounded-full
        shadow-lg
        hover:shadow-xl
        z-50
        ${positionClasses[position]}
        ${className}
      `}
      {...props}
    >
      {icon}
    </TouchButton>
  );
}

export default TouchButton;