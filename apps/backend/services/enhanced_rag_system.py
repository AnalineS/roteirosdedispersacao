# -*- coding: utf-8 -*-
"""
Enhanced RAG System - Real implementation with medical specialization
Provides comprehensive RAG capabilities for medical content with advanced context retrieval
"""

import logging
import hashlib
import time
from typing import List, Dict, Optional, Any
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Import vector store and semantic search
try:
    from services.vector_store import get_vector_store
    from services.semantic_search import get_semantic_search, get_medical_context
    VECTOR_SERVICES_AVAILABLE = True
except ImportError:
    VECTOR_SERVICES_AVAILABLE = False

# Import knowledge base components
try:
    from services.rag.knowledge_loader import KnowledgeLoader
    from services.rag.medical_chunking import MedicalChunker
    KNOWLEDGE_SERVICES_AVAILABLE = True
except ImportError:
    KNOWLEDGE_SERVICES_AVAILABLE = False

@dataclass
class RAGContext:
    """Context result from RAG retrieval"""
    content: str
    sources: List[str]
    confidence: float
    chunks_used: int
    retrieval_time: float

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'content': self.content,
            'sources': self.sources,
            'confidence': self.confidence,
            'chunks_used': self.chunks_used,
            'retrieval_time': self.retrieval_time
        }

