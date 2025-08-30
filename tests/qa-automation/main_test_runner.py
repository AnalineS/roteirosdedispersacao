#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QA Automation Suite - Runner Principal
=====================================

Suite unificada de testes que substitui TODOS os arquivos dispersos.
Executa testes locais e HML com relatórios automáticos e criação de issues.

Funcionalidades:
- Detecção automática de ambiente (local vs HML)
- Execução paralela de testes quando possível  
- Geração de relatórios markdown completos
- Criação automática de issues GitHub para falhas não-críticas
- Integração com sistema QA existente

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
Fase: 5 - Integração e Testes
"""

import sys
import os
import asyncio
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import json

# Configurar variáveis de ambiente para GitHub
# GitHub token deve ser definido via variáveis de ambiente ou GitHub Secrets
# os.environ.setdefault('GITHUB_TOKEN', 'SET_VIA_ENVIRONMENT_VARIABLES')
os.environ.setdefault('GITHUB_REPOSITORY_OWNER', 'AnalineS')
os.environ.setdefault('GITHUB_REPOSITORY_NAME', 'roteirosdedispersacao')

# Configurar encoding UTF-8 para Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# Adicionar path do projeto
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'apps', 'backend'))

# Setup logging
log_file = os.path.join(os.path.dirname(__file__), 'reports', 'test_execution.log')
os.makedirs(os.path.dirname(log_file), exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file, encoding='utf-8')
    ]
)
logger = logging.getLogger('qa_runner')

# Imports internos
from utils.environment_detector import EnvironmentDetector
from utils.report_generator import ReportGenerator
from utils.github_issues import GitHubIssueCreator

# Test scenarios
from test_scenarios.integration_e2e import IntegrationE2ETests
from test_scenarios.performance_load import PerformanceLoadTests  
from test_scenarios.security_validation import SecurityValidationTests
from test_scenarios.medical_accuracy import MedicalAccuracyTests

class QATestRunner:
    """Runner principal da suite de testes QA"""
    
    def __init__(self, environment: str = "auto"):
        self.environment = environment
        self.env_detector = EnvironmentDetector()
        self.report_generator = ReportGenerator()
        self.github_creator = GitHubIssueCreator()
        
        # Detectar ambiente real
        if environment == "auto":
            self.current_env = self.env_detector.detect_environment()
        else:
            self.current_env = environment
            
        logger.info(f"🚀 QA Test Runner inicializado - Ambiente: {self.current_env}")
        
        # Configurações por ambiente
        self.config = self._get_environment_config()
        
        # Resultados dos testes
        self.test_results = {
            "start_time": datetime.utcnow(),
            "environment": self.current_env,
            "scenarios": {},
            "summary": {},
            "issues_created": []
        }
    
    def _get_environment_config(self) -> Dict[str, Any]:
        """Configurações específicas por ambiente"""
        if self.current_env == "local":
            return {
                "api_base_url": "http://localhost:8080",
                "timeout": 10,
                "concurrent_requests": 5,
                "extensive_tests": False,
                "create_github_issues": False,
                "security_severity": "medium"
            }
        elif self.current_env == "hml":
            return {
                "api_base_url": os.getenv("HML_API_URL", "https://roteiro-dispensacao-hml-*.run.app"),
                "timeout": 30,
                "concurrent_requests": 10,
                "extensive_tests": True,
                "create_github_issues": True,
                "security_severity": "high"
            }
        else:  # development
            return {
                "api_base_url": "http://localhost:8080",
                "timeout": 15,
                "concurrent_requests": 8,
                "extensive_tests": True,
                "create_github_issues": True,
                "security_severity": "high"
            }
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Executa todos os cenários de teste"""
        logger.info(f"🎯 Iniciando execução completa - Ambiente: {self.current_env}")
        
        # Lista de cenários de teste
        test_scenarios = [
            ("integration_e2e", IntegrationE2ETests(self.config)),
            ("performance_load", PerformanceLoadTests(self.config)),
            ("security_validation", SecurityValidationTests(self.config)),
            ("medical_accuracy", MedicalAccuracyTests(self.config))
        ]
        
        # Executar cenários sequencialmente (alguns podem ser paralelos internamente)
        for scenario_name, test_instance in test_scenarios:
            logger.info(f"▶️  Executando cenário: {scenario_name}")
            
            try:
                scenario_results = await test_instance.run_tests()
                self.test_results["scenarios"][scenario_name] = scenario_results
                
                # Log progresso
                passed = scenario_results.get("passed", 0)
                total = scenario_results.get("total", 0)
                success_rate = (passed / total * 100) if total > 0 else 0
                
                logger.info(f"✅ {scenario_name}: {passed}/{total} testes passaram ({success_rate:.1f}%)")
                
            except Exception as e:
                logger.error(f"❌ Falha crítica em {scenario_name}: {e}")
                self.test_results["scenarios"][scenario_name] = {
                    "status": "critical_failure",
                    "error": str(e),
                    "passed": 0,
                    "total": 0,
                    "details": []
                }
        
        # Calcular resumo final
        self._calculate_summary()
        
        return self.test_results
    
    def _calculate_summary(self):
        """Calcula estatísticas finais dos testes"""
        total_passed = 0
        total_tests = 0
        critical_failures = 0
        warnings = 0
        
        for scenario_name, results in self.test_results["scenarios"].items():
            passed = results.get("passed", 0)
            total = results.get("total", 0)
            
            total_passed += passed
            total_tests += total
            
            if results.get("status") == "critical_failure":
                critical_failures += 1
            elif results.get("warnings", 0) > 0:
                warnings += 1
        
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.test_results["summary"] = {
            "total_tests": total_tests,
            "passed_tests": total_passed,
            "failed_tests": total_tests - total_passed,
            "success_rate": success_rate,
            "critical_failures": critical_failures,
            "warnings": warnings,
            "execution_time": (datetime.utcnow() - self.test_results["start_time"]).total_seconds(),
            "environment": self.current_env,
            "overall_status": self._get_overall_status(success_rate, critical_failures)
        }
    
    def _get_overall_status(self, success_rate: float, critical_failures: int) -> str:
        """Determina status geral dos testes"""
        if critical_failures > 0:
            return "CRITICAL_FAILURE"
        elif success_rate >= 95:
            return "SUCCESS"
        elif success_rate >= 85:
            return "SUCCESS_WITH_WARNINGS"  
        elif success_rate >= 70:
            return "NEEDS_ATTENTION"
        else:
            return "FAILURE"
    
    async def generate_reports_and_issues(self):
        """Gera relatórios e cria issues GitHub quando necessário"""
        logger.info("📋 Gerando relatórios e documentação...")
        
        # 1. Gerar relatório markdown completo
        report_path = await self.report_generator.generate_markdown_report(
            self.test_results,
            f"tests/qa_automation_suite/reports/FASE_5_VALIDATION_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        )
        logger.info(f"✅ Relatório gerado: {report_path}")
        
        # 2. Criar issues GitHub para problemas não-críticos (se habilitado)
        if self.config.get("create_github_issues", False):
            issues_created = await self._create_github_issues_for_failures()
            self.test_results["issues_created"] = issues_created
            logger.info(f"🐛 Issues GitHub criadas: {len(issues_created)}")
        
        # 3. Gerar dashboard JSON para integração
        dashboard_path = f"tests/qa_automation_suite/reports/dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        logger.info(f"📊 Dashboard JSON: {dashboard_path}")
    
    async def _create_github_issues_for_failures(self) -> List[Dict[str, Any]]:
        """Cria issues GitHub para falhas não-críticas"""
        issues = []
        
        for scenario_name, results in self.test_results["scenarios"].items():
            if results.get("status") == "critical_failure":
                continue  # Falhas críticas não criam issues automáticos
                
            failed_tests = []
            for test_detail in results.get("details", []):
                if not test_detail.get("passed", True):
                    failed_tests.append(test_detail)
            
            # Criar issue para cada conjunto de falhas por cenário
            if failed_tests:
                issue = await self.github_creator.create_issue_for_test_failures(
                    scenario_name, failed_tests, self.current_env
                )
                if issue:
                    issues.append(issue)
        
        return issues

async def main():
    """Função principal do runner"""
    parser = argparse.ArgumentParser(description="QA Automation Suite - Runner Unificado")
    parser.add_argument("--env", 
                       choices=["auto", "local", "hml", "development"], 
                       default="auto",
                       help="Ambiente de execução")
    parser.add_argument("--scenarios", 
                       nargs="+",
                       choices=["integration_e2e", "performance_load", "security_validation", "medical_accuracy"],
                       help="Cenários específicos para executar (padrão: todos)")
    parser.add_argument("--extensive", 
                       action="store_true",
                       help="Executar testes extensivos (load testing + security audit)")
    parser.add_argument("--no-reports", 
                       action="store_true",
                       help="Não gerar relatórios (apenas executar testes)")
    
    args = parser.parse_args()
    
    try:
        # Inicializar runner
        runner = QATestRunner(args.env)
        
        if args.extensive:
            runner.config["extensive_tests"] = True
            logger.info("🔥 Modo extensivo ativado")
        
        # Executar testes
        logger.info("=" * 80)
        logger.info("🚀 INICIANDO QA AUTOMATION SUITE - FASE 5")
        logger.info("=" * 80)
        
        results = await runner.run_all_tests()
        
        # Gerar relatórios
        if not args.no_reports:
            await runner.generate_reports_and_issues()
        
        # Exibir resumo final
        summary = results["summary"]
        logger.info("=" * 80)
        logger.info("📊 RESUMO FINAL DOS TESTES")
        logger.info("=" * 80)
        logger.info(f"Ambiente: {summary['environment']}")
        logger.info(f"Testes: {summary['passed_tests']}/{summary['total_tests']} passaram")
        logger.info(f"Taxa de sucesso: {summary['success_rate']:.1f}%")
        logger.info(f"Status geral: {summary['overall_status']}")
        logger.info(f"Tempo de execução: {summary['execution_time']:.1f}s")
        
        if summary["critical_failures"] > 0:
            logger.error(f"❌ FALHAS CRÍTICAS: {summary['critical_failures']}")
            
        if summary["warnings"] > 0:
            logger.warning(f"⚠️  AVISOS: {summary['warnings']}")
        
        # Código de saída
        if summary["overall_status"] in ["SUCCESS", "SUCCESS_WITH_WARNINGS"]:
            logger.info("🎉 FASE 5 - TESTES APROVADOS!")
            sys.exit(0)
        else:
            logger.error("❌ FASE 5 - TESTES REPROVADOS")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("⚠️  Execução interrompida pelo usuário")
        sys.exit(130)
    except Exception as e:
        logger.error(f"💥 Erro crítico no runner: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Executar runner principal
    asyncio.run(main())