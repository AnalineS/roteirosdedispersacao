# -*- coding: utf-8 -*-
"""
LGPD Compliance Module
Data protection and deletion services
"""

from .data_deletion_service import (
    DeletionResult,
    get_deletion_service
)

__all__ = [
    'DeletionResult',
    'get_deletion_service'
]
