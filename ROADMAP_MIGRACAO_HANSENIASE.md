# 🚀 ROADMAP DE MIGRAÇÃO - Roteiro de Dispensação Hanseníase
## Migração Flask/PythonAnywhere → Google Workspace + Node.js + Astra DB

---

### 📋 **INFORMAÇÕES DO PROJETO**

**Status**: 🔴 Em Planejamento  
**Duração Estimada**: 8 semanas (4 épicos de 2 semanas cada)  
**Prioridade**: 🔥 CRÍTICA - Sistema atual com problemas de hospedagem  
**Responsável**: Product Manager Senior  
**Data de Início**: 31/01/2025  
**Data de Entrega**: 28/03/2025  

---

## 🎯 **OBJETIVOS ESTRATÉGICOS**

### 🥇 **Objetivo Principal**
Migrar sistema completo mantendo 100% das funcionalidades atuais, especialmente o core chatbot com personas Dr. Gasnelio e Gá.

### 🎯 **Objetivos Específicos**
- ✅ Resolver problemas de hospedagem definitivamente
- 🚀 Melhorar performance e escalabilidade  
- 💰 Reduzir custos operacionais a longo prazo
- 🔧 Facilitar manutenção e atualizações
- 📊 Implementar analytics avançados

---

## 🏗️ **ARQUITETURA ALVO**

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Frontend React    │    │  Google Apps Script  │    │      AstraDB        │
│  (roteirodispensa   │◄──►│     (Backend API)    │◄──►│   (Database Chat)   │
│   cao.com.br)       │    │                      │    │                     │
│ • UI existente 100% │    │ • APIs REST          │    │ • Histórico chat    │
│ • Componentes       │    │ • Personas completas │    │ • Busca vetorial    │
│ • Roteamento        │    │ • Rate limiting      │    │ • Analytics         │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │   Google Sheets      │
                           │   (Admin Config)     │
                           │ • Base conhecimento  │
                           │ • Configurações      │
                           │ • Personas settings  │
                           └──────────────────────┘
