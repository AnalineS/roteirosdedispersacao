#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Execute Security Update Script
Orchestrates the complete security update process with safety checks
"""

import sys
import subprocess
import shutil
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'security_update_execution_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SecurityUpdateExecutor:
    """Orchestrates the complete security update process"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.backend_root = Path(__file__).parent.parent
        self.backup_branch = f"security-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.execution_log = []

    def log_step(self, step: str, status: str, details: Optional[str] = None):
        """Log execution step with timestamp"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "step": step,
            "status": status,
            "details": details
        }
        self.execution_log.append(log_entry)

        if status == "SUCCESS":
            logger.info(f"✅ {step}")
        elif status == "FAILURE":
            logger.error(f"❌ {step}")
            if details:
                logger.error(f"   Details: {details}")
        elif status == "WARNING":
            logger.warning(f"⚠️  {step}")
        else:
            logger.info(f"🔄 {step}")

        if details and status == "SUCCESS":
            logger.debug(f"   Details: {details}")

    def check_prerequisites(self) -> bool:
        """Check system prerequisites"""
        self.log_step("Checking prerequisites", "IN_PROGRESS")

        try:
            # Check Python version
            python_version = sys.version_info
            if python_version < (3, 9) or python_version >= (3, 14):
                self.log_step(
                    "Python version compatibility",
                    "FAILURE",
                    f"Python {python_version.major}.{python_version.minor} not compatible with PyTorch 2.8"
                )
                return False

            # Check if we're in a git repository
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )

            if result.returncode != 0:
                self.log_step("Git repository check", "FAILURE", "Not in a git repository")
                return False

            # Check for uncommitted changes
            if result.stdout.strip():
                self.log_step(
                    "Git working directory",
                    "WARNING",
                    "Uncommitted changes detected - recommend committing first"
                )

            # Check if required files exist
            required_files = [
                self.backend_root / "requirements.txt",
                self.backend_root / "scripts" / "security_ml_update.py",
                self.backend_root / "scripts" / "medical_ai_validation.py"
            ]

            for file_path in required_files:
                if not file_path.exists():
                    self.log_step(
                        f"Required file check: {file_path.name}",
                        "FAILURE",
                        f"File not found: {file_path}"
                    )
                    return False

            self.log_step("Prerequisites check", "SUCCESS", "All prerequisites met")
            return True

        except Exception as e:
            self.log_step("Prerequisites check", "FAILURE", str(e))
            return False

    def create_backup_branch(self) -> bool:
        """Create backup branch for safety"""
        self.log_step(f"Creating backup branch: {self.backup_branch}", "IN_PROGRESS")

        if self.dry_run:
            self.log_step("Backup branch creation", "SUCCESS", "DRY RUN - Branch would be created")
            return True

        try:
            # Create and push backup branch
            commands = [
                ["git", "checkout", "-b", self.backup_branch],
                ["git", "push", "-u", "origin", self.backup_branch]
            ]

            for cmd in commands:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=self.project_root
                )

                if result.returncode != 0:
                    self.log_step(
                        f"Git command: {' '.join(cmd)}",
                        "FAILURE",
                        result.stderr
                    )
                    return False

            self.log_step("Backup branch creation", "SUCCESS", f"Branch {self.backup_branch} created and pushed")
            return True

        except Exception as e:
            self.log_step("Backup branch creation", "FAILURE", str(e))
            return False

    def backup_current_environment(self) -> bool:
        """Backup current Python environment and requirements"""
        self.log_step("Backing up current environment", "IN_PROGRESS")

        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Backup requirements.txt
            current_requirements = self.backend_root / "requirements.txt"
            backup_requirements = self.backend_root / f"requirements_backup_{timestamp}.txt"

            if current_requirements.exists() and not self.dry_run:
                shutil.copy2(current_requirements, backup_requirements)

            # Export current pip freeze
            pip_freeze_backup = self.backend_root / f"pip_freeze_backup_{timestamp}.txt"

            if not self.dry_run:
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "freeze"],
                    capture_output=True,
                    text=True,
                    cwd=self.backend_root
                )

                if result.returncode == 0:
                    with open(pip_freeze_backup, "w") as f:
                        f.write(result.stdout)

            self.log_step(
                "Environment backup",
                "SUCCESS",
                f"Backups created: {backup_requirements.name}, {pip_freeze_backup.name}"
            )
            return True

        except Exception as e:
            self.log_step("Environment backup", "FAILURE", str(e))
            return False

    def run_security_update(self) -> bool:
        """Execute the ML security update script"""
        self.log_step("Running ML security update", "IN_PROGRESS")

        try:
            # Prepare security update script arguments
            script_path = self.backend_root / "scripts" / "security_ml_update.py"
            cmd = [sys.executable, str(script_path)]

            if self.dry_run:
                cmd.append("--dry-run")

            # Run the security update
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=self.backend_root,
                timeout=1800  # 30 minute timeout
            )

            if result.returncode == 0:
                self.log_step("ML security update", "SUCCESS", "All dependencies updated successfully")
                logger.info(f"Update output:\n{result.stdout}")
                return True
            else:
                self.log_step("ML security update", "FAILURE", result.stderr)
                logger.error(f"Update errors:\n{result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            self.log_step("ML security update", "FAILURE", "Update process timed out (30 minutes)")
            return False
        except Exception as e:
            self.log_step("ML security update", "FAILURE", str(e))
            return False

    def run_medical_validation(self) -> Dict[str, Any]:
        """Execute medical AI validation"""
        self.log_step("Running medical AI validation", "IN_PROGRESS")

        try:
            script_path = self.backend_root / "scripts" / "medical_ai_validation.py"
            report_path = self.backend_root / f"medical_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

            cmd = [
                sys.executable, str(script_path),
                "--output", str(report_path)
            ]

            # Run validation
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=self.backend_root,
                timeout=600  # 10 minute timeout
            )

            # Load validation report
            validation_results = {}
            if report_path.exists():
                with open(report_path, "r", encoding="utf-8") as f:
                    validation_results = json.load(f)

            if result.returncode == 0:
                self.log_step("Medical AI validation", "SUCCESS", f"Report saved to {report_path.name}")
                logger.info(f"Validation output:\n{result.stdout}")
            else:
                self.log_step("Medical AI validation", "FAILURE", result.stderr)
                logger.error(f"Validation errors:\n{result.stderr}")

            return validation_results

        except subprocess.TimeoutExpired:
            self.log_step("Medical AI validation", "FAILURE", "Validation timed out (10 minutes)")
            return {"error": "timeout"}
        except Exception as e:
            self.log_step("Medical AI validation", "FAILURE", str(e))
            return {"error": str(e)}

    def apply_security_requirements(self) -> bool:
        """Apply the security-updated requirements file"""
        self.log_step("Applying security requirements", "IN_PROGRESS")

        try:
            security_requirements = self.backend_root / "requirements_security_ml_update.txt"

            if not security_requirements.exists():
                self.log_step(
                    "Security requirements file check",
                    "FAILURE",
                    f"File not found: {security_requirements}"
                )
                return False

            if self.dry_run:
                self.log_step("Apply security requirements", "SUCCESS", "DRY RUN - Requirements would be applied")
                return True

            # Copy security requirements to main requirements file
            main_requirements = self.backend_root / "requirements.txt"
            shutil.copy2(security_requirements, main_requirements)

            # Install from updated requirements
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", str(main_requirements), "--upgrade"],
                capture_output=True,
                text=True,
                cwd=self.backend_root,
                timeout=1800  # 30 minute timeout
            )

            if result.returncode == 0:
                self.log_step("Security requirements installation", "SUCCESS")
                return True
            else:
                self.log_step("Security requirements installation", "FAILURE", result.stderr)
                return False

        except subprocess.TimeoutExpired:
            self.log_step("Security requirements installation", "FAILURE", "Installation timed out")
            return False
        except Exception as e:
            self.log_step("Apply security requirements", "FAILURE", str(e))
            return False

    def rollback_on_failure(self) -> bool:
        """Rollback to backup branch on failure"""
        self.log_step("Initiating rollback", "IN_PROGRESS")

        if self.dry_run:
            self.log_step("Rollback", "SUCCESS", "DRY RUN - Would rollback to backup branch")
            return True

        try:
            # Switch back to main branch
            result = subprocess.run(
                ["git", "checkout", "main"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )

            if result.returncode != 0:
                self.log_step("Git checkout main", "FAILURE", result.stderr)
                return False

            # Reset to the state before backup branch was created
            result = subprocess.run(
                ["git", "reset", "--hard", "HEAD~1"],
                capture_output=True,
                text=True,
                cwd=self.project_root
            )

            if result.returncode != 0:
                self.log_step("Git reset", "FAILURE", result.stderr)
                return False

            self.log_step("Rollback", "SUCCESS", "Successfully rolled back to previous state")
            return True

        except Exception as e:
            self.log_step("Rollback", "FAILURE", str(e))
            return False

    def generate_execution_report(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive execution report"""
        return {
            "execution_summary": {
                "timestamp": datetime.now().isoformat(),
                "dry_run": self.dry_run,
                "backup_branch": self.backup_branch,
                "total_steps": len(self.execution_log),
                "successful_steps": len([log for log in self.execution_log if log["status"] == "SUCCESS"]),
                "failed_steps": len([log for log in self.execution_log if log["status"] == "FAILURE"]),
                "warning_steps": len([log for log in self.execution_log if log["status"] == "WARNING"])
            },
            "execution_log": self.execution_log,
            "validation_results": validation_results,
            "recommendations": self._generate_recommendations(validation_results)
        }

    def _generate_recommendations(self, validation_results: Dict[str, Any]) -> List[str]:
        """Generate post-execution recommendations"""
        recommendations = []

        if validation_results.get("overall_success", False):
            recommendations.extend([
                "✅ Security update completed successfully",
                "✅ Medical AI validation passed all tests",
                "🚀 Safe to deploy to production",
                "📊 Monitor medical AI performance for 24-48 hours",
                "📋 Update security documentation",
                "🔄 Schedule regular security dependency updates"
            ])
        else:
            recommendations.extend([
                "❌ Security update failed or validation issues detected",
                "⚠️  DO NOT deploy to production",
                "🔄 Consider rollback to previous version",
                "🔍 Review detailed validation results",
                "👥 Consult with medical content experts",
                "🛠️  Manual dependency resolution may be required"
            ])

        # Add specific validation-based recommendations
        if "components" in validation_results:
            for component, data in validation_results["components"].items():
                success_rate = data.get("success_rate", 0)
                if success_rate < 0.8:
                    recommendations.append(
                        f"🚨 {component.upper()}: Success rate {success_rate:.1%} requires attention"
                    )

        return recommendations

    def execute_complete_update(self) -> Dict[str, Any]:
        """Execute the complete security update process"""
        logger.info("🏥 Starting Medical AI Security Update Process")
        logger.info("=" * 60)

        if self.dry_run:
            logger.info("🚫 DRY RUN MODE - No actual changes will be made")

        # Step 1: Check prerequisites
        if not self.check_prerequisites():
            logger.error("❌ Prerequisites check failed - aborting update")
            return self.generate_execution_report({"error": "prerequisites_failed"})

        # Step 2: Create backup branch
        if not self.create_backup_branch():
            logger.error("❌ Backup branch creation failed - aborting update")
            return self.generate_execution_report({"error": "backup_failed"})

        # Step 3: Backup current environment
        if not self.backup_current_environment():
            logger.error("❌ Environment backup failed - aborting update")
            return self.generate_execution_report({"error": "environment_backup_failed"})

        # Step 4: Apply security requirements
        if not self.apply_security_requirements():
            logger.error("❌ Security requirements application failed")
            self.rollback_on_failure()
            return self.generate_execution_report({"error": "requirements_update_failed"})

        # Step 5: Run medical AI validation
        validation_results = self.run_medical_validation()

        # Step 6: Check validation results and decide on deployment
        if validation_results.get("overall_success", False):
            logger.info("🎉 Security update completed successfully!")
            logger.info("✅ Medical AI validation passed - safe for production")
        else:
            logger.error("⚠️  Validation issues detected")
            logger.error("❌ Review validation results before production deployment")

            # Option to auto-rollback on validation failure
            # Uncomment the following lines for automatic rollback
            # logger.warning("🔄 Initiating automatic rollback due to validation failure")
            # self.rollback_on_failure()

        # Generate final report
        final_report = self.generate_execution_report(validation_results)

        # Save execution report
        report_path = self.backend_root / f"security_update_execution_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(final_report, f, indent=2, ensure_ascii=False)
            logger.info(f"📄 Execution report saved to: {report_path.name}")
        except Exception as e:
            logger.error(f"❌ Failed to save execution report: {e}")

        return final_report

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description="Execute ML Security Update")
    parser.add_argument("--dry-run", action="store_true",
                       help="Run in dry-run mode (no actual changes)")
    parser.add_argument("--auto-rollback", action="store_true",
                       help="Automatically rollback on validation failure")

    args = parser.parse_args()

    executor = SecurityUpdateExecutor(dry_run=args.dry_run)

    # Execute complete update process
    final_report = executor.execute_complete_update()

    # Print summary
    print("\n" + "=" * 60)
    print("🏥 MEDICAL AI SECURITY UPDATE SUMMARY")
    print("=" * 60)

    execution_summary = final_report.get("execution_summary", {})
    validation_results = final_report.get("validation_results", {})

    print(f"📊 Execution Steps: {execution_summary.get('successful_steps', 0)}/{execution_summary.get('total_steps', 0)} successful")
    print(f"🧪 Validation Status: {'✅ PASSED' if validation_results.get('overall_success', False) else '❌ FAILED'}")

    recommendations = final_report.get("recommendations", [])
    if recommendations:
        print("\n🔍 RECOMMENDATIONS:")
        for rec in recommendations[:5]:  # Show top 5 recommendations
            print(f"   {rec}")

    # Exit with appropriate code
    overall_success = (
        execution_summary.get("failed_steps", 1) == 0 and
        validation_results.get("overall_success", False)
    )

    sys.exit(0 if overall_success else 1)

if __name__ == "__main__":
    main()