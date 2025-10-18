/**
 * Conversation Cache Service - Local Storage + API Sync
 * Substitui Firebase com armazenamento local e sincronização via API
 */

import { apiClient } from '@/services/api';
import type { ChatMessage } from '@/types/api';
import type { ChatSession } from '@/types/api';
import { safeLocalStorage } from '@/hooks/useClientStorage';

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
      const cached = safeLocalStorage()?.getItem(this.cacheKey);
      if (!cached) return [];

      const cache: ConversationCache = JSON.parse(cached);
      return Object.values(cache.conversations || {});
    } catch (error) {
      // Medical system error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao carregar cache de conversas médicas:\n  Error: ${errorMessage}\n\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_conversation_cache_load_error', {
          event_category: 'medical_error_critical',
          event_label: 'conversation_cache_load_failed',
          custom_parameters: {
            medical_context: 'conversation_cache_service',
            error_type: 'cache_load_failure',
            error_message: errorMessage
          }
        });
      }
      return [];
    }
  }

  /**
   * Salvar conversa no cache local
   */
  async cacheConversation(conversation: CachedConversation): Promise<void> {
    try {
      const cached = safeLocalStorage()?.getItem(this.cacheKey);
      const cache: ConversationCache = cached ? JSON.parse(cached) : {
        conversations: {},
        lastSync: new Date().toISOString(),
        version: '2.0'
      };

      cache.conversations[conversation.id] = {
        ...conversation,
        updatedAt: new Date().toISOString()
      };

      safeLocalStorage()?.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (error) {
      // Medical system error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao salvar conversa no cache médico:\n  Error: ${errorMessage}\n\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_conversation_cache_save_error', {
          event_category: 'medical_error_critical',
          event_label: 'conversation_cache_save_failed',
          custom_parameters: {
            medical_context: 'conversation_cache_service',
            error_type: 'cache_save_failure',
            error_message: errorMessage
          }
        });
      }
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
      const backendSessions = await apiClient.get<any[]>('/api/sessions');

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
            duration: new Date(session.updatedAt).getTime() - new Date(session.createdAt).getTime()
          }
        };
      }

      // Atualizar cache local
      const cache: ConversationCache = {
        conversations: backendConversations,
        lastSync: new Date().toISOString(),
        version: '2.0'
      };

      safeLocalStorage()?.setItem(this.cacheKey, JSON.stringify(cache));
      return true;

    } catch (error) {
      // Medical system error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha na sincronização com backend médico:\n  Error: ${errorMessage}\n\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_conversation_sync_error', {
          event_category: 'medical_error_critical',
          event_label: 'conversation_backend_sync_failed',
          custom_parameters: {
            medical_context: 'conversation_cache_sync',
            error_type: 'backend_sync_failure',
            error_message: errorMessage
          }
        });
      }
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
      const success = await apiClient.post<{success: boolean}>(`/api/sessions/${id}/archive`, {});

      if (success.success) {
        // Atualizar cache local
        const conversation = await this.getConversationById(id);
        if (conversation) {
          conversation.archived = true;
          await this.cacheConversation(conversation);
        }
      }

      return success.success;
    } catch (error) {
      // Medical system error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao arquivar conversa médica:\n  Error: ${errorMessage}\n\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_conversation_archive_error', {
          event_category: 'medical_error_critical',
          event_label: 'conversation_archive_failed',
          custom_parameters: {
            medical_context: 'conversation_archive_service',
            error_type: 'conversation_archive_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  /**
   * Limpar cache local
   */
  clearCache(): void {
    safeLocalStorage()?.removeItem(this.cacheKey);
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
    const cached = safeLocalStorage()?.getItem(this.cacheKey);

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