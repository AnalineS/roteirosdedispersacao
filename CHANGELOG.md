# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security
- Removed one-time migration utility for legacy secrets (`migrate_secrets.py`)
  - Migration from fixed salt to secure per-secret random salt completed successfully on 2025-01-27
  - Hardcoded salt removed from codebase (CWE-327, python:S2053 compliance)
  - Secure system (`secrets_manager.py`) fully operational with `os.urandom(32)` salt generation
  - All security tests passing (15/15 tests in `test_secrets_security_fix.py`)
  - Aligns with OWASP, NIST, and LGPD/HIPAA best practices for medical data

