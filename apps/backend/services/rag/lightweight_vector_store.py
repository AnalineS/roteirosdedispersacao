# -*- coding: utf-8 -*-
"""
Lightweight Vector Store - Ultra-Low Memory Vector Storage
=========================================================

Minimal memory footprint vector store designed for medical systems
that MUST operate with <50% memory usage.

Key Features:
1. Ultra-low memory footprint (<2MB total)
2. Compressed vector storage
3. Lazy loading with smart eviction
4. Medical-priority indexing
5. Emergency memory management

Target: <2MB memory usage for vector operations
Priority: CRITICAL - Medical System Safety
Author: Claude Code - Medical Memory Optimization
Date: 2025-09-24
"""

import os
import gc
import sys
import json
import gzip
import pickle
import logging
import threading
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from collections import OrderedDict
import hashlib

logger = logging.getLogger(__name__)

class LightweightVectorStore:
    """
    Ultra-lightweight vector store for medical systems

    Memory optimization strategies:
    1. Compressed vector storage (gzip + pickle)
    2. Lazy loading (load only when needed)
    3. Minimal in-memory cache (max 50 vectors)
    4. Smart eviction based on medical priority
    5. Emergency memory pressure handling
    """

    def __init__(self, storage_path: str, max_memory_mb: float = 2.0):
        self.storage_path = storage_path
        self.max_memory_mb = max_memory_mb

        # Create storage directory
        os.makedirs(storage_path, exist_ok=True)

        # Ultra-minimal in-memory cache
        self.vector_cache = OrderedDict()  # Max 50 vectors
        self.max_cache_size = 50
        self.cache_ttl = timedelta(minutes=5)  # Very short TTL

        # Metadata index (minimal)
        self.metadata_index = {}
        self.vector_dimensions = None

        # Medical priority mapping
        self.medical_priorities = {
            'critical': 1.0,    # Dosing, contraindications
            'important': 0.7,   # Protocols, guidelines
            'general': 0.5,     # General medical info
            'reference': 0.3    # Reference materials
        }

        # Memory monitoring
        self.memory_pressure = False
        self.current_memory_usage = 0.0
        self.last_cleanup = datetime.now()

        # Statistics (minimal)
        self.stats = {
            'vectors_stored': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'disk_loads': 0,
            'memory_cleanups': 0,
            'emergency_evictions': 0
        }

        # Thread safety
        self.lock = threading.Lock()

        # Load existing data
        self._load_metadata_index()

        # Start memory monitoring
        self._start_memory_monitoring()

        logger.info(f"[LIGHTWEIGHT VECTOR] Initialized - Storage: {storage_path}, Limit: {max_memory_mb}MB")

    def _start_memory_monitoring(self):
        """Start background memory monitoring"""
        def monitor_memory():
            import time
            while True:
                try:
                    time.sleep(60)  # Check every minute
                    self._check_memory_pressure()

                    # Cleanup every 3 minutes
                    if (datetime.now() - self.last_cleanup).seconds > 180:
                        self._periodic_cleanup()

                except Exception as e:
                    logger.error(f"[LIGHTWEIGHT VECTOR] Memory monitoring error: {e}")
                    time.sleep(120)

        monitor_thread = threading.Thread(target=monitor_memory, daemon=True)
        monitor_thread.start()

    def _check_memory_pressure(self):
        """Check for memory pressure and take action"""
        try:
            # Estimate current memory usage
            self.current_memory_usage = self._estimate_memory_usage()

            # Memory pressure threshold (80% of limit)
            pressure_threshold = self.max_memory_mb * 0.8

            if self.current_memory_usage > pressure_threshold:
                self.memory_pressure = True
                logger.warning(f"[LIGHTWEIGHT VECTOR] Memory pressure: {self.current_memory_usage:.1f}MB/{self.max_memory_mb}MB")
                self._emergency_memory_reduction()
            else:
                self.memory_pressure = False

        except Exception as e:
            logger.error(f"[LIGHTWEIGHT VECTOR] Memory pressure check failed: {e}")
            # Assume pressure for safety
            self.memory_pressure = True

    def _estimate_memory_usage(self) -> float:
        """Estimate current memory usage"""
        try:
            total_bytes = 0

            # Cache memory
            for key, (timestamp, vector_data, metadata) in self.vector_cache.items():
                total_bytes += sys.getsizeof(key)
                total_bytes += sys.getsizeof(timestamp)
                total_bytes += sys.getsizeof(vector_data)
                total_bytes += sys.getsizeof(metadata)

            # Metadata index memory
            total_bytes += sys.getsizeof(self.metadata_index)

            return total_bytes / (1024 * 1024)  # Convert to MB

        except Exception as e:
            logger.error(f"[LIGHTWEIGHT VECTOR] Memory estimation failed: {e}")
            return self.max_memory_mb * 0.9  # Conservative estimate

    def _emergency_memory_reduction(self):
        """Emergency memory reduction for medical system safety"""
        with self.lock:
            try:
                logger.warning("[LIGHTWEIGHT VECTOR] Emergency memory reduction")

                initial_cache_size = len(self.vector_cache)

                # Clear all non-critical vectors from cache
                keys_to_remove = []
                for key, (timestamp, vector_data, metadata) in self.vector_cache.items():
                    priority = metadata.get('medical_priority', 'general')
                    if priority not in ['critical', 'important']:
                        keys_to_remove.append(key)

                for key in keys_to_remove:
                    del self.vector_cache[key]

                # If still over limit, remove half of remaining vectors
                if len(self.vector_cache) > self.max_cache_size // 2:
                    items_to_keep = self.max_cache_size // 4  # Keep only 25%
                    cache_items = list(self.vector_cache.items())

                    # Sort by medical priority and recency
                    cache_items.sort(key=lambda x: (
                        self.medical_priorities.get(x[1][2].get('medical_priority', 'general'), 0.1),
                        x[1][0]  # timestamp
                    ), reverse=True)

                    # Keep only the most important and recent
                    self.vector_cache.clear()
                    for key, (timestamp, vector_data, metadata) in cache_items[:items_to_keep]:
                        self.vector_cache[key] = (timestamp, vector_data, metadata)

                # Force garbage collection
                collected = gc.collect()

                final_cache_size = len(self.vector_cache)
                freed_vectors = initial_cache_size - final_cache_size

                self.stats['emergency_evictions'] += freed_vectors

                logger.warning(f"[LIGHTWEIGHT VECTOR] Emergency reduction complete - "
                             f"Freed {freed_vectors} vectors, GC collected {collected} objects")

            except Exception as e:
                logger.error(f"[LIGHTWEIGHT VECTOR] Emergency reduction failed: {e}")

    def _periodic_cleanup(self):
        """Periodic cleanup to prevent memory buildup"""
        with self.lock:
            try:
                now = datetime.now()

                # Remove expired cache entries
                expired_keys = []
                for key, (timestamp, vector_data, metadata) in self.vector_cache.items():
                    if now - timestamp > self.cache_ttl:
                        expired_keys.append(key)

                for key in expired_keys:
                    del self.vector_cache[key]

                # Trim cache to size limit
                while len(self.vector_cache) > self.max_cache_size:
                    self.vector_cache.popitem(last=False)

                self.last_cleanup = now
                self.stats['memory_cleanups'] += 1

                if expired_keys:
                    logger.debug(f"[LIGHTWEIGHT VECTOR] Periodic cleanup - {len(expired_keys)} expired vectors")

            except Exception as e:
                logger.error(f"[LIGHTWEIGHT VECTOR] Periodic cleanup failed: {e}")

    def _load_metadata_index(self):
        """Load metadata index from disk"""
        try:
            index_file = os.path.join(self.storage_path, "metadata_index.json.gz")
            if os.path.exists(index_file):
                with gzip.open(index_file, 'rt', encoding='utf-8') as f:
                    self.metadata_index = json.load(f)

                self.stats['vectors_stored'] = len(self.metadata_index)
                logger.info(f"[LIGHTWEIGHT VECTOR] Loaded {self.stats['vectors_stored']} vectors from index")

        except Exception as e:
            logger.error(f"[LIGHTWEIGHT VECTOR] Failed to load metadata index: {e}")
            self.metadata_index = {}

    def _save_metadata_index(self):
        """Save metadata index to disk (compressed)"""
        try:
            index_file = os.path.join(self.storage_path, "metadata_index.json.gz")
            with gzip.open(index_file, 'wt', encoding='utf-8') as f:
                json.dump(self.metadata_index, f, separators=(',', ':'))  # Minimal JSON

        except Exception as e:
            logger.error(f"[LIGHTWEIGHT VECTOR] Failed to save metadata index: {e}")

    def _generate_vector_id(self, text: str) -> str:
        """Generate compact vector ID"""
        # Use shorter hash for memory efficiency
        return hashlib.md5(text.encode()).hexdigest()[:12]

    def _get_vector_file_path(self, vector_id: str) -> str:
        """Get file path for vector storage"""
        # Use subdirectories to avoid too many files in one directory
        subdir = vector_id[:2]
        subdir_path = os.path.join(self.storage_path, subdir)
        os.makedirs(subdir_path, exist_ok=True)
        return os.path.join(subdir_path, f"{vector_id}.vec.gz")

    def add_vector(
        self,
        text: str,
        vector: np.ndarray,
        metadata: Optional[Dict] = None,
        medical_priority: str = 'general'
    ) -> str:
        """
        Add vector to store with medical priority

        Args:
            text: Original text
            vector: Embedding vector
            metadata: Optional metadata
            medical_priority: 'critical', 'important', 'general', 'reference'

        Returns:
            Vector ID if successful, None otherwise
        """
        if self.memory_pressure and medical_priority not in ['critical', 'important']:
            logger.warning("[LIGHTWEIGHT VECTOR] Skipping non-critical vector due to memory pressure")
            return None

        with self.lock:
            try:
                vector_id = self._generate_vector_id(text)

                # Prepare minimal metadata
                minimal_metadata = {
                    'medical_priority': medical_priority,
                    'text_length': len(text),
                    'text_preview': text[:50],  # Only first 50 chars
                    'added_at': datetime.now().isoformat(),
                    'priority_score': self.medical_priorities.get(medical_priority, 0.3)
                }

                # Add custom metadata (limited)
                if metadata:
                    for key, value in list(metadata.items())[:3]:  # Max 3 custom fields
                        minimal_metadata[key] = value

                # Set vector dimensions on first vector
                if self.vector_dimensions is None:
                    self.vector_dimensions = len(vector)

                # Store vector to disk (compressed)
                vector_file = self._get_vector_file_path(vector_id)
                vector_data = {
                    'vector': vector.tolist(),
                    'text': text[:200],  # Truncate text for memory
                    'metadata': minimal_metadata
                }

                with gzip.open(vector_file, 'wb') as f:
                    pickle.dump(vector_data, f, protocol=pickle.HIGHEST_PROTOCOL)

                # Update metadata index
                self.metadata_index[vector_id] = {
                    'file_path': vector_file,
                    'medical_priority': medical_priority,
                    'priority_score': minimal_metadata['priority_score'],
                    'text_preview': minimal_metadata['text_preview'],
                    'added_at': minimal_metadata['added_at']
                }

                # Add to cache if space available and important enough
                if (len(self.vector_cache) < self.max_cache_size and
                    minimal_metadata['priority_score'] > 0.5):

                    self.vector_cache[vector_id] = (
                        datetime.now(),
                        vector_data,
                        minimal_metadata
                    )

                self.stats['vectors_stored'] += 1

                # Save index periodically
                if self.stats['vectors_stored'] % 10 == 0:
                    self._save_metadata_index()

                return vector_id

            except Exception as e:
                logger.error(f"[LIGHTWEIGHT VECTOR] Failed to add vector: {e}")
                return None

    def search_similar(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
        min_score: float = 0.3,
        medical_priority_filter: Optional[List[str]] = None
    ) -> List[Tuple[str, float, Dict]]:
        """
        Search for similar vectors with medical priority filtering

        Args:
            query_vector: Query embedding
            top_k: Number of results
            min_score: Minimum similarity score
            medical_priority_filter: Filter by medical priorities

        Returns:
            List of (vector_id, score, metadata) tuples
        """
        with self.lock:
            try:
                results = []
                processed_count = 0
                max_process_limit = 100  # Process max 100 vectors for memory

                # First, check cached vectors
                for vector_id, (timestamp, vector_data, metadata) in self.vector_cache.items():
                    if processed_count >= max_process_limit:
                        break

                    # Apply priority filter
                    if (medical_priority_filter and
                        metadata.get('medical_priority') not in medical_priority_filter):
                        continue

                    try:
                        stored_vector = np.array(vector_data['vector'])

                        # Calculate cosine similarity
                        similarity = np.dot(query_vector, stored_vector) / (
                            np.linalg.norm(query_vector) * np.linalg.norm(stored_vector)
                        )

                        if similarity >= min_score:
                            results.append((vector_id, float(similarity), metadata))

                        processed_count += 1
                        self.stats['cache_hits'] += 1

                    except Exception as e:
                        logger.debug(f"[LIGHTWEIGHT VECTOR] Error processing cached vector: {e}")

                # If not enough results and not under memory pressure, load from disk
                if len(results) < top_k and not self.memory_pressure:
                    # Sort metadata index by priority for better results
                    sorted_vectors = sorted(
                        self.metadata_index.items(),
                        key=lambda x: x[1].get('priority_score', 0.1),
                        reverse=True
                    )

                    for vector_id, index_metadata in sorted_vectors:
                        if processed_count >= max_process_limit:
                            break

                        if vector_id in self.vector_cache:
                            continue  # Already processed

                        # Apply priority filter
                        if (medical_priority_filter and
                            index_metadata.get('medical_priority') not in medical_priority_filter):
                            continue

                        try:
                            # Load vector from disk
                            vector_data = self._load_vector_from_disk(vector_id)
                            if vector_data:
                                stored_vector = np.array(vector_data['vector'])

                                # Calculate similarity
                                similarity = np.dot(query_vector, stored_vector) / (
                                    np.linalg.norm(query_vector) * np.linalg.norm(stored_vector)
                                )

                                if similarity >= min_score:
                                    results.append((vector_id, float(similarity), vector_data['metadata']))

                                processed_count += 1
                                self.stats['disk_loads'] += 1

                        except Exception as e:
                            logger.debug(f"[LIGHTWEIGHT VECTOR] Error loading vector {vector_id}: {e}")

                # Sort by similarity and return top_k
                results.sort(key=lambda x: x[1], reverse=True)
                return results[:top_k]

            except Exception as e:
                logger.error(f"[LIGHTWEIGHT VECTOR] Search failed: {e}")
                return []

    def _load_vector_from_disk(self, vector_id: str) -> Optional[Dict]:
        """Load vector from disk storage"""
        try:
            if vector_id not in self.metadata_index:
                return None

            vector_file = self.metadata_index[vector_id]['file_path']

            if not os.path.exists(vector_file):
                return None

            with gzip.open(vector_file, 'rb') as f:
                vector_data = pickle.load(f)

            return vector_data

        except Exception as e:
            logger.debug(f"[LIGHTWEIGHT VECTOR] Failed to load vector {vector_id}: {e}")
            return None

    def get_vector(self, vector_id: str) -> Optional[Dict]:
        """Get vector by ID"""
        with self.lock:
            # Check cache first
            if vector_id in self.vector_cache:
                timestamp, vector_data, metadata = self.vector_cache[vector_id]
                self.stats['cache_hits'] += 1
                return vector_data

            # Load from disk
            self.stats['cache_misses'] += 1
            return self._load_vector_from_disk(vector_id)

    def delete_vector(self, vector_id: str) -> bool:
        """Delete vector from store"""
        with self.lock:
            try:
                # Remove from cache
                if vector_id in self.vector_cache:
                    del self.vector_cache[vector_id]

                # Remove from metadata index
                if vector_id in self.metadata_index:
                    vector_file = self.metadata_index[vector_id]['file_path']

                    # Delete file
                    if os.path.exists(vector_file):
                        os.remove(vector_file)

                    del self.metadata_index[vector_id]
                    self.stats['vectors_stored'] -= 1

                    # Save updated index
                    self._save_metadata_index()
                    return True

                return False

            except Exception as e:
                logger.error(f"[LIGHTWEIGHT VECTOR] Failed to delete vector {vector_id}: {e}")
                return False

    def clear_cache(self):
        """Clear in-memory cache"""
        with self.lock:
            cache_size = len(self.vector_cache)
            self.vector_cache.clear()
            logger.info(f"[LIGHTWEIGHT VECTOR] Cache cleared - {cache_size} vectors removed")

    def clear_all(self):
        """Clear all vectors (emergency use only)"""
        with self.lock:
            try:
                # Clear cache
                self.vector_cache.clear()

                # Delete all vector files
                for vector_id, index_metadata in self.metadata_index.items():
                    vector_file = index_metadata['file_path']
                    if os.path.exists(vector_file):
                        os.remove(vector_file)

                # Clear metadata index
                self.metadata_index.clear()
                self.stats['vectors_stored'] = 0

                # Save empty index
                self._save_metadata_index()

                # Force garbage collection
                gc.collect()

                logger.warning("[LIGHTWEIGHT VECTOR] All vectors cleared - emergency procedure")

            except Exception as e:
                logger.error(f"[LIGHTWEIGHT VECTOR] Clear all failed: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        with self.lock:
            return {
                'vectors_stored': self.stats['vectors_stored'],
                'cache_size': len(self.vector_cache),
                'max_cache_size': self.max_cache_size,
                'vector_dimensions': self.vector_dimensions,
                'memory_usage_mb': round(self.current_memory_usage, 2),
                'max_memory_mb': self.max_memory_mb,
                'memory_pressure': self.memory_pressure,
                'stats': dict(self.stats),
                'medical_priorities': list(self.medical_priorities.keys())
            }

    def force_memory_optimization(self) -> Dict[str, Any]:
        """Force immediate memory optimization"""
        with self.lock:
            before_stats = self.get_stats()

            # Force emergency reduction
            self._emergency_memory_reduction()

            # Force cleanup
            self._periodic_cleanup()

            # Force garbage collection
            collected = gc.collect()

            after_stats = self.get_stats()

            return {
                'before': before_stats,
                'after': after_stats,
                'gc_collected': collected,
                'optimization_performed': True,
                'timestamp': datetime.now().isoformat()
            }

# Global lightweight vector store
_lightweight_vector_store = None

def get_lightweight_vector_store(storage_path: str = None, max_memory_mb: float = 2.0) -> LightweightVectorStore:
    """Get global lightweight vector store instance"""
    global _lightweight_vector_store

    if _lightweight_vector_store is None:
        if storage_path is None:
            storage_path = os.path.join(os.getcwd(), "data", "vectors_lightweight")

        _lightweight_vector_store = LightweightVectorStore(storage_path, max_memory_mb)
        logger.info(f"[LIGHTWEIGHT VECTOR] Global instance initialized - {storage_path}")

    return _lightweight_vector_store

def clear_lightweight_vector_memory():
    """Clear lightweight vector store memory for emergency"""
    try:
        store = get_lightweight_vector_store()
        result = store.force_memory_optimization()
        logger.info("[LIGHTWEIGHT VECTOR] Emergency memory cleared")
        return result
    except Exception as e:
        logger.error(f"[LIGHTWEIGHT VECTOR] Emergency memory clear failed: {e}")
        return {'error': str(e)}