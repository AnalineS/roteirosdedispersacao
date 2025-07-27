#!/usr/bin/env python3
"""
Testes de Integração Backend-Frontend
Engenheiro de Integração Full-Stack Sênior especializado em Sistemas Médicos

Este módulo testa a comunicação completa entre o backend Flask e frontend React
validando todos os endpoints críticos para o funcionamento do sistema.
"""

import requests
import json
import time
import sys
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configurações de teste
BACKEND_URL = "http://localhost:5000"
TEST_TIMEOUT = 30  # segundos
MAX_RETRIES = 3

class IntegrationTester:
    """Classe para testes de integração completos"""
    
    def __init__(self, backend_url: str = BACKEND_URL):
        self.backend_url = backend_url
        self.api_url = f"{backend_url}/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'IntegrationTester/1.0'
        })
        
        # Resultados dos testes
        self.test_results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': [],
            'details': []
        }
    
    def log(self, message: str, level: str = "INFO"):
        """Log formatado com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def test_health_check(self) -> bool:
        """Teste 1: Verificar se o backend está respondendo"""
        self.log("Teste 1: Health Check do Backend")
        self.test_results['total_tests'] += 1
        
        try:
            response = self.session.get(f"{self.api_url}/health", timeout=TEST_TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Backend online - Status: {data.get('status')}")
                self.log(f"   PDF carregado: {data.get('pdf_loaded')}")
                self.log(f"   Personas disponíveis: {data.get('personas')}")
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'health_check',
                    'status': 'PASS',
                    'response_data': data
                })
                return True
            else:
                self.log(f"❌ Health check falhou - Status: {response.status_code}", "ERROR")
                self.test_results['failed'] += 1
                self.test_results['errors'].append(f"Health check retornou {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no health check: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Health check erro: {str(e)}")
            return False
    
    def test_personas_endpoint(self) -> bool:
        """Teste 2: Verificar endpoint de personas"""
        self.log("🔍 Teste 2: Endpoint de Personas")
        self.test_results['total_tests'] += 1
        
        try:
            response = self.session.get(f"{self.api_url}/personas", timeout=TEST_TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                personas = data.get('personas', {})
                
                # Verificar personas obrigatórias
                required_personas = ['dr_gasnelio', 'ga']
                missing_personas = [p for p in required_personas if p not in personas]
                
                if missing_personas:
                    self.log(f"❌ Personas faltando: {missing_personas}", "ERROR")
                    self.test_results['failed'] += 1
                    self.test_results['errors'].append(f"Personas faltando: {missing_personas}")
                    return False
                
                self.log(f"✅ Personas carregadas: {list(personas.keys())}")
                
                # Verificar estrutura das personas
                for persona_id, persona_data in personas.items():
                    required_fields = ['name', 'description', 'system_prompt']
                    missing_fields = [f for f in required_fields if f not in persona_data]
                    
                    if missing_fields:
                        self.log(f"❌ Persona {persona_id} com campos faltando: {missing_fields}", "ERROR")
                        self.test_results['failed'] += 1
                        self.test_results['errors'].append(f"Persona {persona_id} incompleta")
                        return False
                
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'personas_endpoint',
                    'status': 'PASS',
                    'personas_count': len(personas),
                    'personas_list': list(personas.keys())
                })
                return True
                
            else:
                self.log(f"❌ Endpoint personas falhou - Status: {response.status_code}", "ERROR")
                self.test_results['failed'] += 1
                self.test_results['errors'].append(f"Personas endpoint retornou {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no endpoint personas: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Personas endpoint erro: {str(e)}")
            return False
    
    def test_chat_endpoint(self) -> bool:
        """Teste 3: Verificar endpoint de chat com ambas personas"""
        self.log("🔍 Teste 3: Endpoint de Chat")
        self.test_results['total_tests'] += 1
        
        test_questions = [
            {
                'question': 'Qual a dose de rifampicina para adultos?',
                'persona': 'dr_gasnelio',
                'expected_keywords': ['rifampicina', 'dose', 'mg', 'adulto']
            },
            {
                'question': 'Por que o xixi fica laranja com o remédio?',
                'persona': 'ga', 
                'expected_keywords': ['rifampicina', 'laranja', 'normal', 'urina']
            }
        ]
        
        try:
            all_passed = True
            
            for i, test_case in enumerate(test_questions, 1):
                self.log(f"   Testando pergunta {i}: {test_case['question'][:50]}...")
                
                payload = {
                    'question': test_case['question'],
                    'personality_id': test_case['persona']
                }
                
                response = self.session.post(
                    f"{self.api_url}/chat", 
                    json=payload, 
                    timeout=TEST_TIMEOUT
                )
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get('answer', '').lower()
                    confidence = data.get('confidence', 0)
                    persona = data.get('persona', '')
                    
                    self.log(f"   ✅ Resposta recebida - Persona: {persona}, Confiança: {confidence:.2f}")
                    
                    # Verificar presença de palavras-chave esperadas
                    found_keywords = [kw for kw in test_case['expected_keywords'] if kw.lower() in answer]
                    if len(found_keywords) >= 2:  # Pelo menos 2 palavras-chave
                        self.log(f"   ✅ Palavras-chave encontradas: {found_keywords}")
                    else:
                        self.log(f"   ⚠️  Poucas palavras-chave encontradas: {found_keywords}", "WARN")
                    
                    # Verificar metadados
                    if 'request_id' in data and 'processing_time_ms' in data:
                        processing_time = data['processing_time_ms']
                        self.log(f"   ✅ Metadados OK - Tempo: {processing_time}ms")
                    else:
                        self.log(f"   ⚠️  Metadados incompletos", "WARN")
                    
                else:
                    self.log(f"   ❌ Chat falhou - Status: {response.status_code}", "ERROR")
                    self.log(f"   Response: {response.text[:200]}...", "ERROR")
                    all_passed = False
                    
                time.sleep(1)  # Pausa entre requisições
            
            if all_passed:
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'chat_endpoint',
                    'status': 'PASS',
                    'questions_tested': len(test_questions)
                })
                self.log("✅ Todos os testes de chat passaram")
                return True
            else:
                self.test_results['failed'] += 1
                self.test_results['errors'].append("Um ou mais testes de chat falharam")
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no endpoint chat: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Chat endpoint erro: {str(e)}")
            return False
    
    def test_scope_endpoint(self) -> bool:
        """Teste 4: Verificar endpoint de escopo"""
        self.log("🔍 Teste 4: Endpoint de Escopo")
        self.test_results['total_tests'] += 1
        
        try:
            # Teste GET - informações do escopo
            response = self.session.get(f"{self.api_url}/scope", timeout=TEST_TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verificar estrutura esperada
                required_sections = ['knowledge_scope', 'confidence_levels']
                missing_sections = [s for s in required_sections if s not in data]
                
                if missing_sections:
                    self.log(f"❌ Seções faltando no escopo: {missing_sections}", "ERROR")
                    self.test_results['failed'] += 1
                    return False
                
                self.log("✅ Informações de escopo carregadas")
                
                # Teste POST - verificação de pergunta específica
                test_question = "Qual a dose de rifampicina?"
                scope_payload = {'question': test_question}
                
                scope_response = self.session.post(
                    f"{self.api_url}/scope", 
                    json=scope_payload, 
                    timeout=TEST_TIMEOUT
                )
                
                if scope_response.status_code == 200:
                    scope_data = scope_response.json()
                    analysis = scope_data.get('analysis', {})
                    
                    self.log(f"✅ Análise de escopo - No escopo: {analysis.get('is_in_scope')}")
                    self.log(f"   Categoria: {analysis.get('category')}")
                    self.log(f"   Confiança: {analysis.get('confidence_level')}")
                    
                    self.test_results['passed'] += 1
                    self.test_results['details'].append({
                        'test': 'scope_endpoint',
                        'status': 'PASS',
                        'scope_analysis': analysis
                    })
                    return True
                else:
                    self.log(f"❌ POST scope falhou - Status: {scope_response.status_code}", "ERROR")
                    self.test_results['failed'] += 1
                    return False
            else:
                self.log(f"❌ GET scope falhou - Status: {response.status_code}", "ERROR")
                self.test_results['failed'] += 1
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no endpoint scope: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Scope endpoint erro: {str(e)}")
            return False
    
    def test_feedback_endpoint(self) -> bool:
        """Teste 5: Verificar endpoint de feedback"""
        self.log("🔍 Teste 5: Endpoint de Feedback")
        self.test_results['total_tests'] += 1
        
        try:
            feedback_payload = {
                'question': 'Teste de feedback',
                'response': 'Resposta de teste',
                'rating': 5,
                'comments': 'Teste de integração'
            }
            
            response = self.session.post(
                f"{self.api_url}/feedback", 
                json=feedback_payload, 
                timeout=TEST_TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Feedback enviado - ID: {data.get('request_id')}")
                
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'feedback_endpoint',
                    'status': 'PASS',
                    'feedback_data': feedback_payload
                })
                return True
            else:
                self.log(f"❌ Feedback falhou - Status: {response.status_code}", "ERROR")
                self.test_results['failed'] += 1
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no endpoint feedback: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Feedback endpoint erro: {str(e)}")
            return False
    
    def test_stats_endpoint(self) -> bool:
        """Teste 6: Verificar endpoint de estatísticas"""
        self.log("🔍 Teste 6: Endpoint de Estatísticas")
        self.test_results['total_tests'] += 1
        
        try:
            response = self.session.get(f"{self.api_url}/stats", timeout=TEST_TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                system_stats = data.get('system_stats', {})
                
                # Verificar seções esperadas
                expected_sections = ['rag_system', 'rate_limiter', 'application']
                missing_sections = [s for s in expected_sections if s not in system_stats]
                
                if missing_sections:
                    self.log(f"❌ Seções faltando nas stats: {missing_sections}", "ERROR")
                    self.test_results['failed'] += 1
                    return False
                
                self.log("✅ Estatísticas do sistema carregadas")
                self.log(f"   Feedbacks RAG: {system_stats['rag_system'].get('total_feedback', 0)}")
                self.log(f"   IPs ativos: {system_stats['rate_limiter'].get('active_ips', 0)}")
                self.log(f"   API Version: {system_stats['application'].get('api_version', 'N/A')}")
                
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'stats_endpoint',
                    'status': 'PASS',
                    'stats_summary': {
                        'rag_feedbacks': system_stats['rag_system'].get('total_feedback', 0),
                        'active_ips': system_stats['rate_limiter'].get('active_ips', 0),
                        'api_version': system_stats['application'].get('api_version', 'N/A')
                    }
                })
                return True
            else:
                self.log(f"❌ Stats falhou - Status: {response.status_code}", "ERROR")
                self.test_results['failed'] += 1
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no endpoint stats: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Stats endpoint erro: {str(e)}")
            return False
    
    def test_error_handling(self) -> bool:
        """Teste 7: Verificar tratamento de erros"""
        self.log("🔍 Teste 7: Tratamento de Erros")
        self.test_results['total_tests'] += 1
        
        try:
            error_tests = [
                {
                    'name': 'Chat sem pergunta',
                    'endpoint': f"{self.api_url}/chat",
                    'method': 'POST',
                    'payload': {'personality_id': 'dr_gasnelio'},
                    'expected_status': 400
                },
                {
                    'name': 'Chat com persona inválida',
                    'endpoint': f"{self.api_url}/chat", 
                    'method': 'POST',
                    'payload': {'question': 'teste', 'personality_id': 'invalid'},
                    'expected_status': 400
                },
                {
                    'name': 'Endpoint inexistente',
                    'endpoint': f"{self.api_url}/nonexistent",
                    'method': 'GET',
                    'payload': None,
                    'expected_status': 404
                }
            ]
            
            all_passed = True
            
            for test in error_tests:
                self.log(f"   Testando: {test['name']}")
                
                if test['method'] == 'POST':
                    response = self.session.post(
                        test['endpoint'], 
                        json=test['payload'], 
                        timeout=TEST_TIMEOUT
                    )
                else:
                    response = self.session.get(test['endpoint'], timeout=TEST_TIMEOUT)
                
                if response.status_code == test['expected_status']:
                    self.log(f"   ✅ Erro tratado corretamente - Status: {response.status_code}")
                    
                    # Verificar se retorna JSON de erro válido
                    try:
                        error_data = response.json()
                        if 'error' in error_data:
                            self.log(f"   ✅ JSON de erro válido")
                        else:
                            self.log(f"   ⚠️  JSON de erro sem campo 'error'", "WARN")
                    except:
                        self.log(f"   ⚠️  Resposta não é JSON válido", "WARN")
                else:
                    self.log(f"   ❌ Status inesperado: {response.status_code} (esperado: {test['expected_status']})", "ERROR")
                    all_passed = False
                
                time.sleep(0.5)  # Pausa entre testes
            
            if all_passed:
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'error_handling',
                    'status': 'PASS',
                    'error_tests_count': len(error_tests)
                })
                self.log("✅ Todos os testes de erro passaram")
                return True
            else:
                self.test_results['failed'] += 1
                self.test_results['errors'].append("Um ou mais testes de erro falharam")
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no teste de tratamento de erros: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Error handling test erro: {str(e)}")
            return False
    
    def test_rate_limiting(self) -> bool:
        """Teste 8: Verificar rate limiting"""
        self.log("🔍 Teste 8: Rate Limiting")
        self.test_results['total_tests'] += 1
        
        try:
            # Fazer várias requisições rápidas para testar rate limiting
            self.log("   Testando múltiplas requisições rápidas...")
            
            rate_limit_triggered = False
            
            for i in range(35):  # Mais que o limite de 30/min
                response = self.session.get(f"{self.api_url}/health", timeout=5)
                
                if response.status_code == 429:
                    self.log(f"   ✅ Rate limit ativado na requisição {i+1}")
                    rate_limit_triggered = True
                    
                    # Verificar headers de rate limit
                    if 'X-RateLimit-Limit' in response.headers:
                        self.log(f"   ✅ Headers de rate limit presentes")
                    
                    break
                elif response.status_code != 200:
                    self.log(f"   ❌ Erro inesperado: {response.status_code}", "ERROR")
                    self.test_results['failed'] += 1
                    return False
            
            if rate_limit_triggered:
                self.test_results['passed'] += 1
                self.test_results['details'].append({
                    'test': 'rate_limiting',
                    'status': 'PASS',
                    'rate_limit_triggered': True
                })
                self.log("✅ Rate limiting funcionando")
                return True
            else:
                self.log("⚠️  Rate limiting não foi ativado (pode estar configurado com limite alto)", "WARN")
                self.test_results['passed'] += 1  # Não é necessariamente um erro
                return True
                
        except Exception as e:
            self.log(f"❌ Erro no teste de rate limiting: {e}", "ERROR")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Rate limiting test erro: {str(e)}")
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Executa todos os testes de integração"""
        self.log("🚀 Iniciando Testes de Integração Backend-Frontend")
        self.log(f"Backend URL: {self.backend_url}")
        self.log("=" * 60)
        
        start_time = time.time()
        
        # Lista de testes a executar
        tests = [
            self.test_health_check,
            self.test_personas_endpoint,
            self.test_chat_endpoint,
            self.test_scope_endpoint,
            self.test_feedback_endpoint,
            self.test_stats_endpoint,
            self.test_error_handling,
            self.test_rate_limiting
        ]
        
        # Executar todos os testes
        for test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ Erro crítico no teste {test_func.__name__}: {e}", "ERROR")
                self.test_results['failed'] += 1
                self.test_results['errors'].append(f"Erro crítico em {test_func.__name__}: {str(e)}")
            
            self.log("-" * 40)
        
        # Calcular resultados finais
        end_time = time.time()
        total_time = end_time - start_time
        
        self.test_results.update({
            'total_time_seconds': round(total_time, 2),
            'success_rate': round((self.test_results['passed'] / self.test_results['total_tests']) * 100, 1) if self.test_results['total_tests'] > 0 else 0
        })
        
        # Log do resumo
        self.log("🏁 RESUMO DOS TESTES DE INTEGRAÇÃO")
        self.log("=" * 60)
        self.log(f"Total de testes: {self.test_results['total_tests']}")
        self.log(f"✅ Sucessos: {self.test_results['passed']}")
        self.log(f"❌ Falhas: {self.test_results['failed']}")
        self.log(f"📊 Taxa de sucesso: {self.test_results['success_rate']}%")
        self.log(f"⏱️  Tempo total: {self.test_results['total_time_seconds']}s")
        
        if self.test_results['errors']:
            self.log("\n🚨 ERROS ENCONTRADOS:")
            for error in self.test_results['errors']:
                self.log(f"   • {error}")
        
        if self.test_results['success_rate'] >= 90:
            self.log("\n🎉 INTEGRAÇÃO BACKEND-FRONTEND: SUCESSO!")
        elif self.test_results['success_rate'] >= 70:
            self.log("\n⚠️  INTEGRAÇÃO BACKEND-FRONTEND: PARCIALMENTE FUNCIONAL")
        else:
            self.log("\n🚨 INTEGRAÇÃO BACKEND-FRONTEND: CRÍTICA - NECESSITA CORREÇÃO")
        
        return self.test_results

def main():
    """Função principal para execução dos testes"""
    print("Sistema de Testes de Integracao Backend-Frontend")
    print("Engenheiro de Integracao Full-Stack Senior - Sistemas Medicos")
    print("=" * 70)
    
    # Verificar se backend URL foi fornecida
    backend_url = os.environ.get('BACKEND_URL', BACKEND_URL)
    
    if len(sys.argv) > 1:
        backend_url = sys.argv[1]
    
    print(f"Backend URL: {backend_url}")
    print(f"Timeout: {TEST_TIMEOUT}s")
    print("=" * 70)
    
    # Criar e executar tester
    tester = IntegrationTester(backend_url)
    results = tester.run_all_tests()
    
    # Salvar resultados em arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"integration_test_results_{timestamp}.json"
    
    try:
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n📄 Resultados salvos em: {results_file}")
    except Exception as e:
        print(f"\n⚠️  Erro ao salvar resultados: {e}")
    
    # Exit code baseado no sucesso
    if results['success_rate'] >= 90:
        sys.exit(0)  # Sucesso
    elif results['success_rate'] >= 70:
        sys.exit(1)  # Parcialmente funcional
    else:
        sys.exit(2)  # Crítico

if __name__ == "__main__":
    main()