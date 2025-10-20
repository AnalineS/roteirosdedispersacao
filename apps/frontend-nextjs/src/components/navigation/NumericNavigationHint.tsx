'use client';

import React, { useState, useEffect } from 'react';
import { modernChatTheme } from '@/config/modernTheme';
import { useNumericNavigation } from '@/hooks/useNumericNavigation';

interface NumericNavigationHintProps {
  visible?: boolean;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showOnlyWhenActive?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function NumericNavigationHint({
  visible = true,
  position = 'bottom-right',
  showOnlyWhenActive = false,
  autoHide = true,
  autoHideDelay = 5000
}: NumericNavigationHintProps): React.JSX.Element | null {
  
  const [isVisible, setIsVisible] = useState(!autoHide);
  const [isMinimized, setIsMinimized] = useState(false);
  const { availableRoutes } = useNumericNavigation({ enabled: false });

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && visible) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, visible]);

  // Show on key activity
  useEffect(() => {
    if (showOnlyWhenActive) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (/^[1-9]$/.test(e.key) && !isVisible) {
          setIsVisible(true);
          if (autoHide) {
            setTimeout(() => setIsVisible(false), autoHideDelay);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showOnlyWhenActive, isVisible, autoHide, autoHideDelay]);

  if (!visible || !isVisible) return null;

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: modernChatTheme.borderRadius.lg,
      boxShadow: modernChatTheme.shadows.floating,
      border: '1px solid rgba(148, 163, 184, 0.2)',
      transition: 'all 0.3s ease',
      transform: isMinimized ? 'scale(0.8)' : 'scale(1)',
      opacity: isMinimized ? 0.7 : 1
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '80px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '80px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  if (isMinimized) {
    return (
      <div style={getPositionStyles()}>
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '12px',
            cursor: 'pointer',
            borderRadius: modernChatTheme.borderRadius.lg,
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
          title="Expandir navegação numérica"
        >
          🔢
        </button>
      </div>
    );
  }

  return (
    <div style={getPositionStyles()}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <span>⌨️</span>
          Navegação Numérica
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
            title="Minimizar"
          >
            −
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      {/* Navigation Options */}
      <div style={{
        padding: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gap: '8px',
          minWidth: '280px'
        }}>
          {availableRoutes.map((route) => (
            <div
              key={route.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: modernChatTheme.borderRadius.md,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
              }}
            >
              {/* Key Badge */}
              <div style={{
                background: '#3b82f6',
                color: 'white',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {route.key}
              </div>

              {/* Route Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {route.title}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {route.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Hint */}
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: modernChatTheme.borderRadius.md,
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          💡 Pressione qualquer tecla numérica (1-9) para navegar rapidamente
        </div>
      </div>
    </div>
  );
}