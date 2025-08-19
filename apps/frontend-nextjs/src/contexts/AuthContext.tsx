/**
 * AuthContext - Sistema de Autenticação "Soft"
 * Implementa login opcional com benefícios extras para usuários autenticados
 * Mantém compatibilidade total com o sistema atual (anônimo)
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { 
  User,
  AuthProvider
} from 'firebase/auth';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  deleteUser,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

import { auth, FEATURES, getAuthProvider, googleProvider } from '@/lib/firebase/config';
import { 
  AuthState, 
  LoginCredentials, 
  RegisterData,
  SocialAuthCredentials,
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
  
  // Social authentication
  loginWithSocial: (credentials: SocialAuthCredentials) => Promise<{ success: boolean; error?: string }>;
  linkSocialAccount: (providerId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Profile management
  profile: FirestoreUserProfile | null;
  updateUserProfile: (updates: Partial<FirestoreUserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  
  // Anonymous/Guest methods
  continueAsGuest: () => Promise<{ success: boolean; error?: string }>;
  upgradeAnonymousAccount: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  
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

      if (!auth) {
        throw new Error('Firebase auth não está disponível');
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

      if (!auth) {
        throw new Error('Firebase auth não está disponível');
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
      if (!auth) {
        throw new Error('Firebase auth não está disponível');
      }
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
      if (!auth) {
        throw new Error('Firebase auth não está disponível');
      }
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ============================================
  // SOCIAL AUTHENTICATION METHODS
  // ============================================

  const loginWithSocial = async (credentials: SocialAuthCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!FEATURES.AUTH_ENABLED) {
        return { success: false, error: 'Autenticação não está habilitada' };
      }

      if (!auth) {
        throw new Error('Firebase auth não está disponível');
      }

      const provider = getAuthProvider(credentials.providerId);
      
      // Tentar login com popup primeiro, fallback para redirect em mobile
      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // Se popup falhar (bloqueador de popup ou mobile), usar redirect
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
          return { success: true }; // O redirect será tratado no onAuthStateChanged
        }
        throw popupError;
      }

      // Atualizar display name se fornecido e diferente
      if (credentials.preferredDisplayName && 
          userCredential.user.displayName !== credentials.preferredDisplayName) {
        await updateProfile(userCredential.user, {
          displayName: credentials.preferredDisplayName
        });
      }

      // Criar perfil inicial se for novo usuário
      if (userCredential.user) {
        await createSocialUserProfile(userCredential.user, credentials);
      } else if (userCredential.user) {
        // Carregar perfil existente
        await loadUserProfile(userCredential.user.uid);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = getSocialAuthErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const linkSocialAccount = async (providerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      setLoading(true);
      setError(null);

      if (!auth) {
        throw new Error('Firebase auth não está disponível');
      }

      const provider = getAuthProvider(providerId);
      
      // Tentar link com popup primeiro
      let result;
      try {
        const socialResult = await signInWithPopup(auth, provider);
        result = socialResult;
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked') {
          return { success: false, error: 'Popup foi bloqueado. Habilite popups e tente novamente.' };
        }
        throw popupError;
      }

      // Atualizar perfil com informações adicionais se disponíveis
      if (result.user) {
        await loadUserProfile(result.user.uid);
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = getSocialAuthErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
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

      if (!auth) {
        throw new Error('Firebase auth não está disponível');
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
      if (!auth) {
        throw new Error('Firebase auth não está disponível');
      }
      await linkWithCredential(user as User, credential);

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
      if (!auth) {
        throw new Error('Firebase auth não está disponível');
      }
      await deleteUser(user as User);
      
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
  // PROFILE MANAGEMENT METHODS (SECOND IMPLEMENTATION - REMOVE)
  // ============================================

  const updateUserProfileSecond = async (updates: Partial<FirestoreUserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      setLoading(true);
      setError(null);

      // Atualizar nome no Firebase Auth se fornecido
      if (updates.displayName && updates.displayName !== user.displayName) {
        await updateProfile(user as User, {
          displayName: updates.displayName
        });
      }

      // Atualizar perfil no Firestore se habilitado
      if (FEATURES.FIRESTORE_ENABLED && profile) {
        const updatedProfile = {
          ...profile,
          ...updates,
          updatedAt: new Date() as any
        };

        const result = await UserProfileRepository.updateProfile(user.uid, updatedProfile);
        if (result.success) {
          setProfile(updatedProfile);
        } else {
          return { success: false, error: result.error };
        }
      } else {
        // Atualizar apenas localmente se Firestore não disponível
        setProfile(prev => prev ? { ...prev, ...updates, updatedAt: new Date() as any } : null);
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

  const deleteAccountSecond = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      setLoading(true);
      setError(null);

      // Deletar perfil do Firestore primeiro
      if (FEATURES.FIRESTORE_ENABLED && profile) {
        await UserProfileRepository.deleteProfile(user.uid);
      }

      // Deletar usuário do Firebase Auth
      await deleteUser(user as User);

      // Limpar estado local
      setUser(null);
      setProfile(null);
      setIsAuth(false);
      setIsAnon(false);

      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createSocialUserProfile = async (user: User, credentials: SocialAuthCredentials): Promise<void> => {
    try {
      if (!FEATURES.FIRESTORE_ENABLED) {
        return;
      }

      // Extrair informações do provedor social
      const providerData = user.providerData[0];
      const displayName = credentials.preferredDisplayName || 
                         user.displayName || 
                         providerData?.displayName || 
                         user.email?.split('@')[0] || 
                         'Usuário';

      const initialProfile: FirestoreUserProfile = {
        uid: user.uid,
        email: user.email || providerData?.email || undefined,
        displayName: displayName,
        type: credentials.preferredProfileType || 'patient',
        focus: 'general',
        confidence: 0.5,
        explanation: `Perfil criado via login social (${credentials.providerId})`,
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
          joinedAt: new Date() as any,
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
      console.error('Erro ao criar perfil social:', error);
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

    if (!auth) {
      setLoading(false);
      return () => {}; // Return empty cleanup function
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

function getSocialAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/account-exists-with-different-credential':
      return 'Uma conta já existe com o mesmo e-mail mas provedor diferente';
    case 'auth/auth-domain-config-required':
      return 'Configuração de domínio de autenticação necessária';
    case 'auth/cancelled-popup-request':
      return 'Solicitação de popup cancelada';
    case 'auth/operation-not-allowed':
      return 'Operação não permitida';
    case 'auth/popup-blocked':
      return 'Popup foi bloqueado pelo navegador';
    case 'auth/popup-closed-by-user':
      return 'Popup foi fechado pelo usuário';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado';
    case 'auth/user-disabled':
      return 'Conta de usuário foi desabilitada';
    case 'auth/credential-already-in-use':
      return 'Esta conta social já está vinculada a outro usuário';
    case 'auth/provider-already-linked':
      return 'Esta conta social já está vinculada ao seu perfil';
    case 'auth/invalid-credential':
      return 'Credenciais inválidas para este provedor';
    case 'auth/web-storage-unsupported':
      return 'Armazenamento web não suportado';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet';
    default:
      return getFirebaseErrorMessage(errorCode); // Fallback para erros comuns
  }
}