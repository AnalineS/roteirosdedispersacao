# -*- coding: utf-8 -*-
"""
Validador de Configurações de Segurança
======================================

Script para validar se todas as configurações de segurança estão corretas
sem precisar de servidor rodando.

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 30/08/2025 - Fase 4 Security Middleware
"""

import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Tuple, Any
import importlib.util

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def validate_app_config() -> Dict[str, Any]:
    """Valida configurações no app_config.py"""
    print("Validando app_config.py...")
    
    results = {
        'config_found': False,
        'security_middleware_enabled': False,
        'rate_limiting_configured': False,
        'security_settings_configured': False,
        'required_variables': [],
        'missing_variables': [],
        'errors': []
    }
    
    try:
        # Importar configuração
        from app_config import config
        results['config_found'] = True
        
        # Verificar SECURITY_MIDDLEWARE_ENABLED
        if hasattr(config, 'SECURITY_MIDDLEWARE_ENABLED'):
            results['security_middleware_enabled'] = True
            print("  [OK] SECURITY_MIDDLEWARE_ENABLED encontrado")
        else:
            results['errors'].append("SECURITY_MIDDLEWARE_ENABLED não encontrado")
            print("  [ERROR] SECURITY_MIDDLEWARE_ENABLED NÃO encontrado")
        
        # Verificar Rate Limiting
        rate_limit_vars = ['RATE_LIMIT_ENABLED', 'RATE_LIMIT_DEFAULT', 'RATE_LIMIT_CHAT']
        if all(hasattr(config, var) for var in rate_limit_vars):
            results['rate_limiting_configured'] = True
            print("  [OK] Rate Limiting configurado")
            print(f"    - RATE_LIMIT_DEFAULT: {getattr(config, 'RATE_LIMIT_DEFAULT', 'N/A')}")
            print(f"    - RATE_LIMIT_CHAT: {getattr(config, 'RATE_LIMIT_CHAT', 'N/A')}")
        else:
            results['errors'].append("Rate limiting não completamente configurado")
        
        # Verificar Security Settings
        security_vars = ['SECURITY_AUTO_BLOCK_ENABLED', 'SECURITY_BLOCK_DURATION_MINUTES', 'SECURITY_MAX_VIOLATIONS']
        if all(hasattr(config, var) for var in security_vars):
            results['security_settings_configured'] = True
            print("  [OK] Security Settings configurados")
            print(f"    - Auto Block: {getattr(config, 'SECURITY_AUTO_BLOCK_ENABLED', 'N/A')}")
            print(f"    - Block Duration: {getattr(config, 'SECURITY_BLOCK_DURATION_MINUTES', 'N/A')} min")
            print(f"    - Max Violations: {getattr(config, 'SECURITY_MAX_VIOLATIONS', 'N/A')}")
        else:
            results['errors'].append("Security settings não completamente configurados")
        
        # Listar variáveis requeridas
        required_env_vars = [
            'SECURITY_MIDDLEWARE_ENABLED',
            'RATE_LIMIT_ENABLED',
            'RATE_LIMIT_DEFAULT',
            'RATE_LIMIT_CHAT',
            'SECURITY_AUTO_BLOCK_ENABLED',
            'SECURITY_BLOCK_DURATION_MINUTES',
            'SECURITY_MAX_VIOLATIONS'
        ]
        
        results['required_variables'] = required_env_vars
        
        # Verificar quais estão faltando no ambiente
        for var in required_env_vars:
            if not os.getenv(var):
                results['missing_variables'].append(var)
        
        if results['missing_variables']:
            print(f"  [WARNING] Variáveis faltando no ambiente: {', '.join(results['missing_variables'])}")
            print("  ℹ️ Essas devem estar configuradas no GitHub Secrets para produção")
        else:
            print("  [OK] Todas as variáveis de ambiente necessárias estão disponíveis")
            
    except ImportError as e:
        results['errors'].append(f"Erro ao importar app_config: {e}")
        print(f"  [ERROR] Erro ao importar app_config: {e}")
    except Exception as e:
        results['errors'].append(f"Erro inesperado: {e}")
        print(f"  [ERROR] Erro inesperado: {e}")
    
    return results

