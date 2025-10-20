# -*- coding: utf-8 -*-
"""
Real Vector Store - 100% REAL SUPABASE PGVECTOR INTEGRATION
NO MOCKS - Only real Supabase PostgreSQL with pgvector extension
Replaces ALL mock vector store implementations
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime, timezone
from dataclasses import dataclass
import numpy as np

# Import REAL cloud manager - NO MOCKS
from core.cloud.unified_real_cloud_manager import get_unified_cloud_manager

logger = logging.getLogger(__name__)

@dataclass
class VectorDocument:
    """Document with vector embedding for real storage"""
    content: str
    embedding: List[float]
    metadata: Dict[str, Any]
    source: str
    doc_id: Optional[str] = None
    created_at: Optional[datetime] = None

@dataclass
class VectorSearchResult:
    """Result from real vector similarity search"""
    document: VectorDocument
    similarity: float
    doc_id: str
    metadata: Dict[str, Any]

class RealVectorStore:
    """
    REAL Vector Store using Supabase pgvector - NO MOCKS
    100% real PostgreSQL with pgvector extension integration
    """

    def __init__(self, config):
        self.config = config

        # Get REAL cloud manager and Supabase client
        try:
            self.cloud_manager = get_unified_cloud_manager(config)
            self.real_supabase = self.cloud_manager.get_supabase_client()

            if not self.real_supabase:
                raise RuntimeError("Real Supabase client is required for vector store")

            if not hasattr(self.real_supabase, 'pg_conn') or not self.real_supabase.pg_conn:
                raise RuntimeError("Real PostgreSQL connection is required for pgvector operations")

        except Exception as e:
            logger.error(f"❌ CRITICAL: Real vector store cannot initialize without real Supabase: {e}")
            raise RuntimeError(f"Real vector store requires real Supabase with pgvector: {e}")

        # Vector configuration
        self.vector_dimension = getattr(config, 'SUPABASE_VECTOR_DIMENSION', 1536)  # OpenAI embedding dimension
        self.similarity_threshold = getattr(config, 'SUPABASE_VECTOR_SIMILARITY_THRESHOLD', 0.8)

        # Statistics
        self.stats = {
            'documents_stored': 0,
            'searches_performed': 0,
            'vectors_indexed': 0,
            'storage_operations': 0,
            'total_documents': 0
        }

        # Ensure vector tables are set up
        self._setup_vector_tables()

        logger.info("🚀 REAL VECTOR STORE initialized - NO MOCKS")
        logger.info(f"   ✅ Real Supabase pgvector: ACTIVE")
        logger.info(f"   ✅ Vector dimension: {self.vector_dimension}")
        logger.info(f"   ✅ Similarity threshold: {self.similarity_threshold}")

    def _setup_vector_tables(self):
        """Setup pgvector tables for real vector storage"""
        try:
            with self.real_supabase.pg_conn.cursor() as cursor:
                # Enable pgvector extension
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

                # Create enhanced knowledge base vectors table
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS knowledge_vectors (
                        id SERIAL PRIMARY KEY,
                        content TEXT NOT NULL,
                        embedding vector({self.vector_dimension}) NOT NULL,
                        metadata JSONB DEFAULT '{{}}',
                        source VARCHAR(255),
                        doc_id VARCHAR(255),
                        content_hash VARCHAR(64) UNIQUE,
                        chunk_index INTEGER DEFAULT 0,
                        total_chunks INTEGER DEFAULT 1,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                # Create optimized index for vector similarity search
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS knowledge_vectors_embedding_cosine_idx
                    ON knowledge_vectors
                    USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                """)

                # Create index for content hash (deduplication)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS knowledge_vectors_content_hash_idx
                    ON knowledge_vectors (content_hash);
                """)

                # Create index for source and doc_id
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS knowledge_vectors_source_idx
                    ON knowledge_vectors (source, doc_id);
                """)

                # Create updated_at index for maintenance
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS knowledge_vectors_updated_at_idx
                    ON knowledge_vectors (updated_at);
                """)

                logger.info("✅ Real pgvector tables and indexes created successfully")

        except Exception as e:
            logger.error(f"❌ Failed to setup real vector tables: {e}")
            raise RuntimeError(f"Vector table setup failed: {e}")

    def store_document(self, document: VectorDocument) -> str:
        """Store document with vector embedding in real pgvector database"""
        try:
            # Generate content hash for deduplication
            content_hash = hashlib.sha256(document.content.encode()).hexdigest()

            # Generate doc_id if not provided
            if not document.doc_id:
                document.doc_id = f"doc_{content_hash[:16]}"

            with self.real_supabase.pg_conn.cursor() as cursor:
                # Check if document already exists (by content hash)
                cursor.execute("""
                    SELECT id, doc_id FROM knowledge_vectors
                    WHERE content_hash = %s
                """, (content_hash,))

                existing = cursor.fetchone()
                if existing:
                    logger.debug(f"Document already exists: {existing[1]}")
                    return existing[1]

                # Insert new document with vector
                cursor.execute("""
                    INSERT INTO knowledge_vectors (
                        content, embedding, metadata, source, doc_id, content_hash,
                        chunk_index, total_chunks, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, doc_id;
                """, (
                    document.content,
                    document.embedding,
                    json.dumps(document.metadata),
                    document.source,
                    document.doc_id,
                    content_hash,
                    document.metadata.get('chunk_index', 0),
                    document.metadata.get('total_chunks', 1),
                    document.created_at or datetime.now(timezone.utc),
                    datetime.now(timezone.utc)
                ))

                result = cursor.fetchone()
                stored_id, stored_doc_id = result

                self.stats['documents_stored'] += 1
                self.stats['vectors_indexed'] += 1
                self.stats['storage_operations'] += 1

                logger.info(f"✅ Document stored in real pgvector: {stored_doc_id} (ID: {stored_id})")
                return stored_doc_id

        except Exception as e:
            logger.error(f"❌ Failed to store document in real vector store: {e}")
            raise RuntimeError(f"Document storage failed: {e}")

    def store_documents(self, documents: List[VectorDocument]) -> List[str]:
        """Store multiple documents efficiently in real pgvector"""
        try:
            stored_doc_ids = []

            with self.real_supabase.pg_conn.cursor() as cursor:
                for document in documents:
                    # Generate content hash for deduplication
                    content_hash = hashlib.sha256(document.content.encode()).hexdigest()

                    # Generate doc_id if not provided
                    if not document.doc_id:
                        document.doc_id = f"doc_{content_hash[:16]}"

                    # Check if document already exists
                    cursor.execute("""
                        SELECT doc_id FROM knowledge_vectors WHERE content_hash = %s
                    """, (content_hash,))

                    existing = cursor.fetchone()
                    if existing:
                        stored_doc_ids.append(existing[0])
                        continue

                    # Insert new document
                    cursor.execute("""
                        INSERT INTO knowledge_vectors (
                            content, embedding, metadata, source, doc_id, content_hash,
                            chunk_index, total_chunks, created_at, updated_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING doc_id;
                    """, (
                        document.content,
                        document.embedding,
                        json.dumps(document.metadata),
                        document.source,
                        document.doc_id,
                        content_hash,
                        document.metadata.get('chunk_index', 0),
                        document.metadata.get('total_chunks', 1),
                        document.created_at or datetime.now(timezone.utc),
                        datetime.now(timezone.utc)
                    ))

                    result = cursor.fetchone()
                    stored_doc_ids.append(result[0])

                    self.stats['documents_stored'] += 1
                    self.stats['vectors_indexed'] += 1

                self.stats['storage_operations'] += 1

                logger.info(f"✅ Bulk stored {len(stored_doc_ids)} documents in real pgvector")
                return stored_doc_ids

        except Exception as e:
            logger.error(f"❌ Failed to bulk store documents in real vector store: {e}")
            raise RuntimeError(f"Bulk document storage failed: {e}")

    def search_similar(
        self,
        query_embedding: List[float],
        limit: int = 5,
        similarity_threshold: Optional[float] = None,
        source_filter: Optional[str] = None,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[VectorSearchResult]:
        """Search for similar vectors using real pgvector similarity"""
        try:
            threshold = similarity_threshold or self.similarity_threshold

            with self.real_supabase.pg_conn.cursor() as cursor:
                # Build query with filters
                query_parts = ["""
                    SELECT
                        id,
                        content,
                        metadata,
                        source,
                        doc_id,
                        chunk_index,
                        total_chunks,
                        1 - (embedding <=> %s) as similarity,
                        created_at
                    FROM knowledge_vectors
                    WHERE 1 - (embedding <=> %s) > %s
                """]

                query_params = [query_embedding, query_embedding, threshold]

                # Add source filter
                if source_filter:
                    query_parts.append("AND source = %s")
                    query_params.append(source_filter)

                # Add metadata filters
                if metadata_filter:
                    for key, value in metadata_filter.items():
                        query_parts.append(f"AND metadata->>{key!r} = %s")
                        query_params.append(str(value))

                # Order by similarity and limit
                query_parts.append("ORDER BY embedding <=> %s LIMIT %s")
                query_params.extend([query_embedding, limit])

                full_query = "\n".join(query_parts)
                cursor.execute(full_query, query_params)

                results = cursor.fetchall()

                # Convert to VectorSearchResult objects
                search_results = []
                for row in results:
                    (doc_id, content, metadata, source, doc_id_field,
                     chunk_index, total_chunks, similarity, created_at) = row

                    # Parse metadata
                    parsed_metadata = json.loads(metadata) if isinstance(metadata, str) else metadata

                    # Create VectorDocument
                    vector_doc = VectorDocument(
                        content=content,
                        embedding=[],  # Don't return embedding to save memory
                        metadata=parsed_metadata,
                        source=source,
                        doc_id=doc_id_field,
                        created_at=created_at
                    )

                    # Create search result
                    search_result = VectorSearchResult(
                        document=vector_doc,
                        similarity=float(similarity),
                        doc_id=doc_id_field,
                        metadata=parsed_metadata
                    )

                    search_results.append(search_result)

                self.stats['searches_performed'] += 1

                logger.info(f"✅ Found {len(search_results)} similar vectors (threshold: {threshold})")
                return search_results

        except Exception as e:
            logger.error(f"❌ Vector similarity search failed: {e}")
            raise RuntimeError(f"Vector search failed: {e}")

    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Get specific document by doc_id from real vector store"""
        try:
            with self.real_supabase.pg_conn.cursor() as cursor:
                cursor.execute("""
                    SELECT content, embedding, metadata, source, doc_id, created_at
                    FROM knowledge_vectors
                    WHERE doc_id = %s
                """, (doc_id,))

                result = cursor.fetchone()
                if not result:
                    return None

                content, embedding, metadata, source, doc_id_field, created_at = result

                # Convert embedding from vector to list
                if isinstance(embedding, str):
                    # Parse vector string format: [1.0,2.0,3.0]
                    embedding = json.loads(embedding.replace('[', '[').replace(']', ']'))
                elif hasattr(embedding, 'tolist'):
                    embedding = embedding.tolist()

                # Parse metadata
                parsed_metadata = json.loads(metadata) if isinstance(metadata, str) else metadata

                return VectorDocument(
                    content=content,
                    embedding=embedding,
                    metadata=parsed_metadata,
                    source=source,
                    doc_id=doc_id_field,
                    created_at=created_at
                )

        except Exception as e:
            logger.error(f"❌ Failed to get document {doc_id}: {e}")
            return None

    def delete_document(self, doc_id: str) -> bool:
        """Delete document from real vector store"""
        try:
            with self.real_supabase.pg_conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM knowledge_vectors WHERE doc_id = %s
                    RETURNING id
                """, (doc_id,))

                result = cursor.fetchone()
                if result:
                    logger.info(f"✅ Deleted document {doc_id} from real vector store")
                    return True
                else:
                    logger.warning(f"Document {doc_id} not found for deletion")
                    return False

        except Exception as e:
            logger.error(f"❌ Failed to delete document {doc_id}: {e}")
            return False

    def delete_by_source(self, source: str) -> int:
        """Delete all documents from a specific source"""
        try:
            with self.real_supabase.pg_conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM knowledge_vectors WHERE source = %s
                """, (source,))

                deleted_count = cursor.rowcount
                logger.info(f"✅ Deleted {deleted_count} documents from source: {source}")
                return deleted_count

        except Exception as e:
            logger.error(f"❌ Failed to delete documents from source {source}: {e}")
            return 0

    def update_document(self, doc_id: str, content: str = None, metadata: Dict[str, Any] = None) -> bool:
        """Update document content or metadata in real vector store"""
        try:
            update_parts = []
            params = []

            if content is not None:
                update_parts.append("content = %s")
                params.append(content)

            if metadata is not None:
                update_parts.append("metadata = %s")
                params.append(json.dumps(metadata))

            if not update_parts:
                return True  # Nothing to update

            update_parts.append("updated_at = %s")
            params.append(datetime.now(timezone.utc))
            params.append(doc_id)

            with self.real_supabase.pg_conn.cursor() as cursor:
                query = f"""
                    UPDATE knowledge_vectors
                    SET {', '.join(update_parts)}
                    WHERE doc_id = %s
                    RETURNING id
                """
                cursor.execute(query, params)

                result = cursor.fetchone()
                if result:
                    logger.info(f"✅ Updated document {doc_id}")
                    return True
                else:
                    logger.warning(f"Document {doc_id} not found for update")
                    return False

        except Exception as e:
            logger.error(f"❌ Failed to update document {doc_id}: {e}")
            return False

    def list_sources(self) -> List[str]:
        """List all unique sources in real vector store"""
        try:
            with self.real_supabase.pg_conn.cursor() as cursor:
                cursor.execute("""
                    SELECT DISTINCT source FROM knowledge_vectors
                    WHERE source IS NOT NULL
                    ORDER BY source
                """)

                sources = [row[0] for row in cursor.fetchall()]
                return sources

        except Exception as e:
            logger.error(f"❌ Failed to list sources: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive real vector store statistics"""
        try:
            with self.real_supabase.pg_conn.cursor() as cursor:
                # Get total documents
                cursor.execute("SELECT COUNT(*) FROM knowledge_vectors")
                total_docs = cursor.fetchone()[0]

                # Get documents by source
                cursor.execute("""
                    SELECT source, COUNT(*)
                    FROM knowledge_vectors
                    GROUP BY source
                    ORDER BY COUNT(*) DESC
                """)
                docs_by_source = dict(cursor.fetchall())

                # Get recent activity
                cursor.execute("""
                    SELECT COUNT(*) FROM knowledge_vectors
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                """)
                docs_last_24h = cursor.fetchone()[0]

                # Update stats
                self.stats['total_documents'] = total_docs

                return {
                    'total_documents': total_docs,
                    'documents_by_source': docs_by_source,
                    'documents_last_24h': docs_last_24h,
                    'vector_dimension': self.vector_dimension,
                    'similarity_threshold': self.similarity_threshold,
                    'operation_stats': self.stats.copy(),
                    'database_type': 'supabase_pgvector',
                    'mock_services': 0  # ALWAYS ZERO - NO MOCKS
                }

        except Exception as e:
            logger.error(f"❌ Failed to get vector store stats: {e}")
            return {'error': str(e)}

    def health_check(self) -> Dict[str, Any]:
        """Health check for real vector store"""
        try:
            health_status = {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'components': {}
            }

            # Check PostgreSQL connection
            with self.real_supabase.pg_conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

                health_status['components']['postgresql'] = {
                    'healthy': True,
                    'connection': 'active'
                }

                # Check pgvector extension
                cursor.execute("SELECT * FROM pg_extension WHERE extname = 'vector'")
                vector_ext = cursor.fetchone()

                health_status['components']['pgvector'] = {
                    'healthy': vector_ext is not None,
                    'installed': vector_ext is not None
                }

                # Check knowledge_vectors table
                cursor.execute("""
                    SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_name = 'knowledge_vectors'
                """)
                table_exists = cursor.fetchone()[0] > 0

                health_status['components']['vector_table'] = {
                    'healthy': table_exists,
                    'exists': table_exists
                }

                # Overall health
                all_healthy = all(
                    comp['healthy']
                    for comp in health_status['components'].values()
                )
                health_status['overall_healthy'] = all_healthy

                if all_healthy:
                    logger.info("✅ Real vector store health check PASSED")
                else:
                    logger.error("❌ Real vector store health check FAILED")

                return health_status

        except Exception as e:
            logger.error(f"❌ Vector store health check error: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'error': str(e)
            }

# Global instance
_real_vector_store: Optional[RealVectorStore] = None

def get_real_vector_store() -> Optional[RealVectorStore]:
    """Get global real vector store instance"""
    global _real_vector_store

    if _real_vector_store is None:
        try:
            from app_config import config
            _real_vector_store = RealVectorStore(config)
        except Exception as e:
            logger.error(f"❌ CRITICAL: Cannot initialize real vector store: {e}")
            raise RuntimeError(f"Real vector store requires real Supabase with pgvector: {e}")

    return _real_vector_store

def reset_real_vector_store():
    """Reset global vector store instance (for testing)"""
    global _real_vector_store
    _real_vector_store = None

# Backward compatibility aliases
SupabaseVectorStore = RealVectorStore
get_vector_store = get_real_vector_store

# Export
__all__ = [
    'RealVectorStore',
    'VectorDocument',
    'VectorSearchResult',
    'get_real_vector_store',
    'reset_real_vector_store',
    'SupabaseVectorStore',  # Backward compatibility
    'get_vector_store'      # Backward compatibility
]