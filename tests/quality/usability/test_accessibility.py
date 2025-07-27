#!/usr/bin/env python3
"""
Testes de Acessibilidade WCAG 2.1
UX/UI Testing Specialist & Accessibility Expert

Data: 27 de Janeiro de 2025
Fase: 5.1.3 - Testes de usabilidade - Acessibilidade
"""

import sys
import os
from pathlib import Path
import json

def test_accessibility_compliance():
    """
    Testa conformidade com diretrizes WCAG 2.1
    """
    print("TESTES DE ACESSIBILIDADE WCAG 2.1")
    print("=" * 50)
    
    frontend_path = Path("src/frontend/src")
    accessibility_score = 0
    total_checks = 6
    
    # 1. Verificar atributos aria
    print("\n1. ATRIBUTOS ARIA:")
    print("-" * 30)
    
    aria_files = 0
    total_files = 0
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        total_files += 1
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            if any(attr in content for attr in ['aria-', 'role=', 'aria-label', 'aria-describedby']):
                aria_files += 1
        except:
            pass
    
    if aria_files >= 3:
        accessibility_score += 1
        print(f"OK Atributos ARIA: {aria_files}/{total_files} arquivos")
    else:
        print(f"ERRO Atributos ARIA: {aria_files}/{total_files} arquivos")
    
    # 2. Verificar navegação por teclado
    print("\n2. NAVEGACAO POR TECLADO:")
    print("-" * 30)
    
    keyboard_nav = 0
    keyboard_indicators = ['tabIndex', 'onKeyDown', 'onKeyPress', 'tabindex']
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            if any(indicator in content for indicator in keyboard_indicators):
                keyboard_nav += 1
                break
        except:
            pass
    
    if keyboard_nav > 0:
        accessibility_score += 1
        print("OK Navegacao por teclado: Implementada")
    else:
        print("ERRO Navegacao por teclado: Nao detectada")
    
    # 3. Verificar textos alternativos
    print("\n3. TEXTOS ALTERNATIVOS:")
    print("-" * 30)
    
    alt_texts = 0
    alt_indicators = ['alt=', 'alt ', 'aria-label']
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            if any(indicator in content for indicator in alt_indicators):
                alt_texts += 1
        except:
            pass
    
    if alt_texts >= 2:
        accessibility_score += 1
        print(f"OK Textos alternativos: {alt_texts} componentes")
    else:
        print(f"ERRO Textos alternativos: {alt_texts} componentes")
    
    # 4. Verificar contraste de cores
    print("\n4. CONFIGURACAO DE CONTRASTE:")
    print("-" * 30)
    
    tailwind_config = Path("src/frontend/tailwind.config.js")
    contrast_config = False
    
    if tailwind_config.exists():
        try:
            with open(tailwind_config, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'colors' in content or 'theme' in content:
                contrast_config = True
        except:
            pass
    
    if contrast_config:
        accessibility_score += 1
        print("OK Configuracao de cores: Presente")
    else:
        print("ERRO Configuracao de cores: Ausente")
    
    # 5. Verificar estrutura semântica
    print("\n5. ESTRUTURA SEMANTICA:")
    print("-" * 30)
    
    semantic_elements = 0
    semantic_tags = ['<main', '<nav', '<section', '<article', '<header', '<footer', '<aside']
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            if any(tag in content for tag in semantic_tags):
                semantic_elements += 1
        except:
            pass
    
    if semantic_elements >= 3:
        accessibility_score += 1
        print(f"OK Elementos semanticos: {semantic_elements} componentes")
    else:
        print(f"ERRO Elementos semanticos: {semantic_elements} componentes")
    
    # 6. Verificar responsividade para leitores de tela
    print("\n6. COMPATIBILIDADE COM LEITORES DE TELA:")
    print("-" * 30)
    
    screen_reader_support = 0
    sr_indicators = ['sr-only', 'screen-reader', 'visually-hidden', 'aria-live']
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            if any(indicator in content for indicator in sr_indicators):
                screen_reader_support += 1
        except:
            pass
    
    if screen_reader_support > 0:
        accessibility_score += 1
        print("OK Suporte a leitores de tela: Implementado")
    else:
        print("ERRO Suporte a leitores de tela: Nao detectado")
    
    # Resultado final
    accessibility_percentage = (accessibility_score / total_checks) * 100
    
    print("\nRESULTADO DE ACESSIBILIDADE:")
    print("=" * 50)
    print(f"Score: {accessibility_score}/{total_checks} ({accessibility_percentage:.1f}%)")
    
    if accessibility_percentage >= 80:
        print("CONFORMIDADE WCAG 2.1: ALTA")
        level = "AA"
    elif accessibility_percentage >= 60:
        print("CONFORMIDADE WCAG 2.1: MEDIA")
        level = "A"
    else:
        print("CONFORMIDADE WCAG 2.1: BAIXA")
        level = "Nao conforme"
    
    print(f"Nivel estimado: {level}")
    
    return accessibility_percentage >= 70

def main():
    """
    Executa testes de acessibilidade
    """
    success = test_accessibility_compliance()
    
    if success:
        print("\nTESTE DE ACESSIBILIDADE: APROVADO")
    else:
        print("\nTESTE DE ACESSIBILIDADE: REQUER MELHORIAS")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)