'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { NavigationCategory } from './index';
import ProgressIndicator from '../Progress/ProgressIndicator';
import { useProgressData } from '../Progress';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import Tooltip from '@/components/common/Tooltip';
import KeyboardShortcuts, { useKeyboardShortcuts } from '@/components/common/KeyboardShortcuts';
import { theme } from '@/config/theme';

interface DesktopSidebarProps {
  categories: NavigationCategory[];
  currentPersona?: any;
  isActive: (href: string) => boolean;
}

export default function DesktopSidebar({ categories, currentPersona, isActive }: DesktopSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['learning', 'interaction']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const progressData = useProgressData();
  const sidebarRef = useRef<HTMLElement>(null);
  const { isOpen: isShortcutsOpen, setIsOpen: setIsShortcutsOpen } = useKeyboardShortcuts();
  
  // Configurar navegação por teclado
  useKeyboardNavigation({
    containerRef: sidebarRef,
    enableArrowKeys: true,
    onEnter: (element) => {
      // Handle Enter key on focusable elements
      if (element.getAttribute('role') === 'button') {
        element.click();
      }
    }
  });

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
      case 'beginner': return theme.colors.educational.success;
      case 'intermediate': return theme.colors.educational.warning;
      case 'advanced': return theme.colors.educational.error;
      default: return theme.colors.primary[500];
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

  return (
    <nav
      ref={sidebarRef}
      role="navigation"
      aria-label="Educational navigation sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '320px',
        height: '100vh',
        background: theme.gradients.primary,
        color: 'white',
        overflowY: 'auto',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 999,
        transform: 'translate3d(0, 0, 0)', // GPU optimization
        willChange: 'transform' // Hint for browser optimization
      }}
    >
      {/* Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <Tooltip content="Sistema Educacional para Hanseníase PQT-U" position="right">
            <div style={{ fontSize: '1.8rem' }}>🏥</div>
          </Tooltip>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              PQT-U Educacional
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              opacity: 0.8
            }}>
              Sistema de Aprendizagem
            </p>
          </div>
          <Tooltip content="Pressione '?' para ver todos os atalhos de teclado" position="left">
            <button
              onClick={() => setIsShortcutsOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onFocus={(e) => { e.currentTarget.style.outline = '2px solid white'; }}
              onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
              aria-label="Mostrar atalhos de teclado"
            >
              ?
            </button>
          </Tooltip>
        </div>
        
        {currentPersona && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{currentPersona.avatar}</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                {currentPersona.name}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {currentPersona.personality}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Categories */}
      <div style={{ padding: '16px 0' }}>
        {categories.map((category) => (
          <div key={category.id} style={{ marginBottom: '8px' }}>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              role="button"
              aria-expanded={expandedCategories.has(category.id)}
              aria-controls={`category-${category.id}-items`}
              aria-label={`${expandedCategories.has(category.id) ? 'Collapse' : 'Expand'} ${category.label} category`}
              tabIndex={0}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                opacity: 0.9,
                transition: 'opacity 0.2s ease',
                transform: 'translate3d(0, 0, 0)', // GPU optimization
                willChange: 'opacity'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onFocus={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.outline = '2px solid white'; }}
              onBlur={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.outline = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tooltip content={category.description} position="right">
                  <span style={{ fontSize: '1rem' }}>{category.icon}</span>
                </Tooltip>
                <span>{category.label}</span>
              </div>
              <span style={{ fontSize: '0.8rem' }}>
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </span>
            </button>

            {/* Category Items */}
            {expandedCategories.has(category.id) && (
              <div 
                id={`category-${category.id}-items`}
                role="group"
                aria-labelledby={`category-${category.id}-header`}
                style={{ marginLeft: '8px' }}
              >
                {category.items.map((item) => (
                  <div key={item.id}>
                    {/* Main Item */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        tabIndex={0}
                        style={{
                          flex: 1,
                          display: 'block',
                          padding: '12px 16px 12px 32px',
                          color: 'white',
                          textDecoration: 'none',
                          borderLeft: isActive(item.href) ? '3px solid white' : '3px solid transparent',
                          background: isActive(item.href) ? 'rgba(255,255,255,0.15)' : 'transparent',
                          transition: 'all 0.2s ease',
                          borderRadius: '0 8px 8px 0',
                          margin: '0 8px 0 0',
                          transform: 'translate3d(0, 0, 0)', // GPU optimization
                          willChange: isActive(item.href) ? 'auto' : 'background-color, border-left'
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
                          if (!isActive(item.href)) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          }
                          e.currentTarget.style.outline = '2px solid white';
                        }}
                        onBlur={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.background = 'transparent';
                          }
                          e.currentTarget.style.outline = 'none';
                        }}
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
                          marginTop: '6px'
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
                          aria-expanded={expandedItems.has(item.id)}
                          aria-controls={`subitems-${item.id}`}
                          aria-label={`${expandedItems.has(item.id) ? 'Collapse' : 'Expand'} ${item.label} subitems`}
                          tabIndex={0}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            marginRight: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onFocus={(e) => { e.currentTarget.style.outline = '2px solid white'; }}
                          onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
                        >
                          {expandedItems.has(item.id) ? '−' : '+'}
                        </button>
                      )}
                    </div>

                    {/* Sub Items */}
                    {item.subItems && expandedItems.has(item.id) && (
                      <div 
                        id={`subitems-${item.id}`}
                        role="group"
                        aria-labelledby={`item-${item.id}-label`}
                        style={{ marginLeft: '20px', marginTop: '4px' }}
                      >
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.id}
                            href={subItem.href}
                            aria-current={isActive(subItem.href) ? 'page' : undefined}
                            tabIndex={0}
                            style={{
                              display: 'block',
                              padding: '8px 16px 8px 40px',
                              color: 'white',
                              textDecoration: 'none',
                              fontSize: '0.85rem',
                              opacity: isActive(subItem.href) ? 1 : 0.8,
                              background: isActive(subItem.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                              borderLeft: isActive(subItem.href) ? '2px solid white' : '2px solid transparent',
                              borderRadius: '0 6px 6px 0',
                              margin: '2px 8px 2px 0',
                              transition: 'all 0.2s ease',
                              transform: 'translate3d(0, 0, 0)', // GPU optimization
                              willChange: isActive(subItem.href) ? 'auto' : 'background-color, opacity'
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
      </div>

      {/* Progress Summary */}
      <div style={{
        margin: '16px 20px',
        padding: '12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}>
        <h4 style={{
          margin: '0 0 8px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          📊 Progresso Geral
        </h4>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '4px'
        }}>
          {progressData.overallCompletionRate}%
        </div>
        <div style={{
          fontSize: '0.7rem',
          opacity: 0.8,
          marginBottom: '8px'
        }}>
          {progressData.completedModules}/{progressData.totalModules} módulos completos
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.7rem',
          opacity: 0.8
        }}>
          <span>🔥 {progressData.currentStreak} dias</span>
          <span>•</span>
          <span>⏱️ {progressData.totalTimeSpent}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '0.75rem',
          opacity: 0.7,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 4px' }}>Sistema Educacional</p>
          <p style={{ margin: '0 0 4px' }}>Hanseníase PQT-U</p>
          <p style={{ margin: 0, fontSize: '0.7rem' }}>v2.0 - Next.js</p>
        </div>
      </div>

      {/* Push content when sidebar is visible */}
      <style jsx global>{`
        .main-content {
          margin-left: 320px;
          transition: margin-left 0.3s ease;
        }
      `}</style>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcuts 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
      />
    </nav>
  );
}