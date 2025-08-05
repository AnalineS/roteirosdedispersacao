'use client';

import { ReactNode } from 'react';
import EducationalSidebar from '@/components/navigation/Sidebar';
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';

interface EducationalLayoutProps {
  children: ReactNode;
  currentPersona?: string;
  showSidebar?: boolean;
  showBreadcrumbs?: boolean;
}

export default function EducationalLayout({ 
  children, 
  currentPersona,
  showSidebar = true,
  showBreadcrumbs = true
}: EducationalLayoutProps) {
  return (
    <div className="educational-layout">
      {/* Educational Sidebar */}
      {showSidebar && (
        <EducationalSidebar currentPersona={currentPersona} />
      )}
      
      {/* Main Content Area */}
      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
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

      {/* Global Styles */}
      <style jsx global>{`
        .educational-layout {
          min-height: 100vh;
          background: #f8fafc;
        }
        
        .main-content {
          transition: margin-left 0.3s ease;
          min-height: 100vh;
        }
        
        .main-content.with-sidebar {
          margin-left: 0;
        }
        
        @media (min-width: 1024px) {
          .main-content.with-sidebar {
            margin-left: 320px;
          }
        }
        
        .content-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .content-main {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .content-main {
            padding: 16px;
          }
          
          .content-header {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}