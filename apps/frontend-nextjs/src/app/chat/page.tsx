'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import PersonaAvatar from '@/components/chat/PersonaAvatar';
import PersonaToggle from '@/components/chat/PersonaToggle';

// Lazy load dos componentes mais pesados
const ConversationExporter = lazy(() => import('@/components/chat/ConversationExporter'));
const ContextualSuggestions = lazy(() => import('@/components/chat/ContextualSuggestions'));
const ConversationHistory = lazy(() => import('@/components/chat/ConversationHistory'));
const RoutingIndicator = lazy(() => import('@/components/chat/RoutingIndicator'));
const SentimentIndicator = lazy(() => import('@/components/chat/SentimentIndicator'));
const KnowledgeIndicator = lazy(() => import('@/components/chat/KnowledgeIndicator'));
const FallbackIndicator = lazy(() => import('@/components/chat/FallbackIndicator'));
const SystemHealthWarning = lazy(() => import('@/components/chat/FallbackIndicator').then(module => ({ default: module.SystemHealthWarning })));
import { usePersonas } from '@/hooks/usePersonas';
import { useChat } from '@/hooks/useChat';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/config/theme';
import { ChatComponentLoader, SidebarLoader, IndicatorLoader } from '@/components/LoadingSpinner';
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
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPersonaTyping, setIsPersonaTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
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
    if (personas && Object.keys(personas).length > 0) {
      let selectedPersonaId = null;
      
      // Prioridade 1: Persona do perfil do usuário
      if (profile && profile.selectedPersona && personas[profile.selectedPersona]) {
        selectedPersonaId = profile.selectedPersona;
      }
      // Prioridade 2: Recomendação baseada no perfil
      else if (profile) {
        selectedPersonaId = getRecommendedPersona();
      }
      // Prioridade 3: localStorage (compatibilidade com versão anterior)
      else if (typeof window !== 'undefined') {
        const storedPersona = localStorage.getItem('selectedPersona');
        if (storedPersona && personas[storedPersona]) {
          selectedPersonaId = storedPersona;
        }
      }
      // Prioridade 4: Padrão empático
      else {
        selectedPersonaId = 'ga';
      }

      if (selectedPersonaId && selectedPersonaId !== selectedPersona) {
        setSelectedPersona(selectedPersonaId);
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
  }, [personas, profile, selectedPersona, currentConversationId, createConversation, getRecommendedPersona, updateProfile]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

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
      setShowSuggestions(false);
      setIsPersonaTyping(true);
      
      try {
        await sendMessageWithHistory(messageText, selectedPersona);
      } finally {
        setIsPersonaTyping(false);
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
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p>Carregando chat...</p>
        </div>
      </div>
    );
  }

  if (personasError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⚠️</div>
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
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        marginLeft: showHistory && !isMobile ? '320px' : '0',
        transition: 'margin-left 0.3s ease'
      }} className="main-content">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: 'white',
        padding: isMobile ? '12px 15px' : '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minHeight: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
            ←
          </Link>
          {currentPersona && selectedPersona && (
            <>
              <PersonaAvatar 
                persona={currentPersona}
                personaId={selectedPersona}
                size="medium"
                showStatus={true}
                isTyping={isPersonaTyping}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '1rem' : '1.2rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentPersona.name}
                </h2>
                {!isMobile && (
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                    {currentPersona.personality}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Controls: Persona Toggle + Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Suspense fallback={<ChatComponentLoader message="Exportar" />}>
            <ConversationExporter 
              messages={currentMessages}
              currentPersona={currentPersona}
              isMobile={isMobile}
            />
          </Suspense>
          <PersonaToggle
            personas={personas}
            selectedPersona={selectedPersona}
            onPersonaChange={handlePersonaChange}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '15px 10px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '12px' : '15px'
      }}>
        {/* Aviso de sistema degradado/crítico */}
        <Suspense fallback={null}>
          <SystemHealthWarning 
            systemHealth={fallbackState.systemHealth}
            onResetFailures={resetSystemFailures}
          />
        </Suspense>
        
        {!selectedPersona && !shouldShowRouting() && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '12px',
            margin: '20px'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              {pendingQuestion 
                ? 'Analisando sua pergunta para encontrar o melhor especialista...'
                : 'Digite sua pergunta ou selecione um assistente no menu acima'
              }
            </p>
          </div>
        )}
        
        {/* Indicador de Roteamento Inteligente */}
        <Suspense fallback={<ChatComponentLoader message="Analisando..." />}>
          {(() => {
            const recommendedPersona = getRoutingRecommendedPersona();
            
            return shouldShowRouting() && currentAnalysis && recommendedPersona && (
              <RoutingIndicator
                analysis={currentAnalysis}
                recommendedPersona={recommendedPersona}
                currentPersonaId={selectedPersona}
                personas={personas}
                onAcceptRouting={handleAcceptRouting}
                onRejectRouting={handleRejectRouting}
                onShowExplanation={handleShowExplanation}
                isMobile={isMobile}
              />
            );
          })()}
        </Suspense>

        {currentMessages.map((message) => (
          <div
            key={`${message.role}-${message.timestamp}`}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                maxWidth: isMobile ? '85%' : '70%',
                padding: isMobile ? '10px 14px' : '12px 16px',
                borderRadius: '18px',
                background: message.role === 'user' 
                  ? theme.colors.primary[500] 
                  : 'white',
                color: message.role === 'user' ? 'white' : '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}
            >
              {message.role === 'assistant' && currentPersona && selectedPersona && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <PersonaAvatar 
                    persona={currentPersona}
                    personaId={selectedPersona}
                    size="small"
                  />
                  <span style={{
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    color: theme.colors.primary[500]
                  }}>
                    {currentPersona.name}
                  </span>
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </div>
              
              {/* Indicar se é resposta de fallback */}
              {message.metadata?.isFallback && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  backgroundColor: theme.colors.warning[50],
                  border: `1px solid ${theme.colors.warning[200]}`,
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: theme.colors.warning[700]
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🛡️</span>
                    <span>
                      Resposta de fallback ({
                        message.metadata.fallbackSource === 'cache' ? 'Cache Local' :
                        message.metadata.fallbackSource === 'local_knowledge' ? 'Base Local' :
                        message.metadata.fallbackSource === 'emergency' ? 'Sistema de Emergência' :
                        'Genérico'
                      })
                    </span>
                    {message.metadata.confidence && (
                      <span style={{ opacity: 0.7 }}>
                        - {Math.round(message.metadata.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  {message.metadata.suggestion && (
                    <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                      {message.metadata.suggestion}
                    </div>
                  )}
                  {message.metadata.emergency_contact && (
                    <div style={{ 
                      marginTop: '4px', 
                      fontWeight: 'bold',
                      color: theme.colors.danger[600]
                    }}>
                      {message.metadata.emergency_contact}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatLoading && currentPersona && selectedPersona && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '18px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <PersonaAvatar 
                persona={currentPersona}
                personaId={selectedPersona}
                size="small"
                isTyping={true}
              />
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.colors.educational.success, animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.colors.educational.success, animation: 'pulse 1.5s infinite 0.5s' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.colors.educational.success, animation: 'pulse 1.5s infinite 1s' }}></div>
                <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#666' }}>
                  {currentPersona.name} está pensando...
                </span>
              </div>
            </div>
          </div>
        )}

        {chatError && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#ffebee',
            color: '#c62828',
            textAlign: 'center',
            margin: '10px 0'
          }}>
            Erro: {chatError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        position: 'relative',
        padding: isMobile ? '15px 10px' : '20px',
        background: 'white',
        borderTop: '1px solid #eee'
      }}>
        {/* Indicadores de IA */}
        {(currentSentiment || lastSearchResult || isSearchingKnowledge || fallbackState.isActive || fallbackState.result) && selectedPersona && (
          <div style={{ 
            position: 'absolute', 
            top: '-50px', 
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            {/* Indicador de Fallback */}
            <Suspense fallback={<IndicatorLoader />}>
              <FallbackIndicator
                isActive={fallbackState.isActive}
                result={fallbackState.result}
                systemHealth={fallbackState.systemHealth}
                attempts={fallbackState.attempts}
                showDetails={!isMobile}
                onRetry={() => {
                  // Reenviar última mensagem se possível
                  const lastUserMessage = currentMessages
                    .slice()
                    .reverse()
                    .find(msg => msg.role === 'user');
                  if (lastUserMessage && selectedPersona) {
                    sendMessage(lastUserMessage.content, selectedPersona);
                  }
                }}
                onDismiss={resetFallback}
              />
            </Suspense>
            
            {/* Indicador de Conhecimento */}
            <Suspense fallback={<IndicatorLoader />}>
              <KnowledgeIndicator
                searchResult={lastSearchResult}
                stats={knowledgeStats}
                isSearching={isSearchingKnowledge}
                showDetails={!isMobile}
              />
            </Suspense>
            
            {/* Indicador de Sentimento */}
            {currentSentiment && (
              <Suspense fallback={<IndicatorLoader />}>
                <SentimentIndicator 
                  sentiment={currentSentiment} 
                  showDetails={!isMobile} 
                  size={isMobile ? 'small' : 'medium'}
                />
              </Suspense>
            )}
            
            {/* Sugestão de troca de persona baseada no sentimento */}
            {personaSwitchSuggestion && personas[personaSwitchSuggestion] && (
              <div style={{
                padding: '8px 12px',
                background: theme.colors.warning[50],
                color: theme.colors.warning[700],
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `1px solid ${theme.colors.warning[200]}`,
                maxWidth: isMobile ? '200px' : 'none'
              }}
              onClick={() => handlePersonaChange(personaSwitchSuggestion)}
              >
                <span>💡</span>
                <span>
                  Sugestão: {personas[personaSwitchSuggestion].name} pode ajudar melhor
                </span>
              </div>
            )}
          </div>
        )}
        {/* Contextual Suggestions */}
        {selectedPersona && currentPersona && (
          <Suspense fallback={null}>
            <ContextualSuggestions
              persona={currentPersona}
              personaId={selectedPersona}
              currentInput={inputValue}
              onSuggestionClick={(suggestion) => {
                setInputValue(suggestion);
                inputRef.current?.focus();
              }}
              isVisible={showSuggestions && (inputValue.length === 0 || inputValue.length > 2)}
            />
          </Suspense>
        )}
        
        <form
          onSubmit={handleSendMessage}
          style={{
            display: 'flex',
            gap: isMobile ? '8px' : '10px',
            alignItems: 'flex-end'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={
              selectedPersona 
                ? `Pergunte ao ${currentPersona?.name}...` 
                : isAnalyzing
                  ? "Analisando pergunta..."
                  : "Digite sua pergunta aqui..."
            }
            disabled={chatLoading}
            style={{
              flex: 1,
              padding: isMobile ? '12px 14px' : '12px 16px',
              borderRadius: '25px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '16px' : '1rem', // 16px previne zoom no iOS
              outline: 'none',
              background: selectedPersona ? 'white' : '#f5f5f5',
              minHeight: isMobile ? '44px' : 'auto' // Tamanho mínimo para touch
            }}
          />
          <button
            type="submit"
            disabled={!selectedPersona || !inputValue.trim() || chatLoading}
            style={{
              padding: isMobile ? '12px 18px' : '12px 20px',
              borderRadius: '25px',
              border: 'none',
              background: (!selectedPersona || !inputValue.trim() || chatLoading) ? '#ccc' : theme.colors.primary[500],
              color: 'white',
              cursor: (!selectedPersona || !inputValue.trim() || chatLoading) ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '1.1rem' : '1rem',
              fontWeight: 'bold',
              minHeight: isMobile ? '44px' : 'auto',
              minWidth: isMobile ? '44px' : 'auto'
            }}
          >
            {chatLoading ? '⏳' : '➤'}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
    </>
  );
}