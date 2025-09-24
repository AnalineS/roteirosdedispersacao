# -*- coding: utf-8 -*-
"""
Flask Blueprints - Consolidated Architecture
Strategic consolidation from 20→8 blueprints for maintainability
Organized by domain responsibility and functional cohesion
"""

# === CONSOLIDATED 8-BLUEPRINT ARCHITECTURE ===
# Strategic consolidation preserving 100% functionality

# 1. CORE: Chat + Personas + Health (core medical functionality)
from .core_blueprint import core_bp

# 2. USER: User + Auth + Profiles (complete user management)
from .user_blueprint import user_bp

# 3. ANALYTICS: Analytics + Metrics + Monitoring + Observability (telemetry)
from .analytics_blueprint_consolidated import analytics_bp

# 4. ENGAGEMENT: Gamification + Notifications + Feedback (user engagement)
from .engagement_blueprint import engagement_bp

# 5. VALIDATION: Medical validation + QA framework (compliance)
from .validation_blueprint import validation_bp

# 6. MULTIMODAL: Image/document processing (specialized)
from .multimodal_blueprint import multimodal_bp

# 7. CACHE: Critical performance layer (specialized)
from .cache_blueprint import cache_blueprint

# 8. DOCS: API documentation + Swagger (development support)
from .docs_blueprint import docs_bp

# === LEGACY SUPPORT & OPTIONAL SYSTEMS ===
# Maintained for transition period and specialized needs
from .memory_blueprint import memory_bp
from .logging_blueprint import logging_bp
from core.openapi.spec import swagger_ui_blueprint

# === CONSOLIDATED BLUEPRINT REGISTRY ===
# Strategic 8-blueprint architecture for production
ALL_BLUEPRINTS = [
    # Core 8 consolidated blueprints
    core_bp,              # 1. Chat + Personas + Health (50+ endpoints)
    user_bp,              # 2. User + Auth + Profiles (complete user lifecycle)
    analytics_bp,         # 3. Analytics + Metrics + Monitoring + Observability
    engagement_bp,        # 4. Gamification + Notifications + Feedback
    validation_bp,        # 5. Medical validation + QA framework
    multimodal_bp,        # 6. Image/document processing (specialized)
    cache_blueprint,      # 7. Critical performance layer
    docs_bp,              # 8. API documentation + Swagger

    # Legacy and specialized systems
    memory_bp,            # Memory optimization system
    logging_bp,           # LGPD-compliant logging
    swagger_ui_blueprint  # OpenAPI documentation UI
]

# === EXPORT INTERFACE ===
# Public API for consolidated blueprint architecture
__all__ = [
    # Core 8 consolidated blueprints
    'core_bp',              # Consolidates: chat_bp + personas_bp + health_bp
    'user_bp',              # Consolidates: user_bp + auth_bp + user_profiles_blueprint
    'analytics_bp',         # Consolidates: analytics_bp + metrics_bp + monitoring_bp + observability_bp
    'engagement_bp',        # Consolidates: gamification_bp + notifications_bp + feedback_bp
    'validation_bp',        # Medical validation + QA framework
    'multimodal_bp',        # Image/document processing (specialized)
    'cache_blueprint',      # Critical performance layer
    'docs_bp',              # API documentation + Swagger

    # Legacy and specialized systems
    'memory_bp',            # Memory optimization system
    'logging_bp',           # LGPD-compliant logging
    'swagger_ui_blueprint', # OpenAPI documentation UI

    # Blueprint registry
    'ALL_BLUEPRINTS'
]