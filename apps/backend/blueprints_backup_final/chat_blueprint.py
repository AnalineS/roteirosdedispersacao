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
import hashlib
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

# Import do sistema de rate limiting de produção
try:
    from core.security.production_rate_limiter import (
        medical_chat_limit,
        medical_endpoint_limit
    )
    PRODUCTION_RATE_LIMIT_AVAILABLE = True
except ImportError:
    PRODUCTION_RATE_LIMIT_AVAILABLE = False
    # Fallback decorators que não fazem nada
    def medical_chat_limit(f):
        return f
    def medical_endpoint_limit(endpoint_type):
        def decorator(f):
            return f
        return decorator

# Import unified cache for enhanced performance
try:
    from services.cache.unified_cache_manager import get_unified_cache
    UNIFIED_CACHE_AVAILABLE = True
except ImportError:
    UNIFIED_CACHE_AVAILABLE = False

# Import sistema de métricas e logging seguro
try:
    from core.metrics.performance_monitor import performance_monitor, record_ai_metric
    from core.logging.advanced_logger import log_performance, log_security_event
    from core.security.secure_logging import get_secure_logger, log_safely, sanitize_for_logging
    METRICS_AVAILABLE = True
    SECURE_LOGGING_AVAILABLE = True
except ImportError:
    METRICS_AVAILABLE = False
    SECURE_LOGGING_AVAILABLE = False
    # Fallback para logging básico
    def sanitize_for_logging(text, max_length=200):
        if not isinstance(text, str):
            text = str(text)
        # Sanitização básica para prevenir log injection
        sanitized = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        return sanitized[:max_length] if len(sanitized) > max_length else sanitized

# Import AI Provider Manager
try:
    from services.ai.ai_provider_manager import generate_ai_response, get_ai_health_status
    AI_PROVIDER_AVAILABLE = True
except ImportError:
    AI_PROVIDER_AVAILABLE = False

# Import utilities (manteremos compatibilidade)
try:
    from services.ai.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt, validate_dr_gasnelio_response
    from services.ai.ga_enhanced import get_enhanced_ga_prompt, validate_ga_response
    from services.integrations.scope_detection_system import detect_question_scope, get_limitation_response
    from services.rag.enhanced_rag_system import get_enhanced_context, cache_rag_response, add_rag_feedback, get_rag_stats
    from services.ai.personas import get_personas, get_persona_prompt
    from services.integrations.predictive_system import PredictiveAnalytics, UserContext
    from services.integrations.multimodal_processor import MultimodalProcessor
    ENHANCED_SERVICES = True
except ImportError:
    ENHANCED_SERVICES = False

# Import sistema de training/fine-tuning
try:
    from data.training.validate_data import TrainingDataCollector, validate_training_format
    TRAINING_SYSTEM_AVAILABLE = True
except ImportError:
    TRAINING_SYSTEM_AVAILABLE = False

# Import Celery tasks para endpoints assíncronos
try:
    from tasks.chat_tasks import process_question_async, chat_health_check
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

# Import Medical Disclaimers
try:
    from core.security.medical_disclaimers import (
        medical_disclaimer_system, add_medical_disclaimers, 
        get_medical_disclaimers, record_disclaimer_acknowledgment
    )
    MEDICAL_DISCLAIMERS_AVAILABLE = True
except ImportError:
    MEDICAL_DISCLAIMERS_AVAILABLE = False

# Import Educational QA Framework for validation
try:
    from core.validation.educational_qa_framework import (
        EducationalQAFramework, PersonaType, ValidationResult
    )
    QA_FRAMEWORK_AVAILABLE = True
except ImportError:
    QA_FRAMEWORK_AVAILABLE = False

# Import Zero-Trust Security System
try:
    from core.security.zero_trust import (
        require_chat_api, global_zero_trust_manager, ResourceType,
        ThreatDetector, global_access_controller
    )
    ZERO_TRUST_AVAILABLE = True
except ImportError:
    ZERO_TRUST_AVAILABLE = False
    # Fallback decorator
    def require_chat_api():
        def decorator(f):
            return f
        return decorator

try:
    from services.simple_rag import generate_context_from_rag
    BASIC_RAG = True
except ImportError:
    BASIC_RAG = False

# Configurar logger
# Initialize secure logger if available, otherwise use standard logger
if SECURE_LOGGING_AVAILABLE:
    logger = get_secure_logger(__name__)
else:
    logger = logging.getLogger(__name__)

# Initialize QA Framework globally
qa_framework = None
if QA_FRAMEWORK_AVAILABLE:
    try:
        qa_framework = EducationalQAFramework()
        logger.info("Educational QA Framework inicializado com sucesso")
    except Exception as e:
        logger.warning(f"Erro ao inicializar QA Framework: {e}")
        qa_framework = None

# Criar blueprint
chat_bp = Blueprint('chat', __name__, url_prefix='/api/v1')

def validate_and_sanitize_input(text: str) -> str:
    """
    Validação robusta e sanitização de input do usuário
    Implementa as melhores práticas de segurança para aplicação médica
    ENHANCED: Integração com EnhancedInputSanitizer para segurança avançada
    """
    if not text or not isinstance(text, str):
        raise ValueError("Input deve ser uma string não vazia")
    
    # Limite de tamanho robusto (aumentado para chat médico)
    if len(text) > 2000:
        raise ValueError(f"Input muito longo: {len(text)} caracteres (máximo: 2000)")
    
    # SECURITY ENHANCEMENT: Usar EnhancedInputSanitizer se disponível
    if SECURITY_PATCHES_AVAILABLE:
        try:
            # Primeira camada: EnhancedInputSanitizer (detecta padrões perigosos avançados)
            enhanced_sanitized = EnhancedInputSanitizer.sanitize_text(text, allow_html=False)
            logger.debug(f"Enhanced sanitization applied - Original: {len(text)} chars, Sanitized: {len(enhanced_sanitized)} chars")
            text = enhanced_sanitized
        except Exception as e:
            logger.warning(f"Enhanced sanitizer falhou, usando fallback básico: {e}")
    
    # Segunda camada: Padrões específicos para contexto médico (complementar ao Enhanced)
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
        # Padrões médicos específicos suspeitos
        r'DROP\s+TABLE',
        r'DELETE\s+FROM',
        r'UNION\s+SELECT',
    ]
    
    import re
    for pattern in malicious_patterns:
        if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
            raise ValueError(f"Padrão malicioso detectado em contexto médico")
    
    # Terceira camada: Sanitização com bleach (camada final de proteção)
    allowed_tags = []  # Sem tags HTML permitidas para chat médico
    sanitized = bleach.clean(text, tags=allowed_tags, strip=True)
    
    # HTML escape adicional para máxima segurança
    sanitized = html.escape(sanitized)
    
    return sanitized.strip()

