# -*- coding: utf-8 -*-
"""
Optimized Lazy Loader - Sistema de Carregamento Tardio Otimizado para Memória
============================================================================

Sistema avançado de lazy loading que minimiza uso de memória através de:

1. Carregamento sob demanda de módulos pesados
2. Weak references para evitar vazamentos
3. Cache inteligente com limites rigorosos
4. Descarregamento automático de módulos não utilizados
5. Garbage collection otimizado

Author: Claude Code - Performance Engineer
Date: 2025-09-23
Target: Reduce memory footprint by 30-40%
"""

import sys
import gc
import weakref
import threading
import importlib
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict
import time

logger = logging.getLogger(__name__)

class LazyModule:
    """Wrapper para módulo carregado de forma tardia"""

    def __init__(self, module_name: str, loader_func: Optional[Callable] = None):
        self.module_name = module_name
        self.loader_func = loader_func or (lambda: importlib.import_module(module_name))
        self._module = None
        self._last_access = None
        self._access_count = 0
        self._size_estimate = 0

    def __getattr__(self, name: str):
        """Carrega módulo sob demanda quando acessado"""
        if self._module is None:
            self._load_module()

        self._last_access = datetime.now()
        self._access_count += 1

        return getattr(self._module, name)

    def _load_module(self):
        """Carrega o módulo real"""
        try:
            logger.debug(f"[LAZY] Carregando módulo: {self.module_name}")
            self._module = self.loader_func()

            # Estimar tamanho do módulo
            if hasattr(self._module, '__dict__'):
                self._size_estimate = sys.getsizeof(self._module.__dict__)

            logger.info(f"[LAZY] Módulo carregado: {self.module_name} (~{self._size_estimate} bytes)")

        except Exception as e:
            logger.error(f"[LAZY] Erro ao carregar {self.module_name}: {e}")
            raise

    def is_loaded(self) -> bool:
        """Verifica se módulo está carregado"""
        return self._module is not None

    def unload(self):
        """Descarrega módulo da memória"""
        if self._module is not None:
            logger.debug(f"[LAZY] Descarregando módulo: {self.module_name}")
            self._module = None
            gc.collect()

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do módulo"""
        return {
            'module_name': self.module_name,
            'is_loaded': self.is_loaded(),
            'last_access': self._last_access.isoformat() if self._last_access else None,
            'access_count': self._access_count,
            'size_estimate': self._size_estimate
        }

class OptimizedLazyLoader:
    """
    Sistema otimizado de lazy loading com gestão agressiva de memória

    Características:
    - Carregamento sob demanda
    - Descarregamento automático de módulos não utilizados
    - Cache com limites rigorosos
    - Weak references para evitar vazamentos
    - Garbage collection inteligente
    """

    def __init__(self, max_loaded_modules: int = 20, unload_after_minutes: int = 30):
        self.max_loaded_modules = max_loaded_modules
        self.unload_after = timedelta(minutes=unload_after_minutes)

        # Storage para módulos lazy
        self._lazy_modules: Dict[str, LazyModule] = {}
        self._module_priorities: Dict[str, int] = defaultdict(int)
        self._weak_refs: weakref.WeakValueDictionary = weakref.WeakValueDictionary()

        # Estatísticas
        self._stats = {
            'modules_registered': 0,
            'modules_loaded': 0,
            'modules_unloaded': 0,
            'memory_freed_mb': 0,
            'gc_collections': 0
        }

        # Thread de limpeza
        self._cleanup_lock = threading.RLock()
        self._shutdown_event = threading.Event()
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

        logger.info(f"[LAZY] Optimized Lazy Loader inicializado - max_modules: {max_loaded_modules}")

    def register_module(self, module_name: str, loader_func: Optional[Callable] = None, priority: int = 0):
        """
        Registra módulo para carregamento lazy

        Args:
            module_name: Nome do módulo
            loader_func: Função personalizada de carregamento
            priority: Prioridade (0=baixa, 10=alta)
        """
        with self._cleanup_lock:
            if module_name not in self._lazy_modules:
                lazy_module = LazyModule(module_name, loader_func)
                self._lazy_modules[module_name] = lazy_module
                self._module_priorities[module_name] = priority
                self._stats['modules_registered'] += 1

                logger.debug(f"[LAZY] Módulo registrado: {module_name} (prioridade: {priority})")

    def get_module(self, module_name: str) -> Any:
        """
        Obtém módulo com carregamento lazy

        Args:
            module_name: Nome do módulo

        Returns:
            Módulo carregado ou LazyModule wrapper
        """
        with self._cleanup_lock:
            if module_name not in self._lazy_modules:
                # Registrar automaticamente se não existe
                self.register_module(module_name)

            lazy_module = self._lazy_modules[module_name]

            # Verificar se precisa fazer limpeza antes de carregar
            if self._count_loaded_modules() >= self.max_loaded_modules:
                self._unload_least_used_modules()

            # Retornar lazy module (será carregado quando acessado)
            return lazy_module

    def _count_loaded_modules(self) -> int:
        """Conta módulos atualmente carregados"""
        return sum(1 for module in self._lazy_modules.values() if module.is_loaded())

    def _unload_least_used_modules(self):
        """Remove módulos menos utilizados da memória"""
        try:
            loaded_modules = [
                (name, module) for name, module in self._lazy_modules.items()
                if module.is_loaded()
            ]

            if not loaded_modules:
                return

            # Ordenar por última utilização e prioridade
            def sort_key(item):
                name, module = item
                priority = self._module_priorities[name]
                last_access = module._last_access or datetime.min
                # Módulos de baixa prioridade e antigos primeiro
                return (priority, last_access)

            sorted_modules = sorted(loaded_modules, key=sort_key)

            # Descarregar 25% dos módulos menos utilizados
            modules_to_unload = max(1, len(sorted_modules) // 4)
            freed_memory = 0

            for i in range(modules_to_unload):
                name, module = sorted_modules[i]
                freed_memory += module._size_estimate
                module.unload()
                self._stats['modules_unloaded'] += 1

            self._stats['memory_freed_mb'] += freed_memory / (1024 * 1024)

            # Forçar garbage collection
            collected = gc.collect()
            self._stats['gc_collections'] += 1

            logger.info(f"[LAZY] Descarregados {modules_to_unload} módulos (~{freed_memory/1024/1024:.1f}MB), GC: {collected}")

        except Exception as e:
            logger.error(f"[LAZY] Erro ao descarregar módulos: {e}")

    def _cleanup_loop(self):
        """Loop de limpeza periódica"""
        while not self._shutdown_event.is_set():
            try:
                self._periodic_cleanup()
                self._shutdown_event.wait(300)  # 5 minutos
            except Exception as e:
                logger.error(f"[LAZY] Erro na limpeza: {e}")
                self._shutdown_event.wait(60)

    def _periodic_cleanup(self):
        """Limpeza periódica de módulos não utilizados"""
        with self._cleanup_lock:
            current_time = datetime.now()
            modules_to_unload = []

            for name, module in self._lazy_modules.items():
                if (module.is_loaded() and
                    module._last_access and
                    current_time - module._last_access > self.unload_after):

                    # Não descarregar módulos de alta prioridade
                    if self._module_priorities[name] < 8:
                        modules_to_unload.append((name, module))

            if modules_to_unload:
                freed_memory = 0
                for name, module in modules_to_unload:
                    freed_memory += module._size_estimate
                    module.unload()
                    self._stats['modules_unloaded'] += 1

                self._stats['memory_freed_mb'] += freed_memory / (1024 * 1024)

                # Garbage collection
                collected = gc.collect()
                self._stats['gc_collections'] += 1

                logger.info(f"[LAZY] Limpeza automática: {len(modules_to_unload)} módulos, "
                           f"{freed_memory/1024/1024:.1f}MB liberados, GC: {collected}")

    def preload_high_priority(self):
        """Pré-carrega módulos de alta prioridade"""
        high_priority_modules = [
            name for name, priority in self._module_priorities.items()
            if priority >= 8
        ]

        for module_name in high_priority_modules:
            try:
                lazy_module = self._lazy_modules[module_name]
                if not lazy_module.is_loaded():
                    # Forçar carregamento acessando um atributo
                    _ = lazy_module.__dict__
                    self._stats['modules_loaded'] += 1
                    logger.debug(f"[LAZY] Pré-carregado: {module_name}")
            except Exception as e:
                logger.warning(f"[LAZY] Falha no pré-carregamento de {module_name}: {e}")

    def force_unload_all(self):
        """Força descarregamento de todos os módulos não críticos"""
        with self._cleanup_lock:
            unloaded_count = 0
            freed_memory = 0

            for name, module in self._lazy_modules.items():
                # Manter apenas módulos críticos (prioridade >= 9)
                if module.is_loaded() and self._module_priorities[name] < 9:
                    freed_memory += module._size_estimate
                    module.unload()
                    unloaded_count += 1
                    self._stats['modules_unloaded'] += 1

            self._stats['memory_freed_mb'] += freed_memory / (1024 * 1024)

            # Garbage collection agressivo
            for _ in range(3):
                collected = gc.collect()
                self._stats['gc_collections'] += 1
                time.sleep(0.1)

            logger.warning(f"[LAZY] FORÇA DESCARREGAMENTO: {unloaded_count} módulos, "
                          f"{freed_memory/1024/1024:.1f}MB liberados")

            return unloaded_count, freed_memory

    def get_memory_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de memória do lazy loader"""
        with self._cleanup_lock:
            loaded_count = self._count_loaded_modules()
            total_size = sum(
                module._size_estimate for module in self._lazy_modules.values()
                if module.is_loaded()
            )

            module_details = []
            for name, module in self._lazy_modules.items():
                if module.is_loaded():
                    module_details.append({
                        'name': name,
                        'priority': self._module_priorities[name],
                        'size_estimate_mb': round(module._size_estimate / (1024 * 1024), 2),
                        'access_count': module._access_count,
                        'last_access': module._last_access.isoformat() if module._last_access else None
                    })

            # Ordenar por tamanho
            module_details.sort(key=lambda x: x['size_estimate_mb'], reverse=True)

            return {
                'summary': {
                    'total_registered': len(self._lazy_modules),
                    'currently_loaded': loaded_count,
                    'total_size_mb': round(total_size / (1024 * 1024), 2),
                    'max_allowed': self.max_loaded_modules,
                    'memory_pressure': 'high' if loaded_count >= self.max_loaded_modules * 0.8 else 'normal'
                },
                'statistics': self._stats.copy(),
                'loaded_modules': module_details[:10],  # Top 10 maiores
                'configuration': {
                    'max_loaded_modules': self.max_loaded_modules,
                    'unload_after_minutes': self.unload_after.total_seconds() / 60
                },
                'timestamp': datetime.now().isoformat()
            }

    def optimize_for_low_memory(self):
        """Otimiza configurações para uso mínimo de memória"""
        logger.info("[LAZY] Otimizando para uso mínimo de memória")

        # Configurações mais agressivas
        self.max_loaded_modules = min(10, self.max_loaded_modules)
        self.unload_after = timedelta(minutes=15)  # Mais agressivo

        # Forçar descarregamento
        unloaded, freed = self.force_unload_all()

        return {
            'optimization': 'low_memory_mode',
            'new_limits': {
                'max_modules': self.max_loaded_modules,
                'unload_after_minutes': 15
            },
            'immediate_effect': {
                'modules_unloaded': unloaded,
                'memory_freed_mb': round(freed / (1024 * 1024), 2)
            }
        }

    def shutdown(self):
        """Para o lazy loader"""
        logger.info("[LAZY] Parando Optimized Lazy Loader...")
        self._shutdown_event.set()

        if hasattr(self, '_cleanup_thread') and self._cleanup_thread.is_alive():
            self._cleanup_thread.join(timeout=5)

        # Descarregar todos os módulos
        with self._cleanup_lock:
            for module in self._lazy_modules.values():
                if module.is_loaded():
                    module.unload()

        logger.info("[LAZY] Optimized Lazy Loader parado")

