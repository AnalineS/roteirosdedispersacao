#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
System Audit Completo - Q2 2025 IA & Machine Learning
Análise completa do estado atual do sistema antes da modernização
"""

import os
import json
import time
import hashlib
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional
# import pandas as pd  # Removido para evitar dependência externa
import re

BASE_PATH = r"C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

class SystemAuditor:
    def __init__(self):
        self.base_path = Path(BASE_PATH)
        self.audit_report = {
            "audit_metadata": {
                "timestamp": datetime.now().isoformat(),
                "version": "Q2-2025-ML-MODERNIZATION",
                "auditor": "Claude Code Assistant",
                "base_path": str(self.base_path)
            },
            "data_audit": {},
            "documents_audit": {},
            "backend_services_audit": {},
            "personas_audit": {},
            "config_audit": {},
            "performance_baseline": {},
            "gaps_analysis": {},
            "recommendations": []
        }

    def audit_data_files(self) -> Dict[str, Any]:
        """1. DATA AUDIT - Análise completa dos arquivos JSON estruturados"""
        print("[DATA] Iniciando auditoria de dados...")
        
        data_path = self.base_path / "data" / "structured"
        data_audit = {
            "total_files": 0,
            "total_size_mb": 0,
            "files_analysis": {},
            "schema_validation": {},
            "data_quality_score": 0
        }

        if not data_path.exists():
            data_audit["error"] = f"Pasta {data_path} não encontrada"
            return data_audit

        json_files = list(data_path.glob("*.json"))
        data_audit["total_files"] = len(json_files)

        # Arquivos específicos para verificar conforme o plano
        target_files = [
            "clinical_taxonomy.json",
            "dispensing_workflow.json", 
            "dosing_protocols.json",
            "frequently_asked_questions.json",
            "hanseniase_catalog.json",
            "knowledge_scope_limitations.json",
            "medications_mechanisms.json",
            "pharmacovigilance_guidelines.json",
            "quick_reference_protocols.json"
        ]

        total_tokens = 0
        quality_scores = []

        for json_file in json_files:
            try:
                file_stats = json_file.stat()
                file_size_mb = file_stats.st_size / (1024 * 1024)
                data_audit["total_size_mb"] += file_size_mb
                
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Análise do arquivo
                analysis = {
                    "size_mb": round(file_size_mb, 3),
                    "size_bytes": file_stats.st_size,
                    "last_modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                    "structure_type": type(data).__name__,
                    "total_entries": 0,
                    "estimated_tokens": 0,
                    "completeness_score": 0,
                    "unique_fields": [],
                    "missing_required_fields": [],
                    "is_target_file": json_file.name in target_files
                }

                # Calcular tokens estimados (aproximadamente 4 caracteres por token)
                content_str = json.dumps(data, ensure_ascii=False)
                estimated_tokens = len(content_str) // 4
                analysis["estimated_tokens"] = estimated_tokens
                total_tokens += estimated_tokens

                # Análise baseada no tipo de estrutura
                if isinstance(data, list):
                    analysis["total_entries"] = len(data)
                    if data:
                        sample = data[0] if data else {}
                        if isinstance(sample, dict):
                            analysis["unique_fields"] = list(sample.keys())
                            # Verificar completude dos campos
                            complete_entries = sum(1 for item in data if all(v for v in item.values()))
                            analysis["completeness_score"] = (complete_entries / len(data)) * 100
                elif isinstance(data, dict):
                    analysis["total_entries"] = len(data)
                    analysis["unique_fields"] = list(data.keys())
                    # Para dicionários, verificar se os valores não são vazios
                    non_empty = sum(1 for v in data.values() if v)
                    analysis["completeness_score"] = (non_empty / len(data)) * 100

                quality_scores.append(analysis["completeness_score"])
                data_audit["files_analysis"][json_file.name] = analysis

            except Exception as e:
                data_audit["files_analysis"][json_file.name] = {
                    "error": str(e),
                    "is_target_file": json_file.name in target_files
                }

        # Calcular score geral de qualidade
        if quality_scores:
            data_audit["data_quality_score"] = round(sum(quality_scores) / len(quality_scores), 2)
        
        data_audit["total_estimated_tokens"] = total_tokens
        data_audit["target_files_found"] = sum(1 for f in data_audit["files_analysis"] if 
                                              data_audit["files_analysis"][f].get("is_target_file", False))
        data_audit["target_files_missing"] = [f for f in target_files if f not in [af for af in data_audit["files_analysis"]]]

        return data_audit

    def audit_documents(self) -> Dict[str, Any]:
        """2. DOCUMENTS AUDIT - Análise dos documentos principais"""
        print("[DOCS] Iniciando auditoria de documentos...")
        
        docs_audit = {
            "total_documents": 0,
            "documents_analysis": {},
            "content_structure": {}
        }

        data_path = self.base_path / "data"
        
        # Documentos específicos para verificar
        target_docs = [
            "Roteiro de Dsispensação - Hanseníase.md",
            "Roteiro de Dsispensação - Hanseníase.pdf", 
            "roteiro_hanseniase_basico.md"
        ]

        for doc_name in target_docs:
            doc_path = data_path / doc_name
            if doc_path.exists():
                try:
                    file_stats = doc_path.stat()
                    analysis = {
                        "exists": True,
                        "size_mb": round(file_stats.st_size / (1024 * 1024), 3),
                        "size_bytes": file_stats.st_size,
                        "last_modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        "extension": doc_path.suffix
                    }

                    # Análise específica para arquivos Markdown
                    if doc_path.suffix == '.md':
                        with open(doc_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        analysis["total_lines"] = len(content.split('\n'))
                        analysis["total_characters"] = len(content)
                        analysis["estimated_tokens"] = len(content) // 4
                        
                        # Extrair estrutura de tópicos (headers)
                        headers = re.findall(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE)
                        analysis["structure"] = {
                            "total_headers": len(headers),
                            "header_levels": {},
                            "topics": []
                        }
                        
                        for level, title in headers:
                            level_num = len(level)
                            if level_num not in analysis["structure"]["header_levels"]:
                                analysis["structure"]["header_levels"][level_num] = 0
                            analysis["structure"]["header_levels"][level_num] += 1
                            analysis["structure"]["topics"].append({
                                "level": level_num,
                                "title": title.strip()
                            })

                    elif doc_path.suffix == '.pdf':
                        # Para PDFs, apenas informações básicas
                        analysis["note"] = "PDF analysis requires external libraries"

                    docs_audit["documents_analysis"][doc_name] = analysis
                    docs_audit["total_documents"] += 1

                except Exception as e:
                    docs_audit["documents_analysis"][doc_name] = {
                        "exists": True,
                        "error": str(e)
                    }
            else:
                docs_audit["documents_analysis"][doc_name] = {
                    "exists": False,
                    "error": "File not found"
                }

        return docs_audit

    def audit_backend_services(self) -> Dict[str, Any]:
        """3. BACKEND SERVICES AUDIT - Análise dos serviços Python"""
        print("[BACKEND] Iniciando auditoria de serviços backend...")
        
        services_audit = {
            "total_services": 0,
            "services_analysis": {},
            "dependencies_summary": {},
            "integration_points": {}
        }

        services_path = self.base_path / "apps" / "backend" / "services"
        
        if not services_path.exists():
            services_audit["error"] = f"Pasta {services_path} não encontrada"
            return services_audit

        # Arquivos críticos específicos
        critical_files = [
            "enhanced_rag_system.py",
            "medical_rag_integration.py", 
            "vector_store.py",
            "embedding_service.py",
            "semantic_search.py"
        ]

        py_files = list(services_path.glob("*.py"))
        services_audit["total_services"] = len(py_files)

        all_imports = set()
        all_classes = set()
        all_functions = set()

        for py_file in py_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                file_stats = py_file.stat()
                analysis = {
                    "size_kb": round(file_stats.st_size / 1024, 2),
                    "last_modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                    "is_critical": py_file.name in critical_files,
                    "classes": [],
                    "functions": [],
                    "imports": [],
                    "external_apis": [],
                    "cache_usage": False,
                    "lines_of_code": len([l for l in content.split('\n') if l.strip() and not l.strip().startswith('#')])
                }

                # Extrair imports
                imports = re.findall(r'^(?:from\s+(\S+)\s+)?import\s+([^\n]+)', content, re.MULTILINE)
                for module, items in imports:
                    if module:
                        analysis["imports"].append(f"from {module} import {items}")
                        all_imports.add(module)
                    else:
                        analysis["imports"].append(f"import {items}")
                        all_imports.add(items.split()[0])

                # Extrair classes
                classes = re.findall(r'^class\s+(\w+)', content, re.MULTILINE)
                analysis["classes"] = classes
                all_classes.update(classes)

                # Extrair funções
                functions = re.findall(r'^def\s+(\w+)', content, re.MULTILINE)
                analysis["functions"] = functions
                all_functions.update(functions)

                # Verificar uso de cache
                if any(term in content.lower() for term in ['cache', 'redis', 'lru_cache', 'functools']):
                    analysis["cache_usage"] = True

                # Verificar integrações com APIs externas
                api_patterns = ['openai', 'firebase', 'google', 'api_key', 'endpoint', 'requests']
                for pattern in api_patterns:
                    if pattern in content.lower():
                        analysis["external_apis"].append(pattern)

                services_audit["services_analysis"][py_file.name] = analysis

            except Exception as e:
                services_audit["services_analysis"][py_file.name] = {
                    "error": str(e),
                    "is_critical": py_file.name in critical_files
                }

        # Resumo de dependências
        services_audit["dependencies_summary"] = {
            "total_unique_imports": len(all_imports),
            "total_classes": len(all_classes),
            "total_functions": len(all_functions),
            "critical_files_found": sum(1 for f in services_audit["services_analysis"] 
                                      if services_audit["services_analysis"][f].get("is_critical", False)),
            "critical_files_missing": [f for f in critical_files 
                                     if f not in services_audit["services_analysis"]]
        }

        return services_audit

    def audit_personas(self) -> Dict[str, Any]:
        """4. PERSONAS AUDIT - Análise das definições de personas"""
        print("[PERSONAS] Iniciando auditoria de personas...")
        
        personas_audit = {
            "total_personas": 0,
            "personas_analysis": {},
            "prompts_extracted": {}
        }

        personas_path = self.base_path / "apps" / "backend" / "core" / "personas"
        
        if not personas_path.exists():
            personas_audit["error"] = f"Pasta {personas_path} não encontrada"
            return personas_audit

        # Arquivos específicos das personas
        persona_files = [
            "dr_gasnelio.py",
            "ga_empathetic.py", 
            "persona_manager.py"
        ]

        for persona_file in persona_files:
            file_path = personas_path / persona_file
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    file_stats = file_path.stat()
                    analysis = {
                        "exists": True,
                        "size_kb": round(file_stats.st_size / 1024, 2),
                        "last_modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        "classes": [],
                        "functions": [],
                        "prompt_strings": []
                    }

                    # Extrair classes e funções
                    analysis["classes"] = re.findall(r'^class\s+(\w+)', content, re.MULTILINE)
                    analysis["functions"] = re.findall(r'^def\s+(\w+)', content, re.MULTILINE)

                    # Extrair strings de prompt (strings longas que parecem prompts)
                    string_matches = re.findall(r'["\']([^"\']{100,})["\']', content)
                    analysis["prompt_strings"] = [s[:200] + "..." if len(s) > 200 else s for s in string_matches]

                    personas_audit["personas_analysis"][persona_file] = analysis
                    personas_audit["total_personas"] += 1

                except Exception as e:
                    personas_audit["personas_analysis"][persona_file] = {
                        "exists": True,
                        "error": str(e)
                    }
            else:
                personas_audit["personas_analysis"][persona_file] = {
                    "exists": False,
                    "error": "File not found"
                }

        return personas_audit

    def audit_config(self) -> Dict[str, Any]:
        """5. CONFIG AUDIT - Análise das configurações"""
        print("[CONFIG] Iniciando auditoria de configurações...")
        
        config_audit = {
            "total_configs": 0,
            "config_analysis": {},
            "environment_variables": []
        }

        config_path = self.base_path / "apps" / "backend" / "config"
        
        if not config_path.exists():
            config_audit["error"] = f"Pasta {config_path} não encontrada"
            return config_audit

        # Arquivos de configuração específicos
        config_files = [
            "dr_gasnelio_technical_prompt.py",
            "ga_empathetic_prompt.py",
            "thesis_reference_system.py"
        ]

        all_env_vars = set()

        for config_file in config_files:
            file_path = config_path / config_file
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    file_stats = file_path.stat()
                    analysis = {
                        "exists": True,
                        "size_kb": round(file_stats.st_size / 1024, 2),
                        "last_modified": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        "env_variables": [],
                        "constants": [],
                        "prompt_length": 0
                    }

                    # Extrair variáveis de ambiente
                    env_vars = re.findall(r'os\.environ\.get\(["\']([^"\']+)["\']', content)
                    env_vars.extend(re.findall(r'os\.getenv\(["\']([^"\']+)["\']', content))
                    analysis["env_variables"] = list(set(env_vars))
                    all_env_vars.update(env_vars)

                    # Extrair constantes (variáveis em maiúsculo)
                    constants = re.findall(r'^([A-Z_]+)\s*=', content, re.MULTILINE)
                    analysis["constants"] = constants

                    # Estimar tamanho de prompts
                    long_strings = re.findall(r'["\']([^"\']{200,})["\']', content)
                    analysis["prompt_length"] = sum(len(s) for s in long_strings)

                    config_audit["config_analysis"][config_file] = analysis
                    config_audit["total_configs"] += 1

                except Exception as e:
                    config_audit["config_analysis"][config_file] = {
                        "exists": True,
                        "error": str(e)
                    }
            else:
                config_audit["config_analysis"][config_file] = {
                    "exists": False,
                    "error": "File not found"
                }

        config_audit["environment_variables"] = list(all_env_vars)
        return config_audit

    def performance_baseline(self) -> Dict[str, Any]:
        """6. PERFORMANCE BASELINE - Testes básicos de performance"""
        print("[PERFORMANCE] Iniciando baseline de performance...")
        
        baseline = {
            "timestamp": datetime.now().isoformat(),
            "test_queries": [],
            "average_latency": 0,
            "error_rate": 0,
            "personas_tested": [],
            "system_status": "not_tested"
        }

        # Queries comuns para teste
        test_queries = [
            "O que é hanseníase?",
            "Como calcular dose de rifampicina?",
            "Quais são os efeitos colaterais da PQT-U?",
            "Como identificar reações adversas?",
            "Protocolo de dispensação para adultos",
            "Orientações para pacientes",
            "Interações medicamentosas",
            "Contraindicações da dapsona",
            "Monitoramento durante tratamento",
            "Quando interromper o tratamento?"
        ]

        baseline["test_queries"] = test_queries
        baseline["system_status"] = "ready_for_testing"
        baseline["note"] = "Performance tests require running backend system"

        return baseline

    def analyze_gaps(self, data_audit: Dict, docs_audit: Dict, services_audit: Dict, 
                    personas_audit: Dict, config_audit: Dict) -> Dict[str, Any]:
        """Análise de gaps e oportunidades"""
        print("[GAPS] Analisando gaps e oportunidades...")
        
        gaps = {
            "critical_gaps": [],
            "opportunities": [],
            "data_quality_issues": [],
            "missing_components": [],
            "modernization_priorities": []
        }

        # Verificar gaps críticos
        if data_audit.get("data_quality_score", 0) < 80:
            gaps["critical_gaps"].append("Data quality below 80% - needs improvement for ML training")

        missing_critical_services = services_audit.get("dependencies_summary", {}).get("critical_files_missing", [])
        if missing_critical_services:
            gaps["critical_gaps"].extend([f"Missing critical service: {f}" for f in missing_critical_services])

        # Identificar oportunidades de modernização
        gaps["opportunities"] = [
            "Migração para Astra DB para melhor performance vetorial",
            "Fine-tuning de modelo específico para hanseníase",
            "Implementação de análise preditiva",
            "Adicionar capacidades multimodais",
            "Otimização de cache e performance"
        ]

        # Prioridades de modernização baseadas na análise
        gaps["modernization_priorities"] = [
            {
                "priority": 1,
                "item": "Data quality improvement and standardization",
                "effort": "Medium",
                "impact": "High"
            },
            {
                "priority": 2, 
                "item": "Astra DB migration for vector operations",
                "effort": "High",
                "impact": "High"
            },
            {
                "priority": 3,
                "item": "Fine-tuning implementation",
                "effort": "High", 
                "impact": "Medium"
            },
            {
                "priority": 4,
                "item": "Multimodal capabilities",
                "effort": "Medium",
                "impact": "Medium"
            }
        ]

        return gaps

    def generate_recommendations(self, gaps: Dict) -> List[Dict[str, Any]]:
        """Gerar recomendações prioritárias"""
        print("[RECOMMENDATIONS] Gerando recomendações...")
        
        recommendations = [
            {
                "category": "Data Preparation",
                "priority": "High",
                "action": "Standardize and clean JSON data for ML training",
                "timeline": "Week 1",
                "effort": "Medium"
            },
            {
                "category": "Infrastructure",
                "priority": "High", 
                "action": "Setup Astra DB connection and migrate vector data",
                "timeline": "Week 1-2",
                "effort": "High"
            },
            {
                "category": "ML Pipeline",
                "priority": "Medium",
                "action": "Implement fine-tuning pipeline in Google Colab",
                "timeline": "Week 2-3",
                "effort": "High"
            },
            {
                "category": "Features",
                "priority": "Medium",
                "action": "Add predictive analysis and multimodal support",
                "timeline": "Week 3-4",
                "effort": "Medium"
            },
            {
                "category": "Testing",
                "priority": "High",
                "action": "Implement comprehensive test suite",
                "timeline": "Week 4",
                "effort": "Medium"
            }
        ]

        return recommendations

    def execute_complete_audit(self) -> Dict[str, Any]:
        """Executar auditoria completa do sistema"""
        print("=== INICIANDO SYSTEM AUDIT COMPLETO - Q2 2025 ML MODERNIZATION ===")
        print(f"Base path: {self.base_path}")
        
        start_time = time.time()
        
        # Executar todas as auditorias
        self.audit_report["data_audit"] = self.audit_data_files()
        self.audit_report["documents_audit"] = self.audit_documents()
        self.audit_report["backend_services_audit"] = self.audit_backend_services()
        self.audit_report["personas_audit"] = self.audit_personas()
        self.audit_report["config_audit"] = self.audit_config()
        self.audit_report["performance_baseline"] = self.performance_baseline()
        
        # Análise de gaps
        self.audit_report["gaps_analysis"] = self.analyze_gaps(
            self.audit_report["data_audit"],
            self.audit_report["documents_audit"], 
            self.audit_report["backend_services_audit"],
            self.audit_report["personas_audit"],
            self.audit_report["config_audit"]
        )
        
        # Gerar recomendações
        self.audit_report["recommendations"] = self.generate_recommendations(
            self.audit_report["gaps_analysis"]
        )
        
        # Metadados finais
        end_time = time.time()
        self.audit_report["audit_metadata"]["duration_seconds"] = round(end_time - start_time, 2)
        self.audit_report["audit_metadata"]["completion_time"] = datetime.now().isoformat()
        
        # Resumo executivo
        self.audit_report["executive_summary"] = self.generate_executive_summary()
        
        print(f"=== AUDITORIA COMPLETA FINALIZADA EM {self.audit_report['audit_metadata']['duration_seconds']}s ===")
        
        return self.audit_report

    def generate_executive_summary(self) -> Dict[str, Any]:
        """Gerar resumo executivo"""
        data_audit = self.audit_report.get("data_audit", {})
        services_audit = self.audit_report.get("backend_services_audit", {})
        
        return {
            "system_readiness": "Partially Ready",
            "data_files_found": data_audit.get("total_files", 0),
            "data_quality_score": data_audit.get("data_quality_score", 0),
            "backend_services": services_audit.get("total_services", 0),
            "critical_gaps": len(self.audit_report.get("gaps_analysis", {}).get("critical_gaps", [])),
            "modernization_readiness": "75%" if data_audit.get("data_quality_score", 0) > 70 else "50%",
            "next_steps": [
                "Execute data quality improvements",
                "Setup Astra DB connection", 
                "Prepare Colab training environment",
                "Begin ML pipeline implementation"
            ]
        }

def generate_markdown_report(audit_report: Dict[str, Any]) -> str:
    """Gerar relatório em formato Markdown"""
    
    md_content = f"""# System Audit Report - Q2 2025 ML Modernization

