# PR #264 - Roadmap de Melhorias

**Branch**: `hml` → `main`
**Objetivo**: Sistema de navegação simplificado e acessível com design tokens unificados

## ✅ Fase 1: Implementação Base (CONCLUÍDA)

### Entregas
- ✅ NavigationHeader simplificado com design tokens
- ✅ OfflineIndicator com detecção de conectividade
- ✅ Design tokens centralizados (`designTokens.ts`)
- ✅ 13/13 testes Playwright E2E passando
- ✅ 3 hotspots SonarCloud resolvidos

### Commits
- `fb28adb7` - NavigationHeader rename + security headers
- `efa17d5d` - GitHub Actions pinning (14 actions)
- `2346a8ce` - Async HTTP + salt suppression
- `6005eb1d` - Migration script deletion

---

## 🚀 Fase 2: Otimização de Performance (PLANEJADO)

### Objetivo
Aplicar padrões Next.js Context7 para melhorar performance e experiência do usuário.

### Melhorias Planejadas

#### 2.1. Link Component Optimization
**Padrão Context7**: Prefetching automático para navegação instantânea

```typescript
// apps/frontend-nextjs/src/components/navigation/NavigationHeader.tsx
import Link from 'next/link'

// ❌ ANTES: <a> tag sem prefetching
<a href="/educacional">Educacional</a>

// ✅ DEPOIS: Link com prefetching automático
<Link href="/educacional" prefetch={true}>
  Educacional
</Link>
```

**Benefícios**:
- Navegação instantânea via client-side routing
- Prefetch em viewport (produção)
- Redução de tempo de carregamento em 60-80%

#### 2.2. Metadata API Implementation
**Padrão Context7**: Migrar de `next/head` para Metadata API

```typescript
// apps/frontend-nextjs/src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Roteiro de Dispensação - Hanseníase',
  description: 'Sistema educacional para dispensação de medicamentos PQT-U',
  openGraph: {
    title: 'Roteiro de Dispensação',
    description: 'Orientações farmacêuticas para hanseníase',
    images: ['/og-image.png'],
  },
}
```

**Benefícios**:
- SEO otimizado
- Melhor compartilhamento social
- Menos código boilerplate

#### 2.3. Performance Monitoring
**Padrão Context7**: PerformanceObserver para métricas de navegação

```typescript
// apps/frontend-nextjs/src/instrumentation-client.ts
export function register() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry instanceof PerformanceNavigationTiming) {
        console.log('Time to Interactive:', entry.loadEventEnd - entry.fetchStart)
      }
    }
  })
  observer.observe({ entryTypes: ['navigation'] })
}
```

**Métricas**:
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Cumulative Layout Shift (CLS)

### Estimativa
- **Esforço**: 4-6 horas
- **Arquivos**: 5-8 modificações
- **Testes**: Adicionar 5 testes de performance

---

## 🎯 Fase 3: Acessibilidade Avançada (PLANEJADO)

### Objetivo
Implementar padrões React Aria para navegação por teclado e ARIA completo.

### Melhorias Planejadas

#### 3.1. Menu com Keyboard Navigation
**Padrão React Aria**: Menu acessível com atalhos de teclado

```typescript
// apps/frontend-nextjs/src/components/navigation/AccessibleDropdown.tsx
import { Menu, MenuItem, MenuTrigger, Button, Keyboard, Text } from 'react-aria-components'

<MenuTrigger>
  <Button>Educacional</Button>
  <Menu>
    <MenuItem textValue="Módulos">
      <Text slot="label">Módulos</Text>
      <Text slot="description">Conteúdo educacional estruturado</Text>
      <Keyboard>Alt+M</Keyboard>
    </MenuItem>
    <MenuItem textValue="Glossário">
      <Text slot="label">Glossário</Text>
      <Text slot="description">Termos médicos explicados</Text>
      <Keyboard>Alt+G</Keyboard>
    </MenuItem>
  </Menu>
</MenuTrigger>
```

