# -*- coding: utf-8 -*-
"""
Personas Blueprint - Gerencia informações das personas de IA
Migrado do main.py para modularização
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
import logging
from typing import Dict, List, Any

# Import dependências
from core.dependencies import get_cache, get_config

# Import personas services
try:
    from services.personas import get_personas, get_persona_prompt
    PERSONAS_SERVICE_AVAILABLE = True
except ImportError:
    PERSONAS_SERVICE_AVAILABLE = False

# Import persona stats manager
try:
    from services.analytics.persona_stats_manager import get_persona_statistics
    PERSONA_STATS_AVAILABLE = True
except ImportError:
    PERSONA_STATS_AVAILABLE = False

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
personas_bp = Blueprint('personas', __name__, url_prefix='/api/v1')

def get_persona_capabilities(persona_id: str) -> List[str]:
    """Retorna capacidades específicas da persona"""
    capabilities_map = {
        'dr_gasnelio': [
            "Cálculos precisos de dosagem PQT-U",
            "Análise de interações medicamentosas",
            "Identificação de contraindicações",
            "Orientações farmacotécnicas",
            "Interpretação de protocolos PCDT",
            "Monitoramento de efeitos adversos",
            "Validação de prescrições médicas",
            "Orientações para casos especiais"
        ],
        'ga': [
            "Linguagem acessível e empática",
            "Explicações simplificadas de tratamentos",
            "Suporte emocional para pacientes",
            "Orientações práticas do dia-a-dia",
            "Desmistificação de medos e preconceitos",
            "Motivação para adesão ao tratamento",
            "Interface com familiares e cuidadores",
            "Educação em saúde humanizada"
        ]
    }
    return capabilities_map.get(persona_id, [])

def get_persona_examples(persona_id: str) -> List[str]:
    """Retorna exemplos de perguntas para a persona"""
    examples_map = {
        'dr_gasnelio': [
            "Qual a dose de rifampicina para um paciente de 45kg?",
            "Como proceder em caso de hepatotoxicidade por PQT-U?",
            "Existe contraindicação do PQT-U na gravidez?",
            "Como fazer o cálculo pediátrico da clofazimina?",
            "Quando suspender temporariamente o tratamento?"
        ],
        'ga': [
            "Estou com medo de tomar a medicação, é normal?",
            "Minha pele ficou mais escura, isso vai passar?",
            "Como explicar para minha família sobre a hanseníase?",
            "É verdade que vou ficar curado após o tratamento?",
            "Posso trabalhar normalmente durante o tratamento?"
        ]
    }
    return examples_map.get(persona_id, [])

def get_persona_limitations(persona_id: str) -> List[str]:
    """Retorna limitações da persona"""
    limitations_map = {
        'dr_gasnelio': [
            "Não substitui consulta médica presencial",
            "Não pode prescrever medicamentos",
            "Casos graves devem ser encaminhados ao médico",
            "Não faz diagnósticos definitivos",
            "Focado especificamente em hanseníase PQT-U"
        ],
        'ga': [
            "Não oferece diagnósticos médicos",
            "Não substitui acompanhamento médico",
            "Focado em apoio educacional e emocional",
            "Casos de emergência devem procurar serviços médicos",
            "Limitado ao contexto de hanseníase"
        ]
    }
    return limitations_map.get(persona_id, [])

def get_persona_response_format(persona_id: str) -> Dict[str, Any]:
    """Retorna formato de resposta da persona"""
    format_map = {
        'dr_gasnelio': {
            "style": "técnico_científico",
            "tone": "profissional",
            "language": "português_técnico",
            "structure": [
                "Análise técnica da questão",
                "Embasamento científico/protocolar",
                "Orientação específica",
                "Alertas de segurança (quando aplicável)",
                "Referências (PCDT, literatura)"
            ],
            "citations": True,
            "mathematical_precision": True
        },
        'ga': {
            "style": "conversacional_empático",
            "tone": "acolhedor",
            "language": "português_acessível",
            "structure": [
                "Acolhimento da preocupação",
                "Explicação simplificada",
                "Orientação prática",
                "Encorajamento",
                "Lembretes de autocuidado"
            ],
            "emotional_support": True,
            "accessibility_focused": True
        }
    }
    return format_map.get(persona_id, {})

def get_real_persona_stats(persona_id: str) -> Dict:
    """Obter estatísticas reais da persona do banco de dados"""
    if PERSONA_STATS_AVAILABLE:
        try:
            stats = get_persona_statistics(persona_id)
            return {
                "total_interactions": stats.get('total_interactions', 0),
                "average_rating": stats.get('average_rating', 0.0),
                "success_rate": stats.get('success_rate', 0.0),
                "total_ratings": stats.get('total_ratings', 0),
                "avg_response_time_ms": stats.get('avg_response_time_ms', 0.0),
                "last_updated": stats.get('last_updated', datetime.now().isoformat())
            }
        except Exception as e:
            logger.error(f"Erro ao obter stats da persona {persona_id}: {e}")

    # Fallback para dados padrão
    return {
        "total_interactions": 0,
        "average_rating": 0.0,
        "success_rate": 0.0,
        "total_ratings": 0,
        "avg_response_time_ms": 0.0,
        "stats_available": PERSONA_STATS_AVAILABLE
    }

def check_rate_limit(endpoint_type: str = 'default'):
    """Rate limiting real para personas usando SQLite"""
    from services.security.sqlite_rate_limiter import rate_limit

    # Limites para endpoints de personas
    limits = {
        'personas': (60, 60),   # 60 req/min para listagem
        'default': (100, 60)    # 100 req/min geral
    }

    max_requests, window_seconds = limits.get(endpoint_type, limits['default'])
    return rate_limit(f"personas_{endpoint_type}", max_requests, window_seconds)

@personas_bp.route('/personas', methods=['GET'])
@check_rate_limit('general')
def get_personas_api():
    """Endpoint para informações completas das personas"""
    try:
        request_id = f"personas_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de informações das personas")
        
        config = get_config()
        cache = get_cache()
        
        # Tentar cache primeiro
        cache_key = "personas:full_info"
        if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
            # Verificar se é cache genérico (SimpleCache)
            try:
                cached_personas = cache.get(cache_key)
                if cached_personas:
                    logger.info(f"[{request_id}] Personas retornadas do cache")
                    return jsonify(cached_personas), 200
            except TypeError:
                # PerformanceCache - não usar para este caso
                logger.debug(f"[{request_id}] PerformanceCache não compatível - gerando dados novos")
        
        # Obter dados base das personas
        if PERSONAS_SERVICE_AVAILABLE:
            personas_data = get_personas()
        else:
            # Fallback com dados estáticos
            personas_data = {
                "dr_gasnelio": {
                    "name": "Dr. Gasnelio",
                    "description": "Farmacêutico especialista em hanseníase",
                    "avatar": "👨‍⚕️",
                    "personality": "Técnico, científico, preciso"
                },
                "ga": {
                    "name": "Gá",
                    "description": "Assistente empática e acessível",
                    "avatar": "🤗", 
                    "personality": "Empática, acolhedora, simplificadora"
                }
            }
        
        # Enriquecer com metadados completos
        enriched_personas = {}
        for persona_id, persona_info in personas_data.items():
            enriched_personas[persona_id] = {
                **persona_info,
                "capabilities": get_persona_capabilities(persona_id),
                "example_questions": get_persona_examples(persona_id),
                "limitations": get_persona_limitations(persona_id),
                "response_format": get_persona_response_format(persona_id),
                "status": "active",
                "last_updated": "2025-08-10",
                "expertise_areas": [
                    "Hanseníase",
                    "PQT-U",
                    "Farmacoterapia",
                    "Educação em Saúde"
                ]
            }
        
        # Metadados da API
        response = {
            "personas": enriched_personas,
            "metadata": {
                "total_personas": len(enriched_personas),
                "available_persona_ids": list(enriched_personas.keys()),
                "api_version": "blueprint_v1.0",
                "last_updated": "2025-08-10",
                "request_id": request_id,
                "timestamp": datetime.now().isoformat(),
                "cache_enabled": bool(cache),
                "personas_service_available": PERSONAS_SERVICE_AVAILABLE
            },
            "usage_guide": {
                "chat_endpoint": "/api/chat",
                "required_fields": ["question", "personality_id"],
                "example_request": {
                    "question": "Qual a dose de rifampicina para adultos?",
                    "personality_id": "dr_gasnelio"
                },
                "supported_languages": ["pt-BR"],
                "max_question_length": 1000
            },
            "educational_context": {
                "knowledge_base": "Baseado na tese de doutorado - Roteiro de Dispensação PQT-U",
                "guidelines": "PCDT Hanseníase 2022 - Ministério da Saúde",
                "target_audience": "Profissionais de saúde e pacientes",
                "disclaimer": "Esta é uma ferramenta educacional. Sempre consulte um profissional de saúde."
            }
        }
        
        # Cache da resposta (24 horas)
        if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
            # Verificar se é cache genérico (SimpleCache)
            try:
                cache.set(cache_key, response, ttl=86400)
            except TypeError:
                # PerformanceCache - não compatível, pular cache
                pass
        
        logger.info(f"[{request_id}] Informações das personas retornadas com sucesso")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter personas: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id,
            "message": "Não foi possível obter informações das personas"
        }), 500

@personas_bp.route('/personas/<persona_id>', methods=['GET'])
@check_rate_limit('general')
def get_persona_details(persona_id: str):
    """Endpoint para obter detalhes de uma persona específica"""
    try:
        request_id = f"persona_detail_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Detalhes solicitados para persona: {persona_id}")
        
        valid_personas = ['dr_gasnelio', 'ga']
        if persona_id not in valid_personas:
            return jsonify({
                "error": "Persona não encontrada",
                "error_code": "PERSONA_NOT_FOUND",
                "request_id": request_id,
                "available_personas": valid_personas
            }), 404
        
        # Obter dados completos da persona
        cache = get_cache()
        cache_key = f"persona:detail:{persona_id}"
        
        if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
            # Verificar se é cache genérico (SimpleCache)
            try:
                cached_detail = cache.get(cache_key)
                if cached_detail:
                    logger.info(f"[{request_id}] Detalhes da persona retornados do cache")
                    return jsonify(cached_detail), 200
            except TypeError:
                # PerformanceCache - não usar para este caso
                logger.debug(f"[{request_id}] PerformanceCache não compatível - gerando dados novos")
        
        # Construir resposta detalhada
        persona_detail = {
            "persona_id": persona_id,
            "name": "Dr. Gasnelio" if persona_id == 'dr_gasnelio' else "Gá",
            "description": get_persona_capabilities(persona_id)[0] if get_persona_capabilities(persona_id) else "Assistente especializado",
            "avatar": "👨‍⚕️" if persona_id == 'dr_gasnelio' else "🤗",
            "capabilities": get_persona_capabilities(persona_id),
            "example_questions": get_persona_examples(persona_id),
            "limitations": get_persona_limitations(persona_id),
            "response_format": get_persona_response_format(persona_id),
            "stats": get_real_persona_stats(persona_id),
            "metadata": {
                "created_date": "2025-01-01",
                "last_updated": "2025-08-10",
                "version": "1.0",
                "status": "active"
            }
        }
        
        response = {
            "persona": persona_detail,
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache por 12 horas
        if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
            # Verificar se é cache genérico (SimpleCache)
            try:
                cache.set(cache_key, response, ttl=43200)
            except TypeError:
                # PerformanceCache - não compatível, pular cache
                pass
        
        logger.info(f"[{request_id}] Detalhes da persona {persona_id} retornados")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter detalhes da persona: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR", 
            "request_id": request_id
        }), 500

@personas_bp.route('/personas/health', methods=['GET'])
def personas_health():
    """Health check específico do serviço de personas"""
    cache = get_cache()
    
    status = {
        "service": "personas",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "cache": "available" if cache else "unavailable",
            "personas_service": PERSONAS_SERVICE_AVAILABLE,
            "total_personas": 2
        },
        "available_personas": ['dr_gasnelio', 'ga']
    }
    
    return jsonify(status), 200