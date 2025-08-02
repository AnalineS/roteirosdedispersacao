"""
Exemplo de Integração do Sistema de Segurança
=============================================

Este arquivo demonstra como integrar o sistema completo de segurança
com a aplicação Flask existente do projeto Roteiro de Dispensação.

Funcionalidades demonstradas:
- Integração com main.py existente
- Configuração de todos os componentes de segurança
- Exemplos de uso dos decorators
- Configuração de monitoramento
- Setup de alertas

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
"""

import os
import logging
from datetime import datetime
from flask import Flask, request, jsonify, g

# Importar sistema de segurança
from .security_framework import (
    SecurityFramework,
    init_security_framework,
    require_public_access,
    require_authenticated_access,
    require_admin_access
)
from .zero_trust import ResourceType, require_access
from .monitoring import MetricType, record_security_metric
from .secrets_manager import SecretsManager


def integrate_security_with_existing_app(app: Flask) -> SecurityFramework:
    """
    Integra sistema de segurança com aplicação Flask existente
    
    Args:
        app: Aplicação Flask existente
        
    Returns:
        SecurityFramework configurado
    """
    
    # Configuração de segurança
    security_config = {
        'enable_monitoring': True,
        'security_log_level': os.environ.get('SECURITY_LOG_LEVEL', 'INFO'),
        'security_log_format': 'structured' if os.environ.get('FLASK_ENV') == 'production' else 'standard',
        'secrets_config_dir': os.environ.get('SECRETS_CONFIG_DIR', './config/secrets'),
        'alerts': {
            'webhook': {
                'url': os.environ.get('SECURITY_WEBHOOK_URL'),
                'headers': {'Authorization': f"Bearer {os.environ.get('WEBHOOK_TOKEN', '')}"}
            } if os.environ.get('SECURITY_WEBHOOK_URL') else None,
            'email': {
                'smtp_server': os.environ.get('SMTP_SERVER'),
                'smtp_port': int(os.environ.get('SMTP_PORT', 587)),
                'smtp_username': os.environ.get('SMTP_USERNAME'),
                'smtp_password': os.environ.get('SMTP_PASSWORD'),
                'from_email': os.environ.get('ALERT_FROM_EMAIL'),
                'to_emails': os.environ.get('ALERT_TO_EMAILS', '').split(',')
            } if os.environ.get('SMTP_SERVER') else None,
            'slack': {
                'webhook_url': os.environ.get('SLACK_WEBHOOK_URL')
            } if os.environ.get('SLACK_WEBHOOK_URL') else None
        },
        'alert_rules': [
            # Regra personalizada para o projeto
            {
                'name': 'high_chat_api_usage',
                'metric_type': MetricType.REQUEST_RATE,
                'condition': lambda x: x > 100,  # Mais de 100 req/min na API de chat
                'severity': 'HIGH',
                'message': 'Alto uso da API de chat detectado: {value} req/min'
            }
        ]
    }
    
    # Inicializar framework
    security_framework = init_security_framework(app, security_config)
    
    # Configurar secrets específicos do projeto
    setup_project_secrets(security_framework.secrets_manager)
    
    # Adicionar middleware personalizado para métricas
    setup_custom_metrics_collection(app, security_framework)
    
    # Configurar rotas de segurança
    setup_security_routes(app, security_framework)
    
    logging.getLogger('security.framework').info("Sistema de segurança integrado com sucesso")
    return security_framework


