'use client';

import React from 'react';

interface IndexIndicatorProps {
  index: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circle' | 'square' | 'badge' | 'step';
  showLabel?: boolean;
  label?: string;
  active?: boolean;
  completed?: boolean;
}

/**
 * Componente de Indicador de Índice Reutilizável
 * Ativa todos os índices não utilizados transformando-os em indicadores visuais
 */
export const IndexIndicator: React.FC<IndexIndicatorProps> = ({
  index,
  color = '#003366',
  size = 'medium',
  variant = 'circle',
  showLabel = false,
  label,
  active = false,
  completed = false
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '20px', height: '20px', fontSize: '0.75rem' };
      case 'large':
        return { width: '36px', height: '36px', fontSize: '1.1rem' };
      default:
        return { width: '28px', height: '28px', fontSize: '0.9rem' };
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
      ...getSizeStyles()
    };

    switch (variant) {
      case 'square':
        return {
          ...baseStyles,
          borderRadius: '4px',
          background: completed ? '#10b981' : active ? color : `${color}20`,
          color: completed || active ? 'white' : color,
          border: `2px solid ${completed ? '#10b981' : color}`
        };
      
      case 'badge':
        return {
          ...baseStyles,
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: 'none'
        };
      
      case 'step':
        return {
          ...baseStyles,
          borderRadius: '50%',
          background: completed ? '#10b981' : active ? color : 'white',
          color: completed || active ? 'white' : color,
          border: `3px solid ${completed ? '#10b981' : active ? color : '#e5e7eb'}`,
          position: 'relative' as const
        };
      
      default: // circle
        return {
          ...baseStyles,
          borderRadius: '50%',
          background: completed ? '#10b981' : active ? color : `${color}15`,
          color: completed || active ? 'white' : color,
          border: completed ? 'none' : `2px solid ${color}`
        };
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div style={getVariantStyles()}>
        {completed ? '✓' : index}
      </div>
      {showLabel && label && (
        <span style={{
          fontSize: size === 'small' ? '0.85rem' : '0.95rem',
          color: active ? color : '#6b7280',
          fontWeight: active ? '600' : '400'
        }}>
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Componente de Lista com Índices Visuais
 * Ativa índices em listas de forma automática
 */
export const IndexedList: React.FC<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  color?: string;
  variant?: 'circle' | 'square' | 'badge' | 'step';
  activeIndex?: number;
  completedIndices?: number[];
}> = ({
  items,
  renderItem,
  color = '#003366',
  variant = 'circle',
  activeIndex,
  completedIndices = []
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <IndexIndicator
            index={index + 1}
            color={color}
            variant={variant}
            active={activeIndex === index}
            completed={completedIndices.includes(index)}
          />
          <div style={{ flex: 1 }}>
            {renderItem(item, index)}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Componente de Progresso com Índices
 * Mostra progresso através de etapas numeradas
 */
export const IndexProgress: React.FC<{
  totalSteps: number;
  currentStep: number;
  labels?: string[];
  color?: string;
  showConnectors?: boolean;
}> = ({
  totalSteps,
  currentStep,
  labels = [],
  color = '#003366',
  showConnectors = true
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      padding: '20px 0'
    }}>
      {showConnectors && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '20px',
          right: '20px',
          height: '2px',
          background: '#e5e7eb',
          zIndex: 0
        }}>
          <div style={{
            height: '100%',
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            background: color,
            transition: 'width 0.5s ease'
          }} />
        </div>
      )}
      
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1,
            position: 'relative'
          }}
        >
          <IndexIndicator
            index={i + 1}
            color={color}
            variant="step"
            active={i + 1 === currentStep}
            completed={i + 1 < currentStep}
            size="large"
          />
          {labels[i] && (
            <span style={{
              fontSize: '0.75rem',
              color: i + 1 <= currentStep ? color : '#9ca3af',
              fontWeight: i + 1 === currentStep ? '600' : '400',
              whiteSpace: 'nowrap'
            }}>
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Componente de Paginação com Índices
 * Ativa índices para navegação entre páginas
 */
export const IndexPagination: React.FC<{
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  color?: string;
  maxVisible?: number;
}> = ({
  totalPages,
  currentPage,
  onPageChange,
  color = '#003366',
  maxVisible = 7
}) => {
  const getPageNumbers = () => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const leftBound = Math.max(1, currentPage - 2);
    const rightBound = Math.min(totalPages, currentPage + 2);

    if (leftBound > 2) {
      pages.push(1, '...');
    } else if (leftBound === 2) {
      pages.push(1);
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push('...', totalPages);
    } else if (rightBound === totalPages - 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{
          padding: '8px 12px',
          border: `1px solid ${color}`,
          background: 'white',
          color: color,
          borderRadius: '4px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        ←
      </button>
      
      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span style={{ padding: '0 8px', color: '#9ca3af' }}>...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${currentPage === page ? color : '#e5e7eb'}`,
                background: currentPage === page ? color : 'white',
                color: currentPage === page ? 'white' : color,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: currentPage === page ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 12px',
          border: `1px solid ${color}`,
          background: 'white',
          color: color,
          borderRadius: '4px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        →
      </button>
    </div>
  );
};

export default IndexIndicator;