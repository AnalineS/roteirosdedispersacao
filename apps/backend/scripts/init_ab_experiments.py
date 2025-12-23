#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para inicializar experimentos A/B Testing de exemplo
Sistema educacional para dispensação PQT-U
"""

import sys
import os
import json
from datetime import datetime, timedelta

# Adicionar o diretório pai ao path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from blueprints.a_b_testing_blueprint import ABTestingService, Experiment, ExperimentStatus, UserSegment

def create_sample_experiments():
    """Criar experimentos de exemplo para o sistema educacional"""

    ab_service = ABTestingService()

    experiments = [
        {
            'name': 'Calculadora de Dose - Layout',
            'description': 'Teste do layout da calculadora de dose PQT-U',
            'status': 'active',
            'segments': ['all'],
            'traffic_allocation': 0.5,  # 50% dos usuários
            'variants': [
                {
                    'name': 'control',
                    'config': {
                        'layout': 'standard',
                        'color_scheme': 'blue',
                        'button_size': 'medium'
                    }
                },
                {
                    'name': 'improved',
                    'config': {
                        'layout': 'enhanced',
                        'color_scheme': 'green',
                        'button_size': 'large',
                        'helper_text': True
                    }
                }
            ],
            'metrics': ['dose_calculation_completed', 'time_to_complete', 'user_satisfaction'],
            'start_date': datetime.now(timezone.utc),
            'end_date': datetime.now(timezone.utc) + timedelta(days=30)
        },

        {
            'name': 'Chat Persona - Dr. Gasnelio vs Gá',
            'description': 'Teste de preferência entre personas do chat',
            'status': 'active',
            'segments': ['professional', 'student'],
            'traffic_allocation': 0.8,  # 80% dos usuários profissionais/estudantes
            'variants': [
                {
                    'name': 'dr_gasnelio_default',
                    'config': {
                        'default_persona': 'dr_gasnelio',
                        'show_persona_switch': True,
                        'technical_detail_level': 'high'
                    }
                },
                {
                    'name': 'ga_default',
                    'config': {
                        'default_persona': 'ga',
                        'show_persona_switch': True,
                        'technical_detail_level': 'simplified'
                    }
                }
            ],
            'metrics': ['chat_engagement', 'persona_switches', 'session_duration'],
            'start_date': datetime.now(timezone.utc),
            'end_date': datetime.now(timezone.utc) + timedelta(days=45)
        },

        {
            'name': 'Onboarding Flow - Educacional',
            'description': 'Teste do fluxo de onboarding para novos usuários',
            'status': 'active',
            'segments': ['new_user'],
            'traffic_allocation': 1.0,  # 100% dos novos usuários
            'variants': [
                {
                    'name': 'standard_tutorial',
                    'config': {
                        'tutorial_steps': 5,
                        'interactive_elements': False,
                        'skip_option': True
                    }
                },
                {
                    'name': 'interactive_tutorial',
                    'config': {
                        'tutorial_steps': 7,
                        'interactive_elements': True,
                        'progress_tracking': True,
                        'skip_option': False
                    }
                },
                {
                    'name': 'video_tutorial',
                    'config': {
                        'tutorial_type': 'video',
                        'video_duration': '3min',
                        'interactive_elements': False,
                        'skip_option': True
                    }
                }
            ],
            'metrics': ['onboarding_completion', 'time_to_first_action', 'tutorial_engagement'],
            'start_date': datetime.now(timezone.utc),
            'end_date': datetime.now(timezone.utc) + timedelta(days=60)
        },

        {
            'name': 'Dashboard Layout - Profissionais',
            'description': 'Teste de layout do dashboard para profissionais de saúde',
            'status': 'active',
            'segments': ['professional'],
            'traffic_allocation': 0.6,  # 60% dos profissionais
            'variants': [
                {
                    'name': 'sidebar_layout',
                    'config': {
                        'navigation': 'sidebar',
                        'quick_actions': 'top',
                        'recent_cases': 'center'
                    }
                },
                {
                    'name': 'top_nav_layout',
                    'config': {
                        'navigation': 'top_horizontal',
                        'quick_actions': 'sidebar',
                        'recent_cases': 'grid'
                    }
                }
            ],
            'metrics': ['page_navigation', 'feature_usage', 'task_completion_rate'],
            'start_date': datetime.now(timezone.utc),
            'end_date': datetime.now(timezone.utc) + timedelta(days=35)
        }
    ]

    created_count = 0

    for exp_data in experiments:
        experiment = Experiment(
            id=f"exp_{exp_data['name'].lower().replace(' ', '_').replace('-', '_')}_{datetime.now(timezone.utc).strftime('%Y%m%d')}",
            name=exp_data['name'],
            description=exp_data['description'],
            status=ExperimentStatus(exp_data['status']),
            segments=[UserSegment(s) for s in exp_data['segments']],
            traffic_allocation=exp_data['traffic_allocation'],
            variants=exp_data['variants'],
            metrics=exp_data['metrics'],
            start_date=exp_data['start_date'],
            end_date=exp_data['end_date'],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by='system_init'
        )

        success = ab_service.db.create_experiment(experiment)
        if success:
            created_count += 1
            print(f"[OK] Experimento criado: {experiment.name} (ID: {experiment.id})")
        else:
            print(f"[ERRO] Falha ao criar experimento: {experiment.name}")

    print(f"\n[RESULTADO] {created_count}/{len(experiments)} experimentos criados com sucesso!")
    return created_count

def test_assignment_flow():
    """Testar fluxo de atribuição de variantes"""

    ab_service = ABTestingService()

    # Obter experimentos ativos
    experiments = ab_service.db.get_active_experiments()
    if not experiments:
        print("[ERRO] Nenhum experimento ativo encontrado para teste")
        return False

    print(f"\n[TESTE] Testando atribuição com {len(experiments)} experimentos ativos...")

    # Simular alguns usuários
    test_users = [
        {'user_id': 'user_001', 'session_id': 'session_001', 'ip': '192.168.1.1'},
        {'user_id': 'user_002', 'session_id': 'session_002', 'ip': '192.168.1.2'},
        {'user_id': None, 'session_id': 'session_003', 'ip': '192.168.1.3'},  # Usuário anônimo
        {'user_id': 'user_004', 'session_id': 'session_004', 'ip': '192.168.1.4'},
    ]

    success_count = 0
    total_tests = 0

    for experiment in experiments[:2]:  # Testar apenas os 2 primeiros
        print(f"\n[EXPERIMENTO] Testando: {experiment.name}")

        for user in test_users:
            total_tests += 1

            result = ab_service.assign_variant(
                experiment_id=experiment.id,
                user_id=user['user_id'],
                session_id=user['session_id'],
                user_agent='Test Browser 1.0',
                ip_address=user['ip']
            )

            if result['variant']:
                success_count += 1
                print(f"  [OK] {user['session_id']}: {result['variant']} (ativo: {result['is_active']})")

                # Testar tracking de conversão se tiver assignment_id
                if result.get('assignment_id'):
                    conversion_success = ab_service.track_conversion(
                        experiment_id=experiment.id,
                        assignment_id=result['assignment_id'],
                        metric_name='test_conversion',
                        metric_value=1.0,
                        properties={'test': True}
                    )
                    if conversion_success:
                        print(f"    [CONVERSAO] Conversão rastreada com sucesso")
            else:
                print(f"  [ERRO] Falha na atribuição para {user['session_id']}")

    print(f"\n[RESULTADO] Resultado dos testes: {success_count}/{total_tests} atribuições bem-sucedidas")
    return success_count == total_tests

def display_experiment_stats():
    """Mostrar estatísticas dos experimentos"""

    ab_service = ABTestingService()
    experiments = ab_service.db.get_active_experiments()

    if not experiments:
        print("[INFO] Nenhum experimento ativo para mostrar estatísticas")
        return

    print(f"\n[ESTATISTICAS] ESTATÍSTICAS DOS EXPERIMENTOS")
    print("=" * 50)

    for experiment in experiments:
        stats = ab_service.db.get_experiment_stats(experiment.id)

        print(f"\n[EXP] {experiment.name}")
        print(f"   ID: {experiment.id}")
        print(f"   Status: {experiment.status.value}")
        print(f"   Alocação: {experiment.traffic_allocation*100:.1f}%")

        if stats.get('total_assignments', 0) > 0:
            print(f"   Total de atribuições: {stats['total_assignments']}")

            print("   Distribuição por variante:")
            for variant, count in stats.get('variant_assignments', {}).items():
                percentage = (count / stats['total_assignments']) * 100
                print(f"     - {variant}: {count} ({percentage:.1f}%)")

            if stats.get('conversions'):
                print("   Conversões:")
                for variant, metrics in stats['conversions'].items():
                    for metric, data in metrics.items():
                        print(f"     - {variant} - {metric}: {data['count']} conversões")
        else:
            print("   [INFO] Nenhuma atribuição ainda")

def main():
    """Função principal"""
    print("[INICIO] INICIANDO CONFIGURAÇÃO A/B TESTING")
    print("=" * 50)

    try:
        # Criar experimentos de exemplo
        created = create_sample_experiments()

        if created > 0:
            # Testar fluxo de atribuição
            test_success = test_assignment_flow()

            # Mostrar estatísticas
            display_experiment_stats()

            print(f"\n[SUCESSO] CONFIGURAÇÃO CONCLUÍDA!")
            print(f"[OK] {created} experimentos criados")
            print(f"[OK] Testes de atribuição: {'PASSOU' if test_success else 'FALHOU'}")
            print(f"\n[URL] Acesse: http://localhost:5000/api/v1/ab-testing/experiments")

        else:
            print("[ERRO] Falha na criação dos experimentos")

    except Exception as e:
        print(f"[ERRO] Erro durante configuração: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()