def check_rate_limit(endpoint_type: str = 'default'):
    """
    Decorator para rate limiting integrado com Zero-Trust
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            if ZERO_TRUST_AVAILABLE:
                # Usar sistema zero-trust para análise de ameaças
                client_ip = request.remote_addr or 'unknown'
                user_agent = request.headers.get('User-Agent', '')
                
                # Criar contexto de segurança para análise
                context = global_access_controller.create_security_context(client_ip, user_agent)
                
                # Analisar nível de ameaça da requisição
                threat_detector = ThreatDetector()
                request_data = {
                    'client_ip': client_ip,
                    'user_agent': user_agent,
                    'session_id': context.session_id,
                    'endpoint': request.endpoint,
                    'method': request.method,
                    'headers': dict(request.headers),
                    'payload': request.get_data(as_text=True) if request.data else ''
                }
                
                threat_score, detected_threats = threat_detector.analyze_request_threat_level(request_data)
                
                # Aplicar rate limiting baseado no threat score
                if threat_score > 70:
                    logger.warning(f"High threat score {threat_score:.2f}, denying request from {client_ip}")
                    return jsonify({
                        'error': 'Request blocked by security system',
                        'error_code': 'THREAT_DETECTED',
                        'timestamp': datetime.now().isoformat()
                    }), 429
                elif threat_score > 30:
                    # Rate limiting mais rigoroso para IPs suspeitos
                    logger.info(f"Medium threat score {threat_score:.2f}, applying strict rate limiting")

                    # Implementar rate limiting rigoroso com SQLite
                    try:
                        from services.security.sqlite_rate_limiter import get_rate_limiter
                        limiter = get_rate_limiter()

                        # Rate limiting rigoroso: 5 req/5min para IPs suspeitos
                        allowed, info = limiter.check_rate_limit(
                            client_ip,
                            f"suspicious_chat_{threat_score:.0f}",
                            user_id=context.user_id if hasattr(context, 'user_id') else None,
                            custom_limit={'requests': 5, 'window': 300}
                        )

                        if not allowed:
                            logger.warning(f"Rate limit exceeded for suspicious IP {client_ip}")
                            return jsonify({
                                'error': 'Rate limit exceeded for suspicious activity',
                                'error_code': 'SUSPICIOUS_RATE_LIMIT',
                                'reset_time': info.get('reset_time'),
                                'limit': info.get('limit'),
                                'timestamp': datetime.now().isoformat()
                            }), 429

                    except Exception as e:
                        logger.error(f"Erro no rate limiting rigoroso: {e}")
                        # Continua sem bloquear em caso de erro
                
                # Atualizar score de ameaça da sessão
                threat_detector.update_session_threat_score(context.session_id, threat_score, detected_threats)
            
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def log_security_event(event_type: str, client_ip: Optional[str], details: Dict[str, Any]) -> None:
    """
    Log de eventos de segurança
    ENHANCED: Type safety melhorada com Optional
    """
    safe_ip = client_ip or 'unknown'
    
    # Use secure logging to prevent log injection
    sanitized_event_type = sanitize_for_logging(str(event_type), max_length=50)
    sanitized_details = sanitize_for_logging(str(details), max_length=200)
    
    if SECURE_LOGGING_AVAILABLE:
        log_safely(logger.logger, 'warning', 
                  f"SECURITY_EVENT: {sanitized_event_type} from {safe_ip} - {sanitized_details}")
    else:
        logger.warning(f"SECURITY_EVENT: {sanitized_event_type} from {safe_ip} - {sanitized_details}")
    
    return None

def process_question_with_rag(question: str, personality_id: str, request_id: str) -> tuple[str, Dict[str, Any]]:
    """
    Processa pergunta usando RAG, personas e AI Provider Manager
    NOVA FUNCIONALIDADE: Sistema RAG avançado com feedback e cache inteligente
    Retorna (answer, metadata)
    """
    config = get_config()
    rag_service = get_rag()
    cache = get_cache()
    
    # SISTEMA DE CACHE OTIMIZADO: Redis (rápido) + AstraDB (persistente)
    cache_key = f"chat:{personality_id}:{hashlib.sha256(question.encode()).hexdigest()[:12]}"
    
    # Tentativa 1: Cache Redis (ultra-rápido para respostas recentes)
    if cache and hasattr(cache, 'get') and hasattr(cache, 'set'):
        try:
            redis_cached = cache.get(cache_key)
            if redis_cached:
                logger.info(f"[{request_id}] ⚡ Redis cache hit - sub-50ms response")
                return redis_cached['answer'], {
                    **redis_cached.get('metadata', {}),
                    'cache_hit': True,
                    'cache_type': 'redis',
                    'cache_performance': 'ultra_fast'
                }
        except Exception as e:
            logger.debug(f"[{request_id}] Redis cache miss ou erro: {e}")
    
    # Tentativa 2: Enhanced RAG System com AstraDB (respostas otimizadas)
    if ENHANCED_SERVICES:
        try:
            enhanced_cached = get_enhanced_context(question, personality_id)
            if enhanced_cached and enhanced_cached.get('confidence', 0) > 0.8:
                logger.info(f"[{request_id}] [START] AstraDB Enhanced RAG hit - high confidence")
                
                # Cache também no Redis para próximas consultas
                if cache:
                    try:
                        cache.set(cache_key, {
                            'answer': enhanced_cached['response'],
                            'metadata': enhanced_cached.get('metadata', {}),
                            'cached_from': 'astra_to_redis'
                        }, ttl=1800)  # 30 min no Redis
                    except:
                        pass  # Não falhar se Redis der problema
                
                return enhanced_cached['response'], {
                    **enhanced_cached.get('metadata', {}),
                    'cache_hit': True,
                    'cache_type': 'astradb_enhanced',
                    'confidence': enhanced_cached.get('confidence')
                }
        except Exception as e:
            logger.debug(f"[{request_id}] Enhanced RAG/AstraDB miss: {e}")
    
    logger.info(f"[{request_id}] 🔄 Cache miss - gerando nova resposta")
    
    # RAG context
    context = ""
    if rag_service:
        try:
            context = rag_service.get_context(question, max_chunks=3)
            logger.info(f"[{request_id}] RAG context obtido: {len(context)} chars")
        except Exception as e:
            logger.error(f"[{request_id}] Erro no RAG: {e}")
    
    # NOVA FUNCIONALIDADE: Sistema de prompts dinâmico baseado em personas
    system_prompt = ""
    if ENHANCED_SERVICES:
        # Usar sistema de personas avançado
        try:
            if personality_id == 'dr_gasnelio':
                system_prompt = get_enhanced_dr_gasnelio_prompt(context)
            else:
                system_prompt = get_enhanced_ga_prompt(context)
            logger.info(f"[{request_id}] Usando prompt avançado para {personality_id}")
        except Exception as e:
            logger.warning(f"[{request_id}] Erro no prompt avançado, usando sistema dinâmico: {e}")
    
    # Fallback para sistema de personas dinâmico
    if not system_prompt:
        try:
            # Usar get_persona_prompt do sistema de personas
            base_prompt = get_persona_prompt(personality_id)
            if base_prompt:
                system_prompt = f"""{base_prompt}

Contexto da base de conhecimento sobre hanseníase e PQT-U:
{context}

