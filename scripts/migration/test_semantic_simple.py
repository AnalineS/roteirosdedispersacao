#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste Simplificado de Busca Semantica - Fase 3.4
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

# Adicionar diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    """Teste simplificado da busca semantica"""
    print("=== Teste Simplificado de Busca Semantica ===")
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'tests': {},
        'summary': {}
    }
    
    try:
        # Teste 1: EmbeddingService
        print("1. Testando EmbeddingService...")
        from services.embedding_service import EmbeddingService
        
        class SimpleConfig:
            EMBEDDINGS_ENABLED = True
            EMBEDDING_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            EMBEDDING_DEVICE = 'cpu'
            CACHE_DIR = str(Path("../../data/embeddings/cache"))
            MAX_LENGTH = 512
        
        config = SimpleConfig()
        embedding_service = EmbeddingService(config)
        
        # Teste embedding simples
        test_text = "Qual a dosagem da rifampicina?"
        start_time = time.time()
        embedding = embedding_service.embed_text(test_text)
        embed_time = time.time() - start_time
        
        results['tests']['embedding_service'] = {
            'available': embedding_service.is_available(),
            'embedding_generated': embedding is not None,
            'embedding_dimensions': len(embedding) if embedding else 0,
            'processing_time': round(embed_time, 3),
            'status': 'SUCCESS' if embedding else 'FAILED'
        }
        
        print(f"   Embedding: {'OK' if embedding else 'FALHA'} - {embed_time:.3f}s")
        
    except Exception as e:
        results['tests']['embedding_service'] = {
            'status': 'ERROR',
            'error': str(e)
        }
        print(f"   ERRO: {e}")
    
    try:
        # Teste 2: SemanticSearchEngine
        print("2. Testando SemanticSearchEngine...")
        from services.semantic_search import SemanticSearchEngine
        
        search_engine = SemanticSearchEngine(config)
        available = search_engine.is_available()
        
        results['tests']['semantic_search'] = {
            'initialized': True,
            'available': available,
            'status': 'SUCCESS' if available else 'LIMITED'
        }
        
        print(f"   SemanticSearch: {'OK' if available else 'LIMITADO'}")
        
    except Exception as e:
        results['tests']['semantic_search'] = {
            'status': 'ERROR',
            'error': str(e)
        }
        print(f"   ERRO: {e}")
    
    try:
        # Teste 3: LocalVectorStore
        print("3. Testando LocalVectorStore...")
        from services.vector_store import LocalVectorStore
        
        embeddings_path = Path("../../data/embeddings")
        vector_store = LocalVectorStore(str(embeddings_path))
        
        results['tests']['vector_store'] = {
            'initialized': True,
            'documents_count': len(vector_store.documents),
            'status': 'SUCCESS'
        }
        
        print(f"   VectorStore: OK - {len(vector_store.documents)} documentos")
        
    except Exception as e:
        results['tests']['vector_store'] = {
            'status': 'ERROR',
            'error': str(e)
        }
        print(f"   ERRO: {e}")
    
    # Calcular resumo
    successful_tests = sum(1 for test in results['tests'].values() 
                          if test.get('status') in ['SUCCESS', 'LIMITED'])
    total_tests = len(results['tests'])
    
    results['summary'] = {
        'total_tests': total_tests,
        'successful_tests': successful_tests,
        'success_rate': round((successful_tests / total_tests) * 100, 2) if total_tests > 0 else 0,
        'overall_status': 'SUCCESS' if successful_tests >= 2 else 'PARTIAL' if successful_tests >= 1 else 'FAILED'
    }
    
    # Salvar relatorio
    report_path = Path("../../data/embeddings/semantic_test_simple_report.json")
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Exibir resumo
    print("\n=== RESUMO ===")
    print(f"Testes executados: {total_tests}")
    print(f"Testes bem-sucedidos: {successful_tests}")
    print(f"Taxa de sucesso: {results['summary']['success_rate']}%")
    print(f"Status geral: {results['summary']['overall_status']}")
    
    if results['tests'].get('embedding_service', {}).get('embedding_dimensions'):
        print(f"Dimensoes dos embeddings: {results['tests']['embedding_service']['embedding_dimensions']}")
    
    print(f"\nRelatorio salvo em: {report_path}")
    print("\nTeste concluido!")
    
    return results['summary']['overall_status'] == 'SUCCESS'

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)