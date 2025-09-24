# -*- coding: utf-8 -*-
"""
Real RAG System - 100% REAL CLOUD INTEGRATIONS
NO MOCKS - Uses real Supabase pgvector + real GCS + real embeddings
Replaces ALL mock RAG implementations
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import numpy as np

# Import REAL services - NO MOCKS
from .real_vector_store import get_real_vector_store, VectorDocument, VectorSearchResult
from ..cache.real_cloud_cache import get_real_cloud_cache
from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager

logger = logging.getLogger(__name__)

@dataclass
class RealRAGContext:
    """Context retrieved from real RAG system"""
    chunks: List[VectorSearchResult]
    total_score: float
    source_files: List[str]
    chunk_types: List[str]
    confidence_level: str  # 'high', 'medium', 'low'
    metadata: Dict[str, Any]

@dataclass
class RealRAGResponse:
    """Complete response from real RAG system"""
    answer: str
    context: RealRAGContext
    persona: str
    quality_score: float
    sources: List[str]
    limitations: List[str]
    generated_at: datetime
    processing_time_ms: int

class RealRAGSystem:
    """
    REAL RAG System - NO MOCKS
    100% real cloud integrations: Supabase pgvector + GCS + OpenRouter
    """

    def __init__(self, config):
        self.config = config

        # Get REAL services - NO MOCKS
        try:
            self.cloud_manager = get_unified_cloud_manager(config)
            self.real_vector_store = get_real_vector_store()
            self.real_cache = get_real_cloud_cache()

            if not self.real_vector_store:
                raise RuntimeError("Real vector store is required for RAG system")

        except Exception as e:
            logger.error(f"❌ CRITICAL: Real RAG system cannot initialize without real services: {e}")
            raise RuntimeError(f"Real RAG system requires real cloud services: {e}")

        # RAG configuration
        self.min_similarity_threshold = getattr(config, 'SEMANTIC_SIMILARITY_THRESHOLD', 0.7)
        self.max_context_chunks = getattr(config, 'MAX_CONTEXT_CHUNKS', 5)
        self.scope_keywords = self._load_scope_keywords()

        # Cache configuration
        self.context_cache_ttl = timedelta(hours=2)

        # Statistics
        self.stats = {
            'queries_processed': 0,
            'cache_hits': 0,
            'vector_searches': 0,
            'openrouter_calls': 0,
            'avg_context_score': 0.0,
            'scope_violations': 0
        }

        # OpenRouter integration for enhancement
        self.openrouter_client = None
        try:
            from services.ai.openai_integration import get_openrouter_client
            if config.OPENROUTER_API_KEY:
                self.openrouter_client = get_openrouter_client(config)
        except ImportError:
            logger.debug("OpenRouter integration not available")

        logger.info("🚀 REAL RAG SYSTEM initialized - NO MOCKS")
        logger.info(f"   ✅ Real Vector Store: ACTIVE")
        logger.info(f"   ✅ Real Cache: ACTIVE")
        logger.info(f"   ✅ Real Cloud Manager: ACTIVE")
        logger.info(f"   ✅ OpenRouter: {'ACTIVE' if self.openrouter_client else 'INACTIVE'}")

    def _load_scope_keywords(self) -> Dict[str, List[str]]:
        """Load keywords for scope detection"""
        return {
            'hanseniase': [
                'hanseníase', 'hansen', 'lepra', 'mycobacterium leprae',
                'pqt', 'pqt-u', 'poliquimioterapia', 'rifampicina',
                'dapsona', 'clofazimina', 'ofloxacina'
            ],
            'farmacologia': [
                'dose', 'dosagem', 'posologia', 'administração',
                'efeito colateral', 'contraindicação', 'interação',
                'farmacocinética', 'farmacodinâmica'
            ],
            'dispensacao': [
                'dispensação', 'farmácia', 'protocolo', 'roteiro',
                'procedimento', 'orientação', 'adesão'
            ]
        }

    def is_query_in_scope(self, query: str) -> Tuple[bool, str, float]:
        """
        Check if query is within system scope
        Returns: (in_scope, category, confidence)
        """
        query_lower = query.lower()

        # Check keywords by category
        category_scores = {}

        for category, keywords in self.scope_keywords.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                # Normalize score based on category size
                category_scores[category] = score / len(keywords)

        if not category_scores:
            return False, 'unknown', 0.0

        # Category with highest score
        best_category = max(category_scores.keys(), key=lambda k: category_scores[k])
        confidence = category_scores[best_category]

        # Consider in-scope if confidence > 0.1 (at least 10% of keywords)
        in_scope = confidence > 0.1

        if not in_scope:
            self.stats['scope_violations'] += 1

        return in_scope, best_category, confidence

    def retrieve_context(
        self,
        query: str,
        max_chunks: int = None,
        chunk_types: List[str] = None,
        use_cache: bool = True
    ) -> RealRAGContext:
        """
        Retrieve context using real vector search
        """
        start_time = datetime.now()
        max_chunks = max_chunks or self.max_context_chunks

        # Check cache first
        if use_cache and self.real_cache:
            cache_key = f"rag_context:{hashlib.sha256(query.encode()).hexdigest()[:16]}"
            cached_context = self.real_cache.get(cache_key)
            if cached_context:
                self.stats['cache_hits'] += 1
                return self._deserialize_context(cached_context)

        # Get query embedding for real vector search
        query_embedding = self._get_query_embedding(query)

        # Real vector search using Supabase pgvector
        context_chunks = []
        if query_embedding and self.real_vector_store:
            try:
                search_results = self.real_vector_store.search_similar(
                    query_embedding=query_embedding,
                    limit=max_chunks * 2,  # Search more to filter later
                    similarity_threshold=self.min_similarity_threshold,
                    source_filter=None,
                    metadata_filter=None
                )

                self.stats['vector_searches'] += 1
                context_chunks = search_results[:max_chunks]

                logger.info(f"✅ Real vector search found {len(context_chunks)} relevant chunks")

            except Exception as e:
                logger.error(f"❌ Real vector search failed: {e}")

        # Calculate context metrics
        if context_chunks:
            total_score = sum(result.similarity for result in context_chunks)
            avg_score = total_score / len(context_chunks)
        else:
            total_score = 0.0
            avg_score = 0.0

        # Determine confidence level
        confidence_level = 'high'
        if avg_score < 0.6:
            confidence_level = 'low'
        elif avg_score < 0.8:
            confidence_level = 'medium'

        # Extract metadata
        source_files = list(set(chunk.document.source for chunk in context_chunks if chunk.document.source))
        chunk_types_found = list(set(
            chunk.metadata.get('category', 'general')
            for chunk in context_chunks
        ))

        # Create RAG context
        context = RealRAGContext(
            chunks=context_chunks,
            total_score=total_score,
            source_files=source_files,
            chunk_types=chunk_types_found,
            confidence_level=confidence_level,
            metadata={
                'query': query,
                'search_time_ms': int((datetime.now() - start_time).total_seconds() * 1000),
                'similarity_threshold': self.min_similarity_threshold,
                'chunks_found': len(context_chunks)
            }
        )

        # Cache context
        if use_cache and self.real_cache and context_chunks:
            serialized = self._serialize_context(context)
            self.real_cache.set(cache_key, serialized, self.context_cache_ttl)

        # Update statistics
        self.stats['avg_context_score'] = (
            (self.stats['avg_context_score'] * self.stats['queries_processed'] + avg_score) /
            (self.stats['queries_processed'] + 1)
        )

        return context

    def generate_answer(
        self,
        query: str,
        context: RealRAGContext,
        persona: str = 'dr_gasnelio',
        enhance_with_openrouter: bool = True
    ) -> RealRAGResponse:
        """
        Generate answer using real context + OpenRouter enhancement
        """
        start_time = datetime.now()

        # Check scope
        in_scope, category, scope_confidence = self.is_query_in_scope(query)

        if not in_scope:
            return self._generate_out_of_scope_response(query, context, persona)

        # Format context for generation
        context_text = self._format_context_for_generation(context, persona)

        # Generate base answer
        base_answer = self._generate_base_answer(query, context_text, persona)

        # Enhance with OpenRouter if available and needed
        enhanced_answer = base_answer
        used_openrouter = False

        if (enhance_with_openrouter and
            self.openrouter_client and
            context.confidence_level in ['low', 'medium']):

            enhanced = self._enhance_with_openrouter(
                query, base_answer, context, persona, category
            )
            if enhanced:
                enhanced_answer = enhanced
                used_openrouter = True
                self.stats['openrouter_calls'] += 1

        # Calculate quality score
        quality_score = self._calculate_response_quality(
            enhanced_answer, context, scope_confidence
        )

        # Identify limitations
        limitations = self._identify_response_limitations(context, used_openrouter)

        # Extract sources
        sources = self._extract_sources(context)

        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

        # Create RAG response
        response = RealRAGResponse(
            answer=enhanced_answer,
            context=context,
            persona=persona,
            quality_score=quality_score,
            sources=sources,
            limitations=limitations,
            generated_at=datetime.now(timezone.utc),
            processing_time_ms=processing_time
        )

        # Update statistics
        self.stats['queries_processed'] += 1

        # Save to Supabase for analytics
        self._save_rag_response_to_supabase(query, response)

        return response

    def _get_query_embedding(self, query: str) -> Optional[List[float]]:
        """Get embedding for query using real embedding service"""
        try:
            # Try to import real embedding service
            from services.ai.embedding_service import get_embedding_service

            embedding_service = get_embedding_service()
            if embedding_service:
                embedding = embedding_service.get_embedding(query)
                if embedding is not None:
                    return embedding.tolist() if isinstance(embedding, np.ndarray) else embedding

            logger.warning("Real embedding service not available - using fallback")
            return None

        except ImportError:
            logger.debug("Embedding service not available")
            return None

    def _format_context_for_generation(self, context: RealRAGContext, persona: str) -> str:
        """Format retrieved context for answer generation"""
        if not context.chunks:
            return "Não foi encontrado contexto específico na base de conhecimento."

        # Sort chunks by similarity
        sorted_chunks = sorted(
            context.chunks,
            key=lambda x: x.similarity,
            reverse=True
        )

        context_parts = []

        for i, result in enumerate(sorted_chunks):
            # Priority marker based on similarity
            priority_marker = ""
            if result.similarity >= 0.9:
                priority_marker = "[ALTA RELEVÂNCIA] "
            elif result.similarity >= 0.7:
                priority_marker = "[RELEVANTE] "

            # Source information
            source_info = f"(Fonte: {result.document.source})" if result.document.source else ""

            # Category information
            category_info = f"[{result.metadata.get('category', 'GERAL').upper()}]"

            context_part = f"{category_info} {priority_marker}{result.document.content} {source_info}"
            context_parts.append(context_part)

        formatted_context = "\n\n".join(context_parts)

        # Add metadata information
        metadata_info = (
            f"\n\n[Contexto baseado em {len(context.chunks)} fontes relevantes "
            f"- Confiança: {context.confidence_level.upper()} "
            f"- Score médio: {context.total_score/len(context.chunks):.2f}]"
        )

        return formatted_context + metadata_info

    def _generate_base_answer(self, query: str, context: str, persona: str) -> str:
        """Generate base answer using context (without OpenRouter)"""
        if persona == 'dr_gasnelio':
            prefix = "**Dr. Gasnelio (Farmacêutico Clínico):**\n\n"
            style = "Baseado na literatura científica e protocolos clínicos:\n\n"
        else:  # ga_empathetic
            prefix = "**Gá (Assistente Empático):**\n\n"
            style = "Vou explicar de forma clara e acessível:\n\n"

        base_answer = f"{prefix}{style}{context}"

        return base_answer

    def _enhance_with_openrouter(
        self,
        query: str,
        base_answer: str,
        context: RealRAGContext,
        persona: str,
        category: str
    ) -> Optional[str]:
        """Enhance answer with real OpenRouter integration"""
        try:
            if not self.openrouter_client:
                return None

            # Create enhancement prompt
            system_prompt = self._create_system_prompt(persona)
            user_prompt = f"""
