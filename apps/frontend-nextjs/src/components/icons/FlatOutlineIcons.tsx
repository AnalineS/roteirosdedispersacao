/**
 * Flat Outline Icons - Substituição moderna para emojis
 * Ícones limpos e profissionais para melhor UX
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Experiência/Níveis
export const BeginnerIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M12 2L2 7v10c0 5.55 3.84 9 10 9s10-3.45 10-9V7l-10-5Z"/>
    <path d="M12 7v5"/>
    <circle cx="12" cy="16" r="1"/>
  </svg>
);

export const IntermediateIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M3 12h18"/>
    <path d="M3 6h18"/>
    <path d="M3 18h18"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>
);

export const AdvancedIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
  </svg>
);

export const ExpertIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M6 9l6 6 6-6"/>
    <circle cx="12" cy="4" r="2"/>
    <circle cx="12" cy="20" r="2"/>
    <circle cx="5" cy="12" r="2"/>
    <circle cx="19" cy="12" r="2"/>
  </svg>
);

// Profissionais/Roles
export const DoctorIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
    <path d="M14 3v5h5"/>
    <path d="M12 18v-6"/>
    <path d="M9 15h6"/>
  </svg>
);

export const PharmacistIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <rect x="3" y="8" width="18" height="4" rx="1"/>
    <path d="M12 8v13"/>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
  </svg>
);

export const NurseIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M20 6L9 17l-5-5"/>
    <circle cx="12" cy="12" r="9"/>
  </svg>
);

export const StudentIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

// Funcionalidades/Ações
export const QuestionIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export const SupportIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export const ChatIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M13 8H7"/>
    <path d="M17 12H7"/>
  </svg>
);

export const TargetIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export const FastIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
);

export const BookIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

export const CheckIcon = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
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
  >
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

// Função para mapear emojis para ícones
export const getIconForEmoji = (emoji: string, props?: IconProps) => {
  const iconMap: { [key: string]: React.ComponentType<IconProps> } = {
    '🌱': BeginnerIcon,
    '🌿': IntermediateIcon,
    '🌳': AdvancedIcon,
    '⭐': ExpertIcon,
    '👨‍⚕️': DoctorIcon,
    '👩‍⚕️': NurseIcon,
    '💊': PharmacistIcon,
    '🎓': StudentIcon,
    '❓': QuestionIcon,
    '🆘': SupportIcon,
    '🤖': ChatIcon,
    '🎯': TargetIcon,
    '⚡': FastIcon,
    '📖': BookIcon,
    '✅': CheckIcon,
  };

  const IconComponent = iconMap[emoji];
  return IconComponent ? <IconComponent {...props} /> : <span>{emoji}</span>;
};

// Hook para substituir emojis automaticamente
export const useIconReplacement = () => {
  const replaceEmojisWithIcons = (text: string, iconProps?: IconProps) => {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    
    return text.split(emojiRegex).map((part, index) => {
      if (part.match(emojiRegex)) {
        return React.createElement('span', { key: index }, getIconForEmoji(part, iconProps));
      }
      return part;
    });
  };

  return { replaceEmojisWithIcons, getIconForEmoji };
};

export default {
  BeginnerIcon,
  IntermediateIcon,
  AdvancedIcon,
  ExpertIcon,
  DoctorIcon,
  PharmacistIcon,
  NurseIcon,
  StudentIcon,
  QuestionIcon,
  SupportIcon,
  ChatIcon,
  TargetIcon,
  FastIcon,
  BookIcon,
  CheckIcon,
  getIconForEmoji,
  useIconReplacement
};