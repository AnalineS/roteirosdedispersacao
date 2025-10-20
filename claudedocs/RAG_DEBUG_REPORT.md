# Relatório de Debug: RAG Retornando Sources Vazias

**Data:** 2025-10-18
**Status:** INVESTIGAÇÃO EM ANDAMENTO - PROBLEMA IDENTIFICADO MAS NÃO RESOLVIDO

---

## 🚨 PROBLEMA CRÍTICO

RAG retorna `"sources": []` mesmo com:
- 140 documentos indexados no Supabase (tabela `medical_embeddings`)
- Credenciais corretas
- Backend inicializando sem erros
- Health check retornando `"rag": "OK"`

---

## ✅ O QUE JÁ FUNCIONA

1. **Supabase Conectividade**: ✅
   - Indexação funcionou: 140 docs inseridos com sucesso
   - Keys corretas (service_role verificada via Playwright)
   - Tabela `medical_embeddings` contém dados

2. **UnifiedEmbeddingService**: ✅
   - Modo híbrido funcionando (local em dev, API em prod)
   - Modelo `multilingual-e5-small` (384D) carregado
   - Embeddings sendo gerados localmente

3. **Sistema RAG**: ✅
   - SupabaseRAGSystem é chamado (`"rag_system": "supabase"`)
   - RAG está ativo (`"rag_used": true`)
   - Hierarquia de fallback configurada corretamente

---

## ❌ PROBLEMA ID ENTIFICADO: THRESHOLD MUITO ALTO

### Diagnóstico Completo

**Threshold de Similaridade = 0.7 (70%)**

**Localização do Problema:**
- `apps/backend/app_config.py:107`
  ```python
  SEMANTIC_SIMILARITY_THRESHOLD: float = float(os.getenv('SEMANTIC_SIMILARITY_THRESHOLD', '0.7'))
  ```

**Como Afeta a Busca:**

1. **Busca Inicial** (`semantic_search.py:354`):
   ```python
   search_results = self.vector_store.search_similar(
       query_embedding,
       top_k=top_k * 2,
       min_score=min_score * 0.8  # 0.7 * 0.8 = 0.56
   )
   ```

2. **Weighted Score Penalty** (`semantic_search.py:379`):
   ```python
   weight = self.content_weights.get(doc.chunk_type, 0.5)
   weighted_score = score * weight * doc.priority  # Penalização dupla!
   ```

3. **Filtragem Final** (`semantic_search.py:387`):
   ```python
   if weighted_score >= min_score:  # Compara com 0.7
   ```

**Exemplo Real:**
```
Score original: 0.65 (bom match!)
Weight (general): 0.6
Priority: 0.7
Weighted score: 0.65 * 0.6 * 0.7 = 0.273
Threshold: 0.7
Resultado: REJEITADO (0.273 < 0.7)
```

### Correção Aplicada (NÃO FUNCIONOU)

Adicionamos ao `.env`:
```bash
SEMANTIC_SIMILARITY_THRESHOLD=0.3
```

**Por que não funcionou:** Backend já estava rodando e leu a configuração antiga.

---

## 🔍 PRÓXIMOS PASSOS PARA DEBUG

### Opção 1: Verificar se Threshold Foi Aplicado
```python
# Adicionar logging temporário em supabase_rag_system.py:81
logger.info(f"[RAG DEBUG] Threshold configurado: {self.min_similarity_threshold}")
```

### Opção 2: Verificar Dados no Supabase
```sql
-- Via Playwright no Supabase SQL Editor
SELECT count(*) FROM medical_embeddings;
SELECT chunk_type, count(*) FROM medical_embeddings GROUP BY chunk_type;
SELECT metadata->>'source' as source, count(*) FROM medical_embeddings GROUP BY source;
```

### Opção 3: Testar Query de Similaridade Diretamente
```sql
-- Gerar embedding da query "rifampicina dose adulto"
-- Buscar com threshold baixo
SELECT
    id,
    metadata->>'source' as source,
    1 - (embedding <=> '[embedding_vector]') as similarity
FROM medical_embeddings
WHERE 1 - (embedding <=> '[embedding_vector]') > 0.2
ORDER BY similarity DESC
LIMIT 10;
```

### Opção 4: Adicionar Logging Detalhado
```python
# Em semantic_search.py, adicionar antes da filtragem:
logger.info(f"[SEARCH DEBUG] Original score: {score}, Weight: {weight}, Priority: {doc.priority}, Weighted: {weighted_score}, Threshold: {min_score}")
```

---

## 📊 CONFIGURAÇÕES ATUAIS

### Ambiente (.env)
```
ENVIRONMENT=development
SUPABASE_URL=https://kiazlaicguhlwssziinu.supabase.co
SUPABASE_VECTOR_DIMENSION=384
SUPABASE_VECTOR_SIMILARITY_THRESHOLD=0.5
SEMANTIC_SIMILARITY_THRESHOLD=0.3  ← ADICIONADO
```

### Modelo de Embedding
- **Modelo:** `sentence-transformers/multilingual-e5-small`
- **Dimensão:** 384
- **Modo:** Local (development)
- **Status:** Carregado com sucesso

### Query Testada
```json
{
  "message": "Qual a dose da rifampicina para adulto com hanseníase multibacilar?",
  "persona": "gasnelio"
}
```

### Resposta Atual
```json
{
  "sources": [],
  "confidence": 0.24,
  "rag_used": true,
  "rag_system": "supabase",
  "response": "Não foi encontrado contexto específico na base de conhecimento."
}
```

---

## 🎯 RECOMENDAÇÕES IMEDIATAS

1. **Reiniciar Backend** com `.env` atualizado para aplicar `SEMANTIC_SIMILARITY_THRESHOLD=0.3`

2. **Adicionar Logging** em 3 pontos críticos:
   - `supabase_rag_system.py:81` - threshold configurado
   - `semantic_search.py:354` - resultados da busca inicial
   - `semantic_search.py:387` - filtragem final com scores

3. **Verificar Dados no Supabase** via SQL Editor:
   - Quantidade de documentos
   - Distribuição por chunk_type
   - Conteúdo de um embedding exemplo

4. **Testar Query Simplificada**:
   - "hanseníase" (termo único)
   - "PQT" (sigla do protocolo)
   - "rifampicina" (medicamento específico)

5. **Se Persistir:** Problema pode ser:
   - Embeddings não compatíveis (384D vs outra dimensão?)
   - Função de similaridade incorreta no Supabase
   - Cache impedindo queries frescas

---

## 📝 CONSOLIDAÇÃO REALIZADA

### ✅ Completadas:
1. **Embeddings**: Consolidado em UnifiedEmbeddingService único
2. **RAGs Obsoletos**: Deletados 7 arquivos RAG não usados
3. **Imports Quebrados**: Corrigidos em 4 arquivos
4. **Credenciais**: Atualizadas via Playwright + GitHub Secrets
5. **Indexação**: 140 documentos no Supabase

### ⏳ Pendentes:
1. **Threshold**: Aplicar 0.3 e testar com backend reiniciado
2. **Debug Logging**: Adicionar para rastrear scores
3. **Verificação SQL**: Confirmar dados corretos no Supabase
4. **Teste End-to-End**: RAG 100% funcional com sources retornadas

---

## 🔗 ARQUIVOS RELEVANTES

- [apps/backend/app_config.py:107](apps/backend/app_config.py#L107) - Threshold default
- [apps/backend/.env:71](apps/backend/.env#L71) - Threshold corrigido
- [apps/backend/services/rag/supabase_rag_system.py:81](apps/backend/services/rag/supabase_rag_system.py#L81) - Uso do threshold
- [apps/backend/services/semantic_search.py:354-387](apps/backend/services/semantic_search.py#L354-L387) - Lógica de filtragem
- [claudedocs/RAG_EMBEDDING_CONSOLIDATION_PLAN.md](claudedocs/RAG_EMBEDDING_CONSOLIDATION_PLAN.md) - Plano original
