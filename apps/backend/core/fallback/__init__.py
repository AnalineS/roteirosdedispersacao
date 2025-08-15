# -*- coding: utf-8 -*-
"""
Core Fallback System - Sistema de Fallback Inteligente
Garante compatibilidade 100% da API mesmo quando dependências falham
"""

from .intelligent_fallback import create_intelligent_fallback_blueprints, fallback_system

__all__ = ['create_intelligent_fallback_blueprints', 'fallback_system']