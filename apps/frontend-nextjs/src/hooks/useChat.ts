/**
 * Hook para gerenciar chat com backend
 * Usa as personas do backend com prompts de IA
 */

import { useState, useCallback } from 'react';
import { sendChatMessage, type ChatMessage, type ChatRequest, type ChatResponse } from '@/services/api';

interface UseChatOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const { persistToLocalStorage = true, storageKey = 'chat-history' } = options;

  // Carregar histórico do localStorage se disponível
  const loadFromStorage = (): ChatMessage[] => {
    if (!persistToLocalStorage || typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico do chat:', error);
      return [];
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>(loadFromStorage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Salvar no localStorage
  const saveToStorage = useCallback((newMessages: ChatMessage[]) => {
    if (!persistToLocalStorage || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Erro ao salvar histórico do chat:', error);
    }
  }, [persistToLocalStorage, storageKey]);

  const sendMessage = useCallback(async (message: string, personaId: string, retryCount = 0) => {
    if (!message.trim()) return;

    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
      persona: personaId
    };

    // Adicionar mensagem do usuário apenas na primeira tentativa
    if (retryCount === 0) {
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      saveToStorage(newMessages);
    }

    setLoading(true);
    setError(null);

    try {
      const currentMessages = retryCount === 0 ? [...messages, userMessage] : messages;
      
      const request: ChatRequest = {
        message: message.trim(),
        persona: personaId,
        conversation_history: currentMessages.slice(-10) // Últimas 10 mensagens para contexto
      };

      const response: ChatResponse = await sendChatMessage(request);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        persona: response.persona
      };

      const finalMessages = [...currentMessages, assistantMessage];
      setMessages(finalMessages);
      saveToStorage(finalMessages);

    } catch (err) {
      console.error(`Erro ao enviar mensagem (tentativa ${retryCount + 1}):`, err);
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        setTimeout(() => {
          sendMessage(message, personaId, retryCount + 1);
        }, retryDelay);
        
        setError(`Tentando novamente... (${retryCount + 1}/${maxRetries})`);
      } else {
        // Final failure
        const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(`${errorMessage} (Falha após ${maxRetries} tentativas)`);
        setLoading(false);
      }
    }
    
    // Only set loading to false if we're not retrying
    if (retryCount >= maxRetries) {
      setLoading(false);
    }
  }, [messages, saveToStorage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [persistToLocalStorage, storageKey]);

  const getMessagesForPersona = useCallback((personaId: string) => {
    return messages.filter(msg => msg.persona === personaId);
  }, [messages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    getMessagesForPersona
  };
}