# Arquitetura de Monitoramento Profissional

## 🎯 Visão Geral

Sistema de monitoramento enterprise usando ferramentas Google Cloud e outras soluções profissionais, eliminando a necessidade de desenvolvimento custom de monitoring.

## 📊 Stack de Monitoramento Recomendada

### 1. **Google Analytics 4 (GA4)** - Análise de Usuário
```
Frontend → GA4 SDK → Google Analytics → Insights Dashboard
```

#### Métricas Principais:
- **User Engagement**: Tempo de sessão, páginas por sessão
- **Conversational Analytics**: Mensagens por usuário, personas preferidas
- **User Journey**: Fluxo de navegação, pontos de abandono
- **Performance UX**: Core Web Vitals, tempo de carregamento

#### Implementação:
```javascript
// apps/frontend-nextjs/src/lib/analytics.ts
import { GoogleAnalytics } from 'nextjs-google-analytics'

// Eventos customizados para chat
gtag('event', 'chat_message_sent', {
  persona: 'dr_gasnelio',
  message_length: 150,
  response_time: 2.3
})

gtag('event', 'persona_switch', {
  from_persona: 'ga',
  to_persona: 'dr_gasnelio'
})
```

### 2. **Google Cloud Monitoring** - Infraestrutura
```
Cloud Run → Cloud Monitoring → Alerting → Notification Channels
```

#### Métricas Automáticas:
- **CPU Usage**: Utilização de CPU por instância
- **Memory Usage**: Consumo de memória
- **Request Count**: Número de requisições por minuto
- **Response Time**: Latência de resposta (p50, p95, p99)
- **Error Rate**: Taxa de erro 4xx/5xx
- **Instance Count**: Número de instâncias ativas

#### Alertas Configurados:
```yaml
# Exemplo de política de alerta
displayName: "High Error Rate"
conditions:
  - displayName: "Error rate above 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
      duration: "300s"
```

### 3. **Google Cloud Logging** - Logs Centralizados
```
Application Logs → Cloud Logging → Log Explorer → Alerts
```

#### Logs Estruturados:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "severity": "INFO",
  "service": "backend-api",
  "endpoint": "/chat/send",
  "persona": "dr_gasnelio",
  "response_time_ms": 850,
  "user_id": "anonymous_12345",
  "success": true,
  "message_length": 150,
  "rag_documents_found": 3,
  "cache_hit": true
}
```

#### Filtros Importantes:
- **Erros de IA**: `severity>=ERROR AND service="ai_orchestrator"`
- **Performance**: `response_time_ms>2000`
- **Rate Limiting**: `message="rate_limit_exceeded"`

### 4. **Google Cloud Trace** - Performance Detalhada
```
Request → Trace Spans → Cloud Trace → Performance Insights
```

#### Traces Customizados:
```python
# apps/backend/core/ai/orchestrator.py
from google.cloud import trace_v1

def create_chat_response(message, persona):
    with trace_v1.Client().span(name="chat_response_generation"):
        with trace_v1.Client().span(name="rag_search"):
            # Busca no conhecimento
            documents = search_knowledge(message)
        
        with trace_v1.Client().span(name="llm_call"):
            # Chamada para LLM
            response = call_openrouter(message, documents, persona)
        
        return response
```

## 🔧 Implementação por Componente

### Frontend - Next.js Analytics

#### 1. Configuração GA4:
```javascript
// apps/frontend-nextjs/src/app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  )
}
```

#### 2. Eventos Customizados:
```javascript
// apps/frontend-nextjs/src/hooks/useAnalytics.ts
export function useAnalytics() {
  const trackChatMessage = (persona: string, messageLength: number) => {
    gtag('event', 'chat_message', {
      event_category: 'engagement',
      persona_selected: persona,
      message_length: messageLength,
      timestamp: Date.now()
    })
  }

  const trackPersonaSwitch = (fromPersona: string, toPersona: string) => {
    gtag('event', 'persona_switch', {
      event_category: 'ui_interaction',
      from_persona: fromPersona,
      to_persona: toPersona
    })
  }

  return { trackChatMessage, trackPersonaSwitch }
}
```

#### 3. Core Web Vitals:
```javascript
// apps/frontend-nextjs/src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToGoogleAnalytics({name, delta, value, id}) {
  gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    event_label: id,
    non_interaction: true
  })
}

