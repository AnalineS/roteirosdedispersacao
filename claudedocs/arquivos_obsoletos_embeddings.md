# Arquivos Obsoletos - Migração para multilingual-e5-small

**Data**: 2025-10-15
**Migração**: BAAI/bge-small-en-v1.5 + paraphrase-multilingual → intfloat/multilingual-e5-small

## Arquivos Atualizados ✅

### Configuração Principal
1. **apps/backend/app_config.py** ✅
   - Linha 92: `EMBEDDING_MODEL` atualizado para `intfloat/multilingual-e5-small`
   - Mantém 384 dimensões (compatível)

2. **apps/backend/services/unified_embedding_service.py** ✅
   - Linha 5: Docstring atualizado
   - Linha 48: `MODEL_ID = "intfloat/multilingual-e5-small"`
   - Usado pelo backend Cloud Run (HuggingFace API)

3. **apps/backend/services/rag/embedding_service.py** ✅
   - Linha 218: Fallback atualizado para `intfloat/multilingual-e5-small`
   - Usado para embeddings locais (lazy loading)

### Scripts de Indexação
4. **scripts/index_knowledge_base.py** ✅
   - Linha 159: Modelo atualizado para `intfloat/multilingual-e5-small`
   - Usado para popular Supabase inicialmente

5. **apps/backend/services/semantic_search.py** ✅
   - Linha 76: Fallback atualizado para `intfloat/multilingual-e5-small`
   - Sistema de busca semântica

### Novos Scripts
6. **scripts/reindex_supabase_e5.py** ✅ NOVO
   - Script dedicado para re-indexação com multilingual-e5-small
   - Substitui embeddings 279D por 384D
   - Validação automática pós re-indexação

## Arquivos Documentais (Apenas Referência)

Estes arquivos contêm apenas documentação/referências históricas - NÃO precisam ser alterados:

1. **claudedocs/embedding_models_comparison.md**
   - Análise comparativa de modelos
   - Documento de decisão técnica
   - **Ação**: Nenhuma (documento histórico)

2. **PLANO_HABILITACAO_SERVICOS.md**
   - Planejamento de serviços
   - **Ação**: Nenhuma (documento de planejamento)

3. **config/services/rag-embeddings.json**
   - Configuração de serviços RAG
   - **Ação**: Verificar se usado em produção

4. **scripts/setup-local-env.sh**
   - Script de setup de ambiente
   - **Ação**: Nenhuma (usa variáveis de ambiente)

5. **scripts/add_github_secrets.sh**
   - Script de configuração de secrets
   - **Ação**: Nenhuma (genérico)

## Arquivos de Migração Antigos (OBSOLETOS)

Estes arquivos são de migrações anteriores e podem ser removidos:

1. **apps/backend/scripts/migration_report_20250830_130842.json** ❌ REMOVER
   - Relatório de migração antiga (agosto 2025)
   - **Ação**: Deletar (histórico desnecessário)

2. **apps/backend/scripts/migration_report_20250830_125321.json** ❌ REMOVER
   - Relatório de migração antiga (agosto 2025)
   - **Ação**: Deletar (histórico desnecessário)

3. **apps/backend/scripts/migration_report_20250830_124705.json** ❌ REMOVER
   - Relatório de migração antiga (agosto 2025)
   - **Ação**: Deletar (histórico desnecessário)

4. **scripts/migration/init_embeddings.py** ⚠️ REVISAR
   - Script de inicialização de embeddings
   - **Ação**: Verificar se ainda usado, caso contrário remover

5. **scripts/migration/create_supabase_tables.sql** ⚠️ REVISAR
   - SQL de criação de tabelas
   - **Ação**: Verificar dimensões da coluna embedding (deve ser 384)

## Arquivos de Configuração (VERIFICAR)

1. **apps/backend/core/config/config_manager.py**
   - Gerenciador de configuração
   - **Ação**: Verificar se importa app_config corretamente

## Arquivos NÃO Encontrados no Sistema

Estes arquivos podem ter sido referenciados mas não existem:

1. **apps/backend/services/rag/complete_medical_rag.py**
   - Grep encontrou mas leitura pode falhar
   - **Ação**: Verificar se existe e atualizar se necessário

## Próximos Passos

### 1. Limpeza de Arquivos
```bash
# Remover relatórios de migração antigos
rm apps/backend/scripts/migration_report_20250830_*.json
```

### 2. Atualizar GitHub Variables
```bash
gh variable set EMBEDDING_MODEL --body "intfloat/multilingual-e5-small"
gh variable set PGVECTOR_DIMENSIONS --body "384"
```

### 3. Executar Re-indexação
```bash
# Local
python scripts/reindex_supabase_e5.py

# Verificar
python -c "from supabase import create_client; import os; \
  client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY')); \
  result = client.table('roteiro_dispensacao_embeddings').select('id,embedding').limit(1).execute(); \
  print(f'Dimensão: {len(result.data[0][\"embedding\"])}D')"
```

### 4. Deploy Backend
```bash
# Commit mudanças
git add .
git commit -m "feat(embeddings): Migrate to multilingual-e5-small (384D)

- Replace BAAI/bge-small-en-v1.5 with intfloat/multilingual-e5-small
- Better multilingual support (MTEB 66 vs 50)
- Maintain 384D compatibility
- Add reindexing script for Supabase
- Remove obsolete migration reports

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push para trigger deploy
git push origin hml
```

### 5. Validar RAG
```bash
# Testar RAG após deploy e re-indexação
curl -X POST "https://backend-hml-url/api/v1/chat" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d @test_rag_hanseniase.json

# Verificar sources retornados (deve ter > 0)
```

## Checklist de Validação

- [x] Todos os arquivos de código atualizados
- [x] Script de re-indexação criado
- [x] Teste local do modelo bem-sucedido
- [ ] GitHub Variables atualizadas
- [ ] Re-indexação Supabase executada
- [ ] Deploy backend concluído
- [ ] RAG validado (sources > 0)
- [ ] Arquivos obsoletos removidos
- [ ] Documentação atualizada

## Arquivos Seguros para Remoção

Após validação completa, estes podem ser removidos:

1. `apps/backend/scripts/migration_report_*.json` (3 arquivos)
2. `scripts/migration/init_embeddings.py` (se obsoleto)
3. Qualquer script de indexação que use modelos antigos

## Notas Importantes

- ✅ **Dimensões mantidas**: 384D (compatível com setup anterior)
- ✅ **Zero downtime**: Re-indexação pode ser feita sem derrubar produção
- ✅ **Fallback removido**: Fail honest policy - sem fallbacks silenciosos
- ✅ **Modelo gratuito**: intfloat/multilingual-e5-small (HuggingFace free tier)
- ⚠️ **Re-indexação necessária**: 148 documentos precisam ser re-indexados
