'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSafeAuth as useAuth } from './useSafeAuth';
import { db } from '@/lib/firebase/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';

export interface SocialProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  emailPreferences?: {
    notifications: boolean;
    marketing: boolean;
    weeklyDigest: boolean;
    mentions: boolean;
  };
  privacy?: {
    profileVisible: boolean;
    progressVisible: boolean;
    achievementsVisible: boolean;
    emailVisible: boolean;
  };
  stats?: {
    completedModules: number;
    totalPoints: number;
    streak: number;
    joinedAt: string;
    lastActive: string;
  };
  achievements?: string[];
  connectedAccounts?: {
    google?: {
      connected: boolean;
      email?: string;
      connectedAt?: string;
    };
    microsoft?: {
      connected: boolean;
      email?: string;
      connectedAt?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UseSocialProfileReturn {
  profile: SocialProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<SocialProfile>) => Promise<boolean>;
  updateAvatar: (photoURL: string) => Promise<boolean>;
  updateEmailPreferences: (preferences: SocialProfile['emailPreferences']) => Promise<boolean>;
  updatePrivacySettings: (privacy: SocialProfile['privacy']) => Promise<boolean>;
  connectAccount: (provider: 'google' | 'microsoft', accountData: any) => Promise<boolean>;
  disconnectAccount: (provider: 'google' | 'microsoft') => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_EMAIL_PREFERENCES: SocialProfile['emailPreferences'] = {
  notifications: true,
  marketing: false,
  weeklyDigest: true,
  mentions: true,
};

const DEFAULT_PRIVACY: SocialProfile['privacy'] = {
  profileVisible: true,
  progressVisible: true,
  achievementsVisible: true,
  emailVisible: false,
};

export function useSocialProfile(): UseSocialProfileReturn {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProfile(null);
    setLoading(true);
    setError(null);
  }, []);

  // Criar perfil social padrão para novo usuário
  const createDefaultProfile = useCallback(async (user: any): Promise<SocialProfile> => {
    const defaultProfile: SocialProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      bio: '',
      location: '',
      website: '',
      socialLinks: {},
      emailPreferences: DEFAULT_EMAIL_PREFERENCES,
      privacy: DEFAULT_PRIVACY,
      stats: {
        completedModules: 0,
        totalPoints: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      },
      achievements: [],
      connectedAccounts: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (!db) throw new Error('Firebase não configurado');
      const profileRef = doc(db, 'socialProfiles', user.uid);
      await setDoc(profileRef, {
        ...defaultProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'stats.joinedAt': serverTimestamp(),
        'stats.lastActive': serverTimestamp(),
      });
      
      return defaultProfile;
    } catch (err) {
      console.error('Erro ao criar perfil social padrão:', err);
      throw err;
    }
  }, []);

  // Buscar perfil social do Firestore
  const fetchProfile = useCallback(async (uid: string): Promise<SocialProfile | null> => {
    try {
      if (!db) throw new Error('Firebase não configurado');
      const profileRef = doc(db, 'socialProfiles', uid);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        
        // Converter timestamps do Firestore para strings ISO
        const profile: SocialProfile = {
          ...data as SocialProfile,
          uid,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          stats: {
            ...data.stats,
            joinedAt: data.stats?.joinedAt?.toDate?.()?.toISOString() || data.stats?.joinedAt || new Date().toISOString(),
            lastActive: data.stats?.lastActive?.toDate?.()?.toISOString() || data.stats?.lastActive || new Date().toISOString(),
          },
        };
        
        return profile;
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao buscar perfil social:', err);
      throw err;
    }
  }, []);

  // Carregar perfil quando usuário está autenticado
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tentar buscar perfil existente
        let socialProfile = await fetchProfile(user.uid);
        
        // Se não existe, criar um novo
        if (!socialProfile) {
          socialProfile = await createDefaultProfile(user);
        }

        setProfile(socialProfile);

        // Configurar listener em tempo real
        if (!db) throw new Error('Firebase não configurado');
      const profileRef = doc(db, 'socialProfiles', user.uid);
        unsubscribe = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const updatedProfile: SocialProfile = {
              ...data as SocialProfile,
              uid: user.uid,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              stats: {
                ...data.stats,
                joinedAt: data.stats?.joinedAt?.toDate?.()?.toISOString() || data.stats?.joinedAt || new Date().toISOString(),
                lastActive: data.stats?.lastActive?.toDate?.()?.toISOString() || data.stats?.lastActive || new Date().toISOString(),
              },
            };
            setProfile(updatedProfile);
          }
        }, (error) => {
          console.error('Erro no listener do perfil social:', error);
          setError('Erro ao sincronizar perfil social');
        });
        
      } catch (err: any) {
        console.error('Erro ao carregar perfil social:', err);
        setError(err.message || 'Erro ao carregar perfil social');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, authLoading, fetchProfile, createDefaultProfile]);

  // Atualizar perfil
  const updateProfile = useCallback(async (updates: Partial<SocialProfile>): Promise<boolean> => {
    if (!user || !profile) {
      setError('Usuário não autenticado ou perfil não carregado');
      return false;
    }

    try {
      if (!db) throw new Error('Firebase não configurado');
      const profileRef = doc(db, 'socialProfiles', user.uid);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        'stats.lastActive': serverTimestamp(),
      };

      await updateDoc(profileRef, updateData);
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar perfil social:', err);
      setError(err.message || 'Erro ao atualizar perfil social');
      return false;
    }
  }, [user, profile]);

  // Atualizar avatar
  const updateAvatar = useCallback(async (photoURL: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      // Atualizar no perfil social
      const success = await updateProfile({ photoURL });
      
      // Também atualizar no Firebase Auth se necessário
      if (success && user.photoURL !== photoURL) {
        const { updateProfile: updateAuthProfile } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase/config');
        if (auth && auth.currentUser) {
          await updateAuthProfile(auth.currentUser, { photoURL });
        }
      }
      
      return success;
    } catch (err: any) {
      console.error('Erro ao atualizar avatar:', err);
      setError(err.message || 'Erro ao atualizar avatar');
      return false;
    }
  }, [user, updateProfile]);

  // Atualizar preferências de email
  const updateEmailPreferences = useCallback(async (emailPreferences: SocialProfile['emailPreferences']): Promise<boolean> => {
    return updateProfile({ emailPreferences });
  }, [updateProfile]);

  // Atualizar configurações de privacidade
  const updatePrivacySettings = useCallback(async (privacy: SocialProfile['privacy']): Promise<boolean> => {
    return updateProfile({ privacy });
  }, [updateProfile]);

  // Conectar conta externa
  const connectAccount = useCallback(async (provider: 'google' | 'microsoft', accountData: any): Promise<boolean> => {
    if (!profile) return false;

    const connectedAccounts = {
      ...profile.connectedAccounts,
      [provider]: {
        connected: true,
        email: accountData.email,
        connectedAt: new Date().toISOString(),
      },
    };

    return updateProfile({ connectedAccounts });
  }, [profile, updateProfile]);

  // Desconectar conta externa
  const disconnectAccount = useCallback(async (provider: 'google' | 'microsoft'): Promise<boolean> => {
    if (!profile) return false;

    const connectedAccounts = {
      ...profile.connectedAccounts,
      [provider]: {
        connected: false,
        email: undefined,
        connectedAt: undefined,
      },
    };

    return updateProfile({ connectedAccounts });
  }, [profile, updateProfile]);

  // Atualizar dados manualmente
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const refreshedProfile = await fetchProfile(user.uid);
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil social:', err);
      setError(err.message || 'Erro ao atualizar perfil social');
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    updateEmailPreferences,
    updatePrivacySettings,
    connectAccount,
    disconnectAccount,
    refreshProfile,
    reset,
  };
}