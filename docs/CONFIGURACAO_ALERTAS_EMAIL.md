# 📧 Configuração de Alertas por Email (Gratuito)

Este guia explica como configurar alertas automáticos por email para o sistema de monitoramento usando soluções gratuitas.

## 🚨 Problema Corrigido

O erro `Resource not accessible by integration` foi corrigido adicionando as permissões necessárias no workflow:

```yaml
permissions:
  issues: write
  contents: read
```

## 📧 Opções de Alertas Gratuitos Configuradas

### Opção 1: Telegram Bot ✅ CONFIGURADO

**Status:** ✅ **ATIVO** - Bot criado e secrets configurados

**Vantagens:**
- ✅ **Notificações instantâneas** no mobile
- ✅ **Sem limites de mensagens**
- ✅ **App móvel sempre disponível**
- ✅ **Formatação rica** com Markdown

**Configuração:** ✅ **JÁ FEITA**
- Bot criado no Telegram
- Secrets `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` configurados
- Sistema ativo e funcionando

### Opção 2: GitHub Notifications + Email ✅ CONFIGURADO

**Vantagens:**
- ✅ **Zero configuração adicional** (já está implementado!)
- ✅ **Usa email do GitHub** (o que você já configurou)
- ✅ **Automático** com @mentions e assignments
- ✅ **Integrado ao sistema** de issues e notificações

**Como Funciona:**
1. Sistema cria issues automaticamente quando há problemas
2. Issues são **atribuídas automaticamente** para @AnalineS
3. **@mentions** são adicionados para forçar notificações
4. GitHub envia emails para todos configurados nas notificações do repo

**Configuração (já feita!):**
- ✅ No repositório: Settings → Notifications (configurado)
- ✅ Issues habilitadas no workflow
- ✅ Auto-assignment implementado
- ✅ @mentions automáticos para notificações

**Teste Automático:**
- Execute o workflow manualmente para receber uma issue de teste
- Sistema cria issue, adiciona comentário com @mention e fecha automaticamente
- Você deve receber 3 emails: criação, comentário e fechamento

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