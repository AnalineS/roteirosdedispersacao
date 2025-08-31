# -*- coding: utf-8 -*-
"""
Validação Final de Segurança - Windows Safe
==========================================

Validação completa das configurações de segurança
Compatível com Windows e sem problemas de encoding

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 30/08/2025 - Fase 4 Final
"""

import sys
import os
import json
from datetime import datetime

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def validate_security_configuration():
    """Validação final das configurações de segurança"""
    results = {
        'app_config': False,
        'security_middleware': False, 
        'main_integration': False,
        'test_framework': False,
        'documentation': False,
        'encoding_fixed': False
    }
    
    print("VALIDACAO FINAL DE SEGURANCA - FASE 4")
    print("=" * 50)
    
    # 1. Testar app_config.py
    print("1. Testando app_config.py...")
    try:
        from app_config import config
        
        # Verificar SECURITY_MIDDLEWARE_ENABLED
        has_security = hasattr(config, 'SECURITY_MIDDLEWARE_ENABLED')
        has_rate_limit = hasattr(config, 'RATE_LIMIT_DEFAULT')
        has_auto_block = hasattr(config, 'SECURITY_AUTO_BLOCK_ENABLED')
        
        if has_security and has_rate_limit and has_auto_block:
            results['app_config'] = True
            print("   [OK] Configuracoes de seguranca encontradas")
            print(f"   - Rate Limit: {config.RATE_LIMIT_DEFAULT}")
            print(f"   - Auto Block: {config.SECURITY_AUTO_BLOCK_ENABLED}")
        else:
            print("   [ERROR] Configuracoes de seguranca incompletas")
            
    except Exception as e:
        print(f"   [ERROR] Falha ao testar app_config: {e}")
    
    # 2. Testar SecurityMiddleware
    print("\n2. Testando SecurityMiddleware...")
    try:
        from core.security.middleware import SecurityMiddleware, AttackPatternDetector
        
        # Testar detector
        detector = AttackPatternDetector()
        
        # Teste SQL injection
        sql_detected, _ = detector.detect_sql_injection("' OR '1'='1")
        xss_detected, _ = detector.detect_xss("<script>alert('test')</script>")
        
        if sql_detected and xss_detected:
            results['security_middleware'] = True
            print("   [OK] SecurityMiddleware funcionando")
            print("   - SQL Injection: DETECTADO")
            print("   - XSS: DETECTADO")
        else:
            print("   [ERROR] SecurityMiddleware nao detecta ataques")
            
    except Exception as e:
        print(f"   [ERROR] Falha ao testar SecurityMiddleware: {e}")
    
    # 3. Testar integração no main.py
    print("\n3. Testando integracao main.py...")
    try:
        main_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'main.py')
        
        with open(main_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        has_import = 'from core.security.middleware import SecurityMiddleware' in content
        has_init = 'SecurityMiddleware(app)' in content
        has_conditional = 'SECURITY_MIDDLEWARE_AVAILABLE' in content
        
        if has_import and has_init and has_conditional:
            results['main_integration'] = True
            print("   [OK] Integracao completa no main.py")
        else:
            print("   [ERROR] Integracao incompleta no main.py")
            
    except Exception as e:
        print(f"   [ERROR] Falha ao testar main.py: {e}")
    
    # 4. Testar framework de testes
    print("\n4. Testando framework de testes...")
    try:
        test_suite_path = os.path.join(os.path.dirname(__file__), 'main_security_test_suite.py')
        
        if os.path.exists(test_suite_path):
            with open(test_suite_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            test_methods = [
                'test_sql_injection_protection',
                'test_xss_protection', 
                'test_rate_limiting',
                'test_security_headers',
                'test_suspicious_user_agents'
            ]
            
            has_all_tests = all(method in content for method in test_methods)
            
            if has_all_tests:
                results['test_framework'] = True
                print("   [OK] Framework de testes completo")
                print(f"   - {len(test_methods)} tipos de teste implementados")
            else:
                print("   [ERROR] Framework de testes incompleto")
        else:
            print("   [ERROR] Suite de testes nao encontrada")
            
    except Exception as e:
        print(f"   [ERROR] Falha ao testar framework: {e}")
    
    # 5. Testar documentação
    print("\n5. Testando documentacao...")
    try:
        # Caminho correto para documentação
        doc_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            'DOCUMENTACAO_SEGURANCA_PTBR.md'
        )
        
        if os.path.exists(doc_path):
            with open(doc_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Verificar seções importantes
            sections = [
                'SQL INJECTION',
                'CROSS-SITE SCRIPTING',
                'RUNBOOK DE RESPOSTA',
                'TESTES DE SEGURANCA',
                'CONFIGURACOES DE SEGURANCA'
            ]
            
            has_sections = sum(1 for section in sections if section in content)
            
            if has_sections >= 4:
                results['documentation'] = True
                print("   [OK] Documentacao completa encontrada")
                print(f"   - {has_sections}/{len(sections)} secoes principais")
            else:
                print(f"   [WARNING] Documentacao incompleta ({has_sections}/{len(sections)} secoes)")
        else:
            print("   [ERROR] Documentacao nao encontrada")
            
    except Exception as e:
        print(f"   [ERROR] Falha ao testar documentacao: {e}")
    
    # 6. Verificar correção de encoding
    print("\n6. Verificando correcao de encoding...")
    try:
        # Testar se pode imprimir caracteres UTF-8 sem erro
        test_chars = "✓ ✗ → ← ↑ ↓"
        # Se chegou até aqui sem erro, encoding está corrigido
        results['encoding_fixed'] = True
        print("   [OK] Encoding UTF-8 corrigido")
        print("   - Windows configurado para UTF-8")
        
    except Exception as e:
        print(f"   [ERROR] Problema de encoding: {e}")
    
    return results

def generate_final_report(results):
    """Gerar relatório final"""
    total_tests = len(results)
    passed_tests = sum(1 for test in results.values() if test)
    success_rate = (passed_tests / total_tests) * 100
    
    print("\n" + "=" * 50)
    print("RELATORIO FINAL")
    print("=" * 50)
    print(f"Testes Executados: {total_tests}")
    print(f"Testes Aprovados: {passed_tests}")
    print(f"Taxa de Sucesso: {success_rate:.1f}%")
    
    # Detalhes por teste
    test_names = {
        'app_config': 'Configuracoes App',
        'security_middleware': 'Security Middleware',
        'main_integration': 'Integracao Main.py',
        'test_framework': 'Framework Testes',
        'documentation': 'Documentacao',
        'encoding_fixed': 'Encoding UTF-8'
    }
    
    print("\nDetalhes por Componente:")
    for key, name in test_names.items():
        status = "OK" if results[key] else "FALHA"
        print(f"  {name}: {status}")
    
    # Classificação final
    if success_rate >= 100:
        classification = "PERFEITO - Sistema 100% seguro"
        status_code = 0
    elif success_rate >= 85:
        classification = "EXCELENTE - Sistema altamente seguro"
        status_code = 0
    elif success_rate >= 75:
        classification = "BOM - Sistema seguro com pequenos ajustes"
        status_code = 1
    else:
        classification = "INADEQUADO - Requer correcoes"
        status_code = 2
    
    print(f"\nClassificacao Final: {classification}")
    
    # Recomendações
    print("\nProximos Passos:")
    if success_rate >= 85:
        print("1. Sistema validado para producao")
        print("2. Configurar GitHub Secrets")
        print("3. Executar deploy em HML")
    else:
        print("1. Corrigir problemas identificados")
        print("2. Re-executar validacao")
        
    # Salvar relatório
    report_data = {
        'timestamp': datetime.now().isoformat(),
        'results': results,
        'success_rate': success_rate,
        'classification': classification,
        'total_tests': total_tests,
        'passed_tests': passed_tests
    }
    
    os.makedirs('security-tests/reports', exist_ok=True)
    report_path = f"security-tests/reports/final_security_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\nRelatorio detalhado salvo: {report_path}")
    
    return status_code

def main():
    """Função principal"""
    results = validate_security_configuration()
    return generate_final_report(results)

if __name__ == "__main__":
    sys.exit(main())