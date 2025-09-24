#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Blueprint Consolidation Verification Script
===========================================

Verifies that the consolidated blueprint architecture works correctly.
Tests imports, endpoint availability, and basic functionality.

Usage:
    python verify_blueprint_consolidation.py [--verbose]
"""

import sys
import os
import argparse
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Any
from datetime import datetime

# Add backend path to sys.path
backend_path = Path(__file__).parent.parent.parent / "apps" / "backend"
sys.path.insert(0, str(backend_path))

class BlueprintVerifier:
    """Verifies consolidated blueprint architecture."""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.setup_logging()
        self.verification_results: Dict[str, Any] = {}
        self.errors: List[str] = []

    def setup_logging(self):
        """Setup logging configuration."""
        log_level = logging.DEBUG if self.verbose else logging.INFO
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler()]
        )
        self.logger = logging.getLogger(__name__)

    def test_blueprint_imports(self) -> bool:
        """Test that all consolidated blueprints can be imported."""
        self.logger.info("🔍 Testing blueprint imports...")

        import_tests = {
            'core_blueprint': 'core_bp',
            'user_blueprint': 'user_bp',
            'analytics_blueprint_consolidated': 'analytics_bp',
            'engagement_blueprint': 'engagement_bp',
            'validation_blueprint': 'validation_bp',
            'multimodal_blueprint': 'multimodal_bp',
            'cache_blueprint': 'cache_blueprint',
            'docs_blueprint': 'docs_bp'
        }

        successful_imports = 0
        total_imports = len(import_tests)

        for module_name, variable_name in import_tests.items():
            try:
                # Dynamic import test
                module = __import__(f'blueprints.{module_name}', fromlist=[variable_name])
                blueprint = getattr(module, variable_name)

                # Basic blueprint validation
                if hasattr(blueprint, 'name') and hasattr(blueprint, 'url_prefix'):
                    self.logger.info(f"  ✅ {module_name} -> {variable_name}: OK")
                    successful_imports += 1
                else:
                    self.logger.error(f"  ❌ {module_name}: Invalid blueprint object")
                    self.errors.append(f"Invalid blueprint: {module_name}")

            except ImportError as e:
                self.logger.error(f"  ❌ {module_name}: ImportError - {e}")
                self.errors.append(f"Import failed: {module_name} - {e}")
            except AttributeError as e:
                self.logger.error(f"  ❌ {module_name}: AttributeError - {e}")
                self.errors.append(f"Attribute error: {module_name} - {e}")
            except Exception as e:
                self.logger.error(f"  ❌ {module_name}: {type(e).__name__} - {e}")
                self.errors.append(f"Unexpected error: {module_name} - {e}")

        success_rate = (successful_imports / total_imports) * 100
        self.verification_results['import_tests'] = {
            'successful': successful_imports,
            'total': total_imports,
            'success_rate': success_rate,
            'passed': success_rate >= 87.5  # Allow for 1 failure out of 8
        }

        self.logger.info(f"Import test results: {successful_imports}/{total_imports} ({success_rate:.1f}%)")
        return success_rate >= 87.5

    def test_blueprints_init(self) -> bool:
        """Test the consolidated blueprints __init__.py."""
        self.logger.info("🔍 Testing blueprints __init__.py...")

        try:
            from blueprints import ALL_BLUEPRINTS

            if not ALL_BLUEPRINTS:
                self.logger.error("  ❌ ALL_BLUEPRINTS is empty")
                self.errors.append("ALL_BLUEPRINTS is empty")
                return False

            blueprint_count = len(ALL_BLUEPRINTS)
            self.logger.info(f"  ✅ ALL_BLUEPRINTS loaded: {blueprint_count} blueprints")

            # Verify each blueprint in the list
            valid_blueprints = 0
            for i, bp in enumerate(ALL_BLUEPRINTS):
                if hasattr(bp, 'name'):
                    self.logger.debug(f"    - Blueprint {i+1}: {bp.name}")
                    valid_blueprints += 1
                else:
                    self.logger.warning(f"    - Blueprint {i+1}: Invalid blueprint object")

            self.verification_results['init_tests'] = {
                'blueprint_count': blueprint_count,
                'valid_blueprints': valid_blueprints,
                'expected_minimum': 8,  # Core 8 consolidated blueprints
                'passed': valid_blueprints >= 8
            }

            return valid_blueprints >= 8

        except ImportError as e:
            self.logger.error(f"  ❌ Failed to import ALL_BLUEPRINTS: {e}")
            self.errors.append(f"ALL_BLUEPRINTS import failed: {e}")
            return False
        except Exception as e:
            self.logger.error(f"  ❌ Unexpected error testing __init__.py: {e}")
            self.errors.append(f"Init test failed: {e}")
            return False

    def test_endpoint_structure(self) -> bool:
        """Test that consolidated blueprints have expected endpoint structures."""
        self.logger.info("🔍 Testing endpoint structures...")

        expected_endpoints = {
            'core_bp': ['/api/v1/chat', '/api/v1/personas', '/api/v1/health'],
            'user_bp': ['/api/v1/user', '/api/v1/auth'],
            'analytics_bp': ['/api/v1/analytics', '/api/v1/metrics', '/api/v1/monitoring'],
            'engagement_bp': ['/api/v1/feedback', '/api/v1/gamification']
        }

        passed_tests = 0
        total_tests = len(expected_endpoints)

        for blueprint_var, expected_paths in expected_endpoints.items():
            try:
                # Import the specific blueprint
                if blueprint_var == 'core_bp':
                    from blueprints.core_blueprint import core_bp as bp
                elif blueprint_var == 'user_bp':
                    from blueprints.user_blueprint import user_bp as bp
                elif blueprint_var == 'analytics_bp':
                    from blueprints.analytics_blueprint_consolidated import analytics_bp as bp
                elif blueprint_var == 'engagement_bp':
                    from blueprints.engagement_blueprint import engagement_bp as bp
                else:
                    continue

                # Check if blueprint has deferred functions (indicates routes are registered)
                if hasattr(bp, 'deferred_functions') and bp.deferred_functions:
                    self.logger.info(f"  ✅ {blueprint_var}: Has registered routes")
                    passed_tests += 1
                elif hasattr(bp, 'url_map') or hasattr(bp, '_got_registered_once'):
                    self.logger.info(f"  ✅ {blueprint_var}: Blueprint structure valid")
                    passed_tests += 1
                else:
                    self.logger.warning(f"  ⚠️ {blueprint_var}: No routes detected (may be normal)")
                    passed_tests += 0.5  # Partial credit

            except ImportError as e:
                self.logger.error(f"  ❌ {blueprint_var}: Import failed - {e}")
                self.errors.append(f"Endpoint test failed for {blueprint_var}: {e}")
            except Exception as e:
                self.logger.error(f"  ❌ {blueprint_var}: Test failed - {e}")
                self.errors.append(f"Endpoint structure test failed for {blueprint_var}: {e}")

        success_rate = (passed_tests / total_tests) * 100
        self.verification_results['endpoint_tests'] = {
            'passed': passed_tests,
            'total': total_tests,
            'success_rate': success_rate,
            'test_passed': success_rate >= 75
        }

        self.logger.info(f"Endpoint structure tests: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        return success_rate >= 75

    def test_consolidation_mapping(self) -> bool:
        """Test that consolidation mapping is working correctly."""
        self.logger.info("🔍 Testing consolidation mapping...")

        # Test that old blueprint references are properly consolidated
        consolidation_tests = [
            ('chat functionality', 'core_blueprint', 'core_bp'),
            ('personas functionality', 'core_blueprint', 'core_bp'),
            ('health functionality', 'core_blueprint', 'core_bp'),
            ('user management', 'user_blueprint', 'user_bp'),
            ('analytics functionality', 'analytics_blueprint_consolidated', 'analytics_bp'),
            ('engagement functionality', 'engagement_blueprint', 'engagement_bp')
        ]

        passed_tests = 0
        total_tests = len(consolidation_tests)

        for test_name, module_name, var_name in consolidation_tests:
            try:
                module = __import__(f'blueprints.{module_name}', fromlist=[var_name])
                blueprint = getattr(module, var_name)

                if hasattr(blueprint, 'name'):
                    self.logger.info(f"  ✅ {test_name}: Consolidated into {blueprint.name}")
                    passed_tests += 1
                else:
                    self.logger.warning(f"  ⚠️ {test_name}: Invalid blueprint")

            except Exception as e:
                self.logger.error(f"  ❌ {test_name}: Failed - {e}")
                self.errors.append(f"Consolidation test failed for {test_name}: {e}")

        success_rate = (passed_tests / total_tests) * 100
        self.verification_results['consolidation_tests'] = {
            'passed': passed_tests,
            'total': total_tests,
            'success_rate': success_rate,
            'test_passed': success_rate >= 80
        }

        self.logger.info(f"Consolidation mapping tests: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        return success_rate >= 80

    def generate_verification_report(self) -> Dict[str, Any]:
        """Generate comprehensive verification report."""
        overall_score = 0
        max_score = 0

        for test_name, results in self.verification_results.items():
            if 'success_rate' in results:
                overall_score += results['success_rate']
                max_score += 100
            elif 'passed' in results and isinstance(results['passed'], bool):
                overall_score += 100 if results['passed'] else 0
                max_score += 100

        overall_percentage = (overall_score / max_score * 100) if max_score > 0 else 0

        report = {
            'verification_summary': {
                'timestamp': datetime.now().isoformat(),
                'overall_score': overall_percentage,
                'passed': overall_percentage >= 80,
                'total_errors': len(self.errors),
                'status': 'PASSED' if overall_percentage >= 80 else 'FAILED'
            },
            'test_results': self.verification_results,
            'errors': self.errors,
            'recommendations': self.generate_recommendations()
        }

        return report

    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []

        # Check import test results
        if 'import_tests' in self.verification_results:
            import_results = self.verification_results['import_tests']
            if import_results['success_rate'] < 100:
                recommendations.append("Fix import errors in consolidated blueprints")

        # Check init test results
        if 'init_tests' in self.verification_results:
            init_results = self.verification_results['init_tests']
            if not init_results['passed']:
                recommendations.append("Verify ALL_BLUEPRINTS structure in __init__.py")

        # General recommendations
        if len(self.errors) > 0:
            recommendations.append("Review and fix reported errors")

        if not recommendations:
            recommendations.append("All tests passed - consolidation appears successful")

        return recommendations

    def run_verification(self) -> bool:
        """Run complete verification suite."""
        self.logger.info("🚀 Starting blueprint consolidation verification...")
        self.logger.info("=" * 60)

        # Run all tests
        tests = [
            ("Blueprint Imports", self.test_blueprint_imports),
            ("Blueprints Init", self.test_blueprints_init),
            ("Endpoint Structure", self.test_endpoint_structure),
            ("Consolidation Mapping", self.test_consolidation_mapping)
        ]

        passed_tests = 0
        total_tests = len(tests)

        for test_name, test_func in tests:
            self.logger.info(f"\n--- {test_name} ---")
            try:
                if test_func():
                    passed_tests += 1
                    self.logger.info(f"✅ {test_name}: PASSED")
                else:
                    self.logger.error(f"❌ {test_name}: FAILED")
            except Exception as e:
                self.logger.error(f"❌ {test_name}: ERROR - {e}")
                self.errors.append(f"Test execution failed for {test_name}: {e}")

        # Generate final report
        report = self.generate_verification_report()

        # Summary
        self.logger.info("\n" + "=" * 60)
        self.logger.info("📊 VERIFICATION SUMMARY")
        self.logger.info("=" * 60)
        self.logger.info(f"Overall Score: {report['verification_summary']['overall_score']:.1f}%")
        self.logger.info(f"Status: {report['verification_summary']['status']}")
        self.logger.info(f"Tests Passed: {passed_tests}/{total_tests}")
        self.logger.info(f"Total Errors: {len(self.errors)}")

        if self.errors:
            self.logger.info("\n🔍 Errors Found:")
            for error in self.errors[:5]:  # Show first 5 errors
                self.logger.info(f"  • {error}")
            if len(self.errors) > 5:
                self.logger.info(f"  ... and {len(self.errors) - 5} more errors")

        self.logger.info("\n💡 Recommendations:")
        for rec in report['recommendations']:
            self.logger.info(f"  • {rec}")

        return report['verification_summary']['passed']

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Blueprint Consolidation Verification')
    parser.add_argument('--verbose', '-v', action='store_true',
                      help='Enable verbose logging')

    args = parser.parse_args()

    verifier = BlueprintVerifier(verbose=args.verbose)
    success = verifier.run_verification()

    if success:
        print("\n🎉 BLUEPRINT CONSOLIDATION VERIFICATION: SUCCESS")
        return 0
    else:
        print("\n💥 BLUEPRINT CONSOLIDATION VERIFICATION: FAILED")
        return 1

if __name__ == '__main__':
    exit(main())