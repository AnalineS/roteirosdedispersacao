# -*- coding: utf-8 -*-
"""
Semantic Search - Sistema de busca semântica para RAG médico (LAZY LOADING)
Integra embeddings, vector store e chunking médico com priorização
Implementa lazy loading para evitar timeout em Cloud Run
Compatível com sentence-transformers v5.1+ - métodos otimizados query/document
"""

import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any, Union
from datetime import datetime
from dataclasses import dataclass

# Import apenas bibliotecas leves na inicialização
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    # Fallback para lista Python
    np = None

logger = logging.getLogger(__name__)

# Import obrigatório para SearchResult
try:
    from services.medical_chunking import MedicalChunk, ChunkPriority
    MEDICAL_CHUNKING_AVAILABLE = True
except ImportError:
    # Criar dummy class para compatibilidade
    class MedicalChunk:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class ChunkPriority:
        HIGH = 0.9
        MEDIUM = 0.7
        LOW = 0.5
    
    MEDICAL_CHUNKING_AVAILABLE = False

# Lazy imports - só carregados quando necessário
def _lazy_import_embedding_service():
    """Import lazy do embedding service"""
    try:
        from services.embedding_service import get_embedding_service, embed_text, is_embeddings_available
        return get_embedding_service, embed_text, is_embeddings_available
    except ImportError as e:
        logger.warning(f"[WARNING] Embedding service não disponível: {e}")
        return None, None, None

def _lazy_import_vector_store():
    """Import lazy do vector store - FASE 3 Supabase"""
    try:
        # FASE 3: Priorizar Supabase Vector Store
        from services.vector_store import get_vector_store, get_supabase_vector_store
        from services.supabase_vector_store import VectorDocument
        return get_vector_store, VectorDocument, get_supabase_vector_store
    except ImportError as e:
        logger.warning(f"[WARNING] Vector store não disponível: {e}")
        return None, None, None

@dataclass
class SearchResult:
    """Resultado de busca semântica"""
    chunk: MedicalChunk
    score: float  # Similaridade semântica (0-1)
    weighted_score: float  # Score com peso de prioridade médica
    source: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict:
        """Converte para dicionário"""
        return {
            'text': self.chunk.content,
            'score': self.score,
            'weighted_score': self.weighted_score,
            'category': self.chunk.category,
            'priority': self.chunk.priority,
            'source': self.source,
            'metadata': self.metadata
        }

