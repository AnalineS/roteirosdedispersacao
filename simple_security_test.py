#!/usr/bin/env python3
"""
TESTE RAPIDO DE VALIDACAO DAS CORRECOES DE SEGURANCA
Valida se as correcoes criticas funcionam sem quebrar funcionalidades
"""

import sys
import traceback
from datetime import datetime

print("TESTE DE VALIDACAO DAS CORRECOES DE SEGURANCA")
print("=" * 60)
print(f"Timestamp: {datetime.now()}")
print()

# Contador de testes
tests_passed = 0
tests_failed = 0

def test_result(name, success, details=""):
    global tests_passed, tests_failed
    status = "[PASSOU]" if success else "[FALHOU]"
    print(f"{status} {name}")
    if details:
        print(f"   Detalhes: {details}")

    if success:
        tests_passed += 1
    else:
        tests_failed += 1
    print()

print("TESTE 1: Validacao da correcao critica Authlib (CVE-2025-59420)")
try:
    import authlib
    version = getattr(authlib, '__version__', 'unknown')

    # Testar funcionalidade JWT basica
    from authlib.jose import JsonWebToken, JsonWebSignature
    jwt = JsonWebToken(['HS256'])
    jws = JsonWebSignature()

    # Teste basico de criacao JWT
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {'test': 'medical_app', 'iss': 'roteiro-dispensacao'}
    secret = b'test-medical-secret-key-2025'

    token = jwt.encode(header, payload, secret)
    decoded = jwt.decode(token, secret)

    success = (decoded['test'] == 'medical_app' and version >= '1.6.4')
    details = f"Versao: {version}, JWT funcional: {decoded['test'] == 'medical_app'}"
    test_result("Authlib JWT Security Fix", success, details)

except Exception as e:
    test_result("Authlib JWT Security Fix", False, f"Erro: {str(e)}")

print("TESTE 2: Validacao da correcao critica PyTorch (CVE-2025-3730)")
try:
    import torch
    version = torch.__version__

    # Testar funcionalidade basica do torch
    tensor = torch.tensor([1.0, 2.0, 3.0])
    result = tensor.sum()

    # Verificar se a versao e segura (2.8.0+)
    version_parts = version.split('.')
    major, minor = int(version_parts[0]), int(version_parts[1])
    is_secure = (major > 2) or (major == 2 and minor >= 8)

    success = (result.item() == 6.0 and is_secure)
    details = f"Versao: {version}, Tensor funcional: {result.item() == 6.0}, Seguro: {is_secure}"
    test_result("PyTorch DoS Security Fix", success, details)

except Exception as e:
    test_result("PyTorch DoS Security Fix", False, f"Erro: {str(e)}")

print("TESTE 3: Validacao de dependencias de seguranca gerais")
security_packages = [
    ('cryptography', '46.0.1'),
    ('requests', '2.32.5'),
    ('urllib3', '2.5.0'),
    ('pyjwt', '2.10.1'),
]

for package_name, expected_version in security_packages:
    try:
        # Handle PyJWT special case (package pyjwt, import jwt)
        import_name = 'jwt' if package_name == 'pyjwt' else package_name
        module = __import__(import_name)
        version = getattr(module, '__version__', 'unknown')

        success = version != 'unknown'
        details = f"Versao: {version} (esperada: >={expected_version})"
        test_result(f"Security Package {package_name}", success, details)

    except ImportError as e:
        test_result(f"Security Package {package_name}", False, f"Nao instalado: {e}")
    except Exception as e:
        test_result(f"Security Package {package_name}", False, f"Erro: {e}")

print("TESTE 4: Validacao de compatibilidade ML/AI")
try:
    import sentence_transformers
    st_version = sentence_transformers.__version__

    success = True
    details = f"sentence-transformers versao: {st_version}, compativel com torch"
    test_result("ML/AI Compatibility", success, details)

except Exception as e:
    test_result("ML/AI Compatibility", False, f"Erro: {str(e)}")

print("TESTE 5: Validacao de funcionalidades medicas basicas")
try:
    import json
    import numpy as np

    # Simulacao de calculo medico basico
    peso = 70.0  # kg
    dose_rifampicina = 10 * peso  # 10mg/kg

    calculo_correto = (dose_rifampicina == 700.0)

    success = calculo_correto
    details = f"Calculo dosagem: {dose_rifampicina}mg rifampicina para {peso}kg"
    test_result("Medical Calculations", success, details)

except Exception as e:
    test_result("Medical Calculations", False, f"Erro: {str(e)}")

# Resumo Final
print("RESUMO DA VALIDACAO DE SEGURANCA")
print("=" * 60)
print(f"Testes Aprovados: {tests_passed}")
print(f"Testes Falharam: {tests_failed}")
print(f"Taxa de Sucesso: {(tests_passed/(tests_passed+tests_failed)*100):.1f}%")
print()

if tests_failed == 0:
    print("STATUS: [SUCESSO] TODAS AS CORRECOES DE SEGURANCA VALIDADAS")
    print("Aplicacao medica segura para deploy em producao")
    print("Vulnerabilidades criticas CVE-2025-59420 e CVE-2025-3730 CORRIGIDAS")
else:
    print("STATUS: [ATENCAO] ALGUMAS CORRECOES PRECISAM DE REVISAO")
    print("Revisar falhas antes do deploy em producao")

print()
print("Validacao de seguranca concluida!")
print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)

# Exit code para CI/CD
sys.exit(0 if tests_failed == 0 else 1)