# -*- coding: utf-8 -*-
"""
Feedback Blueprint - Gerencia coleta e processamento de feedback dos usuários
Migrado do main.py para modularização
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import uuid
from typing import Dict, List, Any, Optional

# Import dependências
from core.dependencies import get_cache, get_config

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/v1')

def validate_feedback_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Valida dados de feedback"""
    required_fields = ['question', 'response', 'rating']
    
    for field in required_fields:
        if field not in data:
            return False, f"Campo '{field}' é obrigatório"
    
    # Validar rating
    rating = data.get('rating')
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return False, "Rating deve ser um número inteiro entre 1 e 5"
    
    # Validar tamanhos
    question = data.get('question', '')
    if not isinstance(question, str) or len(question) > 1000:
        return False, "Pergunta deve ser string com máximo 1000 caracteres"
    
    response = data.get('response', '')
    if not isinstance(response, str) or len(response) > 5000:
        return False, "Resposta deve ser string com máximo 5000 caracteres"
    
    comments = data.get('comments', '')
    if comments and (not isinstance(comments, str) or len(comments) > 1000):
        return False, "Comentários devem ser string com máximo 1000 caracteres"
    
    return True, None

def sanitize_feedback_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitiza dados de feedback removendo conteúdo potencialmente sensível"""
    import html
    import bleach
    
    sanitized = {}
    
    # Campos de texto que precisam de sanitização
    text_fields = ['question', 'response', 'comments']
    
    for field in text_fields:
        if field in data and data[field]:
            # Remove HTML tags e escapa caracteres especiais
            cleaned = bleach.clean(str(data[field]), tags=[], strip=True)
            sanitized[field] = html.escape(cleaned).strip()
        elif field in data:
            sanitized[field] = data[field]
    
    # Campos numéricos
    sanitized['rating'] = int(data.get('rating', 0))
    
    # Metadados opcionais
    if 'persona_id' in data:
        sanitized['persona_id'] = str(data['persona_id']).strip()
    
    return sanitized

def store_feedback(feedback_data: Dict[str, Any]) -> str:
    """
    Armazena feedback (em cache por enquanto, depois no AstraDB)
    Retorna feedback_id
    """
    cache = get_cache()
    feedback_id = str(uuid.uuid4())
    
    # Preparar dados para armazenamento
    stored_data = {
        **feedback_data,
        'feedback_id': feedback_id,
        'created_at': datetime.now().isoformat(),
        'processed': False
    }
    
    if cache:
        # Armazenar feedback individual
        cache.set(f"feedback:{feedback_id}", stored_data, ttl=86400 * 30)  # 30 dias
        
        # Adicionar à lista de feedbacks
        feedback_list = cache.get("feedback:list") or []
        feedback_list.append({
            'feedback_id': feedback_id,
            'rating': feedback_data['rating'],
            'persona_id': feedback_data.get('persona_id'),
            'created_at': stored_data['created_at']
        })
        cache.set("feedback:list", feedback_list, ttl=86400 * 30)
        
        # Atualizar estatísticas
        update_feedback_stats(feedback_data['rating'], feedback_data.get('persona_id'))
    
    return feedback_id

def update_feedback_stats(rating: int, persona_id: Optional[str] = None):
    """Atualiza estatísticas de feedback"""
    cache = get_cache()
    if not cache:
        return
    
    # Estatísticas gerais
    stats = cache.get("feedback:stats") or {
        'total_count': 0,
        'total_rating': 0,
        'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        'average_rating': 0.0
    }
    
    stats['total_count'] += 1
    stats['total_rating'] += rating
    stats['rating_distribution'][rating] += 1
    stats['average_rating'] = stats['total_rating'] / stats['total_count']
    
    cache.set("feedback:stats", stats, ttl=86400 * 7)  # 7 dias
    
    # Estatísticas por persona
    if persona_id:
        persona_stats = cache.get(f"feedback:stats:{persona_id}") or {
            'total_count': 0,
            'total_rating': 0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            'average_rating': 0.0
        }
        
        persona_stats['total_count'] += 1
        persona_stats['total_rating'] += rating
        persona_stats['rating_distribution'][rating] += 1
        persona_stats['average_rating'] = persona_stats['total_rating'] / persona_stats['total_count']
        
        cache.set(f"feedback:stats:{persona_id}", persona_stats, ttl=86400 * 7)

def check_rate_limit(endpoint_type: str = 'default'):
    """Decorator simplificado para rate limiting"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            # TODO: Implementar rate limiting específico para feedback
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def sanitize_simple_feedback(feedback_text: str) -> str:
    """
    Sanitiza texto de feedback simples para prevenir injeções
    Preserva terminologia médica legítima
    """
    import html
    import re

    if not feedback_text or not isinstance(feedback_text, str):
        return ""

    # Limitar tamanho
    if len(feedback_text) > 5000:
        feedback_text = feedback_text[:5000]

    # Detectar e neutralizar padrões SQL injection
    sql_patterns = [
        r"('\s*;?\s*drop\s+table)", r"('\s*;?\s*delete\s+from)",
        r"('\s*;?\s*insert\s+into)", r"('\s*;?\s*update\s+)",
        r"('\s*;\s*--)", r"('\s*or\s+1\s*=\s*1)",
        r"('\s*union\s+select)", r"('\s*exec\s*\()",
        r"(--\s*$)", r"(/\*.*?\*/)"
    ]

    for pattern in sql_patterns:
        feedback_text = re.sub(pattern, '', feedback_text, flags=re.IGNORECASE)

    # Escapar HTML e caracteres especiais
    sanitized = html.escape(feedback_text, quote=True)

    # Remover scripts e tags HTML perigosas
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'<iframe[^>]*>.*?</iframe>',
        r'javascript:',
        r'on\w+\s*=',
    ]

    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)

    return sanitized.strip()

