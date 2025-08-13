#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Inicialização da Integração Prometheus
===============================================

Inicializa e configura a integração completa com Prometheus para
a plataforma médico-educacional Roteiros de Dispensação.

Características:
- Inicialização automática do sistema de métricas
- Verificação de dependências
- Configuração de alertas médicos
- Integração com performance monitor existente
- Coleta automática de métricas do sistema

Uso:
    python scripts/start_prometheus_integration.py
    python scripts/start_prometheus_integration.py --port 9091
    python scripts/start_prometheus_integration.py --disable-server

Autor: Sistema de Métricas Roteiro de Dispensação  
Data: 2025-08-12
"""

import sys
import os
import argparse
import logging
import time
import threading
from pathlib import Path
from typing import Optional

# Adicionar diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PrometheusIntegrationBootstrap:
    """Bootstrap para integração Prometheus"""
    
    def __init__(self):
        self.prometheus_integration = None
        self.metrics_server_started = False
        self.background_collector = None
        self.collection_interval = 15  # segundos
        
    def check_dependencies(self) -> bool:
        """Verifica se todas as dependências estão disponíveis"""
        logger.info("🔍 Verificando dependências...")
        
        try:
            # Verificar Prometheus client
            import prometheus_client
            logger.info("✅ prometheus-client disponível")
        except ImportError:
            logger.error("❌ prometheus-client não encontrado. Execute: pip install prometheus-client")
            return False
        
        try:
            # Verificar configuração da aplicação
            from app_config import config
            if not config.PROMETHEUS_ENABLED:
                logger.warning("⚠️  Prometheus desabilitado na configuração")
                return False
            logger.info("✅ Configuração da aplicação OK")
        except ImportError:
            logger.error("❌ Erro ao importar configuração da aplicação")
            return False
        
        try:
            # Verificar sistema de métricas existente
            from core.metrics.performance_monitor import performance_monitor
            logger.info("✅ Performance monitor existente disponível")
        except ImportError:
            logger.warning("⚠️  Performance monitor não disponível")
            
        try:
            # Verificar integração Prometheus
            from core.metrics.prometheus_metrics import prometheus_integration
            logger.info("✅ Integração Prometheus disponível")
        except ImportError:
            logger.error("❌ Erro ao importar integração Prometheus")
            return False
            
        return True
    
    def initialize_prometheus(self, port: Optional[int] = None) -> bool:
        """Inicializa sistema Prometheus"""
        logger.info("🚀 Inicializando integração Prometheus...")
        
        try:
            from core.metrics.prometheus_metrics import prometheus_integration
            from app_config import config
            
            self.prometheus_integration = prometheus_integration
            
            if not self.prometheus_integration.enabled:
                logger.error("❌ Integração Prometheus não habilitada")
                return False
                
            logger.info("✅ Sistema de métricas Prometheus inicializado")
            
            # Inicializar servidor de métricas se solicitado
            if port is not None:
                success = self.prometheus_integration.start_metrics_server(port)
                self.metrics_server_started = success
                
                if success:
                    logger.info(f"📊 Servidor de métricas Prometheus rodando na porta {port}")
                    logger.info(f"🔗 Acesse: http://localhost:{port}/metrics")
                else:
                    logger.error("❌ Falha ao iniciar servidor de métricas")
                    
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar Prometheus: {e}")
            return False
    
    def start_background_collection(self):
        """Inicia coleta automática de métricas em background"""
        logger.info("🔄 Iniciando coleta automática de métricas...")
        
        def collect_metrics():
            while True:
                try:
                    if self.prometheus_integration and self.prometheus_integration.enabled:
                        self.prometheus_integration.collect_and_export_system_metrics()
                        logger.debug("📊 Métricas coletadas e exportadas")
                    time.sleep(self.collection_interval)
                    
                except Exception as e:
                    logger.warning(f"⚠️  Erro na coleta automática: {e}")
                    time.sleep(self.collection_interval)
        
        self.background_collector = threading.Thread(target=collect_metrics, daemon=True)
        self.background_collector.start()
        logger.info(f"✅ Coleta automática iniciada (intervalo: {self.collection_interval}s)")
    
    def setup_medical_alerts(self):
        """Configura alertas específicos para plataforma médica"""
        logger.info("⚕️  Configurando alertas médicos...")
        
        try:
            from core.metrics.performance_monitor import performance_monitor
            
            def medical_alert_handler(alert_type: str, details: dict):
                """Handler especializado para alertas médicos"""
                severity_map = {
                    'high_cpu_usage': 'CRITICAL',
                    'high_memory_usage': 'CRITICAL', 
                    'high_disk_usage': 'WARNING',
                    'slow_endpoint': 'WARNING',
                    'high_error_rate': 'CRITICAL'
                }
                
                severity = severity_map.get(alert_type, 'INFO')
                
                # Log estruturado para alertas médicos
                logger.warning(f"🚨 ALERTA MÉDICO [{severity}] {alert_type}: {details}")
                
                # Registrar no Prometheus se disponível
                if self.prometheus_integration and self.prometheus_integration.enabled:
                    self.prometheus_integration.metrics_collector.record_security_event(
                        event_type=f"medical_alert_{alert_type}",
                        severity=severity.lower(),
                        source='performance_monitor'
                    )
            
            performance_monitor.add_alert_callback(medical_alert_handler)
            logger.info("✅ Sistema de alertas médicos configurado")
            
        except Exception as e:
            logger.warning(f"⚠️  Erro ao configurar alertas médicos: {e}")
    
    def display_status(self):
        """Exibe status do sistema"""
        logger.info("📋 Status da Integração Prometheus:")
        logger.info(f"   - Prometheus habilitado: {'✅' if self.prometheus_integration and self.prometheus_integration.enabled else '❌'}")
        logger.info(f"   - Servidor de métricas: {'✅' if self.metrics_server_started else '❌'}")
        logger.info(f"   - Coleta automática: {'✅' if self.background_collector and self.background_collector.is_alive() else '❌'}")
        
        if self.prometheus_integration and self.prometheus_integration.enabled:
            try:
                from app_config import config
                logger.info(f"   - Porta do servidor: {config.PROMETHEUS_PORT}")
                logger.info(f"   - Namespace: {config.MEDICAL_METRICS_NAMESPACE}")
                logger.info(f"   - Job name: {config.PROMETHEUS_JOB_NAME}")
            except:
                pass
    
    def run_health_check(self):
        """Executa verificação de saúde do sistema"""
        logger.info("🏥 Executando health check médico...")
        
        try:
            if not self.prometheus_integration or not self.prometheus_integration.enabled:
                logger.error("❌ Sistema Prometheus não disponível")
                return False
                
            # Verificar coleta de métricas
            metrics_data, _ = self.prometheus_integration.get_metrics_for_endpoint()
            if len(metrics_data) < 100:  # Métricas muito pequenas indicam problema
                logger.warning("⚠️  Poucas métricas sendo coletadas")
            else:
                logger.info("✅ Coleta de métricas funcionando")
            
            # Verificar integração com performance monitor
            try:
                from core.metrics.performance_monitor import performance_monitor
                current_metrics = performance_monitor.get_current_metrics()
                if current_metrics and current_metrics.get('uptime_seconds', 0) > 0:
                    logger.info("✅ Performance monitor integrado")
                else:
                    logger.warning("⚠️  Performance monitor com problemas")
            except Exception as e:
                logger.warning(f"⚠️  Erro na verificação do performance monitor: {e}")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro no health check: {e}")
            return False
    
    def shutdown(self):
        """Finaliza sistema graciosamente"""
        logger.info("🔄 Finalizando integração Prometheus...")
        
        if self.prometheus_integration:
            self.prometheus_integration.shutdown()
            
        logger.info("✅ Sistema finalizado")

def main():
    parser = argparse.ArgumentParser(description="Inicializar integração Prometheus para plataforma médica")
    parser.add_argument('--port', type=int, help='Porta para servidor de métricas (padrão: configuração)')
    parser.add_argument('--disable-server', action='store_true', help='Não iniciar servidor HTTP de métricas')
    parser.add_argument('--interval', type=int, default=15, help='Intervalo de coleta em segundos (padrão: 15)')
    parser.add_argument('--health-check-only', action='store_true', help='Executar apenas health check')
    
    args = parser.parse_args()
    
    bootstrap = PrometheusIntegrationBootstrap()
    bootstrap.collection_interval = args.interval
    
    try:
        # Verificar dependências
        if not bootstrap.check_dependencies():
            logger.error("❌ Falha na verificação de dependências")
            sys.exit(1)
            
        # Health check apenas
        if args.health_check_only:
            bootstrap.initialize_prometheus()
            success = bootstrap.run_health_check()
            sys.exit(0 if success else 1)
        
        # Inicializar Prometheus
        port = None if args.disable_server else args.port
        if not bootstrap.initialize_prometheus(port):
            logger.error("❌ Falha na inicialização do Prometheus")
            sys.exit(1)
        
        # Configurar alertas médicos
        bootstrap.setup_medical_alerts()
        
        # Iniciar coleta automática
        bootstrap.start_background_collection()
        
        # Exibir status
        bootstrap.display_status()
        
        # Health check inicial
        bootstrap.run_health_check()
        
        logger.info("🎉 Integração Prometheus totalmente inicializada!")
        logger.info("📊 Sistema coletando métricas médicas continuamente")
        
        if not args.disable_server and bootstrap.metrics_server_started:
            from app_config import config
            port = args.port or config.PROMETHEUS_PORT
            logger.info(f"🌐 Métricas disponíveis em: http://localhost:{port}/metrics")
        
        logger.info("⚕️  Sistema pronto para monitoramento médico!")
        logger.info("👋 Pressione Ctrl+C para finalizar")
        
        # Loop principal
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Interrupção solicitada pelo usuário")
            
    except Exception as e:
        logger.error(f"❌ Erro fatal: {e}")
        sys.exit(1)
        
    finally:
        bootstrap.shutdown()

if __name__ == "__main__":
    main()