#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Runner Script
Comprehensive test execution with validation and reporting
"""

import os
import sys
import subprocess
import argparse
import json
import time
from pathlib import Path
from typing import Dict, List
import logging

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestRunner:
    """Comprehensive test runner for backend validation"""

    def __init__(self):
        self.backend_dir = Path(__file__).parent.parent
        self.test_dir = self.backend_dir / "tests"
        self.results_dir = self.backend_dir / "test-results"
        self.coverage_dir = self.backend_dir / "htmlcov"

        # Ensure directories exist
        self.results_dir.mkdir(exist_ok=True)
        self.coverage_dir.mkdir(exist_ok=True)

        # Test suites configuration
        self.test_suites = {
            'core': {
                'file': 'test_00_core_functionality.py',
                'description': 'Core functionality and health checks',
                'markers': 'not slow',
                'timeout': 300
            },
            'blueprints': {
                'file': 'test_01_blueprint_functionality.py',
                'description': 'Blueprint endpoint functionality',
                'markers': 'not slow',
                'timeout': 600
            },
            'integration': {
                'file': 'test_02_integration_workflows.py',
                'description': 'End-to-end workflow integration',
                'markers': 'integration and not slow',
                'timeout': 900
            },
            'performance': {
                'file': 'test_03_performance_load.py',
                'description': 'Performance and load testing',
                'markers': 'performance',
                'timeout': 1200
            },
            'security': {
                'file': 'test_04_security_validation.py',
                'description': 'Security validation testing',
                'markers': 'security and not slow',
                'timeout': 600
            },
            'system': {
                'file': 'test_05_system_validation.py',
                'description': 'System-wide validation',
                'markers': 'integration and not slow',
                'timeout': 900
            }
        }

    def setup_environment(self):
        """Setup test environment variables"""
        test_env = {
            'TESTING': 'true',
            'ENVIRONMENT': 'testing',
            'SECRET_KEY': 'test-secret-key-for-testing-only',
            'RATE_LIMIT_ENABLED': 'false',
            'CACHE_ENABLED': 'false',
            'EMBEDDINGS_ENABLED': 'false',
            'RAG_AVAILABLE': 'false',
            'QA_ENABLED': 'false',
            'EMAIL_ENABLED': 'false',
            'METRICS_ENABLED': 'false',
            'OPENROUTER_API_KEY': 'test-key',
            'HUGGINGFACE_API_KEY': 'test-key',
            'SQLITE_DB_PATH': ':memory:'
        }

        for key, value in test_env.items():
            os.environ[key] = value

        logger.info("Test environment configured")

    def check_dependencies(self):
        """Check that all required dependencies are available"""
        logger.info("Checking dependencies...")

        # Check Python packages
        required_packages = [
            'pytest', 'pytest-cov', 'pytest-html', 'pytest-json-report',
            'flask', 'requests', 'sqlite3'
        ]

        missing_packages = []
        for package in required_packages:
            try:
                if package == 'sqlite3':
                    import sqlite3
                else:
                    __import__(package.replace('-', '_'))
            except ImportError:
                missing_packages.append(package)

        if missing_packages:
            logger.error(f"Missing required packages: {missing_packages}")
            logger.info("Install with: pip install " + " ".join(missing_packages))
            return False

        # Check system dependencies
        system_deps = ['tesseract']
        for dep in system_deps:
            result = subprocess.run(['which', dep], capture_output=True)
            if result.returncode != 0:
                logger.warning(f"System dependency {dep} not found (multimodal tests may fail)")

        logger.info("Dependency check completed")
        return True

    def run_test_suite(self, suite_name: str, verbose: bool = False) -> Dict:
        """Run a specific test suite"""
        if suite_name not in self.test_suites:
            raise ValueError(f"Unknown test suite: {suite_name}")

        suite_config = self.test_suites[suite_name]
        test_file = self.test_dir / suite_config['file']

        if not test_file.exists():
            logger.error(f"Test file not found: {test_file}")
            return {'success': False, 'error': 'Test file not found'}

        logger.info(f"Running {suite_name} tests: {suite_config['description']}")

        # Build pytest command
        cmd = [
            'python', '-m', 'pytest',
            str(test_file),
            '-v' if verbose else '',
            '--tb=short',
            '--maxfail=10',
            f'--timeout={suite_config["timeout"]}',
            f'--html={self.results_dir}/{suite_name}-report.html',
            '--self-contained-html',
            f'--json-report',
            f'--json-report-file={self.results_dir}/{suite_name}-results.json'
        ]

        # Add markers if specified
        if suite_config['markers']:
            cmd.extend(['-m', suite_config['markers']])

        # Remove empty strings
        cmd = [arg for arg in cmd if arg]

        # Run the test
        start_time = time.time()
        result = subprocess.run(
            cmd,
            cwd=self.backend_dir,
            capture_output=True,
            text=True
        )
        end_time = time.time()

        # Parse results
        results = {
            'suite': suite_name,
            'success': result.returncode == 0,
            'duration': end_time - start_time,
            'command': ' '.join(cmd),
            'stdout': result.stdout,
            'stderr': result.stderr
        }

        # Try to parse JSON results
        json_file = self.results_dir / f"{suite_name}-results.json"
        if json_file.exists():
            try:
                with open(json_file) as f:
                    json_data = json.load(f)
                    results['stats'] = json_data.get('summary', {})
            except Exception as e:
                logger.warning(f"Could not parse JSON results: {e}")

        if results['success']:
            logger.info(f"✅ {suite_name} tests completed successfully in {results['duration']:.1f}s")
        else:
            logger.error(f"❌ {suite_name} tests failed in {results['duration']:.1f}s")

        return results

    def run_coverage_analysis(self) -> Dict:
        """Run comprehensive coverage analysis"""
        logger.info("Running coverage analysis...")

        cmd = [
            'python', '-m', 'pytest',
            str(self.test_dir),
            '--cov=services',
            '--cov=blueprints',
            '--cov=core',
            '--cov-branch',
            '--cov-report=html:htmlcov',
            '--cov-report=xml:coverage.xml',
            '--cov-report=term-missing',
            '--cov-fail-under=70',
            '-m', 'not slow and not performance',
            '--maxfail=20'
        ]

        start_time = time.time()
        result = subprocess.run(
            cmd,
            cwd=self.backend_dir,
            capture_output=True,
            text=True
        )
        end_time = time.time()

        coverage_results = {
            'success': result.returncode == 0,
            'duration': end_time - start_time,
            'stdout': result.stdout,
            'stderr': result.stderr
        }

        if coverage_results['success']:
            logger.info(f"✅ Coverage analysis completed in {coverage_results['duration']:.1f}s")
        else:
            logger.error(f"❌ Coverage analysis failed in {coverage_results['duration']:.1f}s")

        return coverage_results

    def run_security_scan(self) -> Dict:
        """Run security scanning tools"""
        logger.info("Running security scans...")

        security_tools = {
            'safety': ['safety', 'check', '--json', '--output', 'safety-report.json'],
            'bandit': ['bandit', '-r', '.', '-f', 'json', '-o', 'bandit-report.json'],
        }

        security_results = {}

        for tool, cmd in security_tools.items():
            try:
                logger.info(f"Running {tool} scan...")
                result = subprocess.run(
                    cmd,
                    cwd=self.backend_dir,
                    capture_output=True,
                    text=True,
                    timeout=300
                )

                security_results[tool] = {
                    'success': result.returncode == 0,
                    'stdout': result.stdout,
                    'stderr': result.stderr
                }

                if result.returncode == 0:
                    logger.info(f"✅ {tool} scan completed")
                else:
                    logger.warning(f"⚠️ {tool} scan found issues")

            except subprocess.TimeoutExpired:
                logger.error(f"❌ {tool} scan timed out")
                security_results[tool] = {'success': False, 'error': 'Timeout'}
            except FileNotFoundError:
                logger.warning(f"⚠️ {tool} not installed, skipping")
                security_results[tool] = {'success': False, 'error': 'Not installed'}

        return security_results

    def generate_summary_report(self, results: List[Dict]) -> Dict:
        """Generate comprehensive test summary report"""
        total_tests = 0
        total_passed = 0
        total_failed = 0
        total_skipped = 0
        total_duration = 0
        failed_suites = []

        for result in results:
            if 'stats' in result:
                stats = result['stats']
                total_tests += stats.get('total', 0)
                total_passed += stats.get('passed', 0)
                total_failed += stats.get('failed', 0)
                total_skipped += stats.get('skipped', 0)

            total_duration += result.get('duration', 0)

            if not result.get('success', False):
                failed_suites.append(result.get('suite', 'unknown'))

        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0

        summary = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_tests': total_tests,
            'passed': total_passed,
            'failed': total_failed,
            'skipped': total_skipped,
            'success_rate': success_rate,
            'total_duration': total_duration,
            'failed_suites': failed_suites,
            'overall_success': len(failed_suites) == 0 and success_rate >= 95
        }

        return summary

    def print_summary(self, summary: Dict, verbose: bool = False):
        """Print test summary to console"""
        print("\n" + "="*60)
        print("🧪 BACKEND TEST SUITE SUMMARY")
        print("="*60)
        print(f"📊 Total Tests: {summary['total_tests']}")
        print(f"✅ Passed: {summary['passed']}")
        print(f"❌ Failed: {summary['failed']}")
        print(f"⏭️ Skipped: {summary['skipped']}")
        print(f"📈 Success Rate: {summary['success_rate']:.1f}%")
        print(f"⏱️ Total Duration: {summary['total_duration']:.1f}s")

        if summary['failed_suites']:
            print(f"💥 Failed Suites: {', '.join(summary['failed_suites'])}")

        print("\n" + "="*60)

        if summary['overall_success']:
            print("🎉 ALL TESTS PASSED - BACKEND IS PRODUCTION READY! 🎉")
        else:
            print("🚨 SOME TESTS FAILED - REVIEW REQUIRED BEFORE DEPLOYMENT 🚨")

        print("="*60)

        # Print file locations
        print(f"\n📁 Test Reports: {self.results_dir}")
        print(f"📊 Coverage Report: {self.coverage_dir}/index.html")
        print(f"🔒 Security Reports: {self.backend_dir}/*-report.json")

def main():
    """Main test runner function"""
    parser = argparse.ArgumentParser(description='Backend Test Suite Runner')
    parser.add_argument(
        '--suite',
        choices=['all', 'core', 'blueprints', 'integration', 'performance', 'security', 'system'],
        default='all',
        help='Test suite to run'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )
    parser.add_argument(
        '--coverage',
        action='store_true',
        help='Run coverage analysis'
    )
    parser.add_argument(
        '--security',
        action='store_true',
        help='Run security scans'
    )
    parser.add_argument(
        '--fast',
        action='store_true',
        help='Skip slow tests'
    )
    parser.add_argument(
        '--production-check',
        action='store_true',
        help='Full production readiness check'
    )

    args = parser.parse_args()

    # Initialize test runner
    runner = TestRunner()

    # Setup environment
    runner.setup_environment()

    # Check dependencies
    if not runner.check_dependencies():
        sys.exit(1)

    start_time = time.time()
    all_results = []

    try:
        if args.production_check or args.suite == 'all':
            # Run all test suites
            for suite_name in runner.test_suites.keys():
                if args.fast and suite_name == 'performance':
                    logger.info("Skipping performance tests in fast mode")
                    continue

                result = runner.run_test_suite(suite_name, args.verbose)
                all_results.append(result)

        else:
            # Run specific suite
            result = runner.run_test_suite(args.suite, args.verbose)
            all_results.append(result)

        # Run coverage analysis if requested or in production check
        if args.coverage or args.production_check:
            coverage_result = runner.run_coverage_analysis()
            all_results.append({
                'suite': 'coverage',
                'success': coverage_result['success'],
                'duration': coverage_result['duration']
            })

        # Run security scans if requested or in production check
        if args.security or args.production_check:
            security_results = runner.run_security_scan()
            all_results.append({
                'suite': 'security',
                'success': all(r.get('success', False) for r in security_results.values()),
                'duration': 0
            })

        # Generate and display summary
        summary = runner.generate_summary_report(all_results)
        runner.print_summary(summary, args.verbose)

        # Save summary to file
        summary_file = runner.results_dir / 'test-summary.json'
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)

        # Exit with appropriate code
        if summary['overall_success']:
            sys.exit(0)
        else:
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("Test execution interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Test execution failed: {e}")
        sys.exit(1)
    finally:
        total_time = time.time() - start_time
        logger.info(f"Total execution time: {total_time:.1f}s")

if __name__ == '__main__':
    main()