# Guia de Troubleshooting - Fase 3
## Plataforma Educacional Médica sobre Hanseníase

**Versão:** 3.0.0  
**Data:** 07/09/2025  
**Objetivo:** Resolução rápida e eficaz de problemas em ambiente médico de produção

---

## 🚨 Problemas Críticos (Ação Imediata)

### 🔥 1. Aplicação Médica Indisponível

#### Sintomas
- Site não carrega (erro 502/503/504)
- API não responde
- Dashboard de monitoramento offline
- Usuários não conseguem acessar cálculos médicos

#### Diagnóstico Rápido
```bash
# 1. Verificar status dos serviços
systemctl status nginx
pm2 status

# 2. Verificar logs imediatos
pm2 logs hanseniase-app --lines 50
tail -f /var/log/nginx/error.log

# 3. Verificar recursos do sistema
htop
df -h
free -h

# 4. Testar conectividade básica
curl -I http://localhost:3000/api/health
curl -I https://seu-dominio.com.br
```

#### Soluções por Ordem de Prioridade

**🚀 Solução 1: Restart dos Serviços**
```bash
# Reiniciar aplicação
pm2 restart hanseniase-app

# Aguardar 30 segundos e testar
sleep 30
curl -f http://localhost:3000/api/health

# Se ainda não funcionar, reiniciar Nginx
sudo systemctl restart nginx
```

**🚀 Solução 2: Verificar Recursos**
```bash
# Verificar se há falta de memória
free -h
# Se RAM < 1GB disponível:
pm2 restart hanseniase-app --max-memory-restart 1G

# Verificar espaço em disco
df -h
# Se disco > 90% cheio:
sudo find /var/log -name "*.log" -mtime +7 -delete
sudo npm cache clean --force
```

**🚀 Solução 3: Rollback de Emergência**
```bash
# Se problema ocorreu após deploy recente
cd /opt/hanseniase
git log --oneline -5

# Rollback para versão anterior estável
git checkout <commit_anterior_estavel>
npm ci --production
pm2 restart hanseniase-app
```

---

### 🔥 2. Erro Crítico em Cálculo Médico

#### Sintomas
- Calculadoras retornam valores incorretos
- Erro em dosagem de medicamentos
- Alertas de precisão médica disparados
- Protocolos médicos inconsistentes

#### Diagnóstico Crítico
```bash
# 1. Verificar logs de erro médico
tail -f /var/log/hanseniase/medical-errors.log

# 2. Testar calculadoras específicas
curl -X POST http://localhost:3000/api/medical/calculator/rifampicina \
  -H "Content-Type: application/json" \
  -d '{"weight": 70, "scheme": "pb"}'

# 3. Verificar integridade do banco de protocolos
node .claude/automation/medical-protocol-validator.js --check-integrity

# 4. Verificar cache de cálculos
redis-cli keys "*medical*"
redis-cli flushdb  # Se necessário limpar cache corrompido
```

#### Ações Imediatas

**🚨 Ação 1: Parar Cálculos Incorretos**
```bash
# Desabilitar temporariamente calculadoras com erro
echo "MEDICAL_CALCULATORS_ENABLED=false" >> /opt/hanseniase/.env.production
pm2 restart hanseniase-app

# Exibir aviso no site
curl -X POST http://localhost:3000/api/admin/maintenance-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "message": "Manutenção em calculadoras médicas - contate equipe médica"}'
```

**🚨 Ação 2: Restaurar Protocolos Corretos**
```bash
# Restaurar protocolos do backup mais recente
cd /opt/hanseniase
node scripts/restore-medical-protocols.js --from-backup --date=latest

# Validar protocolos restaurados
node .claude/automation/medical-protocol-validator.js --full-validation
```

**🚨 Ação 3: Notificar Equipe Médica**
```bash
# Enviar alerta crítico imediatamente
node .claude/automation/intelligent-notification-system.js \
  "medical_calculation_error" \
  '{"severity": "critical", "message": "Erro crítico em cálculos médicos detectado", "action_required": "immediate"}'
```

---

### 🔥 3. Violação LGPD Detectada

#### Sintomas
- Alertas de exposição de dados sensíveis
- Logs de auditoria com violações
- Dados médicos acessíveis sem autorização
- Falha na validação de consentimento

