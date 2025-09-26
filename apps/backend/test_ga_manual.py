# -*- coding: utf-8 -*-
"""
Manual test of Gá persona responses to understand scoring issues
"""

import sys
import io
from pathlib import Path

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from services.ai.chatbot import ChatbotService

def test_ga_responses():
    """Test Gá responses manually"""
    chatbot = ChatbotService()

    # Test empathy cases
    empathy_cases = [
        "Estou com medo de tomar o medicamento da hanseníase",
        "Será que vou ficar curado?",
        "As pessoas vão descobrir que tenho hanseníase?",
        "O tratamento é muito longo"
    ]

    print("=== EMPATHY TEST RESPONSES ===")
    for i, case in enumerate(empathy_cases, 1):
        print(f"\n[{i}] Question: {case}")
        response = chatbot.process_message(case, "ga", f"empathy_test_{i}")
        print(f"Response: {response.get('response', 'ERROR')}")

        # Check empathy patterns
        response_text = response.get('response', '').lower()
        empathy_patterns = [
            "compreendo", "entendo", "sei que", "é normal", "não se preocupe",
            "estou aqui", "vamos juntos", "você não está sozinho", "tudo bem",
            "é natural", "calma", "tranquilo", "apoio", "cuidado", "carinho"
        ]

        found_patterns = [p for p in empathy_patterns if p in response_text]
        print(f"Empathy patterns found: {found_patterns}")
        print("-" * 50)

    # Test medical translation cases
    medical_terms = [
        "poliquimioterapia única",
        "bacilo de Hansen",
        "farmacovigilância",
        "reações adversas",
        "classificação operacional"
    ]

    print("\n=== MEDICAL TRANSLATION TEST RESPONSES ===")
    for i, term in enumerate(medical_terms, 1):
        question = f"O que é {term}?"
        print(f"\n[{i}] Question: {question}")
        response = chatbot.process_message(question, "ga", f"translation_test_{i}")
        print(f"Response: {response.get('response', 'ERROR')}")

        # Check for simplified language patterns
        response_text = response.get('response', '').lower()
        simple_patterns = [
            "em outras palavras", "ou seja", "isso significa", "de forma simples",
            "para você entender", "basicamente", "resumindo", "explicando melhor",
            "é", "são", "significa", "quer dizer", "serve para"
        ]

        found_patterns = [p for p in simple_patterns if p in response_text]
        print(f"Translation patterns found: {found_patterns}")
        print("-" * 50)

if __name__ == "__main__":
    test_ga_responses()