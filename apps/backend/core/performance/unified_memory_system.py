# -*- coding: utf-8 -*-
"""
Unified Memory Management System - Medical Platform
Replaces 5 competing memory systems with single, efficient solution

MEDICAL SAFETY PRIORITY:
- Emergency response for medical system safety
- Memory pressure monitoring with medical context
- Graceful degradation maintaining medical functionality
- Comprehensive logging for medical compliance
"""

import gc
import sys
import psutil
import threading
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
import weakref
import os

logger = logging.getLogger(__name__)

@dataclass
class MemoryThresholds:
    """Memory thresholds for medical system safety - REALISTIC SYSTEM THRESHOLDS"""
    emergency: float = 98.0      # Critical - immediate action (system %)
    warning: float = 95.0        # High - proactive cleanup (system %)
    normal: float = 90.0         # Normal operation (system %)
    target: float = 85.0         # Target after optimization (system %)

    # Windows typically runs at 80-85% normally, so these are realistic

@dataclass
class MedicalMemoryStats:
    """Medical-context memory statistics"""
    system_percent: float
    process_rss_mb: float
    process_percent: float
    available_gb: float
    thread_count: int
    gc_collections: Dict[int, int]
    medical_cache_size: int
    emergency_actions: int
    last_optimization: Optional[datetime]
    status: str  # 'normal', 'warning', 'emergency', 'critical'

