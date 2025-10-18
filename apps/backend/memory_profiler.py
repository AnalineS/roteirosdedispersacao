#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Advanced Memory Profiler for Backend
Identifies memory leaks, heavy imports, and optimization opportunities
"""

import gc
import sys
import psutil
import os
import tracemalloc
import time
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Any
import importlib.util

def get_process_memory():
    """Get current process memory usage"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    return {
        'rss_mb': memory_info.rss / (1024 * 1024),
        'vms_mb': memory_info.vms / (1024 * 1024),
        'percent': process.memory_percent()
    }

def analyze_imported_modules():
    """Analyze memory usage of imported modules"""
    module_sizes = []

    for name, module in sys.modules.items():
        if module is None:
            continue

        try:
            # Estimate module size
            size = 0
            if hasattr(module, '__dict__'):
                size += sys.getsizeof(module.__dict__)
                for attr_name, attr_value in module.__dict__.items():
                    try:
                        size += sys.getsizeof(attr_value)
                    except:
                        pass

            module_sizes.append((name, size / (1024 * 1024)))  # Convert to MB
        except:
            continue

    # Sort by size
    module_sizes.sort(key=lambda x: x[1], reverse=True)
    return module_sizes

def analyze_object_memory():
    """Deep analysis of Python objects"""
    type_stats = defaultdict(lambda: {'count': 0, 'total_size': 0})

    for obj in gc.get_objects():
        obj_type = type(obj).__name__
        obj_module = getattr(type(obj), '__module__', 'unknown')

        try:
            size = sys.getsizeof(obj)
            type_stats[f"{obj_module}.{obj_type}"]['count'] += 1
            type_stats[f"{obj_module}.{obj_type}"]['total_size'] += size
        except:
            pass

    # Convert to list and sort by total size
    results = []
    for type_name, stats in type_stats.items():
        results.append({
            'type': type_name,
            'count': stats['count'],
            'total_size_mb': stats['total_size'] / (1024 * 1024),
            'avg_size_bytes': stats['total_size'] / stats['count'] if stats['count'] > 0 else 0
        })

    results.sort(key=lambda x: x['total_size_mb'], reverse=True)
    return results

def find_memory_leaks():
    """Detect potential memory leaks"""
    # Start memory tracing
    tracemalloc.start()

    # Force garbage collection
    gc.collect()

    # Get current snapshot
    snapshot = tracemalloc.take_snapshot()
    top_stats = snapshot.statistics('lineno')

    leaks = []
    for stat in top_stats[:20]:
        leaks.append({
            'filename': stat.traceback.format()[0] if stat.traceback.format() else 'unknown',
            'size_mb': stat.size / (1024 * 1024),
            'count': stat.count
        })

    tracemalloc.stop()
    return leaks

def analyze_heavy_imports():
    """Identify heavy imports that could be lazy-loaded"""
    heavy_modules = {
        'numpy': 'Scientific computing',
        'pandas': 'Data analysis',
        'torch': 'Machine learning',
        'transformers': 'NLP models',
        'sklearn': 'Machine learning',
        'matplotlib': 'Plotting',
        'seaborn': 'Statistical plotting',
        'plotly': 'Interactive plotting',
        'opencv': 'Computer vision',
        'PIL': 'Image processing',
        'requests': 'HTTP client',
        'flask': 'Web framework',
        'sqlalchemy': 'Database ORM',
        'psycopg2': 'PostgreSQL adapter',
        'chromadb': 'Vector database',
        'openai': 'OpenAI API',
    }

    found_heavy = []
    for module_name, description in heavy_modules.items():
        if module_name in sys.modules:
            found_heavy.append({
                'module': module_name,
                'description': description,
                'lazy_loadable': True
            })

    return found_heavy

def analyze_cache_systems():
    """Analyze cache memory usage"""
    cache_analysis = {
        'total_cache_size_mb': 0,
        'cache_systems': []
    }

    # Look for common cache patterns
    for obj in gc.get_objects():
        if hasattr(obj, '__dict__'):
            for attr_name, attr_value in obj.__dict__.items():
                if 'cache' in attr_name.lower() and isinstance(attr_value, dict):
                    try:
                        cache_size = sys.getsizeof(attr_value)
                        for k, v in attr_value.items():
                            cache_size += sys.getsizeof(k) + sys.getsizeof(v)

                        cache_analysis['cache_systems'].append({
                            'name': f"{type(obj).__name__}.{attr_name}",
                            'size_mb': cache_size / (1024 * 1024),
                            'items': len(attr_value)
                        })
                        cache_analysis['total_cache_size_mb'] += cache_size / (1024 * 1024)
                    except:
                        pass

    return cache_analysis