def validate_security_middleware() -> Dict[str, Any]:
    """Valida SecurityMiddleware"""
    print("\nValidando SecurityMiddleware...")
    
    results = {
        'middleware_found': False,
        'attack_detector_found': False,
        'rate_limiter_found': False,
        'https_enforcement': False,
        'security_headers': False,
        'csp_configured': False,
        'errors': []
    }
    
    try:
        # Importar middleware
        from core.security.middleware import SecurityMiddleware, AttackPatternDetector, IntelligentRateLimiter
        
        results['middleware_found'] = True
        results['attack_detector_found'] = True
        results['rate_limiter_found'] = True
        print("  [OK] SecurityMiddleware importado com sucesso")
        print("  [OK] AttackPatternDetector encontrado")
        print("  [OK] IntelligentRateLimiter encontrado")
        
        # Instanciar para testar
        middleware = SecurityMiddleware()
        detector = AttackPatternDetector()
        
        # Testar detector de ataques
        test_sql = "' OR '1'='1"
        sql_detected, patterns = detector.detect_sql_injection(test_sql)
        if sql_detected:
            print("  [OK] Detecção de SQL Injection funcionando")
        else:
            results['errors'].append("Detecção de SQL Injection não funcionando")
        
        test_xss = "<script>alert('test')</script>"
        xss_detected, patterns = detector.detect_xss(test_xss)
        if xss_detected:
            print("  [OK] Detecção de XSS funcionando")
        else:
            results['errors'].append("Detecção de XSS não funcionando")
        
        # Verificar headers de segurança
        expected_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options', 
            'X-XSS-Protection',
            'Strict-Transport-Security',
            'Referrer-Policy',
            'Permissions-Policy'
        ]
        
        if hasattr(middleware, 'security_headers'):
            missing_headers = []
            for header in expected_headers:
                if header not in middleware.security_headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                results['security_headers'] = True
                print("  [OK] Todos os headers de segurança configurados")
                
                # Verificar HTTPS enforcement
                if 'Strict-Transport-Security' in middleware.security_headers:
                    results['https_enforcement'] = True
                    print("  [OK] HTTPS enforcement configurado")
            else:
                results['errors'].append(f"Headers faltando: {', '.join(missing_headers)}")
        
        # Verificar CSP
        if hasattr(middleware, '_get_content_security_policy'):
            csp = middleware._get_content_security_policy()
            if csp and len(csp) > 20:  # CSP deve ter conteúdo substancial
                results['csp_configured'] = True
                print("  [OK] Content Security Policy configurada")
            else:
                results['errors'].append("CSP não configurada adequadamente")
        
    except ImportError as e:
        results['errors'].append(f"Erro ao importar SecurityMiddleware: {e}")
        print(f"  [ERROR] Erro ao importar SecurityMiddleware: {e}")
    except Exception as e:
        results['errors'].append(f"Erro ao testar SecurityMiddleware: {e}")
        print(f"  [ERROR] Erro ao testar SecurityMiddleware: {e}")
    
    return results

