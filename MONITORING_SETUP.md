# Guia de Configuração de Monitoramento - Fase 3
## Plataforma Educacional Médica sobre Hanseníase

**Versão:** 3.0.0  
**Data:** 07/09/2025  
**Objetivo:** Configuração completa de monitoramento para ambiente médico de produção

---

## 🎯 Visão Geral do Monitoramento

O monitoramento da plataforma educacional médica é **crítico** e **obrigatório**, abrangendo:

- **Precisão Médica:** Monitoramento contínuo de cálculos e protocolos
- **Conformidade LGPD:** Auditoria em tempo real de dados sensíveis
- **Acessibilidade WCAG:** Validação contínua de inclusão
- **Performance por Persona:** Otimização específica para Dr. Gasnelio e GA
- **Disponibilidade:** Uptime 99.9% obrigatório para sistema crítico de saúde

---

## 📊 Arquitetura de Monitoramento

### Stack de Monitoramento
```
┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO               │
├─────────────────────────────────────────────────────────┤
│  Dashboard Web     │  Grafana          │  Alertas       │
│  (Tempo Real)      │  (Métricas)       │  (Inteligentes) │
├─────────────────────────────────────────────────────────┤
│                    CAMADA DE COLETA                     │
├─────────────────────────────────────────────────────────┤
│  Prometheus        │  ElasticSearch    │  Custom         │
│  (Métricas)        │  (Logs)           │  (Médico/LGPD)  │
├─────────────────────────────────────────────────────────┤
│                    CAMADA DE APLICAÇÃO                  │
├─────────────────────────────────────────────────────────┤
│  App Metrics       │  System Metrics   │  Business       │
│  (Performance)     │  (Infra)          │  (Compliance)   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuração Inicial

### 1. Preparação do Ambiente

#### 1.1 Criar Estrutura de Diretórios
```bash
# Criar estrutura para monitoramento
sudo mkdir -p /opt/monitoring/{prometheus,grafana,elasticsearch}
sudo mkdir -p /var/log/monitoring
sudo mkdir -p /etc/monitoring/config

# Configurar permissões
sudo chown -R hanseniase:hanseniase /opt/monitoring
sudo chown -R hanseniase:hanseniase /var/log/monitoring
```

#### 1.2 Instalar Docker e Docker Compose
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker hanseniase

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configuração do Docker Compose

#### 2.1 Arquivo Principal de Monitoramento
```bash
# Criar docker-compose.monitoring.yml
sudo -u hanseniase tee /opt/monitoring/docker-compose.yml > /dev/null <<'EOF'
version: '3.8'

services:
  # Prometheus - Coleta de Métricas
  prometheus:
    image: prom/prometheus:latest
    container_name: hanseniase-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped
    networks:
      - monitoring

  # Grafana - Visualização
  grafana:
    image: grafana/grafana:latest
    container_name: hanseniase-grafana
    ports:
      - "3100:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=hanseniase_admin_2025!
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SECURITY_SECRET_KEY=hanseniase_grafana_secret_key
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - monitoring

  # ElasticSearch - Logs e Auditoria
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: hanseniase-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    restart: unless-stopped
    networks:
      - monitoring

  # Kibana - Interface para Logs
  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    container_name: hanseniase-kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    restart: unless-stopped
    networks:
      - monitoring

  # Node Exporter - Métricas do Sistema
  node-exporter:
    image: prom/node-exporter:latest
    container_name: hanseniase-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

  # AlertManager - Gerenciamento de Alertas
  alertmanager:
    image: prom/alertmanager:latest
    container_name: hanseniase-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    restart: unless-stopped
    networks:
      - monitoring

  # Redis Exporter - Métricas do Cache
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: hanseniase-redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://host.docker.internal:6379
    restart: unless-stopped
    networks:
      - monitoring

  # PostgreSQL Exporter - Métricas do Banco
  postgres-exporter:
    image: quay.io/prometheuscommunity/postgres-exporter:latest
    container_name: hanseniase-postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://hanseniase_user:sua_senha_segura@host.docker.internal:5432/hanseniase_prod?sslmode=disable
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:
  elasticsearch-data:

