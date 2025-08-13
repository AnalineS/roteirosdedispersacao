'use client';

import { useState } from 'react';
import { ChatMessage, Persona } from '@/services/api';
import PersonaAvatar from '../PersonaAvatar';
import FeedbackWidget from '../FeedbackWidget';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import { useFeedback, type FeedbackData } from '@/hooks/useFeedback';

interface MessageBubbleProps {
  message: ChatMessage;
  persona?: Persona;
  personaId?: string;
  isUser?: boolean;
  isMobile?: boolean;
  isLast?: boolean;
  previousMessage?: ChatMessage; // Para obter a pergunta do usuário
  enableFeedback?: boolean;
}

const MessageMeta = ({ timestamp }: { timestamp: number }) => {
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    
    // Se for hoje, mostrar apenas hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Se for ontem
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Outros dias
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <time 
      dateTime={new Date(timestamp).toISOString()}
      style={{
        fontSize: modernChatTheme.typography.meta.fontSize,
        opacity: 0.7,
        fontWeight: '400'
      }}
      aria-label={`Mensagem enviada em ${formatTime(timestamp)}`}
    >
      {formatTime(timestamp)}
    </time>
  );
};

const FallbackIndicator = ({ metadata }: { metadata: any }) => {
  if (!metadata?.isFallback) return null;

  const getFallbackInfo = (source: string) => {
    switch (source) {
      case 'cache': return { icon: '🔄', label: 'Cache Local' };
      case 'local_knowledge': return { icon: '📚', label: 'Base Local' };
      case 'emergency': return { icon: '🚨', label: 'Emergência' };
      default: return { icon: '🛡️', label: 'Fallback' };
    }
  };

  const fallbackInfo = getFallbackInfo(metadata.fallbackSource);

  return (
    <div
      style={{
        marginTop: modernChatTheme.spacing.sm,
        padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
        backgroundcolor: '#F59E0B' + '15',
        border: `1px solid ${'#F59E0B'}40`,
        borderRadius: modernChatTheme.borderRadius.sm,
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: '#F59E0B',
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.xs
      }}
    >
      <span>{fallbackInfo.icon}</span>
      <span>
        {fallbackInfo.label}
        {metadata.confidence && (
          <> - {Math.round(metadata.confidence * 100)}%</>
        )}
      </span>
    </div>
  );
};

