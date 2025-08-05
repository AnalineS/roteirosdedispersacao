'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { NavigationCategory } from './index';
import ProgressIndicator from '../Progress/ProgressIndicator';
import { useProgressData } from '../Progress';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface TabletSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  categories: NavigationCategory[];
  currentPersona?: any;
  isActive: (href: string) => boolean;
}

export default function TabletSidebar({ 
  isCollapsed, 
  onToggleCollapse, 
  categories, 
  currentPersona, 
  isActive 
}: TabletSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['learning']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const progressData = useProgressData();
  const sidebarRef = useRef<HTMLElement>(null);
  
  // Configure keyboard navigation
  useKeyboardNavigation({
    containerRef: sidebarRef,
    enableArrowKeys: true,
    onEnter: (element) => {
      if (element.getAttribute('role') === 'button') {
        element.click();
      }
    }
  });

  const toggleCategory = (categoryId: string) => {
    if (isCollapsed) return; // Don't expand when collapsed
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    if (isCollapsed) return;
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

  const sidebarWidth = isCollapsed ? '80px' : '280px';

  return (
    <nav
      ref={sidebarRef}
      role="navigation"
      aria-label="Educational tablet navigation sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: sidebarWidth,
        height: '100vh',
        background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 999,
        transition: 'width 0.3s ease, transform 0.3s ease',
        transform: 'translate3d(0, 0, 0)' // GPU optimization
      }}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        tabIndex={0}
        style={{
          position: 'absolute',
          top: '20px',
          right: '-15px',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: '#1976d2',
          border: '2px solid white',
          color: 'white',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1001,
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => { e.currentTarget.style.outline = '2px solid white'; }}
        onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>

      {/* Header */}
      <div style={{
        padding: isCollapsed ? '24px 8px' : '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        textAlign: isCollapsed ? 'center' : 'left'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCollapsed ? '0' : '12px',
          marginBottom: isCollapsed ? '0' : '12px',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}>
          <div style={{ fontSize: isCollapsed ? '1.5rem' : '1.8rem' }}>🏥</div>
          {!isCollapsed && (
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
          )}
        </div>
        
        {currentPersona && !isCollapsed && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{currentPersona.avatar}</span>
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
      <div style={{ padding: '16px 0' }}>
        {categories.map((category) => (
          <div key={category.id} style={{ marginBottom: '4px' }}>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              role="button"
              aria-expanded={!isCollapsed && expandedCategories.has(category.id)}
              aria-controls={`tablet-category-${category.id}-items`}
              aria-label={`${expandedCategories.has(category.id) ? 'Collapse' : 'Expand'} ${category.label} category`}
              tabIndex={0}
              title={isCollapsed ? `${category.label} - ${category.description}` : undefined}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'white',
                padding: isCollapsed ? '12px 8px' : '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                opacity: 0.9,
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onFocus={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.outline = '2px solid white'; }}
              onBlur={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.outline = 'none'; }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isCollapsed ? '0' : '8px',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
              }}>
                <span style={{ fontSize: '0.95rem' }}>{category.icon}</span>
                {!isCollapsed && <span>{category.label}</span>}
              </div>
              {!isCollapsed && (
                <span style={{ fontSize: '0.7rem' }}>
                  {expandedCategories.has(category.id) ? '▼' : '▶'}
                </span>
              )}
            </button>

            {/* Category Items */}
            {!isCollapsed && expandedCategories.has(category.id) && (
              <div 
                id={`tablet-category-${category.id}-items`}
                role="group"
                aria-labelledby={`tablet-category-${category.id}-header`}
                style={{ marginLeft: '4px' }}
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
                          padding: '10px 16px 10px 28px',
                          color: 'white',
                          textDecoration: 'none',
                          borderLeft: isActive(item.href) ? '3px solid white' : '3px solid transparent',
                          background: isActive(item.href) ? 'rgba(255,255,255,0.15)' : 'transparent',
                          transition: 'all 0.2s ease',
                          borderRadius: '0 8px 8px 0',
                          margin: '0 8px 0 0'
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
                          gap: '8px',
                          marginBottom: '3px'
                        }}>
                          <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: isActive(item.href) ? 'bold' : 'normal',
                              fontSize: '0.85rem',
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
                        </div>
                      </Link>
                      
                      {/* Expand/Collapse SubItems */}
                      {item.subItems && item.subItems.length > 0 && (
                        <button
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={expandedItems.has(item.id)}
                          aria-controls={`tablet-subitems-${item.id}`}
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
                        id={`tablet-subitems-${item.id}`}
                        role="group"
                        aria-labelledby={`tablet-item-${item.id}-label`}
                        style={{ marginLeft: '16px', marginTop: '2px' }}
                      >
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.id}
                            href={subItem.href}
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
                              transition: 'all 0.2s ease'
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

      {/* Progress Summary - Only when not collapsed */}
      {!isCollapsed && (
        <div style={{
          margin: '16px 20px',
          padding: '12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px'
        }}>
          <h4 style={{
            margin: '0 0 8px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📊 Progresso
          </h4>
          <div style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '4px'
          }}>
            {progressData.overallCompletionRate}%
          </div>
          <div style={{
            fontSize: '0.65rem',
            opacity: 0.8,
            marginBottom: '6px'
          }}>
            {progressData.completedModules}/{progressData.totalModules} módulos
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            opacity: 0.8
          }}>
            <span>🔥 {progressData.currentStreak}d</span>
            <span>•</span>
            <span>⏱️ {progressData.totalTimeSpent}</span>
          </div>
        </div>
      )}

      {/* Push content when sidebar is visible */}
      <style jsx global>{`
        .main-content {
          margin-left: ${sidebarWidth};
          transition: margin-left 0.3s ease;
        }
      `}</style>
    </nav>
  );
}