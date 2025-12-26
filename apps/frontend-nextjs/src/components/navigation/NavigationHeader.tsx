'use client';

/**
 * NavigationHeader Simplificado - PR #264 Phase 1
 *
 * Melhorias implementadas:
 * - RF01: Redução de 7+ para 5 itens principais
 * - RF02: Hierarquia visual com CTAs destacados
 * - RF03: Indicador offline discreto integrado
 * - RNF05: Design tokens centralizados
 *
 * Estrutura: Início | Educacional ▾ | Chat | [Entrar] | [Criar Conta]
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePersonas } from '@/hooks/usePersonas';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import {
  LearningIcon,
  InteractionIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  getIconByEmoji
} from '@/components/icons/NavigationIcons';
import { getUnbColors } from '@/config/modernTheme';
import { getUniversityLogo } from '@/constants/avatars';
import Tooltip from '@/components/common/Tooltip';
import MobileNavigation from './MobileNavigation';
import { PCDTSearchSystem } from '@/components/search';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { SkipToContent, HighContrastToggle } from '@/components/accessibility';
import OfflineIndicator from './OfflineIndicator';
import { designTokens } from '@/config/designTokens';

// Interfaces
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
  priority?: 'high' | 'medium' | 'low';
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

  // Estados
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownsOpen, setDropdownsOpen] = useState<DropdownState>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detectar device type usando designTokens breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= parseInt(designTokens.breakpoints.mobile));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  /**
   * Estrutura de navegação simplificada - 5 itens principais
   * Conforme PR #264 RF01
   */
  const navigationCategories: NavigationCategory[] = [
    {
      id: 'home',
      label: 'Início',
      icon: '🏠',
      description: 'Página inicial',
      priority: 'medium',
      items: [
        {
          id: 'home',
          label: 'Início',
          href: '/',
          icon: '🏠',
          description: 'Seleção de assistentes virtuais',
          category: 'learning'
        }
      ]
    },
    {
      id: 'educational',
      label: 'Educacional',
      icon: '📚',
      description: 'Conteúdo educacional e recursos',
      priority: 'high',
      items: [
        {
          id: 'modules',
          label: 'Módulos',
          href: '/modules',
          icon: '📖',
          description: 'Conteúdo educacional por tópicos',
          category: 'learning',
          subItems: [
            {
              id: 'hanseniase-overview',
              label: 'Sobre a Hanseníase',
              href: '/modules/hanseniase',
              icon: '🔬',
              description: 'Conceitos fundamentais',
              category: 'learning'
            },
            {
              id: 'diagnostico',
              label: 'Diagnóstico',
              href: '/modules/diagnostico',
              icon: '🩺',
              description: 'Sintomas e exames',
              category: 'learning'
            },
            {
              id: 'tratamento',
              label: 'Tratamento PQT-U',
              href: '/modules/tratamento',
              icon: '💊',
              description: 'Poliquimioterapia única',
              category: 'learning'
            },
            {
              id: 'vida-com-doenca',
              label: 'Vida com a Doença',
              href: '/modules/vida-com-doenca',
              icon: '🤝',
              description: 'Apoio e qualidade de vida',
              category: 'learning'
            },
            {
              id: 'roteiro-dispensacao',
              label: 'Roteiro de Dispensação',
              href: '/modules/roteiro-dispensacao',
              icon: '📋',
              description: 'Protocolo completo',
              category: 'learning'
            }
          ]
        },
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: '📊',
          description: 'Visão geral do progresso',
          category: 'learning'
        },
        {
          id: 'progress',
          label: 'Progresso',
          href: '/progress',
          icon: '📈',
          description: 'Acompanhe seu aprendizado',
          category: 'learning'
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
              description: 'Cálculo PQT-U',
              category: 'learning'
            },
            {
              id: 'checklist',
              label: 'Checklist',
              href: '/resources/checklist',
              icon: '✅',
              description: 'Lista de verificação',
              category: 'learning'
            },
            {
              id: 'glossario',
              label: 'Glossário',
              href: '/glossario',
              icon: '📋',
              description: 'Terminologia técnica',
              category: 'learning'
            }
          ]
        },
        // Itens do "Conheça o Projeto" movidos para Educacional
        {
          id: 'sobre-a-tese',
          label: 'Sobre a Tese',
          href: '/sobre-a-tese',
          icon: '📚',
          description: 'Metodologia e objetivos da pesquisa',
          category: 'institutional'
        },
        {
          id: 'sobre-equipe',
          label: 'Conheça a Equipe',
          href: '/sobre',
          icon: '👥',
          description: 'Equipe do projeto',
          category: 'institutional'
        },
        {
          id: 'metodologia',
          label: 'Metodologia',
          href: '/metodologia',
          icon: '🔬',
          description: 'Métodos científicos',
          category: 'institutional'
        }
      ]
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: '💬',
      description: 'Assistentes virtuais',
      priority: 'high',
      items: [
        {
          id: 'chat',
          label: 'Chat',
          href: '/chat',
          icon: '💬',
          description: 'Chat com Dr. Gasnelio e Gá',
          category: 'interaction'
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

  // Obter persona atual
  const currentPersonaData = currentPersona && personas[currentPersona] ? personas[currentPersona] : undefined;

  return (
    <>
      <SkipToContent mainContentId="main-content" />

      {/* Indicador Offline - RF03 */}
      <OfflineIndicator position="top-right" variant="minimal" showDetails="on-hover" />

      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-br from-white/95 to-slate-50/98 backdrop-blur-md border-b border-slate-200/80 shadow-lg ${className}`}
        role="banner"
        aria-label="Main navigation header"
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Linha principal de navegação */}
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 h-20">

            {/* Logo e Título */}
            <div className="nav-logo-section">
              <Tooltip content="Roteiros de Dispensação - Sistema Inteligente" position="bottom">
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
                      <div className="font-bold text-base sm:text-lg" style={{ color: unbColors.primary }}>
                        Roteiros de Dispensação
                      </div>
                      <div className="text-xs opacity-70" style={{ color: unbColors.primary }}>
                        Sistema de Aprendizagem Inteligente
                      </div>
                    </div>
                  )}
                  {isMobile && (
                    <div className="font-bold text-base" style={{ color: unbColors.primary }}>
                      Roteiros
                    </div>
                  )}
                </Link>
              </Tooltip>
            </div>

            {/* Navegação Principal - Desktop/Tablet - 5 itens */}
            {!isMobile && (
              <nav
                className="flex items-center gap-4 flex-1 justify-center"
                role="navigation"
                aria-label="Navegação principal"
              >
                {navigationCategories.map((category) => {
                  const hasDropdown = category.items.length > 1 || category.items.some(item => item.subItems?.length);
                  const IconComponent = category.id === 'educational' ? LearningIcon :
                                       category.id === 'chat' ? InteractionIcon :
                                       getIconByEmoji(category.icon);

                  return (
                    <div key={category.id} className="relative">
                      {hasDropdown ? (
                        <button
                          onClick={() => toggleDropdown(category.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setDropdownsOpen(prev => ({...prev, [category.id]: false}));
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-500/10"
                          style={{
                            color: unbColors.primary,
                            borderColor: dropdownsOpen[category.id] ? unbColors.primary : 'transparent',
                            border: `2px solid ${dropdownsOpen[category.id] ? unbColors.primary : 'transparent'}`
                          }}
                          aria-expanded={dropdownsOpen[category.id]}
                          aria-haspopup="menu"
                        >
                          <IconComponent size={18} variant="unb" color={unbColors.primary} />
                          <span>{category.label}</span>
                          <ChevronDownIcon
                            size={14}
                            color={unbColors.primary}
                            className={`transition-transform duration-200 ${dropdownsOpen[category.id] ? 'rotate-180' : 'rotate-0'}`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={category.items[0].href}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-500/10 no-underline"
                          style={{
                            color: unbColors.primary,
                            fontWeight: category.priority === 'high' ? 600 : 500
                          }}
                        >
                          <IconComponent size={18} variant="unb" color={unbColors.primary} />
                          <span>{category.label}</span>
                        </Link>
                      )}

                      {/* Dropdown Menu */}
                      {hasDropdown && dropdownsOpen[category.id] && (
                        <div
                          role="menu"
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-xl shadow-2xl min-w-[300px] max-w-[340px] z-[1001] animate-fadeIn overflow-hidden"
                          style={{
                            background: 'white',
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
                                  className="flex items-center gap-3 p-3 no-underline transition-all duration-200 hover:bg-slate-50"
                                  style={{
                                    color: unbColors.neutral,
                                    background: isActive(item.href) ? unbColors.alpha.primary : 'transparent'
                                  }}
                                >
                                  <ItemIcon size={20} variant="unb" />
                                  <div className="flex-1">
                                    <div className={`${isActive(item.href) ? 'font-bold' : 'font-medium'} text-sm`}>
                                      {item.label}
                                    </div>
                                    <div className="text-xs opacity-70 mt-0.5">
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
                                      className="flex items-center gap-2 py-2 px-4 pl-10 no-underline text-sm transition-all duration-200 hover:bg-slate-50"
                                      style={{
                                        color: unbColors.neutral,
                                        background: isActive(subItem.href) ? unbColors.alpha.accent : 'transparent'
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

            {/* Ações - Direita */}
            <div className="flex items-center gap-3">

              {/* Persona Atual (Desktop/Tablet) */}
              {!isMobile && currentPersonaData && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: unbColors.alpha.secondary,
                    border: `1px solid ${unbColors.alpha.primary}`
                  }}
                >
                  <span className="text-lg">{currentPersonaData.avatar}</span>
                  <div className="text-xs font-medium" style={{ color: unbColors.primary }}>
                    {currentPersonaData.name}
                  </div>
                </div>
              )}

              {/* CTAs - RF02: Hierarquia Visual */}
              {!isMobile && !isAuthenticated && (
                <>
                  {/* Botão Secundário - Entrar */}
                  <Link
                    href="/login"
                    className="no-underline"
                  >
                    <button
                      style={{
                        background: 'transparent',
                        color: designTokens.colors.primary,
                        border: `${designTokens.borders.width.medium} solid ${designTokens.colors.primary}`,
                        padding: `${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
                        borderRadius: designTokens.borders.radius.lg,
                        fontSize: designTokens.typography.fontSize.sm,
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        minHeight: designTokens.touch.minTargetSize,
                        cursor: 'pointer',
                        transition: `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.easing.default}`,
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = designTokens.colors.primaryAlpha;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      aria-label="Acessar sua conta"
                    >
                      Entrar
                    </button>
                  </Link>

                  {/* Botão Primário - Criar Conta */}
                  <Link
                    href="/cadastro"
                    className="no-underline"
                  >
                    <button
                      style={{
                        background: designTokens.colors.primary,
                        color: 'white',
                        border: 'none',
                        padding: `${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
                        borderRadius: designTokens.borders.radius.lg,
                        fontSize: designTokens.typography.fontSize.sm,
                        fontWeight: designTokens.typography.fontWeight.bold,
                        minHeight: designTokens.touch.minTargetSize,
                        cursor: 'pointer',
                        transition: `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.easing.default}`,
                        boxShadow: designTokens.shadows.md,
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = designTokens.colors.primaryHover;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = designTokens.shadows.lg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = designTokens.colors.primary;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = designTokens.shadows.md;
                      }}
                      aria-label="Criar uma nova conta"
                    >
                      Criar Conta
                    </button>
                  </Link>
                </>
              )}

              {/* Perfil - Usuário autenticado */}
              {!isMobile && isAuthenticated && (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg no-underline font-medium transition-all duration-200 hover:bg-blue-500/10"
                  style={{ color: unbColors.primary }}
                >
                  <span>👤</span>
                  <span>Perfil</span>
                </Link>
              )}

              {/* Admin Link */}
              {isAdmin && !isMobile && (
                <Link
                  href="/admin"
                  className="flex items-center px-3 py-2 rounded-lg no-underline text-xs font-medium transition-all duration-200 hover:bg-blue-500/10"
                  style={{ color: unbColors.primary }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Admin
                </Link>
              )}

              {/* Accessibility Toggle */}
              {!isMobile && (
                <HighContrastToggle variant="button" showLabel={false} />
              )}

              {/* Menu Mobile Toggle */}
              {isMobile && (
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-blue-500/10"
                  style={{
                    color: unbColors.primary,
                    minWidth: designTokens.touch.minTargetSize,
                    minHeight: designTokens.touch.minTargetSize
                  }}
                  aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <CloseIcon size={24} color={unbColors.primary} />
                  ) : (
                    <MenuIcon size={24} color={unbColors.primary} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Barra de pesquisa PCDT - Linha secundária (não na home) */}
          {!isMobile && pathname !== '/' && (
            <div className="px-4 sm:px-6 lg:px-8 pb-4">
              <PCDTSearchSystem
                variant="header"
                enableFilterChips={false}
                placeholder="Buscar termos PCDT, medicamentos, protocolos..."
                className="max-w-2xl mx-auto"
              />
            </div>
          )}
        </div>

        {/* Overlay para fechar dropdowns */}
        {Object.values(dropdownsOpen).some(Boolean) && (
          <div
            className="fixed inset-0 z-[999]"
            onClick={closeAllDropdowns}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeAllDropdowns();
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label="Fechar menu de navegação"
          />
        )}

        {/* Animações CSS */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </header>

      {/* Mobile Navigation Menu */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={navigationCategories}
        currentPersona={currentPersonaData as any}
        isActive={isActive}
      />
    </>
  );
}
