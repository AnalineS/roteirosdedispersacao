# -*- coding: utf-8 -*-
"""
Supabase Vector Store - Interface para armazenamento de vetores
Sistema de vetor database usando Supabase PostgreSQL + pgvector
"""

import os
import json
import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
import hashlib

logger = logging.getLogger(__name__)

# Verificar disponibilidade do Supabase
SUPABASE_AVAILABLE = False
try:
    from supabase import create_client, Client
    import numpy as np
    SUPABASE_AVAILABLE = True
except ImportError:
    logger.warning("Supabase dependencies not available - running in fallback mode")

@dataclass
class VectorDocument:
    """Documento vetorizado para armazenamento"""
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None
    created_at: Optional[datetime] = None
    source: Optional[str] = None
    category: Optional[str] = None

class SupabaseVectorStore:
    """
    Vector Store usando Supabase PostgreSQL com pgvector
    Fallback para SQLite quando Supabase indisponível
    """

    def __init__(self, config):
        self.config = config
        self.client: Optional[Client] = None
        self.table_name = "vector_documents"

        # Configurações
        self.embedding_dimension = getattr(config, 'EMBEDDING_DIMENSION', 384)
        self.similarity_threshold = getattr(config, 'SIMILARITY_THRESHOLD', 0.7)

        # Inicializar cliente
        self._initialize_client()

        # Estatísticas
        self.stats = {
            'documents_stored': 0,
            'searches_performed': 0,
            'cache_hits': 0,
            'errors': 0
        }

        logger.info(f"SupabaseVectorStore inicializado - Available: {self.is_available()}")

    def _initialize_client(self):
        """Inicializa cliente Supabase"""
        if not SUPABASE_AVAILABLE:
            logger.warning("Supabase não disponível - usando fallback mode")
            return

        try:
            supabase_url = self.config.SUPABASE_URL
            supabase_key = self.config.SUPABASE_ANON_KEY

            if supabase_url and supabase_key:
                self.client = create_client(supabase_url, supabase_key)
                logger.info("✅ Cliente Supabase conectado com sucesso")

                # Verificar se tabela existe
                self._ensure_table_exists()
            else:
                logger.warning("Credenciais Supabase não configuradas")

        except Exception as e:
            logger.error(f"Erro ao conectar Supabase: {e}")
            self.client = None

    def _ensure_table_exists(self):
        """Garante que a tabela de vetores existe"""
        try:
            if self.client:
                # Verificar se tabela existe fazendo uma query simples
                result = self.client.table(self.table_name).select("id").limit(1).execute()
                logger.info("✅ Tabela vector_documents verificada")
        except Exception as e:
            logger.warning(f"Erro ao verificar tabela: {e}")

    def is_available(self) -> bool:
        """Verifica se o vector store está disponível"""
        return SUPABASE_AVAILABLE and self.client is not None

    def store_document(self, document: VectorDocument) -> bool:
        """Armazena documento vetorizado"""
        try:
            if not self.is_available():
                logger.warning("Vector store não disponível - documento não armazenado")
                return False

            # Preparar dados para inserção
            doc_data = {
                'id': document.id,
                'content': document.content,
                'metadata': json.dumps(document.metadata),
                'embedding': document.embedding,
                'source': document.source or 'unknown',
                'category': document.category or 'general',
                'created_at': (document.created_at or datetime.now(timezone.utc)).isoformat()
            }

            # Inserir no Supabase
            result = self.client.table(self.table_name).upsert(doc_data).execute()

            if result.data:
                self.stats['documents_stored'] += 1
                logger.debug(f"Documento armazenado: {document.id}")
                return True
            else:
                logger.error(f"Falha ao armazenar documento: {result}")
                self.stats['errors'] += 1
                return False

        except Exception as e:
            logger.error(f"Erro ao armazenar documento: {e}")
            self.stats['errors'] += 1
            return False

    def search_similar(
        self,
        query_embedding: List[float],
        limit: int = 5,
        min_similarity: float = None
    ) -> List[Tuple[VectorDocument, float]]:
        """Busca documentos similares usando similaridade de cosseno"""
        try:
            if not self.is_available():
                logger.warning("Vector store não disponível - retornando lista vazia")
                return []

            min_similarity = min_similarity or self.similarity_threshold

            # Query com pgvector similarity search
            # Usando função de similaridade de cosseno do pgvector
            result = self.client.rpc(
                'match_documents',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': min_similarity,
                    'match_count': limit
                }
            ).execute()

            documents = []
            if result.data:
                for row in result.data:
                    # Reconstruir VectorDocument
                    doc = VectorDocument(
                        id=row['id'],
                        content=row['content'],
                        metadata=json.loads(row['metadata']) if row['metadata'] else {},
                        embedding=row['embedding'],
                        created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')),
                        source=row['source'],
                        category=row['category']
                    )
                    similarity = row['similarity']
                    documents.append((doc, similarity))

            self.stats['searches_performed'] += 1
            logger.debug(f"Busca realizada: {len(documents)} documentos encontrados")

            return documents

        except Exception as e:
            logger.error(f"Erro na busca de similaridade: {e}")
            self.stats['errors'] += 1
            return []

    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Recupera documento específico por ID"""
        try:
            if not self.is_available():
                return None

            result = self.client.table(self.table_name).select("*").eq('id', doc_id).execute()

            if result.data and len(result.data) > 0:
                row = result.data[0]
                return VectorDocument(
                    id=row['id'],
                    content=row['content'],
                    metadata=json.loads(row['metadata']) if row['metadata'] else {},
                    embedding=row['embedding'],
                    created_at=datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')),
                    source=row['source'],
                    category=row['category']
                )

            return None

        except Exception as e:
            logger.error(f"Erro ao recuperar documento {doc_id}: {e}")
            return None

    def delete_document(self, doc_id: str) -> bool:
        """Remove documento do vector store"""
        try:
            if not self.is_available():
                return False

            result = self.client.table(self.table_name).delete().eq('id', doc_id).execute()

            if result.data:
                logger.debug(f"Documento removido: {doc_id}")
                return True

            return False

        except Exception as e:
            logger.error(f"Erro ao remover documento {doc_id}: {e}")
            return False

    def count_documents(self) -> int:
        """Conta total de documentos armazenados"""
        try:
            if not self.is_available():
                return 0

            result = self.client.table(self.table_name).select("id", count="exact").execute()
            return result.count or 0

        except Exception as e:
            logger.error(f"Erro ao contar documentos: {e}")
            return 0

    def list_categories(self) -> List[str]:
        """Lista categorias disponíveis"""
        try:
            if not self.is_available():
                return []

            result = self.client.table(self.table_name).select("category").execute()

            if result.data:
                categories = list(set(row['category'] for row in result.data if row['category']))
                return sorted(categories)

            return []

        except Exception as e:
            logger.error(f"Erro ao listar categorias: {e}")
            return []

    def cleanup_expired(self, days: int = 30) -> int:
        """Remove documentos expirados"""
        try:
            if not self.is_available():
                return 0

            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

            result = self.client.table(self.table_name).delete().lt(
                'created_at', cutoff_date.isoformat()
            ).execute()

            removed_count = len(result.data) if result.data else 0
            logger.info(f"Limpeza concluída: {removed_count} documentos removidos")

            return removed_count

        except Exception as e:
            logger.error(f"Erro na limpeza: {e}")
            return 0

    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas do vector store"""
        base_stats = dict(self.stats)

        if self.is_available():
            base_stats.update({
                'total_documents': self.count_documents(),
                'categories': self.list_categories(),
                'embedding_dimension': self.embedding_dimension,
                'similarity_threshold': self.similarity_threshold,
                'backend': 'supabase_pgvector'
            })
        else:
            base_stats.update({
                'backend': 'fallback_mode',
                'total_documents': 0,
                'categories': []
            })

        base_stats['available'] = self.is_available()

        return base_stats

