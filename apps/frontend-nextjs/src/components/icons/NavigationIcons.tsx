/**
 * Biblioteca de Ícones de Navegação - Padrão UnB
 * Substituindo emojis por ícones SVG profissionais
 * Baseado nas cores institucionais da UnB
 */

import React from 'react';

interface NavigationIconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'unb' | 'persona-gasnelio' | 'persona-ga';
}

// Cores UnB Institucionais
const unbColors = {
  primary: '#003366',      // Azul institucional UnB
  secondary: '#0066CC',    // Azul secundário
  accent: '#00AA44',       // Verde complementar
  neutral: '#666666',      // Cinza neutro
  white: '#FFFFFF'         // Branco
};

// Cores das personas (mantém compatibilidade)
const personaColors = {
  gasnelio: '#0EA5E9',     // Azul Dr. Gasnelio
  ga: '#10B981'            // Verde Gá
};

const getIconColor = (variant?: string, customColor?: string) => {
  if (customColor) return customColor;
  
  switch (variant) {
    case 'unb': return unbColors.primary;
    case 'persona-gasnelio': return personaColors.gasnelio;
    case 'persona-ga': return personaColors.ga;
    default: return 'currentColor';
  }
};

// 📚 → BookOpen (Aprendizagem)
export const LearningIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className,
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    style={style} 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

// 💬 → MessageCircle (Interação)
export const InteractionIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

// 🛠️ → Settings (Ferramentas)
export const ToolsIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// 📈 → TrendingUp (Progresso)
export const ProgressIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
    <polyline points="16,7 22,7 22,13" />
  </svg>
);

// 🏠 → Home (Início)
export const HomeIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

// 📖 → BookMarked (Módulos)
export const ModulesIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <path d="M10 2v8l3-3 3 3V2" />
  </svg>
);

// 📊 → BarChart3 (Dashboard)
export const DashboardIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

// 🤖 → Bot (Chat)
export const ChatBotIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

// 🎯 → Target (Recursos)
export const ResourcesIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// 🔬 → Microscope (Hanseníase)
export const MicroscopeIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 18h8" />
    <path d="M3 22h18" />
    <path d="M14 22a7 7 0 100-14h-1" />
    <path d="M9 7h2" />
    <path d="M9 12h2" />
    <path d="M9 17h2" />
    <circle cx="12" cy="5" r="3" />
  </svg>
);

// 🩺 → Stethoscope (Diagnóstico)
export const DiagnosisIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.2.3" />
    <path d="M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

// 💊 → Pill (Tratamento)
export const TreatmentIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.5 20.5L3 13a7 7 0 1110-10l7.5 7.5a7 7 0 11-10 10z" />
    <path d="M8.5 8.5l7 7" />
  </svg>
);

// 🧮 → Calculator (Calculadora)
export const CalculatorIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="16" y1="14" x2="16" y2="14" />
    <path d="M16 10l0 .01" />
    <path d="M12 10l0 .01" />
    <path d="M8 10l0 .01" />
    <path d="M12 14l0 .01" />
    <path d="M8 14l0 .01" />
    <path d="M12 18l0 .01" />
    <path d="M8 18l0 .01" />
  </svg>
);

// ✅ → CheckSquare (Checklist)
export const ChecklistIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9,11 12,14 22,4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

// 🏥 → Building2 (Logo Sistema)
export const SystemLogoIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18Z" />
    <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
    <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

// 🎓 → GraduationCap (Institucional/Tese)
export const InstitutionalIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

// Ícones de navegação mobile
export const MenuIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
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

export const CloseIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Ícones de setas
export const ChevronDownIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color,
  variant,
  className,
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24"
    style={style} 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

// Exportar paleta de cores para uso externo
export { unbColors, personaColors };

// Helper para mapear emoji para componente React
// ❤️ → Heart (Vida/Qualidade de Vida)
export const HeartIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color, 
  variant, 
  className, 
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// 🌟 → Star (Destaque/Qualidade)
export const StarIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color, 
  variant, 
  className, 
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

// ❓ → Help Circle (FAQ)
export const HelpIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color, 
  variant, 
  className, 
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

// 🤔 → User Check (Perfil/Escolha)
export const UserCheckIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color, 
  variant, 
  className, 
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17,11 19,13 23,9" />
  </svg>
);

// 📞 → Phone (Suporte)
export const PhoneIcon: React.FC<NavigationIconProps> = ({ 
  size = 20, 
  color, 
  variant, 
  className, 
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={getIconColor(variant, color)} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const getIconByEmoji = (emoji: string): React.FC<NavigationIconProps> => {
  const emojiMap: Record<string, React.FC<NavigationIconProps>> = {
    '📚': LearningIcon,
    '💬': InteractionIcon,
    '🛠️': ToolsIcon,
    '📈': ProgressIcon,
    '🏠': HomeIcon,
    '📖': ModulesIcon,
    '📊': DashboardIcon,
    '🤖': ChatBotIcon,
    '🎯': ResourcesIcon,
    '🔬': MicroscopeIcon,
    '🩺': DiagnosisIcon,
    '💊': TreatmentIcon,
    '🧮': CalculatorIcon,
    '✅': ChecklistIcon,
    '🏥': SystemLogoIcon,
    '🎓': InstitutionalIcon,
    '❤️': HeartIcon,
    '🌟': StarIcon,
    '❓': HelpIcon,
    '🤔': UserCheckIcon,
    '📞': PhoneIcon
  };
  
  return emojiMap[emoji] || HomeIcon; // fallback
};