# -*- coding: utf-8 -*-
"""
Medical Lazy Loader - Intelligent Module Loading for Medical Systems
===================================================================

Implements intelligent lazy loading specifically for medical applications,
ensuring critical modules load immediately while deferring heavy modules.

Critical for maintaining <50% memory usage in medical systems.
"""

import gc
import time
import logging
import threading
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime
from functools import wraps

logger = logging.getLogger(__name__)

class MedicalLazyLoader:
    """
    Intelligent lazy loader for medical system modules

    Features:
    - Critical vs non-critical module classification
    - Memory impact tracking
    - Load-on-demand with caching
    - Medical system priority handling
    """

    def __init__(self):
        self.loaded_modules = {}
        self.module_registry = {}
        self.load_times = {}
        self.memory_impacts = {}
        self.access_counts = {}
        self.critical_modules = set()
        self.lock = threading.RLock()

        # Initialize critical medical modules
        self._define_critical_modules()

    def _define_critical_modules(self):
        """Define which modules are critical for medical operations"""
        self.critical_modules = {
            # Core medical functionality
            'medical_validation',
            'health_monitoring',
            'emergency_response',
            'patient_safety',
            'dosing_calculator',
            'drug_interactions',
            'allergy_checker',

            # Security and compliance
            'authentication',
            'authorization',
            'audit_logging',
            'data_encryption',
            'hipaa_compliance',

            # Core system functionality
            'error_handling',
            'logging',
            'monitoring',
            'health_checks',
            'database_core',

            # Essential API functionality
            'core_endpoints',
            'health_endpoints',
            'user_management'
        }

        logger.info(f"[MEDICAL LAZY] Critical modules defined: {len(self.critical_modules)}")

    def register_module(self, module_name: str, loader_func: Callable,
                       is_critical: bool = False, description: str = ""):
        """Register a module for lazy loading"""
        with self.lock:
            self.module_registry[module_name] = {
                'loader': loader_func,
                'is_critical': is_critical,
                'description': description,
                'registered_at': datetime.now(),
                'loaded': False,
                'load_attempts': 0
            }

            if is_critical:
                self.critical_modules.add(module_name)

            self.access_counts[module_name] = 0

            logger.info(f"[MEDICAL LAZY] Registered {module_name} - "
                       f"Critical: {is_critical} - {description}")

    def load_module(self, module_name: str, force_reload: bool = False) -> Optional[Any]:
        """Load a module with memory tracking"""
        with self.lock:
            # Check if already loaded
            if module_name in self.loaded_modules and not force_reload:
                self.access_counts[module_name] += 1
                return self.loaded_modules[module_name]

            # Check if module is registered
            if module_name not in self.module_registry:
                logger.error(f"[MEDICAL LAZY] Module {module_name} not registered")
                return None

            module_info = self.module_registry[module_name]
            module_info['load_attempts'] += 1

            # Measure memory before loading
            memory_before = self._get_memory_usage()
            load_start = time.time()

            try:
                logger.info(f"[MEDICAL LAZY] Loading {module_name} - "
                           f"Critical: {module_info['is_critical']} - "
                           f"Attempt: {module_info['load_attempts']}")

                # Load the module
                loaded_module = module_info['loader']()

                # Measure impact
                load_time = time.time() - load_start
                memory_after = self._get_memory_usage()
                memory_impact = memory_after - memory_before

                # Store results
                self.loaded_modules[module_name] = loaded_module
                self.load_times[module_name] = load_time
                self.memory_impacts[module_name] = memory_impact
                self.access_counts[module_name] += 1

                module_info['loaded'] = True
                module_info['loaded_at'] = datetime.now()

                logger.info(f"[MEDICAL LAZY] Loaded {module_name} successfully - "
                           f"Time: {load_time:.2f}s - Memory: +{memory_impact:.1f}MB")

                # Alert if non-critical module has high impact
                if not module_info['is_critical'] and memory_impact > 10:
                    logger.warning(f"[MEDICAL LAZY] High memory impact for non-critical module "
                                 f"{module_name}: +{memory_impact:.1f}MB")

                return loaded_module

            except Exception as e:
                logger.error(f"[MEDICAL LAZY] Failed to load {module_name}: {e}")
                return None

    def load_critical_modules(self):
        """Load all critical modules immediately"""
        logger.info("[MEDICAL LAZY] Loading critical modules")

        critical_count = 0
        failed_count = 0

        for module_name in self.critical_modules:
            if module_name in self.module_registry:
                result = self.load_module(module_name)
                if result is not None:
                    critical_count += 1
                else:
                    failed_count += 1

        logger.info(f"[MEDICAL LAZY] Critical modules loaded: {critical_count} success, "
                   f"{failed_count} failed")

        if failed_count > 0:
            logger.error(f"[MEDICAL LAZY] CRITICAL: {failed_count} critical modules failed to load")

    def unload_module(self, module_name: str) -> bool:
        """Unload a non-critical module to free memory"""
        with self.lock:
            if module_name in self.critical_modules:
                logger.warning(f"[MEDICAL LAZY] Cannot unload critical module: {module_name}")
                return False

            if module_name not in self.loaded_modules:
                return True  # Already unloaded

            try:
                # Remove from loaded modules
                del self.loaded_modules[module_name]

                # Mark as unloaded in registry
                if module_name in self.module_registry:
                    self.module_registry[module_name]['loaded'] = False

                # Force garbage collection
                gc.collect()

                logger.info(f"[MEDICAL LAZY] Unloaded non-critical module: {module_name}")
                return True

            except Exception as e:
                logger.error(f"[MEDICAL LAZY] Failed to unload {module_name}: {e}")
                return False

    def emergency_unload(self) -> float:
        """Emergency unload of non-critical modules"""
        logger.warning("[MEDICAL LAZY] Emergency unload initiated")

        memory_before = self._get_memory_usage()
        unloaded_count = 0

        # Unload non-critical modules with low access counts
        modules_to_unload = []
        for module_name in self.loaded_modules:
            if (module_name not in self.critical_modules and
                self.access_counts.get(module_name, 0) < 5):
                modules_to_unload.append(module_name)

        for module_name in modules_to_unload:
            if self.unload_module(module_name):
                unloaded_count += 1

        memory_after = self._get_memory_usage()
        memory_freed = memory_before - memory_after

        logger.warning(f"[MEDICAL LAZY] Emergency unload completed - "
                      f"Unloaded {unloaded_count} modules - "
                      f"Freed {memory_freed:.1f}MB")

        return memory_freed

    def get_module_stats(self) -> Dict[str, Any]:
        """Get comprehensive module loading statistics"""
        with self.lock:
            total_modules = len(self.module_registry)
            loaded_modules = len(self.loaded_modules)
            critical_loaded = sum(1 for name in self.loaded_modules
                                if name in self.critical_modules)

            total_memory_impact = sum(self.memory_impacts.values())
            total_load_time = sum(self.load_times.values())

            # Module categories
            module_categories = {
                'critical': [],
                'non_critical': [],
                'high_memory': [],
                'frequently_accessed': []
            }

            for module_name, module_info in self.module_registry.items():
                if module_info['is_critical']:
                    module_categories['critical'].append(module_name)
                else:
                    module_categories['non_critical'].append(module_name)

                memory_impact = self.memory_impacts.get(module_name, 0)
                if memory_impact > 5:  # > 5MB
                    module_categories['high_memory'].append({
                        'name': module_name,
                        'memory_mb': memory_impact
                    })

                access_count = self.access_counts.get(module_name, 0)
                if access_count > 10:
                    module_categories['frequently_accessed'].append({
                        'name': module_name,
                        'access_count': access_count
                    })

            return {
                'summary': {
                    'total_registered': total_modules,
                    'total_loaded': loaded_modules,
                    'critical_loaded': critical_loaded,
                    'load_ratio': loaded_modules / total_modules if total_modules > 0 else 0,
                    'total_memory_impact_mb': total_memory_impact,
                    'total_load_time_s': total_load_time
                },
                'categories': module_categories,
                'top_memory_consumers': sorted(
                    [{'name': name, 'memory_mb': impact}
                     for name, impact in self.memory_impacts.items()],
                    key=lambda x: x['memory_mb'],
                    reverse=True
                )[:10],
                'most_accessed': sorted(
                    [{'name': name, 'count': count}
                     for name, count in self.access_counts.items()],
                    key=lambda x: x['count'],
                    reverse=True
                )[:10],
                'timestamp': datetime.now().isoformat()
            }

    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        try:
            import psutil
            import os
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / (1024 * 1024)
        except:
            return 0.0

    def medical_priority_load(self, module_list: List[str]):
        """Load modules in medical priority order"""
        # Sort by priority: critical first, then by access count
        sorted_modules = sorted(
            module_list,
            key=lambda name: (
                0 if name in self.critical_modules else 1,  # Critical first
                -self.access_counts.get(name, 0)  # Then by access count (desc)
            )
        )

        loaded_count = 0
        for module_name in sorted_modules:
            if self.load_module(module_name):
                loaded_count += 1

        logger.info(f"[MEDICAL LAZY] Priority load completed: {loaded_count}/{len(module_list)}")


