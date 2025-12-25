#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chat Tasks - Celery tasks para processamento assíncrono do chat
Mantém compatibilidade com sistema síncrono existente
"""

from celery import current_task
from celery_config import celery_app
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any
import hashlib
from core.logging.sanitizer import sanitize_log_input, sanitize_error, sanitize_request_id

# Importar dependências do sistema existente
try:
    from core.dependencies import get_cache, get_rag, get_config
    from services.ai.ai_provider_manager import generate_ai_response, get_ai_health_status
    from services.enhanced_rag_system import get_enhanced_context, cache_rag_response
    from services.personas import get_persona_prompt
    DEPENDENCIES_AVAILABLE = True
except ImportError as e:
    # Only log warning if not in clean startup mode
    import os
    clean_startup = os.environ.get('CLEAN_STARTUP', 'true').lower() == 'true'
    environment = os.environ.get('ENVIRONMENT', 'development')

    if not (clean_startup and environment in ['development', 'testing']):
        logging.warning(f"Dependências não disponíveis para Celery tasks: {e}")

    DEPENDENCIES_AVAILABLE = False

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='chat.process_question')
def process_question_async(self, question: str, personality_id: str, request_id: str) -> Dict[str, Any]:
    """
    Task assíncrona para processamento de pergunta
    MANTÉM MESMA LÓGICA do process_question_with_rag síncrono
    """
    try:
        # Atualizar progresso - Iniciando
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'starting',
                'progress': 5,
                'message': 'Inicializando processamento...',
                'request_id': request_id
            }
        )
        
        if not DEPENDENCIES_AVAILABLE:
            raise Exception("Dependências do sistema não disponíveis")
        
        # Configuração e dependências
        config = get_config()
        rag_service = get_rag()
        cache = get_cache()
        
        # Atualizar progresso - Cache check
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'checking_cache',
                'progress': 15,
                'message': 'Verificando cache...',
                'request_id': request_id
            }
        )
        
        # SISTEMA DE CACHE OTIMIZADO (mesmo do síncrono)
        cache_key = f"chat:{personality_id}:{hashlib.sha256(question.encode()).hexdigest()[:12]}"
        
        # Tentativa 1: Cache
        if cache and hasattr(cache, 'get'):
            try:
                cached_result = cache.get(cache_key)
                if cached_result:
                    logger.info(f"[{request_id}] ⚡ Cache hit em task assíncrona")
                    return {
                        'success': True,
                        'answer': cached_result['answer'],
                        'metadata': {
                            **cached_result.get('metadata', {}),
                            'cache_hit': True,
                            'cache_type': 'cache_async',
                            'processing_mode': 'asynchronous'
                        }
                    }
            except Exception as e:
                logger.debug(f"[{request_id}] Cache erro em async: {e}")
        
        # Tentativa 2: Enhanced RAG
        if DEPENDENCIES_AVAILABLE:
            try:
                enhanced_cached = get_enhanced_context(question, personality_id)
                if enhanced_cached and enhanced_cached.get('confidence', 0) > 0.8:
                    logger.info(f"[{request_id}] [START] AstraDB Enhanced RAG hit em async")
                    
                    # Cache para próximas consultas
                    if cache:
                        try:
                            cache.set(cache_key, {
                                'answer': enhanced_cached['response'],
                                'metadata': enhanced_cached.get('metadata', {}),
                                'cached_from': 'astra_to_cache_async'
                            }, ttl=1800)
                        except:
                            pass
                    
                    return {
                        'success': True,
                        'answer': enhanced_cached['response'],
                        'metadata': {
                            **enhanced_cached.get('metadata', {}),
                            'cache_hit': True,
                            'cache_type': 'astradb_enhanced_async',
                            'confidence': enhanced_cached.get('confidence'),
                            'processing_mode': 'asynchronous'
                        }
                    }
            except Exception as e:
                logger.debug(f"[{request_id}] Enhanced RAG erro em async: {e}")
        
        # Atualizar progresso - RAG Context
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'retrieving_context',
                'progress': 30,
                'message': 'Obtendo contexto RAG...',
                'request_id': request_id
            }
        )
        
        # RAG context
        context = ""
        if rag_service:
            try:
                context = rag_service.get_context(question, max_chunks=3)
                logger.info("[%s] RAG context obtido em async: %d chars", sanitize_request_id(request_id), len(context))
            except Exception as e:
                logger.error("[%s] Erro no RAG em async: %s", sanitize_request_id(request_id), sanitize_error(e))
        
        # Atualizar progresso - Prompt Building
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'building_prompt',
                'progress': 45,
                'message': 'Construindo prompt para IA...',
                'request_id': request_id
            }
        )
        
        # Sistema de prompts dinâmico (mesmo do síncrono)
        system_prompt = ""
        try:
            base_prompt = get_persona_prompt(personality_id)
            if base_prompt:
                system_prompt = f"""{base_prompt}

