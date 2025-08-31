# [AUTH] Gerenciamento de Secrets com GitHub CLI

## Abordagem Sem Arquivos .env Locais

Este projeto **NÃO usa arquivos .env locais**. Todos os secrets são gerenciados através do GitHub Secrets e acessados via GitHub CLI durante o desenvolvimento.

## [START] Setup Inicial

### 1. Instalar GitHub CLI

```bash
# Windows (winget)
winget install --id GitHub.cli

# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
```

### 2. Autenticar no GitHub

```bash
gh auth login
```

Escolha:
- GitHub.com
- HTTPS
- Login with web browser

### 3. Verificar Autenticação

```bash
gh auth status
```

## [LIST] Secrets Disponíveis

Para listar todos os secrets do repositório:

```bash
gh secret list -R AnalineS/siteroteirodedispersacao
```

### Secrets Principais:

| Secret | Uso | Última Atualização |
|--------|-----|-------------------|
| `SUPABASE_PROJECT_URL` | URL do projeto Supabase | 2 horas atrás |
| `SUPABASE_API_KEY` | Chave API do Supabase | 2 horas atrás |
| `OPENROUTER_API_KEY` | API para modelos AI | 28 dias atrás |
| `FIREBASE_*` | Configurações Firebase | 3 semanas atrás |
| `GCP_SA_KEY` | Service Account GCP | 1 semana atrás |

## [TARGET] Executar Migração Supabase

### Opção 1: Script Unificado (Recomendado)

```bash
cd apps/backend
python scripts/setup_with_github_secrets.py
```

Escolha a opção 1 para migração.

### Opção 2: Execução Manual

```bash
cd apps/backend

# Windows CMD
set SUPABASE_URL=cole_sua_url_aqui
set SUPABASE_KEY=cole_sua_key_aqui

# Windows PowerShell
$env:SUPABASE_URL="cole_sua_url_aqui"
$env:SUPABASE_KEY="cole_sua_key_aqui"

# Linux/Mac
export SUPABASE_URL=cole_sua_url_aqui
export SUPABASE_KEY=cole_sua_key_aqui

# Executar migração
python scripts/migrate_json_to_supabase.py
```

## [TEST] Executar Testes

### Com Script Unificado

```bash
cd apps/backend
python scripts/setup_with_github_secrets.py
```

Escolha a opção 2 para testes.

### Testes Individuais

```bash
cd apps/backend

# Configurar credenciais (mesmas instruções acima)

# Teste de importações
python scripts/test_imports.py

# Teste do sistema OpenAI/Personas
python scripts/test_openai_system.py

# Teste do cache
python scripts/test_cache_system.py
```

## [SEARCH] Verificar Resultados

### No Supabase Dashboard

1. Acesse https://app.supabase.com
2. Vá em **Table Editor**
3. Verifique as tabelas:
   - `embeddings` - Vetores de embeddings
   - `documents` - Documentos indexados
   - `chat_history` - Histórico de conversas

### Logs e Relatórios

Os testes geram relatórios em:
```
apps/backend/qa-reports/
```

## [WARNING] Importante

### Segurança

- **NUNCA** commite valores de secrets no código
- **NUNCA** crie arquivos .env com secrets reais
- **SEMPRE** use GitHub Secrets para valores sensíveis

### Para CI/CD

O GitHub Actions já tem acesso automático aos secrets configurados. Não é necessária nenhuma configuração adicional.

### Para Desenvolvimento Local

Sempre use uma das abordagens documentadas acima:
1. Script `setup_with_github_secrets.py` (mais fácil)
2. Configuração manual de variáveis de ambiente (mais controle)

## [NOTE] Adicionar Novos Secrets

Para adicionar um novo secret ao repositório:

```bash
# Via GitHub CLI
gh secret set NOME_DO_SECRET -R AnalineS/siteroteirodedispersacao

# Ou via interface web
# GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret
```

## 🛠️ Troubleshooting

### GitHub CLI não autenticado

```bash
gh auth login
```

### Secret não encontrado

Verifique se o secret existe:
```bash
gh secret list -R AnalineS/siteroteirodedispersacao
```

### Permissão negada

Verifique suas permissões no repositório. Você precisa de acesso de escrita para gerenciar secrets.

## 📚 Referências

- [GitHub CLI Docs](https://cli.github.com/manual/)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Docs](https://supabase.com/docs)

---

**Última atualização:** 30/01/2025  
**Mantido por:** Claude Code & Ana