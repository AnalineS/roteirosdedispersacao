'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para detectar se estamos no client-side
 * Essencial para SSG/SSR compatibility
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Estados de autenticação possíveis
 */
export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'admin' | 'error';

/**
 * Interface robusta para autenticação
 */
export interface IsomorphicAuthData {
  // Estados
  state: AuthState;
  isHydrated: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isAdmin: boolean;
  hasError: boolean;

  // Dados do usuário
  user: any;
  profile: any;

  // Funções
  login: (credentials?: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginWithSocial: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  linkSocialAccount: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;

  // Verificações
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;

  // Compatibilidade com versão anterior
  loading: boolean;
}