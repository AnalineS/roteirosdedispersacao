# -*- coding: utf-8 -*-
"""
RAG Health Checker - Monitors RAG system status for health endpoints
Provides detailed status information for debugging and monitoring
"""

import os
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class RAGHealthChecker:
    """Comprehensive RAG system health checker"""

    def __init__(self):
        self.last_check = None
        self.cached_status = None
        self.cache_duration = 30  # seconds

    def check_rag_health(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Check RAG system health with caching
        Returns comprehensive status for health endpoints
        """
        now = datetime.now()

        # Use cache if recent and not forcing refresh
        if (not force_refresh and
            self.cached_status and
            self.last_check and
            (now - self.last_check).total_seconds() < self.cache_duration):
            return self.cached_status

        # Perform comprehensive health check
        status = self._perform_health_check()

        # Update cache
        self.cached_status = status
        self.last_check = now

        return status

    def _perform_health_check(self) -> Dict[str, Any]:
        """Perform detailed health check of all RAG components"""
        health_status = {
            'rag_overall': 'UNKNOWN',
            'timestamp': datetime.now().isoformat(),
            'systems': {},
            'errors': [],
            'warnings': [],
            'recommendations': []
        }

        # Check unified RAG system
        unified_status = self._check_unified_rag()
        health_status['systems']['unified_rag'] = unified_status

        # Check complete medical RAG
        complete_status = self._check_complete_medical_rag()
        health_status['systems']['complete_medical_rag'] = complete_status

        # Check vector stores
        vector_status = self._check_vector_stores()
        health_status['systems']['vector_stores'] = vector_status

        # Check embedding services
        embedding_status = self._check_embedding_services()
        health_status['systems']['embedding_services'] = embedding_status

        # Check knowledge base
        kb_status = self._check_knowledge_base()
        health_status['systems']['knowledge_base'] = kb_status

        # Determine overall status
        health_status['rag_overall'] = self._determine_overall_status(health_status['systems'])

        # Add recommendations
        health_status['recommendations'] = self._generate_recommendations(health_status['systems'])

        return health_status

    def _check_unified_rag(self) -> Dict[str, Any]:
        """Check unified RAG system status"""
        try:
            from services.rag.unified_rag_system import get_unified_rag_status

            status = get_unified_rag_status()

            return {
                'status': 'OK' if status.get('unified_rag_available', False) else 'FAIL',
                'available': status.get('unified_rag_available', False),
                'best_system': status.get('best_system', 'none'),
                'system_count': status.get('system_count', 0),
                'health': status.get('health', 'unknown'),
                'details': status
            }
        except Exception as e:
            logger.error(f"Error checking unified RAG: {e}")
            return {
                'status': 'ERROR',
                'available': False,
                'error': str(e)
            }

    def _check_complete_medical_rag(self) -> Dict[str, Any]:
        """Check complete medical RAG system"""
        try:
            from services.rag.complete_medical_rag import get_rag_status

            status = get_rag_status()

            return {
                'status': 'OK' if status.get('available', False) else 'FAIL',
                'available': status.get('available', False),
                'components': status.get('components', {}),
                'statistics': status.get('statistics', {}),
                'details': status
            }
        except Exception as e:
            logger.error(f"Error checking complete medical RAG: {e}")
            return {
                'status': 'ERROR',
                'available': False,
                'error': str(e)
            }

    def _check_vector_stores(self) -> Dict[str, Any]:
        """Check vector store availability"""
        vector_status = {
            'chromadb': 'UNKNOWN',
            'supabase_vector': 'UNKNOWN',
            'local_store': 'UNKNOWN'
        }

        # Check ChromaDB
        try:
            import chromadb
            vector_status['chromadb'] = 'OK'
        except ImportError:
            vector_status['chromadb'] = 'NOT_INSTALLED'
        except Exception as e:
            vector_status['chromadb'] = f'ERROR: {str(e)}'

        # Check Supabase vector store
        try:
            from services.vector_store import get_vector_store
            store = get_vector_store()
            if store and store.is_available():
                vector_status['supabase_vector'] = 'OK'
            else:
                vector_status['supabase_vector'] = 'UNAVAILABLE'
        except Exception as e:
            vector_status['supabase_vector'] = f'ERROR: {str(e)}'

        # Check local vector store
        try:
            import os
            from app_config import config
            vector_path = getattr(config, 'VECTOR_DB_PATH', './data/vector_store')
            if os.path.exists(vector_path):
                vector_status['local_store'] = 'OK'
            else:
                vector_status['local_store'] = 'NOT_FOUND'
        except Exception as e:
            vector_status['local_store'] = f'ERROR: {str(e)}'

        return vector_status

    def _check_embedding_services(self) -> Dict[str, Any]:
        """Check embedding service availability"""
        embedding_status = {
            'openai_api': 'UNKNOWN',
            'sentence_transformers': 'UNKNOWN',
            'local_embeddings': 'UNKNOWN'
        }

        # Check OpenAI API
        try:
            from app_config import config
            if hasattr(config, 'OPENAI_API_KEY') and config.OPENAI_API_KEY:
                # Try to import openai
                import openai
                embedding_status['openai_api'] = 'OK'
            else:
                embedding_status['openai_api'] = 'NO_API_KEY'
        except ImportError:
            embedding_status['openai_api'] = 'NOT_INSTALLED'
        except Exception as e:
            embedding_status['openai_api'] = f'ERROR: {str(e)}'

        # Check sentence-transformers
        try:
            from sentence_transformers import SentenceTransformer
            embedding_status['sentence_transformers'] = 'OK'
        except ImportError:
            embedding_status['sentence_transformers'] = 'NOT_INSTALLED'
        except Exception as e:
            embedding_status['sentence_transformers'] = f'ERROR: {str(e)}'

        # Check local embedding service
        try:
            from services.rag.embedding_service import is_embeddings_available
            if is_embeddings_available():
                embedding_status['local_embeddings'] = 'OK'
            else:
                embedding_status['local_embeddings'] = 'UNAVAILABLE'
        except Exception as e:
            embedding_status['local_embeddings'] = f'ERROR: {str(e)}'

        return embedding_status

    def _check_knowledge_base(self) -> Dict[str, Any]:
        """Check knowledge base files"""
        kb_status = {
            'total_files': 0,
            'markdown_files': 0,
            'json_files': 0,
            'paths_found': [],
            'paths_missing': []
        }

        knowledge_paths = [
            "data/knowledge-base",
            "data/structured",
            "data/knowledge_base"  # Alternative path
        ]

        for path in knowledge_paths:
            if os.path.exists(path):
                kb_status['paths_found'].append(path)

                # Count files
                from pathlib import Path
                path_obj = Path(path)

                md_files = list(path_obj.rglob("*.md"))
                json_files = list(path_obj.rglob("*.json"))

                kb_status['markdown_files'] += len(md_files)
                kb_status['json_files'] += len(json_files)
                kb_status['total_files'] += len(md_files) + len(json_files)
            else:
                kb_status['paths_missing'].append(path)

        return kb_status

    def _determine_overall_status(self, systems: Dict[str, Any]) -> str:
        """Determine overall RAG status"""
        # Check if unified RAG is working
        unified_rag = systems.get('unified_rag', {})
        if unified_rag.get('status') == 'OK' and unified_rag.get('available', False):
            return 'OK'

        # Check if complete medical RAG is working
        complete_rag = systems.get('complete_medical_rag', {})
        if complete_rag.get('status') == 'OK' and complete_rag.get('available', False):
            return 'OK'

        # Check if any vector store is available
        vector_stores = systems.get('vector_stores', {})
        vector_ok = any(status == 'OK' for status in vector_stores.values())

        # Check if any embedding service is available
        embedding_services = systems.get('embedding_services', {})
        embedding_ok = any(status == 'OK' for status in embedding_services.values())

        if vector_ok and embedding_ok:
            return 'PARTIAL'

        return 'FAIL'

    def _generate_recommendations(self, systems: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on system status"""
        recommendations = []

        # Check embedding services
        embedding_services = systems.get('embedding_services', {})
        if embedding_services.get('openai_api') == 'NO_API_KEY':
            recommendations.append("Set OPENAI_API_KEY environment variable for better embedding performance")

        if embedding_services.get('sentence_transformers') == 'NOT_INSTALLED':
            recommendations.append("Install sentence-transformers: pip install sentence-transformers")

        # Check vector stores
        vector_stores = systems.get('vector_stores', {})
        if vector_stores.get('chromadb') == 'NOT_INSTALLED':
            recommendations.append("Install ChromaDB: pip install chromadb")

        # Check knowledge base
        kb = systems.get('knowledge_base', {})
        if kb.get('total_files', 0) == 0:
            recommendations.append("Add medical documents to data/knowledge-base/ directory")

        if not kb.get('paths_found'):
            recommendations.append("Create knowledge base directories: data/knowledge-base/ and data/structured/")

        # Unified RAG recommendations
        unified_rag = systems.get('unified_rag', {})
        if unified_rag.get('system_count', 0) == 0:
            recommendations.append("No RAG systems available - check dependencies and configuration")

        return recommendations

    def get_simple_status(self) -> str:
        """Get simple OK/FAIL status for health endpoints"""
        try:
            status = self.check_rag_health()
            return status.get('rag_overall', 'UNKNOWN')
        except Exception as e:
            logger.error(f"Error getting RAG status: {e}")
            return 'ERROR'

    def test_rag_query(self, test_query: str = "O que é PQT-U?") -> Dict[str, Any]:
        """Test RAG system with a sample query"""
        try:
            from services.rag.unified_rag_system import query_unified_rag

            start_time = datetime.now()
            response = query_unified_rag(test_query, 'dr_gasnelio', 3)
            end_time = datetime.now()

            return {
                'test_successful': response.success,
                'response_received': bool(response.answer),
                'system_used': response.system_used,
                'confidence': response.confidence,
                'processing_time_ms': response.processing_time_ms,
                'total_time_ms': int((end_time - start_time).total_seconds() * 1000),
                'answer_preview': response.answer[:200] + "..." if len(response.answer) > 200 else response.answer
            }
        except Exception as e:
            return {
                'test_successful': False,
                'error': str(e)
            }

# Global health checker instance
_health_checker = RAGHealthChecker()

def get_rag_health() -> Dict[str, Any]:
    """Get RAG system health status"""
    return _health_checker.check_rag_health()

def get_rag_simple_status() -> str:
    """Get simple RAG status for health endpoints"""
    return _health_checker.get_simple_status()

def test_rag_functionality() -> Dict[str, Any]:
    """Test RAG functionality with sample query"""
    return _health_checker.test_rag_query()

def force_refresh_rag_status() -> Dict[str, Any]:
    """Force refresh of RAG status (bypass cache)"""
    return _health_checker.check_rag_health(force_refresh=True)