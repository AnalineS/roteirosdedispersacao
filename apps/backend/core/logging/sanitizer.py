# -*- coding: utf-8 -*-
"""
Log Sanitization Utilities
==========================

Provides functions to sanitize user input before logging to prevent
log injection attacks (CWE-117).

Log injection occurs when attackers inject control characters like
newlines (\n, \r) to forge log entries or corrupt log files.

Usage:
    from core.logging.sanitizer import sanitize_log_input

    logger.info(f"User action: {sanitize_log_input(user_input)}")
"""

import re
from typing import Any, Optional


def sanitize_log_input(value: Any, max_length: int = 500) -> str:
    """
    Sanitize a value for safe logging by removing control characters.

    Prevents log injection attacks by:
    - Removing newlines and carriage returns
    - Escaping other control characters
    - Truncating long values
    - Converting to safe string representation

    Args:
        value: Any value to be logged
        max_length: Maximum length of output (default 500)

    Returns:
        Sanitized string safe for logging

    Example:
        >>> sanitize_log_input("normal text")
        'normal text'
        >>> sanitize_log_input("attack\\nforged entry")
        'attack\\\\nforged entry'
    """
    if value is None:
        return "<None>"

    # Convert to string
    try:
        str_value = str(value)
    except Exception:
        return "<unprintable>"

    # Replace control characters that could forge log entries
    sanitized = str_value.replace('\n', '\\n')
    sanitized = sanitized.replace('\r', '\\r')
    sanitized = sanitized.replace('\t', '\\t')

    # Remove other control characters (except printable ASCII and common UTF-8)
    # Keep chars >= 32 (space) and common unicode
    sanitized = re.sub(r'[\x00-\x1f\x7f]', '', sanitized)

    # Truncate if too long
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + "...[truncated]"

    return sanitized


def sanitize_ip(ip: Optional[str]) -> str:
    """
    Sanitize an IP address for logging.

    Args:
        ip: IP address string

    Returns:
        Sanitized IP or placeholder
    """
    if not ip:
        return "<no-ip>"

    # Basic IP format validation and sanitization
    sanitized = sanitize_log_input(ip, max_length=45)  # Max IPv6 length

    # Additional validation - only allow valid IP characters
    if not re.match(r'^[\d.:a-fA-F]+$', sanitized):
        return "<invalid-ip>"

    return sanitized


def sanitize_request_id(request_id: Optional[str]) -> str:
    """
    Sanitize a request ID for logging.

    Args:
        request_id: Request identifier

    Returns:
        Sanitized request ID
    """
    if not request_id:
        return "<no-request-id>"

    sanitized = sanitize_log_input(request_id, max_length=64)

    # Only allow alphanumeric and common ID characters
    if not re.match(r'^[\w\-]+$', sanitized):
        return f"<invalid-id:{sanitized[:8]}>"

    return sanitized


def sanitize_user_id(user_id: Optional[str]) -> str:
    """
    Sanitize a user ID for logging.

    Args:
        user_id: User identifier

    Returns:
        Sanitized user ID
    """
    if not user_id:
        return "<anonymous>"

    sanitized = sanitize_log_input(user_id, max_length=128)
    return sanitized


def sanitize_path(path: Optional[str]) -> str:
    """
    Sanitize a file/URL path for logging.

    Args:
        path: Path string

    Returns:
        Sanitized path
    """
    if not path:
        return "<no-path>"

    sanitized = sanitize_log_input(path, max_length=256)
    return sanitized


def sanitize_error(error: Optional[Exception]) -> str:
    """
    Sanitize an error message for logging.

    Args:
        error: Exception object

    Returns:
        Sanitized error message
    """
    if error is None:
        return "<no-error>"

    try:
        error_type = type(error).__name__
        error_msg = str(error)
        sanitized_msg = sanitize_log_input(error_msg, max_length=200)
        return f"{error_type}: {sanitized_msg}"
    except Exception:
        return "<error-formatting-failed>"


# Aliases for convenience
sanitize = sanitize_log_input
safe_log = sanitize_log_input
