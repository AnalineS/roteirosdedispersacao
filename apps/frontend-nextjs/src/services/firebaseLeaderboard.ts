/**
 * Firebase Leaderboard Service
 * Sistema real de leaderboard usando Firestore para persistência
 * Integração com sistema de gamificação existente
 * 
 * ✨ Firebase v12.2.1 Enhanced Features:
 * - Improved error handling with AI-powered insights
 * - Enhanced real-time synchronization
 * - Better App Check integration
 */

'use client';

import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db, FEATURES } from '@/lib/firebase/config';
import type { 
  LeaderboardEntry, 
  LearningProgress, 
  Achievement 
} from '@/types/gamification';

// Helper para verificar se Firestore está disponível
function requireFirestore() {
  if (!db) {
    throw new Error('Firestore não está disponível - configuração Firebase inválida');
  }
  return db;
}

function isFirestoreAvailable(): boolean {
  return FEATURES.FIRESTORE_ENABLED && !!db;
}

// ============================================================================
// TYPES
// ============================================================================

export interface FirebaseLeaderboardEntry extends LeaderboardEntry {
  id: string;
  lastUpdated: Date;
  isActive: boolean;
  weeklyXP: number;
  monthlyXP: number;
}

export interface LeaderboardStats {
  totalUsers: number;
  activeUsers: number;
  averageXP: number;
  topPerformer: FirebaseLeaderboardEntry | null;
}

export interface LeaderboardUpdateData {
  userId: string;
  displayName: string;
  totalXP: number;
  level: number;
  achievementCount: number;
  currentStreak: number;
  xpGained: number;
  badgeHighlight?: Achievement;
}

// ============================================================================
// FIREBASE LEADERBOARD SERVICE
// ============================================================================

class FirebaseLeaderboardService {
  private readonly COLLECTION_NAME = 'leaderboard';
  private readonly MAX_ENTRIES = 1000;
  private listeners: Map<string, () => void> = new Map();

  // ============================================================================
  // LEADERBOARD OPERATIONS
  // ============================================================================

  /**
   * Atualizar entrada do usuário no leaderboard
   */
  async updateUserEntry(
    userId: string, 
    updateData: LeaderboardUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(requireFirestore(), this.COLLECTION_NAME, userId);
      const existingDoc = await getDoc(userRef);

      const now = new Date();
      const currentWeek = this.getWeekNumber(now);
      const currentMonth = now.getMonth();

      let weeklyXP = updateData.xpGained;
      let monthlyXP = updateData.xpGained;

      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        const lastUpdated = existingData.lastUpdated?.toDate() || new Date(0);
        const lastWeek = this.getWeekNumber(lastUpdated);
        const lastMonth = lastUpdated.getMonth();

        // Acumular XP se for na mesma semana/mês
        if (currentWeek === lastWeek) {
          weeklyXP += existingData.weeklyXP || 0;
        }
        if (currentMonth === lastMonth) {
          monthlyXP += existingData.monthlyXP || 0;
        }
      }

      const entryData: Partial<FirebaseLeaderboardEntry> = {
        userId,
        displayName: updateData.displayName,
        totalXP: updateData.totalXP,
        level: updateData.level,
        achievementCount: updateData.achievementCount,
        currentStreak: updateData.currentStreak,
        badgeHighlight: updateData.badgeHighlight,
        lastUpdated: now,
        isActive: true,
        weeklyXP,
        monthlyXP,
        rank: 0 // Será recalculado
      };

      await setDoc(userRef, entryData, { merge: true });
      
