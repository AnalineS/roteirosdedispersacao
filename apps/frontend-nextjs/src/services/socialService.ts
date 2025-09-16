/**
 * Social Service - API-based Social Features
 * Substitui Firebase com funcionalidades sociais via API
 */

import { apiClient } from '@/services/api';

export interface SocialProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  isPublic: boolean;
  stats: {
    totalConversations: number;
    certificatesEarned: number;
    streakDays: number;
    joinedAt: string;
  };
  achievements: string[];
  badges: string[];
}

export interface ShareableContent {
  type: 'achievement' | 'certificate' | 'progress' | 'milestone';
  title: string;
  description: string;
  imageUrl?: string;
  metadata: {
    [key: string]: any;
  };
}

class SocialService {
  /**
   * Obter perfil social do usuário
   */
  async getUserSocialProfile(uid: string): Promise<SocialProfile | null> {
    try {
      // TODO: Implementar endpoint no backend
      const response = await apiClient.get<SocialProfile>(`/social/profile/${uid}`);
      return response;
    } catch (error) {
      console.error('Erro ao carregar perfil social:', error);

      // Fallback para dados locais/simulados
      return this.getLocalSocialProfile(uid);
    }
  }

  /**
   * Atualizar perfil social
   */
  async updateSocialProfile(uid: string, updates: Partial<SocialProfile>): Promise<boolean> {
    try {
      await apiClient.post(`/social/profile/${uid}`, updates);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil social:', error);
      return false;
    }
  }

  /**
   * Compartilhar conteúdo
   */
  async shareContent(content: ShareableContent): Promise<{ success: boolean; shareUrl?: string }> {
    try {
      const response = await apiClient.post<{ shareUrl: string }>('/social/share', content);
      return {
        success: true,
        shareUrl: response.shareUrl
      };
    } catch (error) {
      console.error('Erro ao compartilhar conteúdo:', error);
      return { success: false };
    }
  }

  /**
   * Obter conquistas públicas
   */
  async getPublicAchievements(limit: number = 10): Promise<SocialProfile[]> {
    try {
      const response = await apiClient.get<SocialProfile[]>(`/social/achievements?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Erro ao carregar conquistas públicas:', error);
      return [];
    }
  }

  /**
   * Gerar URL de compartilhamento para certificado
   */
  generateCertificateShareUrl(certificateId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/certificate/${certificateId}`;
  }

  /**
   * Gerar URL de compartilhamento para conquista
   */
  generateAchievementShareUrl(achievementId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/achievement/${achievementId}`;
  }

  /**
   * Obter dados para compartilhamento social (Open Graph)
   */
  async getShareMetadata(type: string, id: string): Promise<{
    title: string;
    description: string;
    imageUrl: string;
    url: string;
  } | null> {
    try {
      const response = await apiClient.get<any>(`/social/metadata/${type}/${id}`);
      return response;
    } catch (error) {
      console.error('Erro ao carregar metadados de compartilhamento:', error);
      return null;
    }
  }

  /**
   * Fallback para perfil social local
   */
  private getLocalSocialProfile(uid: string): SocialProfile | null {
    try {
      const stored = localStorage.getItem(`social-profile-${uid}`);
      if (stored) {
        return JSON.parse(stored);
      }

      // Criar perfil padrão
      return {
        uid,
        displayName: 'Usuário',
        isPublic: false,
        stats: {
          totalConversations: 0,
          certificatesEarned: 0,
          streakDays: 0,
          joinedAt: new Date().toISOString()
        },
        achievements: [],
        badges: []
      };
    } catch (error) {
      console.error('Erro ao carregar perfil social local:', error);
      return null;
    }
  }

  /**
   * Salvar perfil social localmente
   */
  private saveLocalSocialProfile(uid: string, profile: SocialProfile): void {
    try {
      localStorage.setItem(`social-profile-${uid}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Erro ao salvar perfil social local:', error);
    }
  }
}

export const socialService = new SocialService();
export default socialService;