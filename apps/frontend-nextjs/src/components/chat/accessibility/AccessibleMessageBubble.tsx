'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChatMessage, Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import { useChatAccessibility } from './ChatAccessibilityProvider';
import PersonaAvatar from '../PersonaAvatar';
import FeedbackWidget from '../FeedbackWidget';

interface AccessibleMessageBubbleProps {
  message: ChatMessage;
  persona?: Persona;
  personaId?: string;
  isUser?: boolean;
  isMobile?: boolean;
  isLast?: boolean;
  previousMessage?: ChatMessage;
  enableFeedback?: boolean;
  messageIndex: number;
  totalMessages: number;
}

const AccessibleMessageBubble: React.FC<AccessibleMessageBubbleProps> = ({
  message,
  persona,
  personaId = 'gasnelio',
  isUser = false,
  isMobile = false,
  isLast = false,
  previousMessage,
  enableFeedback = true,
  messageIndex,
  totalMessages
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  const { announceMessage } = useChatAccessibility();
  
  const colors = getPersonaColors(personaId);
  const speakerName = isUser ? 'Você' : (persona?.name || 'Assistente');

  // Detect high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Format timestamp for screen readers
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Generate accessible message description
  const getMessageDescription = () => {
    const parts = [
      `Mensagem ${messageIndex + 1} de ${totalMessages}`,
      `de ${speakerName}`,
      `enviada ${formatTimestamp(message.timestamp)}`
    ];
    
    if (message.metadata?.confidence) {
      parts.push(`com ${Math.round(message.metadata.confidence * 100)}% de confiança`);
    }
    
    if (message.metadata?.source) {
      parts.push(`baseada em ${message.metadata.source}`);
    }
    
    return parts.join(', ');
  };

  // Handle text selection and copying
  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      announceMessage(`Texto selecionado: ${selection.toString().substring(0, 100)}${selection.toString().length > 100 ? '...' : ''}`);
    }
  }, [announceMessage]);

  // Handle message actions
  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      announceMessage('Mensagem copiada para área de transferência');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      announceMessage('Mensagem copiada para área de transferência');
    }
  }, [message.content, announceMessage]);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
    announceMessage(isExpanded ? 'Mensagem recolhida' : 'Mensagem expandida');
  }, [isExpanded, announceMessage]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'c':
      case 'C':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCopyMessage();
        }
        break;
      case 'Enter':
      case ' ':
        if (e.currentTarget === messageRef.current) {
          e.preventDefault();
          handleExpandToggle();
        }
        break;
      case 'f':
      case 'F':
        if (!isUser && enableFeedback) {
          e.preventDefault();
          setShowFeedback(!showFeedback);
          announceMessage(showFeedback ? 'Feedback fechado' : 'Feedback aberto');
        }
        break;
    }
  }, [handleCopyMessage, handleExpandToggle, isUser, enableFeedback, showFeedback, announceMessage]);

  // Message content processing for accessibility
  const processMessageContent = (content: string) => {
    // Split long messages for better readability
    if (content.length > 500 && !isExpanded) {
      return content.substring(0, 500) + '...';
    }
    return content;
  };

  const displayContent = processMessageContent(message.content);
  const hasMore = message.content.length > 500;

  // Determine message styling
  const getMessageStyle = () => {
    const baseStyle = {
      background: isUser 
        ? (isHighContrast ? '#000000' : colors.primary)
        : (isHighContrast ? '#ffffff' : 'white'),
      color: isUser 
        ? (isHighContrast ? '#ffffff' : 'white')
        : (isHighContrast ? '#000000' : modernChatTheme.colors.neutral.textPrimary),
      border: isHighContrast 
        ? `3px solid ${isUser ? '#ffffff' : '#000000'}`
        : `1px solid ${isUser ? colors.primary : modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.md,
      padding: modernChatTheme.spacing.md,
      maxWidth: isMobile ? '85%' : '70%',
      wordBreak: 'break-word' as const,
      lineHeight: '1.6',
      fontSize: modernChatTheme.typography.body.fontSize,
      boxShadow: isHighContrast 
        ? 'none'
        : modernChatTheme.shadows.subtle
    };

    return baseStyle;
  };

  return (
    <div
      className={`message-container ${isUser ? 'user' : 'assistant'} ${isLast ? 'last' : ''}`}
      role="group"
      aria-labelledby={`message-${messageIndex}-label`}
      aria-describedby={`message-${messageIndex}-meta`}
    >
      <div className="message-wrapper">
        {/* Avatar for assistant messages */}
        {!isUser && persona && (
          <div className="avatar-container">
            <PersonaAvatar
              persona={persona}
              size={isMobile ? 'sm' : 'md'}
              showStatus={false}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Main message content */}
        <div
          ref={messageRef}
          className="message-bubble"
          style={getMessageStyle()}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseUp={handleTextSelect}
          role="article"
          aria-label={`Mensagem de ${speakerName}`}
        >
          {/* Screen reader label */}
          <div id={`message-${messageIndex}-label`} className="sr-only">
            {getMessageDescription()}
          </div>

          {/* Message header for screen readers */}
          <div className="message-header">
            <span className="speaker-name" aria-hidden="true">
              {speakerName}
            </span>
            <time 
              className="timestamp"
              dateTime={new Date(message.timestamp).toISOString()}
              aria-label={`Enviada ${formatTimestamp(message.timestamp)}`}
            >
              {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </time>
          </div>

          {/* Message content */}
          <div 
            className="message-content"
            role="main"
            aria-live={isLast && !isUser ? 'polite' : 'off'}
          >
            {displayContent}
          </div>

          {/* Expand/collapse for long messages */}
          {hasMore && (
            <button
              className="expand-button"
              onClick={handleExpandToggle}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Recolher mensagem' : 'Expandir mensagem completa'}
            >
              {isExpanded ? 'Mostrar menos' : 'Mostrar mais'}
            </button>
          )}

          {/* Message metadata */}
          <div id={`message-${messageIndex}-meta`} className="message-metadata">
            {message.metadata?.confidence && (
              <span className="confidence-indicator" aria-label={`Confiança da resposta: ${Math.round(message.metadata.confidence * 100)} porcento`}>
                {Math.round(message.metadata.confidence * 100)}% confiança
              </span>
            )}
            
            {message.metadata?.source && (
              <span className="source-indicator" aria-label={`Fonte da informação: ${message.metadata.source}`}>
                📚 {message.metadata.source}
              </span>
            )}

            {message.metadata?.isFallback && (
              <span className="fallback-indicator" aria-label="Resposta de segurança ativada">
                🛡️ Fallback
              </span>
            )}
          </div>

          {/* Message actions */}
          <div className="message-actions" role="group" aria-label="Ações da mensagem">
            <button
              className="action-button copy"
              onClick={handleCopyMessage}
              aria-label={`Copiar mensagem de ${speakerName}`}
              title="Copiar mensagem (Ctrl+C)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback widget for assistant messages */}
      {!isUser && enableFeedback && showFeedback && (
        <div className="feedback-container" role="complementary" aria-label="Feedback da mensagem">
          <FeedbackWidget
            message={message}
            previousMessage={previousMessage}
            persona={persona}
            onFeedbackSubmitted={() => {
              setShowFeedback(false);
              announceMessage('Feedback enviado com sucesso');
            }}
            compact={isMobile}
          />
        </div>
      )}

      <style jsx>{`
        .message-container {
          margin-bottom: ${modernChatTheme.spacing.lg};
          scroll-margin-top: ${modernChatTheme.spacing.xl};
        }

        .message-container.last {
          margin-bottom: 0;
        }

        .message-wrapper {
          display: flex;
          align-items: flex-start;
          gap: ${modernChatTheme.spacing.md};
        }

        .message-container.user .message-wrapper {
          flex-direction: row-reverse;
          justify-content: flex-start;
        }

        .avatar-container {
          flex-shrink: 0;
        }

        .message-bubble {
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .message-bubble:hover {
          transform: translateY(-1px);
          box-shadow: ${isHighContrast ? 'none' : modernChatTheme.shadows.medium};
        }

        .message-bubble:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }

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

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${modernChatTheme.spacing.sm};
          opacity: 0.8;
        }

        .speaker-name {
          font-weight: 600;
          font-size: ${modernChatTheme.typography.meta.fontSize};
        }

        .timestamp {
          font-size: ${modernChatTheme.typography.meta.fontSize};
          opacity: 0.7;
        }

        .message-content {
          margin-bottom: ${modernChatTheme.spacing.sm};
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .expand-button {
          background: none;
          border: none;
          color: inherit;
          text-decoration: underline;
          cursor: pointer;
          font-size: ${modernChatTheme.typography.meta.fontSize};
          opacity: 0.8;
          padding: ${modernChatTheme.spacing.xs} 0;
        }

        .expand-button:hover {
          opacity: 1;
        }

        .expand-button:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 1px;
        }

        .message-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: ${modernChatTheme.spacing.sm};
          margin-top: ${modernChatTheme.spacing.sm};
          padding-top: ${modernChatTheme.spacing.sm};
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          font-size: ${modernChatTheme.typography.meta.fontSize};
        }

        .message-container.user .message-metadata {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .confidence-indicator,
        .source-indicator,
        .fallback-indicator {
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.1);
          font-size: 11px;
        }

        .message-container.user .confidence-indicator,
        .message-container.user .source-indicator,
        .message-container.user .fallback-indicator {
          background: rgba(255, 255, 255, 0.2);
        }

        .message-actions {
          position: absolute;
          top: ${modernChatTheme.spacing.xs};
          right: ${modernChatTheme.spacing.xs};
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .message-bubble:hover .message-actions,
        .message-bubble:focus .message-actions {
          opacity: 1;
        }

        .action-button {
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: inherit;
        }

        .action-button:hover {
          background: rgba(0, 0, 0, 0.2);
          transform: scale(1.1);
        }

        .action-button:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 1px;
        }

        .message-container.user .action-button {
          background: rgba(255, 255, 255, 0.2);
        }

        .message-container.user .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .feedback-container {
          margin-top: ${modernChatTheme.spacing.md};
          margin-left: ${isMobile ? '0' : '60px'};
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .message-bubble:hover {
            transform: none;
            box-shadow: none;
          }

          .action-button {
            background: currentColor;
            color: white;
          }

          .message-container.user .action-button {
            background: white;
            color: black;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .message-bubble,
          .action-button,
          .expand-button {
            transition: none !important;
          }

          .message-bubble:hover {
            transform: none !important;
          }

          .action-button:hover {
            transform: none !important;
          }
        }

        /* Mobile optimizations */
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .message-wrapper {
            gap: ${modernChatTheme.spacing.sm};
          }

          .message-actions {
            position: static;
            opacity: 1;
            margin-top: ${modernChatTheme.spacing.sm};
          }

          .feedback-container {
            margin-left: 0;
          }
        }

        /* Print styles */
        @media print {
          .message-actions {
            display: none;
          }

          .feedback-container {
            display: none;
          }

          .message-bubble {
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AccessibleMessageBubble;