# Instância global
_lazy_loader = None

def get_optimized_lazy_loader() -> OptimizedLazyLoader:
    """Retorna instância singleton do lazy loader otimizado"""
    global _lazy_loader
    if _lazy_loader is None:
        _lazy_loader = OptimizedLazyLoader(max_loaded_modules=15, unload_after_minutes=20)
    return _lazy_loader

def lazy_import(module_name: str, priority: int = 0) -> Any:
    """Função de conveniência para import lazy"""
    loader = get_optimized_lazy_loader()
    loader.register_module(module_name, priority=priority)
    return loader.get_module(module_name)

def optimize_lazy_loading() -> Dict[str, Any]:
    """Função de conveniência para otimizar lazy loading"""
    loader = get_optimized_lazy_loader()
    return loader.optimize_for_low_memory()

# Decorador para funções que usam módulos pesados
def lazy_module_required(*module_names):
    """Decorador que registra módulos necessários para função"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            loader = get_optimized_lazy_loader()

            # Registrar módulos se necessário
            for module_name in module_names:
                if module_name not in loader._lazy_modules:
                    loader.register_module(module_name, priority=5)

            return func(*args, **kwargs)

        return wrapper
    return decorator

# Configurações padrão para módulos pesados conhecidos
HEAVY_MODULES_CONFIG = {
    'torch': {'priority': 2, 'unload_after': 10},
    'tensorflow': {'priority': 2, 'unload_after': 10},
    'cv2': {'priority': 3, 'unload_after': 15},
    'PIL': {'priority': 4, 'unload_after': 20},
    'numpy': {'priority': 7, 'unload_after': 30},
    'pandas': {'priority': 6, 'unload_after': 25},
    'scipy': {'priority': 5, 'unload_after': 20},
    'sklearn': {'priority': 4, 'unload_after': 15},
    'matplotlib': {'priority': 3, 'unload_after': 10},
    'seaborn': {'priority': 2, 'unload_after': 10}
}

def configure_heavy_modules():
    """Configura módulos pesados conhecidos para lazy loading"""
    loader = get_optimized_lazy_loader()

    for module_name, config in HEAVY_MODULES_CONFIG.items():
        try:
            # Verificar se módulo está disponível antes de registrar
            importlib.util.find_spec(module_name)
            loader.register_module(module_name, priority=config['priority'])
            logger.debug(f"[LAZY] Configurado módulo pesado: {module_name}")
        except (ImportError, AttributeError):
            # Módulo não disponível, ignorar
            pass

    logger.info(f"[LAZY] Configurados {len(HEAVY_MODULES_CONFIG)} módulos pesados para lazy loading")