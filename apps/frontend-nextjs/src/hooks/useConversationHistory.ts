/**
 * Hook para gerenciar histórico de conversas por persona
 * Permite múltiplas conversas simultâneas e navegação entre elas
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '@/services/api';

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar conversas do localStorage no início
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConversations = JSON.parse(stored);
        // Validar estrutura dos dados
        if (Array.isArray(parsedConversations)) {
          const validConversations = parsedConversations
            .filter(conv => conv && typeof conv === 'object' && conv.id && conv.personaId)
            .slice(0, MAX_CONVERSATIONS); // Limitar número de conversas
          setConversations(validConversations);
        }
      }
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar histórico de conversas:', error);
      setError('Erro ao carregar histórico de conversas');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar conversas no localStorage com debounce
  const saveToStorage = useCallback((newConversations: Conversation[]) => {
    if (typeof window === 'undefined') return;
    
    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce para evitar muitas operações de escrita
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Limitar conversas e mensagens para evitar excesso de dados
        const limitedConversations = newConversations
          .slice(0, MAX_CONVERSATIONS)
          .map(conv => ({
            ...conv,
            messages: conv.messages.slice(-MAX_MESSAGES_PER_CONVERSATION)
          }));
          
        const dataString = JSON.stringify(limitedConversations);
        
        // Verificar tamanho dos dados (limite do localStorage: ~5MB)
        if (dataString.length > 4.5 * 1024 * 1024) {
          console.warn('Dados muito grandes para localStorage, limpando conversas antigas');
          const reducedConversations = limitedConversations.slice(0, Math.floor(MAX_CONVERSATIONS / 2));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedConversations));
        } else {
          localStorage.setItem(STORAGE_KEY, dataString);
        }
        
        setError(null);
      } catch (error) {
        console.error('Erro ao salvar histórico de conversas:', error);
        setError('Erro ao salvar histórico de conversas');
        
        // Tentar limpar espaço e salvar novamente
        try {
          const reducedConversations = newConversations.slice(0, 10);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedConversations));
        } catch (secondError) {
          console.error('Erro crítico ao salvar:', secondError);
        }
      }
    }, DEBOUNCE_DELAY);
  }, []);

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
      
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  const addMessageToConversation = useCallback((message: ChatMessage) => {
    if (!currentConversationId || !message) return;
    
    try {
      // Validar mensagem
      if (!message.content || !message.role || !message.timestamp) {
        throw new Error('Mensagem inválida');
      }

      const updatedConversations = conversations.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedConv = {
            ...conv,
            messages: [...conv.messages, message].slice(-MAX_MESSAGES_PER_CONVERSATION),
            lastActivity: Date.now()
          };
          
          // Atualizar título se for a primeira mensagem
          if (conv.messages.length === 0 && message.role === 'user') {
            updatedConv.title = generateConversationTitle(message.content);
          }
          
          return updatedConv;
        }
        return conv;
      });

      setConversations(updatedConversations);
      saveToStorage(updatedConversations);
      setError(null);
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      setError('Erro ao adicionar mensagem à conversa');
    }
  }, [currentConversationId, conversations, saveToStorage, generateConversationTitle]);

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
  const deleteConversation = useCallback((conversationId: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    setConversations(updatedConversations);
    saveToStorage(updatedConversations);
    
    // Se deletou a conversa atual, limpar
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  }, [conversations, currentConversationId, saveToStorage]);

  // Renomear conversa
  const renameConversation = useCallback((conversationId: string, newTitle: string) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, title: newTitle.trim() || 'Conversa sem título' }
        : conv
    );
    
    setConversations(updatedConversations);
    saveToStorage(updatedConversations);
  }, [conversations, saveToStorage]);

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

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    conversations,
    currentConversationId,
    loading,
    error,
    
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
    
    // Controle de erro
    clearError: () => setError(null)
  };
}