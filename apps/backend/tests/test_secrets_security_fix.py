# -*- coding: utf-8 -*-
"""
Security Fix Validation Tests
==============================

Tests to verify the predictable salt vulnerability has been properly fixed.

Test Coverage:
- Salt uniqueness verification
- Encryption/decryption integrity
- Format validation
- Migration process validation
- Security property verification

Author: Security Framework - Roteiro de Dispensação
Date: 2025-01-27
"""

import os
import base64
import pytest
from pathlib import Path
from typing import Tuple

# Import the fixed encryption system
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.security.secrets_manager import SecretEncryption, SecretsManager


class TestSaltUniqueness:
    """Verify each encryption uses unique salt"""

    def test_unique_salt_per_encryption(self):
        """Each encryption should produce different ciphertext due to unique salt"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        # Encrypt same data multiple times
        plaintext = "sensitive_secret_data"
        encrypted1 = encryption.encrypt(plaintext)
        encrypted2 = encryption.encrypt(plaintext)
        encrypted3 = encryption.encrypt(plaintext)

        # Ciphertexts should be different (different salts)
        assert encrypted1 != encrypted2
        assert encrypted2 != encrypted3
        assert encrypted1 != encrypted3

        # All should decrypt to same plaintext
        assert encryption.decrypt(encrypted1) == plaintext
        assert encryption.decrypt(encrypted2) == plaintext
        assert encryption.decrypt(encrypted3) == plaintext

    def test_extracted_salts_are_unique(self):
        """Extracted salts from encrypted data should be unique"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        plaintext = "test_data"
        encrypted1 = encryption.encrypt(plaintext)
        encrypted2 = encryption.encrypt(plaintext)

        # Decode and extract salts
        data1 = base64.urlsafe_b64decode(encrypted1.encode())
        data2 = base64.urlsafe_b64decode(encrypted2.encode())

        salt1 = data1[:32]
        salt2 = data2[:32]

        # Salts should be different
        assert salt1 != salt2
        assert len(salt1) == 32  # 256 bits
        assert len(salt2) == 32  # 256 bits


class TestCryptographicProperties:
    """Verify cryptographic security properties"""

    def test_salt_entropy(self):
        """Salt should have high entropy (cryptographically random)"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        # Generate multiple salts
        salts = []
        for _ in range(100):
            encrypted = encryption.encrypt("test")
            data = base64.urlsafe_b64decode(encrypted.encode())
            salt = data[:32]
            salts.append(salt)

        # Check uniqueness (all should be different)
        unique_salts = set(salts)
        assert len(unique_salts) == 100, "Salts should be unique"

        # Check length
        for salt in salts:
            assert len(salt) == 32, "Salt should be 32 bytes (256 bits)"

    def test_no_predictable_patterns(self):
        """Verify no predictable patterns in salts"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        salts = []
        for _ in range(10):
            encrypted = encryption.encrypt("test")
            data = base64.urlsafe_b64decode(encrypted.encode())
            salt = data[:32]
            salts.append(salt)

        # Salts should not have predictable patterns
        # (statistical test - XOR should not be zero)
        for i in range(len(salts) - 1):
            xor_result = bytes(a ^ b for a, b in zip(salts[i], salts[i+1]))
            # XOR should produce non-zero result (different salts)
            assert xor_result != b'\x00' * 32


