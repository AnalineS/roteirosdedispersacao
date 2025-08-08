'use client';

import Link from 'next/link';
import { Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import PersonaSwitch from './PersonaSwitch';

interface ModernChatHeaderProps {
  personas: Record<string, Persona>;
  selectedPersona: string | null;
  onPersonaChange: (personaId: string) => void;
  isMobile?: boolean;
  onHistoryToggle?: () => void;
  onExport?: () => void;
  showHistory?: boolean;
  hasMessages?: boolean;
}

const BackButton = ({ isMobile }: { isMobile?: boolean }) => (
  <Link 
    href="/"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isMobile ? '40px' : '44px',
      height: isMobile ? '40px' : '44px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      textDecoration: 'none',
      fontSize: isMobile ? '1.2rem' : '1.4rem',
      transition: modernChatTheme.transitions.normal,
      backdropFilter: 'blur(10px)'
    }}
    onMouseEnter={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
    aria-label="Voltar ao início"
  >
    ←
  </Link>
);

const HistoryToggle = ({ 
  onToggle, 
  isActive, 
  isMobile 
}: { 
  onToggle?: () => void; 
  isActive?: boolean; 
  isMobile?: boolean; 
}) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isMobile ? '40px' : '44px',
      height: isMobile ? '40px' : '44px',
      borderRadius: '50%',
      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: 'none',
      fontSize: isMobile ? '1.1rem' : '1.2rem',
      cursor: 'pointer',
      transition: modernChatTheme.transitions.normal,
      backdropFilter: 'blur(10px)'
    }}
    onMouseEnter={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = isActive ? 
          'rgba(255, 255, 255, 0.2)' : 
          'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
    title={isActive ? 'Fechar conversas' : 'Mostrar conversas'}
    aria-label={isActive ? 'Fechar conversas' : 'Mostrar conversas'}
  >
    💬
  </button>
);

const ExportButton = ({ 
  onExport, 
  isMobile,
  disabled = false
}: { 
  onExport?: () => void; 
  isMobile?: boolean;
  disabled?: boolean;
}) => (
  <button
    onClick={onExport}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isMobile ? '40px' : '44px',
      height: isMobile ? '40px' : '44px',
      borderRadius: '50%',
      background: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
      color: disabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
      border: 'none',
      fontSize: isMobile ? '1.1rem' : '1.2rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: modernChatTheme.transitions.normal,
      backdropFilter: 'blur(10px)',
      opacity: disabled ? 0.5 : 1
    }}
    onMouseEnter={(e) => {
      if (!isMobile && !disabled) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile && !disabled) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
    title={disabled ? "Nenhuma conversa para exportar" : "Exportar conversa"}
    aria-label={disabled ? "Nenhuma conversa para exportar" : "Exportar conversa"}
  >
    📤
  </button>
);

const PersonaIndicator = ({ 
  persona, 
  personaId,
  isMobile 
}: { 
  persona?: Persona | null; 
  personaId?: string;
  isMobile?: boolean; 
}) => {
  if (!persona || !isMobile) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.sm,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getPersonaColors(personaId || 'gasnelio').primary
        }}
      />
      <span
        style={{
          color: 'white',
          fontSize: modernChatTheme.typography.meta.fontSize,
          fontWeight: '500'
        }}
      >
        {persona.name}
      </span>
    </div>
  );
};

export default function ModernChatHeader({
  personas,
  selectedPersona,
  onPersonaChange,
  isMobile = false,
  onHistoryToggle,
  onExport,
  showHistory = false,
  hasMessages = false
}: ModernChatHeaderProps) {
  const currentPersona = selectedPersona ? personas[selectedPersona] : null;
  const colors = currentPersona ? getPersonaColors(selectedPersona || 'gasnelio') : null;

  return (
    <header
      className="modern-chat-header"
      style={{
        background: colors?.gradient || modernChatTheme.colors.personas.gasnelio.gradient,
        color: 'white',
        padding: isMobile ? 
          `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}` : 
          `${modernChatTheme.spacing.lg} ${modernChatTheme.spacing.xl}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: modernChatTheme.shadows.moderate,
        minHeight: isMobile ? '64px' : '72px',
        position: 'sticky',
        top: 0,
        zIndex: modernChatTheme.zIndex.sticky,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Left Section */}
      <div 
        className="header-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.md
        }}
      >
        <BackButton isMobile={isMobile} />
        <PersonaIndicator persona={currentPersona} personaId={selectedPersona || undefined} isMobile={isMobile} />
      </div>

      {/* Center Section - PersonaSwitch */}
      <div 
        className="header-center"
        style={{
          display: 'flex',
          justifyContent: 'center',
          flex: 1,
          margin: `0 ${modernChatTheme.spacing.md}`
        }}
      >
        <PersonaSwitch
          personas={personas}
          selected={selectedPersona}
          onChange={onPersonaChange}
          isMobile={isMobile}
        />
      </div>

      {/* Right Section */}
      <div 
        className="header-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm
        }}
      >
        {onExport && (
          <ExportButton 
            onExport={onExport} 
            isMobile={isMobile} 
            disabled={!hasMessages}
          />
        )}
        {onHistoryToggle && (
          <HistoryToggle 
            onToggle={onHistoryToggle} 
            isActive={showHistory}
            isMobile={isMobile}
          />
        )}
      </div>

      <style jsx>{`
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .header-center {
            margin: 0 ${modernChatTheme.spacing.sm} !important;
          }
          
          .modern-chat-header {
            flex-wrap: wrap;
            gap: ${modernChatTheme.spacing.sm};
          }
        }

        /* Smooth gradient animation on persona switch */
        .modern-chat-header {
          transition: background ${modernChatTheme.transitions.spring};
        }
      `}</style>
    </header>
  );
}