#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Verificação de Vulnerabilidades
Executa verificações de segurança e atualiza documentação
"""

import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
import re
from typing import Dict, List, Tuple

# Configurações
SECURITY_DOC = Path("SECURITY_VULNERABILITIES.md")
SNYK_POLICY = Path("apps/backend/.snyk")
REQUIREMENTS = Path("apps/backend/requirements.txt")
PACKAGE_JSON = Path("apps/frontend-nextjs/package.json")

# Vulnerabilidades aceitas (torch)
ACCEPTED_VULNS = [
    "SNYK-PYTHON-TORCH-10332643",
    "SNYK-PYTHON-TORCH-10332644",
    "SNYK-PYTHON-TORCH-10332645",
    "SNYK-PYTHON-TORCH-10337825",
    "SNYK-PYTHON-TORCH-10337826",
    "SNYK-PYTHON-TORCH-10337828",
    "SNYK-PYTHON-TORCH-10337834"
]

def run_command(cmd: List[str]) -> Tuple[int, str, str]:
    """Executa comando e retorna código, stdout, stderr"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def check_python_updates() -> Dict[str, str]:
    """Verifica atualizações disponíveis para pacotes Python"""
    updates = {}
    
    print("[SEARCH] Verificando atualizações Python...")
    
    # Pacotes críticos para monitorar
    critical_packages = [
        "torch",
        "cryptography",
        "flask-cors",
        "requests",
        "sentence-transformers",
        "setuptools"
    ]
    
    for package in critical_packages:
        code, stdout, _ = run_command(["pip", "index", "versions", package])
        if code == 0:
            # Extrair última versão
            match = re.search(r'Available versions: ([0-9.]+)', stdout)
            if match:
                latest = match.group(1)
                
                # Verificar versão atual no requirements.txt
                if REQUIREMENTS.exists():
                    with open(REQUIREMENTS) as f:
                        content = f.read()
                        current_match = re.search(f'{package}==([0-9.]+)', content, re.IGNORECASE)
                        if current_match:
                            current = current_match.group(1)
                            if current != latest:
                                updates[package] = f"{current} -> {latest}"
                                print(f"  [WARNING] {package}: {current} -> {latest}")
                            else:
                                print(f"  [OK] {package}: {current} (atualizado)")
    
    return updates

def check_snyk_vulnerabilities() -> Dict[str, List[str]]:
    """Executa Snyk e retorna vulnerabilidades encontradas"""
    vulnerabilities = {"backend": [], "frontend": []}
    
    print("\n[SECURITY] Executando Snyk scan...")
    
    # Backend scan
    print("  Verificando backend...")
    code, stdout, stderr = run_command([
        "npx", "snyk", "test",
        "--file=apps/backend/requirements.txt",
        "--severity-threshold=medium",
        "--json"
    ])
    
    if stdout:
        try:
            data = json.loads(stdout)
            for vuln in data.get("vulnerabilities", []):
                vuln_id = vuln.get("id", "")
                if vuln_id not in ACCEPTED_VULNS:
                    vulnerabilities["backend"].append({
                        "id": vuln_id,
                        "severity": vuln.get("severity", ""),
                        "package": vuln.get("packageName", ""),
                        "version": vuln.get("version", "")
                    })
        except json.JSONDecodeError:
            pass
    
    # Frontend scan
    print("  Verificando frontend...")
    code, stdout, stderr = run_command([
        "npx", "snyk", "test",
        "--file=apps/frontend-nextjs/package.json",
        "--severity-threshold=medium",
        "--json"
    ])
    
    if stdout:
        try:
            data = json.loads(stdout)
            for vuln in data.get("vulnerabilities", []):
                vulnerabilities["frontend"].append({
                    "id": vuln.get("id", ""),
                    "severity": vuln.get("severity", ""),
                    "package": vuln.get("packageName", ""),
                    "version": vuln.get("version", "")
                })
        except json.JSONDecodeError:
            pass
    
    return vulnerabilities

def check_expiry_dates() -> List[str]:
    """Verifica datas de expiração das vulnerabilidades aceitas"""
    expiring_soon = []
    
    if SNYK_POLICY.exists():
        with open(SNYK_POLICY) as f:
            content = f.read()
            
        # Procurar por datas de expiração
        dates = re.findall(r"expires: '([0-9-T:.Z]+)'", content)
        
        for date_str in dates:
            try:
                expiry = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                days_until = (expiry - datetime.now()).days
                
                if days_until <= 30:
                    expiring_soon.append(f"Expiração em {days_until} dias: {date_str}")
                    
            except ValueError:
                pass
    
    return expiring_soon

