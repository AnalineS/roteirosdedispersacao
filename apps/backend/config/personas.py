# -*- coding: utf-8 -*-
"""
Config Personas Module - Forwarding to services.ai.personas
Provides compatibility layer for config imports
"""

# Import from the main personas module
from services.ai.personas import get_personas

def get_persona_by_id(persona_id: str):
    """Get persona configuration by ID"""
    personas = get_personas()
    return personas.get(persona_id)

# Export main functions
__all__ = ['get_personas', 'get_persona_by_id']