# -*- coding: utf-8 -*-
"""
GitHub Issues Creator - Criação Automática de Issues
===================================================

Cria automaticamente issues GitHub para falhas de teste não-críticas,
organizadas por cenário e severidade.

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import os
import json
import logging
import aiohttp
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger('github_issues')

class GitHubIssueCreator:
    """Cria issues GitHub automaticamente para falhas de teste"""
    
    def __init__(self):
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER', 'AnalineS')
        self.repo_name = os.getenv('GITHUB_REPOSITORY_NAME', 'roteirosdedispersacao')
        self.api_base = "https://api.github.com"
        
        # Labels padrão para diferentes tipos de issue
        self.labels_by_scenario = {
            "integration_e2e": ["bug", "integration", "qa-automated"],
            "performance_load": ["performance", "optimization", "qa-automated"],
            "security_validation": ["security", "critical", "qa-automated"],
            "medical_accuracy": ["accuracy", "medical", "qa-automated"]
        }
        
        # Template de issue
        self.issue_template = """# 🤖 Falha Automática de Teste - {scenario_name}

**Ambiente:** {environment}  
**Data:** {timestamp}  
**Cenário:** {scenario_display}

## 📋 Resumo das Falhas

{failures_summary}

## 🔍 Detalhes Técnicos

{technical_details}

## 🎯 Testes que Falharam

{failed_tests_details}

## 🚀 Próximos Passos

- [ ] Investigar causa raiz das falhas
- [ ] Corrigir problemas identificados  
- [ ] Re-executar testes para validação
- [ ] Atualizar documentação se necessário

## 📊 Contexto dos Testes

- **Suite:** QA Automation Suite (Fase 5)
- **Runner:** `tests/qa_automation_suite/main_test_runner.py`
- **Cenário:** `test_scenarios/{scenario_name}.py`

---
*Issue criada automaticamente pelo QA Automation Suite*
*Para mais detalhes, consulte os logs de execução em `tests/qa_automation_suite/reports/`*
"""
        
        if not self.github_token:
            logger.warning("⚠️  GITHUB_TOKEN não encontrado, issues não serão criadas")
    
    async def create_issue_for_test_failures(self, scenario_name: str, failed_tests: List[Dict], environment: str) -> Optional[Dict]:
        """
        Cria issue GitHub para falhas de um cenário específico
        
        Args:
            scenario_name: Nome do cenário (integration_e2e, etc.)
            failed_tests: Lista de testes que falharam
            environment: Ambiente onde ocorreram as falhas
            
        Returns:
            Dict com informações da issue criada ou None se falhou
        """
        if not self.github_token:
            logger.warning("Não é possível criar issues sem GITHUB_TOKEN")
            return None
        
        if not failed_tests:
            logger.info("Nenhuma falha para criar issue")
            return None
        
        try:
            # Gerar conteúdo da issue
            issue_content = self._generate_issue_content(scenario_name, failed_tests, environment)
            
            # Criar issue via GitHub API
            issue_data = await self._create_github_issue(
                title=f"[QA] Falhas no cenário {scenario_name.replace('_', ' ').title()} - {environment}",
                body=issue_content,
                labels=self.labels_by_scenario.get(scenario_name, ["qa-automated", "bug"])
            )
            
            if issue_data:
                logger.info(f"✅ Issue criada: #{issue_data['number']} - {issue_data['html_url']}")
                return {
                    "number": issue_data['number'],
                    "url": issue_data['html_url'],
                    "scenario": scenario_name,
                    "environment": environment,
                    "failed_tests_count": len(failed_tests)
                }
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar issue para {scenario_name}: {e}")
        
        return None
    
    def _generate_issue_content(self, scenario_name: str, failed_tests: List[Dict], environment: str) -> str:
        """Gera conteúdo markdown para a issue"""
        
        # Resumo das falhas
        total_failures = len(failed_tests)
        failure_types = {}
        for test in failed_tests:
            error_type = test.get('error_type', 'Unknown')
            failure_types[error_type] = failure_types.get(error_type, 0) + 1
        
        failures_summary = f"**Total de falhas:** {total_failures}\n\n"
        for error_type, count in failure_types.items():
            failures_summary += f"- {error_type}: {count} ocorrências\n"
        
        # Detalhes técnicos
        technical_details = f"""
