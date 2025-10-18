# CRITICAL ISSUE: Legacy API Keys Disabled

**Date**: 2025-10-18
**Status**: 🚨 BLOCKER - RAG não funcional devido a deprecação de API keys

## Problema Crítico Identificado

Durante os testes com o Python `supabase-py` client, encontramos o seguinte erro:

```
{'message': 'Legacy API keys are disabled',
 'code': 401,
 'hint': 'Your legacy API keys (anon, service_role) were disabled on 2025-08-30T12:20:32.573283+00:00. Re-enable them in the Supabase dashboard, or use the new publishable and secret API keys.'}
```

## Impacto

- ✅ RPC function `search_similar_embeddings` foi criada com sucesso via SQL Editor (Playwright)
- ✅ .env atualizado com credenciais corretas do projeto `skmyflckurikjprdleuz`
- ✅ GitHub Secrets atualizados
- ❌ Backend retorna "Internal server error" ao tentar consultas RAG
- ❌ Python supabase-py client não consegue conectar com legacy keys desabilitadas

## Diagnóstico

O projeto Supabase `skmyflckurikjprdleuz` teve as **legacy API keys desabilitadas em 30/08/2025**.

As keys que recuperamos via Playwright:
- `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (legacy, desabilitada)
- `SUPABASE_SERVICE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (legacy, desabilitada)

Estas keys são do tipo **legacy** e foram desabilitadas pelo Supabase.

## Solução Requerida

### Opção 1: Re-habilitar Legacy Keys (Rápido)

1. Acessar Supabase Dashboard via Playwright
2. Navegar para Project Settings → API
3. Procurar opção "Re-enable legacy API keys"
4. Habilitar as legacy keys
5. Reiniciar backend

**Prós**: Solução imediata, não requer mudança de código
**Contras**: Legacy keys podem ser deprecadas permanentemente no futuro

### Opção 2: Migrar para New API Keys (Recomendado)

1. Acessar Supabase Dashboard → API Keys
2. Localizar seção "New API Keys":
   - **Publishable key** (substitui anon key)
   - **Secret key** (substitui service_role key)
3. Atualizar .env:
   ```env
   SUPABASE_ANON_KEY=<publishable_key>
   SUPABASE_SERVICE_KEY=<secret_key>
   ```
4. Atualizar GitHub Secrets
5. Reiniciar backend

**Prós**: Solução futura-proof, alinhada com diretrizes do Supabase
**Contras**: Requer atualização de credenciais

## Próximos Passos Imediatos

1. ⏳ Usar Playwright para navegar ao dashboard Supabase
2. ⏳ Identificar se existe opção para re-habilitar legacy keys
3. ⏳ Se não existir, recuperar as new API keys (publishable + secret)
4. ⏳ Atualizar .env e GitHub Secrets com keys funcionais
5. ⏳ Testar RAG query novamente

## Arquivos Afetados

- **apps/backend/.env** (linhas 63-65) - Credenciais atualizadas mas não funcionais
- **GitHub Secrets** - Atualizados mas não funcionais
- **apps/backend/services/rag/supabase_rag_system.py** - Cliente que falha ao conectar
- **scripts/index_knowledge_base.py** - Script de indexação que não funciona

## Conclusão Parcial da Investigação

Completamos com sucesso:
1. ✅ Identificação do projeto correto (`skmyflckurikjprdleuz`)
2. ✅ Criação da função RPC `search_similar_embeddings`
3. ✅ Atualização de .env e GitHub Secrets

Porém, o problema crítico atual é:
**As API keys estão desabilitadas pelo Supabase e precisam ser re-habilitadas ou substituídas pelas new keys.**

Sem keys funcionais, o RAG system não pode conectar ao Supabase e continuará retornando sources vazias ou erros internos.