Contexto da base de conhecimento sobre hanseníase e PQT-U:
{context}

Baseie suas respostas nas informações do contexto acima, sempre que relevante."""
                logger.info(f"[{request_id}] Usando sistema dinâmico de personas em async")
            else:
                raise Exception("Prompt não encontrado")
        except Exception as e:
            logger.warning("[%s] Fallback para prompts hardcoded em async: %s", sanitize_request_id(request_id), sanitize_error(e))
            # Fallback para prompts hardcoded
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
                system_prompt = f"""Você é Gá, farmacêutico empático especialista em hanseníase.

Características:
- Linguagem simples e acessível
- Tom caloroso e acolhedor
- Explica termos médicos de forma didática
- Oferece apoio emocional quando apropriado

Contexto da base de conhecimento:
{context}

Responda de forma empática e didática."""
        
        # Atualizar progresso - AI Processing
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'calling_ai',
                'progress': 60,
                'message': 'Processando com IA...',
                'request_id': request_id
            }
        )
        
        # Construir mensagens para IA
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]
        
        # Processar com AI Provider Manager
        answer = None
        metadata = {
            'persona': personality_id,
            'context_length': len(context),
            'cache_hit': False,
            'processing_mode': 'asynchronous'
        }
        
        try:
            # Escolher modelo preferencial baseado na persona
            model_preference = 'llama-3.2-3b' if personality_id == 'dr_gasnelio' else 'kimie-k2'
            
            logger.info(f"[{request_id}] Chamando AI Provider em async com modelo {model_preference}")
            
            # Usar AI Provider existente (assíncrono)
            # CRITICAL FIX: Use get_event_loop() instead of asyncio.run() for celery 5.5.3 compatibility
            # asyncio.run() creates new event loop conflicting with Celery's worker event loop
            loop = asyncio.get_event_loop()
            answer, ai_metadata = loop.run_until_complete(generate_ai_response(
                messages=messages,
                model_preference=model_preference,
                temperature=0.7 if personality_id == 'dr_gasnelio' else 0.8,
                max_tokens=1000
            ))
            
            # Combinar metadados
            metadata.update(ai_metadata)
            
            if answer:
                logger.info(f"[{request_id}] [OK] Resposta obtida via {ai_metadata.get('model_used', 'unknown')} em async")
            else:
                logger.warning("[%s] [WARNING] AI Provider retornou resposta vazia em async", sanitize_request_id(request_id))

        except Exception as e:
            logger.error("[%s] [ERROR] Erro no AI Provider Manager em async: %s", sanitize_request_id(request_id), sanitize_error(e))
        
        # Atualizar progresso - Fallback se necessário
        if not answer:
            self.update_state(
                state='PROGRESS',
                meta={
                    'stage': 'fallback_processing',
                    'progress': 80,
                    'message': 'Usando resposta fallback...',
                    'request_id': request_id
                }
            )
            
            # Fallback (mesmo do síncrono)
            if personality_id == 'dr_gasnelio':
                answer = f"""Dr. Gasnelio responde:

Com base no contexto disponível sobre: {question}

{context[:300] if context else 'Contexto não disponível no momento.'}...

