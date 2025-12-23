# -*- coding: utf-8 -*-
"""
Cache Manager para otimização de performance
Objetivo: Reduzir tempo de resposta para <1.5s

Data: 27 de Janeiro de 2025
Fase: Otimizações de Usabilidade
"""

import time
import hashlib
from datetime import datetime, timedelta
from collections import OrderedDict
import threading
import logging

logger = logging.getLogger(__name__)

class PerformanceCache:
    """Sistema de cache otimizado para respostas rápidas com gestão rigorosa de memória"""

    def __init__(self, max_size=500, ttl_minutes=30, max_memory_mb=25):
        self.cache = OrderedDict()
        self.max_size = max_size  # Reduzido de 1000 para 500
        self.max_memory_mb = max_memory_mb  # Limite de memória em MB
        self.ttl = timedelta(minutes=ttl_minutes)  # Reduzido de 60 para 30 minutos
        self.lock = threading.Lock()
        self.hits = 0
        self.misses = 0

        # Cache especial para perguntas frequentes (limitado)
        self.frequent_questions = OrderedDict()
        self.question_count = {}
        self._max_frequent = 50  # Limite de perguntas frequentes

        # Estatísticas de memória
        self._memory_usage = 0
        self._evictions = 0

        # Thread de limpeza mais agressiva
        self.cleanup_thread = threading.Thread(target=self._periodic_cleanup, daemon=True)
        self.cleanup_thread.start()
    
    def _generate_key(self, question: str, persona: str) -> str:
        """Gera chave única para cache"""
        content = f"{question.lower().strip()}:{persona}"
        # SHA-256 for cache keys (not sensitive data, but using secure hash for consistency)
        return hashlib.sha256(content.encode()).hexdigest()
    
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
        """Armazena resposta no cache com controle rigoroso de memória"""
        key = self._generate_key(question, persona)

        with self.lock:
            # Calcular tamanho do objeto
            import sys
            entry_size = sys.getsizeof(response) + sys.getsizeof(key) + sys.getsizeof(question) + sys.getsizeof(persona)
            entry_size_mb = entry_size / (1024 * 1024)

            # Não cachear objetos muito grandes (>2MB)
            if entry_size_mb > 2:
                logger.warning(f"Cache: Objeto muito grande não cacheado ({entry_size_mb:.1f}MB)")
                return

            # Verificar limite de memória
            if self._memory_usage + entry_size_mb > self.max_memory_mb:
                self._aggressive_eviction()

            # Remover mais antigo se necessário (LRU)
            while len(self.cache) >= self.max_size:
                oldest_key, oldest_entry = self.cache.popitem(last=False)
                self._evictions += 1
                # Atualizar uso de memória
                old_size = sys.getsizeof(oldest_entry) / (1024 * 1024)
                self._memory_usage = max(0, self._memory_usage - old_size)

            # Adicionar nova entrada
            entry = {
                'response': response,
                'timestamp': datetime.now(),
                'question': question,
                'persona': persona,
                'size_mb': entry_size_mb
            }

            self.cache[key] = entry
            self._memory_usage += entry_size_mb

            # Atualizar frequência
            self._update_frequency(question, persona)
    
    def _update_frequency(self, question: str, persona: str):
        """Atualiza contadores de frequência com limite de memória"""
        freq_key = f"{question.lower()[:50]}:{persona}"
        self.question_count[freq_key] = self.question_count.get(freq_key, 0) + 1

        # Limitar tamanho do contador de frequência
        if len(self.question_count) > 1000:
            # Remover 20% das entradas menos frequentes
            sorted_items = sorted(self.question_count.items(), key=lambda x: x[1])
            items_to_remove = len(sorted_items) // 5
            for key, _ in sorted_items[:items_to_remove]:
                del self.question_count[key]

        # Se pergunta é muito frequente, cache especial (limitado)
        if self.question_count[freq_key] >= 3:
            if freq_key not in self.frequent_questions:
                # Verificar limite de perguntas frequentes
                if len(self.frequent_questions) >= self._max_frequent:
                    # Remover a menos frequente
                    min_key = min(self.frequent_questions.keys(),
                                key=lambda k: self.frequent_questions[k]['count'])
                    del self.frequent_questions[min_key]

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
    
    def _aggressive_eviction(self):
        """Remoção agressiva de entradas para liberar memória"""
        try:
            # Remover 30% das entradas mais antigas
            items_to_remove = max(1, len(self.cache) // 3)
            removed_mb = 0

            for _ in range(items_to_remove):
                if not self.cache:
                    break
                oldest_key, oldest_entry = self.cache.popitem(last=False)
                entry_size_mb = oldest_entry.get('size_mb', 0)
                removed_mb += entry_size_mb
                self._memory_usage = max(0, self._memory_usage - entry_size_mb)
                self._evictions += 1

            logger.info(f"Cache: Remoção agressiva - {items_to_remove} itens, ~{removed_mb:.1f}MB liberados")

        except Exception as e:
            logger.error(f"Cache: Erro na remoção agressiva: {e}")

    def _periodic_cleanup(self):
        """Limpeza periódica de entradas expiradas - mais agressiva"""
        while True:
            time.sleep(120)  # Reduzido para 2 minutos

            try:
                with self.lock:
                    now = datetime.now()
                    expired_keys = []
                    freed_memory = 0

                    # Encontrar entradas expiradas
                    for key, entry in self.cache.items():
                        if now - entry['timestamp'] >= self.ttl:
                            expired_keys.append(key)
                            freed_memory += entry.get('size_mb', 0)

                    # Remover entradas expiradas
                    for key in expired_keys:
                        del self.cache[key]

                    # Atualizar uso de memória
                    self._memory_usage = max(0, self._memory_usage - freed_memory)

                    # Se uso de memória ainda alto, fazer limpeza agressiva
                    if self._memory_usage > self.max_memory_mb * 0.8:  # 80% do limite
                        self._aggressive_eviction()

                    if expired_keys:
                        logger.info(f"Cache cleanup: {len(expired_keys)} entradas expiradas, {freed_memory:.1f}MB liberados")

            except Exception as e:
                logger.error(f"Cache: Erro na limpeza periódica: {e}")
    
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
        """Retorna estatísticas do cache com métricas de memória"""
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': f"{self.hit_rate:.1f}%",
            'ttl_minutes': self.ttl.total_seconds() / 60,
            'memory': {
                'usage_mb': round(self._memory_usage, 2),
                'limit_mb': self.max_memory_mb,
                'usage_percent': round((self._memory_usage / self.max_memory_mb) * 100, 1),
                'evictions': self._evictions
            },
            'top_questions': self.get_top_questions(5),
            'frequent_questions_count': len(self.frequent_questions),
            'optimization': {
                'question_counters': len(self.question_count),
                'frequent_limit': self._max_frequent
            }
        }

# Cache global otimizado para uso mínimo de memória
performance_cache = PerformanceCache(max_size=500, ttl_minutes=30, max_memory_mb=25)

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