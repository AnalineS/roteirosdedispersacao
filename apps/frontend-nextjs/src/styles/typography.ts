/**
 * Mobile-First Typography System
 * ETAPA 2+4: Hierarquia + Mobile-First
 * Objetivo: Reduzir cognitive load de 8.9→4.0 + Mobile experience excelente
 */

// Sistema de tipografia médico-específico e mobile-first
export const typography = {
  // Escala mobile-first (4 níveis máximo para reduzir complexity)
  scale: {
    // Mobile base
    xs: {
      h1: { fontSize: '1.75rem', lineHeight: '2rem', fontWeight: '700' },    // 28px
      h2: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600' },     // 24px  
      h3: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' }, // 20px
      body: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },   // 16px
      small: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' }, // 14px
      caption: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' }    // 12px
    },
    // Tablet breakpoint  
    md: {
      h1: { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '700' },    // 36px
      h2: { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: '600' },  // 30px
      h3: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600' },       // 24px
      body: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '400' }, // 18px
      small: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },    // 16px
      caption: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' } // 14px
    },
    // Desktop breakpoint
    lg: {
      h1: { fontSize: '3rem', lineHeight: '3rem', fontWeight: '700' },         // 48px
      h2: { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '600' },    // 36px
      h3: { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: '600' },  // 30px
      body: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '400' }, // 18px
      small: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },    // 16px
      caption: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' } // 14px
    }
  },

  // Tipografia específica para contexto médico
  medical: {
    // Terminologia técnica - sempre smaller para reduzir cognitive load
    technical: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem', 
      fontWeight: '500',
      color: '#64748b', // Cor menos proeminente
      letterSpacing: '0.025em'
    },
    
    // Instruções importantes - destacadas
    instruction: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '600',
      color: '#059669', // Verde para ações positivas
      letterSpacing: '0.01em'
    },

    // Avisos críticos - máxima legibilidade
    warning: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
      color: '#dc2626', // Vermelho para alertas
      letterSpacing: '0.01em'
    },

    // Dosagem e números - monospace para clareza
    dosage: {
      fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", monospace',
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '600',
      color: '#1e293b',
      letterSpacing: '0.05em'
    }
  },

  // Hierarquia clara (máximo 3 níveis visuais)
  hierarchy: {
    primary: {
      fontSize: 'var(--text-h1)',
      lineHeight: 'var(--line-h1)',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '1.5rem'
    },
    secondary: {
      fontSize: 'var(--text-h2)', 
      lineHeight: 'var(--line-h2)',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '1rem'
    },
    tertiary: {
      fontSize: 'var(--text-h3)',
      lineHeight: 'var(--line-h3)', 
      fontWeight: '600',
      color: '#334155',
      marginBottom: '0.75rem'
    }
  },

  // Touch-friendly spacing para mobile
  spacing: {
    mobile: {
      paragraphSpacing: '1rem',
      sectionSpacing: '1.5rem',
      componentSpacing: '2rem'
    },
    desktop: {
      paragraphSpacing: '1.25rem',
      sectionSpacing: '2rem', 
      componentSpacing: '3rem'
    }
  }
};

