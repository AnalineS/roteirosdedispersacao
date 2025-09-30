# -*- coding: utf-8 -*-
"""
Documentation Blueprint - Endpoints de documentação da API
Inclui auto-discovery, guias e recursos educacionais
"""

from flask import Blueprint, jsonify, request, current_app
from datetime import datetime
import logging
from typing import Dict, Any, List
from core.openapi.auth import swagger_auth_required
from core.versioning import get_version_info

logger = logging.getLogger(__name__)

# Criar blueprint
docs_bp = Blueprint('docs', __name__, url_prefix='/api/v1')

@docs_bp.route('/docs/api-info')
@swagger_auth_required
def api_info():
    """
    Informações gerais sobre a API
    Auto-discovery de recursos disponíveis
    """
    try:
        # Informações básicas da API
        api_info = {
            "api": {
                "name": "Roteiros de Dispensação Hanseníase",
                "description": "API educacional para dispensação PQT-U baseada em tese de doutorado UnB",
                "version_info": get_version_info(),
                "documentation": {
                    "swagger_ui": "/api/v1/docs/",
                    "openapi_spec": "/api/v1/docs/openapi.json",
                    "postman_collection": "/api/v1/docs/postman",
                    "redoc": "/api/v1/docs/redoc",
                    "guia_hanseniase": "/api/v1/docs/guia-hanseniase"
                }
            },
            "endpoints": {
                "chat": {
                    "base_url": "/api/v1/chat",
                    "methods": ["POST"],
                    "description": "Interação com assistentes IA",
                    "rate_limit": "60/min",
                    "personas": ["dr_gasnelio", "ga"]
                },
                "personas": {
                    "base_url": "/api/v1/personas",
                    "methods": ["GET"],
                    "description": "Informações sobre personas disponíveis",
                    "rate_limit": "100/min"
                },
                "feedback": {
                    "base_url": "/api/v1/feedback",
                    "methods": ["POST", "GET"],
                    "description": "Sistema de feedback",
                    "rate_limit": "30/min"
                },
                "health": {
                    "base_url": "/api/v1/health",
                    "methods": ["GET"],
                    "description": "Monitoramento do sistema",
                    "endpoints": ["/health", "/health/live", "/health/ready", "/health/deep"]
                },
                "metrics": {
                    "base_url": "/api/v1/metrics",
                    "methods": ["GET"],
                    "description": "Métricas e estatísticas",
                    "rate_limit": "10/min"
                }
            },
            "compliance": {
                "pcdt_hanseniase_2022": True,
                "lgpd": True,
                "cfm_2314_2022": True,
                "anvisa_rdc_4_2009": True
            },
            "educational": {
                "thesis_based": True,
                "university": "UnB - Universidade de Brasília",
                "research_area": "Hanseníase PQT-U",
                "target_audience": ["farmacêuticos", "estudantes", "profissionais_saude"]
            },
            "timestamp": datetime.now().isoformat(),
            "request_id": f"api_info_{int(datetime.now().timestamp() * 1000)}"
        }
        
        # Adicionar informações de endpoints descobertos dinamicamente
        if hasattr(current_app, 'url_map'):
            discovered_endpoints = []
            for rule in current_app.url_map.iter_rules():
                if rule.rule.startswith('/api/v1/'):
                    discovered_endpoints.append({
                        "path": rule.rule,
                        "methods": list(rule.methods - {'HEAD', 'OPTIONS'}),
                        "endpoint": rule.endpoint
                    })
            api_info["discovered_endpoints"] = discovered_endpoints
        
        logger.info(f"API info solicitada - Total endpoints: {len(api_info.get('discovered_endpoints', []))}")
        
        return jsonify(api_info)
        
    except Exception as e:
        logger.error(f"Erro ao gerar API info: {e}")
        return jsonify({
            "error": "Erro ao gerar informações da API",
            "details": str(e)
        }), 500

