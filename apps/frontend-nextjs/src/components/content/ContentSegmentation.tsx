'use client';

import React, { useState, useEffect } from 'react';
import { getUnbColors } from '@/config/modernTheme';

export type ContentAudience = 'professional' | 'patient' | 'student' | 'general';
export type ContentComplexity = 'basic' | 'intermediate' | 'advanced' | 'technical';

interface ContentSegmentProps {
  audience: ContentAudience[];
  complexity: ContentComplexity;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showAudienceTag?: boolean;
  allowToggle?: boolean;
  defaultVisible?: boolean;
}

interface AudienceSelectorProps {
  selectedAudience: ContentAudience;
  onAudienceChange: (audience: ContentAudience) => void;
  className?: string;
}

// Componente para segmentar conteúdo por público
export function ContentSegment({
  audience,
  complexity,
  title,
  children,
  className = '',
  showAudienceTag = true,
  allowToggle = true,
  defaultVisible = true
}: ContentSegmentProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [selectedAudience, setSelectedAudience] = useState<ContentAudience>('general');
  const unbColors = getUnbColors();

  // Carregar preferência de público do localStorage
  useEffect(() => {
    const savedAudience = localStorage.getItem('preferred-audience') as ContentAudience;
    if (savedAudience) {
      setSelectedAudience(savedAudience);
    }
  }, []);

  // Verificar se o conteúdo deve ser visível para o público selecionado
  const shouldShowForAudience = audience.includes(selectedAudience) || audience.includes('general');

  // Determinar se deve mostrar o conteúdo
  const shouldDisplay = shouldShowForAudience && (isVisible || !allowToggle);

  if (!shouldDisplay && !allowToggle) {
    return null;
  }

  const getAudienceConfig = (aud: ContentAudience) => {
    const configs = {
      professional: {
        label: 'Profissionais de Saúde',
        icon: '👨‍⚕️',
        color: '#1e40af',
        bgColor: '#dbeafe'
      },
      patient: {
        label: 'Pacientes e Familiares',
        icon: '🏥',
        color: '#059669',
        bgColor: '#d1fae5'
      },
      student: {
        label: 'Estudantes',
        icon: '🎓',
        color: '#7c2d12',
        bgColor: '#fed7aa'
      },
      general: {
        label: 'Público Geral',
        icon: '👥',
        color: '#374151',
        bgColor: '#f3f4f6'
      }
    };
    return configs[aud];
  };

  const getComplexityConfig = (comp: ContentComplexity) => {
    const configs = {
      basic: {
        label: 'Básico',
        color: '#10b981',
        description: 'Linguagem simples e acessível'
      },
      intermediate: {
        label: 'Intermediário',
        color: '#f59e0b',
        description: 'Conhecimento prévio recomendado'
      },
      advanced: {
        label: 'Avançado',
        color: '#ef4444',
        description: 'Requer experiência na área'
      },
      technical: {
        label: 'Técnico',
        color: '#8b5cf6',
        description: 'Terminologia especializada'
      }
    };
    return configs[comp];
  };

  const complexityConfig = getComplexityConfig(complexity);
  const primaryAudience = getAudienceConfig(audience[0]);

  return (
    <div className={`content-segment ${className}`} style={{
      border: `2px solid ${primaryAudience.color}20`,
      borderRadius: '12px',
      marginBottom: '1rem',
      background: shouldDisplay ? 'white' : `${primaryAudience.bgColor}40`,
      transition: 'all 0.3s ease'
    }}>
      {/* Header with Audience Tags */}
      {showAudienceTag && (
        <div style={{
          padding: '12px 16px',
          background: `${primaryAudience.color}10`,
          borderBottom: shouldDisplay ? `1px solid ${primaryAudience.color}20` : 'none',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Audience Tags */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {audience.map((aud) => {
                const config = getAudienceConfig(aud);
                return (
                  <span
                    key={aud}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      color: config.color,
                      background: config.bgColor,
                      borderRadius: '20px',
                      border: `1px solid ${config.color}30`
                    }}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </span>
                );
              })}
            </div>

            {/* Complexity Indicator */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'white',
              background: complexityConfig.color,
              borderRadius: '16px'
            }}>
              <span>●</span>
              <span>{complexityConfig.label}</span>
            </span>
          </div>

          {/* Toggle Button */}
          {allowToggle && (
            <button
              onClick={() => setIsVisible(!isVisible)}
              style={{
                background: 'none',
                border: `1px solid ${primaryAudience.color}`,
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: primaryAudience.color,
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = primaryAudience.color;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = primaryAudience.color;
              }}
            >
              {isVisible ? 'Ocultar' : 'Mostrar'}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {shouldDisplay && (
        <div style={{ padding: '16px' }}>
          {title && (
            <h3 style={{
              margin: '0 0 12px 0',
              color: primaryAudience.color,
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              {title}
            </h3>
          )}
          
          {/* Complexity Warning for Mismatched Audience */}
          {!shouldShowForAudience && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#92400e'
            }}>
              ⚠️ <strong>Atenção:</strong> Este conteúdo foi elaborado para {audience.map(aud => getAudienceConfig(aud).label).join(', ')}. 
              {complexity === 'technical' && ' Contém terminologia técnica especializada.'}
              {complexity === 'advanced' && ' Requer conhecimento avançado na área.'}
            </div>
          )}
          
          {children}
          
          {/* Helpful Context for Different Audiences */}
          {shouldDisplay && complexity !== 'basic' && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: `${complexityConfig.color}10`,
              border: `1px solid ${complexityConfig.color}30`,
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#374151'
            }}>
              💡 <strong>Nível de complexidade:</strong> {complexityConfig.description}
              {complexity === 'technical' && (
                <>
                  <br />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Se você é paciente ou familiar, considere consultar um profissional de saúde para esclarecimentos.
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed State */}
      {!shouldDisplay && allowToggle && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          Conteúdo oculto para {getAudienceConfig(selectedAudience).label}
          <br />
          <button
            onClick={() => setIsVisible(true)}
            style={{
              marginTop: '8px',
              background: 'none',
              border: `1px solid ${primaryAudience.color}`,
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: primaryAudience.color,
              cursor: 'pointer'
            }}
          >
            Mostrar assim mesmo
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para seleção de público-alvo
export function AudienceSelector({
  selectedAudience,
  onAudienceChange,
  className = ''
}: AudienceSelectorProps) {
  const unbColors = getUnbColors();

  const audiences: { value: ContentAudience; label: string; icon: string; description: string }[] = [
    {
      value: 'general',
      label: 'Público Geral',
      icon: '👥',
      description: 'Informações básicas e acessíveis'
    },
    {
      value: 'patient',
      label: 'Paciente/Familiar',
      icon: '🏥',
      description: 'Foco em qualidade de vida e direitos'
    },
    {
      value: 'student',
      label: 'Estudante',
      icon: '🎓',
      description: 'Conteúdo educacional e didático'
    },
    {
      value: 'professional',
      label: 'Profissional',
      icon: '👨‍⚕️',
      description: 'Informações técnicas e protocolos'
    }
  ];

  const handleAudienceChange = (audience: ContentAudience) => {
    onAudienceChange(audience);
    localStorage.setItem('preferred-audience', audience);
  };

  return (
    <div className={`audience-selector ${className}`} style={{
      background: 'white',
      border: `2px solid ${unbColors.alpha.primary}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        color: unbColors.primary,
        fontSize: '1.1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🎯 Personalizar Conteúdo
      </h3>
      
      <p style={{
        margin: '0 0 16px 0',
        color: '#6b7280',
        fontSize: '0.9rem'
      }}>
        Escolha seu perfil para ver conteúdo adequado ao seu nível de conhecimento:
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {audiences.map((audience) => (
          <button
            key={audience.value}
            onClick={() => handleAudienceChange(audience.value)}
            style={{
              padding: '12px',
              border: `2px solid ${selectedAudience === audience.value ? unbColors.primary : '#e5e7eb'}`,
              borderRadius: '8px',
              background: selectedAudience === audience.value ? unbColors.alpha.primary : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (selectedAudience !== audience.value) {
                e.currentTarget.style.borderColor = unbColors.primary;
                e.currentTarget.style.background = `${unbColors.alpha.primary}50`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAudience !== audience.value) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{audience.icon}</span>
              <span style={{
                fontWeight: '600',
                color: selectedAudience === audience.value ? unbColors.primary : '#374151'
              }}>
                {audience.label}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: '#6b7280'
            }}>
              {audience.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hook para gerenciar preferências de audiência
export function useAudiencePreference() {
  const [selectedAudience, setSelectedAudience] = useState<ContentAudience>('general');

  useEffect(() => {
    const saved = localStorage.getItem('preferred-audience') as ContentAudience;
    if (saved) {
      setSelectedAudience(saved);
    }
  }, []);

  const updateAudience = (audience: ContentAudience) => {
    setSelectedAudience(audience);
    localStorage.setItem('preferred-audience', audience);
  };

  return {
    selectedAudience,
    updateAudience
  };
}