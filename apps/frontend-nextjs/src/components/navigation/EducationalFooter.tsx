'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';
import { getUniversityLogo } from '@/constants/avatars';
import { usePersonas } from '@/hooks/usePersonas';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
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
import { 
  BookMedicalIcon, 
  HospitalIcon, 
  ShieldIcon, 
  SettingsIcon, 
  BookOpenIcon,
  MessageCircleIcon,
  emojiToIcon,
  useMedicalIcons 
} from '@/components/icons/MedicalIcons';

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
  
  // Sistema de tabs para footer reorganizado em 3 seções principais
  const { flags } = useRemoteConfig();
  const [activeTab, setActiveTab] = useState<'platform' | 'education' | 'legal'>('platform');
  
  // 3 seções principais otimizadas para UX médico
  const footerTabs = {
    platform: {
      id: 'platform',
      title: 'Plataforma',
      icon: <HospitalIcon size={20} />,
      description: 'Navegação e funcionalidades principais',
      sections: {
        navigation: {
          title: 'Navegação Principal',
          icon: <MessageCircleIcon size={16} />,
          links: [
            { label: 'Início', href: '/', description: 'Página inicial e seleção de assistentes' },
            { label: 'Chat com IA', href: '/chat', description: 'Dr. Gasnelio e Gá - Assistentes especializados' },
            { label: 'Módulos de Aprendizagem', href: '/modules', description: 'Conteúdo educacional estruturado sobre hanseníase' },
            { label: 'Dashboard Pessoal', href: '/dashboard', description: 'Visão geral do seu progresso educacional' }
          ]
        },
        tools: {
          title: 'Ferramentas & Recursos',
          icon: <SettingsIcon size={16} />,
          links: [
            { label: 'Calculadora PQT-U', href: '/resources/calculator', description: 'Cálculo automático de doses medicamentosas' },
            { label: 'Checklist Dispensação', href: '/resources/checklist', description: 'Lista de verificação para procedimentos' },
            { label: 'Glossário Médico', href: '/glossario', description: 'Termos técnicos da hanseníase explicados' },
            { label: 'Materiais para Download', href: '/downloads', description: 'Documentação e recursos complementares' }
          ]
        }
      }
    },
    education: {
      id: 'education',
      title: 'Educacional',
      icon: <BookMedicalIcon size={20} />,
      description: 'Conteúdo científico e recursos de aprendizagem',
      sections: {
        content: {
          title: 'Conteúdo Educacional',
          icon: <BookOpenIcon size={16} />,
          links: [
            { label: 'Roteiro de Dispensação', href: '/modules/roteiro-dispensacao', description: 'Guia completo para profissionais farmacêuticos' },
            { label: 'Diagnóstico Hanseníase', href: '/modules/diagnostico', description: 'Sinais, sintomas e exames diagnósticos' },
            { label: 'Tratamento PQT-U', href: '/modules/tratamento', description: 'Poliquimioterapia única - protocolo oficial' },
            { label: 'Vida com Hanseníase', href: '/vida-com-hanseniase', description: 'Recurso público: qualidade de vida e direitos (acesso livre)' }
          ]
        },
        institutional: {
          title: 'Institucional',
          icon: <HospitalIcon size={16} />,
          links: [
            { label: 'Sobre o Sistema', href: '/sobre', description: 'Informações sobre a plataforma educacional' },
            { label: 'Sobre a Tese', href: '/modules/sobre-a-tese', description: 'Pesquisa de doutorado em Ciências Farmacêuticas' },
            { label: 'Metodologia', href: '/metodologia', description: 'Métodos científicos e fundamentação teórica' },
            { label: 'Contato', href: '/contato', description: 'Entre em contato com a equipe de pesquisa' }
          ]
        }
      }
    },
    legal: {
      id: 'legal',
      title: 'Legal & Privacidade',
      icon: <ShieldIcon size={20} />,
      description: 'Conformidade, ética e proteção de dados',
      sections: {
        privacy: {
          title: 'Proteção de Dados',
          icon: <ShieldIcon size={16} />,
          links: [
            { label: 'Política de Privacidade', href: '/privacidade', description: 'Como protegemos seus dados pessoais' },
            { label: 'Conformidade LGPD', href: '/conformidade', description: 'Adequação à Lei Geral de Proteção de Dados' },
            { label: 'Termos de Uso', href: '/termos', description: 'Condições para uso da plataforma' }
          ]
        },
        ethics: {
          title: 'Ética & Responsabilidade',
          icon: <ShieldIcon size={16} />,
          links: [
            { label: 'Código de Ética', href: '/etica', description: 'Princípios éticos em pesquisa médica' },
            { label: 'Responsabilidade Médica', href: '/responsabilidade', description: 'Limitações e orientações de uso clínico' },
            { label: 'Transparência', href: '/transparencia', description: 'Metodologia aberta e reprodutibilidade científica' }
          ]
        }
      }
    },
    sitemap: {
      id: 'sitemap',
      title: 'Mapa do Site',
      icon: <HomeIcon size={20} />,
      description: 'Navegação completa e estrutura do site',
      sections: {
        main_areas: {
          title: 'Áreas Principais',
          icon: <HomeIcon size={16} />,
          links: [
            { label: 'Página Inicial', href: '/', description: 'Portal de entrada e seleção de assistentes' },
            { label: 'Chat com IA', href: '/chat', description: 'Interação com Dr. Gasnelio e Gá' },
            { label: 'Módulos Educacionais', href: '/modules', description: 'Conteúdo estruturado de aprendizagem' },
            { label: 'Dashboard Pessoal', href: '/dashboard', description: 'Acompanhamento do progresso' },
            { label: 'Recursos e Ferramentas', href: '/resources', description: 'Calculadoras e materiais práticos' }
          ]
        },
        content_areas: {
          title: 'Conteúdo Específico',
          icon: <BookOpenIcon size={16} />,
          links: [
            { label: 'Roteiro de Dispensação', href: '/modules/roteiro-dispensacao', description: 'Protocolo completo PQT-U' },
            { label: 'Diagnóstico Hanseníase', href: '/modules/diagnostico', description: 'Sinais clínicos e classificação' },
            { label: 'Tratamento PQT-U', href: '/modules/tratamento', description: 'Esquemas terapêuticos padronizados' },
            { label: 'Vida com Hanseníase', href: '/vida-com-hanseniase', description: 'Qualidade de vida e direitos (público)' },
            { label: 'Sobre a Tese', href: '/sobre-a-tese', description: 'Pesquisa de doutorado' }
          ]
        },
        tools_resources: {
          title: 'Ferramentas e Recursos',
          icon: <SettingsIcon size={16} />,
          links: [
            { label: 'Calculadora PQT-U', href: '/resources/calculator', description: 'Cálculo de doses medicamentosas' },
            { label: 'Verificador de Interações', href: '/resources/interactions', description: 'Análise de incompatibilidades' },
            { label: 'Checklist de Dispensação', href: '/resources/checklist', description: 'Lista de verificação procedural' },
            { label: 'Glossário Médico', href: '/glossario', description: 'Terminologia técnica explicada' },
            { label: 'Downloads', href: '/downloads', description: 'Materiais complementares' }
          ]
        },
        admin_areas: {
          title: 'Áreas Administrativas',
          icon: <SettingsIcon size={16} />,
          links: [
            { label: 'Painel Admin', href: '/admin/features', description: 'Gerenciamento de feature flags' },
            { label: 'Configurações', href: '/settings', description: 'Preferências e personalização' },
            { label: 'Feedback', href: '/feedback', description: 'Envio de sugestões e relatórios' },
            { label: 'Monitoramento', href: '/admin/monitoring', description: 'Métricas e analytics' }
          ]
        }
      }
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
      {/* Sistema de Tabs para Footer - Novo design com 3 seções */}
      {showNavigation && variant === 'full' && flags?.new_footer && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            maxWidth: 'min(1400px, 95vw)',
            margin: '0 auto',
            padding: '2rem'
          }}>
            {/* Tab Navigation com overflow handling */}
            <div className="tab-navigation" style={{
              position: 'relative',
              marginBottom: '2rem',
              borderBottom: '2px solid #f1f5f9',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px 12px 0 0',
              padding: '1rem',
              overflow: 'hidden'
            }}>
              <div className="tab-scroll-container" style={{
                display: 'flex',
                justifyContent: 'center',
                overflowX: 'auto',
                scrollbarWidth: 'thin',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                gap: '0.5rem',
                paddingBottom: '0.5rem'
              }}>
              {Object.entries(footerTabs).map(([tabId, tab]) => (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId as typeof activeTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    border: 'none',
                    background: activeTab === tabId 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : 'transparent',
                    color: activeTab === tabId ? 'white' : unbColors.neutral,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: activeTab === tabId ? 'bold' : '500',
                    transition: 'all 0.3s ease',
                    minWidth: 'max-content',
                    margin: '0 0.25rem',
                    boxShadow: activeTab === tabId 
                      ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                      : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transform: activeTab === tabId ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tabId) {
                      e.currentTarget.style.background = unbColors.alpha.primary;
                      e.currentTarget.style.color = unbColors.primary;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tabId) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = unbColors.neutral;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>{tab.title}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      marginTop: '2px',
                      display: activeTab === tabId ? 'block' : 'none'
                    }}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              ))}
              </div>
              
              {/* Overflow scroll indicators (Mobile) */}
              <div className="scroll-indicators" style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: '8px',
                right: '8px',
                pointerEvents: 'none',
                display: 'none' // Shown via CSS media queries
              }}>
                <button 
                  className="scroll-left"
                  style={{
                    position: 'absolute',
                    left: 0,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    fontSize: '0.8rem',
                    color: unbColors.primary
                  }}
                  onClick={() => {
                    const container = document.querySelector('.tab-scroll-container') as HTMLElement;
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                >
                  ‹
                </button>
                <button 
                  className="scroll-right"
                  style={{
                    position: 'absolute',
                    right: 0,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    fontSize: '0.8rem',
                    color: unbColors.primary
                  }}
                  onClick={() => {
                    const container = document.querySelector('.tab-scroll-container') as HTMLElement;
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                >
                  ›
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content" style={{
              minHeight: '300px',
              animation: 'fadeIn 0.3s ease'
            }}>
              {/* Desktop Grid Layout */}
              <div className="desktop-tab-content" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                alignItems: 'start'
              }}>
                {Object.entries(footerTabs[activeTab].sections).map(([sectionId, section]) => (
                  <div key={sectionId} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease',
                    height: 'fit-content'
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
                      <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>{section.icon}</span>
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
                ))}
              </div>

              {/* Mobile Accordion for Tab Content */}
              <div className="mobile-tab-content" style={{ display: 'none' }}>
                {Object.entries(footerTabs[activeTab].sections).map(([sectionId, section]) => (
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
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}>{section.icon}</span>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: Layout original quando new_footer está desabilitado */}
      {showNavigation && variant === 'full' && !flags?.new_footer && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            maxWidth: 'min(1800px, 95vw)',
            margin: '0 auto',
            padding: '2rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              alignItems: 'start'
            }}>
              {/* Layout simplificado com as seções principais */}
              {Object.entries(footerTabs).map(([tabId, tab]) => (
                <div key={tabId} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <h3 style={{
                    margin: '0 0 1rem',
                    color: unbColors.primary,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
                    {tab.title}
                  </h3>
                  {/* Mostrar apenas os primeiros links de cada seção */}
                  {Object.values(tab.sections)[0]?.links.slice(0, 4).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        display: 'block',
                        color: unbColors.neutral,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = unbColors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = unbColors.neutral;
                      }}
                    >
                      <strong>{link.label}</strong>
                    </Link>
                  ))}
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
        <div style={{ maxWidth: 'min(1200px, 90vw)', margin: '0 auto' }}>
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
        /* Animações para transições suaves */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Layout responsivo para sistema de tabs */
        @media (max-width: 1200px) {
          .desktop-tab-content {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        
        @media (max-width: 900px) {
          .desktop-tab-content {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .tab-navigation {
            flex-direction: column !important;
            gap: 0.5rem !important;
            padding: 0.75rem !important;
          }
          
          .tab-navigation button {
            padding: 0.75rem 1rem !important;
            font-size: 0.9rem !important;
            margin: 0 !important;
          }
        }
        
        @media (max-width: 768px) {
          .desktop-tab-content {
            display: none !important;
          }
          .mobile-tab-content {
            display: block !important;
          }
          
          .tab-navigation {
            padding: 0.5rem !important;
            border-radius: 8px !important;
          }
          
          .tab-scroll-container {
            justify-content: flex-start !important;
            padding-left: 40px !important;
            padding-right: 40px !important;
          }
          
          .tab-navigation button {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.85rem !important;
            min-width: max-content !important;
            flex-shrink: 0 !important;
          }
          
          .scroll-indicators {
            display: block !important;
          }
        }
        
        /* Smooth scrollbar styling */
        .tab-scroll-container::-webkit-scrollbar {
          height: 4px;
        }
        
        .tab-scroll-container::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 2px;
        }
        
        .tab-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 2px;
        }
        
        .tab-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
        
        /* Auto-hide scroll indicators quando não há overflow */
        @media (min-width: 769px) {
          .scroll-indicators {
            display: none !important;
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