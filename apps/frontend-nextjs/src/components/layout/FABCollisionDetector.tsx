'use client';

import React, { useEffect, useState } from 'react';
import { useResponsiveScreen } from '@/hooks/useResponsiveScreen';

interface FABCollisionDetectorProps {
  children: React.ReactNode;
  fabSize?: number;
  excludeFromCollisionDetection?: boolean;
}

/**
 * Componente que detecta possíveis colisões do FAB com elementos da página
 * e aplica padding automático para evitar sobreposição
 */
export default function FABCollisionDetector({ 
  children, 
  fabSize, 
  excludeFromCollisionDetection = false 
}: FABCollisionDetectorProps) {
  const { fabConfig, screenSize, isClient } = useResponsiveScreen();
  const [hasBottomRightContent, setHasBottomRightContent] = useState(false);
  
  // Usar o tamanho do FAB da configuração responsiva se não fornecido
  const effectiveFabSize = fabSize || fabConfig.size;
  
  // Calcular área de proteção do FAB
  const fabProtectionZone = {
    width: effectiveFabSize + (fabConfig.rightOffset * 2),
    height: effectiveFabSize + (fabConfig.bottomOffset * 2)
  };

  useEffect(() => {
    if (!isClient || excludeFromCollisionDetection) return;

    const detectCollisions = () => {
      // Detectar elementos que podem colidir com o FAB
      const bottomRightElements = document.querySelectorAll('[data-fab-collision], .fixed, .sticky, .floating');
      
      let hasCollision = false;
      
      bottomRightElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const fabArea = {
          left: window.innerWidth - fabProtectionZone.width,
          top: window.innerHeight - fabProtectionZone.height,
          right: window.innerWidth,
          bottom: window.innerHeight
        };
        
        // Verificar se há sobreposição
        const isOverlapping = !(
          rect.right < fabArea.left ||
          rect.left > fabArea.right ||
          rect.bottom < fabArea.top ||
          rect.top > fabArea.bottom
        );
        
        if (isOverlapping) {
          hasCollision = true;
        }
      });
      
      setHasBottomRightContent(hasCollision);
    };

    // Detectar colisões inicialmente e em mudanças de tamanho
    detectCollisions();
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(detectCollisions);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Detectar em scroll e resize
    let timeout: NodeJS.Timeout;
    const debouncedDetection = () => {
      clearTimeout(timeout);
      timeout = setTimeout(detectCollisions, 100);
    };

    window.addEventListener('scroll', debouncedDetection);
    window.addEventListener('resize', debouncedDetection);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', debouncedDetection);
      window.removeEventListener('resize', debouncedDetection);
      clearTimeout(timeout);
    };
  }, [isClient, excludeFromCollisionDetection, effectiveFabSize, fabProtectionZone.width, fabProtectionZone.height]);

  if (!isClient) return <>{children}</>;

  return (
    <div 
      style={{
        // Aplicar padding apenas se houver colisão detectada
        paddingRight: hasBottomRightContent ? `${fabProtectionZone.width}px` : undefined,
        paddingBottom: hasBottomRightContent ? `${fabProtectionZone.height}px` : undefined,
        transition: 'padding 0.3s ease',
        // Adicionar informação para debugging (removível em produção)
        position: 'relative'
      }}
      data-fab-collision-detector={hasBottomRightContent}
    >
      {children}
      
      {/* Área de debug visual (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && hasBottomRightContent && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: `${fabProtectionZone.width}px`,
            height: `${fabProtectionZone.height}px`,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px dashed rgba(255, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'rgba(255, 0, 0, 0.7)'
          }}
        >
          FAB Zone
        </div>
      )}
    </div>
  );
}

// Hook para marcar elementos que podem colidir com o FAB
export const useFABCollisionAware = (elementRef: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Adicionar atributo para detecção de colisão
    element.setAttribute('data-fab-collision', 'true');
    
    return () => {
      element.removeAttribute('data-fab-collision');
    };
  }, [elementRef]);
};

// Componente para marcar áreas específicas como FAB-aware
export const FABCollisionZone: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <div 
    data-fab-collision="true"
    className={className}
    style={style}
  >
    {children}
  </div>
);