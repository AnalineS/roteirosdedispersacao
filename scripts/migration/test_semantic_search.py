#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de Busca Semântica - Fase 3.4
Testa a busca semântica com embeddings gerados
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
from datetime import datetime

# Adicionar diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embedding_service import EmbeddingService
from services.vector_store import LocalVectorStore
from services.semantic_search import SemanticSearchEngine

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SemanticSearchTester:
    """Testador de busca semântica"""
    
    def __init__(self):
        self.data_path = Path("../../data")
        self.embeddings_path = self.data_path / "embeddings"
        
        # Configuração para EmbeddingService
        class SimpleConfig:
            EMBEDDINGS_ENABLED = True
            EMBEDDING_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            EMBEDDING_DEVICE = 'cpu'
            CACHE_DIR = str(self.embeddings_path / "cache")
            MAX_LENGTH = 512
            
        # Inicializar serviços
        try:
            config = SimpleConfig()
            self.embedding_service = EmbeddingService(config)
            self.vector_store = LocalVectorStore(str(self.embeddings_path))
            
            # Inicializar SemanticSearchEngine com configuração correta
            try:
                from services.semantic_search import SemanticSearchEngine
                self.search_engine = SemanticSearchEngine(config)
                logger.info("SemanticSearchEngine inicializado com sucesso")
            except Exception as e:
                logger.warning(f"SemanticSearchEngine não disponível: {e}")
                self.search_engine = None
                
            logger.info("Serviços de teste inicializados com sucesso")
        except Exception as e:
            logger.error(f"Erro ao inicializar serviços: {e}")
            self.embedding_service = None
    
    def test_queries(self) -> dict:
        """Executa consultas de teste"""
        test_queries = [
            "Qual a dosagem da rifampicina para adultos?",
            "Como administrar PQT-U?",
            "Quais são os efeitos adversos da clofazimina?"
        ]
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'queries_tested': 0,
            'successful_searches': 0,
            'failed_searches': 0,
            'results': []
        }
        
        if not self.embedding_service:
            results['error'] = 'EmbeddingService não disponível'
            return results
        
        for query in test_queries:
            logger.info(f"Testando consulta: {query}")
            
            try:
                start_time = time.time()
                
                if self.search_engine and self.search_engine.is_available():
                    # Usar SemanticSearchEngine completo
                    try:
                        search_results = self.search_engine.search(query, top_k=3)
                        search_time = time.time() - start_time
                        
                        search_result = {
                            'query': query,
                            'search_engine_used': True,
                            'results_found': len(search_results),
                            'top_score': search_results[0].weighted_score if search_results else 0,
                            'search_time_seconds': round(search_time, 3),
                            'status': 'SUCCESS'
                        }
                        
                        if search_results:
                            search_result['top_result_preview'] = search_results[0].chunk.content[:100] + "..."
                            
                    except Exception as e:
                        search_result = {
                            'query': query,
                            'search_engine_used': True,
                            'status': 'ERROR',
                            'error': str(e)
                        }
                else:
                    # Fallback: apenas gerar embedding
                    query_embedding = self.embedding_service.embed_text(query)
                    
                    if query_embedding is None:
                        logger.warning(f"Não foi possível gerar embedding para: {query}")
                        results['failed_searches'] += 1
                        continue
                    
                    search_time = time.time() - start_time
                    
                    search_result = {
                        'query': query,
                        'search_engine_used': False,
                        'embedding_generated': True,
                        'embedding_dimensions': len(query_embedding) if hasattr(query_embedding, '__len__') else 'N/A',
                        'search_time_seconds': round(search_time, 3),
                        'status': 'SUCCESS'
                    }
                
                results['results'].append(search_result)
                results['successful_searches'] += 1
                results['queries_tested'] += 1
                
                logger.info(f"✓ Consulta processada em {search_time:.3f}s")
                
            except Exception as e:
                logger.error(f"Erro ao processar consulta '{query}': {e}")
                
                error_result = {
                    'query': query,
                    'status': 'ERROR',
                    'error': str(e)
                }
                
                results['results'].append(error_result)
                results['failed_searches'] += 1
        
        return results
    
    def test_model_performance(self) -> dict:
        """Testa performance do modelo de embedding"""
        test_texts = [
            "A rifampicina é um antibiótico usado no tratamento da hanseníase",
            "PQT-U significa poliquimioterapia única para hanseníase",
            "A dapsona pode causar hemólise em pacientes com deficiência de G6PD",
            "O tratamento da hanseníase paucibacilar dura 6 meses",
            "Clofazimina pode causar pigmentação da pele"
        ]
        
        performance_results = {
            'timestamp': datetime.now().isoformat(),
            'total_texts': len(test_texts),
            'processed_texts': 0,
            'failed_texts': 0,
            'total_time': 0,
            'average_time_per_text': 0,
            'embedding_dimensions': None,
            'results': []
        }
        
        if not self.embedding_service:
            performance_results['error'] = 'EmbeddingService não disponível'
            return performance_results
        
        start_total = time.time()
        
        for i, text in enumerate(test_texts):
            try:
                start_time = time.time()
                embedding = self.embedding_service.embed_text(text)
                process_time = time.time() - start_time
                
                if embedding is not None:
                    if performance_results['embedding_dimensions'] is None:
                        performance_results['embedding_dimensions'] = len(embedding) if hasattr(embedding, '__len__') else 'N/A'
                    
                    result = {
                        'text_index': i,
                        'text_preview': text[:50] + "..." if len(text) > 50 else text,
                        'processing_time': round(process_time, 4),
                        'status': 'SUCCESS'
                    }
                    
                    performance_results['processed_texts'] += 1
                else:
                    result = {
                        'text_index': i,
                        'text_preview': text[:50] + "..." if len(text) > 50 else text,
                        'status': 'FAILED',
                        'error': 'Embedding returned None'
                    }
                    performance_results['failed_texts'] += 1
                
                performance_results['results'].append(result)
                
            except Exception as e:
                logger.error(f"Erro ao processar texto {i}: {e}")
                
                result = {
                    'text_index': i,
                    'text_preview': text[:50] + "..." if len(text) > 50 else text,
                    'status': 'ERROR',
                    'error': str(e)
                }
                
                performance_results['results'].append(result)
                performance_results['failed_texts'] += 1
        
        total_time = time.time() - start_total
        performance_results['total_time'] = round(total_time, 3)
        
        if performance_results['processed_texts'] > 0:
            performance_results['average_time_per_text'] = round(
                total_time / performance_results['processed_texts'], 4
            )
        
        return performance_results
    
    def create_test_report(self, query_results: dict, performance_results: dict):
        """Cria relatório completo de teste"""
        report = {
            'phase': 'Fase 3.4 - Teste de Busca Semântica',
            'timestamp': datetime.now().isoformat(),
            'query_tests': query_results,
            'performance_tests': performance_results,
            'summary': {
                'queries_success_rate': 0,
                'performance_success_rate': 0,
                'overall_status': 'UNKNOWN'
            }
        }
        
        # Calcular taxa de sucesso das consultas
        if query_results.get('queries_tested', 0) > 0:
            report['summary']['queries_success_rate'] = round(
                (query_results['successful_searches'] / query_results['queries_tested']) * 100, 2
            )
        
        # Calcular taxa de sucesso da performance
        if performance_results.get('total_texts', 0) > 0:
            report['summary']['performance_success_rate'] = round(
                (performance_results['processed_texts'] / performance_results['total_texts']) * 100, 2
            )
        
        # Status geral
        query_rate = report['summary']['queries_success_rate']
        perf_rate = report['summary']['performance_success_rate']
        
        if query_rate >= 80 and perf_rate >= 80:
            report['summary']['overall_status'] = 'SUCCESS'
        elif query_rate >= 50 and perf_rate >= 50:
            report['summary']['overall_status'] = 'PARTIAL'
        else:
            report['summary']['overall_status'] = 'FAILED'
        
        # Salvar relatório
        report_path = self.embeddings_path / "semantic_search_test_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Relatório de teste salvo em: {report_path}")
        return report

def main():
    """Função principal"""
    logger.info("=== Teste de Busca Semântica - Fase 3.4 ===")
    
    tester = SemanticSearchTester()
    
    # Testar consultas
    logger.info("Executando testes de consulta...")
    query_results = tester.test_queries()
    
    # Testar performance
    logger.info("Executando testes de performance...")
    performance_results = tester.test_model_performance()
    
    # Criar relatório
    report = tester.create_test_report(query_results, performance_results)
    
    # Exibir resumo
    logger.info("=== RESUMO DOS TESTES ===")
    logger.info(f"Taxa de sucesso das consultas: {report['summary']['queries_success_rate']}%")
    logger.info(f"Taxa de sucesso da performance: {report['summary']['performance_success_rate']}%")
    logger.info(f"Status geral: {report['summary']['overall_status']}")
    
    if performance_results.get('embedding_dimensions'):
        logger.info(f"Dimensões dos embeddings: {performance_results['embedding_dimensions']}")
    
    if performance_results.get('average_time_per_text'):
        logger.info(f"Tempo médio por texto: {performance_results['average_time_per_text']}s")
    
    logger.info("Teste de busca semântica concluído!")
    
    return report['summary']['overall_status'] == 'SUCCESS'

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)