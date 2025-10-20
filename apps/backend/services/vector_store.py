# -*- coding: utf-8 -*-
"""
Vector Store Service - Real implementation with Supabase pgvector integration
This is the main vector store service that provides a unified interface for vector operations.
"""

import os
import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any, Union
from datetime import datetime
from dataclasses import dataclass, asdict
import numpy as np

logger = logging.getLogger(__name__)

# Attempt to import psycopg2 for PostgreSQL operations
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    psycopg2 = None

# Import JSON for metadata handling
import json

@dataclass
class VectorDocument:
    """Document with vector embedding for semantic search"""
    id: str
    text: str
    embedding: Optional[np.ndarray]
    metadata: Dict[str, Any]
    chunk_type: str  # 'dosage', 'protocol', 'general', etc
    priority: float  # 0.0 to 1.0
    source_file: Optional[str] = None
    created_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary (without embedding for serialization)"""
        data = asdict(self)
        data.pop('embedding', None)  # Remove embedding from dict
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        return data

    def to_dict_with_embedding(self) -> Dict:
        """Convert to dictionary including embedding as list"""
        data = self.to_dict()
        if self.embedding is not None:
            data['embedding'] = self.embedding.tolist()
        return data

class SupabaseVectorStore:
    """
    Real vector store implementation using Supabase PostgreSQL with pgvector extension
    Provides production-ready vector storage and similarity search capabilities
    """

    def __init__(self, config):
        self.config = config
        self.connection = None
        self.table_name = 'medical_embeddings'

        # Connection parameters from config
        self.supabase_url = getattr(config, 'SUPABASE_URL', os.getenv('SUPABASE_URL'))
        self.supabase_key = getattr(config, 'SUPABASE_ANON_KEY', os.getenv('SUPABASE_ANON_KEY'))
        self.supabase_db_url = getattr(config, 'SUPABASE_DB_URL', os.getenv('SUPABASE_DB_URL'))
        self.database_url = getattr(config, 'DATABASE_URL', os.getenv('DATABASE_URL'))

        # Vector dimensions (based on sentence-transformers models)
        self.embedding_dimension = getattr(config, 'EMBEDDING_DIMENSION', 384)

        # Initialize connection
        self._initialize_connection()

        # Create tables if they don't exist
        if self.connection:
            self._create_tables()
            logger.info(f"[OK] SupabaseVectorStore initialized with {self.embedding_dimension}D embeddings")
        else:
            logger.warning("[WARNING] SupabaseVectorStore failed to initialize - no database connection")

    def _initialize_connection(self):
        """Initialize PostgreSQL connection to Supabase"""
        if not PSYCOPG2_AVAILABLE:
            logger.error("[ERROR] psycopg2 not available - install with: pip install psycopg2-binary")
            return

        try:
            # IMPORTANT: Vector store ONLY uses Supabase PostgreSQL, NOT SQLite
            # SQLite DATABASE_URL is for other data, not vector embeddings

            # Priority 1: Use SUPABASE_DB_URL (direct PostgreSQL connection string)
            if self.supabase_db_url and 'postgresql' in self.supabase_db_url.lower():
                self.connection = psycopg2.connect(self.supabase_db_url)
                logger.info("[OK] Connected to Supabase via SUPABASE_DB_URL (direct PostgreSQL)")

            # Priority 2: Use SUPABASE_URL + SUPABASE_ANON_KEY
            elif self.supabase_url and self.supabase_key:
                # Build connection from Supabase URL
                # Extract connection details from Supabase URL
                supabase_host = self.supabase_url.replace('https://', '').replace('http://', '')

                # Supabase connection format
                self.connection = psycopg2.connect(
                    host=f"db.{supabase_host}",
                    port=5432,
                    database="postgres",
                    user="postgres",
                    password=self.supabase_key
                )
                logger.info("[OK] Connected to Supabase via URL/KEY for vector storage")

            # Priority 3: Use DATABASE_URL only if it's PostgreSQL (not SQLite)
            elif self.database_url and 'postgresql' in self.database_url.lower():
                self.connection = psycopg2.connect(self.database_url)
                logger.info("[OK] Connected to Supabase via DATABASE_URL (PostgreSQL)")

            else:
                logger.warning("[WARNING] No Supabase PostgreSQL connection details available")
                logger.warning("[WARNING] SQLite DATABASE_URL ignored - vector store requires PostgreSQL")
                return

            # Enable autocommit for DDL operations
            self.connection.autocommit = True

        except Exception as e:
            logger.error(f"[ERROR] Failed to connect to Supabase: {e}")
            self.connection = None

    def _create_tables(self):
        """Create necessary tables and enable pgvector extension"""
        if not self.connection:
            return

        try:
            with self.connection.cursor() as cursor:
                # Enable pgvector extension
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

                # Create medical_embeddings table
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} (
                        id TEXT PRIMARY KEY,
                        text TEXT NOT NULL,
                        embedding vector({self.embedding_dimension}),
                        metadata JSONB DEFAULT '{{}}',
                        chunk_type TEXT DEFAULT 'general',
                        priority REAL DEFAULT 0.5,
                        source_file TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """)

                # Create index for vector similarity search
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS {self.table_name}_embedding_idx
                    ON {self.table_name} USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                """)

                # Create index for chunk_type filtering
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS {self.table_name}_chunk_type_idx
                    ON {self.table_name} (chunk_type);
                """)

                # Create index for priority ordering
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS {self.table_name}_priority_idx
                    ON {self.table_name} (priority DESC);
                """)

                logger.info(f"[OK] Tables and indexes created for {self.table_name}")

        except Exception as e:
            logger.error(f"[ERROR] Failed to create tables: {e}")

    def add_document(self, document: VectorDocument) -> bool:
        """Add document to vector store"""
        if not self.connection or document.embedding is None:
            return False

        try:
            with self.connection.cursor() as cursor:
                # Convert embedding to vector format
                embedding_str = '[' + ','.join(map(str, document.embedding.tolist())) + ']'

                # Insert document
                cursor.execute(f"""
                    INSERT INTO {self.table_name}
                    (id, text, embedding, metadata, chunk_type, priority, source_file, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        text = EXCLUDED.text,
                        embedding = EXCLUDED.embedding,
                        metadata = EXCLUDED.metadata,
                        chunk_type = EXCLUDED.chunk_type,
                        priority = EXCLUDED.priority,
                        source_file = EXCLUDED.source_file,
                        updated_at = NOW()
                """, (
                    document.id,
                    document.text,
                    embedding_str,
                    json.dumps(document.metadata),
                    document.chunk_type,
                    document.priority,
                    document.source_file,
                    document.created_at or datetime.now()
                ))

                logger.debug(f"[OK] Document added: {document.id}")
                return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to add document: {e}")
            return False

    def search_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        min_score: float = 0.0,
        chunk_types: Optional[List[str]] = None
    ) -> List[Tuple[VectorDocument, float]]:
        """Search for similar documents using cosine similarity"""
        if not self.connection:
            return []

        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Convert embedding to vector format
                embedding_str = '[' + ','.join(map(str, query_embedding.tolist())) + ']'

                # Build query with optional chunk type filtering
                base_query = f"""
                    SELECT
                        id, text, metadata, chunk_type, priority, source_file, created_at,
                        1 - (embedding <=> %s::vector) AS similarity_score
                    FROM {self.table_name}
                """

                params = [embedding_str]

                if chunk_types:
                    base_query += " WHERE chunk_type = ANY(%s)"
                    params.append(chunk_types)

                base_query += """
                    ORDER BY similarity_score DESC
                    LIMIT %s
                """
                params.append(top_k)

                cursor.execute(base_query, params)
                rows = cursor.fetchall()

                results = []
                for row in rows:
                    if row['similarity_score'] >= min_score:
                        doc = VectorDocument(
                            id=row['id'],
                            text=row['text'],
                            embedding=None,  # Don't return embedding for efficiency
                            metadata=row['metadata'] or {},
                            chunk_type=row['chunk_type'],
                            priority=row['priority'],
                            source_file=row['source_file'],
                            created_at=row['created_at']
                        )
                        results.append((doc, float(row['similarity_score'])))

                logger.debug(f"[OK] Found {len(results)} similar documents")
                return results

        except Exception as e:
            logger.error(f"[ERROR] Failed to search similar documents: {e}")
            return []

    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Get document by ID"""
        if not self.connection:
            return None

        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(f"""
                    SELECT id, text, metadata, chunk_type, priority, source_file, created_at
                    FROM {self.table_name}
                    WHERE id = %s
                """, (doc_id,))

                row = cursor.fetchone()

                if row:
                    return VectorDocument(
                        id=row['id'],
                        text=row['text'],
                        embedding=None,
                        metadata=row['metadata'] or {},
                        chunk_type=row['chunk_type'],
                        priority=row['priority'],
                        source_file=row['source_file'],
                        created_at=row['created_at']
                    )

                return None

        except Exception as e:
            logger.error(f"[ERROR] Failed to get document: {e}")
            return None

    def delete_document(self, doc_id: str) -> bool:
        """Delete document by ID"""
        if not self.connection:
            return False

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"""
                    DELETE FROM {self.table_name}
                    WHERE id = %s
                """, (doc_id,))

                return cursor.rowcount > 0

        except Exception as e:
            logger.error(f"[ERROR] Failed to delete document: {e}")
            return False

    def clear(self):
        """Clear all documents (use with caution)"""
        if not self.connection:
            return

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"DELETE FROM {self.table_name}")
                logger.warning(f"[WARNING] Cleared all documents from {self.table_name}")

        except Exception as e:
            logger.error(f"[ERROR] Failed to clear documents: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        if not self.connection:
            return {'error': 'no_connection'}

        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Total documents
                cursor.execute(f"SELECT COUNT(*) as total FROM {self.table_name}")
                total_docs = cursor.fetchone()['total']

                # Documents by chunk type
                cursor.execute(f"""
                    SELECT chunk_type, COUNT(*) as count
                    FROM {self.table_name}
                    GROUP BY chunk_type
                    ORDER BY count DESC
                """)
                chunk_types = {row['chunk_type']: row['count'] for row in cursor.fetchall()}

                # Average priority
                cursor.execute(f"SELECT AVG(priority) as avg_priority FROM {self.table_name}")
                avg_priority = cursor.fetchone()['avg_priority'] or 0.0

                return {
                    'total_documents': total_docs,
                    'chunk_types': chunk_types,
                    'average_priority': float(avg_priority),
                    'embedding_dimension': self.embedding_dimension,
                    'backend': 'supabase_postgresql',
                    'connection_status': 'connected'
                }

        except Exception as e:
            logger.error(f"[ERROR] Failed to get stats: {e}")
            return {'error': str(e)}

    def is_available(self) -> bool:
        """Check if vector store is available"""
        return self.connection is not None

    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
            logger.info("[OK] Supabase connection closed")

class LocalVectorStore:
    """
    Local fallback vector store using numpy and file storage
    For development and testing when Supabase is not available
    """

    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self.documents: Dict[str, VectorDocument] = {}
        self.embeddings: List[np.ndarray] = []
        self.doc_ids: List[str] = []

        os.makedirs(storage_path, exist_ok=True)
        self._load_store()

        logger.info(f"[OK] LocalVectorStore initialized at {storage_path}")

    def _load_store(self):
        """Load vector store from disk"""
        try:
            embeddings_file = os.path.join(self.storage_path, "embeddings.npy")
            metadata_file = os.path.join(self.storage_path, "metadata.json")

            if os.path.exists(embeddings_file):
                self.embeddings = np.load(embeddings_file, allow_pickle=True).tolist()

            if os.path.exists(metadata_file):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                for doc_id, doc_data in metadata.items():
                    self.documents[doc_id] = VectorDocument(
                        id=doc_id,
                        text=doc_data['text'],
                        embedding=None,  # Loaded on demand
                        metadata=doc_data.get('metadata', {}),
                        chunk_type=doc_data.get('chunk_type', 'general'),
                        priority=doc_data.get('priority', 0.5),
                        source_file=doc_data.get('source_file'),
                        created_at=datetime.fromisoformat(doc_data['created_at']) if doc_data.get('created_at') else None
                    )

                self.doc_ids = list(self.documents.keys())

            logger.info(f"[OK] Loaded {len(self.documents)} documents from local store")

        except Exception as e:
            logger.warning(f"[WARNING] Failed to load local store: {e}")
            self.documents = {}
            self.embeddings = []
            self.doc_ids = []

    def _save_store(self):
        """Save vector store to disk"""
        try:
            embeddings_file = os.path.join(self.storage_path, "embeddings.npy")
            metadata_file = os.path.join(self.storage_path, "metadata.json")

            # Save embeddings
            if self.embeddings:
                np.save(embeddings_file, np.array(self.embeddings))

            # Save metadata
            metadata = {}
            for doc_id, doc in self.documents.items():
                metadata[doc_id] = doc.to_dict()

            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2, default=str)

            logger.debug(f"[OK] Saved {len(self.documents)} documents to local store")

        except Exception as e:
            logger.error(f"[ERROR] Failed to save local store: {e}")

    def add_document(self, document: VectorDocument) -> bool:
        """Add document to local store"""
        if document.embedding is None:
            return False

        try:
            # Add or update document
            if document.id in self.documents:
                # Update existing
                idx = self.doc_ids.index(document.id)
                self.embeddings[idx] = document.embedding
            else:
                # Add new
                self.doc_ids.append(document.id)
                self.embeddings.append(document.embedding)

            self.documents[document.id] = document

            # Periodic save
            if len(self.documents) % 10 == 0:
                self._save_store()

            return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to add document to local store: {e}")
            return False

    def search_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        min_score: float = 0.0,
        chunk_types: Optional[List[str]] = None
    ) -> List[Tuple[VectorDocument, float]]:
        """Search similar documents using cosine similarity"""
        if not self.embeddings:
            return []

        try:
            # Convert to numpy array for vectorized operations
            embeddings_matrix = np.array(self.embeddings)

            # Normalize embeddings for cosine similarity
            embeddings_norm = embeddings_matrix / np.linalg.norm(embeddings_matrix, axis=1, keepdims=True)
            query_norm = query_embedding / np.linalg.norm(query_embedding)

            # Calculate cosine similarities
            similarities = np.dot(embeddings_norm, query_norm)

            # Get top-k indices
            top_indices = np.argsort(similarities)[::-1]

            results = []
            for idx in top_indices:
                if len(results) >= top_k:
                    break

                score = similarities[idx]
                if score < min_score:
                    continue

                doc_id = self.doc_ids[idx]
                doc = self.documents[doc_id]

                # Filter by chunk type if specified
                if chunk_types and doc.chunk_type not in chunk_types:
                    continue

                # Add embedding back to document
                doc.embedding = self.embeddings[idx]
                results.append((doc, float(score)))

            return results

        except Exception as e:
            logger.error(f"[ERROR] Failed to search local store: {e}")
            return []

    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Get document by ID"""
        doc = self.documents.get(doc_id)
        if doc and doc_id in self.doc_ids:
            idx = self.doc_ids.index(doc_id)
            doc.embedding = self.embeddings[idx]
        return doc

    def delete_document(self, doc_id: str) -> bool:
        """Delete document by ID"""
        if doc_id not in self.documents:
            return False

        try:
            idx = self.doc_ids.index(doc_id)
            del self.documents[doc_id]
            self.doc_ids.pop(idx)
            self.embeddings.pop(idx)

            self._save_store()
            return True

        except Exception as e:
            logger.error(f"[ERROR] Failed to delete document from local store: {e}")
            return False

    def clear(self):
        """Clear all documents"""
        self.documents.clear()
        self.embeddings.clear()
        self.doc_ids.clear()
        self._save_store()

    def get_stats(self) -> Dict[str, Any]:
        """Get local store statistics"""
        chunk_types = {}
        total_priority = 0.0

        for doc in self.documents.values():
            chunk_types[doc.chunk_type] = chunk_types.get(doc.chunk_type, 0) + 1
            total_priority += doc.priority

        return {
            'total_documents': len(self.documents),
            'chunk_types': chunk_types,
            'average_priority': total_priority / len(self.documents) if self.documents else 0.0,
            'embedding_dimension': len(self.embeddings[0]) if self.embeddings else 0,
            'backend': 'local_numpy',
            'connection_status': 'file_based'
        }

    def is_available(self) -> bool:
        """Check if local store is available"""
        return True

    def close(self):
        """Save and close local store"""
        self._save_store()

# Global vector store instance
_vector_store_instance: Optional[Union[SupabaseVectorStore, LocalVectorStore]] = None

def get_vector_store() -> Optional[Union[SupabaseVectorStore, LocalVectorStore]]:
    """
    Get the global vector store instance
    Prioritizes Supabase PostgreSQL > Local fallback
    SQLite DATABASE_URL is ignored for vector storage
    """
    global _vector_store_instance

    if _vector_store_instance is None:
        try:
            # Try to get config
            from app_config import config

            # Try Supabase first (PostgreSQL only, not SQLite)
            supabase_url = getattr(config, 'SUPABASE_URL', None)
            database_url = getattr(config, 'DATABASE_URL', None)

            # Check if DATABASE_URL is PostgreSQL (not SQLite)
            is_postgres_db = database_url and 'postgresql' in database_url.lower()

            if PSYCOPG2_AVAILABLE and (supabase_url or is_postgres_db):
                _vector_store_instance = SupabaseVectorStore(config)
                if _vector_store_instance.is_available():
                    logger.info("[OK] Using SupabaseVectorStore for vector embeddings")
                else:
                    _vector_store_instance = None

            # Fallback to local store for development
            if _vector_store_instance is None:
                storage_path = getattr(config, 'VECTOR_DB_PATH', './data/vector_store')
                _vector_store_instance = LocalVectorStore(storage_path)
                logger.info("[OK] Using LocalVectorStore as fallback (dev only)")

        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize vector store: {e}")
            return None

    return _vector_store_instance

def get_supabase_vector_store() -> Optional[SupabaseVectorStore]:
    """Get Supabase vector store specifically"""
    try:
        from app_config import config
        if PSYCOPG2_AVAILABLE:
            store = SupabaseVectorStore(config)
            return store if store.is_available() else None
    except Exception as e:
        logger.error(f"[ERROR] Failed to get Supabase vector store: {e}")
    return None

def is_vector_store_available() -> bool:
    """Check if vector store is available"""
    store = get_vector_store()
    return store is not None and store.is_available()

# Convenience functions
def add_document(document: VectorDocument) -> bool:
    """Add document to the vector store"""
    store = get_vector_store()
    return store.add_document(document) if store else False

def search_similar(
    query_embedding: np.ndarray,
    top_k: int = 5,
    min_score: float = 0.0,
    chunk_types: Optional[List[str]] = None
) -> List[Tuple[VectorDocument, float]]:
    """Search for similar documents"""
    store = get_vector_store()
    return store.search_similar(query_embedding, top_k, min_score, chunk_types) if store else []

def get_document(doc_id: str) -> Optional[VectorDocument]:
    """Get document by ID"""
    store = get_vector_store()
    return store.get_document(doc_id) if store else None