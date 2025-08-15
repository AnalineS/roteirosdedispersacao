/**
 * AuthContext - Sistema de Autenticação "Soft"
 * Implementa login opcional com benefícios extras para usuários autenticados
 * Mantém compatibilidade total com o sistema atual (anônimo)
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';

import { auth, FEATURES } from '@/lib/firebase/config';
import { 
  AuthState, 
  LoginCredentials, 
  RegisterData,
  FirestoreUserProfile,
  AuthUser 
} from '@/lib/firebase/types';
import { UserProfileRepository } from '@/lib/firebase/firestore';

// ============================================
// CONTEXT TYPES
// ============================================

interface AuthContextType extends AuthState {
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Anonymous/Guest methods
  continueAsGuest: () => Promise<{ success: boolean; error?: string }>;
  upgradeAnonymousAccount: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  
  // Profile management
  profile: FirestoreUserProfile | null;
  updateUserProfile: (updates: Partial<FirestoreUserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  
  // Utility methods
  isFeatureAvailable: (feature: 'profiles' | 'conversations' | 'analytics' | 'advanced') => boolean;
  getAccessLevel: () => 'anonymous' | 'authenticated' | 'premium';
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
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  
  // Soft authentication state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string>();
  
  // Derived state
  const isAuthenticated = !!user && !user.isAnonymous;
  const isAnonymous = !!user && user.isAnonymous;

  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!FEATURES.AUTH_ENABLED) {
        return { success: false, error: 'Autenticação não está habilitada' };
      }

      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );

      // Carregar perfil do usuário
      if (userCredential.user) {
        await loadUserProfile(userCredential.user.uid);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!FEATURES.AUTH_ENABLED) {
        return { success: false, error: 'Autenticação não está habilitada' };
      }

      // Criar conta
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Atualizar display name se fornecido
      if (data.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName
        });
      }

      // Criar perfil inicial no Firestore
      if (userCredential.user) {
        await createInitialProfile(userCredential.user, data);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await signOut(auth);
      setProfile(null);
      setError(null);
      return { success: true };
    } catch (error: any) {
      const errorMessage = 'Erro ao fazer logout';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ============================================
  // ANONYMOUS/GUEST METHODS
  // ============================================

  const continueAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!FEATURES.AUTH_ENABLED) {
        // Se auth não está habilitado, simular usuário anônimo local
        setUser({
          uid: 'local-anonymous',
          isAnonymous: true,
          email: null,
          displayName: null,
          emailVerified: false
        } as AuthUser);
        return { success: true };
      }

      await signInAnonymously(auth);
      return { success: true };
    } catch (error: any) {
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

      setLoading(true);
      setError(null);

      // Criar credencial para link
      const credential = EmailAuthProvider.credential(credentials.email, credentials.password);
      
      // Link anonymous account with email/password
      await linkWithCredential(user, credential);

      // Carregar perfil se existir
      await loadUserProfile(user.uid);

      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  const loadUserProfile = async (userId: string): Promise<void> => {
    try {
      if (!FEATURES.FIRESTORE_ENABLED) {
        return;
      }

      const result = await UserProfileRepository.getProfile(userId);
      if (result.success && result.data) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const createInitialProfile = async (user: User, data: RegisterData): Promise<void> => {
    try {
      if (!FEATURES.FIRESTORE_ENABLED) {
        return;
      }

      const initialProfile: FirestoreUserProfile = {
        uid: user.uid,
        email: user.email || undefined,
        displayName: data.displayName || user.displayName || undefined,
        type: data.profileType || 'patient',
        focus: 'general',
        confidence: 0.5,
        explanation: 'Perfil criado automaticamente no registro',
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
          lastAccess: new Date().toISOString(),
          preferredTopics: [],
          totalSessions: 1,
          totalTimeSpent: 0,
          completedModules: [],
          achievements: []
        },
        stats: {
          joinedAt: new Date() as any, // Will be converted to Timestamp
          lastActiveAt: new Date() as any,
          sessionCount: 1,
          messageCount: 0,
          averageSessionDuration: 0,
          favoritePersona: 'ga',
          completionRate: 0
        },
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        version: '2.0',
        isAnonymous: false
      };

      const result = await UserProfileRepository.createProfile(initialProfile);
      if (result.success) {
        setProfile(initialProfile);
      }
    } catch (error) {
      console.error('Erro ao criar perfil inicial:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<FirestoreUserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || !FEATURES.FIRESTORE_ENABLED) {
        return { success: false, error: 'Usuário não autenticado ou Firestore indisponível' };
      }

      const result = await UserProfileRepository.updateProfileFields(user.uid, updates);
      
      if (result.success && profile) {
        setProfile({ ...profile, ...updates });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      setLoading(true);

      // Deletar dados do Firestore primeiro
      if (FEATURES.FIRESTORE_ENABLED && !user.isAnonymous) {
        await UserProfileRepository.deleteProfile(user.uid);
      }

      // Deletar conta do Authentication
      await deleteUser(user);
      
      setProfile(null);
      setUser(null);

      return { success: true };
    } catch (error: any) {
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

  const isFeatureAvailable = (feature: 'profiles' | 'conversations' | 'analytics' | 'advanced'): boolean => {
    if (!FEATURES.AUTH_ENABLED) {
      return feature === 'profiles'; // Apenas perfis locais disponíveis
    }

    switch (feature) {
      case 'profiles':
        return true; // Sempre disponível
      case 'conversations':
        return isAuthenticated || isAnonymous; // Disponível para todos os usuários
      case 'analytics':
        return isAuthenticated; // Apenas para usuários autenticados
      case 'advanced':
        return isAuthenticated && !!profile; // Apenas para usuários com perfil completo
      default:
        return false;
    }
  };

  const getAccessLevel = (): 'anonymous' | 'authenticated' | 'premium' => {
    if (!user) return 'anonymous';
    if (user.isAnonymous) return 'anonymous';
    if (isAuthenticated && profile) return 'premium';
    if (isAuthenticated) return 'authenticated';
    return 'anonymous';
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      if (user && !user.isAnonymous) {
        await loadUserProfile(user.uid);
      }
    } catch (error) {
      console.error('Erro ao atualizar autenticação:', error);
    }
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

  // Monitor authentication state
  useEffect(() => {
    if (!FEATURES.AUTH_ENABLED) {
      // Modo offline - simular usuário anônimo
      setUser({
        uid: 'local-anonymous',
        isAnonymous: true,
        email: null,
        displayName: null,
        emailVerified: false
      } as AuthUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        
        if (firebaseUser) {
          setUser(firebaseUser as AuthUser);
          
          // Carregar perfil se não for anônimo
          if (!firebaseUser.isAnonymous) {
            await loadUserProfile(firebaseUser.uid);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Erro no estado de autenticação:', error);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
    
    // Guest methods
    continueAsGuest,
    upgradeAnonymousAccount,
    
    // Profile management
    updateUserProfile,
    deleteAccount,
    
    // Utility methods
    isFeatureAvailable,
    getAccessLevel,
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

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Usuário não encontrado';
    case 'auth/wrong-password':
      return 'Senha incorreta';
    case 'auth/email-already-in-use':
      return 'E-mail já está em uso';
    case 'auth/weak-password':
      return 'Senha muito fraca';
    case 'auth/invalid-email':
      return 'E-mail inválido';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet';
    default:
      return 'Erro de autenticação';
  }
}