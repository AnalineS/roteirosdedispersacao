# -*- coding: utf-8 -*-
"""
Unified RAG System - Complete replacement for failing RAG components
Integrates all RAG functionality into a single, working system
"""

import os
import json
import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any, Union
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Import the complete medical RAG system
try:
    from services.rag.complete_medical_rag import (
        get_medical_rag,
        query_medical_knowledge,
        get_rag_status,
        CompleteMedicalRAG,
        RAGContext
    )
    COMPLETE_RAG_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Complete Medical RAG not available: {e}")
    COMPLETE_RAG_AVAILABLE = False

# Import existing RAG fallbacks
try:
    from services.rag.supabase_rag_system import get_rag_system, query_rag_system
    SUPABASE_RAG_AVAILABLE = True
except ImportError:
    SUPABASE_RAG_AVAILABLE = False

try:
    from services.rag.embedding_rag_system import get_embedding_rag, get_rag_context
    EMBEDDING_RAG_AVAILABLE = True
except ImportError:
    EMBEDDING_RAG_AVAILABLE = False

@dataclass
class UnifiedRAGResponse:
    """Unified response from RAG system"""
    answer: str
    context: str
    sources: List[str]
    confidence: float
    processing_time_ms: int
    system_used: str
    available_systems: List[str]
    success: bool

