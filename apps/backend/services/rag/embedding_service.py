# -*- coding: utf-8 -*-
"""
Embedding Service - Sistema de embeddings para RAG semântico (LAZY LOADING)
Suporte para modelos multilíngues otimizados para português médico
Implementa lazy loading para evitar timeout em Cloud Run
Compatível com sentence-transformers v5.1+ - novas funcionalidades de performance
"""

import os
import json
import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any, Union
from datetime import datetime, timedelta
from pathlib import Path
import threading

# Import apenas bibliotecas leves na inicialização
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

logger = logging.getLogger(__name__)

# Cache global de disponibilidade para evitar re-imports
_AVAILABILITY_CACHE = {
    'sentence_transformers': None,  # None = não testado, True/False = resultado
    'torch': None,
    'numpy': NUMPY_AVAILABLE
}
_CACHE_LOCK = threading.Lock()

def _test_sentence_transformers() -> bool:
    """
    Testa disponibilidade do sentence_transformers de forma lazy
    Retorna True se disponível, False caso contrário
    """
    global _AVAILABILITY_CACHE
    
    with _CACHE_LOCK:
        # Se já testamos, retorna cache
        if _AVAILABILITY_CACHE['sentence_transformers'] is not None:
            return _AVAILABILITY_CACHE['sentence_transformers']
        
        try:
            # Lazy import - só quando realmente necessário
            from sentence_transformers import SentenceTransformer
            import torch
            
            # Teste básico de funcionalidade
            _ = SentenceTransformer
            _ = torch.tensor([1.0])
            
            _AVAILABILITY_CACHE['sentence_transformers'] = True
            _AVAILABILITY_CACHE['torch'] = True
            logger.info("[OK] sentence_transformers disponível (lazy loaded)")
            return True
            
        except ImportError as e:
            _AVAILABILITY_CACHE['sentence_transformers'] = False
            _AVAILABILITY_CACHE['torch'] = False
            logger.warning(f"[ERROR] sentence_transformers indisponível: {e}")
            return False
        except Exception as e:
            _AVAILABILITY_CACHE['sentence_transformers'] = False
            logger.error(f"[ERROR] Erro ao testar sentence_transformers: {e}")
            return False

def _lazy_import_sentence_transformers():
    """Import lazy do SentenceTransformer quando necessário"""
    if not _test_sentence_transformers():
        raise ImportError("sentence_transformers não disponível")
    
    from sentence_transformers import SentenceTransformer
    import torch
    return SentenceTransformer, torch

logger = logging.getLogger(__name__)

