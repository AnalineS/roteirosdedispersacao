# -*- coding: utf-8 -*-
"""
Secure Logging Module - OWASP A09:2021 Compliant

This module provides secure logging functionality that prevents sensitive data leakage
in compliance with:
- OWASP A09:2021 - Security Logging and Monitoring Failures
- CWE-312: Cleartext Storage of Sensitive Information
- CWE-359: Exposure of Private Information
- CWE-532: Information Exposure Through Log Files
"""

import logging
import re
from typing import Any, Dict, List, Optional, Union
from functools import wraps

# Sensitive data patterns that should never be logged
SENSITIVE_PATTERNS = [
    # Medical information
    r'\b(dosage|dose|dosagem|posologia)\b.*?:\s*[\d\.]+\s*\w+',
    r'\b(medication|medicamento|remédio|drug)\b.*?:\s*\w+',
    r'\b(diagnosis|diagnóstico|cid-?10)\b.*?:\s*\w+',
    r'\b(treatment|tratamento|therapy)\b.*?:\s*\w+',
    r'\b(patient|paciente)\b.*?:\s*\w+',
    
    # Personal identifiers
    r'\b(cpf|ssn)\b.*?:\s*[\d\.\-]+',
    r'\b(rg|id)\b.*?:\s*[\d\.\-]+',
    r'\b(email)\b.*?:\s*[\w\.\-]+@[\w\.\-]+',
    r'\b(phone|telefone|cel)\b.*?:\s*[\d\.\-\(\)\s]+',
    
    # Authentication & Security
    r'\b(password|senha|pwd)\b.*?:\s*\S+',
    r'\b(token|api[_\-]?key|secret)\b.*?:\s*\S+',
    r'\b(authorization|auth)\b.*?:\s*\S+',
]

# Fields that are safe to log (allowlist approach)
SAFE_LOG_FIELDS = {
    'request_id',
    'status',
    'method',
    'path',
    'timestamp',
    'duration',
    'status_code',
    'error_type',
    'persona_id',
    'model_used',
    'cache_hit',
    'processing_time',
    'medical_status',  # Only contains "healthy" or "degraded"
    'compliance_score',  # Numeric score without details
}


def sanitize_for_logging(data: Any, max_length: int = 100) -> str:
    """
    Sanitize data for safe logging by removing sensitive information.
    
    Args:
        data: The data to sanitize
        max_length: Maximum length of the returned string
        
    Returns:
        Sanitized string safe for logging
    """
    if data is None:
        return "None"
    
    # Convert to string
    data_str = str(data)
    
    # Check for sensitive patterns
    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, data_str, re.IGNORECASE):
            return "[REDACTED - Contains sensitive information]"
    
    # Truncate if too long
    if len(data_str) > max_length:
        return f"{data_str[:max_length]}... [truncated]"
    
    return data_str


