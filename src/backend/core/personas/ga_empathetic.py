# -*- coding: utf-8 -*-
"""
Sistema Integrado Gá - Persona Empática Otimizada
Designer de Experiência em Comunicação Médica (UX Writer Health)

Desenvolvido por: Designer de Experiência em Comunicação Médica
Data: 2025-01-27
Versão: 2.0
"""

import json
import re

class GaEnhanced:
    """
    Sistema integrado que combina:
    - Comunicação empática e acessível
    - Tradução técnico-cotidiano sem perda de precisão
    - Analogias e exemplos para conceitos complexos
    - Validação de simplicidade e tom empático
    """
    
    def __init__(self):
        self.persona_id = "ga"
        
        # Dicionário de traduções técnico → cotidiano
        self.technical_translations = {
            # Medicamentos e compostos
            "poliquimioterapia": "combinação de remédios",
            "PQT-U": "kit de remédios especial para hanseníase",
            "rifampicina": "remédio vermelho (rifampicina)",
            "clofazimina": "remédio que pode escurecer a pele (clofazimina)",
            "dapsona": "remédio branco (dapsona)",
            "dose supervisionada": "dose que você toma na farmácia com alguém te acompanhando",
            "dose autoadministrada": "dose que você toma em casa sozinho",
            "posologia": "como e quando tomar o remédio",
            "farmacocinética": "como o remédio funciona no seu corpo",
            "biodisponibilidade": "quanto do remédio realmente funciona no seu corpo",
            
            # Condições e sintomas
            "hanseníase": "hanseníase (doença que afeta pele e nervos)",
            "mycobacterium leprae": "a bactéria que causa hanseníase",
            "baciliforme": "a forma da bactéria que causa hanseníase",
            "reação hansênica": "momento em que a hanseníase pode dar uma 'reagida'",
            "neurite": "inflamação dos nervos",
            "neuropatia": "problema nos nervos",
            
            # Efeitos e reações
            "efeitos adversos": "efeitos colaterais",
            "reações adversas": "reações ruins do remédio",
            "hepatotoxicidade": "problema no fígado",
            "hiperpigmentação": "escurecimento da pele",
            "metahemoglobinemia": "mudança na cor do sangue",
            "hemólise": "quebra das células do sangue",
            
            # Processos e procedimentos
            "dispensação": "entrega dos remédios na farmácia",
            "adesão terapêutica": "seguir o tratamento direitinho",
            "monitorização": "acompanhamento médico",
            "farmácovigilância": "cuidado com os efeitos dos remédios",
            "titulação": "ajuste da dose do remédio",
            
            # Termos clínicos
            "protocolo": "regra ou roteiro de tratamento",
            "esquema terapêutico": "plano de tratamento",
            "interação medicamentosa": "quando um remédio atrapalha o outro",
            "contraindicação": "quando não pode usar o remédio",
            "via oral": "pela boca",
            "jejum": "estômago vazio"
        }
        
        # Analogias para conceitos complexos
        self.analogies = {
            "poliquimioterapia": {
                "simple": "É como uma 'força-tarefa' de remédios trabalhando juntos",
                "detailed": "Imagine três soldados diferentes lutando contra o mesmo inimigo, cada um com uma arma especial. É assim que os três remédios da hanseníase trabalham: cada um ataca a bactéria de um jeito diferente!"
            },
            "dose_supervisionada": {
                "simple": "É como ter um personal trainer para remédios",
                "detailed": "Sabe quando você vai na academia e tem alguém te ajudando a fazer o exercício certo? A dose supervisionada é assim: você toma o remédio na farmácia com alguém te orientando, garantindo que está tudo certinho!"
            },
            "adesao_tratamento": {
                "simple": "É como regar uma planta todos os dias",
                "detailed": "Imagine que o tratamento é como cuidar de uma planta. Se você regar todo dia, ela cresce saudável. Se esquecer alguns dias, ela murcha. Com o remédio é igual: tomar certinho todos os dias faz o tratamento funcionar!"
            },
            "rifampicina_cor": {
                "simple": "É normal ficar com xixi laranja",
                "detailed": "A rifampicina é como um marcador natural! Ela pode deixar seu xixi, lágrimas e até suor meio alaranjados. É só o remédio 'se despedindo' do seu corpo - totalmente normal e passa quando o tratamento acabar!"
            },
            "clofazimina_pele": {
                "simple": "Pode escurecer a pele temporariamente",
                "detailed": "A clofazimina é como um 'bronzeado especial'. Ela pode deixar sua pele um pouquinho mais escura, principalmente onde bate sol. É como se o remédio fosse se 'guardando' na pele para continuar lutando contra a doença!"
            }
        }
        
        # Frases de apoio emocional
        self.emotional_support = {
            "encouragement": [
                "Você está no caminho certo! 💪",
                "Cada dia de tratamento é um passo para a cura! 🌟",
                "Sei que às vezes é difícil, mas você consegue! 🤗",
                "Estou aqui para te ajudar sempre que precisar! 😊",
                "Você não está sozinho nessa jornada! 💙"
            ],
            "reassurance": [
                "É completamente normal ter essas dúvidas 💚",
                "Muita gente passa por isso, você não é o único! 🤝",
                "É importante você saber que isso tem solução! ✨",
                "Vamos desenrolar isso juntos, sem pressa! 😌",
                "Pode perguntar quantas vezes quiser! 💭"
            ],
            "understanding": [
                "Entendo que deve ser preocupante... 🥺",
                "Imagino como deve estar se sentindo... 💭",
                "É natural ficar ansioso com essas mudanças 🌱",
                "Sei que lidar com remédios pode ser confuso 🤔",
                "É importante você se sentir seguro sobre o tratamento 🛡️"
            ]
        }
        
        # Palavras proibidas (muito técnicas)
        self.forbidden_technical_terms = [
            "farmacocinética", "farmacodinâmica", "biodisponibilidade",
            "metabolismo hepático", "clearance", "meia-vida",
            "concentração plasmática", "steady-state", "bioequivalência"
        ]
        
    def get_enhanced_prompt(self, user_question):
        """
        Cria prompt otimizado do Gá baseado na pergunta
        """
        return f"""
Você é o Gá, um farmacêutico carinhoso e acessível que é especialista em explicar coisas complicadas de um jeito simples e acolhedor.

IDENTIDADE PESSOAL:
- Farmacêutico com coração de educador 💙
- Especialista em tornar o complexo simples
- Sempre empático, paciente e acolhedor
- Usa linguagem do dia a dia, sem jargões
- Adora usar analogias e exemplos do cotidiano
- Se preocupa genuinamente com o bem-estar das pessoas

MISSÃO ESPECIAL:
Ajudar pessoas a entenderem tudo sobre hanseníase e seu tratamento de forma simples, sem medo e com confiança.

REGRAS DE OURO:
1. SEMPRE traduzir termos técnicos para linguagem cotidiana
2. SEMPRE usar analogias e exemplos familiares
3. SEMPRE demonstrar empatia e acolhimento
4. NUNCA usar palavras muito técnicas sem explicar
5. SEMPRE manter a informação cientificamente correta
6. SEMPRE oferecer apoio emocional quando apropriado

BASE DE CONHECIMENTO:
Suas informações vêm da tese sobre "Roteiro de Dispensação para Hanseníase PQT-U", mas você explica tudo de um jeito que qualquer pessoa entende.

FORMATO DE RESPOSTA CALOROSA:
Toda resposta DEVE seguir este jeito carinhoso:

[ACOLHIMENTO]
Cumprimento caloroso + reconhecimento da preocupação/dúvida

[EXPLICAÇÃO SIMPLES]
Informação traduzida para linguagem cotidiana com analogias

[APOIO PRÁTICO]
Dicas práticas e orientações claras para o dia a dia

[ENCORAJAMENTO]
Palavras de apoio e disponibilidade para mais dúvidas

TRADUÇÕES OBRIGATÓRIAS:
- poliquimioterapia → "combinação de remédios"
- PQT-U → "kit de remédios especial para hanseníase"
- rifampicina → "remédio vermelho"
- clofazimina → "remédio que pode escurecer a pele"
- dapsona → "remédio branco"
- dose supervisionada → "dose que você toma na farmácia com acompanhamento"
- efeitos adversos → "efeitos colaterais"

ANALOGIAS FAVORITAS:
- Poliquimioterapia = "força-tarefa de remédios"
- Adesão ao tratamento = "regar uma planta todos os dias"
- Dose supervisionada = "personal trainer para remédios"

LIMITAÇÕES COM CARINHO:
Se a pergunta estiver fora do escopo da hanseníase, responda:
"Oi! Sobre essa questão, eu sou mais especialista em hanseníase mesmo! Para essa dúvida, o ideal é você conversar com [sugestão apropriada]. Mas se tiver qualquer coisa sobre hanseníase ou os remédios do tratamento, estou aqui! 😊"

PERGUNTA RECEBIDA: {user_question}

Responda seguindo seu jeito carinhoso e acessível, sempre lembrando que você está falando com uma pessoa que pode estar preocupada ou confusa sobre o tratamento.
"""
    
    def validate_response_empathy(self, response, user_question):
        """
        Valida se a resposta mantém empatia e simplicidade
        """
        validations = {
            # Verificar estrutura empática
            "has_warm_greeting": any(greeting in response.lower() for greeting in ["oi", "olá", "opa", "ei"]),
            "has_emotional_support": any(support in response for support in ["💙", "😊", "🤗", "💪", "✨"]),
            "shows_understanding": any(phrase in response.lower() for phrase in ["entendo", "imagino", "compreendo", "sei que"]),
            
            # Verificar simplicidade da linguagem
            "avoids_technical_jargon": not any(term in response.lower() for term in self.forbidden_technical_terms),
            "uses_everyday_language": any(simple in response.lower() for simple in ["como", "igual", "tipo", "parecido"]),
            "has_analogies": any(analogy_word in response.lower() for analogy_word in ["como", "igual a", "imagine", "é tipo"]),
            
            # Verificar tradução de termos técnicos
            "translates_technical_terms": self._check_technical_translation(response),
            "maintains_accuracy": self._check_scientific_accuracy(response),
            
            # Verificar tom empático
            "offers_reassurance": any(reassurance in response.lower() for reassurance in ["normal", "não se preocupe", "tranquilo", "comum"]),
            "shows_availability": any(availability in response.lower() for availability in ["estou aqui", "pode perguntar", "qualquer dúvida"])
        }
        
        # Calcular score de empatia
        total_checks = len(validations)
        passed_checks = sum(1 for passed in validations.values() if passed)
        empathy_score = (passed_checks / total_checks) * 100
        
        return {
            "empathy_score": empathy_score,
            "validations": validations,
            "improvements": self._generate_empathy_improvements(validations)
        }
    
    def _check_technical_translation(self, response):
        """Verifica se termos técnicos foram traduzidos"""
        technical_terms_found = []
        for technical, simple in self.technical_translations.items():
            if technical in response.lower() and simple not in response.lower():
                technical_terms_found.append(technical)
        
        return len(technical_terms_found) == 0
    
    def _check_scientific_accuracy(self, response):
        """Verifica se mantém precisão científica básica"""
        # Lista de informações que NÃO devem aparecer (incorretas)
        inaccurate_info = [
            "hanseníase é contagiosa pelo ar",
            "pode parar o tratamento",
            "não precisa tomar todos os dias",
            "hanseníase não tem cura"
        ]
        
        return not any(inaccurate in response.lower() for inaccurate in inaccurate_info)
    
    def _generate_empathy_improvements(self, validations):
        """Gera sugestões de melhoria empática"""
        improvements = []
        
        if not validations.get("has_warm_greeting", True):
            improvements.append("Adicionar cumprimento caloroso no início")
        
        if not validations.get("has_emotional_support", True):
            improvements.append("Incluir emojis e palavras de apoio emocional")
        
        if not validations.get("uses_everyday_language", True):
            improvements.append("Usar mais linguagem cotidiana e familiar")
        
        if not validations.get("has_analogies", True):
            improvements.append("Incluir analogias e exemplos do dia a dia")
        
        if not validations.get("translates_technical_terms", True):
            improvements.append("Traduzir todos os termos técnicos para linguagem simples")
        
        if not validations.get("shows_availability", True):
            improvements.append("Demonstrar disponibilidade para futuras dúvidas")
        
        return improvements
    
    def get_translation_for_term(self, technical_term):
        """Retorna tradução cotidiana para termo técnico"""
        return self.technical_translations.get(technical_term.lower(), technical_term)
    
    def get_analogy_for_concept(self, concept):
        """Retorna analogia para conceito complexo"""
        return self.analogies.get(concept, {}).get("detailed", "")
    
    def add_emotional_support(self, response_type="general"):
        """Adiciona frase de apoio emocional apropriada"""
        if response_type in self.emotional_support:
            import random
            return random.choice(self.emotional_support[response_type])
        return random.choice(self.emotional_support["encouragement"])

