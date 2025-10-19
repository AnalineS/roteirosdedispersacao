'use client';

/**
 * Developer Tools Provider
 * Gerencia ferramentas de desenvolvimento com hotkeys globais
 */

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import UXInstrumentationPanel from './UXInstrumentationPanel';
import { secureLogger } from '@/utils/secureLogger';

interface DeveloperToolsContextType {
  isUXPanelOpen: boolean;
  toggleUXPanel: () => void;
  isDevelopmentMode: boolean;
}

const DeveloperToolsContext = createContext<DeveloperToolsContextType | null>(null);

export const useDeveloperTools = () => {
  const context = useContext(DeveloperToolsContext);
  if (!context) {
    throw new Error('useDeveloperTools deve ser usado dentro de DeveloperToolsProvider');
  }
  return context;
};

interface DeveloperToolsProviderProps {
  children: ReactNode;
}

export default function DeveloperToolsProvider({ children }: DeveloperToolsProviderProps) {
  const [isUXPanelOpen, setIsUXPanelOpen] = useState(false);
  const isDevelopmentMode = process.env.NODE_ENV === 'development';

  const toggleUXPanel = () => {
    setIsUXPanelOpen(prev => !prev);
  };

  // Hook para detectar Ctrl+Shift+U
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+U para UX Instrumentation Panel
      if (event.ctrlKey && event.shiftKey && event.key === 'U') {
        event.preventDefault();
        toggleUXPanel();
      }
    };

    // Só ativar em desenvolvimento ou com query param ?dev=true
    const urlParams = new URLSearchParams(window.location.search);
    const isDevMode = isDevelopmentMode || urlParams.get('dev') === 'true';

    if (isDevMode) {
      window.addEventListener('keydown', handleKeyDown);

      // Log para informar sobre as teclas disponíveis
      if (isDevelopmentMode) {
        secureLogger.info('🔧 Dev Tools: Ctrl+Shift+U para UX Instrumentation Panel');
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDevelopmentMode]);

  return (
    <DeveloperToolsContext.Provider
      value={{
        isUXPanelOpen,
        toggleUXPanel,
        isDevelopmentMode
      }}
    >
      {children}

      {/* UX Instrumentation Panel */}
      {isUXPanelOpen && (
        <UXInstrumentationPanel
          isOpen={isUXPanelOpen}
          onClose={() => setIsUXPanelOpen(false)}
        />
      )}
    </DeveloperToolsContext.Provider>
  );
}

// Hook para usar as ferramentas de desenvolvedor em componentes
export const useUXInstrumentation = () => {
  const { isUXPanelOpen, toggleUXPanel } = useDeveloperTools();

  return {
    isOpen: isUXPanelOpen,
    toggle: toggleUXPanel,
    // Métodos de conveniência
    open: () => !isUXPanelOpen && toggleUXPanel(),
    close: () => isUXPanelOpen && toggleUXPanel()
  };
};