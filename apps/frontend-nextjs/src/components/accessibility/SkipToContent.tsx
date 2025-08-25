'use client';

import React from 'react';

interface SkipToContentProps {
  mainContentId?: string;
}

export default function SkipToContent({ mainContentId = 'main-content' }: SkipToContentProps) {
  const handleSkip = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'smooth' });
      mainContent.focus();
    }
  };

  return (
    <a
      href={`#${mainContentId}`}
      onClick={handleSkip}
      className="skip-to-content"
      style={{
        position: 'absolute',
        top: '-100px',
        left: '6px',
        background: 'var(--color-primary-500)',
        color: 'white',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        textDecoration: 'none',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        zIndex: 'var(--z-tooltip)',
        transition: 'top var(--transition-fast)',
        boxShadow: 'var(--shadow-lg)',
        outline: '2px solid transparent',
        outlineOffset: '2px',
        minWidth: 'var(--touch-target-min)',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap'
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '6px';
        e.currentTarget.style.outline = '2px solid var(--color-white)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100px';
        e.currentTarget.style.outline = '2px solid transparent';
      }}
      aria-label="Pular para o conteúdo principal"
    >
      Pular para o conteúdo
    </a>
  );
}