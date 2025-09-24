#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Memory Optimization Validation Script
====================================

Validates that the medical system memory optimization achieved the <50% target.
Comprehensive testing of all memory optimization systems.

Target: <50% system memory usage for medical system safety
Priority: CRITICAL - Medical System Validation
Author: Claude Code - Memory Optimization Validation
Date: 2025-09-24
"""

import os
import sys
import gc
import time
import json
import logging
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import psutil for system monitoring
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("PSUtil not available - using basic monitoring")

class MemoryOptimizationValidator:
    """
    Comprehensive validator for memory optimization systems

    Validates all components:
    1. Emergency Memory Reducer
    2. Medical Cache Optimizer
    3. Memory-Optimized RAG
    4. Lightweight Vector Store
    5. Overall system memory usage
    """

    def __init__(self):
        self.target_memory_percent = 50.0
        self.validation_results = {}
        self.system_baseline = None
        self.optimization_results = {}

        logger.info(f"[VALIDATOR] Memory Optimization Validator initialized - Target: <{self.target_memory_percent}%")

    def get_system_memory_info(self) -> Dict[str, Any]:
        """Get comprehensive system memory information"""
        try:
            if PSUTIL_AVAILABLE:
                # System memory
                system_memory = psutil.virtual_memory()

                # Process memory
                process = psutil.Process(os.getpid())
                process_memory = process.memory_info()

                return {
                    'timestamp': datetime.now().isoformat(),
                    'system': {
                        'total_gb': round(system_memory.total / (1024**3), 2),
                        'used_gb': round(system_memory.used / (1024**3), 2),
                        'available_gb': round(system_memory.available / (1024**3), 2),
                        'percent': system_memory.percent
                    },
                    'process': {
                        'rss_mb': round(process_memory.rss / (1024**2), 1),
                        'vms_mb': round(process_memory.vms / (1024**2), 1),
                        'percent': round(process.memory_percent(), 1)
                    },
                    'python_objects': len(gc.get_objects())
                }
            else:
                # Fallback monitoring
                import resource
                usage = resource.getrusage(resource.RUSAGE_SELF)

                return {
                    'timestamp': datetime.now().isoformat(),
                    'system': {
                        'available': False,
                        'note': 'PSUtil not available'
                    },
                    'process': {
                        'rss_mb': round(usage.ru_maxrss / 1024, 1),  # KB to MB
                        'percent': 'N/A'
                    },
                    'python_objects': len(gc.get_objects())
                }

        except Exception as e:
            logger.error(f"[VALIDATOR] Failed to get memory info: {e}")
            return {'error': str(e), 'timestamp': datetime.now().isoformat()}

    def validate_emergency_memory_reducer(self) -> Dict[str, Any]:
        """Validate Emergency Memory Reducer system"""
        logger.info("[VALIDATOR] Testing Emergency Memory Reducer...")

        try:
            from core.performance.emergency_memory_reducer import (
                get_emergency_reducer,
                execute_emergency_memory_reduction,
                is_memory_critical
            )

            # Test emergency reducer
            reducer = get_emergency_reducer()

            # Get initial status
            initial_status = reducer.get_emergency_status()

            # Execute emergency reduction
            reduction_result = execute_emergency_memory_reduction()

            # Get final status
            final_status = reducer.get_emergency_status()

            validation_result = {
                'system': 'Emergency Memory Reducer',
                'available': True,
                'initial_status': initial_status,
                'reduction_result': reduction_result,
                'final_status': final_status,
                'validation': {
                    'reducer_active': initial_status.get('emergency_reducer', {}).get('active', False),
                    'reduction_successful': reduction_result.get('success', False),
                    'memory_freed': reduction_result.get('memory_freed_mb', 0),
                    'target_achieved': reduction_result.get('target_achieved', False)
                },
                'test_passed': reduction_result.get('success', False)
            }

            logger.info(f"[VALIDATOR] Emergency Memory Reducer: {'PASS' if validation_result['test_passed'] else 'FAIL'}")
            return validation_result

        except Exception as e:
            logger.error(f"[VALIDATOR] Emergency Memory Reducer validation failed: {e}")
            return {
                'system': 'Emergency Memory Reducer',
                'available': False,
                'error': str(e),
                'test_passed': False
            }

    def validate_medical_cache_optimizer(self) -> Dict[str, Any]:
        """Validate Medical Cache Optimizer system"""
        logger.info("[VALIDATOR] Testing Medical Cache Optimizer...")

        try:
            from core.performance.medical_cache_optimizer import (
                get_medical_cache,
                cache_medical_response,
                get_cached_medical_response,
                emergency_clear_medical_cache
            )

            # Test medical cache
            medical_cache = get_medical_cache(max_memory_mb=5.0)  # 5MB limit

            # Test caching functionality
            test_query = "What is the standard dose of rifampicina?"
            test_response = {"answer": "600mg daily", "confidence": 0.95}

            # Cache a medical response
            cache_success = cache_medical_response(
                query=test_query,
                response=test_response,
                persona='dr_gasnelio',
                priority='critical'
            )

            # Retrieve cached response
            cached_result = get_cached_medical_response(test_query, 'dr_gasnelio')

            # Get medical stats
            medical_stats = medical_cache.get_medical_stats()

            # Force optimization
            optimization_result = medical_cache.force_medical_optimization()

            # Emergency clear
            clear_result = emergency_clear_medical_cache()

            validation_result = {
                'system': 'Medical Cache Optimizer',
                'available': True,
                'cache_test': {
                    'cache_success': cache_success,
                    'retrieval_success': cached_result is not None,
                    'data_match': cached_result == test_response if cached_result else False
                },
                'medical_stats': medical_stats,
                'optimization_result': optimization_result,
                'clear_result': clear_result,
                'validation': {
                    'memory_within_limit': medical_stats.get('memory', {}).get('usage_mb', 0) <= 5.0,
                    'caching_functional': cache_success and cached_result is not None,
                    'emergency_clear_works': clear_result.get('status') == 'emergency_clear_completed'
                },
                'test_passed': all([
                    medical_stats.get('memory', {}).get('usage_mb', 0) <= 5.0,
                    cache_success,
                    cached_result is not None
                ])
            }

            logger.info(f"[VALIDATOR] Medical Cache Optimizer: {'PASS' if validation_result['test_passed'] else 'FAIL'}")
            return validation_result

        except Exception as e:
            logger.error(f"[VALIDATOR] Medical Cache Optimizer validation failed: {e}")
            return {
                'system': 'Medical Cache Optimizer',
                'available': False,
                'error': str(e),
                'test_passed': False
            }

    def validate_memory_optimized_rag(self) -> Dict[str, Any]:
        """Validate Memory-Optimized RAG system"""
        logger.info("[VALIDATOR] Testing Memory-Optimized RAG...")

        try:
            from services.rag.memory_optimized_rag import (
                get_memory_optimized_rag,
                get_medical_context,
                clear_medical_memory
            )

            # Test memory-optimized RAG
            memory_rag = get_memory_optimized_rag()

            # Test context retrieval
            test_query = "Como tratar hanseníase?"
            context_result = get_medical_context(test_query, max_chunks=2, persona='dr_gasnelio')

            # Get memory stats
            memory_stats = memory_rag.get_memory_stats()

            # Force memory reduction
            memory_reduction = memory_rag.force_memory_reduction()

            # Clear medical memory
            clear_result = clear_medical_memory()

            validation_result = {
                'system': 'Memory-Optimized RAG',
                'available': True,
                'context_test': {
                    'query': test_query,
                    'context_retrieved': context_result is not None and len(context_result) > 0,
                    'context_length': len(context_result) if context_result else 0
                },
                'memory_stats': memory_stats,
                'memory_reduction': memory_reduction,
                'validation': {
                    'memory_within_limit': memory_stats.get('max_memory_mb', 0) <= 15,  # 15MB limit
                    'context_functional': context_result is not None,
                    'memory_pressure_handled': not memory_stats.get('memory_pressure', True)
                },
                'test_passed': all([
                    context_result is not None,
                    memory_stats.get('max_memory_mb', 0) <= 15
                ])
            }

            logger.info(f"[VALIDATOR] Memory-Optimized RAG: {'PASS' if validation_result['test_passed'] else 'FAIL'}")
            return validation_result

        except Exception as e:
            logger.error(f"[VALIDATOR] Memory-Optimized RAG validation failed: {e}")
            return {
                'system': 'Memory-Optimized RAG',
                'available': False,
                'error': str(e),
                'test_passed': False
            }

    def validate_lightweight_vector_store(self) -> Dict[str, Any]:
        """Validate Lightweight Vector Store system"""
        logger.info("[VALIDATOR] Testing Lightweight Vector Store...")

        try:
            from services.rag.lightweight_vector_store import (
                get_lightweight_vector_store,
                clear_lightweight_vector_memory
            )
            import numpy as np

            # Test lightweight vector store
            vector_store = get_lightweight_vector_store(max_memory_mb=2.0)  # 2MB limit

            # Test vector operations
            test_vector = np.random.rand(384).astype(np.float32)  # Common embedding size
            test_text = "Hanseníase é uma doença infecciosa causada pelo Mycobacterium leprae"

            # Add vector
            vector_id = vector_store.add_vector(
                text=test_text,
                vector=test_vector,
                metadata={'source': 'test'},
                medical_priority='important'
            )

            # Search similar vectors
            search_results = vector_store.search_similar(
                query_vector=test_vector,
                top_k=5,
                min_score=0.5
            )

            # Get statistics
            vector_stats = vector_store.get_stats()

            # Force memory optimization
            optimization_result = vector_store.force_memory_optimization()

            # Clear memory
            clear_result = clear_lightweight_vector_memory()

            validation_result = {
                'system': 'Lightweight Vector Store',
                'available': True,
                'vector_test': {
                    'add_success': vector_id is not None,
                    'search_success': len(search_results) > 0,
                    'search_results_count': len(search_results)
                },
                'vector_stats': vector_stats,
                'optimization_result': optimization_result,
                'validation': {
                    'memory_within_limit': vector_stats.get('memory_usage_mb', 0) <= 2.0,
                    'vector_operations_work': vector_id is not None and len(search_results) > 0,
                    'optimization_functional': optimization_result.get('optimization_performed', False)
                },
                'test_passed': all([
                    vector_id is not None,
                    vector_stats.get('memory_usage_mb', 0) <= 2.0
                ])
            }

            logger.info(f"[VALIDATOR] Lightweight Vector Store: {'PASS' if validation_result['test_passed'] else 'FAIL'}")
            return validation_result

        except Exception as e:
            logger.error(f"[VALIDATOR] Lightweight Vector Store validation failed: {e}")
            return {
                'system': 'Lightweight Vector Store',
                'available': False,
                'error': str(e),
                'test_passed': False
            }

    def run_system_memory_stress_test(self) -> Dict[str, Any]:
        """Run system memory stress test to validate optimization"""
        logger.info("[VALIDATOR] Running system memory stress test...")

        try:
            # Get baseline memory
            baseline_memory = self.get_system_memory_info()

            # Create some memory pressure (controlled)
            test_data = []
            for i in range(1000):
                test_data.append({
                    'id': i,
                    'data': 'x' * 1000,  # 1KB per item = 1MB total
                    'timestamp': datetime.now().isoformat()
                })

            # Get memory after allocation
            stress_memory = self.get_system_memory_info()

            # Clear test data
            test_data.clear()
            del test_data

            # Force garbage collection
            collected = gc.collect()

            # Get memory after cleanup
            cleanup_memory = self.get_system_memory_info()

            # Wait a bit for system to stabilize
            time.sleep(2)

            # Get final memory
            final_memory = self.get_system_memory_info()

            stress_test_result = {
                'system': 'Memory Stress Test',
                'baseline_memory': baseline_memory,
                'stress_memory': stress_memory,
                'cleanup_memory': cleanup_memory,
                'final_memory': final_memory,
                'gc_collected': collected,
                'validation': {
                    'memory_recovered': True,  # We'll calculate this below
                    'final_memory_acceptable': True,  # We'll calculate this below
                    'gc_effective': collected > 0
                }
            }

            # Calculate if memory was recovered
            if PSUTIL_AVAILABLE:
                baseline_percent = baseline_memory.get('system', {}).get('percent', 100)
                final_percent = final_memory.get('system', {}).get('percent', 100)

                stress_test_result['validation']['memory_recovered'] = final_percent <= baseline_percent + 5
                stress_test_result['validation']['final_memory_acceptable'] = final_percent < self.target_memory_percent
                stress_test_result['final_memory_percent'] = final_percent

            stress_test_result['test_passed'] = all(stress_test_result['validation'].values())

            logger.info(f"[VALIDATOR] Memory Stress Test: {'PASS' if stress_test_result['test_passed'] else 'FAIL'}")
            return stress_test_result

        except Exception as e:
            logger.error(f"[VALIDATOR] Memory stress test failed: {e}")
            return {
                'system': 'Memory Stress Test',
                'available': False,
                'error': str(e),
                'test_passed': False
            }

    def validate_overall_system_memory(self) -> Dict[str, Any]:
        """Validate overall system memory usage against target"""
        logger.info(f"[VALIDATOR] Validating overall system memory against <{self.target_memory_percent}% target...")

        try:
            # Get current system memory
            current_memory = self.get_system_memory_info()

            # Check if target is met
            if PSUTIL_AVAILABLE:
                system_percent = current_memory.get('system', {}).get('percent', 100)
                process_percent = current_memory.get('process', {}).get('percent', 100)

                target_met = system_percent < self.target_memory_percent
                process_reasonable = process_percent < 20  # Process should use <20% of system memory

                validation_result = {
                    'system': 'Overall System Memory',
                    'target_percent': self.target_memory_percent,
                    'current_memory': current_memory,
                    'validation': {
                        'system_target_met': target_met,
                        'process_reasonable': process_reasonable,
                        'system_percent': system_percent,
                        'process_percent': process_percent
                    },
                    'test_passed': target_met and process_reasonable,
                    'status': 'PASS' if target_met and process_reasonable else 'FAIL'
                }

                if target_met:
                    logger.info(f"[VALIDATOR] SUCCESS: System memory at {system_percent:.1f}% - BELOW target of {self.target_memory_percent}%")
                else:
                    logger.error(f"[VALIDATOR] FAILURE: System memory at {system_percent:.1f}% - ABOVE target of {self.target_memory_percent}%")

            else:
                # Fallback validation without psutil
                validation_result = {
                    'system': 'Overall System Memory',
                    'target_percent': self.target_memory_percent,
                    'current_memory': current_memory,
                    'validation': {
                        'system_target_met': False,  # Can't verify without psutil
                        'psutil_available': False,
                        'note': 'Cannot verify system memory target without psutil'
                    },
                    'test_passed': False,  # Fail if we can't verify
                    'status': 'UNKNOWN'
                }

                logger.warning("[VALIDATOR] Cannot validate system memory target without psutil")

            return validation_result

        except Exception as e:
            logger.error(f"[VALIDATOR] Overall system memory validation failed: {e}")
            return {
                'system': 'Overall System Memory',
                'available': False,
                'error': str(e),
                'test_passed': False
            }

    def run_full_validation(self) -> Dict[str, Any]:
        """Run complete memory optimization validation"""
        logger.info("[VALIDATOR] Starting FULL memory optimization validation...")

        validation_start = datetime.now()

        # Get initial system state
        self.system_baseline = self.get_system_memory_info()
        logger.info(f"[VALIDATOR] System baseline memory: {self.system_baseline}")

        # Run all validation tests
        validation_tests = [
            ('emergency_memory_reducer', self.validate_emergency_memory_reducer),
            ('medical_cache_optimizer', self.validate_medical_cache_optimizer),
            ('memory_optimized_rag', self.validate_memory_optimized_rag),
            ('lightweight_vector_store', self.validate_lightweight_vector_store),
            ('system_memory_stress_test', self.run_system_memory_stress_test),
            ('overall_system_memory', self.validate_overall_system_memory)
        ]

        validation_results = {}
        passed_tests = 0
        total_tests = len(validation_tests)

        for test_name, test_function in validation_tests:
            try:
                logger.info(f"[VALIDATOR] Running test: {test_name}")
                test_result = test_function()
                validation_results[test_name] = test_result

                if test_result.get('test_passed', False):
                    passed_tests += 1
                    logger.info(f"[VALIDATOR] ✅ {test_name}: PASSED")
                else:
                    logger.error(f"[VALIDATOR] ❌ {test_name}: FAILED")

            except Exception as e:
                logger.error(f"[VALIDATOR] Test {test_name} crashed: {e}")
                validation_results[test_name] = {
                    'system': test_name,
                    'error': str(e),
                    'test_passed': False,
                    'crashed': True
                }

        # Calculate final results
        validation_duration = (datetime.now() - validation_start).total_seconds()
        success_rate = (passed_tests / total_tests) * 100

        final_memory = self.get_system_memory_info()

        # Overall validation result
        overall_success = (
            passed_tests >= total_tests * 0.8 and  # At least 80% tests pass
            validation_results.get('overall_system_memory', {}).get('test_passed', False)  # Memory target met
        )

        final_result = {
            'validation_summary': {
                'start_time': validation_start.isoformat(),
                'duration_seconds': round(validation_duration, 2),
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': total_tests - passed_tests,
                'success_rate_percent': round(success_rate, 1),
                'overall_success': overall_success,
                'target_memory_percent': self.target_memory_percent
            },
            'system_memory': {
                'baseline': self.system_baseline,
                'final': final_memory
            },
            'individual_test_results': validation_results,
            'recommendations': self._generate_recommendations(validation_results),
            'timestamp': datetime.now().isoformat()
        }

        # Log final results
        if overall_success:
            logger.info(f"[VALIDATOR] 🎉 VALIDATION SUCCESS: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
            logger.info(f"[VALIDATOR] 🎯 MEMORY TARGET ACHIEVED: System memory optimized for medical safety")
        else:
            logger.error(f"[VALIDATOR] 💥 VALIDATION FAILURE: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
            logger.error(f"[VALIDATOR] ⚠️ MEMORY TARGET NOT MET: System requires additional optimization")

        return final_result

    def _generate_recommendations(self, validation_results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on validation results"""
        recommendations = []

        # Check each system
        for test_name, result in validation_results.items():
            if not result.get('test_passed', False):
                if test_name == 'emergency_memory_reducer':
                    recommendations.append("Emergency Memory Reducer needs attention - critical for medical safety")
                elif test_name == 'medical_cache_optimizer':
                    recommendations.append("Medical Cache Optimizer requires fixes - impacts response time")
                elif test_name == 'memory_optimized_rag':
                    recommendations.append("Memory-Optimized RAG system needs optimization")
                elif test_name == 'lightweight_vector_store':
                    recommendations.append("Lightweight Vector Store requires memory tuning")
                elif test_name == 'system_memory_stress_test':
                    recommendations.append("System memory recovery is insufficient under stress")
                elif test_name == 'overall_system_memory':
                    recommendations.append(f"CRITICAL: System memory above {self.target_memory_percent}% target - immediate action required")

        # General recommendations
        if len(recommendations) == 0:
            recommendations.append("All memory optimization systems are functioning correctly")
            recommendations.append("Memory target achieved - system safe for medical operation")
        else:
            recommendations.append("Consider running emergency memory reduction before deployment")
            recommendations.append("Monitor system memory continuously during operation")

        return recommendations

    def save_validation_report(self, results: Dict[str, Any], filename: str = None) -> str:
        """Save validation results to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"memory_validation_report_{timestamp}.json"

        report_path = os.path.join(os.getcwd(), "qa-reports", filename)
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, default=str)

            logger.info(f"[VALIDATOR] Validation report saved: {report_path}")
            return report_path

        except Exception as e:
            logger.error(f"[VALIDATOR] Failed to save report: {e}")
            return None


def main():
    """Main validation function"""
    logger.info("=" * 80)
    logger.info("MEMORY OPTIMIZATION VALIDATION - MEDICAL SYSTEM SAFETY")
    logger.info("=" * 80)
    logger.info("Target: Reduce memory usage from 85-88% to <50%")
    logger.info("Priority: CRITICAL - Medical system must operate safely")
    logger.info("=" * 80)

    try:
        # Create validator
        validator = MemoryOptimizationValidator()

        # Run full validation
        results = validator.run_full_validation()

        # Save report
        report_path = validator.save_validation_report(results)

        # Print summary
        print("\n" + "=" * 80)
        print("MEMORY OPTIMIZATION VALIDATION SUMMARY")
        print("=" * 80)

        summary = results['validation_summary']
        print(f"Tests Run: {summary['total_tests']}")
        print(f"Tests Passed: {summary['passed_tests']}")
        print(f"Tests Failed: {summary['failed_tests']}")
        print(f"Success Rate: {summary['success_rate_percent']}%")
        print(f"Overall Result: {'✅ SUCCESS' if summary['overall_success'] else '❌ FAILURE'}")
        print(f"Memory Target: <{summary['target_memory_percent']}%")

        if PSUTIL_AVAILABLE:
            final_memory = results['system_memory']['final']
            current_percent = final_memory.get('system', {}).get('percent', 'N/A')
            print(f"Current Memory: {current_percent}%")

        print("\nRecommendations:")
        for i, rec in enumerate(results['recommendations'], 1):
            print(f"{i}. {rec}")

        if report_path:
            print(f"\nDetailed report saved: {report_path}")

        print("=" * 80)

        # Return appropriate exit code
        return 0 if summary['overall_success'] else 1

    except Exception as e:
        logger.error(f"[VALIDATOR] Validation crashed: {e}")
        print(f"\n❌ VALIDATION CRASHED: {e}")
        return 2


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)