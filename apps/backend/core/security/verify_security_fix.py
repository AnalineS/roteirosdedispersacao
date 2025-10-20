#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Security Fix Verification Script
=================================

Comprehensive verification that the predictable salt vulnerability
has been completely fixed and no security regressions exist.

Usage:
    python verify_security_fix.py

Returns:
    Exit code 0 if all checks pass
    Exit code 1 if any security issues found

Author: Security Framework - Roteiro de Dispensação
Date: 2025-01-27
"""

import os
import sys
import base64
import subprocess
from pathlib import Path
from typing import List, Tuple, Dict

# ANSI colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'


class SecurityVerifier:
    """Verifies security fix is complete and correct"""

    def __init__(self):
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = 0
        self.project_root = Path(__file__).parent.parent.parent

    def print_header(self, title: str):
        """Print section header"""
        print(f"\n{BLUE}{BOLD}{'=' * 70}{RESET}")
        print(f"{BLUE}{BOLD}{title:^70}{RESET}")
        print(f"{BLUE}{BOLD}{'=' * 70}{RESET}\n")

    def print_check(self, name: str, passed: bool, details: str = ""):
        """Print check result"""
        status = f"{GREEN}[PASS]{RESET}" if passed else f"{RED}[FAIL]{RESET}"
        print(f"{status} {name}")
        if details:
            print(f"      {details}")

        if passed:
            self.checks_passed += 1
        else:
            self.checks_failed += 1

    def print_warning(self, message: str):
        """Print warning message"""
        print(f"{YELLOW}[WARNING]{RESET} {message}")
        self.warnings += 1

    def check_no_hardcoded_salt(self) -> bool:
        """Verify no hardcoded salt in production code"""
        vulnerable_salt = b'roteiro_dispensacao_salt_2025'

        # Check secrets_manager.py
        secrets_file = self.project_root / 'core/security/secrets_manager.py'
        if not secrets_file.exists():
            self.print_warning(f"secrets_manager.py not found at {secrets_file}")
            return False

        with open(secrets_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for vulnerable salt
        if 'roteiro_dispensacao_salt_2025' in content:
            return False

        # Check for any hardcoded salt patterns
        import re
        hardcoded_patterns = [
            r"salt\s*=\s*b['\"](?!.*urandom)[^'\"]+['\"]",  # salt = b'...' but not urandom
        ]

        for pattern in hardcoded_patterns:
            if re.search(pattern, content):
                return False

        return True

    def check_uses_urandom(self) -> bool:
        """Verify os.urandom() is used for salt generation"""
        secrets_file = self.project_root / 'core/security/secrets_manager.py'

        with open(secrets_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Should use os.urandom(32)
        return 'os.urandom(32)' in content

    def check_salt_in_encrypted_format(self) -> bool:
        """Verify encrypted data format includes salt"""
        secrets_file = self.project_root / 'core/security/secrets_manager.py'

        with open(secrets_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Should prepend salt to encrypted data
        required_patterns = [
            'salt_and_encrypted = salt + encrypted',  # Encryption
            'salt = salt_and_encrypted[:32]',  # Decryption - extract salt
        ]

        return all(pattern in content for pattern in required_patterns)

    def check_tests_exist_and_pass(self) -> bool:
        """Verify security tests exist and pass"""
        test_file = self.project_root / 'tests/test_secrets_security_fix.py'

        if not test_file.exists():
            return False

        # Run tests
        try:
            result = subprocess.run(
                ['python', '-m', 'pytest', str(test_file), '-v'],
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=30
            )

            return result.returncode == 0
        except Exception as e:
            self.print_warning(f"Could not run tests: {e}")
            return False

    def check_migration_utility_exists(self) -> bool:
        """Verify migration utility exists"""
        migration_file = self.project_root / 'core/security/migrate_secrets.py'
        return migration_file.exists()

    def check_documentation_complete(self) -> bool:
        """Verify documentation is complete"""
        # Find claudedocs directory (should be in project root)
        claudedocs = self.project_root.parent.parent / 'claudedocs'

        docs_to_check = [
            claudedocs / 'SECURITY_FIX_SALT_VULNERABILITY.md',
            claudedocs / 'SECURITY_FIX_SUMMARY.md',
        ]

        return all(doc.exists() for doc in docs_to_check)

    def check_encryption_functional(self) -> bool:
        """Verify encryption/decryption works correctly"""
        try:
            import sys
            sys.path.insert(0, str(self.project_root))
            from core.security.secrets_manager import SecretEncryption

            encryption = SecretEncryption(master_key="test_verification_key")

            # Test encryption/decryption
            test_data = "verification_test_data_12345"
            encrypted = encryption.encrypt(test_data)
            decrypted = encryption.decrypt(encrypted)

            if decrypted != test_data:
                return False

            # Verify different ciphertexts for same data
            encrypted2 = encryption.encrypt(test_data)
            if encrypted == encrypted2:
                # Same ciphertext = same salt = VULNERABILITY
                return False

            # Verify salt is 32 bytes
            decoded = base64.urlsafe_b64decode(encrypted.encode())
            if len(decoded) <= 32:
                return False

            salt = decoded[:32]
            if len(salt) != 32:
                return False

            return True

        except Exception as e:
            self.print_warning(f"Encryption test failed: {e}")
            return False

    def run_all_checks(self) -> bool:
        """Run all security verification checks"""
        self.print_header("SECURITY FIX VERIFICATION")

        print(f"{BOLD}Verifying fix for CWE-327: Predictable Salt Vulnerability{RESET}\n")

        # Check 1: No hardcoded salt
        self.print_header("1. Code Analysis")
        passed = self.check_no_hardcoded_salt()
        self.print_check(
            "No hardcoded salt in production code",
            passed,
            "Verified secrets_manager.py contains no predictable salt"
        )

        # Check 2: Uses os.urandom
        passed = self.check_uses_urandom()
        self.print_check(
            "Uses cryptographically secure random (os.urandom)",
            passed,
            "Verified salt generation uses os.urandom(32)"
        )

        # Check 3: Salt in format
        passed = self.check_salt_in_encrypted_format()
        self.print_check(
            "Salt stored with encrypted data",
            passed,
            "Verified salt is prepended to encrypted data"
        )

        # Check 4: Functional test
        self.print_header("2. Functional Verification")
        passed = self.check_encryption_functional()
        self.print_check(
            "Encryption/decryption works correctly",
            passed,
            "Verified unique salts and round-trip integrity"
        )

        # Check 5: Tests exist and pass
        self.print_header("3. Test Coverage")
        passed = self.check_tests_exist_and_pass()
        self.print_check(
            "Security test suite exists and passes",
            passed,
            "Verified test_secrets_security_fix.py passes all checks"
        )

        # Check 6: Migration utility
        self.print_header("4. Migration Support")
        passed = self.check_migration_utility_exists()
        self.print_check(
            "Migration utility available",
            passed,
            "Verified migrate_secrets.py exists for data migration"
        )

        # Check 7: Documentation
        self.print_header("5. Documentation")
        passed = self.check_documentation_complete()
        self.print_check(
            "Security documentation complete",
            passed,
            "Verified all security fix documentation exists"
        )

        # Final summary
        self.print_header("VERIFICATION SUMMARY")
        print(f"{GREEN}{BOLD}Checks Passed: {self.checks_passed}{RESET}")
        print(f"{RED}{BOLD}Checks Failed: {self.checks_failed}{RESET}")
        print(f"{YELLOW}{BOLD}Warnings: {self.warnings}{RESET}")

        if self.checks_failed == 0:
            print(f"\n{GREEN}{BOLD}{'=' * 70}{RESET}")
            print(f"{GREEN}{BOLD}[SUCCESS] SECURITY FIX VERIFIED - ALL CHECKS PASSED{RESET}")
            print(f"{GREEN}{BOLD}{'=' * 70}{RESET}\n")
            return True
        else:
            print(f"\n{RED}{BOLD}{'=' * 70}{RESET}")
            print(f"{RED}{BOLD}[FAILED] SECURITY ISSUES FOUND - FIX REQUIRED{RESET}")
            print(f"{RED}{BOLD}{'=' * 70}{RESET}\n")
            return False


def main():
    """Main entry point"""
    verifier = SecurityVerifier()
    success = verifier.run_all_checks()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
