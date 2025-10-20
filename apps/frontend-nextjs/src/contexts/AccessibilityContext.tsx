'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  fontSize: 'normal' | 'large' | 'larger';
  setFontSize: (size: 'normal' | 'large' | 'larger') => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedHighContrast = safeLocalStorage()?.getItem('accessibility-high-contrast');
    const savedFontSize = safeLocalStorage()?.getItem('accessibility-font-size') as 'normal' | 'large' | 'larger';
    const savedReducedMotion = safeLocalStorage()?.getItem('accessibility-reduced-motion');
    
    if (savedHighContrast === 'true') {
      setHighContrast(true);
    }
    
    if (savedFontSize && ['normal', 'large', 'larger'].includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }
    
    if (savedReducedMotion === 'true') {
      setReducedMotion(true);
    }
    
    // Check system preferences
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      setHighContrast(true);
    }
    
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }
  }, []);

  // Apply high contrast
  useEffect(() => {
    const root = document.documentElement;
    
    if (highContrast) {
      root.classList.add('high-contrast-mode');
      root.setAttribute('data-contrast', 'high');
    } else {
      root.classList.remove('high-contrast-mode');
      root.setAttribute('data-contrast', 'normal');
    }
    
    safeLocalStorage()?.setItem('accessibility-high-contrast', highContrast.toString());
  }, [highContrast]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-larger');
    root.classList.add(`font-size-${fontSize}`);
    root.setAttribute('data-font-size', fontSize);
    
    safeLocalStorage()?.setItem('accessibility-font-size', fontSize);
  }, [fontSize]);

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement;
    
    if (reducedMotion) {
      root.classList.add('reduced-motion');
      root.setAttribute('data-motion', 'reduced');
    } else {
      root.classList.remove('reduced-motion');
      root.setAttribute('data-motion', 'normal');
    }
    
    safeLocalStorage()?.setItem('accessibility-reduced-motion', reducedMotion.toString());
  }, [reducedMotion]);

  const handleSetHighContrast = (enabled: boolean) => {
    setHighContrast(enabled);
    
    // Announce change to screen readers
    const announcement = enabled ? 
      'Alto contraste ativado' : 
      'Alto contraste desativado';
    
    const ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'polite');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.style.position = 'absolute';
    ariaLiveRegion.style.left = '-10000px';
    ariaLiveRegion.style.width = '1px';
    ariaLiveRegion.style.height = '1px';
    ariaLiveRegion.style.overflow = 'hidden';
    ariaLiveRegion.textContent = announcement;
    
    document.body.appendChild(ariaLiveRegion);
    setTimeout(() => document.body.removeChild(ariaLiveRegion), 1000);
  };

  const value: AccessibilityContextType = {
    highContrast,
    setHighContrast: handleSetHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}