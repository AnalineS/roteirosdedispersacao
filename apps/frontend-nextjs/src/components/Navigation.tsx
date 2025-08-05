'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { theme } from '@/config/theme';
import { getUniversityLogo } from '@/constants/avatars';
import Image from 'next/image';

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
          background: theme.colors.primary[500],
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
          background: theme.gradients.primary,
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
          {/* Logo da UnB e Título */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'white',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Image
                src={getUniversityLogo('unb_symbol')}
                alt="UnB"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                Roteiros de Dispensação
              </h2>
              <p style={{
                margin: '2px 0 0',
                fontSize: '0.8rem',
                opacity: 0.8
              }}>
                PQT-U Educacional
              </p>
            </div>
          </div>
          
          {/* Programa acadêmico */}
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.7,
            marginBottom: currentPersona ? '8px' : '0'
          }}>
            PPGCF • Universidade de Brasília
          </div>
          
          {currentPersona && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              <span style={{ opacity: 0.8 }}>Assistente ativo:</span>
              <br />
              <strong>{currentPersona}</strong>
            </div>
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
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {/* Logo PPGCF */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'white',
              borderRadius: '6px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Image
                src={getUniversityLogo('ppgcf_logo')}
                alt="PPGCF"
                width={24}
                height={24}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.8,
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Sistema Educacional
            </div>
            <div style={{ marginBottom: '4px' }}>
              Roteiros de Dispensação PQT-U
            </div>
            <div style={{ opacity: 0.6 }}>
              PPGCF - UnB
            </div>
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