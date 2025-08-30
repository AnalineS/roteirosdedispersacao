# -*- coding: utf-8 -*-
"""
Performance Load Tests - Testes de Performance e Carga
======================================================

Cenário que valida performance, response times, memory usage
e comportamento sob carga do sistema.

Migrado de:
- tests/backend/test_performance_benchmarks.py
- tests/integration/test_backend_frontend.py (performance tests)

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import asyncio
import aiohttp
import time
import psutil
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from statistics import mean, median
import os

logger = logging.getLogger('performance_load')

class PerformanceLoadTests:
    """Testes de performance e carga do sistema"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_base_url = config["api_base_url"]
        self.timeout = config["timeout"]
        self.concurrent_requests = config["concurrent_requests"]
        self.extensive_tests = config.get("extensive_tests", False)
        
        # Targets de performance
        self.performance_targets = {
            "p50_response_time": 1000,  # ms
            "p95_response_time": 2000,  # ms
            "p99_response_time": 3000,  # ms
            "max_memory_usage": 256,    # MB
            "max_cpu_usage": 70,        # %
            "min_throughput": 10        # requests/second
        }
        
        # Resultados
        self.results = {
            "start_time": datetime.utcnow(),
            "passed": 0,
            "total": 0,
            "details": [],
            "metrics": {},
            "status": "pending"
        }
    
    async def run_tests(self) -> Dict[str, Any]:
        """Executa todos os testes de performance"""
        logger.info("⚡ Iniciando testes de performance...")
        
        # Lista de testes de performance
        if self.extensive_tests:
            test_methods = [
                ("response_time_baseline", self._test_response_time_baseline),
                ("concurrent_load", self._test_concurrent_load),
                ("sustained_load", self._test_sustained_load),
                ("memory_usage", self._test_memory_usage),
                ("cpu_utilization", self._test_cpu_utilization),
                ("throughput_measurement", self._test_throughput_measurement),
                ("cache_performance", self._test_cache_performance),
                ("error_rate_under_load", self._test_error_rate_under_load),
                ("recovery_after_load", self._test_recovery_after_load)
            ]
        else:
            # Testes básicos para ambiente local
            test_methods = [
                ("response_time_baseline", self._test_response_time_baseline),
                ("concurrent_load", self._test_concurrent_load),
                ("basic_throughput", self._test_basic_throughput),
                ("memory_check", self._test_basic_memory_check)
            ]
        
        # Executar testes
        for test_name, test_method in test_methods:
            try:
                logger.info(f"⚡ Executando: {test_name}")
                result = await test_method()
                
                # Adicionar métricas aos resultados gerais
                if "metrics" in result:
                    self.results["metrics"].update(result["metrics"])
                
                self.results["details"].append({
                    "name": test_name,
                    "passed": result["passed"],
                    "duration": result["duration"],
                    "error": result.get("error"),
                    "details": result.get("details", ""),
                    "metrics": result.get("metrics", {})
                })
                
                if result["passed"]:
                    self.results["passed"] += 1
                    logger.info(f"✅ {test_name}: PASSOU ({result['duration']:.2f}s)")
                else:
                    logger.error(f"❌ {test_name}: FALHOU - {result.get('error')}")
                
                self.results["total"] += 1
                
            except Exception as e:
                logger.error(f"💥 Erro crítico em {test_name}: {e}")
                self.results["details"].append({
                    "name": test_name,
                    "passed": False,
                    "duration": 0,
                    "error": str(e),
                    "error_type": "CriticalError"
                })
                self.results["total"] += 1
        
        # Calcular resultado final
        success_rate = (self.results["passed"] / self.results["total"]) * 100 if self.results["total"] > 0 else 0
        self.results["success_rate"] = success_rate
        self.results["status"] = "success" if success_rate >= 80 else "failure"
        self.results["end_time"] = datetime.utcnow()
        self.results["execution_time"] = (self.results["end_time"] - self.results["start_time"]).total_seconds()
        
        logger.info(f"🏁 Testes de performance concluídos: {self.results['passed']}/{self.results['total']} ({success_rate:.1f}%)")
        return self.results
    
    async def _test_response_time_baseline(self) -> Dict[str, Any]:
        """Testa response time baseline em condições normais"""
        start_time = time.time()
        
        endpoints_to_test = [
            "/api/v1/health",
            "/api/v1/personas",
            "/api/test"
        ]
        
        all_response_times = []
        successful_requests = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for endpoint in endpoints_to_test:
                # Fazer 5 requests por endpoint
                for _ in range(5):
                    try:
                        request_start = time.time()
                        url = f"{self.api_base_url}{endpoint}"
                        
                        async with session.get(url) as response:
                            request_time = (time.time() - request_start) * 1000  # Convert to ms
                            
                            if 200 <= response.status < 400:
                                all_response_times.append(request_time)
                                successful_requests += 1
                        
                        await asyncio.sleep(0.1)  # Small delay between requests
                    
                    except Exception:
                        pass
        
        duration = time.time() - start_time
        
        if all_response_times:
            p50 = median(all_response_times)
            p95 = sorted(all_response_times)[int(len(all_response_times) * 0.95)]
            p99 = sorted(all_response_times)[int(len(all_response_times) * 0.99)] if len(all_response_times) > 10 else p95
            avg_response = mean(all_response_times)
            
            metrics = {
                "p50_response_time": p50,
                "p95_response_time": p95, 
                "p99_response_time": p99,
                "avg_response_time": avg_response
            }
            
            # Avaliar se está dentro dos targets
            meets_targets = (
                p50 <= self.performance_targets["p50_response_time"] and
                p95 <= self.performance_targets["p95_response_time"]
            )
            
            return {
                "passed": meets_targets and successful_requests >= 10,
                "duration": duration,
                "metrics": metrics,
                "details": f"P50: {p50:.0f}ms, P95: {p95:.0f}ms, Requests OK: {successful_requests}/15",
                "error": None if meets_targets else f"Response times acima do target (P50: {p50:.0f}ms, P95: {p95:.0f}ms)"
            }
        else:
            return {
                "passed": False,
                "duration": duration,
                "error": "Nenhuma resposta bem-sucedida obtida"
            }
    
    async def _test_concurrent_load(self) -> Dict[str, Any]:
        """Testa comportamento com requisições concorrentes"""
        start_time = time.time()
        
        concurrent_count = self.concurrent_requests
        test_endpoint = "/api/v1/health"
        
        async def make_request(session, semaphore):
            async with semaphore:
                try:
                    request_start = time.time()
                    url = f"{self.api_base_url}{test_endpoint}"
                    
                    async with session.get(url) as response:
                        request_time = (time.time() - request_start) * 1000
                        return {
                            "success": 200 <= response.status < 400,
                            "response_time": request_time,
                            "status": response.status
                        }
                except Exception as e:
                    return {
                        "success": False,
                        "response_time": 0,
                        "error": str(e)
                    }
        
        # Criar semáforo para controlar concorrência
        semaphore = asyncio.Semaphore(concurrent_count)
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            # Executar requisições concorrentes
            tasks = [make_request(session, semaphore) for _ in range(concurrent_count * 2)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        duration = time.time() - start_time
        
        # Analisar resultados
        successful_results = [r for r in results if isinstance(r, dict) and r.get("success", False)]
        failed_results = [r for r in results if not (isinstance(r, dict) and r.get("success", False))]
        
        success_rate = len(successful_results) / len(results) * 100
        
        if successful_results:
            response_times = [r["response_time"] for r in successful_results]
            avg_concurrent_response = mean(response_times)
            max_concurrent_response = max(response_times)
        else:
            avg_concurrent_response = 0
            max_concurrent_response = 0
        
        metrics = {
            "concurrent_success_rate": success_rate,
            "concurrent_avg_response": avg_concurrent_response,
            "concurrent_max_response": max_concurrent_response
        }
        
        # Critérios de aprovação
        meets_criteria = (
            success_rate >= 90 and  # 90% de sucesso mínimo
            avg_concurrent_response <= self.performance_targets["p95_response_time"]
        )
        
        return {
            "passed": meets_criteria,
            "duration": duration,
            "metrics": metrics,
            "details": f"Success rate: {success_rate:.1f}%, Avg response: {avg_concurrent_response:.0f}ms",
            "error": None if meets_criteria else f"Performance degradada sob carga (Success: {success_rate:.1f}%, Avg: {avg_concurrent_response:.0f}ms)"
        }
    
    async def _test_sustained_load(self) -> Dict[str, Any]:
        """Testa carga sustentada por período prolongado"""
        start_time = time.time()
        
        if not self.extensive_tests:
            # Teste simplificado para ambiente local
            test_duration = 10  # seconds
            requests_per_second = 2
        else:
            test_duration = 60  # seconds
            requests_per_second = 5
        
        total_requests = 0
        successful_requests = 0
        response_times = []
        errors = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            end_time = start_time + test_duration
            
            while time.time() < end_time:
                batch_start = time.time()
                
                # Fazer lote de requisições
                for _ in range(requests_per_second):
                    try:
                        request_start = time.time()
                        url = f"{self.api_base_url}/api/v1/health"
                        
                        async with session.get(url) as response:
                            request_time = (time.time() - request_start) * 1000
                            total_requests += 1
                            
                            if 200 <= response.status < 400:
                                successful_requests += 1
                                response_times.append(request_time)
                            else:
                                errors.append(f"HTTP {response.status}")
                    
                    except Exception as e:
                        total_requests += 1
                        errors.append(str(e))
                
                # Aguardar até completar 1 segundo
                batch_duration = time.time() - batch_start
                if batch_duration < 1.0:
                    await asyncio.sleep(1.0 - batch_duration)
        
        duration = time.time() - start_time
        
        # Calcular métricas
        success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
        throughput = successful_requests / duration if duration > 0 else 0
        
        if response_times:
            avg_response_time = mean(response_times)
            p95_response_time = sorted(response_times)[int(len(response_times) * 0.95)]
        else:
            avg_response_time = 0
            p95_response_time = 0
        
        metrics = {
            "sustained_success_rate": success_rate,
            "sustained_throughput": throughput,
            "sustained_avg_response": avg_response_time,
            "sustained_p95_response": p95_response_time
        }
        
        # Critérios de aprovação
        meets_criteria = (
            success_rate >= 85 and
            throughput >= self.performance_targets["min_throughput"] * 0.5 and  # 50% do throughput target
            p95_response_time <= self.performance_targets["p95_response_time"] * 1.2  # 20% tolerance
        )
        
        return {
            "passed": meets_criteria,
            "duration": duration,
            "metrics": metrics,
            "details": f"Requests: {successful_requests}/{total_requests}, Throughput: {throughput:.1f} req/s",
            "error": None if meets_criteria else f"Performance insustentável (Success: {success_rate:.1f}%, Throughput: {throughput:.1f})"
        }
    
    async def _test_memory_usage(self) -> Dict[str, Any]:
        """Monitora uso de memória durante operação"""
        start_time = time.time()
        
        # Obter uso de memória inicial
        initial_memory = psutil.virtual_memory().percent
        process = psutil.Process()
        initial_process_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Fazer algumas requisições para ativar o sistema
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for _ in range(10):
                try:
                    url = f"{self.api_base_url}/api/v1/health"
                    async with session.get(url) as response:
                        await response.read()  # Consume response
                except Exception:
                    pass
                await asyncio.sleep(0.2)
        
        # Aguardar estabilização
        await asyncio.sleep(2)
        
        # Medir memória final
        final_memory = psutil.virtual_memory().percent
        try:
            final_process_memory = process.memory_info().rss / 1024 / 1024  # MB
        except:
            final_process_memory = initial_process_memory  # Fallback
        
        duration = time.time() - start_time
        
        memory_increase = final_memory - initial_memory
        process_memory_usage = final_process_memory
        
        metrics = {
            "memory_usage": process_memory_usage,
            "memory_increase": memory_increase,
            "system_memory_percent": final_memory
        }
        
        # Critérios de aprovação (mais relaxados se não é teste extensivo)
        max_memory_target = self.performance_targets["max_memory_usage"] if self.extensive_tests else 512
        memory_ok = process_memory_usage <= max_memory_target and memory_increase < 10  # Max 10% increase
        
        return {
            "passed": memory_ok,
            "duration": duration,
            "metrics": metrics,
            "details": f"Memory usage: {process_memory_usage:.1f}MB, System: {final_memory:.1f}%",
            "error": None if memory_ok else f"Uso de memória excessivo ({process_memory_usage:.1f}MB)"
        }
    
    async def _test_cpu_utilization(self) -> Dict[str, Any]:
        """Monitora utilização de CPU durante operação"""
        start_time = time.time()
        
        # Monitorar CPU durante algumas requisições
        cpu_readings = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for i in range(5):
                cpu_before = psutil.cpu_percent()
                
                # Fazer requisições
                for _ in range(3):
                    try:
                        url = f"{self.api_base_url}/api/v1/health"
                        async with session.get(url) as response:
                            await response.read()
                    except Exception:
                        pass
                
                await asyncio.sleep(1)  # Wait for CPU reading stabilization
                cpu_after = psutil.cpu_percent()
                cpu_readings.append(max(cpu_before, cpu_after))
        
        duration = time.time() - start_time
        
        if cpu_readings:
            avg_cpu = mean(cpu_readings)
            max_cpu = max(cpu_readings)
        else:
            avg_cpu = 0
            max_cpu = 0
        
        metrics = {
            "avg_cpu_usage": avg_cpu,
            "max_cpu_usage": max_cpu
        }
        
        # Critérios de aprovação
        cpu_ok = max_cpu <= self.performance_targets["max_cpu_usage"]
        
        return {
            "passed": cpu_ok,
            "duration": duration,
            "metrics": metrics,
            "details": f"Avg CPU: {avg_cpu:.1f}%, Max CPU: {max_cpu:.1f}%",
            "error": None if cpu_ok else f"Utilização de CPU muito alta ({max_cpu:.1f}%)"
        }
    
    async def _test_throughput_measurement(self) -> Dict[str, Any]:
        """Mede throughput máximo do sistema"""
        start_time = time.time()
        
        test_duration = 30 if self.extensive_tests else 10  # seconds
        max_concurrent = self.concurrent_requests * 2
        
        requests_completed = 0
        requests_successful = 0
        
        async def worker(session, semaphore, worker_id):
            nonlocal requests_completed, requests_successful
            
            while time.time() - start_time < test_duration:
                async with semaphore:
                    try:
                        url = f"{self.api_base_url}/api/v1/health"
                        async with session.get(url) as response:
                            requests_completed += 1
                            if 200 <= response.status < 400:
                                requests_successful += 1
                    except Exception:
                        requests_completed += 1
                
                await asyncio.sleep(0.01)  # Small delay
        
        # Criar workers concorrentes
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            workers = [worker(session, semaphore, i) for i in range(max_concurrent)]
            await asyncio.gather(*workers, return_exceptions=True)
        
        duration = time.time() - start_time
        
        throughput = requests_successful / duration if duration > 0 else 0
        success_rate = (requests_successful / requests_completed * 100) if requests_completed > 0 else 0
        
        metrics = {
            "max_throughput": throughput,
            "throughput_success_rate": success_rate
        }
        
        # Critérios de aprovação
        throughput_ok = throughput >= self.performance_targets["min_throughput"] and success_rate >= 80
        
        return {
            "passed": throughput_ok,
            "duration": duration,
            "metrics": metrics,
            "details": f"Throughput: {throughput:.1f} req/s, Success: {success_rate:.1f}%",
            "error": None if throughput_ok else f"Throughput insuficiente ({throughput:.1f} req/s)"
        }
    
    async def _test_cache_performance(self) -> Dict[str, Any]:
        """Testa performance do sistema de cache"""
        start_time = time.time()
        
        # Fazer a mesma requisição múltiplas vezes para testar cache
        test_payload = {
            "message": "Performance test cache",
            "persona": "ga",
            "user_id": "cache_perf_test"
        }
        
        response_times = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            url = f"{self.api_base_url}/api/chat"
            headers = {"Content-Type": "application/json"}
            
            # Primeira requisição (cold)
            try:
                request_start = time.time()
                async with session.post(url, json=test_payload, headers=headers) as response:
                    if response.status == 200:
                        cold_time = (time.time() - request_start) * 1000
                        response_times.append(cold_time)
            except Exception:
                cold_time = 0
            
            await asyncio.sleep(0.5)
            
            # Requisições subsequentes (warm cache)
            for _ in range(5):
                try:
                    request_start = time.time()
                    async with session.post(url, json=test_payload, headers=headers) as response:
                        if response.status == 200:
                            warm_time = (time.time() - request_start) * 1000
                            response_times.append(warm_time)
                except Exception:
                    pass
                await asyncio.sleep(0.1)
        
        duration = time.time() - start_time
        
        if len(response_times) >= 2:
            cold_time = response_times[0]
            warm_times = response_times[1:]
            avg_warm_time = mean(warm_times) if warm_times else cold_time
            
            # Cache é eficiente se warm requests são mais rápidas
            cache_efficiency = max(0, (cold_time - avg_warm_time) / cold_time * 100)
        else:
            cold_time = 0
            avg_warm_time = 0
            cache_efficiency = 0
        
        metrics = {
            "cache_cold_time": cold_time,
            "cache_warm_time": avg_warm_time,
            "cache_efficiency": cache_efficiency
        }
        
        # Cache é bom se há melhoria ou se os tempos são consistentemente baixos
        cache_working = cache_efficiency > 10 or avg_warm_time <= 500  # 10% improvement or <500ms
        
        return {
            "passed": cache_working,
            "duration": duration,
            "metrics": metrics,
            "details": f"Cold: {cold_time:.0f}ms, Warm: {avg_warm_time:.0f}ms, Efficiency: {cache_efficiency:.1f}%",
            "error": None if cache_working else "Performance de cache inadequada"
        }
    
    async def _test_error_rate_under_load(self) -> Dict[str, Any]:
        """Testa taxa de erro sob carga"""
        start_time = time.time()
        
        # Submeter carga e monitorar erros
        total_requests = 50 if self.extensive_tests else 20
        concurrent_requests = self.concurrent_requests
        
        successful_requests = 0
        error_requests = 0
        
        async def make_load_request(session):
            nonlocal successful_requests, error_requests
            try:
                url = f"{self.api_base_url}/api/v1/health"
                async with session.get(url) as response:
                    if 200 <= response.status < 400:
                        successful_requests += 1
                    else:
                        error_requests += 1
            except Exception:
                error_requests += 1
        
        # Executar requests concorrentes em batches
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for batch in range(0, total_requests, concurrent_requests):
                batch_size = min(concurrent_requests, total_requests - batch)
                tasks = [make_load_request(session) for _ in range(batch_size)]
                await asyncio.gather(*tasks, return_exceptions=True)
                await asyncio.sleep(0.1)  # Small delay between batches
        
        duration = time.time() - start_time
        
        error_rate = (error_requests / (successful_requests + error_requests) * 100) if (successful_requests + error_requests) > 0 else 0
        
        metrics = {
            "load_error_rate": error_rate,
            "load_successful_requests": successful_requests,
            "load_failed_requests": error_requests
        }
        
        # Taxa de erro aceitável
        error_rate_ok = error_rate <= 5  # Max 5% error rate
        
        return {
            "passed": error_rate_ok,
            "duration": duration,
            "metrics": metrics,
            "details": f"Error rate: {error_rate:.1f}%, Success: {successful_requests}, Errors: {error_requests}",
            "error": None if error_rate_ok else f"Taxa de erro muito alta sob carga ({error_rate:.1f}%)"
        }
    
    async def _test_recovery_after_load(self) -> Dict[str, Any]:
        """Testa recuperação do sistema após carga intensa"""
        start_time = time.time()
        
        # Submeter carga intensa rapidamente
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            tasks = []
            for _ in range(self.concurrent_requests * 3):  # Carga 3x maior
                url = f"{self.api_base_url}/api/v1/health"
                tasks.append(session.get(url))
            
            # Executar todas as requisições de uma vez
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aguardar recuperação
        await asyncio.sleep(3)
        
        # Testar se sistema se recuperou
        recovery_successful = 0
        recovery_tests = 5
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for _ in range(recovery_tests):
                try:
                    url = f"{self.api_base_url}/api/v1/health"
                    async with session.get(url) as response:
                        if response.status == 200:
                            recovery_successful += 1
                except Exception:
                    pass
                await asyncio.sleep(0.5)
        
        duration = time.time() - start_time
        recovery_rate = (recovery_successful / recovery_tests * 100)
        
        metrics = {
            "recovery_rate": recovery_rate,
            "recovery_time": duration
        }
        
        recovery_ok = recovery_rate >= 80  # 80% de sucesso na recuperação
        
        return {
            "passed": recovery_ok,
            "duration": duration,
            "metrics": metrics,
            "details": f"Recovery rate: {recovery_rate:.1f}%, Recovery time: {duration:.1f}s",
            "error": None if recovery_ok else f"Sistema não se recuperou adequadamente ({recovery_rate:.1f}%)"
        }
    
    # Métodos simplificados para testes não extensivos
    async def _test_basic_throughput(self) -> Dict[str, Any]:
        """Teste básico de throughput"""
        start_time = time.time()
        
        requests = 10
        successful = 0
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for _ in range(requests):
                try:
                    url = f"{self.api_base_url}/api/v1/health"
                    async with session.get(url) as response:
                        if response.status == 200:
                            successful += 1
                except Exception:
                    pass
        
        duration = time.time() - start_time
        throughput = successful / duration if duration > 0 else 0
        
        return {
            "passed": throughput >= 5,  # 5 req/s mínimo
            "duration": duration,
            "metrics": {"basic_throughput": throughput},
            "details": f"Throughput: {throughput:.1f} req/s",
            "error": None if throughput >= 5 else f"Throughput baixo ({throughput:.1f} req/s)"
        }
    
    async def _test_basic_memory_check(self) -> Dict[str, Any]:
        """Verificação básica de memória"""
        start_time = time.time()
        
        try:
            memory_percent = psutil.virtual_memory().percent
            process = psutil.Process()
            process_memory = process.memory_info().rss / 1024 / 1024  # MB
        except Exception as e:
            return {
                "passed": False,
                "duration": time.time() - start_time,
                "error": f"Erro ao obter métricas de memória: {e}"
            }
        
        duration = time.time() - start_time
        memory_ok = memory_percent < 90 and process_memory < 512  # Limites relaxados
        
        return {
            "passed": memory_ok,
            "duration": duration,
            "metrics": {"system_memory": memory_percent, "process_memory": process_memory},
            "details": f"System: {memory_percent:.1f}%, Process: {process_memory:.1f}MB",
            "error": None if memory_ok else "Uso de memória elevado"
        }