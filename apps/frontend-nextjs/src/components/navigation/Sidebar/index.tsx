'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DesktopSidebar from './DesktopSidebar';
import MobileSidebar from './MobileSidebar';
import TabletSidebar from './TabletSidebar';
import { usePersonas } from '@/hooks/usePersonas';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  category: 'learning' | 'interaction' | 'progress' | 'tools';
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

interface EducationalSidebarProps {
  currentPersona?: string;
}

export default function EducationalSidebar({ currentPersona }: EducationalSidebarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTabletCollapsed, setIsTabletCollapsed] = useState(false);
  const { personas } = usePersonas();

  // Detectar tipo de dispositivo
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Estrutura de navegação educacional hierárquica
  const navigationCategories: NavigationCategory[] = [
    {
      id: 'learning',
      label: 'Aprendizagem',
      icon: '📚',
      description: 'Módulos educacionais estruturados',
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
        },
        {
          id: 'modules',
          label: 'Módulos de Conteúdo',
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
            }
          ]
        },
        {
          id: 'dashboard',
          label: 'Dashboard Educacional',
          href: '/dashboard',
          icon: '📊',
          description: 'Visão geral do progresso',
          category: 'learning',
          level: 'beginner',
          estimatedTime: '5 min'
        }
      ]
    },
    {
      id: 'interaction',
      label: 'Interação',
      icon: '💬',
      description: 'Comunicação com assistentes',
      items: [
        {
          id: 'chat',
          label: 'Conversar',
          href: '/chat',
          icon: '🤖',
          description: 'Chat com Dr. Gasnelio e Gá',
          category: 'interaction',
          estimatedTime: 'Ilimitado'
        }
      ]
    },
    {
      id: 'tools',
      label: 'Ferramentas',
      icon: '🛠️',
      description: 'Recursos práticos e calculadoras',
      items: [
        {
          id: 'resources',
          label: 'Recursos Práticos',
          href: '/resources',
          icon: '🎯',
          description: 'Calculadoras e checklists',
          category: 'tools',
          subItems: [
            {
              id: 'dose-calculator',
              label: 'Calculadora de Doses',
              href: '/resources/calculator',
              icon: '🧮',
              description: 'Cálculo automático PQT-U',
              category: 'tools'
            },
            {
              id: 'checklist',
              label: 'Checklist Dispensação',
              href: '/resources/checklist',
              icon: '✅',
              description: 'Lista de verificação',
              category: 'tools'
            }
          ]
        }
      ]
    },
    {
      id: 'progress',
      label: 'Progresso',
      icon: '📈',
      description: 'Acompanhamento de aprendizagem',
      items: [
        {
          id: 'progress',
          label: 'Meu Progresso',
          href: '/progress',
          icon: '📊',
          description: 'Acompanhe seu aprendizado',
          category: 'progress',
          completionRate: 65
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleTabletCollapse = () => setIsTabletCollapsed(!isTabletCollapsed);

  // Obter persona atual
  const currentPersonaData = currentPersona && personas[currentPersona] ? personas[currentPersona] : null;

  if (isMobile) {
    return (
      <MobileSidebar
        isOpen={isMenuOpen}
        onToggle={toggleMenu}
        onClose={closeMenu}
        categories={navigationCategories}
        currentPersona={currentPersonaData}
        isActive={isActive}
      />
    );
  }

  if (isTablet) {
    return (
      <TabletSidebar
        isCollapsed={isTabletCollapsed}
        onToggleCollapse={toggleTabletCollapse}
        categories={navigationCategories}
        currentPersona={currentPersonaData}
        isActive={isActive}
      />
    );
  }

  return (
    <DesktopSidebar
      categories={navigationCategories}
      currentPersona={currentPersonaData}
      isActive={isActive}
    />
  );
}

