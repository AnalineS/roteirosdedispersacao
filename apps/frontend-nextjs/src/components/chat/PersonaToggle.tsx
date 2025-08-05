'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  return (
    <div 
      ref={dropdownRef}
      style={{ 
        position: 'relative',
        zIndex: 1000
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: isMobile ? '8px 12px' : '10px 16px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '12px',
          color: 'white',
          cursor: 'pointer',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          minWidth: isMobile ? '120px' : '160px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
        }}
      >
        {currentPersona ? (
          <>
            <PersonaAvatar 
              persona={currentPersona}
              personaId={selectedPersona!}
              size="small"
            />
            <span style={{ 
              flex: 1, 
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentPersona.name}
            </span>
          </>
        ) : (
          <>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem'
            }}>
              ?
            </div>
            <span>Escolher assistente</span>
          </>
        )}
        <span style={{ 
          marginLeft: 'auto',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 998
              }}
              onClick={() => setIsOpen(false)}
            />
          )}
          
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.1)',
              minWidth: isMobile ? '280px' : '320px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 999,
              animation: 'dropdownSlide 0.3s ease'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%)`
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 'bold',
                color: theme.colors.primary[700]
              }}>
                Escolher Assistente Virtual
              </h3>
              <p style={{
                margin: '4px 0 0',
                fontSize: '0.8rem',
                color: theme.colors.neutral[600],
                opacity: 0.8
              }}>
                Cada assistente tem especialidades diferentes
              </p>
            </div>

            {/* Personas List */}
            <div style={{ padding: '8px 0' }}>
              {Object.entries(personas).map(([id, persona]) => (
                <button
                  key={id}
                  onClick={() => {
                    onPersonaChange(id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    border: 'none',
                    background: selectedPersona === id ? theme.colors.primary[50] : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedPersona === id ? `3px solid ${theme.colors.primary[500]}` : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPersona !== id) {
                      e.currentTarget.style.background = theme.colors.neutral[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPersona !== id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <PersonaAvatar 
                    persona={persona}
                    personaId={id}
                    size="medium"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: selectedPersona === id ? 'bold' : '600',
                      fontSize: '0.95rem',
                      color: selectedPersona === id ? theme.colors.primary[700] : theme.colors.neutral[800],
                      marginBottom: '2px'
                    }}>
                      {persona.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: theme.colors.neutral[600],
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {persona.personality}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: theme.colors.primary[600],
                      marginTop: '2px',
                      fontWeight: '500'
                    }}>
                      {persona.expertise.slice(0, 2).join(' • ')}
                      {persona.expertise.length > 2 && '...'}
                    </div>
                  </div>
                  {selectedPersona === id && (
                    <div style={{
                      color: theme.colors.primary[600],
                      fontSize: '1rem'
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #f0f0f0',
              background: theme.colors.neutral[50],
              fontSize: '0.75rem',
              color: theme.colors.neutral[600],
              textAlign: 'center'
            }}>
              💡 Dica: Você pode trocar de assistente a qualquer momento
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}