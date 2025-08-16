'use client';

import React, { memo } from 'react';
import { SentimentResult, SentimentCategory } from '@/services/sentimentAnalysis';
import { theme } from '@/config/theme';

interface SentimentIndicatorProps {
  sentiment: SentimentResult | null;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'inline' | 'floating';
}

const sentimentConfig = {
  [SentimentCategory.POSITIVE]: {
    emoji: '😊',
    label: 'Positivo',
    color: theme.colors.success[500],
    bgColor: theme.colors.success[50],
    description: 'Compreensão e satisfação detectadas'
  },
  [SentimentCategory.NEUTRAL]: {
    emoji: '😐',
    label: 'Neutro',
    color: theme.colors.neutral[600],
    bgColor: theme.colors.neutral[100],
    description: 'Tom neutro ou técnico'
  },
  [SentimentCategory.CONCERNED]: {
    emoji: '🤔',
    label: 'Dúvida',
    color: theme.colors.warning[600],
    bgColor: theme.colors.warning[50],
    description: 'Incerteza ou questionamento detectado'
  },
  [SentimentCategory.ANXIOUS]: {
    emoji: '😰',
    label: 'Ansiedade',
    color: theme.colors.orange[600],
    bgColor: theme.colors.orange[50],
    description: 'Preocupação ou urgência detectada'
  },
  [SentimentCategory.FRUSTRATED]: {
    emoji: '😔',
    label: 'Frustração',
    color: theme.colors.danger[600],
    bgColor: theme.colors.danger[50],
    description: 'Frustração ou desapontamento detectado'
  }
};

const sizeConfig = {
  small: {
    container: '32px',
    emoji: '16px',
    padding: '4px',
    fontSize: '12px'
  },
  medium: {
    container: '40px',
    emoji: '20px',
    padding: '6px',
    fontSize: '14px'
  },
  large: {
    container: '48px',
    emoji: '24px',
    padding: '8px',
    fontSize: '16px'
  }
};

const SentimentIndicatorComponent = memo<SentimentIndicatorProps>(({
  sentiment,
  showDetails = false,
  size = 'medium',
  position = 'inline'
}) => {
  if (!sentiment || sentiment.confidence < 0.3) {
    return null; // Não mostrar se confiança muito baixa
  }
  
  const config = sentimentConfig[sentiment.category];
  const sizeStyles = sizeConfig[size];
  
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: `${sizeStyles.padding} ${position === 'inline' ? '12px' : sizeStyles.padding}`,
    borderRadius: '20px',
    backgroundColor: config.bgColor,
    color: config.color,
    fontSize: sizeStyles.fontSize,
    fontWeight: 500,
    transition: 'all 0.3s ease',
    opacity: sentiment.confidence,
    ...(position === 'floating' && {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    })
  };
  
  const emojiStyle: React.CSSProperties = {
    fontSize: sizeStyles.emoji,
    lineHeight: 1,
    animation: 'sentimentPulse 2s ease-in-out infinite'
  };
  
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    zIndex: 1001
  };
  
  return (
    <>
      <style jsx>{`
        @keyframes sentimentPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .sentiment-indicator:hover .sentiment-tooltip {
          opacity: 1 !important;
        }
        
        .sentiment-progress {
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: currentColor;
          transform-origin: left;
          transition: transform 0.3s ease;
        }
      `}</style>
      
      <div 
        className="sentiment-indicator"
        style={containerStyle}
        role="status"
        aria-label={`Sentimento detectado: ${config.label}`}
      >
        <span style={emojiStyle}>{config.emoji}</span>
        
        {showDetails && (
          <>
            <span>{config.label}</span>
            
            {sentiment.magnitude > 0.7 && (
              <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
                (forte)
              </span>
            )}
          </>
        )}
        
        {/* Tooltip com detalhes */}
        <div className="sentiment-tooltip" style={tooltipStyle}>
          <div>{config.description}</div>
          {sentiment.keywords.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.8 }}>
              Palavras-chave: {sentiment.keywords.slice(0, 3).join(', ')}
            </div>
          )}
          <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.8 }}>
            Confiança: {Math.round(sentiment.confidence * 100)}%
          </div>
        </div>
        
        {/* Indicador de magnitude */}
        <div 
          className="sentiment-progress"
          style={{ 
            transform: `scaleX(${sentiment.magnitude})`,
            opacity: 0.3
          }}
        />
      </div>
    </>
  );
});

SentimentIndicatorComponent.displayName = 'SentimentIndicator';

export const SentimentIndicator = SentimentIndicatorComponent;

// Componente para mostrar histórico de sentimentos
export const SentimentHistory: React.FC<{
  history: Array<{ timestamp: number; result: SentimentResult }>;
  maxItems?: number;
}> = ({ history, maxItems = 5 }) => {
  const recentHistory = history.slice(0, maxItems);
  
  if (recentHistory.length === 0) {
    return null;
  }
  
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: theme.colors.neutral[50],
      borderRadius: '8px',
      fontSize: '12px'
    }}>
      <span style={{ color: theme.colors.neutral[600], marginRight: '8px' }}>
        Histórico:
      </span>
      {recentHistory.map((item, index) => {
        const config = sentimentConfig[item.result.category];
        return (
          <span
            key={item.timestamp}
            style={{
              fontSize: '16px',
              opacity: 1 - (index * 0.2),
              transition: 'opacity 0.3s ease'
            }}
            title={`${config.label} - ${new Date(item.timestamp).toLocaleTimeString()}`}
          >
            {config.emoji}
          </span>
        );
      })}
    </div>
  );
};

// Export default para lazy loading
export default SentimentIndicator;