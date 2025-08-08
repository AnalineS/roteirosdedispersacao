'use client';

import { useState } from 'react';
import { Persona } from '@/services/api';
import PersonaAvatar from '../PersonaAvatar';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';

interface PersonaSwitchProps {
  personas: Record<string, Persona>;
  selected: string | null;
  onChange: (personaId: string) => void;
  isMobile?: boolean;
}

export default function PersonaSwitch({ 
  personas, 
  selected, 
  onChange, 
  isMobile = false 
}: PersonaSwitchProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePersonaChange = async (personaId: string) => {
    if (personaId === selected || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Micro-interação: delay para animação visual
    setTimeout(() => {
      onChange(personaId);
      setIsTransitioning(false);
    }, 150);
  };

  const getPersonaDisplayType = (persona: Persona, personaId: string) => {
    if (personaId === 'gasnelio') return 'Técnico';
    if (personaId === 'ga') return 'Empático';
    return persona.personality?.split(' ')[0] || 'Assistente';
  };

  return (
    <div 
      className="persona-switch"
      style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: modernChatTheme.borderRadius.lg,
        padding: '4px',
        gap: '4px',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        boxShadow: modernChatTheme.shadows.moderate,
        transition: modernChatTheme.transitions.normal,
        minWidth: isMobile ? 'auto' : '280px',
        flexDirection: isMobile ? 'column' : 'row'
      }}
    >
      {Object.entries(personas).map(([personaId, persona]) => {
        const isActive = selected === personaId;
        const colors = getPersonaColors(personaId);
        
        return (
          <button
            key={personaId}
            onClick={() => handlePersonaChange(personaId)}
            disabled={isTransitioning}
            className="persona-tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm,
              padding: isMobile ? '10px 12px' : '8px 12px',
              borderRadius: modernChatTheme.borderRadius.md,
              border: 'none',
              background: isActive ? colors.primary : 'transparent',
              color: isActive ? 'white' : modernChatTheme.colors.neutral.text,
              cursor: isTransitioning ? 'wait' : 'pointer',
              transition: `all ${modernChatTheme.transitions.normal}`,
              position: 'relative',
              overflow: 'hidden',
              flex: isMobile ? 1 : 'auto',
              minWidth: 0,
              opacity: isTransitioning ? 0.7 : 1,
              transform: isActive && !isTransitioning ? 'translateY(-1px)' : 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              if (!isActive && !isTransitioning) {
                e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            aria-label={`Alternar para ${persona.name}`}
            aria-pressed={isActive}
          >
            {/* Avatar */}
            <PersonaAvatar 
              persona={persona}
              personaId={personaId}
              size="small"
              style={{
                flexShrink: 0,
                filter: isActive ? 'brightness(1.1)' : 'none'
              }}
            />
            
            {/* Info */}
            <div 
              className="persona-info"
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'left'
              }}
            >
              <div 
                className="persona-name"
                style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  fontWeight: modernChatTheme.typography.persona.fontWeight,
                  lineHeight: modernChatTheme.typography.persona.lineHeight,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {persona.name}
              </div>
              
              {!isMobile && (
                <div 
                  className="persona-type"
                  style={{
                    fontSize: modernChatTheme.typography.meta.fontSize,
                    lineHeight: modernChatTheme.typography.meta.lineHeight,
                    opacity: isActive ? 0.9 : 0.6,
                    margin: '2px 0 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {getPersonaDisplayType(persona, personaId)}
                </div>
              )}
            </div>
            
            {/* Active Indicator */}
            {isActive && (
              <div 
                className="active-indicator"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '1px',
                  animation: 'slideIn 200ms ease'
                }}
              />
            )}
            
            {/* Ripple effect on click */}
            {isTransitioning && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                  animation: 'ripple 300ms ease-out'
                }}
              />
            )}
          </button>
        );
      })}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) scaleX(0);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scaleX(1);
          }
        }

        @keyframes ripple {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }

        .persona-tab:focus-visible {
          outline: 2px solid ${selected ? 'rgba(255, 255, 255, 0.5)' : modernChatTheme.colors.neutral.text};
          outline-offset: 2px;
        }

        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .persona-switch {
            width: 100% !important;
            min-width: unset !important;
          }
          
          .persona-tab {
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}