def safe_log_dict(data: Dict[str, Any], allowed_fields: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Create a safe dictionary for logging by filtering to allowed fields only.
    
    Args:
        data: Dictionary to filter
        allowed_fields: List of fields that are safe to log
        
    Returns:
        Dictionary containing only safe fields
    """
    if allowed_fields is None:
        allowed_fields = list(SAFE_LOG_FIELDS)
    
    safe_dict = {}
    for key in allowed_fields:
        if key in data:
            value = data[key]
            # Recursively sanitize nested dictionaries
            if isinstance(value, dict):
                safe_dict[key] = safe_log_dict(value, allowed_fields)
            else:
                safe_dict[key] = sanitize_for_logging(value)
    
    return safe_dict


class SecureLogger:
    """
    A wrapper around the standard logger that automatically sanitizes sensitive data.
    """
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def _sanitize_message(self, msg: str, *args, **kwargs) -> tuple:
        """Sanitize the log message and its arguments."""
        # Sanitize the main message
        sanitized_msg = sanitize_for_logging(msg, max_length=500)
        
        # Sanitize positional arguments
        sanitized_args = tuple(sanitize_for_logging(arg) for arg in args)
        
        # Sanitize keyword arguments
        sanitized_kwargs = {k: sanitize_for_logging(v) for k, v in kwargs.items()}
        
        return sanitized_msg, sanitized_args, sanitized_kwargs
    
    def debug(self, msg: str, *args, **kwargs):
        """Log a debug message with sanitization."""
        sanitized_msg, sanitized_args, sanitized_kwargs = self._sanitize_message(msg, *args, **kwargs)
        self.logger.debug(sanitized_msg, *sanitized_args, **sanitized_kwargs)
    
    def info(self, msg: str, *args, **kwargs):
        """Log an info message with sanitization."""
        sanitized_msg, sanitized_args, sanitized_kwargs = self._sanitize_message(msg, *args, **kwargs)
        self.logger.info(sanitized_msg, *sanitized_args, **sanitized_kwargs)
    
    def warning(self, msg: str, *args, **kwargs):
        """Log a warning message with sanitization."""
        sanitized_msg, sanitized_args, sanitized_kwargs = self._sanitize_message(msg, *args, **kwargs)
        self.logger.warning(sanitized_msg, *sanitized_args, **sanitized_kwargs)
    
    def error(self, msg: str, *args, **kwargs):
        """Log an error message with sanitization."""
        sanitized_msg, sanitized_args, sanitized_kwargs = self._sanitize_message(msg, *args, **kwargs)
        self.logger.error(sanitized_msg, *sanitized_args, **sanitized_kwargs)
    
    def critical(self, msg: str, *args, **kwargs):
        """Log a critical message with sanitization."""
        sanitized_msg, sanitized_args, sanitized_kwargs = self._sanitize_message(msg, *args, **kwargs)
        self.logger.critical(sanitized_msg, *sanitized_args, **sanitized_kwargs)


def get_secure_logger(name: str) -> SecureLogger:
    """
    Get a secure logger instance for the given name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        SecureLogger instance
    """
    base_logger = logging.getLogger(name)
    return SecureLogger(base_logger)


def log_safely(logger: logging.Logger, level: str, message: str, data: Optional[Dict[str, Any]] = None):
    """
    Utility function to log messages safely with optional data.
    
    Args:
        logger: The logger instance
        level: Log level ('debug', 'info', 'warning', 'error')
        message: The log message
        data: Optional dictionary of data to include (will be sanitized)
    """
    if data:
        safe_data = safe_log_dict(data)
        log_message = f"{message} - Data: {safe_data}"
    else:
        log_message = message
    
    # Sanitize the entire message
    safe_message = sanitize_for_logging(log_message, max_length=1000)
    
    # Log at the appropriate level
    log_func = getattr(logger, level, logger.info)
    log_func(safe_message)


# Decorator for automatic secure logging
def secure_log(func):
    """
    Decorator to automatically add secure logging to a function.
    
    Usage:
        @secure_log
        def process_medical_data(patient_id, medication):
            # Function implementation
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        
        # Log function entry (without arguments to avoid leaking sensitive data)
        logger.debug(f"Entering function: {func.__name__}")
        
        try:
            result = func(*args, **kwargs)
            logger.debug(f"Function {func.__name__} completed successfully")
            return result
        except Exception as e:
            # Log error without sensitive details
            logger.error(f"Function {func.__name__} failed: {e.__class__.__name__}")
            raise
    
    return wrapper


# Examples and documentation
"""
Usage Examples:

1. Basic secure logging:
    from core.security.secure_logging import get_secure_logger
    
    logger = get_secure_logger(__name__)
    logger.info("Processing request", request_id="abc123")  # Safe
    logger.info(f"Patient data: {patient_info}")  # Will be sanitized

2. Logging with safe dictionary:
    from core.security.secure_logging import log_safely, safe_log_dict
    
    data = {
        "request_id": "abc123",
        "patient_name": "John Doe",  # Will be removed
        "status": "completed",
        "medication": "Dapsone 100mg"  # Will be removed
    }
    
    safe_data = safe_log_dict(data)
    logger.info(f"Request processed: {safe_data}")

3. Using the decorator:
    from core.security.secure_logging import secure_log
    
    @secure_log
    def process_prescription(patient_id, medication, dosage):
        # Function implementation
        return result

Security Guidelines:
- NEVER log: Patient names, IDs, medical conditions, medications, dosages
- NEVER log: Passwords, tokens, API keys, authentication headers
- ALWAYS log: Request IDs, status codes, timestamps, error types
- ALWAYS: Use the secure logging functions instead of direct logger calls
- ALWAYS: Review logs before production to ensure no sensitive data leaks
"""