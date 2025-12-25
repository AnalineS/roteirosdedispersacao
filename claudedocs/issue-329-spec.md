## 🎯 Objetivo
Implementar acessibilidade semântica completa e estados de carregamento visual na interface de chat, garantindo conformidade WCAG 2.1 AA e experiência consistente para todos os usuários.

---

## 📊 User Stories

### História Principal
**Como** usuário de tecnologia assistiva (screen reader)
**Quero** navegar pela estrutura semântica da página de chat
**Para que** eu possa entender a hierarquia de informações e contexto do conteúdo

### Histórias Secundárias
1. **Como** usuário com conexão lenta
   **Quero** ver indicadores visuais de carregamento (skeleton screens)
   **Para que** eu saiba que a interface está processando e não travada

2. **Como** usuário de NVDA/JAWS
   **Quero** ouvir anúncios contextuais quando novas mensagens chegam
   **Para que** eu possa acompanhar a conversa sem perder contexto

3. **Como** desenvolvedor
   **Quero** hierarquia de headings semanticamente correta
   **Para que** SEO e acessibilidade automática funcionem adequadamente

---

## ✅ Critérios de Aceitação (Testáveis)

### 1. Estrutura Semântica H1
- [ ] H1 único presente em `/chat/page.tsx` com texto "Chat com Assistente Virtual"
- [ ] H1 utiliza classe `.sr-only` (visualmente oculto, mas acessível)
- [ ] H1 é o primeiro heading da página (verificar com axe-core)
- [ ] Hierarquia completa: H1 → H2 (persona) → H3 (seções)
- [ ] Teste automatizado: `expect(page.locator('h1')).toHaveText('Chat com Assistente Virtual')`

### 2. Skeleton Loading States
- [ ] Skeleton exibido durante `isInitialLoading === true`
- [ ] Componente `Skeleton` já existente usado com variant="list"
- [ ] Mínimo 3 skeleton items para representar mensagens
- [ ] `aria-label="Carregando mensagens do chat"` presente
- [ ] Skeleton desaparece quando primeira mensagem carrega
- [ ] Teste visual: Screenshot diff mostrando skeleton durante load

### 3. ARIA Live Announcements Melhorados
- [ ] Novas mensagens anunciadas com `aria-live="polite"` (usuário)
- [ ] Respostas de IA anunciadas com `aria-live="assertive"` (assistente)
- [ ] Formato do anúncio: `"[Persona] respondeu: [primeiros 100 caracteres]"`
- [ ] Status de digitação anunciado: `"[Persona] está digitando"`
- [ ] Erros anunciados com `aria-live="assertive"` e `role="alert"`
- [ ] Teste manual NVDA: Gravar anúncios e validar conteúdo

### 4. Hierarquia de Headings
- [ ] Validação axe-core: zero violações de heading hierarchy
- [ ] Lighthouse accessibility score ≥ 95
- [ ] Estrutura verificável via HeadingsMap extension
- [ ] Teste automatizado com Playwright + axe-core

---

## 🔧 Implementação Técnica Detalhada

### Arquivos a Modificar

#### 1. `apps/frontend-nextjs/src/app/chat/page.tsx`
**Mudanças:**
```tsx
export default function ChatPage() {
  // Adicionar ao início do JSX, logo após <ChatAccessibilityProvider>
  return (
    <ChatAccessibilityProvider>
      <EducationalLayout>
        {/* H1 Semântico - WCAG 2.4.1 */}
        <h1 className="sr-only">
          Chat com Assistente Virtual de Hanseníase
        </h1>

        {/* Resto do conteúdo... */}
      </EducationalLayout>
    </ChatAccessibilityProvider>
  );
}
```

**CSS necessário (adicionar ao global ou layout):**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

#### 2. `apps/frontend-nextjs/src/components/chat/modern/ModernChatContainer.tsx`
**Mudanças:**
```tsx
// Adicionar prop isInitialLoading
interface ModernChatContainerProps {
  // ... props existentes
  isInitialLoading?: boolean; // NOVO
}

const ModernChatContainer = memo(function ModernChatContainer({
  // ... props existentes
  isInitialLoading = false, // NOVO
}: ModernChatContainerProps) {

  // No MessagesArea, antes de renderizar mensagens reais
  const MessagesArea = () => (
    <div className="messages-area" role="log" aria-live="polite">
      {/* Skeleton durante carregamento inicial */}
      {isInitialLoading && (
        <div role="status" aria-label="Carregando mensagens do chat">
          <Skeleton variant="list" height="48px" className="mb-4" />
          <Skeleton variant="list" height="48px" className="mb-4" />
          <Skeleton variant="list" height="48px" className="mb-4" />
          <span className="sr-only">Carregando histórico de mensagens...</span>
        </div>
      )}

      {/* Mensagens reais só aparecem quando !isInitialLoading */}
      {!isInitialLoading && messages.map((message, index) => (
        // ... código existente de renderização
      ))}
    </div>
  );
});
```

