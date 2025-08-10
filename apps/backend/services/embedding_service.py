# -*- coding: utf-8 -*-
"""
Embedding Service - Sistema de embeddings para RAG semântico
Suporte para modelos multilíngues otimizados para português médico
"""

import os
import pickle
import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path

# Configuração de imports opcionais
try:
    from sentence_transformers import SentenceTransformer
    import torch
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

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
        return hashlib.md5(content.encode()).hexdigest()
    
    def _load_cache(self):
        """Carrega cache do disco"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'rb') as f:
                    self._cache = pickle.load(f)
                    
            if self.metadata_file.exists():
                with open(self.metadata_file, 'rb') as f:
                    self._metadata = pickle.load(f)
                    
            logger.info(f"Cache carregado: {len(self._cache)} embeddings")
        except Exception as e:
            logger.warning(f"Erro ao carregar cache de embeddings: {e}")
            self._cache = {}
            self._metadata = {}
    
    def _save_cache(self):
        """Salva cache no disco"""
        try:
            with open(self.cache_file, 'wb') as f:
                pickle.dump(self._cache, f)
                
            with open(self.metadata_file, 'wb') as f:
                pickle.dump(self._metadata, f)
                
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
            'cache_size_mb': len(pickle.dumps(self._cache)) / (1024 * 1024),
            'oldest_entry': min(
                (meta['created_at'] for meta in self._metadata.values()),
                default=None
            ),
            'cache_hit_potential': len(self._cache) / max(self.max_size, 1) * 100
        }

class EmbeddingService:
    """
    Serviço de embeddings com suporte a modelos multilíngues
    Otimizado para conteúdo médico em português
    """
    
    def __init__(self, config):
        self.config = config
        self.model: Optional[SentenceTransformer] = None
        self.model_name = config.EMBEDDING_MODEL
        self.device = config.EMBEDDING_DEVICE
        self.cache = EmbeddingCache(config.VECTOR_DB_PATH, config.EMBEDDING_CACHE_SIZE)
        
        # Métricas
        self.stats = {
            'embeddings_created': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'model_load_time': 0.0,
            'avg_embedding_time': 0.0
        }
        
        # Lazy loading do modelo
        self._model_loaded = False
        
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            logger.warning("⚠️ Sentence Transformers não disponível - embeddings desabilitados")
    
    def _load_model(self) -> bool:
        """Carrega modelo de embeddings (lazy loading)"""
        if self._model_loaded or not SENTENCE_TRANSFORMERS_AVAILABLE:
            return self._model_loaded
        
        try:
            start_time = datetime.now()
            
            logger.info(f"🧠 Carregando modelo de embeddings: {self.model_name}")
            
            self.model = SentenceTransformer(
                self.model_name,
                device=self.device
            )
            
            # Configurar modelo para melhor performance
            if hasattr(self.model, 'max_seq_length'):
                self.model.max_seq_length = self.config.EMBEDDINGS_MAX_LENGTH
            
            load_time = (datetime.now() - start_time).total_seconds()
            self.stats['model_load_time'] = load_time
            
            self._model_loaded = True
            
            logger.info(f"✅ Modelo carregado em {load_time:.2f}s - Device: {self.device}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar modelo de embeddings: {e}")
            return False
    
    def is_available(self) -> bool:
        """Verifica se o serviço está disponível"""
        return (
            SENTENCE_TRANSFORMERS_AVAILABLE and
            self.config.EMBEDDINGS_ENABLED and
            self._load_model()
        )
    
    def embed_text(self, text: str) -> Optional[np.ndarray]:
        """
        Gera embedding para um texto
        
        Args:
            text: Texto para embedding
            
        Returns:
            Array numpy com embedding ou None se falhar
        """
        if not text or not text.strip():
            return None
        
        text = text.strip()
        
        # Tentar cache primeiro
        cached_embedding = self.cache.get(text, self.model_name)
        if cached_embedding is not None:
            self.stats['cache_hits'] += 1
            return cached_embedding
        
        self.stats['cache_misses'] += 1
        
        # Carregar modelo se necessário
        if not self._load_model():
            return None
        
        try:
            start_time = datetime.now()
            
            # Limitar tamanho do texto
            if len(text) > self.config.EMBEDDINGS_MAX_LENGTH * 4:  # ~4 chars per token
                text = text[:self.config.EMBEDDINGS_MAX_LENGTH * 4]
            
            # Gerar embedding
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                normalize_embeddings=True,  # Importante para similaridade coseno
                batch_size=1
            )
            
            embedding_time = (datetime.now() - start_time).total_seconds()
            
            # Atualizar estatísticas
            self.stats['embeddings_created'] += 1
            self.stats['avg_embedding_time'] = (
                (self.stats['avg_embedding_time'] * (self.stats['embeddings_created'] - 1) + embedding_time) /
                self.stats['embeddings_created']
            )
            
            # Salvar no cache
            self.cache.set(text, self.model_name, embedding)
            
            logger.debug(f"Embedding gerado: {embedding.shape} em {embedding_time:.3f}s")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {e}")
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
                    
                    new_embeddings = self.model.encode(
                        processed_texts,
                        convert_to_numpy=True,
                        normalize_embeddings=True,
                        batch_size=batch_size
                    )
                    
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
        """Retorna estatísticas do serviço"""
        stats = dict(self.stats)
        stats.update({
            'model_loaded': self._model_loaded,
            'model_name': self.model_name,
            'device': self.device,
            'cache_stats': self.cache.get_stats(),
            'available': self.is_available()
        })
        
        return stats
    
    def save_cache(self):
        """Força salvamento do cache"""
        self.cache._save_cache()
    
    def clear_cache(self):
        """Limpa cache de embeddings"""
        self.cache._cache.clear()
        self.cache._metadata.clear()
        self.cache._save_cache()
        logger.info("Cache de embeddings limpo")

# Instância global (lazy loading)
_embedding_service: Optional[EmbeddingService] = None

def get_embedding_service() -> Optional[EmbeddingService]:
    """Obtém instância global do serviço de embeddings"""
    global _embedding_service
    
    if _embedding_service is None:
        try:
            from app_config import config
            _embedding_service = EmbeddingService(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar serviço de embeddings: {e}")
            return None
    
    return _embedding_service

def is_embeddings_available() -> bool:
    """Verifica se embeddings estão disponíveis"""
    service = get_embedding_service()
    return service is not None and service.is_available()

# Funções de conveniência
def embed_text(text: str) -> Optional[np.ndarray]:
    """Função de conveniência para gerar embedding"""
    service = get_embedding_service()
    if service:
        return service.embed_text(text)
    return None

def embed_texts(texts: List[str]) -> List[Optional[np.ndarray]]:
    """Função de conveniência para gerar embeddings em lote"""
    service = get_embedding_service()
    if service:
        return service.embed_batch(texts)
    return [None] * len(texts)