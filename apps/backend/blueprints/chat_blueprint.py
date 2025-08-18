# -*- coding: utf-8 -*-
"""
Chat Blueprint - Gerencia interações de chat com personas IA
Migrado do main.py para modularização
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import html
import bleach
from typing import Dict, Any, Optional

# Importar patches de segurança
try:
    from core.security.security_patches import sanitize_inputs, rate_limit, EnhancedInputSanitizer
    SECURITY_PATCHES_AVAILABLE = True
except ImportError:
    SECURITY_PATCHES_AVAILABLE = False
    # Fallback para sanitização básica
    def sanitize_inputs(f):
        return f
    def rate_limit(max_attempts=10, window=60):
        def decorator(f):
            return f
        return decorator

# Importar dependências
from core.dependencies import get_cache, get_rag, get_qa, get_config

# Import sistema de métricas
try:
    from core.metrics.performance_monitor import performance_monitor, record_ai_metric
    from core.logging.advanced_logger import log_performance, log_security_event
    METRICS_AVAILABLE = True
except ImportError:
    METRICS_AVAILABLE = False

# Import AI Provider Manager
try:
    from services.ai_provider_manager import generate_ai_response, get_ai_health_status
    AI_PROVIDER_AVAILABLE = True
except ImportError:
    AI_PROVIDER_AVAILABLE = False

# Import utilities (manteremos compatibilidade)
try:
    from services.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt, validate_dr_gasnelio_response
    from services.ga_enhanced import get_enhanced_ga_prompt, validate_ga_response
    from services.scope_detection_system import detect_question_scope, get_limitation_response
    from services.enhanced_rag_system import get_enhanced_context, cache_rag_response, add_rag_feedback, get_rag_stats
    from services.personas import get_personas, get_persona_prompt
    ENHANCED_SERVICES = True
except ImportError:
    ENHANCED_SERVICES = False

# Import Medical Disclaimers
try:
    from core.security.medical_disclaimers import (
        medical_disclaimer_system, add_medical_disclaimers, 
        get_medical_disclaimers, record_disclaimer_acknowledgment
    )
    MEDICAL_DISCLAIMERS_AVAILABLE = True
except ImportError:
    MEDICAL_DISCLAIMERS_AVAILABLE = False

try:
    from services.simple_rag import generate_context_from_rag
    BASIC_RAG = True
except ImportError:
    BASIC_RAG = False

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
chat_bp = Blueprint('chat', __name__, url_prefix='/api/v1')

def validate_and_sanitize_input(text: str) -> str:
    """
    Validação robusta e sanitização de input do usuário
    Implementa as melhores práticas de segurança para aplicação médica
    """
    if not text or not isinstance(text, str):
        raise ValueError("Input deve ser uma string não vazia")
    
    # Limite de tamanho robusto
    if len(text) > 1000:
        raise ValueError(f"Input muito longo: {len(text)} caracteres (máximo: 1000)")
    
    # Padrões maliciosos para contexto médico
    malicious_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'data:text/html',
        r'vbscript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
        r'<applet[^>]*>',
        r'<meta[^>]*>',
        r'<link[^>]*>',
        r'eval\s*\(',
        r'expression\s*\(',
        r'url\s*\(',
        r'@import',
        r'<.*?(onerror|onload|onclick|onmouseover).*?>',
    ]
    
    import re
    for pattern in malicious_patterns:
        if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
            raise ValueError(f"Padrão malicioso detectado")
    
    # Sanitização com bleach
    allowed_tags = []  # Sem tags HTML permitidas para chat médico
    sanitized = bleach.clean(text, tags=allowed_tags, strip=True)
    
    # HTML escape adicional
    sanitized = html.escape(sanitized)
    
    return sanitized.strip()

def check_rate_limit(endpoint_type: str = 'default'):
    """
    Decorator para rate limiting - versão simplificada para blueprint
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            # Por enquanto, sem rate limiting no blueprint
            # TODO: Implementar rate limiting distribuído com Redis
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def log_security_event(event_type: str, client_ip: str, details: Dict[str, Any]):
    """
    Log de eventos de segurança
    """
    logger.warning(f"SECURITY_EVENT: {event_type} from {client_ip} - {details}")

