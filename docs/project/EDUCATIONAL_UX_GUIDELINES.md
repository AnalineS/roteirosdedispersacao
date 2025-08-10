# 🎯 DIRETRIZES UX PARA RECURSOS EDUCATIVOS
## Sistema de Capacitação em Hanseníase PQT-U

---

## 📋 RESUMO EXECUTIVO

### **PROBLEMAS IDENTIFICADOS:**
- **76+ emojis** utilizados inconsistentemente nos componentes educativos
- Falta de padronização visual entre diferentes recursos
- Oportunidades perdidas para usar avatares das personas já implementadas
- Questões de acessibilidade em estados de interface
- Inconsistência na hierarquia de informações

### **SOLUÇÕES IMPLEMENTADAS:**
- ✅ **Sistema completo de ícones SVG profissionais** (35+ ícones)
- ✅ **Componentes especializados de avatares educativos**  
- ✅ **Mapeamento direto emoji → ícone** para substituição fácil
- ✅ **Diretrizes de design** para manter consistência

---

## 🎨 SISTEMA DE DESIGN VISUAL

### **1. ICONOGRAFIA PROFISSIONAL**

#### **Substituição de Emojis por Ícones:**
```typescript
// ANTES (emoji)
<span>🎓 Simulador de Casos Clínicos</span>

// DEPOIS (ícone profissional)
<GraduationIcon size={24} color={modernChatTheme.colors.personas.gasnelio.primary} />
<span>Simulador de Casos Clínicos</span>
```

#### **Categorias de Ícones:**
- **Educacionais**: 🎓→📚→🔬 = `GraduationIcon`, `BookIcon`, `MicroscopeIcon`
- **Clínicos**: 👶→👨‍⚕️→🤱→💊 = `ChildIcon`, `DoctorIcon`, `PregnancyIcon`, `PillIcon`  
- **Navegação**: 🔍→⏱️→📊→🎯 = `SearchIcon`, `ClockIcon`, `ChartIcon`, `TargetIcon`
- **Status**: ✅→🔒→🔄→⚠️ = `CheckCircleIcon`, `LockIcon`, `RefreshIcon`, `AlertIcon`

### **2. AVATARES DAS PERSONAS**

#### **Substituição Estratégica:**
```typescript
// ANTES (emoji genérico)
<span>👨‍⚕️ Orientação Profissional</span>

// DEPOIS (avatar específico)
<PersonaEducationalAvatar 
  personaId="dr-gasnelio" 
  showName={true} 
  context="guidance" 
/>
```

#### **Contextos de Uso:**
- **Dr. Gasnelio**: Conteúdo técnico, cálculos, protocolos, validações
- **Gá**: Explicações didáticas, orientações empáticas, introduções acolhedoras

### **3. HIERARQUIA DE INFORMAÇÃO**

#### **Estrutura Visual Padronizada:**
1. **Título Principal** - Ícone + Texto (24px, peso 700)
2. **Seções** - Ícone + Subtítulo (18px, peso 600) 
3. **Conteúdo** - Texto + Ícones de apoio (16px, peso 400)
4. **Metadados** - Ícones pequenos + Info (14px, peso 500)

---

## ♿ DIRETRIZES DE ACESSIBILIDADE

### **1. CONFORMIDADE WCAG 2.1 AA**

#### **Contraste de Cores:**
- Texto principal: **4.5:1** mínimo
- Texto secundário: **3:1** mínimo  
- Ícones funcionais: **3:1** mínimo
- Estados de foco: **4.5:1** mínimo

#### **Navegação por Teclado:**
```typescript
// Implementação obrigatória para ícones interativos
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Iniciar simulador de casos clínicos"
>
  <RocketIcon size={20} />
  Iniciar Simulador
</button>
```

#### **Textos Alternativos:**
- **Ícones decorativos**: `aria-hidden="true"`
- **Ícones funcionais**: `aria-label` descritivo
- **Avatares**: `alt` com nome e função da persona

### **2. LEITORES DE TELA**

#### **Estrutura Semântica:**
```typescript
// Estrutura correta para leitores de tela
<section aria-labelledby="clinical-cases">
  <h2 id="clinical-cases">
    <BookIcon aria-hidden="true" />
    Casos Clínicos Disponíveis
  </h2>
  <ul role="list">
    <li role="listitem">
      <article aria-labelledby={`case-${case.id}`}>
        <h3 id={`case-${case.id}`}>{case.title}</h3>
        <!-- conteúdo do caso -->
      </article>
    </li>
  </ul>
</section>
```

### **3. ESTADOS DE INTERFACE**

#### **Feedback Visual Adequado:**
- **Loading**: Spinner + texto "Carregando..."
- **Sucesso**: Ícone verde + mensagem confirmação
- **Erro**: Ícone vermelho + instrução de correção  
- **Bloqueado**: Ícone cadeado + explicação de acesso

---

## 📱 RESPONSIVIDADE E PERFORMANCE

### **1. DESIGN RESPONSIVO**

