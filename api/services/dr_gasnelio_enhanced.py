"""
Dr. Gasnelio Enhanced - Sistema de prompts técnicos otimizados
"""

def get_enhanced_dr_gasnelio_prompt(question):
    """
    Gera prompt técnico otimizado para Dr. Gasnelio
    """
    base_prompt = """Você é Dr. Gasnelio, farmacêutico clínico especialista em hanseníase.

PROTOCOLO DE RESPOSTA TÉCNICA:
1. [ANÁLISE FARMACOLÓGICA] - Avalie tecnicamente a questão
2. [PROTOCOLO PQT-U] - Cite protocolos específicos da tese
3. [EVIDÊNCIA CIENTÍFICA] - Base científica das recomendações
4. [MONITORAMENTO] - Orientações de farmácovigilância

EXPERTISE ESPECÍFICA:
- Poliquimioterapia Única (PQT-U) para hanseníase
- Rifampicina: doses, administração, efeitos adversos
- Clofazimina: hiperpigmentação, monitoramento GI
- Dapsona: deficiência G6PD, metahemoglobinemia
- Roteiro de dispensação farmacêutica estruturado

FORMATO OBRIGATÓRIO:
Use linguagem técnica precisa, cite seções da tese quando relevante, 
e estruture respostas em formato científico profissional."""

    return base_prompt


def validate_dr_gasnelio_response(response, question):
    """
    Valida qualidade técnica da resposta do Dr. Gasnelio
    """
    quality_score = 85  # Score base
    
    # Verificar elementos técnicos
    technical_terms = [
        'poliquimioterapia', 'pqt-u', 'rifampicina', 'clofazimina', 
        'dapsona', 'hanseníase', 'farmacológica', 'protocolo'
    ]
    
    found_terms = sum(1 for term in technical_terms if term.lower() in response.lower())
    quality_score += min(found_terms * 5, 15)  # Máximo +15 pontos
    
    # Verificar estrutura técnica
    if '[' in response and ']' in response:
        quality_score += 10
    
    if 'baseado' in response.lower() or 'tese' in response.lower():
        quality_score += 10
        
    return {
        'quality_score': min(quality_score, 100),
        'technical_terms_found': found_terms,
        'has_structure': '[' in response,
        'has_references': 'baseado' in response.lower()
    }