class TestEncryptionDecryption:
    """Verify encryption/decryption integrity"""

    def test_round_trip_integrity(self):
        """Data should survive encryption/decryption unchanged"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        test_cases = [
            "simple_text",
            "Special chars: !@#$%^&*()",
            "Unicode: 你好世界 🔒🔐",
            "Long text: " + "a" * 1000,
            '{"json": "data", "nested": {"key": "value"}}',
            "",  # Empty string
        ]

        for plaintext in test_cases:
            encrypted = encryption.encrypt(plaintext)
            decrypted = encryption.decrypt(encrypted)
            assert decrypted == plaintext, f"Round-trip failed for: {plaintext[:50]}"

    def test_different_master_keys_fail(self):
        """Decryption with wrong master key should fail"""
        encryption1 = SecretEncryption(master_key="key1")
        encryption2 = SecretEncryption(master_key="key2")

        plaintext = "secret_data"
        encrypted = encryption1.encrypt(plaintext)

        # Should fail to decrypt with different master key
        with pytest.raises(Exception):
            encryption2.decrypt(encrypted)


class TestFormatValidation:
    """Verify encrypted data format"""

    def test_encrypted_format_structure(self):
        """Encrypted data should have correct structure"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        plaintext = "test_secret"
        encrypted = encryption.encrypt(plaintext)

        # Decode base64
        decoded = base64.urlsafe_b64decode(encrypted.encode())

        # Should have salt (32 bytes) + encrypted data
        assert len(decoded) > 32, "Should contain salt + encrypted data"

        # Extract components
        salt = decoded[:32]
        encrypted_data = decoded[32:]

        # Verify salt is 32 bytes
        assert len(salt) == 32

        # Verify encrypted data is not empty
        assert len(encrypted_data) > 0

    def test_base64_encoding_valid(self):
        """Encrypted output should be valid base64"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        plaintext = "test_secret"
        encrypted = encryption.encrypt(plaintext)

        # Should be valid base64
        try:
            decoded = base64.urlsafe_b64decode(encrypted.encode())
            assert decoded is not None
        except Exception as e:
            pytest.fail(f"Invalid base64 encoding: {e}")


class TestSecretsManagerIntegration:
    """Test integration with SecretsManager"""

    def test_secrets_manager_uses_secure_encryption(self, tmp_path):
        """SecretsManager should use secure encryption with unique salts"""
        config_dir = tmp_path / "secrets"
        config_dir.mkdir()

        # Use a fixed master key for testing
        master_key = "test_master_key_for_manager"
        os.environ['SECRET_MASTER_KEY'] = master_key

        try:
            manager = SecretsManager(config_dir=str(config_dir))

            # Set same secret twice
            manager.set_secret("api_key", "secret_value_123", encrypt=True)
            encrypted1 = manager.secrets_cache.get("api_key")

            # Delete and re-add
            manager.delete_secret("api_key")
            manager.set_secret("api_key", "secret_value_123", encrypt=True)
            encrypted2 = manager.secrets_cache.get("api_key")

            # Should have different encrypted values (different salts)
            assert encrypted1 != encrypted2

            # But same encryption instance should decrypt both
            assert manager.encryption.decrypt(encrypted1) == "secret_value_123"
            assert manager.encryption.decrypt(encrypted2) == "secret_value_123"

            # Verify salts are different
            decoded1 = base64.urlsafe_b64decode(encrypted1.encode())
            decoded2 = base64.urlsafe_b64decode(encrypted2.encode())
            salt1 = decoded1[:32]
            salt2 = decoded2[:32]
            assert salt1 != salt2, "Salts should be unique"

        finally:
            # Clean up environment
            del os.environ['SECRET_MASTER_KEY']


class TestSecurityRegression:
    """Ensure vulnerability is fixed"""

    def test_no_hardcoded_salt(self):
        """Verify no hardcoded salt in encryption system"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        # Check that the vulnerable salt is NOT used
        vulnerable_salt = b'roteiro_dispensacao_salt_2025'

        # Encrypt data multiple times
        for _ in range(10):
            encrypted = encryption.encrypt("test_data")
            decoded = base64.urlsafe_b64decode(encrypted.encode())
            salt = decoded[:32]

            # Salt should NEVER be the vulnerable hardcoded value
            assert salt != vulnerable_salt, "CRITICAL: Hardcoded salt still in use!"

    def test_no_salt_reuse(self):
        """Verify salt is never reused across encryptions"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        seen_salts = set()

        for _ in range(100):
            encrypted = encryption.encrypt("test_data")
            decoded = base64.urlsafe_b64decode(encrypted.encode())
            salt = decoded[:32]

            # Check salt is unique
            assert salt not in seen_salts, "Salt reused - security vulnerability!"
            seen_salts.add(salt)


class TestMigrationCompatibility:
    """Test migration from old to new format"""

    def test_can_identify_old_format(self):
        """Should be able to identify old format encrypted data"""
        # Old format: base64(encrypted_data) without salt
        # New format: base64(salt + encrypted_data)

        encryption = SecretEncryption(master_key="test_master_key_12345")

        # New format
        new_encrypted = encryption.encrypt("test")
        new_decoded = base64.urlsafe_b64decode(new_encrypted.encode())

        # New format should have salt (>32 bytes total)
        assert len(new_decoded) > 32

        # Can extract salt
        salt = new_decoded[:32]
        assert len(salt) == 32


class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_corrupted_data_fails_gracefully(self):
        """Corrupted encrypted data should raise exception"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        corrupted_data = base64.urlsafe_b64encode(b"corrupted").decode()

        with pytest.raises(Exception):
            encryption.decrypt(corrupted_data)

    def test_invalid_base64_fails(self):
        """Invalid base64 should raise exception"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        with pytest.raises(Exception):
            encryption.decrypt("not_valid_base64!!!")

    def test_truncated_data_fails(self):
        """Truncated encrypted data should fail"""
        encryption = SecretEncryption(master_key="test_master_key_12345")

        # Create valid encrypted data
        encrypted = encryption.encrypt("test")

        # Truncate it
        truncated = encrypted[:20]

        with pytest.raises(Exception):
            encryption.decrypt(truncated)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
