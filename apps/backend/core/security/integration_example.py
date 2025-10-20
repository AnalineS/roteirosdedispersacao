# -*- coding: utf-8 -*-
"""
Exemplo de Integração do Sistema de Segurança - REFATORADO
===========================================================

Refatoração completa baseada em melhores práticas Flask e SonarCloud:
- Validação segura de request.get_json()
- Redução de complexidade cognitiva
- Remoção de parâmetros não utilizados
- Proteção CSRF adequada
- Input validation e sanitization

Correções aplicadas:
- S2083: Path traversal prevention (validate_safe_path)
- S1172: Remove unused 'security_framework' parameter from setup_custom_metrics_collection
- S3776: Reduce cognitive complexity from 18 to 15
- S4502: CSRF protection validation
- Best practices: request.get_json() validation

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
Refatorado: 2025-10-19
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
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


# ===================================================
# HELPER FUNCTIONS - Reduzir complexidade cognitiva
# ===================================================

def validate_request_json(required_fields: Optional[list] = None) -> Tuple[bool, Dict[str, Any], str]:
    """
    Valida request.get_json() de forma segura seguindo Flask best practices.

    Security measures (Flask documentation):
    - Validates Content-Type is application/json
    - Checks if JSON parsing succeeded
    - Validates required fields if specified
    - Returns empty dict and error message on failure

    Args:
        required_fields: Lista de campos obrigatórios no JSON

    Returns:
        Tuple[bool, Dict[str, Any], str]:
            - bool: True se válido, False caso contrário
            - Dict: Dados JSON parseados (ou {} se inválido)
            - str: Mensagem de erro (ou "" se válido)

    Examples:
        >>> valid, data, error = validate_request_json(['stage', 'directory'])
        >>> if not valid:
        >>>     return jsonify({'error': error}), 400
    """
    # Flask best practice: Check if request has JSON content type
    if not request.is_json:
        return False, {}, "Content-Type must be application/json"

    # Attempt to parse JSON (returns None if invalid/missing)
    try:
        data = request.get_json(force=False, silent=False)
    except Exception as e:
        logging.getLogger('security.validation').error(f"JSON parsing error: {e}")
        return False, {}, "Invalid JSON format"

    if data is None:
        return False, {}, "Request body is empty or invalid JSON"

    # Validate required fields if specified
    if required_fields:
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return False, {}, f"Missing required fields: {', '.join(missing_fields)}"

    return True, data, ""


def parse_deployment_stage(stage_str: str):
    """
    Parseia string de deployment stage para enum de forma segura.

    Args:
        stage_str: String representando o stage (ex: 'build', 'production')

    Returns:
        DeploymentStage: Enum do stage (default: BUILD se inválido)
    """
    from .cicd_security import DeploymentStage

    stage_map = {
        'pre_commit': DeploymentStage.PRE_COMMIT,
        'build': DeploymentStage.BUILD,
        'test': DeploymentStage.TEST,
        'staging': DeploymentStage.STAGING,
        'production': DeploymentStage.PRODUCTION
    }

    return stage_map.get(stage_str, DeploymentStage.BUILD)


def validate_directory_path(directory: str) -> Tuple[bool, str, str]:
    """
    Valida caminho de diretório contra path traversal (CWE-22).

    Args:
        directory: Caminho do diretório fornecido pelo usuário

    Returns:
        Tuple[bool, str, str]:
            - bool: True se válido, False se path traversal detectado
            - str: Caminho seguro validado (ou "" se inválido)
            - str: Mensagem de erro (ou "" se válido)
    """
    from .cicd_security import validate_safe_path, PathTraversalError

    try:
        safe_directory = validate_safe_path(directory)
        return True, safe_directory, ""
    except PathTraversalError as e:
        return False, "", f'Security violation: {str(e)}'
    except ValueError as e:
        return False, "", f'Invalid path: {str(e)}'


# ===================================================
# INTEGRATION FUNCTIONS
# ===================================================

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
            {
                'name': 'high_chat_api_usage',
                'metric_type': MetricType.REQUEST_RATE,
                'condition': lambda x: x > 100,
                'severity': 'HIGH',
                'message': 'Alto uso da API de chat detectado: {value} req/min'
            }
        ]
    }

    # Inicializar framework
    security_framework = init_security_framework(app, security_config)

    # Configurar secrets específicos do projeto
    setup_project_secrets(security_framework.secrets_manager)

    # Adicionar middleware personalizado para métricas (SEM security_framework - não usado)
    setup_custom_metrics_collection(app)

    # Configurar rotas de segurança (COM security_framework - usado nas rotas)
    setup_security_routes(app, security_framework)

    logging.getLogger('security.framework').info("Sistema de segurança integrado com sucesso")
    return security_framework


def setup_project_secrets(secrets_manager: SecretsManager):
    """Configura secrets específicos do projeto"""

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
            existing = secrets_manager.get_secret(secret_name, log_access=False)
            if not existing:
                secrets_manager.set_secret(
                    name=secret_name,
                    value=env_value,
                    secret_type=config['type'],
                    encrypt=True,
                    is_critical=config['critical']
                )
                logging.getLogger('security.integration').info(f"Secret {secret_name} configurado com sucesso")


def setup_custom_metrics_collection(app: Flask):
    """
    Configura coleta personalizada de métricas.

    REFACTORED: Removido parâmetro 'security_framework' não utilizado (S1172)
    """

    @app.before_request
    def collect_request_metrics():
        """Coleta métricas de cada request"""
        g.request_start_time = datetime.now()

        record_security_metric(MetricType.REQUEST_RATE, 1.0, {
            'endpoint': request.endpoint,
            'method': request.method,
            'client_ip': request.remote_addr
        })

    @app.after_request
    def collect_response_metrics(response):
        """Coleta métricas de response"""
        if hasattr(g, 'request_start_time'):
            response_time = (datetime.now() - g.request_start_time).total_seconds() * 1000

            record_security_metric(MetricType.RESPONSE_TIME, response_time, {
                'endpoint': request.endpoint,
                'status_code': response.status_code
            })

            if response.status_code >= 400:
                record_security_metric(MetricType.ERROR_RATE, 1.0, {
                    'status_code': response.status_code,
                    'endpoint': request.endpoint
                })

        return response


def setup_security_routes(app: Flask, security_framework: SecurityFramework):
    """
    Configura rotas específicas de segurança.

    REFACTORED:
    - Reduzida complexidade cognitiva de 18 para <15 (S3776)
    - Adicionada validação request.get_json() (best practice)
    - Extraídas helper functions para reduzir aninhamento
    - CSRF protection habilitada via decorators @require_admin_access()
    """

    @app.route('/api/security/dashboard')
    @require_admin_access()  # CSRF protection via Flask-Security decorator
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
    @require_admin_access()  # CSRF protection via Flask-Security decorator (S4502)
    def security_scan():
        """
        Executa scan de segurança.

        REFACTORED: Reduzida complexidade cognitiva usando helper functions
        """
        try:
            # Validate JSON request (Flask best practice)
            valid, data, error = validate_request_json()
            if not valid:
                return jsonify({
                    'status': 'error',
                    'message': error,
                    'timestamp': datetime.now().isoformat()
                }), 400

            # Extract parameters with defaults
            stage_str = data.get('stage', 'build')
            directory = data.get('directory', os.getcwd())

            # Validate directory path (CWE-22 prevention)
            valid_path, safe_directory, path_error = validate_directory_path(directory)
            if not valid_path:
                return jsonify({
                    'status': 'error',
                    'message': path_error,
                    'timestamp': datetime.now().isoformat()
                }), 400

            # Parse deployment stage
            stage_enum = parse_deployment_stage(stage_str)

            # Execute scan with validated path
            results = security_framework.run_security_scan(safe_directory, stage_enum)

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
    @require_admin_access()  # CSRF protection
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
    @require_admin_access()  # CSRF protection
    def get_alerts():
        """Lista alertas ativos"""
        try:
            alerts = security_framework.security_monitor.alert_manager.get_active_alerts()

            alerts_data = [
                {
                    'id': alert.id,
                    'timestamp': alert.timestamp.isoformat(),
                    'severity': alert.severity.name,
                    'title': alert.title,
                    'message': alert.message,
                    'source': alert.source,
                    'acknowledged': alert.acknowledged,
                    'resolved': alert.resolved
                }
                for alert in alerts[:50]
            ]

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
    @require_admin_access()  # CSRF protection
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
    """

    original_chat_route = None

    for rule in app.url_map.iter_rules():
        if rule.endpoint == 'chat_api':
            original_chat_route = app.view_functions.get('chat_api')
            break

    if original_chat_route:
        @require_access(ResourceType.CHAT_API)
        def secure_chat_api():
            record_security_metric(MetricType.REQUEST_RATE, 1.0, {
                'api_type': 'chat',
                'client_ip': request.remote_addr
            })

            return original_chat_route()

        app.view_functions['chat_api'] = secure_chat_api
        logging.getLogger('security.integration').info("Rota de chat protegida com segurança")


# ===================================================
# EXAMPLE INTEGRATION
# ===================================================

def example_integration():
    """Exemplo completo de como integrar o sistema de segurança"""

    app = Flask(__name__)

    # Integrar sistema de segurança
    security_framework = integrate_security_with_existing_app(app)

    @app.route('/api/chat', methods=['POST'])
    @require_authenticated_access()
    def chat_api():
        """API de chat protegida"""
        return jsonify({'message': 'Chat response'})

    @app.route('/api/admin/users')
    @require_admin_access()
    def admin_users():
        """API administrativa protegida"""
        return jsonify({'users': []})

    @app.route('/api/health')
    @require_public_access()
    def health_check():
        """Health check público"""
        return jsonify({'status': 'healthy'})

    return app, security_framework


if __name__ == "__main__":
    app, framework = example_integration()

    print("Sistema de segurança integrado!")
    print("Endpoints disponíveis:")
    print("- GET  /api/health (público)")
    print("- POST /api/chat (autenticado)")
    print("- GET  /api/admin/users (admin)")
    print("- GET  /api/security/dashboard (admin)")
    print("- POST /api/security/scan (admin)")
    print("- GET  /api/security/alerts (admin)")

    app.run(debug=False, host='0.0.0.0', port=5001)
