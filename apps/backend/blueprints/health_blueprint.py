# -*- coding: utf-8 -*-
"""
Health Blueprint - Gerencia endpoints de saúde e status do sistema
Migrado do main.py para modularização
"""

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import logging
import os
import sys
# Import opcional do psutil
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
from typing import Dict, Any

# Import dependências
from core.dependencies import get_cache, get_rag, get_qa, get_config

# Import AI Provider Manager
try:
    from services.ai_provider_manager import get_ai_health_status
    AI_PROVIDER_AVAILABLE = True
except ImportError:
    AI_PROVIDER_AVAILABLE = False

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api')

def get_system_info() -> Dict[str, Any]:
    """Coleta informações do sistema"""
    try:
        # Informações básicas do sistema
        system_info = {
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
            "cpu_count": os.cpu_count()
        }
        
        # Adicionar informações de psutil se disponível
        if PSUTIL_AVAILABLE:
            system_info.update({
                "memory": {
                    "total": psutil.virtual_memory().total,
                    "available": psutil.virtual_memory().available,
                    "percent": psutil.virtual_memory().percent
                },
                "disk": {
                    "total": psutil.disk_usage('/').total,
                    "free": psutil.disk_usage('/').free,
                    "percent": psutil.disk_usage('/').percent
                } if os.path.exists('/') else {},
                "uptime": str(timedelta(seconds=int(psutil.boot_time())))
            })
        else:
            system_info.update({
                "memory": "psutil_unavailable",
                "disk": "psutil_unavailable", 
                "uptime": "psutil_unavailable"
            })
        
        return system_info
    except Exception as e:
        logger.warning(f"Erro ao coletar informações do sistema: {e}")
        return {"error": "Não foi possível coletar informações do sistema"}

def check_dependencies_health() -> Dict[str, Any]:
    """Verifica saúde das dependências"""
    cache = get_cache()
    rag_service = get_rag()
    qa_framework = get_qa()
    config = get_config()
    
    dependencies = {
        "cache": {
            "status": "healthy" if cache else "unavailable",
            "type": "advanced" if hasattr(cache, 'get_stats') else "simple",
            "stats": cache.get_stats() if cache and hasattr(cache, 'get_stats') else None
        },
        "rag": {
            "status": "healthy" if rag_service else "unavailable",
            "type": "enhanced" if hasattr(rag_service, 'use_enhanced') else "basic"
        },
        "qa_framework": {
            "status": "healthy" if qa_framework else "unavailable",
            "enabled": config.QA_ENABLED if config else False,
            "min_score": config.QA_MIN_SCORE if config else None
        },
        "config": {
            "status": "healthy" if config else "unavailable",
            "environment": os.getenv('ENVIRONMENT', 'development'),
            "debug": config.DEBUG if config else False
        }
    }
    
    return dependencies

