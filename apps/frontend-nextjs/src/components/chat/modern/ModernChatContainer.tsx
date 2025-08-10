'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage, Persona } from '@/services/api';
import { modernChatTheme, getCSSVariables } from '@/config/modernTheme';
import ModernChatHeader from './ModernChatHeader';
import MessageBubble from './MessageBubble';
import SmartIndicators from './SmartIndicators';
import ModernChatInput from './ModernChatInput';
import ExportChatModal from './ExportChatModal';
import { ChatIcon } from '@/components/icons';

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
  knowledgeStats?: any;
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
}

export default function ModernChatContainer({
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
  onSuggestionClick
}: ModernChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages]);

  // Aplicar CSS variables do tema
  useEffect(() => {
    if (containerRef.current) {
      const cssVars = getCSSVariables();
      Object.entries(cssVars).forEach(([key, value]) => {
        containerRef.current?.style.setProperty(key, value);
      });
    }
  }, []);

  // Placeholder state quando não há persona selecionada
  const EmptyState = () => (
    <div
      role="status"
      aria-live="polite"
      aria-label="Seleção de assistente necessária"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: modernChatTheme.spacing.xl,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: modernChatTheme.spacing.xl,
          borderRadius: modernChatTheme.borderRadius.lg,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${modernChatTheme.colors.neutral.border}`
        }}
      >
        <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
          <ChatIcon size={48} color={modernChatTheme.colors.neutral.textMuted} />
        </div>
        <h3
          style={{
            margin: `0 0 ${modernChatTheme.spacing.md}`,
            color: modernChatTheme.colors.neutral.text,
            fontSize: modernChatTheme.typography.persona.fontSize,
            fontWeight: modernChatTheme.typography.persona.fontWeight
          }}
        >
          Selecione um Assistente
        </h3>
        <p
          style={{
            margin: 0,
            color: modernChatTheme.colors.neutral.textMuted,
            fontSize: modernChatTheme.typography.meta.fontSize,
            lineHeight: '1.5'
          }}
        >
          Escolha Dr. Gasnelio para suporte técnico ou Gá para uma abordagem mais empática
        </p>
      </div>
    </div>
  );

  // Área de mensagens
  const MessagesArea = () => (
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
      {messages.map((message, index) => {
        // Encontrar a mensagem anterior (pergunta do usuário) para contexto de feedback
        const previousMessage = message.role === 'assistant' && index > 0 
          ? messages[index - 1] 
          : undefined;

        return (
          <MessageBubble
            key={`${message.role}-${message.timestamp}-${index}`}
            message={message}
            persona={message.role === 'assistant' ? (currentPersona || undefined) : undefined}
            personaId={selectedPersona || 'gasnelio'}
            isUser={message.role === 'user'}
            isMobile={isMobile}
            isLast={index === messages.length - 1}
            previousMessage={previousMessage}
            enableFeedback={true}
          />
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

      {/* Content Area */}
      {!selectedPersona ? (
        <EmptyState />
      ) : (
        <MessagesArea />
      )}

      {/* Input Area */}
      <div style={{ position: 'relative' }}>
        <SmartIndicators
          sentiment={currentSentiment}
          knowledge={{
            isSearching: isSearchingKnowledge || false,
            stats: knowledgeStats
          }}
          fallback={fallbackState}
          currentPersona={currentPersona}
          isMobile={isMobile}
        />
        
        <ModernChatInput
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
          onHistoryToggle={onHistoryToggle}
          showHistory={showHistory}
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
}