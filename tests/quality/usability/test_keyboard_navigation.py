#!/usr/bin/env python3
"""
Testes de Navegação por Teclado
UX/UI Testing Specialist & Accessibility Expert

Data: 27 de Janeiro de 2025
Fase: Melhorias de Usabilidade - Navegação por Teclado
"""

import sys
import os
from pathlib import Path
import re

def test_keyboard_navigation():
    """
    Testa implementação de navegação por teclado
    """
    print("TESTES DE NAVEGACAO POR TECLADO")
    print("=" * 50)
    
    frontend_path = Path("src/frontend/src")
    keyboard_score = 0
    total_checks = 6
    
    print("\n1. EVENTOS DE TECLADO IMPLEMENTADOS:")
    print("-" * 40)
    
    keyboard_events = ['onKeyDown', 'onKeyPress', 'onKeyUp']
    files_with_keyboard = 0
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            found_events = []
            for event in keyboard_events:
                if event in content:
                    found_events.append(event)
            
            if found_events:
                files_with_keyboard += 1
                print(f"OK {tsx_file.name}: {', '.join(found_events)}")
        except:
            pass
    
    if files_with_keyboard >= 3:
        keyboard_score += 1
        print(f"\nOK Eventos de teclado: {files_with_keyboard} componentes (APROVADO)")
    else:
        print(f"\nERRO Eventos de teclado: {files_with_keyboard} componentes (INSUFICIENTE)")
    
    print("\n2. TABINDEX CONFIGURADO:")
    print("-" * 40)
    
    tabindex_count = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'tabIndex' in content:
                tabindex_count += 1
                # Extrair valores de tabIndex
                tabindexes = re.findall(r'tabIndex=\{?(\-?\d+)\}?', content)
                print(f"OK {tsx_file.name}: tabIndex={', '.join(tabindexes)}")
        except:
            pass
    
    if tabindex_count >= 2:
        keyboard_score += 1
        print(f"\nOK TabIndex: {tabindex_count} componentes (APROVADO)")
    else:
        print(f"\nERRO TabIndex: {tabindex_count} componentes (INSUFICIENTE)")
    
    print("\n3. TRATAMENTO DE ENTER E ESPACO:")
    print("-" * 40)
    
    enter_space_handlers = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Procurar por tratamento de Enter e Space
            if ("key === 'Enter'" in content or "key === ' '" in content or 
                "keyCode === 13" in content or "keyCode === 32" in content):
                enter_space_handlers += 1
                print(f"OK {tsx_file.name}: Enter/Space handlers")
        except:
            pass
    
    if enter_space_handlers >= 2:
        keyboard_score += 1
        print(f"\nOK Enter/Space handlers: {enter_space_handlers} componentes (APROVADO)")
    else:
        print(f"\nERRO Enter/Space handlers: {enter_space_handlers} componentes (INSUFICIENTE)")
    
    print("\n4. ELEMENTOS FOCAVEIS:")
    print("-" * 40)
    
    focusable_elements = 0
    focusable_tags = ['button', 'input', 'textarea', 'select', 'a']
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            found_focusable = []
            for tag in focusable_tags:
                if f'<{tag}' in content:
                    found_focusable.append(tag)
            
            if found_focusable:
                focusable_elements += 1
                print(f"OK {tsx_file.name}: {', '.join(found_focusable)}")
        except:
            pass
    
    if focusable_elements >= 5:
        keyboard_score += 1
        print(f"\nOK Elementos focáveis: {focusable_elements} componentes (APROVADO)")
    else:
        print(f"\nERRO Elementos focáveis: {focusable_elements} componentes (INSUFICIENTE)")
    
    print("\n5. SKIP LINKS E NAVEGACAO:")
    print("-" * 40)
    
    # Verificar CSS para skip links
    css_file = Path("src/frontend/src/styles/globals.css")
    skip_links = False
    
    if css_file.exists():
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '.skip-link' in content:
                skip_links = True
                print("OK Skip links: Implementados no CSS")
        except:
            pass
    
    # Verificar implementação de skip links nos componentes
    skip_in_components = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'skip-link' in content or 'Skip to' in content:
                skip_in_components += 1
                print(f"OK {tsx_file.name}: Skip navigation implementado")
        except:
            pass
    
    if skip_links or skip_in_components > 0:
        keyboard_score += 1
        print(f"\nOK Skip navigation: APROVADO")
    else:
        print(f"\nERRO Skip navigation: INSUFICIENTE")
    
    print("\n6. INDICADORES DE FOCO:")
    print("-" * 40)
    
    # Verificar CSS para indicadores de foco
    focus_indicators = False
    
    if css_file.exists():
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            focus_patterns = [
                'focus:outline-none',
                'focus-visible:',
                'focus:ring',
                '.focus-ring',
                '.focus-visible-ring'
            ]
            
            found_focus = []
            for pattern in focus_patterns:
                if pattern in content:
                    found_focus.append(pattern)
            
            if found_focus:
                focus_indicators = True
                print(f"OK Indicadores de foco: {', '.join(found_focus)}")
        except:
            pass
    
    if focus_indicators:
        keyboard_score += 1
        print(f"\nOK Indicadores de foco: APROVADO")
    else:
        print(f"\nERRO Indicadores de foco: INSUFICIENTE")
    
    # Resultado final
    keyboard_percentage = (keyboard_score / total_checks) * 100
    
    print("\nRESULTADO DE NAVEGACAO POR TECLADO:")
    print("=" * 50)
    print(f"Score: {keyboard_score}/{total_checks} ({keyboard_percentage:.1f}%)")
    
    if keyboard_percentage >= 85:
        print("NAVEGACAO POR TECLADO: EXCELENTE")
        level = "Excelente"
    elif keyboard_percentage >= 70:
        print("NAVEGACAO POR TECLADO: BOA")
        level = "Boa"
    elif keyboard_percentage >= 50:
        print("NAVEGACAO POR TECLADO: BASICA")
        level = "Básica"
    else:
        print("NAVEGACAO POR TECLADO: INSUFICIENTE")
        level = "Insuficiente"
    
    print(f"Nível de acessibilidade: {level}")
    
    return keyboard_percentage >= 70

