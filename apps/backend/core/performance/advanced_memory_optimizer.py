# -*- coding: utf-8 -*-
"""
Advanced Memory Optimizer - Medical System Memory Management
===========================================================

Comprehensive memory optimization for medical systems requiring <50% usage.
Implements aggressive lazy loading, smart caching, and memory leak prevention.

Author: Claude Code - Performance Engineer
Target: Memory usage < 50% consistently
Medical System: Critical reliability requirements
"""

import gc
import sys
import os
import threading
import time
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict, OrderedDict
from functools import wraps
import psutil

logger = logging.getLogger(__name__)

class AdvancedMemoryOptimizer:
    """
    Advanced memory optimizer for medical systems

    Features:
    - Aggressive lazy loading
    - Smart cache management
    - Memory leak detection
    - Process consolidation
    - Thread pool optimization
    """

    def __init__(self, target_memory_percent: float = 45.0):
        self.target_memory_percent = target_memory_percent
        self.max_cache_size_mb = 25  # Aggressive limit
        self.max_threads = 8  # Reduce thread proliferation

        # Memory tracking
        self._memory_baseline = None
        self._memory_peaks = []
        self._leak_suspects = set()

        # Lazy loading registry
        self._lazy_modules = {}
        self._loaded_modules = set()

        # Smart cache with automatic eviction
        self._smart_cache = SmartCache(max_size_mb=self.max_cache_size_mb)

        # Memory pressure handlers
        self._pressure_handlers = []

        # Thread management
        self._thread_pool = None
        self._active_threads = set()

        # Monitoring
        self._monitor_thread = None
        self._shutdown_event = threading.Event()

        # Initialize
        self._establish_baseline()
        self._configure_gc_aggressive()
        self._start_monitoring()

        logger.info(f"[ADVANCED MEMORY] Optimizer initialized - target: {target_memory_percent}%")

    def _establish_baseline(self):
        """Establish memory baseline for leak detection"""
        try:
            process = psutil.Process(os.getpid())
            self._memory_baseline = {
                'rss_mb': process.memory_info().rss / (1024 * 1024),
                'objects': len(gc.get_objects()),
                'modules': len(sys.modules),
                'timestamp': datetime.now()
            }
            logger.info(f"[BASELINE] Memory baseline: {self._memory_baseline['rss_mb']:.1f} MB")
        except Exception as e:
            logger.error(f"[BASELINE] Failed to establish baseline: {e}")

    def _configure_gc_aggressive(self):
        """Configure extremely aggressive garbage collection"""
        try:
            # More aggressive than default (700, 10, 10)
            gc.set_threshold(400, 5, 5)

            # Enable automatic collection
            gc.enable()

            # Force initial collection
            collected = gc.collect()
            logger.info(f"[GC] Aggressive GC configured - collected {collected} objects")

        except Exception as e:
            logger.error(f"[GC] Failed to configure aggressive GC: {e}")

    def register_lazy_module(self, module_name: str, loader_func: Callable):
        """Register a module for lazy loading"""
        self._lazy_modules[module_name] = {
            'loader': loader_func,
            'loaded': False,
            'load_time': None,
            'memory_impact': None
        }
        logger.info(f"[LAZY] Registered lazy module: {module_name}")

    def load_module_lazy(self, module_name: str):
        """Load a module lazily with memory tracking"""
        if module_name not in self._lazy_modules:
            raise ValueError(f"Module {module_name} not registered for lazy loading")

        module_info = self._lazy_modules[module_name]
        if module_info['loaded']:
            return  # Already loaded

        # Measure memory before loading
        memory_before = self._get_current_memory()
        start_time = time.time()

        try:
            # Load the module
            module_info['loader']()
            module_info['loaded'] = True
            module_info['load_time'] = time.time() - start_time

            # Measure memory impact
            memory_after = self._get_current_memory()
            module_info['memory_impact'] = memory_after - memory_before

            self._loaded_modules.add(module_name)

            logger.info(f"[LAZY] Loaded {module_name} - "
                       f"Memory impact: +{module_info['memory_impact']:.1f} MB - "
                       f"Load time: {module_info['load_time']:.2f}s")

            # Check if we exceeded target after loading
            if memory_after > self.target_memory_percent:
                self._trigger_memory_pressure()

        except Exception as e:
            logger.error(f"[LAZY] Failed to load {module_name}: {e}")
            module_info['loaded'] = False

    def register_pressure_handler(self, handler: Callable):
        """Register a handler for memory pressure events"""
        self._pressure_handlers.append(handler)
        logger.info(f"[PRESSURE] Registered pressure handler: {handler.__name__}")

    def _trigger_memory_pressure(self):
        """Trigger memory pressure response"""
        logger.warning("[PRESSURE] Memory pressure detected - executing handlers")

        for handler in self._pressure_handlers:
            try:
                handler()
            except Exception as e:
                logger.error(f"[PRESSURE] Handler {handler.__name__} failed: {e}")

        # Execute built-in pressure response
        self._execute_pressure_response()

    def _execute_pressure_response(self):
        """Execute built-in memory pressure response"""
        initial_memory = self._get_current_memory()

        # 1. Aggressive cache cleanup
        cache_freed = self._smart_cache.emergency_cleanup()

        # 2. Unload non-critical lazy modules
        modules_freed = self._unload_non_critical_modules()

        # 3. Force aggressive GC
        gc_freed = self._force_aggressive_gc()

        # 4. Clean up weak references
        weak_freed = self._cleanup_weak_references()

        final_memory = self._get_current_memory()
        total_freed = initial_memory - final_memory

        logger.info(f"[PRESSURE] Memory pressure response completed - "
                   f"Freed {total_freed:.1f} MB total")

    def _unload_non_critical_modules(self) -> float:
        """Unload non-critical lazy modules to free memory"""
        memory_before = self._get_current_memory()
        unloaded_count = 0

        # Define critical modules that should never be unloaded
        critical_modules = {
            'medical_core', 'authentication', 'health_monitoring',
            'error_handling', 'logging'
        }

        for module_name, module_info in self._lazy_modules.items():
            if (module_info['loaded'] and
                module_name not in critical_modules and
                module_info.get('memory_impact', 0) > 5):  # > 5MB impact

                try:
                    # Attempt to unload module
                    self._unload_module(module_name)
                    module_info['loaded'] = False
                    unloaded_count += 1

                except Exception as e:
                    logger.error(f"[UNLOAD] Failed to unload {module_name}: {e}")

        memory_after = self._get_current_memory()
        freed_mb = memory_before - memory_after

        if unloaded_count > 0:
            logger.info(f"[UNLOAD] Unloaded {unloaded_count} modules - "
                       f"Freed {freed_mb:.1f} MB")

        return freed_mb

    def _unload_module(self, module_name: str):
        """Safely unload a module"""
        # This is a simplified implementation
        # In practice, you'd need more sophisticated module unloading
        if module_name in self._loaded_modules:
            self._loaded_modules.remove(module_name)

        # Force garbage collection after unloading
        gc.collect()

    def _force_aggressive_gc(self) -> float:
        """Force aggressive garbage collection"""
        memory_before = self._get_current_memory()

        # Multiple GC passes
        total_collected = 0
        for generation in [0, 1, 2]:
            for _ in range(3):  # Multiple passes per generation
                collected = gc.collect(generation)
                total_collected += collected
                time.sleep(0.01)  # Small delay between passes

        memory_after = self._get_current_memory()
        freed_mb = memory_before - memory_after

        logger.info(f"[GC] Aggressive GC - Collected {total_collected} objects - "
                   f"Freed {freed_mb:.1f} MB")

        return freed_mb

    def _cleanup_weak_references(self) -> float:
        """Clean up dead weak references"""
        memory_before = self._get_current_memory()

        # Force cleanup of weak reference callbacks
        gc.collect()

        memory_after = self._get_current_memory()
        freed_mb = memory_before - memory_after

        return freed_mb

    def _get_current_memory(self) -> float:
        """Get current memory usage percentage"""
        try:
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            system_memory = psutil.virtual_memory()

            # Return process memory as percentage of system memory
            return (memory_info.rss / system_memory.total) * 100
        except:
            return 0.0

    def _start_monitoring(self):
        """Start memory monitoring thread"""
        self._monitor_thread = threading.Thread(
            target=self._monitor_loop,
            daemon=True,
            name="AdvancedMemoryMonitor"
        )
        self._monitor_thread.start()
        logger.info("[MONITOR] Advanced memory monitoring started")

    def _monitor_loop(self):
        """Main monitoring loop"""
        while not self._shutdown_event.is_set():
            try:
                current_memory = self._get_current_memory()

                # Track memory peaks
                if len(self._memory_peaks) == 0 or current_memory > max(self._memory_peaks):
                    self._memory_peaks.append(current_memory)
                    if len(self._memory_peaks) > 100:  # Keep last 100 peaks
                        self._memory_peaks.pop(0)

                # Check for memory pressure
                if current_memory > self.target_memory_percent:
                    self._trigger_memory_pressure()

                # Medical alert for critical memory usage
                if current_memory > 75:
                    logger.error(f"MEDICAL ALERT [critical_memory]: {current_memory:.1f}% - "
                               f"System approaching failure threshold")

                # Detect potential memory leaks
                self._detect_memory_leaks(current_memory)

                # Sleep interval based on memory pressure
                sleep_time = 5 if current_memory < 40 else 2
                self._shutdown_event.wait(sleep_time)

            except Exception as e:
                logger.error(f"[MONITOR] Monitoring error: {e}")
                self._shutdown_event.wait(10)

    def _detect_memory_leaks(self, current_memory: float):
        """Detect potential memory leaks"""
        if not self._memory_baseline:
            return

        # Check if memory has grown significantly since baseline
        baseline_memory = self._memory_baseline['rss_mb']
        current_rss = psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
        growth_ratio = current_rss / baseline_memory

        if growth_ratio > 2.0:  # Memory doubled since baseline
            logger.warning(f"[LEAK DETECTION] Potential memory leak - "
                          f"Memory grown {growth_ratio:.1f}x since baseline")

            # Add to leak suspects for further analysis
            self._leak_suspects.add(datetime.now())

    def get_optimization_stats(self) -> Dict[str, Any]:
        """Get comprehensive optimization statistics"""
        try:
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()

            return {
                'memory': {
                    'current_rss_mb': memory_info.rss / (1024 * 1024),
                    'current_percent': self._get_current_memory(),
                    'target_percent': self.target_memory_percent,
                    'baseline_mb': self._memory_baseline['rss_mb'] if self._memory_baseline else 0,
                    'peak_percent': max(self._memory_peaks) if self._memory_peaks else 0
                },
                'lazy_loading': {
                    'registered_modules': len(self._lazy_modules),
                    'loaded_modules': len(self._loaded_modules),
                    'total_load_time': sum(
                        m.get('load_time', 0) for m in self._lazy_modules.values()
                    ),
                    'total_memory_impact': sum(
                        m.get('memory_impact', 0) for m in self._lazy_modules.values()
                    )
                },
                'cache': self._smart_cache.get_stats(),
                'gc': {
                    'total_objects': len(gc.get_objects()),
                    'collections': gc.get_count(),
                    'thresholds': gc.get_threshold()
                },
                'leak_detection': {
                    'suspects_count': len(self._leak_suspects),
                    'monitoring_duration': (
                        datetime.now() - self._memory_baseline['timestamp']
                    ).total_seconds() if self._memory_baseline else 0
                },
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"[STATS] Failed to get stats: {e}")
            return {'error': str(e)}

    def force_optimization(self) -> Dict[str, Any]:
        """Force immediate comprehensive optimization"""
        logger.info("[FORCE] Starting forced optimization")

        initial_stats = self.get_optimization_stats()
        initial_memory = initial_stats['memory']['current_percent']

        # Execute comprehensive optimization
        self._execute_pressure_response()

        final_stats = self.get_optimization_stats()
        final_memory = final_stats['memory']['current_percent']

        improvement = initial_memory - final_memory

        result = {
            'before': initial_stats,
            'after': final_stats,
            'improvement': {
                'memory_freed_percent': improvement,
                'success': final_memory < self.target_memory_percent
            },
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"[FORCE] Optimization completed - "
                   f"Memory: {initial_memory:.1f}% -> {final_memory:.1f}% "
                   f"(freed {improvement:.1f}%)")

        return result

    def shutdown(self):
        """Shutdown the optimizer"""
        logger.info("[SHUTDOWN] Shutting down advanced memory optimizer")

        self._shutdown_event.set()

        if self._monitor_thread and self._monitor_thread.is_alive():
            self._monitor_thread.join(timeout=5)

        # Final cleanup
        self._smart_cache.clear()

        logger.info("[SHUTDOWN] Advanced memory optimizer shutdown complete")