async def process_question_with_rag(question: str, personality_id: str, request_id: str) -> tuple[str, Dict]:
    """
    Processa pergunta usando RAG, personas e AI Provider Manager
    Retorna (answer, metadata)
    """
    config = get_config()
    rag_service = get_rag()
    cache = get_cache()
    
    # Cache key
    cache_key = f"chat:{personality_id}:{hash(question)}"
    
    # Tentar cache primeiro
    if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
        try:
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.info(f"[{request_id}] Cache hit para pergunta")
                return cached_response['answer'], {
                    **cached_response.get('metadata', {}),
                    'cache_hit': True
                }
        except TypeError:
            logger.debug(f"[{request_id}] Cache não compatível - gerando resposta nova")
    
    # RAG context
    context = ""
    if rag_service:
        try:
            context = rag_service.get_context(question, max_chunks=3)
            logger.info(f"[{request_id}] RAG context obtido: {len(context)} chars")
        except Exception as e:
            logger.error(f"[{request_id}] Erro no RAG: {e}")
    
    # Construir prompt baseado na persona
    if personality_id == 'dr_gasnelio':
        if ENHANCED_SERVICES:
            system_prompt = get_enhanced_dr_gasnelio_prompt(context)
        else:
            system_prompt = f"""Você é Dr. Gasnelio, farmacêutico clínico especialista em hanseníase.

Características:
- Linguagem técnica e científica
- Baseado em evidências do PCDT Hanseníase 2022
- Cita dosagens, contraindicações e interações
- Sempre orienta consulta com profissional de saúde

Contexto da base de conhecimento:
{context}

Responda de forma técnica e precisa."""
    else:  # ga
        if ENHANCED_SERVICES:
            system_prompt = get_enhanced_ga_prompt(context)
        else:
            system_prompt = f"""Você é Gá, assistente empática especialista em hanseníase.

Características:
- Linguagem simples e acessível
- Tom caloroso e acolhedor
- Explica termos médicos de forma didática
- Oferece apoio emocional quando apropriado

Contexto da base de conhecimento:
{context}

Responda de forma empática e didática."""
    
    # Construir mensagens para IA
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ]
    
    # Usar AI Provider Manager se disponível
    answer = None
    metadata = {
        'persona': personality_id,
        'context_length': len(context),
        'cache_hit': False
    }
    
    if AI_PROVIDER_AVAILABLE:
        try:
            # Escolher modelo preferencial baseado na persona
            model_preference = 'llama-3.2-3b' if personality_id == 'dr_gasnelio' else 'kimie-k2'
            
            logger.info(f"[{request_id}] Chamando AI Provider Manager com modelo {model_preference}")
            
            answer, ai_metadata = await generate_ai_response(
                messages=messages,
                model_preference=model_preference,
                temperature=0.7 if personality_id == 'dr_gasnelio' else 0.8,
                max_tokens=1000
            )
            
            # Combinar metadados
            metadata.update(ai_metadata)
            
            if answer:
                logger.info(f"[{request_id}] ✅ Resposta obtida via {ai_metadata.get('model_used', 'unknown')}")
            else:
                logger.warning(f"[{request_id}] ⚠️ AI Provider retornou resposta vazia")
                
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Erro no AI Provider Manager: {e}")
    
    # Fallback se AI não disponível ou falhou
    if not answer:
        if personality_id == 'dr_gasnelio':
            answer = f"""Dr. Gasnelio responde:

Com base no contexto disponível sobre: {question}

{context[:300] if context else 'Contexto não disponível no momento.'}...

*Sistema em modo de manutenção. Esta é uma resposta básica.*

Para informações completas, consulte um farmacêutico clínico ou acesse o PCDT Hanseníase 2022 do Ministério da Saúde."""
        else:
            answer = f"""Oi! Sou a Gá! 😊

Sobre sua pergunta: {question}

{context[:300] if context else 'No momento estou com acesso limitado às informações.'}...

*Estou em modo de manutenção, mas em breve estarei funcionando 100%!*

Para informações mais detalhadas, recomendo consultar um profissional de saúde. Estou aqui para apoiar! 💙"""
        
        metadata.update({
            'model': 'fallback',
            'provider': 'internal',
            'success': False,
            'fallback_reason': 'ai_provider_unavailable'
        })
        
        logger.info(f"[{request_id}] 🔄 Usando resposta fallback para {personality_id}")
    
    # Cache da resposta
    if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
        try:
            cache.set(cache_key, {
                'answer': answer,
                'metadata': metadata
            }, ttl=3600)  # 1 hora
        except TypeError:
            pass
    
    return answer, metadata

