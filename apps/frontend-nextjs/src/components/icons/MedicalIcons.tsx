/**
 * Biblioteca de Ícones Médicos SVG
 * Sistema completo de ícones para substituir emojis em contextos médicos
 */

import React from 'react';

export interface IconProps {
  size?: string | number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Ícones médicos principais
export const PillIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M12 2L22 12L12 22L2 12L12 2Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M8 8L16 16" stroke={color} strokeWidth="2"/>
  </svg>
);

export const StethoscopeIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M4.8 2.3A.3.3 0 1 0 4.2 2.7L4.8 2.3zM3 6v1a3 3 0 0 0 3 3h1m0-4a2 2 0 1 1 4 0v4a2 2 0 1 1-4 0V6ZM13 6v1a3 3 0 0 1-3 3H9m0-4a2 2 0 1 0-4 0v4a2 2 0 1 0 4 0V6Zm6.7 7.7a2.5 2.5 0 1 1-3.5 3.5 2.5 2.5 0 0 1 3.5-3.5Z" 
      stroke={color} 
      strokeWidth="2"
    />
  </svg>
);

export const HeartIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ShieldIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const UserMedicalIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2"/>
    <path d="M22 12h-4" stroke={color} strokeWidth="2"/>
    <path d="M20 10v4" stroke={color} strokeWidth="2"/>
  </svg>
);

export const BookMedicalIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" 
      stroke={color} 
      strokeWidth="2"
    />
    <path d="M12 8v4" stroke={color} strokeWidth="2"/>
    <path d="M10 10h4" stroke={color} strokeWidth="2"/>
  </svg>
);

export const HospitalIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M12 6v4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M14 8h-4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M12 2L3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-9-5z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const SyringeIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M6 12h12l3 3-3 3H6l-3-3 3-3z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M9 12V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5" stroke={color} strokeWidth="2"/>
    <path d="M11 4h2" stroke={color} strokeWidth="2"/>
  </svg>
);

// Ícones de urgência e estado
export const AlertTriangleIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2"/>
  </svg>
);

export const CheckCircleIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <polyline points="22,4 12,14.01 9,11.01" stroke={color} strokeWidth="2"/>
  </svg>
);

export const ClockIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <polyline points="12,6 12,12 16,14" stroke={color} strokeWidth="2"/>
  </svg>
);

export const InfoIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2"/>
  </svg>
);

// Ícones de navegação
export const HomeIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <polyline points="9,22 9,12 15,12 15,22" stroke={color} strokeWidth="2"/>
  </svg>
);

export const BookOpenIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const MessageCircleIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const SettingsIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <path 
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Ícones educacionais
export const GraduationCapIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <path 
      d="M22 10v6M2 10l10-5 10 5-10 5z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M6 12v5c3 3 9 3 12 0v-5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const AwardIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <circle cx="12" cy="8" r="7" stroke={color} strokeWidth="2"/>
    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" stroke={color} strokeWidth="2"/>
  </svg>
);

export const CalculatorIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth="2"/>
    <line x1="16" y1="10" x2="16" y2="10" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="10" x2="12" y2="10" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="10" x2="8" y2="10" stroke={color} strokeWidth="2"/>
    <line x1="16" y1="14" x2="16" y2="14" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="14" x2="12" y2="14" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="14" x2="8" y2="14" stroke={color} strokeWidth="2"/>
    <line x1="16" y1="18" x2="16" y2="18" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="18" x2="12" y2="18" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="18" x2="8" y2="18" stroke={color} strokeWidth="2"/>
  </svg>
);

export const StarIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <polygon 
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Ícone customizado do chatbot com estilo médico
export const ChatBotMedicalIcon = ({ size = 24, color = 'currentColor', className, style }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    style={style}
  >
    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="5" r="2" stroke={color} strokeWidth="2"/>
    <path d="M12 7v4" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="16" x2="8" y2="16" stroke={color} strokeWidth="2"/>
    <line x1="16" y1="16" x2="16" y2="16" stroke={color} strokeWidth="2"/>
    <path d="M9 19h6" stroke={color} strokeWidth="2"/>
  </svg>
);

// Função para mapear emojis para ícones
export const emojiToIcon = (emoji: string, props?: IconProps) => {
  const iconMap: Record<string, React.ComponentType<IconProps>> = {
    '💊': PillIcon,
    '🩺': StethoscopeIcon,
    '❤️': HeartIcon,
    '🛡️': ShieldIcon,
    '👨‍⚕️': UserMedicalIcon,
    '👩‍⚕️': UserMedicalIcon,
    '📚': BookMedicalIcon,
    '🏥': HospitalIcon,
    '💉': SyringeIcon,
    '⚠️': AlertTriangleIcon,
    '✅': CheckCircleIcon,
    '🕐': ClockIcon,
    'ℹ️': InfoIcon,
    '🏠': HomeIcon,
    '📖': BookOpenIcon,
    '💬': MessageCircleIcon,
    '⚙️': SettingsIcon,
    '🎓': GraduationCapIcon,
    '🏆': AwardIcon,
    '🧮': CalculatorIcon,
    '🌟': StarIcon,
    '🤖': ChatBotMedicalIcon
  };

  const IconComponent = iconMap[emoji];
  return IconComponent ? <IconComponent {...props} /> : <span>{emoji}</span>;
};

// Hook para usar ícones médicos
export const useMedicalIcons = () => {
  const getIcon = (type: string, props?: IconProps) => {
    const typeMap: Record<string, React.ComponentType<IconProps>> = {
      pill: PillIcon,
      stethoscope: StethoscopeIcon,
      heart: HeartIcon,
      shield: ShieldIcon,
      user: UserMedicalIcon,
      book: BookMedicalIcon,
      hospital: HospitalIcon,
      syringe: SyringeIcon,
      alert: AlertTriangleIcon,
      success: CheckCircleIcon,
      clock: ClockIcon,
      info: InfoIcon,
      home: HomeIcon,
      chat: MessageCircleIcon,
      settings: SettingsIcon,
      education: GraduationCapIcon,
      award: AwardIcon,
      calculator: CalculatorIcon,
      star: StarIcon,
      chatbot: ChatBotMedicalIcon
    };

    const IconComponent = typeMap[type];
    return IconComponent ? <IconComponent {...props} /> : null;
  };

  return { getIcon, emojiToIcon };
};

const MedicalIcons = {
  PillIcon,
  StethoscopeIcon,
  HeartIcon,
  ShieldIcon,
  UserMedicalIcon,
  BookMedicalIcon,
  HospitalIcon,
  SyringeIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  HomeIcon,
  BookOpenIcon,
  MessageCircleIcon,
  SettingsIcon,
  GraduationCapIcon,
  AwardIcon,
  CalculatorIcon,
  StarIcon,
  ChatBotMedicalIcon,
  emojiToIcon,
  useMedicalIcons
};

export default MedicalIcons;