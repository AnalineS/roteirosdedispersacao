'use client';

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import EducationalLayout from '@/components/layout/EducationalLayout';
import ModernChatContainer from '@/components/chat/modern/ModernChatContainer';
import PersonaSwitch from '@/components/chat/modern/PersonaSwitch';
import RoutingIndicator from '@/components/chat/RoutingIndicator';
import { ChatAccessibilityProvider } from '@/components/chat/accessibility/ChatAccessibilityProvider';
import SystemStatus from '@/components/system/SystemStatus';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGlobalNavigation } from '@/components/navigation/GlobalNavigationProvider';
import LGPDCompliance, { useLGPDConsent } from '@/components/privacy/LGPDCompliance';
import ChatNavigation, { useChatNavigation } from '@/components/navigation/ChatNavigation';
import ConversationProgress from '@/components/progress/ConversationProgress';
import ChatFeedback, { useChatFeedback } from '@/components/ui/ChatFeedback';

// Lazy load dos componentes complementares
const ConversationHistory = lazy(() => import('@/components/chat/ConversationHistory'));
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { useCurrentPersona, usePersonaActions } from '@/contexts/PersonaContext';
import { safeLocalStorage } from '@/hooks/useClientStorage';
import { useChat } from '@/hooks/useChat';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/useToast';
import { useRegenerateTracking } from '@/hooks/useRegenerateTracking';
import { theme } from '@/config/theme';
import { SidebarLoader } from '@/components/LoadingSpinner';
import ToastContainer from '@/components/ui/ToastContainer';
import FavoritesModal from '@/components/chat/modern/FavoritesModal';
import { type ChatMessage } from '@/types/api';
import { type ValidPersonaId } from '@/types/personas';

