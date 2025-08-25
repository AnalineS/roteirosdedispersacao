/**
 * Hook para gerenciar chat com backend
 * Usa as personas do backend com prompts de IA
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { sendChatMessage, type ChatMessage, type ChatRequest, type ChatResponse } from '@/services/api';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { shouldSuggestPersonaSwitch, adjustResponseTone, SentimentResult } from '@/services/sentimentAnalysis';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useFallback } from '@/hooks/useFallback';
import { FallbackResult } from '@/services/fallbackSystem';
import { useAuth } from '@/hooks/useAuth';
import { generateTempUserId } from '@/utils/cryptoUtils';

// OTIMIZAÇÃO CRÍTICA: Hooks especializados para reduzir complexidade
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatState } from '@/hooks/useChatState';

interface UseChatOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
  enableSentimentAnalysis?: boolean;
  enableKnowledgeEnrichment?: boolean;
  onMessageReceived?: (message: ChatMessage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { 
    persistToLocalStorage = true, 
    storageKey = 'chat-history',
    enableSentimentAnalysis = true,
    enableKnowledgeEnrichment = true,
    onMessageReceived
  } = options;

  // Auth state para sessionId
  const { user, isAuthenticated } = useAuth();

  // SessionID híbrido: transição suave entre anônimo e logado
  const sessionId = useMemo(() => {
    if (isAuthenticated && user?.uid) {
      // Usuário logado: usar UID
      return user.uid;
    }
    
    // Usuário anônimo: gerar sessionId temporário persistente com randomness segura
    let tempSessionId = localStorage.getItem('temp_session_id');
    if (!tempSessionId) {
      // Usar randomness criptograficamente segura em vez de Math.random()
      tempSessionId = generateTempUserId();
      localStorage.setItem('temp_session_id', tempSessionId);
    }
    return tempSessionId;
  }, [isAuthenticated, user?.uid]);

  // Gerenciar transição de sessionId quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      const tempSessionId = localStorage.getItem('temp_session_id');
      if (tempSessionId && tempSessionId !== user.uid) {
        // Usuário acabou de fazer login - migrar dados da sessão temporária
        const migrationData = {
          oldSessionId: tempSessionId,
          newSessionId: user.uid,
          timestamp: Date.now()
        };
        
        // Armazenar informação de migração para potencial sincronização
        localStorage.setItem('session_migration', JSON.stringify(migrationData));
        
        // Remover sessionId temporário
        localStorage.removeItem('temp_session_id');
        
        console.log('🔄 Migração de sessão:', tempSessionId, '→', user.uid);
      }
    }
  }, [isAuthenticated, user?.uid]);

  // Persona atual baseada no último uso ou preferência
  const currentPersona = useMemo(() => {
    const saved = localStorage.getItem('current_persona');
    return saved || 'dr_gasnelio';
  }, []);

  // OTIMIZAÇÃO CRÍTICA: Usar hooks especializados para reduzir complexidade
  const {
    messages,
    messagesRef,
    addMessage,
    addMessages,
    clearMessages,
    removeMessage,
    updateMessage,
    stats: messageStats
  } = useChatMessages({
    persistToLocalStorage,
    storageKey,
    maxMessages: 200 // Limite para performance
  });

  const {
    loading,
    error,
    personaSwitchSuggestion,
    isOnline,
    retryCount,
    canRetry,
    shouldShowError,
    setLoading,
    setError,
    setPersonaSuggestion,
    setOnlineStatus,
    incrementRetry,
    resetRetry,
    setLastApiCall
  } = useChatState();
  
  // OTIMIZAÇÃO: Removido - messagesRef é gerenciado automaticamente pelo useChatMessages
  
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

  // OTIMIZAÇÃO: Removido - localStorage é gerenciado automaticamente pelo useChatMessages

  // Verificar sugestão de troca de persona baseada no sentimento (otimizado)
  useEffect(() => {
    if (!enableSentimentAnalysis || !currentSentiment || !lastPersonaRef.current) return;
    
    const shouldSwitch = shouldSuggestPersonaSwitch(
      currentSentiment, 
      lastPersonaRef.current as 'dr-gasnelio' | 'ga'
    );
    
    if (shouldSwitch) {
      const suggestedPersona = lastPersonaRef.current === 'dr-gasnelio' ? 'ga' : 'dr-gasnelio';
      setPersonaSuggestion(suggestedPersona);
    } else {
      setPersonaSuggestion(null);
    }
  }, [currentSentiment, enableSentimentAnalysis, setPersonaSuggestion]);
  
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

    // OTIMIZAÇÃO: Usar hook especializado para adicionar mensagem
    if (retryCount === 0) {
      addMessage(userMessage);
    }

    setLoading(true);
    setError(null);
    setLastApiCall(Date.now());

    try {
      const currentMessages = retryCount === 0 ? [...messagesRef.current, userMessage] : messagesRef.current;
      
      const request: ChatRequest = {
        question: message.trim(),
        personality_id: personaId,
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

        addMessage(assistantMessage);
        
        // Chamar callback se fornecido
        if (onMessageReceived) {
          onMessageReceived(assistantMessage);
        }
        
        setLoading(false);
        return;
      }

      // Resposta normal do backend
      const response = result as ChatResponse;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: response.timestamp ? new Date(response.timestamp).getTime() : Date.now(),
        persona: response.persona
      };

      addMessage(assistantMessage);
      
      // Chamar callback se fornecido
      if (onMessageReceived) {
        onMessageReceived(assistantMessage);
      }
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
  }, [analyzeSentiment, enableSentimentAnalysis, addMessage, onMessageReceived, enableKnowledgeEnrichment, messagesRef, searchKnowledge, setError, setLastApiCall, setLoading, withFallback]);

  const handleClearMessages = useCallback(() => {
    clearMessages();
    // Limpar histórico de sentimento também
    if (enableSentimentAnalysis) {
      clearSentimentHistory();
    }
  }, [clearMessages, enableSentimentAnalysis, clearSentimentHistory]);

  const getMessagesForPersona = useCallback((personaId: string) => {
    return messagesRef.current.filter(msg => msg.persona === personaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para obter informações da sessão
  const getSessionInfo = useCallback(() => {
    return {
      sessionId,
      isAuthenticated,
      userUid: user?.uid || null,
      sessionType: isAuthenticated ? 'authenticated' : 'anonymous',
      migrationData: (() => {
        try {
          const migration = localStorage.getItem('session_migration');
          return migration ? JSON.parse(migration) : null;
        } catch {
          return null;
        }
      })()
    };
  }, [sessionId, isAuthenticated, user?.uid]);

  // Função para limpar dados de migração
  const clearMigrationData = useCallback(() => {
    localStorage.removeItem('session_migration');
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages: handleClearMessages,
    getMessagesForPersona,
    // Sessão e persona
    sessionId,
    currentPersona,
    getSessionInfo,
    clearMigrationData,
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