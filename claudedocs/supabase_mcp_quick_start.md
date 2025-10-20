# Supabase MCP - Guia Rápido de Primeiros Comandos

**Para**: Depois de completar o setup básico
**Tempo**: 10 minutos
**Pré-requisito**: `.claude/mcp.json` configurado e OAuth2 concluído

## Status da Instalação

✅ **Configuração MCP criada**: `.claude/mcp.json`
✅ **Documentação completa**: `claudedocs/supabase_mcp_setup_guide.md`
✅ **Análise detalhada**: `claudedocs/supabase_mcp_analysis.md`

⏳ **Pendente**: Criar projeto dev no Supabase e fazer OAuth2

## Primeiros Comandos para Testar

### 1. Verificar Conexão

**Você**: "Qual projeto Supabase está conectado via MCP?"

**Esperado**: Claude deve responder com nome do projeto ou pedir autenticação OAuth2.

**Se pedir autenticação**:
- Browser abrirá automaticamente
- Login no Supabase
- **IMPORTANTE**: Selecionar APENAS projeto dev
- Autorizar acesso

### 2. Buscar Documentação

**Você**: "Pesquise na documentação do Supabase sobre pgvector e embeddings"

**Esperado**: Documentação híbrida (semântica + keyword) sobre vector search.

**Valor**: Aprende sobre pgvector sem sair do Claude Code.

### 3. Listar Tabelas

**Você**: "Liste todas as tabelas do meu projeto Supabase"

**Esperado**: Lista com:
- `roteiro_dispensacao_embeddings` (se schema copiado)
- Outras tabelas do schema

**Se vazio**: Schema ainda não foi copiado de produção.

### 4. Descrever Schema de Tabela

**Você**: "Descreva o schema da tabela roteiro_dispensacao_embeddings"

**Esperado**: DDL completo mostrando:
- Colunas (id, content, embedding, metadata)
- Tipos de dados
- Constraints
- Índices

### 5. Performance Advisor

**Você**: "Execute performance advisor na tabela roteiro_dispensacao_embeddings"

**Esperado**: Recomendações como:
- Missing indexes
- Table statistics outdated
- Vacuum recommendations

### 6. Criar Tabela Simples (Teste)

**Você**: "Crie uma tabela test_mcp com colunas id (uuid primary key default gen_random_uuid()), name (text not null), created_at (timestamp default now())"

**Esperado**: Claude gera SQL:
```sql
CREATE TABLE test_mcp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**IMPORTANTE**: Revise SQL antes de executar!

### 7. Query com EXPLAIN

**Você**: "Execute EXPLAIN ANALYZE para SELECT * FROM roteiro_dispensacao_embeddings LIMIT 10"

**Esperado**: Plano de execução mostrando:
- Seq Scan ou Index Scan
- Tempo de execução
- Rows returned

### 8. Gerar TypeScript Types

**Você**: "Gere TypeScript types para a tabela roteiro_dispensacao_embeddings"

**Esperado**: Types completos:
```typescript
export interface RoteiroDispensacaoEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
}
```

## Comandos Práticos para Nosso Projeto

### Comando 1: Otimizar Busca Vetorial

**Você**: "Analise a tabela roteiro_dispensacao_embeddings e sugira índices para otimizar busca vetorial com pgvector"

**Valor**:
- Detecta se índice ivfflat ou hnsw é melhor
- Sugere parâmetros otimizados (lists, ef_construction)
- Estima impacto de performance

### Comando 2: Verificar RLS Policies

**Você**: "Liste as RLS policies da tabela roteiro_dispensacao_embeddings"

**Valor**:
- Mostra políticas de segurança atuais
- Identifica gaps de segurança
- Sugere melhorias

### Comando 3: Analisar Logs de Slow Queries

**Você**: "Mostre os logs de queries lentas (>1s) das últimas 24 horas"

**Valor**:
- Identifica gargalos de performance
- Mostra queries problemáticas
- Ajuda a priorizar otimizações

### Comando 4: Criar Função de Busca Otimizada

**Você**: "Crie uma função SQL search_embeddings que aceita um vetor embedding e retorna os 5 mais similares com threshold 0.5"

**Esperado**: Função PostgreSQL completa com:
- Input validation
- Vector similarity calculation
- Threshold filtering
- Limit de resultados

### Comando 5: Deploy de Edge Function (Futuro)

**Você**: "Crie uma Edge Function que valida se uma query está dentro do escopo de hanseníase"

**Esperado**: TypeScript/Deno code para Edge Function

## Fluxo de Trabalho Recomendado

### Para Design de Nova Feature

```
1. Você → "Preciso armazenar feedback dos usuários sobre respostas"
2. Claude → Sugere schema inicial
3. Você → Revisa e pede ajustes
4. Claude → Gera schema final + RLS policies
5. Você → Testa em dev project
6. Você → Cria migration manual
7. Você → Code review
8. Você → Deploy via CI/CD em prod
```

### Para Debug de Performance

```
1. Você → "A busca vetorial está lenta (>2s)"
2. Claude → Executa performance advisor
3. Claude → Sugere índice ivfflat
4. Você → Testa índice em dev
5. Você → Mede impacto com EXPLAIN ANALYZE
6. Você → Aplica em prod via migration
```

### Para Explorar Documentação

```
1. Você → "Como usar Row Level Security com JWT tokens?"
2. Claude → Busca docs + exemplos
3. Claude → Explica conceito
4. Você → Pede exemplo prático
5. Claude → Gera SQL de exemplo
```

## Limitações a Conhecer

### ❌ NÃO Funciona Para

1. **Dados em Tempo Real**: MCP não acessa real-time subscriptions
2. **Auth Management**: Gestão de usuários não está no MCP
3. **Analytics**: Dashboards e métricas não acessíveis
4. **Production**: NUNCA usar em produção

### ⚠️ Cuidados Necessários

1. **Sempre revisar SQL gerado** antes de executar
2. **EXPLAIN ANALYZE** antes de queries pesadas
3. **Backup** antes de alterações de schema
4. **Code review** obrigatório para mudanças

## Próximos Passos

Depois de testar estes comandos:

1. [ ] Criar schema de tabela `user_feedback`
2. [ ] Otimizar índices de busca vetorial
3. [ ] Gerar TypeScript types para todas tabelas
4. [ ] Criar funções SQL para queries comuns
5. [ ] Documentar patterns descobertos

## Troubleshooting Rápido

**Erro: "Not authenticated"**
→ Executar qualquer comando MCP, OAuth2 abrirá automaticamente

**Erro: "Project not found"**
→ Verificar que selecionou projeto correto no OAuth

**Erro: "Permission denied"**
→ Verificar feature groups habilitadas no mcp.json

**Resposta muito lenta**
→ Reduzir feature groups ou usar queries mais específicas

## Recursos

- [Setup Completo](claudedocs/supabase_mcp_setup_guide.md)
- [Análise Detalhada](claudedocs/supabase_mcp_analysis.md)
- [Documentação Oficial](https://supabase.com/docs/guides/getting-started/mcp)

---

**Próxima Ação Sugerida**: Testar "Listar tabelas do projeto Supabase" para iniciar OAuth2
