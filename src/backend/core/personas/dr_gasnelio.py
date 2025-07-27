# -*- coding: utf-8 -*-
"""
Sistema Integrado Dr. Gasnelio - Persona Técnica Otimizada
Combina validação farmacológica com sistema de personas

Desenvolvido por: Engenheiro de Prompts Farmacêuticos Especializados
Data: 2025-01-27
Versão: 2.0
"""

try:
    from .personas import get_persona_prompt
    from ..prompts.dr_gasnelio_technical_prompt import DrGasnelioTechnicalPrompt
except ImportError:
    # Para execução standalone
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from personas import get_persona_prompt
    from prompts.dr_gasnelio_technical_prompt import DrGasnelioTechnicalPrompt
import json
import re

class DrGasnelioEnhanced:
    """
    Sistema integrado que combina:
    - Prompts técnicos especializados 
    - Validação farmacológica automática
    - Sistema de citações obrigatórias
    - Detecção de limitações de escopo
    """
    
    def __init__(self):
        self.technical_system = DrGasnelioTechnicalPrompt()
        self.persona_id = "dr_gasnelio"
        
        # Categorias de consultas para prompts específicos
        self.query_categories = {
            "dosing": ["dose", "dosagem", "mg", "administra", "quanto", "frequência"],
            "safety": ["efeito", "adverso", "reação", "segurança", "risco", "perigo"],
            "interaction": ["interação", "combina", "junto", "mistura", "outro medicamento"],
            "procedure": ["como", "procedimento", "etapa", "roteiro", "dispensação"]
        }
        
        # Medicamentos do escopo PQT-U
        self.pqt_medications = ["rifampicina", "clofazimina", "dapsona"]
        
    def categorize_query(self, user_question):
        """Categoriza a pergunta do usuário para aplicar prompt específico"""
        question_lower = user_question.lower()
        
        for category, keywords in self.query_categories.items():
            if any(keyword in question_lower for keyword in keywords):
                return category
        
        return "general"
    
    def is_within_scope(self, user_question):
        """Verifica se a pergunta está dentro do escopo da tese PQT-U"""
        question_lower = user_question.lower()
        
        # Palavras-chave que indicam escopo válido
        valid_keywords = [
            "hansen", "pqt", "rifampicina", "clofazimina", "dapsona",
            "dispensação", "farmácia", "roteiro", "poliquimioterapia"
        ]
        
        # Palavras-chave que indicam escopo inválido
        invalid_keywords = [
            "covid", "diabetes", "hipertensão", "cancer", "aids", "tuberculose",
            "dengue", "malaria", "zika", "gripe", "pneumonia"
        ]
        
        # Verifica se há palavras inválidas
        if any(keyword in question_lower for keyword in invalid_keywords):
            return False
            
        # Verifica se há palavras válidas OU se menciona medicamentos PQT-U
        has_valid_keywords = any(keyword in question_lower for keyword in valid_keywords)
        has_pqt_medications = any(med in question_lower for med in self.pqt_medications)
        
        return has_valid_keywords or has_pqt_medications
    
    def create_enhanced_prompt(self, user_question):
        """
        Cria prompt otimizado baseado na categoria da pergunta
        """
        # Verificar escopo
        if not self.is_within_scope(user_question):
            return self._create_limitation_prompt(user_question)
        
        # Categorizar consulta
        query_category = self.categorize_query(user_question)
        
        # Buscar prompt base da persona
        base_prompt = get_persona_prompt(self.persona_id)
        
        # Criar prompt específico usando o sistema técnico
        if query_category in ["dosing", "safety", "interaction", "procedure"]:
            specific_prompt = self.technical_system.create_context_specific_prompt(
                f"{query_category}_queries", 
                user_question
            )
        else:
            specific_prompt = base_prompt + f"\n\nPERGUNTA: {user_question}\n\nResponda seguindo rigorosamente o formato técnico estruturado."
        
        return specific_prompt
    
    def _create_limitation_prompt(self, user_question):
        """Cria prompt para resposta de limitação de escopo"""
        return f"""
Você é o Dr. Gasnelio, farmacêutico clínico especialista em hanseníase PQT-U.

A pergunta recebida: "{user_question}"

Esta questão está FORA DO ESCOPO da sua base de conhecimento específica sobre dispensação de PQT-U para hanseníase.

RESPONDA EXATAMENTE ASSIM:

[LIMITAÇÃO DE ESCOPO]
Esta questão está fora do escopo da minha base de conhecimento específica sobre dispensação de PQT-U para hanseníase. 

[ORIENTAÇÃO PROFISSIONAL]
Minha expertise se concentra exclusivamente em:
- Poliquimioterapia única (PQT-U) para hanseníase
- Roteiro de dispensação farmacêutica para hanseníase
- Farmácovigilância específica dos medicamentos rifampicina, clofazimina e dapsona no contexto da hanseníase

[RECOMENDAÇÃO]
Para essa questão, recomendo consultar:
- Literatura médica especializada na área específica
- Profissional especialista na condição mencionada
- Protocolos clínicos oficiais do Ministério da Saúde para a condição em questão

Mantenho-me à disposição para questões relacionadas ao meu campo de especialização em hanseníase PQT-U.
"""
    
    def validate_response_quality(self, response, user_question):
        """
        Valida a qualidade da resposta baseado nos critérios técnicos
        """
        # Usar validação do sistema técnico
        validation_results = self.technical_system.validate_response_format(response)
        
        # Validações adicionais específicas
        additional_validations = {
            "has_thesis_reference": "tese" in response.lower() and "seção" in response.lower(),
            "mentions_pqt_medications": any(med in response.lower() for med in self.pqt_medications),
            "appropriate_scope": self.is_within_scope(user_question),
            "professional_tone": not any(informal in response.lower() for informal in ["oi", "tchau", "beleza", "massa"])
        }
        
        # Combinar validações
        all_validations = {**validation_results, **additional_validations}
        
        # Calcular score de qualidade
        total_checks = len(all_validations)
        passed_checks = sum(1 for passed in all_validations.values() if passed)
        quality_score = (passed_checks / total_checks) * 100
        
        return {
            "quality_score": quality_score,
            "validations": all_validations,
            "recommendations": self._generate_improvement_recommendations(all_validations)
        }
    
    def _generate_improvement_recommendations(self, validations):
        """Gera recomendações de melhoria baseado nas validações"""
        recommendations = []
        
        if not validations.get("format_valid", True):
            recommendations.append("Incluir seções obrigatórias: [RESPOSTA TÉCNICA], [PROTOCOLO/REFERÊNCIA], [VALIDAÇÃO FARMACOLÓGICA]")
        
        if not validations.get("has_citations", True):
            recommendations.append("Adicionar citações específicas da tese com seções numeradas")
        
        if not validations.get("has_thesis_reference", True):
            recommendations.append("Referenciar explicitamente a tese de doutorado como fonte")
        
        if not validations.get("mentions_pqt_medications", True):
            recommendations.append("Mencionar medicamentos PQT-U relevantes quando aplicável")
        
        if not validations.get("professional_tone", True):
            recommendations.append("Manter tom técnico e profissional, evitar linguagem coloquial")
        
        return recommendations

