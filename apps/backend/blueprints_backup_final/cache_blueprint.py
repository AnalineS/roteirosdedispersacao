# -*- coding: utf-8 -*-
"""
Blueprint para gerenciamento de cache híbrido
Usa cachetools (memory) + Google Cloud Storage como backend
Arquitetura real sem Firebase/Firestore/Redis
"""

from flask import Blueprint, request, jsonify, current_app
import json
import os
import hashlib
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any
from cachetools import TTLCache
import tempfile

# Google Cloud Storage imports
try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

logger = logging.getLogger(__name__)

# Criar o blueprint
cache_blueprint = Blueprint('cache', __name__, url_prefix='/api/cache')

# Cache em memória usando cachetools
memory_cache = TTLCache(maxsize=1000, ttl=3600)  # 1000 itens, 1 hora TTL
gcs_client = None

def init_cache_client():
    """Inicializa cliente Google Cloud Storage com autenticação correta"""
    global gcs_client

    # Import do sistema de desenvolvimento
    try:
        from core.cloud.development_mocks import get_cloud_manager
        from app_config import config

        cloud_manager = get_cloud_manager(config)

        if config.IS_DEVELOPMENT:
            gcs_client = cloud_manager.get_gcs_client()
            logger.info("[DEV] Mock GCS client inicializado")
            return True
    except ImportError:
        pass

    if not GCS_AVAILABLE:
        logger.info("Google Cloud Storage não disponível - usando cache em memória")
        return False

    try:
        # Configuração de autenticação GCS
        import json
        gcp_service_account = os.getenv('GCP_SERVICE_ACCOUNT_KEY')

        if gcp_service_account:
            # Usar service account key do GitHub Secrets
            from google.oauth2 import service_account
            credentials_info = json.loads(gcp_service_account)
            credentials = service_account.Credentials.from_service_account_info(credentials_info)
            gcs_client = storage.Client(credentials=credentials)
            logger.info("GCS autenticado via service account")
        else:
            # Fallback para credenciais padrão (Cloud Run)
            gcs_client = storage.Client()
            logger.info("GCS autenticado via credenciais padrão")

        # Usar bucket configurado no GitHub Variables
        bucket_name = os.getenv('GCS_CACHE_BUCKET', 'red-truck-468923-s4-cache-bucket')
        bucket = gcs_client.bucket(bucket_name)

        # Verificar se bucket existe
        if bucket.exists():
            logger.info(f"Cache GCS conectado ao bucket: {bucket_name}")
            return True
        else:
            logger.warning(f"Bucket GCS não encontrado: {bucket_name}")
            return False

    except Exception as e:
        logger.info(f"GCS não disponível - usando fallback local: {e}")
        return False

def get_cache_key(key: str) -> str:
    """Gera chave hash para cache"""
    return hashlib.md5(key.encode()).hexdigest()

def get_from_memory_cache(key: str) -> Optional[Any]:
    """Buscar no cache em memória"""
    cache_key = get_cache_key(key)
    return memory_cache.get(cache_key)

def set_memory_cache(key: str, value: Any, ttl: int = 3600):
    """Armazenar no cache em memória"""
    cache_key = get_cache_key(key)
    memory_cache[cache_key] = {
        'data': value,
        'timestamp': datetime.utcnow().isoformat(),
        'ttl': ttl
    }

def get_from_gcs_cache(key: str) -> Optional[Any]:
    """Buscar no cache GCS (fallback)"""
    if not gcs_client:
        return None

    try:
        bucket_name = os.getenv('GCS_CACHE_BUCKET', 'red-truck-468923-s4-cache-bucket')
        bucket = gcs_client.bucket(bucket_name)
        blob_name = f"cache/{get_cache_key(key)}.json"
        blob = bucket.blob(blob_name)

        if blob.exists():
            content = blob.download_as_text()
            data = json.loads(content)

            # Verificar TTL
            if 'expires_at' in data:
                expires_at = datetime.fromisoformat(data['expires_at'])
                if datetime.utcnow() > expires_at:
                    # Cache expirado - remover
                    blob.delete()
                    return None

            return data.get('value')
    except Exception as e:
        logger.error(f"Erro ao buscar cache GCS: {e}")
        return None