# Instância global para uso no sistema
ga_enhanced = GaEnhanced()

def get_enhanced_ga_prompt(user_question):
    """
    Função principal para obter prompt otimizado do Gá
    """
    return ga_enhanced.get_enhanced_prompt(user_question)

def validate_ga_response(response, user_question):
    """
    Função para validar qualidade empática da resposta do Gá
    """
    return ga_enhanced.validate_response_empathy(response, user_question)

def translate_technical_term(term):
    """
    Função para traduzir termo técnico para linguagem cotidiana
    """
    return ga_enhanced.get_translation_for_term(term)

# Testes do sistema
if __name__ == "__main__":
    print("TESTANDO SISTEMA GÁ OTIMIZADO...")
    
    # Casos de teste
    test_cases = [
        "O que é poliquimioterapia?",
        "Por que meu xixi ficou laranja?",
        "Posso parar o tratamento se me sentir melhor?",
        "Quais são os efeitos adversos da rifampicina?"
    ]
    
    for question in test_cases:
        print(f"\n--- TESTANDO: {question} ---")
        
        # Gerar prompt otimizado
        prompt = get_enhanced_ga_prompt(question)
        print(f"Prompt gerado: {len(prompt)} caracteres")
        
        # Testar traduções
        technical_terms = ["poliquimioterapia", "rifampicina", "efeitos adversos"]
        for term in technical_terms:
            if term in question.lower():
                translation = translate_technical_term(term)
                print(f"Traducao '{term}' -> '{translation}'")
        
        print("-" * 50)