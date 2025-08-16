/**
 * Mobile-First Grid System
 * ETAPA 2+4: Hierarquia + Mobile Experience
 * Objetivo: Layout responsivo otimizado para reduzir cognitive load
 */

// Breakpoints mobile-first
export const breakpoints = {
  xs: '0px',      // Mobile portrait
  sm: '480px',    // Mobile landscape  
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Large desktop
  xxl: '1536px'   // Extra large
} as const;

// Grid system configurações
export const grid = {
  // Container máximo responsivo
  container: {
    maxWidth: {
      xs: '100%',
      sm: '100%', 
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      xxl: '1536px'
    },
    padding: {
      xs: '1rem',    // 16px mobile
      sm: '1.5rem',  // 24px mobile landscape
      md: '2rem',    // 32px tablet
      lg: '2.5rem',  // 40px desktop
      xl: '3rem'     // 48px large desktop
    }
  },

  // Colunas responsivas (12-grid system)
  columns: {
    total: 12,
    gap: {
      xs: '1rem',    // 16px mobile
      sm: '1.25rem', // 20px mobile landscape
      md: '1.5rem',  // 24px tablet
      lg: '2rem',    // 32px desktop
      xl: '2.5rem'   // 40px large desktop
    }
  },

  // Layout patterns específicos para contexto médico
  medical: {
    // Layout para informações de dosagem (2-column em mobile, 3-column em desktop)
    dosage: {
      xs: 'grid-cols-1', 
      sm: 'grid-cols-2',
      md: 'grid-cols-2', 
      lg: 'grid-cols-3'
    },
    
    // Layout para cards de personas (1-column mobile, 2-column desktop)
    personas: {
      xs: 'grid-cols-1',
      sm: 'grid-cols-1',
      md: 'grid-cols-2',
      lg: 'grid-cols-2'
    },

    // Layout para instruções step-by-step
    instructions: {
      xs: 'grid-cols-1',
      sm: 'grid-cols-1', 
      md: 'grid-cols-1',
      lg: 'grid-cols-2' // Side-by-side apenas em desktop grande
    },

    // Layout para dashboard médico
    dashboard: {
      xs: 'grid-cols-1',
      sm: 'grid-cols-1',
      md: 'grid-cols-2',
      lg: 'grid-cols-3',
      xl: 'grid-cols-4'
    }
  },

  // Spacing system (8px grid)
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
    '4xl': '6rem'   // 96px
  }
};

// CSS Grid utility classes
export const gridCSS = `
  /* Container responsivo */
  .container-medical {
    width: 100%;
    margin: 0 auto;
    padding-left: ${grid.container.padding.xs};
    padding-right: ${grid.container.padding.xs};
    max-width: ${grid.container.maxWidth.xs};
  }

  @media (min-width: ${breakpoints.sm}) {
    .container-medical {
      padding-left: ${grid.container.padding.sm};
      padding-right: ${grid.container.padding.sm};
      max-width: ${grid.container.maxWidth.sm};
    }
  }

  @media (min-width: ${breakpoints.md}) {
    .container-medical {
      padding-left: ${grid.container.padding.md};
      padding-right: ${grid.container.padding.md};
      max-width: ${grid.container.maxWidth.md};
    }
  }

  @media (min-width: ${breakpoints.lg}) {
    .container-medical {
      padding-left: ${grid.container.padding.lg};
      padding-right: ${grid.container.padding.lg};
      max-width: ${grid.container.maxWidth.lg};
    }
  }

  @media (min-width: ${breakpoints.xl}) {
    .container-medical {
      padding-left: ${grid.container.padding.xl};
      padding-right: ${grid.container.padding.xl};
      max-width: ${grid.container.maxWidth.xl};
    }
  }

  /* Grid responsivo */
  .grid-medical {
    display: grid;
    gap: ${grid.columns.gap.xs};
  }

  @media (min-width: ${breakpoints.sm}) {
    .grid-medical { gap: ${grid.columns.gap.sm}; }
  }

  @media (min-width: ${breakpoints.md}) {
    .grid-medical { gap: ${grid.columns.gap.md}; }
  }

  @media (min-width: ${breakpoints.lg}) {
    .grid-medical { gap: ${grid.columns.gap.lg}; }
  }

  @media (min-width: ${breakpoints.xl}) {
    .grid-medical { gap: ${grid.columns.gap.xl}; }
  }

  /* Layout patterns médicos */
  .grid-dosage {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  @media (min-width: ${breakpoints.sm}) {
    .grid-dosage {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: ${breakpoints.lg}) {
    .grid-dosage {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .grid-personas {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  @media (min-width: ${breakpoints.md}) {
    .grid-personas {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .grid-instructions {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  @media (min-width: ${breakpoints.lg}) {
    .grid-instructions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .grid-dashboard {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  @media (min-width: ${breakpoints.md}) {
    .grid-dashboard {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: ${breakpoints.lg}) {
    .grid-dashboard {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: ${breakpoints.xl}) {
    .grid-dashboard {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  /* Touch-friendly layouts mobile */
  .touch-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
    padding: 1rem;
  }

  @media (min-width: ${breakpoints.md}) {
    .touch-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    }
  }

  /* Flexible content areas */
  .content-area {
    max-width: 65ch; /* Optimal reading width */
    margin: 0 auto;
    padding: 1rem;
  }

  @media (min-width: ${breakpoints.md}) {
    .content-area {
      padding: 2rem;
    }
  }

  /* Medical card layouts */
  .medical-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    border: 1px solid #e2e8f0;
    min-height: 44px; /* Touch target minimum */
  }

  @media (min-width: ${breakpoints.md}) {
    .medical-card {
      padding: 2rem;
    }
  }

  /* Responsive stacking */
  .stack-mobile {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (min-width: ${breakpoints.md}) {
    .stack-mobile {
      flex-direction: row;
      gap: 2rem;
    }
  }

  /* Progressive disclosure areas */
  .disclosure-area {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .disclosure-header {
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .disclosure-content {
    padding: 1rem;
    display: none;
  }

  .disclosure-content.open {
    display: block;
  }

  @media (min-width: ${breakpoints.md}) {
    .disclosure-header {
      padding: 1.5rem;
    }
    
    .disclosure-content {
      padding: 1.5rem;
    }
  }
`;

// React utility functions
export const getGridClasses = (pattern: keyof typeof grid.medical) => {
  const config = grid.medical[pattern];
  return Object.entries(config)
    .map(([breakpoint, cols]) => 
      breakpoint === 'xs' ? cols : `${breakpoint}:${cols}`
    )
    .join(' ');
};

export const getResponsivePadding = (size: 'sm' | 'md' | 'lg' = 'md') => ({
  padding: grid.container.padding.xs,
  [`@media (min-width: ${breakpoints.md})`]: {
    padding: grid.container.padding[size]
  }
});

export const getResponsiveGap = (size: 'sm' | 'md' | 'lg' = 'md') => ({
  gap: grid.columns.gap.xs,
  [`@media (min-width: ${breakpoints.md})`]: {
    gap: grid.columns.gap[size]
  }
});

// Container component props helper
export const containerProps = {
  className: 'container-medical',
  style: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: `0 ${grid.container.padding.xs}`
  }
};

export default grid;