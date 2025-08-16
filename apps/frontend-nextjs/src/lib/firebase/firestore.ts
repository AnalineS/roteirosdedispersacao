/**
 * Firestore Utilities
 * Funções utilitárias para operações no Firestore
 * Implementa o padrão Repository para dados do usuário
 */

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference
} from 'firebase/firestore';

import { db, FIRESTORE_CONFIG, FEATURES } from './config';
import {
  FirestoreUserProfile,
  FirestoreConversation,
  FirestoreFeedback,
  SessionData,
  LearningProgress,
  SyncStatus,
  DataMigration,
  FirebaseApiResponse,
  BatchOperationResult,
  PaginationOptions,
  QueryFilters,
  TimestampPair
} from './types';

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Helper para verificar se Firestore está disponível
function requireFirestore() {
  if (!db) {
    throw new Error('Firestore não está disponível - configuração Firebase inválida');
  }
  return db;
}

/**
 * Converter Firestore Timestamp para Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Converter Date para Firestore Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Criar timestamps padrão
 */
export function createTimestamps(): TimestampPair {
  const now = Timestamp.now();
  return {
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Atualizar apenas updatedAt
 */
export function updateTimestamp(): { updatedAt: Timestamp } {
  return {
    updatedAt: Timestamp.now()
  };
}

/**
 * Verificar se Firestore está disponível
 */
export function isFirestoreAvailable(): boolean {
  return FEATURES.FIRESTORE_ENABLED && !!db;
}

/**
 * Gerar ID único para documentos
 */
export function generateDocId(): string {
  if (!db) {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return doc(collection(requireFirestore(), 'temp')).id;
}

// ============================================
// USER PROFILE OPERATIONS
// ============================================

export class UserProfileRepository {
  private static collection = FIRESTORE_CONFIG.COLLECTIONS.USER_PROFILES;

  /**
   * Salvar perfil do usuário
   */
  static async saveProfile(profile: FirestoreUserProfile): Promise<FirebaseApiResponse<string>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const profileWithTimestamps = {
        ...profile,
        ...updateTimestamp(),
        version: '2.0'
      };

      const docRef = doc(requireFirestore(), this.collection, profile.uid);
      await updateDoc(docRef, profileWithTimestamps);

      return {
        success: true,
        data: profile.uid,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      // Se documento não existe, criar novo
      if (error.code === 'not-found') {
        return this.createProfile(profile);
      }

      console.error('Erro ao salvar perfil:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Criar novo perfil
   */
  static async createProfile(profile: FirestoreUserProfile): Promise<FirebaseApiResponse<string>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const profileWithTimestamps = {
        ...profile,
        ...createTimestamps(),
        version: '2.0'
      };

      const docRef = doc(requireFirestore(), this.collection, profile.uid);
      await updateDoc(docRef, profileWithTimestamps);

      return {
        success: true,
        data: profile.uid,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao criar perfil:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Obter perfil do usuário
   */
  static async getProfile(userId: string): Promise<FirebaseApiResponse<FirestoreUserProfile>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const docRef = doc(requireFirestore(), this.collection, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreUserProfile;
        return {
          success: true,
          data,
          timestamp: Timestamp.now()
        };
      } else {
        return {
          success: false,
          error: 'Perfil não encontrado',
          timestamp: Timestamp.now()
        };
      }
    } catch (error: any) {
      console.error('Erro ao obter perfil:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Atualizar campos específicos do perfil
   */
  static async updateProfileFields(userId: string, updates: Partial<FirestoreUserProfile>): Promise<FirebaseApiResponse<boolean>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const docRef = doc(requireFirestore(), this.collection, userId);
      const updateData = {
        ...updates,
        ...updateTimestamp()
      };

      await updateDoc(docRef, updateData);

      return {
        success: true,
        data: true,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Deletar perfil do usuário
   */
  static async deleteProfile(userId: string): Promise<FirebaseApiResponse<boolean>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const docRef = doc(requireFirestore(), this.collection, userId);
      await deleteDoc(docRef);

      return {
        success: true,
        data: true,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao deletar perfil:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }
}

// ============================================
// CONVERSATION OPERATIONS
// ============================================

export class ConversationRepository {
  private static collection = FIRESTORE_CONFIG.COLLECTIONS.CONVERSATIONS;

  /**
   * Salvar conversa
   */
  static async saveConversation(conversation: FirestoreConversation): Promise<FirebaseApiResponse<string>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const conversationWithTimestamps = {
        ...conversation,
        ...updateTimestamp(),
        messageCount: conversation.messages.length
      };

      if (conversation.id) {
        // Atualizar conversa existente
        const docRef = doc(requireFirestore(), this.collection, conversation.id);
        await updateDoc(docRef, conversationWithTimestamps);
        return {
          success: true,
          data: conversation.id,
          timestamp: Timestamp.now()
        };
      } else {
        // Criar nova conversa
        const docRef = await addDoc(collection(requireFirestore(), this.collection), {
          ...conversationWithTimestamps,
          ...createTimestamps()
        });
        return {
          success: true,
          data: docRef.id,
          timestamp: Timestamp.now()
        };
      }
    } catch (error: any) {
      console.error('Erro ao salvar conversa:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Obter conversas do usuário
   */
  static async getUserConversations(
    userId: string, 
    options: PaginationOptions = { limit: 20 }
  ): Promise<FirebaseApiResponse<FirestoreConversation[]>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      let q = query(
        collection(requireFirestore(), this.collection),
        where('userId', '==', userId),
        orderBy('lastActivity', 'desc'),
        limit(options.limit)
      );

      if (options.offset) {
        // Implementar paginação se necessário
      }

      const querySnapshot = await getDocs(q);
      const conversations: FirestoreConversation[] = [];

      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreConversation);
      });

      return {
        success: true,
        data: conversations,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao obter conversas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Obter conversa específica
   */
  static async getConversation(conversationId: string): Promise<FirebaseApiResponse<FirestoreConversation>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const docRef = doc(requireFirestore(), this.collection, conversationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data()
        } as FirestoreConversation;

        return {
          success: true,
          data,
          timestamp: Timestamp.now()
        };
      } else {
        return {
          success: false,
          error: 'Conversa não encontrada',
          timestamp: Timestamp.now()
        };
      }
    } catch (error: any) {
      console.error('Erro ao obter conversa:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Deletar conversa
   */
  static async deleteConversation(conversationId: string): Promise<FirebaseApiResponse<boolean>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const docRef = doc(requireFirestore(), this.collection, conversationId);
      await deleteDoc(docRef);

      return {
        success: true,
        data: true,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao deletar conversa:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Limpeza de conversas antigas (batch operation)
   */
  static async cleanupOldConversations(userId: string, maxConversations: number = 50): Promise<FirebaseApiResponse<number>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      // Obter todas as conversas do usuário
      const q = query(
        collection(requireFirestore(), this.collection),
        where('userId', '==', userId),
        orderBy('lastActivity', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs;

      if (conversations.length <= maxConversations) {
        return {
          success: true,
          data: 0,
          timestamp: Timestamp.now()
        };
      }

      // Deletar conversas excedentes
      const conversationsToDelete = conversations.slice(maxConversations);
      const batch = writeBatch(requireFirestore());

      conversationsToDelete.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return {
        success: true,
        data: conversationsToDelete.length,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro na limpeza de conversas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }
}

// ============================================
// FEEDBACK OPERATIONS
// ============================================

export class FeedbackRepository {
  private static collection = FIRESTORE_CONFIG.COLLECTIONS.FEEDBACK;

  /**
   * Salvar feedback
   */
  static async saveFeedback(feedback: Omit<FirestoreFeedback, 'id' | 'createdAt'>): Promise<FirebaseApiResponse<string>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const feedbackWithTimestamps = {
        ...feedback,
        ...createTimestamps(),
        status: 'pending' as const
      };

      const docRef = await addDoc(collection(requireFirestore(), this.collection), feedbackWithTimestamps);

      return {
        success: true,
        data: docRef.id,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao salvar feedback:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Obter feedback do usuário
   */
  static async getUserFeedback(userId: string): Promise<FirebaseApiResponse<FirestoreFeedback[]>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const q = query(
        collection(requireFirestore(), this.collection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(FIRESTORE_CONFIG.LIMITS.MAX_FEEDBACK_ENTRIES)
      );

      const querySnapshot = await getDocs(q);
      const feedbacks: FirestoreFeedback[] = [];

      querySnapshot.forEach((doc) => {
        feedbacks.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreFeedback);
      });

      return {
        success: true,
        data: feedbacks,
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro ao obter feedback:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

export class BatchOperations {
  /**
   * Migração em lote do localStorage para Firestore
   */
  static async batchMigrateFromLocalStorage(
    userId: string,
    localStorageData: any[]
  ): Promise<FirebaseApiResponse<BatchOperationResult>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const batch = writeBatch(requireFirestore());
      let successful = 0;
      let failed = 0;
      const errors: Array<{ itemId: string; error: string }> = [];

      for (const item of localStorageData) {
        try {
          // Processar cada item baseado no tipo
          if (item.type === 'conversation') {
            const docRef = doc(collection(requireFirestore(), FIRESTORE_CONFIG.COLLECTIONS.CONVERSATIONS));
            batch.set(docRef, {
              ...item.data,
              userId,
              ...createTimestamps(),
              syncStatus: 'synced'
            });
            successful++;
          } else if (item.type === 'profile') {
            const docRef = doc(requireFirestore(), FIRESTORE_CONFIG.COLLECTIONS.USER_PROFILES, userId);
            batch.set(docRef, {
              ...item.data,
              uid: userId,
              ...createTimestamps(),
              version: '2.0'
            });
            successful++;
          }
        } catch (error: any) {
          failed++;
          errors.push({
            itemId: item.id || 'unknown',
            error: error.message
          });
        }
      }

      await batch.commit();

      return {
        success: true,
        data: { successful, failed, errors },
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro na migração em lote:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }
}

// ============================================
// PERFORMANCE OPTIMIZATION FUNCTIONS
// ============================================

/**
 * Cache para reduzir consultas repetidas ao Firestore
 */
class FirestoreCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static getSize(): number {
    return this.cache.size;
  }

  static invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }
}

/**
 * Debounce para operações de escrita
 */
class WriteDebouncer {
  private static timers = new Map<string, NodeJS.Timeout>();

  static debounce(key: string, operation: () => Promise<void>, delay: number = 2000): void {
    // Cancelar operação anterior se existir
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Agendar nova operação
    const timer = setTimeout(async () => {
      try {
        await operation();
      } catch (error) {
        console.error(`Erro na operação debounced ${key}:`, error);
      } finally {
        this.timers.delete(key);
      }
    }, delay);

    this.timers.set(key, timer);
  }

  static cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  static cancelAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

/**
 * Otimizações para queries de paginação
 */
export class OptimizedQueries {
  /**
   * Query otimizada com cache para conversas do usuário
   */
  static async getUserConversationsOptimized(
    userId: string,
    options: PaginationOptions & { useCache?: boolean } = { limit: 20, useCache: true }
  ): Promise<FirebaseApiResponse<FirestoreConversation[]>> {
    const cacheKey = `conversations_${userId}_${options.limit}_${options.offset || 0}`;

    // Verificar cache primeiro
    if (options.useCache) {
      const cached = FirestoreCache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: Timestamp.now()
        };
      }
    }

    // Executar query normal
    const result = await ConversationRepository.getUserConversations(userId, options);

    // Cachear resultado se bem-sucedido
    if (result.success && options.useCache) {
      FirestoreCache.set(cacheKey, result.data, 3 * 60 * 1000); // 3 minutos
    }

    return result;
  }

  /**
   * Busca otimizada de perfil com cache
   */
  static async getProfileOptimized(userId: string, useCache: boolean = true): Promise<FirebaseApiResponse<FirestoreUserProfile>> {
    const cacheKey = `profile_${userId}`;

    if (useCache) {
      const cached = FirestoreCache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: Timestamp.now()
        };
      }
    }

    const result = await UserProfileRepository.getProfile(userId);

    if (result.success && useCache) {
      FirestoreCache.set(cacheKey, result.data, 10 * 60 * 1000); // 10 minutos
    }

    return result;
  }

  /**
   * Invalidar cache quando dados são atualizados
   */
  static invalidateUserCache(userId: string): void {
    FirestoreCache.invalidateByPattern(userId);
  }
}

/**
 * Otimizações para operações em lote
 */
export class BatchOptimizations {
  /**
   * Salvar múltiplas conversas de forma otimizada
   */
  static async batchSaveConversations(
    conversations: FirestoreConversation[]
  ): Promise<FirebaseApiResponse<BatchOperationResult>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const firestoreDb = requireFirestore();
      const batch = writeBatch(firestoreDb);
      let successful = 0;
      let failed = 0;
      const errors: Array<{ itemId: string; error: string }> = [];

      for (const conversation of conversations) {
        try {
          const conversationWithTimestamps = {
            ...conversation,
            ...updateTimestamp(),
            messageCount: conversation.messages.length
          };

          if (conversation.id) {
            const docRef = doc(firestoreDb, FIRESTORE_CONFIG.COLLECTIONS.CONVERSATIONS, conversation.id);
            batch.update(docRef, conversationWithTimestamps);
          } else {
            const docRef = doc(collection(firestoreDb, FIRESTORE_CONFIG.COLLECTIONS.CONVERSATIONS));
            batch.set(docRef, {
              ...conversationWithTimestamps,
              ...createTimestamps()
            });
          }
          successful++;
        } catch (error: any) {
          failed++;
          errors.push({
            itemId: conversation.id || 'unknown',
            error: error.message
          });
        }
      }

      await batch.commit();

      return {
        success: true,
        data: { successful, failed, errors },
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro no batch de conversas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }

  /**
   * Limpeza otimizada de dados antigos
   */
  static async optimizedCleanup(userId: string): Promise<FirebaseApiResponse<{ deletedItems: number; errors: number }>> {
    try {
      if (!isFirestoreAvailable()) {
        throw new Error('Firestore não disponível');
      }

      const firestoreDb = requireFirestore();
      const batch = writeBatch(firestoreDb);
      let deletedItems = 0;
      let errors = 0;

      // Limpeza de conversas antigas (mais de 90 dias)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const oldConversationsQuery = query(
        collection(firestoreDb, FIRESTORE_CONFIG.COLLECTIONS.CONVERSATIONS),
        where('userId', '==', userId),
        where('lastActivity', '<', Timestamp.fromDate(cutoffDate))
      );

      const oldConversations = await getDocs(oldConversationsQuery);
      
      oldConversations.forEach((doc) => {
        try {
          batch.delete(doc.ref);
          deletedItems++;
        } catch (error) {
          errors++;
        }
      });

      if (deletedItems > 0) {
        await batch.commit();
      }

      // Invalidar cache do usuário
      OptimizedQueries.invalidateUserCache(userId);

      return {
        success: true,
        data: { deletedItems, errors },
        timestamp: Timestamp.now()
      };
    } catch (error: any) {
      console.error('Erro na limpeza otimizada:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Timestamp.now()
      };
    }
  }
}

/**
 * Monitoramento de performance
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      this.recordMetric(operationName, performance.now() - startTime);
      return result;
    } catch (error) {
      this.recordMetric(operationName, performance.now() - startTime, true);
      throw error;
    }
  }

  private static recordMetric(name: string, duration: number, isError: boolean = false): void {
    const existing = this.metrics.get(name) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.metrics.set(name, existing);

    // Log se operação demorou muito
    if (duration > 1000) {
      console.warn(`⚠️ Operação lenta detectada: ${name} (${duration.toFixed(2)}ms)`);
    }

    if (isError) {
      console.error(`❌ Erro na operação: ${name} (${duration.toFixed(2)}ms)`);
    }
  }

  static getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.metrics);
  }

  static resetMetrics(): void {
    this.metrics.clear();
  }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export class RealtimeSubscriptions {
  /**
   * Subscrever mudanças no perfil do usuário
   */
  static subscribeToUserProfile(
    userId: string,
    callback: (profile: FirestoreUserProfile | null) => void
  ): () => void {
    if (!isFirestoreAvailable()) {
      console.warn('Firestore não disponível para subscriptions');
      return () => {};
    }

    const docRef = doc(requireFirestore(), FIRESTORE_CONFIG.COLLECTIONS.USER_PROFILES, userId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as FirestoreUserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Erro na subscription do perfil:', error);
      callback(null);
    });
  }

  /**
   * Subscrever conversas do usuário
   */
  static subscribeToUserConversations(
    userId: string,
    callback: (conversations: FirestoreConversation[]) => void
  ): () => void {
    if (!isFirestoreAvailable()) {
      console.warn('Firestore não disponível para subscriptions');
      return () => {};
    }

    const q = query(
      collection(requireFirestore(), FIRESTORE_CONFIG.COLLECTIONS.CONVERSATIONS),
      where('userId', '==', userId),
      orderBy('lastActivity', 'desc'),
      limit(FIRESTORE_CONFIG.LIMITS.MAX_CONVERSATIONS_PER_USER)
    );

    return onSnapshot(q, (querySnapshot) => {
      const conversations: FirestoreConversation[] = [];
      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreConversation);
      });
      callback(conversations);
    }, (error) => {
      console.error('Erro na subscription das conversas:', error);
      callback([]);
    });
  }
}