# Guia de Setup: Supabase MCP Server

**Data**: 2025-10-16
**Ambiente**: Development Only
**Segurança**: Produção NUNCA deve ser acessada via MCP

## Pré-requisitos

- [ ] Claude Code instalado e funcionando
- [ ] Conta Supabase ativa
- [ ] Projeto de produção com dados reais (não usar via MCP)
- [ ] Tempo estimado: 30 minutos

## Passo 1: Criar Projeto de Desenvolvimento no Supabase

### 1.1 Criar Novo Projeto

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Configurações:
   - **Name**: `roteiros-dispensacao-dev`
   - **Database Password**: (guardar com segurança)
   - **Region**: `South America (São Paulo)`
   - **Plan**: Free
4. Aguardar criação (~2 minutos)

### 1.2 Copiar Schema de Produção

**IMPORTANTE**: Copiar schema, NÃO dados sensíveis.

```bash
# No projeto de produção (via Supabase Dashboard)
# Settings → Database → Database Settings → Connection String

# OU via CLI (se instalado)
npx supabase db dump --db-url "postgres://postgres:[password]@[prod-host]:5432/postgres" > schema.sql

# Aplicar no projeto dev
psql "postgres://postgres:[dev-password]@[dev-host]:5432/postgres" < schema.sql
```

**Alternativa via Supabase Dashboard**:
1. Produção: SQL Editor → Run `\dt` para listar tabelas
2. Copiar DDL de cada tabela importante:
   - `roteiro_dispensacao_embeddings`
   - Outras tabelas do projeto
3. Dev: SQL Editor → Executar DDL copiado

### 1.3 Anotar Credenciais do Dev Project

Guardar em local seguro (NÃO commitar):
- Project URL: `https://[project-id].supabase.co`
- Anon Key: `eyJhbG...`
- Service Role Key: `eyJhbG...`

## Passo 2: Configurar MCP no Claude Code

### 2.1 Arquivo de Configuração

O arquivo `.claude/mcp.json` já foi criado com:
- Supabase MCP configurado para dev
- Context7 para documentação
- Playwright para testes

### 2.2 Verificar Configuração

```bash
cat .claude/mcp.json | grep supabase
```

Deve mostrar:
```json
"supabase-dev": {
  "url": "https://mcp.supabase.com/mcp"
}
```

### 2.3 Reiniciar Claude Code

1. Fechar todas as janelas do Claude Code
2. Reabrir o projeto
3. Claude Code detectará nova configuração MCP

## Passo 3: Autenticação OAuth2

### 3.1 Primeira Conexão

Quando você usar um comando Supabase pela primeira vez:

```
User: "Liste as tabelas do projeto Supabase"
```

Claude Code irá:
1. Detectar que precisa autenticar
2. Abrir browser automaticamente
3. Mostrar tela de login do Supabase

### 3.2 Processo de Autenticação

**No Browser**:
1. Login com sua conta Supabase
2. Tela de autorização aparecerá
3. **CRÍTICO**: Selecione **APENAS** o projeto `roteiros-dispensacao-dev`
4. **NÃO** selecione o projeto de produção
5. Clique em "Authorize"

### 3.3 Confirmação

Browser mostrará: "Authentication successful! You can close this window."

Claude Code mostrará: "✅ Connected to Supabase project: roteiros-dispensacao-dev"

## Passo 4: Selecionar Feature Groups

### 4.1 Features Habilitadas

Conforme `.claude/mcp.json`:
- ✅ `database` - Schema, queries, migrations
- ✅ `docs` - Documentação híbrida
- ✅ `debugging` - Logs e advisors
- ✅ `development` - TypeScript types
- ✅ `functions` - Edge Functions
- ✅ `storage` - Buckets e arquivos

### 4.2 Features Desabilitadas

- ❌ `branching` - Requer plano pago
- ❌ `account` - Não necessário para dev

### 4.3 Modificar Features (Opcional)

Se quiser mudar:
1. Acesse https://supabase.com/mcp
2. Login
3. Customize feature groups
4. Copie novo JSON
5. Atualize `.claude/mcp.json`

## Passo 5: Testar Conexão

### 5.1 Teste Básico de Docs

```
User: "Pesquise na documentação do Supabase sobre vector embeddings"
```

Esperado: Claude retorna documentação relevante sobre pgvector.

### 5.2 Teste de Database

```
User: "Liste as tabelas do meu projeto Supabase dev"
```

Esperado: Lista com `roteiro_dispensacao_embeddings` e outras.

### 5.3 Teste de Performance Advisor

```
User: "Execute performance advisor na tabela roteiro_dispensacao_embeddings"
```

Esperado: Recomendações de índices, statistics, etc.

## Passo 6: Validar Segurança

### 6.1 Confirmar Projeto Conectado

```
User: "Qual projeto Supabase está conectado?"
```

Esperado: `roteiros-dispensacao-dev` (NÃO produção)

### 6.2 Testar Read-Only (Opcional)

Se quiser ativar modo read-only:
1. Supabase Dashboard → SQL Editor
2. Criar usuário read-only:
```sql
CREATE ROLE claude_mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO claude_mcp_readonly;
```
3. Usar esse role nas queries do MCP

## Workflows Seguros de Uso

### Workflow 1: Design de Schema

**Objetivo**: Criar nova tabela para feedback de usuários

**Passos**:
1. **Design via MCP**:
   ```
   User: "Crie uma tabela user_feedback com colunas:
   - id (uuid primary key)
   - user_id (uuid not null)
   - persona_id (text)
   - rating (integer 1-5)
   - comment (text)
   - created_at (timestamp)"
   ```

