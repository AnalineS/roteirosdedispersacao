# Arquitetura do Sistema - Roteiros de Dispensação

## 🏗️ Visão Geral da Arquitetura

O sistema é uma aplicação educacional especializada sobre hanseníase, construída com arquitetura moderna baseada em microserviços e AI conversacional.

### 📊 Stack Tecnológica Principal

```
Frontend (Next.js 15) → Backend (Python/FastAPI) → Vector DB (Supabase) → LLM (OpenRouter)
                     ↘                         ↗
                       Cache Layer (Firestore + Memory)
```

## 🎯 Componentes da Arquitetura

### 1. Frontend - Next.js Application
**Localização:** `apps/frontend-nextjs/`

#### Estrutura de Componentes:
```
src/
├── components/
│   ├── chat/modern/          # Sistema de Chat AI
│   ├── layout/               # Layouts e Navegação
│   ├── ui/                   # Componentes Base
│   └── icons/                # Ícones SVG
├── services/                 # Integração API
├── config/                   # Configurações e Temas
└── app/                      # App Router (Next.js 13+)
```

#### Funcionalidades Principais:
- **Chat Conversacional** com personas especializadas
- **Responsive Design** otimizado para mobile
- **Acessibilidade** com ARIA landmarks
- **Temas Modernos** com design system personalizado
- **Upload de Arquivos** (PDFs, imagens, documentos)

### 2. Backend - Python/FastAPI
**Localização:** `apps/backend/`

#### Arquitetura em Camadas:
```
api/             # Endpoints REST
├── routes/      # Definição de rotas
└── middleware/  # Interceptadores HTTP

core/            # Lógica de Negócio
├── ai/          # Sistema de IA
├── security/    # Segurança e Rate Limiting
├── database/    # Abstração de Dados
└── services/    # Serviços Especializados

data/            # Camada de Dados
├── knowledge/   # Base de Conhecimento
└── migrations/  # Migrações de Schema
```

#### Serviços Críticos:
- **AI Orchestrator** - Gerencia personas e LLMs
- **RAG Engine** - Busca semântica em documentos
- **Security Middleware** - Rate limiting e proteção
- **Hybrid Cache** - Cache inteligente multi-camada

### 3. Vector Database - Supabase pgvector
**Configuração:** PostgreSQL com extensão pgvector

#### Schema Principal:
```sql
-- Documentos embeddings
CREATE TABLE knowledge_docs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    category TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca semântica
CREATE INDEX ON knowledge_docs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### Base de Conhecimento:
- **16 documentos** médicos estruturados
- **9 categorias** temáticas
- **Embeddings OpenAI** (text-embedding-ada-002)
- **Busca híbrida** (semântica + texto)

### 4. Sistema de Cache Híbrido

#### Estratégia Multi-Camada:
```python
# Cache Level 1: Memory (Redis-like)
memory_cache = {
    "ttl": 300,  # 5 minutos
    "max_size": 1000
}

