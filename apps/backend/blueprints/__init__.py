# -*- coding: utf-8 -*-
"""
Flask Blueprints para modularização do backend
Organização por domínio de responsabilidade
"""

from .chat_blueprint import chat_bp
from .personas_blueprint import personas_bp
from .feedback_blueprint import feedback_bp
from .health_blueprint import health_bp
from .monitoring_blueprint import monitoring_bp
from .metrics_blueprint import metrics_bp
from .docs_blueprint import docs_bp

# Importar swagger ui blueprint
try:
    from core.openapi.spec import swagger_ui_blueprint
    SWAGGER_AVAILABLE = True
except ImportError:
    SWAGGER_AVAILABLE = False
    swagger_ui_blueprint = None

# Lista de todos os blueprints para registro
ALL_BLUEPRINTS = [
    chat_bp,
    personas_bp,
    feedback_bp,
    health_bp,
    monitoring_bp,
    metrics_bp,
    docs_bp
]

# Adicionar swagger ui se disponível
if SWAGGER_AVAILABLE and swagger_ui_blueprint:
    ALL_BLUEPRINTS.append(swagger_ui_blueprint)

__all__ = [
    'chat_bp',
    'personas_bp', 
    'feedback_bp',
    'health_bp',
    'monitoring_bp',
    'metrics_bp',
    'docs_bp',
    'swagger_ui_blueprint',
    'ALL_BLUEPRINTS'
]