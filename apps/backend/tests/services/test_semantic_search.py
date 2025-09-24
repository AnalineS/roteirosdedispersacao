# -*- coding: utf-8 -*-
"""
Comprehensive tests for semantic search service
Tests embedding generation, search functionality, and medical context retrieval
"""

import pytest
import numpy as np
import os
import tempfile
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

# Import modules under test
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from services.semantic_search import (
    SearchResult, EmbeddingService, SemanticSearchEngine,
    get_semantic_search, is_semantic_search_available,
    search_medical_content, get_medical_context, index_medical_document
)

class TestSearchResult:
    """Test SearchResult data class"""

    def test_search_result_creation(self):
        """Test creating a SearchResult"""
        result = SearchResult(
            document_id="test_doc_1",
            text="Test medical document",
            score=0.85,
            weighted_score=0.9,
            chunk_type="dosage",
            priority=0.8,
            source_file="medical_guide.txt",
            metadata={"category": "medication"}
        )

        assert result.document_id == "test_doc_1"
        assert result.text == "Test medical document"
        assert result.score == 0.85
        assert result.weighted_score == 0.9
        assert result.chunk_type == "dosage"
        assert result.priority == 0.8

    def test_search_result_to_dict(self):
        """Test converting SearchResult to dictionary"""
        result = SearchResult(
            document_id="test_doc_2",
            text="Medical protocol",
            score=0.75,
            weighted_score=0.8,
            chunk_type="protocol",
            priority=0.7,
            source_file="protocols.txt",
            metadata={"type": "clinical"}
        )

        result_dict = result.to_dict()

        assert result_dict["document_id"] == "test_doc_2"
        assert result_dict["text"] == "Medical protocol"
        assert result_dict["score"] == 0.75
        assert result_dict["weighted_score"] == 0.8
        assert result_dict["chunk_type"] == "protocol"
        assert result_dict["metadata"]["type"] == "clinical"

class TestEmbeddingService:
    """Test EmbeddingService implementation"""

    def setup_method(self):
        """Setup test environment"""
        self.mock_config = Mock()
        self.mock_config.EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
        self.mock_config.EMBEDDING_DIMENSION = 384
        self.mock_config.USE_OPENAI_EMBEDDINGS = False
        self.mock_config.OPENAI_API_KEY = None

    @patch('services.semantic_search.SENTENCE_TRANSFORMERS_AVAILABLE', True)
    @patch('services.semantic_search.SentenceTransformer')
    def test_embedding_service_initialization_sentence_transformers(self, mock_st):
        """Test EmbeddingService initialization with sentence-transformers"""
        mock_model = Mock()
        mock_st.return_value = mock_model

        service = EmbeddingService(self.mock_config)

        assert service.stats['backend'] == 'sentence_transformers'
        assert service.stats['model_loaded'] is True
        mock_st.assert_called_with('all-MiniLM-L6-v2')

    @patch('services.semantic_search.OPENAI_AVAILABLE', True)
    @patch('services.semantic_search.openai')
    def test_embedding_service_initialization_openai(self, mock_openai):
        """Test EmbeddingService initialization with OpenAI"""
        self.mock_config.USE_OPENAI_EMBEDDINGS = True
        self.mock_config.OPENAI_API_KEY = "test_key"

        service = EmbeddingService(self.mock_config)

        assert service.stats['backend'] == 'openai'
        assert service.stats['model_loaded'] is True
        assert mock_openai.api_key == "test_key"

    def test_embedding_service_not_available(self):
        """Test EmbeddingService when no backends are available"""
        with patch('services.semantic_search.SENTENCE_TRANSFORMERS_AVAILABLE', False):
            with patch('services.semantic_search.OPENAI_AVAILABLE', False):
                service = EmbeddingService(self.mock_config)

                assert service.stats['backend'] == 'none'
                assert service.stats['model_loaded'] is False
                assert service.is_available() is False

    @patch('services.semantic_search.SENTENCE_TRANSFORMERS_AVAILABLE', True)
    @patch('services.semantic_search.SentenceTransformer')
    def test_embed_text_sentence_transformers(self, mock_st):
        """Test text embedding with sentence-transformers"""
        mock_model = Mock()
        mock_embedding = np.array([0.1, 0.2, 0.3, 0.4])
        mock_model.encode.return_value = mock_embedding
        mock_st.return_value = mock_model

        service = EmbeddingService(self.mock_config)
        result = service.embed_text("Test medical text")

        assert np.array_equal(result, mock_embedding)
        assert service.stats['embeddings_generated'] == 1
        mock_model.encode.assert_called_with("Test medical text", convert_to_numpy=True)

    @patch('services.semantic_search.OPENAI_AVAILABLE', True)
    @patch('services.semantic_search.openai')
    def test_embed_text_openai(self, mock_openai):
        """Test text embedding with OpenAI"""
        self.mock_config.USE_OPENAI_EMBEDDINGS = True
        self.mock_config.OPENAI_API_KEY = "test_key"

        mock_response = {
            'data': [{'embedding': [0.1, 0.2, 0.3, 0.4]}]
        }
        mock_openai.Embedding.create.return_value = mock_response

        service = EmbeddingService(self.mock_config)
        result = service.embed_text("Test medical text")

        expected = np.array([0.1, 0.2, 0.3, 0.4])
        assert np.array_equal(result, expected)
        mock_openai.Embedding.create.assert_called_with(
            model="text-embedding-ada-002",
            input="Test medical text"
        )

    @patch('services.semantic_search.SENTENCE_TRANSFORMERS_AVAILABLE', True)
    @patch('services.semantic_search.SentenceTransformer')
    def test_embed_batch(self, mock_st):
        """Test batch embedding generation"""
        mock_model = Mock()
        mock_embeddings = np.array([[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]])
        mock_model.encode.return_value = mock_embeddings
        mock_st.return_value = mock_model

        service = EmbeddingService(self.mock_config)
        texts = ["Text 1", "Text 2", "Text 3"]
        results = service.embed_batch(texts)

        assert len(results) == 3
        assert np.array_equal(results[0], mock_embeddings[0])
        assert np.array_equal(results[1], mock_embeddings[1])
        assert np.array_equal(results[2], mock_embeddings[2])

    def test_embed_text_not_available(self):
        """Test embedding when service is not available"""
        with patch('services.semantic_search.SENTENCE_TRANSFORMERS_AVAILABLE', False):
            with patch('services.semantic_search.OPENAI_AVAILABLE', False):
                service = EmbeddingService(self.mock_config)
                result = service.embed_text("Test text")
                assert result is None

    def test_get_statistics(self):
        """Test getting embedding service statistics"""
        with patch('services.semantic_search.SENTENCE_TRANSFORMERS_AVAILABLE', True):
            with patch('services.semantic_search.SentenceTransformer'):
                service = EmbeddingService(self.mock_config)
                stats = service.get_statistics()

                assert 'embeddings_generated' in stats
                assert 'total_time' in stats
                assert 'avg_time_per_embedding' in stats
                assert 'backend' in stats
                assert 'model_loaded' in stats

class TestSemanticSearchEngine:
    """Test SemanticSearchEngine implementation"""

    def setup_method(self):
        """Setup test environment"""
        self.mock_config = Mock()
        self.mock_config.EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
        self.mock_config.EMBEDDING_DIMENSION = 384
        self.mock_config.USE_OPENAI_EMBEDDINGS = False

    @patch('services.semantic_search.get_vector_store')
    @patch('services.semantic_search.VECTOR_STORE_AVAILABLE', True)
    def test_search_engine_initialization(self, mock_get_vector_store):
        """Test SemanticSearchEngine initialization"""
        mock_vector_store = Mock()
        mock_vector_store.is_available.return_value = True
        mock_get_vector_store.return_value = mock_vector_store

        with patch('services.semantic_search.EmbeddingService') as mock_embedding_service:
            mock_embedding_instance = Mock()
            mock_embedding_instance.is_available.return_value = True
            mock_embedding_service.return_value = mock_embedding_instance

            engine = SemanticSearchEngine(self.mock_config)

            assert engine.vector_store == mock_vector_store
            assert engine.embedding_service == mock_embedding_instance
            assert 'dosage' in engine.content_weights
            assert engine.content_weights['dosage'] == 1.0

    def test_search_engine_not_available(self):
        """Test search engine when components are not available"""
        with patch('services.semantic_search.get_vector_store', return_value=None):
            with patch('services.semantic_search.VECTOR_STORE_AVAILABLE', False):
                engine = SemanticSearchEngine(self.mock_config)
                assert engine.is_available() is False

    @patch('services.semantic_search.get_vector_store')
    @patch('services.semantic_search.VECTOR_STORE_AVAILABLE', True)
    def test_index_document(self, mock_get_vector_store):
        """Test indexing a document"""
        mock_vector_store = Mock()
        mock_vector_store.is_available.return_value = True
        mock_vector_store.add_document.return_value = True
        mock_get_vector_store.return_value = mock_vector_store

        with patch('services.semantic_search.EmbeddingService') as mock_embedding_service:
            mock_embedding_instance = Mock()
            mock_embedding_instance.is_available.return_value = True
            mock_embedding_instance.embed_document.return_value = np.array([0.1, 0.2, 0.3])
            mock_embedding_service.return_value = mock_embedding_instance

            engine = SemanticSearchEngine(self.mock_config)

            success = engine.index_document(
                text="Test medical document",
                chunk_type="dosage",
                priority=0.9,
                source_file="medical.txt",
                metadata={"category": "medication"}
            )

            assert success is True
            assert engine.stats['documents_indexed'] == 1
            mock_vector_store.add_document.assert_called_once()

    @patch('services.semantic_search.get_vector_store')
    @patch('services.semantic_search.VECTOR_STORE_AVAILABLE', True)
    def test_index_documents_batch(self, mock_get_vector_store):
        """Test batch document indexing"""
        mock_vector_store = Mock()
        mock_vector_store.is_available.return_value = True
        mock_vector_store.add_document.return_value = True
        mock_get_vector_store.return_value = mock_vector_store

        with patch('services.semantic_search.EmbeddingService') as mock_embedding_service:
            mock_embedding_instance = Mock()
            mock_embedding_instance.is_available.return_value = True
            mock_embedding_instance.embed_batch.return_value = [
                np.array([0.1, 0.2]),
                np.array([0.3, 0.4]),
                np.array([0.5, 0.6])
            ]
            mock_embedding_service.return_value = mock_embedding_instance

            engine = SemanticSearchEngine(self.mock_config)

            documents = [
                {"text": "Document 1", "chunk_type": "dosage", "priority": 0.9},
                {"text": "Document 2", "chunk_type": "protocol", "priority": 0.8},
                {"text": "Document 3", "chunk_type": "general", "priority": 0.7}
            ]

            successful, failed = engine.index_documents_batch(documents)

            assert successful == 3
            assert failed == 0
            assert mock_vector_store.add_document.call_count == 3

    @patch('services.semantic_search.get_vector_store')
    @patch('services.semantic_search.VECTOR_STORE_AVAILABLE', True)
    @patch('services.semantic_search.VectorDocument')
    def test_search(self, mock_vector_doc, mock_get_vector_store):
        """Test semantic search functionality"""
        # Setup mocks
        mock_vector_store = Mock()
        mock_vector_store.is_available.return_value = True
        mock_get_vector_store.return_value = mock_vector_store

        # Mock search results
        mock_doc = Mock()
        mock_doc.id = "test_doc_1"
        mock_doc.text = "Test medical content"
        mock_doc.chunk_type = "dosage"
        mock_doc.priority = 0.9
        mock_doc.source_file = "medical.txt"
        mock_doc.metadata = {"category": "medication"}

        mock_vector_store.search_similar.return_value = [(mock_doc, 0.85)]

        with patch('services.semantic_search.EmbeddingService') as mock_embedding_service:
            mock_embedding_instance = Mock()
            mock_embedding_instance.is_available.return_value = True
            mock_embedding_instance.embed_query.return_value = np.array([0.1, 0.2, 0.3])
            mock_embedding_service.return_value = mock_embedding_instance

            engine = SemanticSearchEngine(self.mock_config)

            results = engine.search(
                query="dosage information",
                top_k=5,
                min_score=0.3,
                use_medical_weights=True
            )

            assert len(results) == 1
            result = results[0]
            assert result.document_id == "test_doc_1"
            assert result.text == "Test medical content"
            assert result.score == 0.85
            # Weighted score should be higher due to dosage type and priority
            assert result.weighted_score > result.score

    @patch('services.semantic_search.get_vector_store')
    @patch('services.semantic_search.VECTOR_STORE_AVAILABLE', True)
    def test_search_medical_context(self, mock_get_vector_store):
        """Test medical context search for RAG"""
        mock_vector_store = Mock()
        mock_vector_store.is_available.return_value = True
        mock_get_vector_store.return_value = mock_vector_store

        with patch('services.semantic_search.EmbeddingService') as mock_embedding_service:
            mock_embedding_instance = Mock()
            mock_embedding_instance.is_available.return_value = True
            mock_embedding_service.return_value = mock_embedding_instance

            engine = SemanticSearchEngine(self.mock_config)

            # Mock search method to return formatted results
            with patch.object(engine, 'search') as mock_search:
                mock_search.return_value = [
                    SearchResult(
                        document_id="ctx_1",
                        text="Critical dosage information",
                        score=0.9,
                        weighted_score=0.95,
                        chunk_type="dosage",
                        priority=0.9,
                        source_file="dosage_guide.txt",
                        metadata={}
                    ),
                    SearchResult(
                        document_id="ctx_2",
                        text="General medication information",
                        score=0.7,
                        weighted_score=0.75,
                        chunk_type="general",
                        priority=0.6,
                        source_file="general_guide.txt",
                        metadata={}
                    )
                ]

                context = engine.search_medical_context(
                    query="medication dosage",
                    context_type="mixed",
                    max_chunks=2
                )

                assert "Critical dosage information" in context
                assert "General medication information" in context
                assert "[CRÍTICO]" in context  # High priority marker
                assert "Fonte: dosage_guide.txt" in context
                assert "Relevância média:" in context

    def test_search_cache(self):
        """Test search result caching"""
        with patch('services.semantic_search.get_vector_store'):
            with patch('services.semantic_search.EmbeddingService'):
                engine = SemanticSearchEngine(self.mock_config)

                # Mock search to return results
                with patch.object(engine, 'is_available', return_value=True):
                    with patch.object(engine.embedding_service, 'embed_query', return_value=np.array([0.1, 0.2])):
                        with patch.object(engine.vector_store, 'search_similar', return_value=[]):

                            # First search
                            results1 = engine.search("test query")

                            # Second identical search (should hit cache)
                            results2 = engine.search("test query")

                            assert len(engine.search_cache) > 0
                            # Cache hit should be recorded
                            assert engine.stats['cache_hits'] > 0

    def test_get_statistics(self):
        """Test getting search engine statistics"""
        with patch('services.semantic_search.get_vector_store'):
            with patch('services.semantic_search.EmbeddingService') as mock_embedding_service:
                mock_embedding_instance = Mock()
                mock_embedding_instance.get_statistics.return_value = {"test": "stats"}
                mock_embedding_service.return_value = mock_embedding_instance

                engine = SemanticSearchEngine(self.mock_config)
                stats = engine.get_statistics()

                assert 'searches_performed' in stats
                assert 'cache_hits' in stats
                assert 'documents_indexed' in stats
                assert 'embedding_service' in stats
                assert 'is_available' in stats

