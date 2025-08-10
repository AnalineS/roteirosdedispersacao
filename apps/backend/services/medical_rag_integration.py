# -*- coding: utf-8 -*-
"""
Integração do Sistema RAG com Chunking Médico
Adapta o RAG existente para usar chunking médico inteligente
"""

import os
import json
from typing import List, Dict, Tuple, Optional
from dataclasses import asdict
import logging

# Import sistema de chunking médico
from services.medical_chunking import medical_chunker, MedicalChunk, chunk_medical_document

# Import RAG existente
try:
    from services.simple_rag import simple_tokenize, calculate_similarity
    SIMPLE_RAG_AVAILABLE = True
except ImportError:
    SIMPLE_RAG_AVAILABLE = False

# Configurações
from app_config import config

logger = logging.getLogger(__name__)

class MedicalRAGSystem:
    """Sistema RAG especializado para conteúdo médico"""
    
    def __init__(self):
        """Inicializa o sistema RAG médico"""
        self.medical_chunks = []
        self.knowledge_base_loaded = False
        self.chunk_stats = {
            'total_chunks': 0,
            'critical_chunks': 0,
            'categories': {}
        }
        
        # Carregar base de conhecimento automaticamente
        self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Carrega e processa a base de conhecimento médico"""
        try:
            logger.info("🧠 Carregando base de conhecimento médica...")
            
            # Caminhos para os arquivos de conhecimento
            knowledge_paths = [
                "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/Roteiro de Dsispensação - Hanseníase.md",
                "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/roteiro_hanseniase_basico.md"
            ]
            
            all_chunks = []
            
            for path in knowledge_paths:
                if os.path.exists(path):
                    try:
                        with open(path, 'r', encoding='utf-8') as f:
                            document = f.read()
                        
                        # Aplicar chunking médico
                        doc_name = os.path.basename(path)
                        chunks = chunk_medical_document(document, doc_name)
                        all_chunks.extend(chunks)
                        
                        logger.info(f"✓ {doc_name}: {len(chunks)} chunks processados")
                        
                    except Exception as e:
                        logger.warning(f"Erro ao carregar {path}: {e}")
                else:
                    logger.warning(f"Arquivo não encontrado: {path}")
            
            # Também carregar dados estruturados se disponíveis
            structured_chunks = self._load_structured_data()
            all_chunks.extend(structured_chunks)
            
            # Ordenar chunks por prioridade
            self.medical_chunks = sorted(all_chunks, key=lambda x: x.priority, reverse=True)
            
            # Atualizar estatísticas
            self._update_stats()
            
            self.knowledge_base_loaded = True
            logger.info(f"✅ Base de conhecimento carregada: {len(self.medical_chunks)} chunks médicos")
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar base de conhecimento: {e}")
            self.knowledge_base_loaded = False
    
    def _load_structured_data(self) -> List[MedicalChunk]:
        """Carrega dados estruturados JSON"""
        structured_chunks = []
        
        structured_paths = [
            "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/structured/dosing_protocols.json",
            "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/structured/clinical_taxonomy.json",
            "C:/Users/Ana/Meu Drive/Site roteiro de dispensação/data/structured/pharmacovigilance_guidelines.json"
        ]
        
        for path in structured_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Converter JSON para texto e processar
                    text_content = self._json_to_text(data)
                    doc_name = os.path.basename(path)
                    chunks = medical_chunker.chunk_by_medical_semantics(text_content, f"structured_{doc_name}")
                    structured_chunks.extend(chunks)
                    
                    logger.info(f"✓ Dados estruturados {doc_name}: {len(chunks)} chunks")
                    
                except Exception as e:
                    logger.warning(f"Erro ao processar {path}: {e}")
        
        return structured_chunks
    
    def _json_to_text(self, data: Dict) -> str:
        """Converte estrutura JSON para texto legível"""
        def extract_text(obj, prefix=""):
            text_parts = []
            
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, (dict, list)):
                        text_parts.append(extract_text(value, f"{prefix}{key}: "))
                    else:
                        text_parts.append(f"{prefix}{key}: {str(value)}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    text_parts.append(extract_text(item, f"{prefix}[{i}] "))
            else:
                text_parts.append(f"{prefix}{str(obj)}")
            
            return "\n".join(text_parts)
        
        return extract_text(data)
    
    def _update_stats(self):
        """Atualiza estatísticas dos chunks"""
        self.chunk_stats = {
            'total_chunks': len(self.medical_chunks),
            'critical_chunks': sum(1 for c in self.medical_chunks if c.priority >= 0.8),
            'categories': {}
        }
        
        for chunk in self.medical_chunks:
            category = chunk.category
            self.chunk_stats['categories'][category] = self.chunk_stats['categories'].get(category, 0) + 1
    
    def get_relevant_context(self, question: str, max_chunks: int = 3) -> str:
        """
        Busca contexto relevante baseado na pergunta
        Prioriza chunks críticos e relevantes
        """
        if not self.knowledge_base_loaded or not self.medical_chunks:
            logger.warning("Base de conhecimento não carregada")
            return ""
        
        # Tokenizar pergunta
        if SIMPLE_RAG_AVAILABLE:
            query_tokens = simple_tokenize(question)
        else:
            query_tokens = question.lower().split()
        
        # Calcular relevância para cada chunk
        chunk_scores = []
        
        for chunk in self.medical_chunks:
            if SIMPLE_RAG_AVAILABLE:
                chunk_tokens = simple_tokenize(chunk.content)
                similarity = calculate_similarity(query_tokens, chunk_tokens)
            else:
                # Fallback simples
                similarity = self._simple_similarity(question.lower(), chunk.content.lower())
            
            # Score final combina similaridade e prioridade
            final_score = (similarity * 0.7) + (chunk.priority * 0.3)
            
            chunk_scores.append((chunk, final_score))
        
        # Ordenar por score e selecionar os melhores
        chunk_scores.sort(key=lambda x: x[1], reverse=True)
        selected_chunks = chunk_scores[:max_chunks]
        
        # Construir contexto
        context_parts = []
        for chunk, score in selected_chunks:
            # Adicionar metadados do chunk crítico
            metadata = ""
            if chunk.contains_dosage:
                metadata += "[DOSAGEM] "
            if chunk.contains_contraindication:
                metadata += "[CONTRAINDICAÇÃO] "
            if chunk.contains_interaction:
                metadata += "[INTERAÇÃO] "
            
            context_parts.append(f"{metadata}{chunk.content}")
        
        try:
            context = "\n\n---\n\n".join(context_parts)
            
            logger.info(f"Contexto RAG: {len(selected_chunks)} chunks, {len(context)} chars")
            if selected_chunks:
                logger.debug(f"Chunks selecionados: {[c[0].category for c, _ in selected_chunks]}")
            
            # Debug: verificar se context é string
            logger.debug(f"Context type: {type(context)}")
            logger.debug(f"Context preview: {context[:100]}...")
            
            return context
        except Exception as e:
            logger.error(f"Erro ao construir contexto RAG: {e}")
            logger.error(f"context_parts type: {type(context_parts)}")
            logger.error(f"context_parts content: {context_parts[:2] if context_parts else []}")
            raise
    
    def _simple_similarity(self, query: str, text: str) -> float:
        """Cálculo simples de similaridade sem dependências"""
        query_words = set(query.split())
        text_words = set(text.split())
        
        if not query_words or not text_words:
            return 0.0
        
        intersection = len(query_words.intersection(text_words))
        return intersection / len(query_words)
    
    def search_by_category(self, category: str, question: str, max_chunks: int = 2) -> List[MedicalChunk]:
        """Busca chunks específicos de uma categoria"""
        category_chunks = [c for c in self.medical_chunks if c.category == category]
        
        if not category_chunks:
            return []
        
        # Aplicar busca por relevância dentro da categoria
        query_tokens = simple_tokenize(question) if SIMPLE_RAG_AVAILABLE else question.split()
        
        chunk_scores = []
        for chunk in category_chunks:
            if SIMPLE_RAG_AVAILABLE:
                chunk_tokens = simple_tokenize(chunk.content)
                similarity = calculate_similarity(query_tokens, chunk_tokens)
            else:
                similarity = self._simple_similarity(question.lower(), chunk.content.lower())
            
            chunk_scores.append((chunk, similarity))
        
        # Retornar os mais relevantes
        chunk_scores.sort(key=lambda x: x[1], reverse=True)
        return [chunk for chunk, _ in chunk_scores[:max_chunks]]
    
    def get_critical_chunks(self, max_chunks: int = 5) -> List[MedicalChunk]:
        """Retorna chunks mais críticos"""
        critical = [c for c in self.medical_chunks if c.priority >= 0.8]
        return critical[:max_chunks]
    
    def get_stats(self) -> Dict:
        """Retorna estatísticas do sistema"""
        return {
            'knowledge_base_loaded': self.knowledge_base_loaded,
            'chunk_stats': self.chunk_stats,
            'features': {
                'medical_chunking': True,
                'priority_weighting': True,
                'semantic_detection': True,
                'structured_data': True
            }
        }
    
    def reload_knowledge_base(self):
        """Recarrega a base de conhecimento"""
        logger.info("🔄 Recarregando base de conhecimento...")
        self.medical_chunks = []
        self.knowledge_base_loaded = False
        self._load_knowledge_base()

# Instância global
medical_rag_system = MedicalRAGSystem()

# Funções de conveniência para compatibilidade com o RAG existente
def get_medical_context(question: str, max_chunks: int = 3) -> str:
    """Função compatível com get_enhanced_context"""
    return medical_rag_system.get_relevant_context(question, max_chunks)

def get_medical_stats() -> Dict:
    """Retorna estatísticas do sistema RAG médico"""
    return medical_rag_system.get_stats()

def reload_medical_knowledge():
    """Recarrega base de conhecimento médica"""
    medical_rag_system.reload_knowledge_base()

__all__ = [
    'MedicalRAGSystem',
    'medical_rag_system',
    'get_medical_context',
    'get_medical_stats',
    'reload_medical_knowledge'
]