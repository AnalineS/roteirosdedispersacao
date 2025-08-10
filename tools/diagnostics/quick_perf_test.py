#!/usr/bin/env python3
"""
Quick Performance Test
"""

import requests
import time
from datetime import datetime

def test_performance():
    url = "http://localhost:5000/api/health"
    times = []
    
    print("PERFORMANCE TEST - Python requests")
    print("=" * 40)
    
    # Primeiro, fazer um request de warmup
    try:
        response = requests.get(url, timeout=10)
        print(f"Warmup request: {response.status_code}")
    except Exception as e:
        print(f"Warmup failed: {e}")
        return
    
    # Agora fazer os testes cronometrados
    for i in range(5):
        try:
            start = time.perf_counter()
            response = requests.get(url, timeout=10)
            end = time.perf_counter()
            
            duration_ms = (end - start) * 1000
            times.append(duration_ms)
            print(f"Request {i+1}: {duration_ms:.1f}ms (status: {response.status_code})")
            
        except Exception as e:
            print(f"Request {i+1}: FAILED - {e}")
    
    if times:
        avg = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\nResults:")
        print(f"Average: {avg:.1f}ms")
        print(f"Min: {min_time:.1f}ms")  
        print(f"Max: {max_time:.1f}ms")
        print(f"Status: {'GOOD' if avg < 500 else 'SLOW' if avg < 1000 else 'CRITICAL'}")
    
    # Teste com session reutilizada
    print(f"\nTesting with reused session:")
    session = requests.Session()
    session_times = []
    
    for i in range(3):
        try:
            start = time.perf_counter()
            response = session.get(url, timeout=10)
            end = time.perf_counter()
            
            duration_ms = (end - start) * 1000
            session_times.append(duration_ms)
            print(f"Session request {i+1}: {duration_ms:.1f}ms")
            
        except Exception as e:
            print(f"Session request {i+1}: FAILED - {e}")
    
    if session_times:
        session_avg = sum(session_times) / len(session_times)
        print(f"Session average: {session_avg:.1f}ms")
        print(f"Improvement: {avg - session_avg:.1f}ms faster")

if __name__ == "__main__":
    test_performance()