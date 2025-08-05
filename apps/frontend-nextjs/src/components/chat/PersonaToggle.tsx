'use client';

import { useState } from 'react';
import { Persona } from '@/services/api';
import PersonaAvatar from '@/components/chat/PersonaAvatar';
import { theme } from '@/config/theme';

interface PersonaToggleProps {
  personas: Record<string, Persona>;
  selectedPersona: string | null;
  onPersonaChange: (personaId: string) => void;
  isMobile?: boolean;
}

export default function PersonaToggle({ 
  personas, 
  selectedPersona, 
  onPersonaChange, 
  isMobile = false 
}: PersonaToggleProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  const personaEntries = Object.entries(personas);
  const currentIndex = selectedPersona ? personaEntries.findIndex(([id]) => id === selectedPersona) : -1;

  // Navegar para próxima persona
  const nextPersona = () => {
    if (personaEntries.length === 0) return;
    const nextIndex = currentIndex >= personaEntries.length - 1 ? 0 : currentIndex + 1;
    const [nextId] = personaEntries[nextIndex];
    onPersonaChange(nextId);
  };

  // Navegar para persona anterior
  const previousPersona = () => {
    if (personaEntries.length === 0) return;
    const prevIndex = currentIndex <= 0 ? personaEntries.length - 1 : currentIndex - 1;
    const [prevId] = personaEntries[prevIndex];
    onPersonaChange(prevId);
  };

  // Selecionar persona diretamente
  const selectPersona = (personaId: string) => {
    onPersonaChange(personaId);
  };

  if (personaEntries.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Container do Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: isMobile ? '4px' : '6px',
          border: '1px solid rgba(255,255,255,0.2)',
          gap: '4px',
          minWidth: isMobile ? '200px' : '280px'
        }}
      >
        {/* Botão Anterior */}
        <button
          onClick={previousPersona}
          disabled={personaEntries.length <= 1}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: personaEntries.length > 1 ? 'pointer' : 'not-allowed',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            opacity: personaEntries.length > 1 ? 1 : 0.5,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (personaEntries.length > 1) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={personaEntries.length > 1 ? 'Assistente anterior' : 'Apenas um assistente disponível'}
        >
          ‹
        </button>

        {/* Área Central das Personas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: isMobile ? '40px' : '44px',
            overflow: 'hidden'
          }}
        >
          {/* Indicadores de Personas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '8px',
              position: 'relative'
            }}
          >
            {personaEntries.map(([id, persona], index) => {
              const isSelected = selectedPersona === id;
              const isAdjacent = Math.abs(index - currentIndex) <= 1 || 
                                (currentIndex === 0 && index === personaEntries.length - 1) ||
                                (currentIndex === personaEntries.length - 1 && index === 0);

              // Mostrar apenas persona selecionada + adjacentes em mobile
              if (isMobile && !isSelected && !isAdjacent && personaEntries.length > 3) {
                return null;
              }

              return (
                <div
                  key={id}
                  style={{
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'scale(1.1)' : 'scale(0.9)',
                    opacity: isSelected ? 1 : 0.6
                  }}
                  onMouseEnter={() => setShowTooltip(id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <button
                    onClick={() => selectPersona(id)}
                    style={{
                      background: 'transparent',
                      border: isSelected ? `2px solid ${theme.colors.secondary[400]}` : '2px solid transparent',
                      borderRadius: '50%',
                      padding: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: isSelected ? `0 0 12px ${theme.colors.secondary[400]}40` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.opacity = '0.8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.opacity = '0.6';
                      }
                    }}
                  >
                    <PersonaAvatar 
                      persona={persona}
                      personaId={id}
                      size={isMobile ? 'small' : 'medium'}
                    />
                  </button>

                  {/* Tooltip */}
                  {showTooltip === id && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        background: 'rgba(0,0,0,0.9)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        animation: 'tooltipSlide 0.2s ease'
                      }}
                    >
                      {persona.name}
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '0',
                          height: '0',
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: '4px solid rgba(0,0,0,0.9)'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Indicador de posição (pontos) */}
          {personaEntries.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '3px'
              }}
            >
              {personaEntries.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: index === currentIndex 
                      ? theme.colors.secondary[400] 
                      : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botão Próximo */}
        <button
          onClick={nextPersona}
          disabled={personaEntries.length <= 1}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: personaEntries.length > 1 ? 'pointer' : 'not-allowed',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            opacity: personaEntries.length > 1 ? 1 : 0.5,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (personaEntries.length > 1) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={personaEntries.length > 1 ? 'Próximo assistente' : 'Apenas um assistente disponível'}
        >
          ›
        </button>
      </div>

      {/* Nome da Persona Atual */}
      {selectedPersona && personas[selectedPersona] && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '4px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '500',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {personas[selectedPersona].name}
        </div>
      )}

      <style jsx>{`
        @keyframes tooltipSlide {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}