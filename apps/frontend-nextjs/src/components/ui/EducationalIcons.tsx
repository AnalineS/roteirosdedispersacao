'use client';

import React from 'react';

/**
 * Sistema de Ícones Profissionais para Recursos Educativos
 * Substitui emojis por ícones SVG profissionais
 * Baseado nas validações UX da Fase 4.2
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

// Ícones Educacionais
export const GraduationCapIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Educação'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="m22 10-10-5L2 10l10 5 10-5Z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Material de estudo'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Objetivos'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

// Ícones Clínicos
export const StethoscopeIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Médico'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
    <circle cx="20" cy="10" r="2"/>
  </svg>
);

export const PillIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Medicamento'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
    <path d="m8.5 8.5 7 7"/>
  </svg>
);

export const HeartPulseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Saúde'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5Z"/>
    <path d="M12 5L8 21l4-7 4 7-4-16"/>
  </svg>
);

// Ícones de Navegação
export const ChevronRightIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Próximo'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Anterior'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Iniciar'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

// Ícones de Status
export const CheckCircleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Concluído'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="m9 11 3 3L22 4"/>
  </svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Atenção'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="m12 17 .01 0"/>
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Bloqueado'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// Ícones de Funcionalidades
export const CalculatorIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Calculadora'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <rect width="16" height="20" x="4" y="2" rx="2"/>
    <line x1="8" x2="16" y1="6" y2="6"/>
    <line x1="16" x2="16" y1="14" y2="18"/>
    <path d="M16 10h.01"/>
    <path d="M12 10h.01"/>
    <path d="M8 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M8 14h.01"/>
    <path d="M8 18h.01"/>
  </svg>
);

export const ClipboardListIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Lista de verificação'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <rect width="8" height="4" x="8" y="2" rx="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11h4"/>
    <path d="M12 16h4"/>
    <path d="M8 11h.01"/>
    <path d="M8 16h.01"/>
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Cronograma'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <path d="M3 10h18"/>
  </svg>
);

export const CertificateIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Certificado'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M15 3v6l-3-1-3 1V3"/>
    <path d="M9 18H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-4"/>
    <path d="M9 18v6l3-2 3 2v-6"/>
  </svg>
);

// Ícones de Interação
export const SearchIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Buscar'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Filtrar'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Visualizar'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Ícones de Ações
export const DownloadIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Baixar'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Compartilhar'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16,6 12,2 8,6"/>
    <line x1="12" x2="12" y1="2" y2="15"/>
  </svg>
);

export const MailIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Email'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

// Ícones de Categorias de Caso
export const BabyIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Pediatria'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M9 12h6l-3 9-3-9Z"/>
    <path d="M4 12h16"/>
    <circle cx="12" cy="5" r="3"/>
    <path d="M12 2v3"/>
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Adulto'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Gravidez'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
  </svg>
);

export const FlaskIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Interações medicamentosas'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M10 2v7.527c0 .72-.284 1.41-.796 1.922L3.95 16.69A2 2 0 0 0 5.36 20H18.64a2 2 0 0 0 1.41-3.31L14.8 11.45a2.7 2.7 0 0 1-.8-1.923V2"/>
    <path d="M8.5 2h7"/>
    <path d="M7 16h10"/>
  </svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Complicações'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

// Ícones de Métricas
export const ClockIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Tempo'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  'aria-label': ariaLabel = 'Conquista'
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    aria-label={ariaLabel}
    role="img"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.73 13 20.44 13 22h-2"/>
    <path d="M14 14.66V17c0 .55-.47.98-.97 1.21C11.96 18.73 11 20.44 11 22h2"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

// Mapa de substituição emoji -> ícone
export const EMOJI_TO_ICON_MAP = {
  '🎓': GraduationCapIcon,
  '📚': BookOpenIcon, 
  '🎯': TargetIcon,
  '👨‍⚕️': StethoscopeIcon,
  '💊': PillIcon,
  '❤️': HeartPulseIcon,
  '▶️': PlayIcon,
  '✅': CheckCircleIcon,
  '⚠️': AlertTriangleIcon,
  '🔒': LockIcon,
  '🧮': CalculatorIcon,
  '📋': ClipboardListIcon,
  '📅': CalendarIcon,
  '🏆': CertificateIcon,
  '🔍': SearchIcon,
  '🔧': FilterIcon,
  '👁️': EyeIcon,
  '📤': DownloadIcon,
  '🔗': ShareIcon,
  '📧': MailIcon,
  '👶': BabyIcon,
  '👤': UserIcon,
  '🤱': HeartIcon,
  '⚗️': FlaskIcon,
  '🚨': AlertCircleIcon,
  '⏱️': ClockIcon,
  '🏅': TrophyIcon
} as const;

// Função helper para obter ícone
export const getIconFromEmoji = (emoji: string) => {
  return EMOJI_TO_ICON_MAP[emoji as keyof typeof EMOJI_TO_ICON_MAP] || null;
};

// Export de todos os ícones
export const EducationalIcons = {
  GraduationCapIcon,
  BookOpenIcon,
  TargetIcon,
  StethoscopeIcon,
  PillIcon,
  HeartPulseIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  LockIcon,
  CalculatorIcon,
  ClipboardListIcon,
  CalendarIcon,
  CertificateIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon,
  DownloadIcon,
  ShareIcon,
  MailIcon,
  BabyIcon,
  UserIcon,
  HeartIcon,
  FlaskIcon,
  AlertCircleIcon,
  ClockIcon,
  TrophyIcon,
  getIconFromEmoji,
  EMOJI_TO_ICON_MAP
};

export default EducationalIcons;