def set_gcs_cache(key: str, value: Any, ttl: int = 3600):
    """Armazenar no cache GCS"""
    if not gcs_client:
        return False

    try:
        bucket_name = os.getenv('GCS_CACHE_BUCKET', 'red-truck-468923-s4-cache-bucket')
        bucket = gcs_client.bucket(bucket_name)
        blob_name = f"cache/{get_cache_key(key)}.json"
        blob = bucket.blob(blob_name)

        expires_at = datetime.utcnow() + timedelta(seconds=ttl)
        cache_data = {
            'value': value,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': expires_at.isoformat(),
            'ttl': ttl
        }

        blob.upload_from_string(json.dumps(cache_data), content_type='application/json')
        return True
    except Exception as e:
        logger.error(f"Erro ao armazenar cache GCS: {e}")
        return False

@cache_blueprint.route('/health', methods=['GET'])
def health_check():
    """Health check do sistema de cache"""
    try:
        # Testar cache em memória
        test_key = "health_check_test"
        test_value = {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

        set_memory_cache(test_key, test_value, ttl=60)
        cached_value = get_from_memory_cache(test_key)

        memory_status = "ok" if cached_value else "error"

        # Testar GCS se disponível
        gcs_status = "disabled"
        if gcs_client:
            gcs_test = set_gcs_cache(test_key, test_value, ttl=60)
            gcs_status = "ok" if gcs_test else "error"

        return jsonify({
            "status": "healthy",
            "cache_systems": {
                "memory": memory_status,
                "gcs": gcs_status
            },
            "memory_cache_size": len(memory_cache),
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Health check falhou: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@cache_blueprint.route('/get/<key>', methods=['GET'])
def get_cache(key: str):
    """Buscar valor no cache (memory first, GCS fallback)"""
    try:
        # Tentar cache em memória primeiro
        value = get_from_memory_cache(key)
        if value:
            return jsonify({
                "found": True,
                "value": value['data'],
                "source": "memory",
                "timestamp": value['timestamp']
            })

        # Fallback para GCS
        value = get_from_gcs_cache(key)
        if value:
            # Repovoar cache em memória
            set_memory_cache(key, value)
            return jsonify({
                "found": True,
                "value": value,
                "source": "gcs",
                "timestamp": datetime.utcnow().isoformat()
            })

        return jsonify({"found": False}), 404

    except Exception as e:
        logger.error(f"Erro ao buscar cache {key}: {e}")
        return jsonify({"error": str(e)}), 500

@cache_blueprint.route('/set', methods=['POST'])
def set_cache():
    """Armazenar valor no cache"""
    try:
        data = request.get_json()
        key = data.get('key')
        value = data.get('value')
        ttl = data.get('ttl', 3600)  # Default 1 hora

        if not key or value is None:
            return jsonify({"error": "key e value são obrigatórios"}), 400

        # Armazenar em memória
        set_memory_cache(key, value, ttl)

        # Armazenar em GCS se disponível
        gcs_stored = set_gcs_cache(key, value, ttl) if gcs_client else False

        return jsonify({
            "stored": True,
            "key": key,
            "ttl": ttl,
            "storage": {
                "memory": True,
                "gcs": gcs_stored
            },
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Erro ao armazenar cache: {e}")
        return jsonify({"error": str(e)}), 500

@cache_blueprint.route('/clear', methods=['POST'])
def clear_cache():
    """Limpar cache (memory + GCS)"""
    try:
        # Limpar cache em memória
        memory_cache.clear()

        # Limpar cache GCS se disponível
        gcs_cleared = False
        if gcs_client:
            try:
                bucket_name = os.getenv('GCS_CACHE_BUCKET', 'red-truck-468923-s4-cache-bucket')
                bucket = gcs_client.bucket(bucket_name)

                # Listar e deletar todos os blobs de cache
                blobs = bucket.list_blobs(prefix="cache/")
                deleted_count = 0
                for blob in blobs:
                    blob.delete()
                    deleted_count += 1

                gcs_cleared = True
                logger.info(f"Deletados {deleted_count} itens do cache GCS")
            except Exception as e:
                logger.error(f"Erro ao limpar cache GCS: {e}")

        return jsonify({
            "cleared": True,
            "storage": {
                "memory": True,
                "gcs": gcs_cleared
            },
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        return jsonify({"error": str(e)}), 500

# Inicializar cliente na importação
init_cache_client()