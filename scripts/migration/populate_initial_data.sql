-- =============================================================================
-- POPULAR DADOS INICIAIS - SISTEMA RAG HANSENÍASE
-- Execute após aplicar as correções de segurança
-- =============================================================================

-- Verificar se as tabelas existem e estão vazias
SELECT 'medical_embeddings' as table_name, COUNT(*) as record_count FROM medical_embeddings
UNION ALL
SELECT 'search_cache', COUNT(*) FROM search_cache
UNION ALL
SELECT 'embeddings_metadata', COUNT(*) FROM embeddings_metadata
UNION ALL
SELECT 'rag_context', COUNT(*) FROM rag_context
UNION ALL
SELECT 'knowledge_base_migration', COUNT(*) FROM knowledge_base_migration;

-- =============================================================================
-- 1. DADOS INICIAIS EMBEDDINGS_METADATA
-- =============================================================================

INSERT INTO embeddings_metadata (operation, document_count, processing_time_ms, success_rate)
VALUES 
    ('initial_setup', 0, 0, 1.0),
    ('database_initialized', 5, 100, 1.0),
    ('security_applied', 0, 50, 1.0);

-- =============================================================================
-- 2. DADOS DE EXEMPLO MEDICAL_EMBEDDINGS
-- =============================================================================

-- Inserir alguns embeddings de exemplo sobre hanseníase
-- Nota: Os vetores aqui são exemplos. Em produção, serão gerados pelos modelos de embedding

-- Primeiro inserir sem embeddings para evitar erro de sintaxe
INSERT INTO medical_embeddings (id, text, chunk_type, priority, source_file, metadata)
VALUES 
    (
        'hans_001',
        'A hanseníase é uma doença infectocontagiosa crônica causada pelo Mycobacterium leprae. É uma das doenças mais antigas conhecidas pela humanidade.',
        'definicao',
        0.9,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "definicao", "pagina": 1, "secao": "introducao"}'::jsonb
    ),
    (
        'hans_002', 
        'O diagnóstico da hanseníase é essencialmente clínico e epidemiológico, realizado através da avaliação dermatoneurológica.',
        'diagnostico',
        0.9,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "diagnostico", "pagina": 5, "secao": "diagnostico_clinico"}'::jsonb
    ),
    (
        'hans_003',
        'A poliquimioterapia (PQT) é o tratamento padrão para hanseníase, constituída por rifampicina, dapsona e clofazimina.',
        'tratamento',
        0.95,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "tratamento", "pagina": 12, "secao": "poliquimioterapia"}'::jsonb
    ),
    (
        'hans_004',
        'Para pacientes paucibacilares, o tratamento dura 6 meses com rifampicina 600mg mensal e dapsona 100mg diária.',
        'posologia',
        0.95,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "posologia", "pagina": 13, "tipo_paciente": "paucibacilar"}'::jsonb
    ),
    (
        'hans_005',
        'Para pacientes multibacilares, o tratamento dura 12 meses com rifampicina 600mg mensal, dapsona 100mg diária e clofazimina 300mg mensal + 50mg diária.',
        'posologia',
        0.95,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "posologia", "pagina": 14, "tipo_paciente": "multibacilar"}'::jsonb
    ),
    (
        'hans_006',
        'A hanseníase em crianças requer dosagem ajustada conforme peso corporal e cuidados especiais no acompanhamento.',
        'pediatrico',
        0.9,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "pediatrico", "pagina": 18, "secao": "tratamento_infantil"}'::jsonb
    ),
    (
        'hans_007',
        'A gravidez não contraindica o tratamento da hanseníase. A rifampicina e dapsona podem ser utilizadas com segurança.',
        'gravidez',
        0.9,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "gravidez", "pagina": 20, "secao": "tratamento_gestante"}'::jsonb
    ),
    (
        'hans_008',
        'Os efeitos adversos mais comuns da PQT incluem alterações gastrintestinais e mudança na coloração da pele pela clofazimina.',
        'efeitos_adversos',
        0.8,
        'protocolo_ministerio_saude.pdf',
        '{"categoria": "efeitos_adversos", "pagina": 16, "secao": "monitoramento"}'::jsonb
    );

