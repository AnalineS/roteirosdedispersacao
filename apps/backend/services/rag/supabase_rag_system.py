# -*- coding: utf-8 -*-
"""
Supabase RAG System - Sistema RAG integrado com Supabase pgvector
FASE 3 - Sistema RAG refatorado para usar PostgreSQL + embeddings
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import numpy as np

# Import dependências necessárias
# SearchResult será importado nas linhas seguintes

logger = logging.getLogger(__name__)

# Imports com fallback seguro
try:
    from services.integrations.supabase_vector_store import SupabaseVectorStore, VectorDocument, get_vector_store
    from services.rag.semantic_search import SemanticSearchEngine, SearchResult
    from services.cache.cloud_native_cache import get_cloud_cache
    from services.rag.medical_chunking import MedicalChunk, ChunkPriority
    DEPENDENCIES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"[WARNING] Dependências RAG não disponíveis: {e}")
    DEPENDENCIES_AVAILABLE = False

# Import OpenRouter para contexto adicional
try:
    from services.ai.openai_integration import get_openrouter_client, is_openrouter_available
    OPENROUTER_AVAILABLE = True
except ImportError:
    OPENROUTER_AVAILABLE = False

@dataclass
class RAGContext:
    """Contexto recuperado para geração de resposta"""
    chunks: List[SearchResult]
    total_score: float
    source_files: List[str]
    chunk_types: List[str]
    confidence_level: str  # 'high', 'medium', 'low'
    metadata: Dict[str, Any]

@dataclass
class RAGResponse:
    """Resposta completa do sistema RAG"""
    answer: str
    context: RAGContext
    persona: str
    quality_score: float
    sources: List[str]
    limitations: List[str]
    generated_at: datetime
    processing_time_ms: int

class SupabaseRAGSystem:
    """
    Sistema RAG completo usando Supabase como backend
    Integra busca semântica, cache inteligente e OpenRouter
    """
    
    def __init__(self, config=None):
        self.config = config
        
        # Componentes principais
        self.vector_store = get_vector_store() if DEPENDENCIES_AVAILABLE else None
        self.cache = get_cloud_cache() if DEPENDENCIES_AVAILABLE else None
        self.search_engine = SemanticSearchEngine(config) if DEPENDENCIES_AVAILABLE and config else None
        
        # OpenRouter para contexto adicional
        self.openrouter_client = None
        if OPENROUTER_AVAILABLE and config and hasattr(config, 'OPENROUTER_API_KEY') and config.OPENROUTER_API_KEY:
            self.openrouter_client = get_openrouter_client(config)
        
        # Configurações de qualidade
        self.min_similarity_threshold = getattr(config, 'SEMANTIC_SIMILARITY_THRESHOLD', 0.7) if config else 0.7
        self.max_context_chunks = getattr(config, 'MAX_CONTEXT_CHUNKS', 5) if config else 5
        self.scope_keywords = self._load_scope_keywords()
        
        # Cache de contextos gerados
        self.context_cache_ttl = timedelta(hours=2)
        
        # Estatísticas
        self.stats = {
            'queries_processed': 0,
            'cache_hits': 0,
            'supabase_searches': 0,
            'openrouter_calls': 0,
            'avg_context_score': 0.0,
            'scope_violations': 0
        }
        
        logger.info("🧠 SupabaseRAGSystem inicializado")
        logger.info(f"   - Vector Store: {'[OK]' if self.vector_store else '[ERROR]'}")
        logger.info(f"   - Cache: {'[OK]' if self.cache else '[ERROR]'}")
        logger.info(f"   - Search Engine: {'[OK]' if self.search_engine else '[ERROR]'}")
        logger.info(f"   - OpenRouter: {'[OK]' if self.openrouter_client else '[ERROR]'}")
    
    def _load_scope_keywords(self) -> Dict[str, List[str]]:
        """Carrega palavras-chave para detecção de escopo"""
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
        Verifica se query está dentro do escopo do sistema
        Returns: (in_scope, category, confidence)
        """
        query_lower = query.lower()
        
        # Verificar palavras-chave por categoria
        category_scores = {}
        
        for category, keywords in self.scope_keywords.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                # Normalizar score baseado no tamanho da categoria
                category_scores[category] = score / len(keywords)
        
        if not category_scores:
            return False, 'unknown', 0.0
        
        # Categoria com maior score
        best_category = max(category_scores.keys(), key=lambda k: category_scores[k])
        confidence = category_scores[best_category]
        
        # Considerar in-scope se confidence > 0.1 (pelo menos 10% das keywords)
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
    ) -> RAGContext:
        """
        Recupera contexto relevante para a query usando Supabase
        """
        start_time = datetime.now()
        max_chunks = max_chunks or self.max_context_chunks
        
        # Verificar cache primeiro
        if use_cache and self.cache:
            cache_key = f"rag_context:{hashlib.sha256(query.encode()).hexdigest()[:16]}"
            cached_context = self.cache.get(cache_key)
            if cached_context:
                self.stats['cache_hits'] += 1
                return self._deserialize_context(cached_context)
        
        # Busca semântica no Supabase
        context_chunks = []
        
        if self.search_engine and self.search_engine.is_available():
            search_results = self.search_engine.search(
                query=query,
                top_k=max_chunks * 2,  # Buscar mais para filtrar depois
                min_score=self.min_similarity_threshold,
                chunk_types=chunk_types,
                use_medical_weights=True
            )
            
            self.stats['supabase_searches'] += 1
            context_chunks = search_results[:max_chunks]
        
        # Calcular métricas do contexto
        total_score = sum(chunk.weighted_score for chunk in context_chunks)
        avg_score = total_score / len(context_chunks) if context_chunks else 0.0
        
        # Determinar nível de confiança
        confidence_level = 'high'
        if avg_score < 0.6:
            confidence_level = 'low'
        elif avg_score < 0.8:
            confidence_level = 'medium'
        
        # Extrair metadados
        source_files = list(set(chunk.source for chunk in context_chunks))
        chunk_types_found = list(set(chunk.chunk.category for chunk in context_chunks))
        
        # Criar contexto RAG
        context = RAGContext(
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
        
        # Cachear contexto
        if use_cache and self.cache and context_chunks:
            serialized = self._serialize_context(context)
            self.cache.set(cache_key, serialized, self.context_cache_ttl)
        
        # Atualizar estatísticas
        self.stats['avg_context_score'] = (
            (self.stats['avg_context_score'] * self.stats['queries_processed'] + avg_score) /
            (self.stats['queries_processed'] + 1)
        )
        
        return context
    
    def generate_answer(
        self,
        query: str,
        context: RAGContext,
        persona: str = 'dr_gasnelio',
        enhance_with_openrouter: bool = True
    ) -> RAGResponse:
        """
        Gera resposta usando contexto recuperado + OpenRouter se necessário
        """
        start_time = datetime.now()
        
        # Verificar escopo da query
        in_scope, category, scope_confidence = self.is_query_in_scope(query)
        
        if not in_scope:
            return self._generate_out_of_scope_response(query, context, persona)
        
        # Preparar contexto para geração
        context_text = self._format_context_for_generation(context, persona)
        
        # Gerar resposta base usando contexto
        base_answer = self._generate_base_answer(query, context_text, persona)
        
        # Enhanceamento com OpenRouter se necessário e disponível
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
        
        # Calcular score de qualidade
        quality_score = self._calculate_response_quality(
            enhanced_answer, context, scope_confidence
        )
        
        # Identificar limitações
        limitations = self._identify_response_limitations(context, used_openrouter)
        
        # Extrair fontes
        sources = self._extract_sources(context)
        
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Criar resposta RAG
        response = RAGResponse(
            answer=enhanced_answer,
            context=context,
            persona=persona,
            quality_score=quality_score,
            sources=sources,
            limitations=limitations,
            generated_at=datetime.now(timezone.utc),
            processing_time_ms=processing_time
        )
        
        # Atualizar estatísticas
        self.stats['queries_processed'] += 1
        
        # Salvar no cache de contextos RAG para analytics
        self._save_rag_context_to_supabase(query, response)
        
        return response
    
    def _format_context_for_generation(self, context: RAGContext, persona: str) -> str:
        """Formata contexto recuperado para geração"""
        if not context.chunks:
            return "Não foi encontrado contexto específico na base de conhecimento."
        
        # Ordenar chunks por prioridade e score
        sorted_chunks = sorted(
            context.chunks,
            key=lambda x: (x.chunk.priority, x.weighted_score),
            reverse=True
        )
        
        context_parts = []
        
        for i, result in enumerate(sorted_chunks):
            # Marcadores de prioridade
            priority_marker = ""
            if result.chunk.priority >= 0.9:
                priority_marker = "[CRÍTICO] "
            elif result.chunk.priority >= 0.7:
                priority_marker = "[IMPORTANTE] "
            
            # Informação da fonte
            source_info = f"(Fonte: {result.source})" if result.source != 'unknown' else ""
            
            # Categoria do chunk
            category_info = f"[{result.chunk.category.upper()}]"
            
            context_part = f"{category_info} {priority_marker}{result.chunk.content} {source_info}"
            context_parts.append(context_part)
        
        formatted_context = "\n\n".join(context_parts)
        
        # Adicionar metadata de qualidade
        metadata_info = (
            f"\n\n[Contexto baseado em {len(context.chunks)} fontes relevantes "
            f"- Confiança: {context.confidence_level.upper()} "
            f"- Score médio: {context.total_score/len(context.chunks):.2f}]"
        )
        
        return formatted_context + metadata_info
    
    def _generate_base_answer(self, query: str, context: str, persona: str) -> str:
        """Gera resposta base usando contexto (sem OpenRouter)"""
        # Por enquanto, retorna contexto formatado
        # TODO: Integrar com sistema de personas existente
        
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
        context: RAGContext,
        persona: str,
        category: str
    ) -> Optional[str]:
        """Enhanceamento com OpenRouter usando prompts estruturados existentes"""
        try:
            # Usar prompts estruturados existentes
            if persona == 'dr_gasnelio':
                from config.dr_gasnelio_technical_prompt import DrGasnelioTechnicalPrompt
                prompt_system = DrGasnelioTechnicalPrompt()
                
                # Determinar tipo de query
                query_type = self._classify_query_type(query, category)
                system_prompt = prompt_system.create_context_specific_prompt(query_type, query)
                
            else:  # ga_empathetic
                from config.ga_empathetic_prompt import GaEmpatheticPrompt
                prompt_system = GaEmpatheticPrompt()
                system_prompt = prompt_system.get_empathetic_prompt(query)
            
            # Contexto para OpenRouter
            user_prompt = f"""
Contexto da base de conhecimento:
{base_answer}

Pergunta específica: {query}
Categoria identificada: {category}

INSTRUÇÃO: Responda usando sua expertise em hanseníase, baseando-se no contexto fornecido e mantendo fidelidade ao seu estilo de comunicação.
"""
            
            if self.openrouter_client:
                # Usar modelo gratuito com prompts estruturados
                response = self.openrouter_client.chat.completions.create(
                    model="x-ai/grok-4-fast:free",  # Grok 4 Fast Free
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=600,
                    temperature=0.3,
                    top_p=0.9
                )
                
                enhanced = response.choices[0].message.content.strip()
                
                # Validar usando sistema de prompts
                if persona == 'dr_gasnelio':
                    validation = prompt_system.validate_response_format(enhanced)
                    if validation['format_valid'] and validation['has_citations']:
                        return enhanced
                else:
                    validation = prompt_system.validate_empathetic_response(enhanced)
                    if validation['overall_quality'] >= 70:  # 70% de qualidade mínima
                        return enhanced
            
            return None
            
        except Exception as e:
            logger.warning(f"Erro no enhancement OpenRouter: {e}")
            return None
    
    def _generate_out_of_scope_response(
        self, 
        query: str, 
        context: RAGContext, 
        persona: str
    ) -> RAGResponse:
        """Gera resposta para queries fora de escopo"""
        
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

