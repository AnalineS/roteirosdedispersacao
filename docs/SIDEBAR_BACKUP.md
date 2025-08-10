# Backup - Sistema Sidebar Original

**Data de Backup:** 2025-08-09
**Migração:** Sidebar → Horizontal Navigation Header

## Estrutura de Interfaces (TypeScript)

Interfaces principais que foram preservadas no NavigationHeader:

```typescript
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
```

## Estrutura de Dados de Navegação

Estrutura completa migrada para NavigationHeader:

```javascript
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
```

## Arquivos Originais Removidos

- `/components/navigation/Sidebar/index.tsx` (244 linhas)
- `/components/navigation/Sidebar/DesktopSidebar.tsx` (530 linhas)
- `/components/navigation/Sidebar/MobileSidebar.tsx`
- `/components/navigation/Sidebar/TabletSidebar.tsx`

## Migração Realizada

✅ **Origem**: Sidebar vertical fixo 320px
✅ **Destino**: Header horizontal 72px
✅ **Ícones**: Emojis → SVG profissional (NavigationIcons.tsx)
✅ **Cores**: Theme genérico → Paleta UnB institucional
✅ **Layout**: Sidebar esquerda → Header: Logo + Menu + Personas
✅ **Responsividade**: Desktop/Tablet/Mobile mantida
✅ **Funcionalidade**: Todas as features preservadas
✅ **Acessibilidade**: ARIA e navegação por teclado mantidas

## Novas Implementações

- **NavigationHeader.tsx**: Componente principal horizontal
- **MobileNavigation.tsx**: Menu slide móvel integrado
- **NavigationIcons.tsx**: Biblioteca completa de ícones SVG
- **modernTheme.ts**: Estendido com paleta UnB
- **EducationalLayout.tsx**: Atualizado para header horizontal

## Benefícios da Migração

1. **Mais Espaço de Conteúdo**: Eliminou 320px de sidebar
2. **Design Moderno**: Header horizontal profissional
3. **Ícones Profissionais**: SVG outline substituindo emojis
4. **Branding UnB**: Cores institucionais aplicadas
5. **Melhor UX Mobile**: Slide menu otimizado
6. **Performance**: Menos componentes renderizados

Este backup preserva toda a lógica e estrutura do sistema sidebar original para referência futura.