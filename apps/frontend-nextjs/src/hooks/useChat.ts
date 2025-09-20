/**
 * Hook para gerenciar chat com backend
 * Usa as personas do backend com prompts de IA
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { sendChatMessage, type ChatRequest, type ChatResponse } from '@/services/api';
import { type ChatMessage } from '@/types/api';
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
import { type PersonaConfig } from '@/types/personas';

// OTIMIZAÇÃO CRÍTICA: Hooks especializados para reduzir complexidade
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatState } from '@/hooks/useChatState';


interface UseChatOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
  enableSentimentAnalysis?: boolean;
  enableKnowledgeEnrichment?: boolean;
  enableIntelligentRouting?: boolean;
  availablePersonas?: Record<string, PersonaConfig>;
  onMessageReceived?: (message: ChatMessage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { handleError } = useErrorHandler();
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
        
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'chat_session_migration', {
            event_category: 'medical_chat',
            event_label: 'session_migrated',
            custom_parameters: {
              medical_context: 'chat_session_management',
              migration_type: 'temporary_to_authenticated'
            }
          });
        }
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
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'intelligent_routing_error', {
            event_category: 'medical_chat',
            event_label: 'routing_analysis_failed',
            custom_parameters: {
              medical_context: 'intelligent_routing',
              error_type: 'analysis_failure'
            }
          });
        }
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
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'sentiment_analysis_error', {
            event_category: 'medical_chat',
            event_label: 'sentiment_analysis_failed',
            custom_parameters: {
              medical_context: 'sentiment_analysis',
              error_type: 'analysis_failure'
            }
          });
        }
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
            sources: contextResult.chunks.map((chunk: { section: string }) => chunk.section)
          };
        }
      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'knowledge_context_error', {
            event_category: 'medical_chat',
            event_label: 'knowledge_search_failed',
            custom_parameters: {
              medical_context: 'knowledge_enrichment',
              error_type: 'context_search_failure'
            }
          });
        }
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
      
      // Usar PersonaRAGIntegration para processamento inteligente
      const personaResponse: PersonaResponse = await personaRAG.queryWithPersona(
        message.trim(),
        personaId as 'dr_gasnelio' | 'ga',
        sessionId,
        currentMessages.slice(-10) // Contexto das últimas 10 mensagens
      );

      // Criar mensagem do assistente baseada na resposta personalizada
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: personaResponse.response,
        timestamp: Date.now(),
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
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'chat_message_send_error', {
          event_category: 'medical_chat',
          event_label: 'message_send_failed',
          custom_parameters: {
            medical_context: 'chat_communication',
            retry_attempt: (retryCount + 1).toString(),
            error_type: 'send_failure'
          }
        });
      }
      handleError(err as Error, 'medium');
      
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
              role: 'assistant',
              content: fallbackResponse.response,
              timestamp: Date.now(),
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
          if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'chat_fallback_error', {
            event_category: 'medical_chat',
            event_label: 'fallback_mechanism_failed',
            custom_parameters: {
              medical_context: 'chat_fallback_system',
              error_type: 'complete_failure'
            }
          });
        }
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
  }, [personaRAG, sessionId, messagesRef, addMessage, onMessageReceived, setError, setLastApiCall, setLoading, withFallback, handleError, analyzeSentiment, enableSentimentAnalysis, enableIntelligentRouting, enableKnowledgeEnrichment, intelligentRouting, searchKnowledge]);

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
    configurePersona: (personaId: string, config: PersonaConfig) => {
      // Transform PersonaConfig responseStyle to PersonaRAG format
      const ragConfig = {
        ...config,
        responseStyle: {
          formality: config.tone === 'professional' ? 'formal' as const : 'casual' as const,
          technicality: config.tone === 'professional' ? 'high' as const : 'medium' as const,
          empathy: config.tone === 'empathetic' ? 'high' as const : 'medium' as const,
          examples: true,
          citations: config.tone === 'professional'
        }
      };
      return personaRAG.configurePersona(personaId, ragConfig);
    }
  };
}