def update_security_doc(updates: Dict, vulns: Dict, expiring: List):
    """Atualiza documento de segurança com novas informações"""
    
    if not SECURITY_DOC.exists():
        print("[WARNING] SECURITY_VULNERABILITIES.md não encontrado")
        return
    
    with open(SECURITY_DOC, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Atualizar data
    today = datetime.now().strftime("%Y-%m-%d")
    content = re.sub(
        r'\*\*Última Atualização\*\*: [0-9-]+',
        f'**Última Atualização**: {today}',
        content
    )
    
    # Adicionar seção de alertas se houver
    if updates or vulns["backend"] or vulns["frontend"] or expiring:
        alert_section = "\n## [ALERT] Alertas Ativos\n\n"
        
        if updates:
            alert_section += "### Atualizações Disponíveis\n"
            for pkg, versions in updates.items():
                alert_section += f"- {pkg}: {versions}\n"
            alert_section += "\n"
        
        if vulns["backend"] or vulns["frontend"]:
            alert_section += "### Novas Vulnerabilidades Detectadas\n"
            for vuln in vulns["backend"]:
                alert_section += f"- Backend: {vuln['severity']} - {vuln['package']}@{vuln['version']}\n"
            for vuln in vulns["frontend"]:
                alert_section += f"- Frontend: {vuln['severity']} - {vuln['package']}@{vuln['version']}\n"
            alert_section += "\n"
        
        if expiring:
            alert_section += "### Políticas Expirando\n"
            for exp in expiring:
                alert_section += f"- {exp}\n"
            alert_section += "\n"
        
        # Inserir alertas após o status atual
        if "## [ALERT] Alertas Ativos" in content:
            # Substituir seção existente
            content = re.sub(
                r'## [ALERT] Alertas Ativos.*?(?=##|\Z)',
                alert_section,
                content,
                flags=re.DOTALL
            )
        else:
            # Adicionar nova seção
            content = content.replace(
                "## [OK] Vulnerabilidades Corrigidas",
                alert_section + "## [OK] Vulnerabilidades Corrigidas"
            )
    
    with open(SECURITY_DOC, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n[OK] {SECURITY_DOC} atualizado")

def generate_report(updates: Dict, vulns: Dict, expiring: List):
    """Gera relatório resumido"""
    
    print("\n" + "="*60)
    print("[REPORT] RELATÓRIO DE SEGURANÇA")
    print("="*60)
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Resumo
    total_issues = len(updates) + len(vulns["backend"]) + len(vulns["frontend"]) + len(expiring)
    
    if total_issues == 0:
        print("[OK] Nenhum problema de segurança detectado!")
    else:
        print(f"[WARNING] {total_issues} itens requerem atenção:")
        
        if updates:
            print(f"\n📦 {len(updates)} Atualizações Disponíveis:")
            for pkg, ver in updates.items():
                print(f"  - {pkg}: {ver}")
        
        if vulns["backend"]:
            print(f"\n[RED] {len(vulns['backend'])} Vulnerabilidades no Backend:")
            for v in vulns["backend"][:5]:  # Mostrar apenas top 5
                print(f"  - {v['severity']}: {v['package']}@{v['version']}")
        
        if vulns["frontend"]:
            print(f"\n🔵 {len(vulns['frontend'])} Vulnerabilidades no Frontend:")
            for v in vulns["frontend"][:5]:  # Mostrar apenas top 5
                print(f"  - {v['severity']}: {v['package']}@{v['version']}")
        
        if expiring:
            print(f"\n⏰ {len(expiring)} Políticas Expirando:")
            for exp in expiring:
                print(f"  - {exp}")
    
    print("\n" + "="*60)
    
    # Recomendações
    print("\n[LIST] RECOMENDAÇÕES:")
    
    if "torch" in updates:
        print("1. [WARNING] CRÍTICO: PyTorch tem atualização - testar urgentemente")
    
    if any(v["severity"] == "high" for v in vulns["backend"] + vulns["frontend"]):
        print("2. [RED] Vulnerabilidades de alta severidade detectadas - revisar imediatamente")
    
    if expiring:
        print("3. ⏰ Renovar políticas de exceção antes da expiração")
    
    if not total_issues:
        print("1. [OK] Continuar monitoramento regular")
        print("2. 📅 Próxima verificação em 7 dias")
    
    print("\n" + "="*60)

def main():
    """Função principal"""
    print("🔒 Iniciando Verificação de Segurança...")
    print("="*60)
    
    # 1. Verificar atualizações
    updates = check_python_updates()
    
    # 2. Verificar vulnerabilidades
    vulns = check_snyk_vulnerabilities() if "--skip-snyk" not in sys.argv else {"backend": [], "frontend": []}
    
    # 3. Verificar expirações
    expiring = check_expiry_dates()
    
    # 4. Atualizar documentação
    if "--update-docs" in sys.argv or input("\nAtualizar SECURITY_VULNERABILITIES.md? (s/n): ").lower() == 's':
        update_security_doc(updates, vulns, expiring)
    
    # 5. Gerar relatório
    generate_report(updates, vulns, expiring)
    
    # 6. Código de saída
    if updates or vulns["backend"] or vulns["frontend"] or expiring:
        sys.exit(1)  # Indicar que ação é necessária
    else:
        sys.exit(0)  # Tudo OK

if __name__ == "__main__":
    main()