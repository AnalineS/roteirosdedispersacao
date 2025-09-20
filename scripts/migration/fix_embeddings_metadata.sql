-- =============================================================================
-- CORREÇÃO TABELA EMBEDDINGS_METADATA
-- Execute este script se encontrar erro "column operation does not exist"
-- =============================================================================

-- Verificar se a tabela existe e sua estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'embeddings_metadata' 
ORDER BY ordinal_position;

-- Se a tabela existe mas não tem a estrutura correta, recriar
DROP TABLE IF EXISTS embeddings_metadata CASCADE;

-- Recriar tabela com estrutura completa
CREATE TABLE embeddings_metadata (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    avg_similarity REAL DEFAULT 0.0,
    processing_time_ms INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recriar índices
CREATE INDEX IF NOT EXISTS embeddings_metadata_operation_idx ON embeddings_metadata(operation);
CREATE INDEX IF NOT EXISTS embeddings_metadata_created_idx ON embeddings_metadata(created_at DESC);

-- Habilitar RLS para segurança
ALTER TABLE embeddings_metadata ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON embeddings_metadata;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON embeddings_metadata;

CREATE POLICY "Enable read access for all users" ON embeddings_metadata FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON embeddings_metadata FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Inserir dados de teste para validação
INSERT INTO embeddings_metadata (operation, document_count, processing_time_ms)
VALUES ('table_fix_applied', 0, 0);

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'embeddings_metadata' 
ORDER BY ordinal_position;

-- =============================================================================
-- TESTE DA FUNÇÃO cleanup_expired_cache
-- =============================================================================

-- Testar se a função funciona agora
SELECT cleanup_expired_cache();

-- Verificar se o log foi inserido
SELECT * FROM embeddings_metadata WHERE operation LIKE '%cleanup%' ORDER BY created_at DESC LIMIT 3;

COMMENT ON TABLE embeddings_metadata IS 'Tabela corrigida - colunas verificadas e função testada';