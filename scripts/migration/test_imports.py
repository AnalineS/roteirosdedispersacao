#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste Simplificado - Verificação de Importações
Valida se todos os módulos necessários estão disponíveis
"""

import os
import sys

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_basic_imports():
    """Testa importações básicas"""
    print("Testando importações básicas...")
    
    try:
        import supabase
        print("[OK] supabase - OK")
    except ImportError as e:
        print(f"[ERROR] supabase - FALHOU: {e}")
        
    try:
        import psycopg2
        print("[OK] psycopg2 - OK")
    except ImportError as e:
        print(f"[ERROR] psycopg2 - FALHOU: {e}")
        
    try:
        import openai
        print("[OK] openai - OK")
    except ImportError as e:
        print(f"[ERROR] openai - FALHOU: {e}")
        
    try:
        from dotenv import load_dotenv
        print("[OK] python-dotenv - OK")
    except ImportError as e:
        print(f"[ERROR] python-dotenv - FALHOU: {e}")

def test_project_modules():
    """Testa módulos do projeto"""
    print("\nTestando módulos do projeto...")
    
    try:
        from services.openai_integration import test_openai_connection
        print("[OK] openai_integration - OK")
    except ImportError as e:
        print(f"[ERROR] openai_integration - FALHOU: {e}")
        
    try:
        from services.personas import get_personas
        print("[OK] personas - OK")
    except ImportError as e:
        print(f"[ERROR] personas - FALHOU: {e}")
        
    try:
        from config.dr_gasnelio_technical_prompt import DrGasnelioTechnicalPrompt
        print("[OK] dr_gasnelio_technical_prompt - OK")
    except ImportError as e:
        print(f"[ERROR] dr_gasnelio_technical_prompt - FALHOU: {e}")
        
    try:
        from config.ga_empathetic_prompt import GaEmpatheticPrompt  
        print("[OK] ga_empathetic_prompt - OK")
    except ImportError as e:
        print(f"[ERROR] ga_empathetic_prompt - FALHOU: {e}")

def test_new_modules():
    """Testa módulos criados na migração"""
    print("\nTestando módulos criados (podem falhar se não existirem)...")
    
    try:
        from services.supabase_vector_store import SupabaseVectorStore
        print("[OK] supabase_vector_store - OK")
    except ImportError as e:
        print(f"[ERROR] supabase_vector_store - FALHOU: {e}")
        
    try:
        from services.cloud_native_cache import CloudNativeCache
        print("[OK] cloud_native_cache - OK") 
    except ImportError as e:
        print(f"[ERROR] cloud_native_cache - FALHOU: {e}")
        
    try:
        from services.supabase_rag_system import SupabaseRAGSystem
        print("[OK] supabase_rag_system - OK")
    except ImportError as e:
        print(f"[ERROR] supabase_rag_system - FALHOU: {e}")

if __name__ == "__main__":
    print("Teste de Importações - Supabase Migration")
    print("=" * 50)
    
    test_basic_imports()
    test_project_modules() 
    test_new_modules()
    
    print("\n" + "=" * 50)
    print("Teste concluído!")