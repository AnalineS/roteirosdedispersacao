'use client';

import React from 'react';
import Image from 'next/image';
import { modernChatTheme } from '@/config/modernTheme';
import { sanitizeHtml } from '@/utils/sanitize';

/**
 * Sistema de Avatares Educativos para Personas
 * Integra Dr. Gasnelio e Gá nos recursos educativos
 * Substituindo emojis genéricos por avatares específicos
 */

interface PersonaEducationalAvatarProps {
  personaId: 'dr-gasnelio' | 'ga';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  context?: 'introduction' | 'guidance' | 'feedback' | 'celebration';
  showBadge?: boolean;
  className?: string;
}

interface PersonaEducationalMessageProps extends PersonaEducationalAvatarProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'tips';
  showAvatar?: boolean;
}

// Configurações dos avatares (usando avatares existentes do sistema)
const PERSONA_CONFIG = {
  'dr-gasnelio': {
    name: 'Dr. Gasnelio',
    title: 'Farmacêutico Especialista',
    role: 'Orientação Técnica',
    avatar: '/images/avatars/dr-gasnelio.png', // Avatar já existente
    color: modernChatTheme.colors.personas.gasnelio.primary,
    backgroundColor: modernChatTheme.colors.personas.gasnelio.background,
    description: 'Doutorando em Ciências Farmacêuticas',
    personality: 'Técnico e científico, baseado em evidências'
  },
  'ga': {
    name: 'Gá',
    title: 'Assistente Educativo',
    role: 'Apoio Empático',
    avatar: '/images/avatars/ga.png', // Avatar já existente
    color: modernChatTheme.colors.personas.ga.primary,
    backgroundColor: modernChatTheme.colors.personas.ga.background,
    description: 'Assistente educativo especializado',
    personality: 'Empático e acessível, linguagem simples'
  }
};

// Tamanhos dos avatares
const AVATAR_SIZES = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80
};

// Badges por contexto
const CONTEXT_BADGES = {
  introduction: '👋 Boas-vindas',
  guidance: '🎯 Orientação',
  feedback: '💬 Feedback', 
  celebration: '🎉 Parabéns'
};

export const PersonaEducationalAvatar: React.FC<PersonaEducationalAvatarProps> = ({
  personaId,
  size = 'md',
  context,
  showBadge = false,
  className = ''
}) => {
  const persona = PERSONA_CONFIG[personaId];
  const avatarSize = AVATAR_SIZES[size];

  return (
    <div 
      className={`inline-flex items-center gap-3 ${className}`}
      style={{ color: persona.color }}
    >
      <div style={{ position: 'relative' }}>
        {/* Avatar principal */}
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            border: `2px solid ${persona.color}`,
            background: persona.backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <Image
            src={persona.avatar}
            alt={`${persona.name} - ${persona.title}`}
            width={avatarSize}
            height={avatarSize}
            style={{
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback para ícone se avatar não encontrado
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              // Use textContent instead of innerHTML for safety
              target.parentElement!.textContent = personaId === 'dr-gasnelio' ? '👨‍⚕️' : '👩‍🎓';
              target.parentElement!.style.fontSize = `${avatarSize * 0.5}px`;
            }}
          />
        </div>

        {/* Badge de contexto */}
        {showBadge && context && (
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: persona.color,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              boxShadow: modernChatTheme.shadows.subtle
            }}
          >
            {CONTEXT_BADGES[context]}
          </div>
        )}
      </div>

      {/* Informações da persona (apenas para tamanhos maiores) */}
      {(size === 'lg' || size === 'xl') && (
        <div>
          <div 
            style={{ 
              fontSize: size === 'xl' ? '16px' : '14px',
              fontWeight: '600',
              color: persona.color,
              lineHeight: '1.2'
            }}
          >
            {persona.name}
          </div>
          <div 
            style={{ 
              fontSize: size === 'xl' ? '12px' : '11px',
              color: modernChatTheme.colors.neutral.textMuted,
              lineHeight: '1.2'
            }}
          >
            {persona.title}
          </div>
        </div>
      )}
    </div>
  );
};

