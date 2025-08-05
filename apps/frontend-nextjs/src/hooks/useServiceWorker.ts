'use client';

import { useState, useEffect } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isControlling: boolean;
  updateAvailable: boolean;
  error: string | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isControlling: false,
    updateAvailable: false,
    error: null
  });

  useEffect(() => {
    // Verificar se Service Worker é suportado
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    let registration: ServiceWorkerRegistration | null = null;

    async function registerSW() {
      try {
        setState(prev => ({ ...prev, isInstalling: true }));

        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('[SW] Service Worker registered:', registration);

        setState(prev => ({
          ...prev,
          isRegistered: true,
          isInstalling: false,
          isControlling: !!navigator.serviceWorker.controller
        }));

        // Verificar se há SW aguardando
        if (registration.waiting) {
          setState(prev => ({ ...prev, isWaiting: true, updateAvailable: true }));
        }

        // Ouvir mudanças de estado
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (newWorker) {
            console.log('[SW] New service worker installing');
            setState(prev => ({ ...prev, isInstalling: true }));

            newWorker.addEventListener('statechange', () => {
              console.log('[SW] State changed:', newWorker.state);
              
              switch (newWorker.state) {
                case 'installed':
                  setState(prev => ({
                    ...prev,
                    isInstalling: false,
                    isWaiting: navigator.serviceWorker.controller ? true : false,
                    updateAvailable: navigator.serviceWorker.controller ? true : false
                  }));
                  break;
                case 'activated':
                  setState(prev => ({
                    ...prev,
                    isWaiting: false,
                    isControlling: true,
                    updateAvailable: false
                  }));
                  window.location.reload(); // Recarregar para usar novo SW
                  break;
              }
            });
          }
        });

      } catch (error) {
        console.error('[SW] Registration failed:', error);
        setState(prev => ({
          ...prev,
          isInstalling: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }));
      }
    }

    // Registrar Service Worker
    registerSW();

    // Ouvir mudanças no controller
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed');
      setState(prev => ({ ...prev, isControlling: true }));
    });

    // Cleanup
    return () => {
      if (registration) {
        registration.removeEventListener('updatefound', () => {});
      }
    };
  }, []);

  /**
   * Força atualização do Service Worker
   */
  const updateServiceWorker = async () => {
    if (!state.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        // Enviar mensagem para ativar novo SW
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if (registration) {
        // Verificar por atualizações
        await registration.update();
      }
    } catch (error) {
      console.error('[SW] Update failed:', error);
    }
  };

  /**
   * Cancela registro do Service Worker
   */
  const unregisterServiceWorker = async () => {
    if (!state.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        setState(prev => ({
          ...prev,
          isRegistered: false,
          isControlling: false,
          updateAvailable: false
        }));
        console.log('[SW] Service Worker unregistered');
      }
    } catch (error) {
      console.error('[SW] Unregister failed:', error);
    }
  };

  /**
   * Verifica status da conexão
   */
  const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

  return {
    ...state,
    isOnline,
    updateServiceWorker,
    unregisterServiceWorker,
    canUpdate: state.updateAvailable && state.isWaiting
  };
}

/**
 * Hook simples para detecção offline/online
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}