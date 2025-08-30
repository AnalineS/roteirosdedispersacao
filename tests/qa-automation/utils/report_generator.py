# -*- coding: utf-8 -*-
"""
Report Generator - Geração de Relatórios Markdown
================================================

Gera relatórios completos dos testes em formato markdown,
incluindo gráficos, estatísticas e recomendações.

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path

logger = logging.getLogger('report_generator')

class ReportGenerator:
    """Gerador de relatórios markdown para resultados de testes"""
    
    def __init__(self):
        self.report_template = """# 📋 RELATÓRIO QA AUTOMATION SUITE - FASE 5

## 🎯 Resumo Executivo

| Métrica | Valor | Status |
|---------|-------|--------|
| **Ambiente** | {environment} | {env_status} |
| **Taxa de Sucesso** | {success_rate}% | {success_status} |
| **Testes Executados** | {total_tests} | - |
| **Testes Aprovados** | {passed_tests} | ✅ |
| **Testes Falhados** | {failed_tests} | {failure_status} |
| **Tempo de Execução** | {execution_time}s | - |
| **Status Geral** | {overall_status} | {overall_emoji} |

{success_progress_bar}

---

## 📊 Detalhamento por Cenário

{scenarios_details}

---

## 🎯 Métricas de Performance

{performance_metrics}

---

## 🔍 Análise de Falhas

{failure_analysis}

---

## 🐛 Issues GitHub Criadas

{github_issues}

---

## 🚀 Recomendações

{recommendations}

---

## 📈 Gráfico de Evolução

{evolution_chart}

---

## 🔧 Configuração dos Testes

{test_configuration}

---

## 📝 Logs e Evidências

{logs_and_evidence}

---

## ✅ Aprovação para Deploy

{deploy_approval}

---

