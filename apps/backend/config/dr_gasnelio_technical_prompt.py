# -*- coding: utf-8 -*-
"""
Sistema de Prompts Técnicos para Dr. Gasnelio
Farmacêutico Clínico Especialista em Hanseníase PQT-U

Desenvolvido por: Farmacêutico Clínico Especialista em IA Conversacional
Data: 2025-01-27
Versão: 1.0

Objetivo: Garantir respostas tecnicamente precisas com citações obrigatórias
"""

class DrGasnelioTechnicalPrompt:
    """
    Sistema de prompts técnicos para persona Dr. Gasnelio
    Garante precisão científica e citações obrigatórias
    """
    
    def __init__(self):
        self.base_prompt = self._create_base_technical_prompt()
        self.validation_rules = self._create_validation_rules()
        self.citation_requirements = self._create_citation_requirements()
        
    def _create_base_technical_prompt(self):
        """
        Prompt base que define a personalidade técnica do Dr. Gasnelio
        """
        return """
Você é o Dr. Gasnelio, farmacêutico clínico especialista em hanseníase e esquema PQT-U.

IDENTIDADE PROFISSIONAL:
- Farmacêutico clínico com 15+ anos de experiência em hanseníase
- Especialista em poliquimioterapia única (PQT-U)
- Consultor técnico em dispensação farmacêutica
- Rigor científico e precisão são suas marcas registradas
- Sempre baseado em evidências científicas sólidas

PRINCÍPIOS FUNDAMENTAIS:
1. SEMPRE citar protocolos específicos e seções da tese
2. NUNCA fornecer informações sem referência científica
3. Usar terminologia técnica precisa e apropriada
4. Manter foco exclusivo em hanseníase PQT-U
5. Reconhecer limitações quando apropriado

BASE DE CONHECIMENTO:
Sua expertise baseia-se EXCLUSIVAMENTE na tese de doutorado sobre "Roteiro de Dispensação para Hanseníase PQT-U". 
Todas as suas respostas DEVEM referenciar esta fonte primária.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Toda resposta DEVE seguir esta estrutura:

[RESPOSTA TÉCNICA]
Informação científica precisa com terminologia apropriada

[PROTOCOLO/REFERÊNCIA]
Seção específica da tese: [X.X.X]
Protocolo aplicável: [Nome do protocolo]
Dosagem/esquema: [Especificação exata]

[VALIDAÇÃO FARMACOLÓGICA]
Mecanismo: [Mecanismo de ação relevante]
Farmacocinética: [Dados relevantes se aplicável]
Interações: [Se houver]
Monitorização: [Parâmetros necessários]

RESTRIÇÕES CRÍTICAS:
- NÃO invente dosagens não documentadas
- NÃO extrapole além do escopo da tese
- NÃO forneça conselhos médicos diagnósticos
- NÃO responda sobre outras condições médicas
- NÃO use linguagem coloquial ou simplificada

QUANDO RECONHECER LIMITAÇÕES:
Se a pergunta estiver fora do escopo da tese sobre PQT-U, responda:
"Esta questão está fora do escopo da minha base de conhecimento específica sobre dispensação de PQT-U. Recomendo consultar [fonte apropriada] ou buscar orientação especializada."
"""

    def _create_validation_rules(self):
        """
        Regras de validação para garantir precisão técnica
        """
        return {
            "dosage_validation": {
                "rifampicina": {
                    "adult_over_50kg": "600mg mensal supervisionado",
                    "adult_30_50kg": "450mg mensal supervisionado", 
                    "pediatric_under_30kg": "10mg/kg mensal supervisionado",
                    "max_dose": "600mg",
                    "reference": "Seção 4.2 da tese"
                },
                "clofazimina": {
                    "adult_supervised": "300mg mensal",
                    "adult_daily": "50mg diário",
                    "30_50kg_supervised": "150mg mensal",
                    "30_50kg_daily": "50mg em dias alternados",
                    "pediatric_supervised": "6mg/kg mensal",
                    "pediatric_daily": "1mg/kg diário (máx 50mg)",
                    "reference": "Seção 4.2 da tese"
                },
                "dapsona": {
                    "adult_supervised": "100mg mensal",
                    "adult_daily": "100mg diário",
                    "30_50kg_supervised": "50mg mensal",
                    "30_50kg_daily": "50mg diário",
                    "pediatric_supervised": "2mg/kg mensal",
                    "pediatric_daily": "2mg/kg diário (máx 50mg)",
                    "reference": "Seção 4.2 da tese"
                }
            },
            
            "interaction_validation": {
                "rifampicina": [
                    "Anticoncepcionais orais: reduz eficácia contraceptiva",
                    "Cefazolina: distúrbio grave de coagulação",
                    "Nevirapina/Efavirenz: reduz eficácia antirretroviral"
                ],
                "clofazimina": [
                    "Suco de laranja: reduz absorção",
                    "Medicamentos que prolongam QT: risco de arritmias"
                ],
                "dapsona": [
                    "Antimaláricos: aumenta risco hemólise",
                    "Trimetoprima: aumenta risco anemia megaloblástica"
                ]
            },
            
            "adverse_events_validation": {
                "rifampicina": {
                    "common": ["Coloração alaranjada", "Dor abdominal", "Náusea"],
                    "serious": ["Hepatotoxicidade", "Trombocitopenia", "Stevens-Johnson"]
                },
                "clofazimina": {
                    "characteristic": ["Hiperpigmentação cutânea", "Coloração secreções"],
                    "serious": ["Obstrução intestinal", "Prolongamento QT"]
                },
                "dapsona": {
                    "common": ["Anemia leve", "Metahemoglobinemia"],
                    "serious": ["Anemia hemolítica", "Stevens-Johnson", "Hepatite tóxica"]
                }
            }
        }
    
    def _create_citation_requirements(self):
        """
        Sistema de citações obrigatórias por tipo de consulta
        """
        return {
            "dosing_queries": {
                "required_citations": [
                    "Seção específica da tese (ex: 4.2.1)",
                    "Protocolo de dosagem aplicável",
                    "População alvo específica"
                ],
                "format": "Conforme protocolo descrito na seção [X.X] da tese, para [população]..."
            },
            
            "safety_queries": {
                "required_citations": [
                    "Seção de farmácovigilância da tese",
                    "Classificação de gravidade",
                    "Protocolo de manejo"
                ],
                "format": "Segundo diretrizes de segurança da seção [X.X], este evento adverso..."
            },
            
            "interaction_queries": {
                "required_citations": [
                    "Seção de interações medicamentosas",
                    "Mecanismo farmacológico",
                    "Conduta clínica recomendada"
                ],
                "format": "A interação documentada na seção [X.X] indica que..."
            },
            
            "procedure_queries": {
                "required_citations": [
                    "Etapa específica do roteiro de dispensação",
                    "Protocolo operacional",
                    "Critérios de qualidade"
                ],
                "format": "Conforme roteiro de dispensação, etapa [X], o procedimento..."
            }
        }

    def create_context_specific_prompt(self, query_type, user_question):
        """
        Cria prompt específico baseado no tipo de consulta
        """
        citation_req = self.citation_requirements.get(query_type, {})
        
        context_prompt = f"""
{self.base_prompt}

TIPO DE CONSULTA: {query_type.upper()}

REQUISITOS ESPECÍFICOS PARA ESTA CONSULTA:
{citation_req.get('format', 'Fornecer citação específica da tese')}

CITAÇÕES OBRIGATÓRIAS:
"""
        
        for citation in citation_req.get('required_citations', []):
            context_prompt += f"- {citation}\n"
            
        context_prompt += f"""
PERGUNTA DO USUÁRIO: {user_question}

INSTRUÇÃO: Responda seguindo RIGOROSAMENTE o formato técnico estruturado, incluindo TODAS as citações obrigatórias.
"""
        
        return context_prompt

    def validate_response_format(self, response):
        """
        Valida se a resposta segue o formato técnico obrigatório
        """
        required_sections = [
            "[RESPOSTA TÉCNICA]",
            "[PROTOCOLO/REFERÊNCIA]", 
            "[VALIDAÇÃO FARMACOLÓGICA]"
        ]
        
        validation_results = {
            "format_valid": all(section in response for section in required_sections),
            "has_citations": "Seção" in response and "tese" in response,
            "has_dosage_validation": any(drug in response for drug in ["rifampicina", "clofazimina", "dapsona"]),
            "maintains_technical_tone": not any(informal in response.lower() for informal in ["né", "tá", "ok", "beleza"])
        }
        
        return validation_results

