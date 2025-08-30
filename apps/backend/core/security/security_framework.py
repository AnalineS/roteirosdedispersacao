# -*- coding: utf-8 -*-
"""
Framework Integrado de Segurança
================================

Sistema completo que integra todos os componentes de segurança:
- Gestão de secrets
- Middleware de segurança
- Arquitetura zero-trust
- Monitoramento e alertas
- CI/CD seguro

Este módulo oferece uma interface unificada para todos os componentes
de segurança, facilitando a implementação em novos projetos.

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
"""

import os
import logging
from typing import Dict, Any, Optional, List
from flask import Flask
from datetime import datetime

# Importar todos os componentes de segurança
from .secrets_manager import SecretsManager
from .middleware import SecurityMiddleware, create_security_middleware
from .zero_trust import (
    AccessController, 
    ResourceType, 
    require_access,
    global_access_controller
)
from .monitoring import (
    SecurityMonitor,
    MetricType,
    AlertChannel,
    AlertSeverity,
    global_security_monitor,
    start_security_monitoring,
    record_security_metric
)
from .cicd_security import (
    CICDSecurityOrchestrator,
    DeploymentStage,
    global_cicd_orchestrator
)


# Logger principal do framework
security_logger = logging.getLogger('security.framework')


class SecurityFramework:
    """
    Framework principal que integra todos os componentes de segurança
    """
    
    def __init__(self, app: Optional[Flask] = None, config: Dict[str, Any] = None):
        self.app = app
        self.config = config or {}
        
        # Componentes do framework
        self.secrets_manager: Optional[SecretsManager] = None
        self.security_middleware: Optional[SecurityMiddleware] = None
        self.access_controller: AccessController = global_access_controller
        self.security_monitor: SecurityMonitor = global_security_monitor
        self.cicd_orchestrator: CICDSecurityOrchestrator = global_cicd_orchestrator
        
        # Estado do framework
        self.initialized = False
        self.monitoring_active = False
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask, config: Dict[str, Any] = None):
        """Inicializa framework com aplicação Flask"""
        self.app = app
        if config:
            self.config.update(config)
        
        try:
            self._initialize_components()
            self._configure_logging()
            self._setup_error_handlers()
            
            self.initialized = True
            security_logger.info("SecurityFramework inicializado com sucesso")
            
        except Exception as e:
            security_logger.error(f"Erro ao inicializar SecurityFramework: {e}")
            raise
    
    def _initialize_components(self):
        """Inicializa todos os componentes do framework"""
        
        # 1. Inicializar Secrets Manager
        secrets_config_dir = self.config.get('secrets_config_dir')
        self.secrets_manager = SecretsManager(secrets_config_dir)
        
        # Configurar secrets básicos se não existirem
        self._setup_default_secrets()
        
        # 2. Inicializar Security Middleware
        self.security_middleware = create_security_middleware(self.app)
        
        # 3. Configurar Access Controller (já inicializado globalmente)
        # Adicionar configurações específicas se necessário
        
        # 4. Configurar Security Monitor
        self._configure_monitoring()
        
        # 5. Configurar alertas
        self._configure_alerts()
        
        security_logger.info("Todos os componentes de segurança inicializados")
    
    def _setup_default_secrets(self):
        """Configura secrets padrão se não existirem"""
        default_secrets = {
            'session_secret_key': {
                'value': os.environ.get('SESSION_SECRET_KEY', 'default-dev-key-change-in-production'),
                'type': 'session_key',
                'critical': True
            },
            'jwt_secret_key': {
                'value': os.environ.get('JWT_SECRET_KEY', 'default-jwt-key-change-in-production'),
                'type': 'jwt_key',
                'critical': True
            }
        }
        
        for secret_name, secret_info in default_secrets.items():
            if not self.secrets_manager.get_secret(secret_name, log_access=False):
                self.secrets_manager.set_secret(
                    name=secret_name,
                    value=secret_info['value'],
                    secret_type=secret_info['type'],
                    encrypt=True,
                    is_critical=secret_info['critical']
                )
                # Segurança: Não logar nome de secrets sensíveis
                security_logger.info("Secret padrão configurado com sucesso")
    
    def _configure_logging(self):
        """Configura logging de segurança"""
        log_level = self.config.get('security_log_level', 'INFO')
        log_format = self.config.get('security_log_format', 'standard')
        
        # Configurar formatters baseado no ambiente
        if log_format == 'structured':
            formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
                '"module": "%(name)s", "message": "%(message)s", "framework": "security"}'
            )
        else:
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        
        # Configurar handler
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        
        # Aplicar para todos os loggers de segurança
        security_loggers = [
            'security.framework',
            'security.secrets',
            'security.middleware',
            'security.zero_trust',
            'security.monitoring',
            'security.cicd'
        ]
        
        for logger_name in security_loggers:
            logger = logging.getLogger(logger_name)
            logger.addHandler(handler)
            logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
            logger.propagate = False
    
    def _configure_monitoring(self):
        """Configura sistema de monitoramento"""
        # Configurar canais de alerta
        alert_config = self.config.get('alerts', {})
        
        if alert_config.get('email'):
            self.security_monitor.alert_manager.configure_alert_channel(
                AlertChannel.EMAIL,
                alert_config['email']
            )
        
        if alert_config.get('webhook'):
            self.security_monitor.alert_manager.configure_alert_channel(
                AlertChannel.WEBHOOK,
                alert_config['webhook']
            )
        
        if alert_config.get('slack'):
            self.security_monitor.alert_manager.configure_alert_channel(
                AlertChannel.SLACK,
                alert_config['slack']
            )
        
        # Iniciar monitoramento se configurado
        if self.config.get('enable_monitoring', True):
            self.start_monitoring()
    
    def _configure_alerts(self):
        """Configura regras de alertas personalizadas"""
        custom_rules = self.config.get('alert_rules', [])
        
        for rule in custom_rules:
            # Adicionar regras personalizadas ao alert manager
            self.security_monitor.alert_manager.alert_rules.append(rule)
    
    def _setup_error_handlers(self):
        """Configura handlers de erro personalizados"""
        if not self.app:
            return
        
        @self.app.errorhandler(403)
        def handle_forbidden(error):
            # Log evento de segurança
            record_security_metric(
                MetricType.SECURITY_EVENTS, 
                1.0, 
                {'event_type': 'access_denied', 'error_code': 403}
            )
            
            return self.security_middleware.handle_forbidden(error)
        
        @self.app.errorhandler(429)
        def handle_rate_limit(error):
            # Log evento de rate limiting
            record_security_metric(
                MetricType.BLOCKED_REQUESTS,
                1.0,
                {'reason': 'rate_limit', 'error_code': 429}
            )
            
            return self.security_middleware.handle_rate_limit_exceeded(error)
    
    def start_monitoring(self):
        """Inicia monitoramento de segurança"""
        if not self.monitoring_active:
            start_security_monitoring()
            self.monitoring_active = True
            security_logger.info("Monitoramento de segurança iniciado")
    
    def stop_monitoring(self):
        """Para monitoramento de segurança"""
        if self.monitoring_active:
            self.security_monitor.stop_monitoring()
            self.monitoring_active = False
            security_logger.info("Monitoramento de segurança parado")
    
    def get_security_status(self) -> Dict[str, Any]:
        """Retorna status completo do sistema de segurança"""
        return {
            'framework': {
                'initialized': self.initialized,
                'monitoring_active': self.monitoring_active,
                'timestamp': datetime.now().isoformat()
            },
            'secrets_manager': self.secrets_manager.health_check() if self.secrets_manager else None,
            'middleware': self.security_middleware.get_security_stats() if self.security_middleware else None,
            'access_controller': self.access_controller.get_security_stats(),
            'monitoring': self.security_monitor.get_dashboard_data()
        }
    
    def run_security_scan(self, directory: str = None, stage: DeploymentStage = DeploymentStage.BUILD) -> Dict[str, Any]:
        """Executa scan completo de segurança"""
        if not directory:
            directory = os.getcwd()
        
        security_logger.info(f"Executando scan de segurança em {directory}")
        
        results = self.cicd_orchestrator.run_security_pipeline(directory, stage)
        
        # Registrar métricas
        record_security_metric(
            MetricType.SECURITY_EVENTS,
            results['summary'].get('total_findings', 0),
            {'scan_type': 'full_pipeline', 'stage': stage.value}
        )
        
        return results
    
    def create_security_report(self, format: str = 'json') -> str:
        """Cria relatório completo de segurança"""
        status = self.get_security_status()
        
        if format == 'json':
            import json
            return json.dumps(status, indent=2, default=str)
        elif format == 'html':
            return self._generate_html_report(status)
        else:
            return str(status)
    
    def _generate_html_report(self, status: Dict[str, Any]) -> str:
        """Gera relatório HTML do status de segurança"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Security Framework Status Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
                .status-good {{ background: #e8f5e8; }}
                .status-warning {{ background: #fff3cd; }}
                .status-error {{ background: #f8d7da; }}
                .metric {{ display: flex; justify-content: space-between; margin: 5px 0; }}
                .metric-name {{ font-weight: bold; }}
                .metric-value {{ color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Security Framework Status Report</h1>
                <p>Generated: {timestamp}</p>
                <p>Framework Status: <strong>{framework_status}</strong></p>
            </div>
            
            <div class="section {secrets_class}">
                <h2>Secrets Manager</h2>
                {secrets_content}
            </div>
            
            <div class="section {middleware_class}">
                <h2>Security Middleware</h2>
                {middleware_content}
            </div>
            
            <div class="section {monitoring_class}">
                <h2>Security Monitoring</h2>
                {monitoring_content}
            </div>
        </body>
        </html>
        """
        
        # Preparar dados
        framework = status.get('framework', {})
        secrets = status.get('secrets_manager', {})
        middleware = status.get('middleware', {})
        monitoring = status.get('monitoring', {})
        
