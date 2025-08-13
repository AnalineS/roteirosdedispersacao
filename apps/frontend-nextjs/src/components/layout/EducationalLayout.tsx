'use client';

import { ReactNode } from 'react';
import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';
import EducationalFooter from '@/components/navigation/EducationalFooter';
import LanguageToggle from '@/components/accessibility/LanguageToggle';
import FocusIndicator, { SkipLink } from '@/components/accessibility/FocusIndicator';

interface EducationalLayoutProps {
  children: ReactNode;
  currentPersona?: string;
  showHeader?: boolean;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
  footerVariant?: 'full' | 'simple';
}

export default function EducationalLayout({ 
  children, 
  currentPersona,
  showHeader = true,
  showBreadcrumbs = true,
  showFooter = true,
  footerVariant = 'full'
}: EducationalLayoutProps) {
  return (
    <div className="educational-layout" role="document">
      {/* Indicador de foco global */}
      <FocusIndicator 
        enabled={true}
        animation={true}
      />
      
      {/* Skip links para navegação rápida */}
      <SkipLink href="#main-content">
        Pular para o conteúdo principal
      </SkipLink>
      <SkipLink href="#navigation">
        Pular para navegação
      </SkipLink>
      <SkipLink href="#footer">
        Pular para rodapé
      </SkipLink>
      
      {/* Navigation Header */}
      {showHeader && (
        <NavigationHeader currentPersona={currentPersona} />
      )}
      
      {/* Main Content Area */}
      <div className="main-content" role="main">
        {/* Breadcrumbs Header */}
        {showBreadcrumbs && (
          <header className="content-header" role="navigation" aria-label="Breadcrumb navigation">
            <EducationalBreadcrumbs />
          </header>
        )}
        
        {/* Page Content */}
        <main className="content-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Educational Footer */}
      {showFooter && (
        <EducationalFooter 
          variant={footerVariant}
          showNavigation={footerVariant === 'full'} 
        />
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .educational-layout {
          min-height: 100vh;
          background: #f8fafc;
        }
        
        .main-content {
          min-height: calc(100vh - 72px - 400px); /* header 72px + footer estimado 400px */
          margin-top: 0;
          transition: all 0.3s ease;
        }
        
        .content-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: sticky;
          top: 72px; /* Posicionar abaixo do header de navegação */
          z-index: 10;
        }
        
        .content-main {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: calc(100vh - 72px - 400px - 60px); /* header + footer + breadcrumbs */
        }
        
        /* Responsividade Mobile */
        @media (max-width: 768px) {
          .content-main {
            padding: 16px;
            min-height: calc(100vh - 72px - 350px - 60px); /* header + footer mobile + breadcrumbs */
          }
          
          .content-header {
            padding: 12px 16px;
            top: 72px; /* Manter abaixo do header mobile */
          }
        }
        
        /* Responsividade Tablet */
        @media (min-width: 769px) and (max-width: 1279px) {
          .content-main {
            padding: 20px;
          }
          
          .content-header {
            padding: 14px 20px;
          }
        }
        
        /* Desktop */
        @media (min-width: 1280px) {
          .content-main {
            padding: 32px;
            max-width: 1400px; /* Mais espaço em desktop sem sidebar */
          }
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Respect user's reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }

        /* Improve focus visibility */
        .educational-layout *:focus {
          outline: 2px solid #003366;
          outline-offset: 2px;
        }

        .educational-layout *:focus:not(:focus-visible) {
          outline: none;
        }

        .educational-layout *:focus-visible {
          outline: 2px solid #003366;
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .educational-layout {
            border: 2px solid currentColor;
          }
          
          .content-header,
          .content-main {
            border: 1px solid currentColor;
          }
        }

        /* Screen reader improvements */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        /* Layout sem header (casos especiais) */
        .educational-layout:not(:has(.navigation-header)) .main-content {
          min-height: 100vh;
        }
        
        .educational-layout:not(:has(.navigation-header)) .content-header {
          top: 0;
        }
      `}</style>
    </div>
  );
}