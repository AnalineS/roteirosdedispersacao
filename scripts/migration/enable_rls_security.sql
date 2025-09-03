-- =============================================
-- SCRIPT: Habilitar Row Level Security (RLS) 
-- Data: 2025-01-03
-- Propósito: Corrigir alertas de segurança Supabase
-- =============================================

-- Habilitar RLS para todas as tabelas públicas relacionadas ao RAG
-- Isso é essencial para segurança em produção

-- 1. Tabela de embeddings médicos
ALTER TABLE public.medical_embeddings ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de migração da base de conhecimento
ALTER TABLE public.knowledge_base_migration ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de contexto RAG
ALTER TABLE public.rag_context ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de cache de busca
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- 5. Tabela de metadados de embeddings
ALTER TABLE public.embeddings_metadata ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - Acesso Público para RAG
-- =============================================

-- Para sistema RAG, permitir leitura pública mas escrita restrita
-- Isso é adequado para dados médicos públicos (sem informações pessoais)

-- Política para medical_embeddings - Leitura pública, escrita via service role
DROP POLICY IF EXISTS "medical_embeddings_read_policy" ON public.medical_embeddings;
CREATE POLICY "medical_embeddings_read_policy" ON public.medical_embeddings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "medical_embeddings_write_policy" ON public.medical_embeddings;
CREATE POLICY "medical_embeddings_write_policy" ON public.medical_embeddings
FOR ALL USING (auth.role() = 'service_role');

-- Política para knowledge_base_migration - Apenas service role
DROP POLICY IF EXISTS "knowledge_base_migration_policy" ON public.knowledge_base_migration;
CREATE POLICY "knowledge_base_migration_policy" ON public.knowledge_base_migration
FOR ALL USING (auth.role() = 'service_role');

-- Política para rag_context - Leitura pública, escrita via service role
DROP POLICY IF EXISTS "rag_context_read_policy" ON public.rag_context;
CREATE POLICY "rag_context_read_policy" ON public.rag_context
FOR SELECT USING (true);

DROP POLICY IF EXISTS "rag_context_write_policy" ON public.rag_context;
CREATE POLICY "rag_context_write_policy" ON public.rag_context
FOR ALL USING (auth.role() = 'service_role');

-- Política para search_cache - Leitura pública, escrita via service role
DROP POLICY IF EXISTS "search_cache_read_policy" ON public.search_cache;
CREATE POLICY "search_cache_read_policy" ON public.search_cache
FOR SELECT USING (true);

DROP POLICY IF EXISTS "search_cache_write_policy" ON public.search_cache;
CREATE POLICY "search_cache_write_policy" ON public.search_cache
FOR ALL USING (auth.role() = 'service_role');

-- Política para embeddings_metadata - Leitura pública, escrita via service role
DROP POLICY IF EXISTS "embeddings_metadata_read_policy" ON public.embeddings_metadata;
CREATE POLICY "embeddings_metadata_read_policy" ON public.embeddings_metadata
FOR SELECT USING (true);

DROP POLICY IF EXISTS "embeddings_metadata_write_policy" ON public.embeddings_metadata;
CREATE POLICY "embeddings_metadata_write_policy" ON public.embeddings_metadata
FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- GRANT PERMISSIONS - Service Role
-- =============================================

-- Garantir que o service role tem as permissões necessárias
GRANT ALL ON public.medical_embeddings TO service_role;
GRANT ALL ON public.knowledge_base_migration TO service_role;
GRANT ALL ON public.rag_context TO service_role;
GRANT ALL ON public.search_cache TO service_role;
GRANT ALL ON public.embeddings_metadata TO service_role;

-- Permitir uso das sequences (para INSERTs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- VERIFICAÇÃO - Confirmar RLS Habilitado
-- =============================================

-- Query para verificar se RLS foi habilitado corretamente
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'medical_embeddings',
    'knowledge_base_migration', 
    'rag_context',
    'search_cache',
    'embeddings_metadata'
)
ORDER BY tablename;

-- =============================================
-- LOG DE EXECUÇÃO
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔒 RLS Security Script executed successfully';
    RAISE NOTICE '📅 Date: %', NOW();
    RAISE NOTICE '✅ All RAG tables now have RLS enabled with appropriate policies';
    RAISE NOTICE '🔑 Service role has full access for backend operations';  
    RAISE NOTICE '👥 Public has read access for RAG queries';
END $$;