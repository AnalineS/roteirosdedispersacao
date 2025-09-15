'use client';

import React, { useState, useEffect } from 'react';
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
  }, []);

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
  }, [fontSize, reducedMotion, screenReaderMode]);

  // ============================================
  // ACCESSIBILITY FUNCTIONS
  // ============================================

  const applyAccessibilitySettings = () => {
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
  };

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
            <div className="accessibility-panel-content" role="dialog" aria-label="Painel de Acessibilidade">
              <div className="accessibility-panel-header">
                <h3>Acessibilidade</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="accessibility-close-btn"
                  aria-label="Fechar painel"
                >
                  ✕
                </button>
              </div>
              
              <div className="accessibility-panel-body">
                {/* High Contrast Toggle */}
                <div className="accessibility-option">
                  <HighContrastToggle variant="switch" />
                </div>
                
                {/* Font Size Controls */}
                <div className="accessibility-option">
                  <label className="accessibility-label">Tamanho da Fonte</label>
                  <div className="font-size-controls">
                    <button onClick={decreaseFontSize} className="font-btn" aria-label="Diminuir fonte">
                      A-
                    </button>
                    <span className="font-size-display">{fontSize}px</span>
                    <button onClick={increaseFontSize} className="font-btn" aria-label="Aumentar fonte">
                      A+
                    </button>
                    <button onClick={resetFontSize} className="font-btn reset" aria-label="Reset fonte">
                      ↻
                    </button>
                  </div>
                </div>
                
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
                
                {/* Medical Glossary Access */}
                <div className="accessibility-option">
                  <MedicalGlossary compact={true} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <style jsx>{`
          .accessibility-floating-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
          }
          
          .accessibility-toggle-btn {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            border: 3px solid white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.3s ease;
          }
          
          .accessibility-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0,0,0,0.4);
          }
          
          .accessibility-toggle-btn:focus-visible {
            outline: 3px solid #fbbf24;
            outline-offset: 2px;
          }
          
          .accessibility-panel-content {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border: 2px solid #e5e7eb;
            max-height: 500px;
            overflow-y: auto;
          }
          
          .accessibility-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
            border-radius: 10px 10px 0 0;
          }
          
          .accessibility-panel-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }
          
          .accessibility-close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
            border-radius: 4px;
          }
          
          .accessibility-close-btn:hover {
            background: #e5e7eb;
            color: #374151;
          }
          
          .accessibility-panel-body {
            padding: 20px;
          }
          
          .accessibility-option {
            margin-bottom: 20px;
          }
          
          .accessibility-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .font-size-controls {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .font-btn {
            padding: 6px 10px;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          }
          
          .font-btn:hover {
            border-color: #3b82f6;
            background: #eff6ff;
          }
          
          .font-btn.reset {
            background: #f3f4f6;
          }
          
          .font-size-display {
            font-size: 14px;
            color: #6b7280;
            min-width: 40px;
            text-align: center;
          }
          
          .accessibility-checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            cursor: pointer;
          }
          
          .accessibility-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }
          
          /* High contrast mode */
          [data-contrast="high"] .accessibility-panel-content {
            border: 3px solid #000000;
            background: #ffffff;
          }
          
          [data-contrast="high"] .accessibility-panel-header {
            background: #ffffff;
            border-bottom: 2px solid #000000;
          }
          
          [data-contrast="high"] .accessibility-panel-header h3 {
            color: #000000;
          }
          
          /* Mobile adjustments */
          @media (max-width: 768px) {
            .accessibility-panel-content {
              width: 280px;
              right: -10px;
            }
            
            .accessibility-toggle-btn {
              width: 48px;
              height: 48px;
              font-size: 20px;
            }
          }
          
          /* Reduced motion */
          [data-reduced-motion="true"] .accessibility-toggle-btn,
          [data-reduced-motion="true"] .font-btn {
            transition: none;
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