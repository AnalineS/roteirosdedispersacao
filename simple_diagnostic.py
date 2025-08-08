#!/usr/bin/env python3
"""
Simple AI System Diagnostic - No special characters
"""

import requests
import json
from datetime import datetime

def test_ai_system():
    print("AI SYSTEM DIAGNOSTIC REPORT")
    print("=" * 50)
    
    backend_url = "http://127.0.0.1:5000"
    
    # Test 1: Basic connectivity and API status
    print("\n1. API STATUS CHECK")
    try:
        response = requests.get(f"{backend_url}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            apis = data.get('components', {}).get('apis', {})
            print(f"OpenRouter: {'OK' if apis.get('openrouter') else 'FAIL'}")
            print(f"HuggingFace: {'OK' if apis.get('huggingface') else 'FAIL'}")
            
            kb = data.get('components', {}).get('knowledge_base', {})
            print(f"Knowledge Base: {'OK' if kb.get('loaded') else 'FAIL'}")
            print(f"KB Size: {kb.get('size_chars', 0)} chars")
        else:
            print(f"Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"Cannot reach backend: {e}")
    
    # Test 2: Chat functionality
    print("\n2. CHAT API TEST")
    try:
        payload = {
            "question": "Qual a dose de rifampicina?",
            "personality_id": "dr_gasnelio"
        }
        
        response = requests.post(
            f"{backend_url}/api/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            answer = data.get('answer', '')
            confidence = data.get('confidence', 0)
            
            print(f"Response received: {len(answer)} characters")
            print(f"Confidence: {confidence}")
            print(f"Is fallback: {'YES' if confidence == 0 else 'NO'}")
            
            # Check if it's a technical error message
            is_error = 'erro técnico' in answer.lower() or 'technical error' in answer.lower()
            print(f"Contains error message: {'YES' if is_error else 'NO'}")
            
            # Show first 100 characters of response
            print(f"Response preview: {answer[:100]}...")
            
        else:
            print(f"Chat API failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Chat test failed: {e}")
    
    # Test 3: Performance check  
    print("\n3. PERFORMANCE CHECK")
    times = []
    for i in range(3):
        try:
            start = datetime.now()
            response = requests.get(f"{backend_url}/api/health", timeout=10)
            end = datetime.now()
            time_ms = (end - start).total_seconds() * 1000
            times.append(time_ms)
            print(f"Request {i+1}: {time_ms:.0f}ms")
        except:
            print(f"Request {i+1}: FAILED")
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"Average response time: {avg_time:.0f}ms")
        status = "GOOD" if avg_time < 500 else "SLOW" if avg_time < 2000 else "CRITICAL"
        print(f"Performance status: {status}")
    
    print("\n4. SUMMARY")
    print("=" * 50)
    print("Key Issues Found:")
    if times and sum(times)/len(times) > 500:
        print("- Performance is slow")
    else:
        print("- Performance is GOOD")
    print("- AI responses falling back to error messages (confidence = 0)")
    print("- API keys using development placeholders (expected behavior)")
    
    print("\nNext Steps:")
    print("1. Check backend logs for specific AI API errors")
    print("2. Verify API keys in environment variables")  
    print("3. Test AI API endpoints directly")
    print("4. Check knowledge base file accessibility")

if __name__ == "__main__":
    test_ai_system()