class TestSemanticSearchIntegration:
    """Integration tests for semantic search functions"""

    def test_get_semantic_search(self):
        """Test getting semantic search instance"""
        with patch('services.semantic_search.config') as mock_config:
            mock_config.EMBEDDING_MODEL = 'test-model'

            search_engine = get_semantic_search()
            assert search_engine is not None

    def test_is_semantic_search_available(self):
        """Test checking semantic search availability"""
        with patch('services.semantic_search.get_semantic_search') as mock_get_search:
            mock_engine = Mock()
            mock_engine.is_available.return_value = True
            mock_get_search.return_value = mock_engine

            assert is_semantic_search_available() is True

            mock_engine.is_available.return_value = False
            assert is_semantic_search_available() is False

            mock_get_search.return_value = None
            assert is_semantic_search_available() is False

    def test_search_medical_content(self):
        """Test convenience function for medical content search"""
        with patch('services.semantic_search.get_semantic_search') as mock_get_search:
            mock_engine = Mock()
            mock_engine.is_available.return_value = True
            mock_engine.search.return_value = [
                SearchResult("doc1", "Medical content", 0.8, 0.85, "dosage", 0.9, "file.txt", {})
            ]
            mock_get_search.return_value = mock_engine

            results = search_medical_content("test query", top_k=3)
            assert len(results) == 1
            mock_engine.search.assert_called_with("test query", top_k=3)

    def test_get_medical_context(self):
        """Test convenience function for medical context"""
        with patch('services.semantic_search.get_semantic_search') as mock_get_search:
            mock_engine = Mock()
            mock_engine.is_available.return_value = True
            mock_engine.search_medical_context.return_value = "Medical context string"
            mock_get_search.return_value = mock_engine

            context = get_medical_context("test query", max_chunks=2)
            assert context == "Medical context string"
            mock_engine.search_medical_context.assert_called_with("test query", "mixed", 2)

    def test_index_medical_document(self):
        """Test convenience function for document indexing"""
        with patch('services.semantic_search.get_semantic_search') as mock_get_search:
            mock_engine = Mock()
            mock_engine.is_available.return_value = True
            mock_engine.index_document.return_value = True
            mock_get_search.return_value = mock_engine

            success = index_medical_document(
                text="Medical document",
                chunk_type="dosage",
                priority=0.8
            )
            assert success is True
            mock_engine.index_document.assert_called_with(
                "Medical document", "dosage", 0.8, None, None
            )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])