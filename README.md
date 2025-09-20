# 🏥 Roteiro de Dispensação - Hanseníase

Sistema moderno de apoio à dispensação farmacêutica para hanseníase, desenvolvido com tecnologias de ponta e IA.

> **✅ Sistema de Labels Inteligente ATIVO**: Labels automáticos baseados em arquivos alterados, branches e análise de impacto.

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

## [START] Tecnologias

### Frontend
- **Next.js 14** + **React 19** + **TypeScript**
- **App Router** para SSR otimizado
- **TailwindCSS** para estilização
- **PWA** com Service Worker
- **Testes extensivos** (15 tipos diferentes)

### Backend
- **Flask 3.1** + **Python**
- **OpenRouter API** para IA conversacional
- **Sistema RAG** com ChromaDB e OpenAI embeddings
- **Google Cloud Storage + SQLite** para persistência híbrida
- **Supabase** para vector store (pgvector)
- **OCR/OpenCV** para processamento multimodal
- **Pydantic** para validação

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