#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TESTE DE COMPATIBILIDADE DE ENDPOINTS - SOLUÇÃO DEFINITIVA
Valida 100% de compatibilidade entre frontend e backend
"""

import sys
import json
import time
import asyncio
import requests
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import argparse

def sanitize_output_path(output_path: str) -> str:
    """
    Sanitizar caminho de arquivo de saída para prevenir Path Traversal
    
    Args:
        output_path: Caminho fornecido pelo usuário
        
    Returns:
        str: Caminho sanitizado e seguro
        
    Raises:
        ValueError: Se o caminho for inseguro
    """
    if not output_path:
        raise ValueError("Caminho de saída não pode ser vazio")
    
    # Resolver caminho absoluto e normalizar
    try:
        resolved_path = Path(output_path).resolve()
    except (OSError, ValueError) as e:
        raise ValueError(f"Caminho inválido: {e}")
    
    # Obter diretório atual como base segura
    current_dir = Path.cwd().resolve()
    
    # Verificar se o caminho está dentro do diretório atual ou subdiretórios
    try:
        resolved_path.relative_to(current_dir)
    except ValueError:
        raise ValueError(
            f"Caminho inseguro: arquivo deve estar no diretório atual ou subdiretórios. "
            f"Caminho fornecido: {output_path}"
        )
    
    # Verificar extensões permitidas
    allowed_extensions = {'.json', '.txt', '.md', '.log'}
    if resolved_path.suffix.lower() not in allowed_extensions:
        raise ValueError(
            f"Extensão não permitida: {resolved_path.suffix}. "
            f"Extensões permitidas: {', '.join(allowed_extensions)}"
        )
    
    # Verificar se o diretório pai existe ou pode ser criado
    parent_dir = resolved_path.parent
    if not parent_dir.exists():
        try:
            parent_dir.mkdir(parents=True, exist_ok=True)
        except (OSError, PermissionError) as e:
            raise ValueError(f"Não foi possível criar diretório: {e}")
    
    return str(resolved_path)

@dataclass
class EndpointTest:
    """Definição de um teste de endpoint"""
    name: str
    method: str
    path: str
    headers: Dict[str, str]
    body: Optional[Dict[str, Any]] = None
    expected_status: int = 200
    required_fields: List[str] = None
    description: str = ""

@dataclass 
class TestResult:
    """Resultado de um teste"""
    endpoint: str
    method: str
    success: bool
    status_code: int
    response_time_ms: int
    error_message: Optional[str] = None
    response_data: Optional[Dict] = None
    missing_fields: List[str] = None

class EndpointCompatibilityTester:
    """Tester completo de compatibilidade de endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url.rstrip('/')
        self.results: List[TestResult] = []
        
        # Definir todos os testes baseados nas expectativas do frontend
        self.tests = [
            # Health Checks - Críticos para Cloud Run
            EndpointTest(
                name="Health Check Principal",
                method="GET",
                path="/api/v1/health",
                headers={"Content-Type": "application/json"},
                required_fields=["status", "timestamp", "api_version"],
                description="Health check principal usado pelo frontend e Cloud Run"
            ),
            EndpointTest(
                name="Liveness Probe",
                method="GET", 
                path="/api/v1/health/live",
                headers={"Content-Type": "application/json"},
                required_fields=["status", "timestamp"],
                description="Liveness probe para Kubernetes/Cloud Run"
            ),
            EndpointTest(
                name="Readiness Probe",
                method="GET",
                path="/api/v1/health/ready", 
                headers={"Content-Type": "application/json"},
                required_fields=["status", "timestamp"],
                description="Readiness probe para Kubernetes/Cloud Run"
            ),
            
            # Core API Endpoints
            EndpointTest(
                name="Get Personas",
                method="GET",
                path="/api/v1/personas",
                headers={"Content-Type": "application/json"},
                required_fields=["personas"],
                description="Busca informações das personas (esperado pelo frontend)"
            ),
            EndpointTest(
                name="Chat Dr. Gasnelio",
                method="POST",
                path="/api/v1/chat",
                headers={"Content-Type": "application/json"},
                body={
                    "question": "Qual a dose de rifampicina para um paciente de 50kg?",
                    "personality_id": "dr_gasnelio"
                },
                required_fields=["answer", "persona", "request_id"],
                description="Chat com Dr. Gasnelio (farmacêutico técnico)"
            ),
            EndpointTest(
                name="Chat Gá",
                method="POST", 
                path="/api/v1/chat",
                headers={"Content-Type": "application/json"},
                body={
                    "question": "Estou com medo de tomar a medicação, é normal?",
                    "personality_id": "ga"
                },
                required_fields=["answer", "persona", "request_id"],
                description="Chat com Gá (assistente empática)"
            ),
            EndpointTest(
                name="Scope Detection",
                method="POST",
                path="/api/v1/scope",
                headers={"Content-Type": "application/json"},
                body={
                    "question": "Como tratar hanseníase?"
                },
                required_fields=["in_scope", "confidence", "question"],
                description="Detecção de escopo (esperado pelo frontend)"
            ),
            
            # Optional Endpoints
            EndpointTest(
                name="Feedback",
                method="POST",
                path="/api/v1/feedback",
                headers={"Content-Type": "application/json"}, 
                body={
                    "rating": 5,
                    "comment": "Teste de compatibilidade"
                },
                expected_status=200,
                description="Sistema de feedback (opcional)"
            ),
            EndpointTest(
                name="Monitoring Stats",
                method="GET",
                path="/api/v1/monitoring/stats",
                headers={"Content-Type": "application/json"},
                description="Estatísticas de monitoramento (opcional)"
            ),
            EndpointTest(
                name="Documentation",
                method="GET",
                path="/api/v1/docs",
                headers={"Content-Type": "application/json"},
                description="Documentação da API (opcional)"
            ),
        ]
    
    def validate_response_structure(self, data: Dict, required_fields: List[str]) -> List[str]:
        """Valida se a resposta tem os campos obrigatórios"""
        missing_fields = []
        
        if not required_fields:
            return missing_fields
            
        for field in required_fields:
            if '.' in field:
                # Campo aninhado (ex: "personas.dr_gasnelio")
                parts = field.split('.')
                current = data
                
                for part in parts:
                    if isinstance(current, dict) and part in current:
                        current = current[part]
                    else:
                        missing_fields.append(field)
                        break
            else:
                # Campo direto
                if field not in data:
                    missing_fields.append(field)
        
        return missing_fields
    
    def test_endpoint(self, test: EndpointTest) -> TestResult:
        """Executa teste de um endpoint específico"""
        start_time = time.time()
        url = f"{self.base_url}{test.path}"
        
        try:
            # Configurar request
            kwargs = {
                'headers': test.headers,
                'timeout': 30  # 30 segundos timeout
            }
            
            if test.body:
                kwargs['json'] = test.body
            
            # Executar request
            if test.method.upper() == 'GET':
                response = requests.get(url, **kwargs)
            elif test.method.upper() == 'POST':
                response = requests.post(url, **kwargs)
            else:
                raise ValueError(f"Método {test.method} não suportado")
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            # Tentar parsear JSON
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            # Validar campos obrigatórios
            missing_fields = []
            if test.required_fields and response.status_code == test.expected_status:
                missing_fields = self.validate_response_structure(response_data, test.required_fields)
            
            # Determinar sucesso
            success = (
                response.status_code == test.expected_status and
                len(missing_fields) == 0
            )
            
            return TestResult(
                endpoint=test.path,
                method=test.method,
                success=success,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                response_data=response_data,
                missing_fields=missing_fields
            )
            
        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            
            return TestResult(
                endpoint=test.path,
                method=test.method,
                success=False,
                status_code=0,
                response_time_ms=response_time_ms,
                error_message=str(e)
            )
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Executa todos os testes e retorna relatório completo"""
        print(f"🔍 Iniciando testes de compatibilidade de endpoints...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"📋 Total de testes: {len(self.tests)}")
        print("=" * 80)
        
        start_time = time.time()
        
        for i, test in enumerate(self.tests, 1):
            print(f"\n[{i}/{len(self.tests)}] Testando: {test.name}")
            print(f"   {test.method} {test.path}")
            
            result = self.test_endpoint(test)
            self.results.append(result)
            
            # Status visual
            if result.success:
                print(f"   ✅ SUCESSO ({result.response_time_ms}ms)")
            else:
                print(f"   ❌ FALHOU ({result.response_time_ms}ms)")
                if result.error_message:
                    print(f"      Erro: {result.error_message}")
                if result.missing_fields:
                    print(f"      Campos faltando: {', '.join(result.missing_fields)}")
                if result.status_code != 0:
                    print(f"      Status HTTP: {result.status_code}")
        
        total_time = time.time() - start_time
        
        # Gerar relatório
        return self.generate_report(total_time)
    
    def generate_report(self, total_time: float) -> Dict[str, Any]:
        """Gera relatório completo dos testes"""
        passed = sum(1 for r in self.results if r.success)
        failed = len(self.results) - passed
        
        # Categorizar por tipo
        critical_tests = [r for r in self.results if '/health' in r.endpoint]
        core_tests = [r for r in self.results if r.endpoint in ['/api/v1/personas', '/api/v1/chat', '/api/v1/scope']]
        optional_tests = [r for r in self.results if r not in critical_tests and r not in core_tests]
        
        critical_passed = sum(1 for r in critical_tests if r.success)
        core_passed = sum(1 for r in core_tests if r.success)
        optional_passed = sum(1 for r in optional_tests if r.success)
        
        # Calcular score de compatibilidade
        compatibility_score = (passed / len(self.results)) * 100 if self.results else 0
        
        report = {
            "summary": {
                "total_tests": len(self.results),
                "passed": passed,
                "failed": failed,
                "success_rate": f"{compatibility_score:.1f}%",
                "total_time_seconds": round(total_time, 2),
                "compatibility_score": compatibility_score,
                "timestamp": datetime.now().isoformat()
            },
            "categories": {
                "critical": {
                    "name": "Health Checks (Críticos)",
                    "total": len(critical_tests),
                    "passed": critical_passed,
                    "success_rate": f"{(critical_passed/len(critical_tests)*100):.1f}%" if critical_tests else "N/A"
                },
                "core": {
                    "name": "Core API (Essenciais)",
                    "total": len(core_tests),
                    "passed": core_passed,
                    "success_rate": f"{(core_passed/len(core_tests)*100):.1f}%" if core_tests else "N/A"
                },
                "optional": {
                    "name": "Opcionais",
                    "total": len(optional_tests),
                    "passed": optional_passed,
                    "success_rate": f"{(optional_passed/len(optional_tests)*100):.1f}%" if optional_tests else "N/A"
                }
            },
            "detailed_results": [
                {
                    "endpoint": r.endpoint,
                    "method": r.method,
                    "success": r.success,
                    "status_code": r.status_code,
                    "response_time_ms": r.response_time_ms,
                    "error": r.error_message,
                    "missing_fields": r.missing_fields
                }
                for r in self.results
            ],
            "frontend_compatibility": {
                "personas_endpoint": any(r.endpoint == '/api/v1/personas' and r.success for r in self.results),
                "chat_endpoint": any(r.endpoint == '/api/v1/chat' and r.success for r in self.results),
                "health_endpoint": any(r.endpoint == '/api/v1/health' and r.success for r in self.results),
                "scope_endpoint": any(r.endpoint == '/api/v1/scope' and r.success for r in self.results),
                "overall_compatible": compatibility_score >= 75
            },
            "recommendations": self.generate_recommendations()
        }
        
        return report
    
    def generate_recommendations(self) -> List[str]:
        """Gera recomendações baseadas nos resultados"""
        recommendations = []
        
        # Verificar health checks
        health_results = [r for r in self.results if '/health' in r.endpoint]
        failed_health = [r for r in health_results if not r.success]
        
        if failed_health:
            recommendations.append("🚨 CRÍTICO: Health checks falhando - isso causará problemas no Cloud Run")
        
        # Verificar endpoints core
        personas_failed = not any(r.endpoint == '/api/v1/personas' and r.success for r in self.results)
        chat_failed = not any(r.endpoint == '/api/v1/chat' and r.success for r in self.results)
        scope_failed = not any(r.endpoint == '/api/v1/scope' and r.success for r in self.results)
        
        if personas_failed:
            recommendations.append("❌ Endpoint /api/v1/personas falhou - frontend não conseguirá carregar personas")
        
        if chat_failed:
            recommendations.append("❌ Endpoint /api/v1/chat falhou - funcionalidade principal do sistema não funcionará")
        
        if scope_failed:
            recommendations.append("⚠️ Endpoint /api/v1/scope falhou - detecção de escopo pode não funcionar")
        
        # Verificar campos faltando
        missing_fields_results = [r for r in self.results if r.missing_fields]
        if missing_fields_results:
            recommendations.append("📋 Alguns endpoints têm campos faltando - verifique estrutura de resposta")
        
        # Score geral
        passed = sum(1 for r in self.results if r.success)
        score = (passed / len(self.results)) * 100 if self.results else 0
        
        if score >= 90:
            recommendations.append("✅ Excelente compatibilidade! Sistema pronto para produção")
        elif score >= 75:
            recommendations.append("✅ Boa compatibilidade - alguns ajustes menores podem ser necessários")
        elif score >= 50:
            recommendations.append("⚠️ Compatibilidade moderada - vários problemas precisam ser corrigidos")
        else:
            recommendations.append("🚨 Baixa compatibilidade - revisão completa necessária")
        
        return recommendations
    
    def print_report(self, report: Dict[str, Any]):
        """Imprime relatório formatado"""
        print("\n" + "="*80)
        print("📊 RELATÓRIO DE COMPATIBILIDADE DE ENDPOINTS")
        print("="*80)
        
        # Summary
        summary = report['summary']
        print(f"\n🎯 RESUMO GERAL:")
        print(f"   Total de testes: {summary['total_tests']}")
        print(f"   Sucessos: {summary['passed']}")
        print(f"   Falhas: {summary['failed']}")
        print(f"   Taxa de sucesso: {summary['success_rate']}")
        print(f"   Score de compatibilidade: {summary['compatibility_score']:.1f}/100")
        print(f"   Tempo total: {summary['total_time_seconds']}s")
        
        # Categorias
        print(f"\n📋 POR CATEGORIA:")
        for cat_key, cat_data in report['categories'].items():
            print(f"   {cat_data['name']}: {cat_data['passed']}/{cat_data['total']} ({cat_data['success_rate']})")
        
        # Frontend compatibility
        compat = report['frontend_compatibility']
        print(f"\n🌐 COMPATIBILIDADE COM FRONTEND:")
        print(f"   Personas: {'✅' if compat['personas_endpoint'] else '❌'}")
        print(f"   Chat: {'✅' if compat['chat_endpoint'] else '❌'}")
        print(f"   Health: {'✅' if compat['health_endpoint'] else '❌'}")
        print(f"   Scope: {'✅' if compat['scope_endpoint'] else '❌'}")
        print(f"   Geral: {'✅ COMPATÍVEL' if compat['overall_compatible'] else '❌ INCOMPATÍVEL'}")
        
        # Recomendações
        print(f"\n💡 RECOMENDAÇÕES:")
        for rec in report['recommendations']:
            print(f"   {rec}")
        
        # Falhas detalhadas
        failed_results = [r for r in self.results if not r.success]
        if failed_results:
            print(f"\n❌ FALHAS DETALHADAS:")
            for result in failed_results:
                print(f"   {result.method} {result.endpoint}")
                if result.error_message:
                    print(f"      Erro: {result.error_message}")
                if result.status_code:
                    print(f"      Status: {result.status_code}")
                if result.missing_fields:
                    print(f"      Campos faltando: {', '.join(result.missing_fields)}")
        
        print("\n" + "="*80)

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Teste de compatibilidade de endpoints')
    parser.add_argument('--url', default='http://localhost:8080', 
                       help='URL base da API (default: http://localhost:8080)')
    parser.add_argument('--output', help='Arquivo para salvar relatório JSON')
    parser.add_argument('--quiet', action='store_true', help='Modo silencioso (apenas resultado final)')
    
    args = parser.parse_args()
    
    # Executar testes
    tester = EndpointCompatibilityTester(args.url)
    
    if not args.quiet:
        report = tester.run_all_tests()
        tester.print_report(report)
    else:
        # Modo silencioso
        for test in tester.tests:
            result = tester.test_endpoint(test)
            tester.results.append(result)
        
        passed = sum(1 for r in tester.results if r.success)
        score = (passed / len(tester.results)) * 100
        print(f"Compatibilidade: {score:.1f}% ({passed}/{len(tester.results)} testes)")
        
        report = tester.generate_report(0)
    
    # Salvar relatório se solicitado
    if args.output:
        try:
            # Sanitizar caminho para prevenir Path Traversal
            safe_output_path = sanitize_output_path(args.output)
            
            with open(safe_output_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Relatório salvo em: {safe_output_path}")
            
        except ValueError as e:
            print(f"\n❌ Erro de segurança: {e}")
            print("💡 Use um caminho seguro dentro do diretório atual")
            sys.exit(1)
        except (OSError, PermissionError) as e:
            print(f"\n❌ Erro ao salvar arquivo: {e}")
            sys.exit(1)
    
    # Exit code baseado no resultado
    if report['frontend_compatibility']['overall_compatible']:
        sys.exit(0)  # Sucesso
    else:
        sys.exit(1)  # Falha

if __name__ == '__main__':
    main()