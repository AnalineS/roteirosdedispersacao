/**
 * Spacing & Grid System - ETAPA 2 UX TRANSFORMATION
 * Whitespace strategy (40% mais espaço) e Grid system responsivo
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Performance: Sistema CSS-in-JS otimizado
 * - Responsividade: Mobile-first approach
 * - Medical Context: Espaçamentos adequados para leitura médica
 */

'use client';

import React, { CSSProperties } from 'react';

// Sistema de espaçamentos baseado em escala modular (8px base)
export const SPACING_SCALE = {
  xs: 4,     // 4px
  sm: 8,     // 8px
  md: 16,    // 16px
  lg: 24,    // 24px
  xl: 32,    // 32px
  xxl: 48,   // 48px
  xxxl: 64,  // 64px
  huge: 96   // 96px
} as const;

// Breakpoints responsivos
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280
} as const;

// Tipos para o sistema de spacing
type SpacingSize = keyof typeof SPACING_SCALE;
type ResponsiveSpacing = SpacingSize | { mobile?: SpacingSize; tablet?: SpacingSize; desktop?: SpacingSize };

interface SpacingProps {
  m?: ResponsiveSpacing; // margin
  mx?: ResponsiveSpacing; // margin horizontal
  my?: ResponsiveSpacing; // margin vertical
  mt?: ResponsiveSpacing; // margin top
  mr?: ResponsiveSpacing; // margin right
  mb?: ResponsiveSpacing; // margin bottom
  ml?: ResponsiveSpacing; // margin left
  p?: ResponsiveSpacing; // padding
  px?: ResponsiveSpacing; // padding horizontal
  py?: ResponsiveSpacing; // padding vertical
  pt?: ResponsiveSpacing; // padding top
  pr?: ResponsiveSpacing; // padding right
  pb?: ResponsiveSpacing; // padding bottom
  pl?: ResponsiveSpacing; // padding left
}

// Função para resolver spacing responsivo
function resolveSpacing(spacing: ResponsiveSpacing, breakpoint: 'mobile' | 'tablet' | 'desktop' = 'mobile'): number {
  if (typeof spacing === 'string') {
    return SPACING_SCALE[spacing];
  }
  
  // Resolver spacing responsivo em ordem de prioridade
  return SPACING_SCALE[
    spacing[breakpoint] ||
    spacing.mobile ||
    spacing.tablet ||
    spacing.desktop ||
    'md'
  ];
}

// Componente Spacer para espaçamentos explícitos
interface SpacerProps {
  size: ResponsiveSpacing;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function Spacer({ size, direction = 'vertical', className = '' }: SpacerProps) {
  const spacing = resolveSpacing(size);
  
  const spacerStyles: CSSProperties = {
    ...(direction === 'vertical' 
      ? { height: `${spacing}px`, width: '100%' }
      : { width: `${spacing}px`, height: '100%' }
    ),
    flexShrink: 0
  };

  return <div className={`spacer ${className}`} style={spacerStyles} aria-hidden="true" />;
}

// Componente Box com sistema de spacing
interface BoxProps extends SpacingProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'inline-flex';
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: ResponsiveSpacing;
  wrap?: boolean;
}

