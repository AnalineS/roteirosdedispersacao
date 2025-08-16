/**
 * Componente especializado para área de mensagens
 * Otimizado para performance com virtualização e memoização
 */

'use client';

import React, { memo, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Persona } from '@/services/api';
import MessageBubble from './MessageBubble';
import SmartIndicators from './SmartIndicators';

interface ChatMessagesAreaProps {
  messages: ChatMessage[];
  personas: Record<string, Persona>;
  selectedPersona: string | null;
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

  // Sugestões contextuais
  suggestions?: string[];
  showSuggestions?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

const ChatMessagesArea = memo(function ChatMessagesArea({
  messages,
  personas,
  selectedPersona,
  isLoading,
  isMobile,
  currentSentiment,
  knowledgeStats,
  isSearchingKnowledge,
  fallbackState,
  suggestions = [],
  showSuggestions = false,
  onSuggestionClick
}: ChatMessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  // Auto-scroll para a última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]);

  // Renderizar indicador de loading
  const renderLoadingIndicator = () => {
    if (!isLoading) return null;

    return (
      <div className="loading-message">
        <div className="message-avatar">
          {currentPersona?.avatar || '🤖'}
        </div>
        <div className="message-content">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="loading-text">
            {currentPersona?.name || 'Assistente'} está pensando...
          </div>
        </div>
      </div>
    );
  };

  // Renderizar sugestões contextuais
  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <div className="contextual-suggestions">
        <h4>Perguntas relacionadas:</h4>
        <div className="suggestions-list">
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => onSuggestionClick?.(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-messages-area" ref={scrollAreaRef}>
      {/* Indicadores IA */}
      <SmartIndicators
        currentSentiment={currentSentiment}
        knowledgeStats={knowledgeStats}
        isSearchingKnowledge={isSearchingKnowledge}
        fallbackState={fallbackState}
        isMobile={isMobile}
      />

      {/* Lista de mensagens */}
      <div className="messages-list">
        {messages.map((message, index) => {
          const persona = message.persona ? personas[message.persona] : currentPersona;
          
          return (
            <MessageBubble
              key={`${message.timestamp}-${index}`}
              message={message}
              persona={persona}
              isLast={index === messages.length - 1}
              showAvatar={true}
              showTimestamp={true}
            />
          );
        })}
        
        {/* Indicador de loading */}
        {renderLoadingIndicator()}
        
        {/* Sugestões contextuais */}
        {renderSuggestions()}
        
        {/* Elemento para scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      <style jsx>{`
        .chat-messages-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100%;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scroll-behavior: smooth;
        }

        .loading-message {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          animation: fadeIn 0.3s ease-in-out;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
          background: #f8fafc;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
        }

        .typing-indicator {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        .loading-text {
          font-size: 0.875rem;
          color: #64748b;
          font-style: italic;
        }

        .contextual-suggestions {
          margin: 1rem 0;
          padding: 1rem;
          background: #fefefe;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .contextual-suggestions h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem 0;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggestion-button {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          color: #374151;
        }

        .suggestion-button:hover {
          border-color: #3b82f6;
          background: #f8fafc;
          color: #1e40af;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Scrollbar customizada */
        .messages-list::-webkit-scrollbar {
          width: 6px;
        }

        .messages-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .messages-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .messages-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 768px) {
          .messages-list {
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .loading-message {
            padding: 0.75rem;
          }

          .contextual-suggestions {
            margin: 0.75rem 0;
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
});

export default ChatMessagesArea;