export default function MessageBubble({ 
  message, 
  persona, 
  personaId = 'gasnelio',
  isUser = false, 
  isMobile = false,
  isLast = false,
  previousMessage,
  enableFeedback = true
}: MessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation delay for entrance
  useState(() => {
    setTimeout(() => setIsVisible(true), 50);
  });

  const colors = persona ? getPersonaColors(personaId) : null;

  // Feedback handling
  const { submitFeedback, isSubmitting } = useFeedback({
    onSuccess: (response) => {
      console.log('Feedback enviado com sucesso:', response);
    },
    onError: (error) => {
      console.error('Erro ao enviar feedback:', error);
    },
    enableOfflineQueue: true
  });

  const handleFeedbackSubmit = async (feedbackData: FeedbackData) => {
    try {
      await submitFeedback(feedbackData);
    } catch (error) {
      // Erro já tratado no hook
      console.warn('Feedback submission failed:', error);
    }
  };

  // Determinar se deve mostrar feedback
  const shouldShowFeedback = !isUser && enableFeedback && persona && previousMessage;
  
  // Gerar ID único para a mensagem se não existir
  const messageId = message.timestamp ? `msg_${message.timestamp}` : `msg_${Date.now()}`;

  return (
    <div
      className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}
      role="group"
      aria-labelledby={`${messageId}-sender`}
      aria-describedby={`${messageId}-content`}
      style={{
        display: 'flex',
        gap: modernChatTheme.spacing.md,
        marginBottom: isLast ? modernChatTheme.spacing.lg : modernChatTheme.spacing.md,
        flexDirection: isUser ? 'row-reverse' : 'row',
        justifyContent: 'flex-start',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: modernChatTheme.transitions.spring,
        maxWidth: '100%'
      }}
    >
      {/* Avatar - only for assistant messages */}
      {!isUser && persona && (
        <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
          <PersonaAvatar 
            persona={persona}
            personaId={personaId}
            size="small"
            className="message-avatar"
            style={{
              marginBottom: '4px'
            }}
          />
        </div>
      )}
      
      {/* Message Content */}
      <article 
        className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}
        role="article"
        aria-label={`Mensagem de ${isUser ? 'usuário' : persona?.name || 'assistente'}`}
        tabIndex={0}
        onKeyDown={(e) => {
          // Allow copying message content with keyboard
          if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
            navigator.clipboard?.writeText(message.content);
          }
        }}
        style={{
          maxWidth: isMobile ? '85%' : 'min(80%, 600px)',
          padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
          borderRadius: modernChatTheme.borderRadius.bubble,
          position: 'relative',
          wordWrap: 'break-word',
          lineHeight: modernChatTheme.typography.message.lineHeight,
          fontSize: modernChatTheme.typography.message.fontSize,
          outline: 'none',
          
          // User message styling
          ...(isUser ? {
            background: colors?.primary || modernChatTheme.colors.personas.gasnelio.primary,
            color: 'white',
            borderBottomRightRadius: modernChatTheme.borderRadius.sm,
            boxShadow: modernChatTheme.shadows.moderate
          } : {
            // Assistant message styling
            background: colors?.bubble || modernChatTheme.colors.background.secondary,
            color: modernChatTheme.colors.neutral.text,
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderBottomLeftRadius: modernChatTheme.borderRadius.sm,
            boxShadow: modernChatTheme.shadows.subtle
          }),
          
          // Hover effect for assistant messages
          transition: modernChatTheme.transitions.normal
        }}
        onMouseEnter={(e) => {
          if (!isUser) {
            e.currentTarget.style.boxShadow = modernChatTheme.shadows.moderate;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isUser) {
            e.currentTarget.style.boxShadow = modernChatTheme.shadows.subtle;
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Assistant Message Header */}
        {!isUser && persona && (
          <div 
            className="message-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.persona.fontSize
            }}
          >
            <span 
              className="persona-name"
              style={{
                fontWeight: modernChatTheme.typography.persona.fontWeight,
                color: colors?.primary || modernChatTheme.colors.personas.gasnelio.primary
              }}
            >
              {persona.name}
            </span>
            <MessageMeta timestamp={message.timestamp} />
          </div>
        )}
        
        {/* Message Content */}
        <div 
          className="message-content"
          id={`${messageId}-content`}
          style={{
            whiteSpace: 'pre-wrap',
            margin: 0
          }}
          aria-label={isUser ? 'Sua mensagem' : `Resposta de ${persona?.name || 'assistente'}`}
        >
          {message.content}
        </div>
        
        {/* Fallback Indicator */}
        <FallbackIndicator metadata={message.metadata} />
        
        {/* User message timestamp */}
        {isUser && (
          <div 
            style={{
              marginTop: modernChatTheme.spacing.xs,
              textAlign: 'right',
              opacity: 0.8
            }}
          >
            <MessageMeta timestamp={message.timestamp} />
          </div>
        )}

        {/* Feedback Widget - Only for assistant messages */}
        {shouldShowFeedback && (
          <FeedbackWidget
            messageId={messageId}
            personaId={personaId}
            question={previousMessage.content}
            response={message.content}
            onFeedbackSubmit={handleFeedbackSubmit}
            isVisible={!isSubmitting}
          />
        )}
        {/* Screen reader helper for user identification */}
        {isUser && (
          <span className="sr-only" id={`${messageId}-sender`}>Você disse:</span>
        )}
        
        {/* Copy to clipboard hint for screen readers */}
        <span className="sr-only">
          Pressione Ctrl+C para copiar esta mensagem. Use Tab para navegar para o próximo elemento.
        </span>
      </article>
    </div>
  );
}
