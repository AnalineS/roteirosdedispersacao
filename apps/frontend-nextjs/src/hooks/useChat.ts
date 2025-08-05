/**
 * Hook para gerenciar chat com backend
 * Usa as personas do backend com prompts de IA
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { sendChatMessage, type ChatMessage, type ChatRequest, type ChatResponse } from '@/services/api';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { shouldSuggestPersonaSwitch, adjustResponseTone, SentimentResult } from '@/services/sentimentAnalysis';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useFallback } from '@/hooks/useFallback';
import { FallbackResult } from '@/services/fallbackSystem';

interface UseChatOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
  enableSentimentAnalysis?: boolean;
  enableKnowledgeEnrichment?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { 
    persistToLocalStorage = true, 
    storageKey = 'chat-history',
    enableSentimentAnalysis = true,
    enableKnowledgeEnrichment = true
  } = options;

  // Carregar histórico do localStorage se disponível (memoizado)
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personaSwitchSuggestion, setPersonaSwitchSuggestion] = useState<string | null>(null);
  
  // Análise de sentimento
  const { 
    currentSentiment, 
    analyzeSentiment, 
    sentimentHistory, 
    clearHistory: clearSentimentHistory 
  } = useSentimentAnalysis({
    debounceMs: 300,
    autoAnalyze: enableSentimentAnalysis
  });
  
  // Base de conhecimento integrada
  const { 
    searchKnowledge, 
    enrichMessage, 
    isSearching,
    lastSearchResult,
    stats: knowledgeStats
  } = useKnowledgeBase({
    prefetchCommon: true,
    autoEnrich: enableKnowledgeEnrichment
  });
  
  // Sistema de fallback
  const {
    withFallback,
    shouldUseFallback,
    state: fallbackState,
    reset: resetFallback,
    getSystemStats,
    resetSystemFailures
  } = useFallback({
    maxRetries: 2,
    retryDelay: 1000,
    autoReset: true
  });
  
  const lastPersonaRef = useRef<string>('');

  // Salvar no localStorage
  const saveToStorage = useCallback((newMessages: ChatMessage[]) => {
    if (!persistToLocalStorage || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Erro ao salvar histórico do chat:', error);
    }
  }, [persistToLocalStorage, storageKey]);

  // Verificar sugestão de troca de persona baseada no sentimento
  useEffect(() => {
    if (!enableSentimentAnalysis || !currentSentiment || !lastPersonaRef.current) return;
    
    const shouldSwitch = shouldSuggestPersonaSwitch(
      currentSentiment, 
      lastPersonaRef.current as 'dr-gasnelio' | 'ga'
    );
    
    if (shouldSwitch) {
      const suggestedPersona = lastPersonaRef.current === 'dr-gasnelio' ? 'ga' : 'dr-gasnelio';
      setPersonaSwitchSuggestion(suggestedPersona);
    } else {
      setPersonaSwitchSuggestion(null);
    }
  }, [currentSentiment, enableSentimentAnalysis]);
  
  const sendMessage = useCallback(async (message: string, personaId: string, retryCount = 0) => {
    if (!message.trim()) return;

    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    
    // Analisar sentimento antes de enviar
    let sentiment: SentimentResult | null = null;
    if (enableSentimentAnalysis && retryCount === 0) {
      try {
        sentiment = await analyzeSentiment(message);
      } catch (error) {
        console.error('Erro na análise de sentimento:', error);
      }
    }
    
    // Buscar contexto da base de conhecimento
    let knowledgeContext = null;
    if (enableKnowledgeEnrichment && retryCount === 0) {
      try {
        const contextResult = await searchKnowledge(message, sentiment || undefined, personaId);
        
        // Se encontrou contexto relevante, incluir na requisição
        if (contextResult.confidence > 0.3 && contextResult.combined_context) {
          knowledgeContext = {
            context: contextResult.combined_context,
            confidence: contextResult.confidence,
            sources: contextResult.chunks.map(chunk => chunk.section)
          };
        }
      } catch (error) {
        console.error('Erro ao buscar contexto:', error);
      }
    }
    
    lastPersonaRef.current = personaId;

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
        conversation_history: currentMessages.slice(-10), // Últimas 10 mensagens para contexto
        // Incluir informações de sentimento se disponível
        ...(sentiment && {
          sentiment: {
            category: sentiment.category,
            score: sentiment.score,
            magnitude: sentiment.magnitude
          }
        }),
        // Incluir contexto da base de conhecimento se disponível
        ...(knowledgeContext && {
          knowledge_context: knowledgeContext
        })
      };

      // Usar fallback se necessário
      const result = await withFallback(
        () => sendChatMessage(request),
        message.trim(),
        sentiment || undefined
      );

      // Verificar se é resposta de fallback
      if (result && typeof result === 'object' && 'source' in result) {
        const fallbackResult = result as FallbackResult;
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fallbackResult.response,
          timestamp: Date.now(),
          persona: personaId,
          metadata: {
            isFallback: true,
            fallbackSource: fallbackResult.source,
            confidence: fallbackResult.confidence,
            suggestion: fallbackResult.suggestion,
            emergency_contact: fallbackResult.emergency_contact
          }
        };

        const finalMessages = [...currentMessages, assistantMessage];
        setMessages(finalMessages);
        saveToStorage(finalMessages);
        
        setLoading(false);
        return;
      }

      // Resposta normal do backend
      const response = result as ChatResponse;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        persona: response.persona
      };

      const finalMessages = [...currentMessages, assistantMessage];
      setMessages(finalMessages);
      saveToStorage(finalMessages);
      setLoading(false);

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
  }, [messages, saveToStorage, analyzeSentiment, enableSentimentAnalysis]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    // Limpar histórico de sentimento também
    if (enableSentimentAnalysis) {
      clearSentimentHistory();
    }
  }, [persistToLocalStorage, storageKey, enableSentimentAnalysis, clearSentimentHistory]);

  const getMessagesForPersona = useCallback((personaId: string) => {
    return messages.filter(msg => msg.persona === personaId);
  }, [messages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    getMessagesForPersona,
    // Análise de sentimento
    currentSentiment,
    sentimentHistory,
    personaSwitchSuggestion,
    // Base de conhecimento
    knowledgeStats,
    lastSearchResult,
    isSearchingKnowledge: isSearching,
    // Sistema de fallback
    fallbackState,
    resetFallback,
    getSystemStats,
    resetSystemFailures
  };
}