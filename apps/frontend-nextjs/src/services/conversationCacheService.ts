/**
 * Conversation Cache Service
 * Integra conversações com cache híbrido (Firestore + Local)
 * Otimiza performance e experiência offline
 */

import { HybridCacheUtils } from './hybridCache';
import { firestoreCache } from './firestoreCache';
import { ConversationRepository } from '@/lib/firebase/firestore';
import { FirestoreConversation, FirestoreMessage } from '@/lib/firebase/types';

export interface CachedConversation {
  id: string;
  title: string;
  userId: string;
  persona: string;
  messages: CachedMessage[];
  lastActivity: number;
  messageCount: number;
  isArchived?: boolean;
  tags?: string[];
  summary?: string;
}

export interface CachedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  persona?: string;
  confidence?: number;
  metadata?: {
    source?: 'cache' | 'api' | 'fallback';
    cached?: boolean;
    processingTime?: number;
  };
}

export class ConversationCacheService {
  private static readonly CACHE_PREFIX = 'conv';
  private static readonly USER_CONVERSATIONS_PREFIX = 'user_convs';
  private static readonly DEFAULT_TTL = 2 * 60 * 60 * 1000; // 2 horas
  private static readonly USER_LIST_TTL = 30 * 60 * 1000; // 30 minutos

  /**
   * Busca conversas do usuário (cache-first strategy)
   */
  static async getUserConversations(
    userId: string,
    forceRefresh: boolean = false
  ): Promise<CachedConversation[]> {
    const cacheKey = `${this.USER_CONVERSATIONS_PREFIX}:${userId}`;
    
    try {
      // 1. Tentar cache primeiro (se não for force refresh)
      if (!forceRefresh) {
        const cached = await HybridCacheUtils.Specialized.getUserConversations(userId);
        if (cached && Array.isArray(cached)) {
          console.log(`🎯 User conversations cache hit: ${userId}`);
          return this.normalizeConversations(cached);
        }
      }

      // 2. Buscar do Firestore
      const result = await ConversationRepository.getUserConversations(userId, { limit: 50 });
      
      if (result.success && result.data) {
        const conversations = this.convertFromFirestore(result.data);
        
        // 3. Cachear resultado
        await HybridCacheUtils.Specialized.cacheUserConversations(
          userId, 
          conversations, 
          this.USER_LIST_TTL
        );
        
        console.log(`💾 User conversations cached: ${userId} (${conversations.length} items)`);
        return conversations;
      }

      return [];
      
    } catch (error) {
      console.error('Error getting user conversations:', error);
      
      // Fallback para cache mesmo em caso de erro
      const fallbackCached = await HybridCacheUtils.Specialized.getUserConversations(userId);
      if (fallbackCached) {
        return this.normalizeConversations(fallbackCached);
      }
      
      return [];
    }
  }

