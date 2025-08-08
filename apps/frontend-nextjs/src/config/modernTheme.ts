export const modernChatTheme = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      accent: '#F1F5F9'
    },
    
    personas: {
      gasnelio: {
        primary: '#0EA5E9',
        gradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        bubble: '#EFF6FF',
        alpha: 'rgba(14, 165, 233, 0.1)'
      },
      ga: {
        primary: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        bubble: '#ECFDF5',
        alpha: 'rgba(16, 185, 129, 0.1)'
      }
    },
    
    neutral: {
      text: '#0F172A',
      textMuted: '#64748B',
      border: '#E2E8F0',
      divider: '#F1F5F9',
      surface: '#F8FAFC'
    },

    sentiment: {
      positive: '#10B981',
      neutral: '#6B7280',
      negative: '#EF4444',
      empathetic: '#8B5CF6'
    },

    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px'
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '50%',
    bubble: '20px'
  },
  
  typography: {
    message: {
      fontSize: '16px',
      lineHeight: '1.4',
      fontWeight: '400'
    },
    persona: {
      fontSize: '14px',
      lineHeight: '1.3',
      fontWeight: '600'
    },
    meta: {
      fontSize: '12px',
      lineHeight: '1.2',
      fontWeight: '400'
    }
  },
  
  shadows: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.04)',
    moderate: '0 2px 8px rgba(0, 0, 0, 0.08)',
    emphasis: '0 4px 16px rgba(0, 0, 0, 0.12)',
    floating: '0 8px 32px rgba(0, 0, 0, 0.12)'
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    spring: '400ms cubic-bezier(0.4, 0, 0.2, 1)'
  },

  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px'
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1001,
    modal: 1002,
    overlay: 1003,
    tooltip: 1004
  }
};

export type ModernTheme = typeof modernChatTheme;

// Helper para acessar cores das personas
export const getPersonaColors = (personaId: string) => {
  const colors = modernChatTheme.colors.personas;
  return colors[personaId as keyof typeof colors] || colors.gasnelio;
};

// CSS Variables para uso global
export const getCSSVariables = () => {
  const theme = modernChatTheme;
  return {
    '--color-bg-primary': theme.colors.background.primary,
    '--color-bg-secondary': theme.colors.background.secondary,
    '--color-bg-accent': theme.colors.background.accent,
    
    '--color-text': theme.colors.neutral.text,
    '--color-text-muted': theme.colors.neutral.textMuted,
    '--color-border': theme.colors.neutral.border,
    '--color-divider': theme.colors.neutral.divider,
    '--color-surface': theme.colors.neutral.surface,
    
    '--gasnelio-primary': theme.colors.personas.gasnelio.primary,
    '--gasnelio-bubble': theme.colors.personas.gasnelio.bubble,
    '--gasnelio-alpha': theme.colors.personas.gasnelio.alpha,
    
    '--ga-primary': theme.colors.personas.ga.primary,
    '--ga-bubble': theme.colors.personas.ga.bubble,
    '--ga-alpha': theme.colors.personas.ga.alpha,
    
    '--spacing-xs': theme.spacing.xs,
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,
    '--spacing-xl': theme.spacing.xl,
    
    '--radius-sm': theme.borderRadius.sm,
    '--radius-md': theme.borderRadius.md,
    '--radius-lg': theme.borderRadius.lg,
    '--radius-bubble': theme.borderRadius.bubble,
    
    '--shadow-subtle': theme.shadows.subtle,
    '--shadow-moderate': theme.shadows.moderate,
    '--shadow-emphasis': theme.shadows.emphasis,
    
    '--transition-fast': theme.transitions.fast,
    '--transition-normal': theme.transitions.normal,
    '--transition-slow': theme.transitions.slow,
    '--transition-spring': theme.transitions.spring
  };
};