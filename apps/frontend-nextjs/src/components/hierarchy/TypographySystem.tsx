/**
 * Typography System - ETAPA 2 UX TRANSFORMATION
 * Sistema de tipografia escalável (4 níveis max) para reduzir cognitive load
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - DRY: Níveis reutilizáveis em todo o sistema
 * - Performance: CSS-in-JS otimizado
 * - Medical Context: Hierarquia clara para informações médicas críticas
 */

'use client';

import React, { CSSProperties } from 'react';

// Tipos para o sistema de tipografia
type TypographyLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'micro';
type TypographyContext = 'medical' | 'educational' | 'interface' | 'error' | 'success';
type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TypographyProps {
  level: TypographyLevel;
  context?: TypographyContext;
  weight?: TypographyWeight;
  color?: string;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  maxLines?: number;
  align?: 'left' | 'center' | 'right';
  spacing?: 'tight' | 'normal' | 'loose';
}

// Sistema de escalas tipográficas baseado em proporção áurea (1.618)
const TYPOGRAPHY_SCALES = {
  // Escala Desktop (base 16px)
  desktop: {
    h1: { size: 42, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { size: 32, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { size: 24, lineHeight: 1.4, letterSpacing: '0em' },
    h4: { size: 20, lineHeight: 1.4, letterSpacing: '0em' },
    body: { size: 16, lineHeight: 1.6, letterSpacing: '0em' },
    caption: { size: 14, lineHeight: 1.5, letterSpacing: '0.01em' },
    micro: { size: 12, lineHeight: 1.4, letterSpacing: '0.02em' }
  },
  // Escala Mobile (reduzida para melhor legibilidade)
  mobile: {
    h1: { size: 32, lineHeight: 1.2, letterSpacing: '-0.01em' },
    h2: { size: 26, lineHeight: 1.3, letterSpacing: '-0.005em' },
    h3: { size: 22, lineHeight: 1.4, letterSpacing: '0em' },
    h4: { size: 18, lineHeight: 1.4, letterSpacing: '0em' },
    body: { size: 16, lineHeight: 1.6, letterSpacing: '0em' },
    caption: { size: 14, lineHeight: 1.5, letterSpacing: '0.01em' },
    micro: { size: 12, lineHeight: 1.4, letterSpacing: '0.02em' }
  }
};

// Pesos de fonte
const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};

// Cores contextuais para diferentes tipos de informação
const CONTEXTUAL_COLORS = {
  medical: {
    primary: '#dc2626', // Vermelho para informações críticas
    secondary: '#374151', // Cinza escuro para texto principal
    accent: '#059669' // Verde para informações positivas
  },
  educational: {
    primary: '#2563eb', // Azul para conteúdo educacional
    secondary: '#4b5563',
    accent: '#7c3aed' // Roxo para destaques
  },
  interface: {
    primary: '#111827', // Preto para interface
    secondary: '#6b7280',
    accent: '#3b82f6'
  },
  error: {
    primary: '#dc2626',
    secondary: '#991b1b',
    accent: '#fca5a5'
  },
  success: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#a7f3d0'
  }
};

// Espaçamentos contextuais
const CONTEXTUAL_SPACING = {
  tight: { marginBottom: '0.5rem' },
  normal: { marginBottom: '1rem' },
  loose: { marginBottom: '1.5rem' }
};

