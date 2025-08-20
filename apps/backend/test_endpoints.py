#!/usr/bin/env python3
"""
Script para testar endpoints do backend e verificar se o problema de 404 foi resolvido
"""

import requests
import json
from typing import Dict, Any

def test_endpoint(url: str, method: str = 'GET', timeout: int = 10) -> Dict[str, Any]:
    """Testa um endpoint e retorna resultado"""
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=timeout)
        elif method.upper() == 'POST':
            response = requests.post(url, json={}, timeout=timeout)
        else:
            return {"error": f"Método {method} não suportado"}
        
        return {
            "url": url,
            "method": method,
            "status_code": response.status_code,
            "success": response.status_code < 400,
            "response_size": len(response.content),
            "content_type": response.headers.get('content-type', 'unknown'),
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
        }
    except requests.exceptions.RequestException as e:
        return {
            "url": url,
            "method": method,
            "error": str(e),
            "success": False
        }

def main():
    """Testa principais endpoints"""
    base_url = "http://127.0.0.1:8080"
    
    # Endpoints principais para testar
    endpoints = [
        {"url": f"{base_url}/", "method": "GET", "description": "Rota raiz"},
        {"url": f"{base_url}/api/v1/health", "method": "GET", "description": "Health check básico"},
        {"url": f"{base_url}/api/v1/health/live", "method": "GET", "description": "Liveness probe"},
        {"url": f"{base_url}/api/v1/health/ready", "method": "GET", "description": "Readiness probe"},
        {"url": f"{base_url}/api/v1/personas", "method": "GET", "description": "Lista de personas"},
        {"url": f"{base_url}/api/v1/chat", "method": "POST", "description": "Endpoint de chat"},
    ]
    
    print("="*60)
    print("TESTE DE ENDPOINTS DO BACKEND")
    print("="*60)
    
    results = []
    
    for endpoint in endpoints:
        print(f"\n>>> Testando: {endpoint['description']}")
        print(f"    URL: {endpoint['url']}")
        
        result = test_endpoint(endpoint['url'], endpoint['method'])
        results.append({**result, "description": endpoint['description']})
        
        if result.get('success'):
            print(f"    [OK] Status: {result['status_code']} - SUCESSO")
            if 'response' in result and isinstance(result['response'], dict):
                # Mostrar informações básicas da resposta
                if 'api_name' in result['response']:
                    print(f"    API: {result['response']['api_name']}")
                if 'version' in result['response']:
                    print(f"    Versao: {result['response']['version']}")
                if 'status' in result['response']:
                    print(f"    Status: {result['response']['status']}")
        else:
            print(f"    [ERRO] Status: {result.get('status_code', 'ERROR')} - FALHA")
            if 'error' in result:
                print(f"    Erro: {result['error']}")
    
    # Resumo
    print("\n" + "="*60)
    print("RESUMO DOS TESTES")
    print("="*60)
    
    successful = sum(1 for r in results if r.get('success'))
    total = len(results)
    
    print(f"Sucesso: {successful}/{total} endpoints")
    
    if successful == total:
        print("*** TODOS OS ENDPOINTS FUNCIONANDO CORRETAMENTE! ***")
        print("*** Problema de 404 RESOLVIDO ***")
    else:
        print("Alguns endpoints ainda com problemas:")
        for result in results:
            if not result.get('success'):
                print(f"   [X] {result['description']}: {result.get('status_code', 'ERROR')}")
    
    return results

if __name__ == "__main__":
    try:
        results = main()
    except KeyboardInterrupt:
        print("\n[STOP] Teste interrompido pelo usuario")
    except Exception as e:
        print(f"[ERROR] Erro durante teste: {e}")