@chat_bp.route('/chat', methods=['POST'])
@check_rate_limit('chat')
@sanitize_inputs
@rate_limit(max_attempts=30, window=60)  # 30 mensagens por minuto
async def chat_api():
    """Endpoint principal para interação com chatbot"""
    start_time = datetime.now()
    request_id = f"req_{int(start_time.timestamp() * 1000)}"
    config = get_config()
    
    try:
        logger.info(f"[{request_id}] Nova requisição de chat de {request.remote_addr}")
        
        # Validação de Content-Type
        if not request.is_json:
            logger.warning(f"[{request_id}] Content-Type inválido: {request.content_type}")
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        # Validação de JSON
        try:
            data = request.get_json(force=True)
        except Exception as json_error:
            logger.warning(f"[{request_id}] JSON mal formado: {json_error}")
            return jsonify({
                "error": "JSON mal formado ou inválido",
                "error_code": "INVALID_JSON",
                "request_id": request_id
            }), 400

        if not data or not isinstance(data, dict):
            logger.warning(f"[{request_id}] Payload vazio ou tipo incorreto")
            return jsonify({
                "error": "Payload deve ser um objeto JSON não vazio",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        # Validação da pergunta
        question = data.get('question', '').strip()
        if not question:
            logger.warning(f"[{request_id}] Pergunta vazia")
            return jsonify({
                "error": "Campo 'question' é obrigatório e não pode estar vazio",
                "error_code": "MISSING_QUESTION",
                "request_id": request_id
            }), 400
        
        if len(question) > 1000:
            logger.warning(f"[{request_id}] Pergunta muito longa: {len(question)} caracteres")
            return jsonify({
                "error": "Pergunta muito longa (máximo 1000 caracteres)",
                "error_code": "QUESTION_TOO_LONG",
                "request_id": request_id
            }), 400

        # Validação da persona
        personality_id = data.get('personality_id', '').strip().lower()
        valid_personas = ['dr_gasnelio', 'ga']
        if not personality_id or personality_id not in valid_personas:
            logger.warning(f"[{request_id}] Persona inválida: {personality_id}")
            return jsonify({
                "error": "Campo 'personality_id' deve ser um dos valores válidos",
                "error_code": "INVALID_PERSONA",
                "request_id": request_id,
                "valid_personas": valid_personas
            }), 400

        # Sanitização de input
        try:
            question = validate_and_sanitize_input(question)
        except ValueError as e:
            client_ip = request.remote_addr or 'unknown'
            log_security_event('MALICIOUS_INPUT_ATTEMPT', client_ip, {
                'error': str(e),
                'request_id': request_id
            })
            return jsonify({
                "error": f"Input inválido: {str(e)}",
                "error_code": "INVALID_INPUT",
                "request_id": request_id
            }), 400
        
        logger.info(f"[{request_id}] Processando - Persona: {personality_id}, Pergunta: {len(question)} chars")
        
        # Processar com RAG e IA
        answer, metadata = await process_question_with_rag(question, personality_id, request_id)
        
        # QA Validation (se habilitado)
        qa_framework = get_qa()
        if qa_framework and config.QA_ENABLED:
            try:
                # Importar PersonaType para conversão
                from core.validation.educational_qa_framework import PersonaType
                
                # Converter personality_id string para PersonaType
                persona_enum = PersonaType.DR_GASNELIO if personality_id == "dr_gasnelio" else PersonaType.GA
                
                # Corrigir ordem dos parâmetros: response, persona, question, context
                qa_result = qa_framework.validate_response(answer, persona_enum, question, None)
                qa_score = qa_result.score if hasattr(qa_result, 'score') else 0.5
                
                if qa_score < config.QA_MIN_SCORE:
                    logger.warning(f"[{request_id}] QA score baixo: {qa_score}")
                    if config.QA_MAX_RETRIES > 0:
                        # Tentar novamente (como solicitado)
                        logger.info(f"[{request_id}] Tentando novamente devido a QA baixo")
                        answer, metadata = await process_question_with_rag(question, personality_id, request_id)
                
                metadata['qa_score'] = qa_score
                metadata['qa_result'] = qa_result.test_name if hasattr(qa_result, 'test_name') else 'validated'
            except Exception as e:
                logger.error(f"[{request_id}] Erro na validação QA: {e}")
                # Não falhar por causa do QA - usar score neutro
                metadata['qa_score'] = 0.7
                metadata['qa_error'] = str(e)
        
        # Resposta final
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        response = {
            "answer": answer,
            "persona": personality_id,
            "request_id": request_id,
            "timestamp": start_time.isoformat(),
            "processing_time_ms": processing_time,
            "metadata": {
                **metadata,
                "version": "blueprint_v1.0"
            }
        }
        
        logger.info(f"[{request_id}] Resposta gerada com sucesso em {processing_time}ms")
        
        # Registrar métricas de performance e IA
        if METRICS_AVAILABLE:
            # Registrar métricas de performance do endpoint
            performance_monitor.record_request("/api/chat", processing_time, False, request_id)
            
            # Registrar métricas específicas de IA
            record_ai_metric('persona_request', 1, persona=personality_id, request_id=request_id)
            
            if 'qa_score' in metadata:
                record_ai_metric('qa_validation', 1, score=metadata['qa_score'], request_id=request_id)
            
            # Log de performance estruturado
            log_performance(
                operation="chat_request_complete",
                duration_ms=processing_time,
                request_id=request_id,
                persona=personality_id,
                qa_score=metadata.get('qa_score'),
                context_length=metadata.get('context_length', 0)
            )
        
        # Adicionar disclaimers médicos à resposta
        if MEDICAL_DISCLAIMERS_AVAILABLE:
            try:
                request_context = {
                    'endpoint': request.endpoint or '/chat',
                    'persona': personality_id,
                    'method': request.method
                }
                
                applicable_disclaimers = get_medical_disclaimers(request_context)
                
                if applicable_disclaimers:
                    disclaimer_data = medical_disclaimer_system.format_disclaimer_response(
                        applicable_disclaimers, 
                        include_content=False  # Só incluir metadata para não sobrecarregar
                    )
                    response['medical_disclaimers'] = disclaimer_data
                    
                    # Adicionar headers HTTP
                    disclaimer_headers = medical_disclaimer_system.get_disclaimer_headers(applicable_disclaimers)
                    
                    flask_response = jsonify(response)
                    for header, value in disclaimer_headers.items():
                        flask_response.headers[header] = value
                    
                    return flask_response, 200
                    
            except Exception as disclaimer_error:
                logger.warning(f"[{request_id}] Erro ao adicionar disclaimers: {disclaimer_error}")
                # Continuar sem disclaimers se houver erro
        
        return jsonify(response), 200
        
    except Exception as e:
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.error(f"[{request_id}] Erro interno: {e}")
        
        # Registrar métricas de erro
        if METRICS_AVAILABLE:
            performance_monitor.record_request("/api/chat", processing_time, True, request_id)
            
            # Log de segurança para erro crítico
            log_security_event(
                event_type="chat_request_error",
                details={
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "processing_time_ms": processing_time,
                    "client_ip": request.remote_addr
                },
                severity="ERROR",
                request_id=request_id
            )
        
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id,
            "processing_time_ms": processing_time,
            "message": "Tente novamente em alguns instantes"
        }), 500