networks:
  monitoring:
    driver: bridge
EOF
```

### 3. Configuração do Prometheus

#### 3.1 Arquivo de Configuração Principal
```bash
# Criar diretório para configurações
sudo -u hanseniase mkdir -p /opt/monitoring/prometheus

# Configuração do Prometheus
sudo -u hanseniase tee /opt/monitoring/prometheus/prometheus.yml > /dev/null <<'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Carregar regras de alerta
rule_files:
  - "rules/*.yml"

# Configuração do AlertManager
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Métricas da aplicação principal
  - job_name: 'hanseniase-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Dashboard de monitoramento médico
  - job_name: 'hanseniase-dashboard'
    static_configs:
      - targets: ['host.docker.internal:3030']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  # Sistema de monitoramento contínuo
  - job_name: 'hanseniase-monitoring'
    static_configs:
      - targets: ['host.docker.internal:3031']
    metrics_path: '/metrics'
    scrape_interval: 15s

  # Métricas do sistema
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Métricas do Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Métricas do PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Auto-descoberta do Prometheus
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF
```

#### 3.2 Regras de Alerta Médico
```bash
# Criar diretório para regras
sudo -u hanseniase mkdir -p /opt/monitoring/prometheus/rules

# Regras específicas para ambiente médico
sudo -u hanseniase tee /opt/monitoring/prometheus/rules/medical-alerts.yml > /dev/null <<'EOF'
groups:
  - name: medical-critical
    interval: 10s
    rules:
      # Alerta crítico: Erro em cálculo médico
      - alert: MedicalCalculationError
        expr: hanseniase_medical_calculation_errors_total > 0
        for: 0s
        labels:
          severity: critical
          category: medical
        annotations:
          summary: "Erro detectado em cálculo médico"
          description: "Erro em cálculo médico detectado. Impacto direto no cuidado ao paciente."

      # Alerta crítico: Precisão médica abaixo do threshold
      - alert: MedicalAccuracyBelowThreshold
        expr: hanseniase_medical_accuracy_percentage < 95
        for: 30s
        labels:
          severity: critical
          category: medical
        annotations:
          summary: "Precisão médica abaixo de 95%"
          description: "Precisão médica atual: {{ $value }}%. Threshold mínimo: 95%"

      # Alerta crítico: Protocolo médico desatualizado
      - alert: MedicalProtocolOutdated
        expr: (time() - hanseniase_medical_protocol_last_update) > (30 * 24 * 3600)
        for: 0s
        labels:
          severity: high
          category: medical
        annotations:
          summary: "Protocolos médicos desatualizados"
          description: "Protocolos não atualizados há mais de 30 dias"

  - name: lgpd-compliance
    interval: 15s
    rules:
      # Alerta crítico: Violação LGPD detectada
      - alert: LGPDViolationDetected
        expr: hanseniase_lgpd_violations_total > 0
        for: 0s
        labels:
          severity: critical
          category: lgpd
        annotations:
          summary: "Violação LGPD detectada"
          description: "{{ $value }} violação(ões) LGPD detectada(s). Ação imediata necessária."

      # Alerta alto: Dados sensíveis expostos
      - alert: SensitiveDataExposed
        expr: hanseniase_sensitive_data_exposure_total > 0
        for: 0s
        labels:
          severity: critical
          category: lgpd
        annotations:
          summary: "Exposição de dados sensíveis detectada"
          description: "Possível exposição de dados médicos sensíveis"

      # Alerta médio: Compliance score baixo
      - alert: LGPDComplianceScoreLow
        expr: hanseniase_lgpd_compliance_score < 95
        for: 60s
        labels:
          severity: high
          category: lgpd
        annotations:
          summary: "Score de compliance LGPD baixo"
          description: "Score atual: {{ $value }}%. Mínimo requerido: 95%"

  - name: accessibility-wcag
    interval: 30s
    rules:
      # Alerta alto: Violação crítica de acessibilidade
      - alert: AccessibilityCriticalViolation
        expr: hanseniase_accessibility_critical_violations > 0
        for: 0s
        labels:
          severity: high
          category: accessibility
        annotations:
          summary: "Violação crítica de acessibilidade"
          description: "{{ $value }} violação(ões) crítica(s) WCAG 2.1 AA detectada(s)"

      # Alerta médio: Score WCAG abaixo do threshold
      - alert: WCAGScoreBelowThreshold
        expr: hanseniase_wcag_compliance_score < 90
        for: 120s
        labels:
          severity: medium
          category: accessibility
        annotations:
          summary: "Score WCAG abaixo de 90%"
          description: "Score atual: {{ $value }}%. Mínimo requerido: 90%"

  - name: performance-personas
    interval: 20s
    rules:
      # Alerta: Performance Dr. Gasnelio degradada
      - alert: DrGasnelioPerformanceDegraded
        expr: hanseniase_persona_response_time{persona="dr_gasnelio"} > 1000
        for: 60s
        labels:
          severity: high
          category: performance
          persona: dr_gasnelio
        annotations:
          summary: "Performance degradada para Dr. Gasnelio"
          description: "Tempo de resposta: {{ $value }}ms. Máximo aceitável: 1000ms"

      # Alerta: Performance GA degradada
      - alert: GAPerformanceDegraded
        expr: hanseniase_persona_response_time{persona="ga"} > 2000
        for: 60s
        labels:
          severity: medium
          category: performance
          persona: ga
        annotations:
          summary: "Performance degradada para GA"
          description: "Tempo de resposta: {{ $value }}ms. Máximo aceitável: 2000ms"

  - name: system-critical
    interval: 15s
    rules:
      # Alerta crítico: Aplicação down
      - alert: ApplicationDown
        expr: up{job="hanseniase-app"} == 0
        for: 30s
        labels:
          severity: critical
          category: system
        annotations:
          summary: "Aplicação principal indisponível"
          description: "A aplicação principal não está respondendo"

      # Alerta crítico: Dashboard de monitoramento down
      - alert: MonitoringDashboardDown
        expr: up{job="hanseniase-dashboard"} == 0
        for: 60s
        labels:
          severity: high
          category: system
        annotations:
          summary: "Dashboard de monitoramento indisponível"
          description: "O dashboard de monitoramento médico não está respondendo"

      # Alerta alto: Alto uso de memória
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 120s
        labels:
          severity: high
          category: system
        annotations:
          summary: "Alto uso de memória"
          description: "Uso de memória: {{ $value }}%. Threshold: 85%"

      # Alerta alto: Alto uso de CPU
      - alert: HighCPUUsage
        expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 300s
        labels:
          severity: high
          category: system
        annotations:
          summary: "Alto uso de CPU"
          description: "Uso de CPU: {{ $value }}%. Threshold: 80%"
