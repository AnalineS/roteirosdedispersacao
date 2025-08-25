/**
 * Avatar Educacional das Personas
 * Componente especializado para usar avatares das personas Dr. Gasnelio e Gá
 * nos recursos educativos, substituindo emojis genéricos
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { getPersonaAvatar } from '@/constants/avatars';
import { modernChatTheme } from '@/config/modernTheme';

interface PersonaEducationalAvatarProps {
  personaId: 'dr-gasnelio' | 'ga';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showName?: boolean;
  showRole?: boolean;
  context?: 'introduction' | 'guidance' | 'feedback' | 'explanation';
  className?: string;
}

// Dados das personas para contexto educativo
const PERSONA_DATA = {
  'dr-gasnelio': {
    name: 'Dr. Gasnelio',
    role: 'Farmacêutico Especialista',
    description: 'Especialista técnico em dispensação farmacêutica',
    personality: 'Técnico, científico, baseado em evidências',
    theme: modernChatTheme.colors.personas.gasnelio,
    contexts: {
      introduction: 'Olá! Sou o Dr. Gasnelio, seu especialista em dispensação farmacêutica.',
      guidance: 'Baseado nos protocolos clínicos, recomendo:',
      feedback: 'Análise técnica da sua resposta:',
      explanation: 'Do ponto de vista farmacológico:'
    }
  },
  'ga': {
    name: 'Gá',
    role: 'Assistente Empática',
    description: 'Educadora focada no cuidado humanizado',
    personality: 'Empática, acolhedora, didática',
    theme: modernChatTheme.colors.personas.ga,
    contexts: {
      introduction: 'Oi! Eu sou a Gá, estou aqui para te ajudar de forma acolhedora.',
      guidance: 'Vamos juntos entender esse conceito:',
      feedback: 'Você está indo muito bem! Vamos ver:',
      explanation: 'Para facilitar o entendimento:'
    }
  }
};

export default function PersonaEducationalAvatar({
  personaId,
  size = 'medium',
  showName = true,
  showRole = false,
  context = 'introduction',
  className = ''
}: PersonaEducationalAvatarProps) {
  const persona = PERSONA_DATA[personaId];
  const avatarUrl = getPersonaAvatar(personaId);
  
  const sizeStyles = {
    small: { width: '32px', height: '32px', fontSize: '14px' },
    medium: { width: '48px', height: '48px', fontSize: '16px' },
    large: { width: '64px', height: '64px', fontSize: '18px' },
    xlarge: { width: '80px', height: '80px', fontSize: '20px' }
  };

  const sizePx = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80
  };
  
  const currentSize = sizeStyles[size];
  const imageSize = sizePx[size];
  
  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.md
      }}
    >
      {/* Avatar */}
      <div
        style={{
          ...currentSize,
          borderRadius: '50%',
          background: avatarUrl 
            ? 'white' 
            : `linear-gradient(135deg, ${persona.theme.primary} 0%, ${persona.theme.primary}80 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${persona.theme.primary}30`,
          border: `3px solid ${persona.theme.primary}`,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`Avatar de ${persona.name}, ${persona.role}`}
            width={imageSize}
            height={imageSize}
            style={{
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        ) : (
          <span 
            style={{ 
              color: 'white',
              fontWeight: 'bold',
              fontSize: currentSize.fontSize
            }}
          >
            {persona.name.charAt(0)}
          </span>
        )}
        
        {/* Indicador de contexto educativo */}
        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: size === 'small' ? '12px' : '16px',
            height: size === 'small' ? '12px' : '16px',
            background: '#10B981',
            borderRadius: '50%',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'small' ? '8px' : '10px'
          }}
        >
          📚
        </div>
      </div>
      
      {/* Informações da persona */}
      {(showName || showRole) && (
        <div>
          {showName && (
            <div
              style={{
                fontSize: currentSize.fontSize,
                fontWeight: '600',
                color: persona.theme.primary,
                marginBottom: showRole ? modernChatTheme.spacing.xs : 0
              }}
            >
              {persona.name}
            </div>
          )}
          
          {showRole && (
            <div
              style={{
                fontSize: size === 'small' ? '12px' : '14px',
                color: modernChatTheme.colors.neutral.textMuted,
                fontWeight: '500'
              }}
            >
              {persona.role}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para mensagens educativas com persona
 */
interface PersonaEducationalMessageProps {
  personaId: 'dr-gasnelio' | 'ga';
  context: 'introduction' | 'guidance' | 'feedback' | 'explanation';
  message: string;
  children?: React.ReactNode;
  showAvatar?: boolean;
}

export function PersonaEducationalMessage({
  personaId,
  context,
  message,
  children,
  showAvatar = true
}: PersonaEducationalMessageProps) {
  const persona = PERSONA_DATA[personaId];
  const contextMessage = persona.contexts[context];
  
  return (
    <div
      style={{
        background: persona.theme.bubble || persona.theme.primary + '10',
        border: `1px solid ${persona.theme.primary}20`,
        borderRadius: modernChatTheme.borderRadius.lg,
        padding: modernChatTheme.spacing.lg,
        marginBottom: modernChatTheme.spacing.md
      }}
    >
      {/* Header com avatar e contexto */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: modernChatTheme.spacing.md,
          paddingBottom: modernChatTheme.spacing.sm,
          borderBottom: `1px solid ${persona.theme.primary}20`
        }}
      >
        {showAvatar && (
          <PersonaEducationalAvatar
            personaId={personaId}
            size="medium"
            showName={true}
            showRole={false}
            context={context}
            className="mr-3"
          />
        )}
        
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              color: persona.theme.primary,
              fontWeight: '600',
              marginBottom: modernChatTheme.spacing.xs
            }}
          >
            {contextMessage}
          </div>
        </div>
      </div>
      
      {/* Conteúdo da mensagem */}
      <div
        style={{
          fontSize: modernChatTheme.typography.message.fontSize,
          lineHeight: '1.6',
          color: modernChatTheme.colors.neutral.text
        }}
      >
        {message}
      </div>
      
      {/* Conteúdo adicional */}
      {children && (
        <div style={{ marginTop: modernChatTheme.spacing.md }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hook para obter dados da persona
 */
export function usePersonaData(personaId: 'dr-gasnelio' | 'ga') {
  return PERSONA_DATA[personaId];
}

/**
 * Componente para substituir emojis genéricos por avatares de personas
 */
interface PersonaReplacementProps {
  originalEmoji: string;
  preferredPersona?: 'dr-gasnelio' | 'ga';
  size?: 'small' | 'medium' | 'large';
  context?: string;
}

export function PersonaReplacement({
  originalEmoji,
  preferredPersona = 'dr-gasnelio',
  size = 'small',
  context
}: PersonaReplacementProps) {
  // Mapear emojis específicos para personas apropriadas
  const EMOJI_TO_PERSONA: Record<string, 'dr-gasnelio' | 'ga'> = {
    '👨‍⚕️': 'dr-gasnelio',
    '💊': 'dr-gasnelio', 
    '🧮': 'dr-gasnelio',
    '📊': 'dr-gasnelio',
    '🤱': 'ga',
    '👶': 'ga',
    '💡': 'ga',
    '🏠': 'ga'
  };
  
  const personaToUse = EMOJI_TO_PERSONA[originalEmoji] || preferredPersona;
  
  return (
    <PersonaEducationalAvatar
      personaId={personaToUse}
      size={size}
      showName={false}
      showRole={false}
    />
  );
}
