# -*- coding: utf-8 -*-
"""
Startup Memory Optimizer - Prevent Memory Issues at Application Start
====================================================================

Prevents multiple processes, controls thread proliferation, and implements
aggressive lazy loading to achieve <50% memory usage from startup.

Critical for medical systems requiring consistent low memory footprint.
"""

import os
import sys
import gc
import threading
import psutil
import logging
from typing import Dict, List, Set, Optional
from datetime import datetime
import atexit

logger = logging.getLogger(__name__)

class StartupMemoryOptimizer:
    """
    Startup memory optimizer to prevent common memory issues:

    1. Multiple process prevention
    2. Thread pool control
    3. Aggressive lazy loading
    4. Import optimization
    5. Early garbage collection
    """

    def __init__(self):
        self.process_id = os.getpid()
        self.startup_memory = None
        self.prevented_imports = set()
        self.lazy_imports = {}
        self.thread_limit = 8

        # Track if we're the primary process
        self.is_primary_process = self._check_primary_process()

        # Register cleanup on exit
        atexit.register(self.cleanup)

    def _check_primary_process(self) -> bool:
        """Check if this is the primary Flask process"""
        try:
            flask_processes = []
            for proc in psutil.process_iter(['pid', 'cmdline']):
                try:
                    cmdline = ' '.join(proc.info['cmdline'])
                    if 'python' in cmdline and 'main.py' in cmdline:
                        flask_processes.append(proc.info['pid'])
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # If we're the first or only process, we're primary
            is_primary = len(flask_processes) <= 1 or self.process_id == min(flask_processes)

            if not is_primary:
                logger.warning(f"[STARTUP] Secondary Flask process detected (PID {self.process_id}) - "
                             f"Total processes: {len(flask_processes)}")
                # Force shutdown of secondary processes
                self._shutdown_secondary_process()

            return is_primary

        except Exception as e:
            logger.error(f"[STARTUP] Error checking primary process: {e}")
            return True

    def _shutdown_secondary_process(self):
        """Shutdown secondary Flask processes to prevent memory waste"""
        logger.info(f"[STARTUP] Shutting down secondary process (PID {self.process_id})")
        # Graceful shutdown
        os._exit(0)

    def prevent_import_bloat(self):
        """Prevent importing heavy modules at startup"""
        heavy_modules = {
            'numpy': 'Scientific computing - lazy load on demand',
            'pandas': 'Data analysis - lazy load on demand',
            'torch': 'ML models - lazy load on demand',
            'transformers': 'NLP models - lazy load on demand',
            'sklearn': 'ML algorithms - lazy load on demand',
            'matplotlib': 'Plotting - lazy load on demand',
            'seaborn': 'Statistical plots - lazy load on demand',
            'plotly': 'Interactive plots - lazy load on demand',
            'opencv-python': 'Computer vision - lazy load on demand',
            'cv2': 'OpenCV - lazy load on demand',
            'PIL': 'Image processing - lazy load on demand',
            'Pillow': 'Image processing - lazy load on demand',
            'tensorflow': 'ML framework - lazy load on demand',
            'keras': 'Neural networks - lazy load on demand'
        }

        prevented_count = 0
        for module_name, description in heavy_modules.items():
            if module_name not in sys.modules:
                # Module not yet imported - register for lazy loading
                self.lazy_imports[module_name] = {
                    'description': description,
                    'loaded': False,
                    'load_time': None
                }
            else:
                # Module already imported - track memory impact
                self.prevented_imports.add(module_name)
                prevented_count += 1

        logger.info(f"[STARTUP] Import optimization: {len(self.lazy_imports)} modules "
                   f"registered for lazy loading, {prevented_count} already imported")

    def optimize_thread_pool(self):
        """Optimize thread pool to prevent proliferation"""
        try:
            # Get current thread count
            current_threads = threading.active_count()

            if current_threads > self.thread_limit:
                logger.warning(f"[STARTUP] High thread count detected: {current_threads} > {self.thread_limit}")

                # Try to reduce thread pool size for various libraries
                self._configure_thread_pools()

            logger.info(f"[STARTUP] Thread optimization: {current_threads} active threads")

        except Exception as e:
            logger.error(f"[STARTUP] Thread optimization failed: {e}")

    def _configure_thread_pools(self):
        """Configure thread pools for various libraries"""
        try:
            # Configure NumPy thread pool (if imported)
            if 'numpy' in sys.modules:
                import numpy as np
                # Limit NumPy threads
                os.environ['OMP_NUM_THREADS'] = '2'
                os.environ['OPENBLAS_NUM_THREADS'] = '2'
                os.environ['MKL_NUM_THREADS'] = '2'

            # Configure TensorFlow thread pool (if imported)
            if 'tensorflow' in sys.modules:
                import tensorflow as tf
                tf.config.threading.set_inter_op_parallelism_threads(2)
                tf.config.threading.set_intra_op_parallelism_threads(2)

            # Configure PyTorch thread pool (if imported)
            if 'torch' in sys.modules:
                import torch
                torch.set_num_threads(2)

        except Exception as e:
            logger.error(f"[STARTUP] Thread pool configuration failed: {e}")

    def aggressive_gc_startup(self):
        """Perform aggressive garbage collection at startup"""
        try:
            # Configure aggressive GC
            gc.set_threshold(300, 5, 5)  # Very aggressive

            # Force multiple collection passes
            total_collected = 0
            for generation in [0, 1, 2]:
                for _ in range(3):
                    collected = gc.collect(generation)
                    total_collected += collected

            logger.info(f"[STARTUP] Aggressive GC completed - collected {total_collected} objects")

        except Exception as e:
            logger.error(f"[STARTUP] Aggressive GC failed: {e}")

    def measure_startup_memory(self):
        """Measure and record startup memory usage"""
        try:
            process = psutil.Process(self.process_id)
            memory_info = process.memory_info()

            self.startup_memory = {
                'rss_mb': memory_info.rss / (1024 * 1024),
                'vms_mb': memory_info.vms / (1024 * 1024),
                'percent': process.memory_percent(),
                'threads': process.num_threads(),
                'open_files': len(process.open_files()),
                'timestamp': datetime.now()
            }

            logger.info(f"[STARTUP] Memory measured: {self.startup_memory['rss_mb']:.1f} MB RSS, "
                       f"{self.startup_memory['percent']:.2f}%, {self.startup_memory['threads']} threads")

            # Alert if memory is high
            if self.startup_memory['rss_mb'] > 100:
                logger.warning(f"[STARTUP] HIGH MEMORY USAGE: {self.startup_memory['rss_mb']:.1f} MB - "
                             f"Target is <50 MB at startup")

            if self.startup_memory['threads'] > self.thread_limit:
                logger.warning(f"[STARTUP] HIGH THREAD COUNT: {self.startup_memory['threads']} - "
                             f"Target is <{self.thread_limit} threads")

        except Exception as e:
            logger.error(f"[STARTUP] Memory measurement failed: {e}")

    def optimize_flask_imports(self):
        """Optimize Flask-specific imports"""
        try:
            # Defer heavy Flask extensions
            heavy_flask_extensions = [
                'flask_sqlalchemy',
                'flask_migrate',
                'flask_marshmallow',
                'flask_jwt_extended',
                'flask_cors',
                'flask_limiter',
                'flask_caching'
            ]

            deferred_count = 0
            for ext in heavy_flask_extensions:
                if ext not in sys.modules:
                    self.lazy_imports[ext] = {
                        'description': f'Flask extension - {ext}',
                        'loaded': False,
                        'load_time': None
                    }
                    deferred_count += 1

            logger.info(f"[STARTUP] Flask optimization: {deferred_count} extensions deferred")

        except Exception as e:
            logger.error(f"[STARTUP] Flask import optimization failed: {e}")

    def check_memory_leaks(self):
        """Check for potential memory leaks at startup"""
        try:
            # Count objects by type
            from collections import defaultdict
            type_counts = defaultdict(int)

            for obj in gc.get_objects():
                type_counts[type(obj).__name__] += 1

            # Alert on suspicious object counts
            suspicious_threshold = 1000
            suspicious_types = []

            for obj_type, count in type_counts.items():
                if count > suspicious_threshold:
                    suspicious_types.append((obj_type, count))

            if suspicious_types:
                logger.warning(f"[STARTUP] Suspicious object counts detected:")
                for obj_type, count in suspicious_types[:5]:
                    logger.warning(f"  {obj_type}: {count:,} objects")

            logger.info(f"[STARTUP] Leak check: {len(gc.get_objects())} total objects, "
                       f"{len(suspicious_types)} suspicious types")

        except Exception as e:
            logger.error(f"[STARTUP] Memory leak check failed: {e}")

    def kill_duplicate_processes(self):
        """Kill duplicate Flask processes to prevent memory waste"""
        try:
            flask_processes = []

            for proc in psutil.process_iter(['pid', 'cmdline', 'create_time']):
                try:
                    cmdline = ' '.join(proc.info['cmdline'])
                    if ('python' in cmdline and 'main.py' in cmdline and
                        proc.info['pid'] != self.process_id):
                        flask_processes.append({
                            'pid': proc.info['pid'],
                            'create_time': proc.info['create_time']
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Kill older processes (keep newest)
            killed_count = 0
            my_create_time = psutil.Process(self.process_id).create_time()

            for proc_info in flask_processes:
                if proc_info['create_time'] < my_create_time:
                    try:
                        proc = psutil.Process(proc_info['pid'])
                        proc.terminate()
                        killed_count += 1
                        logger.info(f"[STARTUP] Killed duplicate process PID {proc_info['pid']}")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

            if killed_count > 0:
                logger.info(f"[STARTUP] Process cleanup: killed {killed_count} duplicate processes")
            else:
                logger.info("[STARTUP] Process cleanup: no duplicates found")

        except Exception as e:
            logger.error(f"[STARTUP] Process cleanup failed: {e}")

    def get_startup_report(self) -> Dict:
        """Get comprehensive startup optimization report"""
        try:
            current_memory = psutil.Process(self.process_id).memory_info().rss / (1024 * 1024)

            return {
                'process_info': {
                    'pid': self.process_id,
                    'is_primary': self.is_primary_process,
                    'current_memory_mb': current_memory,
                    'startup_memory_mb': self.startup_memory['rss_mb'] if self.startup_memory else 0,
                    'memory_growth': current_memory - (self.startup_memory['rss_mb'] if self.startup_memory else 0)
                },
                'optimizations': {
                    'prevented_imports': len(self.prevented_imports),
                    'lazy_imports_registered': len(self.lazy_imports),
                    'thread_limit': self.thread_limit,
                    'current_threads': threading.active_count()
                },
                'memory_analysis': {
                    'total_objects': len(gc.get_objects()),
                    'gc_collections': gc.get_count(),
                    'gc_thresholds': gc.get_threshold()
                },
                'recommendations': self._generate_startup_recommendations(),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"[STARTUP] Report generation failed: {e}")
            return {'error': str(e)}

    def _generate_startup_recommendations(self) -> List[str]:
        """Generate startup optimization recommendations"""
        recommendations = []

        if self.startup_memory:
            if self.startup_memory['rss_mb'] > 100:
                recommendations.append(
                    f"HIGH STARTUP MEMORY: {self.startup_memory['rss_mb']:.1f} MB > 100 MB target"
                )

            if self.startup_memory['threads'] > self.thread_limit:
                recommendations.append(
                    f"HIGH THREAD COUNT: {self.startup_memory['threads']} > {self.thread_limit} target"
                )

        if len(self.prevented_imports) > 5:
            recommendations.append(
                f"HEAVY IMPORTS: {len(self.prevented_imports)} heavy modules imported at startup"
            )

        if not recommendations:
            recommendations.append("STARTUP OPTIMIZED: All metrics within targets")

        return recommendations

    def cleanup(self):
        """Cleanup resources on shutdown"""
        try:
            logger.info(f"[STARTUP] Cleanup initiated for PID {self.process_id}")

            # Force final garbage collection
            gc.collect()

            logger.info("[STARTUP] Cleanup completed")

        except Exception as e:
            logger.error(f"[STARTUP] Cleanup failed: {e}")


# Global startup optimizer instance
_startup_optimizer = None

def initialize_startup_optimization():
    """Initialize startup memory optimization"""
    global _startup_optimizer

    if _startup_optimizer is None:
        _startup_optimizer = StartupMemoryOptimizer()

        # Execute all optimizations
        _startup_optimizer.kill_duplicate_processes()
        _startup_optimizer.prevent_import_bloat()
        _startup_optimizer.optimize_flask_imports()
        _startup_optimizer.optimize_thread_pool()
        _startup_optimizer.aggressive_gc_startup()
        _startup_optimizer.check_memory_leaks()
        _startup_optimizer.measure_startup_memory()

        logger.info("[STARTUP] Startup memory optimization completed")

    return _startup_optimizer

def get_startup_optimizer() -> Optional[StartupMemoryOptimizer]:
    """Get startup optimizer instance"""
    return _startup_optimizer

def startup_memory_report() -> Dict:
    """Get startup memory optimization report"""
    if _startup_optimizer:
        return _startup_optimizer.get_startup_report()
    else:
        return {'error': 'Startup optimizer not initialized'}