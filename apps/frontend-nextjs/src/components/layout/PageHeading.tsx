/**
 * PageHeading Component - WCAG 2.1 Compliant Page Title
 *
 * Ensures single H1 per page with consistent styling and accessibility.
 * Use this component for the main title of each page.
 *
 * For section headings, use HierarchyHeading with level="h2" or lower.
 *
 * @example
 * // Standard page heading
 * <PageHeading>Módulos Educacionais</PageHeading>
 *
 * // Screen-reader only (for visual layouts like chat)
 * <PageHeading srOnly>Chat com Dr. Gasnelio</PageHeading>
 *
 * // With subtitle
 * <PageHeading subtitle="Aprenda sobre hanseníase">Módulos</PageHeading>
 */

import React from 'react';

interface PageHeadingProps {
  children: React.ReactNode;
  /** Makes heading visually hidden but accessible to screen readers */
  srOnly?: boolean;
  /** Optional subtitle displayed below the heading */
  subtitle?: string;
  /** Additional CSS classes */
  className?: string;
  /** ID for anchor linking */
  id?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

export function PageHeading({
  children,
  srOnly = false,
  subtitle,
  className = '',
  id,
  style,
}: PageHeadingProps) {
  const baseStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: 'var(--hierarchy-color-primary, #003366)',
    ...style,
  };

  const srOnlyStyles: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  return (
    <>
      <h1
        id={id}
        className={`page-heading ${srOnly ? 'sr-only' : ''} ${className}`}
        style={srOnly ? srOnlyStyles : baseStyles}
      >
        {children}
      </h1>
      {subtitle && !srOnly && (
        <p
          className="page-heading-subtitle"
          style={{
            fontSize: '1.125rem',
            lineHeight: 1.6,
            color: 'var(--hierarchy-color-tertiary, #64748b)',
            marginTop: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {subtitle}
        </p>
      )}
    </>
  );
}

export default PageHeading;
