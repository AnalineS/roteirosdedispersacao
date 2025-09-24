# -*- coding: utf-8 -*-
"""
Performance and Load Testing Suite
Comprehensive performance validation for production readiness
"""

import pytest
import time
import threading
import queue
import statistics
import psutil
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch

from conftest import (
    assert_valid_json_response,
    PERFORMANCE_THRESHOLDS,
    RATE_LIMIT_TEST_REQUESTS
)

class TestResponseTimePerformance:
    """Test response time performance for all endpoints"""

    @pytest.mark.performance
    def test_health_check_response_time(self, client, performance_monitor):
        """Test health check response time under normal load"""

        response_times = []

        for i in range(10):
            performance_monitor.start_timer(f'health_check_{i}')
            response = client.get('/api/v1/health')
            duration = performance_monitor.end_timer(f'health_check_{i}')

            assert response.status_code == 200
            response_times.append(duration)

        # Calculate statistics
        avg_time = statistics.mean(response_times)
        max_time = max(response_times)
        p95_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile

        # Performance assertions
        assert avg_time < PERFORMANCE_THRESHOLDS['health_check'], \
            f"Average health check time {avg_time:.3f}s exceeds threshold {PERFORMANCE_THRESHOLDS['health_check']}s"

        assert max_time < PERFORMANCE_THRESHOLDS['health_check'] * 3, \
            f"Max health check time {max_time:.3f}s exceeds threshold"

        assert p95_time < PERFORMANCE_THRESHOLDS['health_check'] * 2, \
            f"95th percentile {p95_time:.3f}s exceeds threshold"

    @pytest.mark.performance
    def test_personas_endpoint_performance(self, client, performance_monitor):
        """Test personas endpoint performance"""

        response_times = []

        for i in range(5):
            performance_monitor.start_timer(f'personas_{i}')
            response = client.get('/api/v1/personas')
            duration = performance_monitor.end_timer(f'personas_{i}')

            if response.status_code == 200:
                response_times.append(duration)

        if response_times:
            avg_time = statistics.mean(response_times)
            assert avg_time < PERFORMANCE_THRESHOLDS['persona_list'], \
                f"Average personas response time {avg_time:.3f}s exceeds threshold"

    @pytest.mark.performance
    def test_chat_endpoint_performance(self, client, mock_external_apis, performance_monitor):
        """Test chat endpoint performance with mocked AI responses"""

        response_times = []

        for i in range(3):  # Fewer iterations since chat is more expensive
            chat_data = {
                'message': f'Test performance message {i}',
                'persona': 'dr_gasnelio'
            }

            performance_monitor.start_timer(f'chat_{i}')
            response = client.post('/api/v1/chat',
                                  json=chat_data,
                                  content_type='application/json')
            duration = performance_monitor.end_timer(f'chat_{i}')

            if response.status_code == 200:
                response_times.append(duration)

        if response_times:
            avg_time = statistics.mean(response_times)
            assert avg_time < PERFORMANCE_THRESHOLDS['chat_response'], \
                f"Average chat response time {avg_time:.3f}s exceeds threshold"

