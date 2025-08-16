'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { modernChatTheme } from '@/config/modernTheme';
import { validateFeedbackData, feedbackRateLimiter, generateSessionId } from '@/utils/securityUtils';
import { useGoogleAnalytics } from '@/components/GoogleAnalytics';

interface FeedbackWidgetProps {
  messageId: string;
  personaId: string;
  question: string;
  response: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
  isVisible?: boolean;
}

interface FeedbackData {
  messageId: string;
  personaId: string;
  question: string;
  response: string;
  rating: number;
  comments?: string;
  timestamp: number;
  metadata?: {
    hasSensitiveData: boolean;
    sanitizationApplied: boolean;
    clientTimestamp: number;
  };
}

interface PersonaData {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  response_style: string;
  target_audience: string;
}

const ThumbsUpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 10v12"/>
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h3.73a2 2 0 0 1 1.95 2.41l-.47 2.35"/>
  </svg>
);

const ThumbsDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 14V2"/>
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h-3.73a2 2 0 0 1-1.95-2.41l.47-2.35"/>
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export default function FeedbackWidget({
  messageId,
  personaId,
  question,
  response,
  onFeedbackSubmit,
  isVisible = true
}: FeedbackWidgetProps) {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'submitting' | 'submitted' | 'error' | 'loading'>('loading');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState('');
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  
  const { trackFeedback, trackUserInteraction, trackError } = useGoogleAnalytics();
  const sessionId = useMemo(() => generateSessionId(), []);

  // Load persona data on component mount
  useEffect(() => {
    const loadPersonaData = async () => {
      try {
        const response = await fetch('/api/personas');
        const personas = await response.json();
        const persona = personas.find((p: PersonaData) => p.id === personaId);
        setPersonaData(persona || null);
        setFeedbackState('idle');
      } catch (error) {
        console.error('Error loading persona data:', error);
        setFeedbackState('idle'); // Fallback to idle even if persona load fails
      }
    };

    loadPersonaData();
  }, [personaId]);

  // All hooks must be at the top before any conditional returns
  const handleQuickFeedback = useCallback(async (rating: number) => {
    if (feedbackState === 'submitting') return;
    
    // Verificar rate limiting
    const rateLimitCheck = feedbackRateLimiter.canProceed(sessionId);
    if (!rateLimitCheck.allowed) {
      const waitTime = Math.ceil((rateLimitCheck.retryAfter || 60000) / 1000);
      setRateLimitError(`Aguarde ${waitTime} segundos antes de enviar outro feedback`);
      setFeedbackState('error');
      
      setTimeout(() => {
        setRateLimitError(null);
        setFeedbackState('idle');
      }, 3000);
      return;
    }
    
    setRateLimitError(null);
    setSelectedRating(rating);
    setFeedbackState('submitting');

    const feedbackData = {
      messageId,
      personaId,
      question,
      response,
      rating,
      timestamp: Date.now()
    };
    
    // Validar e sanitizar dados
    const validation = validateFeedbackData(feedbackData);
    
    if (!validation.isValid) {
      console.error('Dados de feedback inválidos:', validation.errors);
      trackError('validation_error', validation.errors.join(', '), 'FeedbackWidget');
      setFeedbackState('error');
      
      setTimeout(() => {
        setFeedbackState('idle');
        setSelectedRating(null);
      }, 3000);
      return;
    }
    
    if (validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    try {
      trackUserInteraction('quick_feedback', messageId, personaId, {
        feedback_type: rating >= 4 ? 'positive' : 'negative',
        persona_name: personaData?.name,
        sanitization_applied: validation.sanitizedData.metadata?.sanitizationApplied
      });
      
      // Simular API call (integração real com backend pendente)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onFeedbackSubmit?.(validation.sanitizedData);
      trackFeedback('quick', validation.sanitizedData.rating, personaId, false, {
        persona_name: personaData?.name
      });
      
      setFeedbackState('submitted');

      // Auto-hide after success
      setTimeout(() => {
        setHasSubmittedFeedback(true);
      }, 3000);

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      trackError('submit_error', String(error), 'FeedbackWidget');
      setFeedbackState('error');
      
      setTimeout(() => {
        setFeedbackState('idle');
        setSelectedRating(null);
      }, 3000);
    }
  }, [feedbackState, sessionId, messageId, personaId, question, response, onFeedbackSubmit, trackFeedback, trackUserInteraction, trackError, personaData]);

  const handleDetailedFeedback = () => {
    setShowComments(true);
  };

  const submitDetailedFeedback = useCallback(async () => {
    if (!selectedRating || feedbackState === 'submitting') return;
    
    // Verificar rate limiting
    const rateLimitCheck = feedbackRateLimiter.canProceed(sessionId);
    if (!rateLimitCheck.allowed) {
      const waitTime = Math.ceil((rateLimitCheck.retryAfter || 60000) / 1000);
      setRateLimitError(`Aguarde ${waitTime} segundos antes de enviar outro feedback`);
      return;
    }
    
    setRateLimitError(null);
    setFeedbackState('submitting');

    const feedbackData = {
      messageId,
      personaId,
      question,
      response,
      rating: selectedRating,
      comments: comments.trim() || undefined,
      timestamp: Date.now()
    };
    
    // Validar e sanitizar dados
    const validation = validateFeedbackData(feedbackData);
    
    if (!validation.isValid) {
      console.error('Dados de feedback inválidos:', validation.errors);
      trackError('validation_error', validation.errors.join(', '), 'FeedbackWidget');
      setFeedbackState('error');
      return;
    }
    
    if (validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    try {
      trackUserInteraction('detailed_feedback', messageId, personaId, {
        rating: validation.sanitizedData.rating,
        has_comments: !!validation.sanitizedData.comments,
        persona_name: personaData?.name,
        sanitization_applied: validation.sanitizedData.metadata?.sanitizationApplied
      });
      
      // Simular API call (integração real com backend pendente)
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      onFeedbackSubmit?.(validation.sanitizedData);
      trackFeedback('detailed', validation.sanitizedData.rating, personaId, !!validation.sanitizedData.comments, {
        persona_name: personaData?.name
      });
      
      setFeedbackState('submitted');

      // Auto-hide after success
      setTimeout(() => {
        setHasSubmittedFeedback(true);
      }, 4000);

    } catch (error) {
      console.error('Erro ao enviar feedback detalhado:', error);
      trackError('submit_error', String(error), 'FeedbackWidget');
      setFeedbackState('error');
    }
  }, [selectedRating, feedbackState, sessionId, messageId, personaId, question, response, comments, onFeedbackSubmit, trackFeedback, trackUserInteraction, trackError, personaData]);

  // Estado de sucesso
  if (feedbackState === 'submitted') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm,
          padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
          background: '#10B981' + '20',
          border: `1px solid ${'#10B981'}40`,
          borderRadius: modernChatTheme.borderRadius.md,
          marginTop: modernChatTheme.spacing.sm,
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: '#10B981',
          animation: 'slideUp 300ms ease'
        }}
      >
        <CheckIcon />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: modernChatTheme.spacing.xs
        }}>
          <div style={{
            fontSize: modernChatTheme.typography.meta.fontSize,
            fontWeight: '600',
            color: '#10B981'
          }}>
            {personaData ? `Obrigado pelo feedback sobre ${personaData.name}!` : 'Obrigado pelo seu feedback!'}
          </div>
          {validationWarnings.length > 0 && (
            <div style={{
              fontSize: '11px',
              color: modernChatTheme.colors.neutral.textMuted,
              fontStyle: 'italic'
            }}>
              {validationWarnings.map((warning, idx) => (
                <div key={idx}>ℹ️ {warning}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Estado de erro
  if (feedbackState === 'error') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm,
          padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
          background: '#EF4444' + '15',
          border: `1px solid ${'#EF4444'}40`,
          borderRadius: modernChatTheme.borderRadius.md,
          marginTop: modernChatTheme.spacing.sm,
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: '#EF4444'
        }}
      >
        <span>⚠️</span>
        <span>{rateLimitError || 'Erro ao enviar feedback. Tente novamente.'}</span>
      </div>
    );
  }

  // Interface expandida para comentários
  if (showComments) {
    return (
      <div
        style={{
          marginTop: modernChatTheme.spacing.md,
          padding: modernChatTheme.spacing.lg,
          background: modernChatTheme.colors.background.secondary,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle
        }}
      >
        <div
          style={{
            fontSize: modernChatTheme.typography.meta.fontSize,
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}
        >
          {personaData?.avatar || '📝'} Conte-nos mais sobre sua experiência
        </div>

        {/* Rating Selection */}
        <div style={{ marginBottom: modernChatTheme.spacing.md }}>
          <div
            style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.sm
            }}
          >
            {personaData ? `Como avalia a resposta de ${personaData.name}?` : 'Como você avaliaria esta resposta?'}
          </div>
          <div style={{ display: 'flex', gap: modernChatTheme.spacing.xs }}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '50%',
                  background: selectedRating === rating 
                    ? modernChatTheme.colors.personas.gasnelio.primary
                    : modernChatTheme.colors.neutral.surface,
                  color: selectedRating === rating ? 'white' : modernChatTheme.colors.neutral.textMuted,
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: modernChatTheme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (selectedRating !== rating) {
                    e.currentTarget.style.background = modernChatTheme.colors.neutral.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRating !== rating) {
                    e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
                  }
                }}
                aria-label={`Avaliar com ${rating} estrela${rating > 1 ? 's' : ''}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div style={{ marginBottom: modernChatTheme.spacing.md }}>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value.substring(0, 500))}
            placeholder={personaData ? `Comentários sobre ${personaData.name}... Como podemos melhorar?` : 'Comentários opcionais... O que podemos melhorar?'}
            maxLength={500}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: modernChatTheme.typography.message.fontSize,
              lineHeight: modernChatTheme.typography.message.lineHeight,
              color: modernChatTheme.colors.neutral.text,
              background: 'white',
              resize: 'vertical',
              outline: 'none',
              transition: modernChatTheme.transitions.normal
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = modernChatTheme.colors.personas.gasnelio.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = modernChatTheme.colors.neutral.border;
            }}
          />
          <div
            style={{
              textAlign: 'right',
              marginTop: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.textMuted
            }}
          >
            {comments.length}/500
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: modernChatTheme.spacing.md,
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={() => setShowComments(false)}
            style={{
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: 'white',
              color: modernChatTheme.colors.neutral.textMuted,
              fontSize: modernChatTheme.typography.meta.fontSize,
              cursor: 'pointer',
              transition: modernChatTheme.transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Cancelar
          </button>
          
          <button
            onClick={submitDetailedFeedback}
            disabled={!selectedRating || feedbackState === 'submitting'}
            style={{
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              border: 'none',
              borderRadius: modernChatTheme.borderRadius.md,
              background: selectedRating 
                ? modernChatTheme.colors.personas.gasnelio.primary 
                : modernChatTheme.colors.neutral.textMuted,
              color: 'white',
              fontSize: modernChatTheme.typography.meta.fontSize,
              cursor: selectedRating ? 'pointer' : 'not-allowed',
              transition: modernChatTheme.transitions.fast,
              opacity: feedbackState === 'submitting' ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (selectedRating && feedbackState !== 'submitting') {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {feedbackState === 'submitting' ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>
      </div>
    );
  }

  // Interface simples (padrão)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.sm,
        marginTop: modernChatTheme.spacing.md,
        opacity: feedbackState === 'submitting' ? 0.7 : 1,
        transition: modernChatTheme.transitions.normal
      }}
    >
      <span
        style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginRight: modernChatTheme.spacing.sm
        }}
      >
        {personaData ? `A resposta de ${personaData.name} foi útil?` : 'Esta resposta foi útil?'}
      </span>

      {/* Thumbs Up */}
      <button
        onClick={() => handleQuickFeedback(5)}
        disabled={feedbackState === 'submitting'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.xs,
          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.md,
          background: selectedRating === 5 
            ? '#10B981' + '20' 
            : 'white',
          color: selectedRating === 5 
            ? '#10B981' 
            : modernChatTheme.colors.neutral.textMuted,
          fontSize: modernChatTheme.typography.meta.fontSize,
          cursor: feedbackState === 'submitting' ? 'wait' : 'pointer',
          transition: modernChatTheme.transitions.fast,
          minHeight: '36px'
        }}
        onMouseEnter={(e) => {
          if (feedbackState !== 'submitting' && selectedRating !== 5) {
            e.currentTarget.style.background = '#10B981' + '10';
            e.currentTarget.style.color = '#10B981';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedRating !== 5) {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = modernChatTheme.colors.neutral.textMuted;
          }
        }}
        aria-label="Marcar como útil"
      >
        <ThumbsUpIcon />
        <span>Sim</span>
      </button>

      {/* Thumbs Down */}
      <button
        onClick={() => handleQuickFeedback(2)}
        disabled={feedbackState === 'submitting'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.xs,
          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.md,
          background: selectedRating === 2 
            ? '#F59E0B' + '20' 
            : 'white',
          color: selectedRating === 2 
            ? '#F59E0B' 
            : modernChatTheme.colors.neutral.textMuted,
          fontSize: modernChatTheme.typography.meta.fontSize,
          cursor: feedbackState === 'submitting' ? 'wait' : 'pointer',
          transition: modernChatTheme.transitions.fast,
          minHeight: '36px'
        }}
        onMouseEnter={(e) => {
          if (feedbackState !== 'submitting' && selectedRating !== 2) {
            e.currentTarget.style.background = '#F59E0B' + '10';
            e.currentTarget.style.color = '#F59E0B';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedRating !== 2) {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = modernChatTheme.colors.neutral.textMuted;
          }
        }}
        aria-label="Marcar como não útil"
      >
        <ThumbsDownIcon />
        <span>Não</span>
      </button>

      {/* Detailed Feedback */}
      <button
        onClick={handleDetailedFeedback}
        disabled={feedbackState === 'submitting'}
        style={{
          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
          border: 'none',
          borderRadius: modernChatTheme.borderRadius.md,
          background: 'transparent',
          color: modernChatTheme.colors.neutral.textMuted,
          fontSize: modernChatTheme.typography.meta.fontSize,
          cursor: feedbackState === 'submitting' ? 'wait' : 'pointer',
          transition: modernChatTheme.transitions.fast,
          textDecoration: 'underline',
          minHeight: '36px'
        }}
        onMouseEnter={(e) => {
          if (feedbackState !== 'submitting') {
            e.currentTarget.style.color = modernChatTheme.colors.personas.gasnelio.primary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = modernChatTheme.colors.neutral.textMuted;
        }}
        aria-label="Dar feedback detalhado"
      >
        Comentar
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