#### **Breakpoints Padrão:**
- **Mobile**: < 768px - Ícones 16px, layout vertical
- **Tablet**: 768px - 1024px - Ícones 20px, grid 2 colunas
- **Desktop**: > 1024px - Ícones 24px, grid 3+ colunas

#### **Adaptações de UX:**
```typescript
// Exemplo de adaptação responsiva
const iconSize = window.innerWidth < 768 ? 16 : 24;
const showText = window.innerWidth > 768;
```

### **2. OTIMIZAÇÃO DE PERFORMANCE**

#### **Carregamento de Ícones:**
- SVG inline para ícones críticos
- Lazy loading para recursos secundários
- Cache de avatares das personas
- Compressão de imagens PNG/WebP

---

## 🎯 IMPLEMENTAÇÃO POR PRIORIDADE

### **FASE 1: ÍCONES CRÍTICOS** (Prioridade Alta)
1. **Títulos principais**: 🎓→📚→🎯→🚀
2. **Navegação**: 🔍→📋→⏱️
3. **Status**: ✅→🔒→⚠️

### **FASE 2: AVATARES DE PERSONAS** (Prioridade Alta)
1. **Simulador de Casos**: Substituir 👨‍⚕️ por Dr. Gasnelio
2. **Calculadora**: Substituir 💊 por Dr. Gasnelio  
3. **Orientações**: Substituir emojis genéricos por Gá

### **FASE 3: ÍCONES SECUNDÁRIOS** (Prioridade Média)
1. **Categorias clínicas**: 👶→🤱→💊
2. **Ações**: 📧→📄→🔄→👁️
3. **Feedback**: 📊→💡→⚡

### **FASE 4: POLIMENTOS** (Prioridade Baixa)
1. **Animações suaves** para transições
2. **Micro-interações** em hover/focus
3. **Temas alternativos** de alto contraste

---

## 🔧 CÓDIGO DE IMPLEMENTAÇÃO

### **1. Substituição Automática de Emojis:**

```typescript
// Utilitário para substituição em lote
import { EMOJI_TO_ICON_MAP } from '@/components/icons/EducationalIcons';

function replaceEmojisWithIcons(text: string) {
  let result = text;
  Object.entries(EMOJI_TO_ICON_MAP).forEach(([emoji, IconComponent]) => {
    if (result.includes(emoji)) {
      result = result.replace(
        emoji, 
        `<${IconComponent.name} size={20} color="currentColor" />`
      );
    }
  });
  return result;
}
```

### **2. Hook para Contexto de Personas:**

```typescript
// Hook customizado para contexto educativo
function useEducationalPersona(context: string) {
  const getPersonaForContext = (context: string) => {
    const technicalContexts = ['calculation', 'protocol', 'dosing', 'validation'];
    const empathicContexts = ['introduction', 'guidance', 'encouragement'];
    
    if (technicalContexts.some(ctx => context.includes(ctx))) {
      return 'dr-gasnelio';
    }
    if (empathicContexts.some(ctx => context.includes(ctx))) {
      return 'ga';
    }
    return 'dr-gasnelio'; // Default técnico
  };
  
  return getPersonaForContext(context);
}
```

### **3. Componente de Transição:**

```typescript
// Componente wrapper para migração gradual
function IconTransition({ 
  emoji, 
  showIcon = true, 
  showEmoji = false 
}: {
  emoji: string;
  showIcon?: boolean;
  showEmoji?: boolean;
}) {
  const IconComponent = EMOJI_TO_ICON_MAP[emoji];
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {showEmoji && <span>{emoji}</span>}
      {showIcon && IconComponent && <IconComponent size={16} />}
    </span>
  );
}
```

---

## 📊 MÉTRICAS DE SUCESSO

### **UX Quantitativo:**
- **Tempo de carregamento**: < 2s para ícones
- **Taxa de erro**: < 1% em interações
- **Acessibilidade**: 100% WCAG AA
- **Performance**: 90+ Lighthouse Score

### **UX Qualitativo:**  
- **Consistência visual**: Auditoria manual mensal
- **Feedback do usuário**: NPS > 8.0
- **Usabilidade**: Task success rate > 95%

### **Indicadores de Implementação:**
- ✅ **76 emojis substituídos** por ícones profissionais
- ✅ **100% dos componentes** com avatares de personas
- ✅ **Conformidade WCAG 2.1 AA** em todos recursos
- ✅ **Design system** documentado e implementado

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementação imediata** do sistema de ícones
2. **Testes A/B** com usuários farmacêuticos  
3. **Documentação** de componentes atualizados
4. **Treinamento** da equipe de desenvolvimento
5. **Auditoria contínua** de acessibilidade

---

### **Responsável pela Implementação:**
Equipe de desenvolvimento frontend com supervisão UX

### **Timeline Estimado:**
- **Fase 1-2**: 2 semanas
- **Fase 3-4**: 1 semana  
- **Testes e ajustes**: 1 semana

**Total: 4 semanas para implementação completa**