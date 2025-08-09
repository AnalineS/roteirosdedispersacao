'use client';

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ModernChatContainer from '@/components/chat/modern/ModernChatContainer';
import { LoadingIcon, AlertIcon } from '@/components/icons';

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
  const { personas, loading: personasLoading, error: personasError } = usePersonas();
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
    }, [addMessageToConversation])
  });
  
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>('ga'); // Padrão: Gá (empático)
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
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
      
      // Prioridade 4: Usar a primeira persona disponível (dr_gasnelio ou ga)
      if (!selectedPersonaId) {
        // Preferir 'ga' se disponível, senão usar a primeira
        if (personas['ga']) {
          selectedPersonaId = 'ga';
        } else if (personas['dr_gasnelio']) {
          selectedPersonaId = 'dr_gasnelio';
        } else {
          // Usar a primeira persona disponível
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
    
    // Adicionar mensagem do usuário ao histórico imediatamente
    addMessageToConversation(userMessage);
    
    try {
      // Usar o sendMessage original que retornará a resposta
      await sendMessage(messageText, personaId);
      
      // A resposta será automaticamente adicionada pelo useChat hooks
      // Precisamos interceptar isso - vou fazer isso no próximo passo
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Adicionar mensagem de erro ao histórico se necessário
    }
  }, [sendMessage, addMessageToConversation]);

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
  }, [acceptRecommendation]);
  
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
    <>
      <Navigation currentPersona={currentPersona?.name} />
      
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
      
      {/* Container com sidebar offset */}
      <div style={{
        marginLeft: showHistory && !isMobile ? '320px' : '0',
        transition: 'margin-left 0.3s ease',
        position: 'relative'
      }}>
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
      </div>
    </>
  );
}