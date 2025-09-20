# [DEPRECATED] Relatório de Setup Astra DB - Hanseníase RAG

**IMPORTANTE**: Este documento está OBSOLETO. O projeto migrou para:
- **Supabase PostgreSQL** com pgvector (ao invés de AstraDB)
- **ChromaDB** para vector store local
- **Google Cloud Storage** para persistência

**Data:** 2025-08-17
**Status:** MIGRADO PARA SUPABASE

---

# ARQUITETURA ATUAL

## Vector Store
- **Supabase PostgreSQL** com extensão pgvector
- **ChromaDB** para desenvolvimento local
- **OpenAI embeddings** para vectorização

## Configuração Atual
```bash
# Variáveis Supabase (GitHub Secrets)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Arquivos Relevantes
- `apps/backend/services/integrations/supabase_vector_store.py`
- `apps/backend/services/rag/supabase_rag_system.py`
- `supabase/config.toml`

---

# [LEGACY] AstraDB Setup (OBSOLETO)

## [FIX] Scripts Criados

### 1. astra_setup.py
- **Localização:** `apps/backend/services/astra_setup.py`
- **Função:** Setup completo do Astra DB com validação
- **Features:**
  - [OK] Validação de credenciais
  - [OK] Teste de conexão com latência
  - [OK] Criação automática de keyspace
  - [OK] Criação de tabelas otimizadas para RAG
  - [OK] Testes CRUD completos
  - [OK] Testes de busca vetorial
  - [OK] Relatório detalhado de status

### 2. check_astra_env_fixed.py
- **Localização:** `apps/backend/check_astra_env_fixed.py`
- **Função:** Verificador de variáveis de ambiente
- **Features:**
  - [OK] Validação de todas as variáveis necessárias
  - [OK] Teste de conectividade básica
  - [OK] Criação de template .env
  - [OK] Guia de configuração de GitHub Secrets

## [AUTH] Configuração de Variáveis de Ambiente

### GitHub Secrets Atuais [OK]
As seguintes variáveis estão configuradas nos GitHub Secrets:

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_KEY` - Chave de serviço do Supabase
- `SUPABASE_JWT_SECRET` - Secret JWT do Supabase
- `SECRET_KEY` - Chave secreta da aplicação
- `OPENROUTER_API_KEY` - API Key para modelos de IA
- `CLOUD_STORAGE_BUCKET` - Bucket do Google Cloud Storage

### Variáveis Adicionais no app_config.py
```python
# Database Config (AstraDB)
ASTRA_DB_ENABLED: bool = os.getenv('ASTRA_DB_ENABLED', '').lower() == 'true'
ASTRA_DB_URL: Optional[str] = os.getenv('ASTRA_DB_URL')
ASTRA_DB_TOKEN: Optional[str] = os.getenv('ASTRA_DB_TOKEN')
ASTRA_DB_KEYSPACE: Optional[str] = os.getenv('ASTRA_DB_KEYSPACE')
```

## [REPORT] Schema das Tabelas

### embeddings
Tabela principal para armazenamento de vetores:

```sql
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY,
    document_id TEXT,
    chunk_index INT,
    content TEXT,
    embedding VECTOR<FLOAT, 768>,
    metadata MAP<TEXT, TEXT>,
    source_file TEXT,
    source_category TEXT,
    content_type TEXT,
    medical_priority FLOAT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

**Índices criados:**
- `idx_embeddings_document` (document_id)
- `idx_embeddings_source` (source_file)
- `idx_embeddings_category` (source_category)
- `idx_embeddings_type` (content_type)
- `idx_embeddings_priority` (medical_priority)

### analytics
Tabela para análise preditiva:

```sql
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY,
    session_id TEXT,
    user_query TEXT,
    persona_used TEXT,
    response_quality FLOAT,
    medical_accuracy FLOAT,
    user_satisfaction FLOAT,
    query_category TEXT,
    response_tokens INT,
    processing_time_ms INT,
    created_at TIMESTAMP,
    metadata MAP<TEXT, TEXT>
)
```

**Índices criados:**
- `idx_analytics_session` (session_id)
- `idx_analytics_persona` (persona_used)
- `idx_analytics_category` (query_category)
- `idx_analytics_created` (created_at)

## 🔌 Como Executar o Setup

### Em Produção (Cloud Run)
```bash
# As variáveis estão automaticamente disponíveis via GitHub Secrets
python apps/backend/services/astra_setup.py
```

### Em Desenvolvimento Local
1. Crie arquivo `.env` baseado no template:
```bash
cp apps/backend/.env.template apps/backend/.env
# Edite .env com suas credenciais
```

2. Execute o setup:
```bash
python apps/backend/services/astra_setup.py
```

### Via GitHub Actions (Recomendado)
O script pode ser executado automaticamente durante o deploy:

```yaml
- name: Setup Astra DB
  run: python apps/backend/services/astra_setup.py
  env:
    ASTRA_DB_URL: ${{ secrets.ASTRA_DB_URL }}
    ASTRA_DB_TOKEN: ${{ secrets.ASTRA_DB_TOKEN }}
    ASTRA_DB_KEYSPACE: ${{ secrets.ASTRA_DB_KEYSPACE }}
