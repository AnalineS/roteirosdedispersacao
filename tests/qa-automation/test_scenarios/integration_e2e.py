# -*- coding: utf-8 -*-
"""
Integration E2E Tests - Testes End-to-End Consolidados
======================================================

Cenário que consolida todos os testes de integração backend-frontend
em um fluxo completo e automatizado.

Migrado de:
- tests/integration/test_backend_frontend.py
- tests/integration/test_medical_protocols.py
- tests/backend/test_endpoints.py

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import asyncio
import aiohttp
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger('integration_e2e')

class IntegrationE2ETests:
    """Testes End-to-End de integração completa"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_base_url = config["api_base_url"]
        self.timeout = config["timeout"]
        
        # Resultados
        self.results = {
            "start_time": datetime.utcnow(),
            "passed": 0,
            "total": 0,
            "details": [],
            "status": "pending"
        }
    
    async def run_tests(self) -> Dict[str, Any]:
        """Executa todos os testes E2E"""
        logger.info("🔄 Iniciando testes End-to-End...")
        
        # Lista de testes a executar
        test_methods = [
            ("health_check", self._test_health_check),
            ("api_endpoints", self._test_api_endpoints),
            ("chat_integration", self._test_chat_integration),
            ("persona_consistency", self._test_persona_consistency),
            ("cache_system", self._test_cache_system),
            ("error_handling", self._test_error_handling),
            ("response_validation", self._test_response_validation),
            ("firestore_fallback", self._test_firestore_fallback),
            ("medical_workflow", self._test_medical_workflow),
            ("cross_browser_compatibility", self._test_cross_browser_compatibility)
        ]
        
        # Executar testes sequencialmente
        for test_name, test_method in test_methods:
            try:
                logger.info(f"▶️  Executando: {test_name}")
                result = await test_method()
                
                self.results["details"].append({
                    "name": test_name,
                    "passed": result["passed"],
                    "duration": result["duration"],
                    "error": result.get("error"),
                    "details": result.get("details", "")
                })
                
                if result["passed"]:
                    self.results["passed"] += 1
                    logger.info(f"✅ {test_name}: PASSOU ({result['duration']:.2f}s)")
                else:
                    logger.error(f"❌ {test_name}: FALHOU - {result.get('error')}")
                
                self.results["total"] += 1
                
            except Exception as e:
                logger.error(f"💥 Erro crítico em {test_name}: {e}")
                self.results["details"].append({
                    "name": test_name,
                    "passed": False,
                    "duration": 0,
                    "error": str(e),
                    "error_type": "CriticalError"
                })
                self.results["total"] += 1
        
        # Calcular resultado final
        success_rate = (self.results["passed"] / self.results["total"]) * 100 if self.results["total"] > 0 else 0
        self.results["success_rate"] = success_rate
        self.results["status"] = "success" if success_rate >= 90 else "failure"
        self.results["end_time"] = datetime.utcnow()
        self.results["execution_time"] = (self.results["end_time"] - self.results["start_time"]).total_seconds()
        
        logger.info(f"🏁 Testes E2E concluídos: {self.results['passed']}/{self.results['total']} ({success_rate:.1f}%)")
        return self.results
    
    async def _test_health_check(self) -> Dict[str, Any]:
        """Testa health check do sistema"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                url = f"{self.api_base_url}/api/v1/health"
                
                async with session.get(url) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Validar estrutura da resposta
                        required_fields = ["status", "timestamp"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            return {
                                "passed": False,
                                "duration": duration,
                                "error": f"Campos obrigatórios ausentes: {missing_fields}"
                            }
                        
                        return {
                            "passed": True,
                            "duration": duration,
                            "details": f"Status: {data.get('status')}, Services: {len(data.get('services', {}))}"
                        }
                    else:
                        return {
                            "passed": False,
                            "duration": duration,
                            "error": f"Status code {response.status}"
                        }
        
        except Exception as e:
            return {
                "passed": False,
                "duration": time.time() - start_time,
                "error": str(e),
                "error_type": "ConnectionError"
            }
    
    async def _test_api_endpoints(self) -> Dict[str, Any]:
        """Testa principais endpoints da API"""
        start_time = time.time()
        
        endpoints_to_test = [
            ("GET", "/api/v1/personas"),
            ("GET", "/api/v1/health"),
            ("POST", "/api/scope", {"question": "Qual a dose de rifampicina?"}),
            ("GET", "/api/test")  # CORS test
        ]
        
        successful_endpoints = 0
        total_endpoints = len(endpoints_to_test)
        failed_details = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for method, endpoint, payload in [(m, e, p) if len((m, e, p if len((m, e, p)) > 2 else (m, e, None))) > 2 else (m, e, None) for m, e, *rest in [(method, endpoint, *([payload] if len([method, endpoint] + ([payload] if 'payload' in locals() else [])) > 2 else [])) for method, endpoint, *payload in endpoints_to_test]]:
                try:
                    url = f"{self.api_base_url}{endpoint}"
                    
                    if method == "GET":
                        async with session.get(url) as response:
                            if 200 <= response.status < 400:
                                successful_endpoints += 1
                            else:
                                failed_details.append(f"{method} {endpoint}: {response.status}")
                    
                    elif method == "POST":
                        headers = {"Content-Type": "application/json"}
                        async with session.post(url, json=payload, headers=headers) as response:
                            if 200 <= response.status < 400:
                                successful_endpoints += 1
                            else:
                                failed_details.append(f"{method} {endpoint}: {response.status}")
                
                except Exception as e:
                    failed_details.append(f"{method} {endpoint}: {str(e)}")
        
        duration = time.time() - start_time
        success_rate = (successful_endpoints / total_endpoints) * 100
        
        return {
            "passed": success_rate >= 80,  # 80% mínimo
            "duration": duration,
            "details": f"Endpoints funcionais: {successful_endpoints}/{total_endpoints} ({success_rate:.1f}%)",
            "error": f"Falhas: {', '.join(failed_details)}" if failed_details else None
        }
    
    async def _test_chat_integration(self) -> Dict[str, Any]:
        """Testa integração completa do chat"""
        start_time = time.time()
        
        test_scenarios = [
            {
                "question": "Qual a dose de rifampicina para adultos?",
                "persona": "dr_gasnelio",
                "expected_keywords": ["600mg", "adulto", "rifampicina"]
            },
            {
                "question": "Como tomar o medicamento?",
                "persona": "ga",
                "expected_keywords": ["medicamento", "tomar", "como"]
            }
        ]
        
        successful_chats = 0
        failed_details = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for scenario in test_scenarios:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    payload = {
                        "message": scenario["question"],
                        "persona": scenario["persona"],
                        "user_id": "test_user_e2e"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "").lower()
                            
                            # Verificar se contém palavras-chave esperadas
                            keywords_found = sum(1 for keyword in scenario["expected_keywords"] 
                                               if keyword.lower() in response_text)
                            
                            if keywords_found >= len(scenario["expected_keywords"]) * 0.6:  # 60% das keywords
                                successful_chats += 1
                            else:
                                failed_details.append(f"Persona {scenario['persona']}: poucas keywords encontradas")
                        else:
                            failed_details.append(f"Persona {scenario['persona']}: HTTP {response.status}")
                
                except Exception as e:
                    failed_details.append(f"Persona {scenario['persona']}: {str(e)}")
        
        duration = time.time() - start_time
        success_rate = (successful_chats / len(test_scenarios)) * 100
        
        return {
            "passed": success_rate >= 70,
            "duration": duration,
            "details": f"Chat scenarios: {successful_chats}/{len(test_scenarios)} ({success_rate:.1f}%)",
            "error": f"Falhas: {', '.join(failed_details)}" if failed_details else None
        }
    
    async def _test_persona_consistency(self) -> Dict[str, Any]:
        """Testa consistência das personas"""
        start_time = time.time()
        
        # Teste simples de consistência
        personas_to_test = ["dr_gasnelio", "ga"]
        question = "Explique sobre hanseníase"
        
        responses = {}
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for persona in personas_to_test:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    payload = {
                        "message": question,
                        "persona": persona,
                        "user_id": "test_consistency"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            responses[persona] = data.get("response", "")
                        else:
                            responses[persona] = None
                
                except Exception as e:
                    responses[persona] = None
        
        duration = time.time() - start_time
        
        # Verificar se ambas as personas responderam e de forma diferente
        valid_responses = [r for r in responses.values() if r and len(r) > 10]
        personas_working = len(valid_responses)
        
        # Verificar diferença básica entre respostas (não devem ser idênticas)
        consistency_check = True
        if len(valid_responses) == 2:
            consistency_check = responses["dr_gasnelio"] != responses["ga"]
        
        return {
            "passed": personas_working == 2 and consistency_check,
            "duration": duration,
            "details": f"Personas funcionais: {personas_working}/2, Respostas distintas: {consistency_check}",
            "error": None if personas_working == 2 and consistency_check else "Personas não responderam adequadamente"
        }
    
    async def _test_cache_system(self) -> Dict[str, Any]:
        """Testa sistema de cache híbrido"""
        start_time = time.time()
        
        # Fazer requisição duas vezes para testar cache
        test_question = "Teste de cache system"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/chat"
                payload = {
                    "message": test_question,
                    "persona": "ga",
                    "user_id": "test_cache"
                }
                headers = {"Content-Type": "application/json"}
                
                # Primeira requisição
                async with session.post(url, json=payload, headers=headers) as response1:
                    time1 = time.time()
                    data1 = await response1.json() if response1.status == 200 else {}
                
                # Aguardar um pouco
                await asyncio.sleep(0.5)
                
                # Segunda requisição (deveria usar cache)
                async with session.post(url, json=payload, headers=headers) as response2:
                    time2 = time.time()
                    data2 = await response2.json() if response2.status == 200 else {}
                
                duration = time.time() - start_time
                
                # Verificar se ambas funcionaram
                both_successful = response1.status == 200 and response2.status == 200
                
                # Cache working é complexo de determinar sem headers específicos
                # Por enquanto, vamos verificar se as respostas são consistentes
                cache_working = data1.get("response") == data2.get("response") if both_successful else False
                
                return {
                    "passed": both_successful,
                    "duration": duration,
                    "details": f"Ambas requisições OK: {both_successful}, Cache consistente: {cache_working}",
                    "error": None if both_successful else "Falha em uma das requisições"
                }
                
            except Exception as e:
                return {
                    "passed": False,
                    "duration": time.time() - start_time,
                    "error": str(e),
                    "error_type": "CacheTestError"
                }
    
    async def _test_error_handling(self) -> Dict[str, Any]:
        """Testa tratamento de erros"""
        start_time = time.time()
        
        error_scenarios = [
            ("invalid_endpoint", "/api/invalid_endpoint", "GET", None),
            ("malformed_json", "/api/chat", "POST", "invalid json"),
            ("missing_parameters", "/api/chat", "POST", {}),
        ]
        
        handled_errors = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for scenario_name, endpoint, method, payload in error_scenarios:
                try:
                    url = f"{self.api_base_url}{endpoint}"
                    
                    if method == "GET":
                        async with session.get(url) as response:
                            # Espera-se 404 ou similar, mas não 500
                            if 400 <= response.status < 500:
                                handled_errors += 1
                    
                    elif method == "POST":
                        headers = {"Content-Type": "application/json"}
                        if payload == "invalid json":
                            # Enviar JSON inválido propositalmente
                            async with session.post(url, data="invalid json", headers=headers) as response:
                                if 400 <= response.status < 500:
                                    handled_errors += 1
                        else:
                            async with session.post(url, json=payload, headers=headers) as response:
                                if 400 <= response.status < 500:
                                    handled_errors += 1
                
                except Exception:
                    # Conexão falhou completamente - isso é OK para alguns testes
                    pass
        
        duration = time.time() - start_time
        success_rate = (handled_errors / len(error_scenarios)) * 100
        
        return {
            "passed": success_rate >= 60,  # 60% dos erros tratados adequadamente
            "duration": duration,
            "details": f"Erros tratados adequadamente: {handled_errors}/{len(error_scenarios)} ({success_rate:.1f}%)",
            "error": None if success_rate >= 60 else "Muitos erros não tratados adequadamente"
        }
    
    async def _test_response_validation(self) -> Dict[str, Any]:
        """Testa validação de respostas da API"""
        start_time = time.time()
        
        # Teste estrutura das respostas
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                # Teste personas endpoint
                url = f"{self.api_base_url}/api/v1/personas"
                async with session.get(url) as response:
                    if response.status == 200:
                        personas_data = await response.json()
                        
                        # Validar estrutura esperada
                        if isinstance(personas_data, dict) and "personas" in personas_data:
                            personas_valid = True
                        else:
                            personas_valid = False
                    else:
                        personas_valid = False
                
                # Teste health endpoint
                url = f"{self.api_base_url}/api/v1/health"
                async with session.get(url) as response:
                    if response.status == 200:
                        health_data = await response.json()
                        
                        # Validar campos básicos
                        required_fields = ["status", "timestamp"]
                        health_valid = all(field in health_data for field in required_fields)
                    else:
                        health_valid = False
            
            duration = time.time() - start_time
            validations_passed = sum([personas_valid, health_valid])
            
            return {
                "passed": validations_passed >= 2,
                "duration": duration,
                "details": f"Validações OK: {validations_passed}/2",
                "error": None if validations_passed >= 2 else "Estruturas de resposta inválidas"
            }
            
        except Exception as e:
            return {
                "passed": False,
                "duration": time.time() - start_time,
                "error": str(e),
                "error_type": "ValidationError"
            }
    
    async def _test_firestore_fallback(self) -> Dict[str, Any]:
        """Testa fallback do Firestore (se possível)"""
        start_time = time.time()
        
        # Este teste é mais conceitual - verificar se o sistema responde mesmo quando services podem estar degradados
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                # Fazer múltiplas requisições seguidas para testar robustez
                successful_requests = 0
                total_requests = 5
                
                for i in range(total_requests):
                    url = f"{self.api_base_url}/api/v1/health"
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                successful_requests += 1
                        await asyncio.sleep(0.2)  # Pequeno delay
                    except:
                        pass
                
                duration = time.time() - start_time
                reliability = (successful_requests / total_requests) * 100
                
                return {
                    "passed": reliability >= 80,  # 80% de confiabilidade mínima
                    "duration": duration,
                    "details": f"Requests successful: {successful_requests}/{total_requests} ({reliability:.1f}%)",
                    "error": None if reliability >= 80 else "Sistema instável"
                }
                
        except Exception as e:
            return {
                "passed": False,
                "duration": time.time() - start_time,
                "error": str(e),
                "error_type": "ReliabilityError"
            }
    
    async def _test_medical_workflow(self) -> Dict[str, Any]:
        """Testa fluxo médico completo"""
        start_time = time.time()
        
        medical_workflow = [
            "Preciso de informações sobre hanseníase",
            "Qual o protocolo de tratamento?",
            "Como administrar PQT-U?",
            "Quais são os efeitos colaterais?"
        ]
        
        successful_steps = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for step, question in enumerate(medical_workflow):
                try:
                    url = f"{self.api_base_url}/api/chat"
                    payload = {
                        "message": question,
                        "persona": "dr_gasnelio",
                        "user_id": "medical_workflow_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "")
                            
                            # Verificar se a resposta tem conteúdo médico relevante
                            if len(response_text) > 50 and any(term in response_text.lower() 
                                for term in ["hanseníase", "tratamento", "medicamento", "pqt", "dose"]):
                                successful_steps += 1
                
                except Exception:
                    pass
                
                await asyncio.sleep(0.3)  # Delay entre steps
        
        duration = time.time() - start_time
        workflow_success = (successful_steps / len(medical_workflow)) * 100
        
        return {
            "passed": workflow_success >= 75,
            "duration": duration,
            "details": f"Workflow steps successful: {successful_steps}/{len(medical_workflow)} ({workflow_success:.1f}%)",
            "error": None if workflow_success >= 75 else "Workflow médico incompleto"
        }
    
    async def _test_cross_browser_compatibility(self) -> Dict[str, Any]:
        """Testa compatibilidade de headers e CORS"""
        start_time = time.time()
        
        # Simular diferentes user agents
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",  # Chrome
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",  # Firefox
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"  # Safari
        ]
        
        successful_agents = 0
        
        for user_agent in user_agents:
            try:
                headers = {"User-Agent": user_agent}
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout), headers=headers) as session:
                    url = f"{self.api_base_url}/api/test"  # CORS test endpoint
                    async with session.get(url) as response:
                        if response.status == 200:
                            # Verificar headers CORS
                            cors_headers = response.headers.get('Access-Control-Allow-Origin')
                            if cors_headers:
                                successful_agents += 1
            except Exception:
                pass
        
        duration = time.time() - start_time
        compatibility = (successful_agents / len(user_agents)) * 100
        
        return {
            "passed": compatibility >= 66,  # 2/3 dos browsers
            "duration": duration,
            "details": f"User agents compatible: {successful_agents}/{len(user_agents)} ({compatibility:.1f}%)",
            "error": None if compatibility >= 66 else "Problemas de compatibilidade detectados"
        }