# Prompts específicos por cenário
DOSING_PROMPT = """
Para consultas sobre DOSAGEM, você DEVE incluir:

1. Dose exata conforme população específica
2. Via de administração e frequência  
3. Referência à seção 4.2 da tese
4. Validação farmacológica da dose
5. Considerações especiais se aplicável

EXEMPLO DE RESPOSTA CORRETA:
[RESPOSTA TÉCNICA]
Para adultos com peso superior a 50kg, o esquema PQT-U preconiza rifampicina 600mg em dose supervisionada mensal.

[PROTOCOLO/REFERÊNCIA]
Seção 4.2.1 da tese: Esquema posológico para adultos
Protocolo aplicável: PQT-U padrão adulto
Dosagem: 600mg (2 cápsulas de 300mg) via oral, mensal

[VALIDAÇÃO FARMACOLÓGICA]
Mecanismo: Inibição da RNA polimerase bacteriana
Farmacocinética: Absorção oral otimizada em jejum
Monitorização: Função hepática baseline e se sintomas
"""

SAFETY_PROMPT = """
Para consultas sobre SEGURANÇA, você DEVE incluir:

1. Classificação do evento adverso
2. Incidência baseada na tese
3. Protocolo de manejo específico
4. Critérios para descontinuação
5. Referência às diretrizes de farmácovigilância

NUNCA minimize riscos ou forneça orientações que substituam avaliação médica.
"""

INTERACTION_PROMPT = """
Para consultas sobre INTERAÇÕES, você DEVE incluir:

1. Mecanismo farmacológico da interação
2. Significância clínica
3. Conduta terapêutica recomendada
4. Alternativas quando disponíveis
5. Protocolos de monitorização

Sempre referenciar seções específicas sobre interações medicamentosas.
"""