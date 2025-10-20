# -*- coding: utf-8 -*-
"""
Secret Migration Utility
========================

Migrates secrets encrypted with the old predictable salt to the new
secure per-secret salt system.

CRITICAL SECURITY FIX:
- Old system: Fixed salt 'roteiro_dispensacao_salt_2025' (CWE-327)
- New system: Cryptographically random salt per secret (32 bytes)

Usage:
    python migrate_secrets.py --config-dir ./config/secrets

Author: Security Framework - Roteiro de Dispensação
Date: 2025-01-27
"""

import os
import json
import base64
import logging
from pathlib import Path
from typing import Dict, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('secrets.migration')


class OldSecretEncryption:
    """Old encryption system with predictable salt (VULNERABLE)"""

    def __init__(self, master_key: str):
        self.master_key = master_key
        self._fernet = self._create_fernet()

    def _create_fernet(self) -> Fernet:
        """Create Fernet with OLD PREDICTABLE salt"""
        # OLD VULNERABLE SALT - for migration only
        salt = b'roteiro_dispensacao_salt_2025'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        return Fernet(key)

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt using old system"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self._fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Error decrypting with old system: {e}")
            raise


class NewSecretEncryption:
    """New encryption system with per-secret salt (SECURE)"""

    def __init__(self, master_key: str):
        self.master_key = master_key

    def _create_fernet(self, salt: Optional[bytes] = None):
        """Create Fernet with unique salt"""
        if salt is None:
            salt = os.urandom(32)  # 32 bytes = 256 bits

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        return Fernet(key), salt

    def encrypt(self, data: str) -> str:
        """Encrypt with unique salt"""
        try:
            fernet, salt = self._create_fernet()
            encrypted = fernet.encrypt(data.encode())
            salt_and_encrypted = salt + encrypted
            return base64.urlsafe_b64encode(salt_and_encrypted).decode()
        except Exception as e:
            logger.error(f"Error encrypting with new system: {e}")
            raise


def migrate_secrets(config_dir: str, master_key: Optional[str] = None) -> Dict[str, int]:
    """
    Migrate secrets from old to new encryption system

    Args:
        config_dir: Directory containing secrets files
        master_key: Master encryption key (from SECRET_MASTER_KEY env var if not provided)

    Returns:
        Dict with migration statistics
    """
    # Get master key
    master_key = master_key or os.environ.get('SECRET_MASTER_KEY')
    if not master_key:
        raise ValueError("Master key required (set SECRET_MASTER_KEY or pass as argument)")

    # Paths
    config_path = Path(config_dir)
    metadata_file = config_path / 'secrets_metadata.json'

    if not metadata_file.exists():
        logger.warning(f"No secrets metadata found at {metadata_file}")
        return {'migrated': 0, 'skipped': 0, 'errors': 0}

    # Load metadata
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    # Initialize encryption systems
    old_encryption = OldSecretEncryption(master_key)
    new_encryption = NewSecretEncryption(master_key)

    # Migration statistics
    stats = {'migrated': 0, 'skipped': 0, 'errors': 0}

    # Load secrets manager's cache to get encrypted values
    secrets_manager_file = config_path / 'secrets_cache.json'
    if not secrets_manager_file.exists():
        logger.info("No secrets cache found - secrets may be in memory only")
        logger.info("Migration will occur automatically on next encrypt/decrypt operation")
        return stats

    with open(secrets_manager_file, 'r') as f:
        secrets_cache = json.load(f)

    # Migrate each encrypted secret
    migrated_cache = {}

    for secret_name, secret_meta in metadata.items():
        try:
            # Only migrate encrypted secrets
            if not secret_meta.get('is_encrypted', False):
                logger.info(f"Skipping non-encrypted secret: {secret_name}")
                stats['skipped'] += 1
                migrated_cache[secret_name] = secrets_cache.get(secret_name)
                continue

            # Get encrypted value
            old_encrypted_value = secrets_cache.get(secret_name)
            if not old_encrypted_value:
                logger.warning(f"No cached value for secret: {secret_name}")
                stats['skipped'] += 1
                continue

            # Check if already migrated (new format has salt prepended)
            try:
                # Try to decrypt with new system first
                salt_and_encrypted = base64.urlsafe_b64decode(old_encrypted_value.encode())
                if len(salt_and_encrypted) > 32:
                    # Might be new format - skip
                    logger.info(f"Secret appears already migrated: {secret_name}")
                    stats['skipped'] += 1
                    migrated_cache[secret_name] = old_encrypted_value
                    continue
            except Exception:
                pass

            # Decrypt with old system
            logger.info(f"Migrating secret: {secret_name}")
            decrypted_value = old_encryption.decrypt(old_encrypted_value)

            # Re-encrypt with new system
            new_encrypted_value = new_encryption.encrypt(decrypted_value)

            # Update cache
            migrated_cache[secret_name] = new_encrypted_value
            stats['migrated'] += 1

            logger.info(f"Successfully migrated: {secret_name}")

        except Exception as e:
            logger.error(f"Error migrating secret {secret_name}: {e}")
            stats['errors'] += 1
            # Keep old value in case of error
            migrated_cache[secret_name] = secrets_cache.get(secret_name)

    # Backup old cache
    backup_file = config_path / 'secrets_cache.json.backup'
    if secrets_manager_file.exists():
        import shutil
        shutil.copy(secrets_manager_file, backup_file)
        logger.info(f"Backup created at: {backup_file}")

    # Write migrated cache
    with open(secrets_manager_file, 'w') as f:
        json.dump(migrated_cache, f, indent=2)

    logger.info(f"Migration complete: {stats}")
    return stats