**Recursos**:
- Navegação por setas (↑↓←→)
- Busca por digitação
- Atalhos de teclado personalizados
- Anúncios de screen reader otimizados

#### 3.2. WCAG 2.1 AA Compliance
- Touch targets 44x44px (já implementado)
- Contraste de cores mínimo 4.5:1
- Focus indicators visíveis
- Skip navigation links

#### 3.3. Keyboard Shortcuts Global
```typescript
// Atalhos planejados
Alt+H - Home
Alt+E - Educacional
Alt+C - Chat
Alt+P - Perfil
Alt+/ - Busca rápida
Esc   - Fechar menus/modais
```

### Estimativa
- **Esforço**: 6-8 horas
- **Arquivos**: 8-12 modificações
- **Testes**: 10 testes de acessibilidade (Playwright + jest-axe)

---

## 🔧 Fase 4: Refatoração e Code Quality (PLANEJADO)

### Objetivo
Consolidar componentes e eliminar duplicação.

### Melhorias Planejadas

#### 4.1. Componente Unificado de Navegação
```
NavigationHeader (simplificado)
├── DesktopNav (> 768px)
│   ├── Logo + Link
│   ├── NavMenu (dropdown acessível)
│   └── UserActions
└── MobileNav (≤ 768px)
    ├── MenuButton (hambúrguer)
    └── SlideOutMenu
```

#### 4.2. Eliminação de Arquivos Obsoletos
- ✅ `NavigationHeaderSimplified.tsx` → `NavigationHeader.tsx`
- 🔄 Avaliar outros componentes duplicados
- 🔄 Consolidar hooks de navegação

#### 4.3. TypeScript Strict Mode
- Eliminar `any` types restantes
- Adicionar interfaces faltantes
- Validação de props com Zod (opcional)

### Estimativa
- **Esforço**: 4-5 horas
- **Arquivos**: 10-15 modificações
- **Redução**: ~500 linhas de código

---

## 📊 Métricas de Sucesso

### Performance
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Time to Interactive: < 3.5s

### Acessibilidade
- Lighthouse Accessibility Score: 100/100
- WCAG 2.1 AA: 100% compliance
- Keyboard navigation: Todos os fluxos acessíveis
- Screen reader: Zero erros de anúncio

### Code Quality
- SonarCloud Security Rating: A
- TypeScript strict: 100% coverage
- Test coverage: > 80%
- Zero ESLint errors/warnings

---

## 🗓️ Cronograma Estimado

| Fase | Duração | Dependências |
|------|---------|--------------|
| Fase 1 | ✅ Concluída | - |
| Fase 2 | 2-3 dias | Fase 1 |
| Fase 3 | 3-4 dias | Fase 2 |
| Fase 4 | 2 dias | Fase 3 |

**Total estimado**: 7-9 dias úteis

---

## 📝 Próximos Passos Imediatos

1. ✅ Push de commits de segurança para HML
2. ✅ Comentário no PR #264 com status
3. ⏳ Aguardar análise SonarCloud
4. 🔄 Iniciar Fase 2 (Performance)
5. 🔄 Criar branch `pr-264-phase-2` para desenvolvimento

---

## 🔗 Referências

### Context7 Patterns
- Next.js Link: `/vercel/next.js` - Prefetching e navegação
- Next.js Metadata: `/vercel/next.js` - SEO e Open Graph
- React Aria Menu: `/websites/react-spectrum_adobe_react-aria` - Acessibilidade
- React Aria Keyboard: `/websites/react-spectrum_adobe_react-aria` - Navegação

### Documentação Interna
- `SECURITY_ENHANCEMENTS_PR_264.md` - Melhorias de segurança
- `apps/frontend-nextjs/src/config/designTokens.ts` - Design system
- `tests/e2e/pr-264-navigation-simplified.spec.ts` - Testes E2E

---

**Última atualização**: 2025-10-19
**Responsável**: Claude Code + Context7 Patterns
**Status**: Fase 1 completa, Fase 2 planejada
