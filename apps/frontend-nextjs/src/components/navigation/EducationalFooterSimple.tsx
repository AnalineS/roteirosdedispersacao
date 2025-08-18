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

      {/* Seção institucional simplificada - APENAS informações obrigatórias */}
      <div style={{
        padding: '1.5rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 'min(900px, 95vw)', margin: '0 auto' }}>
          {/* Logos institucionais */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <img 
              src={getUniversityLogo('unb_symbol')} 
              alt="Universidade de Brasília"
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain'
              }}
            />
            <div style={{
              width: '1px',
              height: '30px',
              backgroundColor: '#cbd5e1'
            }}></div>
            <img 
              src={getUniversityLogo('ppgcf_logo')} 
              alt="Programa de Pós-Graduação em Ciências Farmacêuticas"
              style={{
                width: '50px',
                height: '40px',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* Informações obrigatórias conforme solicitação */}
          <div style={{
            marginBottom: '1rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Informações compactas em grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {/* Endereço UnB */}
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  color: '#003366',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  UnB
                </h3>
                
                <p style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Campus Darcy Ribeiro<br />
                  Brasília - DF<br />
                  CEP: 70910-900
                </p>
              </div>

              {/* Email de contato */}
              <div style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  color: '#059669',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Contato
                </h3>
                <p style={{
                  fontSize: '0.8rem',
                  margin: 0,
                  textAlign: 'center'
                }}>
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
                </p>
              </div>
            </div>

            {/* Copyright compacto */}
            <div style={{
              padding: '0.75rem',
              background: 'rgba(107, 114, 128, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(107, 114, 128, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.8rem',
                color: '#374151',
                margin: 0,
                fontWeight: '500'
              }}>
                © {currentYear} Sistema Educacional Roteiros de Dispensação
              </p>
            </div>
          </div>

          {/* Informações finais compactas */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: '#3b82f6',
              fontWeight: '500'
            }}>
              {assistentsCount} assistentes especializados
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              Pesquisa de doutorado • {currentYear}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}