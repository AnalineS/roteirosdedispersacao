/**
 * Hook para gerenciar chat com backend
 * Usa as personas do backend com prompts de IA
 */

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { logger } from '@/utils/logger';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { sendChatMessage, type ChatMessage, type ChatRequest, type ChatResponse, type Persona, type ChatAttachmentPayload } from '@/services/api';
import { PersonaRAGIntegration, type PersonaResponse, type PersonaConfig as RAGPersonaConfig } from '@/services/personaRAGIntegration';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { shouldSuggestPersonaSwitch, adjustResponseTone, SentimentResult } from '@/services/sentimentAnalysis';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useFallback } from '@/hooks/useFallback';
import { FallbackResult } from '@/services/fallbackSystem';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { generateTempUserId } from '@/utils/cryptoUtils';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { classifyError, type ClassifiedError } from '@/utils/errorClassification';

// OTIMIZAÇÃO CRÍTICA: Hooks especializados para reduzir complexidade
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatState } from '@/hooks/useChatState';

interface UseChatOptions {
  persistToLocalStorage?: boolean;
  storageKey?: string;
  enableSentimentAnalysis?: boolean;
  enableKnowledgeEnrichment?: boolean;
  enableIntelligentRouting?: boolean;
  availablePersonas?: Record<string, Persona>;
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

  // Issue #330: Classified error state for better error messages
  const [classifiedError, setClassifiedError] = useState<ClassifiedError | null>(null);
  const [currentRetryCount, setCurrentRetryCount] = useState(0);
  const [isManualRetrying, setIsManualRetrying] = useState(false);

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
        
        logger.log('🔄 Migração de sessão:', tempSessionId, '→', user.uid);
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
    prefetchCommon: false,
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
  
  const sendMessage = useCallback(async (
    message: string,
    personaId: string,
    retryCount = 0,
    skipUserMessageAdd = false,
    attachment?: ChatAttachmentPayload | null
  ) => {
    if (!message.trim()) return;

    // Análise de Roteamento Inteligente (primeira mensagem ou nova pergunta)
    if (enableIntelligentRouting && retryCount === 0) {
      try {
        await intelligentRouting.analyzeQuestion(message);
      } catch (error) {
        logger.warn('Erro na análise de roteamento:', error);
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
        logger.error('Erro na análise de sentimento:', error);
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
        logger.error('Erro ao buscar contexto:', error);
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
    // skipUserMessageAdd=true quando page.tsx já adicionou ao conversation history
    if (retryCount === 0 && !skipUserMessageAdd) {
      addMessage(userMessage);
    }

    setLoading(true);
    setError(null);
    setLastApiCall(Date.now());

    try {
      const currentMessages = retryCount === 0 ? [...messagesRef.current, userMessage] : messagesRef.current;

      let assistantContent: string;
      let assistantConfidence: number;

      // When attachment is present, call backend directly (PersonaRAG doesn't forward files)
      if (attachment?.base64Data) {
        const backendResponse = await sendChatMessage({
          question: message.trim(),
          personality_id: personaId,
          conversation_history: currentMessages.slice(-10),
          attachment: {
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            base64Data: attachment.base64Data,
            sizeBytes: attachment.sizeBytes
          }
        });
        assistantContent = backendResponse.answer;
        assistantConfidence = backendResponse.confidence ?? 0.7;
      } else {
        // Chamar backend API com RAG real (Supabase pgvector)
        const backendResponse = await sendChatMessage({
          question: message.trim(),
          personality_id: personaId,
          conversation_history: currentMessages.slice(-10)
        });
        assistantContent = backendResponse.answer;
        assistantConfidence = backendResponse.confidence ?? 0.7;
      }

      // Criar mensagem do assistente baseada na resposta
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        persona: personaId,
        metadata: {
          confidence: assistantConfidence
        }
      };

      addMessage(assistantMessage);

      // Chamar callback se fornecido
      if (onMessageReceived) {
        onMessageReceived(assistantMessage);
      }

      setLoading(false);

    } catch (err) {
      logger.error(`Erro ao enviar mensagem (tentativa ${retryCount + 1}):`, err);
      captureError(err as string | Error, { severity: 'medium' });

      // Issue #330: Classify error for better user feedback
      const classified = classifyError(err);
      setClassifiedError(classified);
      setCurrentRetryCount(retryCount + 1);

      if (retryCount < maxRetries && classified.canRetry) {
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
          logger.error('Fallback também falhou:', fallbackErr);
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
  }, [sessionId, messagesRef, addMessage, onMessageReceived, setError, setLastApiCall, setLoading, withFallback, captureError, analyzeSentiment, enableSentimentAnalysis]);

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

  // Issue #330: Manual retry function for user-initiated retry
  const manualRetry = useCallback(async (message: string, personaId: string) => {
    setIsManualRetrying(true);
    setClassifiedError(null);
    setCurrentRetryCount(0);
    try {
      await sendMessage(message, personaId, 0);
    } finally {
      setIsManualRetrying(false);
    }
  }, [sendMessage]);

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
    configurePersona: (personaId: string, config: Partial<RAGPersonaConfig>) => personaRAG.configurePersona(personaId, config),
    // Issue #330: Enhanced error handling
    classifiedError,
    currentRetryCount,
    isManualRetrying,
    manualRetry
  };
}