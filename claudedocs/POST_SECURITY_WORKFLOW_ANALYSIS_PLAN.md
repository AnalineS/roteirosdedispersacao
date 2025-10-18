# Plano de Correção: Post-Security-Update Validation Workflow

**Data**: 2025-10-05
**Run Falha**: #18260626562
**Branch**: hml
**Status**: ⏳ Aguardando Execução

---

## 📊 Sumário Executivo

O workflow `post-security-update-validation.yml` está falhando com 3 problemas críticos:

1. **Backend**: Erro de tipo `EmbeddingResult` vs `np.ndarray` (7 arquivos)
2. **Backend**: Testes tentam conectar serviços reais sem mocks
3. **Frontend**: Arquivo de teste inexistente

**Impacto**: CI/CD bloqueado para todos os pushes em `main`, `hml`, `develop`.

---

## 🔴 Problemas Identificados

### 1. CRÍTICO: Erro de Tipo em Vector Store

**Erro Console**:
```
ERROR: unsupported operand type(s) for *: 'EmbeddingResult' and 'EmbeddingResult'
File: apps/backend/services/vector_store.py:535
```

**Root Cause**:
- Método `embedding_service.embed_text()` retorna objeto `EmbeddingResult`
- Método `vector_store.search_similar()` espera `np.ndarray`
- Código passa `EmbeddingResult` direto sem extrair `.embedding`

**Exemplo do Bug**:
```python
# apps/backend/services/rag/real_rag_system.py:179
# ANTES (ERRADO - linha 324-328):
embedding_service = get_embedding_service()
if embedding_service:
    embedding = embedding_service.get_embedding(query)  # Retorna ???
    if embedding is not None:
        return embedding.tolist() if isinstance(embedding, np.ndarray) else embedding

# search_similar recebe isso e tenta fazer: embedding * embedding → ERRO!
```

**Arquivos Afetados** (7 total):
1. ✅ `apps/backend/services/rag/real_rag_system.py:318-332`
2. ✅ `apps/backend/services/rag/semantic_search.py:332`
3. ✅ `apps/backend/services/rag/complete_medical_rag.py:592`
4. ✅ `apps/backend/services/rag/memory_optimized_rag.py:315`
5. ✅ `apps/backend/services/semantic_search.py:413`
6. ✅ `apps/backend/services/supabase_vector_store.py:369`
7. ✅ `apps/backend/scripts/validate_memory_optimization.py:323`

**Correção Padrão** (usar Context7 para padrões sentence-transformers):
```python
# DEPOIS (CORRETO):
from services.embedding_service import get_embedding_service

embedding_service = get_embedding_service()
if embedding_service:
    result = embedding_service.embed_text(query)  # Retorna EmbeddingResult

    if result.success and result.embedding is not None:
        # result.embedding é np.ndarray
        embedding_list = result.embedding.tolist()
        return embedding_list

logger.warning("Embedding service failed")
return None
```

---

### 2. CRÍTICO: Backend RAG Falha Total em Testes

**Erros Console**:
```
INFO:services.cache.cloud_native_cache:   ✅ Real Supabase: FAILED
INFO:services.cache.cloud_native_cache:   ✅ Real GCS: FAILED
INFO:services.rag.supabase_rag_system:   - OpenRouter: [ERROR]
AssertionError: Critical medical query failed accuracy check: 0.00 < 0.75
```

**Root Cause**:
- Testes em `test_post_security_update_validation.py` fazem chamadas REAIS:
  - `/api/v1/chat` endpoint
  - RAG system tenta Supabase
  - RAG system tenta OpenRouter
  - RAG system tenta GCS

- `conftest.py` configuração:
  ```python
  EMBEDDINGS_ENABLED = False
  RAG_AVAILABLE = False
  ```

- **Contradição**: Testes esperam respostas médicas precisas (75% accuracy) mas serviços estão desabilitados!

**Impacto**:
- Medical accuracy: **0.00 < 0.75** (FALHA CRÍTICA)
- Contexto médico perdido em sessões
- Testes não validam nada útil

