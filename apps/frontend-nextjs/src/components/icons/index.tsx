/**
 * Biblioteca de Ícones Personalizados
 * Substituindo emojis por ícones SVG profissionais
 */

import React from 'react';

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
}

// Ícone de Seta Voltar
export const ArrowLeftIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// Ícone de Chat/Mensagem
export const ChatIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

// Ícone de Histórico
export const HistoryIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <path d="M3 12a9 9 0 1015-6.3M3 12v-3m0 3h3" />
    <path d="M12 7v5l4 2" />
  </svg>
);

// Ícone de Exportar/Download
export const ExportIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

// Ícone de Menu/Lista
export const MenuIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// Ícone de Fechar
export const CloseIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Ícone de Alerta
export const AlertIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Ícone de Loading/Spinner
export const LoadingIcon: React.FC<IconProps & { spinning?: boolean }> = ({ 
  size = 20, 
  color = 'currentColor', 
  className,
  spinning = true 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={`${className} ${spinning ? 'animate-spin' : ''}`}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeDasharray="31.416" 
      strokeDashoffset="31.416"
    >
      <animate 
        attributeName="stroke-dasharray" 
        dur="2s" 
        values="0 31.416;15.708 15.708;0 31.416;0 31.416" 
        repeatCount="indefinite"
      />
      <animate 
        attributeName="stroke-dashoffset" 
        dur="2s" 
        values="0;-15.708;-31.416;-31.416" 
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

// Ícone de Configurações
export const SettingsIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// Ícone de Info
export const InfoIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// Ícone de Usuário/Persona
export const UserIcon: React.FC<IconProps> = ({ 
  size = 20, 
  color = 'currentColor', 
  className 
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
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Ícone de Toggle/Switch
export const ToggleIcon: React.FC<IconProps & { active?: boolean }> = ({ 
  size = 20, 
  color = 'currentColor', 
  className,
  active = false 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={active ? color : "none"} 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
    <circle cx={active ? "16" : "8"} cy="12" r="3" />
  </svg>
);