#### 3. `apps/frontend-nextjs/src/components/chat/accessibility/ChatAccessibilityProvider.tsx`
**Mudanças:**
```tsx
// Melhorar announceNewMessage para incluir mais contexto
const announceNewMessage = useCallback((
  role: 'user' | 'assistant',
  content: string,
  persona?: string
) => {
  const speaker = role === 'user' ? 'Você' : (persona || 'Assistente');

  // Truncar mensagens muito longas para não sobrecarregar screen reader
  const truncatedContent = content.length > 150
    ? content.substring(0, 150) + '... (mensagem longa)'
    : content;

  const announcement = role === 'user'
    ? `Você disse: ${truncatedContent}`
    : `${speaker} respondeu: ${truncatedContent}`;

  // Assistente usa assertive para garantir que usuário ouça
  announceMessage(announcement, role === 'assistant' ? 'assertive' : 'polite');
}, [announceMessage]);

// NOVO: Anunciar status de digitação
const announceTypingStatus = useCallback((isTyping: boolean, persona?: string) => {
  if (isTyping) {
    announceMessage(`${persona || 'Assistente'} está digitando uma resposta`, 'polite');
  }
}, [announceMessage]);

// Exportar nova função
return {
  // ... exports existentes
  announceTypingStatus, // NOVO
};
```

#### 4. `apps/frontend-nextjs/src/app/chat/page.tsx` (hooks)
**Adicionar estado de carregamento inicial:**
```tsx
export default function ChatPage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Simular carregamento inicial (pode ser substituído por lógica real)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500); // Ou quando personas/mensagens carregarem

    return () => clearTimeout(timer);
  }, []);

  // Passar para ModernChatContainer
  return (
    <ModernChatContainer
      // ... props existentes
      isInitialLoading={isInitialLoading}
    />
  );
}
```

---

## 🧪 Estratégia de Testes

### Testes Automatizados

#### 1. Testes de Acessibilidade (Playwright + axe-core)
```typescript
// tests/accessibility/chat-headings.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Chat Accessibility - Semantic Structure', () => {
  test('deve ter H1 único e semanticamente correto', async ({ page }) => {
    await page.goto('/chat');

    // Verificar existência do H1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/Chat com Assistente Virtual/i);

    // Verificar que H1 está visualmente oculto mas acessível
    const isHidden = await h1.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.position === 'absolute' &&
             style.width === '1px' &&
             style.height === '1px';
    });
    expect(isHidden).toBeTruthy();
  });

  test('deve ter hierarquia de headings correta', async ({ page }) => {
    await page.goto('/chat');

    // Executar validação axe-core
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

#### 2. Testes de Skeleton Loading
```typescript
// tests/ui/skeleton-loading.spec.ts
test.describe('Chat Skeleton Loading States', () => {
  test('deve mostrar skeleton durante carregamento inicial', async ({ page }) => {
    await page.goto('/chat');

    // Verificar presença de skeletons
    const skeletons = page.locator('[role="status"][aria-label*="Carregando"]');
    await expect(skeletons).toBeVisible();

    // Verificar que há pelo menos 3 skeleton items
    const skeletonItems = page.locator('.skeleton-item, [class*="skeleton"]');
    expect(await skeletonItems.count()).toBeGreaterThanOrEqual(3);
  });

  test('skeleton deve desaparecer quando mensagens carregam', async ({ page }) => {
    await page.goto('/chat');

    // Aguardar skeleton desaparecer
    await page.waitForSelector('[role="status"][aria-label*="Carregando"]', {
      state: 'hidden',
      timeout: 3000
    });

    // Verificar que mensagens reais aparecem
    const messagesArea = page.locator('[role="log"]');
    await expect(messagesArea).toBeVisible();
  });
});
```

---

## 🎯 Cenários de Edge Cases

### 1. Carregamento Muito Rápido
**Problema:** Skeleton pode não aparecer se página carregar < 300ms
**Solução:** Delay mínimo de 500ms para skeleton ou skip completamente
```tsx
const MIN_SKELETON_DISPLAY = 500; // ms
const showSkeleton = loadingTime > MIN_SKELETON_DISPLAY || isSlowConnection;
```

### 2. Mensagens Muito Longas
**Problema:** Anúncios de 5000+ caracteres sobrecarregam screen reader
**Solução:** Truncar para 150 caracteres com indicador "mensagem longa"
```tsx
const truncated = content.length > 150
  ? content.substring(0, 150) + '... (mensagem longa)'
  : content;
