import { ReactNode } from 'react';
import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalFooterSimple from '@/components/navigation/EducationalFooterSimple';
import FastAccessBar from '@/components/navigation/FastAccessBar';
import DeveloperToolsProvider from '@/components/dx/DeveloperToolsProvider';
import IntelligentNavigationProvider from '@/components/navigation/IntelligentNavigationProvider';
import GlobalKeyboardProvider from '@/components/navigation/GlobalKeyboardProvider';

interface StaticEducationalLayoutProps {
  children: ReactNode;
}

export default function StaticEducationalLayout({ children }: StaticEducationalLayoutProps) {
  return (
    <GlobalKeyboardProvider>
      <IntelligentNavigationProvider enabled={true}>
        <DeveloperToolsProvider>
          <div className="educational-layout" role="document">
            {/* Fast Access Bar para emergências médicas */}
            <FastAccessBar position="top" behavior="smart-hide" />

            {/* Unified Navigation Header */}
            <NavigationHeader />

            {/* Main Content */}
            <main
              id="main-content"
              role="main"
              style={{
                minHeight: 'calc(100vh - 160px)', // Ajustado para Fast Access Bar
                paddingTop: '160px', // 40px FastAccessBar + 120px header
                width: '100%'
              }}
            >
              {children}
            </main>

            {/* Footer */}
            <EducationalFooterSimple variant="full" showNavigation={true} />
          </div>
        </DeveloperToolsProvider>
      </IntelligentNavigationProvider>
    </GlobalKeyboardProvider>
  );
}