def get_application_status() -> Dict[str, Any]:
    """Status da aplicação"""
    config = get_config()
    
    # Verificar se APIs críticas estão configuradas
    api_keys_configured = bool(
        config and (config.OPENROUTER_API_KEY or config.HUGGINGFACE_API_KEY)
    )
    
    # Status geral
    overall_status = "healthy"
    if not api_keys_configured:
        overall_status = "degraded"
    
    status = {
        "overall_status": overall_status,
        "api_keys_configured": api_keys_configured,
        "features": {
            "advanced_features": config.ADVANCED_FEATURES if config else False,
            "rag_available": config.RAG_AVAILABLE if config else False,
            "qa_enabled": config.QA_ENABLED if config else False,
            "cache_enabled": config.ADVANCED_CACHE if config else False
        },
        "version": "blueprint_v1.0",
        "deployment": {
            "environment": os.getenv('ENVIRONMENT', 'development'),
            "commit_hash": os.getenv('COMMIT_SHA', 'unknown'),
            "build_date": os.getenv('BUILD_DATE', 'unknown')
        }
    }
    
    return status

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint principal de health check"""
    try:
        request_id = f"health_{int(datetime.now().timestamp() * 1000)}"
        start_time = datetime.now()
        
        logger.info(f"[{request_id}] Health check solicitado")
        
        # Coletar informações de saúde
        system_info = get_system_info()
        dependencies = check_dependencies_health()
        app_status = get_application_status()
        
        # Determinar status geral
        overall_healthy = (
            app_status["overall_status"] == "healthy" and
            dependencies["cache"]["status"] != "unavailable" and
            not ("error" in system_info)
        )
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Adicionar informações do AI Provider se disponível
        ai_provider_status = "unavailable"
        if AI_PROVIDER_AVAILABLE:
            try:
                ai_health = get_ai_health_status()
                dependencies["ai_providers"] = ai_health
                ai_provider_status = ai_health.get("overall_status", "unknown")
            except Exception as e:
                ai_provider_status = f"error: {str(e)}"

        response = {
            "status": "healthy" if overall_healthy else "degraded",
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id,
            "processing_time_ms": processing_time,
            "application": app_status,
            "dependencies": dependencies,
            "system": system_info,
            "checks": {
                "database": "pending",  # Será implementado com AstraDB
                "external_apis": "pending",  # Será implementado
                "cache": dependencies["cache"]["status"],
                "rag": dependencies["rag"]["status"],
                "qa": dependencies["qa_framework"]["status"],
                "ai_providers": ai_provider_status
            }
        }
        
        status_code = 200 if overall_healthy else 503
        
        logger.info(f"[{request_id}] Health check concluído: {response['status']}")
        return jsonify(response), status_code
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro no health check: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": "Erro interno durante health check",
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }), 500

@health_bp.route('/test', methods=['GET', 'OPTIONS'])
def test_endpoint():
    """Endpoint simples para teste de conectividade"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        response = {
            "status": "OK",
            "message": "Backend funcionando corretamente",
            "timestamp": datetime.now().isoformat(),
            "endpoint": "test",
            "method": request.method,
            "user_agent": request.headers.get('User-Agent', 'unknown'),
            "cors_enabled": True,
            "api_version": "blueprint_v1.0"
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro no endpoint de teste: {e}")
        return jsonify({
            "status": "ERROR",
            "message": "Erro interno do servidor",
            "timestamp": datetime.now().isoformat()
        }), 500