def setup_project_secrets(secrets_manager: SecretsManager):
    """Configura secrets específicos do projeto"""
    
    # Secrets para APIs externas
    project_secrets = {
        'openrouter_api_key': {
            'env_var': 'OPENROUTER_API_KEY',
            'type': 'api_keys',
            'critical': True,
            'description': 'Chave da API OpenRouter para IA'
        },
        'huggingface_api_key': {
            'env_var': 'HUGGINGFACE_API_KEY', 
            'type': 'api_keys',
            'critical': True,
            'description': 'Chave da API Hugging Face'
        },
        'firebase_config': {
            'env_var': 'FIREBASE_CONFIG',
            'type': 'configuration',
            'critical': False,
            'description': 'Configuração do Firebase'
        }
    }
    
    for secret_name, config in project_secrets.items():
        env_value = os.environ.get(config['env_var'])
        if env_value:
            # Verificar se secret já existe
            existing = secrets_manager.get_secret(secret_name, log_access=False)
            if not existing:
                secrets_manager.set_secret(
                    name=secret_name,
                    value=env_value,
                    secret_type=config['type'],
                    encrypt=True,
                    is_critical=config['critical']
                )
                logging.getLogger('security.integration').info(f"Secret configurado: {secret_name}")


def setup_custom_metrics_collection(app: Flask, security_framework: SecurityFramework):
    """Configura coleta personalizada de métricas"""
    
    @app.before_request
    def collect_request_metrics():
        """Coleta métricas de cada request"""
        g.request_start_time = datetime.now()
        
        # Registrar métrica de taxa de requests
        record_security_metric(MetricType.REQUEST_RATE, 1.0, {
            'endpoint': request.endpoint,
            'method': request.method,
            'client_ip': request.remote_addr
        })
    
    @app.after_request
    def collect_response_metrics(response):
        """Coleta métricas de response"""
        if hasattr(g, 'request_start_time'):
            # Calcular tempo de resposta
            response_time = (datetime.now() - g.request_start_time).total_seconds() * 1000
            
            record_security_metric(MetricType.RESPONSE_TIME, response_time, {
                'endpoint': request.endpoint,
                'status_code': response.status_code
            })
            
            # Registrar taxa de erro
            if response.status_code >= 400:
                record_security_metric(MetricType.ERROR_RATE, 1.0, {
                    'status_code': response.status_code,
                    'endpoint': request.endpoint
                })
        
        return response


