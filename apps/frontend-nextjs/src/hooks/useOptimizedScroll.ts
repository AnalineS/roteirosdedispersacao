/**
 * Hook Otimizado para Scroll - PR #174
 * 
 * Implementa throttling inteligente para eventos de scroll
 * com performance otimizada para 60fps
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { throttle } from '@/lib/optimizations';

interface ScrollInfo {
  scrollY: number;
  scrollX: number;
  scrollDirection: 'up' | 'down' | 'left' | 'right' | null;
  isAtTop: boolean;
  isAtBottom: boolean;
  scrollPercentage: number;
}

interface UseOptimizedScrollOptions {
  throttleMs?: number;
  onScroll?: (scrollInfo: ScrollInfo) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
  detectScrollEnd?: boolean;
  scrollEndDelay?: number;
  element?: HTMLElement | null;
}

export function useOptimizedScroll({
  throttleMs = 16, // 60fps
  onScroll,
  onScrollStart,
  onScrollEnd,
  detectScrollEnd = false,
  scrollEndDelay = 150,
  element
}: UseOptimizedScrollOptions = {}) {
  
  const lastScrollY = useRef(0);
  const lastScrollX = useRef(0);
  const isScrolling = useRef(false);
  const scrollEndTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const handleScrollEnd = useCallback(() => {
    if (isScrolling.current && onScrollEnd) {
      isScrolling.current = false;
      onScrollEnd();
    }
  }, [onScrollEnd]);

  const handleScroll = useCallback(() => {
    const target = element || window;
    const scrollEl = element || document.documentElement;
    
    const scrollY = element ? element.scrollTop : window.scrollY;
    const scrollX = element ? element.scrollLeft : window.scrollX;
    const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
    const scrollWidth = scrollEl.scrollWidth - scrollEl.clientWidth;
    
    // Detectar início do scroll
    if (!isScrolling.current && onScrollStart) {
      isScrolling.current = true;
      onScrollStart();
    }
    
    // Calcular direção do scroll
    let scrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;
    
    if (scrollY > lastScrollY.current) {
      scrollDirection = 'down';
    } else if (scrollY < lastScrollY.current) {
      scrollDirection = 'up';
    } else if (scrollX > lastScrollX.current) {
      scrollDirection = 'right';
    } else if (scrollX < lastScrollX.current) {
      scrollDirection = 'left';
    }
    
    // Informações do scroll
    const scrollInfo: ScrollInfo = {
      scrollY,
      scrollX,
      scrollDirection,
      isAtTop: scrollY <= 0,
      isAtBottom: scrollHeight > 0 ? scrollY >= scrollHeight - 5 : false, // 5px de tolerância
      scrollPercentage: scrollHeight > 0 ? Math.round((scrollY / scrollHeight) * 100) : 0
    };
    
    // Callback principal
    if (onScroll) {
      onScroll(scrollInfo);
    }
    
    // Atualizar referências
    lastScrollY.current = scrollY;
    lastScrollX.current = scrollX;
    
    // Timer para detectar fim do scroll
    if (detectScrollEnd) {
      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
      scrollEndTimer.current = setTimeout(handleScrollEnd, scrollEndDelay);
    }
  }, [element, onScroll, onScrollStart, handleScrollEnd, detectScrollEnd, scrollEndDelay]);

  // Throttled scroll handler
  const throttledScrollHandler = useCallback(
    throttle(handleScroll, throttleMs, { leading: true, trailing: true }),
    [throttle, handleScroll, throttleMs]
  );

  useEffect(() => {
    const target = element || window;
    
    // Adicionar event listener
    target.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    return () => {
      target.removeEventListener('scroll', throttledScrollHandler);
      
      // Limpar timers
      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }
      
      // Cancelar throttle
      if ('cancel' in throttledScrollHandler) {
        throttledScrollHandler.cancel();
      }
    };
  }, [element, throttledScrollHandler]);

  return {
    lastScrollY: lastScrollY.current,
    lastScrollX: lastScrollX.current,
    isScrolling: isScrolling.current
  };
}