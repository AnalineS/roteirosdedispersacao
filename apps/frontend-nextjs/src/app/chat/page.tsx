'use client';

import { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import Link from 'next/link';
import EducationalLayout from '@/components/layout/EducationalLayout';
import ModernChatContainer from '@/components/chat/modern/ModernChatContainer';
import SystemStatus from '@/components/system/SystemStatus';
import { LoadingIcon, AlertIcon } from '@/components/icons';
import { useGlobalNavigation } from '@/components/navigation/GlobalNavigationProvider';
import LGPDCompliance, { useLGPDConsent } from '@/components/privacy/LGPDCompliance';
import ChatNavigation, { useChatNavigation } from '@/components/navigation/ChatNavigation';
import ConversationProgress from '@/components/progress/ConversationProgress';
import ChatFeedback, { useChatFeedback } from '@/components/ui/ChatFeedback';

// Lazy load dos componentes complementares
const ConversationHistory = lazy(() => import('@/components/chat/ConversationHistory'));
import { usePersonas } from '@/hooks/usePersonas';
import { useChat } from '@/hooks/useChat';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/config/theme';
import { SidebarLoader } from '@/components/LoadingSpinner';
import { type ChatMessage } from '@/services/api';

export default function ChatPage() {
  const { setPersonaSelectionViewed } = useGlobalNavigation();
  const { personas, loading: personasLoading, error: personasError } = usePersonas();
  
  // Chat feedback hook
  const { triggerSendFeedback, triggerReceiveFeedback, triggerErrorFeedback } = useChatFeedback();
  
  // Marcar que o usuário visitou o chat (permite navegação livre)
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
    onMessageReceived: useCallback((message: ChatMessage) => {
      // Adicionar resposta da IA ao histórico de conversas
      addMessageToConversation(message);
      // Trigger feedback visual/sonoro
      triggerReceiveFeedback();
    }, [addMessageToConversation, triggerReceiveFeedback])
  });
  
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null); // Será definido baseado na URL ou preferência
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

  // Carregar persona baseada no perfil do usuário ou localStorage
  useEffect(() => {
    if (personas && Object.keys(personas).length > 0 && !selectedPersona) {
      let selectedPersonaId = null;
      
      // Prioridade 1: Persona do perfil do usuário
      if (profile && profile.selectedPersona && personas[profile.selectedPersona]) {
        selectedPersonaId = profile.selectedPersona;
      }
      // Prioridade 2: Recomendação baseada no perfil
      else if (profile) {
        const recommended = getRecommendedPersona();
        if (recommended && personas[recommended]) {
          selectedPersonaId = recommended;
        }
      }
      
      // Prioridade 3: localStorage (compatibilidade com versão anterior)
      if (!selectedPersonaId && typeof window !== 'undefined') {
        const storedPersona = localStorage.getItem('selectedPersona');
        if (storedPersona && personas[storedPersona]) {
          selectedPersonaId = storedPersona;
        }
      }
      
      // Prioridade 4: Usar 'ga' como padrão quando não há preferência específica
      if (!selectedPersonaId) {
        // Sempre preferir 'ga' como padrão
        if (personas['ga']) {
          selectedPersonaId = 'ga';
        } else if (personas['dr_gasnelio']) {
          selectedPersonaId = 'dr_gasnelio';
        } else {
          // Usar a primeira persona disponível como fallback
          selectedPersonaId = Object.keys(personas)[0];
        }
      }

      if (selectedPersonaId) {
        console.log('[ChatPage] Setting initial persona:', selectedPersonaId);
        setSelectedPersona(selectedPersonaId);
        
        // Salvar no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedPersona', selectedPersonaId);
        }
        
        // Atualizar perfil se necessário
        if (profile && profile.selectedPersona !== selectedPersonaId) {
          updateProfile({ selectedPersona: selectedPersonaId });
        }
        
        // Criar conversa se não houver uma ativa
        if (!currentConversationId) {
          createConversation(selectedPersonaId);
        }
      }
    }
  }, [personas]); // Removendo dependências desnecessárias para evitar loops


  // Função wrapper para enviar mensagens e adicionar ao histórico
  const sendMessageWithHistory = useCallback(async (messageText: string, personaId: string) => {
    const userMessage = {
      role: 'user' as const,
      content: messageText,
      timestamp: Date.now(),
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

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersona(personaId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPersona', personaId);
    }
    // Criar nova conversa para a persona selecionada
    createConversation(personaId);
    
    // Limpar análise de roteamento
    clearAnalysis();
    
    // Se há uma pergunta pendente, enviá-la agora
    if (pendingQuestion) {
      setInputValue(pendingQuestion);
      setPendingQuestion('');
    }
  };
  
  const handleNewConversation = (personaId: string) => {
    const conversationId = createConversation(personaId);
    setSelectedPersona(personaId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPersona', personaId);
    }
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
  
  // Handlers para roteamento inteligente
  const handleAcceptRouting = useCallback((personaId: string) => {
    acceptRecommendation();
    handlePersonaChange(personaId);
  }, [acceptRecommendation, handlePersonaChange]);
  
  const handleRejectRouting = useCallback(() => {
    rejectRecommendation(selectedPersona || '');
  }, [rejectRecommendation, selectedPersona]);
  
  const handleShowExplanation = useCallback(() => {
    console.log('Explicação do roteamento:', getExplanation());
  }, [getExplanation]);

  if (personasLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingIcon size={48} spinning={true} />
          <p>Carregando chat...</p>
        </div>
      </div>
    );
  }

  if (personasError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertIcon size={48} color={theme.colors.primary[500]} />
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
    <EducationalLayout 
      currentPersona={currentPersona?.name}
      showBreadcrumbs={false}
      footerVariant="simple"
    >
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
        />
        
        {/* Chat Feedback Overlay */}
        <ChatFeedback 
          enableSound={true}
          enableVisualFeedback={true}
        />
      </div>
    </EducationalLayout>
  );
}