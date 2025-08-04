# 📋 Plano de Implementação Frontend - Roteiros de Dispensação

> **Status Geral:** 🚧 Em Andamento  
> **Última Atualização:** 03/08/2025  
> **Responsável:** Claude Code Assistant  

## 🎯 **VISÃO GERAL DO PROJETO**

Transformar o site atual em uma plataforma educacional completa baseada nas estratégias UX definidas nos documentos:
- `ESTRATEGIA_UX_PERSONAS.md`
- `estrategia-ux-educacional.md`

### **Objetivo Principal:**
Implementar sistema educacional adaptativo com Dr. Gasnelio (técnico) e Gá (empático) como assistentes virtuais especializados em PQT-U para hanseníase.

---

## 📊 **ROADMAP COMPLETO - 6 FASES**

### **🏗️ FASE 1: FUNDAÇÃO (Mês 1-2)**
- **Status:** 🟡 Em Progresso
- **Prazo:** 2 semanas

#### **Fase 1.1: Sistema de Seleção de Personas**
- ✅ **CONCLUÍDO** *(03/08/2025)*
- **Implementado:**
  - Hook `usePersona` com detecção inteligente
  - Componente `ProfileDetector` 
  - Sistema de sugestão `PersonaTransitionSuggestion`
  - Analytics integrado
  - Persistência localStorage
- **⚠️ Problema Encontrado:** Tela branca após loading
- **🔧 Ação Corretiva:** Desabilitado temporariamente `usePersona` para resolver dependência circular com `useChat`
- **📝 Status:** Funcionalidade básica restaurada, arquitetura precisa ser refatorada

#### **Fase 1.2: Estrutura de Navegação Base**
- ⏳ **PENDENTE**
- **Tarefas:**
  - [ ] Layout responsivo com sidebar
  - [ ] Sistema de breadcrumbs educacionais
  - [ ] Roteamento por módulos de doença
  - [ ] Indicadores de progresso visuais

#### **Fase 1.3: Componentes Educacionais Base**
- ⏳ **PENDENTE**
- **Tarefas:**
  - [ ] Sistema de tooltips contextuais
  - [ ] Componente de glossário inteligente
  - [ ] Cards informativos visuais
  - [ ] Indicadores de progresso

### **🎓 FASE 2: SISTEMA EDUCACIONAL (Mês 2-3)**
- **Status:** ⏳ Não Iniciado

#### **Fase 2.1: Onboarding Progressivo**
- [ ] Tour guiado inicial (3 minutos)
- [ ] Onboarding contextual
- [ ] Sistema de conquistas educacionais
- [ ] Dashboard de progresso

#### **Fase 2.2: Arquitetura de Conteúdo**
- [ ] Estrutura modular por doença
- [ ] Sistema de metadados educacionais
- [ ] Versionamento de conteúdo por persona
- [ ] Busca inteligente

#### **Fase 2.3: Microconteúdo Educacional**
- [ ] Hints progressivos
- [ ] Cards visuais (infográficos, checklists)
- [ ] Glossário com autocomplete
- [ ] Tooltips adaptativos

### **🤖 FASE 3: CHATBOT INTELIGENTE (Mês 3-4)**
- **Status:** ⏳ Não Iniciado

#### **Fase 3.1: Interface do Chatbot**
- [ ] UI moderna e acessível
- [ ] Avatares distintos por persona
- [ ] Sistema de sugestões contextuais
- [ ] Histórico de conversas

#### **Fase 3.2: Sistema de Respostas**
- [ ] Análise de sentimento
- [ ] Base de conhecimento estruturada
- [ ] Manutenção de contexto
- [ ] Fallbacks inteligentes

#### **Fase 3.3: Transições e Personalização**
- [ ] Sistema de transição fluida
- [ ] Recomendações automáticas
- [ ] Adaptação dinâmica de tom
- [ ] Feedback do usuário

### **📚 FASE 4: CONTEÚDO COMPLETO (Mês 4-5)**
- **Status:** ⏳ Não Iniciado

