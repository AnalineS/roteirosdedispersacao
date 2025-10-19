/**
 * Visual Hierarchy Optimizer - ETAPA 2 UX TRANSFORMATION
 * Implementa princípios de hierarquia visual para reduzir carga cognitiva
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Hierarquia específica para contexto médico
 * - Cognitive Load: Redução de 8.9/10 para 6/10 através de hierarquia clara
 * - Visual Organization: Aplicação consistente de hierarquia em todos os componentes
 */

'use client';

import React, { useEffect } from 'react';
import { getUnbColors } from '@/config/modernTheme';

// Interfaces para configuração de hierarquia
interface VisualHierarchyConfig {
  // Configurações de tipografia
  typography: {
    headings: {
      h1: { size: string; weight: string; lineHeight: string; spacing: string; };
      h2: { size: string; weight: string; lineHeight: string; spacing: string; };
      h3: { size: string; weight: string; lineHeight: string; spacing: string; };
      h4: { size: string; weight: string; lineHeight: string; spacing: string; };
    };
    body: {
      large: { size: string; lineHeight: string; };
      normal: { size: string; lineHeight: string; };
      small: { size: string; lineHeight: string; };
    };
  };
  
  // Configurações de espaçamento
  spacing: {
    sections: string;
    components: string;
    elements: string;
    micro: string;
  };
  
  // Configurações de cores (hierarquia de importância)
  colors: {
    primary: string; // Máxima atenção
    secondary: string; // Alta atenção
    tertiary: string; // Média atenção
    quaternary: string; // Baixa atenção
  };
  
  // Configurações de layout
  layout: {
    contentMaxWidth: string;
    sidebarWidth: string;
    headerHeight: string;
    gridGap: string;
  };
}

