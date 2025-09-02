import { ReactNode } from 'react';
import Link from 'next/link';

interface StaticEducationalLayoutProps {
  children: ReactNode;
}

export default function StaticEducationalLayout({ children }: StaticEducationalLayoutProps) {
  return (
    <div className="educational-layout" role="document">
      {/* Static Navigation Header */}
      <header role="banner" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #003366 100%)',
        color: 'white',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <nav style={{ 
          maxWidth: 'min(1200px, 95vw)', 
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '700'
          }}>
            <span style={{
              width: '32px',
              height: '32px',
              background: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              🏥
            </span>
            PQT-U Educacional
          </Link>

          {/* Navigation Menu */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <Link href="/modules" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease',
              fontSize: '0.95rem'
            }}>
              Módulos
            </Link>
            <Link href="/resources" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease',
              fontSize: '0.95rem'
            }}>
              Recursos
            </Link>
            <Link href="/chat" style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
              Chat
            </Link>
          </div>
        </nav>
      </header>

      {/* Skip to Content Link */}
      <a href="#main-content" style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: '#003366',
        color: 'white',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 9999,
        fontSize: '14px'
      }}>
        Pular para conteúdo principal
      </a>

      {/* Main Content */}
      <main id="main-content" role="main">
        {children}
      </main>

      {/* Static Footer */}
      <footer role="contentinfo" style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '2rem 0',
        marginTop: '4rem'
      }}>
        <div style={{ 
          maxWidth: 'min(1200px, 95vw)', 
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <Link href="/sobre" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Sobre
            </Link>
            <Link href="/privacidade" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Privacidade
            </Link>
            <Link href="/termos" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Termos de Uso
            </Link>
            <Link href="/glossario" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Glossário
            </Link>
          </div>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '0.875rem',
            margin: 0
          }}>
            © 2024 UnB - Sistema Educacional PQT-U para Hanseníase
          </p>
        </div>
      </footer>
    </div>
  );
}