# GitHub Actions Workflows - Sistema Simplificado

## Workflows Ativos

Após simplificação em 2025-10-19, mantemos apenas 2 workflows essenciais:

### 1. Dependabot Updates (`dependabot.yml`)
- **Propósito**: Gerenciamento automático de atualizações de dependências
- **Triggers**: Agendamento semanal
- **Responsabilidades**:
  - Atualização de dependências npm (frontend Next.js)
  - Atualização de dependências pip (backend Flask)
  - Criação automática de PRs para updates de segurança
  - Integração com Snyk para análise de vulnerabilidades

### 2. Unified Deploy (`deploy-unified.yml`)
- **Propósito**: Deploy unificado para ambientes de staging e produção
- **Triggers**: Push para branches `hml` (staging) e `main` (produção)
- **Responsabilidades**:
  - Build e deploy do frontend Next.js para Google Cloud Run
  - Build e deploy do backend Flask para Google Cloud Run
  - Gestão de secrets e variáveis de ambiente
  - Validações de build e testes integrados no processo de deploy

## Workflows Removidos (2025-10-19)

Workflows removidos para simplificar o CI/CD e eliminar complexidade desnecessária:

- `pr-validation.yml` - Validação de PR com múltiplos gates (causava falsos positivos)
- `daily-health-check.yml` - Monitoramento de saúde diário
- `performance-monitoring.yml` - Monitoramento de performance
- `security-scanning.yml` - Varredura de segurança
- `code-quality-gates.yml` - Gates de qualidade de código
- `monitoring-alerting.yml` - Sistema de alertas
- `index-supabase.yml` - Indexação Supabase
- `index-knowledge-base.yml` - Indexação de base de conhecimento
- `monitoring-unified.yml` - Monitoramento unificado
- `test-rag-accuracy.yml` - Testes de acurácia RAG
- `post-security-update-validation.yml` - Validação pós-atualização
- `dependabot-consolidated.yml` - Dependabot consolidado (duplicado)

### Justificativa da Remoção

1. **Redução de Complexidade**: Foco em workflows essenciais (deploy e manutenção)
2. **Eliminação de Falsos Positivos**: Security gates bloqueavam PRs válidos
3. **Manutenibilidade**: Menos workflows = menos pontos de falha
4. **Simplicidade**: Sistema mais fácil de entender e manter

## Validação de Qualidade

A validação de qualidade agora acontece de forma mais simples e efetiva:

### Validações Locais (Pré-commit)
- ESLint para JavaScript/TypeScript
- TypeScript compiler para validação de tipos
- Prettier para formatação de código
- Hooks de pré-commit impedem commits com erros

### Validações no Deploy (`deploy-unified.yml`)
- Build validation (frontend e backend)
- Testes unitários e de integração
- Verificação de variáveis de ambiente
- Deploy condicional baseado em sucesso dos testes

### Segurança (Snyk + Dependabot)
- Análise automática de vulnerabilidades via Snyk
- PRs automáticos do Dependabot para atualizações de segurança
- Verificação de dependências antes do deploy

## Configuração Necessária

### Secrets do GitHub
Configurados em Settings → Secrets and variables → Actions:
- `GCP_SERVICE_ACCOUNT_KEY` - Autenticação Google Cloud
- `OPENROUTER_API_KEY` - Acesso aos modelos de IA
- `SECRET_KEY` - Chave de segurança da aplicação

### Variáveis de Ambiente
- `NODE_VERSION`: 20
- `PYTHON_VERSION`: 3.11
- `GCP_PROJECT_ID`: ID do projeto no Google Cloud
- `GCP_REGION`: Região de deploy (us-central1)

## Próximos Passos

Se precisar adicionar validações específicas no futuro:
1. Avalie se a validação pode ser feita localmente (pré-commit hooks)
2. Se necessário workflow, adicione como job dentro do `deploy-unified.yml`
3. Use conditional execution para evitar sobrecarga
4. Documente claramente a necessidade do novo workflow

## Documentação Relacionada

- [CLAUDE.md](../../CLAUDE.md) - Instruções para Claude Code
- [README.md](../../README.md) - Visão geral do projeto