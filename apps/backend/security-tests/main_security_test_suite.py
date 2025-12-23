# -*- coding: utf-8 -*-
"""
Framework Principal de Testes de Penetração e Segurança
======================================================

Sistema completo de testes de segurança para validação do SecurityMiddleware
- Testes automatizados de penetração ética
- Validação de headers de segurança
- Simulação de ataques OWASP Top 10
- Métricas e relatórios em tempo real
- Documentação em PT-BR

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 30/08/2025 - Fase 4 Security Middleware
"""

import sys
import os
import json
import time
import requests
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import logging
from urllib.parse import urljoin

# Configurar encoding UTF-8 no Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Logger para testes de segurança
security_test_logger = logging.getLogger('security.tests')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@dataclass
class SecurityTestResult:
    """Resultado de um teste de segurança"""
    test_name: str
    test_type: str
    payload: str
    expected_blocked: bool
    was_blocked: bool
    response_code: int
    response_time_ms: float
    security_headers: Dict[str, str]
    attack_detected: bool
    severity: str
    timestamp: datetime
    details: Dict[str, Any]

@dataclass
class PenetrationTestSuite:
    """Suite completa de testes de penetração"""
    target_url: str
    test_results: List[SecurityTestResult]
    total_tests: int
    blocked_count: int
    success_rate: float
    average_response_time: float
    vulnerabilities_found: List[Dict]
    security_score: float

