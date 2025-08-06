import type { Metadata, Viewport } from 'next'
import ErrorBoundary from '@/components/ErrorBoundary'
import OfflineIndicator from '@/components/OfflineIndicator'
import SITE_CONFIG from '@/lib/config'
import '@/styles/globals.css'
import '@/styles/accessibility.css'

export const metadata: Metadata = SITE_CONFIG.getMetadata()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
  colorScheme: 'light'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {/* No JavaScript fallback */}
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
        
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <main id="main-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        
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