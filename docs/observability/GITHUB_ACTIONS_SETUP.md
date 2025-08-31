# [FIX] Configuração GitHub Actions - Observabilidade

## [LIST] Ativação do Workflow de Monitoramento

### 1️⃣ **Verificar Arquivo de Workflow**

O arquivo já foi criado em:
```
.github/workflows/observability-monitoring.yml
```

### 2️⃣ **Configurar Secrets no GitHub**

**Acesse:** `https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions`

#### **Secrets Obrigatórios:**

```yaml
# 1. Credenciais GCP
GCP_PROJECT_ID: "roteiro-dispensacao-api"
GCP_SERVICE_ACCOUNT_KEY: |
  {
    "type": "service_account",
    "project_id": "roteiro-dispensacao-api",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...",
    "client_email": "observability-free@roteiro-dispensacao-api.iam.gserviceaccount.com",
    ...
  }

# 2. Google Analytics (opcional para métricas)
GA_MEASUREMENT_ID: "G-XXXXXXXXXX"
GA_API_SECRET: "secret_from_google_analytics"
```

### 3️⃣ **Ativar GitHub Actions**

1. **Verificar se Actions está habilitado:**
   - Vá em `Settings -> Actions -> General`
   - Certifique-se que `Allow all actions and reusable workflows` está selecionado

2. **Dar permissões para criar Issues:**
   - Em `Settings -> Actions -> General`
   - Seção `Workflow permissions`
   - Selecione `Read and write permissions`
   - Marque `Allow GitHub Actions to create and approve pull requests`

### 4️⃣ **Executar Primeiro Teste**

```bash
# 1. Commit e push do workflow (se ainda não feito)
git add .github/workflows/observability-monitoring.yml
git commit -m "feat: add observability monitoring workflow"
git push origin main

# 2. Executar manualmente pela primeira vez
# Vá em Actions -> Observability Monitoring -> Run workflow
```

### 5️⃣ **Verificar Execução**

#### **Via Interface GitHub:**
1. Acesse a aba `Actions` do repositório
2. Clique em `Observability Monitoring (Free Tier)`
3. Veja os logs da execução

#### **Via CLI:**
```bash
# Listar workflows
gh workflow list

# Ver runs do workflow
gh run list --workflow="observability-monitoring.yml"

# Ver logs do último run
gh run view --log
```

---

## [REPORT] **Configuração de Alertas**

### **Tipos de Alertas Configurados:**

1. **[ALERT] Sistema Offline**
   - Backend API não responde (status ≠ 200)
   - Frontend não responde
   - **Ação**: Cria issue automática com label `critical`

2. **[WARNING] Quota de Métricas**
   - Uso > 90% do limite gratuito (140 MB)
   - **Ação**: Cria issue com label `warning`

3. **[REPORT] Relatório Mensal**
   - Todo dia 1 do mês
   - **Ação**: Cria issue com relatório de uso

### **Exemplo de Issue Criada Automaticamente:**

```markdown
# [ALERT] Alerta de Monitoramento - Sistema Offline

## Alerta Automático - 2025-08-16T14:30:00Z

### [ERROR] Problema de Disponibilidade

- **Backend API**: [ERROR] Offline (503)
- **Frontend**: [OK] Online

### [REPORT] Métricas do Sistema

| Métrica | Valor | Status |
|---------|-------|--------|
| Backend API | 503 | [ERROR] |
| Frontend | 200 | [OK] |
| Uso de Métricas | 70 MB | [OK] |
| Percentual | 50% | [OK] |

---
*Alerta gerado automaticamente pelo GitHub Actions*
*Workflow: observability-monitoring.yml*
```

---

## 🛠️ **Customizações do Workflow**

### **Alterar Frequência de Monitoramento:**

```yaml
# .github/workflows/observability-monitoring.yml
on:
  schedule:
    # Padrão: a cada hora
    - cron: '0 * * * *'
    
    # Alternativas:
    # - cron: '*/30 * * * *'  # A cada 30 minutos
    # - cron: '0 */6 * * *'   # A cada 6 horas
    # - cron: '0 9,18 * * *'  # 9h e 18h todos os dias
```

### **Adicionar Novos Endpoints para Monitorar:**

```yaml
# No step "Check API Health"
- name: [SEARCH] Check API Health
  run: |
    # Adicionar novos endpoints aqui
    CUSTOM_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://seu-novo-endpoint.com/health)
    echo "custom_api_status=$CUSTOM_API_STATUS" >> $GITHUB_OUTPUT
```

### **Configurar Notificações Externos:**

```yaml
# Adicionar step para Discord/Slack
- name: 📢 Send Discord Notification
  if: steps.api-health.outputs.alert_needed == 'true'
  run: |
    curl -X POST "${{ secrets.DISCORD_WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -d '{
        "content": "[ALERT] Sistema offline detectado!",
        "embeds": [{
          "title": "Alerta de Monitoramento",
          "description": "Backend API: ${{ steps.api-health.outputs.backend_status }}",
          "color": 15158332
        }]
      }'
```

---

## [TEST] **Testes e Validação**

### **Testar Criação de Alertas:**

1. **Simular falha de API:**
   ```bash
   # Temporariamente modificar URL para forçar erro
   # Commit e ver se cria issue automática
   ```

2. **Testar manualmente:**
   ```bash
   # No repositório
   gh workflow run observability-monitoring.yml
   
   # Verificar se executou
   gh run list --workflow="observability-monitoring.yml" --limit=1
   ```

### **Verificar Permissões:**

```yaml
# Testar se pode criar issues
- name: [TEST] Test Permissions
  run: |
    echo "Testing if can create issues..."
    gh auth status
    gh repo view --json permissions
```

### **Debug de Problemas:**

```bash
# Ver logs detalhados
gh run view RUN_ID --log --job=JOB_ID

# Ver secrets configurados (não mostra valores)
gh secret list

# Testar autenticação
gh auth status
```

---

## 📈 **Métricas de Sucesso**

### **KPIs do Sistema de Monitoramento:**

- **Uptime Detection**: 99.9% de detecção de problemas
- **False Positives**: < 1% de alertas falsos
- **Response Time**: < 5 minutos para alertas críticos
- **Cost**: R$ 0,00 (100% gratuito)

### **Dashboard de Status:**

Após ativação, o sistema gerará:
- **Issues automáticas** para problemas
- **Summary reports** em cada execução
- **Monthly reports** com histórico completo

---

## 🔗 **Integração com Google Analytics**

O workflow também envia métricas para o Google Analytics:

```javascript
// Evento enviado para GA4
{
  "client_id": "github-actions",
  "events": [{
    "name": "system_monitoring",
    "params": {
      "backend_status": "200",
      "frontend_status": "200", 
      "metrics_usage_mb": "70",
      "metrics_percentage": "50"
    }
  }]
}
```

Isso permite:
- **Histórico longo** no GA4 (grátis)
- **Dashboards visuais** com dados de uptime
- **Correlação** com métricas de usuário

---

## [OK] **Checklist de Ativação**

- [ ] **Workflow file criado**: `.github/workflows/observability-monitoring.yml`
- [ ] **Secrets configurados**: GCP + GA credentials
- [ ] **Permissions habilitadas**: Read/write + create issues
- [ ] **Primeiro run executado**: Manual trigger
- [ ] **Issues funcionando**: Teste de criação automática
- [ ] **Logs validados**: Sem erros na execução
- [ ] **GA integration**: Métricas sendo enviadas

---

*Configuração do GitHub Actions para monitoramento automatizado e gratuito*