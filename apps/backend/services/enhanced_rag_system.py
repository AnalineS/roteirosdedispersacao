"""
Sistema RAG Avançado - Retrieval Augmented Generation com cache e feedback
"""

from typing import Dict, List, Optional
from datetime import datetime
from collections import defaultdict
import json
import re


class EnhancedRAGSystem:
    """Sistema RAG avançado com cache e feedback"""
    
    def __init__(self):
        self.response_cache = {}
        self.feedback_data = []
        self.usage_stats = defaultdict(int)
        
    def cache_response(self, question: str, response: str, confidence: float):
        """Armazena resposta no cache"""
        cache_key = self._generate_cache_key(question)
        self.response_cache[cache_key] = {
            'response': response,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat(),
            'usage_count': 0
        }
        self.usage_stats['responses_cached'] += 1
    
    def get_cached_response(self, question: str) -> Optional[Dict]:
        """Busca resposta no cache"""
        cache_key = self._generate_cache_key(question)
        if cache_key in self.response_cache:
            cached = self.response_cache[cache_key]
            cached['usage_count'] += 1
            self.usage_stats['cache_hits'] += 1
            return cached
        self.usage_stats['cache_misses'] += 1
        return None
    
    def add_feedback(self, question: str, response: str, rating: int, comments: str = ''):
        """Adiciona feedback sobre qualidade da resposta"""
        feedback_entry = {
            'question': question,
            'response': response,
            'rating': rating,
            'comments': comments,
            'timestamp': datetime.now().isoformat()
        }
        self.feedback_data.append(feedback_entry)
        self.usage_stats['feedback_received'] += 1
    
    def get_enhanced_context(self, question: str, full_text: str, max_length: int = 3000) -> str:
        """Busca contexto melhorado usando técnicas avançadas"""
        # Dividir em parágrafos
        paragraphs = full_text.split('\n\n')
        question_words = set(re.findall(r'\w+', question.lower()))
        
        # Buscar parágrafos relevantes
        relevant_paragraphs = []
        for paragraph in paragraphs:
            if len(paragraph.strip()) < 50:
                continue
                
            paragraph_words = set(re.findall(r'\w+', paragraph.lower()))
            common_words = question_words.intersection(paragraph_words)
            
            if common_words:
                score = len(common_words) / len(question_words)
                relevant_paragraphs.append((paragraph, score))
        
        # Ordenar por relevância
        relevant_paragraphs.sort(key=lambda x: x[1], reverse=True)
        
        # Construir contexto
        context = ""
        for paragraph, score in relevant_paragraphs[:5]:
            context += paragraph + "\n\n"
            if len(context) > max_length:
                break
        
        return context[:max_length] if context else full_text[:max_length]
    
    def get_stats(self) -> Dict:
        """Retorna estatísticas do sistema"""
        total_requests = self.usage_stats['cache_hits'] + self.usage_stats['cache_misses']
        hit_rate = (self.usage_stats['cache_hits'] / total_requests * 100) if total_requests > 0 else 0
        
        avg_rating = 0
        if self.feedback_data:
            avg_rating = sum(f['rating'] for f in self.feedback_data) / len(self.feedback_data)
        
        return {
            'cache_stats': {
                'total_cached_responses': len(self.response_cache),
                'cache_hits': self.usage_stats['cache_hits'],
                'cache_misses': self.usage_stats['cache_misses'], 
                'hit_rate_percent': round(hit_rate, 1)
            },
            'feedback_stats': {
                'total_feedback': len(self.feedback_data),
                'average_rating': round(avg_rating, 1),
                'rating_distribution': self._get_rating_distribution()
            },
            'system_stats': dict(self.usage_stats)
        }
    
    def _generate_cache_key(self, question: str) -> str:
        """Gera chave única para cache baseada na pergunta"""
        # Normalizar pergunta
        normalized = re.sub(r'[^\w\s]', '', question.lower())
        normalized = ' '.join(normalized.split())
        return normalized
    
    def _get_rating_distribution(self) -> Dict[int, int]:
        """Calcula distribuição de ratings"""
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for feedback in self.feedback_data:
            rating = feedback['rating']
            if 1 <= rating <= 5:
                distribution[rating] += 1
        return distribution


# Instância global do sistema RAG
rag_system = EnhancedRAGSystem()


def get_enhanced_context(question: str, full_text: str, max_length: int = 3000) -> str:
    """Interface para busca de contexto melhorado"""
    return rag_system.get_enhanced_context(question, full_text, max_length)


def cache_rag_response(question: str, response: str, confidence: float):
    """Interface para cache de resposta"""
    rag_system.cache_response(question, response, confidence)


def add_rag_feedback(question: str, response: str, rating: int, comments: str = ''):
    """Interface para adicionar feedback"""
    rag_system.add_feedback(question, response, rating, comments)


def get_rag_stats() -> Dict:
    """Interface para obter estatísticas"""
    return rag_system.get_stats()