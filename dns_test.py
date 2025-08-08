#!/usr/bin/env python3
import requests
import time

def test_dns_vs_ip():
    urls = [
        "http://localhost:5000/api/health",
        "http://127.0.0.1:5000/api/health"
    ]
    
    for url in urls:
        print(f"\nTesting: {url}")
        times = []
        
        for i in range(3):
            try:
                start = time.perf_counter()
                response = requests.get(url, timeout=10)
                end = time.perf_counter()
                
                duration_ms = (end - start) * 1000
                times.append(duration_ms)
                print(f"  Request {i+1}: {duration_ms:.1f}ms")
                
            except Exception as e:
                print(f"  Request {i+1}: FAILED - {e}")
        
        if times:
            avg = sum(times) / len(times)
            print(f"  Average: {avg:.1f}ms")

if __name__ == "__main__":
    test_dns_vs_ip()