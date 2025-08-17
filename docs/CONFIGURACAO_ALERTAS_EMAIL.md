# 📧 Configuração de Alertas por Email (Gratuito)

Este guia explica como configurar alertas automáticos por email para o sistema de monitoramento usando soluções gratuitas.

## 🚨 Problema Corrigido

O erro `Resource not accessible by integration` foi corrigido adicionando as permissões necessárias no workflow:

```yaml
permissions:
  issues: write
  contents: read
```

## 📧 Opções de Alertas Gratuitos

### Opção 1: IFTTT Webhooks (Recomendado)

**Vantagens:**
- 100% gratuito
- Fácil configuração
- Suporte a email personalizado
- Até 1000 execuções por mês

**Configuração:**

1. **Criar conta no IFTTT:**
   - Acesse: https://ifttt.com/
   - Crie uma conta gratuita

2. **Configurar Webhook:**
   - Acesse: https://ifttt.com/maker_webhooks
   - Conecte o serviço "Webhooks"
   - Anote sua chave em: https://ifttt.com/maker_webhooks/settings

3. **Criar Applet:**
   - Vá em "Create" → "If This Then That"
   - **IF (Trigger)**: Webhooks
     - Event Name: `github_alert`
   - **THEN (Action)**: Email
     - Configure:
       ```
       Subject: 🚨 {{Value1}} - Roteiros de Dispensação
       Body: 
       Alerta do sistema:
       
       Tipo: {{Value1}}
       Detalhes: {{Value2}}
       Horário: {{Value3}}
       
       Verifique o repositório para mais informações.
       ```

4. **Configurar no GitHub:**
   - Acesse: Repositório → Settings → Secrets and variables → Actions
   - Adicione: `IFTTT_WEBHOOK_KEY` com sua chave do IFTTT

### Opção 2: Telegram Bot (Alternativa)

**Vantagens:**
- Notificações instantâneas
- Sem limites de mensagens
- App móvel sempre disponível

**Configuração:**

1. **Criar Bot no Telegram:**
   - Converse com @BotFather no Telegram
   - Envie: `/newbot`
   - Siga as instruções e anote o `BOT_TOKEN`

2. **Obter Chat ID:**
   - Envie uma mensagem para seu bot
   - Acesse: `https://api.telegram.org/bot<SEU_BOT_TOKEN>/getUpdates`
   - Anote o `chat_id` da resposta

3. **Configurar no GitHub:**
   - Adicione os secrets:
     - `TELEGRAM_BOT_TOKEN`: Token do seu bot
     - `TELEGRAM_CHAT_ID`: ID do seu chat

### Opção 3: GitHub Notifications + Email

**Vantagens:**
- Zero configuração
- Usa email do GitHub
- Automático

**Configuração:**
- No repositório: Settings → Notifications
- Ative "Issues" notifications
- Configure seu email em: GitHub Settings → Emails

## 🔧 Funcionalidades Implementadas

### 1. **Auto-resolução de Issues**
- Issues de alerta são fechadas automaticamente quando sistema volta ao normal
- Comentário automático explicando a resolução

### 2. **Prevenção de Spam**
- Verifica se já existe issue aberta antes de criar nova
- Adiciona comentários em issues existentes

### 3. **Múltiplos Canais**
- IFTTT para emails
- Telegram para notificações instantâneas
- GitHub Issues para tracking

### 4. **Informações Detalhadas**
- Status do backend e frontend
- Uso de métricas em percentual
- Timestamp UTC das verificações

## 📊 Exemplo de Alerta

**Email via IFTTT:**
```
Assunto: 🚨 SISTEMA OFFLINE - Roteiros de Dispensação

Alerta do sistema:

Tipo: 🚨 SISTEMA OFFLINE
Detalhes: Backend: 404 | Frontend: 200
Horário: 2025-08-17 10:09:42 UTC

Verifique o repositório para mais informações.
```

**Telegram:**
```
🤖 Alerta Roteiros de Dispensação

Tipo: 🚨 SISTEMA OFFLINE
Detalhes: Backend: 404 | Frontend: 200
Horário: 2025-08-17 10:09:42 UTC

Monitoramento automático GitHub Actions
```

## 🔍 Verificação

Para testar se está funcionando:

1. **Execução Manual:**
   - Acesse: Actions → Observability Monitoring
   - Clique em "Run workflow"

2. **Verificar Logs:**
   - Verifique se aparecem as mensagens:
     - ✅ Email enviado via IFTTT
     - ✅ Notificação enviada via Telegram

3. **Simular Problema:**
   - Altere temporariamente a URL do backend no workflow
   - Execute manualmente para gerar alerta de teste

## 🛡️ Segurança

- **Secrets:** Nunca compartilhe tokens ou chaves
- **Webhooks:** Use URLs HTTPS sempre
- **Limits:** IFTTT: 1000/mês, Telegram: ilimitado

## 📋 Checklist de Configuração

- [ ] Permissões do workflow configuradas (`issues: write`)
- [ ] Conta IFTTT criada
- [ ] Applet IFTTT configurado
- [ ] `IFTTT_WEBHOOK_KEY` adicionado aos secrets
- [ ] (Opcional) Bot Telegram criado
- [ ] (Opcional) `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` configurados
- [ ] Teste manual realizado

## ⚡ Próximos Passos

1. Configure pelo menos um método de alerta (IFTTT recomendado)
2. Execute teste manual
3. Verifique se recebe alertas
4. Documente qualquer customização necessária

---

*Configuração atualizada em: 2025-08-17*
*Testado com GitHub Actions e serviços gratuitos*