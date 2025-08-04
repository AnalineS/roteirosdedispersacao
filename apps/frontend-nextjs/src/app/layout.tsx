import type { Metadata, Viewport } from 'next'
import ErrorBoundary from '@/components/ErrorBoundary'
import OfflineIndicator from '@/components/OfflineIndicator'

export const metadata: Metadata = {
  metadataBase: new URL('https://roteirosdedispensacao.com'),
  title: 'Roteiros de Dispensação – Assistentes Educacionais',
  description: 'Plataforma educacional com assistentes virtuais Dr. Gasnelio e Gá para orientação sobre poliquimioterapia de hanseníase (PQT-U)',
  keywords: 'hanseníase, PQT-U, educação médica, assistente educacional, Dr. Gasnelio, Gá, poliquimioterapia, aprendizagem adaptativa',
  authors: [{ name: 'Roteiro de Dispensação - Assistentes Educacionais' }],
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Roteiros de Dispensação - Assistentes Educacionais',
    description: 'Plataforma educacional com Dr. Gasnelio e Gá - assistentes virtuais especializados em PQT-U para hanseníase',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roteiros de Dispensação - Assistentes Educacionais',
    description: 'Plataforma educacional com Dr. Gasnelio e Gá - assistentes virtuais especializados em PQT-U para hanseníase',
    images: ['/og-image.png']
  },
  manifest: '/manifest.webmanifest'
}

export const viewport: Viewport = {
  themeColor: '#2563eb'
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
        <link rel="canonical" href="https://roteirosdedispensacao.com/" />
      </head>
      <body>
        <OfflineIndicator />
        
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-blue-600 text-white px-4 py-2 rounded z-50">
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