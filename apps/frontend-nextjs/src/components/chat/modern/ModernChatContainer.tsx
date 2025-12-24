'use client';

import React, { memo, useRef, useState, useEffect } from 'react';
import { type ChatMessage } from '@/types/api';
import { type Persona } from '@/services/api';
import { RAGStats, UIKnowledgeStats as KnowledgeStats } from '@/types/rag-knowledge';
import { modernChatTheme, getCSSVariables } from '@/config/modernTheme';

// OTIMIZAÇÃO CRÍTICA: Componentes especializados para reduzir complexidade
import ModernChatHeader from './ModernChatHeader';
import ChatEmptyState from './ChatEmptyState';
import ChatMessagesArea from './ChatMessagesArea';
import ModernChatInput from './ModernChatInput';
import ExportChatModal from './ExportChatModal';
import MessageBubble from './MessageBubble';
import SmartIndicators from './SmartIndicators';
import AccessibleChatInput from '../accessibility/AccessibleChatInput';
import AccessibleMessageBubble from '../accessibility/AccessibleMessageBubble';
import { useChatAccessibility } from '../accessibility/ChatAccessibilityProvider';
import Skeleton from '@/components/ui/Skeleton';
import ChatErrorMessage from './ChatErrorMessage';
import MessageActions from './MessageActions';
import { type ClassifiedError } from '@/utils/errorClassification';
// KnowledgeStats imported above

interface ModernChatContainerProps {
  // Personas e seleção
  personas: Record<string, Persona>;
  selectedPersona: string | null;
  onPersonaChange: (personaId: string) => void;

  // Mensagens
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;

  // Estados
  isLoading: boolean;
  isMobile: boolean;
  
  // Indicadores IA
  currentSentiment?: {
    category: string;
    confidence: number;
    score: number;
  } | null;
  knowledgeStats?: KnowledgeStats | RAGStats;
  isSearchingKnowledge?: boolean;
  fallbackState?: {
    isActive: boolean;
    type?: string;
  };

  // Handlers para header
  onHistoryToggle?: () => void;
  showHistory?: boolean;

  // Sugestões contextuais
  suggestions?: string[];
  showSuggestions?: boolean;
  onSuggestionClick?: (suggestion: string) => void;

  // Upload de arquivos
  onFileUpload?: (files: FileList) => void;

  // Issue #330: Error handling
  classifiedError?: ClassifiedError | null;
  currentRetryCount?: number;
  isManualRetrying?: boolean;
  onManualRetry?: () => void;

  // Issue #331: Quick actions
  onCopyMessage?: (message: ChatMessage) => void;
  onToggleFavorite?: (message: ChatMessage) => void;
  onRegenerateMessage?: (message: ChatMessage) => void;
  isFavorite?: (messageId: string) => boolean;
}