@docs_bp.route('/docs/guia-hanseniase')
@swagger_auth_required
def guia_hanseniase():
    """
    Guia específico para uso da API no contexto de hanseníase
    """
    return jsonify({
        "guia": {
            "titulo": "Guia de Uso - API Hanseníase PQT-U",
            "introducao": """
            Esta API foi desenvolvida para apoiar profissionais de saúde na dispensação 
            segura e eficaz da Poliquimioterapia Única (PQT-U) para hanseníase.
            """,
            "casos_uso": {
                "consulta_dosagem": {
                    "endpoint": "/api/v1/chat",
                    "persona": "dr_gasnelio",
                    "exemplo": {
                        "question": "Qual a dose de rifampicina para adulto PB?",
                        "resposta_esperada": "Resposta técnica com base no PCDT 2022"
                    }
                },
                "orientacao_paciente": {
                    "endpoint": "/api/v1/chat", 
                    "persona": "ga",
                    "exemplo": {
                        "question": "Como explicar o tratamento para o paciente?",
                        "resposta_esperada": "Linguagem simples e empática"
                    }
                },
                "feedback_qualidade": {
                    "endpoint": "/api/v1/feedback",
                    "uso": "Avaliar qualidade das respostas médicas"
                }
            },
            "protocolos_seguros": {
                "validacao_respostas": "Sempre verificar qa_score > 0.9",
                "disclaimers_medicos": "Ler disclaimers antes de usar informações",
                "fonte_oficial": "Todas as respostas baseadas em PCDT Hanseníase 2022"
            },
            "troubleshooting": {
                "rate_limiting": "Respeitar limites: 60/min para chat",
                "qualidade_baixa": "Reformular pergunta se qa_score < 0.8",
                "erro_servidor": "Verificar /api/v1/health para status"
            },
            "recursos_educacionais": {
                "personas": "/api/v1/personas - Características detalhadas",
                "metricas": "/api/v1/metrics - Estatísticas de uso",
                "saude_sistema": "/api/v1/health - Status dos serviços"
            }
        },
        "exemplos_praticos": {
            "caso_1_pediatrico": {
                "cenario": "Criança 8 anos, 25kg, hanseníase PB",
                "request": {
                    "question": "Dose de PQT-U para criança 25kg com hanseníase PB",
                    "persona": "dr_gasnelio"
                },
                "validacao": "Verificar conformidade com PCDT pediatrico"
            },
            "caso_2_gestante": {
                "cenario": "Gestante 28 anos, 20 semanas, hanseníase MB",
                "request": {
                    "question": "PQT-U é segura na gravidez?",
                    "persona": "dr_gasnelio"
                },
                "cuidados": "Atenção especial para contraindicações"
            },
            "caso_3_reacao": {
                "cenario": "Paciente com reação hansênica tipo 1",
                "request": {
                    "question": "Como ajustar tratamento em reação hansênica?",
                    "persona": "dr_gasnelio"
                },
                "nota": "Considerar corticoterapia complementar"
            }
        },
        "referencias": {
            "pcdt_2022": "Protocolo Clínico e Diretrizes Terapêuticas - Hanseníase",
            "who_guidelines": "WHO Guidelines for Leprosy Treatment",
            "tese_base": "Roteiro de Dispensação PQT-U - Nélio Gomes - UnB",
            "anvisa": "RDC 4/2009 - Farmacovigilância"
        },
        "webhook_notifications": {
            "description": "Sistema de notificação para mudanças na API",
            "endpoint": "/api/v1/docs/webhook",
            "events": ["version_update", "endpoint_change", "compliance_update"],
            "setup": "Registrar webhook via POST com URL de callback"
        }
    })

@docs_bp.route('/docs/webhook', methods=['GET', 'POST'])
@swagger_auth_required
def webhook_system():
    """
    Sistema de webhook para notificar mudanças na API
    """
    if request.method == 'GET':
        # Listar webhooks registrados
        return jsonify({
            "webhooks": {
                "registered": [],  # Em produção, consultar banco/cache
                "events": [
                    "version_update",
                    "endpoint_change", 
                    "compliance_update",
                    "security_alert"
                ],
                "format": "application/json",
                "authentication": "X-API-Key header required"
            }
        })
    
    elif request.method == 'POST':
        # Registrar novo webhook
        data = request.get_json()
        
        if not data or 'callback_url' not in data:
            return jsonify({
                "error": "callback_url é obrigatório"
            }), 400
        
        # Validar URL
        callback_url = data['callback_url']
        events = data.get('events', ['version_update'])
        
        # Em produção, salvar no banco/cache
        webhook_id = f"webhook_{int(datetime.now().timestamp())}"
        
        logger.info(f"Webhook registrado: {webhook_id} -> {callback_url}")
        
        return jsonify({
            "webhook_id": webhook_id,
            "callback_url": callback_url,
            "events": events,
            "status": "registered",
            "created_at": datetime.now().isoformat()
        })

@docs_bp.route('/docs/redoc')
@swagger_auth_required
def redoc_ui():
    """
    Interface ReDoc como alternativa ao Swagger UI
    """
    redoc_template = '''
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <title>API Roteiros Hanseníase - ReDoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
            body { margin: 0; padding: 0; }
        </style>
    </head>
    <body>
        <redoc spec-url="/api/v1/docs/openapi.json"></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
    </body>
    </html>
    '''
    return redoc_template

@docs_bp.route('/docs/changelog')
@swagger_auth_required
def api_changelog():
    """
    Registro de mudanças da API
    """
    return jsonify({
        "changelog": {
            "v1.0.0": {
                "release_date": "2025-01-14",
                "changes": [
                    "Lançamento inicial da API",
                    "Implementação de personas Dr. Gasnelio e Gá",
                    "Sistema de versionamento",
                    "Documentação OpenAPI completa",
                    "Rate limiting implementado",
                    "Compliance PCDT Hanseníase 2022"
                ],
                "breaking_changes": [],
                "deprecations": []
            }
        },
        "upcoming": {
            "v1.1.0": {
                "estimated_release": "2025-02-01",
                "planned_features": [
                    "Novos endpoints de cálculo automático",
                    "Integração com sistemas hospitalares",
                    "Analytics avançadas",
                    "Multi-idioma (inglês/português)"
                ]
            }
        }
    })

@docs_bp.route('/docs/status')
def documentation_status():
    """
    Status da documentação (endpoint público)
    """
    return jsonify({
        "documentation": {
            "status": "available",
            "version": "1.0.0",
            "coverage": "100%",
            "last_updated": "2025-01-14",
            "formats": ["swagger", "redoc", "postman"],
            "languages": ["pt-BR"]
        },
        "authentication": {
            "required": True,
            "methods": ["X-API-Key", "Bearer token"],
            "development_mode": "authentication disabled"
        },
        "endpoints": {
            "interactive": "/api/v1/docs/",
            "spec": "/api/v1/docs/openapi.json",
            "redoc": "/api/v1/docs/redoc",
            "postman": "/api/v1/docs/postman",
            "guide": "/api/v1/docs/guia-hanseniase"
        }
    })