#### Ações Obrigatórias por Lei

**🚨 Contenção Imediata (0-5 minutos)**
```bash
# 1. Identificar tipo de violação
tail -f /var/log/hanseniase/lgpd-violations.log

# 2. Bloquear acesso se necessário
# (Apenas em casos extremos - dados expostos publicamente)
sudo iptables -A INPUT -p tcp --dport 80 -j DROP
sudo iptables -A INPUT -p tcp --dport 443 -j DROP

# 3. Documentar incidente imediatamente
echo "$(date): Violação LGPD detectada. Investigação iniciada." >> /var/log/hanseniase/incident-log.txt
```

**🚨 Investigação (5-30 minutos)**
```bash
# Executar análise completa de conformidade
node .claude/automation/lgpd-compliance-checker.js --emergency-audit

# Identificar dados afetados
node .claude/automation/lgpd-compliance-checker.js --identify-affected-data

# Gerar relatório de impacto
node .claude/automation/lgpd-compliance-checker.js --impact-report
```

**🚨 Correção (30-120 minutos)**
```bash
# Aplicar correções automáticas quando possível
node .claude/automation/lgpd-compliance-checker.js --auto-fix

# Revogar acessos comprometidos
node scripts/revoke-compromised-access.js

# Reabilitar acesso após correção
sudo iptables -D INPUT -p tcp --dport 80 -j DROP
sudo iptables -D INPUT -p tcp --dport 443 -j DROP
```

---

## ⚠️ Problemas Frequentes

### 1. Performance Degradada para Personas

#### Dr. Gasnelio - Resposta Lenta (>1s)

**Diagnóstico:**
```bash
# Verificar métricas específicas do Dr. Gasnelio
curl -s "http://localhost:9090/api/v1/query?query=hanseniase_persona_response_time{persona='dr_gasnelio'}"

# Verificar cache específico
redis-cli keys "*gasnelio*"
redis-cli ttl "cache:gasnelio:advanced_calculations"

# Verificar queries complexas no banco
sudo -u postgres psql hanseniase_prod -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%advanced%' 
ORDER BY mean_time DESC LIMIT 10;
"
```

**Soluções:**
```bash
# Limpar e recriar cache otimizado
redis-cli del "cache:gasnelio:*"
node scripts/warm-persona-cache.js --persona=dr_gasnelio

# Ativar modo de alta performance
echo "DR_GASNELIO_HIGH_PERFORMANCE=true" >> .env.production
pm2 restart hanseniase-app
```

#### GA - Interface de Aprendizado Lenta

**Diagnóstico:**
```bash
# Verificar métricas do GA
curl -s "http://localhost:9090/api/v1/query?query=hanseniase_persona_response_time{persona='ga'}"

# Verificar conteúdo educacional
curl -I http://localhost:3000/api/educational/content/hanseniase-basics
```

**Soluções:**
```bash
# Otimizar conteúdo educacional
node scripts/optimize-educational-content.js

# Ativar modo de aprendizado rápido
echo "GA_FAST_LEARNING_MODE=true" >> .env.production
pm2 restart hanseniase-app
```

### 2. Problemas de Acessibilidade

#### Falhas WCAG 2.1 AA

**Diagnóstico:**
```bash
# Executar auditoria completa
npm run test:accessibility -- --level=AA --verbose

# Verificar violações específicas
node .claude/automation/accessibility-validator.js --detailed-report

# Testar com simulador de leitor de tela
node scripts/test-screen-reader-compatibility.js
```

**Soluções Automáticas:**
```bash
# Aplicar correções automáticas de contraste
node .claude/automation/accessibility-auto-fix.js --fix-contrast

# Corrigir estrutura semântica
node .claude/automation/accessibility-auto-fix.js --fix-semantic-structure

# Adicionar textos alternativos ausentes
node .claude/automation/accessibility-auto-fix.js --fix-alt-texts
```

### 3. Problemas de Banco de Dados

#### Conexões Esgotadas

**Diagnóstico:**
```bash
# Verificar conexões ativas
sudo -u postgres psql hanseniase_prod -c "
SELECT count(*) as active_connections, 
       state, 
       application_name 
FROM pg_stat_activity 
GROUP BY state, application_name;
"

# Verificar configuração do pool
grep -E "max_connections|shared_buffers" /etc/postgresql/*/main/postgresql.conf
```

