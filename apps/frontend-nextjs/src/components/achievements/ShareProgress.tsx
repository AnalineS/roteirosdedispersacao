/**
 * Share Progress Component - Componente de Compartilhamento de Progresso
 * Funcionalidade completa baseada na nova arquitetura API
 */

'use client';

import React, { useState } from 'react';
import { useSocialProfile, type ProgressData } from '@/hooks/useSocialProfile';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';

interface ShareContentMetadata {
  level?: number;
  totalPoints?: number;
  achievements?: number;
  streak?: number;
  achievementId?: string;
  certificateId?: string;
  moduleId?: string;
  shareType?: 'achievement' | 'certificate' | 'progress' | 'milestone';
  [key: string]: unknown;
}

interface ShareProgressProps {
  // Legacy props para compatibilidade
  isOpen?: boolean;
  onClose?: () => void;
  progressData?: {
    totalPoints: number;
    achievements_count: number;
    completedModules: number;
    streak: number;
    recent_achievements: Array<{
      id: string;
      name: string;
      description: string;
      badge_url: string;
      earned_date: string;
      xp_gained: number;
      category: string;
    }>;
  };
  userProfile?: {
    name: string;
    avatar_url?: string;
    uid: string;
  };

  // Original props
  achievementId?: string;
  certificateId?: string;
  customContent?: {
    title: string;
    description: string;
    metadata: ShareContentMetadata;
  };
  onShare?: (result: { success: boolean; shareUrl?: string }) => void;
  className?: string;
}