def setup_security_routes(app: Flask, security_framework: SecurityFramework):
    """Configura rotas específicas de segurança"""
    
    @app.route('/api/security/dashboard')
    @require_admin_access()
    def security_dashboard():
        """Dashboard completo de segurança"""
        try:
            dashboard_data = security_framework.get_security_status()
            return jsonify({
                'status': 'success',
                'data': dashboard_data,
                'timestamp': datetime.now().isoformat()
            }), 200
        except Exception as e:
            logging.getLogger('security.routes').error(f"Erro no dashboard: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Erro ao obter dados do dashboard',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/security/scan', methods=['POST'])
    @require_admin_access()
    def security_scan():
        """Executa scan de segurança"""
        try:
            data = request.get_json() or {}
            stage = data.get('stage', 'build')
            directory = data.get('directory', os.getcwd())
            
            # Mapear string para enum
            from .cicd_security import DeploymentStage
            stage_map = {
                'pre_commit': DeploymentStage.PRE_COMMIT,
                'build': DeploymentStage.BUILD,
                'test': DeploymentStage.TEST,
                'staging': DeploymentStage.STAGING,
                'production': DeploymentStage.PRODUCTION
            }
            
            stage_enum = stage_map.get(stage, DeploymentStage.BUILD)
            
            # Executar scan
            results = security_framework.run_security_scan(directory, stage_enum)
            
            return jsonify({
                'status': 'success',
                'scan_results': results,
                'timestamp': datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            logging.getLogger('security.routes').error(f"Erro no scan: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Erro ao executar scan: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/security/secrets/health')
    @require_admin_access()
    def secrets_health():
        """Status do sistema de secrets"""
        try:
            health = security_framework.secrets_manager.health_check()
            return jsonify({
                'status': 'success',
                'secrets_health': health,
                'timestamp': datetime.now().isoformat()
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erro ao verificar secrets: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/security/alerts')
    @require_admin_access()
    def get_alerts():
        """Lista alertas ativos"""
        try:
            alerts = security_framework.security_monitor.alert_manager.get_active_alerts()
            
            # Converter para dict para serialização JSON
            alerts_data = []
            for alert in alerts[:50]:  # Limitar a 50 alertas
                alert_dict = {
                    'id': alert.id,
                    'timestamp': alert.timestamp.isoformat(),
                    'severity': alert.severity.name,
                    'title': alert.title,
                    'message': alert.message,
                    'source': alert.source,
                    'acknowledged': alert.acknowledged,
                    'resolved': alert.resolved
                }
                alerts_data.append(alert_dict)
            
            return jsonify({
                'status': 'success',
                'alerts': alerts_data,
                'total_count': len(alerts),
                'timestamp': datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erro ao obter alertas: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    @app.route('/api/security/alerts/<alert_id>/acknowledge', methods=['POST'])
    @require_admin_access()
    def acknowledge_alert(alert_id):
        """Reconhece um alerta"""
        try:
            success = security_framework.security_monitor.alert_manager.acknowledge_alert(alert_id)
            
            if success:
                return jsonify({
                    'status': 'success',
                    'message': 'Alerta reconhecido com sucesso',
                    'alert_id': alert_id,
                    'timestamp': datetime.now().isoformat()
                }), 200
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Alerta não encontrado',
                    'alert_id': alert_id,
                    'timestamp': datetime.now().isoformat()
                }), 404
                
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Erro ao reconhecer alerta: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }), 500


def enhance_existing_routes(app: Flask):
    """
    Demonstra como adicionar segurança a rotas existentes
    
    Esta função mostra como modificar rotas existentes para adicionar
    controles de segurança sem quebrar a funcionalidade existente.
    """
    
    # Exemplo: Proteger rota de chat existente
    original_chat_route = None
    
    # Encontrar rota original
    for rule in app.url_map.iter_rules():
        if rule.endpoint == 'chat_api':
            original_chat_route = app.view_functions.get('chat_api')
            break
    
    if original_chat_route:
        # Envolver com segurança
        @require_access(ResourceType.CHAT_API)
        def secure_chat_api():
            # Métricas específicas do chat
            record_security_metric(MetricType.REQUEST_RATE, 1.0, {
                'api_type': 'chat',
                'client_ip': request.remote_addr
            })
            
            # Chamar função original
            return original_chat_route()
        
        # Substituir rota
        app.view_functions['chat_api'] = secure_chat_api
        logging.getLogger('security.integration').info("Rota de chat protegida com segurança")


# Exemplo de como usar na aplicação principal
def example_integration():
    """
    Exemplo completo de como integrar o sistema de segurança
    """
    
    # Criar ou obter aplicação Flask existente
    app = Flask(__name__)
    
    # Integrar sistema de segurança
    security_framework = integrate_security_with_existing_app(app)
    
    # Exemplo de rota protegida
    @app.route('/api/chat', methods=['POST'])
    @require_authenticated_access()
    def chat_api():
        """API de chat protegida"""
        # Lógica da API de chat aqui
        return jsonify({'message': 'Chat response'})
    
    # Exemplo de rota administrativa
    @app.route('/api/admin/users')
    @require_admin_access()
    def admin_users():
        """API administrativa protegida"""
        # Lógica administrativa aqui
        return jsonify({'users': []})
    
    # Exemplo de rota pública
    @app.route('/api/health')
    @require_public_access()
    def health_check():
        """Health check público"""
        return jsonify({'status': 'healthy'})
    
    return app, security_framework


if __name__ == "__main__":
    # Executar exemplo
    app, framework = example_integration()
    
    print("Sistema de segurança integrado!")
    print("Endpoints disponíveis:")
    print("- GET  /api/health (público)")
    print("- POST /api/chat (autenticado)")
    print("- GET  /api/admin/users (admin)")
    print("- GET  /api/security/dashboard (admin)")
    print("- POST /api/security/scan (admin)")
    print("- GET  /api/security/alerts (admin)")
    
    # Executar aplicação
    app.run(debug=False, host='0.0.0.0', port=5001)