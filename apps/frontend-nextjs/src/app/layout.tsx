import type { Metadata, Viewport } from 'next'
import ErrorBoundary from '@/components/ErrorBoundary'
import OfflineIndicator from '@/components/OfflineIndicator'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import PWAManager from '@/components/pwa/PWAManager'
import AuthProviderWrapper from '@/components/auth/AuthProviderWrapper'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'
import EnhancedCoreWebVitals from '@/components/analytics/EnhancedCoreWebVitals'
import SITE_CONFIG from '@/lib/config'
import '@/styles/globals.css'
import '@/styles/fluid-typography.css'
import '@/styles/accessibility.css'
import '@/styles/themes.css'
import '@/styles/text-selection.css'
import '@/styles/navigation-fixes.css'

export const metadata: Metadata = SITE_CONFIG.getMetadata()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#003366', // UnB institucional azul
  colorScheme: 'light' // Forçar apenas light mode
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Performance optimizations */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Icons and PWA */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme and viewport */}
        <meta name="theme-color" content="#003366" />
        <meta name="color-scheme" content="light only" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PQT-U Educacional" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {/* No JavaScript fallback */}
        {/* Google Analytics */}
        <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        
        <noscript>
          <div style={{
            background: '#f44336',
            color: 'white',
            padding: '16px',
            textAlign: 'center',
            fontSize: '14px',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999
          }}>
            <strong>JavaScript Desabilitado</strong> - Para melhor experiência, habilite JavaScript no seu navegador.
            <br />
            <a href="https://www.enable-javascript.com/pt/" style={{ color: 'white', textDecoration: 'underline' }}>
              Como habilitar JavaScript
            </a>
          </div>
          <div style={{ 
            maxWidth: '800px', 
            margin: '80px auto 0', 
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.6'
          }}>
            <h1>Sistema de Roteiros de Dispensação PQT-U</h1>
            <p>Este sistema educacional requer JavaScript para funcionar completamente.</p>
            
            <h2>Informações Essenciais sobre PQT-U:</h2>
            <ul>
              <li><strong>PQT-U (Poliquimioterapia Única)</strong>: Tratamento padrão para hanseníase</li>
              <li><strong>Duração</strong>: 6 doses mensais supervisionadas</li>
              <li><strong>Medicamentos</strong>: Rifampicina (600mg mensal), Clofazimina (300mg mensal + 50mg diário), Dapsona (100mg diário)</li>
              <li><strong>Importante</strong>: Nunca interromper o tratamento sem orientação médica</li>
            </ul>
            
            <h2>Contatos de Emergência:</h2>
            <ul>
              <li><strong>Disque Saúde</strong>: 136</li>
              <li><strong>Unidade Básica de Saúde</strong> mais próxima</li>
              <li><strong>Ambulatório de Hanseníase</strong> de referência</li>
            </ul>
            
            <p><strong>Para usar o sistema completo com assistentes virtuais, habilite JavaScript.</strong></p>
          </div>
        </noscript>
        
        <OfflineIndicator />
        <EnhancedCoreWebVitals />
        
        <main id="main-content">
          <AccessibilityProvider>
            <ThemeProvider>
              <AuthProviderWrapper>
                <AnalyticsProvider>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </AnalyticsProvider>
              </AuthProviderWrapper>
            </ThemeProvider>
          </AccessibilityProvider>
        </main>
        
        {/* PWA Manager - Service Worker desabilitado conforme solicitado */}
        <PWAManager enableServiceWorker={false} />
        
        {/* Loading screen removal script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove loading screen when React hydrates
              document.addEventListener('DOMContentLoaded', function() {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                  setTimeout(() => {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => {
                      loadingScreen.style.display = 'none';
                    }, 500);
                  }, 100);
                }
              });
            `
          }}
        />
      </body>
    </html>
  )
}