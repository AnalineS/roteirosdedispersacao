'use client';

import { ReactNode } from 'react';
import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';
import EducationalFooterSimple from '@/components/navigation/EducationalFooterSimple';
import LanguageToggle from '@/components/accessibility/LanguageToggle';
import FocusIndicator, { SkipLink } from '@/components/accessibility/FocusIndicator';
import VisualHierarchyOptimizer from '@/components/layout/VisualHierarchyOptimizer';
import MobileFirstFramework from '@/components/mobile/MobileFirstFramework';
import GlobalPersonaFAB from '@/components/ui/GlobalPersonaFAB';
import QuickNavigationMenu from '@/components/navigation/QuickNavigationMenu';
import { GlobalNavigationProvider } from '@/components/navigation/GlobalNavigationProvider';
import { FloatingElementsCoordinator } from '@/components/navigation/FloatingElementsCoordinator';
import { SmartNavigationProvider } from '@/components/navigation/SmartNavigationSystem';
import FABCollisionDetector from '@/components/layout/FABCollisionDetector';

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
    <GlobalNavigationProvider>
      <SmartNavigationProvider>
        <FloatingElementsCoordinator>
          <VisualHierarchyOptimizer applyToRoot={true}>
            <MobileFirstFramework enableSwipeGestures={true} touchTargetSize="medium">
              <div className="educational-layout hierarchy-content-container mobile-safe-area" role="document">
        {/* Indicador de foco global */}
        <FocusIndicator 
          enabled={true}
          animation={true}
        />
      
      {/* Navigation Header */}
      {showHeader && (
        <header role="banner">
          <nav id="navigation" aria-label="Navegação principal">
            <NavigationHeader currentPersona={currentPersona} />
          </nav>
        </header>
      )}
      
      {/* Skip links consolidados - Apenas os essenciais */}
      <div className="skip-links-container" role="navigation" aria-label="Links de acesso rápido">
        <SkipLink href="#main-content">
          Pular para conteúdo principal
        </SkipLink>
        <SkipLink href="#chat-input">
          Ir para campo de mensagem
        </SkipLink>
      </div>
      
      {/* Main Content Area */}
      <div className="main-content" role="main">
        {/* Breadcrumbs Header */}
        {showBreadcrumbs && (
          <header className="content-header" role="navigation" aria-label="Breadcrumb navigation">
            <EducationalBreadcrumbs />
          </header>
        )}
        
        {/* Page Content com detecção de colisão do FAB */}
        <main className="content-main hierarchy-section" id="main-content" tabIndex={-1}>
          <FABCollisionDetector>
            {children}
          </FABCollisionDetector>
        </main>
      </div>

      {/* Educational Footer */}
      {showFooter && (
        <footer id="footer" role="contentinfo" aria-label="Rodapé da página">
          <EducationalFooterSimple 
            variant={footerVariant}
            showNavigation={footerVariant === 'full'} 
          />
        </footer>
      )}

      {/* Global Persona FAB - Disponível em todas as páginas */}
      <GlobalPersonaFAB />

      {/* Quick Navigation Menu - Disponível em todas as páginas */}
      <QuickNavigationMenu position="bottom-left" showOnMobile={true} />

        </div>
      </MobileFirstFramework>
    </VisualHierarchyOptimizer>
        </FloatingElementsCoordinator>
      </SmartNavigationProvider>
    </GlobalNavigationProvider>
  );
}