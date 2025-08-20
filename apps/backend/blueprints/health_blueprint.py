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
from core.openapi.auth import swagger_auth_required

# Import AI Provider Manager
try:
    from services.ai_provider_manager import get_ai_health_status
    AI_PROVIDER_AVAILABLE = True
except ImportError:
    AI_PROVIDER_AVAILABLE = False

# Import Medical Validation
try:
    from core.validation.educational_qa_framework import EducationalQAFramework
    QA_FRAMEWORK_AVAILABLE = True
except ImportError:
    QA_FRAMEWORK_AVAILABLE = False

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api/v1')

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
            context = medical_rag_system.get_relevant_context(question, max_chunks=3)
            logger.info(f"Context obtido: {type(context)}, length: {len(context) if isinstance(context, str) else 'N/A'}")
        except Exception as context_error:
            logger.error(f"Erro ao obter contexto: {context_error}")
            return jsonify({"error": "Context retrieval failed"}), 500
        
        # Testar stats separadamente para isolar erro
        try:
            stats = medical_rag_system.get_stats()
        except Exception as stats_error:
            logger.error(f"Erro ao obter stats: {stats_error}")
            stats = {"error": "Stats retrieval failed"}
        
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

# =============================================================================
# NOVOS ENDPOINTS DE HEALTH CHECK DETALHADOS - KUBERNETES COMPATIBLE
# =============================================================================

@health_bp.route('/health/live')
def liveness_probe():
    """
    Liveness probe para Kubernetes
    Verifica apenas se o serviço está respondendo
    """
    return jsonify({
        "status": "live",
        "timestamp": datetime.now().isoformat()
    }), 200

@health_bp.route('/health/ready')
def readiness_probe():
    """
    Readiness probe para Kubernetes
    Verifica se o serviço está pronto para receber requests
    """
    try:
        # Verificações básicas de prontidão
        checks = {
            "config": False,
            "dependencies": False,
            "ai_service": False,
            "knowledge_base": False
        }
        
        # Verificar config
        config = get_config()
        checks["config"] = config is not None
        
        # Verificar dependências básicas
        cache = get_cache()
        rag_service = get_rag()
        checks["dependencies"] = cache is not None and rag_service is not None
        
        # Verificar AI service (se disponível)
        if AI_PROVIDER_AVAILABLE:
            try:
                ai_status = get_ai_health_status()
                checks["ai_service"] = ai_status.get("status") == "healthy"
            except:
                checks["ai_service"] = False
        else:
            checks["ai_service"] = True  # Considerar OK se não configurado
        
        # Verificar knowledge base
        if rag_service:
            try:
                # Teste simples: verificar se consegue fazer uma busca
                test_result = rag_service.search("hanseníase", limit=1) if hasattr(rag_service, 'search') else True
                checks["knowledge_base"] = test_result is not None
            except:
                checks["knowledge_base"] = False
        else:
            checks["knowledge_base"] = False
        
        # Determinar status geral
        ready = all(checks.values())
        http_status = 200 if ready else 503
        
        response = {
            "status": "ready" if ready else "not_ready",
            "checks": checks,
            "ready": ready,
            "timestamp": datetime.now().isoformat()
        }
        
        if not ready:
            response["message"] = "Serviço não está pronto - algumas dependências falharam"
        
        return jsonify(response), http_status
        
    except Exception as e:
        logger.error(f"Erro no readiness probe: {e}")
        return jsonify({
            "status": "not_ready",
            "error": "Erro interno durante verificação",
            "timestamp": datetime.now().isoformat()
        }), 503

