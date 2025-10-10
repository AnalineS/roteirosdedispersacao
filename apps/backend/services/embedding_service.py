# -*- coding: utf-8 -*-
"""
Embedding Service - Real implementation for text embedding generation
Provides high-quality embeddings for semantic search and RAG systems
"""

import os
import logging
import time
import hashlib
from typing import List, Dict, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)

# Import sentence transformers for real embedding generation
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None

# Import OpenAI for fallback embeddings
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

# Import HuggingFace for embeddings (PRIORITY)
try:
    from huggingface_hub import InferenceClient
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False
    InferenceClient = None

# Import sklearn for fallback TF-IDF embeddings
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    TfidfVectorizer = None

@dataclass
class EmbeddingResult:
    """Result from embedding generation"""
    embedding: Optional[np.ndarray]
    dimension: int
    model_used: str
    generation_time: float
    success: bool
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'dimension': self.dimension,
            'model_used': self.model_used,
            'generation_time': self.generation_time,
            'success': self.success,
            'error_message': self.error_message,
            'embedding_available': self.embedding is not None
        }

class EmbeddingService:
    """
    Real embedding service with multiple backends
    Provides production-ready text embeddings for semantic search
    """

    # Supported models
    SUPPORTED_MODELS = {
        'huggingface': {
            'BAAI/bge-small-en-v1.5': 384,     # PRIORITY - Same as indexing
            'sentence-transformers/all-MiniLM-L6-v2': 384,
            'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 384
        },
        'sentence_transformers': {
            'all-MiniLM-L6-v2': 384,           # Fast and efficient
            'all-mpnet-base-v2': 768,          # Better quality
            'paraphrase-multilingual-MiniLM-L12-v2': 384,  # Multilingual
            'distiluse-base-multilingual-cased': 512       # Multilingual distilled
        },
        'openai': {
            'text-embedding-ada-002': 1536,    # OpenAI's latest
            'text-embedding-3-small': 1536,    # New model
            'text-embedding-3-large': 3072     # Highest quality
        }
    }

    def __init__(self, config):
        self.config = config
        self.model = None
        self.tfidf_vectorizer = None
        self.huggingface_client = None

        # Configuration - PRIORITY: HuggingFace > SentenceTransformers > OpenAI
        self.backend = getattr(config, 'EMBEDDING_BACKEND', 'huggingface')
        self.model_name = getattr(config, 'EMBEDDING_MODEL', 'BAAI/bge-small-en-v1.5')
        self.embedding_dimension = getattr(config, 'EMBEDDING_DIMENSION', 384)

        # HuggingFace configuration (PRIORITY)
        self.huggingface_token = getattr(config, 'HUGGINGFACE_TOKEN', os.getenv('HUGGINGFACE_TOKEN')) or os.getenv('HF_TOKEN')
        self.huggingface_model = getattr(config, 'HUGGINGFACE_MODEL', 'BAAI/bge-small-en-v1.5')

        # OpenAI configuration (fallback)
        self.openai_api_key = getattr(config, 'OPENAI_API_KEY', os.getenv('OPENAI_API_KEY'))
        self.openai_model = getattr(config, 'OPENAI_EMBEDDING_MODEL', 'text-embedding-ada-002')

        # Performance settings
        self.batch_size = getattr(config, 'EMBEDDING_BATCH_SIZE', 32)
        self.cache_embeddings = getattr(config, 'CACHE_EMBEDDINGS', True)
        self.normalize_embeddings = getattr(config, 'NORMALIZE_EMBEDDINGS', True)

        # Cache for embeddings
        self.embedding_cache = {} if self.cache_embeddings else None
        self.cache_hits = 0
        self.cache_misses = 0

        # Statistics
        self.stats = {
            'embeddings_generated': 0,
            'total_generation_time': 0.0,
            'avg_generation_time': 0.0,
            'backend_used': 'none',
            'model_loaded': False,
            'cache_hits': 0,
            'cache_misses': 0,
            'batch_operations': 0,
            'errors': 0
        }

        # Initialize embedding model
        self._initialize_backend()

    def _initialize_backend(self):
        """Initialize the embedding backend - PRIORITY: HuggingFace API"""
        # Try requested backend first
        if self.backend == 'huggingface' and self._try_initialize_huggingface():
            return
        elif self.backend == 'openai' and self._try_initialize_openai():
            return
        elif self.backend == 'sentence_transformers' and self._try_initialize_sentence_transformers():
            return

        # Fallback priority: HuggingFace > SentenceTransformers > OpenAI > TF-IDF
        if self._try_initialize_huggingface():
            return
        elif self._try_initialize_sentence_transformers():
            return
        elif self._try_initialize_openai():
            return
        elif self._try_initialize_tfidf():
            return
        else:
            logger.error("[ERROR] No embedding backend available")

    def _try_initialize_huggingface(self) -> bool:
        """Try to initialize HuggingFace embeddings - PRIORITY METHOD"""
        if not HUGGINGFACE_AVAILABLE or not self.huggingface_token:
            return False

        try:
            self.huggingface_client = InferenceClient(api_key=self.huggingface_token)
            self.stats['backend_used'] = 'huggingface'
            self.stats['model_loaded'] = True
            self.embedding_dimension = self.SUPPORTED_MODELS['huggingface'].get(self.huggingface_model, 384)

            logger.info(f"[OK] HuggingFace embeddings initialized with model: {self.huggingface_model}")
            return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize HuggingFace embeddings: {e}")
            return False

    def _try_initialize_openai(self) -> bool:
        """Try to initialize OpenAI embeddings"""
        if not OPENAI_AVAILABLE or not self.openai_api_key:
            return False

        try:
            # Set up OpenAI client
            if hasattr(openai, 'OpenAI'):
                # New OpenAI v1+ API
                self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
            else:
                # Legacy OpenAI API
                openai.api_key = self.openai_api_key
                self.openai_client = None

            self.stats['backend_used'] = 'openai'
            self.stats['model_loaded'] = True
            self.embedding_dimension = self.SUPPORTED_MODELS['openai'].get(self.openai_model, 1536)

            logger.info(f"[OK] OpenAI embeddings initialized with model: {self.openai_model}")
            return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize OpenAI embeddings: {e}")
            return False

    def _try_initialize_sentence_transformers(self) -> bool:
        """Try to initialize sentence transformers"""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            return False

        try:
            self.model = SentenceTransformer(self.model_name)
            self.stats['backend_used'] = 'sentence_transformers'
            self.stats['model_loaded'] = True
            self.embedding_dimension = self.SUPPORTED_MODELS['sentence_transformers'].get(self.model_name, 384)

            logger.info(f"[OK] SentenceTransformer initialized with model: {self.model_name}")
            return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize SentenceTransformer: {e}")
            return False

    def _try_initialize_tfidf(self) -> bool:
        """Try to initialize TF-IDF as fallback"""
        if not SKLEARN_AVAILABLE:
            return False

        try:
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 2)
            )
            self.stats['backend_used'] = 'tfidf'
            self.stats['model_loaded'] = True
            self.embedding_dimension = 1000  # TF-IDF feature dimension

            logger.warning("[WARNING] Using TF-IDF embeddings as fallback - quality may be limited")
            return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize TF-IDF: {e}")
            return False

    def is_available(self) -> bool:
        """Check if embedding service is available"""
        return self.stats['model_loaded']

    def embed_text(self, text: str) -> EmbeddingResult:
        """Generate embedding for a single text"""
        if not self.is_available():
            return EmbeddingResult(
                embedding=None,
                dimension=0,
                model_used='none',
                generation_time=0.0,
                success=False,
                error_message="Embedding service not available"
            )

        # Check cache
        if self.embedding_cache is not None:
            cache_key = self._generate_cache_key(text)
            if cache_key in self.embedding_cache:
                self.cache_hits += 1
                self.stats['cache_hits'] += 1
                cached_embedding = self.embedding_cache[cache_key]
                return EmbeddingResult(
                    embedding=cached_embedding,
                    dimension=len(cached_embedding),
                    model_used=f"{self.stats['backend_used']}_cached",
                    generation_time=0.0,
                    success=True
                )

        start_time = time.time()

        try:
            if self.stats['backend_used'] == 'huggingface':
                embedding = self._generate_huggingface_embedding(text)
            elif self.stats['backend_used'] == 'openai':
                embedding = self._generate_openai_embedding(text)
            elif self.stats['backend_used'] == 'sentence_transformers':
                embedding = self._generate_sentence_transformer_embedding(text)
            elif self.stats['backend_used'] == 'tfidf':
                embedding = self._generate_tfidf_embedding([text])[0]
            else:
                raise ValueError("No valid backend initialized")

            if embedding is None:
                raise ValueError("Embedding generation returned None")

            # Normalize if configured
            if self.normalize_embeddings and self.stats['backend_used'] != 'tfidf':
                embedding = embedding / np.linalg.norm(embedding)

            # Cache the result
            if self.embedding_cache is not None:
                self.embedding_cache[cache_key] = embedding
                self.cache_misses += 1
                self.stats['cache_misses'] += 1

            # Update statistics
            generation_time = time.time() - start_time
            self.stats['embeddings_generated'] += 1
            self.stats['total_generation_time'] += generation_time
            self.stats['avg_generation_time'] = self.stats['total_generation_time'] / self.stats['embeddings_generated']

            return EmbeddingResult(
                embedding=embedding,
                dimension=len(embedding),
                model_used=self.stats['backend_used'],
                generation_time=generation_time,
                success=True
            )

        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"[ERROR] Failed to generate embedding: {e}")
            return EmbeddingResult(
                embedding=None,
                dimension=0,
                model_used=self.stats['backend_used'],
                generation_time=time.time() - start_time,
                success=False,
                error_message=str(e)
            )

    def embed_batch(self, texts: List[str], batch_size: Optional[int] = None) -> List[EmbeddingResult]:
        """Generate embeddings for multiple texts efficiently"""
        if not self.is_available():
            return [EmbeddingResult(
                embedding=None,
                dimension=0,
                model_used='none',
                generation_time=0.0,
                success=False,
                error_message="Embedding service not available"
            )] * len(texts)

        batch_size = batch_size or self.batch_size
        results = []

        try:
            # Process in batches
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_results = self._process_batch(batch)
                results.extend(batch_results)

            self.stats['batch_operations'] += 1
            return results

        except Exception as e:
            logger.error(f"[ERROR] Batch embedding failed: {e}")
            # Return individual results for each text
            return [self.embed_text(text) for text in texts]

    def _process_batch(self, texts: List[str]) -> List[EmbeddingResult]:
        """Process a single batch of texts"""
        start_time = time.time()

        try:
            if self.stats['backend_used'] == 'sentence_transformers':
                embeddings = self.model.encode(texts, convert_to_numpy=True, batch_size=len(texts))
                if len(texts) == 1:
                    embeddings = [embeddings]
            elif self.stats['backend_used'] == 'tfidf':
                embeddings = self._generate_tfidf_embedding(texts)
            else:
                # OpenAI doesn't have efficient batch processing, process individually
                return [self.embed_text(text) for text in texts]

            # Normalize if configured
            if self.normalize_embeddings and self.stats['backend_used'] != 'tfidf':
                embeddings = [emb / np.linalg.norm(emb) for emb in embeddings]

            generation_time = time.time() - start_time

            # Create results
            results = []
            for i, (text, embedding) in enumerate(zip(texts, embeddings)):
                # Cache the result
                if self.embedding_cache is not None:
                    cache_key = self._generate_cache_key(text)
                    self.embedding_cache[cache_key] = embedding

                results.append(EmbeddingResult(
                    embedding=embedding,
                    dimension=len(embedding),
                    model_used=self.stats['backend_used'],
                    generation_time=generation_time / len(texts),  # Average time per embedding
                    success=True
                ))

            # Update statistics
            self.stats['embeddings_generated'] += len(texts)
            self.stats['total_generation_time'] += generation_time

            return results

        except Exception as e:
            logger.error(f"[ERROR] Batch processing failed: {e}")
            # Fallback to individual processing
            return [self.embed_text(text) for text in texts]

    def _generate_huggingface_embedding(self, text: str) -> np.ndarray:
        """Generate embedding using HuggingFace Inference API"""
        try:
            embedding = self.huggingface_client.feature_extraction(text, model=self.huggingface_model)

            # Convert to numpy array
            if hasattr(embedding, 'tolist'):
                embedding = embedding.tolist()
            elif isinstance(embedding, list) and isinstance(embedding[0], list):
                embedding = embedding[0]

            return np.array(embedding)

        except Exception as e:
            logger.error(f"[ERROR] HuggingFace embedding generation failed: {e}")
            return None

    def _generate_openai_embedding(self, text: str) -> np.ndarray:
        """Generate embedding using OpenAI API"""
        try:
            if self.openai_client:
                # New OpenAI v1+ API
                response = self.openai_client.embeddings.create(
                    model=self.openai_model,
                    input=text
                )
                embedding = np.array(response.data[0].embedding)
            else:
                # Legacy OpenAI API
                response = openai.Embedding.create(
                    model=self.openai_model,
                    input=text
                )
                embedding = np.array(response['data'][0]['embedding'])

            return embedding

        except Exception as e:
            logger.error(f"[ERROR] OpenAI embedding generation failed: {e}")
            raise

    def _generate_sentence_transformer_embedding(self, text: str) -> np.ndarray:
        """Generate embedding using sentence transformers"""
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding

        except Exception as e:
            logger.error(f"[ERROR] SentenceTransformer embedding generation failed: {e}")
            raise

    def _generate_tfidf_embedding(self, texts: List[str]) -> List[np.ndarray]:
        """Generate TF-IDF embeddings (requires fitting on texts)"""
        try:
            # Fit and transform the texts
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)

            # Convert to dense numpy arrays
            embeddings = []
            for i in range(tfidf_matrix.shape[0]):
                embedding = np.array(tfidf_matrix[i].todense()).flatten()
                embeddings.append(embedding)

            return embeddings

        except Exception as e:
            logger.error(f"[ERROR] TF-IDF embedding generation failed: {e}")
            raise

    def _generate_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        # Use hash of text for cache key
        text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
        return f"{self.stats['backend_used']}:{self.model_name}:{text_hash[:16]}"

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings generated by this service"""
        return self.embedding_dimension

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive embedding service statistics"""
        stats = dict(self.stats)

        # Calculate cache hit rate
        total_cache_requests = self.stats['cache_hits'] + self.stats['cache_misses']
        if total_cache_requests > 0:
            stats['cache_hit_rate'] = (self.stats['cache_hits'] / total_cache_requests) * 100
        else:
            stats['cache_hit_rate'] = 0.0

        # Add configuration info
        stats['configuration'] = {
            'backend': self.backend,
            'model_name': self.model_name,
            'embedding_dimension': self.embedding_dimension,
            'batch_size': self.batch_size,
            'cache_enabled': self.cache_embeddings,
            'normalize_embeddings': self.normalize_embeddings
        }

        # Add cache info
        if self.embedding_cache is not None:
            stats['cache_size'] = len(self.embedding_cache)
        else:
            stats['cache_size'] = 0

        stats['is_available'] = self.is_available()

        return stats

    def clear_cache(self):
        """Clear embedding cache"""
        if self.embedding_cache is not None:
            self.embedding_cache.clear()
            logger.info("[OK] Embedding cache cleared")

    def preload_embeddings(self, texts: List[str]) -> int:
        """Preload embeddings for common texts"""
        if not self.is_available():
            return 0

        successful = 0
        for text in texts:
            result = self.embed_text(text)
            if result.success:
                successful += 1

        logger.info(f"[OK] Preloaded {successful}/{len(texts)} embeddings")
        return successful

