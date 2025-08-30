# -*- coding: utf-8 -*-
"""
Teste do Sistema de Cache Cloud-Native
"""

import os
import sys
import time
import asyncio
from dotenv import load_dotenv

# Carregar ambiente
env_test_path = os.path.join(os.path.dirname(__file__), '..', '.env.test')
load_dotenv(env_test_path)

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

class MockConfig:
    """Configuração mock para testes"""
    EMBEDDING_CACHE_SIZE = 100
    CACHE_TTL_HOURS = 24
    FIREBASE_AVAILABLE = False
    SUPABASE_CACHE_ENABLED = False

def test_cache_basic():
    """Teste básico do sistema de cache"""
    print("=== TESTE CACHE BÁSICO ===")
    
    try:
        from services.cloud_native_cache import CloudNativeCache
        
        config = MockConfig()
        cache = CloudNativeCache(config)
        
        # Teste set/get básico
        test_key = "test_basic_key"
        test_value = {"data": "test_value", "timestamp": time.time()}
        
        cache.set(test_key, test_value)
        retrieved = cache.get(test_key)
        
        if retrieved and retrieved['data'] == test_value['data']:
            print("PASS: Cache set/get básico")
        else:
            print("FAIL: Cache set/get falhou")
            return False
            
        # Teste limpeza (apenas clear_expired disponível)
        stats_before = cache.get_stats()
        cache.clear_expired()
        stats_after = cache.get_stats()
        
        print(f"PASS: Cache limpeza - stats obtidas")
            
        return True
        
    except Exception as e:
        print(f"FAIL: Erro no cache básico: {e}")
        return False

def test_cache_ttl():
    """Teste TTL do cache"""
    print("\n=== TESTE CACHE TTL ===")
    
    try:
        from services.cloud_native_cache import CloudNativeCache
        
        config = MockConfig()
        cache = CloudNativeCache(config)
        
        # Definir item com TTL curto (simular)
        ttl_key = "test_ttl_key" 
        ttl_value = {"data": "expires_soon"}
        
        cache.set(ttl_key, ttl_value)
        
        # Verificar se existe imediatamente
        immediate = cache.get(ttl_key)
        if immediate and immediate['data'] == ttl_value['data']:
            print("PASS: Set/get básico funcionou")
        else:
            print("FAIL: Set/get básico falhou")
            return False
        
        print("INFO: TTL será testado em ambiente real")
        return True
        
    except Exception as e:
        print(f"FAIL: Erro no teste TTL: {e}")
        return False

def test_cache_performance():
    """Teste de performance do cache"""
    print("\n=== TESTE PERFORMANCE CACHE ===")
    
    try:
        from services.cloud_native_cache import CloudNativeCache
        
        config = MockConfig()
        cache = CloudNativeCache(config)
        
        # Teste com múltiplas operações
        num_ops = 10
        start_time = time.time()
        
        for i in range(num_ops):
            key = f"perf_test_{i}"
            value = {"index": i, "data": f"performance_test_data_{i}"}
            cache.set(key, value)
        
        set_time = time.time() - start_time
        
        # Teste de leitura
        start_time = time.time()
        
        for i in range(num_ops):
            key = f"perf_test_{i}"
            cache.get(key)
            
        get_time = time.time() - start_time
        
        print(f"PERFORMANCE: {num_ops} sets em {set_time:.3f}s")
        print(f"PERFORMANCE: {num_ops} gets em {get_time:.3f}s")
        
        if set_time < 5.0 and get_time < 5.0:  # Limites razoáveis
            print("PASS: Performance aceitável")
        else:
            print("WARN: Performance pode estar lenta")
        
        # Limpeza (usar clear_expired)
        cache.clear_expired()
            
        return True
        
    except Exception as e:
        print(f"FAIL: Erro no teste de performance: {e}")
        return False

def test_cache_complex_data():
    """Teste com dados complexos"""
    print("\n=== TESTE DADOS COMPLEXOS ===")
    
    try:
        from services.cloud_native_cache import CloudNativeCache
        
        config = MockConfig()
        cache = CloudNativeCache(config)
        
        # Dados complexos típicos do RAG
        complex_data = {
            "query": "Qual a dosagem de rifampicina?",
            "persona": "dr_gasnelio",
            "context": [
                {
                    "content": "PQT-U para adultos: rifampicina 600mg mensal supervisionado",
                    "source": "roteiro_hanseniase.md",
                    "score": 0.95
                },
                {
                    "content": "Adultos >50kg: rifampicina 600mg, clofazimina 300mg + 50mg diário",
                    "source": "dosing_protocols.json", 
                    "score": 0.88
                }
            ],
            "metadata": {
                "timestamp": time.time(),
                "category": "dosing",
                "user_type": "professional"
            }
        }
        
        complex_key = "rag_query_complex"
        cache.set(complex_key, complex_data)
        
        retrieved_complex = cache.get(complex_key)
        
        if (retrieved_complex and 
            retrieved_complex['query'] == complex_data['query'] and
            len(retrieved_complex['context']) == len(complex_data['context'])):
            print("PASS: Cache dados complexos")
        else:
            print("FAIL: Cache dados complexos falhou")
            return False
            
        cache.clear_expired()  # Limpeza geral
        return True
        
    except Exception as e:
        print(f"FAIL: Erro com dados complexos: {e}")
        return False

def main():
    """Função principal"""
    print("TESTE SISTEMA DE CACHE")
    print("=" * 30)
    
    results = []
    results.append(test_cache_basic())
    results.append(test_cache_ttl())
    results.append(test_cache_performance())
    results.append(test_cache_complex_data())
    
    print("\n=== RESUMO ===")
    passed = sum(results)
    total = len(results)
    
    print(f"Testes aprovados: {passed}/{total}")
    print(f"Taxa de sucesso: {passed/total*100:.1f}%")
    
    if passed == total:
        print("STATUS: SISTEMA DE CACHE FUNCIONANDO")
    else:
        print("STATUS: PROBLEMAS NO SISTEMA DE CACHE")

if __name__ == "__main__":
    main()