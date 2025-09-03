'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { usePersonaActions, useCurrentPersona } from '@/contexts/PersonaContext';
import { ChatBotIcon } from '@/components/icons/NavigationIcons';
import type { ValidPersonaId } from '@/types/personas';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface PersonaSelectorUnifiedProps {
  /** Callback quando persona é selecionada (opcional) */
  onPersonaSelected?: (personaId: ValidPersonaId) => void;
  /** Variante de layout */
  variant?: 'default' | 'compact' | 'minimal';
  /** Se deve mostrar animações */
  enableAnimations?: boolean;
  /** Classe CSS customizada */
  className?: string;
}

interface PersonaCardProps {
  personaId: ValidPersonaId;
  name: string;
  description: string;
  avatar: string;
  tags: string[];
  targetAudience: string;
  isActive: boolean;
  isRecommended: boolean;
  onClick: () => void;
  enableAnimations: boolean;
}

// ============================================
// COMPONENTE DE CARD DE PERSONA
// ============================================

const PersonaCard: React.FC<PersonaCardProps> = ({
  personaId,
  name,
  description,
  avatar,
  tags,
  targetAudience,
  isActive,
  isRecommended,
  onClick,
  enableAnimations
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Configurações visuais baseadas na persona
  const cardConfig = {
    dr_gasnelio: {
      gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      borderColor: '#e0f2fe',
      hoverBorderColor: '#003366',
      buttonColor: '#003366',
      buttonHover: '#001f42',
      iconColor: '#003366',
      tagBg: '#dbeafe',
      tagColor: '#1e40af'
    },
    ga: {
      gradient: 'linear-gradient(135deg, #fef3e2 0%, #fde68a 100%)',
      borderColor: '#fde68a',
      hoverBorderColor: '#f59e0b',
      buttonColor: '#f59e0b',
      buttonHover: '#d97706',
      iconColor: '#92400e',
      tagBg: '#fef3c7',
      tagColor: '#92400e'
    }
  };

  const config = cardConfig[personaId];

  const cardVariants = enableAnimations ? {
    initial: { scale: 1, y: 0, opacity: 1 },
    hover: { scale: 1.02, y: -4, opacity: 1 },
    active: { scale: 0.98, y: 0, opacity: 1 }
  } : { initial: {}, hover: {}, active: {} };

  const Card = enableAnimations ? motion.button : 'button';

  return (
    <Card
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="active"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        flex: '1',
        minWidth: '280px',
        maxWidth: '400px',
        padding: '2rem',
        background: config.gradient,
        borderRadius: '20px',
        border: `2px solid ${isHovered || isActive ? config.hoverBorderColor : config.borderColor}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        outline: 'none',
        boxShadow: isHovered ? `0 12px 40px rgba(0, 0, 0, 0.1)` : '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}
      aria-label={`Iniciar conversa com ${name} - ${targetAudience}`}
      role="button"
      tabIndex={0}
    >
      {/* Badge de recomendação */}
      {isRecommended && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: '#10b981',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Recomendado
        </div>
      )}

      {/* Badge de persona ativa */}
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: config.buttonColor,
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          Ativo
        </div>
      )}

      {/* Avatar */}
      <div style={{ 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        margin: '0 auto 1.5rem',
        background: config.iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        {avatar}
      </div>
      
      {/* Nome */}
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: config.iconColor,
        marginBottom: '0.5rem',
        textAlign: 'center'
      }}>
        {name}
      </h3>
      
      {/* Audience */}
      <p style={{
        fontSize: '0.875rem',
        color: '#059669',
        fontWeight: '600',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textAlign: 'center'
      }}>
        {targetAudience}
      </p>
      
      {/* Descrição */}
      <p style={{
        fontSize: '0.95rem',
        color: '#374151',
        lineHeight: '1.6',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        {description}
      </p>
      
      {/* Tags */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        {tags.map((tag) => (
          <span key={tag} style={{
            padding: '0.25rem 0.75rem',
            background: config.tagBg,
            color: config.tagColor,
            fontSize: '0.75rem',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* CTA Button */}
      <div style={{
        width: '100%',
        padding: '1rem 2rem',
        background: config.buttonColor,
        color: 'white',
        borderRadius: '16px',
        fontWeight: '600',
        fontSize: '1.1rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? `0 8px 24px rgba(0, 0, 0, 0.2)` : '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        🚀 Iniciar Conversa
      </div>

      {/* Focus indicator */}
      <style jsx>{`
        button:focus-visible {
          outline: 3px solid ${config.buttonColor};
          outline-offset: 4px;
        }
      `}</style>
    </Card>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PersonaSelectorUnified({
  onPersonaSelected,
  variant = 'default',
  enableAnimations = true,
  className = ''
}: PersonaSelectorUnifiedProps) {
  const router = useRouter();
  const { personas, loading, error } = usePersonasEnhanced({
    includeFallback: true,
    useCache: true
  });
  const { setPersona, getRecommendedPersona } = usePersonaActions();
  const { persona: currentPersona } = useCurrentPersona();

  const [isNavigating, setIsNavigating] = useState(false);

  // Função para lidar com seleção de persona
  const handlePersonaSelect = useCallback(async (personaId: ValidPersonaId) => {
    try {
      setIsNavigating(true);

      // Definir persona no contexto global
      await setPersona(personaId, 'explicit');

      // Callback customizado
      if (onPersonaSelected) {
        onPersonaSelected(personaId);
      }

      // Navegar para chat com parâmetro
      router.push(`/chat?persona=${personaId}`);

    } catch (error) {
      console.error('Erro ao selecionar persona:', error);
      // Em caso de erro, ainda tenta navegar
      router.push(`/chat?persona=${personaId}`);
    } finally {
      setIsNavigating(false);
    }
  }, [setPersona, onPersonaSelected, router]);

  // Obter recomendação
  const recommendedPersona = getRecommendedPersona?.() || 'ga';

  // Estados de loading
  if (loading) {
    return (
      <div className={className} style={{ 
        maxWidth: 'min(1400px, 95vw)', 
        margin: '3rem auto',
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #003366',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            Carregando assistentes virtuais...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && Object.keys(personas).length === 0) {
    return (
      <div className={className} style={{ 
        maxWidth: 'min(1400px, 95vw)', 
        margin: '3rem auto',
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{ color: '#ef4444', fontSize: '1.1rem' }}>
          ⚠️ Erro ao carregar assistentes: {error}
        </div>
      </div>
    );
  }

  // Dados das personas
  const personasData = [
    {
      id: 'dr_gasnelio' as ValidPersonaId,
      name: personas.dr_gasnelio?.name || 'Dr. Gasnelio',
      description: personas.dr_gasnelio?.description || 'Especializado em aspectos técnicos, protocolos e diretrizes clínicas. Ideal para profissionais de saúde.',
      avatar: personas.dr_gasnelio?.avatar || '👨‍⚕️',
      tags: personas.dr_gasnelio?.capabilities || ['Protocolos', 'Farmacologia', 'Diretrizes'],
      targetAudience: personas.dr_gasnelio?.target_audience || 'Profissionais de Saúde'
    },
    {
      id: 'ga' as ValidPersonaId,
      name: personas.ga?.name || 'Gá',
      description: personas.ga?.description || 'Focado no cuidado humanizado e suporte emocional. Ideal para pacientes e familiares.',
      avatar: personas.ga?.avatar || '💬',
      tags: personas.ga?.capabilities || ['Acolhimento', 'Orientação', 'Suporte'],
      targetAudience: personas.ga?.target_audience || 'Pacientes e Familiares'
    }
  ];

  return (
    <div className={className} style={{ 
      maxWidth: 'min(1400px, 95vw)', 
      margin: '3rem auto',
      padding: '2.5rem',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      
      {/* Header */}
      <div className="text-center hierarchy-component">
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontSize: '2.25rem',
          fontWeight: '700',
          color: '#003366',
          marginBottom: '1rem'
        }}>
          <ChatBotIcon size={32} variant="unb" />
          Escolha Seu Assistente Virtual
        </h2>
        <p style={{ 
          maxWidth: '700px',
          margin: '0 auto',
          textAlign: 'center',
          fontSize: '1.2rem',
          color: '#374151',
          lineHeight: '1.6',
          marginBottom: '3rem'
        }}>
          Dois especialistas virtuais prontos para ajudar no cuidado farmacêutico da hanseníase.
          {recommendedPersona && (
            <span style={{ display: 'block', marginTop: '0.5rem', color: '#10b981', fontWeight: '600' }}>
              ✨ {recommendedPersona === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'} é recomendado para você
            </span>
          )}
        </p>
      </div>
      
      {/* Cards Grid */}
      <div 
        id="assistentes" 
        className="assistants-container" 
        role="main" 
        aria-label="Seleção de assistentes virtuais"
        style={{
          display: 'flex',
          gap: '2.5rem',
          marginTop: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <AnimatePresence>
          {personasData.map((persona) => (
            <PersonaCard
              key={persona.id}
              personaId={persona.id}
              name={persona.name}
              description={persona.description}
              avatar={persona.avatar}
              tags={persona.tags}
              targetAudience={persona.targetAudience}
              isActive={currentPersona === persona.id}
              isRecommended={recommendedPersona === persona.id}
              onClick={() => handlePersonaSelect(persona.id)}
              enableAnimations={enableAnimations}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer informativo */}
      <div style={{
        marginTop: '3rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '0.95rem', 
          lineHeight: '1.6',
          margin: 0 
        }}>
          💡 <strong>Dica:</strong> Você pode alternar entre os assistentes a qualquer momento durante a conversa.
          Suas preferências serão lembradas para próximas visitas.
        </p>
      </div>

      {/* Loading overlay durante navegação */}
      {isNavigating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          zIndex: 9999
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #003366',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#003366', fontSize: '1.1rem', fontWeight: '600' }}>
            Iniciando conversa...
          </p>
        </div>
      )}
    </div>
  );
}