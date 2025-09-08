'use client';

import React, { 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo, 
  useState,
  useContext,
  createContext
} from 'react';
import { useGlobalContext } from '@/contexts/GlobalContextHub';
import { useSimpleTrack } from '@/components/tracking/IntegratedTrackingProvider';

// ============================================
// TYPES E INTERFACES WCAG
// ============================================

export interface WCAGSettings {
  // Level A Requirements
  keyboardNavigation: boolean;
  skipLinks: boolean;
  headingStructure: boolean;
  altText: boolean;
  colorContrast: boolean;
  
  // Level AA Requirements
  focusIndicator: boolean;
  textResize: boolean;
  colorAlone: boolean;
  audioControl: boolean;
  
  // Level AAA Requirements (optional)
  contextHelp: boolean;
  errorSuggestion: boolean;
  lowVision: boolean;
  cognitiveSupport: boolean;
}

export interface AccessibilityState {
  isEnabled: boolean;
  settings: WCAGSettings;
  violations: AccessibilityViolation[];
  currentFocus: string | null;
  announcements: string[];
  navigationMode: 'mouse' | 'keyboard' | 'screen-reader';
}

export interface AccessibilityViolation {
  id: string;
  type: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCode: string;
  element: string;
  message: string;
  suggestion: string;
}

// ============================================
// CONTEXTO DE ACESSIBILIDADE WCAG
// ============================================

