# -*- coding: utf-8 -*-
"""
OpenAPI/Swagger Documentation System
"""

from .spec import OpenAPISpec, swagger_ui_blueprint
from .auth import swagger_auth_required

__all__ = ['OpenAPISpec', 'swagger_ui_blueprint', 'swagger_auth_required']