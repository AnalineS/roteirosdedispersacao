# -*- coding: utf-8 -*-
"""
Optimized RAG Manager - Sistema RAG unificado e otimizado
Integra todas as implementações RAG existentes em um gerenciador inteligente
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass, asdict
import json
import os
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class RAGPerformanceMetrics:
    """Métricas de performance do RAG"""
    queries_processed: int = 0
    avg_response_time: float = 0.0
    cache_hit_rate: float = 0.0
    semantic_success_rate: float = 0.0
    fallback_usage_rate: float = 0.0
    total_chunks_indexed: int = 0
    active_rag_type: str = "unknown"
    features_enabled: Dict[str, bool] = None

    def __post_init__(self):
        if self.features_enabled is None:
            self.features_enabled = {}

class OptimizedRAGManager:
    """
    Gerenciador RAG otimizado que unifica todos os sistemas disponíveis
    Automaticamente detecta e ativa o melhor sistema disponível
    """
    
    def __init__(self, config=None):
        """Inicializa o gerenciador RAG otimizado"""
        self.config = config or self._get_config()
        self.metrics = RAGPerformanceMetrics()
        
        # Sistema ativo
        self.active_rag = None
        self.fallback_rag = None
        self.rag_type = "none"
        
        # Cache inteligente - integração com Unified Cache
        self.context_cache = {}
        self.cache_ttl = 3600  # 1 hora
        self.max_cache_size = 1000
        
        # Tentar usar cache unificado se disponível
        self.unified_cache = None
        try:
            from services.cache.unified_cache_manager import get_unified_cache
            self.unified_cache = get_unified_cache()
            if self.unified_cache:
                logger.info("✅ RAG integrado com cache unificado")
        except ImportError:
            logger.debug("Cache unificado não disponível para RAG")
        
        # Estatísticas
        self.stats = {
            'initialization_time': datetime.now().isoformat(),
            'queries_served': 0,
            'errors_count': 0,
            'performance_optimization_enabled': True
        }
        
        # Inicializar sistema otimizado
        self._initialize_optimized_rag()
        
        logger.info(f"🚀 RAG Manager Otimizado: {self.rag_type}, Cache: {len(self.context_cache)} entries")
    
    def _get_config(self):
        """Obtém configuração do sistema"""
        try:
            from app_config import config
            return config
        except ImportError:
            # Configuração fallback
            return type('Config', (), {
                'EMBEDDINGS_ENABLED': False,
                'ADVANCED_FEATURES': False, 
                'RAG_AVAILABLE': True,
                'CACHE_TTL_MINUTES': 60,
                'CACHE_MAX_SIZE': 1000
            })()
    
    def _initialize_optimized_rag(self):
        """Inicializa o melhor sistema RAG disponível com fallbacks inteligentes"""
        initialization_success = False
        
        # 1. PRIORIDADE: Embedding RAG System (mais avançado)
        if getattr(self.config, 'EMBEDDINGS_ENABLED', False):
            try:
                from services.rag.embedding_rag_system import get_embedding_rag
                embedding_rag = get_embedding_rag()
                
                if embedding_rag and embedding_rag.is_semantic_available():
                    self.active_rag = embedding_rag
                    self.rag_type = "embedding_semantic"
                    initialization_success = True
                    self.metrics.features_enabled['embeddings'] = True
                    self.metrics.features_enabled['semantic_search'] = True
                    logger.info("✅ Embedding RAG System ativado (Semantic Search)")
                
            except Exception as e:
                logger.warning(f"⚠️  Embedding RAG não disponível: {e}")
        
        # 2. FALLBACK: Medical RAG Integration (chunking médico)
        if not initialization_success and getattr(self.config, 'ADVANCED_FEATURES', False):
            try:
                from services.rag.medical_rag_integration import medical_rag_system
                
                if medical_rag_system and medical_rag_system.knowledge_base_loaded:
                    if self.active_rag is None:
                        self.active_rag = medical_rag_system
                        self.rag_type = "medical_chunking"
                        initialization_success = True
                    else:
                        self.fallback_rag = medical_rag_system
                    
                    self.metrics.features_enabled['medical_chunking'] = True
                    self.metrics.features_enabled['structured_data'] = True
                    logger.info("✅ Medical RAG System ativado (Medical Chunking)")
                
            except Exception as e:
                logger.warning(f"⚠️  Medical RAG não disponível: {e}")
        
        # 3. FALLBACK: Enhanced RAG System (cache + feedback)
        if not initialization_success:
            try:
                from services.rag.enhanced_rag_system import rag_system
                
                self.active_rag = rag_system
                self.rag_type = "enhanced_cache"
                initialization_success = True
                self.metrics.features_enabled['caching'] = True
                self.metrics.features_enabled['feedback_system'] = True
                logger.info("✅ Enhanced RAG System ativado (Cache + Feedback)")
                
            except Exception as e:
                logger.warning(f"⚠️  Enhanced RAG não disponível: {e}")
        
        # 4. ÚLTIMO RECURSO: Simple RAG
        if not initialization_success:
            try:
                from services.rag.simple_rag import simple_rag
                
                self.active_rag = simple_rag
                self.rag_type = "simple_rag"
                initialization_success = True
                self.metrics.features_enabled['basic_retrieval'] = True
                logger.info("✅ Simple RAG System ativado (Básico)")
                
            except Exception as e:
                logger.warning(f"⚠️  Simple RAG não disponível: {e}")
        
        # Atualizar métricas
        self.metrics.active_rag_type = self.rag_type
        
        if not initialization_success:
            logger.error("❌ Nenhum sistema RAG disponível!")
            self.active_rag = None
            self.rag_type = "none"
    
    def get_context(self, query: str, max_chunks: int = 3, persona: Optional[str] = None, use_cache: bool = True) -> str:
        """
        Interface principal otimizada para obtenção de contexto
        
        Args:
            query: Pergunta do usuário
            max_chunks: Número máximo de chunks
            persona: Persona solicitante para otimização
            use_cache: Se deve usar cache
            
        Returns:
            Contexto relevante para a consulta
        """
        start_time = datetime.now()
        self.stats['queries_served'] += 1
        
        # 1. Verificar cache primeiro (se habilitado)
        if use_cache:
            cached_context = self._get_cached_context(query, persona)
            if cached_context:
                self._update_performance_metrics(start_time, cache_hit=True)
                return cached_context
        
        # 2. Obter contexto do sistema ativo
        context = ""
        
        try:
            if self.active_rag is None:
                context = "Sistema RAG não disponível. Resposta baseada apenas no conhecimento do modelo."
            else:
                context = self._get_context_from_active_rag(query, max_chunks, persona)
            
            # 3. Fallback se contexto vazio e temos fallback
            if not context.strip() and self.fallback_rag:
                logger.debug("🔄 Usando sistema RAG fallback")
                context = self._get_context_from_fallback_rag(query, max_chunks, persona)
                self.metrics.fallback_usage_rate = (self.metrics.fallback_usage_rate + 1) / self.stats['queries_served']
            
            # 4. Cache do resultado (se obteve contexto válido)
            if context.strip() and use_cache:
                self._cache_context(query, persona, context)
            
            # 5. Atualizar métricas
            self._update_performance_metrics(start_time, cache_hit=False)
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter contexto RAG: {e}")
            self.stats['errors_count'] += 1
            context = "Erro interno no sistema de busca. Resposta baseada no conhecimento do modelo."
        
        return context
    
    def _get_context_from_active_rag(self, query: str, max_chunks: int, persona: Optional[str]) -> str:
        """Obtém contexto do sistema RAG ativo"""
        if self.rag_type == "embedding_semantic":
            # Embedding RAG com semantic search
            return self.active_rag.get_context(query, max_chunks, persona)
            
        elif self.rag_type == "medical_chunking":
            # Medical RAG com chunking médico
            return self.active_rag.get_relevant_context(query, max_chunks)
            
        elif self.rag_type == "enhanced_cache":
            # Enhanced RAG com cache
            try:
                from services.rag.enhanced_rag_system import get_enhanced_context
                full_text = self._get_knowledge_base_text()
                return get_enhanced_context(query, full_text, max_chunks * 1000)
            except:
                return self.active_rag.get_enhanced_context(query, "", max_chunks * 1000)
                
        elif self.rag_type == "simple_rag":
            # Simple RAG básico
            try:
                return self.active_rag.generate_context_from_rag(query, max_chunks)
            except AttributeError:
                # Fallback se método não existe
                return ""
        
        return ""
    
    def _get_context_from_fallback_rag(self, query: str, max_chunks: int, persona: Optional[str]) -> str:
        """Obtém contexto do sistema RAG fallback"""
        if not self.fallback_rag:
            return ""
        
        try:
            # Assumindo que fallback é medical_rag_system
            return self.fallback_rag.get_relevant_context(query, max_chunks)
        except Exception as e:
            logger.error(f"Erro no fallback RAG: {e}")
            return ""
    
    def _get_cached_context(self, query: str, persona: Optional[str]) -> Optional[str]:
        """Verifica cache para contexto existente - integrado com cache unificado"""
        # Primeiro tentar cache unificado
        if self.unified_cache:
            try:
                cache_key = f"rag_context:{self._generate_cache_key(query, persona)}"
                cached_result = self.unified_cache.get_cached_rag_result(query, source='rag_context')
                if cached_result:
                    logger.debug(f"💾 Cache Unificado HIT para query: {query[:50]}...")
                    return cached_result
            except Exception as e:
                logger.debug(f"Erro no cache unificado RAG: {e}")
        
        # Fallback para cache local
        cache_key = self._generate_cache_key(query, persona)
        
        if cache_key in self.context_cache:
            cached_entry = self.context_cache[cache_key]
            
            # Verificar TTL
            if (datetime.now() - cached_entry['timestamp']).total_seconds() < self.cache_ttl:
                cached_entry['hits'] += 1
                logger.debug(f"💾 Cache Local HIT para query: {query[:50]}...")
                return cached_entry['context']
            else:
                # Remover entrada expirada
                del self.context_cache[cache_key]
        
        return None
    
    def _cache_context(self, query: str, persona: Optional[str], context: str):
        """Armazena contexto no cache - integrado com cache unificado"""
        if len(context.strip()) < 50:  # Não cachear contextos muito pequenos
            return
        
        # Primeiro tentar cache unificado
        if self.unified_cache:
            try:
                success = self.unified_cache.cache_rag_result(query, context, source='rag_context')
                if success:
                    logger.debug(f"💾 Contexto salvo no cache unificado: {query[:50]}...")
                    return
            except Exception as e:
                logger.debug(f"Erro ao salvar no cache unificado RAG: {e}")
        
        # Fallback para cache local
        cache_key = self._generate_cache_key(query, persona)
        
        # Limitar tamanho do cache local
        if len(self.context_cache) >= self.max_cache_size:
            # Remover entrada mais antiga
            oldest_key = min(self.context_cache.keys(), 
                           key=lambda k: self.context_cache[k]['timestamp'])
            del self.context_cache[oldest_key]
        
        self.context_cache[cache_key] = {
            'context': context,
            'timestamp': datetime.now(),
            'hits': 0,
            'persona': persona
        }
        
        logger.debug(f"💾 Contexto cacheado localmente: {query[:50]}...")
    
    def _generate_cache_key(self, query: str, persona: Optional[str]) -> str:
        """Gera chave única para cache"""
        import hashlib
        key_data = f"{query.lower().strip()}:{persona or 'default'}"
        return hashlib.md5(key_data.encode()).hexdigest()[:16]
    
    def _get_knowledge_base_text(self) -> str:
        """Obtém texto completo da base de conhecimento"""
        try:
            knowledge_files = [
                "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md",
                "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/knowledge_base/roteiro_hanseniase_basico.md"
            ]
            
            full_text = ""
            for file_path in knowledge_files:
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        full_text += f.read() + "\n\n"
            
            return full_text
        except Exception as e:
            logger.warning(f"Erro ao carregar base de conhecimento: {e}")
            return ""
    
    def _update_performance_metrics(self, start_time: datetime, cache_hit: bool = False):
        """Atualiza métricas de performance"""
        response_time = (datetime.now() - start_time).total_seconds()
        
        # Atualizar tempo médio de resposta
        if self.metrics.queries_processed == 0:
            self.metrics.avg_response_time = response_time
        else:
            self.metrics.avg_response_time = (
                (self.metrics.avg_response_time * self.metrics.queries_processed + response_time) /
                (self.metrics.queries_processed + 1)
            )
        
        self.metrics.queries_processed += 1
        
        # Atualizar taxa de cache hit
        if cache_hit:
            cache_hits = int(self.metrics.cache_hit_rate * (self.metrics.queries_processed - 1))
            self.metrics.cache_hit_rate = (cache_hits + 1) / self.metrics.queries_processed
    
    def add_feedback(self, query: str, response: str, rating: int, comments: str = ""):
        """Adiciona feedback ao sistema (se suportado)"""
        try:
            if self.rag_type == "enhanced_cache" and hasattr(self.active_rag, 'add_feedback'):
                self.active_rag.add_feedback(query, response, rating, comments)
            elif self.rag_type == "embedding_semantic" and hasattr(self.active_rag.semantic_search, 'add_feedback'):
                self.active_rag.semantic_search.add_feedback(query, response, rating, comments)
            
            logger.info(f"📝 Feedback adicionado: rating={rating}")
        except Exception as e:
            logger.warning(f"Erro ao adicionar feedback: {e}")
    
    def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas completas do sistema"""
        stats = {
            'rag_manager': {
                'active_type': self.rag_type,
                'has_fallback': self.fallback_rag is not None,
                'initialization_time': self.stats['initialization_time'],
                'queries_served': self.stats['queries_served'],
                'errors_count': self.stats['errors_count']
            },
            'performance_metrics': asdict(self.metrics),
            'cache_stats': {
                'entries': len(self.context_cache),
                'max_size': self.max_cache_size,
                'ttl_seconds': self.cache_ttl,
                'utilization_rate': len(self.context_cache) / self.max_cache_size * 100
            }
        }
        
        # Adicionar estatísticas específicas do sistema ativo
        if self.active_rag:
            try:
                if hasattr(self.active_rag, 'get_statistics'):
                    stats['active_rag_stats'] = self.active_rag.get_statistics()
                elif hasattr(self.active_rag, 'get_stats'):
                    stats['active_rag_stats'] = self.active_rag.get_stats()
            except Exception as e:
                logger.warning(f"Erro ao obter estatísticas do RAG ativo: {e}")
        
        return stats
    
    def clear_cache(self):
        """Limpa cache do gerenciador"""
        self.context_cache.clear()
        
        # Limpar cache dos sistemas subjacentes se disponível
        if hasattr(self.active_rag, 'clear_cache'):
            self.active_rag.clear_cache()
        
        logger.info("🗑️  Cache RAG limpo")
    
    def health_check(self) -> Dict[str, Any]:
        """Verificação de saúde do sistema RAG"""
        health = {
            'status': 'healthy' if self.active_rag else 'degraded',
            'active_rag_type': self.rag_type,
            'features_available': self.metrics.features_enabled,
            'cache_entries': len(self.context_cache),
            'avg_response_time_ms': round(self.metrics.avg_response_time * 1000, 2),
            'total_queries': self.metrics.queries_processed,
            'error_rate': self.stats['errors_count'] / max(1, self.stats['queries_served']) * 100
        }
        
        # Verificar saúde dos componentes
        components = {}
        
        if self.active_rag:
            try:
                if hasattr(self.active_rag, 'is_semantic_available'):
                    components['semantic_search'] = self.active_rag.is_semantic_available()
                elif hasattr(self.active_rag, 'knowledge_base_loaded'):
                    components['knowledge_base'] = self.active_rag.knowledge_base_loaded
                else:
                    components['basic_rag'] = True
            except Exception:
                components['active_rag'] = False
        
        health['components'] = components
        return health
    
    def optimize_for_production(self):
        """Otimizações específicas para produção"""
        # Ajustar TTL do cache para produção
        self.cache_ttl = 7200  # 2 horas
        
        # Aumentar tamanho máximo do cache
        self.max_cache_size = 2000
        
        # Pre-warm cache com queries comuns se disponível
        common_queries = [
            "Como administrar PQT-U?",
            "Qual a dosagem da rifampicina?",
            "Contraindicações do tratamento",
            "Efeitos colaterais da dapsona",
            "Protocolo de dispensação"
        ]
        
        for query in common_queries:
            try:
                self.get_context(query, max_chunks=2, use_cache=True)
            except Exception:
                continue
        
        logger.info("🚀 Otimizações de produção aplicadas")

