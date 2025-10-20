# Claude Automations - Sistema Médico Automatizado

Sistema completo de automações Claude para monitoramento, qualidade e conformidade da plataforma educacional de hanseníase.

## 🎯 Visão Geral

Este sistema de automações garante:
- ✅ **Monitoramento contínuo** de segurança e performance
- ✅ **Conformidade LGPD** para dados médicos sensíveis
- ✅ **Qualidade médica** do conteúdo e código
- ✅ **Documentação automática** sempre atualizada
- ✅ **Alertas proativos** para problemas críticos

## 🚀 Ativação Rápida

### Método 1: Script Principal (Recomendado)
```bash
# Ativar todas as automações
node scripts/activate-claude-automations.js

# Verificar saúde do sistema
node scripts/activate-claude-automations.js --health

# Ver status detalhado
node scripts/activate-claude-automations.js --status

# Parar todas as automações
node scripts/activate-claude-automations.js --stop
```

### Método 2: NPM Scripts (Frontend)
```bash
cd apps/frontend-nextjs

# Ativar automações Claude
npm run claude:activate

# Verificar saúde
npm run claude:health

# Status das automações
npm run claude:status

# Parar automações
npm run claude:stop

# Executar verificação de qualidade
npm run claude:quality-check

# Verificar conformidade LGPD
npm run claude:lgpd

# Monitoramento contínuo (standalone)
npm run claude:monitoring
```

### Método 3: Windows (Duplo clique)
```batch
# Executar o arquivo
scripts/start-claude-automations.bat
```

## 📊 Automações Disponíveis

### 1. Monitoramento Contínuo
**Script:** `.claude/automation/continuous-monitoring-system.js`

**Monitoramento em tempo real:**
- Segurança de dados médicos (PII/PHI)
- Conformidade LGPD (100% compliance)
- Acessibilidade WCAG 2.1 AA
- Performance de componentes críticos
- Saúde geral do sistema

**Frequência:** Tempo real (30s) + Análises profundas (15min)

### 2. Verificação LGPD
**Script:** `.claude/automation/lgpd-robust.js`

**Verificações rigorosas:**
- Dados médicos sensíveis (CPF, CNS, prontuários)
- Informações de hanseníase (diagnósticos, medicamentos)
- Secrets e tokens expostos
- Conformidade com PCDT Hanseníase 2022

**Frequência:** A cada 30 minutos

### 3. Documentação Automática
**Script:** `.claude/automation/auto-documentation.js`

**Geração automática:**
- Documentação de APIs médicas
- Casos clínicos e calculadoras
- Métricas de qualidade
- Relatórios de segurança

**Frequência:** A cada 1 hora

### 4. Bloqueador de Qualidade Médica
**Script:** `.claude/hooks/medical-quality-blocker.js`

**Verificações de bloqueio:**
- Compilação TypeScript
- Erros críticos do ESLint
- Segurança de dados médicos
- Build de produção

**Frequência:** On-demand (git hooks)

### 5. Rastreador de Performance
**Script:** `.claude/production/monitoring/performance-tracker.js`

**Métricas rastreadas:**
- Tempo de resposta das APIs
- Uso de memória e CPU
- Taxa de erro das requisições
- Performance do frontend

**Frequência:** Contínuo

### 6. Verificações de Saúde
**Script:** `.claude/production/monitoring/health-checks.js`

**Verificações de saúde:**
- Status dos serviços essenciais
- Conectividade de banco de dados
- APIs externas (Supabase, OpenRouter)
- Integridade dos dados

**Frequência:** Contínuo

## 🔧 Configuração de Produção

### Linux/Docker (systemd)
```bash
# Copiar service file
sudo cp scripts/claude-automations.service /etc/systemd/system/

# Ativar serviço
sudo systemctl enable claude-automations.service
sudo systemctl start claude-automations.service

# Ver status
sudo systemctl status claude-automations.service

# Ver logs
sudo journalctl -u claude-automations.service -f
```

### Cloud Run / Kubernetes
```yaml
# Adicionar ao seu deployment.yaml
containers:
- name: claude-automations
  image: your-app-image
  command: ["node", "scripts/activate-claude-automations.js"]
  env:
  - name: NODE_ENV
    value: "production"
  - name: CLAUDE_AUTOMATION_MODE
    value: "production"
```

## 📈 Monitoramento e Alertas

### Dashboard em Tempo Real
```bash
# Acessar dashboard médico
open .claude/dashboard/medical-dashboard.html
```

### Logs e Relatórios
```bash
# Logs das automações
tail -f logs/claude-automations/activator-$(date +%Y-%m-%d).log

# Relatórios LGPD
ls .claude/automation/reports/lgpd-compliance-*.json

# Relatórios de qualidade
ls .claude/automation/reports/quality-blocker-*.json
```

### Alertas Críticos
O sistema envia alertas para:
- **Violações LGPD** (dados médicos expostos)
- **Falhas de segurança** (tokens, secrets)
- **Problemas de performance** (>2s response time)
- **Indisponibilidade** (health checks falhando)
- **Problemas de qualidade** (builds quebrados)

## 🚨 Troubleshooting

### Problema: Automações não iniciam
```bash
# Verificar Node.js
node --version # Precisa ser 16+

# Verificar estrutura
ls -la .claude/automation/
ls -la .claude/hooks/

# Logs detalhados
node scripts/activate-claude-automations.js --verbose
```

### Problema: Performance degradada
```bash
# Verificar saúde
npm run claude:health

# Ver processos rodando
npm run claude:status

# Reiniciar automações
npm run claude:stop
npm run claude:activate
```

### Problema: Alertas LGPD
```bash
# Executar verificação manual
npm run claude:lgpd

# Ver relatório detalhado
cat .claude/automation/reports/lgpd-compliance-*.json | jq
```

## 🔐 Segurança

### Dados Protegidos
- **PII/PHI**: CPF, CNS, prontuários médicos
- **Dados médicos**: Diagnósticos, medicamentos PQT-U
- **Secrets**: API keys, tokens, senhas
- **Conformidade**: LGPD, PCDT Hanseníase 2022

### Princípios de Segurança
- **Zero-trust**: Verificação contínua
- **Fail-safe**: Sistema para em caso de violação
- **Auditabilidade**: Todos os eventos são logados
- **Privacidade**: Dados nunca saem do ambiente

## 📞 Suporte

### Status do Sistema
```bash
# Verificação rápida de saúde
npm run claude:health

# Status detalhado de todas automações
npm run claude:status

# Executar verificação de qualidade completa
npm run claude:quality-check
```

### Em Caso de Emergência
```bash
# PARAR TODAS AS AUTOMAÇÕES IMEDIATAMENTE
npm run claude:stop

# OU
node scripts/activate-claude-automations.js --stop

# OU no Windows
scripts/start-claude-automations.bat # Ctrl+C para parar
```

---

**Sistema Claude Automations v1.0.0**
Plataforma Educacional para Dispensação PQT-U
Conformidade LGPD + PCDT Hanseníase 2022 ✅