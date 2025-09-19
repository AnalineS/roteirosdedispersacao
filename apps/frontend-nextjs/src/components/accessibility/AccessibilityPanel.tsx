'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useServices, useAnalytics } from '@/providers/ServicesProvider';
import HighContrastToggle from './HighContrastToggle';
import SkipToContent from './SkipToContent';
import FocusIndicator from './FocusIndicator';
import MedicalGlossary from './MedicalGlossary';

// ============================================
// ACCESSIBILITY PANEL COMPONENT
// ============================================

interface AccessibilityPanelProps {
  compact?: boolean;
  floating?: boolean;
  className?: string;
}

export default function AccessibilityPanel({
  compact = false,
  floating = true,
  className = ''
}: AccessibilityPanelProps) {
  const { services } = useServices();
  const analytics = useAnalytics();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Load accessibility preferences from localStorage
    const savedPrefs = localStorage.getItem('accessibility_preferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setFontSize(prefs.fontSize || 16);
      setReducedMotion(prefs.reducedMotion || false);
      setScreenReaderMode(prefs.screenReaderMode || false);
    }

    // Detect system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }

    // Track accessibility panel usage
    analytics.trackUserAction('accessibility_panel_loaded', 'accessibility');
  }, [analytics]);

  // ============================================
  // ACCESSIBILITY FUNCTIONS
  // ============================================

  const applyAccessibilitySettings = useCallback(() => {
    const root = document.documentElement;
    
    // Font size adjustment
    root.style.setProperty('--user-font-scale', `${fontSize / 16}`);
    
    // Reduced motion
    if (reducedMotion) {
      root.style.setProperty('--transition-duration', '0ms');
      root.setAttribute('data-reduced-motion', 'true');
    } else {
      root.style.removeProperty('--transition-duration');
      root.removeAttribute('data-reduced-motion');
    }
    
    // Screen reader optimizations
    if (screenReaderMode) {
      root.setAttribute('data-screen-reader', 'true');
    } else {
      root.removeAttribute('data-screen-reader');
    }
  }, [fontSize, reducedMotion, screenReaderMode]);

  useEffect(() => {
    // Save preferences
    const prefs = {
      fontSize,
      reducedMotion,
      screenReaderMode
    };
    localStorage.setItem('accessibility_preferences', JSON.stringify(prefs));

    // Apply system-wide changes
    applyAccessibilitySettings();
  }, [fontSize, reducedMotion, screenReaderMode, applyAccessibilitySettings]);

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    analytics.trackUserAction('font_size_increase', 'accessibility', { size: newSize });
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    analytics.trackUserAction('font_size_decrease', 'accessibility', { size: newSize });
  };

  const resetFontSize = () => {
    setFontSize(16);
    analytics.trackUserAction('font_size_reset', 'accessibility');
  };

  const toggleReducedMotion = () => {
    setReducedMotion(!reducedMotion);
    analytics.trackUserAction('reduced_motion_toggle', 'accessibility', { enabled: !reducedMotion });
  };

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(!screenReaderMode);
    analytics.trackUserAction('screen_reader_mode_toggle', 'accessibility', { enabled: !screenReaderMode });
  };

  // ============================================
  // FLOATING PANEL VERSION
  // ============================================

  if (floating) {
    return (
      <>
        {/* Skip to content - sempre presente */}
        <SkipToContent />
        
        {/* Focus indicators */}
        <FocusIndicator />
        
        {/* Floating accessibility button */}
        <div className={`accessibility-floating-panel ${className}`}>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              analytics.trackUserAction('accessibility_panel_toggle', 'accessibility', { expanded: !isExpanded });
            }}
            className="accessibility-toggle-btn"
            aria-expanded={isExpanded}
            aria-label="Opções de Acessibilidade"
            title="Configurações de Acessibilidade"
          >
            <span className="accessibility-icon" aria-hidden="true">♿</span>
          </button>
          
          {isExpanded && (
            <div className={`accessibility-panel-content ${compact ? 'compact-mode' : ''}`} role="dialog" aria-label="Painel de Acessibilidade">
              <div className="accessibility-panel-header">
                <h3>{compact ? '♿' : 'Acessibilidade'}</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="accessibility-close-btn"
                  aria-label="Fechar painel"
                >
                  ✕
                </button>
              </div>

              <div className="accessibility-panel-body">
                {/* High Contrast Toggle - sempre visível */}
                <div className="accessibility-option">
                  <HighContrastToggle variant="switch" />
                </div>

                {/* Controles de fonte - sempre no modo compacto */}
                <div className="accessibility-option">
                  {!compact && <label className="accessibility-label">Tamanho da Fonte</label>}
                  <div className="font-size-controls">
                    <button onClick={decreaseFontSize} className="font-btn" aria-label="Diminuir fonte">
                      A-
                    </button>
                    {!compact && <span className="font-size-display">{fontSize}px</span>}
                    <button onClick={increaseFontSize} className="font-btn" aria-label="Aumentar fonte">
                      A+
                    </button>
                    {!compact && (
                      <button onClick={resetFontSize} className="font-btn reset" aria-label="Reset fonte">
                        ↻
                      </button>
                    )}
                  </div>
                </div>

                {/* Controles avançados - ocultos no modo compacto */}
                {!compact && (
                  <>
                    {/* Reduced Motion */}
                    <div className="accessibility-option">
                      <label className="accessibility-checkbox-label">
                        <input
                          type="checkbox"
                          checked={reducedMotion}
                          onChange={toggleReducedMotion}
                          className="accessibility-checkbox"
                        />
                        <span>Reduzir Animações</span>
                      </label>
                    </div>

                    {/* Screen Reader Mode */}
                    <div className="accessibility-option">
                      <label className="accessibility-checkbox-label">
                        <input
                          type="checkbox"
                          checked={screenReaderMode}
                          onChange={toggleScreenReaderMode}
                          className="accessibility-checkbox"
                        />
                        <span>Modo Leitor de Tela</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Botão expandir no modo compacto */}
                {compact && (
                  <div className="accessibility-option">
                    <button
                      onClick={() => {
                        // Expandir para modo completo (removendo compact temporariamente)
                        analytics.trackUserAction('accessibility_expand_from_compact', 'accessibility');
                      }}
                      className="accessibility-expand-btn"
                      aria-label="Ver mais opções"
                    >
                      ⚙️ Mais opções
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Critical accessibility actions (always visible) */}
        <div className="accessibility-global-controls">
          <SkipToContent />
          <FocusIndicator />
        </div>

        {/* CSS with compact mode support */}
        <style jsx>{`
          .accessibility-panel-content.compact-mode {
            width: 200px;
          }
          .compact-mode .accessibility-panel-body {
            padding: 12px;
          }
          .compact-mode .accessibility-option {
            margin-bottom: 8px;
          }
        `}</style>
      </>
    );
  }

  // ============================================
  // COMPACT/INLINE VERSION
  // ============================================

  return (
    <div className={`accessibility-inline-panel ${className}`}>
      <div className="accessibility-inline-content">
        <h4>Acessibilidade</h4>
        <div className="accessibility-inline-options">
          <HighContrastToggle showLabel={false} />
          <div className="font-controls-inline">
            <button onClick={decreaseFontSize} className="font-btn-inline">A-</button>
            <button onClick={increaseFontSize} className="font-btn-inline">A+</button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .accessibility-inline-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
        }
        
        .accessibility-inline-content h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #374151;
          font-weight: 600;
        }
        
        .accessibility-inline-options {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .font-controls-inline {
          display: flex;
          gap: 4px;
        }
        
        .font-btn-inline {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        
        .font-btn-inline:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}