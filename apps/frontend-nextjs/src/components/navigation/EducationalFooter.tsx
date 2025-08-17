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
  
  // Navegação integrada e organizada para UX otimizada
  const integratedFooterSections: Record<string, FooterSection> = {
    navigation: {
      title: 'Navegação Principal',
      links: [
        { label: 'Início', href: '/', description: 'Página inicial e seleção de assistentes' },
        { label: 'Chat com IA', href: '/chat', description: 'Dr. Gasnelio e Gá - Assistentes especializados' },
        { label: 'Módulos de Aprendizagem', href: '/modules', description: 'Conteúdo educacional estruturado sobre hanseníase' },
        { label: 'Dashboard Pessoal', href: '/dashboard', description: 'Visão geral do seu progresso educacional' },
        { label: 'Ferramentas Práticas', href: '/resources', description: 'Calculadoras e recursos para profissionais' }
      ]
    },

    
    institutional: {
      title: 'Institucional',
      links: [
        { label: 'Sobre o Sistema', href: '/sobre', description: 'Informações sobre a plataforma educacional' },
        { label: 'Sobre a Tese', href: '/modules/sobre-a-tese', description: 'Pesquisa de doutorado em Ciências Farmacêuticas' },
        { label: 'Metodologia', href: '/metodologia', description: 'Métodos científicos e fundamentação teórica' },
        { label: 'Contato', href: '/contato', description: 'Entre em contato com a equipe de pesquisa' }
      ]
    },
    
    compliance: {
      title: 'Privacidade & Conformidade',
      links: [
        { label: 'Política de Privacidade', href: '/privacidade', description: 'Como protegemos seus dados pessoais' },
        { label: 'Termos de Uso', href: '/termos', description: 'Condições para uso da plataforma' },
        { label: 'Conformidade LGPD', href: '/conformidade', description: 'Adequação à Lei Geral de Proteção de Dados' },
        { label: 'Código de Ética', href: '/etica', description: 'Princípios éticos em pesquisa médica' }
      ]
    },
    
    academic: {
      title: 'Recursos Educacionais',
      links: [
        { label: 'Roteiro de Dispensação', href: '/modules/roteiro-dispensacao', description: 'Guia completo para profissionais farmacêuticos' },
        { label: 'Diagnóstico Hanseníase', href: '/modules/diagnostico', description: 'Sinais, sintomas e exames diagnósticos' },
        { label: 'Tratamento PQT-U', href: '/modules/tratamento', description: 'Poliquimioterapia única - protocolo oficial' },
        { label: 'Vida com Hanseníase', href: '/modules/vida-com-doenca', description: 'Aspectos psicossociais e qualidade de vida' }
      ]
    },
    
    resources: {
      title: 'Suporte & Ferramentas',
      links: [
        { label: 'FAQ', href: '/faq', description: 'Respostas para dúvidas frequentes' },
        { label: 'Calculadora PQT-U', href: '/resources/calculator', description: 'Cálculo automático de doses medicamentosas' },
        { label: 'Checklist Dispensação', href: '/resources/checklist', description: 'Lista de verificação para procedimentos' },
        { label: 'Glossário Médico', href: '/glossario', description: 'Termos técnicos da hanseníase explicados' },
        { label: 'Materiais para Download', href: '/downloads', description: 'Documentação e recursos complementares' }
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
            {/* Desktop Navigation - Layout otimizado em 5 colunas */}
            <div className="desktop-navigation" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 'clamp(1.5rem, 3vw, 2.5rem)',
              marginBottom: '2rem',
              alignItems: 'start'
            }}>
              {/* Renderizar todas as seções integradas */}
              {Object.entries(integratedFooterSections).map(([sectionId, section]) => {
                const getSectionIcon = (id: string) => {
                  switch(id) {
                    case 'navigation': return '🧭';
                    case 'institutional': return '🏛️';
                    case 'compliance': return '🔒';
                    case 'academic': return '📚';
                    case 'resources': return '🛠️';
                    default: return '📋';
                  }
                };

                return (
                  <div key={sectionId} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  }}>
                    <h3 style={{
                      margin: '0 0 1.25rem',
                      color: unbColors.primary,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderBottom: `2px solid ${unbColors.alpha.primary}`,
                      paddingBottom: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{getSectionIcon(sectionId)}</span>
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
                              transition: 'all 0.2s',
                              padding: '0.25rem 0',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = unbColors.primary;
                              e.currentTarget.style.paddingLeft = '0.5rem';
                              e.currentTarget.style.background = unbColors.alpha.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = unbColors.neutral;
                              e.currentTarget.style.paddingLeft = '0';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <strong>{link.label}</strong>
                            {link.description && (
                              <div style={{ 
                                fontSize: '0.8rem', 
                                opacity: 0.7, 
                                marginTop: '2px',
                                lineHeight: '1.3'
                              }}>
                                {link.description}
                              </div>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Mobile Accordion - Versão mobile otimizada */}
            <div className="mobile-navigation" style={{ display: 'none' }}>
              {/* Seções colapsáveis integradas */}
              {Object.entries(integratedFooterSections).map(([sectionId, section]) => {
                const getSectionIcon = (id: string) => {
                  switch(id) {
                    case 'navigation': return '🧭';
                    case 'institutional': return '🏛️';
                    case 'compliance': return '🔒';
                    case 'academic': return '📚';
                    case 'resources': return '🛠️';
                    default: return '📋';
                  }
                };

                return (
                  <div key={sectionId} style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => toggleSection(sectionId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        border: `1px solid ${unbColors.alpha.primary}`,
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        color: unbColors.primary,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>{getSectionIcon(sectionId)}</span>
                        {section.title}
                      </div>
                      <ChevronDownIcon 
                        size={18} 
                        color={unbColors.primary}
                        style={{
                          transform: expandedSections.has(sectionId) ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </button>
                    
                    {expandedSections.has(sectionId) && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '1.25rem',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}>
                        {section.links.map((link, index) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            style={{
                              display: 'block',
                              color: unbColors.neutral,
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              padding: '0.75rem 0',
                              borderBottom: index < section.links.length - 1 ? '1px solid #f1f5f9' : 'none',
                              transition: 'all 0.2s',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = unbColors.primary;
                              e.currentTarget.style.paddingLeft = '0.5rem';
                              e.currentTarget.style.background = unbColors.alpha.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = unbColors.neutral;
                              e.currentTarget.style.paddingLeft = '0';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <strong>{link.label}</strong>
                            {link.description && (
                              <div style={{ 
                                fontSize: '0.8rem', 
                                opacity: 0.7, 
                                marginTop: '4px',
                                lineHeight: '1.3'
                              }}>
                                {link.description}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* CSS Responsivo Otimizado */}
      <style jsx>{`
        /* Layout responsivo para diferentes tamanhos de tela */
        @media (max-width: 1200px) {
          .desktop-navigation {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1.5rem !important;
          }
        }
        
        @media (max-width: 900px) {
          .desktop-navigation {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        
        @media (max-width: 768px) {
          .desktop-navigation {
            display: none !important;
          }
          .mobile-navigation {
            display: block !important;
          }
        }
        
        @media (max-width: 480px) {
          .mobile-navigation button {
            padding: 0.75rem 1rem !important;
            font-size: 0.9rem !important;
          }
          
          .mobile-navigation h3 {
            font-size: 1rem !important;
          }
        }
        
        /* Melhorias de acessibilidade */
        @media (prefers-reduced-motion: reduce) {
          .desktop-navigation > div,
          .mobile-navigation button,
          .mobile-navigation a {
            transition: none !important;
          }
        }
        
        /* Alto contraste */
        @media (prefers-contrast: high) {
          .desktop-navigation > div {
            border: 2px solid #000 !important;
          }
          
          .mobile-navigation button {
            border: 2px solid #000 !important;
          }
        }
      `}</style>
    </footer>
  );
}