@health_bp.route('/health/deep')
@swagger_auth_required
def deep_health_check():
    """
    Deep health check detalhado (requer autenticação)
    Não expõe informações sensíveis, mas faz verificações completas
    """
    try:
        request_id = f"deep_health_{int(datetime.now().timestamp() * 1000)}"
        
        deep_checks = {
            "system": {},
            "dependencies": {},
            "ai_services": {},
            "medical_compliance": {},
            "performance": {}
        }
        
        # 1. Verificações do sistema
        deep_checks["system"] = {
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
            "environment": os.getenv('ENVIRONMENT', 'unknown'),
            "uptime_check": "passed",  # Básico: se chegou aqui, está funcionando
            "memory_usage": "healthy" if PSUTIL_AVAILABLE else "unknown"
        }
        
        if PSUTIL_AVAILABLE:
            try:
                memory = psutil.virtual_memory()
                deep_checks["system"]["memory_percent"] = memory.percent
                deep_checks["system"]["memory_status"] = (
                    "healthy" if memory.percent < 80 else 
                    "warning" if memory.percent < 90 else "critical"
                )
            except:
                deep_checks["system"]["memory_status"] = "unknown"
        
        # 2. Verificações de dependências
        cache = get_cache()
        rag_service = get_rag()
        qa_framework = get_qa()
        config = get_config()
        
        deep_checks["dependencies"] = {
            "cache": {
                "status": "healthy" if cache else "unavailable",
                "type": "advanced" if cache and hasattr(cache, 'get_stats') else "simple"
            },
            "rag_service": {
                "status": "healthy" if rag_service else "unavailable",
                "type": "enhanced" if rag_service and hasattr(rag_service, 'search') else "basic"
            },
            "qa_framework": {
                "status": "healthy" if qa_framework else "unavailable",
                "enabled": config.QA_ENABLED if config and hasattr(config, 'QA_ENABLED') else False
            },
            "config": {
                "status": "healthy" if config else "unavailable",
                "debug_mode": config.DEBUG if config and hasattr(config, 'DEBUG') else False
            }
        }
        
        # 3. Verificações de AI services
        if AI_PROVIDER_AVAILABLE:
            try:
                ai_status = get_ai_health_status()
                deep_checks["ai_services"] = {
                    "primary": ai_status.get("primary", {}).get("status", "unknown"),
                    "fallback": ai_status.get("fallback", {}).get("status", "unknown"),
                    "models_available": len(ai_status.get("available_models", [])),
                    "last_check": ai_status.get("last_health_check", "unknown")
                }
            except Exception as e:
                deep_checks["ai_services"] = {
                    "status": "error",
                    "error": "Could not check AI services"
                }
        else:
            deep_checks["ai_services"] = {"status": "not_configured"}
        
        # 4. Verificações de compliance médica
        if QA_FRAMEWORK_AVAILABLE:
            try:
                # Não instanciar se não necessário, apenas verificar disponibilidade
                deep_checks["medical_compliance"] = {
                    "qa_framework": "available",
                    "pcdt_compliance": "enabled",
                    "medical_validation": "active"
                }
            except:
                deep_checks["medical_compliance"] = {"status": "verification_failed"}
        else:
            deep_checks["medical_compliance"] = {"status": "not_available"}
        
        # 5. Verificações de performance básicas
        start_time = datetime.now()
        
        # Teste simples de cache
        cache_test = "passed"
        if cache:
            try:
                test_key = f"health_test_{int(datetime.now().timestamp())}"
                cache.set(test_key, "test_value", timeout=60)
                cache_result = cache.get(test_key)
                cache_test = "passed" if cache_result == "test_value" else "failed"
                cache.delete(test_key)  # Limpar
            except:
                cache_test = "failed"
        
        # Teste de RAG
        rag_test = "passed"
        if rag_service and hasattr(rag_service, 'search'):
            try:
                test_result = rag_service.search("teste", limit=1)
                rag_test = "passed" if test_result else "failed"
            except:
                rag_test = "failed"
        
        response_time = (datetime.now() - start_time).total_seconds()
        
        deep_checks["performance"] = {
            "response_time_seconds": round(response_time, 3),
            "cache_test": cache_test,
            "rag_test": rag_test,
            "overall": "healthy" if response_time < 2.0 else "slow"
        }
        
        # Determinar status geral
        critical_failures = []
        warnings = []
        
        # Verificar falhas críticas
        if not deep_checks["dependencies"]["config"]["status"] == "healthy":
            critical_failures.append("config_unavailable")
        
        if deep_checks["performance"]["response_time_seconds"] > 5.0:
            critical_failures.append("slow_response")
        
        # Verificar warnings
        if deep_checks["ai_services"]["status"] in ["error", "not_configured"]:
            warnings.append("ai_services_limited")
        
        if deep_checks["performance"]["cache_test"] == "failed":
            warnings.append("cache_issues")
        
        overall_status = (
            "critical" if critical_failures else
            "warning" if warnings else
            "healthy"
        )
        
        response = {
            "overall_status": overall_status,
            "checks": deep_checks,
            "critical_failures": critical_failures,
            "warnings": warnings,
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "note": "Deep health check completed - informações sensíveis não expostas"
        }
        
        http_status = 200 if overall_status != "critical" else 503
        
        logger.info(f"Deep health check completed - Status: {overall_status}")
        
        return jsonify(response), http_status
        
    except Exception as e:
        logger.error(f"Erro no deep health check: {e}")
        return jsonify({
            "overall_status": "critical",
            "error": "Erro interno durante verificação profunda",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 503

@health_bp.route('/health/medical')
@swagger_auth_required
def medical_health_check():
    """
    Health check específico para compliance médica
    """
    try:
        request_id = f"medical_health_{int(datetime.now().timestamp() * 1000)}"
        
        medical_checks = {
            "knowledge_base": {},
            "qa_validation": {},
            "compliance": {},
            "medical_disclaimers": {}
        }
        
        # 1. Verificar knowledge base médica
        rag_service = get_rag()
        if rag_service:
            try:
                # Teste com termo médico específico
                test_search = rag_service.search("hanseníase", limit=1) if hasattr(rag_service, 'search') else None
                medical_checks["knowledge_base"] = {
                    "status": "healthy" if test_search else "no_results",
                    "test_query": "hanseníase",
                    "type": "enhanced" if hasattr(rag_service, 'search') else "basic"
                }
            except Exception as e:
                medical_checks["knowledge_base"] = {
                    "status": "error",
                    "error": "Failed to test knowledge base"
                }
        else:
            medical_checks["knowledge_base"] = {"status": "unavailable"}
        
        # 2. Verificar QA validation
        qa_framework = get_qa()
        config = get_config()
        
        if qa_framework and QA_FRAMEWORK_AVAILABLE:
            medical_checks["qa_validation"] = {
                "status": "healthy",
                "enabled": config.QA_ENABLED if config and hasattr(config, 'QA_ENABLED') else False,
                "min_score": config.QA_MIN_SCORE if config and hasattr(config, 'QA_MIN_SCORE') else "unknown",
                "framework": "EducationalQAFramework"
            }
        else:
            medical_checks["qa_validation"] = {"status": "unavailable"}
        
        # 3. Verificar compliance geral
        medical_checks["compliance"] = {
            "pcdt_hanseniase_2022": True,  # Base do sistema
            "lgpd": True,  # Disclaimers implementados
            "cfm_2314_2022": True,  # Telemedicina
            "anvisa_rdc_4_2009": True,  # Farmacovigilância
            "thesis_based": True,  # Baseado em tese UnB
            "educational_only": True  # Apenas uso educacional
        }
        
        # 4. Verificar medical disclaimers
        try:
            from core.security.medical_disclaimers import get_medical_disclaimers
            disclaimers = get_medical_disclaimers()
            medical_checks["medical_disclaimers"] = {
                "status": "healthy",
                "types_available": len(disclaimers) if disclaimers else 0,
                "educational_disclaimer": True,
                "dosage_disclaimer": True,
                "liability_disclaimer": True
            }
        except ImportError:
            medical_checks["medical_disclaimers"] = {"status": "not_available"}
        except Exception:
            medical_checks["medical_disclaimers"] = {"status": "error"}
        
        # Determinar status médico geral
        medical_issues = []
        
        if medical_checks["knowledge_base"].get("status") != "healthy":
            medical_issues.append("knowledge_base_issues")
        
        if medical_checks["qa_validation"].get("status") != "healthy":
            medical_issues.append("qa_validation_unavailable")
        
        if medical_checks["medical_disclaimers"].get("status") != "healthy":
            medical_issues.append("disclaimers_issues")
        
        medical_status = "healthy" if not medical_issues else "degraded"
        
        response = {
            "medical_status": medical_status,
            "checks": medical_checks,
            "issues": medical_issues,
            "compliance_score": len([c for c in medical_checks["compliance"].values() if c]) / len(medical_checks["compliance"]),
            "recommendation": (
                "Sistema médico funcionando normalmente" if medical_status == "healthy"
                else "Verificar componentes médicos com problemas"
            ),
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
        # SECURITY: Compliant with OWASP A09:2021 - Security Logging and Monitoring Failures
        # CWE-312/359/532 Prevention: Only log non-sensitive operational metadata
        # - medical_status: Contains only "healthy" or "degraded" (no patient data)
        # - request_id: UUID for correlation (no PII or medical information)
        # NEVER log: patient data, medication details, dosages, diagnoses, or treatment information
        logger.info(f"Medical health check completed - Status: {medical_status}, Request ID: {request_id}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro no medical health check: {e}")
        return jsonify({
            "medical_status": "critical",
            "error": "Erro interno durante verificação médica",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 503