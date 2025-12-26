/**
 * Social Profile Hook - Perfil Social Baseado em API
 * Funcionalidades sociais via backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { socialService, type SocialProfile, type ShareableContent } from '@/services/socialService';
import type { AuthUser } from '@/types/auth';

// Use global Window interface from types/analytics.ts

interface EmailPreferences {
  dailyDigest?: boolean;
  weeklyReport?: boolean;
  achievements?: boolean;
  certificates?: boolean;
  newFeatures?: boolean;
  marketing?: boolean;
  productUpdates?: boolean;
  securityAlerts?: boolean;
}

interface PrivacySettings {
  profileVisible?: boolean;
  progressVisible?: boolean;
  achievementsVisible?: boolean;
  emailVisible?: boolean;
  statsVisible?: boolean;
  allowMessages?: boolean;
  showOnlineStatus?: boolean;
  shareAnalytics?: boolean;
}

export interface ProgressData {
  userId: string;
  totalPoints: number;
  completedModules: number;
  certificatesEarned: number;
  streakDays: number;
  achievements: Array<{
    id: string;
    name: string;
    earnedAt: string;
    description?: string;
  }>;
  recentActivity: Array<{
    type: 'conversation' | 'module' | 'certificate';
    title: string;
    completedAt: string;
  }>;
  timeFrame?: {
    start: string;
    end: string;
  };
}

// Extended SocialProfile para compatibilidade com SocialProfile.tsx
export interface ExtendedSocialProfile extends SocialProfile {
  email?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  createdAt?: string;
  privacy?: {
    profileVisible?: boolean;
    progressVisible?: boolean;
    achievementsVisible?: boolean;
    emailVisible?: boolean;
  };
  emailPreferences?: {
    dailyDigest?: boolean;
    weeklyReport?: boolean;
    achievements?: boolean;
    certificates?: boolean;
    newFeatures?: boolean;
  };
  stats: {
    totalConversations: number;
    certificatesEarned: number;
    streakDays: number;
    joinedAt: string;
    // Compatibilidade adicional
    totalPoints?: number;
    completedModules?: number;
    streak?: number;
  };
}

export interface SocialProfileHook {
  profile: ExtendedSocialProfile | null;
  loading: boolean;
  error: string | null;

  // Profile Management
  updateProfile: (updates: Partial<ExtendedSocialProfile>) => Promise<boolean>;
  updateAvatar: (url: string) => Promise<boolean>;
  updateEmailPreferences: (preferences: EmailPreferences) => Promise<boolean>;
  updatePrivacySettings: (settings: PrivacySettings) => Promise<boolean>;
  toggleProfileVisibility: () => Promise<boolean>;

  // Sharing Functions
  shareAchievement: (achievementId: string) => Promise<{ success: boolean; shareUrl?: string }>;
  shareCertificate: (certificateId: string) => Promise<{ success: boolean; shareUrl?: string }>;
  shareProgress: (progressData: ProgressData) => Promise<{ success: boolean; shareUrl?: string }>;

  // Social Features
  getPublicProfiles: (limit?: number) => Promise<ExtendedSocialProfile[]>;
  generateShareUrl: (type: 'achievement' | 'certificate', id: string) => string;

  // Utility
  refreshProfile: () => Promise<void>;
}

export function useSocialProfile(): SocialProfileHook {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<ExtendedSocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar perfil social do usuário
   */
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const socialProfile = await socialService.getUserSocialProfile(user.uid);

      // Converter SocialProfile para ExtendedSocialProfile
      if (socialProfile) {
        const extendedProfile: ExtendedSocialProfile = {
          ...socialProfile,
          email: user.email || undefined,
          createdAt: socialProfile.stats.joinedAt,
          privacy: {
            profileVisible: socialProfile.isPublic,
            progressVisible: true,
            achievementsVisible: true,
            emailVisible: false
          },
          emailPreferences: {
            dailyDigest: false,
            weeklyReport: false,
            achievements: true,
            certificates: true,
            newFeatures: false
          },
          stats: {
            ...socialProfile.stats,
            totalPoints: socialProfile.achievements.length * 100,
            completedModules: Math.floor(socialProfile.achievements.length / 2),
            streak: socialProfile.stats.streakDays
          }
        };
        setProfile(extendedProfile);
      } else {
        setProfile(null);
      }

    } catch (err) {
      // Medical tracking for profile load error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag!('event', 'social_profile_load_error', {
          event_category: 'medical_analytics_error',
          event_label: 'social_profile_load_failure',
          custom_parameters: {
            medical_context: 'social_profile_error_system',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            failed_operation: 'load_social_profile'
          }
        });
      }
      setError('Erro ao carregar perfil social');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  /**
   * Atualizar perfil social
   */
  const updateProfile = useCallback(async (updates: Partial<ExtendedSocialProfile>): Promise<boolean> => {
    if (!isAuthenticated || !user || !profile) return false;

    try {
      const success = await socialService.updateSocialProfile(user.uid, updates);

      if (success) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return success;
    } catch (error) {
      // Medical tracking for profile update error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag!('event', 'social_profile_update_error', {
          event_category: 'medical_analytics_error',
          event_label: 'social_profile_update_failure',
          custom_parameters: {
            medical_context: 'social_profile_error_system',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failed_operation: 'update_social_profile'
          }
        });
      }
      return false;
    }
  }, [user, isAuthenticated, profile]);

  /**
   * Alternar visibilidade do perfil
   */
  const toggleProfileVisibility = useCallback(async (): Promise<boolean> => {
    if (!profile) return false;

    return await updateProfile({ isPublic: !profile.isPublic });
  }, [profile, updateProfile]);

  /**
   * Compartilhar conquista
   */
  const shareAchievement = useCallback(async (achievementId: string): Promise<{ success: boolean; shareUrl?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false };
    }

    try {
      const content: ShareableContent = {
        type: 'achievement',
        title: 'Nova Conquista Desbloqueada! 🏆',
        description: `${user.displayName || 'Usuário'} desbloqueou uma nova conquista no Sistema de Dispensação de Hanseníase`,
        metadata: {
          achievementId,
          userId: user.uid,
          timestamp: new Date().toISOString()
        }
      };

      const result = await socialService.shareContent(content);
      return result;

    } catch (error) {
      // Medical tracking for achievement share error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag!('event', 'achievement_share_error', {
          event_category: 'medical_analytics_error',
          event_label: 'achievement_share_failure',
          custom_parameters: {
            medical_context: 'social_profile_error_system',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failed_operation: 'share_achievement'
          }
        });
      }
      return { success: false };
    }
  }, [user, isAuthenticated]);

  /**
   * Compartilhar certificado
   */
  const shareCertificate = useCallback(async (certificateId: string): Promise<{ success: boolean; shareUrl?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false };
    }

    try {
      const content: ShareableContent = {
        type: 'certificate',
        title: 'Certificado Conquistado! 📜',
        description: `${user.displayName || 'Usuário'} conquistou um certificado no Sistema de Dispensação de Hanseníase`,
        metadata: {
          certificateId,
          userId: user.uid,
          timestamp: new Date().toISOString()
        }
      };

      const result = await socialService.shareContent(content);
      return result;

    } catch (error) {
      // Medical tracking for certificate share error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag!('event', 'certificate_share_error', {
          event_category: 'medical_analytics_error',
          event_label: 'certificate_share_failure',
          custom_parameters: {
            medical_context: 'social_profile_error_system',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failed_operation: 'share_certificate'
          }
        });
      }
      return { success: false };
    }
  }, [user, isAuthenticated]);

  /**
   * Compartilhar progresso
   */
  const shareProgress = useCallback(async (progressData: ProgressData): Promise<{ success: boolean; shareUrl?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false };
    }

    try {
      const content: ShareableContent = {
        type: 'progress',
        title: 'Progresso no Aprendizado! 📈',
        description: `${user.displayName || 'Usuário'} está progredindo no Sistema de Dispensação de Hanseníase`,
        metadata: {
          ...progressData,
          userId: user.uid,
          timestamp: new Date().toISOString()
        }
      };

      const result = await socialService.shareContent(content);
      return result;

    } catch (error) {
      // Medical tracking for progress share error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag!('event', 'progress_share_error', {
          event_category: 'medical_analytics_error',
          event_label: 'progress_share_failure',
          custom_parameters: {
            medical_context: 'social_profile_error_system',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failed_operation: 'share_progress'
          }
        });
      }
      return { success: false };
    }
  }, [user, isAuthenticated]);

  /**
   * Atualizar avatar
   */
  const updateAvatar = useCallback(async (url: string): Promise<boolean> => {
    return await updateProfile({ photoURL: url });
  }, [updateProfile]);

  /**
   * Atualizar preferências de email
   */
  const updateEmailPreferences = useCallback(async (preferences: EmailPreferences): Promise<boolean> => {
    return await updateProfile({ emailPreferences: preferences });
  }, [updateProfile]);

  /**
   * Atualizar configurações de privacidade
   */
  const updatePrivacySettings = useCallback(async (settings: PrivacySettings): Promise<boolean> => {
    return await updateProfile({
      privacy: settings,
      isPublic: settings.profileVisible
    });
  }, [updateProfile]);

  /**
   * Obter perfis públicos
   */
  const getPublicProfiles = useCallback(async (limit: number = 10): Promise<ExtendedSocialProfile[]> => {
    try {
      const profiles = await socialService.getPublicAchievements(limit);
      return profiles.map(profile => ({
        ...profile,
        createdAt: profile.stats.joinedAt,
        privacy: { profileVisible: profile.isPublic },
        stats: {
          ...profile.stats,
          totalPoints: profile.achievements.length * 100,
          completedModules: Math.floor(profile.achievements.length / 2),
          streak: profile.stats.streakDays
        }
      }));
    } catch (error) {
      // Medical tracking for public profiles load error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag!('event', 'public_profiles_load_error', {
          event_category: 'medical_analytics_error',
          event_label: 'public_profiles_load_failure',
          custom_parameters: {
            medical_context: 'social_profile_error_system',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            failed_operation: 'load_public_profiles'
          }
        });
      }
      return [];
    }
  }, []);

  /**
   * Gerar URL de compartilhamento
   */
  const generateShareUrl = useCallback((type: 'achievement' | 'certificate', id: string): string => {
    switch (type) {
      case 'achievement':
        return socialService.generateAchievementShareUrl(id);
      case 'certificate':
        return socialService.generateCertificateShareUrl(id);
      default:
        return '';
    }
  }, []);

  /**
   * Atualizar perfil
   */
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Effect para carregar perfil inicial
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    updateEmailPreferences,
    updatePrivacySettings,
    toggleProfileVisibility,
    shareAchievement,
    shareCertificate,
    shareProgress,
    getPublicProfiles,
    generateShareUrl,
    refreshProfile
  };
}