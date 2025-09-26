# Estratégia de Arquitetura de Analytics - Roteiro de Dispensação Hanseníase

## Análise do Estado Atual

### Analytics Já Implementados

#### 1. **Frontend Analytics (Next.js)**
- **GA4 Integration** (`services/analytics.ts`)
  - Tracking de eventos básicos
  - Page views
  - Eventos customizados
  - User properties

- **Medical Analytics** (`utils/medicalAnalytics.ts`)
  - Eventos críticos médicos
  - Tracking de tarefas clínicas
  - Métricas de urgência
  - Core Web Vitals

- **UX Tracking** (`lib/analytics/uxTracking.ts`)
  - Cognitive load metrics
  - Mobile experience metrics
  - Onboarding metrics
  - Microsoft Clarity integration

- **Educational Analytics** (`utils/educationalAnalytics.ts`)
  - Learning metrics
  - Engagement tracking
  - Quality monitoring
  - Performance metrics

#### 2. **Backend Analytics (Flask)**
- **Medical Analytics Service** (recém-criado)
  - SQLite para armazenamento local
  - Google Storage para agregação
  - Session management
  - Real-time metrics

## Separação Proposta: GA4 vs Sistema Interno

### 🌐 **Google Analytics 4 (Métricas UX/Comportamento)**

#### Responsabilidades do GA4:
1. **Métricas de Comportamento do Usuário**
   - Page views e navegação
   - Session duration
   - Bounce rate
   - User flow
   - Device/Browser analytics

2. **Performance & Core Web Vitals**
   - Page load times
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Cumulative Layout Shift (CLS)
   - First Input Delay (FID)

3. **Conversões & Funil**
   - User journey tracking
   - Goal completions
   - Drop-off points
   - A/B testing results

4. **Aquisição & Retenção**
   - Traffic sources
   - User demographics
   - Return rate
   - Cohort analysis

5. **Eventos UX Genéricos**
   - Button clicks
   - Form submissions
   - Scroll depth
   - Video engagement

### 🏥 **Sistema Interno (Métricas Médicas/Educacionais)**

#### Responsabilidades do Sistema Interno (SQLite + Google Storage):

1. **Métricas Médicas Específicas**
   - Perguntas médicas realizadas
   - Respostas das personas (Dr. Gasnelio vs Gá)
   - Taxa de fallback
   - Taxa de resolução de dúvidas
   - Urgência das consultas
   - Erros médicos críticos

2. **Analytics Educacionais**
   - Progresso de aprendizagem
   - Casos clínicos completados
   - Certificações obtidas
   - Competências adquiridas
   - Padrões de erro recorrentes

3. **Dados Sensíveis (LGPD)**
   - Interações com conteúdo médico
   - Histórico de perguntas clínicas
   - Preferências de personas
   - Dados de profissionais de saúde

4. **Métricas de Qualidade do Sistema**
   - Tempo de resposta das personas
   - Taxa de erro da API
   - Uso de recursos do servidor
   - Qualidade das respostas (scoring)

5. **Relatórios Customizados**
   - Top perguntas médicas
   - Horários de pico de uso médico
   - Análise de personas
   - Relatórios para o Ministério da Saúde

## Implementação Recomendada

### 1. **Frontend (Next.js)**

```typescript
// analytics/gaTracking.ts - APENAS métricas UX
export const trackUXEvent = (event: {
  action: string;
  category: 'navigation' | 'interaction' | 'performance';
  label?: string;
  value?: number;
}) => {
  // Envia para GA4
  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value
  });
};

// analytics/medicalTracking.ts - APENAS métricas médicas
export const trackMedicalEvent = async (event: {
  type: 'question' | 'persona_response' | 'clinical_task';
  data: MedicalEventData;
}) => {
  // Envia para API interna
  await fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify(event)
  });
};
```

### 2. **Backend (Flask)**

```python
# Endpoint unificado para métricas médicas
@app.route('/api/analytics/track', methods=['POST'])
def track_medical_event():
    # Salva no SQLite local
    analytics_service.track_event(request.json)

    # Agregação diária para Google Storage
    if should_aggregate():
        analytics_service.export_to_storage()

    return jsonify({'success': True})

# Dashboard consume ambas as fontes
@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_data():
    # Dados do GA4 (via API)
    ga4_data = fetch_ga4_metrics()

    # Dados internos (SQLite)
    internal_data = analytics_service.get_aggregated_metrics()

    # Combina e retorna
    return jsonify({
        'ux_metrics': ga4_data,      # GA4
        'medical_metrics': internal_data  # Internal
    })
```

## Benefícios desta Arquitetura

### ✅ **Vantagens**

1. **Separação de Responsabilidades**
   - GA4 para UX (já otimizado para isso)
   - Sistema interno para dados médicos sensíveis

2. **Compliance LGPD**
   - Dados médicos não saem para Google
   - Controle total sobre dados sensíveis

3. **Performance**
   - GA4 já otimizado para web analytics
   - SQLite local rápido para queries médicas

4. **Custo**
   - GA4 gratuito para volume atual
   - SQLite sem custo adicional
   - Google Storage barato para backups

5. **Facilidade de Implementação**
   - Aproveita GA4 existente
   - SQLite simples de manter
   -  GA4 Measurement ID no GitHub Secrets (Já configurado)

## Próximos Passos

### Fase 1: Configuração GA4 (Imediato)
1. ✅ Configurar conversões e goals
2. ✅ Implementar eventos UX básicos

### Fase 2: Sistema Interno (Esta Sprint)
1. ✅ Criar serviço SQLite (já feito)
2. ⏳ Integrar com chatbot service
3. ⏳ Implementar agregação para Google Storage
4. ⏳ Criar endpoints de API

### Fase 3: Dashboard Unificado (Próxima Sprint)
1. ⏳ Integrar GA4 API no dashboard
2. ⏳ Combinar métricas internas
3. ⏳ Criar visualizações híbridas

### Fase 4: Otimização (Futuro)
1. ⏳ Implementar cache
2. ⏳ Adicionar real-time analytics
3. ⏳ Machine learning insights

## Decisão Final

**Recomendação**: Usar abordagem híbrida:
- **GA4** para todas as métricas de UX e comportamento
- **SQLite + Google Storage** para métricas médicas e educacionais
- **Dashboard unificado** consumindo ambas as fontes

Esta arquitetura oferece o melhor dos dois mundos: aproveita a robustez do GA4 para UX enquanto mantém controle total sobre dados médicos sensíveis.