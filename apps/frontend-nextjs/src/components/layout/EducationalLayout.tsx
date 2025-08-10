'use client';

import { ReactNode } from 'react';
import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';
import EducationalFooter from '@/components/navigation/EducationalFooter';

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
    <div className="educational-layout">
      {/* Navigation Header */}
      {showHeader && (
        <NavigationHeader currentPersona={currentPersona} />
      )}
      
      {/* Main Content Area */}
      <div className="main-content">
        {/* Breadcrumbs Header */}
        {showBreadcrumbs && (
          <header className="content-header">
            <EducationalBreadcrumbs />
          </header>
        )}
        
        {/* Page Content */}
        <main className="content-main">
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