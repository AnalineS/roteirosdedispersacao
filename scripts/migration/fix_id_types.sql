-- Script para Corrigir Tipos de ID
-- O problema é incompatibilidade entre TEXT e UUID

-- Primeiro, vamos ver os tipos atuais das tabelas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('medical_embeddings', 'embeddings_metadata') 
AND column_name IN ('id', 'embedding_id')
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Vamos recriar a tabela medical_embeddings com o tipo correto
-- CUIDADO: Isso vai apagar dados existentes!

DROP TABLE IF EXISTS public.embeddings_metadata CASCADE;
DROP TABLE IF EXISTS public.medical_embeddings CASCADE;

-- Recriar medical_embeddings com id como TEXT (para manter compatibilidade)
CREATE TABLE public.medical_embeddings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    text TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB DEFAULT '{}',
    chunk_type VARCHAR(50) NOT NULL,
    priority FLOAT DEFAULT 0.5,
    source_file VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recriar embeddings_metadata com embedding_id como TEXT
CREATE TABLE public.embeddings_metadata (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    embedding_id TEXT,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agora adicionar a foreign key com tipos compatíveis
ALTER TABLE public.embeddings_metadata 
ADD CONSTRAINT fk_embeddings_metadata_embedding_id 
FOREIGN KEY (embedding_id) REFERENCES public.medical_embeddings(id) ON DELETE CASCADE;

-- Recriar os índices
CREATE INDEX medical_embeddings_embedding_idx 
ON public.medical_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX medical_embeddings_metadata_idx 
ON public.medical_embeddings 
USING gin (metadata);

CREATE INDEX medical_embeddings_chunk_type_idx 
ON public.medical_embeddings (chunk_type);

CREATE INDEX medical_embeddings_priority_idx 
ON public.medical_embeddings (priority DESC);

CREATE INDEX embeddings_metadata_embedding_id_idx 
ON public.embeddings_metadata (embedding_id);

-- Verificar resultado
SELECT 'Tabelas recriadas com tipos compatíveis' as status;

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('medical_embeddings', 'embeddings_metadata') 
AND column_name IN ('id', 'embedding_id')
AND table_schema = 'public'
ORDER BY table_name, column_name;