# -*- coding: utf-8 -*-
"""
OpenAPI/Swagger Specification
Documentação completa da API de Roteiros de Dispensação Hanseníase
"""

from flask import Blueprint, jsonify, render_template_string, request
from .auth import swagger_auth_required
import json

# Import Flask-Swagger-UI com fallback
try:
    from flask_swagger_ui import get_swaggerui_blueprint
    FLASK_SWAGGER_UI_AVAILABLE = True
except ImportError:
    FLASK_SWAGGER_UI_AVAILABLE = False
    def get_swaggerui_blueprint(*args, **kwargs):
        return None

# Template HTML para Swagger UI customizado
SWAGGER_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>API Roteiros de Dispensação - Documentação</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2c5282 }
        .swagger-ui .btn.authorize { background-color: #2c5282 }
        .swagger-ui .btn.execute { background-color: #38a169 }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function() {
            SwaggerUIBundle({
                url: "/api/v1/docs/openapi.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        }
    </script>
</body>
</html>
'''

class OpenAPISpec:
    """
    Gerador de especificação OpenAPI 3.0 para a API
    """
    
    @staticmethod
    def generate():
        """
        Gera a especificação completa da API
        """
        return {
            "openapi": "3.0.0",
            "info": {
                "title": "API Roteiros de Dispensação Hanseníase",
                "description": """
                ## 📚 Sobre
                
                API educacional para dispensação de medicamentos PQT-U (Poliquimioterapia Única) para hanseníase.
                Baseada na tese de doutorado de Nélio Gomes de Moura Júnior - UnB.
                
                ## 🤖 Personas Disponíveis
                
                - **Dr. Gasnelio**: Assistente técnico-científico especializado
                - **Gá**: Assistente empático com linguagem acessível
                
                ## 🔒 Autenticação
                
                Em produção, use o header `X-API-Key` ou `Authorization: Bearer <token>`
                
                ## [REPORT] Rate Limiting
                
                - Chat: 60 requisições/minuto
                - Cálculos: 30 requisições/minuto
                - Geral: 100 requisições/minuto
                """,
                "version": "1.0.0",
                "contact": {
                    "name": "Suporte Técnico",
                    "email": "suporte@roteirosdispensacao.com.br"
                },
                "license": {
                    "name": "Uso Educacional",
                    "url": "https://roteirosdispensacao.com.br/termos"
                }
            },
            "servers": [
                {
                    "url": "https://roteirosdispensacao.com.br/api/v1",
                    "description": "Produção"
                },
                {
                    "url": "http://localhost:8080/api/v1",
                    "description": "Desenvolvimento"
                }
            ],
            "tags": [
                {
                    "name": "Chat",
                    "description": "Interações com assistentes IA"
                },
                {
                    "name": "Personas",
                    "description": "Gerenciamento de personas"
                },
                {
                    "name": "Feedback",
                    "description": "Sistema de feedback"
                },
                {
                    "name": "Health",
                    "description": "Monitoramento e saúde do sistema"
                },
                {
                    "name": "Metrics",
                    "description": "Métricas e estatísticas"
                }
            ],
            "paths": {
                "/chat": {
                    "post": {
                        "tags": ["Chat"],
                        "summary": "Enviar mensagem para assistente",
                        "description": "Envia uma pergunta e recebe resposta do assistente selecionado",
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/ChatRequest"
                                    },
                                    "examples": {
                                        "dr_gasnelio": {
                                            "summary": "Pergunta técnica para Dr. Gasnelio",
                                            "value": {
                                                "question": "Qual a posologia da rifampicina na PQT-U?",
                                                "persona": "dr_gasnelio",
                                                "context": []
                                            }
                                        },
                                        "ga": {
                                            "summary": "Pergunta simples para Gá",
                                            "value": {
                                                "question": "Como tomar o remédio para hanseníase?",
                                                "persona": "ga",
                                                "context": []
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "Resposta do assistente",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/ChatResponse"
                                        }
                                    }
                                }
                            },
                            "400": {
                                "$ref": "#/components/responses/BadRequest"
                            },
                            "429": {
                                "$ref": "#/components/responses/RateLimited"
                            },
                            "500": {
                                "$ref": "#/components/responses/InternalError"
                            }
                        }
                    }
                },
                "/personas": {
                    "get": {
                        "tags": ["Personas"],
                        "summary": "Listar personas disponíveis",
                        "description": "Retorna informações detalhadas sobre Dr. Gasnelio e Gá",
                        "responses": {
                            "200": {
                                "description": "Lista de personas",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "personas": {
                                                    "type": "array",
                                                    "items": {
                                                        "$ref": "#/components/schemas/Persona"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/feedback": {
                    "post": {
                        "tags": ["Feedback"],
                        "summary": "Enviar feedback",
                        "description": "Registra feedback sobre resposta do assistente",
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/FeedbackRequest"
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "Feedback registrado",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/FeedbackResponse"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/health": {
                    "get": {
                        "tags": ["Health"],
                        "summary": "Status do sistema",
                        "description": "Verifica saúde geral do sistema",
                        "responses": {
                            "200": {
                                "description": "Sistema saudável",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/HealthStatus"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/health/live": {
                    "get": {
                        "tags": ["Health"],
                        "summary": "Liveness probe",
                        "description": "Verifica se o serviço está vivo (Kubernetes)",
                        "responses": {
                            "200": {
                                "description": "Serviço está vivo",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "status": {
                                                    "type": "string",
                                                    "example": "live"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/health/ready": {
                    "get": {
                        "tags": ["Health"],
                        "summary": "Readiness probe",
                        "description": "Verifica se o serviço está pronto (Kubernetes)",
                        "responses": {
                            "200": {
                                "description": "Serviço está pronto",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "status": {
                                                    "type": "string",
                                                    "example": "ready"
                                                },
                                                "checks": {
                                                    "type": "object"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "503": {
                                "description": "Serviço não está pronto"
                            }
                        }
                    }
                },
                "/metrics": {
                    "get": {
                        "tags": ["Metrics"],
                        "summary": "Métricas do sistema",
                        "description": "Retorna métricas de performance e uso",
                        "responses": {
                            "200": {
                                "description": "Métricas atuais",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "$ref": "#/components/schemas/Metrics"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "components": {
                "schemas": {
                    "ChatRequest": {
                        "type": "object",
                        "required": ["question", "persona"],
                        "properties": {
                            "question": {
                                "type": "string",
                                "description": "Pergunta do usuário",
                                "example": "Qual a dose de rifampicina para criança de 25kg?"
                            },
                            "persona": {
                                "type": "string",
                                "enum": ["dr_gasnelio", "ga"],
                                "description": "Persona selecionada"
                            },
                            "context": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "role": {
                                            "type": "string"
                                        },
                                        "content": {
                                            "type": "string"
                                        }
                                    }
                                },
                                "description": "Contexto da conversa"
                            }
                        }
                    },
                    "ChatResponse": {
                        "type": "object",
                        "properties": {
                            "response": {
                                "type": "string",
                                "description": "Resposta do assistente"
                            },
                            "persona": {
                                "type": "string",
                                "description": "Persona que respondeu"
                            },
                            "metadata": {
                                "type": "object",
                                "properties": {
                                    "qa_score": {
                                        "type": "number",
                                        "description": "Score de qualidade da resposta"
                                    },
                                    "sources": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        },
                                        "description": "Fontes consultadas"
                                    },
                                    "medical_disclaimers": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        },
                                        "description": "Avisos médicos aplicáveis"
                                    }
                                }
                            },
                            "request_id": {
                                "type": "string",
                                "description": "ID único da requisição"
                            }
                        }
                    },
                    "Persona": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "string",
                                "example": "dr_gasnelio"
                            },
                            "name": {
                                "type": "string",
                                "example": "Dr. Gasnelio"
                            },
                            "description": {
                                "type": "string",
                                "example": "Assistente técnico-científico especializado"
                            },
                            "avatar": {
                                "type": "string",
                                "example": "👨‍⚕️"
                            },
                            "characteristics": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "FeedbackRequest": {
                        "type": "object",
                        "required": ["question", "response", "rating"],
                        "properties": {
                            "question": {
                                "type": "string"
                            },
                            "response": {
                                "type": "string"
                            },
                            "rating": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 5
                            },
                            "comment": {
                                "type": "string"
                            },
                            "persona": {
                                "type": "string"
                            }
                        }
                    },
                    "FeedbackResponse": {
                        "type": "object",
                        "properties": {
                            "feedback_id": {
                                "type": "string"
                            },
                            "status": {
                                "type": "string",
                                "example": "recorded"
                            },
                            "timestamp": {
                                "type": "string",
                                "format": "date-time"
                            }
                        }
                    },
                    "HealthStatus": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["healthy", "degraded", "unhealthy"]
                            },
                            "version": {
                                "type": "string"
                            },
                            "timestamp": {
                                "type": "string",
                                "format": "date-time"
                            },
                            "services": {
                                "type": "object",
                                "properties": {
                                    "ai": {
                                        "type": "string"
                                    },
                                    "rag": {
                                        "type": "string"
                                    },
                                    "cache": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "Metrics": {
                        "type": "object",
                        "properties": {
                            "requests": {
                                "type": "object",
                                "properties": {
                                    "total": {
                                        "type": "integer"
                                    },
                                    "per_minute": {
                                        "type": "number"
                                    }
                                }
                            },
                            "response_time": {
                                "type": "object",
                                "properties": {
                                    "avg": {
                                        "type": "number"
                                    },
                                    "p95": {
                                        "type": "number"
                                    },
                                    "p99": {
                                        "type": "number"
                                    }
                                }
                            },
                            "ai_metrics": {
                                "type": "object",
                                "properties": {
                                    "qa_score_avg": {
                                        "type": "number"
                                    },
                                    "cache_hit_rate": {
                                        "type": "number"
                                    }
                                }
                            },
                            "medical_compliance": {
                                "type": "object",
                                "properties": {
                                    "pcdt_conformity": {
                                        "type": "number",
                                        "description": "% conformidade com PCDT"
                                    },
                                    "disclaimer_views": {
                                        "type": "integer"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "BadRequest": {
                        "description": "Requisição inválida",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "error": {
                                            "type": "string"
                                        },
                                        "details": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "RateLimited": {
                        "description": "Rate limit excedido",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "error": {
                                            "type": "string",
                                            "example": "Rate limit excedido"
                                        },
                                        "retry_after": {
                                            "type": "integer",
                                            "example": 60
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "InternalError": {
                        "description": "Erro interno do servidor",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "error": {
                                            "type": "string"
                                        },
                                        "request_id": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "securitySchemes": {
                    "ApiKeyAuth": {
                        "type": "apiKey",
                        "in": "header",
                        "name": "X-API-Key"
                    },
                    "BearerAuth": {
                        "type": "http",
                        "scheme": "bearer"
                    }
                }
            },
            "security": [
                {"ApiKeyAuth": []},
                {"BearerAuth": []}
            ]
        }

# Blueprint para servir a documentação
swagger_ui_blueprint = Blueprint('swagger_ui', __name__, url_prefix='/api/v1/docs')

@swagger_ui_blueprint.route('/')
@swagger_auth_required
def swagger_ui():
    """Serve a interface Swagger UI"""
    return render_template_string(SWAGGER_TEMPLATE)

@swagger_ui_blueprint.route('/openapi.json')
@swagger_auth_required
def openapi_spec():
    """Retorna a especificação OpenAPI em JSON"""
    return jsonify(OpenAPISpec.generate())

@swagger_ui_blueprint.route('/postman')
@swagger_auth_required
def postman_collection():
    """Exporta collection para Postman"""
    spec = OpenAPISpec.generate()
    
    # Converter OpenAPI para formato Postman
    postman = {
        "info": {
            "name": spec["info"]["title"],
            "description": spec["info"]["description"],
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": []
    }
    
    # Converter paths para items do Postman
    for path, methods in spec["paths"].items():
        for method, details in methods.items():
            if method in ['get', 'post', 'put', 'delete', 'patch']:
                item = {
                    "name": details.get("summary", path),
                    "request": {
                        "method": method.upper(),
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            },
                            {
                                "key": "X-API-Key",
                                "value": "{{api_key}}"
                            }
                        ],
                        "url": {
                            "raw": f"{{{{base_url}}}}{path}",
                            "host": ["{{base_url}}"],
                            "path": path.split('/')[1:]
                        }
                    }
                }
                
                # Adicionar body se necessário
                if "requestBody" in details:
                    examples = details["requestBody"]["content"]["application/json"].get("examples", {})
                    if examples:
                        first_example = list(examples.values())[0]
                        item["request"]["body"] = {
                            "mode": "raw",
                            "raw": json.dumps(first_example.get("value", {}), indent=2)
                        }
                
                postman["item"].append(item)
    
    return jsonify(postman)