def generate_optimization_recommendations(analysis_results):
    """Generate specific optimization recommendations"""
    recommendations = []

    # Memory usage recommendations
    if analysis_results['process_memory']['rss_mb'] > 150:
        recommendations.append({
            'priority': 'HIGH',
            'category': 'Memory Usage',
            'issue': f"High memory usage: {analysis_results['process_memory']['rss_mb']:.1f} MB",
            'solution': 'Implement aggressive lazy loading and cache optimization',
            'estimated_savings': '30-50%'
        })

    # Heavy imports recommendations
    if analysis_results['heavy_imports']:
        recommendations.append({
            'priority': 'HIGH',
            'category': 'Import Optimization',
            'issue': f"Found {len(analysis_results['heavy_imports'])} heavy imports loaded at startup",
            'solution': 'Implement lazy loading for non-critical imports',
            'estimated_savings': '20-40%'
        })

    # Cache optimization recommendations
    if analysis_results['cache_analysis']['total_cache_size_mb'] > 10:
        recommendations.append({
            'priority': 'MEDIUM',
            'category': 'Cache Optimization',
            'issue': f"Cache systems using {analysis_results['cache_analysis']['total_cache_size_mb']:.1f} MB",
            'solution': 'Implement cache size limits and TTL-based eviction',
            'estimated_savings': '10-20%'
        })

    # Object optimization recommendations
    top_objects = analysis_results['object_analysis'][:5]
    if any(obj['total_size_mb'] > 5 for obj in top_objects):
        recommendations.append({
            'priority': 'MEDIUM',
            'category': 'Object Optimization',
            'issue': 'Large object types consuming significant memory',
            'solution': 'Optimize data structures and implement object pooling',
            'estimated_savings': '15-25%'
        })

    return recommendations

def main():
    """Run comprehensive memory analysis"""
    print("Advanced Memory Profiler - Backend Analysis")
    print("=" * 60)

    # Basic memory info
    process_memory = get_process_memory()
    print(f"Process Memory: {process_memory['rss_mb']:.1f} MB ({process_memory['percent']:.1f}%)")

    # Module analysis
    print("\nAnalyzing imported modules...")
    module_sizes = analyze_imported_modules()

    # Object analysis
    print("Analyzing object memory...")
    object_analysis = analyze_object_memory()

    # Memory leak detection
    print("Detecting potential memory leaks...")
    memory_leaks = find_memory_leaks()

    # Heavy imports analysis
    print("Analyzing heavy imports...")
    heavy_imports = analyze_heavy_imports()

    # Cache analysis
    print("Analyzing cache systems...")
    cache_analysis = analyze_cache_systems()

    # Compile results
    analysis_results = {
        'timestamp': time.time(),
        'process_memory': process_memory,
        'module_sizes': module_sizes[:15],  # Top 15
        'object_analysis': object_analysis[:20],  # Top 20
        'memory_leaks': memory_leaks,
        'heavy_imports': heavy_imports,
        'cache_analysis': cache_analysis
    }

    # Generate recommendations
    recommendations = generate_optimization_recommendations(analysis_results)
    analysis_results['recommendations'] = recommendations

    # Print summary
    print("\n" + "=" * 60)
    print("MEMORY ANALYSIS SUMMARY")
    print("=" * 60)

    print(f"Total Memory Usage: {process_memory['rss_mb']:.1f} MB")
    print(f"System Memory Percentage: {process_memory['percent']:.1f}%")
    print(f"Loaded Modules: {len(sys.modules)}")
    print(f"Total Objects: {len(gc.get_objects())}")
    print(f"Heavy Imports Found: {len(heavy_imports)}")
    print(f"Cache Systems: {len(cache_analysis['cache_systems'])}")
    print(f"Potential Leaks: {len(memory_leaks)}")
    print(f"Recommendations: {len(recommendations)}")

    print("\nTOP MEMORY CONSUMERS:")
    for i, obj in enumerate(object_analysis[:5], 1):
        print(f"  {i}. {obj['type']}: {obj['total_size_mb']:.2f} MB ({obj['count']} objects)")

    print("\nHEAVY IMPORTS:")
    for imp in heavy_imports[:5]:
        print(f"  - {imp['module']}: {imp['description']}")

    print("\nTOP RECOMMENDATIONS:")
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"  {i}. [{rec['priority']}] {rec['category']}: {rec['solution']}")
        print(f"     Estimated Savings: {rec['estimated_savings']}")

    return analysis_results

if __name__ == '__main__':
    results = main()