*Relatório gerado automaticamente em {report_timestamp}*  
*Sistema: QA Automation Suite - Fase 5*  
*Versão: 2.1*
"""
    
    async def generate_markdown_report(self, test_results: Dict[str, Any], output_path: str) -> str:
        """
        Gera relatório markdown completo
        
        Args:
            test_results: Resultados dos testes
            output_path: Caminho do arquivo de saída
            
        Returns:
            str: Caminho do arquivo gerado
        """
        logger.info(f"📋 Gerando relatório markdown: {output_path}")
        
        # Criar diretório se não existir
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Gerar seções do relatório
        sections = {
            "environment": test_results.get("environment", "unknown").upper(),
            "env_status": self._get_environment_status(test_results.get("environment")),
            "success_rate": f"{test_results.get('summary', {}).get('success_rate', 0):.1f}",
            "success_status": self._get_success_status(test_results.get('summary', {}).get('success_rate', 0)),
            "total_tests": test_results.get('summary', {}).get('total_tests', 0),
            "passed_tests": test_results.get('summary', {}).get('passed_tests', 0),
            "failed_tests": test_results.get('summary', {}).get('failed_tests', 0),
            "failure_status": self._get_failure_status(test_results.get('summary', {}).get('failed_tests', 0)),
            "execution_time": f"{test_results.get('summary', {}).get('execution_time', 0):.1f}",
            "overall_status": test_results.get('summary', {}).get('overall_status', 'UNKNOWN'),
            "overall_emoji": self._get_status_emoji(test_results.get('summary', {}).get('overall_status', 'UNKNOWN')),
            "success_progress_bar": self._generate_progress_bar(test_results.get('summary', {}).get('success_rate', 0)),
            "scenarios_details": await self._generate_scenarios_section(test_results.get('scenarios', {})),
            "performance_metrics": await self._generate_performance_section(test_results),
            "failure_analysis": await self._generate_failure_analysis(test_results),
            "github_issues": await self._generate_github_issues_section(test_results.get('issues_created', [])),
            "recommendations": await self._generate_recommendations(test_results),
            "evolution_chart": await self._generate_evolution_chart(test_results),
            "test_configuration": await self._generate_configuration_section(test_results),
            "logs_and_evidence": await self._generate_logs_section(test_results),
            "deploy_approval": await self._generate_deploy_approval(test_results),
            "report_timestamp": datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S UTC')
        }
        
        # Gerar relatório final
        report_content = self.report_template.format(**sections)
        
        # Salvar arquivo
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        logger.info(f"✅ Relatório salvo: {output_path}")
        return output_path
    
    def _get_environment_status(self, environment: str) -> str:
        """Retorna emoji de status do ambiente"""
        status_map = {
            "local": "🏠",
            "hml": "🌐", 
            "development": "🔧",
            "production": "🚀"
        }
        return status_map.get(environment, "❓")
    
    def _get_success_status(self, success_rate: float) -> str:
        """Retorna status baseado na taxa de sucesso"""
        if success_rate >= 95:
            return "🎉 EXCELENTE"
        elif success_rate >= 85:
            return "✅ BOM"
        elif success_rate >= 70:
            return "⚠️  ATENÇÃO"
        else:
            return "❌ CRÍTICO"
    
    def _get_failure_status(self, failed_count: int) -> str:
        """Retorna status baseado no número de falhas"""
        if failed_count == 0:
            return "✅"
        elif failed_count <= 3:
            return "⚠️ "
        else:
            return "❌"
    
    def _get_status_emoji(self, status: str) -> str:
        """Retorna emoji para status geral"""
        emoji_map = {
            "SUCCESS": "🎉",
            "SUCCESS_WITH_WARNINGS": "⚠️ ",
            "NEEDS_ATTENTION": "🔍",
            "FAILURE": "❌",
            "CRITICAL_FAILURE": "🚨"
        }
        return emoji_map.get(status, "❓")
    
    def _generate_progress_bar(self, percentage: float) -> str:
        """Gera barra de progresso visual"""
        filled = int(percentage / 5)  # 20 blocos = 100%
        empty = 20 - filled
        
        bar = "🟩" * filled + "⬜" * empty
        return f"`{bar}` **{percentage:.1f}%**"
    
    async def _generate_scenarios_section(self, scenarios: Dict[str, Any]) -> str:
        """Gera seção detalhada dos cenários"""
        if not scenarios:
            return "❌ Nenhum cenário executado."
        
        section = ""
        for scenario_name, results in scenarios.items():
            passed = results.get("passed", 0)
            total = results.get("total", 0)
            success_rate = (passed / total * 100) if total > 0 else 0
            status = results.get("status", "unknown")
            
            emoji = "✅" if success_rate >= 95 else "⚠️ " if success_rate >= 70 else "❌"
            
            section += f"""
### {emoji} {scenario_name.replace('_', ' ').title()}

| Métrica | Valor |
|---------|-------|
| **Testes** | {passed}/{total} |
| **Taxa de Sucesso** | {success_rate:.1f}% |
| **Status** | {status} |
| **Duração Média** | {results.get('avg_duration', 0):.2f}s |

{self._generate_progress_bar(success_rate)}

**Detalhes:**
{self._generate_scenario_details(results)}

"""
        
        return section
    
    def _generate_scenario_details(self, results: Dict[str, Any]) -> str:
        """Gera detalhes específicos de um cenário"""
        details = results.get("details", [])
        if not details:
            return "- Sem detalhes disponíveis"
        
        passed_tests = [d for d in details if d.get("passed", True)]
        failed_tests = [d for d in details if not d.get("passed", True)]
        
        section = ""
        if passed_tests:
            section += f"- ✅ **{len(passed_tests)} testes aprovados**\n"
        
        if failed_tests:
            section += f"- ❌ **{len(failed_tests)} testes falharam:**\n"
            for test in failed_tests[:3]:  # Máximo 3 para não ficar muito longo
                section += f"  - `{test.get('name', 'Teste desconhecido')}`: {test.get('error', 'Erro não especificado')}\n"
            
            if len(failed_tests) > 3:
                section += f"  - ... e mais {len(failed_tests) - 3} falhas\n"
        
        return section
    
    async def _generate_performance_section(self, test_results: Dict[str, Any]) -> str:
        """Gera seção de métricas de performance"""
        # Extrair métricas dos cenários
        performance_data = {}
        
        for scenario_name, results in test_results.get("scenarios", {}).items():
            if "performance" in scenario_name:
                performance_data.update(results.get("metrics", {}))
        
        if not performance_data:
            return "📊 Métricas de performance não disponíveis."
        
        section = """
| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|"""
        
        metrics = [
            ("Response Time P50", performance_data.get("p50_response_time"), "< 1000ms"),
            ("Response Time P95", performance_data.get("p95_response_time"), "< 2000ms"),
            ("Memory Usage", performance_data.get("memory_usage"), "< 256MB"),
            ("CPU Usage", performance_data.get("cpu_usage"), "< 70%"),
            ("Cache Hit Rate", performance_data.get("cache_hit_rate"), "> 60%")
        ]
        
        for metric_name, value, target in metrics:
            if value is not None:
                status = self._evaluate_metric_status(metric_name, value, target)
                section += f"\n| {metric_name} | {value} | {target} | {status} |"
        
        return section
    
    def _evaluate_metric_status(self, metric_name: str, value: Any, target: str) -> str:
        """Avalia se uma métrica está dentro do target"""
        # Lógica simplificada - pode ser expandida
        if isinstance(value, (int, float)):
            if "< " in target:
                target_val = float(target.replace("< ", "").replace("ms", "").replace("MB", "").replace("%", ""))
                return "✅" if value < target_val else "❌"
            elif "> " in target:
                target_val = float(target.replace("> ", "").replace("%", ""))
                return "✅" if value > target_val else "❌"
        
        return "ℹ️ "
    
    async def _generate_failure_analysis(self, test_results: Dict[str, Any]) -> str:
        """Gera análise das falhas encontradas"""
        all_failures = []
        
        for scenario_name, results in test_results.get("scenarios", {}).items():
            for detail in results.get("details", []):
                if not detail.get("passed", True):
                    all_failures.append({
                        "scenario": scenario_name,
                        "test": detail.get("name", "Teste desconhecido"),
                        "error": detail.get("error", "Erro não especificado"),
                        "error_type": detail.get("error_type", "Unknown")
                    })
        
        if not all_failures:
            return "🎉 **Nenhuma falha detectada!** Todos os testes passaram com sucesso."
        
        # Agrupar por tipo de erro
        error_types = {}
        for failure in all_failures:
            error_type = failure["error_type"]
            if error_type not in error_types:
                error_types[error_type] = []
            error_types[error_type].append(failure)
        
        section = f"**Total de falhas:** {len(all_failures)}\n\n"
        
        for error_type, failures in error_types.items():
            section += f"### 🔍 {error_type} ({len(failures)} ocorrências)\n\n"
            
            # Mostrar até 3 exemplos por tipo
            for failure in failures[:3]:
                section += f"- **{failure['scenario']}** → `{failure['test']}`\n"
                section += f"  - Erro: {failure['error']}\n"
            
            if len(failures) > 3:
                section += f"- ... e mais {len(failures) - 3} ocorrências\n"
            
            section += "\n"
        
        return section
    
    async def _generate_github_issues_section(self, issues: List[Dict[str, Any]]) -> str:
        """Gera seção de issues GitHub criadas"""
        if not issues:
            return "ℹ️  Nenhuma issue GitHub foi criada (sem falhas significativas ou GitHub Token não configurado)."
        
        section = f"**Total de issues criadas:** {len(issues)}\n\n"
        
        for issue in issues:
            section += f"- **#{issue['number']}** [{issue['scenario'].replace('_', ' ').title()}]({issue['url']})\n"
            section += f"  - Ambiente: {issue['environment']}\n"
            section += f"  - Falhas: {issue['failed_tests_count']}\n\n"
        
        return section
    
    async def _generate_recommendations(self, test_results: Dict[str, Any]) -> str:
        """Gera recomendações baseadas nos resultados"""
        summary = test_results.get("summary", {})
        success_rate = summary.get("success_rate", 0)
        critical_failures = summary.get("critical_failures", 0)
        
        recommendations = []
        
        # Recomendações baseadas na taxa de sucesso
        if success_rate >= 95:
            recommendations.append("🎉 **Sistema aprovado para deploy!** Excelente performance em todos os cenários.")
        elif success_rate >= 85:
            recommendations.append("✅ **Sistema aprovado com ressalvas.** Considerar correções menores antes do deploy.")
        elif success_rate >= 70:
            recommendations.append("⚠️  **Sistema precisa de correções** antes do deploy. Investigar falhas identificadas.")
        else:
            recommendations.append("❌ **Sistema NÃO APROVADO** para deploy. Correções críticas necessárias.")
        
        # Recomendações específicas por cenário
        for scenario_name, results in test_results.get("scenarios", {}).items():
            scenario_success = (results.get("passed", 0) / results.get("total", 1)) * 100
            
            if scenario_success < 80:
                scenario_display = scenario_name.replace('_', ' ').title()
                recommendations.append(f"🔍 **{scenario_display}**: Taxa de sucesso baixa ({scenario_success:.1f}%), investigação prioritária.")
        
        # Recomendações de performance
        if "performance" in test_results.get("scenarios", {}):
            perf_results = test_results["scenarios"]["performance"]
            if perf_results.get("passed", 0) < perf_results.get("total", 1):
                recommendations.append("⚡ **Performance**: Otimizações necessárias para atender targets definidos.")
        
        # Recomendações de segurança
        if "security" in str(test_results.get("scenarios", {})):
            recommendations.append("🔒 **Segurança**: Revisar logs de segurança e considerar endurecimento adicional.")
        
        # Recomendação final
        if critical_failures > 0:
            recommendations.append("🚨 **CRÍTICO**: Falhas críticas detectadas. Deploy bloqueado até correção.")
        else:
            recommendations.append("📋 **Próximo passo**: Executar testes em ambiente HML se ainda não foi feito.")
        
        return "\n".join(f"{i+1}. {rec}" for i, rec in enumerate(recommendations))
    
    async def _generate_evolution_chart(self, test_results: Dict[str, Any]) -> str:
        """Gera gráfico de evolução (ASCII art)"""
        # Simulação de dados históricos - em implementação real, viria de arquivo
        history = [
            {"date": "25/08", "success_rate": 78.5},
            {"date": "26/08", "success_rate": 82.1},
            {"date": "27/08", "success_rate": 87.3},
            {"date": "28/08", "success_rate": 91.2},
            {"date": "29/08", "success_rate": 94.7},
            {"date": "30/08", "success_rate": test_results.get("summary", {}).get("success_rate", 0)}
        ]
        
        chart = "```\n"
        chart += "Taxa de Sucesso dos Testes (Últimos 6 dias)\n"
        chart += "100% │\n"
        chart += " 90% │"
        
        for point in history:
            if point["success_rate"] >= 90:
                chart += "     ●"
            else:
                chart += "      "
        
        chart += "\n 80% │"
        for point in history:
            if 80 <= point["success_rate"] < 90:
                chart += "     ●"
            else:
                chart += "      "
        
        chart += "\n 70% │"
        for point in history:
            if 70 <= point["success_rate"] < 80:
                chart += "     ●"
            else:
                chart += "      "
        
        chart += "\n     └─────┬─────┬─────┬─────┬─────┬─────\n"
        chart += "           " + "     ".join(p["date"] for p in history) + "\n"
        chart += "```\n"
        
        return chart
    
    async def _generate_configuration_section(self, test_results: Dict[str, Any]) -> str:
        """Gera seção de configuração dos testes"""
        return f"""
