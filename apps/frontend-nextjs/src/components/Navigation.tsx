'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavigationProps {
  currentPersona?: string;
}

export default function Navigation({ currentPersona }: NavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'home',
      label: 'Início',
      href: '/',
      icon: '🏠',
      description: 'Seleção de assistentes virtuais'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      description: 'Progresso educacional e recursos'
    },
    {
      id: 'chat',
      label: 'Conversar',
      href: '/chat',
      icon: '💬',
      description: 'Chat com assistentes especializados'
    },
    {
      id: 'modules',
      label: 'Módulos',
      href: '/modules',
      icon: '📚',
      description: 'Conteúdo educacional estruturado'
    },
    {
      id: 'resources',
      label: 'Recursos',
      href: '/resources',
      icon: '🎯',
      description: 'Calculadoras, checklists e ferramentas'
    },
    {
      id: 'progress',
      label: 'Progresso',
      href: '/progress',
      icon: '📈',
      description: 'Acompanhe seu aprendizado'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'block'
        }}
        className="lg:hidden"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: isMenuOpen ? 0 : '-300px',
          width: '280px',
          height: '100vh',
          background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          transition: 'left 0.3s ease',
          zIndex: 999,
          overflowY: 'auto',
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
        }}
        className="lg:left-0"
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            PQT-U Educacional
          </h2>
          {currentPersona && (
            <p style={{
              margin: '5px 0 0',
              fontSize: '0.9rem',
              opacity: 0.8
            }}>
              Assistente: {currentPersona}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <div style={{ padding: '20px 0' }}>
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'block',
                padding: '15px 20px',
                color: 'white',
                textDecoration: 'none',
                borderLeft: isActive(item.href) ? '4px solid white' : '4px solid transparent',
                background: isActive(item.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <div>
                  <div style={{ 
                    fontWeight: isActive(item.href) ? 'bold' : 'normal',
                    fontSize: '1rem'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    marginTop: '2px'
                  }}>
                    {item.description}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.7,
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 5px' }}>Sistema Educacional</p>
            <p style={{ margin: 0 }}>Hanseníase PQT-U</p>
          </div>
        </div>
      </nav>

      {/* Desktop: Push content when sidebar is visible */}
      <style jsx global>{`
        @media (min-width: 1024px) {
          .main-content {
            margin-left: 280px;
            transition: margin-left 0.3s ease;
          }
        }
      `}</style>
    </>
  );
}