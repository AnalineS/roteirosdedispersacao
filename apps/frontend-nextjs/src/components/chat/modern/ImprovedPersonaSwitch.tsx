'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, Stethoscope, Heart, Check, ArrowRight, Zap } from 'lucide-react';
import { Persona } from '@/services/api';

// Dados de especialidades das personas (sincronizado com intelligent routing)
const PERSONAS_SPECIALTIES: Record<string, string[]> = {
  dr_gasnelio: ['Dosagem clínica', 'Protocolos PQT-U', 'Diagnóstico diferencial'],
  ga: ['Comunicação empática', 'Orientação paciente', 'Suporte emocional'],
  gasnelio: ['Orientações gerais', 'Educação em saúde', 'Prevenção']
};

interface ImprovedPersonaSwitchProps {
  personas: Record<string, Persona>;
  selectedPersona: string | null;
  onPersonaChange: (personaId: string) => void;
  disabled?: boolean;
  showTransitionEffect?: boolean;
  currentMessageCount?: number;
}

export default function ImprovedPersonaSwitch({
  personas,
  selectedPersona,
  onPersonaChange,
  disabled = false,
  showTransitionEffect = true,
  currentMessageCount = 0
}: ImprovedPersonaSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (event.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    }
  };

  const handlePersonaSelect = async (personaId: string) => {
    if (personaId === selectedPersona) {
      setIsOpen(false);
      return;
    }

    setIsTransitioning(true);
    
    // Show transition effect if enabled
    if (showTransitionEffect) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    onPersonaChange(personaId);
    setIsOpen(false);
    setSearchQuery('');
    setIsTransitioning(false);
  };

  // Filter personas based on search
  const filteredPersonas = Object.entries(personas).filter(([personaId, persona]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const specialties = PERSONAS_SPECIALTIES[personaId] || [];
    return (
      persona.name.toLowerCase().includes(query) ||
      persona.personality.toLowerCase().includes(query) ||
      specialties.some((specialty: string) => 
        specialty.toLowerCase().includes(query)
      )
    );
  });

  const getPersonaIcon = (personaId: string) => {
    switch (personaId) {
      case 'dr_gasnelio':
        return <Stethoscope size={20} />;
      case 'ga':
        return <Heart size={20} />;
      default:
        return <User size={20} />;
    }
  };

  const getPersonaColor = (personaId: string) => {
    switch (personaId) {
      case 'dr_gasnelio':
        return 'var(--gasnelio-primary)';
      case 'ga':
        return 'var(--ga-primary)';
      default:
        return 'var(--color-primary-500)';
    }
  };

  const getPersonaBackground = (personaId: string) => {
    switch (personaId) {
      case 'dr_gasnelio':
        return 'var(--gasnelio-alpha)';
      case 'ga':
        return 'var(--ga-alpha)';
      default:
        return 'var(--unb-alpha-primary)';
    }
  };

  return (
    <div className="persona-switch-container" ref={dropdownRef}>
      {/* Current Persona Display */}
      <button
        className={`persona-switch-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={currentPersona ? `Assistente atual: ${currentPersona.name}. Clique para trocar` : 'Selecionar assistente'}
        style={{
          '--persona-color': currentPersona ? getPersonaColor(selectedPersona!) : 'var(--color-primary-500)',
          '--persona-background': currentPersona ? getPersonaBackground(selectedPersona!) : 'var(--unb-alpha-primary)'
        } as React.CSSProperties}
      >
        <div className="persona-switch-current">
          {currentPersona ? (
            <>
              <div className="persona-avatar">
                {getPersonaIcon(selectedPersona!)}
              </div>
              <div className="persona-info">
                <div className="persona-name">
                  {currentPersona.name}
                  {currentMessageCount > 0 && (
                    <span className="message-count">{currentMessageCount} msgs</span>
                  )}
                </div>
                <div className="persona-role">{currentPersona.personality}</div>
              </div>
            </>
          ) : (
            <>
              <div className="persona-avatar">
                <User size={20} />
              </div>
              <div className="persona-info">
                <div className="persona-name">Selecionar Assistente</div>
                <div className="persona-role">Escolha seu helper ideal</div>
              </div>
            </>
          )}
        </div>
        
        <ChevronDown 
          size={16} 
          className={`chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Transition Effect */}
      {isTransitioning && (
        <div className="transition-overlay">
          <div className="transition-content">
            <Zap size={24} />
            <span>Trocando assistente...</span>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="persona-dropdown">
          {/* Search Input */}
          <div className="dropdown-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar assistente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Personas List */}
          <div className="personas-list" role="listbox">
            {filteredPersonas.length === 0 ? (
              <div className="no-results">
                Nenhum assistente encontrado
              </div>
            ) : (
              filteredPersonas.map(([personaId, persona]) => (
                <button
                  key={personaId}
                  className={`persona-option ${personaId === selectedPersona ? 'selected' : ''}`}
                  onClick={() => handlePersonaSelect(personaId)}
                  role="option"
                  aria-selected={personaId === selectedPersona}
                  style={{
                    '--persona-color': getPersonaColor(personaId),
                    '--persona-background': getPersonaBackground(personaId)
                  } as React.CSSProperties}
                >
                  <div className="persona-option-avatar">
                    {getPersonaIcon(personaId)}
                  </div>
                  
                  <div className="persona-option-info">
                    <div className="persona-option-name">
                      {persona.name}
                      {personaId === selectedPersona && (
                        <Check size={16} className="selected-icon" />
                      )}
                    </div>
                    <div className="persona-option-role">
                      {persona.personality}
                    </div>
                    {PERSONAS_SPECIALTIES[personaId] && PERSONAS_SPECIALTIES[personaId].length > 0 && (
                      <div className="persona-option-specialties">
                        {PERSONAS_SPECIALTIES[personaId].slice(0, 2).map((specialty: string, index: number) => (
                          <span key={index} className="specialty-tag">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {personaId !== selectedPersona && (
                    <ArrowRight size={16} className="switch-icon" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Quick Tips */}
          <div className="dropdown-tips">
            <div className="tip">
              💡 <strong>Dr. Gasnelio:</strong> Para questões técnicas e científicas
            </div>
            <div className="tip">
              💝 <strong>Gá:</strong> Para explicações simples e suporte empático
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .persona-switch-container {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .persona-switch-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: var(--persona-background, var(--color-bg-secondary));
          border: 2px solid var(--persona-color, var(--color-border-default));
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-base);
          text-align: left;
          min-height: 64px;
        }

        .persona-switch-trigger:hover:not(.disabled) {
          background: var(--color-bg-tertiary);
          border-color: var(--persona-color);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .persona-switch-trigger.open {
          border-color: var(--persona-color);
          box-shadow: 0 0 0 3px var(--persona-background);
        }

        .persona-switch-trigger.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .persona-switch-current {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          flex: 1;
        }

        .persona-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: var(--persona-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .persona-info {
          flex: 1;
          min-width: 0;
        }

        .persona-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .message-count {
          background: var(--persona-color);
          color: white;
          font-size: var(--font-size-xs);
          padding: 2px 6px;
          border-radius: var(--radius-full);
          font-weight: var(--font-weight-medium);
        }

        .persona-role {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          line-height: 1.2;
        }

        .chevron {
          color: var(--color-text-muted);
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }

        .chevron.rotated {
          transform: rotate(180deg);
        }

        .transition-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-modal);
          animation: fadeIn 300ms ease;
        }

        .transition-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          color: white;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
        }

        .persona-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-bg-primary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          z-index: var(--z-dropdown);
          margin-top: var(--spacing-xs);
          animation: slideDown 200ms ease-out;
          max-height: 400px;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-search {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border-light);
        }

        .search-input {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          background: var(--color-bg-secondary);
          transition: border-color var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 2px var(--unb-alpha-primary);
        }

        .personas-list {
          max-height: 250px;
          overflow-y: auto;
        }

        .persona-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
          border-bottom: 1px solid var(--color-border-light);
        }

        .persona-option:hover {
          background: var(--persona-background);
        }

        .persona-option.selected {
          background: var(--persona-background);
          border-left: 4px solid var(--persona-color);
        }

        .persona-option:last-child {
          border-bottom: none;
        }

        .persona-option-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--persona-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .persona-option-info {
          flex: 1;
          min-width: 0;
        }

        .persona-option-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .selected-icon {
          color: var(--color-success-500);
        }

        .persona-option-role {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-xs);
        }

        .persona-option-specialties {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .specialty-tag {
          font-size: var(--font-size-xs);
          background: var(--persona-background);
          color: var(--persona-color);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--persona-color);
        }

        .switch-icon {
          color: var(--color-text-light);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .persona-option:hover .switch-icon {
          opacity: 1;
        }

        .no-results {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-text-muted);
          font-style: italic;
        }

        .dropdown-tips {
          border-top: 1px solid var(--color-border-light);
          padding: var(--spacing-md);
          background: var(--color-bg-tertiary);
        }

        .tip {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-xs);
          line-height: 1.4;
        }

        .tip:last-child {
          margin-bottom: 0;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .persona-switch-trigger {
            padding: var(--spacing-sm);
            min-height: 56px;
          }

          .persona-avatar {
            width: 32px;
            height: 32px;
          }

          .persona-dropdown {
            max-height: 300px;
          }

          .dropdown-tips {
            display: none; /* Hide tips on mobile to save space */
          }
        }

        /* Dark theme support */
        [data-theme="dark"] .persona-dropdown {
          background: var(--color-gray-100);
          border-color: var(--color-gray-300);
        }

        [data-theme="dark"] .search-input {
          background: var(--color-gray-200);
          border-color: var(--color-gray-300);
        }

        [data-theme="dark"] .dropdown-tips {
          background: var(--color-gray-200);
          border-color: var(--color-gray-300);
        }
      `}</style>
    </div>
  );
}