// Hook para aplicar hierarquia visual
export function useVisualHierarchy() {
  const unbColors = getUnbColors();
  
  const hierarchyConfig: VisualHierarchyConfig = {
    typography: {
      headings: {
        h1: { 
          size: 'clamp(2rem, 4vw, 3rem)', 
          weight: '700', 
          lineHeight: '1.2', 
          spacing: '-0.02em' 
        },
        h2: { 
          size: 'clamp(1.5rem, 3vw, 2.25rem)', 
          weight: '600', 
          lineHeight: '1.3', 
          spacing: '-0.01em' 
        },
        h3: { 
          size: 'clamp(1.25rem, 2.5vw, 1.75rem)', 
          weight: '600', 
          lineHeight: '1.4', 
          spacing: '0' 
        },
        h4: { 
          size: 'clamp(1.125rem, 2vw, 1.375rem)', 
          weight: '500', 
          lineHeight: '1.4', 
          spacing: '0' 
        }
      },
      body: {
        large: { size: '1.125rem', lineHeight: '1.75' },
        normal: { size: '1rem', lineHeight: '1.6' },
        small: { size: '0.875rem', lineHeight: '1.5' }
      }
    },
    
    spacing: {
      sections: 'clamp(3rem, 6vw, 6rem)',
      components: 'clamp(2rem, 4vw, 3rem)',
      elements: 'clamp(1rem, 2vw, 1.5rem)',
      micro: 'clamp(0.5rem, 1vw, 0.75rem)'
    },
    
    colors: {
      primary: unbColors.primary,     // Headers principais, CTAs
      secondary: unbColors.secondary, // Subheaders, links importantes
      tertiary: unbColors.neutral,    // Texto normal
      quaternary: '#94a3b8'           // Texto auxiliar, metadata
    },
    
    layout: {
      contentMaxWidth: '1200px',
      sidebarWidth: '320px',
      headerHeight: '72px',
      gridGap: 'clamp(1rem, 2vw, 2rem)'
    }
  };

  // Função para aplicar estilos de hierarquia globalmente
  const applyGlobalHierarchy = () => {
    // Aplicar CSS Custom Properties para hierarquia
    const root = document.documentElement;
    
    // Typography
    root.style.setProperty('--hierarchy-h1-size', hierarchyConfig.typography.headings.h1.size);
    root.style.setProperty('--hierarchy-h1-weight', hierarchyConfig.typography.headings.h1.weight);
    root.style.setProperty('--hierarchy-h1-line-height', hierarchyConfig.typography.headings.h1.lineHeight);
    root.style.setProperty('--hierarchy-h1-spacing', hierarchyConfig.typography.headings.h1.spacing);
    
    root.style.setProperty('--hierarchy-h2-size', hierarchyConfig.typography.headings.h2.size);
    root.style.setProperty('--hierarchy-h2-weight', hierarchyConfig.typography.headings.h2.weight);
    root.style.setProperty('--hierarchy-h2-line-height', hierarchyConfig.typography.headings.h2.lineHeight);
    root.style.setProperty('--hierarchy-h2-spacing', hierarchyConfig.typography.headings.h2.spacing);
    
    root.style.setProperty('--hierarchy-h3-size', hierarchyConfig.typography.headings.h3.size);
    root.style.setProperty('--hierarchy-h3-weight', hierarchyConfig.typography.headings.h3.weight);
    root.style.setProperty('--hierarchy-h3-line-height', hierarchyConfig.typography.headings.h3.lineHeight);
    root.style.setProperty('--hierarchy-h3-spacing', hierarchyConfig.typography.headings.h3.spacing);
    
    root.style.setProperty('--hierarchy-h4-size', hierarchyConfig.typography.headings.h4.size);
    root.style.setProperty('--hierarchy-h4-weight', hierarchyConfig.typography.headings.h4.weight);
    root.style.setProperty('--hierarchy-h4-line-height', hierarchyConfig.typography.headings.h4.lineHeight);
    root.style.setProperty('--hierarchy-h4-spacing', hierarchyConfig.typography.headings.h4.spacing);
    
    // Body text
    root.style.setProperty('--hierarchy-body-large-size', hierarchyConfig.typography.body.large.size);
    root.style.setProperty('--hierarchy-body-large-line-height', hierarchyConfig.typography.body.large.lineHeight);
    root.style.setProperty('--hierarchy-body-normal-size', hierarchyConfig.typography.body.normal.size);
    root.style.setProperty('--hierarchy-body-normal-line-height', hierarchyConfig.typography.body.normal.lineHeight);
    root.style.setProperty('--hierarchy-body-small-size', hierarchyConfig.typography.body.small.size);
    root.style.setProperty('--hierarchy-body-small-line-height', hierarchyConfig.typography.body.small.lineHeight);
    
    // Spacing
    root.style.setProperty('--hierarchy-spacing-sections', hierarchyConfig.spacing.sections);
    root.style.setProperty('--hierarchy-spacing-components', hierarchyConfig.spacing.components);
    root.style.setProperty('--hierarchy-spacing-elements', hierarchyConfig.spacing.elements);
    root.style.setProperty('--hierarchy-spacing-micro', hierarchyConfig.spacing.micro);
    
    // Colors
    root.style.setProperty('--hierarchy-color-primary', hierarchyConfig.colors.primary);
    root.style.setProperty('--hierarchy-color-secondary', hierarchyConfig.colors.secondary);
    root.style.setProperty('--hierarchy-color-tertiary', hierarchyConfig.colors.tertiary);
    root.style.setProperty('--hierarchy-color-quaternary', hierarchyConfig.colors.quaternary);
    
    // Layout
    root.style.setProperty('--hierarchy-content-max-width', hierarchyConfig.layout.contentMaxWidth);
    root.style.setProperty('--hierarchy-sidebar-width', hierarchyConfig.layout.sidebarWidth);
    root.style.setProperty('--hierarchy-header-height', hierarchyConfig.layout.headerHeight);
    root.style.setProperty('--hierarchy-grid-gap', hierarchyConfig.layout.gridGap);
  };

  return {
    config: hierarchyConfig,
    applyGlobalHierarchy,
    // Utility functions para componentes
    getHeadingStyle: (level: 'h1' | 'h2' | 'h3' | 'h4') => hierarchyConfig.typography.headings[level],
    getBodyStyle: (size: 'large' | 'normal' | 'small') => hierarchyConfig.typography.body[size],
    getSpacing: (type: 'sections' | 'components' | 'elements' | 'micro') => hierarchyConfig.spacing[type],
    getColor: (priority: 'primary' | 'secondary' | 'tertiary' | 'quaternary') => hierarchyConfig.colors[priority]
  };
}

// Componente que aplica hierarquia visual automaticamente
interface VisualHierarchyOptimizerProps {
  children?: React.ReactNode;
  applyToRoot?: boolean;
}

