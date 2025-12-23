# -*- coding: utf-8 -*-
"""
Complete Medical RAG System - Functional implementation
Comprehensive RAG pipeline for hanseníase medical platform
Integrates ChromaDB, OpenAI embeddings, and medical document processing
"""

import os
import json
import logging
import hashlib
import re
from typing import List, Optional, Any, Dict, Tuple
from datetime import datetime
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)

# ChromaDB integration
try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    chromadb = None

# HuggingFace for embeddings (free alternative to OpenAI)
try:
    from huggingface_hub import InferenceClient
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False
    InferenceClient = None

@dataclass
class MedicalDocument:
    """Medical document with metadata"""
    id: str
    content: str
    title: str
    section: str
    doc_type: str  # 'protocol', 'dosage', 'contraindication', 'general'
    priority: float  # 0.0 to 1.0
    source_file: str
    created_at: datetime
    metadata: Dict[str, Any]

@dataclass
class RAGResult:
    """RAG search result"""
    document: MedicalDocument
    score: float
    weighted_score: float
    relevance: str  # 'high', 'medium', 'low'

@dataclass
class RAGContext:
    """Complete RAG context for response generation"""
    query: str
    results: List[RAGResult]
    total_documents: int
    confidence: float
    context_text: str
    sources: List[str]
    processing_time_ms: int

class MedicalEmbeddingService:
    """Medical-optimized embedding service using HuggingFace API"""

    def __init__(self, config):
        self.config = config
        self.api_key = getattr(config, 'HUGGINGFACE_TOKEN', os.getenv('HUGGINGFACE_TOKEN')) or os.getenv('HF_TOKEN')
        self.model = 'intfloat/multilingual-e5-small'  # Best free multilingual model (384D)

        if self.api_key and HUGGINGFACE_AVAILABLE:
            self.client = InferenceClient(api_key=self.api_key)
            self.available = True
            logger.info(f"✅ Medical Embedding Service initialized with {self.model}")
        else:
            self.client = None
            self.available = False
            logger.warning("⚠️ HuggingFace API key not available - embeddings disabled")

    def is_available(self) -> bool:
        return self.available and HUGGINGFACE_AVAILABLE

    def embed_text(self, text: str) -> Optional[List[float]]:
        """Generate embedding for medical text using HuggingFace"""
        if not self.is_available() or not text.strip():
            return None

        try:
            # Truncate text if too long
            if len(text) > 8000:
                text = text[:8000]

            embedding = self.client.feature_extraction(text.strip(), model=self.model)

            # Convert to list if needed
            if hasattr(embedding, 'tolist'):
                embedding = embedding.tolist()
            elif isinstance(embedding, list) and isinstance(embedding[0], list):
                embedding = embedding[0]

            logger.debug(f"Generated embedding: {len(embedding)} dimensions")
            return embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

    def embed_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """Generate embeddings for multiple texts using HuggingFace"""
        if not self.is_available():
            return [None] * len(texts)

        try:
            # Process texts one by one (HuggingFace free tier limitation)
            all_embeddings = []

            for text in texts:
                if not text.strip():
                    all_embeddings.append(None)
                    continue

                embedding = self.embed_text(text)
                all_embeddings.append(embedding)

            return all_embeddings

        except Exception as e:
            logger.error(f"Error in batch embedding: {e}")
            return [None] * len(texts)