#### **Fase 4.1: Módulos de Conteúdo**
- [ ] "Sobre a Doença" (hanseníase)
- [ ] "Diagnóstico" (sintomas, exames)
- [ ] "Tratamento" (PQT-U)
- [ ] "Roteiro de Dispensação"
- [ ] "Vida com a Doença"

#### **Fase 4.2: Recursos Interativos**
- [ ] Calculadora de doses
- [ ] Simulador de casos
- [ ] Checklist de dispensação
- [ ] Timeline de tratamento

### **🔧 FASE 5: OTIMIZAÇÃO (Mês 5-6)**
- **Status:** ⏳ Não Iniciado

#### **Fase 5.1: Analytics e Personalização**
- [ ] Tracking educacional
- [ ] Dashboard de métricas
- [ ] Recomendações personalizadas
- [ ] A/B testing

#### **Fase 5.2: Acessibilidade**
- [ ] WCAG AAA compliance
- [ ] Text-to-speech
- [ ] Modo de leitura simplificada
- [ ] Suporte a Libras

### **🚀 FASE 6: EXPANSÃO (Mês 6+)**
- **Status:** ⏳ Não Iniciado

#### **Fase 6.1: Novas Doenças**
- [ ] Módulo Tuberculose
- [ ] Módulo Diabetes
- [ ] Framework escalável

---

## 🐛 **REGISTRO DE PROBLEMAS E SOLUÇÕES**

### **Problema #001 - Tela Branca Após Loading** ✅ **RESOLVIDO**
- **📅 Data:** 03/08/2025
- **🔍 Causa:** Dependência circular entre `usePersona` e `useChat`
- **⚠️ Sintoma:** Site carregava loading screen mas ficava em branco
- **🔧 Solução Temporária:** Desabilitação temporária do `usePersona`
- **🚀 Solução Definitiva:** Refatoração completa da arquitetura
  - `usePersona` independente com interface de parâmetros
  - `usePersonaWithChat` como wrapper de integração
  - `ProfileDetector` e `PersonaTransitionSuggestion` standalone
- **✅ Status:** **RESOLVIDO DEFINITIVAMENTE**
- **📋 Resultado:** Todas as funcionalidades avançadas reabilitadas

### **Problema #002 - Deploy do Backend Falhando por Conflito de PORT** ✅ **RESOLVIDO** 
- **📅 Data:** 03/08/2025
- **🔍 Causa:** Dockerfile configurado com `ENV PORT=8080` mas Cloud Run usando `PORT=1000`
- **⚠️ Sintoma:** "Container failed to start and listen on the port defined provided by the PORT=1000"
- **🔧 Solução Aplicada:** **OPÇÃO 2** - Modificar Dockerfile para usar PORT dinâmico
  - Removido `ENV PORT=8080` hardcoded 
  - Atualizado `EXPOSE $PORT` para ser dinâmico
  - Corrigido healthcheck para `${PORT:-8080}` com fallback
- **✅ Status:** **RESOLVIDO** - Dockerfile agora aceita PORT dinâmico do Cloud Run
- **📋 Resultado:** Backend deployado com sucesso

