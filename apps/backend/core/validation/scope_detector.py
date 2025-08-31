# -*- coding: utf-8 -*-
"""
Sistema de Detecção de Limitações de Escopo
Arquiteto de Sistemas de Conhecimento Especializado

Desenvolvido por: Arquiteto de Sistemas de Conhecimento Especializado
Data: 2025-01-27
Versão: 1.0
"""

import json
import re
from typing import Dict, List, Tuple, Optional
from pathlib import Path

class ScopeDetectionSystem:
    """
    Sistema inteligente para detectar se perguntas estão dentro ou fora
    do escopo da tese sobre hanseníase PQT-U
    """
    
    def __init__(self):
        self.knowledge_base_path = "../../data/structured_knowledge/knowledge_scope_limitations.json"
        self.scope_data = self._load_scope_data()
        
        # Palavras-chave para detecção rápida
        self.in_scope_keywords = [
            "hanseniase", "hansen", "pqt-u", "pqt", "poliquimioterapia",
            "rifampicina", "clofazimina", "dapsona",
            "dispensacao", "farmacia", "roteiro", "medicamento",
            "dose", "dosagem", "administracao", "supervisionada",
            "efeito adverso", "efeito colateral", "reacao",
            "interacao", "contraindicacao", "gravidez", "pediatrico"
        ]
        
        self.out_of_scope_indicators = [
            "diagnostico", "como saber se tenho", "sintomas",
            "exame clinico", "biopsia", "baciloscopia",
            "classificacao", "paucibacilar", "multibacilar",
            "reacao", "neurite", "corticoide", "prednisona",
            "talidomida", "cirurgia", "fisioterapia",
            "tuberculose", "outras doencas", "aposentadoria",
            "auxilio", "notificacao", "trabalho",
            "covid", "diabetes", "hipertensao", "cancer",
            "aids", "dengue", "malaria", "gripe"
        ]
        
        # Confiança por categoria
        self.confidence_levels = {
            "high": ["doses padrao", "esquema administracao", "efeitos adversos comuns"],
            "medium": ["variacoes populacionais", "manejo efeitos leves"],
            "low": ["casos atipicos", "situacoes nao abordadas"]
        }
        
    def _load_scope_data(self) -> dict:
        """Carrega dados de escopo do arquivo JSON"""
        try:
            # Tentar diferentes caminhos
            possible_paths = [
                "../../data/structured_knowledge/knowledge_scope_limitations.json",
                "../data/structured_knowledge/knowledge_scope_limitations.json",
                "data/structured_knowledge/knowledge_scope_limitations.json"
            ]
            
            for path in possible_paths:
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        return json.load(f)
                except FileNotFoundError:
                    continue
            
            # Se não encontrou arquivo, retorna estrutura básica
            return {"knowledge_scope_limitations": {"covered_topics": {}, "explicitly_not_covered": {}}}
        except Exception as e:
            print(f"Erro ao carregar scope data: {e}")
            return {"knowledge_scope_limitations": {"covered_topics": {}, "explicitly_not_covered": {}}}
    
    def detect_scope(self, user_question: str) -> Dict:
        """
        Detecta se a pergunta está dentro do escopo e retorna análise detalhada
        
        Returns:
            Dict com: is_in_scope, confidence_level, category, reasoning, redirect_suggestion
        """
        question_normalized = self._normalize_text(user_question)
        
        # Análise inicial de palavras-chave
        scope_analysis = self._analyze_keywords(question_normalized)
        
        # Análise de contexto
        context_analysis = self._analyze_context(question_normalized)
        
        # Análise de padrões específicos
        pattern_analysis = self._analyze_patterns(question_normalized)
        
        # Consolidar análises
        final_analysis = self._consolidate_analysis(
            scope_analysis, context_analysis, pattern_analysis
        )
        
        return final_analysis
    
    def _normalize_text(self, text: str) -> str:
        """Normaliza texto para análise"""
        # Converter para minúsculas
        text = text.lower()
        
        # Remover acentos básicos
        replacements = {
            'ã': 'a', 'á': 'a', 'à': 'a', 'â': 'a',
            'é': 'e', 'ê': 'e', 'è': 'e',
            'í': 'i', 'î': 'i', 'ì': 'i',
            'ó': 'o', 'ô': 'o', 'ò': 'o', 'õ': 'o',
            'ú': 'u', 'û': 'u', 'ù': 'u',
            'ç': 'c'
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Remover pontuação e caracteres especiais
        text = re.sub(r'[^\w\s]', ' ', text)
        
        return text
    
    def _analyze_keywords(self, question: str) -> Dict:
        """Analisa presença de palavras-chave"""
        in_scope_count = sum(1 for keyword in self.in_scope_keywords if keyword in question)
        out_scope_count = sum(1 for keyword in self.out_of_scope_indicators if keyword in question)
        
        total_words = len(question.split())
        in_scope_density = in_scope_count / max(total_words, 1)
        out_scope_density = out_scope_count / max(total_words, 1)
        
        return {
            "in_scope_keywords": in_scope_count,
            "out_scope_keywords": out_scope_count,
            "in_scope_density": in_scope_density,
            "out_scope_density": out_scope_density,
            "keyword_balance": in_scope_count - out_scope_count
        }
    
    def _analyze_context(self, question: str) -> Dict:
        """Analisa contexto da pergunta"""
        context_indicators = {
            "medication_query": any(med in question for med in ["rifampicina", "clofazimina", "dapsona", "medicamento", "remedio"]),
            "dosing_query": any(dose in question for dose in ["dose", "dosagem", "quanto", "como tomar", "administrar"]),
            "safety_query": any(safety in question for safety in ["efeito", "reacao", "seguro", "perigo", "problema"]),
            "procedure_query": any(proc in question for proc in ["dispensacao", "farmacia", "roteiro", "como fazer"]),
            "diagnosis_query": any(diag in question for diag in ["diagnostico", "como saber", "sintomas", "exame"]),
            "treatment_query": any(treat in question for treat in ["tratamento", "cura", "como tratar"]),
            "administrative_query": any(admin in question for admin in ["auxilio", "aposentadoria", "trabalho", "direitos"])
        }
        
        return context_indicators
    
    def _analyze_patterns(self, question: str) -> Dict:
        """Analisa padrões específicos da pergunta"""
        patterns = {
            "asks_for_diagnosis": bool(re.search(r'\b(como saber|tenho|sintomas|diagnostico)\b', question)),
            "asks_for_other_diseases": any(disease in question for disease in ["tuberculose", "diabetes", "covid", "cancer"]),
            "asks_for_legal_advice": any(legal in question for legal in ["direitos", "lei", "auxilio", "aposentadoria"]),
            "emergency_situation": any(emergency in question for emergency in ["urgente", "emergencia", "grave", "hospital"]),
            "medication_specific": any(med in question for med in ["rifampicina", "clofazimina", "dapsona"]),
            "hanseniase_specific": any(hans in question for hans in ["hanseniase", "hansen", "pqt"]),
            "asks_comparison": "ou" in question and ("melhor" in question or "diferenca" in question)
        }
        
        return patterns
    
    def _consolidate_analysis(self, scope_analysis: Dict, context_analysis: Dict, pattern_analysis: Dict) -> Dict:
        """Consolida todas as análises em decisão final"""
        
        # Calcular score de escopo
        scope_score = 0
        
        # Pontuação por palavras-chave
        scope_score += scope_analysis["keyword_balance"] * 2
        scope_score += scope_analysis["in_scope_density"] * 10
        scope_score -= scope_analysis["out_scope_density"] * 15
        
        # Pontuação por contexto
        if context_analysis["medication_query"]: scope_score += 5
        if context_analysis["dosing_query"]: scope_score += 5
        if context_analysis["safety_query"]: scope_score += 4
        if context_analysis["procedure_query"]: scope_score += 5
        if context_analysis["diagnosis_query"]: scope_score -= 8
        if context_analysis["administrative_query"]: scope_score -= 10
        
        # Pontuação por padrões
        if pattern_analysis["medication_specific"]: scope_score += 8
        if pattern_analysis["hanseniase_specific"]: scope_score += 6
        if pattern_analysis["asks_for_diagnosis"]: scope_score -= 10
        if pattern_analysis["asks_for_other_diseases"]: scope_score -= 12
        if pattern_analysis["asks_for_legal_advice"]: scope_score -= 15
        if pattern_analysis["emergency_situation"]: scope_score -= 5  # Precisa atenção médica
        
        # Determinar se está no escopo
        is_in_scope = scope_score > 0
        
        # Determinar nível de confiança
        confidence_level = "high" if scope_score > 8 else "medium" if scope_score > 3 else "low"
        
        # Determinar categoria
        category = self._determine_category(context_analysis, pattern_analysis, is_in_scope)
        
        # Gerar reasoning
        reasoning = self._generate_reasoning(scope_analysis, context_analysis, pattern_analysis, scope_score)
        
        # Sugestão de redirecionamento
        redirect_suggestion = self._get_redirect_suggestion(category, pattern_analysis)
        
        return {
            "is_in_scope": is_in_scope,
            "confidence_level": confidence_level,
            "category": category,
            "scope_score": scope_score,
            "reasoning": reasoning,
            "redirect_suggestion": redirect_suggestion,
            "detailed_analysis": {
                "scope_analysis": scope_analysis,
                "context_analysis": context_analysis,
                "pattern_analysis": pattern_analysis
            }
        }
    
    def _determine_category(self, context: Dict, patterns: Dict, is_in_scope: bool) -> str:
        """Determina categoria da pergunta"""
        if not is_in_scope:
            if patterns["asks_for_diagnosis"]:
                return "diagnosis_request"
            elif patterns["asks_for_other_diseases"]:
                return "other_diseases"
            elif patterns["asks_for_legal_advice"]:
                return "administrative_legal"
            elif patterns["emergency_situation"]:
                return "emergency"
            else:
                return "out_of_scope_general"
        
        # Se está no escopo
        if context["medication_query"]:
            return "medication_inquiry"
        elif context["dosing_query"]:
            return "dosing_inquiry"
        elif context["safety_query"]:
            return "safety_inquiry"
        elif context["procedure_query"]:
            return "procedure_inquiry"
        else:
            return "general_hanseniase"
    
    def _generate_reasoning(self, scope: Dict, context: Dict, patterns: Dict, score: int) -> str:
        """Gera explicação do raciocínio da análise"""
        reasons = []
        
        if scope["in_scope_keywords"] > 0:
            reasons.append(f"Encontradas {scope['in_scope_keywords']} palavras-chave do escopo")
        
        if scope["out_scope_keywords"] > 0:
            reasons.append(f"Encontradas {scope['out_scope_keywords']} palavras-chave fora do escopo")
        
        if patterns["medication_specific"]:
            reasons.append("Pergunta específica sobre medicamentos PQT-U")
        
        if patterns["hanseniase_specific"]:
            reasons.append("Pergunta específica sobre hanseníase")
        
        if patterns["asks_for_diagnosis"]:
            reasons.append("Pergunta sobre diagnóstico (fora do escopo)")
        
        if patterns["asks_for_other_diseases"]:
            reasons.append("Pergunta sobre outras doenças (fora do escopo)")
        
        return f"Score: {score}. " + "; ".join(reasons)
    
    def _get_redirect_suggestion(self, category: str, patterns: Dict) -> Optional[str]:
        """Retorna sugestão de redirecionamento baseada na categoria"""
        redirects = {
            "diagnosis_request": "médico especialista em hanseníase ou dermatologista",
            "other_diseases": "médico especialista na condição específica mencionada",
            "administrative_legal": "assistente social ou órgão competente (INSS, Secretaria de Saúde)",
            "emergency": "atendimento médico imediato (hospital ou UPA)",
            "out_of_scope_general": "profissional de saúde apropriado",
            "medication_inquiry": None,  # Dentro do escopo
            "dosing_inquiry": None,      # Dentro do escopo
            "safety_inquiry": None,      # Dentro do escopo
            "procedure_inquiry": None,   # Dentro do escopo
            "general_hanseniase": None   # Dentro do escopo
        }
        
        return redirects.get(category)
    
    def get_limitation_response(self, persona: str, category: str, redirect_suggestion: Optional[str] = None) -> str:
        """
        Gera resposta de limitação personalizada por persona
        """
        if persona == "dr_gasnelio":
            return self._get_gasnelio_limitation_response(category, redirect_suggestion)
        elif persona == "ga":
            return self._get_ga_limitation_response(category, redirect_suggestion)
        else:
            return "Esta questão está fora do meu escopo de conhecimento."
    
    def _get_gasnelio_limitation_response(self, category: str, redirect: Optional[str]) -> str:
        """Resposta técnica profissional do Dr. Gasnelio"""
        responses = {
            "diagnosis_request": f"""
[LIMITAÇÃO DE ESCOPO]
Esta questão sobre diagnóstico está fora do escopo da minha base de conhecimento específica sobre dispensação de PQT-U para hanseníase.

[ORIENTAÇÃO PROFISSIONAL]
Minha expertise concentra-se exclusivamente nos aspectos farmacêuticos do esquema PQT-U: dosagens, administração, farmácovigilância e roteiro de dispensação.

[ENCAMINHAMENTO TÉCNICO]
Para questões diagnósticas, recomendo consulta com {redirect or 'médico especialista em hanseníase'}, que possui competência técnica para avaliação clínica adequada.
""",
            "other_diseases": f"""
[LIMITAÇÃO DE ESCOPO]
Esta questão está fora do escopo da tese de referência sobre dispensação de PQT-U para hanseníase.

[BASE DE CONHECIMENTO]
Minha expertise baseia-se exclusivamente na tese sobre roteiro de dispensação farmacêutica para hanseníase, não abrangendo outras condições clínicas.

[RECOMENDAÇÃO TÉCNICA]
Sugiro consultar literatura especializada na condição específica mencionada ou {redirect or 'profissional médico competente'}.
""",
            "administrative_legal": f"""
[LIMITAÇÃO DE COMPETÊNCIA]
Questões administrativas e legais estão fora do escopo da minha formação farmacêutica e da tese de referência.

[ENCAMINHAMENTO APROPRIADO]
Recomendo contatar {redirect or 'órgão competente (assistente social, INSS, Secretaria de Saúde)'} para orientações adequadas sobre direitos e benefícios.
""",
            "emergency": f"""
[SITUAÇÃO DE URGÊNCIA]
Esta situação requer avaliação médica imediata, estando fora do escopo de orientação farmacêutica.

[ORIENTAÇÃO IMEDIATA]
Procure {redirect or 'atendimento médico de urgência (hospital, UPA)'} sem demora para avaliação clínica adequada.
""",
            "out_of_scope_general": f"""
[LIMITAÇÃO DE ESCOPO]
Esta questão está fora do escopo da minha base de conhecimento sobre dispensação de PQT-U para hanseníase.

[ORIENTAÇÃO PROFISSIONAL]
Para informações precisas sobre este tópico, recomendo consultar {redirect or 'profissional de saúde especializado'} ou literatura científica específica.
"""
        }
        
        return responses.get(category, responses["out_of_scope_general"])
    
    def _get_ga_limitation_response(self, category: str, redirect: Optional[str]) -> str:
        """Resposta empática e acessível do Gá"""
        responses = {
            "diagnosis_request": f"""
[ACOLHIMENTO]
Oi! Entendo sua preocupação, mas essa pergunta sobre diagnóstico não é sobre os remédios que eu conheço bem! 😊

[EXPLICAÇÃO CARINHOSA]
Eu sou especialista nos remedinhos PQT-U para hanseníase (rifampicina, clofazimina e dapsona), mas para saber se você tem alguma doença, isso é com o médico mesmo!

[ORIENTAÇÃO GENTIL]
O ideal é você conversar com {redirect or 'um médico especialista em hanseníase'}. Eles sabem examinar e descobrir essas coisas direitinho! 🩺

[DISPONIBILIDADE]
Mas se você tiver dúvidas sobre os remédios do tratamento, aí sim eu posso te ajudar! 💙
""",
            "other_diseases": f"""
[ACOLHIMENTO]
Oi! Sobre essa questão, eu sou mais especialista em hanseníase e seus remedinhos mesmo! 😊

[EXPLICAÇÃO SIMPLES]
Meu conhecimento é todo focado nos medicamentos PQT-U (rifampicina, clofazimina e dapsona). Para outras doenças, não posso te ajudar porque não conheço bem.

[ORIENTAÇÃO CARINHOSA]
Para essa dúvida, é melhor você conversar com {redirect or 'um médico especialista na área'}. Eles vão saber te orientar certinho! [STAR]

[APOIO CONTÍNUO]
Mas qualquer coisa sobre hanseníase e os remedinhos, estou aqui! 💪
""",
            "administrative_legal": f"""
[COMPREENSÃO]
Entendo que essas questões são importantes, mas não é minha área de conhecimento! 😌

[EXPLICAÇÃO HONESTA]
Eu sou farmacêutico e conheço bem os remedinhos, mas sobre direitos, auxílios e essas coisas legais, não posso te ajudar.

[DIRECIONAMENTO GENTIL]
Para isso, você precisa falar com {redirect or 'assistente social ou no INSS'}. Eles sabem tudo sobre esses assuntos! [LIST]

[DISPONIBILIDADE]
Mas se precisar saber sobre os medicamentos, estarei aqui! 😊
""",
            "emergency": f"""
[PREOCUPAÇÃO GENUÍNA]
Nossa, essa situação parece ser urgente! 😰

[ORIENTAÇÃO CLARA]
Para isso você precisa de ajuda médica rápida, não posso te orientar sobre emergências!

[DIRECIONAMENTO URGENTE]
Procure {redirect or 'um hospital ou UPA'} agora mesmo, tá? Não espere! 🏥

[CUIDADO]
Sua saúde é o mais importante! Corre lá buscar ajuda! 💙
""",
            "out_of_scope_general": f"""
[ACOLHIMENTO]
Oi! Sobre essa pergunta, não é bem minha especialidade! 😊

[EXPLICAÇÃO CARINHOSA]
Eu conheço muito bem os remedinhos para hanseníase, mas sobre isso não posso te ajudar direito.

[ORIENTAÇÃO GENTIL]
O melhor é você conversar com {redirect or 'alguém que entende dessa área'}. Assim você vai ter uma resposta certinha! ✨

[DISPONIBILIDADE]
Mas qualquer dúvida sobre hanseníase e medicamentos, pode perguntar! 💙
"""
        }
        
        return responses.get(category, responses["out_of_scope_general"])

# Instância global
scope_detector = ScopeDetectionSystem()

def detect_question_scope(question: str) -> Dict:
    """Função principal para detectar escopo de pergunta"""
    return scope_detector.detect_scope(question)

def get_limitation_response(persona: str, question: str) -> Optional[str]:
    """Função principal para obter resposta de limitação"""
    analysis = detect_question_scope(question)
    
    if analysis["is_in_scope"]:
        return None  # Não precisa de resposta de limitação
    
    return scope_detector.get_limitation_response(
        persona, 
        analysis["category"], 
        analysis["redirect_suggestion"]
    )

# Testes do sistema
if __name__ == "__main__":
    print("TESTANDO SISTEMA DE DETECÇÃO DE ESCOPO...")
    
    test_cases = [
        # Dentro do escopo
        "Qual a dose de rifampicina para adultos?",
        "Posso tomar clofazimina na gravidez?", 
        "Como fazer a dispensação PQT-U?",
        
        # Fora do escopo
        "Como saber se tenho hanseníase?",
        "Tenho diabetes, posso tomar esses remédios?",
        "Tenho direito a auxílio por ter hanseníase?",
        "Estou com dor forte, é urgente!",
        
        # Casos limites
        "Rifampicina serve para tuberculose?",
        "Posso parar o tratamento se melhorar?"
    ]
    
    for question in test_cases:
        print(f"\n--- TESTANDO: {question} ---")
        analysis = detect_question_scope(question)
        
        print(f"No escopo: {analysis['is_in_scope']}")
        print(f"Categoria: {analysis['category']}")
        print(f"Confiança: {analysis['confidence_level']}")
        print(f"Score: {analysis['scope_score']}")
        print(f"Raciocínio: {analysis['reasoning']}")
        
        if analysis['redirect_suggestion']:
            print(f"Redirecionar para: {analysis['redirect_suggestion']}")
        
        if not analysis['is_in_scope']:
            # Testar respostas de limitação
            gasnelio_response = scope_detector.get_limitation_response("dr_gasnelio", analysis['category'], analysis['redirect_suggestion'])
            ga_response = scope_detector.get_limitation_response("ga", analysis['category'], analysis['redirect_suggestion'])
            
            # Usar as respostas para verificar que foram geradas corretamente
            if gasnelio_response:
                print(f"\nResposta Dr. Gasnelio: Gerada com sucesso ({len(gasnelio_response)} caracteres)")
            if ga_response:
                print(f"Resposta Ga: Gerada com sucesso ({len(ga_response)} caracteres)")
        
        print("-" * 50)