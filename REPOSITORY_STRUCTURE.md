# 📁 Estrutura do Repositório - Site Roteiro de Dispensação

## 🎯 Organização Definitiva para Produção

```
📦 Site-Roteiro-Dispensacao/
├── 📋 README.md                           # Documentação principal do projeto
├── 📋 requirements.txt                    # Dependências Python
├── 📋 REPOSITORY_STRUCTURE.md            # Este arquivo (estrutura do repositório)
├── 📋 CHANGELOG.md                       # Histórico de versões
│
├── 📁 src/                               # CÓDIGO FONTE PRINCIPAL
│   ├── 📁 backend/                       # Backend Python Flask
│   │   ├── 📄 main.py                    # Ponto de entrada da API
│   │   ├── 📄 __init__.py
│   │   ├── 📁 api/                       # Endpoints da API
│   │   │   ├── 📄 chat.py               # Endpoints de chat
│   │   │   ├── 📄 personas.py           # Endpoints das personas
│   │   │   └── 📄 health.py             # Health checks
│   │   ├── 📁 core/                      # Lógica central
│   │   │   ├── 📁 personas/             # Sistema de personas
│   │   │   │   ├── 📄 dr_gasnelio.py    # Dr. Gasnelio (técnico)
│   │   │   │   ├── 📄 ga_empathetic.py  # Gá (empático)
│   │   │   │   └── 📄 persona_manager.py # Gerenciador de personas
│   │   │   ├── 📁 validation/           # Sistemas de validação
│   │   │   │   ├── 📄 scope_detector.py # Detector de escopo
│   │   │   │   ├── 📄 quality_checker.py # Verificador de qualidade
│   │   │   │   └── 📄 response_validator.py # Validador de respostas
│   │   │   └── 📁 rag/                  # Sistema RAG
│   │   │       ├── 📄 knowledge_base.py # Base de conhecimento
│   │   │       ├── 📄 retriever.py     # Recuperação de documentos
│   │   │       └── 📄 embeddings.py    # Sistema de embeddings
│   │   ├── 📁 config/                   # Configurações
│   │   │   ├── 📄 settings.py          # Configurações gerais
│   │   │   ├── 📄 prompts.py           # Templates de prompts
│   │   │   └── 📄 security.py          # Configurações de segurança
│   │   └── 📁 utils/                    # Utilitários
│   │       ├── 📄 logger.py            # Sistema de logs
│   │       ├── 📄 validators.py        # Validadores
│   │       └── 📄 exceptions.py        # Exceções customizadas
│   │
│   └── 📁 frontend/                     # Frontend React + TypeScript
│       ├── 📄 package.json             # Dependências Node.js
│       ├── 📄 vite.config.ts           # Configuração Vite
│       ├── 📄 tsconfig.json            # Configuração TypeScript
│       ├── 📄 tailwind.config.js       # Configuração Tailwind CSS
│       ├── 📁 src/
│       │   ├── 📄 main.tsx             # Ponto de entrada React
│       │   ├── 📄 App.tsx              # Componente principal
│       │   ├── 📁 components/          # Componentes React
│       │   │   ├── 📁 Chat/            # Componentes do chat
│       │   │   ├── 📁 Personas/        # Componentes das personas
│       │   │   ├── 📁 UI/              # Componentes de interface
│       │   │   └── 📁 Layout/          # Componentes de layout
│       │   ├── 📁 pages/               # Páginas da aplicação
│       │   │   ├── 📄 HomePage.tsx     # Página inicial
│       │   │   ├── 📄 ChatPage.tsx     # Página do chat
│       │   │   ├── 📄 AboutPage.tsx    # Página sobre
│       │   │   └── 📄 ResourcesPage.tsx # Página de recursos
│       │   ├── 📁 services/            # Serviços de API
│       │   │   ├── 📄 api.ts           # Cliente API
│       │   │   └── 📄 personas.ts      # Serviços das personas
│       │   ├── 📁 hooks/               # Hooks customizados
│       │   ├── 📁 types/               # Tipos TypeScript
│       │   └── 📁 styles/              # Estilos CSS
│       └── 📁 public/                  # Arquivos públicos
│           ├── 📄 index.html           # HTML base
│           └── 📁 assets/              # Assets estáticos
│
├── 📁 data/                            # DADOS E CONHECIMENTO
│   ├── 📁 knowledge_base/              # Base de conhecimento original
│   │   ├── 📄 hanseniase_thesis.md    # Tese principal em Markdown
│   │   ├── 📄 hanseniase_thesis.pdf   # Tese principal em PDF
│   │   └── 📄 basic_protocols.md      # Protocolos básicos
│   ├── 📁 structured/                  # Dados estruturados
│   │   ├── 📄 medications.json        # Dados dos medicamentos
│   │   ├── 📄 protocols.json          # Protocolos estruturados
│   │   ├── 📄 dosages.json            # Dosagens e esquemas
│   │   └── 📄 faqs.json               # Perguntas frequentes
│   └── 📁 embeddings/                  # Vetores e embeddings
│       ├── 📄 document_vectors.pkl    # Vetores dos documentos
│       └── 📄 index_metadata.json     # Metadados do índice
│
├── 📁 tests/                          # TESTES E VALIDAÇÃO
│   ├── 📁 unit/                       # Testes unitários
│   │   ├── 📁 backend/                # Testes do backend
│   │   │   ├── 📄 test_personas.py    # Testes das personas
│   │   │   ├── 📄 test_validation.py  # Testes de validação
│   │   │   └── 📄 test_api.py         # Testes da API
│   │   └── 📁 frontend/               # Testes do frontend
│   │       ├── 📄 components.test.tsx # Testes de componentes
│   │       └── 📄 hooks.test.ts       # Testes de hooks
│   ├── 📁 integration/                # Testes de integração
│   │   ├── 📄 test_chat_flow.py       # Fluxo completo do chat
│   │   ├── 📄 test_persona_switching.py # Troca de personas
│   │   └── 📄 test_api_frontend.py    # Integração API-Frontend
│   ├── 📁 quality/                    # Testes de qualidade
│   │   ├── 📁 scientific/             # Validação científica
│   │   │   ├── 📄 test_medical_accuracy.py # Precisão médica
│   │   │   ├── 📄 test_persona_coherence.py # Coerência das personas
│   │   │   └── 📄 test_scope_detection.py # Detecção de escopo
│   │   ├── 📁 usability/              # Testes de usabilidade
│   │   │   ├── 📄 test_interface.py   # Interface do usuário
│   │   │   ├── 📄 test_accessibility.py # Acessibilidade
│   │   │   └── 📄 test_performance.py # Performance
│   │   └── 📁 security/               # Testes de segurança
│   │       ├── 📄 test_input_validation.py # Validação de entrada
│   │       └── 📄 test_security_headers.py # Headers de segurança
│   └── 📁 reports/                    # Relatórios de testes
│       ├── 📄 quality_report.md       # Relatório de qualidade
│       ├── 📄 security_report.md      # Relatório de segurança
│       └── 📁 archived/               # Relatórios arquivados
│
├── 📁 docs/                           # DOCUMENTAÇÃO
│   ├── 📄 ARCHITECTURE.md             # Arquitetura do sistema
│   ├── 📄 API_REFERENCE.md            # Referência da API
│   ├── 📄 DEPLOYMENT.md               # Guia de deploy
│   ├── 📄 SECURITY.md                 # Guia de segurança
│   ├── 📄 DEVELOPMENT.md              # Guia de desenvolvimento
│   ├── 📁 personas/                   # Documentação das personas
│   │   ├── 📄 dr_gasnelio.md          # Documentação Dr. Gasnelio
│   │   └── 📄 ga_empathetic.md        # Documentação Gá
│   └── 📁 api/                        # Documentação da API
│       ├── 📄 endpoints.md            # Endpoints disponíveis
│       └── 📄 examples.md             # Exemplos de uso
│
├── 📁 deploy/                         # CONFIGURAÇÕES DE DEPLOY
│   ├── 📄 render.yaml                 # Configuração Render.com
│   ├── 📁 docker/                     # Configurações Docker
│   │   ├── 📄 Dockerfile.backend      # Docker backend
│   │   ├── 📄 Dockerfile.frontend     # Docker frontend
│   │   └── 📄 docker-compose.yml      # Compose completo
│   ├── 📁 scripts/                    # Scripts de deploy
│   │   ├── 📄 build.sh               # Script de build
│   │   ├── 📄 deploy.sh              # Script de deploy
│   │   └── 📄 health_check.py        # Verificação de saúde
│   └── 📁 env/                        # Variáveis de ambiente
│       ├── 📄 .env.example           # Exemplo de variáveis
│       ├── 📄 production.env         # Variáveis de produção
│       └── 📄 development.env        # Variáveis de desenvolvimento
│
├── 📁 tools/                          # FERRAMENTAS E SCRIPTS
│   ├── 📁 validation/                 # Scripts de validação
│   │   ├── 📄 run_quality_tests.py   # Executar testes de qualidade
│   │   ├── 📄 validate_structure.py  # Validar estrutura
│   │   └── 📄 check_compliance.py    # Verificar conformidade
│   ├── 📁 data_processing/            # Processamento de dados
│   │   ├── 📄 extract_knowledge.py   # Extrair conhecimento
│   │   ├── 📄 generate_embeddings.py # Gerar embeddings
│   │   └── 📄 update_knowledge.py    # Atualizar base
│   └── 📁 monitoring/                 # Monitoramento
│       ├── 📄 log_analyzer.py        # Analisador de logs
│       └── 📄 performance_monitor.py # Monitor de performance
│
└── 📁 .claude-workspace/             # WORKSPACE DO CLAUDE
    ├── 📄 checklist.md               # Checklist de execução
    ├── 📄 project_context.md         # Contexto do projeto
    └── 📄 development_notes.md       # Notas de desenvolvimento
```

