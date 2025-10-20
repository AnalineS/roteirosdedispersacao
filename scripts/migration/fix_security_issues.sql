-- =============================================================================
-- CORREÇÃO PROBLEMAS DE SEGURANÇA SUPABASE
-- Execute este script para resolver:
-- 1. Security Definer View issues
-- 2. RLS Disabled issues
-- =============================================================================

-- =============================================================================
-- 1. CORRIGIR SECURITY DEFINER VIEWS
-- =============================================================================

-- Remover views existentes
DROP VIEW IF EXISTS daily_search_stats CASCADE;
DROP VIEW IF EXISTS embedding_stats CASCADE;

-- Recriar embedding_stats com SECURITY INVOKER
CREATE VIEW embedding_stats 
AS
SELECT 
    chunk_type,
    COUNT(*) as document_count,
    AVG(priority) as avg_priority,
    MAX(created_at) as last_updated
FROM medical_embeddings
GROUP BY chunk_type
ORDER BY document_count DESC;

-- Configurar como SECURITY INVOKER
ALTER VIEW embedding_stats SET (security_invoker = on);

-- Recriar daily_search_stats com SECURITY INVOKER
CREATE VIEW daily_search_stats
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

-- Configurar como SECURITY INVOKER
ALTER VIEW daily_search_stats SET (security_invoker = on);

-- Verificar configuração das views
SELECT schemaname, viewname, viewowner 
FROM pg_views 
WHERE viewname IN ('daily_search_stats', 'embedding_stats');

-- =============================================================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS PÚBLICAS
-- =============================================================================

-- Verificar tabelas sem RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('medical_embeddings', 'search_cache', 'embeddings_metadata', 'rag_context', 'knowledge_base_migration');

-- Habilitar RLS
ALTER TABLE medical_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_migration ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CRIAR POLÍTICAS RLS SEGURAS
-- =============================================================================

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Enable read access for all users" ON medical_embeddings;
DROP POLICY IF EXISTS "Enable read access for all users" ON search_cache;
DROP POLICY IF EXISTS "Enable read access for all users" ON embeddings_metadata;
DROP POLICY IF EXISTS "Enable read access for all users" ON rag_context;
DROP POLICY IF EXISTS "Enable read access for all users" ON knowledge_base_migration;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON medical_embeddings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON search_cache;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON embeddings_metadata;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rag_context;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON knowledge_base_migration;

-- Políticas de leitura (públicas para sistema RAG)
CREATE POLICY "Enable read access for all users" ON medical_embeddings 
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON search_cache 
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON embeddings_metadata 
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON rag_context 
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON knowledge_base_migration 
FOR SELECT USING (true);

-- Políticas de escrita (apenas usuários autenticados)
CREATE POLICY "Enable insert for authenticated users" ON medical_embeddings 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON search_cache 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON embeddings_metadata 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON rag_context 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON knowledge_base_migration 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas de atualização (apenas usuários autenticados)
CREATE POLICY "Enable update for authenticated users" ON medical_embeddings 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON search_cache 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON embeddings_metadata 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON rag_context 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON knowledge_base_migration 
FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================================================
-- 4. VALIDAÇÃO FINAL
-- =============================================================================

-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('medical_embeddings', 'search_cache', 'embeddings_metadata', 'rag_context', 'knowledge_base_migration');

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('medical_embeddings', 'search_cache', 'embeddings_metadata', 'rag_context', 'knowledge_base_migration')
ORDER BY tablename, policyname;

-- Verificar configuração das views
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname IN ('daily_search_stats', 'embedding_stats');

-- Teste final
INSERT INTO embeddings_metadata (operation, document_count, processing_time_ms)
VALUES ('security_fix_applied', 0, 0);

SELECT 'Security fixes applied successfully!' as status;