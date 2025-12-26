# -*- coding: utf-8 -*-
"""
Flask Blueprints para modularização do backend
Organização por domínio de responsabilidade
Atualizado para refletir a consolidação de blueprints
"""

# Core blueprints (sempre disponíveis)
from .personas_blueprint import personas_bp
from .feedback_blueprint import feedback_bp
from .monitoring_blueprint import monitoring_bp
from .docs_blueprint import docs_bp
from .observability import observability_bp

# Medical and educational core
try:
    from .medical_core_blueprint import medical_core_bp
    MEDICAL_CORE_AVAILABLE = True
except ImportError:
    MEDICAL_CORE_AVAILABLE = False
    medical_core_bp = None

# Communication (consolidação do antigo chat_blueprint)
try:
    from .communication_blueprint import communication_bp
    COMMUNICATION_AVAILABLE = True
except ImportError:
    COMMUNICATION_AVAILABLE = False
    communication_bp = None

# Analytics (consolidação do antigo analytics_blueprint)
try:
    from .analytics_observability_blueprint import analytics_observability_bp
    ANALYTICS_OBSERVABILITY_AVAILABLE = True
except ImportError:
    ANALYTICS_OBSERVABILITY_AVAILABLE = False
    analytics_observability_bp = None

# Engagement and multimodal (consolidação do antigo multimodal_blueprint)
try:
    from .engagement_multimodal_blueprint import engagement_multimodal_bp
    ENGAGEMENT_MULTIMODAL_AVAILABLE = True
except ImportError:
    ENGAGEMENT_MULTIMODAL_AVAILABLE = False
    engagement_multimodal_bp = None

# GA4 Integration
try:
    from .ga4_integration_blueprint import ga4_integration_bp
    GA4_INTEGRATION_AVAILABLE = True
except ImportError:
    GA4_INTEGRATION_AVAILABLE = False
    ga4_integration_bp = None

# Alerts system
try:
    from .alerts_blueprint import alerts_bp
    ALERTS_AVAILABLE = True
except ImportError:
    ALERTS_AVAILABLE = False
    alerts_bp = None

# Authentication
try:
    from .authentication_blueprint import authentication_bp
    AUTHENTICATION_AVAILABLE = True
except ImportError:
    AUTHENTICATION_AVAILABLE = False
    authentication_bp = None

# API Documentation
try:
    from .api_documentation_blueprint import api_documentation_bp
    API_DOCUMENTATION_AVAILABLE = True
except ImportError:
    API_DOCUMENTATION_AVAILABLE = False
    api_documentation_bp = None

# Infrastructure
try:
    from .infrastructure_blueprint import infrastructure_bp
    INFRASTRUCTURE_AVAILABLE = True
except ImportError:
    INFRASTRUCTURE_AVAILABLE = False
    infrastructure_bp = None

# Logging
try:
    from .logging_blueprint import logging_bp
    LOGGING_AVAILABLE = True
except ImportError:
    LOGGING_AVAILABLE = False
    logging_bp = None

# User management (consolidação do antigo user_blueprint)
try:
    from .user_management_blueprint import user_management_bp
    USER_MANAGEMENT_AVAILABLE = True
except ImportError:
    USER_MANAGEMENT_AVAILABLE = False
    user_management_bp = None

# Swagger UI blueprint
try:
    from core.openapi.spec import swagger_ui_blueprint
    SWAGGER_AVAILABLE = True
except ImportError:
    SWAGGER_AVAILABLE = False
    swagger_ui_blueprint = None

# Lista de todos os blueprints para registro
# Incluindo apenas blueprints essenciais que sempre existem
ALL_BLUEPRINTS = [
    personas_bp,
    feedback_bp,
    monitoring_bp,
    docs_bp,
    observability_bp
]

# Adicionar blueprints opcionais se disponíveis
if MEDICAL_CORE_AVAILABLE and medical_core_bp:
    ALL_BLUEPRINTS.append(medical_core_bp)

if COMMUNICATION_AVAILABLE and communication_bp:
    ALL_BLUEPRINTS.append(communication_bp)

if ANALYTICS_OBSERVABILITY_AVAILABLE and analytics_observability_bp:
    ALL_BLUEPRINTS.append(analytics_observability_bp)

if ENGAGEMENT_MULTIMODAL_AVAILABLE and engagement_multimodal_bp:
    ALL_BLUEPRINTS.append(engagement_multimodal_bp)

if GA4_INTEGRATION_AVAILABLE and ga4_integration_bp:
    ALL_BLUEPRINTS.append(ga4_integration_bp)

if ALERTS_AVAILABLE and alerts_bp:
    ALL_BLUEPRINTS.append(alerts_bp)

if AUTHENTICATION_AVAILABLE and authentication_bp:
    ALL_BLUEPRINTS.append(authentication_bp)

if API_DOCUMENTATION_AVAILABLE and api_documentation_bp:
    ALL_BLUEPRINTS.append(api_documentation_bp)

if INFRASTRUCTURE_AVAILABLE and infrastructure_bp:
    ALL_BLUEPRINTS.append(infrastructure_bp)

if LOGGING_AVAILABLE and logging_bp:
    ALL_BLUEPRINTS.append(logging_bp)

if USER_MANAGEMENT_AVAILABLE and user_management_bp:
    ALL_BLUEPRINTS.append(user_management_bp)

if SWAGGER_AVAILABLE and swagger_ui_blueprint:
    ALL_BLUEPRINTS.append(swagger_ui_blueprint)

__all__ = [
    'personas_bp',
    'feedback_bp',
    'monitoring_bp',
    'docs_bp',
    'observability_bp',
    'medical_core_bp',
    'communication_bp',
    'analytics_observability_bp',
    'engagement_multimodal_bp',
    'ga4_integration_bp',
    'alerts_bp',
    'authentication_bp',
    'api_documentation_bp',
    'infrastructure_bp',
    'logging_bp',
    'user_management_bp',
    'swagger_ui_blueprint',
    'ALL_BLUEPRINTS'
]
