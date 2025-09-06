'use client';

import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';

export interface ShareData {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'achievement' | 'progress' | 'milestone';
  title: string;
  description: string;
  data: {
    moduleName?: string;
    completionPercentage?: number;
    achievementType?: string;
    points?: number;
    streak?: number;
  };
  visibility: 'public' | 'private' | 'friends';
  platforms?: {
    twitter?: boolean;
    linkedin?: boolean;
    whatsapp?: boolean;
    copy?: boolean;
  };
  createdAt: string;
}

export interface NotificationData {
  id?: string;
  userId: string;
  type: 'email' | 'push';
  category: 'achievement' | 'reminder' | 'social' | 'system';
  title: string;
  message: string;
  data?: any;
  status: 'pending' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

export class SocialService {
  // ============================================
  // COMPARTILHAMENTO DE PROGRESSO
  // ============================================

  /**
   * Salva um compartilhamento de progresso
   */
  static async saveShare(shareData: Omit<ShareData, 'id' | 'createdAt'>): Promise<{ success: boolean; shareId?: string; error?: string }> {
    try {
      if (!db) throw new Error('Firestore não configurado');
      
      const shareDoc = {
        ...shareData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'socialShares'), shareDoc);
      
      return {
        success: true,
        shareId: docRef.id,
      };
    } catch (error: any) {
      console.error('Erro ao salvar compartilhamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao salvar compartilhamento',
      };
    }
  }

  /**
   * Busca compartilhamentos públicos recentes
   */
  static async getPublicShares(limitCount: number = 10): Promise<{ success: boolean; shares?: ShareData[]; error?: string }> {
    try {
      if (!db) throw new Error('Firestore não configurado');
      
      const sharesQuery = query(
        collection(db, 'socialShares'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(sharesQuery);
      const shares: ShareData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        shares.push({
          ...data as ShareData,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });

      return {
        success: true,
        shares,
      };
    } catch (error: any) {
      console.error('Erro ao buscar compartilhamentos públicos:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar compartilhamentos',
      };
    }
  }

  /**
   * Busca compartilhamentos de um usuário específico
   */
  static async getUserShares(userId: string, limitCount: number = 20): Promise<{ success: boolean; shares?: ShareData[]; error?: string }> {
    try {
      if (!db) throw new Error('Firestore não configurado');
      
      const sharesQuery = query(
        collection(db, 'socialShares'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(sharesQuery);
      const shares: ShareData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        shares.push({
          ...data as ShareData,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });

      return {
        success: true,
        shares,
      };
    } catch (error: any) {
      console.error('Erro ao buscar compartilhamentos do usuário:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar compartilhamentos',
      };
    }
  }

  // ============================================
  // GERAÇÃO DE LINKS DE COMPARTILHAMENTO
  // ============================================

  /**
   * Gera link para Twitter
   */
  static generateTwitterLink(shareData: ShareData): string {
    const text = `${shareData.title}\n\n${shareData.description}`;
    const hashtags = 'farmácia,medicamentos,saúde';
    const url = `${window.location.origin}/share/${shareData.id}`;
    
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${hashtags}&url=${encodeURIComponent(url)}`;
  }

  /**
   * Gera link para LinkedIn
   */
  static generateLinkedInLink(shareData: ShareData): string {
    const title = shareData.title;
    const summary = shareData.description;
    const url = `${window.location.origin}/share/${shareData.id}`;
    
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
  }

  /**
   * Gera link para WhatsApp
   */
  static generateWhatsAppLink(shareData: ShareData): string {
    const text = `${shareData.title}\n\n${shareData.description}\n\nVeja mais em: ${window.location.origin}/share/${shareData.id}`;
    
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /**
   * Gera texto para cópia
   */
  static generateCopyText(shareData: ShareData): string {
    return `${shareData.title}\n\n${shareData.description}\n\nVeja mais em: ${window.location.origin}/share/${shareData.id}`;
  }

  // ============================================
  // SISTEMA DE NOTIFICAÇÕES
  // ============================================

  /**
   * Cria uma notificação
   */
  static async createNotification(notificationData: Omit<NotificationData, 'id' | 'createdAt'>): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      if (!db) throw new Error('Firestore não configurado');
      
      const notificationDoc = {
        ...notificationData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationDoc);
      
      return {
        success: true,
        notificationId: docRef.id,
      };
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar notificação',
      };
    }
  }

  /**
   * Busca notificações de um usuário
   */
  static async getUserNotifications(userId: string, limitCount: number = 20): Promise<{ success: boolean; notifications?: NotificationData[]; error?: string }> {
    try {
      if (!db) throw new Error('Firestore não configurado');
      
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(notificationsQuery);
      const notifications: NotificationData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          ...data as NotificationData,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          scheduledFor: data.scheduledFor?.toDate?.()?.toISOString() || data.scheduledFor,
          sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt,
        });
      });

      return {
        success: true,
        notifications,
      };
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar notificações',
      };
    }
  }

  // ============================================
  // TEMPLATES DE COMPARTILHAMENTO
  // ============================================

  /**
   * Templates para diferentes tipos de conquistas
   */
  static getShareTemplate(type: ShareData['type'], data: ShareData['data']): { title: string; description: string } {
    switch (type) {
      case 'achievement':
        return {
          title: `🏆 Nova Conquista Desbloqueada!`,
          description: `Acabei de conquistar "${data.achievementType}" e ganhei ${data.points || 0} pontos! 💪`,
        };

      case 'progress':
        return {
          title: `📈 Progresso no Módulo "${data.moduleName}"`,
          description: `Completei ${data.completionPercentage}% do módulo. Aprendendo muito sobre medicamentos! 📚`,
        };

      case 'milestone':
        return {
          title: `🎯 Marco Importante Alcançado!`,
          description: `Estou há ${data.streak} dias consecutivos estudando. A consistência é a chave! 🔥`,
        };

      default:
        return {
          title: '🎉 Compartilhando meu progresso!',
          description: 'Estou evoluindo nos meus estudos sobre medicamentos e farmácia!',
        };
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Formata data para exibição
   */
  static formatShareDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} h atrás`;
    } else if (diffInHours < 168) { // 7 dias
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }

  /**
   * Valida dados de compartilhamento
   */
  static validateShareData(data: Partial<ShareData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId) errors.push('ID do usuário é obrigatório');
    if (!data.userName) errors.push('Nome do usuário é obrigatório');
    if (!data.type) errors.push('Tipo de compartilhamento é obrigatório');
    if (!data.title) errors.push('Título é obrigatório');
    if (!data.description) errors.push('Descrição é obrigatória');
    if (!data.visibility) errors.push('Visibilidade é obrigatória');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gera estatísticas de compartilhamento
   */
  static generateShareStats(data: ShareData['data']): string[] {
    const stats: string[] = [];

    if (data.points) stats.push(`${data.points} pontos`);
    if (data.completionPercentage) stats.push(`${data.completionPercentage}% completo`);
    if (data.streak) stats.push(`${data.streak} dias consecutivos`);

    return stats;
  }
}