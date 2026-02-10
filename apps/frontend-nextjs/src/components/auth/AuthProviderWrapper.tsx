/**
 * AuthProviderWrapper - Provider de Autenticação Global
 * Wrapper que fornece o contexto de autenticação para toda a aplicação
 * Inclui tratamento de erros e estados de carregamento
 */

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from '@/contexts/AuthContext';
import { isProtectedRoute } from '@/config/routes';

// Features configuration - environment specific
const FEATURES = {
  AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  AUTH_CHECK_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_AUTH_TIMEOUT || '5000'),
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

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
  // Error messages in Portuguese for better UX
  const errorMessages: Record<string, string> = {
    'Backend indisponível': 'O servidor está temporariamente indisponível. Por favor, tente novamente em alguns minutos.',
    'Não foi possível conectar ao servidor': 'Não foi possível estabelecer conexão com o servidor. Verifique sua conexão com a internet.',
    'Timeout': 'A conexão demorou muito para responder. Por favor, tente novamente.',
    'Configuração ausente': 'O sistema não está configurado corretamente. Entre em contato com o suporte.',
    'default': 'Ocorreu um erro inesperado. Por favor, entre em contato com o suporte.'
  };

  const getErrorMessage = (err: string): string => {
    // Check if error matches any key
    for (const key in errorMessages) {
      if (err.includes(key)) {
        return errorMessages[key];
      }
    }
    return errorMessages.default;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-500 text-4xl mb-4 text-center">⚠️</div>
          <h1 className="text-xl font-semibold text-center text-gray-800 mb-4">
            Erro de Conexão
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {getErrorMessage(error)}
          </p>
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            )}
            <Link
              href="/"
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center block"
            >
              Voltar ao Início
            </Link>
          </div>
          {FEATURES.IS_DEVELOPMENT && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
              <p className="font-mono">Código do erro: {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  const pathname = usePathname();
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

        // Only check auth for protected routes and if auth is enabled
        if (FEATURES.AUTH_ENABLED && pathname && isProtectedRoute(pathname)) {
          // Real backend connectivity check with timeout
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), FEATURES.AUTH_CHECK_TIMEOUT);

          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL_STAGING || 'https://hml-api.roteirosdispensacao.com.br';
            const response = await fetch(`${apiUrl}/api/v1/health`, {
              signal: controller.signal,
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            });
            clearTimeout(timeout);

            if (!response.ok) {
              throw new Error(`Backend indisponível: ${response.status}`);
            }
          } catch (fetchError) {
            clearTimeout(timeout);
            if ((fetchError as Error).name === 'AbortError') {
              throw new Error('Timeout');
            }
            throw new Error('Não foi possível conectar ao servidor');
          }
        } else if (!FEATURES.AUTH_ENABLED) {
          // Auth disabled - proceed normally without authentication
          // Public pages work without backend auth
        }

        // Initialization successful
        setInitializationState({
          isLoading: false,
          error: null,
          retryCount: 0
        });

      } catch (error: unknown) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'auth_initialization_error', {
            event_category: 'medical_authentication',
            event_label: 'auth_init_failed',
            custom_parameters: {
              medical_context: 'auth_provider_initialization',
              error_type: 'initialization_failure',
              error_message: error instanceof Error ? error.message : String(error)
            }
          });
        }

        setInitializationState(prev => ({
          ...prev,
          isLoading: false,
          error: (error as Error)?.message || 'Erro desconhecido'
        }));
      }
    };

    initializeAuth();
  }, []); // No dependencies to avoid loop

  const handleRetry = () => {
    if (initializationState.retryCount < 3) {
      setInitializationState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isLoading: true,
        error: null
      }));

      // Trigger re-initialization
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // After 3 attempts, show permanent error (no fallback)
      setInitializationState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Máximo de tentativas excedido. Entre em contato com o suporte.'
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
    isCloudSyncEnabled: false, // Local storage only
    isOfflineMode: false,
    hasFullFeatures: FEATURES.AUTH_ENABLED
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
            {!availability.isCloudSyncEnabled && (
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