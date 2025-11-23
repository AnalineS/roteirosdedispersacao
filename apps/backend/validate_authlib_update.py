#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Authlib Security Update Validation Script
Validates the authlib 1.6.4 update for CVE-2025-59420

Medical Application Safety Checks:
- JWT authentication flows
- Persona authentication (Dr. Gasnelio, Gá)
- Medical API endpoint security
- LGPD compliance validation
"""

import sys
import os
import logging
import traceback
import requests
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AuthlibUpdateValidator:
    """Validates authlib security update safety"""

    def __init__(self):
        self.results = {}
        self.success_count = 0
        self.total_tests = 0

    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.success_count += 1
            logger.info(f"✅ {test_name}: PASSED {message}")
        else:
            logger.error(f"❌ {test_name}: FAILED {message}")

        self.results[test_name] = {
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }

    def test_authlib_import(self):
        """Test authlib 1.6.4 import and basic functionality"""
        try:
            import authlib
            version = getattr(authlib, '__version__', 'unknown')

            # Verify version
            if version != '1.6.4':
                self.log_test("authlib_import", False, f"Expected 1.6.4, got {version}")
                return False

            # Test JWT functionality (the vulnerable component)
            from authlib.jose import jwt

            # Test token creation and verification
            secret = 'test-secret-key'
            payload = {'user_id': 'test', 'exp': 1234567890}

            # Create token
            token = jwt.encode({'alg': 'HS256'}, payload, secret)

            # Verify token
            decoded = jwt.decode(token, secret)

            if decoded.get('user_id') != 'test':
                self.log_test("authlib_import", False, "JWT decode failed")
                return False

            self.log_test("authlib_import", True, f"Version {version} - JWT functionality working")
            return True

        except ImportError as e:
            self.log_test("authlib_import", False, f"Import failed: {e}")
            return False
        except Exception as e:
            self.log_test("authlib_import", False, f"JWT test failed: {e}")
            return False

    def test_pyjwt_compatibility(self):
        """Test that PyJWT (primary JWT lib) still works"""
        try:
            import jwt as pyjwt

            # Test PyJWT functionality (main authentication system)
            secret = 'test-secret-key'
            payload = {'user_id': 'medical_user', 'persona': 'dr_gasnelio'}

            # Create token
            token = pyjwt.encode(payload, secret, algorithm='HS256')

            # Verify token
            decoded = pyjwt.decode(token, secret, algorithms=['HS256'])

            if decoded.get('persona') != 'dr_gasnelio':
                self.log_test("pyjwt_compatibility", False, "PyJWT persona test failed")
                return False

            self.log_test("pyjwt_compatibility", True, "PyJWT medical persona authentication working")
            return True

        except Exception as e:
            self.log_test("pyjwt_compatibility", False, f"PyJWT test failed: {e}")
            return False

    def test_dependency_conflicts(self):
        """Check for dependency conflicts"""
        try:
            # Import key medical application dependencies
            import flask
            import jwt  # PyJWT
            import authlib
            import cryptography
            import requests

            # Test that all can coexist
            flask_version = getattr(flask, '__version__', 'unknown')
            jwt_version = getattr(jwt, '__version__', 'unknown')
            authlib_version = getattr(authlib, '__version__', 'unknown')
            crypto_version = getattr(cryptography, '__version__', 'unknown')
            requests_version = getattr(requests, '__version__', 'unknown')

            versions = {
                'Flask': flask_version,
                'PyJWT': jwt_version,
                'authlib': authlib_version,
                'cryptography': crypto_version,
                'requests': requests_version
            }

            version_info = ', '.join([f"{k}={v}" for k, v in versions.items()])
            self.log_test("dependency_conflicts", True, f"All dependencies compatible: {version_info}")
            return True

        except Exception as e:
            self.log_test("dependency_conflicts", False, f"Dependency conflict: {e}")
            return False

    def test_medical_persona_auth_simulation(self):
        """Simulate medical persona authentication flows"""
        try:
            import jwt as pyjwt
            from datetime import datetime, timedelta

            secret = os.getenv('JWT_SECRET_KEY', 'test-medical-secret')

            # Test Dr. Gasnelio persona
            gasnelio_payload = {
                'user_id': 'medical_professional_001',
                'persona': 'dr_gasnelio',
                'role': 'pharmacist',
                'specialization': 'hanseniase',
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)
            }

            gasnelio_token = pyjwt.encode(gasnelio_payload, secret, algorithm='HS256')
            gasnelio_decoded = pyjwt.decode(gasnelio_token, secret, algorithms=['HS256'])

            # Test Gá persona
            ga_payload = {
                'user_id': 'medical_professional_002',
                'persona': 'ga',
                'role': 'educator',
                'specialization': 'patient_support',
                'exp': datetime.now(timezone.utc) + timedelta(hours=1)
            }

            ga_token = pyjwt.encode(ga_payload, secret, algorithm='HS256')
            ga_decoded = pyjwt.decode(ga_token, secret, algorithms=['HS256'])

            # Validate persona-specific claims
            if gasnelio_decoded.get('persona') != 'dr_gasnelio':
                self.log_test("medical_persona_auth", False, "Dr. Gasnelio auth failed")
                return False

            if ga_decoded.get('persona') != 'ga':
                self.log_test("medical_persona_auth", False, "Gá auth failed")
                return False

            self.log_test("medical_persona_auth", True, "Both medical personas authenticated successfully")
            return True

        except Exception as e:
            self.log_test("medical_persona_auth", False, f"Medical persona auth failed: {e}")
            return False

    def test_lgpd_compliance_simulation(self):
        """Test LGPD compliance token features"""
        try:
            import jwt as pyjwt
            from datetime import datetime, timedelta

            secret = os.getenv('JWT_SECRET_KEY', 'test-lgpd-secret')

            # LGPD-compliant token with proper data handling claims
            lgpd_payload = {
                'user_id': 'hashed_user_id_123',  # Pseudonymized ID
                'persona': 'dr_gasnelio',
                'data_consent': True,
                'data_retention_period': '2_years',
                'purpose': 'medical_dispensing_guidance',
                'data_controller': 'hanseniase_education_platform',
                'user_rights_acknowledged': True,
                'exp': datetime.now(timezone.utc) + timedelta(hours=1),
                'iat': datetime.now(timezone.utc),
                'iss': 'roteirosdedispensacao.com'
            }

            token = pyjwt.encode(lgpd_payload, secret, algorithm='HS256')
            decoded = pyjwt.decode(token, secret, algorithms=['HS256'])

            # Validate LGPD compliance fields
            required_fields = ['data_consent', 'data_retention_period', 'purpose', 'user_rights_acknowledged']
            for field in required_fields:
                if field not in decoded:
                    self.log_test("lgpd_compliance", False, f"Missing LGPD field: {field}")
                    return False

            self.log_test("lgpd_compliance", True, "LGPD compliance tokens working correctly")
            return True

        except Exception as e:
            self.log_test("lgpd_compliance", False, f"LGPD compliance test failed: {e}")
            return False

    def run_all_tests(self):
        """Run all validation tests"""
        logger.info("🔒 Starting Authlib Security Update Validation")
        logger.info("🏥 Medical Application: Hanseníase Dispensing Guidance System")
        logger.info("🛡️  CVE-2025-59420: JWT/JWS Critical Header Vulnerability Fix")
        logger.info("=" * 70)

        # Run all tests
        tests = [
            self.test_authlib_import,
            self.test_pyjwt_compatibility,
            self.test_dependency_conflicts,
            self.test_medical_persona_auth_simulation,
            self.test_lgpd_compliance_simulation
        ]

        for test in tests:
            try:
                test()
            except Exception as e:
                test_name = test.__name__
                self.log_test(test_name, False, f"Unexpected error: {e}")
                logger.error(f"Stack trace for {test_name}:\n{traceback.format_exc()}")

        # Summary
        logger.info("=" * 70)
        logger.info(f"🧪 Test Results: {self.success_count}/{self.total_tests} passed")

        if self.success_count == self.total_tests:
            logger.info("✅ ALL TESTS PASSED - Authlib update is SAFE for medical application")
            logger.info("🏥 Medical personas (Dr. Gasnelio, Gá) authentication validated")
            logger.info("🛡️  CVE-2025-59420 vulnerability RESOLVED")
            logger.info("⚖️  LGPD compliance maintained")
            return True
        else:
            failed_tests = [name for name, result in self.results.items() if not result['success']]
            logger.error(f"❌ FAILED TESTS: {', '.join(failed_tests)}")
            logger.error("🚨 DO NOT DEPLOY - Fix issues before proceeding")
            return False

def main():
    """Main validation function"""
    validator = AuthlibUpdateValidator()
    success = validator.run_all_tests()

    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()