class MedicalRAGContext:
    """Medical-specific RAG context with clinical priorities"""

    # Medical priority weights
    CLINICAL_PRIORITIES = {
        'dosage': 1.0,           # Critical: exact dosing information
        'contraindication': 0.95, # Critical: safety contraindications
        'interaction': 0.9,       # High: drug interactions
        'adverse_effect': 0.85,   # High: side effects and monitoring
        'safety': 0.8,           # High: safety warnings
        'protocol': 0.75,        # Important: clinical protocols
        'administration': 0.7,    # Important: administration guidelines
        'mechanism': 0.6,        # Moderate: mechanism of action
        'pharmacokinetics': 0.55, # Moderate: PK/PD information
        'general': 0.4           # Lower: general information
    }

    HANSENÍASE_KEYWORDS = {
        'dapsona', 'rifampicina', 'clofazimina', 'pqt', 'poliquimioterapia',
        'hanseniase', 'lepra', 'multibacilar', 'paucibacilar', 'mb', 'pb',
        'reação', 'neurite', 'eritema nodoso', 'reversal reaction',
        'dispensação', 'supervisão', 'adesão', 'resistência'
    }

    def __init__(self, config):
        self.config = config
        self.vector_store = get_vector_store() if VECTOR_SERVICES_AVAILABLE else None
        self.semantic_search = get_semantic_search() if VECTOR_SERVICES_AVAILABLE else None

        # Knowledge components
        self.knowledge_loader = None
        self.medical_chunker = None

        if KNOWLEDGE_SERVICES_AVAILABLE:
            try:
                self.knowledge_loader = KnowledgeLoader()
                self.medical_chunker = MedicalChunker()
            except Exception as e:
                logger.warning(f"[WARNING] Knowledge components failed to initialize: {e}")

        # Performance cache
        self.context_cache = {}
        self.cache_ttl = 3600  # 1 hour

        # Statistics
        self.stats = {
            'contexts_generated': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'avg_retrieval_time': 0.0,
            'total_retrieval_time': 0.0,
            'clinical_contexts': 0,
            'general_contexts': 0
        }

        logger.info(f"[OK] MedicalRAGContext initialized - Vector: {self.vector_store is not None}, Semantic: {self.semantic_search is not None}")

    def is_available(self) -> bool:
        """Check if RAG context is fully available"""
        return (
            VECTOR_SERVICES_AVAILABLE and
            self.vector_store is not None and
            self.semantic_search is not None
        )

    def get_context(
        self,
        query: str,
        max_chunks: int = 3,
        context_type: str = 'mixed',
        persona: Optional[str] = None
    ) -> RAGContext:
        """
        Get medical context for RAG with clinical prioritization

        Args:
            query: Medical query
            max_chunks: Maximum context chunks
            context_type: 'critical', 'protocol', 'general', 'mixed'
            persona: Optional persona for context adaptation

        Returns:
            RAGContext with clinical information
        """
        if not self.is_available():
            logger.warning("[WARNING] RAG context not available - returning empty context")
            return RAGContext(
                content="",
                sources=[],
                confidence=0.0,
                chunks_used=0,
                retrieval_time=0.0
            )

        # Check cache
        cache_key = self._generate_cache_key(query, max_chunks, context_type, persona)
        if cache_key in self.context_cache:
            cached_result, cached_time = self.context_cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < self.cache_ttl:
                self.stats['cache_hits'] += 1
                return cached_result

        start_time = time.time()

        try:
            # Detect if this is a hanseníase-specific query
            is_hanseniase_query = self._is_hanseniase_query(query)

            # Get medical context using semantic search
            context_content = get_medical_context(
                query=query,
                max_chunks=max_chunks,
                context_type=context_type
            )

            # If no semantic context, try knowledge loader fallback
            if not context_content and self.knowledge_loader:
                context_content = self._get_fallback_context(query, max_chunks)

            # Extract sources from context
            sources = self._extract_sources(context_content)

            # Calculate confidence based on content quality
            confidence = self._calculate_confidence(context_content, query, is_hanseniase_query)

            # Adapt context for persona if specified
            if persona and context_content:
                context_content = self._adapt_for_persona(context_content, persona)

            # Create result
            retrieval_time = time.time() - start_time
            result = RAGContext(
                content=context_content,
                sources=sources,
                confidence=confidence,
                chunks_used=len(sources),
                retrieval_time=retrieval_time
            )

            # Update statistics
            self.stats['contexts_generated'] += 1
            self.stats['total_retrieval_time'] += retrieval_time
            self.stats['avg_retrieval_time'] = self.stats['total_retrieval_time'] / self.stats['contexts_generated']
            self.stats['cache_misses'] += 1

            if is_hanseniase_query:
                self.stats['clinical_contexts'] += 1
            else:
                self.stats['general_contexts'] += 1

            # Cache result
            self.context_cache[cache_key] = (result, datetime.now())

            # Clean cache if it gets too large
            if len(self.context_cache) > 100:
                self._clean_cache()

            logger.info(f"[OK] RAG context generated: {len(sources)} sources, confidence {confidence:.2f}, {retrieval_time:.3f}s")
            return result

        except Exception as e:
            logger.error(f"[ERROR] Failed to generate RAG context: {e}")
            return RAGContext(
                content="",
                sources=[],
                confidence=0.0,
                chunks_used=0,
                retrieval_time=time.time() - start_time
            )

    def _is_hanseniase_query(self, query: str) -> bool:
        """Detect if query is hanseníase-specific"""
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.HANSENÍASE_KEYWORDS)

    def _get_fallback_context(self, query: str, max_chunks: int) -> str:
        """Get context using knowledge loader as fallback"""
        if not self.knowledge_loader:
            return ""

        try:
            # Load and search knowledge base
            knowledge_data = self.knowledge_loader.load_all_knowledge()

            # Simple text search in knowledge base
            relevant_chunks = []
            query_words = set(query.lower().split())

            for source, content in knowledge_data.items():
                if self.medical_chunker:
                    chunks = self.medical_chunker.chunk_text(content)
                else:
                    # Simple chunking
                    chunks = [content[i:i+1000] for i in range(0, len(content), 800)]

                for chunk in chunks:
                    chunk_words = set(chunk.lower().split())
                    overlap = len(query_words.intersection(chunk_words))

                    if overlap > 0:
                        score = overlap / len(query_words)
                        relevant_chunks.append((chunk, score, source))

            # Sort by relevance and take top chunks
            relevant_chunks.sort(key=lambda x: x[1], reverse=True)
            top_chunks = relevant_chunks[:max_chunks]

            # Format context
            context_parts = []
            for chunk, score, source in top_chunks:
                context_parts.append(f"{chunk}\n(Fonte: {source})")

            return "\n\n".join(context_parts)

        except Exception as e:
            logger.error(f"[ERROR] Fallback context generation failed: {e}")
            return ""

    def _extract_sources(self, context: str) -> List[str]:
        """Extract source information from context"""
        sources = []

        # Look for source patterns in context
        import re
        source_patterns = [
            r'Fonte: ([^)]+)',
            r'\(Fonte: ([^)]+)\)',
            r'Source: ([^)]+)',
            r'\(Source: ([^)]+)\)'
        ]

        for pattern in source_patterns:
            matches = re.findall(pattern, context)
            sources.extend(matches)

        # Remove duplicates and clean up
        sources = list(set(sources))
        sources = [source.strip() for source in sources if source.strip()]

        # If no sources found, indicate knowledge base
        if not sources:
            sources = ['Knowledge Base']

        return sources

    def _calculate_confidence(self, context: str, query: str, is_hanseniase: bool) -> float:
        """Calculate confidence score for context"""
        if not context:
            return 0.0

        # Base confidence from content length
        length_score = min(len(context) / 1000, 1.0)  # Up to 1000 chars = full score

        # Keyword overlap score
        query_words = set(query.lower().split())
        context_words = set(context.lower().split())
        overlap = len(query_words.intersection(context_words))
        keyword_score = min(overlap / len(query_words), 1.0) if query_words else 0.0

        # Medical specificity bonus
        medical_bonus = 0.2 if is_hanseniase else 0.0

        # Source quality bonus
        source_bonus = 0.1 if 'Roteiro de Dispensação' in context else 0.0

        # Calculate final confidence
        confidence = (length_score * 0.3 + keyword_score * 0.5 + medical_bonus + source_bonus)
        return min(confidence, 1.0)

    def _adapt_for_persona(self, context: str, persona: str) -> str:
        """Adapt context for specific persona"""
        if persona == 'gasnelio':
            # Technical, clinical focus
            header = "[CONTEXTO TÉCNICO-CLÍNICO]\n"
            footer = "\n[Informações baseadas em protocolos clínicos e evidências científicas]"

        elif persona == 'ga':
            # Empathetic, patient-friendly
            header = "[CONTEXTO EDUCATIVO]\n"
            footer = "\n[Informações adaptadas para linguagem acessível ao paciente]"

        else:
            # General context
            header = "[CONTEXTO MÉDICO]\n"
            footer = "\n[Informações especializadas sobre hanseníase]"

        return header + context + footer

    def _generate_cache_key(self, query: str, max_chunks: int, context_type: str, persona: Optional[str]) -> str:
        """Generate cache key for context"""
        key_content = f"{query}:{max_chunks}:{context_type}:{persona or 'none'}"
        return hashlib.sha256(key_content.encode('utf-8')).hexdigest()

    def _clean_cache(self):
        """Clean expired cache entries"""
        current_time = datetime.now()
        expired_keys = []

        for key, (_, cached_time) in self.context_cache.items():
            if (current_time - cached_time).total_seconds() > self.cache_ttl:
                expired_keys.append(key)

        for key in expired_keys:
            del self.context_cache[key]

        if expired_keys:
            logger.debug(f"[OK] Context cache cleaned: {len(expired_keys)} expired entries removed")

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive RAG statistics"""
        stats = dict(self.stats)

        # Calculate cache hit rate
        total_requests = self.stats['cache_hits'] + self.stats['cache_misses']
        if total_requests > 0:
            stats['cache_hit_rate'] = (self.stats['cache_hits'] / total_requests) * 100
        else:
            stats['cache_hit_rate'] = 0.0

        # Add service availability
        stats['services_available'] = {
            'vector_store': self.vector_store is not None,
            'semantic_search': self.semantic_search is not None,
            'knowledge_loader': self.knowledge_loader is not None,
            'medical_chunker': self.medical_chunker is not None
        }

        stats['cache_size'] = len(self.context_cache)
        stats['is_available'] = self.is_available()

        return stats

    def clear_cache(self):
        """Clear context cache"""
        self.context_cache.clear()
        logger.info("[OK] RAG context cache cleared")

# Global RAG context instance
_rag_context_instance: Optional[MedicalRAGContext] = None

def get_enhanced_rag_system() -> Optional[MedicalRAGContext]:
    """Get the global enhanced RAG system instance"""
    global _rag_context_instance

    if _rag_context_instance is None:
        try:
            from app_config import config
            _rag_context_instance = MedicalRAGContext(config)
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize enhanced RAG system: {e}")
            return None

    return _rag_context_instance

def is_enhanced_rag_available() -> bool:
    """Check if enhanced RAG is available"""
    system = get_enhanced_rag_system()
    return system is not None and system.is_available()

# Convenience functions for the factory
def get_enhanced_context(
    query: str,
    max_chunks: int = 3,
    context_type: str = 'mixed',
    persona: Optional[str] = None
) -> str:
    """Convenience function to get enhanced context"""
    system = get_enhanced_rag_system()
    if system and system.is_available():
        result = system.get_context(query, max_chunks, context_type, persona)
        return result.content
    return ""

def get_rag_context_with_metadata(
    query: str,
    max_chunks: int = 3,
    context_type: str = 'mixed',
    persona: Optional[str] = None
) -> Dict[str, Any]:
    """Get enhanced context with full metadata"""
    system = get_enhanced_rag_system()
    if system and system.is_available():
        result = system.get_context(query, max_chunks, context_type, persona)
        return result.to_dict()
    return {
        'content': '',
        'sources': [],
        'confidence': 0.0,
        'chunks_used': 0,
        'retrieval_time': 0.0
    }

def get_enhanced_rag_stats() -> Dict[str, Any]:
    """Get enhanced RAG statistics"""
    system = get_enhanced_rag_system()
    if system:
        return system.get_statistics()
    return {'error': 'Enhanced RAG system not available'}

# For backward compatibility with existing code
def generate_enhanced_context(query: str, max_chunks: int = 3) -> str:
    """Legacy function name for enhanced context"""
    return get_enhanced_context(query, max_chunks)

__all__ = [
    'RAGContext',
    'MedicalRAGContext',
    'get_enhanced_rag_system',
    'is_enhanced_rag_available',
    'get_enhanced_context',
    'get_rag_context_with_metadata',
    'get_enhanced_rag_stats',
    'generate_enhanced_context'
]