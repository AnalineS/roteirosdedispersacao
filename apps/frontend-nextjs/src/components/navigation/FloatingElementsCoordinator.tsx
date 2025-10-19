'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface FloatingElement {
  id: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  priority: number; // 1 = highest priority
  size: 'small' | 'medium' | 'large';
  isVisible: boolean;
  component: React.ReactNode;
}

interface FloatingElementsContextType {
  registerElement: (element: Omit<FloatingElement, 'isVisible'>) => void;
  unregisterElement: (id: string) => void;
  updateElementVisibility: (id: string, isVisible: boolean) => void;
  getOptimalPosition: (preferredPosition: string, size: string) => string;
  getRegisteredElements: () => FloatingElement[];
}

const FloatingElementsContext = createContext<FloatingElementsContextType | null>(null);

interface FloatingElementsCoordinatorProps {
  children: React.ReactNode;
}

export function FloatingElementsCoordinator({ children }: FloatingElementsCoordinatorProps) {
  const [elements, setElements] = useState<Map<string, FloatingElement>>(new Map());
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(window.innerWidth < 768);
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const registerElement = useCallback((element: Omit<FloatingElement, 'isVisible'>) => {
    setElements(prev => {
      const newElements = new Map(prev);
      newElements.set(element.id, { ...element, isVisible: true });
      return newElements;
    });
  }, []);

  const unregisterElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = new Map(prev);
      newElements.delete(id);
      return newElements;
    });
  }, []);

  const updateElementVisibility = useCallback((id: string, isVisible: boolean) => {
    setElements(prev => {
      const newElements = new Map(prev);
      const element = newElements.get(id);
      if (element) {
        newElements.set(id, { ...element, isVisible });
      }
      return newElements;
    });
  }, []);

  const getOptimalPosition = useCallback((preferredPosition: string, size: string) => {
    const visibleElements = Array.from(elements.values()).filter(el => el.isVisible);
    
    // Em mobile, priorizar posições que não conflitam com thumb zones
    if (isMobile) {
      // Thumb zones: bottom-right (right hand), bottom-left (left hand)
      const occupiedPositions = visibleElements.map(el => el.position);
      
      // Se bottom-right está ocupado, sugerir bottom-left
      if (preferredPosition === 'bottom-right' && occupiedPositions.includes('bottom-right')) {
        return 'bottom-left';
      }
      
      // Se bottom-left está ocupado, sugerir top-right
      if (preferredPosition === 'bottom-left' && occupiedPositions.includes('bottom-left')) {
        return 'top-right';
      }
    }

    // Desktop: verificar conflitos e espaçamento
    const positionCounts = visibleElements.reduce((acc, el) => {
      acc[el.position] = (acc[el.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Se posição preferida tem muitos elementos, sugerir alternativa
    if (positionCounts[preferredPosition] >= 2) {
      const alternatives: Record<string, string[]> = {
        'bottom-right': ['bottom-left', 'top-right', 'top-left'],
        'bottom-left': ['bottom-right', 'top-left', 'top-right'],
        'top-right': ['top-left', 'bottom-right', 'bottom-left'],
        'top-left': ['top-right', 'bottom-left', 'bottom-right']
      };

      for (const alt of alternatives[preferredPosition] || []) {
        if ((positionCounts[alt] || 0) < 2) {
          return alt;
        }
      }
    }

    return preferredPosition;
  }, [elements, isMobile]);

  const getRegisteredElements = useCallback(() => {
    return Array.from(elements.values());
  }, [elements]);

  const contextValue: FloatingElementsContextType = {
    registerElement,
    unregisterElement,
    updateElementVisibility,
    getOptimalPosition,
    getRegisteredElements
  };

  return (
    <FloatingElementsContext.Provider value={contextValue}>
      {children}
      {/* Render floating elements container */}
      <FloatingElementsRenderer elements={Array.from(elements.values())} />
    </FloatingElementsContext.Provider>
  );
}

// Componente para renderizar elementos flutuantes
function FloatingElementsRenderer({ elements }: { elements: FloatingElement[] }) {
  const visibleElements = elements.filter(el => el.isVisible);
  
  return (
    <div className="floating-elements-container" style={{ position: 'fixed', zIndex: 1000, pointerEvents: 'none' }}>
      {visibleElements.map((element) => {
        const position = getPositionStyles(element.position, element.size);
        
        return (
          <div
            key={element.id}
            style={{
              position: 'fixed',
              ...position,
              pointerEvents: 'auto',
              zIndex: 1000 + element.priority
            }}
          >
            {element.component}
          </div>
        );
      })}
    </div>
  );
}

// Calcular estilos de posição baseado na posição e tamanho
function getPositionStyles(position: string, size: string) {
  const margins = {
    small: '16px',
    medium: '20px', 
    large: '24px'
  };

  const margin = margins[size as keyof typeof margins] || margins.medium;

  switch (position) {
    case 'top-left':
      return { top: margin, left: margin };
    case 'top-right':
      return { top: margin, right: margin };
    case 'bottom-left':
      return { bottom: margin, left: margin };
    case 'bottom-right':
      return { bottom: margin, right: margin };
    default:
      return { bottom: margin, right: margin };
  }
}

// Hook para usar o coordenador
export function useFloatingElements() {
  const context = useContext(FloatingElementsContext);
  if (!context) {
    throw new Error('useFloatingElements must be used within FloatingElementsCoordinator');
  }
  return context;
}

// Hook específico para registrar um elemento flutuante
export function useFloatingElement(
  id: string,
  preferredPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  priority: number = 5,
  size: 'small' | 'medium' | 'large' = 'medium'
) {
  const { registerElement, unregisterElement, updateElementVisibility, getOptimalPosition } = useFloatingElements();
  const [optimalPosition, setOptimalPosition] = useState(preferredPosition);

  useEffect(() => {
    // Registrar elemento
    registerElement({
      id,
      position: preferredPosition,
      priority,
      size,
      component: null // Será definido pelo componente filho
    });

    // Calcular posição ótima
    const optimal = getOptimalPosition(preferredPosition, size);
    setOptimalPosition(optimal as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right');

    return () => {
      unregisterElement(id);
    };
  }, [id, preferredPosition, priority, size, registerElement, unregisterElement, getOptimalPosition]);

  return {
    optimalPosition,
    updateVisibility: (isVisible: boolean) => updateElementVisibility(id, isVisible)
  };
}