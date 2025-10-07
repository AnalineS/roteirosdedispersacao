#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise detalhada de dependências do google-cloud-logging
Usa pip e requests para obter metadados do PyPI
"""

import json
import subprocess
import sys
import io
from typing import Dict, List, Any

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def get_pypi_metadata(package: str, version: str) -> Dict[str, Any]:
    """Obtém metadados do PyPI para uma versão específica"""
    try:
        import requests
        url = f"https://pypi.org/pypi/{package}/{version}/json"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Erro ao obter metadata para {package}=={version}: {e}")
        return {}

def analyze_version(package: str, version: str) -> Dict[str, Any]:
    """Analisa uma versão específica do pacote"""
    print(f"\n{'='*80}")
    print(f"📦 Analisando {package}=={version}")
    print(f"{'='*80}")

    metadata = get_pypi_metadata(package, version)

    if not metadata:
        return {}

    info = metadata.get('info', {})

    # Extrair dependências
    requires_dist = info.get('requires_dist', [])

    result = {
        'version': version,
        'requires_python': info.get('requires_python', 'Not specified'),
        'dependencies': {},
        'key_dependencies': {}
    }

    # Processar dependências
    key_packages = ['proto-plus', 'grpcio-status', 'google-api-core',
                    'google-cloud-core', 'google-auth', 'protobuf']

    print(f"\n📋 Python version required: {result['requires_python']}")
    print(f"\n🔗 Total dependencies: {len(requires_dist) if requires_dist else 0}")

    if requires_dist:
        print(f"\n🎯 Key dependencies:")
        for dep in requires_dist:
            # Parse dependency string (formato: "package (>=version,<version)")
            dep_name = dep.split()[0].strip()

            result['dependencies'][dep] = dep

            # Destacar dependências chave
            if any(key in dep_name.lower() for key in key_packages):
                result['key_dependencies'][dep_name] = dep
                print(f"   ✓ {dep}")

    return result

def compare_versions(v1_data: Dict, v2_data: Dict) -> None:
    """Compara dependências entre duas versões"""
    print(f"\n{'='*80}")
    print(f"🔍 COMPARAÇÃO: {v1_data['version']} vs {v2_data['version']}")
    print(f"{'='*80}")

    v1_keys = set(v1_data['key_dependencies'].keys())
    v2_keys = set(v2_data['key_dependencies'].keys())

    # Dependências adicionadas
    added = v2_keys - v1_keys
    if added:
        print(f"\n➕ Dependências ADICIONADAS em {v2_data['version']}:")
        for dep in added:
            print(f"   + {v2_data['key_dependencies'][dep]}")

    # Dependências removidas
    removed = v1_keys - v2_keys
    if removed:
        print(f"\n➖ Dependências REMOVIDAS em {v2_data['version']}:")
        for dep in removed:
            print(f"   - {v1_data['key_dependencies'][dep]}")

    # Dependências com versões alteradas
    common = v1_keys & v2_keys
    if common:
        print(f"\n🔄 Dependências ALTERADAS:")
        for dep in common:
            v1_req = v1_data['key_dependencies'][dep]
            v2_req = v2_data['key_dependencies'][dep]
            if v1_req != v2_req:
                print(f"   • {dep}:")
                print(f"     {v1_data['version']}: {v1_req}")
                print(f"     {v2_data['version']}: {v2_req}")

def main():
    """Executa análise completa"""
    print("🔬 ANÁLISE DE DEPENDÊNCIAS: google-cloud-logging")
    print("="*80)

    versions = ['3.10.0', '3.11.0', '3.11.4', '3.12.0', '3.12.1']

    results = {}
    for version in versions:
        results[version] = analyze_version('google-cloud-logging', version)

    # Comparações
    print(f"\n\n{'#'*80}")
    print("# ANÁLISE COMPARATIVA")
    print(f"{'#'*80}")

    # 3.10.0 vs 3.11.0
    if '3.10.0' in results and '3.11.0' in results:
        compare_versions(results['3.10.0'], results['3.11.0'])

    # 3.11.4 vs 3.12.1
    if '3.11.4' in results and '3.12.1' in results:
        compare_versions(results['3.11.4'], results['3.12.1'])

    # 3.10.0 vs 3.12.1 (salto direto)
    if '3.10.0' in results and '3.12.1' in results:
        compare_versions(results['3.10.0'], results['3.12.1'])

    # Recomendações
    print(f"\n\n{'#'*80}")
    print("# RECOMENDAÇÕES")
    print(f"{'#'*80}")

    print("""
    📊 ESTRATÉGIA RECOMENDADA:

    1. ABORDAGEM INCREMENTAL (Mais Segura):
       ├─ Passo 1: 3.10.0 → 3.11.0
       │  └─ Testar build e validar funcionalidade
       ├─ Passo 2: 3.11.0 → 3.11.4
       │  └─ Testar build e validar funcionalidade
       └─ Passo 3: 3.11.4 → 3.12.1
          └─ Testar build e validar funcionalidade

    2. ABORDAGEM MODERADA:
       ├─ Passo 1: 3.10.0 → 3.11.4
       │  └─ Pular para última versão estável 3.11.x
       └─ Passo 2: 3.11.4 → 3.12.1
          └─ Upgrade para versão atual

    3. ABORDAGEM CONSERVADORA (Se tudo falhar):
       └─ Manter: 3.10.0 com pin explícito
          └─ Documentar motivo: "3.12.1 causa resolution-too-deep"

    ⚠️  ESTRATÉGIA DE PINS:

    Se encontrar conflitos, adicionar pins explícitos:

    # Pin versões específicas de dependências problemáticas
    proto-plus==1.24.0  # ou versão compatível identificada
    grpcio-status==1.62.2  # ou versão compatível identificada

    📝 PRÓXIMOS PASSOS:

    1. Executar este script para identificar diferenças exatas
    2. Testar upgrade incremental (3.10.0 → 3.11.4)
    3. Se falhar, adicionar pins de proto-plus e grpcio-status
    4. Atualizar semgrep para última versão (>=1.139.0)
    5. Documentar decisão final em requirements.txt
    """)

if __name__ == "__main__":
    # Verificar se requests está disponível
    try:
        import requests
    except ImportError:
        print("❌ Erro: módulo 'requests' não encontrado")
        print("Execute: pip install requests")
        sys.exit(1)

    main()