class UnifiedMemoryManager:
    """
    Single unified memory management system for medical platform
    Replaces all competing memory optimization systems
    """

    def __init__(self):
        self.thresholds = MemoryThresholds()
        self._emergency_actions = 0
        self._last_optimization = None
        self._monitoring_active = False
        self._monitor_thread = None
        self._medical_caches = weakref.WeakValueDictionary()
        self._cleanup_callbacks: List[Callable] = []
        self._lock = threading.RLock()

        # Medical system integration
        self._medical_context = True
        self._safety_mode = True

        logger.info("[UNIFIED MEMORY] Medical memory management system initialized")

    def register_medical_cache(self, name: str, cache_obj: Any) -> None:
        """Register medical cache for monitoring and cleanup"""
        with self._lock:
            self._medical_caches[name] = cache_obj
            logger.debug(f"[MEDICAL CACHE] Registered: {name}")

    def register_cleanup_callback(self, callback: Callable) -> None:
        """Register cleanup callback for emergency situations"""
        with self._lock:
            self._cleanup_callbacks.append(callback)
            logger.debug(f"[CLEANUP] Registered callback: {callback.__name__}")

    def get_memory_stats(self) -> MedicalMemoryStats:
        """Get comprehensive memory statistics with medical context"""
        try:
            # System memory info
            system_memory = psutil.virtual_memory()

            # Process memory info
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()

            # GC statistics
            gc_stats = {}
            for generation in range(3):
                gc_stats[generation] = gc.get_count()[generation]

            # Medical cache size
            medical_cache_size = 0
            with self._lock:
                for cache_name, cache_obj in self._medical_caches.items():
                    try:
                        if hasattr(cache_obj, '__len__'):
                            medical_cache_size += len(cache_obj)
                        elif hasattr(cache_obj, 'size'):
                            medical_cache_size += cache_obj.size()
                    except:
                        continue

            # Determine status based on REALISTIC system thresholds
            system_percent = system_memory.percent
            process_percent = round(process.memory_percent(), 1)

            # Use realistic system thresholds (Windows typically at 80-85%)
            if system_percent >= self.thresholds.emergency:  # 98%+
                status = 'emergency'
            elif system_percent >= self.thresholds.warning:  # 95%+
                status = 'warning'
            else:
                status = 'normal'

            return MedicalMemoryStats(
                system_percent=system_percent,
                process_rss_mb=round(memory_info.rss / (1024 * 1024), 1),
                process_percent=round(process.memory_percent(), 1),
                available_gb=round(system_memory.available / (1024**3), 1),
                thread_count=process.num_threads(),
                gc_collections=gc_stats,
                medical_cache_size=medical_cache_size,
                emergency_actions=self._emergency_actions,
                last_optimization=self._last_optimization,
                status=status
            )

        except Exception as e:
            logger.error(f"[MEMORY ERROR] Failed to get stats: {e}")
            # Return safe defaults for medical system
            return MedicalMemoryStats(
                system_percent=0.0,
                process_rss_mb=0.0,
                process_percent=0.0,
                available_gb=0.0,
                thread_count=1,
                gc_collections={},
                medical_cache_size=0,
                emergency_actions=self._emergency_actions,
                last_optimization=self._last_optimization,
                status='unknown'
            )

    def is_memory_critical(self) -> bool:
        """Check if memory is in critical state requiring immediate action"""
        try:
            stats = self.get_memory_stats()
            # Use realistic system threshold (98%+)
            return stats.system_percent >= self.thresholds.emergency
        except:
            # Assume critical if we can't determine state (medical safety)
            return True

    def execute_emergency_cleanup(self) -> Dict[str, Any]:
        """Execute immediate emergency memory cleanup for medical safety"""
        start_time = datetime.now()
        logger.warning("[MEDICAL EMERGENCY] Starting emergency memory cleanup")

        with self._lock:
            self._emergency_actions += 1
            cleanup_results = {
                'timestamp': start_time.isoformat(),
                'type': 'emergency_cleanup',
                'actions_taken': [],
                'memory_before': 0.0,
                'memory_after': 0.0,
                'success': False
            }

            try:
                # Get initial memory state
                initial_stats = self.get_memory_stats()
                cleanup_results['memory_before'] = initial_stats.system_percent

                # 1. Clear all medical caches immediately
                medical_cleared = 0
                for cache_name, cache_obj in list(self._medical_caches.items()):
                    try:
                        if hasattr(cache_obj, 'clear'):
                            cache_obj.clear()
                            medical_cleared += 1
                            cleanup_results['actions_taken'].append(f'cleared_medical_cache_{cache_name}')
                        elif hasattr(cache_obj, 'flush'):
                            cache_obj.flush()
                            medical_cleared += 1
                            cleanup_results['actions_taken'].append(f'flushed_medical_cache_{cache_name}')
                    except Exception as e:
                        logger.error(f"[MEDICAL CACHE] Failed to clear {cache_name}: {e}")

                # 2. Execute registered cleanup callbacks
                callbacks_executed = 0
                for callback in self._cleanup_callbacks:
                    try:
                        callback()
                        callbacks_executed += 1
                        cleanup_results['actions_taken'].append(f'executed_callback_{callback.__name__}')
                    except Exception as e:
                        logger.error(f"[CLEANUP CALLBACK] Failed {callback.__name__}: {e}")

                # 3. Force garbage collection (all generations)
                gc_before = sum(gc.get_count())
                collected_objects = 0
                for generation in range(3):
                    collected_objects += gc.collect(generation)
                cleanup_results['actions_taken'].append(f'gc_collected_{collected_objects}_objects')

                # 4. Additional emergency measures if still critical
                final_stats = self.get_memory_stats()
                if final_stats.system_percent >= self.thresholds.emergency:
                    logger.warning("[MEDICAL CRITICAL] Memory still critical after emergency cleanup")

                    # Force Python garbage collector optimization
                    gc.set_threshold(100, 5, 5)  # More aggressive GC
                    gc.collect()
                    cleanup_results['actions_taken'].append('aggressive_gc_enabled')

                    # Try to reduce Python's memory footprint
                    sys.intern('')  # Trigger string interning cleanup
                    cleanup_results['actions_taken'].append('string_interning_cleanup')

                # Final memory check
                final_stats = self.get_memory_stats()
                cleanup_results['memory_after'] = final_stats.system_percent
                cleanup_results['memory_reduction'] = cleanup_results['memory_before'] - cleanup_results['memory_after']
                cleanup_results['success'] = cleanup_results['memory_reduction'] > 0

                self._last_optimization = datetime.now()

                duration = (datetime.now() - start_time).total_seconds()
                logger.info(
                    f"[MEDICAL EMERGENCY] Cleanup completed in {duration:.2f}s - "
                    f"Memory: {cleanup_results['memory_before']:.1f}% → {cleanup_results['memory_after']:.1f}% "
                    f"(reduction: {cleanup_results['memory_reduction']:.1f}%)"
                )

                return cleanup_results

            except Exception as e:
                logger.error(f"[MEDICAL EMERGENCY] Emergency cleanup failed: {e}")
                cleanup_results['error'] = str(e)
                cleanup_results['success'] = False
                return cleanup_results

    def optimize_memory(self, force: bool = False) -> Dict[str, Any]:
        """Proactive memory optimization for medical system performance"""
        if not force:
            stats = self.get_memory_stats()
            if stats.system_percent < self.thresholds.warning:
                return {
                    'action': 'skipped',
                    'reason': 'memory_below_warning_threshold',
                    'current_usage': stats.system_percent
                }

        start_time = datetime.now()
        logger.info("[MEDICAL OPTIMIZATION] Starting proactive memory optimization")

        with self._lock:
            optimization_results = {
                'timestamp': start_time.isoformat(),
                'type': 'proactive_optimization',
                'actions_taken': [],
                'memory_before': 0.0,
                'memory_after': 0.0,
                'success': False
            }

            try:
                # Get initial memory state
                initial_stats = self.get_memory_stats()
                optimization_results['memory_before'] = initial_stats.system_percent

                # 1. Selective medical cache cleanup (preserve critical data)
                medical_optimized = 0
                for cache_name, cache_obj in list(self._medical_caches.items()):
                    try:
                        # Use gentle optimization methods if available
                        if hasattr(cache_obj, 'optimize'):
                            cache_obj.optimize()
                            medical_optimized += 1
                            optimization_results['actions_taken'].append(f'optimized_medical_cache_{cache_name}')
                        elif hasattr(cache_obj, 'trim') and hasattr(cache_obj, '__len__'):
                            if len(cache_obj) > 1000:  # Only trim large caches
                                cache_obj.trim(800)  # Keep some data
                                medical_optimized += 1
                                optimization_results['actions_taken'].append(f'trimmed_medical_cache_{cache_name}')
                    except Exception as e:
                        logger.error(f"[MEDICAL CACHE] Failed to optimize {cache_name}: {e}")

                # 2. Gentle garbage collection (generation 0 and 1 only)
                collected_gen0 = gc.collect(0)
                collected_gen1 = gc.collect(1)
                optimization_results['actions_taken'].append(f'gentle_gc_collected_{collected_gen0 + collected_gen1}_objects')

                # 3. Check if more aggressive action needed
                current_stats = self.get_memory_stats()
                if current_stats.system_percent >= self.thresholds.warning:
                    # More aggressive cleanup needed
                    collected_gen2 = gc.collect(2)  # Full GC
                    optimization_results['actions_taken'].append(f'full_gc_collected_{collected_gen2}_objects')

                # Final memory check
                final_stats = self.get_memory_stats()
                optimization_results['memory_after'] = final_stats.system_percent
                optimization_results['memory_reduction'] = optimization_results['memory_before'] - optimization_results['memory_after']
                optimization_results['success'] = True

                self._last_optimization = datetime.now()

                duration = (datetime.now() - start_time).total_seconds()
                logger.info(
                    f"[MEDICAL OPTIMIZATION] Completed in {duration:.2f}s - "
                    f"Memory: {optimization_results['memory_before']:.1f}% → {optimization_results['memory_after']:.1f}% "
                    f"(reduction: {optimization_results['memory_reduction']:.1f}%)"
                )

                return optimization_results

            except Exception as e:
                logger.error(f"[MEDICAL OPTIMIZATION] Failed: {e}")
                optimization_results['error'] = str(e)
                optimization_results['success'] = False
                return optimization_results

    def start_monitoring(self, interval: int = 60) -> None:
        """Start continuous memory monitoring for medical safety"""
        if self._monitoring_active:
            logger.warning("[MEDICAL MONITOR] Monitoring already active")
            return

        self._monitoring_active = True

        def monitor_loop():
            """Background monitoring loop"""
            logger.info(f"[MEDICAL MONITOR] Starting continuous monitoring (interval: {interval}s)")

            while self._monitoring_active:
                try:
                    stats = self.get_memory_stats()

                    # Emergency response
                    if stats.system_percent >= self.thresholds.emergency:
                        logger.error(f"[MEDICAL EMERGENCY] Critical memory usage: {stats.system_percent:.1f}%")
                        self.execute_emergency_cleanup()

                    # Warning response (proactive)
                    elif stats.system_percent >= self.thresholds.warning:
                        logger.warning(f"[MEDICAL WARNING] High memory usage: {stats.system_percent:.1f}%")
                        self.optimize_memory()

                    # Normal monitoring
                    elif stats.system_percent >= self.thresholds.normal:
                        logger.debug(f"[MEDICAL MONITOR] Memory usage: {stats.system_percent:.1f}% (normal)")

                    # Sleep until next check
                    threading.Event().wait(interval)

                except Exception as e:
                    logger.error(f"[MEDICAL MONITOR] Monitoring error: {e}")
                    threading.Event().wait(interval)

        self._monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        self._monitor_thread.start()
        logger.info("[MEDICAL MONITOR] Background monitoring started")

    def stop_monitoring(self) -> None:
        """Stop continuous monitoring"""
        if self._monitoring_active:
            self._monitoring_active = False
            logger.info("[MEDICAL MONITOR] Stopping background monitoring")

            if self._monitor_thread and self._monitor_thread.is_alive():
                self._monitor_thread.join(timeout=5.0)

    def get_comprehensive_report(self) -> Dict[str, Any]:
        """Get comprehensive memory report for medical system analysis"""
        stats = self.get_memory_stats()

        return {
            'timestamp': datetime.now().isoformat(),
            'system_type': 'unified_medical_memory_manager',
            'memory_statistics': {
                'system_usage_percent': stats.system_percent,
                'system_status': stats.status,
                'process_memory_mb': stats.process_rss_mb,
                'process_usage_percent': stats.process_percent,
                'available_memory_gb': stats.available_gb,
                'thread_count': stats.thread_count
            },
            'medical_context': {
                'medical_cache_objects': stats.medical_cache_size,
                'registered_caches': len(self._medical_caches),
                'registered_callbacks': len(self._cleanup_callbacks),
                'emergency_actions_count': stats.emergency_actions,
                'last_optimization': stats.last_optimization.isoformat() if stats.last_optimization else None
            },
            'garbage_collection': {
                'generation_counts': stats.gc_collections,
                'thresholds': gc.get_threshold()
            },
            'thresholds': {
                'emergency': self.thresholds.emergency,
                'warning': self.thresholds.warning,
                'normal': self.thresholds.normal,
                'target': self.thresholds.target
            },
            'monitoring': {
                'active': self._monitoring_active,
                'medical_safety_mode': self._safety_mode,
                'medical_context': self._medical_context
            }
        }

