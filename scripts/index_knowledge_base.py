#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Knowledge Base Indexing Script - Supabase Vector Store Population
Indexes all medical knowledge base files into Supabase PostgreSQL + pgvector

USAGE:
    python scripts/index_knowledge_base.py [--force] [--dry-run]

REQUIREMENTS:
    - HUGGINGFACE_TOKEN or HF_TOKEN (FREE - get at https://huggingface.co/settings/tokens)
    - SUPABASE_URL
    - SUPABASE_KEY or SUPABASE_SERVICE_KEY

Uses Hugging Face paraphrase-multilingual-mpnet-base-v2 model (optimized for Portuguese)
"""

import os
import sys
import json
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import time

# Configure encoding for Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Add backend to path
script_dir = Path(__file__).parent
backend_dir = script_dir.parent / "apps" / "backend"
sys.path.insert(0, str(backend_dir))

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for detailed output
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class KnowledgeBaseIndexer:
    """
    Indexes medical knowledge base into Supabase vector store
    Generates embeddings using OpenRouter API
    """

    def __init__(self, force_reindex: bool = False, dry_run: bool = False):
        self.force_reindex = force_reindex
        self.dry_run = dry_run

        # Import after path setup
        try:
            from app_config import config
            self.config = config
        except Exception as e:
            logger.error(f"Failed to import config: {e}")
            raise

        # Initialize components
        self._init_components()

        # Data directories
        self.data_root = script_dir.parent / "data"
        self.kb_dir = self.data_root / "knowledge-base"
        self.structured_dir = self.data_root / "structured"

        # Statistics
        self.stats = {
            'files_processed': 0,
            'chunks_created': 0,
            'embeddings_generated': 0,
            'documents_indexed': 0,
            'errors': [],
            'start_time': datetime.now(),
            'end_time': None
        }

        logger.info("Knowledge Base Indexer initialized")
        logger.info(f"Force reindex: {force_reindex}")
        logger.info(f"Dry run: {dry_run}")

    def _init_components(self):
        """Initialize RAG components"""
        try:
            from services.integrations.supabase_vector_store import SupabaseVectorStore, VectorDocument
            from services.rag.medical_chunking import MedicalChunker

            self.vector_store = SupabaseVectorStore(self.config)
            self.chunker = MedicalChunker()
            self.VectorDocument = VectorDocument

            # Check if using Supabase or local fallback
            if self.vector_store.use_local:
                logger.warning("Supabase not connected - using local fallback")
                logger.warning("This will NOT populate the production database")
            else:
                logger.info("Connected to Supabase vector store")
                # Setup RPC function for vector similarity search
                self._setup_rpc_function()

        except Exception as e:
            logger.error(f"Failed to initialize components: {e}")
            raise

    def _setup_rpc_function(self):
        """Setup RPC function for vector similarity search in Supabase"""
        try:
            logger.info("Setting up RPC function for vector similarity search...")

            # SQL to create the RPC function (idempotent with CREATE OR REPLACE)
            rpc_sql = """
            -- Create RPC function for vector similarity search on medical_embeddings table
            CREATE OR REPLACE FUNCTION match_medical_embeddings(
              query_embedding vector(384),
              match_threshold float,
              match_count int
            )
            RETURNS TABLE (
              id text,
              text text,
              source_file varchar,
              chunk_type varchar,
              priority float,
              metadata jsonb,
              similarity float
            )
            LANGUAGE plpgsql
            AS $$
            BEGIN
              RETURN QUERY
              SELECT
                medical_embeddings.id,
                medical_embeddings.text,
                medical_embeddings.source_file,
                medical_embeddings.chunk_type,
                medical_embeddings.priority,
                medical_embeddings.metadata,
                1 - (medical_embeddings.embedding <=> query_embedding) as similarity
              FROM medical_embeddings
              WHERE 1 - (medical_embeddings.embedding <=> query_embedding) > match_threshold
              ORDER BY medical_embeddings.embedding <=> query_embedding ASC
              LIMIT match_count;
            END;
            $$;
            """

            # Execute SQL via Supabase client's rpc method for SQL execution
            # Note: We need to use the underlying PostgreSQL connection
            from supabase import create_client

            supabase_url = os.getenv('SUPABASE_URL') or self.config.SUPABASE_URL
            supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY') or self.config.SUPABASE_KEY

            # Use psycopg2 directly for DDL operations (CREATE FUNCTION)
            # Supabase Python client doesn't support raw SQL execution well
            db_url = os.getenv('SUPABASE_DB_URL') or os.getenv('DATABASE_URL')

            if db_url:
                import psycopg2
                conn = psycopg2.connect(db_url)
                conn.autocommit = True

                with conn.cursor() as cursor:
                    cursor.execute(rpc_sql)

                conn.close()
                logger.info("✅ RPC function 'match_medical_embeddings' created successfully")
            else:
                logger.warning("⚠️  SUPABASE_DB_URL not set - RPC function creation skipped")
                logger.warning("    The function should be created manually in Supabase SQL Editor")
                logger.warning("    SQL available at: scripts/setup_supabase_rpc.sql")

        except Exception as e:
            # Don't fail indexing if RPC creation fails - it may already exist
            logger.warning(f"RPC function setup encountered issue: {e}")
            logger.warning("This is non-critical - RPC function may already exist")
            logger.info("If searches fail, run: scripts/setup_supabase_rpc.sql in Supabase SQL Editor")

    def validate_environment(self) -> bool:
        """Validate required environment variables and files"""
        errors = []
        warnings = []

        # Detect environment
        env = os.getenv('ENVIRONMENT', 'development')

        # Check API keys (optional in development, required in production)
        hf_token = os.getenv('HUGGINGFACE_API_KEY') or os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_TOKEN')

        if env in ['production', 'staging', 'hml']:
            # Production environments: Validate GitHub Secret is present
            if not hf_token:
                errors.append("HUGGINGFACE_API_KEY not set in GitHub Secrets (required for production)")
                logger.warning("Configure at: https://github.com/settings/secrets")
        else:
            # Development environment: Token is optional (will use local sentence-transformers)
            if not hf_token:
                warnings.append("HUGGINGFACE_TOKEN not set - using local sentence-transformers model")
                logger.info("📦 Will download multilingual-e5-small model locally (384D, ~500MB)")

        # Check Supabase config
        if not self.config.SUPABASE_URL:
            errors.append("SUPABASE_URL not configured")

        if not self.config.SUPABASE_KEY and not self.config.SUPABASE_SERVICE_KEY:
            errors.append("SUPABASE_KEY or SUPABASE_SERVICE_KEY required")

        # Check directories
        if not self.kb_dir.exists():
            errors.append(f"Knowledge base directory not found: {self.kb_dir}")

        if not self.structured_dir.exists():
            errors.append(f"Structured data directory not found: {self.structured_dir}")

        # Log warnings (non-blocking)
        if warnings:
            logger.info("Environment notices:")
            for warning in warnings:
                logger.info(f"  ℹ️  {warning}")

        # Check for errors (blocking)
        if errors:
            logger.error("Environment validation failed:")
            for error in errors:
                logger.error(f"  - {error}")
            return False

        logger.info("Environment validation passed")
        return True

    def get_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding using environment-appropriate method:
        - Local/Development: sentence-transformers library (offline, no API needed)
        - Production/CI: HuggingFace API with GitHub Secrets

        Uses multilingual-e5-small model (384D) for Portuguese support
        """
        try:
            # Detect environment (same pattern as app_config.py)
            env = os.environ.get('ENVIRONMENT', 'development')
            model_name = "intfloat/multilingual-e5-small"

            # Production/CI environment: Use HuggingFace API with GitHub Secrets
            if env in ['production', 'staging', 'hml']:
                logger.info(f"Using HuggingFace API for {env} environment")

                # Validate required secrets
                hf_token = os.environ.get('HUGGINGFACE_API_KEY') or os.environ.get('HF_TOKEN')
                if not hf_token:
                    logger.error("HUGGINGFACE_API_KEY not found in GitHub Secrets")
                    logger.info("Configure at: https://github.com/settings/secrets")
                    return None

                # Note: multilingual-e5-small doesn't support feature-extraction via API
                # For production, we'll use sentence-transformers as well since it's more reliable
                # Fall through to local method below
                logger.warning("HuggingFace API doesn't support feature-extraction for this model")
                logger.info("Using local sentence-transformers instead")

            # Local Development OR Production (both use sentence-transformers)
            logger.info(f"Loading local embedding model: {model_name}")

            # Cache model instance to avoid reloading on every call
            if not hasattr(self, '_embedding_model'):
                from sentence_transformers import SentenceTransformer
                self._embedding_model = SentenceTransformer(model_name)
                logger.info(f"Model loaded successfully (384D embeddings)")

            # Generate embedding using local model
            embedding = self._embedding_model.encode(
                text,
                convert_to_numpy=True,
                show_progress_bar=False
            )

            # Convert numpy array to list
            embedding_list = embedding.tolist()

            logger.debug(f"Generated embedding ({len(embedding_list)} dimensions)")
            return embedding_list

        except ImportError as e:
            logger.error(f"sentence-transformers not installed: {e}")
            logger.info("Install with: pip install sentence-transformers")
            return None
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None

    def generate_chunk_id(self, text: str, source_file: str) -> str:
        """Generate unique ID for chunk"""
        content = f"{source_file}:{text[:100]}"
        return hashlib.sha256(content.encode()).hexdigest()

    def process_markdown_file(self, file_path: Path) -> List[Dict]:
        """Process markdown file into chunks"""
        logger.info(f"Processing markdown: {file_path.name}")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Simple paragraph-based chunking
            chunks = []
            paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

            for i, paragraph in enumerate(paragraphs):
                # Skip very short paragraphs
                if len(paragraph) < 50:
                    continue

                # Determine priority based on content
                priority = 0.7  # Default
                chunk_type = 'general'

                text_lower = paragraph.lower()

                # Critical content detection
                if any(term in text_lower for term in ['dosagem', 'dose', 'mg', 'comprimido']):
                    priority = 1.0
                    chunk_type = 'dosage'
                elif any(term in text_lower for term in ['contraindicação', 'efeito colateral', 'reação adversa']):
                    priority = 0.95
                    chunk_type = 'safety'
                elif any(term in text_lower for term in ['protocolo', 'procedimento', 'roteiro']):
                    priority = 0.85
                    chunk_type = 'protocol'

                chunks.append({
                    'text': paragraph,
                    'chunk_type': chunk_type,
                    'priority': priority,
                    'source_file': file_path.name,
                    'metadata': {
                        'section': f'paragraph_{i}',
                        'word_count': len(paragraph.split()),
                        'source_type': 'markdown'
                    }
                })

            logger.info(f"Extracted {len(chunks)} chunks from {file_path.name}")
            return chunks

        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            self.stats['errors'].append(f"{file_path.name}: {str(e)}")
            return []

    def process_json_file(self, file_path: Path, chunk_type: str, priority: float) -> List[Dict]:
        """Process JSON file into chunks"""
        logger.info(f"Processing JSON: {file_path.name}")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            chunks = []

            def extract_text_recursive(obj, path=""):
                """Extract text from JSON structure"""
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        current_path = f"{path}.{key}" if path else key
                        extract_text_recursive(value, current_path)

                elif isinstance(obj, list):
                    for i, item in enumerate(obj):
                        current_path = f"{path}[{i}]"
                        extract_text_recursive(item, current_path)

                elif isinstance(obj, str) and len(obj.strip()) > 50:
                    # Significant text chunk
                    text = obj.strip()

                    # Refine chunk type based on content
                    refined_type = chunk_type
                    refined_priority = priority

                    text_lower = text.lower()
                    if 'dosagem' in text_lower or 'dose' in text_lower:
                        refined_type = 'dosage'
                        refined_priority = min(1.0, priority + 0.1)
                    elif 'contraindicação' in text_lower:
                        refined_type = 'safety'
                        refined_priority = min(1.0, priority + 0.05)

                    chunks.append({
                        'text': text,
                        'chunk_type': refined_type,
                        'priority': refined_priority,
                        'source_file': file_path.name,
                        'metadata': {
                            'section': path,
                            'word_count': len(text.split()),
                            'source_type': 'json',
                            'original_type': chunk_type
                        }
                    })

            extract_text_recursive(data)

            logger.info(f"Extracted {len(chunks)} chunks from {file_path.name}")
            return chunks

        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            self.stats['errors'].append(f"{file_path.name}: {str(e)}")
            return []

    def index_chunk(self, chunk: Dict) -> bool:
        """Index a single chunk into vector store"""
        try:
            # Generate unique ID
            doc_id = self.generate_chunk_id(chunk['text'], chunk['source_file'])

            # Check if already indexed (unless force reindex)
            if not self.force_reindex and not self.dry_run:
                existing = self.vector_store.get_document(doc_id)
                if existing:
                    logger.debug(f"Chunk {doc_id[:8]} already indexed, skipping")
                    return True

            # Generate embedding
            if self.dry_run:
                logger.info(f"[DRY RUN] Would index: {chunk['source_file']} - {chunk['chunk_type']}")
                embedding = [0.0] * 1536  # Dummy embedding for dry run
            else:
                embedding = self.get_embedding(chunk['text'])
                if not embedding:
                    logger.error(f"Failed to generate embedding for chunk {doc_id[:8]}")
                    return False

                self.stats['embeddings_generated'] += 1

            # Create vector document
            import numpy as np

            vector_doc = self.VectorDocument(
                id=doc_id,
                text=chunk['text'],
                embedding=np.array(embedding) if embedding else None,
                metadata=chunk['metadata'],
                chunk_type=chunk['chunk_type'],
                priority=chunk['priority'],
                source_file=chunk['source_file'],
                created_at=datetime.now(timezone.utc)
            )

            # Add to vector store
            if self.dry_run:
                logger.debug(f"[DRY RUN] Would add document: {doc_id[:8]}")
                return True
            else:
                success = self.vector_store.add_document(vector_doc)
                if success:
                    self.stats['documents_indexed'] += 1
                    logger.debug(f"Indexed: {doc_id[:8]} - {chunk['chunk_type']} (priority: {chunk['priority']:.2f})")
                return success

        except Exception as e:
            logger.error(f"Error indexing chunk: {e}")
            self.stats['errors'].append(f"Indexing error: {str(e)}")
            return False

    def index_all_files(self) -> bool:
        """Index all knowledge base files"""
        logger.info("Starting knowledge base indexing...")

        if not self.validate_environment():
            return False

        all_chunks = []

        # Process markdown files
        logger.info("Processing markdown files...")
        md_files = list(self.kb_dir.glob("*.md"))
        for md_file in md_files:
            chunks = self.process_markdown_file(md_file)
            all_chunks.extend(chunks)
            self.stats['files_processed'] += 1

        # Process JSON files with metadata
        logger.info("Processing JSON files...")
        json_mapping = {
            "clinical_taxonomy.json": {"chunk_type": "taxonomy", "priority": 0.8},
            "dosing_protocols.json": {"chunk_type": "dosage", "priority": 1.0},
            "medications_mechanisms.json": {"chunk_type": "mechanism", "priority": 0.7},
            "dispensing_workflow.json": {"chunk_type": "protocol", "priority": 0.9},
            "pharmacovigilance_guidelines.json": {"chunk_type": "safety", "priority": 0.95},
            "hanseniase_catalog.json": {"chunk_type": "catalog", "priority": 0.8},
            "quick_reference_protocols.json": {"chunk_type": "reference", "priority": 0.85},
            "frequently_asked_questions.json": {"chunk_type": "faq", "priority": 0.6},
            "knowledge_scope_limitations.json": {"chunk_type": "scope", "priority": 0.5}
        }

        for filename, config in json_mapping.items():
            json_file = self.structured_dir / filename
            if json_file.exists():
                chunks = self.process_json_file(json_file, config['chunk_type'], config['priority'])
                all_chunks.extend(chunks)
                self.stats['files_processed'] += 1
            else:
                logger.warning(f"JSON file not found: {filename}")

        self.stats['chunks_created'] = len(all_chunks)

        # Index all chunks
        logger.info(f"Indexing {len(all_chunks)} chunks...")

        success_count = 0
        failed_count = 0

        for i, chunk in enumerate(all_chunks):
            if i % 50 == 0:
                logger.info(f"Progress: {i}/{len(all_chunks)} chunks processed")

            if self.index_chunk(chunk):
                success_count += 1
            else:
                failed_count += 1

            # Rate limiting - avoid overwhelming API
            if not self.dry_run and i % 10 == 0:
                time.sleep(0.5)

        # Final statistics
        self.stats['end_time'] = datetime.now()
        duration = self.stats['end_time'] - self.stats['start_time']

        logger.info("=" * 60)
        logger.info("INDEXING COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Files processed: {self.stats['files_processed']}")
        logger.info(f"Chunks created: {self.stats['chunks_created']}")
        logger.info(f"Embeddings generated: {self.stats['embeddings_generated']}")
        logger.info(f"Documents indexed: {self.stats['documents_indexed']}")
        logger.info(f"Success rate: {success_count}/{len(all_chunks)} ({100*success_count/len(all_chunks):.1f}%)")
        logger.info(f"Duration: {duration}")
        logger.info(f"Errors: {len(self.stats['errors'])}")

        if self.stats['errors']:
            logger.error("Error summary:")
            for error in self.stats['errors'][:10]:
                logger.error(f"  - {error}")

        # Save report
        self.save_report()

        return failed_count == 0

    def save_report(self):
        """Save indexing report"""
        report_path = script_dir / f"indexing_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        try:
            report = {
                'stats': {
                    **self.stats,
                    'start_time': self.stats['start_time'].isoformat(),
                    'end_time': self.stats['end_time'].isoformat() if self.stats['end_time'] else None
                },
                'config': {
                    'force_reindex': self.force_reindex,
                    'dry_run': self.dry_run,
                    'supabase_url': self.config.SUPABASE_URL,
                    'embedding_model': 'openai/text-embedding-3-small'
                }
            }

            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False, default=str)

            logger.info(f"Report saved: {report_path}")

        except Exception as e:
            logger.error(f"Failed to save report: {e}")

    def verify_indexing(self) -> bool:
        """Verify that documents were indexed successfully"""
        logger.info("Verifying indexing...")

        try:
            stats = self.vector_store.get_stats()

            logger.info("Vector store statistics:")
            logger.info(f"  Backend: {stats.get('backend', 'unknown')}")
            logger.info(f"  Documents: {stats.get('supabase_documents', 0)}")
            logger.info(f"  Connected: {stats.get('supabase_connected', False)}")

            doc_count = stats.get('supabase_documents', 0)

            if doc_count == 0:
                logger.error("Verification failed: No documents in vector store")
                return False
            elif doc_count < 100:
                logger.warning(f"Only {doc_count} documents indexed - expected 500+")
                return False
            else:
                logger.info(f"Verification passed: {doc_count} documents indexed")
                return True

        except Exception as e:
            logger.error(f"Verification error: {e}")
            return False

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Index knowledge base into Supabase')
    parser.add_argument('--force', action='store_true', help='Force reindex existing documents')
    parser.add_argument('--dry-run', action='store_true', help='Dry run without actually indexing')

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("KNOWLEDGE BASE INDEXING SCRIPT")
    logger.info("=" * 60)

    try:
        indexer = KnowledgeBaseIndexer(
            force_reindex=args.force,
            dry_run=args.dry_run
        )

        # Index all files
        success = indexer.index_all_files()

        if success and not args.dry_run:
            # Verify indexing
            if indexer.verify_indexing():
                logger.info("SUCCESS: Knowledge base fully indexed and verified")
                return 0
            else:
                logger.error("PARTIAL SUCCESS: Indexing completed but verification failed")
                return 1
        elif success and args.dry_run:
            logger.info("DRY RUN COMPLETE: No actual indexing performed")
            return 0
        else:
            logger.error("FAILED: Indexing encountered errors")
            return 1

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())
