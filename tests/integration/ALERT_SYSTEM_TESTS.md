# 🚨 Testes do Sistema de Alertas

Scripts para testar o sistema de monitoramento e alertas do projeto conforme necessidade.

## 📁 Arquivos Disponíveis

### `test_alert_system.py`
Script Python para testar alertas Telegram e conectividade do sistema.

## 🧪 Como Executar os Testes

### Pré-requisitos
```bash
pip install requests
```

### Configuração
Configure as variáveis de ambiente (recomendado):
```bash
export TELEGRAM_BOT_TOKEN="seu_bot_token"
export TELEGRAM_CHAT_ID="seu_chat_id"
```

Ou edite diretamente no arquivo `test_alert_system.py`.

### Execução

**Teste completo (recomendado):**
```bash
python test_alert_system.py --test-type all
```

**Teste de conectividade apenas:**
```bash
python test_alert_system.py --test-type connectivity
```

**Simular alerta de sistema offline:**
```bash
python test_alert_system.py --test-type simulate-offline
```

**Verificar status real dos serviços:**
```bash
python test_alert_system.py --test-type status
```

## 📊 O que Cada Teste Faz

### 1. Teste de Conectividade
- ✅ Verifica se credenciais Telegram estão corretas
- ✅ Envia mensagem de teste formatada
- ✅ Confirma que links funcionam

### 2. Status Real dos Serviços
- 🌐 Testa backend API (health endpoint)
- 🖥️ Testa frontend (página principal)
- 📊 Mostra status HTTP real
- 🔗 Inclui links diretos para verificação

### 3. Simulação de Alerta
- 🚨 Simula problema no backend (500)
- 📱 Testa formatação de alerta real
- 🔗 Inclui links para monitoring e issues
- 🧪 Marca claramente como teste

### 4. Teste Completo
- Executa todos os testes acima em sequência
- Mostra resumo final de sucessos/falhas
- Espera 2 segundos entre testes

## 🎯 Resultados Esperados

**Sucesso:**
```
✅ TESTE CONCLUÍDO COM SUCESSO!

📊 RESUMO DOS TESTES:
• Conectividade: ✅
• Status Real: ✅ 
• Alerta Simulado: ✅

🎯 Sucesso geral: 3/3 testes
```

**No Telegram:**
- 3 mensagens recebidas
- Formatação Markdown correta
- Links clicáveis funcionando

## 🔧 Troubleshooting

### Erro: "Credenciais não configuradas"
- Verifique `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`
- Teste manual: `echo $TELEGRAM_BOT_TOKEN`

### Erro: "Erro ao enviar Telegram"
- Verifique se bot não foi bloqueado
- Confirme Chat ID correto
- Teste com @userinfobot para obter ID

### Erro: "Erro de conexão"
- Verifique conexão com internet
- Tente acessar https://api.telegram.org manualmente

## 📋 Quando Usar

**Use regularmente:**
- ✅ Após mudanças no sistema de alertas
- ✅ Antes de deploy em produção
- ✅ Para verificar se alertas estão funcionando

**Use para troubleshooting:**
- ❓ Não recebeu alerta esperado
- ❓ Suspeita de problema na configuração
- ❓ Quer confirmar status dos serviços

## 🔗 Links Relacionados

- **GitHub Actions:** https://github.com/AnalineS/roteirosdedispersacao/actions/workflows/observability-monitoring.yml
- **Documentação:** `docs/CONFIGURACAO_ALERTAS_EMAIL.md`
- **Issues:** https://github.com/AnalineS/roteirosdedispersacao/issues

---

*Testes criados em: 2025-08-17*  
*Compatível com: Python 3.6+*