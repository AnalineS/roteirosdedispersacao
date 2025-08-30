#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Verificações de Segurança Local
==========================================

Script para executar todas as verificações de segurança localmente
antes de fazer push para o repositório.

Executa:
- Bandit (Python SAST)
- Safety (Python dependency check)
- ESLint Security (Frontend)
- npm audit (Frontend dependencies)

Uso:
    python tools/security/run-security-checks.py
    python tools/security/run-security-checks.py --quick  # Verificações rápidas apenas
    python tools/security/run-security-checks.py --backend-only
    python tools/security/run-security-checks.py --frontend-only

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-08-12
"""

import os
import sys
import subprocess
import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import time
from datetime import datetime

# Cores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m' 
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

class SecurityChecker:
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.backend_path = repo_root / "apps" / "backend"
        self.frontend_path = repo_root / "apps" / "frontend-nextjs"
        self.results = {}
        
    def print_header(self, title: str):
        """Print formatted header"""
        print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}🔒 {title}{Colors.END}")
        print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
        
    def print_success(self, message: str):
        """Print success message"""
        print(f"{Colors.GREEN}[OK] {message}{Colors.END}")
        
    def print_error(self, message: str):
        """Print error message"""
        print(f"{Colors.RED}[ERROR] {message}{Colors.END}")
        
    def print_warning(self, message: str):
        """Print warning message"""
        print(f"{Colors.YELLOW}[WARNING]  {message}{Colors.END}")
        
    def print_info(self, message: str):
        """Print info message"""
        print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")
        
    def run_command(self, command: List[str], cwd: Path, timeout: int = 300) -> Tuple[int, str, str]:
        """Run command and return exit code, stdout, stderr"""
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return 124, "", f"Command timed out after {timeout} seconds"
        except Exception as e:
            return 1, "", str(e)
            
    def check_bandit(self) -> bool:
        """Run Bandit Python SAST"""
        self.print_header("Bandit - Python SAST")
        
        if not self.backend_path.exists():
            self.print_error("Backend directory not found")
            return False
            
        config_file = self.backend_path / ".bandit"
        if not config_file.exists():
            self.print_warning("Bandit config not found, using defaults")
            command = ["bandit", "-r", ".", "-ll"]
        else:
            command = ["bandit", "-r", ".", "--configfile", ".bandit", "-ll"]
            
        self.print_info("Running Bandit security analysis...")
        exit_code, stdout, stderr = self.run_command(command, self.backend_path)
        
        if exit_code == 0:
            self.print_success("Bandit: No security issues found")
            self.results['bandit'] = {'status': 'pass', 'issues': 0}
            return True
        elif exit_code == 1:
            # Bandit found issues
            issue_count = stdout.count('>> Issue:')
            if issue_count > 0:
                self.print_warning(f"Bandit: {issue_count} security issues found")
                print(stdout)
                self.results['bandit'] = {'status': 'issues', 'issues': issue_count}
            else:
                self.print_success("Bandit: No security issues found")
                self.results['bandit'] = {'status': 'pass', 'issues': 0}
            return True
        else:
            self.print_error(f"Bandit failed: {stderr}")
            self.results['bandit'] = {'status': 'error', 'error': stderr}
            return False
            
    def check_safety(self) -> bool:
        """Run Safety dependency check"""
        self.print_header("Safety - Python Dependency Check")
        
        requirements_file = self.backend_path / "requirements.txt"
        if not requirements_file.exists():
            self.print_error("requirements.txt not found")
            return False
            
        policy_file = self.backend_path / ".safety-policy.yml"
        if policy_file.exists():
            command = ["safety", "check", "--policy-file", ".safety-policy.yml", "-r", "requirements.txt"]
        else:
            command = ["safety", "check", "-r", "requirements.txt"]
            
        self.print_info("Checking Python dependencies for vulnerabilities...")
        exit_code, stdout, stderr = self.run_command(command, self.backend_path)
        
        if exit_code == 0:
            self.print_success("Safety: No vulnerabilities found in dependencies")
            self.results['safety'] = {'status': 'pass', 'vulnerabilities': 0}
            return True
        else:
            vuln_count = stdout.count('vulnerability found')
            if vuln_count > 0:
                self.print_warning(f"Safety: {vuln_count} vulnerabilities found")
                print(stdout)
                self.results['safety'] = {'status': 'vulnerabilities', 'vulnerabilities': vuln_count}
            else:
                self.print_error(f"Safety check failed: {stderr}")
                self.results['safety'] = {'status': 'error', 'error': stderr}
            return False
            
    def check_eslint_security(self) -> bool:
        """Run ESLint security analysis"""
        self.print_header("ESLint Security - Frontend Analysis")
        
        if not self.frontend_path.exists():
            self.print_error("Frontend directory not found")
            return False
            
        security_config = self.frontend_path / ".eslintrc.security.js"
        if security_config.exists():
            command = ["npx", "eslint", "--config", ".eslintrc.security.js", "src/"]
        else:
            self.print_warning("Security ESLint config not found, using default")
            command = ["npx", "eslint", "src/"]
            
        self.print_info("Running ESLint security analysis...")
        exit_code, stdout, stderr = self.run_command(command, self.frontend_path)
        
        if exit_code == 0:
            self.print_success("ESLint Security: No issues found")
            self.results['eslint_security'] = {'status': 'pass', 'issues': 0}
            return True
        else:
            # Count errors and warnings
            error_count = stdout.count('error')
            warning_count = stdout.count('warning')
            
            if error_count > 0 or warning_count > 0:
                self.print_warning(f"ESLint Security: {error_count} errors, {warning_count} warnings")
                print(stdout)
                self.results['eslint_security'] = {
                    'status': 'issues', 
                    'errors': error_count, 
                    'warnings': warning_count
                }
            else:
                self.print_error(f"ESLint failed: {stderr}")
                self.results['eslint_security'] = {'status': 'error', 'error': stderr}
            return error_count == 0  # Only fail on errors, not warnings
            
    def check_npm_audit(self) -> bool:
        """Run npm audit for dependency vulnerabilities"""
        self.print_header("npm audit - Frontend Dependency Check")
        
        package_json = self.frontend_path / "package.json"
        if not package_json.exists():
            self.print_error("package.json not found")
            return False
            
        self.print_info("Checking npm dependencies for vulnerabilities...")
        exit_code, stdout, stderr = self.run_command(
            ["npm", "audit", "--audit-level", "moderate"], 
            self.frontend_path
        )
        
        if exit_code == 0:
            self.print_success("npm audit: No vulnerabilities found")
            self.results['npm_audit'] = {'status': 'pass', 'vulnerabilities': 0}
            return True
        else:
            # Try to parse audit output
            try:
                # Run audit with JSON output for better parsing
                _, json_output, _ = self.run_command(
                    ["npm", "audit", "--json"], 
                    self.frontend_path
                )
                audit_data = json.loads(json_output)
                
                vulnerabilities = audit_data.get('metadata', {}).get('vulnerabilities', {})
                total_vulns = sum(vulnerabilities.values())
                
                if total_vulns > 0:
                    self.print_warning(f"npm audit: {total_vulns} vulnerabilities found")
                    critical = vulnerabilities.get('critical', 0)
                    high = vulnerabilities.get('high', 0)
                    
                    if critical > 0 or high > 0:
                        self.print_error(f"Critical/High vulnerabilities: {critical} critical, {high} high")
                        print(stdout)
                        self.results['npm_audit'] = {
                            'status': 'critical_vulnerabilities',
                            'total': total_vulns,
                            'critical': critical,
                            'high': high
                        }
                        return False
                    else:
                        self.results['npm_audit'] = {
                            'status': 'moderate_vulnerabilities',
                            'total': total_vulns
                        }
                        return True
                        
            except (json.JSONDecodeError, KeyError):
                self.print_error("Failed to parse npm audit output")
                print(stdout)
                self.results['npm_audit'] = {'status': 'error', 'error': 'Parse failed'}
                return False
                
        return True
        
    def generate_report(self):
        """Generate security report summary"""
        self.print_header("Security Check Summary Report")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'repository': 'roteiro-dispensacao',
            'checks': self.results
        }
        
        # Print summary
        total_checks = len(self.results)
        passed_checks = sum(1 for r in self.results.values() if r.get('status') == 'pass')
        failed_checks = total_checks - passed_checks
        
        print(f"\n{Colors.BOLD}[REPORT] Summary:{Colors.END}")
        print(f"   Total checks: {total_checks}")
        print(f"   Passed: {Colors.GREEN}{passed_checks}{Colors.END}")
        print(f"   Failed/Issues: {Colors.RED}{failed_checks}{Colors.END}")
        
        # Medical platform specific recommendations
        print(f"\n{Colors.BOLD}⚕️  Medical Platform Recommendations:{Colors.END}")
        
        if any('error' in r.get('status', '') for r in self.results.values()):
            print(f"   {Colors.RED}[ERROR] CRITICAL: Fix all errors before deployment{Colors.END}")
            
        if any(r.get('issues', 0) > 0 for r in self.results.values()):
            print(f"   {Colors.YELLOW}[WARNING]  REVIEW: Security issues found - review for medical data impact{Colors.END}")
            
        if all(r.get('status') == 'pass' for r in self.results.values()):
            print(f"   {Colors.GREEN}[OK] READY: All security checks passed{Colors.END}")
            
        # Save detailed report
        report_file = self.repo_root / "security-report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n{Colors.BLUE}📄 Detailed report saved: {report_file}{Colors.END}")
        
    def run_all_checks(self, backend_only: bool = False, frontend_only: bool = False, quick: bool = False):
        """Run all security checks"""
        start_time = time.time()
        
        self.print_header("Security Checks - Roteiros de Dispensação")
        self.print_info(f"Platform: Medical Educational System")
        self.print_info(f"Focus: LGPD Compliance, Medical Data Security")
        
        all_passed = True
        
        if not frontend_only:
            # Backend checks
            if not quick:
                all_passed &= self.check_bandit()
                all_passed &= self.check_safety()
            else:
                self.print_info("Skipping backend checks (quick mode)")
                
        if not backend_only:
            # Frontend checks  
            all_passed &= self.check_eslint_security()
            if not quick:
                all_passed &= self.check_npm_audit()
            else:
                self.print_info("Skipping npm audit (quick mode)")
                
        # Generate report
        self.generate_report()
        
        # Final status
        elapsed = time.time() - start_time
        self.print_header(f"Security Checks Complete ({elapsed:.1f}s)")
        
        if all_passed:
            self.print_success("🎉 All security checks passed! Ready for medical platform deployment.")
            return True
        else:
            self.print_error("[ERROR] Security issues found. Review and fix before deployment to production.")
            return False

def main():
    parser = argparse.ArgumentParser(description="Run security checks for medical educational platform")
    parser.add_argument("--backend-only", action="store_true", help="Run only backend security checks")
    parser.add_argument("--frontend-only", action="store_true", help="Run only frontend security checks") 
    parser.add_argument("--quick", action="store_true", help="Run quick checks only (skip dependency scans)")
    
    args = parser.parse_args()
    
    # Find repo root
    current_dir = Path(__file__).resolve()
    repo_root = None
    
    for parent in current_dir.parents:
        if (parent / ".git").exists():
            repo_root = parent
            break
            
    if not repo_root:
        print(f"{Colors.RED}[ERROR] Could not find repository root{Colors.END}")
        sys.exit(1)
        
    # Run checks
    checker = SecurityChecker(repo_root)
    success = checker.run_all_checks(
        backend_only=args.backend_only,
        frontend_only=args.frontend_only,
        quick=args.quick
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()