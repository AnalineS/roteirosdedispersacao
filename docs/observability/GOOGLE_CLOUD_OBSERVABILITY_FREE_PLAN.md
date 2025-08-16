# 📊 Google Cloud Observability - Plano Gratuito

## 🎯 Análise de Viabilidade para Sistema Educacional Hanseníase

### 📌 Status: ✅ VIÁVEL COM LIMITAÇÕES

---

## 🆓 Limites Gratuitos do Google Cloud Observability (2025)

### Métricas Gratuitas
- **150 MB/mês** de métricas customizadas (non-GCP)
- **Ilimitado** para métricas nativas do Google Cloud
- **Sem cobrança** para métricas de:
  - Google Cloud services
  - GKE Enterprise
  - Knative
  - Cloud Run (nosso backend!)

### API Calls
- **1 milhão** de read calls gratuitos/mês
- **Ilimitado** de write calls (sempre gratuito)
- **Mudança em Out/2025**: Cobrança passa a ser por time series retornadas

### Uptime Checks
- **1 milhão** de execuções gratuitas/mês
- Suficiente para monitorar ~30 endpoints a cada minuto

### Logs
- **50 GB** de logs gratuitos/mês (primeiro nível)
- Retenção padrão de 30 dias

---

## 💡 Estratégia de Implementação Sem Custo

### 1️⃣ **Fase 1: Métricas Essenciais (0 custo)**

```javascript
// apps/frontend-nextjs/src/lib/observability/gcpMetrics.ts
import { MetricServiceClient } from '@google-cloud/monitoring';

export class FreeGCPObservability {
  private client: MetricServiceClient;
  private projectId: string;
  
  // Métricas prioritárias (dentro dos 150MB)
  private essentialMetrics = {
    // Saúde do Sistema
    'api_health': { 
      interval: 60000, // 1 min
      labels: ['endpoint', 'status']
    },
    
    // Personas Performance
    'persona_response_time': {
      interval: 300000, // 5 min
      labels: ['persona', 'cached']
    },
    
    // Educacional Crítico
    'educational_completion': {
      interval: 3600000, // 1 hora
      labels: ['module', 'user_level']
    },
    
    // PWA Vital
    'pwa_installation': {
      interval: 86400000, // 1 dia
      labels: ['device', 'success']
    }
  };
  
  async sendMetric(metricType: string, value: number, labels?: Record<string, string>) {
    // Batch metrics para economizar API calls
    // Implementação com buffer e flush
  }
}
```

### 2️⃣ **Fase 2: Dashboards Otimizados**

```yaml
# monitoring-dashboard.yaml
displayName: "Sistema Educacional Hanseníase - Free Tier"
dashboardFilters:
  - filterType: RESOURCE_LABEL
    labelKey: project_id
    
tiles:
  - widget:
      title: "API Health (Cloud Run - Grátis)"
      xyChart:
        dataSets:
          - timeSeriesQuery:
              timeSeriesFilter:
                filter: metric.type="run.googleapis.com/request_count"
                
  - widget:
      title: "Personas Performance (Custom - 150MB)"
      scorecard:
        timeSeriesQuery:
          timeSeriesFilter:
            filter: metric.type="custom.googleapis.com/persona/response_time"
```

### 3️⃣ **Fase 3: Sistema de Alertas Alternativo (Sem Custo)**

**⚠️ Nota: Alertas do GCP cobrados desde Jan/2025 - Usando alternativas gratuitas**

```javascript
// Sistema de alertas customizado sem usar GCP Alerting
export class FreeAlertingSystem {
  // Opção 1: Verificação client-side com localStorage
  checkClientSideAlerts() {
    const metrics = getObservability().getUsageStats();
    
    // Alerta de quota no próprio dashboard
    if (metrics.usagePercentage > 90) {
      this.showDashboardAlert('⚠️ Uso de métricas próximo do limite!');
      this.sendWebhookAlert('quota_warning', metrics);
    }
  }
  
  // Opção 2: Cloud Functions gratuitas para alertas
  // (200M invocações/mês grátis)
  async checkViaCloudFunction() {
    // Cloud Function que verifica métricas e envia email
    // Executar 1x por hora = 720 invocações/mês (grátis)
    const response = await fetch('/api/check-alerts');
    return response.json();
  }
  
  // Opção 3: GitHub Actions para monitoramento
  // workflow scheduled para verificar métricas via API
  // Totalmente gratuito para repos públicos
}
```

#### Alternativas Gratuitas para Alertas:

1. **GitHub Actions** (Recomendado)
   - Cron job para verificar métricas
   - Notificações via Issues ou Discord
   - 100% gratuito para repos públicos