class MedicalDocumentProcessor:
    """Process medical documents into searchable chunks"""

    def __init__(self):
        # Medical terminology patterns
        self.medical_patterns = {
            'dosage': [
                r'\b\d+\s*(mg|g|ml|comprimido|caps|cap|cápsula)',
                r'\bdose?\b', r'\bdosagem\b', r'\bposologia\b',
                r'\bmg/kg\b', r'\bdiariamente\b', r'\bdia/mg\b'
            ],
            'contraindication': [
                r'\bcontraindic', r'\bnão\s+deve\b', r'\bevitar\b',
                r'\bproibido\b', r'\brestrição\b', r'\bgravidez\b',
                r'\blactação\b', r'\balergia\b'
            ],
            'protocol': [
                r'\bprotocolo\b', r'\bpcdt\b', r'\bdiretriz',
                r'\bnorma\s+técnica\b', r'\bprocedimento\b',
                r'\brecomendação\b', r'\bministério\s+da\s+saúde\b'
            ],
            'interaction': [
                r'\binteração\b', r'\bassociação\b', r'\bcombinação\b',
                r'\bpotencializ', r'\binibe\b', r'\baltera\s+efeito'
            ]
        }

    def detect_document_type(self, text: str) -> Tuple[str, float]:
        """Detect medical document type and priority"""
        text_lower = text.lower()
        scores = {}

        for doc_type, patterns in self.medical_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower))
                score += matches
            scores[doc_type] = score

        if not scores or max(scores.values()) == 0:
            return 'general', 0.5

        doc_type = max(scores, key=scores.get)

        # Priority mapping
        priority_map = {
            'dosage': 1.0,
            'contraindication': 0.9,
            'interaction': 0.8,
            'protocol': 0.7,
            'general': 0.5
        }

        return doc_type, priority_map.get(doc_type, 0.5)

    def chunk_document(self, content: str, title: str = "", source_file: str = "") -> List[MedicalDocument]:
        """Split document into meaningful chunks"""
        # Split by double newlines (paragraphs)
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

        chunks = []
        current_chunk = ""
        chunk_size = 800  # Optimal for medical content

        for paragraph in paragraphs:
            if len(current_chunk) + len(paragraph) > chunk_size and current_chunk:
                # Process current chunk
                doc_type, priority = self.detect_document_type(current_chunk)
                section = self._extract_section(current_chunk)

                chunk_id = hashlib.md5(f"{source_file}:{current_chunk[:100]}".encode()).hexdigest()

                chunks.append(MedicalDocument(
                    id=chunk_id,
                    content=current_chunk.strip(),
                    title=title,
                    section=section,
                    doc_type=doc_type,
                    priority=priority,
                    source_file=source_file,
                    created_at=datetime.now(),
                    metadata={'word_count': len(current_chunk.split())}
                ))

                current_chunk = paragraph
            else:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph

        # Process final chunk
        if current_chunk:
            doc_type, priority = self.detect_document_type(current_chunk)
            section = self._extract_section(current_chunk)

            chunk_id = hashlib.md5(f"{source_file}:{current_chunk[:100]}".encode()).hexdigest()

            chunks.append(MedicalDocument(
                id=chunk_id,
                content=current_chunk.strip(),
                title=title,
                section=section,
                doc_type=doc_type,
                priority=priority,
                source_file=source_file,
                created_at=datetime.now(),
                metadata={'word_count': len(current_chunk.split())}
            ))

        logger.info(f"Document chunked: {len(chunks)} chunks from {source_file}")
        return chunks

    def _extract_section(self, text: str) -> str:
        """Extract section name from text"""
        lines = text.split('\n')
        for line in lines[:3]:  # Check first 3 lines
            line = line.strip()
            if line.startswith('#') or line.isupper() or line.startswith('**'):
                # Clean section name
                section = re.sub(r'^#+\s*|\*\*|[^\w\s]', '', line).strip()
                return section[:50]  # Limit length
        return "content"

