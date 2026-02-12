'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { usePathname } from 'next/navigation';

interface NavigationState {
  currentContext: 'home' | 'learning' | 'interaction' | 'tools' | 'institutional';
  userLevel: 'beginner' | 'intermediate' | 'expert';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  showFullNavigation: boolean;
  prioritizedFeatures: string[];
}

interface SmartNavigationContextType {
  navigationState: NavigationState;
  updateUserLevel: (level: NavigationState['userLevel']) => void;
  toggleNavigationMode: () => void;
  getRecommendedNavigation: () => NavigationRecommendation;
  shouldShowElement: (elementId: string) => boolean;
}

interface NavigationRecommendation {
  primaryNavigation: 'header' | 'sidebar' | 'fab' | 'minimal';
  secondaryNavigation: 'breadcrumbs' | 'contextual' | 'none';
  showQuickAccess: boolean;
  maxVisibleItems: number;
}

const SmartNavigationContext = createContext<SmartNavigationContextType | null>(null);

export function SmartNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    const defaults: NavigationState = {
      currentContext: 'home',
      userLevel: 'intermediate',
      deviceType: 'desktop',
      showFullNavigation: false,
      prioritizedFeatures: []
    };
    if (typeof window === 'undefined') return defaults;
    // Load user preferences from localStorage
    const savedLevel = safeLocalStorage()?.getItem('userNavigationLevel') as NavigationState['userLevel'];
    const showFull = safeLocalStorage()?.getItem('showFullNavigation') === 'true';
    // Detect device type
    const width = window.innerWidth;
    let deviceType: NavigationState['deviceType'] = 'desktop';
    if (width < 768) deviceType = 'mobile';
    else if (width < 1024) deviceType = 'tablet';
    return {
      ...defaults,
      deviceType,
      ...(savedLevel ? { userLevel: savedLevel, showFullNavigation: showFull } : {})
    };
  });

  // Detectar contexto atual baseado na URL
  useEffect(() => {
    let context: NavigationState['currentContext'] = 'home';

    if (pathname?.startsWith('/modules') || pathname?.startsWith('/dashboard')) {
      context = 'learning';
    } else if (pathname?.startsWith('/chat')) {
      context = 'interaction';
    } else if (pathname?.startsWith('/resources') || pathname?.includes('calculator') || pathname?.includes('checklist')) {
      context = 'tools';
    } else if (pathname?.startsWith('/sobre') || pathname?.startsWith('/equipe')) {
      context = 'institutional';
    }

    setNavigationState(prev => ({ ...prev, currentContext: context }));
  }, [pathname]);

  // Detectar tipo de dispositivo on resize
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      let deviceType: NavigationState['deviceType'] = 'desktop';

      if (width < 768) {
        deviceType = 'mobile';
      } else if (width < 1024) {
        deviceType = 'tablet';
      }

      setNavigationState(prev => ({ ...prev, deviceType }));
    };

    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const updateUserLevel = (level: NavigationState['userLevel']) => {
    setNavigationState(prev => ({ ...prev, userLevel: level }));
    safeLocalStorage()?.setItem('userNavigationLevel', level);
  };

  const toggleNavigationMode = () => {
    setNavigationState(prev => {
      const newShowFull = !prev.showFullNavigation;
      safeLocalStorage()?.setItem('showFullNavigation', String(newShowFull));
      return { ...prev, showFullNavigation: newShowFull };
    });
  };

  const getRecommendedNavigation = (): NavigationRecommendation => {
    const { deviceType, userLevel, currentContext, showFullNavigation } = navigationState;

    // Usuário experiente ou modo completo ativado
    if (userLevel === 'expert' || showFullNavigation) {
      return {
        primaryNavigation: deviceType === 'mobile' ? 'fab' : 'header',
        secondaryNavigation: 'breadcrumbs',
        showQuickAccess: true,
        maxVisibleItems: deviceType === 'mobile' ? 6 : 12
      };
    }

    // Usuário iniciante - navegação simplificada
    if (userLevel === 'beginner') {
      return {
        primaryNavigation: deviceType === 'mobile' ? 'fab' : 'minimal',
        secondaryNavigation: 'contextual',
        showQuickAccess: false,
        maxVisibleItems: deviceType === 'mobile' ? 3 : 6
      };
    }

    // Usuário intermediário - navegação contextual
    return {
      primaryNavigation: deviceType === 'mobile' ? 'fab' : 'header',
      secondaryNavigation: currentContext === 'home' ? 'none' : 'breadcrumbs',
      showQuickAccess: true,
      maxVisibleItems: deviceType === 'mobile' ? 4 : 8
    };
  };

  const shouldShowElement = (elementId: string): boolean => {
    const recommendation = getRecommendedNavigation();
    const { currentContext, deviceType } = navigationState;

    // Regras específicas por elemento
    const elementRules: Record<string, boolean> = {
      // Header principal
      'main-header': recommendation.primaryNavigation === 'header',

      // Quick navigation FAB
      'quick-nav-fab': recommendation.primaryNavigation === 'fab' || deviceType === 'mobile',

      // Breadcrumbs
      'breadcrumbs': recommendation.secondaryNavigation === 'breadcrumbs',

      // Quick access bar
      'quick-access': recommendation.showQuickAccess,

      // Footer navigation
      'footer-nav': currentContext === 'home' || recommendation.primaryNavigation === 'minimal',

      // Persona FAB - sempre visível mas posição adaptada
      'persona-fab': true,

      // Tour guide - apenas para iniciantes
      'tour-guide': navigationState.userLevel === 'beginner',

      // Advanced tools - apenas para intermediários/experts
      'advanced-tools': navigationState.userLevel !== 'beginner'
    };

    return elementRules[elementId] ?? true;
  };

  const contextValue: SmartNavigationContextType = useMemo(() => ({
    navigationState,
    updateUserLevel,
    toggleNavigationMode,
    getRecommendedNavigation,
    shouldShowElement
  }), [navigationState, updateUserLevel, toggleNavigationMode, getRecommendedNavigation, shouldShowElement]);

  return (
    <SmartNavigationContext.Provider value={contextValue}>
      {children}
    </SmartNavigationContext.Provider>
  );
}

export function useSmartNavigation() {
  const context = useContext(SmartNavigationContext);
  if (!context) {
    throw new Error('useSmartNavigation must be used within SmartNavigationProvider');
  }
  return context;
}

// Hook para verificar se deve mostrar um componente específico
export function useNavigationVisibility(elementId: string) {
  const { shouldShowElement } = useSmartNavigation();
  return shouldShowElement(elementId);
}

// Hook para obter configuração de navegação contextual
export function useContextualNavigation() {
  const { navigationState, getRecommendedNavigation } = useSmartNavigation();

  return useMemo(() => {
    const recommendation = getRecommendedNavigation();
    return {
      ...recommendation,
      currentContext: navigationState.currentContext,
      deviceType: navigationState.deviceType,
      userLevel: navigationState.userLevel
    };
  }, [navigationState.currentContext, navigationState.deviceType, navigationState.userLevel, getRecommendedNavigation]);
}