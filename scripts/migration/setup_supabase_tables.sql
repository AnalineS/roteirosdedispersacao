-- =============================================================================
-- SETUP SUPABASE TABLES PARA FASE 3 RAG - ROTEIRO DE DISPENSAÇÃO
-- Execute este script no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Habilitar extensão pgvector (necessário para embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabela principal de embeddings médicos
CREATE TABLE IF NOT EXISTS medical_embeddings (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    embedding VECTOR(384),  -- Dimensões do MiniLM model
    chunk_type TEXT NOT NULL DEFAULT 'general',
    priority REAL NOT NULL DEFAULT 0.5,
    source_file TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para performance otimizada
-- Índice vetorial para busca semântica (ivfflat é eficiente para datasets médios)
CREATE INDEX IF NOT EXISTS medical_embeddings_vector_idx 
ON medical_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Ajustar baseado no volume de dados

-- Índices auxiliares para filtros
CREATE INDEX IF NOT EXISTS medical_embeddings_chunk_type_idx ON medical_embeddings(chunk_type);
CREATE INDEX IF NOT EXISTS medical_embeddings_priority_idx ON medical_embeddings(priority DESC);
CREATE INDEX IF NOT EXISTS medical_embeddings_source_idx ON medical_embeddings(source_file);
CREATE INDEX IF NOT EXISTS medical_embeddings_created_idx ON medical_embeddings(created_at DESC);

-- 4. Tabela de cache de buscas semânticas
CREATE TABLE IF NOT EXISTS search_cache (
    query_hash TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    results JSONB NOT NULL,
    similarity_threshold REAL NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Índice para limpeza automática de cache expirado
CREATE INDEX IF NOT EXISTS search_cache_expires_idx ON search_cache(expires_at);

-- 5. Tabela de metadados para analytics e monitoramento
CREATE TABLE IF NOT EXISTS embeddings_metadata (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    avg_similarity REAL DEFAULT 0.0,
    processing_time_ms INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para queries de analytics
CREATE INDEX IF NOT EXISTS embeddings_metadata_operation_idx ON embeddings_metadata(operation);
CREATE INDEX IF NOT EXISTS embeddings_metadata_created_idx ON embeddings_metadata(created_at DESC);

-- 6. Tabela de contexto RAG (cache de contextos gerados)
CREATE TABLE IF NOT EXISTS rag_context (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    context_generated TEXT NOT NULL,
    source_documents JSONB NOT NULL,  -- Array de document IDs usados
    quality_score REAL DEFAULT 0.0,
    persona_type TEXT DEFAULT 'general',
    language TEXT DEFAULT 'pt-BR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Índice para busca de contexto similar
CREATE INDEX IF NOT EXISTS rag_context_query_idx ON rag_context(query_text);
CREATE INDEX IF NOT EXISTS rag_context_persona_idx ON rag_context(persona_type);
CREATE INDEX IF NOT EXISTS rag_context_expires_idx ON rag_context(expires_at);

-- 7. Tabela para migração de dados JSON estruturados
CREATE TABLE IF NOT EXISTS knowledge_base_migration (
    id SERIAL PRIMARY KEY,
    source_file TEXT NOT NULL,
    json_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    chunks_extracted INTEGER DEFAULT 0,
    embeddings_created INTEGER DEFAULT 0,
    migration_status TEXT DEFAULT 'pending',
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpar search_cache expirado
    DELETE FROM search_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar rag_context expirado
    DELETE FROM rag_context WHERE expires_at < NOW();
    
    -- Log da limpeza
    INSERT INTO embeddings_metadata (operation, document_count, processing_time_ms)
    VALUES ('cache_cleanup', deleted_count, 0);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para busca semântica otimizada
CREATE OR REPLACE FUNCTION search_similar_embeddings(
    query_embedding VECTOR(384),
    similarity_threshold REAL DEFAULT 0.7,
    max_results INTEGER DEFAULT 5,
    filter_chunk_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    doc_id TEXT,
    content TEXT,
    chunk_type TEXT,
    priority REAL,
    source_file TEXT,
    metadata JSONB,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as doc_id,
        e.text as content,
        e.chunk_type,
        e.priority,
        e.source_file,
        e.metadata,
        (1 - (e.embedding <=> query_embedding)) as similarity
    FROM medical_embeddings e
    WHERE (1 - (e.embedding <=> query_embedding)) >= similarity_threshold
        AND (filter_chunk_type IS NULL OR e.chunk_type = filter_chunk_type)
    ORDER BY e.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_embeddings_updated_at
    BEFORE UPDATE ON medical_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_migration_updated_at
    BEFORE UPDATE ON knowledge_base_migration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Views para analytics e monitoramento
CREATE OR REPLACE VIEW embedding_stats
AS
SELECT 
    chunk_type,
    COUNT(*) as document_count,
    AVG(priority) as avg_priority,
    MAX(created_at) as last_updated
FROM medical_embeddings
GROUP BY chunk_type
ORDER BY document_count DESC;

-- Definir explicitamente como SECURITY INVOKER
ALTER VIEW embedding_stats SET (security_invoker = on);

CREATE OR REPLACE VIEW daily_search_stats
AS
SELECT 
    DATE(created_at) as search_date,
    COUNT(*) as search_count,
    AVG(result_count) as avg_results_returned,
    AVG(similarity_threshold) as avg_similarity_threshold
FROM search_cache
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY search_date DESC;

-- Definir explicitamente como SECURITY INVOKER
ALTER VIEW daily_search_stats SET (security_invoker = on);

-- 12. RLS (Row Level Security) - Habilitar para segurança
ALTER TABLE medical_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_migration ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas para leitura pública (ajustar conforme necessário)
CREATE POLICY "Enable read access for all users" ON medical_embeddings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON search_cache FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON embeddings_metadata FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON rag_context FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON knowledge_base_migration FOR SELECT USING (true);

-- Políticas para operações de escrita (restritivas por padrão)
CREATE POLICY "Enable insert for authenticated users" ON medical_embeddings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON search_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON embeddings_metadata FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON rag_context FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON knowledge_base_migration FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 13. Inserir dados de teste para validação
INSERT INTO embeddings_metadata (operation, document_count, processing_time_ms)
VALUES ('supabase_setup', 0, 0)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VALIDAÇÃO FINAL
-- =============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN (
    'medical_embeddings',
    'search_cache', 
    'embeddings_metadata',
    'rag_context',
    'knowledge_base_migration'
)
ORDER BY tablename;

-- Verificar extensão pgvector
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Verificar funções criadas
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('cleanup_expired_cache', 'search_similar_embeddings');

-- =============================================================================
-- COMANDOS ÚTEIS PARA MANUTENÇÃO
-- =============================================================================

-- Limpar cache manualmente:
-- SELECT cleanup_expired_cache();

-- Ver estatísticas de embeddings:
-- SELECT * FROM embedding_stats;

-- Ver estatísticas de busca dos últimos 7 dias:
-- SELECT * FROM daily_search_stats WHERE search_date >= NOW() - INTERVAL '7 days';

-- Verificar tamanho das tabelas:
-- SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats
-- WHERE tablename = 'medical_embeddings';

-- =============================================================================
-- SETUP COMPLETO! [OK]
-- Execute queries de teste na aplicação Python para validar funcionamento
-- =============================================================================