'use client';

import React from 'react';
import { theme } from '@/config/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  inline?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = theme.colors.primary[500],
  message,
  inline = false
}) => {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  const containerStyle: React.CSSProperties = {
    display: inline ? 'inline-flex' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...(!inline && {
      minHeight: '40px',
      padding: '8px'
    })
  };

  const spinnerStyle: React.CSSProperties = {
    width: sizes[size],
    height: sizes[size],
    border: `2px solid ${color}20`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={containerStyle}>
        <div style={spinnerStyle} />
        {message && (
          <span style={{ 
            fontSize: '0.9rem', 
            color: theme.colors.neutral[600],
            fontWeight: 500
          }}>
            {message}
          </span>
        )}
      </div>
    </>
  );
};

// Componentes de loading específicos para cada contexto
export const ChatComponentLoader: React.FC<{ message?: string }> = ({ 
  message = "Carregando..." 
}) => (
  <LoadingSpinner size="small" message={message} inline />
);

export const ContentLoader: React.FC = () => (
  <div style={{
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: '8px'
  }}>
    <LoadingSpinner size="medium" message="Carregando histórico..." />
  </div>
);

// Alias para compatibilidade (sidebar foi removido)
export const SidebarLoader = ContentLoader;

export const IndicatorLoader: React.FC = () => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '12px',
    backgroundColor: theme.colors.neutral[100],
    border: `1px solid ${theme.colors.neutral[200]}`
  }}>
    <LoadingSpinner size="small" inline />
    <span style={{ 
      fontSize: '0.75rem', 
      color: theme.colors.neutral[600] 
    }}>
      ...
    </span>
  </div>
);

export default LoadingSpinner;