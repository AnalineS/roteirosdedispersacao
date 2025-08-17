#!/usr/bin/env python3
"""
Validador de Dados para Fine-tuning - Hanseníase
Verifica integridade e qualidade dos dados antes do upload para Colab
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List, Any

def validate_json_file(file_path: Path) -> Dict[str, Any]:
    """Validar arquivo JSON individual"""
    result = {
        "file": file_path.name,
        "exists": file_path.exists(),
        "valid_json": False,
        "size_kb": 0,
        "entries": 0,
        "issues": []
    }
    
    if not file_path.exists():
        result["issues"].append("Arquivo não encontrado")
        return result
    
    try:
        # Verificar tamanho
        result["size_kb"] = file_path.stat().st_size / 1024
        
        # Carregar e validar JSON
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        result["valid_json"] = True
        
        # Contar entradas
        if isinstance(data, list):
            result["entries"] = len(data)
        elif isinstance(data, dict):
            result["entries"] = len(data)
        
        # Verificações específicas
        if result["size_kb"] > 10240:  # 10MB
            result["issues"].append("Arquivo muito grande (>10MB)")
        
        if result["entries"] == 0:
            result["issues"].append("Arquivo vazio")
            
    except json.JSONDecodeError as e:
        result["issues"].append(f"JSON inválido: {e}")
    except Exception as e:
        result["issues"].append(f"Erro: {e}")
    
    return result

def validate_training_data(data_dir: Path) -> Dict[str, Any]:
    """Validar dados de treinamento"""
    print("[DATA] Validando dados de treinamento...")
    
    validation_results = {
        "training_data": {},
        "structured_data": {},
        "splits": {},
        "config": {},
        "summary": {
            "total_files": 0,
            "valid_files": 0,
            "total_size_mb": 0,
            "issues_found": 0
        }
    }
    
    # 1. Validar arquivo principal de treinamento
    training_file = data_dir / "training_data.json"
    result = validate_json_file(training_file)
    validation_results["training_data"] = result
    
    if result["valid_json"]:
        try:
            with open(training_file, 'r', encoding='utf-8') as f:
                training_data = json.load(f)
            
            # Verificar estrutura esperada
            required_keys = ["training_examples", "statistics", "metadata"]
            missing_keys = [key for key in required_keys if key not in training_data]
            
            if missing_keys:
                result["issues"].append(f"Chaves faltando: {missing_keys}")
            
            # Verificar estatísticas
            if "statistics" in training_data:
                stats = training_data["statistics"]
                total_examples = stats.get("total_examples", 0)
                
                if total_examples < 50:
                    result["issues"].append(f"Poucos exemplos: {total_examples} (mínimo: 50)")
                
                # Verificar distribuição de personas
                persona_dist = stats.get("persona_distribution", {})
                if len(persona_dist) < 2:
                    result["issues"].append("Menos de 2 personas encontradas")
                    
        except Exception as e:
            result["issues"].append(f"Erro validando estrutura: {e}")
    
    # 2. Validar dados estruturados
    structured_dir = data_dir / "structured_data"
    if structured_dir.exists():
        expected_files = [
            "clinical_taxonomy.json",
            "dosing_protocols.json", 
            "frequently_asked_questions.json",
            "medications_mechanisms.json"
        ]
        
        for file_name in expected_files:
            file_path = structured_dir / file_name
            result = validate_json_file(file_path)
            validation_results["structured_data"][file_name] = result
    
    # 3. Validar splits
    splits_dir = data_dir / "training_splits"
    if splits_dir.exists():
        split_files = ["train.json", "validation.json", "test.json"]
        
        for file_name in split_files:
            file_path = splits_dir / file_name
            result = validate_json_file(file_path)
            validation_results["splits"][file_name] = result
    
    # 4. Validar configuração
    config_file = data_dir / "config" / "training_config.json"
    result = validate_json_file(config_file)
    validation_results["config"]["training_config.json"] = result
    
    # 5. Calcular resumo
    all_results = []
    for category in ["training_data", "structured_data", "splits", "config"]:
        if isinstance(validation_results[category], dict):
            if "valid_json" in validation_results[category]:
                # Single file
                all_results.append(validation_results[category])
            else:
                # Multiple files
                all_results.extend(validation_results[category].values())
    
    summary = validation_results["summary"]
    summary["total_files"] = len(all_results)
    summary["valid_files"] = sum(1 for r in all_results if r["valid_json"])
    summary["total_size_mb"] = sum(r["size_kb"] for r in all_results) / 1024
    summary["issues_found"] = sum(len(r["issues"]) for r in all_results)
    
    return validation_results

def validate_notebook(notebook_path: Path) -> Dict[str, Any]:
    """Validar notebook do Colab"""
    result = {
        "file": notebook_path.name,
        "exists": notebook_path.exists(),
        "valid_notebook": False,
        "size_kb": 0,
        "cells": 0,
        "issues": []
    }
    
    if not notebook_path.exists():
        result["issues"].append("Notebook não encontrado")
        return result
    
    try:
        result["size_kb"] = notebook_path.stat().st_size / 1024
        
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = json.load(f)
        
        result["valid_notebook"] = True
        
        # Verificar estrutura do notebook
        if "cells" in notebook:
            result["cells"] = len(notebook["cells"])
        else:
            result["issues"].append("Notebook sem células")
        
        # Verificar metadados
        if "metadata" not in notebook:
            result["issues"].append("Metadados faltando")
        
        # Verificar se tem células de código
        code_cells = sum(1 for cell in notebook.get("cells", []) 
                        if cell.get("cell_type") == "code")
        
        if code_cells < 5:
            result["issues"].append(f"Poucas células de código: {code_cells}")
            
    except json.JSONDecodeError as e:
        result["issues"].append(f"JSON inválido: {e}")
    except Exception as e:
        result["issues"].append(f"Erro: {e}")
    
    return result

def print_validation_report(results: Dict[str, Any], notebook_result: Dict[str, Any]):
    """Imprimir relatório de validação"""
    print("\n" + "="*60)
    print("[REPORT] RELATORIO DE VALIDACAO")
    print("="*60)
    
    # Resumo geral
    summary = results["summary"]
    print(f"\n[SUMMARY] RESUMO GERAL:")
    print(f"  • Total de arquivos: {summary['total_files']}")
    print(f"  • Arquivos válidos: {summary['valid_files']}")
    print(f"  • Tamanho total: {summary['total_size_mb']:.2f} MB")
    print(f"  • Issues encontrados: {summary['issues_found']}")
    
    # Status do notebook
    print(f"\n[NOTEBOOK] NOTEBOOK:")
    status = "[OK]" if notebook_result["valid_notebook"] else "[ERROR]"
    print(f"  {status} {notebook_result['file']} ({notebook_result['size_kb']:.1f} KB)")
    print(f"      Células: {notebook_result['cells']}")
    
    if notebook_result["issues"]:
        print(f"      Issues: {notebook_result['issues']}")
    
    # Dados de treinamento
    print(f"\n[TRAINING] DADOS DE TREINAMENTO:")
    training = results["training_data"]
    status = "[OK]" if training["valid_json"] else "[ERROR]"
    print(f"  {status} {training['file']} ({training['size_kb']:.1f} KB)")
    print(f"      Entradas: {training['entries']}")
    
    if training["issues"]:
        print(f"      Issues: {training['issues']}")
    
    # Dados estruturados
    print(f"\n[STRUCTURED] DADOS ESTRUTURADOS:")
    for file_name, result in results["structured_data"].items():
        status = "[OK]" if result["valid_json"] else "[ERROR]"
        print(f"  {status} {file_name} ({result['size_kb']:.1f} KB)")
        if result["issues"]:
            print(f"      Issues: {result['issues']}")
    
    # Splits
    print(f"\n[SPLITS] TRAINING SPLITS:")
    for file_name, result in results["splits"].items():
        status = "[OK]" if result["valid_json"] else "[ERROR]"
        print(f"  {status} {file_name} ({result['entries']} exemplos)")
        if result["issues"]:
            print(f"      Issues: {result['issues']}")
    
    # Configuração
    print(f"\n[CONFIG] CONFIGURACAO:")
    config = results["config"]["training_config.json"]
    status = "[OK]" if config["valid_json"] else "[ERROR]"
    print(f"  {status} {config['file']} ({config['size_kb']:.1f} KB)")
    if config["issues"]:
        print(f"      Issues: {config['issues']}")
    
    # Recomendações
    print(f"\n[RECOMMENDATIONS] RECOMENDACOES:")
    
    total_issues = summary['issues_found'] + len(notebook_result['issues'])
    
    if total_issues == 0:
        print("  [SUCCESS] Todos os dados estão válidos!")
        print("  [READY] Pronto para upload no Colab")
    elif total_issues <= 3:
        print("  [WARNING] Issues menores encontrados")
        print("  [OPTIONAL] Corrigir antes do upload (opcional)")
    else:
        print("  [ERROR] Muitos issues encontrados")
        print("  [CRITICAL] Corrigir antes do upload (obrigatório)")
    
    print("\n" + "="*60)

def main():
    """Função principal"""
    print("[VALIDATOR] Validador de Dados para Fine-tuning Hanseniase")
    print("=" * 60)
    
    # Definir caminhos
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / "colab_training_data"
    notebook_path = base_dir / "hanseniase_fine_tuning.ipynb"
    
    print(f"[PATH] Diretorio base: {base_dir}")
    print(f"[DATA] Dados: {data_dir}")
    print(f"[NOTEBOOK] Notebook: {notebook_path}")
    
    # Verificar se diretório existe
    if not data_dir.exists():
        print(f"[ERROR] Diretorio nao encontrado: {data_dir}")
        sys.exit(1)
    
    # Executar validações
    try:
        results = validate_training_data(data_dir)
        notebook_result = validate_notebook(notebook_path)
        
        # Imprimir relatório
        print_validation_report(results, notebook_result)
        
        # Determinar código de saída
        total_issues = results["summary"]["issues_found"] + len(notebook_result["issues"])
        
        if total_issues > 5:
            print("\n[ERROR] Muitos problemas encontrados. Corrigir antes de prosseguir.")
            sys.exit(1)
        else:
            print("\n[SUCCESS] Validação concluída com sucesso!")
            sys.exit(0)
            
    except Exception as e:
        print(f"\n[ERROR] Erro durante validacao: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()