def test_keyboard_sequences():
    """
    Testa sequências comuns de navegação por teclado
    """
    print("\n\nTESTES DE SEQUENCIAS DE NAVEGACAO")
    print("=" * 50)
    
    frontend_path = Path("src/frontend/src")
    
    print("\n1. SEQUENCIAS IDENTIFICADAS:")
    print("-" * 40)
    
    # Procurar por padrões de navegação
    nav_patterns = {
        'Tab Navigation': ['tabIndex', 'onFocus', 'onBlur'],
        'Arrow Navigation': ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
        'Enter/Space': ['Enter', 'Space', 'key ==='],
        'Escape': ['Escape', 'key === \'Escape\'']
    }
    
    found_patterns = {}
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            for pattern_name, keywords in nav_patterns.items():
                if any(keyword in content for keyword in keywords):
                    if pattern_name not in found_patterns:
                        found_patterns[pattern_name] = []
                    found_patterns[pattern_name].append(tsx_file.name)
        except:
            pass
    
    for pattern, files in found_patterns.items():
        print(f"OK {pattern}: {len(files)} componentes")
        for file in files[:3]:  # Mostrar apenas os primeiros 3
            print(f"   - {file}")
        if len(files) > 3:
            print(f"   ... e mais {len(files) - 3}")
    
    return len(found_patterns) >= 2

def main():
    """
    Executa testes completos de navegação por teclado
    """
    print("=== TESTES DE NAVEGACAO POR TECLADO ===")
    print("UX/UI Testing Specialist & Accessibility Expert")
    print("Data: 27 de Janeiro de 2025")
    print("Objetivo: Verificar navegação acessível por teclado")
    print()
    
    try:
        keyboard_success = test_keyboard_navigation()
        sequences_success = test_keyboard_sequences()
        
        overall_success = keyboard_success and sequences_success
        
        print("\n" + "=" * 60)
        if overall_success:
            print("SUCESSO TESTE DE NAVEGACAO POR TECLADO: APROVADO")
            print("OK Sistema possui navegação por teclado adequada!")
            print("OK Acessibilidade de navegação aprovada")
        else:
            print("AVISO TESTE DE NAVEGACAO POR TECLADO: REQUER ATENCAO")
            if not keyboard_success:
                print("ERRO Navegação básica por teclado precisa de melhorias")
            if not sequences_success:
                print("ERRO Sequências de navegação precisam de melhorias")
        print("=" * 60)
        
        return overall_success
        
    except Exception as e:
        print(f"ERRO durante execução: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)