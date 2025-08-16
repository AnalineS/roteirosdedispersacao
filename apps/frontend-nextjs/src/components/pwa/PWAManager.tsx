'use client';

import { useEffect, useState } from 'react';

interface PWAManagerProps {
  enableServiceWorker?: boolean;
}

export default function PWAManager({ enableServiceWorker = false }: PWAManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Verificar suporte a PWA
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = document.querySelector('link[rel="manifest"]');
      setIsSupported(hasServiceWorker && !!hasManifest);
      
      // Verificar se já está instalado
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInIOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInIOS);
    };

    checkPWASupport();

    // Listener para install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listener para app instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] App instalado com sucesso');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Registrar Service Worker apenas se habilitado
    if (enableServiceWorker && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, [enableServiceWorker]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Força verificação de updates
      });

      console.log('[PWA] Service Worker registrado:', registration.scope);

      // Verificar updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              console.log('[PWA] Nova versão disponível');
            }
          });
        }
      });

      // Verificar se há SW controlando a página
      if (registration.active && !navigator.serviceWorker.controller) {
        window.location.reload();
      }

    } catch (error) {
      console.error('[PWA] Falha ao registrar Service Worker:', error);
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou instalar');
      } else {
        console.log('[PWA] Usuário recusou instalar');
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        setUpdateAvailable(false);
        window.location.reload();
      }
    }
  };

  // Não renderizar nada se não for suportado
  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      {deferredPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Instalar App</h4>
              <p className="text-xs opacity-90">Acesso rápido e uso offline</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setDeferredPrompt(null)}
                className="text-xs px-2 py-1 bg-white bg-opacity-20 rounded"
              >
                Agora não
              </button>
              <button
                onClick={handleInstallApp}
                className="text-xs px-3 py-1 bg-white text-blue-600 rounded font-medium"
              >
                Instalar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Atualização Disponível</h4>
              <p className="text-xs opacity-90">Nova versão do app</p>
            </div>
            <button
              onClick={handleUpdateApp}
              className="text-xs px-3 py-1 bg-white text-green-600 rounded font-medium ml-4"
            >
              Atualizar
            </button>
          </div>
        </div>
      )}

      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-40">
          PWA: {isSupported ? '✓' : '✗'} | 
          SW: {enableServiceWorker ? '✓' : '✗'} | 
          Instalado: {isInstalled ? '✓' : '✗'}
        </div>
      )}
    </>
  );
}

// Hook para controle manual do PWA
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const handleBeforeInstallPrompt = () => setIsInstallable(true);
    const handleAppInstalled = () => setIsInstallable(false);

    // Status de conectividade
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Status de instalação
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkCacheStatus = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const totalCaches = cacheNames.length;
      
      let totalSize = 0;
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }
      
      return { totalCaches, totalSize };
    }
    return { totalCaches: 0, totalSize: 0 };
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] Cache limpo');
    }
  };

  return {
    isOnline,
    isInstallable,
    checkCacheStatus,
    clearCache
  };
}