**Correção Necessária**:

**Opção A - Mock Completo (RECOMENDADO)**:
```python
# apps/backend/tests/conftest.py

@pytest.fixture
def mock_rag_service(mocker):
    """Mock RAG service with pre-defined medical responses"""
    mock_service = mocker.patch('services.rag.real_rag_system.RealRAGSystem')

    # Medical responses fixtures
    mock_service.return_value.get_context.return_value = RealRAGContext(
        chunks=[
            RealRAGChunk(
                content="Rifampicina: 600mg dose única mensal supervisionada...",
                source="PCDT Hanseníase 2022",
                score=0.95
            )
        ],
        ...
    )
    return mock_service

@pytest.fixture
def mock_embedding_service(mocker):
    """Mock embedding service to avoid API calls"""
    mock = mocker.patch('services.embedding_service.get_embedding_service')

    # Return valid embedding result
    mock.return_value.embed_text.return_value = EmbeddingResult(
        embedding=np.random.rand(384),  # Dimension 384 (padrão)
        dimension=384,
        model_used='mock-model',
        generation_time=0.01,
        success=True
    )
    return mock
```

**Opção B - Fixtures com Respostas**:
```python
# apps/backend/tests/fixtures/medical_responses.py

MEDICAL_QUERY_FIXTURES = {
    'rifampicina_dosagem': {
        'query': 'Qual a dosagem de rifampicina para paciente de 70kg?',
        'response': '''
        **Rifampicina - Dose para adultos (>30kg):**
        - Dose: 600mg
        - Frequência: Dose única mensal
        - Administração: Manhã, supervisionada
        - Apresentação: Cápsula 300mg (2 cápsulas)

        Referência: PCDT Hanseníase 2022, Ministério da Saúde
        ''',
        'expected_keywords': ['600mg', 'rifampicina', 'mensal', 'supervisionada']
    },
    ...
}
```

**Opção C - Separar Testes (IDEAL)**:
```yaml
# Criar dois tipos:
tests/unit/test_post_security_validation_unit.py  # Mocks, rápido
tests/integration/test_post_security_validation_integration.py  # Serviços reais, manual
```

---

### 3. Frontend UI Validation Falha

**Erro Console**:
```
🎨 Frontend Medical UI Validation
Run medical UI component tests
##[error]Process completed with exit code 1.
No tests found, exiting with code 1
Pattern: tests/post-security-update/medical-ui-validation.test.ts - 0 matches
```

**Root Cause**:
- Workflow `.github/workflows/post-security-update-validation.yml:408` espera:
  ```bash
  npm run test -- tests/post-security-update/medical-ui-validation.test.ts
  ```

- Arquivo **NÃO EXISTE**: `apps/frontend-nextjs/tests/post-security-update/`

**Correções Possíveis**:

**Opção A - Remover Job** (se duplicado com Playwright):
```yaml
# .github/workflows/post-security-update-validation.yml
# DELETAR job inteiro (linhas 369-419):
# frontend-medical-ui-validation:
#   ...
```

**Opção B - Criar Stub Test**:
```typescript
// apps/frontend-nextjs/tests/post-security-update/medical-ui-validation.test.ts
import { describe, test, expect } from '@jest/globals';

describe('Post-Security-Update Medical UI Validation', () => {
  test('PersonaSwitch component renders', () => {
    // Stub - validação real feita via Playwright
    expect(true).toBe(true);
  });

  test('Medical chat interface loads', () => {
    // Stub - validação real feita via Playwright
    expect(true).toBe(true);
  });
});
```

**Opção C - Mover para Playwright** (RECOMENDADO):
```yaml
# .github/workflows/post-security-update-validation.yml
# SUBSTITUIR jest por playwright:
- name: Run medical UI validation with Playwright
  run: |
    cd apps/frontend-nextjs
    npx playwright test tests/frontend/staging-medical-validation.spec.ts \
      --project=chromium \
      --grep "@medical-critical"
```