-- Atualizar com embeddings de exemplo (vetores fixos para teste)
-- Em produção, estes serão gerados pelos modelos de embedding reais
UPDATE medical_embeddings SET embedding = 
    CASE 
        WHEN id = 'hans_001' THEN (SELECT ('[' || string_agg(0.1::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_002' THEN (SELECT ('[' || string_agg(0.2::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_003' THEN (SELECT ('[' || string_agg(0.3::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_004' THEN (SELECT ('[' || string_agg(0.4::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_005' THEN (SELECT ('[' || string_agg(0.5::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_006' THEN (SELECT ('[' || string_agg(0.6::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_007' THEN (SELECT ('[' || string_agg(0.7::text, ',') || ']')::vector FROM generate_series(1, 384))
        WHEN id = 'hans_008' THEN (SELECT ('[' || string_agg(0.8::text, ',') || ']')::vector FROM generate_series(1, 384))
    END;

-- =============================================================================
-- 3. DADOS INICIAIS KNOWLEDGE_BASE_MIGRATION
-- =============================================================================

INSERT INTO knowledge_base_migration (source_file, json_data, processed, chunks_extracted, embeddings_created, migration_status)
VALUES 
    (
        'protocolo_ministerio_saude.pdf',
        '{"title": "Protocolo Clínico e Diretrizes Terapêuticas - Hanseníase", "pages": 45, "sections": 8}'::jsonb,
        true,
        8,
        8,
        'completed'
    ),
    (
        'casos_clinicos_hanseniase.json',
        '{"casos": 5, "categorias": ["pediatrico", "adulto", "gravidez"], "complexidade": "variada"}'::jsonb,
        false,
        0,
        0,
        'pending'
    );

-- =============================================================================
-- 4. CACHE DE EXEMPLO (OPCIONAL)
-- =============================================================================

-- Inserir alguns exemplos de cache de busca
INSERT INTO search_cache (query_hash, query, results, similarity_threshold, result_count, expires_at)
VALUES 
    (
        md5('tratamento hanseníase'),
        'tratamento hanseníase',
        '[{"id": "hans_003", "similarity": 0.92}, {"id": "hans_004", "similarity": 0.89}]'::jsonb,
        0.7,
        2,
        NOW() + INTERVAL '24 hours'
    ),
    (
        md5('dosagem pediatrica'),
        'dosagem pediatrica',
        '[{"id": "hans_006", "similarity": 0.88}]'::jsonb,
        0.7,
        1,
        NOW() + INTERVAL '24 hours'
    );

-- =============================================================================
-- 5. ATUALIZAR METADADOS
-- =============================================================================

INSERT INTO embeddings_metadata (operation, document_count, processing_time_ms, success_rate)
VALUES ('initial_data_populated', 8, 500, 1.0);

-- =============================================================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================================================

-- Contar registros inseridos
SELECT 'medical_embeddings' as table_name, COUNT(*) as record_count FROM medical_embeddings
UNION ALL
SELECT 'search_cache', COUNT(*) FROM search_cache
UNION ALL
SELECT 'embeddings_metadata', COUNT(*) FROM embeddings_metadata
UNION ALL
SELECT 'rag_context', COUNT(*) FROM rag_context
UNION ALL
SELECT 'knowledge_base_migration', COUNT(*) FROM knowledge_base_migration
ORDER BY table_name;

-- Ver embeddings por categoria
SELECT chunk_type, COUNT(*) as count, AVG(priority) as avg_priority
FROM medical_embeddings 
GROUP BY chunk_type 
ORDER BY count DESC;

-- Ver estatísticas usando as views
SELECT * FROM embedding_stats;

-- Testar busca semântica (exemplo)
-- Usar vetor de 384 dimensões para teste
SELECT 
    id,
    text,
    chunk_type,
    priority,
    (embedding <=> (SELECT ('[' || string_agg(0.15::text, ',') || ']')::vector FROM generate_series(1, 384))) as distance
FROM medical_embeddings 
ORDER BY embedding <=> (SELECT ('[' || string_agg(0.15::text, ',') || ']')::vector FROM generate_series(1, 384))
LIMIT 3;

-- Status final
SELECT 
    'Sistema RAG inicializado com sucesso!' as status,
    NOW() as timestamp,
    (SELECT COUNT(*) FROM medical_embeddings) as total_embeddings,
    (SELECT COUNT(DISTINCT chunk_type) FROM medical_embeddings) as categories;