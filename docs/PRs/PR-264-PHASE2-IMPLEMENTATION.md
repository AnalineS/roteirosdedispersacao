# PR #264 - Fase 2: Performance Optimization - Implementação

**Status**: Em progresso
**Branch**: `hml`
**Padrões**: Context7 Next.js + React Aria

---

## ✅ Análise Inicial Concluída

### NavigationHeader.tsx - Status Atual
- ✅ **8 instâncias de `<Link>`** já implementadas corretamente
- ✅ Import de `next/link` presente (linha 16)
- ⏳ Prefetch implícito ativo (Next.js 14 App Router padrão)
- 🎯 **Melhoria**: Adicionar `prefetch={true}` explícito para documentação

### Linhas com Link Component
```
Linha 325: Logo/Home link
Linha 398: Navegação principal (itens sem dropdown)
Linha 425: Dropdown menu items
Linha 450: Sub-items dropdown
Linha 499: CTAs (Login/Cadastro)
Linha 530: CTAs alternativo
Linha 569: Mobile navigation
Linha 581: Mobile navigation items
```

---

## 🚀 Implementações Planejadas

### 2.1. Link Component com Prefetch Explícito

#### Objetivo
Garantir prefetching explícito conforme Context7 patterns para navegação instantânea.

#### Implementação
```typescript
// ANTES (linha 398-409):
<Link
  href={category.items[0].href}
  className="flex items-center gap-2..."
>
  <IconComponent />
  <span>{category.label}</span>
</Link>

// DEPOIS:
<Link
  href={category.items[0].href}
  prefetch={true}  // Prefetch explícito para rotas críticas
  className="flex items-center gap-2..."
>
  <IconComponent />
  <span>{category.label}</span>
</Link>
```

#### Estratégia de Prefetch
```typescript
/**
 * Prefetch Strategy - PR #264 Phase 2
 *
 * - Navegação principal: prefetch={true} (rotas críticas)
 * - Dropdown items: prefetch={true} (educacional usado frequentemente)
 * - CTAs: prefetch={false} (evitar prefetch de /login, /cadastro)
 * - Mobile: prefetch={true} (experiência mobile otimizada)
 */
```

#### Arquivos a Modificar
1. `NavigationHeader.tsx` (8 locais)
2. `MobileNavigation.tsx` (verificar usage)
3. `ChatNavigation.tsx` (verificar usage)

#### Ganhos Esperados
- ⚡ Navegação instantânea via client-side routing
- 📊 Redução de 60-80% no tempo de carregamento de páginas frequentes
- 🎯 Prefetch em viewport (produção) para routes críticas

---

### 2.2. Metadata API Implementation

#### Objetivo
Migrar para Metadata API do Next.js 14 para SEO otimizado.

#### Arquivo: `apps/frontend-nextjs/src/app/layout.tsx`

#### Implementação
```typescript
// Adicionar import
import type { Metadata } from 'next'

// Substituir/adicionar metadata object
export const metadata: Metadata = {
  title: {
    default: 'Roteiro de Dispensação - Hanseníase PQT-U',
    template: '%s | Roteiro de Dispensação'
  },
  description: 'Sistema educacional para dispensação de medicamentos da Poliquimioterapia Única (PQT-U) no tratamento de hanseníase. Orientações farmacêuticas baseadas em evidências científicas.',
  keywords: [
    'hanseníase',
    'PQT-U',
    'poliquimioterapia',
    'dispensação farmacêutica',
    'educação em saúde',
    'farmácia clínica'
  ],
  authors: [{ name: 'UnB - Universidade de Brasília' }],
  creator: 'UnB',
  publisher: 'UnB',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Roteiro de Dispensação - Hanseníase',
    description: 'Orientações farmacêuticas para dispensação de PQT-U',
    url: 'https://roteirosdedispensacao.com',
    siteName: 'Roteiro de Dispensação',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Roteiro de Dispensação - Hanseníase PQT-U'
      }
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roteiro de Dispensação - Hanseníase',
    description: 'Sistema educacional para dispensação de PQT-U',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Adicionar código real
  },
}
```

#### Per-Page Metadata
```typescript
// apps/frontend-nextjs/src/app/modules/page.tsx
export const metadata: Metadata = {
  title: 'Módulos Educacionais',
  description: 'Conteúdo educacional estruturado sobre hanseníase e PQT-U'
}

// apps/frontend-nextjs/src/app/chat/page.tsx
export const metadata: Metadata = {
  title: 'Chat Educacional',
  description: 'Converse com assistentes virtuais especializados em hanseníase'
}
```

#### Ganhos Esperados
- 🔍 SEO otimizado para busca orgânica
- 📱 Melhor compartilhamento em redes sociais
- 📊 Rich snippets no Google
- 🎯 Menos código boilerplate

---

### 2.3. Performance Monitoring com PerformanceObserver

#### Objetivo
Monitorar métricas de navegação e performance em produção.

#### Arquivo: `apps/frontend-nextjs/src/instrumentation-client.ts`