```

---

# 📊 **ÉPICOS E SPRINTS**

## 🔥 **ÉPICO 1: PREPARAÇÃO E SETUP**
**📅 Sprint 1-2 (31/01 - 13/02)**

### **🎯 Meta do Épico**
Preparar ambiente, configurar infraestrutura base e validar integrações principais.

### **📋 Sprint 1: Análise e Setup Base (31/01 - 06/02)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-001**: Auditoria completa do sistema atual
  - **Critério de Aceitação**: Documentação completa de todas as funcionalidades
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: Nenhuma
  - **Responsável**: Tech Lead
  - **Validação**: ✅ Checklist de 50+ funcionalidades mapeadas

- [ ] **TASK-002**: Setup Google Cloud Project + Apps Script
  - **Critério de Aceitação**: Projeto ativo com APIs habilitadas
  - **Tempo Estimado**: 4h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-001
  - **Validação**: ✅ Hello World rodando em Apps Script

- [ ] **TASK-003**: Configurar AstraDB para produção
  - **Critério de Aceitação**: Database criado com schemas definidos
  - **Tempo Estimado**: 6h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: Nenhuma
  - **Validação**: ✅ Conexão funcionando + CRUD básico

- [ ] **TASK-004**: Adquirir domínio personalizado
  - **Critério de Aceitação**: roteirodedispensacao.com.br registrado
  - **Tempo Estimado**: 2h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: Nenhuma
  - **Validação**: ✅ DNS configurado corretamente

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 1**
- ✅ Ambiente Google Cloud 100% funcional
- ✅ AstraDB conectado e testado
- ✅ Domínio registrado e DNS configurado
- ✅ Documentação técnica da migração criada

---

### **📋 Sprint 2: Base de Conhecimento e Personas (07/02 - 13/02)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-005**: Migrar base de conhecimento estruturada
  - **Critério de Aceitação**: Todos os JSONs migrados para Google Sheets
  - **Tempo Estimado**: 12h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-002
  - **Validação**: ✅ 8 arquivos JSON convertidos + acessíveis via API

- [ ] **TASK-006**: Recriar sistema de personas
  - **Critério de Aceitação**: Dr. Gasnelio e Gá funcionando identicamente
  - **Tempo Estimado**: 16h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-005
  - **Validação**: ✅ Respostas idênticas ao sistema atual (teste A/B)

- [ ] **TASK-007**: Implementar rate limiting e segurança
  - **Critério de Aceitação**: Sistema seguro contra abuso
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-002
  - **Validação**: ✅ Testes de carga aprovados (100 req/min)

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 2**
- ✅ Base de conhecimento 100% migrada
- ✅ Personas funcionando identicamente ao sistema atual
- ✅ Segurança implementada e testada
- ✅ APIs básicas funcionando

**🎯 CRITÉRIO DE SUCESSO DO ÉPICO 1**: Sistema base funcionando com pelo menos 1 persona operacional

---

## 🤖 **ÉPICO 2: MIGRAÇÃO DO CORE (MVP CHATBOT)**
**📅 Sprint 3-4 (14/02 - 27/02)**

### **🎯 Meta do Épico**
Migrar completamente o chatbot core com ambas personas, mantendo 100% da funcionalidade atual.

### **📋 Sprint 3: Backend Core Migration (14/02 - 20/02)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-008**: Migrar lógica do Dr. Gasnelio
  - **Critério de Aceitação**: Respostas técnicas idênticas ao Flask
  - **Tempo Estimado**: 20h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-006
  - **Validação**: ✅ 100 perguntas teste com >95% similaridade

- [ ] **TASK-009**: Migrar lógica do Gá (persona empática)
  - **Critério de Aceitação**: Respostas empáticas mantidas
  - **Tempo Estimado**: 20h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-006
  - **Validação**: ✅ Score de empatia mantido (>60%)

- [ ] **TASK-010**: Implementar sistema RAG (Retrieval-Augmented Generation)
  - **Critério de Aceitação**: Busca contextual funcionando
  - **Tempo Estimado**: 16h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-005
  - **Validação**: ✅ Respostas contextuais relevantes (>80% precisão)

- [ ] **TASK-011**: Sistema de cache inteligente
  - **Critério de Aceitação**: Performance <200ms para perguntas comuns
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: TASK-010
  - **Validação**: ✅ Hit rate >70%

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 3**
- ✅ Dr. Gasnelio 100% migrado e testado
- ✅ Gá 100% migrado e testado
- ✅ Sistema RAG operacional
- ✅ Performance dentro do SLA (<500ms)

---

### **📋 Sprint 4: Integração e Testes Core (21/02 - 27/02)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-012**: Integração completa Apps Script ↔ AstraDB
  - **Critério de Aceitação**: Histórico de conversas salvo corretamente
  - **Tempo Estimado**: 12h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-003, TASK-010
  - **Validação**: ✅ 1000 conversas salvas sem perda de dados

- [ ] **TASK-013**: Sistema de monitoramento e logs
  - **Critério de Aceitação**: Visibilidade completa das operações
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-012
  - **Validação**: ✅ Dashboard de métricas funcionando

- [ ] **TASK-014**: Testes automatizados de regressão
  - **Critério de Aceitação**: Suite de testes com >90% cobertura
  - **Tempo Estimado**: 16h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-012
  - **Validação**: ✅ 200+ testes passando

- [ ] **TASK-015**: Testes de carga e performance
  - **Critério de Aceitação**: Sistema aguenta 100 usuários simultâneos
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: TASK-014
  - **Validação**: ✅ Load test aprovado sem degradação

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 4**
- ✅ Integração backend-database 100% estável
- ✅ Monitoramento implementado
- ✅ Testes automatizados rodando
- ✅ Performance validada sob carga

**🎯 CRITÉRIO DE SUCESSO DO ÉPICO 2**: Chatbot completamente funcional no novo ambiente

---

## 🎨 **ÉPICO 3: MIGRAÇÃO COMPLETA FRONTEND**
**📅 Sprint 5-6 (28/02 - 13/03)**

### **🎯 Meta do Épico**
Migrar frontend React para integrar com nova arquitetura, mantendo UX idêntica.

### **📋 Sprint 5: Adaptação Frontend (28/02 - 06/03)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-016**: Atualizar camada de API (services/api.ts)
  - **Critério de Aceitação**: Frontend conecta com Apps Script
  - **Tempo Estimado**: 12h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-012
  - **Validação**: ✅ Todas as chamadas de API funcionando

- [ ] **TASK-017**: Atualizar componentes de chat
  - **Critério de Aceitação**: Interface idêntica, funcionalidade melhorada
  - **Tempo Estimado**: 16h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-016
  - **Validação**: ✅ UX tests passando

- [ ] **TASK-018**: Implementar funcionalidades offline/PWA
  - **Critério de Aceitação**: App funciona offline com cache inteligente
  - **Tempo Estimado**: 12h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-017
  - **Validação**: ✅ App funciona sem internet por 24h

- [ ] **TASK-019**: Sistema de analytics do usuário
  - **Critério de Aceitação**: Métricas de uso capturadas
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: TASK-016
  - **Validação**: ✅ Dashboard com dados reais

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 5**
- ✅ Frontend conectado ao novo backend
- ✅ Todas as telas funcionando
- ✅ PWA implementado
- ✅ Analytics coletando dados

---

### **📋 Sprint 6: Otimização e UX (07/03 - 13/03)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-020**: Otimização de performance frontend
  - **Critério de Aceitação**: Lighthouse Score >90
  - **Tempo Estimado**: 12h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-017
  - **Validação**: ✅ Core Web Vitals no verde

- [ ] **TASK-021**: Implementar feedback system
  - **Critério de Aceitação**: Usuários podem avaliar respostas
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: TASK-017
  - **Validação**: ✅ Sistema de rating funcionando

- [ ] **TASK-022**: Testes de acessibilidade (WCAG 2.1)
  - **Critério de Aceitação**: Conformidade AA
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: TASK-020
  - **Validação**: ✅ Auditoria de acessibilidade aprovada

- [ ] **TASK-023**: Configurar CDN e SSL
  - **Critério de Aceitação**: Site rápido globalmente com HTTPS
  - **Tempo Estimado**: 4h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-004
  - **Validação**: ✅ SSL A+ rating, CDN ativo

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 6**
- ✅ Performance otimizada (Lighthouse >90)
- ✅ Acessibilidade WCAG 2.1 AA
- ✅ CDN e SSL configurados
- ✅ Sistema de feedback ativo

**🎯 CRITÉRIO DE SUCESSO DO ÉPICO 3**: Frontend completo rodando em produção

---

## 🚀 **ÉPICO 4: VALIDAÇÃO E DEPLOY**
**📅 Sprint 7-8 (14/03 - 28/03)**

### **🎯 Meta do Épico**
Validar sistema completo, deploy em produção e transição suave dos usuários.

### **📋 Sprint 7: Testes Finais e Ajustes (14/03 - 20/03)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-024**: Testes end-to-end completos
  - **Critério de Aceitação**: 100% dos fluxos de usuário funcionando
  - **Tempo Estimado**: 16h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-020
  - **Validação**: ✅ 50+ cenários de teste aprovados

- [ ] **TASK-025**: Testes com usuários beta
  - **Critério de Aceitação**: Feedback positivo >85%
  - **Tempo Estimado**: 20h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-024
  - **Validação**: ✅ 10 usuários testaram por 3 dias

- [ ] **TASK-026**: Ajustes baseados no feedback
  - **Critério de Aceitação**: Todos os bugs críticos corrigidos
  - **Tempo Estimado**: 16h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-025
  - **Validação**: ✅ Zero bugs críticos em aberto

- [ ] **TASK-027**: Documentação final do sistema
  - **Critério de Aceitação**: Guias completos para usuários e administradores
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-026
  - **Validação**: ✅ Wiki completo publicado

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 7**
- ✅ Sistema 100% testado e validado
- ✅ Usuários beta satisfeitos
- ✅ Todos os bugs críticos corrigidos
- ✅ Documentação completa

---

### **📋 Sprint 8: Deploy e Go-Live (21/03 - 28/03)**

#### ✅ **TAREFAS CRÍTICAS**

- [ ] **TASK-028**: Deploy de produção
  - **Critério de Aceitação**: Sistema live em roteirodedispensacao.com.br
  - **Tempo Estimado**: 8h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-026
  - **Validação**: ✅ Site acessível publicamente

- [ ] **TASK-029**: Migração de dados existentes
  - **Critério de Aceitação**: Histórico preservado sem perda
  - **Tempo Estimado**: 12h
  - **Prioridade**: 🔴 CRÍTICA
  - **Dependências**: TASK-028
  - **Validação**: ✅ 100% dos dados migrados com integridade

- [ ] **TASK-030**: Configurar monitoramento de produção
  - **Critério de Aceitação**: Alertas automáticos funcionando
  - **Tempo Estimado**: 4h
  - **Prioridade**: 🟠 ALTA
  - **Dependências**: TASK-028
  - **Validação**: ✅ Alertas funcionando 24/7

- [ ] **TASK-031**: Comunicação e treinamento de usuários
  - **Critério de Aceitação**: Usuários cientes da mudança
  - **Tempo Estimado**: 6h
  - **Prioridade**: 🟡 MÉDIA
  - **Dependências**: TASK-028
  - **Validação**: ✅ Material de comunicação distribuído

#### 🧪 **MARCOS DE VALIDAÇÃO - Sprint 8**
- ✅ Sistema em produção estável
- ✅ Dados migrados com integridade
- ✅ Monitoramento ativo
- ✅ Usuários notificados e treinados

**🎯 CRITÉRIO DE SUCESSO DO ÉPICO 4**: Sistema completamente migrado e operacional

---

# 🔍 **GESTÃO DE RISCOS**

## 🚨 **RISCOS CRÍTICOS**

### **RISCO-001**: Perda de funcionalidade das personas
- **Probabilidade**: 🟡 Média (30%)
- **Impacto**: 🔴 Crítico
- **Mitigação**: Testes A/B extensivos, validação com usuários reais
- **Plano B**: Manter Flask em standby por 30 dias

### **RISCO-002**: Problemas de performance
- **Probabilidade**: 🟡 Média (25%)
- **Impacto**: 🟠 Alto
- **Mitigação**: Load testing desde Sprint 4, cache inteligente
- **Plano B**: CDN adicional, otimização de queries

### **RISCO-003**: Limitações do Google Apps Script
- **Probabilidade**: 🟢 Baixa (15%)
- **Impacto**: 🔴 Crítico
- **Mitigação**: POC técnico no Sprint 1, alternativas documentadas
- **Plano B**: Migração para Cloud Functions

### **RISCO-004**: Problemas de integração AstraDB
- **Probabilidade**: 🟡 Média (20%)
- **Impacto**: 🟠 Alto
- **Mitigação**: Testes de conexão desde Sprint 1
- **Plano B**: Google Firestore como backup

---

# 📊 **MÉTRICAS DE SUCESSO**

## 🎯 **KPIs Principais**

### **Performance**
- ⚡ Tempo de resposta: <500ms (atual: ~800ms)
- 📈 Uptime: >99.5% (atual: ~95%)
- 🚀 Lighthouse Score: >90 (atual: ~75)

### **Funcionalidade**
- 🤖 Precisão das personas: >95% similaridade
- 💬 Qualidade das respostas: Score >4.0/5.0
- 🔍 Relevância contextual: >80% das respostas

### **Usuário**
- 😊 Satisfação: >4.5/5.0
- ⏱️ Tempo médio de sessão: mantido ou aumentado
- 🔄 Taxa de retenção: >90%

### **Técnica**
- 🐛 Bugs críticos: 0 em produção
- 🔒 Incidentes de segurança: 0
- 💰 Redução de custos: >70% vs atual

---

# 📅 **CRONOGRAMA DETALHADO**

## **Semana 1-2: Épico 1 - Preparação**
```
Semana 1 (31/01-06/02):
  ▓▓▓▓▓▓▓ Setup e Análise
