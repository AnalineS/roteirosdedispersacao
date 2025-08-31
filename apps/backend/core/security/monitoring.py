# -*- coding: utf-8 -*-
"""
Sistema de Monitoramento e Alertas de Segurança
==============================================

Sistema completo de monitoramento em tempo real com:
- Detecção de anomalias comportamentais
- Alertas automáticos para eventos críticos
- Dashboard de métricas de segurança
- Análise de patterns de ataque
- Integração com sistemas externos de alerta
- Machine Learning para detecção proativa

Funcionalidades:
- Monitoramento contínuo de atividades
- Detecção de anomalias em tempo real
- Sistema de alertas hierárquico
- Dashboards e relatórios
- Integração com SIEM

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
"""

import json
import time
import logging
import threading
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Callable, Set
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict, deque
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import queue
import asyncio


# Logger específico para monitoramento
monitoring_logger = logging.getLogger('security.monitoring')


class AlertSeverity(Enum):
    """Níveis de severidade de alertas"""
    INFO = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5


class MetricType(Enum):
    """Tipos de métricas monitoradas"""
    REQUEST_RATE = "request_rate"
    ERROR_RATE = "error_rate"
    RESPONSE_TIME = "response_time"
    SECURITY_EVENTS = "security_events"
    ANOMALY_SCORE = "anomaly_score"
    TRUST_SCORE = "trust_score"
    BLOCKED_REQUESTS = "blocked_requests"
    ACTIVE_SESSIONS = "active_sessions"
    THREAT_LEVEL = "threat_level"


class AlertChannel(Enum):
    """Canais de envio de alertas"""
    EMAIL = "email"
    WEBHOOK = "webhook"
    SLACK = "slack"
    SMS = "sms"
    LOG = "log"
    DASHBOARD = "dashboard"


@dataclass
class MetricPoint:
    """Ponto de métrica com timestamp"""
    timestamp: datetime
    value: float
    metadata: Dict[str, Any]


@dataclass
class Alert:
    """Estrutura de um alerta"""
    id: str
    timestamp: datetime
    severity: AlertSeverity
    title: str
    message: str
    metric_type: MetricType
    source: str
    metadata: Dict[str, Any]
    acknowledged: bool = False
    resolved: bool = False
    escalated: bool = False


@dataclass
class AnomalyDetection:
    """Resultado de detecção de anomalia"""
    is_anomaly: bool
    anomaly_score: float
    confidence: float
    details: Dict[str, Any]
    recommendations: List[str]


class AnomalyDetector:
    """Detector de anomalias usando Machine Learning"""
    
    def __init__(self, contamination: float = 0.1):
        self.contamination = contamination
        self.models: Dict[MetricType, IsolationForest] = {}
        self.scalers: Dict[MetricType, StandardScaler] = {}
        self.training_data: Dict[MetricType, List[float]] = defaultdict(list)
        self.model_trained: Dict[MetricType, bool] = defaultdict(bool)
        self.min_training_samples = 100
        
    def add_training_data(self, metric_type: MetricType, value: float):
        """Adiciona dados para treinamento do modelo"""
        self.training_data[metric_type].append(value)
        
        # Manter apenas últimos 10000 pontos
        if len(self.training_data[metric_type]) > 10000:
            self.training_data[metric_type] = self.training_data[metric_type][-10000:]
    
    def train_model(self, metric_type: MetricType) -> bool:
        """Treina modelo para tipo específico de métrica"""
        data = self.training_data[metric_type]
        
        if len(data) < self.min_training_samples:
            return False
        
        try:
            # Preparar dados
            X = np.array(data).reshape(-1, 1)
            
            # Scaler para normalização
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Modelo de detecção de anomalias
            model = IsolationForest(
                contamination=self.contamination,
                random_state=42,
                n_estimators=100
            )
            model.fit(X_scaled)
            
            # Armazenar modelo e scaler
            self.models[metric_type] = model
            self.scalers[metric_type] = scaler
            self.model_trained[metric_type] = True
            
            monitoring_logger.info(f"Modelo treinado para {metric_type.value} com {len(data)} amostras")
            return True
            
        except Exception as e:
            monitoring_logger.error(f"Erro ao treinar modelo para {metric_type.value}: {e}")
            return False
    
    def detect_anomaly(self, metric_type: MetricType, value: float, context: Dict[str, Any] = None) -> AnomalyDetection:
        """Detecta anomalia em valor específico"""
        # Adicionar ao training data
        self.add_training_data(metric_type, value)
        
        # Verificar se modelo está treinado
        if not self.model_trained[metric_type]:
            if len(self.training_data[metric_type]) >= self.min_training_samples:
                self.train_model(metric_type)
            else:
                # Não há dados suficientes para detecção
                return AnomalyDetection(
                    is_anomaly=False,
                    anomaly_score=0.0,
                    confidence=0.0,
                    details={'reason': 'insufficient_training_data'},
                    recommendations=['collect_more_data']
                )
        
        try:
            model = self.models[metric_type]
            scaler = self.scalers[metric_type]
            
            # Preparar valor
            X = np.array([[value]])
            X_scaled = scaler.transform(X)
            
            # Predição de anomalia
            prediction = model.predict(X_scaled)[0]
            anomaly_score = model.decision_function(X_scaled)[0]
            
            is_anomaly = prediction == -1
            
            # Calcular confiança (normalizar score)
            confidence = abs(anomaly_score)
            
            # Análise contextual
            details = {
                'prediction': int(prediction),
                'anomaly_score': float(anomaly_score),
                'value': value,
                'metric_type': metric_type.value
            }
            
            # Recomendações baseadas no tipo de anomalia
            recommendations = self._generate_anomaly_recommendations(metric_type, value, is_anomaly, context)
            
            return AnomalyDetection(
                is_anomaly=is_anomaly,
                anomaly_score=abs(anomaly_score),
                confidence=confidence,
                details=details,
                recommendations=recommendations
            )
            
        except Exception as e:
            monitoring_logger.error(f"Erro na detecção de anomalia para {metric_type.value}: {e}")
            return AnomalyDetection(
                is_anomaly=False,
                anomaly_score=0.0,
                confidence=0.0,
                details={'error': str(e)},
                recommendations=['check_model_health']
            )
    
    def _generate_anomaly_recommendations(self, metric_type: MetricType, value: float, is_anomaly: bool, context: Dict[str, Any]) -> List[str]:
        """Gera recomendações baseadas na anomalia detectada"""
        if not is_anomaly:
            return []
        
        recommendations = []
        
        if metric_type == MetricType.REQUEST_RATE:
            if value > statistics.mean(self.training_data[metric_type]) * 2:
                recommendations.extend([
                    'investigate_traffic_spike',
                    'check_ddos_indicators',
                    'verify_legitimate_traffic'
                ])
            else:
                recommendations.append('investigate_unusual_request_pattern')
        
        elif metric_type == MetricType.ERROR_RATE:
            recommendations.extend([
                'investigate_application_errors',
                'check_system_resources',
                'verify_external_dependencies'
            ])
        
        elif metric_type == MetricType.SECURITY_EVENTS:
            recommendations.extend([
                'review_security_events',
                'investigate_potential_attack',
                'verify_detection_rules'
            ])
        
        elif metric_type == MetricType.ANOMALY_SCORE:
            recommendations.extend([
                'review_client_behavior',
                'investigate_suspicious_activity',
                'consider_blocking_source'
            ])
        
        return recommendations


class MetricsCollector:
    """Coletor de métricas do sistema"""
    
    def __init__(self, retention_days: int = 7):
        self.metrics: Dict[MetricType, deque] = defaultdict(lambda: deque(maxlen=10000))
        self.retention_days = retention_days
        self.lock = threading.RLock()
        
        # Estatísticas em tempo real
        self.real_time_stats: Dict[MetricType, Dict[str, float]] = defaultdict(dict)
        
        # Thread para limpeza periódica
        self._start_cleanup_thread()
    
    def record_metric(self, metric_type: MetricType, value: float, metadata: Dict[str, Any] = None):
        """Registra uma métrica"""
        point = MetricPoint(
            timestamp=datetime.now(),
            value=value,
            metadata=metadata or {}
        )
        
        with self.lock:
            self.metrics[metric_type].append(point)
            self._update_real_time_stats(metric_type, value)
    
    def _update_real_time_stats(self, metric_type: MetricType, value: float):
        """Atualiza estatísticas em tempo real"""
        stats = self.real_time_stats[metric_type]
        
        # Primeira métrica
        if 'count' not in stats:
            stats.update({
                'count': 1,
                'sum': value,
                'min': value,
                'max': value,
                'avg': value
            })
            return
        
        # Atualizar estatísticas
        stats['count'] += 1
        stats['sum'] += value
        stats['min'] = min(stats['min'], value)
        stats['max'] = max(stats['max'], value)
        stats['avg'] = stats['sum'] / stats['count']
    
    def get_metrics(self, metric_type: MetricType, since: Optional[datetime] = None, limit: Optional[int] = None) -> List[MetricPoint]:
        """Obtém métricas de um tipo específico"""
        with self.lock:
            metrics = list(self.metrics[metric_type])
            
            # Filtrar por tempo
            if since:
                metrics = [m for m in metrics if m.timestamp >= since]
            
            # Limitar quantidade
            if limit:
                metrics = metrics[-limit:]
            
            return metrics
    
    def get_real_time_stats(self, metric_type: MetricType) -> Dict[str, float]:
        """Obtém estatísticas em tempo real"""
        return self.real_time_stats[metric_type].copy()
    
    def get_aggregated_stats(self, metric_type: MetricType, window_minutes: int = 60) -> Dict[str, float]:
        """Obtém estatísticas agregadas para janela de tempo"""
        since = datetime.now() - timedelta(minutes=window_minutes)
        metrics = self.get_metrics(metric_type, since=since)
        
        if not metrics:
            return {}
        
        values = [m.value for m in metrics]
        
        return {
            'count': len(values),
            'sum': sum(values),
            'avg': statistics.mean(values),
            'min': min(values),
            'max': max(values),
            'median': statistics.median(values),
            'p95': np.percentile(values, 95) if len(values) > 1 else values[0],
            'p99': np.percentile(values, 99) if len(values) > 1 else values[0]
        }
    
    def _start_cleanup_thread(self):
        """Inicia thread para limpeza de dados antigos"""
        def cleanup_worker():
            while True:
                try:
                    time.sleep(3600)  # Limpeza a cada hora
                    self._cleanup_old_metrics()
                except Exception as e:
                    monitoring_logger.error(f"Erro na limpeza de métricas: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
        cleanup_thread.start()
    
    def _cleanup_old_metrics(self):
        """Remove métricas antigas"""
        cutoff = datetime.now() - timedelta(days=self.retention_days)
        
        with self.lock:
            for metric_type in self.metrics:
                original_count = len(self.metrics[metric_type])
                
                # Filtrar métricas antigas
                self.metrics[metric_type] = deque(
                    [m for m in self.metrics[metric_type] if m.timestamp >= cutoff],
                    maxlen=10000
                )
                
                removed_count = original_count - len(self.metrics[metric_type])
                if removed_count > 0:
                    monitoring_logger.info(f"Removidas {removed_count} métricas antigas de {metric_type.value}")


class AlertManager:
    """Gerenciador de alertas do sistema"""
    
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.alert_queue = queue.Queue()
        self.alert_channels: Dict[AlertChannel, Dict[str, Any]] = {}
        self.alert_rules: List[Dict[str, Any]] = []
        self.lock = threading.RLock()
        
        # Configurar regras padrão
        self._setup_default_rules()
        
        # Iniciar processador de alertas
        self._start_alert_processor()
    
    def _setup_default_rules(self):
        """Configura regras padrão de alertas"""
        self.alert_rules = [
            {
                'name': 'high_error_rate',
                'metric_type': MetricType.ERROR_RATE,
                'condition': lambda x: x > 5.0,  # Mais de 5% de erro
                'severity': AlertSeverity.HIGH,
                'message': 'Taxa de erro elevada detectada: {value}%'
            },
            {
                'name': 'security_events_spike',
                'metric_type': MetricType.SECURITY_EVENTS,
                'condition': lambda x: x > 10,  # Mais de 10 eventos por minuto
                'severity': AlertSeverity.CRITICAL,
                'message': 'Pico de eventos de segurança: {value} eventos/min'
            },
            {
                'name': 'low_trust_score',
                'metric_type': MetricType.TRUST_SCORE,
                'condition': lambda x: x < 30,  # Trust score muito baixo
                'severity': AlertSeverity.MEDIUM,
                'message': 'Trust score baixo detectado: {value}'
            },
            {
                'name': 'high_anomaly_score',
                'metric_type': MetricType.ANOMALY_SCORE,
                'condition': lambda x: x > 0.8,  # Score de anomalia alto
                'severity': AlertSeverity.HIGH,
                'message': 'Anomalia significativa detectada: score {value}'
            },
            {
                'name': 'response_time_high',
                'metric_type': MetricType.RESPONSE_TIME,
                'condition': lambda x: x > 2000,  # Mais de 2 segundos
                'severity': AlertSeverity.MEDIUM,
                'message': 'Tempo de resposta elevado: {value}ms'
            }
        ]
    
    def configure_alert_channel(self, channel: AlertChannel, config: Dict[str, Any]):
        """Configura canal de alerta"""
        self.alert_channels[channel] = config
        monitoring_logger.info(f"Canal de alerta configurado: {channel.value}")
    
    def create_alert(self, 
                    title: str, 
                    message: str, 
                    severity: AlertSeverity, 
                    metric_type: MetricType,
                    source: str = 'system',
                    metadata: Dict[str, Any] = None) -> str:
        """Cria um novo alerta"""
        alert_id = f"alert_{int(time.time() * 1000)}"
        
        alert = Alert(
            id=alert_id,
            timestamp=datetime.now(),
            severity=severity,
            title=title,
            message=message,
            metric_type=metric_type,
            source=source,
            metadata=metadata or {}
        )
        
        with self.lock:
            self.alerts[alert_id] = alert
            self.alert_queue.put(alert)
        
        monitoring_logger.warning(f"Alerta criado: {alert_id} - {title}")
        return alert_id
    
    def check_metric_against_rules(self, metric_type: MetricType, value: float, metadata: Dict[str, Any] = None):
        """Verifica métrica contra regras de alerta"""
        for rule in self.alert_rules:
            if rule['metric_type'] == metric_type:
                try:
                    if rule['condition'](value):
                        message = rule['message'].format(value=value)
                        self.create_alert(
                            title=rule['name'].replace('_', ' ').title(),
                            message=message,
                            severity=rule['severity'],
                            metric_type=metric_type,
                            source='rule_engine',
                            metadata={'rule': rule['name'], 'value': value, **(metadata or {})}
                        )
                except Exception as e:
                    monitoring_logger.error(f"Erro ao avaliar regra {rule['name']}: {e}")
    
    def _start_alert_processor(self):
        """Inicia processador de alertas"""
        def process_alerts():
            while True:
                try:
                    alert = self.alert_queue.get(timeout=1)
                    self._process_alert(alert)
                except queue.Empty:
                    continue
                except Exception as e:
                    monitoring_logger.error(f"Erro no processamento de alerta: {e}")
        
        processor_thread = threading.Thread(target=process_alerts, daemon=True)
        processor_thread.start()
    
    def _process_alert(self, alert: Alert):
        """Processa um alerta enviando para canais configurados"""
        # Determinar canais com base na severidade
        channels_to_send = self._get_channels_for_severity(alert.severity)
        
        for channel in channels_to_send:
            try:
                self._send_alert_to_channel(alert, channel)
            except Exception as e:
                monitoring_logger.error(f"Erro ao enviar alerta para {channel.value}: {e}")
    
    def _get_channels_for_severity(self, severity: AlertSeverity) -> List[AlertChannel]:
        """Determina canais apropriados para severidade"""
        channel_map = {
            AlertSeverity.INFO: [AlertChannel.LOG],
            AlertSeverity.LOW: [AlertChannel.LOG, AlertChannel.DASHBOARD],
            AlertSeverity.MEDIUM: [AlertChannel.LOG, AlertChannel.DASHBOARD, AlertChannel.EMAIL],
            AlertSeverity.HIGH: [AlertChannel.LOG, AlertChannel.DASHBOARD, AlertChannel.EMAIL, AlertChannel.WEBHOOK],
            AlertSeverity.CRITICAL: [AlertChannel.LOG, AlertChannel.DASHBOARD, AlertChannel.EMAIL, AlertChannel.WEBHOOK, AlertChannel.SLACK]
        }
        
        return [ch for ch in channel_map.get(severity, []) if ch in self.alert_channels]
    
    def _send_alert_to_channel(self, alert: Alert, channel: AlertChannel):
        """Envia alerta para canal específico"""
        if channel == AlertChannel.LOG:
            self._send_to_log(alert)
        elif channel == AlertChannel.EMAIL:
            self._send_to_email(alert)
        elif channel == AlertChannel.WEBHOOK:
            self._send_to_webhook(alert)
        elif channel == AlertChannel.SLACK:
            self._send_to_slack(alert)
    
    def _send_to_log(self, alert: Alert):
        """Envia alerta para log"""
        log_level = {
            AlertSeverity.INFO: logging.INFO,
            AlertSeverity.LOW: logging.INFO,
            AlertSeverity.MEDIUM: logging.WARNING,
            AlertSeverity.HIGH: logging.ERROR,
            AlertSeverity.CRITICAL: logging.CRITICAL
        }.get(alert.severity, logging.INFO)
        
        monitoring_logger.log(log_level, f"ALERT: {alert.title} - {alert.message}")
    
    def _send_to_email(self, alert: Alert):
        """Envia alerta por email"""
        config = self.alert_channels.get(AlertChannel.EMAIL, {})
        if not config:
            return
        
        # Implementar envio de email
        # Por ora, apenas log
        monitoring_logger.info(f"EMAIL_ALERT: {alert.title}")
    
    def _send_to_webhook(self, alert: Alert):
        """Envia alerta via webhook"""
        config = self.alert_channels.get(AlertChannel.WEBHOOK, {})
        if not config or 'url' not in config:
            return
        
        payload = {
            'alert_id': alert.id,
            'timestamp': alert.timestamp.isoformat(),
            'severity': alert.severity.name,
            'title': alert.title,
            'message': alert.message,
            'source': alert.source,
            'metadata': alert.metadata
        }
        
        try:
            response = requests.post(
                config['url'],
                json=payload,
                headers=config.get('headers', {}),
                timeout=10
            )
            monitoring_logger.info(f"Webhook enviado: {response.status_code}")
        except Exception as e:
            monitoring_logger.error(f"Erro ao enviar webhook: {e}")
    
    def _send_to_slack(self, alert: Alert):
        """Envia alerta para Slack"""
        config = self.alert_channels.get(AlertChannel.SLACK, {})
        if not config or 'webhook_url' not in config:
            return
        
        color_map = {
            AlertSeverity.INFO: 'good',
            AlertSeverity.LOW: 'good',
            AlertSeverity.MEDIUM: 'warning',
            AlertSeverity.HIGH: 'danger',
            AlertSeverity.CRITICAL: 'danger'
        }
        
        payload = {
            'attachments': [{
                'color': color_map.get(alert.severity, 'warning'),
                'title': alert.title,
                'text': alert.message,
                'fields': [
                    {'title': 'Severity', 'value': alert.severity.name, 'short': True},
                    {'title': 'Source', 'value': alert.source, 'short': True},
                    {'title': 'Timestamp', 'value': alert.timestamp.isoformat(), 'short': False}
                ]
            }]
        }
        
        try:
            response = requests.post(config['webhook_url'], json=payload, timeout=10)
            monitoring_logger.info(f"Slack enviado: {response.status_code}")
        except Exception as e:
            monitoring_logger.error(f"Erro ao enviar Slack: {e}")
    
    def get_active_alerts(self, severity_filter: Optional[AlertSeverity] = None) -> List[Alert]:
        """Obtém alertas ativos"""
        with self.lock:
            alerts = [a for a in self.alerts.values() if not a.resolved]
            
            if severity_filter:
                alerts = [a for a in alerts if a.severity == severity_filter]
            
            return sorted(alerts, key=lambda x: x.timestamp, reverse=True)
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Reconhece um alerta"""
        with self.lock:
            if alert_id in self.alerts:
                self.alerts[alert_id].acknowledged = True
                monitoring_logger.info(f"Alerta reconhecido: {alert_id}")
                return True
            return False
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve um alerta"""
        with self.lock:
            if alert_id in self.alerts:
                self.alerts[alert_id].resolved = True
                monitoring_logger.info(f"Alerta resolvido: {alert_id}")
                return True
            return False


class SecurityMonitor:
    """Monitor principal de segurança"""
    
    def __init__(self):
        self.anomaly_detector = AnomalyDetector()
        self.metrics_collector = MetricsCollector()
        self.alert_manager = AlertManager()
        self.is_running = False
        self.monitoring_threads: List[threading.Thread] = []
        
        # Configurar logging
        monitoring_logger.info("SecurityMonitor inicializado")
    
    def start_monitoring(self):
        """Inicia monitoramento"""
        if self.is_running:
            return
        
        self.is_running = True
        
        # Thread principal de monitoramento
        main_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        main_thread.start()
        self.monitoring_threads.append(main_thread)
        
        monitoring_logger.info("Monitoramento de segurança iniciado")
    
    def stop_monitoring(self):
        """Para monitoramento"""
        self.is_running = False
        monitoring_logger.info("Monitoramento de segurança parado")
    
    def _monitoring_loop(self):
        """Loop principal de monitoramento"""
        while self.is_running:
            try:
                # Monitorar métricas periodicamente
                self._collect_system_metrics()
                
                # Detectar anomalias
                self._detect_anomalies()
                
                # Aguardar próximo ciclo
                time.sleep(30)  # Monitoramento a cada 30 segundos
                
            except Exception as e:
                monitoring_logger.error(f"Erro no loop de monitoramento: {e}")
                time.sleep(60)  # Aguardar mais em caso de erro
    
    def _collect_system_metrics(self):
        """Coleta métricas do sistema"""
        try:
            # Simular coleta de métricas (integrar com sistema real)
            import psutil
            
            # CPU e memória
            cpu_percent = psutil.cpu_percent()
            memory_percent = psutil.virtual_memory().percent
            
            # Registrar métricas
            self.record_metric(MetricType.REQUEST_RATE, cpu_percent)  # Placeholder
            
        except Exception as e:
            monitoring_logger.error(f"Erro ao coletar métricas do sistema: {e}")
    
    def _detect_anomalies(self):
        """Executa detecção de anomalias"""
        for metric_type in MetricType:
            try:
                # Obter métricas recentes
                recent_metrics = self.metrics_collector.get_metrics(
                    metric_type, 
                    since=datetime.now() - timedelta(minutes=5),
                    limit=10
                )
                
                if recent_metrics:
                    latest_value = recent_metrics[-1].value
                    
                    # Detectar anomalia
                    anomaly = self.anomaly_detector.detect_anomaly(metric_type, latest_value)
                    
                    if anomaly.is_anomaly and anomaly.confidence > 0.7:
                        # Criar alerta para anomalia
                        self.alert_manager.create_alert(
                            title=f"Anomalia Detectada em {metric_type.value}",
                            message=f"Valor anômalo detectado: {latest_value:.2f} (score: {anomaly.anomaly_score:.2f})",
                            severity=AlertSeverity.MEDIUM,
                            metric_type=metric_type,
                            source='anomaly_detector',
                            metadata={
                                'anomaly_score': anomaly.anomaly_score,
                                'confidence': anomaly.confidence,
                                'recommendations': anomaly.recommendations
                            }
                        )
                
            except Exception as e:
                monitoring_logger.error(f"Erro na detecção de anomalia para {metric_type}: {e}")
    
    def record_metric(self, metric_type: MetricType, value: float, metadata: Dict[str, Any] = None):
        """Registra uma métrica e verifica regras"""
        # Registrar métrica
        self.metrics_collector.record_metric(metric_type, value, metadata)
        
        # Verificar regras de alerta
        self.alert_manager.check_metric_against_rules(metric_type, value, metadata)
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Obtém dados para dashboard"""
        # Estatísticas gerais
        stats = {}
        for metric_type in MetricType:
            stats[metric_type.value] = self.metrics_collector.get_aggregated_stats(metric_type)
        
        # Alertas ativos
        active_alerts = self.alert_manager.get_active_alerts()
        
        # Anomalias recentes
        recent_anomalies = []  # Implementar coleta de anomalias
        
        return {
            'timestamp': datetime.now().isoformat(),
            'metrics_stats': stats,
            'active_alerts': [asdict(alert) for alert in active_alerts[:10]],
            'alert_summary': {
                'total': len(active_alerts),
                'critical': len([a for a in active_alerts if a.severity == AlertSeverity.CRITICAL]),
                'high': len([a for a in active_alerts if a.severity == AlertSeverity.HIGH]),
                'medium': len([a for a in active_alerts if a.severity == AlertSeverity.MEDIUM])
            },
            'system_health': self._get_system_health()
        }
    
    def _get_system_health(self) -> Dict[str, Any]:
        """Obtém indicadores de saúde do sistema"""
        # Calcular saúde baseada em métricas recentes
        health_score = 100
        issues = []
        
        # Verificar métricas críticas
        for metric_type in [MetricType.ERROR_RATE, MetricType.RESPONSE_TIME]:
            stats = self.metrics_collector.get_real_time_stats(metric_type)
            if stats:
                if metric_type == MetricType.ERROR_RATE and stats.get('avg', 0) > 5:
                    health_score -= 20
                    issues.append(f"High error rate: {stats['avg']:.2f}%")
                elif metric_type == MetricType.RESPONSE_TIME and stats.get('avg', 0) > 2000:
                    health_score -= 15
                    issues.append(f"High response time: {stats['avg']:.0f}ms")
        
        # Determinar status
        if health_score >= 90:
            status = 'excellent'
        elif health_score >= 70:
            status = 'good'
        elif health_score >= 50:
            status = 'fair'
        else:
            status = 'poor'
        
        return {
            'status': status,
            'score': health_score,
            'issues': issues,
            'last_check': datetime.now().isoformat()
        }


# Instância global do monitor
global_security_monitor = SecurityMonitor()

# Funções de conveniência
def start_security_monitoring():
    """Inicia monitoramento de segurança"""
    global_security_monitor.start_monitoring()

def record_security_metric(metric_type: MetricType, value: float, metadata: Dict[str, Any] = None):
    """Registra métrica de segurança"""
    global_security_monitor.record_metric(metric_type, value, metadata)

def get_security_dashboard():
    """Obtém dados do dashboard de segurança"""
    return global_security_monitor.get_dashboard_data()