EOF
```

### 4. Configuração do AlertManager

#### 4.1 Configuração de Notificações
```bash
# Criar diretório para AlertManager
sudo -u hanseniase mkdir -p /opt/monitoring/alertmanager

# Configuração do AlertManager
sudo -u hanseniase tee /opt/monitoring/alertmanager/alertmanager.yml > /dev/null <<'EOF'
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@seu-dominio.com.br'
  smtp_auth_username: 'alerts@seu-dominio.com.br'
  smtp_auth_password: 'sua_senha_de_app_google'

# Templates para notificações
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Configuração de roteamento
route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default-receiver'
  routes:
    # Alertas críticos médicos - notificação imediata
    - match:
        severity: critical
        category: medical
      receiver: 'medical-critical'
      group_wait: 0s
      repeat_interval: 15m

    # Alertas LGPD - notificação imediata para DPO
    - match:
        category: lgpd
      receiver: 'lgpd-compliance'
      group_wait: 0s
      repeat_interval: 30m

    # Alertas de acessibilidade
    - match:
        category: accessibility
      receiver: 'accessibility-team'
      repeat_interval: 2h

    # Alertas de sistema críticos
    - match:
        severity: critical
        category: system
      receiver: 'infrastructure-team'
      group_wait: 0s
      repeat_interval: 30m

