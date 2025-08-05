// Tema baseado na identidade visual da UnB
export const theme = {
  colors: {
    // Cores principais da UnB (baseadas no símbolo oficial)
    primary: {
      50: '#f0f9ff',   // azul muito claro
      100: '#e0f2fe',  // azul claro
      200: '#bae6fd',  // azul suave
      300: '#7dd3fc',  // azul médio claro
      400: '#38bdf8',  // azul médio
      500: '#0284c7',  // azul principal da UnB
      600: '#0369a1',  // azul escuro
      700: '#075985',  // azul muito escuro
      800: '#0c4a6e',  // azul profundo
      900: '#0f172a'   // azul quase preto
    },
    
    // Verde complementar (presente na logo PPGCF)
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // verde principal
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    
    // Cores neutras profissionais
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    
    // Cores de status educacional
    educational: {
      success: '#22c55e',    // verde
      warning: '#f59e0b',    // laranja
      error: '#ef4444',      // vermelho
      info: '#0284c7',       // azul principal
      progress: '#8b5cf6'    // roxo para progresso
    }
  },
  
  // Gradientes temáticos
  gradients: {
    primary: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    secondary: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    hero: 'linear-gradient(135deg, #0284c7 0%, #22c55e 100%)',
    card: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  },
  
  // Sombras profissionais
  shadows: {
    sm: '0 1px 2px 0 rgb(2 132 199 / 0.05)',
    md: '0 4px 6px -1px rgb(2 132 199 / 0.1), 0 2px 4px -2px rgb(2 132 199 / 0.1)',
    lg: '0 10px 15px -3px rgb(2 132 199 / 0.1), 0 4px 6px -4px rgb(2 132 199 / 0.1)',
    xl: '0 20px 25px -5px rgb(2 132 199 / 0.1), 0 8px 10px -6px rgb(2 132 199 / 0.1)'
  },
  
  // Configurações de persona
  personas: {
    'dr_gasnelio': {
      primaryColor: '#0284c7',   // azul principal
      secondaryColor: '#075985', // azul escuro
      accentColor: '#38bdf8',    // azul médio
      avatar: '/images/avatars/dr-gasnelio.png'
    },
    'ga': {
      primaryColor: '#22c55e',   // verde principal
      secondaryColor: '#16a34a', // verde escuro  
      accentColor: '#86efac',    // verde claro
      avatar: '/images/avatars/ga.png'
    }
  },
  
  // Assets da instituição
  assets: {
    logos: {
      unb: '/images/logos/unb-simbolo.png',      // símbolo para usar como logo principal
      unbFull: '/images/logos/unb-logo.webp',    // logo completa
      ppgcf: '/images/logos/ppgcf-logo.png'      // logo do programa
    }
  }
};

// Utility functions para usar as cores
export const getPersonaTheme = (personaId: string) => {
  return theme.personas[personaId as keyof typeof theme.personas] || theme.personas.ga;
};

export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info' | 'progress') => {
  return theme.colors.educational[status];
};

export const getPrimaryGradient = () => theme.gradients.primary;
export const getSecondaryGradient = () => theme.gradients.secondary;