getCLS(sendToGoogleAnalytics)
getFID(sendToGoogleAnalytics)
getFCP(sendToGoogleAnalytics)
getLCP(sendToGoogleAnalytics)
getTTFB(sendToGoogleAnalytics)
```

### Backend - Cloud Monitoring Integration

#### 1. Logging Estruturado:
```python
# apps/backend/core/utils/logger.py
import logging
import json
import os
from google.cloud.logging import Client

class StructuredLogger:
    def __init__(self, service_name: str):
        self.client = Client()
        self.client.setup_logging()
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
    
    def log_chat_interaction(self, persona: str, response_time: float, success: bool):
        log_entry = {
            "service": self.service_name,
            "event_type": "chat_interaction",
            "persona": persona,
            "response_time_ms": response_time,
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if success:
            self.logger.info(json.dumps(log_entry))
        else:
            self.logger.error(json.dumps(log_entry))
```

#### 2. Métricas Customizadas:
```python
# apps/backend/core/monitoring/metrics.py
import os
from google.cloud.monitoring_v3 import MetricServiceClient
from google.cloud.monitoring_v3.types import TimeSeries, Point

class CustomMetrics:
    def __init__(self):
        self.client = MetricServiceClient()
        self.project_name = f"projects/{os.getenv('GOOGLE_CLOUD_PROJECT_ID')}"
    
    def record_chat_response_time(self, persona: str, response_time_ms: float):
        """Registra tempo de resposta do chat"""
        series = TimeSeries()
        series.metric.type = "custom.googleapis.com/chat/response_time"
        series.metric.labels["persona"] = persona
        
        point = Point()
        point.value.double_value = response_time_ms
        point.interval.end_time.GetCurrentTime()
        
        series.points = [point]
        self.client.create_time_series(
            name=self.project_name, 
            time_series=[series]
        )
    
    def increment_persona_usage(self, persona: str):
        """Incrementa contador de uso de persona"""
        series = TimeSeries()
        series.metric.type = "custom.googleapis.com/persona/usage_count"
        series.metric.labels["persona"] = persona
        
        point = Point()
        point.value.int64_value = 1
        point.interval.end_time.GetCurrentTime()
        
        series.points = [point]
        self.client.create_time_series(
            name=self.project_name,
            time_series=[series]
        )
```

## 📈 Dashboards e Alertas

### Google Analytics Dashboard
```
Usuários Ativos → Sessões → Conversas → Personas Utilizadas
     ↓              ↓           ↓            ↓
  Engagement    Page Views   Mensagens   Preferências
```

**Métricas Principais:**
- Daily/Monthly Active Users
- Session Duration médio
- Bounce Rate por página
- Conversion Rate (iniciar conversa)
- Persona Preference Distribution

### Cloud Monitoring Dashboard
```
Infrastructure → Application → Business
      ↓              ↓           ↓
  CPU/Memory    Response Time   Chat Success Rate
   Instances    Error Rate     Persona Usage
```

**Painéis Configurados:**
1. **Infrastructure Health**
   - CPU/Memory usage
   - Instance count
   - Network traffic

2. **Application Performance**
   - Response time percentiles
   - Error rate by endpoint
   - Cache hit rate

3. **Business Metrics**
   - Chat interactions/hour
   - Persona usage distribution
   - User satisfaction proxy

### Alertas Críticos

#### 1. Infrastructure Alerts:
```yaml
# CPU Alto
- condition: cpu_utilization > 80%
  duration: 5 minutes
  notification: slack + email

# Memory Alto  
- condition: memory_utilization > 85%
  duration: 3 minutes
  notification: slack + email

# Error Rate Alto
- condition: error_rate > 5%
  duration: 2 minutes
  notification: slack + email + sms
```

#### 2. Application Alerts:
```yaml
# Response Time Alto
- condition: response_time_p95 > 3000ms
  duration: 5 minutes
  notification: slack

# AI Service Down
- condition: ai_success_rate < 90%
  duration: 1 minute
  notification: slack + email

# Cache Miss Rate Alto
- condition: cache_hit_rate < 70%
  duration: 10 minutes
  notification: slack
```

## 🔍 Análises Avançadas

### 1. User Journey Analysis (GA4)
```javascript
// Funil de conversão
gtag('event', 'page_view', { page_title: 'Home' })
gtag('event', 'persona_select', { persona: 'dr_gasnelio' })
gtag('event', 'first_message', { persona: 'dr_gasnelio' })
gtag('event', 'conversation_continue', { message_count: 5 })
```

### 2. A/B Testing para Personas
```javascript
// Teste A/B: ordem de apresentação das personas
gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
  custom_map: {
    'custom_parameter_1': 'persona_order_test'
  }
})

