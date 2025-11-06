# -*- coding: utf-8 -*-
"""
Security Tests for Secure Logging Module
Tests for log injection and stack trace exposure prevention
"""

import pytest
from core.security.secure_logging import (
    sanitize_for_logging,
    get_safe_error_message,
    log_error_safely,
)


def test_sanitize_for_logging_removes_newlines():
    """Test that newlines are removed to prevent log injection"""
    malicious_input = "Normal text\nINJECTED LOG ENTRY"
    result = sanitize_for_logging(malicious_input)
    assert '\n' not in result
    assert '\r' not in result


def test_sanitize_for_logging_redacts_sensitive_data():
    """Test that sensitive patterns are redacted"""
    # CPF pattern
    cpf_input = "User CPF: 123.456.789-00"
    result = sanitize_for_logging(cpf_input)
    assert '[REDACTED]' in result or '123.456.789-00' not in result

    # Password pattern
    pwd_input = "password=secret123"
    result = sanitize_for_logging(pwd_input)
    assert '[REDACTED]' in result or 'secret123' not in result


def test_sanitize_for_logging_truncates_long_strings():
    """Test that long strings are truncated"""
    long_string = "A" * 500
    result = sanitize_for_logging(long_string, max_length=200)
    assert len(result) <= 203  # 200 + "..."


def test_get_safe_error_message_hides_stack_traces():
    """Test that exception messages don't expose stack traces"""
    try:
        raise ValueError("Test error with sensitive data: password=secret")
    except ValueError as e:
        safe_msg = get_safe_error_message(e)

        # Should include error type
        assert 'ValueError' in safe_msg

        # Should not expose full exception message with sensitive data
        assert 'password' not in safe_msg.lower() or '[REDACTED]' in safe_msg


def test_get_safe_error_message_common_errors():
    """Test that common errors get generic messages"""
    test_cases = [
        (ValueError("test"), "ValueError"),
        (KeyError("test"), "KeyError"),
        (TypeError("test"), "TypeError"),
    ]

    for exception, expected_type in test_cases:
        safe_msg = get_safe_error_message(exception)
        assert expected_type in safe_msg


def test_sanitize_for_logging_handles_none():
    """Test that None values are handled correctly"""
    result = sanitize_for_logging(None)
    assert result == "None"


def test_sanitize_for_logging_escapes_percent():
    """Test that percent signs are escaped to prevent format string issues"""
    input_with_percent = "Value: 100%"
    result = sanitize_for_logging(input_with_percent)
    assert '%%' in result or '%' not in result


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