# Receptores de notificação
receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'admin@seu-dominio.com.br'
        subject: '[Hanseníase] Alerta: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alerta: {{ .Annotations.summary }}
          Descrição: {{ .Annotations.description }}
          Severidade: {{ .Labels.severity }}
          Time: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
          {{ end }}

  - name: 'medical-critical'
    email_configs:
      - to: 'medical-team@seu-dominio.com.br, admin@seu-dominio.com.br'
        subject: '🚨 [CRÍTICO MÉDICO] {{ .GroupLabels.alertname }}'
        body: |
          ⚠️ ALERTA CRÍTICO MÉDICO DETECTADO ⚠️
          
          {{ range .Alerts }}
          📋 Alerta: {{ .Annotations.summary }}
          🔍 Descrição: {{ .Annotations.description }}
          🚨 Severidade: {{ .Labels.severity }}
          📅 Horário: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
          
          ⚡ AÇÃO IMEDIATA NECESSÁRIA ⚡
          Este alerta pode impactar diretamente o cuidado aos pacientes.
          {{ end }}
    
    # Slack para alertas críticos médicos
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/SEU/WEBHOOK/MEDICO'
        channel: '#alertas-medicos'
        title: '🚨 Alerta Médico Crítico'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        color: 'danger'

  - name: 'lgpd-compliance'
    email_configs:
      - to: 'dpo@seu-dominio.com.br, legal@seu-dominio.com.br'
        subject: '🛡️ [LGPD] {{ .GroupLabels.alertname }}'
        body: |
          🛡️ ALERTA DE CONFORMIDADE LGPD 🛡️
          
          {{ range .Alerts }}
          📋 Alerta: {{ .Annotations.summary }}
          🔍 Descrição: {{ .Annotations.description }}
          📅 Horário: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
          
          📞 Contatar DPO imediatamente
          📋 Documentar incidente para auditoria
          {{ end }}

  - name: 'accessibility-team'
    email_configs:
      - to: 'accessibility@seu-dominio.com.br'
        subject: '♿ [Acessibilidade] {{ .GroupLabels.alertname }}'

  - name: 'infrastructure-team'
    email_configs:
      - to: 'infra@seu-dominio.com.br'
        subject: '🔧 [Infraestrutura] {{ .GroupLabels.alertname }}'

# Configuração de inibição
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'high'
    equal: ['alertname', 'instance']
EOF
```

### 5. Configuração do Grafana

#### 5.1 Provisionamento de Dashboards
```bash
# Criar estrutura para Grafana
sudo -u hanseniase mkdir -p /opt/monitoring/grafana/{provisioning/dashboards,provisioning/datasources,dashboards}

# Configuração de datasources
sudo -u hanseniase tee /opt/monitoring/grafana/provisioning/datasources/datasources.yml > /dev/null <<'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    database: '[hanseniase-logs-]*'
    interval: Daily
    timeField: '@timestamp'
    editable: false
EOF

# Configuração de provisionamento de dashboards
sudo -u hanseniase tee /opt/monitoring/grafana/provisioning/dashboards/dashboards.yml > /dev/null <<'EOF'
apiVersion: 1

providers:
  - name: 'medical-dashboards'
    orgId: 1
    folder: 'Médico'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