class ChromaDBVectorStore:
    """ChromaDB-based vector store for medical documents"""

    def __init__(self, config):
        self.config = config
        self.collection_name = "medical_documents"

        if not CHROMADB_AVAILABLE:
            logger.error("ChromaDB not available - install with: pip install chromadb")
            self.client = None
            self.collection = None
            return

        try:
            # Initialize ChromaDB
            db_path = getattr(config, 'VECTOR_DB_PATH', './data/chromadb')
            os.makedirs(db_path, exist_ok=True)

            self.client = chromadb.PersistentClient(
                path=db_path,
                settings=Settings(anonymized_telemetry=False)
            )

            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Medical documents for hanseníase"}
            )

            logger.info(f"✅ ChromaDB initialized: {self.collection.count()} documents")

        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            self.client = None
            self.collection = None

    def is_available(self) -> bool:
        return self.client is not None and self.collection is not None

    def add_document(self, document: MedicalDocument, embedding: List[float]) -> bool:
        """Add document to vector store"""
        if not self.is_available() or not embedding:
            return False

        try:
            self.collection.add(
                ids=[document.id],
                embeddings=[embedding],
                documents=[document.content],
                metadatas=[{
                    'title': document.title,
                    'section': document.section,
                    'doc_type': document.doc_type,
                    'priority': document.priority,
                    'source_file': document.source_file,
                    'created_at': document.created_at.isoformat(),
                    **document.metadata
                }]
            )

            logger.debug(f"Added document: {document.id}")
            return True

        except Exception as e:
            logger.error(f"Error adding document: {e}")
            return False

    def search_similar(self, query_embedding: List[float], n_results: int = 5) -> List[Tuple[MedicalDocument, float]]:
        """Search for similar documents"""
        if not self.is_available() or not query_embedding:
            return []

        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )

            documents = []
            for i in range(len(results['documents'][0])):
                metadata = results['metadatas'][0][i]
                distance = results['distances'][0][i]

                # Convert distance to similarity score (1 - normalized_distance)
                similarity = max(0.0, 1.0 - distance)

                doc = MedicalDocument(
                    id=results['ids'][0][i],
                    content=results['documents'][0][i],
                    title=metadata.get('title', ''),
                    section=metadata.get('section', ''),
                    doc_type=metadata.get('doc_type', 'general'),
                    priority=metadata.get('priority', 0.5),
                    source_file=metadata.get('source_file', ''),
                    created_at=datetime.fromisoformat(metadata.get('created_at', datetime.now().isoformat())),
                    metadata={}
                )

                documents.append((doc, similarity))

            return documents

        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        if not self.is_available():
            return {'error': 'not_available'}

        try:
            count = self.collection.count()
            return {
                'total_documents': count,
                'collection_name': self.collection_name,
                'backend': 'chromadb'
            }
        except Exception as e:
            return {'error': str(e)}

