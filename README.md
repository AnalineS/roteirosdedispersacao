# 🏥 Sistema de Dispensação PQT-U para Hanseníase

Sistema de orientação farmacêutica com IA baseado em tese de doutorado sobre roteiro de dispensação para hanseníase.

## 📁 Estrutura do Projeto

```
📦 Site roteiro de dispensação/
├── 🏥 src/backend/               # Backend Flask
│   ├── main.py                  # 🚀 Arquivo principal
│   ├── development/             # Versões para desenvolvimento/teste
│   ├── services/                # Serviços e lógica de negócio
│   └── prompts/                 # Prompts das personas
├── 🌐 src/frontend/             # Frontend React + TypeScript
│   ├── src/                     # Código fonte React
│   └── dist/                    # Build de produção
├── 📊 data/                     # Base de conhecimento
│   ├── knowledge_base/          # Tese e documentos fonte
│   └── structured_knowledge/    # Dados estruturados
├── 🧪 tests/                    # Testes automatizados
│   ├── scientific_quality/      # Validação científica
│   ├── integration/             # Testes de integração
│   └── unit/                    # Testes unitários
├── 🚀 deploy/                   # Configurações de deploy
├── 📚 docs/                     # Documentação
└── 🔧 scripts/                  # Scripts de desenvolvimento
```

## 🚀 Início Rápido

### 1. Desenvolvimento Local
```bash
# Usar script automatizado
python scripts/start_dev_environment.py

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