**Ambiente de execução:** {environment}
**Timestamp:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
**Cenário:** {scenario_name}
**Severidade:** {'🔴 Critical' if 'security' in scenario_name else '🟡 Medium'}
"""
        
        # Detalhes dos testes que falharam
        failed_tests_details = ""
        for i, test in enumerate(failed_tests, 1):
            test_name = test.get('name', f'Test #{i}')
            error_msg = test.get('error', 'Erro não especificado')
            duration = test.get('duration', 0)
            
            failed_tests_details += f"""
### {i}. {test_name}

**Erro:** `{error_msg}`  
**Duração:** {duration:.2f}s  
**Detalhes:** {test.get('details', 'Não disponível')}

```
{test.get('traceback', 'Traceback não disponível')}
```

---
"""
        
        # Substituir no template
        content = self.issue_template.format(
            scenario_name=scenario_name,
            scenario_display=scenario_name.replace('_', ' ').title(),
            environment=environment.upper(),
            timestamp=datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S'),
            failures_summary=failures_summary,
            technical_details=technical_details,
            failed_tests_details=failed_tests_details
        )
        
        return content
    
    async def _create_github_issue(self, title: str, body: str, labels: List[str]) -> Optional[Dict]:
        """Cria issue via GitHub API"""
        if not self.github_token:
            return None
        
        url = f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/issues"
        
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        }
        
        payload = {
            "title": title,
            "body": body,
            "labels": labels
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 201:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ GitHub API erro {response.status}: {error_text}")
                        return None
                        
            except Exception as e:
                logger.error(f"❌ Erro na requisição GitHub API: {e}")
                return None
    
    async def create_summary_issue(self, test_results: Dict[str, Any]) -> Optional[Dict]:
        """
        Cria issue de resumo geral quando há muitas falhas
        
        Args:
            test_results: Resultados completos dos testes
            
        Returns:
            Dict com informações da issue criada
        """
        summary = test_results.get("summary", {})
        
        # Só criar issue de resumo se houver falhas significativas
        success_rate = summary.get("success_rate", 100)
        if success_rate > 85:  # Limiar para issue de resumo
            return None
        
        failed_scenarios = []
        for scenario_name, results in test_results.get("scenarios", {}).items():
            if results.get("passed", 0) < results.get("total", 1):
                failed_scenarios.append({
                    "scenario": scenario_name,
                    "passed": results.get("passed", 0),
                    "total": results.get("total", 0),
                    "success_rate": (results.get("passed", 0) / results.get("total", 1)) * 100
                })
        
        if not failed_scenarios:
            return None
        
        # Gerar conteúdo da issue de resumo
        body = f"""
# 🚨 Resumo Geral de Falhas - QA Automation Suite

