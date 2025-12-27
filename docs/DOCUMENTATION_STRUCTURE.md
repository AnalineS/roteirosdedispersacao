# Estrutura de Documentação - Roteiro de Dispensação

**Data**: 2025-12-26
**Status**: Proposta após cleanup da Issue #12

## Visão Geral

Após a limpeza de ~140 arquivos obsoletos, o repositório mantém 66 arquivos .md organizados em 8 categorias lógicas.

## Estrutura Atual (66 arquivos)

### 1. Raiz do Projeto (10 arquivos)

| Arquivo | Propósito |
|---------|-----------|
| `README.md` | Documentação principal do projeto |
| `CLAUDE.md` | Instruções para Claude Code |
| `CLAUDE-AUTOMATIONS.md` | Configuração de automações |
| `CHANGELOG.md` | Histórico de versões |
| `PRIVACY_POLICY.md` | Política de privacidade (legal) |
| `TERMS_OF_USE.md` | Termos de uso (legal) |
| `MCP_SETUP.md` | Configuração de MCP servers |
| `DEPENDABOT-STRATEGY.md` | Estratégia de atualizações de segurança |
| `SECURITY_ANALYSIS.md` | Análise de segurança do projeto |
| `claude_code_optimization_prompt.md` | Prompts de otimização |

### 2. Configuração Claude (17 arquivos)

```
.claude/
├── agents/                    # Agentes especializados
│   ├── rag-systems-engineer.md
│   └── react-google-workspace-specialist.md
├── automation/               # Automações e docs gerados
│   └── docs/generated/
├── commands/                 # Comandos customizados
│   └── dependabot-check.md
├── docs/                     # Documentação médica
│   └── medical-standards.md
├── production/               # Configuração de produção
│   └── README-PRODUCTION.md
├── templates/                # Templates padronizados
│   ├── component-docs-template.md
│   ├── medical-api-template.md
│   └── test-report-template.md
└── training/                 # Material de treinamento
    ├── automation-workflows.md
    ├── medical-compliance-guide.md
    ├── onboarding-guide.md
    └── slash-commands-tutorial.md
```

### 3. GitHub Actions (2 arquivos)

```
.github/workflows/
├── README.md                 # Documentação de workflows
└── SECURITY_ACTION_HASHES.md # Hashes de segurança
```

### 4. Backend (6 arquivos)

```
apps/backend/
├── DOCKER_OPTIMIZATION_GUIDE.md    # Otimização Docker
├── core/security/README.md         # Segurança backend
├── docs/CLOUD_INTEGRATION_SETUP.md # Setup cloud
├── scripts/README_GITHUB_SECRETS.md # Config secrets
└── tests/
    ├── README.md                   # Doc de testes
    └── TEST_SUITE_SUMMARY.md       # Resumo suíte
```

### 5. Frontend (5 arquivos)

```
apps/frontend-nextjs/
├── PRODUCTION_DEPLOYMENT_CHECKLIST.md  # Checklist deploy
└── src/
    ├── components/chat/
    │   ├── modern/README.md            # Chat moderno
    │   └── README-CHAT-UNIFICADO.md    # Chat unificado
    ├── lib/optimizations/README.md     # Otimizações
    └── services/README-HybridCache.md  # Cache híbrido
```

### 6. Base de Conhecimento (4 arquivos)

```
data/
├── knowledge-base/           # Conteúdo RAG
│   ├── hanseniase.md
│   └── roteiro_hanseniase_basico.md
└── training/                 # Dados de treinamento
    ├── COLAB_INSTRUCTIONS.md
    └── READY_FOR_COLAB.md
```

### 7. Documentação Técnica (16 arquivos)