def lazy_load_medical_module(module_name: str, is_critical: bool = False):
    """Decorator for lazy loading medical modules"""
    def decorator(loader_func):
        # Register the module
        get_medical_lazy_loader().register_module(
            module_name=module_name,
            loader_func=loader_func,
            is_critical=is_critical,
            description=f"Lazy loaded module: {module_name}"
        )

        @wraps(loader_func)
        def wrapper(*args, **kwargs):
            # Load module on first access
            return get_medical_lazy_loader().load_module(module_name)

        return wrapper
    return decorator


def medical_module_required(module_name: str):
    """Decorator to ensure a medical module is loaded before function execution"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            loader = get_medical_lazy_loader()

            # Ensure module is loaded
            module = loader.load_module(module_name)
            if module is None:
                raise RuntimeError(f"Required medical module {module_name} failed to load")

            return func(*args, **kwargs)
        return wrapper
    return decorator


# Global medical lazy loader instance
_medical_lazy_loader = None

def get_medical_lazy_loader() -> MedicalLazyLoader:
    """Get global medical lazy loader instance"""
    global _medical_lazy_loader
    if _medical_lazy_loader is None:
        _medical_lazy_loader = MedicalLazyLoader()
    return _medical_lazy_loader

def initialize_medical_lazy_loading():
    """Initialize medical lazy loading system"""
    loader = get_medical_lazy_loader()

    # Load critical modules immediately
    loader.load_critical_modules()

    logger.info("[MEDICAL LAZY] Medical lazy loading system initialized")
    return loader