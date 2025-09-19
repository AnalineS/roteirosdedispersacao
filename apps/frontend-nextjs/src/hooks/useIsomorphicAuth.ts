'use client';

import { useEffect, useState } from 'react';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  photoURL?: string;
  provider: 'google' | 'email' | 'anonymous';
  roles?: string[];
  permissions?: string[];
}

interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  type: 'patient' | 'professional' | 'student' | 'admin' | 'caregiver';
  focus: 'general' | 'technical' | 'practical' | 'effects' | 'empathetic';
  preferences: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'auto' | 'light' | 'dark';
  };
  history: {
    lastPersona: 'dr_gasnelio' | 'ga';
    conversationCount: number;
    lastAccess: string;
  };
}

interface LoginCredentials {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}

interface SocialCredentials {
  provider: 'google' | 'facebook' | 'apple';
  token?: string;
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface ProfileUpdateData {
  displayName?: string;
  type?: 'patient' | 'professional' | 'student' | 'admin';
  focus?: 'general' | 'technical' | 'practical' | 'effects' | 'empathetic';
  preferences?: Partial<UserProfile['preferences']>;
}

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
  user: AuthUser | null;
  profile: UserProfile | null;

  // Funções
  login: (credentials?: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginWithSocial: (credentials: SocialCredentials) => Promise<{ success: boolean; error?: string }>;
  linkSocialAccount: (credentials: SocialCredentials) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;

  // Verificações
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;

  // Compatibilidade com versão anterior
  loading: boolean;
}