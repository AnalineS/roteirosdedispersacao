/**
 * Hook para gerenciar histórico de conversas por persona
 * Permite múltiplas conversas simultâneas e navegação entre elas
 * Suporta sincronização automática com Firestore quando autenticado
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationRepository } from '@/lib/firebase/firestore';
import { FirestoreConversation, FirestoreMessage } from '@/lib/firebase/types';
import { FEATURES } from '@/lib/firebase/config';
import { generateSecureId } from '@/utils/cryptoUtils';
import { redisCache } from '@/services/redisCache';

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
  const useFirestore = auth.isAuthenticated && FEATURES.FIRESTORE_ENABLED;
  const useLocalStorage = !useFirestore || FEATURES.AUTH_ENABLED;

  // Carregar conversas (localStorage ou Firestore)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        if (useFirestore && auth.user) {
          // Carregar do Firestore
          await loadFromFirestore();
        } else if (useLocalStorage) {
          // Carregar do localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setError('Erro ao carregar histórico de conversas');
        
        // Fallback para localStorage em caso de erro do Firestore
        if (useFirestore) {
          loadFromLocalStorage();
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.isAuthenticated, useFirestore, useLocalStorage]);

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const loadFromLocalStorage = useCallback(async () => {
    try {
      // Tentar Redis primeiro (com fallback seguro)
      try {
        const userId = auth.user?.uid || 'anonymous';
        const redisCached = await redisCache.get<Conversation[]>(`conversations:${userId}`, { 
          namespace: 'conversations' 
        });
        
        if (redisCached && Array.isArray(redisCached)) {
          console.log('🎯 Loaded conversations from Redis cache');
          setConversations(redisCached.slice(0, MAX_CONVERSATIONS));
          return;
        }
      } catch (redisError) {
        console.warn('Redis load error (falling back to localStorage):', redisError);
      }
      
      // Fallback para localStorage
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
            try {
              const userId = auth.user?.uid || 'anonymous';
              redisCache.set(`conversations:${userId}`, validConversations, {
                ttl: 1800, // 30 minutos
                namespace: 'conversations'
              }).catch(err => console.warn('Redis cache save failed:', err));
            } catch (err) {
              console.warn('Redis operation error:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      throw error;
    }
  }, []);

  const loadFromFirestore = useCallback(async () => {
    if (!auth.user) return;

    try {
      setSyncStatus('syncing');
      const result = await ConversationRepository.getUserConversations(auth.user.uid, {
        limit: MAX_CONVERSATIONS
      });

      if (result.success && result.data) {
        // Converter FirestoreConversation para Conversation local
        const localConversations: Conversation[] = result.data.map(firestoreConv => ({
          id: firestoreConv.id,
          personaId: firestoreConv.personaId,
          title: firestoreConv.title,
          messages: firestoreConv.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp.toDate().getTime(),
            persona: msg.persona
          })),
          lastActivity: firestoreConv.lastActivity.toDate().getTime(),
          createdAt: firestoreConv.createdAt.toDate().getTime()
        }));

        setConversations(localConversations);
        setSyncStatus('idle');

        // Também salvar no localStorage como backup
        if (useLocalStorage) {
          saveToLocalStorageOnly(localConversations);
        }
      } else {
        throw new Error(result.error || 'Erro ao carregar do Firestore');
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Erro ao carregar do Firestore:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Salvar no Redis também (com tratamento de erro)
      try {
        const userId = auth.user?.uid || 'anonymous';
        redisCache.set(`conversations:${userId}`, limitedConversations, {
          ttl: 1800, // 30 minutos
          namespace: 'conversations'
        }).catch(err => console.warn('Redis update failed:', err));
      } catch (err) {
        console.warn('Redis operation error:', err);
      }
      
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

  const saveToFirestore = useCallback(async (conversation: Conversation) => {
    if (!auth.user || !useFirestore) return;

    try {
      setSyncStatus('syncing');
      
      // Converter Conversation local para FirestoreConversation
      const firestoreConv: Partial<FirestoreConversation> = {
        id: conversation.id,
        userId: auth.user.uid,
        personaId: conversation.personaId,
        title: conversation.title,
        messages: conversation.messages.map((msg, index) => ({
          id: generateSecureId(`msg_${index}_`, 12),
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp) as any, // Will be converted to Timestamp
          persona: msg.persona
        })),
        lastActivity: new Date(conversation.lastActivity) as any,
        createdAt: new Date(conversation.createdAt) as any,
        messageCount: conversation.messages.length,
        isArchived: false,
        syncStatus: 'synced'
      };

      const result = await ConversationRepository.saveConversation(firestoreConv as FirestoreConversation);
      
      if (result.success) {
        setSyncStatus('idle');
      } else {
        setSyncStatus('error');
        console.error('Erro ao salvar no Firestore:', result.error);
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Erro ao salvar no Firestore:', error);
    }
  }, [auth.user, useFirestore]);

  // Salvar conversas (Redis + localStorage + Firestore se disponível)
  const saveToStorage = useCallback((newConversations: Conversation[]) => {
    if (typeof window === 'undefined') return;
    
    // Salvar no Redis imediatamente (com tratamento de erro robusto)
    try {
      const userId = auth.user?.uid || 'anonymous';
      redisCache.set(`conversations:${userId}`, newConversations, {
        ttl: 1800,
        namespace: 'conversations'
      }).then(() => {
        console.log('💾 Conversations cached in Redis');
      }).catch(err => console.warn('Redis cache error (non-blocking):', err));
    } catch (err) {
      console.warn('Redis operation setup error:', err);
    }
    
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

    // Salvar no Firestore (sem debounce para melhor experiência)
    if (useFirestore) {
      // Debounce para Firestore também, mas menor delay
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        saveToFirestore(conversation);
      }, 1000); // 1 segundo de debounce para Firestore
    }
  }, [useLocalStorage, useFirestore, saveToLocalStorageOnly, saveToFirestore]);

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
      // Deletar do Firestore se disponível
      if (useFirestore) {
        setSyncStatus('syncing');
        const result = await ConversationRepository.deleteConversation(conversationId);
        if (!result.success) {
          console.error('Erro ao deletar do Firestore:', result.error);
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
  }, [conversations, currentConversationId, saveToStorage, useFirestore, useLocalStorage]);

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
    isUsingFirestore: useFirestore,
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
      if (useFirestore && auth.user) {
        loadFromFirestore();
      }
    },
    
    // Controle de erro
    clearError: () => setError(null)
  };
}