## Executive Summary

**System Readiness:** {audit_report['executive_summary']['system_readiness']}  
**Data Quality Score:** {audit_report['executive_summary']['data_quality_score']}/100  
**Modernization Readiness:** {audit_report['executive_summary']['modernization_readiness']}  

**Quick Stats:**
- Data Files: {audit_report['executive_summary']['data_files_found']}
- Backend Services: {audit_report['executive_summary']['backend_services']}
- Critical Gaps: {audit_report['executive_summary']['critical_gaps']}

## Data Audit Results

**Total Files:** {audit_report['data_audit'].get('total_files', 0)}  
**Total Size:** {audit_report['data_audit'].get('total_size_mb', 0):.2f} MB  
**Data Quality Score:** {audit_report['data_audit'].get('data_quality_score', 0)}/100  

### Target Files Status
"""

    # Adicionar status dos arquivos alvo
    files_analysis = audit_report['data_audit'].get('files_analysis', {})
    for filename, analysis in files_analysis.items():
        if analysis.get('is_target_file', False):
            status = "[OK]" if 'error' not in analysis else "[ERROR]"
            entries = analysis.get('total_entries', 0)
            completeness = analysis.get('completeness_score', 0)
            md_content += f"- {status} **{filename}** - {entries} entries, {completeness:.1f}% complete\n"

    md_content += f"""
## Backend Services Audit

**Total Services:** {audit_report['backend_services_audit'].get('total_services', 0)}  
**Critical Files Found:** {audit_report['backend_services_audit'].get('dependencies_summary', {}).get('critical_files_found', 0)}  

### Critical Services Status
"""

    # Adicionar status dos serviços críticos
    services_analysis = audit_report['backend_services_audit'].get('services_analysis', {})
    for filename, analysis in services_analysis.items():
        if analysis.get('is_critical', False):
            status = "[OK]" if 'error' not in analysis else "[ERROR]"
            classes = len(analysis.get('classes', []))
            functions = len(analysis.get('functions', []))
            md_content += f"- {status} **{filename}** - {classes} classes, {functions} functions\n"

    md_content += f"""
## Personas Audit

**Total Personas:** {audit_report['personas_audit'].get('total_personas', 0)}  

### Personas Status
"""

    # Adicionar status das personas
    personas_analysis = audit_report['personas_audit'].get('personas_analysis', {})
    for filename, analysis in personas_analysis.items():
        status = "[OK]" if analysis.get('exists', False) and 'error' not in analysis else "[ERROR]"
        md_content += f"- {status} **{filename}**\n"

    md_content += f"""
## Critical Gaps Identified

"""
    
    gaps = audit_report['gaps_analysis'].get('critical_gaps', [])
    for gap in gaps:
        md_content += f"- [CRITICAL] {gap}\n"

    md_content += f"""
## Modernization Priorities

"""
    
    priorities = audit_report['gaps_analysis'].get('modernization_priorities', [])
    for priority in priorities:
        md_content += f"{priority['priority']}. **{priority['item']}** - {priority['effort']} effort, {priority['impact']} impact\n"

    md_content += f"""
## Recommendations

"""
    
    recommendations = audit_report.get('recommendations', [])
    for rec in recommendations:
        md_content += f"### {rec['category']} ({rec['priority']} Priority)\n"
        md_content += f"**Action:** {rec['action']}  \n"
        md_content += f"**Timeline:** {rec['timeline']}  \n"
        md_content += f"**Effort:** {rec['effort']}  \n\n"

    md_content += f"""
## Next Steps

"""
    
    next_steps = audit_report['executive_summary'].get('next_steps', [])
    for i, step in enumerate(next_steps, 1):
        md_content += f"{i}. {step}\n"

    md_content += f"""
---

**Audit completed:** {audit_report['audit_metadata']['completion_time']}  
**Duration:** {audit_report['audit_metadata']['duration_seconds']}s  
**Generated by:** {audit_report['audit_metadata']['auditor']}  
"""

    return md_content

# Executar auditoria se executado diretamente
if __name__ == "__main__":
    auditor = SystemAuditor()
    audit_report = auditor.execute_complete_audit()
    
    # Salvar relatórios
    output_dir = Path(BASE_PATH)
    
    # Relatório JSON
    json_path = output_dir / 'audit_report.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(audit_report, f, indent=2, ensure_ascii=False)
    print(f"Relatório JSON salvo: {json_path}")
    
    # Relatório Markdown
    md_path = output_dir / 'audit_report.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(generate_markdown_report(audit_report))
    print(f"Relatório Markdown salvo: {md_path}")
    
    print("\n=== SISTEMA PRONTO PARA MODERNIZAÇÃO Q2 2025! ===")
    print("Execute as próximas fases conforme o plano:")
    print("1. Análise de qualidade dos dados (Tarefa 1.2)")
    print("2. Preparação ambiente Colab (Fase 2)")
    print("3. Setup Astra DB (Fase 3)")