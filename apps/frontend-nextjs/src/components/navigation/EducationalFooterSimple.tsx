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
      {/* Link para Mapa do Site - Rede de segurança para navegação completa */}
      {showNavigation && variant === 'full' && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '1.5rem 0'
        }}>
          <div style={{
            maxWidth: 'min(1200px, 95vw)',
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
                fontSize: '0.95rem',
                fontWeight: '600',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '12px',
                border: `1px solid ${unbColors.alpha.primary}`,
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div>Mapa do Site</div>
                <div style={{
                  fontSize: '0.8rem',
                  opacity: 0.8,
                  fontWeight: '400'
                }}>
                  Navegação completa de todas as páginas
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Seção institucional simplificada - APENAS informações obrigatórias */}
      <div style={{
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 'min(1000px, 90vw)', margin: '0 auto' }}>
          {/* Logos institucionais */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <img 
              src={getUniversityLogo('unb_symbol')} 
              alt="Universidade de Brasília"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain'
              }}
            />
            <div style={{
              width: '2px',
              height: '50px',
              backgroundColor: '#cbd5e1'
            }}></div>
            <img 
              src={getUniversityLogo('ppgcf_logo')} 
              alt="Programa de Pós-Graduação em Ciências Farmacêuticas"
              style={{
                width: '70px',
                height: '60px',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* Informações obrigatórias conforme solicitação */}
          <div style={{
            marginBottom: '2rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Endereço UnB */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                color: '#003366',
                fontWeight: '700',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Endereço
              </h3>
              
              <p style={{
                fontSize: '1rem',
                color: '#1e40af',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Universidade de Brasília (UnB)
              </p>
              
              <p style={{
                fontSize: '0.95rem',
                color: '#64748b',
                marginBottom: '0',
                lineHeight: '1.6'
              }}>
                Campus Universitário Darcy Ribeiro<br />
                Brasília - DF, Brasil<br />
                CEP: 70910-900
              </p>
            </div>

            {/* Email de contato */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <p style={{
                fontSize: '0.95rem',
                color: '#059669',
                margin: 0,
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <a 
                  href="mailto:roteirosdedispensacaounb@gmail.com"
                  style={{
                    color: '#059669',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  roteirosdedispensacaounb@gmail.com
                </a>
              </p>
            </div>

            {/* Copyright */}
            <div style={{
              padding: '1rem',
              background: 'rgba(107, 114, 128, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(107, 114, 128, 0.1)'
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#374151',
                margin: '0 0 0.5rem',
                fontWeight: '600'
              }}>
                © {currentYear} Sistema Educacional Roteiros de Dispensação
              </p>
              <p style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                margin: 0
              }}>
                Todos os direitos reservados
              </p>
            </div>
          </div>

          {/* Contador de assistentes (informativo) */}
          <div style={{
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            display: 'inline-block',
            marginBottom: '1rem'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#3b82f6',
              margin: 0,
              fontWeight: '500'
            }}>
              {assistentsCount} assistentes especializados disponíveis
            </p>
          </div>

          {/* Nota sobre tese de doutorado */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1rem',
            fontSize: '0.8rem',
            color: '#94a3b8'
          }}>
            <p style={{ margin: 0 }}>
              Plataforma desenvolvida como parte da pesquisa de doutorado em Ciências Farmacêuticas • {currentYear}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}