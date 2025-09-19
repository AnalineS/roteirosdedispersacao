/**
 * AuthContext - JWT Authentication System
 * Substituição completa do Firebase Auth por sistema JWT próprio
 * Mantém compatibilidade com interfaces existentes
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { jwtClient, User as JWTUser, AuthResponse, GoogleAuthResponse } from '@/lib/auth/jwt-client';

interface AuthenticationError {
  code?: string;
  message: string;
  details?: string;
}

// ============================================
// TYPES
// ============================================

// Interface compatível com Firebase User
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  photoURL?: string;
  provider: 'google' | 'email' | 'anonymous';
}

// Interface de perfil local (substituindo Firestore)
export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  type: 'patient' | 'professional' | 'student' | 'admin';
  focus: 'general' | 'clinical' | 'research' | 'education';
  confidence: number;
  explanation: string;
  preferences: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'auto' | 'light' | 'dark';
    emailUpdates: boolean;
    dataCollection: boolean;
    lgpdConsent: boolean;
  };
  history: {
    lastPersona: 'dr_gasnelio' | 'ga';
    conversationCount: number;
    lastAccess: string;
    preferredTopics: string[];
    totalSessions: number;
    totalTimeSpent: number;
    completedModules: string[];
    achievements: string[];
  };
  stats: {
    joinedAt: string;
    lastActiveAt: string;
    sessionCount: number;
    messageCount: number;
    averageSessionDuration: number;
    favoritePersona: 'dr_gasnelio' | 'ga';
    completionRate: number;
  };
  createdAt: string;
  updatedAt: string;
  version: string;
}

// Auth state interface
export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

// Credentials interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  profileType?: 'patient' | 'professional' | 'student';
}

export interface SocialAuthCredentials {
  providerId: 'google.com';
  preferredDisplayName?: string;
  preferredProfileType?: 'patient' | 'professional' | 'student';
}

// ============================================
// CONTEXT TYPE
// ============================================

interface AuthContextType extends AuthState {
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Social authentication
  loginWithSocial: (credentials: SocialAuthCredentials) => Promise<{ success: boolean; error?: string }>;
  linkSocialAccount: (providerId: string) => Promise<{ success: boolean; error?: string }>;

  // Profile management
  profile: UserProfile | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;

  // Anonymous/Guest methods
  continueAsGuest: () => Promise<{ success: boolean; error?: string }>;
  upgradeAnonymousAccount: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;

  // Utility methods
  isFeatureAvailable: (feature: 'profiles' | 'conversations' | 'analytics' | 'advanced' | 'admin') => boolean;
  getAccessLevel: () => 'anonymous' | 'authenticated' | 'premium' | 'admin';
  isAdmin: () => boolean;
  refreshAuth: () => Promise<void>;
  clearError: () => void;

  // Soft Authentication flags
  showAuthPrompt: boolean;
  dismissAuthPrompt: () => void;
  authPromptReason?: string;
}

// ============================================
// CONTEXT CREATION
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Soft authentication state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string>();

  // Derived state
  const isAuthenticated = !!user && !user.isAnonymous;
  const isAnonymous = !!user && user.isAnonymous;

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const convertJWTUserToAuthUser = (jwtUser: JWTUser): AuthUser => ({
    uid: jwtUser.id,
    email: jwtUser.email,
    displayName: jwtUser.name,
    emailVerified: jwtUser.verified,
    isAnonymous: false,
    photoURL: jwtUser.picture,
    provider: jwtUser.provider
  });

  const createAnonymousUser = (): AuthUser => ({
    uid: `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: null,
    displayName: null,
    emailVerified: false,
    isAnonymous: true,
    provider: 'anonymous'
  });

  const createDefaultProfile = useCallback((userId: string, currentUser: AuthUser | null): UserProfile => {
    const now = new Date().toISOString();

    return {
      uid: userId,
      email: currentUser?.email || undefined,
      displayName: currentUser?.displayName || undefined,
      type: 'patient',
      focus: 'general',
      confidence: 0.5,
      explanation: 'Perfil criado automaticamente',
      preferences: {
        language: 'simple',
        notifications: true,
        theme: 'auto',
        emailUpdates: true,
        dataCollection: true,
        lgpdConsent: true
      },
      history: {
        lastPersona: 'ga',
        conversationCount: 0,
        lastAccess: now,
        preferredTopics: [],
        totalSessions: 1,
        totalTimeSpent: 0,
        completedModules: [],
        achievements: []
      },
      stats: {
        joinedAt: now,
        lastActiveAt: now,
        sessionCount: 1,
        messageCount: 0,
        averageSessionDuration: 0,
        favoritePersona: 'ga',
        completionRate: 0
      },
      createdAt: now,
      updatedAt: now,
      version: '2.0'
    };
  }, []);

  const loadUserProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      const stored = localStorage.getItem(`user-profile-${userId}`);
      if (stored) {
        const parsedProfile = JSON.parse(stored);
        setProfile(parsedProfile);
      } else {
        // Criar perfil padrão
        const defaultProfile = createDefaultProfile(userId, user);
        setProfile(defaultProfile);
        localStorage.setItem(`user-profile-${userId}`, JSON.stringify(defaultProfile));
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'user_profile_load_error', {
          event_category: 'auth',
          event_label: 'profile_load_failed'
        });
      }
    }
  }, [user, createDefaultProfile]);

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response: AuthResponse = await jwtClient.loginWithEmail(credentials.email, credentials.password);

      const authUser = convertJWTUserToAuthUser(response.user);
      setUser(authUser);

      await loadUserProfile(authUser.uid);

      return { success: true };
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Email registration não implementado ainda no backend
    return { success: false, error: 'Registro com email ainda não implementado. Use login com Google.' };
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await jwtClient.logout();
      setUser(null);
      setProfile(null);
      setError(null);
      return { success: true };
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = 'Erro ao fazer logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Password reset não implementado ainda no backend
    return { success: false, error: 'Reset de senha ainda não implementado.' };
  };

  // ============================================
  // SOCIAL AUTHENTICATION METHODS
  // ============================================

  const loginWithSocial = async (credentials: SocialAuthCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (credentials.providerId !== 'google.com') {
        return { success: false, error: 'Apenas login com Google é suportado' };
      }

      // Iniciar fluxo OAuth Google
      const googleAuth: GoogleAuthResponse = await jwtClient.initiateGoogleAuth();

      // Armazenar state para verificação
      sessionStorage.setItem('oauth_state', googleAuth.state);

      // Redirecionar para Google OAuth
      window.location.href = googleAuth.authUrl;

      return { success: true };
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar login social';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const linkSocialAccount = async (providerId: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Link de contas sociais ainda não implementado' };
  };

  // ============================================
  // ANONYMOUS/GUEST METHODS
  // ============================================

  const continueAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const anonUser = createAnonymousUser();
      setUser(anonUser);
      await loadUserProfile(anonUser.uid);

      return { success: true };
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = 'Erro ao continuar como visitante';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const upgradeAnonymousAccount = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || !user.isAnonymous) {
        return { success: false, error: 'Não é possível upgradar esta conta' };
      }

      // Por enquanto, apenas fazer login normal
      const result = await login(credentials);

      if (result.success) {
        // Migrar dados do usuário anônimo se necessário
        const anonProfileKey = `user-profile-${user.uid}`;
        const anonProfile = localStorage.getItem(anonProfileKey);

        if (anonProfile && user) {
          try {
            const parsedProfile = JSON.parse(anonProfile);
            // Atualizar com dados do novo usuário
            parsedProfile.uid = user.uid;
            parsedProfile.email = user.email;
            parsedProfile.displayName = user.displayName;
            parsedProfile.updatedAt = new Date().toISOString();

            localStorage.setItem(`user-profile-${user.uid}`, JSON.stringify(parsedProfile));
            localStorage.removeItem(anonProfileKey);
            setProfile(parsedProfile);
          } catch (e) {
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'anonymous_profile_migration_error', {
                event_category: 'auth',
                event_label: 'migration_failed'
              });
            }
          }
        }
      }

      return result;
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao upgradar conta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString()
      } as UserProfile;

      // Atualizar no backend se usuário está autenticado
      if (!user.isAnonymous) {
        try {
          await jwtClient.updateProfile({
            name: updates.displayName,
            picture: updates.preferences?.theme === 'dark' ? undefined : undefined // Placeholder
          });
        } catch (backendError) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'backend_profile_update_error', {
              event_category: 'auth',
              event_label: 'backend_update_failed'
            });
          }
        }
      }

      // Sempre atualizar localmente
      setProfile(updatedProfile);
      localStorage.setItem(`user-profile-${user.uid}`, JSON.stringify(updatedProfile));

      return { success: true };
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      return { success: false, error: errorMessage };
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      setLoading(true);

      // Deletar dados locais
      localStorage.removeItem(`user-profile-${user.uid}`);

      if (!user.isAnonymous) {
        // Fazer logout do backend
        await jwtClient.logout();
      }

      setProfile(null);
      setUser(null);

      return { success: true };
    } catch (error: AuthenticationError | Error | unknown) {
      const errorMessage = 'Erro ao deletar conta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UTILITY METHODS
  // ============================================

  const isFeatureAvailable = (feature: 'profiles' | 'conversations' | 'analytics' | 'advanced' | 'admin'): boolean => {
    switch (feature) {
      case 'profiles':
        return true; // Sempre disponível
      case 'conversations':
        return !!user; // Disponível para todos os usuários (incluindo anônimos)
      case 'analytics':
        return isAuthenticated; // Apenas para usuários autenticados
      case 'advanced':
        return isAuthenticated && !!profile; // Apenas para usuários com perfil completo
      case 'admin':
        return isAdmin(); // Apenas administradores
      default:
        return false;
    }
  };

  const getAccessLevel = (): 'anonymous' | 'authenticated' | 'premium' | 'admin' => {
    if (isAdmin()) return 'admin';
    if (!user) return 'anonymous';
    if (user.isAnonymous) return 'anonymous';
    if (isAuthenticated && profile) return 'premium';
    if (isAuthenticated) return 'authenticated';
    return 'anonymous';
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      if (!user?.isAnonymous) {
        const currentUser = await jwtClient.getCurrentUser();
        if (currentUser) {
          const authUser = convertJWTUserToAuthUser(currentUser);
          setUser(authUser);
          await loadUserProfile(authUser.uid);
        }
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'auth_refresh_error', {
          event_category: 'auth',
          event_label: 'refresh_failed'
        });
      }
    }
  };

  // Admin check
  const ADMIN_EMAILS = [
    'neeliogomes@hotmail.com',
    'sousa.analine@gmail.com',
    'roteirosdedispensacaounb@gmail.com',
    'neliogmoura@gmail.com',
  ];

  const isAdmin = (): boolean => {
    if (!user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  };

  const clearError = (): void => {
    setError(null);
  };

  const dismissAuthPrompt = (): void => {
    setShowAuthPrompt(false);
    setAuthPromptReason(undefined);
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);

        // Check for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = sessionStorage.getItem('oauth_state');

        if (code && state && state === storedState) {
          // Complete OAuth flow
          try {
            const response: AuthResponse = await jwtClient.completeGoogleAuth(code, state);
            const authUser = convertJWTUserToAuthUser(response.user);
            setUser(authUser);
            await loadUserProfile(authUser.uid);

            // Clean up URL and storage
            sessionStorage.removeItem('oauth_state');
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('code');
            newUrl.searchParams.delete('state');
            window.history.replaceState({}, '', newUrl.toString());

            return;
          } catch (oauthError) {
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'oauth_completion_error', {
                event_category: 'auth',
                event_label: 'google_oauth_failed'
              });
            }
            setError('Erro ao completar login com Google');
          }
        }

        // Check for existing JWT token
        if (jwtClient.isAuthenticated()) {
          try {
            const currentUser = await jwtClient.getCurrentUser();
            if (currentUser) {
              const authUser = convertJWTUserToAuthUser(currentUser);
              setUser(authUser);
              await loadUserProfile(authUser.uid);
              return;
            }
          } catch (tokenError) {
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'token_validation_error', {
                event_category: 'auth',
                event_label: 'token_invalid'
              });
            }
            // Token invalid, continue as guest
          }
        }

        // Default to anonymous user
        const anonUser = createAnonymousUser();
        setUser(anonUser);
        await loadUserProfile(anonUser.uid);

      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'auth_initialization_error', {
            event_category: 'auth',
            event_label: 'init_failed'
          });
        }
        setError('Erro ao carregar dados de autenticação');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [loadUserProfile]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: AuthContextType = {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    isAnonymous,
    profile,

    // Auth methods
    login,
    register,
    logout,
    resetPassword,

    // Social auth methods
    loginWithSocial,
    linkSocialAccount,

    // Profile management
    updateUserProfile,
    deleteAccount,

    // Guest methods
    continueAsGuest,
    upgradeAnonymousAccount,

    // Utility methods
    isFeatureAvailable,
    getAccessLevel,
    isAdmin,
    refreshAuth,
    clearError,

    // Soft auth
    showAuthPrompt,
    dismissAuthPrompt,
    authPromptReason
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}