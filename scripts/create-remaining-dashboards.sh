#!/bin/bash

# Script para criar os dashboards restantes (Personas & Infraestrutura)
# Execução: bash scripts/create-remaining-dashboards.sh [PROJECT_ID]

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"

echo "📊 Criando dashboards restantes no Google Cloud Monitoring"
echo "Projeto: $PROJECT_ID"
echo "=================================================="

# Configurar projeto
gcloud config set project $PROJECT_ID

echo "3/4 - Criando dashboard de Personas & UX..."

# Dashboard Personas & UX
cat > /tmp/dashboard-personas.json << 'EOF'
{
  "displayName": "🤖 Roteiro de Dispensação - Personas & UX",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 12,
        "height": 4,
        "widget": {
          "title": "🧠 Logs de Interação com Personas",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND (jsonPayload.persona=\"gasnelio\" OR jsonPayload.persona=\"ga\" OR textPayload:\"persona\")",
            "resourceNames": []
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "yPos": 4,
        "widget": {
          "title": "📚 Logs de Progresso Educacional",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND (jsonPayload.metric_type=\"educational_progress\" OR textPayload:\"educational\" OR textPayload:\"progress\")",
            "resourceNames": []
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "yPos": 4,
        "widget": {
          "title": "🌐 Logs de Performance Frontend",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND (jsonPayload.metric_type=\"performance\" OR textPayload:\"page_load\" OR textPayload:\"frontend\")",
            "resourceNames": []
          }
        }
      },
      {
        "width": 12,
        "height": 3,
        "yPos": 8,
        "widget": {
          "title": "✅ Métricas de Sucesso das Personas",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND (jsonPayload.success=true OR jsonPayload.success=false) AND jsonPayload.persona",
            "resourceNames": []
          }
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-personas.json

echo "4/4 - Criando dashboard de Infraestrutura..."

# Dashboard Infraestrutura
cat > /tmp/dashboard-infrastructure.json << 'EOF'
{
  "displayName": "☁️ Roteiro de Dispensação - Infraestrutura",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "🏃 Cloud Run - Container Instances",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/instance_count\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["resource.label.service_name"]
                  }
                }
              },
              "plotType": "STACKED_AREA"
            }],
            "yAxis": {
              "label": "Instances",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "widget": {
          "title": "📊 Cloud Run - Status Codes",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["metric.label.response_code_class"]
                  }
                }
              },
              "plotType": "STACKED_BAR"
            }],
            "yAxis": {
              "label": "Requests/min",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 12,
        "height": 4,
        "yPos": 4,
        "widget": {
          "title": "💰 Cloud Run - Billing Usage",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/billable_instance_time\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "3600s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["resource.label.service_name"]
                  }
                }
              },
              "plotType": "STACKED_BAR"
            }],
            "yAxis": {
              "label": "Billable Time (seconds/hour)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "yPos": 8,
        "widget": {
          "title": "📦 Container Startup Time",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/startup_latencies\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_MEAN",
                    "crossSeriesReducer": "REDUCE_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "yAxis": {
              "label": "Startup Time (ms)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "yPos": 8,
        "widget": {
          "title": "🔄 Health Check Logs",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND (textPayload:\"/health\" OR jsonPayload.endpoint:\"/health\")",
            "resourceNames": []
          }
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-infrastructure.json

# Limpar arquivos temporários
rm -f /tmp/dashboard-*.json

echo ""
echo "✅ Dashboards restantes criados com sucesso!"
echo ""
echo "📊 Total de dashboards (4/4):"
echo "  • 🚀 Sistema Principal (já criado)"
echo "  • 🔍 Logs & Erros (já criado)"
echo "  • 🤖 Personas & UX (novo)"
echo "  • ☁️ Infraestrutura (novo)"
echo ""
echo "🔗 Acesse todos os dashboards em:"
echo "   https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"