# Instância global para uso no sistema
dr_gasnelio_enhanced = DrGasnelioEnhanced()

def get_enhanced_dr_gasnelio_prompt(user_question):
    """
    Função principal para obter prompt otimizado do Dr. Gasnelio
    
    Args:
        user_question (str): Pergunta do usuário
        
    Returns:
        str: Prompt otimizado baseado na pergunta
    """
    return dr_gasnelio_enhanced.create_enhanced_prompt(user_question)

def validate_dr_gasnelio_response(response, user_question):
    """
    Função para validar qualidade da resposta do Dr. Gasnelio
    
    Args:
        response (str): Resposta gerada
        user_question (str): Pergunta original
        
    Returns:
        dict: Resultado da validação com score e recomendações
    """
    return dr_gasnelio_enhanced.validate_response_quality(response, user_question)

# Testes de integração
if __name__ == "__main__":
    print("TESTANDO SISTEMA DR. GASNELIO OTIMIZADO...")
    
    # Casos de teste
    test_cases = [
        "Qual a dose de rifampicina para adultos?",
        "Quais são os efeitos adversos da clofazimina?", 
        "Como tratar diabetes tipo 2?",  # Fora do escopo
        "Qual o procedimento de dispensação PQT-U?"
    ]
    
    for question in test_cases:
        print(f"\n--- TESTANDO: {question} ---")
        
        # Verificar escopo
        in_scope = dr_gasnelio_enhanced.is_within_scope(question)
        print(f"Dentro do escopo: {in_scope}")
        
        # Categorizar
        category = dr_gasnelio_enhanced.categorize_query(question)
        print(f"Categoria: {category}")
        
        # Gerar prompt
        prompt = get_enhanced_dr_gasnelio_prompt(question)
        print(f"Prompt gerado: {len(prompt)} caracteres")
        
        print("-" * 50)