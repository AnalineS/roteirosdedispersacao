# -*- coding: utf-8 -*-
"""
Memory Management Blueprint - Endpoints de Monitoramento e Otimização de Memória
================================================================================

Endpoints especializados para monitoramento, profiling e otimização de memória.
Inclui alertas médicos para uso excessivo de memória e otimização automática.

Author: Claude Code - Performance Engineer
Date: 2025-09-23
Target: Memory usage < 70%
"""

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import logging
import gc
import sys
from typing import Dict, Any, Optional

# Import do otimizador de memória
try:
    from core.performance.memory_optimizer import get_memory_optimizer, optimize_memory_usage, get_memory_health
    MEMORY_OPTIMIZER_AVAILABLE = True
except ImportError:
    MEMORY_OPTIMIZER_AVAILABLE = False

# Import opcional do psutil
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)

# Criar blueprint
memory_bp = Blueprint('memory', __name__, url_prefix='/api/v1/memory')

@memory_bp.route('/health', methods=['GET'])
def memory_health():
    """
    Endpoint de saúde da memória - Substitui alertas manuais por monitoramento automático

    Retorna:
    - Status atual da memória
    - Alertas médicos se necessário
    - Recomendações de otimização
    """
    try:
        if not MEMORY_OPTIMIZER_AVAILABLE:
            return jsonify({
                'error': 'Memory optimizer not available',
                'status': 'degraded',
                'timestamp': datetime.now().isoformat()
            }), 503

        # Obter estatísticas de memória
        memory_stats = get_memory_health()

        # Determinar status e alertas
        memory_percent = memory_stats.get('current', {}).get('memory_percent', 0)
        status = memory_stats.get('current', {}).get('status', 'unknown')

        response = {
            'status': status,
            'memory_percent': memory_percent,
            'timestamp': datetime.now().isoformat(),
            'stats': memory_stats
        }

        # Adicionar alertas médicos baseados no uso
        if memory_percent >= 85:
            response['alert'] = {
                'level': 'CRÍTICO',
                'type': 'ALERTA MÉDICO [high_memory_usage]',
                'message': f'Uso crítico de memória: {memory_percent}% - Otimização emergencial necessária',
                'action_required': 'immediate_optimization',
                'recommendations': [
                    'Execute POST /api/v1/memory/optimize/force para limpeza emergencial',
                    'Reduza carga do sistema temporariamente',
                    'Monitore logs para identificar vazamentos'
                ]
            }
            status_code = 503  # Service Unavailable

        elif memory_percent >= 75:
            response['alert'] = {
                'level': 'AVISO',
                'type': 'WARNING [high_memory_usage]',
                'message': f'Uso elevado de memória: {memory_percent}% - Monitoramento intensificado',
                'action_required': 'monitoring',
                'recommendations': [
                    'Execute GET /api/v1/memory/profile para análise detalhada',
                    'Considere otimização preventiva'
                ]
            }
            status_code = 200

        else:
            response['alert'] = None
            status_code = 200

        return jsonify(response), status_code

    except Exception as e:
        logger.error(f"[MEMORY] Erro no health check: {e}")
        return jsonify({
            'error': 'Failed to check memory health',
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@memory_bp.route('/profile', methods=['GET'])
def memory_profile():
    """
    Profiling detalhado de memória

    Retorna:
    - Distribuição de memória por componente
    - Estatísticas de garbage collection
    - Análise de cache
    - Recomendações de otimização
    """
    try:
        profile_data = {
            'timestamp': datetime.now().isoformat(),
            'system': {},
            'python': {},
            'cache': {},
            'gc': {},
            'analysis': {}
        }

        # Informações do sistema (psutil)
        if PSUTIL_AVAILABLE:
            mem = psutil.virtual_memory()
            profile_data['system'] = {
                'total_mb': round(mem.total / (1024 * 1024), 1),
                'used_mb': round(mem.used / (1024 * 1024), 1),
                'available_mb': round(mem.available / (1024 * 1024), 1),
                'percent': mem.percent,
                'buffers_mb': round(getattr(mem, 'buffers', 0) / (1024 * 1024), 1),
                'cached_mb': round(getattr(mem, 'cached', 0) / (1024 * 1024), 1)
            }
        else:
            profile_data['system'] = {'error': 'psutil not available'}

        # Informações do Python
        try:
            import resource
            rusage = resource.getrusage(resource.RUSAGE_SELF)

            profile_data['python'] = {
                'objects_count': len(gc.get_objects()),
                'memory_rss_mb': round(rusage.ru_maxrss / 1024, 1),  # Linux: KB -> MB
                'page_faults': rusage.ru_majflt,
                'context_switches': rusage.ru_nvcsw + rusage.ru_nivcsw,
                'sys_getsizeof_mb': round(sys.getsizeof(gc.get_objects()) / (1024 * 1024), 2)
            }
        except Exception as e:
            profile_data['python'] = {'error': f'Failed to get Python stats: {e}'}

        # Informações de cache
        if MEMORY_OPTIMIZER_AVAILABLE:
            optimizer = get_memory_optimizer()
            cache_stats = optimizer.get_memory_stats()
            profile_data['cache'] = cache_stats.get('cache', {})
        else:
            profile_data['cache'] = {'error': 'Memory optimizer not available'}

        # Informações de garbage collection
        gc_stats = gc.get_stats()
        profile_data['gc'] = {
            'collections': gc_stats,
            'counts': gc.get_count(),
            'threshold': gc.get_threshold(),
            'referrers_sample': len(gc.get_referrers(gc.get_objects()[:10])) if gc.get_objects() else 0
        }

        # Análise e recomendações
        if PSUTIL_AVAILABLE and 'percent' in profile_data['system']:
            memory_percent = profile_data['system']['percent']

            if memory_percent > 80:
                profile_data['analysis'] = {
                    'status': 'critical',
                    'recommendations': [
                        'Executar otimização emergencial',
                        'Reduzir tamanho do cache',
                        'Investigar vazamentos de memória',
                        'Considerar restart do serviço'
                    ],
                    'priority': 'high'
                }
            elif memory_percent > 65:
                profile_data['analysis'] = {
                    'status': 'warning',
                    'recommendations': [
                        'Executar otimização preventiva',
                        'Monitorar tendência de crescimento',
                        'Revisar configurações de cache'
                    ],
                    'priority': 'medium'
                }
            else:
                profile_data['analysis'] = {
                    'status': 'healthy',
                    'recommendations': [
                        'Manter monitoramento regular',
                        'Configurações atuais adequadas'
                    ],
                    'priority': 'low'
                }

        return jsonify(profile_data), 200

    except Exception as e:
        logger.error(f"[MEMORY] Erro no profiling: {e}")
        return jsonify({
            'error': 'Failed to generate memory profile',
            'timestamp': datetime.now().isoformat()
        }), 500

@memory_bp.route('/optimize', methods=['POST'])
def memory_optimize():
    """
    Executa otimização automática de memória

    Parâmetros opcionais:
    - aggressive: bool - Usar limpeza agressiva
    """
    try:
        if not MEMORY_OPTIMIZER_AVAILABLE:
            return jsonify({
                'error': 'Memory optimizer not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        # Verificar parâmetros
        aggressive = request.json.get('aggressive', False) if request.is_json else False

        logger.info(f"[MEMORY] Iniciando otimização manual - aggressive={aggressive}")

        # Executar otimização
        optimization_result = optimize_memory_usage()

        # Adicionar informações sobre o tipo de otimização
        optimization_result['optimization_type'] = 'aggressive' if aggressive else 'standard'
        optimization_result['triggered_by'] = 'manual_request'

        # Log do resultado
        improvement = optimization_result.get('improvement', {})
        percent_freed = improvement.get('percent_freed', 0)
        mb_freed = improvement.get('mb_freed', 0)

        logger.info(f"[MEMORY] Otimização concluída - {percent_freed}% / {mb_freed}MB liberados")

        return jsonify(optimization_result), 200

    except Exception as e:
        logger.error(f"[MEMORY] Erro na otimização: {e}")
        return jsonify({
            'error': 'Failed to optimize memory',
            'timestamp': datetime.now().isoformat()
        }), 500

@memory_bp.route('/optimize/force', methods=['POST'])
def memory_optimize_force():
    """
    Executa limpeza emergencial de memória - Para uso em situações críticas

    ATENÇÃO: Esta operação pode afetar temporariamente a performance
    """
    try:
        if not MEMORY_OPTIMIZER_AVAILABLE:
            return jsonify({
                'error': 'Memory optimizer not available',
                'timestamp': datetime.now().isoformat()
            }), 503

        logger.warning("[MEMORY] LIMPEZA EMERGENCIAL solicitada via API")

        # Obter métricas antes da limpeza
        initial_stats = get_memory_health()
        initial_percent = initial_stats.get('current', {}).get('memory_percent', 0)

        # Executar limpeza emergencial
        optimizer = get_memory_optimizer()

        # Limpeza manual agressiva
        with optimizer._optimization_lock:
            # Limpar cache completamente
            optimizer._cache.clear()
            optimizer._cache_timestamps.clear()
            optimizer._cache_access_count.clear()

            # Múltiplas passadas de garbage collection
            collected_objects = 0
            for i in range(5):
                collected = gc.collect()
                collected_objects += collected

            optimizer._gc_stats['collections'] += 5
            optimizer._gc_stats['freed_objects'] += collected_objects

        # Obter métricas após limpeza
        final_stats = get_memory_health()
        final_percent = final_stats.get('current', {}).get('memory_percent', 0)

        result = {
            'emergency_cleanup': True,
            'before': {
                'memory_percent': initial_percent
            },
            'after': {
                'memory_percent': final_percent
            },
            'improvement': {
                'percent_freed': round(initial_percent - final_percent, 1),
                'gc_objects_collected': collected_objects
            },
            'warning': 'Emergency cleanup executed - monitor system stability',
            'timestamp': datetime.now().isoformat()
        }

        logger.warning(f"[MEMORY] LIMPEZA EMERGENCIAL concluída - {initial_percent}% -> {final_percent}%")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"[MEMORY] Erro na limpeza emergencial: {e}")
        return jsonify({
            'error': 'Failed to execute emergency cleanup',
            'timestamp': datetime.now().isoformat()
        }), 500

@memory_bp.route('/stats', methods=['GET'])
def memory_stats():
    """
    Endpoint simplificado para estatísticas básicas de memória
    """
    try:
        if MEMORY_OPTIMIZER_AVAILABLE:
            stats = get_memory_health()

            # Formato simplificado
            simple_stats = {
                'memory_percent': stats.get('current', {}).get('memory_percent', 0),
                'status': stats.get('current', {}).get('status', 'unknown'),
                'cache_items': stats.get('cache', {}).get('items', 0),
                'cache_size_mb': stats.get('cache', {}).get('size_mb', 0),
                'timestamp': datetime.now().isoformat()
            }

            return jsonify(simple_stats), 200
        else:
            # Fallback básico
            if PSUTIL_AVAILABLE:
                mem = psutil.virtual_memory()
                return jsonify({
                    'memory_percent': mem.percent,
                    'status': 'basic_monitoring',
                    'timestamp': datetime.now().isoformat()
                }), 200
            else:
                return jsonify({
                    'error': 'No memory monitoring available',
                    'timestamp': datetime.now().isoformat()
                }), 503

    except Exception as e:
        logger.error(f"[MEMORY] Erro nas estatísticas: {e}")
        return jsonify({
            'error': 'Failed to get memory stats',
            'timestamp': datetime.now().isoformat()
        }), 500

@memory_bp.route('/gc/force', methods=['POST'])
def force_garbage_collection():
    """
    Força garbage collection manual
    """
    try:
        initial_objects = len(gc.get_objects())

        # Executar GC em todas as gerações
        collected = [gc.collect(i) for i in range(3)]
        total_collected = sum(collected)

        final_objects = len(gc.get_objects())

        result = {
            'initial_objects': initial_objects,
            'final_objects': final_objects,
            'objects_freed': initial_objects - final_objects,
            'gc_collected': {
                'generation_0': collected[0],
                'generation_1': collected[1],
                'generation_2': collected[2],
                'total': total_collected
            },
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"[GC] Coleta forçada: {total_collected} objetos coletados")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"[GC] Erro na coleta forçada: {e}")
        return jsonify({
            'error': 'Failed to force garbage collection',
            'timestamp': datetime.now().isoformat()
        }), 500

# Adicionar blueprint para registro
__all__ = ['memory_bp']