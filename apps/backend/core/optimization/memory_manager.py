# -*- coding: utf-8 -*-
"""
Unified Memory Management System
Consolidates multiple memory optimization systems into single manager
"""

import os
import gc
import psutil
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


logger = logging.getLogger(__name__)


@dataclass
class MemoryStats:
    """Memory statistics data structure"""
    process_memory_mb: float
    system_memory_percent: float
    available_memory_gb: float
    threads_count: int
    open_files_count: int
    gc_collections: Dict[str, int]
    timestamp: str


class MemoryThresholds:
    """Memory threshold constants"""
    CRITICAL = 90.0  # System memory %
    HIGH = 80.0      # System memory %
    MODERATE = 70.0  # System memory %
    LOW = 50.0       # System memory %


class UnifiedMemoryManager:
    """Unified memory management for medical application"""

    def __init__(self, max_cache_size_mb: int = 50):
        self.max_cache_size_mb = max_cache_size_mb
        self.process = psutil.Process(os.getpid())
        self._cache_registry: Dict[str, Any] = {}
        self._optimization_history: List[Dict] = []
        self._critical_callbacks: List[callable] = []

        logger.info(f"Unified Memory Manager initialized (max cache: {max_cache_size_mb}MB)")

    def get_memory_stats(self) -> MemoryStats:
        """Get comprehensive memory statistics"""
        try:
            memory_info = self.process.memory_info()
            system_memory = psutil.virtual_memory()

            gc_stats = {}
            for i in range(3):
                gc_stats[f"generation_{i}"] = gc.get_count()[i]

            return MemoryStats(
                process_memory_mb=round(memory_info.rss / (1024 * 1024), 1),
                system_memory_percent=round(system_memory.percent, 1),
                available_memory_gb=round(system_memory.available / (1024**3), 1),
                threads_count=self.process.num_threads(),
                open_files_count=len(self.process.open_files()),
                gc_collections=gc_stats,
                timestamp=datetime.now().isoformat()
            )
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            return MemoryStats(
                process_memory_mb=0.0,
                system_memory_percent=0.0,
                available_memory_gb=0.0,
                threads_count=0,
                open_files_count=0,
                gc_collections={},
                timestamp=datetime.now().isoformat()
            )

    def is_memory_critical(self) -> bool:
        """Check if memory usage is critical"""
        stats = self.get_memory_stats()
        return stats.system_memory_percent > MemoryThresholds.CRITICAL

    def get_memory_pressure_level(self) -> str:
        """Get current memory pressure level"""
        stats = self.get_memory_stats()
        memory_percent = stats.system_memory_percent

        if memory_percent > MemoryThresholds.CRITICAL:
            return "CRITICAL"
        elif memory_percent > MemoryThresholds.HIGH:
            return "HIGH"
        elif memory_percent > MemoryThresholds.MODERATE:
            return "MODERATE"
        else:
            return "LOW"

    def register_cache(self, name: str, cache_obj: Any) -> None:
        """Register cache for management"""
        self._cache_registry[name] = cache_obj
        logger.debug(f"Cache registered: {name}")

    def register_critical_callback(self, callback: callable) -> None:
        """Register callback for critical memory situations"""
        self._critical_callbacks.append(callback)
        logger.debug("Critical memory callback registered")

    def optimize_memory(self, force_gc: bool = False) -> Dict[str, Any]:
        """
        Optimize memory usage based on current pressure

        Args:
            force_gc: Force garbage collection regardless of pressure

        Returns:
            Optimization results
        """
        start_stats = self.get_memory_stats()
        pressure_level = self.get_memory_pressure_level()

        optimization_actions = []

        try:
            # Level 1: Light optimization (always safe)
            if pressure_level in ["MODERATE", "HIGH", "CRITICAL"] or force_gc:
                # Clear Python garbage collection
                collected = gc.collect()
                optimization_actions.append(f"Garbage collection: {collected} objects")

            # Level 2: Cache optimization (moderate pressure)
            if pressure_level in ["HIGH", "CRITICAL"]:
                cleared_caches = self._optimize_caches()
                optimization_actions.extend(cleared_caches)

            # Level 3: Critical actions (critical pressure)
            if pressure_level == "CRITICAL":
                critical_actions = self._execute_critical_optimization()
                optimization_actions.extend(critical_actions)

                # Execute critical callbacks
                for callback in self._critical_callbacks:
                    try:
                        callback()
                        optimization_actions.append("Critical callback executed")
                    except Exception as e:
                        logger.error(f"Critical callback failed: {e}")

        except Exception as e:
            logger.error(f"Memory optimization failed: {e}")
            optimization_actions.append(f"Optimization error: {str(e)}")

        end_stats = self.get_memory_stats()

        # Calculate improvement
        memory_freed_mb = start_stats.process_memory_mb - end_stats.process_memory_mb
        system_improvement = start_stats.system_memory_percent - end_stats.system_memory_percent

        result = {
            "pressure_level": pressure_level,
            "actions_taken": optimization_actions,
            "memory_freed_mb": round(memory_freed_mb, 1),
            "system_improvement_percent": round(system_improvement, 1),
            "before_stats": start_stats.__dict__,
            "after_stats": end_stats.__dict__,
            "timestamp": datetime.now().isoformat()
        }

        # Store in optimization history
        self._optimization_history.append(result)
        if len(self._optimization_history) > 50:  # Keep last 50 optimizations
            self._optimization_history = self._optimization_history[-50:]

        logger.info(f"Memory optimization completed: {pressure_level} -> {memory_freed_mb}MB freed")
        return result

    def _optimize_caches(self) -> List[str]:
        """Optimize registered caches"""
        actions = []

        for name, cache_obj in self._cache_registry.items():
            try:
                if hasattr(cache_obj, 'clear'):
                    cache_obj.clear()
                    actions.append(f"Cleared cache: {name}")
                elif hasattr(cache_obj, 'clear_all'):
                    result = cache_obj.clear_all()
                    actions.append(f"Cleared cache {name}: {result}")
                elif hasattr(cache_obj, 'optimize'):
                    result = cache_obj.optimize()
                    actions.append(f"Optimized cache {name}: {result}")
            except Exception as e:
                logger.error(f"Failed to optimize cache {name}: {e}")
                actions.append(f"Cache optimization failed: {name}")

        return actions

    def _execute_critical_optimization(self) -> List[str]:
        """Execute critical memory optimization"""
        actions = []

        try:
            # Force aggressive garbage collection
            for generation in range(3):
                collected = gc.collect(generation)
                if collected > 0:
                    actions.append(f"GC generation {generation}: {collected} objects")

            # Clear temporary files if possible
            temp_cleared = self._clear_temporary_files()
            if temp_cleared:
                actions.append(f"Temporary files cleared: {temp_cleared}")

            # Log critical memory situation
            stats = self.get_memory_stats()
            logger.critical(f"CRITICAL MEMORY: {stats.system_memory_percent}% system usage")

            actions.append("Critical optimization completed")

        except Exception as e:
            logger.error(f"Critical optimization failed: {e}")
            actions.append(f"Critical optimization error: {str(e)}")

        return actions

    def _clear_temporary_files(self) -> int:
        """Clear temporary files safely"""
        cleared_count = 0

        try:
            # Common temporary directories
            temp_dirs = [
                Path("/tmp/claude"),
                Path.home() / "tmp",
                Path("./cache/temp"),
                Path("./logs/temp")
            ]

            for temp_dir in temp_dirs:
                if temp_dir.exists() and temp_dir.is_dir():
                    for temp_file in temp_dir.glob("*.tmp"):
                        try:
                            if temp_file.is_file():
                                temp_file.unlink()
                                cleared_count += 1
                        except Exception as e:
                            logger.debug(f"Could not delete temp file {temp_file}: {e}")

        except Exception as e:
            logger.error(f"Failed to clear temporary files: {e}")

        return cleared_count

    def get_optimization_history(self) -> List[Dict]:
        """Get optimization history"""
        return self._optimization_history.copy()

    def monitor_and_maintain(self) -> None:
        """Continuous monitoring and maintenance"""
        try:
            pressure_level = self.get_memory_pressure_level()

            if pressure_level in ["HIGH", "CRITICAL"]:
                logger.warning(f"Memory pressure detected: {pressure_level}")
                self.optimize_memory()

        except Exception as e:
            logger.error(f"Memory monitoring failed: {e}")

    def get_health_report(self) -> Dict[str, Any]:
        """Get comprehensive memory health report"""
        stats = self.get_memory_stats()
        pressure_level = self.get_memory_pressure_level()

        return {
            "memory_health": {
                "pressure_level": pressure_level,
                "is_critical": self.is_memory_critical(),
                "stats": stats.__dict__,
                "registered_caches": list(self._cache_registry.keys()),
                "optimization_count": len(self._optimization_history),
                "critical_callbacks": len(self._critical_callbacks)
            },
            "recommendations": self._get_memory_recommendations(pressure_level),
            "timestamp": datetime.now().isoformat()
        }

    def _get_memory_recommendations(self, pressure_level: str) -> List[str]:
        """Get memory optimization recommendations"""
        recommendations = []

        if pressure_level == "CRITICAL":
            recommendations.extend([
                "Immediate memory optimization required",
                "Consider restarting application if memory continues to grow",
                "Check for memory leaks in application code"
            ])
        elif pressure_level == "HIGH":
            recommendations.extend([
                "Proactive memory optimization recommended",
                "Monitor memory usage closely",
                "Consider reducing cache sizes"
            ])
        elif pressure_level == "MODERATE":
            recommendations.extend([
                "Regular memory monitoring advised",
                "Optimize caches during low-usage periods"
            ])
        else:
            recommendations.append("Memory usage is within normal limits")

        return recommendations


# Global memory manager instance
_memory_manager: Optional[UnifiedMemoryManager] = None


def get_memory_manager() -> UnifiedMemoryManager:
    """Get global memory manager instance"""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = UnifiedMemoryManager()
    return _memory_manager


def initialize_memory_management(flask_app=None) -> UnifiedMemoryManager:
    """Initialize memory management for Flask application"""
    manager = get_memory_manager()

    if flask_app:
        # Register with Flask app
        flask_app.memory_manager = manager

        # Add periodic monitoring
        @flask_app.before_request
        def check_memory_before_request():
            if manager.is_memory_critical():
                logger.warning("Critical memory detected before request processing")
                manager.optimize_memory()

    logger.info("Memory management initialized")
    return manager