export function Box({
  children,
  className = '',
  style = {},
  as = 'div',
  display = 'block',
  direction = 'row',
  align,
  justify,
  gap,
  wrap = false,
  m, mx, my, mt, mr, mb, ml,
  p, px, py, pt, pr, pb, pl,
  ...props
}: BoxProps) {
  const Component = as;
  
  // Resolver espaçamentos
  const spacingStyles: CSSProperties = {};
  
  // Margins
  if (m !== undefined) {
    const spacing = resolveSpacing(m);
    spacingStyles.margin = `${spacing}px`;
  }
  if (mx !== undefined) {
    const spacing = resolveSpacing(mx);
    spacingStyles.marginLeft = `${spacing}px`;
    spacingStyles.marginRight = `${spacing}px`;
  }
  if (my !== undefined) {
    const spacing = resolveSpacing(my);
    spacingStyles.marginTop = `${spacing}px`;
    spacingStyles.marginBottom = `${spacing}px`;
  }
  if (mt !== undefined) spacingStyles.marginTop = `${resolveSpacing(mt)}px`;
  if (mr !== undefined) spacingStyles.marginRight = `${resolveSpacing(mr)}px`;
  if (mb !== undefined) spacingStyles.marginBottom = `${resolveSpacing(mb)}px`;
  if (ml !== undefined) spacingStyles.marginLeft = `${resolveSpacing(ml)}px`;
  
  // Paddings
  if (p !== undefined) {
    const spacing = resolveSpacing(p);
    spacingStyles.padding = `${spacing}px`;
  }
  if (px !== undefined) {
    const spacing = resolveSpacing(px);
    spacingStyles.paddingLeft = `${spacing}px`;
    spacingStyles.paddingRight = `${spacing}px`;
  }
  if (py !== undefined) {
    const spacing = resolveSpacing(py);
    spacingStyles.paddingTop = `${spacing}px`;
    spacingStyles.paddingBottom = `${spacing}px`;
  }
  if (pt !== undefined) spacingStyles.paddingTop = `${resolveSpacing(pt)}px`;
  if (pr !== undefined) spacingStyles.paddingRight = `${resolveSpacing(pr)}px`;
  if (pb !== undefined) spacingStyles.paddingBottom = `${resolveSpacing(pb)}px`;
  if (pl !== undefined) spacingStyles.paddingLeft = `${resolveSpacing(pl)}px`;
  
  // Layout styles
  const layoutStyles: CSSProperties = {
    display,
    ...(display === 'flex' && {
      flexDirection: direction,
      ...(align && { alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align }),
      ...(justify && {
        justifyContent: justify === 'start' ? 'flex-start' 
          : justify === 'end' ? 'flex-end'
          : justify === 'between' ? 'space-between'
          : justify === 'around' ? 'space-around'
          : justify === 'evenly' ? 'space-evenly'
          : justify
      }),
      ...(gap && { gap: `${resolveSpacing(gap)}px` }),
      ...(wrap && { flexWrap: 'wrap' })
    })
  };

  const combinedStyles: CSSProperties = {
    ...spacingStyles,
    ...layoutStyles,
    ...style
  };

  return (
    <Component
      className={`box ${className}`}
      style={combinedStyles}
      {...props}
    >
      {children}
    </Component>
  );
}

// Sistema de Grid responsivo
interface GridProps extends SpacingProps {
  children: React.ReactNode;
  columns?: number | { mobile?: number; tablet?: number; desktop?: number };
  gap?: ResponsiveSpacing;
  minItemWidth?: string;
  className?: string;
  style?: CSSProperties;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'stretch';
}

