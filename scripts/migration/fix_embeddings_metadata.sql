-- Script de Correção Específica para embeddings_metadata
-- Execute este script para corrigir o problema

-- Primeiro, vamos ver o que existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'embeddings_metadata' AND table_schema = 'public';

-- Se a tabela existe mas está incorreta, vamos recriá-la
DROP TABLE IF EXISTS public.embeddings_metadata CASCADE;

-- Recriar a tabela corretamente
CREATE TABLE public.embeddings_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding_id UUID,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar se a tabela medical_embeddings existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medical_embeddings') THEN
        -- Adicionar constraint se a tabela medical_embeddings existe
        ALTER TABLE public.embeddings_metadata 
        ADD CONSTRAINT fk_embeddings_metadata_embedding_id 
        FOREIGN KEY (embedding_id) REFERENCES public.medical_embeddings(id) ON DELETE CASCADE;
        
        RAISE NOTICE '[OK] Foreign key constraint criada com sucesso';
    ELSE
        RAISE NOTICE '[WARNING] Tabela medical_embeddings não existe - constraint não criada';
    END IF;
END $$;

-- Criar índice
CREATE INDEX embeddings_metadata_embedding_id_idx 
ON public.embeddings_metadata (embedding_id);

-- Verificar resultado
SELECT 'Tabela embeddings_metadata recriada com sucesso' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'embeddings_metadata' AND table_schema = 'public'
ORDER BY ordinal_position;