gtag('event', 'persona_order_experiment', {
  experiment_id: 'persona_order_v1',
  variant_id: 'order_gasnelio_first'
})
```

### 3. Performance Correlation Analysis
```sql
-- BigQuery query para correlacionar performance e engajamento
SELECT 
  page_load_time_bucket,
  AVG(session_duration) as avg_session_duration,
  AVG(messages_per_session) as avg_messages,
  COUNT(*) as sessions
FROM `project.analytics.user_sessions`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY page_load_time_bucket
ORDER BY page_load_time_bucket
```

## 🚀 Configuração de Deploy

### Environment Variables nos workflows:
```yaml
# .github/workflows/main-pipeline.yml
--set-env-vars="
  NEXT_PUBLIC_GA_MEASUREMENT_ID=${{ secrets.GA_MEASUREMENT_ID }},
  GOOGLE_CLOUD_PROJECT_ID=${{ secrets.GOOGLE_CLOUD_PROJECT_ID }},
  MONITORING_ENABLED=true,
  STRUCTURED_LOGGING=true,
  GOOGLE_APPLICATION_CREDENTIALS_JSON=${{ secrets.GOOGLE_APPLICATION_CREDENTIALS_JSON }}
"
```

## 📋 Próximos Passos de Implementação

### Fase 1: Configuração Básica (1-2 dias)
1. ✅ Criar conta Google Analytics 4
2. ✅ Configurar Cloud Monitoring no projeto GCP
3. ✅ Implementar GA4 no frontend Next.js
4. ✅ Configurar logging estruturado no backend

### Fase 2: Métricas Customizadas (3-5 dias)  
1. ✅ Implementar eventos customizados GA4
2. ✅ Criar métricas customizadas Cloud Monitoring
3. ✅ Configurar traces detalhados
4. ✅ Setup de alertas críticos

### Fase 3: Dashboards e Análises (5-7 dias)
1. ✅ Construir dashboards no Cloud Monitoring
2. ✅ Configurar relatórios GA4 customizados
3. ✅ Implementar análise de user journey
4. ✅ Setup de alertas de negócio

### Fase 4: Otimização e Automação (ongoing)
1. ✅ Correlação de métricas performance/engagement
2. ✅ A/B testing para melhorias UX
3. ✅ Alertas inteligentes baseados em ML
4. ✅ Relatórios automatizados

## 💰 Custos Estimados

### Google Analytics 4: **GRATUITO**
- Até 10M eventos/mês
- Relatórios padrão ilimitados
- Integração BigQuery (opcional)

### Google Cloud Monitoring: **~$15-30/mês**
- Logs: ~$0.50/GB
- Métricas customizadas: ~$0.30/métrica
- Alertas: ~$0.20/política

### Total Estimado: **$15-30/mês**
- Muito mais econômico que soluções como Datadog ($15/host/mês)
- ROI alto com insights detalhados

---

**🎯 Resultado:** Sistema de monitoramento enterprise-grade usando ferramentas Google Cloud profissionais, eliminando desenvolvimento custom e garantindo escalabilidade, confiabilidade e insights detalhados sobre performance e usuários.