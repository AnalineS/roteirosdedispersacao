'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode] = useState<ThemeMode>('light');
  const [resolvedTheme] = useState<ResolvedTheme>('light');

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

  const handleSetThemeMode = (_mode: ThemeMode) => {
    // Sempre forçar light mode (UnB tema oficial)
    safeLocalStorage()?.setItem('theme-mode', 'light');
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