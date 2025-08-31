# -*- coding: utf-8 -*-
"""
Embedding RAG System - Sistema RAG com embeddings semânticos
Integração completa com fallback para TF-IDF existente
"""

import logging
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
import os

from services.semantic_search import get_semantic_search, SearchResult
from services.medical_chunking import MedicalChunk, MedicalChunker

# Import RAG existente como fallback
try:
    from services.medical_rag_integration import medical_rag_system
    MEDICAL_RAG_AVAILABLE = True
except ImportError:
    MEDICAL_RAG_AVAILABLE = False

try:
    from services.simple_rag import simple_rag
    SIMPLE_RAG_AVAILABLE = True
except ImportError:
    SIMPLE_RAG_AVAILABLE = False

logger = logging.getLogger(__name__)

class EmbeddingRAGSystem:
    """
    Sistema RAG avançado com embeddings semânticos
    Mantém compatibilidade total com sistema existente
    """
    
    def __init__(self, config):
        self.config = config
        self.semantic_search = get_semantic_search()
        self.chunking_service = MedicalChunker()
        
        # Sistemas fallback
        self.medical_rag = medical_rag_system if MEDICAL_RAG_AVAILABLE else None
        self.simple_rag = simple_rag if SIMPLE_RAG_AVAILABLE else None
        
        # Estatísticas
        self.stats = {
            'queries_processed': 0,
            'semantic_hits': 0,
            'fallback_hits': 0,
            'avg_response_time': 0.0,
            'documents_indexed': 0
        }
        
        # Indexar documentos na inicialização se habilitado
        if config.EMBEDDINGS_ENABLED and self.semantic_search and self.semantic_search.is_available():
            self._index_knowledge_base()
        
        logger.info(f"🧠 Embedding RAG System inicializado - Semantic: {self.is_semantic_available()}")
    
    def is_semantic_available(self) -> bool:
        """Verifica se busca semântica está disponível"""
        return (
            self.config.EMBEDDINGS_ENABLED and
            self.semantic_search is not None and
            self.semantic_search.is_available()
        )
    
    def _index_knowledge_base(self):
        """Indexa base de conhecimento médico para busca semântica"""
        try:
            logger.info("📚 Iniciando indexação da base de conhecimento...")
            
            # Diretórios de conhecimento
            knowledge_dirs = [
                "data/knowledge_base",
                "data/structured"
            ]
            
            total_indexed = 0
            total_failed = 0
            
            for dir_path in knowledge_dirs:
                if not os.path.exists(dir_path):
                    continue
                
                # Processar arquivos Markdown
                from pathlib import Path
                for file_path in Path(dir_path).rglob("*.md"):
                    chunks = self._process_markdown_file(file_path)
                    success, failed = self._index_chunks(chunks, str(file_path))
                    total_indexed += success
                    total_failed += failed
                
                # Processar arquivos JSON estruturados
                for file_path in Path(dir_path).rglob("*.json"):
                    chunks = self._process_json_file(file_path)
                    success, failed = self._index_chunks(chunks, str(file_path))
                    total_indexed += success
                    total_failed += failed
            
            self.stats['documents_indexed'] = total_indexed
            
            logger.info(f"[OK] Indexação concluída: {total_indexed} chunks indexados, {total_failed} falhas")
            
        except Exception as e:
            logger.error(f"Erro na indexação da base de conhecimento: {e}")
    
    def _process_markdown_file(self, file_path) -> List[MedicalChunk]:
        """Processa arquivo Markdown em chunks médicos"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Usar serviço de chunking médico
            chunks = self.chunking_service.process_document(
                content,
                source_name=str(file_path)
            )
            
            return chunks
            
        except Exception as e:
            logger.error(f"Erro ao processar {file_path}: {e}")
            return []
    
    def _process_json_file(self, file_path) -> List[MedicalChunk]:
        """Processa arquivo JSON estruturado em chunks médicos"""
        try:
            import json
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            chunks = []
            
            # Processar dados estruturados
            if isinstance(data, dict):
                chunks.extend(self._process_json_dict(data, str(file_path)))
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        chunks.extend(self._process_json_dict(item, str(file_path)))
            
            return chunks
            
        except Exception as e:
            logger.error(f"Erro ao processar JSON {file_path}: {e}")
            return []
    
    def _process_json_dict(self, data: Dict, source: str) -> List[MedicalChunk]:
        """Processa dicionário JSON em chunks"""
        chunks = []
        
        # Detectar tipo de conteúdo médico
        chunk_type = 'general'
        priority = 0.5
        
        # Heurísticas para tipo de conteúdo
        text_lower = str(data).lower()
        if any(word in text_lower for word in ['dose', 'dosagem', 'mg', 'ml']):
            chunk_type = 'dosage'
            priority = 1.0
        elif any(word in text_lower for word in ['contraindicação', 'contraindicacao', 'não deve']):
            chunk_type = 'contraindication'
            priority = 1.0
        elif any(word in text_lower for word in ['protocolo', 'pcdt', 'diretriz']):
            chunk_type = 'protocol'
            priority = 0.8
        
        # Criar texto do chunk
        text_parts = []
        for key, value in data.items():
            if isinstance(value, (str, int, float)):
                text_parts.append(f"{key}: {value}")
            elif isinstance(value, list):
                text_parts.append(f"{key}: {', '.join(str(v) for v in value)}")
        
        if text_parts:
            chunk_text = "\n".join(text_parts)
            
            # Criar chunk médico
            chunk = MedicalChunk(
                text=chunk_text,
                chunk_type=chunk_type,
                priority=priority,
                metadata={'source': source}
            )
            chunks.append(chunk)
        
        return chunks
    
    def _index_chunks(self, chunks: List[MedicalChunk], source: str) -> Tuple[int, int]:
        """Indexa lista de chunks"""
        if not self.semantic_search or not chunks:
            return 0, len(chunks)
        
        return self.semantic_search.index_medical_chunks_batch(
            chunks=chunks,
            source_file=source,
            batch_size=32
        )
    
    def get_context(self, query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
        """
        Interface principal - compatível com RAG existente
        
        Args:
            query: Consulta do usuário
            max_chunks: Número máximo de chunks
            persona: Persona solicitante (para otimização)
            
        Returns:
            Contexto relevante para a consulta
        """
        start_time = datetime.now()
        self.stats['queries_processed'] += 1
        
        context = ""
        
        # Tentar busca semântica primeiro
        if self.is_semantic_available():
            try:
                # Determinar tipo de contexto baseado na persona
                context_type = 'mixed'
                if persona == 'dr_gasnelio':
                    context_type = 'critical'  # Priorizar informações técnicas
                elif persona == 'ga':
                    context_type = 'general'  # Informações mais gerais
                
                context = self.semantic_search.search_medical_context(
                    query=query,
                    context_type=context_type,
                    max_chunks=max_chunks
                )
                
                if context:
                    self.stats['semantic_hits'] += 1
                    logger.debug(f"[OK] Contexto semântico obtido: {len(context)} chars")
                
            except Exception as e:
                logger.error(f"Erro na busca semântica: {e}")
        
        # Fallback para RAG médico tradicional
        if not context and self.medical_rag:
            try:
                context = self.medical_rag.get_relevant_context(query, max_chunks)
                if context:
                    self.stats['fallback_hits'] += 1
                    logger.debug(f"🔄 Fallback para RAG médico: {len(context)} chars")
            except Exception as e:
                logger.error(f"Erro no RAG médico: {e}")
        
        # Fallback final para RAG simples
        if not context and self.simple_rag:
            try:
                # Buscar documentos relevantes
                relevant_docs = self.simple_rag._search_knowledge_base(query, max_chunks)
                if relevant_docs:
                    context_parts = []
                    for doc in relevant_docs:
                        context_parts.append(f"[{doc.get('file', 'doc')}] {doc.get('content', '')}")
                    context = "\n\n".join(context_parts)
                    
                    if context:
                        self.stats['fallback_hits'] += 1
                        logger.debug(f"🔄 Fallback para RAG simples: {len(context)} chars")
            except Exception as e:
                logger.error(f"Erro no RAG simples: {e}")
        
        # Atualizar estatísticas
        response_time = (datetime.now() - start_time).total_seconds()
        self.stats['avg_response_time'] = (
            (self.stats['avg_response_time'] * (self.stats['queries_processed'] - 1) + response_time) /
            self.stats['queries_processed']
        )
        
        # Contexto padrão se nada encontrado
        if not context:
            context = "Não foram encontradas informações específicas na base de conhecimento para esta consulta."
        
        return context
    
    def get_relevant_context(self, query: str, max_chunks: int = 3) -> str:
        """Alias para compatibilidade com medical_rag_system"""
        return self.get_context(query, max_chunks)
    
    def search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """
        Busca avançada com resultados detalhados
        
        Args:
            query: Consulta
            top_k: Número de resultados
            
        Returns:
            Lista de resultados de busca
        """
        if self.is_semantic_available():
            return self.semantic_search.search(query, top_k)
        return []
    
    def add_medical_knowledge(self, text: str, chunk_type: str = 'general', source: str = 'manual') -> bool:
        """
        Adiciona novo conhecimento médico ao sistema
        
        Args:
            text: Texto do conhecimento
            chunk_type: Tipo de chunk médico
            source: Fonte do conhecimento
            
        Returns:
            True se adicionado com sucesso
        """
        if not self.is_semantic_available():
            return False
        
        try:
            # Criar chunk médico
            chunk = MedicalChunk(
                text=text,
                chunk_type=chunk_type,
                priority=self.config.CONTENT_WEIGHTS.get(chunk_type, 0.5),
                metadata={'added_at': datetime.now().isoformat()}
            )
            
            # Indexar
            success = self.semantic_search.index_medical_chunk(
                chunk=chunk,
                source_file=source,
                force_reindex=True
            )
            
            if success:
                self.stats['documents_indexed'] += 1
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao adicionar conhecimento: {e}")
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas do sistema"""
        stats = dict(self.stats)
        
        # Adicionar estatísticas dos componentes
        if self.semantic_search:
            stats['semantic_search'] = self.semantic_search.get_statistics()
        
        stats['semantic_available'] = self.is_semantic_available()
        stats['fallback_available'] = bool(self.medical_rag or self.simple_rag)
        
        # Taxas de sucesso
        if stats['queries_processed'] > 0:
            stats['semantic_hit_rate'] = stats['semantic_hits'] / stats['queries_processed']
            stats['fallback_hit_rate'] = stats['fallback_hits'] / stats['queries_processed']
        
        return stats
    
    def clear_cache(self):
        """Limpa caches do sistema"""
        if self.semantic_search:
            self.semantic_search.clear_cache()
        logger.info("Cache do Embedding RAG limpo")

# Instância global
_embedding_rag: Optional[EmbeddingRAGSystem] = None

def get_embedding_rag() -> Optional[EmbeddingRAGSystem]:
    """Obtém instância global do Embedding RAG"""
    global _embedding_rag
    
    if _embedding_rag is None:
        try:
            from app_config import config
            _embedding_rag = EmbeddingRAGSystem(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar Embedding RAG: {e}")
            return None
    
    return _embedding_rag

# Função principal para uso no sistema
def get_rag_context(query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
    """
    Função principal para obter contexto RAG
    Usa embeddings se disponível, fallback para TF-IDF
    """
    rag = get_embedding_rag()
    
    if rag:
        return rag.get_context(query, max_chunks, persona)
    
    # Fallback direto se Embedding RAG não disponível
    if MEDICAL_RAG_AVAILABLE:
        return medical_rag_system.get_relevant_context(query, max_chunks)
    
    return ""