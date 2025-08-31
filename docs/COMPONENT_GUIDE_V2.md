# 📚 Component Guide v2.0 - Fase 2 Components
**Atualizado**: 24 de Agosto de 2024  
**Versão**: 2.0.0  

## 🗺️ Navegação e Layout

### EducationalBreadcrumbs
**Localização**: `src/components/navigation/Breadcrumbs/index.tsx`

Sistema de navegação hierárquica inteligente com suporte completo a acessibilidade.

```tsx
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';

// Uso automático no EducationalLayout
<EducationalLayout showBreadcrumbs={true}>
  {children}
</EducationalLayout>
```

**Características**:
- [OK] 29+ páginas mapeadas com hierarquia
- [OK] Mobile responsive com ellipsis
- [OK] WCAG 2.1 AA compliant
- [OK] CSS variables integration

**Props**: Nenhuma (auto-detecta via usePathname)

### ContextualBreadcrumbs
**Localização**: `src/components/navigation/Breadcrumbs/ContextualBreadcrumbs.tsx`

Informações educacionais contextuais baseadas na página atual.

```tsx
// Uso interno no EducationalBreadcrumbs
<ContextualBreadcrumbs 
  currentPath="/modules/hanseniase"
  breadcrumbs={breadcrumbChain}
/>
```

**Características**:
- [TARGET] Objetivos de aprendizagem
- [LIST] Pré-requisitos
- 💡 Dicas práticas
- ➡️ Próximas etapas

---

## 💬 Chat e Comunicação

### ImprovedPersonaSwitch
**Localização**: `src/components/chat/modern/ImprovedPersonaSwitch.tsx`

Interface moderna para seleção e troca de personas com busca avançada.

```tsx
import ImprovedPersonaSwitch from '@/components/chat/modern/ImprovedPersonaSwitch';

<ImprovedPersonaSwitch
  personas={personas}
  selectedPersona={selectedPersona}
  onPersonaChange={handlePersonaChange}
  disabled={false}
  showTransitionEffect={true}
  currentMessageCount={messages.length}
/>
```

**Props**:
- `personas`: Record<string, Persona> - Objeto com todas as personas
- `selectedPersona`: string | null - ID da persona selecionada
- `onPersonaChange`: (personaId: string) => void - Callback para troca
- `disabled?`: boolean - Desabilita interação
- `showTransitionEffect?`: boolean - Habilita animações
- `currentMessageCount?`: number - Contador de mensagens

**Características**:
- [SEARCH] Busca por nome, personalidade e especialidades
- ⚡ Transições suaves e animações
- 🎭 Especialidades visíveis para cada persona
- ♿ Navegação por teclado completa

---

## 🔔 Feedback e Notificações

### ImprovedFeedbackSystem
**Localização**: `src/components/ui/ImprovedFeedbackSystem.tsx`

Sistema abrangente de feedback visual com múltiplos tipos de notificação.

```tsx
import { 
  ImprovedFeedbackProvider, 
  useImprovedFeedback 
} from '@/components/ui/ImprovedFeedbackSystem';

// 1. Provider no root da aplicação
<ImprovedFeedbackProvider>
  <App />
</ImprovedFeedbackProvider>

// 2. Hook em componentes
const MyComponent = () => {
  const { showNotification, showToast } = useImprovedFeedback();
  
  const handleSuccess = () => {
    showNotification('success', 'Operação realizada com sucesso!');
  };
  
  const handleError = () => {
    showToast('error', 'Erro ao processar solicitação', {
      position: 'top-right',
      duration: 5000
    });
  };
  
  return (
    <button onClick={handleSuccess}>
      Executar Ação
    </button>
  );
};
```

**Tipos de Notificação**:
- `success` - Operações bem-sucedidas
- `error` - Erros e falhas  
- `warning` - Avisos importantes
- `info` - Informações gerais
- `loading` - Estados de carregamento
- `thinking` - IA processando
- `typing` - IA digitando resposta

**Configurações Toast**:
```tsx
interface ToastOptions {
  position?: 'top-left' | 'top-center' | 'top-right' | 
           'bottom-left' | 'bottom-center' | 'bottom-right';
  duration?: number; // milissegundos
  showProgress?: boolean;
  isPersistent?: boolean;
  onClose?: () => void;
  customClassName?: string;
}
```

**Características**:
- 📱 Mobile responsive
- ♿ Screen reader announcements
- 🎨 Consistent design system
- ⚡ Performance optimized

---

## [NOTE] Formulários e Inputs

### OptimizedForm
**Localização**: `src/components/forms/OptimizedForm.tsx`

Sistema de formulário avançado com validação em tempo real e auto-save.

```tsx
import OptimizedForm from '@/components/forms/OptimizedForm';

const MyFormComponent = () => {
  const handleSubmit = async (data: any) => {
    console.log('Form submitted:', data);
  };

  const handleAutoSave = (data: any) => {
    console.log('Auto-saving:', data);
  };

  return (
    <OptimizedForm
      initialValues={{
        name: '',
        email: '',
        message: ''
      }}
      onSubmit={handleSubmit}
      onAutoSave={handleAutoSave}
      enableAutoSave={true}
      autoSaveDelay={2000}
      showProgress={true}
      enableErrorSummary={true}
      layout="vertical"
      fields={[
        {
          name: 'name',
          type: 'text',
          label: 'Nome Completo',
          required: true,
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          name: 'email',
          type: 'email',
          label: 'E-mail',
          required: true,
          validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          }
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Mensagem',
          placeholder: 'Escreva sua mensagem...',
          validation: {
            minLength: 10,
            maxLength: 1000
          }
        }
      ]}
    />
  );
};
```

