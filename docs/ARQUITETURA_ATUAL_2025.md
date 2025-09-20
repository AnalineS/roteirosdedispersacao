# Arquitetura Atual do Sistema - 2025

**Data de Atualização**: 19 de setembro de 2025
**Versão**: v2.0 - Arquitetura Modernizada
**Status**: DOCUMENTAÇÃO OFICIAL ATUALIZADA

## Visão Geral

Sistema educacional completo para dispensação de medicamentos para hanseníase, com duas personas de IA especializadas e arquitetura cloud-native moderna.

## Stack Tecnológica Atual

### Frontend
- **Next.js 14** com App Router
- **React 19** + **TypeScript**
- **15 tipos diferentes de testes** (unit, integration, a11y, performance, etc.)
- **Tailwind CSS** para estilização
- **PWA** com Service Worker
- **Deploy**: Google Cloud Run (containerizado)

### Backend
- **Flask 3.1** + **Python**
- **OpenRouter API** com modelos Llama 3.2 e Kimie K2 (free tier)
- **JWT Authentication próprio** (sem Firebase Auth)
- **Rate Limiting** via SQLite
- **Deploy**: Google Cloud Run (containerizado)

### Armazenamento de Dados

#### 1. Dados Estruturados
- **SQLite local** com backup automático no Google Cloud Storage
- **Gerenciador híbrido**: `apps/backend/services/storage/sqlite_manager.py`
- **Sync automático** a cada 5 minutos

#### 2. Vector Store & RAG
- **Supabase PostgreSQL** com extensão pgvector (produção)
- **ChromaDB** para desenvolvimento local e fallback
- **OpenAI embeddings** para vectorização
- **Busca semântica** integrada

#### 3. Storage de Assets
- **Google Cloud Storage** para:
  - Backups de SQLite
  - Assets estáticos
  - Cache de embeddings
  - Logs e métricas

### Processamento Multimodal
- **OpenCV** para processamento de imagens
- **Tesseract OCR** para extração de texto
- **PIL/Pillow** para manipulação de imagens
- **EasyOCR** como OCR secundário

## Arquitetura de Segurança

### Autenticação & Autorização
- **JWT próprio** via `apps/backend/services/auth/jwt_auth_manager.py`
- **Rate limiting** com SQLite backend
- **Bloqueio automático** após tentativas maliciosas
- **Sanitização de inputs** com bleach + Pydantic

### Proteções Implementadas
- **CSP Headers** configurados
- **CORS** restritivo
- **Input validation** multicamada
- **IP monitoring** para detecção de ataques
- **Logs estruturados** para auditoria

## Sistema de Cache

### Cache Híbrido Unificado
- **Memória local** (LRU com TTL)
- **Google Cloud Storage** para persistência
- **API cache** para responses frequentes
- **Embedding cache** para vectores pré-calculados

### Configuração
```python
# Unified Cache Manager
UNIFIED_CACHE_ENABLED=true
MEMORY_CACHE_SIZE=2000
MEMORY_CACHE_TTL=120  # segundos
CLOUD_CACHE_ENABLED=true
API_CACHE_ENABLED=true
```

## Personas de IA

### Dr. Gasnelio (Técnico)
- **Modelo**: Llama 3.2-3B via OpenRouter
- **Estilo**: Científico, técnico, com citações
- **Validação**: Quality scoring e accuracy checks
- **Uso**: Consultas profissionais, farmacologia

### Gá (Empático)
- **Modelo**: Kimie K2 Chat via OpenRouter
- **Estilo**: Simples, acolhedor, educativo
- **Validação**: Empathy scoring e accessibility
- **Uso**: Explicações para pacientes, suporte emocional

## Deployment

### Google Cloud Run
```yaml
# Frontend (Next.js)
CPU: 1
Memory: 512 MiB
Max instances: 100
Min instances: 0
Port: 3000

# Backend (Flask)
CPU: 1
Memory: 1 GiB
Max instances: 50
Min instances: 0
Port: 8080
```

### CI/CD Pipeline
- **GitHub Actions** para deploy automático
- **Docker** containerization
- **Multi-stage builds** para otimização
- **Health checks** automáticos

## Estrutura de Testes

