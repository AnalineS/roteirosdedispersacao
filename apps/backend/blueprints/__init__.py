# -*- coding: utf-8 -*-
"""
Flask Blueprints - Final 8-Blueprint Architecture
Strategic consolidation: 20→8 blueprints for optimal maintainability
"""

# === FINAL 8-BLUEPRINT ARCHITECTURE ===

# 1. MEDICAL_CORE: Core medical functionality + validation
from .medical_core_blueprint import medical_core_bp

# 2. USER_MANAGEMENT: Complete user lifecycle + authentication + profiles
from .user_management_blueprint import user_management_bp

# 3. ANALYTICS_OBSERVABILITY: All telemetry + monitoring + logging
from .analytics_observability_blueprint import analytics_observability_bp

# 4. ENGAGEMENT_MULTIMODAL: User interaction + media processing
from .engagement_multimodal_blueprint import engagement_multimodal_bp

# 5. INFRASTRUCTURE: System infrastructure + performance optimization
from .infrastructure_blueprint import infrastructure_bp

# 6. API_DOCUMENTATION: API interface + documentation + OpenAPI
from .api_documentation_blueprint import api_documentation_bp

# 7. AUTHENTICATION: Security + gamification + user motivation
from .authentication_blueprint import authentication_bp

# 8. COMMUNICATION: User communication + feedback + notifications
from .communication_blueprint import communication_bp

# === FINAL BLUEPRINT REGISTRY ===
ALL_BLUEPRINTS = [
    medical_core_bp,              # 1. Core medical functionality + validation
    user_management_bp,           # 2. Complete user lifecycle management
    analytics_observability_bp,   # 3. All telemetry and monitoring
    engagement_multimodal_bp,     # 4. User interaction + media processing
    infrastructure_bp,            # 5. System infrastructure + performance
    api_documentation_bp,         # 6. API interface + documentation
    authentication_bp,            # 7. Security + gamification
    communication_bp              # 8. User communication + feedback
]

# === EXPORT INTERFACE ===
__all__ = [
    'medical_core_bp',
    'user_management_bp',
    'analytics_observability_bp',
    'engagement_multimodal_bp',
    'infrastructure_bp',
    'api_documentation_bp',
    'authentication_bp',
    'communication_bp',
    'ALL_BLUEPRINTS'
]