**Soluções:**
```bash
# Matar conexões inativas antigas
sudo -u postgres psql hanseniase_prod -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'hanseniase_prod'
  AND pid <> pg_backend_pid()
  AND state = 'idle'
  AND state_change < current_timestamp - INTERVAL '10 minutes';
"

# Reiniciar pool de conexões
pm2 restart hanseniase-app

# Aumentar limite se necessário (emergencial)
sudo sed -i 's/max_connections = 100/max_connections = 200/' /etc/postgresql/*/main/postgresql.conf
sudo systemctl restart postgresql
```

#### Consultas Lentas

**Diagnóstico:**
```bash
# Identificar consultas lentas
sudo -u postgres psql hanseniase_prod -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"

# Verificar índices ausentes
sudo -u postgres psql hanseniase_prod -c "
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct < -0.01
ORDER BY n_distinct;
"
```

**Soluções:**
```bash
# Criar índices emergenciais
sudo -u postgres psql hanseniase_prod -c "
CREATE INDEX CONCURRENTLY idx_medical_calculations_user_id ON medical_calculations(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(created_at);
"

# Atualizar estatísticas
sudo -u postgres psql hanseniase_prod -c "ANALYZE;"

# Reindexar se necessário
sudo -u postgres psql hanseniase_prod -c "REINDEX DATABASE hanseniase_prod;"
```

---

## 🔧 Ferramentas de Diagnóstico

### 1. Script de Diagnóstico Completo

```bash
# Criar script de diagnóstico geral
sudo tee /opt/hanseniase/scripts/emergency-diagnosis.sh > /dev/null <<'EOF'
#!/bin/bash

echo "🚨 DIAGNÓSTICO EMERGENCIAL - $(date)"
echo "================================================"

# Sistema
echo "📊 SISTEMA:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disco: $(df -h / | awk 'NR==2{print $5}')"
echo ""

# Aplicação
echo "💻 APLICAÇÃO:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) (CPU: \(.monit.cpu)%, MEM: \(.monit.memory/1024/1024 | floor)MB)"'
echo ""

# Banco de Dados
echo "🗃️ BANCO DE DADOS:"
sudo -u postgres psql hanseniase_prod -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null || echo "Erro ao conectar"
echo ""

# Redis
echo "📦 CACHE (Redis):"
redis-cli info memory | grep used_memory_human || echo "Redis inacessível"
echo ""

# Nginx
echo "🌐 PROXY (Nginx):"
sudo systemctl is-active nginx
echo ""

# Testes rápidos
echo "🧪 TESTES RÁPIDOS:"
curl -s -o /dev/null -w "Saúde da API: %{http_code} (%{time_total}s)" http://localhost:3000/api/health
echo ""
curl -s -o /dev/null -w "Site principal: %{http_code} (%{time_total}s)" http://localhost:3000/
echo ""

# Alertas ativos
echo "🚨 ALERTAS ATIVOS:"
curl -s http://localhost:9093/api/v1/alerts 2>/dev/null | jq -r '.data[] | "\(.labels.alertname): \(.labels.severity)"' || echo "AlertManager inacessível"

echo "================================================"
EOF

chmod +x /opt/hanseniase/scripts/emergency-diagnosis.sh
```

### 2. Monitoramento em Tempo Real

```bash
# Watch para métricas críticas
watch -n 5 '
echo "=== MÉTRICAS CRÍTICAS ===" && \
curl -s "http://localhost:9090/api/v1/query?query=hanseniase_medical_accuracy_percentage" | jq -r ".data.result[0].value[1]" | xargs -I {} echo "Precisão Médica: {}%" && \
curl -s "http://localhost:9090/api/v1/query?query=hanseniase_lgpd_compliance_score" | jq -r ".data.result[0].value[1]" | xargs -I {} echo "LGPD Compliance: {}%" && \
curl -s "http://localhost:9090/api/v1/query?query=up{job=\"hanseniase-app\"}" | jq -r ".data.result[0].value[1]" | xargs -I {} echo "Aplicação UP: {}"
'
```

---

## 📋 Playbooks de Emergência

### 1. Playbook: Sistema Completamente Offline

