# 🏥 Sistema de Dispensação PQT-U para Hanseníase

Sistema de orientação farmacêutica com IA baseado em tese de doutorado sobre roteiro de dispensação para hanseníase.

## 📁 Estrutura do Projeto

### 🏗️ **NOVA ESTRUTURA REORGANIZADA (v2.0.0)**

```
📦 Site-Roteiro-Dispensacao/
├── 📋 README.md & CHANGELOG.md           # Documentação principal
├── 📋 REPOSITORY_STRUCTURE.md           # Guia completo da estrutura
│
├── 🏥 src/                              # CÓDIGO FONTE
│   ├── backend/                         # Backend Python Flask
│   │   ├── main.py                      # 🚀 Ponto de entrada
│   │   ├── api/                         # Endpoints da API
│   │   ├── core/                        # Lógica central
│   │   │   ├── personas/               # Dr. Gasnelio + Gá
│   │   │   ├── validation/             # Detectores de escopo
│   │   │   └── rag/                    # Sistema RAG
│   │   ├── config/                      # Configurações & prompts
│   │   └── utils/                       # Utilitários
│   └── frontend/                        # Frontend React + TypeScript
│       ├── src/components/              # Componentes React
│       ├── src/pages/                   # Páginas da aplicação
│       └── src/services/                # Serviços de API
│
├── 📊 data/                             # BASE DE CONHECIMENTO
│   ├── hanseniase_thesis.md/.pdf       # Tese original
│   ├── structured/                      # Dados estruturados JSON
│   └── embeddings/                      # Vetores e índices
│
├── 🧪 tests/                            # TESTES E VALIDAÇÃO
│   ├── unit/                           # Testes unitários
│   ├── integration/                     # Testes de integração
│   ├── quality/                         # Validação de qualidade
│   │   ├── scientific/                 # Precisão científica
│   │   ├── usability/                  # Testes de usabilidade
│   │   └── security/                   # Testes de segurança
│   └── reports/                         # Relatórios consolidados
│
├── 📚 docs/                             # DOCUMENTAÇÃO
│   ├── ARCHITECTURE.md                 # Arquitetura do sistema
│   ├── DEVELOPMENT.md                  # Guia de desenvolvimento
│   ├── SECURITY.md                     # Guia de segurança
│   ├── personas/                       # Docs das personas
│   └── api/                            # Documentação da API
│
├── 🚀 deploy/                           # DEPLOY E PRODUÇÃO
│   ├── render.yaml                     # Configuração Render.com
│   ├── docker/                         # Containers Docker
│   ├── scripts/                        # Scripts de deploy
│   └── env/                            # Variáveis de ambiente
│
└── 🔧 tools/                            # FERRAMENTAS
    ├── validation/                      # Scripts de validação
    ├── data_processing/                 # Processamento de dados
    └── monitoring/                      # Monitoramento
```

## 🚀 Início Rápido

### 1. Desenvolvimento Local
```bash
# Usar script automatizado
python tools/monitoring/start_dev_environment.py

# Ou manualmente:
# Backend
cd src/backend
python main.py

# Frontend (novo terminal)
cd src/frontend
npm install
npm run dev
```

### 2. Acesso ao Sistema
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 🧪 Testes

### Validação Científica
```bash
cd tests/scientific_quality
python test_scientific_validation.py
```

### Testes de Integração
```bash
cd tests/integration
python test_backend_frontend.py
```

## 👥 Personas Disponíveis

- **Dr. Gasnelio** - Farmacêutico técnico especialista
- **Gá** - Assistente empático e acolhedor

## 📋 Status do Projeto

- ✅ **Backend Principal:** Funcional e validado
- ✅ **Frontend React:** Interface moderna completa
- ✅ **Validação Científica:** Framework dual implementado
- ✅ **Testes de Integração:** 100% funcionais
- ✅ **Deploy:** Configurado para Render

## 🔧 Para Desenvolvedores

### Estrutura Recomendada
1. **Desenvolvimento normal:** Use `src/backend/main.py`
2. **Testes específicos:** Use arquivos em `development/`
3. **Validação científica:** Execute testes em `tests/scientific_quality/`

### Arquivos Importantes
- `src/backend/README.md` - Guia do backend
- `tests/scientific_quality/README.md` - Guia dos testes científicos
- `docs/` - Documentação técnica completa

## 📚 Baseado em Pesquisa Científica

Sistema desenvolvido com base em tese de doutorado sobre roteiro de dispensação farmacêutica para hanseníase, seguindo protocolos do PCDT Hanseníase 2022 do Ministério da Saúde.