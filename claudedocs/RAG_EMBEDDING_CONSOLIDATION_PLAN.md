# Plano de Consolidação: RAG e Embeddings

## Data: 2025-10-18
## Status: ANÁLISE COMPLETA - AGUARDANDO APROVAÇÃO

---

## 🚨 SITUAÇÃO ATUAL - DUPLICAÇÃO CRÍTICA

### Serviços de Embedding (4 duplicados)

1. **UnifiedEmbeddingService** (`services/unified_embedding_service.py`)
   - ✅ **MANTER** - Modificado com suporte híbrido local + API
   - Usado por: `medical_core_blueprint.py`, `medical_ai_validation.py`, `semantic_search.py`
   - Features: sentence-transformers (dev) + HuggingFace API (prod)
   - Status: FUNCIONANDO com modelo local multilingual-e5-small (384D)

2. **MedicalEmbeddingService** (`services/rag/complete_medical_rag.py:72-138`)
   - ❌ **REMOVER** - HuggingFace API only (não funciona!)
   - Usado por: `CompleteMedicalRAG` (linha 322)
   - Problema: Modelo não suporta feature-extraction via API
   - Status: QUEBRADO - retorna erro 400

3. **EmbeddingService** (`services/semantic_search.py:67`)
   - ❌ **REMOVER** - Duplicado interno
   - Usado dentro de `semantic_search.py` (linha 212)
   - Conflito: mesmo arquivo já importa UnifiedEmbeddingService (linha 48)!

4. **EmbeddingService** (`services/rag/embedding_service.py:208`)
   - ❌ **DELETAR ARQUIVO COMPLETO** - Arquivo obsoleto
   - Usado por: `rag_health_checker.py` (linha 204)
   - Lazy loading complexo e redundante

---

### Sistemas RAG (10+ duplicados!)

#### RAGs em Produção:

1. **SupabaseRAGSystem** (`services/rag/supabase_rag_system.py`)
   - ✅ **PRINCIPAL** - Usado por `get_rag()` em dependencies.py (linha 180)
   - Features: Supabase PostgreSQL + pgvector, cache, analytics
   - Status: Conecta mas retorna `sources:[]` (embedding service quebrado)

2. **RealRAGSystem** (`services/rag/real_rag_system.py`)
   - ⚠️ **ALIAS** - linha 824: `SupabaseRAGSystem = RealRAGSystem`
   - Backward compatibility alias
   - Decisão: MANTER como alias ou consolidar?

#### RAGs Secundários (Fallback):

3. **EnhancedRAGSystem** (`services/rag/enhanced_rag_system.py`)
   - ⚠️ **FALLBACK #2** - Usado se Supabase falhar (dependencies.py:164)

4. **SimpleRAG** (`services/rag/simple_rag.py`)
   - ⚠️ **FALLBACK #3** - Último recurso (dependencies.py:170)

#### RAGs Obsoletos/Não Usados:

5. **CompleteMedicalRAG** (`services/rag/complete_medical_rag.py`)
   - ❌ **NÃO USADO** - Não está na hierarquia do dependencies.py
   - Problema: Usa MedicalEmbeddingService quebrado
   - Status: QUEBRADO

6. **UnifiedRAGSystem** (`services/rag/unified_rag_system.py`)
   - ❌ **NÃO USADO** - Não referenciado

7. **MedicalRAGSystem** (`services/rag/medical_rag_integration.py`)
   - ❌ **NÃO USADO** - Não referenciado

8. **EmbeddingRAGSystem** (`services/rag/embedding_rag_system.py`)
   - ❌ **NÃO USADO** - Não referenciado

9. **MemoryOptimizedRAG** (`services/rag/memory_optimized_rag.py`)
   - ❌ **NÃO USADO** - Não referenciado

10. **OptimizedRAGManager** (`services/rag/optimized_rag_manager.py`)
    - ❌ **NÃO USADO** - Gerenciador de múltiplos RAGs não utilizado

---

## 📋 PLANO DE CONSOLIDAÇÃO

### FASE 1: Consolidar Embeddings (PRIORIDADE MÁXIMA)

#### Ação 1.1: Adicionar `embed_batch()` ao UnifiedEmbeddingService
- Método necessário para compatibilidade com RAG
- Implementação: loop sobre `embed_text()` ou batch nativo do sentence-transformers

#### Ação 1.2: Remover MedicalEmbeddingService de complete_medical_rag.py
- Substituir linha 322: `MedicalEmbeddingService` → `UnifiedEmbeddingService`
- Deletar classe `MedicalEmbeddingService` (linhas 72-138)
- Atualizar imports

