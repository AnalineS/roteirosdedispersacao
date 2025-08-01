# 🚀 SETUP DO GOOGLE APPS SCRIPT WEB APP

## 📋 PRÉ-REQUISITOS

1. **Conta Google** (gratuita)
2. **OpenRouter API Key** (gratuita) - obtida em https://openrouter.ai
3. **Google Apps Script** habilitado

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### 1. Criar Novo Projeto Google Apps Script

1. Acesse: https://script.google.com
2. Clique em **"Novo projeto"**
3. Renomeie para: **"Roteiro Dispensação Hanseníase"**

### 2. Configurar Arquivos do Projeto

1. **Substituir Code.gs**:
   - Copie todo o conteúdo do arquivo `Code.gs` 
   - Cole no editor substituindo o código padrão

2. **Configurar Manifest**:
   - No menu, vá em **Configurações** (ícone de engrenagem)
   - Marque **"Mostrar arquivo de manifesto 'appsscript.json' no editor"**
   - Substitua o conteúdo pelo arquivo `appsscript.json`

### 3. 🔐 CONFIGURAR API KEY (SEGURA)

⚠️ **IMPORTANTE**: A API key NUNCA deve estar no código!

1. **No Google Apps Script**:
   - Vá em **Configurações** (ícone engrenagem)
   - Role até **"Propriedades do script"**
   - Clique em **"Adicionar propriedade do script"**

2. **Adicionar a propriedade**:
   ```
   Nome: OPENROUTER_API_KEY
   Valor: [sua-api-key-aqui]
   ```

3. **Salvar** a propriedade

### 4. 📡 DEPLOY COMO WEB APP

1. **Deploy**:
   - Clique em **"Implantar"** → **"Nova implantação"**
   - Em **"Tipo"**: selecione **"Aplicativo da Web"**

2. **Configurações**:
   ```
   Descrição: Sistema Roteiro Dispensação v1.0
   Executar como: Eu (seu email)
   Quem tem acesso: Qualquer pessoa
   ```

3. **Autorizar**:
   - Clique **"Implantar"**
   - Autorize as permissões necessárias
   - **Copie a URL do Web App** (será algo como: https://script.google.com/macros/s/[ID]/exec)

### 5. 🧪 TESTAR A APLICAÇÃO

1. **Teste direto no Apps Script**:
   ```javascript
   // Execute a função testWebApp() no editor
   testWebApp();
   ```

2. **Teste via URL** (substitua [URL-DO-WEB-APP]):
   ```bash
   curl -X POST [URL-DO-WEB-APP] \
     -H "Content-Type: application/json" \
     -d '{"question":"Qual a dose de rifampicina?","persona":"dr_gasnelio"}'
   ```

## 🔑 OBTER API KEY GRATUITA

1. **OpenRouter** (https://openrouter.ai):
   - Criar conta gratuita
   - Ir em **"Keys"**
   - Gerar nova API key
   - **Copiar** a key (começa com `sk-or-...`)

## 📊 LIMITES GRATUITOS

- **OpenRouter Free Tier**: 10 requests/day por modelo free
- **Google Apps Script**: 6 min/execução, 90 min/dia
- **Rate Limiting**: 100 req/hora, 500 req/dia (configurável)

## 🔧 CONFIGURAÇÕES AVANÇADAS

### Alterar Modelo AI
No arquivo `Code.gs`, linha 20:
```javascript
FREE: 'moonshotai/kimi-k2:free'  // Modelo atual
```

### Ajustar Rate Limits
No arquivo `Code.gs`, linhas 23-25:
```javascript
MAX_REQUESTS_PER_HOUR: 100,
MAX_REQUESTS_PER_DAY: 500,
```

### Cache Duration
No arquivo `Code.gs`, linha 28:
```javascript
CACHE_DURATION: 300, // 5 minutos
```

## 🚨 IMPORTANTE - SEGURANÇA

✅ **FAÇA**:
- Mantenha API keys nas propriedades do script
- Use HTTPS sempre
- Monitore logs de acesso

❌ **NÃO FAÇA**:
- Nunca commite API keys no código
- Não compartilhe URLs de Web App publicamente sem controle
- Não desabilite rate limiting

## 🆘 TROUBLESHOOTING

### "API key não configurada"
- Verifique se adicionou `OPENROUTER_API_KEY` nas propriedades
- Redeploy a aplicação

### "Erro de CORS"
- Verifique se está fazendo requisição POST
- Headers devem incluir `Content-Type: application/json`

### "Rate limit exceeded"
- Aguarde 1 hora para reset
- Ou ajuste limites no código

## 🌐 PRÓXIMOS PASSOS

Após configurar o backend:
1. Testar todas as personas (dr_gasnelio, ga)
2. Integrar com frontend React
3. Configurar domínio personalizado (opcional)
4. Monitorar uso e performance

---

💡 **Dica**: Salve a URL do Web App - ela será usada no frontend React!