export default function ShareProgress({
  // Legacy props
  isOpen = false,
  onClose,
  progressData,
  userProfile,

  // Original props
  achievementId,
  certificateId,
  customContent,
  onShare,
  className = ''
}: ShareProgressProps) {
  const { user } = useAuth();
  const { shareAchievement, shareCertificate, shareProgress } = useSocialProfile();
  const { progress } = useGamification();
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; shareUrl?: string } | null>(null);

  const handleShare = async (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'copy') => {
    if (!user) return;

    setIsSharing(true);
    try {
      let result: { success: boolean; shareUrl?: string } = { success: false };

      // Determinar tipo de compartilhamento
      if (achievementId) {
        result = await shareAchievement(achievementId);
      } else if (certificateId) {
        result = await shareCertificate(certificateId);
      } else if (customContent) {
        // Convert ShareContentMetadata to ProgressData
        const progressData: ProgressData = {
          userId: user?.uid || 'anonymous',
          totalPoints: customContent.metadata.totalPoints || 0,
          completedModules: customContent.metadata.moduleId ? 1 : 0,
          certificatesEarned: customContent.metadata.certificateId ? 1 : 0,
          streakDays: customContent.metadata.streak || 0,
          achievements: customContent.metadata.achievementId ? [{
            id: customContent.metadata.achievementId,
            name: 'Achievement',
            earnedAt: new Date().toISOString()
          }] : [],
          recentActivity: []
        };
        result = await shareProgress(progressData);
      } else if (progress) {
        // Compartilhar progresso geral - convert to ProgressData
        const progressData: ProgressData = {
          userId: user?.uid || 'anonymous',
          totalPoints: progress.experiencePoints.total,
          completedModules: progress.moduleProgress.filter(m => m.status === 'completed').length,
          certificatesEarned: progress.achievements.filter(a => a.isUnlocked).length,
          streakDays: progress.streakData.currentStreak,
          achievements: progress.achievements.filter(a => a.isUnlocked).map(achievement => ({
            id: achievement.id,
            name: achievement.title,
            earnedAt: achievement.unlockedAt || new Date().toISOString(),
            description: achievement.description
          })) || [],
          recentActivity: []
        };
        result = await shareProgress(progressData);
      }

      setShareResult(result);

      if (result.success && result.shareUrl) {
        // Abrir plataforma de compartilhamento
        switch (platform) {
          case 'facebook':
            openFacebookShare(result.shareUrl);
            break;
          case 'twitter':
            openTwitterShare(result.shareUrl);
            break;
          case 'linkedin':
            openLinkedInShare(result.shareUrl);
            break;
          case 'whatsapp':
            openWhatsAppShare(result.shareUrl);
            break;
          case 'copy':
            copyToClipboard(result.shareUrl);
            break;
        }
      }

      onShare?.(result);

    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'share_progress_error', {
          event_category: 'medical_social_sharing',
          event_label: 'progress_share_failed',
          custom_parameters: {
            medical_context: 'achievement_social_sharing',
            share_type: 'progress_share',
            error_type: 'sharing_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
      setShareResult({ success: false });
    } finally {
      setIsSharing(false);
    }
  };

  const openFacebookShare = (url: string) => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const openTwitterShare = (url: string) => {
    const text = getShareText();
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const openLinkedInShare = (url: string) => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const openWhatsAppShare = (url: string) => {
    const text = getShareText();
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(shareUrl, '_blank');
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'share_clipboard_error', {
          event_category: 'medical_social_sharing',
          event_label: 'clipboard_copy_failed',
          custom_parameters: {
            medical_context: 'achievement_clipboard_sharing',
            share_type: 'clipboard_copy',
            error_type: 'clipboard_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  };

  const getShareText = (): string => {
    if (customContent) {
      return customContent.title;
    }

    if (achievementId) {
      return 'Acabei de desbloquear uma nova conquista no Sistema de Dispensação de Hanseníase! 🏆';
    }

    if (certificateId) {
      return 'Conquistei um novo certificado no Sistema de Dispensação de Hanseníase! 📜';
    }

    if (progress) {
      return `Estou no nível ${progress.experiencePoints.level} com ${progress.experiencePoints.total} pontos no Sistema de Dispensação de Hanseníase! 🚀`;
    }

    return 'Confira meu progresso no Sistema de Dispensação de Hanseníase!';
  };

  const getContentTitle = (): string => {
    if (customContent) {
      return customContent.title;
    }

    if (achievementId) {
      return 'Compartilhar Conquista';
    }

    if (certificateId) {
      return 'Compartilhar Certificado';
    }

    return 'Compartilhar Progresso';
  };

  if (!user) {
    return (
      <div className={`text-center p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-600">Faça login para compartilhar seu progresso</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {getContentTitle()}
        </h3>
        <p className="text-gray-600">
          Compartilhe suas conquistas e inspire outros!
        </p>
      </div>

      {/* Preview do conteúdo */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
            {user.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.displayName || 'Usuário'}</p>
            <p className="text-sm text-gray-600">Sistema de Dispensação de Hanseníase</p>
          </div>
        </div>
        <p className="text-gray-800 font-medium">
          {getShareText()}
        </p>
        {progress && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Nível {progress.experiencePoints.level}
            </span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {progress.experiencePoints.total} pontos
            </span>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {progress.achievements.length} conquistas
            </span>
          </div>
        )}
      </div>

      {/* Botões de compartilhamento */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => handleShare('facebook')}
          disabled={isSharing}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <span className="mr-2">📘</span>
          Facebook
        </button>

        <button
          onClick={() => handleShare('twitter')}
          disabled={isSharing}
          className="flex items-center justify-center px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          <span className="mr-2">🐦</span>
          Twitter
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          disabled={isSharing}
          className="flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          <span className="mr-2">💼</span>
          LinkedIn
        </button>

        <button
          onClick={() => handleShare('whatsapp')}
          disabled={isSharing}
          className="flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          <span className="mr-2">💬</span>
          WhatsApp
        </button>
      </div>

      <button
        onClick={() => handleShare('copy')}
        disabled={isSharing}
        className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        <span className="mr-2">📋</span>
        Copiar Link
      </button>

      {/* Resultado do compartilhamento */}
      {shareResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          shareResult.success
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">
            {shareResult.success
              ? '✅ Compartilhado com sucesso!'
              : '❌ Erro ao compartilhar. Tente novamente.'
            }
          </p>
        </div>
      )}

      {isSharing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800 text-sm">Compartilhando...</span>
          </div>
        </div>
      )}
    </div>
  );
}