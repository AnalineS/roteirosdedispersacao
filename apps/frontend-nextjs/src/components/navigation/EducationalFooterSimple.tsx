'use client';

import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';
import { getUniversityLogo } from '@/constants/avatars';
import { usePersonas } from '@/hooks/usePersonas';

interface EducationalFooterSimpleProps {
  variant?: 'full' | 'simple';
  showNavigation?: boolean;
}

export default function EducationalFooterSimple({ 
  variant = 'full', 
  showNavigation = true 
}: EducationalFooterSimpleProps) {
  const unbColors = getUnbColors();
  const { getValidPersonasCount } = usePersonas();
  
  const currentYear = new Date().getFullYear();
  const assistentsCount = (() => {
    const count = getValidPersonasCount();
    return count > 0 ? count : 2;
  })();

  return (
    <footer style={{
      marginTop: 'auto',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderTop: '2px solid #e2e8f0'
    }}>
      {/* Link para Mapa do Site - Compacto */}
      {showNavigation && variant === 'full' && (
        <div style={{
          background: 'rgba(248, 250, 252, 0.8)',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 0'
        }}>
          <div style={{
            maxWidth: 'min(900px, 95vw)',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <Link
              href="/sitemap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: unbColors.primary,
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '8px',
                border: `1px solid ${unbColors.alpha.primary}`,
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.05)';
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Mapa do Site
            </Link>
          </div>
        </div>
      )}

      {/* Seção institucional compacta */}
      <div style={{
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 'min(900px, 95vw)', margin: '0 auto' }}>
          
          {/* Container principal compacto */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Primeira linha: Logos + Endereço + Contato */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              {/* Logos */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <img 
                  src={getUniversityLogo('unb_symbol')} 
                  alt="Universidade de Brasília"
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'contain'
                  }}
                />
                <img 
                  src={getUniversityLogo('ppgcf_logo')} 
                  alt="Programa de Pós-Graduação em Ciências Farmacêuticas"
                  style={{
                    width: '40px',
                    height: '32px',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Endereço compacto */}
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b',
                textAlign: 'center',
                lineHeight: '1.3'
              }}>
                <div style={{ color: '#003366', fontWeight: '600', fontSize: '0.8rem' }}>UnB</div>
                <div>Campus Darcy Ribeiro • Brasília - DF • CEP: 70910-900</div>
              </div>

              {/* Contato compacto */}
              <div style={{
                fontSize: '0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#059669', fontWeight: '600', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Contato</div>
                <a 
                  href="mailto:roteirosdedispensacaounb@gmail.com"
                  style={{
                    color: '#059669',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  roteirosdedispensacaounb@gmail.com
                </a>
              </div>
            </div>

            {/* Segunda linha: Informações finais */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#3b82f6',
                fontWeight: '500'
              }}>
                {assistentsCount} assistentes especializados
              </div>
              
              <div style={{
                fontSize: '0.7rem',
                color: '#94a3b8'
              }}>
                Pesquisa de doutorado • {currentYear} © {currentYear} Sistema Educacional Roteiros de Dispensação
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}