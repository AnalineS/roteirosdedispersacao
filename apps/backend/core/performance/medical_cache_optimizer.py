# -*- coding: utf-8 -*-
"""
Medical Cache Optimizer - Ultra-Low Memory Cache System
======================================================

Medical-grade caching system with emergency memory protection.
Designed for medical systems where memory stability is critical.

Features:
1. Ultra-low memory limits (10MB total)
2. Medical priority-based eviction
3. Emergency cache clearing
4. Memory pressure monitoring
5. Zero-tolerance for memory leaks

Author: Claude Code - Medical Systems Engineer
Date: 2025-09-23
Priority: MEDICAL CRITICAL
"""

import gc
import sys
import threading
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import OrderedDict
import logging
import psutil

logger = logging.getLogger(__name__)

class MedicalCacheOptimizer:
    """
    Medical-grade cache system with ultra-low memory footprint
    
    Design principles:
    - Medical safety over performance
    - Zero memory leaks tolerated
    - Emergency clearing capability
    - Sub-10MB total memory usage
    """
    
    def __init__(self, max_total_memory_mb: float = 10.0):
        self.max_total_memory_mb = max_total_memory_mb
        self.emergency_threshold_mb = max_total_memory_mb * 0.8  # 8MB emergency
        
        # Medical cache categories with strict limits
        self.caches = {
            'medical_critical': OrderedDict(),    # 3MB - Critical medical data
            'user_session': OrderedDict(),        # 2MB - User sessions
            'api_responses': OrderedDict(),       # 2MB - API response cache
            'static_content': OrderedDict(),      # 2MB - Static content
            'temporary': OrderedDict()            # 1MB - Temporary data
        }
        
        # Cache limits per category (in items)
        self.cache_limits = {
            'medical_critical': 50,    # Small but critical
            'user_session': 25,        # Limited sessions
            'api_responses': 100,      # API responses
            'static_content': 50,      # Static files
            'temporary': 20            # Very limited temp
        }
        
        # Memory tracking
        self.cache_access_times = {}
        self.cache_sizes = {}
        self.total_memory_usage = 0.0
        
        # Emergency state
        self.emergency_mode = False
        self.last_emergency_clear = None
        
        # Monitoring
        self._monitoring_lock = threading.RLock()
        self._monitor_thread = None
        self._shutdown_event = threading.Event()
        
        # Initialize monitoring
        self._start_monitoring()
        
        logger.info(f"[MEDICAL CACHE] Initialized - Limit: {max_total_memory_mb}MB")
    
    def _start_monitoring(self):
        """Start memory monitoring for medical safety"""
        def monitoring_loop():
            while not self._shutdown_event.is_set():
                try:
                    self._check_memory_pressure()
                    self._cleanup_expired_items()
                    time.sleep(5)  # Check every 5 seconds
                except Exception as e:
                    logger.error(f"[MEDICAL CACHE] Monitoring error: {e}")
                    time.sleep(30)  # Longer delay on error
        
        self._monitor_thread = threading.Thread(
            target=monitoring_loop,
            daemon=True,
            name="MedicalCacheMonitor"
        )
        self._monitor_thread.start()
        logger.info("[MEDICAL CACHE] Memory monitoring started")
    
    def _check_memory_pressure(self):
        """Check for memory pressure and take action"""
        with self._monitoring_lock:
            # Update total memory usage
            self._update_memory_usage()
            
            # Check emergency threshold
            if self.total_memory_usage > self.emergency_threshold_mb:
                logger.warning(f"[MEDICAL CACHE] Emergency threshold reached: {self.total_memory_usage:.1f}MB")
                self._emergency_cache_clear()
            
            # Check system memory
            try:
                system_memory = psutil.virtual_memory().percent
                if system_memory > 85.0:
                    logger.error(f"[MEDICAL CACHE] System memory critical: {system_memory:.1f}%")
                    self._emergency_cache_clear()
            except Exception as e:
                logger.warning(f"[MEDICAL CACHE] Could not check system memory: {e}")
    
    def _update_memory_usage(self):
        """Update current memory usage calculation"""
        total_usage = 0.0
        
        for category, cache in self.caches.items():
            category_size = 0.0
            for key, value in cache.items():
                try:
                    item_size = sys.getsizeof(key) + sys.getsizeof(value)
                    if isinstance(value, (dict, list, tuple)):
                        item_size += sum(sys.getsizeof(item) for item in value)
                    category_size += item_size
                except Exception:
                    category_size += 1000  # Conservative estimate
            
            self.cache_sizes[category] = category_size / (1024 * 1024)  # Convert to MB
            total_usage += self.cache_sizes[category]
        
        self.total_memory_usage = total_usage
    
    def _emergency_cache_clear(self):
        """Emergency cache clearing for medical safety"""
        if self.emergency_mode:
            return  # Already in emergency mode
        
        self.emergency_mode = True
        self.last_emergency_clear = datetime.now()
        
        logger.error("[MEDICAL CACHE] EMERGENCY CACHE CLEAR - Medical system protection")
        
        try:
            # Clear all non-critical caches first
            non_critical = ['temporary', 'api_responses', 'static_content']
            for category in non_critical:
                if category in self.caches:
                    cleared_count = len(self.caches[category])
                    self.caches[category].clear()
                    logger.warning(f"[MEDICAL CACHE] Cleared {category}: {cleared_count} items")
            
            # If still over limit, clear user sessions
            self._update_memory_usage()
            if self.total_memory_usage > self.emergency_threshold_mb:
                cleared_count = len(self.caches['user_session'])
                self.caches['user_session'].clear()
                logger.warning(f"[MEDICAL CACHE] Cleared user_session: {cleared_count} items")
            
            # Last resort: clear half of medical critical (keep most recent)
            self._update_memory_usage()
            if self.total_memory_usage > self.emergency_threshold_mb:
                medical_cache = self.caches['medical_critical']
                items_to_keep = len(medical_cache) // 2
                
                # Keep most recently accessed items
                recent_items = list(medical_cache.items())[-items_to_keep:]
                medical_cache.clear()
                medical_cache.update(recent_items)
                
                logger.error(f"[MEDICAL CACHE] Emergency: Reduced medical_critical to {items_to_keep} items")
            
            # Force garbage collection
            gc.collect()
            gc.collect()
            
            # Update final usage
            self._update_memory_usage()
            
            logger.info(f"[MEDICAL CACHE] Emergency clear completed - Usage: {self.total_memory_usage:.1f}MB")
            
        except Exception as e:
            logger.error(f"[MEDICAL CACHE] Emergency clear failed: {e}")
        
        finally:
            # Reset emergency mode after 30 seconds
            threading.Timer(30.0, lambda: setattr(self, 'emergency_mode', False)).start()
    
    def _cleanup_expired_items(self):
        """Clean up expired cache items"""
        current_time = datetime.now()
        expired_threshold = current_time - timedelta(minutes=30)  # 30 min expiry
        
        for category, cache in self.caches.items():
            expired_keys = []
            
            for key in cache.keys():
                cache_key = f"{category}:{key}"
                access_time = self.cache_access_times.get(cache_key)
                
                if access_time and access_time < expired_threshold:
                    expired_keys.append(key)
            
            # Remove expired items
            for key in expired_keys:
                try:
                    del cache[key]
                    cache_key = f"{category}:{key}"
                    self.cache_access_times.pop(cache_key, None)
                except KeyError:
                    pass
            
            if expired_keys:
                logger.debug(f"[MEDICAL CACHE] Expired {len(expired_keys)} items from {category}")
    
    def get(self, category: str, key: str) -> Optional[Any]:
        """Get item from medical cache"""
        if category not in self.caches:
            return None
        
        with self._monitoring_lock:
            cache = self.caches[category]
            
            if key in cache:
                # Update access time
                cache_key = f"{category}:{key}"
                self.cache_access_times[cache_key] = datetime.now()
                
                # Move to end (LRU)
                value = cache[key]
                del cache[key]
                cache[key] = value
                
                return value
        
        return None
    
    def set(self, category: str, key: str, value: Any, max_size_mb: float = 1.0) -> bool:
        """Set item in medical cache with strict limits"""
        if category not in self.caches:
            logger.warning(f"[MEDICAL CACHE] Invalid category: {category}")
            return False
        
        # Check item size
        try:
            item_size_mb = (sys.getsizeof(key) + sys.getsizeof(value)) / (1024 * 1024)
            if item_size_mb > max_size_mb:
                logger.warning(f"[MEDICAL CACHE] Item too large: {item_size_mb:.2f}MB > {max_size_mb}MB")
                return False
        except Exception:
            logger.warning(f"[MEDICAL CACHE] Could not calculate item size")
            return False
        
        with self._monitoring_lock:
            cache = self.caches[category]
            
            # Check cache limit
            if len(cache) >= self.cache_limits[category]:
                # Remove oldest item
                if cache:
                    oldest_key = next(iter(cache))
                    del cache[oldest_key]
                    cache_key = f"{category}:{oldest_key}"
                    self.cache_access_times.pop(cache_key, None)
            
            # Add new item
            cache[key] = value
            cache_key = f"{category}:{key}"
            self.cache_access_times[cache_key] = datetime.now()
            
            # Check total memory after addition
            self._update_memory_usage()
            if self.total_memory_usage > self.max_total_memory_mb:
                logger.warning(f"[MEDICAL CACHE] Memory limit exceeded: {self.total_memory_usage:.1f}MB")
                self._emergency_cache_clear()
            
            return True
    
    def clear_category(self, category: str) -> int:
        """Clear entire category"""
        if category not in self.caches:
            return 0
        
        with self._monitoring_lock:
            cache = self.caches[category]
            count = len(cache)
            cache.clear()
            
            # Clear access times for this category
            keys_to_remove = [k for k in self.cache_access_times.keys() if k.startswith(f"{category}:")]
            for key in keys_to_remove:
                del self.cache_access_times[key]
            
            logger.info(f"[MEDICAL CACHE] Cleared category {category}: {count} items")
            return count
    
    def clear_all(self) -> Dict[str, int]:
        """Clear all caches - emergency use only"""
        logger.warning("[MEDICAL CACHE] CLEARING ALL CACHES - Emergency procedure")
        
        cleared_counts = {}
        
        with self._monitoring_lock:
            for category, cache in self.caches.items():
                cleared_counts[category] = len(cache)
                cache.clear()
            
            self.cache_access_times.clear()
            self.total_memory_usage = 0.0
            
            # Force garbage collection
            gc.collect()
            gc.collect()
        
        return cleared_counts
    
    def get_medical_stats(self) -> Dict[str, Any]:
        """Get medical-grade cache statistics"""
        with self._monitoring_lock:
            self._update_memory_usage()
            
            stats = {
                "total_memory_mb": round(self.total_memory_usage, 2),
                "max_memory_mb": self.max_total_memory_mb,
                "memory_utilization_percent": round((self.total_memory_usage / self.max_total_memory_mb) * 100, 1),
                "emergency_mode": self.emergency_mode,
                "last_emergency_clear": self.last_emergency_clear.isoformat() if self.last_emergency_clear else None,
                "categories": {}
            }
            
            for category, cache in self.caches.items():
                stats["categories"][category] = {
                    "item_count": len(cache),
                    "max_items": self.cache_limits[category],
                    "memory_mb": round(self.cache_sizes.get(category, 0), 2),
                    "utilization_percent": round((len(cache) / self.cache_limits[category]) * 100, 1)
                }
            
            # System memory info
            try:
                system_memory = psutil.virtual_memory()
                stats["system_memory"] = {
                    "percent_used": round(system_memory.percent, 1),
                    "available_gb": round(system_memory.available / (1024**3), 1),
                    "critical_level": system_memory.percent > 85.0
                }
            except Exception:
                stats["system_memory"] = {"error": "Unable to read system memory"}
            
            stats["timestamp"] = datetime.now().isoformat()
            
            return stats
    
    def force_medical_optimization(self) -> Dict[str, Any]:
        """Force immediate optimization for medical safety"""
        logger.info("[MEDICAL CACHE] Forcing medical optimization")
        
        initial_usage = self.total_memory_usage
        
        # Step 1: Clear temporary and API caches
        cleared_temp = self.clear_category('temporary')
        cleared_api = self.clear_category('api_responses')
        
        # Step 2: Clean up expired items
        self._cleanup_expired_items()
        
        # Step 3: Force garbage collection
        gc.collect()
        gc.collect()
        
        # Step 4: Update usage
        self._update_memory_usage()
        
        return {
            "initial_memory_mb": round(initial_usage, 2),
            "final_memory_mb": round(self.total_memory_usage, 2),
            "memory_freed_mb": round(initial_usage - self.total_memory_usage, 2),
            "items_cleared": {
                "temporary": cleared_temp,
                "api_responses": cleared_api
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def shutdown(self):
        """Shutdown medical cache system"""
        logger.info("[MEDICAL CACHE] Shutting down...")
        
        self._shutdown_event.set()
        
        if self._monitor_thread and self._monitor_thread.is_alive():
            self._monitor_thread.join(timeout=5)
        
        # Clear all caches
        self.clear_all()
        
        logger.info("[MEDICAL CACHE] Shutdown completed")

# Global medical cache instance
_medical_cache = None

def get_medical_cache() -> MedicalCacheOptimizer:
    """Get global medical cache optimizer instance"""
    global _medical_cache
    if _medical_cache is None:
        _medical_cache = MedicalCacheOptimizer(max_total_memory_mb=10.0)  # Ultra-low 10MB limit
    return _medical_cache

def get_medical_cache_stats() -> Dict[str, Any]:
    """Get medical cache statistics"""
    cache = get_medical_cache()
    return cache.get_medical_stats()

def force_medical_cache_optimization() -> Dict[str, Any]:
    """Force medical cache optimization"""
    cache = get_medical_cache()
    return cache.force_medical_optimization()

def emergency_clear_medical_cache() -> Dict[str, Any]:
    """Emergency clear of all medical caches"""
    cache = get_medical_cache()
    cleared = cache.clear_all()
    
    return {
        "status": "emergency_clear_completed",
        "cleared_counts": cleared,
        "timestamp": datetime.now().isoformat()
    }
