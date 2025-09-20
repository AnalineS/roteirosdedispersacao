'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalNavigation } from './GlobalNavigationProvider';
import { useFloatingElement } from './FloatingElementsCoordinator';
import { useNavigationVisibility } from './SmartNavigationSystem';
import { getUnbColors } from '@/config/modernTheme';

interface QuickNavigationMenuProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
  className?: string;
  showOnMobile?: boolean;
}

export default function QuickNavigationMenu({ 
  position = 'bottom-right',
  className = '',
  showOnMobile = true 
}: QuickNavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { getNavigationOptions } = useGlobalNavigation();
  const shouldShow = useNavigationVisibility('quick-nav-fab');
  const { optimalPosition, updateVisibility } = useFloatingElement(
    'quick-nav-fab',
    position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    3, // Priority
    'medium'
  );
  const unbColors = getUnbColors();

  // Atualizar visibilidade no coordenador
  useEffect(() => {
    updateVisibility(shouldShow && pathname !== '/');
  }, [shouldShow, pathname, updateVisibility]);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fechar menu com ESC
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen]);

  const navigationOptions = getNavigationOptions();

  // Não mostrar se sistema inteligente decidir que não deve
  if (!shouldShow) {
    return null;
  }

  // Não mostrar em mobile se desabilitado
  if (isMobile && !showOnMobile) {
    return null;
  }

  // Ocultar na página inicial para não duplicar navegação
  if (pathname === '/') {
    return null;
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1050,
    };

    // Usar posição otimizada do coordenador
    switch (optimalPosition) {
      case 'top-right':
        return { ...baseStyles, top: '100px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '100px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  return (
    <div 
      ref={menuRef}
      className={`quick-navigation-menu ${className}`}
      style={getPositionStyles()}
    >
      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-label={isOpen ? 'Fechar menu de navegação rápida' : 'Abrir menu de navegação rápida'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 3px ${unbColors.alpha.primary}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1)' : 'rotate(0deg) scale(1)';
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          </svg>
        )}
      </button>

      {/* Navigation Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Menu de navegação rápida"
          style={{
            position: 'absolute',
            bottom: isMobile ? '70px' : '80px',
            right: 0,
            minWidth: isMobile ? '280px' : '320px',
            maxWidth: '90vw',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${unbColors.alpha.primary}`,
            overflow: 'hidden',
            animation: 'quickMenuSlideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px 12px',
            background: `linear-gradient(135deg, ${unbColors.primary}10 0%, ${unbColors.secondary}10 100%)`,
            borderBottom: `1px solid ${unbColors.alpha.primary}`
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: unbColors.neutral,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🧭 Navegação Rápida
            </h3>
            <p style={{
              margin: '4px 0 0',
              fontSize: '0.85rem',
              color: unbColors.neutral,
              opacity: 0.7
            }}>
              Acesse qualquer área do sistema
            </p>
          </div>

          {/* Navigation Options */}
          <div style={{ 
            maxHeight: isMobile ? '60vh' : '400px',
            overflowY: 'auto',
            padding: '8px'
          }}>
            {navigationOptions.map((option) => {
              const isCurrentPage = pathname === option.href;
              
              return (
                <Link
                  key={option.id}
                  href={option.href}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isCurrentPage ? unbColors.primary : unbColors.neutral,
                    background: isCurrentPage ? unbColors.alpha.primary : 'transparent',
                    transition: 'all 0.2s ease',
                    border: `2px solid transparent`,
                    margin: '2px 0',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentPage) {
                      e.currentTarget.style.background = unbColors.alpha.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentPage) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `2px solid ${unbColors.primary}`;
                    if (!isCurrentPage) {
                      e.currentTarget.style.background = unbColors.alpha.secondary;
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '2px solid transparent';
                    if (!isCurrentPage) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsOpen(false);
                    }
                  }}
                >
                  <span style={{ 
                    fontSize: '1.2rem',
                    width: '20px',
                    textAlign: 'center'
                  }}>
                    {option.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: isCurrentPage ? 'bold' : '500',
                      fontSize: '0.95rem',
                      marginBottom: '2px'
                    }}>
                      {option.label}
                      {isCurrentPage && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          background: unbColors.primary,
                          color: 'white',
                          borderRadius: '10px'
                        }}>
                          atual
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      opacity: 0.7,
                      lineHeight: '1.3'
                    }}>
                      {option.description}
                    </div>
                  </div>
                  
                  {/* Public indicator */}
                  {option.isPublic && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '10px'
                    }}>
                      público
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            background: unbColors.alpha.secondary,
            borderTop: `1px solid ${unbColors.alpha.primary}`,
            textAlign: 'center'
          }}>
            <Link
              href="/sitemap"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '0.85rem',
                color: unbColors.primary,
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              🗺️ Ver mapa completo do site
            </Link>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes quickMenuSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}