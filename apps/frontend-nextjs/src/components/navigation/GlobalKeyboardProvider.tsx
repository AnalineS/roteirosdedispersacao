'use client';

/**
 * Global Keyboard Provider
 * Gerencia navegação por teclado global e atalhos de acessibilidade
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import KeyboardNavigationTutorial from './KeyboardNavigationTutorial';
import { ACCESS_KEYS } from '@/constants/medicalShortcuts';
import { secureLogger } from '@/utils/secureLogger';

interface GlobalKeyboardContextType {
  isKeyboardNavigationEnabled: boolean;
  isTutorialOpen: boolean;
  showTutorial: () => void;
  hideTutorial: () => void;
  enableKeyboardMode: () => void;
  disableKeyboardMode: () => void;
  currentFocusedElement: string | null;
  navigationHistory: string[];
}

const GlobalKeyboardContext = createContext<GlobalKeyboardContextType | null>(null);

export const useGlobalKeyboard = () => {
  const context = useContext(GlobalKeyboardContext);
  if (!context) {
    throw new Error('useGlobalKeyboard deve ser usado dentro de GlobalKeyboardProvider');
  }
  return context;
};

interface GlobalKeyboardProviderProps {
  children: ReactNode;
}

export default function GlobalKeyboardProvider({ children }: GlobalKeyboardProviderProps) {
  const [isKeyboardNavigationEnabled, setIsKeyboardNavigationEnabled] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [currentFocusedElement, setCurrentFocusedElement] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [hasShownWelcomeTutorial, setHasShownWelcomeTutorial] = useState(false);

  // Usar hook de navegação por teclado existente
  const keyboardNavigation = useKeyboardNavigation({
    enableFocusTrapping: true,
    enableGlobalShortcuts: true,
    enableNumericNavigation: true,
    enableArrowKeys: true
  });

  // Detectar se usuário está usando teclado
  const detectKeyboardUsage = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab' && !isKeyboardNavigationEnabled) {
      setIsKeyboardNavigationEnabled(true);

      // Mostrar tutorial na primeira vez
      if (!hasShownWelcomeTutorial) {
        setTimeout(() => {
          setIsTutorialOpen(true);
          setHasShownWelcomeTutorial(true);
        }, 1000);
      }

      secureLogger.info('Keyboard navigation automatically enabled', {
        trigger: 'tab_key_detection',
        category: 'accessibility'
      });
    }
  }, [isKeyboardNavigationEnabled, hasShownWelcomeTutorial]);

  // Gerenciar atalhos globais
  const handleGlobalShortcuts = useCallback((event: KeyboardEvent) => {
    if (!isKeyboardNavigationEnabled) return;

    // F1 ou Ctrl+? para ajuda/tutorial
    if (event.key === 'F1' || (event.ctrlKey && event.key === '?')) {
      event.preventDefault();
      setIsTutorialOpen(true);
      secureLogger.info('Keyboard tutorial opened via shortcut', {
        shortcut: event.key === 'F1' ? 'F1' : 'Ctrl+?',
        category: 'keyboard_navigation'
      });
      return;
    }

    // Escape para fechar modais/tutorial
    if (event.key === 'Escape') {
      if (isTutorialOpen) {
        setIsTutorialOpen(false);
        return;
      }
    }

    // Atalhos de acesso rápido médico (Alt + tecla)
    if (event.altKey) {
      const altShortcuts: Record<string, () => void> = {
        'i': () => {
          // Interações medicamentosas
          const interactionLink = document.querySelector('[href*="interactions"]') as HTMLElement;
          if (interactionLink) {
            interactionLink.click();
            secureLogger.info('Medical shortcut used', { shortcut: 'Alt+I', target: 'drug_interactions' });
          }
        },
        'c': () => {
          // Contraindicações
          const contraindicationLink = document.querySelector('[href*="contraindications"]') as HTMLElement;
          if (contraindicationLink) {
            contraindicationLink.click();
            secureLogger.info('Medical shortcut used', { shortcut: 'Alt+C', target: 'contraindications' });
          }
        },
        'd': () => {
          // Doses críticas
          const dosingLink = document.querySelector('[href*="dosing"]') as HTMLElement;
          if (dosingLink) {
            dosingLink.click();
            secureLogger.info('Medical shortcut used', { shortcut: 'Alt+D', target: 'emergency_dosing' });
          }
        }
      };

      const handler = altShortcuts[event.key.toLowerCase()];
      if (handler) {
        event.preventDefault();
        handler();
        return;
      }
    }

    // Ctrl+K ou / para busca
    if ((event.ctrlKey && event.key === 'k') || event.key === '/') {
      event.preventDefault();
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="busca"], input[placeholder*="Busca"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        secureLogger.info('Search activated via keyboard', {
          shortcut: event.ctrlKey ? 'Ctrl+K' : '/',
          category: 'keyboard_navigation'
        });
      }
      return;
    }

    // Navegação de personas no chat (Ctrl+1, Ctrl+2)
    if (event.ctrlKey && ['1', '2'].includes(event.key)) {
      const personaButtons = document.querySelectorAll('[data-persona]');
      const targetPersona = event.key === '1' ? 'dr_gasnelio' : 'ga';

      const targetButton = Array.from(personaButtons).find(
        button => button.getAttribute('data-persona') === targetPersona
      ) as HTMLElement;

      if (targetButton) {
        event.preventDefault();
        targetButton.click();
        secureLogger.info('Persona switched via keyboard', {
          shortcut: `Ctrl+${event.key}`,
          persona: targetPersona,
          category: 'persona_navigation'
        });
      }
      return;
    }
  }, [isKeyboardNavigationEnabled, isTutorialOpen]);

  // Rastrear elemento focado
  const handleFocusChange = useCallback((event: FocusEvent) => {
    if (!isKeyboardNavigationEnabled) return;

    const target = event.target as HTMLElement;
    const elementId = target.id || target.className || target.tagName;

    setCurrentFocusedElement(elementId);
    setNavigationHistory(prev => [...prev.slice(-9), elementId]); // Últimos 10 elementos
  }, [isKeyboardNavigationEnabled]);

  // Adicionar event listeners
  useEffect(() => {
    document.addEventListener('keydown', detectKeyboardUsage);
    document.addEventListener('keydown', handleGlobalShortcuts);
    document.addEventListener('focusin', handleFocusChange);

    return () => {
      document.removeEventListener('keydown', detectKeyboardUsage);
      document.removeEventListener('keydown', handleGlobalShortcuts);
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [detectKeyboardUsage, handleGlobalShortcuts, handleFocusChange]);

  // Aplicar estilos de foco quando navegação por teclado está ativa
  useEffect(() => {
    if (isKeyboardNavigationEnabled) {
      document.body.classList.add('keyboard-navigation-active');

      // Adicionar estilos de foco aprimorados
      const style = document.createElement('style');
      style.textContent = `
        .keyboard-navigation-active *:focus {
          outline: 2px solid #0ea5e9 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2) !important;
        }

        .keyboard-navigation-active button:focus,
        .keyboard-navigation-active [role="button"]:focus {
          outline-color: #16a34a !important;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.2) !important;
        }

        .keyboard-navigation-active input:focus,
        .keyboard-navigation-active textarea:focus,
        .keyboard-navigation-active select:focus {
          outline-color: #dc2626 !important;
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.2) !important;
        }

        .keyboard-navigation-active [data-medical-critical]:focus {
          outline-color: #ea580c !important;
          box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.3) !important;
          background-color: rgba(254, 243, 199, 0.5) !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.classList.remove('keyboard-navigation-active');
        document.head.removeChild(style);
      };
    }
  }, [isKeyboardNavigationEnabled]);

  const showTutorial = useCallback(() => {
    setIsTutorialOpen(true);
    if (!isKeyboardNavigationEnabled) {
      setIsKeyboardNavigationEnabled(true);
    }
  }, [isKeyboardNavigationEnabled]);

  const hideTutorial = useCallback(() => {
    setIsTutorialOpen(false);
  }, []);

  const enableKeyboardMode = useCallback(() => {
    setIsKeyboardNavigationEnabled(true);
    secureLogger.info('Keyboard navigation manually enabled');
  }, []);

  const disableKeyboardMode = useCallback(() => {
    setIsKeyboardNavigationEnabled(false);
    setIsTutorialOpen(false);
    secureLogger.info('Keyboard navigation disabled');
  }, []);

  const handleTutorialComplete = useCallback((completedSteps: number) => {
    secureLogger.info('Keyboard navigation tutorial completed', {
      completedSteps,
      totalSteps: 6,
      category: 'tutorial_completion'
    });

    // Salvar que usuário completou tutorial
    safeLocalStorage()?.setItem('keyboard_tutorial_completed', 'true');
  }, []);

  return (
    <GlobalKeyboardContext.Provider
      value={{
        isKeyboardNavigationEnabled,
        isTutorialOpen,
        showTutorial,
        hideTutorial,
        enableKeyboardMode,
        disableKeyboardMode,
        currentFocusedElement,
        navigationHistory
      }}
    >
      {children}

      {/* Tutorial de Navegação por Teclado */}
      <KeyboardNavigationTutorial
        isOpen={isTutorialOpen}
        onClose={hideTutorial}
        onComplete={handleTutorialComplete}
      />

      {/* Indicador visual quando navegação por teclado está ativa */}
      {isKeyboardNavigationEnabled && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          role="status"
          aria-live="polite"
        >
          ⌨️ Navegação por Teclado Ativa
          <button
            onClick={showTutorial}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
              marginLeft: '4px'
            }}
            title="Abrir tutorial de atalhos (F1)"
          >
            F1
          </button>
        </div>
      )}
    </GlobalKeyboardContext.Provider>
  );
}

// Hook para atalhos específicos
export const useMedicalShortcuts = () => {
  const { isKeyboardNavigationEnabled } = useGlobalKeyboard();

  const triggerShortcut = useCallback((shortcutId: keyof typeof ACCESS_KEYS) => {
    if (!isKeyboardNavigationEnabled) return false;

    const key = ACCESS_KEYS[shortcutId];
    if (!key) return false;

    // Simular evento de teclado para atalho
    const event = new KeyboardEvent('keydown', {
      key,
      altKey: true,
      bubbles: true
    });

    document.dispatchEvent(event);
    return true;
  }, [isKeyboardNavigationEnabled]);

  return {
    isEnabled: isKeyboardNavigationEnabled,
    triggerDrugInteractions: () => triggerShortcut('drug_interactions'),
    triggerContraindications: () => triggerShortcut('contraindications'),
    triggerEmergencyDosing: () => triggerShortcut('emergency_dosing'),
    triggerClinicalProtocols: () => triggerShortcut('clinical_protocols'),
    triggerPharmacistContact: () => triggerShortcut('pharmacist_contact')
  };
};