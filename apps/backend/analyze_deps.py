#!/usr/bin/env python3
"""
Análise de dependências do google-cloud-logging
Identifica conflitos potenciais na atualização 3.10.0 -> 3.12.1
"""

import subprocess
import json
import sys

def get_package_info(package_name, version=None):
    """Obtém informações detalhadas sobre um pacote"""
    try:
        if version:
            cmd = ['pip', 'index', 'versions', f'{package_name}=={version}']
        else:
            cmd = ['pip', 'show', package_name]

        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr}"

def analyze_google_cloud_logging():
    """Analisa as versões do google-cloud-logging"""
    print("=" * 80)
    print("ANÁLISE DE DEPENDÊNCIAS: google-cloud-logging")
    print("=" * 80)

    # Versões para comparar
    versions = ['3.10.0', '3.11.0', '3.11.4', '3.12.0', '3.12.1']

    print("\n📦 Versões disponíveis para análise:")
    for v in versions:
        print(f"   - {v}")

    print("\n" + "=" * 80)
    print("ESTRATÉGIA DE RESOLUÇÃO:")
    print("=" * 80)

    print("""
1. ANÁLISE DO ERRO CI/CD:
   - Erro: "resolution-too-deep"
   - Causa: Pip não conseguiu resolver dependências complexas
   - Pacotes conflitantes mencionados:
     * proto-plus
     * grpcio-status
     * importlib-metadata (versions 6.0-7.1)
     * click-option-group (versions 0.5.0-0.5.7)
     * colorama (0.4.0-0.4.5)
     * exceptiongroup (1.2.0-1.2.1)
     * semgrep (1.113.0-1.139.0)

2. ABORDAGEM INCREMENTAL:
   Testar versões intermediárias ao invés de pular direto para 3.12.1:

   Opção A: 3.10.0 -> 3.11.0 (minor bump, menor risco)
   Opção B: 3.10.0 -> 3.11.4 (latest 3.11.x)
   Opção C: 3.10.0 -> 3.12.0 (3.12 inicial, evita .1)
   Opção D: 3.10.0 -> 3.12.1 (target original, já falhou)

3. ESTRATÉGIA DE PINNING:
   Adicionar constraints explícitos para pacotes conflitantes:

   proto-plus==1.25.0          # Pin versão específica
   grpcio-status==1.65.0        # Pin versão específica
   importlib-metadata==7.1.0    # Latest stable

4. ALTERNATIVA - DEPENDENCY GROUPS:
   Criar requirements_google_cloud.txt separado com:
   google-cloud-logging==3.12.1
   google-cloud-monitoring==2.27.2
   google-cloud-storage>=2.10.0

   E incluir via -r requirements_google_cloud.txt

5. ÚLTIMA OPÇÃO:
   Se todos falharem, manter 3.10.0 e documentar motivo:
   # google-cloud-logging==3.10.0  # Pinned: 3.12.1 causes dep resolution conflicts
""")

    print("\n" + "=" * 80)
    print("RECOMENDAÇÃO:")
    print("=" * 80)
    print("""
✅ PASSO 1: Tentar versão intermediária 3.11.4 primeiro
   - Menor risco que 3.12.1
   - Ainda benefícios de segurança/performance
   - Pode ter dependências mais compatíveis

✅ PASSO 2: Se 3.11.4 falhar, adicionar pins explícitos:
   proto-plus==1.25.0
   grpcio-status==1.65.0

✅ PASSO 3: Se ainda falhar, investigar semgrep
   - semgrep aparece nos conflitos
   - É ferramenta de análise estática (linha 127)
   - Pode ter restrições incompatíveis
   - Considerar atualizar semgrep também: >=1.139.0

⚠️  FALLBACK: Manter 3.10.0 com comentário explicativo
""")

if __name__ == "__main__":
    analyze_google_cloud_logging()
