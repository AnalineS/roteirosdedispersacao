-- Script de Correção para Supabase
-- Execute este script se houve erro na primeira execução

-- Primeiro, vamos remover a tabela problemática se ela existir
DROP TABLE IF EXISTS public.embeddings_metadata CASCADE;

-- Recriar a tabela embeddings_metadata corretamente
CREATE TABLE IF NOT EXISTS public.embeddings_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding_id UUID,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar a constraint de foreign key após criar a tabela
ALTER TABLE public.embeddings_metadata 
ADD CONSTRAINT fk_embeddings_metadata_embedding_id 
FOREIGN KEY (embedding_id) REFERENCES public.medical_embeddings(id) ON DELETE CASCADE;

-- Criar índice para embeddings_metadata
CREATE INDEX IF NOT EXISTS embeddings_metadata_embedding_id_idx 
ON public.embeddings_metadata (embedding_id);

-- Verificar se todas as tabelas foram criadas
DO $$
BEGIN
    RAISE NOTICE '[OK] Verificando tabelas criadas:';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test') THEN
        RAISE NOTICE '   ✓ test';
    ELSE
        RAISE NOTICE '   ✗ test (faltando)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medical_embeddings') THEN
        RAISE NOTICE '   ✓ medical_embeddings';
    ELSE
        RAISE NOTICE '   ✗ medical_embeddings (faltando)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'embeddings_metadata') THEN
        RAISE NOTICE '   ✓ embeddings_metadata';
    ELSE
        RAISE NOTICE '   ✗ embeddings_metadata (faltando)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'search_cache') THEN
        RAISE NOTICE '   ✓ search_cache';
    ELSE
        RAISE NOTICE '   ✗ search_cache (faltando)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        RAISE NOTICE '   ✓ documents';
    ELSE
        RAISE NOTICE '   ✗ documents (faltando)';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_history') THEN
        RAISE NOTICE '   ✓ chat_history';
    ELSE
        RAISE NOTICE '   ✗ chat_history (faltando)';
    END IF;
END $$;