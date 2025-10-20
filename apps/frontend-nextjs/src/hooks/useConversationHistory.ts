/**
 * Hook para gerenciar histórico de conversas por persona
 * Permite múltiplas conversas simultâneas e navegação entre elas
 * Suporta sincronização com API backend e fallback para localStorage
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { ChatMessage, BackendConversation, BackendMessage } from '@/types/api';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
// Firebase features replaced with backend API
const FEATURES = {
  BACKEND_API_ENABLED: true, // Backend API enabled
  AUTH_ENABLED: true,        // Backend authentication enabled
  REALTIME_ENABLED: false    // No real-time features for now
};

// ConversationRepository is now handled by the backend API endpoints
// All conversation operations go through /api/conversations
import { generateSecureId } from '@/utils/cryptoUtils';

// Constantes
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 100;
const STORAGE_KEY = 'conversation-history';
const DEBOUNCE_DELAY = 300;

interface Conversation {
  id: string;
  personaId: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: number;
  createdAt: number;
}

interface ConversationSummary {
  id: string;
  personaId: string;
  title: string;
  lastMessage: string;
  lastActivity: number;
  messageCount: number;
}

export function useConversationHistory() {
  const auth = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Flags para controlar o tipo de persistência
  const useBackendAPI = auth.isAuthenticated && FEATURES.BACKEND_API_ENABLED;
  const useLocalStorage = !useBackendAPI || FEATURES.AUTH_ENABLED;

  // Carregar conversas (localStorage ou Backend API)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        if (useBackendAPI && auth.user) {
          // Carregar do Backend API
          await loadFromBackendAPI();
        } else if (useLocalStorage) {
          // Carregar do localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setError('Erro ao carregar histórico de conversas');
        
        // Fallback para localStorage em caso de erro do Backend API
        if (useBackendAPI) {
          loadFromLocalStorage();
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.isAuthenticated, useBackendAPI, useLocalStorage]);

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const loadFromLocalStorage = useCallback(async () => {
    try {
      // TODO: Implementar cache de conversas com Backend API Cache Service futuramente
      
      // Carregar do localStorage
      const stored = safeLocalStorage()?.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConversations = JSON.parse(stored);
        if (Array.isArray(parsedConversations)) {
          const validConversations = parsedConversations
            .filter(conv => conv && typeof conv === 'object' && conv.id && conv.personaId)
            .slice(0, MAX_CONVERSATIONS);
          setConversations(validConversations);
          
          // Salvar no Redis para próxima vez (com tratamento de erro)
          if (validConversations.length > 0) {
            // TODO: Integrar com backendCache para cache de conversas
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      throw error;
    }
  }, []);

  const loadFromBackendAPI = useCallback(async () => {
    if (!auth.user) return;

    try {
      setSyncStatus('syncing');

      // Use the modern API to load conversations from backend
      const response = await fetch('/api/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.uid}` // or token-based auth
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.conversations) {
        // Modern conversations already match the Conversation interface
        const conversations: Conversation[] = data.conversations.map((conv: any) => ({
          id: conv.id,
          userId: conv.userId || auth.user?.uid || '',
          personaId: conv.personaId,
          title: conv.title,
          messages: conv.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: msg.timestamp,
            persona: msg.persona,
            metadata: msg.metadata
          })),
          lastActivity: conv.lastActivity,
          createdAt: conv.createdAt,
          messageCount: conv.messages.length,
          isArchived: conv.isArchived || false,
          tags: conv.tags || []
        }));

        setConversations(conversations);
        setSyncStatus('idle');

        // Save to localStorage as backup
        if (useLocalStorage) {
          saveToLocalStorageOnly(conversations);
        }
      } else {
        throw new Error(data.error || 'Failed to load conversations from backend');
      }
    } catch (error) {
      console.error('Error loading conversations from backend:', error);
      setSyncStatus('error');

      // Fallback to localStorage if backend fails
      if (useLocalStorage) {
        try {
          loadFromLocalStorage();
        } catch (storageError) {
          console.error('Fallback to localStorage also failed:', storageError);
        }
      }
    }
  }, [auth.user, useLocalStorage]);

  // ============================================
  // FUNÇÕES DE SALVAMENTO
  // ============================================

  const saveToLocalStorageOnly = useCallback(async (newConversations: Conversation[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      const limitedConversations = newConversations
        .slice(0, MAX_CONVERSATIONS)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-MAX_MESSAGES_PER_CONVERSATION)
        }));
        
      const dataString = JSON.stringify(limitedConversations);
      
      // TODO: Integrar com backendCache
      
      if (dataString.length > 4.5 * 1024 * 1024) {
        const reducedConversations = limitedConversations.slice(0, Math.floor(MAX_CONVERSATIONS / 2));
        safeLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(reducedConversations));
      } else {
        safeLocalStorage()?.setItem(STORAGE_KEY, dataString);
      }
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [auth.user?.uid]);

  const saveToBackendAPI = useCallback(async (conversation: Conversation) => {
    if (!auth.user || !useBackendAPI) return;

    try {
      setSyncStatus('syncing');
      
      // Converter Conversation local para BackendAPIConversation
      const backendConv = {
        id: conversation.id,
        userId: auth.user.uid,
        personaId: conversation.personaId,
        title: conversation.title,
        messages: conversation.messages.map((msg, index) => ({
          id: msg.id || generateSecureId(`msg_${index}_`, 12),
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          persona: msg.persona
        })),
        lastActivity: conversation.lastActivity,
        createdAt: conversation.createdAt,
        messageCount: conversation.messages.length,
        isArchived: false,
        syncStatus: 'synced'
      };

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.uid}`
        },
        body: JSON.stringify(backendConv)
      });

      const result = await response.json();
      
      if (response.ok) {
        setSyncStatus('idle');
      } else {
        setSyncStatus('error');
        console.error('Erro ao salvar no Backend API:', result.error);
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Erro ao salvar no Backend API:', error);
    }
  }, [auth.user, useBackendAPI]);

  // Salvar conversas (Redis + localStorage + Backend API se disponível)
  const saveToStorage = useCallback((newConversations: Conversation[]) => {
    if (typeof window === 'undefined') return;
    
    // Salvar no Redis imediatamente (com tratamento de erro robusto)
    // TODO: Integrar com backendCache para conversas
    
    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce para evitar muitas operações de escrita
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Salvar no localStorage se habilitado
        if (useLocalStorage) {
          saveToLocalStorageOnly(newConversations);
        }
        setError(null);
      } catch (error) {
        console.error('Erro ao salvar histórico de conversas:', error);
        setError('Erro ao salvar histórico de conversas');
      }
    }, DEBOUNCE_DELAY);
  }, [useLocalStorage, saveToLocalStorageOnly]);

  // Salvar conversa específica com sincronização
  const saveConversationWithSync = useCallback(async (conversation: Conversation) => {
    // Atualizar estado local imediatamente
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === conversation.id ? conversation : conv
      );
      
      // Se não encontrou, adicionar nova conversa
      if (!updated.find(conv => conv.id === conversation.id)) {
        updated.unshift(conversation);
      }
      
      return updated.slice(0, MAX_CONVERSATIONS);
    });

    // Salvar no localStorage
    if (useLocalStorage) {
      // Debounce para localStorage
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        setConversations(current => {
          saveToLocalStorageOnly(current);
          return current;
        });
      }, DEBOUNCE_DELAY);
    }

    // Salvar no Backend API (sem debounce para melhor experiência)
    if (useBackendAPI) {
      // Debounce para Backend API também, mas menor delay
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        saveToBackendAPI(conversation);
      }, 1000); // 1 segundo de debounce para Backend API
    }
  }, [useLocalStorage, useBackendAPI, saveToLocalStorageOnly, saveToBackendAPI]);

  // Gerar título automático para conversa baseado na primeira mensagem
  const generateConversationTitle = useCallback((firstMessage: string): string => {
    try {
      if (!firstMessage || typeof firstMessage !== 'string') {
        return 'Nova conversa';
      }
      
      const cleanMessage = firstMessage.replace(/[^\w\sÀ-ſ]/gi, '').trim();
      const words = cleanMessage.split(' ').filter(word => word.length > 0).slice(0, 6);
      let title = words.join(' ');
      
      if (title.length > 40) {
        title = title.substring(0, 37) + '...';
      }
      
      if (title.length < 3) {
        title = 'Nova conversa';
      }
      
      return title;
    } catch (error) {
      console.error('Erro ao gerar título da conversa:', error);
      return 'Nova conversa';
    }
  }, []);

  // Criar nova conversa
  const createConversation = useCallback((personaId: string, firstMessage?: string): string => {
    try {
      if (!personaId || typeof personaId !== 'string') {
        throw new Error('personaId é obrigatório');
      }
      
      const conversationId = generateSecureId('conv_', 16);
      const now = Date.now();
      
      const newConversation: Conversation = {
        id: conversationId,
        personaId,
        title: firstMessage ? generateConversationTitle(firstMessage) : 'Nova conversa',
        messages: [],
        lastActivity: now,
        createdAt: now
      };

      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      saveToStorage(updatedConversations);
      setCurrentConversationId(conversationId);
      setError(null);
      
      return conversationId;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      setError('Erro ao criar nova conversa');
      return '';
    }
  }, [conversations, saveToStorage, generateConversationTitle]);

  // Obter conversa atual
  const getCurrentConversation = useCallback((): Conversation | null => {
    if (!currentConversationId) return null;
    return conversations.find(conv => conv.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  // Adicionar mensagem à conversa atual
  const addMessageToConversation = useCallback(async (message: ChatMessage) => {
    if (!currentConversationId || !message) return;
    
    try {
      // Validar mensagem
      if (!message.content || !message.role || !message.timestamp) {
        throw new Error('Mensagem inválida');
      }

      // Encontrar a conversa atual
      const currentConv = conversations.find(conv => conv.id === currentConversationId);
      if (!currentConv) {
        throw new Error('Conversa atual não encontrada');
      }

      // Criar conversa atualizada
      const updatedConv: Conversation = {
        ...currentConv,
        messages: [...currentConv.messages, message].slice(-MAX_MESSAGES_PER_CONVERSATION),
        lastActivity: Date.now()
      };
      
      // Atualizar título se for a primeira mensagem
      if (currentConv.messages.length === 0 && message.role === 'user') {
        updatedConv.title = generateConversationTitle(message.content);
      }

      // Salvar com sincronização
      await saveConversationWithSync(updatedConv);
      setError(null);
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      setError('Erro ao adicionar mensagem à conversa');
    }
  }, [currentConversationId, conversations, saveConversationWithSync, generateConversationTitle]);

  // Obter mensagens da conversa atual
  const getCurrentMessages = useCallback((): ChatMessage[] => {
    const currentConv = getCurrentConversation();
    return currentConv?.messages || [];
  }, [getCurrentConversation]);

  // Obter conversas de uma persona específica
  const getConversationsForPersona = useCallback((personaId: string): ConversationSummary[] => {
    return conversations
      .filter(conv => conv.personaId === personaId)
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .map(conv => ({
        id: conv.id,
        personaId: conv.personaId,
        title: conv.title,
        lastMessage: conv.messages.length > 0 
          ? conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...'
          : 'Conversa vazia',
        lastActivity: conv.lastActivity,
        messageCount: conv.messages.length
      }));
  }, [conversations]);

  // Mudar para uma conversa específica
  const switchToConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  // Excluir conversa
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      // Deletar do Backend API se disponível
      if (useBackendAPI) {
        setSyncStatus('syncing');
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.user?.uid}`
          }
        });

        if (!response.ok) {
          const result = await response.json();
          console.error('Erro ao deletar do Backend API:', result.error);
        }
        setSyncStatus('idle');
      }

      // Atualizar estado local
      const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
      setConversations(updatedConversations);
      
      // Salvar no localStorage
      if (useLocalStorage) {
        saveToStorage(updatedConversations);
      }
      
      // Se deletou a conversa atual, limpar
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
      
      setError(null);
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      setError('Erro ao deletar conversa');
    }
  }, [conversations, currentConversationId, saveToStorage, useBackendAPI, useLocalStorage]);

  // Renomear conversa
  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation) {
        throw new Error('Conversa não encontrada');
      }

      const updatedConv: Conversation = {
        ...conversation,
        title: newTitle.trim() || 'Conversa sem título',
        lastActivity: Date.now()
      };

      // Salvar com sincronização
      await saveConversationWithSync(updatedConv);
      setError(null);
    } catch (error) {
      console.error('Erro ao renomear conversa:', error);
      setError('Erro ao renomear conversa');
    }
  }, [conversations, saveConversationWithSync]);

  // Limpar todas as conversas
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
    if (typeof window !== 'undefined') {
      safeLocalStorage()?.removeItem('conversation-history');
    }
  }, []);

  // Obter estatísticas
  const getStatistics = useCallback(() => {
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const personaStats = conversations.reduce((stats, conv) => {
      stats[conv.personaId] = (stats[conv.personaId] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      totalConversations,
      totalMessages,
      personaStats
    };
  }, [conversations]);

  // Cleanup dos timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    conversations,
    currentConversationId,
    loading,
    error,
    syncStatus,
    
    // Flags de funcionalidade
    isUsingBackendAPI: useBackendAPI,
    isUsingLocalStorage: useLocalStorage,
    
    // Conversa atual
    getCurrentConversation,
    getCurrentMessages,
    
    // Gerenciamento de conversas
    createConversation,
    switchToConversation,
    deleteConversation,
    renameConversation,
    clearAllConversations,
    
    // Mensagens
    addMessageToConversation,
    
    // Consultas
    getConversationsForPersona,
    getStatistics,
    
    // Sincronização manual
    forceSync: () => {
      if (useBackendAPI && auth.user) {
        loadFromBackendAPI();
      }
    },
    
    // Controle de erro
    clearError: () => setError(null)
  };
}