# 🏥 Roteiro de Dispensação - Hanseníase

**Plataforma educacional médica moderna** para apoio à dispensação farmacêutica de hanseníase, desenvolvida com **arquitetura full-stack**, **IA conversacional avançada** e **automação inteligente**.

## 🎯 Visão Técnica

Sistema **híbrido cloud-native** que combina:
- **Frontend moderno**: Next.js 14 + React 19 + TypeScript
- **Backend especializado**: Flask 3.1 + RAG + Vector DB
- **IA conversacional**: Personas especializadas (Dr. Gasnelio + Gá)
- **Automação avançada**: SuperClaude Framework + CI/CD inteligente
- **Compliance total**: LGPD + WCAG 2.1 AA + Segurança médica

> **🤖 SuperClaude Framework integrado**: Agentes especializados para documentação técnica, análise de requisitos e arquitetura de código.

## 📁 Estrutura do Projeto

```
roteiro-dispensacao/
├── 📱 apps/              # Aplicações principais
│   ├── backend/          # API Flask + Python
│   └── frontend-nextjs/  # Next.js 14 + TypeScript (aplicação principal)
├── [REPORT] data/              # Base de conhecimento
├── 📚 docs/              # Documentação
├── 🛠️  scripts/          # Scripts de deploy e setup
├── [FIX] .github/           # CI/CD workflows
└── ⚙️  firebase.json     # Configuração Firebase
```

## 🔧 Stack Tecnológico

### Frontend Architecture (Next.js 14)
```typescript
// App Router + React Server Components
- Framework: Next.js 14.2+ (App Router)
- Runtime: React 19 + TypeScript 5.0+
- Styling: TailwindCSS 3.4 + CSS Modules
- State: Zustand + React Query (TanStack)
- Testing: Jest + Playwright + Cypress (15 test types)
- PWA: Service Worker + Offline support
- Accessibility: WCAG 2.1 AA compliant
```

### Backend Architecture (Flask 3.1)
```python
# Real Stack - Microservices + RAG + Vector DB
- Framework: Flask 3.1 + Blueprints modulares
- AI/ML: OpenRouter API + Llama 3.2 + Kimie K2
- Vector Store: Supabase PostgreSQL + pgvector
- RAG System: ChromaDB + OpenAI embeddings
- Storage: Google Cloud Storage + SQLite híbrido
- Cache: cachetools (memory) + Google Cloud Storage
- Validation: Pydantic 2.0 + jsonschema
- OCR: OpenCV + Tesseract + EasyOCR + PIL
- Security: PyJWT + cryptography + bleach + CORS
```

### DevOps & Cloud Architecture
```yaml
# Real Infrastructure - Google Cloud Native
- Cloud: Google Cloud Run (containers)
- Storage: Google Cloud Storage (static + backups)
- Database: Supabase PostgreSQL + pgvector (vectors)
- CI/CD: GitHub Actions + Docker multi-stage
- Monitoring: Google Cloud Logging + Monitoring
- Security: CodeQL + LGPD compliance + bandit
- Automation: SuperClaude Framework + Quality hooks
- Testing: 15 tipos de testes automatizados (Jest + Pytest)
```

## 📁 Estrutura do Projeto

```
├── apps/
│   ├── frontend-nextjs/   # Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # Componentes React
│   │   │   ├── hooks/         # Hooks customizados
│   │   │   ├── services/      # APIs e serviços
│   │   │   ├── types/         # TypeScript types
│   │   │   └── utils/         # Utilitários
│   │   └── tests/         # Testes (15 tipos)
│   └── backend/           # API Flask avançada
│       ├── blueprints/    # Blueprints modulares
│       ├── services/      # Serviços especializados
│       ├── core/          # Funcionalidades centrais
│       └── tasks/         # Tasks background
├── data/                  # Base de conhecimento
├── docs/                  # Documentação
└── supabase/              # Configuração Supabase
```

## 🛠️ Desenvolvimento

### Frontend (Next.js)
```bash
cd apps/frontend-nextjs
npm install
npm run dev          # Desenvolvimento (porta 3000)
npm run build        # Build para produção
npm run type-check   # Verificação TypeScript
npm run lint         # ESLint + fixes
npm run test         # Testes (15 tipos)
```

### Backend (Flask)
```bash
cd apps/backend
pip install -r requirements.txt
python main.py       # Servidor desenvolvimento (porta 8080)
```

## [START] Deploy

### Google Cloud Run (Frontend + Backend)
```bash
# Frontend Next.js
cd apps/frontend-nextjs
npm run build
# Deploy automático via GitHub Actions

# Backend Flask
cd apps/backend
# Deploy automático via Docker + Cloud Run
```

## 🔒 Segurança

- **CSP Headers** configurados
- **Rate Limiting** com SQLite backend
- **Input Validation** com Pydantic + bleach
- **CORS** configurado adequadamente
- **JWT Authentication** próprio (sem Firebase Auth)
- **Sanitização automática** de inputs
- **Bloqueio automático** após ataques
- Ver `docs/security/` para detalhes

## 📁 Estrutura do Repositório

```
roteiro-dispensacao/
├── 📁 apps/                     # Aplicações principais
│   ├── backend/                 # Flask API modular (6 blueprints)
│   └── frontend-nextjs/         # Next.js 14 (aplicação principal)
├── 📁 data/                     # Base de conhecimento centralizada
│   ├── structured/              # JSONs estruturados médicos
│   └── embeddings/              # Vetores para RAG
├── 📁 docs/                     # Documentação consolidada
│   ├── project/                 # Documentos principais
│   ├── qa-reports/              # Relatórios QA (ver QA_MASTER_REPORT.md)
│   ├── deployment/              # Guias deploy
│   └── archived/                # Histórico
├── 📁 tests/                    # Testes centralizados
│   ├── backend/                 # Testes backend Python
│   ├── integration/             # Testes integração
│   └── scientific/              # Validação científica
├── 📁 tools/                    # Ferramentas desenvolvimento
│   ├── diagnostics/             # Scripts diagnóstico
│   ├── qa-validation/           # Suites validação
│   ├── deploy/                  # Scripts deploy
│   └── dev-environment/         # Setup desenvolvimento
└── 📁 temp/                     # Arquivos temporários
```

## [LIST] Features

- [OK] Chat IA com personas especializadas
- [OK] Sistema educacional interativo
- [OK] Timeline de medicamentos
- [OK] Componentes acessíveis
- [OK] PWA completo
- [OK] Sistema RAG avançado
- [OK] Cache inteligente
- [OK] Monitoramento de performance

## 👥 Personas Disponíveis

- **Dr. Gasnelio** - Farmacêutico técnico especialista
- **Gá** - Assistente empático e acolhedor

## 🌐 URLs

- **Produção**: https://roteirosdedispensacao.com/
- **API**: Configurável via variáveis de ambiente

## 📚 Baseado em Pesquisa Científica

Sistema desenvolvido com base em tese de doutorado sobre roteiro de dispensação farmacêutica para hanseníase, seguindo protocolos do PCDT Hanseníase 2022 do Ministério da Saúde.

## [NOTE] Licença

Projeto educacional para apoio à dispensação farmacêutica.