---

## 🏗️ Análise do Workflow Atual

### Estatísticas:
- **Tamanho**: 757 linhas
- **Jobs**: 7 (security-audit, medical-validation, ui-validation, pcdt, lgpd, comprehensive, deployment-rec)
- **Trigger**: Push em `main`, `hml`, `develop` + PR + `workflow_dispatch`
- **Tempo médio**: ~30 minutos
- **Taxa de sucesso**: ~20% (muitas falhas)

### Propósito Original:
Validar que atualizações de segurança de dependências não quebram:
1. Funcionalidade médica crítica
2. Compliance PCDT/LGPD
3. Performance da aplicação
4. UI/UX médica

### Problemas do Design Atual:

#### 1. **Trigger Muito Amplo**
```yaml
on:
  push:
    branches: [ main, hml, develop ]
    paths:
      - 'apps/backend/requirements.txt'
      - 'apps/frontend-nextjs/package.json'
      - 'apps/backend/core/**'          # MUITO AMPLO!
      - 'apps/frontend-nextjs/src/**'   # MUITO AMPLO!
```

**Consequência**: Roda em TODOS os pushes, não só atualizações de segurança.

#### 2. **Duplicação com Workflow Principal**
- `unified-deploy.yml` já roda testes
- `unified-deploy.yml` já faz security checks
- Workflows competem por runners

#### 3. **Dependências de Serviços Externos**
- Testes precisam de Supabase real
- Testes precisam de OpenRouter API
- Testes precisam de GCS
- **Problema**: CI não tem essas credenciais configuradas

#### 4. **Foco Errado**
- Nome sugere "pós-segurança"
- Mas valida funcionalidade geral
- Deveria focar em **regressões** de atualizações

---

## 💡 Recomendações de Arquitetura

### OPÇÃO 1: Integrar ao Workflow Principal ⭐ RECOMENDADO

**Vantagens**:
- ✅ Menos duplicação de código
- ✅ Um único pipeline para entender
- ✅ Validações críticas no fluxo normal
- ✅ Menos overhead de manutenção

**Desvantagens**:
- ⚠️ Deploy pode ficar mais lento
- ⚠️ Precisa reorganizar jobs

**Implementação**:
```yaml
# .github/workflows/unified-deploy.yml

jobs:
  security-audit:
    name: 🔐 Security & Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Python dependency audit
        run: |
          pip install safety pip-audit
          cd apps/backend
          safety check --json > safety-report.json || true
          pip-audit --format json > pip-audit-report.json || true

      - name: NPM dependency audit
        run: |
          cd apps/frontend-nextjs
          npm audit --json > npm-audit-report.json || true

      - name: Upload audit reports
        uses: actions/upload-artifact@v4
        with:
          name: security-audit-reports
          path: |
            apps/backend/safety-report.json
            apps/backend/pip-audit-report.json
            apps/frontend-nextjs/npm-audit-report.json

  test-backend:
    needs: security-audit
    name: 🧪 Backend Tests (Mocked)
    steps:
      # Testes com mocks - SEM serviços externos
      - name: Run pytest with mocks
        run: |
          cd apps/backend
          pytest tests/ \
            --cov=services \
            --cov-report=html \
            -m "not integration"  # Só unit tests

  test-frontend:
    needs: security-audit
    name: 🎨 Frontend Tests
    steps:
      - name: Run Jest tests
        run: |
          cd apps/frontend-nextjs
          npm run test:unit

      - name: Type check
        run: |
          cd apps/frontend-nextjs
          npm run type-check

  deploy-staging:
    needs: [test-backend, test-frontend]
    # Deploy só se testes passarem

  validate-staging:
    needs: deploy-staging
    name: 🔬 Staging Validation (Playwright)
    steps:
      - name: Wait for deployment
        run: sleep 30

      - name: Run Playwright medical validation
        run: |
          npx playwright test \
            tests/frontend/staging-medical-validation.spec.ts \
            --project=chromium
```