class SemanticSearchEngine:
    """
    Motor de busca semântica otimizado para conteúdo médico
    Combina embeddings com priorização médica do Sprint 2
    """
    
    def __init__(self, config):
        self.config = config
        
        # Lazy loading dos serviços
        get_embedding_service_func, embed_text_func, is_embeddings_available_func = _lazy_import_embedding_service()
        get_vector_store_func, VectorDocument = _lazy_import_vector_store()
        
        self.embedding_service = get_embedding_service_func() if get_embedding_service_func else None
        self.vector_store = get_vector_store_func() if get_vector_store_func else None
        self.VectorDocument = VectorDocument
        
        # Pesos para diferentes tipos de conteúdo médico
        self.content_weights = getattr(config, 'CONTENT_WEIGHTS', {
            'dosing': 1.0,      # Dosagem tem prioridade máxima
            'safety': 0.9,      # Segurança é crítica
            'procedure': 0.8,   # Procedimentos importantes
            'administration': 0.8,  # Administração relevante
            'mechanism': 0.7,   # Mecanismo de ação útil
            'general': 0.6      # Informação geral básica
        })
        
        # Cache de busca recente
        self.search_cache = {}
        self.cache_ttl = 3600  # 1 hora
        
        # Estatísticas
        self.stats = {
            'searches_performed': 0,
            'cache_hits': 0,
            'avg_search_time': 0.0,
            'documents_indexed': 0
        }
        
        logger.info("[SEARCH] Semantic Search Engine inicializado")
    
    def is_available(self) -> bool:
        """Verifica se busca semântica está disponível"""
        return (
            self.config.EMBEDDINGS_ENABLED and
            self.embedding_service is not None and
            self.vector_store is not None and
            self.embedding_service.is_available()
        )
    
    def _generate_chunk_id(self, text: str, source: str) -> str:
        """Gera ID único para chunk"""
        content = f"{source}:{text[:100]}"
        # SHA-256 for chunk IDs (not sensitive data)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def index_medical_chunk(
        self, 
        chunk: MedicalChunk,
        source_file: str,
        force_reindex: bool = False
    ) -> bool:
        """
        Indexa chunk médico no vector store
        
        Args:
            chunk: Chunk médico para indexar
            source_file: Arquivo de origem
            force_reindex: Força reindexação mesmo se já existe
            
        Returns:
            True se indexado com sucesso
        """
        if not self.is_available():
            logger.warning("Busca semântica não disponível")
            return False
        
        try:
            chunk_id = self._generate_chunk_id(chunk.content, source_file)
            
            # Verificar se já existe
            if not force_reindex:
                existing = self.vector_store.get_document(chunk_id)
                if existing:
                    logger.debug(f"Chunk {chunk_id} já indexado")
                    return True
            
            # Gerar embedding
            # Sentence-transformers v5.1+ - usar embed_document para chunks médicos
            if hasattr(self.embedding_service, 'embed_document'):
                embedding = self.embedding_service.embed_document(chunk.content)
                logger.debug(f"[V5.1+] Usando embed_document() para chunk médico")
            else:
                embedding = self.embedding_service.embed_text(chunk.content)
            if embedding is None:
                logger.error(f"Falha ao gerar embedding para chunk")
                return False
            
            # Criar documento vetorial
            doc = self.VectorDocument(
                id=chunk_id,
                text=chunk.content,
                embedding=embedding,
                metadata={
                    'section': chunk.source_section,
                    'category': chunk.category,
                    'priority': chunk.priority,
                    'indexed_at': datetime.now().isoformat()
                },
                chunk_type=chunk.category,
                priority=chunk.priority,
                source_file=source_file,
                created_at=datetime.now()
            )
            
            # Adicionar ao vector store
            success = self.vector_store.add_document(doc)
            
            if success:
                self.stats['documents_indexed'] += 1
                logger.debug(f"Chunk indexado: {chunk_id} - Tipo: {chunk.category}")
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao indexar chunk médico: {e}")
            return False
    
    def index_medical_chunks_batch(
        self,
        chunks: List[MedicalChunk],
        source_file: str,
        batch_size: int = 32
    ) -> Tuple[int, int]:
        """
        Indexa múltiplos chunks em lote
        
        Args:
            chunks: Lista de chunks médicos
            source_file: Arquivo de origem
            batch_size: Tamanho do lote para processamento
            
        Returns:
            (chunks_indexados, chunks_falhados)
        """
        if not self.is_available():
            return 0, len(chunks)
        
        success_count = 0
        failed_count = 0
        
        # Processar em lotes para eficiência
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            # Gerar embeddings em lote
            texts = [chunk.content for chunk in batch]
            embeddings = self.embedding_service.embed_batch(texts)
            
            # Indexar cada chunk com seu embedding
            for chunk, embedding in zip(batch, embeddings):
                if embedding is not None:
                    chunk_id = self._generate_chunk_id(chunk.content, source_file)
                    
                    doc = self.VectorDocument(
                        id=chunk_id,
                        text=chunk.content,
                        embedding=embedding,
                        metadata={
                            'section': chunk.source_section,
                            'category': chunk.category,
                            'priority': chunk.priority,
                            'indexed_at': datetime.now().isoformat()
                        },
                        chunk_type=chunk.category,
                        priority=chunk.priority,
                        source_file=source_file,
                        created_at=datetime.now()
                    )
                    
                    if self.vector_store.add_document(doc):
                        success_count += 1
                    else:
                        failed_count += 1
                else:
                    failed_count += 1
            
            logger.info(f"Lote processado: {success_count} indexados, {failed_count} falhas")
        
        self.stats['documents_indexed'] += success_count
        
        return success_count, failed_count
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = None,
        chunk_types: Optional[List[str]] = None,
        use_medical_weights: bool = True
    ) -> List[SearchResult]:
        """
        Busca semântica com priorização médica
        
        Args:
            query: Texto da consulta
            top_k: Número máximo de resultados
            min_score: Score mínimo para inclusão
            chunk_types: Filtrar por tipos específicos de chunks
            use_medical_weights: Aplicar pesos de prioridade médica
            
        Returns:
            Lista de resultados ordenados por relevância
        """
        if not self.is_available():
            logger.warning("Busca semântica não disponível")
            return []
        
        # Score mínimo padrão
        if min_score is None:
            min_score = self.config.SEMANTIC_SIMILARITY_THRESHOLD
        
        # Verificar cache
        cache_key = f"{query}:{top_k}:{min_score}:{chunk_types}"
        if cache_key in self.search_cache:
            cached_result, cached_time = self.search_cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < self.cache_ttl:
                self.stats['cache_hits'] += 1
                return cached_result
        
        try:
            start_time = datetime.now()
            
            # Gerar embedding da query
            # Sentence-transformers v5.1+ - usar embed_query para consultas do usuário
            if hasattr(self.embedding_service, 'embed_query'):
                query_embedding = self.embedding_service.embed_query(query)
                logger.debug(f"[V5.1+] Usando embed_query() para consulta do usuário")
            else:
                query_embedding = self.embedding_service.embed_text(query)
            if query_embedding is None:
                logger.error("Falha ao gerar embedding da query")
                return []
            
            # Buscar documentos similares
            # Buscar mais resultados para aplicar filtros depois
            search_results = self.vector_store.search_similar(
                query_embedding,
                top_k=top_k * 2 if chunk_types else top_k,
                min_score=min_score * 0.8  # Margem para weighted score
            )
            
            # Converter para SearchResults
            results = []
            for doc, score in search_results:
                # Filtrar por tipo se especificado
                if chunk_types and doc.chunk_type not in chunk_types:
                    continue
                
                # Criar MedicalChunk
                chunk = MedicalChunk(
                    content=doc.text,
                    category=doc.chunk_type,
                    priority=doc.priority,
                    source_section=doc.metadata.get('section', ''),
                    word_count=len(doc.text.split()),
                    contains_dosage=('dosage' in doc.chunk_type),
                    contains_contraindication=('contraindication' in doc.chunk_type)
                )
                
                # Calcular weighted score se habilitado
                if use_medical_weights:
                    # Aplicar peso baseado no tipo de conteúdo
                    weight = self.content_weights.get(doc.chunk_type, 0.5)
                    weighted_score = score * weight * doc.priority
                else:
                    weighted_score = score
                
                # Aplicar threshold no weighted score
                if weighted_score >= min_score:
                    results.append(SearchResult(
                        chunk=chunk,
                        score=score,
                        weighted_score=weighted_score,
                        source=doc.source_file or 'unknown',
                        metadata=doc.metadata
                    ))
            
            # Ordenar por weighted score
            results.sort(key=lambda x: x.weighted_score, reverse=True)
            
            # Limitar ao top_k
            results = results[:top_k]
            
            # Atualizar estatísticas
            search_time = (datetime.now() - start_time).total_seconds()
            self.stats['searches_performed'] += 1
            self.stats['avg_search_time'] = (
                (self.stats['avg_search_time'] * (self.stats['searches_performed'] - 1) + search_time) /
                self.stats['searches_performed']
            )
            
            # Cachear resultado
            self.search_cache[cache_key] = (results, datetime.now())
            
            # Limpar cache antigo periodicamente
            if len(self.search_cache) > 100:
                self._clean_cache()
            
            logger.info(f"Busca semântica: {len(results)} resultados em {search_time:.3f}s")
            
            return results
            
        except Exception as e:
            logger.error(f"Erro na busca semântica: {e}")
            return []
    
    def search_medical_context(
        self,
        query: str,
        context_type: str = 'mixed',
        max_chunks: int = 3
    ) -> str:
        """
        Busca contexto médico otimizado para RAG
        
        Args:
            query: Consulta do usuário
            context_type: 'critical' (dosagens), 'protocol', 'general', 'mixed'
            max_chunks: Número máximo de chunks
            
        Returns:
            Contexto formatado para RAG
        """
        # Definir tipos de chunk baseado no contexto desejado
        chunk_types_map = {
            'critical': ['dosage', 'contraindication', 'interaction'],
            'protocol': ['protocol', 'guideline'],
            'general': ['mechanism', 'pharmacokinetics', 'general'],
            'mixed': None  # Todos os tipos
        }
        
        chunk_types = chunk_types_map.get(context_type, None)
        
        # Buscar chunks relevantes
        results = self.search(
            query=query,
            top_k=max_chunks,
            chunk_types=chunk_types,
            use_medical_weights=True
        )
        
        if not results:
            return ""
        
        # Formatar contexto
        context_parts = []
        
        for i, result in enumerate(results):
            # Adicionar marcador de prioridade
            priority_marker = ""
            if result.chunk.priority >= 0.9:
                priority_marker = "[CRÍTICO] "
            elif result.chunk.priority >= 0.7:
                priority_marker = "[IMPORTANTE] "
            
            # Adicionar fonte se disponível
            source_info = f"(Fonte: {result.source})" if result.source != 'unknown' else ""
            
            # Formatar chunk
            context_part = f"{priority_marker}{result.chunk.content} {source_info}"
            context_parts.append(context_part)
        
        # Unir contexto
        context = "\n\n".join(context_parts)
        
        # Adicionar metadata de busca
        if NUMPY_AVAILABLE and np:
            avg_score = np.mean([r.score for r in results])
        else:
            avg_score = sum(r.score for r in results) / len(results)
        
        metadata = f"\n\n[Contexto baseado em {len(results)} fontes relevantes - Score médio: {avg_score:.2f}]"
        
        return context + metadata
    
    def _clean_cache(self):
        """Limpa entradas antigas do cache"""
        current_time = datetime.now()
        keys_to_remove = []
        
        for key, (_, cached_time) in self.search_cache.items():
            if (current_time - cached_time).total_seconds() > self.cache_ttl:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.search_cache[key]
        
        if keys_to_remove:
            logger.debug(f"Cache limpo: {len(keys_to_remove)} entradas removidas")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas do motor de busca"""
        stats = dict(self.stats)
        
        # Adicionar estatísticas dos componentes
        if self.embedding_service:
            stats['embedding_stats'] = self.embedding_service.get_statistics()
        
        if self.vector_store:
            stats['vector_store_stats'] = self.vector_store.get_stats()
        
        stats['cache_size'] = len(self.search_cache)
        stats['available'] = self.is_available()
        
        return stats
    
    def clear_cache(self):
        """Limpa cache de busca"""
        self.search_cache.clear()
        logger.info("Cache de busca semântica limpo")

# Instância global
_search_engine: Optional[SemanticSearchEngine] = None

def get_semantic_search() -> Optional[SemanticSearchEngine]:
    """Obtém instância global do motor de busca semântica"""
    global _search_engine
    
    if _search_engine is None:
        try:
            from app_config import config
            _search_engine = SemanticSearchEngine(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar busca semântica: {e}")
            return None
    
    return _search_engine

def search_medical_context(query: str, max_chunks: int = 3) -> str:
    """Função de conveniência para buscar contexto médico"""
    engine = get_semantic_search()
    if engine and engine.is_available():
        return engine.search_medical_context(query, 'mixed', max_chunks)
    return ""

def is_semantic_search_available() -> bool:
    """Verifica se busca semântica está disponível"""
    engine = get_semantic_search()
    return engine is not None and engine.is_available()