# Endpoint para disclaimers médicos
@chat_bp.route('/chat/disclaimers', methods=['GET', 'POST'])
def medical_disclaimers_endpoint():
    """Endpoint para gerenciar disclaimers médicos"""
    if not MEDICAL_DISCLAIMERS_AVAILABLE:
        return jsonify({
            "error": "Sistema de disclaimers médicos não disponível",
            "error_code": "DISCLAIMERS_UNAVAILABLE"
        }), 503
    
    try:
        if request.method == 'GET':
            # Obter disclaimers baseado no contexto
            request_context = {
                'endpoint': request.args.get('endpoint', '/general'),
                'persona': request.args.get('persona', ''),
                'method': 'GET'
            }
            
            applicable_disclaimers = get_medical_disclaimers(request_context)
            disclaimer_data = medical_disclaimer_system.format_disclaimer_response(
                applicable_disclaimers, 
                include_content=True  # Incluir conteúdo completo na consulta
            )
            
            return jsonify(disclaimer_data), 200
        
        elif request.method == 'POST':
            # Registrar acknowledgment de disclaimer
            data = request.get_json()
            if not data:
                return jsonify({
                    "error": "Payload JSON requerido",
                    "error_code": "MISSING_PAYLOAD"
                }), 400
            
            user_id = data.get('user_id')
            disclaimer_type = data.get('disclaimer_type')
            
            if not user_id or not disclaimer_type:
                return jsonify({
                    "error": "user_id e disclaimer_type são obrigatórios",
                    "error_code": "MISSING_FIELDS"
                }), 400
            
            success = record_disclaimer_acknowledgment(user_id, disclaimer_type)
            
            if success:
                return jsonify({
                    "success": True,
                    "message": "Acknowledgment registrado com sucesso",
                    "user_id": user_id,
                    "disclaimer_type": disclaimer_type,
                    "timestamp": datetime.now().isoformat()
                }), 200
            else:
                return jsonify({
                    "error": "Falha ao registrar acknowledgment",
                    "error_code": "ACKNOWLEDGMENT_FAILED"
                }), 400
                
    except Exception as e:
        logger.error(f"Erro no endpoint de disclaimers: {e}")
        return jsonify({
            "error": "Erro interno no sistema de disclaimers",
            "error_code": "DISCLAIMERS_ERROR"
        }), 500

