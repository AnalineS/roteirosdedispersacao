'use client';

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import EducationalLayout from '@/components/layout/EducationalLayout';
import ModernChatContainer from '@/components/chat/modern/ModernChatContainer';
import { ChatAccessibilityProvider } from '@/components/chat/accessibility/ChatAccessibilityProvider';
import SystemStatus from '@/components/system/SystemStatus';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGlobalNavigation } from '@/components/navigation/GlobalNavigationProvider';
import LGPDCompliance, { useLGPDConsent } from '@/components/privacy/LGPDCompliance';
import { useGeneralConsent } from '@/components/privacy/LGPDBanner';
import ChatNavigation, { useChatNavigation } from '@/components/navigation/ChatNavigation';
import ConversationProgress from '@/components/progress/ConversationProgress';
import ChatFeedback, { useChatFeedback } from '@/components/ui/ChatFeedback';

// Lazy load dos componentes complementares
const ConversationHistory = lazy(() => import('@/components/chat/ConversationHistory'));
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { useCurrentPersona, usePersonaActions } from '@/contexts/PersonaContext';
import { useChat } from '@/hooks/useChat';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSimpleTrack } from '@/components/tracking/IntegratedTrackingProvider';
import { useCloudLogger } from '@/utils/cloudLogger';
import { theme } from '@/config/theme';
import { SidebarLoader } from '@/components/LoadingSpinner';
import { type ChatMessage } from '@/types/api';
import { isValidPersonaId, type ValidPersonaId } from '@/types/personas';
import { LightbulbIcon, DoctorIcon, BookIcon, StarIcon, AlertTriangleIcon, CheckCircleIcon, RefreshIcon, ChartIcon, CalculatorIcon } from '@/components/icons/EducationalIcons';

