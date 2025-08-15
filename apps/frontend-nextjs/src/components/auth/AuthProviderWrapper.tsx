/**
 * AuthProviderWrapper - Provider de Autenticação Global
 * Wrapper que fornece o contexto de autenticação para toda a aplicação
 * Inclui tratamento de erros e estados de carregamento
 */

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { FEATURES } from '@/lib/firebase/config';

interface AuthProviderWrapperProps {
  children: ReactNode;
}

interface AuthLoadingScreenProps {
  message?: string;
}

function AuthLoadingScreen({ message = 'Carregando...' }: AuthLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
        {!FEATURES.AUTH_ENABLED && (
          <p className="text-xs text-gray-400 mt-2">
            Modo offline - Funcionalidades básicas disponíveis
          </p>
        )}
      </div>
    </div>
  );
}

interface AuthErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

function AuthErrorScreen({ error, onRetry }: AuthErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Erro de Inicialização
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        )}
        <div className="mt-4 text-sm text-gray-500">
          <p>A plataforma funcionará em modo limitado.</p>
          <p>Verifique sua conexão com a internet.</p>
        </div>
      </div>
    </div>
  );
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  const [initializationState, setInitializationState] = useState<{
    isLoading: boolean;
    error: string | null;
    retryCount: number;
  }>({
    isLoading: true,
    error: null,
    retryCount: 0
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setInitializationState(prev => ({ ...prev, isLoading: true, error: null }));

        // Verificar disponibilidade do Firebase
        if (FEATURES.AUTH_ENABLED) {
          // Simular verificação de conectividade com Firebase
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Aqui você pode adicionar verificações específicas do Firebase
          // como conectividade, configuração, etc.
        }

        // Inicialização bem-sucedida
        setInitializationState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: null 
        }));

      } catch (error: any) {
        console.error('Erro na inicialização da autenticação:', error);
        
        setInitializationState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error.message || 'Erro desconhecido',
          retryCount: prev.retryCount + 1
        }));
      }
    };

    initializeAuth();
  }, [initializationState.retryCount]);

  const handleRetry = () => {
    if (initializationState.retryCount < 3) {
      setInitializationState(prev => ({ 
        ...prev, 
        retryCount: prev.retryCount + 1 
      }));
    } else {
      // Após 3 tentativas, continuar sem autenticação
      setInitializationState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: null 
      }));
    }
  };

  // Tela de carregamento
  if (initializationState.isLoading) {
    return (
      <AuthLoadingScreen 
        message={
          FEATURES.AUTH_ENABLED 
            ? 'Conectando com o sistema de autenticação...'
            : 'Inicializando plataforma educacional...'
        }
      />
    );
  }

  // Tela de erro (apenas se erro crítico e poucas tentativas)
  if (initializationState.error && initializationState.retryCount < 3) {
    return (
      <AuthErrorScreen 
        error={initializationState.error}
        onRetry={handleRetry}
      />
    );
  }

  // Renderizar aplicação com AuthProvider
  return (
    <AuthProvider>
      <AuthStatusIndicator />
      {children}
    </AuthProvider>
  );
}

/**
 * Indicador discreto do status de autenticação
 * Mostra problemas de conectividade ou sincronização
 */
function AuthStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showOfflineNotice) {
        // Breve notificação de reconexão
        setTimeout(() => setShowOfflineNotice(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showOfflineNotice]);

  if (!showOfflineNotice || isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
      <div className="flex items-center justify-center space-x-2">
        <span>📶</span>
        <span>
          {isOnline 
            ? 'Conexão restaurada - sincronizando dados...'
            : 'Sem conexão - trabalhando offline'
          }
        </span>
      </div>
    </div>
  );
}

/**
 * Hook para verificar se a autenticação está disponível
 */
export function useAuthAvailability() {
  return {
    isAuthEnabled: FEATURES.AUTH_ENABLED,
    isFirestoreEnabled: FEATURES.FIRESTORE_ENABLED,
    isOfflineMode: FEATURES.OFFLINE_MODE,
    hasFullFeatures: FEATURES.AUTH_ENABLED && FEATURES.FIRESTORE_ENABLED
  };
}

/**
 * Componente para mostrar status de funcionalidades
 */
interface FeatureStatusProps {
  className?: string;
}

export function FeatureStatus({ className = '' }: FeatureStatusProps) {
  const availability = useAuthAvailability();

  if (availability.hasFullFeatures) {
    return null; // Tudo funcionando, não precisa mostrar nada
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-blue-600">ℹ️</span>
        <div className="text-sm text-blue-800">
          <p className="font-medium">Modo de Funcionalidade:</p>
          <ul className="text-xs mt-1 space-y-1">
            {!availability.isAuthEnabled && (
              <li>• Autenticação: Desabilitada (perfis locais)</li>
            )}
            {!availability.isFirestoreEnabled && (
              <li>• Sincronização: Local apenas</li>
            )}
            {availability.isOfflineMode && (
              <li>• Modo: Offline/Local</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AuthProviderWrapper;