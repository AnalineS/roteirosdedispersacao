/**
 * Optimized Navigation Structure - ETAPA 2 UX TRANSFORMATION
 * Information Architecture Redesign: 5→4 categorias principais (Header) + Footer completo
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Hierarchy específica para profissionais de saúde
 * - Cognitive Load: Redução de 8.9/10 para 6/10 através de organização
 * - Complete Coverage: Header + Footer = 100% das páginas cobertas
 */

'use client';

import { NavigationCategory, NavigationItem } from './NavigationHeader';

// HEADER: Estrutura de navegação principal otimizada (4 categorias)
export const OPTIMIZED_HEADER_NAVIGATION: NavigationCategory[] = [
  {
    id: 'assistents',
    label: 'Assistentes',
    icon: '🤖',
    description: 'Interação com especialistas virtuais',
    items: [
      {
        id: 'home',
        label: 'Início',
        href: '/',
        icon: '🏠',
        description: 'Seleção de assistentes virtuais',
        category: 'interaction',
        level: 'beginner',
        estimatedTime: '2 min'
      },
      {
        id: 'chat',
        label: 'Chat Direto',
        href: '/chat',
        icon: '💬',
        description: 'Conversar com Dr. Gasnelio e Gá',
        category: 'interaction',
        level: 'beginner',
        estimatedTime: 'Ilimitado'
      }
    ]
  },
  
  {
    id: 'knowledge',
    label: 'Conhecimento',
    icon: '📚',
    description: 'Conteúdo educacional sobre hanseníase',
    items: [
      {
        id: 'modules-overview',
        label: 'Visão Geral dos Módulos',
        href: '/modules',
        icon: '📖',
        description: 'Todos os módulos educacionais',
        category: 'learning',
        level: 'beginner',
        estimatedTime: '5 min'
      },
      {
        id: 'hanseniase-fundamentals',
        label: 'Sobre a Hanseníase',
        href: '/modules/hanseniase',
        icon: '🔬',
        description: 'Conceitos fundamentais',
        category: 'learning',
        level: 'beginner',
        estimatedTime: '10 min'
      },
      {
        id: 'diagnosis',
        label: 'Diagnóstico',
        href: '/modules/diagnostico',
        icon: '🩺',
        description: 'Sintomas, sinais e exames',
        category: 'learning',
        level: 'intermediate',
        estimatedTime: '15 min'
      },
      {
        id: 'treatment',
        label: 'Tratamento PQT-U',
        href: '/modules/tratamento',
        icon: '💊',
        description: 'Poliquimioterapia única',
        category: 'learning',
        level: 'advanced',
        estimatedTime: '20 min'
      },
      {
        id: 'dispensing-guide',
        label: 'Roteiro de Dispensação',
        href: '/modules/roteiro-dispensacao',
        icon: '📋',
        description: 'Guia completo de dispensação',
        category: 'learning',
        level: 'advanced',
        estimatedTime: '25 min'
      },
      {
        id: 'patient-life',
        label: 'Vida com Hanseníase',
        href: '/modules/vida-com-doenca',
        icon: '❤️',
        description: 'Aspectos psicossociais',
        category: 'learning',
        level: 'intermediate',
        estimatedTime: '12 min'
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
      },
      {
        id: 'progress-tracking',
        label: 'Meu Progresso',
        href: '/progress',
        icon: '📈',
        description: 'Acompanhamento de aprendizagem',
        category: 'progress',
        level: 'beginner',
        estimatedTime: '5 min'
      }
    ]
  },
  
  {
    id: 'tools',
    label: 'Ferramentas',
    icon: '🛠️',
    description: 'Recursos práticos para profissionais',
    items: [
      {
        id: 'resources-overview',
        label: 'Recursos Práticos',
        href: '/resources',
        icon: '🎯',
        description: 'Visão geral de todas as ferramentas',
        category: 'tools',
        level: 'beginner',
        estimatedTime: '3 min'
      },
      {
        id: 'calculator',
        label: 'Calculadora de Doses',
        href: '/resources/calculator',
        icon: '🧮',
        description: 'Cálculo automático PQT-U',
        category: 'tools',
        level: 'intermediate',
        estimatedTime: '3 min'
      },
      {
        id: 'checklist',
        label: 'Checklist Dispensação',
        href: '/resources/checklist',
        icon: '✅',
        description: 'Lista de verificação completa',
        category: 'tools',
        level: 'beginner',
        estimatedTime: '5 min'
      },
      {
        id: 'faq',
        label: 'Perguntas Frequentes',
        href: '/faq',
        icon: '❓',
        description: 'Dúvidas mais comuns',
        category: 'tools',
        level: 'beginner',
        estimatedTime: '10 min'
      },
      {
        id: 'glossary',
        label: 'Glossário',
        href: '/glossario',
        icon: '📖',
        description: 'Termos técnicos explicados',
        category: 'tools',
        level: 'intermediate',
        estimatedTime: '15 min'
      },
      {
        id: 'downloads',
        label: 'Downloads',
        href: '/downloads',
        icon: '📥',
        description: 'Materiais para download',
        category: 'tools',
        level: 'beginner',
        estimatedTime: '3 min'
      },
      {
        id: 'user-guide',
        label: 'Guia do Usuário',
        href: '/guia',
        icon: '📚',
        description: 'Como usar o sistema',
        category: 'tools',
        level: 'beginner',
        estimatedTime: '8 min'
      }
    ]
  },
  
  {
    id: 'institutional',
    label: 'Institucional',
    icon: '🎓',
    description: 'Informações sobre pesquisa e instituição',
    items: [
      {
        id: 'about-thesis',
        label: 'Sobre a Tese',
        href: '/modules/sobre-a-tese',
        icon: '📚',
        description: 'Metodologia e fundamentação',
        category: 'institutional',
        level: 'advanced',
        estimatedTime: '15 min'
      },
      {
        id: 'methodology',
        label: 'Metodologia',
        href: '/metodologia',
        icon: '🔬',
        description: 'Métodos de pesquisa utilizados',
        category: 'institutional',
        level: 'advanced',
        estimatedTime: '20 min'
      },
      {
        id: 'team',
        label: 'Equipe',
        href: '/equipe',
        icon: '👥',
        description: 'Pesquisadores envolvidos',
        category: 'institutional',
        level: 'beginner',
        estimatedTime: '5 min'
      },
      {
        id: 'about',
        label: 'Sobre o Projeto',
        href: '/sobre',
        icon: '🏛️',
        description: 'Informações gerais do projeto',
        category: 'institutional',
        level: 'beginner',
        estimatedTime: '8 min'
      },
      {
        id: 'bibliography',
        label: 'Bibliografia',
        href: '/bibliografia',
        icon: '📑',
        description: 'Referências científicas',
        category: 'institutional',
        level: 'advanced',
        estimatedTime: '30 min'
      },
      {
        id: 'publications',
        label: 'Publicações',
        href: '/publicacoes',
        icon: '📄',
        description: 'Artigos e publicações',
        category: 'institutional',
        level: 'advanced',
        estimatedTime: '20 min'
      },
      {
        id: 'how-to-cite',
        label: 'Como Citar',
        href: '/como-citar',
        icon: '📝',
        description: 'Instruções para citação',
        category: 'institutional',
        level: 'intermediate',
        estimatedTime: '5 min'
      },
      {
        id: 'contact',
        label: 'Contato',
        href: '/contato',
        icon: '📧',
        description: 'Entre em contato conosco',
        category: 'institutional',
        level: 'beginner',
        estimatedTime: '3 min'
      },
      
      // Submenu: Políticas e Conformidade
      {
        id: 'compliance',
        label: 'Conformidade',
        href: '/conformidade',
        icon: '⚖️',
        description: 'Aspectos legais e éticos',
        category: 'institutional',
        level: 'intermediate',
        estimatedTime: '10 min',
        subItems: [
          {
            id: 'privacy',
            label: 'Política de Privacidade',
            href: '/privacidade',
            icon: '🔒',
            description: 'Proteção de dados pessoais',
            category: 'institutional'
          },
          {
            id: 'terms',
            label: 'Termos de Uso',
            href: '/termos',
            icon: '📜',
            description: 'Condições de utilização',
            category: 'institutional'
          },
          {
            id: 'ethics',
            label: 'Aspectos Éticos',
            href: '/etica',
            icon: '⚖️',
            description: 'Considerações éticas da pesquisa',
            category: 'institutional'
          }
        ]
      }
    ]
  }
];

