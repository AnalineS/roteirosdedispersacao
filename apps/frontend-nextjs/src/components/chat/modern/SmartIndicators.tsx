'use client';

import { Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import PersonaAvatar from '../PersonaAvatar';

interface SmartIndicatorsProps {
  sentiment?: {
    category: string;
    confidence: number;
    score: number;
  } | null;
  knowledge?: {
    isSearching: boolean;
    stats?: any;
  };
  fallback?: {
    isActive: boolean;
    type?: string;
  };
  isTyping?: boolean;
  currentPersona?: Persona | null;
  isMobile?: boolean;
}

const TypingIndicator = ({ persona }: { persona?: Persona | null }) => {
  if (!persona) return null;
  
  const colors = getPersonaColors(persona.name === 'Dr. Gasnelio' ? 'gasnelio' : 'ga');
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.sm,
        background: colors.bubble,
        padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${colors.primary}40`,
        animation: 'fadeIn 300ms ease',
        boxShadow: modernChatTheme.shadows.subtle
      }}
    >
      <PersonaAvatar 
        persona={persona}
        personaId={persona.name === 'Dr. Gasnelio' ? 'gasnelio' : 'ga'}
        size="tiny"
        isTyping={true}
      />
      
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        <div 
          className="typing-dot"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: colors.primary,
            animation: 'typing 1.4s infinite ease-in-out',
            animationDelay: '-0.32s'
          }}
        />
        <div 
          className="typing-dot"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: colors.primary,
            animation: 'typing 1.4s infinite ease-in-out',
            animationDelay: '-0.16s'
          }}
        />
        <div 
          className="typing-dot"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: colors.primary,
            animation: 'typing 1.4s infinite ease-in-out'
          }}
        />
      </div>
      
      <span 
        style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: colors.primary,
          fontWeight: '500'
        }}
      >
        {persona.name} está pensando...
      </span>
    </div>
  );
};

const SentimentIndicator = ({ sentiment, confidence }: { sentiment: string; confidence: number }) => {
  const getSentimentInfo = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': 
        return { 
          color: modernChatTheme.colors.sentiment.positive, 
          label: 'Positivo',
          icon: '😊',
          description: 'Sentimento positivo detectado'
        };
      case 'negative': 
        return { 
          color: modernChatTheme.colors.sentiment.negative, 
          label: 'Negativo',
          icon: '😔',
          description: 'Sentimento negativo detectado'
        };
      case 'empathetic': 
        return { 
          color: modernChatTheme.colors.sentiment.empathetic, 
          label: 'Empático',
          icon: '🤗',
          description: 'Tom empático recomendado'
        };
      default: 
        return { 
          color: modernChatTheme.colors.sentiment.neutral, 
          label: 'Neutro',
          icon: '😐',
          description: 'Sentimento neutro'
        };
    }
  };

  const info = getSentimentInfo(sentiment);
  const confidencePercentage = Math.round(confidence * 100);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.sm,
        padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
        background: info.color + '15',
        borderRadius: modernChatTheme.borderRadius.md,
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: info.color,
        border: `1px solid ${info.color}40`,
        cursor: 'help'
      }}
      title={`${info.description} - Confiança: ${confidencePercentage}%`}
    >
      <span style={{ fontSize: '0.9rem' }}>{info.icon}</span>
      <span style={{ fontWeight: '500' }}>{info.label}</span>
      <span style={{ 
        fontSize: '0.75rem', 
        opacity: 0.8,
        background: info.color + '20',
        padding: '1px 4px',
        borderRadius: '4px'
      }}>
        {confidencePercentage}%
      </span>
    </div>
  );
};

const KnowledgeIndicator = ({ isSearching, stats }: { isSearching: boolean; stats?: any }) => {
  if (!isSearching && !stats) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.xs,
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: '#3B82F6'
      }}
    >
      {isSearching ? (
        <>
          <div
            style={{
              width: '12px',
              height: '12px',
              border: `2px solid ${modernChatTheme.colors.status.info}40`,
              borderTop: `2px solid ${modernChatTheme.colors.status.info}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span>Buscando...</span>
        </>
      ) : (
        <>
          <span>📚</span>
          <span>Base de conhecimento</span>
        </>
      )}
    </div>
  );
};

const FallbackBadge = ({ type }: { type?: string }) => {
  const getFallbackInfo = (type?: string) => {
    switch (type) {
      case 'cache': return { icon: '🔄', label: 'Cache', color: '#3B82F6' };
      case 'local_knowledge': return { icon: '📚', label: 'Local', color: '#10B981' };
      case 'emergency': return { icon: '🚨', label: 'Emergência', color: '#EF4444' };
      default: return { icon: '🛡️', label: 'Fallback', color: '#F59E0B' };
    }
  };

  const info = getFallbackInfo(type);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.xs,
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: info.color
      }}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </div>
  );
};

const StatusBar = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: modernChatTheme.spacing.md,
      background: 'rgba(255, 255, 255, 0.95)',
      padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
      borderRadius: modernChatTheme.borderRadius.md,
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      backdropFilter: 'blur(10px)',
      fontSize: modernChatTheme.typography.meta.fontSize,
      boxShadow: modernChatTheme.shadows.subtle,
      animation: 'slideUp 200ms ease'
    }}
  >
    {children}
  </div>
);

export default function SmartIndicators({
  sentiment,
  knowledge,
  fallback,
  isTyping,
  currentPersona,
  isMobile = false
}: SmartIndicatorsProps) {
  const hasActiveIndicators = (
    (sentiment?.confidence && sentiment.confidence > 0.7) ||
    knowledge?.isSearching ||
    fallback?.isActive
  );

  return (
    <div
      className="smart-indicators"
      style={{
        position: 'absolute',
        bottom: '100%',
        right: modernChatTheme.spacing.lg,
        marginBottom: modernChatTheme.spacing.sm,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: modernChatTheme.spacing.xs,
        zIndex: modernChatTheme.zIndex.dropdown,
        pointerEvents: 'none' // Allow clicks to pass through
      }}
    >
      {/* Typing Indicator - Always on top */}
      {isTyping && (
        <TypingIndicator persona={currentPersona} />
      )}
      
      {/* Status indicators - Only show if relevant */}
      {hasActiveIndicators && (
        <StatusBar>
          {sentiment?.confidence && sentiment.confidence > 0.7 && (
            <SentimentIndicator 
              sentiment={sentiment.category} 
              confidence={sentiment.confidence} 
            />
          )}
          
          {knowledge && (
            <KnowledgeIndicator 
              isSearching={knowledge.isSearching}
              stats={knowledge.stats}
            />
          )}
          
          {fallback?.isActive && (
            <FallbackBadge type={fallback.type} />
          )}
        </StatusBar>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        @keyframes typing {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5; 
          }
          40% { 
            transform: scale(1);
            opacity: 1; 
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .smart-indicators {
            right: ${modernChatTheme.spacing.md} !important;
            left: ${modernChatTheme.spacing.md} !important;
            align-items: center !important;
          }
        }
      `}</style>
    </div>
  );
}
