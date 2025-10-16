# -*- coding: utf-8 -*-
"""
Unified Embedding Service - Cloud Run Optimized
Uses HuggingFace Serverless API ONLY (no local models)
Model: intfloat/multilingual-e5-small (384 dimensions) - best free multilingual
"""

import os
import logging
import time
import numpy as np
import requests
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from cachetools import TTLCache

logger = logging.getLogger(__name__)

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

class UnifiedEmbeddingService:
    """
    Cloud Run optimized embedding service
    Uses HuggingFace Serverless API ONLY (no local models)
    Enforces model consistency with indexed database (intfloat/multilingual-e5-small)
    """

    # CRITICAL: Must match indexing model exactly
    MODEL_ID = "intfloat/multilingual-e5-small"
    EMBEDDING_DIMENSION = 384
    API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"

    def __init__(self, config):
        self.config = config

        # Get API key (check multiple env var names for compatibility)
        self.api_key = (
            getattr(config, 'HUGGINGFACE_API_KEY', None) or
            getattr(config, 'HUGGINGFACE_TOKEN', None) or
            getattr(config, 'HF_TOKEN', None) or
            os.getenv('HUGGINGFACE_API_KEY') or
            os.getenv('HUGGINGFACE_TOKEN') or
            os.getenv('HF_TOKEN')
        )

        if not self.api_key:
            logger.error("[CRITICAL] HuggingFace API key required")
            logger.error("[CRITICAL] Set HUGGINGFACE_API_KEY environment variable")
            raise ValueError("HuggingFace API key required (set HUGGINGFACE_API_KEY)")

        # API configuration
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

        # Caching (1 hour TTL, 1000 items max)
        self.cache = TTLCache(maxsize=1000, ttl=3600)

        # Rate limiting (free tier: ~1 request/second)
        self.last_request_time = 0
        self.min_interval = 1.0  # seconds between requests

        # Statistics
        self.stats = {
            'embeddings_generated': 0,
            'total_generation_time': 0.0,
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': 0,
            'backend_used': 'huggingface',
            'model_loaded': True
        }

        logger.info("=" * 80)
        logger.info("[UNIFIED EMBEDDING SERVICE] Initialized")
        logger.info(f"[MODEL] {self.MODEL_ID}")
        logger.info(f"[DIMENSIONS] {self.EMBEDDING_DIMENSION}")
        logger.info(f"[API KEY] {'SET' if self.api_key else 'NOT SET'}")
        logger.info(f"[CACHE] TTL=3600s, maxsize=1000")
        logger.info("=" * 80)

    def is_available(self) -> bool:
        """Check if service is available"""
        return self.api_key is not None

    def embed_text(self, text: str) -> EmbeddingResult:
        """Generate embedding for single text with caching and rate limiting"""
        # Check cache first
        cache_key = text[:200]  # Use first 200 chars as key
        if cache_key in self.cache:
            self.stats['cache_hits'] += 1
            cached_embedding = self.cache[cache_key]
            logger.debug(f"[CACHE HIT] Returning cached embedding")
            return EmbeddingResult(
                embedding=cached_embedding,
                dimension=self.EMBEDDING_DIMENSION,
                model_used=f"{self.MODEL_ID}_cached",
                generation_time=0.0,
                success=True
            )

        self.stats['cache_misses'] += 1
        start_time = time.time()

        try:
            # Rate limiting
            elapsed = time.time() - self.last_request_time
            if elapsed < self.min_interval:
                sleep_time = self.min_interval - elapsed
                logger.debug(f"[RATE LIMIT] Sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)

            # API call
            logger.info(f"[API CALL] Generating embedding (text length: {len(text)})")
            response = requests.post(
                self.API_URL,
                headers=self.headers,
                json={
                    "inputs": text,
                    "options": {"wait_for_model": True, "use_cache": True}
                },
                timeout=30
            )

            self.last_request_time = time.time()

            if response.status_code == 200:
                embedding = response.json()

                # Handle nested response format
                if isinstance(embedding, list) and len(embedding) > 0:
                    if isinstance(embedding[0], list):
                        embedding = embedding[0]  # Flatten nested list

                embedding_array = np.array(embedding, dtype=np.float32)

                # Validate dimension
                if len(embedding_array) != self.EMBEDDING_DIMENSION:
                    error_msg = f"Dimension mismatch: expected {self.EMBEDDING_DIMENSION}, got {len(embedding_array)}"
                    logger.error(f"[ERROR] {error_msg}")
                    raise ValueError(error_msg)

                # Cache result
                self.cache[cache_key] = embedding_array

                # Update stats
                generation_time = time.time() - start_time
                self.stats['embeddings_generated'] += 1
                self.stats['total_generation_time'] += generation_time

                logger.info(f"[SUCCESS] Embedding generated in {generation_time:.3f}s (dim: {len(embedding_array)})")

                return EmbeddingResult(
                    embedding=embedding_array,
                    dimension=self.EMBEDDING_DIMENSION,
                    model_used=self.MODEL_ID,
                    generation_time=generation_time,
                    success=True
                )

            elif response.status_code == 503:
                # Model loading - common for cold start
                error_msg = f"Model loading (503): {response.text[:200]}"
                logger.warning(f"[WARNING] {error_msg}")
                self.stats['errors'] += 1

                return EmbeddingResult(
                    embedding=None,
                    dimension=0,
                    model_used=self.MODEL_ID,
                    generation_time=time.time() - start_time,
                    success=False,
                    error_message=error_msg
                )

            else:
                # API error - NO FALLBACKS (fail honestly for HML/Main)
                error_msg = f"API error {response.status_code}: {response.text[:200]}"
                logger.error(f"[ERROR] {error_msg}")
                self.stats['errors'] += 1

                return EmbeddingResult(
                    embedding=None,
                    dimension=0,
                    model_used=self.MODEL_ID,
                    generation_time=time.time() - start_time,
                    success=False,
                    error_message=error_msg
                )

        except Exception as e:
            logger.error(f"[ERROR] Embedding generation failed: {e}")
            logger.error(f"[ERROR] Exception type: {type(e).__name__}")
            self.stats['errors'] += 1

            # NO FALLBACKS - fail honestly
            return EmbeddingResult(
                embedding=None,
                dimension=0,
                model_used=self.MODEL_ID,
                generation_time=time.time() - start_time,
                success=False,
                error_message=str(e)
            )

    def embed_batch(self, texts: List[str], batch_size: int = 16) -> List[EmbeddingResult]:
        """Generate embeddings for multiple texts with batching"""
        if not texts:
            return []

        logger.info(f"[BATCH] Processing {len(texts)} texts (batch_size={batch_size})")
        results = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.debug(f"[BATCH] Processing batch {i//batch_size + 1} ({len(batch)} texts)")

            try:
                # Rate limiting
                elapsed = time.time() - self.last_request_time
                if elapsed < self.min_interval:
                    time.sleep(self.min_interval - elapsed)

                # API call for batch
                response = requests.post(
                    self.API_URL,
                    headers=self.headers,
                    json={
                        "inputs": batch,
                        "options": {"wait_for_model": True, "use_cache": True}
                    },
                    timeout=60
                )

                self.last_request_time = time.time()

                if response.status_code == 200:
                    embeddings = response.json()

                    for text, embedding in zip(batch, embeddings):
                        embedding_array = np.array(embedding, dtype=np.float32)

                        # Validate dimension
                        if len(embedding_array) != self.EMBEDDING_DIMENSION:
                            logger.warning(f"[WARNING] Dimension mismatch in batch: {len(embedding_array)}")
                            continue

                        results.append(EmbeddingResult(
                            embedding=embedding_array,
                            dimension=self.EMBEDDING_DIMENSION,
                            model_used=self.MODEL_ID,
                            generation_time=0.0,  # Amortized across batch
                            success=True
                        ))

                        # Cache individual results
                        cache_key = text[:200]
                        self.cache[cache_key] = embedding_array

                    self.stats['embeddings_generated'] += len(batch)
                    logger.info(f"[BATCH SUCCESS] Generated {len(batch)} embeddings")

                else:
                    # Batch failed - fallback to individual processing
                    logger.warning(f"[BATCH FAILED] {response.status_code}, processing individually")
                    for text in batch:
                        results.append(self.embed_text(text))

            except Exception as e:
                logger.error(f"[BATCH ERROR] {e}, processing individually")
                # Fallback to individual processing for this batch
                for text in batch:
                    results.append(self.embed_text(text))

        successful = sum(1 for r in results if r.success)
        logger.info(f"[BATCH COMPLETE] {successful}/{len(texts)} successful")

        return results

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings generated by this service"""
        return self.EMBEDDING_DIMENSION

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive embedding service statistics"""
        stats = dict(self.stats)

        # Calculate averages
        if self.stats['embeddings_generated'] > 0:
            stats['avg_generation_time'] = (
                self.stats['total_generation_time'] /
                self.stats['embeddings_generated']
            )
        else:
            stats['avg_generation_time'] = 0.0

        # Cache statistics
        total_requests = self.stats['cache_hits'] + self.stats['cache_misses']
        if total_requests > 0:
            stats['cache_hit_rate'] = (
                self.stats['cache_hits'] / total_requests
            ) * 100
        else:
            stats['cache_hit_rate'] = 0.0

        # Add configuration info
        stats['configuration'] = {
            'backend': 'huggingface',
            'model_name': self.MODEL_ID,
            'embedding_dimension': self.EMBEDDING_DIMENSION,
            'cache_enabled': True,
            'cache_size': len(self.cache),
            'cache_ttl': 3600,
            'rate_limit_interval': self.min_interval
        }

        stats['is_available'] = self.is_available()

        return stats

    def clear_cache(self):
        """Clear embedding cache"""
        self.cache.clear()
        logger.info("[OK] Embedding cache cleared")

# Global embedding service instance
_embedding_service_instance: Optional[UnifiedEmbeddingService] = None

def get_embedding_service() -> Optional[UnifiedEmbeddingService]:
    """Get the global embedding service instance"""
    global _embedding_service_instance

    if _embedding_service_instance is None:
        try:
            from app_config import config
            _embedding_service_instance = UnifiedEmbeddingService(config)
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize embedding service: {e}")
            return None

    return _embedding_service_instance

def is_embedding_service_available() -> bool:
    """Check if embedding service is available"""
    service = get_embedding_service()
    return service is not None and service.is_available()

# Convenience functions (backward compatibility with old service)
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
    'UnifiedEmbeddingService',
    'get_embedding_service',
    'is_embedding_service_available',
    'is_embeddings_available',
    'embed_text',
    'embed_texts',
    'get_embedding_dimension',
    'get_embedding_stats'
]
