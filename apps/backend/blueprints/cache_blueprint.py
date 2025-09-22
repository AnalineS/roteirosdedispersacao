# -*- coding: utf-8 -*-
"""
Blueprint para gerenciamento de cache Firestore
Substitui Redis usando Google Cloud Firestore como backend de cache
Mantém compatibilidade com API anterior para transição suave
"""

from flask import Blueprint, request, jsonify, current_app
import json
import os
import hashlib
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any

# Firestore imports
try:
    from google.cloud import firestore
    from google.cloud.firestore import Client as FirestoreClient
    from google.oauth2 import service_account
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    FirestoreClient = None

logger = logging.getLogger(__name__)

# Criar o blueprint
cache_blueprint = Blueprint('cache', __name__, url_prefix='/api/cache')

# Cliente Firestore (será inicializado com a aplicação)
firestore_client: Optional[FirestoreClient] = None

# Configurações do cache
CACHE_CONFIG = {
    'COLLECTION_NAME': 'backend_cache',
    'DEFAULT_TTL_SECONDS': 3600,  # 1 hora padrão
    'MAX_KEY_LENGTH': 256,
    'STATS_COLLECTION': 'cache_stats',
    'CLEANUP_BATCH_SIZE': 500,
}

def init_firestore_client():
    """Inicializa cliente Firestore usando credenciais do ambiente"""
    global firestore_client
    
    if not FIRESTORE_AVAILABLE:
        logger.warning("Firestore não disponível - cache desabilitado")
        return None
    
    try:
        # Tentar credenciais do arquivo de serviço primeiro
        service_account_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if service_account_path and os.path.exists(service_account_path):
            credentials = service_account.Credentials.from_service_account_file(service_account_path)
            firestore_client = firestore.Client(credentials=credentials)
        else:
            # Usar Application Default Credentials (para Cloud Run)
            firestore_client = firestore.Client()
        
        # Testar conexão com uma operação simples
        test_doc = firestore_client.collection('_test').document('health_check')
        test_doc.set({'timestamp': firestore.SERVER_TIMESTAMP, 'status': 'healthy'})
        
        logger.info("[OK] Firestore Cache conectado com sucesso")
        return firestore_client
        
    except Exception as e:
        logger.error(f"[ERROR] Erro ao conectar ao Firestore: {e}")
        firestore_client = None
        return None

@cache_blueprint.before_app_first_request
def initialize():
    """Inicializa o Firestore antes da primeira requisição"""
    init_firestore_client()

def sanitize_key(key: str) -> str:
    """Sanitiza chave para Firestore document ID"""
    if not key:
        return 'empty_key'
    
    # Firestore document IDs não podem conter certos caracteres
    # Substituir caracteres problemáticos por underscore
    safe_chars = []
    for char in key:
        if char.isalnum() or char in ['-', '_', '.']:
            safe_chars.append(char)
        else:
            safe_chars.append('_')
    
    safe_key = ''.join(safe_chars)
    
    # Limitar tamanho (Firestore tem limite de 1500 bytes para document ID)
    if len(safe_key) > CACHE_CONFIG['MAX_KEY_LENGTH']:
        # Usar hash para chaves muito longas
        key_hash = hashlib.sha256(key.encode()).hexdigest()[:32]
        safe_key = f"{safe_key[:100]}_{key_hash}"
    
    return safe_key

def get_cache_document(key: str) -> Optional[Dict[str, Any]]:
    """Busca documento do cache no Firestore"""
    if not firestore_client:
        return None
    
    try:
        safe_key = sanitize_key(key)
        doc_ref = firestore_client.collection(CACHE_CONFIG['COLLECTION_NAME']).document(safe_key)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            
            # Verificar expiração
            if 'expires_at' in data:
                if datetime.now() > data['expires_at'].replace(tzinfo=None):
                    # Documento expirado, deletar
                    doc_ref.delete()
                    return None
            
            return data
        
        return None
        
    except Exception as e:
        logger.error(f"Erro ao buscar documento do cache: {e}")
        return None

def set_cache_document(key: str, value: Any, ttl_seconds: int = None) -> bool:
    """Define documento no cache do Firestore"""
    if not firestore_client:
        return False
    
    try:
        safe_key = sanitize_key(key)
        ttl = ttl_seconds or CACHE_CONFIG['DEFAULT_TTL_SECONDS']
        
        expires_at = datetime.now() + timedelta(seconds=ttl)
        
        doc_data = {
            'key': key,
            'value': value,
            'created_at': firestore.SERVER_TIMESTAMP,
            'expires_at': expires_at,
            'ttl_seconds': ttl,
            'version': '1.0.0'
        }
        
        doc_ref = firestore_client.collection(CACHE_CONFIG['COLLECTION_NAME']).document(safe_key)
        doc_ref.set(doc_data)
        
        # Atualizar estatísticas
        update_stats('sets', 1)
        
        return True
        
    except Exception as e:
        logger.error(f"Erro ao definir documento do cache: {e}")
        return False

def update_stats(stat_type: str, increment: int = 1):
    """Atualiza estatísticas do cache"""
    if not firestore_client:
        return
    
    try:
        stats_ref = firestore_client.collection(CACHE_CONFIG['STATS_COLLECTION']).document('global')
        stats_ref.set({
            stat_type: firestore.Increment(increment),
            'last_updated': firestore.SERVER_TIMESTAMP
        }, merge=True)
    except Exception as e:
        logger.warning(f"Erro ao atualizar estatísticas: {e}")

@cache_blueprint.route('/get', methods=['POST'])
def get_cache():
    """Busca valor do cache Firestore"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'error': 'Cache Firestore não disponível'
            }), 503
        
        data = request.get_json()
        key = data.get('key')
        
        if not key:
            return jsonify({
                'success': False,
                'error': 'Chave é obrigatória'
            }), 400
        
        cached_doc = get_cache_document(key)
        
        if cached_doc and 'value' in cached_doc:
            update_stats('hits', 1)
            
            return jsonify({
                'success': True,
                'data': cached_doc['value'],
                'cached': True,
                'created_at': cached_doc.get('created_at', {}).get('seconds', 0) * 1000 if cached_doc.get('created_at') else None
            })
        else:
            update_stats('misses', 1)
            
            return jsonify({
                'success': False,
                'cached': False
            }), 404
            
    except Exception as e:
        logger.error(f"Erro ao buscar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao buscar cache'
        }), 500

@cache_blueprint.route('/set', methods=['POST'])
def set_cache():
    """Define valor no cache Firestore"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'error': 'Cache Firestore não disponível'
            }), 503
        
        data = request.get_json()
        key = data.get('key')
        value = data.get('value')
        ttl = data.get('ttl', CACHE_CONFIG['DEFAULT_TTL_SECONDS'])
        
        if not key or value is None:
            return jsonify({
                'success': False,
                'error': 'Chave e valor são obrigatórios'
            }), 400
        
        # Validar TTL
        if ttl <= 0 or ttl > 604800:  # Máximo 1 semana
            ttl = CACHE_CONFIG['DEFAULT_TTL_SECONDS']
        
        success = set_cache_document(key, value, ttl)
        
        if success:
            return jsonify({
                'success': True,
                'key': sanitize_key(key),
                'ttl': ttl,
                'expires_in': ttl
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Falha ao salvar no cache'
            }), 500
        
    except Exception as e:
        logger.error(f"Erro ao definir cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao definir cache'
        }), 500

@cache_blueprint.route('/delete', methods=['POST'])
def delete_cache():
    """Remove valor do cache Firestore"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'error': 'Cache Firestore não disponível'
            }), 503
        
        data = request.get_json()
        key = data.get('key')
        
        if not key:
            return jsonify({
                'success': False,
                'error': 'Chave é obrigatória'
            }), 400
        
        safe_key = sanitize_key(key)
        doc_ref = firestore_client.collection(CACHE_CONFIG['COLLECTION_NAME']).document(safe_key)
        
        # Verificar se documento existe antes de deletar
        doc = doc_ref.get()
        deleted = doc.exists
        
        if deleted:
            doc_ref.delete()
            update_stats('deletes', 1)
        
        return jsonify({
            'success': True,
            'deleted': deleted
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao deletar cache'
        }), 500

@cache_blueprint.route('/clear', methods=['POST'])
def clear_cache():
    """Limpa namespace inteiro do cache Firestore"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'error': 'Cache Firestore não disponível'
            }), 503
        
        data = request.get_json()
        namespace = data.get('namespace', 'default')
        
        # Para agora, limpar toda a coleção (namespace implementation futura)
        collection_ref = firestore_client.collection(CACHE_CONFIG['COLLECTION_NAME'])
        
        # Deletar em lotes para performance
        batch = firestore_client.batch()
        deleted_count = 0
        
        # Buscar todos os documentos (em lotes de até 500)
        docs = collection_ref.limit(CACHE_CONFIG['CLEANUP_BATCH_SIZE']).stream()
        
        for doc in docs:
            batch.delete(doc.reference)
            deleted_count += 1
        
        batch.commit()
        
        # Atualizar estatísticas
        update_stats('clears', 1)
        update_stats('bulk_deletes', deleted_count)
        
        return jsonify({
            'success': True,
            'namespace': namespace,
            'deleted': deleted_count,
            'note': 'Implementação completa de namespaces será adicionada futuramente'
        })
        
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao limpar cache'
        }), 500

@cache_blueprint.route('/stats', methods=['GET'])
def get_stats():
    """Retorna estatísticas do cache Firestore"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'error': 'Cache Firestore não disponível',
                'stats': {
                    'hits': 0,
                    'misses': 0,
                    'hitRate': 0
                }
            }), 503
        
        # Buscar estatísticas globais
        stats_ref = firestore_client.collection(CACHE_CONFIG['STATS_COLLECTION']).document('global')
        stats_doc = stats_ref.get()
        
        if stats_doc.exists:
            stats_data = stats_doc.to_dict()
            hits = stats_data.get('hits', 0)
            misses = stats_data.get('misses', 0)
            sets = stats_data.get('sets', 0)
            deletes = stats_data.get('deletes', 0)
            clears = stats_data.get('clears', 0)
        else:
            hits = misses = sets = deletes = clears = 0
        
        total_requests = hits + misses
        hit_rate = round((hits / total_requests * 100), 2) if total_requests > 0 else 0
        
        # Contar documentos na coleção (estimativa)
        try:
            # Esta é uma operação custosa, fazer apenas periodicamente
            collection_ref = firestore_client.collection(CACHE_CONFIG['COLLECTION_NAME'])
            docs_sample = list(collection_ref.limit(10).stream())
            estimated_docs = len(docs_sample) * 10  # Estimativa grosseira
        except:
            estimated_docs = 0
        
        return jsonify({
            'success': True,
            'stats': {
                'hits': hits,
                'misses': misses,
                'sets': sets,
                'deletes': deletes,
                'clears': clears,
                'hitRate': hit_rate,
                'totalRequests': total_requests,
                'estimatedDocuments': estimated_docs,
                'backend': 'firestore',
                'collection': CACHE_CONFIG['COLLECTION_NAME']
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao buscar estatísticas',
            'stats': {
                'hits': 0,
                'misses': 0,
                'hitRate': 0
            }
        }), 500

@cache_blueprint.route('/health', methods=['GET'])
def health_check():
    """Verifica saúde do cache Firestore"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'status': 'disconnected',
                'message': 'Firestore não configurado',
                'backend': 'firestore'
            }), 503
        
        # Testar conexão com operação simples
        test_ref = firestore_client.collection('_health_check').document('test')
        test_ref.set({
            'timestamp': firestore.SERVER_TIMESTAMP,
            'status': 'healthy'
        })
        
        # Tentar ler o documento
        test_doc = test_ref.get()
        if test_doc.exists:
            test_ref.delete()  # Limpar teste
            
            return jsonify({
                'success': True,
                'status': 'connected',
                'message': 'Firestore cache operacional',
                'backend': 'firestore',
                'collection': CACHE_CONFIG['COLLECTION_NAME']
            })
        else:
            return jsonify({
                'success': False,
                'status': 'error',
                'message': 'Falha no teste de leitura/escrita',
                'backend': 'firestore'
            }), 503
        
    except Exception as e:
        logger.error(f"Firestore health check falhou: {e}")
        return jsonify({
            'success': False,
            'status': 'error',
            'message': f'Erro na verificação: {str(e)[:100]}',
            'backend': 'firestore'
        }), 503

# Função auxiliar para cache de respostas de personas (compatibilidade)
def cache_persona_response(persona_id: str, query: str, response: Any, confidence: float = 0.85) -> bool:
    """Cache específico para respostas de personas usando Firestore"""
    if not firestore_client:
        return False
    
    try:
        # Gerar hash da query para chave consistente
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()[:16]
        cache_key = f"persona:{persona_id}:{query_hash}"
        
        cache_data = {
            'response': response,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat(),
            'persona_id': persona_id,
            'query_preview': query[:100]  # Primeiros 100 chars para debug
        }
        
        # TTL baseado na confiança (horas)
        ttl_hours = 2 if confidence > 0.9 else 1
        ttl_seconds = ttl_hours * 3600
        
        return set_cache_document(cache_key, cache_data, ttl_seconds)
        
    except Exception as e:
        logger.error(f"Erro ao cachear resposta de persona: {e}")
        return False

# Função para buscar resposta cacheada
def get_cached_persona_response(persona_id: str, query: str) -> Optional[Dict[str, Any]]:
    """Busca resposta cacheada de persona usando Firestore"""
    if not firestore_client:
        return None
    
    try:
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()[:16]
        cache_key = f"persona:{persona_id}:{query_hash}"
        
        cached_doc = get_cache_document(cache_key)
        if cached_doc and 'value' in cached_doc:
            return cached_doc['value']
        
        return None
        
    except Exception as e:
        logger.error(f"Erro ao buscar cache de persona: {e}")
        return None

# Função de limpeza automática de documentos expirados
@cache_blueprint.route('/cleanup', methods=['POST'])
def cleanup_expired():
    """Remove documentos expirados do cache"""
    try:
        if not firestore_client:
            return jsonify({
                'success': False,
                'error': 'Cache Firestore não disponível'
            }), 503
        
        collection_ref = firestore_client.collection(CACHE_CONFIG['COLLECTION_NAME'])
        current_time = datetime.now()
        
        # Buscar documentos expirados
        expired_query = collection_ref.where('expires_at', '<', current_time)
        expired_docs = expired_query.limit(CACHE_CONFIG['CLEANUP_BATCH_SIZE']).stream()
        
        batch = firestore_client.batch()
        cleaned_count = 0
        
        for doc in expired_docs:
            batch.delete(doc.reference)
            cleaned_count += 1
        
        if cleaned_count > 0:
            batch.commit()
            update_stats('cleanups', 1)
            update_stats('expired_deletes', cleaned_count)
        
        return jsonify({
            'success': True,
            'cleaned': cleaned_count,
            'message': f'Removidos {cleaned_count} documentos expirados'
        })
        
    except Exception as e:
        logger.error(f"Erro na limpeza: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno na limpeza'
        }), 500