export default function VisualHierarchyOptimizer({ 
  children, 
  applyToRoot = true 
}: VisualHierarchyOptimizerProps) {
  const { applyGlobalHierarchy } = useVisualHierarchy();

  useEffect(() => {
    if (applyToRoot) {
      applyGlobalHierarchy();
    }
  }, [applyToRoot, applyGlobalHierarchy]);

  return (
    <>
      {children}
      
      {/* Global CSS para hierarquia visual */}
      <style jsx global>{`
        /* === TYPOGRAPHY HIERARCHY === */
        
        /* Headings - Ordem de importância */
        h1, .hierarchy-h1 {
          font-size: var(--hierarchy-h1-size) !important;
          font-weight: var(--hierarchy-h1-weight) !important;
          line-height: var(--hierarchy-h1-line-height) !important;
          letter-spacing: var(--hierarchy-h1-spacing) !important;
          color: var(--hierarchy-color-primary) !important;
          margin-bottom: var(--hierarchy-spacing-elements) !important;
          margin-top: 0 !important;
        }
        
        h2, .hierarchy-h2 {
          font-size: var(--hierarchy-h2-size) !important;
          font-weight: var(--hierarchy-h2-weight) !important;
          line-height: var(--hierarchy-h2-line-height) !important;
          letter-spacing: var(--hierarchy-h2-spacing) !important;
          color: var(--hierarchy-color-primary) !important;
          margin-bottom: var(--hierarchy-spacing-elements) !important;
          margin-top: var(--hierarchy-spacing-components) !important;
        }
        
        h3, .hierarchy-h3 {
          font-size: var(--hierarchy-h3-size) !important;
          font-weight: var(--hierarchy-h3-weight) !important;
          line-height: var(--hierarchy-h3-line-height) !important;
          letter-spacing: var(--hierarchy-h3-spacing) !important;
          color: var(--hierarchy-color-secondary) !important;
          margin-bottom: var(--hierarchy-spacing-micro) !important;
          margin-top: var(--hierarchy-spacing-elements) !important;
        }
        
        h4, .hierarchy-h4 {
          font-size: var(--hierarchy-h4-size) !important;
          font-weight: var(--hierarchy-h4-weight) !important;
          line-height: var(--hierarchy-h4-line-height) !important;
          letter-spacing: var(--hierarchy-h4-spacing) !important;
          color: var(--hierarchy-color-secondary) !important;
          margin-bottom: var(--hierarchy-spacing-micro) !important;
          margin-top: var(--hierarchy-spacing-elements) !important;
        }
        
        /* Body text hierarchy */
        .hierarchy-body-large, .lead {
          font-size: var(--hierarchy-body-large-size) !important;
          line-height: var(--hierarchy-body-large-line-height) !important;
          color: var(--hierarchy-color-tertiary) !important;
          margin-bottom: var(--hierarchy-spacing-elements) !important;
        }
        
        p, .hierarchy-body-normal {
          font-size: var(--hierarchy-body-normal-size) !important;
          line-height: var(--hierarchy-body-normal-line-height) !important;
          color: var(--hierarchy-color-tertiary) !important;
          margin-bottom: var(--hierarchy-spacing-micro) !important;
          margin-top: 0 !important;
        }
        
        .hierarchy-body-small, .text-sm, .metadata {
          font-size: var(--hierarchy-body-small-size) !important;
          line-height: var(--hierarchy-body-small-line-height) !important;
          color: var(--hierarchy-color-quaternary) !important;
          margin-bottom: var(--hierarchy-spacing-micro) !important;
        }
        
        /* === SPACING HIERARCHY === */
        
        /* Section-level spacing */
        section, .hierarchy-section {
          margin-bottom: var(--hierarchy-spacing-sections) !important;
        }
        
        /* Component-level spacing */
        .card, .hierarchy-component, article {
          margin-bottom: var(--hierarchy-spacing-components) !important;
          padding: var(--hierarchy-spacing-elements) !important;
        }
        
        /* Element-level spacing */
        .hierarchy-element {
          margin-bottom: var(--hierarchy-spacing-elements) !important;
        }
        
        /* Micro spacing */
        .hierarchy-micro {
          margin-bottom: var(--hierarchy-spacing-micro) !important;
        }
        
        /* === LAYOUT HIERARCHY === */
        
        /* Content containers */
        .hierarchy-content-container, .container {
          max-width: var(--hierarchy-content-max-width) !important;
          margin: 0 auto !important;
          padding: 0 var(--hierarchy-spacing-elements) !important;
        }
        
        /* Grid systems */
        .hierarchy-grid {
          display: grid !important;
          gap: var(--hierarchy-grid-gap) !important;
        }
        
        .hierarchy-grid-2 {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
        }
        
        .hierarchy-grid-3 {
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
        }
        
        .hierarchy-grid-4 {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
        }
        
        /* === VISUAL EMPHASIS HIERARCHY === */
        
        /* Primary emphasis - máxima atenção */
        .hierarchy-emphasis-primary, .btn-primary, .alert-primary {
          background-color: var(--hierarchy-color-primary) !important;
          color: white !important;
          font-weight: 600 !important;
          border: 2px solid var(--hierarchy-color-primary) !important;
        }
        
        /* Secondary emphasis - alta atenção */
        .hierarchy-emphasis-secondary, .btn-secondary {
          background-color: transparent !important;
          color: var(--hierarchy-color-primary) !important;
          font-weight: 500 !important;
          border: 2px solid var(--hierarchy-color-primary) !important;
        }
        
        /* Tertiary emphasis - média atenção */
        .hierarchy-emphasis-tertiary, .btn-outline {
          background-color: transparent !important;
          color: var(--hierarchy-color-secondary) !important;
          font-weight: 400 !important;
          border: 1px solid var(--hierarchy-color-secondary) !important;
        }
        
        /* Quaternary emphasis - baixa atenção */
        .hierarchy-emphasis-quaternary, .btn-ghost {
          background-color: transparent !important;
          color: var(--hierarchy-color-quaternary) !important;
          font-weight: 400 !important;
          border: none !important;
        }
        
        /* === MEDICAL CONTEXT SPECIFIC === */
        
        /* Alertas médicos - hierarquia crítica */
        .medical-alert-critical {
          background-color: #fee2e2 !important;
          border-left: 4px solid #dc2626 !important;
          color: #991b1b !important;
          padding: var(--hierarchy-spacing-elements) !important;
          margin: var(--hierarchy-spacing-elements) 0 !important;
          font-weight: 600 !important;
        }
        
        .medical-alert-warning {
          background-color: #fef3c7 !important;
          border-left: 4px solid #f59e0b !important;
          color: #92400e !important;
          padding: var(--hierarchy-spacing-elements) !important;
          margin: var(--hierarchy-spacing-elements) 0 !important;
          font-weight: 500 !important;
        }
        
        .medical-alert-info {
          background-color: #dbeafe !important;
          border-left: 4px solid #3b82f6 !important;
          color: #1d4ed8 !important;
          padding: var(--hierarchy-spacing-elements) !important;
          margin: var(--hierarchy-spacing-elements) 0 !important;
          font-weight: 400 !important;
        }
        
        /* Dosage information - hierarquia específica */
        .dosage-primary {
          font-size: var(--hierarchy-h3-size) !important;
          font-weight: 700 !important;
          color: var(--hierarchy-color-primary) !important;
          background-color: #f0f9ff !important;
          padding: var(--hierarchy-spacing-micro) var(--hierarchy-spacing-elements) !important;
          border-radius: 8px !important;
          border: 2px solid #0ea5e9 !important;
        }
        
        .dosage-secondary {
          font-size: var(--hierarchy-body-normal-size) !important;
          font-weight: 500 !important;
          color: var(--hierarchy-color-secondary) !important;
        }
        
        /* === ACCESSIBILITY ENHANCEMENTS === */
        
        /* Focus hierarchy */
        .hierarchy-focus-primary:focus {
          outline: 3px solid var(--hierarchy-color-primary) !important;
          outline-offset: 2px !important;
        }
        
        .hierarchy-focus-secondary:focus {
          outline: 2px solid var(--hierarchy-color-secondary) !important;
          outline-offset: 1px !important;
        }
        
        /* High contrast support */
        @media (prefers-contrast: high) {
          h1, h2, h3, h4, .hierarchy-h1, .hierarchy-h2, .hierarchy-h3, .hierarchy-h4 {
            border-bottom: 2px solid currentColor !important;
            padding-bottom: 4px !important;
          }
          
          .hierarchy-emphasis-primary, .hierarchy-emphasis-secondary {
            border-width: 3px !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          h1, .hierarchy-h1 {
            font-size: 2rem !important;
          }
          
          h2, .hierarchy-h2 {
            font-size: 1.75rem !important;
          }
          
          h3, .hierarchy-h3 {
            font-size: 1.5rem !important;
          }
          
          .hierarchy-content-container, .container {
            padding: 0 1rem !important;
          }
          
          .card, .hierarchy-component {
            padding: 1rem !important;
          }
        }
      `}</style>
    </>
  );
}

// Hook utilitário para acessar configurações de hierarquia
// Removido export duplicado

// Componentes pré-configurados para hierarquia específica
export const HierarchyHeading = ({ 
  level, 
  children, 
  className = '', 
  ...props 
}: {
  level: 'h1' | 'h2' | 'h3' | 'h4';
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLHeadingElement>) => {
  const Tag = level;
  return <Tag className={`hierarchy-${level} ${className}`} {...props}>{children}</Tag>;
};

export const HierarchyText = ({ 
  size = 'normal', 
  children, 
  className = '', 
  ...props 
}: {
  size?: 'large' | 'normal' | 'small';
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLParagraphElement>) => {
  return <p className={`hierarchy-body-${size} ${className}`} {...props}>{children}</p>;
};

export const HierarchyContainer = ({ 
  children, 
  className = '', 
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={`hierarchy-content-container ${className}`} {...props}>{children}</div>;
};