class UnifiedRAGSystem:
    """
    Unified RAG system that manages multiple RAG implementations
    Provides a single interface with automatic fallback
    """

    def __init__(self, config):
        self.config = config

        # Available RAG systems in priority order
        self.rag_systems = {}
        self.system_priority = []

        # Initialize complete medical RAG (highest priority)
        if COMPLETE_RAG_AVAILABLE:
            try:
                self.rag_systems['complete_medical'] = get_medical_rag()
                if self.rag_systems['complete_medical'] and self.rag_systems['complete_medical'].is_available():
                    self.system_priority.append('complete_medical')
                    logger.info("✅ Complete Medical RAG available")
            except Exception as e:
                logger.warning(f"Failed to initialize Complete Medical RAG: {e}")

        # Initialize Supabase RAG (medium priority)
        if SUPABASE_RAG_AVAILABLE:
            try:
                self.rag_systems['supabase'] = get_rag_system()
                if self.rag_systems['supabase']:
                    self.system_priority.append('supabase')
                    logger.info("✅ Supabase RAG available")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase RAG: {e}")

        # Initialize Embedding RAG (low priority)
        if EMBEDDING_RAG_AVAILABLE:
            try:
                self.rag_systems['embedding'] = get_embedding_rag()
                if self.rag_systems['embedding']:
                    self.system_priority.append('embedding')
                    logger.info("✅ Embedding RAG available")
            except Exception as e:
                logger.warning(f"Failed to initialize Embedding RAG: {e}")

        # Statistics
        self.stats = {
            'total_queries': 0,
            'successful_queries': 0,
            'system_usage': {system: 0 for system in self.system_priority},
            'fallback_usage': 0,
            'avg_response_time': 0.0
        }

        logger.info(f"🧠 Unified RAG System initialized with {len(self.system_priority)} systems: {self.system_priority}")

    def is_available(self) -> bool:
        """Check if any RAG system is available"""
        return len(self.system_priority) > 0

    def get_best_available_system(self) -> Optional[str]:
        """Get the best available RAG system"""
        for system_name in self.system_priority:
            system = self.rag_systems.get(system_name)
            if system:
                # Check if system is still available
                try:
                    if system_name == 'complete_medical':
                        if system.is_available():
                            return system_name
                    elif system_name == 'supabase':
                        # Supabase system availability check
                        return system_name
                    elif system_name == 'embedding':
                        # Embedding system availability check
                        return system_name
                except Exception:
                    continue
        return None

    def query(self, query: str, persona: str = 'dr_gasnelio', max_results: int = 3) -> UnifiedRAGResponse:
        """
        Query the RAG system with automatic fallback
        """
        start_time = datetime.now()
        self.stats['total_queries'] += 1

        if not self.is_available():
            return UnifiedRAGResponse(
                answer="Sistema RAG não disponível",
                context="Nenhum sistema RAG está funcionando",
                sources=[],
                confidence=0.0,
                processing_time_ms=0,
                system_used="none",
                available_systems=[],
                success=False
            )

        # Try systems in priority order
        for system_name in self.system_priority:
            try:
                system = self.rag_systems.get(system_name)
                if not system:
                    continue

                logger.debug(f"Trying RAG system: {system_name}")

                # Query the specific system
                if system_name == 'complete_medical':
                    context = system.get_context_for_persona(query, persona)
                    if context and context != "Sistema RAG não disponível":
                        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

                        # Extract sources from context
                        sources = self._extract_sources_from_context(context)
                        confidence = self._calculate_confidence_from_context(context)

                        self.stats['successful_queries'] += 1
                        self.stats['system_usage'][system_name] += 1
                        self._update_avg_response_time(processing_time)

                        return UnifiedRAGResponse(
                            answer=context,
                            context=context,
                            sources=sources,
                            confidence=confidence,
                            processing_time_ms=processing_time,
                            system_used=system_name,
                            available_systems=self.system_priority,
                            success=True
                        )

                elif system_name == 'supabase':
                    response = query_rag_system(
                        query=query,
                        persona=persona,
                        max_chunks=max_results
                    )
                    if response and response.answer:
                        processing_time = response.processing_time_ms

                        self.stats['successful_queries'] += 1
                        self.stats['system_usage'][system_name] += 1
                        self._update_avg_response_time(processing_time)

                        return UnifiedRAGResponse(
                            answer=response.answer,
                            context=response.answer,
                            sources=response.sources,
                            confidence=response.quality_score,
                            processing_time_ms=processing_time,
                            system_used=system_name,
                            available_systems=self.system_priority,
                            success=True
                        )

                elif system_name == 'embedding':
                    context = get_rag_context(query, max_results, persona)
                    if context and "Não foram encontradas informações" not in context:
                        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

                        sources = self._extract_sources_from_context(context)
                        confidence = self._calculate_confidence_from_context(context)

                        self.stats['successful_queries'] += 1
                        self.stats['system_usage'][system_name] += 1
                        self._update_avg_response_time(processing_time)

                        return UnifiedRAGResponse(
                            answer=context,
                            context=context,
                            sources=sources,
                            confidence=confidence,
                            processing_time_ms=processing_time,
                            system_used=system_name,
                            available_systems=self.system_priority,
                            success=True
                        )

            except Exception as e:
                logger.warning(f"RAG system {system_name} failed: {e}")
                continue

        # All systems failed - return fallback
        self.stats['fallback_usage'] += 1
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

        return UnifiedRAGResponse(
            answer=self._get_fallback_response(query, persona),
            context="Fallback response - RAG systems unavailable",
            sources=[],
            confidence=0.1,
            processing_time_ms=processing_time,
            system_used="fallback",
            available_systems=self.system_priority,
            success=False
        )

    def _extract_sources_from_context(self, context: str) -> List[str]:
        """Extract source files from context text"""
        sources = []

        # Look for source patterns in context
        import re
        source_patterns = [
            r'Fonte:\s*([^)]+)',
            r'\(Fonte:\s*([^)]+)\)',
            r'\[([^]]+\.md)\]',
            r'\[([^]]+\.json)\]'
        ]

        for pattern in source_patterns:
            matches = re.findall(pattern, context)
            sources.extend(matches)

        # Clean and deduplicate
        cleaned_sources = []
        for source in sources:
            cleaned = source.strip()
            if cleaned and cleaned not in cleaned_sources:
                cleaned_sources.append(cleaned)

        return cleaned_sources[:5]  # Limit to 5 sources

    def _calculate_confidence_from_context(self, context: str) -> float:
        """Calculate confidence based on context quality indicators"""
        if not context or "Não foram encontradas" in context:
            return 0.0

        # Look for confidence indicators
        confidence = 0.5  # Base confidence

        # High-quality indicators
        if "[CRÍTICO]" in context:
            confidence += 0.3
        if "[IMPORTANTE]" in context:
            confidence += 0.2
        if "Score médio:" in context:
            # Try to extract actual score
            import re
            score_match = re.search(r'Score médio:\s*(\d+\.?\d*)', context)
            if score_match:
                extracted_score = float(score_match.group(1))
                confidence = max(confidence, extracted_score)

        # Multiple sources boost confidence
        source_count = len(self._extract_sources_from_context(context))
        if source_count > 1:
            confidence += 0.1 * min(source_count - 1, 3)

        return min(confidence, 1.0)

    def _get_fallback_response(self, query: str, persona: str) -> str:
        """Generate fallback response when all RAG systems fail"""
        if persona == 'dr_gasnelio':
            return """**Dr. Gasnelio (Farmacêutico Clínico):**

Lamento, mas no momento não consigo acessar a base de conhecimento específica sobre hanseníase.

Para informações precisas sobre PQT-U (Poliquimioterapia Única), recomendo:

1. **Consultar o PCDT Hanseníase 2022** do Ministério da Saúde
2. **Verificar protocolos locais** da sua unidade de saúde
3. **Contatar farmacêutico clínico** da sua instituição

**Informações gerais que posso fornecer:**
- PQT-U é o esquema padrão para hanseníase no Brasil
- Combina rifampicina, dapsona e clofazimina
- Duração varia conforme classificação operacional

**⚠️ Importante:** Para dosagens específicas e orientações clínicas, consulte sempre fontes oficiais atualizadas."""

        else:  # ga_empathetic
            return """**Gá (Assistente Empático):**

Oi! Desculpe, mas estou com dificuldades para acessar as informações sobre hanseníase no momento. 😔

**O que você pode fazer:**
- Conversar com seu farmacêutico ou médico
- Buscar informações no site do Ministério da Saúde
- Procurar a unidade de saúde mais próxima

**Lembre-se:**
A hanseníase tem cura! O tratamento é gratuito pelo SUS e muito eficaz quando seguido corretamente.

Se você tem dúvidas sobre o tratamento, não hesite em procurar ajuda profissional. Estou aqui para apoiar você! 💪

**Em breve estarei com todas as informações novamente.** ✨"""

    def _update_avg_response_time(self, response_time: int):
        """Update average response time"""
        if self.stats['successful_queries'] > 0:
            self.stats['avg_response_time'] = (
                (self.stats['avg_response_time'] * (self.stats['successful_queries'] - 1) + response_time) /
                self.stats['successful_queries']
            )

    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        status = {
            'unified_rag_available': self.is_available(),
            'best_system': self.get_best_available_system(),
            'available_systems': self.system_priority,
            'system_count': len(self.system_priority),
            'statistics': self.stats
        }

        # Add individual system status
        for system_name, system in self.rag_systems.items():
            try:
                if system_name == 'complete_medical' and system:
                    status[f'{system_name}_status'] = system.get_system_status()
                elif system_name == 'supabase' and system:
                    status[f'{system_name}_status'] = 'available'
                elif system_name == 'embedding' and system:
                    status[f'{system_name}_status'] = system.get_statistics() if hasattr(system, 'get_statistics') else 'available'
            except Exception as e:
                status[f'{system_name}_status'] = f'error: {str(e)}'

        # Overall health
        if self.is_available():
            if self.get_best_available_system() == 'complete_medical':
                status['health'] = 'excellent'
            elif len(self.system_priority) >= 2:
                status['health'] = 'good'
            else:
                status['health'] = 'fair'
        else:
            status['health'] = 'poor'

        return status

    def clear_cache(self):
        """Clear caches of all available systems"""
        for system_name, system in self.rag_systems.items():
            try:
                if hasattr(system, 'clear_cache'):
                    system.clear_cache()
                    logger.info(f"Cache cleared for {system_name}")
            except Exception as e:
                logger.warning(f"Failed to clear cache for {system_name}: {e}")

