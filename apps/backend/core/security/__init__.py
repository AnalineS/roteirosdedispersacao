# -*- coding: utf-8 -*-
"""
Sistema de Segurança Integrado - Roteiro de Dispensação
======================================================

Módulo principal de segurança que integra todos os componentes:
- Gestão segura de secrets
- Middleware de segurança
- Arquitetura Zero-Trust
- Monitoramento em tempo real
- Framework de segurança unificado

Uso básico:
    from src.backend.core.security import create_secure_app, SecurityFramework
    
    app = create_secure_app(__name__)
    
    @app.route('/protected')
    @require_authenticated_access()
    def protected_endpoint():
        return {'status': 'secure'}

Autor: Sistema de Segurança Automatizado
Versão: 1.0.0
Licença: Proprietária - Uso Interno
"""

from .security_framework import SecurityFramework, create_secure_app
from .secrets_manager import SecretsManager
from .middleware import SecurityMiddleware
from .zero_trust import ZeroTrustManager, require_authenticated_access
from .monitoring import SecurityMonitor
from .cicd_security import SecurityScanner
from .medical_audit_logger import medical_audit_logger, MedicalAuditLogger, ActionType, MedicalDataClassification

# Versão do sistema de segurança
__version__ = "1.0.0"

# Instância global do framework de segurança
_security_framework = None

def get_security_framework():
    """
    Retorna a instância global do framework de segurança.
    Lazy loading para garantir configuração adequada.
    """
    global _security_framework
    if _security_framework is None:
        _security_framework = SecurityFramework()
    return _security_framework

def initialize_security(app=None, config=None):
    """
    Inicializa todos os componentes de segurança.
    
    Args:
        app: Instância Flask (opcional)
        config: Configurações de segurança (opcional)
    
    Returns:
        SecurityFramework: Framework configurado
    """
    framework = get_security_framework()
    
    if config:
        framework.configure(config)
    
    if app:
        framework.init_app(app)
    
    return framework

# Exportações principais
__all__ = [
    'SecurityFramework',
    'SecretsManager', 
    'SecurityMiddleware',
    'ZeroTrustManager',
    'SecurityMonitor',
    'SecurityScanner',
    'MedicalAuditLogger',
    'medical_audit_logger',
    'ActionType',
    'MedicalDataClassification',
    'create_secure_app',
    'require_authenticated_access',
    'get_security_framework',
    'initialize_security'
]