def validate_main_integration() -> Dict[str, Any]:
    """Valida integração no main.py"""
    print("\nValidando integracao no main.py...")
    
    results = {
        'integration_found': False,
        'import_available': False,
        'initialization_code': False,
        'errors': []
    }
    
    try:
        # Ler main.py
        main_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'main.py')
        
        if os.path.exists(main_path):
            with open(main_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Verificar import
            if 'from core.security.middleware import SecurityMiddleware' in content:
                results['import_available'] = True
                print("  [OK] Import do SecurityMiddleware encontrado")
            else:
                results['errors'].append("Import do SecurityMiddleware não encontrado")
            
            # Verificar inicialização
            if 'SecurityMiddleware(app)' in content:
                results['initialization_code'] = True
                print("  [OK] Código de inicialização encontrado")
            else:
                results['errors'].append("Código de inicialização não encontrado")
            
            # Verificar condicional
            if 'SECURITY_MIDDLEWARE_AVAILABLE' in content:
                results['integration_found'] = True
                print("  [OK] Integração condicional configurada")
            else:
                results['errors'].append("Integração condicional não encontrada")
        else:
            results['errors'].append("Arquivo main.py não encontrado")
            
    except Exception as e:
        results['errors'].append(f"Erro ao validar main.py: {e}")
        print(f"  [ERROR] Erro ao validar main.py: {e}")
    
    return results

def validate_test_framework() -> Dict[str, Any]:
    """Valida framework de testes"""
    print("\nValidando framework de testes...")
    
    results = {
        'test_suite_exists': False,
        'documentation_exists': False,
        'test_types_implemented': [],
        'errors': []
    }
    
    try:
        # Verificar suite de testes
        test_suite_path = os.path.join(os.path.dirname(__file__), 'main_security_test_suite.py')
        if os.path.exists(test_suite_path):
            results['test_suite_exists'] = True
            print("  [OK] Suite de testes de segurança encontrada")
            
            # Verificar tipos de teste implementados
            with open(test_suite_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            test_types = [
                ('SQL Injection', 'test_sql_injection_protection'),
                ('XSS Protection', 'test_xss_protection'),
                ('Rate Limiting', 'test_rate_limiting'),
                ('Security Headers', 'test_security_headers'),
                ('User Agent Detection', 'test_suspicious_user_agents')
            ]
            
            for test_name, test_method in test_types:
                if test_method in content:
                    results['test_types_implemented'].append(test_name)
                    print(f"    [OK] {test_name} implementado")
                else:
                    results['errors'].append(f"Teste {test_name} não implementado")
        else:
            results['errors'].append("Suite de testes não encontrada")
        
        # Verificar documentação
        doc_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'DOCUMENTACAO_SEGURANCA_PTBR.md')
        if os.path.exists(doc_path):
            results['documentation_exists'] = True
            print("  [OK] Documentação de segurança em PT-BR encontrada")
        else:
            results['errors'].append("Documentação de segurança não encontrada")
            
    except Exception as e:
        results['errors'].append(f"Erro ao validar framework de testes: {e}")
        print(f"  [ERROR] Erro ao validar framework de testes: {e}")
    
    return results

def generate_validation_report(results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Gera relatório de validação"""
    total_checks = 0
    passed_checks = 0
    all_errors = []
    
    for component, component_results in results.items():
        for key, value in component_results.items():
            if key != 'errors' and isinstance(value, bool):
                total_checks += 1
                if value:
                    passed_checks += 1
            elif key == 'errors':
                all_errors.extend(value)
    
    success_rate = (passed_checks / total_checks * 100) if total_checks > 0 else 0
    
    # Determinar status
    if success_rate >= 95 and len(all_errors) == 0:
        status = "[OK] SISTEMA PRONTO PARA PRODUÇÃO"
        color = "[GREEN]"
    elif success_rate >= 80 and len(all_errors) <= 2:
        status = "[WARNING] PEQUENOS AJUSTES NECESSÁRIOS"
        color = "[YELLOW]"
    else:
        status = "[ERROR] CORREÇÕES NECESSÁRIAS"
        color = "[RED]"
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'total_checks': total_checks,
        'passed_checks': passed_checks,
        'success_rate': round(success_rate, 1),
        'total_errors': len(all_errors),
        'status': status,
        'color': color,
        'errors': all_errors,
        'detailed_results': results
    }
    
    return report

def main():
    """Função principal de validação"""
    print("VALIDACAO DE CONFIGURACOES DE SEGURANCA - FASE 4")
    print("=" * 60)
    
    # Executar todas as validações
    validation_results = {
        'app_config': validate_app_config(),
        'security_middleware': validate_security_middleware(),
        'main_integration': validate_main_integration(),
        'test_framework': validate_test_framework()
    }
    
    # Gerar relatório
    report = generate_validation_report(validation_results)
    
    # Exibir resumo
    print("\n" + "=" * 60)
    print("RESUMO DA VALIDACAO")
    print("=" * 60)
    print(f"STATUS: {report['status']}")
    print(f"Checks Passaram: {report['passed_checks']}/{report['total_checks']} ({report['success_rate']}%)")
    print(f"Erros Encontrados: {report['total_errors']}")
    
    if report['errors']:
        print("\nERROS ENCONTRADOS:")
        for i, error in enumerate(report['errors'], 1):
            print(f"  {i}. {error}")
    
    # Salvar relatório
    os.makedirs('security-tests/reports', exist_ok=True)
    report_path = f"security-tests/reports/config_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\nRelatorio salvo em: {report_path}")
    
    # Recomendações
    print("\nPROXIMOS PASSOS:")
    if report['success_rate'] >= 95:
        print("  1. [OK] Sistema validado - Pronto para teste em HML")
        print("  2. [OK] Configurar GitHub Secrets para HML")
        print("  3. [OK] Executar testes de integração completos")
    else:
        print("  1. [FIX] Corrigir erros identificados")
        print("  2. 🔄 Re-executar validação")
        print("  3. [NOTE] Atualizar documentação se necessário")
    
    print("=" * 60)
    
    # Código de saída
    if report['success_rate'] >= 95 and len(report['errors']) == 0:
        return 0
    elif report['success_rate'] >= 80:
        return 1
    else:
        return 2

if __name__ == "__main__":
    sys.exit(main())