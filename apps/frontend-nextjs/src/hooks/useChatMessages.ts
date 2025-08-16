/**
 * Hook especializado para gerenciamento de mensagens do chat
 * Otimizado para performance com memoização e cache
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { ChatMessage } from '@/services/api';

interface UseChatMessagesOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
  maxMessages?: number;
}

export function useChatMessages(options: UseChatMessagesOptions = {}) {
  const { 
    persistToLocalStorage = true, 
    storageKey = 'chat-history',
    maxMessages = 100
  } = options;

  // Carregar histórico do localStorage (memoizado)
  const loadFromStorage = useCallback((): ChatMessage[] => {
    if (!persistToLocalStorage || typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico do chat:', error);
      return [];
    }
  }, [persistToLocalStorage, storageKey]);

  const [messages, setMessages] = useState<ChatMessage[]>(loadFromStorage);
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Salvar no localStorage de forma otimizada
  const saveToStorage = useCallback((newMessages: ChatMessage[]) => {
    if (!persistToLocalStorage || typeof window === 'undefined') return;
    
    try {
      // Manter apenas as últimas N mensagens para evitar estouro de localStorage
      const messagesToSave = newMessages.slice(-maxMessages);
      localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Erro ao salvar histórico do chat:', error);
    }
  }, [persistToLocalStorage, storageKey, maxMessages]);

  // Atualizar mensagens com otimização de re-render
  const updateMessages = useCallback((newMessages: ChatMessage[]) => {
    messagesRef.current = newMessages;
    setMessages(newMessages);
    saveToStorage(newMessages);
  }, [saveToStorage]);

  // Adicionar mensagem otimizada
  const addMessage = useCallback((message: ChatMessage) => {
    const newMessages = [...messagesRef.current, message];
    updateMessages(newMessages);
  }, [updateMessages]);

  // Adicionar múltiplas mensagens (batch)
  const addMessages = useCallback((newMessages: ChatMessage[]) => {
    const allMessages = [...messagesRef.current, ...newMessages];
    updateMessages(allMessages);
  }, [updateMessages]);

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    updateMessages([]);
  }, [updateMessages]);

  // Remover mensagem por ID
  const removeMessage = useCallback((messageId: string) => {
    const filteredMessages = messagesRef.current.filter(msg => msg.id !== messageId);
    updateMessages(filteredMessages);
  }, [updateMessages]);

  // Atualizar mensagem específica
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    const updatedMessages = messagesRef.current.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    updateMessages(updatedMessages);
  }, [updateMessages]);

  // Estatísticas memoizadas
  const stats = useMemo(() => ({
    totalMessages: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    assistantMessages: messages.filter(m => m.role === 'assistant').length,
    lastMessage: messages[messages.length - 1],
    isNewConversation: messages.length === 0
  }), [messages]);

  return {
    messages,
    messagesRef,
    addMessage,
    addMessages,
    clearMessages,
    removeMessage,
    updateMessage,
    stats
  };
}