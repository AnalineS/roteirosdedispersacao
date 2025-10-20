#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Security Update Implementation Script
Roteiro de Dispensação - Medical System Backend
Addresses: CVE-2025-59420, CVE-2025-3730, CVE-2024-47874

CRITICAL: This script updates security-vulnerable packages
MEDICAL SAFETY: Extensive testing required before production deployment
"""

import subprocess
import sys
import json
import datetime
import os
import shutil
from pathlib import Path

class SecurityUpdater:
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.backup_dir = self.script_dir / "security_update_backups"
        self.log_file = self.backup_dir / f"security_update_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        self.backup_dir.mkdir(exist_ok=True)

        # Critical packages to update
        self.critical_updates = {
            'authlib': {
                'current': '1.6.3',
                'target': '1.6.4',
                'cve': 'CVE-2025-59420',
                'priority': 'CRITICAL',
                'risk': 'LOW',
                'description': 'JWT/JWS critical header bypass vulnerability'
            },
            'torch': {
                'current': '2.7.1',
                'target': '2.8.0',
                'cve': 'CVE-2025-3730',
                'priority': 'HIGH',
                'risk': 'MEDIUM',
                'description': 'torch.nn.functional.ctc_loss DoS vulnerability'
            },
            'starlette': {
                'current': '0.47.2',
                'target': '0.40.0',
                'cve': 'CVE-2024-47874',
                'priority': 'HIGH',
                'risk': 'HIGH',
                'description': 'Multipart form data DoS vulnerability'
            },
            'fastapi': {
                'current': '0.116.1',
                'target': '0.118.6',
                'cve': 'Related to Starlette',
                'priority': 'HIGH',
                'risk': 'MEDIUM',
                'description': 'Framework security improvements'
            },
            'numpy': {
                'current': '1.26.4',
                'target': '2.3.3',
                'cve': 'None (maintenance)',
                'priority': 'MEDIUM',
                'risk': 'HIGH',
                'description': 'Major version upgrade - potential breaking changes'
            }
        }

    def log(self, message, level="INFO"):
        """Log message with timestamp"""
        timestamp = datetime.datetime.now().isoformat()
        log_entry = f"[{timestamp}] [{level}] {message}"
        print(log_entry)

        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry + '\n')

    def run_command(self, command, capture_output=True):
        """Run shell command with logging"""
        self.log(f"Running: {command}")
        try:
            if capture_output:
                result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding='utf-8')
                if result.returncode != 0:
                    self.log(f"Command failed with return code {result.returncode}", "ERROR")
                    self.log(f"STDERR: {result.stderr}", "ERROR")
                    return None
                return result.stdout.strip()
            else:
                subprocess.run(command, shell=True, check=True)
                return True
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {e}", "ERROR")
            return None

    def create_backup(self):
        """Create backup of current environment"""
        self.log("Creating environment backup...")

        # Backup current requirements
        shutil.copy2(self.script_dir / "requirements.txt",
                    self.backup_dir / f"requirements_backup_{datetime.datetime.now().strftime('%Y%m%d')}.txt")

        # Create pip freeze backup
        pip_freeze = self.run_command("pip freeze")
        if pip_freeze:
            with open(self.backup_dir / f"pip_freeze_backup_{datetime.datetime.now().strftime('%Y%m%d')}.txt", 'w') as f:
                f.write(pip_freeze)

        self.log("Backup completed successfully")
        return True

    def check_current_versions(self):
        """Check current versions of vulnerable packages"""
        self.log("Checking current package versions...")

        current_versions = {}
        for package in self.critical_updates.keys():
            version_output = self.run_command(f"pip show {package}")
            if version_output:
                for line in version_output.split('\n'):
                    if line.startswith('Version:'):
                        current_versions[package] = line.split(':')[1].strip()
                        break
            else:
                current_versions[package] = "NOT_INSTALLED"

        self.log(f"Current versions: {json.dumps(current_versions, indent=2)}")
        return current_versions

    def test_critical_imports(self):
        """Test that critical imports still work after updates"""
        self.log("Testing critical imports...")

        tests = {
            'flask': 'import flask; print("Flask OK")',
            'authlib': 'import authlib.jose; print("Authlib OK")',
            'torch': 'import torch; print("PyTorch OK")',
            'fastapi': 'import fastapi; print("FastAPI OK")',
            'numpy': 'import numpy as np; print("NumPy OK")',
            'starlette': 'import starlette; print("Starlette OK")'
        }

        failed_imports = []
        for package, test_code in tests.items():
            try:
                result = subprocess.run([sys.executable, '-c', test_code],
                                      capture_output=True, text=True, timeout=30)
                if result.returncode != 0:
                    self.log(f"Import test FAILED for {package}: {result.stderr}", "ERROR")
                    failed_imports.append(package)
                else:
                    self.log(f"Import test PASSED for {package}")
            except subprocess.TimeoutExpired:
                self.log(f"Import test TIMEOUT for {package}", "ERROR")
                failed_imports.append(package)

        return len(failed_imports) == 0

    def test_jwt_functionality(self):
        """Test JWT functionality after authlib update"""
        self.log("Testing JWT functionality...")

        jwt_test = '''
try:
    import authlib.jose as jose
    from authlib.jose import jwt

    # Test JWT creation and verification
    header = {"alg": "HS256"}
    payload = {"sub": "test", "exp": 9999999999}
    secret = "test_secret_key_for_testing_only"

    # Create token
    token = jwt.encode(header, payload, secret)
    print(f"JWT Token created: {len(token)} chars")

    # Verify token
    data = jwt.decode(token, secret)
    print(f"JWT Token verified: {data}")

    # Test critical header handling (the vulnerability we're fixing)
    try:
        # This should now properly reject unknown critical headers
        malicious_header = {"alg": "HS256", "crit": ["unknown_param"], "unknown_param": "malicious"}
        malicious_token = jwt.encode(malicious_header, payload, secret)
        # If this doesn't throw an error, the vulnerability might still exist
        result = jwt.decode(malicious_token, secret)
        print("WARNING: Critical header vulnerability test - token accepted when it should be rejected!")
        return False
    except Exception as e:
        print(f"GOOD: Critical header properly rejected: {type(e).__name__}")

    print("JWT functionality test PASSED")
    return True

except Exception as e:
    print(f"JWT test FAILED: {e}")
    import traceback
    traceback.print_exc()
    return False
'''

        try:
            result = subprocess.run([sys.executable, '-c', jwt_test],
                                  capture_output=True, text=True, timeout=60)
            self.log(f"JWT test output: {result.stdout}")
            if result.stderr:
                self.log(f"JWT test stderr: {result.stderr}", "WARNING")

            return result.returncode == 0 and "JWT functionality test PASSED" in result.stdout
        except Exception as e:
            self.log(f"JWT test failed with exception: {e}", "ERROR")
            return False

    def test_torch_functionality(self):
        """Test PyTorch functionality including the vulnerable ctc_loss function"""
        self.log("Testing PyTorch functionality...")

        torch_test = '''
try:
    import torch
    import torch.nn.functional as F

    # Basic torch test
    x = torch.randn(5, 3)
    print(f"Torch tensor created: {x.shape}")

    # Test the specific function that was vulnerable (ctc_loss)
    try:
        # Create minimal test case for ctc_loss
        T = 50      # Input sequence length
        C = 20      # Number of classes (including blank)
        N = 16      # Batch size

        # Initialize the loss function
        ctc_loss = torch.nn.CTCLoss()

        # Create dummy input (log probabilities)
        input_tensor = torch.randn(T, N, C).log_softmax(2).detach().requires_grad_()

        # Create dummy targets
        target = torch.randint(low=1, high=C, size=(N, 10), dtype=torch.long)
        input_lengths = torch.full(size=(N,), fill_value=T, dtype=torch.long)
        target_lengths = torch.randint(low=1, high=10, size=(N,), dtype=torch.long)

        # Test the vulnerable function
        loss = ctc_loss(input_tensor, target, input_lengths, target_lengths)
        print(f"CTC Loss computed successfully: {loss.item()}")

        # Test gradient computation
        loss.backward()
        print("CTC Loss gradient computed successfully")

    except Exception as e:
        print(f"CTC Loss test failed: {e}")
        return False

    print("PyTorch functionality test PASSED")
    return True

except Exception as e:
    print(f"PyTorch test FAILED: {e}")
    import traceback
    traceback.print_exc()
    return False
'''

        try:
            result = subprocess.run([sys.executable, '-c', torch_test],
                                  capture_output=True, text=True, timeout=120)
            self.log(f"PyTorch test output: {result.stdout}")
            if result.stderr:
                self.log(f"PyTorch test stderr: {result.stderr}", "WARNING")

            return result.returncode == 0 and "PyTorch functionality test PASSED" in result.stdout
        except Exception as e:
            self.log(f"PyTorch test failed with exception: {e}", "ERROR")
            return False

    def test_medical_system_functionality(self):
        """Test medical system specific functionality"""
        self.log("Testing medical system functionality...")

        # Test that we can import core medical system modules
        medical_test = '''
try:
    # Test core Flask functionality
    from flask import Flask
    app = Flask(__name__)
    print("Flask app creation: OK")

    # Test if main medical modules can be imported
    import sys
    import os

    # Add backend directory to path for imports
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    # Test configuration import
    try:
        from app_config import config
        print("Config import: OK")
    except ImportError as e:
        print(f"Config import failed: {e}")

    # Test that we can create a basic response
    with app.app_context():
        test_response = {"status": "healthy", "test": "medical_system_functional"}
        print(f"Medical system test response: {test_response}")

    print("Medical system functionality test PASSED")
    return True

except Exception as e:
    print(f"Medical system test FAILED: {e}")
    import traceback
    traceback.print_exc()
    return False
'''

        try:
            result = subprocess.run([sys.executable, '-c', medical_test],
                                  capture_output=True, text=True, timeout=60)
            self.log(f"Medical system test output: {result.stdout}")
            if result.stderr:
                self.log(f"Medical system test stderr: {result.stderr}", "WARNING")

            return result.returncode == 0 and "Medical system functionality test PASSED" in result.stdout
        except Exception as e:
            self.log(f"Medical system test failed with exception: {e}", "ERROR")
            return False

    def update_package(self, package_name, target_version):
        """Update a specific package"""
        self.log(f"Updating {package_name} to {target_version}...")

        # Special handling for numpy major version upgrade
        if package_name == 'numpy' and target_version.startswith('2.'):
            self.log("WARNING: NumPy 2.x upgrade detected - this may introduce breaking changes")
            self.log("Consider testing with numpy==1.26.4 fallback if issues occur")

        result = self.run_command(f"pip install {package_name}=={target_version}", capture_output=False)
        if result:
            self.log(f"Successfully updated {package_name} to {target_version}")
            return True
        else:
            self.log(f"Failed to update {package_name}", "ERROR")
            return False

    def rollback_package(self, package_name, fallback_version):
        """Rollback a package to previous version"""
        self.log(f"Rolling back {package_name} to {fallback_version}...")
        result = self.run_command(f"pip install {package_name}=={fallback_version}", capture_output=False)
        if result:
            self.log(f"Successfully rolled back {package_name} to {fallback_version}")
            return True
        else:
            self.log(f"Failed to rollback {package_name}", "ERROR")
            return False

    def run_security_update(self, dry_run=False):
        """Run the complete security update process"""
        self.log("=" * 60)
        self.log("STARTING SECURITY UPDATE PROCESS")
        self.log("Medical System Backend - Vulnerability Remediation")
        self.log("=" * 60)

        if dry_run:
            self.log("DRY RUN MODE - No actual changes will be made")

        # Step 1: Create backup
        if not self.create_backup():
            self.log("Backup failed - aborting update", "ERROR")
            return False

        # Step 2: Check current versions
        current_versions = self.check_current_versions()

        # Step 3: Update packages in priority order
        update_order = ['authlib', 'torch', 'fastapi', 'starlette', 'numpy']
        failed_updates = []

        for package in update_order:
            if package not in self.critical_updates:
                continue

            package_info = self.critical_updates[package]
            current_version = current_versions.get(package, "UNKNOWN")
            target_version = package_info['target']

            self.log(f"\n--- Updating {package} ---")
            self.log(f"Priority: {package_info['priority']}")
            self.log(f"CVE: {package_info['cve']}")
            self.log(f"Current: {current_version} → Target: {target_version}")
            self.log(f"Risk Level: {package_info['risk']}")

            if dry_run:
                self.log(f"DRY RUN: Would update {package} to {target_version}")
                continue

            # Perform update
            if not self.update_package(package, target_version):
                failed_updates.append(package)
                self.log(f"Update failed for {package}", "ERROR")

                # For critical packages, try rollback
                if package_info['priority'] == 'CRITICAL':
                    self.log(f"Critical package {package} failed - attempting rollback")
                    self.rollback_package(package, package_info['current'])
                continue

            # Test functionality after each critical update
            if package == 'authlib':
                if not self.test_jwt_functionality():
                    self.log("JWT functionality test failed - rolling back authlib", "ERROR")
                    self.rollback_package('authlib', package_info['current'])
                    failed_updates.append(package)
                    continue

            elif package == 'torch':
                if not self.test_torch_functionality():
                    self.log("PyTorch functionality test failed - rolling back torch", "ERROR")
                    self.rollback_package('torch', package_info['current'])
                    failed_updates.append(package)
                    continue

        # Step 4: Final system tests
        if not dry_run:
            self.log("\n--- Running Final System Tests ---")

            # Test imports
            if not self.test_critical_imports():
                self.log("Critical import tests failed", "ERROR")
                return False

            # Test medical system
            if not self.test_medical_system_functionality():
                self.log("Medical system functionality test failed", "ERROR")
                return False

        # Step 5: Report results
        self.log("\n" + "=" * 60)
        self.log("SECURITY UPDATE SUMMARY")
        self.log("=" * 60)

        if failed_updates:
            self.log(f"Failed updates: {failed_updates}", "ERROR")
            self.log("CRITICAL: Some security updates failed - manual intervention required", "ERROR")
            return False
        else:
            if not dry_run:
                self.log("All security updates completed successfully!")
                self.log("IMPORTANT: Manual testing of medical system functionality recommended")
                self.log("IMPORTANT: Monitor system for 24 hours post-update")
            else:
                self.log("Dry run completed - no actual changes made")

        # Step 6: Generate update report
        self.generate_update_report(current_versions, failed_updates, dry_run)

        return len(failed_updates) == 0

    def generate_update_report(self, current_versions, failed_updates, dry_run):
        """Generate detailed update report"""
        report_file = self.backup_dir / f"update_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        report = {
            'timestamp': datetime.datetime.now().isoformat(),
            'dry_run': dry_run,
            'current_versions': current_versions,
            'target_updates': self.critical_updates,
            'failed_updates': failed_updates,
            'success': len(failed_updates) == 0,
            'log_file': str(self.log_file),
            'backup_directory': str(self.backup_dir),
            'recommendations': []
        }

        # Add recommendations based on results
        if failed_updates:
            report['recommendations'].append("Manual investigation required for failed updates")
            report['recommendations'].append("Consider individual package testing")
            report['recommendations'].append("Review error logs for specific failure causes")
        else:
            report['recommendations'].append("Conduct comprehensive medical system testing")
            report['recommendations'].append("Monitor system performance for 24 hours")
            report['recommendations'].append("Verify authentication flows work correctly")
            report['recommendations'].append("Test AI persona responses")

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.log(f"Update report saved to: {report_file}")

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Security Update Script for Medical System Backend')
    parser.add_argument('--dry-run', action='store_true',
                       help='Run in dry-run mode (no actual changes)')
    parser.add_argument('--force', action='store_true',
                       help='Force update even if tests fail (NOT RECOMMENDED)')

    args = parser.parse_args()

    updater = SecurityUpdater()

    print("\n" + "="*60)
    print("MEDICAL SYSTEM SECURITY UPDATE")
    print("Roteiro de Dispensação - Backend")
    print("="*60)
    print("CRITICAL VULNERABILITIES BEING ADDRESSED:")
    print("• CVE-2025-59420: Authlib JWT bypass")
    print("• CVE-2025-3730: PyTorch DoS vulnerability")
    print("• CVE-2024-47874: Starlette multipart DoS")
    print("="*60)

    if not args.force:
        print("\nWARNING: This script will modify your Python environment.")
        print("MEDICAL SAFETY: Extensive testing required after updates.")
        print("Backup will be created automatically.")

        if not args.dry_run:
            confirm = input("\nProceed with security updates? (yes/no): ").lower()
            if confirm != 'yes':
                print("Update cancelled by user")
                return

    success = updater.run_security_update(dry_run=args.dry_run)

    if success:
        print("\n✅ Security update process completed successfully!")
        if not args.dry_run:
            print("🏥 IMPORTANT: Test medical system functionality thoroughly")
            print("📊 Monitor system performance for 24 hours")
    else:
        print("\n❌ Security update process failed!")
        print("🔍 Check logs for detailed error information")
        print("🚨 Manual intervention may be required")

    print(f"\n📝 Logs saved to: {updater.log_file}")
    print(f"💾 Backups saved to: {updater.backup_dir}")

if __name__ == "__main__":
    main()