## 🎯 Princípios da Organização

### 1. **Separação Clara de Responsabilidades**
- `src/` - Código fonte da aplicação
- `data/` - Dados e base de conhecimento
- `tests/` - Todos os tipos de teste
- `docs/` - Documentação completa
- `deploy/` - Configurações de deploy
- `tools/` - Scripts e ferramentas

### 2. **Estrutura Modular**
- Backend organizado por funcionalidade (API, Core, Config, Utils)
- Frontend seguindo padrões React modernos
- Testes categorizados por tipo e escopo

### 3. **Documentação Abrangente**
- Cada diretório tem sua função clara
- Documentação técnica separada por área
- Exemplos e guias para desenvolvedores

### 4. **Deploy e Produção**
- Configurações centralizadas em `deploy/`
- Scripts automatizados para build e deploy
- Monitoramento e validação integrados

## 🚀 Como Usar Esta Estrutura

1. **Para Desenvolvimento**: Use `src/` para código, `tests/` para validação
2. **Para Deploy**: Configure `deploy/` e use `tools/` para automação
3. **Para Documentação**: Mantenha `docs/` atualizado
4. **Para Dados**: Gerencie conhecimento em `data/`

## 📝 Próximos Passos de Reorganização

1. ✅ Criar estrutura de diretórios
2. 🔄 Mover arquivos existentes para locais apropriados
3. 🔄 Consolidar duplicatas e obsoletos
4. 🔄 Atualizar imports e referências
5. 🔄 Validar funcionalidade pós-reorganização
6. ✅ Documentar mudanças no CHANGELOG

---

**Nota**: Esta estrutura foi projetada para ser clara tanto para humanos quanto para IA, facilitando navegação, manutenção e evolução do projeto.