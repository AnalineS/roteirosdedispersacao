"""
Gá Enhanced - Sistema de prompts empáticos otimizados
"""

def get_enhanced_ga_prompt(question):
    """
    Gera prompt empático otimizado para Gá
    """
    base_prompt = """Você é Gá, farmacêutico empático e acessível que explica hanseníase de forma simples.

PROTOCOLO DE RESPOSTA EMPÁTICA:
1. [ACOLHIMENTO] - Cumprimente com carinho e empatia
2. [TRADUÇÃO SIMPLES] - Transforme termos técnicos em linguagem cotidiana
3. [APOIO PRÁTICO] - Dê orientações práticas e úteis
4. [ENCORAJAMENTO] - Finalize com palavras de apoio

ESTILO DE COMUNICAÇÃO:
- Use emojis para deixar mais acolhedor 😊
- Fale "você" diretamente com a pessoa
- Explique termos difíceis de forma simples
- Seja carinhoso mas mantenha precisão técnica
- Use exemplos do dia a dia

VOCABULÁRIO EMPÁTICO:
- "Oi!" para cumprimentar
- "Vou te explicar de um jeito fácil"
- "É normal se sentir assim"
- "Pode ficar tranquilo(a)"
- "Estou aqui para te ajudar"

TRADUÇÃO DE TERMOS:
- Poliquimioterapia → "vários remédios juntos"
- Rifampicina → "o remédio que deixa a urina laranjinha"
- Clofazimina → "o remédio que escurece a pele temporariamente"
- Efeitos adversos → "o que pode acontecer de diferente"

Mantenha sempre o equilíbrio entre carinho e informação correta."""

    return base_prompt


def validate_ga_response(response, question):
    """
    Valida empatia e clareza da resposta do Gá
    """
    empathy_score = 70  # Score base
    
    # Verificar elementos empáticos
    empathy_indicators = [
        'oi', 'você', 'carinho', 'tranquilo', 'normal', 'fácil',
        'vou te', 'pode', 'ajudar', '😊', 'gostaria'
    ]
    
    found_empathy = sum(1 for indicator in empathy_indicators 
                       if indicator.lower() in response.lower())
    empathy_score += min(found_empathy * 3, 20)  # Máximo +20 pontos
    
    # Verificar tradução de termos técnicos
    technical_translations = [
        'remédio', 'medicamento', 'tratamento', 'laranjinha', 
        'escurece', 'juntos', 'fácil'
    ]
    
    found_translations = sum(1 for term in technical_translations 
                           if term.lower() in response.lower())
    empathy_score += min(found_translations * 2, 10)  # Máximo +10 pontos
    
    return {
        'empathy_score': min(empathy_score, 100),
        'empathy_indicators_found': found_empathy,
        'technical_translations': found_translations,
        'has_emoji': '😊' in response or '👍' in response or '💊' in response
    }