# Cache Level 2: Firestore
firestore_cache = {
    "ttl": 3600,  # 1 hora
    "collections": ["embeddings", "responses", "knowledge"]
}
```

#### Políticas de Cache:
- **memory_first** - Prioriza cache em memória
- **smart_invalidation** - Invalidação inteligente
- **batch_operations** - Operações em lote otimizadas

## 🤖 Sistema de IA Conversacional

### Personas Especializadas:

#### 1. Dr. Gasnelio (dr_gasnelio)
- **Perfil:** Médico especialista formal
- **Estilo:** Linguagem técnica precisa
- **Público:** Profissionais de saúde
- **Cor:** Azul (#3b82f6)

#### 2. Gá (ga)
- **Perfil:** Assistente acessível e amigável
- **Estilo:** Linguagem simplificada
- **Público:** Estudantes e público geral
- **Cor:** Verde (#10b981)

### Fluxo de Processamento:
```
User Input → Persona Selection → Context Building → RAG Retrieval → LLM Processing → Response Formatting → UI Rendering
```

## 🔒 Arquitetura de Segurança

### Camadas de Proteção:

#### 1. Rate Limiting Inteligente
```python
RATE_LIMITS = {
    "requests_per_minute": 60,
    "requests_per_hour": 1000,
    "burst_capacity": 20
}
```

#### 2. Middleware de Segurança
- **DDoS Protection** - Detecção de padrões anômalos
- **Input Sanitization** - Limpeza de dados de entrada
- **CORS Configuration** - Controle de origem
- **Authentication** - Tokens JWT

#### 3. Secrets Management
- **GitHub Secrets** - Configurações sensíveis
- **Environment Isolation** - HML/PROD separados
- **Key Rotation** - Rotação automática de chaves

## 🚀 Infraestrutura de Deploy

### Ambientes:

#### Homologação (HML)
```yaml
Environment: HML
URL: https://hml-roteiros-hanseniase.com
Cloud Run: us-central1
Resources: 1 CPU, 2GB RAM
```

#### Produção (PROD)
```yaml
Environment: PROD
URL: https://roteiros-hanseniase.com
Cloud Run: us-central1
Resources: 2 CPU, 4GB RAM
Auto-scaling: 0-100 instances
```

### CI/CD Pipeline:
```
GitHub Push → Security Scan → Build → Test → Deploy → Health Check → Monitoring
```

## 📊 Monitoramento e Observabilidade

### Métricas Principais:
- **Response Time** - Latência de resposta
- **Cache Hit Rate** - Taxa de acerto do cache
- **AI Accuracy** - Precisão das respostas
- **User Engagement** - Engajamento do usuário

### Logs Estruturados:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "service": "ai_orchestrator",
  "persona": "dr_gasnelio",
  "response_time_ms": 850,
  "cache_hit": true,
  "user_satisfaction": 0.95
}
```

## 🔄 Fluxos de Dados Críticos

### 1. Consulta com IA:
```
User Question → Input Validation → Persona Context → Knowledge Retrieval → LLM Call → Response Caching → UI Update
```

### 2. Upload de Arquivo:
```
File Upload → Validation → Processing → Embedding Generation → Vector Storage → Indexing → Search Ready
```

### 3. Cache Warming:
```
System Start → Knowledge Preload → Embedding Cache → Response Templates → Ready State
```

## 📈 Escalabilidade e Performance

### Otimizações Implementadas:
- **Component Memoization** - React.memo para componentes
- **Code Splitting** - Carregamento sob demanda
- **Image Optimization** - Next.js Image component
- **Vector Indexing** - IVFFlat para busca rápida
- **Connection Pooling** - Pool de conexões otimizado

### Limites de Escala:
- **Concurrent Users:** 1.000+ usuários simultâneos
- **Knowledge Base:** 10.000+ documentos
- **Response Time:** <2s (95th percentile)
- **Availability:** 99.9% SLA

## 🔧 Configurações Avançadas

### Feature Flags:
```python
ADVANCED_FEATURES = {
    "embeddings_enabled": True,
    "rag_available": True,
    "security_middleware": True,
    "hybrid_cache": True,
    "file_upload": True,
    "smart_suggestions": True
}
```

### Environment Variables Críticas:
- `SUPABASE_PROJECT_URL` - Endpoint do banco vetorial
- `OPENROUTER_API_KEY` - Acesso aos modelos LLM
- `SECURITY_MIDDLEWARE_ENABLED` - Ativação de segurança
- `VECTOR_DB_TYPE=supabase` - Tipo de banco vetorial
- `HYBRID_CACHE_STRATEGY=memory_first` - Estratégia de cache

## 📋 Status Atual da Arquitetura

### ✅ Componentes Ativos:
- [x] Frontend Next.js 15 com SSR
- [x] Backend FastAPI com AI Orchestrator
- [x] Supabase pgvector com 16 documentos
- [x] Cache híbrido (Memory + Firestore)
- [x] Security Middleware completo
- [x] Deploy automatizado HML/PROD
- [x] Monitoramento básico

### 🔄 Em Desenvolvimento:
- [ ] Monitoramento avançado
- [ ] A/B Testing para personas
- [ ] Analytics de conversação
- [ ] Backup automatizado

---

**Última Atualização:** 15 Janeiro 2025  
**Status:** ✅ ARQUITETURA CONSOLIDADA E ATIVA  
**Ambientes:** HML ✅ | PROD ✅