      // Recalcular rankings após atualização
      await this.recalculateRankings();

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar leaderboard geral
   */
  async getLeaderboard(
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limitCount: number = 50
  ): Promise<{ success: boolean; data?: FirebaseLeaderboardEntry[]; error?: string }> {
    try {
      let orderField = 'totalXP';
      
      switch (type) {
        case 'weekly':
          orderField = 'weeklyXP';
          break;
        case 'monthly':
          orderField = 'monthlyXP';
          break;
        default:
          orderField = 'totalXP';
      }

      const q = query(
        collection(requireFirestore(), this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy(orderField, 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const entries: FirebaseLeaderboardEntry[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as FirebaseLeaderboardEntry);
      });

      return { success: true, data: entries };
    } catch (error: any) {
      console.error('Erro ao buscar leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar posição específica do usuário
   */
  async getUserRank(
    userId: string,
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ): Promise<{ success: boolean; data?: { rank: number; totalUsers: number }; error?: string }> {
    try {
      const userDoc = await getDoc(doc(requireFirestore(), this.COLLECTION_NAME, userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: 'Usuário não encontrado no leaderboard' };
      }

      const userData = userDoc.data();
      let userScore = userData.totalXP;

      switch (type) {
        case 'weekly':
          userScore = userData.weeklyXP || 0;
          break;
        case 'monthly':
          userScore = userData.monthlyXP || 0;
          break;
      }

      let orderField = 'totalXP';
      switch (type) {
        case 'weekly':
          orderField = 'weeklyXP';
          break;
        case 'monthly':
          orderField = 'monthlyXP';
          break;
      }

      // Contar usuários acima
      const q = query(
        collection(requireFirestore(), this.COLLECTION_NAME),
        where('isActive', '==', true),
        where(orderField, '>', userScore)
      );

      const snapshot = await getDocs(q);
      const usersAbove = snapshot.size;

      // Contar total de usuários ativos
      const totalQuery = query(
        collection(requireFirestore(), this.COLLECTION_NAME),
        where('isActive', '==', true)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const totalUsers = totalSnapshot.size;

      return {
        success: true,
        data: {
          rank: usersAbove + 1,
          totalUsers
        }
      };
    } catch (error: any) {
      console.error('Erro ao buscar rank do usuário:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar estatísticas do leaderboard
   */
  async getLeaderboardStats(): Promise<{ success: boolean; data?: LeaderboardStats; error?: string }> {
    try {
      const q = query(
        collection(requireFirestore(), this.COLLECTION_NAME),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      let totalXP = 0;
      let topPerformer: FirebaseLeaderboardEntry | null = null;
      let maxXP = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        totalXP += data.totalXP || 0;

        if (data.totalXP > maxXP) {
          maxXP = data.totalXP;
          topPerformer = {
            id: doc.id,
            ...data,
            lastUpdated: data.lastUpdated?.toDate() || new Date()
          } as FirebaseLeaderboardEntry;
        }
      });

      const stats: LeaderboardStats = {
        totalUsers: snapshot.size,
        activeUsers: snapshot.size, // Já filtrado por isActive
        averageXP: snapshot.size > 0 ? Math.round(totalXP / snapshot.size) : 0,
        topPerformer
      };

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscrever atualizações do leaderboard em tempo real
   * ✨ Firebase v12.2.1: Enhanced real-time sync with improved error handling
   */
  subscribeToLeaderboard(
    callback: (entries: FirebaseLeaderboardEntry[]) => void,
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limitCount: number = 50
  ): () => void {
    let orderField = 'totalXP';
    
    switch (type) {
      case 'weekly':
        orderField = 'weeklyXP';
        break;
      case 'monthly':
        orderField = 'monthlyXP';
        break;
    }

    const q = query(
      collection(requireFirestore(), this.COLLECTION_NAME),
      where('isActive', '==', true),
      orderBy(orderField, 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const entries: FirebaseLeaderboardEntry[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          entries.push({
            id: doc.id,
            ...data,
            lastUpdated: data.lastUpdated?.toDate() || new Date()
          } as FirebaseLeaderboardEntry);
        });

        callback(entries);
      } catch (processingError) {
        // Firebase v12.2.1: Better error context for debugging
        console.error('Erro no processamento de dados do leaderboard:', {
          error: processingError,
          snapshotSize: snapshot.size,
          type
        });
      }
    }, (error) => {
      // Firebase v12.2.1: Enhanced error messages (reduced verbosity)
      console.error('Erro na subscrição do leaderboard:', {
        code: error.code,
        message: error.message,
        type
      });
    });

    const listenerId = `leaderboard_${type}_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Subscrever posição do usuário em tempo real
   */
  subscribeToUserRank(
    userId: string,
    callback: (rank: number, totalUsers: number) => void,
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ): () => void {
    const userRef = doc(requireFirestore(), this.COLLECTION_NAME, userId);

    const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (doc.exists()) {
        const rankResult = await this.getUserRank(userId, type);
        if (rankResult.success && rankResult.data) {
          callback(rankResult.data.rank, rankResult.data.totalUsers);
        }
      }
    });

    const listenerId = `user_rank_${userId}_${type}_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return unsubscribe;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Recalcular rankings de todos os usuários
   */
  private async recalculateRankings(): Promise<void> {
    try {
      const batch = writeBatch(requireFirestore());
      
      // Buscar todos os usuários ordenados por XP total
      const q = query(
        collection(requireFirestore(), this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('totalXP', 'desc')
      );

      const snapshot = await getDocs(q);
      let currentRank = 1;

      snapshot.forEach((docSnapshot) => {
        const docRef = doc(requireFirestore(), this.COLLECTION_NAME, docSnapshot.id);
        batch.update(docRef, { rank: currentRank++ });
      });

      await batch.commit();
      console.log('Rankings recalculados com sucesso');
    } catch (error) {
      console.error('Erro ao recalcular rankings:', error);
    }
  }

  /**
   * Limpar dados antigos (semanal/mensal)
   */
  async cleanupOldData(): Promise<void> {
    try {
      const now = new Date();
      const currentWeek = this.getWeekNumber(now);
      const currentMonth = now.getMonth();

      const q = query(collection(requireFirestore(), this.COLLECTION_NAME));
      const snapshot = await getDocs(q);
      const batch = writeBatch(requireFirestore());

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const lastUpdated = data.lastUpdated?.toDate() || new Date(0);
        const dataWeek = this.getWeekNumber(lastUpdated);
        const dataMonth = lastUpdated.getMonth();

        const updates: any = {};

        // Reset semanal
        if (currentWeek !== dataWeek) {
          updates.weeklyXP = 0;
        }

        // Reset mensal
        if (currentMonth !== dataMonth) {
          updates.monthlyXP = 0;
        }

        if (Object.keys(updates).length > 0) {
          const docRef = doc(requireFirestore(), this.COLLECTION_NAME, docSnapshot.id);
          batch.update(docRef, updates);
        }
      });

      await batch.commit();
      console.log('Limpeza de dados antigos concluída');
    } catch (error) {
      console.error('Erro na limpeza de dados:', error);
    }
  }

  /**
   * Desativar usuário do leaderboard
   */
  async deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(requireFirestore(), this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        isActive: false,
        lastUpdated: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincronizar progresso local com Firebase
   */
  async syncUserProgress(
    userId: string,
    progress: LearningProgress,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: LeaderboardUpdateData = {
        userId,
        displayName,
        totalXP: progress.experiencePoints.total,
        level: progress.experiencePoints.level,
        achievementCount: progress.achievements.length,
        currentStreak: progress.streakData.currentStreak,
        xpGained: 0, // Para sync, não adicionar XP
        badgeHighlight: progress.achievements[0] // Primeiro achievement como destaque
      };

      return await this.updateUserEntry(userId, updateData);
    } catch (error: any) {
      console.error('Erro ao sincronizar progresso:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Destruir todas as subscrições ativas
   */
  destroy(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const firebaseLeaderboard = new FirebaseLeaderboardService();
export default firebaseLeaderboard;