export default function ChatPage() {
  const { setPersonaSelectionViewed } = useGlobalNavigation();
  const { personas, loading: personasLoading, error: personasError } = usePersonasEnhanced({
    includeFallback: true,
    useCache: true
  });
  const { persona: contextPersona } = useCurrentPersona();
  const { setPersona } = usePersonaActions();
  
  // Chat feedback hook
  const { triggerSendFeedback, triggerReceiveFeedback, triggerErrorFeedback } = useChatFeedback();

  // Issue #331: Favorites, toast, and regenerate tracking hooks
  const { favorites, isFavorite, toggleFavorite, removeFavorite, exportFavorites } = useFavorites();
  const { toasts, dismissToast, success: showSuccess, error: showError } = useToast();
  const { canRegenerate, trackRegenerate, getRegenerateCount, maxAttempts } = useRegenerateTracking();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Marcar que o usuário visitou o chat
  useEffect(() => {
    setPersonaSelectionViewed();
  }, [setPersonaSelectionViewed]);
  
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
  useUserProfile(); // Keep hook active for future features
  const {
    loading: chatLoading,
    sendMessage,
    currentSentiment,
    knowledgeStats,
    isSearchingKnowledge,
    fallbackState,
    classifiedError,
    currentRetryCount,
    isManualRetrying,
    manualRetry
  } = useChat({ 
    persistToLocalStorage: false, 
    enableSentimentAnalysis: true,
    enableKnowledgeEnrichment: true,
    enableIntelligentRouting: true,
    availablePersonas: personas,
    onMessageReceived: useCallback((message: ChatMessage) => {
      // Adicionar resposta da IA ao histórico de conversas
      addMessageToConversation(message);
      // Trigger feedback visual/sonoro
      triggerReceiveFeedback();
    }, [addMessageToConversation, triggerReceiveFeedback])
  });
  
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(contextPersona); // Usar persona do contexto
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
  // LGPD Compliance para coleta de dados sensíveis de saúde
  const { hasConsent, isLoading: lgpdLoading } = useLGPDConsent('chat');
  
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
      console.error('Erro ao obter conversas:', error);
      return [];
    }
  }, [personas, getConversationsForPersona]);
  
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
  
  // Chat Navigation state (hook must be called for future features)
  useChatNavigation(currentMessages);
  
  // Hook de roteamento inteligente
  const {
    analyzeQuestion,
    acceptRecommendation,
    rejectRecommendation,
    clearAnalysis,
    currentAnalysis,
    shouldShowRouting,
    getRecommendedPersona
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
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user' as const,
      content: messageText,
      timestamp: new Date().toISOString(),
      persona: personaId
    };
    
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
      console.error('Erro ao enviar mensagem:', error);
      // Trigger feedback de erro
      triggerErrorFeedback('Erro ao enviar mensagem. Tente novamente.');
    }
  }, [sendMessage, addMessageToConversation, triggerSendFeedback, triggerErrorFeedback]);

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
        await sendMessageWithHistory(messageText, selectedPersona);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }
  };

  const handlePersonaChange = useCallback(async (personaId: string) => {
    try {
      // Usar o contexto unificado para mudar persona
      await setPersona(personaId as ValidPersonaId, 'explicit');
      setSelectedPersona(personaId);
      
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
      console.error('Erro ao alterar persona:', error);
    }
  }, [setPersona, createConversation, clearAnalysis, pendingQuestion]);

  // Handler para aceitar recomendação de routing
  const handleAcceptRouting = useCallback((personaId: string) => {
    acceptRecommendation();
    handlePersonaChange(personaId);
  }, [acceptRecommendation, handlePersonaChange]);

  // Handler para rejeitar recomendação de routing
  const handleRejectRouting = useCallback(() => {
    rejectRecommendation(selectedPersona || 'ga');
  }, [rejectRecommendation, selectedPersona]);

  // Handler para mostrar explicação de routing
  const handleShowRoutingExplanation = useCallback(() => {
    // Analytics tracking para visualização de explicação
    console.log('Routing explanation viewed');
  }, []);

  // Handler para upload de arquivos
  const handleFileUpload = useCallback((files: FileList) => {
    console.log('Files uploaded:', files);

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

    console.log(privacyMessage);

    // TODO: Implementar processamento de arquivos
    // - Upload temporário para backend
    // - OCR para PDFs/imagens
    // - Extração de texto
    // - Adicionar ao contexto da conversa
    // - Exclusão automática após processamento
  }, [triggerReceiveFeedback]);

  // Issue #331: Handler para copiar mensagem
  const handleCopyMessage = useCallback(async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      showSuccess('Mensagem copiada!');
    } catch (error) {
      console.error('Error copying message:', error);
      showError('Erro ao copiar mensagem');
    }
  }, [showSuccess, showError]);

  // Issue #331: Handler para favoritar mensagem
  const handleToggleFavorite = useCallback((message: ChatMessage) => {
    toggleFavorite(message);
    const wasFavorite = isFavorite(message.id);
    if (wasFavorite) {
      showSuccess('Removido dos favoritos');
    } else {
      showSuccess('Adicionado aos favoritos');
    }
  }, [toggleFavorite, isFavorite, showSuccess]);

  // Issue #331: Handler para regenerar resposta (with limit tracking)
  const handleRegenerateMessage = useCallback(async (message: ChatMessage) => {
    // Check regenerate limit
    if (!canRegenerate(message.id)) {
      showError(`Limite de ${maxAttempts} tentativas atingido para esta mensagem`);
      return;
    }

    // Track regenerate attempt
    trackRegenerate(message.id);

    // Find the previous user message
    const messageIndex = currentMessages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      const previousUserMessage = currentMessages.slice(0, messageIndex).reverse().find(m => m.role === 'user');
      if (previousUserMessage && selectedPersona) {
        const count = getRegenerateCount(message.id) + 1;
        showSuccess(`Gerando nova resposta (tentativa ${count}/${maxAttempts})...`);

        // Modify prompt to request different explanation
        const modifiedPrompt = count > 1
          ? `${previousUserMessage.content}\n\n(Por favor, explique de forma diferente da resposta anterior)`
          : previousUserMessage.content;

        await sendMessageWithHistory(modifiedPrompt, selectedPersona);
      }
    }
  }, [currentMessages, selectedPersona, sendMessageWithHistory, showSuccess, showError, canRegenerate, trackRegenerate, getRegenerateCount, maxAttempts]);
  
  const handleNewConversation = (personaId: string) => {
    createConversation(personaId);
    setSelectedPersona(personaId);
    safeLocalStorage()?.setItem('selectedPersona', personaId);
  };
  
  const handleConversationSelect = (conversationId: string) => {
    switchToConversation(conversationId);
    // Encontrar a persona desta conversa com função helper
    const allConversations = getAllConversations();
    const selectedConv = allConversations.find(conv => conv.id === conversationId);
    if (selectedConv) {
      setSelectedPersona(selectedConv.personaId);
      safeLocalStorage()?.setItem('selectedPersona', selectedConv.personaId);
    }
    clearAnalysis();
  };
  

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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <p>Erro ao carregar chat: {personasError}</p>
          <Link href="/" style={{ color: theme.colors.primary[500], textDecoration: 'underline' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  return (
    <ChatAccessibilityProvider>
      <EducationalLayout
        currentPersona={currentPersona?.name}
        showBreadcrumbs={false}
        footerVariant="simple"
      >
      {/* Semantic H1 for WCAG 2.1 AA compliance - Issue #329 */}
      <h1 className="sr-only">Chat com Assistentes Virtuais de Educação sobre Hanseníase</h1>
      {/* LGPD Compliance Modal */}
      {!lgpdLoading && !hasConsent && (
        <LGPDCompliance 
          context="chat"
          onAccept={() => {
            // Consentimento aceito, usuário pode continuar
          }}
          onDecline={() => {
            // Redirecionar para página inicial ou mostrar alternativas
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
        {hasConsent && currentMessages.length > 0 && (
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

        {/* Persona Switcher - Issue #221 */}
        {/* Show PersonaSwitch after LGPD consent, regardless of selection */}
        {hasConsent && Object.keys(personas).length > 0 && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '0 1rem',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <PersonaSwitch
              personas={personas}
              selected={selectedPersona}
              onChange={handlePersonaChange}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* Routing Indicator - Sugere persona quando usuario digita sem selecionar */}
        {hasConsent && shouldShowRouting() && currentAnalysis && getRecommendedPersona() && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 1rem',
            padding: '0 1rem'
          }}>
            <RoutingIndicator
              analysis={currentAnalysis}
              recommendedPersona={getRecommendedPersona()!}
              currentPersonaId={selectedPersona}
              personas={personas}
              onAcceptRouting={handleAcceptRouting}
              onRejectRouting={handleRejectRouting}
              onShowExplanation={handleShowRoutingExplanation}
              isMobile={isMobile}
            />
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
          knowledgeStats={knowledgeStats as unknown as Record<string, unknown>}
          isSearchingKnowledge={isSearchingKnowledge}
          fallbackState={fallbackState}
          onHistoryToggle={() => setShowHistory(!showHistory)}
          showHistory={showHistory}
          onFileUpload={handleFileUpload}
          classifiedError={classifiedError}
          currentRetryCount={currentRetryCount}
          isManualRetrying={isManualRetrying}
          onManualRetry={() => {
            // Issue #330: Manual retry with last message
            const lastUserMessage = currentMessages.filter(m => m.role === 'user').pop();
            if (lastUserMessage && selectedPersona) {
              manualRetry(lastUserMessage.content, selectedPersona);
            }
          }}
          onCopyMessage={handleCopyMessage}
          onToggleFavorite={handleToggleFavorite}
          onRegenerateMessage={handleRegenerateMessage}
          isFavorite={isFavorite}
          canRegenerate={canRegenerate}
          favoritesCount={favorites.length}
          onShowFavorites={() => setShowFavoritesModal(true)}
        />
        
        {/* Chat Feedback Overlay */}
        <ChatFeedback
          enableSound={true}
          enableVisualFeedback={true}
        />

        {/* Issue #331: Toast notifications */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Issue #331: Favorites modal */}
        <FavoritesModal
          isOpen={showFavoritesModal}
          onClose={() => setShowFavoritesModal(false)}
          favorites={favorites}
          onRemoveFavorite={removeFavorite}
          onExport={exportFavorites}
          isMobile={isMobile}
        />
      </div>
      </EducationalLayout>
    </ChatAccessibilityProvider>
  );
}