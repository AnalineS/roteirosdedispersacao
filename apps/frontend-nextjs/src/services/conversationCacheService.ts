/**
 * Conversation Cache Service - Local Storage + API Sync
 * Substitui Firebase com armazenamento local e sincronização via API
 */

import { apiClient } from '@/services/api';
import type { ChatMessage, ChatSession } from '@/services/api';

interface CachedConversation {
  id: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  metadata?: {
    persona?: string;
    totalMessages: number;
    duration?: number;
  };
}

interface ConversationCache {
  conversations: { [key: string]: CachedConversation };
  lastSync: string;
  version: string;
}

class ConversationCacheService {
  private cacheKey = 'conversation-cache-v2';
  private syncInProgress = false;

  /**
   * Obter todas as conversas do cache local
   */
  async getCachedConversations(): Promise<CachedConversation[]> {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return [];

      const cache: ConversationCache = JSON.parse(cached);
      return Object.values(cache.conversations || {});
    } catch (error) {
      console.error('Erro ao carregar conversas do cache:', error);
      return [];
    }
  }

  /**
   * Salvar conversa no cache local
   */
  async cacheConversation(conversation: CachedConversation): Promise<void> {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const cache: ConversationCache = cached ? JSON.parse(cached) : {
        conversations: {},
        lastSync: new Date().toISOString(),
        version: '2.0'
      };

      cache.conversations[conversation.id] = {
        ...conversation,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Erro ao salvar conversa no cache:', error);
      throw error;
    }
  }

  /**
   * Sincronizar com API backend
   */
  async syncWithBackend(): Promise<boolean> {
    if (this.syncInProgress) return false;

    try {
      this.syncInProgress = true;

      // Obter conversas do backend
      const backendSessions = await apiClient.getSessions();

      // Converter para formato de cache
      const backendConversations: { [key: string]: CachedConversation } = {};

      for (const session of backendSessions) {
        // Para manter compatibilidade, usar sessão como mensagens temporariamente
        const messages: ChatMessage[] = session.messages || [];
        backendConversations[session.id] = {
          id: session.id,
          sessionId: session.id,
          messages: messages,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          archived: session.archived || false,
          metadata: {
            persona: session.persona,
            totalMessages: messages.length,
            duration: session.duration
          }
        };
      }

      // Atualizar cache local
      const cache: ConversationCache = {
        conversations: backendConversations,
        lastSync: new Date().toISOString(),
        version: '2.0'
      };

      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
      return true;

    } catch (error) {
      console.error('Erro na sincronização com backend:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Buscar conversa por ID
   */
  async getConversationById(id: string): Promise<CachedConversation | null> {
    const conversations = await this.getCachedConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  /**
   * Buscar conversas por persona
   */
  async getConversationsByPersona(persona: string): Promise<CachedConversation[]> {
    const conversations = await this.getCachedConversations();
    return conversations.filter(conv => conv.metadata?.persona === persona);
  }

  /**
   * Arquivar conversa
   */
  async archiveConversation(id: string): Promise<boolean> {
    try {
      // Arquivar no backend
      const success = await apiClient.archiveSession(id);

      if (success) {
        // Atualizar cache local
        const conversation = await this.getConversationById(id);
        if (conversation) {
          conversation.archived = true;
          await this.cacheConversation(conversation);
        }
      }

      return success;
    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      return false;
    }
  }

  /**
   * Limpar cache local
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
  }

  /**
   * Obter estatísticas do cache
   */
  async getCacheStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastSync: string;
    cacheSize: number;
  }> {
    const conversations = await this.getCachedConversations();
    const cached = localStorage.getItem(this.cacheKey);

    return {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((total, conv) => total + conv.messages.length, 0),
      lastSync: cached ? JSON.parse(cached).lastSync : 'Never',
      cacheSize: cached ? new Blob([cached]).size : 0
    };
  }
}

export const conversationCache = new ConversationCacheService();
export default conversationCache;