// OTIMIZAÇÃO CRÍTICA: Componente principal simplificado usando subcomponentes especializados
const ModernChatContainer = memo(function ModernChatContainer({
  personas,
  selectedPersona,
  onPersonaChange,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  isMobile,
  currentSentiment,
  knowledgeStats,
  isSearchingKnowledge,
  fallbackState,
  onHistoryToggle,
  showHistory,
  suggestions,
  showSuggestions,
  onSuggestionClick,
  onFileUpload,
  classifiedError,
  currentRetryCount = 0,
  isManualRetrying = false,
  onManualRetry,
  onCopyMessage,
  onToggleFavorite,
  onRegenerateMessage,
  isFavorite
}: ModernChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Chat accessibility context
  const { announceNewMessage, announceSystemStatus, focusLastMessage } = useChatAccessibility();
  
  // Obter persona atual
  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  // OTIMIZAÇÃO: Aplicar CSS variables do tema de forma simplificada
  useEffect(() => {
    if (containerRef.current) {
      const cssVars = getCSSVariables();
      Object.entries(cssVars).forEach(([key, value]) => {
        containerRef.current?.style.setProperty(key, value);
      });
    }
  }, []);

  // Área de mensagens
  const MessagesArea = () => {
    // Initial loading state: no messages yet AND loading is true
    const isInitialLoading = messages.length === 0 && isLoading;

    return (
    <div
      className="messages-area"
      role="log"
      aria-live="polite"
      aria-label="Histórico da conversa"
      tabIndex={0}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ?
          `${modernChatTheme.spacing.lg} ${modernChatTheme.spacing.md}` :
          `${modernChatTheme.spacing.xl} ${modernChatTheme.spacing.xl}`,
        scrollBehavior: 'smooth',
        scrollPaddingBottom: modernChatTheme.spacing.xl,
        outline: 'none'
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${modernChatTheme.colors.personas.gasnelio.primary}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Issue #329: Skeleton loading states during initial load */}
      {isInitialLoading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Carregando mensagens do chat"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: modernChatTheme.spacing.md
          }}
        >
          <Skeleton variant="list" height="60px" aria-label="Carregando primeira mensagem" />
          <Skeleton variant="list" height="60px" aria-label="Carregando segunda mensagem" />
          <Skeleton variant="list" height="60px" aria-label="Carregando terceira mensagem" />
        </div>
      )}

      {/* Issue #330: Display classified error with manual retry */}
      {classifiedError && onManualRetry && (
        <ChatErrorMessage
          error={classifiedError}
          onRetry={onManualRetry}
          retryCount={currentRetryCount}
          maxRetries={3}
          isRetrying={isManualRetrying}
        />
      )}

      {messages.map((message, index) => {
        // Encontrar a mensagem anterior (pergunta do usuário) para contexto de feedback
        const previousMessage = message.role === 'assistant' && index > 0
          ? messages[index - 1]
          : undefined;

        return (
          <div key={`${message.role}-${message.timestamp}-${index}`} className="message-bubble">
            <AccessibleMessageBubble
              message={message}
              persona={message.role === 'assistant' ? (currentPersona || undefined) : undefined}
              personaId={selectedPersona || 'gasnelio'}
              isUser={message.role === 'user'}
              isMobile={isMobile}
              isLast={index === messages.length - 1}
              previousMessage={previousMessage}
              enableFeedback={true}
              messageIndex={index}
              totalMessages={messages.length}
            />

            {/* Issue #331: Message actions for all messages */}
            {onCopyMessage && onToggleFavorite && isFavorite && (
              <MessageActions
                message={message}
                isFavorite={isFavorite(message.id)}
                onToggleFavorite={() => onToggleFavorite(message)}
                onCopy={() => onCopyMessage(message)}
                onRegenerate={message.role === 'assistant' && onRegenerateMessage ? () => onRegenerateMessage(message) : undefined}
                canRegenerate={message.role === 'assistant' && !!onRegenerateMessage}
              />
            )}
          </div>
        );
      })}
      
      {/* Indicador de digitação integrado */}
      {isLoading && currentPersona && (
        <div
          role="status"
          aria-live="polite"
          aria-label={`${currentPersona.name} está digitando uma resposta`}
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: modernChatTheme.spacing.lg
          }}
        >
          <SmartIndicators
            isTyping={true}
            currentPersona={currentPersona}
            isMobile={isMobile}
          />
        </div>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="modern-chat-container"
      role="main"
      aria-label="Interface de chat com assistentes educacionais"
      id="main-content"
      style={{
        height: '100dvh', // Dynamic viewport height para mobile
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${modernChatTheme.colors.background.primary} 0%, ${modernChatTheme.colors.background.secondary} 100%)`,
        position: 'relative'
      }}
    >
      {/* Header */}
      <ModernChatHeader
        personas={personas}
        selectedPersona={selectedPersona}
        onPersonaChange={onPersonaChange}
        isMobile={isMobile}
        onHistoryToggle={onHistoryToggle}
        onExport={() => setShowExportModal(true)}
        showHistory={showHistory}
        hasMessages={messages.length > 0}
      />

      {/* OTIMIZAÇÃO CRÍTICA: Usar componentes especializados */}
      {!selectedPersona ? (
        <ChatEmptyState
          personas={personas}
          selectedPersona={selectedPersona}
          onPersonaChange={onPersonaChange}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
        />
      ) : (
        <ChatMessagesArea
          messages={messages}
          personas={personas}
          selectedPersona={selectedPersona}
          isLoading={isLoading}
          isMobile={isMobile}
          currentSentiment={currentSentiment}
          knowledgeStats={knowledgeStats}
          isSearchingKnowledge={isSearchingKnowledge}
          fallbackState={fallbackState}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onSuggestionClick={onSuggestionClick}
        />
      )}

      {/* Input Area */}
      <div style={{ position: 'relative' }}>
        <SmartIndicators
          sentiment={currentSentiment}
          knowledge={{
            isSearching: isSearchingKnowledge || false,
            stats: knowledgeStats as KnowledgeStats
          }}
          fallback={fallbackState}
          currentPersona={currentPersona}
          isMobile={isMobile}
        />
        
        <AccessibleChatInput
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onSendMessage}
          persona={currentPersona}
          personaId={selectedPersona || 'gasnelio'}
          isLoading={isLoading}
          isMobile={isMobile}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onSuggestionClick={onSuggestionClick}
          onFileUpload={onFileUpload}
          placeholder={currentPersona ? `Digite sua mensagem para ${currentPersona.name}...` : 'Digite sua mensagem...'}
        />
      </div>

      {/* Export Modal */}
      <ExportChatModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        messages={messages}
        currentPersona={currentPersona}
        isMobile={isMobile}
      />

      {/* Global Styles */}
      <style jsx global>{`
        /* Scrollbar styling */
        .messages-area::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-area::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .messages-area::-webkit-scrollbar-thumb {
          background: ${modernChatTheme.colors.neutral.border};
          border-radius: 3px;
        }
        
        .messages-area::-webkit-scrollbar-thumb:hover {
          background: ${modernChatTheme.colors.neutral.textMuted};
        }

        /* Smooth scrolling */
        .messages-area {
          scroll-behavior: smooth;
        }

        /* Mobile optimizations */
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .modern-chat-container {
            height: 100vh !important;
            height: 100dvh !important;
          }
          
          /* Prevent bounce scrolling on iOS */
          .messages-area {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
          
          /* Ensure touch targets are adequate */
          button, input, [role="button"] {
            min-height: 44px !important;
            min-width: 44px !important;
          }
        }

        /* Focus management */
        .modern-chat-container *:focus {
          outline: 2px solid ${modernChatTheme.colors.personas.gasnelio.primary};
          outline-offset: 2px;
        }

        .modern-chat-container *:focus:not(:focus-visible) {
          outline: none;
        }

        .modern-chat-container *:focus-visible {
          outline: 2px solid ${modernChatTheme.colors.personas.gasnelio.primary};
          outline-offset: 2px;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .modern-chat-container *,
          .modern-chat-container *::before,
          .modern-chat-container *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High contrast support */
        @media (prefers-contrast: high) {
          .modern-chat-container {
            border: 2px solid currentColor;
          }
          
          .modern-chat-container button,
          .modern-chat-container input,
          .modern-chat-container textarea {
            border: 2px solid currentColor !important;
          }
        }

        /* Improve readability for users with dyslexia */
        .modern-chat-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.5;
          letter-spacing: 0.02em;
        }

        /* Dark mode support preparation */
        @media (prefers-color-scheme: dark) {
          /* Future dark mode implementation */
          .modern-chat-container {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
          }
        }

        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
});

export default ModernChatContainer;