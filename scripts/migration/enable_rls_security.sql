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
-- CORREÇÕES DE SEGURANÇA ADICIONAIS
-- =============================================

-- 1. Remover SECURITY DEFINER da view daily_search_stats
-- Views com SECURITY DEFINER executam com permissões do criador
DROP VIEW IF EXISTS public.daily_search_stats;
-- Recriar a view sem SECURITY DEFINER (padrão é SECURITY INVOKER)
CREATE VIEW public.daily_search_stats AS 
SELECT 
    DATE(created_at) as search_date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT query) as unique_queries
FROM public.search_cache 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY search_date DESC;

-- 2. Definir search_path seguro para funções
-- Função: cleanup_expired_cache
ALTER FUNCTION public.cleanup_expired_cache() 
SET search_path = public, pg_temp;

-- Função: update_updated_at_column  
ALTER FUNCTION public.update_updated_at_column()
SET search_path = public, pg_temp;

-- Função: search_similar_embeddings
-- Tentar ambas as assinaturas possíveis da função
DO $$ 
BEGIN
    -- Primeira assinatura: vector(384), float, int
    BEGIN
        ALTER FUNCTION public.search_similar_embeddings(vector(384), float, int)
        SET search_path = public, pg_temp;
    EXCEPTION WHEN undefined_function THEN
        -- Segunda assinatura: vector(384), real, integer, text
        BEGIN
            ALTER FUNCTION public.search_similar_embeddings(vector(384), real, integer, text)
            SET search_path = public, pg_temp;
        EXCEPTION WHEN undefined_function THEN
            -- Terceira assinatura: vector, double precision, integer  
            BEGIN
                ALTER FUNCTION public.search_similar_embeddings(vector, double precision, integer)
                SET search_path = public, pg_temp;
            EXCEPTION WHEN undefined_function THEN
                RAISE NOTICE 'Função search_similar_embeddings não encontrada com nenhuma assinatura conhecida';
            END;
        END;
    END;
END $$;

-- =============================================
-- NOTA SOBRE EXTENSÃO VECTOR
-- =============================================

/*
ALERTA: A extensão 'vector' está instalada no schema public.
Para maior segurança, considere mover para um schema dedicado:

1. Criar schema para extensões:
   CREATE SCHEMA IF NOT EXISTS extensions;

2. Mover a extensão:
   ALTER EXTENSION vector SET SCHEMA extensions;

3. Atualizar funções para usar extensions.vector

IMPORTANTE: Esta mudança requer teste cuidadoso pois pode afetar 
todas as funções que usam o tipo 'vector'.
*/

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