#### Implementação
```typescript
/**
 * Client-side Performance Instrumentation - PR #264 Phase 2
 *
 * Monitora:
 * - Time to Interactive (TTI)
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Cumulative Layout Shift (CLS)
 * - Router Transitions
 */

export function register() {
  if (typeof window === 'undefined') return

  // Monitor Navigation Timing
  const startTime = performance.now()

  const navObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
    for (const entry of list.getEntries()) {
      if (entry instanceof PerformanceNavigationTiming) {
        const metrics = {
          tti: entry.loadEventEnd - startTime,
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          tcp: entry.connectEnd - entry.connectStart,
          request: entry.responseStart - entry.requestStart,
          response: entry.responseEnd - entry.responseStart,
          dom: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          load: entry.loadEventEnd - entry.loadEventStart,
        }

        console.log('[Performance] Navigation Metrics:', metrics)

        // Enviar para analytics (opcional)
        if (window.gtag) {
          window.gtag('event', 'navigation_timing', {
            event_category: 'Performance',
            event_label: window.location.pathname,
            value: Math.round(metrics.tti)
          })
        }
      }
    }
  })

  navObserver.observe({ entryTypes: ['navigation'] })

  // Monitor Router Transitions (Next.js specific)
  if (typeof window !== 'undefined') {
    const originalPushState = history.pushState
    history.pushState = function(...args) {
      const url = args[2] as string
      performance.mark(`nav-start-${url}`)

      // Measure when navigation completes
      requestIdleCallback(() => {
        performance.mark(`nav-end-${url}`)
        performance.measure(
          `route-transition-${url}`,
          `nav-start-${url}`,
          `nav-end-${url}`
        )

        const measure = performance.getEntriesByName(`route-transition-${url}`)[0]
        console.log(`[Performance] Route transition to ${url}: ${measure.duration.toFixed(2)}ms`)
      })

      return originalPushState.apply(this, args)
    }
  }

  // Monitor Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('[Performance] LCP:', lastEntry.startTime.toFixed(2), 'ms')
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('[Performance] FID:', entry.processingStart - entry.startTime, 'ms')
      }
    })
    fidObserver.observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          console.log('[Performance] CLS:', clsValue.toFixed(4))
        }
      }
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }
}
```

#### Arquivo de Configuração: `apps/frontend-nextjs/instrumentation.ts`
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation (opcional)
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./instrumentation-client')
  }
}
```

#### Ganhos Esperados
- 📊 Métricas reais de performance em produção
- 🎯 Identificação de gargalos de navegação
- ⚡ Otimização baseada em dados
- 📈 Tracking de Core Web Vitals

---

## 📝 Testes de Performance

### Arquivo: `apps/frontend-nextjs/src/tests/performance/navigation-performance.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Navigation Performance - PR #264 Phase 2', () => {
  test('Home navigation should be instant (< 100ms)', async ({ page }) => {
    await page.goto('/')

    const startTime = Date.now()
    await page.click('a[href="/"]')
    await page.waitForLoadState('networkidle')
    const endTime = Date.now()

    const duration = endTime - startTime
    expect(duration).toBeLessThan(100)
  })

  test('Educational dropdown should prefetch routes', async ({ page }) => {
    await page.goto('/')

    // Hover sobre dropdown para trigger prefetch
    await page.hover('button:has-text("Educacional")')
    await page.waitForTimeout(500) // Dar tempo para prefetch

    // Verificar que link foi prefetched
    const prefetchedLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="prefetch"]')
      return Array.from(links).map(link => link.getAttribute('href'))
    })

    expect(prefetchedLinks.length).toBeGreaterThan(0)
  })

  test('Route transition should be < 500ms', async ({ page }) => {
    await page.goto('/')

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          resolve(entries[0])
        })
        observer.observe({ entryTypes: ['navigation'] })
      })
    })

    expect((metrics as any).duration).toBeLessThan(500)
  })

  test('LCP should be < 2.5s (good)', async ({ page }) => {
    await page.goto('/')

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        setTimeout(() => resolve(0), 5000)
      })
    })

    expect(lcp as number).toBeLessThan(2500)
  })
})
```

---

## 📊 Métricas de Sucesso - Fase 2

### Antes da Implementação
- LCP: ~3.5s (estimado)
- FID: ~150ms (estimado)
- CLS: ~0.15 (estimado)
- Route Transition: ~800ms (estimado)

### Após Implementação (Meta)
- LCP: < 2.5s ✅
- FID: < 100ms ✅
- CLS: < 0.1 ✅
- Route Transition: < 500ms ✅
- Prefetch Coverage: 100% das rotas críticas ✅

---

## 🗓️ Próximos Passos

1. ✅ Análise inicial concluída
2. ⏳ Implementar prefetch explícito em Links (30min)
3. ⏳ Implementar Metadata API no layout (45min)
4. ⏳ Implementar Performance monitoring (1h)
5. ⏳ Criar testes de performance (45min)
6. ⏳ Commit e push para HML
7. ⏳ Validar métricas em staging

**Estimativa total**: 3-4 horas de implementação

---

**Última atualização**: 2025-10-19 18:55
**Responsável**: Claude Code + Context7 Patterns
**Status**: Documento de implementação criado, pronto para execução