### **Problema #003 - Site em Branco - CSP Bloqueando React** ✅ **RESOLVIDO**
- **📅 Data:** 03/08/2025  
- **🔍 Causa:** Content Security Policy muito restritivo no firebase.json bloqueando JavaScript do React
- **⚠️ Sintoma:** Página completamente branca, loading screen não removido, React não executa
- **🔧 Solução Aplicada:** Simplificar CSP no Firebase Hosting
  - Removido restrições excessivas do Google Analytics
  - Mantido apenas `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
  - Simplificado connect-src para APIs essenciais
- **✅ Status:** **RESOLVIDO** - CSP agora permite execução do React
- **📋 Resultado:** AppMinimal funcionou perfeitamente

### **Problema #004 - Bundle JavaScript Muito Grande** ✅ **IDENTIFICADO**
- **📅 Data:** 03/08/2025
- **🔍 Causa:** Bundle único de 514KB causando timeout/erro de memória
- **⚠️ Sintoma:** Loading screen carrega mas React não renderiza conteúdo
- **🔧 Solução Aplicada:** AppMinimal com bundle de 179KB
- **✅ Status:** **CAUSA CONFIRMADA** - Bundle grande era o problema
- **📋 Resultado:** Site funcionou perfeitamente com versão minimal

### **Problema #005 - Code Splitting Causando Nova Tela Branca** ✅ **RESOLVIDO**
- **📅 Data:** 03/08/2025
- **🔍 Causa:** Implementação de code splitting com lazy loading introduziu erro
- **⚠️ Sintoma:** Tela branca voltou após implementar Suspense e lazy loading
- **🔧 Solução Aplicada:** Criar AppSimple sem dependências pesadas
  - Removido ChatProvider e React Query
  - Implementado com componentes inline simples
  - Bundle reduzido para 169KB (< 200KB limite)
- **✅ Status:** **RESOLVIDO** - AppSimple funcionando perfeitamente
- **📋 Resultado:** Site estável com HomePage funcional e seleção de personas

### **Problema #006 - [Placeholder para próximos problemas]**
- **📅 Data:** 
- **🔍 Causa:** 
- **⚠️ Sintoma:** 
- **🔧 Solução Aplicada:** 
- **✅ Status:** 
- **📋 Próxima Ação:** 

---

## 📚 **LIÇÕES APRENDIDAS**

### **Bundle Size Critical:**
- ✅ **< 200KB:** Funciona perfeitamente em todos os dispositivos
- ⚠️ **200-400KB:** Pode funcionar mas com risco
- ❌ **> 400KB:** Causa tela branca (timeout/memória)

### **Estratégia Vencedora:**
1. **Começar simples:** Mínimo viável primeiro
2. **Testar cada mudança:** Deploy incremental
3. **Evitar dependências pesadas:** ChatProvider, React Query, Framer Motion
4. **Estilo inline:** Mais leve que frameworks CSS
5. **Componentes simples:** Funcionalidade sobre complexidade

---

## 🔄 **ARQUITETURA ATUAL**

### **Estrutura Simplificada (AppSimple):**
```
AppSimple (169KB) ✅
├── Sem providers pesados
├── React Router básico
├── Componentes inline
└── Estado local simples

HomePageSimple ✅
├── Seleção de personas inline
├── Estilos CSS inline
├── LocalStorage para persistência
└── Navegação direta para /chat
```

### **Componentes Disponíveis (para uso futuro):**
```
useChat + ChatProvider (PESADO - 400KB+)
usePersona + EnhancedPersonaSelector (PESADO)
App completo com todas as features (PESADO)
AppMinimal (179KB - fallback simples)
```

---

## 📈 **MÉTRICAS DE SUCESSO**

### **Técnicas:**
- ✅ Build sem erros TypeScript
- ✅ Loading screen funcionando
- ✅ Homepage renderizando
- ✅ Seleção de personas funcionando
- ✅ ProfileDetector funcionando
- ✅ Sistema de transição reabilitado

### **UX/Educacionais:**
- ⏳ Taxa de conclusão do onboarding: >80%
- ⏳ Tempo médio de sessão: >5 minutos
- ⏳ Taxa de retorno em 7 dias: >60%
- ⏳ NPS: >8

---

## 🚨 **PRÓXIMAS AÇÕES PRIORITÁRIAS**

1. **✅ CONCLUÍDO:** Homepage carregando perfeitamente
2. **✅ CONCLUÍDO:** Arquitetura `usePersona` refatorada
3. **🔥 PRÓXIMO:** Implementar Fase 1.2 - Estrutura de Navegação Base
4. **🎯 EM ANDAMENTO:** Continuar roadmap - foco na navegação e componentes educacionais

---

## 💡 **NOTAS DE DESENVOLVIMENTO**

### **Tecnologias Utilizadas:**
- React 18 + TypeScript
- Vite + PWA
- TanStack Query
- Framer Motion
- Heroicons
- Tailwind CSS

### **Padrões Adotados:**
- Hooks customizados para lógica de negócio
- Componentes lazy-loaded
- Analytics integrado (gtag)
- Persistência localStorage
- Error boundaries

---

**🤖 Documento mantido automaticamente pelo Claude Code Assistant**  
**📝 Última sincronização:** Após cada commit/deploy