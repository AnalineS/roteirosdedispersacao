/**
 * Design Tokens - Sistema de Design Unificado
 *
 * Conforme PR #264 - RNF05: Manutenibilidade
 * - Tokens centralizados para consistência visual
 * - Baseado em Material Design 3 e WCAG 2.1 AA
 * - Touch-friendly (44x44px mínimo)
 * - Responsivo mobile-first
 */

export const designTokens = {
  /**
   * Paleta de Cores
   * Baseada nas cores da UnB com acessibilidade WCAG AA
   */
  colors: {
    // Cores Primárias
    primary: '#003366',           // Azul UnB - AAA compliance
    primaryHover: '#001f42',      // Hover state
    primaryLight: '#f0f9ff',      // Backgrounds leves
    primaryAlpha: 'rgba(0, 51, 102, 0.08)', // Hover/focus states

    // Cores Secundárias
    secondary: '#F59E0B',         // Amarelo/Laranja - Destaque
    secondaryHover: '#d97706',    // Hover state
    secondaryLight: '#fef3c7',    // Backgrounds leves
    secondaryAlpha: 'rgba(245, 158, 11, 0.1)',

    // Cores Neutras
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      500: '#9E9E9E',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    },

    // Cores Semânticas
    semantic: {
      success: '#10B981',         // Verde - Sucesso
      warning: '#F59E0B',         // Amarelo - Aviso
      error: '#EF4444',           // Vermelho - Erro
      info: '#3B82F6'             // Azul - Informação
    },

    // Background e Text
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
      elevated: 'rgba(255, 255, 255, 0.95)',
      overlay: 'rgba(0, 0, 0, 0.6)'
    },

    text: {
      primary: '#212121',
      secondary: '#616161',
      disabled: '#9E9E9E',
      hint: '#BDBDBD'
    },

    // Cores específicas para Personas
    personas: {
      gasnelio: {
        primary: '#003366',
        background: '#f0f9ff',
        border: '#e0f2fe'
      },
      ga: {
        primary: '#F59E0B',
        background: '#fef3e2',
        border: '#fde68a'
      }
    }
  },

  /**
   * Espaçamento
   * Sistema baseado em múltiplos de 4px
   */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px'
  },

  /**
   * Tipografia
   * Sistema escalável e responsivo
   */
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Fira Code", "Cascadia Code", Consolas, Monaco, monospace'
    },

    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px'
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em'
    }
  },

  /**
   * Sombras
   * Elevação Material Design
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.15)',
    '2xl': '0 25px 50px rgba(0,0,0,0.25)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
    subtle: '0 2px 8px rgba(0,0,0,0.08)',
    strong: '0 8px 24px rgba(0,0,0,0.2)'
  },

  /**
   * Bordas e Raios
   */
  borders: {
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px'
    },

    radius: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      '3xl': '24px',
      full: '9999px'
    }
  },

  /**
   * Transições e Animações
   * Timing baseado em Material Design
   */
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms'
    },

    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  },

  /**
   * Breakpoints Responsivos
   * Mobile-first approach
   */
  breakpoints: {
    mobile: '640px',       // 0-640px
    tablet: '1024px',      // 641-1024px
    desktop: '1280px',     // 1025-1280px
    wide: '1536px'         // 1281px+
  },

  /**
   * Touch Targets
   * WCAG AA compliance
   */
  touch: {
    minTargetSize: '44px',      // Mínimo touch target
    minTargetSizeSmall: '32px', // Para contextos densos
    safeAreaTop: 'env(safe-area-inset-top)',
    safeAreaRight: 'env(safe-area-inset-right)',
    safeAreaBottom: 'env(safe-area-inset-bottom)',
    safeAreaLeft: 'env(safe-area-inset-left)'
  },

  /**
   * Z-Index Scale
   * Ordem de empilhamento consistente
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
    max: 9999
  }
} as const;

/**
 * Helper: Converte tokens em CSS Variables
 */
export function tokensToCSS(): string {
  return `
    :root {
      /* Colors */
      --color-primary: ${designTokens.colors.primary};
      --color-primary-hover: ${designTokens.colors.primaryHover};
      --color-secondary: ${designTokens.colors.secondary};

      /* Spacing */
      --spacing-sm: ${designTokens.spacing.sm};
      --spacing-md: ${designTokens.spacing.md};
      --spacing-lg: ${designTokens.spacing.lg};

      /* Typography */
      --font-family-sans: ${designTokens.typography.fontFamily.sans};
      --font-size-base: ${designTokens.typography.fontSize.base};

      /* Transitions */
      --transition-normal: ${designTokens.transitions.duration.normal} ${designTokens.transitions.easing.default};

      /* Touch */
      --touch-min-size: ${designTokens.touch.minTargetSize};
    }
  `;
}

export type DesignTokens = typeof designTokens;
