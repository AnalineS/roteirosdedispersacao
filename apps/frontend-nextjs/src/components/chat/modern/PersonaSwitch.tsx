'use client';

import { useState } from 'react';
import { Persona } from '@/services/api';
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
  
  // Garantir que sempre haja uma persona selecionada
  const actualSelected = selected || 'ga';
  const personaIds = Object.keys(personas);
  const isDrGasnelio = actualSelected === 'dr_gasnelio';

  const handleToggle = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Alternar entre as duas personas
    const newPersona = isDrGasnelio ? 'ga' : 'dr_gasnelio';
    
    setTimeout(() => {
      onChange(newPersona);
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <div 
      className="persona-switch-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.md,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '50px',
        padding: '6px',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        boxShadow: modernChatTheme.shadows.subtle,
        transition: modernChatTheme.transitions.normal
      }}
    >
      {/* Label Esquerda - Dr. Gasnelio */}
      <span
        style={{
          padding: `0 ${modernChatTheme.spacing.sm}`,
          fontSize: modernChatTheme.typography.small.fontSize,
          fontWeight: isDrGasnelio ? '600' : '400',
          color: isDrGasnelio ? modernChatTheme.colors.personas.gasnelio.primary : modernChatTheme.colors.neutral.textMuted,
          transition: 'all 0.3s ease',
          whiteSpace: 'nowrap',
          display: isMobile ? 'none' : 'block'
        }}
      >
        Dr. Gasnelio
      </span>
      
      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        disabled={isTransitioning}
        className="toggle-switch"
        style={{
          position: 'relative',
          width: '60px',
          height: '32px',
          borderRadius: '50px',
          border: 'none',
          background: isDrGasnelio 
            ? modernChatTheme.colors.personas.gasnelio.primary 
            : modernChatTheme.colors.personas.ga.primary,
          cursor: isTransitioning ? 'wait' : 'pointer',
          transition: 'background 0.3s ease',
          padding: 0,
          outline: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
        aria-label={`Mudar para ${isDrGasnelio ? 'Gá' : 'Dr. Gasnelio'}`}
        aria-pressed={isDrGasnelio}
      >
        {/* Slider */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: isDrGasnelio ? '4px' : '32px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
        >
          {isDrGasnelio ? '👨‍⚕️' : '🤝'}
        </div>
      </button>
      
      {/* Label Direita - Gá */}
      <span
        style={{
          padding: `0 ${modernChatTheme.spacing.sm}`,
          fontSize: modernChatTheme.typography.small.fontSize,
          fontWeight: !isDrGasnelio ? '600' : '400',
          color: !isDrGasnelio ? modernChatTheme.colors.personas.ga.primary : modernChatTheme.colors.neutral.textMuted,
          transition: 'all 0.3s ease',
          whiteSpace: 'nowrap',
          display: isMobile ? 'none' : 'block'
        }}
      >
        Gá
      </span>
      
      {/* Mobile Labels */}
      {isMobile && (
        <span
          style={{
            marginLeft: modernChatTheme.spacing.sm,
            fontSize: modernChatTheme.typography.small.fontSize,
            fontWeight: '600',
            color: isDrGasnelio 
              ? modernChatTheme.colors.personas.gasnelio.primary 
              : modernChatTheme.colors.personas.ga.primary,
            transition: 'all 0.3s ease'
          }}
        >
          {isDrGasnelio ? 'Dr. Gasnelio' : 'Gá'}
        </span>
      )}

      <style jsx>{`
        .toggle-switch:focus-visible {
          outline: 2px solid ${isDrGasnelio 
            ? modernChatTheme.colors.personas.gasnelio.primary 
            : modernChatTheme.colors.personas.ga.primary};
          outline-offset: 3px;
        }
        
        .toggle-switch:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        
        .toggle-switch:active:not(:disabled) {
          transform: scale(0.98);
        }

        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .persona-switch-container {
            padding: 5px !important;
          }
        }
      `}</style>
    </div>
  );
}