/**
 * Hook para gerenciar chat com backend
 * Usa as personas do backend com prompts de IA
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { sendChatMessage, type ChatMessage, type ChatRequest, type ChatResponse } from '@/services/api';
import { PersonaRAGIntegration, type PersonaResponse } from '@/services/personaRAGIntegration';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { shouldSuggestPersonaSwitch, adjustResponseTone, SentimentResult } from '@/services/sentimentAnalysis';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useFallback } from '@/hooks/useFallback';
import { FallbackResult } from '@/services/fallbackSystem';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { generateTempUserId } from '@/utils/cryptoUtils';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';

// OTIMIZAÇÃO CRÍTICA: Hooks especializados para reduzir complexidade
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatState } from '@/hooks/useChatState';

interface UseChatOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
  enableSentimentAnalysis?: boolean;
  enableKnowledgeEnrichment?: boolean;
  enableIntelligentRouting?: boolean;
  availablePersonas?: Record<string, any>;
  onMessageReceived?: (message: ChatMessage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { captureError } = useErrorHandler();
  const { 
    persistToLocalStorage = true, 
    storageKey = 'chat-history',
    enableSentimentAnalysis = true,
    enableKnowledgeEnrichment = true,
    enableIntelligentRouting = true,
    availablePersonas = {},
    onMessageReceived
  } = options;

  // Instância do PersonaRAGIntegration
  const personaRAG = useMemo(() => PersonaRAGIntegration.getInstance(), []);

  // Auth state para sessionId
  const { user, isAuthenticated } = useSafeAuth();

  // SessionID híbrido: transição suave entre anônimo e logado
  const sessionId = useMemo(() => {
    if (isAuthenticated && user?.uid) {
      // Usuário logado: usar UID
      return user.uid;
    }
    
    // Usuário anônimo: gerar sessionId temporário persistente com randomness segura
    let tempSessionId = safeLocalStorage()?.getItem('temp_session_id');
    if (!tempSessionId) {
      // Usar randomness criptograficamente segura em vez de Math.random()
      tempSessionId = generateTempUserId();
      safeLocalStorage()?.setItem('temp_session_id', tempSessionId);
    }
    return tempSessionId;
  }, [isAuthenticated, user?.uid]);

  // Gerenciar transição de sessionId quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      const tempSessionId = safeLocalStorage()?.getItem('temp_session_id');
      if (tempSessionId && tempSessionId !== user.uid) {
        // Usuário acabou de fazer login - migrar dados da sessão temporária
        const migrationData = {
          oldSessionId: tempSessionId,
          newSessionId: user.uid,
          timestamp: Date.now()
        };
        
        // Armazenar informação de migração para potencial sincronização
        safeLocalStorage()?.setItem('session_migration', JSON.stringify(migrationData));
        
        // Remover sessionId temporário
        safeLocalStorage()?.removeItem('temp_session_id');
        
        console.log('🔄 Migração de sessão:', tempSessionId, '→', user.uid);
      }
    }
  }, [isAuthenticated, user?.uid]);

  // Persona atual baseada no último uso ou preferência
  const currentPersona = useMemo(() => {
    const saved = safeLocalStorage()?.getItem('current_persona');
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
  
  // Sistema de Roteamento Inteligente
  const intelligentRouting = useIntelligentRouting(availablePersonas, {
    enabled: enableIntelligentRouting,
    minConfidenceThreshold: 0.7,
    debounceMs: 1000
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

    // Análise de Roteamento Inteligente (primeira mensagem ou nova pergunta)
    if (enableIntelligentRouting && retryCount === 0) {
      try {
        await intelligentRouting.analyzeQuestion(message);
      } catch (error) {
        console.warn('Erro na análise de roteamento:', error);
        // Continua normalmente mesmo se a análise falhar
      }
    }

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
            sources: contextResult.chunks.map((chunk: any) => chunk.section)
          };
        }
      } catch (error) {
        console.error('Erro ao buscar contexto:', error);
      }
    }
    
    lastPersonaRef.current = personaId;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
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
      
      // Usar PersonaRAGIntegration para processamento inteligente
      const personaResponse: PersonaResponse = await personaRAG.queryWithPersona(
        message.trim(),
        personaId as 'dr_gasnelio' | 'ga',
        sessionId,
        currentMessages.slice(-10) // Contexto das últimas 10 mensagens
      );

      // Criar mensagem do assistente baseada na resposta personalizada
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: personaResponse.response,
        timestamp: new Date().toISOString(),
        persona: personaId,
        metadata: {
          confidence: personaResponse.confidence
        }
      };

      addMessage(assistantMessage);
      
      // Chamar callback se fornecido
      if (onMessageReceived) {
        onMessageReceived(assistantMessage);
      }
      
      setLoading(false);

    } catch (err) {
      console.error(`Erro ao enviar mensagem (tentativa ${retryCount + 1}):`, err);
      captureError(err as string | Error, { severity: 'medium' });
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        setTimeout(() => {
          sendMessage(message, personaId, retryCount + 1);
        }, retryDelay);
        
        setError(`Tentando novamente... (${retryCount + 1}/${maxRetries})`);
      } else {
        // Final failure - usar fallback se disponível
        try {
          const fallbackResult = await withFallback(
            () => Promise.reject(err),
            message.trim(),
            sentiment || undefined
          );
          
          if (fallbackResult && typeof fallbackResult === 'object' && 'source' in fallbackResult) {
            const fallbackResponse = fallbackResult as FallbackResult;
            
            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: fallbackResponse.response,
              timestamp: new Date().toISOString(),
              persona: personaId,
              metadata: {
                isFallback: true,
                fallbackSource: fallbackResponse.source,
                confidence: fallbackResponse.confidence,
                suggestion: fallbackResponse.suggestion,
                emergency_contact: fallbackResponse.emergency_contact
              }
            };

            addMessage(assistantMessage);
            
            if (onMessageReceived) {
              onMessageReceived(assistantMessage);
            }
            
            setLoading(false);
            return;
          }
        } catch (fallbackErr) {
          console.error('Fallback também falhou:', fallbackErr);
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(`${errorMessage} (Falha após ${maxRetries} tentativas)`);
        setLoading(false);
      }
    }
    
    // Only set loading to false if we're not retrying
    if (retryCount >= maxRetries) {
      setLoading(false);
    }
  }, [personaRAG, sessionId, messagesRef, addMessage, onMessageReceived, setError, setLastApiCall, setLoading, withFallback, captureError, analyzeSentiment, enableSentimentAnalysis]);

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
          const migration = safeLocalStorage()?.getItem('session_migration');
          return migration ? JSON.parse(migration) : null;
        } catch {
          return null;
        }
      })()
    };
  }, [sessionId, isAuthenticated, user?.uid]);

  // Função para limpar dados de migração
  const clearMigrationData = useCallback(() => {
    safeLocalStorage()?.removeItem('session_migration');
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
    // Base de conhecimento (mantido para compatibilidade)
    knowledgeStats,
    lastSearchResult,
    isSearchingKnowledge: isSearching,
    // Sistema de fallback
    fallbackState,
    // Roteamento Inteligente (mantido para compatibilidade)
    intelligentRouting,
    resetFallback,
    getSystemStats,
    resetSystemFailures,
    // PersonaRAG Integration - Novos recursos
    personaRAGStats: () => personaRAG.getPersonaStats(),
    getPersonaRecommendation: (query: string) => personaRAG.recommendPersona(query),
    configurePersona: (personaId: string, config: any) => personaRAG.configurePersona(personaId, config)
  };
}