Baseie suas respostas nas informações do contexto acima, sempre que relevante."""
                logger.info(f"[{request_id}] Usando sistema dinâmico de personas")
            else:
                raise Exception("Prompt não encontrado no sistema de personas")
        except Exception as e:
            logger.warning(f"[{request_id}] Fallback para prompts hardcoded: {e}")
            # Último fallback - prompts hardcoded (como estava antes)
            if personality_id == 'dr_gasnelio':
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
            
            answer, ai_metadata = generate_ai_response(
                messages=messages,
                model_preference=model_preference,
                temperature=0.7 if personality_id == 'dr_gasnelio' else 0.8,
                max_tokens=1000
            )
            
            # Combinar metadados
            metadata.update(ai_metadata)
            
            if answer:
                logger.info(f"[{request_id}] [OK] Resposta obtida via {ai_metadata.get('model_used', 'unknown')}")
            else:
                logger.warning(f"[{request_id}] [WARNING] AI Provider retornou resposta vazia")
                
        except Exception as e:
            logger.error(f"[{request_id}] [ERROR] Erro no AI Provider Manager: {e}")
    
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
    
    # SISTEMA DE CACHE INTELIGENTE MULTICAMADA
    if answer:
        # Calcular confidence score dinâmico
        confidence_score = 0.7  # Base para informações médicas
        
        # Fatores que aumentam confidence
        if metadata.get('model_used') and metadata.get('model_used') != 'fallback':
            confidence_score += 0.1  # IA real foi usada
        if metadata.get('qa_score', 0) > 0.8:
            confidence_score += 0.15  # QA muito alto
        elif metadata.get('qa_score', 0) > 0.6:
            confidence_score += 0.1   # QA bom
        if len(context) > 200:
            confidence_score += 0.05  # Contexto RAG rico
        if metadata.get('scope_in_scope', True):
            confidence_score += 0.1   # Pergunta dentro do escopo
        
        # Fatores que diminuem confidence
        if metadata.get('fallback_reason'):
            confidence_score -= 0.2   # Foi fallback
        if len(answer) < 100:
            confidence_score -= 0.1   # Resposta muito curta
        
        confidence_final = max(0.1, min(1.0, confidence_score))
        
        # Cache Strategy baseado em confidence e tipo de informação
        ttl_redis = 1800      # 30 min padrão
        ttl_enhanced = 7200   # 2 horas para Enhanced RAG
        
        # Informações críticas de saúde: TTL menor
        if any(term in question.lower() for term in ['dosagem', 'dose', 'efeito colateral', 'gravidez', 'criança']):
            ttl_redis = 900    # 15 min
            ttl_enhanced = 1800  # 30 min
        
        # 1. Cache Redis (rápido, TTL curto)
        if cache and confidence_final > 0.5:
            try:
                cache_data = {
                    'answer': answer,
                    'metadata': {**metadata, 'confidence': confidence_final, 'cached_at': datetime.now().isoformat()},
                    'cache_version': 'v2_optimized'
                }
                cache.set(cache_key, cache_data, ttl=ttl_redis)
                logger.info(f"[{request_id}] ⚡ Cached to Redis - TTL:{ttl_redis}s, Confidence:{confidence_final:.2f}")
            except Exception as e:
                logger.debug(f"[{request_id}] Redis cache write error: {e}")
        
        # 2. Enhanced RAG / AstraDB (persistente, confidence alto)
        if ENHANCED_SERVICES and confidence_final >= 0.8:
            try:
                cache_rag_response(question, answer, confidence_final)
                logger.info(f"[{request_id}] [START] Cached to AstraDB Enhanced RAG - High confidence: {confidence_final:.2f}")
            except Exception as e:
                logger.debug(f"[{request_id}] Enhanced RAG cache error: {e}")
    
    return answer, metadata

@chat_bp.route('/chat', methods=['POST'])
@require_chat_api()  # Zero-Trust protection
@medical_endpoint_limit('chat_medical')  # Dr. Gasnelio - Consultas médicas
@sanitize_inputs
def chat_api():
    """Endpoint principal para interação com chatbot"""
    start_time = datetime.now()
    request_id = f"req_{int(start_time.timestamp() * 1000)}"
    config = get_config()
    
    try:
        safe_remote_addr = sanitize_for_logging(str(request.remote_addr or 'unknown'), max_length=50)
        logger.info(f"[{request_id}] Nova requisição de chat de {safe_remote_addr}")
        
        # Validação de Content-Type
        if not request.is_json:
            safe_content_type = sanitize_for_logging(str(request.content_type or 'unknown'), max_length=100)
            logger.warning(f"[{request_id}] Content-Type inválido: {safe_content_type}")
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

        # NOVA FUNCIONALIDADE: Detecção de escopo da pergunta
        if ENHANCED_SERVICES:
            try:
                scope_result = detect_question_scope(question)
                logger.info(f"[{request_id}] Scope detection: {scope_result.get('in_scope', 'unknown')}")
                
                # Se pergunta está fora do escopo, retornar resposta de limitação
                if not scope_result.get('in_scope', True):
                    limitation_response = get_limitation_response(scope_result)
                    return jsonify({
                        "answer": limitation_response,
                        "persona": personality_id,
                        "request_id": request_id,
                        "timestamp": start_time.isoformat(),
                        "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                        "metadata": {
                            "scope_detection": scope_result,
                            "response_type": "out_of_scope_limitation",
                            "version": "blueprint_v1.0"
                        }
                    }), 200
                    
            except Exception as e:
                logger.warning(f"[{request_id}] Erro na detecção de escopo: {e}")
                # Continuar normalmente se detecção falhar

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
        answer, metadata = process_question_with_rag(question, personality_id, request_id)
        
        # EDUCATIONAL QA VALIDATION: Validação completa usando EducationalQAFramework
        qa_validation_result = None
        if qa_framework and QA_FRAMEWORK_AVAILABLE:
            try:
                # Mapear persona para enum
                persona_type = PersonaType.DR_GASNELIO if personality_id == 'dr_gasnelio' else PersonaType.GA
                
                # Executar validação completa
                qa_validation_start = datetime.now()
                qa_validation_result = qa_framework.validate_response(
                    answer, persona_type, question, metadata
                )
                qa_validation_time = (datetime.now() - qa_validation_start).total_seconds() * 1000
                
                logger.info(f"[{request_id}] QA Validation - Score: {qa_validation_result.score:.2f}, "
                           f"Passed: {qa_validation_result.passed}, Time: {qa_validation_time:.0f}ms")
                
                # Se validação falhar criticamente, tentar regenerar
                if (not qa_validation_result.passed and 
                    qa_validation_result.severity.value in ['critical', 'high'] and
                    qa_validation_result.score < 0.5):
                    
                    logger.warning(f"[{request_id}] QA validation falhou criticamente (score: {qa_validation_result.score:.2f}), regenerando resposta")
                    answer, metadata = process_question_with_rag(question, personality_id, request_id)
                    
                    # Segunda validação
                    qa_validation_result = qa_framework.validate_response(
                        answer, persona_type, question, metadata
                    )
                    logger.info(f"[{request_id}] QA Re-validation - Score: {qa_validation_result.score:.2f}, "
                               f"Passed: {qa_validation_result.passed}")
                
                # Adicionar informações de validação QA aos metadados
                metadata['qa_validation'] = {
                    'passed': qa_validation_result.passed,
                    'score': qa_validation_result.score,
                    'severity': qa_validation_result.severity.value,
                    'recommendations': qa_validation_result.recommendations[:3],  # Top 3 recommendations
                    'validation_time_ms': qa_validation_time,
                    'framework_version': '1.0.0',
                    'persona_consistency': qa_validation_result.details.get('persona_consistency', {}),
                    'medical_accuracy': qa_validation_result.details.get('medical_accuracy', {})
                }
                
            except Exception as qa_error:
                logger.error(f"[{request_id}] Erro na validação QA: {qa_error}")
                metadata['qa_validation'] = {
                    'passed': None,
                    'error': 'QA validation failed',
                    'framework_available': True
                }
        else:
            # Fallback para validação legacy se QA Framework não disponível
            metadata['qa_validation'] = {
                'passed': None,
                'framework_available': False,
                'fallback_mode': True
            }
        
        # LEGACY VALIDATION: Manter validação específica das personas (se disponível) como backup
        if ENHANCED_SERVICES:
            try:
                validation_passed = False
                validation_details = {}
                
                if personality_id == 'dr_gasnelio':
                    # Validar resposta do Dr. Gasnelio
                    validation_result = validate_dr_gasnelio_response(answer, question)
                    validation_passed = validation_result.get('valid', True)
                    validation_details = validation_result.get('details', {})
                    logger.debug(f"[{request_id}] Legacy Dr. Gasnelio validation: {validation_passed}")
                    
                elif personality_id == 'ga':
                    # Validar resposta do Gá
                    validation_result = validate_ga_response(answer, question)
                    validation_passed = validation_result.get('valid', True)
                    validation_details = validation_result.get('details', {})
                    logger.debug(f"[{request_id}] Legacy Gá validation: {validation_passed}")
                
                # Adicionar informações de validação legacy aos metadados
                metadata['legacy_validation'] = {
                    'passed': validation_passed,
                    'details': validation_details,
                    'validator': f'{personality_id}_validator'
                }
                
            except Exception as e:
                logger.error(f"[{request_id}] Erro na validação de persona: {e}")
                metadata['persona_validation'] = {
                    'passed': True,  # Fallback para não quebrar o fluxo
                    'error': str(e),
                    'validator': f'{personality_id}_validator'
                }
        
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
                        answer, metadata = process_question_with_rag(question, personality_id, request_id)
                
                metadata['qa_score'] = qa_score
                metadata['qa_result'] = qa_result.test_name if hasattr(qa_result, 'test_name') else 'validated'
            except Exception as e:
                logger.error(f"[{request_id}] Erro na validação QA: {e}")
                # Não falhar por causa do QA - usar score neutro
                metadata['qa_score'] = 0.7
                metadata['qa_error'] = str(e)
        
        # NOVA FUNCIONALIDADE: Sistema de Sugestões Preditivas
        suggestions = []
        if ENHANCED_SERVICES:
            try:
                # Criar contexto do usuário para análise preditiva
                user_context = UserContext(
                    session_id=request_id,  # Por enquanto usando request_id
                    persona_preference=personality_id,
                    query_history=[question],  # Em produção, manter histórico real
                    interaction_patterns={},
                    medical_interests=[]
                )
                
                # Gerar sugestões baseadas na pergunta atual
                predictive = PredictiveAnalytics()
                suggestions = predictive.generate_contextual_suggestions(question, user_context)
                
                logger.info(f"[{request_id}] Sugestões geradas: {len(suggestions)}")
                
            except Exception as e:
                logger.warning(f"[{request_id}] Erro na geração de sugestões: {e}")
        
        # Resposta final
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        response = {
            "answer": answer,
            "persona": personality_id,
            "request_id": request_id,
            "timestamp": start_time.isoformat(),
            "processing_time_ms": processing_time,
            "suggestions": suggestions,  # NOVA FUNCIONALIDADE
            "metadata": {
                **metadata,
                "version": "blueprint_v1.0"
            }
        }
        
        logger.info(f"[{request_id}] Resposta gerada com sucesso em {processing_time}ms")
        
        # COLETA DE DADOS PARA TRAINING/FINE-TUNING
        if TRAINING_SYSTEM_AVAILABLE and metadata.get('qa_score', 0) > 0.7:
            try:
                # Coletar dados de alta qualidade para training
                training_collector = TrainingDataCollector()
                
                # Adicionar exemplo ao dataset de training
                training_example = {
                    'input': question,
                    'output': answer,
                    'persona': personality_id,
                    'context': metadata.get('context_length', 0),
                    'qa_score': metadata.get('qa_score', 0),
                    'confidence': metadata.get('confidence', 0),
                    'timestamp': datetime.now().isoformat(),
                    'scope_validated': metadata.get('scope_in_scope', True),
                    'ai_model': metadata.get('model_used', 'unknown')
                }
                
                # Só coletar se passar na validação de formato
                if validate_training_format(training_example):
                    training_collector.add_example(training_example)
                    logger.info(f"[{request_id}] [TARGET] Exemplo coletado para training - QA: {metadata.get('qa_score', 0):.2f}")
                
            except Exception as e:
                logger.debug(f"[{request_id}] Erro na coleta de training data: {e}")
        
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
        
        # Método HTTP não suportado (não deveria chegar aqui devido ao decorator, mas por segurança)
        else:
            return jsonify({
                "error": "Método não permitido",
                "error_code": "METHOD_NOT_ALLOWED"
            }), 405
                
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
            "basic_rag": BASIC_RAG,
            "zero_trust": ZERO_TRUST_AVAILABLE,
            "medical_disclaimers": MEDICAL_DISCLAIMERS_AVAILABLE,
            "training_system": TRAINING_SYSTEM_AVAILABLE,
            "multimodal": ENHANCED_SERVICES,  # Multimodal está ligado ao enhanced services
            "celery_async": CELERY_AVAILABLE
        }
    }
    
    # Adicionar status detalhado do AI Provider se disponível
    if AI_PROVIDER_AVAILABLE:
        try:
            ai_health = get_ai_health_status()
            status["ai_providers"] = ai_health
        except Exception as e:
            status["components"]["ai_provider"] = f"error: {str(e)}"
    
    # Adicionar estatísticas de segurança zero-trust
    if ZERO_TRUST_AVAILABLE:
        try:
            security_stats = global_access_controller.get_security_stats()
            status["zero_trust_stats"] = security_stats
        except Exception as e:
            status["components"]["zero_trust"] = f"error: {str(e)}"
    
    # Adicionar status detalhado do Celery
    if CELERY_AVAILABLE:
        try:
            # Test Celery health
            health_task = chat_health_check.delay()
            celery_health = health_task.get(timeout=5)  # 5s timeout
            status["celery_health"] = celery_health
        except Exception as e:
            status["components"]["celery_async"] = f"error: {str(e)}"
            status["celery_error"] = "Celery workers may not be running"
    
    return jsonify(status), 200

# Endpoint para teste de provedores de IA
@chat_bp.route('/chat/test-ai', methods=['POST'])
def test_ai_providers():
    """Testa conectividade com provedores de IA"""
    
    if not AI_PROVIDER_AVAILABLE:
        return jsonify({
            "error": "AI Provider Manager não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        from services.ai.ai_provider_manager import test_ai_providers
        test_results = test_ai_providers()
        return jsonify(test_results), 200
        
    except Exception as e:
        logger.error(f"Erro ao testar provedores de IA: {e}")
        return jsonify({
            "error": "Erro interno ao testar provedores",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# Endpoint para monitoramento de segurança Zero-Trust
@chat_bp.route('/chat/security-stats', methods=['GET'])
def security_statistics():
    """Retorna estatísticas detalhadas de segurança zero-trust"""
    
    if not ZERO_TRUST_AVAILABLE:
        return jsonify({
            "error": "Sistema Zero-Trust não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        # Obter estatísticas do controlador de acesso
        access_stats = global_access_controller.get_security_stats()
        
        # Obter estatísticas do detector de ameaças
        threat_detector = ThreatDetector()
        threat_stats = threat_detector.get_threat_statistics()
        
        # Combinar estatísticas
        combined_stats = {
            "timestamp": datetime.now().isoformat(),
            "service": "chat_security",
            "access_control": access_stats,
            "threat_detection": threat_stats,
            "system_health": {
                "zero_trust_active": True,
                "continuous_verification": True,
                "behavioral_analysis": True,
                "threat_monitoring": True
            }
        }
        
        return jsonify(combined_stats), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas de segurança: {e}")
        return jsonify({
            "error": "Erro interno ao obter estatísticas",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# NOVAS FUNCIONALIDADES: Endpoints para recursos avançados

@chat_bp.route('/chat/personas', methods=['GET'])
def get_available_personas():
    """Retorna todas as personas disponíveis com suas configurações"""
    
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema de personas não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        personas = get_personas()
        return jsonify({
            "personas": personas,
            "total_personas": len(personas),
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter personas: {e}")
        return jsonify({
            "error": "Erro interno ao obter personas",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@chat_bp.route('/chat/feedback', methods=['POST'])
def add_feedback():
    """Adiciona feedback sobre qualidade das respostas (Enhanced RAG)"""
    
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema de feedback não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Payload JSON requerido",
                "error_code": "MISSING_PAYLOAD"
            }), 400
        
        required_fields = ['question', 'answer', 'rating']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Campos obrigatórios: {', '.join(missing_fields)}",
                "error_code": "MISSING_FIELDS"
            }), 400
        
        rating = data.get('rating')
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                "error": "Rating deve ser um inteiro entre 1 e 5",
                "error_code": "INVALID_RATING"
            }), 400
        
        # Adicionar feedback ao Enhanced RAG
        success = add_rag_feedback(
            question=data['question'],
            answer=data['answer'], 
            rating=rating,
            comments=data.get('comments', '')
        )
        
        if success:
            return jsonify({
                "success": True,
                "message": "Feedback registrado com sucesso",
                "timestamp": datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                "error": "Falha ao registrar feedback",
                "error_code": "FEEDBACK_FAILED"
            }), 400
            
    except Exception as e:
        logger.error(f"Erro ao adicionar feedback: {e}")
        return jsonify({
            "error": "Erro interno no sistema de feedback",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@chat_bp.route('/chat/rag-stats', methods=['GET'])
def get_rag_statistics():
    """Retorna estatísticas do sistema RAG avançado"""
    
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema RAG avançado não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        stats = get_rag_stats()
        return jsonify({
            "rag_statistics": stats,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas RAG: {e}")
        return jsonify({
            "error": "Erro interno ao obter estatísticas",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@chat_bp.route('/chat/scope-check', methods=['POST'])
def check_question_scope():
    """Verifica se uma pergunta está dentro do escopo da aplicação"""
    
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema de detecção de escopo não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        data = request.get_json()
        if not data or not data.get('question'):
            return jsonify({
                "error": "Campo 'question' é obrigatório",
                "error_code": "MISSING_QUESTION"
            }), 400
        
        question = data['question'].strip()
        if len(question) > 1000:
            return jsonify({
                "error": "Pergunta muito longa (máximo 1000 caracteres)",
                "error_code": "QUESTION_TOO_LONG"
            }), 400
        
        scope_result = detect_question_scope(question)
        
        response_data = {
            "question": question,
            "scope_result": scope_result,
            "timestamp": datetime.now().isoformat()
        }
        
        # Adicionar resposta de limitação se necessário
        if not scope_result.get('in_scope', True):
            response_data['limitation_response'] = get_limitation_response(scope_result)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro na detecção de escopo: {e}")
        return jsonify({
            "error": "Erro interno na detecção de escopo",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# SISTEMA DE FEEDBACK AUTOMÁTICO
@chat_bp.route('/chat/analytics', methods=['POST'])
def record_analytics():
    """
    Registra analytics automáticos de comportamento do usuário
    Feedback implícito: tempo de leitura, scroll, cliques, etc.
    """
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema de analytics não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Payload JSON requerido",
                "error_code": "MISSING_PAYLOAD"
            }), 400
        
        # Validar campos obrigatórios para analytics
        required_fields = ['request_id', 'event_type']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Campos obrigatórios: {', '.join(missing_fields)}",
                "error_code": "MISSING_FIELDS"
            }), 400
        
        # Processar diferentes tipos de eventos
        event_type = data.get('event_type')
        request_id = data.get('request_id')
        
        # Calcular score de satisfação implícita baseado no comportamento
        satisfaction_score = calculate_implicit_satisfaction(data)
        
        # Se score for suficiente, registrar como feedback positivo automático
        if satisfaction_score >= 0.7:
            success = add_rag_feedback(
                question=data.get('question', ''),
                answer=data.get('answer', ''),
                rating=int(satisfaction_score * 5),  # Converter para escala 1-5
                comments=f"Feedback automático - {event_type}"
            )
            
            logger.info(f"[{request_id}] Feedback automático registrado: score {satisfaction_score:.2f}")
        
        return jsonify({
            "success": True,
            "message": "Analytics registrado",
            "satisfaction_score": satisfaction_score,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao registrar analytics: {e}")
        return jsonify({
            "error": "Erro interno no sistema de analytics",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

def calculate_implicit_satisfaction(analytics_data: Dict[str, Any]) -> float:
    """
    Calcula satisfação implícita baseada no comportamento do usuário
    """
    score = 0.5  # Base neutra
    event_type = analytics_data.get('event_type', '')
    
    # Tempo de leitura (indica interesse)
    read_time = analytics_data.get('read_time_seconds', 0)
    if read_time > 30:  # Leu por mais de 30s
        score += 0.2
    elif read_time > 10:  # Leu por mais de 10s
        score += 0.1
    
    # Scroll na resposta (indica engajamento)
    scroll_percentage = analytics_data.get('scroll_percentage', 0)
    if scroll_percentage > 80:  # Leu a resposta completa
        score += 0.2
    elif scroll_percentage > 50:  # Leu mais da metade
        score += 0.1
    
    # Cópia de texto (indica utilidade)
    if analytics_data.get('text_copied', False):
        score += 0.2
    
    # Nova pergunta relacionada (indica que a resposta foi útil)
    if event_type == 'follow_up_question':
        score += 0.1
    
    # Saída rápida (indica insatisfação)
    if event_type == 'quick_exit' or read_time < 5:
        score -= 0.3
    
    # Ações negativas
    if analytics_data.get('clicked_away', False):
        score -= 0.2
    
    return max(0.0, min(1.0, score))  # Limitar entre 0 e 1

# ENDPOINT DE SUGESTÕES INDEPENDENTE
@chat_bp.route('/chat/suggestions', methods=['GET'])
def get_suggestions():
    """
    Retorna sugestões contextuais baseadas no histórico ou tópicos populares
    """
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema de sugestões não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        # Parâmetros opcionais
        session_id = request.args.get('session_id', '')
        persona = request.args.get('persona', 'dr_gasnelio')
        last_question = request.args.get('last_question', '')
        
        # Criar contexto para sugestões
        user_context = UserContext(
            session_id=session_id or f"temp_{int(datetime.now().timestamp())}",
            persona_preference=persona,
            query_history=[last_question] if last_question else [],
            interaction_patterns={},
            medical_interests=[]
        )
        
        # Gerar sugestões
        predictive = PredictiveAnalytics()
        if last_question:
            suggestions = predictive.generate_contextual_suggestions(last_question, user_context)
        else:
            # Sugestões gerais baseadas na persona
            suggestions = predictive.get_popular_questions_by_persona(persona)
        
        return jsonify({
            "suggestions": suggestions,
            "persona": persona,
            "context": "contextual" if last_question else "general",
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao gerar sugestões: {e}")
        return jsonify({
            "error": "Erro interno no sistema de sugestões",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# CHAT MULTIMODAL - Upload de imagens (receitas, bulas, etc.)
@chat_bp.route('/chat/image', methods=['POST'])
@require_chat_api()
@check_rate_limit('multimodal')
def chat_image_analysis():
    """
    Processa imagem (OCR + análise) e responde contexto médico hanseníase
    Suporta: fotos de receitas, bulas, exames
    """
    start_time = datetime.now()
    request_id = f"img_req_{int(start_time.timestamp() * 1000)}"
    
    if not ENHANCED_SERVICES:
        return jsonify({
            "error": "Sistema multimodal não disponível",
            "error_code": "MULTIMODAL_UNAVAILABLE",
            "request_id": request_id
        }), 503
    
    try:
        safe_remote_addr = sanitize_for_logging(str(request.remote_addr or 'unknown'), max_length=50)
        logger.info(f"[{request_id}] Nova requisição multimodal de {safe_remote_addr}")
        
        # Validar se tem arquivo de imagem
        if 'image' not in request.files:
            return jsonify({
                "error": "Arquivo de imagem é obrigatório",
                "error_code": "NO_IMAGE_FILE",
                "request_id": request_id
            }), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({
                "error": "Nenhum arquivo selecionado",
                "error_code": "EMPTY_FILE",
                "request_id": request_id
            }), 400
        
        # Validar tipo de arquivo
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
        if not ('.' in image_file.filename and 
                image_file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({
                "error": "Tipo de arquivo não suportado. Use: PNG, JPG, JPEG, GIF, BMP, TIFF",
                "error_code": "INVALID_FILE_TYPE",
                "request_id": request_id
            }), 400
        
        # Parâmetros opcionais
        persona_id = request.form.get('personality_id', 'dr_gasnelio').strip().lower()
        user_question = request.form.get('question', '').strip()
        analysis_type = request.form.get('analysis_type', 'auto')  # auto, prescription, leaflet, exam
        
        # Validar persona
        valid_personas = ['dr_gasnelio', 'ga']
        if persona_id not in valid_personas:
            persona_id = 'dr_gasnelio'  # Default para análises médicas
        
        logger.info(f"[{request_id}] Processando imagem - Persona: {persona_id}, Tipo: {analysis_type}")
        
        # Processar imagem com sistema multimodal
        multimodal_processor = MultimodalProcessor()
        
        # OCR + Análise
        analysis_result = multimodal_processor.analyze_medical_image(
            image_file=image_file,
            analysis_type=analysis_type,
            context="hanseníase PQT-U dispensação farmacêutica"
        )
        
        if not analysis_result.get('success', False):
            return jsonify({
                "error": "Falha no processamento da imagem",
                "error_code": "IMAGE_PROCESSING_FAILED",
                "request_id": request_id,
                "details": analysis_result.get('error', 'Erro desconhecido')
            }), 422
        
        # Extrair texto reconhecido
        extracted_text = analysis_result.get('extracted_text', '')
        image_type = analysis_result.get('detected_type', analysis_type)
        confidence = analysis_result.get('confidence', 0.0)
        
        # Construir pergunta contextualizada
        if user_question:
            contextualized_question = f"{user_question}\n\nTexto extraído da imagem ({image_type}): {extracted_text}"
        else:
            contextualized_question = f"Analisar informações sobre hanseníase/PQT-U da imagem ({image_type}): {extracted_text}"
        
        # Processar como pergunta normal do chat
        answer, metadata = process_question_with_rag(
            contextualized_question, persona_id, request_id
        )
        
        # Resposta multimodal
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        response = {
            "answer": answer,
            "persona": persona_id,
            "request_id": request_id,
            "timestamp": start_time.isoformat(),
            "processing_time_ms": processing_time,
            "image_analysis": {
                "extracted_text": extracted_text,
                "detected_type": image_type,
                "ocr_confidence": confidence,
                "file_info": {
                    "filename": image_file.filename,
                    "size_bytes": len(image_file.read()),
                    "content_type": image_file.content_type
                }
            },
            "metadata": {
                **metadata,
                "input_type": "multimodal_image",
                "analysis_type": analysis_type,
                "version": "multimodal_v1.0"
            }
        }
        
        # Reset file pointer after reading size
        image_file.seek(0)
        
        logger.info(f"[{request_id}] Análise multimodal concluída - OCR confidence: {confidence:.2f}")
        
        return jsonify(response), 200
        
    except Exception as e:
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.error(f"[{request_id}] Erro na análise multimodal: {e}")
        
        return jsonify({
            "error": "Erro interno no processamento multimodal",
            "error_code": "MULTIMODAL_ERROR", 
            "request_id": request_id,
            "processing_time_ms": processing_time,
            "message": "Tente novamente ou use o chat de texto"
        }), 500

# ENDPOINTS PARA SISTEMA DE TRAINING/FINE-TUNING
@chat_bp.route('/chat/training-stats', methods=['GET'])
def get_training_statistics():
    """Retorna estatísticas do dataset de training coletado"""
    
    if not TRAINING_SYSTEM_AVAILABLE:
        return jsonify({
            "error": "Sistema de training não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        training_collector = TrainingDataCollector()
        stats = training_collector.get_dataset_stats()
        
        return jsonify({
            "training_statistics": stats,
            "system_status": "active",
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas de training: {e}")
        return jsonify({
            "error": "Erro interno no sistema de training",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@chat_bp.route('/chat/export-training-data', methods=['POST'])
def export_training_data():
    """Exporta dados coletados para Google Colab (formato fine-tuning)"""
    
    if not TRAINING_SYSTEM_AVAILABLE:
        return jsonify({
            "error": "Sistema de training não disponível",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        data = request.get_json() or {}
        min_qa_score = data.get('min_qa_score', 0.8)
        max_examples = data.get('max_examples', 100)
        include_personas = data.get('personas', ['dr_gasnelio', 'ga'])
        
        training_collector = TrainingDataCollector()
        
        # Exportar dados com filtros
        exported_data = training_collector.export_for_colab(
            min_qa_score=min_qa_score,
            max_examples=max_examples,
            personas=include_personas
        )
        
        if not exported_data:
            return jsonify({
                "message": "Nenhum dado disponível para export com os critérios especificados",
                "criteria": {
                    "min_qa_score": min_qa_score,
                    "max_examples": max_examples,
                    "personas": include_personas
                },
                "timestamp": datetime.now().isoformat()
            }), 200
        
        return jsonify({
            "success": True,
            "message": "Dados exportados com sucesso",
            "exported_count": len(exported_data.get('examples', [])),
            "format": "colab_ready",
            "download_ready": True,
            "data": exported_data,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no export de training data: {e}")
        return jsonify({
            "error": "Erro interno no export de training",
            "error_message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# OTIMIZAÇÕES PARA MOBILE/RESPONSIVO
@chat_bp.route('/chat/mobile-config', methods=['GET'])
def get_mobile_configuration():
    """
    Retorna configurações otimizadas para dispositivos móveis
    Headers, timeouts, limites ajustados para conexões móveis
    """
    user_agent = request.headers.get('User-Agent', '').lower()
    
    # Detectar se é mobile
    is_mobile = any(mobile_indicator in user_agent for mobile_indicator in [
        'mobile', 'android', 'iphone', 'ipad', 'tablet', 'phone'
    ])
    
    # Detectar conexão lenta (baseado em headers)
    connection_type = request.headers.get('Connection-Type', '')
    is_slow_connection = any(slow_indicator in connection_type.lower() for slow_indicator in [
        '2g', '3g', 'slow'
    ])
    
    # Configurações otimizadas
    mobile_config = {
        "device_type": "mobile" if is_mobile else "desktop",
        "connection_optimized": is_slow_connection,
        "chat_settings": {
            # Limites ajustados para mobile
            "max_question_length": 800 if is_mobile else 1000,
            "max_response_length": 1200 if is_mobile else 2000,
            "typing_timeout_ms": 5000 if is_mobile else 3000,
            
            # Cache mais agressivo em mobile
            "cache_priority": "high" if is_mobile else "normal",
            "preload_suggestions": not is_slow_connection,
            
            # Chunk responses para conexões lentas
            "chunk_responses": is_slow_connection,
            "chunk_size": 200 if is_slow_connection else 500
        },
        "ui_optimizations": {
            # Simplificar interface em mobile
            "show_advanced_options": not is_mobile,
            "compact_personas": is_mobile,
            "auto_scroll": is_mobile,
            "touch_optimized": is_mobile,
            
            # Reduzir animações em conexões lentas
            "reduced_animations": is_slow_connection,
            "lazy_load_images": is_mobile or is_slow_connection
        },
        "performance": {
            "request_timeout_ms": 15000 if is_slow_connection else 10000,
            "retry_attempts": 2 if is_slow_connection else 1,
            "compression": "gzip",
            "minify_responses": is_mobile
        },
        "features": {
            # Funcionalidades baseadas na capacidade do device
            "multimodal_upload": ENHANCED_SERVICES and not is_slow_connection,
            "voice_input": is_mobile and ('speech' in user_agent or 'webkit' in user_agent),
            "offline_mode": False,  # Para futuro PWA
            "push_notifications": False  # Para futuro
        },
        "timestamp": datetime.now().isoformat()
    }
    
    return jsonify(mobile_config), 200

@chat_bp.route('/chat/compress', methods=['POST'])
def chat_compressed():
    """
    Endpoint de chat com resposta comprimida para dispositivos móveis
    Mesma funcionalidade do /chat mas com resposta otimizada
    """
    # Verificar se realmente é mobile
    user_agent = request.headers.get('User-Agent', '').lower()
    is_mobile = any(indicator in user_agent for indicator in ['mobile', 'android', 'iphone'])
    
    if not is_mobile:
        # Redirecionar para endpoint normal se não for mobile
        return jsonify({
            "error": "Este endpoint é otimizado para dispositivos móveis",
            "redirect": "/api/v1/chat",
            "error_code": "DESKTOP_REDIRECT"
        }), 302
    
    # Usar mesma lógica do chat normal mas com otimizações
    # (Para economizar código, vamos reaproveitar a função existente)
    return chat_api()

@chat_bp.route('/chat/lite', methods=['POST'])
def chat_lite():
    """
    Versão lite do chat para conexões lentas
    - Sem sugestões
    - Sem analytics automático  
    - Resposta mais direta
    - Cache agressivo
    """
    start_time = datetime.now()
    request_id = f"lite_req_{int(start_time.timestamp() * 1000)}"
    
    try:
        # Validações básicas (mesmo que chat normal)
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Payload JSON requerido"}), 400
        
        question = data.get('question', '').strip()
        personality_id = data.get('personality_id', 'dr_gasnelio').strip().lower()
        
        if not question or len(question) > 500:  # Limite menor para lite
            return jsonify({"error": "Pergunta inválida (max 500 chars)"}), 400
        
        if personality_id not in ['dr_gasnelio', 'ga']:
            personality_id = 'dr_gasnelio'
        
        # Sanitização básica
        question = validate_and_sanitize_input(question)
        
        # Processar com RAG (sem sugestões)
        answer, metadata = process_question_with_rag(question, personality_id, request_id)
        
        # Resposta lite (sem campos extras)
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        lite_response = {
            "answer": answer,
            "persona": personality_id,
            "request_id": request_id,
            "processing_time_ms": processing_time,
            # Sem suggestions, sem metadata detalhado
            "cache_hit": metadata.get('cache_hit', False)
        }
        
        logger.info(f"[{request_id}] 📱 Chat Lite response - {processing_time}ms")
        return jsonify(lite_response), 200
        
    except Exception as e:
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.error(f"[{request_id}] Erro no chat lite: {e}")
        
        return jsonify({
            "error": "Erro interno",
            "request_id": request_id,
            "processing_time_ms": processing_time
        }), 500

# ==========================================
# ENDPOINTS ASSÍNCRONOS COM CELERY
# ==========================================

@chat_bp.route('/chat/async', methods=['POST'])
@require_chat_api()
@check_rate_limit('chat')
@sanitize_inputs
def chat_async():
    """
    Endpoint assíncrono para chat - inicia processamento em background
    Retorna task_id para polling de status
    """
    start_time = datetime.now()
    request_id = f"async_req_{int(start_time.timestamp() * 1000)}"
    
    if not CELERY_AVAILABLE:
        return jsonify({
            "error": "Sistema assíncrono não disponível",
            "error_code": "CELERY_UNAVAILABLE",
            "request_id": request_id,
            "fallback": "/api/v1/chat"
        }), 503
    
    try:
        safe_remote_addr = sanitize_for_logging(str(request.remote_addr or 'unknown'), max_length=50)
        logger.info(f"[{request_id}] Nova requisição assíncrona de {safe_remote_addr}")
        
        # Validações básicas (mesmo do síncrono)
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        data = request.get_json(force=True)
        if not data:
            return jsonify({
                "error": "Payload JSON requerido",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        # Validação da pergunta
        question = data.get('question', '').strip()
        if not question:
            return jsonify({
                "error": "Campo 'question' é obrigatório",
                "error_code": "MISSING_QUESTION",
                "request_id": request_id
            }), 400
        
        if len(question) > 1000:
            return jsonify({
                "error": "Pergunta muito longa (máximo 1000 caracteres)",
                "error_code": "QUESTION_TOO_LONG",
                "request_id": request_id
            }), 400

        # Validação da persona
        personality_id = data.get('personality_id', '').strip().lower()
        valid_personas = ['dr_gasnelio', 'ga']
        if not personality_id or personality_id not in valid_personas:
            return jsonify({
                "error": "Campo 'personality_id' deve ser válido",
                "error_code": "INVALID_PERSONA",
                "request_id": request_id,
                "valid_personas": valid_personas
            }), 400

        # Sanitização de input
        try:
            question = validate_and_sanitize_input(question)
        except ValueError as e:
            log_security_event('MALICIOUS_INPUT_ATTEMPT', request.remote_addr, {
                'error': str(e),
                'request_id': request_id
            })
            return jsonify({
                "error": f"Input inválido: {str(e)}",
                "error_code": "INVALID_INPUT",
                "request_id": request_id
            }), 400
        
        # Detecção de escopo (síncrona, rápida)
        if ENHANCED_SERVICES:
            try:
                scope_result = detect_question_scope(question)
                if not scope_result.get('in_scope', True):
                    limitation_response = get_limitation_response(scope_result)
                    return jsonify({
                        "answer": limitation_response,
                        "persona": personality_id,
                        "request_id": request_id,
                        "timestamp": start_time.isoformat(),
                        "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                        "metadata": {
                            "scope_detection": scope_result,
                            "response_type": "out_of_scope_limitation",
                            "processing_mode": "synchronous_limitation"
                        }
                    }), 200
            except Exception as e:
                logger.warning(f"[{request_id}] Erro na detecção de escopo: {e}")
        
        logger.info(f"[{request_id}] Iniciando processamento assíncrono - Persona: {personality_id}")
        
        # Envia task para Celery
        task = process_question_async.delay(question, personality_id, request_id)
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        response = {
            "task_id": task.id,
            "status": "processing",
            "request_id": request_id,
            "persona": personality_id,
            "timestamp": start_time.isoformat(),
            "processing_time_ms": processing_time,
            "estimated_completion": "2-10 seconds",
            "polling_url": f"/api/v1/chat/status/{task.id}",
            "metadata": {
                "processing_mode": "asynchronous",
                "version": "celery_v1.0"
            }
        }
        
        logger.info(f"[{request_id}] Task assíncrona iniciada: {task.id}")
        return jsonify(response), 202  # Accepted
        
    except Exception as e:
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.error(f"[{request_id}] Erro ao iniciar processamento assíncrono: {e}")
        
        return jsonify({
            "error": "Erro interno ao iniciar processamento assíncrono",
            "error_code": "ASYNC_START_ERROR",
            "request_id": request_id,
            "processing_time_ms": processing_time,
            "fallback": "Use /api/v1/chat para processamento síncrono"
        }), 500

@chat_bp.route('/chat/status/<task_id>', methods=['GET'])
def chat_status(task_id: str):
    """
    Verifica status de task assíncrona
    Suporta polling para obter resultado
    """
    if not CELERY_AVAILABLE:
        return jsonify({
            "error": "Sistema assíncrono não disponível",
            "error_code": "CELERY_UNAVAILABLE"
        }), 503
    
    try:
        # Obter task result
        task = process_question_async.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            # Task ainda não foi processada
            return jsonify({
                "task_id": task_id,
                "status": "waiting",
                "progress": 0,
                "message": "Task na fila de processamento...",
                "timestamp": datetime.now().isoformat()
            }), 200
            
        elif task.state == 'PROGRESS':
            # Task em andamento
            progress_info = task.info or {}
            return jsonify({
                "task_id": task_id,
                "status": "processing",
                "stage": progress_info.get('stage', 'unknown'),
                "progress": progress_info.get('progress', 0),
                "message": progress_info.get('message', 'Processando...'),
                "request_id": progress_info.get('request_id', ''),
                "timestamp": datetime.now().isoformat()
            }), 200
            
        elif task.state == 'SUCCESS':
            # Task completa
            result = task.result
            if result and result.get('success'):
                return jsonify({
                    "task_id": task_id,
                    "status": "completed",
                    "result": {
                        "answer": result['answer'],
                        "metadata": result.get('metadata', {}),
                        "request_id": result.get('request_id', '')
                    },
                    "timestamp": datetime.now().isoformat()
                }), 200
            else:
                return jsonify({
                    "task_id": task_id,
                    "status": "completed_with_error", 
                    "error": result.get('error', 'Erro desconhecido'),
                    "metadata": result.get('metadata', {}),
                    "timestamp": datetime.now().isoformat()
                }), 200
            
        elif task.state == 'FAILURE':
            # Task falhou
            error_info = task.info or {}
            return jsonify({
                "task_id": task_id,
                "status": "failed",
                "error": error_info.get('error', str(task.info)),
                "stage": error_info.get('stage', 'unknown'),
                "message": error_info.get('message', 'Erro no processamento'),
                "request_id": error_info.get('request_id', ''),
                "timestamp": datetime.now().isoformat()
            }), 200
        
        else:
            # Estado desconhecido
            return jsonify({
                "task_id": task_id,
                "status": "unknown",
                "state": task.state,
                "info": str(task.info),
                "timestamp": datetime.now().isoformat()
            }), 200
            
    except Exception as e:
        logger.error(f"Erro ao verificar status da task {task_id}: {e}")
        return jsonify({
            "error": "Erro interno ao verificar status",
            "error_code": "STATUS_CHECK_ERROR",
            "task_id": task_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@chat_bp.route('/chat/cancel/<task_id>', methods=['POST'])
def chat_cancel(task_id: str):
    """
    Cancela task assíncrona se ainda não foi completada
    """
    if not CELERY_AVAILABLE:
        return jsonify({
            "error": "Sistema assíncrono não disponível",
            "error_code": "CELERY_UNAVAILABLE"
        }), 503
    
    try:
        task = process_question_async.AsyncResult(task_id)
        
        if task.state in ['PENDING', 'PROGRESS']:
            # Cancelar task
            task.revoke(terminate=True)
            
            return jsonify({
                "task_id": task_id,
                "status": "cancelled",
                "message": "Task cancelada com sucesso",
                "timestamp": datetime.now().isoformat()
            }), 200
            
        elif task.state == 'SUCCESS':
            return jsonify({
                "task_id": task_id,
                "status": "already_completed",
                "message": "Task já foi completada, não pode ser cancelada",
                "timestamp": datetime.now().isoformat()
            }), 200
            
        else:
            return jsonify({
                "task_id": task_id,
                "status": task.state.lower(),
                "message": f"Task no estado {task.state}, não pode ser cancelada",
                "timestamp": datetime.now().isoformat()
            }), 200
            
    except Exception as e:
        logger.error(f"Erro ao cancelar task {task_id}: {e}")
        return jsonify({
            "error": "Erro interno ao cancelar task",
            "error_code": "CANCEL_ERROR",
            "task_id": task_id,
            "timestamp": datetime.now().isoformat()
        }), 500