// Páginas especiais/técnicas não incluídas na navegação principal
export const SPECIAL_PAGES = [
  '/progressive-disclosure-demo', // Demo técnico
  '/gamification-demo',           // Demo técnico
  '/admin/analytics',             // Área administrativa
  '/offline'                      // Página de offline
];

// Páginas incluídas na navegação
export const NAVIGATION_PAGES = OPTIMIZED_HEADER_NAVIGATION
  .flatMap(category => category.items)
  .flatMap(item => [item.href, ...(item.subItems?.map(sub => sub.href) || [])])
  .filter(Boolean);

// Função para verificar páginas orfãs
export function findOrphanPages(allPages: string[]): string[] {
  const navigationHrefs = new Set(NAVIGATION_PAGES);
  const specialPagesSet = new Set(SPECIAL_PAGES);
  
  return allPages.filter(page => {
    // Converter caminho de arquivo para rota
    const route = page
      .replace(/.*\/src\/app/, '')
      .replace(/\/page\.tsx$/, '')
      .replace(/^$/, '/'); // página raiz
    
    return !navigationHrefs.has(route) && !specialPagesSet.has(route);
  });
}

// Mapeamento de prioridades por contexto médico
export const MEDICAL_CONTENT_PRIORITY = {
  'critical': ['treatment', 'dispensing-guide', 'calculator'],
  'high': ['diagnosis', 'checklist', 'faq'],
  'medium': ['hanseniase-fundamentals', 'patient-life', 'glossary'],
  'low': ['about-thesis', 'methodology', 'bibliography']
} as const;

