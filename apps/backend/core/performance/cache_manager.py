"""
Cache Manager para otimização de performance
Objetivo: Reduzir tempo de resposta para <1.5s

Data: 27 de Janeiro de 2025
Fase: Otimizações de Usabilidade
"""

import time
import json
import hashlib
from datetime import datetime, timedelta
from collections import OrderedDict
import threading
import logging

logger = logging.getLogger(__name__)

class PerformanceCache:
    """Sistema de cache otimizado para respostas rápidas"""
    
    def __init__(self, max_size=1000, ttl_minutes=60):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = timedelta(minutes=ttl_minutes)
        self.lock = threading.Lock()
        self.hits = 0
        self.misses = 0
        
        # Cache especial para perguntas frequentes
        self.frequent_questions = OrderedDict()
        self.question_count = {}
        
        # Thread de limpeza
        self.cleanup_thread = threading.Thread(target=self._periodic_cleanup, daemon=True)
        self.cleanup_thread.start()
    
    def _generate_key(self, question: str, persona: str) -> str:
        """Gera chave única para cache"""
        content = f"{question.lower().strip()}:{persona}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, question: str, persona: str) -> dict:
        """Busca resposta no cache"""
        key = self._generate_key(question, persona)
        
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                
                # Verificar TTL
                if datetime.now() - entry['timestamp'] < self.ttl:
                    # Move para final (LRU)
                    self.cache.move_to_end(key)
                    self.hits += 1
                    
                    # Atualizar contador de frequência
                    self._update_frequency(question, persona)
                    
                    logger.info(f"Cache HIT: {self.hits}/{self.hits+self.misses} ({self.hit_rate:.1f}%)")
                    return entry['response']
                else:
                    # Expirado
                    del self.cache[key]
            
            self.misses += 1
            return None
    
    def set(self, question: str, persona: str, response: dict):
        """Armazena resposta no cache"""
        key = self._generate_key(question, persona)
        
        with self.lock:
            # Remover mais antigo se necessário
            if len(self.cache) >= self.max_size:
                self.cache.popitem(last=False)
            
            self.cache[key] = {
                'response': response,
                'timestamp': datetime.now(),
                'question': question,
                'persona': persona
            }
            
            # Atualizar frequência
            self._update_frequency(question, persona)
    
    def _update_frequency(self, question: str, persona: str):
        """Atualiza contadores de frequência"""
        freq_key = f"{question.lower()[:50]}:{persona}"
        self.question_count[freq_key] = self.question_count.get(freq_key, 0) + 1
        
        # Se pergunta é muito frequente, cache especial
        if self.question_count[freq_key] >= 3:
            if freq_key not in self.frequent_questions:
                self.frequent_questions[freq_key] = {
                    'question': question,
                    'persona': persona,
                    'count': self.question_count[freq_key]
                }
                logger.info(f"Pergunta frequente detectada: {freq_key[:30]}...")
    
    def get_top_questions(self, limit=10):
        """Retorna perguntas mais frequentes"""
        sorted_questions = sorted(
            self.question_count.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_questions[:limit]
    
    @property
    def hit_rate(self):
        """Taxa de acerto do cache"""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0
    
    def _periodic_cleanup(self):
        """Limpeza periódica de entradas expiradas"""
        while True:
            time.sleep(300)  # 5 minutos
            
            with self.lock:
                now = datetime.now()
                expired_keys = []
                
                for key, entry in self.cache.items():
                    if now - entry['timestamp'] >= self.ttl:
                        expired_keys.append(key)
                
                for key in expired_keys:
                    del self.cache[key]
                
                if expired_keys:
                    logger.info(f"Cache cleanup: {len(expired_keys)} entradas expiradas removidas")
    
    def warm_up(self, common_questions):
        """Aquece o cache com perguntas comuns"""
        logger.info("Aquecendo cache com perguntas comuns...")
        
        for item in common_questions:
            question = item['question']
            persona = item['persona']
            response = item.get('response')
            
            if response:
                self.set(question, persona, response)
        
        logger.info(f"Cache aquecido com {len(common_questions)} perguntas")
    
    def get_stats(self):
        """Retorna estatísticas do cache"""
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': f"{self.hit_rate:.1f}%",
            'ttl_minutes': self.ttl.total_seconds() / 60,
            'top_questions': self.get_top_questions(5),
            'frequent_questions_count': len(self.frequent_questions)
        }

# Cache global
performance_cache = PerformanceCache(max_size=2000, ttl_minutes=120)

# Perguntas comuns para aquecimento
COMMON_QUESTIONS = [
    {
        'question': 'O que é hanseníase?',
        'persona': 'dr_gasnelio',
        'response': {
            'answer': 'A hanseníase é uma doença infecciosa crônica causada pelo Mycobacterium leprae...',
            'cached': True
        }
    },
    {
        'question': 'O que é hanseníase?',
        'persona': 'ga',
        'response': {
            'answer': 'Oi! A hanseníase é uma doença de pele que tem tratamento...',
            'cached': True
        }
    },
    {
        'question': 'Qual a dose de rifampicina?',
        'persona': 'dr_gasnelio',
        'response': {
            'answer': 'A dose supervisionada de rifampicina para adultos...',
            'cached': True
        }
    },
    {
        'question': 'Como tomar os remédios?',
        'persona': 'ga',
        'response': {
            'answer': 'Oi! Vou te explicar direitinho como tomar os remédios...',
            'cached': True
        }
    }
]

# Aquecer cache na inicialização
performance_cache.warm_up(COMMON_QUESTIONS)