class EmbeddingCache:
    """Cache persistente para embeddings"""
    
    def __init__(self, cache_dir: str, max_size: int = 1000):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_size = max_size
        self.cache_file = self.cache_dir / "embedding_cache.pkl"
        self.metadata_file = self.cache_dir / "cache_metadata.pkl"
        
        self._cache: Dict[str, np.ndarray] = {}
        self._metadata: Dict[str, Dict] = {}
        
        self._load_cache()
    
    def _get_hash(self, text: str, model_name: str) -> str:
        """Gera hash único para texto + modelo"""
        content = f"{model_name}:{text}"
        # SHA-256 for cache keys (not sensitive data)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _load_cache(self):
        """Carrega cache do disco de forma segura usando JSON"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    # Converter listas de volta para numpy arrays se disponível
                    if NUMPY_AVAILABLE:
                        self._cache = {k: np.array(v) for k, v in cache_data.items()}
                    else:
                        self._cache = cache_data
                    
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    self._metadata = json.load(f)
                    
            logger.info(f"Cache carregado: {len(self._cache)} embeddings")
        except Exception as e:
            logger.warning(f"Erro ao carregar cache de embeddings: {e}")
            self._cache = {}
            self._metadata = {}
    
    def _save_cache(self):
        """Salva cache no disco de forma segura usando JSON"""
        try:
            # Converter numpy arrays para listas para serialização JSON
            cache_for_json = {}
            for k, v in self._cache.items():
                if NUMPY_AVAILABLE and isinstance(v, np.ndarray):
                    cache_for_json[k] = v.tolist()
                else:
                    cache_for_json[k] = v
                    
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_for_json, f, ensure_ascii=False, indent=2)
                
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self._metadata, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Erro ao salvar cache de embeddings: {e}")
    
    def get(self, text: str, model_name: str) -> Optional[np.ndarray]:
        """Obtém embedding do cache"""
        hash_key = self._get_hash(text, model_name)
        
        if hash_key in self._cache:
            # Atualizar timestamp de acesso
            self._metadata[hash_key]['last_accessed'] = datetime.now()
            return self._cache[hash_key]
        
        return None
    
    def set(self, text: str, model_name: str, embedding: np.ndarray):
        """Armazena embedding no cache"""
        hash_key = self._get_hash(text, model_name)
        
        # Gerenciar tamanho do cache
        if len(self._cache) >= self.max_size:
            self._evict_oldest()
        
        self._cache[hash_key] = embedding
        self._metadata[hash_key] = {
            'text_length': len(text),
            'model_name': model_name,
            'created_at': datetime.now(),
            'last_accessed': datetime.now()
        }
        
        # Salvar periodicamente
        if len(self._cache) % 100 == 0:
            self._save_cache()
    
    def _evict_oldest(self):
        """Remove embeddings mais antigos"""
        if not self._metadata:
            return
        
        # Ordenar por último acesso
        sorted_keys = sorted(
            self._metadata.keys(),
            key=lambda k: self._metadata[k]['last_accessed']
        )
        
        # Remover 10% mais antigos
        to_remove = max(1, len(sorted_keys) // 10)
        
        for key in sorted_keys[:to_remove]:
            self._cache.pop(key, None)
            self._metadata.pop(key, None)
        
        logger.info(f"Cache eviction: removidos {to_remove} embeddings antigos")
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas do cache"""
        return {
            'total_embeddings': len(self._cache),
            'cache_size_mb': len(json.dumps(self._cache, default=str)) / (1024 * 1024),
            'oldest_entry': min(
                (meta['created_at'] for meta in self._metadata.values()),
                default=None
            ),
            'cache_hit_potential': len(self._cache) / max(self.max_size, 1) * 100
        }