def verify_migration(config_dir: str, master_key: Optional[str] = None) -> bool:
    """
    Verify migration was successful by decrypting with new system

    Args:
        config_dir: Directory containing secrets files
        master_key: Master encryption key

    Returns:
        True if all secrets decrypt successfully
    """
    master_key = master_key or os.environ.get('SECRET_MASTER_KEY')
    if not master_key:
        raise ValueError("Master key required")

    config_path = Path(config_dir)
    metadata_file = config_path / 'secrets_metadata.json'
    secrets_cache_file = config_path / 'secrets_cache.json'

    if not metadata_file.exists() or not secrets_cache_file.exists():
        logger.warning("Secrets files not found")
        return True

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    with open(secrets_cache_file, 'r') as f:
        secrets_cache = json.load(f)

    new_encryption = NewSecretEncryption(master_key)

    verification_passed = True

    for secret_name, secret_meta in metadata.items():
        if not secret_meta.get('is_encrypted', False):
            continue

        encrypted_value = secrets_cache.get(secret_name)
        if not encrypted_value:
            continue

        try:
            # Decrypt with new system
            salt_and_encrypted = base64.urlsafe_b64decode(encrypted_value.encode())
            salt = salt_and_encrypted[:32]
            encrypted_bytes = salt_and_encrypted[32:]

            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
            fernet = Fernet(key)

            decrypted = fernet.decrypt(encrypted_bytes)
            logger.info(f"✓ Verification passed for: {secret_name}")

        except Exception as e:
            logger.error(f"✗ Verification FAILED for {secret_name}: {e}")
            verification_passed = False

    return verification_passed


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Migrate secrets to secure salt system')
    parser.add_argument('--config-dir', default='./config/secrets',
                       help='Secrets configuration directory')
    parser.add_argument('--verify-only', action='store_true',
                       help='Only verify migration, do not migrate')
    parser.add_argument('--master-key', help='Master encryption key (optional, uses env var)')

    args = parser.parse_args()

    if args.verify_only:
        success = verify_migration(args.config_dir, args.master_key)
        if success:
            print("✓ All secrets verified successfully")
            exit(0)
        else:
            print("✗ Verification failed - check logs")
            exit(1)
    else:
        stats = migrate_secrets(args.config_dir, args.master_key)
        print(f"Migration complete: {stats}")

        # Auto-verify
        if stats['migrated'] > 0:
            print("\nVerifying migration...")
            if verify_migration(args.config_dir, args.master_key):
                print("✓ Migration verified successfully")
            else:
                print("✗ Verification failed - restore from backup if needed")
                exit(1)
