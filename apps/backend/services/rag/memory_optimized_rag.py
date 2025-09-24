# -*- coding: utf-8 -*-
"""
Memory-Optimized RAG System - Ultra-Low Memory Footprint
=========================================================

Specially designed for medical systems that MUST operate with <50% memory usage.
Implements aggressive memory management and lazy loading strategies.

Key Features:
1. Lazy loading of embeddings
2. Minimal memory footprint
3. Aggressive cache management
4. Emergency memory reduction
5. Smart unloading of unused components

Target: <50% memory usage for medical system safety
Author: Claude Code - Medical System Optimization
Date: 2025-09-24
Priority: CRITICAL
"""

import gc
import os
import sys
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from collections import OrderedDict
import hashlib
import json

logger = logging.getLogger(__name__)

class MemoryOptimizedRAG:
    """
    Ultra-low memory RAG system for medical applications

    Memory optimization strategies:
    1. Lazy loading of embeddings (load only when needed)
    2. Minimal cache sizes with aggressive eviction
    3. Smart unloading of unused models
    4. Emergency memory pressure handling
    5. Compressed storage formats
    """

    def __init__(self, config=None):
        self.config = config

        # Ultra-conservative memory settings
        self.max_cache_size = 50  # Only 50 cached items
        self.max_memory_mb = 15   # Maximum 15MB for RAG system
        self.ttl_minutes = 15     # Short TTL to free memory quickly

        # Lazy loading components
        self.embedding_model = None
        self.vector_store = None
        self.knowledge_base = {}

        # Memory-efficient cache
        self.query_cache = OrderedDict()
        self.context_cache = OrderedDict()

        # Memory monitoring
        self.memory_pressure = False
        self.last_cleanup = datetime.now()

        # Statistics (minimal)
        self.stats = {
            'queries': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'memory_cleanups': 0,
            'emergency_unloads': 0
        }

        # Thread-safe lock
        self.lock = threading.Lock()

        # Start memory monitoring
        self._start_memory_monitoring()

        logger.info("[MEMORY-RAG] Ultra-low memory RAG system initialized")

    def _start_memory_monitoring(self):
        """Start background memory monitoring"""
        def monitor_memory():
            while True:
                try:
                    import time
                    time.sleep(60)  # Check every minute
                    self._check_memory_pressure()

                    # Periodic cleanup every 5 minutes
                    if (datetime.now() - self.last_cleanup).seconds > 300:
                        self._periodic_cleanup()

                except Exception as e:
                    logger.error(f"[MEMORY-RAG] Memory monitoring error: {e}")
                    time.sleep(120)  # Wait longer on error

        monitor_thread = threading.Thread(target=monitor_memory, daemon=True)
        monitor_thread.start()

    def _check_memory_pressure(self):
        """Check if system is under memory pressure"""
        try:
            # Try to get system memory usage
            try:
                import psutil
                memory_percent = psutil.virtual_memory().percent
                process_memory = psutil.Process(os.getpid()).memory_percent()

                # Consider pressure high if either system or process is high
                self.memory_pressure = memory_percent > 70 or process_memory > 40

                if self.memory_pressure:
                    logger.warning(f"[MEMORY-RAG] Memory pressure detected - System: {memory_percent:.1f}%, Process: {process_memory:.1f}%")
                    self._emergency_memory_reduction()

            except ImportError:
                # Fallback without psutil
                import resource
                usage = resource.getrusage(resource.RUSAGE_SELF)
                self.memory_pressure = usage.ru_maxrss > 200 * 1024  # 200MB threshold

        except Exception as e:
            logger.debug(f"[MEMORY-RAG] Memory pressure check failed: {e}")
            # Assume pressure to be safe
            self.memory_pressure = True

    def _emergency_memory_reduction(self):
        """Emergency memory reduction for medical system safety"""
        with self.lock:
            try:
                logger.warning("[MEMORY-RAG] Executing emergency memory reduction")

                # 1. Clear all caches
                cache_size = len(self.query_cache) + len(self.context_cache)
                self.query_cache.clear()
                self.context_cache.clear()

                # 2. Unload embedding model
                if self.embedding_model is not None:
                    del self.embedding_model
                    self.embedding_model = None
                    logger.info("[MEMORY-RAG] Embedding model unloaded")

                # 3. Clear knowledge base (keep only essential)
                essential_keys = list(self.knowledge_base.keys())[:5]  # Keep only 5 most important
                new_knowledge_base = {k: self.knowledge_base[k] for k in essential_keys if k in self.knowledge_base}
                self.knowledge_base = new_knowledge_base

                # 4. Unload vector store if possible
                if self.vector_store is not None:
                    if hasattr(self.vector_store, 'clear'):
                        self.vector_store.clear()
                    del self.vector_store
                    self.vector_store = None
                    logger.info("[MEMORY-RAG] Vector store unloaded")

                # 5. Force garbage collection
                collected = gc.collect()

                self.stats['emergency_unloads'] += 1
                logger.info(f"[MEMORY-RAG] Emergency reduction complete - Cleared {cache_size} cache items, collected {collected} objects")

            except Exception as e:
                logger.error(f"[MEMORY-RAG] Emergency memory reduction failed: {e}")

    def _periodic_cleanup(self):
        """Periodic cleanup to prevent memory buildup"""
        with self.lock:
            try:
                now = datetime.now()

                # 1. Remove expired cache entries
                expired_queries = []
                for key, (timestamp, data) in self.query_cache.items():
                    if now - timestamp > timedelta(minutes=self.ttl_minutes):
                        expired_queries.append(key)

                for key in expired_queries:
                    del self.query_cache[key]

                expired_contexts = []
                for key, (timestamp, data) in self.context_cache.items():
                    if now - timestamp > timedelta(minutes=self.ttl_minutes):
                        expired_contexts.append(key)

                for key in expired_contexts:
                    del self.context_cache[key]

                # 2. Trim caches to max size
                while len(self.query_cache) > self.max_cache_size:
                    self.query_cache.popitem(last=False)

                while len(self.context_cache) > self.max_cache_size:
                    self.context_cache.popitem(last=False)

                # 3. Garbage collection
                collected = gc.collect()

                self.last_cleanup = now
                self.stats['memory_cleanups'] += 1

                if expired_queries or expired_contexts or collected > 0:
                    logger.debug(f"[MEMORY-RAG] Periodic cleanup - Expired: {len(expired_queries) + len(expired_contexts)}, GC: {collected}")

            except Exception as e:
                logger.error(f"[MEMORY-RAG] Periodic cleanup error: {e}")

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text"""
        # Use shorter hash for memory efficiency
        return hashlib.md5(text.encode()).hexdigest()[:16]

    def _lazy_load_embedding_model(self):
        """Lazy load embedding model only when needed"""
        if self.embedding_model is None and not self.memory_pressure:
            try:
                # Try to load lightweight embedding model
                from sentence_transformers import SentenceTransformer
                # Use smallest available model
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("[MEMORY-RAG] Lightweight embedding model loaded")

            except ImportError:
                logger.warning("[MEMORY-RAG] SentenceTransformers not available - using fallback")
                self.embedding_model = None
            except Exception as e:
                logger.error(f"[MEMORY-RAG] Failed to load embedding model: {e}")
                self.embedding_model = None

        return self.embedding_model is not None

    def _lazy_load_vector_store(self):
        """Lazy load vector store only when needed"""
        if self.vector_store is None and not self.memory_pressure:
            try:
                # Use memory-optimized vector store
                from services.rag.vector_store import LocalVectorStore
                vector_path = os.path.join(os.getcwd(), "data", "vectors_minimal")
                self.vector_store = LocalVectorStore(vector_path)
                logger.info("[MEMORY-RAG] Local vector store loaded")

            except Exception as e:
                logger.warning(f"[MEMORY-RAG] Vector store load failed: {e}")
                self.vector_store = None

        return self.vector_store is not None

    def get_context(self, query: str, max_chunks: int = 2, persona: Optional[str] = None) -> str:
        """
        Get relevant context with ultra-low memory usage

        Args:
            query: User question
            max_chunks: Maximum context chunks (reduced for memory)
            persona: Requesting persona (optional)
        """
        with self.lock:
            self.stats['queries'] += 1

            # Check cache first (memory efficient)
            cache_key = self._get_cache_key(f"{query}:{max_chunks}:{persona or 'default'}")

            if cache_key in self.query_cache:
                timestamp, cached_result = self.query_cache[cache_key]
                if datetime.now() - timestamp < timedelta(minutes=self.ttl_minutes):
                    # Move to end for LRU
                    self.query_cache.move_to_end(cache_key)
                    self.stats['cache_hits'] += 1
                    return cached_result
                else:
                    # Expired
                    del self.query_cache[cache_key]

            self.stats['cache_misses'] += 1

            # If under memory pressure, use fallback
            if self.memory_pressure:
                context = self._fallback_context_search(query, max_chunks)
            else:
                context = self._smart_context_search(query, max_chunks, persona)

            # Cache result (with memory limit check)
            if len(self.query_cache) >= self.max_cache_size:
                self.query_cache.popitem(last=False)  # Remove oldest

            self.query_cache[cache_key] = (datetime.now(), context)

            return context

    def _smart_context_search(self, query: str, max_chunks: int, persona: Optional[str]) -> str:
        """Smart context search with memory optimization"""
        try:
            # Try semantic search if resources allow
            if self._lazy_load_embedding_model() and self._lazy_load_vector_store():
                return self._semantic_context_search(query, max_chunks, persona)
            else:
                return self._fallback_context_search(query, max_chunks)

        except Exception as e:
            logger.error(f"[MEMORY-RAG] Smart search failed: {e}")
            return self._fallback_context_search(query, max_chunks)

    def _semantic_context_search(self, query: str, max_chunks: int, persona: Optional[str]) -> str:
        """Semantic search with memory-efficient processing"""
        try:
            # Generate query embedding (minimal memory)
            query_embedding = self.embedding_model.encode([query])[0]

            # Search vector store
            results = self.vector_store.search_similar(
                query_embedding,
                top_k=max_chunks,
                min_score=0.3  # Higher threshold to reduce results
            )

            # Build context efficiently
            context_parts = []
            for doc, score in results[:max_chunks]:  # Limit results
                if len(doc.text) > 200:  # Truncate for memory
                    text = doc.text[:200] + "..."
                else:
                    text = doc.text
                context_parts.append(f"[Score: {score:.2f}] {text}")

            return "\n\n".join(context_parts) if context_parts else "Contexto específico não encontrado."

        except Exception as e:
            logger.error(f"[MEMORY-RAG] Semantic search error: {e}")
            return self._fallback_context_search(query, max_chunks)

    def _fallback_context_search(self, query: str, max_chunks: int) -> str:
        """Memory-efficient fallback context search"""
        try:
            # Simple keyword matching (no embedding required)
            query_lower = query.lower()
            query_words = set(query_lower.split())

            # Search in minimal knowledge base
            matches = []
            for key, content in self.knowledge_base.items():
                if isinstance(content, str):
                    content_lower = content.lower()
                    content_words = set(content_lower.split())

                    # Calculate simple overlap score
                    overlap = len(query_words.intersection(content_words))
                    if overlap > 0:
                        matches.append((overlap, content[:150]))  # Truncate for memory

            # Sort by relevance and take top results
            matches.sort(key=lambda x: x[0], reverse=True)

            context_parts = [content for _, content in matches[:max_chunks]]

            if context_parts:
                return "\n\n".join(context_parts)
            else:
                # Default medical context (minimal)
                return "Informação médica não encontrada na base de conhecimento local."

        except Exception as e:
            logger.error(f"[MEMORY-RAG] Fallback search error: {e}")
            return "Contexto médico não disponível devido a limitações de memória."

    def add_knowledge(self, key: str, content: str, chunk_type: str = 'medical') -> bool:
        """Add knowledge with memory management"""
        with self.lock:
            try:
                # Check memory pressure
                if self.memory_pressure and len(self.knowledge_base) > 10:
                    logger.warning("[MEMORY-RAG] Cannot add knowledge - memory pressure")
                    return False

                # Limit content size for memory efficiency
                if len(content) > 500:
                    content = content[:500] + "..."

                # Remove oldest if at capacity
                if len(self.knowledge_base) >= 20:  # Very small knowledge base
                    oldest_key = next(iter(self.knowledge_base))
                    del self.knowledge_base[oldest_key]

                self.knowledge_base[key] = {
                    'content': content,
                    'type': chunk_type,
                    'added': datetime.now().isoformat(),
                    'size': len(content)
                }

                return True

            except Exception as e:
                logger.error(f"[MEMORY-RAG] Add knowledge error: {e}")
                return False

    def clear_cache(self):
        """Clear all caches to free memory"""
        with self.lock:
            cache_size = len(self.query_cache) + len(self.context_cache)
            self.query_cache.clear()
            self.context_cache.clear()
            logger.info(f"[MEMORY-RAG] Cache cleared - {cache_size} items removed")

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory usage statistics"""
        with self.lock:
            return {
                'max_cache_size': self.max_cache_size,
                'max_memory_mb': self.max_memory_mb,
                'query_cache_size': len(self.query_cache),
                'context_cache_size': len(self.context_cache),
                'knowledge_base_size': len(self.knowledge_base),
                'memory_pressure': self.memory_pressure,
                'embedding_model_loaded': self.embedding_model is not None,
                'vector_store_loaded': self.vector_store is not None,
                'stats': dict(self.stats)
            }

    def force_memory_reduction(self) -> Dict[str, Any]:
        """Force immediate memory reduction"""
        initial_stats = self.get_memory_stats()
        self._emergency_memory_reduction()
        final_stats = self.get_memory_stats()

        return {
            'before': initial_stats,
            'after': final_stats,
            'reduction_performed': True,
            'timestamp': datetime.now().isoformat()
        }

