'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';
import { getUniversityLogo } from '@/constants/avatars';
import { usePersonas } from '@/hooks/usePersonas';
import {
  SystemLogoIcon,
  HomeIcon,
  ModulesIcon,
  DashboardIcon,
  ChatBotIcon,
  ResourcesIcon,
  ProgressIcon,
  InstitutionalIcon,
  ChevronDownIcon
} from '@/components/icons/NavigationIcons';

interface FooterSection {
  title: string;
  links: {
    label: string;
    href: string;
    description?: string;
    external?: boolean;
  }[];
}

interface EducationalFooterProps {
  variant?: 'full' | 'simple';
  showNavigation?: boolean;
}

export default function EducationalFooter({ 
  variant = 'full', 
  showNavigation = true 
}: EducationalFooterProps) {
  const unbColors = getUnbColors();
  const { getValidPersonasCount } = usePersonas();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Navegação principal (links funcionais)
  const mainNavigation: FooterSection = {
    title: 'Navegação Principal',
    links: [
      { label: 'Início', href: '/', description: 'Página inicial do sistema' },
      { label: 'Módulos Educacionais', href: '/modules', description: 'Conteúdo educacional estruturado' },
      { label: 'Dashboard', href: '/dashboard', description: 'Visão geral do progresso' },
      { label: 'Chat com Assistentes', href: '/chat', description: 'Dr. Gasnelio e Gá' },
      { label: 'Recursos Práticos', href: '/resources', description: 'Ferramentas e calculadoras' },
      { label: 'Meu Progresso', href: '/progress', description: 'Acompanhamento de aprendizagem' }
    ]
  };

  // Seções de navegação expandida
  const footerSections: Record<string, FooterSection> = {
    institutional: {
      title: 'Institucional',
      links: [
        { label: 'Sobre o Sistema', href: '/sobre', description: 'Informações sobre a plataforma' },
        { label: 'Sobre a Tese', href: '/modules/sobre-a-tese', description: 'Pesquisa de doutorado' },
        { label: 'Metodologia', href: '/metodologia', description: 'Metodologia científica aplicada' },
      ]
    },
    
    compliance: {
      title: 'Compliance & Privacidade',
      links: [
        { label: 'Política de Privacidade', href: '/privacidade', description: 'Proteção de dados pessoais' },
        { label: 'Termos de Uso', href: '/termos', description: 'Condições de utilização' },
        { label: 'Conformidade LGPD', href: '/conformidade', description: 'Adequação à legislação brasileira' },
        { label: 'Código de Ética', href: '/etica', description: 'Princípios éticos da pesquisa' }
      ]
    },
    
    academic: {
      title: 'Recursos Acadêmicos',
      links: [
        { label: 'Roteiro de Dispensação', href: '/modules/roteiro-dispensacao', description: 'Procedimentos farmacêuticos detalhados' },
        { label: 'Vida com Hanseníase', href: '/modules/vida-com-doenca', description: 'Qualidade de vida e suporte ao paciente' },
        { label: 'Glossário', href: '/glossario', description: 'Termos técnicos da hanseníase' },
        { label: 'Bibliografia', href: '/bibliografia', description: 'Referências científicas' },
        { label: 'Publicações', href: '/publicacoes', description: 'Artigos e trabalhos relacionados' },
        { label: 'Como Citar', href: '/como-citar', description: 'Instruções para citação acadêmica' }
      ]
    },
    
    support: {
      title: 'Suporte & Recursos',
      links: [
        { label: 'FAQ - Perguntas Frequentes', href: '/faq', description: 'Dúvidas mais comuns' },
        { label: 'Guia do Usuário', href: '/guia', description: 'Manual de utilização' },
        { label: 'Downloads', href: '/downloads', description: 'Materiais para download' },
        { label: 'Contato', href: '/contato', description: 'Canais de comunicação' }
      ]
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

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
      {/* Navegação expandida (Desktop) / Accordion (Mobile) */}
      {showNavigation && variant === 'full' && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '3rem 2rem'
          }}>
            {/* Desktop Navigation - 4 colunas */}
            <div className="desktop-navigation" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Navegação Principal - Sempre visível */}
              <div>
                <h3 style={{
                  margin: '0 0 1rem',
                  color: unbColors.primary,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderBottom: `2px solid ${unbColors.alpha.primary}`,
                  paddingBottom: '0.5rem'
                }}>
                  <SystemLogoIcon size={20} color={unbColors.primary} style={{ marginRight: '8px' }} />
                  {mainNavigation.title}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {mainNavigation.links.map((link) => (
                    <li key={link.href} style={{ marginBottom: '0.75rem' }}>
                      <Link
                        href={link.href}
                        style={{
                          color: unbColors.neutral,
                          textDecoration: 'none',
                          fontSize: '0.95rem',
                          lineHeight: '1.4',
                          display: 'block',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = unbColors.secondary}
                        onMouseLeave={(e) => e.currentTarget.style.color = unbColors.neutral}
                      >
                        <strong>{link.label}</strong>
                        {link.description && (
                          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '2px' }}>
                            {link.description}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Seções expandidas */}
              {Object.entries(footerSections).map(([sectionId, section]) => (
                <div key={sectionId}>
                  <h3 style={{
                    margin: '0 0 1rem',
                    color: unbColors.primary,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${unbColors.alpha.primary}`,
                    paddingBottom: '0.5rem'
                  }}>
                    {section.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {section.links.map((link) => (
                      <li key={link.href} style={{ marginBottom: '0.75rem' }}>
                        <Link
                          href={link.href}
                          style={{
                            color: unbColors.neutral,
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            display: 'block',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = unbColors.secondary}
                          onMouseLeave={(e) => e.currentTarget.style.color = unbColors.neutral}
                        >
                          <strong>{link.label}</strong>
                          {link.description && (
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>
                              {link.description}
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Mobile Accordion - Apenas em mobile */}
            <div className="mobile-navigation" style={{ display: 'none' }}>
              {/* Navegação Principal - Sempre expandida no mobile */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  margin: '0 0 1rem',
                  color: unbColors.primary,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  <SystemLogoIcon size={20} color={unbColors.primary} style={{ marginRight: '8px' }} />
                  {mainNavigation.title}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {mainNavigation.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        color: unbColors.secondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        background: unbColors.alpha.secondary,
                        transition: 'all 0.2s'
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Seções colapsáveis */}
              {Object.entries(footerSections).map(([sectionId, section]) => (
                <div key={sectionId} style={{ marginBottom: '1rem' }}>
                  <button
                    onClick={() => toggleSection(sectionId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: unbColors.alpha.primary,
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '8px',
                      color: unbColors.primary,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {section.title}
                    <ChevronDownIcon 
                      size={16} 
                      color={unbColors.primary}
                      style={{
                        transform: expandedSections.has(sectionId) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    />
                  </button>
                  
                  {expandedSections.has(sectionId) && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          style={{
                            display: 'block',
                            color: unbColors.neutral,
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            padding: '0.5rem 0',
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = unbColors.secondary}
                          onMouseLeave={(e) => e.currentTarget.style.color = unbColors.neutral}
                        >
                          <strong>{link.label}</strong>
                          {link.description && (
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>
                              {link.description}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seção institucional (mantida do footer original) */}
      <div style={{
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
              alt="UnB"
              style={{
                width: '50px',
                height: '50px',
                objectFit: 'contain'
              }}
            />
            <div style={{
              width: '2px',
              height: '40px',
              backgroundColor: '#cbd5e1'
            }}></div>
            <img 
              src={getUniversityLogo('ppgcf_logo')} 
              alt="PPGCF"
              style={{
                width: '60px',
                height: '50px',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* Informações institucionais */}
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Tese de Doutorado - Programa de Pós-Graduação em Ciências Farmacêuticas
          </p>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            marginBottom: '1.5rem'
          }}>
            Universidade de Brasília (UnB) • {currentYear}
          </p>
          
          {/* Contador de assistentes */}
          <div style={{
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            display: 'inline-block',
            marginBottom: '2rem'
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

          {/* Copyright */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.5rem',
            fontSize: '0.8rem',
            color: '#94a3b8'
          }}>
            <p style={{ margin: '0 0 0.5rem' }}>
              © {currentYear} Sistema Educacional PQT-U - Todos os direitos reservados
            </p>
            <p style={{ margin: 0 }}>
              Desenvolvido com tecnologia <Link href="https://nextjs.org" target="_blank" style={{ color: unbColors.secondary }}>Next.js</Link> • 
              Versão 2.0
            </p>
          </div>
        </div>
      </div>

      {/* CSS Responsivo */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-navigation {
            display: none !important;
          }
          .mobile-navigation {
            display: block !important;
          }
        }
      `}</style>
    </footer>
  );
}