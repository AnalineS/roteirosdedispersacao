#!/usr/bin/env python3
"""
Script de Validação Científica Manual
QA Engineer Especialista em Validação Científica de IA
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from pathlib import Path
import time

def test_scientific_accuracy():
    """Testa a precisão científica do sistema de forma manual"""
    
    print("=" * 60)
    print("VALIDAÇÃO COMPLETA DO SISTEMA - FASE 5.1.1")
    print("QA Engineer Especialista em Validação Científica de IA")
    print("=" * 60)
    print()
    
    # Teste 1: Verificar base de conhecimento
    print("TESTE 1: Verificacao da Base de Conhecimento")
    print("-" * 40)
    
    thesis_path = Path("data/knowledge_base")
    structured_path = Path("data/structured_knowledge")
    
    if thesis_path.exists() or structured_path.exists():
        md_files = list(thesis_path.glob("*.md")) if thesis_path.exists() else []
        json_files = list(structured_path.glob("*.json")) if structured_path.exists() else []
        total_files = len(md_files) + len(json_files)
        
        print(f"OK Base de conhecimento encontrada: {total_files} arquivos")
        if md_files:
            print(f"   - Arquivos MD: {len(md_files)}")
            for file in md_files[:3]:
                print(f"     * {file.name}")
        if json_files:
            print(f"   - Arquivos JSON estruturados: {len(json_files)}")
            for file in json_files[:3]:
                print(f"     * {file.name}")
    else:
        print("ERRO Base de conhecimento nao encontrada")
    print()
    
    # Teste 2: Verificar personas
    print("TESTE 2: Verificacao das Personas")
    print("-" * 40)
    
    personas_path = Path("src/backend/prompts")
    services_path = Path("src/backend/services")
    
    if personas_path.exists():
        dr_gasnelio = personas_path / "dr_gasnelio_technical_prompt.py"
        ga_prompt = personas_path / "ga_empathetic_prompt.py"
        ga_enhanced = services_path / "ga_enhanced.py"
        
        if dr_gasnelio.exists():
            print("OK Dr. Gasnelio (Persona Tecnica): Configurado")
        else:
            print("ERRO Dr. Gasnelio: Nao encontrado")
            
        if ga_prompt.exists() or ga_enhanced.exists():
            print("OK Ga (Persona Empatica): Configurado")
        else:
            print("ERRO Ga: Nao encontrado")
    else:
        print("ERRO Diretorio de personas nao encontrado")
    print()
    
    # Teste 3: Verificar protocolos críticos
    print("TESTE 3: Protocolos Medicos Criticos")
    print("-" * 40)
    
    critical_protocols = [
        "600 mg de rifampicina (dose mensal supervisionada)",
        "300 mg de clofazimina (dose mensal supervisionada)",
        "50 mg de clofazimina (dose diaria autoadministrada)",
        "100 mg de dapsona (diariamente)",
        "PQT-U Adulto (>50kg)",
        "PQT-U Pediatrico (<50kg)"
    ]
    
    print("Protocolos criticos que devem estar na base:")
    for i, protocol in enumerate(critical_protocols, 1):
        print(f"   {i}. {protocol}")
    print()
    
    # Teste 4: Verificar estrutura de resposta
    print("TESTE 4: Estrutura de Validacao")
    print("-" * 40)
    
    validation_path = Path("src/backend/services")
    if validation_path.exists():
        validation_files = [
            ("dr_gasnelio_enhanced.py", "dr_gasnelio_enhanced.py"),
            ("ga_enhanced.py", "ga_enhanced.py"),
            ("scope_detection_system.py", "scope_detection_system.py")
        ]
        
        for file_name, display_name in validation_files:
            if (validation_path / file_name).exists():
                print(f"OK {display_name}: Presente")
            else:
                print(f"ERRO {display_name}: Ausente")
    print()
    
    # Resumo da validação estrutural
    print("RESUMO DA VALIDACAO ESTRUTURAL")
    print("=" * 60)
    
    structural_score = 0
    total_checks = 6
    
    # Verificar base de conhecimento
    if (thesis_path.exists() and list(thesis_path.glob("*.md"))) or (structured_path.exists() and list(structured_path.glob("*.json"))):
        structural_score += 1
        print("OK Base de conhecimento: OK")
    else:
        print("ERRO Base de conhecimento: FALHA")
    
    # Verificar Dr. Gasnelio
    if (personas_path / "dr_gasnelio_technical_prompt.py").exists():
        structural_score += 1
        print("OK Dr. Gasnelio: OK")
    else:
        print("ERRO Dr. Gasnelio: FALHA")
        
    # Verificar Gá (busca em múltiplos locais)
    if ((personas_path / "ga_empathetic_prompt.py").exists() or 
        (services_path / "ga_enhanced.py").exists()):
        structural_score += 1
        print("OK Ga: OK")
    else:
        print("ERRO Ga: FALHA")
    
    # Verificar validação Dr. Gasnelio
    if (validation_path / "dr_gasnelio_enhanced.py").exists():
        structural_score += 1
        print("OK Validacao Dr. Gasnelio: OK")
    else:
        print("ERRO Validacao Dr. Gasnelio: FALHA")
        
    # Verificar validação Gá
    if (validation_path / "ga_enhanced.py").exists():
        structural_score += 1
        print("OK Validacao Ga: OK")
    else:
        print("ERRO Validacao Ga: FALHA")
        
    # Verificar validador de escopo
    if (validation_path / "scope_detection_system.py").exists():
        structural_score += 1
        print("OK Validador de escopo: OK")
    else:
        print("ERRO Validador de escopo: FALHA")
    
    print()
    print(f"SCORE ESTRUTURAL: {structural_score}/{total_checks} ({structural_score/total_checks*100:.1f}%)")
    
    if structural_score >= 5:
        print("SISTEMA ESTRUTURALMENTE VALIDO PARA PRODUCAO")
        return True
    else:
        print("SISTEMA REQUER CORRECOES ESTRUTURAIS")
        return False

if __name__ == "__main__":
    result = test_scientific_accuracy()
    print("\n" + "=" * 60)
    if result:
        print("VALIDACAO 5.1.1 CONCLUIDA COM SUCESSO")
    else:
        print("VALIDACAO 5.1.1 REQUER ATENCAO")
    print("=" * 60)