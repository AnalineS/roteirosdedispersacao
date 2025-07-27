# 🔐 GUIA DE SEGURANÇA - ROTEIRO DE DISPENSAÇÃO

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

**TODAS AS CHAVES EXPOSTAS DEVEM SER REVOGADAS IMEDIATAMENTE:**

### 🚨 Tipos de Chaves a Verificar:
1. **Astra DB Token**: `AstraCS:XXXXXXXX...` (EXEMPLO - use variáveis de ambiente)
2. **OpenRouter API**: `sk-or-v1-XXXXXXXX...` (EXEMPLO - use variáveis de ambiente)
3. **Hugging Face**: `hf_XXXXXXXX...` (EXEMPLO - use variáveis de ambiente)
4. **GitHub PAT**: `ghp_XXXXXXXX...` (EXEMPLO - use variáveis de ambiente)
5. **Render API**: `rnd_XXXXXXXX...` (EXEMPLO - use variáveis de ambiente)
6. **LangFlow**: `sk-XXXXXXXX...` (EXEMPLO - use variáveis de ambiente)

## 🔄 PROCEDIMENTO DE ROTAÇÃO DE CHAVES

### 1. Astra DB
```bash
# 1. Acesse console.astra.datastax.com
# 2. Vá para "Organization Settings" → "Token Management"
# 3. Revogue o token comprometido
# 4. Gere novo token com permissões mínimas necessárias
# 5. Atualize ASTRA_DB_TOKEN no Render
```

### 2. OpenRouter
```bash
# 1. Acesse openrouter.ai/keys
# 2. Revogue a chave existente
# 3. Gere nova chave
# 4. Atualize OPENROUTER_API_KEY no Render
```

### 3. Hugging Face
```bash
# 1. Acesse huggingface.co/settings/tokens
# 2. Revogue a chave existente
# 3. Gere novo token "Read"
# 4. Atualize HUGGINGFACE_API_KEY no Render
```

### 4. GitHub PAT
```bash
# 1. Acesse github.com/settings/tokens
# 2. Revogue a chave existente
# 3. Gere novo token com escopo mínimo
# 4. Atualize nos repositórios necessários
```

### 5. Render API
```bash
# 1. Acesse dashboard.render.com/account
# 2. Revogue a chave existente
# 3. Gere nova chave
# 4. Atualize scripts de deploy
```

## 🛡️ BOAS PRÁTICAS DE SEGURANÇA

### ✅ SEMPRE FAZER:
- Use variáveis de ambiente para chaves sensíveis
- Configure `sync: false` no render.yaml para chaves
- Mantenha .env no .gitignore
- Rotacione chaves regularmente (90 dias)
- Use princípio de menor privilégio
- Monitore logs de acesso das APIs

### ❌ NUNCA FAZER:
- Commitar chaves no Git
- Compartilhar chaves em mensagens/emails
- Usar chaves em URLs ou logs
- Reutilizar chaves entre ambientes
- Deixar chaves em código fonte

## 🔒 CONFIGURAÇÃO SEGURA NO RENDER

```yaml
envVars:
  - key: ASTRA_DB_TOKEN
    sync: false  # ← CRÍTICO: Nunca sincronizar
  - key: OPENROUTER_API_KEY  
    sync: false  # ← CRÍTICO: Nunca sincronizar
  - key: HUGGINGFACE_API_KEY
    sync: false  # ← CRÍTICO: Nunca sincronizar
```

## 📊 MONITORAMENTO DE SEGURANÇA

### Alertas Recomendados:
- Rate limit atingido (possível abuso)
- Falhas de autenticação repetidas
- Uso anômalo de APIs
- Tentativas de acesso fora do horário

### Logs a Monitorar:
- Chamadas de API com timestamps
- IPs de origem das requisições
- Padrões de uso por endpoint
- Erros de autenticação

## 🚀 CHECKLIST PÓS-ROTAÇÃO

- [ ] Todas as chaves antigas revogadas
- [ ] Novas chaves geradas com permissões mínimas
- [ ] Render.yaml atualizado com `sync: false`
- [ ] Variáveis atualizadas no dashboard Render
- [ ] Testes de conectividade realizados
- [ ] Monitoramento configurado
- [ ] Documentação atualizada
- [ ] Equipe notificada sobre a rotação

## 📞 CONTATOS DE EMERGÊNCIA

Em caso de incidente de segurança:
1. Revogue TODAS as chaves imediatamente
2. Analise logs de acesso
3. Documente o incidente
4. Implemente medidas corretivas
5. Revise processos de segurança