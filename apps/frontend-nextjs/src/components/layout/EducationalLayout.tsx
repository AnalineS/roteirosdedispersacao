'use client';

import { ReactNode } from 'react';
import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';
import EducationalFooter from '@/components/navigation/EducationalFooter';
import LanguageToggle from '@/components/accessibility/LanguageToggle';
import FocusIndicator, { SkipLink } from '@/components/accessibility/FocusIndicator';
import VisualHierarchyOptimizer from '@/components/layout/VisualHierarchyOptimizer';
import MobileFirstFramework from '@/components/mobile/MobileFirstFramework';

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
    <VisualHierarchyOptimizer applyToRoot={true}>
      <MobileFirstFramework enableSwipeGestures={true} touchTargetSize="medium">
        <div className="educational-layout hierarchy-content-container mobile-safe-area" role="document">
        {/* Indicador de foco global */}
        <FocusIndicator 
          enabled={true}
          animation={true}
        />
      
      {/* Skip links para navegação rápida - Container organizado */}
      <div className="skip-links-container" role="navigation" aria-label="Links de navegação rápida">
        <SkipLink href="#main-content">
          Pular para o conteúdo principal
        </SkipLink>
        <SkipLink href="#navigation">
          Pular para navegação
        </SkipLink>
        <SkipLink href="#footer">
          Pular para rodapé
        </SkipLink>
      </div>
      
      {/* Navigation Header */}
      {showHeader && (
        <nav id="navigation" role="banner" aria-label="Navegação principal">
          <NavigationHeader currentPersona={currentPersona} />
        </nav>
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
        <main className="content-main hierarchy-section" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Educational Footer */}
      {showFooter && (
        <footer id="footer" role="contentinfo" aria-label="Rodapé da página">
          <EducationalFooter 
            variant={footerVariant}
            showNavigation={footerVariant === 'full'} 
          />
        </footer>
      )}
        </div>
      </MobileFirstFramework>
    </VisualHierarchyOptimizer>
  );
}