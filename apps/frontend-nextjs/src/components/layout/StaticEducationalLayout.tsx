import { ReactNode } from 'react';
import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalFooterSimple from '@/components/navigation/EducationalFooterSimple';

interface StaticEducationalLayoutProps {
  children: ReactNode;
}

export default function StaticEducationalLayout({ children }: StaticEducationalLayoutProps) {
  return (
    <div className="educational-layout" role="document">
      {/* Unified Navigation Header */}
      <NavigationHeader />
      
      {/* Main Content */}
      <main 
        id="main-content" 
        role="main"
        style={{
          minHeight: 'calc(100vh - 120px)',
          paddingTop: '120px', // Para compensar o header fixo (80px nav + 40px busca)
          width: '100%'
        }}
      >
        {children}
      </main>
      
      {/* Footer */}
      <EducationalFooterSimple variant="full" showNavigation={true} />
    </div>
  );
}