'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useHapticFeedback } from '@/utils/hapticFeedback';

interface NavigationRoute {
  key: string;
  path: string;
  title: string;
  description: string;
}

// Mapeamento numérico das rotas principais
const NUMERIC_ROUTES: Record<string, NavigationRoute> = {
  '1': { key: '1', path: '/', title: 'Início', description: 'Página inicial do sistema' },
  '2': { key: '2', path: '/modules', title: 'Módulos', description: 'Módulos educacionais' },
  '3': { key: '3', path: '/metodologia/detalhada', title: 'Metodologia', description: 'Metodologia detalhada' },
  '4': { key: '4', path: '/conformidade', title: 'Conformidade', description: 'Conformidade regulatória' },
  '5': { key: '5', path: '/referencias', title: 'Referências', description: 'Referências bibliográficas' },
  '6': { key: '6', path: '/offline', title: 'Modo Offline', description: 'Funcionalidades offline' },
  '7': { key: '7', path: '/personas', title: 'Personas', description: 'Assistentes virtuais' },
  '8': { key: '8', path: '/calculadora', title: 'Calculadora', description: 'Calculadora PQT-U' },
  '9': { key: '9', path: '/checklist', title: 'Checklist', description: 'Checklist de dispensação' }
};

interface UseNumericNavigationOptions {
  enabled?: boolean;
  showNotifications?: boolean;
  onNavigate?: (route: NavigationRoute) => void;
  excludeKeys?: string[];
}

export function useNumericNavigation({
  enabled = true,
  showNotifications = true,
  onNavigate,
  excludeKeys = []
}: UseNumericNavigationOptions = {}) {
  
  const router = useRouter();
  const { info } = useHapticFeedback();

  const showNavigationToast = useCallback((route: NavigationRoute) => {
    if (!showNotifications) return;

    // Criar notification toast temporária
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1e293b;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: #3b82f6; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${route.key}</span>
        <div>
          <div style="font-weight: 600;">${route.title}</div>
          <div style="font-size: 12px; opacity: 0.8;">${route.description}</div>
        </div>
      </div>
    `;

    // Adicionar CSS de animação
    if (!document.querySelector('#numeric-nav-styles')) {
      const styles = document.createElement('style');
      styles.id = 'numeric-nav-styles';
      styles.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Remover após 2 segundos
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 2000);

    // Adicionar animação de saída
    const slideOutKeyframes = `
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    
    if (!document.querySelector('#slideout-animation')) {
      const slideOutStyles = document.createElement('style');
      slideOutStyles.id = 'slideout-animation';
      slideOutStyles.textContent = slideOutKeyframes;
      document.head.appendChild(slideOutStyles);
    }
  }, [showNotifications]);

  const handleNavigation = useCallback((key: string) => {
    const route = NUMERIC_ROUTES[key];
    if (!route || excludeKeys.includes(key)) return;

    // Haptic feedback para navegação
    info();

    // Mostrar notificação
    showNavigationToast(route);

    // Executar callback personalizado
    onNavigate?.(route);

    // Navegar após pequeno delay para mostrar a notificação
    setTimeout(() => {
      router.push(route.path);
    }, 300);

  }, [router, onNavigate, excludeKeys, showNavigationToast, info]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Verificar se não estamos em um campo de input
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.hasAttribute('contenteditable')
    );

    if (isInputFocused) return;

    // Verificar se alguma tecla modificadora está pressionada
    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

    // Verificar se é uma tecla numérica (1-9)
    const key = event.key;
    if (NUMERIC_ROUTES[key] && !excludeKeys.includes(key)) {
      event.preventDefault();
      handleNavigation(key);
    }
  }, [enabled, excludeKeys, handleNavigation]);

  // Efeito para adicionar/remover listener
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  // Função para obter todas as rotas disponíveis
  const getAvailableRoutes = useCallback(() => {
    return Object.entries(NUMERIC_ROUTES)
      .filter(([key]) => !excludeKeys.includes(key))
      .map(([key, route]) => route);
  }, [excludeKeys]);

  // Função para obter rota específica
  const getRoute = useCallback((key: string) => {
    return NUMERIC_ROUTES[key];
  }, []);

  return {
    routes: NUMERIC_ROUTES,
    availableRoutes: getAvailableRoutes(),
    getRoute,
    handleNavigation,
    isEnabled: enabled
  };
}