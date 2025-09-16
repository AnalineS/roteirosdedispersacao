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
from .ux_tracking_blueprint import ux_tracking_bp
from .metrics_blueprint import metrics_bp
from .docs_blueprint import docs_bp
from .analytics_blueprint import analytics_bp
from .predictions_blueprint import predictions_bp
from .multimodal_blueprint import multimodal_bp
from .observability import observability_bp
from .notifications_blueprint import notifications_bp
from .validation_blueprint import validation_bp
from .logging_blueprint import logging_bp

# Import blueprints obrigatórios
from .cache_blueprint import cache_blueprint
from .user_blueprint import user_bp
from .auth_blueprint import auth_bp  # Novo sistema de autenticação JWT
from core.openapi.spec import swagger_ui_blueprint

# Lista de todos os blueprints para registro
ALL_BLUEPRINTS = [
    chat_bp,
    personas_bp,
    feedback_bp,
    health_bp,
    monitoring_bp,
    ux_tracking_bp,  # UX Monitoring integration
    metrics_bp,
    docs_bp,
    analytics_bp,
    predictions_bp,
    multimodal_bp,
    observability_bp,
    notifications_bp,  # PR #175 - Social features
    validation_bp,  # Educational validation system
    logging_bp,  # Cloud logging and LGPD compliance
    cache_blueprint,
    user_bp,
    auth_bp,  # Novo sistema de autenticação JWT
    swagger_ui_blueprint
]

__all__ = [
    'chat_bp',
    'personas_bp', 
    'feedback_bp',
    'health_bp',
    'monitoring_bp',
    'ux_tracking_bp',  # UX Monitoring
    'metrics_bp',
    'docs_bp',
    'analytics_bp',
    'predictions_bp',
    'multimodal_bp',
    'observability_bp',
    'notifications_bp',  # PR #175
    'validation_bp',  # Educational validation
    'logging_bp',  # Cloud logging
    'cache_blueprint',
    'user_bp',
    'auth_bp',  # Novo sistema de autenticação JWT
    'swagger_ui_blueprint',
    'ALL_BLUEPRINTS'
]