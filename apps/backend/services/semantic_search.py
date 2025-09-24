# -*- coding: utf-8 -*-
"""
Semantic Search Service - Real implementation with embedding generation and vector search
Provides comprehensive semantic search capabilities for medical content
"""

import os
import logging
import hashlib
import time
from typing import List, Dict, Optional, Tuple, Any, Union
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

# Import vector store
try:
    from services.vector_store import VectorDocument, get_vector_store, is_vector_store_available
    VECTOR_STORE_AVAILABLE = True
except ImportError:
    VECTOR_STORE_AVAILABLE = False
    VectorDocument = None

@dataclass
class SearchResult:
    """Result from semantic search"""
    document_id: str
    text: str
    score: float
    weighted_score: float
    chunk_type: str
    priority: float
    source_file: Optional[str]
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'document_id': self.document_id,
            'text': self.text,
            'score': self.score,
            'weighted_score': self.weighted_score,
            'chunk_type': self.chunk_type,
            'priority': self.priority,
            'source_file': self.source_file,
            'metadata': self.metadata
        }

class EmbeddingService:
    """
    Real embedding service using sentence-transformers or OpenAI API
    Provides high-quality embeddings for semantic search
    """

    def __init__(self, config):
        self.config = config
        self.model = None
        self.model_name = getattr(config, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
        self.embedding_dimension = getattr(config, 'EMBEDDING_DIMENSION', 384)
        self.use_openai = getattr(config, 'USE_OPENAI_EMBEDDINGS', False)
        self.openai_api_key = getattr(config, 'OPENAI_API_KEY', os.getenv('OPENAI_API_KEY'))

        # Statistics
        self.stats = {
            'embeddings_generated': 0,
            'total_time': 0.0,
            'avg_time_per_embedding': 0.0,
            'model_loaded': False,
            'backend': 'none'
        }

        self._initialize_model()

    def _initialize_model(self):
        """Initialize embedding model"""
        try:
            if self.use_openai and OPENAI_AVAILABLE and self.openai_api_key:
                # Use OpenAI embeddings
                openai.api_key = self.openai_api_key
                self.stats['backend'] = 'openai'
                self.stats['model_loaded'] = True
                logger.info("[OK] OpenAI embeddings initialized")

            elif SENTENCE_TRANSFORMERS_AVAILABLE:
                # Use sentence-transformers
                self.model = SentenceTransformer(self.model_name)
                self.stats['backend'] = 'sentence_transformers'
                self.stats['model_loaded'] = True
                logger.info(f"[OK] SentenceTransformer model loaded: {self.model_name}")

            else:
                logger.warning("[WARNING] No embedding service available - install sentence-transformers or configure OpenAI")

        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize embedding model: {e}")
            self.stats['model_loaded'] = False

    def is_available(self) -> bool:
        """Check if embedding service is available"""
        return self.stats['model_loaded']

    def embed_text(self, text: str) -> Optional[np.ndarray]:
        """Generate embedding for a single text"""
        if not self.is_available():
            return None

        try:
            start_time = time.time()

            if self.stats['backend'] == 'openai':
                # Use OpenAI API
                response = openai.Embedding.create(
                    model="text-embedding-ada-002",
                    input=text
                )
                embedding = np.array(response['data'][0]['embedding'])

            elif self.stats['backend'] == 'sentence_transformers':
                # Use sentence-transformers
                embedding = self.model.encode(text, convert_to_numpy=True)

            else:
                return None

            # Update statistics
            elapsed_time = time.time() - start_time
            self.stats['embeddings_generated'] += 1
            self.stats['total_time'] += elapsed_time
            self.stats['avg_time_per_embedding'] = self.stats['total_time'] / self.stats['embeddings_generated']

            return embedding

        except Exception as e:
            logger.error(f"[ERROR] Failed to generate embedding: {e}")
            return None

    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[Optional[np.ndarray]]:
        """Generate embeddings for multiple texts efficiently"""
        if not self.is_available():
            return [None] * len(texts)

        try:
            embeddings = []

            if self.stats['backend'] == 'openai':
                # OpenAI API doesn't support batch processing efficiently
                # Process individually but could be optimized
                for text in texts:
                    embedding = self.embed_text(text)
                    embeddings.append(embedding)

            elif self.stats['backend'] == 'sentence_transformers':
                # Process in batches for efficiency
                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]
                    batch_embeddings = self.model.encode(batch, convert_to_numpy=True)

                    # Handle single embedding vs batch
                    if len(batch) == 1:
                        embeddings.append(batch_embeddings)
                    else:
                        embeddings.extend(batch_embeddings)

            return embeddings

        except Exception as e:
            logger.error(f"[ERROR] Failed to generate batch embeddings: {e}")
            return [None] * len(texts)

    def embed_query(self, query: str) -> Optional[np.ndarray]:
        """Generate embedding for search query (may use different processing)"""
        # For sentence-transformers v5.1+, could use different method
        # For now, use same as embed_text
        return self.embed_text(query)

    def embed_document(self, document: str) -> Optional[np.ndarray]:
        """Generate embedding for document (may use different processing)"""
        # For sentence-transformers v5.1+, could use different method
        # For now, use same as embed_text
        return self.embed_text(document)

    def get_statistics(self) -> Dict[str, Any]:
        """Get embedding service statistics"""
        return dict(self.stats)