# Instância global otimizada
_optimized_rag_manager: Optional[OptimizedRAGManager] = None

def get_optimized_rag() -> OptimizedRAGManager:
    """Obtém instância global do RAG Manager otimizado"""
    global _optimized_rag_manager
    
    if _optimized_rag_manager is None:
        _optimized_rag_manager = OptimizedRAGManager()
        
        # Aplicar otimizações de produção se não estivermos em desenvolvimento
        try:
            from app_config import config
            if not getattr(config, 'DEBUG', False):
                _optimized_rag_manager.optimize_for_production()
        except:
            pass
    
    return _optimized_rag_manager

# Interface simplificada para compatibilidade
def get_optimized_context(query: str, max_chunks: int = 3, persona: Optional[str] = None) -> str:
    """Interface principal para obter contexto otimizado"""
    return get_optimized_rag().get_context(query, max_chunks, persona)

def get_rag_health() -> Dict[str, Any]:
    """Verificação de saúde do RAG"""
    return get_optimized_rag().health_check()

def get_rag_comprehensive_stats() -> Dict[str, Any]:
    """Estatísticas completas do RAG"""
    return get_optimized_rag().get_comprehensive_stats()

__all__ = [
    'OptimizedRAGManager',
    'get_optimized_rag', 
    'get_optimized_context',
    'get_rag_health',
    'get_rag_comprehensive_stats'
]