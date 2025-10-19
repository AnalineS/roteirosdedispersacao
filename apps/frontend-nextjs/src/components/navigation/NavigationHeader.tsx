'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePersonas } from '@/hooks/usePersonas';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useNavigationVisibility, useContextualNavigation } from './SmartNavigationSystem';
import { 
  SystemLogoIcon,
  LearningIcon, 
  InteractionIcon, 
  ToolsIcon, 
  ProgressIcon,
  InstitutionalIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  getIconByEmoji
} from '@/components/icons/NavigationIcons';
import { getUnbColors } from '@/config/modernTheme';
import { getUniversityLogo } from '@/constants/avatars';
import Tooltip from '@/components/common/Tooltip';
import MobileNavigation from './MobileNavigation';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import IntelligentSearchSystem from '@/components/search/IntelligentSearchSystem';
import SearchBar from '@/components/search/SearchBar';
import { AuthButton } from '@/components/auth';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { SkipToContent, HighContrastToggle } from '@/components/accessibility';
// Interfaces de navegação (movidas do Sidebar removido)
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  category: 'learning' | 'interaction' | 'progress' | 'tools' | 'institutional';
  level?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  completionRate?: number;
  subItems?: NavigationItem[];
}

export interface NavigationCategory {
  id: string;
  label: string; 
  icon: string;
  description: string;
  items: NavigationItem[];
}

interface NavigationHeaderProps {
  currentPersona?: string;
  className?: string;
}

interface DropdownState {
  [key: string]: boolean;
}

