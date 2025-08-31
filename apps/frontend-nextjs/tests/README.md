# [SEARCH] Sistema de Validação - Roteamento Inteligente

Este diretório contém uma suíte completa de validação para o Sistema de Roteamento Inteligente (FASE 3.2.1), desenvolvida por um Elite QA Engineer especializado em validação de sistemas de IA.

## [LIST] Visão Geral

O sistema de validação foi projetado para garantir que o Roteamento Inteligente atenda a todos os critérios de qualidade, performance, robustez e experiência do usuário necessários para produção.

### [TARGET] Objetivos da Validação

- [OK] **Funcionalidade:** Algoritmo de roteamento preciso e confiável
- ⚡ **Performance:** Resposta < 100ms, cache eficiente, sem memory leaks  
- [SECURITY] **Robustez:** Fallbacks resilientes, error handling completo
- 🎨 **UX/UI:** Interface responsiva, acessível (WCAG 2.1), transparente
- 🔗 **Integração:** Comunicação backend robusta, fluxo end-to-end
- [REPORT] **Analytics:** Métricas para melhoria contínua

## 🗂️ Estrutura dos Testes

```
tests/
├── 📄 masterValidation.ts          # Orquestrador principal
├── [FIX] intelligentRouting.validation.ts  # Validação funcional
├── ⚡ performance.validation.ts     # Performance e cache
├── [SECURITY] errorHandling.validation.ts   # Error handling e fallbacks  
├── 🎨 uiux.validation.ts           # UI/UX e acessibilidade
├── 🔗 integration.validation.ts    # Integração backend/frontend
├── [REPORT] analytics.validation.ts      # Analytics e tracking
├── [START] runValidation.ts            # Script de execução
└── 📖 README.md                   # Este arquivo
```

## [START] Como Executar

### Pré-requisitos

```bash
# Instalar dependências de teste
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-axe
npm install --save-dev jest @types/jest
```

### Execução Rápida

```bash
# Validação completa (recomendada)
npm run validate complete

# Validação rápida para CI/CD
npm run validate quick
```

### Execução por Categoria

```bash
# Validação funcional
npm run validate functional

# Performance e cache
npm run validate performance  

# Error handling
npm run validate errors

# UI/UX e acessibilidade
npm run validate uiux

# Integração backend/frontend
npm run validate integration

# Analytics e tracking
npm run validate analytics
```

### Execução Interativa

```bash
# Menu interativo
npm run validate

# Ou execute diretamente
node src/tests/runValidation.ts
```

## [REPORT] Tipos de Validação

### 1. [FIX] Validação Funcional

**Arquivo:** `intelligentRouting.validation.ts`

**O que testa:**
- [OK] Análise de keywords para Dr. Gasnelio e Gá
- [OK] Algoritmo de scoring e confiança
- [OK] Casos críticos de alta prioridade
- [OK] Detecção de ambiguidade
- [OK] Expertise das personas

**Casos de Teste:**
```typescript
// Exemplos testados
"Qual a dose de rifampicina?" -> Dr. Gasnelio (85% confiança)
"Como explicar para a família?" -> Gá (78% confiança)  
"Protocolo PQT-U multibacilar" -> Dr. Gasnelio (82% confiança)
```

### 2. ⚡ Validação de Performance

**Arquivo:** `performance.validation.ts`

**O que testa:**
- ⏱️ Tempo de resposta (meta: <100ms)
- [SAVE] Eficiência do cache (TTL 5min)
- 🔄 Debounce (1000ms)
- 🧠 Memory leaks
- 📈 Throughput e escalabilidade

**Métricas Validadas:**
- Response time P95 < 500ms
- Success rate > 95%
- Cache hit improvement > 50%
- Memory growth < 50MB per 1000 ops

### 3. [SECURITY] Validação de Error Handling

**Arquivo:** `errorHandling.validation.ts`

**O que testa:**
- 🌐 Network errors -> Fallback local
- ⏰ API timeouts -> Recuperação rápida
- 🚫 Server errors (500) -> Graceful degradation
- [NOTE] Edge cases (input vazio, malformado)
- 💪 Stress conditions

**Cenários de Falha:**
```typescript
// Tipos de erro testados
- Network failures
- API timeouts  
- Server errors (500, 404)
- Malformed responses
- Empty/null inputs
- Very long inputs
- Special characters
- Concurrent requests
```

### 4. 🎨 Validação de UI/UX

**Arquivo:** `uiux.validation.ts`

**O que testa:**
- 📱 Responsividade (320px - 1440px+)
- ♿ Acessibilidade WCAG 2.1 AA
- [TARGET] Touch targets ≥44px
- ⌨️ Navegação por teclado
- 🎨 Contraste e legibilidade
- 🔄 Estados de loading

**Validações de Acessibilidade:**
- ARIA labels descritivos
- Navegação por teclado completa
- Screen reader support
- Color contrast ratios
- Focus management
- Semantic HTML