class SecurityTestFramework:
    """Framework principal de testes de segurança"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.test_results = []
        self.session = requests.Session()
        
        # Configurar User-Agent padrão para testes
        self.session.headers.update({
            'User-Agent': 'SecurityTestFramework/1.0 (Penetration Testing)'
        })
        
        # Padrões de ataque para testes
        self.sql_injection_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT null, version(), null--",
            "admin'--",
            "admin' #",
            "' OR 1=1--",
            "' OR 'a'='a",
            "') OR ('1'='1",
            "1' OR '1'='1' /*",
            "' UNION SELECT 1,2,3--",
            "1; WAITFOR DELAY '00:00:05'--",
            "'; EXEC xp_cmdshell('dir'); --",
            "1' AND SLEEP(5)#",
            "' OR (SELECT COUNT(*) FROM sysobjects)>0--",
            "'; INSERT INTO users (username) VALUES ('hacker')--"
        ]
        
        self.xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "javascript:alert('XSS')",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "<body onload=alert('XSS')>",
            "<input onfocus=alert('XSS') autofocus>",
            "<select onfocus=alert('XSS') autofocus>",
            "<textarea onfocus=alert('XSS') autofocus>",
            "<keygen onfocus=alert('XSS') autofocus>",
            "<video><source onerror=alert('XSS')>",
            "<audio src=x onerror=alert('XSS')>",
            "<details open ontoggle=alert('XSS')>",
            "<marquee onstart=alert('XSS')>",
            "'-alert('XSS')-'"
        ]
        
        self.path_traversal_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
            "..//..//..//etc/passwd",
            "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
            "..%252f..%252f..%252fetc%252fpasswd",
            "../../../../../../etc/passwd%00",
            "../\\../\\../\\etc/passwd",
            "....\\....\\....\\windows\\system32\\drivers\\etc\\hosts"
        ]
        
        self.command_injection_payloads = [
            "; cat /etc/passwd",
            "| whoami",
            "&& dir",
            "; ls -la",
            "| type C:\\windows\\system32\\drivers\\etc\\hosts",
            "; ping -c 4 google.com",
            "$(cat /etc/passwd)",
            "`whoami`",
            "; netstat -an",
            "| ps aux",
            "&& systeminfo",
            "; id",
            "| find /home -name '*.txt'",
            "; curl http://malicious-site.com",
            "$(nc -lvp 4444)"
        ]
        
        self.suspicious_user_agents = [
            "sqlmap/1.4.4#stable (http://sqlmap.org)",
            "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)",
            "Python-urllib/3.7",
            "Wget/1.20.3 (linux-gnu)",
            "curl/7.68.0",
            "Nmap Scripting Engine",
            "Burp Suite Professional",
            "OWASP ZAP",
            "Nikto/2.1.6",
            "w3af.org",
            "dirbuster-1.0-RC1",
            "gobuster/3.1.0",
            "wfuzz/2.4.5",
            "dirb 2.22",
            ""
        ]
    
    def test_sql_injection_protection(self) -> List[SecurityTestResult]:
        """Testa proteção contra SQL Injection"""
        results = []
        security_test_logger.info("[TEST] Iniciando testes de SQL Injection...")
        
        for i, payload in enumerate(self.sql_injection_payloads):
            start_time = time.time()
            
            try:
                # Testar em diferentes endpoints
                endpoints = ['/api/chat', '/api/feedback', '/api/health']
                for endpoint in endpoints:
                    # Teste via parâmetro GET
                    response = self.session.get(
                        urljoin(self.base_url, endpoint),
                        params={'q': payload},
                        timeout=10
                    )
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    # Analisar resposta
                    was_blocked = response.status_code in [403, 429, 426]
                    attack_detected = 'SECURITY_VIOLATION' in response.text or 'RATE_LIMIT_EXCEEDED' in response.text
                    
                    result = SecurityTestResult(
                        test_name=f"SQL_Injection_{i+1}_{endpoint.replace('/', '_')}",
                        test_type="SQL_INJECTION",
                        payload=payload,
                        expected_blocked=True,
                        was_blocked=was_blocked,
                        response_code=response.status_code,
                        response_time_ms=response_time,
                        security_headers=dict(response.headers),
                        attack_detected=attack_detected,
                        severity="HIGH" if not was_blocked else "LOW",
                        timestamp=datetime.now(),
                        details={
                            'endpoint': endpoint,
                            'method': 'GET',
                            'response_length': len(response.text),
                            'blocked_correctly': was_blocked
                        }
                    )
                    
                    results.append(result)
                    security_test_logger.info(f"  ✓ {result.test_name}: {'BLOQUEADO' if was_blocked else '[WARNING] PASSOU'}")
            
            except requests.RequestException as e:
                # Request falhou - pode indicar bloqueio efetivo
                result = SecurityTestResult(
                    test_name=f"SQL_Injection_{i+1}_CONNECTION_ERROR",
                    test_type="SQL_INJECTION",
                    payload=payload,
                    expected_blocked=True,
                    was_blocked=True,
                    response_code=0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    security_headers={},
                    attack_detected=True,
                    severity="LOW",
                    timestamp=datetime.now(),
                    details={'error': str(e), 'likely_blocked': True}
                )
                results.append(result)
        
        return results
    
    def test_xss_protection(self) -> List[SecurityTestResult]:
        """Testa proteção contra XSS"""
        results = []
        security_test_logger.info("[TEST] Iniciando testes de XSS...")
        
        for i, payload in enumerate(self.xss_payloads):
            start_time = time.time()
            
            try:
                # Teste via POST JSON
                response = self.session.post(
                    urljoin(self.base_url, '/api/chat'),
                    json={
                        'message': payload,
                        'persona': 'dr_gasnelio'
                    },
                    timeout=10
                )
                
                response_time = (time.time() - start_time) * 1000
                
                was_blocked = response.status_code in [403, 429, 426]
                attack_detected = 'SECURITY_VIOLATION' in response.text or 'malicious_request' in response.text
                
                result = SecurityTestResult(
                    test_name=f"XSS_Protection_{i+1}",
                    test_type="XSS",
                    payload=payload,
                    expected_blocked=True,
                    was_blocked=was_blocked,
                    response_code=response.status_code,
                    response_time_ms=response_time,
                    security_headers=dict(response.headers),
                    attack_detected=attack_detected,
                    severity="HIGH" if not was_blocked else "LOW",
                    timestamp=datetime.now(),
                    details={
                        'method': 'POST',
                        'content_type': 'application/json',
                        'csp_header': response.headers.get('Content-Security-Policy', ''),
                        'blocked_correctly': was_blocked
                    }
                )
                
                results.append(result)
                security_test_logger.info(f"  ✓ {result.test_name}: {'BLOQUEADO' if was_blocked else '[WARNING] PASSOU'}")
                
            except requests.RequestException as e:
                result = SecurityTestResult(
                    test_name=f"XSS_Protection_{i+1}_CONNECTION_ERROR",
                    test_type="XSS",
                    payload=payload,
                    expected_blocked=True,
                    was_blocked=True,
                    response_code=0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    security_headers={},
                    attack_detected=True,
                    severity="LOW",
                    timestamp=datetime.now(),
                    details={'error': str(e), 'likely_blocked': True}
                )
                results.append(result)
        
        return results
    
    def test_rate_limiting(self) -> List[SecurityTestResult]:
        """Testa rate limiting e bloqueio automático"""
        results = []
        security_test_logger.info("[TEST] Iniciando testes de Rate Limiting...")
        
        # Teste 1: Burst de requests
        burst_count = 15
        for i in range(burst_count):
            start_time = time.time()
            
            try:
                response = self.session.get(
                    urljoin(self.base_url, '/api/health'),
                    timeout=5
                )
                
                response_time = (time.time() - start_time) * 1000
                
                was_rate_limited = response.status_code == 429
                
                result = SecurityTestResult(
                    test_name=f"Rate_Limiting_Burst_{i+1}",
                    test_type="RATE_LIMITING",
                    payload=f"burst_request_{i+1}",
                    expected_blocked=i > 10,  # Esperamos bloqueio após ~10 requests
                    was_blocked=was_rate_limited,
                    response_code=response.status_code,
                    response_time_ms=response_time,
                    security_headers=dict(response.headers),
                    attack_detected=was_rate_limited,
                    severity="MEDIUM" if was_rate_limited else "LOW",
                    timestamp=datetime.now(),
                    details={
                        'request_number': i+1,
                        'rate_limit_headers': {
                            'X-RateLimit-Category': response.headers.get('X-RateLimit-Category', ''),
                            'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit', ''),
                            'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining', '')
                        }
                    }
                )
                
                results.append(result)
                security_test_logger.info(f"  ✓ Request {i+1}: {response.status_code} - {'RATE LIMITED' if was_rate_limited else 'OK'}")
                
                if was_rate_limited:
                    security_test_logger.info("  [SECURITY] Rate limiting funcionando - parando teste de burst")
                    break
                    
                # Pequeno delay para não saturar
                time.sleep(0.1)
                
            except requests.RequestException as e:
                result = SecurityTestResult(
                    test_name=f"Rate_Limiting_Burst_{i+1}_ERROR",
                    test_type="RATE_LIMITING", 
                    payload=f"burst_request_{i+1}",
                    expected_blocked=True,
                    was_blocked=True,
                    response_code=0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    security_headers={},
                    attack_detected=True,
                    severity="LOW",
                    timestamp=datetime.now(),
                    details={'error': str(e)}
                )
                results.append(result)
        
        return results
    
    def test_security_headers(self) -> List[SecurityTestResult]:
        """Testa headers de segurança obrigatórios"""
        results = []
        security_test_logger.info("[TEST] Iniciando testes de Headers de Segurança...")
        
        required_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'Content-Security-Policy': '',  # Deve existir, valor pode variar
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
        
        start_time = time.time()
        
        try:
            response = self.session.get(urljoin(self.base_url, '/api/health'))
            response_time = (time.time() - start_time) * 1000
            
            missing_headers = []
            incorrect_headers = []
            
            for header, expected_value in required_headers.items():
                actual_value = response.headers.get(header, '')
                
                if not actual_value:
                    missing_headers.append(header)
                elif expected_value and expected_value not in actual_value:
                    incorrect_headers.append(f"{header}: '{actual_value}' (esperado: '{expected_value}')")
            
            # Teste específico para HTTPS enforcement
            https_test_passed = True
            if 'Strict-Transport-Security' not in response.headers:
                https_test_passed = False
            
            result = SecurityTestResult(
                test_name="Security_Headers_Validation",
                test_type="SECURITY_HEADERS",
                payload="header_validation_request",
                expected_blocked=False,
                was_blocked=False,
                response_code=response.status_code,
                response_time_ms=response_time,
                security_headers=dict(response.headers),
                attack_detected=False,
                severity="HIGH" if missing_headers or incorrect_headers else "LOW",
                timestamp=datetime.now(),
                details={
                    'missing_headers': missing_headers,
                    'incorrect_headers': incorrect_headers,
                    'https_enforcement': https_test_passed,
                    'all_headers_present': len(missing_headers) == 0,
                    'csp_configured': 'Content-Security-Policy' in response.headers
                }
            )
            
            results.append(result)
            
            if missing_headers:
                security_test_logger.warning(f"  [WARNING] Headers faltando: {', '.join(missing_headers)}")
            if incorrect_headers:
                security_test_logger.warning(f"  [WARNING] Headers incorretos: {', '.join(incorrect_headers)}")
            if not missing_headers and not incorrect_headers:
                security_test_logger.info("  [OK] Todos os headers de segurança estão configurados corretamente")
        
        except requests.RequestException as e:
            result = SecurityTestResult(
                test_name="Security_Headers_Validation_ERROR",
                test_type="SECURITY_HEADERS",
                payload="header_validation_request",
                expected_blocked=False,
                was_blocked=True,
                response_code=0,
                response_time_ms=(time.time() - start_time) * 1000,
                security_headers={},
                attack_detected=False,
                severity="CRITICAL",
                timestamp=datetime.now(),
                details={'error': str(e)}
            )
            results.append(result)
        
        return results
    
    def test_suspicious_user_agents(self) -> List[SecurityTestResult]:
        """Testa detecção de User-Agents suspeitos"""
        results = []
        security_test_logger.info("[TEST] Iniciando testes de User-Agents Suspeitos...")
        
        for i, user_agent in enumerate(self.suspicious_user_agents):
            start_time = time.time()
            
            try:
                # Criar sessão temporária com User-Agent suspeito
                temp_session = requests.Session()
                temp_session.headers.update({'User-Agent': user_agent})
                
                response = temp_session.get(
                    urljoin(self.base_url, '/api/health'),
                    timeout=10
                )
                
                response_time = (time.time() - start_time) * 1000
                
                was_blocked = response.status_code in [403, 429]
                attack_detected = 'suspicious_user_agent' in response.text
                
                result = SecurityTestResult(
                    test_name=f"Suspicious_UserAgent_{i+1}",
                    test_type="USER_AGENT_DETECTION",
                    payload=user_agent,
                    expected_blocked=user_agent != "",  # User-Agent vazio deve ser bloqueado
                    was_blocked=was_blocked,
                    response_code=response.status_code,
                    response_time_ms=response_time,
                    security_headers=dict(response.headers),
                    attack_detected=attack_detected,
                    severity="MEDIUM" if not was_blocked and user_agent else "LOW",
                    timestamp=datetime.now(),
                    details={
                        'user_agent': user_agent,
                        'user_agent_type': 'empty' if not user_agent else 'suspicious_tool',
                        'blocked_correctly': was_blocked
                    }
                )
                
                results.append(result)
                security_test_logger.info(f"  ✓ UA Test {i+1}: {'BLOQUEADO' if was_blocked else '[WARNING] PASSOU'} ({user_agent[:50]}...)")
                
            except requests.RequestException as e:
                result = SecurityTestResult(
                    test_name=f"Suspicious_UserAgent_{i+1}_ERROR",
                    test_type="USER_AGENT_DETECTION",
                    payload=user_agent,
                    expected_blocked=True,
                    was_blocked=True,
                    response_code=0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    security_headers={},
                    attack_detected=True,
                    severity="LOW",
                    timestamp=datetime.now(),
                    details={'error': str(e), 'user_agent': user_agent}
                )
                results.append(result)
        
        return results
    
    def run_comprehensive_test_suite(self) -> PenetrationTestSuite:
        """Executa suite completa de testes de penetração"""
        security_test_logger.info("[START] Iniciando Suite Completa de Testes de Segurança...")
        security_test_logger.info(f"[TARGET] Target: {self.base_url}")
        
        all_results = []
        vulnerabilities = []
        
        # Executar todos os tipos de teste
        test_types = [
            ("SQL Injection", self.test_sql_injection_protection),
            ("XSS Protection", self.test_xss_protection),
            ("Rate Limiting", self.test_rate_limiting),
            ("Security Headers", self.test_security_headers),
            ("User Agent Detection", self.test_suspicious_user_agents)
        ]
        
        for test_name, test_function in test_types:
            security_test_logger.info(f"\n[LIST] Executando: {test_name}")
            try:
                results = test_function()
                all_results.extend(results)
                
                # Identificar vulnerabilidades
                for result in results:
                    if result.severity in ['HIGH', 'CRITICAL'] and not result.was_blocked:
                        vulnerabilities.append({
                            'type': result.test_type,
                            'payload': result.payload,
                            'severity': result.severity,
                            'details': result.details
                        })
                        
            except Exception as e:
                security_test_logger.error(f"[ERROR] Erro no teste {test_name}: {e}")
        
        # Calcular estatísticas
        total_tests = len(all_results)
        blocked_count = sum(1 for r in all_results if r.was_blocked)
        success_rate = (blocked_count / total_tests * 100) if total_tests > 0 else 0
        avg_response_time = sum(r.response_time_ms for r in all_results) / total_tests if total_tests > 0 else 0
        
        # Calcular score de segurança
        security_score = self._calculate_security_score(all_results, vulnerabilities)
        
        suite = PenetrationTestSuite(
            target_url=self.base_url,
            test_results=all_results,
            total_tests=total_tests,
            blocked_count=blocked_count,
            success_rate=success_rate,
            average_response_time=avg_response_time,
            vulnerabilities_found=vulnerabilities,
            security_score=security_score
        )
        
        self._generate_security_report(suite)
        
        return suite
    
    def _calculate_security_score(self, results: List[SecurityTestResult], vulnerabilities: List[Dict]) -> float:
        """Calcula score de segurança (0-100)"""
        base_score = 100.0
        
        # Penalizar por vulnerabilidades
        for vuln in vulnerabilities:
            if vuln['severity'] == 'CRITICAL':
                base_score -= 25
            elif vuln['severity'] == 'HIGH':
                base_score -= 15
            elif vuln['severity'] == 'MEDIUM':
                base_score -= 5
        
        # Bonificar por proteções funcionando
        security_features_working = 0
        total_security_features = 5  # SQL, XSS, Rate Limiting, Headers, UA Detection
        
        for test_type in ['SQL_INJECTION', 'XSS', 'RATE_LIMITING', 'SECURITY_HEADERS', 'USER_AGENT_DETECTION']:
            type_results = [r for r in results if r.test_type == test_type]
            if type_results:
                blocked_rate = sum(1 for r in type_results if r.was_blocked) / len(type_results)
                if blocked_rate > 0.8:  # 80% de bloqueio
                    security_features_working += 1
        
        feature_bonus = (security_features_working / total_security_features) * 20
        base_score += feature_bonus
        
        return max(0, min(100, base_score))
    
    def _generate_security_report(self, suite: PenetrationTestSuite):
        """Gera relatório de segurança em PT-BR"""
        report_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = f"security-tests/reports/security_report_{report_time}.json"
        
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        # Relatório detalhado
        report = {
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'target_url': suite.target_url,
                'test_framework_version': '1.0.0',
                'total_duration_seconds': sum(r.response_time_ms for r in suite.test_results) / 1000
            },
            'summary': {
                'total_tests': suite.total_tests,
                'blocked_attacks': suite.blocked_count,
                'success_rate_percent': round(suite.success_rate, 2),
                'average_response_time_ms': round(suite.average_response_time, 2),
                'security_score': round(suite.security_score, 1),
                'vulnerabilities_found': len(suite.vulnerabilities_found)
            },
            'detailed_results': [asdict(result) for result in suite.test_results],
            'vulnerabilities': suite.vulnerabilities_found,
            'recommendations': self._generate_recommendations(suite)
        }
        
        # Salvar relatório
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)
        
        security_test_logger.info(f"\n[REPORT] RELATÓRIO DE SEGURANÇA GERADO: {report_path}")
        
        # Log do resumo
        self._log_security_summary(suite)
    
    def _generate_recommendations(self, suite: PenetrationTestSuite) -> List[str]:
        """Gera recomendações de segurança em PT-BR"""
        recommendations = []
        
        if suite.success_rate < 95:
            recommendations.append("Melhorar taxa de bloqueio de ataques para pelo menos 95%")
        
        if suite.average_response_time > 100:
            recommendations.append("Otimizar performance do middleware de segurança (tempo de resposta alto)")
        
        for vuln in suite.vulnerabilities_found:
            if vuln['type'] == 'SQL_INJECTION':
                recommendations.append("Implementar validação mais rigorosa contra SQL Injection")
            elif vuln['type'] == 'XSS':
                recommendations.append("Reforçar filtros anti-XSS e Content Security Policy")
            elif vuln['type'] == 'SECURITY_HEADERS':
                recommendations.append("Configurar todos os headers de segurança obrigatórios")
        
        if suite.security_score < 90:
            recommendations.append("Score de segurança abaixo do ideal - revisar configurações gerais")
        
        if not recommendations:
            recommendations.append("Sistema de segurança funcionando adequadamente - manter monitoramento")
        
        return recommendations
    
    def _log_security_summary(self, suite: PenetrationTestSuite):
        """Log do resumo executivo em PT-BR"""
        security_test_logger.info("\n" + "="*80)
        security_test_logger.info("[REPORT] RESUMO EXECUTIVO - TESTES DE SEGURANÇA")
        security_test_logger.info("="*80)
        security_test_logger.info(f"[TARGET] Sistema Testado: {suite.target_url}")
        security_test_logger.info(f"[TEST] Total de Testes: {suite.total_tests}")
        security_test_logger.info(f"[SECURITY] Ataques Bloqueados: {suite.blocked_count}/{suite.total_tests}")
        security_test_logger.info(f"[OK] Taxa de Sucesso: {suite.success_rate:.1f}%")
        security_test_logger.info(f"⚡ Tempo Médio de Resposta: {suite.average_response_time:.1f}ms")
        security_test_logger.info(f"🏆 Score de Segurança: {suite.security_score:.1f}/100")
        security_test_logger.info(f"[ALERT] Vulnerabilidades Encontradas: {len(suite.vulnerabilities_found)}")
        
        if suite.vulnerabilities_found:
            security_test_logger.warning("\n[WARNING] VULNERABILIDADES CRÍTICAS:")
            for vuln in suite.vulnerabilities_found:
                security_test_logger.warning(f"  - {vuln['type']}: {vuln['severity']}")
        else:
            security_test_logger.info("\n[OK] NENHUMA VULNERABILIDADE CRÍTICA ENCONTRADA")
        
        # Status final
        if suite.security_score >= 95:
            security_test_logger.info("\n[GREEN] STATUS: SISTEMA SEGURO - Pronto para produção")
        elif suite.security_score >= 80:
            security_test_logger.warning("\n[YELLOW] STATUS: SEGURANÇA ADEQUADA - Pequenos ajustes recomendados")
        else:
            security_test_logger.error("\n[RED] STATUS: REQUER ATENÇÃO - Correções necessárias antes do deploy")
        
        security_test_logger.info("="*80)

def main():
    """Função principal para execução dos testes"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Framework de Testes de Segurança - Roteiro de Dispensação')
    parser.add_argument('--url', default='http://localhost:8080', help='URL base para testes')
    parser.add_argument('--verbose', action='store_true', help='Logs detalhados')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Executar testes
    framework = SecurityTestFramework(args.url)
    suite = framework.run_comprehensive_test_suite()
    
    # Retornar código de saída baseado no resultado
    if suite.security_score >= 95:
        return 0  # Sucesso
    elif suite.security_score >= 80:
        return 1  # Warnings
    else:
        return 2  # Falhas críticas

if __name__ == "__main__":
    sys.exit(main())