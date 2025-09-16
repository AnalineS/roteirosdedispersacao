/**
 * Hook para gerenciar histórico de conversas por persona
 * Permite múltiplas conversas simultâneas e navegação entre elas
 * Suporta persistência local com localStorage
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '@/services/api';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
import { generateSecureId } from '@/utils/cryptoUtils';

// Features configuration
const FEATURES = {
  FIRESTORE_ENABLED: false, // Disabled - using local storage only
  AUTH_ENABLED: true,
};

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
  const useFirestore = false; // Disabled
  const useLocalStorage = true; // Always use localStorage

  // Carregar conversas (localStorage apenas)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar do localStorage
        loadFromLocalStorage();
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setError('Erro ao carregar histórico de conversas');
        
        // Sempre usar localStorage
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.isAuthenticated, useLocalStorage]);

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const loadFromLocalStorage = useCallback(async () => {
    try {
      // TODO: Implementar cache de conversas com cache service futuramente
      
      // Carregar do localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConversations = JSON.parse(stored);
        if (Array.isArray(parsedConversations)) {
          const validConversations = parsedConversations
            .filter(conv => conv && typeof conv === 'object' && conv.id && conv.personaId)
            .slice(0, MAX_CONVERSATIONS);
          setConversations(validConversations);
          
          // Salvar no Redis para próxima vez (com tratamento de erro)
          if (validConversations.length > 0) {
            // TODO: Integrar com firestoreCache para cache de conversas
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      throw error;
    }
  }, []);

  // Firestore loading disabled - using localStorage only

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
      
      // TODO: Integrar com firestoreCache
      
      if (dataString.length > 4.5 * 1024 * 1024) {
        const reducedConversations = limitedConversations.slice(0, Math.floor(MAX_CONVERSATIONS / 2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedConversations));
      } else {
        localStorage.setItem(STORAGE_KEY, dataString);
      }
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [auth.user?.uid]);

  // Firestore saving disabled - localStorage only

  // Salvar conversas (localStorage apenas)
  const saveToStorage = useCallback((newConversations: Conversation[]) => {
    if (typeof window === 'undefined') return;
    
    // Salvar no Redis imediatamente (com tratamento de erro robusto)
    // TODO: Integrar com firestoreCache para conversas
    
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

    // Firestore saving disabled
  }, [useLocalStorage, saveToLocalStorageOnly]);

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
      // Firestore deletion disabled

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
  }, [conversations, currentConversationId, saveToStorage, useLocalStorage]);

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
      localStorage.removeItem('conversation-history');
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
    isUsingFirestore: false,
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
      // Firestore sync disabled
    },
    
    // Controle de erro
    clearError: () => setError(null)
  };
}