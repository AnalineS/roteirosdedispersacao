/**
 * Hook Otimizado para Resize - PR #174
 * 
 * Implementa debounce inteligente para eventos de resize
 * com detecção de breakpoints móveis
 */

'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { debounce } from '@/lib/optimizations';

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

interface UseOptimizedResizeOptions {
  debounceMs?: number;
  onResize?: (viewport: ViewportInfo) => void;
  trackOrientation?: boolean;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

export function useOptimizedResize({
  debounceMs = 100,
  onResize,
  trackOrientation = true,
  mobileBreakpoint = 768,
  tabletBreakpoint = 1024
}: UseOptimizedResizeOptions = {}) {

  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        orientation: 'portrait',
        devicePixelRatio: 1
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < mobileBreakpoint,
      isTablet: width >= mobileBreakpoint && width < tabletBreakpoint,
      isDesktop: width >= tabletBreakpoint,
      orientation: width > height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    };
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const newViewport: ViewportInfo = {
      width,
      height,
      isMobile: width < mobileBreakpoint,
      isTablet: width >= mobileBreakpoint && width < tabletBreakpoint,
      isDesktop: width >= tabletBreakpoint,
      orientation: width > height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    };

    // Apenas atualizar se houve mudança significativa
    const hasChanged = 
      newViewport.width !== viewport.width ||
      newViewport.height !== viewport.height ||
      newViewport.isMobile !== viewport.isMobile ||
      newViewport.isTablet !== viewport.isTablet ||
      newViewport.orientation !== viewport.orientation;

    if (hasChanged) {
      setViewport(newViewport);
      
      if (onResize) {
        onResize(newViewport);
      }
    }
  }, [viewport, onResize, mobileBreakpoint, tabletBreakpoint]);

  // Debounced resize handler
  const debouncedResizeHandler = useMemo(
    () => debounce(updateViewport, debounceMs, { maxWait: debounceMs * 2 }),
    [updateViewport, debounceMs]
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedResizeHandler);
    
    // Também escutar orientationchange em dispositivos móveis
    if (trackOrientation) {
      window.addEventListener('orientationchange', debouncedResizeHandler);
    }

    return () => {
      window.removeEventListener('resize', debouncedResizeHandler);
      
      if (trackOrientation) {
        window.removeEventListener('orientationchange', debouncedResizeHandler);
      }

      // Cancelar debounce
      if (debouncedResizeHandler && typeof debouncedResizeHandler.cancel === 'function') {
        debouncedResizeHandler.cancel();
      }
    };
  }, [debouncedResizeHandler, trackOrientation]);

  return viewport;
}