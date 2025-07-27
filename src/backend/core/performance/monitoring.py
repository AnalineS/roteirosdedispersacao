"""
Sistema de Monitoramento Contínuo de Usabilidade
Objetivo: Monitorar métricas de usabilidade em produção

Data: 27 de Janeiro de 2025
Fase: Monitoramento pós-deploy
"""

import time
import json
from datetime import datetime, timedelta
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

class UsabilityMonitor:
    """Monitor de usabilidade em tempo real"""
    
    def __init__(self):
        # Métricas de performance
        self.response_times = deque(maxlen=1000)  # Últimas 1000 respostas
        self.cache_metrics = {
            'hits': 0,
            'misses': 0,
            'total_requests': 0
        }
        
        # Métricas de usabilidade
        self.user_interactions = defaultdict(int)
        self.error_rates = deque(maxlen=100)  # Últimas 100 requisições
        self.persona_usage = defaultdict(int)
        
        # Métricas de acessibilidade (simuladas)
        self.accessibility_events = deque(maxlen=500)
        
        # Timestamp de início
        self.start_time = datetime.now()
    
    def track_response_time(self, response_time_ms: float):
        """Registra tempo de resposta"""
        self.response_times.append(response_time_ms)
        
        # Log se muito lento
        if response_time_ms > 1500:  # Meta: <1.5s
            logger.warning(f"Resposta lenta detectada: {response_time_ms:.0f}ms")
    
    def track_cache_hit(self, hit: bool):
        """Registra hit/miss do cache"""
        if hit:
            self.cache_metrics['hits'] += 1
        else:
            self.cache_metrics['misses'] += 1
        self.cache_metrics['total_requests'] += 1
    
    def track_user_interaction(self, interaction_type: str):
        """Registra interação do usuário"""
        self.user_interactions[interaction_type] += 1
    
    def track_error(self, error_occurred: bool):
        """Registra erro"""
        self.error_rates.append(1 if error_occurred else 0)
    
    def track_persona_usage(self, persona_id: str):
        """Registra uso de persona"""
        self.persona_usage[persona_id] += 1
    
    def track_accessibility_event(self, event_type: str, details: dict = None):
        """Registra evento de acessibilidade"""
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type,
            'details': details or {}
        }
        self.accessibility_events.append(event)
    
    def get_performance_metrics(self):
        """Retorna métricas de performance"""
        if not self.response_times:
            return {
                'avg_response_time': 0,
                'p95_response_time': 0,
                'total_requests': 0,
                'cache_hit_rate': 0
            }
        
        response_times_sorted = sorted(self.response_times)
        total_requests = len(response_times_sorted)
        p95_index = int(0.95 * total_requests)
        
        cache_total = self.cache_metrics['total_requests']
        cache_hit_rate = (self.cache_metrics['hits'] / cache_total * 100) if cache_total > 0 else 0
        
        return {
            'avg_response_time': sum(response_times_sorted) / total_requests,
            'p95_response_time': response_times_sorted[p95_index] if p95_index < total_requests else 0,
            'total_requests': total_requests,
            'cache_hit_rate': cache_hit_rate,
            'fast_responses_pct': sum(1 for t in response_times_sorted if t < 1500) / total_requests * 100
        }
    
    def get_usability_metrics(self):
        """Retorna métricas de usabilidade"""
        error_rate = (sum(self.error_rates) / len(self.error_rates) * 100) if self.error_rates else 0
        
        # Top personas usadas
        top_personas = sorted(self.persona_usage.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Top interações
        top_interactions = sorted(self.user_interactions.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'error_rate_pct': error_rate,
            'total_interactions': sum(self.user_interactions.values()),
            'top_personas': top_personas,
            'top_interactions': top_interactions,
            'uptime_hours': (datetime.now() - self.start_time).total_seconds() / 3600
        }
    
    def get_accessibility_metrics(self):
        """Retorna métricas de acessibilidade"""
        if not self.accessibility_events:
            return {
                'total_events': 0,
                'keyboard_navigation_events': 0,
                'screen_reader_events': 0,
                'skip_link_usage': 0
            }
        
        keyboard_events = sum(1 for e in self.accessibility_events if e['type'] == 'keyboard_navigation')
        screen_reader_events = sum(1 for e in self.accessibility_events if e['type'] == 'screen_reader')
        skip_link_events = sum(1 for e in self.accessibility_events if e['type'] == 'skip_link')
        
        return {
            'total_events': len(self.accessibility_events),
            'keyboard_navigation_events': keyboard_events,
            'screen_reader_events': screen_reader_events,
            'skip_link_usage': skip_link_events,
            'accessibility_score': self._calculate_accessibility_score()
        }
    
    def _calculate_accessibility_score(self):
        """Calcula score de acessibilidade baseado no uso"""
        if not self.accessibility_events:
            return 100  # Assume boa acessibilidade se não há eventos
        
        # Score baseado na diversidade de eventos de acessibilidade
        event_types = set(e['type'] for e in self.accessibility_events)
        base_score = min(100, len(event_types) * 25)  # 25 pontos por tipo de evento
        
        return base_score
    
    def get_health_status(self):
        """Retorna status geral de saúde do sistema"""
        perf = self.get_performance_metrics()
        usability = self.get_usability_metrics()
        accessibility = self.get_accessibility_metrics()
        
        # Calcular status geral
        performance_ok = perf['avg_response_time'] < 1500 and perf['cache_hit_rate'] > 50
        usability_ok = usability['error_rate_pct'] < 5
        accessibility_ok = accessibility['accessibility_score'] > 80
        
        overall_status = "healthy" if all([performance_ok, usability_ok, accessibility_ok]) else "degraded"
        
        return {
            'status': overall_status,
            'performance': {
                'status': 'ok' if performance_ok else 'warning',
                'avg_response_time': perf['avg_response_time'],
                'cache_hit_rate': perf['cache_hit_rate']
            },
            'usability': {
                'status': 'ok' if usability_ok else 'warning',
                'error_rate': usability['error_rate_pct'],
                'total_interactions': usability['total_interactions']
            },
            'accessibility': {
                'status': 'ok' if accessibility_ok else 'warning',
                'score': accessibility['accessibility_score'],
                'total_events': accessibility['total_events']
            },
            'uptime_hours': usability['uptime_hours']
        }
    
    def get_comprehensive_report(self):
        """Retorna relatório completo"""
        return {
            'timestamp': datetime.now().isoformat(),
            'performance': self.get_performance_metrics(),
            'usability': self.get_usability_metrics(),
            'accessibility': self.get_accessibility_metrics(),
            'health': self.get_health_status()
        }

# Instância global do monitor
usability_monitor = UsabilityMonitor()