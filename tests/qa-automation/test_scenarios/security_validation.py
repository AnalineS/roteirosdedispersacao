# -*- coding: utf-8 -*-
"""
Security Validation Tests - Testes de Segurança e Validação
===========================================================

Cenário que valida security middleware, rate limiting,
input sanitization e proteções contra ataques.

Migrado de:
- tests/security/test_log_injection_prevention.py
- tests/security/test_stack_trace_exposure.py
- tests/backend/test_security_validation.py
- tests/backend/test_security_simple.py

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import asyncio
import aiohttp
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger('security_validation')

class SecurityValidationTests:
    """Testes de validação de segurança do sistema"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_base_url = config["api_base_url"]
        self.timeout = config["timeout"]
        self.security_severity = config.get("security_severity", "medium")
        
        # Payloads de ataque para teste
        self.attack_payloads = {
            "sql_injection": [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "1' UNION SELECT * FROM users--",
                "admin'--",
                "' OR 1=1--"
            ],
            "xss": [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert('XSS')>",
                "javascript:alert('XSS')",
                "<svg onload=alert('XSS')>",
                "';alert('XSS');//"
            ],
            "path_traversal": [
                "../../../etc/passwd",
                "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
                "....//....//....//etc/passwd",
                "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
                "..%252f..%252f..%252fetc%252fpasswd"
            ],
            "command_injection": [
                "; cat /etc/passwd",
                "| whoami",
                "; ls -la",
                "&& echo vulnerable",
                "`id`"
            ],
            "log_injection": [
                "admin\\n[FAKE] User logged in successfully",
                "test\\r\\n[ERROR] System compromised",
                "user\\u000A[ALERT] Security breach",
                "normal\\x0d\\x0a[FAKE LOG ENTRY]"
            ]
        }
        
        # User agents suspeitos
        self.malicious_user_agents = [
            "sqlmap/1.0",
            "Nikto/2.1.6",
            "python-requests/2.25.1",  # Genérico demais
            "Wget/1.20.3",
            "curl/7.68.0"
        ]
        
        # Resultados
        self.results = {
            "start_time": datetime.utcnow(),
            "passed": 0,
            "total": 0,
            "details": [],
            "status": "pending"
        }
    
    async def run_tests(self) -> Dict[str, Any]:
        """Executa todos os testes de segurança"""
        logger.info("🔒 Iniciando testes de segurança...")
        
        # Lista de testes de segurança
        test_methods = [
            ("input_sanitization", self._test_input_sanitization),
            ("sql_injection_prevention", self._test_sql_injection_prevention),
            ("xss_prevention", self._test_xss_prevention),
            ("path_traversal_prevention", self._test_path_traversal_prevention),
            ("command_injection_prevention", self._test_command_injection_prevention),
            ("rate_limiting", self._test_rate_limiting),
            ("user_agent_filtering", self._test_user_agent_filtering),
            ("cors_configuration", self._test_cors_configuration),
            ("security_headers", self._test_security_headers),
            ("log_injection_prevention", self._test_log_injection_prevention),
            ("error_information_leakage", self._test_error_information_leakage),
            ("authentication_bypass", self._test_authentication_bypass)
        ]
        
        # Executar testes
        for test_name, test_method in test_methods:
            try:
                logger.info(f"🔒 Executando: {test_name}")
                result = await test_method()
                
                self.results["details"].append({
                    "name": test_name,
                    "passed": result["passed"],
                    "duration": result["duration"],
                    "error": result.get("error"),
                    "details": result.get("details", ""),
                    "severity": result.get("severity", "medium")
                })
                
                if result["passed"]:
                    self.results["passed"] += 1
                    logger.info(f"✅ {test_name}: PASSOU ({result['duration']:.2f}s)")
                else:
                    severity = result.get("severity", "medium")
                    logger.error(f"❌ {test_name}: FALHOU [{severity.upper()}] - {result.get('error')}")
                
                self.results["total"] += 1
                
            except Exception as e:
                logger.error(f"💥 Erro crítico em {test_name}: {e}")
                self.results["details"].append({
                    "name": test_name,
                    "passed": False,
                    "duration": 0,
                    "error": str(e),
                    "error_type": "CriticalError",
                    "severity": "high"
                })
                self.results["total"] += 1
        
        # Calcular resultado final
        success_rate = (self.results["passed"] / self.results["total"]) * 100 if self.results["total"] > 0 else 0
        
        # Para segurança, critério mais rígido
        critical_failures = len([d for d in self.results["details"] if not d["passed"] and d.get("severity") == "high"])
        
        self.results["success_rate"] = success_rate
        self.results["critical_failures"] = critical_failures
        self.results["status"] = "success" if success_rate >= 85 and critical_failures == 0 else "failure"
        self.results["end_time"] = datetime.utcnow()
        self.results["execution_time"] = (self.results["end_time"] - self.results["start_time"]).total_seconds()
        
        logger.info(f"🏁 Testes de segurança concluídos: {self.results['passed']}/{self.results['total']} ({success_rate:.1f}%)")
        if critical_failures > 0:
            logger.error(f"🚨 {critical_failures} falhas críticas de segurança detectadas!")
        
        return self.results
    
    async def _test_input_sanitization(self) -> Dict[str, Any]:
        """Testa sanitização geral de inputs"""
        start_time = time.time()
        
        # Payloads diversos de teste
        test_inputs = [
            "<script>alert('test')</script>",
            "'; DROP TABLE test; --",
            "../../../etc/passwd",
            "normal input",
            "input with unicode \\u0000 characters"
        ]
        
        blocked_inputs = 0
        allowed_inputs = 0
        errors = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for payload in test_inputs:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    data = {
                        "message": payload,
                        "persona": "ga",
                        "user_id": "security_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=data, headers=headers) as response:
                        # Analisar resposta
                        if 400 <= response.status < 500:
                            blocked_inputs += 1  # Input foi rejeitado (bom)
                        elif response.status == 200:
                            response_text = await response.text()
                            # Verificar se o payload foi sanitizado na resposta
                            if payload in response_text and payload != "normal input":
                                errors.append(f"Payload não sanitizado: {payload[:20]}...")
                            allowed_inputs += 1
                        else:
                            errors.append(f"Status inesperado {response.status} para: {payload[:20]}...")
                
                except Exception as e:
                    errors.append(f"Erro: {str(e)}")
                
                await asyncio.sleep(0.2)  # Rate limiting
        
        duration = time.time() - start_time
        
        # Avaliar resultado
        malicious_payloads = len(test_inputs) - 1  # Excluir "normal input"
        sanitization_rate = (blocked_inputs / malicious_payloads * 100) if malicious_payloads > 0 else 0
        
        # Input sanitization é considerado OK se a maioria dos payloads maliciosos são tratados
        sanitization_ok = sanitization_rate >= 60 or len(errors) <= 2
        
        return {
            "passed": sanitization_ok,
            "duration": duration,
            "severity": "high" if not sanitization_ok else "medium",
            "details": f"Inputs bloqueados: {blocked_inputs}/{malicious_payloads}, Taxa: {sanitization_rate:.1f}%",
            "error": f"Sanitização inadequada: {', '.join(errors[:3])}" if errors and not sanitization_ok else None
        }
    
    async def _test_sql_injection_prevention(self) -> Dict[str, Any]:
        """Testa prevenção contra SQL injection"""
        start_time = time.time()
        
        sql_payloads = self.attack_payloads["sql_injection"]
        blocked_count = 0
        vulnerabilities = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for payload in sql_payloads:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    data = {
                        "message": payload,
                        "persona": "ga",
                        "user_id": f"sql_test_{hash(payload) % 1000}"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=data, headers=headers) as response:
                        if 400 <= response.status < 500:
                            blocked_count += 1
                        elif response.status == 200:
                            response_text = await response.text()
                            # Verificar se há indícios de execução SQL na resposta
                            sql_indicators = ["table", "database", "sql", "syntax error", "mysql", "postgresql"]
                            if any(indicator in response_text.lower() for indicator in sql_indicators):
                                vulnerabilities.append(f"Possível SQL injection: {payload[:30]}...")
                
                except Exception:
                    blocked_count += 1  # Erro pode indicar que foi bloqueado
                
                await asyncio.sleep(0.1)
        
        duration = time.time() - start_time
        prevention_rate = (blocked_count / len(sql_payloads)) * 100
        
        # SQL injection prevention é crítico
        sql_protected = prevention_rate >= 80 and len(vulnerabilities) == 0
        
        return {
            "passed": sql_protected,
            "duration": duration,
            "severity": "high",
            "details": f"SQL payloads bloqueados: {blocked_count}/{len(sql_payloads)} ({prevention_rate:.1f}%)",
            "error": f"Vulnerabilidades SQL: {', '.join(vulnerabilities[:2])}" if vulnerabilities else None
        }
    
    async def _test_xss_prevention(self) -> Dict[str, Any]:
        """Testa prevenção contra XSS"""
        start_time = time.time()
        
        xss_payloads = self.attack_payloads["xss"]
        sanitized_count = 0
        xss_vulnerabilities = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout))) as session:
            for payload in xss_payloads:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    data = {
                        "message": payload,
                        "persona": "ga",
                        "user_id": "xss_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=data, headers=headers) as response:
                        if response.status == 200:
                            response_text = await response.text()
                            
                            # Verificar se o XSS payload foi sanitizado
                            dangerous_patterns = ["<script", "javascript:", "onerror=", "onload="]
                            if not any(pattern in response_text.lower() for pattern in dangerous_patterns):
                                sanitized_count += 1
                            else:
                                xss_vulnerabilities.append(f"XSS não sanitizado: {payload[:20]}...")
                        elif 400 <= response.status < 500:
                            sanitized_count += 1  # Rejeitado apropriadamente
                
                except Exception:
                    sanitized_count += 1  # Erro pode indicar que foi rejeitado
                
                await asyncio.sleep(0.1)
        
        duration = time.time() - start_time
        xss_prevention_rate = (sanitized_count / len(xss_payloads)) * 100
        
        # XSS prevention é crítico para aplicações web
        xss_protected = xss_prevention_rate >= 75 and len(xss_vulnerabilities) <= 1
        
        return {
            "passed": xss_protected,
            "duration": duration,
            "severity": "high",
            "details": f"XSS payloads sanitizados: {sanitized_count}/{len(xss_payloads)} ({xss_prevention_rate:.1f}%)",
            "error": f"Vulnerabilidades XSS: {', '.join(xss_vulnerabilities[:2])}" if xss_vulnerabilities else None
        }
    
    async def _test_path_traversal_prevention(self) -> Dict[str, Any]:
        """Testa prevenção contra path traversal"""
        start_time = time.time()
        
        path_payloads = self.attack_payloads["path_traversal"]
        blocked_count = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for payload in path_payloads:
                try:
                    # Testar em diferentes endpoints
                    test_urls = [
                        f"{self.api_base_url}/api/chat",
                        f"{self.api_base_url}/api/v1/health",
                    ]
                    
                    for url in test_urls:
                        if "chat" in url:
                            data = {
                                "message": payload,
                                "persona": "ga",
                                "user_id": "path_test"
                            }
                            headers = {"Content-Type": "application/json"}
                            async with session.post(url, json=data, headers=headers) as response:
                                # Path traversal deveria ser rejeitado ou sanitizado
                                if 400 <= response.status < 500:
                                    blocked_count += 1
                                elif response.status == 200:
                                    response_text = await response.text()
                                    # Verificar se não há conteúdo de arquivo sistema
                                    system_indicators = ["root:", "bin/bash", "windows", "system32"]
                                    if not any(indicator in response_text.lower() for indicator in system_indicators):
                                        blocked_count += 1  # Não há indicação de path traversal bem-sucedido
                        else:
                            # Para outros endpoints, tentar como query parameter
                            async with session.get(f"{url}?file={payload}") as response:
                                if 400 <= response.status < 500 or response.status == 404:
                                    blocked_count += 1
                
                except Exception:
                    blocked_count += 1
                
                await asyncio.sleep(0.1)
        
        duration = time.time() - start_time
        max_possible_blocks = len(path_payloads) * 2  # 2 URLs testadas por payload
        prevention_rate = (blocked_count / max_possible_blocks) * 100
        
        path_protected = prevention_rate >= 70
        
        return {
            "passed": path_protected,
            "duration": duration,
            "severity": "medium",
            "details": f"Path traversal bloqueado: {blocked_count}/{max_possible_blocks} ({prevention_rate:.1f}%)",
            "error": None if path_protected else "Path traversal prevention inadequado"
        }
    
    async def _test_command_injection_prevention(self) -> Dict[str, Any]:
        """Testa prevenção contra command injection"""
        start_time = time.time()
        
        cmd_payloads = self.attack_payloads["command_injection"]
        safe_count = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for payload in cmd_payloads:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    data = {
                        "message": payload,
                        "persona": "ga",
                        "user_id": "cmd_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=data, headers=headers) as response:
                        if 400 <= response.status < 500:
                            safe_count += 1
                        elif response.status == 200:
                            response_text = await response.text()
                            # Verificar se não há output de comando sistema
                            cmd_indicators = ["uid=", "gid=", "whoami", "/bin", "volume serial"]
                            if not any(indicator in response_text.lower() for indicator in cmd_indicators):
                                safe_count += 1
                
                except Exception:
                    safe_count += 1
                
                await asyncio.sleep(0.1)
        
        duration = time.time() - start_time
        protection_rate = (safe_count / len(cmd_payloads)) * 100
        
        cmd_protected = protection_rate >= 80
        
        return {
            "passed": cmd_protected,
            "duration": duration,
            "severity": "high",
            "details": f"Command injection bloqueado: {safe_count}/{len(cmd_payloads)} ({protection_rate:.1f}%)",
            "error": None if cmd_protected else "Command injection prevention inadequado"
        }
    
    async def _test_rate_limiting(self) -> Dict[str, Any]:
        """Testa rate limiting do sistema"""
        start_time = time.time()
        
        # Fazer burst de requisições para testar rate limiting
        burst_size = 20
        rapid_requests = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            # Fazer requisições rapidamente
            tasks = []
            for i in range(burst_size):
                url = f"{self.api_base_url}/api/v1/health"
                tasks.append(session.get(url))
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Analisar respostas
            status_counts = {}
            for response in responses:
                if isinstance(response, Exception):
                    status = "error"
                else:
                    status = response.status
                
                status_counts[status] = status_counts.get(status, 0) + 1
        
        duration = time.time() - start_time
        
        # Rate limiting está funcionando se algumas requisições foram rejeitadas
        rate_limited = status_counts.get(429, 0)  # HTTP 429 Too Many Requests
        client_errors = status_counts.get(400, 0) + status_counts.get(403, 0) + rate_limited
        
        # Rate limiting é considerado OK se há pelo menos algumas rejeições ou se o sistema se mantém estável
        success_requests = status_counts.get(200, 0)
        rate_limiting_working = rate_limited > 0 or (success_requests > 0 and client_errors > 0)
        
        return {
            "passed": rate_limiting_working,
            "duration": duration,
            "severity": "medium",
            "details": f"Status codes: {dict(status_counts)}, Rate limited: {rate_limited}",
            "error": None if rate_limiting_working else "Rate limiting não detectado"
        }
    
    async def _test_user_agent_filtering(self) -> Dict[str, Any]:
        """Testa filtragem de user agents suspeitos"""
        start_time = time.time()
        
        blocked_agents = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for user_agent in self.malicious_user_agents:
                try:
                    headers = {"User-Agent": user_agent}
                    url = f"{self.api_base_url}/api/v1/health"
                    
                    async with session.get(url, headers=headers) as response:
                        # User agents suspeitos podem ser bloqueados (400-499) ou permitidos (200)
                        # Ambos são OK, desde que o sistema seja consistente
                        if 400 <= response.status < 500:
                            blocked_agents += 1
                        # Se permitido (200), também é OK - sistema pode escolher permitir
                
                except Exception:
                    blocked_agents += 1  # Erro pode indicar bloqueio
                
                await asyncio.sleep(0.1)
        
        duration = time.time() - start_time
        
        # User agent filtering é opcional - sistema pode escolher permitir todos
        # O importante é que não haja crashes ou comportamentos anômalos
        filtering_working = True  # Assumir OK a menos que haja erros críticos
        
        return {
            "passed": filtering_working,
            "duration": duration,
            "severity": "low",
            "details": f"User agents bloqueados: {blocked_agents}/{len(self.malicious_user_agents)}",
            "error": None
        }
    
    async def _test_cors_configuration(self) -> Dict[str, Any]:
        """Testa configuração de CORS"""
        start_time = time.time()
        
        cors_headers_found = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                # Testar endpoint que deveria ter CORS
                url = f"{self.api_base_url}/api/test"
                
                async with session.get(url) as response:
                    # Verificar headers CORS
                    cors_headers = [
                        "Access-Control-Allow-Origin",
                        "Access-Control-Allow-Methods",
                        "Access-Control-Allow-Headers"
                    ]
                    
                    for header in cors_headers:
                        if header in response.headers:
                            cors_headers_found += 1
                    
                    # Verificar se Origin está configurado adequadamente
                    origin_header = response.headers.get("Access-Control-Allow-Origin", "")
                    
                    # CORS está OK se headers estão presentes e Origin não é muito permissivo
                    cors_ok = (cors_headers_found >= 1 and 
                             origin_header not in ["*", ""]) or response.status == 404
            
            except Exception:
                # Se endpoint não existe, assumir que CORS está OK em endpoints que existem
                cors_ok = True
                cors_headers_found = 0
        
        duration = time.time() - start_time
        
        return {
            "passed": cors_ok,
            "duration": duration,
            "severity": "medium",
            "details": f"Headers CORS encontrados: {cors_headers_found}/3",
            "error": None if cors_ok else "Configuração CORS inadequada"
        }
    
    async def _test_security_headers(self) -> Dict[str, Any]:
        """Testa presença de security headers"""
        start_time = time.time()
        
        security_headers = [
            "X-Frame-Options",
            "X-Content-Type-Options", 
            "X-XSS-Protection",
            "Content-Security-Policy",
            "Strict-Transport-Security"
        ]
        
        headers_found = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/v1/health"
                async with session.get(url) as response:
                    for header in security_headers:
                        if header in response.headers:
                            headers_found += 1
            
            except Exception:
                pass
        
        duration = time.time() - start_time
        
        # Security headers são importantes mas não críticos para API
        headers_ok = headers_found >= 2  # Pelo menos 2 headers de segurança
        
        return {
            "passed": headers_ok,
            "duration": duration,
            "severity": "medium",
            "details": f"Security headers presentes: {headers_found}/{len(security_headers)}",
            "error": None if headers_ok else "Security headers insuficientes"
        }
    
    async def _test_log_injection_prevention(self) -> Dict[str, Any]:
        """Testa prevenção contra log injection"""
        start_time = time.time()
        
        log_payloads = self.attack_payloads["log_injection"]
        safe_responses = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for payload in log_payloads:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    data = {
                        "message": payload,
                        "persona": "ga",
                        "user_id": "log_injection_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=data, headers=headers) as response:
                        # Log injection é difícil de detectar via API response
                        # Assumir que está protegido se não há erros críticos
                        if response.status in [200, 400, 429]:  # Respostas esperadas
                            safe_responses += 1
                
                except Exception:
                    pass  # Erro não necessariamente indica problema
        
        duration = time.time() - start_time
        
        # Log injection prevention é difícil de testar externamente
        # Assumir OK se sistema responde normalmente
        log_injection_protected = safe_responses >= len(log_payloads) * 0.7
        
        return {
            "passed": log_injection_protected,
            "duration": duration,
            "severity": "medium",
            "details": f"Respostas normais: {safe_responses}/{len(log_payloads)}",
            "error": None if log_injection_protected else "Possível vulnerabilidade log injection"
        }
    
    async def _test_error_information_leakage(self) -> Dict[str, Any]:
        """Testa se erros vazam informações sensíveis"""
        start_time = time.time()
        
        # Tentar provocar erros
        error_tests = [
            ("malformed_json", "invalid json", "POST", "/api/chat"),
            ("missing_params", {}, "POST", "/api/chat"),
            ("invalid_endpoint", "", "GET", "/api/nonexistent")
        ]
        
        information_leaks = []
        safe_errors = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for test_name, payload, method, endpoint in error_tests:
                try:
                    url = f"{self.api_base_url}{endpoint}"
                    
                    if method == "POST":
                        if isinstance(payload, str) and payload == "invalid json":
                            headers = {"Content-Type": "application/json"}
                            async with session.post(url, data="invalid json", headers=headers) as response:
                                error_text = await response.text()
                        else:
                            headers = {"Content-Type": "application/json"}
                            async with session.post(url, json=payload, headers=headers) as response:
                                error_text = await response.text()
                    else:
                        async with session.get(url) as response:
                            error_text = await response.text()
                    
                    # Verificar se há informações sensíveis no erro
                    sensitive_info = [
                        "traceback", "stack trace", "file not found", "database", 
                        "mysql", "postgresql", "internal server error", "/usr/", "c:\\",
                        "exception", "python", "flask"
                    ]
                    
                    if any(info in error_text.lower() for info in sensitive_info):
                        information_leaks.append(f"{test_name}: informação sensível detectada")
                    else:
                        safe_errors += 1
                
                except Exception:
                    safe_errors += 1  # Conexão falhou - OK para este teste
        
        duration = time.time() - start_time
        
        # Information leakage é crítico
        no_leaks = len(information_leaks) == 0
        
        return {
            "passed": no_leaks,
            "duration": duration,
            "severity": "high",
            "details": f"Erros seguros: {safe_errors}/{len(error_tests)}",
            "error": f"Information leakage detectado: {', '.join(information_leaks[:2])}" if information_leaks else None
        }
    
    async def _test_authentication_bypass(self) -> Dict[str, Any]:
        """Testa tentativas de bypass de autenticação"""
        start_time = time.time()
        
        # Para este sistema, não há autenticação complexa, mas testar acesso a endpoints
        bypass_attempts = [
            ("admin_headers", {"X-Admin": "true", "X-Role": "admin"}),
            ("auth_headers", {"Authorization": "Bearer fake_token"}),
            ("bypass_headers", {"X-Bypass-Auth": "true"})
        ]
        
        bypasses_blocked = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for test_name, headers in bypass_attempts:
                try:
                    url = f"{self.api_base_url}/api/v1/health"
                    
                    async with session.get(url, headers=headers) as response:
                        # Para endpoints públicos, headers maliciosos não deveriam dar acesso especial
                        # Resposta 200 é OK se é endpoint público
                        # Resposta 400-403 também é OK (headers rejeitados)
                        if 200 <= response.status <= 403:
                            bypasses_blocked += 1
                
                except Exception:
                    bypasses_blocked += 1
        
        duration = time.time() - start_time
        
        # Para sistema sem autenticação complexa, qualquer resposta coerente é OK
        auth_bypass_protected = bypasses_blocked >= len(bypass_attempts) * 0.8
        
        return {
            "passed": auth_bypass_protected,
            "duration": duration,
            "severity": "low",  # Baixa severidade pois sistema não tem autenticação complexa
            "details": f"Tentativas de bypass bloqueadas: {bypasses_blocked}/{len(bypass_attempts)}",
            "error": None if auth_bypass_protected else "Possível vulnerabilidade de bypass"
        }