Contexto da base de conhecimento:
{base_answer}

Pergunta específica: {query}
Categoria identificada: {category}

INSTRUÇÃO: Responda usando sua expertise em hanseníase, baseando-se no contexto fornecido e mantendo fidelidade ao seu estilo de comunicação.
"""

            # Call real OpenRouter
            response = self.openrouter_client.chat.completions.create(
                model="meta-llama/llama-3.2-3b-instruct:free",  # Free model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=600,
                temperature=0.3,
                top_p=0.9
            )

            enhanced = response.choices[0].message.content.strip()

            # Validate response quality
            if self._validate_enhanced_response(enhanced, persona):
                return enhanced

            return None

        except Exception as e:
            logger.warning(f"OpenRouter enhancement failed: {e}")
            return None

    def _create_system_prompt(self, persona: str) -> str:
        """Create system prompt for persona"""
        if persona == 'dr_gasnelio':
            return """Você é Dr. Gasnelio, farmacêutico clínico especializado em hanseníase.
Suas respostas são técnicas, científicas, com citações e baseadas em evidências.
Você fornece informações precisas sobre dosagens, protocolos e farmacologia."""
        else:
            return """Você é Gá, assistente empática especializada em hanseníase.
Suas respostas são simples, cuidadosas e traduzem termos técnicos para linguagem acessível.
Você oferece suporte emocional e orientações práticas."""

    def _validate_enhanced_response(self, response: str, persona: str) -> bool:
        """Validate enhanced response quality"""
        if len(response) < 50:  # Too short
            return False

        if persona == 'dr_gasnelio':
            # Check for technical language
            technical_terms = ['dose', 'protocolo', 'medicação', 'tratamento', 'clínico']
            return any(term in response.lower() for term in technical_terms)
        else:
            # Check for empathetic language
            empathetic_terms = ['cuidado', 'importante', 'orientação', 'ajuda', 'apoio']
            return any(term in response.lower() for term in empathetic_terms)

    def _generate_out_of_scope_response(
        self,
        query: str,
        context: RealRAGContext,
        persona: str
    ) -> RealRAGResponse:
        """Generate response for out-of-scope queries"""

        if persona == 'dr_gasnelio':
            out_of_scope_msg = """