```
docs/
├── analytics/
│   └── GOOGLE_DATA_STUDIO_SETUP.md
├── deployment/
│   ├── DEPLOY_GUIDE.md
│   ├── DOMAIN_SETUP.md
│   └── ENVIRONMENT_CONFIGURATION.md
├── generated/                # Auto-gerados
│   ├── medical/README.md
│   ├── metrics/README.md
│   ├── security/README.md
│   └── README.md
├── ARQUITETURA_ATUAL_2025.md
├── CI-CD-QUALITY-GATES.md
├── GA4_SETUP_GUIDE.md
├── GITHUB_CONFIGURATION.md
├── MANUAL_OPERATIONS.md
├── REAL_CLOUD_INFRASTRUCTURE.md
├── SECURITY_SCANNING_CONFIGURATION.md
└── WORKFLOWS_STRATEGY.md
```

### 8. Scripts (3 arquivos)

```
scripts/
├── automation/README.md
├── deployment/README.md
└── UPDATE_GCP_KEY.md
```

### 9. Workspace (1 arquivo)

```
.claude-workspace/
└── project-context.md
```

## Documentação na Wiki GitHub (22+ páginas)

Informações de alto nível e guias de referência estão na Wiki:

| Categoria | Páginas |
|-----------|---------|
| Arquitetura | 4 páginas |
| Sistema de Personas | 2 páginas |
| Sistema RAG | 3 páginas |
| Funcionalidades | 3 páginas |
| Guia de Desenvolvimento | 1 página |
| Testes e QA | 1 página |
| Segurança e Compliance | 1 página |
| **Novas (Issue #12)** | |
| Padrões de Escrita e Tom | 1 página |
| Acessibilidade de Componentes | 1 página |
| UX Inclusivo | 1 página |

## Fluxo de Descoberta de Documentação

```
Novo desenvolvedor
└── README.md (visão geral)
    ├── Wiki → Arquitetura (entender sistema)
    ├── CLAUDE.md (setup local)
    ├── .claude/training/onboarding-guide.md (primeiros passos)
    └── docs/ (referência técnica)

Tarefa de deploy
└── docs/deployment/DEPLOY_GUIDE.md
    ├── ENVIRONMENT_CONFIGURATION.md
    ├── DOMAIN_SETUP.md
    └── apps/frontend-nextjs/PRODUCTION_DEPLOYMENT_CHECKLIST.md

Tarefa de segurança
└── SECURITY_ANALYSIS.md
    ├── docs/SECURITY_SCANNING_CONFIGURATION.md
    ├── .github/workflows/SECURITY_ACTION_HASHES.md
    └── apps/backend/core/security/README.md

Tarefa RAG/IA
└── docs/MANUAL_OPERATIONS.md
    ├── data/knowledge-base/*.md
    └── .claude/agents/rag-systems-engineer.md
```

## Manutenção

### Arquivos que NÃO devem ser editados manualmente

- `docs/generated/**` - Gerados automaticamente
- `.claude/automation/docs/generated/**` - Gerados automaticamente
- `CHANGELOG.md` - Atualizado via releases

### Arquivos que requerem aprovação legal

- `PRIVACY_POLICY.md`
- `TERMS_OF_USE.md`

### Arquivos que sincronizam com Wiki

Quando atualizar no repo, considerar atualizar na Wiki:

| Repositório | Wiki |
|-------------|------|
| `docs/ARQUITETURA_ATUAL_2025.md` | Arquitetura |
| `docs/REAL_CLOUD_INFRASTRUCTURE.md` | Arquitetura-Cloud |
| `.claude/docs/medical-standards.md` | Sistema-de-Personas |
| `docs/WORKFLOWS_STRATEGY.md` | Deploy-e-CI-CD |

## Cleanup Realizado (Issue #12)

### Arquivos Excluídos (~140 arquivos)

- Relatórios históricos de PRs/Issues
- Análises de sessões anteriores
- Documentação de migrações concluídas
- Relatórios de segurança aplicados
- Planos de fases concluídas
- Checklists históricos

### Referências Atualizadas

- Removidas referências a Firebase (migrado para Supabase)
- Atualizados secrets do GitHub
- Consolidada documentação RAG

### Páginas Criadas na Wiki

1. **Padrões de Escrita e Tom** - Guidelines de comunicação por persona
2. **Acessibilidade de Componentes** - Padrões ARIA e a11y
3. **UX Inclusivo** - Princípios de design inclusivo
