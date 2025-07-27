#!/usr/bin/env python3
"""
Testes de Integração Backend-Frontend Simplificados
Engenheiro de Integração Full-Stack Sênior especializado em Sistemas Médicos
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configurações de teste
BACKEND_URL = "http://localhost:5000"
TEST_TIMEOUT = 10  # segundos

def log(message: str, level: str = "INFO"):
    """Log formatado com timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def test_health_check():
    """Teste 1: Verificar se o backend está respondendo"""
    log("Teste 1: Health Check do Backend")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TEST_TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            log(f"SUCCESS - Backend online - Status: {data.get('status')}")
            log(f"   PDF carregado: {data.get('pdf_loaded')}")
            log(f"   Personas disponíveis: {data.get('personas')}")
            return True
        else:
            log(f"FAIL - Health check falhou - Status: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"ERROR - Erro no health check: {e}", "ERROR")
        return False

def test_personas_endpoint():
    """Teste 2: Verificar endpoint de personas"""
    log("Teste 2: Endpoint de Personas")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/personas", timeout=TEST_TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            personas = data.get('personas', {})
            
            # Verificar personas obrigatórias
            required_personas = ['dr_gasnelio', 'ga']
            missing_personas = [p for p in required_personas if p not in personas]
            
            if missing_personas:
                log(f"FAIL - Personas faltando: {missing_personas}", "ERROR")
                return False
            
            log(f"SUCCESS - Personas carregadas: {list(personas.keys())}")
            return True
            
        else:
            log(f"FAIL - Endpoint personas falhou - Status: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"ERROR - Erro no endpoint personas: {e}", "ERROR")
        return False

def test_chat_endpoint():
    """Teste 3: Verificar endpoint de chat"""
    log("Teste 3: Endpoint de Chat")
    
    test_questions = [
        {
            'question': 'Qual a dose de rifampicina para adultos?',
            'persona': 'dr_gasnelio'
        },
        {
            'question': 'Por que o xixi fica laranja com o remédio?',
            'persona': 'ga'
        }
    ]
    
    try:
        all_passed = True
        
        for i, test_case in enumerate(test_questions, 1):
            log(f"   Testando pergunta {i}: {test_case['question'][:50]}...")
            
            payload = {
                'question': test_case['question'],
                'personality_id': test_case['persona']
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/chat", 
                json=payload, 
                timeout=TEST_TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get('answer', '')
                confidence = data.get('confidence', 0)
                persona = data.get('persona', '')
                
                log(f"   SUCCESS - Resposta recebida - Persona: {persona}, Confianca: {confidence:.2f}")
                
                # Verificar metadados
                if 'request_id' in data and 'processing_time_ms' in data:
                    processing_time = data['processing_time_ms']
                    log(f"   SUCCESS - Metadados OK - Tempo: {processing_time}ms")
                else:
                    log(f"   WARN - Metadados incompletos", "WARN")
                
            else:
                log(f"   FAIL - Chat falhou - Status: {response.status_code}", "ERROR")
                log(f"   Response: {response.text[:200]}...", "ERROR")
                all_passed = False
                
            time.sleep(1)  # Pausa entre requisições
        
        if all_passed:
            log("SUCCESS - Todos os testes de chat passaram")
            return True
        else:
            log("FAIL - Um ou mais testes de chat falharam", "ERROR")
            return False
            
    except Exception as e:
        log(f"ERROR - Erro no endpoint chat: {e}", "ERROR")
        return False

def test_scope_endpoint():
    """Teste 4: Verificar endpoint de escopo"""
    log("Teste 4: Endpoint de Escopo")
    
    try:
        # Teste GET - informações do escopo
        response = requests.get(f"{BACKEND_URL}/api/scope", timeout=TEST_TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verificar estrutura esperada
            required_sections = ['knowledge_scope', 'confidence_levels']
            missing_sections = [s for s in required_sections if s not in data]
            
            if missing_sections:
                log(f"FAIL - Seções faltando no escopo: {missing_sections}", "ERROR")
                return False
            
            log("SUCCESS - Informações de escopo carregadas")
            
            # Teste POST - verificação de pergunta específica
            test_question = "Qual a dose de rifampicina?"
            scope_payload = {'question': test_question}
            
            scope_response = requests.post(
                f"{BACKEND_URL}/api/scope", 
                json=scope_payload, 
                timeout=TEST_TIMEOUT
            )
            
            if scope_response.status_code == 200:
                scope_data = scope_response.json()
                analysis = scope_data.get('analysis', {})
                
                log(f"SUCCESS - Análise de escopo - No escopo: {analysis.get('is_in_scope')}")
                log(f"   Categoria: {analysis.get('category')}")
                log(f"   Confiança: {analysis.get('confidence_level')}")
                return True
            else:
                log(f"FAIL - POST scope falhou - Status: {scope_response.status_code}", "ERROR")
                return False
        else:
            log(f"FAIL - GET scope falhou - Status: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"ERROR - Erro no endpoint scope: {e}", "ERROR")
        return False

def run_basic_tests():
    """Executa testes básicos de integração"""
    log("Iniciando Testes Básicos de Integração Backend-Frontend")
    log(f"Backend URL: {BACKEND_URL}")
    log("=" * 60)
    
    start_time = time.time()
    
    # Lista de testes a executar
    tests = [
        ("Health Check", test_health_check),
        ("Personas Endpoint", test_personas_endpoint), 
        ("Chat Endpoint", test_chat_endpoint),
        ("Scope Endpoint", test_scope_endpoint)
    ]
    
    results = []
    
    # Executar todos os testes
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            log(f"CRITICAL ERROR em {test_name}: {e}", "ERROR")
            results.append((test_name, False))
        
        log("-" * 40)
    
    # Calcular resultados finais
    end_time = time.time()
    total_time = end_time - start_time
    
    total_tests = len(results)
    passed_tests = sum(1 for _, result in results if result)
    failed_tests = total_tests - passed_tests
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    # Log do resumo
    log("RESUMO DOS TESTES DE INTEGRAÇÃO")
    log("=" * 60)
    log(f"Total de testes: {total_tests}")
    log(f"Sucessos: {passed_tests}")
    log(f"Falhas: {failed_tests}")
    log(f"Taxa de sucesso: {success_rate:.1f}%")
    log(f"Tempo total: {total_time:.2f}s")
    
    # Detalhes dos testes
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        log(f"   {test_name}: {status}")
    
    if success_rate >= 90:
        log("INTEGRAÇÃO BACKEND-FRONTEND: SUCESSO!")
        return True
    elif success_rate >= 70:
        log("INTEGRAÇÃO BACKEND-FRONTEND: PARCIALMENTE FUNCIONAL")
        return True
    else:
        log("INTEGRAÇÃO BACKEND-FRONTEND: CRÍTICA - NECESSITA CORREÇÃO")
        return False

def main():
    """Função principal"""
    print("Sistema de Testes de Integração Backend-Frontend")
    print("Engenheiro de Integração Full-Stack Sênior - Sistemas Médicos")
    print("=" * 70)
    
    # Verificar se backend URL foi fornecida
    backend_url = BACKEND_URL
    if len(sys.argv) > 1:
        backend_url = sys.argv[1]
        globals()['BACKEND_URL'] = backend_url
    
    print(f"Backend URL: {backend_url}")
    print(f"Timeout: {TEST_TIMEOUT}s")
    print("=" * 70)
    
    # Executar testes
    success = run_basic_tests()
    
    # Exit code baseado no sucesso
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()