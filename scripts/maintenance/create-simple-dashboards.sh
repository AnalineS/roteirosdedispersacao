#!/bin/bash

# Script simplificado para criar dashboards funcionais no GCP Monitoring
# Execução: bash scripts/create-simple-dashboards.sh [PROJECT_ID]

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"

echo "📊 Criando dashboards simples no Google Cloud Monitoring"
echo "Projeto: $PROJECT_ID"
echo "=================================================="

# Configurar projeto
gcloud config set project $PROJECT_ID

echo "1/2 - Criando dashboard principal do sistema..."

# Dashboard Principal - Simples e Funcional
cat > /tmp/dashboard-main-simple.json << 'EOF'
{
  "displayName": "🚀 Roteiro de Dispensação - Sistema Principal",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "📊 Cloud Run - Requisições",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "yAxis": {
              "label": "Requests/min",
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
          "title": "⚡ Cloud Run - Latência",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_DELTA",
                    "crossSeriesReducer": "REDUCE_PERCENTILE_95"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "yPos": 4,
        "widget": {
          "title": "💾 Cloud Run - Uso de Memória",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/memory/utilizations\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN",
                    "crossSeriesReducer": "REDUCE_MEAN"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "yAxis": {
              "label": "Memory %",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "yPos": 4,
        "widget": {
          "title": "🔥 Cloud Run - CPU",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/cpu/utilizations\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN",
                    "crossSeriesReducer": "REDUCE_MEAN"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "yAxis": {
              "label": "CPU %",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-main-simple.json

echo "2/2 - Criando dashboard de logs e erros..."

# Dashboard de Logs - Funcional
cat > /tmp/dashboard-logs-simple.json << 'EOF'
{
  "displayName": "🔍 Roteiro de Dispensação - Logs & Erros",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 12,
        "height": 6,
        "widget": {
          "title": "📋 Logs Recentes do Sistema",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\")",
            "resourceNames": []
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "yPos": 6,
        "widget": {
          "title": "🚨 Logs de Erro",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND (severity=ERROR OR severity=CRITICAL)",
            "resourceNames": []
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "yPos": 6,
        "widget": {
          "title": "⚠️ Logs de Warning",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name:\"roteiro\" OR resource.labels.service_name:\"hml-roteiro\") AND severity=WARNING",
            "resourceNames": []
          }
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-logs-simple.json

# Limpar arquivos temporários
rm -f /tmp/dashboard-*-simple.json

echo ""
echo "✅ Dashboards básicos criados com sucesso!"
echo ""
echo "📊 Dashboards criados:"
echo "  • 🚀 Sistema Principal - Métricas Cloud Run básicas"
echo "  • 🔍 Logs & Erros - Visualização de logs do sistema"
echo ""
echo "🔗 Acesse os dashboards em:"
echo "   https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo ""
echo "📈 Próximos passos:"
echo "   1. Configurar alertas"
echo "   2. Deploy HML para começar a coletar dados"
echo "   3. Expandir dashboards após deploy"