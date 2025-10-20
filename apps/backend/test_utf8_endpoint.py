# -*- coding: utf-8 -*-
"""
Teste de UTF-8 para diagnóstico do problema de encoding
"""
import sys
import json
from main import create_app

def test_utf8_json_parsing():
    """Testa parsing de JSON com UTF-8"""
    app = create_app()

    print(f"=== Teste de UTF-8 JSON Parsing ===")
    print(f"Python version: {sys.version}")
    print(f"Default encoding: {sys.getdefaultencoding()}")
    print(f"Flask JSON_AS_ASCII: {app.config.get('JSON_AS_ASCII')}")
    print()

    # Simular request JSON com UTF-8
    test_payload = '{"message": "O que é PQT-U?", "persona": "gasnelio"}'

    print(f"Test payload: {test_payload}")
    print(f"Payload bytes: {test_payload.encode('utf-8')}")
    print()

    # Testar parsing
    try:
        data = json.loads(test_payload)
        print(f"✅ JSON parsed successfully:")
        print(f"   Message: {data['message']}")
        print(f"   Message type: {type(data['message'])}")
    except Exception as e:
        print(f"❌ JSON parsing failed: {e}")

    # Testar com app context
    with app.test_request_context(
        '/api/v1/chat',
        method='POST',
        data=test_payload,
        content_type='application/json; charset=utf-8'
    ):
        from flask import request
        try:
            request_data = request.get_json()
            print(f"\n✅ Flask request.get_json() successful:")
            print(f"   Data: {request_data}")
            print(f"   Message: {request_data.get('message')}")
        except Exception as e:
            print(f"\n❌ Flask request.get_json() failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_utf8_json_parsing()
