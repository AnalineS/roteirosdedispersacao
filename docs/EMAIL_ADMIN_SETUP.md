# 📧 Configuração do Email Administrativo

## Objetivo
Criar e configurar o email `admin@roteirosdedispensacao.com` para receber alertas críticos do sistema de monitoramento Google Cloud Operations Suite.

## [WARNING] Importante
Este email já está configurado no sistema de alertas GCP e precisa ser criado para que as notificações críticas sejam recebidas corretamente.

## [LIST] Passos para Configuração

### 1. Verificar Propriedade do Domínio
```bash
# Verificar registros DNS atuais
dig roteirosdedispensacao.com MX
dig roteirosdedispensacao.com TXT
```

### 2. Opções de Configuração

#### Opção A: Google Workspace (Recomendada)
1. **Acessar Google Workspace Admin Console**
   - URL: https://admin.google.com
   - Login com conta administrativa do projeto

2. **Adicionar Usuário**
   - Usuários -> Adicionar novo usuário
   - Email: `admin@roteirosdedispensacao.com`
   - Nome: "Sistema Admin"
   - Senha temporária forte

3. **Configurar Redirecionamento**
   - Gmail -> Configurações -> Encaminhamento
   - Adicionar endereços para receber cópias

#### Opção B: Configuração DNS Simples
1. **Adicionar Registros MX**
```dns
roteirosdedispensacao.com.    MX    10    mx1.improvmx.com.
roteirosdedispensacao.com.    MX    20    mx2.improvmx.com.
```

2. **Configurar Alias/Redirecionamento**
   - Usar serviço como ImprovMX (gratuito)
   - admin@roteirosdedispensacao.com -> email_real@gmail.com

#### Opção C: Firebase Email Extensions
1. **Instalar Extension**
```bash
firebase ext:install firebase/firestore-send-email
```

2. **Configurar SMTP**
   - Configurar provedor SMTP
   - Definir admin@roteirosdedispensacao.com como remetente

### 3. Validação da Configuração

#### Teste de Recebimento
```bash
# Enviar email de teste
echo "Teste de configuração do email admin" | mail -s "Teste Sistema" admin@roteirosdedispensacao.com
```

#### Verificar Alertas GCP
1. **Acessar Google Cloud Console**
   - URL: https://console.cloud.google.com/monitoring/alerting
   - Projeto: red-truck-468923-s4

2. **Testar Notificação**
   - Políticas de Alerta -> Testar Notificação
   - Verificar se email admin@ recebe a mensagem

### 4. Configurações de Segurança

#### Filtros de Spam
- Adicionar domainios GCP à whitelist:
  - `*.google.com`
  - `*.googlecloud.com`
  - `noreply@google.com`

#### Configuração de Aliases
```
admin@roteirosdedispensacao.com -> email_principal
alerts@roteirosdedispensacao.com -> admin@roteirosdedispensacao.com
monitoring@roteirosdedispensacao.com -> admin@roteirosdedispensacao.com
```

## [REPORT] Alertas Configurados

O email `admin@roteirosdedispensacao.com` receberá alertas para:

### Alertas Críticos (Produção)
1. **🐌 Alta Latência** - P95 > 5s por 10min
2. **[ALERT] Taxa de Erro Alta** - >10 erros/min por 5min  
3. **💀 Serviço Indisponível** - Sem requisições por 10min
4. **[SAVE] Alto Uso de Memória** - >80% por 10min

### Formato das Notificações
```
Subject: [GCP Alert] Alta Latência - P95 > 5s
From: Google Cloud Monitoring <noreply@google.com>
To: admin@roteirosdedispensacao.com

Condição: Alta Latência - P95 > 5s
Status: OPEN
Política: 🐌 Alta Latência - P95 > 5s
Projeto: red-truck-468923-s4
Timestamp: 2024-01-20 15:30:00 UTC

Detalhes: A latência P95 das requisições está acima de 5 segundos...
```

## [OK] Checklist Pós-Configuração

- [ ] Email admin@roteirosdedispensacao.com criado
- [ ] DNS MX records configurados  
- [ ] Teste de envio realizado com sucesso
- [ ] Alertas GCP testados
- [ ] Filtros anti-spam configurados
- [ ] Redirecionamento funcional (se aplicável)
- [ ] Backup de configurações documentado

## 🔗 Links Úteis

- [Google Workspace Admin](https://admin.google.com)
- [Google Cloud Monitoring](https://console.cloud.google.com/monitoring/alerting?project=red-truck-468923-s4)
- [ImprovMX (Email Forwarding)](https://improvmx.com)
- [Firebase Email Extensions](https://firebase.google.com/products/extensions/firestore-send-email)

## 📞 Suporte

Em caso de problemas:
1. Verificar configurações DNS com `dig`
2. Testar conectividade SMTP
3. Validar permissões no Google Workspace
4. Conferir logs de entrega de email

---

**Status**: ⏳ Pendente de implementação manual
**Prioridade**: [RED] Alta (necessário para alertas críticos)
**Responsável**: Administrador do sistema