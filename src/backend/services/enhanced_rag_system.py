# -*- coding: utf-8 -*-
"""
Sistema RAG Aprimorado com Chunking Inteligente
Engenheiro de Backend Sênior especializado em APIs Médicas

Desenvolvido por: Engenheiro de Backend Sênior
Data: 2025-01-27
Versão: 1.0
"""

import re
import json
import hashlib
import time
from typing import List, Dict, Tuple, Optional
from pathlib import Path
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class EnhancedRAGSystem:
    """
    Sistema RAG otimizado para documentos médicos com:
    - Chunking inteligente por seções da tese
    - Cache de respostas frequentes
    - Retrieval otimizado para contexto
    - Feedback de qualidade
    """
    
    def __init__(self, knowledge_base_path: str = "../../data/knowledge_base/"):
        self.knowledge_base_path = knowledge_base_path
        self.chunks = []
        self.chunk_index = {}
        self.response_cache = {}
        self.feedback_data = defaultdict(list)
        
        # Configurações de chunking
        self.chunk_config = {
            "max_chunk_size": 500,  # palavras
            "overlap_size": 50,     # palavras de sobreposição
            "section_aware": True,  # respeitar divisões de seção
            "preserve_context": True # manter contexto importante
        }
        
        # Cache configuration
        self.cache_config = {
            "max_cache_size": 1000,
            "ttl_hours": 24,
            "similarity_threshold": 0.85
        }
        
        # Initialize
        self._load_and_process_documents()
        self._build_chunk_index()
    
    def _load_and_process_documents(self):
        """Carrega e processa documentos da base de conhecimento"""
        try:
            # Carregar documento principal
            main_doc_path = Path(self.knowledge_base_path) / "Roteiro de Dsispensação - Hanseníase.md"
            if main_doc_path.exists():
                with open(main_doc_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                self._process_main_document(content)
            
            logger.info(f"Processados {len(self.chunks)} chunks da base de conhecimento")
            
        except Exception as e:
            logger.error(f"Erro ao carregar documentos: {e}")
            # Fallback para conteúdo básico
            self._create_fallback_chunks()
    
    def _process_main_document(self, content: str):
        """Processa documento principal com chunking inteligente"""
        # Dividir por seções da tese
        sections = self._extract_sections(content)
        
        for section_title, section_content in sections.items():
            # Chunking inteligente por seção
            section_chunks = self._create_intelligent_chunks(
                section_content, 
                section_title
            )
            
            for chunk in section_chunks:
                chunk_data = {
                    "content": chunk,
                    "section": section_title,
                    "chunk_id": self._generate_chunk_id(chunk),
                    "word_count": len(chunk.split()),
                    "topics": self._extract_topics(chunk),
                    "importance_score": self._calculate_importance(chunk, section_title)
                }
                self.chunks.append(chunk_data)
    
    def _extract_sections(self, content: str) -> Dict[str, str]:
        """Extrai seções da tese baseado em padrões hierárquicos"""
        sections = {}
        current_section = "introduction"
        current_content = []
        
        lines = content.split('\n')
        
        for line in lines:
            # Detectar cabeçalhos de seção
            if re.match(r'^#+\s+', line) or re.match(r'^\d+\.?\s+', line):
                # Salvar seção anterior
                if current_content:
                    sections[current_section] = '\n'.join(current_content)
                
                # Iniciar nova seção
                current_section = self._normalize_section_title(line)
                current_content = [line]
            else:
                current_content.append(line)
        
        # Salvar última seção
        if current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _normalize_section_title(self, title: str) -> str:
        """Normaliza títulos de seção"""
        # Remover marcadores de markdown e numeração
        title = re.sub(r'^#+\s*', '', title)
        title = re.sub(r'^\d+\.?\s*', '', title)
        
        # Normalizar para chave
        title = title.lower().strip()
        title = re.sub(r'[^\w\s]', '', title)
        title = re.sub(r'\s+', '_', title)
        
        return title[:50]  # Limitar tamanho
    
    def _create_intelligent_chunks(self, content: str, section: str) -> List[str]:
        """Cria chunks inteligentes respeitando contexto médico"""
        words = content.split()
        chunks = []
        
        if len(words) <= self.chunk_config["max_chunk_size"]:
            # Seção pequena - manter inteira
            return [content]
        
        # Dividir por parágrafos primeiro
        paragraphs = content.split('\n\n')
        current_chunk = []
        current_word_count = 0
        
        for paragraph in paragraphs:
            paragraph_words = paragraph.split()
            
            # Se parágrafo cabe no chunk atual
            if current_word_count + len(paragraph_words) <= self.chunk_config["max_chunk_size"]:
                current_chunk.append(paragraph)
                current_word_count += len(paragraph_words)
            else:
                # Finalizar chunk atual se não vazio
                if current_chunk:
                    chunk_text = '\n\n'.join(current_chunk)
                    chunks.append(chunk_text)
                
                # Se parágrafo é muito grande, dividir
                if len(paragraph_words) > self.chunk_config["max_chunk_size"]:
                    sub_chunks = self._split_large_paragraph(paragraph)
                    chunks.extend(sub_chunks)
                    current_chunk = []
                    current_word_count = 0
                else:
                    # Iniciar novo chunk
                    current_chunk = [paragraph]
                    current_word_count = len(paragraph_words)
        
        # Adicionar último chunk
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            chunks.append(chunk_text)
        
        # Adicionar sobreposição entre chunks
        return self._add_chunk_overlap(chunks)
    
    def _split_large_paragraph(self, paragraph: str) -> List[str]:
        """Divide parágrafos grandes preservando contexto médico"""
        sentences = re.split(r'[.!?]+', paragraph)
        chunks = []
        current_chunk = []
        current_word_count = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            sentence_words = len(sentence.split())
            
            if current_word_count + sentence_words <= self.chunk_config["max_chunk_size"]:
                current_chunk.append(sentence)
                current_word_count += sentence_words
            else:
                if current_chunk:
                    chunks.append('. '.join(current_chunk) + '.')
                current_chunk = [sentence]
                current_word_count = sentence_words
        
        if current_chunk:
            chunks.append('. '.join(current_chunk) + '.')
        
        return chunks
    
    def _add_chunk_overlap(self, chunks: List[str]) -> List[str]:
        """Adiciona sobreposição entre chunks para manter contexto"""
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = [chunks[0]]  # Primeiro chunk sem modificação
        
        for i in range(1, len(chunks)):
            prev_chunk = chunks[i-1]
            current_chunk = chunks[i]
            
            # Pegar últimas palavras do chunk anterior
            prev_words = prev_chunk.split()
            overlap_words = prev_words[-self.chunk_config["overlap_size"]:]
            
            # Adicionar ao início do chunk atual
            overlapped_chunk = ' '.join(overlap_words) + ' ' + current_chunk
            overlapped_chunks.append(overlapped_chunk)
        
        return overlapped_chunks
    
    def _extract_topics(self, chunk: str) -> List[str]:
        """Extrai tópicos principais do chunk"""
        # Palavras-chave médicas importantes
        medical_keywords = [
            'rifampicina', 'clofazimina', 'dapsona', 'pqt-u', 'poliquimioterapia',
            'hanseniase', 'dosagem', 'dose', 'administracao', 'supervisionada',
            'efeito adverso', 'contraindicacao', 'interacao', 'gravidez',
            'pediatrico', 'dispensacao', 'farmacia', 'monitoramento'
        ]
        
        chunk_lower = chunk.lower()
        found_topics = []
        
        for keyword in medical_keywords:
            if keyword in chunk_lower:
                found_topics.append(keyword)
        
        return found_topics
    
    def _calculate_importance(self, chunk: str, section: str) -> float:
        """Calcula score de importância do chunk"""
        score = 0.5  # Score base
        
        # Boost por seção importante
        important_sections = [
            'medicamentos', 'dosagem', 'protocolos', 'dispensacao',
            'farmácovigilância', 'efeitos_adversos'
        ]
        
        if any(imp_section in section.lower() for imp_section in important_sections):
            score += 0.3
        
        # Boost por presença de informações críticas
        critical_patterns = [
            r'\d+\s*mg',  # Dosagens
            r'contraindicação',
            r'efeito adverso',
            r'dose supervisionada',
            r'protocolo'
        ]
        
        for pattern in critical_patterns:
            if re.search(pattern, chunk, re.IGNORECASE):
                score += 0.1
        
        return min(score, 1.0)  # Máximo 1.0
    
    def _generate_chunk_id(self, chunk: str) -> str:
        """Gera ID único para o chunk"""
        return hashlib.md5(chunk.encode()).hexdigest()[:12]
    
    def _build_chunk_index(self):
        """Constrói índice para busca rápida"""
        self.chunk_index = {
            'by_topic': defaultdict(list),
            'by_section': defaultdict(list),
            'by_importance': sorted(self.chunks, key=lambda x: x['importance_score'], reverse=True)
        }
        
        for i, chunk in enumerate(self.chunks):
            # Indexar por tópicos
            for topic in chunk['topics']:
                self.chunk_index['by_topic'][topic].append(i)
            
            # Indexar por seção
            self.chunk_index['by_section'][chunk['section']].append(i)
    
    def retrieve_relevant_chunks(self, query: str, max_chunks: int = 3) -> List[Dict]:
        """Recupera chunks mais relevantes para a query"""
        query_lower = query.lower()
        chunk_scores = []
        
        for i, chunk in enumerate(self.chunks):
            score = self._calculate_relevance_score(chunk, query_lower)
            if score > 0:
                chunk_scores.append((i, score))
        
        # Ordenar por relevância
        chunk_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Retornar top chunks
        relevant_chunks = []
        for i, score in chunk_scores[:max_chunks]:
            chunk_data = self.chunks[i].copy()
            chunk_data['relevance_score'] = score
            relevant_chunks.append(chunk_data)
        
        return relevant_chunks
    
    def _calculate_relevance_score(self, chunk: Dict, query: str) -> float:
        """Calcula score de relevância chunk-query"""
        content = chunk['content'].lower()
        score = 0.0
        
        # Score por palavras da query presentes
        query_words = set(re.findall(r'\w+', query))
        content_words = set(re.findall(r'\w+', content))
        
        common_words = query_words.intersection(content_words)
        if query_words:
            word_match_score = len(common_words) / len(query_words)
            score += word_match_score * 0.6
        
        # Boost por tópicos importantes
        for topic in chunk['topics']:
            if topic in query:
                score += 0.2
        
        # Boost por importância do chunk
        score += chunk['importance_score'] * 0.2
        
        return score
    
    def get_cached_response(self, query: str) -> Optional[str]:
        """Verifica se existe resposta em cache para query similar"""
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
        
        # Busca por hash exato
        if query_hash in self.response_cache:
            cache_entry = self.response_cache[query_hash]
            if self._is_cache_valid(cache_entry):
                logger.info(f"Cache hit para query: {query[:50]}...")
                return cache_entry['response']
        
        # Busca por similaridade
        return self._find_similar_cached_response(query)
    
    def cache_response(self, query: str, response: str, confidence: float):
        """Armazena resposta no cache"""
        if len(self.response_cache) >= self.cache_config['max_cache_size']:
            self._cleanup_cache()
        
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
        self.response_cache[query_hash] = {
            'query': query,
            'response': response,
            'confidence': confidence,
            'timestamp': time.time(),
            'access_count': 1
        }
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Verifica se entrada do cache ainda é válida"""
        ttl_seconds = self.cache_config['ttl_hours'] * 3600
        return (time.time() - cache_entry['timestamp']) < ttl_seconds
    
    def _find_similar_cached_response(self, query: str) -> Optional[str]:
        """Busca resposta similar no cache"""
        query_words = set(re.findall(r'\w+', query.lower()))
        
        for cache_entry in self.response_cache.values():
            if not self._is_cache_valid(cache_entry):
                continue
            
            cached_query_words = set(re.findall(r'\w+', cache_entry['query'].lower()))
            
            if query_words and cached_query_words:
                similarity = len(query_words.intersection(cached_query_words)) / len(query_words.union(cached_query_words))
                
                if similarity >= self.cache_config['similarity_threshold']:
                    cache_entry['access_count'] += 1
                    logger.info(f"Cache hit por similaridade ({similarity:.2f}): {query[:50]}...")
                    return cache_entry['response']
        
        return None
    
    def _cleanup_cache(self):
        """Remove entradas antigas e menos usadas do cache"""
        # Remover entradas expiradas
        current_time = time.time()
        ttl_seconds = self.cache_config['ttl_hours'] * 3600
        
        expired_keys = [
            key for key, entry in self.response_cache.items()
            if (current_time - entry['timestamp']) > ttl_seconds
        ]
        
        for key in expired_keys:
            del self.response_cache[key]
        
        # Se ainda excede limite, remover menos usadas
        if len(self.response_cache) >= self.cache_config['max_cache_size']:
            sorted_entries = sorted(
                self.response_cache.items(),
                key=lambda x: (x[1]['access_count'], x[1]['timestamp'])
            )
            
            # Remover 20% das entradas menos usadas
            remove_count = len(sorted_entries) // 5
            for key, _ in sorted_entries[:remove_count]:
                del self.response_cache[key]
    
    def add_feedback(self, query: str, response: str, rating: int, comments: str = ""):
        """Adiciona feedback sobre qualidade da resposta"""
        feedback_entry = {
            'query': query,
            'response': response,
            'rating': rating,  # 1-5
            'comments': comments,
            'timestamp': time.time()
        }
        
        self.feedback_data[rating].append(feedback_entry)
        logger.info(f"Feedback recebido - Rating: {rating}, Query: {query[:50]}...")
    
    def get_feedback_stats(self) -> Dict:
        """Retorna estatísticas de feedback"""
        total_feedback = sum(len(ratings) for ratings in self.feedback_data.values())
        
        if total_feedback == 0:
            return {"message": "Nenhum feedback recebido ainda"}
        
        rating_distribution = {
            rating: len(feedback_list) 
            for rating, feedback_list in self.feedback_data.items()
        }
        
        avg_rating = sum(
            rating * count for rating, count in rating_distribution.items()
        ) / total_feedback
        
        return {
            "total_feedback": total_feedback,
            "average_rating": avg_rating,
            "rating_distribution": rating_distribution,
            "cache_stats": {
                "cached_responses": len(self.response_cache),
                "max_cache_size": self.cache_config['max_cache_size']
            }
        }
    
    def _create_fallback_chunks(self):
        """Cria chunks básicos como fallback"""
        fallback_content = [
            {
                "content": "Rifampicina 600mg mensal supervisionada para adultos acima de 50kg no esquema PQT-U.",
                "section": "medicamentos_rifampicina",
                "topics": ["rifampicina", "dosagem", "adultos"],
                "importance_score": 0.9
            },
            {
                "content": "Clofazimina pode causar hiperpigmentação cutânea temporária durante o tratamento.",
                "section": "efeitos_adversos_clofazimina", 
                "topics": ["clofazimina", "efeito adverso", "hiperpigmentacao"],
                "importance_score": 0.8
            }
        ]
        
        for content in fallback_content:
            content["chunk_id"] = self._generate_chunk_id(content["content"])
            content["word_count"] = len(content["content"].split())
            self.chunks.append(content)

# Instância global
enhanced_rag = EnhancedRAGSystem()

def get_enhanced_context(query: str, max_chunks: int = 3) -> str:
    """Função principal para obter contexto otimizado"""
    # Verificar cache primeiro
    cached_response = enhanced_rag.get_cached_response(query)
    if cached_response:
        return cached_response
    
    # Recuperar chunks relevantes
    relevant_chunks = enhanced_rag.retrieve_relevant_chunks(query, max_chunks)
    
    if not relevant_chunks:
        return "Contexto não encontrado na base de conhecimento."
    
    # Combinar contexto dos chunks
    context_parts = []
    for chunk in relevant_chunks:
        context_parts.append(f"[Seção: {chunk['section']}] {chunk['content']}")
    
    combined_context = "\n\n".join(context_parts)
    return combined_context

def cache_rag_response(query: str, response: str, confidence: float):
    """Cache de resposta RAG"""
    enhanced_rag.cache_response(query, response, confidence)

def add_rag_feedback(query: str, response: str, rating: int, comments: str = ""):
    """Adicionar feedback RAG"""
    enhanced_rag.add_feedback(query, response, rating, comments)

def get_rag_stats() -> Dict:
    """Obter estatísticas RAG"""
    return enhanced_rag.get_feedback_stats()

# Testes do sistema
if __name__ == "__main__":
    print("TESTANDO SISTEMA RAG APRIMORADO...")
    
    test_queries = [
        "Qual a dose de rifampicina?",
        "Efeitos adversos da clofazimina",
        "Como fazer dispensação PQT-U?",
        "Contraindicações da dapsona"
    ]
    
    for query in test_queries:
        print(f"\n--- Query: {query} ---")
        
        context = get_enhanced_context(query)
        print(f"Contexto encontrado: {len(context)} caracteres")
        
        chunks = enhanced_rag.retrieve_relevant_chunks(query, 2)
        print(f"Chunks relevantes: {len(chunks)}")
        
        for chunk in chunks:
            print(f"- Seção: {chunk['section']}, Score: {chunk['relevance_score']:.2f}")
    
    print(f"\nEstatísticas: {get_rag_stats()}")