**Props Principais**:
- `initialValues`: object - Valores iniciais do formulário
- `onSubmit`: (data: any) => Promise<void> - Callback de submit
- `onAutoSave?`: (data: any) => void - Callback de auto-save
- `enableAutoSave?`: boolean - Habilita auto-save
- `autoSaveDelay?`: number - Delay do auto-save (ms)
- `showProgress?`: boolean - Mostra barra de progresso
- `enableErrorSummary?`: boolean - Resumo de erros no topo
- `layout?`: 'vertical' | 'horizontal' | 'inline' - Layout do form

**Tipos de Campo Suportados**:
```tsx
interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 
        'checkbox' | 'radio' | 'number' | 'tel' | 'url';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
  options?: Array<{value: string; label: string}>; // para select/radio
  searchable?: boolean; // para select
  multiple?: boolean; // para select
}
```

**Estados do Form**:
- `isValid`: boolean - Form é válido
- `isDirty`: boolean - Form foi modificado
- `isSubmitting`: boolean - Submit em progresso
- `progress`: number - Progresso de preenchimento (0-100)
- `errors`: object - Erros de validação

**Características**:
- ⚡ Validação em tempo real
- [SAVE] Auto-save inteligente
- [REPORT] Progress tracking visual
- ♿ Acessibilidade completa
- 📱 Layouts responsivos
- 🎨 Design system integration

---

## 🎨 Design System Integration

### CSS Variables Usage
Todos os componentes utilizam o sistema unificado de CSS variables:

```css
/* Cores */
--color-primary-50 to --color-primary-900
--color-success-50 to --color-success-900  
--color-warning-50 to --color-warning-900
--color-danger-50 to --color-danger-900

/* Espaçamento */
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem  
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
--spacing-2xl: 3rem

/* Tipografia */
--font-size-xs: 0.75rem
--font-size-sm: 0.875rem
--font-size-base: 1rem
--font-size-lg: 1.125rem
--font-size-xl: 1.25rem

/* Bordas */
--radius-sm: 0.25rem
--radius-md: 0.375rem  
--radius-lg: 0.5rem
--radius-xl: 0.75rem

/* Sombras */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

### Theme Support
Suporte automático para modo escuro através de CSS variables dinâmicas:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;  
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
  }
}
```

---

## ♿ Acessibilidade

### WCAG 2.1 AA Compliance
Todos os componentes implementam:

```tsx
// Exemplo de padrões de acessibilidade
<button
  aria-label="Trocar para Dr. Gasnelio"
  aria-describedby="persona-description"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handlePersonaChange('dr_gasnelio');
    }
  }}
>
  Dr. Gasnelio
</button>

<div 
  id="persona-description"
  role="region"
  aria-live="polite"
>
  Especialista técnico em protocolos PQT-U
</div>
```

### Screen Reader Support
- `aria-live` regions para mudanças dinâmicas
- `role` attributes apropriados
- Labels descritivos e contextuais
- Skip links para navegação rápida

### Keyboard Navigation
- Tab order lógico
- Focus trap em modais
- Escape key handling
- Enter/Space activation

---

## 📱 Mobile Optimization

### Responsive Patterns
```tsx
// Breakpoints padrão
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');

// Renderização condicional
{isMobile ? (
  <MobileComponent />
) : (
  <DesktopComponent />
)}
```

### Touch Interactions
- Minimum touch target: 44px x 44px
- Swipe gestures para navegação
- Pull-to-refresh onde apropriado
- Touch feedback visual

---

## [FIX] Development Guidelines

### Component Structure
```tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ComponentProps } from './types';

interface MyComponentProps extends ComponentProps {
  // Props específicas
}

const MyComponent = ({ 
  prop1, 
  prop2, 
  ...otherProps 
}: MyComponentProps) => {
  // Estado local
  const [state, setState] = useState();
  
  // Memoized values
  const memoizedValue = useMemo(() => {
    return computeValue(prop1);
  }, [prop1]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div className="component-wrapper" {...otherProps}>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### Testing Patterns
```tsx
// Component.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop1="test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const mockFn = jest.fn();
    
    render(<MyComponent onAction={mockFn} />);
    await user.click(screen.getByRole('button'));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

---

## [REPORT] Performance Considerations

### Optimization Strategies
- React.memo para componentes puros
- useMemo para cálculos custosos
- useCallback para funções estáveis
- Lazy loading para componentes pesados

### Bundle Impact
- EducationalBreadcrumbs: ~8KB
- ImprovedPersonaSwitch: ~12KB  
- ImprovedFeedbackSystem: ~10KB
- OptimizedForm: ~15KB
- **Total Phase 2**: ~45KB (comprimido)

---

## 🔄 Migration Guide

### From v1.x to v2.0

#### Breadcrumbs
```tsx
// v1.x (deprecated)
import Breadcrumbs from '@/components/Breadcrumbs';

// v2.0 (new)
import EducationalBreadcrumbs from '@/components/navigation/Breadcrumbs';

// Uso automático no EducationalLayout - sem mudanças necessárias
```

#### Feedback System  
```tsx
// v1.x (deprecated)
import { showAlert } from '@/utils/alerts';

// v2.0 (new)
import { useImprovedFeedback } from '@/components/ui/ImprovedFeedbackSystem';
const { showNotification } = useImprovedFeedback();
```

### Breaking Changes
- Componentes antigos de breadcrumb removidos
- Sistema de alerta legado deprecated
- CSS classes antigas podem estar inconsistentes

### Migration Steps
1. Update imports para novos componentes
2. Wrap app com ImprovedFeedbackProvider
3. Replace alert calls com useImprovedFeedback
4. Test functionality em staging environment

---

**[START] Ready for Production!**

*Este guia de componentes documenta todas as melhorias da Fase 2. Cada componente foi testado e aprovado para uso em produção com score de qualidade 8.78/10.*