export function Typography({
  level,
  context = 'interface',
  weight = 'normal',
  color,
  children,
  className = '',
  style = {},
  as,
  maxLines,
  align = 'left',
  spacing = 'normal',
  ...props
}: TypographyProps) {
  // Detectar se é mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const scale = isMobile ? TYPOGRAPHY_SCALES.mobile : TYPOGRAPHY_SCALES.desktop;
  
  // Determinar tag HTML baseada no nível
  const getDefaultTag = (): keyof JSX.IntrinsicElements => {
    if (as) return as;
    
    switch (level) {
      case 'h1': return 'h1';
      case 'h2': return 'h2';
      case 'h3': return 'h3';
      case 'h4': return 'h4';
      case 'body': return 'p';
      case 'caption': return 'span';
      case 'micro': return 'small';
      default: return 'p';
    }
  };

  // Construir estilos
  const typographyStyles: CSSProperties = {
    fontSize: `${scale[level].size}px`,
    lineHeight: scale[level].lineHeight,
    letterSpacing: scale[level].letterSpacing,
    fontWeight: FONT_WEIGHTS[weight],
    color: color || CONTEXTUAL_COLORS[context].primary,
    textAlign: align,
    margin: 0,
    ...CONTEXTUAL_SPACING[spacing],
    fontFamily: 'system-ui, -apple-system, sans-serif',
    
    // Tratamento para maxLines (text truncation)
    ...(maxLines && {
      display: '-webkit-box',
      WebkitLineClamp: maxLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }),
    
    // Merge com estilos customizados
    ...style
  };

  // Criar componente dinamicamente
  const Component = getDefaultTag();

  return (
    <Component
      className={`typography-${level} typography-${context} ${className}`}
      style={typographyStyles}
      {...props}
    >
      {children}
    </Component>
  );
}

// Componentes de conveniência para níveis específicos
export const Heading1 = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="h1" weight="bold" spacing="loose" {...props} />
);

export const Heading2 = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="h2" weight="semibold" spacing="normal" {...props} />
);

export const Heading3 = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="h3" weight="semibold" spacing="normal" {...props} />
);

export const Heading4 = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="h4" weight="medium" spacing="normal" {...props} />
);

export const BodyText = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="body" weight="normal" spacing="normal" {...props} />
);

export const Caption = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="caption" weight="normal" context="interface" {...props} />
);

export const MicroText = (props: Omit<TypographyProps, 'level'>) => (
  <Typography level="micro" weight="normal" context="interface" {...props} />
);

// Componentes especializados para contexto médico
export const MedicalHeading = (props: Omit<TypographyProps, 'level' | 'context'>) => (
  <Typography level="h2" context="medical" weight="bold" spacing="normal" {...props} />
);

export const MedicalWarning = (props: Omit<TypographyProps, 'level' | 'context'>) => (
  <Typography level="body" context="error" weight="semibold" spacing="tight" {...props} />
);

export const MedicalSuccess = (props: Omit<TypographyProps, 'level' | 'context'>) => (
  <Typography level="body" context="success" weight="medium" spacing="tight" {...props} />
);

// Hook para usar tipografia programaticamente
export function useTypography() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const scale = isMobile ? TYPOGRAPHY_SCALES.mobile : TYPOGRAPHY_SCALES.desktop;
  
  const getTypographyStyle = (
    level: TypographyLevel,
    context: TypographyContext = 'interface',
    weight: TypographyWeight = 'normal'
  ): CSSProperties => ({
    fontSize: `${scale[level].size}px`,
    lineHeight: scale[level].lineHeight,
    letterSpacing: scale[level].letterSpacing,
    fontWeight: FONT_WEIGHTS[weight],
    color: CONTEXTUAL_COLORS[context].primary,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  });

  return { getTypographyStyle, scale, colors: CONTEXTUAL_COLORS };
}

// Provider para configurações globais de tipografia
interface TypographyProviderProps {
  children: React.ReactNode;
  customFontFamily?: string;
  customScale?: typeof TYPOGRAPHY_SCALES.desktop;
}

export function TypographyProvider({ 
  children, 
  customFontFamily,
  customScale 
}: TypographyProviderProps) {
  React.useEffect(() => {
    if (customFontFamily || customScale) {
      // Aplicar configurações globais via CSS custom properties
      const root = document.documentElement;
      
      if (customFontFamily) {
        root.style.setProperty('--typography-font-family', customFontFamily);
      }
      
      if (customScale) {
        Object.entries(customScale).forEach(([level, config]) => {
          root.style.setProperty(`--typography-${level}-size`, `${config.size}px`);
          root.style.setProperty(`--typography-${level}-line-height`, `${config.lineHeight}`);
          root.style.setProperty(`--typography-${level}-letter-spacing`, config.letterSpacing);
        });
      }
    }
  }, [customFontFamily, customScale]);

  return <>{children}</>;
}

export default Typography;