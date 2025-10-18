-- Supabase Database Schema Setup
-- Execute this script in Supabase Dashboard > SQL Editor

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create main embeddings table
CREATE TABLE IF NOT EXISTS medical_embeddings (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    embedding VECTOR(384),
    chunk_type TEXT NOT NULL DEFAULT 'general',
    priority REAL NOT NULL DEFAULT 0.5,
    source_file TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create vector similarity index (ivfflat for performance)
CREATE INDEX IF NOT EXISTS medical_embeddings_vector_idx
ON medical_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Create auxiliary indexes
CREATE INDEX IF NOT EXISTS medical_embeddings_chunk_type_idx ON medical_embeddings(chunk_type);
CREATE INDEX IF NOT EXISTS medical_embeddings_priority_idx ON medical_embeddings(priority);
CREATE INDEX IF NOT EXISTS medical_embeddings_source_idx ON medical_embeddings(source_file);

-- 5. Create search cache table
CREATE TABLE IF NOT EXISTS search_cache (
    query_hash TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    results JSONB NOT NULL,
    similarity_threshold REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 6. Create metadata analytics table
CREATE TABLE IF NOT EXISTS embeddings_metadata (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    avg_similarity REAL DEFAULT 0.0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Verify setup
SELECT
    'pgvector extension' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
         THEN 'installed' ELSE 'missing' END as status
UNION ALL
SELECT
    'medical_embeddings table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_embeddings')
         THEN 'created' ELSE 'missing' END as status
UNION ALL
SELECT
    'search_cache table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_cache')
         THEN 'created' ELSE 'missing' END as status
UNION ALL
SELECT
    'embeddings_metadata table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'embeddings_metadata')
         THEN 'created' ELSE 'missing' END as status;
