#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deployment Status Checker
Monitors the Flask-CORS security update deployment
"""

import requests
import time
import json
from datetime import datetime

# Endpoint URLs
ENDPOINTS = {
    "homologacao": "https://backend-dot-roteiros-de-dispensacao.uc.r.appspot.com/api/health",
    "production": "https://backend-dot-roteiros-de-dispensacao.uc.r.appspot.com/api/health"
}

def check_flask_cors_version(url):
    """Check if Flask-CORS 6.0.0 is working"""
    try:
        headers = {
            'Origin': 'https://roteiros-de-dispensacao.web.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        # Test preflight OPTIONS request
        response = requests.options(url, headers=headers, timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age')
        }
        
        return {
            'status': 'success' if response.status_code == 200 else 'error',
            'status_code': response.status_code,
            'cors_headers': cors_headers,
            'response_time': response.elapsed.total_seconds()
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'response_time': None
        }

def main():
    print("Monitorando Deployment Flask-CORS 6.0.0")
    print("=" * 50)
    
    for env, url in ENDPOINTS.items():
        print(f"\n>> Testando {env.upper()}: {url}")
        
        # Health check
        try:
            health_response = requests.get(url, timeout=10)
            print(f"   [OK] Health Status: {health_response.status_code}")
            
            if health_response.status_code == 200:
                health_data = health_response.json()
                print(f"   [INFO] System Status: {health_data.get('status', 'unknown')}")
                print(f"   [TIME] Response Time: {health_response.elapsed.total_seconds():.2f}s")
        except Exception as e:
            print(f"   [ERROR] Health Check Failed: {e}")
        
        # CORS check
        cors_result = check_flask_cors_version(url)
        if cors_result['status'] == 'success':
            print(f"   [OK] CORS Headers Working")
            print(f"   [CORS] Allow-Origin: {cors_result['cors_headers']['Access-Control-Allow-Origin']}")
            print(f"   [CORS] Max-Age: {cors_result['cors_headers']['Access-Control-Max-Age']}")
        else:
            print(f"   [ERROR] CORS Test Failed: {cors_result.get('error', 'Unknown error')}")
    
    print(f"\n[TIMESTAMP] Verificação realizada em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n[INFO] Para monitoramento contínuo, execute:")
    print("   python check_deployment_status.py")
    print("\n[MONITORING] Google Cloud Operations Suite:")
    print("   https://console.cloud.google.com/monitoring")

if __name__ == "__main__":
    main()