*Sistema em modo de manutenção. Esta é uma resposta básica.*

Para informações completas, consulte um farmacêutico clínico ou acesse o PCDT Hanseníase 2022 do Ministério da Saúde."""
            else:
                answer = f"""Oi! Sou o Gá! 😊

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
            
            logger.info(f"[{request_id}] 🔄 Usando resposta fallback para {personality_id} em async")
        
        # Atualizar progresso - Finalizando
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': 'finalizing',
                'progress': 90,
                'message': 'Finalizando processamento...',
                'request_id': request_id
            }
        )
        
        # SISTEMA DE CACHE INTELIGENTE MULTICAMADA (mesmo do síncrono)
        if answer:
            # Calcular confidence score
            confidence_score = 0.7
            if metadata.get('model_used') and metadata.get('model_used') != 'fallback':
                confidence_score += 0.1
            if len(context) > 200:
                confidence_score += 0.05
            
            confidence_final = max(0.1, min(1.0, confidence_score))
            
            # Cache strategy
            ttl_cache = 1800
            if any(term in question.lower() for term in ['dosagem', 'dose', 'efeito colateral', 'gravidez', 'criança']):
                ttl_cache = 900
            
            # Cache
            if cache and confidence_final > 0.5:
                try:
                    cache_data = {
                        'answer': answer,
                        'metadata': {**metadata, 'confidence': confidence_final, 'cached_at': datetime.now().isoformat()},
                        'cache_version': 'v2_async_optimized'
                    }
                    cache.set(cache_key, cache_data, ttl=ttl_cache)
                    logger.info("[%s] ⚡ Cached em async - TTL:%ds, Confidence:%.2f", sanitize_request_id(request_id), ttl_cache, confidence_final)
                except Exception as e:
                    logger.debug("[%s] Cache write error em async: %s", sanitize_request_id(request_id), sanitize_error(e))
            
            # Enhanced RAG cache
            if confidence_final >= 0.8:
                try:
                    cache_rag_response(question, answer, confidence_final)
                    logger.info("[%s] [START] Cached to AstraDB Enhanced RAG em async - High confidence: %.2f", sanitize_request_id(request_id), confidence_final)
                except Exception as e:
                    logger.debug("[%s] Enhanced RAG cache error em async: %s", sanitize_request_id(request_id), sanitize_error(e))
        
        # Resultado final
        return {
            'success': True,
            'answer': answer,
            'metadata': metadata,
            'request_id': request_id,
            'processing_mode': 'asynchronous'
        }

    except Exception as e:
        logger.error("[%s] Erro crítico na task assíncrona: %s", sanitize_request_id(request_id), sanitize_error(e))
        
        # Atualizar state para erro
        self.update_state(
            state='FAILURE',
            meta={
                'error': str(e),
                'request_id': request_id,
                'stage': 'error',
                'message': 'Erro no processamento assíncrono'
            }
        )
        
        # Retornar erro estruturado
        return {
            'success': False,
            'error': str(e),
            'metadata': {
                'processing_mode': 'asynchronous',
                'error_type': type(e).__name__,
                'request_id': request_id
            }
        }

@celery_app.task(name='chat.health_check')
def chat_health_check():
    """Health check específico para chat tasks"""
    try:
        # Testar dependências
        dependencies_status = {
            'config': False,
            'rag': False,
            'cache': False,
            'ai_provider': False
        }
        
        if DEPENDENCIES_AVAILABLE:
            try:
                config = get_config()
                dependencies_status['config'] = True
            except:
                pass
            
            try:
                rag_service = get_rag()
                dependencies_status['rag'] = rag_service is not None
            except:
                pass
            
            try:
                cache = get_cache()
                dependencies_status['cache'] = cache is not None
            except:
                pass
            
            try:
                ai_health = get_ai_health_status()
                dependencies_status['ai_provider'] = True
            except:
                pass
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'dependencies': dependencies_status,
            'dependencies_available': DEPENDENCIES_AVAILABLE,
            'worker_id': current_task.request.id if current_task else 'unknown'
        }
        
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }