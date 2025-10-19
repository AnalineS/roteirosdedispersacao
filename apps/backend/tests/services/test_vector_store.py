# -*- coding: utf-8 -*-
"""
Comprehensive tests for vector store service
Tests both Supabase and local implementations
"""

import pytest
import numpy as np
import os
import tempfile
import shutil
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

# Import modules under test
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from services.vector_store import (
    VectorDocument, SupabaseVectorStore, LocalVectorStore,
    get_vector_store, is_vector_store_available
)

class TestVectorDocument:
    """Test VectorDocument data class"""

    def test_vector_document_creation(self):
        """Test creating a VectorDocument"""
        embedding = np.array([0.1, 0.2, 0.3, 0.4])
        doc = VectorDocument(
            id="test_doc_1",
            text="This is a test document",
            embedding=embedding,
            metadata={"category": "test"},
            chunk_type="general",
            priority=0.8,
            source_file="test.txt",
            created_at=datetime.now()
        )

        assert doc.id == "test_doc_1"
        assert doc.text == "This is a test document"
        assert np.array_equal(doc.embedding, embedding)
        assert doc.metadata["category"] == "test"
        assert doc.chunk_type == "general"
        assert doc.priority == 0.8

    def test_vector_document_to_dict(self):
        """Test converting VectorDocument to dictionary"""
        embedding = np.array([0.1, 0.2, 0.3])
        doc = VectorDocument(
            id="test_doc_2",
            text="Test document",
            embedding=embedding,
            metadata={"type": "medical"},
            chunk_type="dosage",
            priority=0.9
        )

        doc_dict = doc.to_dict()

        assert doc_dict["id"] == "test_doc_2"
        assert doc_dict["text"] == "Test document"
        assert "embedding" not in doc_dict  # Should be excluded
        assert doc_dict["metadata"]["type"] == "medical"
        assert doc_dict["chunk_type"] == "dosage"

    def test_vector_document_to_dict_with_embedding(self):
        """Test converting VectorDocument to dictionary with embedding"""
        embedding = np.array([0.1, 0.2, 0.3])
        doc = VectorDocument(
            id="test_doc_3",
            text="Test document",
            embedding=embedding,
            metadata={},
            chunk_type="general",
            priority=0.5
        )

        doc_dict = doc.to_dict_with_embedding()

        assert "embedding" in doc_dict
        assert doc_dict["embedding"] == [0.1, 0.2, 0.3]

class TestLocalVectorStore:
    """Test LocalVectorStore implementation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.store = LocalVectorStore(self.temp_dir)

        yield

        # Teardown: cleanup test environment
        shutil.rmtree(self.temp_dir)

    def test_local_store_initialization(self):
        """Test LocalVectorStore initialization"""
        assert self.store.storage_path == self.temp_dir
        assert len(self.store.documents) == 0
        assert len(self.store.embeddings) == 0
        assert len(self.store.doc_ids) == 0

    def test_add_document(self):
        """Test adding document to local store"""
        embedding = np.random.random(384)
        doc = VectorDocument(
            id="local_test_1",
            text="Test document for local store",
            embedding=embedding,
            metadata={"test": True},
            chunk_type="general",
            priority=0.7
        )

        success = self.store.add_document(doc)
        assert success is True
        assert len(self.store.documents) == 1
        assert len(self.store.embeddings) == 1
        assert len(self.store.doc_ids) == 1
        assert "local_test_1" in self.store.documents

    def test_add_document_without_embedding(self):
        """Test adding document without embedding fails"""
        doc = VectorDocument(
            id="no_embedding",
            text="Document without embedding",
            embedding=None,
            metadata={},
            chunk_type="general",
            priority=0.5
        )

        success = self.store.add_document(doc)
        assert success is False
        assert len(self.store.documents) == 0

    def test_search_similar(self):
        """Test similarity search in local store"""
        # Add test documents
        embeddings = [
            np.array([1.0, 0.0, 0.0]),
            np.array([0.0, 1.0, 0.0]),
            np.array([0.0, 0.0, 1.0])
        ]

        for i, embedding in enumerate(embeddings):
            doc = VectorDocument(
                id=f"search_test_{i}",
                text=f"Test document {i}",
                embedding=embedding,
                metadata={},
                chunk_type="general",
                priority=0.5
            )
            self.store.add_document(doc)

        # Search with query similar to first document
        query_embedding = np.array([0.9, 0.1, 0.0])
        results = self.store.search_similar(query_embedding, top_k=2)

        assert len(results) == 2
        # First result should be most similar
        assert results[0][0].id == "search_test_0"
        assert results[0][1] > results[1][1]  # Higher similarity score

    def test_search_similar_with_chunk_type_filter(self):
        """Test similarity search with chunk type filtering"""
        # Add documents with different chunk types
        for i, chunk_type in enumerate(["dosage", "general", "dosage"]):
            embedding = np.random.random(3)
            doc = VectorDocument(
                id=f"filter_test_{i}",
                text=f"Document {i}",
                embedding=embedding,
                metadata={},
                chunk_type=chunk_type,
                priority=0.5
            )
            self.store.add_document(doc)

        # Search with chunk type filter
        query_embedding = np.random.random(3)
        results = self.store.search_similar(
            query_embedding,
            top_k=5,
            chunk_types=["dosage"]
        )

        assert len(results) == 2  # Only dosage documents
        for result, _ in results:
            assert result.chunk_type == "dosage"

    def test_get_document(self):
        """Test retrieving document by ID"""
        embedding = np.array([0.5, 0.5, 0.5])
        doc = VectorDocument(
            id="get_test",
            text="Document to retrieve",
            embedding=embedding,
            metadata={"retrieve": True},
            chunk_type="general",
            priority=0.6
        )

        self.store.add_document(doc)
        retrieved_doc = self.store.get_document("get_test")

        assert retrieved_doc is not None
        assert retrieved_doc.id == "get_test"
        assert retrieved_doc.text == "Document to retrieve"
        assert np.array_equal(retrieved_doc.embedding, embedding)

    def test_delete_document(self):
        """Test deleting document"""
        embedding = np.array([0.1, 0.2, 0.3])
        doc = VectorDocument(
            id="delete_test",
            text="Document to delete",
            embedding=embedding,
            metadata={},
            chunk_type="general",
            priority=0.5
        )

        self.store.add_document(doc)
        assert len(self.store.documents) == 1

        success = self.store.delete_document("delete_test")
        assert success is True
        assert len(self.store.documents) == 0
        assert len(self.store.embeddings) == 0
        assert len(self.store.doc_ids) == 0

    def test_clear_store(self):
        """Test clearing all documents"""
        # Add multiple documents
        for i in range(3):
            embedding = np.random.random(3)
            doc = VectorDocument(
                id=f"clear_test_{i}",
                text=f"Document {i}",
                embedding=embedding,
                metadata={},
                chunk_type="general",
                priority=0.5
            )
            self.store.add_document(doc)

        assert len(self.store.documents) == 3

        self.store.clear()
        assert len(self.store.documents) == 0
        assert len(self.store.embeddings) == 0
        assert len(self.store.doc_ids) == 0

    def test_get_stats(self):
        """Test getting store statistics"""
        # Add documents with different chunk types
        chunk_types = ["dosage", "general", "dosage", "safety"]
        for i, chunk_type in enumerate(chunk_types):
            embedding = np.random.random(384)
            doc = VectorDocument(
                id=f"stats_test_{i}",
                text=f"Document {i}",
                embedding=embedding,
                metadata={},
                chunk_type=chunk_type,
                priority=0.5 + i * 0.1
            )
            self.store.add_document(doc)

        stats = self.store.get_stats()

        assert stats["total_documents"] == 4
        assert stats["embedding_dimension"] == 384
        assert stats["backend"] == "local_numpy"
        assert stats["chunk_types"]["dosage"] == 2
        assert stats["chunk_types"]["general"] == 1
        assert stats["chunk_types"]["safety"] == 1

    def test_persistence(self):
        """Test that documents persist across store instances"""
        # Add document to first store instance
        embedding = np.array([0.1, 0.2, 0.3])
        doc = VectorDocument(
            id="persist_test",
            text="Persistent document",
            embedding=embedding,
            metadata={"persistent": True},
            chunk_type="general",
            priority=0.8
        )

        self.store.add_document(doc)
        self.store._save_store()  # Force save

        # Create new store instance with same directory
        new_store = LocalVectorStore(self.temp_dir)

        assert len(new_store.documents) == 1
        assert "persist_test" in new_store.documents
        retrieved_doc = new_store.get_document("persist_test")
        assert retrieved_doc.text == "Persistent document"
        assert retrieved_doc.metadata["persistent"] is True

class TestSupabaseVectorStore:
    """Test SupabaseVectorStore implementation"""

    def setup_method(self):
        """Setup test environment"""
        self.mock_config = Mock()
        self.mock_config.SUPABASE_URL = "https://test.supabase.co"
        self.mock_config.SUPABASE_ANON_KEY = "test_key"
        self.mock_config.DATABASE_URL = None
        self.mock_config.EMBEDDING_DIMENSION = 384

    @patch('services.vector_store.psycopg2')
    def test_supabase_store_initialization_with_url(self, mock_psycopg2):
        """Test SupabaseVectorStore initialization with URL"""
        mock_conn = Mock()
        mock_psycopg2.connect.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = Mock()

        store = SupabaseVectorStore(self.mock_config)

        assert store.supabase_url == "https://test.supabase.co"
        assert store.supabase_key == "test_key"
        assert store.embedding_dimension == 384
        mock_psycopg2.connect.assert_called_once()

    @patch('services.vector_store.psycopg2')
    def test_supabase_store_initialization_with_database_url(self, mock_psycopg2):
        """Test SupabaseVectorStore initialization with DATABASE_URL"""
        self.mock_config.DATABASE_URL = "postgresql://user:pass@host:5432/db"
        mock_conn = Mock()
        mock_psycopg2.connect.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = Mock()

        store = SupabaseVectorStore(self.mock_config)

        mock_psycopg2.connect.assert_called_with("postgresql://user:pass@host:5432/db")

    @patch('services.vector_store.PSYCOPG2_AVAILABLE', False)
    def test_supabase_store_no_psycopg2(self):
        """Test SupabaseVectorStore when psycopg2 is not available"""
        store = SupabaseVectorStore(self.mock_config)
        assert store.connection is None

    @patch('services.vector_store.psycopg2')
    def test_add_document_supabase(self, mock_psycopg2):
        """Test adding document to Supabase store"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn

        store = SupabaseVectorStore(self.mock_config)

        embedding = np.array([0.1, 0.2, 0.3, 0.4])
        doc = VectorDocument(
            id="supabase_test",
            text="Test document",
            embedding=embedding,
            metadata={"test": True},
            chunk_type="dosage",
            priority=0.9
        )

        success = store.add_document(doc)
        assert success is True
        mock_cursor.execute.assert_called()

    @patch('services.vector_store.psycopg2')
    def test_search_similar_supabase(self, mock_psycopg2):
        """Test similarity search in Supabase store"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn

        # Mock search results
        mock_cursor.fetchall.return_value = [
            {
                'id': 'result_1',
                'text': 'Similar document 1',
                'metadata': {'category': 'test'},
                'chunk_type': 'general',
                'priority': 0.8,
                'source_file': 'test.txt',
                'created_at': datetime.now(),
                'similarity_score': 0.95
            }
        ]

        store = SupabaseVectorStore(self.mock_config)
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4])

        results = store.search_similar(query_embedding, top_k=5)

        assert len(results) == 1
        doc, score = results[0]
        assert doc.id == 'result_1'
        assert doc.text == 'Similar document 1'
        assert score == 0.95

class TestVectorStoreIntegration:
    """Integration tests for vector store functions"""

    def test_get_vector_store_with_config(self):
        """Test getting vector store instance with config"""
        with patch('services.vector_store.config') as mock_config:
            mock_config.SUPABASE_URL = None
            mock_config.DATABASE_URL = None
            mock_config.VECTOR_DB_PATH = tempfile.mkdtemp()

            store = get_vector_store()
            assert store is not None
            assert isinstance(store, LocalVectorStore)

    def test_is_vector_store_available(self):
        """Test checking vector store availability"""
        with patch('services.vector_store.get_vector_store') as mock_get_store:
            mock_store = Mock()
            mock_store.is_available.return_value = True
            mock_get_store.return_value = mock_store

            assert is_vector_store_available() is True

            mock_store.is_available.return_value = False
            assert is_vector_store_available() is False

            mock_get_store.return_value = None
            assert is_vector_store_available() is False

if __name__ == "__main__":
    pytest.main([__file__, "-v"])