### 5. 🔗 Validação de Integração

**Arquivo:** `integration.validation.ts`

**O que testa:**
- 🔌 Comunicação com API backend
- 🪝 Integração do hook React
- 🔄 Fluxo end-to-end completo
- [REPORT] Consistency de dados
- 🎛️ State management

**API Testing:**
```typescript
// Validações de API
- POST /api/scope formatting
- Error handling (network, server)
- Response structure validation
- Timeout handling
- Retry logic (if implemented)
```

### 6. [REPORT] Validação de Analytics

**Arquivo:** `analytics.validation.ts`

**O que testa:**
- 📈 Métricas de uso (aceitação/rejeição)
- [NOTE] Qualidade dos logs
- 🔄 Continuous improvement data
- [SECURITY] Proteção de dados sensíveis
- [REPORT] Performance tracking

**Métricas Capturadas:**
- Recommendation acceptance rate
- Analysis count and confidence
- Scope distribution
- Error patterns
- Usage patterns

## [TARGET] Critérios de Aprovação

### [OK] Critérios OBRIGATÓRIOS

1. **Functional Routing:** >80% accuracy em casos típicos
2. **Performance:** Response time <100ms média
3. **Error Handling:** 100% dos cenários de falha tratados
4. **Integration:** End-to-end flow funcionando
5. **Accessibility:** WCAG 2.1 AA compliance

### 📈 Critérios DESEJÁVEIS  

1. **UI/UX:** Score >80/100
2. **Analytics:** Tracking funcionando
3. **Cache:** >50% performance improvement
4. **Mobile:** Responsive design adequado

## [REPORT] Interpretando Resultados

### Scores

- **90-100:** Excelente - Pronto para produção
- **80-89:** Bom - Algumas melhorias recomendadas  
- **70-79:** Adequado - Melhorias necessárias
- **<70:** Insuficiente - Correções obrigatórias

### Status

- [OK] **PASSOU:** Critério atendido completamente
- [WARNING] **ATENÇÃO:** Atendido mas com ressalvas
- [ERROR] **FALHOU:** Critério não atendido

### Relatórios

Os resultados são exibidos no console e salvos em:
- `validation-report.json` - Dados estruturados
- Console logs - Análise detalhada
- `VALIDATION_REPORT.md` - Relatório executivo

## [FIX] Configuração Avançada  

### Mock Customization

```typescript
// Personalize mocks em cada arquivo
const mockPersonas = {
  dr_gasnelio: {
    name: 'Dr. Gasnelio',
    expertise: ['clinical', 'dosage'],
    // ... mais configurações
  }
};
```

### Timeout Configuration

```typescript
// Ajuste timeouts se necessário
const CONFIG = {
  timeouts: {
    quick: 30000,     // 30s
    normal: 120000,   // 2min  
    complete: 300000  // 5min
  }
};
```

## [ALERT] Troubleshooting

### Problemas Comuns

1. **Timeout errors:**
   ```bash
   # Aumentar timeout
   npm run validate complete --timeout=600000
   ```

2. **Mock failures:**
   ```bash
   # Verificar se componentes existem
   ls src/components/chat/
   ls src/services/
   ```

3. **Jest configuration:**
   ```json
   // jest.config.js
   {
     "testEnvironment": "jsdom",
     "setupFilesAfterEnv": ["<rootDir>/src/tests/setup.ts"]
   }
   ```

4. **Import errors:**
   ```bash
   # Verificar paths no tsconfig.json
   npm run validate functional # Testar categoria individual
   ```

## [TARGET] Contribuindo

### Adicionando Novos Testes

1. **Crie arquivo na estrutura:**
   ```
   tests/myNewValidation.validation.ts
   ```

2. **Implemente interface padrão:**
   ```typescript
   export async function validateMyFeature(): Promise<{
     passed: boolean;
     results: Record<string, boolean>;
   }> {
     // Sua implementação
   }
   ```

3. **Integre ao master:**
   ```typescript
   // Em masterValidation.ts
   import { validateMyFeature } from './myNewValidation.validation';
   ```

### Guidelines

- [OK] Use console.log para feedback visual
- [OK] Implemente try/catch robusto
- [OK] Retorne structured results
- [OK] Documente cada teste claramente
- [OK] Use mocks consistentes

## 📞 Suporte

Para dúvidas ou problemas com os testes:

1. **Verificar logs detalhados** no console
2. **Executar categoria individual** para isolar problemas  
3. **Revisar configuração** de mocks e timeouts
4. **Validar pré-requisitos** (dependências, paths)

---

**Desenvolvido por:** Elite QA Engineer & AI Validation Specialist  
**Versão:** 1.0.0 - FASE 3.2.1  
**Compatibilidade:** Next.js 14.2.31, React 18, TypeScript

*Este sistema de validação segue as melhores práticas de QA para sistemas de IA e garante a qualidade necessária para ambientes de produção.*