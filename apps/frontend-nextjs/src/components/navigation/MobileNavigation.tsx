'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CloseIcon,
  ChevronDownIcon,
  getIconByEmoji
} from '@/components/icons/NavigationIcons';
import { getUnbColors } from '@/config/modernTheme';
import { useProgressData } from './Progress';
import { NavigationCategory } from './NavigationHeader';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NavigationCategory[];
  currentPersona?: any;
  isActive: (href: string) => boolean;
}

export default function MobileNavigation({ 
  isOpen, 
  onClose, 
  categories, 
  currentPersona,
  isActive 
}: MobileNavigationProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const unbColors = getUnbColors();
  const progressData = useProgressData();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['learning', 'interaction']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fechar menu ao navegar
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]);

  // Controle de scroll do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstFocusable = menuRef.current.querySelector('button, a') as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return unbColors.secondary;
    }
  };

  const getLevelLabel = (level?: string) => {
    switch (level) {
      case 'beginner': return 'Básico';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1050,
          animation: 'fadeInOverlay 300ms ease'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Slide */}
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação mobile"
        aria-labelledby="mobile-menu-title"
        id="mobile-navigation-menu"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
          // Trap focus within dialog
          if (e.key === 'Tab') {
            const focusableElements = menuRef.current?.querySelectorAll(
              'button, a, input, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements?.[0] as HTMLElement;
            const lastFocusable = focusableElements?.[focusableElements.length - 1] as HTMLElement;
            
            if (e.shiftKey && document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable?.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable?.focus();
            }
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '320px',
          maxWidth: '90vw',
          height: '100vh',
          background: unbColors.gradients.primary,
          color: unbColors.white,
          zIndex: 1051,
          overflowY: 'auto',
          animation: 'slideInRight 300ms ease',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div>
            <h2 
              id="mobile-menu-title"
              style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}
            >
              Menu de Navegação
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              opacity: 0.8
            }}>
              Sistema Educacional PQT-U
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid transparent',
              color: unbColors.white,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onFocus={(e) => { 
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.border = `2px solid ${unbColors.white}`;
            }}
            onBlur={(e) => { 
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.border = '2px solid transparent';
            }}
            aria-label="Fechar menu de navegação"
          >
            <CloseIcon size={20} color={unbColors.white} />
          </button>
        </div>

        {/* Persona Atual */}
        {currentPersona && (
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{currentPersona.avatar}</span>
              <div>
                <div style={{ 
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginBottom: '2px'
                }}>
                  {currentPersona.name}
                </div>
                <div style={{ 
                  fontSize: '0.8rem',
                  opacity: 0.8
                }}>
                  {currentPersona.personality}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav 
          style={{ padding: '16px 0' }} 
          role="navigation"
          aria-label="Categorias de navegação"
        >
          {categories.map((category) => (
            <div key={category.id} style={{ marginBottom: '4px' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '2px solid transparent',
                  color: unbColors.white,
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 200ms ease',
                  textAlign: 'left',
                  minHeight: '44px',
                  outline: 'none'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                onFocus={(e) => { 
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.border = `2px solid ${unbColors.white}`;
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.border = '2px solid transparent';
                }}
                aria-expanded={expandedCategories.has(category.id)}
                aria-label={`${expandedCategories.has(category.id) ? 'Recolher' : 'Expandir'} categoria ${category.label}: ${category.description}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
                  <span>{category.label}</span>
                </div>
                <ChevronDownIcon 
                  size={16} 
                  color={unbColors.white}
                  style={{
                    transform: expandedCategories.has(category.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease'
                  }}
                />
              </button>

              {/* Category Items */}
              {expandedCategories.has(category.id) && (
                <div style={{ background: 'rgba(0,0,0,0.1)' }}>
                  {category.items.map((item) => (
                    <div key={item.id}>
                      {/* Main Item */}
                      <div style={{ display: 'flex', alignItems: 'stretch' }}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          style={{
                            flex: 1,
                            display: 'flex',
                            padding: '12px 20px 12px 40px',
                            color: unbColors.white,
                            textDecoration: 'none',
                            borderLeft: isActive(item.href) ? '3px solid white' : '3px solid transparent',
                            background: isActive(item.href) ? 'rgba(255,255,255,0.15)' : 'transparent',
                            transition: 'all 200ms ease',
                            minHeight: '44px',
                            alignItems: 'center',
                            outline: 'none',
                            borderTop: '2px solid transparent',
                            borderBottom: '2px solid transparent'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive(item.href)) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive(item.href)) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderTop = `2px solid ${unbColors.white}`;
                            e.currentTarget.style.borderBottom = `2px solid ${unbColors.white}`;
                          }}
                          onBlur={(e) => {
                            if (!isActive(item.href)) {
                              e.currentTarget.style.background = 'transparent';
                            }
                            e.currentTarget.style.borderTop = '2px solid transparent';
                            e.currentTarget.style.borderBottom = '2px solid transparent';
                          }}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                          aria-describedby={`mobile-item-${item.id}-desc`}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '4px'
                          }}>
                            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: isActive(item.href) ? 'bold' : 'normal',
                                fontSize: '0.95rem',
                                marginBottom: '2px'
                              }}>
                                {item.label}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                opacity: 0.7,
                                lineHeight: '1.2'
                              }}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                          
                          {/* Meta Information */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '6px',
                            paddingLeft: '26px'
                          }}>
                            {item.level && (
                              <span style={{
                                background: getLevelColor(item.level),
                                color: 'white',
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                {getLevelLabel(item.level)}
                              </span>
                            )}
                            {item.estimatedTime && (
                              <span style={{
                                fontSize: '0.7rem',
                                opacity: 0.6
                              }}>
                                ⏱️ {item.estimatedTime}
                              </span>
                            )}
                            {item.completionRate !== undefined && (
                              <span style={{
                                fontSize: '0.7rem',
                                opacity: 0.6
                              }}>
                                📊 {item.completionRate}%
                              </span>
                            )}
                          </div>
                        </Link>
                        
                        {/* Expand/Collapse SubItems */}
                        {item.subItems && item.subItems.length > 0 && (
                          <button
                            onClick={() => toggleItem(item.id)}
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              border: '2px solid transparent',
                              color: unbColors.white,
                              width: '44px',
                              minHeight: '44px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 200ms ease',
                              outline: 'none'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                              e.currentTarget.style.border = `2px solid ${unbColors.white}`;
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                              e.currentTarget.style.border = '2px solid transparent';
                            }}
                            aria-expanded={expandedItems.has(item.id)}
                            aria-label={`${expandedItems.has(item.id) ? 'Recolher' : 'Expandir'} subitens de ${item.label}`}
                          >
                            {expandedItems.has(item.id) ? '−' : '+'}
                          </button>
                        )}
                      </div>

                      {/* Sub Items */}
                      {item.subItems && expandedItems.has(item.id) && (
                        <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.id}
                              href={subItem.href}
                              onClick={onClose}
                              style={{
                                display: 'block',
                                padding: '10px 20px 10px 60px',
                                color: unbColors.white,
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                opacity: isActive(subItem.href) ? 1 : 0.8,
                                background: isActive(subItem.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderLeft: isActive(subItem.href) ? '2px solid white' : '2px solid transparent',
                                transition: 'all 200ms ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive(subItem.href)) {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive(subItem.href)) {
                                  e.currentTarget.style.opacity = '0.8';
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ fontSize: '0.9rem' }}>{subItem.icon}</span>
                                <div>
                                  <div style={{ fontWeight: isActive(subItem.href) ? 'bold' : 'normal' }}>
                                    {subItem.label}
                                  </div>
                                  <div style={{
                                    fontSize: '0.7rem',
                                    opacity: 0.6,
                                    marginTop: '1px'
                                  }}>
                                    {subItem.description}
                                  </div>
                                  {subItem.estimatedTime && (
                                    <div style={{
                                      fontSize: '0.65rem',
                                      opacity: 0.5,
                                      marginTop: '2px'
                                    }}>
                                      ⏱️ {subItem.estimatedTime}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Progress Summary */}
        <div style={{
          margin: '16px 20px',
          padding: '16px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h4 style={{
            margin: '0 0 12px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: unbColors.white,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Progresso Geral
          </h4>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: unbColors.white,
            marginBottom: '6px'
          }}>
            {progressData.overallCompletionRate}%
          </div>
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.8,
            marginBottom: '12px'
          }}>
            {progressData.completedModules}/{progressData.totalModules} módulos completos
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            opacity: 0.8
          }}>
            <span>🔥 {progressData.currentStreak} dias</span>
            <span>•</span>
            <span>⏱️ {progressData.totalTimeSpent}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.7
          }}>
            <p style={{ margin: '0 0 4px' }}>Sistema Educacional</p>
            <p style={{ margin: '0 0 4px' }}>Hanseníase PQT-U</p>
            <p style={{ margin: 0, fontSize: '0.7rem' }}>v2.0 - Mobile</p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}