"""
GA4 Integration Blueprint - Integração Profissional Google Analytics 4
Conecta UX tracking backend com GA4 frontend para analytics consolidados
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import asyncio
import json
from typing import Dict, Any, List, Optional
import hashlib

from core.auth.jwt_validator import require_auth, optional_auth
from core.security.enhanced_security import require_rate_limit
from services.monitoring.ux_monitoring_manager import get_ux_monitoring_manager
from core.logging.cloud_logger import cloud_logger

ga4_integration_bp = Blueprint('ga4_integration', __name__, url_prefix='/api/ga4')

class GA4IntegrationManager:
    """Gerenciador de integração entre UX tracking e GA4"""

    def __init__(self):
        self.ux_manager = get_ux_monitoring_manager()
        self.session_map = {}  # session_id -> ux_data mapping
        self.ga4_events_buffer = []  # Buffer para eventos GA4

    def sync_ux_to_ga4(self, ux_data: Dict[str, Any]) -> Dict[str, Any]:
        """Converte dados UX tracking para formato GA4"""
        ga4_event = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_name': self._map_ux_to_ga4_event(ux_data.get('event_type')),
            'parameters': {
                'session_id': ux_data.get('session_id'),
                'user_id_hash': self._hash_user_id(ux_data.get('user_id')),
                'page_location': ux_data.get('page', '/unknown'),
                'engagement_time_msec': ux_data.get('duration_ms', 0),
                'custom_parameters': {
                    'ux_category': ux_data.get('category', 'unknown'),
                    'interaction_type': ux_data.get('action', 'unknown'),
                    'medical_context': ux_data.get('persona') is not None,
                    'educational_content': ux_data.get('educational', False),
                    'accessibility_event': ux_data.get('accessibility', False)
                }
            }
        }

        # Adicionar parâmetros específicos por tipo
        if ux_data.get('persona'):
            ga4_event['parameters']['custom_parameters']['persona_id'] = ux_data['persona']
            ga4_event['parameters']['custom_parameters']['medical_interaction'] = True

        if ux_data.get('web_vitals'):
            vitals = ux_data['web_vitals']
            ga4_event['parameters']['custom_parameters'].update({
                'lcp_value': vitals.get('lcp', 0),
                'fid_value': vitals.get('fid', 0),
                'cls_value': vitals.get('cls', 0),
                'web_vitals_score': self._calculate_vitals_score(vitals)
            })

        if ux_data.get('error'):
            error = ux_data['error']
            ga4_event['parameters']['custom_parameters'].update({
                'error_type': error.get('type', 'unknown'),
                'error_severity': error.get('severity', 'medium'),
                'component': error.get('component', 'unknown')
            })

        return ga4_event

    def sync_ga4_to_ux(self, ga4_data: Dict[str, Any]) -> Dict[str, Any]:
        """Converte dados GA4 para formato UX tracking"""
        if not self.ux_manager:
            return {}

        event_type = ga4_data.get('event_name')
        params = ga4_data.get('parameters', {})
        custom_params = params.get('custom_parameters', {})

        ux_data = {
            'user_id': self._unhash_user_id(params.get('user_id_hash')),
            'session_id': params.get('session_id'),
            'page': params.get('page_location', '/unknown'),
            'timestamp': datetime.now(timezone.utc),
            'duration_ms': params.get('engagement_time_msec', 0),
            'action': self._map_ga4_to_ux_action(event_type),
            'metadata': custom_params
        }

        # Processar no UX Manager
        if event_type == 'page_view':
            self.ux_manager.track_page_view(
                user_id=ux_data['user_id'],
                session_id=ux_data['session_id'],
                page=ux_data['page'],
                duration_ms=ux_data['duration_ms']
            )
        elif event_type == 'user_interaction':
            self.ux_manager.track_user_interaction(
                user_id=ux_data['user_id'],
                session_id=ux_data['session_id'],
                action=ux_data['action'],
                element=custom_params.get('element', 'unknown'),
                metadata=custom_params
            )
        elif custom_params.get('medical_interaction'):
            self.ux_manager.track_chat_interaction(
                user_id=ux_data['user_id'],
                session_id=ux_data['session_id'],
                persona=custom_params.get('persona_id', 'unknown'),
                query='Frontend tracked query',
                response_time_ms=ux_data['duration_ms']
            )

        return ux_data

    def _map_ux_to_ga4_event(self, ux_event_type: str) -> str:
        """Mapeia tipos de evento UX para GA4"""
        mapping = {
            'page_view': 'page_view',
            'user_interaction': 'user_engagement',
            'chat_interaction': 'chat_message',
            'error': 'exception',
            'web_vitals': 'web_vitals',
            'accessibility': 'accessibility_event',
            'educational': 'educational_progress'
        }
        return mapping.get(ux_event_type, 'custom_event')

    def _map_ga4_to_ux_action(self, ga4_event: str) -> str:
        """Mapeia eventos GA4 para ações UX"""
        mapping = {
            'page_view': 'page_view',
            'user_engagement': 'interaction',
            'chat_message': 'chat_query',
            'exception': 'error',
            'web_vitals': 'performance_metric',
            'educational_progress': 'learning_action'
        }
        return mapping.get(ga4_event, 'unknown_action')

    def _hash_user_id(self, user_id: Optional[str]) -> Optional[str]:
        """Hash user ID para privacidade"""
        if not user_id:
            return None
        return hashlib.sha256(f"{user_id}_ga4_salt".encode()).hexdigest()[:16]

    def _unhash_user_id(self, hashed_id: Optional[str]) -> Optional[str]:
        """Recupera user ID (limitado para sessões ativas)"""
        if not hashed_id:
            return None
        # Para privacidade, retornamos apenas um ID anônimo
        return f"user_{hashed_id[:8]}"

    def _calculate_vitals_score(self, vitals: Dict[str, float]) -> float:
        """Calcula score Web Vitals"""
        lcp = vitals.get('lcp', 0)
        fid = vitals.get('fid', 0)
        cls = vitals.get('cls', 0)

        lcp_score = 100 if lcp <= 2500 else (75 if lcp <= 4000 else 50)
        fid_score = 100 if fid <= 100 else (75 if fid <= 300 else 50)
        cls_score = 100 if cls <= 0.1 else (75 if cls <= 0.25 else 50)

        return (lcp_score + fid_score + cls_score) / 3

# Instância global
ga4_integration = GA4IntegrationManager()

@ga4_integration_bp.route('/sync/ux-to-ga4', methods=['POST'])
@require_rate_limit('default')
@optional_auth
def sync_ux_to_ga4():
    """Sincroniza dados UX tracking para formato GA4"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados JSON necessários'}), 400

        # Converter dados UX para GA4
        ga4_events = []
        ux_events = data.get('ux_events', [])

        for ux_event in ux_events:
            ga4_event = ga4_integration.sync_ux_to_ga4(ux_event)
            ga4_events.append(ga4_event)

        # Log para auditoria
        cloud_logger.info('UX to GA4 sync completed', {
            'events_count': len(ga4_events),
            'session_ids': list(set([e.get('parameters', {}).get('session_id') for e in ga4_events if e.get('parameters', {}).get('session_id')]))
        })

        return jsonify({
            'success': True,
            'ga4_events': ga4_events,
            'events_converted': len(ga4_events),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200

    except Exception as e:
        cloud_logger.error('Error in UX to GA4 sync', error=e)
        return jsonify({
            'success': False,
            'error': 'Erro interno na sincronização'
        }), 500

@ga4_integration_bp.route('/sync/ga4-to-ux', methods=['POST'])
@require_rate_limit('default')
@optional_auth
def sync_ga4_to_ux():
    """Sincroniza dados GA4 para UX tracking"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados JSON necessários'}), 400

        # Converter dados GA4 para UX
        ux_events = []
        ga4_events = data.get('ga4_events', [])

        for ga4_event in ga4_events:
            ux_event = ga4_integration.sync_ga4_to_ux(ga4_event)
            if ux_event:
                ux_events.append(ux_event)

        # Log para auditoria
        cloud_logger.info('GA4 to UX sync completed', {
            'events_count': len(ux_events),
            'ga4_events_processed': len(ga4_events)
        })

        return jsonify({
            'success': True,
            'ux_events_created': len(ux_events),
            'processed_events': len(ga4_events),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200

    except Exception as e:
        cloud_logger.error('Error in GA4 to UX sync', error=e)
        return jsonify({
            'success': False,
            'error': 'Erro interno na sincronização'
        }), 500

@ga4_integration_bp.route('/analytics/consolidated', methods=['GET'])
@require_rate_limit('default')
@optional_auth
def get_consolidated_analytics():
    """Retorna analytics consolidados UX + GA4"""
    try:
        if not ga4_integration.ux_manager:
            return jsonify({'error': 'UX Manager não disponível'}), 503

        # Dados UX do backend
        ux_metrics = ga4_integration.ux_manager.get_current_metrics()
        ux_dashboard = ga4_integration.ux_manager.get_dashboard_data()

        # Consolidar dados
        consolidated = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'data_sources': {
                'ux_tracking': True,
                'ga4_integration': True,
                'cloud_logging': True
            },
            'performance': {
                'avg_response_time_ms': ux_metrics.avg_response_time_ms,
                'p95_response_time_ms': ux_metrics.p95_response_time_ms,
                'cache_hit_rate': ux_metrics.cache_hit_rate,
                'web_vitals_score': ux_metrics.web_vitals_score
            },
            'user_experience': {
                'total_sessions': ux_metrics.total_sessions,
                'avg_session_duration_sec': ux_metrics.avg_session_duration_sec,
                'bounce_rate': ux_metrics.bounce_rate,
                'pages_per_session': ux_metrics.pages_per_session,
                'user_satisfaction': ux_metrics.user_satisfaction
            },
            'medical_content': {
                'persona_dr_gasnelio_usage': ux_metrics.persona_dr_gasnelio_usage,
                'persona_ga_usage': ux_metrics.persona_ga_usage,
                'medical_queries_count': ux_metrics.medical_queries_count,
                'rag_success_rate': ux_metrics.rag_success_rate
            },
            'accessibility': {
                'accessibility_score': ux_metrics.accessibility_score,
                'wcag_violations': ux_metrics.wcag_violations,
                'screen_reader_usage': ux_metrics.screen_reader_usage
            },
            'quality': {
                'error_rate': ux_metrics.error_rate,
                'critical_errors': ux_metrics.critical_errors
            },
            'dashboard_summary': ux_dashboard.get('summary', {}),
            'recommendations': ux_dashboard.get('recommendations', [])
        }

        return jsonify({
            'success': True,
            'analytics': consolidated
        }), 200

    except Exception as e:
        cloud_logger.error('Error getting consolidated analytics', error=e)
        return jsonify({
            'success': False,
            'error': 'Erro ao obter analytics consolidados'
        }), 500

@ga4_integration_bp.route('/events/batch', methods=['POST'])
@require_rate_limit('default')
@optional_auth
def batch_process_events():
    """Processa lote de eventos tanto UX quanto GA4"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados JSON necessários'}), 400

        batch_events = data.get('events', [])
        processed_ux = 0
        processed_ga4 = 0
        errors = []

        for event in batch_events:
            try:
                event_source = event.get('source', 'unknown')

                if event_source == 'ux_tracking':
                    ga4_event = ga4_integration.sync_ux_to_ga4(event.get('data', {}))
                    if ga4_event:
                        processed_ux += 1
                elif event_source == 'ga4':
                    ux_event = ga4_integration.sync_ga4_to_ux(event.get('data', {}))
                    if ux_event:
                        processed_ga4 += 1

            except Exception as e:
                errors.append({
                    'event_index': batch_events.index(event),
                    'error': str(e)
                })

        # Log resultado do batch
        cloud_logger.info('Batch events processed', {
            'total_events': len(batch_events),
            'processed_ux': processed_ux,
            'processed_ga4': processed_ga4,
            'errors_count': len(errors)
        })

        return jsonify({
            'success': True,
            'batch_results': {
                'total_events': len(batch_events),
                'processed_ux_events': processed_ux,
                'processed_ga4_events': processed_ga4,
                'errors': errors
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200

    except Exception as e:
        cloud_logger.error('Error in batch event processing', error=e)
        return jsonify({
            'success': False,
            'error': 'Erro no processamento em lote'
        }), 500

@ga4_integration_bp.route('/health', methods=['GET'])
@require_rate_limit('default')
def ga4_integration_health():
    """Health check da integração GA4"""
    try:
        health_status = {
            'system': 'ga4_integration',
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'components': {
                'ux_manager': ga4_integration.ux_manager is not None,
                'integration_buffer': len(ga4_integration.ga4_events_buffer),
                'session_mapping': len(ga4_integration.session_map)
            },
            'integration_stats': {
                'events_in_buffer': len(ga4_integration.ga4_events_buffer),
                'active_sessions': len(ga4_integration.session_map)
            }
        }

        # Testar UX Manager se disponível
        if ga4_integration.ux_manager:
            try:
                current_metrics = ga4_integration.ux_manager.get_current_metrics()
                health_status['ux_metrics_sample'] = {
                    'total_sessions': current_metrics.total_sessions,
                    'avg_response_time_ms': current_metrics.avg_response_time_ms,
                    'web_vitals_score': current_metrics.web_vitals_score
                }
            except Exception as e:
                health_status['ux_metrics_error'] = str(e)

        return jsonify(health_status), 200

    except Exception as e:
        return jsonify({
            'system': 'ga4_integration',
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500

@ga4_integration_bp.route('/config', methods=['GET'])
@require_rate_limit('default')
@optional_auth
def get_ga4_config():
    """Retorna configuração GA4 para frontend"""
    try:
        config = {
            'endpoints': {
                'sync_ux_to_ga4': '/api/ga4/sync/ux-to-ga4',
                'sync_ga4_to_ux': '/api/ga4/sync/ga4-to-ux',
                'consolidated_analytics': '/api/ga4/analytics/consolidated',
                'batch_events': '/api/ga4/events/batch'
            },
            'features': {
                'ux_tracking_integration': True,
                'ga4_sync': True,
                'consolidated_analytics': True,
                'batch_processing': True,
                'lgpd_compliance': True
            },
            'limits': {
                'max_events_per_batch': 100,
                'max_session_duration_hours': 24,
                'rate_limit_per_minute': 60
            },
            'privacy': {
                'user_id_hashing': True,
                'data_retention_days': 90,
                'anonymization': True,
                'gdpr_compliance': True,
                'lgpd_compliance': True
            }
        }

        return jsonify({
            'success': True,
            'config': config
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Erro ao obter configuração'
        }), 500