@health_bp.route('/test-status', methods=['GET'])
def test_status():
    """Status detalhado para testes"""
    try:
        cache = get_cache()
        config = get_config()
        
        response = {
            "backend_status": "operational",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "cache": {
                    "available": bool(cache),
                    "stats": cache.get_stats() if cache and hasattr(cache, 'get_stats') else None
                },
                "config": {
                    "loaded": bool(config),
                    "environment": os.getenv('ENVIRONMENT', 'development')
                }
            },
            "endpoints_available": [
                "/api/health",
                "/api/test",
                "/api/chat",
                "/api/personas",
                "/api/feedback"
            ],
            "cors": {
                "enabled": True,
                "origins": config.CORS_ORIGINS if config else []
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro no test-status: {e}")
        return jsonify({
            "backend_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@health_bp.route('/info', methods=['GET'])
def api_info():
    """Informações da API"""
    try:
        config = get_config()
        
        response = {
            "api_name": "Roteiros de Dispensação PQT-U",
            "version": "blueprint_v1.0",
            "description": "API para sistema educacional de dispensação farmacêutica",
            "environment": os.getenv('ENVIRONMENT', 'development'),
            "documentation": {
                "endpoints": [
                    {
                        "path": "/api/chat",
                        "method": "POST",
                        "description": "Interação com personas IA"
                    },
                    {
                        "path": "/api/personas",
                        "method": "GET", 
                        "description": "Informações das personas disponíveis"
                    },
                    {
                        "path": "/api/feedback",
                        "method": "POST",
                        "description": "Submissão de feedback"
                    },
                    {
                        "path": "/api/health",
                        "method": "GET",
                        "description": "Health check do sistema"
                    }
                ]
            },
            "features": {
                "personas": ["dr_gasnelio", "ga"],
                "languages": ["pt-BR"],
                "knowledge_base": "Tese de Doutorado - PQT-U",
                "guidelines": "PCDT Hanseníase 2022"
            },
            "limits": {
                "max_question_length": 1000,
                "rate_limiting": config.RATE_LIMIT_ENABLED if config else False,
                "max_file_size": "16MB"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro no endpoint info: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "timestamp": datetime.now().isoformat()
        }), 500

@health_bp.route('/test-medical-rag', methods=['GET', 'POST'])
def test_medical_rag():
    """Endpoint para testar RAG médico"""
    try:
        from services.medical_rag_integration import medical_rag_system
        
        if request.method == 'GET':
            return jsonify({
                "service": "medical_rag_test",
                "description": "Testa sistema RAG médico",
                "stats": medical_rag_system.get_stats(),
                "usage": {"method": "POST", "body": {"question": "sua pergunta aqui"}}
            }), 200
        
        # POST - Testar RAG
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json()
        question = data.get('question', '').strip() if data else ''
        
        if not question:
            return jsonify({"error": "Campo 'question' é obrigatório"}), 400
        
        # Testar RAG médico diretamente
        try:
            logger.info(f"Chamando get_relevant_context para: {question}")
            # Temporariamente comentado para debug
            context = medical_rag_system.get_relevant_context(question, max_chunks=3)
            # context = "TESTE: RAG médico funcionando"
            logger.info(f"Context obtido: {type(context)}, length: {len(context) if isinstance(context, str) else 'N/A'}")
        except Exception as context_error:
            logger.error(f"Erro ao obter contexto: {context_error}")
            return jsonify({"error": f"Context failed: {context_error}"}), 500
        
        # Testar stats separadamente para isolar erro
        try:
            stats = medical_rag_system.get_stats()
            # stats = {"test": "stats funcionando"}
        except Exception as stats_error:
            stats = {"error": f"Stats failed: {stats_error}"}
        
        # Construir resposta de forma segura
        response_data = {
            "question": question,
            "context_length": len(context) if isinstance(context, str) else 0,
            "context_type": str(type(context)),
            "timestamp": datetime.now().isoformat()
        }
        
        # Adicionar contexto apenas se for string
        if isinstance(context, str):
            response_data["context"] = context
        else:
            response_data["context_error"] = f"Context não é string: {type(context)}"
        
        # Adicionar stats
        response_data["stats"] = stats
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro no teste RAG médico: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "details": str(e)
        }), 500

@health_bp.route('/scope', methods=['GET', 'POST'])
def scope_check():
    """Endpoint para verificação de escopo de perguntas"""
    try:
        request_id = f"scope_{int(datetime.now().timestamp() * 1000)}"
        
        if request.method == 'GET':
            # Retornar informações sobre o escopo
            return jsonify({
                "service": "scope_detection",
                "description": "Detecta se uma pergunta está dentro do escopo do sistema",
                "supported_topics": [
                    "Hanseníase",
                    "PQT-U (Poliquimioterapia Única)",
                    "Dosagem de medicamentos",
                    "Contraindicações",
                    "Efeitos adversos",
                    "Protocolos PCDT",
                    "Orientações farmacêuticas"
                ],
                "usage": {
                    "method": "POST",
                    "body": {"question": "sua pergunta aqui"}
                },
                "request_id": request_id,
                "timestamp": datetime.now().isoformat()
            }), 200
        
        # POST - Verificar escopo da pergunta
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "request_id": request_id
            }), 400
        
        data = request.get_json()
        question = data.get('question', '').strip() if data else ''
        
        if not question:
            return jsonify({
                "error": "Campo 'question' é obrigatório",
                "request_id": request_id
            }), 400
        
        # Análise básica de escopo (versão simplificada)
        medical_keywords = [
            'hanseniase', 'lepra', 'pqt', 'poliquimioterapia',
            'rifampicina', 'clofazimina', 'dapsona',
            'dose', 'dosagem', 'medicamento', 'tratamento',
            'efeito', 'contraindicação', 'pcdt'
        ]
        
        question_lower = question.lower()
        matches = sum(1 for keyword in medical_keywords if keyword in question_lower)
        
        in_scope = matches > 0
        confidence = min(matches * 0.3, 1.0)  # Até 100% de confiança
        
        response = {
            "question": question,
            "in_scope": in_scope,
            "confidence": confidence,
            "scope_category": "medical_pharmaceutical" if in_scope else "general",
            "keywords_matched": matches,
            "recommendation": (
                "Pergunta dentro do escopo - pode ser processada" if in_scope
                else "Pergunta fora do escopo - considere reformular focando em hanseníase/PQT-U"
            ),
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro na verificação de escopo: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "request_id": request_id
        }), 500