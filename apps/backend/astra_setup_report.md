# 📊 Relatório de Setup Astra DB - Hanseníase RAG

**Data:** 2025-08-17
**Keyspace:** hanseniase_rag
**Ambiente:** Desenvolvimento/Produção
**Status:** FASE 3.1 CONCLUÍDA

## 🔧 Scripts Criados

### 1. astra_setup.py
- **Localização:** `apps/backend/services/astra_setup.py`
- **Função:** Setup completo do Astra DB com validação
- **Features:**
  - ✅ Validação de credenciais
  - ✅ Teste de conexão com latência
  - ✅ Criação automática de keyspace
  - ✅ Criação de tabelas otimizadas para RAG
  - ✅ Testes CRUD completos
  - ✅ Testes de busca vetorial
  - ✅ Relatório detalhado de status

### 2. check_astra_env_fixed.py
- **Localização:** `apps/backend/check_astra_env_fixed.py`
- **Função:** Verificador de variáveis de ambiente
- **Features:**
  - ✅ Validação de todas as variáveis necessárias
  - ✅ Teste de conectividade básica
  - ✅ Criação de template .env
  - ✅ Guia de configuração de GitHub Secrets

## 🔐 Configuração de Variáveis de Ambiente

### GitHub Secrets Configuradas ✅
As seguintes variáveis estão configuradas nos GitHub Secrets:

- `ASTRA_DB_URL` - URL de conexão do Astra DB
- `ASTRA_DB_TOKEN` - Token de autenticação AstraCS:...
- `ASTRA_DB_KEYSPACE` - hanseniase_rag
- `ASTRA_DB_ENABLED` - true
- `SECRET_KEY` - Chave secreta da aplicação
- `OPENROUTER_API_KEY` - API Key para modelos de IA

### Variáveis Adicionais no app_config.py
```python
# Database Config (AstraDB)
ASTRA_DB_ENABLED: bool = os.getenv('ASTRA_DB_ENABLED', '').lower() == 'true'
ASTRA_DB_URL: Optional[str] = os.getenv('ASTRA_DB_URL')
ASTRA_DB_TOKEN: Optional[str] = os.getenv('ASTRA_DB_TOKEN')
ASTRA_DB_KEYSPACE: Optional[str] = os.getenv('ASTRA_DB_KEYSPACE')
```

## 📊 Schema das Tabelas

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

## 🚨 Troubleshooting

### Erro: "Authentication failed"
- ✅ Verificar se ASTRA_DB_TOKEN está correto
- ✅ Confirmar se token não expirou
- ✅ Validar formato AstraCS:...

### Erro: "No host available"
- ✅ Verificar ASTRA_DB_URL
- ✅ Confirmar se database está ativa
- ✅ Testar conectividade de rede

### Erro: "Keyspace does not exist"
- ✅ Executar script de setup novamente
- ✅ Verificar permissões do token
- ✅ Confirmar nome do keyspace

### Erro: "Vector dimension mismatch"
- ✅ Verificar se embeddings têm 768 dimensões
- ✅ Confirmar modelo de embedding utilizado
- ✅ Recriar tabela se necessário

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

## 🚀 Próximos Passos - FASE 3.2

1. **Migração de Dados Estruturados**
   - Carregar JSONs do conhecimento médico
   - Gerar embeddings para cada chunk
   - Popular tabela embeddings

2. **Otimização de Índices**
   - Configurar índices customizados
   - Ajustar políticas de consistência
   - Implementar cache de queries frequentes

3. **Integração com RAG**
   - Conectar sistema de busca semântica
   - Implementar ranking por relevância médica
   - Configurar fallbacks para casos edge

## ✅ Status da FASE 3.1

**🟢 CONCLUÍDA COM SUCESSO**

- ✅ Scripts de setup criados
- ✅ Configurações validadas
- ✅ Schema otimizado definido
- ✅ Integração com GitHub Secrets
- ✅ Documentação completa
- ✅ Troubleshooting documentado

## 📋 Checklist de Validação

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
**Status:** ✅ COMPLETA