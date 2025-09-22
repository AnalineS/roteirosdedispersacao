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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);

  // Detectar tipo de dispositivo
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1280);
      setIsWideScreen(width >= 1600);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
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
        className={`navigation-header ${className}`}
        role="banner"
        aria-label="Main navigation header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        zIndex: 1000
      }}
    >
      {/* Primeira linha - Navegação principal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 1rem' : isTablet ? '0 clamp(1.5rem, 2vw, 2rem)' : '0 clamp(2rem, 3vw, 4rem)',
        gap: isMobile ? '0.5rem' : isTablet ? '1rem' : '1.5rem',
        height: '80px',
        boxSizing: 'border-box'
      }}>
      {/* Logo e Título - Esquerda */}
      <div className="nav-logo-section">
        <Tooltip content="Roteiros de Dispensação - Sistema Inteligente de Orientação" position="bottom">
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: unbColors.primary
            }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
          className="nav-main-section"
          role="navigation"
          aria-label="Navegação principal do sistema educacional"
          id="main-navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isTablet ? '0.5rem' : '1rem',
            flexWrap: 'nowrap',
            overflow: 'hidden'
          }}
        >
          {visibleCategories.map((category) => {
            const IconComponent = getCategoryIcon(category.id);
            const hasDropdown = category.items.length > 1 || category.items.some(item => item.subItems?.length);
            
            return (
              <div key={category.id} style={{ position: 'relative' }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: `2px solid ${dropdownsOpen[category.id] ? unbColors.primary : 'transparent'}`,
                      color: unbColors.primary,
                      padding: isTablet ? '6px 10px' : '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: isTablet ? '0.85rem' : '0.95rem',
                      fontWeight: '500',
                      transition: 'all 200ms ease',
                      opacity: dropdownsOpen[category.id] ? 1 : 0.9,
                      outline: 'none',
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    onFocus={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.border = `2px solid ${unbColors.primary}`; }}
                    aria-expanded={dropdownsOpen[category.id]}
                    aria-haspopup="menu"
                    aria-label={`Abrir menu ${category.label}: ${category.description}`}
                    aria-describedby={`category-${category.id}-desc`}
                  >
                    <IconComponent size={isTablet ? 16 : 18} variant="unb" color={unbColors.primary} />
                    <span style={{ 
                      display: isTablet && category.label.length > 12 ? 'none' : 'inline',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: isTablet ? '80px' : 'none'
                    }}>
                      {category.label}
                    </span>
                    <ChevronDownIcon 
                      size={14} 
                      color={unbColors.primary}
                      style={{
                        transform: dropdownsOpen[category.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease'
                      }}
                    />
                  </button>
                ) : (
                  <Link
                    href={category.items[0].href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: unbColors.primary,
                      textDecoration: 'none',
                      padding: isTablet ? '6px 10px' : '8px 14px',
                      borderRadius: '8px',
                      fontSize: isTablet ? '0.85rem' : '0.95rem',
                      fontWeight: '500',
                      transition: 'all 200ms ease',
                      opacity: isActive(category.items[0].href) ? 1 : 0.9,
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <IconComponent size={isTablet ? 16 : 18} variant="unb" color={unbColors.primary} />
                    <span style={{ 
                      display: isTablet && category.label.length > 12 ? 'none' : 'inline',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: isTablet ? '80px' : 'none'
                    }}>
                      {category.label}
                    </span>
                  </Link>
                )}

                {/* Hidden description for screen readers */}
                <span
                  id={`category-${category.id}-desc`}
                  style={{
                    position: 'absolute',
                    left: '-10000px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                  }}
                >
                  {category.description}
                </span>

                {/* Dropdown Menu */}
                {hasDropdown && dropdownsOpen[category.id] && (
                  <div
                    role="menu"
                    aria-labelledby={`category-${category.id}-button`}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '8px',
                      background: unbColors.white,
                      border: `1px solid ${unbColors.alpha.primary}`,
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      minWidth: '280px',
                      maxWidth: '320px',
                      zIndex: 1001,
                      animation: 'fadeIn 200ms ease'
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
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              color: unbColors.neutral,
                              textDecoration: 'none',
                              borderRadius: '8px',
                              margin: '4px',
                              transition: 'all 200ms ease',
                              background: isActive(item.href) ? unbColors.alpha.primary : 'transparent',
                              outline: 'none',
                              border: '2px solid transparent'
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
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: isActive(item.href) ? 'bold' : '500',
                                fontSize: '0.95rem',
                                marginBottom: '2px'
                              }}>
                                {item.label}
                              </div>
                              <div style={{
                                fontSize: '0.8rem',
                                opacity: 0.7,
                                lineHeight: '1.3'
                              }}>
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
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 16px 10px 32px',
                                  color: unbColors.neutral,
                                  textDecoration: 'none',
                                  fontSize: '0.9rem',
                                  borderRadius: '6px',
                                  margin: '2px 4px',
                                  opacity: isActive(subItem.href) ? 1 : 0.8,
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: unbColors.alpha.secondary,
            padding: '6px 12px',
            borderRadius: '20px',
            border: `1px solid ${unbColors.alpha.primary}`
          }}>
            <span style={{ fontSize: '1.2rem' }}>{currentPersonaData.avatar}</span>
            <div>
              <div style={{ 
                color: unbColors.white,
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>
                {currentPersonaData.name}
              </div>
              <div style={{ 
                color: unbColors.white,
                fontSize: '0.7rem',
                opacity: 0.8
              }}>
                {currentPersonaData.personality}
              </div>
            </div>
          </div>
        )}

        {/* Simplified Navigation Links */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '4px' : '12px'
        }}>
          {!isMobile && (
            <>
              <HighContrastToggle 
                variant="button" 
                showLabel={false}
                className="header-accessibility-toggle"
              />
              
              <Link 
                href="/sobre"
                style={{
                  color: unbColors.primary,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  opacity: 0.9
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.9';
                }}
              >
                Mapa do Site
              </Link>
              
              <AuthButton variant="header" className="header-auth-buttons" />
            </>
          )}
          
          {isAdmin && !isMobile && (
            <Link 
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: pathname === '/admin' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: unbColors.primary,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontSize: '0.8rem',
                fontWeight: '500',
                opacity: 0.8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = pathname === '/admin' ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
                e.currentTarget.style.opacity = '0.8';
              }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ marginRight: '4px' }}
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
            style={{
              background: 'none',
              border: `2px solid transparent`,
              color: unbColors.primary,
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              outline: 'none',
              marginRight: '8px'
            }}
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
            style={{
              background: 'none',
              border: `2px solid transparent`,
              color: unbColors.primary,
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              outline: 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
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
        <div style={{
          padding: '0 clamp(2rem, 3vw, 4rem) 1rem',
          background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.5) 0%, rgba(248, 250, 252, 0) 100%)'
        }}>
          <SearchBar 
            placeholder="🔍 Buscar no site..." 
            className="nav-search-bar"
          />
        </div>
      )}

      {/* Overlay para fechar dropdowns */}
      {Object.values(dropdownsOpen).some(Boolean) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={closeAllDropdowns}
        />
      )}

      {/* Mobile Navigation Menu */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={navigationCategories}
        currentPersona={currentPersonaData}
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