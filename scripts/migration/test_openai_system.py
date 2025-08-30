# -*- coding: utf-8 -*-
"""
Teste do Sistema OpenAI/OpenRouter Integration
"""

import os
import sys
from dotenv import load_dotenv

# Carregar ambiente
env_test_path = os.path.join(os.path.dirname(__file__), '..', '.env.test')
load_dotenv(env_test_path)

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_openai_connection():
    """Testa conectividade com OpenRouter"""
    print("=== TESTE OPENROUTER CONNECTION ===")
    
    try:
        from services.openai_integration import test_openai_connection
        result = test_openai_connection()
        
        print(f"Status: {result.get('status')}")
        print(f"Message: {result.get('message', 'N/A')}")
        
        if result.get('status') == 'configured':
            print("PASS: OpenRouter configurado corretamente")
            return True
        elif result.get('status') == 'no_api_key':
            print("WARN: OpenRouter API key não configurada (modo mock)")
            return True
        else:
            print("FAIL: Problema na configuração OpenRouter")
            return False
            
    except Exception as e:
        print(f"FAIL: Erro no teste OpenRouter: {e}")
        return False

def test_mock_responses():
    """Testa respostas simuladas"""
    print("\n=== TESTE RESPOSTAS SIMULADAS ===")
    
    try:
        from services.openai_integration import get_ai_response_mock
        
        # Teste Dr. Gasnelio
        response_dr = get_ai_response_mock(
            "Qual a dosagem de rifampicina?",
            "Contexto sobre hanseníase PQT-U...",
            "dr_gasnelio"
        )
        
        if "Dr. Gasnelio" in response_dr and len(response_dr) > 50:
            print("PASS: Resposta Dr. Gasnelio OK")
        else:
            print("FAIL: Resposta Dr. Gasnelio inadequada")
            return False
        
        # Teste Gá
        response_ga = get_ai_response_mock(
            "Estou preocupado com o tratamento",
            "Contexto empático...",
            "ga"
        )
        
        if "Gá" in response_ga and len(response_ga) > 50:
            print("PASS: Resposta Gá OK")
        else:
            print("FAIL: Resposta Gá inadequada")
            return False
            
        return True
        
    except Exception as e:
        print(f"FAIL: Erro nas respostas simuladas: {e}")
        return False

def test_personas_prompts():
    """Testa sistema de prompts das personas"""
    print("\n=== TESTE PROMPTS PERSONAS ===")
    
    try:
        # Teste Dr. Gasnelio
        from config.dr_gasnelio_technical_prompt import DrGasnelioTechnicalPrompt
        
        dr_system = DrGasnelioTechnicalPrompt()
        technical_prompt = dr_system.create_context_specific_prompt(
            'dosing_queries', 
            'Qual a dose de rifampicina para adultos?'
        )
        
        if len(technical_prompt) > 100 and 'RESPOSTA TÉCNICA' in technical_prompt:
            print("PASS: Dr. Gasnelio prompt system OK")
        else:
            print("FAIL: Dr. Gasnelio prompt inadequado")
            return False
        
        # Teste Gá
        from config.ga_empathetic_prompt import GaEmpatheticPrompt
        
        ga_system = GaEmpatheticPrompt()
        empathetic_prompt = ga_system.get_empathetic_prompt(
            'Estou com medo dos efeitos do remédio'
        )
        
        if len(empathetic_prompt) > 100 and 'empática' in empathetic_prompt.lower():
            print("PASS: Gá prompt system OK")
        else:
            print("FAIL: Gá prompt inadequado")
            return False
            
        return True
        
    except Exception as e:
        print(f"FAIL: Erro no sistema de prompts: {e}")
        return False

def test_personas_basic():
    """Testa sistema básico de personas"""
    print("\n=== TESTE PERSONAS BÁSICO ===")
    
    try:
        from services.personas import get_personas, validate_persona
        
        personas = get_personas()
        
        if 'dr_gasnelio' in personas and 'ga' in personas:
            print("PASS: Personas definidas")
        else:
            print("FAIL: Personas não encontradas")
            return False
            
        if validate_persona('dr_gasnelio') and validate_persona('ga'):
            print("PASS: Validação de personas OK")
        else:
            print("FAIL: Validação de personas falhou")
            return False
            
        return True
        
    except Exception as e:
        print(f"FAIL: Erro no sistema de personas: {e}")
        return False

def main():
    """Função principal"""
    print("TESTE SISTEMA OPENAI/PERSONAS")
    print("=" * 40)
    
    results = []
    results.append(test_openai_connection())
    results.append(test_mock_responses())
    results.append(test_personas_prompts())
    results.append(test_personas_basic())
    
    print("\n=== RESUMO ===")
    passed = sum(results)
    total = len(results)
    
    print(f"Testes aprovados: {passed}/{total}")
    print(f"Taxa de sucesso: {passed/total*100:.1f}%")
    
    if passed == total:
        print("STATUS: SISTEMA OPENAI/PERSONAS FUNCIONANDO")
    else:
        print("STATUS: PROBLEMAS NO SISTEMA OPENAI/PERSONAS")

if __name__ == "__main__":
    main()