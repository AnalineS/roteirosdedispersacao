#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de Segurança Simplificado
Validação básica de segurança sem dependências externas
FASE 5.1 - Validação de Segurança
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime

def test_basic_security():
    """Teste básico de segurança"""
    print("[SECURITY] TESTE BASICO DE SEGURANCA")
    print("=" * 50)
    
    vulnerabilities = []
    warnings = []
    checks_passed = []
    
    # Verificar estrutura de arquivos
    base_path = Path(__file__).parent
    
    # 1. Verificar requirements.txt
    req_file = base_path / 'requirements.txt'
    if req_file.exists():
        with open(req_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar pacotes de segurança
        security_packages = ['bleach', 'flask-limiter', 'werkzeug']
        found_security = []
        
        for package in security_packages:
            if package in content.lower():
                found_security.append(package)
                checks_passed.append(f"Pacote de seguranca encontrado: {package}")
        
        if len(found_security) >= 2:
            checks_passed.append("Multiplos pacotes de seguranca instalados")
        else:
            warnings.append("Poucos pacotes de seguranca encontrados")
        
        # Verificar versões fixas
        lines = [line.strip() for line in content.split('\n') 
                if line.strip() and not line.startswith('#')]
        
        pinned_count = sum(1 for line in lines if '==' in line)
        if pinned_count >= len(lines) * 0.8:
            checks_passed.append("Maioria das dependencias com versao fixada")
        else:
            vulnerabilities.append("Muitas dependencias sem versao fixada")
    else:
        vulnerabilities.append("Arquivo requirements.txt nao encontrado")
    
    # 2. Verificar configuração
    try:
        from app_config import config
        
        # Verificar SECRET_KEY
        secret_key = getattr(config, 'SECRET_KEY', None)
        if not secret_key or secret_key == 'dev-secret-key':
            vulnerabilities.append("SECRET_KEY padrao ou nao definida")
        elif len(secret_key) < 32:
            vulnerabilities.append("SECRET_KEY muito curta")
        else:
            checks_passed.append("SECRET_KEY configurada adequadamente")
        
        # Verificar configurações de cookies
        if getattr(config, 'SESSION_COOKIE_HTTPONLY', False):
            checks_passed.append("SESSION_COOKIE_HTTPONLY habilitado")
        else:
            vulnerabilities.append("SESSION_COOKIE_HTTPONLY nao habilitado")
        
    except ImportError:
        warnings.append("Configuracao de seguranca nao encontrada")
    
    # 3. Verificar sistema de upload
    try:
        from services.multimodal_processor import MultimodalProcessor
        import tempfile
        
        temp_dir = tempfile.mkdtemp()
        processor = MultimodalProcessor(temp_dir)
        
        # Testar validação básica
        large_data = b'x' * (11 * 1024 * 1024)  # 11MB
        is_valid, message = processor.validate_file(large_data, 'large.png')
        if not is_valid:
            checks_passed.append("Validacao de tamanho funcionando")
        else:
            vulnerabilities.append("Arquivo muito grande aceito")
        
        # Testar formato malicioso
        script_data = b'#!/bin/bash\nrm -rf /'
        is_valid, message = processor.validate_file(script_data, 'script.sh')
        if not is_valid:
            checks_passed.append("Formato malicioso bloqueado")
        else:
            vulnerabilities.append("Arquivo malicioso aceito")
        
        # Verificar auto-exclusão
        if processor.retention_days == 7:
            checks_passed.append("Auto-exclusao configurada: 7 dias")
        else:
            warnings.append(f"Retencao: {processor.retention_days} dias")
        
        # Limpeza
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        
    except ImportError:
        warnings.append("Sistema multimodal nao encontrado")
    
    # 4. Verificar rate limiting
    try:
        from services.security import security
        
        if hasattr(security, 'require_rate_limit'):
            checks_passed.append("Sistema de rate limiting disponivel")
        else:
            vulnerabilities.append("Rate limiting nao encontrado")
    except ImportError:
        vulnerabilities.append("Modulo de seguranca nao encontrado")
    
    # 5. Verificar blueprints
    try:
        from blueprints import ALL_BLUEPRINTS
        
        if len(ALL_BLUEPRINTS) > 5:
            checks_passed.append(f"Blueprints carregados: {len(ALL_BLUEPRINTS)}")
        else:
            warnings.append("Poucos blueprints encontrados")
    except ImportError:
        warnings.append("Blueprints nao encontrados")
    
    # Relatório
    print(f"\n[RESULTS] RESULTADOS:")
    print(f"Vulnerabilidades: {len(vulnerabilities)}")
    print(f"Avisos: {len(warnings)}")
    print(f"Verificacoes aprovadas: {len(checks_passed)}")
    
    if vulnerabilities:
        print(f"\n[VULNERABILITIES] VULNERABILIDADES:")
        for vuln in vulnerabilities:
            print(f"  - {vuln}")
    
    if warnings:
        print(f"\n[WARNINGS] AVISOS:")
        for warn in warnings:
            print(f"  - {warn}")
    
    if checks_passed:
        print(f"\n[PASSED] VERIFICACOES APROVADAS:")
        for check in checks_passed[:5]:  # Mostrar apenas as primeiras 5
            print(f"  + {check}")
        if len(checks_passed) > 5:
            print(f"  ... e mais {len(checks_passed) - 5} verificacoes")
    
    # Score de segurança
    base_score = 100
    base_score -= len(vulnerabilities) * 15
    base_score -= len(warnings) * 5
    base_score += min(len(checks_passed) * 2, 20)
    
    security_score = max(0, min(100, base_score))
    
    print(f"\n[SCORE] Score de Seguranca: {security_score:.1f}/100")
    
    # Classificação
    if security_score >= 85 and len(vulnerabilities) == 0:
        status = "[SECURE]"
        print(f"{status} - Sistema com alta seguranca")
        result = True
    elif security_score >= 70:
        status = "[MODERATE]"
        print(f"{status} - Sistema com seguranca adequada")
        result = True
    elif security_score >= 50:
        status = "[ATTENTION]"
        print(f"{status} - Sistema precisa de melhorias")
        result = False
    else:
        status = "[INSECURE]"
        print(f"{status} - Sistema com problemas serios")
        result = False
    
    # Salvar relatório
    security_report = {
        'timestamp': datetime.now().isoformat(),
        'security_score': security_score,
        'status': status,
        'vulnerabilities': vulnerabilities,
        'warnings': warnings,
        'checks_passed': checks_passed
    }
    
    report_path = Path(__file__).parent / 'security_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(security_report, f, indent=2, ensure_ascii=False)
    
    print(f"\n[REPORT] Relatorio salvo em: {report_path}")
    
    return result

if __name__ == "__main__":
    success = test_basic_security()
    sys.exit(0 if success else 1)