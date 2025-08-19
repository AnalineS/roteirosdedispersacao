'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import PersonaSwitch from './PersonaSwitch';
import { 
  ArrowLeftIcon, 
  HistoryIcon, 
  ExportIcon, 
  MenuIcon, 
  CloseIcon,
  InfoIcon 
} from '@/components/icons';

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
      gap: modernChatTheme.spacing.sm,
      padding: `${modernChatTheme.spacing.sm} ${isMobile ? modernChatTheme.spacing.sm : modernChatTheme.spacing.md}`,
      borderRadius: modernChatTheme.borderRadius.md,
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      textDecoration: 'none',
      fontSize: modernChatTheme.typography.meta.fontSize,
      fontWeight: '500',
      transition: modernChatTheme.transitions.normal,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}
    onMouseEnter={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    }}
    aria-label="Voltar ao início"
  >
    <ArrowLeftIcon size={16} />
    {!isMobile && <span>Início</span>}
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
      gap: modernChatTheme.spacing.sm,
      padding: `${modernChatTheme.spacing.sm} ${isMobile ? modernChatTheme.spacing.sm : modernChatTheme.spacing.md}`,
      borderRadius: modernChatTheme.borderRadius.md,
      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
      fontSize: modernChatTheme.typography.meta.fontSize,
      fontWeight: '500',
      cursor: 'pointer',
      transition: modernChatTheme.transitions.normal,
      backdropFilter: 'blur(10px)'
    }}
    onMouseEnter={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile) {
        e.currentTarget.style.background = isActive ? 
          'rgba(255, 255, 255, 0.2)' : 
          'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isActive ? 
          'rgba(255, 255, 255, 0.3)' : 
          'rgba(255, 255, 255, 0.1)';
      }
    }}
    title={isActive ? 'Fechar histórico' : 'Mostrar histórico'}
    aria-label={isActive ? 'Fechar histórico' : 'Mostrar histórico'}
  >
    {isActive ? <CloseIcon size={16} /> : <HistoryIcon size={16} />}
    {!isMobile && <span>{isActive ? 'Fechar' : 'Histórico'}</span>}
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
      gap: modernChatTheme.spacing.sm,
      padding: `${modernChatTheme.spacing.sm} ${isMobile ? modernChatTheme.spacing.sm : modernChatTheme.spacing.md}`,
      borderRadius: modernChatTheme.borderRadius.md,
      background: disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
      color: disabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
      border: `1px solid ${disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'}`,
      fontSize: modernChatTheme.typography.meta.fontSize,
      fontWeight: '500',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: modernChatTheme.transitions.normal,
      backdropFilter: 'blur(10px)',
      opacity: disabled ? 0.6 : 1
    }}
    onMouseEnter={(e) => {
      if (!isMobile && !disabled) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile && !disabled) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    }}
    title={disabled ? "Nenhuma conversa para exportar" : "Exportar conversa"}
    aria-label={disabled ? "Nenhuma conversa para exportar" : "Exportar conversa"}
  >
    <ExportIcon size={16} />
    {!isMobile && <span>Exportar</span>}
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

  const avatarSrc = personaId === 'dr_gasnelio' ? '/images/avatars/dr-gasnelio.png' : '/images/avatars/ga.png';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.sm,
        background: 'rgba(255, 255, 255, 0.15)',
        padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Image 
        src={avatarSrc}
        alt={persona.name}
        width={20}
        height={20}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          objectFit: 'cover'
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
        minHeight: isMobile ? '88px' : '100px',
        position: 'sticky',
        top: 0,
        zIndex: modernChatTheme.zIndex.sticky,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Top Row - Navigation & Status */}
      <div 
        className="header-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: isMobile ? '0' : modernChatTheme.spacing.sm
        }}
      >
        {/* Left - Back button */}
        <div className="header-navigation">
          <BackButton isMobile={isMobile} />
        </div>
        
        {/* Right - Actions (sem botão de histórico) */}
        <div 
          className="header-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}
        >
          {/* Toggle de Personas */}
          <div style={{ marginRight: modernChatTheme.spacing.sm }}>
            <PersonaSwitch
              personas={personas}
              selected={selectedPersona}
              onChange={onPersonaChange}
              isMobile={isMobile}
            />
          </div>
          {onExport && (
            <ExportButton 
              onExport={onExport} 
              isMobile={isMobile} 
              disabled={!hasMessages}
            />
          )}
        </div>
      </div>

      {/* Bottom Row - Persona Info (mobile) */}
      {isMobile && (
        <div 
          className="header-personas"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: modernChatTheme.spacing.sm
          }}
        >
          <PersonaIndicator 
            persona={currentPersona} 
            personaId={selectedPersona || undefined} 
            isMobile={isMobile} 
          />
        </div>
      )}

      <style jsx>{`
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .header-top {
            margin-bottom: ${modernChatTheme.spacing.sm} !important;
          }
          
          .header-actions {
            gap: ${modernChatTheme.spacing.xs} !important;
          }
          
          .modern-chat-header {
            padding: ${modernChatTheme.spacing.md} ${modernChatTheme.spacing.md} !important;
            min-height: 88px !important;
          }
          
          .header-personas {
            margin-top: ${modernChatTheme.spacing.sm};
          }
        }

        /* Smooth gradient animation on persona switch */
        .modern-chat-header {
          transition: background ${modernChatTheme.transitions.spring};
        }
        
        /* Improved button hover effects */
        .header-actions button:hover,
        .header-navigation a:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </header>
  );
}