-- Script de Setup das Tabelas Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- Data: 2025-01-30

-- Habilitar extensão pgvector se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela de teste (usada para validar conexão)
CREATE TABLE IF NOT EXISTS public.test (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro de teste
INSERT INTO public.test (created_at) VALUES (NOW()) ON CONFLICT DO NOTHING;

-- Criar tabela principal de embeddings médicos
CREATE TABLE IF NOT EXISTS public.medical_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    embedding vector(384),  -- Dimensão para sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
    metadata JSONB DEFAULT '{}',
    chunk_type VARCHAR(50) NOT NULL,
    priority FLOAT DEFAULT 0.5,
    source_file VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca vetorial eficiente
CREATE INDEX IF NOT EXISTS medical_embeddings_embedding_idx 
ON public.medical_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Criar índice para metadados
CREATE INDEX IF NOT EXISTS medical_embeddings_metadata_idx 
ON public.medical_embeddings 
USING gin (metadata);

-- Criar índice para chunk_type
CREATE INDEX IF NOT EXISTS medical_embeddings_chunk_type_idx 
ON public.medical_embeddings (chunk_type);

-- Criar índice para priority
CREATE INDEX IF NOT EXISTS medical_embeddings_priority_idx 
ON public.medical_embeddings (priority DESC);

-- Criar tabela de metadados de embeddings
CREATE TABLE IF NOT EXISTS public.embeddings_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding_id UUID,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar constraint de foreign key após criar a tabela
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_embeddings_metadata_embedding_id'
    ) THEN
        ALTER TABLE public.embeddings_metadata 
        ADD CONSTRAINT fk_embeddings_metadata_embedding_id 
        FOREIGN KEY (embedding_id) REFERENCES public.medical_embeddings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Criar índice para embeddings_metadata
CREATE INDEX IF NOT EXISTS embeddings_metadata_embedding_id_idx 
ON public.embeddings_metadata (embedding_id);

-- Criar tabela de cache de buscas
CREATE TABLE IF NOT EXISTS public.search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Criar índice único para query_hash
CREATE UNIQUE INDEX IF NOT EXISTS search_cache_query_hash_idx 
ON public.search_cache (query_hash);

-- Criar índice para expiração
CREATE INDEX IF NOT EXISTS search_cache_expires_at_idx 
ON public.search_cache (expires_at);

-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    source_type VARCHAR(50),
    source_path VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para documents
CREATE INDEX IF NOT EXISTS documents_source_type_idx 
ON public.documents (source_type);

CREATE INDEX IF NOT EXISTS documents_metadata_idx 
ON public.documents 
USING gin (metadata);

-- Criar tabela de histórico de chat (para análise futura)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100),
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    persona VARCHAR(50),
    context_used JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para chat_history
CREATE INDEX IF NOT EXISTS chat_history_session_id_idx 
ON public.chat_history (session_id);

CREATE INDEX IF NOT EXISTS chat_history_persona_idx 
ON public.chat_history (persona);

CREATE INDEX IF NOT EXISTS chat_history_created_at_idx 
ON public.chat_history (created_at DESC);

-- Criar função de busca por similaridade
CREATE OR REPLACE FUNCTION search_similar_embeddings(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    text TEXT,
    chunk_type VARCHAR,
    priority FLOAT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.id,
        me.text,
        me.chunk_type,
        me.priority,
        me.metadata,
        1 - (me.embedding <=> query_embedding) AS similarity
    FROM medical_embeddings me
    WHERE 1 - (me.embedding <=> query_embedding) > match_threshold
    ORDER BY 
        me.priority DESC,
        me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Criar função de limpeza de cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM search_cache 
    WHERE expires_at < NOW();
END;
$$;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS update_medical_embeddings_updated_at ON public.medical_embeddings;
CREATE TRIGGER update_medical_embeddings_updated_at
    BEFORE UPDATE ON public.medical_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Garantir permissões corretas (ajustar conforme necessário)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '[OK] Tabelas criadas com sucesso!';
    RAISE NOTICE '[REPORT] Tabelas disponíveis:';
    RAISE NOTICE '   - test (validação de conexão)';
    RAISE NOTICE '   - medical_embeddings (vetores principais)';
    RAISE NOTICE '   - embeddings_metadata (metadados)';
    RAISE NOTICE '   - search_cache (cache de buscas)';
    RAISE NOTICE '   - documents (documentos fonte)';
    RAISE NOTICE '   - chat_history (histórico de conversas)';
    RAISE NOTICE '[START] Pronto para receber dados!';
END $$;