2. **Cloud Functions**
   - 2 milhões de invocações grátis/mês
   - Verificação horária de métricas
   - Envio de email via SendGrid (100 emails/dia grátis)

3. **Client-Side Monitoring**
   - Dashboard com alertas visuais
   - Notificações do navegador
   - Sem custo de infraestrutura

---

## 📊 Cálculo de Uso Estimado

### Métricas por Componente (Revisado Ago/2025)

| Componente | Métrica | Frequência | Volume/Mês | Destino | Custo |
|------------|---------|------------|------------|---------|--------|
| **Infraestrutura** |
| Cloud Run API | request_count, latency, errors | Contínua | 0 MB | GCP (nativa) | GRÁTIS |
| Cloud Run Health | cpu, memory, instances | Contínua | 0 MB | GCP (nativa) | GRÁTIS |
| **Sistema Core** |
| API Health Check | uptime, response_code | 5/min | ~15 MB | GCP Custom | GRÁTIS |
| Error Tracking | error_rate, type | 1/min | ~20 MB | GCP Custom | GRÁTIS |
| Personas Backend | response_time, cache_hit | 5/min | ~30 MB | GCP Custom | GRÁTIS |
| **UX & Frontend** |
| Page Views | views, bounce_rate | Tempo real | N/A | Google Analytics | GRÁTIS |
| User Events | clicks, scrolls, forms | Tempo real | N/A | Google Analytics | GRÁTIS |
| Educational Progress | module_completion | Tempo real | N/A | Google Analytics | GRÁTIS |
| PWA Stats | installs, updates | Tempo real | N/A | Google Analytics | GRÁTIS |
| Core Web Vitals | LCP, FID, CLS | Tempo real | N/A | Google Analytics | GRÁTIS |
| **Monitoramento** |
| Quota Usage | custom_metrics_mb | 1/hora | ~5 MB | GCP Custom | GRÁTIS |
| **TOTAL GCP Custom** | | | **~70 MB** | | **GRÁTIS** |

✅ **Uso otimizado: 70 MB de 150 MB (47% - metade do limite!)**

✅ **Margem de segurança: 10 MB (7%) abaixo do limite**

---

## 🛠️ Implementação Técnica

### 1. Configuração Inicial

```bash
# 1. Habilitar APIs necessárias
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudtrace.googleapis.com
gcloud services enable logging.googleapis.com

# 2. Criar service account com permissões mínimas
gcloud iam service-accounts create observability-free \
  --display-name="Observability Free Tier"

# 3. Dar permissões apenas de escrita (write é grátis)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:observability-free@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"
```

### 2. Integração no Frontend

```typescript
// apps/frontend-nextjs/src/hooks/useObservability.ts
import { useEffect } from 'react';
import { FreeGCPObservability } from '@/lib/observability/gcpMetrics';

export function useObservability() {
  const metrics = new FreeGCPObservability();
  
  useEffect(() => {
    // Enviar métricas em batch a cada 30s
    const interval = setInterval(() => {
      metrics.flush(); // Envia batch acumulado
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const trackEducationalProgress = (module: string, progress: number) => {
    // Adiciona ao buffer, não envia imediatamente
    metrics.buffer('educational_progress', progress, {
      module,
      timestamp: Date.now()
    });
  };
  
  return { trackEducationalProgress };
}
```

### 3. Integração no Backend

```python
# apps/backend/monitoring/free_tier_metrics.py
from google.cloud import monitoring_v3
import time
from functools import wraps

class FreeMetricsCollector:
    def __init__(self, project_id):
        self.client = monitoring_v3.MetricServiceClient()
        self.project = f"projects/{project_id}"
        self.buffer = []
        self.last_flush = time.time()
        
    def track_persona_response(self, persona_id, response_time, cached=False):
        """Track persona response metrics (dentro do free tier)"""
        if len(self.buffer) > 100 or time.time() - self.last_flush > 30:
            self.flush()
            
        self.buffer.append({
            'metric': 'persona_response_time',
            'value': response_time,
            'labels': {
                'persona': persona_id,
                'cached': str(cached)
            }
        })
        
    def flush(self):
        """Batch send para economizar API calls"""
        if not self.buffer:
            return
            
        # Agrupa métricas por tipo
        grouped = {}
        for item in self.buffer:
            key = item['metric']
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(item)
            
        # Envia em batch
        for metric_type, items in grouped.items():
            self._send_batch(metric_type, items)
            
        self.buffer = []
        self.last_flush = time.time()
```

---

## 📈 Monitoramento do Uso Gratuito

### Dashboard de Controle de Custos