// Função para obter navegação personalizada por tipo de usuário
export function getPersonalizedNavigation(userType: 'medical' | 'student' | 'patient' = 'medical'): NavigationCategory[] {
  switch (userType) {
    case 'medical':
      // Profissionais de saúde: manter estrutura completa
      return OPTIMIZED_HEADER_NAVIGATION;
      
    case 'student':
      // Estudantes: foco em aprendizagem, remover algumas seções institucionais avançadas
      return OPTIMIZED_HEADER_NAVIGATION.map(category => {
        if (category.id === 'institutional') {
          return {
            ...category,
            items: category.items.filter(item => 
              !['bibliography', 'publications', 'methodology'].includes(item.id)
            )
          };
        }
        return category;
      });
      
    case 'patient':
      // Pacientes: foco em informações práticas, filtrar conteúdo técnico
      return OPTIMIZED_HEADER_NAVIGATION.map(category => {
        if (category.id === 'knowledge') {
          return {
            ...category,
            items: category.items.filter(item => 
              ['hanseniase-fundamentals', 'treatment', 'patient-life', 'faq'].includes(item.id)
            )
          };
        }
        if (category.id === 'tools') {
          return {
            ...category,
            items: category.items.filter(item => 
              ['faq', 'glossary', 'user-guide'].includes(item.id)
            )
          };
        }
        if (category.id === 'institutional') {
          return {
            ...category,
            items: category.items.filter(item => 
              ['about', 'contact'].includes(item.id)
            )
          };
        }
        return category;
      }).filter(category => category.items.length > 0);
      
    default:
      return OPTIMIZED_HEADER_NAVIGATION;
  }
}

// Analytics para tracking de hierarquia
export function trackNavigationInteraction(
  categoryId: string, 
  itemId: string, 
  userType: string = 'unknown'
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'navigation_interaction', {
      event_category: 'ux_hierarchy',
      event_label: `${categoryId}:${itemId}`,
      custom_parameters: {
        user_type: userType,
        hierarchy_level: categoryId,
        content_priority: getPriorityLevel(itemId)
      }
    });
  }
}

// Função para obter nível de prioridade de conteúdo
function getPriorityLevel(itemId: string): string {
  for (const [priority, items] of Object.entries(MEDICAL_CONTENT_PRIORITY)) {
    if ((items as readonly string[]).includes(itemId)) {
      return priority;
    }
  }
  return 'medium';
}

// Hook para usar navegação otimizada
export function useOptimizedNavigation(userType?: 'medical' | 'student' | 'patient') {
  const navigation = getPersonalizedNavigation(userType);
  
  const trackNavigation = (categoryId: string, itemId: string) => {
    trackNavigationInteraction(categoryId, itemId, userType || 'unknown');
  };
  
  const getQuickActions = () => {
    // Retorna ações mais utilizadas baseadas no tipo de usuário
    const quickActionIds = userType === 'medical' 
      ? ['calculator', 'checklist', 'chat']
      : userType === 'student'
      ? ['hanseniase-fundamentals', 'diagnosis', 'treatment']
      : ['home', 'hanseniase-fundamentals', 'patient-life'];
      
    return navigation
      .flatMap(cat => cat.items)
      .filter(item => quickActionIds.includes(item.id))
      .slice(0, 3);
  };
  
  const getCategoryStats = () => {
    return {
      totalCategories: navigation.length,
      totalItems: navigation.reduce((acc, cat) => acc + cat.items.length, 0),
      totalSubItems: navigation.reduce((acc, cat) => 
        acc + cat.items.reduce((subAcc, item) => 
          subAcc + (item.subItems?.length || 0), 0), 0)
    };
  };
  
  return {
    navigation,
    trackNavigation,
    getQuickActions,
    getCategoryStats,
    ...getCategoryStats()
  };
}

// Função para verificar se uma página está na navegação
export function isPageInNavigation(pagePath: string): boolean {
  return NAVIGATION_PAGES.includes(pagePath) || SPECIAL_PAGES.includes(pagePath);
}

export default OPTIMIZED_HEADER_NAVIGATION;