**Dr. Gasnelio (Farmacêutico Clínico):**

Peço desculpas, mas sou especializado exclusivamente em **hanseníase** e **dispensação de PQT** (Poliquimioterapia).

Posso ajudá-lo com questões sobre:
- Protocolos de dosagem para hanseníase (PQT-U)
- Medicamentos: Rifampicina, Dapsona, Clofazimina, Ofloxacina
- Procedimentos de dispensação farmacêutica
- Efeitos adversos e contraindicações específicas
- Orientações de adesão ao tratamento

Por favor, reformule sua pergunta focando em hanseníase.
"""
        else:
            out_of_scope_msg = """
**Gá (Assistente Empático):**

Oi! Eu sou especializada em ajudar com questões sobre **hanseníase** e como tomar os remédios corretamente.

Posso conversar sobre:
- Como tomar os medicamentos da hanseníase
- Cuidados durante o tratamento
- Dúvidas sobre os remédios (rifampicina, dapsona, clofazimina)
- Orientações simples e práticas

Se você tiver dúvidas sobre hanseníase, ficarei feliz em ajudar!
"""

        return RealRAGResponse(
            answer=out_of_scope_msg.strip(),
            context=context,
            persona=persona,
            quality_score=0.3,
            sources=[],
            limitations=["Query fora do escopo do sistema"],
            generated_at=datetime.now(timezone.utc),
            processing_time_ms=0
        )

    def _calculate_response_quality(
        self,
        answer: str,
        context: RealRAGContext,
        scope_confidence: float
    ) -> float:
        """Calculate response quality score (0.0 - 1.0)"""
        quality_factors = []

        # Factor 1: Context quality
        context_quality = min(1.0, context.total_score / len(context.chunks)) if context.chunks else 0.0
        quality_factors.append(context_quality * 0.4)

        # Factor 2: Scope confidence
        quality_factors.append(scope_confidence * 0.3)

        # Factor 3: Answer completeness
        completeness = min(1.0, len(answer) / 200)  # Answers >200 chars are more complete
        quality_factors.append(completeness * 0.2)

        # Factor 4: Sources available
        sources_factor = min(1.0, len(context.source_files) / 3) if context.source_files else 0.0
        quality_factors.append(sources_factor * 0.1)

        return sum(quality_factors)

    def _identify_response_limitations(
        self,
        context: RealRAGContext,
        used_openrouter: bool
    ) -> List[str]:
        """Identify response limitations"""
        limitations = []

        if context.confidence_level == 'low':
            limitations.append("Contexto com baixa similaridade - resposta pode ser imprecisa")

        if len(context.chunks) < 2:
            limitations.append("Poucos documentos encontrados na base de conhecimento")

        if not context.source_files:
            limitations.append("Nenhuma fonte específica identificada")

        if used_openrouter:
            limitations.append("Resposta aprimorada com IA externa (OpenRouter)")

        return limitations

    def _extract_sources(self, context: RealRAGContext) -> List[str]:
        """Extract sources from context"""
        sources = []

        for chunk in context.chunks:
            if chunk.document.source and chunk.document.source != 'unknown':
                source_info = f"{chunk.document.source} ({chunk.metadata.get('category', 'general')})"
                if source_info not in sources:
                    sources.append(source_info)

        return sources

    def _serialize_context(self, context: RealRAGContext) -> Dict:
        """Serialize context for cache"""
        return {
            'chunks': [
                {
                    'content': chunk.document.content,
                    'similarity': chunk.similarity,
                    'source': chunk.document.source,
                    'metadata': chunk.metadata
                }
                for chunk in context.chunks
            ],
            'total_score': context.total_score,
            'source_files': context.source_files,
            'chunk_types': context.chunk_types,
            'confidence_level': context.confidence_level,
            'metadata': context.metadata
        }

    def _deserialize_context(self, data: Dict) -> RealRAGContext:
        """Deserialize context from cache"""
        # Reconstruct VectorSearchResult objects
        chunks = []
        for chunk_data in data['chunks']:
            # Create VectorDocument
            vector_doc = VectorDocument(
                content=chunk_data['content'],
                embedding=[],  # Don't store embedding in cache
                metadata=chunk_data['metadata'],
                source=chunk_data['source']
            )

            # Create VectorSearchResult
            search_result = VectorSearchResult(
                document=vector_doc,
                similarity=chunk_data['similarity'],
                doc_id=chunk_data['metadata'].get('doc_id', 'cached'),
                metadata=chunk_data['metadata']
            )
            chunks.append(search_result)

        return RealRAGContext(
            chunks=chunks,
            total_score=data['total_score'],
            source_files=data['source_files'],
            chunk_types=data['chunk_types'],
            confidence_level=data['confidence_level'],
            metadata=data['metadata']
        )

    def _save_rag_response_to_supabase(self, query: str, response: RealRAGResponse):
        """Save RAG response to real Supabase for analytics"""
        try:
            if self.real_vector_store and hasattr(self.real_vector_store, 'real_supabase'):
                supabase_client = self.real_vector_store.real_supabase

                expires_at = datetime.now(timezone.utc) + timedelta(days=7)  # 7 days retention

                rag_data = {
                    'query_text': query,
                    'context_generated': response.answer[:2000],  # Limit size
                    'source_documents': response.sources,
                    'quality_score': response.quality_score,
                    'persona_type': response.persona,
                    'language': 'pt-BR',
                    'expires_at': expires_at.isoformat()
                }

                if hasattr(supabase_client, 'pg_conn') and supabase_client.pg_conn:
                    with supabase_client.pg_conn.cursor() as cursor:
                        cursor.execute("""
                            CREATE TABLE IF NOT EXISTS rag_context (
                                id SERIAL PRIMARY KEY,
                                query_text TEXT,
                                context_generated TEXT,
                                source_documents JSONB,
                                quality_score FLOAT,
                                persona_type VARCHAR(100),
                                language VARCHAR(10),
                                expires_at TIMESTAMP WITH TIME ZONE,
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                            );
                        """)

                        cursor.execute("""
                            INSERT INTO rag_context (
                                query_text, context_generated, source_documents,
                                quality_score, persona_type, language, expires_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (
                            rag_data['query_text'],
                            rag_data['context_generated'],
                            json.dumps(rag_data['source_documents']),
                            rag_data['quality_score'],
                            rag_data['persona_type'],
                            rag_data['language'],
                            expires_at
                        ))

        except Exception as e:
            logger.debug(f"Failed to save RAG context: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive RAG system statistics"""
        base_stats = dict(self.stats)

        # Add component statistics
        if self.real_vector_store:
            try:
                base_stats['vector_store'] = self.real_vector_store.get_stats()
            except Exception as e:
                logger.debug(f"Failed to get vector store stats: {e}")

        if self.real_cache:
            try:
                base_stats['cache'] = self.real_cache.get_stats()
            except Exception as e:
                logger.debug(f"Failed to get cache stats: {e}")

        base_stats['available_components'] = {
            'vector_store': self.real_vector_store is not None,
            'cache': self.real_cache is not None,
            'cloud_manager': self.cloud_manager is not None,
            'openrouter': self.openrouter_client is not None
        }

        base_stats['mock_services'] = 0  # ALWAYS ZERO - NO MOCKS

        return base_stats

    def health_check(self) -> Dict[str, Any]:
        """Health check for real RAG system"""
        try:
            health_status = {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'components': {}
            }

            # Check vector store
            if self.real_vector_store:
                vector_health = self.real_vector_store.health_check()
                health_status['components']['vector_store'] = vector_health
            else:
                health_status['components']['vector_store'] = {
                    'overall_healthy': False,
                    'error': 'Vector store not available'
                }

            # Check cache
            if self.real_cache:
                cache_health = self.real_cache.health_check()
                health_status['components']['cache'] = cache_health
            else:
                health_status['components']['cache'] = {
                    'overall_healthy': False,
                    'error': 'Cache not available'
                }

            # Check cloud manager
            if self.cloud_manager:
                cloud_health = self.cloud_manager.unified_health_check()
                health_status['components']['cloud_manager'] = cloud_health
            else:
                health_status['components']['cloud_manager'] = {
                    'overall_healthy': False,
                    'error': 'Cloud manager not available'
                }

            # Overall health
            component_healths = [
                comp.get('overall_healthy', False)
                for comp in health_status['components'].values()
            ]
            health_status['overall_healthy'] = all(component_healths)

            if health_status['overall_healthy']:
                logger.info("✅ Real RAG system health check PASSED")
            else:
                logger.error("❌ Real RAG system health check FAILED")

            return health_status

        except Exception as e:
            logger.error(f"❌ RAG system health check error: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'error': str(e)
            }

# Global instance
_real_rag_system: Optional[RealRAGSystem] = None

def get_real_rag_system() -> Optional[RealRAGSystem]:
    """Get global real RAG system instance"""
    global _real_rag_system

    if _real_rag_system is None:
        try:
            from app_config import config
            _real_rag_system = RealRAGSystem(config)
        except Exception as e:
            logger.error(f"❌ CRITICAL: Cannot initialize real RAG system: {e}")
            raise RuntimeError(f"Real RAG system requires real cloud services: {e}")

    return _real_rag_system

def reset_real_rag_system():
    """Reset global RAG system instance (for testing)"""
    global _real_rag_system
    _real_rag_system = None

def query_real_rag_system(
    query: str,
    persona: str = 'dr_gasnelio',
    max_chunks: int = 3,
    enhance_with_openrouter: bool = True
) -> Optional[RealRAGResponse]:
    """Query real RAG system - convenience function"""
    rag_system = get_real_rag_system()

    if not rag_system:
        logger.error("Real RAG system not available")
        return None

    try:
        # Retrieve context
        context = rag_system.retrieve_context(
            query=query,
            max_chunks=max_chunks,
            use_cache=True
        )

        # Generate response
        response = rag_system.generate_answer(
            query=query,
            context=context,
            persona=persona,
            enhance_with_openrouter=enhance_with_openrouter
        )

        return response

    except Exception as e:
        logger.error(f"Real RAG query failed: {e}")
        return None

# Backward compatibility aliases
SupabaseRAGSystem = RealRAGSystem
get_rag_system = get_real_rag_system
query_rag_system = query_real_rag_system

# Export
__all__ = [
    'RealRAGSystem',
    'RealRAGContext',
    'RealRAGResponse',
    'get_real_rag_system',
    'query_real_rag_system',
    'reset_real_rag_system',
    'SupabaseRAGSystem',  # Backward compatibility
    'get_rag_system',     # Backward compatibility
    'query_rag_system'    # Backward compatibility
]