class SemanticSearchEngine:
    """
    Real semantic search engine combining embeddings with vector storage
    Provides medical-context-aware search with relevance scoring
    """

    def __init__(self, config):
        self.config = config
        self.embedding_service = EmbeddingService(config)
        self.vector_store = get_vector_store() if VECTOR_STORE_AVAILABLE else None

        # Medical content weights for relevance scoring
        self.content_weights = {
            'dosage': 1.0,          # Highest priority - medication dosages
            'contraindication': 0.95, # Critical safety information
            'interaction': 0.9,      # Drug interactions
            'safety': 0.85,         # Safety warnings
            'protocol': 0.8,        # Clinical protocols
            'administration': 0.75,  # Administration guidelines
            'mechanism': 0.7,       # Mechanism of action
            'pharmacokinetics': 0.65, # Pharmacokinetic data
            'general': 0.5          # General information
        }

        # Search cache for performance
        self.search_cache = {}
        self.cache_ttl = 3600  # 1 hour

        # Statistics
        self.stats = {
            'searches_performed': 0,
            'cache_hits': 0,
            'documents_indexed': 0,
            'avg_search_time': 0.0,
            'total_search_time': 0.0
        }

        logger.info(f"[OK] SemanticSearchEngine initialized - Embeddings: {self.embedding_service.is_available()}, Vector Store: {self.vector_store is not None}")

    def is_available(self) -> bool:
        """Check if semantic search is fully available"""
        return (
            self.embedding_service.is_available() and
            self.vector_store is not None and
            self.vector_store.is_available()
        )

    def index_document(
        self,
        text: str,
        chunk_type: str = 'general',
        priority: float = 0.5,
        source_file: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Index a document for semantic search"""
        if not self.is_available():
            logger.warning("[WARNING] Semantic search not available for indexing")
            return False

        try:
            # Generate document ID
            doc_id = self._generate_document_id(text, source_file or 'unknown')

            # Generate embedding
            embedding = self.embedding_service.embed_document(text)
            if embedding is None:
                logger.error("[ERROR] Failed to generate embedding for document")
                return False

            # Create vector document
            vector_doc = VectorDocument(
                id=doc_id,
                text=text,
                embedding=embedding,
                metadata=metadata or {},
                chunk_type=chunk_type,
                priority=priority,
                source_file=source_file,
                created_at=datetime.now()
            )

            # Add to vector store
            success = self.vector_store.add_document(vector_doc)

            if success:
                self.stats['documents_indexed'] += 1
                logger.debug(f"[OK] Document indexed: {doc_id}")

            return success

        except Exception as e:
            logger.error(f"[ERROR] Failed to index document: {e}")
            return False

    def index_documents_batch(
        self,
        documents: List[Dict[str, Any]],
        batch_size: int = 32
    ) -> Tuple[int, int]:
        """
        Index multiple documents efficiently

        Args:
            documents: List of dicts with keys: text, chunk_type, priority, source_file, metadata
            batch_size: Batch size for embedding generation

        Returns:
            (successful_count, failed_count)
        """
        if not self.is_available():
            return 0, len(documents)

        successful = 0
        failed = 0

        try:
            # Process in batches for efficiency
            for i in range(0, len(documents), batch_size):
                batch = documents[i:i + batch_size]

                # Extract texts for batch embedding
                texts = [doc['text'] for doc in batch]

                # Generate embeddings in batch
                embeddings = self.embedding_service.embed_batch(texts)

                # Index each document with its embedding
                for doc_data, embedding in zip(batch, embeddings):
                    if embedding is not None:
                        # Generate document ID
                        doc_id = self._generate_document_id(
                            doc_data['text'],
                            doc_data.get('source_file', 'unknown')
                        )

                        # Create vector document
                        vector_doc = VectorDocument(
                            id=doc_id,
                            text=doc_data['text'],
                            embedding=embedding,
                            metadata=doc_data.get('metadata', {}),
                            chunk_type=doc_data.get('chunk_type', 'general'),
                            priority=doc_data.get('priority', 0.5),
                            source_file=doc_data.get('source_file'),
                            created_at=datetime.now()
                        )

                        # Add to vector store
                        if self.vector_store.add_document(vector_doc):
                            successful += 1
                        else:
                            failed += 1
                    else:
                        failed += 1

                logger.info(f"[OK] Batch processed: {successful}/{successful + failed} documents indexed")

            self.stats['documents_indexed'] += successful

        except Exception as e:
            logger.error(f"[ERROR] Batch indexing failed: {e}")
            failed += len(documents) - successful

        return successful, failed

    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.3,
        chunk_types: Optional[List[str]] = None,
        use_medical_weights: bool = True
    ) -> List[SearchResult]:
        """
        Perform semantic search with medical relevance scoring

        Args:
            query: Search query
            top_k: Maximum number of results
            min_score: Minimum similarity score
            chunk_types: Filter by specific chunk types
            use_medical_weights: Apply medical relevance weights

        Returns:
            List of search results ordered by relevance
        """
        if not self.is_available():
            logger.warning("[WARNING] Semantic search not available")
            return []

        # Check cache
        cache_key = f"{query}:{top_k}:{min_score}:{chunk_types}:{use_medical_weights}"
        if cache_key in self.search_cache:
            cached_result, cached_time = self.search_cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < self.cache_ttl:
                self.stats['cache_hits'] += 1
                return cached_result

        try:
            start_time = time.time()

            # Generate query embedding
            query_embedding = self.embedding_service.embed_query(query)
            if query_embedding is None:
                logger.error("[ERROR] Failed to generate query embedding")
                return []

            # Search vector store
            vector_results = self.vector_store.search_similar(
                query_embedding=query_embedding,
                top_k=top_k * 2,  # Get more results for filtering
                min_score=min_score * 0.8,  # Lower threshold for weighted scoring
                chunk_types=chunk_types
            )

            # Convert to SearchResults with medical weighting
            search_results = []
            for vector_doc, similarity_score in vector_results:
                # Calculate weighted score
                if use_medical_weights:
                    weight = self.content_weights.get(vector_doc.chunk_type, 0.5)
                    weighted_score = similarity_score * weight * vector_doc.priority
                else:
                    weighted_score = similarity_score * vector_doc.priority

                # Apply final threshold
                if weighted_score >= min_score:
                    result = SearchResult(
                        document_id=vector_doc.id,
                        text=vector_doc.text,
                        score=similarity_score,
                        weighted_score=weighted_score,
                        chunk_type=vector_doc.chunk_type,
                        priority=vector_doc.priority,
                        source_file=vector_doc.source_file,
                        metadata=vector_doc.metadata
                    )
                    search_results.append(result)

            # Sort by weighted score
            search_results.sort(key=lambda x: x.weighted_score, reverse=True)

            # Limit to top_k
            search_results = search_results[:top_k]

            # Update statistics
            search_time = time.time() - start_time
            self.stats['searches_performed'] += 1
            self.stats['total_search_time'] += search_time
            self.stats['avg_search_time'] = self.stats['total_search_time'] / self.stats['searches_performed']

            # Cache results
            self.search_cache[cache_key] = (search_results, datetime.now())

            # Clean cache if it gets too large
            if len(self.search_cache) > 100:
                self._clean_cache()

            logger.info(f"[OK] Search completed: {len(search_results)} results in {search_time:.3f}s")
            return search_results

        except Exception as e:
            logger.error(f"[ERROR] Search failed: {e}")
            return []

    def search_medical_context(
        self,
        query: str,
        context_type: str = 'mixed',
        max_chunks: int = 3
    ) -> str:
        """
        Search for medical context optimized for RAG systems

        Args:
            query: Medical query
            context_type: 'critical', 'protocol', 'general', 'mixed'
            max_chunks: Maximum number of context chunks

        Returns:
            Formatted context string for RAG
        """
        # Define chunk type filters
        type_filters = {
            'critical': ['dosage', 'contraindication', 'interaction', 'safety'],
            'protocol': ['protocol', 'administration', 'guideline'],
            'general': ['mechanism', 'pharmacokinetics', 'general'],
            'mixed': None  # All types
        }

        chunk_filter = type_filters.get(context_type, None)

        # Perform search
        results = self.search(
            query=query,
            top_k=max_chunks,
            chunk_types=chunk_filter,
            use_medical_weights=True
        )

        if not results:
            return ""

        # Format context
        context_parts = []
        for i, result in enumerate(results):
            # Add priority indicator
            priority_indicator = ""
            if result.priority >= 0.9:
                priority_indicator = "[CRÍTICO] "
            elif result.priority >= 0.7:
                priority_indicator = "[IMPORTANTE] "

            # Add source info
            source_info = f" (Fonte: {result.source_file})" if result.source_file else ""

            # Format context piece
            context_piece = f"{priority_indicator}{result.text}{source_info}"
            context_parts.append(context_piece)

        # Join context
        context = "\n\n".join(context_parts)

        # Add metadata
        avg_score = np.mean([r.weighted_score for r in results]) if results else 0.0
        metadata = f"\n\n[Contexto baseado em {len(results)} fontes médicas - Relevância média: {avg_score:.2f}]"

        return context + metadata

    def _generate_document_id(self, text: str, source: str) -> str:
        """Generate unique ID for document"""
        content = f"{source}:{text[:200]}"  # Use first 200 chars
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def _clean_cache(self):
        """Clean expired cache entries"""
        current_time = datetime.now()
        expired_keys = []

        for key, (_, cached_time) in self.search_cache.items():
            if (current_time - cached_time).total_seconds() > self.cache_ttl:
                expired_keys.append(key)

        for key in expired_keys:
            del self.search_cache[key]

        if expired_keys:
            logger.debug(f"[OK] Cache cleaned: {len(expired_keys)} expired entries removed")

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive search engine statistics"""
        stats = dict(self.stats)

        # Add component statistics
        stats['embedding_service'] = self.embedding_service.get_statistics()

        if self.vector_store:
            stats['vector_store'] = self.vector_store.get_stats()

        stats['cache_size'] = len(self.search_cache)
        stats['is_available'] = self.is_available()

        return stats

    def clear_cache(self):
        """Clear search cache"""
        self.search_cache.clear()
        logger.info("[OK] Search cache cleared")

# Global semantic search instance
_semantic_search_instance: Optional[SemanticSearchEngine] = None

def get_semantic_search() -> Optional[SemanticSearchEngine]:
    """Get the global semantic search engine instance"""
    global _semantic_search_instance

    if _semantic_search_instance is None:
        try:
            from app_config import config
            _semantic_search_instance = SemanticSearchEngine(config)
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize semantic search: {e}")
            return None

    return _semantic_search_instance

def is_semantic_search_available() -> bool:
    """Check if semantic search is available"""
    engine = get_semantic_search()
    return engine is not None and engine.is_available()

# Convenience functions
def search_medical_content(
    query: str,
    top_k: int = 5,
    context_type: str = 'mixed'
) -> List[SearchResult]:
    """Convenience function for medical content search"""
    engine = get_semantic_search()
    if engine and engine.is_available():
        return engine.search(query, top_k=top_k)
    return []

def get_medical_context(
    query: str,
    max_chunks: int = 3,
    context_type: str = 'mixed'
) -> str:
    """Convenience function for getting medical context"""
    engine = get_semantic_search()
    if engine and engine.is_available():
        return engine.search_medical_context(query, context_type, max_chunks)
    return ""

def index_medical_document(
    text: str,
    chunk_type: str = 'general',
    priority: float = 0.5,
    source_file: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """Convenience function for indexing medical documents"""
    engine = get_semantic_search()
    if engine and engine.is_available():
        return engine.index_document(text, chunk_type, priority, source_file, metadata)
    return False