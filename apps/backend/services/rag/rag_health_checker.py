# -*- coding: utf-8 -*-
"""
RAG Health Checker - Monitors RAG system status for health endpoints
Provides detailed status information for debugging and monitoring
"""

import os
import logging
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path

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

        # Check Supabase RAG system (primary)
        supabase_status = self._check_unified_rag()
        health_status['systems']['supabase_rag'] = supabase_status

        # Check Enhanced RAG (fallback)
        enhanced_status = self._check_enhanced_rag()
        health_status['systems']['enhanced_rag'] = enhanced_status

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
        """Check Supabase RAG system status (primary system)"""
        try:
            from services.rag.supabase_rag_system import get_rag_system

            rag_system = get_rag_system()

            if not rag_system:
                return {
                    'status': 'FAIL',
                    'available': False,
                    'error': 'RAG system not initialized'
                }

            stats = rag_system.get_stats()
            available_components = stats.get('available_components', {})

            # System is OK if vector store and search engine are available
            is_available = (
                available_components.get('vector_store', False) and
                available_components.get('search_engine', False)
            )

            return {
                'status': 'OK' if is_available else 'FAIL',
                'available': is_available,
                'best_system': 'supabase_rag',
                'system_count': sum(1 for v in available_components.values() if v),
                'health': 'operational' if is_available else 'degraded',
                'details': stats
            }
        except Exception as e:
            logger.error(f"Error checking Supabase RAG: {e}")
            return {
                'status': 'ERROR',
                'available': False,
                'error': str(e)
            }

    def _check_enhanced_rag(self) -> Dict[str, Any]:
        """Check Enhanced RAG system (fallback system)"""
        try:
            from services.rag.enhanced_rag_system import EnhancedRAGSystem

            # Try to instantiate enhanced RAG
            from app_config import config
            enhanced_rag = EnhancedRAGSystem(config)

            is_available = enhanced_rag.is_available() if hasattr(enhanced_rag, 'is_available') else True

            return {
                'status': 'OK' if is_available else 'FAIL',
                'available': is_available,
                'components': {'enhanced_rag': 'operational'},
                'statistics': {},
                'details': {'system': 'enhanced_rag', 'role': 'fallback'}
            }
        except Exception as e:
            logger.error(f"Error checking Enhanced RAG: {e}")
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
            'unified_embedding_service': 'UNKNOWN',
            'huggingface_api': 'UNKNOWN',
            'local_model': 'UNKNOWN'
        }

        # Check UnifiedEmbeddingService (ÚNICO serviço de embeddings)
        try:
            from services.unified_embedding_service import get_embedding_service

            embedding_service = get_embedding_service()

            if embedding_service and embedding_service.is_available():
                embedding_status['unified_embedding_service'] = 'OK'

                # Get statistics to check backend
                stats = embedding_service.get_statistics()
                backend_used = stats.get('backend_used', 'unknown')

                # Check which backend is active
                if backend_used == 'huggingface':
                    embedding_status['huggingface_api'] = 'OK'
                    embedding_status['local_model'] = 'UNUSED'
                elif backend_used == 'local':
                    embedding_status['local_model'] = 'OK'
                    embedding_status['huggingface_api'] = 'UNUSED'
                else:
                    embedding_status['huggingface_api'] = 'UNKNOWN'
                    embedding_status['local_model'] = 'UNKNOWN'
            else:
                embedding_status['unified_embedding_service'] = 'UNAVAILABLE'
                embedding_status['huggingface_api'] = 'N/A'
                embedding_status['local_model'] = 'N/A'

        except ImportError as e:
            embedding_status['unified_embedding_service'] = 'NOT_INSTALLED'
            embedding_status['huggingface_api'] = 'N/A'
            embedding_status['local_model'] = 'N/A'
        except Exception as e:
            embedding_status['unified_embedding_service'] = f'ERROR: {str(e)}'

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
        # Check if Supabase RAG is working (primary)
        supabase_rag = systems.get('supabase_rag', {})
        if supabase_rag.get('status') == 'OK' and supabase_rag.get('available', False):
            return 'OK'

        # Check if Enhanced RAG is working (fallback)
        enhanced_rag = systems.get('enhanced_rag', {})
        if enhanced_rag.get('status') == 'OK' and enhanced_rag.get('available', False):
            return 'OK'

        # Check if any vector store is available
        vector_stores = systems.get('vector_stores', {})
        vector_ok = any(status == 'OK' for status in vector_stores.values())

        # Check if embedding service is available
        embedding_services = systems.get('embedding_services', {})
        embedding_ok = embedding_services.get('unified_embedding_service') == 'OK'

        if vector_ok and embedding_ok:
            return 'PARTIAL'

        return 'FAIL'

    def _generate_recommendations(self, systems: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on system status"""
        recommendations = []

        # Check embedding services
        embedding_services = systems.get('embedding_services', {})
        if embedding_services.get('unified_embedding_service') not in ['OK', 'UNKNOWN']:
            recommendations.append("UnifiedEmbeddingService not available - check HUGGINGFACE_API_KEY environment variable")

        # Check vector stores
        vector_stores = systems.get('vector_stores', {})
        if vector_stores.get('supabase_vector') not in ['OK', 'UNKNOWN']:
            recommendations.append("Supabase vector store not available - check SUPABASE credentials")

        # Check knowledge base
        kb = systems.get('knowledge_base', {})
        if kb.get('total_files', 0) == 0:
            recommendations.append("Add medical documents to data/knowledge-base/ directory")

        if not kb.get('paths_found'):
            recommendations.append("Create knowledge base directories: data/knowledge-base/ and data/structured/")

        # Supabase RAG recommendations
        supabase_rag = systems.get('supabase_rag', {})
        if supabase_rag.get('status') not in ['OK', 'UNKNOWN']:
            recommendations.append("Supabase RAG system not available - check dependencies and configuration")

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
            from services.rag.supabase_rag_system import query_rag_system

            start_time = datetime.now()
            response = query_rag_system(test_query, persona='dr_gasnelio', max_chunks=3)
            end_time = datetime.now()

            if response:
                return {
                    'test_successful': True,
                    'response_received': bool(response.answer),
                    'system_used': 'supabase_rag',
                    'confidence': response.quality_score,
                    'processing_time_ms': response.processing_time_ms,
                    'total_time_ms': int((end_time - start_time).total_seconds() * 1000),
                    'answer_preview': response.answer[:200] + "..." if len(response.answer) > 200 else response.answer
                }
            else:
                return {
                    'test_successful': False,
                    'error': 'No response from RAG system'
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