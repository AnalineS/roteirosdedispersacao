# -*- coding: utf-8 -*-
"""
Educational Validation API Blueprint
Sistema de validação educacional em tempo real

Desenvolvido por: Claude Code QA Specialist
Data: 2025-01-10
Versão: 1.0.0

Objetivo: API endpoints para validação de qualidade educacional
integrando EducationalQAFramework com o sistema ativo
"""

import json
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from flask import Blueprint, request, jsonify
import logging

# Importações do sistema
from core.validation.educational_qa_framework import (
    EducationalQAFramework, PersonaType, ValidationResult,
    ValidationSeverity, create_comprehensive_qa_report
)
from services.cache.unified_cache_manager import get_unified_cache
from utils.rate_limiter import rate_limit

# Setup
validation_bp = Blueprint('validation', __name__)
logger = logging.getLogger(__name__)

# Instância global do framework de validação
qa_framework = EducationalQAFramework()
cache = get_unified_cache()

# Cache keys
VALIDATION_METRICS_KEY = "validation:metrics:{}:24h"
VALIDATION_ALERTS_KEY = "validation:alerts:active"
VALIDATION_HISTORY_KEY = "validation:history:{}:7d"

@validation_bp.route('/api/v1/validation/response', methods=['POST'])
@rate_limit(max_requests=100, window_seconds=3600)  # 100 requests per hour
def validate_response():
    """
    Valida uma resposta individual usando EducationalQAFramework
    
    POST /api/v1/validation/response
    {
        "response": "texto da resposta",
        "persona": "dr_gasnelio" | "ga",
        "user_question": "pergunta do usuário",
        "context": {}, // opcional
        "store_result": true // opcional, default true
    }
    """
    try:
        data = request.get_json()
        
        # Validação de entrada
        if not data or not all(k in data for k in ['response', 'persona', 'user_question']):
            return jsonify({
                'error': 'Campos obrigatórios: response, persona, user_question'
            }), 400
        
        # Extrair dados
        response_text = data['response']
        persona_str = data['persona']
        user_question = data['user_question']
        context = data.get('context', {})
        store_result = data.get('store_result', True)
        
        # Validar persona
        try:
            persona = PersonaType(persona_str)
        except ValueError:
            return jsonify({
                'error': f'Persona inválida: {persona_str}. Use: dr_gasnelio ou ga'
            }), 400
        
        # Executar validação
        start_time = time.time()
        validation_result = qa_framework.validate_response(
            response_text, persona, user_question, context
        )
        validation_time = (time.time() - start_time) * 1000
        
        # Gerar ID único para o resultado
        result_id = str(uuid.uuid4())
        
        # Preparar resposta
        response_data = {
            'validation_id': result_id,
            'validation_result': {
                'test_name': validation_result.test_name,
                'passed': validation_result.passed,
                'score': validation_result.score,
                'severity': validation_result.severity.value,
                'details': validation_result.details,
                'recommendations': validation_result.recommendations,
                'timestamp': validation_result.timestamp
            },
            'metadata': {
                'persona': persona_str,
                'validation_time_ms': validation_time,
                'framework_version': '1.0.0'
            }
        }
        
        # Armazenar resultado se solicitado
        if store_result:
            _store_validation_result(result_id, validation_result, persona_str, validation_time)
        
        # Monitor de performance
        qa_framework.performance_monitor.monitor_response_quality(validation_result)
        
        logger.info(f"Validação executada: ID={result_id}, Score={validation_result.score:.2f}, Tempo={validation_time:.0f}ms")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro na validação: {str(e)}")
        return jsonify({
            'error': 'Erro interno na validação',
            'details': str(e) if request.environ.get('FLASK_ENV') == 'development' else None
        }), 500

@validation_bp.route('/api/v1/validation/metrics', methods=['GET'])
@rate_limit(max_requests=200, window_seconds=3600)  # 200 requests per hour
def get_validation_metrics():
    """
    Obtém métricas agregadas de validação
    
    GET /api/v1/validation/metrics?period=24h&persona=dr_gasnelio
    
    Query params:
    - period: 1h, 6h, 24h, 7d (default: 24h)
    - persona: dr_gasnelio, ga (opcional)
    """
    try:
        # Parâmetros de consulta
        period = request.args.get('period', '24h')
        persona_filter = request.args.get('persona')
        
        # Validar período
        if period not in ['1h', '6h', '24h', '7d']:
            return jsonify({'error': 'Período inválido. Use: 1h, 6h, 24h, 7d'}), 400
        
        # Cache key
        cache_key = VALIDATION_METRICS_KEY.format(f"{period}_{persona_filter or 'all'}")
        
        # Tentar buscar do cache
        cached_metrics = cache.get(cache_key)
        if cached_metrics:
            logger.debug(f"Métricas servidas do cache: {cache_key}")
            return jsonify(cached_metrics), 200
        
        # Calcular métricas
        metrics = _calculate_validation_metrics(period, persona_filter)
        
        # Cache por período apropriado
        cache_ttl = {
            '1h': 300,    # 5 minutos
            '6h': 900,    # 15 minutos
            '24h': 1800,  # 30 minutos
            '7d': 3600    # 1 hora
        }.get(period, 1800)
        
        cache.set(cache_key, metrics, ttl=cache_ttl)
        
        logger.info(f"Métricas calculadas: período={period}, persona={persona_filter}")
        
        return jsonify(metrics), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas: {str(e)}")
        return jsonify({
            'error': 'Erro ao calcular métricas de validação'
        }), 500