# Global embedding service instance
_embedding_service_instance: Optional[EmbeddingService] = None

def get_embedding_service() -> Optional[EmbeddingService]:
    """Get the global embedding service instance"""
    global _embedding_service_instance

    if _embedding_service_instance is None:
        try:
            from app_config import config
            _embedding_service_instance = EmbeddingService(config)
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize embedding service: {e}")
            return None

    return _embedding_service_instance

def is_embedding_service_available() -> bool:
    """Check if embedding service is available"""
    service = get_embedding_service()
    return service is not None and service.is_available()

# Convenience functions
def embed_text(text: str) -> Optional[np.ndarray]:
    """Convenience function to embed single text"""
    service = get_embedding_service()
    if service and service.is_available():
        result = service.embed_text(text)
        return result.embedding if result.success else None
    return None

def embed_texts(texts: List[str]) -> List[Optional[np.ndarray]]:
    """Convenience function to embed multiple texts"""
    service = get_embedding_service()
    if service and service.is_available():
        results = service.embed_batch(texts)
        return [result.embedding if result.success else None for result in results]
    return [None] * len(texts)

def get_embedding_dimension() -> int:
    """Get embedding dimension"""
    service = get_embedding_service()
    if service:
        return service.get_embedding_dimension()
    return 0

def get_embedding_stats() -> Dict[str, Any]:
    """Get embedding service statistics"""
    service = get_embedding_service()
    if service:
        return service.get_statistics()
    return {'error': 'Embedding service not available'}

# Alias for backward compatibility
def is_embeddings_available() -> bool:
    """Alias for is_embedding_service_available"""
    return is_embedding_service_available()

__all__ = [
    'EmbeddingResult',
    'EmbeddingService',
    'get_embedding_service',
    'is_embedding_service_available',
    'is_embeddings_available',  # Backward compatibility
    'embed_text',
    'embed_texts',
    'get_embedding_dimension',
    'get_embedding_stats'
]