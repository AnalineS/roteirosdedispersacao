#!/usr/bin/env python3
"""
AI System Diagnostic Tool
Investigates why AI responses are falling back to error messages
"""

import requests
import json
import os
import sys
from datetime import datetime

def test_ai_system_health():
    """Comprehensive AI system diagnostics"""
    print("AI SYSTEM DIAGNOSTIC REPORT")
    print("=" * 50)
    print(f"Timestamp: {datetime.now()}")
    print()
    
    backend_url = "http://localhost:5000"
    
    # Test 1: Environment Variables (via health endpoint)
    print("1. ENVIRONMENT VARIABLES CHECK")
    print("-" * 30)
    try:
        response = requests.get(f"{backend_url}/api/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            apis = health_data.get('components', {}).get('apis', {})
            print(f"OpenRouter API: {'✅ Available' if apis.get('openrouter') else '❌ Unavailable'}")
            print(f"HuggingFace API: {'✅ Available' if apis.get('huggingface') else '❌ Unavailable'}")
            print(f"APIs Status: {apis.get('status', 'unknown')}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot reach health endpoint: {e}")
    
    print()
    
    # Test 2: Knowledge Base Loading
    print("2. KNOWLEDGE BASE CHECK")  
    print("-" * 30)
    try:
        response = requests.get(f"{backend_url}/api/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            kb = health_data.get('components', {}).get('knowledge_base', {})
            print(f"Knowledge Base Loaded: {'✅' if kb.get('loaded') else '❌'}")
            print(f"Size: {kb.get('size_chars', 0):,} characters")
            print(f"Sources - Markdown: {'✅' if kb.get('sources', {}).get('markdown') else '❌'}")
            print(f"Sources - Structured: {'✅' if kb.get('sources', {}).get('structured') else '❌'}")
        else:
            print(f"❌ Cannot get knowledge base status")
    except Exception as e:
        print(f"❌ Error checking knowledge base: {e}")
    
    print()
    
    # Test 3: Direct Chat Test with Error Analysis
    print("3. DIRECT CHAT API TESTING")
    print("-" * 30)
    
    test_cases = [
        {
            "question": "Teste simples",
            "personality_id": "dr_gasnelio",
            "description": "Basic functionality test"
        },
        {
            "question": "Qual a dose de rifampicina?", 
            "personality_id": "dr_gasnelio",
            "description": "Knowledge base test"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        try:
            response = requests.post(
                f"{backend_url}/api/chat",
                json={
                    "question": test_case["question"],
                    "personality_id": test_case["personality_id"]
                },
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get('answer', '')
                confidence = data.get('confidence', 0)
                
                print(f"  Status: {'✅' if confidence > 0 else '⚠️ Fallback'}")
                print(f"  Confidence: {confidence}")
                print(f"  Response Length: {len(answer)} chars")
                print(f"  Contains Error Message: {'Yes' if 'erro técnico' in answer.lower() else 'No'}")
                
                # Check for AI processing indicators
                has_technical_content = any(term in answer.lower() for term in 
                                          ['rifampicina', 'dapsona', 'pqt', 'hanseníase', 'mg'])
                print(f"  Has Technical Content: {'Yes' if has_technical_content else 'No'}")
                
                # Encoding check
                has_encoding_issues = any(char in answer for char in ['�', '?'])
                print(f"  Encoding Issues: {'Yes' if has_encoding_issues else 'No'}")
                
                if confidence == 0.0:
                    print(f"  ❌ AI System appears to be in fallback mode")
                
            else:
                print(f"  ❌ HTTP Error: {response.status_code}")
                print(f"  Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"  ❌ Request failed: {e}")
    
    print()
    
    # Test 4: Performance Analysis
    print("4. PERFORMANCE ANALYSIS")
    print("-" * 30)
    
    times = []
    for i in range(3):
        try:
            start_time = datetime.now()
            response = requests.get(f"{backend_url}/api/health", timeout=10)
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000
            times.append(response_time)
            print(f"  Request {i+1}: {response_time:.0f}ms")
        except Exception as e:
            print(f"  Request {i+1}: Failed - {e}")
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"  Average: {avg_time:.0f}ms")
        print(f"  Status: {'✅ Good' if avg_time < 500 else '⚠️ Slow' if avg_time < 2000 else '❌ Critical'}")
    
    print()
    
    # Test 5: Backend Logs Analysis (if accessible)
    print("5. DIAGNOSTIC SUMMARY")
    print("-" * 30)
    
    issues_found = []
    
    # Performance issues
    if times and sum(times)/len(times) > 1000:
        issues_found.append("PERFORMANCE: Response times > 1000ms")
    
    # AI system issues would be detected from previous tests
    print("Issues Detected:")
    if not issues_found:
        print("  ✅ Basic connectivity working")
    else:
        for issue in issues_found:
            print(f"  ❌ {issue}")
    
    print("\nRecommended Next Steps:")
    print("1. Check backend logs for AI API errors")
    print("2. Verify API keys are valid and have quota")
    print("3. Test AI API endpoints directly (bypass backend)")
    print("4. Check network connectivity to OpenRouter/HuggingFace")
    print("5. Verify knowledge base files are accessible")
    
    return True

if __name__ == "__main__":
    test_ai_system_health()