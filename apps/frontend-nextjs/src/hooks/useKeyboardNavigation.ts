'use client';

import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardNavigationOptions {
  containerRef?: RefObject<HTMLElement>;
  onEscape?: () => void;
  onEnter?: (element: HTMLElement) => void;
  trapFocus?: boolean;
  enableArrowKeys?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    containerRef,
    onEscape,
    onEnter,
    trapFocus = false,
    enableArrowKeys = false
  } = options;

  // Seletores para elementos focáveis
  const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="menuitem"]:not([disabled])'
  ].join(', ');

  const getFocusableElements = useCallback(() => {
    const container = containerRef?.current || document;
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
  }, [containerRef]);

  const getNextFocusableElement = useCallback((currentElement: HTMLElement, direction: 'next' | 'prev') => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(currentElement);
    
    if (currentIndex === -1) return null;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= elements.length) {
        nextIndex = trapFocus ? 0 : elements.length - 1;
      }
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = trapFocus ? elements.length - 1 : 0;
      }
    }
    
    return elements[nextIndex];
  }, [getFocusableElements, trapFocus]);

  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    const target = keyboardEvent.target as HTMLElement;
    
    switch (keyboardEvent.key) {
      case 'Escape':
        keyboardEvent.preventDefault();
        onEscape?.();
        break;
        
      case 'Enter':
      case ' ': // Space
        // Only handle Enter/Space for elements that don't naturally handle them
        if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
          keyboardEvent.preventDefault();
          onEnter?.(target);
          // Simulate click for elements with role="button"
          if (target.getAttribute('role') === 'button') {
            target.click();
          }
        }
        break;
        
      case 'Tab':
        if (trapFocus) {
          keyboardEvent.preventDefault();
          const nextElement = getNextFocusableElement(target, keyboardEvent.shiftKey ? 'prev' : 'next');
          nextElement?.focus();
        }
        break;
        
      case 'ArrowDown':
      case 'ArrowUp':
        if (enableArrowKeys) {
          keyboardEvent.preventDefault();
          const direction = keyboardEvent.key === 'ArrowDown' ? 'next' : 'prev';
          const nextElement = getNextFocusableElement(target, direction);
          nextElement?.focus();
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowRight':
        if (enableArrowKeys) {
          keyboardEvent.preventDefault();
          const direction = keyboardEvent.key === 'ArrowRight' ? 'next' : 'prev';
          const nextElement = getNextFocusableElement(target, direction);
          nextElement?.focus();
        }
        break;
        
      case 'Home':
        if (enableArrowKeys) {
          keyboardEvent.preventDefault();
          const elements = getFocusableElements();
          elements[0]?.focus();
        }
        break;
        
      case 'End':
        if (enableArrowKeys) {
          keyboardEvent.preventDefault();
          const elements = getFocusableElements();
          elements[elements.length - 1]?.focus();
        }
        break;
    }
  }, [onEscape, onEnter, getNextFocusableElement, trapFocus, enableArrowKeys, getFocusableElements]);

  useEffect(() => {
    const container = containerRef?.current || document;
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  // Utility functions
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    elements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    elements[elements.length - 1]?.focus();
  }, [getFocusableElements]);

  const focusElement = useCallback((selector: string) => {
    const container = containerRef?.current || document;
    const element = container.querySelector(selector) as HTMLElement;
    element?.focus();
  }, [containerRef]);

  return {
    focusFirst,
    focusLast,
    focusElement,
    getFocusableElements
  };
}

// Hook específico para navegação em sidebar
export function useSidebarKeyboardNavigation(
  isOpen: boolean,
  onClose: () => void,
  sidebarRef: RefObject<HTMLElement>
) {
  return useKeyboardNavigation({
    containerRef: sidebarRef,
    onEscape: isOpen ? onClose : undefined,
    trapFocus: isOpen,
    enableArrowKeys: true
  });
}

// Hook para navegação em breadcrumbs
export function useBreadcrumbsKeyboardNavigation(
  containerRef: RefObject<HTMLElement>
) {
  return useKeyboardNavigation({
    containerRef,
    enableArrowKeys: true
  });
}