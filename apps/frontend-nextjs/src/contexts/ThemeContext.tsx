'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Carregar preferência salva - forçar sempre light
  useEffect(() => {
    // Sempre usar tema light (UnB cores claras)
    setThemeMode('light');
    localStorage.setItem('theme-mode', 'light');
  }, []);

  // Resolver tema baseado no modo - sempre light
  useEffect(() => {
    // Forçar sempre tema light (UnB padrão)
    setResolvedTheme('light');
  }, [themeMode]);

  // Aplicar classe no documento - sempre light
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'theme-dark', 'dark-mode');
    root.classList.add('light', 'theme-light', 'light-mode');
    root.setAttribute('data-theme', 'light');
    
    // Forçar fundo branco
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#1e293b';
    
    // Atualizar meta theme-color sempre para light
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#003366'); // UnB azul institucional
    }
    
    // Garantir que colorScheme seja light
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', 'light');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'color-scheme';
      newMeta.content = 'light';
      document.head.appendChild(newMeta);
    }
  }, [resolvedTheme]);

  const handleSetThemeMode = (mode: ThemeMode) => {
    // Sempre forçar light mode (UnB tema oficial)
    setThemeMode('light');
    localStorage.setItem('theme-mode', 'light');
  };

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode: handleSetThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}