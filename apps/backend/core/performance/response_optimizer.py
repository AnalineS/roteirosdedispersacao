# -*- coding: utf-8 -*-
"""
Response Optimizer para melhorar tempos de resposta - SOLUÇÃO DEFINITIVA
Objetivo: Otimizar processamento para <1.5s + compressão + cache

Data: 27 de Janeiro de 2025
Fase: Otimizações de Performance e Security
"""

import time
import gzip
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from functools import wraps
from typing import Dict, Any, Optional
from flask import Flask, request, g
import threading
from collections import defaultdict

logger = logging.getLogger(__name__)

class ResponseOptimizer:
    """Otimizador de respostas para performance - VERSÃO DEFINITIVA"""
    
    def __init__(self, app: Optional[Flask] = None):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.timeout_seconds = 10
        self.compression_threshold = 1024  # Comprimir respostas > 1KB
        self.cache_stats = defaultdict(int)
        self.response_times = []
        self.stats_lock = threading.Lock()
        self.app = app
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Inicializa otimizações com a aplicação Flask"""
        self.app = app
        
        # Configurar middleware de otimização
        app.before_request(self._before_request)
        app.after_request(self._after_request)
        app.after_request(self._add_cache_headers)
        app.after_request(self._compress_response)
        
        logger.info("[START] ResponseOptimizer DEFINITIVO inicializado")
    
    def _before_request(self):
        """Processamento antes da request"""
        g.start_time = time.time()
        g.request_id = f"req_{int(time.time() * 1000)}"
    
    def _after_request(self, response):
        """Processamento após a request - enhanced"""
        if hasattr(g, 'start_time'):
            response_time = (time.time() - g.start_time) * 1000
            
            # Registrar estatísticas
            with self.stats_lock:
                self.response_times.append(response_time)
                # Manter apenas últimas 1000 medições
                if len(self.response_times) > 1000:
                    self.response_times = self.response_times[-1000:]
            
            # Adicionar header de tempo de resposta
            response.headers['X-Response-Time'] = f"{response_time:.2f}ms"
            
            # Log de performance para requests lentas
            if response_time > 1500:  # Meta: <1.5s
                logger.warning(f"Request lenta: {request.path} - {response_time:.2f}ms")
            else:
                logger.debug(f"Request rápida: {request.path} - {response_time:.2f}ms")
        
        return response
    
    def _add_cache_headers(self, response):
        """Adiciona headers de cache otimizados"""
        path = request.path
        
        if path.endswith('/health'):
            # Health checks - cache curto
            response.cache_control.max_age = 30
            response.cache_control.public = True
        elif path.endswith('/personas'):
            # Personas - cache médio
            response.cache_control.max_age = 300  # 5 minutos
            response.cache_control.public = True
        elif path.endswith('/docs'):
            # Documentação - cache longo
            response.cache_control.max_age = 3600  # 1 hora
            response.cache_control.public = True
        elif '/chat' in path:
            # Chat - sem cache
            response.cache_control.no_cache = True
            response.cache_control.no_store = True
            response.cache_control.must_revalidate = True
        else:
            # Default - cache curto
            response.cache_control.max_age = 60
        
        # ETag para cacheamento condicional
        if response.status_code == 200 and '/chat' not in path:
            response.add_etag()
        
        return response
    
    def _compress_response(self, response):
        """Comprime resposta se apropriado"""
        # Verificar se cliente aceita gzip
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if 'gzip' not in accept_encoding.lower():
            return response
        
        # Verificar se resposta é elegível para compressão
        if (response.status_code != 200 or
            response.headers.get('Content-Encoding') or
            len(response.get_data()) < self.compression_threshold):
            return response
        
        # Verificar content-type
        content_type = response.headers.get('Content-Type', '')
        compressible_types = [
            'application/json',
            'text/plain',
            'text/html'
        ]
        
        if not any(ct in content_type for ct in compressible_types):
            return response
        
        try:
            # Comprimir dados
            original_data = response.get_data()
            compressed_data = gzip.compress(original_data)
            
            # Verificar se compressão vale a pena (economiza pelo menos 10%)
            compression_ratio = len(compressed_data) / len(original_data)
            if compression_ratio > 0.9:
                return response
            
            # Aplicar compressão
            response.set_data(compressed_data)
            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Content-Length'] = len(compressed_data)
            response.headers['Vary'] = 'Accept-Encoding'
            
            # Registrar estatística
            with self.stats_lock:
                self.cache_stats['compression_applied'] += 1
                self.cache_stats['bytes_saved'] += (len(original_data) - len(compressed_data))
            
            logger.debug(f"Resposta comprimida: {len(original_data)} -> {len(compressed_data)} bytes")
            
        except Exception as e:
            logger.error(f"Erro na compressão: {e}")
        
        return response
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de performance"""
        with self.stats_lock:
            if not self.response_times:
                return {
                    "response_times": {
                        "count": 0,
                        "avg_ms": 0,
                        "min_ms": 0,
                        "max_ms": 0,
                        "p95_ms": 0,
                        "target_met": True
                    },
                    "compression": dict(self.cache_stats),
                    "recommendations": []
                }
            
            times = sorted(self.response_times)
            count = len(times)
            avg_time = sum(times) / count
            p95_index = int(count * 0.95)
            p95_time = times[p95_index] if p95_index < count else times[-1]
            
            # Verificar se meta de 1.5s está sendo atingida
            slow_requests = sum(1 for t in times if t > 1500)
            target_met = (slow_requests / count) < 0.05  # Menos de 5% lentas
            
            stats = {
                "response_times": {
                    "count": count,
                    "avg_ms": round(avg_time, 2),
                    "min_ms": round(min(times), 2),
                    "max_ms": round(max(times), 2),
                    "p95_ms": round(p95_time, 2),
                    "slow_requests": slow_requests,
                    "target_met": target_met
                },
                "compression": dict(self.cache_stats),
                "recommendations": []
            }
            
            # Gerar recomendações
            if avg_time > 1000:
                stats["recommendations"].append("Tempo médio alto - otimizar processamento")
            
            if p95_time > 2000:
                stats["recommendations"].append("P95 acima da meta - investigar gargalos")
            
            if not target_met:
                stats["recommendations"].append("Meta de 1.5s não atingida - revisar performance")
            
            compression_rate = self.cache_stats.get('compression_applied', 0) / max(count, 1)
            if compression_rate < 0.3:
                stats["recommendations"].append("Taxa de compressão baixa - verificar responses")
            
            return stats
        
    def measure_time(self, func):
        """Decorator para medir tempo de execução"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                
                if elapsed > 1.5:
                    logger.warning(f"{func.__name__} demorou {elapsed:.2f}s (meta: <1.5s)")
                else:
                    logger.info(f"{func.__name__} completou em {elapsed:.2f}s ✓")
                
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"{func.__name__} falhou após {elapsed:.2f}s: {e}")
                raise
        
        return wrapper
    
    def optimize_context_search(self, text: str, query: str, max_chunks: int = 3) -> str:
        """Busca otimizada de contexto relevante"""
        # Dividir texto em chunks menores para busca rápida
        chunk_size = 1000
        chunks = []
        
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        
        # Busca paralela nos chunks
        query_words = set(query.lower().split())
        scored_chunks = []
        
        for i, chunk in enumerate(chunks):
            chunk_words = set(chunk.lower().split())
            score = len(query_words.intersection(chunk_words))
            
            if score > 0:
                scored_chunks.append((score, i, chunk))
        
        # Ordenar por relevância e pegar os melhores
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        result = ""
        for _, _, chunk in scored_chunks[:max_chunks]:
            result += chunk + "\n\n"
            if len(result) > 3000:
                break
        
        return result[:3000]
    
    def preprocess_question(self, question: str) -> dict:
        """Pré-processamento rápido da pergunta"""
        # Análise rápida de keywords
        keywords = {
            'medicamento': ['rifampicina', 'clofazimina', 'dapsona', 'remédio', 'dose'],
            'efeito': ['efeito', 'reação', 'adverso', 'colateral'],
            'tratamento': ['tratamento', 'tomar', 'período', 'duração'],
            'dispensação': ['dispensação', 'farmácia', 'entrega', 'orientação']
        }
        
        question_lower = question.lower()
        detected_categories = []
        
        for category, words in keywords.items():
            if any(word in question_lower for word in words):
                detected_categories.append(category)
        
        return {
            'categories': detected_categories,
            'length': len(question),
            'has_numbers': any(char.isdigit() for char in question),
            'is_technical': len(detected_categories) > 1
        }
    
    def get_quick_response(self, question: str, persona: str) -> dict:
        """Respostas rápidas para perguntas comuns"""
        quick_responses = {
            'dr_gasnelio': {
                'hanseníase': '[RESPOSTA TÉCNICA] A hanseníase é uma doença infectocontagiosa crônica causada pelo Mycobacterium leprae. [PROTOCOLO] Conforme estabelecido no roteiro de dispensação, o tratamento segue o esquema PQT-U.',
                'dose': '[RESPOSTA TÉCNICA] As doses do esquema PQT-U são padronizadas conforme peso corporal. [PROTOCOLO] Rifampicina: 10mg/kg, Clofazimina: 50mg/dia, Dapsona: 100mg/dia.',
                'efeito': '[RESPOSTA TÉCNICA] Os principais eventos adversos documentados incluem hepatotoxicidade (rifampicina), hiperpigmentação (clofazimina) e anemia hemolítica (dapsona). [VALIDAÇÃO] Monitorização laboratorial recomendada.'
            },
            'ga': {
                'hanseníase': 'Oi! A hanseníase é uma doença que afeta a pele e os nervos, mas tem tratamento certinho! Com os remédios certos, você vai ficar bem! 😊',
                'dose': 'Oi! A dose dos remédios é calculada pelo seu peso. O médico já fez isso para você! É só seguir direitinho o que está na receita, tá? 💊',
                'efeito': 'Alguns remédios podem causar mudanças no corpo, como deixar a pele mais escura ou o xixi laranja. Não se preocupe, é normal! Se sentir algo diferente, me avise! [STAR]'
            }
        }
        
        # Buscar resposta rápida
        persona_responses = quick_responses.get(persona, {})
        
        for keyword, response in persona_responses.items():
            if keyword in question.lower():
                return {
                    'answer': response,
                    'quick_response': True,
                    'response_time': 0.1
                }
        
        return None
    
    async def parallel_processing(self, tasks):
        """Processamento paralelo de tarefas"""
        loop = asyncio.get_event_loop()
        futures = []
        
        for task in tasks:
            future = loop.run_in_executor(self.executor, task['func'], *task['args'])
            futures.append(future)
        
        results = await asyncio.gather(*futures)
        return results
    
    def optimize_api_call(self, api_func, *args, **kwargs):
        """Otimiza chamadas de API com timeout e retry"""
        max_retries = 2
        timeout = 5  # segundos
        
        for attempt in range(max_retries):
            try:
                start = time.time()
                result = api_func(*args, timeout=timeout, **kwargs)
                elapsed = time.time() - start
                
                if elapsed < 1.5:
                    return result
                elif attempt < max_retries - 1:
                    logger.warning(f"API lenta ({elapsed:.2f}s), tentando novamente...")
                    timeout = 3  # Reduzir timeout na próxima tentativa
                
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"API falhou após {max_retries} tentativas: {e}")
                    raise
        
        return result

# Performance decorators aprimorados
def cache_response(ttl_seconds: int = 300):
    """Decorator para cache de resposta simples"""
    def decorator(f):
        cache = {}
        cache_times = {}
        
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Criar chave de cache
            cache_key = f"{f.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Verificar cache
            now = time.time()
            if (cache_key in cache and 
                cache_key in cache_times and
                (now - cache_times[cache_key]) < ttl_seconds):
                return cache[cache_key]
            
            # Executar função
            result = f(*args, **kwargs)
            
            # Salvar no cache
            cache[cache_key] = result
            cache_times[cache_key] = now
            
            # Limpar cache antigo
            if len(cache) > 100:
                oldest_key = min(cache_times.keys(), key=cache_times.get)
                cache.pop(oldest_key, None)
                cache_times.pop(oldest_key, None)
            
            return result
        
        return wrapper
    return decorator

def init_performance_optimizations(app: Flask):
    """Inicializa todas as otimizações de performance"""
    global response_optimizer
    response_optimizer = ResponseOptimizer(app)
    logger.info("[START] Otimizações de performance inicializadas na aplicação")

def get_performance_summary() -> Dict[str, Any]:
    """Retorna resumo completo de performance"""
    global response_optimizer
    return {
        "response_optimization": response_optimizer.get_performance_stats(),
        "timestamp": time.time()
    }

# Instância global do otimizador
response_optimizer = ResponseOptimizer()

# Exports para conveniência
__all__ = [
    'ResponseOptimizer', 'response_optimizer', 
    'init_performance_optimizations', 'get_performance_summary',
    'cache_response'
]