export const PersonaEducationalMessage: React.FC<PersonaEducationalMessageProps> = ({
  personaId,
  message,
  type = 'info',
  showAvatar = true,
  size = 'md',
  context,
  className = ''
}) => {
  const persona = PERSONA_CONFIG[personaId];
  
  // Cores por tipo de mensagem
  const messageColors = {
    info: persona.color,
    success: '#10B981',
    warning: '#F59E0B',
    tips: '#3B82F6'
  };

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        gap: modernChatTheme.spacing.md,
        padding: modernChatTheme.spacing.lg,
        background: `${messageColors[type]}10`,
        border: `1px solid ${messageColors[type]}30`,
        borderRadius: modernChatTheme.borderRadius.lg,
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <PersonaEducationalAvatar
          personaId={personaId}
          size={size}
          context={context}
          showBadge={false}
        />
      )}

      {/* Conteúdo da mensagem */}
      <div style={{ flex: 1 }}>
        {/* Header da mensagem */}
        <div style={{ marginBottom: modernChatTheme.spacing.sm }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: messageColors[type]
            }}
          >
            {persona.name}
          </span>
          {context && (
            <span
              style={{
                fontSize: '12px',
                color: modernChatTheme.colors.neutral.textMuted,
                marginLeft: modernChatTheme.spacing.xs
              }}
            >
              • {context === 'introduction' ? 'Introdução' :
                 context === 'guidance' ? 'Orientação' :
                 context === 'feedback' ? 'Feedback' :
                 context === 'celebration' ? 'Parabéns' : context}
            </span>
          )}
        </div>

        {/* Conteúdo */}
        <div
          style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            lineHeight: modernChatTheme.typography.persona.lineHeight,
            color: modernChatTheme.colors.neutral.text
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(message) }}
        />
      </div>
    </div>
  );
};

// Componente para introduções específicas de recursos educativos
export const PersonaEducationalIntroduction: React.FC<{
  personaId: 'dr-gasnelio' | 'ga';
  resource: 'calculator' | 'simulator' | 'checklist' | 'timeline' | 'certification';
  className?: string;
}> = ({ personaId, resource, className = '' }) => {
  const persona = PERSONA_CONFIG[personaId];
  
  const introductions = {
    calculator: {
      'dr-gasnelio': 'Bem-vindo à calculadora PQT-U! Como farmacêutico especialista, desenvolvi estas fórmulas baseadas na minha pesquisa de doutorado e nos protocolos do PCDT 2022.',
      'ga': 'Olá! Vou te ajudar a usar nossa calculadora de doses. É bem simples e vai te dar toda segurança nos cálculos farmacêuticos.'
    },
    simulator: {
      'dr-gasnelio': 'Este simulador contém 5 casos clínicos baseados na minha tese de doutorado. Cada caso foi validado cientificamente e representa situações reais da prática farmacêutica.',
      'ga': 'Que legal que você quer praticar! Preparei casos interessantes para você treinar suas habilidades. Cada um tem suas particularidades e você vai aprender muito.'
    },
    checklist: {
      'dr-gasnelio': 'O checklist de dispensação segue rigorosamente as diretrizes do Ministério da Saúde. Cada item foi estruturado com base em evidências científicas da literatura.',
      'ga': 'Criamos esta lista para te ajudar a não esquecer nada importante na dispensação. É como um "passo a passo" para você se sentir mais seguro no atendimento.'
    },
    timeline: {
      'dr-gasnelio': 'Esta timeline foi desenvolvida com base nos protocolos oficiais, diferenciando adequadamente os esquemas paucibacilares (6 meses) e multibacilares (12 meses).',
      'ga': 'Aqui você pode acompanhar todo o cronograma do tratamento! É muito útil para orientar o paciente sobre o que esperar em cada etapa.'
    },
    certification: {
      'dr-gasnelio': 'O sistema de certificação valida suas competências técnicas baseadas nos critérios acadêmicos estabelecidos em minha pesquisa doutoral.',
      'ga': 'Parabéns por chegar até aqui! Sua dedicação aos estudos merece ser reconhecida com este certificado. Continue sempre aprendendo!'
    }
  };

  return (
    <PersonaEducationalMessage
      personaId={personaId}
      message={introductions[resource][personaId]}
      context="introduction"
      type="info"
      size="lg"
      className={className}
    />
  );
};

// Hook para gerenciar personas em contexto educativo
export const usePersonaEducational = (defaultPersona: 'dr-gasnelio' | 'ga' = 'dr-gasnelio') => {
  const [currentPersona, setCurrentPersona] = React.useState(defaultPersona);
  
  const switchPersona = (personaId: 'dr-gasnelio' | 'ga') => {
    setCurrentPersona(personaId);
  };

  const getPersonaForContext = (context: 'technical' | 'empathetic') => {
    return context === 'technical' ? 'dr-gasnelio' : 'ga';
  };

  return {
    currentPersona,
    switchPersona,
    getPersonaForContext,
    personas: PERSONA_CONFIG
  };
};

export default PersonaEducationalAvatar;