'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { NavigationCategory } from './index';
import { useSidebarKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface MobileSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  categories: NavigationCategory[];
  currentPersona?: any;
  isActive: (href: string) => boolean;
}

export default function MobileSidebar({ 
  isOpen, 
  onToggle, 
  onClose, 
  categories, 
  currentPersona, 
  isActive 
}: MobileSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['learning']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLElement>(null);
  
  // Configurar navegação por teclado com trap focus quando aberto
  useSidebarKeyboardNavigation(isOpen, onClose, sidebarRef);

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
      case 'beginner': return '#4caf50';
      case 'intermediate': return '#ff9800';
      case 'advanced': return '#f44336';
      default: return '#2196f3';
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
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-sidebar"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        tabIndex={0}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1001,
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          width: '48px',
          height: '48px',
          fontSize: '1.3rem',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => { e.currentTarget.style.outline = '2px solid white'; }}
        onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 998,
            backdropFilter: 'blur(2px)'
          }}
          onClick={onClose}
        />
      )}

      {/* Mobile Navigation Sidebar */}
      <nav
        id="mobile-navigation-sidebar"
        ref={sidebarRef}
        role="navigation"
        aria-label="Educational navigation sidebar"
        aria-hidden={!isOpen}
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-100%',
          width: '85vw',
          maxWidth: '320px',
          height: '100vh',
          background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          transition: 'left 0.3s ease',
          zIndex: 999,
          overflowY: 'auto',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
          transform: 'translate3d(0, 0, 0)', // GPU optimization
          willChange: 'left' // Hint for browser optimization
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          paddingTop: '80px', // Account for menu button
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '1.6rem' }}>🏥</div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                PQT-U Educacional
              </h2>
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                opacity: 0.8
              }}>
                Sistema de Aprendizagem
              </p>
            </div>
          </div>
          
          {currentPersona && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1rem' }}>{currentPersona.avatar}</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {currentPersona.name}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  {currentPersona.personality}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Categories */}
        <div style={{ padding: '12px 0', paddingBottom: '80px' }}>
          {categories.map((category) => (
            <div key={category.id} style={{ marginBottom: '6px' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                aria-expanded={expandedCategories.has(category.id)}
                aria-controls={`mobile-category-${category.id}-items`}
                aria-label={`${expandedCategories.has(category.id) ? 'Collapse' : 'Expand'} ${category.label} category`}
                tabIndex={0}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  opacity: 0.9,
                  transition: 'opacity 0.2s ease',
                  textAlign: 'left'
                }}
                onTouchStart={(e) => { e.currentTarget.style.opacity = '1'; }}
                onTouchEnd={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onFocus={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.outline = '2px solid white'; }}
                onBlur={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.outline = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.95rem' }}>{category.icon}</span>
                  <span>{category.label}</span>
                </div>
                <span style={{ fontSize: '0.7rem' }}>
                  {expandedCategories.has(category.id) ? '▼' : '▶'}
                </span>
              </button>

              {/* Category Items */}
              {expandedCategories.has(category.id) && (
                <div 
                  id={`mobile-category-${category.id}-items`}
                  role="group"
                  aria-labelledby={`mobile-category-${category.id}-header`}
                  style={{ marginLeft: '4px' }}
                >
                  {category.items.map((item) => (
                    <div key={item.id}>
                      {/* Main Item */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                          tabIndex={0}
                          style={{
                            flex: 1,
                            display: 'block',
                            padding: '10px 16px 10px 28px',
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
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '3px'
                          }}>
                            <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: isActive(item.href) ? 'bold' : 'normal',
                                fontSize: '0.9rem',
                                marginBottom: '1px'
                              }}>
                                {item.label}
                              </div>
                              <div style={{
                                fontSize: '0.7rem',
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
                            gap: '6px',
                            marginTop: '4px',
                            flexWrap: 'wrap'
                          }}>
                            {item.level && (
                              <span style={{
                                background: getLevelColor(item.level),
                                color: 'white',
                                fontSize: '0.6rem',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontWeight: 'bold'
                              }}>
                                {getLevelLabel(item.level)}
                              </span>
                            )}
                            {item.estimatedTime && (
                              <span style={{
                                fontSize: '0.65rem',
                                opacity: 0.6
                              }}>
                                ⏱️ {item.estimatedTime}
                              </span>
                            )}
                            {item.completionRate !== undefined && (
                              <span style={{
                                fontSize: '0.65rem',
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
                            aria-controls={`mobile-subitems-${item.id}`}
                            aria-label={`${expandedItems.has(item.id) ? 'Collapse' : 'Expand'} ${item.label} subitems`}
                            tabIndex={0}
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: 'white',
                              width: '28px',
                              height: '28px',
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
                          id={`mobile-subitems-${item.id}`}
                          role="group"
                          aria-labelledby={`mobile-item-${item.id}-label`}
                          style={{ marginLeft: '16px', marginTop: '3px' }}
                        >
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.id}
                              href={subItem.href}
                              onClick={onClose}
                              aria-current={isActive(subItem.href) ? 'page' : undefined}
                              tabIndex={0}
                              style={{
                                display: 'block',
                                padding: '6px 12px 6px 32px',
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: '0.8rem',
                                opacity: isActive(subItem.href) ? 1 : 0.8,
                                background: isActive(subItem.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderLeft: isActive(subItem.href) ? '2px solid white' : '2px solid transparent',
                                borderRadius: '0 6px 6px 0',
                                margin: '1px 8px 1px 0',
                                transition: 'all 0.2s ease',
                                transform: 'translate3d(0, 0, 0)', // GPU optimization
                                willChange: isActive(subItem.href) ? 'auto' : 'background-color, opacity'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ fontSize: '0.8rem' }}>{subItem.icon}</span>
                                <div>
                                  <div style={{ fontWeight: isActive(subItem.href) ? 'bold' : 'normal' }}>
                                    {subItem.label}
                                  </div>
                                  <div style={{
                                    fontSize: '0.65rem',
                                    opacity: 0.6,
                                    marginTop: '1px'
                                  }}>
                                    {subItem.description}
                                  </div>
                                  {subItem.estimatedTime && (
                                    <div style={{
                                      fontSize: '0.6rem',
                                      opacity: 0.5,
                                      marginTop: '1px'
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

        {/* Footer */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: isOpen ? 0 : '-100%',
          right: isOpen ? 'auto' : '-100%',
          width: '85vw',
          maxWidth: '320px',
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
          transition: 'left 0.3s ease',
          transform: 'translate3d(0, 0, 0)', // GPU optimization
          willChange: 'left'
        }}>
          <div style={{
            fontSize: '0.7rem',
            opacity: 0.7,
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 3px' }}>Sistema Educacional</p>
            <p style={{ margin: '0 0 3px' }}>Hanseníase PQT-U</p>
            <p style={{ margin: 0, fontSize: '0.65rem' }}>v2.0 - Next.js</p>
          </div>
        </div>
      </nav>
    </>
  );
}