**Migrations necessárias**:
1. Mover security audit de `post-security-update-validation.yml` → `unified-deploy.yml`
2. Adicionar step de testes médicos mockados
3. Mover validação Playwright para DEPOIS do deploy
4. Deprecar `post-security-update-validation.yml`

---

### OPÇÃO 2: Manter Separado mas Otimizar

**Vantagens**:
- ✅ Separação de concerns clara
- ✅ Pode rodar independente
- ✅ Menos mudanças necessárias

**Desvantagens**:
- ⚠️ Duplicação continua
- ⚠️ Dois workflows para manter

**Implementação**:

**2a. Trigger Mais Específico**:
```yaml
# post-security-update-validation.yml
on:
  push:
    branches: [main, hml]
    paths:
      # SÓ arquivos de dependências
      - 'apps/backend/requirements.txt'
      - 'apps/frontend-nextjs/package.json'
      - 'apps/frontend-nextjs/package-lock.json'
      # NÃO todo o código fonte
```

**2b. Simplificar Testes**:
```yaml
jobs:
  security-dependency-audit:
    # Mantém

  quick-regression-check:
    name: 🔬 Quick Regression Check (Mocked)
    steps:
      - name: Backend smoke tests
        run: |
          cd apps/backend
          # SÓ testes críticos mockados
          pytest tests/test_post_security_update_validation.py \
            -m "critical and not integration" \
            --maxfail=1

      - name: Frontend smoke tests
        run: |
          cd apps/frontend-nextjs
          npm run test -- --testPathPattern="critical" --bail

  # REMOVER: comprehensive-validation, deployment-recommendation
  # (muito complexo para validação de segurança)
```

**2c. Resultado Binário**:
```yaml
  report-results:
    needs: [security-dependency-audit, quick-regression-check]
    steps:
      - name: Comment on PR
        if: failure()
        run: |
          echo "⚠️ Security update caused regressions"
          echo "Run full test suite locally before merging"
```

---

###  OPÇÃO 3: Separar por Tipo e Frequência

**Vantagens**:
- ✅ Máxima clareza de propósito
- ✅ Workflows rápidos vs completos
- ✅ Controle fino de quando rodar

**Desvantagens**:
- ⚠️ Mais arquivos para manter
- ⚠️ Complexidade de configuração

**Implementação**:

**3a. Security Workflow** (sempre, rápido):
```yaml
# .github/workflows/security-audit.yml
name: 🔐 Security Audit

on:
  push:
    branches: [main, hml, develop]
  pull_request:
  schedule:
    - cron: '0 0 * * 0'  # Semanal

jobs:
  dependency-audit:
    # Só vulnerability scanning
    # Tempo: ~2 min

  code-analysis:
    # Bandit, semgrep, CodeQL
    # Tempo: ~5 min
```

**3b. Quick Validation Workflow** (sempre, após deploy):
```yaml
# .github/workflows/quick-validation.yml
name: ⚡ Quick Validation

on:
  workflow_run:
    workflows: ["🚀 Unified Deploy"]
    types: [completed]
    branches: [hml]

jobs:
  smoke-tests:
    # Playwright: 3-4 testes críticos
    # Tempo: ~2 min
```

**3c. Comprehensive Medical Validation** (manual/semanal):
```yaml
# .github/workflows/medical-validation-comprehensive.yml
name: ⚕️ Comprehensive Medical Validation

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
  schedule:
    - cron: '0 2 * * 1'  # Segunda 2am

jobs:
  medical-accuracy-tests:
    # Testes REAIS com API keys
    # RAG real, OpenRouter real
    # Tempo: ~20 min
    env:
      OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

---

## 📋 Plano de Execução

### FASE 1: Corrigir Erros Críticos ⏱️ 30min

#### 1.1 Corrigir `EmbeddingResult` → `np.ndarray` (7 arquivos)

**Usar Context7** para verificar padrão sentence-transformers:
```bash
# Buscar documentação
context7 search sentence-transformers embedding numpy conversion
```

**Padrão de correção**:
```python
# Template para todos os 7 arquivos:

# ANTES:
embedding = embedding_service.get_embedding(query)
results = vector_store.search_similar(embedding, ...)

# DEPOIS:
embedding_result = embedding_service.embed_text(query)
if embedding_result.success and embedding_result.embedding is not None:
    results = vector_store.search_similar(
        embedding_result.embedding,  # np.ndarray
        top_k=5,
        min_score=0.7
    )
else:
    logger.error(f"Embedding failed: {embedding_result.error_message}")
    results = []
```

**Checklist**:
- [ ] `apps/backend/services/rag/real_rag_system.py:318-332`
- [ ] `apps/backend/services/rag/semantic_search.py:332`
- [ ] `apps/backend/services/rag/complete_medical_rag.py:592`
- [ ] `apps/backend/services/rag/memory_optimized_rag.py:315`
- [ ] `apps/backend/services/semantic_search.py:413`
- [ ] `apps/backend/services/supabase_vector_store.py:369`
- [ ] `apps/backend/scripts/validate_memory_optimization.py:323`

#### 1.2 Mock Serviços Externos em `conftest.py`

**Adicionar fixtures**:
```python
# apps/backend/tests/conftest.py

import numpy as np
from services.embedding_service import EmbeddingResult
from services.rag.real_rag_system import RealRAGContext, RealRAGChunk

@pytest.fixture
def mock_embedding_service(mocker):
    """Mock embedding service - evita chamadas API"""
    mock = mocker.patch('services.embedding_service.get_embedding_service')

    mock_service = Mock()
    mock_service.embed_text.return_value = EmbeddingResult(
        embedding=np.random.rand(384),
        dimension=384,
        model_used='mock-sentence-transformers',
        generation_time=0.01,
        success=True,
        error_message=None
    )

    mock.return_value = mock_service
    return mock_service

@pytest.fixture
def mock_rag_responses():
    """Respostas médicas pré-definidas para testes"""
    return {
        'rifampicina_dosagem': {
            'context': RealRAGContext(
                chunks=[
                    RealRAGChunk(
                        content="Rifampicina 600mg dose única mensal supervisionada",
                        source="PCDT Hanseníase 2022",
                        score=0.95,
                        chunk_type='protocol'
                    )
                ],
                total_chunks=1,
                sources=['PCDT Hanseníase 2022']
            ),
            'answer': '''**Rifampicina - Adultos (>30kg):**
- Dose: 600mg (2 cápsulas de 300mg)
- Frequência: Dose única mensal
- Administração: Manhã, supervisionada
- Apresentação: Cápsula 300mg

Referência: PCDT Hanseníase 2022'''
        }
    }

@pytest.fixture(autouse=True)
def mock_external_services(mocker, mock_embedding_service, mock_rag_responses):
    """Auto-mock serviços externos para TODOS os testes"""

    # Mock Supabase
    mocker.patch('services.integrations.supabase_vector_store.get_supabase_client', return_value=None)

    # Mock GCS
    mocker.patch('services.cache.cloud_native_cache.storage.Client', return_value=None)

    # Mock OpenRouter
    mocker.patch('services.ai.openrouter_client.OpenRouterClient')

    return {
        'embedding': mock_embedding_service,
        'rag_responses': mock_rag_responses
    }
```

#### 1.3 Remover/Ajustar Teste Frontend UI

**Opção escolhida**: Remover job (duplicado com Playwright)

```yaml
# .github/workflows/post-security-update-validation.yml
# DELETAR linhas 369-419:

  # frontend-medical-ui-validation:
  #   name: 🎨 Frontend Medical UI Validation
  #   ...
  # (REMOVER JOB INTEIRO)