Se você tiver dúvidas sobre hanseníase, ficarei feliz em ajudar! 😊
"""
        
        return RAGResponse(
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
        context: RAGContext, 
        scope_confidence: float
    ) -> float:
        """Calcula score de qualidade da resposta (0.0 - 1.0)"""
        quality_factors = []
        
        # Fator 1: Qualidade do contexto
        context_quality = min(1.0, context.total_score / len(context.chunks)) if context.chunks else 0.0
        quality_factors.append(context_quality * 0.4)
        
        # Fator 2: Confiança no escopo
        quality_factors.append(scope_confidence * 0.3)
        
        # Fator 3: Completude da resposta
        completeness = min(1.0, len(answer) / 200)  # Respostas >200 chars são mais completas
        quality_factors.append(completeness * 0.2)
        
        # Fator 4: Fontes disponíveis
        sources_factor = min(1.0, len(context.source_files) / 3) if context.source_files else 0.0
        quality_factors.append(sources_factor * 0.1)
        
        return sum(quality_factors)
    
    def _identify_response_limitations(
        self, 
        context: RAGContext, 
        used_openrouter: bool
    ) -> List[str]:
        """Identifica limitações da resposta"""
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
    
    def _extract_sources(self, context: RAGContext) -> List[str]:
        """Extrai lista de fontes do contexto"""
        sources = []
        
        for chunk in context.chunks:
            if chunk.source and chunk.source != 'unknown':
                source_info = f"{chunk.source} ({chunk.chunk.category})"
                if source_info not in sources:
                    sources.append(source_info)
        
        return sources
    
    def _serialize_context(self, context: RAGContext) -> Dict:
        """Serializa contexto para cache"""
        return {
            'chunks': [
                {
                    'text': chunk.chunk.content,
                    'score': chunk.score,
                    'weighted_score': chunk.weighted_score,
                    'source': chunk.source,
                    'category': chunk.chunk.category,
                    'priority': chunk.chunk.priority
                }
                for chunk in context.chunks
            ],
            'total_score': context.total_score,
            'source_files': context.source_files,
            'chunk_types': context.chunk_types,
            'confidence_level': context.confidence_level,
            'metadata': context.metadata
        }
    
    def _deserialize_context(self, data: Dict) -> RAGContext:
        """Deserializa contexto do cache"""
        chunks = []
        for chunk_data in data['chunks']:
            # Reconstruir SearchResult
            medical_chunk = MedicalChunk(
                content=chunk_data['text'],
                category=chunk_data['category'],
                priority=chunk_data['priority'],
                source_section='cached',
                word_count=len(chunk_data['text'].split()),
                contains_dosage='dosage' in chunk_data['category'],
                contains_contraindication='contraindication' in chunk_data['category']
            )
            
            search_result = SearchResult(
                chunk=medical_chunk,
                score=chunk_data['score'],
                weighted_score=chunk_data['weighted_score'],
                source=chunk_data['source'],
                metadata={}
            )
            chunks.append(search_result)
        
        return RAGContext(
            chunks=chunks,
            total_score=data['total_score'],
            source_files=data['source_files'],
            chunk_types=data['chunk_types'],
            confidence_level=data['confidence_level'],
            metadata=data['metadata']
        )
    
    def _save_rag_context_to_supabase(self, query: str, response: RAGResponse):
        """Salva contexto RAG no Supabase para analytics"""
        try:
            if self.vector_store and hasattr(self.vector_store, 'client'):
                
                expires_at = datetime.now(timezone.utc) + timedelta(days=7)  # 7 dias de retenção
                
                rag_data = {
                    'query_text': query,
                    'context_generated': response.answer[:2000],  # Limitar tamanho
                    'source_documents': response.sources,
                    'quality_score': response.quality_score,
                    'persona_type': response.persona,
                    'language': 'pt-BR',
                    'expires_at': expires_at.isoformat()
                }
                
                self.vector_store.client.table('rag_context').insert(rag_data).execute()
                
        except Exception as e:
            logger.debug(f"Erro ao salvar contexto RAG: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas do sistema RAG"""
        base_stats = dict(self.stats)
        
        # Adicionar estatísticas dos componentes
        if self.vector_store:
            base_stats['vector_store'] = self.vector_store.get_stats()
        
        if self.cache:
            base_stats['cache'] = self.cache.get_stats()
        
        if self.search_engine:
            base_stats['search_engine'] = self.search_engine.get_statistics()
        
        base_stats['available_components'] = {
            'vector_store': self.vector_store is not None,
            'cache': self.cache is not None,
            'search_engine': self.search_engine is not None,
            'openrouter': self.openrouter_client is not None
        }

        return base_stats

    def get_context(self, query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
        """
        Interface compatível com sistema existente
        Retorna contexto como string simples para compatibilidade
        """
        try:
            # Usar retrieve_context interno
            rag_context = self.retrieve_context(query, max_chunks=max_chunks)

            # Extrair textos dos chunks
            context_texts = []
            for chunk in rag_context.chunks:
                context_texts.append(chunk.content)

            if context_texts:
                return "\n\n".join(context_texts)
            else:
                return "Contexto específico não encontrado na base de conhecimento."

        except Exception as e:
            logger.error(f"❌ Erro em get_context: {e}")
            return "Sistema RAG temporariamente indisponível."

# Instância global
_rag_system: Optional[SupabaseRAGSystem] = None

def get_rag_system() -> Optional[SupabaseRAGSystem]:
    """Obtém instância global do sistema RAG"""
    global _rag_system
    
    if _rag_system is None:
        try:
            from app_config import config
            _rag_system = SupabaseRAGSystem(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar RAG system: {e}")
            return None
    
    return _rag_system

def query_rag_system(
    query: str,
    persona: str = 'dr_gasnelio',
    max_chunks: int = 3,
    enhance_with_openrouter: bool = True
) -> Optional[RAGResponse]:
    """Função de conveniência para query no sistema RAG"""
    rag_system = get_rag_system()
    
    if not rag_system:
        logger.error("Sistema RAG não disponível")
        return None
    
    try:
        # Recuperar contexto
        context = rag_system.retrieve_context(
            query=query,
            max_chunks=max_chunks,
            use_cache=True
        )
        
        # Gerar resposta
        response = rag_system.generate_answer(
            query=query,
            context=context,
            persona=persona,
            enhance_with_openrouter=enhance_with_openrouter
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Erro na query RAG: {e}")
        return None