class TestConcurrentLoadPerformance:
    """Test performance under concurrent load"""

    @pytest.mark.performance
    def test_concurrent_health_checks(self, client):
        """Test health endpoint under concurrent load"""

        results = queue.Queue()
        num_threads = 20
        requests_per_thread = 5

        def make_requests():
            thread_results = []
            for _ in range(requests_per_thread):
                start_time = time.time()
                try:
                    response = client.get('/api/v1/health')
                    end_time = time.time()
                    thread_results.append({
                        'status_code': response.status_code,
                        'response_time': end_time - start_time,
                        'success': response.status_code == 200
                    })
                except Exception as e:
                    thread_results.append({
                        'status_code': 500,
                        'response_time': 999,
                        'success': False,
                        'error': str(e)
                    })
            results.put(thread_results)

        # Start concurrent threads
        threads = []
        start_time = time.time()

        for _ in range(num_threads):
            thread = threading.Thread(target=make_requests)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        end_time = time.time()
        total_duration = end_time - start_time

        # Collect all results
        all_results = []
        while not results.empty():
            thread_results = results.get()
            all_results.extend(thread_results)

        # Analyze results
        total_requests = num_threads * requests_per_thread
        successful_requests = sum(1 for r in all_results if r['success'])
        response_times = [r['response_time'] for r in all_results if r['success']]

        # Performance assertions
        success_rate = successful_requests / total_requests
        assert success_rate >= 0.95, f"Success rate {success_rate:.2%} below 95%"

        if response_times:
            avg_response_time = statistics.mean(response_times)
            max_response_time = max(response_times)

            assert avg_response_time < 1.0, f"Average response time {avg_response_time:.3f}s too high"
            assert max_response_time < 5.0, f"Max response time {max_response_time:.3f}s too high"

        throughput = total_requests / total_duration
        assert throughput > 10, f"Throughput {throughput:.1f} req/s too low"

    @pytest.mark.performance
    def test_concurrent_mixed_endpoints(self, client, mock_external_apis):
        """Test performance with mixed endpoint requests"""

        endpoints = [
            ('GET', '/api/v1/health', None),
            ('GET', '/api/v1/personas', None),
            ('GET', '/api/v1/monitoring/stats', None),
            ('POST', '/api/v1/feedback', {
                'feedback_text': 'Test feedback',
                'rating': 5,
                'persona': 'dr_gasnelio'
            })
        ]

        results = []
        num_workers = 10
        requests_per_worker = 20

        def worker():
            worker_results = []
            for i in range(requests_per_worker):
                method, url, data = endpoints[i % len(endpoints)]

                start_time = time.time()
                try:
                    if method == 'GET':
                        response = client.get(url)
                    else:
                        response = client.post(url, json=data, content_type='application/json')

                    end_time = time.time()
                    worker_results.append({
                        'endpoint': url,
                        'status_code': response.status_code,
                        'response_time': end_time - start_time,
                        'success': response.status_code in [200, 201]
                    })
                except Exception as e:
                    worker_results.append({
                        'endpoint': url,
                        'status_code': 500,
                        'response_time': 999,
                        'success': False,
                        'error': str(e)
                    })

            return worker_results

        # Execute concurrent workers
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [executor.submit(worker) for _ in range(num_workers)]

            for future in as_completed(futures):
                results.extend(future.result())

        # Analyze mixed endpoint performance
        endpoint_stats = {}
        for result in results:
            endpoint = result['endpoint']
            if endpoint not in endpoint_stats:
                endpoint_stats[endpoint] = {
                    'requests': 0,
                    'successes': 0,
                    'response_times': []
                }

            endpoint_stats[endpoint]['requests'] += 1
            if result['success']:
                endpoint_stats[endpoint]['successes'] += 1
                endpoint_stats[endpoint]['response_times'].append(result['response_time'])

        # Validate performance for each endpoint
        for endpoint, stats in endpoint_stats.items():
            if stats['requests'] > 0:
                success_rate = stats['successes'] / stats['requests']
                assert success_rate >= 0.8, f"Endpoint {endpoint} success rate {success_rate:.2%} too low"

                if stats['response_times']:
                    avg_time = statistics.mean(stats['response_times'])
                    assert avg_time < 3.0, f"Endpoint {endpoint} avg response time {avg_time:.3f}s too high"

class TestMemoryPerformance:
    """Test memory usage and performance"""

    @pytest.mark.performance
    def test_memory_usage_under_load(self, client):
        """Test memory usage doesn't grow excessively under load"""

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Make many requests to stress test memory
        for i in range(100):
            response = client.get('/api/v1/health')
            assert response.status_code == 200

            # Check memory every 20 requests
            if i % 20 == 0:
                current_memory = process.memory_info().rss
                memory_growth = current_memory - initial_memory

                # Memory growth should be reasonable (less than 100MB)
                assert memory_growth < 100 * 1024 * 1024, \
                    f"Memory growth {memory_growth / 1024 / 1024:.2f}MB too high at request {i}"

        final_memory = process.memory_info().rss
        total_growth = final_memory - initial_memory

        # Total memory growth should be reasonable
        assert total_growth < 200 * 1024 * 1024, \
            f"Total memory growth {total_growth / 1024 / 1024:.2f}MB excessive"

    @pytest.mark.performance
    def test_memory_leak_detection(self, client):
        """Test for potential memory leaks in repeated operations"""

        process = psutil.Process(os.getpid())
        memory_samples = []

        # Take memory samples during repeated operations
        for cycle in range(5):
            # Perform operations
            for _ in range(50):
                client.get('/api/v1/health')
                client.get('/api/v1/personas')

            # Sample memory
            memory_samples.append(process.memory_info().rss)
            time.sleep(0.1)  # Brief pause

        # Analyze memory trend
        if len(memory_samples) >= 3:
            # Calculate memory growth rate
            growth_rates = []
            for i in range(1, len(memory_samples)):
                growth = memory_samples[i] - memory_samples[i-1]
                growth_rates.append(growth)

            # Memory growth should stabilize (not continuously increase)
            avg_growth = statistics.mean(growth_rates)

            # Allow some growth but not excessive continuous growth
            assert avg_growth < 50 * 1024 * 1024, \
                f"Average memory growth per cycle {avg_growth / 1024 / 1024:.2f}MB suggests memory leak"

