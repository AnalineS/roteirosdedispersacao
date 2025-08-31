#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Testes de Tratamento de Erros
Engenheiro de Integração Full-Stack Sênior especializado em Sistemas Médicos
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "http://localhost:5000"
TEST_TIMEOUT = 10

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def test_error_scenarios():
    """Testa cenários de erro"""
    log("Testando Tratamento de Erros")
    
    error_tests = [
        {
            'name': 'Chat sem pergunta',
            'method': 'POST',
            'url': f"{BACKEND_URL}/api/chat",
            'payload': {'personality_id': 'dr_gasnelio'},
            'expected_status': 400,
            'expected_error_code': 'MISSING_QUESTION'
        },
        {
            'name': 'Chat com persona inválida',
            'method': 'POST',
            'url': f"{BACKEND_URL}/api/chat",
            'payload': {'question': 'teste', 'personality_id': 'invalid'},
            'expected_status': 400,
            'expected_error_code': 'INVALID_PERSONA'
        },
        {
            'name': 'Chat sem Content-Type JSON',
            'method': 'POST',
            'url': f"{BACKEND_URL}/api/chat",
            'payload': "invalid payload",
            'headers': {'Content-Type': 'text/plain'},
            'expected_status': 400,
            'expected_error_code': 'INVALID_CONTENT_TYPE'
        },
        {
            'name': 'Endpoint inexistente',
            'method': 'GET',
            'url': f"{BACKEND_URL}/api/nonexistent",
            'payload': None,
            'expected_status': 404
        }
    ]
    
    all_passed = True
    
    for test in error_tests:
        log(f"   Testando: {test['name']}")
        
        try:
            headers = test.get('headers', {'Content-Type': 'application/json'})
            
            if test['method'] == 'POST':
                if isinstance(test['payload'], str):
                    response = requests.post(test['url'], data=test['payload'], 
                                           headers=headers, timeout=TEST_TIMEOUT)
                else:
                    response = requests.post(test['url'], json=test['payload'], 
                                           headers=headers, timeout=TEST_TIMEOUT)
            else:
                response = requests.get(test['url'], timeout=TEST_TIMEOUT)
            
            if response.status_code == test['expected_status']:
                log(f"   SUCCESS - Status correto: {response.status_code}")
                
                # Verificar estrutura de erro para códigos 4xx
                if 400 <= response.status_code < 500:
                    try:
                        error_data = response.json()
                        if 'error' in error_data:
                            log(f"   SUCCESS - JSON de erro válido")
                            
                            # Verificar código de erro específico se esperado
                            if 'expected_error_code' in test:
                                expected_code = test['expected_error_code']
                                actual_code = error_data.get('error_code', '')
                                if actual_code == expected_code:
                                    log(f"   SUCCESS - Código de erro correto: {actual_code}")
                                else:
                                    log(f"   WARN - Código esperado: {expected_code}, recebido: {actual_code}")
                        else:
                            log(f"   WARN - JSON de erro sem campo 'error'")
                    except:
                        log(f"   WARN - Resposta não é JSON válido")
                        
            else:
                log(f"   FAIL - Status inesperado: {response.status_code} (esperado: {test['expected_status']})", "ERROR")
                all_passed = False
                
        except Exception as e:
            log(f"   ERROR - Erro no teste: {e}", "ERROR")
            all_passed = False
        
        time.sleep(0.5)
    
    return all_passed

def test_persona_switching():
    """Testa troca de personas em tempo real"""
    log("Testando Troca de Personas em Tempo Real")
    
    personas_tests = [
        {
            'persona': 'dr_gasnelio',
            'question': 'Qual a dose de rifampicina?',
            'expected_persona': 'dr_gasnelio'
        },
        {
            'persona': 'ga',
            'question': 'Por que o xixi fica laranja?',
            'expected_persona': 'ga'
        },
        {
            'persona': 'dr_gasnelio',
            'question': 'Efeitos colaterais da clofazimina?',
            'expected_persona': 'dr_gasnelio'
        }
    ]
    
    all_passed = True
    
    for i, test in enumerate(personas_tests, 1):
        log(f"   Teste {i}: Persona {test['persona']} - {test['question'][:40]}...")
        
        try:
            payload = {
                'question': test['question'],
                'personality_id': test['persona']
            }
            
            response = requests.post(f"{BACKEND_URL}/api/chat", json=payload, timeout=TEST_TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                returned_persona = data.get('persona', '')
                
                if returned_persona == test['expected_persona']:
                    log(f"   SUCCESS - Persona correta: {returned_persona}")
                    
                    # Verificar consistência da resposta
                    answer = data.get('answer', '').lower()
                    if test['persona'] == 'dr_gasnelio':
                        if 'dr. gasnelio' in answer or 'técnic' in answer:
                            log(f"   SUCCESS - Resposta consistente com Dr. Gasnelio")
                        else:
                            log(f"   WARN - Resposta pode não estar consistente com Dr. Gasnelio")
                    elif test['persona'] == 'ga':
                        if 'gá' in answer or 'oi!' in answer or any(emoji in answer for emoji in ['😊', '💊']):
                            log(f"   SUCCESS - Resposta consistente com Gá")
                        else:
                            log(f"   WARN - Resposta pode não estar consistente com Gá")
                            
                else:
                    log(f"   FAIL - Persona incorreta: esperado {test['expected_persona']}, recebido {returned_persona}", "ERROR")
                    all_passed = False
                    
            else:
                log(f"   FAIL - Erro na requisição: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            log(f"   ERROR - Erro no teste de persona: {e}", "ERROR")
            all_passed = False
        
        time.sleep(1)
    
    return all_passed

def main():
    log("Iniciando Testes de Tratamento de Erros e Troca de Personas")
    log("=" * 60)
    
    start_time = time.time()
    
    tests = [
        ("Tratamento de Erros", test_error_scenarios),
        ("Troca de Personas", test_persona_switching)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            log(f"CRITICAL ERROR em {test_name}: {e}", "ERROR")
            results.append((test_name, False))
        
        log("-" * 40)
    
    end_time = time.time()
    total_time = end_time - start_time
    
    total_tests = len(results)
    passed_tests = sum(1 for _, result in results if result)
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    log("RESUMO DOS TESTES AVANÇADOS")
    log("=" * 60)
    log(f"Total de testes: {total_tests}")
    log(f"Sucessos: {passed_tests}")
    log(f"Taxa de sucesso: {success_rate:.1f}%")
    log(f"Tempo total: {total_time:.2f}s")
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        log(f"   {test_name}: {status}")
    
    return success_rate >= 90

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)