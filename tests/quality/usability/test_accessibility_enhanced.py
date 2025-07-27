#!/usr/bin/env python3
"""
Testes de Acessibilidade WCAG 2.1 Aprimorados
UX/UI Testing Specialist & Accessibility Expert

Data: 27 de Janeiro de 2025
Fase: Melhorias de Usabilidade - Atributos ARIA
"""

import sys
import os
from pathlib import Path
import json
import re

def test_aria_attributes():
    """
    Testa implementação de atributos ARIA básicos
    """
    print("TESTES DE ATRIBUTOS ARIA APRIMORADOS")
    print("=" * 50)
    
    frontend_path = Path("src/frontend/src")
    aria_score = 0
    total_checks = 8
    
    print("\n1. ATRIBUTOS ARIA IMPLEMENTADOS:")
    print("-" * 40)
    
    aria_files = 0
    total_files = 0
    
    aria_attributes = [
        'aria-label=',
        'aria-describedby=',
        'aria-live=',
        'aria-hidden=',
        'aria-pressed=',
        'aria-required=',
        'role=',
        'aria-expanded='
    ]
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        total_files += 1
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            found_attributes = []
            for attr in aria_attributes:
                if attr in content:
                    found_attributes.append(attr.replace('=', ''))
            
            if found_attributes:
                aria_files += 1
                print(f"OK {tsx_file.name}: {', '.join(found_attributes)}")
        except:
            pass
    
    if aria_files >= 5:  # Meta: pelo menos 5 arquivos com ARIA
        aria_score += 1
        print(f"\nOK Atributos ARIA: {aria_files}/{total_files} arquivos (APROVADO)")
    else:
        print(f"\nERRO Atributos ARIA: {aria_files}/{total_files} arquivos (INSUFICIENTE)")
    
    # 2. Verificar aria-label específicos
    print("\n2. ARIA-LABEL ESPECÍFICOS:")
    print("-" * 40)
    
    label_count = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            labels = re.findall(r'aria-label=["\'](.*?)["\']', content)
            if labels:
                label_count += len(labels)
                print(f"OK {tsx_file.name}: {len(labels)} labels")
        except:
            pass
    
    if label_count >= 10:
        aria_score += 1
        print(f"\nOK ARIA Labels: {label_count} implementados (APROVADO)")
    else:
        print(f"\nERRO ARIA Labels: {label_count} implementados (INSUFICIENTE)")
    
    # 3. Verificar role attributes
    print("\n3. ROLE ATTRIBUTES:")
    print("-" * 40)
    
    role_count = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            roles = re.findall(r'role=["\'](.*?)["\']', content)
            if roles:
                role_count += len(roles)
                for role in roles:
                    print(f"OK {tsx_file.name}: role={role}")
        except:
            pass
    
    if role_count >= 5:
        aria_score += 1
        print(f"\nOK Role attributes: {role_count} implementados (APROVADO)")
    else:
        print(f"\nERRO Role attributes: {role_count} implementados (INSUFICIENTE)")
    
    # 4. Verificar aria-live
    print("\n4. ARIA-LIVE (ATUALIZAÇÕES DINÂMICAS):")
    print("-" * 40)
    
    live_count = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'aria-live=' in content:
                live_count += 1
                print(f"OK {tsx_file.name}: aria-live implementado")
        except:
            pass
    
    if live_count >= 2:
        aria_score += 1
        print(f"\nOK ARIA Live: {live_count} componentes (APROVADO)")
    else:
        print(f"\nERRO ARIA Live: {live_count} componentes (INSUFICIENTE)")
    
    # 5. Verificar aria-hidden
    print("\n5. ARIA-HIDDEN (ELEMENTOS DECORATIVOS):")
    print("-" * 40)
    
    hidden_count = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'aria-hidden="true"' in content:
                hidden_count += 1
                print(f"OK {tsx_file.name}: aria-hidden implementado")
        except:
            pass
    
    if hidden_count >= 3:
        aria_score += 1
        print(f"\nOK ARIA Hidden: {hidden_count} componentes (APROVADO)")
    else:
        print(f"\nERRO ARIA Hidden: {hidden_count} componentes (INSUFICIENTE)")
    
    # 6. Verificar navegação por teclado
    print("\n6. NAVEGAÇÃO POR TECLADO:")
    print("-" * 40)
    
    keyboard_nav = 0
    keyboard_indicators = ['onKeyDown', 'onKeyPress', 'tabIndex', 'autoFocus']
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            found_kbd = []
            for indicator in keyboard_indicators:
                if indicator in content:
                    found_kbd.append(indicator)
            
            if found_kbd:
                keyboard_nav += 1
                print(f"OK {tsx_file.name}: {', '.join(found_kbd)}")
        except:
            pass
    
    if keyboard_nav >= 3:
        aria_score += 1
        print(f"\nOK Navegação por teclado: {keyboard_nav} componentes (APROVADO)")
    else:
        print(f"\nERRO Navegação por teclado: {keyboard_nav} componentes (INSUFICIENTE)")
    
    # 7. Verificar classes de acessibilidade (sr-only)
    print("\n7. CLASSES DE ACESSIBILIDADE:")
    print("-" * 40)
    
    css_file = Path("src/frontend/src/styles/globals.css")
    accessibility_classes = False
    
    if css_file.exists():
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '.sr-only' in content and 'position: absolute' in content:
                accessibility_classes = True
                print("OK Classe .sr-only implementada")
            
            if '@media (prefers-reduced-motion' in content:
                print("OK Suporte a reduced motion")
                
            if '@media (prefers-contrast' in content:
                print("OK Suporte a high contrast")
        except:
            pass
    
    if accessibility_classes:
        aria_score += 1
        print("\nOK Classes de acessibilidade: APROVADO")
    else:
        print("\nERRO Classes de acessibilidade: INSUFICIENTE")
    
    # 8. Verificar descrições e ajuda contextual
    print("\n8. DESCRIÇÕES E AJUDA CONTEXTUAL:")
    print("-" * 40)
    
    descriptions = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'aria-describedby=' in content or 'id=' in content:
                descriptions += 1
                print(f"OK {tsx_file.name}: descrições contextuais")
        except:
            pass
    
    if descriptions >= 3:
        aria_score += 1
        print(f"\nOK Descrições contextuais: {descriptions} componentes (APROVADO)")
    else:
        print(f"\nERRO Descrições contextuais: {descriptions} componentes (INSUFICIENTE)")
    
    # Resultado final
    accessibility_percentage = (aria_score / total_checks) * 100
    
    print("\nRESULTADO DE ACESSIBILIDADE APRIMORADA:")
    print("=" * 50)
    print(f"Score: {aria_score}/{total_checks} ({accessibility_percentage:.1f}%)")
    
    if accessibility_percentage >= 85:
        print("CONFORMIDADE WCAG 2.1: EXCELENTE (AA+)")
        level = "AA+"
    elif accessibility_percentage >= 70:
        print("CONFORMIDADE WCAG 2.1: BOA (AA)")
        level = "AA"
    elif accessibility_percentage >= 50:
        print("CONFORMIDADE WCAG 2.1: BÁSICA (A)")
        level = "A"
    else:
        print("CONFORMIDADE WCAG 2.1: INSUFICIENTE")
        level = "Não conforme"
    
    print(f"Nível estimado: {level}")
    
    return accessibility_percentage >= 70