class TestThroughputPerformance:
    """Test request throughput capabilities"""

    @pytest.mark.performance
    def test_maximum_throughput(self, client):
        """Test maximum request throughput"""

        duration = 10  # Test for 10 seconds
        start_time = time.time()
        request_count = 0
        errors = 0

        while time.time() - start_time < duration:
            try:
                response = client.get('/api/v1/health')
                if response.status_code == 200:
                    request_count += 1
                else:
                    errors += 1
            except Exception:
                errors += 1

        actual_duration = time.time() - start_time
        throughput = request_count / actual_duration
        error_rate = errors / (request_count + errors) if (request_count + errors) > 0 else 0

        # Throughput assertions
        assert throughput > 50, f"Throughput {throughput:.1f} req/s too low"
        assert error_rate < 0.05, f"Error rate {error_rate:.2%} too high"

    @pytest.mark.performance
    def test_sustained_load_performance(self, client):
        """Test performance under sustained load"""

        duration = 30  # 30 second sustained test
        workers = 5
        results = queue.Queue()

        def sustained_worker():
            start_time = time.time()
            worker_requests = 0
            worker_errors = 0
            response_times = []

            while time.time() - start_time < duration:
                try:
                    req_start = time.time()
                    response = client.get('/api/v1/health')
                    req_end = time.time()

                    response_times.append(req_end - req_start)

                    if response.status_code == 200:
                        worker_requests += 1
                    else:
                        worker_errors += 1

                except Exception:
                    worker_errors += 1

                # Small delay to prevent overwhelming
                time.sleep(0.01)

            results.put({
                'requests': worker_requests,
                'errors': worker_errors,
                'response_times': response_times
            })

        # Start sustained load workers
        threads = []
        test_start = time.time()

        for _ in range(workers):
            thread = threading.Thread(target=sustained_worker)
            threads.append(thread)
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        test_duration = time.time() - test_start

        # Collect results
        total_requests = 0
        total_errors = 0
        all_response_times = []

        while not results.empty():
            worker_result = results.get()
            total_requests += worker_result['requests']
            total_errors += worker_result['errors']
            all_response_times.extend(worker_result['response_times'])

        # Analyze sustained load performance
        total_operations = total_requests + total_errors
        success_rate = total_requests / total_operations if total_operations > 0 else 0
        throughput = total_requests / test_duration

        if all_response_times:
            avg_response_time = statistics.mean(all_response_times)
            p95_response_time = statistics.quantiles(all_response_times, n=20)[18]
        else:
            avg_response_time = float('inf')
            p95_response_time = float('inf')

        # Performance assertions for sustained load
        assert success_rate >= 0.95, f"Sustained load success rate {success_rate:.2%} too low"
        assert throughput > 10, f"Sustained throughput {throughput:.1f} req/s too low"
        assert avg_response_time < 0.5, f"Sustained avg response time {avg_response_time:.3f}s too high"
        assert p95_response_time < 1.0, f"Sustained P95 response time {p95_response_time:.3f}s too high"

