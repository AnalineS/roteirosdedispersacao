# -*- coding: utf-8 -*-
"""
Blueprint para gerenciamento de cache Redis
Usa REDIS_URL do GitHub Secrets para conexão segura
"""

from flask import Blueprint, request, jsonify, current_app
import redis
import json
import os
import hashlib
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Criar o blueprint
cache_blueprint = Blueprint('cache', __name__, url_prefix='/api/cache')

# Cliente Redis (será inicializado com a aplicação)
redis_client = None

def init_redis_client():
    """Inicializa cliente Redis usando URL dos secrets do GitHub"""
    global redis_client
    
    redis_url = os.environ.get('REDIS_URL')
    if not redis_url:
        logger.warning("REDIS_URL não configurado - cache Redis desabilitado")
        return None
    
    try:
        # Parse da URL do Redis (formato: redis://user:password@host:port/db)
        redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            max_connections=10,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        
        # Testar conexão
        redis_client.ping()
        logger.info("[OK] Redis conectado com sucesso")
        return redis_client
        
    except Exception as e:
        logger.error(f"[ERROR] Erro ao conectar ao Redis: {e}")
        redis_client = None
        return None

@cache_blueprint.before_app_first_request
def initialize():
    """Inicializa o Redis antes da primeira requisição"""
    init_redis_client()

def sanitize_key(key):
    """Sanitiza chave para evitar problemas de segurança"""
    # Remove caracteres perigosos
    safe_key = ''.join(c for c in key if c.isalnum() or c in ['-', '_', ':', '.'])
    # Limita tamanho
    return safe_key[:256]

def get_cache_key(namespace, key):
    """Gera chave completa com namespace"""
    safe_namespace = sanitize_key(namespace)
    safe_key = sanitize_key(key)
    return f"{safe_namespace}:{safe_key}"

@cache_blueprint.route('/get', methods=['POST'])
def get_cache():
    """Busca valor do cache"""
    try:
        if not redis_client:
            return jsonify({
                'success': False,
                'error': 'Cache não disponível'
            }), 503
        
        data = request.get_json()
        key = data.get('key')
        
        if not key:
            return jsonify({
                'success': False,
                'error': 'Chave é obrigatória'
            }), 400
        
        safe_key = sanitize_key(key)
        value = redis_client.get(safe_key)
        
        if value:
            try:
                # Tentar decodificar JSON
                parsed_value = json.loads(value)
            except:
                parsed_value = value
            
            # Incrementar contador de hits
            redis_client.hincrby(f"stats:{safe_key}", "hits", 1)
            
            return jsonify({
                'success': True,
                'data': parsed_value,
                'cached': True
            })
        else:
            # Incrementar contador de misses
            redis_client.hincrby("stats:global", "misses", 1)
            
            return jsonify({
                'success': False,
                'cached': False
            }), 404
            
    except Exception as e:
        logger.error(f"Erro ao buscar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar cache'
        }), 500

@cache_blueprint.route('/set', methods=['POST'])
def set_cache():
    """Define valor no cache"""
    try:
        if not redis_client:
            return jsonify({
                'success': False,
                'error': 'Cache não disponível'
            }), 503
        
        data = request.get_json()
        key = data.get('key')
        value = data.get('value')
        ttl = data.get('ttl', 3600)  # TTL padrão de 1 hora
        
        if not key or value is None:
            return jsonify({
                'success': False,
                'error': 'Chave e valor são obrigatórios'
            }), 400
        
        safe_key = sanitize_key(key)
        
        # Serializar valor se necessário
        if isinstance(value, (dict, list)):
            value_str = json.dumps(value)
        else:
            value_str = str(value)
        
        # Salvar com TTL
        redis_client.setex(safe_key, ttl, value_str)
        
        # Atualizar estatísticas
        redis_client.hincrby("stats:global", "sets", 1)
        redis_client.hset(f"stats:{safe_key}", "last_updated", datetime.now().isoformat())
        
        return jsonify({
            'success': True,
            'key': safe_key,
            'ttl': ttl
        })
        
    except Exception as e:
        logger.error(f"Erro ao definir cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro ao definir cache'
        }), 500