```

---

### FASE 2: Reestruturar Workflow ⏱️ 1h

**Decisão necessária do usuário**: Qual opção?
- [ ] **Opção 1**: Integrar ao workflow principal
- [ ] **Opção 2**: Manter separado mas otimizar
- [ ] **Opção 3**: Separar por tipo e frequência

**Após decisão**, implementar conforme plano da opção escolhida.

---

### FASE 3: Validação ⏱️ 15min

#### 3.1 Teste Local
```bash
# Backend
cd apps/backend
pytest tests/test_post_security_update_validation.py -v --tb=short

# Deve passar com mocks
```

#### 3.2 Push para HML
```bash
git add .
git commit -m "fix(backend): Correct EmbeddingResult type handling in RAG system

- Fix 7 files passing EmbeddingResult instead of np.ndarray to vector_store
- Add comprehensive mocks in conftest.py for external services
- Remove duplicate frontend UI validation job from workflow

Resolves CI/CD failures in post-security-update-validation workflow."

git push origin hml
```

#### 3.3 Monitorar CI/CD
```bash
gh run list --branch hml --limit 1
gh run watch  # Aguardar conclusão
```

---

## 📁 Arquivos a Modificar

### Código Backend (7 arquivos):
1. `apps/backend/services/rag/real_rag_system.py`
2. `apps/backend/services/rag/semantic_search.py`
3. `apps/backend/services/rag/complete_medical_rag.py`
4. `apps/backend/services/rag/memory_optimized_rag.py`
5. `apps/backend/services/semantic_search.py`
6. `apps/backend/services/supabase_vector_store.py`
7. `apps/backend/scripts/validate_memory_optimization.py`

### Testes (1 arquivo):
- `apps/backend/tests/conftest.py`

### Workflow (1 arquivo - FASE 1):
- `.github/workflows/post-security-update-validation.yml`

### Workflow (decisão pendente - FASE 2):
- `.github/workflows/post-security-update-validation.yml` (deprecar OU otimizar)
- `.github/workflows/unified-deploy.yml` (integrar security checks SE Opção 1)
- `.github/workflows/security-audit.yml` (criar SE Opção 3)
- `.github/workflows/medical-validation-comprehensive.yml` (criar SE Opção 3)

---

## ❓ Decisão Pendente do Usuário

**Para prosseguir com FASE 2, preciso saber qual abordagem prefere:**

### Pergunta:
Qual arquitetura de workflow você prefere?

1. **OPÇÃO 1 - Integrar** ⭐
   - Mover tudo para `unified-deploy.yml`
   - Deprecar `post-security-update-validation.yml`
   - **Menos arquivos, mais simples**

2. **OPÇÃO 2 - Otimizar**
   - Manter `post-security-update-validation.yml` separado
   - Otimizar triggers e testes
   - **Separação de concerns**

3. **OPÇÃO 3 - Separar por Tipo**
   - `security-audit.yml` (sempre, rápido)
   - `quick-validation.yml` (pós-deploy)
   - `medical-validation-comprehensive.yml` (manual/semanal)
   - **Máximo controle, mais arquivos**

**Aguardo decisão para prosseguir.**

---

## 📝 Notas de Implementação

### Context7 Queries Úteis:
```bash
# Para correções EmbeddingResult:
context7 search sentence-transformers numpy array conversion
context7 search huggingface embeddings return type

# Para mocks pytest:
context7 search pytest mock external services
context7 search pytest fixtures autouse

# Para workflows GitHub Actions:
context7 search github actions workflow best practices
context7 search github actions conditional jobs
```

### Comandos de Validação:
```bash
# Teste rápido de um arquivo:
pytest apps/backend/tests/test_post_security_update_validation.py::TestMedicalFunctionalityIntegrity::test_dr_gasnelio_technical_responses -v

# Verificar tipos:
mypy apps/backend/services/rag/real_rag_system.py --no-error-summary

# Lint workflow:
actionlint .github/workflows/post-security-update-validation.yml
```

---

**Status**: ⏳ Aguardando aprovação para executar FASE 1
**Próximo passo**: Corrigir 7 arquivos com erro `EmbeddingResult`
**ETA FASE 1**: 30 minutos
