'use client';

import { useState, useRef, useEffect } from 'react';
import { Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';

interface ModernChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  persona?: Persona | null;
  personaId?: string;
  isLoading?: boolean;
  isMobile?: boolean;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  showSuggestions?: boolean;
  onHistoryToggle?: () => void;
  showHistory?: boolean;
}

const SendIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="m22 2-7 20-4-9-9-4z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

const HistoryIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3l-3 3.7"/>
  </svg>
);

const LoadingSpinner = () => (
  <div
    style={{
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}
  />
);

const ContextualSuggestions = ({ 
  suggestions, 
  onSuggestionClick, 
  visible,
  persona,
  personaId 
}: {
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  visible: boolean;
  persona?: Persona | null;
  personaId?: string;
}) => {
  if (!visible || !suggestions?.length || !persona) return null;

  const colors = getPersonaColors(personaId || 'gasnelio');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: modernChatTheme.spacing.sm,
        background: 'white',
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        boxShadow: modernChatTheme.shadows.emphasis,
        overflow: 'hidden',
        animation: 'slideUp 200ms ease',
        zIndex: modernChatTheme.zIndex.dropdown
      }}
    >
      <div
        style={{
          padding: modernChatTheme.spacing.sm,
          borderBottom: `1px solid ${modernChatTheme.colors.neutral.divider}`,
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          fontWeight: '500'
        }}
      >
        💡 Sugestões para {persona.name}
      </div>
      
      {suggestions.slice(0, 3).map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick?.(suggestion)}
          style={{
            display: 'block',
            width: '100%',
            padding: modernChatTheme.spacing.md,
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: modernChatTheme.typography.message.fontSize,
            lineHeight: modernChatTheme.typography.message.lineHeight,
            color: modernChatTheme.colors.neutral.text,
            transition: modernChatTheme.transitions.fast,
            borderBottom: index < suggestions.length - 1 ? 
              `1px solid ${modernChatTheme.colors.neutral.divider}` : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.alpha;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default function ModernChatInput({
  value,
  onChange,
  onSubmit,
  persona,
  personaId = 'gasnelio',
  isLoading = false,
  isMobile = false,
  placeholder,
  suggestions,
  onSuggestionClick,
  showSuggestions = false,
  onHistoryToggle,
  showHistory = false
}: ModernChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const colors = persona ? getPersonaColors(personaId) : null;

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (!persona) return 'Digite sua pergunta aqui...';
    return `Pergunte ao ${persona.name}...`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    onSubmit(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => setIsFocused(false), 200);
  };

  // Auto-focus on mobile when persona is selected
  useEffect(() => {
    if (persona && isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [persona, isMobile]);

  const isDisabled = !persona || isLoading;
  const canSubmit = persona && value.trim() && !isLoading;

  return (
    <div
      className="modern-chat-input"
      style={{
        position: 'relative',
        background: 'white',
        borderTop: `1px solid ${modernChatTheme.colors.neutral.divider}`,
        padding: modernChatTheme.spacing.lg,
        paddingBottom: isMobile ? 
          `max(${modernChatTheme.spacing.lg}, env(safe-area-inset-bottom))` : 
          modernChatTheme.spacing.lg
      }}
    >
      {/* Contextual Suggestions */}
      <ContextualSuggestions
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        visible={showSuggestions && isFocused && value.length === 0}
        persona={persona}
        personaId={personaId}
      />

      <form onSubmit={handleSubmit} className="input-form">
        <div
          className="input-wrapper"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: modernChatTheme.spacing.sm,
            background: isFocused ? 'white' : modernChatTheme.colors.neutral.surface,
            borderRadius: modernChatTheme.borderRadius.xl,
            border: `2px solid ${
              isFocused && colors ? 
                colors.primary : 
                'transparent'
            }`,
            transition: `all ${modernChatTheme.transitions.normal}`,
            boxShadow: isFocused ? 
              modernChatTheme.shadows.moderate : 
              modernChatTheme.shadows.subtle,
            transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
            opacity: isDisabled ? 0.6 : 1
          }}
        >
          {/* Botão de Histórico */}
          {onHistoryToggle && (
            <button
              type="button"
              onClick={onHistoryToggle}
              aria-label={showHistory ? 'Fechar histórico' : 'Mostrar histórico'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: showHistory ? 
                  (colors?.primary || modernChatTheme.colors.personas.gasnelio.primary) : 
                  modernChatTheme.colors.neutral.border,
                color: showHistory ? 'white' : modernChatTheme.colors.neutral.textMuted,
                margin: '4px',
                cursor: 'pointer',
                transition: `all ${modernChatTheme.transitions.normal}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${colors?.alpha || 'rgba(0,0,0,0.2)'}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <HistoryIcon />
            </button>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={getPlaceholder()}
            disabled={isDisabled}
            maxLength={1000}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
              fontSize: '16px', // Prevents zoom on iOS
              lineHeight: modernChatTheme.typography.message.lineHeight,
              outline: 'none',
              minHeight: isMobile ? '48px' : '52px',
              color: modernChatTheme.colors.neutral.text,
              resize: 'none'
            }}
            autoComplete="off"
            autoCapitalize="sentences"
            spellCheck="true"
          />
          
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Enviar mensagem"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: canSubmit ? 
                (colors?.primary || modernChatTheme.colors.personas.gasnelio.primary) : 
                modernChatTheme.colors.neutral.textMuted,
              color: 'white',
              margin: '4px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: `all ${modernChatTheme.transitions.normal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transform: canSubmit && !isMobile ? 'scale(1)' : 'scale(0.95)',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              if (canSubmit && !isMobile) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 2px 8px ${colors?.alpha || 'rgba(0,0,0,0.2)'}`;
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? <LoadingSpinner /> : <SendIcon />}
          </button>
        </div>

        {/* Character count indicator */}
        {value.length > 800 && (
          <div
            style={{
              textAlign: 'right',
              marginTop: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: value.length > 950 ? 
                modernChatTheme.colors.status.warning : 
                modernChatTheme.colors.neutral.textMuted
            }}
          >
            {value.length}/1000
          </div>
        )}
      </form>

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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Ensure input doesn't get hidden behind virtual keyboard */
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .modern-chat-input {
            position: sticky !important;
            bottom: 0;
            z-index: ${modernChatTheme.zIndex.sticky};
          }
          
          .input-wrapper {
            min-height: 52px !important;
          }
        }

        /* Focus ring for accessibility */
        .input-wrapper:focus-within {
          outline: 2px solid ${colors?.alpha || 'rgba(59, 130, 246, 0.3)'};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}