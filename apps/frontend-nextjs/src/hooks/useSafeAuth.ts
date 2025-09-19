'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHydration, type IsomorphicAuthData, type AuthState } from './useIsomorphicAuth';

interface LoginCredentials {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}

interface SocialCredentials {
  provider: 'google';  // Only Google authentication is supported
  token?: string;
  accessToken?: string;
  idToken?: string;
}

interface ProfileUpdateData {
  displayName?: string;
  email?: string;
  photoURL?: string;
  preferences?: Record<string, unknown>;
}

/**
 * Hook robusto e isomórfico para autenticação
 * Compatível com SSG/SSR e todos os cenários de uso
 */
export function useSafeAuth(): IsomorphicAuthData {
  const isHydrated = useHydration();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [authData, setAuthData] = useState({
    user: null,
    profile: null,
    error: null
  });

  // Funções padrão seguras
  const defaultLogin = useCallback(async (credentials?: LoginCredentials) => {
    if (!isHydrated) {
      return { success: false, error: 'Not available during server rendering' };
    }
    // Implementar lógica de login ou redirecionar para página de login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return { success: false, error: 'Redirecting to login' };
  }, [isHydrated]);

  const defaultLogout = useCallback(async () => {
    if (!isHydrated) return;
    // Implementar logout ou usar auth context quando disponível
    setAuthState('anonymous');
    setAuthData({ user: null, profile: null, error: null });
  }, [isHydrated]);

  const defaultSocialLogin = useCallback(async (credentials: SocialCredentials) => {
    return { success: false, error: 'Social login not available' };
  }, []);

  const defaultUpdateProfile = useCallback(async (data: ProfileUpdateData) => {
    return { success: false, error: 'Profile update not available' };
  }, []);

  const defaultDeleteAccount = useCallback(async () => {
    return { success: false, error: 'Account deletion not available' };
  }, []);

  // Inicializar autenticação no client-side
  useEffect(() => {
    if (!isHydrated) {
      setAuthState('loading');
      return;
    }

    // Tentar conectar com o contexto de auth real
    const initializeAuth = async () => {
      try {
        // Dynamic import para evitar problemas no SSG
        const authModule = await import('@/contexts/AuthContext');
        
        // Aqui precisamos de uma forma segura de usar o hook
        // Por enquanto, vamos simular os estados baseado em localStorage ou outras fontes
        const savedAuth = localStorage.getItem('auth_state');
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          setAuthState(parsed.isAuthenticated ? 'authenticated' : 'anonymous');
          setAuthData({
            user: parsed.user,
            profile: parsed.profile,
            error: null
          });
        } else {
          setAuthState('anonymous');
        }
      } catch (error) {
        // Medical tracking for auth context availability
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'auth_context_unavailable', {
            event_category: 'medical_analytics_auth',
            event_label: 'auth_context_anonymous_fallback',
            custom_parameters: {
              medical_context: 'safe_auth_hook',
              auth_state: 'anonymous',
              error_message: error instanceof Error ? error.message : 'Auth context not available'
            }
          });
        }
        setAuthState('anonymous');
      }
    };

    // Delay para permitir que o contexto seja inicializado
    const timeoutId = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isHydrated]);

  // Estados computados
  const isLoading = authState === 'loading';
  const isAuthenticated = authState === 'authenticated' || authState === 'admin';
  const isAnonymous = authState === 'anonymous';
  const isAdmin = authState === 'admin';
  const hasError = authState === 'error';

  // Funções de verificação
  const checkPermission = useCallback((permission: string) => {
    if (!isHydrated || !isAuthenticated) return false;
    // Implementar lógica de permissões baseada no usuário
    return isAdmin; // Por enquanto, só admin tem permissões
  }, [isHydrated, isAuthenticated, isAdmin]);

  const hasRole = useCallback((role: string) => {
    if (!isHydrated || !isAuthenticated) return false;
    if (role === 'admin') return isAdmin;
    if (role === 'user') return isAuthenticated;
    return false;
  }, [isHydrated, isAuthenticated, isAdmin]);

  return {
    // Estados
    state: authState,
    isHydrated,
    isLoading,
    isAuthenticated,
    isAnonymous,
    isAdmin,
    hasError,

    // Dados
    user: authData.user,
    profile: authData.profile,

    // Funções principais
    login: defaultLogin,
    logout: defaultLogout,
    loginWithSocial: defaultSocialLogin,
    linkSocialAccount: defaultSocialLogin,
    updateUserProfile: defaultUpdateProfile,
    deleteAccount: defaultDeleteAccount,

    // Verificações
    checkPermission,
    hasRole,

    // Compatibilidade com versão anterior
    loading: isLoading
  };
}

// Alias para compatibilidade
export { useSafeAuth as useAuth };

// Função auxiliar para verificação de admin (compatível com SSG)
export const useAdminCheck = () => {
  const { isAdmin, isHydrated } = useSafeAuth();
  return isHydrated ? isAdmin : false;
};