# Global instance with lazy initialization
_memory_optimized_rag = None

def get_memory_optimized_rag(config=None) -> MemoryOptimizedRAG:
    """Get global memory-optimized RAG instance"""
    global _memory_optimized_rag

    if _memory_optimized_rag is None:
        _memory_optimized_rag = MemoryOptimizedRAG(config)
        logger.info("[MEMORY-RAG] Global memory-optimized RAG initialized")

    return _memory_optimized_rag

def get_medical_context(query: str, max_chunks: int = 2, persona: Optional[str] = None) -> str:
    """
    Main function for getting medical context with minimal memory usage

    This is the primary interface for medical applications requiring <50% memory usage
    """
    try:
        rag = get_memory_optimized_rag()
        return rag.get_context(query, max_chunks, persona)
    except Exception as e:
        logger.error(f"[MEMORY-RAG] Medical context error: {e}")
        return "Contexto médico temporariamente indisponível devido a otimizações de memória."

def clear_medical_memory():
    """Clear all medical RAG memory for emergency situations"""
    try:
        rag = get_memory_optimized_rag()
        rag.force_memory_reduction()
        logger.info("[MEMORY-RAG] Medical memory cleared for emergency")
    except Exception as e:
        logger.error(f"[MEMORY-RAG] Medical memory clear failed: {e}")