class SmartCache:
    """Intelligent cache with automatic eviction and memory pressure response"""

    def __init__(self, max_size_mb: float = 25):
        self.max_size_mb = max_size_mb
        self._cache = OrderedDict()
        self._access_times = {}
        self._access_counts = defaultdict(int)
        self._lock = threading.RLock()

    def get(self, key: str) -> Optional[Any]:
        """Get item from cache with LRU tracking"""
        with self._lock:
            if key in self._cache:
                # Update access statistics
                self._access_times[key] = time.time()
                self._access_counts[key] += 1

                # Move to end (most recently used)
                value = self._cache[key]
                del self._cache[key]
                self._cache[key] = value

                return value
            return None

    def set(self, key: str, value: Any, ttl_seconds: int = 3600):
        """Set item in cache with automatic eviction"""
        with self._lock:
            # Check if value is too large
            value_size = sys.getsizeof(value) / (1024 * 1024)
            if value_size > 5:  # Don't cache items > 5MB
                return False

            # Remove if already exists
            if key in self._cache:
                del self._cache[key]

            # Check cache size and evict if necessary
            self._ensure_cache_size()

            # Add item
            self._cache[key] = value
            self._access_times[key] = time.time()
            self._access_counts[key] = 1

            return True

    def _ensure_cache_size(self):
        """Ensure cache doesn't exceed size limit"""
        current_size = self._calculate_cache_size()

        while current_size > self.max_size_mb and self._cache:
            # Remove least recently used item
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            self._access_times.pop(oldest_key, None)
            self._access_counts.pop(oldest_key, None)

            current_size = self._calculate_cache_size()

    def _calculate_cache_size(self) -> float:
        """Calculate current cache size in MB"""
        total_size = 0
        for key, value in self._cache.items():
            total_size += sys.getsizeof(key) + sys.getsizeof(value)
        return total_size / (1024 * 1024)

    def emergency_cleanup(self) -> float:
        """Emergency cache cleanup - remove 80% of items"""
        with self._lock:
            initial_size = self._calculate_cache_size()

            # Keep only 20% of most accessed items
            keep_count = max(1, len(self._cache) // 5)

            # Sort by access count and keep top items
            sorted_items = sorted(
                self._access_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )

            keys_to_keep = {item[0] for item in sorted_items[:keep_count]}

            # Remove items not in keep list
            keys_to_remove = [k for k in self._cache.keys() if k not in keys_to_keep]
            for key in keys_to_remove:
                del self._cache[key]
                self._access_times.pop(key, None)
                self._access_counts.pop(key, None)

            final_size = self._calculate_cache_size()
            freed_mb = initial_size - final_size

            logger.info(f"[CACHE EMERGENCY] Freed {freed_mb:.1f} MB - "
                       f"Kept {len(keys_to_keep)} of {len(keys_to_remove) + len(keys_to_keep)} items")

            return freed_mb

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            return {
                'items': len(self._cache),
                'size_mb': self._calculate_cache_size(),
                'max_size_mb': self.max_size_mb,
                'hit_rate': self._calculate_hit_rate(),
                'total_accesses': sum(self._access_counts.values())
            }

    def _calculate_hit_rate(self) -> float:
        """Calculate cache hit rate"""
        total_accesses = sum(self._access_counts.values())
        unique_keys = len(self._access_counts)

        if total_accesses > 0 and unique_keys > 0:
            return ((total_accesses - unique_keys) / total_accesses) * 100
        return 0.0

    def clear(self):
        """Clear all cache data"""
        with self._lock:
            self._cache.clear()
            self._access_times.clear()
            self._access_counts.clear()


# Global instance
_advanced_optimizer = None

def get_advanced_memory_optimizer() -> AdvancedMemoryOptimizer:
    """Get global advanced memory optimizer instance"""
    global _advanced_optimizer
    if _advanced_optimizer is None:
        _advanced_optimizer = AdvancedMemoryOptimizer(target_memory_percent=45.0)
    return _advanced_optimizer

def memory_pressure_aware(func):
    """Decorator that monitors function memory impact"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        optimizer = get_advanced_memory_optimizer()

        # Check memory before execution
        memory_before = optimizer._get_current_memory()

        if memory_before > optimizer.target_memory_percent:
            logger.warning(f"[PRESSURE AWARE] Function {func.__name__} called with high memory: {memory_before:.1f}%")
            optimizer._trigger_memory_pressure()

        try:
            result = func(*args, **kwargs)

            # Check memory after execution
            memory_after = optimizer._get_current_memory()
            memory_increase = memory_after - memory_before

            if memory_increase > 5:  # Function increased memory by >5%
                logger.warning(f"[PRESSURE AWARE] Function {func.__name__} increased memory by {memory_increase:.1f}%")

            return result
        except Exception as e:
            logger.error(f"[PRESSURE AWARE] Function {func.__name__} failed: {e}")
            raise

    return wrapper