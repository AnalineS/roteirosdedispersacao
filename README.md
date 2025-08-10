# 🏥 Roteiro de Dispensação - Hanseníase

Sistema moderno de apoio à dispensação farmacêutica para hanseníase, desenvolvido com tecnologias de ponta e IA.

## 📁 Estrutura do Projeto

```
roteiro-dispensacao/
├── 📱 apps/              # Aplicações principais
│   ├── backend/          # API Flask + Python
│   └── frontend/         # React + TypeScript
├── 📊 data/              # Base de conhecimento
├── 📚 docs/              # Documentação
├── 🛠️  scripts/          # Scripts de deploy e setup
├── 🔧 .github/           # CI/CD workflows
└── ⚙️  firebase.json     # Configuração Firebase
```

## 🚀 Tecnologias

### Frontend
- **React 18** + **TypeScript**
- **Vite** para build otimizado
- **TailwindCSS** para estilização
- **PWA** com Service Worker
- **React Query** para gerenciamento de estado

### Backend
- **Flask 3.0** + **Python**
- **OpenAI API** para IA conversacional
- **Sistema RAG** avançado
- **Redis** para cache
- **Pydantic** para validação

## 📁 Estrutura do Projeto

```
├── src/
│   ├── frontend/          # React App moderna
│   │   ├── src/
│   │   │   ├── components/    # Componentes React
│   │   │   ├── pages/         # Páginas da aplicação
│   │   │   ├── hooks/         # Hooks customizados
│   │   │   ├── services/      # APIs e serviços
│   │   │   └── styles/        # Estilos CSS
│   │   └── public/        # Assets estáticos
│   └── backend/           # API Flask avançada
│       ├── core/          # Funcionalidades principais
│       ├── services/      # Serviços de negócio
│       └── config/        # Configurações
├── data/                  # Base de conhecimento
├── docs/                  # Documentação
└── firebase.json          # Configuração de deploy
```

## 🛠️ Desenvolvimento

### Frontend
```bash
cd src/frontend
npm install
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run type-check   # Verificação de tipos
npm run lint         # Linting
```

### Backend
```bash
cd src/backend
pip install -r requirements.txt
python main.py       # Servidor desenvolvimento
```

## 🚀 Deploy

### Firebase Hosting (Frontend)
```bash
cd src/frontend
npm run build
firebase deploy
```

### Cloud Run (Backend)
```bash
cd src/backend
docker build -t roteiro-backend .
# Deploy via Google Cloud Console
```

## 🔒 Segurança

- **CSP Headers** configurados
- **Rate Limiting** implementado
- **Input Validation** com Pydantic
- **CORS** configurado adequadamente
- Ver `POLITICAS_SEGURANCA_GLOBAL.md` para detalhes

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

## 📋 Features

- ✅ Chat IA com personas especializadas
- ✅ Sistema educacional interativo
- ✅ Timeline de medicamentos
- ✅ Componentes acessíveis
- ✅ PWA completo
- ✅ Sistema RAG avançado
- ✅ Cache inteligente
- ✅ Monitoramento de performance

## 👥 Personas Disponíveis

- **Dr. Gasnelio** - Farmacêutico técnico especialista
- **Gá** - Assistente empático e acolhedor

## 🌐 URLs

- **Produção**: https://roteirosdedispensacao.com/
- **API**: Configurável via variáveis de ambiente

## 📚 Baseado em Pesquisa Científica

Sistema desenvolvido com base em tese de doutorado sobre roteiro de dispensação farmacêutica para hanseníase, seguindo protocolos do PCDT Hanseníase 2022 do Ministério da Saúde.

## 📝 Licença

Projeto educacional para apoio à dispensação farmacêutica.