**Ambiente:** {test_results.get('environment', 'Unknown')}  
**Data:** {datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S')}  
**Taxa de Sucesso Geral:** {success_rate:.1f}%

## 📊 Estatísticas Gerais

- **Total de Testes:** {summary.get('total_tests', 0)}
- **Testes Aprovados:** {summary.get('passed_tests', 0)}
- **Testes Falhados:** {summary.get('failed_tests', 0)}
- **Falhas Críticas:** {summary.get('critical_failures', 0)}
- **Avisos:** {summary.get('warnings', 0)}

## 🎯 Cenários com Falhas

"""
        
        for scenario in failed_scenarios:
            body += f"- **{scenario['scenario'].replace('_', ' ').title()}**: {scenario['passed']}/{scenario['total']} ({scenario['success_rate']:.1f}%)\n"
        
        body += f"""

## 🚀 Recomendações

1. **Investigar cenários com < 90% de sucesso**
2. **Executar novamente após correções**
3. **Verificar logs detalhados em `tests/qa_automation_suite/reports/`**

## 📋 Issues Relacionadas

{len(test_results.get('issues_created', []))} issues específicas foram criadas automaticamente.

---
*Resumo criado automaticamente pelo QA Automation Suite*
"""
        
        return await self._create_github_issue(
            title=f"[QA] Resumo de Falhas - Taxa de Sucesso: {success_rate:.1f}%",
            body=body,
            labels=["qa-summary", "needs-attention", "qa-automated"]
        )
    
    def is_github_available(self) -> bool:
        """Verifica se GitHub API está disponível"""
        return bool(self.github_token)

# ====================== MAIN SCRIPT EXECUTION ======================

async def main():
    """Main function para execução via linha de comando"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Criar issues GitHub para falhas de teste')
    parser.add_argument('--results-file', required=True, help='Arquivo JSON com resultados dos testes')
    parser.add_argument('--repository', help='Repositório no formato owner/repo')
    parser.add_argument('--token', help='GitHub token (usa variável de ambiente se não fornecido)')
    parser.add_argument('--run-id', help='ID da execução do GitHub Actions')
    parser.add_argument('--environment', default='local', help='Ambiente de execução')
    parser.add_argument('--create-on-failure', default='true', help='Criar issues para falhas')
    parser.add_argument('--create-on-warning', default='false', help='Criar issues para warnings')
    parser.add_argument('--verbose', '-v', action='store_true', help='Output detalhado')
    
    args = parser.parse_args()
    
    # Configurar logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=level, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Verificar arquivo de resultados
    if not os.path.exists(args.results_file):
        logger.error(f"❌ Arquivo de resultados não encontrado: {args.results_file}")
        sys.exit(1)
    
    try:
        with open(args.results_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
    except Exception as e:
        logger.error(f"❌ Erro ao ler arquivo de resultados: {e}")
        sys.exit(1)
    
    # Configurar variáveis de ambiente se fornecidas
    if args.repository:
        repo_parts = args.repository.split('/')
        if len(repo_parts) == 2:
            os.environ['GITHUB_REPOSITORY_OWNER'] = repo_parts[0]
            os.environ['GITHUB_REPOSITORY_NAME'] = repo_parts[1]
    
    if args.token:
        os.environ['GITHUB_TOKEN'] = args.token
    
    # Criar instância do criador de issues
    creator = GitHubIssueCreator()
    
    if not creator.is_github_available():
        logger.error("❌ GitHub token não disponível - não é possível criar issues")
        sys.exit(1)
    
    issues_created = []
    
    # Processar resultados por cenário
    scenarios_data = results.get('scenarios', {})
    
    for scenario_name, scenario_results in scenarios_data.items():
        failed_tests = []
        
        # Extrair testes falhados
        for test in scenario_results.get('tests', []):
            if test.get('status') == 'failed':
                failed_tests.append({
                    'name': test.get('name', 'Unknown'),
                    'error': test.get('error', 'No error message'),
                    'duration': test.get('duration', 0),
                    'details': test.get('details', ''),
                    'traceback': test.get('traceback', ''),
                    'error_type': test.get('error_type', 'TestFailure')
                })
        
        # Criar issue se houver falhas (ou warnings se habilitado)
        should_create_issue = False
        
        if args.create_on_failure.lower() == 'true' and failed_tests:
            should_create_issue = True
        
        if args.create_on_warning.lower() == 'true' and scenario_results.get('warnings', 0) > 0:
            should_create_issue = True
        
        if should_create_issue:
            logger.info(f"🔍 Criando issue para cenário {scenario_name} ({len(failed_tests)} falhas)")
            
            issue_info = await creator.create_issue_for_test_failures(
                scenario_name=scenario_name,
                failed_tests=failed_tests,
                environment=args.environment
            )
            
            if issue_info:
                issues_created.append(issue_info)
    
    # Criar issue de resumo se houver muitas falhas
    summary = results.get('summary', {})
    success_rate = summary.get('success_rate', 100)
    
    if success_rate < 85 and len(issues_created) > 2:
        logger.info("📊 Criando issue de resumo geral...")
        
        summary_issue = await creator.create_summary_issue(results)
        if summary_issue:
            issues_created.append({**summary_issue, "type": "summary"})
    
    # Relatório final
    if issues_created:
        print(f"\n✅ {len(issues_created)} issues criadas com sucesso:")
        for issue in issues_created:
            issue_type = issue.get('type', 'test')
            print(f"   - #{issue['number']}: {issue['url']} ({issue_type})")
    else:
        print("\n🎯 Nenhuma issue criada (sem falhas críticas detectadas)")
    
    # Retornar código apropriado
    if success_rate < 50:  # Falhas críticas
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())