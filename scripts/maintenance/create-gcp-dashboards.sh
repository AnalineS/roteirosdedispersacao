#!/bin/bash

# Script para criar dashboards no Google Cloud Monitoring
# Execução: bash scripts/create-gcp-dashboards.sh [PROJECT_ID]

set -e

PROJECT_ID="${1:-red-truck-468923-s4}"
SERVICE_NAME_HML="hml-roteiro-dispensacao-api"
SERVICE_NAME_PROD="roteiro-dispensacao-api"

echo "📊 Criando dashboards do Google Cloud Monitoring"
echo "Projeto: $PROJECT_ID"
echo "=================================================="

# Configurar projeto
gcloud config set project $PROJECT_ID

# Verificar se gcloud está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Erro: gcloud não está autenticado"
    echo "Execute: gcloud auth login"
    exit 1
fi

echo "1/4 - Criando dashboard principal do sistema..."

# Dashboard Principal - Overview do Sistema
cat > /tmp/dashboard-main.json << 'EOF'
{
  "displayName": "🚀 Roteiro de Dispensação - Sistema Principal",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "📊 Cloud Run - Requisições por Minuto",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM"
                  }
                }
              },
              "plotType": "LINE"
            }],
            "timeshiftDuration": "0s",
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
          "title": "⚡ Latência de Resposta P95",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\"",
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
        "width": 12,
        "height": 4,
        "yPos": 4,
        "widget": {
          "title": "🔥 Logs de Erro - Últimas 24h",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND severity>=ERROR",
            "resourceNames": []
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "yPos": 8,
        "widget": {
          "title": "💾 Uso de Memória",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\"",
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
        "yPos": 8,
        "widget": {
          "title": "🔥 CPU Utilization",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/cpu/utilizations\"",
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

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-main.json

echo "2/4 - Criando dashboard de personas e métricas de negócio..."

# Dashboard Personas - Métricas de Negócio
cat > /tmp/dashboard-personas.json << 'EOF'
{
  "displayName": "🤖 Roteiro de Dispensação - Personas & UX",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "🧠 Interações por Persona",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/persona_interaction\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["persona"]
                  }
                }
              },
              "plotType": "STACKED_BAR"
            }],
            "yAxis": {
              "label": "Interações/min",
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
          "title": "⏱️ Tempo de Resposta das Personas",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/persona_response_time\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_MEAN",
                    "crossSeriesReducer": "REDUCE_PERCENTILE_95",
                    "groupByFields": ["persona"]
                  }
                }
              },
              "plotType": "LINE"
            }],
            "yAxis": {
              "label": "Response Time (ms)",
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
          "title": "📚 Progresso Educacional - Módulos Completados",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND jsonPayload.metric_type=\"educational_progress\" AND jsonPayload.completed=true",
                  "aggregation": {
                    "alignmentPeriod": "3600s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["jsonPayload.module"]
                  }
                }
              },
              "plotType": "STACKED_AREA"
            }],
            "yAxis": {
              "label": "Modules Completed/hour",
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
          "title": "🌐 Performance Frontend - Page Load",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND jsonPayload.metric_type=\"performance\" AND jsonPayload.metric_name=\"page_load_time\"",
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
              "label": "Load Time (ms)",
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
          "title": "✅ Taxa de Sucesso das Personas",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND jsonPayload.metric_type=\"persona_usage\" AND jsonPayload.success=true",
                "aggregation": {
                  "alignmentPeriod": "3600s",
                  "perSeriesAligner": "ALIGN_RATE",
                  "crossSeriesReducer": "REDUCE_SUM"
                }
              }
            },
            "gaugeView": {
              "lowerBound": 0.0,
              "upperBound": 100.0
            }
          }
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-personas.json

echo "3/4 - Criando dashboard de segurança e erros..."

# Dashboard Segurança e Erros
cat > /tmp/dashboard-security.json << 'EOF'
{
  "displayName": "🔒 Roteiro de Dispensação - Segurança & Erros",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 12,
        "height": 4,
        "widget": {
          "title": "🚨 Error Rate por Endpoint",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class!=\"2xx\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["metric.label.response_code"]
                  }
                }
              },
              "plotType": "STACKED_BAR"
            }],
            "yAxis": {
              "label": "Errors/min",
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
          "title": "🛡️ Rate Limiting - Requests Bloqueados",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code=\"429\"",
                "aggregation": {
                  "alignmentPeriod": "300s",
                  "perSeriesAligner": "ALIGN_RATE",
                  "crossSeriesReducer": "REDUCE_SUM"
                }
              }
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
          "title": "📊 Status Codes Distribution",
          "pieChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM",
                    "groupByFields": ["metric.label.response_code_class"]
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 12,
        "height": 4,
        "yPos": 8,
        "widget": {
          "title": "🔍 Logs Críticos - Error Reporting",
          "logsPanel": {
            "filter": "resource.type=\"cloud_run_revision\" AND (severity=ERROR OR severity=CRITICAL) AND timestamp>=\"24h\"",
            "resourceNames": []
          }
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-security.json

echo "4/4 - Criando dashboard de infraestrutura..."

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
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/instance_count\"",
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
          "title": "🌐 Firebase Hosting - Requests",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"firebase_domain\" AND metric.type=\"firebase.googleapis.com/hosting/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
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
        "width": 12,
        "height": 4,
        "yPos": 4,
        "widget": {
          "title": "💰 Cloud Run - Billing Usage",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/billable_instance_time\"",
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
              "label": "Billable Time (hours)",
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
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/container/startup_latencies\"",
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
          "title": "🔄 Health Check Success Rate",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND jsonPayload.endpoint=\"/health\" AND jsonPayload.status=200",
                "aggregation": {
                  "alignmentPeriod": "300s",
                  "perSeriesAligner": "ALIGN_RATE",
                  "crossSeriesReducer": "REDUCE_SUM"
                }
              }
            },
            "gaugeView": {
              "lowerBound": 0.0,
              "upperBound": 100.0
            }
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
echo "✅ Todos os dashboards foram criados com sucesso!"
echo ""
echo "📊 Dashboards criados:"
echo "  • 🚀 Sistema Principal - Overview geral do sistema"
echo "  • 🤖 Personas & UX - Métricas de negócio e experiência"
echo "  • 🔒 Segurança & Erros - Monitoramento de segurança"
echo "  • ☁️ Infraestrutura - Recursos GCP e performance"
echo ""
echo "🔗 Acesse os dashboards em:"
echo "   https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo ""
echo "📈 Próximos passos:"
echo "   1. Configurar alertas com: bash scripts/setup-gcp-alerts.sh"
echo "   2. Testar observabilidade: curl [BACKEND_URL]/api/v1/observability/test"
echo "   3. Verificar métricas chegando nos dashboards"