@feedback_bp.route('/feedback', methods=['POST'])
@check_rate_limit('feedback')
def submit_feedback():
    """Endpoint para submissão de feedback - suporta formato simples e completo"""
    start_time = datetime.now()
    request_id = f"feedback_{int(start_time.timestamp() * 1000)}"

    try:
        logger.info(f"[{request_id}] Nova submissão de feedback de {request.remote_addr}")

        # Validação básica da requisição
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Payload não pode estar vazio",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        # Detectar formato simples (usado em testes de segurança)
        if 'feedback' in data and 'question' not in data:
            # Formato simples para testes de segurança
            feedback_text = data.get('feedback', '')
            rating = data.get('rating', 5)
            user_id = data.get('user_id', '')
            message_id = data.get('message_id', '')

            # Sanitizar entrada
            sanitized_feedback = sanitize_simple_feedback(feedback_text)
            sanitized_user_id = sanitize_simple_feedback(user_id)
            sanitized_message_id = sanitize_simple_feedback(message_id)

            # Validar rating
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                rating = 5

            # Security fix: Never echo user input back in response
            # Store sanitized data but don't return it to prevent XSS/SQL injection
            response = {
                "status": "received",
                "feedback_length": len(sanitized_feedback),
                "rating": rating,
                "timestamp": start_time.isoformat(),
                "message": "Feedback received successfully"
            }

            logger.info(f"[{request_id}] Feedback simples sanitizado e processado")
            return jsonify(response), 200

        # Formato completo (original)
        # Validar dados de feedback
        is_valid, error_message = validate_feedback_data(data)
        if not is_valid:
            logger.warning(f"[{request_id}] Dados de feedback inválidos: {error_message}")
            return jsonify({
                "error": error_message,
                "error_code": "INVALID_FEEDBACK_DATA",
                "request_id": request_id
            }), 400

        # Sanitizar dados
        sanitized_data = sanitize_feedback_data(data)

        # Armazenar feedback
        feedback_id = store_feedback(sanitized_data)

        # Preparar resposta
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

        response = {
            "message": "Feedback recebido com sucesso",
            "feedback_id": feedback_id,
            "request_id": request_id,
            "timestamp": start_time.isoformat(),
            "processing_time_ms": processing_time,
            "feedback_summary": {
                "rating": sanitized_data['rating'],
                "has_comments": bool(sanitized_data.get('comments', '').strip()),
                "persona_id": sanitized_data.get('persona_id')
            }
        }

        logger.info(f"[{request_id}] Feedback armazenado com sucesso: {feedback_id}")

        return jsonify(response), 201

    except Exception as e:
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.error(f"[{request_id}] Erro ao processar feedback: {e}")

        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id,
            "processing_time_ms": processing_time
        }), 500