# Global instance for medical platform
_unified_memory_manager: Optional[UnifiedMemoryManager] = None

def get_unified_memory_manager() -> UnifiedMemoryManager:
    """Get or create the unified memory manager for medical platform"""
    global _unified_memory_manager

    if _unified_memory_manager is None:
        _unified_memory_manager = UnifiedMemoryManager()

        # Start monitoring automatically for medical safety
        _unified_memory_manager.start_monitoring(interval=30)  # Check every 30 seconds

        logger.info("[UNIFIED MEMORY] Medical memory manager created and monitoring started")

    return _unified_memory_manager

def initialize_medical_memory_management() -> UnifiedMemoryManager:
    """Initialize unified memory management for medical platform"""
    manager = get_unified_memory_manager()

    # Perform initial optimization if needed
    if manager.is_memory_critical():
        logger.warning("[UNIFIED MEMORY] Critical memory detected during initialization")
        result = manager.execute_emergency_cleanup()
        logger.info(f"[UNIFIED MEMORY] Initial cleanup result: {result.get('success', False)}")

    return manager

# Medical safety decorator for memory-critical functions
def medical_memory_safe(func):
    """Decorator to ensure medical functions operate safely under memory pressure"""
    def wrapper(*args, **kwargs):
        manager = get_unified_memory_manager()

        # Check memory before critical medical operation
        if manager.is_memory_critical():
            logger.warning(f"[MEDICAL SAFETY] Memory critical before {func.__name__} - performing cleanup")
            manager.execute_emergency_cleanup()

        try:
            return func(*args, **kwargs)
        except MemoryError:
            logger.error(f"[MEDICAL SAFETY] Memory error in {func.__name__} - emergency cleanup")
            manager.execute_emergency_cleanup()
            # Try once more after cleanup
            return func(*args, **kwargs)

    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper