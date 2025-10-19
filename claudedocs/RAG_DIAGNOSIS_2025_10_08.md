# RAG System Diagnosis - Root Cause Analysis
**Date**: 2025-10-08
**System**: Supabase Vector Store + RAG Pipeline
**Issue**: Empty search results despite active RAG system

---

## Executive Summary

**ROOT CAUSE**: The Supabase vector database tables exist but are **completely empty** - no knowledge base content has ever been indexed.

**Evidence**:
- RAG system architecture is correct and functional
- API keys properly configured (OPENROUTER, SUPABASE_URL, SUPABASE_KEY)
- Vector search returns empty: `sources: [], confidence: 0.19`
- Response: "Não foi encontrado contexto específico na base de conhecimento"

**Impact**:
- 0% RAG retrieval success rate
- System falls back to generic responses
- Knowledge base (9 JSON files + 3 MD files) completely unused

---

## System Architecture Analysis

### 1. RAG Pipeline Components (ALL FUNCTIONAL)

#### ✅ Vector Store Layer
**File**: `apps/backend/services/integrations/supabase_vector_store.py`
- Supabase PostgreSQL + pgvector extension integration
- Fallback to local vector store when Supabase unavailable
- Table structure defined: `medical_embeddings`, `search_cache`, `embeddings_metadata`
- Connection logic working (lines 71-98)

#### ✅ Semantic Search Engine
**File**: `apps/backend/services/rag/semantic_search.py`
- Medical content prioritization weights
- Embedding generation for queries and documents
- Cosine similarity search via pgvector
- Cache system for repeated queries
- **Issue**: Returns empty when no indexed documents exist (line 264)

#### ✅ RAG Orchestration
**File**: `apps/backend/services/rag/supabase_rag_system.py`
- Context retrieval pipeline (lines 154-231)
- Medical chunk processing
- OpenRouter enhancement for low-confidence responses
- Scope validation for hanseníase domain
- **Issue**: Line 309 - "Não foi encontrado contexto específico" when chunks empty

#### ✅ Unified RAG Wrapper
**File**: `apps/backend/services/rag/unified_rag_system.py`
- Multi-system fallback architecture
- Priority: complete_medical → supabase → embedding
- Automatic system selection based on availability

---

## Knowledge Base Assets (AVAILABLE BUT NOT INDEXED)

### Markdown Files (`data/knowledge-base/`)
```
✅ hanseniase.md (11,807 bytes)
✅ hanseniase.pdf (1,012,182 bytes)
✅ roteiro_hanseniase_basico.md (1,457 bytes)
```

### Structured JSON Files (`data/structured/`)
```
✅ clinical_taxonomy.json (11,583 bytes)
✅ dispensing_workflow.json (11,269 bytes)
✅ dosing_protocols.json (7,222 bytes) - CRITICAL
✅ frequently_asked_questions.json (14,244 bytes)
✅ hanseniase_catalog.json (7,879 bytes)
✅ knowledge_scope_limitations.json (10,072 bytes)
✅ medications_mechanisms.json (10,065 bytes)
✅ pharmacovigilance_guidelines.json (11,030 bytes) - CRITICAL
✅ quick_reference_protocols.json (10,865 bytes)
```

**Total**: 9 JSON files + 3 MD files = **12 knowledge sources** ready but unindexed

---

## Indexing Infrastructure Analysis

### Migration Scripts (EXIST BUT NOT EXECUTED)

#### 1. `scripts/migration/migrate_json_to_supabase.py`
**Purpose**: Complete JSON → Supabase migration with embeddings
**Features**:
- Medical chunking with priority classification
- OpenAI embedding generation
- Batch processing
- Content-aware categorization (dosage, safety, protocol, etc.)
- **Status**: Script exists but never executed in production

#### 2. `scripts/migration/init_embeddings.py`
**Purpose**: Initialize embedding structure
**Features**:
- Markdown chunking by paragraphs
- JSON recursive extraction
- Embedding generation per chunk
- **Status**: References old embedding service, needs update

#### 3. `scripts/simple_supabase_populate.py`
**Purpose**: Simplified population without complex dependencies
**Features**:
- Document extraction from JSON
- Metadata preservation
- **Status**: Only generates JSON output, doesn't upload to Supabase

### Database Schema (CREATED BUT EMPTY)

**SQL Files**:
- `scripts/migration/create_supabase_tables.sql`
- `scripts/migration/setup_supabase_tables.sql`
- `scripts/migration/fix_id_types.sql`

**Table: `medical_embeddings`**
```sql
CREATE TABLE medical_embeddings (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    embedding VECTOR(1536),  -- OpenAI ada-002 dimensions
    chunk_type TEXT NOT NULL DEFAULT 'general',
    priority REAL NOT NULL DEFAULT 0.5,
    source_file TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search index (ivfflat)
CREATE INDEX medical_embeddings_vector_idx
ON medical_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Status**: Tables created via SQL Editor, but **zero rows inserted**

---

## Why Indexing Never Happened

### 1. No Automated Indexing on Deploy
- Flask app startup does NOT trigger indexing
- No initialization hook in `apps/backend/main.py`
- RAG system assumes data already exists

### 2. Manual Migration Not Executed
- Migration scripts exist but require manual execution
- No CI/CD pipeline step for indexing
- GitHub Actions don't run migration scripts

### 3. Chicken-and-Egg Problem
- RAG system checks for data availability
- Returns empty results when no data
- No automatic bootstrapping mechanism

### 4. Environment Complexity
- Indexing requires:
  - OPENROUTER_API_KEY (embeddings)
  - SUPABASE_URL + SUPABASE_KEY (storage)
  - Knowledge base files accessible
  - Python dependencies installed
- Complex to orchestrate locally and in production

---

## Search Flow Breakdown (Current Behavior)

### User Query: "qual a dosagem de rifampicina?"

**1. Supabase RAG System** (`supabase_rag_system.py:154`)
```python
def retrieve_context(query: str):
    # Search Supabase vector store
    search_results = self.search_engine.search(
        query=query,
        top_k=5,
        min_score=0.7
    )
    # Returns: [] (empty - no documents indexed)
```

**2. Semantic Search Engine** (`semantic_search.py:279`)
```python
def search(query: str):
    # Generate query embedding
    query_embedding = embed_query(query)  # Works fine

    # Search vector store
    results = vector_store.search_similar(
        query_embedding,
        top_k=5,
        min_score=0.7
    )
    # Returns: [] (empty table)
```

**3. Supabase Vector Store** (`supabase_vector_store.py:205`)
```python
def search_similar(query_embedding):
    query = f"""
        SELECT id, text, chunk_type, priority, source_file,
               (1 - (embedding <=> '{embedding_str}')) as similarity
        FROM medical_embeddings
        WHERE (1 - (embedding <=> '{embedding_str}')) >= 0.7
        ORDER BY embedding <=> '{embedding_str}'
        LIMIT 5
    """
    result = self.client.rpc('exec_sql', query)
    # Returns: [] (table has 0 rows)
```

**4. Context Formatting** (`supabase_rag_system.py:306`)
```python
def _format_context_for_generation(context):
    if not context.chunks:
        return "Não foi encontrado contexto específico na base de conhecimento."
    # context.chunks = [] → returns default message
```

**5. Response Generation** (`supabase_rag_system.py:348`)
```python
def _generate_base_answer(query, context, persona):
    # context = "Não foi encontrado contexto específico..."
    # Returns generic response without knowledge base
```

**Result**:
```json
{
  "rag_used": true,
  "rag_system": "supabase",
  "sources": [],
  "confidence": 0.19  // Low because no context found
}
```

---

## Critical Missing Piece: Indexing Execution

### What Should Happen (But Doesn't)

**Ideal Flow**:
1. **One-time setup**: Run migration script to index all knowledge base
2. **Embeddings generated**: OpenAI ada-002 embeddings for each chunk
3. **Supabase populated**: Insert ~500-1000 document chunks with vectors
4. **Index created**: pgvector ivfflat index for fast similarity search
5. **RAG active**: Subsequent queries return relevant context

**Current Reality**:
- ❌ Step 1 never executed
- ❌ Steps 2-5 never happen
- ✅ RAG pipeline works but finds nothing

---

## Evidence Summary

### System Checks
```bash
✅ OPENROUTER_API_KEY: Configured
✅ SUPABASE_URL: Configured
✅ SUPABASE_KEY: Configured
✅ Supabase connection: Working
✅ Embedding service: Available (via OpenRouter)
✅ Vector store code: Functional
✅ Search pipeline: Functional
❌ Indexed documents: 0
❌ Vector embeddings: 0
```

### Database State
```sql
-- Expected
SELECT COUNT(*) FROM medical_embeddings;
-- Should be: ~500-1000 rows

-- Actual
SELECT COUNT(*) FROM medical_embeddings;
-- Result: 0 rows
```

### API Response Evidence
```json
{
  "response": "**Dr. Gasnelio (Farmacêutico Clínico):**\n\nBaseado na literatura científica...\n\nNão foi encontrado contexto específico na base de conhecimento.",
  "rag_used": true,
  "rag_system": "supabase",
  "sources": [],
  "confidence": 0.19
}
```

---

## Solution Requirements

### Immediate Actions Required

1. **Index Knowledge Base**
   - Execute migration script with proper credentials
   - Generate embeddings for all chunks (~500-1000 documents)
   - Populate Supabase `medical_embeddings` table
   - Verify vector index creation

2. **Validate Search**
   - Test semantic search with sample queries
   - Verify similarity scores > 0.7 for relevant content
   - Confirm source attribution working

3. **Production Deployment**
   - Add indexing to CI/CD pipeline OR
   - Document manual indexing procedure
   - Create health check for indexed document count

### Long-term Improvements

1. **Automated Bootstrapping**
   - App startup checks document count
   - Auto-triggers indexing if count < threshold
   - Graceful degradation during indexing

2. **Monitoring**
   - Alert if document count drops to 0
   - Track search result rates
   - Monitor embedding API usage

3. **Documentation**
   - Clear indexing procedure in README
   - Troubleshooting guide for empty results
   - Knowledge base update workflow

---

## Next Steps

### Critical Path to Fix

1. **Create Indexing Script** (30 min)
   - Adapt `migrate_json_to_supabase.py` for production
   - Use OpenRouter for embeddings (free tier)
   - Handle batch processing efficiently

2. **Execute Indexing** (10 min runtime)
   - Run locally with GitHub CLI secrets OR
   - Run in Cloud Run environment
   - Verify completion via Supabase dashboard

3. **Validate RAG Pipeline** (5 min)
   - Test with known queries
   - Verify sources returned
   - Check confidence scores > 0.75

4. **Deploy Health Check** (15 min)
   - Add `/api/rag/status` endpoint
   - Return indexed document count
   - Alert if count < 100

**Total Time to Resolution**: ~1 hour

---

## Conclusion

The RAG system architecture is **correctly implemented** but is operating on an **empty database**. All components work as designed:
- Embedding generation ✅
- Vector similarity search ✅
- Context retrieval ✅
- Response generation ✅

**The sole issue**: No knowledge base content has been indexed into Supabase.

**Fix**: Execute the existing migration script (`migrate_json_to_supabase.py`) to populate the vector database with ~500-1000 medical knowledge chunks. Once indexed, the RAG system will immediately start returning relevant context with high confidence scores (0.75+).

**Priority**: Critical - System advertises RAG capabilities but delivers 0% retrieval success.