export default function NavigationHeader({ currentPersona, className = '' }: NavigationHeaderProps) {
  const pathname = usePathname();
  const { personas } = usePersonas();
  const { isAdmin, isAuthenticated } = useSafeAuth();
  const headerRef = useRef<HTMLElement>(null);
  const unbColors = getUnbColors();
  const shouldShowHeader = useNavigationVisibility('main-header');
  const { primaryNavigation, maxVisibleItems, deviceType } = useContextualNavigation();

  // Estados
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownsOpen, setDropdownsOpen] = useState<DropdownState>({});

  // Usar deviceType do SmartNavigationSystem ao invés de detecção duplicada
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isWideScreen = false; // Removido pois não é usado no SmartNavigationSystem

  // Configurar navegação por teclado
  useKeyboardNavigation({
    containerRef: headerRef as React.RefObject<HTMLElement>,
    enableArrowKeys: true,
    onEnter: (element) => {
      if (element.getAttribute('role') === 'button') {
        element.click();
      }
    }
  });

  // Estrutura de navegação atualizada conforme especificações
  const navigationCategories: NavigationCategory[] = [
    {
      id: 'home',
      label: 'Início',
      icon: '🏠',
      description: 'Página inicial',
      items: [
        {
          id: 'home',
          label: 'Início',
          href: '/',
          icon: '🏠',
          description: 'Seleção de assistentes virtuais',
          category: 'learning',
          level: 'beginner',
          estimatedTime: '2 min'
        }
      ]
    },
    {
      id: 'educational',
      label: 'Educacional',
      icon: '📚',
      description: 'Módulos educacionais e recursos de aprendizagem',
      items: [
        {
          id: 'modules',
          label: 'Módulos',
          href: '/modules',
          icon: '📖',
          description: 'Conteúdo educacional por tópicos',
          category: 'learning',
          level: 'beginner',
          estimatedTime: '15-30 min',
          subItems: [
            {
              id: 'hanseniase-overview',
              label: 'Sobre a Hanseníase',
              href: '/modules/hanseniase',
              icon: '🔬',
              description: 'Conceitos fundamentais',
              category: 'learning',
              level: 'beginner',
              estimatedTime: '10 min'
            },
            {
              id: 'diagnostico',
              label: 'Diagnóstico',
              href: '/modules/diagnostico',
              icon: '🩺',
              description: 'Sintomas e exames',
              category: 'learning',
              level: 'intermediate',
              estimatedTime: '15 min'
            },
            {
              id: 'tratamento',
              label: 'Tratamento PQT-U',
              href: '/modules/tratamento',
              icon: '💊',
              description: 'Poliquimioterapia única',
              category: 'learning',
              level: 'advanced',
              estimatedTime: '20 min'
            },
            {
              id: 'vida-com-doenca',
              label: 'Vida com a Doença',
              href: '/modules/vida-com-doenca',
              icon: '🤝',
              description: 'Apoio e qualidade de vida',
              category: 'learning',
              level: 'intermediate',
              estimatedTime: '15 min'
            },
            {
              id: 'roteiro-dispensacao',
              label: 'Roteiro de Dispensação',
              href: '/modules/roteiro-dispensacao',
              icon: '📋',
              description: 'Protocolo completo de dispensação',
              category: 'learning',
              level: 'advanced',
              estimatedTime: '20 min'
            }
          ]
        },
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: '📊',
          description: 'Visão geral do progresso',
          category: 'learning',
          level: 'beginner',
          estimatedTime: '5 min'
        },
        {
          id: 'progress',
          label: 'Progresso',
          href: '/progress',
          icon: '📈',
          description: 'Acompanhe seu aprendizado',
          category: 'learning',
          completionRate: 65
        },
        {
          id: 'resources',
          label: 'Recursos',
          href: '/resources',
          icon: '🎯',
          description: 'Ferramentas práticas',
          category: 'learning',
          subItems: [
            {
              id: 'dose-calculator',
              label: 'Calculadora',
              href: '/resources/calculator',
              icon: '🧮',
              description: 'Cálculo automático PQT-U',
              category: 'learning'
            },
            {
              id: 'checklist',
              label: 'Checklist',
              href: '/resources/checklist',
              icon: '✅',
              description: 'Lista de verificação procedural',
              category: 'learning'
            },
            {
              id: 'glossario',
              label: 'Glossário',
              href: '/glossario',
              icon: '📋',
              description: 'Terminologia técnica de hanseníase',
              category: 'learning'
            },
            {
              id: 'downloads',
              label: 'Downloads',
              href: '/downloads',
              icon: '📄',
              description: 'Materiais complementares',
              category: 'learning'
            }
          ]
        }
      ]
    },
    {
      id: 'project',
      label: 'Conheça o Projeto',
      icon: '🎓',
      description: 'Informações sobre a plataforma e pesquisa',
      items: [
        {
          id: 'sobre-a-tese',
          label: 'Sobre a Tese',
          href: '/sobre-a-tese',
          icon: '📚',
          description: 'Metodologia, objetivos e contribuições da pesquisa',
          category: 'institutional'
        },
        {
          id: 'sobre-equipe',
          label: 'Conheça a Equipe',
          href: '/sobre',
          icon: '👥',
          description: 'Equipe responsável pelo projeto',
          category: 'institutional'
        },
        {
          id: 'metodologia',
          label: 'Metodologia',
          href: '/metodologia',
          icon: '🔬',
          description: 'Métodos científicos e fundamentação teórica',
          category: 'institutional'
        }
      ]
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: '💬',
      description: 'Conversar com assistentes virtuais',
      items: [
        {
          id: 'chat',
          label: 'Chat',
          href: '/chat',
          icon: '💬',
          description: 'Chat com Dr. Gasnelio e Gá',
          category: 'interaction',
          estimatedTime: 'Ilimitado'
        }
      ]
    }
  ];

  // Utilitários
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) || false;
  };

  const toggleDropdown = (categoryId: string) => {
    setDropdownsOpen(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const closeAllDropdowns = () => {
    setDropdownsOpen({});
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'learning': return LearningIcon;
      case 'interaction': return InteractionIcon;
      case 'tools': return ToolsIcon;
      case 'progress': return ProgressIcon;
      case 'institutional': return InstitutionalIcon;
      default: return LearningIcon;
    }
  };

  // Adicionar categorias de autenticação dinamicamente
  const authCategories: NavigationCategory[] = isAuthenticated ? [
    {
      id: 'profile',
      label: 'Perfil',
      icon: '👤',
      description: 'Gerenciar seu perfil',
      items: [{
        id: 'profile',
        label: 'Perfil',
        href: '/profile',
        icon: '👤',
        description: 'Gerenciar seu perfil',
        category: 'institutional'
      }]
    }
  ] : [
    {
      id: 'cadastro',
      label: 'Cadastro',
      icon: '📝',
      description: 'Criar uma conta',
      items: [{
        id: 'cadastro',
        label: 'Cadastro',
        href: '/cadastro',
        icon: '📝',
        description: 'Criar uma conta',
        category: 'institutional'
      }]
    },
    {
      id: 'login',
      label: 'Login',
      icon: '🔐',
      description: 'Acessar sua conta',
      items: [{
        id: 'login',
        label: 'Login',
        href: '/login',
        icon: '🔐',
        description: 'Acessar sua conta',
        category: 'institutional'
      }]
    }
  ];

  // Combinar categorias principais com autenticação
  const allCategories = [...navigationCategories, ...authCategories];

  // Obter persona atual
  const currentPersonaData = currentPersona && personas[currentPersona] ? personas[currentPersona] : null;

  // Não renderizar se sistema inteligente decidir que não deve
  if (!shouldShowHeader && primaryNavigation !== 'header') {
    return null;
  }

  // Filtrar categorias baseado no limite do sistema inteligente
  const visibleCategories = allCategories;

  return (
    <>
      <SkipToContent mainContentId="main-content" />
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-br from-white/95 to-slate-50/98 backdrop-blur-md border-b border-slate-200/80 shadow-lg ${className}`}
        role="banner"
        aria-label="Main navigation header"
      >
        {/* Inner container with max-width and responsive padding */}
        <div className="max-w-[1400px] mx-auto">
          {/* Primeira linha - Navegação principal */}
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-2 sm:gap-4 lg:gap-6 h-20">
            {/* Logo e Título - Esquerda */}
            <div className="nav-logo-section">
              <Tooltip content="Roteiros de Dispensação - Sistema Inteligente de Orientação" position="bottom">
                <Link
                  href="/"
                  className="flex items-center gap-3 no-underline"
                  style={{ color: unbColors.primary }}
                >
                  <Image
                    src={getUniversityLogo('unb_logo2')}
                    alt="Universidade de Brasília"
                    className="nav-logo"
                    width={48}
                    height={48}
                    priority
                  />
                  {!isMobile && (
                    <div className="flex flex-col gap-0.5">
                      <div className="nav-title-main">
                        Roteiros de Dispensação
                      </div>
                      <div className="nav-title-sub">
                        Sistema de Aprendizagem Inteligente
                      </div>
                    </div>
                  )}
                  {isMobile && (
                    <div className="nav-title-main">
                      Roteiros de Dispensação
                    </div>
                  )}
                </Link>
              </Tooltip>
            </div>



            {/* Navegação Principal - Centro (Desktop/Tablet) */}
            {!isMobile && (
              <nav
                className="nav-main-section flex items-center gap-2 lg:gap-4 flex-nowrap overflow-hidden"
                role="navigation"
                aria-label="Navegação principal do sistema educacional"
                id="main-navigation"
              >
                {visibleCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category.id);
                  const hasDropdown = category.items.length > 1 || category.items.some(item => item.subItems?.length);

                  return (
                    <div key={category.id} className="relative">
                      {hasDropdown ? (
                        <button
                          onClick={() => toggleDropdown(category.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setDropdownsOpen(prev => ({...prev, [category.id]: false}));
                            }
                            if (e.key === 'ArrowDown' && dropdownsOpen[category.id]) {
                              e.preventDefault();
                              const dropdown = e.currentTarget.parentElement?.querySelector('[role="menu"]');
                              const firstMenuItem = dropdown?.querySelector('[role="menuitem"]') as HTMLElement;
                              firstMenuItem?.focus();
                            }
                          }}
                          onBlur={(e) => {
                            // Reset visual styles
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.border = '2px solid transparent';

                            // Fechar dropdown se clicar fora
                            setTimeout(() => {
                              if (!e.currentTarget.parentElement?.contains(document.activeElement)) {
                                setDropdownsOpen(prev => ({...prev, [category.id]: false}));
                              }
                            }, 150);
                          }}
                          className={`flex items-center gap-1.5 bg-transparent ${
                            dropdownsOpen[category.id] ? 'border-2' : 'border-2 border-transparent'
                          } px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg cursor-pointer text-sm sm:text-base font-medium transition-all duration-200 ${
                            dropdownsOpen[category.id] ? 'opacity-100' : 'opacity-90'
                          } outline-none whitespace-nowrap min-w-fit flex-shrink-0 hover:bg-blue-500/10 focus:bg-blue-500/10`}
                          style={{
                            borderColor: dropdownsOpen[category.id] ? unbColors.primary : 'transparent',
                            color: unbColors.primary
                          }}
                          onFocus={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.border = `2px solid ${unbColors.primary}`; }}
                          aria-expanded={dropdownsOpen[category.id]}
                          aria-haspopup="menu"
                          aria-label={`Abrir menu ${category.label}: ${category.description}`}
                          aria-describedby={`category-${category.id}-desc`}
                        >
                          <IconComponent size={isTablet ? 16 : 18} variant="unb" color={unbColors.primary} />
                          <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${isTablet && category.label.length > 12 ? 'hidden' : 'inline'} ${isTablet ? 'max-w-[80px]' : 'max-w-none'}`}>
                            {category.label}
                          </span>
                          <ChevronDownIcon
                            size={14}
                            color={unbColors.primary}
                            className={`transition-transform duration-200 ${dropdownsOpen[category.id] ? 'rotate-180' : 'rotate-0'}`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={category.items[0].href}
                          className={`flex items-center gap-1.5 no-underline px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
                            isActive(category.items[0].href) ? 'opacity-100' : 'opacity-90'
                          } whitespace-nowrap min-w-fit flex-shrink-0 hover:bg-blue-500/10`}
                          style={{ color: unbColors.primary }}
                        >
                          <IconComponent size={isTablet ? 16 : 18} variant="unb" color={unbColors.primary} />
                          <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${isTablet && category.label.length > 12 ? 'hidden' : 'inline'} ${isTablet ? 'max-w-[80px]' : 'max-w-none'}`}>
                            {category.label}
                          </span>
                        </Link>
                      )}

                      {/* Hidden description for screen readers */}
                      <span
                        id={`category-${category.id}-desc`}
                        className="absolute -left-[10000px] w-px h-px overflow-hidden"
                      >
                        {category.description}
                      </span>

                      {/* Dropdown Menu */}
                      {hasDropdown && dropdownsOpen[category.id] && (
                        <div
                          role="menu"
                          aria-labelledby={`category-${category.id}-button`}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-xl shadow-2xl min-w-[280px] max-w-[320px] z-[1001] animate-fadeIn"
                          style={{
                            background: unbColors.white,
                            border: `1px solid ${unbColors.alpha.primary}`
                          }}
                        >
                          {category.items.map((item) => {
                            const ItemIcon = getIconByEmoji(item.icon);
                            return (
                              <div key={item.id}>
                                <Link
                                  href={item.href}
                                  onClick={closeAllDropdowns}
                                  role="menuitem"
                                  tabIndex={-1}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setDropdownsOpen(prev => ({...prev, [category.id]: false}));
                                      const button = e.currentTarget.closest('[role="button"]') as HTMLElement;
                                      button?.focus();
                                    }
                                  }}
                                  className={`flex items-center gap-3 p-3 no-underline rounded-lg m-1 transition-all duration-200 outline-none border-2 border-transparent hover:border-transparent focus:border-2`}
                                  style={{
                                    color: unbColors.neutral,
                                    background: isActive(item.href) ? unbColors.alpha.primary : 'transparent',
                                    borderColor: 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isActive(item.href)) {
                                      e.currentTarget.style.background = unbColors.alpha.secondary;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isActive(item.href)) {
                                      e.currentTarget.style.background = 'transparent';
                                    }
                                  }}
                                  onFocus={(e) => {
                                    e.currentTarget.style.background = unbColors.alpha.secondary;
                                    e.currentTarget.style.border = `2px solid ${unbColors.primary}`;
                                  }}
                                  onBlur={(e) => {
                                    if (!isActive(item.href)) {
                                      e.currentTarget.style.background = 'transparent';
                                    }
                                    e.currentTarget.style.border = '2px solid transparent';
                                  }}
                                  aria-describedby={`item-${item.id}-desc`}
                                >
                                  <ItemIcon size={20} variant="unb" />
                                  <div className="flex-1">
                                    <div className={`${isActive(item.href) ? 'font-bold' : 'font-medium'} text-[0.95rem] mb-0.5`}>
                                      {item.label}
                                    </div>
                                    <div className="text-[0.8rem] opacity-70 leading-tight">
                                      {item.description}
                                    </div>
                                  </div>
                                </Link>
                          
                                {/* Sub Items */}
                                {item.subItems?.map((subItem) => {
                                  const SubIcon = getIconByEmoji(subItem.icon);
                                  return (
                                    <Link
                                      key={subItem.id}
                                      href={subItem.href}
                                      onClick={closeAllDropdowns}
                                      className={`flex items-center gap-2.5 py-2.5 px-4 pl-8 no-underline text-sm rounded-md my-0.5 mx-1 ${
                                        isActive(subItem.href) ? 'opacity-100' : 'opacity-80'
                                      } hover:opacity-100`}
                                      style={{
                                        color: unbColors.neutral,
                                        background: isActive(subItem.href) ? unbColors.alpha.accent : 'transparent'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isActive(subItem.href)) {
                                          e.currentTarget.style.background = unbColors.alpha.secondary;
                                          e.currentTarget.style.opacity = '1';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isActive(subItem.href)) {
                                          e.currentTarget.style.background = 'transparent';
                                          e.currentTarget.style.opacity = '0.8';
                                        }
                                      }}
                                    >
                                      <SubIcon size={16} variant="unb" />
                                      <span>{subItem.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}

            {/* Área de Personas e Usuário - Direita */}
            <div className="nav-actions-section">

              {/* Persona Atual (Desktop/Tablet) */}
              {!isMobile && currentPersonaData && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: unbColors.alpha.secondary,
                    border: `1px solid ${unbColors.alpha.primary}`
                  }}
                >
                  <span className="text-xl">{currentPersonaData.avatar}</span>
                  <div>
                    <div className="text-[0.85rem] font-bold" style={{ color: unbColors.white }}>
                      {currentPersonaData.name}
                    </div>
                    <div className="text-[0.7rem] opacity-80" style={{ color: unbColors.white }}>
                      {currentPersonaData.personality}
                    </div>
                  </div>
                </div>
              )}

              {/* Simplified Navigation Links */}
              <div className="ml-auto flex items-center gap-1 sm:gap-3">
                {!isMobile && (
                  <>
                    <HighContrastToggle
                      variant="button"
                      showLabel={false}
                      className="header-accessibility-toggle"
                    />

                    <Link
                      href="/sobre"
                      className="no-underline text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-200 opacity-90 hover:bg-blue-500/10 hover:opacity-100"
                      style={{ color: unbColors.primary }}
                    >
                      Mapa do Site
                    </Link>

                    <AuthButton variant="header" className="header-auth-buttons" />
                  </>
                )}

                {isAdmin && !isMobile && (
                  <Link
                    href="/admin"
                    className={`flex items-center py-1.5 px-2.5 rounded-md no-underline transition-all duration-200 text-xs font-medium opacity-80 hover:bg-blue-500/10 hover:opacity-100 ${
                      pathname === '/admin' ? 'bg-blue-500/10' : 'bg-transparent'
                    }`}
                    style={{ color: unbColors.primary }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mr-1"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Admin
                  </Link>
                )}
              </div>

              {/* Mobile Search Button */}
              {isMobile && (
                <button
                  onClick={() => {
                    // TODO: Implement mobile search modal
                    console.log('Mobile search modal not implemented yet');
                  }}
                  className="bg-transparent border-2 border-transparent p-2 cursor-pointer rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px] outline-none mr-2 focus:border-2"
                  style={{ color: unbColors.primary }}
                  onFocus={(e) => { e.currentTarget.style.border = `2px solid ${unbColors.primary}`; }}
                  onBlur={(e) => { e.currentTarget.style.border = '2px solid transparent'; }}
                  aria-label="Buscar conteúdo"
                  title="Buscar conteúdo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
              )}

              {/* Menu Mobile Toggle */}
              {isMobile && (
                <button
                  onClick={toggleMobileMenu}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && isMobileMenuOpen) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className="bg-transparent border-2 border-transparent p-2 cursor-pointer rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px] outline-none hover:bg-blue-500/10 focus:bg-blue-500/10"
                  style={{ color: unbColors.primary }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `2px solid ${unbColors.primary}`;
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '2px solid transparent';
                    e.currentTarget.style.background = 'none';
                  }}
                  aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-navigation-menu"
                  aria-haspopup="menu"
                  type="button"
                  role="button"
                >
                  {isMobileMenuOpen ? (
                    <CloseIcon size={24} color={unbColors.primary} />
                  ) : (
                    <MenuIcon size={24} color={unbColors.primary} />
                  )}
                </button>
              )}
            </div>
          </div> {/* Fim da primeira linha */}

          {/* Segunda linha - Barra de pesquisa */}
          {!isMobile && (
            <div className="px-4 sm:px-6 lg:px-8 pb-4 bg-gradient-to-b from-slate-50/50 to-slate-50/0">
              <SearchBar
                placeholder="🔍 Buscar no site..."
                className="nav-search-bar"
              />
            </div>
          )}
        </div> {/* Fim do inner container */}

        {/* Overlay para fechar dropdowns */}
        {Object.values(dropdownsOpen).some(Boolean) && (
          <div
            className="fixed inset-0 z-[999]"
            onClick={closeAllDropdowns}
          />
        )}

      {/* Mobile Navigation Menu */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={navigationCategories}
        currentPersona={currentPersonaData as any}
        isActive={isActive}
      />

        {/* Animações CSS */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </header>
    </>
  );
}