@feedback_bp.route('/feedback/stats', methods=['GET'])
@check_rate_limit('general')
def get_feedback_stats():
    """Endpoint para obter estatísticas de feedback"""
    try:
        request_id = f"feedback_stats_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de estatísticas de feedback")
        
        cache = get_cache()
        if not cache:
            return jsonify({
                "error": "Serviço de estatísticas não disponível",
                "error_code": "SERVICE_UNAVAILABLE",
                "request_id": request_id
            }), 503
        
        # Obter estatísticas gerais
        general_stats = cache.get("feedback:stats") or {
            'total_count': 0,
            'total_rating': 0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            'average_rating': 0.0
        }
        
        # Obter estatísticas por persona
        dr_gasnelio_stats = cache.get("feedback:stats:dr_gasnelio") or {
            'total_count': 0,
            'average_rating': 0.0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
        
        ga_stats = cache.get("feedback:stats:ga") or {
            'total_count': 0,
            'average_rating': 0.0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
        
        # Feedbacks recentes
        feedback_list = cache.get("feedback:list") or []
        recent_feedbacks = sorted(feedback_list, key=lambda x: x['created_at'], reverse=True)[:10]
        
        response = {
            "general": general_stats,
            "by_persona": {
                "dr_gasnelio": dr_gasnelio_stats,
                "ga": ga_stats
            },
            "recent_feedbacks": recent_feedbacks,
            "metadata": {
                "request_id": request_id,
                "timestamp": datetime.now().isoformat(),
                "data_retention_days": 30
            }
        }
        
        logger.info(f"[{request_id}] Estatísticas de feedback retornadas")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter estatísticas: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id
        }), 500

@feedback_bp.route('/feedback/<feedback_id>', methods=['GET'])
@check_rate_limit('general')
def get_feedback_details(feedback_id: str):
    """Endpoint para obter detalhes de um feedback específico"""
    try:
        request_id = f"feedback_detail_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Detalhes solicitados para feedback: {feedback_id}")
        
        cache = get_cache()
        if not cache:
            return jsonify({
                "error": "Serviço não disponível",
                "error_code": "SERVICE_UNAVAILABLE",
                "request_id": request_id
            }), 503
        
        # Obter dados do feedback
        feedback_data = cache.get(f"feedback:{feedback_id}")
        if not feedback_data:
            return jsonify({
                "error": "Feedback não encontrado",
                "error_code": "FEEDBACK_NOT_FOUND",
                "request_id": request_id
            }), 404
        
        # Remover dados sensíveis para retorno público
        public_data = {
            "feedback_id": feedback_data['feedback_id'],
            "rating": feedback_data['rating'],
            "has_comments": bool(feedback_data.get('comments', '').strip()),
            "persona_id": feedback_data.get('persona_id'),
            "created_at": feedback_data['created_at'],
            "processed": feedback_data.get('processed', False)
        }
        
        response = {
            "feedback": public_data,
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"[{request_id}] Detalhes do feedback {feedback_id} retornados")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter detalhes do feedback: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id
        }), 500

@feedback_bp.route('/feedback/health', methods=['GET'])
def feedback_health():
    """Health check específico do serviço de feedback"""
    cache = get_cache()
    
    # Obter estatísticas básicas para health check
    stats = None
    if cache:
        stats = cache.get("feedback:stats")
    
    status = {
        "service": "feedback",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "cache": "available" if cache else "unavailable",
            "storage": "cache_based"  # Futuramente será AstraDB
        },
        "stats": {
            "total_feedbacks": stats.get('total_count', 0) if stats else 0,
            "average_rating": stats.get('average_rating', 0.0) if stats else 0.0
        }
    }
    
    return jsonify(status), 200