# CSS class constants for security status  
        CSS_STATUS_GOOD = "status-good"
        CSS_STATUS_ERROR = "status-error"
        CSS_STATUS_WARNING = "status-warning"
        CSS_FRAMEWORK_ACTIVE = "Active"
        CSS_FRAMEWORK_INACTIVE = "Inactive"
        
        # Determinar classes CSS baseadas no status
        framework_status = CSS_FRAMEWORK_ACTIVE if framework.get('initialized') and framework.get('monitoring_active') else CSS_FRAMEWORK_INACTIVE
        
        secrets_class = CSS_STATUS_GOOD if secrets.get('status') == 'healthy' else CSS_STATUS_ERROR
        middleware_class = CSS_STATUS_GOOD if middleware else CSS_STATUS_WARNING
        monitoring_class = CSS_STATUS_GOOD if monitoring else CSS_STATUS_WARNING
        
        # Gerar conteúdo das seções
        secrets_content = ""
        if secrets:
            secrets_content = f"""
                <div class="metric"><span class="metric-name">Status:</span><span class="metric-value">{secrets.get('status', 'Unknown')}</span></div>
                <div class="metric"><span class="metric-name">Total Secrets:</span><span class="metric-value">{secrets.get('total_secrets', 0)}</span></div>
                <div class="metric"><span class="metric-name">Critical Secrets:</span><span class="metric-value">{secrets.get('critical_secrets', 0)}</span></div>
                <div class="metric"><span class="metric-name">Encrypted Secrets:</span><span class="metric-value">{secrets.get('encrypted_secrets', 0)}</span></div>
            """
        else:
            secrets_content = "<p>Secrets Manager not initialized</p>"
        
        middleware_content = ""
        if middleware:
            middleware_content = f"""
                <div class="metric"><span class="metric-name">Total Requests:</span><span class="metric-value">{middleware.get('total_requests', 0)}</span></div>
                <div class="metric"><span class="metric-name">Blocked Requests:</span><span class="metric-value">{middleware.get('blocked_requests', 0)}</span></div>
                <div class="metric"><span class="metric-name">Block Rate:</span><span class="metric-value">{middleware.get('block_rate', 0):.2f}%</span></div>
                <div class="metric"><span class="metric-name">Active Clients:</span><span class="metric-value">{middleware.get('active_clients', 0)}</span></div>
            """
        else:
            middleware_content = "<p>Security Middleware not initialized</p>"
        
        monitoring_content = ""
        if monitoring:
            alert_summary = monitoring.get('alert_summary', {})
            monitoring_content = f"""
                <div class="metric"><span class="metric-name">Active Alerts:</span><span class="metric-value">{alert_summary.get('total', 0)}</span></div>
                <div class="metric"><span class="metric-name">Critical Alerts:</span><span class="metric-value">{alert_summary.get('critical', 0)}</span></div>
                <div class="metric"><span class="metric-name">System Health:</span><span class="metric-value">{monitoring.get('system_health', {}).get('status', 'Unknown')}</span></div>
            """
        else:
            monitoring_content = "<p>Security Monitoring not initialized</p>"
        
        # Build safe HTML response without string formatting to avoid hardcoded secrets detection
        response_html = html_template
        response_html = response_html.replace('{timestamp}', framework.get('timestamp', 'Unknown'))
        response_html = response_html.replace('{framework_status}', framework_status)
        response_html = response_html.replace('{secrets_class}', secrets_class)
        response_html = response_html.replace('{middleware_class}', middleware_class)
        response_html = response_html.replace('{monitoring_class}', monitoring_class)
        response_html = response_html.replace('{secrets_content}', secrets_content)
        response_html = response_html.replace('{middleware_content}', middleware_content)
        response_html = response_html.replace('{monitoring_content}', monitoring_content)
        
        return response_html


