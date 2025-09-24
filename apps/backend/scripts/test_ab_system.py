#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste integrado do sistema A/B Testing
Valida funcionamento completo: backend + frontend + tracking
"""

import requests
import json
import time
from datetime import datetime

# Configurações
API_BASE = "http://localhost:8080"
AB_API = f"{API_BASE}/api/v1/ab-testing"

def test_backend_health():
    """Testar saúde do sistema A/B Testing"""
    print("[TESTE] Verificando saúde do sistema...")

    try:
        response = requests.get(f"{AB_API}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Sistema saudável - {data['active_experiments']} experimentos ativos")
            return True
        else:
            print(f"[ERRO] Health check falhou: {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERRO] Não foi possível conectar ao backend: {e}")
        return False

def test_experiments_list():
    """Testar listagem de experimentos"""
    print("[TESTE] Listando experimentos...")

    try:
        response = requests.get(f"{AB_API}/experiments", timeout=5)
        if response.status_code == 200:
            data = response.json()
            experiments = data.get('experiments', [])
            print(f"[OK] {len(experiments)} experimentos encontrados")

            for exp in experiments[:2]:  # Mostrar apenas os 2 primeiros
                print(f"  - {exp['name']} (ID: {exp['id']})")
                print(f"    Status: {exp['status']}, Alocação: {exp['traffic_allocation']*100:.0f}%")

            return experiments
        else:
            print(f"[ERRO] Falha ao listar experimentos: {response.status_code}")
            return []
    except Exception as e:
        print(f"[ERRO] Erro na listagem: {e}")
        return []

def test_variant_assignment(experiment_id, session_id):
    """Testar atribuição de variante"""
    print(f"[TESTE] Testando atribuição para experimento {experiment_id[:30]}...")

    try:
        # Simular requisição do frontend
        headers = {
            'Content-Type': 'application/json',
            'X-Session-ID': session_id,
            'User-Agent': 'Test Client 1.0'
        }

        payload = {
            'experiment_id': experiment_id
        }

        response = requests.post(f"{AB_API}/assign",
                               json=payload,
                               headers=headers,
                               timeout=5)

        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Variante atribuída: {data['variant']} (ativo: {data['is_active']})")
            return data
        else:
            print(f"[AVISO] Atribuição retornou: {response.status_code}")
            try:
                error_data = response.json()
                print(f"[INFO] Resposta: {error_data}")
            except:
                print(f"[INFO] Resposta não-JSON: {response.text[:100]}")
            return None

    except Exception as e:
        print(f"[ERRO] Erro na atribuição: {e}")
        return None

def test_conversion_tracking(experiment_id, assignment_id):
    """Testar tracking de conversão"""
    if not assignment_id:
        print("[PULAR] Sem assignment_id para testar conversão")
        return False

    print("[TESTE] Testando tracking de conversão...")

    try:
        payload = {
            'experiment_id': experiment_id,
            'assignment_id': assignment_id,
            'metric_name': 'test_conversion',
            'metric_value': 1.0,
            'properties': {
                'test_timestamp': datetime.now().isoformat(),
                'test_source': 'integration_test'
            }
        }

        response = requests.post(f"{AB_API}/track",
                               json=payload,
                               headers={'Content-Type': 'application/json'},
                               timeout=5)

        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Conversão rastreada: {data.get('success', False)}")
            return data.get('success', False)
        else:
            print(f"[ERRO] Tracking falhou: {response.status_code}")
            return False

    except Exception as e:
        print(f"[ERRO] Erro no tracking: {e}")
        return False

def test_experiment_stats(experiment_id):
    """Testar estatísticas do experimento"""
    print(f"[TESTE] Verificando estatísticas...")

    try:
        response = requests.get(f"{AB_API}/experiments/{experiment_id}/stats", timeout=5)

        if response.status_code == 200:
            data = response.json()
            total = data.get('total_assignments', 0)
            print(f"[OK] Estatísticas obtidas - {total} atribuições totais")

            if total > 0:
                variants = data.get('variant_assignments', {})
                for variant, count in variants.items():
                    percentage = (count / total) * 100
                    print(f"  - {variant}: {count} ({percentage:.1f}%)")

            return True
        else:
            print(f"[ERRO] Falha nas estatísticas: {response.status_code}")
            return False

    except Exception as e:
        print(f"[ERRO] Erro nas estatísticas: {e}")
        return False

def run_integration_test():
    """Executar teste de integração completo"""
    print("=" * 60)
    print("[INICIO] TESTE DE INTEGRAÇÃO A/B TESTING")
    print("=" * 60)

    # 1. Verificar saúde do sistema
    if not test_backend_health():
        print("[FALHA] Sistema não está saudável")
        return False

    print()

    # 2. Listar experimentos
    experiments = test_experiments_list()
    if not experiments:
        print("[FALHA] Nenhum experimento disponível")
        return False

    print()

    # 3. Testar com o primeiro experimento
    test_experiment = experiments[0]
    experiment_id = test_experiment['id']
    session_id = f"test_session_{int(time.time())}"

    # 4. Testar atribuição de variante
    assignment_data = test_variant_assignment(experiment_id, session_id)

    print()

    # 5. Testar tracking de conversão (se tiver assignment)
    assignment_id = assignment_data.get('assignment_id') if assignment_data else None
    conversion_success = test_conversion_tracking(experiment_id, assignment_id)

    print()

    # 6. Verificar estatísticas
    stats_success = test_experiment_stats(experiment_id)

    print()

    # Resultado final
    tests = [
        ("Health Check", True),
        ("Listar Experimentos", len(experiments) > 0),
        ("Atribuição de Variante", assignment_data is not None),
        ("Tracking de Conversão", conversion_success),
        ("Estatísticas", stats_success)
    ]

    passed = sum(1 for _, success in tests if success)
    total = len(tests)

    print("=" * 60)
    print(f"[RESULTADO] {passed}/{total} testes passaram")
    print("=" * 60)

    for test_name, success in tests:
        status = "[OK]" if success else "[FALHA]"
        print(f"{status} {test_name}")

    print()

    if passed == total:
        print("[SUCESSO] Sistema A/B Testing funcionando perfeitamente!")
        print("[INFO] Pronto para uso em produção")
    elif passed >= 3:
        print("[PARCIAL] Sistema funcionando com limitações")
        print("[INFO] Verificar logs para problemas específicos")
    else:
        print("[FALHA] Sistema com problemas críticos")
        print("[INFO] Verificar configuração e logs do backend")

    return passed == total

def main():
    """Função principal"""
    try:
        success = run_integration_test()
        exit_code = 0 if success else 1

        print(f"\n[INFO] Script finalizado com código: {exit_code}")
        return exit_code

    except KeyboardInterrupt:
        print("\n[INFO] Teste interrompido pelo usuário")
        return 1
    except Exception as e:
        print(f"\n[ERRO] Erro inesperado: {e}")
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(main())