```

## 📈 Métricas de Performance Esperadas

### Conexão
- **Latência:** < 100ms (ideal)
- **Timeout:** 5 segundos
- **Retry Logic:** 3 tentativas automáticas

### Operações CRUD
- **INSERT:** < 50ms por documento
- **SELECT:** < 30ms por query
- **UPDATE:** < 50ms por documento
- **DELETE:** < 30ms por ID

### Busca Vetorial
- **Similarity Search:** < 200ms para 1000 vetores
- **Batch Operations:** 100 documentos por lote
- **Index Optimization:** Automático via Cassandra

## [ALERT] Troubleshooting

### Erro: "Authentication failed"
- [OK] Verificar se ASTRA_DB_TOKEN está correto
- [OK] Confirmar se token não expirou
- [OK] Validar formato AstraCS:...

### Erro: "No host available"
- [OK] Verificar ASTRA_DB_URL
- [OK] Confirmar se database está ativa
- [OK] Testar conectividade de rede

### Erro: "Keyspace does not exist"
- [OK] Executar script de setup novamente
- [OK] Verificar permissões do token
- [OK] Confirmar nome do keyspace

### Erro: "Vector dimension mismatch"
- [OK] Verificar se embeddings têm 768 dimensões
- [OK] Confirmar modelo de embedding utilizado
- [OK] Recriar tabela se necessário

## 🔄 Integração com Backend

### Importação
```python
from services.astra_setup import AstraDBSetup

# Inicializar conexão
astra = AstraDBSetup()
if astra.test_connection()[0]:
    print("Astra DB disponível")
```

### Uso no Sistema de Chat
```python
# Buscar embeddings relevantes
query_vector = get_embedding(user_question)
results = astra.search_similar_vectors(query_vector, limit=5)

# Analisar performance
astra.log_analytics({
    'user_query': user_question,
    'persona_used': 'dr_gasnelio',
    'response_quality': 0.95,
    'processing_time_ms': 150
})
```

## [ATUAL] Status da Migração

1. **Supabase PostgreSQL + pgvector** ✓ IMPLEMENTADO
   - Tabelas otimizadas para embeddings médicos
   - Índices vetoriais configurados
   - Sistema de cache integrado

2. **ChromaDB Local** ✓ IMPLEMENTADO
   - Fallback local para desenvolvimento
   - Performance otimizada
   - Sistema de backup automático

3. **RAG Integrado** ✓ IMPLEMENTADO
   - Busca semântica funcionando
   - Ranking por relevância médica
   - Fallbacks inteligentes implementados

## [OK] Status da FASE 3.1

**[GREEN] CONCLUÍDA COM SUCESSO**

- [OK] Scripts de setup criados
- [OK] Configurações validadas
- [OK] Schema otimizado definido
- [OK] Integração com GitHub Secrets
- [OK] Documentação completa
- [OK] Troubleshooting documentado

## [LIST] Checklist de Validação

- [x] astra_setup.py criado e testado
- [x] check_astra_env_fixed.py funcional
- [x] Schema de tabelas definido
- [x] Índices otimizados configurados
- [x] Integração com app_config.py
- [x] Template .env criado
- [x] Documentação completa
- [x] Guia de troubleshooting
- [x] Próximos passos definidos

---

**Gerado em:** 2025-08-17  
**Versão:** Q2-2025-ML-MODERNIZATION  
**Fase:** 3.1 - Setup Conexão Astra DB  
**Status:** [OK] COMPLETA