```bash
# 1. AVALIAÇÃO RÁPIDA (2 minutos)
systemctl status nginx postgresql redis-server
pm2 status
df -h && free -h

# 2. RESTART ESCALONADO (5 minutos)
sudo systemctl restart redis-server
sleep 30
sudo systemctl restart postgresql
sleep 60
pm2 restart all
sleep 30
sudo systemctl restart nginx

# 3. VALIDAÇÃO (2 minutos)
curl -f http://localhost:3000/api/health
curl -f https://seu-dominio.com.br

# 4. NOTIFICAÇÃO
if [ $? -eq 0 ]; then
    echo "✅ Sistema restaurado"
    node .claude/automation/intelligent-notification-system.js "system_recovered" '{"message": "Sistema restaurado com sucesso"}'
else
    echo "❌ Falha na restauração - escalar para equipe técnica"
fi
```

### 2. Playbook: Problema de Conformidade LGPD

```bash
# 1. CONTENÇÃO (imediato)
node .claude/automation/lgpd-compliance-checker.js --emergency-mode

# 2. DOCUMENTAÇÃO (5 minutos)
echo "$(date '+%Y-%m-%d %H:%M:%S') - Incidente LGPD iniciado" >> /var/log/hanseniase/incidents.log

# 3. ANÁLISE (15 minutos)
node .claude/automation/lgpd-compliance-checker.js --full-audit --output=/tmp/lgpd-incident-report.json

# 4. NOTIFICAÇÃO OBRIGATÓRIA
# (DPO deve ser notificado em até 72h conforme LGPD)
mail -s "LGPD Incident - $(date)" dpo@seu-dominio.com.br < /tmp/lgpd-incident-report.json
```

---

## 📞 Escalação e Contatos

### Níveis de Escalação

| Nível | Tempo Limite | Responsável | Contato |
|-------|--------------|-------------|---------|
| 1 | 15 minutos | Desenvolvedor On-call | +55 11 99999-1111 |
| 2 | 30 minutos | Tech Lead | +55 11 99999-2222 |
| 3 | 60 minutos | CTO / Equipe Médica | +55 11 99999-3333 |
| 4 | 120 minutos | Direção / Compliance | +55 11 99999-4444 |

### Contatos Especializados

- **Emergência Médica:** medical-emergency@seu-dominio.com.br
- **Compliance LGPD:** dpo@seu-dominio.com.br  
- **Acessibilidade:** accessibility-team@seu-dominio.com.br
- **Infraestrutura:** sre-team@seu-dominio.com.br

### Canais de Comunicação

- **Slack Crítico:** #hanseniase-emergencias
- **WhatsApp Grupo:** "Hanseníase - Emergência Técnica"
- **Teams:** Canal "Incidentes Críticos"

---

## 📚 Documentação de Referência

### Links Rápidos
- [Guia de Deploy](./DEPLOYMENT_GUIDE.md)
- [Configuração de Monitoramento](./MONITORING_SETUP.md)
- [Guia de Onboarding](./TEAM_ONBOARDING.md)

### Logs Importantes
```bash
# Aplicação principal
tail -f /var/log/hanseniase/app.log

# Erros médicos
tail -f /var/log/hanseniase/medical-errors.log

# Auditoria LGPD
tail -f /var/log/hanseniase/lgpd-audit.log

# Nginx
tail -f /var/log/nginx/error.log

# Sistema
tail -f /var/log/syslog
```

### Comandos de Diagnóstico Rápido
```bash
# Status geral
/opt/hanseniase/scripts/emergency-diagnosis.sh

# Métricas críticas
curl -s http://localhost:3030/api/metrics/summary

# Alertas ativos
curl -s http://localhost:9093/api/v1/alerts | jq '.data[] | {alert: .labels.alertname, severity: .labels.severity}'

# Teste de conectividade
curl -f http://localhost:3000/api/health && echo "✅ API OK" || echo "❌ API FALHOU"
```

---

**Última atualização:** 07/09/2025  
**Versão do Guia:** 3.0.0  
**Compatibilidade:** Plataforma v3.0.0+

> 🚨 **Importante:** Em caso de dúvida sobre questões médicas ou de segurança de dados, SEMPRE escale imediatamente para o nível apropriado. Não tente resolver sozinho questões que podem impactar pacientes ou violar regulamentações.