"""
Validation utilities for blueprints
Fallback implementation for missing validation module
"""

import re
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

def validate_email(email: str) -> bool:
    """
    Validate email format
    """
    if not email or not isinstance(email, str):
        return False

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Optional[str]:
    """
    Validate that all required fields are present in data
    Returns error message if validation fails, None if successful
    """
    if not isinstance(data, dict):
        return "Data must be a dictionary"

    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == "":
            missing_fields.append(field)

    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"

    return None

def validate_string_length(value: str, min_length: int = 0, max_length: int = None) -> bool:
    """
    Validate string length
    """
    if not isinstance(value, str):
        return False

    if len(value) < min_length:
        return False

    if max_length is not None and len(value) > max_length:
        return False

    return True

def sanitize_input(value: str) -> str:
    """
    Basic input sanitization
    """
    if not isinstance(value, str):
        return str(value)

    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>&"\'\\]', '', value)
    return sanitized.strip()

def validate_json_structure(data: Dict[str, Any], schema: Dict[str, type]) -> Optional[str]:
    """
    Validate JSON data against a simple schema
    """
    for field, expected_type in schema.items():
        if field in data:
            if not isinstance(data[field], expected_type):
                return f"Field '{field}' must be of type {expected_type.__name__}"

    return None