class CompleteMedicalRAG:
    """Complete RAG system for medical queries"""

    def __init__(self, config):
        self.config = config

        # Initialize components
        self.embedding_service = MedicalEmbeddingService(config)
        self.document_processor = MedicalDocumentProcessor()
        self.vector_store = ChromaDBVectorStore(config)

        # Medical knowledge base paths
        self.knowledge_paths = [
            "data/knowledge-base",
            "data/structured"
        ]

        # Statistics
        self.stats = {
            'queries_processed': 0,
            'documents_indexed': 0,
            'avg_query_time': 0.0,
            'cache_hits': 0
        }

        # Query cache
        self.query_cache = {}

        logger.info("🩺 Complete Medical RAG System initialized")

    def is_available(self) -> bool:
        """Check if RAG system is ready"""
        return (
            self.embedding_service.is_available() and
            self.vector_store.is_available()
        )

    def index_knowledge_base(self) -> Tuple[int, int]:
        """Index all medical documents in knowledge base"""
        if not self.is_available():
            logger.error("RAG system not available for indexing")
            return 0, 0

        logger.info("🔄 Starting knowledge base indexing...")
        total_indexed = 0
        total_failed = 0

        for kb_path in self.knowledge_paths:
            if not os.path.exists(kb_path):
                logger.warning(f"Knowledge base path not found: {kb_path}")
                continue

            # Process markdown files
            for md_file in Path(kb_path).rglob("*.md"):
                indexed, failed = self._index_file(md_file)
                total_indexed += indexed
                total_failed += failed

            # Process JSON files
            for json_file in Path(kb_path).rglob("*.json"):
                indexed, failed = self._index_json_file(json_file)
                total_indexed += indexed
                total_failed += failed

        self.stats['documents_indexed'] = total_indexed
        logger.info(f"✅ Indexing complete: {total_indexed} documents indexed, {total_failed} failed")

        return total_indexed, total_failed

    def _index_file(self, file_path: Path) -> Tuple[int, int]:
        """Index a single markdown file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            if not content.strip():
                return 0, 1

            # Extract title
            title = file_path.stem.replace('_', ' ').title()

            # Process document into chunks
            chunks = self.document_processor.chunk_document(
                content=content,
                title=title,
                source_file=str(file_path)
            )

            # Generate embeddings and store
            indexed = 0
            failed = 0

            texts = [chunk.content for chunk in chunks]
            embeddings = self.embedding_service.embed_batch(texts)

            for chunk, embedding in zip(chunks, embeddings):
                if embedding:
                    if self.vector_store.add_document(chunk, embedding):
                        indexed += 1
                    else:
                        failed += 1
                else:
                    failed += 1

            logger.info(f"Indexed {file_path.name}: {indexed} chunks")
            return indexed, failed

        except Exception as e:
            logger.error(f"Error indexing {file_path}: {e}")
            return 0, 1

    def _index_json_file(self, file_path: Path) -> Tuple[int, int]:
        """Index a JSON file with structured medical data"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not isinstance(data, (dict, list)):
                return 0, 1

            # Convert JSON to text
            if isinstance(data, dict):
                content = self._json_to_text(data)
            else:
                content = '\n\n'.join(self._json_to_text(item) for item in data if isinstance(item, dict))

            if not content.strip():
                return 0, 1

            # Process as document
            title = file_path.stem.replace('_', ' ').title()
            chunks = self.document_processor.chunk_document(
                content=content,
                title=title,
                source_file=str(file_path)
            )

            # Store chunks
            indexed = 0
            failed = 0

            texts = [chunk.content for chunk in chunks]
            embeddings = self.embedding_service.embed_batch(texts)

            for chunk, embedding in zip(chunks, embeddings):
                if embedding:
                    if self.vector_store.add_document(chunk, embedding):
                        indexed += 1
                    else:
                        failed += 1
                else:
                    failed += 1

            return indexed, failed

        except Exception as e:
            logger.error(f"Error indexing JSON {file_path}: {e}")
            return 0, 1

    def _json_to_text(self, data: Dict) -> str:
        """Convert JSON data to readable text"""
        text_parts = []

        for key, value in data.items():
            if isinstance(value, (str, int, float)):
                text_parts.append(f"{key}: {value}")
            elif isinstance(value, list):
                text_parts.append(f"{key}: {', '.join(str(v) for v in value)}")
            elif isinstance(value, dict):
                nested_text = self._json_to_text(value)
                text_parts.append(f"{key}: {nested_text}")

        return '\n'.join(text_parts)

    def query(self, query: str, max_results: int = 5, min_similarity: float = 0.7) -> RAGContext:
        """Process medical query and return relevant context"""
        start_time = datetime.now()

        # Check cache
        cache_key = hashlib.md5(f"{query}:{max_results}".encode()).hexdigest()
        if cache_key in self.query_cache:
            self.stats['cache_hits'] += 1
            cached_result = self.query_cache[cache_key]
            cached_result.processing_time_ms = 0  # Cache hit
            return cached_result

        if not self.is_available():
            return RAGContext(
                query=query,
                results=[],
                total_documents=0,
                confidence=0.0,
                context_text="RAG system not available",
                sources=[],
                processing_time_ms=0
            )

        try:
            # Generate query embedding
            query_embedding = self.embedding_service.embed_text(query)
            if not query_embedding:
                raise Exception("Failed to generate query embedding")

            # Search similar documents
            similar_docs = self.vector_store.search_similar(
                query_embedding=query_embedding,
                n_results=max_results * 2  # Get more for filtering
            )

            # Process and filter results
            results = []
            for doc, similarity in similar_docs:
                if similarity >= min_similarity:
                    # Calculate weighted score
                    weighted_score = similarity * doc.priority

                    # Determine relevance
                    if weighted_score >= 0.8:
                        relevance = 'high'
                    elif weighted_score >= 0.6:
                        relevance = 'medium'
                    else:
                        relevance = 'low'

                    results.append(RAGResult(
                        document=doc,
                        score=similarity,
                        weighted_score=weighted_score,
                        relevance=relevance
                    ))

            # Sort by weighted score and limit
            results.sort(key=lambda x: x.weighted_score, reverse=True)
            results = results[:max_results]

            # Generate context text
            context_text = self._generate_context_text(results, query)

            # Calculate confidence
            if results:
                confidence = sum(r.weighted_score for r in results) / len(results)
            else:
                confidence = 0.0

            # Extract sources
            sources = list(set(r.document.source_file for r in results))

            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

            # Create context
            context = RAGContext(
                query=query,
                results=results,
                total_documents=len(similar_docs),
                confidence=confidence,
                context_text=context_text,
                sources=sources,
                processing_time_ms=processing_time
            )

            # Cache result
            self.query_cache[cache_key] = context

            # Update statistics
            self.stats['queries_processed'] += 1
            self.stats['avg_query_time'] = (
                (self.stats['avg_query_time'] * (self.stats['queries_processed'] - 1) + processing_time) /
                self.stats['queries_processed']
            )

            logger.info(f"Query processed: {len(results)} results, confidence: {confidence:.2f}")

            return context

        except Exception as e:
            logger.error(f"Error processing query: {e}")

            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

            return RAGContext(
                query=query,
                results=[],
                total_documents=0,
                confidence=0.0,
                context_text=f"Error processing query: {str(e)}",
                sources=[],
                processing_time_ms=processing_time
            )

    def _generate_context_text(self, results: List[RAGResult], query: str) -> str:
        """Generate formatted context text from results"""
        if not results:
            return "Nenhuma informação específica encontrada na base de conhecimento."

        context_parts = []

        for i, result in enumerate(results, 1):
            doc = result.document

            # Add priority marker
            if doc.priority >= 0.9:
                priority_marker = "[CRÍTICO] "
            elif doc.priority >= 0.7:
                priority_marker = "[IMPORTANTE] "
            else:
                priority_marker = ""

            # Add document type
            type_marker = f"[{doc.doc_type.upper()}] "

            # Format content
            content = doc.content
            if len(content) > 500:
                content = content[:500] + "..."

            # Source info
            source_info = f"(Fonte: {Path(doc.source_file).name})"

            context_part = f"{type_marker}{priority_marker}{content} {source_info}"
            context_parts.append(context_part)

        context_text = "\n\n".join(context_parts)

        # Add metadata
        avg_confidence = sum(r.weighted_score for r in results) / len(results)
        metadata = f"\n\n[Contexto baseado em {len(results)} fontes relevantes - Confiança: {avg_confidence:.2f}]"

        return context_text + metadata

    def get_context_for_persona(self, query: str, persona: str = 'dr_gasnelio') -> str:
        """Get context optimized for specific persona"""
        # Adjust parameters based on persona
        if persona == 'dr_gasnelio':
            # Technical persona - higher standards
            min_similarity = 0.75
            max_results = 5
        else:  # ga_empathetic
            # More general, accessible content
            min_similarity = 0.65
            max_results = 3

        context = self.query(query, max_results, min_similarity)
        return context.context_text

    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        return {
            'available': self.is_available(),
            'components': {
                'embedding_service': self.embedding_service.is_available(),
                'vector_store': self.vector_store.is_available()
            },
            'statistics': self.stats,
            'vector_store_stats': self.vector_store.get_stats(),
            'knowledge_base_paths': self.knowledge_paths,
            'cache_size': len(self.query_cache)
        }

    def clear_cache(self):
        """Clear query cache"""
        self.query_cache.clear()
        logger.info("Query cache cleared")

# Global instance
_rag_system: Optional[CompleteMedicalRAG] = None

def get_medical_rag() -> Optional[CompleteMedicalRAG]:
    """Get global RAG system instance"""
    global _rag_system

    if _rag_system is None:
        try:
            from app_config import config
            _rag_system = CompleteMedicalRAG(config)

            # Auto-index if no documents
            if _rag_system.is_available():
                stats = _rag_system.vector_store.get_stats()
                if stats.get('total_documents', 0) == 0:
                    logger.info("No documents found - starting auto-indexing...")
                    _rag_system.index_knowledge_base()

        except Exception as e:
            logger.error(f"Failed to initialize Medical RAG: {e}")
            return None

    return _rag_system

def query_medical_knowledge(query: str, persona: str = 'dr_gasnelio') -> str:
    """Query medical knowledge base"""
    rag = get_medical_rag()
    if rag and rag.is_available():
        return rag.get_context_for_persona(query, persona)
    return "Sistema RAG não disponível"

def get_rag_status() -> Dict[str, Any]:
    """Get RAG system status"""
    rag = get_medical_rag()
    if rag:
        return rag.get_system_status()
    return {'available': False, 'error': 'System not initialized'}