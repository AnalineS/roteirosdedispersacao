/**
 * Mobile-First Framework - ETAPA 4 UX TRANSFORMATION
 * Sistema completo de interface mobile-first para aplicações médicas
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Interface otimizada para profissionais de saúde em movimento
 * - Mobile-First: 60%+ usuários em dispositivos móveis
 * - Touch-Friendly: Todos os elementos ≥44px, gestos naturais
 * - Performance: Core Web Vitals >90, carregamento rápido
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getUnbColors } from '@/config/modernTheme';

// Interfaces para o framework mobile
interface TouchTarget {
  minSize: number;
  padding: number;
  margin: number;
}

interface MobileBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  threshold: number;
  onSwipe: (direction: string) => void;
}

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
  touchTargetSize?: 'small' | 'medium' | 'large';
  enableSwipeGestures?: boolean;
  fullscreen?: boolean;
}

// Configurações do framework
const MOBILE_CONFIG = {
  touchTargets: {
    small: { minSize: 44, padding: 12, margin: 8 },
    medium: { minSize: 48, padding: 16, margin: 12 },
    large: { minSize: 56, padding: 20, margin: 16 }
  } as Record<string, TouchTarget>,
  
  breakpoints: {
    mobile: '320px',
    tablet: '768px', 
    desktop: '1024px'
  } as MobileBreakpoints,
  
  gestures: {
    swipeThreshold: 50,
    tapDelay: 100,
    longPressDelay: 500
  },
  
  performance: {
    lazyLoadThreshold: '100px',
    imageOptimization: true,
    prefetchDelay: 2000
  }
};

// Hook para detecção de dispositivo mobile
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [touchSupport, setTouchSupport] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
      setOrientation(width < height ? 'portrait' : 'landscape');
      setTouchSupport('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation,
    touchSupport,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
}

// Hook para gestos de swipe
export function useSwipeGestures(config: SwipeGesture) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (Math.abs(distanceX) > config.threshold || Math.abs(distanceY) > config.threshold) {
      if (isHorizontalSwipe) {
        const direction = distanceX > 0 ? 'left' : 'right';
        config.onSwipe(direction);
      } else {
        const direction = distanceY > 0 ? 'up' : 'down';
        config.onSwipe(direction);
      }
    }
  }, [config]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}

// Componente principal do framework mobile
export default function MobileFirstFramework({
  children,
  className = '',
  touchTargetSize = 'medium',
  enableSwipeGestures = false,
  fullscreen = false
}: MobileOptimizedProps) {
  const { isMobile, isTablet, touchSupport, orientation } = useMobileDetection();
  const unbColors = getUnbColors();
  const touchConfig = MOBILE_CONFIG.touchTargets[touchTargetSize];

  const swipeHandlers = useSwipeGestures({
    direction: 'left',
    threshold: MOBILE_CONFIG.gestures.swipeThreshold,
    onSwipe: (direction) => {
      console.log(`Swipe detected: ${direction}`);
      // Custom swipe logic can be implemented here
    }
  });

  const containerStyle = {
    width: '100%',
    minHeight: fullscreen ? '100vh' : 'auto',
    padding: `${touchConfig.padding}px`,
    margin: 0,
    boxSizing: 'border-box' as const,
    position: fullscreen ? 'relative' as const : undefined,
    overflow: fullscreen ? 'hidden' as const : undefined,
    // Otimizações para touch
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none' as const,
    touchAction: 'manipulation' as const
  };

  return (
    <>
      <div
        className={`mobile-first-container ${className}`}
        style={containerStyle}
        {...(enableSwipeGestures && touchSupport ? swipeHandlers : {})}
      >
        {children}
      </div>

      {/* CSS global para mobile-first */}
      <style jsx global>{`
        /* === MOBILE-FIRST BASE STYLES === */
        
        /* Touch targets - minimum 44px */
        .mobile-touch-target,
        button,
        [role="button"],
        input,
        select,
        textarea,
        a[href] {
          min-height: ${touchConfig.minSize}px !important;
          min-width: ${touchConfig.minSize}px !important;
          padding: ${touchConfig.padding}px !important;
          margin: ${touchConfig.margin / 2}px !important;
          
          /* Touch optimizations */
          -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
          touch-action: manipulation;
        }
        
        /* Text inputs específicos */
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="search"],
        textarea {
          user-select: text !important;
          -webkit-user-select: text !important;
          font-size: 16px !important; /* Previne zoom no iOS */
        }
        
        /* === RESPONSIVE TYPOGRAPHY === */
        
        /* Mobile-first typography scaling */
        .mobile-text-xs { font-size: clamp(0.75rem, 2vw, 0.875rem); }
        .mobile-text-sm { font-size: clamp(0.875rem, 2.5vw, 1rem); }
        .mobile-text-base { font-size: clamp(1rem, 3vw, 1.125rem); }
        .mobile-text-lg { font-size: clamp(1.125rem, 3.5vw, 1.25rem); }
        .mobile-text-xl { font-size: clamp(1.25rem, 4vw, 1.5rem); }
        .mobile-text-2xl { font-size: clamp(1.5rem, 5vw, 2rem); }
        
        /* === MOBILE SPACING SYSTEM === */
        
        .mobile-space-xs { margin: ${touchConfig.margin / 4}px; }
        .mobile-space-sm { margin: ${touchConfig.margin / 2}px; }
        .mobile-space-md { margin: ${touchConfig.margin}px; }
        .mobile-space-lg { margin: ${touchConfig.margin * 2}px; }
        .mobile-space-xl { margin: ${touchConfig.margin * 3}px; }
        
        .mobile-gap-xs { gap: ${touchConfig.margin / 4}px; }
        .mobile-gap-sm { gap: ${touchConfig.margin / 2}px; }
        .mobile-gap-md { gap: ${touchConfig.margin}px; }
        .mobile-gap-lg { gap: ${touchConfig.margin * 2}px; }
        .mobile-gap-xl { gap: ${touchConfig.margin * 3}px; }
        
        /* === MOBILE GRID SYSTEM === */
        
        .mobile-grid {
          display: grid;
          gap: ${touchConfig.margin}px;
          padding: ${touchConfig.padding}px;
        }
        
        .mobile-grid-1 { grid-template-columns: 1fr; }
        .mobile-grid-2 { grid-template-columns: repeat(2, 1fr); }
        .mobile-grid-auto { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        
        /* === MOBILE FLEX LAYOUTS === */
        
        .mobile-flex {
          display: flex;
          gap: ${touchConfig.margin}px;
          align-items: center;
        }
        
        .mobile-flex-col {
          display: flex;
          flex-direction: column;
          gap: ${touchConfig.margin}px;
        }
        
        .mobile-flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${touchConfig.margin}px;
        }
        
        /* === MOBILE CARDS & CONTAINERS === */
        
        .mobile-card {
          background: white;
          border-radius: 12px;
          padding: ${touchConfig.padding}px;
          margin: ${touchConfig.margin}px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        
        .mobile-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1000;
          padding: ${touchConfig.padding}px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        /* === MEDICAL CONTEXT SPECIFIC === */
        
        /* Alertas médicos mobile */
        .mobile-medical-alert {
          padding: ${touchConfig.padding}px;
          margin: ${touchConfig.margin}px 0;
          border-radius: 8px;
          border-left: 4px solid;
          font-weight: 500;
          min-height: ${touchConfig.minSize}px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .mobile-medical-alert.critical {
          background: #fee2e2;
          border-color: #dc2626;
          color: #991b1b;
        }
        
        .mobile-medical-alert.warning {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #92400e;
        }
        
        .mobile-medical-alert.info {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1d4ed8;
        }
        
        /* Dosagem mobile-optimized */
        .mobile-dosage-card {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: ${touchConfig.padding}px;
          margin: ${touchConfig.margin}px 0;
          text-align: center;
          min-height: ${touchConfig.minSize + 20}px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        /* === PERFORMANCE OPTIMIZATIONS === */
        
        /* Smooth scrolling */
        .mobile-scroll {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        /* Image optimization */
        .mobile-image {
          width: 100%;
          height: auto;
          object-fit: cover;
          border-radius: 8px;
          loading: lazy;
        }
        
        /* === BREAKPOINT-SPECIFIC STYLES === */
        
        /* Mobile portrait (320px - 479px) */
        @media (max-width: 479px) {
          .mobile-grid-2 { grid-template-columns: 1fr; }
          .mobile-text-responsive { font-size: 0.875rem; }
          
          .mobile-container {
            padding: ${touchConfig.padding / 2}px;
          }
          
          .mobile-modal {
            padding: ${touchConfig.padding / 2}px;
          }
        }
        
        /* Mobile landscape (480px - 767px) */
        @media (min-width: 480px) and (max-width: 767px) and (orientation: landscape) {
          .mobile-flex {
            flex-direction: row;
          }
          
          .mobile-grid-auto {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }
        
        /* Tablet (768px - 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .mobile-grid-auto {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
          
          .mobile-container {
            padding: ${touchConfig.padding * 1.5}px;
          }
        }
        
        /* Desktop (1024px+) */
        @media (min-width: 1024px) {
          .mobile-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: ${touchConfig.padding * 2}px;
          }
          
          /* Hover states only on desktop */
          .mobile-touch-target:hover,
          button:hover,
          [role="button"]:hover {
            background-color: ${unbColors.alpha.secondary};
            transform: translateY(-1px);
            transition: all 0.2s ease;
          }
        }
        
        /* === ACCESSIBILITY ENHANCEMENTS === */
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .mobile-card,
          .mobile-modal,
          .mobile-medical-alert {
            border-width: 2px;
            border-style: solid;
            border-color: currentColor;
          }
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Dark mode preparation */
        @media (prefers-color-scheme: dark) {
          .mobile-card {
            background: #1e293b;
            border-color: #334155;
            color: #e2e8f0;
          }
          
          .mobile-modal {
            background: #0f172a;
            color: #e2e8f0;
          }
        }
        
        /* === GESTURE OPTIMIZATIONS === */
        
        /* Prevent text selection on gestures */
        .mobile-gesture-area {
          -webkit-touch-callout: none;
          touch-action: pan-y pinch-zoom;
        }
        
        /* Enable text selection for content by default */
        body, p, span, div, h1, h2, h3, h4, h5, h6, article, section, main, li, td, th, label, blockquote, pre, code {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        
        /* Disable text selection only for interactive elements */
        button, [role="button"], .no-select {
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Safe area for devices with notches */
        .mobile-safe-area {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        /* === LOADING STATES === */
        
        .mobile-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: mobile-loading 1.5s infinite;
          border-radius: 4px;
        }
        
        @keyframes mobile-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* === MEDICAL CONTEXT OPTIMIZATIONS === */
        
        /* Prescription card mobile */
        .mobile-prescription {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: ${touchConfig.padding}px;
          margin: ${touchConfig.margin}px 0;
          min-height: ${touchConfig.minSize * 2}px;
        }
        
        /* Emergency contact mobile */
        .mobile-emergency {
          background: #fee2e2;
          border: 2px solid #dc2626;
          border-radius: 12px;
          padding: ${touchConfig.padding}px;
          margin: ${touchConfig.margin}px 0;
          text-align: center;
          font-weight: bold;
          color: #991b1b;
          min-height: ${touchConfig.minSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}

// Componentes utilitários específicos para mobile
export const MobileCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'medical' | 'prescription' | 'emergency';
  [key: string]: any;
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'medical': return 'mobile-medical-alert info';
      case 'prescription': return 'mobile-prescription';
      case 'emergency': return 'mobile-emergency';
      default: return 'mobile-card';
    }
  };

  return (
    <div className={`${getVariantClass()} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const MobileButton = ({ 
  children, 
  className = '', 
  size = 'medium',
  variant = 'primary',
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'emergency';
  [key: string]: any;
}) => {
  const unbColors = getUnbColors();
  const sizeConfig = MOBILE_CONFIG.touchTargets[size];
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: unbColors.primary,
          color: 'white',
          border: `2px solid ${unbColors.primary}`
        };
      case 'secondary':
        return {
          background: 'transparent',
          color: unbColors.primary,
          border: `2px solid ${unbColors.primary}`
        };
      case 'emergency':
        return {
          background: '#dc2626',
          color: 'white',
          border: '2px solid #dc2626'
        };
      default:
        return {};
    }
  };

  return (
    <button
      className={`mobile-touch-target ${className}`}
      style={{
        minHeight: `${sizeConfig.minSize}px`,
        minWidth: `${sizeConfig.minSize}px`,
        padding: `${sizeConfig.padding}px`,
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...getVariantStyles()
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const MobileGrid = ({ 
  children, 
  columns = 'auto',
  className = '',
  ...props 
}: { 
  children: React.ReactNode; 
  columns?: '1' | '2' | 'auto';
  className?: string;
  [key: string]: any;
}) => {
  return (
    <div className={`mobile-grid mobile-grid-${columns} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Framework exports - removido duplicatas