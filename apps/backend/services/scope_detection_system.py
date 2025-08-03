"""
Sistema de Detecção de Escopo - Identifica se perguntas estão dentro do escopo da tese
"""

import re
from typing import Dict, List


def detect_question_scope(question: str) -> Dict:
    """
    Detecta se uma pergunta está dentro do escopo da tese sobre hanseníase PQT-U
    """
    question_lower = question.lower()
    
    # Palavras-chave que indicam escopo válido
    in_scope_keywords = {
        'medication': ['rifampicina', 'clofazimina', 'dapsona', 'pqt', 'poliquimioterapia'],
        'hanseniase': ['hanseniase', 'hansen', 'lepra', 'mycobacterium'],
        'dispensing': ['dispensacao', 'farmacia', 'medicamento', 'dose', 'como tomar'],
        'effects': ['efeito', 'colateral', 'adverso', 'reacao', 'laranja', 'escuro'],
        'treatment': ['tratamento', 'cura', 'tempo', 'meses', 'tomar'],
        'safety': ['seguro', 'crianca', 'gravidez', 'gestante', 'amamentacao']
    }
    
    # Palavras-chave que indicam fora do escopo
    out_of_scope_keywords = {
        'diagnosis': ['diagnostico', 'sintoma', 'mancha', 'dormencia', 'biópsia'],
        'other_diseases': ['diabetes', 'hipertensao', 'cancer', 'covid', 'gripe'],
        'legal': ['direito', 'lei', 'juridico', 'processo', 'indenizacao'],
        'other_treatments': ['cirurgia', 'fisioterapia', 'acupuntura', 'homeopatia']
    }
    
    # Calcular scores
    in_scope_score = 0
    out_scope_score = 0
    found_categories = []
    
    for category, keywords in in_scope_keywords.items():
        for keyword in keywords:
            if keyword in question_lower:
                in_scope_score += 1
                if category not in found_categories:
                    found_categories.append(category)
    
    for category, keywords in out_of_scope_keywords.items():
        for keyword in keywords:
            if keyword in question_lower:
                out_scope_score += 1
    
    # Determinar resultado
    is_in_scope = in_scope_score > out_scope_score and in_scope_score > 0
    
    # Determinar categoria principal
    main_category = found_categories[0] if found_categories else 'general'
    
    # Nível de confiança
    total_score = in_scope_score + out_scope_score
    if total_score >= 3:
        confidence_level = 'high'
    elif total_score >= 1:
        confidence_level = 'medium'
    else:
        confidence_level = 'low'
    
    # Reasoning
    if is_in_scope:
        reasoning = f"Pergunta relacionada a {', '.join(found_categories)} - tópicos cobertos pela tese"
    else:
        reasoning = "Pergunta fora do escopo da tese sobre roteiro de dispensação para hanseníase"
    
    return {
        'is_in_scope': is_in_scope,
        'confidence_level': confidence_level,
        'category': main_category,
        'scope_score': in_scope_score,
        'out_scope_score': out_scope_score,
        'reasoning': reasoning,
        'found_categories': found_categories
    }


def get_limitation_response(persona: str, question: str) -> str:
    """
    Gera resposta adequada quando pergunta está fora do escopo
    """
    if persona == "dr_gasnelio":
        return """**LIMITAÇÃO DE ESCOPO IDENTIFICADA**

Como especialista em roteiro de dispensação para hanseníase PQT-U, minha expertise está restrita aos protocolos farmacêuticos específicos da tese de referência.

**ESCOPO COBERTO:**
- Poliquimioterapia Única (PQT-U)
- Rifampicina, Clofazimina e Dapsona
- Protocolos de dispensação farmacêutica
- Efeitos adversos e monitoramento

**SUA PERGUNTA REQUER:**
Consulta com profissional especializado na área específica ou médico especialista em hanseníase para avaliação clínica completa.

*Baseado nos limites metodológicos da tese sobre roteiro de dispensação farmacêutica.*"""
    
    else:  # ga
        return """Oi! 😊

Adoraria te ajudar, mas sua pergunta está um pouquinho fora do que eu aprendi na tese sobre hanseníase.

**Eu sei explicar sobre:**
- Os remédios do tratamento (rifampicina, clofazimina, dapsona)
- Como tomar os medicamentos direitinho
- O que pode acontecer de efeito colateral
- Como a farmácia entrega os remédios

**Para sua pergunta, você precisa conversar com:**
- Médico especialista em hanseníase
- Profissional da área específica

Sei que é frustrante não conseguir responder tudo, mas quero te dar só informações seguras! 💝

*Meu conhecimento vem da tese sobre farmácia e hanseníase.*"""