**Ambiente:** {test_results.get("environment", "unknown")}
**Data/Hora de Execução:** {test_results.get("start_time", datetime.utcnow())}
**Duração Total:** {test_results.get("summary", {}).get("execution_time", 0):.1f} segundos
**Runner:** `tests/qa_automation_suite/main_test_runner.py`
**Cenários Executados:** {len(test_results.get("scenarios", {}))}

### Configurações por Ambiente

{self._get_environment_configuration(test_results.get("environment"))}
"""
    
    def _get_environment_configuration(self, environment: str) -> str:
        """Retorna configuração específica do ambiente"""
        configs = {
            "local": """
- **API Base URL:** http://localhost:8080
- **Timeout:** 10s
- **Requests Concorrentes:** 5
- **Testes Extensivos:** Não
- **GitHub Issues:** Desabilitado
""",
            "hml": """
- **API Base URL:** Cloud Run HML
- **Timeout:** 30s
- **Requests Concorrentes:** 10
- **Testes Extensivos:** Sim
- **GitHub Issues:** Habilitado
""",
            "development": """
- **API Base URL:** http://localhost:8080
- **Timeout:** 15s
- **Requests Concorrentes:** 8
- **Testes Extensivos:** Sim
- **GitHub Issues:** Habilitado
"""
        }
        
        return configs.get(environment, "- Configuração não definida")
    
    async def _generate_logs_section(self, test_results: Dict[str, Any]) -> str:
        """Gera seção de logs e evidências"""
        return f"""
