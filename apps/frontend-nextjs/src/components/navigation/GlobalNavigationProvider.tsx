'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationState {
  isNavigationRequired: boolean;
  canBypassPersonaSelection: boolean;
  lastVisitedPage?: string;
  hasSeenPersonaSelection: boolean;
  navigationHistory: string[];
}

interface NavigationContextType {
  navigationState: NavigationState;
  allowNavigation: (path: string) => void;
  setPersonaSelectionViewed: () => void;
  getNavigationOptions: () => NavigationOption[];
  canAccessPage: (path: string) => boolean;
}

interface NavigationOption {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  requiresPersona?: boolean;
  isPublic?: boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Páginas públicas que não requerem seleção de persona
const PUBLIC_PAGES = [
  '/',
  '/modules',
  '/modules/hanseniase', 
  '/modules/diagnostico',
  '/modules/tratamento',
  '/vida-com-hanseniase',
  '/sobre',
  '/sobre-a-tese',
  '/metodologia',
  '/privacidade',
  '/termos',
  '/conformidade',
  '/etica',
  '/responsabilidade',
  '/transparencia',
  '/sitemap',
  '/login',
  '/cadastro',
  '/esqueci-senha'
];

// Páginas que requerem autenticação mas não persona específica
const AUTH_ONLY_PAGES = [
  '/dashboard',
  '/progress',
  '/settings'
];

// Páginas que requerem persona selecionada
const PERSONA_REQUIRED_PAGES = [
  '/chat'
];

export function GlobalNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigationRequired: false,
    canBypassPersonaSelection: true,
    hasSeenPersonaSelection: false,
    navigationHistory: []
  });

  // Carregar estado do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('navigation_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setNavigationState(prev => ({
          ...prev,
          ...parsed,
          navigationHistory: prev.navigationHistory
        }));
      } catch (error) {
        console.warn('Erro ao carregar estado de navegação:', error);
      }
    }
  }, []);

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem('navigation_state', JSON.stringify({
      hasSeenPersonaSelection: navigationState.hasSeenPersonaSelection,
      lastVisitedPage: navigationState.lastVisitedPage
    }));
  }, [navigationState]);

  // Atualizar histórico de navegação
  useEffect(() => {
    if (pathname) {
      setNavigationState(prev => ({
        ...prev,
        navigationHistory: [
          pathname,
          ...prev.navigationHistory.filter(p => p !== pathname)
        ].slice(0, 10), // Manter últimas 10 páginas
        lastVisitedPage: pathname
      }));
    }
  }, [pathname]);

  const allowNavigation = (path: string) => {
    setNavigationState(prev => ({
      ...prev,
      canBypassPersonaSelection: true,
      lastVisitedPage: path
    }));
  };

  const setPersonaSelectionViewed = () => {
    setNavigationState(prev => ({
      ...prev,
      hasSeenPersonaSelection: true,
      canBypassPersonaSelection: true
    }));
  };

  const canAccessPage = (path: string): boolean => {
    // Páginas públicas sempre acessíveis
    if (PUBLIC_PAGES.includes(path)) {
      return true;
    }

    // Páginas que requerem apenas autenticação
    if (AUTH_ONLY_PAGES.includes(path)) {
      return true; // Verificação de auth será feita pelo componente específico
    }

    // Páginas que requerem persona - permitir se usuário já viu seleção
    if (PERSONA_REQUIRED_PAGES.includes(path)) {
      return navigationState.hasSeenPersonaSelection || navigationState.canBypassPersonaSelection;
    }

    // Por padrão, permitir acesso
    return true;
  };

  const getNavigationOptions = (): NavigationOption[] => [
    {
      id: 'home',
      label: 'Início',
      href: '/',
      icon: '🏠',
      description: 'Portal principal e seleção de assistentes',
      isPublic: true
    },
    {
      id: 'modules',
      label: 'Módulos Educacionais',
      href: '/modules',
      icon: '📚',
      description: 'Conteúdo educacional estruturado sobre hanseníase',
      isPublic: true
    },
    {
      id: 'chat',
      label: 'Assistentes Virtuais',
      href: '/chat',
      icon: '💬',
      description: 'Converse com Dr. Gasnelio e Gá',
      requiresPersona: false // Permitir acesso direto ao chat
    },
    {
      id: 'resources',
      label: 'Ferramentas Práticas',
      href: '/resources',
      icon: '🛠️',
      description: 'Calculadoras e recursos para profissionais',
      isPublic: true
    },
    {
      id: 'dashboard',
      label: 'Meu Progresso',
      href: '/dashboard',
      icon: '📊',
      description: 'Acompanhe seu progresso educacional'
    },
    {
      id: 'vida-com-hanseniase',
      label: 'Vida com Hanseníase',
      href: '/vida-com-hanseniase',
      icon: '💚',
      description: 'Informações sobre qualidade de vida (acesso público)',
      isPublic: true
    },
    {
      id: 'sobre',
      label: 'Sobre o Sistema',
      href: '/sobre',
      icon: '🎓',
      description: 'Informações institucionais e metodologia',
      isPublic: true
    }
  ];

  const contextValue: NavigationContextType = {
    navigationState,
    allowNavigation,
    setPersonaSelectionViewed,
    getNavigationOptions,
    canAccessPage
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useGlobalNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useGlobalNavigation must be used within GlobalNavigationProvider');
  }
  return context;
}

// Hook para verificar se uma página requer navegação especial
export function useNavigationRequirement() {
  const { navigationState, canAccessPage } = useGlobalNavigation();
  const pathname = usePathname();

  return {
    isPublicPage: PUBLIC_PAGES.includes(pathname || '/'),
    requiresAuth: AUTH_ONLY_PAGES.includes(pathname || '/'),
    requiresPersona: PERSONA_REQUIRED_PAGES.includes(pathname || '/'),
    canAccess: canAccessPage(pathname || '/'),
    hasSeenPersonaSelection: navigationState.hasSeenPersonaSelection
  };
}