Semana 2 (07/02-13/02):
  ▓▓▓▓▓▓▓ Base conhecimento + Personas
```

## **Semana 3-4: Épico 2 - Core Chatbot**
```
Semana 3 (14/02-20/02):
  ▓▓▓▓▓▓▓ Backend Core Migration
Semana 4 (21/02-27/02):
  ▓▓▓▓▓▓▓ Integração + Testes Core
```

## **Semana 5-6: Épico 3 - Frontend**
```
Semana 5 (28/02-06/03):
  ▓▓▓▓▓▓▓ Adaptação Frontend
Semana 6 (07/03-13/03):
  ▓▓▓▓▓▓▓ Otimização + UX
```

## **Semana 7-8: Épico 4 - Deploy**
```
Semana 7 (14/03-20/03):
  ▓▓▓▓▓▓▓ Testes Finais
Semana 8 (21/03-28/03):
  ▓▓▓▓▓▓▓ Go-Live + Produção
```

---

# 💼 **RECURSOS E ORÇAMENTO**

## 👥 **Equipe Necessária**
- **Product Manager**: 100% (8 semanas)
- **Tech Lead**: 100% (8 semanas)
- **Frontend Developer**: 75% (semanas 5-8)
- **QA Engineer**: 50% (semanas 4,7-8)
- **DevOps**: 25% (toda duração)

## 💰 **Orçamento Estimado**
- **Domínio**: R$ 40/ano
- **Google Cloud**: ~R$ 0 (plano gratuito)
- **AstraDB**: ~R$ 0 (plano atual)
- **Ferramentas**: R$ 200 (licenças)
- **Total**: R$ 240 (vs R$ 200/mês atual)

---

# 🎉 **BENEFÍCIOS ESPERADOS**

## 🚀 **Imediatos (Go-Live)**
- ✅ Problemas de hospedagem resolvidos
- ✅ Performance 40% melhor
- ✅ Zero custos de infraestrutura recorrentes
- ✅ SSL e domínio personalizado

## 📈 **Médio Prazo (3-6 meses)**
- ✅ Analytics avançados implementados
- ✅ Manutenção 60% mais rápida
- ✅ Novas funcionalidades mais fáceis de implementar
- ✅ Escalabilidade automática

## 🌟 **Longo Prazo (6+ meses)**
- ✅ Base para expansão nacional
- ✅ Integração com outros sistemas de saúde
- ✅ Machine Learning para melhorar personas
- ✅ API aberta para terceiros

---

# ✅ **CRITÉRIOS DE ACEITAÇÃO FINAIS**

## 🎯 **Funcionalidade**
- [ ] Dr. Gasnelio responde identicamente ao sistema atual
- [ ] Gá mantém o mesmo nível de empatia e clareza
- [ ] Sistema RAG funciona com precisão >80%
- [ ] Histórico de conversas preservado 100%

## 🚀 **Performance**
- [ ] Tempo de resposta <500ms em 95% dos casos
- [ ] Uptime >99.5% medido por 30 dias
- [ ] Suporte a 100 usuários simultâneos sem degradação

## 🔒 **Segurança**
- [ ] Rate limiting funcionando
- [ ] SSL A+ rating
- [ ] LGPD compliance verificado
- [ ] Backup automático configurado

## 👥 **Usuário**
- [ ] Interface idêntica ao sistema atual
- [ ] Todas as funcionalidades disponíveis
- [ ] Documentação completa disponível
- [ ] Treinamento realizado

---

# 📞 **CONTATOS E COMUNICAÇÃO**

## 📊 **Reports Semanais**
- **Quando**: Todas as sextas às 16h
- **Para**: Stakeholders principais
- **Formato**: Status dashboard + call de 30min

## 🚨 **Escalation Matrix**
- **Bloqueios técnicos**: Tech Lead → Product Manager
- **Problemas de prazo**: Product Manager → Steering Committee
- **Questões de qualidade**: QA → Tech Lead → Product Manager

## 📧 **Canais de Comunicação**
- **Diário**: Slack #hanseniase-migration
- **Bloqueios**: Email direto + Slack mention
- **Updates**: Wiki interno atualizado diariamente

---

**🎯 STATUS ATUAL**: 🔴 AGUARDANDO APROVAÇÃO PARA INÍCIO

**📝 Próximos Passos**:
1. Aprovação do roadmap pelos stakeholders
2. Alocação da equipe técnica
3. Setup do ambiente de desenvolvimento
4. Início do Sprint 1

---

*Documento criado por: Product Manager Senior*  
*Data: 31/01/2025*  
*Versão: 1.0*  
*Próxima revisão: 07/02/2025*