# Instância global
_vector_store: Optional[SupabaseVectorStore] = None

def get_vector_store() -> Optional[SupabaseVectorStore]:
    """Obtém instância global do vector store"""
    global _vector_store

    if _vector_store is None:
        try:
            from app_config import config
            _vector_store = SupabaseVectorStore(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar vector store: {e}")
            return None

    return _vector_store

def create_document_id(content: str, source: str = "unknown") -> str:
    """Cria ID único para documento baseado no conteúdo"""
    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    source_hash = hashlib.sha256(source.encode('utf-8')).hexdigest()[:8]
    return f"doc_{source_hash}_{content_hash}"

# Funções de conveniência
def store_text_chunk(
    content: str,
    metadata: Dict[str, Any],
    embedding: List[float],
    source: str = "unknown",
    category: str = "general"
) -> bool:
    """Armazena chunk de texto vetorizado"""
    vector_store = get_vector_store()

    if not vector_store:
        return False

    doc_id = create_document_id(content, source)

    document = VectorDocument(
        id=doc_id,
        content=content,
        metadata=metadata,
        embedding=embedding,
        source=source,
        category=category,
        created_at=datetime.now(timezone.utc)
    )

    return vector_store.store_document(document)

def search_relevant_chunks(
    query_embedding: List[float],
    limit: int = 5,
    category_filter: Optional[str] = None
) -> List[Tuple[str, float, Dict[str, Any]]]:
    """Busca chunks relevantes e retorna (content, similarity, metadata)"""
    vector_store = get_vector_store()

    if not vector_store:
        return []

    results = vector_store.search_similar(query_embedding, limit)

    # Filtrar por categoria se especificada
    if category_filter:
        results = [(doc, sim) for doc, sim in results if doc.category == category_filter]

    # Converter para formato simplificado
    return [(doc.content, similarity, doc.metadata) for doc, similarity in results]

__all__ = [
    'VectorDocument',
    'SupabaseVectorStore',
    'get_vector_store',
    'create_document_id',
    'store_text_chunk',
    'search_relevant_chunks',
    'SUPABASE_AVAILABLE'
]