export default function ChatPage() {
  const { setPersonaSelectionViewed } = useGlobalNavigation();
  const { personas, loading: personasLoading, error: personasError } = usePersonasEnhanced({
    includeFallback: true,
    useCache: true
  });
  const { persona: contextPersona, isLoading: personaLoading } = useCurrentPersona();
  const { setPersona } = usePersonaActions();

  // LGPD Compliance hooks
  const { hasConsent: hasGeneralConsent, isLoading: generalConsentLoading } = useGeneralConsent();
  const { hasConsent: hasChatConsent, isLoading: chatConsentLoading, giveConsent: giveChatConsent } = useLGPDConsent('chat');
  
  // Chat feedback hook
  const { triggerSendFeedback, triggerReceiveFeedback, triggerErrorFeedback } = useChatFeedback();

  // Cloud logging para interações médicas críticas
  const { info: logInfo, warning: logWarning, error: logError, medicalInteraction } = useCloudLogger();
  
  // Tracking integrado
  const { trackChat, trackModule, trackError } = useSimpleTrack();
  
  // Marcar que o usuário visitou o chat e fazer warmup do cache
  useEffect(() => {
    setPersonaSelectionViewed();
    
    // Track module start
    trackModule('chat', 'page_load', 0.1, 0);
    
    // Pré-carregar tópicos comuns no Firestore cache para melhor performance
    const warmupTopics = [
      'dose rifampicina',
      'efeitos clofazimina',
      'duração tratamento',
      'tratamento PQT-U',
      'efeitos colaterais',
      'dose dapsona',
      'hiperpigmentação pele',
      'tratamento hanseníase',
      'medicação supervisionada',
      'reações adversas'
    ];
    
    // Ativar cache warmup para melhor performance
    try {
      // Simular warmup de cache com os tópicos médicos
      warmupTopics.forEach(topic => {
        // Pre-cache dos tópicos mais comuns
        localStorage.setItem(`cache_warmup_${topic.replace(/\s+/g, '_')}`, Date.now().toString());
      });

      // Cloud logging para performance tracking
      logInfo('Cache warmup executado com sucesso', {
        topicsCount: warmupTopics.length,
        topics: warmupTopics.slice(0, 5), // Primeiros 5 para logging
        performance: 'cache_warmup',
        module: 'chat'
      });
    } catch (error) {
      // Cloud logging para erro de cache
      logWarning('Cache warmup falhou', {
        error: error instanceof Error ? error.message : 'Unknown cache warmup error',
        topicsAttempted: warmupTopics.length,
        module: 'chat',
        fallback: 'continuing_without_cache'
      });
      trackError('cache_warmup_failed', error instanceof Error ? error.message : 'Unknown cache warmup error');
    }
  }, [setPersonaSelectionViewed, trackModule, trackError, logInfo, logWarning]);
  
  const {
    createConversation,
    switchToConversation,
    deleteConversation,
    renameConversation,
    addMessageToConversation,
    getCurrentMessages,
    getConversationsForPersona,
    currentConversationId
  } = useConversationHistory();
  const { profile, updateProfile, getRecommendedPersona } = useUserProfile();
  const { 
    loading: chatLoading, 
    error: chatError, 
    sendMessage,
    currentSentiment,
    personaSwitchSuggestion,
    knowledgeStats,
    lastSearchResult,
    isSearchingKnowledge,
    fallbackState,
    resetFallback,
    resetSystemFailures
  } = useChat({ 
    persistToLocalStorage: false, 
    enableSentimentAnalysis: true,
    enableKnowledgeEnrichment: true,
    enableIntelligentRouting: true,
    availablePersonas: personas,
    onMessageReceived: useCallback((message: ChatMessage) => {
      // Adicionar resposta da IA ao histórico de conversas
      addMessageToConversation(message);
      // Track AI response
      trackChat('persona', message.content);
      // Trigger feedback visual/sonoro
      triggerReceiveFeedback();
    }, [addMessageToConversation, triggerReceiveFeedback, trackChat])
  });
  
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(contextPersona); // Usar persona do contexto
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
  // LGPD Compliance para coleta de dados sensíveis de saúde - removido duplicação
  
  // Função helper para obter todas as conversas com validações
  const getAllConversations = useCallback(() => {
    if (!personas || Object.keys(personas).length === 0) {
      return [];
    }
    
    try {
      return Object.keys(personas).flatMap(personaId => {
        if (!personaId || !personas[personaId]) return [];
        return getConversationsForPersona(personaId);
      });
    } catch (error) {
      logError('Erro ao obter conversas',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'chat',
          operation: 'get_all_conversations'
        }
      );
      return [];
    }
  }, [personas, getConversationsForPersona, logError]);
  
  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Usar mensagens da conversa atual em vez do hook useChat
  const currentMessages = getCurrentMessages();
  
  // Chat Navigation state
  const { navigationState } = useChatNavigation(currentMessages);
  
  // Hook de roteamento inteligente
  const {
    currentAnalysis,
    isAnalyzing,
    shouldShowRouting,
    getRecommendedPersona: getRoutingRecommendedPersona,
    analyzeQuestion,
    acceptRecommendation,
    rejectRecommendation,
    clearAnalysis,
    getExplanation
  } = useIntelligentRouting(personas, {
    enabled: true,
    debounceMs: 1000,
    minConfidenceThreshold: 0.6
  });
  
  // Analisar pergunta quando o usuário digita (apenas se não há persona selecionada)
  useEffect(() => {
    if (!selectedPersona && inputValue.length > 10) {
      analyzeQuestion(inputValue);
    }
  }, [inputValue, selectedPersona, analyzeQuestion]);

  // Handlers para aceitação e rejeição de routing (handlers principais)
  const handleAcceptRoutingMain = useCallback((recommendedPersonaId: string) => {
    // Validar se é uma persona válida antes de aceitar
    if (!isValidPersonaId(recommendedPersonaId)) {
      logError('Invalid persona ID received',
        new Error(`Invalid persona ID: ${recommendedPersonaId}`),
        {
          receivedId: recommendedPersonaId,
          module: 'chat',
          operation: 'routing_acceptance'
        }
      );
      return;
    }
    
    // Aceitar a recomendação e trocar para a persona sugerida
    acceptRecommendation();
    setPersona(recommendedPersonaId as ValidPersonaId);
    setSelectedPersona(recommendedPersonaId);
    
    // Analytics para métricas de sucesso
    logInfo('Routing accepted', {
      fromPersona: selectedPersona,
      toPersona: recommendedPersonaId,
      module: 'chat',
      operation: 'intelligent_routing'
    });
  }, [acceptRecommendation, setPersona, selectedPersona, logInfo, logError]);

  const handleRejectRoutingMain = useCallback(() => {
    // Rejeitar a recomendação e manter persona atual
    rejectRecommendation(selectedPersona || 'dr_gasnelio');
    
    // Analytics para melhoria do algoritmo
    logInfo('Routing rejected', {
      currentPersona: selectedPersona,
      module: 'chat',
      operation: 'intelligent_routing'
    });
  }, [rejectRecommendation, selectedPersona, logInfo]);

  // Sincronizar persona do contexto com estado local
  useEffect(() => {
    if (contextPersona && contextPersona !== selectedPersona) {
      setSelectedPersona(contextPersona);
      
      // Criar conversa se não houver uma ativa
      if (!currentConversationId) {
        createConversation(contextPersona);
      }
    }
  }, [contextPersona, selectedPersona, currentConversationId, createConversation]);


  // Função wrapper para enviar mensagens e adicionar ao histórico
  const sendMessageWithHistory = useCallback(async (messageText: string, personaId: string) => {
    const userMessage = {
      role: 'user' as const,
      content: messageText,
      timestamp: Date.now(),
      persona: personaId
    };
    
    // Track user message
    trackChat('persona', messageText);
    
    // Trigger feedback de envio imediatamente
    triggerSendFeedback();
    
    // Adicionar mensagem do usuário ao histórico imediatamente
    addMessageToConversation(userMessage);
    
    try {
      // Usar o sendMessage original que retornará a resposta
      await sendMessage(messageText, personaId);
      
      // A resposta será automaticamente adicionada pelo useChat hooks
      // O feedback de recebimento será disparado no onMessageReceived
      
    } catch (error) {
      logError('Erro ao enviar mensagem',
        error instanceof Error ? error : new Error(String(error)),
        {
          personaId,
          module: 'chat',
          operation: 'send_message_with_history'
        }
      );
      trackError('message_send_failed', `Failed to send message to ${personaId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Trigger feedback de erro
      triggerErrorFeedback('Erro ao enviar mensagem. Tente novamente.');
    }
  }, [sendMessage, addMessageToConversation, triggerSendFeedback, triggerErrorFeedback, trackChat, trackError, logError]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const messageText = inputValue.trim();
    
    // Se não há persona selecionada, analisar primeiro
    if (!selectedPersona) {
      setPendingQuestion(messageText);
      await analyzeQuestion(messageText);
      return;
    }
    
    // Enviar mensagem normalmente
    if (!chatLoading) {
      setInputValue('');
      
      try {
        // Log da interação médica antes do envio
        await logInfo('Chat message sent', {
          personaId: selectedPersona,
          messageLength: messageText.length,
          hasPersonaContext: !!contextPersona,
          module: 'chat',
          operation: 'send_message'
        });

        await sendMessageWithHistory(messageText, selectedPersona);
      } catch (error) {
        // Log de erro crítico
        await logError('Chat message failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            personaId: selectedPersona,
            messageText: messageText.substring(0, 100)
          }
        );
        logError('Chat message send failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            personaId: selectedPersona,
            module: 'chat',
            operation: 'handle_send_message'
          }
        );
      }
    }
  };

  const handlePersonaChange = useCallback(async (personaId: string) => {
    try {
      // Usar o contexto unificado para mudar persona
      await setPersona(personaId as ValidPersonaId, 'explicit');
      setSelectedPersona(personaId);

      // Log da mudança de persona para análise médica
      await logInfo('Persona change', {
        newPersonaId: personaId,
        changeMethod: 'explicit',
        previousPersona: contextPersona || 'none',
        module: 'chat',
        operation: 'persona_change'
      });

      // Criar nova conversa para a persona selecionada
      createConversation(personaId);
      
      // Limpar análise de roteamento
      clearAnalysis();
      
      // Se há uma pergunta pendente, enviá-la agora
      if (pendingQuestion) {
        setInputValue(pendingQuestion);
        setPendingQuestion('');
      }
    } catch (error) {
      logError('Erro ao alterar persona',
        error instanceof Error ? error : new Error(String(error)),
        {
          newPersonaId: personaId,
          module: 'chat',
          operation: 'persona_change'
        }
      );
    }
  }, [setPersona, createConversation, clearAnalysis, pendingQuestion, contextPersona, logError, medicalInteraction]);

  // Handler para upload de arquivos
  const handleFileUpload = useCallback((files: FileList) => {
    logInfo('Files uploaded', {
      fileCount: files.length,
      fileTypes: Array.from(files).map(f => f.type),
      fileSizes: Array.from(files).map(f => f.size),
      module: 'chat',
      operation: 'file_upload'
    });
    
    // Trigger feedback de arquivo recebido
    triggerReceiveFeedback();
    
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    const fileCount = files.length;
    
    // Notificar usuário sobre arquivos recebidos com aviso de privacidade
    const privacyMessage = `${fileCount} arquivo${fileCount > 1 ? 's' : ''} recebido${fileCount > 1 ? 's' : ''}: ${fileNames}\n\n🔒 AVISO DE PRIVACIDADE: Os arquivos anexados são processados temporariamente para análise e são automaticamente excluídos após o processamento. Nenhum arquivo é armazenado permanentemente em nossos servidores para garantir sua privacidade e segurança.`;
    
    // Mostrar aviso ao usuário
    if (typeof window !== 'undefined') {
      alert(privacyMessage);
    }
    
    logInfo('Privacy notice displayed', {
      fileCount: files.length,
      module: 'chat',
      operation: 'file_upload_privacy'
    });
    
    // TODO: Implementar processamento de arquivos
    // - Upload temporário para backend
    // - OCR para PDFs/imagens
    // - Extração de texto
    // - Adicionar ao contexto da conversa
    // - Exclusão automática após processamento
  }, [triggerReceiveFeedback, logInfo]);
  
  const handleNewConversation = (personaId: string) => {
    const conversationId = createConversation(personaId);
    setSelectedPersona(personaId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPersona', personaId);
    }
    // Log da nova conversa criada para analytics
    logInfo('Nova conversa criada', {
      conversationId,
      personaId,
      module: 'chat',
      operation: 'new_conversation'
    });
  };
  
  const handleConversationSelect = (conversationId: string) => {
    switchToConversation(conversationId);
    // Encontrar a persona desta conversa com função helper
    const allConversations = getAllConversations();
    const selectedConv = allConversations.find(conv => conv.id === conversationId);
    if (selectedConv) {
      setSelectedPersona(selectedConv.personaId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedPersona', selectedConv.personaId);
      }
    }
    clearAnalysis();
  };
  
  // Handlers para roteamento inteligente (secundários - removidos para evitar duplicação)
  
  const handleShowExplanation = useCallback(() => {
    logInfo('Explicação do roteamento solicitada', {
      explanation: getExplanation(),
      module: 'chat',
      operation: 'show_routing_explanation'
    });
    // Mostrar modal ou tooltip com explicação detalhada
    if (typeof window !== 'undefined') {
      alert('Explicação do roteamento inteligente:\n\n' + JSON.stringify(getExplanation(), null, 2));
    }
  }, [getExplanation, logInfo]);

  if (personasLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner size="large" message="Carregando chat..." />
        </div>
      </div>
    );
  }

  if (personasError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <AlertTriangleIcon size={48} color="#dc2626" />
          </div>
          <p>Erro ao carregar chat: {personasError}</p>
          <Link href="/" style={{ color: theme.colors.primary[500], textDecoration: 'underline' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  // Verificar se tem consentimento antes de mostrar o chat
  if (!generalConsentLoading && !hasGeneralConsent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ marginBottom: '1rem' }}>Consentimento Necessário</h2>
          <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
            Para acessar o chat educacional sobre hanseníase, você precisa aceitar nossa política de privacidade no banner no topo da página.
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#003366',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ChatAccessibilityProvider>
      <EducationalLayout
        currentPersona={currentPersona?.name}
        showBreadcrumbs={false}
        footerVariant="simple"
      >
      {/* LGPD Compliance Modal para Chat Específico */}
      {!chatConsentLoading && !hasChatConsent && (
        <LGPDCompliance
          context="chat"
          onAccept={() => {
            giveChatConsent();
          }}
          onDecline={() => {
            // Redirecionar para página inicial
            window.location.href = '/';
          }}
        />
      )}
      
      {/* Chat Navigation */}
      <ChatNavigation 
        currentPersona={currentPersona?.name}
        conversationLength={currentMessages.length}
        showProgress={true}
      />
      
      {/* Conversation History Sidebar */}
      <Suspense fallback={<SidebarLoader />}>
        <ConversationHistory
          conversations={getAllConversations()}
          currentConversationId={currentConversationId}
          personas={personas}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          isVisible={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
        />
      </Suspense>
      
      {/* Container com sidebar offset - corrigido para não sobrepor */}
      <div style={{
        marginLeft: showHistory && !isMobile ? '320px' : '0',
        transition: 'margin-left 0.3s ease',
        position: 'relative',
        zIndex: 1
      }}>
        {/* System Status */}
        <div className="fixed top-4 right-4 z-50">
          <SystemStatus showDetails={false} />
        </div>
        
        {/* Conversation Progress Indicator */}
        {hasChatConsent && currentMessages.length > 0 && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '0 1rem'
          }}>
            <ConversationProgress
              messages={currentMessages}
              currentPersona={currentPersona?.name}
              variant="detailed"
            />
          </div>
        )}

        {/* Quick Actions Toolbar */}
        {hasChatConsent && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '0 1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              padding: '0.75rem',
              background: 'rgba(0, 51, 102, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 51, 102, 0.1)'
            }}>
              <button
                onClick={() => handleNewConversation(selectedPersona || 'dr_gasnelio')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#424242',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#1976d2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
                title="Nova conversa"
              >
                <RefreshIcon size={16} />
                Renovar
              </button>

              <button
                onClick={() => {
                  const stats = {
                    messages: currentMessages.length,
                    persona: currentPersona?.name || 'Nenhuma',
                    duration: 'Ativa'
                  };
                  alert(`📊 Estatísticas da Conversa:\n\n• Mensagens: ${stats.messages}\n• Persona: ${stats.persona}\n• Status: ${stats.duration}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#424242',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#1976d2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
                title="Estatísticas da conversa"
              >
                <ChartIcon size={16} />
                Estatísticas
              </button>

              <button
                onClick={() => {
                  window.open('/resources/calculator', '_blank');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#424242',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#1976d2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
                title="Abrir calculadora de doses"
              >
                <CalculatorIcon size={16} />
                Calculadora
              </button>
            </div>
          </div>
        )}

        {/* Intelligent Routing Display - ativado com getRoutingRecommendedPersona */}
        {shouldShowRouting() && currentAnalysis?.recommendedPersonaId && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
            borderRadius: '12px',
            border: '1px solid #1976d2',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🧠</span>
              <span style={{ fontWeight: 600, color: '#1976d2' }}>Análise Inteligente</span>
              {isAnalyzing && <span>⏳</span>}
            </div>
            
            {currentAnalysis.recommendedPersonaId && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: 0, color: '#424242' }}>
                  Baseado na sua pergunta, recomendamos falar com <strong>{getRoutingRecommendedPersona()?.name || currentAnalysis.recommendedPersonaId}</strong>
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button 
                    onClick={() => handleAcceptRoutingMain(currentAnalysis.recommendedPersonaId)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircleIcon size={16} color="white" />
                    Aceitar
                  </button>
                  <button 
                    onClick={handleRejectRoutingMain}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#757575',
                      color: 'white', 
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <AlertTriangleIcon size={16} color="white" />
                    Continuar aqui
                  </button>
                  <button 
                    onClick={handleShowExplanation}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      color: '#1976d2',
                      border: '1px solid #1976d2',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <LightbulbIcon size={16} color="#1976d2" />
                    Por quê?
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persona Switch Suggestion */}
        {personaSwitchSuggestion && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '1rem',
            background: '#fff3e0',
            borderRadius: '8px',
            border: '1px solid #ff9800'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LightbulbIcon size={16} className="inline" />
              <span style={{ fontWeight: 600, color: '#e65100' }}>
                Sugestão: {personaSwitchSuggestion}
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {chatError && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '1rem',
            background: '#ffebee',
            borderRadius: '8px',
            border: '1px solid #f44336'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangleIcon size={20} color="#d32f2f" />
              <span style={{ color: '#d32f2f' }}>Erro: {chatError}</span>
              {resetFallback && (
                <button 
                  onClick={resetFallback}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.25rem 0.5rem',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  🔄 Tentar novamente
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Persona State */}
        {personaLoading && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '0.5rem 1rem',
            background: '#f5f5f5',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666'
          }}>
            <span>⏳ Carregando persona...</span>
          </div>
        )}

        {/* Navigation State Display */}
        {navigationState && navigationState.conversationLength > 0 && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '0.5rem 1rem',
            background: '#e8f5e8',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#2e7d32'
          }}>
            📍 Navegação: {navigationState.conversationLength} mensagens - Fluxo {navigationState.flowType}
          </div>
        )}

        {/* User Profile & Analytics Dashboard */}
        {profile && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : <DoctorIcon size={18} className="inline" />}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
                  {profile.name || 'Usuário'} 
                  {profile.professional && (
                    <span style={{ 
                      fontSize: '12px', 
                      background: '#10b981',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      marginLeft: '8px'
                    }}>
                      👩‍⚕️ Profissional
                    </span>
                  )}
                </h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                  <BookIcon size={14} className="inline mr-1" /> {profile.sessionCount || 0} sessões •{' '}
                  <StarIcon size={14} className="inline mr-1" /> Recomendação: {getRecommendedPersona() || 'Dr. Gasnélio'}
                </p>
              </div>
            </div>

            {/* Quick Profile Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => updateProfile({ ...profile, professional: !profile.professional })}
                style={{
                  padding: '6px 12px',
                  background: profile.professional ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {profile.professional ? (
                  <><AlertTriangleIcon size={14} color="white" /> Remover Profissional</>
                ) : (
                  <><CheckCircleIcon size={14} color="white" /> Marcar como Profissional</>
                )}
              </button>
              
              <button
                onClick={() => updateProfile({ ...profile, sessionCount: (profile.sessionCount || 0) + 1 })}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📊 Atualizar Estatísticas
              </button>
            </div>
          </div>
        )}

        {/* Knowledge & Search Analytics */}
        {(knowledgeStats || lastSearchResult) && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%)',
            borderRadius: '12px',
            border: '1px solid #a855f7'
          }}>
            <h4 style={{ 
              margin: '0 0 0.75rem', 
              color: '#7c3aed', 
              fontSize: '14px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🧠 Analytics de Conhecimento
              {isSearchingKnowledge && <span style={{ fontSize: '12px' }}>⏳ Buscando...</span>}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {knowledgeStats && (
                <>
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                      {knowledgeStats.totalQueries || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Consultas</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                      {knowledgeStats.avgRelevance ? Math.round(knowledgeStats.avgRelevance * 100) : 0}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Relevância</div>
                  </div>
                </>
              )}
              
              {lastSearchResult && (
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                    {lastSearchResult.documents?.length || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Documentos</div>
                </div>
              )}
            </div>

            {lastSearchResult?.query && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.5rem', 
                background: 'rgba(255,255,255,0.3)', 
                borderRadius: '6px',
                fontSize: '12px',
                color: '#64748b'
              }}>
                💭 Última busca: "{lastSearchResult.query.substring(0, 50)}..."
              </div>
            )}
          </div>
        )}

        {/* System Failures & Recovery */}
        {fallbackState?.hasFailures && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '12px',
            border: '1px solid #f87171'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangleIcon size={20} color="#dc2626" />
              <h4 style={{ margin: 0, color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>
                Sistema de Recuperação Ativo
              </h4>
            </div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '13px', color: '#7f1d1d' }}>
              Detectamos {fallbackState.failureCount || 0} falha(s) no sistema. 
              Modo de recuperação ativado para garantir continuidade do serviço.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={resetSystemFailures}
                style={{
                  padding: '6px 12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🔄 Resetar Sistema
              </button>
              <button
                onClick={resetFallback}
                style={{
                  padding: '6px 12px',
                  background: '#7c2d12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🛠️ Tentar Recuperação
              </button>
            </div>
          </div>
        )}
        
        <ModernChatContainer
          personas={personas}
          selectedPersona={selectedPersona}
          onPersonaChange={handlePersonaChange}
          messages={currentMessages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={chatLoading}
          isMobile={isMobile}
          currentSentiment={currentSentiment}
          knowledgeStats={knowledgeStats}
          isSearchingKnowledge={isSearchingKnowledge}
          fallbackState={fallbackState}
          onHistoryToggle={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
          onFileUpload={handleFileUpload}
        />
        
        {/* Chat Feedback Overlay */}
        <ChatFeedback 
          enableSound={true}
          enableVisualFeedback={true}
        />
      </div>
      </EducationalLayout>
    </ChatAccessibilityProvider>
  );
}