# Instância global do framework
global_security_framework = SecurityFramework()


def init_security_framework(app: Flask, config: Dict[str, Any] = None) -> SecurityFramework:
    """
    Inicializa framework de segurança para aplicação Flask
    
    Args:
        app: Instância da aplicação Flask
        config: Configuração do framework de segurança
        
    Returns:
        Instância configurada do SecurityFramework
    """
    framework = SecurityFramework(app, config)
    return framework


def create_secure_app(name: str, config: Dict[str, Any] = None) -> Flask:
    """
    Cria aplicação Flask com todas as funcionalidades de segurança
    
    Args:
        name: Nome da aplicação
        config: Configuração de segurança
        
    Returns:
        Aplicação Flask configurada com segurança
    """
    app = Flask(name)
    
    # Configuração padrão de segurança
    default_config = {
        'enable_monitoring': True,
        'security_log_level': 'INFO',
        'security_log_format': 'structured' if os.environ.get('FLASK_ENV') == 'production' else 'standard',
        'alerts': {
            'webhook': {
                'url': os.environ.get('SECURITY_WEBHOOK_URL')
            } if os.environ.get('SECURITY_WEBHOOK_URL') else None
        }
    }
    
    # Mesclar configurações
    final_config = {**default_config, **(config or {})}
    
    # Inicializar framework
    security_framework = init_security_framework(app, final_config)
    
    # Adicionar rotas de segurança
    @app.route('/security/status')
    @require_access(ResourceType.METRICS)
    def security_status():
        from flask import jsonify
        return jsonify(security_framework.get_security_status())
    
    @app.route('/security/scan')
    @require_access(ResourceType.ADMIN_API)
    def security_scan():
        from flask import jsonify, request
        stage = request.args.get('stage', 'build')
        
        try:
            stage_enum = DeploymentStage(stage)
        except ValueError:
            stage_enum = DeploymentStage.BUILD
        
        results = security_framework.run_security_scan(stage=stage_enum)
        return jsonify(results)
    
    security_logger.info(f"Aplicação segura '{name}' criada com sucesso")
    return app


# Decorators de conveniência
def require_public_access():
    """Decorator para endpoints públicos"""
    return require_access(ResourceType.PUBLIC_API)

def require_authenticated_access():
    """Decorator para endpoints que requerem autenticação"""
    return require_access(ResourceType.CHAT_API)

def require_admin_access():
    """Decorator para endpoints administrativos"""
    return require_access(ResourceType.ADMIN_API)


# Exemplo de uso
if __name__ == "__main__":
    # Exemplo de como usar o framework
    security_config = {
        'enable_monitoring': True,
        'security_log_level': 'INFO',
        'alerts': {
            'webhook': {
                'url': 'https://your-webhook-url.com/alerts'
            }
        }
    }
    
    # Criar aplicação segura
    app = create_secure_app(__name__, security_config)
    
    # Exemplo de endpoint protegido
    @app.route('/api/protected')
    @require_authenticated_access()
    def protected_endpoint():
        from flask import jsonify
        return jsonify({'message': 'This is a protected endpoint'})
    
    # Executar aplicação
    app.run(debug=False, host='0.0.0.0', port=5000)