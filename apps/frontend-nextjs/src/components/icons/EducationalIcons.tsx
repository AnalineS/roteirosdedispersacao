/**
 * Ícones Educacionais Profissionais
 * Sistema completo de ícones SVG para substituir emojis nos recursos educativos
 * Desenvolvido para o Sistema de Capacitação em Hanseníase PQT-U
 */

import React from 'react';

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
}

// ÍCONES EDUCACIONAIS PRINCIPAIS

// Ícone de Graduação/Educação (substitui 🎓)
export const GraduationIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

// Ícone de Alvo/Target (substitui 🎯)
export const TargetIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Ícone de Estrela (substitui 🌟)
export const StarIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

// Ícone de Laboratório/Microscópio (substitui 🔬)
export const MicroscopeIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M6 18h8" />
    <path d="M3 22h18" />
    <path d="M14 22a7 7 0 100-14h-1" />
    <path d="M9 14h.01" />
    <path d="M9 12a2 2 0 01-2-2V6l6-4 6 4v4a2 2 0 01-2 2" />
  </svg>
);

// Ícone de Livro/Biblioteca (substitui 📚)
export const BookIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

// Ícone de Foguete/Launch (substitui 🚀)
export const RocketIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

// ÍCONES PARA CATEGORIAS CLÍNICAS

// Ícone de Pediatria/Criança (substitui 👶)
export const ChildIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 10-16 0" />
    <circle cx="12" cy="8" r="2" />
  </svg>
);

// Ícone de Profissional de Saúde (substitui 👨‍⚕️)
export const DoctorIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M12 14v7" />
    <path d="M9 17h6" />
  </svg>
);

// Ícone de Gravidez/Maternidade (substitui 🤱)
export const PregnancyIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <circle cx="12" cy="8" r="3" />
    <path d="M12 11c-2 0-4 1-4 4v6h8v-6c0-3-2-4-4-4z" />
    <ellipse cx="12" cy="17" rx="3" ry="2" />
  </svg>
);

// Ícone de Medicamento/Pílula (substitui 💊)
export const PillIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <rect x="4" y="4" width="16" height="16" rx="8" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

// Ícone de Calculadora (substitui 🧮)
export const CalculatorIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="16" y1="10" x2="16" y2="10" />
    <line x1="12" y1="10" x2="12" y2="10" />
    <line x1="8" y1="10" x2="8" y2="10" />
    <line x1="16" y1="14" x2="16" y2="14" />
    <line x1="12" y1="14" x2="12" y2="14" />
    <line x1="8" y1="14" x2="8" y2="14" />
    <line x1="16" y1="18" x2="16" y2="18" />
    <line x1="12" y1="18" x2="12" y2="18" />
    <line x1="8" y1="18" x2="8" y2="18" />
  </svg>
);

// ÍCONES PARA ESTADO E NAVEGAÇÃO

// Ícone de Checklist/Lista (substitui 📋)
export const ChecklistIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

// Ícone de Relógio/Tempo (substitui ⏱️)
export const ClockIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

// Ícone de Troféu (substitui 🏆)
export const TrophyIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.75 13.06 19 14 19s1.96-.25 3.03-.79c.5-.23.97-.66.97-1.21v-2.34" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);

// Ícone de Email (substitui 📧)
export const MailIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

// Ícone de Download/Arquivo (substitui 📄)
export const FileDownloadIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 9,10" />
  </svg>
);

// Ícone de Gráfico/Estatísticas (substitui 📊)
export const ChartIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

// Ícone de Cadeado Fechado (substitui 🔒)
export const LockIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <circle cx="12" cy="16" r="1" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

// Ícone de Check/Sucesso (substitui ✅)
export const CheckCircleIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

// Ícone de Atualizar/Sync (substitui 🔄)
export const RefreshIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
  </svg>
);

// Ícone de Olho/Visualizar (substitui 👁️)
export const EyeIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Ícone de Busca/Lupa (substitui 🔍)
export const SearchIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

// Ícone de Calendário (substitui 📅)
export const CalendarIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Ícone de Casa/Home (substitui 🏠)
export const HomeIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

// ÍCONES ESPECIAIS

// Ícone de Setas Duplas (substitui 🔼/🔽)
export const ChevronUpIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <polyline points="18,15 12,9 6,15" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

// Ícone de Bulbo/Ideia (substitui 💡)
export const LightbulbIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <path d="M9 21h6" />
    <path d="M12 21v-8" />
    <path d="M12 13a7 7 0 100-14 7 7 0 000 14z" />
  </svg>
);

// Ícone de Raio/Energia (substitui ⚡)
export const ZapIcon: React.FC<IconProps> = ({ 
  size = 24, 
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
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
);

// Ícone de Triângulo de Alerta (substitui ⚠️)
export const AlertTriangleIcon: React.FC<IconProps> = ({ 
  size = 24, 
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

// MAPEAMENTO PARA FACILITAR SUBSTITUIÇÃO
export const EMOJI_TO_ICON_MAP = {
  '🎓': GraduationIcon,
  '🎯': TargetIcon,
  '🌟': StarIcon,
  '🔬': MicroscopeIcon,
  '📚': BookIcon,
  '🚀': RocketIcon,
  '👶': ChildIcon,
  '👨‍⚕️': DoctorIcon,
  '🤱': PregnancyIcon,
  '💊': PillIcon,
  '⚠️': AlertTriangleIcon,
  '🧮': CalculatorIcon,
  '📋': ChecklistIcon,
  '⏱️': ClockIcon,
  '🏆': TrophyIcon,
  '📧': MailIcon,
  '📄': FileDownloadIcon,
  '📊': ChartIcon,
  '🔒': LockIcon,
  '✅': CheckCircleIcon,
  '🔄': RefreshIcon,
  '👁️': EyeIcon,
  '🔍': SearchIcon,
  '📅': CalendarIcon,
  '🏠': HomeIcon,
  '🔼': ChevronUpIcon,
  '🔽': ChevronDownIcon,
  '💡': LightbulbIcon,
  '⚡': ZapIcon,
  '🔗': FileDownloadIcon, // Usar ícone de exportar existente
  '💬': MailIcon, // Usar ícone de chat existente
  '📱': BookIcon, // QR Code simplificado
  '👤': ChildIcon, // Usar ícone existente
  '✕': RefreshIcon // Usar ícone existente
} as const;

// Função utilitária para obter ícone por emoji
export const getIconForEmoji = (emoji: string) => {
  return EMOJI_TO_ICON_MAP[emoji as keyof typeof EMOJI_TO_ICON_MAP] || null;
};