# Global unified RAG instance
_unified_rag: Optional[UnifiedRAGSystem] = None

def get_unified_rag() -> Optional[UnifiedRAGSystem]:
    """Get global unified RAG system"""
    global _unified_rag

    if _unified_rag is None:
        try:
            from app_config import config
            _unified_rag = UnifiedRAGSystem(config)
        except Exception as e:
            logger.error(f"Failed to initialize Unified RAG: {e}")
            return None

    return _unified_rag

def query_unified_rag(query: str, persona: str = 'dr_gasnelio', max_results: int = 3) -> UnifiedRAGResponse:
    """Query the unified RAG system"""
    rag = get_unified_rag()
    if rag:
        return rag.query(query, persona, max_results)

    # Ultimate fallback
    return UnifiedRAGResponse(
        answer="Sistema de busca não disponível",
        context="",
        sources=[],
        confidence=0.0,
        processing_time_ms=0,
        system_used="none",
        available_systems=[],
        success=False
    )

def get_unified_rag_status() -> Dict[str, Any]:
    """Get unified RAG system status"""
    rag = get_unified_rag()
    if rag:
        return rag.get_system_status()

    return {
        'unified_rag_available': False,
        'error': 'System not initialized',
        'health': 'critical'
    }

# Compatibility functions for existing code
def get_relevant_context(query: str, max_chunks: int = 3) -> str:
    """Compatibility function for existing RAG usage"""
    response = query_unified_rag(query, 'dr_gasnelio', max_chunks)
    return response.context

def get_context(query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
    """Compatibility function for existing RAG usage"""
    response = query_unified_rag(query, persona or 'dr_gasnelio', max_chunks)
    return response.context