class EmbeddingService:
    """
    Serviço de embeddings com suporte a modelos multilíngues (LAZY LOADING)
    Otimizado para conteúdo médico em português
    Não carrega modelos ML na inicialização para evitar timeout
    """
    
    def __init__(self, config):
        self.config = config
        self.model = None  # Será carregado lazy
        self.model_name = getattr(config, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
        self.device = getattr(config, 'EMBEDDING_DEVICE', 'cpu')
        
        # Cache só se numpy disponível
        if NUMPY_AVAILABLE:
            cache_path = getattr(config, 'VECTOR_DB_PATH', './cache/embeddings')
            cache_size = getattr(config, 'EMBEDDING_CACHE_SIZE', 1000)
            self.cache = EmbeddingCache(cache_path, cache_size)
        else:
            self.cache = None
            logger.warning("[WARNING] NumPy indisponível - cache de embeddings desabilitado")
        
        # Métricas
        self.stats = {
            'embeddings_created': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'model_load_time': 0.0,
            'avg_embedding_time': 0.0,
            'lazy_loads': 0,
            'availability_checks': 0
        }
        
        # Estado de lazy loading
        self._model_loaded = False
        self._load_attempted = False
        self._load_failed = False
        
        logger.info("[OK] EmbeddingService inicializado com lazy loading")
    
    def _load_model(self) -> bool:
        """
        Carrega modelo de embeddings com lazy loading robusto
        Usa cache de disponibilidade para evitar múltiplas tentativas
        """
        # Se já carregou ou já tentou e falhou, retorna resultado cached
        if self._model_loaded:
            return True
        if self._load_failed:
            return False
            
        # Se já tentou carregar e não conseguiu, não tenta novamente
        if self._load_attempted:
            return self._model_loaded
            
        self._load_attempted = True
        self.stats['lazy_loads'] += 1
        
        # Verificar se embeddings estão habilitados por config
        embeddings_enabled = getattr(self.config, 'EMBEDDINGS_ENABLED', False)
        if not embeddings_enabled:
            logger.info("[WARNING] Embeddings desabilitados por configuração")
            self._load_failed = True
            return False
        
        # Verificar disponibilidade lazy das bibliotecas
        if not _test_sentence_transformers():
            logger.warning("[WARNING] sentence_transformers não disponível para lazy loading")
            self._load_failed = True
            return False
        
        try:
            start_time = datetime.now()
            
            # Fazer import lazy
            SentenceTransformer, torch = _lazy_import_sentence_transformers()
            
            logger.info(f"🧠 Carregando modelo de embeddings: {self.model_name}")
            
            # Configurar device adequado
            device = self.device
            if device == 'auto':
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
            
            # Carregar modelo
            self.model = SentenceTransformer(
                self.model_name,
                device=device
            )
            
            # Configurar modelo para melhor performance
            if hasattr(self.model, 'max_seq_length'):
                max_length = getattr(self.config, 'EMBEDDINGS_MAX_LENGTH', 512)
                self.model.max_seq_length = max_length
            
            load_time = (datetime.now() - start_time).total_seconds()
            self.stats['model_load_time'] = load_time
            
            self._model_loaded = True
            
            logger.info(f"[OK] Modelo de embeddings carregado em {load_time:.2f}s - Device: {device}")
            
            return True
            
        except Exception as e:
            logger.error(f"[ERROR] Erro ao carregar modelo de embeddings: {e}")
            self._load_failed = True
            return False
    
    def is_available(self) -> bool:
        """
        Verifica se o serviço está disponível (com lazy check)
        Não carrega modelo pesado, apenas verifica disponibilidade
        """
        self.stats['availability_checks'] += 1
        
        # Verificar configuração
        embeddings_enabled = getattr(self.config, 'EMBEDDINGS_ENABLED', False)
        if not embeddings_enabled:
            return False
        
        # Verificar se já tentou carregar e falhou
        if self._load_failed:
            return False
            
        # Se já carregado, está disponível
        if self._model_loaded:
            return True
        
        # Fazer apenas teste leve de disponibilidade
        # Não carrega modelo ainda - será carregado quando necessário
        return _test_sentence_transformers()
    
    def embed_text(self, text: str) -> Optional[Union[list, 'np.ndarray']]:
        """
        Gera embedding para um texto (com lazy loading)
        
        Args:
            text: Texto para embedding
            
        Returns:
            Array numpy com embedding, lista Python, ou None se falhar
        """
        if not text or not text.strip():
            return None
        
        text = text.strip()
        
        # Tentar cache primeiro (se disponível)
        if self.cache and NUMPY_AVAILABLE:
            cached_embedding = self.cache.get(text, self.model_name)
            if cached_embedding is not None:
                self.stats['cache_hits'] += 1
                return cached_embedding
        
        self.stats['cache_misses'] += 1
        
        # Carregar modelo com lazy loading
        if not self._load_model():
            logger.debug(f"[ERROR] Modelo não disponível para embedding: {text[:50]}...")
            return None
        
        try:
            start_time = datetime.now()
            
            # Limitar tamanho do texto
            max_length = getattr(self.config, 'EMBEDDINGS_MAX_LENGTH', 512) * 4
            if len(text) > max_length:
                text = text[:max_length]
                logger.debug(f"[NOTE] Texto truncado para {max_length} caracteres")
            
            # Gerar embedding - usando funcionalidades v5.1+
            # Detectar contexto para otimizações (query vs document)
            context_type = getattr(self.config, 'EMBEDDING_CONTEXT_TYPE', 'auto')
            
            encode_params = {
                'convert_to_numpy': NUMPY_AVAILABLE,
                'normalize_embeddings': True,  # Importante para similaridade coseno
                'batch_size': 1
            }
            
            # Sentence-transformers v5.1+ - usar encode com otimizações
            # Suporte para parallel processing com multiple devices se disponível
            if hasattr(self.model, 'encode') and hasattr(self.model, '_modules'):
                # Verificar se temos GPU disponível para parallel processing
                if self.device != 'cpu' and hasattr(self.model, 'device'):
                    encode_params['device'] = self.device
                
                # Para v5.1+: usar chunk_size para melhor performance em textos longos
                if len(text) > 256:
                    encode_params['chunk_size'] = getattr(self.config, 'EMBEDDING_CHUNK_SIZE', 32)
            
            embedding = self.model.encode(text, **encode_params)
            
            embedding_time = (datetime.now() - start_time).total_seconds()
            
            # Atualizar estatísticas
            self.stats['embeddings_created'] += 1
            self.stats['avg_embedding_time'] = (
                (self.stats['avg_embedding_time'] * (self.stats['embeddings_created'] - 1) + embedding_time) /
                self.stats['embeddings_created']
            )
            
            # Salvar no cache (se disponível e numpy disponível)
            if self.cache and NUMPY_AVAILABLE and hasattr(embedding, 'shape'):
                try:
                    self.cache.set(text, self.model_name, embedding)
                except Exception as cache_error:
                    logger.warning(f"Erro ao salvar embedding no cache: {cache_error}")
            
            # Log dependendo do tipo de embedding retornado
            if hasattr(embedding, 'shape'):
                logger.debug(f"[OK] Embedding gerado: {embedding.shape} em {embedding_time:.3f}s")
            else:
                logger.debug(f"[OK] Embedding gerado: {len(embedding)} dims em {embedding_time:.3f}s")
            
            return embedding
            
        except Exception as e:
            logger.error(f"[ERROR] Erro ao gerar embedding para '{text[:50]}...': {e}")
            return None
    
    def embed_batch(self, texts: List[str], batch_size: Optional[int] = None) -> List[Optional[np.ndarray]]:
        """
        Gera embeddings para múltiplos textos em lote
        
        Args:
            texts: Lista de textos
            batch_size: Tamanho do lote (padrão: configuração)
            
        Returns:
            Lista de embeddings (pode conter None para falhas)
        """
        if not texts:
            return []
        
        if not self._load_model():
            return [None] * len(texts)
        
        batch_size = batch_size or self.config.EMBEDDING_BATCH_SIZE
        embeddings = []
        
        # Processar em lotes
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            
            # Verificar cache primeiro
            batch_embeddings = []
            texts_to_embed = []
            indices_to_embed = []
            
            for j, text in enumerate(batch_texts):
                if not text or not text.strip():
                    batch_embeddings.append(None)
                    continue
                
                text = text.strip()
                cached = self.cache.get(text, self.model_name)
                
                if cached is not None:
                    batch_embeddings.append(cached)
                    self.stats['cache_hits'] += 1
                else:
                    batch_embeddings.append(None)  # Placeholder
                    texts_to_embed.append(text)
                    indices_to_embed.append(j)
                    self.stats['cache_misses'] += 1
            
            # Embeddings em lote para textos não cacheados
            if texts_to_embed:
                try:
                    start_time = datetime.now()
                    
                    # Limitar tamanho dos textos
                    processed_texts = []
                    for text in texts_to_embed:
                        if len(text) > self.config.EMBEDDINGS_MAX_LENGTH * 4:
                            text = text[:self.config.EMBEDDINGS_MAX_LENGTH * 4]
                        processed_texts.append(text)
                    
                    # Sentence-transformers v5.1+ - Parallel batch processing otimizado
                    encode_params = {
                        'convert_to_numpy': True,
                        'normalize_embeddings': True,
                        'batch_size': batch_size
                    }
                    
                    # v5.1+ otimizações para lotes grandes
                    if len(processed_texts) > 10:
                        # Usar parallel processing se disponível (múltiplas GPUs/dispositivos)
                        if self.device != 'cpu' and hasattr(self.model, 'pool'):
                            encode_params['pool'] = True  # Ativar pooling paralelo
                        
                        # Chunk size otimizado para lotes
                        encode_params['chunk_size'] = min(batch_size, 64)
                    
                    new_embeddings = self.model.encode(processed_texts, **encode_params)
                    
                    embedding_time = (datetime.now() - start_time).total_seconds()
                    
                    # Atualizar estatísticas
                    self.stats['embeddings_created'] += len(new_embeddings)
                    
                    # Inserir embeddings na posição correta e salvar no cache
                    for k, embedding in enumerate(new_embeddings):
                        idx = indices_to_embed[k]
                        batch_embeddings[idx] = embedding
                        
                        # Salvar no cache
                        self.cache.set(texts_to_embed[k], self.model_name, embedding)
                    
                    logger.debug(f"Lote processado: {len(new_embeddings)} embeddings em {embedding_time:.3f}s")
                    
                except Exception as e:
                    logger.error(f"Erro no embedding em lote: {e}")
                    # Manter None para textos que falharam
                    pass
            
            embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def embed_query(self, query: str) -> Optional[Union[list, 'np.ndarray']]:
        """
        Gera embedding otimizado para QUERY (sentence-transformers v5.1+)
        Usa método especializado para melhor performance em information retrieval
        
        Args:
            query: Texto da consulta/pergunta
            
        Returns:
            Embedding otimizado para busca semântica
        """
        if not query or not query.strip():
            return None
        
        query = query.strip()
        
        # Cache específico para queries
        cache_key = f"query:{query}"
        if self.cache and NUMPY_AVAILABLE:
            cached_embedding = self.cache.get(cache_key, self.model_name)
            if cached_embedding is not None:
                self.stats['cache_hits'] += 1
                return cached_embedding
        
        # Carregar modelo se necessário
        if not self._load_model():
            return None
        
        try:
            start_time = datetime.now()
            
            # Sentence-transformers v5.1+ - encode_query se disponível
            if hasattr(self.model, 'encode_query'):
                # Usar método especializado para queries
                embedding = self.model.encode_query(
                    query,
                    convert_to_numpy=NUMPY_AVAILABLE,
                    normalize_embeddings=True
                )
                logger.debug(f"[V5.1+] Usando encode_query() otimizado")
            else:
                # Fallback para encode() padrão com hint de query
                embedding = self.model.encode(
                    query,
                    convert_to_numpy=NUMPY_AVAILABLE,
                    normalize_embeddings=True,
                    task_type='query' if hasattr(self.model, 'task_type') else None
                )
            
            embedding_time = (datetime.now() - start_time).total_seconds()
            
            # Estatísticas
            self.stats['embeddings_created'] += 1
            self.stats['query_embeddings'] = self.stats.get('query_embeddings', 0) + 1
            
            # Cache com prefixo específico
            if self.cache and NUMPY_AVAILABLE and hasattr(embedding, 'shape'):
                self.cache.set(cache_key, self.model_name, embedding)
            
            logger.debug(f"[OK] Query embedding gerado em {embedding_time:.3f}s")
            return embedding
            
        except Exception as e:
            logger.error(f"[ERROR] Erro ao gerar query embedding: {e}")
            return None
    
    def embed_document(self, document: str) -> Optional[Union[list, 'np.ndarray']]:
        """
        Gera embedding otimizado para DOCUMENTO (sentence-transformers v5.1+)
        Usa método especializado para melhor performance em information retrieval
        
        Args:
            document: Texto do documento/resposta
            
        Returns:
            Embedding otimizado para indexação semântica
        """
        if not document or not document.strip():
            return None
        
        document = document.strip()
        
        # Cache específico para documentos
        cache_key = f"doc:{document}"
        if self.cache and NUMPY_AVAILABLE:
            cached_embedding = self.cache.get(cache_key, self.model_name)
            if cached_embedding is not None:
                self.stats['cache_hits'] += 1
                return cached_embedding
        
        # Carregar modelo se necessário
        if not self._load_model():
            return None
        
        try:
            start_time = datetime.now()
            
            # Truncar documento se muito longo
            max_length = getattr(self.config, 'EMBEDDINGS_MAX_LENGTH', 512) * 4
            if len(document) > max_length:
                document = document[:max_length]
                logger.debug(f"[NOTE] Documento truncado para {max_length} caracteres")
            
            # Sentence-transformers v5.1+ - encode_document se disponível  
            if hasattr(self.model, 'encode_document'):
                # Usar método especializado para documentos
                embedding = self.model.encode_document(
                    document,
                    convert_to_numpy=NUMPY_AVAILABLE,
                    normalize_embeddings=True
                )
                logger.debug(f"[V5.1+] Usando encode_document() otimizado")
            else:
                # Fallback para encode() padrão com hint de document
                embedding = self.model.encode(
                    document,
                    convert_to_numpy=NUMPY_AVAILABLE,
                    normalize_embeddings=True,
                    task_type='document' if hasattr(self.model, 'task_type') else None
                )
            
            embedding_time = (datetime.now() - start_time).total_seconds()
            
            # Estatísticas
            self.stats['embeddings_created'] += 1
            self.stats['document_embeddings'] = self.stats.get('document_embeddings', 0) + 1
            
            # Cache com prefixo específico
            if self.cache and NUMPY_AVAILABLE and hasattr(embedding, 'shape'):
                self.cache.set(cache_key, self.model_name, embedding)
            
            logger.debug(f"[OK] Document embedding gerado em {embedding_time:.3f}s")
            return embedding
            
        except Exception as e:
            logger.error(f"[ERROR] Erro ao gerar document embedding: {e}")
            return None
    
    def calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calcula similaridade coseno entre dois embeddings
        
        Args:
            embedding1: Primeiro embedding
            embedding2: Segundo embedding
            
        Returns:
            Similaridade entre 0 e 1
        """
        try:
            # Embeddings já são normalizados, então produto escalar = similaridade coseno
            similarity = np.dot(embedding1, embedding2)
            
            # Garantir que está entre 0 e 1
            return float(max(0.0, min(1.0, similarity)))
            
        except Exception as e:
            logger.error(f"Erro no cálculo de similaridade: {e}")
            return 0.0
    
    def find_most_similar(
        self, 
        query_embedding: np.ndarray, 
        candidate_embeddings: List[np.ndarray],
        threshold: Optional[float] = None
    ) -> List[Tuple[int, float]]:
        """
        Encontra embeddings mais similares ao query
        
        Args:
            query_embedding: Embedding da consulta
            candidate_embeddings: Lista de embeddings candidatos
            threshold: Threshold mínimo de similaridade
            
        Returns:
            Lista de (índice, similaridade) ordenada por similaridade decrescente
        """
        if not candidate_embeddings:
            return []
        
        threshold = threshold or self.config.SEMANTIC_SIMILARITY_THRESHOLD
        
        similarities = []
        
        for i, candidate in enumerate(candidate_embeddings):
            if candidate is None:
                continue
            
            similarity = self.calculate_similarity(query_embedding, candidate)
            
            if similarity >= threshold:
                similarities.append((i, similarity))
        
        # Ordenar por similaridade decrescente
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities
    
    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas do serviço (com lazy loading) - v5.1+ enhanced"""
        stats = dict(self.stats)
        
        # Detectar funcionalidades v5.1+
        v51_features = {}
        if self._model_loaded and self.model:
            v51_features = {
                'encode_query_available': hasattr(self.model, 'encode_query'),
                'encode_document_available': hasattr(self.model, 'encode_document'),
                'sparse_encoder_available': hasattr(self.model, 'sparsity'),
                'parallel_processing_available': hasattr(self.model, 'pool'),
                'chunk_processing_available': 'chunk_size' in getattr(self.model, 'encode', lambda: {}).__code__.co_varnames if hasattr(self.model, 'encode') else False
            }
        
        stats.update({
            'model_loaded': self._model_loaded,
            'load_attempted': self._load_attempted,
            'load_failed': self._load_failed,
            'model_name': self.model_name,
            'device': self.device,
            'embeddings_enabled': getattr(self.config, 'EMBEDDINGS_ENABLED', False),
            'sentence_transformers_available': _test_sentence_transformers(),
            'numpy_available': NUMPY_AVAILABLE,
            'cache_enabled': self.cache is not None,
            'available': self.is_available(),
            'v51_features': v51_features,
            'embedding_methods_used': {
                'query_embeddings': self.stats.get('query_embeddings', 0),
                'document_embeddings': self.stats.get('document_embeddings', 0),
                'general_embeddings': self.stats.get('embeddings_created', 0) - 
                                    self.stats.get('query_embeddings', 0) - 
                                    self.stats.get('document_embeddings', 0)
            }
        })
        
        # Adicionar stats do cache se disponível
        if self.cache:
            try:
                stats['cache_stats'] = self.cache.get_stats()
            except Exception as e:
                stats['cache_stats'] = {'error': str(e)}
        else:
            stats['cache_stats'] = None
        
        return stats
    
    def save_cache(self):
        """Força salvamento do cache (se disponível)"""
        if self.cache:
            try:
                self.cache._save_cache()
                logger.info("[OK] Cache de embeddings salvo")
            except Exception as e:
                logger.error(f"[ERROR] Erro ao salvar cache: {e}")
        else:
            logger.warning("[WARNING] Cache não disponível para salvamento")
    
    def clear_cache(self):
        """Limpa cache de embeddings (se disponível)"""
        if self.cache:
            try:
                self.cache._cache.clear()
                self.cache._metadata.clear()
                self.cache._save_cache()
                logger.info("[OK] Cache de embeddings limpo")
            except Exception as e:
                logger.error(f"[ERROR] Erro ao limpar cache: {e}")
        else:
            logger.warning("[WARNING] Cache não disponível para limpeza")

# Instância global (lazy loading)
_embedding_service: Optional[EmbeddingService] = None

def get_embedding_service() -> Optional[EmbeddingService]:
    """
    Obtém instância global do serviço de embeddings (lazy loading)
    Não falha se dependências pesadas não estiverem disponíveis
    """
    global _embedding_service
    
    if _embedding_service is None:
        try:
            from app_config import config
            _embedding_service = EmbeddingService(config)
            logger.debug("[OK] EmbeddingService instância global criada")
        except Exception as e:
            logger.warning(f"[WARNING] Erro ao inicializar serviço de embeddings: {e}")
            return None
    
    return _embedding_service

def is_embeddings_available() -> bool:
    """
    Verifica se embeddings estão disponíveis (check leve)
    Não carrega modelo pesado, apenas verifica configuração e bibliotecas
    """
    try:
        service = get_embedding_service()
        if service is None:
            return False
        return service.is_available()
    except Exception as e:
        logger.debug(f"Erro ao verificar disponibilidade de embeddings: {e}")
        return False

def get_embedding_stats() -> Dict[str, Any]:
    """Obtém estatísticas do sistema de embeddings"""
    try:
        service = get_embedding_service()
        if service:
            return service.get_statistics()
        else:
            return {
                'available': False,
                'error': 'Service not initialized',
                'sentence_transformers_available': _test_sentence_transformers(),
                'numpy_available': NUMPY_AVAILABLE
            }
    except Exception as e:
        return {
            'available': False,
            'error': str(e),
            'sentence_transformers_available': False,
            'numpy_available': NUMPY_AVAILABLE
        }

# Funções de conveniência (com fallback robusto)
def embed_text(text: str) -> Optional[Union[list, 'np.ndarray']]:
    """
    Função de conveniência para gerar embedding
    Retorna None se embeddings não disponíveis
    """
    try:
        service = get_embedding_service()
        if service and service.is_available():
            return service.embed_text(text)
        else:
            logger.debug("[WARNING] Serviço de embeddings não disponível para embed_text")
            return None
    except Exception as e:
        logger.warning(f"[ERROR] Erro em embed_text: {e}")
        return None

def embed_texts_batch(texts: List[str]) -> List[Optional[Union[list, 'np.ndarray']]]:
    """Função de conveniência para embedding em lote"""
    try:
        service = get_embedding_service()
        if service and service.is_available():
            return service.embed_batch(texts)
        else:
            logger.debug("[WARNING] Serviço de embeddings não disponível para embed_texts_batch")
            return [None] * len(texts)
    except Exception as e:
        logger.warning(f"[ERROR] Erro em embed_texts_batch: {e}")
        return [None] * len(texts)

# Funções de diagnóstico
def test_embeddings_system() -> Dict[str, Any]:
    """
    Testa sistema de embeddings e retorna diagnóstico completo
    """
    results = {
        'timestamp': datetime.now().isoformat(),
        'numpy_available': NUMPY_AVAILABLE,
        'sentence_transformers_test': False,
        'service_init': False,
        'model_load': False,
        'embed_test': False,
        'error_details': []
    }
    
    try:
        # Teste 1: sentence_transformers
        results['sentence_transformers_test'] = _test_sentence_transformers()
        
        # Teste 2: Inicialização do serviço
        service = get_embedding_service()
        if service:
            results['service_init'] = True
            
            # Teste 3: Disponibilidade
            if service.is_available():
                results['service_available'] = True
                
                # Teste 4: Embedding simples
                test_text = "teste de embedding simples"
                embedding = service.embed_text(test_text)
                if embedding is not None:
                    results['embed_test'] = True
                    if hasattr(embedding, 'shape'):
                        results['embedding_shape'] = list(embedding.shape)
                    else:
                        results['embedding_length'] = len(embedding)
        
        # Teste 5: Estatísticas
        results['stats'] = get_embedding_stats()
        
    except Exception as e:
        results['error_details'].append(str(e))
        logger.error(f"[ERROR] Erro no teste do sistema de embeddings: {e}")
    
    return results

# Aliases para compatibilidade
def embed_texts(texts: List[str]) -> List[Optional[Union[list, 'np.ndarray']]]:
    """Alias para embed_texts_batch (compatibilidade)"""
    return embed_texts_batch(texts)

# Log de inicialização
logger.info("🧠 EmbeddingService com lazy loading inicializado")