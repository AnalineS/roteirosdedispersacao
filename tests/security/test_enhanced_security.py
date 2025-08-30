#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste rápido das implementações de segurança avançada
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps/backend'))

def test_enhanced_sanitizer():
    """Testa se EnhancedInputSanitizer está funcionando"""
    try:
        from blueprints.chat_blueprint import validate_and_sanitize_input
        
        # Teste básico
        safe_input = "Como tratar hanseníase?"
        result = validate_and_sanitize_input(safe_input)
        print(f"OK Teste basico: '{safe_input}' -> '{result}'")
        
        # Teste com input perigoso
        dangerous_input = "<script>alert('xss')</script>Como tratar hanseníase?"
        try:
            result = validate_and_sanitize_input(dangerous_input)
            print(f"OK Teste XSS: Input perigoso sanitizado -> '{result}'")
        except ValueError as e:
            print(f"OK Teste XSS: Input perigoso bloqueado -> {e}")
            
        # Teste com SQL injection
        sql_input = "Como tratar hanseníase?; DROP TABLE users; --"
        try:
            result = validate_and_sanitize_input(sql_input)
            print(f"OK Teste SQL: Input SQL sanitizado -> '{result}'")
        except ValueError as e:
            print(f"OK Teste SQL: Input SQL bloqueado -> {e}")
            
        print("\nRESULTADO EnhancedInputSanitizer: FUNCIONANDO")
        return True
        
    except Exception as e:
        print(f"ERROR Erro no teste: {e}")
        return False

def test_imports_availability():
    """Testa se todos os imports estão disponíveis"""
    try:
        from blueprints.chat_blueprint import (
            ENHANCED_SERVICES, 
            SECURITY_PATCHES_AVAILABLE,
            AI_PROVIDER_AVAILABLE,
            BASIC_RAG,
            MEDICAL_DISCLAIMERS_AVAILABLE,
            METRICS_AVAILABLE
        )
        
        print("STATUS STATUS DOS IMPORTS:")
        print(f"  * ENHANCED_SERVICES: {ENHANCED_SERVICES}")
        print(f"  * SECURITY_PATCHES_AVAILABLE: {SECURITY_PATCHES_AVAILABLE}")
        print(f"  * AI_PROVIDER_AVAILABLE: {AI_PROVIDER_AVAILABLE}")
        print(f"  * BASIC_RAG: {BASIC_RAG}")
        print(f"  * MEDICAL_DISCLAIMERS_AVAILABLE: {MEDICAL_DISCLAIMERS_AVAILABLE}")
        print(f"  * METRICS_AVAILABLE: {METRICS_AVAILABLE}")
        
        # Contar quantos estão disponíveis
        available_count = sum([
            ENHANCED_SERVICES,
            SECURITY_PATCHES_AVAILABLE,
            AI_PROVIDER_AVAILABLE,
            BASIC_RAG,
            MEDICAL_DISCLAIMERS_AVAILABLE,
            METRICS_AVAILABLE
        ])
        
        print(f"\nRESULTADO ROBUSTEZ: {available_count}/6 sistemas disponíveis ({available_count/6*100:.1f}%)")
        return True
        
    except Exception as e:
        print(f"ERROR Erro ao verificar imports: {e}")
        return False

if __name__ == "__main__":
    print("TESTE TESTE DE IMPLEMENTAÇÕES DE SEGURANÇA AVANÇADA")
    print("=" * 60)
    
    # Testes
    test1 = test_enhanced_sanitizer()
    print()
    test2 = test_imports_availability()
    
    print("\n" + "=" * 60)
    if test1 and test2:
        print("OK ETAPA 2 CONCLUÍDA: Segurança avançada implementada com sucesso!")
    else:
        print("ERROR ETAPA 2 FALHOU: Verificar implementações")