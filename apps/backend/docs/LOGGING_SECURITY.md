# Logging Security Guidelines

## Overview

This document outlines the security practices for logging in the Roteiro de Dispensação application to prevent sensitive data exposure through log files, in compliance with security standards.

## Compliance Standards

Our logging practices comply with:
- **OWASP A09:2021** - Security Logging and Monitoring Failures
- **CWE-312** - Cleartext Storage of Sensitive Information
- **CWE-359** - Exposure of Private Personal Information
- **CWE-532** - Information Exposure Through Log Files
- **LGPD** - Brazilian General Data Protection Law

## What Should NEVER Be Logged

### Medical Information
- Patient names or identifiers
- Medical diagnoses or conditions
- Medication names and dosages
- Treatment plans or prescriptions
- Medical history or test results
- Any health-related personal data

### Personal Identifiable Information (PII)
- CPF, RG, or other government IDs
- Full names
- Email addresses
- Phone numbers
- Physical addresses
- Birth dates

### Authentication & Security Data
- Passwords (hashed or plain)
- API keys or tokens
- Session identifiers
- Authentication headers
- Security questions/answers

## What CAN Be Logged Safely

### Operational Metadata
- Request IDs (UUIDs)
- HTTP status codes
- Request methods and paths (without query parameters)
- Timestamps
- Processing duration
- Cache hit/miss status
- System health status ("healthy", "degraded", "critical")

### Application State
- Persona IDs (e.g., "gasnelio", "ga")
- Model names used (e.g., "llama-3.2")
- Feature flags status
- Error types (without sensitive details)
- Compliance scores (numeric only)

## Implementation

### Using the Secure Logging Module

```python
from core.security.secure_logging import get_secure_logger, log_safely, safe_log_dict

# Get a secure logger instance
logger = get_secure_logger(__name__)

# Safe logging examples
logger.info(f"Request processed - ID: {request_id}, Status: {status}")

# Logging with data dictionary (automatically sanitized)
data = {
    "request_id": "abc-123",
    "status": "success",
    "patient_data": {...}  # Will be filtered out
}
safe_data = safe_log_dict(data)
logger.info(f"Operation completed: {safe_data}")
```

### Code Examples

#### ✅ GOOD - Safe Logging
```python
# Only log non-sensitive metadata
logger.info(f"Medical check completed - Status: {status}, Request ID: {request_id}")

# Log counts instead of content
logger.info(f"Knowledge base loaded: {len(chunks)} chunks")

# Use generic error messages
logger.error(f"Authentication failed for request: {request_id}")
```

#### ❌ BAD - Unsafe Logging
```python
# Never log medical data
logger.info(f"Patient {name} prescribed {medication} at {dosage}")

# Never log authentication data
logger.debug(f"User login: email={email}, password={password}")

# Never log full request/response bodies
logger.info(f"Request body: {request.json}")
```

## Security Checklist

Before committing code with logging statements:

- [ ] Review all log statements for sensitive data
- [ ] Use request IDs instead of user identifiers
- [ ] Log operation status, not operation data
- [ ] Use the secure logging module for automatic sanitization
- [ ] Test logs in development to verify no data leakage
- [ ] Configure appropriate log levels for production

## Log Levels Guidelines

### DEBUG
- Development only
- May contain more detailed information
- Should still avoid sensitive data
- Disabled in production

### INFO
- General operational information
- Request/response status
- System health updates
- Performance metrics

### WARNING
- Potential issues that don't prevent operation
- Rate limit approaching
- Deprecated feature usage
- Invalid input (without showing the input)

### ERROR
- Operation failures
- System errors
- Integration failures
- Always include request ID for correlation

### CRITICAL
- System-wide failures
- Security breaches (without details)
- Data corruption risks
- Service unavailability

## Monitoring Without Compromising Security

### Effective Monitoring Strategies

1. **Use Correlation IDs**: Track requests across services without exposing user data
2. **Aggregate Metrics**: Log counts and statistics instead of individual records
3. **Status Codes**: Use standardized codes instead of detailed error messages
4. **Time-based Analysis**: Focus on patterns and trends rather than specific transactions

### Security Event Logging

When logging security events:
```python
# Good: Log the event type and metadata
logger.warning(f"Multiple failed login attempts - Request ID: {request_id}, Count: {attempt_count}")

# Bad: Don't log the actual attempts
logger.warning(f"Failed login attempts for user {email} with passwords {attempts}")
```

## Testing Logging Security

### Manual Review
1. Search logs for patterns: CPF, email, medication names
2. Review all WARNING and ERROR logs for data leakage
3. Verify DEBUG logs are not present in production

### Automated Testing
```python
def test_no_sensitive_data_in_logs(caplog):
    """Test that sensitive data is not logged"""
    
    # Simulate operation with sensitive data
    process_medical_data(patient_cpf="123.456.789-00", 
                         medication="Dapsone",
                         dosage="100mg")
    
    # Check logs don't contain sensitive patterns
    log_text = caplog.text.lower()
    assert "123.456.789" not in log_text
    assert "dapsone" not in log_text
    assert "100mg" not in log_text
    assert "request_id" in log_text  # Should have safe metadata
```

## Incident Response

If sensitive data is accidentally logged:

1. **Immediate Action**:
   - Identify affected log files
   - Rotate logs immediately
   - Archive and secure affected logs

2. **Remediation**:
   - Fix the logging code
   - Deploy the fix urgently
   - Scan historical logs for similar issues

3. **Prevention**:
   - Add the pattern to secure logging filters
   - Update this documentation
   - Add automated tests

## Tools and Resources

### Static Analysis
- **CodeQL**: Detects cleartext logging of sensitive data
- **Bandit**: Python security linter
- **Custom grep patterns**: Search for sensitive patterns in code

### Runtime Protection
- **Secure Logging Module**: `core.security.secure_logging`
- **Log Sanitization**: Automatic filtering of sensitive patterns
- **Structured Logging**: Use JSON format with explicit field selection

## References

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-532: Information Exposure Through Log Files](https://cwe.mitre.org/data/definitions/532.html)
- [NIST SP 800-92: Guide to Computer Security Log Management](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf)

---

**Last Updated**: 2025-01-19
**Review Schedule**: Quarterly
**Owner**: Security Team