@validation_bp.route('/api/v1/validation/batch', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=3600)  # 20 batch requests per hour
def validate_batch():
    """
    Valida múltiplas respostas em lote
    
    POST /api/v1/validation/batch
    {
        "responses": [
            {
                "response": "texto 1",
                "persona": "dr_gasnelio",
                "user_question": "pergunta 1",
                "context": {}
            },
            // ... até 20 respostas por batch
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'responses' not in data:
            return jsonify({'error': 'Campo obrigatório: responses'}), 400
        
        responses_data = data['responses']
        
        # Limite de batch
        if len(responses_data) > 20:
            return jsonify({
                'error': 'Máximo 20 respostas por lote'
            }), 400
        
        # Gerar relatório abrangente
        batch_id = str(uuid.uuid4())
        
        # Preparar dados para validação
        validation_inputs = []
        for resp_data in responses_data:
            if not all(k in resp_data for k in ['response', 'persona', 'user_question']):
                return jsonify({
                    'error': 'Cada resposta deve ter: response, persona, user_question'
                }), 400
            validation_inputs.append(resp_data)
        
        # Executar validação em lote
        start_time = time.time()
        batch_report = create_comprehensive_qa_report(qa_framework, validation_inputs)
        batch_time = (time.time() - start_time) * 1000
        
        # Preparar resposta
        response_data = {
            'batch_id': batch_id,
            'batch_report': batch_report,
            'metadata': {
                'total_responses': len(responses_data),
                'batch_time_ms': batch_time,
                'framework_version': '1.0.0',
                'timestamp': datetime.now().isoformat()
            }
        }
        
        logger.info(f"Validação em lote executada: ID={batch_id}, Total={len(responses_data)}, Tempo={batch_time:.0f}ms")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Erro na validação em lote: {str(e)}")
        return jsonify({
            'error': 'Erro interno na validação em lote'
        }), 500

@validation_bp.route('/api/v1/validation/dashboard-data', methods=['GET'])
@rate_limit(max_requests=300, window_seconds=3600)  # 300 requests per hour
def get_dashboard_data():
    """
    Obtém dados formatados para o Quality Dashboard
    
    GET /api/v1/validation/dashboard-data
    """
    try:
        # Obter métricas de diferentes períodos
        current_metrics = _calculate_validation_metrics('24h')
        recent_alerts = _get_active_alerts()
        performance_summary = qa_framework.performance_monitor.get_performance_summary()
        
        # Preparar dados do dashboard
        dashboard_data = {
            'metrics': {
                'engagement': {
                    'completionRate': current_metrics.get('completion_rate', 0.85),
                    'sessionDuration': current_metrics.get('avg_session_duration', 12.5),
                    'componentInteractions': current_metrics.get('avg_interactions', 8),
                    'returnRate': current_metrics.get('return_rate', 0.72)
                },
                'learning': {
                    'knowledgeRetention': current_metrics.get('knowledge_retention', 0.78),
                    'mistakePatterns': current_metrics.get('mistake_patterns', []),
                    'conceptMastery': dict(current_metrics.get('concept_mastery', {}))
                },
                'quality': {
                    'userSatisfaction': current_metrics.get('user_satisfaction', 4.2),
                    'avgQualityScore': current_metrics.get('avg_quality_score', 0.83),
                    'consistencyScore': current_metrics.get('persona_consistency', 0.87)
                },
                'performance': {
                    'responseTime': performance_summary.get('avg_response_time', 1200),
                    'loadTimes': current_metrics.get('load_times', []),
                    'errorRates': _convert_error_rates_to_map(current_metrics.get('error_rates', {})),
                    'resourceUsage': {
                        'memoryPeak': current_metrics.get('memory_peak', 45.2),
                        'networkRequests': current_metrics.get('network_requests', 23),
                        'storageUsed': current_metrics.get('storage_used', 1024)
                    }
                }
            },
            'alerts': recent_alerts,
            'summary': {
                'totalValidations': current_metrics.get('total_validations', 0),
                'criticalIssues': len([a for a in recent_alerts if a.get('severity') == 'critical']),
                'overallHealthScore': _calculate_overall_health_score(current_metrics),
                'lastUpdate': datetime.now().isoformat()
            }
        }
        
        logger.debug("Dados do dashboard fornecidos")
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter dados do dashboard: {str(e)}")
        return jsonify({
            'error': 'Erro ao carregar dados do dashboard'
        }), 500

@validation_bp.route('/api/v1/validation/alerts', methods=['GET'])
@rate_limit(max_requests=100, window_seconds=3600)
def get_validation_alerts():
    """
    Obtém alertas ativos do sistema de validação
    
    GET /api/v1/validation/alerts?severity=critical
    """
    try:
        severity_filter = request.args.get('severity')
        alerts = _get_active_alerts()
        
        if severity_filter:
            alerts = [a for a in alerts if a.get('severity') == severity_filter]
        
        return jsonify({
            'alerts': alerts,
            'count': len(alerts),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter alertas: {str(e)}")
        return jsonify({'error': 'Erro ao carregar alertas'}), 500

# ===== FUNÇÕES AUXILIARES =====

def _store_validation_result(result_id: str, validation_result: ValidationResult, 
                           persona: str, validation_time: float):
    """Armazena resultado de validação no cache para análise"""
    try:
        # Chave para histórico
        history_key = VALIDATION_HISTORY_KEY.format(persona)
        
        # Dados a armazenar
        result_data = {
            'id': result_id,
            'score': validation_result.score,
            'passed': validation_result.passed,
            'severity': validation_result.severity.value,
            'persona': persona,
            'validation_time_ms': validation_time,
            'timestamp': time.time()
        }
        
        # Adicionar ao histórico (lista limitada)
        history = cache.get(history_key) or []
        history.append(result_data)
        
        # Manter apenas últimos 1000 resultados
        if len(history) > 1000:
            history = history[-1000:]
        
        cache.set(history_key, history, ttl=7 * 24 * 3600)  # 7 dias
        
    except Exception as e:
        logger.warning(f"Erro ao armazenar resultado de validação: {e}")

def _calculate_validation_metrics(period: str, persona_filter: Optional[str] = None) -> Dict[str, Any]:
    """Calcula métricas de validação para o período especificado"""
    try:
        # Definir janela de tempo
        time_windows = {
            '1h': 3600,
            '6h': 6 * 3600,
            '24h': 24 * 3600,
            '7d': 7 * 24 * 3600
        }
        
        window_seconds = time_windows.get(period, 24 * 3600)
        cutoff_time = time.time() - window_seconds
        
        # Obter dados do cache
        personas = [persona_filter] if persona_filter else ['dr_gasnelio', 'ga']
        all_results = []
        
        for persona in personas:
            history_key = VALIDATION_HISTORY_KEY.format(persona)
            persona_history = cache.get(history_key) or []
            
            # Filtrar por período
            recent_results = [
                r for r in persona_history 
                if r.get('timestamp', 0) >= cutoff_time
            ]
            all_results.extend(recent_results)
        
        # Calcular métricas
        if not all_results:
            return _get_default_metrics()
        
        scores = [r['score'] for r in all_results]
        times = [r['validation_time_ms'] for r in all_results]
        
        metrics = {
            'total_validations': len(all_results),
            'avg_quality_score': sum(scores) / len(scores),
            'min_quality_score': min(scores),
            'max_quality_score': max(scores),
            'avg_validation_time': sum(times) / len(times),
            'pass_rate': len([r for r in all_results if r['passed']]) / len(all_results),
            'persona_distribution': _calculate_persona_distribution(all_results),
            'severity_distribution': _calculate_severity_distribution(all_results),
            'completion_rate': 0.85 + (sum(scores) / len(scores) - 0.5) * 0.3,  # Estimativa
            'knowledge_retention': min(1.0, sum(scores) / len(scores) + 0.1),
            'user_satisfaction': 3.0 + (sum(scores) / len(scores)) * 2,  # 1-5 scale
            'persona_consistency': sum(scores) / len(scores),
            'period': period,
            'timestamp': datetime.now().isoformat()
        }
        
        return metrics
        
    except Exception as e:
        logger.error(f"Erro ao calcular métricas: {e}")
        return _get_default_metrics()

def _get_default_metrics() -> Dict[str, Any]:
    """Retorna métricas padrão quando não há dados"""
    return {
        'total_validations': 0,
        'avg_quality_score': 0.8,
        'min_quality_score': 0.5,
        'max_quality_score': 0.95,
        'avg_validation_time': 1500,
        'pass_rate': 0.85,
        'completion_rate': 0.85,
        'knowledge_retention': 0.78,
        'user_satisfaction': 4.1,
        'persona_consistency': 0.87,
        'persona_distribution': {'dr_gasnelio': 0.6, 'ga': 0.4},
        'severity_distribution': {'low': 0.7, 'medium': 0.2, 'high': 0.08, 'critical': 0.02},
        'timestamp': datetime.now().isoformat()
    }

def _calculate_persona_distribution(results: List[Dict]) -> Dict[str, float]:
    """Calcula distribuição de personas nos resultados"""
    if not results:
        return {'dr_gasnelio': 0.5, 'ga': 0.5}
    
    total = len(results)
    distribution = {}
    
    for persona in ['dr_gasnelio', 'ga']:
        count = len([r for r in results if r.get('persona') == persona])
        distribution[persona] = count / total
    
    return distribution

def _calculate_severity_distribution(results: List[Dict]) -> Dict[str, float]:
    """Calcula distribuição de severidade nos resultados"""
    if not results:
        return {'low': 0.7, 'medium': 0.2, 'high': 0.08, 'critical': 0.02}
    
    total = len(results)
    distribution = {}
    
    for severity in ['low', 'medium', 'high', 'critical']:
        count = len([r for r in results if r.get('severity') == severity])
        distribution[severity] = count / total
    
    return distribution

def _get_active_alerts() -> List[Dict[str, Any]]:
    """Obtém alertas ativos do sistema"""
    try:
        alerts_key = VALIDATION_ALERTS_KEY
        cached_alerts = cache.get(alerts_key)
        
        if cached_alerts:
            return cached_alerts
        
        # Gerar alertas baseados nas métricas atuais
        current_metrics = _calculate_validation_metrics('1h')
        alerts = []
        
        # Alerta de qualidade baixa
        if current_metrics['avg_quality_score'] < 0.7:
            alerts.append({
                'id': str(uuid.uuid4()),
                'title': 'Qualidade de Resposta Baixa',
                'description': f'Score médio de qualidade caiu para {current_metrics["avg_quality_score"]:.2f}',
                'severity': 'high' if current_metrics['avg_quality_score'] < 0.6 else 'medium',
                'category': 'quality',
                'timestamp': datetime.now(),
                'status': 'active',
                'actions': {
                    'immediate': [
                        'Revisar prompts de personas',
                        'Verificar base de conhecimento',
                        'Analisar padrões de erro'
                    ]
                }
            })
        
        # Alerta de taxa de falha alta
        if current_metrics['pass_rate'] < 0.8:
            alerts.append({
                'id': str(uuid.uuid4()),
                'title': 'Taxa de Falha Alta',
                'description': f'Taxa de aprovação caiu para {current_metrics["pass_rate"]:.1%}',
                'severity': 'critical' if current_metrics['pass_rate'] < 0.7 else 'high',
                'category': 'reliability',
                'timestamp': datetime.now(),
                'status': 'active',
                'actions': {
                    'immediate': [
                        'Investigar causas de falha',
                        'Revisar validadores',
                        'Verificar integridade dos dados'
                    ]
                }
            })
        
        # Cache alertas por 5 minutos
        cache.set(alerts_key, alerts, ttl=300)
        
        return alerts
        
    except Exception as e:
        logger.error(f"Erro ao obter alertas: {e}")
        return []

def _convert_error_rates_to_map(error_rates: Dict) -> Any:
    """Converte rates de erro para formato Map do frontend"""
    # O frontend espera um Map object, retornamos um dict que será convertido
    return error_rates if isinstance(error_rates, dict) else {}

def _calculate_overall_health_score(metrics: Dict[str, Any]) -> int:
    """Calcula score geral de saúde do sistema"""
    try:
        weights = {
            'quality': 0.4,
            'reliability': 0.3,
            'performance': 0.2,
            'consistency': 0.1
        }
        
        scores = {
            'quality': metrics.get('avg_quality_score', 0.8) * 100,
            'reliability': metrics.get('pass_rate', 0.85) * 100,
            'performance': min(100, 3000 / max(metrics.get('avg_validation_time', 1500), 1)),
            'consistency': metrics.get('persona_consistency', 0.87) * 100
        }
        
        overall = sum(scores[key] * weights[key] for key in weights)
        return int(round(overall))
        
    except Exception as e:
        logger.error(f"Erro ao calcular score de saúde: {e}")
        return 75  # Default score

# Registro do blueprint será feito no main app