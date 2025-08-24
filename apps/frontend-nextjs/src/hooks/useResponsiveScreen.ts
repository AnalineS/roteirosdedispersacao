'use client';

import { useState, useEffect } from 'react';

export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
  orientation: 'portrait' | 'landscape';
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

export interface ResponsiveFABConfig {
  size: number;
  bottomOffset: number;
  rightOffset: number;
  miniChatWidth: number;
  miniChatHeight: number;
  zIndex: number;
}

const getScreenSize = (): ScreenSize => {
  if (typeof window === 'undefined') {
    return {
      width: 1200,
      height: 800,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeDesktop: false,
      deviceType: 'desktop',
      orientation: 'landscape',
      breakpoint: 'lg'
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Breakpoints responsivos
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024 && width < 1440;
  const isLargeDesktop = width >= 1440;
  
  let deviceType: ScreenSize['deviceType'] = 'desktop';
  let breakpoint: ScreenSize['breakpoint'] = 'lg';
  
  if (isMobile) {
    deviceType = 'mobile';
    breakpoint = width < 480 ? 'xs' : 'sm';
  } else if (isTablet) {
    deviceType = 'tablet';
    breakpoint = 'md';
  } else if (isLargeDesktop) {
    deviceType = 'large-desktop';
    breakpoint = width >= 1920 ? 'xxl' : 'xl';
  }
  
  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    deviceType,
    orientation,
    breakpoint
  };
};

export const getFABConfig = (screenSize: ScreenSize): ResponsiveFABConfig => {
  const { deviceType, width, height, orientation } = screenSize;
  
  switch (deviceType) {
    case 'mobile':
      return {
        size: orientation === 'portrait' ? 56 : 48,
        bottomOffset: orientation === 'portrait' ? 20 : 16,
        rightOffset: 16,
        miniChatWidth: Math.min(width - 32, 300),
        miniChatHeight: Math.min(height - 120, 350),
        zIndex: 1050
      };
      
    case 'tablet':
      return {
        size: 60,
        bottomOffset: 24,
        rightOffset: 20,
        miniChatWidth: 340,
        miniChatHeight: 400,
        zIndex: 1040
      };
      
    case 'large-desktop':
      return {
        size: 72,
        bottomOffset: 32,
        rightOffset: 32,
        miniChatWidth: 380,
        miniChatHeight: 480,
        zIndex: 1030
      };
      
    default: // desktop
      return {
        size: 64,
        bottomOffset: 24,
        rightOffset: 24,
        miniChatWidth: 320,
        miniChatHeight: 400,
        zIndex: 1035
      };
  }
};

export const useResponsiveScreen = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>(getScreenSize);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const updateScreenSize = () => {
      setScreenSize(getScreenSize());
    };

    // Atualizar no resize com debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', updateScreenSize);
    
    // Update inicial para garantir valores corretos
    updateScreenSize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateScreenSize);
      clearTimeout(timeoutId);
    };
  }, []);

  const fabConfig = getFABConfig(screenSize);

  return {
    screenSize,
    fabConfig,
    isClient,
    // Helpers úteis
    isMobileView: screenSize.isMobile,
    isTabletView: screenSize.isTablet,
    isDesktopView: screenSize.isDesktop || screenSize.isLargeDesktop,
    isPortrait: screenSize.orientation === 'portrait',
    isLandscape: screenSize.orientation === 'landscape',
    // Breakpoint helpers
    isXs: screenSize.breakpoint === 'xs',
    isSm: screenSize.breakpoint === 'sm', 
    isMd: screenSize.breakpoint === 'md',
    isLg: screenSize.breakpoint === 'lg',
    isXl: screenSize.breakpoint === 'xl',
    isXxl: screenSize.breakpoint === 'xxl'
  };
};

// Hook específico para o FAB com detecção de página
export const useFABVisibility = () => {
  const { fabConfig, screenSize, isClient } = useResponsiveScreen();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isClient) return;

    // Detectar página atual
    const pathname = window.location.pathname;
    
    // Páginas onde o FAB não deve aparecer
    const excludedPaths = ['/chat', '/chat/'];
    const shouldHide = excludedPaths.some(path => pathname.startsWith(path));
    
    setIsVisible(!shouldHide);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    // Verificar se foi fechado na sessão atual
    const fabClosed = sessionStorage.getItem('fab_closed');
    if (fabClosed) {
      try {
        const data = JSON.parse(fabClosed);
        if (data.closed) {
          setIsVisible(false);
        }
      } catch (error) {
        sessionStorage.removeItem('fab_closed');
      }
    }
  }, [isClient]);

  const closeFAB = () => {
    setIsVisible(false);
    sessionStorage.setItem('fab_closed', JSON.stringify({
      timestamp: Date.now(),
      closed: true
    }));
  };

  const showFAB = () => {
    setIsVisible(true);
    sessionStorage.removeItem('fab_closed');
  };

  return {
    isVisible,
    closeFAB,
    showFAB,
    fabConfig,
    screenSize,
    isClient
  };
};