export function Grid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'lg',
  minItemWidth,
  className = '',
  style = {},
  align,
  justify,
  m, mx, my, mt, mr, mb, ml,
  p, px, py, pt, pr, pb, pl,
  ...props
}: GridProps) {
  // Resolver espaçamentos (mesmo que Box)
  const spacingStyles: CSSProperties = {};
  
  // [Mesmo código de spacing que o Box...]
  if (m !== undefined) {
    const spacing = resolveSpacing(m);
    spacingStyles.margin = `${spacing}px`;
  }
  // ... (repetir lógica de spacing)

  // Grid styles
  const gridGap = resolveSpacing(gap);
  
  const gridStyles: CSSProperties = {
    display: 'grid',
    gap: `${gridGap}px`,
    ...(minItemWidth 
      ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` }
      : {
          gridTemplateColumns: typeof columns === 'number' 
            ? `repeat(${columns}, 1fr)`
            : `repeat(1, 1fr)` // Mobile default
        }
    ),
    ...(align && { alignItems: align === 'start' ? 'start' : align === 'end' ? 'end' : align }),
    ...(justify && { justifyItems: justify === 'start' ? 'start' : justify === 'end' ? 'end' : justify }),
    ...spacingStyles,
    ...style
  };

  // Responsive columns via CSS custom properties
  const responsiveStyles: CSSProperties = {
    ...gridStyles,
    ...(typeof columns === 'object' && {
      '--grid-columns-mobile': columns.mobile || 1,
      '--grid-columns-tablet': columns.tablet || 2,
      '--grid-columns-desktop': columns.desktop || 3
    } as any)
  };

  return (
    <>
      {typeof columns === 'object' && (
        <style jsx>{`
          .responsive-grid {
            grid-template-columns: repeat(var(--grid-columns-mobile), 1fr);
          }
          
          @media (min-width: ${BREAKPOINTS.tablet}px) {
            .responsive-grid {
              grid-template-columns: repeat(var(--grid-columns-tablet), 1fr);
            }
          }
          
          @media (min-width: ${BREAKPOINTS.desktop}px) {
            .responsive-grid {
              grid-template-columns: repeat(var(--grid-columns-desktop), 1fr);
            }
          }
        `}</style>
      )}
      
      <div
        className={`grid ${typeof columns === 'object' ? 'responsive-grid' : ''} ${className}`}
        style={responsiveStyles}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

// Container responsivo com max-width e padding lateral
interface ContainerProps extends SpacingProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  style?: CSSProperties;
  centerContent?: boolean;
}

const CONTAINER_SIZES = {
  sm: 640,   // 40rem
  md: 768,   // 48rem
  lg: 1024,  // 64rem
  xl: 1280,  // 80rem
  full: '100%'
};

export function Container({
  children,
  size = 'lg',
  className = '',
  style = {},
  centerContent = true,
  p = 'lg',
  ...spacingProps
}: ContainerProps) {
  const maxWidth = CONTAINER_SIZES[size];
  
  const containerStyles: CSSProperties = {
    width: '100%',
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    ...(centerContent && { margin: '0 auto' }),
    ...style
  };

  return (
    <Box
      className={`container container-${size} ${className}`}
      style={containerStyles}
      p={p}
      {...spacingProps}
    >
      {children}
    </Box>
  );
}

// Stack para layouts verticais com espaçamento consistente
interface StackProps extends SpacingProps {
  children: React.ReactNode;
  gap?: ResponsiveSpacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  style?: CSSProperties;
}

export function Stack({
  children,
  gap = 'md',
  align = 'stretch',
  className = '',
  style = {},
  ...spacingProps
}: StackProps) {
  return (
    <Box
      display="flex"
      direction="column"
      gap={gap}
      align={align}
      className={`stack ${className}`}
      style={style}
      {...spacingProps}
    >
      {children}
    </Box>
  );
}

// Inline para layouts horizontais
interface InlineProps extends SpacingProps {
  children: React.ReactNode;
  gap?: ResponsiveSpacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Inline({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
  style = {},
  ...spacingProps
}: InlineProps) {
  return (
    <Box
      display="flex"
      direction="row"
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap}
      className={`inline ${className}`}
      style={style}
      {...spacingProps}
    >
      {children}
    </Box>
  );
}

// Hook para usar o sistema de spacing
export function useSpacing() {
  const getSpacing = (size: SpacingSize): number => SPACING_SCALE[size];
  
  const getResponsiveSpacing = (spacing: ResponsiveSpacing): CSSProperties => {
    if (typeof spacing === 'string') {
      return { '--spacing': `${SPACING_SCALE[spacing]}px` } as any;
    }
    
    return {
      '--spacing-mobile': `${SPACING_SCALE[spacing.mobile || 'md']}px`,
      '--spacing-tablet': `${SPACING_SCALE[spacing.tablet || spacing.mobile || 'md']}px`,
      '--spacing-desktop': `${SPACING_SCALE[spacing.desktop || spacing.tablet || spacing.mobile || 'md']}px`
    } as any;
  };

  return {
    spacing: SPACING_SCALE,
    breakpoints: BREAKPOINTS,
    getSpacing,
    getResponsiveSpacing
  };
}

export { SPACING_SCALE, BREAKPOINTS };