```

#### 5.2 Dashboard Principal Médico
```bash
# Dashboard principal para monitoramento médico
sudo -u hanseniase tee /opt/monitoring/grafana/dashboards/medical-main-dashboard.json > /dev/null <<'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Plataforma Médica Hanseníase - Overview",
    "tags": ["hanseniase", "medical", "lgpd", "accessibility"],
    "timezone": "America/Sao_Paulo",
    "panels": [
      {
        "id": 1,
        "title": "Precisão Médica (%)",
        "type": "stat",
        "targets": [
          {
            "expr": "hanseniase_medical_accuracy_percentage",
            "legendFormat": "Precisão"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 90},
                {"color": "green", "value": 95}
              ]
            },
            "min": 0,
            "max": 100,
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Conformidade LGPD (%)",
        "type": "stat",
        "targets": [
          {
            "expr": "hanseniase_lgpd_compliance_score",
            "legendFormat": "LGPD"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 90},
                {"color": "green", "value": 95}
              ]
            },
            "min": 0,
            "max": 100,
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Score Acessibilidade WCAG (%)",
        "type": "stat",
        "targets": [
          {
            "expr": "hanseniase_wcag_compliance_score",
            "legendFormat": "WCAG 2.1 AA"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 85},
                {"color": "green", "value": 90}
              ]
            },
            "min": 0,
            "max": 100,
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Uptime Sistema (%)",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"hanseniase-app\"} * 100",
            "legendFormat": "Disponibilidade"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 99},
                {"color": "green", "value": 99.9}
              ]
            },
            "min": 0,
            "max": 100,
            "unit": "percent"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "Performance por Persona",
        "type": "graph",
        "targets": [
          {
            "expr": "hanseniase_persona_response_time{persona=\"dr_gasnelio\"}",
            "legendFormat": "Dr. Gasnelio"
          },
          {
            "expr": "hanseniase_persona_response_time{persona=\"ga\"}",
            "legendFormat": "GA (Farmacêutico)"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "yAxes": [
          {
            "unit": "ms",
            "max": 3000
          }
        ],
        "thresholds": [
          {
            "value": 1000,
            "colorMode": "critical",
            "op": "gt"
          },
          {
            "value": 2000,
            "colorMode": "critical",
            "op": "gt"
          }
        ]
      },
      {
        "id": 6,
        "title": "Alertas Críticos por Categoria",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (category) (ALERTS{alertstate=\"firing\", severity=\"critical\"})",
            "legendFormat": "{{ category }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
EOF
```

---

## 🚀 Inicialização do Monitoramento

### 1. Iniciar Stack de Monitoramento
```bash
# Ir para diretório de monitoramento
cd /opt/monitoring

# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Verificar logs iniciais
docker-compose logs -f --tail=50
```

### 2. Configurar Integração com Aplicação

#### 2.1 Adicionar Métricas à Aplicação
```bash
# Adicionar ao package.json da aplicação
npm install prom-client express-prometheus-middleware

# Implementar endpoint de métricas na aplicação principal
# (Este código seria adicionado ao servidor da aplicação)
```

#### 2.2 Configurar Coleta de Logs
```bash
# Configurar logrotate para enviar logs ao Elasticsearch
sudo tee /etc/logrotate.d/hanseniase-elasticsearch > /dev/null <<'EOF'
/var/log/hanseniase/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 hanseniase hanseniase
    postrotate
        # Enviar logs para Elasticsearch
        /opt/monitoring/scripts/send-logs-to-elasticsearch.sh
    endscript
}
EOF
```

### 3. Validar Configuração

#### 3.1 Testar Coleta de Métricas
```bash
# Verificar se Prometheus está coletando métricas
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Testar query de métricas médicas
curl -s "http://localhost:9090/api/v1/query?query=hanseniase_medical_accuracy_percentage"
```

#### 3.2 Testar Alertas
```bash
# Simular alerta crítico médico (para teste)
curl -X POST http://localhost:3000/api/test/trigger-medical-alert

# Verificar se alerta foi disparado
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {alertname: .labels.alertname, state: .state}'

# Verificar AlertManager
curl -s http://localhost:9093/api/v1/alerts
```

#### 3.3 Verificar Dashboards
```bash
# URLs de acesso:
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3100 (admin/hanseniase_admin_2025!)"
echo "Elasticsearch: http://localhost:9200"
echo "Kibana: http://localhost:5601"
echo "AlertManager: http://localhost:9093"
```

---

## 📊 Dashboards e Visualizações

### 1. URLs de Acesso

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Grafana | http://localhost:3100 | admin / hanseniase_admin_2025! |
| Prometheus | http://localhost:9090 | - |
| Kibana | http://localhost:5601 | - |
| AlertManager | http://localhost:9093 | - |
| Dashboard Médico | http://localhost:3030 | (aplicação) |

### 2. Dashboards Principais

#### 2.1 Dashboard Médico Principal
- **URL:** Grafana → "Médico" → "Plataforma Médica Hanseníase - Overview"
- **Métricas:** Precisão, LGPD, Acessibilidade, Performance por Persona
- **Refresh:** 10 segundos

#### 2.2 Dashboard de Conformidade
- **Foco:** LGPD, Auditoria, Logs de Acesso
- **Alertas:** Violações, Exposição de dados, Consentimentos

#### 2.3 Dashboard de Acessibilidade
- **Foco:** WCAG 2.1 AA, Contraste, Navegação por Teclado
- **Métricas:** Score de acessibilidade, Violações por página

#### 2.4 Dashboard de Sistema
- **Foco:** CPU, Memória, Rede, Disco
- **Alertas:** Disponibilidade, Performance de infraestrutura

---

## 🔧 Manutenção e Troubleshooting

### 1. Verificações Rotineiras

#### 1.1 Verificação Diária (Automatizada)
```bash
# Script de verificação diária
sudo tee /opt/monitoring/scripts/daily-health-check.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Iniciando verificação diária de monitoramento..."

# Verificar se todos os containers estão rodando
cd /opt/monitoring
CONTAINERS_DOWN=$(docker-compose ps | grep -v "Up" | grep -c "Exit\|Down")

if [ $CONTAINERS_DOWN -gt 0 ]; then
    echo "ERRO: $CONTAINERS_DOWN container(s) não estão rodando"
    docker-compose ps
    # Tentar reiniciar containers com problema
    docker-compose restart
fi

# Verificar métricas críticas
MEDICAL_ACCURACY=$(curl -s "http://localhost:9090/api/v1/query?query=hanseniase_medical_accuracy_percentage" | jq -r '.data.result[0].value[1]')
if (( $(echo "$MEDICAL_ACCURACY < 95" | bc -l) )); then
    echo "ALERTA: Precisão médica abaixo de 95%: $MEDICAL_ACCURACY%"
fi

# Verificar alertas ativos
ACTIVE_ALERTS=$(curl -s http://localhost:9093/api/v1/alerts | jq '.data | length')
if [ "$ACTIVE_ALERTS" -gt 0 ]; then
    echo "ATENÇÃO: $ACTIVE_ALERTS alerta(s) ativo(s)"
fi

echo "[$DATE] Verificação concluída"
EOF

chmod +x /opt/monitoring/scripts/daily-health-check.sh

# Agendar no cron
echo "0 8 * * * hanseniase /opt/monitoring/scripts/daily-health-check.sh >> /var/log/monitoring/daily-check.log 2>&1" | sudo tee -a /etc/crontab
```

### 2. Problemas Comuns

#### 2.1 Container Não Inicia
```bash
# Verificar logs do container
docker-compose logs <nome_do_container>

# Verificar recursos do sistema
docker system df
docker system prune -f

# Reiniciar container específico
docker-compose restart <nome_do_container>
```

#### 2.2 Métricas Não Coletadas
```bash
# Verificar conectividade
curl -I http://localhost:3000/api/metrics

# Verificar configuração do Prometheus
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml

# Recarregar configuração
curl -X POST http://localhost:9090/-/reload
```

#### 2.3 Alertas Não Disparados
```bash
# Verificar regras de alerta
curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | {alert: .name, state: .state}'

# Testar AlertManager
curl -s http://localhost:9093/api/v1/status

# Verificar configuração de email
docker-compose logs alertmanager | grep -i "email\|smtp"
```

---

## 📞 Suporte e Documentação

### Contatos da Equipe de Monitoramento
- **SRE/DevOps:** sre@seu-dominio.com.br
- **Monitoramento Médico:** medical-monitoring@seu-dominio.com.br
- **Compliance LGPD:** compliance@seu-dominio.com.br

### Links Úteis
- [Documentação Prometheus](https://prometheus.io/docs/)
- [Documentação Grafana](https://grafana.com/docs/)
- [Guias de Alertas](./alert-playbooks/)

---

**Última atualização:** 07/09/2025  
**Versão do Guia:** 3.0.0  
**Compatibilidade:** Plataforma v3.0.0+

> ⚠️ **Crítico:** O monitoramento é obrigatório em sistema médico. Nunca desabilitar em produção.