interface WCAGContextType {
  state: AccessibilityState;
  updateSettings: (settings: Partial<WCAGSettings>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  reportViolation: (violation: Omit<AccessibilityViolation, 'id'>) => void;
  clearViolations: () => void;
  setNavigationMode: (mode: 'mouse' | 'keyboard' | 'screen-reader') => void;
  focusElement: (selector: string) => void;
  createFocusTrap: (containerRef: React.RefObject<HTMLElement>) => () => void;
  generateAriaLabel: (context: string, action?: string) => string;
  validateWCAG: (element: HTMLElement) => AccessibilityViolation[];
}

const WCAGContext = createContext<WCAGContextType | undefined>(undefined);

// ============================================
// PROVIDER DE ACESSIBILIDADE WCAG
// ============================================

interface WCAGProviderProps {
  children: React.ReactNode;
  initialSettings?: Partial<WCAGSettings>;
}

export const WCAGComplianceProvider: React.FC<WCAGProviderProps> = ({
  children,
  initialSettings = {}
}) => {
  const [state, setState] = useState<AccessibilityState>({
    isEnabled: true,
    settings: {
      keyboardNavigation: true,
      skipLinks: true,
      headingStructure: true,
      altText: true,
      colorContrast: true,
      focusIndicator: true,
      textResize: true,
      colorAlone: true,
      audioControl: true,
      contextHelp: false,
      errorSuggestion: true,
      lowVision: false,
      cognitiveSupport: false,
      ...initialSettings
    },
    violations: [],
    currentFocus: null,
    announcements: [],
    navigationMode: 'mouse'
  });

  const globalContext = useGlobalContext();
  const tracking = useSimpleTrack();
  const announceRef = useRef<HTMLDivElement>(null);

  // ============================================
  // FUNÇÕES DE CONTROLE
  // ============================================

  const updateSettings = useCallback((newSettings: Partial<WCAGSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));

    tracking.track('click', 'accessibility_settings_changed', {
      changed: Object.keys(newSettings),
      values: newSettings
    });
  }, [tracking]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;

    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements.slice(-4), message] // Keep last 5
    }));

    announceRef.current.setAttribute('aria-live', priority);
    announceRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  const reportViolation = useCallback((violation: Omit<AccessibilityViolation, 'id'>) => {
    const newViolation: AccessibilityViolation = {
      ...violation,
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setState(prev => ({
      ...prev,
      violations: [...prev.violations, newViolation].slice(-50) // Keep last 50
    }));

    if (violation.type === 'error') {
      announce(`Erro de acessibilidade: ${violation.message}`, 'assertive');
    }

    tracking.trackError('accessibility_violation', violation.message, violation.element);
  }, [announce, tracking]);

  const clearViolations = useCallback(() => {
    setState(prev => ({ ...prev, violations: [] }));
  }, []);

  const setNavigationMode = useCallback((mode: 'mouse' | 'keyboard' | 'screen-reader') => {
    setState(prev => ({ ...prev, navigationMode: mode }));
    
    document.body.setAttribute('data-navigation-mode', mode);
    
    tracking.track('click', 'navigation_mode_changed', { mode });
  }, [tracking]);

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      setState(prev => ({ ...prev, currentFocus: selector }));
      
      announce(`Foco movido para ${element.getAttribute('aria-label') || element.textContent || selector}`);
    }
  }, [announce]);

  const createFocusTrap = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return () => {};

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return () => {};

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const generateAriaLabel = useCallback((context: string, action?: string) => {
    const baseLabel = context.charAt(0).toUpperCase() + context.slice(1);
    if (action) {
      return `${baseLabel}. ${action}`;
    }
    return baseLabel;
  }, []);

  // ============================================
  // VALIDAÇÃO WCAG
  // ============================================

  const validateWCAG = useCallback((element: HTMLElement): AccessibilityViolation[] => {
    const violations: AccessibilityViolation[] = [];

    // Check for missing alt text on images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      violations.push({
        id: '',
        type: 'error',
        wcagLevel: 'A',
        wcagCode: '1.1.1',
        element: element.tagName.toLowerCase(),
        message: 'Imagem sem texto alternativo',
        suggestion: 'Adicione o atributo alt com uma descrição da imagem'
      });
    }

    // Check for missing labels on form inputs
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      const hasLabel = element.getAttribute('aria-label') || 
                     element.getAttribute('aria-labelledby') ||
                     element.id && document.querySelector(`label[for="${element.id}"]`);
      
      if (!hasLabel) {
        violations.push({
          id: '',
          type: 'error',
          wcagLevel: 'A',
          wcagCode: '3.3.2',
          element: element.tagName.toLowerCase(),
          message: 'Campo de formulário sem label',
          suggestion: 'Adicione um label associado ou atributo aria-label'
        });
      }
    }

    // Check for missing heading structure
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
      const level = parseInt(element.tagName[1]);
      const previousHeading = element.previousElementSibling;
      
      if (previousHeading && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(previousHeading.tagName)) {
        const prevLevel = parseInt(previousHeading.tagName[1]);
        if (level > prevLevel + 1) {
          violations.push({
            id: '',
            type: 'warning',
            wcagLevel: 'AA',
            wcagCode: '2.4.6',
            element: element.tagName.toLowerCase(),
            message: 'Estrutura de cabeçalho inconsistente',
            suggestion: 'Use cabeçalhos em ordem hierárquica'
          });
        }
      }
    }

    // Check for buttons without accessible names
    if (element.tagName === 'BUTTON') {
      const hasAccessibleName = element.textContent?.trim() ||
                               element.getAttribute('aria-label') ||
                               element.getAttribute('aria-labelledby');
      
      if (!hasAccessibleName) {
        violations.push({
          id: '',
          type: 'error',
          wcagLevel: 'A',
          wcagCode: '4.1.2',
          element: 'button',
          message: 'Botão sem nome acessível',
          suggestion: 'Adicione texto, aria-label ou aria-labelledby ao botão'
        });
      }
    }

    // Check color contrast (simplified)
    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor;
    const textColor = computedStyle.color;
    
    if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
      // Simplified contrast check - in real implementation would use proper algorithm
      const hasLowContrast = bgColor === textColor;
      if (hasLowContrast) {
        violations.push({
          id: '',
          type: 'warning',
          wcagLevel: 'AA',
          wcagCode: '1.4.3',
          element: element.tagName.toLowerCase(),
          message: 'Contraste de cor insuficiente',
          suggestion: 'Aumentar o contraste entre texto e fundo (mínimo 4.5:1)'
        });
      }
    }

    return violations;
  }, []);

  // ============================================
  // EFFECTS PARA MONITORAMENTO
  // ============================================

  // Detectar modo de navegação
  useEffect(() => {
    let lastKeyboardTime = 0;

    const handleKeyDown = () => {
      lastKeyboardTime = Date.now();
      setNavigationMode('keyboard');
    };

    const handleMouseDown = () => {
      // Only switch to mouse if no recent keyboard activity
      if (Date.now() - lastKeyboardTime > 500) {
        setNavigationMode('mouse');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [setNavigationMode]);

  // Skip links implementation
  useEffect(() => {
    if (!state.settings.skipLinks) return;

    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Pular para o conteúdo principal';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: top 0.3s;
    `;

    const showSkipLink = () => {
      skipLink.style.top = '6px';
    };

    const hideSkipLink = () => {
      skipLink.style.top = '-40px';
    };

    skipLink.addEventListener('focus', showSkipLink);
    skipLink.addEventListener('blur', hideSkipLink);

    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      if (document.body.contains(skipLink)) {
        document.body.removeChild(skipLink);
      }
    };
  }, [state.settings.skipLinks]);

  // Focus indicator enhancement
  useEffect(() => {
    if (!state.settings.focusIndicator) return;

    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
      
      *:focus:not(:focus-visible) {
        outline: none !important;
      }
      
      *:focus-visible {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [state.settings.focusIndicator]);

  // Automatic WCAG validation
  useEffect(() => {
    if (!state.settings.headingStructure) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const violations = validateWCAG(element);
            violations.forEach(reportViolation);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [state.settings.headingStructure, validateWCAG, reportViolation]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: WCAGContextType = {
    state,
    updateSettings,
    announce,
    reportViolation,
    clearViolations,
    setNavigationMode,
    focusElement,
    createFocusTrap,
    generateAriaLabel,
    validateWCAG
  };

  return (
    <WCAGContext.Provider value={contextValue}>
      <div
        ref={announceRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      {children}
    </WCAGContext.Provider>
  );
};

// ============================================
// HOOK PARA USAR WCAG
// ============================================

export const useWCAG = (): WCAGContextType => {
  const context = useContext(WCAGContext);
  if (!context) {
    throw new Error('useWCAG must be used within WCAGComplianceProvider');
  }
  return context;
};

// ============================================
// COMPONENTS UTILITÁRIOS
// ============================================

export const WCAGDebugPanel: React.FC = () => {
  const { state, clearViolations } = useWCAG();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>WCAG Debug Panel</strong>
        <button
          onClick={clearViolations}
          style={{
            marginLeft: '10px',
            padding: '2px 6px',
            fontSize: '10px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
      
      <div>Navigation: {state.navigationMode}</div>
      <div>Violations: {state.violations.length}</div>
      
      {state.violations.slice(-5).map((violation) => (
        <div
          key={violation.id}
          style={{
            marginTop: '5px',
            padding: '5px',
            background: violation.type === 'error' ? 'rgba(220, 53, 69, 0.2)' : 'rgba(255, 193, 7, 0.2)',
            borderRadius: '3px'
          }}
        >
          <div><strong>{violation.wcagCode}</strong> ({violation.wcagLevel})</div>
          <div>{violation.message}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// HOC PARA WCAG COMPLIANCE
// ============================================

export const withWCAG = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
) => {
  const WCAGComponent = React.forwardRef<HTMLDivElement, P>((props, ref) => {
    const { generateAriaLabel, announce, reportViolation, validateWCAG } = useWCAG();
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (componentRef.current) {
        const violations = validateWCAG(componentRef.current);
        violations.forEach(reportViolation);
      }
    }, [validateWCAG, reportViolation]);

    return (
      <div ref={componentRef}>
        <Component {...(props as P)} />
      </div>
    );
  });

  WCAGComponent.displayName = `withWCAG(${Component.displayName || Component.name})`;
  return WCAGComponent;
};

export default WCAGComplianceProvider;