```javascript
// apps/frontend-nextjs/src/app/admin/observability/page.tsx
export default function ObservabilityDashboard() {
  const [usage, setUsage] = useState({
    customMetrics: 0, // MB
    apiCalls: 0,
    uptimeChecks: 0,
    estimatedCost: 0
  });
  
  return (
    <div className="p-6">
      <h1>📊 Observability - Free Tier Monitor</h1>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <MetricCard
          title="Custom Metrics"
          value={`${usage.customMetrics} MB`}
          limit="150 MB"
          percentage={(usage.customMetrics / 150) * 100}
          status={usage.customMetrics < 140 ? 'success' : 'warning'}
        />
        
        <MetricCard
          title="API Calls"
          value={usage.apiCalls.toLocaleString()}
          limit="1,000,000"
          percentage={(usage.apiCalls / 1000000) * 100}
          status={usage.apiCalls < 900000 ? 'success' : 'warning'}
        />
        
        <MetricCard
          title="Custo Estimado"
          value={`R$ ${usage.estimatedCost.toFixed(2)}`}
          limit="R$ 0.00"
          status={usage.estimatedCost === 0 ? 'success' : 'error'}
        />
      </div>
      
      {usage.customMetrics > 140 && (
        <Alert className="mt-4">
          ⚠️ Aproximando do limite gratuito! Considere:
          - Reduzir frequência de métricas
          - Remover labels desnecessários
          - Usar mais métricas nativas do GCP
        </Alert>
      )}
    </div>
  );
}
```

---

## 🎯 Métricas Prioritárias (Ordem de Importância)

1. **🔴 Críticas (Sempre manter)**
   - API Health: Uptime e latência
   - Error Rate: Taxa de erros do sistema
   - User Sessions: Sessões ativas

2. **🟡 Importantes (Manter se possível)**
   - Persona Performance: Tempo de resposta por persona
   - Educational Progress: Conclusão de módulos
   - PWA Stats: Instalações e uso offline

3. **🟢 Nice-to-have (Cortar se necessário)**
   - Detailed User Journey: Fluxo detalhado
   - A/B Test Metrics: Resultados de testes
   - Browser Performance: Core Web Vitals

---

## 🚨 Estratégias de Contingência

### Se Aproximar do Limite:

1. **Reduzir Frequência**
   ```javascript
   // De 1 minuto para 5 minutos
   METRIC_INTERVAL = process.env.APPROACHING_LIMIT ? 300000 : 60000;
   ```

2. **Remover Labels**
   ```javascript
   // Simplificar labels para economizar espaço
   labels: isApproachingLimit ? { persona: id } : { persona: id, device, browser, version }
   ```

3. **Usar Sampling**
   ```javascript
   // Enviar apenas 10% das métricas não-críticas
   if (Math.random() > 0.1 && !isCriticalMetric) return;
   ```

4. **Migrar para Google Analytics**
   ```javascript
   // Mover métricas de UX para GA4 (já implementado)
   gtag('event', 'persona_interaction', {
     custom_map: { 'metric1': 'response_time' }
   });
   ```

---

## ✅ Conclusão

### Viabilidade: **SIM, É POSSÍVEL**

O Google Cloud Observability pode ser implementado **100% gratuitamente** para o Sistema Educacional de Hanseníase seguindo estas diretrizes:

1. ✅ Usar majoritariamente métricas nativas do Cloud Run (grátis)
2. ✅ Limitar métricas customizadas a 140 MB/mês
3. ✅ Batch de métricas para economizar API calls
4. ✅ Focar em métricas essenciais de saúde e educação
5. ✅ Usar Google Analytics para métricas de UX (já implementado)
6. ✅ Implementar circuit breaker para parar coleta se aproximar do limite

### Benefícios:
- 📊 Visibilidade completa do sistema
- 🚨 Alertas para problemas críticos
- 📈 Métricas educacionais valiosas
- 💰 **Custo: R$ 0,00/mês**

### Limitações Aceitáveis:
- Granularidade reduzida (5 min vs 1 min)
- Menos labels/dimensões
- Histórico limitado (30 dias)
- Alertas básicos por email

---

## 📅 Cronograma de Implementação

| Semana | Atividade | Esforço |
|--------|-----------|---------|
| 1 | Setup GCP, Service Accounts, APIs | 4h |
| 2 | Implementar coletor de métricas | 8h |
| 3 | Criar dashboards e alertas | 6h |
| 4 | Integrar com frontend/backend | 8h |
| 5 | Testes e otimização | 4h |
| **Total** | **Implementação Completa** | **30h** |

---

## 🔗 Recursos Úteis

- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Monitoring Quotas](https://cloud.google.com/monitoring/quotas)
- [Free Tier Details](https://cloud.google.com/free)
- [Metrics Best Practices](https://cloud.google.com/monitoring/api/metrics_gcp)

---

*Documento criado para orientar implementação de observabilidade sem custos no Sistema Educacional de Hanseníase*