### Frontend (15 tipos)
```bash
npm run test:unit              # Testes unitários
npm run test:integration       # Testes de integração
npm run test:a11y              # Accessibility
npm run test:performance       # Performance
npm run test:educational       # Casos educacionais
npm run test:clinical-cases    # Casos clínicos
npm run test:personas          # Testes de personas
npm run test:consistency       # Consistência
npm run test:cache             # Sistema de cache
npm run test:rag               # RAG system
```

### Backend
- **Health checks** automáticos via `/api/health`
- **API testing** via curl e scripts
- **Vector store testing** para RAG
- **Security testing** para vulnerabilidades

## Configurações de Ambiente

### Variáveis Obrigatórias (GitHub Secrets)
```bash
# Core
SECRET_KEY=your-secret-key
OPENROUTER_API_KEY=your-openrouter-key

# Supabase (Vector Store)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Google Cloud Storage
CLOUD_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=service-account.json

# Features
EMBEDDINGS_ENABLED=true
RAG_AVAILABLE=true
ADVANCED_FEATURES=true
UNIFIED_CACHE_ENABLED=true
```

## APIs Principais

### Core Endpoints
- `POST /api/chat` - Interface principal de chat
- `GET /api/personas` - Informações das personas
- `GET /api/health` - Health check completo
- `POST /api/feedback` - Coleta de feedback

### Specialized Endpoints
- `GET /api/stats` - Métricas do sistema
- `POST /api/scope` - Verificação de escopo
- `GET /api/usability/monitor` - Monitoramento UX

## Performance

### Métricas Esperadas
- **Page Load**: < 2 segundos
- **API Response**: < 500ms
- **Vector Search**: < 200ms
- **Chat Response**: < 5 segundos
- **Uptime**: > 99.9%

### Otimizações
- **Code splitting** automático (Next.js)
- **Image optimization** desabilitada (Cloud Run compatibility)
- **Bundle size**: ~100kB first load
- **Lazy loading** de embeddings
- **Connection pooling** para databases

## Monitoramento

### Logs
- **Structured JSON logging** para produção
- **Google Cloud Logging** integrado
- **Request IDs** para rastreamento
- **Error tracking** com contexto

### Métricas
- **Cloud Run metrics** nativo
- **Custom metrics** via API
- **User analytics** básico
- **Performance monitoring** automático

## Base de Conhecimento

### Fontes Primárias
- `data/knowledge_base/Roteiro de Dispensação - Hanseníase.md`
- `data/knowledge_base/roteiro_hanseniase_basico.md`

### Dados Estruturados
- `data/structured/clinical_taxonomy.json`
- `data/structured/dispensing_workflow.json`
- `data/structured/dosing_protocols.json`
- `data/structured/pharmacovigilance_guidelines.json`

### Vector Embeddings
- **384 dimensões** (MiniLM model)
- **Cosine similarity** para busca
- **Threshold**: 0.7 para relevância
- **Chunk size**: 512 tokens

## Migração de Tecnologias Obsoletas

### Removido/Substituído ❌
- ~~Firebase Authentication~~ → JWT próprio
- ~~Firebase Firestore~~ → SQLite + Cloud Storage
- ~~Redis Cache~~ → Cache híbrido unificado
- ~~AstraDB~~ → Supabase PostgreSQL
- ~~React/Vite~~ → Next.js 14

### Mantido/Atualizado ✅
- **Flask** 3.0 → 3.1 (security updates)
- **OpenRouter** (mantido)
- **Personas system** (aprimorado)
- **RAG system** (modernizado)
- **Security framework** (fortalecido)

## Desenvolvimento Local

### Setup Frontend
```bash
cd apps/frontend-nextjs
npm install
npm run dev  # porta 3000
```

### Setup Backend
```bash
cd apps/backend
pip install -r requirements.txt
python main.py  # porta 8080
```

### Configuração Local
```bash
# Criar .env local (desenvolvimento)
cp apps/backend/.env.example apps/backend/.env
# Editar com suas credenciais locais
```

## Próximos Passos

### Q4 2025
1. **Otimização de performance** avançada
2. **Expansão do sistema de testes** para 20+ tipos
3. **Integração com Google Analytics** avançado
4. **Sistema de métricas** próprio

### 2026
1. **Machine Learning** personalizado
2. **Processamento de voz** (speech-to-text)
3. **Inteligência preditiva** para casos clínicos
4. **Mobile app** nativo

---

**Gerado por**: Claude Code
**Validado em**: 19 de setembro de 2025
**Próxima revisão**: 19 de dezembro de 2025