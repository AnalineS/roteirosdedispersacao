# -*- coding: utf-8 -*-
"""
Final Integration Test for Both Personas (Dr. Gasnelio and Gá)
Validates complete system functionality with medical AI personas
"""

import sys
import io
from pathlib import Path
import json

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from services.ai.chatbot import ChatbotService
from config.personas import get_personas

def test_both_personas_integration():
    """Test both personas working together"""
    print("=" * 60)
    print("FINAL PERSONAS INTEGRATION TEST")
    print("=" * 60)

    chatbot = ChatbotService()
    personas = get_personas()

    # Test both personas with the same question
    test_question = "Como devo tomar os medicamentos da hanseníase?"

    print(f"\n📝 Test Question: {test_question}")
    print("=" * 60)

    # Test Dr. Gasnelio (technical)
    print("\n🔬 DR. GASNELIO (TECHNICAL RESPONSE):")
    print("-" * 40)
    gasnelio_response = chatbot.process_message(test_question, "dr_gasnelio", "integration_test_gasnelio")

    if gasnelio_response.get("error"):
        print(f"❌ ERROR: {gasnelio_response.get('error_message', 'Unknown error')}")
    else:
        print(gasnelio_response.get('response', 'No response'))
        print(f"\n📊 Response length: {len(gasnelio_response.get('response', ''))}")
        print(f"🤖 Persona: {gasnelio_response.get('persona', 'Unknown')}")

    # Test Gá (empathetic)
    print("\n\n💚 GÁ (EMPATHETIC RESPONSE):")
    print("-" * 40)
    ga_response = chatbot.process_message(test_question, "ga", "integration_test_ga")

    if ga_response.get("error"):
        print(f"❌ ERROR: {ga_response.get('error_message', 'Unknown error')}")
    else:
        print(ga_response.get('response', 'No response'))
        print(f"\n📊 Response length: {len(ga_response.get('response', ''))}")
        print(f"🤖 Persona: {ga_response.get('persona', 'Unknown')}")

    # Compare characteristics
    print("\n" + "=" * 60)
    print("CHARACTERISTICS COMPARISON")
    print("=" * 60)

    # Technical patterns (Dr. Gasnelio)
    gasnelio_text = gasnelio_response.get('response', '').lower()
    technical_patterns = ['pcdt', 'protocolo', 'profissional', 'clínico', 'ministério', 'saúde', 'orientada']
    gasnelio_technical = [p for p in technical_patterns if p in gasnelio_text]

    # Empathetic patterns (Gá)
    ga_text = ga_response.get('response', '').lower()
    empathy_patterns = ['entendo', 'compreendo', 'carinho', 'apoio', 'juntos', 'você', 'simples']
    ga_empathy = [p for p in empathy_patterns if p in ga_text]

    print(f"\n🔬 Dr. Gasnelio Technical Patterns: {gasnelio_technical}")
    print(f"💚 Gá Empathetic Patterns: {ga_empathy}")

    # Test personas info endpoint
    print("\n" + "=" * 60)
    print("PERSONAS CONFIGURATION")
    print("=" * 60)

    for persona_id, persona_config in personas.items():
        print(f"\n🤖 {persona_config['name']} ({persona_id}):")
        print(f"   Description: {persona_config['description']}")
        print(f"   Personality: {persona_config['personality']}")
        print(f"   Target Audience: {persona_config['target_audience']}")

    # Test successful integration
    integration_success = (
        not gasnelio_response.get("error") and
        not ga_response.get("error") and
        len(gasnelio_response.get('response', '')) > 100 and
        len(ga_response.get('response', '')) > 100 and
        gasnelio_response.get('persona_id') == 'dr_gasnelio' and
        ga_response.get('persona_id') == 'ga'
    )

    print("\n" + "=" * 60)
    print("INTEGRATION TEST RESULTS")
    print("=" * 60)
    print(f"✅ Dr. Gasnelio Working: {not gasnelio_response.get('error')}")
    print(f"✅ Gá Working: {not ga_response.get('error')}")
    print(f"✅ Both Responses Generated: {len(gasnelio_response.get('response', '')) > 100 and len(ga_response.get('response', '')) > 100}")
    print(f"✅ Persona IDs Correct: {gasnelio_response.get('persona_id') == 'dr_gasnelio' and ga_response.get('persona_id') == 'ga'}")
    print(f"\n🎯 OVERALL INTEGRATION: {'✅ SUCCESS' if integration_success else '❌ FAILED'}")

    # Save integration test results
    results = {
        "integration_test_timestamp": "2025-09-25T23:50:00",
        "overall_success": integration_success,
        "gasnelio_test": {
            "working": not gasnelio_response.get("error"),
            "response_length": len(gasnelio_response.get('response', '')),
            "persona_id": gasnelio_response.get('persona_id'),
            "technical_patterns": gasnelio_technical
        },
        "ga_test": {
            "working": not ga_response.get("error"),
            "response_length": len(ga_response.get('response', '')),
            "persona_id": ga_response.get('persona_id'),
            "empathy_patterns": ga_empathy
        }
    }

    results_file = Path(__file__).parent / "final_integration_test_results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n📋 Detailed results saved to: {results_file}")

    return integration_success

if __name__ == "__main__":
    success = test_both_personas_integration()
    sys.exit(0 if success else 1)