2. **Review Manual**:
   - Claude gera SQL
   - Você revisa ANTES de executar
   - Verifica constraints, índices, RLS policies

3. **Test em Dev**:
   - Executa no projeto dev
   - Testa inserções/queries
   - Valida performance

4. **Criar Migration**:
   ```sql
   -- migration_001_user_feedback.sql
   [SQL gerado e validado]
   ```

5. **Code Review**:
   - Commita migration
   - Pull request
   - Review por outro dev (se aplicável)

6. **Deploy via CI/CD**:
   - GitHub Actions aplica migration em produção
   - Rollback disponível se necessário

### Workflow 2: Testing de Query Complexa

**Objetivo**: Busca vetorial otimizada

**Passos**:
1. **Descrever Query**:
   ```
   User: "Crie uma query para buscar os 5 embeddings mais similares ao vetor [0.1, 0.2, ...]
   usando similaridade de cosseno, com threshold 0.5"
   ```

2. **Review SQL**:
   - Claude gera query com pgvector
   - Você valida sintaxe e lógica

3. **Test Performance**:
   ```
   User: "Execute EXPLAIN ANALYZE nessa query"
   ```

4. **Otimizar**:
   - Claude sugere índices
   - Você aplica em dev e mede impacto

5. **Production Code**:
   - Copia query otimizada
   - Adiciona ao código Python
   - Testa em staging antes de prod

### Workflow 3: Debug de Performance

**Objetivo**: Identificar queries lentas

**Passos**:
1. **Solicitar Advisor**:
   ```
   User: "Execute performance advisor e me mostre problemas"
   ```

2. **Analisar Recomendações**:
   - Missing indexes
   - Table statistics outdated
   - Inefficient queries

3. **Testar Fixes**:
   - Aplicar índices sugeridos em dev
   - Comparar EXPLAIN ANALYZE antes/depois

4. **Aplicar em Prod**:
   - Via migration se schema change
   - Via deployment se query change

## Checklist de Code Review para MCP

Use este checklist para TODA mudança gerada via MCP:

### Schema Changes
- [ ] DDL reviewed manualmente
- [ ] Constraints adequadas
- [ ] Índices necessários incluídos
- [ ] RLS policies configuradas
- [ ] Rollback strategy definida
- [ ] Testado em dev project
- [ ] Migration file criado
- [ ] Não afeta dados de produção

### Query Changes
- [ ] SQL reviewed manualmente
- [ ] EXPLAIN ANALYZE executado
- [ ] Performance aceitável
- [ ] Sem SQL injection vulnerabilities
- [ ] Tratamento de erros adequado
- [ ] Testado com dados realistas
- [ ] Não expõe dados sensíveis

### Function Changes
- [ ] Código reviewed manualmente
- [ ] Edge cases tratados
- [ ] Error handling robusto
- [ ] Logs adequados
- [ ] Testado isoladamente
- [ ] Não quebra código existente

## Troubleshooting

### Problema: OAuth2 não abre browser

**Solução**:
1. Verificar se browser padrão está configurado
2. Tentar manualmente: https://supabase.com/dashboard
3. Re-instalar Claude Code

### Problema: "Project not found"

**Solução**:
1. Verificar se projeto dev foi criado
2. Confirmar que selecionou projeto correto no OAuth
3. Re-autenticar via MCP settings

### Problema: "Permission denied"

**Solução**:
1. Verificar feature groups habilitadas
2. Confirmar que service role key está correta
3. Verificar RLS policies não estão bloqueando

### Problema: MCP muito lento

**Solução**:
1. Reduzir feature groups habilitadas
2. Usar queries mais específicas
3. Verificar connection do Supabase

## Segurança: O Que NUNCA Fazer

### ❌ PROIBIDO

1. **Conectar MCP ao projeto de produção**
   - Risco de data corruption
   - Prompt injection pode deletar dados

2. **Executar SQL sem review em produção**
   - Sempre via migration + CI/CD
   - Nunca direto via MCP

3. **Compartilhar credenciais de produção**
   - MCP usa OAuth, mas não compartilhe tokens
   - Service keys são sensíveis

4. **Desabilitar code review**
   - Toda mudança MCP precisa review humano
   - Automated deploy sem review é perigoso

5. **Confiar cegamente em queries geradas**
   - LLMs podem ter bugs
   - Sempre validar lógica manualmente

## Manutenção

### Mensalmente
- [ ] Revisar logs de uso do MCP
- [ ] Validar que apenas dev project está conectado
- [ ] Atualizar schema do dev project se prod mudou
- [ ] Backup do dev project

### A Cada Deploy de Schema em Prod
- [ ] Aplicar mesma migration no dev project
- [ ] Manter schemas sincronizados
- [ ] Testar MCP ainda funciona

## Recursos Adicionais

- Documentação Oficial: https://supabase.com/docs/guides/getting-started/mcp
- Blog Post: https://supabase.com/blog/remote-mcp-server
- Security Best Practices: https://supabase.com/docs/guides/database/security
- Análise Completa: [claudedocs/supabase_mcp_analysis.md](claudedocs/supabase_mcp_analysis.md)

## Contato para Suporte

- Supabase Discord: https://discord.supabase.com
- Claude Code Issues: https://github.com/anthropics/claude-code/issues
- Internal: [Documentação do projeto]

---

**Última Atualização**: 2025-10-16
**Versão**: 1.0
**Responsável**: Sistema automatizado de documentação