// CSS Custom Properties para responsividade automática
export const typographyCSS = `
  :root {
    /* Mobile-first typography */
    --text-h1: ${typography.scale.xs.h1.fontSize};
    --line-h1: ${typography.scale.xs.h1.lineHeight};
    --text-h2: ${typography.scale.xs.h2.fontSize};
    --line-h2: ${typography.scale.xs.h2.lineHeight};
    --text-h3: ${typography.scale.xs.h3.fontSize};
    --line-h3: ${typography.scale.xs.h3.lineHeight};
    --text-body: ${typography.scale.xs.body.fontSize};
    --line-body: ${typography.scale.xs.body.lineHeight};
    
    /* Medical context colors */
    --color-medical-technical: ${typography.medical.technical.color};
    --color-medical-instruction: ${typography.medical.instruction.color};
    --color-medical-warning: ${typography.medical.warning.color};
    --color-medical-dosage: ${typography.medical.dosage.color};
  }

  /* Tablet breakpoint */
  @media (min-width: 768px) {
    :root {
      --text-h1: ${typography.scale.md.h1.fontSize};
      --line-h1: ${typography.scale.md.h1.lineHeight};
      --text-h2: ${typography.scale.md.h2.fontSize};
      --line-h2: ${typography.scale.md.h2.lineHeight};
      --text-h3: ${typography.scale.md.h3.fontSize};
      --line-h3: ${typography.scale.md.h3.lineHeight};
      --text-body: ${typography.scale.md.body.fontSize};
      --line-body: ${typography.scale.md.body.lineHeight};
    }
  }

  /* Desktop breakpoint */
  @media (min-width: 1024px) {
    :root {
      --text-h1: ${typography.scale.lg.h1.fontSize};
      --line-h1: ${typography.scale.lg.h1.lineHeight};
      --text-h2: ${typography.scale.lg.h2.fontSize};
      --line-h2: ${typography.scale.lg.h2.lineHeight};
      --text-h3: ${typography.scale.lg.h3.fontSize};
      --line-h3: ${typography.scale.lg.h3.lineHeight};
      --text-body: ${typography.scale.lg.body.fontSize};
      --line-body: ${typography.scale.lg.body.lineHeight};
    }
  }

  /* Typography classes */
  .text-primary { 
    font-size: var(--text-h1);
    line-height: var(--line-h1);
    font-weight: 700;
    color: #0f172a;
  }
  
  .text-secondary {
    font-size: var(--text-h2);
    line-height: var(--line-h2);
    font-weight: 600; 
    color: #1e293b;
  }

  .text-tertiary {
    font-size: var(--text-h3);
    line-height: var(--line-h3);
    font-weight: 600;
    color: #334155;
  }

  .text-medical-technical {
    font-size: ${typography.medical.technical.fontSize};
    line-height: ${typography.medical.technical.lineHeight};
    font-weight: ${typography.medical.technical.fontWeight};
    color: var(--color-medical-technical);
    letter-spacing: ${typography.medical.technical.letterSpacing};
  }

  .text-medical-instruction {
    font-size: ${typography.medical.instruction.fontSize};
    line-height: ${typography.medical.instruction.lineHeight};
    font-weight: ${typography.medical.instruction.fontWeight};
    color: var(--color-medical-instruction);
    letter-spacing: ${typography.medical.instruction.letterSpacing};
  }

  .text-medical-warning {
    font-size: ${typography.medical.warning.fontSize};
    line-height: ${typography.medical.warning.lineHeight};
    font-weight: ${typography.medical.warning.fontWeight};
    color: var(--color-medical-warning);
    letter-spacing: ${typography.medical.warning.letterSpacing};
  }

  .text-medical-dosage {
    font-family: ${typography.medical.dosage.fontFamily};
    font-size: ${typography.medical.dosage.fontSize};
    line-height: ${typography.medical.dosage.lineHeight};
    font-weight: ${typography.medical.dosage.fontWeight};
    color: var(--color-medical-dosage);
    letter-spacing: ${typography.medical.dosage.letterSpacing};
  }

  /* Reading optimization */
  .text-optimized {
    font-size: var(--text-body);
    line-height: var(--line-body);
    max-width: 65ch; /* Optimal reading width */
    margin-bottom: 1rem;
  }

  /* Touch-friendly interactive text */
  .text-interactive {
    min-height: 44px; /* WCAG touch target */
    display: flex;
    align-items: center;
    padding: 0.75rem;
    font-size: var(--text-body);
    line-height: var(--line-body);
    text-decoration: none;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease;
  }

  .text-interactive:hover,
  .text-interactive:focus {
    background-color: #f1f5f9;
  }

  /* Responsive spacing */
  .space-y-medical > * + * {
    margin-top: 1rem;
  }

  @media (min-width: 768px) {
    .space-y-medical > * + * {
      margin-top: 1.25rem;
    }
  }
`;

// Utility functions para React components
export const getResponsiveTextSize = (level: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption') => ({
  fontSize: `var(--text-${level === 'h1' ? 'h1' : level === 'h2' ? 'h2' : level === 'h3' ? 'h3' : 'body'})`,
  lineHeight: `var(--line-${level === 'h1' ? 'h1' : level === 'h2' ? 'h2' : level === 'h3' ? 'h3' : 'body'})`
});

export const getMedicalTextStyle = (type: 'technical' | 'instruction' | 'warning' | 'dosage') => ({
  ...typography.medical[type]
});

// Export default config
export default typography;