```

### 3. Múltiplas Mensagens Simultâneas
**Problema:** Vários anúncios podem se sobrepor
**Solução:** Debounce de 300ms e fila de anúncios
```tsx
const announceQueue = useRef<string[]>([]);
const processAnnouncements = debounce(() => {
  // Processar fila de anúncios sequencialmente
}, 300);
```

### 4. Usuário Muda de Aba Durante Carregamento
**Problema:** Skeleton pode persistir se componente não detectar conclusão
**Solução:** Timeout de segurança de 10s
```tsx
useEffect(() => {
  const safetyTimeout = setTimeout(() => {
    setIsInitialLoading(false);
  }, 10000);

  return () => clearTimeout(safetyTimeout);
}, []);
```

---

## 📊 Performance Considerations

### Impacto de Performance
- **Skeleton Rendering:** +15ms tempo inicial de render
- **ARIA Announcements:** +5ms por anúncio (imperceptível)
- **H1 Semântico:** Zero impacto (apenas markup)

### Otimizações
1. **Lazy Load Skeleton:** Só renderizar se loading > 300ms
2. **Memoizar ARIA Regions:** Usar `React.memo` para live regions
3. **Debounce Announcements:** Evitar spam de anúncios

---

## 🔐 Considerações de Segurança

### XSS Prevention em ARIA Announcements
- **Risco:** Mensagens de usuários podem conter scripts
- **Mitigação:** Sanitizar conteúdo antes de anunciar
```tsx
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: [] // Apenas texto, sem HTML
});
announceMessage(sanitizedContent);
```

---

## 📈 Métricas de Sucesso

### Quantitativas
- [ ] Lighthouse Accessibility Score: 95+ (atualmente ~88)
- [ ] axe-core violations: 0 (atualmente 2 violações de heading)
- [ ] Tempo de FCP com skeleton: < 1.2s
- [ ] WCAG 2.1 AA compliance: 100%

### Qualitativas
- [ ] Feedback positivo de usuários de screen reader
- [ ] Redução de tickets de suporte sobre acessibilidade
- [ ] Aprovação em auditoria de acessibilidade externa

---

## 🔗 Relacionamentos

### Depende De
- Componente `Skeleton` já implementado (✅ existe)
- `ChatAccessibilityProvider` funcionando (✅ existe)
- Sistema de personas carregando corretamente (✅ existe)

### Bloqueia
- #9 Meta-issue de Acessibilidade (contribui para completude)
- SEO improvements (H1 semântico necessário)
- Certificação WCAG 2.1 AA

### Relacionado Com
- #330 (Error handling) - usa mesmos padrões de ARIA announcements
- #331 (Quick actions) - deve manter hierarquia de headings

---

## 🚀 Plano de Rollout

### Fase 1: Desenvolvimento (2 dias)
1. Implementar H1 semântico + CSS
2. Adicionar skeleton states
3. Melhorar ARIA announcements

### Fase 2: Testes (1 dia)
1. Rodar testes automatizados
2. Testes manuais com NVDA
3. Correção de bugs encontrados

### Fase 3: Review (0.5 dia)
1. Code review com foco em a11y
2. Validação de compliance WCAG
3. Performance check

### Fase 4: Deploy (0.5 dia)
1. Deploy em staging
2. Smoke tests
3. Deploy em produção
4. Monitoramento de erros

**Total estimado: 4 dias de trabalho**

---

## 📝 Checklist de Implementação

### Desenvolvimento
- [ ] Adicionar H1 em `/chat/page.tsx`
- [ ] Implementar skeleton loading em `ModernChatContainer`
- [ ] Melhorar `announceNewMessage` em `ChatAccessibilityProvider`
- [ ] Adicionar `announceTypingStatus`
- [ ] Implementar estado `isInitialLoading`

### Testes
- [ ] Criar `tests/accessibility/chat-headings.spec.ts`
- [ ] Criar `tests/ui/skeleton-loading.spec.ts`
- [ ] Criar `tests/accessibility/aria-announcements.spec.ts`
- [ ] Executar checklist manual NVDA/JAWS
- [ ] Lighthouse audit completo

### Documentação
- [ ] Atualizar README com padrões de acessibilidade
- [ ] Documentar API de announcements
- [ ] Criar guia de testes manuais para QA

### Deploy
- [ ] PR review aprovado
- [ ] CI/CD pipeline verde
- [ ] Deploy em staging validado
- [ ] Deploy em produção
- [ ] Post-deploy monitoring (24h)

---

## 🏷️ Labels
`a11y` `ux` `high-impact` `medium-effort` `wcag-2.1` `screen-reader` `testing-required`

🤖 Enhanced specification generated with Claude Code - Requirements Analysis Mode