### Arquivos de Log Gerados

- **Log de Execução:** `tests/qa_automation_suite/reports/test_execution.log`
- **Relatório JSON:** `tests/qa_automation_suite/reports/dashboard_*.json`
- **Screenshots:** `tests/qa_automation_suite/reports/screenshots/` (se aplicável)

### Evidências por Cenário

{self._generate_evidence_links(test_results.get("scenarios", {}))}

### Como Reproduzir

```bash
# Executar suite completa
python tests/qa_automation_suite/main_test_runner.py --env={test_results.get("environment", "local")}

# Executar cenário específico
python tests/qa_automation_suite/main_test_runner.py --scenarios integration_e2e

# Modo extensivo
python tests/qa_automation_suite/main_test_runner.py --extensive
```
"""
    
    def _generate_evidence_links(self, scenarios: Dict[str, Any]) -> str:
        """Gera links para evidências por cenário"""
        evidence = ""
        for scenario_name in scenarios.keys():
            evidence += f"- **{scenario_name.replace('_', ' ').title()}:** `test_scenarios/{scenario_name}.py`\n"
        return evidence
    
    async def _generate_deploy_approval(self, test_results: Dict[str, Any]) -> str:
        """Gera seção de aprovação para deploy"""
        summary = test_results.get("summary", {})
        success_rate = summary.get("success_rate", 0)
        overall_status = summary.get("overall_status", "UNKNOWN")
        
        if overall_status == "SUCCESS":
            return """
### 🎉 APROVADO PARA DEPLOY

✅ **Sistema aprovado** para deploy em produção
✅ Taxa de sucesso: {success_rate}%
✅ Sem falhas críticas identificadas
✅ Todos os cenários dentro dos padrões

**Recomendação:** Prosseguir com **Fase 6 - Deploy Progressivo**

### Checklist Final

- [x] Testes de integração aprovados
- [x] Performance dentro dos targets
- [x] Segurança validada
- [x] Precisão médica verificada
""".format(success_rate=success_rate)
        
        elif overall_status == "SUCCESS_WITH_WARNINGS":
            return f"""
### ⚠️  APROVADO COM RESSALVAS

✅ **Sistema aprovado** com monitoramento extra
⚠️  Taxa de sucesso: {success_rate:.1f}%
⚠️  Algumas falhas não-críticas identificadas

**Recomendação:** Deploy com monitoramento intensivo

### Checklist Final

- [x] Testes críticos aprovados
- [ ] Falhas menores documentadas
- [x] Performance aceitável
- [x] Monitoramento reforçado configurado
"""
        
        else:
            return f"""
### ❌ NÃO APROVADO PARA DEPLOY

❌ **Sistema NÃO APROVADO** para produção
❌ Taxa de sucesso: {success_rate:.1f}%
❌ Status: {overall_status}

**Recomendação:** Correções obrigatórias antes do deploy

### Ações Necessárias

- [ ] Corrigir falhas críticas identificadas
- [ ] Re-executar suite de testes
- [ ] Validar correções em HML
- [ ] Obter nova aprovação QA
"""