class TestResourceUtilizationPerformance:
    """Test resource utilization efficiency"""

    @pytest.mark.performance
    def test_cpu_utilization(self, client):
        """Test CPU utilization during load"""

        process = psutil.Process(os.getpid())
        cpu_samples = []

        # Monitor CPU during load
        def monitor_cpu():
            for _ in range(10):
                cpu_percent = process.cpu_percent(interval=1)
                cpu_samples.append(cpu_percent)

        # Start CPU monitoring
        import threading
        monitor_thread = threading.Thread(target=monitor_cpu)
        monitor_thread.start()

        # Generate load
        for _ in range(200):
            client.get('/api/v1/health')

        monitor_thread.join()

        if cpu_samples:
            avg_cpu = statistics.mean(cpu_samples)
            max_cpu = max(cpu_samples)

            # CPU utilization should be reasonable
            assert max_cpu < 80, f"Peak CPU utilization {max_cpu:.1f}% too high"
            assert avg_cpu < 50, f"Average CPU utilization {avg_cpu:.1f}% too high"

    @pytest.mark.performance
    def test_response_time_percentiles(self, client):
        """Test response time distribution and percentiles"""

        response_times = []

        # Collect response time samples
        for _ in range(100):
            start_time = time.time()
            response = client.get('/api/v1/health')
            end_time = time.time()

            if response.status_code == 200:
                response_times.append(end_time - start_time)

        if len(response_times) >= 10:
            # Calculate percentiles
            response_times.sort()

            p50 = statistics.median(response_times)
            p95 = statistics.quantiles(response_times, n=20)[18]
            p99 = statistics.quantiles(response_times, n=100)[98]

            # Percentile assertions
            assert p50 < 0.1, f"P50 response time {p50:.3f}s too high"
            assert p95 < 0.2, f"P95 response time {p95:.3f}s too high"
            assert p99 < 0.5, f"P99 response time {p99:.3f}s too high"

class TestStressTestPerformance:
    """Stress testing for extreme conditions"""

    @pytest.mark.performance
    @pytest.mark.slow
    def test_extreme_concurrent_load(self, client):
        """Test performance under extreme concurrent load"""

        num_workers = 50
        requests_per_worker = 10
        results = []

        def stress_worker():
            worker_results = []
            for _ in range(requests_per_worker):
                start_time = time.time()
                try:
                    response = client.get('/api/v1/health')
                    end_time = time.time()

                    worker_results.append({
                        'success': response.status_code == 200,
                        'response_time': end_time - start_time
                    })
                except Exception:
                    worker_results.append({
                        'success': False,
                        'response_time': 999
                    })

            return worker_results

        # Execute extreme concurrent load
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [executor.submit(stress_worker) for _ in range(num_workers)]

            for future in as_completed(futures):
                results.extend(future.result())

        # Analyze extreme load results
        total_requests = len(results)
        successful_requests = sum(1 for r in results if r['success'])
        success_rate = successful_requests / total_requests

        successful_times = [r['response_time'] for r in results if r['success']]

        if successful_times:
            avg_response_time = statistics.mean(successful_times)
            max_response_time = max(successful_times)
        else:
            avg_response_time = float('inf')
            max_response_time = float('inf')

        # Stress test assertions (more lenient thresholds)
        assert success_rate >= 0.7, f"Extreme load success rate {success_rate:.2%} too low"

        if successful_times:
            assert avg_response_time < 2.0, f"Extreme load avg response time {avg_response_time:.3f}s too high"
            assert max_response_time < 10.0, f"Extreme load max response time {max_response_time:.3f}s too high"

    @pytest.mark.performance
    @pytest.mark.slow
    def test_endurance_performance(self, client):
        """Test performance over extended duration"""

        test_duration = 60  # 1 minute endurance test
        start_time = time.time()

        request_count = 0
        error_count = 0
        response_times = []

        while time.time() - start_time < test_duration:
            try:
                req_start = time.time()
                response = client.get('/api/v1/health')
                req_end = time.time()

                if response.status_code == 200:
                    request_count += 1
                    response_times.append(req_end - req_start)
                else:
                    error_count += 1

            except Exception:
                error_count += 1

            time.sleep(0.1)  # Reasonable pacing

        actual_duration = time.time() - start_time

        # Endurance test analysis
        total_operations = request_count + error_count
        success_rate = request_count / total_operations if total_operations > 0 else 0
        throughput = request_count / actual_duration

        if response_times:
            avg_response_time = statistics.mean(response_times)
            response_time_stability = statistics.stdev(response_times)
        else:
            avg_response_time = float('inf')
            response_time_stability = float('inf')

        # Endurance performance assertions
        assert success_rate >= 0.95, f"Endurance success rate {success_rate:.2%} degraded"
        assert throughput > 5, f"Endurance throughput {throughput:.1f} req/s too low"

        if response_times:
            assert avg_response_time < 0.2, f"Endurance avg response time {avg_response_time:.3f}s degraded"
            assert response_time_stability < 0.1, f"Response time stability {response_time_stability:.3f}s too variable"