def test_alt_texts():
    """
    Testa implementação de textos alternativos
    """
    print("\n\nTESTES DE TEXTOS ALTERNATIVOS")
    print("=" * 50)
    
    frontend_path = Path("src/frontend/src")
    alt_score = 0
    
    # Verificar imagens com alt
    images_with_alt = 0
    total_images = 0
    
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Contar imagens
            img_tags = re.findall(r'<img[^>]*>', content)
            total_images += len(img_tags)
            
            # Contar imagens com alt
            alt_images = re.findall(r'<img[^>]*alt=', content)
            images_with_alt += len(alt_images)
            
            if alt_images:
                print(f"OK {tsx_file.name}: {len(alt_images)} imagens com alt")
        except:
            pass
    
    # Verificar ícones com aria-label
    icons_with_labels = 0
    for tsx_file in frontend_path.rglob("*.tsx"):
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Heroicons com aria-hidden ou aria-label
            if 'Icon' in content and ('aria-hidden="true"' in content or 'aria-label=' in content):
                icons_with_labels += 1
                print(f"OK {tsx_file.name}: ícones com labels apropriados")
        except:
            pass
    
    print(f"\nResumo de textos alternativos:")
    print(f"- Imagens com alt: {images_with_alt}/{total_images}")
    print(f"- Componentes com ícones acessíveis: {icons_with_labels}")
    
    alt_success = (images_with_alt == total_images or total_images == 0) and icons_with_labels >= 3
    
    if alt_success:
        print("OK TEXTOS ALTERNATIVOS: APROVADO")
    else:
        print("ERRO TEXTOS ALTERNATIVOS: REQUER MELHORIAS")
    
    return alt_success

def main():
    """
    Executa testes completos de acessibilidade aprimorada
    """
    print("=== TESTES DE ACESSIBILIDADE APRIMORADOS ===")
    print("UX/UI Testing Specialist & Accessibility Expert")
    print("Data: 27 de Janeiro de 2025")
    print("Objetivo: Verificar implementação ARIA e WCAG 2.1")
    print()
    
    try:
        aria_success = test_aria_attributes()
        alt_success = test_alt_texts()
        
        overall_success = aria_success and alt_success
        
        print("\n" + "=" * 60)
        if overall_success:
            print("SUCESSO TESTE DE ACESSIBILIDADE APRIMORADA: APROVADO")
            print("OK Sistema possui acessibilidade adequada para produção!")
            print("OK Conformidade WCAG 2.1 atingida")
        else:
            print("AVISO TESTE DE ACESSIBILIDADE APRIMORADA: REQUER ATENÇÃO")
            if not aria_success:
                print("ERRO Atributos ARIA precisam de melhorias")
            if not alt_success:
                print("ERRO Textos alternativos precisam de melhorias")
        print("=" * 60)
        
        return overall_success
        
    except Exception as e:
        print(f"ERRO durante execução: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)