#### Ação 1.3: Remover classe EmbeddingService de semantic_search.py
- Deletar classe duplicada (linha 67+)
- Manter apenas import do UnifiedEmbeddingService (linha 48)

#### Ação 1.4: Deletar arquivo embedding_service.py
- Atualizar `rag_health_checker.py` para usar UnifiedEmbeddingService
- Deletar `services/rag/embedding_service.py` completamente

**Resultado Fase 1**: **1 único serviço de embedding** (UnifiedEmbeddingService)

---

### FASE 2: Consertar SupabaseRAGSystem

#### Ação 2.1: Verificar integração com UnifiedEmbeddingService
- SupabaseRAGSystem deve usar embeddings do UnifiedEmbeddingService
- Verificar se está gerando embeddings corretamente

#### Ação 2.2: Testar conexão Supabase
- Validar credenciais do .env (já atualizadas)
- Testar query_embedding → vector_search → sources

#### Ação 2.3: Validar RAG end-to-end
- Query: "Qual a dose da rifampicina para adulto com hanseníase multibacilar?"
- Verificar: embedding gerado → busca no Supabase → sources retornadas → resposta

**Resultado Fase 2**: **SupabaseRAGSystem funcionando 100%**

---

### FASE 3: Limpar RAGs Obsoletos

#### Decisões Necessárias (🤔 AGUARDANDO SUA APROVAÇÃO):

**Opção A - Conservadora (RECOMENDADO)**:
- MANTER: SupabaseRAGSystem (principal) + EnhancedRAG + SimpleRAG (fallbacks)
- DELETAR: CompleteMedicalRAG, UnifiedRAGSystem, MedicalRAGSystem, EmbeddingRAGSystem, MemoryOptimizedRAG, OptimizedRAGManager
- BENEFÍCIO: Mantém hierarquia de fallback para robustez
- RISCO: Baixo - fallbacks já testados

**Opção B - Agressiva**:
- MANTER: Apenas SupabaseRAGSystem
- DELETAR: Todos os outros RAGs incluindo fallbacks
- BENEFÍCIO: Máxima simplificação
- RISCO: Alto - sem fallback se Supabase falhar

**Opção C - Consolidar Alias**:
- CONSOLIDAR: RealRAGSystem → SupabaseRAGSystem (mesclar features únicas)
- Deletar alias e manter um único arquivo
- BENEFÍCIO: Código mais claro
- RISCO: Médio - pode quebrar imports antigos

---

## 🎯 RECOMENDAÇÃO FINAL

### Implementar OPÇÃO A (Conservadora):

1. **Embeddings**: Consolidar em UnifiedEmbeddingService único ✅
2. **RAG Principal**: SupabaseRAGSystem com UnifiedEmbeddingService ✅
3. **Fallbacks**: Manter EnhancedRAG + SimpleRAG para robustez ✅
4. **Cleanup**: Deletar 6 RAGs não usados ✅

### Arquivos a DELETAR:
```
services/rag/complete_medical_rag.py
services/rag/unified_rag_system.py
services/rag/medical_rag_integration.py
services/rag/embedding_rag_system.py
services/rag/memory_optimized_rag.py
services/rag/optimized_rag_manager.py
services/rag/embedding_service.py (arquivo completo)
```

### Arquivos a MANTER e MODIFICAR:
```
services/unified_embedding_service.py (adicionar embed_batch)
services/rag/supabase_rag_system.py (integrar UnifiedEmbeddingService)
services/rag/real_rag_system.py (manter alias por enquanto)
services/rag/enhanced_rag_system.py (fallback)
services/rag/simple_rag.py (fallback)
services/semantic_search.py (remover classe duplicada)
services/rag/rag_health_checker.py (atualizar imports)
```

---

## ✅ CRITÉRIOS DE SUCESSO

1. **Embedding**: UnifiedEmbeddingService funciona localmente (development) e via API (production)
2. **Indexação**: Script `index_knowledge_base.py` indexa 140 docs com sucesso
3. **Query RAG**: Busca retorna sources relevantes da tese
4. **Chat**: Endpoint `/api/v1/chat` retorna resposta baseada no RAG
5. **Fallback**: Sistema degrada graciosamente se Supabase falhar

---

## 📊 ESTIMATIVA

- **Complexidade**: Alta (múltiplas dependências cruzadas)
- **Tempo**: 2-3 horas
- **Risco**: Médio (testar bem cada fase)
- **Impacto**: Alto (sistema RAG crítico para aplicação)

---

## ❓ AGUARDANDO SUA DECISÃO

**Posso prosseguir com a Opção A (Conservadora)?**

Ou prefere revisar/ajustar o plano antes de continuar?