@cache_blueprint.route('/delete', methods=['POST'])
def delete_cache():
    """Remove valor do cache"""
    try:
        if not redis_client:
            return jsonify({
                'success': False,
                'error': 'Cache não disponível'
            }), 503
        
        data = request.get_json()
        key = data.get('key')
        
        if not key:
            return jsonify({
                'success': False,
                'error': 'Chave é obrigatória'
            }), 400
        
        safe_key = sanitize_key(key)
        deleted = redis_client.delete(safe_key)
        
        # Limpar estatísticas relacionadas
        redis_client.delete(f"stats:{safe_key}")
        
        return jsonify({
            'success': True,
            'deleted': deleted > 0
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro ao deletar cache'
        }), 500

@cache_blueprint.route('/clear', methods=['POST'])
def clear_cache():
    """Limpa namespace inteiro do cache"""
    try:
        if not redis_client:
            return jsonify({
                'success': False,
                'error': 'Cache não disponível'
            }), 503
        
        data = request.get_json()
        namespace = data.get('namespace', 'chat')
        
        safe_namespace = sanitize_key(namespace)
        pattern = f"{safe_namespace}:*"
        
        # Buscar todas as chaves do namespace
        keys = redis_client.keys(pattern)
        
        if keys:
            deleted = redis_client.delete(*keys)
        else:
            deleted = 0
        
        return jsonify({
            'success': True,
            'namespace': safe_namespace,
            'deleted': deleted
        })
        
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro ao limpar cache'
        }), 500

@cache_blueprint.route('/stats', methods=['GET'])
def get_stats():
    """Retorna estatísticas do cache"""
    try:
        if not redis_client:
            return jsonify({
                'success': False,
                'error': 'Cache não disponível',
                'stats': {
                    'hits': 0,
                    'misses': 0,
                    'hitRate': 0
                }
            }), 503
        
        # Buscar estatísticas globais
        stats = redis_client.hgetall("stats:global")
        
        hits = int(stats.get('hits', 0))
        misses = int(stats.get('misses', 0))
        sets = int(stats.get('sets', 0))
        
        total = hits + misses
        hit_rate = round((hits / total * 100), 2) if total > 0 else 0
        
        # Informações do servidor Redis
        info = redis_client.info()
        memory_used = info.get('used_memory_human', 'N/A')
        connected_clients = info.get('connected_clients', 0)
        
        return jsonify({
            'success': True,
            'stats': {
                'hits': hits,
                'misses': misses,
                'sets': sets,
                'hitRate': hit_rate,
                'total': total,
                'memoryUsed': memory_used,
                'connectedClients': connected_clients
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar estatísticas',
            'stats': {
                'hits': 0,
                'misses': 0,
                'hitRate': 0
            }
        }), 500

@cache_blueprint.route('/health', methods=['GET'])
def health_check():
    """Verifica saúde do cache Redis"""
    try:
        if not redis_client:
            return jsonify({
                'success': False,
                'status': 'disconnected',
                'message': 'Redis não configurado'
            }), 503
        
        # Testar conexão
        redis_client.ping()
        
        return jsonify({
            'success': True,
            'status': 'connected',
            'message': 'Redis operacional'
        })
        
    except Exception as e:
        logger.error(f"Redis health check falhou: {e}")
        return jsonify({
            'success': False,
            'status': 'error',
            'message': str(e)
        }), 503

# Função auxiliar para cache de respostas de personas
def cache_persona_response(persona_id, query, response, confidence=0.85):
    """Cache específico para respostas de personas"""
    if not redis_client:
        return False
    
    try:
        # Gerar hash da query para chave consistente
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()[:16]
        cache_key = f"persona:{persona_id}:{query_hash}"
        
        cache_data = {
            'response': response,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat(),
            'query_original': query[:100]  # Primeiros 100 chars para debug
        }
        
        # TTL baseado na confiança
        ttl = 7200 if confidence > 0.9 else 3600  # 2h ou 1h
        
        redis_client.setex(
            cache_key,
            ttl,
            json.dumps(cache_data)
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Erro ao cachear resposta de persona: {e}")
        return False

# Função para buscar resposta cacheada
def get_cached_persona_response(persona_id, query):
    """Busca resposta cacheada de persona"""
    if not redis_client:
        return None
    
    try:
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()[:16]
        cache_key = f"persona:{persona_id}:{query_hash}"
        
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        
        return None
        
    except Exception as e:
        logger.error(f"Erro ao buscar cache de persona: {e}")
        return None