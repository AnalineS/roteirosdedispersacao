# -*- coding: utf-8 -*-
"""
Teste Simplificado de Integração Supabase
Sem emojis para evitar problemas de encoding no Windows
"""

import os
import sys
import json
from datetime import datetime

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_imports():
    """Testa importações essenciais"""
    print("=== TESTE DE IMPORTAÇÕES ===")
    results = {}
    
    # Testar Supabase
    try:
        import supabase
        print("PASS: supabase")
        results['supabase'] = True
    except ImportError as e:
        print(f"FAIL: supabase - {e}")
        results['supabase'] = False
    
    # Testar psycopg2  
    try:
        import psycopg2
        print("PASS: psycopg2")
        results['psycopg2'] = True
    except ImportError as e:
        print(f"FAIL: psycopg2 - {e}")
        results['psycopg2'] = False
        
    # Testar OpenAI
    try:
        import openai
        print("PASS: openai")
        results['openai'] = True
    except ImportError as e:
        print(f"FAIL: openai - {e}")
        results['openai'] = False
        
    return results

def test_project_files():
    """Testa se arquivos do projeto existem"""
    print("\n=== TESTE DE ARQUIVOS ===")
    files_to_check = [
        'services/openai_integration.py',
        'services/personas.py', 
        'config/dr_gasnelio_technical_prompt.py',
        'config/ga_empathetic_prompt.py'
    ]
    
    results = {}
    backend_path = os.path.dirname(os.path.dirname(__file__))
    
    for file_path in files_to_check:
        full_path = os.path.join(backend_path, file_path)
        if os.path.exists(full_path):
            print(f"PASS: {file_path}")
            results[file_path] = True
        else:
            print(f"FAIL: {file_path} - arquivo não encontrado")
            results[file_path] = False
            
    return results

def test_new_files():
    """Testa arquivos criados na migração"""
    print("\n=== TESTE DE ARQUIVOS NOVOS ===")
    new_files = [
        'services/supabase_vector_store.py',
        'services/cloud_native_cache.py',
        'services/supabase_rag_system.py',
        'scripts/setup_supabase_tables.sql',
        'scripts/migrate_json_to_supabase.py'
    ]
    
    results = {}
    backend_path = os.path.dirname(os.path.dirname(__file__))
    
    for file_path in new_files:
        full_path = os.path.join(backend_path, file_path)
        if os.path.exists(full_path):
            print(f"PASS: {file_path}")
            results[file_path] = True
        else:
            print(f"FAIL: {file_path} - arquivo não encontrado")
            results[file_path] = False
            
    return results

def test_env_variables():
    """Testa variáveis de ambiente"""
    print("\n=== TESTE DE VARIÁVEIS DE AMBIENTE ===")
    
    # Tentar carregar .env.test
    env_test_path = os.path.join(os.path.dirname(__file__), '..', '.env.test')
    if os.path.exists(env_test_path):
        print(f"PASS: .env.test encontrado")
        try:
            from dotenv import load_dotenv
            load_dotenv(env_test_path)
            print("PASS: dotenv carregado")
        except ImportError:
            print("FAIL: python-dotenv não disponível")
    else:
        print("INFO: .env.test não encontrado (opcional)")
    
    # Verificar variáveis críticas
    critical_vars = ['SUPABASE_URL', 'SUPABASE_KEY']
    for var in critical_vars:
        value = os.environ.get(var)
        if value:
            print(f"PASS: {var} definido")
        else:
            print(f"FAIL: {var} não definido")

def main():
    """Função principal"""
    print("TESTE SIMPLIFICADO - MIGRAÇÃO SUPABASE")
    print("=" * 50)
    
    import_results = test_imports()
    project_results = test_project_files()
    new_results = test_new_files()
    test_env_variables()
    
    print("\n=== RESUMO ===")
    total_tests = len(import_results) + len(project_results) + len(new_results)
    passed_tests = sum(import_results.values()) + sum(project_results.values()) + sum(new_results.values())
    
    print(f"Total de testes: {total_tests}")
    print(f"Testes aprovados: {passed_tests}")
    print(f"Taxa de sucesso: {passed_tests/total_tests*100:.1f}%")
    
    if passed_tests == total_tests:
        print("STATUS: TODOS OS TESTES PASSARAM")
    elif passed_tests >= total_tests * 0.8:
        print("STATUS: MAIORIA DOS TESTES PASSOU")
    else:
        print("STATUS: MUITOS TESTES FALHARAM")

if __name__ == "__main__":
    main()