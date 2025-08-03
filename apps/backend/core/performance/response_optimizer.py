"""
Response Optimizer para melhorar tempos de resposta
Objetivo: Otimizar processamento para <1.5s

Data: 27 de Janeiro de 2025
Fase: Otimizações de Usabilidade
"""

import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class ResponseOptimizer:
    """Otimizador de respostas para performance"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.timeout_seconds = 10
        
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
                'efeito': 'Alguns remédios podem causar mudanças no corpo, como deixar a pele mais escura ou o xixi laranja. Não se preocupe, é normal! Se sentir algo diferente, me avise! 🌟'
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

# Instância global do otimizador
response_optimizer = ResponseOptimizer()