  /**
   * Busca conversa específica (cache-first strategy)
   */
  static async getConversation(
    conversationId: string,
    forceRefresh: boolean = false
  ): Promise<CachedConversation | null> {
    try {
      // 1. Tentar cache primeiro
      if (!forceRefresh) {
        const cached = await HybridCacheUtils.Specialized.getConversation(conversationId);
        if (cached) {
          console.log(`🎯 Conversation cache hit: ${conversationId}`);
          return this.normalizeConversation(cached);
        }
      }

      // 2. Buscar do Firestore (implementar método específico se necessário)
      // Por enquanto, retornar null para implementação futura
      console.warn('Firestore individual conversation fetch not implemented yet');
      return null;
      
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Salva conversa (cache + Firestore)
   */
  static async saveConversation(conversation: CachedConversation): Promise<boolean> {
    try {
      // 1. Salvar no cache híbrido imediatamente
      const cacheKey = `conversation:${conversation.id}`;
      const cacheSuccess = await firestoreCache.set(
        cacheKey,
        conversation,
        { ttl: this.DEFAULT_TTL }
      );

      // 2. Converter para formato Firestore e salvar
      const firestoreConversation = this.convertToFirestore(conversation);
      const firestoreResult = await ConversationRepository.saveConversation(firestoreConversation);

      if (firestoreResult.success) {
        console.log(`💾 Conversation saved: ${conversation.id}`);
        
        // 3. Atualizar cache da lista de conversas do usuário
        await this.invalidateUserConversationsCache(conversation.userId);
        
        return true;
      } else {
        console.warn('Firestore save failed, but cached locally:', firestoreResult.error);
        return cacheSuccess;
      }
      
    } catch (error) {
      console.error('Error saving conversation:', error);
      return false;
    }
  }

  /**
   * Adiciona mensagem à conversa
   */
  static async addMessage(
    conversationId: string,
    message: CachedMessage,
    userId?: string
  ): Promise<boolean> {
    try {
      // 1. Buscar conversa atual do cache
      let conversation = await this.getConversation(conversationId);
      
      if (!conversation) {
        // Se não encontrou, criar nova conversa
        conversation = {
          id: conversationId,
          title: this.generateConversationTitle(message.content),
          userId: userId || 'anonymous',
          persona: message.persona || 'default',
          messages: [],
          lastActivity: Date.now(),
          messageCount: 0
        };
      }

      // 2. Adicionar mensagem
      conversation.messages.push(message);
      conversation.messageCount = conversation.messages.length;
      conversation.lastActivity = Date.now();
      
      // 3. Atualizar título se necessário
      if (conversation.messages.length <= 2) {
        conversation.title = this.generateConversationTitle(
          conversation.messages.find(m => m.role === 'user')?.content || message.content
        );
      }

      // 4. Salvar conversa atualizada
      return await this.saveConversation(conversation);
      
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      return false;
    }
  }

  /**
   * Remove conversa (cache + Firestore)
   */
  static async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      // 1. Remover do cache híbrido
      const cacheKey = HybridCacheUtils.Keys.conversation(conversationId);
      await HybridCacheUtils.Specialized.clearNamespace(cacheKey);

      // 2. Remover do Firestore (implementar método específico se necessário)
      // Por enquanto, apenas marcar como arquivada
      const conversation = await this.getConversation(conversationId);
      if (conversation) {
        conversation.isArchived = true;
        await this.saveConversation(conversation);
      }

      // 3. Invalidar cache da lista do usuário
      await this.invalidateUserConversationsCache(userId);

      console.log(`🗑️ Conversation deleted: ${conversationId}`);
      return true;
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Busca conversas por persona
   */
  static async getConversationsByPersona(
    userId: string, 
    persona: string
  ): Promise<CachedConversation[]> {
    try {
      const allConversations = await this.getUserConversations(userId);
      return allConversations.filter(conv => conv.persona === persona && !conv.isArchived);
    } catch (error) {
      console.error('Error getting conversations by persona:', error);
      return [];
    }
  }

  /**
   * Estatísticas de conversação
   */
  static async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    personaBreakdown: Record<string, number>;
    averageMessagesPerConversation: number;
  }> {
    try {
      const conversations = await this.getUserConversations(userId);
      const activeConversations = conversations.filter(c => !c.isArchived);
      
      const personaBreakdown: Record<string, number> = {};
      let totalMessages = 0;

      activeConversations.forEach(conv => {
        totalMessages += conv.messageCount;
        personaBreakdown[conv.persona] = (personaBreakdown[conv.persona] || 0) + 1;
      });

      return {
        totalConversations: activeConversations.length,
        totalMessages,
        personaBreakdown,
        averageMessagesPerConversation: activeConversations.length > 0 
          ? Math.round(totalMessages / activeConversations.length) 
          : 0
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        personaBreakdown: {},
        averageMessagesPerConversation: 0
      };
    }
  }

  /**
   * Força sincronização de todas as conversas do usuário
   */
  static async syncUserConversations(userId: string): Promise<{ synced: number; failed: number }> {
    try {
      console.log(`🔄 Syncing conversations for user: ${userId}`);
      
      // 1. Forçar refresh das conversas
      const conversations = await this.getUserConversations(userId, true);
      
      // 2. Tentar sincronizar cada conversa individualmente
      let synced = 0;
      let failed = 0;
      
      const promises = conversations.map(async (conv) => {
        try {
          await this.saveConversation(conv);
          synced++;
        } catch (error) {
          console.error(`Failed to sync conversation ${conv.id}:`, error);
          failed++;
        }
      });
      
      await Promise.all(promises);
      
      console.log(`✅ Sync completed: ${synced} synced, ${failed} failed`);
      return { synced, failed };
      
    } catch (error) {
      console.error('Error syncing user conversations:', error);
      return { synced: 0, failed: 0 };
    }
  }

  // MÉTODOS PRIVADOS

  private static async invalidateUserConversationsCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${this.USER_CONVERSATIONS_PREFIX}:${userId}`;
      // Para agora, apenas logs - implementar invalidação específica futuramente
      console.log(`🔄 Invalidating user conversations cache: ${userId}`);
    } catch (error) {
      console.warn('Error invalidating user conversations cache:', error);
    }
  }

  private static convertToFirestore(conversation: CachedConversation): FirestoreConversation {
    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      personaId: conversation.persona,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp as any, // Firebase Timestamp conversion handled by SDK
        persona: msg.persona,
        metadata: msg.metadata
      } as FirestoreMessage)),
      lastActivity: conversation.lastActivity as any, // Firebase Timestamp conversion handled by SDK
      messageCount: conversation.messageCount,
      isArchived: conversation.isArchived || false,
      tags: conversation.tags || [],
      summary: conversation.summary,
      createdAt: conversation.lastActivity as any,
      syncStatus: 'synced' as any
    };
  }

  private static convertFromFirestore(conversations: FirestoreConversation[]): CachedConversation[] {
    return conversations.map(conv => ({
      id: conv.id || '',
      title: conv.title,
      userId: conv.userId,
      persona: conv.personaId || 'dr_gasnelio',
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
        persona: msg.persona,
        confidence: msg.metadata?.confidence,
        metadata: msg.metadata
      } as CachedMessage)),
      lastActivity: typeof conv.lastActivity === 'number' ? conv.lastActivity : Date.now(),
      messageCount: conv.messageCount || conv.messages.length,
      isArchived: conv.isArchived || false,
      tags: conv.tags || [],
      summary: conv.summary
    }));
  }

  private static normalizeConversations(conversations: any[]): CachedConversation[] {
    return conversations.map(conv => this.normalizeConversation(conv)).filter(Boolean);
  }

  private static normalizeConversation(conversation: any): CachedConversation {
    return {
      id: conversation.id || '',
      title: conversation.title || 'Conversa sem título',
      userId: conversation.userId || '',
      persona: conversation.persona || 'default',
      messages: Array.isArray(conversation.messages) ? conversation.messages : [],
      lastActivity: conversation.lastActivity || Date.now(),
      messageCount: conversation.messageCount || conversation.messages?.length || 0,
      isArchived: conversation.isArchived || false,
      tags: conversation.tags || [],
      summary: conversation.summary
    };
  }

  private static generateConversationTitle(content: string): string {
    if (!content) return 'Nova conversa';
    
    // Extrair primeiras palavras significativas
    const words = content.trim().split(/\s+/);
    const significantWords = words.filter(word => 
      word.length > 2 && 
      !['que', 'como', 'por', 'para', 'com', 'uma', 'um', 'de', 'da', 'do', 'na', 'no'].includes(word.toLowerCase())
    );
    
    const title = significantWords.slice(0, 4).join(' ');
    return title.length > 3 ? title : `Conversa ${Date.now()}`;
  }
}

export default ConversationCacheService;