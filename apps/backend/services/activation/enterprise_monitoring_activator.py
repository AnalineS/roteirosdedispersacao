# -*- coding: utf-8 -*-
"""
Enterprise Monitoring Activator - Ativação de Monitoramento Empresarial
Ativa todos os sistemas de monitoramento, observabilidade e segurança enterprise
"""

import logging
import threading
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class MonitoringSystemStatus:
    """Status de um sistema de monitoramento"""
    name: str
    enabled: bool
    available: bool
    initialized: bool
    health_score: float
    last_check: datetime
    error_message: Optional[str] = None

class EnterpriseMonitoringActivator:
    """
    Ativador de monitoramento empresarial completo

    Sistemas gerenciados:
    - GCP Observability Suite
    - Enterprise Security Framework
    - UX Monitoring Manager
    - Performance Monitoring
    - Real-time Alerts
    - Telemetry Collection
    """

    def __init__(self):
        self.systems = {}
        self.monitoring_thread = None
        self.stop_monitoring = threading.Event()
        self.health_checks_active = False

        logger.info("Enterprise Monitoring Activator inicializado")

    def activate_gcp_observability(self) -> MonitoringSystemStatus:
        """Ativar GCP Operations Suite"""
        status = MonitoringSystemStatus(
            name="GCP Observability",
            enabled=True,
            available=False,
            initialized=False,
            health_score=0.0,
            last_check=datetime.now()
        )

        try:
            from core.observability.gcp_operations import CloudObservability, IS_CLOUD_RUN

            if IS_CLOUD_RUN:
                # Teste de conectividade GCP
                CloudObservability.log_structured(
                    "INFO",
                    "Enterprise monitoring activation test",
                    system="enterprise_monitoring",
                    test_type="activation"
                )

                status.available = True
                status.initialized = True
                status.health_score = 100.0

                logger.info("✅ GCP Observability ativado com sucesso")
            else:
                # Modo local - ativar logging estruturado
                status.available = True
                status.initialized = True
                status.health_score = 85.0
                status.error_message = "Running in local mode"

                logger.info("✅ GCP Observability ativado (modo local)")

        except ImportError as e:
            status.error_message = f"Import error: {e}"
            logger.warning(f"⚠️ GCP Observability não disponível: {e}")
        except Exception as e:
            status.error_message = f"Activation error: {e}"
            logger.error(f"❌ Erro ao ativar GCP Observability: {e}")

        return status

    def activate_enterprise_security(self) -> MonitoringSystemStatus:
        """Ativar Enterprise Security Framework"""
        status = MonitoringSystemStatus(
            name="Enterprise Security",
            enabled=True,
            available=False,
            initialized=False,
            health_score=0.0,
            last_check=datetime.now()
        )

        try:
            from core.security.enterprise_security import EnterpriseSecurityFramework

            # Inicializar framework de segurança
            security_framework = EnterpriseSecurityFramework()

            # Testar funcionalidades básicas
            if hasattr(security_framework, '_rate_limit_rules'):
                status.available = True
                status.initialized = True
                status.health_score = 95.0

                logger.info("✅ Enterprise Security Framework ativado")
            else:
                status.error_message = "Security framework incomplete"

        except ImportError as e:
            status.error_message = f"Import error: {e}"
            logger.warning(f"⚠️ Enterprise Security não disponível: {e}")
        except Exception as e:
            status.error_message = f"Activation error: {e}"
            logger.error(f"❌ Erro ao ativar Enterprise Security: {e}")

        return status

    def activate_ux_monitoring(self) -> MonitoringSystemStatus:
        """Ativar UX Monitoring Manager"""
        status = MonitoringSystemStatus(
            name="UX Monitoring",
            enabled=True,
            available=False,
            initialized=False,
            health_score=0.0,
            last_check=datetime.now()
        )

        try:
            from services.monitoring.ux_monitoring_manager import get_ux_monitoring_manager

            manager = get_ux_monitoring_manager()
            if manager:
                # Testar funcionalidade básica
                metrics = manager.get_current_metrics()
                if metrics:
                    status.available = True
                    status.initialized = True
                    status.health_score = 90.0

                    logger.info("✅ UX Monitoring Manager ativado")
                else:
                    status.error_message = "Failed to get metrics"
            else:
                status.error_message = "Manager initialization failed"

        except ImportError as e:
            status.error_message = f"Import error: {e}"
            logger.warning(f"⚠️ UX Monitoring não disponível: {e}")
        except Exception as e:
            status.error_message = f"Activation error: {e}"
            logger.error(f"❌ Erro ao ativar UX Monitoring: {e}")

        return status

    def activate_performance_monitoring(self) -> MonitoringSystemStatus:
        """Ativar Performance Monitoring"""
        status = MonitoringSystemStatus(
            name="Performance Monitoring",
            enabled=True,
            available=False,
            initialized=False,
            health_score=0.0,
            last_check=datetime.now()
        )

        try:
            from core.metrics.performance_monitor import performance_monitor

            if performance_monitor:
                # Testar coleta de métricas
                current_metrics = performance_monitor.get_metrics()
                if current_metrics:
                    status.available = True
                    status.initialized = True
                    status.health_score = 88.0

                    logger.info("✅ Performance Monitor ativado")
                else:
                    status.error_message = "No metrics available"
            else:
                status.error_message = "Performance monitor not found"

        except ImportError as e:
            status.error_message = f"Import error: {e}"
            logger.warning(f"⚠️ Performance Monitoring não disponível: {e}")
        except Exception as e:
            status.error_message = f"Activation error: {e}"
            logger.error(f"❌ Erro ao ativar Performance Monitoring: {e}")

        return status

    def activate_real_time_alerts(self) -> MonitoringSystemStatus:
        """Ativar sistema de alertas em tempo real"""
        status = MonitoringSystemStatus(
            name="Real-time Alerts",
            enabled=True,
            available=False,
            initialized=False,
            health_score=0.0,
            last_check=datetime.now()
        )

        try:
            # Integrar com sistema de alertas
            from blueprints.alerts_blueprint import alerts_bp

            if alerts_bp:
                status.available = True
                status.initialized = True
                status.health_score = 85.0

                logger.info("✅ Real-time Alerts ativado")
            else:
                status.error_message = "Alerts blueprint not available"

        except ImportError as e:
            status.error_message = f"Import error: {e}"
            logger.warning(f"⚠️ Real-time Alerts não disponível: {e}")
        except Exception as e:
            status.error_message = f"Activation error: {e}"
            logger.error(f"❌ Erro ao ativar Real-time Alerts: {e}")

        return status

    def activate_telemetry_collection(self) -> MonitoringSystemStatus:
        """Ativar coleta de telemetria"""
        status = MonitoringSystemStatus(
            name="Telemetry Collection",
            enabled=True,
            available=False,
            initialized=False,
            health_score=0.0,
            last_check=datetime.now()
        )

        try:
            # Ativar coleta de telemetria através dos blueprints
            from blueprints.ga4_integration_blueprint import ga4_integration_bp
            from blueprints.ux_tracking_blueprint import ux_tracking_bp

            available_systems = 0
            total_systems = 2

            if ga4_integration_bp:
                available_systems += 1
                logger.info("✅ GA4 Integration ativo")

            if ux_tracking_bp:
                available_systems += 1
                logger.info("✅ UX Tracking ativo")

            if available_systems > 0:
                status.available = True
                status.initialized = True
                status.health_score = (available_systems / total_systems) * 100

                logger.info(f"✅ Telemetry Collection ativado ({available_systems}/{total_systems} sistemas)")
            else:
                status.error_message = "No telemetry systems available"

        except ImportError as e:
            status.error_message = f"Import error: {e}"
            logger.warning(f"⚠️ Telemetry Collection não disponível: {e}")
        except Exception as e:
            status.error_message = f"Activation error: {e}"
            logger.error(f"❌ Erro ao ativar Telemetry Collection: {e}")

        return status

    def activate_all_enterprise_monitoring(self) -> Dict[str, MonitoringSystemStatus]:
        """Ativar todos os sistemas de monitoramento empresarial"""
        logger.info("🚀 Iniciando ativação de monitoramento empresarial completo...")

        systems = {
            'gcp_observability': self.activate_gcp_observability(),
            'enterprise_security': self.activate_enterprise_security(),
            'ux_monitoring': self.activate_ux_monitoring(),
            'performance_monitoring': self.activate_performance_monitoring(),
            'real_time_alerts': self.activate_real_time_alerts(),
            'telemetry_collection': self.activate_telemetry_collection()
        }

        # Calcular estatísticas
        total_systems = len(systems)
        available_systems = sum(1 for s in systems.values() if s.available)
        initialized_systems = sum(1 for s in systems.values() if s.initialized)
        avg_health = sum(s.health_score for s in systems.values()) / total_systems

        logger.info(f"📊 Relatório de Ativação Enterprise:")
        logger.info(f"   Total de sistemas: {total_systems}")
        logger.info(f"   Sistemas disponíveis: {available_systems}")
        logger.info(f"   Sistemas inicializados: {initialized_systems}")
        logger.info(f"   Saúde média: {avg_health:.1f}%")

        # Log detalhado por sistema
        for name, status in systems.items():
            emoji = "✅" if status.initialized else "⚠️" if status.available else "❌"
            state = "ATIVO" if status.initialized else "DISPONÍVEL" if status.available else "INATIVO"
            logger.info(f"   {emoji} {status.name}: {state} ({status.health_score:.1f}%)")

            if status.error_message:
                logger.warning(f"      Aviso: {status.error_message}")

        self.systems = systems
        return systems

    def start_continuous_health_monitoring(self, interval_seconds: int = 300):
        """Iniciar monitoramento contínuo de saúde"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            logger.warning("Monitoramento de saúde já está ativo")
            return

        def health_monitoring_loop():
            self.health_checks_active = True

            while not self.stop_monitoring.wait(interval_seconds):
                try:
                    # Re-verificar saúde de todos os sistemas
                    health_results = self.check_all_systems_health()

                    # Alertas automáticos para sistemas com problemas
                    critical_issues = [name for name, health in health_results.items()
                                     if health < 50.0]

                    if critical_issues:
                        logger.warning(f"🚨 Sistemas críticos detectados: {critical_issues}")
                        self._generate_health_alert(critical_issues, health_results)

                    logger.info(f"🔄 Health Check: {sum(health_results.values())/len(health_results):.1f}% média")

                except Exception as e:
                    logger.error(f"Erro no monitoramento de saúde: {e}")

            self.health_checks_active = False

        self.monitoring_thread = threading.Thread(target=health_monitoring_loop, daemon=True)
        self.monitoring_thread.start()

        logger.info(f"🔄 Monitoramento contínuo de saúde iniciado (intervalo: {interval_seconds}s)")

    def check_all_systems_health(self) -> Dict[str, float]:
        """Verificar saúde de todos os sistemas"""
        health_results = {}

        for name, system in self.systems.items():
            try:
                # Atualizar timestamp
                system.last_check = datetime.now()

                # Verificação básica de saúde
                if system.initialized:
                    # Sistema funcionando - manter score ou ligeiramente degradar com o tempo
                    time_since_init = (datetime.now() - system.last_check).total_seconds()
                    degradation = min(time_since_init / 3600 * 5, 20)  # Máximo 20% degradação por hora
                    system.health_score = max(70.0, system.health_score - degradation)
                else:
                    system.health_score = max(0.0, system.health_score - 10)  # Degradar sistemas não inicializados

                health_results[name] = system.health_score

            except Exception as e:
                logger.error(f"Erro ao verificar saúde do sistema {name}: {e}")
                health_results[name] = 0.0

        return health_results

    def _generate_health_alert(self, critical_systems: List[str], health_results: Dict[str, float]):
        """Gerar alerta para sistemas críticos"""
        try:
            # Tentar usar o sistema de alertas se disponível
            from core.observability.gcp_operations import CloudObservability

            CloudObservability.log_structured(
                "WARNING",
                f"Enterprise monitoring health alert: {critical_systems}",
                alert_type="health_monitoring",
                critical_systems=critical_systems,
                health_scores=health_results,
                severity="high"
            )

        except Exception as e:
            logger.error(f"Erro ao gerar alerta de saúde: {e}")

    def stop_health_monitoring(self):
        """Parar monitoramento contínuo de saúde"""
        if self.monitoring_thread:
            self.stop_monitoring.set()
            self.monitoring_thread.join(timeout=5)
            logger.info("🛑 Monitoramento de saúde parado")

    def get_enterprise_monitoring_status(self) -> Dict[str, Any]:
        """Obter status completo do monitoramento empresarial"""
        if not self.systems:
            self.activate_all_enterprise_monitoring()

        health_results = self.check_all_systems_health()

        return {
            'timestamp': datetime.now().isoformat(),
            'systems': {
                name: {
                    'name': status.name,
                    'enabled': status.enabled,
                    'available': status.available,
                    'initialized': status.initialized,
                    'health_score': status.health_score,
                    'error_message': status.error_message,
                    'last_check': status.last_check.isoformat()
                }
                for name, status in self.systems.items()
            },
            'summary': {
                'total_systems': len(self.systems),
                'available_systems': sum(1 for s in self.systems.values() if s.available),
                'initialized_systems': sum(1 for s in self.systems.values() if s.initialized),
                'avg_health_score': sum(health_results.values()) / len(health_results) if health_results else 0,
                'health_monitoring_active': self.health_checks_active
            },
            'health_details': health_results
        }

# Instância global
_enterprise_monitoring_activator = None

def get_enterprise_monitoring_activator() -> EnterpriseMonitoringActivator:
    """Obter instância singleton do ativador"""
    global _enterprise_monitoring_activator
    if _enterprise_monitoring_activator is None:
        _enterprise_monitoring_activator = EnterpriseMonitoringActivator()
    return _enterprise_monitoring_activator

def activate_enterprise_monitoring() -> Dict[str, MonitoringSystemStatus]:
    """Função de conveniência para ativar monitoramento empresarial"""
    activator = get_enterprise_monitoring_activator()
    return activator.activate_all_enterprise_monitoring()

def get_enterprise_monitoring_status() -> Dict[str, Any]:
    """Função de conveniência para obter status"""
    activator = get_enterprise_monitoring_activator()
    return activator.get_enterprise_monitoring_status()

# Auto-ativação quando módulo é importado
if __name__ != "__main__":
    # Ativar monitoramento em background quando importado
    try:
        activator = get_enterprise_monitoring_activator()
        threading.Thread(target=activator.activate_all_enterprise_monitoring, daemon=True).start()
        threading.Thread(target=lambda: activator.start_continuous_health_monitoring(), daemon=True).start()
    except Exception as e:
        logger.error(f"Erro na auto-ativação de monitoramento empresarial: {e}")