# Endpoint para teste de conectividade do chat
@chat_bp.route('/chat/health', methods=['GET'])
def chat_health():
    """Health check específico do chat"""
    cache = get_cache()
    rag_service = get_rag()
    
    status = {
        "service": "chat",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "cache": "available" if cache else "unavailable",
            "rag": "available" if rag_service else "unavailable",
            "ai_provider": "available" if AI_PROVIDER_AVAILABLE else "unavailable",
            "enhanced_services": ENHANCED_SERVICES,
            "basic_rag": BASIC_RAG
        }
    }
    
    # Adicionar status detalhado do AI Provider se disponível
    if AI_PROVIDER_AVAILABLE:
        try:
            ai_health = get_ai_health_status()
            status["ai_providers"] = ai_health
        except Exception as e:
            status["components"]["ai_provider"] = f"error: {str(e)}"
    
    return jsonify(status), 200

# Endpoint para teste de provedores de IA
@chat_bp.route('/chat/test-ai', methods=['POST'])
async def test_ai_providers():
    """Testa conectividade com provedores de IA"""
    
    if not AI_PROVIDER_AVAILABLE:
        return jsonify({
            "error": "AI Provider Manager não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        from services.ai_provider_manager import test_ai_providers
        test_results = await test_ai_providers()
        return jsonify(test_results), 200
        
    except Exception as e:
        logger.error(f"Erro ao testar provedores de IA: {e}")
        return jsonify({
            "error": "Erro interno ao testar provedores",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500